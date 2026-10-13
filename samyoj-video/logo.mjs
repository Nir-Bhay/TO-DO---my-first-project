// samyoj-video/logo.mjs
//
// The Samyoj mark, drawn as vectors so it can animate: a gradient ring with a sparkle in its gap,
// three people inside it, and a cupped hand carrying them — the logo's own story, which happens to
// be the film's story too (people, held by the product).
//
// If the official vector is available, drop it in as `assets/logo.svg|png` and set USE_ASSET=true:
// the film then composites the real mark instead of this recreation. Everything else is unchanged.
import { rr, linGrad, rgba, hex, clamp, lerp, stepR, SP, withShadow, glow, outQuint } from './lib/motion.mjs';
import { C, GRAD, F } from './brand.mjs';

export const USE_ASSET = false; // ← flip to true after adding assets/logo.png (see README)

const A = (deg) => (deg * Math.PI) / 180;

/** The gradient used by the emblem: violet at the top-left, blue through the middle, cyan at the end. */
const emblemGrad = (ctx, cx, cy, size) => {
  const g = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
  g.addColorStop(0, C.b2);   // violet
  g.addColorStop(0.42, C.b0); // blue
  g.addColorStop(1, C.b4);   // cyan
  return g;
};

/**
 * The emblem. `draw` (0→1) draws the ring on, springs the people up, and pops the sparkle — so the
 * mark can assemble itself on screen instead of just appearing.
 */
export function emblem(ctx, { cx, cy, size, t = 0, draw = 1, alpha = 1, glowA = 0.55, asset = null }) {
  if (asset) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const a = ctx.createPattern ? null : null;
    ctx.drawImage(asset, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
    return;
  }
  const R = size / 2;
  const ring = R * 0.13;         // ring thickness
  const rMid = R - ring / 2 - R * 0.02;
  ctx.save();
  ctx.globalAlpha = alpha;

  // aura: the mark lights its own air (cheap, and it sells "premium" on a dark ground)
  if (glowA > 0) {
    ctx.save();
    ctx.globalAlpha = alpha * glowA * 0.5;
    ctx.fillStyle = glow(ctx, cx, cy, R * 2.05, hex(C.b2), 0.42);
    ctx.fillRect(cx - R * 2.1, cy - R * 2.1, R * 4.2, R * 4.2);
    ctx.restore();
  }

  // ── the ring: 320°, with the gap at 1–2 o'clock where the sparkle lives ──────────────────────
  const gapMid = -52;            // degrees, canvas space (0 = east, negative = up)
  const sweep = 316;
  const start = gapMid + (360 - sweep) / 2;
  const p = clamp(draw);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = ring;
  ctx.strokeStyle = emblemGrad(ctx, cx, cy, size);
  ctx.beginPath();
  ctx.arc(cx, cy, rMid, A(start), A(start + sweep * outQuint(p)), false);
  ctx.stroke();
  // a soft light-side highlight so the ring reads as a solid object
  ctx.lineWidth = ring * 0.34;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(cx, cy, rMid - ring * 0.26, A(start + 26), A(start + 96 * outQuint(p)), false);
  ctx.stroke();
  ctx.restore();

  // ── the sparkle in the gap ───────────────────────────────────────────────────────────────────
  const sp = stepR(p - 0.55, SP.pop);
  if (sp > 0.01) {
    ctx.save();
    ctx.translate(cx + Math.cos(A(gapMid)) * (rMid + ring * 0.15), cy + Math.sin(A(gapMid)) * (rMid + ring * 0.15));
    ctx.rotate(A(-14));
    ctx.scale(sp, sp);
    const sr = ring * 0.86;
    ctx.fillStyle = linGrad(ctx, -sr, -sr, sr, sr, [[0, '#C08CFF'], [0.5, C.b2], [1, C.b3]]);
    ctx.beginPath();
    const pts = 4;
    for (let i = 0; i < pts * 2; i++) {
      const a = (Math.PI / pts) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? sr : sr * 0.3;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── three people, held inside the ring ───────────────────────────────────────────────────────
  const ppl = stepR(p - 0.22, { w: 20, z: 0.82 });
  if (ppl > 0.01) {
    const person = (px, py, s, a, g0, g1) => {
      ctx.save();
      ctx.globalAlpha = alpha * a;
      ctx.translate(px, py);
      ctx.scale(s, s);
      const g = ctx.createLinearGradient(0, -R * 0.3, 0, R * 0.3);
      g.addColorStop(0, g0); g.addColorStop(1, g1);
      ctx.fillStyle = g;
      const hr = R * 0.128;
      ctx.beginPath(); ctx.arc(0, -R * 0.235, hr, 0, Math.PI * 2); ctx.fill();
      rr(ctx, -R * 0.2, -R * 0.075, R * 0.4, R * 0.34, R * 0.19);
      ctx.fill();
      ctx.restore();
    };
    // back two first (smaller, dimmer), then the front one over them
    person(cx - R * 0.3, cy + R * 0.1 + (1 - ppl) * R * 0.12, 0.78 * ppl + 0.22, 0.86, C.b0, '#2F4BE8');
    person(cx + R * 0.3, cy + R * 0.1 + (1 - ppl) * R * 0.12, 0.78 * ppl + 0.22, 0.86, C.b4, C.b0);
    person(cx, cy + R * 0.02 + (1 - ppl) * R * 0.14, 0.94 * ppl + 0.06, 1, C.b3, C.b2);
  }

  // ── the cupped hand: the mark's promise, and the film's ──────────────────────────────────────
  const hp = stepR(p - 0.38, { w: 17, z: 0.86 });
  if (hp > 0.01) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy + R * 0.16);
    ctx.lineWidth = ring * 0.92;
    ctx.lineCap = 'round';
    ctx.strokeStyle = emblemGrad(ctx, -R, 0, R, R * 0.9);
    ctx.beginPath();
    // the hand's palm-arc, hugging the people from below-right
    const a0 = A(115), a1 = A(115 + 128 * outQuint(hp));
    ctx.arc(0, 0, R * 0.62, a0, a1, false);
    ctx.stroke();
    // the thumb/fingers tip, a rounded hook at the end of the arc
    const ex = Math.cos(a1) * R * 0.62, ey = Math.sin(a1) * R * 0.62;
    ctx.lineWidth = ring * 0.74;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + Math.cos(a1 - 0.5) * R * 0.16, ey + Math.sin(a1 - 0.5) * R * 0.16);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

/**
 * The wordmark: `samyoj`, with the y carried in the brand gradient and the j's dot as a lit pixel.
 * Letters spring in from below with a blur hand-off and a per-letter stagger.
 */
export function wordmark(ctx, { cx, y, size = 150, t = 0, t0 = 0, stagger = 0.045, alpha = 1, color = 'rgba(255,255,255,0.98)', asset = null }) {
  const text = 'samyoj';
  const font = `900 ${size}px ${F.black}`;
  ctx.save();
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-size * 0.035}px`;
  const total = ctx.measureText(text).width;
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${-size * 0.035}px`;

  let x = cx - total / 2;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const w = ctx.measureText(ch).width;
    const v = t - (t0 + i * stagger);
    const e = stepR(v, { w: 26, z: 0.86 });
    if (e > 0.005) {
      ctx.save();
      ctx.globalAlpha = alpha * clamp(e);
      // A blur of ZERO is not free: any non-'none' filter makes skia allocate a layer and run the
      // filter pipeline, which cost 30ms per letter — 180ms per frame once the wordmark is settled.
      // The blur only exists to hand the letter off during its entrance, so it is only set then.
      const b = (1 - e) * 14;
      if (b > 0.15) ctx.filter = `blur(${b.toFixed(2)}px)`;
      if (e < 0.999) {
        ctx.shadowColor = 'rgba(60,90,255,0.5)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = e * 2;
      }
      const dy = (1 - e) * size * 0.4;
      if (ch === 'y') {
        // the y is the product's arrow: gradient, always
        ctx.fillStyle = linGrad(ctx, x, y - size, x + w, y + size * 0.3,
          [[0, C.b0], [0.4, C.b2], [1, C.b3]]);
      } else {
        ctx.fillStyle = color;
      }
      ctx.fillText(ch, x, y + dy);
      ctx.restore();
    }
    x += w;
  }
  ctx.restore();

  if (asset) return;
  // the j's dot, relit in the brand gradient (it sits above the x-height, near the j's stem)
  const jx = (() => {
    ctx.save(); ctx.font = font;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${-size * 0.035}px`;
    const w = ctx.measureText('samyoj').width;
    const before = ctx.measureText('samy').width;
    const jw = ctx.measureText('j').width;
    ctx.restore();
    return { w, before, jw };
  })();
  const dj = stepR(t - (t0 + (text.length - 1) * stagger) - 0.18, SP.pop);
  if (dj > 0.01) {
    const dotCx = cx - jx.w / 2 + jx.before + jx.jw * 0.52;
    const dotCy = y - size * 0.72;
    const r = size * 0.062 * (0.4 + 0.6 * dj);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = linGrad(ctx, dotCx - r, dotCy - r, dotCx + r, dotCy + r, [[0, C.b3], [0.5, C.b2], [1, C.b0]]);
    ctx.shadowColor = 'rgba(123,47,247,0.85)';
    ctx.shadowBlur = 26 * dj;
    ctx.beginPath(); ctx.arc(dotCx, dotCy, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

/** The end-card lockup: emblem, wordmark, tagline, CTA button. */
export function lockup(ctx, { cx, cy, scale = 1, t = 0, t0 = 0, asset = null, showCta = 1, ctaText = 'Start your free trial' }) {
  const S = scale;
  const e = stepR(t - t0, { w: 14, z: 1 });
  emblem(ctx, { cx, cy: cy - 210 * S, size: 260 * S, t, draw: clamp(e * 1.15), alpha: clamp(e), glowA: 0.7, asset });
  wordmark(ctx, { cx, y: cy + 96 * S, size: 168 * S, t, t0: t0 + 0.5, stagger: 0.05, asset });
  // tagline with the flanking rules from the logo
  const tv = stepR(t - (t0 + 1.15), SP.text);
  if (tv > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(tv);
    ctx.font = `600 ${30 * S}px ${F.semi}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${3.4 * S}px`;
    const tag = 'Business Automation & CRM';
    const tw = ctx.measureText(tag).width;
    const ty = cy + 168 * S;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = linGrad(ctx, cx - tw / 2, 0, cx + tw / 2, 0, [[0, C.b5], [0.5, C.b0], [1, C.b3]]);
    ctx.fillText(tag, cx, ty);
    ctx.strokeStyle = 'rgba(120,150,255,0.5)';
    ctx.lineWidth = 2;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * (tw / 2 + 26 * S), ty);
      ctx.lineTo(cx + s * (tw / 2 + 116 * S), ty);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (showCta > 0.01) {
    const cv = stepR(t - (t0 + 1.45), SP.pop);
    if (cv > 0.01) {
      ctx.save();
      ctx.globalAlpha = clamp(showCta) * clamp(cv);
      const bw = 560 * S, bh = 96 * S, by = cy + 236 * S;
      ctx.save();
      ctx.translate(cx, by + bh / 2);
      ctx.scale(lerp(0.86, 1, cv), lerp(0.86, 1, cv));
      withShadow(ctx, { col: hex(C.b2), a: 0.55, blur: 60, y: 20 }, () => {
        rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
        ctx.fillStyle = linGrad(ctx, -bw / 2, 0, bw / 2, 0, [[0, C.b0], [0.45, C.b2], [1, C.b4]]);
        ctx.fill();
      });
      // a sheen that sweeps once — the cheapest way to make a button feel premium
      const sk = clamp((t - (t0 + 2.0)) / 0.7);
      if (sk > 0 && sk < 1) {
        ctx.save();
        rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2);
        ctx.clip();
        const sx = -bw / 2 + sk * bw * 1.35;
        ctx.fillStyle = linGrad(ctx, sx - 150, 0, sx + 150, 0, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]);
        ctx.fillRect(sx - 200, -bh / 2, 400, bh);
        ctx.restore();
      }
      ctx.font = `800 ${36 * S}px ${F.x}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(ctaText, 0, 2);
      ctx.restore();
      ctx.restore();
      // the small print under the button
      const uv = stepR(t - (t0 + 1.75), SP.text);
      if (uv > 0.01) {
        ctx.save();
        ctx.globalAlpha = clamp(uv) * clamp(showCta);
        ctx.font = `600 ${24 * S}px ${F.semi}`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.14em';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = rgba([255, 255, 255], 0.55);
        ctx.fillText('APP.SAMYOJ.COM  ·  NO CREDIT CARD', cx, by + bh + 46 * S);
        ctx.restore();
      }
    }
  }
}
