#!/usr/bin/env node
// motion/qa.mjs — the review sheet, before and after the render.
//
//   node motion/qa.mjs          → renders/qa/beats.png  (one frame per beat, 8 × 6 contact sheet)
//                                 renders/qa/trans/*.png (each morph at ±0.1s)
//
// This is the skill's step 4: "render one frame per beat before the full render, contact-sheet it,
// and fix anything off the grid, cramped, empty, hard to read or overlapping." Doing it here rather
// than in your head takes ten seconds and saves a six-minute render.
//
// Needs Node ≥ 20, `npm i playwright` (chromium installed) and ffmpeg on PATH.
import { mkdir, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { BEATS, GEOMETRY } from './lib/timeline.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const QA = join(here, 'renders', 'qa');
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css' };
const run = (args) => new Promise((res, rej) => {
  const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('error', rej);
  p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`))));
});

const { chromium } = await import('playwright').catch(() => {
  console.error('\n✗ playwright is not installed: npm i playwright && npx playwright install chromium\n');
  process.exit(1);
});

const srv = createServer(async (req, rq) => {
  const p = new URL(req.url, 'http://x').pathname;
  try {
    const body = await readFile(join(here, p === '/' ? 'index.html' : p));
    rq.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream' });
    rq.end(body);
  } catch { rq.writeHead(404); rq.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const port = srv.address().port;

await rm(QA, { recursive: true, force: true });
await mkdir(join(QA, 'trans'), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:${port}/index.html?export=1`, { waitUntil: 'load' });
await page.waitForFunction('window.__film && window.__film.ready', null, { timeout: 60000 });
// a small stage keeps the contact sheet readable; the grade stays on, as the skill asks
await page.addStyleTag({ content: '#stage{transform:scale(0.3333) !important;transform-origin:0 0 !important}' });

const shot = async (t, file) => {
  await page.evaluate((tt) => window.__film.seek(tt), t);
  await page.screenshot({ clip: { x: 0, y: 0, width: 640, height: 360 }, path: file });
};

const beats = 48;
// one frame per beat, offset a hair past the beat so the hit itself is not what you judge
for (let k = 0; k < beats; k++) await shot(k * 0.5 + 0.12, join(QA, `b${String(k).padStart(2, '0')}.png`));

const morphs = [BEATS.morphComposer, BEATS.morphList, BEATS.morphPlate, BEATS.pullBack, BEATS.morphToast, BEATS.morphPill];
for (const t of morphs) {
  for (const d of [-0.1, 0.1]) await shot(t + d, join(QA, 'trans', `t${t.toFixed(2).replace('.', '_')}_${d > 0 ? 'plus' : 'minus'}.png`));
}

await browser.close();
srv.close();

await run(['-y', '-framerate', '1', '-i', join(QA, 'b%02d.png'),
  '-vf', 'scale=320:-1,tile=8x6:margin=10:padding=10:color=0x0d0f16', '-frames:v', '1',
  join(QA, 'beats.png')]);
console.log(`\n✅ ${join(QA, 'beats.png')}\n   ${join(QA, 'trans')}/ — ${morphs.length * 2} transition frames at ±0.1s`);
console.log(`   geometry in use: pill ${GEOMETRY.pill.w}×${GEOMETRY.pill.h}, list ${GEOMETRY.list.w}×${GEOMETRY.list.h}\n`);
