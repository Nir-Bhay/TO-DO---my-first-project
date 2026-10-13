# Samyoj — 60s launch film

A premium, fully-code-generated launch film for **Samyoj** (AI-powered WhatsApp CRM / official
WhatsApp BSP). No footage, no stock, no editor: 3600 frames drawn by canvas and piped raw into
ffmpeg, plus a soundtrack synthesised from ffmpeg expressions.

**1920×1080 · 60 fps · 60.000 s · 120 BPM · 8 scenes · 80 sound cues · −15.2 LUFS · crf16/slow**

| I want to… | …run |
|---|---|
| watch it | `node serve.mjs` → http://localhost:8100 (chapters + seek + sound) |
| render it | `node render.mjs` (~9 min at `--sub 2`, ~27 min at `--sub 4`) |
| just look at frames | `node render.mjs --stills 3,9,15,21,27,33,39,51` |
| rebuild the soundtrack | `node lib/audio-synth.mjs` |
| render the narration (ElevenLabs) | `node voice.mjs --voice <id>` — see **VOICE.md** |
| render a scratch narration offline | `node piper-voice.mjs` (neural TTS, no account, no network) |
| get a new mix into the picture | `node render.mjs --remux` (seconds, no re-render) |
| change copy / timings / colours | `brand.mjs` → `SCRIPT`, `C`, `GRAD` |
| change camera moves | `film.mjs` → `SCENE_CAM[]` (keep `z ≤ 1.20`, offsets ≤ 60px) |
| change a scene's art | `scenes.mjs` → that scene's function |

**Read [`SAMYOJ-LAUNCH-FILM.md`](SAMYOJ-LAUNCH-FILM.md)** for the whole design (in Roman Urdu) —
brand system, the one-camera rule, the audio architecture, and the performance findings that took
the render from 1.66 s/frame to 140 ms/frame.

Requirements: Node ≥ 20, `@napi-rs/canvas` (in `package.json`), and ffmpeg — see
[`tools/README.md`](tools/README.md) for where it looks for the binary.
