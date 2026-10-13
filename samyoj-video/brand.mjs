// samyoj-video/brand.mjs
//
// One source of truth for the film: the palette, the type scale, the scene map and the narration.
// Change anything here and the whole film re-times and re-colours around it.
//
// ── THEME DECISION ────────────────────────────────────────────────────────────────────────────
// The logo is a violet→blue→cyan gradient emblem on a deep navy wordmark; the product is a
// WhatsApp platform, where green is the channel's own language. So the film runs three accents and
// rations them strictly (the skill's law 8):
//
//   • brand gradient  #2D6BFF → #7B2FF7 → #21B6FF   the product: its own actions, its own UI
//   • WhatsApp green  #25D366                        the channel: messages, ticks, chat CTAs, payment
//   • Meta blue       #0866FF                        only where ads are the subject
//   • everything else                                deep navy ground + white type
//
// Not "WhatsApp green everywhere" and not "purple SaaS default" — the ground is the logo's navy,
// the gradient is the logo's gradient, and green is earned by every WhatsApp moment.

export const C = {
  // ground
  void0: '#04081A', void1: '#071130', void2: '#0B1B42', void3: '#101F4A',
  // brand gradient stops (sampled from the logo)
  b0: '#2D6BFF', b1: '#4B5BFF', b2: '#7B2FF7', b3: '#A855F7', b4: '#21B6FF', b5: '#5AD1FF',
  // channel
  wa: '#25D366', waDeep: '#128C7E', waDark: '#075E54',
  // ad platform (used once)
  meta: '#0866FF',
  // ink on light panels
  ink: '#0B1436', ink2: '#39406B', ink3: '#7A82A8',
  // surfaces
  panel: '#FFFFFF', panelSoft: '#F4F6FF', hair: '#DFE4F5',
  // type
  white: '#FFFFFF', dim: 'rgba(255,255,255,0.66)', dimmer: 'rgba(255,255,255,0.4)',
  // semantic
  warn: '#FFB020', danger: '#FF5A6E',
};

export const GRAD = [
  [0, C.b1], [0.34, C.b2], [0.62, C.b0], [1, C.b4],
];
export const GRAD_SOFT = [
  [0, 'rgba(77,91,255,0.95)'], [0.5, 'rgba(123,47,247,0.95)'], [1, 'rgba(33,182,255,0.95)'],
];
export const WA_G = [[0, C.wa], [1, '#1FBF5C']];

export const F = {
  black: 'InterBlack',
  x: 'InterX',
  semi: 'InterSemi',
  med: 'InterMed',
};

export const W = 1920, H = 1080, FPS = 60;

/**
 * THE GRID. Type always lives in the same two places; content always lives between them. Scenes may
 * not move the headline, and the camera may not crop the safe area — that is what keeps 8 scenes
 * reading as one film instead of 8 slides.
 */
export const LAYOUT = {
  safe: { x0: 120, y0: 110, x1: 1800, y1: 990 },   // nothing important outside this (z ≤ 1.20)
  labelY: 142,                                     // eyebrow, letterspaced, always here
  headlineY: 244,                                  // first line's baseline; a 2nd line sits at 331
  contentTop: 386,                                 // content may not rise above this
  contentBottom: 986,
  wordmark: { x: 210, y: 1026 },
};

/** 120 BPM. Scene 2 of the film lands on the drop — every cut is a bar line. */
export const BPM = 120;
export const BEAT = 60 / BPM;         // 0.5s
export const BAR = BEAT * 4;          // 2.0s

// ── THE NARRATION ───────────────────────────────────────────────────────────────────────────────
// Eight lines, one per scene. Each line is generated on its own so the film can be word-locked to
// measured audio (the v1 skill's law: "every reveal is cued to the measured start time of the word
// it illustrates"). The per-scene target length below is the fallback when no audio is present.
export const SCRIPT = [
  {
    id: 'hook', scene: 'Hook',
    vo: 'Every business runs on conversations. The ones that grow, run them on WhatsApp.',
    target: 7.0,
    head: 'Every business runs on\nconversations.',
    emphasis: ['conversations'], label: 'THE CHANNEL YOUR CUSTOMERS OPEN FIRST',
  },
  {
    id: 'broadcast', scene: 'Broadcast',
    vo: 'Reach thousands of customers in seconds, with official WhatsApp broadcasts.',
    target: 6.0,
    head: 'Thousands of customers.\nOne tap.',
    emphasis: ['One', 'tap'], label: 'OFFICIAL WHATSAPP BROADCASTS',
  },
  {
    id: 'ai', scene: 'AI agent',
    vo: 'An AI that answers instantly, trained on your business. Awake at three in the morning.',
    target: 7.0,
    head: 'Answers in\nunder a second.',
    emphasis: ['under', 'a', 'second'], label: 'AI TRAINED ON YOUR BUSINESS',
  },
  {
    id: 'flows', scene: 'Automation',
    vo: 'No-code flows capture every lead, answer every question, and hand off the moment a human matters.',
    target: 8.0,
    head: 'Flows that\nnever sleep.',
    emphasis: ['never', 'sleep'], label: 'NO-CODE VISUAL AUTOMATION',
  },
  {
    id: 'inbox', scene: 'Shared inbox',
    vo: 'One shared inbox. Every chat becomes customer context: tags, stages, tickets, owners.',
    target: 7.0,
    head: 'One inbox.\nEvery customer, in context.',
    emphasis: ['context'], label: 'SHARED TEAM INBOX + CRM',
  },
  {
    id: 'commerce', scene: 'Commerce',
    vo: 'Catalogs, payments and orders, closed inside the chat.',
    target: 5.0,
    head: 'Sell inside\nthe chat.',
    emphasis: ['chat'], label: 'CATALOGS · PAYMENTS · ORDERS',
  },
  {
    id: 'ads', scene: 'Ads → pipeline',
    vo: 'Click-to-WhatsApp ads that turn attention into pipeline, measured end to end.',
    target: 6.5,
    head: 'From ad click\nto closed deal.',
    emphasis: ['closed', 'deal'], label: 'CLICK-TO-WHATSAPP ADS + ANALYTICS',
  },
  {
    id: 'cta', scene: 'End card',
    vo: 'Samyoj. Business automation and CRM, on the official WhatsApp Business API. Start free today — your customers are already here.',
    target: 13.5,
    head: '', emphasis: [], label: 'START YOUR 14-DAY FREE TRIAL',
  },
];

/** Scene windows, derived from the target lengths (or the measured voice, when present). */
export function sceneWindows(lengths = SCRIPT.map((s) => s.target)) {
  const out = [];
  let t = 0;
  for (let i = 0; i < SCRIPT.length; i++) {
    const len = lengths[i];
    out.push({ ...SCRIPT[i], i, t0: +t.toFixed(4), t1: +(t + len).toFixed(4), len: +len.toFixed(4) });
    t += len;
  }
  return out;
}

export const TOTAL = SCRIPT.reduce((a, s) => a + s.target, 0); // 60.0s
