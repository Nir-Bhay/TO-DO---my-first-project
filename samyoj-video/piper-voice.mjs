// samyoj-video/piper-voice.mjs
//
//   node piper-voice.mjs                     → out/voice/vo-timeline.wav  (scratch narration)
//   node piper-voice.mjs --voice male        → the British male voice instead of Amy
//   node piper-voice.mjs --length 1.12       → slower read (default 1.05)
//
// A LOCAL narration renderer: Piper (neural TTS, runs offline on CPU) with an open English voice.
// It exists for two reasons:
//
//   1 · A scratch track. The film is cut to a grid, so the voice has to land ON that grid — and the
//       fastest way to find out whether a line is too long for its scene is to actually hear it in
//       place. This renders the whole narration in about a minute, offline.
//   2 · A fallback that never blocks. `voice.mjs` (ElevenLabs) is the voice the film deserves; this
//       is the voice that is always available. Same output format, same placement maths, so either
//       one drops into the mix with `--voice`.
//
// THE PLACEMENT RULE (identical to voice.mjs, on purpose):
//   each line starts `--lead` seconds into its own scene and must END inside that scene. If the
//   first take overruns, Piper re-synthesises it FASTER rather than time-compressing the audio —
//   `--length_scale` drives the model's own duration predictor, so there is no pitch smearing and
//   no chipmunk. atempo stays as the last resort, capped.
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCRIPT, sceneWindows } from './brand.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, 'out');
const VO = join(OUT, 'voice');
const FFMPEG = process.env.FFMPEG ?? join(here, 'tools', 'ffmpeg');
const PIPER = process.env.PIPER ?? 'piper';

const argv = process.argv.slice(2);
const arg = (n, d = null) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : (i >= 0 ? true : d); };
const num = (n, d) => { const v = arg(n, d); return v === true ? d : Number(v); };

// The voices live beside the models, not in git (63MB each). `--fetch` gets them from the same
// public repo this project used, through codeload, which needs no account and no API key.
const VOICES = {
  female: { name: 'en_US-amy-medium', label: 'Amy · en-US female, neutral presenter', url: 'https://codeload.github.com/foxdude2012/TextVoiceReader/tar.gz/refs/heads/main' },
  male: { name: 'en_GB-northern_english_male-medium', label: 'Northern English male', url: 'https://codeload.github.com/foxdude2012/TextVoiceReader/tar.gz/refs/heads/main' },
};
const chosen = VOICES[String(arg('voice', 'female'))] ?? VOICES.female;
const modelDir = join(here, 'voices');
const model = join(modelDir, `${chosen.name}.onnx`);

if (!existsSync(model)) {
  console.log(`\n▸ voice not downloaded yet: ${chosen.name}`);
  console.log(`  fetching ${chosen.label} …`);
  const tar = join(modelDir, 'voices.tar.gz');
  await mkdir(modelDir, { recursive: true });
  const dl = spawnSync('curl', ['-sL', chosen.url, '-o', tar], { stdio: 'inherit' });
  if (dl.status !== 0) { console.error('✋ download failed — get the voice manually, see VOICES.md'); process.exit(1); }
  spawnSync('tar', ['-xzf', tar, '-C', modelDir, '--strip-components=3', '--wildcards', '*/Voices/models/*'], { stdio: 'inherit' });
  spawnSync('rm', ['-f', tar]);
  if (!existsSync(model)) { console.error(`✋ extracted, but ${chosen.name}.onnx is not at ${modelDir}`); process.exit(1); }
}

const LEAD = num('lead', 0.5);
const BASE_LENGTH = num('length', 1.05);      // piper's speed knob: >1 is slower
const wins = sceneWindows();

await mkdir(VO, { recursive: true });
console.log(`\n▸ ${chosen.label}`);
console.log(`  piper ${PIPER} · model ${chosen.name} · length_scale ${BASE_LENGTH} · lead ${LEAD}s\n`);

/** One piper take. Returns the file path; WAV 22050 mono, which is what the model speaks. */
function speak(text, file, lengthScale) {
  const r = spawnSync(PIPER, ['-m', model, '-f', file, '--length_scale', String(lengthScale), '--noise_scale', '0.6', '--noise_w', '0.8'],
    { input: text, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`piper failed: ${(r.stderr || '').slice(-300)}`);
  return file;
}
/** Duration, straight from ffmpeg's probe — no guessing from file size. */
function duration(file) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(r.stderr ?? '');
  return m ? (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]) : 0;
}

const report = [];
for (let i = 0; i < wins.length; i++) {
  const w = wins[i];
  const window = w.len - LEAD - 0.25;
  const file = join(VO, `line-${String(i + 1).padStart(2, '0')}-${w.id}.wav`);
  process.stdout.write(`  ${w.id.padEnd(10)} ${(window.toFixed(2) + 's window').padEnd(16)} `);

  let scale = BASE_LENGTH;
  let d = duration(speak(w.vo, file, scale));
  const first = d;
  // one corrective pass: ask the model to speak it faster, aim at 94% of the window
  if (d > window * 0.98) {
    scale = BASE_LENGTH * (window * 0.94) / d;
    d = duration(speak(w.vo, file, scale));
  }
  // last resort: real time compression, capped, and only if the model pass was not enough
  const tempo = d > window ? Math.min(d / (window * 0.98), 1.18) : 1;
  const verdict = tempo > 1 ? `×${tempo.toFixed(3)} tempo` : d > window * 0.94 ? 'tight' : 'fits';
  console.log(`${first.toFixed(2)}s → ${d.toFixed(2)}s${scale !== BASE_LENGTH ? ` (length_scale ${scale.toFixed(3)})` : ''} ${verdict}`);
  report.push({ id: w.id, file, window: +window.toFixed(3), first: +first.toFixed(3), seconds: +d.toFixed(3), lengthScale: +scale.toFixed(3), tempo: +tempo.toFixed(3) });
}

// place every line at its scene start — the same arithmetic voice.mjs uses, so the two are swappable
const inputs = [];
const parts = [];
for (let i = 0; i < report.length; i++) {
  const r = report[i];
  inputs.push('-i', r.file);
  const at = Math.round((wins[i].t0 + LEAD) * 1000);
  const chain = [];
  if (r.tempo > 1) chain.push(`atempo=${r.tempo.toFixed(4)}`);
  // the voice gets a small, honest polish: a high-pass so it does not fight the sub-bass, and a
  // gentle level tilt. Anything heavier starts to sound processed, which is the opposite of premium.
  chain.push('highpass=f=85', 'acompressor=threshold=-18dB:ratio=2:attack=20:release=250', 'volume=1.15');
  chain.push(`adelay=${at}|${at}`, 'aresample=48000', 'aformat=channel_layouts=stereo');
  parts.push(`[${i}:a]${chain.join(',')}[v${i}]`);
}
parts.push(`${report.map((_, i) => `[v${i}]`).join('')}amix=inputs=${report.length}:normalize=0:duration=longest,`
  + 'atrim=0:60,apad,atrim=0:60,alimiter=limit=0.95[out]');

const timeline = join(VO, 'vo-timeline.wav');
const mix = spawnSync(FFMPEG, ['-y', '-hide_banner', '-loglevel', 'error', ...inputs, '-filter_complex', parts.join(';'),
  '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', timeline], { encoding: 'utf8' });
if (mix.status !== 0) { console.error('✋ mix failed:', (mix.stderr || '').slice(-400)); process.exit(1); }

const total = report.reduce((a, r) => a + r.seconds, 0);
await writeFile(join(VO, 'voice-report.json'), JSON.stringify({ engine: 'piper', voice: chosen.name, lead: LEAD, lengthScale: BASE_LENGTH, lines: report }, null, 2));
console.log(`\n✅ ${timeline}`);
console.log(`   ${report.length} lines · ${total.toFixed(1)}s of speech inside a 60.0s film`);
const tight = report.filter((r) => r.tempo > 1 || r.seconds > r.window * 0.94);
if (tight.length) console.log(`   ⚠ tight against its scene: ${tight.map((r) => r.id).join(', ')} — short copy in brand.mjs is always better than a faster read`);
console.log(`\nnext:`);
console.log(`   node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav --out out/audio-master-vo.wav`);
console.log(`   node render.mjs --remux --mix out/audio-master-vo.wav --suffix -with-voice\n`);
