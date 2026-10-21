import { store, notify, toast, apiRequest, escapeHtml } from "./api.js";

let heroTab = "scheduler";
let openFaqIdx = 0;
let themeCategory = "All";
let themeNoPhotoOnly = false;
let themeSearch = "";
let advisorQ = { automations: true, multiAccount: false, aiCarousels: true };

const NICHES = [
  "Creator Workflow", "Design & Typography", "Tech & AI", "Fitness & Wellness",
  "Food & Culinary", "Fashion & Styling", "Photography", "Travel & Visual Diaries",
  "Indie SaaS & Founders", "Education & Study", "Real Estate", "E-Commerce Brands", "Agencies"
];

const FAQS = [
  ["Can Instagram ban or shadowban my account for using ReelDrop?", "Never. ReelDrop is built 100% on the Official Meta Instagram Graph API & Messenger Platform Webhooks via official OAuth — zero password sharing, zero headless browser bots, and strict enforcement of Meta's 24-hour messaging window."],
  ["How does 'Ask for follow' work inside Auto-DMs?", "When a non-follower comments your keyword, ReelDrop sends a friendly prompt with an 'I followed ✓' postback button. When tapped, ReelDrop verifies follower status live via the Official Graph API before delivering your primary link buttons."],
  ["What comes free forever on the Starter ($0) plan?", "Unlimited Reel, Carousel, Post & Story scheduling, Visual Calendar, Visual Grid Planner, 3 Trial Reels/month, 3 AI Caption generations/month, up to 5 active Comment-to-DM automations, Read-Only DM Inbox, and Analytics — no card needed."],
  ["How do Trial Reels help me grow faster?", "Trial Reels show your new Reel to cold non-followers first so you can test hooks without fatiguing followers. Once watch time surges, graduate it to your main profile feed in one click."],
  ["How does the Claude & Cursor MCP Server work?", "Add ReelDrop's Streamable HTTP MCP endpoint (`/mcp`) with one command. Claude Code, Claude Desktop, and Cursor immediately gain all 58 tools to batch-schedule posts, generate carousels, dry-run DM automations, reply to comments, and inspect analytics."],
  ["Do all 35 Carousel Themes export crisp 4:5 cards?", "Yes — every theme exports high-resolution 1080×1350 (4:5 portrait) cards with centered 3:4 profile grid safe zones so your profile feed stays visually cohesive."],
  ["Can I switch between USD and INR pricing or Founding Lifetime?", "Yes! Switch seamlessly between USD ($0 / $9.99 / $29) and INR (₹0 / ₹449 / ₹2,699), or lock in the one-time $249 Founding Lifetime deal."],
  ["How does the Creator Referral program work?", "Every workspace receives a unique referral link (e.g. `/r/MAYA-FREE`). Every friend who upgrades gets month 1 free and credits you 1 free month — stackable up to 12 free months per year."]
];

function renderPricingBlock() {
  const cur = store.currency;
  const yearly = store.billingCycle === "yearly";
  const recPlan = advisorQ.multiAccount || advisorQ.aiCarousels ? "creator" : advisorQ.automations ? "influencer" : "starter";

  const cards = [
    {
      id: "starter",
      name: "Starter",
      price: cur === "usd" ? "$0" : "₹0",
      sub: "Free forever · No credit card",
      perks: [
        "1 Instagram account · 1 Workspace",
        "Unlimited Reel, Carousel & Story scheduling",
        "Visual Calendar & 3:4 Grid Planner",
        "Up to 5 active Comment-to-DM automations",
        "3 Trial Reels/mo · 3 AI Captions/mo",
        "Read-only DM Inbox & Core Analytics"
      ]
    },
    {
      id: "influencer",
      name: "Influencer",
      price: cur === "usd" ? (yearly ? "$6.58/mo" : "$9.99/mo") : (yearly ? "₹416/mo" : "₹449/mo"),
      sub: yearly ? (cur === "usd" ? "Billed $79/year" : "Billed ₹4,999/year") : "Billed monthly",
      perks: [
        "Unlimited active Auto-DMs (zero branding footer)",
        "Ask-for-Follow verification gate ('I followed ✓')",
        "Story Reply, Incoming DM & Ice Breaker triggers",
        "Timed follow-up DMs (30m–24h) + Past-comment retrigger",
        "Full interactive DM Inbox replies + First-comment auto-post",
        "Unlimited Trial Reels + Full 58-Tool Claude MCP access"
      ]
    },
    {
      id: "creator",
      name: "Creator",
      price: cur === "usd" ? (yearly ? "$12.42/mo" : "$29/mo") : (yearly ? "₹1,250/mo" : "₹2,699/mo"),
      sub: yearly ? (cur === "usd" ? "Founding Annual $149/yr" : "Founding Annual ₹14,999/yr") : "Most popular studio tier",
      perks: [
        "Up to 5 Instagram accounts & 5 Workspaces",
        "Unlimited team members & client approvals",
        "All 35 AI Carousel Themes + 100 AI slides/mo",
        "Unlimited AI Captions, Hooks & Hashtag safety scans",
        "DM Reply by AI (up to 2,000 contextual replies/mo)",
        "Full 58-Tool Streamable HTTP Claude & Cursor MCP"
      ]
    }
  ];

  return `
    <section id="pricing-sec">
      <div style="text-align:center;margin-bottom:24px">
        <span class="kicker">TRANSPARENT CREATOR PRICING</span>
        <h2 class="editorial-title" style="font-size:44px">Start free. Scale when comments blow up.</h2>
        <div style="display:flex;justify-content:center;gap:10px;margin-top:16px;flex-wrap:wrap">
          <div class="mode-switch">
            <button data-cycle="monthly" class="${!yearly ? "active" : ""}">Monthly</button>
            <button data-cycle="yearly" class="${yearly ? "active" : ""}">Yearly (Save 48%)</button>
          </div>
          <div class="mode-switch">
            <button data-cur="usd" class="${cur === "usd" ? "active" : ""}">USD ($)</button>
            <button data-cur="inr" class="${cur === "inr" ? "active" : ""}">INR (₹)</button>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:22px;background:var(--bg-subtle);display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap">
        <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:13px;font-weight:600">
          <label style="cursor:pointer"><input type="checkbox" data-adv="automations" ${advisorQ.automations ? "checked" : ""} /> Need Follow Gate &amp; Story DMs</label>
          <label style="cursor:pointer"><input type="checkbox" data-adv="aiCarousels" ${advisorQ.aiCarousels ? "checked" : ""} /> Need 35 Carousel Themes &amp; AI DMs</label>
          <label style="cursor:pointer"><input type="checkbox" data-adv="multiAccount" ${advisorQ.multiAccount ? "checked" : ""} /> Manage 2–5 IG Accounts</label>
        </div>
        <span class="pill-badge">Recommended for you: ${recPlan.toUpperCase()}</span>
      </div>

      <div class="grid-3">
        ${cards.map((c) => `
          <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;border:${c.id === recPlan ? "2px solid var(--accent)" : "1px solid var(--border)"}">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <h3 style="margin:0;font-size:20px">${c.name}</h3>
                ${store.data.activeWorkspace.plan === c.id ? `<span class="pill-badge">ACTIVE</span>` : ""}
              </div>
              <div class="stat-big" style="font-size:36px;color:${c.id === recPlan ? "var(--accent)" : "var(--text-main)"}">${c.price}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">${c.sub}</div>
              <ul style="padding-left:18px;margin:0 0 20px;font-size:13px;display:flex;flex-direction:column;gap:7px">
                ${c.perks.map((p) => `<li>${escapeHtml(p)}</li>`).join("")}
              </ul>
            </div>
            <button class="btn ${c.id === recPlan ? "btn-accent" : "btn-primary"}" style="width:100%" data-select-plan="${c.id}">
              ${store.data.activeWorkspace.plan === c.id ? `Current Workspace Plan (${c.name})` : `Activate ${c.name} on Workspace ->`}
            </button>
          </div>
        `).join("")}
      </div>

      <div class="card" style="margin-top:20px;background:#141418;color:#FAFAFA;display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap">
        <div>
          <span class="kicker" style="color:#FDBA74">LIMITED FOUNDING DEAL · ONE-TIME PAYMENT</span>
          <h3 style="margin:6px 0;font-size:24px;font-family:Georgia,serif;font-style:italic">Founding Lifetime Deal — ${cur === "usd" ? "$249 once" : "₹20,999 once"}, own Creator forever</h3>
          <p style="margin:0;font-size:13px;color:#A1A1AA">5 Instagram accounts, all 35 Carousel Themes, unlimited Auto-DMs, 2,000 AI DMs/mo &amp; all 58 Claude MCP tools with zero recurring subscription.</p>
        </div>
        <button class="btn btn-accent btn-lg" data-select-plan="lifetime">Unlock Founding Lifetime -></button>
      </div>
    </section>
  `;
}

export function renderMarketingPage() {
  const page = store.sitePage;
  const m = store.data.metrics;

  if (page === "themes") {
    const categories = ["All", "Editorial", "Bold", "Dark", "Minimal", "Playful", "Photo"];
    const filtered = store.data.themes.filter((t) => {
      if (themeCategory !== "All" && t.category !== themeCategory) return false;
      if (themeNoPhotoOnly && !String(t.photoRequirement).toLowerCase().includes("no photo")) return false;
      if (themeSearch && !`${t.name} ${t.desc} ${t.category}`.toLowerCase().includes(themeSearch.toLowerCase())) return false;
      return true;
    });

    return `
      <div class="marketing-container">
        <div class="page-head">
          <div>
            <span class="kicker">35 CURATED CAROUSEL DESIGN SYSTEMS</span>
            <h1 class="editorial-title" style="font-size:44px">Carousel Themes Catalog</h1>
            <p style="color:var(--text-muted);margin:6px 0 0">Pick any theme below to launch it directly inside the interactive AI Carousel Studio.</p>
          </div>
          <button class="btn btn-accent" id="btn-theme-surprise">✦ Surprise Me</button>
        </div>

        <div class="card" style="margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${categories.map((c) => `<button class="btn btn-sm ${themeCategory === c ? "btn-accent" : ""}" data-theme-cat="${c}">${c}</button>`).join("")}
          </div>
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <label style="font-size:12.5px;font-weight:700;cursor:pointer">
              <input type="checkbox" id="chk-no-photo" ${themeNoPhotoOnly ? "checked" : ""} /> No photos needed only
            </label>
            <input class="input" id="inp-theme-search" style="width:210px" placeholder="Search 35 themes…" value="${escapeHtml(themeSearch)}" />
          </div>
        </div>

        <div class="grid-3">
          ${filtered.map((t) => `
            <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
              <div>
                <div style="aspect-ratio:4/3;border-radius:12px;padding:18px;background:${t.bg};color:${t.fg};border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span class="mono" style="font-size:10px;padding:3px 8px;border-radius:999px;background:${t.pillBg};color:${t.fg}">${escapeHtml(t.category)}</span>
                    ${t.isNew ? `<span class="mono" style="font-size:10px;font-weight:800;color:${t.accent}">NEW</span>` : `<span class="mono" style="font-size:10px;opacity:0.7">1/5</span>`}
                  </div>
                  <div>
                    <div style="font-family:${t.fontStyle === "serif" || t.fontStyle === "editorial" ? "'Fraunces', serif" : "'Inter', sans-serif"};font-size:21px;font-weight:800;line-height:1.15;margin-bottom:6px">
                      ${escapeHtml(t.name)}
                    </div>
                    <div style="height:4px;width:54px;border-radius:3px;background:${t.accent}"></div>
                  </div>
                  <div style="display:flex;justify-content:space-between;font-size:11px;opacity:0.8">
                    <span>${escapeHtml(t.photoRequirement)}</span>
                    <span>Swipe &gt;</span>
                  </div>
                </div>
                <p style="font-size:12.5px;color:var(--text-muted);margin:12px 0 0">${escapeHtml(t.desc)}</p>
              </div>
              <button class="btn btn-primary btn-sm" style="width:100%" data-use-theme="${t.id}">Generate with "${escapeHtml(t.name)}" -></button>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (page === "pricing") return `<div class="marketing-container">${renderPricingBlock()}</div>`;

  if (page === "campaigns") {
    return `
      <div class="marketing-container">
        <div class="hero-section">
          <span class="pill-badge">PAID CREATOR CAMPAIGNS</span>
          <h1 class="hero-headline">Post Reels about ReelDrop. <em>Get paid per view.</em></h1>
          <p class="hero-sub">Film genuine workflow breakdowns showing your Scheduler, 35 Carousel Themes, or Auto-DM results — earn performance payouts per 1,000 verified views.</p>
        </div>
        <div class="card" style="max-width:620px;margin:0 auto">
          <h3 style="margin-top:0">Apply for Q4 Creator Briefs</h3>
          <form id="campaign-form">
            <div class="field"><label>Instagram Handle *</label><input class="input" name="igHandle" required placeholder="@maya.creates" /></div>
            <div class="field"><label>Creator Email *</label><input class="input" type="email" name="email" required placeholder="maya@studio.io" /></div>
            <div class="field"><label>Median 30-Day Reel Views</label><input class="input" type="number" name="avgViews" value="25000" /></div>
            <div class="field"><label>Primary Niche</label><input class="input" name="niche" value="Creator Workflow & Design" /></div>
            <button class="btn btn-primary btn-lg" type="submit" style="width:100%">Submit Creator Campaign Application -></button>
          </form>
        </div>
      </div>
    `;
  }

  if (page === "docs") {
    return `
      <div class="marketing-container">
        <span class="kicker">OFFICIAL API ARCHITECTURE &amp; SAFETY DOCS</span>
        <h1 class="editorial-title" style="font-size:44px">Account Safety, Graph API &amp; DM Limits</h1>
        <div class="grid-3" style="margin-top:24px">
          <div class="card">
            <h3>1. Official Meta Graph &amp; Messenger Webhooks</h3>
            <p style="color:var(--text-muted)">ReelDrop never asks for your Instagram password or runs headless browsers. Publishing uses <code>/{ig-user-id}/media</code> &amp; <code>/media_publish</code>; DM automations subscribe to official <code>comments</code>, <code>messages</code>, and <code>messaging_postbacks</code> webhooks.</p>
          </div>
          <div class="card">
            <h3>2. DM Safety &amp; 24h Window Rules</h3>
            <p style="color:var(--text-muted)">Max 3 link buttons per DM (labels &le;20 chars, <code>https://</code> required). Past-comment retrigger caps at 50 comments/post across 5 posts. Standard Inbox replies enforce Meta's 24-hour window from the user's last interaction.</p>
          </div>
          <div class="card">
            <h3>3. Streamable HTTP MCP Server (58 Tools)</h3>
            <p style="color:var(--text-muted)">Connect Claude Desktop, Claude Code, Cursor, or Windsurf directly to <code>/mcp</code> to run all 58 tools across scheduling, captions, carousels, grid, comments, automations, and analytics.</p>
            <button class="btn btn-primary btn-sm" data-goto-app="mcp">Open Live 58-Tool MCP Console -></button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="marketing-container">
      <section class="hero-section">
        <span class="pill-badge">✓ Meta Tech Provider · Official Instagram API</span>
        <h1 class="hero-headline">ReelDrop: the AI Instagram growth tool. <em>Official API, no bots.</em></h1>
        <p class="hero-sub">Schedule Reels and Stories, design multi-slide AI Carousels across 35 editorial themes, plan your 3:4 profile grid, and convert every comment into an instant DM link — all from one clean workspace.</p>
        <div class="hero-ctas">
          <button class="btn btn-primary btn-lg" data-goto-app="scheduler">Open Live Workspace (@${escapeHtml(store.data.activeWorkspace.ig_handle)}) -></button>
          <button class="btn btn-lg" id="btn-hero-create-ws">+ Create Free Workspace</button>
          <button class="btn btn-lg" data-goto-app="rea-evidence">◉ Inspect REA Evidence</button>
        </div>
      </section>

      <div class="card" style="padding:18px;border:1px solid var(--border-strong)">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--border);margin-bottom:16px">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${[
              ["scheduler", "▦ Visual Scheduler"],
              ["autadm", "⚡ Comment -> Auto DM"],
              ["carousels", "❖ 35 Carousel Themes"],
              ["mcp", "◈ Claude MCP (58 Tools)"]
            ].map(([k, label]) => `
              <button class="btn btn-sm ${heroTab === k ? "btn-accent" : ""}" data-hero-tab="${k}">${label}</button>
            `).join("")}
          </div>
          <span class="mono" style="font-size:11px;color:var(--text-muted)">LIVE REELDROP ENGINE · VERCEL READY + 58 MCP TOOLS</span>
        </div>

        ${heroTab === "scheduler" ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;align-items:center">
            <div>
              <span class="kicker">PLAN · SCHEDULE · SHIP</span>
              <h3 class="editorial-title" style="font-size:30px">Batch a full month in one sitting</h3>
              <p style="color:var(--text-muted)">Color-coded calendar for Reels, Carousels, Stories &amp; Posts with Trial Reel non-follower testing, First-Comment auto-posting, and attached DM automations.</p>
              <button class="btn btn-primary" data-goto-app="scheduler">Launch Interactive Scheduler -></button>
            </div>
            <div style="background:var(--bg-subtle);padding:14px;border-radius:14px;display:flex;flex-direction:column;gap:8px">
              ${store.data.posts.slice(0, 4).map((p) => `
                <div class="post-chip type-${p.media_type}" style="padding:9px 12px" data-goto-app="scheduler">
                  <div class="chip-row">
                    <span class="mono" style="font-size:10px">${p.media_type} · ${p.status}</span>
                    <span class="mono" style="font-size:10px">${new Date(p.scheduled_at).toLocaleDateString()}</span>
                  </div>
                  <div style="font-size:13px;font-weight:700">${escapeHtml(p.title)}</div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : heroTab === "autadm" ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;align-items:center">
            <div>
              <span class="kicker">COMMENT · STORY · INCOMING DM</span>
              <h3 class="editorial-title" style="font-size:30px">Turn every "LINK" comment into clicks</h3>
              <p style="color:var(--text-muted)">Rotating natural public replies, follower-verification gate ("I followed ✓"), up to 3 HTTPS link buttons, timed follow-ups, and past-comment sweeps.</p>
              <button class="btn btn-primary" data-goto-app="automation-builder">Open 3-Step Automation Builder -></button>
            </div>
            <div style="background:#121215;color:#FAFAFA;padding:16px;border-radius:18px;display:flex;flex-direction:column;gap:8px;font-size:13px">
              <div style="align-self:flex-start;background:#26262C;padding:8px 12px;border-radius:14px">Commented <strong>REPO</strong> on your Reel ★</div>
              <div style="align-self:flex-end;background:#D94826;padding:8px 12px;border-radius:14px">Hit Follow first so Meta lets me send links, then tap below!</div>
              <div style="align-self:flex-start;background:#26262C;padding:8px 12px;border-radius:14px">I followed ✓</div>
              <div style="align-self:flex-end;background:#27272F;border:1px solid #3F3F46;padding:10px 12px;border-radius:14px">
                Amazing! Here are all 7 open-source creator repos:
                <div style="margin-top:8px;background:#FAFAFA;color:#111;text-align:center;padding:6px;border-radius:8px;font-weight:700">7 GitHub Repos Pack ↗</div>
              </div>
            </div>
          </div>
        ` : heroTab === "carousels" ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;align-items:center">
            <div>
              <span class="kicker">35 CURATED THEMES</span>
              <h3 class="editorial-title" style="font-size:30px">Prompt -> 10 styled slides in seconds</h3>
              <p style="color:var(--text-muted)">From <em>Bold Highlight</em> and <em>Reading Room</em> to <em>Manga</em>, <em>Night Study</em>, and <em>Swiss Grid</em> — live slide-by-slide copy &amp; photo editor included.</p>
              <div style="display:flex;gap:8px">
                <button class="btn btn-primary" data-goto-app="carousels">Open Carousel Studio -></button>
                <button class="btn" data-site-nav="themes">Browse All 35 Themes</button>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
              ${store.data.themes.slice(0, 3).map((t) => `
                <div style="aspect-ratio:4/5;background:${t.bg};color:${t.fg};padding:12px;border-radius:12px;border:1px solid var(--border);display:flex;flex-direction:column;justify-content:space-between">
                  <span class="mono" style="font-size:9px">${t.category}</span>
                  <strong style="font-family:'Fraunces',serif;font-size:15px">${t.name}</strong>
                  <span style="font-size:10px;color:${t.accent}">Swipe &gt;</span>
                </div>
              `).join("")}
            </div>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;align-items:center">
            <div>
              <span class="kicker">MODEL CONTEXT PROTOCOL · /MCP</span>
              <h3 class="editorial-title" style="font-size:30px">Run your Instagram directly from Claude</h3>
              <p style="color:var(--text-muted)">All 58 real JSON-RPC MCP tools live on <code>POST /mcp</code> — schedule Reels in bulk, generate carousels, dry-run DM automations, reply to comments, and query analytics.</p>
              <button class="btn btn-primary" data-goto-app="mcp">Try Interactive 58-Tool MCP Console -></button>
            </div>
            <pre style="margin:0;background:#111114;color:#A7F3D0;padding:14px;border-radius:14px;font-size:12px;overflow-x:auto">$ claude mcp add --transport http reeldrop ${escapeHtml(location.origin)}/mcp

> "Schedule 3 Trial Reels for next week and attach my REPO DM automation"
✓ generate_reel_captions (4 variants)
✓ schedule_reels_bulk (3 Reels queued)
✓ dry_run_automation (keyword: REPO -> verified)</pre>
          </div>
        `}
      </div>

      <div class="marquee-wrap">
        <div class="marquee-track">
          ${[...NICHES, ...NICHES].map((n) => `<span class="marquee-item">${escapeHtml(n)}</span>`).join("")}
        </div>
      </div>

      <section style="margin-bottom:54px">
        <div style="text-align:center;margin-bottom:20px">
          <span class="kicker">LIVE PLATFORM TELEMETRY</span>
          <p style="margin:4px 0 0;color:var(--text-muted)">Real-time workspace metrics — updates immediately as you schedule posts &amp; trigger DMs.</p>
        </div>
        <div class="grid-3">
          <div class="card">
            <span class="kicker">CREATORS SIGNED UP</span>
            <div class="stat-big">${m.creators_signed_up.toLocaleString()}</div>
            <p style="margin:0;font-size:12.5px;color:var(--text-muted)">Verified OAuth workspaces — zero passwords stored.</p>
          </div>
          <div class="card">
            <span class="kicker">DMS SENT AUTOMATICALLY</span>
            <div class="stat-big" style="color:var(--accent)">${m.dms_sent_automatically.toLocaleString()}</div>
            <p style="margin:0;font-size:12.5px;color:var(--text-muted)">"I followed ✓" -> "Amazing! Here are your links." via official Messenger API.</p>
          </div>
          <div class="card">
            <span class="kicker">REELS &amp; POSTS SCHEDULED</span>
            <div class="stat-big">${m.reels_scheduled.toLocaleString()}</div>
            <p style="margin:0;font-size:12.5px;color:var(--text-muted)">Auto-published on schedule across Reels, Carousels &amp; Stories.</p>
          </div>
        </div>
      </section>

      <section style="margin-bottom:56px">
        <div style="margin-bottom:22px">
          <span class="kicker">EVERYTHING IN ONE PLACE</span>
          <h2 class="editorial-title" style="font-size:40px">Nine tools replaced by one calm studio</h2>
        </div>
        <div class="grid-3">
          ${[
            ["Schedule and automate posting", "Queue Reels, Carousels, Stories & Trial Reels with auto first-comments.", "scheduler", "Open Scheduler"],
            ["Automatic carousels (35 themes)", "Turn any topic into 3–10 styled slides across Bold Highlight, Reading Room & Manga.", "carousels", "Open Carousels"],
            ["Create Studio & AI Captions", "Full-page multi-format composer with live iPhone preview, @collab & AI captions.", "create", "Open Create Studio"],
            ["Auto DM for growth engine", "Comment, Story reply & Incoming DM triggers with Follow Gate & timed follow-ups.", "automations", "Open Automations"],
            ["Visual Grid planner · NEW", "Drag or click tiles to swap publish times, switch 1:1 / 4:5 / 3:4 crop & drop idea notes.", "grid", "Plan Grid"],
            ["Instagram DM Inbox & Comments", "Unified 24h Meta window inbox + comment stream with Hot Lead ★ flags & AI drafts.", "inbox", "Open Inbox"],
            ["Performance & Trial Reel Analytics", "Track reach, average watch time, saves, follower velocity & Trial Reel graduation.", "analytics", "View Analytics"],
            ["Works with Claude (58 MCP Tools)", "Control scheduling, captions, carousels, grid, comments, automations & analytics in Claude.", "mcp", "Open MCP Console"],
            ["REA Reverse-Engineering Vault", "Inspect SHA-256 verified network captures, SQLite audits & Obligation Ledger.", "rea-evidence", "Inspect Evidence"]
          ].map(([title, desc, target, cta]) => `
            <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
              <div>
                <h3 style="margin:0 0 8px;font-size:17px">${title}</h3>
                <p style="margin:0;color:var(--text-muted);font-size:13px">${desc}</p>
              </div>
              <button class="btn btn-sm" style="align-self:flex-start" data-goto-app="${target}">${cta} -></button>
            </div>
          `).join("")}
        </div>
      </section>

      <section class="card" style="background:var(--accent-soft);border-color:rgba(217,72,38,0.28);margin-bottom:52px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap">
        <div>
          <span class="kicker" style="color:var(--accent)">CREATOR REFERRAL PROGRAM</span>
          <h3 class="editorial-title" style="font-size:30px">Give a free month. Get a free month.</h3>
          <p style="margin:6px 0 0;color:var(--text-muted)">Share your personal link — friends get month 1 free and you stack up to 12 free months per year (${store.data.activeWorkspace.referral_months_earned}/12 earned).</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <code style="padding:10px 14px;border-radius:10px;background:var(--bg-surface);border:1px solid var(--border);font-weight:700">${location.origin}/r/${escapeHtml(store.data.activeWorkspace.referral_code)}</code>
          <button class="btn btn-primary" id="btn-copy-referral">Copy Referral Link</button>
        </div>
      </section>

      <section style="margin-bottom:32px">
        <div class="page-head">
          <div>
            <span class="kicker">NO SIGNUP · RUNS IN BROWSER</span>
            <h2 class="editorial-title" style="font-size:38px">20 Free Instagram Creator Tools</h2>
          </div>
          <button class="btn btn-primary" data-site-nav="free-tools">Explore All 20 Free Tools -></button>
        </div>
        <div class="grid-4">
          ${store.data.freeTools.slice(0, 8).map((tool) => `
            <div class="card" style="padding:16px;cursor:pointer" data-open-tool="${tool.slug}">
              <span class="kicker" style="color:var(--accent)">${escapeHtml(tool.category)}</span>
              <h4 style="margin:6px 0;font-size:15px">${escapeHtml(tool.name)}</h4>
              <p style="margin:0;font-size:12px;color:var(--text-muted)">${escapeHtml(tool.desc)}</p>
            </div>
          `).join("")}
        </div>
      </section>

      ${renderPricingBlock()}

      <section style="margin-top:64px;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:28px;align-items:start">
        <div>
          <span class="kicker">FREQUENTLY ASKNA QUESTIONS</span>
          <h2 class="editorial-title" style="font-size:36px;margin-bottom:18px">Everything clear upfront</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${FAQS.map(([q, a], idx) => `
              <div class="card" style="padding:14px 18px;cursor:pointer" data-faq="${idx}">
                <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700">
                  <span>${escapeHtml(q)}</span>
                  <span>${openFaqIdx === idx ? "−" : "+"}</span>
                </div>
                ${openFaqIdx === idx ? `<p style="margin:10px 0 0;color:var(--text-muted);font-size:13px">${escapeHtml(a)}</p>` : ""}
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card" style="background:#0E0E11;color:#FAFAFA;padding:28px;border-radius:28px;text-align:center">
          <div class="mono" style="font-size:12px;color:#A1A1AA">Tue 21 Oct</div>
          <div style="font-size:52px;font-weight:800;letter-spacing:-0.03em;margin:2px 0 20px">9:18</div>
          <div style="display:flex;flex-direction:column;gap:10px;text-align:left">
            ${[
              ["maya.creates", "started following you · via Trial Reel", "now"],
              ["jordan.films", "replied 'I followed ✓' — 2 links delivered", "1m ago"],
              ["sofia.shots", "saved your Bold Highlight carousel", "4m ago"],
              ["arjun.codes", "commented REPO — public reply + DM sent", "9m ago"]
            ].map(([u, msg, t]) => `
              <div style="background:rgba(255,255,255,0.09);padding:11px 14px;border-radius:16px;display:flex;justify-content:space-between;align-items:center;gap:8px">
                <div>
                  <div style="font-weight:700;font-size:13px">@${u}</div>
                  <div style="font-size:12px;color:#D4D4D8">${msg}</div>
                </div>
                <span class="mono" style="font-size:10px;color:#A1A1AA">${t}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <footer style="margin-top:68px;padding-top:26px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;color:var(--text-muted);font-size:12.5px">
        <div>
          <strong style="color:var(--text-main)">ReelDrop</strong> · Reconstructed Full-Stack + Vercel Serverless Edition (10517933 Canada Ltd. architecture)
        </div>
        <div style="display:flex;gap:14px;flex-wrap:wrap">
          <a href="#" data-site-nav="home">Home</a>
          <a href="#" data-site-nav="themes">35 Themes</a>
          <a href="#" data-site-nav="free-tools">20 Free Tools</a>
          <a href="#" data-site-nav="pricing">Pricing</a>
          <a href="#" data-site-nav="campaigns">Campaigns</a>
          <a href="#" data-site-nav="docs">Safety &amp; Docs</a>
          <a href="#" data-goto-app="rea-evidence">REA Evidence Ledger</a>
        </div>
      </footer>
    </div>
  `;
}

export function bindMarketingEvents(root, openWorkspaceModal) {
  root.querySelectorAll("[data-hero-tab]").forEach((btn) => { btn.onclick = () => { heroTab = btn.dataset.heroTab; notify(); }; });
  root.querySelectorAll("[data-cycle]").forEach((btn) => { btn.onclick = () => { store.billingCycle = btn.dataset.cycle; notify(); }; });
  root.querySelectorAll("[data-cur]").forEach((btn) => { btn.onclick = () => { store.currency = btn.dataset.cur; notify(); }; });
  root.querySelectorAll("[data-adv]").forEach((chk) => { chk.onchange = () => { advisorQ[chk.dataset.adv] = chk.checked; notify(); }; });
  root.querySelectorAll("[data-select-plan]").forEach((btn) => {
    btn.onclick = async () => {
      const plan = btn.dataset.selectPlan;
      const bundle = await apiRequest("/api/workspaces/switch-plan", {
        method: "POST",
        body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, plan, billingCycle: store.billingCycle })
      });
      store.data = bundle;
      notify();
      toast(`Switched @${bundle.activeWorkspace.ig_handle} to ${bundle.activeWorkspace.planSpec.name} plan!`);
    };
  });
  root.querySelectorAll("[data-faq]").forEach((card) => {
    card.onclick = () => {
      const idx = Number(card.dataset.faq);
      openFaqIdx = openFaqIdx === idx ? -1 : idx;
      notify();
    };
  });
  root.querySelectorAll("[data-open-tool]").forEach((el) => {
    el.onclick = () => {
      store.selectedFreeTool = el.dataset.openTool;
      store.sitePage = "free-tools";
      notify();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
  root.querySelectorAll("[data-theme-cat]").forEach((btn) => { btn.onclick = () => { themeCategory = btn.dataset.themeCat; notify(); }; });
  const chkNoPhoto = root.querySelector("#chk-no-photo");
  if (chkNoPhoto) chkNoPhoto.onchange = () => { themeNoPhotoOnly = chkNoPhoto.checked; notify(); };
  const inpSearch = root.querySelector("#inp-theme-search");
  if (inpSearch) inpSearch.oninput = () => { themeSearch = inpSearch.value; notify(); };
  const btnSurprise = root.querySelector("#btn-theme-surprise");
  if (btnSurprise) {
    btnSurprise.onclick = () => {
      const list = store.data.themes;
      const pick = list[Math.floor(Math.random() * list.length)];
      toast(`Surprise pick: "${pick.name}" (${pick.category}) — opening Studio!`);
      store.mode = "app";
      store.appPage = "carousels";
      store.pendingThemeId = pick.id;
      notify();
    };
  }
  root.querySelectorAll("[data-use-theme]").forEach((btn) => {
    btn.onclick = () => {
      store.pendingThemeId = btn.dataset.useTheme;
      store.mode = "app";
      store.appPage = "carousels";
      notify();
    };
  });
  const btnRef = root.querySelector("#btn-copy-referral");
  if (btnRef) {
    btnRef.onclick = () => {
      navigator.clipboard?.writeText(`${location.origin}/r/${store.data.activeWorkspace.referral_code}`);
      toast("Copied referral link! Friends get month 1 free.");
    };
  }
  const btnHeroWs = root.querySelector("#btn-hero-create-ws");
  if (btnHeroWs) btnHeroWs.onclick = openWorkspaceModal;

  const cmpForm = root.querySelector("#campaign-form");
  if (cmpForm) {
    cmpForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(cmpForm);
      const res = await apiRequest("/api/campaigns/apply", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      toast(res.message);
      cmpForm.reset();
    };
  }
}
