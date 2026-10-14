// samyoj-video/gen-shotlist.mjs — the film written out as a document, generated from the code
//
//   node gen-shotlist.mjs  →  deliver/SHOT-LIST.md
//
// Every number here comes from the same modules the picture is rendered from (brand.mjs for the
// scene windows and copy, film.mjs for the cue list), so the document cannot drift from the film.
// This is the file you send to a client, a translator, a social team, or your future self.
import { writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilm } from './film.mjs';
import { SCRIPT, sceneWindows, W, H, FPS, BPM } from './brand.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const film = buildFilm({});
const wins = sceneWindows();
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.round((s % 1) * 100)).padStart(2, '0')}`;

const WHAT = {
  hook: 'The hook, and the whole thesis in one frame: the customer is already in a chat window. A real question arrives, the AI answers it, the human never sees it.',
  broadcast: 'Scale, proved by a number that counts itself: 12,480 messages delivered, the tiles filling as you watch. This is the scene that makes "thousands" literal.',
  ai: 'The product, not the promise: a question arrives and the answer is already there, with sources behind it (Docs, FAQs, Catalog, Orders, Policies, Pricing) and an honest 0.4s receipt.',
  flows: 'What happens without anyone watching: capture → answer → human handoff, drawn as the flow the user actually builds. The 24/7 chip is the only claim, and it lands last.',
  inbox: 'Context, not just chat: one inbox, and every conversation carrying tags, stages and an owner. The right panel is what the sales team actually reads.',
  commerce: 'Money inside the thread: catalog, product, an order placed and ₹1,299 received — the receipt is the argument.',
  ads: 'Where the customers come from: an ad click, a conversation, a conversion — measured end to end, 3.2× ROAS, 28.5% CVR.',
  cta: 'The close. Logo lockup, one line of what the company is, one button, and the platform\'s own published numbers as the last word before the pulse.',
};

const lines = [];
lines.push(`# Samyoj — 60-second launch film · shot list`);
lines.push('');
lines.push(`**${W}×${H} · ${FPS} fps · ${film.T.toFixed(3)} s · ${BPM} BPM · ${wins.length} scenes · ${film.cues.length} sound cues**`);
lines.push('');
lines.push(`Generated from the film's own source (\`node gen-shotlist.mjs\`), so every timestamp below is the`);
lines.push(`timestamp the picture was actually cut to.`);
lines.push('');
lines.push('| # | In | Out | Len | Scene |');
lines.push('|---|------|------|-----|-------|');
for (const w of wins) lines.push(`| ${w.i + 1} | ${fmt(w.t0)} | ${fmt(w.t1)} | ${w.len.toFixed(2)}s | **${w.scene}** |`);
lines.push('');
lines.push('---');
lines.push('');

for (const w of wins) {
  lines.push(`## ${w.i + 1} · ${w.scene}   \`${fmt(w.t0)} → ${fmt(w.t1)}\`  (${w.len.toFixed(2)}s)`);
  lines.push('');
  lines.push(`**On screen** — ${WHAT[w.id]}`);
  lines.push('');
  if (w.head) { lines.push(`**Headline** · "${w.head.replace(/\n/g, '" / "')}"`); lines.push(''); }
  lines.push(`**Eyebrow** · ${w.label}`);
  lines.push('');
  lines.push(`**Voiceover** (starts at ${(w.t0 + 0.5).toFixed(2)}s) · "${w.vo}"`);
  lines.push('');
  const cues = film.cues.filter((c) => c.t >= w.t0 - 1e-6 && c.t <= w.t1 + 1e-6);
  const rel = cues.map((c) => `\`+${(c.t - w.t0).toFixed(2)}\` ${c.kind}`).join(' · ');
  lines.push(`**Sound** (${cues.length} cues, at scene-relative time) — ${rel}`);
  lines.push('');
}

lines.push('---');
lines.push('');
lines.push('## Timeline — every cue in the film');
lines.push('');
lines.push('| t | scene | cue | gain | on the beat |');
lines.push('|---|-------|-----|------|-------------|');
const BEAT = 60 / BPM;
for (const c of film.cues) {
  const k = c.t / (BEAT / 4);
  const off = (Math.abs(k - Math.round(k)) * (BEAT / 4) * 1000).toFixed(0);
  const s = film.sceneAt(c.t);
  lines.push(`| ${c.t.toFixed(2)}s | ${s.id} | ${c.kind} | ${c.gain.toFixed(2)} | ${off} ms |`);
}
lines.push('');
lines.push(`## How it was made`);
lines.push('');
lines.push('Every frame is drawn by code (`film.mjs` → `scenes.mjs`) and piped raw into ffmpeg at 1080p60 —');
lines.push('no stock, no footage, no editor. The soundtrack is synthesised in `lib/audio-synth.mjs` from');
lines.push('ffmpeg expressions: a 120 BPM bed plus eleven UI sounds, placed by this cue list. The narration');
lines.push('is rendered separately (`voice.mjs` for ElevenLabs, `piper-voice.mjs` offline) and placed on the');
lines.push('same grid, so either voice drops into the same mix.');
lines.push('');

await mkdir(join(here, 'deliver'), { recursive: true });
await writeFile(join(here, 'deliver', 'SHOT-LIST.md'), lines.join('\n'));
console.log(`✅ deliver/SHOT-LIST.md — ${lines.length} lines, ${wins.length} scenes, ${film.cues.length} cues`);
