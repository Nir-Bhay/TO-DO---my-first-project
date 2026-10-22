import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_DIR = "/tmp/velora-audio-src";
const OUT_DIR = path.resolve(__dirname, "../public/audio");
const FFMPEG = path.resolve(
  __dirname,
  "../node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
);

fs.mkdirSync(SRC_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const SAMPLE_RATE = 44100;

const DOWNLOADS = [
  ["bgm-tech-house.mp3", "assets/audio/bgm/bgm-tech-house.mp3"],
  ["house-vibez.mp3", "assets/audio/bgm/house-vibez.mp3"],
  ["click-camera.mp3", "assets/audio/sfx/camera/click-camera.mp3"],
  ["camera-shutter-hard.mp3", "assets/audio/sfx/camera/camera-shutter-hard.mp3"],
  ["transition-snap.mp3", "assets/audio/sfx/transition/transition-snap.mp3"],
  ["swoosh-quick.mp3", "assets/audio/sfx/transition/swoosh-quick.mp3"],
  ["whoosh-fast.mp3", "assets/audio/sfx/transition/whoosh-fast.mp3"],
  ["impact-zoom-quick.mp3", "assets/audio/sfx/impact/impact-zoom-quick.mp3"],
  ["impact-deep-whoosh.mp3", "assets/audio/sfx/impact/impact-deep-whoosh.mp3"],
  ["bass-hit-short.mp3", "assets/audio/sfx/impact/bass-hit-short.mp3"],
  ["shimmer-sparkle-sweep.mp3", "assets/audio/sfx/light/shimmer-sparkle-sweep.mp3"]
];

for (const [localName, remotePath] of DOWNLOADS) {
  const dest = path.join(SRC_DIR, localName);
  if (!fs.existsSync(dest) || fs.statSync(dest).size < 1024) {
    console.log(`Downloading ${remotePath} -> /tmp/velora-audio-src/${localName}`);
    const raw = execFileSync(
      "gh",
      ["api", `repos/Vincentwei1021/video-shotcraft/contents/${remotePath}`, "-H", "Accept: application/vnd.github.raw"],
      { maxBuffer: 32 * 1024 * 1024 }
    );
    fs.writeFileSync(dest, raw);
  }
}

function decodeStereoFloat(mp3Path) {
  const wavTmp = `${mp3Path}.tmp.wav`;
  execFileSync(
    FFMPEG,
    ["-y", "-v", "error", "-i", mp3Path, "-ac", "2", "-ar", String(SAMPLE_RATE), "-f", "wav", wavTmp]
  );
  const buf = fs.readFileSync(wavTmp);
  fs.unlinkSync(wavTmp);

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const sz = buf.readUInt32LE(offset + 4);
    if (id === "data") {
      const start = offset + 8;
      const frames = Math.floor(sz / 4);
      const L = new Float32Array(frames);
      const R = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        L[i] = buf.readInt16LE(start + i * 4) / 32768;
        R[i] = buf.readInt16LE(start + i * 4 + 2) / 32768;
      }
      return { L, R };
    }
    offset += 8 + sz + (sz % 2);
  }
  throw new Error(`Invalid WAV decoded from ${mp3Path}`);
}

function resampleStereo({ L, R }, speedFactor) {
  const outLen = Math.floor(L.length / speedFactor);
  const outL = new Float32Array(outLen);
  const outR = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const srcPos = i * speedFactor;
    const i0 = Math.floor(srcPos);
    const i1 = Math.min(L.length - 1, i0 + 1);
    const frac = srcPos - i0;
    outL[i] = L[i0] * (1 - frac) + L[i1] * frac;
    outR[i] = R[i0] * (1 - frac) + R[i1] * frac;
  }
  return { L: outL, R: outR };
}

function trimLeadingSilence({ L, R }, threshold = 0.025, maxDurSec = 1.25) {
  let start = 0;
  for (let i = 0; i < L.length; i++) {
    if (Math.max(Math.abs(L[i]), Math.abs(R[i])) >= threshold) {
      start = Math.max(0, i - Math.floor(0.004 * SAMPLE_RATE));
      break;
    }
  }
  const len = Math.min(L.length - start, Math.floor(maxDurSec * SAMPLE_RATE));
  const outL = L.slice(start, start + len);
  const outR = R.slice(start, start + len);
  const fadeSamples = Math.min(Math.floor(0.08 * SAMPLE_RATE), Math.floor(len * 0.25));
  for (let i = 0; i < fadeSamples; i++) {
    const g = i / fadeSamples;
    outL[len - 1 - i] *= g;
    outR[len - 1 - i] *= g;
  }
  return { L: outL, R: outR };
}

function mixStems(a, gainA, b, gainB) {
  const len = Math.max(a.L.length, b.L.length);
  const L = new Float32Array(len);
  const R = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    L[i] = (i < a.L.length ? a.L[i] * gainA : 0) + (i < b.L.length ? b.L[i] * gainB : 0);
    R[i] = (i < a.R.length ? a.R[i] * gainA : 0) + (i < b.R.length ? b.R[i] * gainB : 0);
  }
  return { L, R };
}

function writeM4a(filename, { L, R }, normalizePeak = 0.9) {
  let peak = 0.0001;
  for (let i = 0; i < L.length; i++) {
    const m = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (m > peak) peak = m;
  }
  const scale = normalizePeak / peak;
  const numFrames = L.length;
  const dataBytes = numFrames * 4;
  const wavBuf = Buffer.alloc(44 + dataBytes);

  wavBuf.write("RIFF", 0);
  wavBuf.writeUInt32LE(36 + dataBytes, 4);
  wavBuf.write("WAVE", 8);
  wavBuf.write("fmt ", 12);
  wavBuf.writeUInt32LE(16, 16);
  wavBuf.writeUInt16LE(1, 20);
  wavBuf.writeUInt16LE(2, 22);
  wavBuf.writeUInt32LE(SAMPLE_RATE, 24);
  wavBuf.writeUInt32LE(SAMPLE_RATE * 4, 28);
  wavBuf.writeUInt16LE(4, 32);
  wavBuf.writeUInt16LE(16, 34);
  wavBuf.write("data", 36);
  wavBuf.writeUInt32LE(dataBytes, 40);

  for (let i = 0; i < numFrames; i++) {
    const l = Math.max(-1, Math.min(1, L[i] * scale));
    const r = Math.max(-1, Math.min(1, R[i] * scale));
    wavBuf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    wavBuf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
  }

  const outPath = path.join(OUT_DIR, filename);
  const res = spawnSync(
    FFMPEG,
    ["-y", "-v", "error", "-f", "wav", "-i", "pipe:0", "-f", "mp4", "-c:a", "aac", "-b:a", "192k", outPath],
    { input: wavBuf, maxBuffer: 64 * 1024 * 1024 }
  );
  if (res.status !== 0) {
    throw new Error(`ffmpeg m4a encode failed: ${res.stderr?.toString()}`);
  }
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Wrote ${filename} (${(numFrames / SAMPLE_RATE).toFixed(3)}s, ${kb} KB)`);
}

// 1. Exact 120.000 BPM 24.000s Tech-House Master Bed
const rawBgm = decodeStereoFloat(path.join(SRC_DIR, "bgm-tech-house.mp3"));
const bgm120 = resampleStereo(rawBgm, 123.99 / 120.0);

const dropSample120 = Math.round((15.71 / (123.99 / 120.0)) * SAMPLE_RATE);
const bedStart = dropSample120 - Math.round(4.0 * SAMPLE_RATE);
const bedLen = Math.round(24.0 * SAMPLE_RATE);

const bedL = new Float32Array(bedLen);
const bedR = new Float32Array(bedLen);
for (let i = 0; i < bedLen; i++) {
  const s = (bedStart + i) % bgm120.L.length;
  const fadeIn = Math.min(1, i / (0.12 * SAMPLE_RATE));
  const fadeOut = Math.min(1, (bedLen - 1 - i) / (1.35 * SAMPLE_RATE));
  const preDropBuild = i >= 3.55 * SAMPLE_RATE && i < 4.0 * SAMPLE_RATE ? 0.86 : 1.0;
  const g = fadeIn * fadeOut * preDropBuild;
  bedL[i] = bgm120.L[s] * g;
  bedR[i] = bgm120.R[s] * g;
}
writeM4a("music-bed.m4a", { L: bedL, R: bedR }, 0.84);

// 2. Sample-Accurate Studio Foley Stems
const clickCam = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "click-camera.mp3")), 0.03, 0.35);
const shutter = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "camera-shutter-hard.mp3")), 0.03, 0.45);
const snap = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "transition-snap.mp3")), 0.03, 0.42);
const swoosh = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "swoosh-quick.mp3")), 0.02, 0.48);
const whooshFast = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "whoosh-fast.mp3")), 0.02, 0.52);
const impactZoom = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "impact-zoom-quick.mp3")), 0.025, 0.65);
const deepWhoosh = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "impact-deep-whoosh.mp3")), 0.02, 0.9);
const bassHit = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "bass-hit-short.mp3")), 0.03, 0.75);
const sparkle = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "shimmer-sparkle-sweep.mp3")), 0.015, 1.15);

writeM4a("sfx-click.m4a", clickCam, 0.9);
writeM4a("sfx-shutter.m4a", shutter, 0.88);
writeM4a("sfx-snap.m4a", snap, 0.88);
writeM4a("sfx-whip.m4a", mixStems(whooshFast, 0.72, swoosh, 0.55), 0.9);
writeM4a("sfx-stomp.m4a", mixStems(bassHit, 0.78, impactZoom, 0.45), 0.92);
writeM4a("sfx-portal.m4a", mixStems(deepWhoosh, 0.8, sparkle, 0.42), 0.92);
writeM4a("sfx-sparkle.m4a", sparkle, 0.85);
