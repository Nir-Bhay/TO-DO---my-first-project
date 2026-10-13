// samyoj-video/render.mjs
//
// The renderer. Canvas → ffmpeg, 60 fps, with real motion blur.
//
//   node render.mjs --stills 1,4,12,26,44,54     a few cuts to look at (PNG, fast to inspect)
//   node render.mjs --range 0 6                  six seconds, to test a change cheaply
//   node render.mjs                              the whole film → out/samyoj-launch-1080p60.mp4
//
//   --sub 1   no motion blur, ~4× faster (a draft)
//   --sub 4   the hero pass (default)
//   --remux   re-wrap the finished picture with out/audio-master.wav (seconds, no re-render)
//
// MOTION BLUR, the honest way: every output frame is the average of FOUR subframes sampled around
// the frame time —
//     subT(i) = t + (i − (SUB−1)/2) / (FPS · SUB)
// — accumulated with successive `source-over` draws at alpha 1, 1/2, 1/3, 1/4, which is exactly a
// box average (each subframe lands with weight 1/SUB) and needs no black base fill.
// That is the same shutter-angle feel the motion-launch-video skill gets from `ffmpeg tmix`, done
// in the compositor so the pipe stays a single raw stream and never touches the disk.
//
// Frames leave as raw RGBA (canvas.data(), ~4ms) rather than PNG (~80–800ms): at 1080p60 the pipe
// carries ~500 MB/s, which is nothing next to the cost of compressing 3600 frames twice.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilm } from './film.mjs';
import { W, H, FPS } from './brand.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : (i >= 0 ? true : d); };
const num = (n, d) => { const v = arg(n, d); return v === true ? d : Number(v); };
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

for (const [f, a] of [['Inter-SemiBold', 'InterSemi'], ['Inter-ExtraBold', 'InterX'], ['Inter-Black', 'InterBlack'], ['Inter-Medium', 'InterMed']]) {
  GlobalFonts.registerFromPath(join(here, `fonts/${f}.ttf`), a);
}

const film = buildFilm({});
const OUT = join(here, 'out');
await mkdir(join(OUT, 'stills'), { recursive: true });

// three surfaces: the accumulator (final frame), the scratch (one subframe), and nothing else
const acc = createCanvas(W, H);
const accCtx = acc.getContext('2d');
const scratch = createCanvas(W, H);
const sctx = scratch.getContext('2d');
film.initOffscreen((w, h) => createCanvas(w, h)); // the film builds its static background here

const SUB = Math.max(1, Math.round(num('sub', 4)));
/**
 * Successive `source-over` at alpha 1, 1/2, 1/3 … 1/SUB is an EXACT box average — each subframe
 * lands with weight 1/SUB, with no additive blend and no black base fill to pay for every frame.
 * (That base fill alone was 9ms of the 1080p frame.)
 */
function renderFrame(t) {
  accCtx.save();
  accCtx.globalCompositeOperation = 'source-over';
  accCtx.globalAlpha = 1;
  for (let i = 0; i < SUB; i++) {
    const subT = ((i) - (SUB - 1) / 2) / (FPS * SUB) + t;
    accCtx.globalAlpha = 1 / (i + 1);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over';
    sctx.globalAlpha = 1;
    sctx.filter = 'none';
    sctx.clearRect(0, 0, W, H);
    film.drawScene(sctx, subT);          // the film at this instant
    accCtx.drawImage(scratch, 0, 0);     // accumulate: this subframe's 1/SUB share
  }
  accCtx.restore();
  film.drawGrade(accCtx, t);              // grain once per frame — never smeared by the blur
  return acc.data();                      // raw RGBA, ~4 ms
}

// ── stills mode ─────────────────────────────────────────────────────────────────────────────────
if (arg('stills')) {
  const times = String(arg('stills')).split(',').map(Number).filter((n) => Number.isFinite(n));
  for (const t of times) {
    renderFrame(t); // leaves the finished frame on the accumulator
    const file = join(OUT, 'stills', `t${t.toFixed(2).replace('.', '_')}.png`);
    await writeFile(file, acc.toBuffer('image/png'));
    console.log(`  ${file}  (scene: ${film.sceneAt(t).id})`);
  }
  process.exit(0);
}

// ── remux mode: new mix, same picture ───────────────────────────────────────────────────────────
// Changing the voice or the SFX mix must never cost nine minutes of re-render, so the picture and
// the sound are separate artefacts that get married at the end. This is that marriage.
if (argv.includes('--remux')) {
  const silent = typeof arg('out') === 'string' ? arg('out') : join(OUT, 'samyoj-launch-1080p60.mp4');
  // --mix lets a variant soundtrack (a new narration, a different bed) marry the SAME picture
  // without touching the original deliverable, and --suffix keeps both files on disk.
  const mix = typeof arg('mix') === 'string' ? arg('mix') : join(OUT, 'audio-master.wav');
  const suffix = typeof arg('suffix') === 'string' ? arg('suffix') : '';
  if (!existsSync(silent)) { console.error(`✋ no picture at ${silent} — render it first`); process.exit(1); }
  if (!existsSync(mix)) { console.error(`✋ no mix at ${mix} — run \`node lib/audio-synth.mjs\` first`); process.exit(1); }
  const final = silent.replace(/\.mp4$/, suffix ? `${suffix}.mp4` : '-with-sound.mp4');
  await new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', mix,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final]);
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('mux failed'))));
  });
  console.log(`\n✅ ${final}`);
  process.exit(0);
}

// ── video mode ──────────────────────────────────────────────────────────────────────────────────
const from = num('from', 0);
const to = num('to', film.T);
const outFile = typeof arg('out') === 'string' ? arg('out') : join(OUT, 'samyoj-launch-1080p60.mp4');
const crf = num('crf', 16);
const preset = typeof arg('preset') === 'string' ? arg('preset') : 'slow';
const totalFrames = Math.round((to - from) * FPS);

const vf = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
const args = [
  '-hide_banner', '-nostats', '-loglevel', 'error',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
  '-vf', vf, '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), '-tune', 'film',
  '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
  '-movflags', '+faststart', '-r', String(FPS), '-y', outFile,
];
console.log(`\n▶ ${totalFrames} frames · ${(to - from).toFixed(2)}s · ${SUB} subframes · ${preset}/crf${crf}`);
console.log(`  ${outFile}\n`);
// ffmpeg's own progress lines go to stderr as `\r`-rewritten text; at 3600 frames that is
// megabytes written into a pipe nobody reads, and it measurably steals the render loop's time.
const ff = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'pipe'] });
let ffErr = '';
ff.stderr.on('data', (d) => { ffErr += d; });
let frames = 0;
const t0 = Date.now();
let drainWait = null;
for (let f = 0; f < totalFrames; f++) {
  const t = from + f / FPS;
  const buf = renderFrame(t);
  if (!ff.stdin.write(Buffer.from(buf.buffer ?? buf, buf.byteOffset ?? 0, buf.byteLength ?? buf.length))) {
    await new Promise((res) => { ff.stdin.once('drain', res); });
  }
  frames++;
  if (frames % 60 === 0 || frames === totalFrames) {
    const el = (Date.now() - t0) / 1000;
    const eta = (el / frames) * (totalFrames - frames);
    const pct = ((frames / totalFrames) * 100).toFixed(1);
    process.stdout.write(`  ${pct.padStart(5)}%  ${frames}/${totalFrames}  ${(frames / el).toFixed(2)} fps  eta ${(eta / 60).toFixed(1)}m   \r`);
  }
}
ff.stdin.end();
await new Promise((res, rej) => { ff.on('exit', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}: ${ffErr.slice(-400)}`)))); });

// ── sound: mux the master mix if the audio build produced one ────────────────────────────────────
const mix = join(OUT, 'audio-master.wav');
if (existsSync(mix)) {
  const speech = join(OUT, 'audio-master.m4a');
  const final = outFile.replace(/\.mp4$/, '-with-sound.mp4');
  await new Promise((res, rej) => {
    const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-i', outFile, '-i', mix,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final], { stdio: 'inherit' });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('mux failed'))));
  });
  console.log(`\n✅ ${final}   (video + sound)`);
} else {
  console.log(`\n✅ ${outFile}   (silent — run \`node lib/audio-synth.mjs\` to build the mix)`);
}
await writeFile(join(OUT, 'render.json'), JSON.stringify({
  film: 'Samyoj launch film', fps: FPS, width: W, height: H,
  duration: +(to - from).toFixed(3), frames: totalFrames, subframes: SUB,
  scenes: film.wins.map((w) => ({ id: w.id, t0: w.t0, t1: w.t1 })),
  cues: film.cues, generated: new Date().toISOString(),
}, null, 2));
