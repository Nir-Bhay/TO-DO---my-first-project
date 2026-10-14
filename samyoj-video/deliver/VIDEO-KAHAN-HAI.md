# VIDEO KAHAN HAI — 3 tareeqe se dekhein

Aap ka 60-second Samyoj launch film **teen jagah** se khul sakta hai. Jo sabse aasan lage, wahi karein.

---

## 1 · Browser me (sabse aasan — kuch download nahi)

**Live preview:** Arena ke preview panel me port **8100** par film khulti hai.

Us page par:
- ▶️ Film play-ready hai → **Play** dabayein
- 🔴 **Scene buttons** — kisi bhi scene par jump karein (1. Hook, 2. Broadcast …)
- 🔊 **Sound on** button — pehli baar dabaana zaroori hai (browser ka rule hai, film ka nahi)
- 🎙 / 🎵 **Voice + music ⇄ Music only** — dono cuts, ek hi second par compare karein

> Agar preview panel na dikhe ya page na khule: mujhe bolein — sandbox restart hone par server band
> ho jata hai, main 1 second me dobara start kar deta hoon.

---

## 2 · File khol kar (download)

Film ye files hain — **download kar lein** taake aap ke device par hamesha rahein:

```
samyoj-video/deliver/samyoj-launch-1080p60-with-voice.mp4      ← 🎙 awaaz wali (16.9 MB)
samyoj-video/deliver/samyoj-launch-1080p60-with-sound.mp4      ← 🎵 sirf music (16.9 MB)
```

Dono **git me commit** hain — matlab GitHub par bhi mojood hain, sandbox reset hone par bhi nahi
jayengi. GitHub se seedha download:

```
github.com/Nir-Bhay/TO-DO---my-first-project
  → branch: arena/092d82fc-to-do-my-first-project
  → samyoj-video/deliver/  →  file  →  Download
```

---

## 3 · Phone / WhatsApp par bhejna ho

MP4 hai (H.264 + AAC) — **kisi bhi phone, laptop, TV, projector par chalega**. WhatsApp, Telegram,
YouTube, Instagram, PowerPoint — sab accept karenge. 16.9 MB ka hai, WhatsApp par bhi aaram se jayega.

---

## Film ka spec (ek nazar me)

| | |
|---|---|
| Length | **60.000 second** (exactly 1 minute) |
| Picture | 1920×1080, **60 fps**, H.264 crf16 |
| Sound | AAC 192k · **−14.6 LUFS** (broadcast standard) |
| Structure | 8 scenes, 120 BPM grid, **80 sound cues** |
| Language | English VO + English on-screen text |

## Scenes (timestamps)

| # | Time | Scene | Kya dikhata hai |
|---|------|-------|-----------------|
| 1 | 0:00 | Hook | "Every business runs on conversations" — chat bubbles |
| 2 | 0:07 | Broadcast | 12,480 delivered, tiles bharte hue |
| 3 | 0:13 | AI agent | Jawab 0.4s me, sources ke saath |
| 4 | 0:20 | Automation | No-code flow: capture → answer → human handoff |
| 5 | 0:28 | Shared inbox | Ek inbox, har chat par tags / stages / owner |
| 6 | 0:35 | Commerce | Catalog → order → ₹1,299 received |
| 7 | 0:40 | Ads | Ad click → conversation → 3.2× ROAS |
| 8 | 0:46 | End card | Logo, tagline, free trial, 98% / 45–60% / 70%+ |

Poora shot-by-shot breakdown: **[SHOT-LIST.md](SHOT-LIST.md)** — har scene, har cue, har timestamp.

---

## Awaaz (VO) ke baare me

Film me jo awaaz hai wo **offline neural TTS (Piper)** se bani hai — kyunki is sandbox me ElevenLabs
ka network band hai (`api.elevenlabs.io` reachable nahi). Ye **scratch narration** hai: theek hai,
"premium presenter" nahi.

**Premium awaaz ke liye** (aap ki machine par, 2 minute):
```bash
cd samyoj-video
export ELEVENLABS_API_KEY=sk_naya_key      # purani key revoke kar dein!
node voice.mjs --voices                    # apni voices dekhein
node voice.mjs --voice <voice_id>
node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav --out out/audio-master-vo.wav
node render.mjs --remux --mix out/audio-master-vo.wav --suffix -with-voice
```
Poori guide: **VOICE.md**

---

## Kuch badalna ho (regenerate)

```bash
cd samyoj-video
npm install                    # ek dafa
bash tools/get-ffmpeg.sh       # ek dafa (ya system ffmpeg)
node render.mjs --stills 3,9,15   # sirf frames — sabse tez check
node render.mjs --sub 2           # poora film (~6 minute)
node serve.mjs 8100               # preview khol lein
```

Copy, theme, timing, camera — kahan badalna hai: **SAMYOJ-LAUNCH-FILM.md** (section 8 ka table).
