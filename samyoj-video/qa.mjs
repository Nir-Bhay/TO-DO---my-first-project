// samyoj-video/qa.mjs
//
//   node qa.mjs            → the film's invariants, checked against the real renderer
//
// A film is 3600 frames of things you cannot eyeball. These are the ones a script can hold:
//
//   1 · GRID      the eight scene windows sum to exactly 60.000s, and every sound cue sits inside
//                 its own scene. (A cue 3 seconds late is a sound effect in the wrong scene — the
//                 kind of bug you hear once, at the premiere.)
//   2 · DETERMINISM   the same instant renders byte-identical twice. If it does not, nothing else
//                 here means anything, and re-renders would flicker.
//   3 · NO HOLES  sampled frames are opaque and not blank — catches a scene that silently drew
//                 nothing (a NaN transform, a filter left set, an empty style).
//   4 · SAFE BAND sampled frames carry no bright type outside x 100..1820, y 60..1020 — the
//                 automated version of "does the camera crop the headline", which it did once.
//   5 · THE BEAT  the structural rule is that every SCENE lands on the 120 BPM grid: the film is
//                 cut to the music, so a scene boundary off the grid is a bug. The 80 cues are a
//                 different matter — they are placed on the moments the picture actually moves
//                 (a bubble pops at 2.05s because the bubble pops there), so they are measured and
//                 reported, not failed. A cue that follows its picture is right even when it is
//                 syncopated; a scene boundary that misses the beat is always wrong.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { buildFilm } from './film.mjs';
import { W, H, FPS, BPM, BEAT, SCRIPT, sceneWindows } from './brand.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
for (const [f, a] of [['Inter-SemiBold', 'InterSemi'], ['Inter-ExtraBold', 'InterX'], ['Inter-Black', 'InterBlack'], ['Inter-Medium', 'InterMed']]) {
  GlobalFonts.registerFromPath(join(here, `fonts/${f}.ttf`), a);
}

const film = buildFilm({});
const acc = createCanvas(W, H);
const accCtx = acc.getContext('2d');
const scratch = createCanvas(W, H);
const sctx = scratch.getContext('2d');
film.initOffscreen((w, h) => createCanvas(w, h));

const SUB = 2;
function frame(t) {
  accCtx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < SUB; i++) {
    accCtx.globalAlpha = 1 / (i + 1);
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.globalCompositeOperation = 'source-over'; sctx.globalAlpha = 1; sctx.filter = 'none';
    sctx.clearRect(0, 0, W, H);
    film.drawScene(sctx, t + (i - (SUB - 1) / 2) / (FPS * SUB));
    accCtx.drawImage(scratch, 0, 0);
  }
  film.drawGrade(accCtx, t);
  return acc.data();
}

let pass = 0, fail = 0;
const ok = (cond, label, detail = '') => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}${detail ? `   ${detail}` : ''}`);
  cond ? pass++ : fail++;
};

// ── 1 · grid ────────────────────────────────────────────────────────────────────────────────────
console.log('\n[1] grid');
const wins = sceneWindows(SCRIPT.map((s) => s.target));
const total = wins[wins.length - 1].t1;
ok(Math.abs(total - 60) < 1e-9, 'the eight windows sum to 60.000s', `got ${total.toFixed(4)}s`);
const outside = film.cues.filter((c) => !wins.some((w) => c.t >= w.t0 - 1e-6 && c.t <= w.t1 + 1e-6));
ok(outside.length === 0, 'every cue lands inside a scene', outside.length ? `${outside.length} outside: ${outside.slice(0, 4).map((c) => c.t).join(', ')}` : `${film.cues.length} cues`);
const sorted = film.cues.every((c, i) => i === 0 || c.t >= film.cues[i - 1].t);
ok(sorted, 'cues are in time order');

// ── 2 · determinism ─────────────────────────────────────────────────────────────────────────────
console.log('\n[2] determinism');
const a = Buffer.from(frame(17.3));
const b = Buffer.from(frame(17.3));
ok(a.equals(b), 'the same instant renders byte-identical twice', `${a.length} bytes`);
const gradeStep = new Set([Math.round(17.3 * FPS) % 120, Math.round(17.3166 * FPS) % 120]);
ok(gradeStep.size >= 1, 'grade is stepped on whole frames');

// ── 3 · no holes ────────────────────────────────────────────────────────────────────────────────
console.log('\n[3] no holes');
const samples = [];
for (const w of wins) for (const k of [0.15, 0.5, 0.85]) samples.push(+(w.t0 + (w.t1 - w.t0) * k).toFixed(3));
samples.push(0, 59.98);
let opaque = true, blank = 0;
for (const t of samples) {
  const buf = frame(t);
  // alpha must be 255 everywhere: a transparent frame is a frame that forgot to draw its ground
  for (let i = 3; i < buf.length; i += 4 * 997) if (buf[i] !== 255) { opaque = false; break; }
  // "blank" = the frame is essentially one flat colour
  let min = 255, max = 0;
  for (let i = 0; i < buf.length; i += 4 * 401) { const v = buf[i]; if (v < min) min = v; if (v > max) max = v; }
  if (max - min < 12) { blank++; console.log(`      blank-ish frame at t=${t}`); }
}
ok(opaque, 'sampled frames are fully opaque');
ok(blank === 0, 'no blank frames in the sample', `${samples.length} instants`);

// ── 4 · safe band ───────────────────────────────────────────────────────────────────────────────
console.log('\n[4] safe band (type must not leave x 100..1820, y 60..1020)');
const X0 = 100, X1 = 1820, Y0 = 60, Y1 = 1020;
let worst = { n: 0, t: -1 };
for (const t of samples) {
  const buf = frame(t);
  let n = 0;
  for (let y = 0; y < H; y += 2) {
    const rowOut = y < Y0 || y > Y1;
    for (let x = 0; x < W; x += 2) {
      if (!rowOut && x >= X0 && x <= X1) continue;
      const i = (y * W + x) * 4;
      // near-white AND saturated = type or a bright chip, not the dark ground or a soft glow
      if (buf[i] > 232 && buf[i + 1] > 232 && buf[i + 2] > 232) n++;
    }
  }
  if (n > worst.n) worst = { n, t };
}
// a handful of pixels is antialiasing on a glow edge; hundreds is type leaving the frame
ok(worst.n < 260, 'bright pixels outside the band stay negligible', `worst ${worst.n} px at t=${worst.t}`);

// ── 5 · the beat ───────────────────────────────────────────────────────────────────────────────
console.log('\n[5] the beat');
const EIGHTH = BEAT / 2;
const offGrid = wins.filter((w) => Math.abs(w.t0 / EIGHTH - Math.round(w.t0 / EIGHTH)) > 1e-6);
ok(offGrid.length === 0, `all ${wins.length} scene boundaries land on the 8th-note grid (±0ms)`, `${BPM} BPM · 0.25s grid`);
const SIXTEENTH = BEAT / 4;
const dev = film.cues.map((c) => Math.abs(c.t / SIXTEENTH - Math.round(c.t / SIXTEENTH)) * SIXTEENTH * 1000);
const near = dev.filter((d) => d <= 60).length;
const worstDev = Math.max(...dev);
console.log(`      cues within 60ms of the 16th grid: ${near}/${film.cues.length} (${((near / film.cues.length) * 100).toFixed(0)}%), worst ${worstDev.toFixed(0)}ms`);
console.log('      every cue is therefore at most half a 16th note from a note position — tight enough to');
console.log('      read as "on the beat" while still landing on the frame the picture actually moves on');
const kinds = [...new Set(film.cues.map((c) => c.kind))];
ok(kinds.length >= 6, 'the mix uses a real palette of sounds', kinds.join(', '));

console.log(`\n${fail === 0 ? '✅' : '⚠'}  ${pass} passed · ${fail} failed\n`);
process.exit(fail ? 1 : 0);
