# Velora Studio (`velora.so`)

**Velora Studio** is a full-stack Instagram publishing, visual grid planning, smart image cropping, 16-preset carousel design, Official Meta Graph/Messenger comment-to-DM automation, 3-pane CRM inbox, analytics, and **58-tool Model Context Protocol (MCP)** platform — built with zero external runtime dependencies and 1-click **Vercel** deployment readiness.

---

## Key Highlights & Capabilities

1. **Instant `With Data` / `Without Data` Global Mode Switcher**
   - Toggle anytime from the **top header bar** (on both the Landing Page and every `/app/*` Studio view) or from **Settings -> Data Mode & Backup**:
     - **`With Data` (`mode: "sample"`)**: Loads 4 realistic connected Instagram Creator/Brand workspaces (`@maya.studio`, `@arjun.fit`, `@koko.ceramics`, `@rohan.codes`), 13 high-resolution visual posts (`/media/post-01.svg`–`post-11.svg`) with live engagement metrics, scheduled calendar queues, active comment-to-DM rules, 3-pane CRM inbox threads, and analytics.
     - **`Without Data` (`mode: "empty"`)**: Resets the workspace into a **100% clean, freshly installed, unconnected state** (`@unconnected.account`, `ig_account_id: ""`, `0` posts, `0` workflows, `0` threads, `0` metrics) so you can inspect every empty/onboarding screen, see exact Meta OAuth connection prompts, and test creating your first post, carousel, workflow, or simulated DM from zero.

2. **Smart Media Upload, Aspect-Ratio & `<canvas>` Crop Studio (`/app/create`)**
   - Drag-and-drop or browse local `PNG`, `JPEG`, `WebP`, `MP4`, or `WebM` media with a real-time multi-stage progress bar (`Reading file -> Inspecting dimensions -> Saving high-res asset`).
   - **Automatic Landscape Protection (`Smart Fit`)**: Wide screenshots automatically activate `Smart Fit` with a blurred studio backdrop so zero text gets clipped on left/right edges.
   - **Interactive `<canvas>` Crop Studio Modal**: Switch live between `4:5 Feed (1080x1350)`, `9:16 Reel (1080x1920)`, `1:1 Square`, and `1.91:1 Wide`, choose `Smart Fit` (`Blurred Glass`, `Pearl White`, `Warm Stone`, `Deep Slate`) or `Fill & Crop`, fine-tune `Zoom` and `Pan X / Y`, and export crisp high-resolution PNGs directly into SQLite storage.

3. **AI Content Co-Pilot, Caption Rewriter & Visual Card Generator**
   - **Full AI Post Pack (`POST /api/ai/post-pack`)**: Generates 4 scored viral hooks (click any hook to swap your opening line), structured caption copy, 3-tier account-safe hashtags, auto first comment, and recommended publish time.
   - **Inline AI Caption Rewriter (`POST /api/ai/rewrite`)**: One-click modes for *Make Punchier*, *Sharper Opening Hook*, *Trim <125 Chars*, *+ Add DM Keyword CTA*, and *Founder Story Arc*.
   - **AI Cover Card Generator**: Renders custom `1080x1350` editorial visual covers directly on `<canvas>`.
   - **Plain-English AI Workflow Builder (`POST /api/ai/workflow-from-prompt`)** & **Multi-Tone Inbox AI (`POST /api/inbox/ai-suggest`)**.

4. **Visual Profile Grid with Live Inline & Hover Statistics (`/app/grid`)**
   - Switch live between `4:5`, `3:4`, and `1:1` profile crops, inspect real cover artwork, toggle **Live Stats On/Off** (inline Views & Saves + hover Likes, Replies & Save Rate `%`), drag tiles to swap scheduled order, pin colored planning notes, and inspect full post KPIs in the side panel.

5. **16-Preset Carousel Studio (`/app/carousels`), Drag & Drop Calendar (`/app/calendar`), Collapsible DM Workflows (`/app/automations`), 3-Pane CRM Inbox (`/app/inbox`) & 58-Tool MCP Server (`POST /mcp`)**

---

## How Screens Behave When Platform Is NOT Connected (`Without Data` Mode)

Click **`Without Data`** in the top navigation bar at any time to verify every screen in its clean, unconnected state:

| Route | Screen | What Displays When Unconnected (`Without Data`) | Available Actions Without Leaving the Screen |
| :--- | :--- | :--- | :--- |
| `/app/overview` | **Workspace Overview** | Persistent **Instagram Account Not Connected** banner, honest `0` KPI cards (`0 Views`, `0 Scheduled`, `0 Automated DMs`, `0 Unread`), interactive **4-Step Studio Setup Checklist**, and clean empty queue/workflow/inbox cards. | Click **Connect Instagram OAuth**, **Schedule First Post**, or **Load Sample Data**. |
| `/app/create` | **Create Post** | Clean blank composer with empty caption/tag fields, **No Media Selected Yet** placeholder inside the light iOS previewer, and active upload/crop/AI tools. | Upload any photo/MP4, click **Generate AI Cover Image**, **Generate Full Post**, or schedule locally to SQLite. |
| `/app/calendar` | **Publishing Calendar** | Clean October 2026 drag-and-drop grid (`0` scheduled pills) and empty state row in Queue List view. | Click `+` on any date cell to open Create Post pre-filled for that slot. |
| `/app/grid` | **Profile Grid** | `@unconnected.account · 0 followers · 0 Grid Tiles` profile shell with **6 dashed wireframe feed placeholders (`SLOT 01`–`SLOT 06`)** and a **No Grid Posts Synced Yet** side card. | Pin visual note tiles, create your first post, or connect Meta OAuth. |
| `/app/carousels` | **Carousel Studio** | Active **AI Carousel Deck Generator** bar above a **No Saved Carousel Decks Yet** empty stage card. | Enter any topic and click **Generate AI Deck** to build your first `1080x1350` deck. |
| `/app/automations` | **DM Workflows** | Active **Plain-English AI Workflow Builder** above a **No DM Workflows Configured Yet** empty state explaining required `comments` & `messages` webhooks. | Generate a workflow from plain English and test it live in the right-hand Messenger simulator. |
| `/app/inbox` | **Unified Inbox** | Clean empty thread rail + **Unified Inbox is Empty** center panel explaining `/api/webhooks/instagram` setup and 24-hour Meta reply windows. | Click **Simulate First Incoming DM** to spawn a live test conversation from zero, or connect Meta OAuth. |
| `/app/analytics` | **Analytics** | Honest zero baseline (`0` Views, `0` Reach, `0.00%` Save Rate, `0.0%` CTR), flat baseline trend chart, and clean empty table state. | Publish any queued post via **Run Queue Worker** to populate live metrics immediately. |
| `/app/settings` | **Workspace Settings** | Dedicated **Meta API & OAuth** tab showing `Not Connected` badge, copyable OAuth Redirect URI & Webhook Callback URL, required scopes, and `.env` snippet. | Link/unlink an Instagram handle, switch `With Data` / `Without Data`, test MCP tools, or export JSON. |

---

## Step-by-Step Guide: Connecting Official Meta / Instagram APIs in Production

Velora is engineered around **Official Meta Graph & Instagram Messenger OAuth** (never scraping or requesting Instagram passwords). To connect real live Instagram accounts:

### Step 1: Create a Meta Business App
1. Sign in at **[developers.facebook.com/apps](https://developers.facebook.com/apps/)** and click **Create App** -> choose **Other** -> **Business**.
2. Add the **Instagram** product (**Instagram API with Instagram Login**).
3. Ensure your Instagram account is switched to a **Creator** or **Business** profile (free in the Instagram mobile app under *Settings -> Account type and tools*).

### Step 2: Configure OAuth Redirect URI & Permissions
Inside **Instagram -> API setup with Instagram login**:
- Copy your **Instagram App ID** (`META_APP_ID`) and **Instagram App Secret** (`META_APP_SECRET`).
- Add your **OAuth Redirect URI**:
  - Local development: `http://localhost:3080/api/meta/oauth/callback`
  - Production (Vercel): `https://<your-vercel-domain>/api/meta/oauth/callback`
- Request/enable these exact Official Scopes:
  - `instagram_business_basic` — Reads profile handle, avatar, bio, follower count, and recent grid media.
  - `instagram_business_content_publish` — Publishes scheduled Reels, Photos, Stories, and Carousels (`<= 50` API containers per 24h).
  - `instagram_business_manage_comments` — Receives real-time post/Reel comment webhooks and posts rotated public replies.
  - `instagram_business_manage_messages` — Sends automated Messenger button cards, verifies follower status, and replies inside the 24h DM window.
  - `instagram_manage_insights` — Syncs post views, unique reach, saves, and Trial Reel watch metrics.

### Step 3: Subscribe Webhooks for Real-Time Comments & DMs
Inside **Instagram -> Configure Webhooks**:
- **Callback URL**: `https://<your-vercel-domain>/api/webhooks/instagram`
- **Verify Token**: Any strong secret matching `META_WEBHOOK_VERIFY_TOKEN` in your `.env` / Vercel Environment Variables.
- Subscribe to fields: **`comments`**, **`messages`**, and **`messaging_postbacks`**.

### Step 4: Set Environment Variables
Copy `.env.example` to `.env` locally (or add inside **Vercel Project Settings -> Environment Variables**):

```env
PORT=3080
META_APP_ID=your_meta_app_id_here
META_APP_SECRET=your_meta_app_secret_here
META_WEBHOOK_VERIFY_TOKEN=velora_webhook_secret_2026
META_OAUTH_REDIRECT_URI=https://your-project.vercel.app/api/meta/oauth/callback
```

> **Tip**: Even before obtaining Meta App Review approval, you can click **Connect Instagram OAuth** inside Velora (or `Settings -> Meta API & OAuth`) to link test handles, or toggle **`With Data` / `Without Data`** anytime.

---

## Local Quick Start & Automated E2E Verification

**Prerequisites**: Node.js `22.x` recommended (`node:sqlite` built-in WAL engine; Node `18.18+` / `20.x` also supported automatically). Zero external `npm install` packages required.

```bash
# 1. Start the full-stack Velora server (http://localhost:3080)
npm start

# 2. Run the full end-to-end verification suite (in a second terminal)
npm test
```

`npm test` (`reeldrop/scripts/verify-e2e.mjs`) automatically verifies:
- Self-hosted Variable WOFF2 typography (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`)
- All 11 high-resolution Profile Grid & Studio visual assets (`/media/post-01.svg`–`post-11.svg`)
- PBKDF2-SHA256 user registration & session authentication
- Binary image upload, SQLite WAL persistence, calendar drag-rescheduling, queue worker auto-publishing & CSV export
- AI Post Pack generator, Caption Rewriter, and Plain-English Workflow Builder
- Complete **`Without Data` (`empty`) -> Meta OAuth Connect -> Simulated First DM -> Disconnect -> `With Data` (`sample`)** lifecycle
- Full **58-tool JSON-RPC 2.0 MCP server** (`POST /mcp`) + optional headless Chromium desktop/mobile zero-overflow checks

---

## 1-Click Deployment on Vercel

This repository includes zero-configuration Vercel routing at **both** the repository root (`vercel.json` + `api/index.js`) and `reeldrop/` (`reeldrop/vercel.json` + `reeldrop/api/index.js`):

1. Push this repository (`main` branch) to GitHub.
2. Open **[vercel.com/new](https://vercel.com/new)** and import `Nir-Bhay/TO-DO---my-first-project`.
3. Keep default settings (**Framework Preset**: *Other*, **Root Directory**: `./`) and click **Deploy**.
4. Static assets (`reeldrop/web/*`), SPA routes (`/app/*`), REST APIs (`/api/*`), and the MCP server (`/mcp`) work immediately with seamless `/tmp` SQLite + client snapshot persistence.

---

## Connecting Claude Desktop or Cursor via MCP (58 Live Tools)

Add your local or Vercel URL to `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "velora": {
      "url": "http://localhost:3080/mcp",
      "transport": "streamable-http"
    }
  }
}
```

---

## Repository Structure

```text
.
├── api/index.js                        # Root Vercel Serverless Function entrypoint
├── vercel.json                         # Root zero-config Vercel routing & SPA rewrites
├── package.json                        # Root start & E2E verification scripts
├── .env.example                        # Documented Meta OAuth & Webhook environment variables
└── reeldrop/
    ├── server/
    │   ├── index.mjs                   # HTTP server + SHA-1 static asset cache-busting tagger
    │   ├── db.mjs                      # Built-in node:sqlite WAL engine + Sample/Empty mode state manager
    │   ├── seedData.mjs                # 4 demo workspaces (With Data) + Clean Unconnected state (Without Data)
    │   ├── aiEngine.mjs                # AI Post Pack, Rewriter, Carousel, Workflow & Multi-Tone DM engine
    │   ├── automationEngine.mjs        # Keyword matching, public reply rotation, follow gate & sweeps
    │   ├── mcpServer.mjs               # 58-tool JSON-RPC 2.0 Model Context Protocol server
    │   └── appHandler.mjs              # Full REST API & state mode / Meta OAuth handlers
    ├── web/
    │   ├── index.html                  # Studio & Marketing single-page shell
    │   ├── styles.css                  # Design tokens, light device previewer, equal-height & responsive grid
    │   ├── fonts/                      # Self-hosted Variable WOFF2 fonts (offline & CDN-independent)
    │   ├── media/                      # 11 crisp 1080x1350 visual artworks (post-01.svg ... post-11.svg)
    │   └── js/
    │       ├── api.js                  # State sync, upload progress, <canvas> cropper & AI cover renderer
    │       ├── marketingViews.js       # Zero-fluctuation Hero showcase, light chat previewer & subpages
    │       ├── appViews.js             # Overview, Create Post + Crop Studio, Calendar, Grid + Stats, Carousels
    │       ├── automationAndInboxViews.js # Collapsible DM Workflows, 3-Pane CRM Inbox, Analytics & Settings
    │       ├── freeToolsViews.js       # 12 interactive browser-native creator calculators
    │       └── main.js                 # Persistent zero-jank router, data mode switcher & event bindings
    └── scripts/
        └── verify-e2e.mjs              # Comprehensive automated E2E backend + UI + MCP test suite
```
