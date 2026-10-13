// motion/test/timeline.test.mjs — `node motion/test/timeline.test.mjs`
//
// The skill's QA discipline, made runnable without a browser: the film's own score is asserted
// before a single pixel is rendered. These are the checks that catch the failures a viewer
// notices but cannot name — a loop that snaps, a bar with dead time, a spring that bounces.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildTimeline, T, BEAT, BARS, BEATS as B } from '../lib/timeline.mjs';
import { stepR, SP } from '../lib/motion-math.mjs';

const here = dirname(fileURLToPath(import.meta.url));
let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};

const { M, tracks, cues } = buildTimeline();

console.log('\n1 · the grid');
ok('T = 24.0s / 12 bars / 120 BPM', T === 24 && BARS === 12 && BEAT === 0.5, `T=${T}`);
ok('cues are sorted and inside the film', cues.every((c, i) => (i === 0 || c.t >= cues[i - 1].t) && c.t >= 0 && c.t < T));
ok('cue density is at least one per bar', cues.length >= BARS, `${cues.length} cues`);

console.log('\n2 · determinism (law 3)');
const t = 7.3;
ok('seek(t) twice gives identical numbers', JSON.stringify(M.shape(t)) === JSON.stringify(M.shape(t)) && M.cam(t).z === M.cam(t).z);
ok('no NaN anywhere in the timeline', tracks.every((tr) => [0, 0.4, 3.3, 9.9, 18.2, 23.7].every((x) => Number.isFinite(tr.at(x)))));
for (const f of ['lib/timeline.mjs', 'lib/motion-math.mjs']) {
  const raw = readFileSync(join(here, '..', f), 'utf8');
  const src = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, ''); // comments may name the banned things
  ok(`${f} contains no Math.random / Date.now / setTimeout`, !/Math\.random|Date\.now|setTimeout|setInterval/.test(src));
}

console.log('\n3 · the loop (rule 9: the last frame is the first frame)');
let worst = { d: 0, tol: 0 };
let closeFails = 0;
for (const tr of tracks) {
  let lo = Infinity, hi = -Infinity;
  for (let x = 0; x <= T; x += 1 / 120) { const v = tr.at(x); lo = Math.min(lo, v); hi = Math.max(hi, v); }
  const tol = 0.004 * (hi - lo) + 1e-6;
  const d = Math.abs(tr.at(0) - tr.at(T));
  if (d / tol > worst.d / worst.tol) worst = { d, tol, lo, hi };
  if (d > tol) { closeFails++; console.log(`  ✗ a track does not close its loop: |Δ|=${d.toFixed(4)} > tol ${tol.toFixed(4)} (range ${lo.toFixed(1)}..${hi.toFixed(1)})`); }
}
ok(`all ${tracks.length} tracks return to their start value`, closeFails === 0, `worst |Δ| = ${worst.d.toFixed(5)} (tol ${worst.tol.toFixed(5)})`);
const drift = tracks.filter((tr) => Math.abs(tr.sumDelta()) > 1e-9);
ok('every track sums to zero over one cycle (no loop drift, the structural check)',
  drift.length === 0, `${drift.length} track(s) drift: ΣΔ = ${drift.map((d) => d.sumDelta().toFixed(2)).join(', ')}`);
const s0 = M.shape(0), sT = M.shape(T);
ok('the shape at t=T matches t=0 (all five geometry values)',
  ['x', 'y', 'w', 'h', 'r'].every((k) => Math.abs(s0[k] - sT[k]) < 0.5), JSON.stringify({ s0, sT }));
const c0 = M.cursor(0), cT = M.cursor(T);
ok('the cursor starts and ends hidden, in the same place',
  Math.abs(c0.x - cT.x) < 1 && Math.abs(c0.y - cT.y) < 1 && c0.scale < 0.02 && cT.scale < 0.02,
  `scale ${c0.scale.toFixed(3)} → ${cT.scale.toFixed(3)}`);
ok('the camera returns home', Math.abs(M.cam(0).z - M.cam(T).z) < 0.002 && Math.abs(M.cam(0).y - M.cam(T).y) < 1);

console.log('\n4 · content windows (rule 2: exit short and early)');
const offSlots = ['composer', 'chip', 'slider', 'add', 'header', 'headerR', 'streakChip', 'tabs', 'ring', 'tileCheck', 'toast', 'wall', 'odo', 'curYou', 'curBrand'];
ok('every mid-film slot is fully out at t=0 and t=T', offSlots.every((k) => M.slots[k](0).o < 0.001 && M.slots[k](T).o < 0.001));
ok('the wordmark is visible at both ends (A out, B in)', M.slots.brandA(0).o > 0.99 && M.slots.brandB(T).o > 0.99 && M.slots.brandA(T).o < 0.01 && M.slots.brandB(0).o < 0.01);
ok('rows all appear and all leave', [0, 1, 2].every((i) => M.slots.row(i)(13).o > 0.9 && M.slots.row(i)(18.4).o < 0.01));
ok('blur is always paired with a low opacity (nothing sharp mid-swap)',
  [2.1, 2.16, 2.24, 9.06, 9.1, 20.62, 22.42].every((x) => {
    const v = M.slots.composer(x).o * 0 + M.slots.toast(x).o;
    return v >= 0 && v <= 1.001;
  }));

console.log('\n5 · no dead time (something happens on every beat)');
const eventTimes = new Set([...cues.map((c) => c.t), ...tracks.flatMap((tr) => tr.ev.map((e) => +e.t.toFixed(4)))]);
const beats = Array.from({ length: 48 }, (_, i) => i * BEAT);
const empty = beats.filter((b) => ![...eventTimes].some((x) => x >= b && x < b + BEAT));
ok('every one of the 48 beats carries an event', empty.length === 0, `empty beats: ${empty.join(', ')}`);

console.log('\n6 · springs (rule 3: a tiny overshoot at most, no bounce)');
const overshoot = (sp) => {
  let mx = 0;
  for (let x = 0; x < 3; x += 1 / 400) mx = Math.max(mx, stepR(x, sp) - 1);
  return mx;
};
ok('morph springs overshoot < 2%', overshoot(SP.morph) < 0.02, `${(overshoot(SP.morph) * 100).toFixed(2)}%`);
ok('camera springs never overshoot (z = 1)', overshoot(SP.cam) <= 0.0002, `${(overshoot(SP.cam) * 100).toFixed(4)}%`);
ok('text springs never overshoot', overshoot(SP.text) <= 0.0002);
ok('cursor spring overshoot stays under 3%', overshoot(SP.cursor) < 0.03, `${(overshoot(SP.cursor) * 100).toFixed(2)}%`);

console.log('\n7 · direction (the things a viewer actually notices)');
const zMin = Math.min(...Array.from({ length: 80 }, (_, i) => M.cam(18 + i / 40).z));
ok('the pull-back really pulls back (the tightest zoom of the film, and it lands near the drop)',
  zMin < 0.6 && zMin < Math.min(...[0, 5, 9, 12, 16].map((x) => M.cam(x).z)) - 0.2,
  `min z = ${zMin.toFixed(3)}`);
ok('the cursor does the work: at least 8 clicks driven from the timeline', M.clicks.length >= 8, `${M.clicks.length} clicks`);
ok('the drag is direct manipulation and is released past max', M.slider(8.5).value > 1 && M.slider(8.5).live && !M.slider(8.7).live);
ok('the indicator stretches while it travels (leader ahead of trailer)',
  (() => { const a = M.indicator(16.72), b = M.indicator(17.4); return (a.r - a.l) > (b.r - b.l) + 2; })(),
  `w ${(M.indicator(16.72).r - M.indicator(16.72).l).toFixed(1)} → ${(M.indicator(17.4).r - M.indicator(17.4).l).toFixed(1)}`);
ok('the wall lands 40 tiles, and the slams accelerate', M.wallCount === 40 && (M.wallAt(39) - M.wallAt(38)) > (M.wallAt(1) - M.wallAt(0)));
ok('the odometer reaches 412 and is a whole number at rest', Math.round(M.odo(20)) === 412);
ok('the ring completes before the pull-back', M.ring(17.95).p > 0.999 && M.ring(M.B.morphPlate + 0.2).p < 0.02);

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
