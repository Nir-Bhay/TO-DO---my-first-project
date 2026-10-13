// samyoj-video/bench.mjs — `node bench.mjs`  how long a full render will take, before you start it
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { buildFilm } from './film.mjs';
import { FPS, W, H } from './brand.mjs';

for (const [f, a] of [['Inter-SemiBold', 'InterSemi'], ['Inter-ExtraBold', 'InterX'], ['Inter-Black', 'InterBlack'], ['Inter-Medium', 'InterMed']]) {
  GlobalFonts.registerFromPath(`fonts/${f}.ttf`, a);
}
const film = buildFilm({});
const main = createCanvas(W, H);
film.initOffscreen((w, h) => createCanvas(w, h));

const times = [1, 4, 8, 12, 16, 20, 26, 32, 38, 43, 49, 53, 57];
let t0 = Date.now();
for (const t of times) film.drawScene(main.getContext('2d'), t);
const scene = (Date.now() - t0) / times.length;
t0 = Date.now();
for (const t of times) film.drawGrade(main.getContext('2d'), t);
const grade = (Date.now() - t0) / times.length;
t0 = Date.now();
for (let i = 0; i < 8; i++) main.toBuffer('image/png');
const png = (Date.now() - t0) / 8;

const per = scene * 4 + grade + png;
console.log(`film T = ${film.T.toFixed(2)}s · ${film.wins.length} scenes · ${film.cues.length} cues`);
console.log(film.wins.map((w) => `${w.id}:${w.len.toFixed(1)}s`).join('  '));
console.log(`drawScene ${scene.toFixed(1)}ms · drawGrade ${grade.toFixed(1)}ms · PNG ${png.toFixed(0)}ms`);
console.log(`per output frame (4 subframes) ≈ ${per.toFixed(0)}ms → ${(per * FPS * film.T / 60000).toFixed(1)} min for the full ${film.T.toFixed(0)}s at ${FPS}fps`);
