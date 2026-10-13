// samyoj-video/lib/audio-synth.mjs
//
// The film's soundtrack, synthesized from scratch.  `node lib/audio-synth.mjs`
//
// No sample library, no purchased track, nothing to license. A 120 BPM bed and eleven UI sounds are
// built out of ffmpeg's `aevalsrc` expressions, so the whole mix is reproducible from this file
// alone — and it is placed by the film's own cue list, which means picture and sound cannot drift.
//
//   node lib/audio-synth.mjs                  → out/audio-master.wav (+ out/audio-report.json)
//   node lib/audio-synth.mjs --voice <wav|mp3> → mix that narration under the bed instead
//   node lib/audio-synth.mjs --no-music        → effects only (for checking cue placement)
//
// Music structure (30 bars of 4/4 at 120 BPM = 60.0s, one bar per 2s):
//    bars 1–2   intro: pad + sparse kick
//    bars 3–14  main: kick every beat, hats on the off-8ths, claps on 2 & 4, pentatonic sub-bass
//    bars 15–29 the drop: +16th ghost kicks, brighter hats, higher pad
//    bar 30     outro: the film's last green pulse, decaying
import { spawn } from 'node:child_process';
import { mkdir, writeFile, rm, access } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFilm } from '../film.mjs';
import { BPM } from '../brand.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const OUT = join(ROOT, 'out');
const TMP = join(OUT, '.audio');
const FFMPEG = process.env.FFMPEG ?? join(ROOT, 'tools', 'ffmpeg');
const SR = 48000;
const argv = process.argv.slice(2);
const arg = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const has = (n) => argv.includes(n);

const film = buildFilm({});
const T = film.T;                    // 60.0s
const BEAT = 60 / BPM;               // 0.5s
const BARS = Math.round(T / (BEAT * 4));

const run = (args, label) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += d; });
  p.on('exit', (c) => (c === 0 ? res() : rej(new Error(`${label}: ${err.slice(-600)}`))));
});

await mkdir(TMP, { recursive: true });
await mkdir(OUT, { recursive: true });

// ── the bed ─────────────────────────────────────────────────────────────────────────────────────
// Each layer is one expression over the whole 60s: periodic envelopes are phases of `mod(t, …)`,
// which is what keeps a 60-second bed to a handful of filters instead of thousands of notes.
const KICK_P = BEAT;                       // a kick on every beat
const HAT_P = BEAT / 2;                    // hats on the off-8ths
const CLAP_P = BEAT * 2;                   // claps on 2 and 4
const bar = (t) => Math.floor(t / (BEAT * 4)) + 1;
/** white noise in [-1,1]: ffmpeg's random() returns 0..1, and a DC offset in a "noise" layer hums */
const nz = (i) => "(random(" + i + ")*2-1)";
/** every comma inside a filter option must be escaped, or ffmpeg reads it as a new filter */
const esc = (x) => String(x).replace(/,/g, "\\,");
/** a note sequence as a balanced nested if-chain over one repeating bar */
const notes = (freqs, step = 0.5) => {
  const total = freqs.length * step;
  const at = (i) => (i === freqs.length - 1
    ? String(freqs[i])
    : "if(lt(mod(t," + total + ")," + ((i + 1) * step).toFixed(3) + ")," + freqs[i] + "," + at(i + 1) + ")");
  return esc(at(0));
};

const layers = [
  // the low thump, pitched by a fast-decaying envelope — the standard synthesized kick
  ['kick', `0.62*exp(-mod(t\\,${KICK_P})*15)*(0.85*sin(2*PI*(58+420*exp(-mod(t\\,${KICK_P})*55))*t)+0.22*sin(2*PI*1500*t)*exp(-mod(t\\,${KICK_P})*90))`],
  // ghost kicks in the drop (bars 15+): quieter, on the "and"
  ['ghost', `0.24*gt(t\\,${(15 - 1) * BEAT * 4})*exp(-mod(t-${(BEAT / 2).toFixed(3)}\\,${KICK_P})*22)*sin(2*PI*(60+380*exp(-mod(t-${(BEAT / 2).toFixed(3)}\\,${KICK_P})*60))*t)`],
  // hats: filtered noise, tight decay
  ['hat', `0.075*(${nz(0)}*0.5+${nz(1)}*0.5)*exp(-mod(t\\,${HAT_P})*95)`],
  // claps (from bar 5): a short noise burst on beats 2 and 4
  ['clap', `0.16*gt(t\\,${(5 - 1) * BEAT * 4})*exp(-mod(t-${BEAT.toFixed(3)}\\,${CLAP_P})*30)*(${nz(2)}*0.6+${nz(3)}*0.4)`],
  // sub-bass: an A-minor pentatonic figure, one note per 8th, in a 4-second bar
  // A-minor pentatonic, one note per 8th: A2 C3 D3 E3 G3 E3 D3 C3
  ['bass', `0.20*(1-exp(-t*2))*gt(t\\,6.0)*sin(2*PI*(${notes([110, 130.81, 146.83, 164.81, 196, 164.81, 146.83, 130.81])})*t)*exp(-mod(t\\,0.5)*2.2)`],
  // the pad: two soft tones a fifth apart, breathing once per bar
  ['pad', `0.030*sin(2*PI*220*t)*(0.6+0.4*sin(2*PI*t/4))+0.022*sin(2*PI*329.63*t)*(0.6+0.4*sin(2*PI*t/4+1.1))`],
  // the riser into the end card: white noise swelling over the last two seconds of scene 7
  ['riser', `0.0*${nz(4)}`],
];
const RISER_AT = film.wins[7].t0 - 2.0;    // two seconds of build into the CTA

// the riser needs a gate, and it is the only layer with a non-periodic envelope
layers[layers.length - 1][1] = `0.30*max(0\\,min(1\\,(t-${RISER_AT.toFixed(2)})/2))*min(1\\,max(0\\,(${(RISER_AT + 2).toFixed(2)}-t)*3+1))*(${nz(4)}*0.7+${nz(5)}*0.3)*(0.35+0.65*(t-${RISER_AT.toFixed(2)})/2)`;

console.log(`\n▸ synthesizing the bed — ${BARS} bars, ${BPM} BPM, ${T.toFixed(1)}s`);
const musicFiles = [];
for (const [name, expr] of layers) {
  const f = join(TMP, `m-${name}.wav`);
  await run(['-y', '-f', 'lavfi', '-i', `aevalsrc=${expr}:s=${SR}:d=${T.toFixed(3)}:c=stereo`,
    '-af', name === 'hat' || name === 'clap' || name === 'riser'
      ? 'highpass=f=3500,lowpass=f=12000,volume=1.0'         // cymbal noise shaping
      : name === 'kick' || name === 'ghost'
        ? 'lowpass=f=700,volume=1.6'
        : name === 'bass' ? 'lowpass=f=320,volume=1.3' : 'volume=1.0',
    '-c:a', 'pcm_s16le', f], `bed:${name}`);
  musicFiles.push({ name, f });
}

// ── the effects ──────────────────────────────────────────────────────────────────────────────────
// One hit per kind, then every cue is that hit delayed to its own moment. `lead` is how long before
// its cue a sound must START so that its own PEAK lands on the beat — the skill's rule 8 in one
// number, and the reason the clicks feel like they hit the drum instead of following it.
const HIT = {
  click: [`0.5*exp(-t*70)*(${nz(0)}*0.8+sin(2*PI*2400*t)*0.5)`, 0.12, 0.045, 'highpass=f=1200'],
  release: [`0.34*exp(-t*44)*${nz(1)}`, 0.18, 0.035, 'bandpass=f=1100:width_type=h:w=700'],
  tick: [`0.28*exp(-t*150)*${nz(2)}`, 0.06, 0.008, 'highpass=f=3800'],
  pop: [`0.42*exp(-t*34)*(sin(2*PI*(190+240*exp(-t*32))*t)+0.3*${nz(3)})`, 0.22, 0.03, 'lowpass=f=2600'],
  blip: [`0.30*exp(-t*28)*(sin(2*PI*(1250+700*exp(-t*10))*t))`, 0.26, 0.02, 'volume=1.1'],
  chime: [`0.30*exp(-t*3.4)*(sin(2*PI*880*t)+0.6*sin(2*PI*1318.5*t)+0.35*sin(2*PI*1760*t))`, 1.10, 0.045, 'highpass=f=300'],
  shimmer: [`0.22*exp(-t*2.6)*(${nz(4)}*0.6+sin(2*PI*2637*t)*0.4)`, 1.30, 0.06, 'highpass=f=2800'],
  whoosh: [`0.34*exp(-pow((t-0.26)/0.20\\,2))*${nz(5)}*(0.2+0.8*sin(2*PI*(0.6*t+0.4)*3))`, 0.62, 0.24, 'bandpass=f=900:width_type=o:w=1.4'],
  thump: [`0.85*exp(-t*9)*(sin(2*PI*(52+120*exp(-t*22))*t)+0.25*exp(-t*40)*sin(2*PI*900*t))`, 0.70, 0.03, 'lowpass=f=420,volume=1.5'],
  riser: [`max(0\\,min(1\\,t/0.95))*(${nz(6)}*0.7+${nz(7)}*0.3)*0.42`, 1.20, 0.0, 'bandpass=f=2600:width_type=o:w=1.2'],
};
const hitFiles = {};
for (const [kind, [expr, dur, lead, af]] of Object.entries(HIT)) {
  const f = join(TMP, `s-${kind}.wav`);
  await run(['-y', '-f', 'lavfi', '-i', `aevalsrc=${expr}:s=${SR}:d=${dur}:c=stereo`, '-af', af, '-c:a', 'pcm_s16le', f], `sfx:${kind}`);
  hitFiles[kind] = { f, dur, lead };
}

// ── assemble ─────────────────────────────────────────────────────────────────────────────────────
const inputs = [];
const add = (file, af = null) => { inputs.push({ file, af }); return inputs.length - 1; };

const idx = { music: {}, sfx: {} };
for (const { name, f } of musicFiles) idx.music[name] = add(f);
const voicePath = arg('--voice');
if (voicePath && existsSync(voicePath)) idx.voice = add(voicePath);

const cueGain = { click: 1.0, release: 0.8, tick: 0.55, pop: 0.9, blip: 0.8, chime: 0.85, shimmer: 0.6, whoosh: 0.8, thump: 1.0, riser: 0.7 };
const sfxCues = film.cues.filter((c) => hitFiles[c.kind]);
for (const c of sfxCues) {
  const h = hitFiles[c.kind];
  const at = Math.max(0, c.t - h.lead);
  const ms = Math.round(at * 1000);
  const g = (cueGain[c.kind] ?? 0.8) * (c.gain ?? 1);
  idx.sfx[`${c.kind}@${c.t}`] = add(h.f, `adelay=${ms}|${ms},volume=${g.toFixed(3)}`);
}

const parts = [];
// music layers, with a gentle duck under the (eventual) narration
for (const [name, i] of Object.entries(idx.music)) {
  const vol = name === 'kick' ? 0.95 : name === 'hat' ? 0.7 : name === 'pad' ? 0.9 : 1.0;
  parts.push(`[${i}:a]volume=${vol}[mus_${name}]`);
}
for (const [key, i] of Object.entries(idx.sfx)) parts.push(`[${i}:a]anull[sfx_${key.replace(/[^a-z0-9]/gi, '_')}]`);

const musLabels = Object.keys(idx.music).map((n) => `[mus_${n}]`).join('');
const sfxLabels = Object.keys(idx.sfx).map((k) => `[sfx_${k.replace(/[^a-z0-9]/gi, '_')}]`).join('');
parts.push(`${musLabels}amix=inputs=${Object.keys(idx.music).length}:normalize=0:duration=longest[music]`);
parts.push(`${sfxLabels}amix=inputs=${Object.keys(idx.sfx).length}:normalize=0:duration=longest[sfx]`);
parts.push(`[music]volume=${has('--no-music') ? 0 : 0.62}[mus]`);
parts.push(`[sfx]volume=0.85[sfxbus]`);
if (idx.voice != null) {
  parts.push(`[${idx.voice}:a]dynaudnorm=f=250:g=9,volume=1.5[vo]`);
  parts.push(`[mus][vo]sidechaincompress=threshold=0.06:ratio=5:attack=12:release=320[musd]`);
  parts.push(`[musd][sfxbus][vo]amix=inputs=3:normalize=0:duration=longest[sum]`);
} else {
  parts.push(`[mus][sfxbus]amix=inputs=2:normalize=0:duration=longest[sum]`);
}
// master chain: tame peaks, then normalise the delivered loudness instead of guessing at it
parts.push(`[sum]acompressor=threshold=-12dB:ratio=2.4:attack=14:release=240:makeup=1.6,`
  + `alimiter=limit=0.97:attack=5:release=60,`
  + `loudnorm=I=-14:TP=-1.0:LRA=11,`
  + `atrim=0:${T.toFixed(3)},asetpts=N/SR/TB[out]`);
// the last beat: the film's final green pulse, decaying into silence
parts.push(`[out]afade=t=out:st=${(T - 1.35).toFixed(3)}:d=1.35[final]`);

// `--out <file>` builds a variant mix beside the master without touching it (auditioning a voice,
// comparing two beds, testing the chain with a scratch narration). Default = the deliverable.
const master = typeof arg('out') === 'string' ? arg('out') : join(OUT, 'audio-master.wav');
const filterFile = join(TMP, 'graph.txt');
await writeFile(filterFile, parts.join(';\n'), 'utf8');
console.log(`▸ mixing ${Object.keys(idx.music).length} music layers + ${Object.keys(idx.sfx).length} sound cues${idx.voice != null ? ' + narration' : ''}`);
await run([
  '-y', ...inputs.flatMap((i) => ['-i', i.file]),
  '-filter_complex_script', filterFile,
  '-map', '[final]', '-ar', String(SR), '-ac', '2', '-c:a', 'pcm_s16le', master,
], 'master mix');

// ── measure the delivered file (law: never trust the mix you did not measure) ────────────────────
const measure = await new Promise((res) => {
  const p = spawn(FFMPEG, ['-hide_banner', '-i', master, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => { err += d; });
  p.on('exit', () => res(err));
});
const grab = (re) => {
  const all = [...measure.matchAll(new RegExp(re, 'g'))];
  return all.length ? all[all.length - 1][1].trim() : '?';
};
const report = {
  duration: T, bpm: BPM, bars: BARS, sampleRate: SR,
  integratedLUFS: grab(/I:\s+(-?[\d.]+)\s+LUFS/),
  truePeakDBTP: grab(/Peak:\s+(-?[\d.]+)\s+dBFS/),
  lraLU: grab(/LRA:\s+(-?[\d.]+)\s+LU/),
  musicLayers: Object.keys(idx.music), cues: sfxCues.length, narration: idx.voice != null,
};
await writeFile(join(OUT, 'audio-report.json'), JSON.stringify(report, null, 2));
console.log(`\n✅ ${master}`);
console.log(`   ${report.integratedLUFS} LUFS · true peak ${report.truePeakDBTP} dBTP · LRA ${report.lraLU} LU`);
console.log(`   ${report.cues} sound cues on the film's own cue list${idx.voice != null ? ' + narration' : ' (music + SFX)'}\n`);
