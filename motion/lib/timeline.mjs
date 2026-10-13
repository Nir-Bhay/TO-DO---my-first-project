// motion/lib/timeline.mjs
//
// The film's whole score, as data. Nothing in here touches the DOM: this is the same code the
// browser draws from and the Node test asserts on.
//
// Structure follows the skill's step 2 — the state list is laid out on the beat grid BEFORE any
// code is written (see ../BEAT-SHEET.md), and every event below sits on a chosen beat.
//
//   120 BPM  ->  0.5s per beat, 4 beats per bar, 12 bars  ->  T = 24.0s
//
// Scene map (beats are 0-indexed; t = beat * 0.5):
//   bar 1      pill "TO-DO"; the cursor flies in and is "born"
//   bar 2      click -> the pill MORPHS into a composer card, placeholder blur-swap
//   bars 3-4   typing on 32nds (0.125s per char) — "typing rides 32nds on a snare build"
//   bars 5-6   date chip, then a priority slider dragged past max (rubber-band + edge stretch)
//   bar 6      click "Add" -> zoom-through -> the composer becomes the list card
//   bars 7-9   the list grows one row per beat, then three checks, boom boom boom
//   bar 9      the header swaps to a streak chip
//   bar 9      morph to the summary plate: tabs (edge-split indicator) + a ring that draws itself
//   bar 10     THE DROP: pull-back reveals a wall of completed tasks + a rolling odometer
//   bar 11     it all collapses into a toast
//   bar 12     morph back to the pill; the cursor exits to exactly where it began (frame 1 == last)
//
import {
  Track, vis, clamp, lerp, smoothstep, outQuint, mixStops, mixNum, css, SP, hash01, blink,
} from './motion-math.mjs';

export const FPS = 60;
export const BEAT = 0.5;
export const BARS = 12;
export const T = BARS * 4 * BEAT; // 24.0s — the loop point

// ── the beats everything is hung on ───────────────────────────────────────────────────────────
const B = {
  cursorIn: 0.25,
  clickPill: 2.0,
  morphComposer: 2.06,
  typeStart: 3.0,
  charStep: 0.125,
  chipIn: 6.05,
  sliderIn: 6.6,
  dragStart: 7.0,
  dragEnd: 8.6,
  clickAdd: 9.0,
  morphList: 9.06,
  row2: 10.0,
  row3: 11.0,
  check1: 12.0,
  check2: 13.0,
  check3: 14.0,
  streak: 15.0,
  morphPlate: 16.0,
  clickDone: 16.6,
  pullBack: 18.0, // the drop
  morphToast: 20.6,
  morphPill: 22.4,
  cursorOut: 23.2,
};

const TASK = 'Ship the launch video';
const ROWS = [
  { label: TASK, chip: 'Fri 17 Oct' },
  { label: 'Review the edit', chip: 'Today' },
  { label: 'Send to Nirbhay', chip: 'Today' },
];

// ── fixed geometry (world px, 1920x1080) ──────────────────────────────────────────────────────
const G = {
  pill: { x: 960, y: 540, w: 340, h: 92, r: 46 },
  composer: { x: 960, y: 498, w: 760, h: 300, r: 30 },
  list: { x: 960, y: 470, w: 880, h: 340, r: 26 },
  plate: { x: 960, y: 470, w: 520, h: 340, r: 26 },
  tile: { x: 870, y: 490, w: 160, h: 90, r: 18 },
  toast: { x: 960, y: 470, w: 520, h: 84, r: 42 },

  text: { left: 628, baseline: 448, size: 40 },
  chip: { x: 628, y: 560, w: 210, h: 48, r: 24 },
  slider: { left: 880, right: 1080, y: 588, h: 8, knob: 26 },
  add: { x: 1120, y: 556, w: 172, h: 56, r: 28 },

  cardL: 520,
  cardR: 1400,
  headerY: 350,
  rowY: [412, 496, 580],
  checkX: 593,
  labelX: 636,

  tabBar: { x: 740, y: 336, w: 440, h: 56, r: 28 },
  tabCenters: [813.33, 960, 1106.67],
  indicator: { w: 136, h: 44, r: 22 },

  ring: { cx: 960, cy: 505, r: 70, stroke: 12 },

  wall: { cols: 8, rows: 5, tw: 160, th: 90, gap: 20, cx: 960, cy: 490 },
};

// A deterministic advance-width table (em ratios) for the fallback measure. The browser passes
// the real `measureText`, so what the film draws and what the tests assert stay consistent.
const ADV = (() => {
  const t = {};
  const wide = 'mwMW@%';
  const narrow = 'iljItf.,:;!|\'’ ';
  for (const c of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') t[c] = 0.56;
  for (const c of wide) t[c] = 0.86;
  for (const c of narrow) t[c] = c === ' ' ? 0.28 : 0.3;
  for (const c of 'rt') t[c] = 0.38;
  for (const c of 'fhksvxyz') t[c] = 0.5;
  for (const c of 'cq') t[c] = 0.52;
  return t;
})();
const fallbackMeasure = (str, size) => {
  let w = 0;
  for (const ch of str) w += (ADV[ch] ?? 0.55) * size;
  return w;
};

export function buildTimeline(opts = {}) {
  const measure = opts.measure ?? fallbackMeasure;
  const tracks = [];
  const cues = [];

  /** every Track in the film is registered, so the loop test can assert on all of them */
  const track = (v0) => {
    const tr = new Track(v0, T);
    tracks.push(tr);
    return tr;
  };
  const cue = (t, kind, gain = 1) => cues.push({ t: +t.toFixed(4), kind, gain });

  // ── THE ONE SHAPE ───────────────────────────────────────────────────────────────────────────
  // "One shape, never cut": every state is this element morphing size, radius and colour.
  const sx = track(G.pill.x), sy = track(G.pill.y);
  const sw = track(G.pill.w), sh = track(G.pill.h), sr = track(G.pill.r);
  const m = SP.morph;

  sx.to(B.morphComposer, G.composer.x, m);
  sy.to(B.morphComposer, G.composer.y, m);
  sw.to(B.morphComposer, G.composer.w, m);
  sh.to(B.morphComposer, G.composer.h, m);
  sr.to(B.morphComposer, G.composer.r, m);

  sx.to(B.morphList, G.list.x, m);
  sy.to(B.morphList, G.list.y, m);
  sw.to(B.morphList, G.list.w, m);
  sh.to(B.morphList, G.list.h, m);
  sr.to(B.morphList, G.list.r, m);

  sx.to(B.morphPlate, G.plate.x, m);
  sy.to(B.morphPlate, G.plate.y, m);
  sw.to(B.morphPlate, G.plate.w, m);
  sh.to(B.morphPlate, G.plate.h, m);
  sr.to(B.morphPlate, G.plate.r, m);

  sx.to(B.pullBack, G.tile.x, m);
  sy.to(B.pullBack, G.tile.y, m);
  sw.to(B.pullBack, G.tile.w, m);
  sh.to(B.pullBack, G.tile.h, m);
  sr.to(B.pullBack, G.tile.r, m);

  sx.to(B.morphToast, G.toast.x, m);
  sy.to(B.morphToast, G.toast.y, m);
  sw.to(B.morphToast, G.toast.w, m);
  sh.to(B.morphToast, G.toast.h, m);
  sr.to(B.morphToast, G.toast.r, m);

  // …and back to the opening pill. The deltas sum to zero over one cycle: that is the loop.
  sx.to(B.morphPill, G.pill.x, m);
  sy.to(B.morphPill, G.pill.y, m);
  sw.to(B.morphPill, G.pill.w, m);
  sh.to(B.morphPill, G.pill.h, m);
  sr.to(B.morphPill, G.pill.r, m);

  // Colour as keyframes, never as a CSS transition (a transition cannot be seeked).
  const MORPH_C = B.morphComposer + 0.25;
  const c1 = [
    [0, css['#4F46E5']], [MORPH_C, css['#FFFFFF']],
    [B.morphToast - 0.05, css['#FFFFFF']], [B.morphToast + 0.3, css['#4F46E5']],
    [B.morphPill + 0.25, css['#4F46E5']], [T, css['#4F46E5']],
  ];
  const c2 = [
    [0, css['#7C3AED']], [MORPH_C, css['#FFFFFF']],
    [B.morphToast - 0.05, css['#FFFFFF']], [B.morphToast + 0.3, css['#14B8A6']],
    [B.morphPill + 0.25, css['#7C3AED']], [T, css['#7C3AED']],
  ];
  const inkStops = [
    [0, css['#FFFFFF']], [MORPH_C, css['#111827']],
    [B.morphToast + 0.16, css['#111827']], [B.morphToast + 0.34, css['#FFFFFF']],
    [B.morphPill + 0.14, css['#FFFFFF']], [T, css['#FFFFFF']],
  ];
  const borderStops = [
    [0, css['#DBDBE6']], [MORPH_C, css['#E7E7EF']],
    [B.morphToast + 0.16, css['#E7E7EF']], [B.morphToast + 0.34, css['#DBDBE6']],
    [B.morphPill + 0.14, css['#DBDBE6']], [T, css['#DBDBE6']],
  ];
  const borderAlpha = (t) => mixNum(t, [
    [0, 0.22], [MORPH_C - 0.2, 0.22], [MORPH_C, 1],
    [B.morphToast + 0.2, 1], [B.morphToast + 0.36, 0.22],
    [B.morphPill + 0.1, 0.22], [T, 0.22],
  ]);
  const shadowAlpha = (t) => mixNum(t, [
    [0, 0.34], [1.7, 0.34], [2.5, 0.1], [17.3, 0.1],
    [B.morphToast - 0.3, 0.04], [B.morphToast + 0.1, 0.05], [B.morphToast + 0.3, 0.3],
    [B.morphPill, 0.3], [B.morphPill + 0.3, 0.34], [T, 0.34],
  ]);

  // ── CAMERA ──────────────────────────────────────────────────────────────────────────────────
  // #world: translate(960,540) scale(z) translate(-cx,-cy) — x, y and log-zoom ride springs.
  const camX = track(960), camY = track(540), camZ = track(0.94);
  camZ.to(1.2, 1.0, SP.cam);
  camZ.to(2.6, 1.04, SP.cam); camY.to(2.6, 505, SP.cam);
  camZ.to(5.0, 1.07, SP.cam); camY.to(5.0, 492, SP.cam); camX.to(5.0, 950, SP.cam);
  camZ.to(B.clickAdd + 0.06, 1.13, { w: 20, z: 1 }); // zoom-through IS the transition
  camY.to(B.clickAdd + 0.06, 468, SP.cam); camX.to(B.clickAdd + 0.06, 962, SP.cam);
  camZ.to(11.4, 1.0, SP.cam);
  camZ.to(B.morphPlate + 0.2, 1.08, SP.cam); camY.to(B.morphPlate + 0.2, 466, SP.cam);
  // settled ON the drop: issued 0.15s early, so the pull-back is already arriving on the beat
  camZ.to(B.pullBack - 0.15, 0.56, { w: 18, z: 1 }); camY.to(B.pullBack - 0.12, 440, SP.cam);
  camZ.to(B.morphToast + 0.4, 0.88, SP.cam); camY.to(B.morphToast + 0.4, 470, SP.cam);
  camZ.to(B.morphPill + 0.5, 0.96, SP.cam);
  camZ.to(23.5, 0.94, SP.cam); camY.to(23.5, 540, SP.cam); camX.to(23.5, 960, SP.cam);

  // ── CURSOR ──────────────────────────────────────────────────────────────────────────────────
  // "A cursor drives every change with real clicks and drags."
  const CUR0 = { x: 1290, y: 690 };
  const cx = track(CUR0.x), cy = track(CUR0.y), csc = track(0);
  const move = (t, x, y, sp = SP.cursor) => { cx.to(t, x, sp); cy.to(t, y, sp); };

  const clicks = [];
  const click = (t) => clicks.push(t);

  csc.to(B.cursorIn, 1, { w: 12, z: 1 });
  move(0.4, 1150, 620);
  move(0.82, 1190, 648);
  move(1.5, 1040, 552);
  click(B.clickPill);
  move(2.2, 900, 470);
  move(2.72, 690, 452);

  const typedCountAt = (t) => clamp(Math.floor((t - B.typeStart) / B.charStep) + 1, 0, TASK.length);
  for (let i = 0; i < TASK.length; i++) {
    const at = B.typeStart + i * B.charStep;
    move(at + 0.02, G.text.left + measure(TASK.slice(0, i + 1), G.text.size) + 4, 452, SP.follow);
    if (i % 2 === 0) cue(at, 'tick', 0.5);
  }
  cue(B.typeStart + TASK.length * B.charStep + 0.1, 'chime', 0.6);

  // the slider drag — direct manipulation, then a spring from wherever it was released
  move(6.62, 1330, 700);
  move(6.95, G.slider.left + 0.25 * (G.slider.right - G.slider.left), G.slider.y);
  click(B.dragStart);
  move(7.5, 1005, G.slider.y, SP.follow);
  move(8.1, 1055, G.slider.y, SP.follow);
  move(8.34, 1102, G.slider.y, SP.follow);
  click(B.dragEnd);
  move(8.78, G.add.x + G.add.w / 2, G.add.y + G.add.h / 2);
  click(B.clickAdd);
  move(9.34, 700, 340);
  move(9.9, 600, G.rowY[0]);

  move(10.62, 622, 424);
  move(11.6, G.checkX, G.rowY[0]); click(B.check1);
  move(12.7, G.checkX, G.rowY[1]); click(B.check2);
  move(13.7, G.checkX, G.rowY[2]); click(B.check3);
  move(14.45, 900, 620);
  move(14.78, 1012, 522);
  move(15.25, 1180, 350);
  move(15.72, 1104, 412);
  move(16.35, G.tabCenters[2], 364); click(B.clickDone);
  move(17.2, 900, 505);
  move(18.5, 1010, 560);
  move(19.7, 1090, 300);
  move(20.5, 900, 470);
  move(21.3, 1060, 470);
  move(21.72, 1082, 486);
  move(22.1, 1030, 545);
  move(22.9, 1150, 620);
  move(23.6, CUR0.x, CUR0.y); // back to the exact start position…
  csc.to(B.cursorOut, 0, { w: 16, z: 1 }); // …and gone by t = T, so frame 1 == last frame

  const press = (t) => {
    let p = 1;
    for (const tc of clicks) p -= 0.16 * Math.exp(-Math.pow((t - tc) / 0.06, 2));
    return p;
  };
  const ripples = clicks.map((tc) => ({ t: tc, x: cx.at(tc), y: cy.at(tc) }));

  // ── THE SLIDER (drag = direct manipulation; stretch while held past max) ─────────────────────
  const SW = G.slider.right - G.slider.left;
  const sliderRaw = (t) => (cx.at(t) - G.slider.left) / SW;
  const rubber = (raw) => (raw < 0 ? raw * 0.35 : raw > 1 ? 1 + (raw - 1) * 0.35 : raw);
  const slTrack = track(0.25);
  const released = clamp(rubber(sliderRaw(B.dragEnd - 0.002)), -0.15, 1.2);
  slTrack.setTo(B.dragEnd - 0.002, released);
  slTrack.to(B.dragEnd, 1.0, { w: 18, z: 0.9 }); // release springs from wherever it was
  slTrack.to(9.45, 0.25, { w: 40, z: 1 }); // resets off-screen (slot is out by 9.22): keeps ΣΔ = 0
  const dragging = (t) => t >= B.dragStart && t < B.dragEnd;

  // ── EDGE-SPLIT STRETCH: the tab indicator's two edges ride different springs ─────────────────
  const indL = track(G.tabCenters[0] - G.indicator.w / 2);
  const indR = track(G.tabCenters[0] + G.indicator.w / 2);
  indL.to(B.clickDone, G.tabCenters[2] - G.indicator.w / 2, { w: 19, z: 0.9 }); // trailing: soft
  indR.to(B.clickDone, G.tabCenters[2] + G.indicator.w / 2, { w: 34, z: 0.9 }); // leading: stiff
  // …and both edges come home while the plate is off-screen, so ΣΔ for the cycle is zero
  indL.to(18.05, G.tabCenters[0] - G.indicator.w / 2, { w: 40, z: 1 });
  indR.to(18.05, G.tabCenters[0] + G.indicator.w / 2, { w: 40, z: 1 });

  // ── WALL + ODOMETER (the pull-back reveals scale) ────────────────────────────────────────────
  const wallN = G.wall.cols * G.wall.rows;
  const wallAt = (i) => B.pullBack + 0.05 + 2.0 * Math.pow(i / (wallN - 1), 1.35); // slams accelerate
  const odoValue = (t) => 412 * outQuint((t - (B.pullBack + 0.1)) / 1.6);
  const ringP = (t) => outQuint((t - (B.morphPlate + 0.45)) / 1.35);

  // ── CUES — one source of truth, exported from the film itself ────────────────────────────────
  cue(B.cursorIn + 0.05, 'whoosh', 0.7);
  cue(B.clickPill, 'click');
  cue(B.clickPill + 0.07, 'release', 0.55);
  cue(B.morphComposer, 'whoosh', 0.55);
  cue(B.chipIn, 'blip', 0.65);
  cue(B.dragStart, 'click', 0.8);
  for (let t = B.dragStart + 0.06; t < B.dragEnd - 0.05; t += 0.08) {
    cue(t, 'pen', 0.3 * (0.6 + 0.4 * hash01(Math.round(t * 100))));
  }
  cue(B.dragEnd, 'release', 0.8);
  cue(B.dragEnd + 0.24, 'chime', 0.55);
  cue(B.clickAdd, 'click');
  cue(B.morphList, 'thump', 0.85);
  cue(9.55, 'pop', 0.55);
  cue(B.row2, 'pop', 0.7);
  cue(B.row3, 'pop', 0.7);
  for (const t of [B.check1, B.check2, B.check3]) { cue(t, 'click', 0.9); cue(t + 0.05, 'chime', 0.8); }
  cue(B.streak, 'shimmer', 0.7);
  cue(B.morphPlate + 0.05, 'whoosh', 0.6);
  cue(B.clickDone, 'click', 0.9);
  cue(B.clickDone + 0.16, 'blip', 0.6);
  cue(B.pullBack, 'riser', 0.5); // 1.0s long: its peak lands exactly on the drop
  cue(B.pullBack, 'thump', 1.0); // the drop lands on the big moment
  for (let i = 0; i < wallN; i++) cue(wallAt(i), 'pop', 0.22 + 0.22 * (i / wallN));
  cue(20.3, 'shimmer', 0.55);
  cue(B.morphToast + 0.06, 'pop', 0.8);
  cue(B.morphToast + 0.12, 'chime', 0.75);
  cue(B.morphPill + 0.1, 'whoosh', 0.5);
  cues.sort((a, b) => a.t - b.t);

  // ── SLOT WINDOWS (each content swap has its own enter — and its exit short and early) ────────
  const slots = {
    brandA: (t) => vis(t, -0.5, B.morphComposer + 0.02, 0.14),
    brandB: (t) => vis(t, B.morphPill + 0.08, null),
    composer: (t) => vis(t, B.morphComposer + 0.16, B.morphList + 0.02, 0.14),
    chip: (t) => vis(t, B.chipIn + 0.05, B.morphList + 0.02, 0.14),
    slider: (t) => vis(t, B.sliderIn + 0.04, B.morphList + 0.02, 0.14),
    add: (t) => vis(t, B.sliderIn + 0.18, B.morphList + 0.02, 0.14),
    header: (t) => vis(t, 9.32, 17.92, 0.16),
    headerR: (t) => vis(t, 9.34, B.streak, 0.12),
    streakChip: (t) => vis(t, B.streak, 17.92, 0.16),
    row: (i) => ((t) => vis(t, [9.18, B.row2, B.row3][i], 17.92, 0.16)),
    tabs: (t) => vis(t, B.morphPlate + 0.12, 17.88, 0.14),
    ring: (t) => vis(t, B.morphPlate + 0.35, 17.88, 0.14),
    tileCheck: (t) => vis(t, B.pullBack + 0.5, B.morphToast - 0.1, 0.2),
    toast: (t) => vis(t, B.morphToast + 0.08, B.morphPill + 0.02, 0.16),
    wall: (t) => vis(t, B.pullBack, B.morphToast + 0.05, 0.3),
    odo: (t) => vis(t, B.pullBack + 0.15, B.morphToast - 0.05, 0.35),
    curYou: (t) => vis(t, 0.3, B.pullBack - 0.05, 0.2),
    curBrand: (t) => vis(t, B.pullBack + 0.05, B.cursorOut + 0.1, 0.25),
  };

  const M = {
    T, BEAT, BARS, FPS, G, B, ROWS, TASK,

    /** the shape: every state is this one element morphing */
    shape(t) {
      return {
        x: sx.at(t), y: sy.at(t), w: sw.at(t), h: sh.at(t), r: sr.at(t),
        c1: mixStops(t, c1), c2: mixStops(t, c2),
        ink: mixStops(t, inkStops),
        border: mixStops(t, borderStops), borderA: borderAlpha(t),
        shadow: clamp(shadowAlpha(t), 0, 0.45),
      };
    },
    cam: (t) => ({ x: camX.at(t), y: camY.at(t), z: camZ.at(t) }),
    cursor(t) {
      const x = cx.at(t), y = cy.at(t);
      const vx = cx.vel(t);
      return {
        x, y, vx,
        scale: csc.at(t) * press(t),
        press: press(t),
        lean: clamp(-vx * 0.0045, -14, 14) * (Math.PI / 180),
        pill: { you: slots.curYou(t).o, brand: slots.curBrand(t).o, x: x - clamp(vx * 0.012, -26, 26), y },
        ripples,
      };
    },
    slots,
    typed(t) {
      const n = typedCountAt(t);
      return { n, text: TASK.slice(0, n), caretX: G.text.left + measure(TASK.slice(0, n), G.text.size) + 3, blink: blink(t, 0.72, 0.55) };
    },
    slider(t) {
      const live = dragging(t);
      const raw = sliderRaw(t);
      const value = live ? clamp(rubber(raw), -0.18, 1.28) : slTrack.at(t);
      const knobX = G.slider.left + value * SW;
      const stretch = clamp((value - 1) / 0.22); // past max: the fill runs ahead of the knob
      return { live, raw, value, knobX, fillX: knobX + 18 * stretch, stretch, knobScaleX: 1 + 0.3 * stretch };
    },
    indicator: (t) => ({ l: indL.at(t), r: indR.at(t) }),
    ring: (t) => ({ p: ringP(t), n: 12 * ringP(t) }),
    checks: (t) => [0, 1, 2].map((i) => {
      const t0 = [B.check1, B.check2, B.check3][i];
      return { p: outQuint(clamp((t - t0) / 0.34)), done: clamp((t - t0) / 0.22) };
    }),
    wallAt, wallCount: wallN,
    odo: odoValue,
    cues, clicks,
  };

  return { T, BEAT, BARS, FPS, tracks, cues, M, G, B };
}

export { G as GEOMETRY, B as BEATS };
