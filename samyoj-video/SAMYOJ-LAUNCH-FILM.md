# Samyoj — 60 second launch film

**1920×1080 · 60 fps · 60.000 s · 120 BPM grid · 8 scenes · 80 sound cues · −15.2 LUFS**

Ye file poora "kya, kyun, aur kaise" hai — code ke saath. Har cheez jo film me dikhti hai, kisi na
kisi line of code se bani hai: koi footage nahi, koi stock clip nahi, koi template nahi. Sirf canvas
+ ffmpeg. Isi liye aap ise roz badal sakte hain — ek number badla, poori film badal jati hai.

---

## 1 · Ek nazar me — film ka dhancha

| # | Scene | Time | Length | Kaam | VO (aap ki line) |
|---|-------|------|--------|------|------------------|
| 1 | `hook` | 0.0 → 7.0 | 7.0s | Sabse pehla sawal: customer kahan hai? | Every business runs on conversations. |
| 2 | `broadcast` | 7.0 → 13.0 | 6.0s | 12,480 delivered — ek tap me | Reach thousands of customers in seconds… |
| 3 | `ai` | 13.0 → 20.0 | 7.0s | Jawab 0.4s me, 3 baje raat bhi | An AI that answers instantly… |
| 4 | `flows` | 20.0 → 28.0 | 8.0s | No-code flow, lead → human handoff | No-code flows capture every lead… |
| 5 | `inbox` | 28.0 → 35.0 | 7.0s | Ek inbox, har chat par context | One shared inbox… |
| 6 | `commerce` | 35.0 → 40.0 | 5.0s | Chat ke andar hi bikri | Catalogs, payments and orders… |
| 7 | `ads` | 40.0 → 46.5 | 6.5s | Click-to-WhatsApp → pipeline | Click-to-WhatsApp ads… |
| 8 | `cta` | 46.5 → 60.0 | 13.5s | Logo, tagline, trial, proof | Samyoj. Business automation and CRM… |

Har scene ek **pure function of its own local time** hai: `SCENES[k](S)` jahan `S.tl = t − scene.t0`.
Iska matlab: aap scene 5 ka look badlein, ya ek scene ko lamba-chhota karein — baaki saat scenes ko
haath lagane ki zaroorat nahi. (Voiceover jab aayega, hum scene lengths usi ke hisaab se set karenge —
art ko chhune ke bagair.)

**Scene lengths badalne ka tareeqa:** `brand.mjs` → `SCRIPT[i].target`. Bas. Windows,
audio cues, camera keys, sab derived hain.

---

## 2 · Brand system — logo ne poori film ka theme decide kiya

Samyoj ka logo navy par **gradient #7B2FF7 → #2D6BFF → #21B6FF** hai, aur usmein teen aadmi ek
bandhan me. Wahi hero bana:

- **Base:** `void0 #05070F` → `void1 #0A0E1F` → `void2 #101736` — deep navy, 3-stop linear gradient.
- **Brand gradient:** `GRAD` — sirf emphasis words, logo, progress bar aur CTAs ke liye. Ye sasta nahi
  kiya: jahan gradient hai, wahan matlab hai.
- **WhatsApp green `#25D366`:** sirf **ek** accent — outgoing bubble, "Sent" tick, delivered counter,
  aakhri pulsing dot. Poora film green nahi hai (ye aap ki explicit instruction thi, aur ye sahi hai:
  green bar-bar use karo to brand lagti nahi, WhatsApp lagti hai).
- **Meta blue `#0866FF`:** sirf **ek jagah** — ads scene ke platform card me. Jis platform ki baat ho,
  usi ka rang, sirf ek lamhe ke liye.

Aur chrome: `LAYOUT` grid. Type **kabhi nahi hilta** — eyebrow y=142, headline baseline y=244 (line 2
y=331). Content band y=386…986, x=120…1800. Isi liye 8 scenes ke beech aankh ko sambhalne ki
zaroorat nahi padti: film ko ek magazine lagti hai jismein sirf tasveerein badalti hain.

---

## 3 · Ek camera — poora film

`SCENE_CAM[8]`, aur usme sirf teen cheezein hain: `z` (push), `ox/oy` (≤60 px), aur do whip spikes.

- **Centre-locked hai, jaan-boojh ke.** Pehle version har scene ke hero par re-centre hota tha, aur
  usne headline ko frame se bahar nikaal diya (skill ki rule: "the camera frames every state — an
  empty or clipped frame is a bug"). Centre-locked + `z ≤ 1.20` par safed band **provably** crop
  nahi ho sakta: 540 − 444·z ≥ 0.
- **Energy Z me hai.** Har scene dheema push leta hai (1.04 → 1.16). Impact Z se aata hai, pan se
  nahi — pan ke liye jagah chahiye, Z ke liye nahi.
- **Do whip.** Sirf do scene boundaries par whip hai (z×1.13/1.14 + ~50 px shove), aur dono exactly
  boundary par resolve hote hain — matlab jhatka ya "editing mistake" nahi lagti, camera move lagti hai.
- **CTA par push kabhi ruk-ta nahi** aakhri 1.5s tak. End card ko hold karna boring hota hai; dheema
  chalte rehna premium lagta hai.

**Transition bhi ek hi cheez hai:** `drawStreak` — gradient comet jo purane scene ke hero se
chalta hai aur naye scene ke hero par **theek boundary par** land karta hai. Hard cut kahin nahi hai.

---

## 4 · Type aur motion — "kinetic" ka matlab yahan

`lib/motion.mjs` film ki vocabulary hai. Sabse zaroori:

- `kinetic()` — headline ko **words me todta** hai, har word `\n` par hard break leta hai, aur
  `stepR` spring par 26 ms me stagger ke saath aata hai. Emphasis words gradient lete hain. Exit me
  0.26 s ka out-quint — koi fade-out nahi, "chala gaya" nahi, "ruk gaya" lagta hai.
- `SP` spring presets — card, pop, chip, cam. Spring ka fayda: koi bhi move overshoot ke saath
  organic lagta hai, linear interpolation nahi.
- `bake()` — dekhiye section 7. Ye chhota function poori film ko 4× tez kar deta hai.

---

## 5 · Awaaz — synth se, license ke bina

`lib/audio-synth.mjs` poora soundtrack **banata** hai (koi sample library nahi, kuch kharidna nahi):

- **Bed (30 bars @ 120 BPM):** kick (har beat), ghost-kicks (drop me), hats (off-8ths), claps
  (2 & 4), A-minor pentatonic sub-bass, pad, aur CTA se pehle 2 s ka riser. Sab kuch ffmpeg ke
  `aevalsrc` expressions se — ek expression = ek layer.
- **11 UI sounds:** click, release, tick, pop, blip, chime, shimmer, whoosh, thump, riser, sab
  `aevalsrc` + filters. Har sound ka apna `lead` hai: sound us beat se **pehle** shuru hota hai taake
  uska **peak** beat par aaye. Yehi wo "click drum ko hit karta hai" wala farq hai.
- **80 cues** film ke apne `cues` list se aate hain (wahi list jo scenes banati hai) — picture aur
  sound drift kar hi nahi sakte, kyunki dono ek hi source se padh rahe hain.
- **Master chain:** compressor → limiter → `loudnorm I=-14 TP=-1` → aakhir me 1.35 s ka fade.
  Aur phir `ebur128` se **measure** hota hai, guess nahi: report `out/audio-report.json` me hai
  (**−15.2 LUFS, true peak −1.0 dBTP** — broadcast standard).

```bash
node lib/audio-synth.mjs                                   # music + SFX
node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav  # + narration (music side-chain duck)
node lib/audio-synth.mjs --no-music                         # sirf cues (placement check ke liye)
```

`--voice` dene par music pe `sidechaincompress` lagta hai — matlab awaaz aate hi music apne aap
neeche chala jata hai, aap ko volume envelope haath se nahi banana padta.

---

## 6 · Renderer — 3600 frames, 9 minute

`render.mjs`: canvas → **raw RGBA pipe** → ffmpeg. Files disk par kabhi nahi jaati.

1. **Motion blur asli tarike se:** har frame **SUB** subframes ka exact box average hai —
   `subT(i) = t + (i − (SUB−1)/2)/(FPS·SUB)`, aur accumulation successive `source-over` draws se
   (alpha 1, 1/2, 1/3, 1/4 …). Ye **exactly** 1/SUB weight deta hai aur black base-fill bachata hai.
   `--sub 4` = hero pass, `--sub 2` = default (9 min), `--sub 1` = draft (7 min).
2. **PNG nahi:** `canvas.data()` 4 ms leta hai, `toBuffer('image/png')` **80 ms**. 3600 frames par ye
   farq 51 minute vs 4 minute ka hai.
3. **Grain ek baar** — `drawGrade` sirf accumulate hone ke baad, per frame, 4× nahi. Warna blur
   grain ko mush kar deta. Grain `ROUND(t*FPS) % 120` par step karta hai → re-render bilkul identical.
4. **`--remux`** — naya mix, wahi picture, 5 second.

---

## 7 · Performance — jo is film ne sikhaya (asli engineering)

Pehla full render **1.66 s/frame** tha (= 100 minute). Ab **~140 ms/frame** hai (= 8.6 minute).
Ye 12× ka farq sirf profiling se aaya. Ye section aap ke liye hai — wahi galti dobara na ho.

**(a) Canvas ka kaam "lazy" hai. Naap lo, maano mat.**
Skia drawing **record** karta hai (26 ms), pixels tab bante hain jab surface padha jaye (`data()`,
`drawImage` into another canvas). Isi liye `drawScene` 11 ms dikhta hai aur frame 300 ms leta hai.
Jo bhi block measure karo, uske **baad** force-read karo — warna aap jhoot naap rahe hain.

**(b) `ctx.filter = 'blur(0px)'` free nahi hai.** Ye asli killer tha.
`logo.mjs` ka `wordmark()` har letter par blur + shadow set karta tha. Jab entrance khatam ho jata,
amount 0 ho jata — lekin **`filter` non-`'none'` hone bhar se** skia ek poori layer kholta hai aur
filter pipeline chalata hai: **~30 ms per letter, ~180 ms per frame**. Guard lagaya
(`if (b > 0.15)`), aur chrome 180 ms → 8 ms. **Rule: filter/blur sirf tab set karo jab asal me chahiye.**

**(c) Blur ko bake karo, har frame dobara na karo.** `ai` scene me 3 blurred plates the — 161 ms.
Ab `bake()` (`lib/motion.mjs`) unhe ek dafa texture me render karta hai aur per frame sirf blit karta
hai: **161 ms → 60 ms**. Blur radius badalna ho to cache key me radius shamil karo (jaisa kiya hai).

**(d) Canvas gradient fills sasti hain, badi `drawImage` mehngi.** Full-frame 2-stop gradient
7–11 ms; 1080p canvas-to-canvas blit ~24 ms. Isi liye background ek dafa bake hota hai, per frame
dobara draw nahi hota — aur grain/shadows textures hain, live effects nahi.

**(e) Rafa-dafa pipeline banao, phir naapo.** `bench.mjs` per-frame cost aur ETA batata hai;
encoding alag process me chalti hai, is liye JS loop ko sirf apna kaam dekhna hota hai.

Number yahan is machine ke hain (2 vCPU, no GPU) — lekin **ratios** har machine par same rahenge, aur
wahi faisla karte hain ki kya bake karna hai.

---

## 8 · Badalna kya hai, kahan badalna hai

| Kya | Kahan |
|-----|-------|
| Copy (headline / VO / label) | `brand.mjs` → `SCRIPT[i].head`, `.vo`, `.label`, `.emphasis` |
| Scene ki lambai | `brand.mjs` → `SCRIPT[i].target` (total 60.0 rehna chahiye) |
| Rang / palette | `brand.mjs` → `C`, `GRAD` |
| Camera push / whip | `film.mjs` → `SCENE_CAM[]` (`z0,z1,ox,oy`) — **z ≤ 1.20, offset ≤ 60px** |
| Kisi scene ka art | `scenes.mjs` → us scene ka function |
| SFX cues | `film.mjs` → `sceneCues` (scene ke local time me) |
| Music | `lib/audio-synth.mjs` → `layers[]` (ek expression = ek layer) |
| Grade / grain | `film.mjs` → `drawGrade`, `makeGrain` |

QA ka tareeqa (jo maine har change par use kiya):

```bash
node render.mjs --stills 0.4,3,6.9,13,20,28,40,52   # PNG sweep — sabse tez nazar
node bench.mjs                                       # per-frame cost + ETA
node render.mjs --from 6.2 --to 8.6                  # ek boundary ka encoded test
node serve.mjs                                       # browser me, chapters ke saath
```

Framing ka apna invariant hai (section 3) — koi bhi camera change `z ≤ 1.20` aur safe band ke andar
rakhein, warna type crop hoga (ye ek dafa ho chuka hai).

---

## 9 · Voiceover — aakhri 10%

Sandbox me internet band tha (ElevenLabs firewall ke peeche), is liye awaaz **aap ki machine par**
render hoti hai — aur ye behtar hai anyway: aap voice choose kar sakte hain, sun kar badal sakte hain.

```bash
export ELEVENLABS_API_KEY=...          # key chat/file/log me kabhi nahi
node voice.mjs --voices                # apne account ki voices dekho
node voice.mjs --voice <voice_id>      # har scene ki line + grid par placed vo-timeline.wav
node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav
node render.mjs --remux                # picture wahi, naya mix
```

Details `VOICE.md` me. Chalane ka tareeqa: `--mode lines` (default) har scene ki line alag render
karta hai taake wo **beat grid par theek land kare**; `--mode one` poora script ek take me deta hai
(sabse natural prosody, magar placement hat se). Jo line apne window se lambi ho jaye, `voice.mjs`
use `atempo` se compress karta hai — aur bata deta hai jab line **bahut** lambi ho, kyunki us surat me
copy chhoti karni hoti hai, speed nahi barhani.

---

## 10 · Files

```
brand.mjs         palette, fonts, W/H/FPS, BPM grid, LAYOUT, SCRIPT, sceneWindows()
film.mjs          background + camera + transitions + chrome + grade; drawFrame(t)
scenes.mjs        8 scenes — har ek apne local time ka pure function
lib/motion.mjs    spring, kinetic type, chips, glass, withShadow, bake(), grain
lib/audio-synth.mjs  soundtrack: 120 BPM bed + 11 UI sounds + 80 cues + master chain
logo.mjs          vector emblem + per-letter wordmark + lockup
ui.mjs            atoms: bubble, chip, card, stat, ticks, typingDots…
render.mjs        canvas → raw RGBA → ffmpeg (--stills / --from --to / --sub / --remux)
voice.mjs         ElevenLabs narration → grid par placed timeline
bench.mjs         per-frame cost + ETA
serve.mjs         aap ka reviewer room (chapters, seek, sound)  →  :8100
preview/          us room ka page
out/              deliverable: film, mix, stills, render.json, audio-report.json
```
