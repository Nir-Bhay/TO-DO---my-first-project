# Voiceover — ElevenLabs, aap ki machine par

Film **60.000 second** ka fixed grid hai: 8 scene windows `[7, 6, 7, 8, 7, 5, 6.5, 13.5]` seconds,
120 BPM, aur 80 sound cues beat par. Is liye awaaz ko **grid par land** karna hota hai — warna
premium film bhi "radio ad" lagne lagti hai.

Sandbox me ElevenLabs firewall ke peeche tha (`api.elevenlabs.io` par TLS handshake toot jata hai),
is liye narration yahan render nahi ho saki. **Ye actually behtar hai:** aap khud voice sun kar
choose kar sakte hain, aur ek dafa pasand aayi to sab kuch already wire hua pada hai.

---

## Step 1 — key

```bash
export ELEVENLABS_API_KEY=sk_...
```

Environment variable isliye, taake key shell history, file, ya log me **kabhi** na aaye. (Script
`--key sk_...` bhi leta hai, magar phir history me chali jati hai — sirf emergency ke liye.)

Key kabhi kisi file me nahi likhi jati, kabhi print nahi hoti, aur git me nahi jayegi.

## Step 2 — apni voices dekho

```bash
node voice.mjs --voices
```

Output me `voice_id`, naam, aur labels (accent · gender · age · use_case) aate hain.

**Presenter read ke liye kya dhoondhein:** warm, calm, Indian-English (ya neutral) female/male
presenter. Ek rule: jis voice me "narration" ya "conversational" label ho, wo "characters" wali se
behtar chalegi — film ko ek insaan ki awaaz chahiye, ek performer ki nahi.

```bash
export ELEVENLABS_VOICE=<voice_id>    # optional: default bana lo
```

## Step 3 — render (ek clip per scene, ya ek take)

```bash
node voice.mjs --voice <voice_id>              # default: --mode lines
```

Ye kya karta hai:

1. Har scene ki line `<id>:text-to-speech/{voice_id}`, model **`eleven_multilingual_v2`**,
   `mp3_44100_192` par render karta hai → `out/voice/line-0N-<scene>.mp3`.
2. Settings "smooth presenter" wale hain: `stability 0.45`, `similarity_boost 0.82`, `style 0.12`,
   `use_speaker_boost: true`. **Style jaan-boojh kar low hai** — v2 me style emotion laata hai, aur
   emotion consistency ki qeemat par aata hai; "smooth" ka matlab hai bhroon na ho.
3. Har line ko `ffmpeg` se **naapta** hai, uske scene window se compare karta hai, aur zaroorat par
   `atempo` (pitch safe) se halka compress karta hai — maximum ×1.14.
4. Sab lines ko unke scene starts par place karke `out/voice/vo-timeline.wav` banata hai
   (48 kHz stereo, 60.00s par trimmed) + `out/voice/voice-report.json` (har line ka duration).

Flags: `--mode one` (poora script ek take — sabse natural prosody, magar placement hat se),
`--lead 0.5` (awaaz scene me kitni der baad shuru ho), `--speed-max 1.14`, `--stability/-similarity/-style`.

**Agar koi line apne window se lambi nikle** — report batayega, aur upar se `⚠ NN% over — cut words`
aayega. Us line ka fix speed nahi, **copy** hai: `brand.mjs` → `SCRIPT[i].vo` chhota karein. Premium
film dheemi bolti hai; jaldi bolna sasta lagta hai.

## Step 4 — mix dobara banao

```bash
node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav
```

Yahan asli kaam hota hai:

- Music layers + 80 SFX cues + voice, sab milte hain;
- `sidechaincompress` music ko **awaaz ke neeche** apne aap dabata hai (aap ko envelope nahi banana);
- `loudnorm I=-14 TP=-1` par master, phir `ebur128` se **measure** — report print hoti hai.

Aap ko kuch aisa dikhna chahiye: `≈ −15 LUFS · true peak ≈ −1.0 dBTP`.

## Step 5 — picture ko naye mix se joro (5 second, re-render nahi)

```bash
node render.mjs --remux
```

→ `out/samyoj-launch-1080p60-with-sound.mp4` naya ban jayega, **wahi picture**, naya mix.

---

## Poora flow, ek jagah

```bash
cd samyoj-video
export ELEVENLABS_API_KEY=sk_...
node voice.mjs --voices
node voice.mjs --voice <voice_id>
node lib/audio-synth.mjs --voice out/voice/vo-timeline.wav
node render.mjs --remux
node serve.mjs            # http://localhost:8100  — sun kar faisla karein
```

## Kya dekhna hai jab aap sunein

1. **Pehli line 0.5 s par** shuru hoti hai — headline us waqt apni jagah le chuka hota hai. Awaaz
   type ke saath saans le, type ke upar nahi bole.
2. **Har line apne scene ke andar khatam** ho — scene badalne par awaaz kut na jaye.
3. **Music ducking** sunai na de (jhatka na lage) — agar lage to `sidechaincompress` ke `release`
   barha dein (`320` → `420`) `lib/audio-synth.mjs` me.
4. **CTA ki aakhri line** ("your customers are already here") pe film ke aakhri green pulse par
   khatam ho — sabse zyada asar wahi 2 second dete hain.

## Alternative: apni awaaz

Agar aap khud bolein (ya koi team member bole) to **behtar** hai — brand ki apni awaaz banti hai.
Bas ek file `out/voice/vo-timeline.wav` ke naam se rakh dein (48 kHz stereo, 60.00 s):
recording ko har scene ki line alag rakhein, phir `voice.mjs --mode one` ki jagah koi bhi DAW/ffmpeg
se unhe scene starts par place kar dein — ya mujhe bol dein, main aap ki raw files se timeline bana
dunga.
