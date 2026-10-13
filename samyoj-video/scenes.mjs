// samyoj-video/scenes.mjs
//
// Eight scenes, one story: the message is the product.
//
// COMPOSITION CONTRACT (see brand.mjs LAYOUT) — every scene obeys it, which is what makes eight
// scenes read as one film:
//   · eyebrow at y = 142, headline baseline at y = 244 (second line 331). Type NEVER moves.
//   · content lives between y = 386 and y = 986, and between x = 120 and x = 1800.
//   · the camera is centre-locked and only pushes Z, so nothing can be cropped.
//
// Each scene is a pure function of its own local time (S.tl), so the film can be re-timed to a
// measured voiceover without touching a line of art.
import {
  clamp, lerp, smoothstep, outQuint, outExpo, stepR, SP, vis, rgba, hex, linGrad, glow, rr,
  withShadow, glass, pulse, mixStops, jitter, blink,
} from './lib/motion.mjs';
import { C, F, GRAD, WA_G, LAYOUT } from './brand.mjs';
import * as ui from './ui.mjs';

const T = (w, s) => `${w} ${s}px ${w === 900 ? F.black : w === 800 ? F.x : w === 600 ? F.semi : F.med}`;

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 1 · HOOK — the channel your customers already open
 * Two messages, one question, one instant answer. The film's premise in seven seconds.
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function hook(S) {
  const { ctx, tl } = S;
  S.vig(0.44);

  const qIn = 0.55, aIn = 2.05;
  if (tl > qIn - 0.55) {
    ui.typingDots(ctx, { x: 620, y: 392, t: tl - 0.05, col: 'rgba(255,255,255,0.5)', size: 13, gap: 26 });
  }
  ui.bubble(ctx, {
    x: 540, y: 424, w: 700, h: 132, text: 'Hi! Do you deliver to Bhopal?', size: 37,
    align: 'left', appear: tl - qIn, time: '10:24',
  });
  if (tl > aIn - 0.55 && tl < aIn + 0.22) {
    ui.typingDots(ctx, { x: 1180, y: 576, t: tl, col: C.wa, size: 15, gap: 30 });
  }
  ui.bubble(ctx, {
    x: 900, y: 628, w: 760, h: 142, text: 'Yes — today by 6 PM', size: 37,
    align: 'right', mine: true, waGreen: true, appear: tl - aIn,
    ticks: 2, tickGrow: clamp((tl - (aIn + 0.85)) / 0.3),
  });

  // the latency chip — the AI is the reason it was instant
  const lv = vis(tl, aIn + 1.15, null, 0.16);
  if (lv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(lv.o);
    ctx.translate(0, lv.dy);
    const cw = 440, cx = 1430 - cw / 2, cy = 800;
    rr(ctx, cx, cy, cw, 68, 34);
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ui.ring(ctx, { x: cx + 46, y: cy + 34, r: 18, p: outExpo(clamp((tl - aIn - 1.2) / 0.7)), w: 4.4, col: C.wa });
    ctx.font = T(600, 25);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.84)';
    ctx.fillText('Answered by Samyoj AI · 0.4s', cx + 82, cy + 35);
    ctx.restore();
  }

  // the tail of the conversation: three more replies, arriving on the beat, so the frame fills
  const more = [
    { y: 876, x: 1160, w: 600, text: 'Can I pay on delivery?', mine: false, at: 4.3, size: 31, h: 96 },
  ];
  for (const m of more) {
    if (tl < m.at - 0.4) continue;
    ui.bubble(ctx, {
      x: m.x, y: m.y, w: m.w, h: m.h, text: m.text, size: m.size, align: m.mine ? 'right' : 'left',
      mine: m.mine, waGreen: true, appear: tl - m.at, ticks: m.mine ? 2 : 0,
      tickGrow: clamp((tl - m.at - 0.4) / 0.25), r: 24, pad: 24,
    });
  }

  S.headline({ tin: 0.35, tout: S.len - 0.35 });
  S.labelChip({ tin: S.len * 0.66 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 2 · BROADCAST — one tap, thousands of customers
 * The fan-out: one message becomes a wall of delivered ones, accelerating across the frame.
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function broadcast(S) {
  const { ctx, tl, W } = S;
  S.vig(0.5);

  const COLS = 10, ROWS = 4, N = COLS * ROWS;
  const gw = 1660, gh = 340, gx = (W - gw) / 2, gy = 600;
  const cw = gw / COLS, ch = gh / ROWS;

  // the composer: where the broadcast is written, sent and counted
  const cp = vis(tl, 0.0, S.len - 0.3, 0.2);
  if (cp.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(cp.o);
    ctx.translate(0, cp.dy);
    const cw2 = 1140, cx2 = 150, cy2 = 396, chh = 180;
    ui.card(ctx, { x: cx2, y: cy2, w: cw2, h: chh, r: 32, dark: true, a: 0.92, appear: tl / 0.5 });
    ctx.save();
    ctx.font = T(600, 22);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
    ctx.fillText('BROADCAST · DIWALI OFFER', cx2 + 44, cy2 + 48);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.01em';
    ctx.font = T(800, 42);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText('Up to 40% off, today only', cx2 + 44, cy2 + 108);
    ctx.restore();
    // the send button
    const press = pulse(tl, 1.15, 0.13);
    const bw = 210, bh = 84, bx = cx2 + cw2 - bw - 38, by = cy2 + 46;
    ctx.save();
    ctx.translate(bx + bw / 2, by + bh / 2);
    ctx.scale(1 - 0.06 * press, 1 - 0.06 * press);
    withShadow(ctx, { col: hex(C.wa), a: 0.45, blur: 40, y: 14 }, () => {
      rr(ctx, -bw / 2, -bh / 2, bw, bh, 24);
      ctx.fillStyle = linGrad(ctx, -bw / 2, 0, bw / 2, 0, WA_G);
      ctx.fill();
    });
    const sent = clamp((tl - 1.2) / 1.1);
    ctx.font = T(800, 29);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    if (sent < 1) {
      ui.ring(ctx, { x: -bw / 2 + 46, y: 0, r: 18, p: sent, w: 4.6, col: '#fff', track: 'rgba(255,255,255,0.3)' });
      ctx.fillText('Sending', 24, 1);
    } else {
      ui.check(ctx, { x: -bw / 2 + 46, y: 0, s: 24, p: clamp((tl - 2.3) / 0.25), col: '#fff', w: 4.6 });
      ctx.fillText('Sent', 24, 1);
    }
    ctx.restore();
    // the counter, INSIDE the card so nothing can collide with it
    const st = outExpo(clamp((tl - 2.4) / 1.2));
    ctx.save();
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.font = T(900, 96);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.035em';
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fillText(Math.round(12480 * st).toLocaleString('en-US'), 1748, cy2 + 116);
    ctx.font = T(600, 22);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.16em';
    ctx.fillStyle = rgba(hex(C.wa), 0.92);
    ctx.fillText('DELIVERED · 98% OPEN RATE', 1748, cy2 + 150);
    ctx.restore();
    ctx.restore();
  }

  // the fan-out: mini bubbles land accelerating, on the beat grid
  const t0 = 0.35, span = S.len * 0.44;
  for (let i = 0; i < N; i++) {
    const at = t0 + span * Math.pow(i / (N - 1), 0.82);
    const lp = clamp((tl - at) / 0.42);
    if (lp <= 0) continue;
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = gx + col * cw + cw / 2, y = gy + row * ch + ch / 2;
    const e = stepR(tl - at, SP.pop);
    const sc = lerp(0.74, 1, e);
    const pop = pulse(tl, at, 0.09);
    ctx.save();
    ctx.globalAlpha = clamp(lp) * (0.55 + 0.45 * e);
    ctx.translate(x, y);
    ctx.scale(sc * (1 + 0.06 * pop), sc * (1 + 0.06 * pop));
    ctx.translate(-x, -y);
    withShadow(ctx, { col: [3, 8, 24], a: 0.34, blur: 20, y: 9 }, () => {
      rr(ctx, x - 70, y - 27, 140, 54, 18);
      ctx.fillStyle = i % 5 === 0 ? rgba(hex(C.wa), 0.92) : 'rgba(255,255,255,0.92)';
      ctx.fill();
    });
    ctx.strokeStyle = i % 5 === 0 ? 'rgba(255,255,255,0.92)' : rgba(hex(C.wa), 0.9);
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    if (clamp((tl - at - 0.12) / 0.16) > 0) {
      ctx.save();
      ctx.translate(x - 14, y + 2);
      ctx.beginPath();
      ctx.moveTo(-7, 0); ctx.lineTo(-2, 5); ctx.lineTo(8, -6);
      ctx.moveTo(7, 0); ctx.lineTo(12, 5); ctx.lineTo(22, -6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  S.headline({ tin: 0.15, tout: S.len - 0.32, size: 74 });
  S.labelChip({ tin: S.len * 0.72 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 3 · AI AGENT — answers in under a second, at three in the morning
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function ai(S) {
  const { ctx, tl } = S;
  S.vig(0.56);
  const cx = 660, cy = 690;

  // the knowledge stack behind the core (depth, and blur on the far layers = a rack focus).
  // Baked: the plates never change shape, only their alpha, so the blur is paid once, not 480 times.
  for (let i = 3; i >= 1; i--) {
    const p = stepR(tl - 0.1 * (3 - i), SP.card);
    if (p <= 0.01) continue;
    const off = i * 30;
    const w2 = 420 + off * 2, h2 = 400 + off * 2, b = 2.6 + i * 1.8, pad = b * 3;
    const tex = S.bake(`stack:${w2}:${h2}:${b}`, w2 + pad * 2, h2 + pad * 2, (bx) => {
      bx.filter = `blur(${b}px)`;
      rr(bx, pad, pad, w2, h2, 52);
      bx.fillStyle = 'rgba(150,170,255,0.5)';
      bx.fill();
    });
    ctx.save();
    ctx.globalAlpha = 0.15 * p;
    ctx.drawImage(tex, cx - 210 - off - pad, cy - 200 - off - pad);
    ctx.restore();
  }

  const ce = stepR(tl, { w: 16, z: 1 });
  const beat = 1 + 0.026 * Math.sin((tl / 0.5) * Math.PI * 2);
  ctx.save();
  ctx.globalAlpha = clamp(ce);
  ctx.translate(cx, cy);
  ctx.scale(lerp(1.1, 1, ce) * beat, lerp(1.1, 1, ce) * beat);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = glow(ctx, 0, 0, 520, hex(C.b2), 0.5);
  ctx.fillRect(-520, -520, 1040, 1040);
  ctx.restore();
  withShadow(ctx, { col: hex(C.b2), a: 0.55, blur: 80, y: 28 }, () => {
    rr(ctx, -190, -190, 380, 380, 92);
    ctx.fillStyle = linGrad(ctx, -190, -190, 190, 190, GRAD);
    ctx.fill();
  });
  // orbiting arcs
  for (let i = 0; i < 2; i++) {
    const r = 236 + i * 58;
    ctx.save();
    ctx.rotate(tl * (0.3 - i * 0.13) + i * 1.1);
    ctx.strokeStyle = `rgba(255,255,255,${0.15 - i * 0.05})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, 0, r, 0.5, 2.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r, 3.8, 5.3); ctx.stroke();
    ctx.restore();
  }
  // the inner voice: typing dots that resolve into a spoken waveform — the film's signature beat
  const ph = tl - 1.9;
  if (ph < 0) {
    ui.typingDots(ctx, { x: -44, y: 6, t: tl - 0.4, col: 'rgba(255,255,255,0.95)', size: 16, gap: 44 });
  } else {
    const amp = 46 * clamp(1.25 - ph / 2.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.96)';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 48; i++) {
      const x = -128 + (256 * i) / 48;
      const env = Math.exp(-Math.abs(i - 24) / 13);
      const y = Math.sin(i * 0.46 + ph * 7.5) * amp * env;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // knowledge chips orbit the core — only on the left and lower arc, so they can never sit on
  // the reply bubble on the right
  const chips = ['Docs', 'FAQs', 'Catalog', 'Orders', 'Policies', 'Pricing'];
  chips.forEach((label, i) => {
    const e = stepR(tl - (1.15 + i * 0.14), SP.card);
    if (e <= 0.01) return;
    const a = Math.PI * 0.42 + (i / (chips.length - 1)) * Math.PI * 1.16;
    const x = cx + Math.cos(a) * 520, y = cy + Math.sin(a) * 300;
    ctx.save();
    ctx.globalAlpha = clamp(e) * 0.95;
    ctx.translate(x, y);
    ctx.scale(e, e);
    ui.chip(ctx, { x: 0, y: 0, text: label, size: 25, pad: 26, h: 56, bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.16)', col: 'rgba(255,255,255,0.82)' });
    ctx.restore();
  });

  // the answer
  const rIn = 2.45;
  ui.bubble(ctx, {
    x: 1180, y: 424, w: 620, h: 184, r: 32,
    text: 'Yes — it ships today.\nTracking: SW-4821', size: 34, align: 'left',
    appear: tl - rIn, time: '03:14',
  });
  const lv = vis(tl, rIn + 0.5, null, 0.16);
  if (lv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(lv.o);
    ui.chip(ctx, {
      x: 1490, y: 676, text: 'Answered in 0.4s · no human needed', size: 24, pad: 28, h: 58,
      bg: rgba(hex(C.wa), 0.14), border: rgba(hex(C.wa), 0.4), col: rgba(hex(C.wa), 1),
    });
    ctx.restore();
  }
  const nv = vis(tl, 3.9, null, 0.16);
  if (nv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(nv.o) * 0.85;
    ctx.font = T(600, 27);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('03:14 — while your team sleeps', 1180, 780);
    ctx.restore();
  }

  S.headline({ tin: 0.3, tout: S.len - 0.32, size: 68 });
  S.labelChip({ tin: 0.9 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 4 · AUTOMATION — no-code flows that never sleep
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function flows(S) {
  const { ctx, tl } = S;
  S.vig(0.5);
  const nodes = [
    { x: 330, y: 700, w: 330, h: 140, t: 'New message', s: 'Any channel', col: C.b4 },
    { x: 730, y: 500, w: 350, h: 140, t: 'Capture lead', s: 'Name · City · Intent', col: C.b0 },
    { x: 730, y: 880, w: 350, h: 140, t: 'Answer instantly', s: 'AI · your knowledge', col: C.b2 },
    { x: 1210, y: 690, w: 370, h: 140, t: 'Human handoff', s: 'Priya · 2 min SLA', col: C.wa },
  ];
  const appear = [0.25, 0.75, 1.1, 1.5];

  const edges = [[0, 1], [0, 2], [1, 3], [2, 3]];
  edges.forEach(([a, b], i) => {
    const A = nodes[a], B = nodes[b];
    const at = appear[Math.max(a, b)] + 0.1;
    const p = clamp((tl - at) / 0.7);
    if (p <= 0) return;
    const x0 = A.x + A.w / 2, y0 = A.y, x1 = B.x - B.w / 2, y1 = B.y;
    const mx = (x0 + x1) / 2;
    ctx.save();
    ctx.strokeStyle = `rgba(140,160,255,${0.36 * (i === 3 ? 1 : 0.7)})`;
    ctx.lineWidth = 2.8;
    ctx.setLineDash([14, 12]);
    ctx.lineDashOffset = -tl * 48;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(mx, y0, mx, y1, x1, y1);
    ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 2; k++) {
      const q = clamp((p - 0.25) / 0.75);
      if (q <= 0) continue;
      const u = (tl * 0.5 + k * 0.5 + i * 0.2) % 1;
      const bx = bez(x0, mx, mx, x1, u), by = bez(y0, y0, y1, y1, u);
      ctx.save();
      ctx.globalAlpha = 0.9 * q * Math.sin(u * Math.PI);
      ctx.fillStyle = i === 3 ? C.wa : C.b4;
      ctx.shadowColor = i === 3 ? C.wa : C.b0;
      ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });

  nodes.forEach((n, i) => {
    const e = stepR(tl - appear[i], SP.card);
    if (e <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = clamp(e);
    ctx.translate(n.x, n.y);
    ctx.scale(lerp(0.9, 1, e), lerp(0.9, 1, e));
    ctx.translate(-n.x, -n.y);
    ui.card(ctx, { x: n.x - n.w / 2, y: n.y - n.h / 2, w: n.w, h: n.h, r: 28, dark: true, a: 0.93, appear: 1 });
    rr(ctx, n.x - n.w / 2 + 26, n.y - 21, 8, 42, 4);
    ctx.fillStyle = n.col;
    ctx.fill();
    ctx.font = T(800, 32);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(n.t, n.x - n.w / 2 + 50, n.y - 17);
    ctx.font = T(500, 23);
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.fillText(n.s, n.x - n.w / 2 + 50, n.y + 27);
    if (i === 3) ui.avatar(ctx, { x: n.x + n.w / 2 - 46, y: n.y, r: 26, initials: 'PS', hue: 4, online: true, a: clamp(e) });
    ctx.restore();
  });

  // the always-on switch
  const tg = vis(tl, 2.4, S.len - 0.4, 0.2);
  if (tg.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(tg.o);
    ctx.translate(0, tg.dy);
    ui.card(ctx, { x: 1500, y: 620, w: 340, h: 160, r: 28, dark: true, a: 0.9, appear: tl / 0.4 });
    ctx.font = T(600, 22);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
    ctx.fillText('AI ASSISTANT', 1532, 668);
    ui.toggle(ctx, { x: 1532, y: 732, w: 92, h: 46, on: clamp((tl - 2.9) / 0.5), label: '24/7' });
    ctx.restore();
  }

  S.headline({ tin: 0.15, tout: S.len - 0.32, size: 72 });
  S.labelChip({ tin: S.len * 0.66 });
}

const bez = (p0, p1, p2, p3, u) => {
  const v = 1 - u;
  return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3;
};

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 5 · SHARED INBOX + CRM — every chat becomes customer context
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function inbox(S) {
  const { ctx, tl } = S;
  S.vig(0.52);
  const rows = [
    { n: 'Rohit Sharma', s: 'Is the 1.2L one in stock?', t: '10:24', un: 2, hue: 0, me: false },
    { n: 'Priya Mehta', s: 'Thanks! Sharing the invoice now', t: '10:12', un: 0, hue: 1, tick: true },
    { n: 'Karan Bansal', s: 'Order #4821 — shipped?', t: '10:02', un: 1, hue: 2, me: false },
    { n: 'Ayesha K.', s: 'Payment done — thank you', t: '09:58', un: 0, hue: 3, tick: true },
    { n: 'Sameer Sen', s: 'Do you ship to Indore?', t: '09:41', un: 0, hue: 4, me: false },
  ];
  const px = 130, py = 400, pw = 890, ph = 570;
  ui.card(ctx, { x: px, y: py, w: pw, h: ph, r: 32, dark: true, a: 0.9, appear: tl / 0.45 });
  ctx.save();
  ctx.font = T(600, 21);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
  ctx.fillText('SHARED INBOX · 5 AGENTS ONLINE', px + 34, py + 42);
  ctx.strokeStyle = 'rgba(255,255,255,0.09)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 24, py + 72); ctx.lineTo(px + pw - 24, py + 72); ctx.stroke();
  ctx.restore();

  rows.forEach((r, i) => {
    const at = 0.35 + i * 0.42;
    const e = stepR(tl - at, SP.card);
    if (e <= 0.01) return;
    const ry = py + 92 + i * 94;
    const focus = i === 0;
    ctx.save();
    ctx.globalAlpha = clamp(e) * (focus ? 1 : 0.72);
    ctx.translate(0, (1 - e) * 16);
    if (focus) {
      rr(ctx, px + 18, ry - 12, pw - 36, 84, 20);
      ctx.fillStyle = 'rgba(120,140,255,0.14)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,160,255,0.3)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    ui.avatar(ctx, { x: px + 64, y: ry + 30, r: 28, initials: r.n.split(' ').map((w) => w[0]).join(''), hue: r.hue, online: i < 3 });
    ctx.font = T(600, 27);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(r.n, px + 112, ry + 18);
    ctx.font = T(500, 23);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(r.s, px + 112, ry + 52);
    ctx.font = T(500, 20);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(r.t, px + pw - 34, ry + 18);
    if (r.un) {
      ctx.beginPath(); ctx.arc(px + pw - 44, ry + 48, 15, 0, Math.PI * 2);
      ctx.fillStyle = C.wa; ctx.fill();
      ctx.font = T(800, 18);
      ctx.fillStyle = '#04240F'; ctx.textAlign = 'center';
      ctx.fillText(String(r.un), px + pw - 44, ry + 49);
    } else if (r.tick) {
      ctx.save();
      ctx.strokeStyle = rgba(hex(C.wa), 0.9);
      ctx.lineWidth = 2.6; ctx.lineCap = 'round';
      ctx.translate(px + pw - 62, ry + 47);
      ctx.beginPath();
      ctx.moveTo(-7, 0); ctx.lineTo(-2, 5); ctx.lineTo(8, -6);
      ctx.moveTo(7, 0); ctx.lineTo(12, 5); ctx.lineTo(22, -6);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });

  // ── the CRM card: the chat becomes a customer
  const cxp = 1060, cyp = 400, cwp = 730, chp = 570;
  const cIn = 1.9;
  const cv = vis(tl, cIn, S.len - 0.35, 0.2);
  if (cv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(cv.o);
    ctx.translate(0, cv.dy * 0.6);
    ui.card(ctx, { x: cxp, y: cyp, w: cwp, h: chp, r: 32, dark: true, a: 0.94, appear: tl - cIn });
    ui.avatar(ctx, { x: cxp + 78, y: cyp + 78, r: 38, initials: 'RS', hue: 0, a: 1, ring: 'rgba(255,255,255,0.25)' });
    ctx.font = T(800, 36);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.97)';
    ctx.fillText('Rohit Sharma', cxp + 138, cyp + 62);
    ctx.font = T(500, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('+91 98•••• 4210 · Bhopal', cxp + 138, cyp + 100);
    ctx.save();
    ctx.strokeStyle = linGrad(ctx, cxp + 40, 0, cxp + cwp - 40, 0, GRAD);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cxp + 40, cyp + 142); ctx.lineTo(cxp + cwp - 40, cyp + 142); ctx.stroke();
    ctx.restore();

    const tagsIn = cIn + 0.55;
    const tags = [
      { t: 'Lead · Hot', c: C.danger, bg: 'rgba(255,90,110,0.14)', b: 'rgba(255,90,110,0.36)' },
      { t: 'Stage · Negotiation', c: 'rgba(255,255,255,0.86)', bg: 'rgba(255,255,255,0.08)', b: 'rgba(255,255,255,0.18)' },
      { t: '₹42,000 lifetime', c: C.wa, bg: 'rgba(37,211,102,0.14)', b: 'rgba(37,211,102,0.36)' },
      { t: 'Ticket #4821', c: C.b4, bg: 'rgba(33,182,255,0.14)', b: 'rgba(33,182,255,0.36)' },
      { t: 'Owner · Priya S.', c: 'rgba(255,255,255,0.86)', bg: 'rgba(255,255,255,0.08)', b: 'rgba(255,255,255,0.18)' },
      { t: 'SLA · 2h', c: C.warn, bg: 'rgba(255,176,32,0.14)', b: 'rgba(255,176,32,0.36)' },
    ];
    let tx = cxp + 44, ty = cyp + 194;
    tags.forEach((tg, i) => {
      const e = stepR(tl - (tagsIn + i * 0.16), SP.pop);
      if (e <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = clamp(e);
      ctx.font = T(600, 22);
      const w = ctx.measureText(tg.t).width + 46;
      if (tx + w > cxp + cwp - 44) { tx = cxp + 44; ty += 64; }
      ctx.translate(tx + w / 2, ty);
      ctx.scale(lerp(0.8, 1, e), lerp(0.8, 1, e));
      ui.chip(ctx, { x: 0, y: 0, text: tg.t, size: 22, pad: 23, h: 50, bg: tg.bg, border: tg.b, col: tg.c });
      ctx.restore();
      tx += w + 14;
    });
    const nv = vis(tl, tagsIn + 1.3, S.len - 0.35, 0.2);
    if (nv.o > 0.01) {
      ctx.save();
      ctx.globalAlpha = clamp(nv.o);
      ctx.font = T(600, 20);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
      ctx.fillText('NEXT ACTION', cxp + 44, cyp + 406);
      ctx.font = T(500, 26);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0.01em';
      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillText('Send the catalog + close the deal', cxp + 44, cyp + 450);
      rr(ctx, cxp + 44, cyp + 492, cwp - 88, 4, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
      rr(ctx, cxp + 44, cyp + 492, (cwp - 88) * clamp((tl - tagsIn - 1.6) / 0.8), 4, 2);
      ctx.fillStyle = linGrad(ctx, cxp + 44, 0, cxp + cwp - 44, 0, GRAD);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  S.headline({ tin: 0.1, tout: S.len - 0.32, size: 62 });
  S.labelChip({ tin: S.len * 0.72 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 6 · COMMERCE — catalogs, payments, orders: closed inside the chat
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function commerce(S) {
  const { ctx, tl } = S;
  S.vig(0.5);
  const x = 200, y = 400, w = 520, h = 570;
  ui.card(ctx, { x, y, w, h, r: 32, dark: false, a: 0.97, appear: tl / 0.4 });
  // product plate — abstract, never a stock photo
  ctx.save();
  rr(ctx, x + 26, y + 26, w - 52, 250, 26);
  ctx.fillStyle = linGrad(ctx, x + 26, y + 26, x + w - 26, y + 276, [[0, '#EAF0FF'], [1, '#DCE6FF']]);
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = glow(ctx, x + w / 2, y + 150, 230, hex(C.b2), 0.22);
  ctx.fillRect(x, y, w, h);
  ctx.save();
  ctx.translate(x + w / 2, y + 162);
  ctx.fillStyle = linGrad(ctx, -90, -70, 90, 90, [[0, C.b0], [0.55, C.b2], [1, C.b4]]);
  withShadow(ctx, { col: hex(C.b2), a: 0.4, blur: 44, y: 18 }, () => {
    rr(ctx, -92, -50, 184, 144, 34);
    ctx.fill();
  });
  rr(ctx, -34, -94, 68, 52, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  ctx.restore();
  ctx.restore();
  ctx.save();
  ctx.font = T(800, 36);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(hex(C.ink), 0.95);
  ctx.fillText('Aroma Diffuser · 300ml', x + 32, y + 318);
  ctx.font = T(600, 48);
  ctx.fillText('₹1,299', x + 32, y + 378);
  ctx.font = T(500, 24);
  ctx.fillStyle = rgba(hex(C.ink3), 1);
  ctx.fillText('In stock · ships today', x + 178, y + 382);
  const press = pulse(tl, 1.5, 0.13);
  const bw = w - 64, bh = 84, bx = x + 32, by = y + h - 110;
  ctx.save();
  ctx.translate(bx + bw / 2, by + bh / 2);
  ctx.scale(1 - 0.05 * press, 1 - 0.05 * press);
  withShadow(ctx, { col: hex(C.wa), a: 0.5, blur: 46, y: 16 }, () => {
    rr(ctx, -bw / 2, -bh / 2, bw, bh, 26);
    ctx.fillStyle = linGrad(ctx, -bw / 2, 0, bw / 2, 0, WA_G);
    ctx.fill();
  });
  ctx.font = T(800, 33);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText('Buy on WhatsApp', 16, 1);
  ctx.restore();
  ctx.restore();

  // payment slip
  const sx = 830, sy = 430, sw = 560, sh = 460;
  const sv = vis(tl, 1.55, S.len - 0.3, 0.2);
  if (sv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(sv.o);
    ctx.translate(0, sv.dy);
    ui.card(ctx, { x: sx, y: sy, w: sw, h: sh, r: 32, dark: true, a: 0.94, appear: tl - 1.55 });
    const cp = outQuint(clamp((tl - 2.1) / 0.55));
    ctx.save();
    ctx.translate(sx + 100, sy + 100);
    ctx.scale(0.9 + 0.1 * cp, 0.9 + 0.1 * cp);
    ctx.fillStyle = rgba(hex(C.wa), 0.16);
    ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = linGrad(ctx, -44, -44, 44, 44, WA_G);
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
    ui.check(ctx, { x: 0, y: 1, s: 44, p: cp, col: '#04240F', w: 6.4 });
    ctx.restore();
    ui.sparkle(ctx, { x: sx + 100, y: sy + 100, t: tl - 2.1, n: 10, r0: 40, r1: 96, col: C.wa, seed: 1.2, life: 0.8 });
    ctx.font = T(600, 22);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.18em';
    ctx.fillText('PAYMENT RECEIVED', sx + 180, sy + 78);
    ctx.font = T(900, 58);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '-0.02em';
    ctx.fillStyle = rgba(hex(C.wa), 1);
    ctx.fillText('₹1,299', sx + 180, sy + 136);
    ctx.font = T(500, 23);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.01em';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('UPI · paid inside the chat', sx + 180, sy + 180);
    ui.stepper(ctx, { x: sx + 62, y: sy + 300, w: sw - 124, p: clamp((tl - 2.7) / 0.9), steps: ['Confirmed', 'Shipped', 'Delivered'], col: C.wa, size: 20 });
    ctx.restore();
  }

  const ov = vis(tl, 3.3, S.len - 0.3, 0.2);
  if (ov.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(ov.o);
    ui.chip(ctx, { x: 1120, y: 862, text: 'Order #4821 · 2 min from chat to cash', size: 25, pad: 30, h: 60, bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.16)', col: 'rgba(255,255,255,0.84)' });
    ctx.restore();
  }

  S.headline({ tin: 0.1, tout: S.len - 0.3, size: 66 });
  S.labelChip({ tin: S.len * 0.62 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 7 · ADS → PIPELINE — click to WhatsApp, measured end to end
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function ads(S) {
  const { ctx, tl } = S;
  S.vig(0.52);
  const x = 140, y = 400, w = 540, h = 560;
  const av = vis(tl, 0.1, 2.5, 0.22);
  if (av.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(av.o);
    ctx.translate(0, av.dy * 0.5);
    ui.card(ctx, { x, y, w, h, r: 32, dark: false, a: 0.97, appear: tl / 0.4 });
    // the ad — Meta blue appears exactly once in the film, where ads are the subject
    ctx.save();
    ctx.beginPath(); ctx.arc(x + 66, y + 66, 25, 0, Math.PI * 2);
    ctx.fillStyle = linGrad(ctx, x + 41, y + 41, x + 91, y + 91, [[0, C.meta], [1, '#00A6FF']]);
    ctx.fill();
    ctx.restore();
    ctx.font = T(600, 25);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(hex(C.ink2), 1);
    ctx.fillText('Your Brand · Sponsored', x + 106, y + 58);
    ctx.font = T(500, 21);
    ctx.fillStyle = rgba(hex(C.ink3), 1);
    ctx.fillText('Facebook · Instagram', x + 106, y + 90);
    ctx.save();
    rr(ctx, x + 28, y + 126, w - 56, 208, 24);
    ctx.fillStyle = linGrad(ctx, x + 28, y + 126, x + w - 28, y + 334, [[0, '#EEF3FF'], [1, '#E2E9FF']]);
    ctx.fill();
    ctx.clip();
    ctx.fillStyle = glow(ctx, x + w / 2 + 70, y + 240, 230, hex(C.meta), 0.22);
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = linGrad(ctx, x + 430, y + 140, x + w - 40, y + 320, [[0, C.b2], [1, C.b4]]);
    withShadow(ctx, { col: hex(C.b0), a: 0.35, blur: 34, y: 14 }, () => {
      rr(ctx, x + 430, y + 150, w - 490, 160, 22);
      ctx.fill();
    });
    ctx.restore();
    ctx.font = T(800, 29);
    ctx.fillStyle = rgba(hex(C.ink), 0.95);
    ctx.fillText('40% off — today only', x + 34, y + 378);
    const press = pulse(tl, 1.6, 0.14);
    ctx.save();
    ctx.translate(x + w / 2, y + 476);
    ctx.scale(1 - 0.05 * press, 1 - 0.05 * press);
    withShadow(ctx, { col: hex(C.meta), a: 0.4, blur: 38, y: 14 }, () => {
      rr(ctx, -(w - 68) / 2, -41, w - 68, 82, 24);
      ctx.fillStyle = linGrad(ctx, -(w - 68) / 2, 0, (w - 68) / 2, 0, [[0, C.meta], [1, '#2D8CFF']]);
      ctx.fill();
    });
    ctx.font = T(800, 31);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('Send WhatsApp message', 0, 1);
    ctx.restore();
    ctx.restore();
  }

  // the click sends a signal into the analytics side
  const sendT = 1.65;
  const ap = clamp((tl - sendT) / 1.05);
  if (ap > 0 && ap < 1) {
    const x0 = x + w / 2, y0 = y + 476, x1 = 900, y1 = 520;
    const u = outExpo(ap);
    const px2 = lerp(x0, x1, u), py2 = y0 + (y1 - y0) * u - Math.sin(u * Math.PI) * 130;
    ctx.save();
    ctx.shadowColor = C.meta; ctx.shadowBlur = 30;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px2, py2, 10 * (1 - 0.4 * u), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // the analytics panel
  const ax = 780, ay = 400, aw = 1000, ah = 560;
  const anv = vis(tl, 1.6, S.len - 0.3, 0.22);
  if (anv.o > 0.01) {
    ctx.save();
    ctx.globalAlpha = clamp(anv.o);
    ctx.translate(0, anv.dy * 0.6);
    ui.card(ctx, { x: ax, y: ay, w: aw, h: ah, r: 32, dark: true, a: 0.92, appear: tl - 1.6 });
    ctx.font = T(600, 21);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
    ctx.fillText('CAMPAIGN → CONVERSATIONS → REVENUE', ax + 40, ay + 44);
    const bp = clamp((tl - 2.2) / 1.5);
    const chartW = aw - 400;
    ui.bars(ctx, { x: ax + 48, y: ay + 290, w: chartW, h: 200, n: 9, p: bp, gap: 16, radius: 10 });
    ctx.save();
    const lp = clamp((tl - 2.7) / 1.2);
    ctx.strokeStyle = C.wa;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowColor = C.wa; ctx.shadowBlur = 20;
    ctx.beginPath();
    for (let i = 0; i <= 40 * lp; i++) {
      const u = i / 40;
      const px2 = ax + 48 + u * chartW;
      const py2 = ay + 290 + 200 - 200 * (0.24 + 0.6 * Math.pow(u, 1.35)) - Math.sin(u * 7) * 6;
      i === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    ctx.restore();
    ui.stat(ctx, { x: ax + aw - 88, y: ay + 170, value: 3.4, suffix: '×', label: 'ROI', p: clamp((tl - 3.0) / 0.9), size: 88, align: 'right' });
    ui.stat(ctx, { x: ax + aw - 88, y: ay + 340, value: 62, suffix: '%', label: 'MORE REPLIES', p: clamp((tl - 3.3) / 0.9), size: 72, align: 'right', col: rgba(hex(C.wa), 1) });
    ctx.restore();
  }

  S.headline({ tin: 0.15, tout: S.len - 0.3, size: 66 });
  S.labelChip({ tin: S.len * 0.66 });
}

/* ────────────────────────────────────────────────────────────────────────────────────────────────
 * 8 · END CARD — the mark assembles itself
 * ──────────────────────────────────────────────────────────────────────────────────────────────── */
export function cta(S) {
  const { ctx, tl, W } = S;
  S.vig(0.74);

  // the film's last transition: the ad panel's bars retract as the emblem's ring draws where they were
  const collapse = clamp(tl / 0.7);
  if (collapse < 1) {
    const n = 9, bw = 74, gap = 18, tot = n * bw + (n - 1) * gap;
    ctx.save();
    ctx.globalAlpha = 1 - collapse;
    for (let i = 0; i < n; i++) {
      const bx = W / 2 - tot / 2 + i * (bw + gap);
      const bh = 240 * (0.3 + 0.7 * Math.pow((i + 1) / n, 1.5)) * (1 - collapse);
      rr(ctx, bx, 660 - bh, bw, bh, 12);
      ctx.fillStyle = i % 2 ? C.b4 : C.b0;
      ctx.fill();
    }
    ctx.restore();
  }

  S.lockup({ cx: W / 2, cy: 560, scale: 1.0, t0: 0.3 });

  // the platform's own published numbers, set as one letterspaced proof line: the closing evidence,
  // deliberately quiet so the CTA above it keeps the eye
  const st = [['98%', 'OPEN RATES'], ['45–60%', 'CLICK RATES'], ['70%+', 'ENGAGEMENT']];
  st.forEach(([v, l], i) => {
    const e = stepR(tl - (4.9 + i * 0.16), SP.card);
    if (e <= 0.01) return;
    const x = W / 2 + (i - 1) * 300;
    ctx.save();
    ctx.globalAlpha = clamp(e) * 0.95;
    ctx.translate(0, (1 - e) * 14);
    ctx.font = T(600, 26);
    ctx.textAlign = 'right';
    ctx.fillStyle = i === 2 ? rgba(hex(C.wa), 0.95) : 'rgba(255,255,255,0.72)';
    ctx.fillText(v, x - 14, 1006);
    ctx.font = T(600, 18);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0.2em';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(l, x + 6, 1006);
    ctx.restore();
  });

  // a final green pulse, decaying: the channel's heartbeat on the last beat
  const gp = tl - 9.8;
  if (gp > 0 && gp < 2.4) {
    const k = gp / 2.4;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.5;
    ctx.strokeStyle = C.wa;
    ctx.lineWidth = 3.5 * (1 - k) + 1;
    ctx.beginPath();
    ctx.arc(W / 2, 540, 180 + 280 * outQuint(k), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

export const SCENES = { hook, broadcast, ai, flows, inbox, commerce, ads, cta };
