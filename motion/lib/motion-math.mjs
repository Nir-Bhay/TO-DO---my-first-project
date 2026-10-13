// motion/lib/motion-math.mjs
//
// The pure math the whole film is built from. Rule 3 of the skill: "Springs everywhere,
// a tiny overshoot at most. Closed-form damped spring step responses only — no bouncy easing."
// Rule 3 of the v1 laws: "Determinism. A seek to time T must reproduce byte-identical output."
//
// Everything here is a pure function of time: no state, no timers, no Math.random, no Date.now.
// Because of that this file is importable by both the browser film (film.mjs) and the Node
// QA tests (test/timeline.test.mjs) — the same numbers the audience sees are the numbers the
// tests assert on.

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, x) => a + (b - a) * x;

/** Smooth 0→1 on [a,b]; the only "easing" allowed for non-motion properties (colour, opacity). */
export function smoothstep(a, b, t) {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
}

/** outQuint — used for discrete counters (odometers), never for springs. */
export const outQuint = (x) => 1 - Math.pow(1 - clamp(x), 5);

/**
 * Closed-form damped spring step response, 0 → 1.
 *   w = angular frequency (higher = stiffer/faster)
 *   z = damping ratio (0.72–0.9 = a tiny overshoot, 1.0 = none)
 * This is the exact solution of ẍ + 2ζωẋ + ω²x = ω², so it is a pure function of elapsed
 * time — the whole reason this pipeline can seek to any instant and get the same frame.
 */
export function stepR(tau, { w, z }) {
  if (tau <= 0) return 0;
  if (z >= 1) {
    const x = w * tau;
    return 1 - Math.exp(-x) * (1 + x);
  }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) * (Math.cos(wd * tau) + ((z * w) / wd) * Math.sin(wd * tau));
}

/**
 * A value that changes target many times = the sum of one spring per change.
 * Still a pure function of time, still seekable, still deterministic.
 *
 * `period` makes it loop-aware: an event from the previous cycle is still settling when the
 * film comes back around, so its spring keeps contributing (this is what stops a looping
 * film from snapping when it wraps).
 */
export class Track {
  constructor(v0, period = null) {
    this.v0 = v0;
    this.cur = v0;
    this.ev = [];
    this.period = period;
  }

  /** Issue a new target at time t. A value that must ARRIVE at T is issued ~0.3s early. */
  to(t, v, sp) {
    if (v !== this.cur) {
      this.ev.push({ t, d: v - this.cur, sp });
      this.cur = v;
    }
    return this;
  }

  /** Hard set at t: the value is exactly v for t >= event time (used for non-motion values). */
  setTo(t, v) {
    return this.to(t, v, { w: 60, z: 1 });
  }

  /**
   * Loop-aware evaluation. For a looping film the value at time t is the sum over the current
   * cycle AND the previous one(s) — the skill's "sum the k = -1, -2 periods too". It only
   * converges if ΣΔ over one cycle is 0, which `sumDelta()` lets the tests assert.
   */
  at(t) {
    let v = this.v0;
    for (const e of this.ev) {
      const tau = t - e.t;
      v += e.d * stepR(tau, e.sp); // this cycle (0 before the event fires)
      if (this.period != null) v += e.d * stepR(tau + this.period, e.sp); // the one before it
    }
    return v;
  }

  /** ΣΔ over one cycle. Must be 0 or the loop breathes: the value drifts every time round. */
  sumDelta() {
    return this.ev.reduce((a, e) => a + e.d, 0);
  }

  /** Numeric velocity — needed for cursor lean and trail alpha, still pure f(t). */
  vel(t, h = 1 / 240) {
    return (this.at(t + h) - this.at(t - h)) / (2 * h);
  }
}

/**
 * Content swap with blur (rule 2). Enter on a spring; exit SHORT and EARLY, or the old and new
 * text overlap inside a morphing container. Returns {o: opacity, b: blur px, dy: translateY px}.
 */
export function vis(t, tin, tout = null, dOut = 0.12) {
  const e = stepR(t - tin, { w: 26, z: 1 });
  const x = tout == null ? 0 : clamp((t - tout) / dOut);
  const xo = x * x;
  const o = e * (1 - xo);
  // A slot that is fully out is described by ONE canonical state, whether it has not entered yet
  // or has already left. Without this, a looping film's first and last frames differ in the
  // invisible layers — harmless to the eye, but it means the loop cannot be proven identical.
  if (o <= 0) return { o: 0, b: 10, dy: -10, e };
  return { o, b: (1 - e) * 10 + xo * 10, dy: (1 - e) * 16 - xo * 10, e };
}

/** Spring presets. z ≥ 1 for anything with text on it; 0.72–0.9 where a little life is wanted. */
export const SP = {
  morph: { w: 17, z: 0.86 },
  cam: { w: 13, z: 1.0 },
  text: { w: 26, z: 1.0 },
  soft: { w: 10, z: 0.9 },
  stiff: { w: 30, z: 0.9 },
  follow: { w: 22, z: 0.95 },
  cursor: { w: 19, z: 0.92 },
};

/** Numeric keyframe track (border alpha, shadow strength) — same idea as mixStops for scalars. */
export function mixNum(t, stops) {
  if (t <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [ta, va] = stops[i - 1];
      const [tb, vb] = stops[i];
      return lerp(va, vb, smoothstep(ta, tb, t));
    }
  }
  return last[1];
}

/** Colour keyframe track: linear-ish mixing between stops, smoothstep to avoid corners. */
export function mixStops(t, stops) {
  if (t <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (t >= last[0]) return last[1];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [ta, va] = stops[i - 1];
      const [tb, vb] = stops[i];
      const k = smoothstep(ta, tb, t);
      return [lerp(va[0], vb[0], k), lerp(va[1], vb[1], k), lerp(va[2], vb[2], k)];
    }
  }
  return last[1];
}

export const rgb = ([r, g, b], a = 1) =>
  a >= 1 ? `rgb(${r | 0},${g | 0},${b | 0})` : `rgba(${r | 0},${g | 0},${b | 0},${+a.toFixed(3)})`;

export const css = {
  '#FAFAFB': [250, 250, 251],
  '#FFFFFF': [255, 255, 255],
  '#F1F1F6': [241, 241, 246],
  '#E7E7EF': [231, 231, 239],
  '#DBDBE6': [219, 219, 230],
  '#787E8C': [120, 126, 140],
  '#111827': [17, 24, 39],
  '#4F46E5': [79, 70, 229],
  '#7C3AED': [124, 58, 237],
  '#14B8A6': [20, 184, 166],
  '#0B1020': [11, 16, 32],
};

/** Deterministic "scatter" — derived from an index, never from Math.random (law 3). */
export function hash01(i) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Blink that is a pure function of time — no CSS animation (which a renderer cannot seek). */
export const blink = (t, period = 0.8, duty = 0.5) => ((t % period) + period) % period < period * duty;
