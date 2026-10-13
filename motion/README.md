# The TO-DO launch film

A 24-second, 120 BPM product launch film for this To-Do app, built to the rules in
[`../.claude/skills/motion-launch-video/SKILL.md`](../.claude/skills/motion-launch-video/SKILL.md).

Open it: **`http://localhost:8000`** (or press ▶ on the live preview). Press *Play with sound* —
the film's whole structure is cut to the music, and every click lands on a beat.

```
motion/
  index.html          the stage, the grade, and a scrubber for review
  film.mjs            the film: build the DOM once, then draw(t) — every pixel is f(t)
  lib/motion-math.mjs springs, Track, blur swaps, colour keyframes  (pure, testable)
  lib/timeline.mjs    the whole score as data: morphs, camera, cursor, cues
  lib/audio.mjs       120 BPM bed + 11 synthesized sound effects, placed peak-on-cue
  test/               two suites: the score (Node) and the render (jsdom)
  render.mjs          Playwright subframes + ffmpeg tmix → 60fps MP4 with motion blur
  qa.mjs              one frame per beat, contact sheet, transitions at ±0.1s
  serve.py            static server with the right MIME for ES modules
  BEAT-SHEET.md       the state list on the beat grid — written BEFORE the code
```

## Run it

```bash
python3 motion/serve.py 8000        # → http://localhost:8000
node motion/test/timeline.test.mjs  # 28 checks on the score, no dependencies
npm i -D jsdom && node motion/test/film.dom.test.mjs   # 12 checks on the render
```

## Render it to MP4

```bash
npm i playwright && npx playwright install chromium     # once
node motion/render.mjs --out renders/todo-launch.mp4 --music song.mp3
```

The render is the skill's stage, unchanged in spirit: **4 subframes per frame**, blended by
`ffmpeg tmix` into real motion blur, downsampled 240 → 60fps. That is what the film looks like in a
browser for free, and what makes the export feel like a camera rather than a slideshow.

```bash
node motion/qa.mjs                  # renders/qa/beats.png — look at it before you render
```

## How the skill's rules map onto this film

| Rule | Where it lives |
| --- | --- |
| **1 · One shape, never cut** | `#shape` is the only container in the film. Pill → composer → list → plate → one tile in the wall → toast → pill. Nothing cuts; the transitions are morphs and camera moves |
| **2 · Blur content swaps** | `vis()` in `motion-math.mjs`: every slot enters on a spring and exits short and early (0.12–0.16s), with blur paired to opacity |
| **3 · Springs, tiny overshoot at most** | `stepR()` (closed-form damped step) and `Track` (many target changes = sum of one spring per change). Damping 0.86–0.9 for morphs, 1.0 for camera and text |
| **4 · Edge-split stretch** | The tab indicator: leading edge `w=34`, trailing edge `w=19`. The slider knob stretches when dragged past max |
| **5 · A cursor drives everything** | 12 click events, 1 drag, press-scale `1 − 0.16·exp(−((t−tc)/0.06)²)`, 0.4s ripple rings, lean from velocity, trail sampled at `t − k·9ms`, and a name pill that hands off from "You" to "TO-DO" at the drop |
| **6 · The camera frames every state** | `translate(960,540) scale(z) translate(−cx,−cy)`; z, x, y on springs. Zoom-through at 9.0s; pull-back to 0.56× at the drop |
| **7 · Music first** | 120 BPM, drop landing on the pull-back at 18.0. The film is *clocked to the audio* while the sound is on |
| **8 · Every sound synthesized, peak on the cue** | `lib/audio.mjs`: each effect declares a `lead`, so its **peak** lands on the beat, not its start |
| **9 · The last frame is the first frame** | Proved, not eyeballed: `film.dom.test.mjs` compares every element's style at `t=0` and `t=T` and requires them identical. `ΣΔ = 0` on every Track |

Plus the two traps the skill calls out by name:

- **No `will-change`** on anything the camera scales (`#shape`, `#world` children) — text would blur.
- **Text inside morphing containers gets its own timing** — the composer's wordmark exits at 2.06
  while the card is still growing, so nothing overlaps.
- **No CSS transitions anywhere** — a transition cannot be seeked, so a renderer cannot trust it.
- **Loop-aware springs** — `Track.at()` sums the current *and* previous cycle, so the loop is
  consistent rather than merely similar. (This is the skill's "sum the k = −1, −2 periods".)

## DECISIONs (the skill asks the director to log these, so you can overturn any in one reply)

1. **The subject is the app's own UI language**, not a generic device mock. The film's shape *is* the
   product.
2. **No brand imagery or logos.** The skill bans a "trusted by" row and third-party marks; the wall
   of completed tasks does the same job with the product's own material.
3. **The music is synthesized** rather than licensed. It costs nothing, ships with the repo, and
   means the film is 100% original — but a real track would sound better. Swap it by replacing
   `lib/audio.mjs`'s `scheduleMusic` with an `<audio>` element and using `--music` in `render.mjs`.
4. **Children live in a world-space layer, not inside the morphing container.** The skill's reference
   puts them inside; at this scale an explicit coordinate table is easier to reason about and the
   camera still transforms them together. Same pixels, different bookkeeping.
5. **Colour is keyframed, not tweened per property.** `mixStops` interpolates gradient stops across
   the cycle; that is what lets the pill be indigo/violet and the cards be flat white.
6. **Two content windows for the wordmark** (out at the first morph, back in at the last) — the loop
   needs it to be on screen at both ends without a 24-second spring being involved.
7. **The last 0.4s is a locked hold.** Nothing moves at the loop point; that is rule "nothing ends
   moving", applied to the loop rather than to a cut.

## Honest caveats

- **The audio has never been heard**, only scheduled and levelled — the skill says the same about its
  own reference film. It was written on a machine with no browser and no speakers. Judge it
  yourself; the structure (120 BPM, drop at 18.0, SFX on the grid) is what matters, and it is
  arithmetic you can check in `lib/audio.mjs`.
- **Every number on screen is invented** except the timings. See the table at the end of
  `BEAT-SHEET.md` — a real launch film has to replace those with the product's own figures (skill
  law 1).
- **The film is 1920×1080 at 60fps.** For a square or vertical cut, the geometry table in
  `lib/timeline.mjs` (`G`) and the camera are the two things to re-tune, exactly as the skill's
  `references/12-deliverables.md` describes.
- **Text metrics are measured at runtime** from whatever UI font the machine has. For a pixel-exact
  render, self-host one font in `motion/fonts/` and add the `@font-face` — the skill's own rule is
  "self-hosted fonts only; a render should need no network at all".
