// samyoj-video/voice.mjs
//
// The narration. ElevenLabs, rendered where the internet is — on YOUR machine, not in the sandbox
// where this film was built.
//
//   export ELEVENLABS_API_KEY=...        (preferred: never lands in your shell history)
//   node voice.mjs --voices              list the voices on your account, with ids
//   node voice.mjs --voice <id>          render every scene's line → out/voice/line-<scene>.mp3
//                                        + out/voice/vo-timeline.wav, already placed on the grid
//   node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav
//                                        rebuild the master mix with the voice under the music
//   node render.mjs --remux              re-wrap the finished picture with the new mix (seconds)
//
// WHY IT IS BUILT THIS WAY
//
// The film is a fixed 60.000s, 120 BPM grid: scene windows of [7, 6, 7, 8, 7, 5, 6.5, 13.5]
// seconds and eighty sound cues placed on the beat. The voice therefore has to LAND ON THE GRID —
// so this tool renders one clip per scene (per-line prosody, exact placement) rather than a single
// improvised take that drifts. Each line is measured against its own window and, if it overruns,
// time-compressed with ffmpeg's `atempo` (pitch-preserving) up to the limit you allow, and it tells
// you when a line is simply too long for its scene — which is a copy problem, not an audio problem.
//
// For the smoothest possible voice, the defaults below are the ones ElevenLabs' own guidance lands
// on for a presenter read: stability low-but-not-wild, similarity high, style almost off (style
// makes v2 emote, and emotion at the cost of consistency is exactly what "smooth" must not be), and
// speaker boost on. `--mode one` renders the whole script as ONE take instead — the most natural
// prosody of all, at the cost of exact scene placement.
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPT, sceneWindows } from './brand.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, 'out');
const VO = join(OUT, 'voice');
const FFMPEG = process.env.FFMPEG ?? join(here, 'tools', 'ffmpeg');
const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : (i >= 0 ? true : d); };
const num = (n, d) => { const v = arg(n, d); return v === true ? d : Number(v); };

const API = 'https://api.elevenlabs.io/v1';
const KEY = process.env.ELEVENLABS_API_KEY ?? (typeof arg('key') === 'string' ? arg('key') : null);
const MODEL = String(arg('model', 'eleven_multilingual_v2'));
const MODE = String(arg('mode', 'lines'));                 // lines | one
const SPEED_MAX = num('speed-max', 1.14);                  // never compress harder than this
const LEAD = num('lead', 0.5);                             // voice starts this far into its scene
const TAIL = num('tail', 0.25);                            // and must clear the scene by this much

// the presenter read: steady, warm, no theatrics
const SETTINGS = {
  stability: num('stability', 0.45),
  similarity_boost: num('similarity', 0.82),
  style: num('style', 0.12),
  use_speaker_boost: !argv.includes('--no-boost'),
};

const wins = sceneWindows();
const run = (args, bin = FFMPEG) => new Promise((res, rej) => {
  const p = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '', err = '';
  p.stdout.on('data', (d) => { out += d; });
  p.stderr.on('data', (d) => { err += d; });
  p.on('exit', (c) => (c === 0 ? res(out) : rej(new Error(`${bin} ${args.slice(0, 4).join(' ')}… exited ${c}\n${err.slice(-500)}`))));
});
/** Duration in seconds, straight from ffmpeg's own probe output. */
const duration = async (file) => {
  const err = await run(['-hide_banner', '-i', file, '-f', 'null', '-']).catch((e) => e.message);
  const m = String(err).match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
};

if (!KEY) {
  console.error(`
✋ No API key.

   export ELEVENLABS_API_KEY=...        ← this way the key never enters your shell history
   node voice.mjs --voices

   or pass it for one run:  node voice.mjs --key sk_... --voices
   (--key is supported, but the environment variable is the safer habit.)
`);
  process.exit(1);
}
const auth = { 'xi-api-key': KEY };

// ── list voices ─────────────────────────────────────────────────────────────────────────────────
if (argv.includes('--voices') || argv.includes('--list-voices')) {
  const r = await fetch(`${API}/voices`, { headers: auth });
  if (!r.ok) { console.error(`✋ ${r.status} ${r.statusText} — ${(await r.text()).slice(0, 300)}`); process.exit(1); }
  const { voices } = await r.json();
  console.log(`\n${voices.length} voices on this account:\n`);
  for (const v of voices) {
    const l = v.labels ?? {};
    const tags = [l.accent, l.gender, l.age, l.description, l.use_case].filter(Boolean).join(' · ');
    console.log(`  ${v.voice_id}  ${v.name.padEnd(22)} ${tags}`);
  }
  console.log(`
Pick one for a premium Indian-English presenter read — the labels tell you what you have. Then:
  node voice.mjs --voice <voice_id>\n`);
  process.exit(0);
}

const VOICE = typeof arg('voice') === 'string' ? arg('voice') : (process.env.ELEVENLABS_VOICE ?? null);
if (!VOICE) { console.error('✋ --voice <voice_id> is required (run --voices first to see yours)'); process.exit(1); }

await mkdir(VO, { recursive: true });
console.log(`\n▸ ${MODEL} · voice ${VOICE} · stability ${SETTINGS.stability} · similarity ${SETTINGS.similarity_boost} · style ${SETTINGS.style}`);

/** One TTS call. 192kbps MP3: the encoder is never the weak link, so the voice is never smeared. */
async function speak(text, file) {
  const r = await fetch(`${API}/text-to-speech/${VOICE}?output_format=mp3_44100_192`, {
    method: 'POST',
    headers: { ...auth, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: SETTINGS }),
  });
  if (!r.ok) throw new Error(`TTS ${r.status}: ${(await r.text()).slice(0, 400)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await writeFile(file, buf);
  return buf.length;
}

// ── mode: one continuous take ───────────────────────────────────────────────────────────────────
if (MODE === 'one') {
  const text = SCRIPT.map((s) => s.vo).join('\n\n');
  const file = join(VO, 'vo-one-take.mp3');
  const bytes = await speak(text, file);
  const d = await duration(file);
  console.log(`\n✅ ${file}  (${(bytes / 1024).toFixed(0)} KB · ${d.toFixed(2)}s)`);
  console.log(`   the film is 60.00s: ${d <= 60 ? 'it fits, place it at 0.5s' : `it is ${(d - 60).toFixed(2)}s too long`}`);
  if (d > 60) console.log(`   → shorten the copy, or:  node voice.mjs --fit-in ${file}`);
  process.exit(0);
}

/** Re-time a single file into the film's length with pitch-preserving atempo (`--fit-in`). */
if (typeof arg('fit-in') === 'string') {
  const src = arg('fit-in');
  const d = await duration(src);
  const need = d / (60 - LEAD - TAIL);
  if (need <= 1.001) { console.log(`it already fits (${d.toFixed(2)}s)`); process.exit(0); }
  if (need > SPEED_MAX) console.log(`⚠ needs ×${need.toFixed(3)} speed, above the ×${SPEED_MAX} you allowed — the read will sound rushed`);
  const outFile = join(VO, 'vo-timeline.wav');
  await run(['-y', '-i', src, '-af', `atempo=${need.toFixed(4)},adelay=${Math.round(LEAD * 1000)}|${Math.round(LEAD * 1000)}`, '-t', '60', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', outFile]);
  console.log(`✅ ${outFile}  (×${need.toFixed(3)} speed, placed at ${LEAD}s)`);
  process.exit(0);
}

// ── mode: one clip per scene, placed on the grid ────────────────────────────────────────────────
const report = [];
for (let i = 0; i < wins.length; i++) {
  const w = wins[i];
  const file = join(VO, `line-${String(i + 1).padStart(2, '0')}-${w.id}.mp3`);
  process.stdout.write(`  ${w.id.padEnd(10)} ${(w.len + 's').padEnd(6)} `);
  const bytes = await speak(w.vo, file);
  const d = await duration(file);
  const window = w.len - LEAD - (i === wins.length - 1 ? TAIL : 0);
  const need = d / window;
  report.push({ id: w.id, file, seconds: +d.toFixed(3), window: +window.toFixed(3), speed: +Math.max(1, need).toFixed(3), bytes });
  const flag = need > 1.001 ? (need > SPEED_MAX ? `⚠ ${(need * 100 - 100).toFixed(0)}% over — cut words` : `→ ×${need.toFixed(3)}`) : 'fits';
  console.log(`${d.toFixed(2)}s  ${flag}`);
}

// place every line at its scene start, compressing only what needs it
const inputs = [];
const parts = [];
for (let i = 0; i < report.length; i++) {
  const r = report[i];
  inputs.push('-i', r.file);
  const at = Math.round((wins[i].t0 + LEAD) * 1000);
  const chain = [`adelay=${at}|${at}`];
  if (r.speed > 1.001) chain.unshift(`atempo=${Math.min(r.speed, 1.6).toFixed(4)}`);
  parts.push(`[${i}:a]${chain.join(',')},aresample=48000[v${i}]`);
}
parts.push(`${report.map((_, i) => `[v${i}]`).join('')}amix=inputs=${report.length}:normalize=0:duration=longest,`
  + `atrim=0:60,apad,atrim=0:60,alimiter=limit=0.95[out]`);
const timeline = join(VO, 'vo-timeline.wav');
await run(['-y', ...inputs, '-filter_complex', parts.join(';'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', timeline]);
await writeFile(join(VO, 'voice-report.json'), JSON.stringify({ model: MODEL, voice: VOICE, settings: SETTINGS, lead: LEAD, lines: report }, null, 2));

console.log(`\n✅ ${timeline}\n   ${report.map((r) => `${r.id} ${r.seconds}s${r.speed > 1.001 ? ` (×${r.speed})` : ''}`).join(' · ')}`);
console.log(`\nnext:`);
console.log(`   node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav    rebuild the mix (music ducks under the voice)`);
console.log(`   node render.mjs --remux                                      re-wrap the finished picture`);
console.log(`\n   if a line ran over its window, edit that line in brand.mjs (SCRIPT[i].vo) — shorter is`);
console.log(`   always better than faster: a premium film sounds calm, and the art is already beat-locked.\n`);
