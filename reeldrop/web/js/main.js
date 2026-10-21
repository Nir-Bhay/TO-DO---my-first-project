import {
  store,
  apiRequest,
  bootstrapApp,
  registerAccount,
  loginAccount,
  logoutAccount,
  uploadMediaFile,
  inspectImageDimensions,
  renderCroppedStudioImage,
  generateAiVisualCardDataUrl,
  resetAllDemoData,
  switchDataMode,
  mcpCall,
  showToast,
  escHtml
} from "./api.js";
import { icon, brandLogo } from "./icons.js";
import {
  renderLandingPage,
  renderHeroShowcaseMain,
  renderLandingPhoneChatMessages,
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
  renderRoute({ resetScroll: true });
}

function toggleTheme() {
  store.theme = store.theme === "dark" ? "light" : "dark";
  localStorage.setItem("velora_theme", store.theme);
  document.documentElement.setAttribute("data-theme", store.theme);
  renderRoute({ forceShell: true });
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

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <div class="segmented" title="Toggle between populated sample data and clean unconnected state">
              <button type="button" class="seg-btn ${b.dataMode !== "empty" ? "is-active" : ""}" data-switch-mode="sample">With Data</button>
              <button type="button" class="seg-btn ${b.dataMode === "empty" ? "is-active" : ""}" data-switch-mode="empty">Without Data</button>
            </div>
            <a href="/" data-link class="btn btn-sm mkt-hide-mobile">Landing Page</a>
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

let lastRenderedRoutePath = "";

export function renderRoute(opts = {}) {
  if (!store.bundle) return;
  const resetScroll = Boolean(opts && opts.resetScroll);
  const forceShell = Boolean(opts && opts.forceShell);
  const savedScrollY = window.scrollY;
  const root = document.getElementById("velora-root");
  const path = currentPath();

  // Redirect legacy aliases seamlessly
  if (path === "/app" || path === "/app/") {
    window.history.replaceState({}, "", "/app/overview");
    return renderRoute(opts);
  }
  if (path === "/app/scheduler") {
    window.history.replaceState({}, "", "/app/calendar");
    return renderRoute(opts);
  }
  if (path === "/free-tools") {
    window.history.replaceState({}, "", "/tools");
    return renderRoute(opts);
  }

  const isRouteChange = path !== lastRenderedRoutePath;
  lastRenderedRoutePath = path;

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

    // Persistent shell smooth update when already inside /app/* (zero sidebar flash / zero page jank)
    const existingStage = document.getElementById("velora-app-stage");
    if (existingStage && !document.querySelector(".mkt-nav") && !forceShell) {
      existingStage.innerHTML = stageHtml;
      if (!isRouteChange && existingStage.firstElementChild) {
        existingStage.firstElementChild.classList.remove("stage-animate");
      }
      document.querySelectorAll(".app-sidebar .nav-item[href^='/app/']").forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `/app/${seg}`);
      });
      document.querySelectorAll(".mobile-bottom-nav .mobile-tab-btn[href^='/app/']").forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `/app/${seg}`);
      });
    } else {
      root.innerHTML = renderAppShell(seg, stageHtml);
      bindShellChromeInteractions();
    }

    bindAppInteractions();
    const inboxScroll = document.getElementById("inbox-msg-scroll");
    if (inboxScroll) inboxScroll.scrollTop = inboxScroll.scrollHeight;
    if (resetScroll) window.scrollTo({ top: 0 });
    else if (!isRouteChange) window.scrollTo({ top: savedScrollY });
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

  if (!isRouteChange && root.querySelector("main.stage-animate")) {
    root.querySelector("main.stage-animate").classList.remove("stage-animate");
  }
  if (resetScroll) window.scrollTo({ top: 0 });
  else if (!isRouteChange) window.scrollTo({ top: savedScrollY });
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

  const bindHeroInnerControls = () => {
    document.querySelectorAll("[data-landing-sim]").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.ui.landingSimScenario = btn.dataset.landingSim;
        const vp = document.getElementById("hero-showcase-viewport");
        if (vp) {
          vp.innerHTML = renderHeroShowcaseMain();
          bindHeroInnerControls();
        }
      });
    });

    document.querySelectorAll("[data-landing-crop]").forEach((btn) => {
      btn.addEventListener("click", () => {
        store.ui.landingGridCrop = btn.dataset.landingCrop;
        const vp = document.getElementById("hero-showcase-viewport");
        if (vp) {
          vp.innerHTML = renderHeroShowcaseMain();
          bindHeroInnerControls();
        }
      });
    });
  };

  document.querySelectorAll("[data-hero-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.heroTab = btn.dataset.heroTab;
      document.querySelectorAll("[data-hero-tab]").forEach((b2) => {
        b2.classList.toggle("is-active", b2.dataset.heroTab === store.ui.heroTab);
      });
      const vp = document.getElementById("hero-showcase-viewport");
      if (vp) {
        vp.innerHTML = renderHeroShowcaseMain();
        bindHeroInnerControls();
      }
    });
  });

  bindHeroInnerControls();

  document.querySelectorAll("[data-landing-theme]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.landingThemeId = btn.dataset.landingTheme;
      renderRoute();
    });
  });

  document.querySelectorAll("[data-faq-idx]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.faqIdx);
      store.ui.openFaqIdx = store.ui.openFaqIdx === idx ? -1 : idx;
      renderRoute();
    });
  });

  const postsSlider = document.getElementById("calc-posts-slider");
  const commentsSlider = document.getElementById("calc-comments-slider");
  if (postsSlider && commentsSlider) {
    const syncCalc = () => {
      const p = Number(postsSlider.value || 6);
      const c = Number(commentsSlider.value || 85);
      store.ui.calcPostsPerWeek = p;
      store.ui.calcCommentsPerPost = c;
      const dms = p * 4 * c;
      const clicks = Math.round(dms * 0.74);
      const hrs = Math.max(4, Math.round((dms * 0.45) / 60 + p * 1.2));
      const pv = document.getElementById("calc-posts-val");
      const cv = document.getElementById("calc-comments-val");
      const oc = document.getElementById("calc-out-clicks");
      const od = document.getElementById("calc-out-dms");
      const oh = document.getElementById("calc-out-hours");
      if (pv) pv.textContent = `${p} posts / wk`;
      if (cv) cv.textContent = `${c} comments`;
      if (oc) oc.textContent = `${clicks.toLocaleString()} clicks / mo`;
      if (od) od.textContent = dms.toLocaleString();
      if (oh) oh.textContent = `${hrs} hrs / mo`;
    };
    postsSlider.addEventListener("input", syncCalc);
    commentsSlider.addEventListener("input", syncCalc);
  }

  const sendLandingDemoMsg = (rawText) => {
    const clean = String(rawText || "KIT").trim();
    if (!clean) return;
    const up = clean.toUpperCase();
    let reply = {
      role: "me",
      badge: "Official Messenger API · 0.5s",
      text: "Here is the complete creator resource pack + Notion checklist mentioned in my post:",
      cta: "Open Full Resource Pack ->"
    };
    if (up.includes("RATE")) {
      reply = {
        role: "me",
        badge: "Auto Sponsorship Concierge",
        text: "Thanks for reaching out! Here is our live Q4 Sponsorship Rate Card & available creator slots:",
        cta: "View Media Kit & Rates ->"
      };
    } else if (up.includes("REPO") || up.includes("KIT")) {
      reply = {
        role: "me",
        badge: "Auto-Sent + Public Reply Rotated",
        text: `Got your "${clean}" trigger! Here is the direct Figma + GitHub starter kit link:`,
        cta: "Download Starter Kit ->"
      };
    }
    store.ui.landingChatMsgs = [
      ...(store.ui.landingChatMsgs || []),
      { role: "them", badge: "You commented / DMed", text: clean },
      reply
    ];
    const box = document.getElementById("landing-phone-chat-list");
    if (box) {
      box.innerHTML = renderLandingPhoneChatMessages();
      box.scrollTop = box.scrollHeight;
    } else {
      renderRoute();
    }
  };

  document.querySelectorAll("[data-landing-quick-kw]").forEach((btn) => {
    btn.addEventListener("click", () => sendLandingDemoMsg(btn.dataset.landingQuickKw));
  });

  document.getElementById("form-landing-phone-chat")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = document.getElementById("landing-phone-input");
    sendLandingDemoMsg(inp?.value || "KIT");
  });

  document.getElementById("btn-copy-mcp-snippet")?.addEventListener("click", async () => {
    const snippet = JSON.stringify({
      mcpServers: { velora: { url: `${window.location.origin}/mcp`, transport: "streamable-http" } }
    }, null, 2);
    try { await navigator.clipboard?.writeText(snippet); } catch {}
    showToast("Copied Claude / Cursor MCP config JSON");
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
   EVENT BINDINGS FOR PERSISTENT SHELL CHROME + STUDIO STAGE (/app/*)
   ============================================================================ */
function bindShellChromeInteractions() {
  document.getElementById("btn-theme-toggle")?.addEventListener("click", toggleTheme);
  document.getElementById("btn-open-palette")?.addEventListener("click", openCommandPalette);
  document.getElementById("btn-mobile-sidebar")?.addEventListener("click", () => {
    store.mobileSidebarOpen = true;
    renderRoute({ forceShell: true });
  });
  document.getElementById("btn-mobile-more")?.addEventListener("click", () => {
    store.mobileSidebarOpen = !store.mobileSidebarOpen;
    renderRoute({ forceShell: true });
  });
  document.getElementById("mobile-sidebar-close")?.addEventListener("click", () => {
    store.mobileSidebarOpen = false;
    renderRoute({ forceShell: true });
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
    renderRoute({ forceShell: true });
  });
}

function bindAppInteractions() {

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

  /* --- CREATE POST COMPOSER: AI CO-PILOT, UPLOAD PROGRESS & CROP STUDIO --- */
  document.querySelectorAll("[data-composer-type]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.composerMediaType = btn.dataset.composerType;
      if (btn.dataset.composerType === "REEL" || btn.dataset.composerType === "STORY") {
        store.ui.composerAspect = "9:16";
        store.ui.composerPreviewTab = "reel";
      } else {
        store.ui.composerAspect = "4:5";
        store.ui.composerPreviewTab = "feed";
      }
      renderRoute();
    });
  });

  document.querySelectorAll("[data-quick-aspect]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.composerAspect = btn.dataset.quickAspect;
      store.ui.composerPreviewTab = btn.dataset.quickAspect === "9:16" ? "reel" : "feed";
      renderRoute();
    });
  });

  document.querySelectorAll("[data-quick-fit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.composerMediaFit = btn.dataset.quickFit;
      renderRoute();
    });
  });

  document.querySelectorAll("[data-preview-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.composerPreviewTab = btn.dataset.previewMode;
      renderRoute();
    });
  });

  document.getElementById("btn-toggle-preview-fold")?.addEventListener("click", () => {
    store.ui.composerCaptionExpanded = !store.ui.composerCaptionExpanded;
    renderRoute();
  });

  document.querySelectorAll("[data-pick-preset-media]").forEach((btn) => {
    btn.addEventListener("click", () => {
      store.ui.composerMediaUrl = btn.dataset.pickPresetMedia;
      store.ui.composerMediaDims = "1080 x 1350 px · 4:5 Studio Art";
      store.ui.composerMediaFit = "cover";
      renderRoute();
    });
  });

  document.getElementById("btn-clear-media")?.addEventListener("click", () => {
    store.ui.composerMediaUrl = "";
    store.ui.composerMediaDims = "";
    renderRoute();
  });

  document.querySelectorAll("[data-pick-asset]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const asset = store.bundle.mediaAssets.find((m) => m.id === btn.dataset.pickAsset);
      if (asset) {
        store.ui.composerMediaUrl = asset.url;
        if (!asset.mime_type.startsWith("video")) {
          const d = await inspectImageDimensions(asset.url);
          store.ui.composerMediaDims = `${d.width} x ${d.height} px`;
          store.ui.composerMediaFit = d.width > d.height ? "contain" : "cover";
        }
        renderRoute();
      }
    });
  });

  const handleFilesUpload = async (fileList) => {
    if (!fileList || !fileList.length) return;
    const files = Array.from(fileList);
    const file = files[0];
    const renderProgress = (pct, label) => {
      const slot = document.getElementById("composer-upload-progress-slot");
      if (slot) {
        slot.innerHTML = `
          <div class="upload-progress-card" style="margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--brand);">
              <span>${escHtml(label)}</span>
              <span class="mono">${pct}%</span>
            </div>
            <div class="upload-progress-track">
              <div class="upload-progress-fill" style="width:${pct}%;"></div>
            </div>
          </div>
        `;
      }
    };

    try {
      const res = await uploadMediaFile(file, store.activeWorkspaceId, renderProgress);
      store.ui.composerMediaUrl = res.asset.url;
      if (file.type.startsWith("video")) {
        store.ui.composerMediaType = "REEL";
        store.ui.composerAspect = "9:16";
        store.ui.composerMediaDims = "Video Asset Ready";
      } else {
        const isLandscape = res.width > res.height;
        store.ui.composerMediaDims = `${res.width} x ${res.height} px${isLandscape ? " · Smart Fit Active" : ""}`;
        store.ui.composerMediaFit = isLandscape ? "contain" : "cover";
      }
      if (files.length > 1) {
        store.ui.composerSlidesMedia = [res.asset.url];
        for (const extra of files.slice(1, 6)) {
          const up2 = await uploadMediaFile(extra, store.activeWorkspaceId, renderProgress);
          store.ui.composerSlidesMedia.push(up2.asset.url);
        }
        store.ui.composerMediaType = "CAROUSEL";
      }
      showToast(`Uploaded ${file.name} (${res.width}x${res.height}px) — click Resize & Crop Studio anytime`);
      renderRoute();
    } catch (err) {
      store.ui.uploadProgress = { active: false, pct: 0, label: "" };
      showToast(err.message, true);
      renderRoute();
    }
  };

  // Interactive <canvas> Resize & Aspect-Ratio Crop Studio Modal Bindings
  const refreshCropLiveCanvas = async () => {
    const cs = store.ui.cropStudio;
    if (!cs.open || !cs.srcUrl) return;
    try {
      const out = await renderCroppedStudioImage(cs);
      cs.previewUrl = out.dataUrl;
      const imgEl = document.getElementById("crop-live-preview-img");
      if (imgEl) imgEl.src = out.dataUrl;
    } catch {}
  };

  document.getElementById("btn-open-crop-studio")?.addEventListener("click", async () => {
    const src = store.ui.composerMediaUrl || "/media/post-01.svg";
    const dims = await inspectImageDimensions(src);
    store.ui.cropStudio = {
      open: true,
      srcUrl: src,
      previewUrl: src,
      origW: dims.width,
      origH: dims.height,
      aspect: store.ui.composerAspect || "4:5",
      fitMode: dims.width > dims.height ? "contain" : store.ui.composerMediaFit || "contain",
      bgStyle: "blur",
      zoom: 100,
      panX: 0,
      panY: 0,
      padding: 44
    };
    const out = await renderCroppedStudioImage(store.ui.cropStudio);
    store.ui.cropStudio.previewUrl = out.dataUrl;
    renderRoute();
  });

  document.getElementById("btn-close-crop-modal")?.addEventListener("click", () => {
    store.ui.cropStudio.open = false;
    renderRoute();
  });
  document.getElementById("crop-modal-backdrop")?.addEventListener("click", (e) => {
    if (e.target.id === "crop-modal-backdrop") {
      store.ui.cropStudio.open = false;
      renderRoute();
    }
  });
  document.querySelectorAll("[data-crop-aspect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      store.ui.cropStudio.aspect = btn.dataset.cropAspect;
      await refreshCropLiveCanvas();
      renderRoute();
    });
  });
  document.querySelectorAll("[data-crop-fit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      store.ui.cropStudio.fitMode = btn.dataset.cropFit;
      await refreshCropLiveCanvas();
      renderRoute();
    });
  });
  document.querySelectorAll("[data-crop-bg]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      store.ui.cropStudio.bgStyle = btn.dataset.cropBg;
      await refreshCropLiveCanvas();
      renderRoute();
    });
  });
  document.getElementById("crop-zoom-slider")?.addEventListener("input", (e) => {
    store.ui.cropStudio.zoom = Number(e.target.value);
    const v = document.getElementById("crop-zoom-val");
    if (v) v.textContent = `${e.target.value}%`;
    refreshCropLiveCanvas();
  });
  document.getElementById("crop-panx-slider")?.addEventListener("input", (e) => {
    store.ui.cropStudio.panX = Number(e.target.value);
    const v = document.getElementById("crop-panx-val");
    if (v) v.textContent = `${e.target.value}%`;
    refreshCropLiveCanvas();
  });
  document.getElementById("crop-pany-slider")?.addEventListener("input", (e) => {
    store.ui.cropStudio.panY = Number(e.target.value);
    const v = document.getElementById("crop-pany-val");
    if (v) v.textContent = `${e.target.value}%`;
    refreshCropLiveCanvas();
  });
  document.getElementById("btn-reset-crop")?.addEventListener("click", async () => {
    store.ui.cropStudio.zoom = 100;
    store.ui.cropStudio.panX = 0;
    store.ui.cropStudio.panY = 0;
    await refreshCropLiveCanvas();
    renderRoute();
  });
  document.getElementById("btn-apply-crop")?.addEventListener("click", async () => {
    try {
      const rendered = await renderCroppedStudioImage(store.ui.cropStudio);
      const uploaded = await apiRequest("/api/media/upload", "POST", {
        workspaceId: store.activeWorkspaceId,
        filename: `cropped-${store.ui.cropStudio.aspect.replace(":", "x")}.png`,
        mimeType: "image/png",
        dataUrl: rendered.dataUrl
      });
      store.ui.composerMediaUrl = uploaded.asset.url;
      store.ui.composerAspect = store.ui.cropStudio.aspect;
      store.ui.composerMediaFit = "cover";
      store.ui.composerMediaDims = `${rendered.width} x ${rendered.height} px · High-Res Cropped`;
      store.ui.cropStudio.open = false;
      showToast(`Applied ${rendered.width}x${rendered.height}px studio crop`);
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  // AI Full Post Co-Pilot + AI Visual Cover Art + AI Caption Rewriter
  document.getElementById("btn-generate-ai-pack")?.addEventListener("click", async () => {
    const topic = document.getElementById("ai-topic-input")?.value || "Design Systems";
    const tone = document.getElementById("ai-tone-select")?.value || "Editorial";
    const goal = document.getElementById("ai-goal-select")?.value || "dm_keyword";
    store.ui.aiTopic = topic;
    store.ui.aiTone = tone;
    store.ui.aiGoal = goal;
    try {
      const res = await apiRequest("/api/ai/post-pack", "POST", {
        workspaceId: store.activeWorkspaceId,
        topic,
        tone,
        goal,
        mediaType: store.ui.composerMediaType
      });
      store.ui.aiPack = res.pack;
      store.ui.composerTitle = topic;
      store.ui.composerCaption = res.pack.caption;
      store.ui.composerHashtags = res.pack.hashtags;
      store.ui.composerFirstComment = res.pack.firstComment;
      showToast("Generated complete AI post pack (hooks, caption, hashtags & first comment)");
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.querySelectorAll("[data-apply-ai-hook]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current = document.getElementById("comp-caption")?.value || store.ui.composerCaption || "";
      const rest = current.split("\n").slice(1).join("\n").trim();
      store.ui.composerCaption = `${btn.dataset.applyAiHook}${rest ? `\n\n${rest}` : ""}`;
      showToast("Updated opening hook");
      renderRoute();
    });
  });

  document.getElementById("btn-generate-ai-visual")?.addEventListener("click", async () => {
    const headline = document.getElementById("ai-topic-input")?.value || document.getElementById("comp-title")?.value || "Clean Architecture Scales Faster";
    const themes = ["editorial", "indigo", "slate", "emerald"];
    const picked = themes[Math.floor(Math.random() * themes.length)];
    const dataUrl = await generateAiVisualCardDataUrl({
      category: `${store.ui.aiTone || "STUDIO"} BRIEFING`,
      headline,
      igHandle: store.bundle.activeWorkspace.ig_handle,
      theme: picked
    });
    const uploaded = await apiRequest("/api/media/upload", "POST", {
      workspaceId: store.activeWorkspaceId,
      filename: "ai-studio-cover.png",
      mimeType: "image/png",
      dataUrl
    });
    store.ui.composerMediaUrl = uploaded.asset.url;
    store.ui.composerMediaFit = "cover";
    store.ui.composerAspect = "4:5";
    store.ui.composerMediaDims = "1080 x 1350 px · AI Studio Cover";
    showToast("Generated & attached custom 1080x1350 AI cover image");
    renderRoute();
  });

  document.querySelectorAll("[data-ai-rewrite]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const caption = document.getElementById("comp-caption")?.value || "";
      const res = await apiRequest("/api/ai/rewrite", "POST", {
        caption,
        mode: btn.dataset.aiRewrite,
        keyword: "GUIDE"
      });
      store.ui.composerCaption = res.caption;
      showToast(`Rewrote caption (${btn.textContent.trim()})`);
      renderRoute();
    });
  });

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
  document.getElementById("btn-toggle-grid-stats")?.addEventListener("click", () => {
    store.ui.gridShowStats = !store.ui.gridShowStats;
    renderRoute();
  });

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

  document.getElementById("auto-status-filter")?.addEventListener("change", (e) => {
    store.ui.autoFilterStatus = e.target.value;
    renderRoute();
  });
  document.getElementById("auto-trigger-filter")?.addEventListener("change", (e) => {
    store.ui.autoTriggerFilter = e.target.value;
    renderRoute();
  });

  document.getElementById("form-ai-workflow-builder")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = document.getElementById("ai-workflow-prompt")?.value || "";
    if (!prompt.trim()) return;
    try {
      const res = await apiRequest("/api/ai/workflow-from-prompt", "POST", {
        workspaceId: store.activeWorkspaceId,
        prompt
      });
      store.ui.autoPromptText = "";
      if (res.bundle?.automations?.[0]?.id) {
        store.ui.expandedAutoIds[res.bundle.automations[0].id] = true;
      }
      showToast(`Created & activated workflow: "${res.workflowDraft.name}"`);
      renderRoute();
    } catch (err) {
      showToast(err.message, true);
    }
  });

  document.querySelectorAll("[data-toggle-flow-expand]").forEach((head) => {
    head.addEventListener("click", (e) => {
      if (e.target.closest("[data-stop-prop]")) return;
      const id = head.dataset.toggleFlowExpand;
      store.ui.expandedAutoIds[id] = !store.ui.expandedAutoIds[id];
      renderRoute();
    });
  });

  document.querySelectorAll("[data-quick-test-auto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sel = document.getElementById("sim-auto-select");
      const inp = document.getElementById("sim-message-input");
      if (sel) sel.value = btn.dataset.quickTestAuto;
      if (inp) inp.value = btn.dataset.kw || "REPO";
      document.getElementById("form-live-sim")?.requestSubmit();
    });
  });

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
  document.getElementById("inbox-filter-dropdown")?.addEventListener("change", (e) => {
    store.ui.inboxFilter = e.target.value;
    renderRoute();
  });
  document.getElementById("inbox-tag-dropdown")?.addEventListener("change", (e) => {
    store.ui.inboxTagFilter = e.target.value;
    renderRoute();
  });
  document.querySelectorAll("[data-toggle-crm-sec]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.toggleCrmSec;
      store.ui.inboxCrmOpen[key] = !store.ui.inboxCrmOpen[key];
      renderRoute();
    });
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

  document.getElementById("inbox-quick-snippet-select")?.addEventListener("change", (e) => {
    if (!e.target.value) return;
    const inp = document.getElementById("inbox-reply-input");
    if (inp) { inp.value = e.target.value; inp.focus(); }
    e.target.value = "";
  });

  document.getElementById("inbox-ai-tone")?.addEventListener("change", (e) => {
    store.ui.inboxTone = e.target.value;
  });

  document.getElementById("btn-ai-draft-reply")?.addEventListener("click", async (e) => {
    const threadId = e.currentTarget.dataset.thread;
    const tone = document.getElementById("inbox-ai-tone")?.value || store.ui.inboxTone || "helpful";
    store.ui.inboxTone = tone;
    const res = await apiRequest("/api/inbox/ai-suggest", "POST", { threadId, tone });
    if (res.summary) {
      store.ui.inboxThreadSummary = { threadId, ...res.summary };
      renderRoute();
    }
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
    renderRoute({ forceShell: true });
  });
}

function openMetaConnectDrawer() {
  const ws = store.bundle?.activeWorkspace || {};
  const drawerRoot = document.getElementById("velora-drawer-root");
  drawerRoot.innerHTML = `
    <div class="drawer-backdrop" id="drawer-close-bg">
      <div class="drawer-panel">
        <div class="card-header">
          <div>
            <div class="card-title">Connect Official Instagram API</div>
            <div class="card-sub">Meta Graph &amp; Messenger OAuth Setup Guide</div>
          </div>
          <button class="icon-btn" id="btn-close-drawer">${icon("x", 16)}</button>
        </div>
        <form id="form-meta-connect" class="drawer-body">
          <div style="padding:12px 14px;border-radius:10px;background:var(--bg-subtle);font-size:12.5px;line-height:1.55;color:var(--ink-secondary);">
            <strong style="color:var(--ink-primary);display:block;margin-bottom:4px;">Required Meta Developer Setup:</strong>
            1. Create a <strong>Business App</strong> at <code class="mono">developers.facebook.com</code><br/>
            2. Add <strong>Instagram API with Instagram Login</strong> &amp; set Redirect URI to <code class="mono">${escHtml(location.origin)}/api/meta/oauth/callback</code><br/>
            3. Subscribe Webhook <code class="mono">${escHtml(location.origin)}/api/webhooks/instagram</code> to <code class="mono">comments</code> &amp; <code class="mono">messages</code>
          </div>

          <div class="field">
            <label class="field-label">Instagram Creator / Business Handle</label>
            <input class="input" name="igHandle" required value="${escHtml(ws.ig_handle === "unconnected.account" ? "mybrand.studio" : (ws.ig_handle || "mybrand.studio"))}" placeholder="mybrand.studio" />
          </div>

          <div class="field">
            <label class="field-label">Workspace Display Name</label>
            <input class="input" name="name" required value="${escHtml(ws.name || "My Brand Studio")}" />
          </div>

          <div class="field">
            <label class="field-label">Meta App ID (Optional for local sandbox)</label>
            <input class="input mono" name="igAccountId" placeholder="178414059220148" value="${escHtml(ws.ig_account_id || "")}" />
          </div>

          <div class="field">
            <label class="field-label">Account Bio</label>
            <textarea class="textarea" name="bio" rows="2">${escHtml(ws.bio || "Design & publishing studio powered by Official Meta OAuth.")}</textarea>
          </div>

          <div class="drawer-foot" style="padding:14px 0 0;margin-top:auto;">
            <button type="button" class="btn" id="btn-cancel-drawer">Cancel</button>
            <button type="submit" class="btn btn-primary">${icon("check", 14)} Link Instagram Account</button>
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

  document.getElementById("form-meta-connect")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await apiRequest("/api/meta/connect", "POST", {
      workspaceId: store.activeWorkspaceId,
      igHandle: fd.get("igHandle"),
      name: fd.get("name"),
      igAccountId: fd.get("igAccountId"),
      bio: fd.get("bio")
    });
    close();
    showToast(`Connected @${String(fd.get("igHandle")).replace(/^@+/, "")} to workspace!`);
    renderRoute({ forceShell: true });
  });
}

/* ============================================================================
   GLOBAL ROUTER, DATA MODE SWITCHER, CMD+K SHORTCUT & BOOTSTRAP
   ============================================================================ */
document.addEventListener("click", async (e) => {
  const modeBtn = e.target.closest("[data-switch-mode]");
  if (modeBtn) {
    e.preventDefault();
    const targetMode = modeBtn.dataset.switchMode;
    await switchDataMode(targetMode);
    showToast(
      targetMode === "empty"
        ? "Switched to Without Data (Clean Unconnected Mode)"
        : "Switched to With Data (4 Connected Workspaces Loaded)"
    );
    renderRoute({ forceShell: true });
    return;
  }

  const setupBtn = e.target.closest("[data-open-meta-setup]");
  if (setupBtn) {
    e.preventDefault();
    openMetaConnectDrawer();
    return;
  }

  if (e.target.closest("#btn-disconnect-meta")) {
    e.preventDefault();
    await apiRequest("/api/meta/disconnect", "POST", { workspaceId: store.activeWorkspaceId });
    showToast("Disconnected Instagram account from workspace");
    renderRoute({ forceShell: true });
    return;
  }

  if (e.target.closest("#btn-empty-new-auto")) {
    e.preventDefault();
    openNewWorkflowDrawer();
    return;
  }

  if (e.target.closest("#btn-sim-first-thread")) {
    e.preventDefault();
    await apiRequest("/api/inbox/simulate-thread", "POST", { workspaceId: store.activeWorkspaceId });
    showToast("Simulated first incoming Instagram DM thread!");
    renderRoute();
    return;
  }

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
