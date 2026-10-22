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

if (!fs.existsSync(path.join(SRC_DIR, "house-vibez.mp3")) || !fs.existsSync(path.join(SRC_DIR, "switch-tap.mp3"))) {
  execFileSync("bash", [
    "-lc",
    `rm -rf /tmp/vs-audio && git clone --depth=1 --filter=blob:none --sparse https://github.com/Vincentwei1021/video-shotcraft.git /tmp/vs-audio && git -C /tmp/vs-audio sparse-checkout set assets/audio && find /tmp/vs-audio/assets/audio -name "*.mp3" -exec cp {} ${SRC_DIR}/ \\; && rm -rf /tmp/vs-audio`
  ]);
}

function decodeStereoFloat(mp3Path) {
  const wavTmp = `${mp3Path}.tmp.wav`;
  execFileSync(FFMPEG, [
    "-y",
    "-v",
    "error",
    "-i",
    mp3Path,
    "-ac",
    "2",
    "-ar",
    String(SAMPLE_RATE),
    "-f",
    "wav",
    wavTmp
  ]);
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

// Measured FFT/onset analysis on house-vibez.mp3:
// First kick at t = 0.060s; exact measured interval = 0.491935s/beat = 121.967 BPM!
// Resampling by (121.967 / 120.000) sets EVERY kick interval to 0.50000s (30.00 frames @ 60fps)!
// Starting at Bar 30 (pre-drop build) places the Bar-32 FULL BASS DROP squarely at t = 4.000s (Frame 240)!
const MEASURED_BPM = 121.967;
const TARGET_BPM = 120.0;
const SPEED_FACTOR = MEASURED_BPM / TARGET_BPM;

const rawHouse = decodeStereoFloat(path.join(SRC_DIR, "house-vibez.mp3"));
// Trim the 0.060s leading offset first so sample 0 IS exact Kick #0!
const kickZeroOffset = Math.round(0.06 * SAMPLE_RATE);
const alignedRaw = {
  L: rawHouse.L.slice(kickZeroOffset),
  R: rawHouse.R.slice(kickZeroOffset)
};
const house120 = resampleStereo(alignedRaw, SPEED_FACTOR);

// Bar 30 = 30 * 4 * 0.5s = 60.000s -> 2 bars build (0..4.0s) -> FULL DROP AT 4.000s (Frame 240)!
const startSample = Math.round(60.0 * SAMPLE_RATE);
const bedLen = Math.round(28.0 * SAMPLE_RATE); // Exact 28.000s = 1,680 frames = 56 beats = 14 bars

const bedL = new Float32Array(bedLen);
const bedR = new Float32Array(bedLen);
for (let i = 0; i < bedLen; i++) {
  const s = (startSample + i) % house120.L.length;
  const fadeIn = Math.min(1, i / (0.06 * SAMPLE_RATE));
  const fadeOut = Math.min(1, (bedLen - 1 - i) / (1.35 * SAMPLE_RATE));
  const g = fadeIn * fadeOut;
  bedL[i] = house120.L[s] * g;
  bedR[i] = house120.R[s] * g;
}
writeM4a("music-bed.m4a", { L: bedL, R: bedR }, 0.86);

// Sample-accurate foley stems locked to the 30-frame beat grid
const clickCam = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "click-camera.mp3")), 0.03, 0.35);
const shutter = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "camera-shutter-hard.mp3")), 0.03, 0.45);
const snap = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "transition-snap.mp3")), 0.03, 0.42);
const swoosh = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "swoosh-quick.mp3")), 0.02, 0.44);
const whooshFast = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "whoosh-fast.mp3")), 0.02, 0.52);
const impactZoom = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "impact-zoom-quick.mp3")), 0.025, 0.65);
const deepWhoosh = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "impact-deep-whoosh.mp3")), 0.02, 0.9);
const bassHit = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "bass-hit-short.mp3")), 0.03, 0.75);
const sparkle = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "shimmer-sparkle-sweep.mp3")), 0.015, 1.15);
const switchTap = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "switch-tap.mp3")), 0.02, 0.28);
const popUi = trimLeadingSilence(decodeStereoFloat(path.join(SRC_DIR, "ui-message-pop.mp3")), 0.02, 0.36);

writeM4a("sfx-click.m4a", clickCam, 0.9);
writeM4a("sfx-tap.m4a", switchTap, 0.88);
writeM4a("sfx-pop.m4a", popUi, 0.88);
writeM4a("sfx-swoosh.m4a", swoosh, 0.82);
writeM4a("sfx-shutter.m4a", shutter, 0.88);
writeM4a("sfx-snap.m4a", snap, 0.88);
writeM4a("sfx-whip.m4a", mixStems(whooshFast, 0.72, swoosh, 0.55), 0.9);
writeM4a("sfx-stomp.m4a", mixStems(bassHit, 0.78, impactZoom, 0.45), 0.92);
writeM4a("sfx-portal.m4a", mixStems(deepWhoosh, 0.8, sparkle, 0.42), 0.92);
writeM4a("sfx-sparkle.m4a", sparkle, 0.85);
