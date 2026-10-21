# Velora (`velora.so`) — Social Publishing, Visual Profile Grid & DM Workflows

**Velora** is a clean, responsive social media publishing and engagement studio built with zero external runtime bloat, self-hosted variable typography, a 15-table normalized **SQLite WAL** backend (`node:sqlite`), PBKDF2 authentication, binary media asset storage, a 58-tool **Model Context Protocol (`POST /mcp`)** server, and 1-click **Vercel Serverless** deployment.

## Highlights

- **Typography & Architectural UI Craft**:
  - Self-hosted Variable WOFF2 fonts preloaded locally (`Plus Jakarta Sans Variable` display headings, `Inter Variable` body with `"cv02", "cv03", "cv04", "cv11"` OpenType alternates & `tabular-nums`, and `JetBrains Mono Variable` for code/timestamps) — zero system serif fallbacks offline or on Linux/macOS/Windows.
  - Pure uniform `1.75px` stroke SVG icon system (`web/js/icons.js`), Light & Dark themes, `Cmd+K` global command palette, smooth slide-over drawers, and full `360px` mobile-to-desktop responsiveness.
- **Complete Production Feature Suite**:
  - **Overview (`/app/overview`)**: Live workspace KPIs, auto-publisher queue worker trigger, active DM workflow conversion metrics, and unread conversations.
  - **Create Post (`/app/create`)**: Real drag-and-drop local **video (`MP4`/`WebM`) & photo (`PNG`/`JPG`/`WebP`) upload** backed by SQLite + disk storage, live mobile phone preview with 125-char fold indicator, reusable Caption Templates CRUD, hashtag safety check, Trial Reel toggle, and instant or scheduled publishing.
  - **Calendar & Queue (`/app/calendar`)**: Month view & Queue table with **HTML5 drag-and-drop post rescheduling** across calendar dates and slide-over Post Inspector drawer.
  - **Profile Grid Planner (`/app/grid`)**: `4:5`, `3:4`, and `1:1` feed crop switcher, **HTML5 drag-and-drop tile reordering**, custom tile cover photo upload, collaborator tags, and visual planning notes.
  - **Carousel Studio (`/app/carousels`)**: 16 clean Swiss, Editorial & Brand design presets, custom hex color pickers, per-slide image upload, **1080x1350 PNG slide export**, and 1-click scheduling.
  - **DM Workflows (`/app/automations`)**: Comment, Story Reply, Direct DM & AI Concierge workflows with **Interactive Live Chat Simulator**.
  - **Unified Inbox & CRM (`/app/inbox`)**: 3-pane Direct Messages + Post Comments moderation, Meta 24-hour window timer, quick snippets, labels, and persistent **Contact CRM Notes**.
  - **Performance Analytics (`/app/analytics`)**: Interactive SVG trend charts, Trial Reel graduation lab, post breakdown table, and **CSV report export** (`/api/analytics/export.csv`).
  - **Settings & MCP API (`/app/settings`)**: Workspace profile & slots, Team Member invites, Plan switcher (`Starter`, `Growth`, `Studio`, `Lifetime`), interactive **58-Tool MCP console (`POST /mcp`)**, and JSON backup/reset.

## Running Locally & Deploying to Vercel

```bash
# Start local server on http://0.0.0.0:3080
PORT=3080 npm start

# Run end-to-end backend, SQLite, Auth, Media Upload, MCP & Chromium responsive suite
npm test
```

Deploy directly from GitHub to **Vercel** with zero configuration — root `vercel.json` serves `reeldrop/web` statically and routes `/api/*` and `/mcp` to `api/index.js`.
