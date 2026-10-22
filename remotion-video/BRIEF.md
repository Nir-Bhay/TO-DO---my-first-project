# Motion Engineering Brief — Velora Studio Official 60 FPS Kinetic Launch Film (v2.0)

## 1. Goal & Deliverables
Deliver buttery-smooth **`60 FPS` (`24.00s` = `1,440 frames` @ `120.000 BPM`)** product launch films for **Velora Studio (`velora.so`)**:
- **Widescreen Client & Web Launch Film**: `reeldrop/web/media/velora-launch-demo-16x9.mp4` (`1920×1080`, `60 FPS`, `1,440 frames`) + root symlink `velora-launch-demo-16x9.mp4`
- **Vertical Social Media Launch Reel**: `reeldrop/web/media/velora-social-reel-9x16.mp4` (`1080×1920`, `60 FPS`, `1,440 frames`) + root symlink `velora-social-reel-1080x1920.mp4`
- **Approved Keyframe Stills**: `still-01-opening.png` (`F156`), `still-02-crop-action.png` (`F390`), `still-03-autadm-result.png` (`F660`), `still-04-closing-card.png` (`F1340`)

## 2. Global Beat-Locked Timeline (`60 FPS`, `120 BPM` -> `1 Beat = 30f`, `Total = 1,440f`)
Sum of `TransitionSeries` sequence lengths = `264 + 294 + 300 + 264 + 240 + 200 = 1,562f`; minus 5 transitions `24 + 24 + 24 + 24 + 26 = 122f` -> **Exact `1,440 frames` (`24.000s`)**.

| Act | Global Window | Transition Out | Visual & Camera Choreography | Key Event Frame |
| :--- | :--- | :--- | :--- | :--- |
| **01 · Kinetic Hook & Portal** | `F000 – F264` | `F240–F264` (`opticalIrisPortal`) | Dark obsidian kinetic stomps -> Cursor clicks `[ Enter Live Studio -> ]` (`F195`) -> Portal expands right on **Bar-3 Drop (`F240 = 4.00s`)** | `F002`, `F060`, `F120`, `F195`, `F240` |
| **02 · Live 4:5 Safe Crop** | `F240 – F534` | `F510–F534` (`velocityWhipPush("left")`) | Continuous `60fps` 2.5D camera push-in over live `screen-create.webp`; cursor presses `Apply 4:5 Safe Fit` (`F336`, departs `>= 48px`) | `F336`, `F344` |
| **03 · Comment -> 0.8s DM** | `F510 – F810` | `F786–F810` (`cameraCraneWhip`) | Real `screen-automations.webp` morphs live into `screen-automations-sent.webp` at `F600` (`10.00s`) + `76.1% CTR` odometer roll | `F536`, `F600` |
| **04 · Visual 4:5 Grid Swap** | `F786 – F1050` | `F1026–F1050` (`velocityWhipPush("right")`) | 2.5D camera glides over `screen-grid.webp`; scheduled `4:5` cards lift in 3D and swap cleanly on **Beat 30 (`F900 = 15.00s`)** | `F840`, `F900` |
| **05 · CRM, 58 MCP & Modes** | `F1026 – F1266` | `F1240–F1266` (`diagonalShutterPrism`) | Real `screen-inbox.webp` + `58 MCP Tools`; cursor clicks `Without Data` (`F1110`), optical laser scan-beam unveils `screen-empty.webp` | `F1110` |
| **06 · Bento Orbit & Lockup** | `F1240 – F1439` | Seamless Loop (`2.50s` Hold) | Four live studio screens orbit behind **Velora Studio · Ship Reels that convert · velora.so** | `F1260` |
