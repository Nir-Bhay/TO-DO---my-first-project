// samyoj-video/film.mjs
//
// The film: background, camera, per-scene direction, transitions, brand chrome and grade.
// drawFrame(ctx, t) renders any instant. Everything else in the project (renderer, QA, audio
// scheduler) reads this file's outputs: the scene windows and the SFX cue list.
//
// Two direction rules worth naming, because they are the film's whole personality:
//
//   · THE SIGNAL STREAK — the transition between scenes is a gradient comet that leaves the
//     outgoing scene's hero and lands on the incoming scene's hero, arriving exactly on the scene
//     boundary. The message travels; nothing ever hard-cuts.
//   · ONE CAMERA — a single spring-driven rig frames every scene, so a scene change reads as a
//     camera move rather than an edit. Two boundaries get a whip; the CTA gets a slow push that
//     never stops moving until the last 1.5 seconds, when everything holds.
import {
  Track, SP, clamp, lerp, smoothstep, outQuint, outExpo, stepR, rgba, hex, linGrad, glow, rr,
  kinetic, kineticHeight, makeGrain, vis, pulse, mixNum, hash01, bake,
} from './lib/motion.mjs';
import { C, F, GRAD, W, H, FPS, TOTAL, BEAT, BAR, LAYOUT, sceneWindows, SCRIPT } from './brand.mjs';
import { SCENES } from './scenes.mjs';
import { emblem, wordmark, lockup } from './logo.mjs';

const T = (w, s) => `${w} ${s}px ${w === 900 ? F.black : w === 800 ? F.x : w === 600 ? F.semi : F.med}`;

/**
 * The camera rig, in two rules.
 *
 * 1 · IT IS CENTRE-LOCKED. The film's type never moves, so the frame may not either — a centred
 *     camera with z ≤ 1.12 provably cannot crop the 96..1000 safe area (540 − 444·z ≥ 0). The
 *     previous version re-centred on each scene's hero and cut the headline off the top of the
 *     frame; that is the failure the skill calls "the camera frames every state — an empty or
 *     clipped frame is a bug".
 * 2 · THE ENERGY IS IN THE Z. Every scene gets a slow push, and the two scene changes that need
 *     impact get a whip: a fast, short Z spike with a ≤ 60px offset that resolves on the boundary.
 */
const SCENE_CAM = [
  { id: 'hook', z0: 1.08, z1: 1.135, ox: -30, oy: 16, anchor: { x: 1280, y: 700 } },
  { id: 'broadcast', z0: 1.11, z1: 1.16, ox: 24, oy: 20, anchor: { x: 1450, y: 480 } },
  { id: 'ai', z0: 1.05, z1: 1.11, ox: -20, oy: 14, anchor: { x: 660, y: 690 } },
  { id: 'flows', z0: 1.08, z1: 1.14, ox: 20, oy: 12, anchor: { x: 1210, y: 690 } },
  { id: 'inbox', z0: 1.10, z1: 1.15, ox: -16, oy: 18, anchor: { x: 1350, y: 660 } },
  { id: 'commerce', z0: 1.09, z1: 1.145, ox: 24, oy: 12, anchor: { x: 1110, y: 640 } },
  { id: 'ads', z0: 1.10, z1: 1.15, ox: -18, oy: 14, anchor: { x: 1450, y: 640 } },
  { id: 'cta', z0: 1.04, z1: 1.09, ox: 0, oy: -12, anchor: { x: 960, y: 420 } },
];
const ANCHORS = SCENE_CAM.map((c) => c.anchor);

export function buildFilm({ lengths = SCRIPT.map((s) => s.target), grainOn = true } = {}) {
  const wins = sceneWindows(lengths);
  const T_end = wins[wins.length - 1].t1;
  const cues = [];
  const cue = (t, kind, gain = 1) => cues.push({ t: +t.toFixed(4), kind, gain: +gain.toFixed(3) });

  // ── camera: one rig, spring-driven, framed per scene ─────────────────────────────────────────
  const camZ = new Track(1.02), camX = new Track(960), camY = new Track(560);
  const key = (t, z, x, y, sp = SP.cam) => { camZ.to(t, z, sp); camX.to(t, x, sp); camY.to(t, y, sp); };
  // one centred rig for the whole film: every key moves Z (and a few px), never the frame
  const C0 = { x: W / 2, y: H / 2 };
  camZ.v0 = SCENE_CAM[0].z0; camX.v0 = C0.x; camY.v0 = C0.y;
  camZ.cur = SCENE_CAM[0].z0; camX.cur = C0.x; camY.cur = C0.y;
  for (let i = 0; i < wins.length; i++) {
    const w = wins[i], sc = SCENE_CAM[i];
    // settle into the scene, then push gently for the whole of it
    key(w.t0 + 0.30, sc.z0, C0.x + sc.ox * 0.4, C0.y + sc.oy * 0.4, { w: 15, z: 1 });
    key(w.t0 + w.len * 0.55, (sc.z0 + sc.z1) / 2, C0.x + sc.ox * 0.75, C0.y + sc.oy * 0.75, { w: 9, z: 1 });
    key(w.t1 - 0.10, sc.z1, C0.x + sc.ox, C0.y + sc.oy, { w: 11, z: 1 });
  }
  // the two whips: a Z spike + a 60px shove, both resolved on the boundary
  for (const i of [2, 7]) {
    key(wins[i].t0 - 0.36, SCENE_CAM[i].z0 * 1.13, C0.x - 44, C0.y + (i === 7 ? 52 : -40), { w: 30, z: 1 });
    key(wins[i].t0 + 0.26, SCENE_CAM[i].z0, C0.x + SCENE_CAM[i].ox * 0.4, C0.y + SCENE_CAM[i].oy * 0.4, { w: 15, z: 1 });
  }
  // the end card's push keeps going until the final 1.4s, then everything holds still
  key(T_end - 1.4, SCENE_CAM[7].z1 * 1.022, C0.x, C0.y - 14, { w: 6, z: 1 });

  // ── grade: vignette per scene + a grain tile that steps on whole frames ──────────────────────
  const grain = grainOn ? makeGrain() : null;
  let vig = 0.45;

  // ── the static background, rendered once ─────────────────────────────────────────────────────
  let bg = null;
  function buildBg(ctx) {
    const c = ctx.canvas;
    if (!bg) {
      const off = document.createElement ? null : null;
      bg = c.getContext ? document.createElementOffscreen() : null;
    }
    return bg;
  }
  // (off-canvas creation is injected by the renderer, which owns canvas allocation)

  let bgCanvas = null, grainCanvas = null, makeTex = null;
  function initOffscreen(make) {
    makeTex = make;
    bgCanvas = make(W, H);
    const bx = bgCanvas.getContext('2d');
    bx.fillStyle = linGrad(bx, 0, 0, W * 0.72, H, [[0, C.void0], [0.52, C.void1], [1, C.void2]]);
    bx.fillRect(0, 0, W, H);
    // brand light pools — the "aurora" ground, at low alpha so type always wins
    const pools = [
      [330, 160, 900, C.b2, 0.20], [1620, 210, 820, C.b4, 0.15],
      [1180, 980, 900, C.b0, 0.14], [640, 900, 760, C.b3, 0.10],
    ];
    for (const [cx, cy, r, col, a] of pools) {
      bx.fillStyle = glow(bx, cx, cy, r, hex(col), a);
      bx.fillRect(0, 0, W, H);
    }
    // a faint 64px grid: it makes the empty space feel measured instead of empty
    bx.strokeStyle = 'rgba(255,255,255,0.028)';
    bx.lineWidth = 1;
    for (let x = 0; x <= W; x += 64) { bx.beginPath(); bx.moveTo(x, 0); bx.lineTo(x, H); bx.stroke(); }
    for (let y = 0; y <= H; y += 64) { bx.beginPath(); bx.moveTo(0, y); bx.lineTo(W, y); bx.stroke(); }
    // a very soft horizon so panels have something to sit on
    bx.fillStyle = linGrad(bx, 0, H * 0.55, 0, H, [[0, 'rgba(4,8,26,0)'], [1, 'rgba(3,6,20,0.55)']]);
    bx.fillRect(0, H * 0.55, W, H * 0.45);

    if (grain) {
      // ONE full-frame grain sheet, blitted once per frame with an offset. Tiling a small texture
      // cost 84 drawImage calls a frame — at 3600 frames that is most of the render time.
      const S2 = grain.size;
      grainCanvas = make(W + S2, H + S2);
      const gx = grainCanvas.getContext('2d');
      const img = gx.createImageData(S2, S2);
      img.data.set(grain.data);
      const tile = make(S2, S2);
      tile.getContext('2d').putImageData(img, 0, 0);
      for (let x = 0; x < W + S2; x += S2) {
        for (let y = 0; y < H + S2; y += S2) gx.drawImage(tile, x, y);
      }
    }
  }

  // ── SFX cues ─────────────────────────────────────────────────────────────────────────────────
  const sceneCues = {
    hook: [[0.5, 'pop', 0.7], [1.9, 'whoosh', 0.5], [2.05, 'pop', 0.85], [2.35, 'tick', 0.4], [2.6, 'tick', 0.4], [2.9, 'chime', 0.8], [3.2, 'blip', 0.55]],
    broadcast: [[0.3, 'whoosh', 0.7], [1.15, 'click', 1], [1.35, 'pop', 0.5], [1.75, 'pop', 0.5], [2.15, 'pop', 0.5], [2.55, 'pop', 0.5], [2.95, 'pop', 0.5], [3.35, 'pop', 0.5], [2.4, 'shimmer', 0.6], [3.6, 'chime', 0.7]],
    ai: [[0.15, 'whoosh', 0.6], [0.6, 'thump', 0.7], [1.3, 'tick', 0.35], [1.55, 'tick', 0.35], [1.8, 'tick', 0.35], [2.0, 'pop', 0.6], [2.45, 'pop', 0.9], [2.95, 'blip', 0.6], [3.3, 'chime', 0.6]],
    flows: [[0.25, 'pop', 0.7], [0.75, 'pop', 0.7], [1.1, 'pop', 0.7], [1.5, 'pop', 0.8], [2.9, 'click', 0.9], [3.35, 'chime', 0.7], [4.2, 'blip', 0.5]],
    inbox: [[0.35, 'pop', 0.6], [0.77, 'pop', 0.6], [1.19, 'pop', 0.6], [1.61, 'pop', 0.6], [2.03, 'pop', 0.6], [1.9, 'whoosh', 0.6], [2.45, 'pop', 0.7], [2.61, 'pop', 0.6], [2.93, 'pop', 0.6], [3.4, 'blip', 0.5], [4.0, 'chime', 0.55]],
    commerce: [[0.1, 'whoosh', 0.55], [1.5, 'click', 1], [1.55, 'pop', 0.8], [2.1, 'chime', 0.95], [2.7, 'tick', 0.5], [3.0, 'tick', 0.5], [3.3, 'blip', 0.6]],
    ads: [[0.1, 'pop', 0.7], [1.6, 'click', 1], [1.65, 'whoosh', 0.55], [1.9, 'pop', 0.8], [2.3, 'pop', 0.5], [2.6, 'pop', 0.5], [3.0, 'shimmer', 0.6], [3.35, 'chime', 0.7]],
    cta: [[0.35, 'chime', 0.85], [0.9, 'shimmer', 0.5], [1.6, 'pop', 0.6], [2.1, 'pop', 0.6], [2.6, 'pop', 0.6], [3.0, 'chime', 0.7], [3.8, 'pop', 0.9], [4.2, 'blip', 0.6], [5.4, 'chime', 0.55], [6.0, 'chime', 0.5], [9.6, 'riser', 0.45]],
  };
  wins.forEach((w, i) => {
    if (i > 0) {
      cue(w.t0 - 0.3, 'whoosh', 0.85);
      if (i === 2 || i === 7) cue(w.t0, 'thump', 0.85);      // the two whips land as impacts
      if (i === 7) cue(w.t0 - 1.0, 'riser', 0.7);            // the riser peaks on the end card
    }
    for (const [dt, kind, g] of sceneCues[w.id] ?? []) cue(w.t0 + Math.min(dt, w.len - 0.05), kind, g);
  });
  cues.sort((a, b) => a.t - b.t);

  // ── the per-scene context handed to every scene ──────────────────────────────────────────────
  function makeS(ctx, win, t) {
    const tl = t - win.t0;
    const S = {
      ctx, t, tl, len: win.len, nt: clamp(tl / win.len), win,
      W, H, jit: (i, a) => (hash01(i * 1.7 + win.i * 13.3) * 2 - 1) * a,
      beat: (k) => k * BEAT,
      vig: (a) => { vig = a; },
      bake: (key, w, h, draw) => bake(makeTex, key, w, h, draw),
      ui: null,
      headline({ tin = 0.2, tout = null, y = LAYOUT.headlineY, size = 76, align = 'center', x = W / 2, maxW = null, stagger = 0.075 }) {
        const win2 = win;
        const emph = win2.emphasis.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
        kinetic(ctx, {
          text: win2.head, x, y, size, weight: 'InterX', align, t: tl,
          tin, tout, stagger, maxW: maxW ?? Math.min(1500, W - 260), lineH: 1.14,
          emphasis: emph, gradStops: GRAD, exitDur: 0.26,
        });
      },
      labelChip({ tin = 1, y = LAYOUT.labelY, align = 'center', x = W / 2, eyebrow = false }) {
        const v = vis(tl, tin, win.len - 0.3, 0.2);
        if (v.o <= 0.01) return;
        ctx.save();
        ctx.globalAlpha = clamp(v.o) * 0.95;
        ctx.translate(0, v.dy * 0.4);
        ctx.font = T(600, 21);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.26em';
        ctx.textAlign = align; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(win.label, x, y);
        ctx.restore();
      },
      lockup({ cx, cy, scale, t0 }) {
        ctx.save();
        lockup(ctx, { cx, cy, scale, t: tl, t0 });
        ctx.restore();
      },
    };
    return S;
  }

  // ── the signal streak ────────────────────────────────────────────────────────────────────────
  function drawStreak(ctx, t) {
    for (let i = 1; i < wins.length; i++) {
      const b = wins[i].t0;
      const t0 = b - 0.46, t1 = b + 0.30;
      if (t < t0 || t > t1) continue;
      const u = clamp((t - t0) / (t1 - t0));
      const A = ANCHORS[i - 1], Bp = ANCHORS[i];
      const e = u < 0.5 ? outQuint(u * 2) : 1;
      const head = u < 0.5 ? outQuint(u * 2) : 1 - outQuint((u - 0.5) * 2);
      const arcH = 130 * (i % 2 ? 1 : -1);
      const px = (k) => {
        const q = clamp(e * k * 1.35);
        const v = 1 - q;
        return {
          x: v * v * A.x + 2 * v * q * ((A.x + Bp.x) / 2) + q * q * Bp.x,
          y: v * v * A.y + 2 * v * q * ((A.y + Bp.y) / 2 - arcH) + q * q * Bp.y,
        };
      };
      ctx.save();
      ctx.lineCap = 'round';
      for (let k = 0; k < 22; k++) {
        const p0 = px(k / 22), p1 = px((k + 1) / 22);
        const a = (1 - k / 22) * head * 0.95;
        if (a <= 0.01) continue;
        ctx.strokeStyle = linGrad(ctx, p0.x, p0.y, p1.x, p1.y, [
          [0, rgba(hex(C.b4), a)], [0.5, rgba(hex(C.b2), a)], [1, rgba(hex(C.b0), a)],
        ]);
        ctx.lineWidth = lerp(3, 17, 1 - k / 22) * (0.4 + 0.6 * head);
        ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
      }
      const hp = px(1);
      if (head > 0.02) {
        ctx.save();
        ctx.shadowColor = C.b4; ctx.shadowBlur = 40;
        ctx.fillStyle = 'rgba(255,255,255,0.98)';
        ctx.beginPath(); ctx.arc(hp.x, hp.y, 9 * head, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }
  }

  // ── the brand chrome: a progress rule, and a small wordmark that lives in the corner ─────────
  function drawChrome(ctx, t) {
    const p = clamp(t / T_end);
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(0, 0, W, 3);
    ctx.fillStyle = linGrad(ctx, 0, 0, W, 0, GRAD);
    ctx.fillRect(0, 0, W * p, 3);
    ctx.restore();

    const last = wins[wins.length - 1];
    const appear = smoothstep(0.9, 1.4, t) * (1 - smoothstep(last.t0 + 0.2, last.t0 + 0.9, t));
    if (appear > 0.02) {
      ctx.save();
      ctx.globalAlpha = 0.42 * appear;
      wordmark(ctx, { cx: LAYOUT.wordmark.x, y: LAYOUT.wordmark.y, size: 46, t, t0: -10, stagger: 0 });
      ctx.restore();
    }
  }

  // ── drawFrame: the whole film at instant t ───────────────────────────────────────────────────
  function drawScene(ctx, t) {
    vig = 0.45;
    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // background + drifting ambient orbs
    if (bgCanvas) ctx.drawImage(bgCanvas, 0, 0);
    else { ctx.fillStyle = C.void0; ctx.fillRect(0, 0, W, H); }
    for (let i = 0; i < 3; i++) {
      const sp = 42 + i * 26;
      const ox = 620 + i * 380 + Math.sin(t * 0.055 + i * 2.1) * sp;
      const oy = 380 + (i % 2) * 420 + Math.cos(t * 0.047 + i * 1.7) * sp * 0.8;
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = glow(ctx, ox, oy, 460, hex([C.b2, C.b4, C.b0][i]), 0.55);
      ctx.fillRect(ox - 470, oy - 470, 940, 940);
      ctx.restore();
    }

    // the camera
    const z = camZ.at(t), cx2 = camX.at(t), cy2 = camY.at(t);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(z, z);
    ctx.translate(-cx2, -cy2);
    for (const w of wins) {
      if (t < w.t0 - 0.001 || t > w.t1 + 0.001) continue;
      const S = makeS(ctx, w, t);
      SCENES[w.id](S);
    }
    ctx.restore();

    drawStreak(ctx, t);

    // vignette (per scene) + a soft bottom shade so type and panels always sit on depth
    if (vig > 0) {
      ctx.save();
      const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.46, W / 2, H * 0.5, H * 1.06);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(2,4,14,${(vig * 0.8).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    // a much softer bottom shade: at the previous strength it swallowed the eyebrow labels
    ctx.fillStyle = linGrad(ctx, 0, H - 200, 0, H, [[0, 'rgba(2,5,16,0)'], [1, 'rgba(2,5,16,0.34)']]);
    ctx.fillRect(0, H - 200, W, 200);

    drawChrome(ctx, t);
    ctx.restore();
  }

  /**
   * Grain is a per-frame grade, not scene content: it is applied ONCE after the motion-blur
   * accumulation, so 4x subframe sampling never smears it into mush. Stepped on whole frames so a
   * re-render is identical.
   */
  function drawGrade(ctx, t) {
    if (!grainCanvas) return;
    const g0 = Math.round(t * FPS) % 120;
    ctx.save();
    ctx.globalAlpha = 0.5;
    try { ctx.globalCompositeOperation = 'overlay'; } catch { /* older canvas: source-over is fine */ }
    ctx.drawImage(grainCanvas, -(g0 * 3) % 160 - 80, -(g0 * 7) % 160 - 80);
    ctx.restore();
  }

  function drawFrame(ctx, t) { drawScene(ctx, t); drawGrade(ctx, t); }

  return {
    T: T_end, wins, cues, drawFrame, drawScene, drawGrade, initOffscreen,
    get bgReady() { return !!bgCanvas; },
    sceneAt: (t) => wins.find((w) => t >= w.t0 && t < w.t1) ?? wins[wins.length - 1],
    anchorAt: (t) => ANCHORS[wins.indexOf(wins.find((w) => t >= w.t0 && t < w.t1))] ?? ANCHORS[0],
    anchors: ANCHORS,
  };
}
