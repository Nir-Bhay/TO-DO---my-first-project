// motion/test/film.dom.test.mjs — `node motion/test/film.dom.test.mjs`   (needs: npm i -D jsdom)
//
// The score is verified by timeline.test.mjs; this verifies the RENDER — the part a browser would
// otherwise be needed for. jsdom runs the real film.mjs against the real index.html and checks:
//
//   1. 1441 frames draw without throwing and never write NaN into a style
//   2. the frame at t=T is byte-identical to the frame at t=0 (rule 9, proved rather than eyeballed)
//   3. named beats put the right thing on screen
//
// It is not a substitute for looking at the film. It is what catches the bugs you would otherwise
// only find after a 6-minute render.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const MOTION = join(here, '..');

let JSDOM;
try {
  ({ JSDOM } = await import('jsdom'));
} catch {
  console.log('\n⚠  jsdom is not installed — run `npm i -D jsdom` in this folder to use this test.\n' +
    '   (timeline.test.mjs needs nothing and covers the score: springs, loop, cues, dead time.)\n');
  process.exit(0);
}

const html = readFileSync(join(MOTION, 'index.html'), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost/motion/', pretendToBeVisual: true });
const { window } = dom;

// canvas stubs: jsdom has no 2D context, and the trail only needs to be callable
const drawn = { strokes: 0, clears: 0 };
const stub = {
  font: '', strokeStyle: '', lineWidth: 1, lineCap: '',
  measureText: (s) => ({ width: s.length * 0.55 * parseFloat(/(\d+)px/.exec(stub.font)?.[1] ?? '16') }),
  clearRect: () => { drawn.clears++; },
  beginPath() {}, moveTo() {}, lineTo() {}, stroke() { drawn.strokes++; }, arc() {},
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
  putImageData() {},
};
window.HTMLCanvasElement.prototype.getContext = () => stub;
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,';

global.window = window;
global.document = window.document;
global.getComputedStyle = window.getComputedStyle.bind(window);
global.requestAnimationFrame = (fn) => setTimeout(() => fn(0), 16);
global.cancelAnimationFrame = clearTimeout;
global.location = window.location;

const { mount } = await import(join(MOTION, 'film.mjs'));
const { film } = await mount({ autoplay: false });

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
};

const nodes = [...document.querySelectorAll('#stage *')];
const shapeStyle = (t) => { film.seek(t); return document.getElementById('shape').getAttribute('style'); };
const worldStyle = (t) => { film.seek(t); return document.getElementById('world').getAttribute('style'); };

console.log('\nsweep every frame');
let thrown = null, nan = null;
for (let i = 0; i <= 1440 && !thrown && !nan; i++) {
  const t = (i / 1440) * film.T;
  try { film.seek(t); } catch (e) { thrown = { t, e }; break; }
  for (const n of nodes) {
    const s = n.style;
    for (let k = 0; k < s.length; k++) {
      const v = s.getPropertyValue(s[k]);
      if (/NaN|Infinity/.test(v)) { nan = { t, sel: n.className || n.tagName, prop: s[k], v }; break; }
    }
    if (nan) break;
  }
}
ok('1441 frames (0 → 24s at 60fps) draw without throwing', !thrown, thrown ? `${thrown.e.message} @ ${thrown.t.toFixed(3)}s` : '');
ok('no NaN / Infinity ever reaches a style', !nan, nan ? `${nan.sel} { ${nan.prop}: ${nan.v} } @ ${nan.t.toFixed(3)}s` : '');
ok('the trail canvas was drawn on', drawn.clears > 1000 && drawn.strokes > 500, `clears=${drawn.clears} strokes=${drawn.strokes}`);

console.log('\nthe loop, end to end');
const snapshot = (t) => {
  film.seek(t);
  const out = [];
  for (const n of nodes) out.push((n.id || n.className || n.tagName) + '=' + (n.getAttribute('style') ?? ''));
  return out;
};
const a = snapshot(0), b = snapshot(film.T - 1e-9);
const diffs = a.map((v, i) => [v, b[i]]).filter(([x, y]) => x !== y);
ok('every element has identical styles at t=0 and t=T', diffs.length === 0,
  diffs.slice(0, 3).map(([x, y]) => `\n      a: ${x}\n      b: ${y}`).join(''));
ok('the shape is identical at both ends', shapeStyle(0) === shapeStyle(film.T - 1e-9));
ok('the camera is identical at both ends', worldStyle(0) === worldStyle(film.T - 1e-9));

console.log('\nnamed beats');
ok('t=1.0 — the opening pill is 340x92', /width: 340/.test(shapeStyle(1)) && /height: 92/.test(shapeStyle(1)), shapeStyle(1));
film.seek(5.0);
const typed = document.querySelector('.typed').textContent;
ok('t=5.0 — the task is mid-typed', typed.length > 10 && 'Ship the launch video'.startsWith(typed), JSON.stringify(typed));
film.seek(8.5);
ok('t=8.5 — the slider is being dragged past its max', /scaleX\(1\.[0-9]/.test(document.querySelector('.knob').style.transform), document.querySelector('.knob').style.transform);
film.seek(19.0);
ok('t=19.0 — the odometer is rolling (digit columns move)',
  [...document.querySelectorAll('.odoCol')].some((c) => /translateY\(-?\d/.test(c.style.transform)));
const tilesOn = [...document.querySelectorAll('.tile')].filter((n) => Number(n.style.opacity) > 0.5).length;
ok('t=19.0 — the wall is half-landed (23 of 40)', tilesOn >= 20 && tilesOn <= 28, `${tilesOn} tiles`);
ok('t=21.0 — the toast is on screen', Number(document.querySelector('.toastText').parentElement.style.opacity) > 0.9);
film.seek(0.1);
ok('t=0.1 — the cursor has not been born yet', /scale\(0\.0000\)/.test(document.querySelector('.cursor').style.transform));

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
