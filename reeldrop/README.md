# ReelDrop (`reeldrop.io`) — Complete 100% Full-Stack + Vercel Serverless Reconstruction (`v2.0`)

Reconstructed, audited, and cryptographically verified using **`morluto/rea` (`rea-agents@6.7.0`)** against `https://www.reeldrop.io/`.

---

## 1. Zero-Config Vercel Deployment (Works 100% Standalone on Vercel — No Separate Backend Needed!)

This repository is engineered so you can deploy directly to **Vercel** in **one click** with **zero external database setup, zero environment variables required, and zero separate backend server**:

### Option A — Deploy Repo Root Directly on Vercel (Fastest 1-Click GitHub Import)
1. Push this repo to GitHub and open **[https://vercel.com/new](https://vercel.com/new)**.
2. Import the repository and click **Deploy** directly (leave all settings as default — root `vercel.json` + `/api/index.mjs` are already configured!).
3. Both the Frontend UI (`/`), REST API (`/api/*`), and the **58-Tool Claude/Cursor MCP Server (`POST https://<your-app>.vercel.app/mcp`)** go live immediately!

### Option B — Deploy `/reeldrop` Folder Directly (`Root Directory = reeldrop` or Vercel CLI)
```bash
cd reeldrop
npx vercel --prod
```
- **Triple-Layer Persistence Architecture**:
  1. **Local / Persistent Node Server (`npm start`)**: Writes JSON + 11-table SQLite WAL mirror (`reeldrop/data/reeldrop.db`).
  2. **Vercel Serverless Functions (`/api/index.mjs`)**: Automatically uses Vercel's writable ephemeral `/tmp/reeldrop-data/` store (`process.env.VERCEL`) **plus** automatic client-to-serverless `_clientSnapshot` state hydration across cold starts so **zero scheduled posts, automations, comments, or plan changes are ever lost between cold Lambda invocations**!
  3. **Pure Static CDN Fallback (`public/shared/browserEngine.js`)**: Even if hosted on a pure static file host without serverless functions at all, the client automatically runs the full isomorphic engine directly in the browser!

---

## 2. Pre-Seeded Multi-Workspace Test Dataset (Ready to Test Immediately)

Switch between **4 complete creator accounts** from the top-left workspace selector at any time — or click **`↻ Reset Data`** in the header to restore clean test data after testing destructive actions:

| Workspace | Handle | Active Plan | What to Test Right Away |
|---|---|---|---|
| **1. Maya Studio** | `@maya.creates` | **Creator (`$29/mo`)** | **17 posts** across Sept/Oct/Nov 2026 (`SCHEDULED`, `PUBLISHED`, `DRAFT`, `FAILED` container retry, `TRIAL` Reels, `@collab` tags), **6 Automations** (`Comment`, `Story Reply`, `Incoming DM`, `AI Reply`, `Paused`), **4 Carousel Decks**, **7 DM Inbox threads** (`Open`, `Closed`, `★ Hot Lead`, `Outreach`, `Snoozed`, `Archived`, `>24h Expired Meta Window`), **5 Post Comments**. |
| **2. Piyush Builds** | `@piyush.builds` | **Starter (`$0 Free`)** | **Instant Plan Quota Edge Testing**: Pre-loaded at **`2/3` AI Captions**, **`2/3` Trial Reels**, **`4/5` Active Automations**, mandatory `"Sent via reeldrop.io"` branding watermark, and **Read-Only DM Inbox** lock! Generate 1 caption (`3/3`), then click again to test exact quota gating & live plan switching! |
| **3. Arjun Fitness** | `@arjun.fitness` | **Influencer (`$9.99 / ₹449`)** | Fitness coaching funnel with unlimited Auto-DMs, Follow-Gate verification, and brandless DM delivery. |
| **4. Studio Koko** | `@studio.koko` | **Founding Lifetime (`$249`)** | E-commerce ceramics studio running Story Restock DM drops & VIP collector threads. |

---

## 3. Complete Feature Matrix (Zero Gaps)

- **Marketing Website (`/`, `/themes`, `/free-tools`, `/pricing`, `/campaigns`, `/docs`)**:
  - Editorial Warm Cream (`#FAF9F6`) & Dark Mode (`#0F0F12`), Terracotta (`#D94826`), *Fraunces* display serif + *Inter* + *JetBrains Mono*.
  - Interactive Showcase Tabs, 13-Niche Marquee, Live DB Telemetry Counters, 9-Card Bento, Referral Link Banner (`MAYA-FREE`), USD/INR Pricing + 3-Question Advisor + `$249` Founding Lifetime, Paid Campaigns Form, iOS Lockscreen Notifications, and 8 Accordion FAQs.
- **All 20 Interactive Free Browser Tools (`/free-tools`)**:
  - Caption Generator (+ 1-click *Send to Create Studio*), Visual Grid Planner, Caption 125-Char Fold Checker, Engagement Rate Calculator, Collab Rate Card Calculator (USD/INR), 5-Symptom Interactive Shadowban Scorer, Hashtag Density & Restricted-Tag Scanner, Aspect Ratio Checker, Printable HTML/PDF Media Kit Generator, Hook Generator, Hook Timing Analyzer, CTA Builder, Bio Writer, MOV->MP4 Profile Tool, and LinkedIn <-> Instagram Carousel Converters.
- **All 35 Curated Carousel Themes + Studio (`/themes` & `/app/carousels`)**:
  - Every single theme from `Bold Highlight`, `Reading Room`, `Editorial`, `Swiss Grid` to `Manga`, `Night Study`, `Cutting Mat`, `Morning Brew` — live slide editor, `+ Slide` / `Remove`, `1080×1350` (`4:5`) PNG export, and 1-click Calendar scheduling.
- **Full Creator App Dashboard (`/app/*` — 12 Modules)**:
  1. `✦ Create` — Full-page multi-format Composer Studio with live iPhone preview, AI Captions, `@collab` tagger, First Comment, Trial Reel toggle & Automation attachment.
  2. `▦ Scheduler` — Dynamic Month **and** 7-day Week views across Sept/Oct/Nov 2026 + status filters (`ALL`, `SCHEDULED`, `PUBLISHED`, `DRAFT`, `FAILED`, `TRIAL`) + iPhone Details modal + Graduate Trial Reel.
  3. `⊞ Grid Planner` — Drag-and-drop **and** Click-to-Swap (`⇄ Swap`) publish times, `1:1` / `4:5` / `3:4` crop switcher, `@collab` badges, `Load All` toggle, and 280-char colored Idea Tiles (`-> Draft` conversion).
  4. `❖ AI Carousels` — Prompt-to-deck generator across all 35 themes.
  5. `⚡ Automations` — Interactive **Webhook & Follow-Gate Test Bench** (`Follows ON/OFF` + `Dry Run` vs `Live Trigger`) + `↻ Retrigger Comments`.
  6. `+ New Automation` — 3-Step (`Trigger` -> `Actions` -> `Follow-up`) builder with live `Post | Comment | DM` iPhone simulator.
  7. `≡ Comments` — Live Instagram comment moderation, manual Auto-DM + Public Reply trigger, and Spam hiding.
  8. `✉ DM Inbox` — Open/Closed/All + `Unread` / `★ Hot lead` / `Outreach` / `Snoozed` / `Archived`, 8 tags/thread, 24h Meta Window enforcement + `Simulate User Reply`, and `✦ AI Draft`.
  9. `↗ Analytics` — `7d / 30d / 90d` reach curves, save rates, and Trial Reel graduation leaderboard.
  10. `◈ Claude MCP (58)` — All **58 JSON-RPC 2.0 MCP tools** live on `POST /mcp` across 7 categories.
  11. `⚙ Billing & Settings` — Plan switcher, monthly quota meters, timezone/slots settings, and `↻ Reset All 4 Workspaces`.
  12. `◉ REA Evidence` — All 5 SHA-256 `rea@6.7.0` Evidence bundles + standalone HTML Obligation Ledger.

---

## 4. Local Commands

```bash
cd reeldrop
npm start          # Runs full platform + 58-tool MCP server on http://0.0.0.0:3080
npm run rea:verify # Regenerates all 5 SHA-256 REA v6.7.0 Evidence bundles
npm test           # Executes full 58-tool MCP + Vercel Serverless + Headless Chromium E2E suite
```
