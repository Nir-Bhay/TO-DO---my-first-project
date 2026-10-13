# Upstream provenance

This folder is a **vendored copy** of the `product-launch-motion` Claude Code skill.

| | |
| --- | --- |
| Source | https://github.com/AbubakrChan/product-launch-motion |
| Author | AbubakrChan |
| Pinned commit | `b3e82b40fb3470fccfc9c3601cfb1cff8b6d6cd5` (main, 2026-10-13 15:19 UTC) |
| Skill version | v2 (`motion-launch-video`) + v1 kept under `legacy/` |
| Licence | MIT (see `LICENSE`) for the skill, references and v1 scripts |
| Taken on | 2026-10-13 |

Canonical install (keeps you on upstream's latest instead of this frozen copy):

```bash
npx skills add AbubakrChan/product-launch-motion
```

## What was copied

```
SKILL.md                        v2 skill — creative direction + process (name: motion-launch-video)
references/prompts.md           Chan's original prompts and review notes, verbatim
references/technique.md         springs, camera, cursor, odometer, audio, render, QA code patterns
legacy/SKILL.md                 v1 skill — voiceover-led, GSAP + HyperFrames
legacy/references/*.md          12 v1 reference files (creative direction, motion grammar, traps, …)
legacy/scripts/*.mjs|*.sh       8 v1 helper scripts (assemble, transitions, wire-audio, master, …)
legacy/assets/*                 BRIEF, STORYBOARD, film.example.json, cues.example.json, frame-skeleton.html
legacy/evals/*                  v1 trigger/behaviour evals
legacy/CASE-STUDY.md            how the reference film went v1 → v7
NOTICE, LICENSE                 upstream licence + third-party notice, unchanged
```

## What was deliberately NOT copied

| Omitted | Why |
| --- | --- |
| `examples/film-preview.webp`, `examples/one-shape-loop.webp` (~21 MB) | The v2 sample films were made for Cheerful and are theirs. Upstream's `NOTICE` says you may not reuse or redistribute the films or their frames, and they are **not** covered by the MIT licence. |
| `legacy/film-preview.webp`, `legacy/still-1.jpg` | Same reason — frames from the reference film. |
| `.gitignore`, upstream `README.md` | Not part of the skill; the repo-level guide in this project points at the canonical one. |

## Third-party tools the skill assumes (you install these, they carry their own terms)

| Need | For |
| --- | --- |
| Claude Code (the skill's own README recommends Opus-class models) | Directing and building the film |
| Node ≥ 20 + Playwright | Frame rendering |
| FFmpeg | Motion blur, encoding, loudness checks |
| Python 3 + numpy | Beat grid and synthesized SFX |
| A royalty-free ~120 BPM track | Optional; check the licence per track |

Everything runs locally and costs nothing apart from the track's licence.

## Keeping this copy fresh

```bash
git clone https://github.com/AbubakrChan/product-launch-motion /tmp/plm
cd /tmp/plm && git rev-parse HEAD          # compare with the pinned commit above
```

If upstream moved, re-copy `SKILL.md`, `references/`, `legacy/`, `NOTICE` and `LICENSE`,
then update the pinned commit in this file.
