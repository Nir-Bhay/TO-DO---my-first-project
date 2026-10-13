# Beat sheet — TO-DO launch film

**Written before any code**, because that is the skill's step 2: *"show the state list on the beat
grid before writing code (bar/beat table: what happens, which element morphs into what, which
sound)."* If the film is wrong, it is wrong here first, and this table is cheap to fix.

```
120 BPM · 0.5s per beat · 4 beats per bar · 12 bars · T = 24.0s · loops seamlessly
```

| Bar | t | Beat | What happens | The shape becomes | Sound |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.00 | 1 | The film opens on the pill: `TO-DO`. The camera is already drifting in | pill 340×92, r46, indigo→violet | — |
| 1 | 0.25 | 1.5 | The cursor is *born* (scale spring from 0) and flies in from bottom-right | — | whoosh |
| 1 | 0.50 | 2 | Cursor crosses the frame; its trail is only visible above 420px/s | — | — |
| 1 | 1.00 | 3 | Camera settles at 1.0×; the pill is framed, not floating | — | — |
| 1 | 1.50 | 4 | Cursor arrives on the pill's right edge — where a human would click | — | — |
| 2 | 2.00 | 5 | **CLICK.** Press-scale 0.84 + a ripple ring. The film's first interaction | — | click + release |
| 2 | 2.06 | 5.1 | **MORPH 1**: the pill becomes the composer card; the wordmark exits *short and early* (0.14s) | composer 760×300, r30, white | whoosh |
| 2 | 2.25 | 5.5 | Placeholder "What needs doing?" blur-swaps in; the caret starts blinking (from `t`, not CSS) | — | — |
| 2 | 2.60 | 6.2 | Camera pushes to 1.04×, re-framing on the composer | — | — |
| 3 | 3.00 | 7 | **Typing starts**, one character per 32nd (0.125s) — "Ship the launch video" | — | tick ×11 |
| 3 | 3.50 | 8 | Cursor follows the end of the streamed line, spring w=22 | — | — |
| 4 | 4.00 | 9 | Typing rides the build; camera creeps to 1.07× | — | — |
| 4 | 5.85 | 12.7 | Last character lands; the line settles | — | chime |
| 5 | 6.05 | 13.1 | Date chip blur-swaps in: `Fri 17 Oct` | — | blip |
| 5 | 6.60 | 14.2 | The priority slider appears (track, fill, knob at 25%) | — | — |
| 5 | 6.95 | 14.9 | Cursor takes the knob | — | click |
| 6 | 7.00 | 15 | **DRAG** — direct manipulation: the value comes from the cursor's position, not a tween | — | pen ticks |
| 6 | 8.34 | 17.7 | Dragged past max: rubber-band, and the fill runs ahead of the knob (edge split) | — | — |
| 6 | 8.60 | 18.2 | **Release** — the value springs back from wherever it was, to 100% | — | release + chime |
| 6 | 9.00 | 19 | **CLICK "Add"** | — | click |
| 6 | 9.06 | 19.1 | **MORPH 2 (zoom-through)**: composer becomes the list card *as* the camera pushes to 1.13× — the transition IS the camera move | list 880×340, r26, white | thump |
| 7 | 9.32 | 19.6 | Header `TODAY` / `3 tasks` fades in; row 1 lands with the task that was just typed | — | pop |
| 7 | 10.00 | 21 | **Row 2 slams in** — one per beat, boom boom boom | — | pop |
| 7 | 11.00 | 23 | **Row 3 slams in** | — | pop |
| 8 | 12.00 | 25 | **CHECK 1.** Cursor clicks the box; the tick *draws* (dash-offset), the text strikes through and dims | — | click + chime |
| 8 | 13.00 | 27 | **CHECK 2** | — | click + chime |
| 8 | 14.00 | 29 | **CHECK 3** | — | click + chime |
| 8 | 15.00 | 31 | The header's right slot blur-swaps `3 tasks` → `3-day streak` (one slot, two contents) | — | shimmer |
| 9 | 16.00 | 33 | **MORPH 3**: the list becomes the summary plate; tabs and the ring enter | plate 520×340, r26, white | whoosh |
| 9 | 16.45 | 33.9 | The ring starts drawing itself; the number rolls 0 → 12 | — | — |
| 9 | 16.60 | 34.2 | **CLICK "Done"** — the indicator's leading edge (w=34) runs ahead of its trailing edge (w=19) | — | click + blip |
| 9 | 17.80 | 36.6 | Ring complete: 12 of 12. Cursor rests over it | — | — |
| 10 | 17.85 | 36.7 | Camera begins the pull-back **0.15s early**, so it is *arriving* on the beat | — | riser (1.0s, peaks on the drop) |
| 10 | 18.00 | 37 | **THE DROP.** Pull-back to 0.56× — one plate becomes a wall of 40 completed tasks | one tile 160×90, r18, in the wall | thump |
| 10 | 18.05→20.05 | 37→41 | 40 tiles slam in, accelerating (0.12s apart → 0.035s); the odometer rolls to **412 tasks completed** | — | pop ×40, accel. |
| 10 | 20.30 | 41.6 | The wall has landed; the odometer settles | — | shimmer |
| 11 | 20.60 | 42.2 | **MORPH 4**: the tile becomes a toast as the camera comes back to 0.88× | toast 520×84, r42, indigo→teal | pop + chime |
| 11 | 20.85 | 42.7 | The toast's tick draws; `All caught up` | — | — |
| 11 | 22.40 | 45.8 | **MORPH 5**: the toast becomes the pill again — same size, radius and gradient as frame 1 | pill 340×92, r46 | whoosh |
| 12 | 22.50 | 46 | The wordmark re-enters; the cursor heads for the exit | — | — |
| 12 | 23.20 | 47.4 | The cursor scales out; the camera returns to 0.94× | — | — |
| 12 | 23.60 | 48.2 | Cursor reaches the exact position it left from | — | — |
| 12 | 24.00 | — | **Frame 24.0 == frame 0.0**, byte for byte. Loop | — | — |

## Where the drama is, and why

| Moment | Beat | Why here |
| --- | --- | --- |
| First click | 2.0s (beat 5) | Long enough to want it, short enough that the film never idles |
| The typing | 3.0–5.85s | Rides 32nds, so it accelerates with the music instead of sitting on the grid |
| The drag | 7.0–8.6s | The only *continuous*, two-way interaction in the film; it earns the longest hold |
| The pull-back | 18.0s (bar 10) | The drop of the music — rule 7: *cut the song window so the drop lands on the big moment* |
| Return to the pill | 22.4s | 1.6s of run-out, so nothing is still moving when the loop point arrives |

## Cue inventory (exported from the film itself)

`window.__film.cues` — one source of truth, exactly as the skill asks (`M.cues → events.json`).
~100 cues, every one a synthesized voice:

`click` · `release` · `tick` · `pen` · `pop` · `blip` · `chime` · `shimmer` · `whoosh` · `thump` · `riser`

## What is real and what is invented (say it out loud, always)

| On screen | Status |
| --- | --- |
| "Ship the launch video", "Review the edit", "Send to Nirbhay", "Fri 17 Oct" | **Invented** — a plausible micro-story, not data |
| `412 tasks completed` | **Invented** — a placeholder for the demo; a real launch film must read this from the product's own numbers (the skill's law 1, *truth first*) |
| `3-day streak`, `12 of 12 done today` | **Invented**, same rule |
| The UI itself (pill → composer → list → tabs → toast) | Constructed to look like the app's language, not copied from a screenshot |
| The music and every sound effect | **Synthesized at runtime** (`lib/audio.mjs`) — no samples, nothing to license |

If this film ever ships to an audience, steps 3 and 12 of the pipeline are the ones to repeat:
collect the approved figures, and replace every invented number above.
