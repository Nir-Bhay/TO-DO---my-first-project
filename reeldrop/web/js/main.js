import {
  store,
  apiRequest,
  bootstrapApp,
  registerAccount,
  loginAccount,
  logoutAccount,
  uploadMediaFile,
  resetAllDemoData,
  mcpCall,
  showToast,
  escHtml
} from "./api.js";
import { icon, brandLogo } from "./icons.js";
import {
  renderLandingPage,
  renderPricingPage,
  renderPartnersPage,
  renderDocsPage,
  renderAuthPage
} from "./marketingViews.js";
import { renderFreeToolsPage, bindToolCalculators } from "./freeToolsViews.js";
import {
  renderOverview,
  renderCreatePost,
  renderCalendar,
  renderGridPlanner,
  renderCarouselsStudio
} from "./appViews.js";
import {
  renderAutomations,
  renderInbox,
  renderAnalytics,
  renderSettings
} from "./automationAndInboxViews.js";

const APP_NAV = [
  { id: "overview", path: "/app/overview", label: "Overview", icon: "home", group: "PUBLISHING" },
  { id: "create", path: "/app/create", label: "Create Post", icon: "plusSquare", group: "PUBLISHING" },
  { id: "calendar", path: "/app/calendar", label: "Calendar", icon: "calendar", group: "PUBLISHING" },
  { id: "grid", path: "/app/grid", label: "Profile Grid", icon: "grid", group: "PUBLISHING" },
  { id: "carousels", path: "/app/carousels", label: "Carousel Studio", icon: "layers", group: "PUBLISHING" },
  { id: "automations", path: "/app/automations", label: "DM Workflows", icon: "bolt", group: "ENGAGEMENT" },
  { id: "inbox", path: "/app/inbox", label: "Unified Inbox", icon: "inbox", group: "ENGAGEMENT" },
  { id: "analytics", path: "/app/analytics", label: "Analytics", icon: "chart", group: "INSIGHTS" },
  { id: "settings", path: "/app/settings", label: "Settings", icon: "settings", group: "INSIGHTS" }
];

function currentPath() {
  return window.location.pathname || "/";
}

export function navigate(path) {
  if (path !== currentPath()) {
    window.history.pushState({}, "", path);
  }
  store.mobileSidebarOpen = false;
  renderRoute();
}

function toggleTheme() {
  store.theme = store.theme === "dark" ? "light" : "dark";
  localStorage.setItem("velora_theme", store.theme);
  document.documentElement.setAttribute("data-theme", store.theme);
  renderRoute();
}

function renderAppShell(activeRouteId, stageHtml) {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const unreadTotal = b.threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);
  const scheduledCount = b.posts.filter((p) => p.status === "SCHEDULED").length;
  const activeAutoCount = b.automations.filter((a) => a.status === "active").length;
  const isDark = store.theme === "dark";

  const renderGroup = (grp, title) => `
    <div class="nav-group-label">${title}</div>
    ${APP_NAV.filter((n) => n.group === grp).map((n) => {
      let badgeHtml = "";
      if (n.id === "inbox" && unreadTotal > 0) badgeHtml = `<span class="nav-count is-alert">${unreadTotal}</span>`;
      else if (n.id === "calendar" && scheduledCount > 0) badgeHtml = `<span class="nav-count">${scheduledCount}</span>`;
      else if (n.id === "automations" && activeAutoCount > 0) badgeHtml = `<span class="nav-count">${activeAutoCount}</span>`;
      return `
        <a href="${n.path}" data-link class="nav-item ${activeRouteId === n.id ? "is-active" : ""}">
          <span class="nav-item-left">${icon(n.icon, 17)}<span>${n.label}</span></span>
          ${badgeHtml}
        </a>
      `;
    }).join("")}
  `;

  return `
    <div class="app-shell">
      ${store.mobileSidebarOpen ? `<div class="mobile-sidebar-backdrop" id="mobile-sidebar-close"></div>` : ""}
      <aside class="app-sidebar ${store.mobileSidebarOpen ? "is-open" : ""}">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 6px;">
            <a href="/" data-link>${brandLogo(true)}</a>
            <span class="badge">${escHtml(ws.planSpec.name)}</span>
          </div>

          <div style="margin:12px 0 10px;">
            <select class="select" id="workspace-select" aria-label="Switch workspace" style="font-weight:600;">
              ${b.workspaces.map((w) => `
                <option value="${escHtml(w.id)}" ${w.id === ws.id ? "selected" : ""}>
                  @${escHtml(w.ig_handle)} (${escHtml(w.planSpec.name)})
                </option>
              `).join("")}
            </select>
          </div>

          ${renderGroup("PUBLISHING", "Publishing")}
          ${renderGroup("ENGAGEMENT", "Engagement")}
          ${renderGroup("INSIGHTS", "Workspace")}
        </div>

        <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
          <a href="/tools" data-link class="nav-item">
            <span class="nav-item-left">${icon("wand", 16)}<span>Creator Tools</span></span>
            ${icon("external", 13)}
          </a>
          <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 8px;font-size:12px;color:var(--ink-muted);">
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(store.currentUser?.email || "maya@velora.so")}</span>
            ${store.currentUser ? `<button class="btn btn-sm btn-ghost" id="btn-logout" style="height:24px;padding:0 6px;">Sign out</button>` : ""}
          </div>
        </div>
      </aside>

      <div class="app-main-col">
        <header class="app-topbar">
          <div class="topbar-left">
            <button class="icon-btn mobile-menu-trigger" id="btn-mobile-sidebar" aria-label="Open menu">
              ${icon("menu", 18)}
            </button>
            <button class="cmd-trigger" id="btn-open-palette">
              <span style="display:flex;align-items:center;gap:7px;">
                ${icon("search", 15)}
                <span class="cmd-trigger-text">Quick jump or run action...</span>
              </span>
              <span class="kbd">&#8984;K</span>
            </button>
          </div>

          <div style="display:flex;align-items:center;gap:8px;">
            <button class="icon-btn" id="btn-theme-toggle" title="Switch light/dark theme" aria-label="Switch theme">
              ${icon(isDark ? "sun" : "moon", 16)}
            </button>
            <a href="/app/create" data-link class="btn btn-primary btn-sm">
              ${icon("plus", 14)} New Post
            </a>
          </div>
        </header>

        <main class="app-stage" id="velora-app-stage">
          ${stageHtml}
        </main>
      </div>

      <nav class="mobile-bottom-nav" aria-label="Mobile Quick Navigation">
        ${[
          ["overview", "/app/overview", "Home", "home"],
          ["create", "/app/create", "Create", "plusSquare"],
          ["calendar", "/app/calendar", "Calendar", "calendar"],
          ["inbox", "/app/inbox", "Inbox", "inbox"]
        ].map(([id, p, lbl, ic]) => `
          <a href="${p}" data-link class="mobile-tab-btn ${activeRouteId === id ? "is-active" : ""}">
            ${icon(ic, 18)}<span>${lbl}</span>
          </a>
        `).join("")}
        <button type="button" class="mobile-tab-btn" id="btn-mobile-more">
          ${icon("menu", 18)}<span>More</span>
        </button>
      </nav>
    </div>
  `;
}

export function renderRoute() {
  if (!store.bundle) return;
  const root = document.getElementById("velora-root");
  const path = currentPath();

  // Redirect legacy aliases seamlessly
  if (path === "/app" || path === "/app/") {
    window.history.replaceState({}, "", "/app/overview");
    return renderRoute();
  }
  if (path === "/app/scheduler") {
    window.history.replaceState({}, "", "/app/calendar");
    return renderRoute();
  }
  if (path === "/free-tools") {
    window.history.replaceState({}, "", "/tools");
    return renderRoute();
  }

  if (path.startsWith("/app/")) {
    const seg = path.split("/")[2] || "overview";
    let stageHtml = "";
    switch (seg) {
      case "create": stageHtml = renderCreatePost(); break;
      case "calendar": stageHtml = renderCalendar(); break;
      case "grid": stageHtml = renderGridPlanner(); break;
      case "carousels": stageHtml = renderCarouselsStudio(); break;
      case "automations": stageHtml = renderAutomations(); break;
      case "inbox": stageHtml = renderInbox(); break;
      case "analytics": stageHtml = renderAnalytics(); break;
      case "settings": stageHtml = renderSettings(); break;
      default: stageHtml = renderOverview(); break;
    }

    // Persistent shell smooth update when already inside /app/*
    const existingStage = document.getElementById("velora-app-stage");
    if (existingStage && !document.querySelector(".mkt-nav")) {
      root.innerHTML = renderAppShell(seg, stageHtml);
    } else {
      root.innerHTML = renderAppShell(seg, stageHtml);
    }
    bindAppInteractions();
    const inboxScroll = document.getElementById("inbox-msg-scroll");
    if (inboxScroll) inboxScroll.scrollTop = inboxScroll.scrollHeight;
    return;
  }

  // Marketing & Auth Routes
  if (path === "/pricing") root.innerHTML = renderPricingPage();
  else if (path === "/partners" || path === "/campaigns") root.innerHTML = renderPartnersPage();
  else if (path.startsWith("/docs")) root.innerHTML = renderDocsPage();
  else if (path === "/sign-in") root.innerHTML = renderAuthPage("sign-in");
  else if (path === "/sign-up") root.innerHTML = renderAuthPage("sign-up");
  else if (path.startsWith("/tools")) {
    const slug = path.split("/")[2] || null;
    root.innerHTML = renderFreeToolsPage(slug);
    bindToolCalculators();
  } else {
    root.innerHTML = renderLandingPage();
  }

  window.scrollTo({ top: 0 });
  bindMarketingInteractions();
}

/* ============================================================================
   SLIDE-OVER POST INSPECTOR & NEW WORKFLOW DRAWERS
   ============================================================================ */
function openPostInspectorDrawer(postId) {
  const post = store.bundle.posts.find((p) => p.id === postId);
  if (!post) return;
  const drawerRoot = document.getElementById("velora-drawer-root");
  drawerRoot.innerHTML = `
    <div class="drawer-backdrop" id="drawer-close-bg">
      <div class="drawer-panel">
        <div class="card-header">
          <div>
            <div class="card-title">Post Inspector</div>
            <div class="card-sub">${escHtml(post.media_type)} &middot; ${escHtml(post.status)}</div>
          </div>
          <button class="icon-btn" id="btn-close-drawer">${icon("x", 16)}</button>
        </div>
        <form id="form-drawer-post" data-post-id="${escHtml(post.id)}" class="drawer-body">
          <div class="field">
            <label class="field-label">Post Title</label>
            <input class="input" name="title" value="${escHtml(post.title)}" required />
          </div>
          <div class="field">
            <label class="field-label">Scheduled Date &amp; Time</label>
            <input class="input" type="datetime-local" name="scheduledAt" value="${escHtml(new Date(post.scheduled_at).toISOString().slice(0, 16))}" />
          </div>
          <div class="field">
            <label class="field-label">Caption</label>
            <textarea class="textarea" name="caption" rows="5">${escHtml(post.caption || "")}</textarea>
          </div>
          <div class="field">
            <label class="field-label">Hashtags</label>
            <input class="input" name="hashtags" value="${escHtml(post.hashtags || "")}" />
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;padding-top:8px;">
            ${post.status !== "PUBLISHED" ? `<button type="button" class="btn btn-brand btn-sm" id="drawer-publish-now">Publish Immediately</button>` : ""}
            <button type="button" class="btn btn-sm" id="drawer-duplicate-post">${icon("copy", 13)} Duplicate</button>
            <button type="button" class="btn btn-sm btn-danger" id="drawer-delete-post">${icon("trash", 13)} Delete</button>
          </div>
          <div class="drawer-foot" style="padding:14px 0 0;margin-top:auto;">
            <button type="button" class="btn" id="btn-cancel-drawer">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { drawerRoot.innerHTML = ""; };
  document.getElementById("btn-close-drawer")?.addEventListener("click", close);
  document.getElementById("btn-cancel-drawer")?.addEventListener("click", close);
  document.getElementById("drawer-close-bg")?.addEventListener("click", (e) => {
    if (e.target.id === "drawer-close-bg") close();
  });

  document.getElementById("form-drawer-post")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/posts/update", "POST", {
      postId: post.id,
      title: fd.get("title"),
      caption: fd.get("caption"),
      hashtags: fd.get("hashtags"),
      scheduledAt: new Date(fd.get("scheduledAt")).toISOString()
    });
    close();
    showToast("Post updated");
    renderRoute();
  });

  document.getElementById("drawer-publish-now")?.addEventListener("click", async () => {
    await apiRequest("/api/posts/update", "POST", { postId: post.id, action: "publish_now" });
    close();
    showToast("Post published live");
    renderRoute();
  });

  document.getElementById("drawer-duplicate-post")?.addEventListener("click", async () => {
    await apiRequest("/api/posts/update", "POST", { postId: post.id, action: "duplicate" });
    close();
    showToast("Duplicated post to Drafts");
    renderRoute();
  });

  document.getElementById("drawer-delete-post")?.addEventListener("click", async () => {
    await apiRequest("/api/posts/update", "POST", { postId: post.id, action: "delete" });
    close();
    showToast("Post deleted");
    renderRoute();
  });
}

function openNewWorkflowDrawer() {
  const drawerRoot = document.getElementById("velora-drawer-root");
  drawerRoot.innerHTML = `
    <div class="drawer-backdrop" id="drawer-close-bg">
      <div class="drawer-panel">
        <div class="card-header">
          <div>
            <div class="card-title">New DM Workflow</div>
            <div class="card-sub">Official Instagram Messenger API rule</div>
          </div>
          <button class="icon-btn" id="btn-close-drawer">${icon("x", 16)}</button>
        </div>
        <form id="form-new-workflow" class="drawer-body">
          <div class="field">
            <label class="field-label">Workflow Name</label>
            <input class="input" name="name" required placeholder="Figma UI Kit Comment Link" />
          </div>
          <div class="field">
            <label class="field-label">Trigger Channel</label>
            <select class="select" name="trigger_type">
              <option value="comment">Post or Reel Comment Keyword</option>
              <option value="story_reply">Story Reply Keyword</option>
              <option value="dm">Direct Message / Ice Breaker</option>
              <option value="ai_reply">Contextual AI Concierge</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Keywords (comma-separated)</label>
            <input class="input" name="keywords" value="KIT, TEMPLATE, LINK" />
          </div>
          <div class="field">
            <label class="field-label">Public Comment Reply Rotation (one per line)</label>
            <textarea class="textarea" name="variants" rows="2">Just sent the link straight to your DMs!
Check your message requests — sent it right over!</textarea>
          </div>
          <div class="field">
            <label class="field-label">Direct Message Copy</label>
            <textarea class="textarea" name="dm_message" rows="3" required>Here is the exact resource link from my post:</textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1.2fr;gap:10px;">
            <div class="field">
              <label class="field-label">Button Label (&le;20 chars)</label>
              <input class="input" name="btnLabel" maxlength="20" value="Open Resource" />
            </div>
            <div class="field">
              <label class="field-label">Button HTTPS URL</label>
              <input class="input" name="btnUrl" value="https://velora.so/tools" />
            </div>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;">
            <input type="checkbox" name="follow_gate" /> Require user to follow account before sending primary link
          </label>
          <div class="drawer-foot" style="padding:14px 0 0;margin-top:auto;">
            <button type="button" class="btn" id="btn-cancel-drawer">Cancel</button>
            <button type="submit" class="btn btn-primary">Activate Workflow</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const close = () => { drawerRoot.innerHTML = ""; };
  document.getElementById("btn-close-drawer")?.addEventListener("click", close);
  document.getElementById("btn-cancel-drawer")?.addEventListener("click", close);
  document.getElementById("drawer-close-bg")?.addEventListener("click", (e) => {
    if (e.target.id === "drawer-close-bg") close();
  });

  document.getElementById("form-new-workflow")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await apiRequest("/api/automations", "POST", {
        workspaceId: store.activeWorkspaceId,
        name: fd.get("name"),
        trigger_type: fd.get("trigger_type"),
        keywords: String(fd.get("keywords") || "").split(",").map((s) => s.trim()).filter(Boolean),
        public_reply_enabled: true,
        public_reply_variants: String(fd.get("variants") || "").split("\n").map((s) => s.trim()).filter(Boolean),
        follow_gate_enabled: fd.get("follow_gate") === "on",
        dm_message: fd.get("dm_message"),
        buttons: fd.get("btnLabel") ? [{ label: String(fd.get("btnLabel")).slice(0, 20), url: String(fd.get("btnUrl")) }] : []
      });
      close();
      showToast("Workflow activated");
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

/* ============================================================================
   CMD+K COMMAND PALETTE
   ============================================================================ */
function openCommandPalette() {
  const root = document.getElementById("velora-palette-root");
  const actions = [
    ...APP_NAV.map((n) => ({ label: `Go to ${n.label}`, hint: n.path, run: () => navigate(n.path) })),
    ...store.bundle.workspaces.map((w) => ({
      label: `Switch workspace to @${w.ig_handle}`,
      hint: w.planSpec.name,
      run: async () => { await bootstrapApp(w.id); navigate("/app/overview"); }
    })),
    { label: "Toggle Light / Dark Theme", hint: "Appearance", run: () => toggleTheme() },
    {
      label: "Run Queue Auto-Publisher Now",
      hint: "Worker",
      run: async () => {
        const res = await apiRequest("/api/queue/run-worker", "POST", { workspaceId: store.activeWorkspaceId, publishNextScheduled: true });
        showToast(res.publishedCount ? `Published ${res.publishedCount} queued post` : "Queue up to date");
        renderRoute();
      }
    }
  ];

  root.innerHTML = `
    <div class="palette-backdrop" id="palette-bg">
      <div class="palette-box">
        <input class="palette-input" id="palette-search" placeholder="Type a command, page, or @workspace..." autofocus />
        <div class="palette-list" id="palette-list"></div>
      </div>
    </div>
  `;

  const listEl = document.getElementById("palette-list");
  const inputEl = document.getElementById("palette-search");
  const close = () => { root.innerHTML = ""; };

  const paint = (q = "") => {
    const matches = actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
    listEl.innerHTML = matches.map((a, idx) => `
      <button class="palette-item" data-cmd-idx="${idx}">
        <span>${escHtml(a.label)}</span>
        <span style="font-size:11.5px;color:var(--ink-muted);">${escHtml(a.hint)}</span>
      </button>
    `).join("");
    listEl.querySelectorAll("[data-cmd-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = matches[Number(btn.dataset.cmdIdx)];
        close();
        item?.run();
      });
    });
  };

  paint();
  inputEl.focus();
  inputEl.addEventListener("input", () => paint(inputEl.value));
  document.getElementById("palette-bg")?.addEventListener("click", (e) => {
    if (e.target.id === "palette-bg") close();
  });
}

/* ============================================================================
   HIGH-DPI CANVAS PNG SLIDE EXPORT (1080x1350)
   ============================================================================ */
function exportCarouselSlidePng() {
  const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
  if (!deck) return;
  const idx = Math.min(deck.slides.length - 1, Math.max(0, store.ui.selectedSlideIndex || 0));
  const slide = deck.slides[idx];
  const cardEl = document.getElementById("carousel-live-card");
  const bg = cardEl?.dataset.bg || "#FFFFFF";
  const fg = cardEl?.dataset.fg || "#09090B";
  const accent = cardEl?.dataset.accent || "#E11D48";

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = accent;
  ctx.fillRect(96, 360, 96, 10);

  ctx.fillStyle = fg;
  ctx.font = "700 30px sans-serif";
  ctx.fillText(String(slide.badge || `SLIDE ${idx + 1}`).toUpperCase(), 96, 130);

  ctx.font = "800 68px sans-serif";
  const words = String(slide.headline || "").split(" ");
  let line = "";
  let y = 460;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > 880) {
      ctx.fillText(line, 96, y);
      line = w;
      y += 82;
    } else line = test;
  }
  if (line) ctx.fillText(line, 96, y);

  ctx.globalAlpha = 0.82;
  ctx.font = "400 36px sans-serif";
  const bWords = String(slide.body || "").split(" ");
  let bLine = "";
  let by = y + 96;
  for (const w of bWords) {
    const test = bLine ? `${bLine} ${w}` : w;
    if (ctx.measureText(test).width > 880) {
      ctx.fillText(bLine, 96, by);
      bLine = w;
      by += 52;
    } else bLine = test;
  }
  if (bLine) ctx.fillText(bLine, 96, by);

  ctx.globalAlpha = 0.6;
  ctx.font = "600 28px sans-serif";
  ctx.fillText(`@${store.bundle.activeWorkspace.ig_handle}  ·  ${idx + 1}/${deck.slides.length}`, 96, 1250);

  const link = document.createElement("a");
  link.download = `velora-slide-${idx + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast(`Exported 1080x1350 PNG (Slide ${idx + 1})`);
}

/* ============================================================================
   EVENT BINDINGS FOR MARKETING & AUTH PAGES
   ============================================================================ */
function bindMarketingInteractions() {
  document.getElementById("btn-theme-toggle")?.addEventListener("click", toggleTheme);

  document.getElementById("btn-mkt-mobile-menu")?.addEventListener("click", () => {
    const drawerRoot = document.getElementById("velora-drawer-root");
    drawerRoot.innerHTML = `
      <div class="drawer-backdrop" id="mkt-drawer-bg">
        <div class="drawer-panel" style="max-width:290px;">
          <div class="card-header">
            ${brandLogo(true)}
            <button class="icon-btn" id="mkt-drawer-close">${icon("x", 16)}</button>
          </div>
          <div class="drawer-body">
            <a href="/" data-link class="btn" style="justify-content:flex-start;">Product</a>
            <a href="/pricing" data-link class="btn" style="justify-content:flex-start;">Pricing</a>
            <a href="/tools" data-link class="btn" style="justify-content:flex-start;">Creator Tools (12)</a>
            <a href="/partners" data-link class="btn" style="justify-content:flex-start;">Partner Program</a>
            <a href="/docs" data-link class="btn" style="justify-content:flex-start;">Docs &amp; API</a>
            <hr style="border:none;border-top:1px solid var(--border);width:100%;" />
            <a href="/sign-in" data-link class="btn" style="justify-content:center;">Sign In</a>
            <a href="/app/overview" data-link class="btn btn-primary" style="justify-content:center;">Open Studio Demo</a>
          </div>
        </div>
      </div>
    `;
    const close = () => { drawerRoot.innerHTML = ""; };
    document.getElementById("mkt-drawer-close")?.addEventListener("click", close);
    document.getElementById("mkt-drawer-bg")?.addEventListener("click", (e) => {
      if (e.target.id === "mkt-drawer-bg" || e.target.closest("[data-link]")) close();
    });
  });

  document.querySelectorAll("[data-hero-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.heroTab = btn.dataset.heroTab;
      renderRoute();
    });
  });

  document.querySelectorAll("[data-billing]").forEach((btn) => {
    btn.addEventListener("click", () => { store.billing = btn.dataset.billing; renderRoute(); });
  });
  document.querySelectorAll("[data-currency]").forEach((btn) => {
    btn.addEventListener("click", () => { store.currency = btn.dataset.currency; renderRoute(); });
  });
  document.querySelectorAll("[data-try-plan]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/workspaces/switch-plan", "POST", { workspaceId: store.activeWorkspaceId, plan: btn.dataset.tryPlan });
      showToast(`Switched active studio plan to ${btn.dataset.tryPlan.toUpperCase()}`);
      navigate("/app/overview");
    });
  });

  document.querySelectorAll("[data-tool-cat]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.toolsCategory = btn.dataset.toolCat; renderRoute(); });
  });
  document.getElementById("tools-search-input")?.addEventListener("input", (e) => {
    store.ui.toolsSearch = e.target.value;
    renderRoute();
    const next = document.getElementById("tools-search-input");
    if (next) { next.focus(); next.setSelectionRange(next.value.length, next.value.length); }
  });

  document.getElementById("form-partner-apply")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await apiRequest("/api/campaigns/apply", "POST", Object.fromEntries(fd.entries()));
    showToast(res.message);
    e.target.reset();
  });

  document.getElementById("form-auth")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mode = e.target.dataset.mode;
    const fd = new FormData(e.target);
    try {
      if (mode === "sign-up") {
        await registerAccount({ name: fd.get("name"), email: fd.get("email"), password: fd.get("password") });
        showToast("Account created — welcome to Velora!");
      } else {
        await loginAccount({ email: fd.get("email"), password: fd.get("password") });
        showToast("Signed in successfully");
      }
      navigate("/app/overview");
    } catch (err) {
      showToast(err.message, true);
    }
  });
}

/* ============================================================================
   EVENT BINDINGS FOR STUDIO DASHBOARD (/app/*)
   ============================================================================ */
function bindAppInteractions() {
  document.getElementById("btn-theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("btn-open-palette")?.addEventListener("click", openCommandPalette);
  document.getElementById("btn-mobile-sidebar")?.addEventListener("click", () => {
    store.mobileSidebarOpen = true;
    renderRoute();
  });
  document.getElementById("btn-mobile-more")?.addEventListener("click", () => {
    store.mobileSidebarOpen = !store.mobileSidebarOpen;
    renderRoute();
  });
  document.getElementById("mobile-sidebar-close")?.addEventListener("click", () => {
    store.mobileSidebarOpen = false;
    renderRoute();
  });
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    logoutAccount();
    showToast("Signed out");
    navigate("/");
  });

  document.getElementById("workspace-select")?.addEventListener("change", async (e) => {
    await bootstrapApp(e.target.value);
    store.ui.selectedThreadId = null;
    store.ui.selectedCarouselId = null;
    showToast(`Switched workspace to @${store.bundle.activeWorkspace.ig_handle}`);
    renderRoute();
  });

  document.getElementById("btn-run-queue-worker")?.addEventListener("click", async () => {
    const res = await apiRequest("/api/queue/run-worker", "POST", { workspaceId: store.activeWorkspaceId, publishNextScheduled: true });
    showToast(res.publishedCount ? `Published ${res.publishedCount} queued post live` : "All due posts are published");
    renderRoute();
  });

  document.querySelectorAll("[data-inspect-post]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openPostInspectorDrawer(btn.dataset.inspectPost);
    });
  });

  document.querySelectorAll("[data-retry-post]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/posts/update", "POST", { postId: btn.dataset.retryPost, action: "retry" });
      showToast("Container re-queued for publishing");
      renderRoute();
    });
  });

  document.querySelectorAll("[data-publish-post]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/posts/update", "POST", { postId: btn.dataset.publishPost, action: "publish_now" });
      showToast("Post published immediately");
      renderRoute();
    });
  });

  document.querySelectorAll("[data-delete-post]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/posts/update", "POST", { postId: btn.dataset.deletePost, action: "delete" });
      showToast("Post removed");
      renderRoute();
    });
  });

  document.querySelectorAll("[data-jump-thread]").forEach((el) => {
    el.addEventListener("click", () => {
      store.ui.selectedThreadId = el.dataset.jumpThread;
      store.mobileInboxChatOpen = true;
    });
  });

  /* --- CREATE POST COMPOSER --- */
  document.querySelectorAll("[data-composer-type]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.composerMediaType = btn.dataset.composerType; renderRoute(); });
  });
  document.querySelectorAll("[data-cover-style]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.composerCoverStyle = btn.dataset.coverStyle; renderRoute(); });
  });
  document.getElementById("btn-clear-media")?.addEventListener("click", () => {
    store.ui.composerMediaUrl = "";
    renderRoute();
  });
  document.querySelectorAll("[data-pick-asset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const asset = store.bundle.mediaAssets.find((m) => m.id === btn.dataset.pickAsset);
      if (asset) {
        store.ui.composerMediaUrl = asset.url;
        renderRoute();
      }
    });
  });

  const handleFilesUpload = async (fileList) => {
    if (!fileList || !fileList.length) return;
    const file = fileList[0];
    showToast(`Uploading ${file.name}...`);
    try {
      const res = await uploadMediaFile(file, store.activeWorkspaceId);
      store.ui.composerMediaUrl = res.asset.url;
      if (file.type.startsWith("video")) store.ui.composerMediaType = "REEL";
      showToast(`Uploaded ${file.name} (${Math.max(1, Math.round(res.asset.size_bytes / 1024))} KB)`);
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  document.getElementById("composer-file-input")?.addEventListener("change", (e) => handleFilesUpload(e.target.files));
  const dz = document.getElementById("composer-dropzone");
  if (dz) {
    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("is-dragover"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("is-dragover"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("is-dragover");
      handleFilesUpload(e.dataTransfer.files);
    });
  }

  // Live preview sync while typing
  const syncLivePreview = () => {
    store.ui.composerTitle = document.getElementById("comp-title")?.value || "";
    store.ui.composerCoverLabel = document.getElementById("comp-cover-label")?.value || "";
    store.ui.composerCaption = document.getElementById("comp-caption")?.value || "";
    store.ui.composerHashtags = document.getElementById("comp-hashtags")?.value || "";
    const full = `${store.ui.composerCaption}${store.ui.composerHashtags ? `\n\n${store.ui.composerHashtags}` : ""}`;
    const counter = document.getElementById("comp-char-counter");
    if (counter) counter.textContent = `(${full.length} / 2,200)`;
    const lbl = document.getElementById("preview-cover-label");
    if (lbl) lbl.textContent = store.ui.composerCoverLabel;
    const fold = document.getElementById("preview-caption-fold");
    if (fold) {
      fold.innerHTML = `<strong>${escHtml(store.bundle.activeWorkspace.ig_handle)}</strong> ${escHtml(full.slice(0, 125))}${full.length > 125 ? `<span style="color:#A1A1AA;">... more</span>` : ""}`;
    }
  };
  ["comp-title", "comp-cover-label", "comp-caption", "comp-hashtags"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", syncLivePreview);
  });

  document.getElementById("comp-template-select")?.addEventListener("change", (e) => {
    const tpl = store.bundle.templates.find((t) => t.id === e.target.value);
    if (tpl) {
      store.ui.composerCaption = tpl.body;
      if (tpl.hashtags) store.ui.composerHashtags = tpl.hashtags;
      showToast(`Applied template "${tpl.title}"`);
      renderRoute();
    }
  });

  document.getElementById("btn-save-caption-template")?.addEventListener("click", async () => {
    const title = document.getElementById("comp-title")?.value || "Saved Caption";
    const body = document.getElementById("comp-caption")?.value || "";
    const hashtags = document.getElementById("comp-hashtags")?.value || "";
    await apiRequest("/api/templates", "POST", { workspaceId: store.activeWorkspaceId, title, body, hashtags });
    showToast("Saved reusable caption template");
    renderRoute();
  });

  document.getElementById("btn-caption-assist")?.addEventListener("click", async () => {
    try {
      const topic = document.getElementById("comp-title")?.value || "design systems";
      const res = await apiRequest("/api/ai/captions", "POST", { workspaceId: store.activeWorkspaceId, topic, enforceQuota: true });
      const box = document.getElementById("comp-ai-suggestions");
      if (box) {
        box.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px;">
            ${res.captions.slice(0, 2).map((c, idx) => `
              <div style="padding:10px 12px;border-radius:8px;background:var(--bg-subtle);border:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:10px;">
                <span style="font-size:12.5px;">${escHtml(c.hook)}</span>
                <button type="button" class="btn btn-sm" data-use-draft="${idx}">Use</button>
              </div>
            `).join("")}
          </div>
        `;
        box.querySelectorAll("[data-use-draft]").forEach((b2) => {
          b2.addEventListener("click", () => {
            store.ui.composerCaption = res.captions[Number(b2.dataset.useDraft)].body;
            renderRoute();
          });
        });
      }
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById("btn-check-tags")?.addEventListener("click", async () => {
    const text = document.getElementById("comp-hashtags")?.value || "";
    const rep = await apiRequest("/api/ai/hashtags", "POST", { text });
    const el = document.getElementById("comp-hashtag-report");
    if (el) {
      el.innerHTML = `<div class="badge ${rep.flaggedRestricted.length ? "badge-danger" : "badge-success"}">${rep.count} tags checked &middot; ${rep.flaggedRestricted.length ? `Restricted: ${rep.flaggedRestricted.join(", ")}` : "All tags clean & account-safe"}</div>`;
    }
  });

  document.querySelectorAll("[data-quick-slot]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const today = new Date().toISOString().slice(0, 10);
      store.ui.composerScheduledDate = `${today}T${btn.dataset.quickSlot}`;
      renderRoute();
    });
  });

  const submitPost = async (statusOverride = "SCHEDULED") => {
    try {
      await apiRequest("/api/posts", "POST", {
        workspaceId: store.activeWorkspaceId,
        mediaType: store.ui.composerMediaType,
        status: statusOverride,
        title: document.getElementById("comp-title")?.value || "Untitled Post",
        coverLabel: document.getElementById("comp-cover-label")?.value || "",
        coverStyle: store.ui.composerCoverStyle,
        mediaUrl: store.ui.composerMediaUrl,
        caption: document.getElementById("comp-caption")?.value || "",
        hashtags: document.getElementById("comp-hashtags")?.value || "",
        firstComment: document.getElementById("comp-first-comment")?.value || "",
        collabHandle: document.getElementById("comp-collab")?.value || "",
        automationId: document.getElementById("comp-automation")?.value || "",
        isTrialReel: Boolean(document.getElementById("comp-trial-reel")?.checked),
        scheduledAt: new Date(document.getElementById("comp-sched")?.value || Date.now()).toISOString()
      });
      store.ui.composerMediaUrl = "";
      showToast(statusOverride === "PUBLISHED" ? "Published live!" : statusOverride === "DRAFT" ? "Saved to Drafts" : "Scheduled onto Calendar!");
      navigate("/app/calendar");
    } catch (err) {
      showToast(err.message, true);
    }
  };

  document.getElementById("form-create-post")?.addEventListener("submit", (e) => {
    e.preventDefault();
    submitPost("SCHEDULED");
  });
  document.querySelectorAll("[data-submit-post]").forEach((btn) => {
    btn.addEventListener("click", () => submitPost(btn.dataset.submitPost));
  });

  /* --- CALENDAR & DRAG-AND-DROP RESCHEDULING --- */
  document.querySelectorAll("[data-cal-mode]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.calendarMode = btn.dataset.calMode; renderRoute(); });
  });
  document.getElementById("cal-status-filter")?.addEventListener("change", (e) => {
    store.ui.calendarStatus = e.target.value;
    renderRoute();
  });
  document.querySelectorAll("[data-compose-on-date]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      store.ui.composerScheduledDate = `${btn.dataset.composeOnDate}T09:30`;
      navigate("/app/create");
    });
  });

  let draggedPostId = null;
  document.querySelectorAll("[data-drag-post]").forEach((pill) => {
    pill.addEventListener("dragstart", (e) => {
      draggedPostId = pill.dataset.dragPost;
      e.dataTransfer.effectAllowed = "move";
    });
  });
  document.querySelectorAll("[data-cal-date]").forEach((cell) => {
    cell.addEventListener("dragover", (e) => {
      e.preventDefault();
      cell.classList.add("is-drop-target");
    });
    cell.addEventListener("dragleave", () => cell.classList.remove("is-drop-target"));
    cell.addEventListener("drop", async (e) => {
      e.preventDefault();
      cell.classList.remove("is-drop-target");
      if (!draggedPostId) return;
      await apiRequest("/api/posts/reschedule", "POST", { postId: draggedPostId, targetDate: cell.dataset.calDate });
      showToast(`Rescheduled post to ${cell.dataset.calDate}`);
      draggedPostId = null;
      renderRoute();
    });
  });

  /* --- VISUAL PROFILE GRID & DRAG SWAP --- */
  document.querySelectorAll("[data-grid-crop]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/workspaces/settings", "POST", { workspaceId: store.activeWorkspaceId, gridCrop: btn.dataset.gridCrop });
      renderRoute();
    });
  });

  let draggedTileId = null;
  document.querySelectorAll("[data-grid-tile]").forEach((tile) => {
    tile.addEventListener("click", () => {
      store.ui.selectedGridPostId = tile.dataset.gridTile;
      renderRoute();
    });
    tile.addEventListener("dragstart", () => { draggedTileId = tile.dataset.gridTile; });
    tile.addEventListener("dragover", (e) => { e.preventDefault(); tile.classList.add("is-drag-over"); });
    tile.addEventListener("dragleave", () => tile.classList.remove("is-drag-over"));
    tile.addEventListener("drop", async (e) => {
      e.preventDefault();
      tile.classList.remove("is-drag-over");
      const targetId = tile.dataset.gridTile;
      if (draggedTileId && targetId && draggedTileId !== targetId) {
        await apiRequest("/api/posts/swap", "POST", { postAId: draggedTileId, postBId: targetId });
        showToast("Swapped grid positions & scheduled slots");
        renderRoute();
      }
    });
  });

  document.getElementById("grid-tile-cover-upload")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const postId = e.target.dataset.postId;
    if (!file || !postId) return;
    const res = await uploadMediaFile(file, store.activeWorkspaceId);
    await apiRequest("/api/posts/update", "POST", { postId, mediaUrl: res.asset.url });
    showToast("Updated grid cover media");
    renderRoute();
  });

  document.querySelectorAll("[data-save-grid-collab]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const val = document.getElementById("grid-collab-input")?.value || "";
      await apiRequest("/api/posts/update", "POST", { postId: btn.dataset.saveGridCollab, collabHandle: val });
      showToast("Saved collaborator tag");
      renderRoute();
    });
  });

  document.getElementById("form-add-placeholder")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/grid/placeholders", "POST", {
      workspaceId: store.activeWorkspaceId,
      note: fd.get("note"),
      color: fd.get("color")
    });
    showToast("Pinned note tile to top of grid");
    renderRoute();
  });

  document.querySelectorAll("[data-convert-ph]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/grid/placeholders", "POST", { workspaceId: store.activeWorkspaceId, action: "convert", placeholderId: btn.dataset.convertPh });
      showToast("Converted note tile to Draft Post");
      renderRoute();
    });
  });
  document.querySelectorAll("[data-delete-ph]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/grid/placeholders", "POST", { workspaceId: store.activeWorkspaceId, action: "delete", placeholderId: btn.dataset.deletePh });
      renderRoute();
    });
  });

  /* --- CAROUSEL DESIGN STUDIO --- */
  document.getElementById("form-generate-carousel")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await apiRequest("/api/carousels/generate", "POST", {
      workspaceId: store.activeWorkspaceId,
      prompt: fd.get("prompt"),
      themeId: fd.get("themeId"),
      slideCount: Number(fd.get("slideCount"))
    });
    store.ui.selectedCarouselId = res.createdId;
    store.ui.selectedSlideIndex = 0;
    showToast("Created multi-slide carousel deck");
    renderRoute();
  });

  document.querySelectorAll("[data-select-carousel]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.selectedCarouselId = btn.dataset.selectCarousel;
      store.ui.selectedSlideIndex = 0;
      renderRoute();
    });
  });
  document.querySelectorAll("[data-select-slide]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.selectedSlideIndex = Number(btn.dataset.selectSlide);
      renderRoute();
    });
  });

  document.getElementById("btn-export-slide-png")?.addEventListener("click", exportCarouselSlidePng);

  document.getElementById("car-theme-picker")?.addEventListener("change", async (e) => {
    const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
    if (!deck) return;
    await apiRequest("/api/carousels/update", "POST", {
      carouselId: deck.id,
      themeId: e.target.value,
      customBg: "",
      customFg: "",
      customAccent: ""
    });
    renderRoute();
  });

  document.getElementById("car-slide-photo")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
    if (!file || !deck) return;
    const up = await uploadMediaFile(file, store.activeWorkspaceId);
    const slides = structuredClone(deck.slides);
    slides[store.ui.selectedSlideIndex || 0].imageUrl = up.asset.url;
    await apiRequest("/api/carousels/update", "POST", { carouselId: deck.id, slides });
    showToast("Added photo to slide");
    renderRoute();
  });

  document.getElementById("btn-add-slide")?.addEventListener("click", async () => {
    const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
    if (!deck) return;
    const slides = [...deck.slides, { tag: String(deck.slides.length + 1).padStart(2, "0"), headline: "New Slide Takeaway", body: "Add supporting detail here.", badge: `Slide ${deck.slides.length + 1}`, align: "left" }];
    await apiRequest("/api/carousels/update", "POST", { carouselId: deck.id, slides });
    store.ui.selectedSlideIndex = slides.length - 1;
    renderRoute();
  });

  document.getElementById("btn-delete-slide")?.addEventListener("click", async () => {
    const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
    if (!deck || deck.slides.length <= 1) { showToast("Deck must keep at least 1 slide", true); return; }
    const slides = deck.slides.filter((_, idx) => idx !== (store.ui.selectedSlideIndex || 0));
    store.ui.selectedSlideIndex = 0;
    await apiRequest("/api/carousels/update", "POST", { carouselId: deck.id, slides });
    renderRoute();
  });

  document.getElementById("btn-save-carousel")?.addEventListener("click", async () => {
    const deck = store.bundle.carousels.find((c) => c.id === store.ui.selectedCarouselId) || store.bundle.carousels[0];
    if (!deck) return;
    const slides = structuredClone(deck.slides);
    const idx = store.ui.selectedSlideIndex || 0;
    slides[idx].badge = document.getElementById("car-slide-badge")?.value || "";
    slides[idx].headline = document.getElementById("car-slide-headline")?.value || "";
    slides[idx].body = document.getElementById("car-slide-body")?.value || "";
    await apiRequest("/api/carousels/update", "POST", {
      carouselId: deck.id,
      slides,
      customBg: document.getElementById("car-color-bg")?.value || "",
      customFg: document.getElementById("car-color-fg")?.value || "",
      customAccent: document.getElementById("car-color-accent")?.value || ""
    });
    showToast("Saved slide changes");
    renderRoute();
  });

  document.querySelectorAll("[data-schedule-carousel]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const deck = store.bundle.carousels.find((c) => c.id === btn.dataset.scheduleCarousel);
      if (!deck) return;
      await apiRequest("/api/posts", "POST", {
        workspaceId: store.activeWorkspaceId,
        mediaType: "CAROUSEL",
        status: "SCHEDULED",
        title: deck.title,
        coverLabel: deck.title.slice(0, 32).toUpperCase(),
        coverStyle: "cream",
        caption: deck.caption
      });
      showToast("Carousel scheduled to publishing queue!");
      navigate("/app/calendar");
    });
  });

  /* --- DM WORKFLOWS & INTERACTIVE CHAT SIMULATOR --- */
  document.getElementById("btn-open-new-workflow")?.addEventListener("click", openNewWorkflowDrawer);

  document.querySelectorAll("[data-toggle-auto]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/automations/toggle", "POST", { automationId: btn.dataset.toggleAuto });
      renderRoute();
    });
  });
  document.querySelectorAll("[data-delete-auto]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/automations/delete", "POST", { automationId: btn.dataset.deleteAuto });
      showToast("Workflow deleted");
      renderRoute();
    });
  });
  document.querySelectorAll("[data-sweep-auto]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const res = await apiRequest("/api/automations/retrigger", "POST", { workspaceId: store.activeWorkspaceId, automationId: btn.dataset.sweepAuto });
        showToast(`Swept past comments & delivered ${res.swept} DMs`);
        renderRoute();
      } catch (err) {
        showToast(err.message, true);
      }
    });
  });

  document.getElementById("btn-clear-sim")?.addEventListener("click", () => {
    store.ui.chatSimMessages = [];
    renderRoute();
  });

  document.getElementById("form-live-sim")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const autoId = document.getElementById("sim-auto-select")?.value;
    const isFollower = Boolean(document.getElementById("sim-is-follower")?.checked);
    const text = document.getElementById("sim-message-input")?.value || "REPO";

    store.ui.chatSimMessages.push({ role: "user", badge: "Comment / DM from @alex.design", text });
    store.ui.chatSimTyping = true;
    renderRoute();

    try {
      const res = await apiRequest("/api/automations/simulate", "POST", {
        workspaceId: store.activeWorkspaceId,
        automationId: autoId,
        incomingText: text,
        isFollower,
        dryRun: false
      });
      await new Promise((r) => setTimeout(r, 260));
      store.ui.chatSimTyping = false;
      for (const s of res.simulation.steps) {
        store.ui.chatSimMessages.push({
          role: "bot",
          badge: s.type.replace(/_/g, " ").toUpperCase(),
          text: s.text,
          buttons: s.buttons || []
        });
      }
      renderRoute();
      const box = document.getElementById("sim-chat-stream");
      if (box) box.scrollTop = box.scrollHeight;
    } catch (err) {
      store.ui.chatSimTyping = false;
      store.ui.chatSimMessages.push({ role: "bot", badge: "NO KEYWORD MATCH", text: err.message });
      renderRoute();
    }
  });

  /* --- UNIFIED INBOX, CRM NOTES & COMMENTS --- */
  document.querySelectorAll("[data-inbox-tab]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.inboxTab = btn.dataset.inboxTab; renderRoute(); });
  });
  document.querySelectorAll("[data-inbox-filter]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.inboxFilter = btn.dataset.inboxFilter; renderRoute(); });
  });
  document.getElementById("inbox-search-input")?.addEventListener("input", (e) => {
    store.ui.inboxSearch = e.target.value;
    renderRoute();
    const el = document.getElementById("inbox-search-input");
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
  document.querySelectorAll("[data-select-thread]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      store.ui.selectedThreadId = btn.dataset.selectThread;
      store.mobileInboxChatOpen = true;
      await apiRequest("/api/inbox/update-thread", "POST", { workspaceId: store.activeWorkspaceId, threadId: btn.dataset.selectThread, patch: { unread_count: 0 } });
      renderRoute();
    });
  });
  document.getElementById("btn-mobile-back-threads")?.addEventListener("click", () => {
    store.mobileInboxChatOpen = false;
    renderRoute();
  });

  document.querySelectorAll("[data-snippet]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const inp = document.getElementById("inbox-reply-input");
      if (inp) { inp.value = btn.dataset.snippet; inp.focus(); }
    });
  });

  document.getElementById("btn-ai-draft-reply")?.addEventListener("click", async (e) => {
    const res = await apiRequest("/api/inbox/ai-suggest", "POST", { threadId: e.currentTarget.dataset.thread });
    const inp = document.getElementById("inbox-reply-input");
    if (inp) { inp.value = res.draft; inp.focus(); }
  });

  document.getElementById("btn-simulate-incoming")?.addEventListener("click", async (e) => {
    await apiRequest("/api/inbox/reply", "POST", {
      workspaceId: store.activeWorkspaceId,
      threadId: e.currentTarget.dataset.thread,
      simulateUserIncoming: true
    });
    showToast("Simulated fresh incoming user DM (24h window reset)");
    renderRoute();
  });

  document.querySelectorAll("[data-toggle-hot]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const t = store.bundle.threads.find((x) => x.id === btn.dataset.toggleHot);
      await apiRequest("/api/inbox/update-thread", "POST", { workspaceId: store.activeWorkspaceId, threadId: t.id, patch: { is_hot_lead: !t.is_hot_lead } });
      renderRoute();
    });
  });

  document.querySelectorAll("[data-toggle-close]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const t = store.bundle.threads.find((x) => x.id === btn.dataset.toggleClose);
      await apiRequest("/api/inbox/update-thread", "POST", { workspaceId: store.activeWorkspaceId, threadId: t.id, patch: { is_open: !t.is_open } });
      renderRoute();
    });
  });

  document.getElementById("form-inbox-reply")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const inp = document.getElementById("inbox-reply-input");
    if (!inp?.value.trim()) return;
    try {
      await apiRequest("/api/inbox/reply", "POST", {
        workspaceId: store.activeWorkspaceId,
        threadId: e.currentTarget.dataset.thread,
        text: inp.value.trim()
      });
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.getElementById("form-add-thread-tag")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const tag = String(fd.get("tag") || "").trim();
    if (!tag) return;
    const t = store.bundle.threads.find((x) => x.id === e.currentTarget.dataset.thread);
    await apiRequest("/api/inbox/update-thread", "POST", {
      workspaceId: store.activeWorkspaceId,
      threadId: t.id,
      patch: { tags: [...t.tags, tag] }
    });
    renderRoute();
  });

  document.getElementById("btn-save-crm-notes")?.addEventListener("click", async (e) => {
    const notes = document.getElementById("crm-notes-input")?.value || "";
    await apiRequest("/api/inbox/update-thread", "POST", {
      workspaceId: store.activeWorkspaceId,
      threadId: e.currentTarget.dataset.thread,
      patch: { crm_notes: notes }
    });
    showToast("Saved CRM contact notes");
  });

  document.querySelectorAll("[data-comment-dm]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/comments/action", "POST", { workspaceId: store.activeWorkspaceId, commentId: btn.dataset.commentDm, action: "send_dm" });
      showToast("Delivered automated link DM & public reply");
      renderRoute();
    });
  });
  document.querySelectorAll("[data-comment-reply]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/comments/action", "POST", {
        workspaceId: store.activeWorkspaceId,
        commentId: btn.dataset.commentReply,
        action: "reply",
        replyText: "Appreciate you reading through — just sent the full link to your DMs!"
      });
      showToast("Posted public comment reply");
      renderRoute();
    });
  });
  document.querySelectorAll("[data-comment-hide]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/comments/action", "POST", { workspaceId: store.activeWorkspaceId, commentId: btn.dataset.commentHide, action: "hide" });
      showToast("Hidden comment");
      renderRoute();
    });
  });

  /* --- ANALYTICS & SETTINGS --- */
  document.querySelectorAll("[data-analytics-range]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.analyticsRange = btn.dataset.analyticsRange; renderRoute(); });
  });
  document.querySelectorAll("[data-graduate-trial]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/posts/update", "POST", { postId: btn.dataset.graduateTrial, action: "graduate_trial" });
      showToast("Graduated Trial Reel to main profile feed!");
      renderRoute();
    });
  });

  document.querySelectorAll("[data-settings-tab]").forEach((btn) => {
    btn.addEventListener("click", () => { store.ui.settingsTab = btn.dataset.settingsTab; renderRoute(); });
  });

  document.getElementById("form-workspace-general")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/workspaces/settings", "POST", {
      workspaceId: store.activeWorkspaceId,
      name: fd.get("name"),
      igHandle: fd.get("igHandle"),
      bio: fd.get("bio"),
      timezone: fd.get("timezone"),
      postingSlots: String(fd.get("slots") || "").split(",").map((s) => s.trim()).filter(Boolean)
    });
    showToast("Saved workspace preferences");
    renderRoute();
  });

  document.getElementById("form-create-workspace")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/workspaces/create", "POST", { name: fd.get("name"), igHandle: fd.get("igHandle") });
    showToast("Connected new workspace");
    renderRoute();
  });

  document.getElementById("form-invite-member")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/team", "POST", {
      workspaceId: store.activeWorkspaceId,
      name: fd.get("name"),
      email: fd.get("email"),
      role: fd.get("role")
    });
    showToast("Team invitation sent");
    renderRoute();
  });

  document.querySelectorAll("[data-remove-member]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/team", "POST", { workspaceId: store.activeWorkspaceId, action: "remove", memberId: btn.dataset.removeMember });
      renderRoute();
    });
  });

  document.querySelectorAll("[data-switch-ws-plan]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await apiRequest("/api/workspaces/switch-plan", "POST", { workspaceId: store.activeWorkspaceId, plan: btn.dataset.switchWsPlan });
      showToast("Updated workspace subscription tier");
      renderRoute();
    });
  });

  document.getElementById("btn-invoke-mcp")?.addEventListener("click", async () => {
    const name = document.getElementById("mcp-tool-select")?.value || "list_workspaces";
    store.ui.mcpSelectedTool = name;
    let args = {};
    try { args = JSON.parse(document.getElementById("mcp-args-input")?.value || "{}"); } catch {}
    const res = await mcpCall("tools/call", { name, arguments: args });
    store.ui.mcpLastResponse = res;
    renderRoute();
  });

  document.getElementById("btn-export-json")?.addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(store.bundle.serverStateSnapshot, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `velora-workspace-backup-${store.activeWorkspaceId}.json`;
    a.click();
    showToast("Downloaded workspace JSON backup");
  });

  document.getElementById("btn-reset-demo")?.addEventListener("click", async () => {
    await resetAllDemoData();
    showToast("Reset database to clean seed state");
    renderRoute();
  });
}

/* ============================================================================
   GLOBAL ROUTER, CMD+K SHORTCUT & BOOTSTRAP
   ============================================================================ */
document.addEventListener("click", (e) => {
  const link = e.target.closest("[data-link]");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("http")) return;
  e.preventDefault();
  navigate(href);
});

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openCommandPalette();
  }
  if (e.key === "Escape") {
    document.getElementById("velora-palette-root").innerHTML = "";
    document.getElementById("velora-drawer-root").innerHTML = "";
  }
});

window.addEventListener("popstate", renderRoute);

(async function init() {
  try {
    await bootstrapApp(store.activeWorkspaceId);
    renderRoute();
  } catch (err) {
    document.getElementById("velora-root").innerHTML = `
      <div style="padding:48px;text-align:center;">
        <h2>Starting Velora Studio...</h2>
        <p style="color:var(--ink-muted);margin-top:8px;">${escHtml(err.message)}</p>
      </div>
    `;
  }
})();
