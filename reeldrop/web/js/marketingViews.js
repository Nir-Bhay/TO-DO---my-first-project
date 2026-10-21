import { store, escHtml, fmtNum } from "./api.js";
import { icon, brandLogo } from "./icons.js";

export function renderMarketingNavbar(activePath = "/") {
  const isDark = store.theme === "dark";
  const user = store.currentUser;
  return `
    <header class="mkt-nav">
      <div class="mkt-nav-inner">
        <div style="display:flex;align-items:center;gap:28px;">
          <a href="/" data-link>${brandLogo(true)}</a>
          <nav class="mkt-links" aria-label="Main Navigation">
            <a href="/" data-link class="mkt-link ${activePath === "/" ? "is-active" : ""}">Product</a>
            <a href="/pricing" data-link class="mkt-link ${activePath === "/pricing" ? "is-active" : ""}">Pricing</a>
            <a href="/tools" data-link class="mkt-link ${activePath.startsWith("/tools") ? "is-active" : ""}">Creator Tools</a>
            <a href="/partners" data-link class="mkt-link ${activePath === "/partners" ? "is-active" : ""}">Partners</a>
            <a href="/docs" data-link class="mkt-link ${activePath.startsWith("/docs") ? "is-active" : ""}">Docs</a>
          </nav>
        </div>

        <div class="mkt-actions">
          <button class="icon-btn" id="btn-theme-toggle" title="Toggle color theme" aria-label="Toggle color theme">
            ${icon(isDark ? "sun" : "moon", 16)}
          </button>
          ${user ? `
            <a href="/app/overview" data-link class="btn btn-primary">
              Open Studio ${icon("arrowRight", 15)}
            </a>
          ` : `
            <a href="/sign-in" data-link class="btn btn-ghost mkt-hide-mobile">Sign in</a>
            <a href="/app/overview" data-link class="btn mkt-hide-mobile">Live Demo</a>
            <a href="/sign-up" data-link class="btn btn-primary">Get started free</a>
          `}
          <button class="icon-btn mkt-burger" id="btn-mkt-mobile-menu" aria-label="Menu">
            ${icon("menu", 18)}
          </button>
        </div>
      </div>
    </header>
  `;
}

export function renderMarketingFooter() {
  return `
    <footer class="mkt-footer">
      <div class="mkt-container">
        <div class="mkt-footer-grid">
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${brandLogo(true)}
            <p style="font-size:13px;color:var(--ink-muted);max-width:290px;line-height:1.55;">
              Publishing, visual profile planning, carousel layout tools, and official Instagram DM workflows for independent creators and lean studios.
            </p>
            <p style="font-size:12px;color:var(--ink-faint);margin-top:8px;">
              &copy; 2026 Velora Labs Inc. Built on Official Meta Graph &amp; Messenger APIs.
            </p>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
            <strong style="font-size:12px;color:var(--ink-primary);margin-bottom:2px;">Studio</strong>
            <a href="/app/overview" data-link style="color:var(--ink-secondary);">Workspace Overview</a>
            <a href="/app/create" data-link style="color:var(--ink-secondary);">Post Composer</a>
            <a href="/app/calendar" data-link style="color:var(--ink-secondary);">Publishing Calendar</a>
            <a href="/app/grid" data-link style="color:var(--ink-secondary);">Visual Grid Planner</a>
            <a href="/app/carousels" data-link style="color:var(--ink-secondary);">Carousel Designer</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
            <strong style="font-size:12px;color:var(--ink-primary);margin-bottom:2px;">Workflows</strong>
            <a href="/app/automations" data-link style="color:var(--ink-secondary);">Comment-to-DM Rules</a>
            <a href="/app/inbox" data-link style="color:var(--ink-secondary);">Unified Inbox &amp; CRM</a>
            <a href="/app/analytics" data-link style="color:var(--ink-secondary);">Performance Analytics</a>
            <a href="/app/settings" data-link style="color:var(--ink-secondary);">Claude &amp; Cursor MCP</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
            <strong style="font-size:12px;color:var(--ink-primary);margin-bottom:2px;">Resources</strong>
            <a href="/pricing" data-link style="color:var(--ink-secondary);">Plans &amp; Pricing</a>
            <a href="/tools" data-link style="color:var(--ink-secondary);">Free Creator Tools (12)</a>
            <a href="/partners" data-link style="color:var(--ink-secondary);">Creator Partner Program</a>
            <a href="/docs" data-link style="color:var(--ink-secondary);">API &amp; Safety Guide</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function renderHeroPreviewStage() {
  const tab = store.ui.heroTab || "workflow";
  if (tab === "calendar") {
    return `
      <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-weight:650;font-size:14px;">October Publishing Queue</div>
            <div style="font-size:12px;color:var(--ink-muted);">@maya.studio &middot; Asia/Calcutta</div>
          </div>
          <span class="badge badge-success"><span class="dot"></span>Auto-Publisher Active</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${[
            ["Today · 20:30", "REEL", "The 60-30-10 Color Rule in Dark Mode UI", "Scheduled"],
            ["Tomorrow · 09:30", "CAROUSEL", "8 Typography Rules I Wish I Knew Earlier", "Scheduled"],
            ["Fri · 14:00", "REEL", "Behind the Scenes: 45-Minute Weekly Content Batch", "Trial Reel"]
          ].map(([time, type, title, stateLabel]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;border-radius:9px;border:1px solid var(--border);background:var(--bg-page);">
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">
                  <span class="badge" style="height:19px;font-size:10.5px;">${type}</span>
                  <span class="tabular" style="font-size:11.5px;color:var(--ink-muted);">${time}</span>
                </div>
                <div style="font-weight:580;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</div>
              </div>
              <span class="badge badge-info">${stateLabel}</span>
            </div>
          `).join("")}
        </div>
        <div style="display:flex;justify-content:flex-end;">
          <a href="/app/calendar" data-link class="btn btn-sm btn-primary">Open Interactive Calendar ${icon("arrowRight", 14)}</a>
        </div>
      </div>
    `;
  }

  if (tab === "grid") {
    return `
      <div style="padding:18px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:9px;">
            <span class="ws-avatar" style="background:#0F172A;">M</span>
            <div>
              <div style="font-weight:650;font-size:13.5px;">@maya.studio</div>
              <div style="font-size:11.5px;color:var(--ink-muted);">Visual 4:5 Feed Preview &middot; Drag to Reorder</div>
            </div>
          </div>
          <a href="/app/grid" data-link class="btn btn-sm">Open Grid Planner</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border-radius:10px;overflow:hidden;">
          ${[
            ["cover-cobalt", "DARK MODE COLOR RULE", "SCHEDULED"],
            ["cover-cream", "8 TYPOGRAPHY RULES", "SCHEDULED"],
            ["cover-noir", "FIGMA VARIABLES IN 9M", "112K VIEWS"],
            ["cover-stone", "7 OPEN-SOURCE UI KITS", "68.4K VIEWS"],
            ["cover-slate", "SAAS ONBOARDING AUDIT", "94.1K VIEWS"],
            ["cover-terracotta", "HOW WE PRICE AUDITS", "49.2K VIEWS"]
          ].map(([cls, label, meta]) => `
            <div class="${cls}" style="aspect-ratio:4/5;padding:10px;display:flex;flex-direction:column;justify-content:space-between;">
              <span style="font-size:9.5px;font-weight:600;opacity:0.8;">${meta}</span>
              <strong style="font-family:var(--font-display);font-size:12px;line-height:1.18;">${label}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  return `
    <div style="padding:18px;display:flex;flex-direction:column;gap:13px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
        <div>
          <div style="font-weight:650;font-size:14px;">Keyword Comment &rarr; Instant DM</div>
          <div style="font-size:12px;color:var(--ink-muted);">Official Instagram Messenger API &middot; Zero password sharing</div>
        </div>
        <span class="badge badge-success"><span class="dot"></span>Live Rule</span>
      </div>

      <div style="padding:14px;border-radius:10px;background:var(--bg-page);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px;">
        <div style="align-self:flex-start;max-width:84%;padding:9px 12px;border-radius:12px 12px 12px 4px;background:var(--bg-surface);border:1px solid var(--border);font-size:12.5px;">
          <div style="font-size:11px;color:var(--ink-muted);margin-bottom:2px;">@rohan.codes commented on your Reel</div>
          This UI breakdown is super clean — commenting <strong>REPO</strong>!
        </div>
        <div style="align-self:flex-end;max-width:86%;padding:10px 13px;border-radius:12px 12px 4px 12px;background:var(--bg-inverse);color:var(--ink-inverse);font-size:12.5px;line-height:1.45;">
          <div>Here is the open-source UI kit list + Notion tracker from my Reel:</div>
          <div style="margin-top:8px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,0.14);text-align:center;font-weight:600;font-size:12px;">
            Open Resource Repo &rarr;
          </div>
        </div>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--ink-muted);">
        <span class="tabular">1,842 DMs sent &middot; 75.5% button click rate</span>
        <a href="/app/automations" data-link class="btn btn-sm btn-primary">Test Live Simulator ${icon("arrowRight", 13)}</a>
      </div>
    </div>
  `;
}

export function renderPricingSection(standalone = false) {
  const plans = Object.values(store.bundle.plansConfig.plans);
  const inr = store.currency === "INR";
  const yearly = store.billing === "yearly";

  return `
    <section class="${standalone ? "mkt-container" : "mkt-section"}" style="${standalone ? "padding-top:48px;padding-bottom:68px;" : ""}">
      <div class="${standalone ? "" : "mkt-container"}">
        <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:32px;">
          <div>
            <h2 class="mkt-h2">Straightforward pricing that scales with your studio</h2>
            <p style="font-size:14.5px;color:var(--ink-secondary);max-width:540px;">
              Start free with unlimited scheduling and 5 keyword DM rules. Upgrade anytime as your accounts and team grow.
            </p>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <div class="segmented">
              <button class="seg-btn ${yearly ? "is-active" : ""}" data-billing="yearly">Annual (Save 25%)</button>
              <button class="seg-btn ${!yearly ? "is-active" : ""}" data-billing="monthly">Monthly</button>
            </div>
            <div class="segmented">
              <button class="seg-btn ${!inr ? "is-active" : ""}" data-currency="USD">USD ($)</button>
              <button class="seg-btn ${inr ? "is-active" : ""}" data-currency="INR">INR (&#8377;)</button>
            </div>
          </div>
        </div>

        <div class="pricing-grid">
          ${plans.map((p) => {
            let price = "$0";
            let unit = "forever free";
            if (p.id === "lifetime") {
              price = inr ? `&#8377;${p.priceOneTimeInr.toLocaleString("en-IN")}` : `$${p.priceOneTimeUsd}`;
              unit = "one-time payment";
            } else if (p.priceMonthlyUsd > 0) {
              if (inr) {
                price = `&#8377;${(yearly ? Math.round(p.priceYearlyInr / 12) : p.priceMonthlyInr).toLocaleString("en-IN")}`;
              } else {
                price = `$${yearly ? (p.priceYearlyUsd / 12).toFixed(0) : p.priceMonthlyUsd}`;
              }
              unit = yearly ? "per month, billed annually" : "per month";
            }
            return `
              <div class="card plan-card ${p.popular ? "is-popular" : ""}">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-family:var(--font-display);font-weight:700;font-size:16px;">${escHtml(p.name)}</span>
                    ${p.badge ? `<span class="badge ${p.popular ? "badge-brand" : ""}">${escHtml(p.badge)}</span>` : ""}
                  </div>
                  <p style="font-size:12.5px;color:var(--ink-muted);min-height:36px;">${escHtml(p.tagline)}</p>
                  <div style="margin:16px 0 4px;" class="plan-price">${price}</div>
                  <div style="font-size:12px;color:var(--ink-muted);">${unit}</div>
                  <ul class="plan-list">
                    ${p.highlights.map((h) => `<li>${icon("check", 15)}${escHtml(h)}</li>`).join("")}
                  </ul>
                </div>
                <button class="btn ${p.popular ? "btn-primary" : ""}" style="width:100%;" data-try-plan="${p.id}">
                  ${p.id === "starter" ? "Start with Starter" : `Select ${escHtml(p.name)}`}
                </button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </section>
  `;
}

export function renderLandingPage() {
  const m = store.bundle.metrics;
  const heroTab = store.ui.heroTab || "workflow";

  const features = [
    ["upload", "Real Media Composer", "Upload local videos and photos directly into the composer, preview safe zones on a real mobile screen, and publish or queue in seconds."],
    ["calendar", "Drag-and-Drop Calendar", "Move posts across dates with drag-and-drop, inspect slots in Month or Week view, and let the queue worker publish automatically."],
    ["grid", "Visual Profile Grid", "Preview your upcoming feed in 4:5, 3:4, or 1:1 crop ratios. Reorder planned tiles visually before anything hits your public profile."],
    ["layers", "Carousel Layout Studio", "Design sharp multi-slide decks using 16 clean Swiss & editorial presets, custom brand hex colors, per-slide photos, and PNG export."],
    ["bolt", "Comment-to-DM Workflows", "Turn post comments and story replies into instant DM resource links with public reply rotation, follow gates, and timed follow-ups."],
    ["inbox", "Unified Inbox & Contact CRM", "Manage DMs and post comments side by side with 24-hour Meta window tracking, saved reply snippets, tags, and persistent contact notes."]
  ];

  return `
    ${renderMarketingNavbar("/")}
    <main class="stage-animate">
      <section class="mkt-hero">
        <div class="mkt-container">
          <div class="mkt-hero-grid">
            <div>
              <div class="mkt-eyebrow">
                ${icon("shield", 14)}
                <span>Official Meta Graph &amp; Messenger API &middot; Account-Safe</span>
              </div>
              <h1 class="mkt-h1">Publish calmly. Turn every post into real conversations.</h1>
              <p class="mkt-lead">
                Velora brings visual profile grid planning, reliable video &amp; carousel scheduling, and instant comment-to-DM workflows into one fast, focused studio.
              </p>
              <div class="mkt-cta-row">
                <a href="/app/overview" data-link class="btn btn-primary btn-lg">
                  Open Interactive Studio ${icon("arrowRight", 16)}
                </a>
                <a href="/sign-up" data-link class="btn btn-lg">Create Free Account</a>
              </div>
              <div class="mkt-proof-row">
                <div>
                  <div class="mkt-stat-num">${fmtNum(m.creators_signed_up)}</div>
                  <div class="mkt-stat-label">Active studios</div>
                </div>
                <div>
                  <div class="mkt-stat-num">${fmtNum(m.dms_sent_automatically)}</div>
                  <div class="mkt-stat-label">Automated DMs delivered</div>
                </div>
                <div>
                  <div class="mkt-stat-num">${fmtNum(m.posts_scheduled)}</div>
                  <div class="mkt-stat-label">Posts published on schedule</div>
                </div>
              </div>
            </div>

            <div class="mkt-window">
              <div class="mkt-window-bar">
                <div class="mkt-window-dots"><span></span><span></span><span></span></div>
                <div class="segmented">
                  <button class="seg-btn ${heroTab === "workflow" ? "is-active" : ""}" data-hero-tab="workflow">DM Workflow</button>
                  <button class="seg-btn ${heroTab === "calendar" ? "is-active" : ""}" data-hero-tab="calendar">Queue</button>
                  <button class="seg-btn ${heroTab === "grid" ? "is-active" : ""}" data-hero-tab="grid">Profile Grid</button>
                </div>
              </div>
              ${renderHeroPreviewStage()}
            </div>
          </div>
        </div>
      </section>

      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-sec-head">
            <h2 class="mkt-h2">Every tool a publishing workflow actually needs</h2>
            <p style="font-size:15px;color:var(--ink-secondary);line-height:1.6;">
              Designed without bloat or gimmicks — fast keyboard shortcuts, crisp typography, and real database persistence across every workspace.
            </p>
          </div>
          <div class="mkt-bento">
            ${features.map(([ic, title, desc]) => `
              <div class="card mkt-feature-card">
                <div class="mkt-icon-box">${icon(ic, 19)}</div>
                <h3 style="font-size:16px;margin-top:4px;">${title}</h3>
                <p style="font-size:13.5px;color:var(--ink-secondary);line-height:1.58;">${desc}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      ${renderPricingSection(false)}
    </main>
    ${renderMarketingFooter()}
  `;
}

export function renderPricingPage() {
  return `
    ${renderMarketingNavbar("/pricing")}
    <main class="stage-animate">
      ${renderPricingSection(true)}
    </main>
    ${renderMarketingFooter()}
  `;
}

export function renderPartnersPage() {
  return `
    ${renderMarketingNavbar("/partners")}
    <main class="mkt-container stage-animate" style="padding-top:48px;padding-bottom:72px;">
      <div class="split-2">
        <div>
          <span class="badge badge-brand" style="margin-bottom:14px;">Creator Partner Program</span>
          <h1 class="mkt-h2" style="font-size:36px;">Earn 30% recurring commission or ship sponsored workflow demos</h1>
          <p style="font-size:15px;color:var(--ink-secondary);line-height:1.65;margin:14px 0 24px;">
            Share how you plan your feed or automate comment links using Velora. Partners receive free Studio access plus direct sponsorship payouts or recurring revenue share.
          </p>
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${[
              ["Creator Walkthroughs ($250 – $1,200/video)", "Show a genuine 45-second screen recording of your grid planning or comment-to-DM workflow."],
              ["30% Recurring Partner Share", "Every referred paid workspace credits your partner balance automatically every billing cycle."],
              ["Full Studio Sandbox Included", "All approved creator partners receive complimentary Studio access across 5 workspaces."]
            ].map(([t, d]) => `
              <div class="card card-pad">
                <div style="font-weight:650;font-size:14.5px;margin-bottom:4px;">${t}</div>
                <div style="font-size:13px;color:var(--ink-secondary);">${d}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <form id="form-partner-apply" class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="font-size:18px;">Apply to Partner Program</h3>
          <div class="field">
            <label class="field-label">Your Name</label>
            <input class="input" name="name" required placeholder="Maya Kapoor" />
          </div>
          <div class="field">
            <label class="field-label">Work Email</label>
            <input class="input" type="email" name="email" required placeholder="maya@studio.design" />
          </div>
          <div class="field">
            <label class="field-label">Instagram or YouTube Handle</label>
            <input class="input" name="handle" required placeholder="@maya.studio" />
          </div>
          <div class="field">
            <label class="field-label">Average Views per Post</label>
            <select class="select" name="views">
              <option>5,000 – 25,000 views</option>
              <option>25,000 – 100,000 views</option>
              <option>100,000+ views</option>
            </select>
          </div>
          <button class="btn btn-primary btn-lg" type="submit">Submit Partner Application</button>
        </form>
      </div>
    </main>
    ${renderMarketingFooter()}
  `;
}

export function renderDocsPage() {
  const articles = [
    ["Official Meta API Safety & Rate Limits", "Velora connects exclusively through Official Instagram Graph OAuth tokens — never scraping or requesting your Instagram password. Meta permits up to 200 automated private replies per post comment hour and up to 50 published media containers per 24 hours."],
    ["Scheduling Videos, Photos & Carousels", "Upload MP4, WebM, PNG, or JPEG assets directly in the Post Composer. Scheduled items are stored in SQLite with WAL durability and published automatically by the background queue worker when their timestamp arrives."],
    ["Designing Comment-to-DM Workflows", "Attach up to 3 HTTPS call-to-action buttons per automated DM (20 characters max per label). Rotate multiple public comment replies to keep engagement natural, and optionally enable Follower Verification before sending primary links."],
    ["Connecting Claude Desktop or Cursor via MCP", "Point any Model Context Protocol client to POST /mcp on your Velora deployment URL. All 58 workspace, calendar, grid, carousel, workflow, inbox, and analytics tools are exposed via JSON-RPC 2.0."]
  ];

  return `
    ${renderMarketingNavbar("/docs")}
    <main class="mkt-container stage-animate" style="padding-top:48px;padding-bottom:72px;max-width:920px;">
      <h1 class="mkt-h2" style="font-size:34px;margin-bottom:8px;">Velora Product Guide &amp; API Reference</h1>
      <p style="font-size:15px;color:var(--ink-secondary);margin-bottom:28px;">
        Everything you need to configure publishing queues, DM rules, and MCP integrations safely.
      </p>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${articles.map(([title, body]) => `
          <article class="card card-pad">
            <h2 style="font-size:17px;margin-bottom:8px;">${title}</h2>
            <p style="font-size:13.5px;color:var(--ink-secondary);line-height:1.65;">${body}</p>
          </article>
        `).join("")}
      </div>
    </main>
    ${renderMarketingFooter()}
  `;
}

export function renderAuthPage(mode = "sign-in") {
  const isSignUp = mode === "sign-up";
  return `
    ${renderMarketingNavbar(isSignUp ? "/sign-up" : "/sign-in")}
    <main class="mkt-container stage-animate" style="padding:56px 16px 84px;display:flex;justify-content:center;">
      <div class="card card-pad" style="width:100%;max-width:420px;padding:28px;display:flex;flex-direction:column;gap:16px;">
        <div>
          <h1 style="font-size:22px;">${isSignUp ? "Create your Velora account" : "Sign in to Velora"}</h1>
          <p style="font-size:13px;color:var(--ink-muted);margin-top:4px;">
            ${isSignUp
              ? "Start free with unlimited scheduling and 4 preloaded demo workspaces."
              : "Use demo credentials maya@velora.so / demo1234 or your own account."}
          </p>
        </div>

        <form id="form-auth" data-mode="${mode}" style="display:flex;flex-direction:column;gap:13px;">
          ${isSignUp ? `
            <div class="field">
              <label class="field-label">Full Name</label>
              <input class="input" name="name" required placeholder="Maya Kapoor" />
            </div>
          ` : ""}
          <div class="field">
            <label class="field-label">Email Address</label>
            <input class="input" type="email" name="email" required value="${isSignUp ? "" : "maya@velora.so"}" placeholder="you@studio.com" />
          </div>
          <div class="field">
            <label class="field-label">Password</label>
            <input class="input" type="password" name="password" required minlength="6" value="${isSignUp ? "" : "demo1234"}" placeholder="Minimum 6 characters" />
          </div>
          <button class="btn btn-primary btn-lg" type="submit" style="width:100%;margin-top:4px;">
            ${isSignUp ? "Create Account & Open Studio" : "Sign In to Studio"}
          </button>
        </form>

        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid var(--border);font-size:12.5px;color:var(--ink-muted);">
          ${isSignUp
            ? `<span>Already have an account? <a href="/sign-in" data-link style="color:var(--ink-primary);font-weight:600;">Sign in</a></span>`
            : `<span>New here? <a href="/sign-up" data-link style="color:var(--ink-primary);font-weight:600;">Create account</a></span>`}
          <a href="/app/overview" data-link style="color:var(--brand);font-weight:600;">Instant Demo &rarr;</a>
        </div>
      </div>
    </main>
    ${renderMarketingFooter()}
  `;
}
