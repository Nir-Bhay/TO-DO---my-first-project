# To-Do List — Organize Your Tasks

A simple, efficient task manager: add tasks with a due date, check them off, edit or delete them.
Everything is stored locally, so your list survives a refresh.

**Frontend:** HTML, CSS, JavaScript. (Node/Express is optional if you ever want server-side storage.)

## Run it

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8000
```

---

## What else is in this repo

This project also carries a **launch-film studio** and the skill that directs it — so your app can
have a product video made from code, with no After Effects, no template and no AI video model.

| Where | What it is |
| --- | --- |
| [`MOTION-LAUNCH-VIDEO.md`](MOTION-LAUNCH-VIDEO.md) | **Deep dive** on the skill, its pipeline, the maths, the licence traps and its honest limits |
| [`.claude/skills/motion-launch-video/`](.claude/skills/motion-launch-video/) | A vendored copy of the `product-launch-motion` skill (v2 + v1 in `legacy/`), pinned to a commit — see `UPSTREAM.md` |
| [`motion/`](motion/) | **A real film built with it**: a 24s, 120 BPM launch video for this To-Do app, plus its render and QA tooling |

### The film, in one paragraph

One shape, never cut: the same element morphs from the `TO-DO` pill into a composer, a task list, a
summary plate, one tile in a wall of 40 completed tasks, a toast, and back into the pill — while the
cursor does every click and drag, the camera frames every state, and the pull-back lands exactly on
the music's drop at 18.0s. Every pixel is a pure function of time (`window.__film.seek(t)`), the loop
is provably seamless, and it renders to a 60fps MP4 with real motion blur.

```bash
python3 motion/serve.py 8000         # watch it
node motion/test/timeline.test.mjs   # 28 checks on the score — no dependencies
node motion/render.mjs --out renders/todo-launch.mp4 --music song.mp3
```

Start with [`motion/BEAT-SHEET.md`](motion/BEAT-SHEET.md) — the state list on the beat grid, written
before a line of code, exactly as the skill's process demands.
