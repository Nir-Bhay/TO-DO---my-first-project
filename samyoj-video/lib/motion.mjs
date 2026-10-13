// samyoj-video/lib/motion.mjs
//
// The motion vocabulary for the Samyoj film. Every value in the film is a pure function of time:
// no Math.random, no Date.now, no CSS-style transitions. Seek to any instant and you get the same
// pixels, which is what makes a 60-second render deterministic and QA-able.
//
// The discipline is the motion-launch-video skill's: springs (closed-form damped steps, never
// bouncy easing), content swaps that exit short and early, and deterministic scatter derived from
// an index. Adapted here to a canvas renderer.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, x) => a + (b - a) * x;
export const invLerp = (a, b, v) => (b - a === 0 ? 0 : (v - a) / (b - a));
export const smoothstep = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
export const outQuint = (x) => 1 - Math.pow(1 - clamp(x), 5);
export const outCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
export const inOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const pulse = (t, at, w = 0.25) => Math.exp(-Math.pow((t - at) / w, 2));

/** Closed-form damped spring step response, 0 → 1 (the film's only "easing" for anything moving). */
export function stepR(tau, { w = 22, z = 0.9 } = {}) {
  if (tau <= 0) return 0;
  if (z >= 1) { const x = w * tau; return 1 - Math.exp(-x) * (1 + x); }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}

/** Many target changes = the sum of one spring per change — still a pure function of time. */
export class Track {
  constructor(v0, period = null) { this.v0 = v0; this.cur = v0; this.ev = []; this.period = period; }
  to(t, v, sp) { if (v !== this.cur) { this.ev.push({ t, d: v - this.cur, sp }); this.cur = v; } return this; }
  setTo(t, v) { return this.to(t, v, { w: 90, z: 1 }); }
  at(t) {
    let v = this.v0;
    for (const e of this.ev) {
      const tau = t - e.t;
      v += e.d * stepR(tau, e.sp);
      if (this.period) v += e.d * stepR(tau + this.period, e.sp);
    }
    return v;
  }
  vel(t, h = 1 / 240) { return (this.at(t + h) - this.at(t - h)) / (2 * h); }
  sumDelta() { return this.ev.reduce((a, e) => a + e.d, 0); }
}

/** Spring presets. z = 1 wherever text or the camera is involved (no overshoot on type). */
export const SP = {
  morph: { w: 18, z: 0.88 },
  cam: { w: 12, z: 1.0 },
  text: { w: 28, z: 1.0 },
  soft: { w: 11, z: 0.92 },
  stiff: { w: 34, z: 0.9 },
  card: { w: 21, z: 0.85 },
  pop: { w: 42, z: 0.72 },
  ring: { w: 30, z: 1.0 },
};

/**
 * Blur swap. Content enters on a spring and leaves SHORT and early, with blur paired to opacity —
 * without this, old and new text overlap inside a morphing container and read as mush.
 * A fully-exited slot reports one canonical state, so a looping film's first and last frames match.
 */
export function vis(t, tin, tout = null, dOut = 0.16, dyIn = 22) {
  const e = stepR(t - tin, SP.text);
  const x = tout == null ? 0 : clamp((t - tout) / dOut);
  const xo = x * x;
  const o = e * (1 - xo);
  if (o <= 0) return { o: 0, b: 12, dy: -12, e };
  return { o, b: (1 - e) * 12 + xo * 12, dy: (1 - e) * dyIn - xo * 14, e };
}

/** Deterministic scatter — from an index, never from a random source. */
export function hash01(i) { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export const jitter = (i, amp) => (hash01(i) * 2 - 1) * amp;

export const blink = (t, period = 0.9, duty = 0.55) => ((t % period) + period) % period < period * duty;

// ── colour ─────────────────────────────────────────────────────────────────────────────────────
export const hex = (h) => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const rgba = ([r, g, b], a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${+clamp(a, 0, 1).toFixed(4)})`;
export const mixRgb = (a, b, x) => [lerp(a[0], b[0], x), lerp(a[1], b[1], x), lerp(a[2], b[2], x)];

export function mixStops(t, stops) {
  if (t <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [ta, va] = stops[i - 1], [tb, vb] = stops[i];
      return mixRgb(va, vb, smoothstep(ta, tb, t));
    }
  }
  return last[1];
}
export function mixNum(t, stops) {
  if (t <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [ta, va] = stops[i - 1], [tb, vb] = stops[i];
      return lerp(va, vb, smoothstep(ta, tb, t));
    }
  }
  return last[1];
}

// ── canvas drawing helpers ──────────────────────────────────────────────────────────────────────
export function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

export function linGrad(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) g.addColorStop(clamp(o), c);
  return g;
}

export function glow(ctx, cx, cy, r, col, a = 1) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, rgba(col, a));
  g.addColorStop(0.55, rgba(col, a * 0.35));
  g.addColorStop(1, rgba(col, 0));
  return g;
}

/**
 * Expensive once, cheap forever.
 *
 * `ctx.filter = 'blur(Npx)'` costs skia a full layer allocation plus a filter pass EVERY time it is
 * used — a blurred 500px panel measured 30-50ms, and the AI scene used three per frame. Shapes that
 * do not change (only their offset and alpha do) belong in a texture: draw them once, then blit.
 * The cache is keyed by whatever the caller needs to distinguish variants, and it survives the
 * whole render because it lives at module scope.
 */
const BAKE = new Map();
export function bake(make, key, w, h, draw) {
  const hit = BAKE.get(key);
  if (hit) return hit;
  const c = make(Math.ceil(w), Math.ceil(h));
  draw(c.getContext('2d'));
  BAKE.set(key, c);
  return c;
}

export function withShadow(ctx, { col = [10, 16, 40], a = 0.5, blur = 40, y = 18 }, fn) {
  ctx.save();
  ctx.shadowColor = rgba(col, a);
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
  fn();
  ctx.restore();
}

/** Frosted "liquid glass" panel: gradient body, hairline border, top highlight, inner shade. */
export function glass(ctx, x, y, w, h, r, { a = 0.9, tint = [255, 255, 255], dark = false } = {}) {
  ctx.save();
  rr(ctx, x, y, w, h, r);
  const g = linGrad(ctx, x, y, x, y + h, [
    [0, dark ? `rgba(18,26,52,${a})` : `rgba(${tint[0]},${tint[1]},${tint[2]},${a})`],
    [1, dark ? `rgba(11,17,38,${a})` : `rgba(${tint[0] - 8},${tint[1] - 8},${tint[2] - 4},${a * 0.94})`],
  ]);
  ctx.fillStyle = g;
  ctx.fill();
  // inner shade at the bottom, highlight at the top: what makes a flat panel read as glass
  ctx.clip();
  ctx.fillStyle = linGrad(ctx, x, y + h - h * 0.5, x, y + h, dark
    ? [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.22)']]
    : [[0, 'rgba(16,24,60,0)'], [1, 'rgba(16,24,60,0.07)']]);
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = dark
    ? linGrad(ctx, x, y, x, y + h * 0.5, [[0, 'rgba(255,255,255,0.10)'], [1, 'rgba(255,255,255,0)']])
    : linGrad(ctx, x, y, x, y + h * 0.42, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(x, y, w, h * 0.5);
  ctx.restore();
  ctx.save();
  rr(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, r);
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  rr(ctx, x + 2.5, y + 2.5, w - 5, h - 5, Math.max(0, r - 2));
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(20,28,64,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** Draw into an offscreen buffer and composite back, optionally blurred — depth of field. */
export function layer(ctx, W, H, { blur = 0, alpha = 1, dx = 0, dy = 0 }, draw, make) {
  const off = make(W, H);
  const octx = off.getContext('2d');
  draw(octx);
  ctx.save();
  if (blur > 0) ctx.filter = `blur(${blur}px)`;
  ctx.globalAlpha = alpha;
  ctx.drawImage(off, dx, dy);
  ctx.restore();
}

export function textWidth(ctx, str, font) {
  ctx.save(); ctx.font = font; const w = ctx.measureText(str).width; ctx.restore();
  return w;
}

/** Word-wrap into lines, preserving the words so they can be animated individually. */
export function wrapWords(ctx, text, font, maxW) {
  ctx.save(); ctx.font = font;
  const words = text.split(/\s+/);
  const lines = [[]];
  let w = 0;
  for (const word of words) {
    const ww = ctx.measureText(word + ' ').width;
    if (w + ww > maxW && lines[lines.length - 1].length) { lines.push([]); w = 0; }
    lines[lines.length - 1].push({ word, w: ctx.measureText(word).width });
    w += ww;
  }
  ctx.restore();
  return lines;
}

/**
 * Kinetic type. Words arrive one after another along the beat, each on its own spring with a blur
 * hand-off; on exit the whole line leaves together, short and early. Emphasised words take the
 * brand gradient. This is the film's voice — 2026's motion trend where type is the main character.
 */
export function kinetic(ctx, opts) {
  const {
    text, x, y, size = 76, weight = 'InterX', align = 'center', t, tin, tout = null,
    stagger = 0.075, maxW = 1500, lineH = 1.16, emphasis = [], gradStops = null,
    exitDur = 0.22, shadow = true, letterSpacing = '-0.02em',
  } = opts;
  const font = `${weight === 'InterBlack' ? 900 : weight === 'InterX' ? 800 : weight === 'InterSemi' ? 600 : 500} ${size}px ${weight}`;
  // hard breaks first, then wrap each paragraph — so an authored line break is respected
  const lines = text.split('\n').flatMap((para) => wrapWords(ctx, para, font, maxW));
  const emph = new Set(emphasis.map((s) => s.toLowerCase()));
  let idx = 0;
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = letterSpacing;
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const total = line.reduce((a, w) => a + w.w, 0) + (line.length - 1) * size * 0.26;
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    const baseY = y + li * size * lineH;
    for (const { word, w } of line) {
      const v = vis(t, tin + idx * stagger, tout, exitDur, 26);
      if (v.o > 0.002) {
        const wx = cx + (align === 'center' ? 0 : 0);
        ctx.save();
        ctx.globalAlpha = clamp(v.o);
        if (v.b > 0.08) ctx.filter = `blur(${v.b.toFixed(2)}px)`;
        const dy = v.dy;
        if (shadow) { ctx.shadowColor = 'rgba(4,8,24,0.55)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8; }
        const isEmph = emph.has(word.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (isEmph && gradStops) {
          ctx.fillStyle = linGrad(ctx, wx - size, baseY - size, wx + w + size * 0.4, baseY + size * 0.35, gradStops);
        } else {
          ctx.fillStyle = 'rgba(255,255,255,0.97)';
        }
        ctx.fillText(word, wx, baseY + dy);
        ctx.restore();
      }
      cx += w + size * 0.26;
      idx++;
    }
  }
  ctx.restore();
}

export function kineticHeight(ctx, text, size, weight, maxW, lineH = 1.16) {
  const font = `${weight === 'InterBlack' ? 900 : weight === 'InterX' ? 800 : weight === 'InterSemi' ? 600 : 500} ${size}px ${weight}`;
  const lines = text.split('\n').flatMap((para) => wrapWords(ctx, para, font, maxW));
  return lines.length * size * lineH;
}

/** Small uppercase label chip — the film's annotation layer (UI-style, letterspaced). */
export function label(ctx, { text, x, y, size = 20, col = 'rgba(255,255,255,0.62)', align = 'center', weight = 'InterSemi', spacing = '0.26em' }) {
  ctx.save();
  ctx.font = `600 ${size}px ${weight}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** A pill chip: the film's most reusable UI atom. */
export function chip(ctx, { x, y, text, size = 20, pad = 18, h = 40, col = 'rgba(255,255,255,0.92)', bg = 'rgba(255,255,255,0.10)', border = 'rgba(255,255,255,0.20)', align = 'center', weight = 'InterSemi', spacing = '0.02em' }) {
  ctx.save();
  ctx.font = `600 ${size}px ${weight}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = spacing;
  const w = ctx.measureText(text).width + pad * 2;
  const px = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  rr(ctx, px, y - h / 2, w, h, h / 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = border; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = col;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, px + w / 2, y + 1);
  ctx.restore();
  return w;
}

/** Deterministic grain tile — translated by whole pixels derived from the playhead. */
export function makeGrain(W, H, size = 160) {
  const d = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < d.length; i += 4) {
    const v = 128 + Math.round((hash01(i * 1.7) - 0.5) * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 13;
  }
  return { data: d, size };
}

export const ease = { outQuint, outCubic, outExpo, inOutCubic, smoothstep };
