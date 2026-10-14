# deliver/ — the film, and everything that goes with it

| File | Kya hai |
|---|---|
| `samyoj-launch-1080p60-with-voice.mp4` | **The film.** 60.000s · 1080p60 · narration + music + 80 sound cues |
| `samyoj-launch-1080p60-with-sound.mp4` | Same picture, music + sound only (no narration) |
| `poster.jpg` | The end card as a still — thumbnails, email, deck covers |
| `SHOT-LIST.md` | Shot-by-shot breakdown, generated from the film's own source |
| `VIDEO-KAHAN-HAI.md` | **Yahan se shuru karein** — video kaise dekhein (3 tareeqe) |
| `render.json` | Scene windows + cue map (the preview page reads this) |
| `audio-report.json` | What the mix actually measures (LUFS, true peak) |

Ye folder **git me commit hai** — kyunki sandbox reset hone par ye render do bar gaya tha. Jo cheez
play nahi ho sakti, wo deliverable nahi hoti.

Regenerate: `node render.mjs --sub 2` (working files `out/` me jayenge), phir
`cp out/*with-voice.mp4 deliver/`.
