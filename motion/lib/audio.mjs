// motion/lib/audio.mjs
//
// Sound, arithmetic not taste. Every UI sound here is SYNTHESIZED from scratch — no samples, no
// library, no licensing to track — and each one is placed by its own measured peak so it lands on
// the beat, exactly as the skill's rule 8 asks ("every UI sound is synthesized and placed by its
// measured peak on the kick-peak grid").
//
// The music is a 12-bar, 120 BPM bed built the same way: kick on every beat, hats on the off-8ths,
// a clap from bar 5, a pentatonic bass figure, and the drop landing on bar 10 — which is t = 18.0s,
// the pull-back reveal. That is rule 7: "cut the song window so the drop lands on the product's
// big moment."
//
// Determinism note (law 3): the noise buffers are filled from a hash of the sample index, never
// from Math.random, so two runs produce byte-identical sound.
import { hash01 } from './motion-math.mjs';

const NOTE = { A2: 110.0, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.0, A3: 220.0, E4: 329.63, A4: 440.0 };
// one bar of 8th-notes: a plain A-minor pentatonic figure, repeated with a small variation
const BASS = [
  ['A2', 'A2', 'C3', 'A2', 'E3', 'D3', 'C3', 'G3'],
  ['A2', 'A2', 'C3', 'E3', 'D3', 'C3', 'A2', 'G3'],
];

export function createAudio({ cues, T, BEAT }) {
  let ctx = null, master = null, musicBus = null, sfxBus = null, t0 = 0;
  let noise = null, enabled = false, scheduled = 0;

  const buf = (channels = 1, seconds = 0.5, fn) => {
    const b = ctx.createBuffer(channels, Math.max(1, Math.floor(ctx.sampleRate * seconds)), ctx.sampleRate);
    for (let c = 0; c < channels; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = fn ? fn(i / ctx.sampleRate, i, c) : hash01(i * 1.37 + c * 7.1) * 2 - 1;
    }
    return b;
  };

  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master); // song · 0.5
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.62; sfxBus.connect(master); //        sfx · 0.62
    noise = buf(1, 1.0);
    return ctx;
  }

  const envc = (at, peak, attack, decay, curve = 0.0001) => {
    const g = ctx.createGain();
    g.gain.setValueAtTime(curve, at);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, curve), at + attack);
    g.gain.exponentialRampToValueAtTime(curve, at + attack + decay);
    return g;
  };
  const osc = (type, f0, f1, at, dur) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, at);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), at + dur);
    o.start(at); o.stop(at + dur + 0.05);
    return o;
  };
  const src = (at, dur, playbackRate = 1) => {
    const s = ctx.createBufferSource();
    s.buffer = noise; s.loop = true; s.playbackRate.value = playbackRate;
    s.start(at); s.stop(at + dur + 0.05);
    return s;
  };
  const filt = (type, f0, f1, at, dur, q = 1) => {
    const f = ctx.createBiquadFilter();
    f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, at);
    if (f1 && f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), at + dur);
    return f;
  };

  // ── the kit ─────────────────────────────────────────────────────────────────────────────────
  function kick(at, gain = 1, len = 0.22) {
    const g = envc(at, 0.9 * gain, 0.005, len);
    const o = osc('sine', 112, 42, at, len);
    const c = osc('sine', 900, 300, at, 0.02); // the beater click, so it cuts on small speakers
    const cg = envc(at, 0.12 * gain, 0.002, 0.02);
    o.connect(g); c.connect(cg); g.connect(musicBus); cg.connect(musicBus);
  }
  function hat(at, gain = 1) {
    const g = envc(at, 0.09 * gain, 0.002, 0.035);
    const f = filt('highpass', 7000, 7000, at, 0.05);
    src(at, 0.05).connect(f); f.connect(g); g.connect(musicBus);
  }
  function clap(at, gain = 1) {
    const g = envc(at, 0.3 * gain, 0.004, 0.14);
    const f = filt('bandpass', 1600, 1200, at, 0.15, 0.9);
    src(at, 0.16).connect(f); f.connect(g); g.connect(musicBus);
  }
  function bass(at, freq, dur = 0.2, gain = 1) {
    const g = envc(at, 0.34 * gain, 0.01, dur);
    const f = filt('lowpass', 520, 260, at, dur, 6);
    osc('sawtooth', freq, freq, at, dur).connect(f); f.connect(g); g.connect(musicBus);
  }
  function pad(at, freq, dur, gain = 0.06) {
    const g = envc(at, gain, 0.5, dur - 0.5);
    const f = filt('lowpass', 900, 700, at, dur, 1);
    osc('triangle', freq, freq, at, dur).connect(f);
    osc('triangle', freq * 2.005, freq * 2.005, at, dur).connect(f);
    f.connect(g); g.connect(musicBus);
  }

  // ── the SFX kit. `lead` is how long before its cue a sound starts, so that its own PEAK — not
  //    its start — lands on the beat. That is the skill's put() in one number. ─────────────────
  const SFX = {
    click: { lead: 0.03, play: (at, dest) => {
      const g = envc(at, 0.5, 0.003, 0.05);
      const f = filt('highpass', 1500, 1500, at, 0.06);
      src(at, 0.06).connect(f); f.connect(g); g.connect(dest);
      const t = envc(at, 0.16, 0.002, 0.04);
      osc('triangle', 2400, 1500, at, 0.05).connect(t); t.connect(dest);
    } },
    release: { lead: 0.03, play: (at, dest) => {
      const g = envc(at, 0.28, 0.004, 0.07);
      const f = filt('bandpass', 1100, 800, at, 0.08, 0.8);
      src(at, 0.09).connect(f); f.connect(g); g.connect(dest);
    } },
    tick: { lead: 0.01, play: (at, dest) => {
      const g = envc(at, 0.2, 0.001, 0.018);
      const f = filt('highpass', 3800, 3800, at, 0.03);
      src(at, 0.03).connect(f); f.connect(g); g.connect(dest);
    } },
    pen: { lead: 0.01, play: (at, dest) => {
      const g = envc(at, 0.16, 0.002, 0.022);
      const f = filt('bandpass', 900, 700, at, 0.03, 1.4);
      src(at, 0.035).connect(f); f.connect(g); g.connect(dest);
    } },
    pop: { lead: 0.025, play: (at, dest) => {
      const g = envc(at, 0.34, 0.006, 0.12);
      osc('sine', 360, 170, at, 0.14).connect(g); g.connect(dest);
      const c = envc(at, 0.1, 0.002, 0.02);
      const f = filt('highpass', 2500, 2500, at, 0.03);
      src(at, 0.03).connect(f); f.connect(c); c.connect(dest);
    } },
    blip: { lead: 0.02, play: (at, dest) => {
      const g = envc(at, 0.22, 0.006, 0.1);
      osc('triangle', 1250, 1700, at, 0.11).connect(g); g.connect(dest);
    } },
    chime: { lead: 0.03, play: (at, dest) => {
      [[NOTE.A4, 0], [NOTE.E4 * 2, 0.012]].forEach(([f0, d]) => {
        const g = envc(at + d, 0.2, 0.008, 0.5);
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f0;
        o.start(at + d); o.stop(at + d + 0.55);
        o.connect(g); g.connect(dest);
      });
    } },
    shimmer: { lead: 0.06, play: (at, dest) => {
      const g = envc(at, 0.2, 0.05, 0.6);
      const f = filt('highpass', 3000, 8500, at, 0.65, 0.7);
      src(at, 0.7, 1).connect(f); f.connect(g); g.connect(dest);
      [NOTE.A4 * 2, NOTE.E4 * 3].forEach((f0, i) => {
        const gg = envc(at + i * 0.04, 0.09, 0.02, 0.5);
        osc('sine', f0, f0, at + i * 0.04, 0.55).connect(gg); gg.connect(dest);
      });
    } },
    whoosh: { lead: 0.2, play: (at, dest) => {
      const dur = 0.42;
      const g = envc(at, 0.3, dur * 0.45, dur * 0.5);
      const f = filt('bandpass', 320, 2600, at, dur * 0.7, 1.1);
      f.frequency.exponentialRampToValueAtTime(520, at + dur);
      src(at, dur).connect(f); f.connect(g); g.connect(dest);
    } },
    thump: { lead: 0.02, play: (at, dest) => {
      const g = envc(at, 0.95, 0.008, 0.45);
      osc('sine', 120, 36, at, 0.5).connect(g); g.connect(dest);
      const t = envc(at, 0.25, 0.003, 0.1);
      osc('triangle', 520, 180, at, 0.12).connect(t); t.connect(dest);
    } },
    riser: { lead: 1.0, play: (at, dest) => {
      const dur = 1.0;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(0.34, at + dur); // the peak IS the drop
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 0.25);
      const f = filt('bandpass', 420, 5200, at, dur, 1.6);
      src(at, dur + 0.3, 1).connect(f); f.connect(g); g.connect(dest);
    } },
  };

  /** The music, one cycle at a time, so the loop is seamless rather than restarted. */
  function scheduleMusic(cyc) {
    const at = t0 + cyc * T;
    const DROP = 9; // bar index of the drop (t = 18.0s)
    for (let b = 0; b < 48; b++) {
      const bar = Math.floor(b / 4), beat = b % 4, t = at + b * BEAT;
      const drop = bar >= DROP;
      kick(t, bar < 4 ? 0.85 : 1, drop ? 0.24 : 0.22);
      if (bar >= 4) hat(t + BEAT / 2, 1);
      hat(t + BEAT / 4, 0.55);
      if (bar >= 4 && (beat === 1 || beat === 3)) clap(t, bar >= DROP ? 1 : 0.8);
      if (bar >= 4 && bar < DROP + 2) {
        const fig = BASS[bar % 2];
        for (let i = 0; i < 8; i++) {
          bass(t + i * (BEAT / 2), NOTE[fig[i]], 0.18, drop && i % 2 === 0 ? 1.15 : 0.85);
        }
      }
      if (drop && beat === 2) kick(t + BEAT / 2, 0.6, 0.2); // 16th ghosts, the drop doubles up
      if (bar === 4 || bar === DROP) pad(t, NOTE.A2 * 2, BEAT * 4, bar === DROP ? 0.075 : 0.05);
      if (bar === 10) pad(t, NOTE.E3, BEAT * 4, 0.05);
    }
    for (const c of cues) {
      const s = SFX[c.kind];
      if (!s) continue;
      // one gain node per cue: the bed sits at 0.5 and the effects at 0.62, per the skill's mix
      const node = ctx.createGain();
      node.gain.value = Math.min(1, c.gain ?? 1);
      node.connect(sfxBus);
      s.play(at + c.t - s.lead, node); // peak on the cue, not start on the cue
    }
  }

  return {
    get enabled() { return enabled; },
    /** Film time in seconds, or null while sound is off. */
    now() { return enabled && ctx ? Math.max(0, ctx.currentTime - t0) : null; },
    async start() {
      if (!ctx) init();
      await ctx.resume();
      if (!enabled) {
        enabled = true;
        t0 = ctx.currentTime + 0.12; // a hair of lead so the first beat is not clipped
        scheduleMusic(0);
        scheduleMusic(1);
        scheduled = 2;
      }
      return t0;
    },
    stop() {
      if (!ctx) return;
      enabled = false;
      for (const n of [musicBus, sfxBus]) { n.gain.cancelScheduledValues(ctx.currentTime); }
      // a hard stop would click; ramp out over 80ms instead
      musicBus.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      sfxBus.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      setTimeout(() => { try { ctx.close(); } catch {} }, 300);
      ctx = null; master = musicBus = sfxBus = null;
    },
    /** Called every frame: keeps exactly one cycle scheduled ahead of the playhead. */
    keepScheduled(t) {
      if (!enabled || !ctx) return;
      while ((scheduled - 1) * T < t + 2) {
        scheduleMusic(scheduled);
        scheduled += 1;
        if (scheduled > 6) break;
      }
    },
  };
}
