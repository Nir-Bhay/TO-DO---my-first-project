import { store, escHtml, fmtNum } from "./api.js";
import { icon, brandLogo } from "./icons.js";

export function renderMarketingNavbar(activePath = "/") {
  const isDark = store.theme === "dark";
  const user = store.currentUser;
  return `
    <div style="background:var(--bg-inverse);color:var(--ink-inverse);font-size:12.5px;padding:8px 16px;text-align:center;border-bottom:1px solid var(--border);">
      <span style="font-weight:600;">Velora Studio 3.0</span> &mdash; Local MP4/Image Composer, Drag &amp; Drop Feed Grid, 16 Editorial Carousel Systems &amp; 58-Tool MCP API &middot;
      <a href="/app/overview" data-link style="color:var(--brand);font-weight:700;margin-left:6px;text-decoration:underline;">Open Live Studio &rarr;</a>
    </div>
    <header class="mkt-nav">
      <div class="mkt-nav-inner">
        <div style="display:flex;align-items:center;gap:28px;">
          <a href="/" data-link>${brandLogo(true)}</a>
          <nav class="mkt-links" aria-label="Main Navigation">
            <a href="/" data-link class="mkt-link ${activePath === "/" ? "is-active" : ""}">Product</a>
            <a href="/pricing" data-link class="mkt-link ${activePath === "/pricing" ? "is-active" : ""}">Pricing</a>
            <a href="/tools" data-link class="mkt-link ${activePath.startsWith("/tools") ? "is-active" : ""}">Creator Tools</a>
            <a href="/partners" data-link class="mkt-link ${activePath === "/partners" ? "is-active" : ""}">Partners</a>
            <a href="/docs" data-link class="mkt-link ${activePath.startsWith("/docs") ? "is-active" : ""}">Docs &amp; API</a>
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
            <a href="/app/overview" data-link class="btn mkt-hide-mobile">Live Studio Demo</a>
            <a href="/sign-up" data-link class="btn btn-primary">Start free</a>
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
          <div style="display:flex;flex-direction:column;gap:12px;">
            ${brandLogo(true)}
            <p style="font-size:13.5px;color:var(--ink-muted);max-width:310px;line-height:1.6;">
              Visual grid planning, local video &amp; carousel scheduling, slide layout tools, and account-safe Instagram DM workflows built for independent creators and lean brand teams.
            </p>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <span class="badge badge-success"><span class="dot"></span>All Systems Operational</span>
              <span class="badge">v3.0 Studio</span>
            </div>
            <p style="font-size:12px;color:var(--ink-faint);margin-top:6px;">
              &copy; 2026 Velora Labs Inc. Built on Official Meta Graph &amp; Messenger APIs.
            </p>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;">
            <strong style="font-size:12px;color:var(--ink-primary);letter-spacing:0.02em;margin-bottom:2px;">Publishing Studio</strong>
            <a href="/app/overview" data-link style="color:var(--ink-secondary);">Workspace Overview</a>
            <a href="/app/create" data-link style="color:var(--ink-secondary);">Video &amp; Photo Composer</a>
            <a href="/app/calendar" data-link style="color:var(--ink-secondary);">Drag &amp; Drop Calendar</a>
            <a href="/app/grid" data-link style="color:var(--ink-secondary);">Visual Profile Grid</a>
            <a href="/app/carousels" data-link style="color:var(--ink-secondary);">Carousel Layout Studio</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;">
            <strong style="font-size:12px;color:var(--ink-primary);letter-spacing:0.02em;margin-bottom:2px;">Workflows &amp; CRM</strong>
            <a href="/app/automations" data-link style="color:var(--ink-secondary);">Comment-to-DM Rules</a>
            <a href="/app/inbox" data-link style="color:var(--ink-secondary);">Unified Inbox &amp; Notes</a>
            <a href="/app/analytics" data-link style="color:var(--ink-secondary);">Performance Analytics</a>
            <a href="/app/settings" data-link style="color:var(--ink-secondary);">Claude &amp; Cursor MCP</a>
            <a href="/sign-up" data-link style="color:var(--ink-secondary);">Create Free Account</a>
          </div>
          <div style="display:flex;flex-direction:column;gap:9px;font-size:13.5px;">
            <strong style="font-size:12px;color:var(--ink-primary);letter-spacing:0.02em;margin-bottom:2px;">Resources &amp; Tools</strong>
            <a href="/pricing" data-link style="color:var(--ink-secondary);">Plans &amp; Comparison</a>
            <a href="/tools" data-link style="color:var(--ink-secondary);">12 Free Creator Utilities</a>
            <a href="/tools/instagram-collab-rate-calculator" data-link style="color:var(--ink-secondary);">Sponsorship Rate Card</a>
            <a href="/partners" data-link style="color:var(--ink-secondary);">Creator Partner Program</a>
            <a href="/docs" data-link style="color:var(--ink-secondary);">API &amp; Safety Documentation</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function renderHeroShowcaseMain() {
  const tab = store.ui.heroTab || "workflow";
  const sim = store.ui.landingSimScenario || "repo";
  const crop = store.ui.landingGridCrop || "4:5";

  if (tab === "grid") {
    const aspectStyle = crop === "1:1" ? "1/1" : crop === "3:4" ? "3/4" : "4/5";
    return `
      <div style="padding:26px;display:flex;flex-direction:column;gap:18px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:12px;">
            <span class="ws-avatar" style="width:40px;height:40px;font-size:15px;background:#0F172A;">M</span>
            <div>
              <div style="font-weight:700;font-size:15px;">@maya.studio &middot; Visual Feed Planner</div>
              <div style="font-size:12.5px;color:var(--ink-muted);">Preview crop balance before scheduling any Reel or Carousel</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div class="segmented">
              ${["4:5", "3:4", "1:1"].map((r) => `
                <button class="seg-btn ${crop === r ? "is-active" : ""}" data-landing-crop="${r}">${r} Crop</button>
              `).join("")}
            </div>
            <a href="/app/grid" data-link class="btn btn-sm btn-primary">Open Full Grid ${icon("arrowRight", 13)}</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;max-width:680px;">
          ${[
            ["cover-cobalt", "DARK MODE COLOR RULE", "TODAY · 20:30", "+@figma.design"],
            ["cover-cream", "8 TYPOGRAPHY RULES", "TOMORROW · 09:30", "CAROUSEL · 8 CARDS"],
            ["cover-noir", "FIGMA VARIABLES IN 9M", "112.4K VIEWS", "4.8% SAVE RATE"],
            ["cover-stone", "7 OPEN-SOURCE UI KITS", "68.4K VIEWS", "1,842 DMs SENT"],
            ["cover-slate", "SAAS ONBOARDING AUDIT", "94.1K VIEWS", "PUBLISHED"],
            ["cover-terracotta", "HOW WE PRICE AUDITS", "49.2K VIEWS", "PUBLISHED"]
          ].map(([cls, label, topMeta, bottomMeta]) => `
            <div class="${cls}" style="aspect-ratio:${aspectStyle};padding:14px;border-radius:10px;display:flex;flex-direction:column;justify-content:space-between;transition:aspect-ratio 160ms ease;">
              <div style="display:flex;justify-content:space-between;gap:4px;font-size:10px;font-weight:650;opacity:0.84;">
                <span>${topMeta}</span>
              </div>
              <div>
                <strong style="font-family:var(--font-display);font-size:14.5px;line-height:1.16;display:block;margin-bottom:6px;">${label}</strong>
                <span style="font-size:10px;opacity:0.75;">${bottomMeta}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (tab === "calendar") {
    return `
      <div style="padding:26px;display:flex;flex-direction:column;gap:18px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-weight:700;font-size:16px;">October Publishing Queue &amp; Auto-Worker</div>
            <div style="font-size:13px;color:var(--ink-muted);">Drag posts between dates or trigger the SQLite background queue worker anytime</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <span class="badge badge-success"><span class="dot"></span>Worker Polling Active</span>
            <a href="/app/calendar" data-link class="btn btn-sm btn-primary">Open Calendar ${icon("arrowRight", 13)}</a>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
          ${[
            ["Wed, Oct 21 · 20:30", "REEL · 9:16", "The 60-30-10 Color Rule in Dark Mode UI", "Scheduled", "Keyword rule: PALETTE"],
            ["Thu, Oct 22 · 09:30", "CAROUSEL · 8 SLIDES", "8 Typography Rules I Wish I Knew Earlier", "Scheduled", "Swiss White preset"],
            ["Fri, Oct 23 · 14:00", "TRIAL REEL", "Behind the Scenes: 45-Minute Weekly Batch", "Trial Test", "Non-follower sample"],
            ["Sun, Oct 25 · 18:00", "CAROUSEL · 6 SLIDES", "Client Handoff Checklist for Small Teams", "Draft", "Caption template linked"]
          ].map(([slot, fmt, title, badgeTxt, foot]) => `
            <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                  <span class="badge">${fmt}</span>
                  <span class="badge badge-info">${badgeTxt}</span>
                </div>
                <div style="font-weight:650;font-size:14px;line-height:1.35;">${title}</div>
              </div>
              <div style="padding-top:10px;border-top:1px solid var(--border);font-size:12px;color:var(--ink-muted);display:flex;justify-content:space-between;" class="tabular">
                <span>${slot}</span>
                <span>${foot}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (tab === "carousels") {
    return `
      <div style="padding:26px;display:flex;flex-direction:column;gap:18px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-weight:700;font-size:16px;">1080&times;1350 Carousel Layout Studio</div>
            <div style="font-size:13px;color:var(--ink-muted);">16 restrained Swiss &amp; editorial design systems + custom brand hex overrides + PNG export</div>
          </div>
          <a href="/app/carousels" data-link class="btn btn-sm btn-primary">Launch Carousel Studio ${icon("arrowRight", 13)}</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;">
          ${[
            ["#FFFFFF", "#09090B", "#E11D48", "01 / HOOK", "Why most design systems fail before component #12", "Start with spacing & type scale tokens before naming 40 surface shades."],
            ["#09090B", "#FAFAFA", "#38BDF8", "02 / CONTRAST", "Reserve pure black and high chroma for one clear action", "When every badge shouts at equal weight, readers scan nothing at all."],
            ["#F5F2EB", "#1C1917", "#B45309", "03 / PAYOFF", "Comment GUIDE below for the full Figma variable starter file", "Delivered automatically to your DMs in under 2 seconds via Velora."]
          ].map(([bg, fg, acc, tag, h, body]) => `
            <div style="background:${bg};color:${fg};border:1px solid var(--border);border-radius:14px;padding:22px;display:flex;flex-direction:column;justify-content:space-between;min-height:260px;">
              <div style="font-size:11px;font-weight:700;opacity:0.68;">${tag}</div>
              <div>
                <div style="width:28px;height:3px;background:${acc};margin-bottom:12px;border-radius:2px;"></div>
                <div style="font-family:var(--font-display);font-weight:760;font-size:17px;line-height:1.2;margin-bottom:8px;">${h}</div>
                <p style="font-size:12.5px;opacity:0.8;line-height:1.5;">${body}</p>
              </div>
              <div style="font-size:11px;opacity:0.6;">@maya.studio &rarr;</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (tab === "inbox") {
    return `
      <div style="padding:26px;display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div>
            <div style="font-weight:700;font-size:16px;">3-Pane Unified Inbox &amp; Sponsorship CRM</div>
            <div style="font-size:13px;color:var(--ink-muted);">Track Meta's 24-hour reply window, filter hot brand leads, and save deal notes right beside the chat</div>
          </div>
          <a href="/app/inbox" data-link class="btn btn-sm btn-primary">Open Unified Inbox ${icon("arrowRight", 13)}</a>
        </div>
        <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:16px;">
          <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>@linear.brandpartnerships</strong>
              <span class="badge badge-success">21.4h Window Left</span>
            </div>
            <div class="bubble is-them" style="max-width:92%;font-size:13px;">Hi Maya! Loved your Figma Variables breakdown. Do you have a November Reel + Story slot open for Q4?</div>
            <div class="bubble is-me" style="max-width:92%;font-size:13px;">Hi! Yes — our November 14 slot is open. Sending over our Q4 media kit &amp; deliverables sheet right now.</div>
          </div>
          <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;gap:10px;">
            <div style="font-weight:650;font-size:13.5px;">Persistent Contact CRM Panel</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <span class="badge badge-brand">Priority Lead</span>
              <span class="badge">Q4 Sponsor</span>
              <span class="badge">$3,200 Quote</span>
            </div>
            <div style="padding:10px 12px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border);font-size:12.5px;color:var(--ink-secondary);">
              Notes synced to SQLite: Confirmed 60s workflow walkthrough + 2 link sticker frames. Follow up Friday 11:00.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Default Tab: Interactive Live Keyword DM Scenario Switcher!
  const scenarios = {
    repo: {
      user: "@rohan.codes commented on your Reel",
      comment: "Super clean token naming — commenting REPO for the starter kit!",
      publicReply: "@rohan.codes Sent the GitHub + Figma starter straight to your DMs!",
      dmBody: "Hey Rohan! Here is the open-source UI token starter file + Notion checklist from today's Reel:",
      cta: "Open Token Starter Kit ->",
      stats: "1,842 DMs delivered · 75.5% button click rate · 0.8s delivery"
    },
    followgate: {
      user: "@nina.product (Non-follower) commented TEMPLATE",
      comment: "Need this onboarding checklist! TEMPLATE",
      publicReply: "@nina.product Check your message requests — sent you a quick note!",
      dmBody: "Hey Nina! Follow @maya.studio first so Instagram unlocks direct resource links, then tap Confirm below:",
      cta: "I'm Following — Send My Link ->",
      stats: "+318 new followers verified automatically this month"
    },
    story: {
      user: "@arjun.fit replied to your Story",
      comment: "RATES",
      publicReply: null,
      dmBody: "Appreciate you reaching out! Here is our live 2026 Sponsorship Rate Card & available creator slots:",
      cta: "View Media Kit & Rates ->",
      stats: "24/7 instant response on Story replies & Ice Breakers"
    }
  };
  const cur = scenarios[sim] || scenarios.repo;

  return `
    <div style="padding:26px;display:flex;flex-direction:column;gap:18px;">
      <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-weight:700;font-size:16px;">Interactive Keyword &rarr; Instant Messenger DM</div>
          <div style="font-size:13px;color:var(--ink-muted);">Click a scenario below to preview how Velora handles comments, follow gates, and Story replies</div>
        </div>
        <div class="segmented" style="flex-wrap:wrap;">
          <button class="seg-btn ${sim === "repo" ? "is-active" : ""}" data-landing-sim="repo">Keyword: "REPO"</button>
          <button class="seg-btn ${sim === "followgate" ? "is-active" : ""}" data-landing-sim="followgate">Follower Gate</button>
          <button class="seg-btn ${sim === "story" ? "is-active" : ""}" data-landing-sim="story">Story Reply</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:16px;align-items:stretch;">
        <!-- Left: Trigger Event -->
        <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="badge">1. Incoming Instagram Event</span>
              <span class="mono" style="color:var(--ink-muted);">Webhook &lt;250ms</span>
            </div>
            <div style="padding:12px 14px;border-radius:10px;background:var(--bg-surface);border:1px solid var(--border);">
              <div style="font-size:11.5px;color:var(--ink-muted);margin-bottom:4px;">${escHtml(cur.user)}</div>
              <div style="font-weight:600;font-size:14px;">"${escHtml(cur.comment)}"</div>
            </div>
            ${cur.publicReply ? `
              <div style="margin-top:10px;padding:10px 13px;border-radius:10px;border-left:3px solid var(--brand);background:var(--bg-surface);font-size:12.5px;color:var(--ink-secondary);">
                <strong style="color:var(--ink-primary);display:block;margin-bottom:2px;">Auto-Rotated Public Comment Reply:</strong>
                ${escHtml(cur.publicReply)}
              </div>
            ` : ""}
          </div>
          <div style="font-size:12px;color:var(--ink-muted);">Up to 10 natural reply variations prevent repetitive bot footprints.</div>
        </div>

        <!-- Right: Automated Private DM Card -->
        <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:12px;">
          <div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <span class="badge badge-success"><span class="dot"></span>2. Official Messenger API DM</span>
              <span class="mono" style="color:var(--ink-muted);">200 OK</span>
            </div>
            <div style="padding:15px 16px;border-radius:14px;background:var(--bg-inverse);color:var(--ink-inverse);font-size:13.5px;line-height:1.5;">
              <div>${escHtml(cur.dmBody)}</div>
              <div style="margin-top:12px;padding:9px 12px;border-radius:8px;background:var(--brand);color:#FFFFFF;text-align:center;font-weight:650;font-size:13px;">
                ${escHtml(cur.cta)}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--ink-muted);" class="tabular">
            <span>${escHtml(cur.stats)}</span>
            <a href="/app/automations" data-link style="color:var(--brand);font-weight:650;white-space:nowrap;">Try Live Chat &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderPricingSection(standalone = false) {
  const plans = Object.values(store.bundle.plansConfig.plans);
  const inr = store.currency === "INR";
  const yearly = store.billing === "yearly";

  const matrixRows = [
    ["Connected Instagram Workspaces", "1 workspace", "2 workspaces", "5 workspaces", "5 workspaces"],
    ["Video, Photo & Carousel Scheduling", "Unlimited", "Unlimited", "Unlimited", "Unlimited"],
    ["Visual 4:5 / 3:4 / 1:1 Grid Planner", "Included", "Included", "Included", "Included"],
    ["Active Comment-to-DM Workflows", "Up to 5 rules", "Unlimited", "Unlimited", "Unlimited"],
    ["Story Reply & Ice Breaker Triggers", "—", "Included", "Included", "Included"],
    ["Follower Verification Gate & Timed Follow-Ups", "—", "Included", "Included", "Included"],
    ["Remove 'Sent via velora.so' Watermark", "—", "Clean unbranded", "Clean unbranded", "Clean unbranded"],
    ["Unified DM Inbox & Persistent Contact CRM", "Read-only", "Full Replies + CRM", "Full Replies + CRM", "Full Replies + CRM"],
    ["Carousel Studio Presets & Custom Brand Hex", "15 exports / mo", "60 exports / mo", "Unlimited + Hex Kits", "Unlimited + Hex Kits"],
    ["Claude Desktop & Cursor MCP Server (58 Tools)", "Read-only", "Full Execution", "Full + Team Seats", "Full + Lifetime Updates"]
  ];

  return `
    <section class="${standalone ? "mkt-container" : "mkt-section mkt-section-alt"}" style="${standalone ? "padding-top:56px;padding-bottom:84px;" : ""}">
      <div class="${standalone ? "" : "mkt-container"}">
        <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:40px;">
          <div>
            <span class="badge badge-brand" style="margin-bottom:12px;">Transparent Pricing</span>
            <h2 class="mkt-h2">Start free. Upgrade only when your studio scales.</h2>
            <p style="font-size:15.5px;color:var(--ink-secondary);max-width:580px;">
              Every plan includes unlimited post scheduling, visual grid planning, and official Meta OAuth security — zero per-message surprise fees.
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
            let unit = "forever free · no card needed";
            if (p.id === "lifetime") {
              price = inr ? `&#8377;${p.priceOneTimeInr.toLocaleString("en-IN")}` : `$${p.priceOneTimeUsd}`;
              unit = "one-time payment · own forever";
            } else if (p.priceMonthlyUsd > 0) {
              if (inr) {
                price = `&#8377;${(yearly ? Math.round(p.priceYearlyInr / 12) : p.priceMonthlyInr).toLocaleString("en-IN")}`;
              } else {
                price = `$${yearly ? (p.priceYearlyUsd / 12).toFixed(0) : p.priceMonthlyUsd}`;
              }
              unit = yearly ? "per month, billed annually" : "per month, cancel anytime";
            }
            return `
              <div class="card plan-card ${p.popular ? "is-popular" : ""}">
                <div>
                  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-family:var(--font-display);font-weight:750;font-size:17px;">${escHtml(p.name)}</span>
                    ${p.badge ? `<span class="badge ${p.popular ? "badge-brand" : ""}">${escHtml(p.badge)}</span>` : ""}
                  </div>
                  <p style="font-size:13px;color:var(--ink-muted);min-height:40px;line-height:1.5;">${escHtml(p.tagline || p.description)}</p>
                  <div style="margin:18px 0 4px;" class="plan-price">${price}</div>
                  <div style="font-size:12px;color:var(--ink-muted);">${unit}</div>
                  <ul class="plan-list">
                    ${(p.highlights || []).map((h) => `<li>${icon("check", 15)}${escHtml(h)}</li>`).join("")}
                  </ul>
                </div>
                <button class="btn ${p.popular ? "btn-primary" : ""}" style="width:100%;" data-try-plan="${p.id}">
                  ${p.id === "starter" ? "Start Free with Starter" : `Activate ${escHtml(p.name)}`}
                </button>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Full Feature-by-Feature Comparison Matrix -->
        <div class="card table-wrap" style="margin-top:36px;">
          <div class="card-header">
            <div>
              <div class="card-title">Complete Plan Comparison</div>
              <div class="card-sub">Exact workspace limits &amp; Official Instagram API capabilities across tiers</div>
            </div>
          </div>
          <table class="v-table">
            <thead>
              <tr>
                <th>Capability</th>
                <th>Starter ($0)</th>
                <th>Growth</th>
                <th>Studio</th>
                <th>Founding Pass</th>
              </tr>
            </thead>
            <tbody>
              ${matrixRows.map(([feat, c1, c2, c3, c4]) => `
                <tr>
                  <td><strong>${feat}</strong></td>
                  <td>${c1}</td>
                  <td>${c2}</td>
                  <td>${c3}</td>
                  <td><strong>${c4}</strong></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

export function renderLandingPage() {
  const m = store.bundle.metrics;
  const heroTab = store.ui.heroTab || "workflow";
  const themes = store.bundle.themes || [];
  const chosenTheme = themes.find((t) => t.id === store.ui.landingThemeId) || themes[0] || { id: "swiss_white", name: "Swiss White", bg: "#FFFFFF", fg: "#09090B", accent: "#E11D48" };
  const postsPerWeek = Number(store.ui.calcPostsPerWeek || 6);
  const commentsPerPost = Number(store.ui.calcCommentsPerPost || 85);
  const monthlyDms = postsPerWeek * 4 * commentsPerPost;
  const monthlyClicks = Math.round(monthlyDms * 0.74);
  const hoursSaved = Math.max(4, Math.round((monthlyDms * 0.45) / 60 + postsPerWeek * 1.2));
  const openFaq = store.ui.openFaqIdx ?? 0;

  const niches = [
    "Product Designers", "Indie SaaS Founders", "Fitness & Strength Coaches", "Ceramic & Craft Studios",
    "Developer Educators", "Creative Agencies", "Hospitality & Cafes", "Visual Photographers",
    "Architecture Studios", "Newsletter Writers", "Design Systems Teams", "E-Commerce Brands"
  ];

  const capabilities = [
    ["upload", "Local Video & Photo Upload", "Drop MP4, WebM, PNG, or JPG files directly into the composer. Preview vertical safe zones and audio playback before queuing.", "/app/create"],
    ["calendar", "Drag-and-Drop Publishing Calendar", "Move posts across Month or Queue views effortlessly. Background worker automatically publishes due containers on schedule.", "/app/calendar"],
    ["grid", "Visual 4:5 / 3:4 Profile Grid", "See how upcoming Reels and Carousels align beside published tiles. Drag tiles to swap publishing order cleanly.", "/app/grid"],
    ["layers", "16-Preset Carousel Layout Studio", "Craft crisp 1080x1350 educational decks with Swiss & editorial presets, custom brand hex pickers, per-slide photos, and PNG export.", "/app/carousels"],
    ["bolt", "Keyword Comment-to-DM Rules", "Deliver instant resource buttons when viewers comment your keyword — with public reply rotation and follower verification.", "/app/automations"],
    ["inbox", "3-Pane Unified Inbox & CRM", "Reply inside Meta's 24-hour window, filter priority leads, attach quick snippets, and persist sponsor notes in SQLite.", "/app/inbox"],
    ["chart", "Trial Reels & Save-Rate Analytics", "Benchmark non-follower Trial Reels before graduating winners to your main profile grid, and export clean CSV reports.", "/app/analytics"],
    ["fileText", "Reusable Caption Templates & Fold Check", "Save high-performing caption structures, verify your opening 125 characters before truncation, and scan restricted tags.", "/app/create"],
    ["code", "58-Tool Claude & Cursor MCP Server", "Connect Claude Desktop or Cursor directly to POST /mcp to audit metrics, schedule batches, and manage workflows via natural language.", "/app/settings"]
  ];

  const faqs = [
    ["Is Velora 100% safe for my Instagram creator or brand account?", "Yes. Velora uses Official Meta Graph & Instagram Messenger OAuth scopes exclusively — we never ask for your Instagram password, never run headless browser bots, and automatically enforce hourly Messenger rate caps and natural public reply rotation."],
    ["Can I upload real local MP4 videos and high-resolution images?", "Yes. Drag and drop MP4, WebM, PNG, JPEG, or WebP files right into the Create Post composer or Carousel Studio. Assets are stored cleanly in SQLite + workspace media storage and previewed live inside a realistic mobile frame."],
    ["How does the Follower Verification Gate work on DM workflows?", "When enabled on Growth or Studio plans, non-followers who comment your keyword receive a polite card inviting them to follow your account first and tap 'Confirm Follow' — unlocking your primary resource link immediately once verified."],
    ["What aspect ratios do the Visual Profile Grid and Carousel Studio support?", "Carousel Studio renders full 1080x1350 (4:5 vertical portrait) cards for maximum feed height, while the Profile Grid Planner lets you toggle live between 4:5, 3:4, and classic 1:1 square crops."],
    ["Do I need a credit card to use the Starter plan?", "No credit card is required. Starter is free forever and includes 1 workspace, unlimited post scheduling, visual grid planning, 12 free creator calculators, and up to 5 active keyword DM rules."],
    ["Can multiple team members collaborate across client workspaces?", "Yes. Studio and Founding Pass workspaces support up to 5 connected Instagram accounts, instant workspace switching from the top-left rail, and role-based team invites (Owner, Content Manager, Editor, Analyst)."],
    ["How does the Claude Desktop & Cursor MCP integration work?", "Every Velora instance exposes a compliant JSON-RPC 2.0 Model Context Protocol endpoint at POST /mcp with 58 registered tools covering scheduling, grid swaps, carousels, DM simulations, inbox replies, and analytics."],
    ["Can we deploy Velora directly to Vercel in one click?", "Yes. Velora ships zero-configuration Vercel Serverless routing (vercel.json + api/index.js) with seamless SQLite snapshot hydration, so deploying from GitHub works immediately with zero external database setup."]
  ];

  return `
    ${renderMarketingNavbar("/")}
    <main class="stage-animate">
      <!-- SECTION 1: MONUMENTAL HERO + FULL-WIDTH INTERACTIVE STUDIO STAGE -->
      <section class="mkt-hero">
        <div class="mkt-container">
          <div class="mkt-hero-center">
            <div class="mkt-eyebrow">
              ${icon("shield", 15)}
              <span>Official Meta Graph &amp; Messenger API &middot; Built for Serious Creators &amp; Studios</span>
            </div>
            <h1 class="mkt-h1">Plan your grid. Ship on schedule. Turn comments into DMs.</h1>
            <p class="mkt-lead">
              Velora replaces scattered scheduling tabs, fragile DM bots, and messy spreadsheets with one fast, calm studio — complete with visual grid planning, carousel design, and instant Messenger workflows.
            </p>
            <div class="mkt-cta-row">
              <a href="/app/overview" data-link class="btn btn-primary btn-lg" style="height:48px;padding:0 26px;font-size:15px;">
                Explore Live Studio ${icon("arrowRight", 16)}
              </a>
              <a href="/sign-up" data-link class="btn btn-lg" style="height:48px;padding:0 24px;font-size:15px;">
                Create Free Account
              </a>
              <a href="/tools" data-link class="btn btn-ghost btn-lg" style="height:48px;">
                Try 12 Free Tools
              </a>
            </div>
            <div class="mkt-trust-pills">
              <span>${icon("check", 14)} Free forever Starter tier</span>
              <span>${icon("check", 14)} Official OAuth (no password sharing)</span>
              <span>${icon("check", 14)} 4 preloaded demo workspaces</span>
              <span>${icon("check", 14)} 58-tool MCP API included</span>
            </div>
          </div>

          <!-- Full-Width Interactive Studio Showcase Window -->
          <div class="mkt-window">
            <div class="mkt-window-bar">
              <div style="display:flex;align-items:center;gap:12px;">
                <div class="mkt-window-dots"><span></span><span></span><span></span></div>
                <span class="mono" style="color:var(--ink-muted);">velora.so/app &mdash; @maya.studio (Studio Workspace)</span>
              </div>
              <a href="/app/overview" data-link class="btn btn-sm">Open Full Screen ${icon("external", 13)}</a>
            </div>
            <div class="mkt-showcase-body">
              <div class="mkt-showcase-rail" role="tablist" aria-label="Interactive Product Preview">
                ${[
                  ["workflow", "bolt", "Comment -> DM"],
                  ["grid", "grid", "Profile Grid"],
                  ["calendar", "calendar", "Queue & Calendar"],
                  ["carousels", "layers", "Carousel Studio"],
                  ["inbox", "inbox", "Unified Inbox"]
                ].map(([id, ic, label]) => `
                  <button class="mkt-rail-btn ${heroTab === id ? "is-active" : ""}" data-hero-tab="${id}">
                    <span style="display:inline-flex;align-items:center;gap:9px;">${icon(ic, 16)}<span>${label}</span></span>
                    ${icon("chevronRight", 14)}
                  </button>
                `).join("")}
              </div>
              <div style="min-width:0;background:var(--bg-surface);">
                ${renderHeroShowcaseMain()}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2: INFINITE SMOOTH NICHE MARQUEE + LIVE METRICS STRIP -->
      <div class="mkt-marquee-wrap" aria-label="Creator communities using Velora">
        <div class="mkt-marquee-track">
          ${[...niches, ...niches].map((n) => `
            <span class="mkt-niche-pill">${icon("check", 13)} ${escHtml(n)}</span>
          `).join("")}
        </div>
      </div>

      <section class="mkt-section" style="padding:72px 0;">
        <div class="mkt-container">
          <div class="mkt-metrics-grid">
            <div class="card mkt-metric-card">
              <div class="mkt-stat-num">${fmtNum(m.creators_signed_up)}+</div>
              <div class="mkt-stat-label">Active Creator Workspaces</div>
              <p style="font-size:13px;color:var(--ink-muted);">Solo creators, educators, design studios &amp; consumer brands</p>
            </div>
            <div class="card mkt-metric-card">
              <div class="mkt-stat-num">${fmtNum(m.dms_sent_automatically)}</div>
              <div class="mkt-stat-label">Automated DMs Delivered</div>
              <p style="font-size:13px;color:var(--ink-muted);">Sent via Official Instagram Messenger API webhooks</p>
            </div>
            <div class="card mkt-metric-card">
              <div class="mkt-stat-num">${fmtNum(m.posts_scheduled)}</div>
              <div class="mkt-stat-label">Reels &amp; Carousels Queued</div>
              <p style="font-size:13px;color:var(--ink-muted);">Zero missed slots with background SQLite WAL worker</p>
            </div>
            <div class="card mkt-metric-card">
              <div class="mkt-stat-num">75.4%</div>
              <div class="mkt-stat-label">Median DM Button Tap Rate</div>
              <p style="font-size:13px;color:var(--ink-muted);">Compared to ~3.8% average click-through on static bio links</p>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 2B: STOP DUCT-TAPING 5 DISCONNECTED TOOLS (BEFORE VS. AFTER) + 4-STEP FLOW -->
      <section class="mkt-section" style="padding:84px 0;">
        <div class="mkt-container">
          <div class="mkt-sec-head-center">
            <span class="badge badge-brand" style="margin-bottom:12px;">Why Studios Switch</span>
            <h2 class="mkt-h2">Replace five disconnected subscriptions with one calm workspace.</h2>
            <p style="font-size:15.5px;color:var(--ink-secondary);">
              No more exporting slides in one tab, previewing grid crops in a second, scheduling in a third, running fragile DM bots in a fourth, and tracking sponsors in spreadsheets.
            </p>
          </div>

          <div class="split-2" style="gap:24px;margin-bottom:44px;">
            <div class="card card-pad" style="padding:30px;display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge badge-danger">Old Fragmented Workflow</span>
                <span class="mono" style="color:var(--ink-muted);">~$148 / month</span>
              </div>
              <h3 style="font-size:20px;">Five tabs that never talk to each other</h3>
              <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:var(--ink-secondary);">
                <div style="display:flex;gap:10px;align-items:center;">${icon("x", 16)}<span>Separate scheduler ($29/mo) with no 4:5 profile grid safe-zone view</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("x", 16)}<span>Separate DM bot ($49/mo) charging surprise overages when a Reel goes viral</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("x", 16)}<span>Static bio link page ($19/mo) losing 94% of cold Reel viewers</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("x", 16)}<span>Slide templates ($25/mo) + manual spreadsheet sponsorship notes</span></div>
              </div>
            </div>

            <div class="card card-pad" style="padding:30px;border-color:var(--ink-primary);box-shadow:var(--shadow-md);display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge badge-success">Unified Velora Studio</span>
                <span class="mono" style="font-weight:700;">$0 to start &middot; $12 Growth</span>
              </div>
              <h3 style="font-size:20px;">Every step wired directly together</h3>
              <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;color:var(--ink-secondary);">
                <div style="display:flex;gap:10px;align-items:center;">${icon("check", 16)}<span>Upload video or design a 16-preset Carousel &amp; attach its DM keyword rule in one screen</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("check", 16)}<span>Drag tiles directly on the 4:5 / 3:4 Profile Grid or Calendar to reschedule</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("check", 16)}<span>Official Meta OAuth DMs sync straight into your 3-pane Inbox + Contact CRM</span></div>
                <div style="display:flex;gap:10px;align-items:center;">${icon("check", 16)}<span>Query analytics &amp; batch-schedule directly from Claude or Cursor over MCP</span></div>
              </div>
            </div>
          </div>

          <!-- 4-Step Horizontal Studio Flow -->
          <div class="mkt-metrics-grid">
            ${[
              ["STEP 01", "Connect Official OAuth", "Link up to 5 Instagram Creator or Business accounts in 30 seconds — zero password sharing."],
              ["STEP 02", "Compose & Check Crop", "Drop local MP4s or build crisp 1080x1350 slide decks while checking your 125-char caption fold."],
              ["STEP 03", "Attach Keyword DM Rule", "Pair any post or Story with instant CTA button DMs, reply rotation, and follower gates."],
              ["STEP 04", "Close Leads & Scale", "Reply inside the 24h Messenger window, log sponsor notes in CRM, and graduate winning Trial Reels."]
            ].map(([step, t, d]) => `
              <div class="card card-pad" style="padding:24px;background:var(--bg-surface);">
                <span class="mono" style="color:var(--brand);font-weight:700;">${step}</span>
                <h3 style="font-size:16.5px;margin:8px 0 6px;">${t}</h3>
                <p style="font-size:13.5px;color:var(--ink-secondary);line-height:1.55;">${d}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SECTION 3: DEEP-DIVE PILLAR 01 — COMPOSER, SAFE ZONES & VISUAL GRID -->
      <section class="mkt-section mkt-section-alt">
        <div class="mkt-container">
          <div class="mkt-deep-row">
            <div>
              <span class="badge" style="margin-bottom:14px;">01 &middot; Publishing &amp; Feed Craft</span>
              <h2 class="mkt-h2">See exactly how every post lands before a single follower sees it.</h2>
              <p style="font-size:15.5px;color:var(--ink-secondary);line-height:1.65;">
                Stop guessing where Instagram truncates your opening hook or crops your cover typography. Upload local video and photo assets directly, inspect your 125-character fold live, and arrange your entire profile grid visually.
              </p>
              <div class="mkt-check-list">
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>Real Local MP4 &amp; Image Upload:</strong> Preview vertical Reels and 4:5 Carousels inside an accurate mobile frame before scheduling.</span></div>
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>125-Character Fold &amp; Tag Scanner:</strong> Catch cut-off hooks and restricted shadowban-prone hashtags before publishing.</span></div>
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>Drag-and-Drop Grid &amp; Calendar:</strong> Reorder planned tiles or drag posts across calendar days in one smooth motion.</span></div>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <a href="/app/create" data-link class="btn btn-primary">Open Post Composer ${icon("arrowRight", 15)}</a>
                <a href="/app/grid" data-link class="btn">Preview Profile Grid</a>
              </div>
            </div>

            <div class="card card-pad" style="padding:26px;background:var(--bg-page);display:flex;flex-direction:column;gap:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:700;font-size:14.5px;">Live Pre-Flight Publishing Checklist</span>
                <span class="badge badge-success">Ready for Slot 20:30</span>
              </div>
              <div style="padding:16px;border-radius:12px;background:var(--bg-surface);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px;">
                <div style="font-size:12px;color:var(--ink-muted);">Opening 125-Character Hook Preview (Before "...more")</div>
                <div style="font-size:14px;line-height:1.5;">
                  <strong>@maya.studio</strong> Most teams overcomplicate design tokens before shipping their very first component library. Comment "REPO" below... <span style="color:var(--ink-muted);">more</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:8px;border-top:1px solid var(--border-subtle);">
                  <span class="badge badge-success">4 Safe Niche Tags</span>
                  <span class="badge badge-info">4:5 Feed Safe Zone OK</span>
                  <span class="badge badge-brand">DM Rule Linked: REPO</span>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;" class="tabular">
                <div class="card card-pad" style="padding:14px;"><div style="font-size:11.5px;color:var(--ink-muted);">Best Window</div><strong style="font-size:16px;">20:30 IST</strong></div>
                <div class="card card-pad" style="padding:14px;"><div style="font-size:11.5px;color:var(--ink-muted);">Auto First Comment</div><strong style="font-size:16px;">Armed</strong></div>
                <div class="card card-pad" style="padding:14px;"><div style="font-size:11.5px;color:var(--ink-muted);">Trial Reel Mode</div><strong style="font-size:16px;">Optional</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 4: DEEP-DIVE PILLAR 02 — LIVE INTERACTIVE PHONE CHAT SIMULATOR RIGHT ON HOME PAGE -->
      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-deep-row is-reversed">
            <div style="display:flex;justify-content:center;">
              <div class="phone-frame" style="max-width:390px;">
                <div class="phone-screen" style="background:#0F0F12;">
                  <div class="phone-notch"></div>
                  <div style="padding:8px 16px 12px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:9px;">
                      <span class="ws-avatar" style="width:28px;height:28px;background:#E11D48;font-size:12px;">M</span>
                      <div>
                        <div style="font-weight:700;font-size:13px;color:#fff;">@maya.studio</div>
                        <div style="font-size:10.5px;color:#34D399;">Official Messenger Live Demo</div>
                      </div>
                    </div>
                    <span class="badge" style="background:#1F1F26;color:#E4E4E7;border-color:#2E2E38;">Try Me Live</span>
                  </div>

                  <div id="landing-phone-chat-list" style="height:285px;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;">
                    ${(store.ui.landingChatMsgs || []).map((msg) => `
                      <div style="align-self:${msg.role === "me" ? "flex-end" : "flex-start"};max-width:85%;padding:10px 13px;border-radius:13px;font-size:12.5px;line-height:1.45;background:${msg.role === "me" ? "#FFFFFF" : "#1C1C22"};color:${msg.role === "me" ? "#09090B" : "#F4F4F5"};">
                        <div style="font-size:10px;opacity:0.65;margin-bottom:3px;font-weight:600;">${escHtml(msg.badge)}</div>
                        <div>${escHtml(msg.text)}</div>
                        ${msg.cta ? `<div style="margin-top:8px;padding:7px 10px;border-radius:7px;background:#E11D48;color:#FFFFFF;text-align:center;font-weight:700;font-size:12px;">${escHtml(msg.cta)}</div>` : ""}
                      </div>
                    `).join("")}
                  </div>

                  <div style="padding:10px 12px 14px;border-top:1px solid rgba(255,255,255,0.08);background:#141418;">
                    <div style="display:flex;gap:5px;margin-bottom:8px;overflow-x:auto;">
                      ${["REPO", "KIT", "RATES", "GUIDE"].map((kw) => `
                        <button type="button" data-landing-quick-kw="${kw}" style="padding:3px 9px;border-radius:999px;border:1px solid #3F3F46;background:#1F1F26;color:#FAFAFA;font-size:11px;font-weight:600;">Send "${kw}"</button>
                      `).join("")}
                    </div>
                    <form id="form-landing-phone-chat" style="display:flex;gap:6px;">
                      <input id="landing-phone-input" value="KIT" placeholder="Type REPO, KIT, or RATES..." style="flex:1;height:34px;padding:0 11px;border-radius:8px;border:1px solid #3F3F46;background:#09090B;color:#FFFFFF;font-size:12.5px;" />
                      <button type="submit" class="btn btn-brand btn-sm" style="height:34px;padding:0 13px;">Send</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <span class="badge badge-brand" style="margin-bottom:14px;">02 &middot; Try Live Right Here</span>
              <h2 class="mkt-h2">"Link in bio" loses 9 out of 10 interested viewers. Meet them in DMs.</h2>
              <p style="font-size:15.5px;color:var(--ink-secondary);line-height:1.65;">
                Type <code class="mono">REPO</code>, <code class="mono">KIT</code>, or <code class="mono">RATES</code> directly inside the phone on the left — every automated reply card, public comment rotation, follower gate, and 2-hour follow-up runs on Official Meta Messenger OAuth.
              </p>
              <div class="mkt-check-list">
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>Past-Comment Sweep:</strong> Post went viral before you attached a workflow? Retroactively deliver DMs to up to 250 missed comments in one click.</span></div>
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>Follower Verification Gate:</strong> Turn viral non-follower comments into verified followers automatically before unlocking primary links.</span></div>
                <div class="mkt-check-item">${icon("check", 17)}<span><strong>Direct Unified Inbox Sync:</strong> Every automated thread appears neatly inside your 3-pane Inbox &amp; Contact CRM.</span></div>
              </div>
              <a href="/app/automations" data-link class="btn btn-primary">Open Full Workflow Builder ${icon("arrowRight", 15)}</a>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 5: INTERACTIVE CAROUSEL STUDIO PLAYGROUND RIGHT ON LANDING PAGE -->
      <section class="mkt-section mkt-section-alt">
        <div class="mkt-container">
          <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:36px;">
            <div style="max-width:640px;">
              <span class="badge" style="margin-bottom:12px;">03 &middot; Live Design Playground</span>
              <h2 class="mkt-h2">16 restrained, editorial slide systems. Zero generic templates.</h2>
              <p style="font-size:15.5px;color:var(--ink-secondary);">
                Click any preset below to restyle the live 3-slide carousel deck right here — or customize background, ink, and accent hex codes inside the Studio.
              </p>
            </div>
            <a href="/app/carousels" data-link class="btn btn-primary">Open Carousel Designer ${icon("arrowRight", 15)}</a>
          </div>

          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;">
            ${themes.slice(0, 8).map((t) => `
              <button class="btn btn-sm ${t.id === chosenTheme.id ? "btn-primary" : ""}" data-landing-theme="${escHtml(t.id)}">
                <span style="width:11px;height:11px;border-radius:50%;background:${escHtml(t.bg)};border:1px solid var(--border-strong);display:inline-block;"></span>
                ${escHtml(t.name)}
              </button>
            `).join("")}
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;">
            ${[
              ["SLIDE 01 · HOOK", "Most interfaces feel cluttered for one simple reason", "Too many competing borders, font weights, and accent colors fighting for eye contact at once."],
              ["SLIDE 02 · SYSTEM", "Anchor hierarchy with optical contrast, not decoration", "Pair a tight geometric display headline with calm neutral body copy and generous outer margins."],
              ["SLIDE 03 · ACTION", "Bookmark this deck + reply GUIDE for our Figma kit", "Export crisp 1080x1350 PNG slides directly or schedule straight onto your workspace queue."]
            ].map(([kicker, head, copy], idx) => `
              <div class="mkt-carousel-preview-card" style="background:${escHtml(chosenTheme.bg)};color:${escHtml(chosenTheme.fg)};border:1px solid var(--border);border-radius:16px;padding:30px 28px;min-height:330px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-sm);transition:background-color 180ms ease,color 180ms ease;">
                <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:650;opacity:0.72;">
                  <span>${kicker}</span>
                  <span class="mono">0${idx + 1} / 03</span>
                </div>
                <div>
                  <div style="width:36px;height:3.5px;background:${escHtml(chosenTheme.accent)};border-radius:2px;margin-bottom:16px;"></div>
                  <h3 style="color:inherit;font-size:22px;line-height:1.18;margin-bottom:12px;">${head}</h3>
                  <p style="font-size:14px;line-height:1.6;opacity:0.84;">${copy}</p>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;opacity:0.65;padding-top:14px;border-top:1px solid rgba(128,128,128,0.22);">
                  <span>Preset: ${escHtml(chosenTheme.name)}</span>
                  <span>1080&times;1350 PNG</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SECTION 6: COMPLETE 9-MODULE CAPABILITY BENTO -->
      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-sec-head-center">
            <span class="badge" style="margin-bottom:12px;">Complete Studio Suite</span>
            <h2 class="mkt-h2">Nine tightly integrated tools. One fast keyboard-first workspace.</h2>
            <p style="font-size:15.5px;color:var(--ink-secondary);">
              Press <kbd class="kbd">&#8984;K</kbd> anywhere inside Velora to jump between modules, switch brand accounts, or run the publishing queue worker in milliseconds.
            </p>
          </div>

          <div class="mkt-bento">
            ${capabilities.map(([ic, title, desc, link]) => `
              <a href="${link}" data-link class="card mkt-feature-card">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                  <div class="mkt-icon-box">${icon(ic, 20)}</div>
                  ${icon("arrowRight", 15)}
                </div>
                <h3 style="font-size:17px;margin-top:4px;">${title}</h3>
                <p style="font-size:13.8px;color:var(--ink-secondary);line-height:1.6;">${desc}</p>
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SECTION 7: INTERACTIVE CREATOR ROI & HOURS-SAVED CALCULATOR -->
      <section class="mkt-section mkt-section-alt">
        <div class="mkt-container">
          <div class="split-2" style="gap:40px;align-items:center;">
            <div>
              <span class="badge badge-brand" style="margin-bottom:12px;">Interactive Impact Estimator</span>
              <h2 class="mkt-h2">See what automated comment-to-DM links unlock every month</h2>
              <p style="font-size:15px;color:var(--ink-secondary);line-height:1.65;margin-bottom:26px;">
                Drag the sliders to match your weekly posting cadence and typical comment volume per post.
              </p>

              <div class="card card-pad" style="display:flex;flex-direction:column;gap:20px;background:var(--bg-page);">
                <div class="field">
                  <div class="field-label" style="font-size:14px;">
                    <span>Posts &amp; Reels published per week</span>
                    <strong id="calc-posts-val" class="tabular">${postsPerWeek} posts / wk</strong>
                  </div>
                  <input type="range" class="v-range" id="calc-posts-slider" min="1" max="21" value="${postsPerWeek}" />
                </div>

                <div class="field">
                  <div class="field-label" style="font-size:14px;">
                    <span>Average keyword comments per post</span>
                    <strong id="calc-comments-val" class="tabular">${commentsPerPost} comments</strong>
                  </div>
                  <input type="range" class="v-range" id="calc-comments-slider" min="10" max="400" step="5" value="${commentsPerPost}" />
                </div>
              </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
              <div class="card card-pad" style="padding:26px;grid-column:span 2;background:var(--bg-inverse);color:var(--ink-inverse);">
                <div style="font-size:12.5px;opacity:0.72;">Estimated High-Intent Link Clicks / Month</div>
                <div id="calc-out-clicks" class="mkt-stat-num" style="color:inherit;margin:8px 0 6px;">${monthlyClicks.toLocaleString()} clicks / mo</div>
                <div style="font-size:13px;opacity:0.8;">vs ~${Math.max(12, Math.round(monthlyDms * 0.045)).toLocaleString()} clicks relying on a passive "link in bio" callout</div>
              </div>
              <div class="card card-pad" style="padding:24px;">
                <div style="font-size:12.5px;color:var(--ink-muted);">Automated DMs Sent / Month</div>
                <div id="calc-out-dms" class="mkt-stat-num" style="margin-top:6px;">${monthlyDms.toLocaleString()}</div>
              </div>
              <div class="card card-pad" style="padding:24px;">
                <div style="font-size:12.5px;color:var(--ink-muted);">Manual Studio Hours Saved</div>
                <div id="calc-out-hours" class="mkt-stat-num" style="margin-top:6px;">${hoursSaved} hrs / mo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 8: CLAUDE DESKTOP & CURSOR MCP DEVELOPER SHOWCASE -->
      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-deep-row">
            <div>
              <span class="badge" style="margin-bottom:14px;">Model Context Protocol &middot; 58 Live Tools</span>
              <h2 class="mkt-h2">Control your entire publishing studio directly from Claude or Cursor.</h2>
              <p style="font-size:15.5px;color:var(--ink-secondary);line-height:1.65;margin-bottom:22px;">
                Velora ships a first-class Streamable HTTP MCP server out of the box. Connect Claude Desktop, Cursor, or your own internal agents to inspect analytics, batch-schedule Reels, swap grid tiles, or dry-run DM rules in seconds.
              </p>
              <div style="display:flex;flex-wrap:wrap;gap:10px;">
                <button type="button" class="btn btn-primary" id="btn-copy-mcp-snippet">${icon("copy", 15)} Copy MCP Config JSON</button>
                <a href="/app/settings" data-link class="btn">Open Interactive MCP Console ${icon("arrowRight", 14)}</a>
              </div>
            </div>

            <div class="card card-pad" style="background:#09090B;color:#FAFAFA;border-color:#27272A;padding:24px;">
              <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #27272A;margin-bottom:14px;">
                <span class="mono" style="color:#A1A1AA;">claude_desktop_config.json</span>
                <span class="badge" style="background:#18181B;color:#34D399;border-color:#27272A;">58 Tools Ready</span>
              </div>
              <pre class="mono" style="margin:0;font-size:12.5px;line-height:1.65;color:#E4E4E7;overflow-x:auto;">{
  "mcpServers": {
    "velora": {
      "url": "https://velora.so/mcp",
      "transport": "streamable-http"
    }
  }
}

// Example prompts in Claude / Cursor:
// 1. "Schedule my 3 draft Reels into next week's 09:30 slots"
// 2. "Create a 6-slide Swiss White carousel on CSS Grid"
// 3. "Sweep past comments matching REPO on @maya.studio"</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- SECTION 9: FREE CREATOR TOOLS SHOWCASE STRIP -->
      <section class="mkt-section mkt-section-alt">
        <div class="mkt-container">
          <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:36px;">
            <div>
              <span class="badge" style="margin-bottom:12px;">Zero Login Required</span>
              <h2 class="mkt-h2">12 free browser-native utilities for everyday publishing</h2>
            </div>
            <a href="/tools" data-link class="btn">View All 12 Creator Tools ${icon("arrowRight", 14)}</a>
          </div>
          <div class="mkt-bento">
            ${(store.bundle.freeTools || []).slice(0, 6).map((t) => `
              <a href="/tools/${escHtml(t.slug)}" data-link class="card mkt-feature-card">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span class="badge">${escHtml(t.category)}</span>
                  ${icon("arrowRight", 14)}
                </div>
                <h3 style="font-size:16.5px;">${escHtml(t.name)}</h3>
                <p style="font-size:13.5px;color:var(--ink-secondary);line-height:1.55;">${escHtml(t.desc)}</p>
              </a>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SECTION 10: CREATOR & STUDIO STORIES -->
      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-sec-head-center">
            <span class="badge" style="margin-bottom:12px;">Creator Studios on Velora</span>
            <h2 class="mkt-h2">Built for teams who care deeply about how their work shows up</h2>
          </div>

          <div class="mkt-quotes-grid">
            ${[
              ["Maya Kapoor", "@maya.studio · Design Systems Educator · 48.2K followers", "Switching from three separate tools to Velora cut our Sunday batch workflow to 40 minutes. Our Figma starter Reels now send over 1,800 resource DMs automatically with a 75% click rate.", "#0F172A"],
              ["Arjun Nair", "@arjun.fit · Strength & Mobility Coach · 92.4K followers", "The Follower Gate alone paid for an entire year in week one. Viewers commenting MOBILITY follow the page, confirm in one tap, and get our training PDF immediately.", "#065F46"],
              ["Koko Takahashi", "@koko.ceramics · Small-Batch Studio · 34.9K followers", "Planning seasonal ceramic drops on the 4:5 Profile Grid means our feed colors always feel intentional. Customers DM KILN on restock Reels and check out before batches sell through.", "#7C2D12"],
              ["Rohan Deshmukh", "@rohan.codes · Indie Founder · 61.0K followers", "Having our sponsorship notes right beside Instagram DMs — plus being able to query post saves from Cursor over MCP — makes Velora feel like Linear for social publishing.", "#1E3A8A"]
            ].map(([name, role, quote, color]) => `
              <div class="card card-pad" style="padding:28px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;">
                <p style="font-size:15px;line-height:1.65;color:var(--ink-primary);">"${quote}"</p>
                <div style="display:flex;align-items:center;gap:12px;padding-top:14px;border-top:1px solid var(--border-subtle);">
                  <span class="ws-avatar" style="width:38px;height:38px;font-size:14px;background:${color};">${name[0]}</span>
                  <div>
                    <div style="font-weight:650;font-size:14px;">${name}</div>
                    <div style="font-size:12.5px;color:var(--ink-muted);">${role}</div>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <!-- SECTION 11: PLANS, PRICING & COMPARISON MATRIX -->
      ${renderPricingSection(false)}

      <!-- SECTION 12: INTERACTIVE FAQ ACCORDION + GRAND CLOSING CTA BANNER -->
      <section class="mkt-section">
        <div class="mkt-container">
          <div class="mkt-sec-head-center">
            <h2 class="mkt-h2">Frequently asked questions</h2>
            <p style="font-size:15px;color:var(--ink-secondary);">Everything about Official Meta API limits, media uploads, pricing, and MCP.</p>
          </div>

          <div class="mkt-faq-list">
            ${faqs.map(([q, a], idx) => {
              const isOpen = openFaq === idx;
              return `
                <div class="card">
                  <button type="button" class="mkt-faq-btn" data-faq-idx="${idx}" aria-expanded="${isOpen}">
                    <span>${escHtml(q)}</span>
                    ${icon(isOpen ? "x" : "plus", 17)}
                  </button>
                  ${isOpen ? `<div class="mkt-faq-answer">${escHtml(a)}</div>` : ""}
                </div>
              `;
            }).join("")}
          </div>

          <!-- Grand Contrast Closing Banner -->
          <div class="mkt-cta-banner" style="margin-top:88px;">
            <span class="badge" style="background:rgba(255,255,255,0.14);color:inherit;border-color:transparent;">Ready in 30 seconds &middot; No credit card needed</span>
            <h2 class="mkt-h2" style="color:inherit;max-width:680px;margin-bottom:0;">
              Give your content the calm, reliable studio it deserves.
            </h2>
            <p style="font-size:16px;opacity:0.8;max-width:560px;line-height:1.6;">
              Jump straight into the live sandbox with 4 preloaded creator accounts — or create your own workspace right now.
            </p>
            <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:6px;">
              <a href="/app/overview" data-link class="btn btn-brand btn-lg" style="height:48px;padding:0 28px;">
                Open Interactive Studio ${icon("arrowRight", 16)}
              </a>
              <a href="/sign-up" data-link class="btn btn-lg" style="height:48px;padding:0 24px;background:#FFFFFF;color:#09090B;border-color:#FFFFFF;">
                Create Free Account
              </a>
            </div>
          </div>
        </div>
      </section>
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
    <main class="mkt-container stage-animate" style="padding-top:56px;padding-bottom:84px;">
      <div class="split-2">
        <div>
          <span class="badge badge-brand" style="margin-bottom:14px;">Creator Partner Program</span>
          <h1 class="mkt-h2" style="font-size:38px;">Earn 30% recurring commission or ship sponsored workflow demos</h1>
          <p style="font-size:15.5px;color:var(--ink-secondary);line-height:1.65;margin:14px 0 26px;">
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

        <form id="form-partner-apply" class="card card-pad" style="padding:28px;display:flex;flex-direction:column;gap:14px;">
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
    <main class="mkt-container stage-animate" style="padding-top:56px;padding-bottom:84px;max-width:920px;">
      <h1 class="mkt-h2" style="font-size:36px;margin-bottom:8px;">Velora Product Guide &amp; API Reference</h1>
      <p style="font-size:15.5px;color:var(--ink-secondary);margin-bottom:28px;">
        Everything you need to configure publishing queues, DM rules, and MCP integrations safely.
      </p>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${articles.map(([title, body]) => `
          <article class="card card-pad" style="padding:24px;">
            <h2 style="font-size:18px;margin-bottom:8px;">${title}</h2>
            <p style="font-size:14px;color:var(--ink-secondary);line-height:1.65;">${body}</p>
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
    <main class="mkt-container stage-animate" style="padding:64px 16px 92px;display:flex;justify-content:center;">
      <div class="card card-pad" style="width:100%;max-width:430px;padding:30px;display:flex;flex-direction:column;gap:16px;">
        <div>
          <h1 style="font-size:23px;">${isSignUp ? "Create your Velora account" : "Sign in to Velora"}</h1>
          <p style="font-size:13.5px;color:var(--ink-muted);margin-top:4px;">
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
