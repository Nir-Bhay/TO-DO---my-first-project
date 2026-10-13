// motion/film.mjs
//
// The film. Every pixel is a function of time inside draw(t) — no CSS transitions, no timers, no
// state carried between frames — so `seek(anyT)` reproduces that instant exactly. That is what
// lets one file be both a live preview and the source of a 60fps render (render.mjs).
//
// Layering, per references/technique.md:
//   #bg     brand bloom (static)
//   #thr    canvas: cursor trail + click ripples      (screen space)
//   #world  the scene, carrying the camera transform  (world space)
//   #hud    screen-space grade: vignette + grain
//
import { buildTimeline } from './lib/timeline.mjs';
import { rgb, clamp, lerp, outQuint, hash01, SP } from './lib/motion-math.mjs';
import { createAudio } from './lib/audio.mjs';

export async function mount({ stage, autoplay = true } = {}) {
  const stageEl = stage ?? document.getElementById('stage');
  const thr = document.getElementById('thr');
  const hud = document.getElementById('hud');
  const world = document.getElementById('world');
  const tctx = thr.getContext('2d');

  // Fonts first: the cursor's follow path is measured from the typed line, so measuring before
  // the font loads would put it in the wrong place.
  if (document.fonts?.ready) await document.fonts.ready;
  const mctx = document.createElement('canvas').getContext('2d');
  const measure = (str, size) => {
    ctxFont(mctx, size);
    return mctx.measureText(str).width;
  };

  const { M, cues, G, B, T } = buildTimeline({ measure });
  const el = (tag, cls, parent) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  };
  const elNS = (tag, cls, parent, attrs = {}) => {
    const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (cls) n.setAttribute('class', cls);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    parent.appendChild(n);
    return n;
  };

  // ── build the DOM once. draw() only writes styles. ─────────────────────────────────────────
  const shape = document.getElementById('shape');
  const wordmark = el('div', 'wordmark', shape);
  wordmark.textContent = 'TO-DO';
  const layer = el('div', 'layer', world);

  // the composer
  const sComposer = el('div', 'slot', layer);
  const typed = el('div', 'typed', sComposer);
  const caret = el('div', 'caret', sComposer);
  const placeholder = el('div', 'placeholder', sComposer);
  placeholder.textContent = 'What needs doing?';
  // the chip / slider / Add row
  const sChips = el('div', 'slot', layer);
  const chip = el('div', 'chip', sChips);
  chip.textContent = 'Fri 17 Oct';
  const sSlider = el('div', 'slot', sChips);
  const prLabel = el('div', 'micro', sSlider);
  prLabel.textContent = 'PRIORITY';
  const trackBar = el('div', 'track', sSlider);
  const trackFill = el('div', 'fill', sSlider);
  const knob = el('div', 'knob', sSlider);
  const sAdd = el('div', 'slot', sChips);
  const addBtn = el('div', 'addBtn', sAdd);
  addBtn.textContent = 'Add';
  // the list
  const sHeader = el('div', 'slot', layer);
  const headerL = el('div', 'micro headerL', sHeader);
  headerL.textContent = 'TODAY';
  const headerR = el('div', 'micro right', sHeader);
  headerR.textContent = '3 tasks';
  const streakR = el('div', 'micro right streak', sHeader);
  streakR.textContent = '3-day streak';
  const rows = [0, 1, 2].map((i) => {
    const r = el('div', 'slot row', layer);
    const box = el('div', 'checkbox', r);
    const tick = elNS('svg', 'tick', r, { viewBox: '0 0 32 32' });
    const path = elNS('path', '', tick, { d: 'M7 17.5 L13 23.5 L25 9.5' });
    const label = el('div', 'rowLabel', r);
    label.textContent = M.ROWS[i].label;
    const chipEl = el('div', 'rowChip', r);
    chipEl.textContent = M.ROWS[i].chip;
    return { r, box, tick, path, label, chipEl };
  });
  // the plate: tabs + the ring that draws itself
  const sTabs = el('div', 'slot', layer);
  const tabBar = el('div', 'tabBar', sTabs);
  const indicator = el('div', 'indicator', sTabs);
  const tabLabels = M.G.tabCenters.map((_, i) => {
    const n = el('div', 'tabLabel', sTabs);
    n.textContent = ['Today', 'Upcoming', 'Done'][i];
    return n;
  });
  const sRing = el('div', 'slot', layer);
  const ringSvg = elNS('svg', 'ring', sRing, { viewBox: '0 0 200 200' });
  const ringBg = elNS('circle', 'ringBg', ringSvg, { cx: 100, cy: 100, r: 82 });
  const ringFg = elNS('circle', 'ringFg', ringSvg, { cx: 100, cy: 100, r: 82 });
  const ringNum = el('div', 'ringNum', sRing);
  const ringCap = el('div', 'ringCap', sRing);
  ringCap.textContent = 'of 12 done today';
  // the toast
  const sToast = el('div', 'slot', layer);
  const toastTick = elNS('svg', 'toastTick', sToast, { viewBox: '0 0 32 32' });
  const toastPath = elNS('path', '', toastTick, { d: 'M7 17.5 L13 23.5 L25 9.5' });
  const toastText = el('div', 'toastText', sToast);
  toastText.textContent = 'All caught up';
  // the wall of completed tasks + the odometer (the pull-back)
  const wall = el('div', 'wall', world);
  const W = G.wall;
  const wallL = W.cx - (W.cols * (W.tw + W.gap) - W.gap) / 2;
  const wallT = W.cy - (W.rows * (W.th + W.gap) - W.gap) / 2;
  const tiles = Array.from({ length: M.wallCount }, (_, i) => {
    const c = i % W.cols, row = Math.floor(i / W.cols);
    const n = el('div', 'tile', wall);
    n.style.left = `${wallL + c * (W.tw + W.gap)}px`;
    n.style.top = `${wallT + row * (W.th + W.gap)}px`;
    n.style.width = `${W.tw}px`;
    n.style.height = `${W.th}px`;
    const t = elNS('svg', 'tileTick', n, { viewBox: '0 0 32 32' });
    elNS('path', '', t, { d: 'M7 17.5 L13 23.5 L25 9.5' });
    return { n, at: M.wallAt(i) };
  });
  const odo = el('div', 'odo', world);
  const odoDigits = el('div', 'odoDigits', odo);
  const ODO_LINE = 96;
  const odoSlots = [0, 1, 2].map(() => {
    const s = el('div', 'odoSlot', odoDigits);
    const col = el('div', 'odoCol', s);
    for (let d = 0; d <= 10; d++) el('div', 'odoDigit', col).textContent = String(d % 10);
    return { s, col };
  });
  const odoCap = el('div', 'odoCap', odo);
  odoCap.textContent = 'tasks completed';
  // the cursor
  const cursor = el('div', 'cursor', world);
  const curSvg = elNS('svg', 'cursorArrow', cursor, { viewBox: '0 0 44 54' });
  elNS('path', 'cursorPath', curSvg, { d: 'M4 2 L4 40 L14 31 L21 48 L29 44 L22 28 L38 26 Z' });
  const pillYou = el('div', 'pill', cursor);
  pillYou.textContent = 'You';
  const pillBrand = el('div', 'pill', cursor);
  pillBrand.textContent = 'TO-DO';

  // a deterministic grain tile: filled from a hash of the pixel index, never Math.random (law 3)
  const grain = document.createElement('canvas');
  grain.width = grain.height = 128;
  const gctx = grain.getContext('2d');
  const img = gctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + Math.floor(hash01(i) * 55);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 10;
  }
  gctx.putImageData(img, 0, 0);
  hud.style.backgroundImage = `url(${grain.toDataURL()})`;

  const readout = document.getElementById('readout');
  const RING_C = 2 * Math.PI * 82;

  // ── THE DRAW. One function, one argument: time. ─────────────────────────────────────────────
  function draw(t) {
    const s = M.shape(t);
    const ink = rgb(s.ink);
    const cam = M.cam(t);

    world.style.transform =
      `translate(960px, 540px) scale(${cam.z.toFixed(5)}) translate(${(-cam.x).toFixed(2)}px, ${(-cam.y).toFixed(2)}px)`;

    // the one shape
    shape.style.width = `${s.w.toFixed(2)}px`;
    shape.style.height = `${s.h.toFixed(2)}px`;
    shape.style.borderRadius = `${s.r.toFixed(2)}px`;
    shape.style.transform = `translate(${(s.x - s.w / 2).toFixed(2)}px, ${(s.y - s.h / 2).toFixed(2)}px)`;
    shape.style.background = `linear-gradient(135deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;
    shape.style.borderColor = rgb(s.border, s.borderA);
    const k = clamp(s.shadow / 0.34);
    shape.style.boxShadow = `0 ${lerp(10, 36, k).toFixed(1)}px ${lerp(24, 74, k).toFixed(1)}px rgba(17,24,39,${s.shadow.toFixed(3)})`;

    // slot helper: opacity, blur and a small translateY — each with its own enter/exit window
    const put = (node, v, extra = '') => {
      node.style.opacity = v.o.toFixed(3);
      node.style.filter = v.b > 0.05 ? `blur(${(v.b * 0.6).toFixed(2)}px)` : 'none';
      node.style.transform = `translateY(${v.dy.toFixed(2)}px)${extra ? ' ' + extra : ''}`;
    };
    const at = (node, x, y, w, h) => {
      node.style.left = `${x}px`; node.style.top = `${y}px`;
      if (w != null) node.style.width = `${w}px`;
      if (h != null) node.style.height = `${h}px`;
    };

    // the wordmark lives in two windows (out at the first morph, back in at the last)
    const brandA = M.slots.brandA(t), brandB = M.slots.brandB(t);
    put(wordmark, brandB.o > brandA.o ? brandB : brandA);
    wordmark.style.color = ink;

    // the composer
    const composerV = M.slots.composer(t);
    put(sComposer, composerV);
    const ty = M.typed(t);
    const composerOn = composerV.o > 0.001; // was the composer ever on screen at this instant?
    typed.textContent = composerOn ? ty.text : '';
    typed.style.color = ink;
    at(typed, G.text.left, G.text.baseline - G.text.size - 6, 720, G.text.size + 8);
    placeholder.style.color = rgb(s.ink, 0.32);
    placeholder.style.opacity = composerOn && ty.n === 0 ? '1' : '0';
    at(placeholder, G.text.left, G.text.baseline - G.text.size - 6, 500, G.text.size + 8);
    at(caret, composerOn ? ty.caretX : G.text.left + 3, G.text.baseline - G.text.size, 3, G.text.size + 2);
    caret.style.background = ink;
    caret.style.opacity = composerOn && ty.n > 0 && ty.blink ? '1' : '0';

    // the chip, the slider, the Add button
    put(sChips, M.slots.chip(t));
    put(sSlider, M.slots.slider(t));
    put(sAdd, M.slots.add(t));
    at(chip, G.chip.x, G.chip.y, G.chip.w, G.chip.h);
    chip.style.borderRadius = `${G.chip.r}px`;
    chip.style.color = rgb(s.ink, 0.7);
    prLabel.style.color = rgb(s.ink, 0.38);
    at(prLabel, G.slider.left, G.slider.y - 46, 200, 18);
    const sl = M.slider(t);
    at(trackBar, G.slider.left, G.slider.y - G.slider.h / 2, G.slider.right - G.slider.left, G.slider.h);
    trackBar.style.background = rgb(s.ink, 0.14);
    at(trackFill, G.slider.left, G.slider.y - G.slider.h / 2, Math.max(0, sl.fillX - G.slider.left), G.slider.h);
    trackFill.style.background = `linear-gradient(90deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;
    at(knob, sl.knobX, G.slider.y, G.slider.knob, G.slider.knob);
    knob.style.transform = `translate(-50%,-50%) scaleX(${sl.knobScaleX.toFixed(3)})`;
    knob.style.background = rgb(s.c1);
    at(addBtn, G.add.x, G.add.y, G.add.w, G.add.h);
    addBtn.style.borderRadius = `${G.add.r}px`;
    addBtn.style.background = `linear-gradient(135deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;

    // the list header — its right-hand slot swaps to the streak chip on the beat
    put(sHeader, M.slots.header(t));
    put(headerR, M.slots.headerR(t), 'translateX(-100%)');
    put(streakR, M.slots.streakChip(t), 'translateX(-100%)');
    headerL.style.color = rgb(s.ink, 0.4);
    headerR.style.color = rgb(s.ink, 0.4);
    streakR.style.color = rgb(s.c1);
    at(headerL, G.cardL + 60, G.headerY - 12, 200, 18);
    at(headerR, G.cardR - 60, G.headerY - 12, 240, 18);
    at(streakR, G.cardR - 60, G.headerY - 12, 240, 18);
    headerR.style.textAlign = streakR.style.textAlign = 'right';

    // rows, with their checks drawing on the beat
    const checks = M.checks(t);
    rows.forEach((r, i) => {
      const rv = M.slots.row(i)(t);
      put(r.r, rv);
      // while a row is out, its check sits in one canonical state (see vis() in motion-math)
      const check = rv.o > 0.001 ? checks[i] : { p: 0, done: 0 };
      at(r.r, G.cardL + 60, G.rowY[i] - 34, G.cardR - G.cardL - 120, 68);
      at(r.box, 0, 20, 28, 28);
      r.box.style.borderRadius = '9px';
      const done = check.done;
      r.box.style.background = `linear-gradient(135deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;
      r.box.style.opacity = (0.2 + 0.8 * done).toFixed(3);
      r.box.style.borderColor = rgb(s.c1, 0.45 + 0.55 * done);
      r.path.style.strokeDasharray = '34';
      r.path.style.strokeDashoffset = (34 * (1 - check.p)).toFixed(2);
      r.path.style.opacity = check.p.toFixed(3);
      r.tick.style.left = '0px'; r.tick.style.top = '20px';
      r.tick.style.width = '28px'; r.tick.style.height = '28px';
      at(r.label, G.labelX - G.cardL - 60, 16, 520, 40);
      r.label.style.color = rgb(s.ink, lerp(1, 0.34, done));
      r.label.style.textDecoration = done > 0.5 ? 'line-through' : 'none';
      at(r.chipEl, G.cardR - G.cardL - 120 - 150, 22, 150, 24);
      r.chipEl.style.textAlign = 'right';
      r.chipEl.style.color = rgb(s.ink, lerp(0.42, 0.22, done));
    });

    // the plate: the tab bar with its edge-split indicator, and the ring that draws itself
    put(sTabs, M.slots.tabs(t));
    at(tabBar, G.tabBar.x, G.tabBar.y, G.tabBar.w, G.tabBar.h);
    tabBar.style.borderRadius = `${G.tabBar.r}px`;
    tabBar.style.background = rgb(s.ink, 0.06);
    const iv = M.indicator(t);
    at(indicator, iv.l, G.tabBar.y + 6, Math.max(0, iv.r - iv.l), G.indicator.h);
    indicator.style.borderRadius = `${G.indicator.r}px`;
    indicator.style.background = `linear-gradient(135deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;
    tabLabels.forEach((n, i) => {
      at(n, G.tabCenters[i], G.tabBar.y, 150, G.tabBar.h);
      n.style.transform = 'translateX(-50%)';
      const on = Math.abs(G.tabCenters[i] - (iv.l + iv.r) / 2) < 74;
      n.style.color = on ? '#fff' : rgb(s.ink, 0.48);
    });
    const ringV = M.slots.ring(t);
    put(sRing, ringV);
    const rv = ringV.o > 0.001 ? M.ring(t) : { p: 0, n: 0 };
    at(ringSvg, G.ring.cx - 100, G.ring.cy - 100, 200, 200);
    ringBg.style.stroke = rgb(s.ink, 0.12);
    ringFg.style.stroke = rgb(s.c1);
    ringFg.style.strokeDasharray = `${RING_C.toFixed(2)}`;
    ringFg.style.strokeDashoffset = `${(RING_C * (1 - rv.p)).toFixed(2)}`;
    ringFg.style.transformOrigin = '100px 100px';
    const rn = Math.floor(rv.n);
    if (ringNum.dataset.n !== String(rn)) { ringNum.textContent = String(rn); ringNum.dataset.n = String(rn); }
    at(ringNum, G.ring.cx - 60, G.ring.cy - 36, 120, 60);
    ringNum.style.color = ink;
    at(ringCap, G.ring.cx - 130, G.ring.cy + 44, 260, 24);
    ringCap.style.color = rgb(s.ink, 0.4);

    // the toast
    put(sToast, M.slots.toast(t));
    const toastDraw = M.slots.toast(t).o > 0.001 ? clamp((t - (B.morphToast + 0.22)) / 0.3) : 0;
    toastPath.style.strokeDasharray = '34';
    toastPath.style.strokeDashoffset = (34 * (1 - toastDraw)).toFixed(2);
    at(toastTick, 38, 22, 40, 40);
    at(toastText, 94, 0, 380, G.toast.h);
    toastText.style.lineHeight = `${G.toast.h}px`;
    toastText.style.color = ink;

    // the wall: 40 slams, accelerating — the pull-back that reveals scale
    const wallV = M.slots.wall(t);
    wall.style.opacity = wallV.o.toFixed(3);
    wall.style.filter = wallV.b > 0.05 ? `blur(${(wallV.b * 0.3).toFixed(2)}px)` : 'none';
    for (const tile of tiles) {
      const on = wallV.o > 0.001 ? clamp((t - tile.at) / 0.02) : 0;
      const pop = Math.exp(-Math.pow((t - tile.at) / 0.07, 2));
      tile.n.style.opacity = (on * 0.92).toFixed(3);
      tile.n.style.transform = `scale(${(0.62 + 0.38 * on - 0.05 * pop).toFixed(3)})`;
    }
    const odoV = M.slots.odo(t);
    odo.style.opacity = odoV.o.toFixed(3);
    odo.style.filter = odoV.b > 0.05 ? `blur(${(odoV.b * 0.5).toFixed(2)}px)` : 'none';
    odo.style.transform = `translate(${W.cx - 300}px, 74px)`;
    odoDigits.style.height = `${ODO_LINE}px`;
    const v = odoV.o > 0.001 ? M.odo(t) : 0;
    odoSlots.forEach((slot, p) => {
      const pow = Math.pow(10, 2 - p);
      const digit = Math.floor(v / pow) % 10;
      const frac = (v % pow) / pow;
      const carry = Math.max(0, frac - (pow - 1) / pow);
      slot.col.style.transform = `translateY(${(-(digit + carry) * ODO_LINE).toFixed(3)}px)`;
      slot.s.style.opacity = p === 2 ? '1' : clamp(v / pow - 0.6).toFixed(3);
    });
    odoCap.style.color = 'rgb(120,126,140)';

    // the cursor: lean with velocity, press-scale on clicks, a name pill trailing behind it
    const cur = M.cursor(t);
    cursor.style.transform =
      `translate(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px) rotate(${cur.lean.toFixed(4)}rad) scale(${cur.scale.toFixed(4)})`;
    pillYou.style.opacity = cur.pill.you.toFixed(3);
    pillBrand.style.opacity = cur.pill.brand.toFixed(3);
    pillBrand.style.background = `linear-gradient(135deg, ${rgb(s.c1)}, ${rgb(s.c2)})`;
    const px = cur.x - cur.pill.x, py = cur.y - cur.pill.y;
    pillYou.style.transform = pillBrand.style.transform = `translate(${(20 + px).toFixed(2)}px, ${(30 + py).toFixed(2)}px)`;

    // trail + ripples on the canvas (screen space)
    drawTrail(tctx, t);

    // the grade: a vignette (static) and a grain tile translated by whole pixels derived from the
    // playhead — deterministic, so a re-render is byte-identical (law 3)
    // the grain steps once per frame and wraps on 120 frames, which divides the 1440 frames of a
    // cycle — so the grade is loop-periodic too, and the loop stays provably identical
    const gframe = Math.round((t / T) * 1440) % 120;
    hud.style.backgroundPosition = `${gframe - 60}px ${((gframe * 7 + 40) % 120) - 60}px`;

    if (readout) {
      const bar = Math.floor(t / 2) + 1, beat = (Math.floor(t / 0.5) % 4) + 1;
      readout.textContent = `t ${t.toFixed(2)}s · bar ${bar}/12 · beat ${beat} · zoom ${cam.z.toFixed(2)}× · ${cues.filter((c) => c.t <= t).length}/${cues.length} cues`;
    }
  }

  function drawTrail(ctx, t) {
    ctx.clearRect(0, 0, 1920, 1080);
    const cur = M.cursor(t);
    const cam = M.cam(t);
    if (cur.scale > 0.05) {
      // Sample the cursor's SCREEN position at t − k·9ms — pure, because position is a function
      // of t (the skill's trail trick: no history buffer, no state).
      const project = (c) => ({ x: 960 + (c.x - cam.x) * cam.z, y: 540 + (c.y - cam.y) * cam.z });
      const a = clamp((Math.abs(cur.vx) * cam.z - 420) / 2400, 0, 0.5);
      if (a > 0.01) {
        let prev = project(cur);
        for (let k = 1; k <= 21; k++) {
          const p = project(M.cursor(Math.max(0, t - k * 0.009)));
          ctx.strokeStyle = `rgba(124,58,237,${(a * (1 - k / 21)).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, 15 * (1 - k / 21));
          ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(prev.x, prev.y); ctx.stroke();
          prev = p;
        }
      }
      for (const r of cur.ripples) {
        const age = t - r.t;
        if (age < 0 || age > 0.45) continue;
        const kk = outQuint(age / 0.45);
        const p = project(r);
        ctx.strokeStyle = `rgba(79,70,229,${(0.45 * (1 - kk)).toFixed(3)})`;
        ctx.lineWidth = 6 * (1 - kk) + 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, 16 + 78 * kk, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  // ── playback: the film is clocked to the audio when the sound is on (music-first timing) ─────
  const audio = createAudio({ cues, T, BEAT: 0.5 });
  let tFilm = 0, last = performance.now(), paused = false;

  function loop() {
    const now = performance.now();
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    const audioT = audio.now();
    if (audioT != null) { tFilm = audioT % T; audio.keepScheduled(audioT); }
    else if (!paused) tFilm = (tFilm + dt) % T;
    if (!paused) draw(tFilm);
    requestAnimationFrame(loop);
  }

  // export API: `seek(t)` renders that instant; the renderer drives it frame by frame
  const film = {
    T, cues, fps: 60,
    ready: true,
    draw, seek: draw,
    get paused() { return paused; },
    play() { paused = false; last = performance.now(); },
    pause() { paused = true; },
    async soundOn() { tFilm = 0; await audio.start(); paused = false; }, // from the top, music first
    soundOff() { audio.stop(); tFilm = 0; last = performance.now(); paused = true; draw(0); },
    get soundEnabled() { return audio.enabled; },
    get time() { return tFilm; },
  };
  window.__film = film;

  draw(0); // the first frame is on screen before the first tick — and it IS the last frame
  if (autoplay) requestAnimationFrame(loop);
  return { film, stageEl };
}

function ctxFont(ctx, size) {
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  ctx.font = `600 ${size}px ${family}`;
}
