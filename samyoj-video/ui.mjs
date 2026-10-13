// samyoj-video/ui.mjs
//
// The film's UI atoms. Everything on screen is built from these: chat bubbles, cards, chips,
// avatars, ticks, rings, bars, toggles, cursors. They are drawn, never screenshotted — so every
// element can be animated, re-coloured and re-timed, and nothing is lifted from the product.
import {
  rr, linGrad, glow, glass, rgba, hex, clamp, lerp, stepR, SP, withShadow, smoothstep, mixRgb,
} from './lib/motion.mjs';
import { C, F, GRAD, WA_G, WA_G as WA } from './brand.mjs';

const T = (w, s) => `${w === 900 ? 900 : w === 800 ? 800 : w === 600 ? 600 : 500} ${s}px ${w === 900 ? F.black : w === 800 ? F.x : w === 600 ? F.semi : F.med}`;

/** A WhatsApp-style chat bubble, with an optional tail, ticks and time stamp. */
export function bubble(ctx, o) {
  const {
    x, y, w, h, text, size = 30, r = 30, align = 'left', mine = false, t = 0,
    appear = 1, ticks = 0, tickGrow = 1, time = null, fade = 1, pad = 30, waGreen = false,
  } = o;
  const e = stepR(appear, { w: 26, z: 0.86 });
  if (e <= 0.005) return;
  ctx.save();
  ctx.globalAlpha = clamp(fade);
  const cx = x + (1 - e) * (align === 'left' ? -26 : 26);
  ctx.translate(cx, y);
  ctx.scale(lerp(0.94, 1, e), lerp(0.94, 1, e));
  const bgCol = mine
    ? (waGreen ? linGrad(ctx, 0, 0, w, h, WA) : linGrad(ctx, 0, 0, w, h, GRAD))
    : 'rgba(255,255,255,0.965)';
  withShadow(ctx, { col: [4, 10, 30], a: 0.42, blur: 34, y: 14 }, () => {
    rr(ctx, 0, 0, w, h, r);
    ctx.fillStyle = bgCol;
    ctx.fill();
  });
  // tail
  ctx.beginPath();
  if (align === 'left') {
    ctx.moveTo(10, h - 16); ctx.lineTo(-8, h - 2); ctx.lineTo(14, h + 4 - 14);
  } else {
    ctx.moveTo(w - 10, h - 16); ctx.lineTo(w + 8, h - 2); ctx.lineTo(w - 14, h + 4 - 14);
  }
  ctx.closePath();
  ctx.fillStyle = mine ? (waGreen ? rgba(hex(C.wa), 1) : rgba(hex(C.b0), 1)) : 'rgba(255,255,255,0.965)';
  ctx.fill();
  if (text) {
    ctx.font = T(600, size);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = mine ? 'rgba(255,255,255,0.98)' : rgba(hex(C.ink), 0.92);
    const lines = text.split('\n');
    lines.forEach((ln, i) => ctx.fillText(ln, pad, pad - 2 + i * size * 1.3));
  }
  if (ticks > 0) {
    const tx = w - 62, ty = h - 30;
    ctx.save();
    ctx.globalAlpha = clamp(tickGrow);
    ctx.strokeStyle = mine ? '#E8FFF2' : C.wa;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const one = (dx) => {
      ctx.beginPath();
      ctx.moveTo(tx + dx - 7, ty);
      ctx.lineTo(tx + dx - 2, ty + 5.5);
      ctx.lineTo(tx + dx + 8, ty - 7);
      ctx.stroke();
    };
    if (ticks >= 1) one(0);
    if (ticks >= 2) one(14);
    ctx.restore();
  }
  if (time) {
    ctx.font = T(500, size * 0.62);
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = mine ? 'rgba(255,255,255,0.72)' : rgba(hex(C.ink3), 1);
    ctx.fillText(time, w - pad, h - pad * 0.6);
  }
  ctx.restore();
}

/** Three bouncing dots — the universal "the agent is thinking" tell. */
export function typingDots(ctx, { x, y, t = 0, size = 12, col = C.b0, count = 3, gap = 22, speed = 0.42 }) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const ph = t / speed - i * 0.22;
    const k = Math.max(0, Math.sin(ph * Math.PI * 2)) ** 2;
    ctx.globalAlpha = 0.35 + 0.65 * k;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(x + i * gap, y - k * size * 0.7, size * (0.75 + 0.25 * k), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** A circular avatar with initials, optional online dot. */
export function avatar(ctx, { x, y, r = 26, initials = 'PS', hue = 0, online = false, a = 1, ring = null }) {
  ctx.save();
  ctx.globalAlpha = a;
  const pal = [[C.b0, C.b3], [C.b4, C.b2], ['#FF8A4C', '#FF4C86'], ['#22C55E', '#0EA5E9'], ['#A855F7', '#2D6BFF']][hue % 5];
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.font = T(600, r * 0.86);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.fillText(initials, x, y + 1);
  if (ring) {
    ctx.strokeStyle = ring; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(x, y, r + 3.5, 0, Math.PI * 2); ctx.stroke();
  }
  if (online) {
    ctx.fillStyle = C.wa;
    ctx.strokeStyle = 'rgba(6,13,34,1)';
    ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.arc(x + r * 0.72, y + r * 0.72, r * 0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** Progress ring (used for "Sending…", the AI's latency chip and the logo's rhythm). */
export function ring(ctx, { x, y, r = 26, p = 0, w = 6, col = C.wa, track = 'rgba(255,255,255,0.16)', cap = 'round' }) {
  ctx.save();
  ctx.lineWidth = w;
  ctx.strokeStyle = track;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  if (p > 0) {
    ctx.strokeStyle = col;
    ctx.lineCap = cap;
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p));
    ctx.stroke();
  }
  ctx.restore();
}

/** A drawn checkmark (stroke dash), for every "done" moment in the film. */
export function check(ctx, { x, y, s = 20, p = 1, col = '#fff', w = 4.2 }) {
  if (p <= 0.001) return;
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const pts = [[-s * 0.5, s * 0.05], [-s * 0.12, s * 0.42], [s * 0.55, -s * 0.4]];
  const segs = [
    [pts[0], pts[1]], [pts[1], pts[2]],
  ];
  const total = segs.reduce((a, [a1, b1]) => a + Math.hypot(b1[0] - a1[0], b1[1] - a1[1]), 0);
  let drawn = total * clamp(p);
  ctx.beginPath();
  ctx.moveTo(x + pts[0][0], y + pts[0][1]);
  for (const [a1, b1] of segs) {
    const len = Math.hypot(b1[0] - a1[0], b1[1] - a1[1]);
    if (drawn <= 0) break;
    const k = Math.min(1, drawn / len);
    ctx.lineTo(x + lerp(a1[0], b1[0], k), y + lerp(a1[1], b1[1], k));
    drawn -= len;
  }
  ctx.stroke();
  ctx.restore();
}

/** A card: the film's main container. Dark or light, with the glass treatment. */
export function card(ctx, o) {
  const { x, y, w, h, r = 28, dark = true, a = 0.92, appear = 1, scale = 1, blur = 0, fade = 1, tint = [255, 255, 255] } = o;
  const e = stepR(appear, SP.card);
  if (e <= 0.004) return { e, rr: () => {} };
  ctx.save();
  ctx.globalAlpha = clamp(fade);
  const sc = lerp(0.9, 1, e) * scale;
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(sc, sc);
  ctx.translate(-(x + w / 2), -(y + h / 2));
  if (blur > 0.1) ctx.filter = `blur(${blur}px)`;
  withShadow(ctx, { col: [3, 8, 24], a: dark ? 0.5 : 0.3, blur: 46, y: 20 }, () => {
    glass(ctx, x, y, w, h, r, { a, dark, tint });
  });
  ctx.filter = 'none';
  ctx.restore();
  return { e, rr: () => { rr(ctx, x, y, w, h, r); } };
}

/** Stat row: big number + caption, with an odometer roll driven by `p`. */
export function stat(ctx, o) {
  const { x, y, value, suffix = '', label, p = 1, size = 88, align = 'center', col = null, sub = null, subCol = null } = o;
  const e = clamp(p);
  const v = value * (1 - Math.pow(1 - e, 5));
  ctx.save();
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  const txt = Number.isInteger(value) && value > 100
    ? Math.round(v).toLocaleString('en-US') + suffix
    : (Math.abs(v) >= 100 ? Math.round(v) : v.toFixed(1)) + suffix;
  ctx.font = T(900, size);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.03em';
  ctx.shadowColor = 'rgba(6,12,32,0.6)';
  ctx.shadowBlur = 26; ctx.shadowOffsetY = 8;
  ctx.fillStyle = col ?? 'rgba(255,255,255,0.98)';
  ctx.fillText(txt, x, y);
  if (label) {
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.font = T(600, Math.round(size * 0.235));
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(label.toUpperCase(), x, y + size * 0.44);
  }
  if (sub) {
    ctx.font = T(600, Math.round(size * 0.26));
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.01em';
    ctx.fillStyle = subCol ?? rgba(hex(C.wa), 0.95);
    ctx.fillText(sub, x, y + size * 0.86);
  }
  ctx.restore();
}

/** A minimal cursor — the film's hands. Press-scale and a click ripple included. */
export function cursor(ctx, { x, y, scale = 1, lean = 0, ripple = -1, press = 1 }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(lean);
  ctx.scale(scale * press, scale * press);
  if (ripple >= 0 && ripple <= 1) {
    const k = ripple;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.85;
    ctx.strokeStyle = C.b0;
    ctx.lineWidth = 5 * (1 - k) + 1;
    ctx.beginPath(); ctx.arc(0, 0, 18 + 86 * k, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  ctx.shadowColor = 'rgba(3,7,20,0.6)';
  ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 30);
  ctx.lineTo(7.5, 23);
  ctx.lineTo(12.5, 35);
  ctx.lineTo(18, 32.5);
  ctx.lineTo(13, 21);
  ctx.lineTo(23, 19.5);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(10,16,40,0.85)';
  ctx.stroke();
  ctx.restore();
}

/** A toggle with an edge-split stretch (the knob's two edges ride different springs). */
export function toggle(ctx, { x, y, on = 1, t = 0, w = 96, h = 48, label = null }) {
  const kw = h - 8;
  const onE = clamp(on);
  const track = mixRgb(hex('#2A3358'), hex(C.wa), onE);
  ctx.save();
  rr(ctx, x, y - h / 2, w, h, h / 2);
  ctx.fillStyle = rgba(track, 0.9);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  const cx = x + kw / 2 + 4 + (w - kw - 8) * onE;
  ctx.fillStyle = '#fff';
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
  ctx.beginPath(); ctx.arc(cx, y, kw / 2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (label) {
    ctx.save();
    ctx.font = T(600, 22);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = onE > 0.5 ? rgba(hex(C.wa), 1) : 'rgba(255,255,255,0.5)';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';
    ctx.fillText(label, x + w + 18, y + 1);
    ctx.restore();
  }
}

/** Bar chart with an animated draw-on, optional line overlay. */
export function bars(ctx, o) {
  const { x, y, w, h, n = 9, p = 1, col = null, base = 'rgba(255,255,255,0.12)', gap = 14, radius = 8, heights = null } = o;
  const bw = (w - gap * (n - 1)) / n;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const target = heights ? heights[i] : 0.28 + 0.72 * Math.pow((i + 1) / n, 1.5) * (0.72 + 0.28 * ((i * 37) % 11) / 11);
    const local = clamp((p - i / (n * 1.35)) * 2.1);
    const bh = h * target * (1 - Math.pow(1 - local, 4));
    const bx = x + i * (bw + gap);
    rr(ctx, bx, y + h - bh, bw, Math.max(2, bh), radius);
    ctx.fillStyle = base;
    ctx.fill();
    if (local > 0.01) {
      ctx.fillStyle = col ?? linGrad(ctx, bx, y + h - bh, bx + bw, y + h, [[0, C.b0], [1, C.b2]]);
      rr(ctx, bx, y + h - bh, bw, Math.max(2, bh), radius);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A stepper (order tracking): three nodes with a progress line. */
export function stepper(ctx, { x, y, w, p = 1, steps = ['Confirmed', 'Shipped', 'Delivered'], col = C.wa, size = 22 }) {
  const n = steps.length;
  const step = w / (n - 1);
  const fill = clamp(p) * (n - 1);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 3.4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  ctx.strokeStyle = col;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.min(w, step * fill), y); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const cx = x + step * i;
    const on = fill >= i - 0.02;
    ctx.beginPath(); ctx.arc(cx, y, on ? 12 : 9, 0, Math.PI * 2);
    ctx.fillStyle = on ? col : 'rgba(20,28,56,1)';
    ctx.fill();
    ctx.strokeStyle = on ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = T(600, size);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = on ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.42)';
    ctx.fillText(steps[i], cx, y + 26);
  }
  ctx.restore();
}

/** A sparkle burst — used only for genuine wins (a sale, a delivered message). */
export function sparkle(ctx, { x, y, t = 0, n = 8, r0 = 10, r1 = 60, col = C.wa, seed = 0, life = 0.7 }) {
  if (t < 0 || t > life) return;
  const k = t / life;
  ctx.save();
  ctx.strokeStyle = rgba(hex(col), (1 - k) * 0.9);
  ctx.lineWidth = 3 * (1 - k) + 0.6;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const rr0 = r0 + (r1 - r0) * k * (0.7 + 0.3 * ((i * 17) % 7) / 7);
    const rr1 = rr0 + 16 * (1 - k);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0);
    ctx.lineTo(x + Math.cos(a) * rr1, y + Math.sin(a) * rr1);
    ctx.stroke();
  }
  ctx.restore();
}

// atoms that live in lib/motion.mjs are re-exported here, so a scene only ever imports one thing
export { chip, label } from './lib/motion.mjs';

export const UI = { bubble, typingDots, avatar, ring, check, card, stat, cursor, toggle, bars, stepper, sparkle };
