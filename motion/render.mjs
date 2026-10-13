#!/usr/bin/env node
// motion/render.mjs — the film, to MP4.
//
//   node motion/render.mjs --out renders/todo-launch.mp4 [--music song.mp3]
//                          [--w 1920 --h 1080 --fps 60 --subframes 4 --start 0 --end 24]
//
// This is the skill's render stage, unchanged in spirit:
//
//   Playwright, 4 subframes per frame centred on the frame time:
//       subT(i) = floor(i/4)/60 + ((i%4) − 1.5)/240
//   ffmpeg tmix blends the four into real motion blur at a 240→60 downsample — the shutter-angle
//   feel you cannot fake with easing.
//
// Requires: Node ≥ 20, `npm i playwright` + `npx playwright install chromium`, and ffmpeg on PATH.
// The film is served over a local http server because ES modules will not load from file://.
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const arg = (name, def) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
};
const has = (name) => argv.includes(`--${name}`);

const OUT = resolve(arg('out', join(here, 'renders', 'todo-launch.mp4')));
const MUSIC = arg('music', null);
const W = Number(arg('w', 1920));
const H = Number(arg('h', 1080));
const FPS = Number(arg('fps', 60));
const SUB = Number(arg('subframes', 4)); // 4 = 240fps source for tmix
const CHUNK = Number(arg('chunk', 480)); // frames per segment, for machines with a small disk
const LOOP = has('loop'); // fade the mux so the cycle joins without a click
const START = Number(arg('start', 0));
const END = Number(arg('end', 0)) || null;

const MIME = { '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };

const serve = () => new Promise((res) => {
  const srv = createServer(async (req, rq) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = join(here, p === '/' ? 'index.html' : p);
    try {
      const body = await readFile(file);
      rq.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      rq.end(body);
    } catch { rq.writeHead(404); rq.end('nope'); }
  });
  srv.listen(0, '127.0.0.1', () => res(srv));
});

const run = (cmd, args, label) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('error', rej);
  p.on('exit', (code) => (code === 0 ? res() : rej(new Error(`${label} exited ${code}`))));
});

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';

async function main() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('\n✗ playwright is not installed.\n  npm i playwright && npx playwright install chromium\n');
    process.exit(1);
  }

  const srv = await serve();
  const { port } = srv.address();
  const tmp = join(here, 'renders', '.frames');
  await mkdir(tmp, { recursive: true });

  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
  let page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/index.html?export=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.__film && window.__film.ready', null, { timeout: 60000 });

  const T = await page.evaluate('window.__film.T');
  const end = END ?? T;
  const frames = Math.round((end - START) * FPS);
  console.log(`\n▸ ${frames} frames · ${SUB} subframes each · ${W}×${H} @ ${FPS}fps · ${(end - START).toFixed(2)}s`);

  const shot = async (i) => {
    const t = START + Math.floor(i / SUB) / FPS + ((i % SUB) - (SUB - 1) / 2) / (FPS * SUB);
    await page.evaluate((tt) => window.__film.seek(tt), t);
    return page.screenshot({ clip: { x: 0, y: 0, width: W, height: H }, path: join(tmp, `s${String(i).padStart(5, '0')}.png`) });
  };

  const segs = [];
  for (let s = 0; s < frames; s += CHUNK) {
    const upto = Math.min(frames, s + CHUNK);
    for (let i = s * SUB; i < upto * SUB; i++) {
      const idx = i - s * SUB;
      try {
        await shot(i);
      } catch (e) {
        // the skill's resilience note: a dead page is not a dead render — relaunch and retry once
        console.log(`\n  ! subframe ${i} failed (${e.message.split('\n')[0]}) — relaunching chromium`);
        await page.close().catch(() => {});
        page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
        await page.goto(`http://127.0.0.1:${port}/index.html?export=1`, { waitUntil: 'load' });
        await page.waitForFunction('window.__film && window.__film.ready', null, { timeout: 60000 });
        await shot(i);
      }
      if (idx % 240 === 0) process.stdout.write(`\r  rendering ${Math.round(((i - s * SUB) / (upto - s) / SUB) * 100)}%  `);
    }
    const seg = join(tmp, `seg${String(segs.length).padStart(3, '0')}.mp4`);
    await run(ffmpeg, [
      '-y', '-framerate', String(FPS * SUB), '-i', join(tmp, 's%05d.png'),
      '-vf', `tmix=frames=${SUB}:weights='${Array(SUB).fill(1).join(' ')}',select='eq(mod(n\\,${SUB})\\,${SUB - 1})',setpts=N/(${FPS}*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
      '-r', String(FPS), '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-tune', 'film',
      '-pix_fmt', 'yuv420p', seg,
    ], 'ffmpeg (segment)');
    segs.push(seg);
    for (let i = s * SUB; i < upto * SUB; i++) await rm(join(tmp, `s${String(i).padStart(5, '0')}.png`), { force: true });
    process.stdout.write('\r  ');
  }
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
  srv.close();

  if (segs.length > 1) {
    const list = join(tmp, 'concat.txt');
    await (await import('node:fs/promises')).writeFile(list, segs.map((s) => `file '${s}'`).join('\n'));
    await run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', join(tmp, 'video.mp4')], 'ffmpeg (concat)');
  } else {
    await run(ffmpeg, ['-y', '-i', segs[0], '-c', 'copy', join(tmp, 'video.mp4')], 'ffmpeg (copy)');
  }

  await mkdir(dirname(OUT), { recursive: true });
  const tags = ['-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-movflags', '+faststart'];
  if (MUSIC) {
    // two inputs, video copied, audio encoded once. Loudness is measured, never assumed:
    //   ffmpeg -i out.mp4 -af ebur128=peak=true -f null -
    await run(ffmpeg, [
      '-y', '-i', join(tmp, 'video.mp4'), '-i', MUSIC,
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
      ...(LOOP ? ['-af', `afade=t=in:st=0:d=0.15,afade=t=out:st=${(end - START - 0.25).toFixed(2)}:d=0.25`] : []),
      '-shortest', ...tags, OUT,
    ], 'ffmpeg (mux)');
  } else {
    await run(ffmpeg, ['-y', '-i', join(tmp, 'video.mp4'), ...tags, OUT], 'ffmpeg (final)');
  }
  console.log(`\n✅ ${OUT}\n`);
}

main().catch((e) => { console.error(`\n✗ ${e.message}\n`); process.exit(1); });
