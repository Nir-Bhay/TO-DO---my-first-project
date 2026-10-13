# Deep dive: `product-launch-motion` — the launch-film Claude Code skill

> **वेंडर कर दिया गया है:** इस repo में skill की कॉपी `.claude/skills/motion-launch-video/` में रखी है
> (upstream commit pin के साथ — `UPSTREAM.md` देखो).
> **एक लाइन में:** ये कोई software package नहीं, एक **Markdown-आधारित "skill"** है — यानी Claude Code
> (या किसी भी agent) के लिए लिखा गया एक बहुत ही disciplined prompt + technique दस्तावेज़, जिससे
> HTML/CSS/JS से 60fps product launch video (MP4) बनवाई जा सकती है — After Effects, template या
> AI video model के बिना. नीचे पूरा तकनीकी breakdown है.

| | |
| --- | --- |
| Repository | https://github.com/AbubakrChan/product-launch-motion |
| Author | AbubakrChan |
| Skill name | `motion-launch-video` (v2) + `product-launch-motion-v1` (legacy) |
| Licence | MIT — **केवल** skill/reference/scripts पर. Sample films पर नहीं (देखो "Licence traps") |
| Created | 27 July 2026 · last push 13 Oct 2026 |
| Scale | ~217 ★, 34 forks, ~30 MB repo (mostly sample-film `webp`), 25 commits, 1 branch, 2 tags |
| Language | JavaScript (v1 scripts), प्रकृति से documentation-first |
| Install | `npx skills add AbubakrChan/product-launch-motion` |
| Vendored here at | commit `b3e82b40fb3470fccfc9c3601cfb1cff8b6d6cd5` |

---

## 1. What it actually is (important expectation-setting)

ये repo **दो चीज़ों का मेल** है, और दोनों को अलग करके समझना ज़रूरी है:

| Layer | क्या है | रन होता है? |
| --- | --- | --- |
| **Skill / direction** | `SKILL.md` (v2, ~170 lines) + `references/prompts.md` (author के असली prompts, verbatim) + `references/technique.md` (code patterns) | ❌ यह एक *instruction set* है। इसे कोई LLM agent पढ़ता है और उसी हिसाब से film का code लिखता है। |
| **Pipeline / tooling** | `legacy/scripts/*.mjs`, `legacy/assets/frame-skeleton.html`, `legacy/references/01…12.md` | ⚠️ Scripts **सिर्फ़ v1 (legacy)** के हैं। |

**सबसे बड़ी finding:** v2 में **एक भी runnable script नहीं** है — सिर्फ़ 3 Markdown files
(`SKILL.md`, `references/prompts.md`, `references/technique.md`). `npm install` करके चलाने जैसा
कुछ भी नहीं है। v2 का "code" = दस्तावेज़ में लिखे गए patterns जो agent को लिखने हैं।
चलाने लायक scripts (film `assemble.mjs`, `transitions.mjs`, `wire-audio.mjs`, `wire-grade.mjs`,
`master.sh`, `verify-cue.sh`) — ये सब `legacy/` में हैं, यानी **v1 के** हैं।

और: `references/technique.md` कई जगह `~/code/cheerful-motion/launch2/` जैसे **local paths** दिखाता है
("reference implementation"), जो repo में मौजूद नहीं हैं (private working dir था)। यानी v2 skill अच्छी
तरह से *documents* है, पर उसका reference implementation **ship नहीं** हुआ — agent को pattern खुद
लिखने पड़ेंगे. `<output>` में `deliver/` folder + `serve` का ज़िक्र भी उसी author के setup का है।

**Verdict:** ये एक "prompt kit + craft manual" है, न कि library. इसकी असली कीमत prompt नहीं,
**review notes** हैं — 7 बार real film पर director के नोट्स लगे, और हर नोट का fix तकनीक बन गया.

---

## 2. The core idea — "One shape, never cut"

पूरा skill एक आइडिया पर टिका है:

> पूरी film में **एक ही element** होता है (एक button/shape). वो हर state में
> **size, radius और colour morph** करता है: `button → loader → check → dynamic island → video reel
> → slider → toggle → tabs → chart → ⌘K palette → toast → button`.
> **कट (cut) नहीं होते** — transition भी morph, camera push, या किसी element में zoom-in होता है जो
> अगले scene में बदल जाता है। Content अंदर बदलता है तो एक **छोटा blur swap** से बदलता है।
> Loop में **last frame = first frame** (cursor की position और speed तक)।

Second half — **cursor ही driver है**: हर change एक असली cursor के click/drag से होता है, click पर
press-scale + ripple, drag "direct manipulation" है, release पर spring-back.

तीसरा — **music-first timing**: 120 BPM की track को numpy से analyse करके beat grid निकालो, drop को
film के बड़े moment पर लाओ, और UI के हर sound का **अपना peak** beat पर बैठाओ.

चौथा — **camera हर state को frame करे**: खाली frame = bug है; pull-back से scale दिखाओ
(एक email → सैकड़ों का wall).

---

## 3. The nine non-negotiable motion rules (v2)

`SKILL.md` से, summarised:

| # | Rule | मतलब |
| --- | --- | --- |
| 1 | **One shape, never cut** | हर state एक ही element का morph (size/radius/colour), content blur-swap से बदलता है |
| 2 | **Blur content swap** | Morphing container के अंदर text का अपना enter/exit timing — **exit छोटा और जल्दी**, वरना पुराना-नया text overlap करेगा |
| 3 | **Springs everywhere, tiny overshoot at most** | bouncy easing banned; सिर्फ़ closed-form damped spring step response |
| 4 | **Edge-split stretch** | Toggle knob / tab indicator की leading व trailing edge **अलग** springs पर — इसलिए stretch दिखता है (liquid pill) |
| 5 | **A cursor drives every change** | असली click (press-scale + ripple), असली drag; product का agent दूसरा cursor बन सकता है (gradient + name pill + trail) |
| 6 | **The camera frames every state** | खाली frame bug है; push/whip/pull-back, zoom का मूल content पर |
| 7 | **Music-first timing** | ~120 BPM, numpy से beat grid, downbeat पर शुरू, drop = big moment, हर beat पर कुछ न कुछ |
| 8 | **Every UI sound is synthesized** | कोई sample library नहीं; हर SFX खुद synth होता है और **अपने measured peak** से kick-grid पर बैठता है |
| 9 | **Loops** | Loop वाली film में last frame = first frame, cursor position/speed समेत, वरना loop stutter करता है |

## 4. The pipeline (जैसा repo में लिखा है)

```
brief ─► state list on the beat grid ─► one HTML film, every pixel = f(t) in seek(t)
      ─► one frame per beat, contact sheet, fix ─► Playwright: 4 subframes per frame
      ─► ffmpeg tmix (motion blur) ─► 60 fps H.264 + mix ─► storyboard + seam scan
```

**क्यों pure `seek(t)`?** क्योंकि हर frame समय का एक pure function है → render **deterministic** होता है।
सेकंड भर कोई भी moment पर seek करो, बिल्कुल वही pixels मिलेंगे। इसी वजह से per-beat QA और
parallel rendering possible है.

### 4.1 Springs (इस skill की गणित की जान)

```js
// closed-form damped step response, 0 -> 1
function stepR(tau, {w, z}) {
  if (tau <= 0) return 0;
  if (z >= 1) { const x = w * tau; return 1 - Math.exp(-x) * (1 + x); }
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * tau) *
         (Math.cos(wd * tau) + (z * w / wd) * Math.sin(wd * tau));
}

// many target changes = sum of one spring per change => फिर भी pure f(t)
class Track {
  constructor(v0) { this.v0 = v0; this.cur = v0; this.ev = []; }
  to(t, v, sp) { if (v !== this.cur) { this.ev.push([t, v - this.cur, sp]); this.cur = v; } return this; }
  at(t) { let v = this.v0; for (const [ti, d, sp] of this.ev) v += d * stepR(t - ti, sp); return v; }
}
```

- Damping `z` = 0.72–0.9 → हल्का overshoot; camera और text के लिए 1.0 (no overshoot).
- जो value समय T पर **पहुँचनी** है, उसे ~0.3s पहले issue करो (settle lead).
- ऊपर का `Track` trick ही असली सोच है: state रखने के बजाय सारे target-changes को एक sum बना दो,
  ताकि frame N पर सब कुछ सिर्फ़ `t` से निकले — कोई timer, कोई CSS transition नहीं.

### 4.2 Blur swap, odometer, cursor

- `vis(t, tin, tout, dOut=0.12)` → opacity + `blur(px)` + translateY एक साथ, ताकि content का
  entry spring और exit (छोटा, जल्दी) अलग-अलग हों.
- **Odometer (असली numbers):** हर digit की अपनी strip 0–9,0; slot **final glyph** के आकार का
  (`clip-path: inset(0 -80px)` — सिर्फ़ vertically clip, वरना digits jump करते हैं);
  digit `p` की value = `floor(v/10^p) % 10 + max(0, (v % 10^p) − (10^p − 1))` — यानी digit तभी
  हिलता है जब नीचे वाला carry दे. Gradient text सारे slots में continuous.
- **Cursor:** world-space tracks (AX/AY), lean = `clamp(−vx·0.0045, ±14°)`, name-pill `−v·0.012 px`
  पीछे, press scale `1 − 0.16·exp(−((t−tc)/0.045)²)` (यानी एक narrow gaussian — असली press feel),
  0.4s ripple ring, trail = t − k·9ms पर position sample (ये भी pure, क्योंकि position `t` का function है)।

### 4.3 Sound (जहाँ ज़्यादातर लोग fail करते हैं)

- numpy से **spectral flux + autocorrelation** → tempo, kick-band onsets/peaks → beat grid;
  chroma से key → tonal SFX उसी key के pentatonic में.
- गाने का window ऐसे काटो कि **drop film के big beat पर** पड़े; start bar के kick onset से 3ms पहले.
- `cue(g) = g · PERIOD/0.5 + PEAK_OFF` → film time को measured kick-peak time पर map करता है;
  `put()` हर sound को shift करता है ताकि **उसका खुद का peak** cue पर landing करे.
- सारे cues film से export होते हैं (`M.cues → events.mjs → events.json`) — एक ही source of truth.
- Mix: `song·0.5 + sfx·0.62`, एक static gain जिससे peak 0.93 — **कोई limiter नहीं** (limiter loops
  को तोड़ता है). Measure: `ffmpeg -af ebur128=peak=true` (लगभग −15 LUFS, < −0.5 dBTP).

### 4.4 Render (motion blur का असली राज़)

- Playwright Chromium headless, 1920×1080 (या square), **हर frame के लिए 4 subframes**:
  `subT(i) = floor(i/4)/60 + ((i%4) − 1.5)/240` — यानी frame time के आसपास ±0.5 frame.
- ffmpeg: `-framerate 240` पर 4 PNGs लो → `tmix=frames=4` → हर 4th frame select → `-r 60`.
  असली motion blur, shutter angle का असली feel — ये trick पूरे repo की सबसे कीमती technical चीज़ है.

```bash
ffmpeg -framerate 240 -i s%05d.png \
  -vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/(60*TB),scale=out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -r 60 -c:v libx264 -preset slow -crf 15 -tune film
```

- Chunked rendering (`960 subframes → segment → PNGs delete → concat -c copy → AAC mux`) — कम disk
  वाले VPS के लिए. Resilience: subframe retry, browser relaunch, `process.exit(0)` (close() hang करता है).

### 4.5 QA (जो इसे professional बनाता है)

- पहले **हर beat पर एक frame** (`t = k·0.5 + 0.12`) → contact sheet → जो off-grid/cramped/empty/
  overlap है उसे fix; transitions ±0.1s पर देखो.
- Render के बाद **delivered MP4** से 1-per-second storyboard + **frame-difference scan** (chunk seams
  और crashed-retry frames पकड़ने के लिए).
- यही वजह है कि ये repo "render कर दिया, हो गया" वाली श्रेणी में नहीं आता: अपने output को *फिर से
  देखने* का loop इसमें built-in है.

---

## 5. v1 vs v2

| | v1 (legacy) | v2 (root) |
| --- | --- | --- |
| Timing | voiceover के **words** पर locked | music की **measured beat grid** पर locked |
| Motion | GSAP timelines | closed-form springs, pure `seek(t)` |
| Renderer | HyperFrames | Playwright subframes + ffmpeg `tmix` |
| Structure | shots + transitions | one shape, never cut |
| Sound | library SFX, levelled | synthesized SFX, measured peak |
| Depth | CSS camera rig | camera springs + optional WebGL glass |
| Runnable code | ✅ 8 scripts + templates + evals | ❌ सिर्फ़ Markdown |
| Best for | narrated explainer | music-first launch film |

v1 के 10 laws (Truth first, Word-locked sync, Determinism, One camera two nodes, cursor = stage prop,
sound is arithmetic, nothing ends moving, ration the accent, green gates are necessary not sufficient,
**no house style**) आज भी सबसे उपयोगी हिस्सा हैं — क्योंकि ये renderer-neutral हैं.

---

## 6. Requirements (सच में क्या चाहिए)

| Need | क्यों |
| --- | --- |
| Claude Code (ya कोई भी capable agent), README के हिसाब से strong model | Direction + film का code लिखना |
| **Node ≥ 20 + Playwright** | frames render करना |
| **FFmpeg** | motion blur, encode, loudness check |
| **Python 3 + numpy** | beat grid + synthesized SFX |
| ~120 BPM royalty-free track | optional; हर track का licence खुद check करो |
| **आँखें और कान** | repo खुद कहता है: audio "numbers से verify हुआ, सुना नहीं गया" |

> इस sandbox में मैंने check किया: `node v22` ✅, `python 3.11` ✅, `numpy`/`ffmpeg` pypi से install हो
> सकते हैं ✅ — पर **headless browser नहीं** (Playwright का CDN blocked, और system में X11/NSS/fontconfig
> जैसी कोई library नहीं). यानी यहाँ live HTML demo preview चल सकता है, पर MP4 render तुम्हारी मशीन
> पर ही होगा.

---

## 7. Licence traps (ध्यान से)

- MIT सिर्फ़ **skill, references और v1 scripts** पर है.
- **Sample films (Cheerful के लिए बनी) MIT में नहीं हैं** — upstream का `NOTICE` साफ़ कहता है:
  films और उनके frames reuse/redistribute नहीं कर सकते. इसीलिए मैंने vendored copy से
  `examples/*.webp` (21 MB) और `legacy/*.webp|*.jpg` हटा दिए हैं.
- Third-party: **GSAP** (Standard "No Charge" licence — monetisation के हिसाब से terms बदलती हैं),
  **HyperFrames**, **FFmpeg** (LGPL/GPL build पर निर्भर), **DM Sans / Inter** (SIL OFL),
  reference film की music — "Swish Swed" by Arulo (Mixkit Free License).
- उस "done-for-you $10" वाली link (`launchreel.89-167-9-64.sslip.io`) एक **raw IP-आधारित domain** है,
  branded domain नहीं. Upsell है, skill का हिस्सा नहीं — भरोसे का फ़ैसला तुम्हारा.

## 8. Security / trust review (मैंने खुद scan किया)

- Vendored files में **कोई network call, `curl | sh`, `eval`, base64 payload, credential access नहीं** —
  scan साफ़ रहा. सिर्फ़ docs + local scripts हैं.
- असली surface: `npx skills add …` (third-party CLI चलाता है) और *instructions जो तुम्हारा agent follow
  करेगा* — यानी skill file वैसे ही भरोसे की चीज़ है जैसे कोई script. Pin किया हुआ commit उपयोग करना,
  supply-chain risk कम करता है.
- Skill तुम्हारे agent से "creative choices खुद लो" कहता है और **DECISION: lines log** करवाता है —
  ये अच्छा practice है, क्योंकि तुम एक reply में किसी भी decision को overturn कर सकते हो.

## 9. Honest limitations

1. **Skill ≠ software.** इसमें कोई `npm test`, कोई CI, कोई version pin mechanism नहीं; output की quality
   model पर निर्भर है (README खुद strong model की सिफ़ारिश करता है).
2. **v2 के evals नहीं हैं** — `evals/` सिर्फ़ v1 (legacy) में हैं. यानी v2 के trigger/behaviour की
   कोई objective test suite नहीं.
3. **v2 का reference implementation missing है** (private `~/code/cheerful-motion/…`).
4. **Audio blind spot:** delivery notes में खुद लिखा है कि audio सुना नहीं गया, सिर्फ़ measure हुआ.
5. **Heavy pipeline:** 60fps + 4 subframes + 1080p = हर सेकंड film के लिए ~240 PNG. Disk/CPU/tuning
   चाहिए (repo इसीलिए chunked rendering सिखाता है).
6. **Loop करना मुश्किल है** — cursor position/speed तक match करना पड़ता है (rule 9), और यही जगह है
   जहाँ हल्की-सी भी गलती loop को stutter बना देती है.

---

## 10. How to use it

### Option A — Claude Code में skill के तौर पर (canonical)

```bash
npx skills add AbubakrChan/product-launch-motion
```

फिर Claude Code में सिर्फ़ इतना लिखो:

> Make a launch video for https://your-website.com

### Option B — इस repo की vendored copy से

Skill यहाँ पहले से है: `.claude/skills/motion-launch-video/` (Claude Code इसे project skill की तरह
pick कर सकता है). बस agent को बोलो कि `SKILL.md` पढ़े और उसी हिसाब से film बनाए.

### Option C — किसी भी agent (जैसे मैं, यहाँ) के साथ

`SKILL.md` + `references/technique.md` paste करके बोलो: *"इस direction से launch film बनाओ; beats
की list पहले दिखाओ, फिर code"*. **और यही मैंने किया है** — नीचे देखो.

---

## 11. इस project (TO-DO app) पर apply करना — जो मैंने अभी बनाया

`motion/` folder में skill के नियमों से बनी एक असली film है:

| File | क्या है |
| --- | --- |
| `motion/index.html` + `motion/film.js` | पूरा film — pure `seek(t)`, Track springs, one-shape morph, cursor, blur swaps, odometer, pull-back, loop |
| `motion/BEAT-SHEET.md` | Beat grid पर state list (skill का step 2 — code से **पहले**) |
| `motion/render.mjs` | तुम्हारी मशीन पर Playwright + ffmpeg से MP4 export करने की script |
| `motion/README.md` | कैसे चलाओ, क्या बदलो, कौन-कौन से DECISION लिए गए |

Client को दिखाने से पहले ध्यान रखो: skill का `references/11-creative-direction.md` कहता है — **हर film
का look उस product की claim से derive होना चाहिए, पिछली film से नहीं.** यानी ये TO-DO film कोई
template नहीं, शुरुआत है; अपना product डालो तो palette, ground, type और signature move भी बदलो.

---

*Compiled 2026-10-13 from the upstream repo at commit `b3e82b4`, read in full: `README.md`, `SKILL.md`,
`references/prompts.md`, `references/technique.md`, `NOTICE`, `legacy/SKILL.md`,
`legacy/CASE-STUDY.md`, the 12 `legacy/references/*.md` files, `legacy/assets/*` and the
`legacy/scripts/*` inventory.*
