// samyoj-video/serve.mjs — the reviewer's room, on a port.
//   node serve.mjs [port]        → http://localhost:8100
// Serves the folder it lives in: preview/index.html at the root, the film and render.json beside it.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT || 8100);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.mp4': 'video/mp4', '.m4a': 'audio/mp4',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent((req.url || '/').split('?')[0]);
    let path = normalize(join(here, url === '/' ? 'preview/index.html' : url));
    if (!path.startsWith(here)) { res.writeHead(403).end('no'); return; }
    const st = await stat(path).catch(() => null);
    if (st?.isDirectory()) path = join(path, 'index.html');
    // range requests, because a 60s 1080p60 file must be seekable in the player
    const size = (await stat(path)).size;
    const range = req.headers.range;
    const head = { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'no-cache' };
    if (range) {
      const m = /bytes=(\d*)-(\d*)/.exec(range);
      const start = m[1] ? Number(m[1]) : 0;
      const end = m[2] ? Number(m[2]) : size - 1;
      res.writeHead(206, { ...head, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
      (await import('node:fs')).createReadStream(path, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { ...head, 'content-length': size });
      (await import('node:fs')).createReadStream(path).pipe(res);
    }
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not here');
  }
}).listen(PORT, '0.0.0.0', () => console.log(`\n  ▶ http://localhost:${PORT}   (Samyoj film + chapters)\n`));
