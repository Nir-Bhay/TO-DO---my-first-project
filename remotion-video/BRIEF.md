# Velora Studio v3.1 — 60 FPS Beat-Synced Launch Film Brief

## 1. Core Rhythm & Audio-Visual Synchronization Specification
- **Frame Rate & Resolution**:
  - `VeloraLaunch16x9`: `1920x1080` @ `60.00 FPS` (`1,680` frames = `28.000s`, `H.264 + AAC 192 kbps`)
  - `VeloraSocialReel9x16`: `1080x1920` @ `60.00 FPS` (`1,680` frames = `28.000s`, `H.264 + AAC 192 kbps`)
- **Sample-Measured Musical Grid (`house-vibez.mp3`)**:
  - Raw source measured via PCM low-frequency kick onset correlation: exact `0.491935s/beat` (`121.967 BPM`) starting at `t0 = 0.060s`, with a 2-bar rising build at Bar 30 (`59.076s`) and peak bass drop at Bar 32 (`63.011s`, `RMS = 0.2887`).
  - Phase-trimmed (`atrim=start=0.060`) and time-scaled (`asetrate=44100*(120/121.967),aresample=44100`) to exact **`120.000 BPM` (`0.50000s = 30.00 frames/beat`, `120.00 frames/bar`)**, sliced from `60.000s` (`Bar 30`) so:
    - Every single kick drum lands on an exact multiple of `30` frames (`F000`, `F030`, `F060`, `F090`, ..., `F1650`).
    - **Bar 32's full drop lands on exact `F240` (`4.000s`)**, driving the portal zoom directly into `Velora Studio 3.0`.
    - Every scene transition straddles an exact 4-bar boundary (`F240 = 4.0s`, `F480 = 8.0s`, `F720 = 12.0s`, `F960 = 16.0s`, `F1200 = 20.0s`, `F1440 = 24.0s`).

## 2. Clean UI Layout & Visual Hierarchy Rules
1. **Act 1 (`F000–F252`, `0.0s–4.2s`) — Beat-Synced Feed Previewer Hook**:
   - Centered header badge (`SceneTag centered`) + split-line kinetic headline (`Stop shipping cropped covers & missed DMs.` -> `Auto-fit 4:5 covers. Instant 0.8s DMs.`).
   - Left Velora `@maya.studio · Feed Preview` card cycling real cover art on every `30f` kick + right-column live comment/DM status stack flipping to emerald `1080x1350 SAFE 4:5` & `0.8s` DM delivery on Beat 4 (`F120`), followed by cursor click & portal zoom on `F240`.
2. **Acts 2–6 (`F240–F1452`, `4.0s–24.2s`) — Zero-Overlap Two-Column Architecture**:
   - Strict separation between the live `3200x1920` 2x Retina Studio browser frame and the clean telemetry/headline column (`>= 64px` gutter, zero overlapping floating cards, zero corner bokeh clutter, stationary click ripples anchored strictly at target button coordinates).
3. **Act 7 (`F1440–F1679`, `24.0s–28.0s`) — 3D Studio Bento Lockup**:
   - Four live Retina Studio screens floating cleanly around the centered frosted hero CTA lockup (`Explore Live Studio · velora.so`).
