import {
  store, subscribe, notify, toast, apiRequest,
  refreshBootstrap, updateBundle, resetAllDemoData, escapeHtml
} from "./api.js";
import { renderMarketingPage, bindMarketingEvents } from "./marketingViews.js";
import { renderFreeToolsPage, bindFreeToolsEvents } from "./freeToolsViews.js";
import {
  renderCreateStudioView, renderSchedulerView, renderGridPlannerView,
  renderCarouselsStudioView, bindAppStudioEvents, openPostComposerModal
} from "./appViews.js";
import {
  renderAutomationsListView, renderAutomationBuilderView,
  renderCommentsModerationView, renderInboxView, renderAnalyticsView,
  renderSettingsAndBillingView, renderMcpConsoleView,
  renderReaEvidenceView, bindAutomationAndInboxEvents
} from "./automationAndInboxViews.js";

function openCreateWorkspaceModal() {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="max-width:480px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Switch or Connect OAuth Workspace</h3>
          <button class="btn btn-sm" id="close-ws-modal">✕</button>
        </div>

        <div style="margin-bottom:16px">
          <div class="kicker" style="margin-bottom:8px">JUMP INTO PRE-SEEDED TEST WORKSPACE</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${store.data.workspaces.map((w) => `
              <button class="btn" style="justify-content:space-between" data-jump-ws="${w.id}">
                <span><strong>@${escapeHtml(w.ig_handle)}</strong> — ${escapeHtml(w.name)}</span>
                <span class="pill-badge">${escapeHtml(w.plan.toUpperCase())}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <hr style="border:none;border-top:1px solid var(--border);margin:16px 0" />

        <form id="new-ws-form">
          <div class="kicker" style="margin-bottom:8px">OR CREATE NEW INSTAGRAM WORKSPACE (${store.data.workspaces.length}/5)</div>
          <div class="field"><label>Workspace Name *</label><input class="input" name="name" required placeholder="Sofia Studio" /></div>
          <div class="field"><label>Instagram Handle *</label><input class="input" name="igHandle" required placeholder="@sofia.shots" /></div>
          <div class="field">
            <label>Starting Plan Tier</label>
            <select class="select" name="plan">
              <option value="creator">Creator ($29/mo · All 35 Themes &amp; AI DMs)</option>
              <option value="influencer">Influencer ($9.99/mo · Unlimited Auto-DMs)</option>
              <option value="starter">Starter ($0 Free Forever)</option>
              <option value="lifetime">Founding Lifetime ($249 One-Time)</option>
            </select>
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" type="submit">Connect Official OAuth Workspace &rarr;</button>
        </form>
      </div>
    </div>
  `;
  modalRoot.querySelector("#close-ws-modal").onclick = () => { modalRoot.innerHTML = ""; };
  modalRoot.querySelectorAll("[data-jump-ws]").forEach((btn) => {
    btn.onclick = async () => {
      modalRoot.innerHTML = "";
      await refreshBootstrap(btn.dataset.jumpWs);
      store.mode = "app";
      store.appPage = "scheduler";
      notify();
      toast(`Switched to @${store.data.activeWorkspace.ig_handle} (${store.data.activeWorkspace.planSpec.name})`);
    };
  });
  modalRoot.querySelector("#new-ws-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const bundle = await apiRequest("/api/workspaces/create", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(fd.entries()))
      });
      modalRoot.innerHTML = "";
      updateBundle(bundle);
      store.mode = "app";
      store.appPage = "scheduler";
      notify();
      toast(`Connected @${bundle.activeWorkspace.ig_handle}!`);
    } catch (err) {
      toast(err.message, "error");
    }
  };
}

function openNotificationsModal() {
  const modalRoot = document.getElementById("modal-root");
  const list = store.data.notifications || [];
  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="max-width:540px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h3 style="margin:0">Activity &amp; Webhook Notifications</h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-sm" id="mark-all-read">Mark all read</button>
            <button class="btn btn-sm" id="close-notif">✕</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${list.map((n) => `
            <div style="padding:12px;border-radius:12px;background:${n.is_read ? "var(--bg-subtle)" : "var(--accent-soft)"};border:1px solid var(--border)">
              <div style="font-weight:700;font-size:13px">${escapeHtml(n.title)}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${escapeHtml(n.detail)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  modalRoot.querySelector("#close-notif").onclick = () => { modalRoot.innerHTML = ""; };
  modalRoot.querySelector("#mark-all-read").onclick = async () => {
    const b = await apiRequest("/api/notifications/read-all", {
      method: "POST",
      body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id })
    });
    modalRoot.innerHTML = "";
    updateBundle(b);
  };
}

function renderTopHeader() {
  const ws = store.data.activeWorkspace;
  const unread = store.data.notifications.filter((n) => !n.is_read).length;

  return `
    <header class="top-navbar">
      <div class="brand-cluster">
        <div class="brand-logo" id="brand-home">
          <span class="brand-mark">R</span>
          <span>ReelDrop</span>
        </div>

        <div class="mode-switch">
          <button data-top-mode="site" class="${store.mode === "site" ? "active" : ""}">● Website</button>
          <button data-top-mode="app" class="${store.mode === "app" ? "active" : ""}">⚡ App Dashboard</button>
        </div>
      </div>

      <nav class="site-nav-links">
        ${store.mode === "site" ? `
          <button data-site-nav="home" class="${store.sitePage === "home" ? "active" : ""}">Home</button>
          <button data-site-nav="themes" class="${store.sitePage === "themes" ? "active" : ""}">35 Themes</button>
          <button data-site-nav="free-tools" class="${store.sitePage === "free-tools" ? "active" : ""}">20 Free Tools</button>
          <button data-site-nav="pricing" class="${store.sitePage === "pricing" ? "active" : ""}">Pricing</button>
          <button data-site-nav="campaigns" class="${store.sitePage === "campaigns" ? "active" : ""}">Campaigns</button>
          <button data-site-nav="docs" class="${store.sitePage === "docs" ? "active" : ""}">Docs &amp; Safety</button>
        ` : `
          <span class="mono" style="font-size:11.5px;color:var(--text-muted)">
            Workspace: <strong style="color:var(--text-main)">@${escapeHtml(ws.ig_handle)}</strong> · Plan:
          </span>
          <select class="select" id="quick-plan-select" style="width:auto;padding:5px 10px;font-size:12px;font-weight:700">
            ${["starter", "influencer", "creator", "lifetime"].map((p) => `
              <option value="${p}" ${ws.plan === p ? "selected" : ""}>${store.data.plansConfig.plans[p].name}</option>
            `).join("")}
          </select>
          <button class="btn btn-sm" id="btn-header-reset" title="Reset all 4 workspaces to clean test seed">↻ Reset Data</button>
        `}
      </nav>

      <div class="top-right-controls">
        <button class="btn btn-sm" id="btn-theme-toggle" title="Toggle Light / Dark UI">${store.theme === "light" ? "◐ Dark" : "☼ Light"}</button>
        <button class="btn btn-sm" id="btn-open-notifs">✦ Alerts ${unread ? `<b style="color:var(--accent)">${unread}</b>` : "0"}</button>
        ${store.mode === "site"
          ? `<button class="btn btn-sm" id="btn-top-login">Log in</button><button class="btn btn-primary btn-sm" data-goto-app="scheduler">Try ReelDrop free &rarr;</button>`
          : `<button class="btn btn-primary btn-sm" id="top-quick-schedule">+ Schedule post</button>`}
      </div>
    </header>
  `;
}

function renderAppShell() {
  const ws = store.data.activeWorkspace;
  const unreadThreads = store.data.threads.reduce((s, t) => s + t.unread_count, 0);

  let mainHtml = "";
  switch (store.appPage) {
    case "create": mainHtml = renderCreateStudioView(); break;
    case "scheduler": mainHtml = renderSchedulerView(); break;
    case "grid": mainHtml = renderGridPlannerView(); break;
    case "carousels": mainHtml = renderCarouselsStudioView(); break;
    case "automations": mainHtml = renderAutomationsListView(); break;
    case "automation-builder": mainHtml = renderAutomationBuilderView(); break;
    case "comments": mainHtml = renderCommentsModerationView(); break;
    case "inbox": mainHtml = renderInboxView(); break;
    case "analytics": mainHtml = renderAnalyticsView(); break;
    case "settings": mainHtml = renderSettingsAndBillingView(); break;
    case "mcp": mainHtml = renderMcpConsoleView(); break;
    case "rea-evidence": mainHtml = renderReaEvidenceView(); break;
    default: mainHtml = renderSchedulerView();
  }

  return `
    <div class="app-shell">
      <aside class="app-sidebar">
        <div>
          <div class="ws-switcher-box">
            <div class="kicker" style="font-size:9.5px;margin-bottom:4px">INSTAGRAM WORKSPACE (${store.data.workspaces.length}/5)</div>
            <select class="select" id="sidebar-ws-select" style="padding:7px 9px;font-weight:700;font-size:12.5px">
              ${store.data.workspaces.map((w) => `
                <option value="${w.id}" ${w.id === ws.id ? "selected" : ""}>@${escapeHtml(w.ig_handle)} (${w.plan})</option>
              `).join("")}
            </select>
            <button class="btn btn-sm" id="btn-add-ws" style="width:100%;margin-top:8px">Switch / Add Account</button>
          </div>

          <div class="nav-group-label">Publish &amp; Create</div>
          <button class="side-nav-btn ${store.appPage === "create" ? "active" : ""}" data-app-nav="create"><span>✦ Create</span><span class="mono" style="font-size:10px">NEW</span></button>
          <button class="side-nav-btn ${store.appPage === "scheduler" ? "active" : ""}" data-app-nav="scheduler"><span>▦ Scheduler</span><span class="mono" style="font-size:11px">${store.data.posts.length}</span></button>
          <button class="side-nav-btn ${store.appPage === "grid" ? "active" : ""}" data-app-nav="grid"><span>⊞ Grid Planner</span><span class="mono" style="font-size:10px">${ws.grid_crop}</span></button>
          <button class="side-nav-btn ${store.appPage === "carousels" ? "active" : ""}" data-app-nav="carousels"><span>❖ AI Carousels</span><span class="mono" style="font-size:10px">35</span></button>

          <div class="nav-group-label">Growth &amp; Engagement</div>
          <button class="side-nav-btn ${store.appPage === "automations" ? "active" : ""}" data-app-nav="automations"><span>⚡ Automations</span><span class="mono" style="font-size:11px">${store.data.automations.length}</span></button>
          <button class="side-nav-btn ${store.appPage === "automation-builder" ? "active" : ""}" data-app-nav="automation-builder"><span>+ New Automation</span></button>
          <button class="side-nav-btn ${store.appPage === "comments" ? "active" : ""}" data-app-nav="comments"><span>≡ Comments</span><span class="mono" style="font-size:11px">${(store.data.comments || []).length}</span></button>
          <button class="side-nav-btn ${store.appPage === "inbox" ? "active" : ""}" data-app-nav="inbox"><span>✉ DM Inbox</span>${unreadThreads ? `<span class="pill-badge" style="padding:1px 7px;font-size:10px">${unreadThreads}</span>` : ""}</button>
          <button class="side-nav-btn ${store.appPage === "analytics" ? "active" : ""}" data-app-nav="analytics"><span>↗ Analytics</span></button>

          <div class="nav-group-label">Platform &amp; AI Agents</div>
          <button class="side-nav-btn ${store.appPage === "mcp" ? "active" : ""}" data-app-nav="mcp"><span>◈ Claude MCP</span><span class="mono" style="font-size:10px">${store.data.mcpTools.length}</span></button>
          <button class="side-nav-btn ${store.appPage === "settings" ? "active" : ""}" data-app-nav="settings"><span>⚙ Billing &amp; Settings</span></button>
          <button class="side-nav-btn ${store.appPage === "rea-evidence" ? "active" : ""}" data-app-nav="rea-evidence"><span>◉ REA Evidence</span><span class="mono" style="font-size:10px">SHA256</span></button>
        </div>

        <div style="padding:12px;border-radius:14px;background:var(--bg-subtle);font-size:12px">
          <div style="font-weight:800;margin-bottom:4px">${escapeHtml(ws.planSpec.name)} Tier Allowances</div>
          <div style="color:var(--text-muted)">AI Captions: ${ws.planSpec.limits.aiCaptionGenerationsPerMonth === null ? "Unlimited" : `${ws.ai_captions_used}/${ws.planSpec.limits.aiCaptionGenerationsPerMonth}`}</div>
          <div style="color:var(--text-muted)">Trial Reels: ${ws.planSpec.limits.trialReelsPerMonth === null ? "Unlimited" : `${ws.trial_reels_used}/${ws.planSpec.limits.trialReelsPerMonth}`}</div>
          <div style="color:var(--text-muted)">Carousel Images: ${ws.ai_carousel_images_used}/${ws.planSpec.limits.aiCarouselImagesPerMonth || "Draft"}</div>
        </div>
      </aside>

      <main class="app-main">${mainHtml}</main>
    </div>
  `;
}

function render() {
  const root = document.getElementById("app");
  if (!store.data) return;

  document.documentElement.setAttribute("data-theme", store.theme);

  const bodyHtml = store.mode === "site"
    ? (store.sitePage === "free-tools" ? renderFreeToolsPage() : renderMarketingPage())
    : renderAppShell();

  root.innerHTML = `${renderTopHeader()}${bodyHtml}`;

  root.querySelector("#brand-home").onclick = () => { store.mode = "site"; store.sitePage = "home"; notify(); };
  root.querySelectorAll("[data-top-mode]").forEach((b) => {
    b.onclick = () => { store.mode = b.dataset.topMode; notify(); };
  });
  root.querySelectorAll("[data-site-nav]").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      store.mode = "site";
      store.sitePage = el.dataset.siteNav;
      notify();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
  root.querySelectorAll("[data-goto-app]").forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      store.mode = "app";
      store.appPage = el.dataset.gotoApp;
      notify();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
  root.querySelectorAll("[data-app-nav]").forEach((b) => {
    b.onclick = () => { store.appPage = b.dataset.appNav; notify(); };
  });

  root.querySelector("#btn-theme-toggle").onclick = () => {
    store.theme = store.theme === "light" ? "dark" : "light";
    notify();
  };
  root.querySelector("#btn-open-notifs").onclick = openNotificationsModal;

  const topLogin = root.querySelector("#btn-top-login");
  if (topLogin) topLogin.onclick = openCreateWorkspaceModal;

  const topSched = root.querySelector("#top-quick-schedule");
  if (topSched) topSched.onclick = () => openPostComposerModal();

  const headerReset = root.querySelector("#btn-header-reset");
  if (headerReset) headerReset.onclick = () => resetAllDemoData();

  const quickPlan = root.querySelector("#quick-plan-select");
  if (quickPlan) {
    quickPlan.onchange = async () => {
      const b = await apiRequest("/api/workspaces/switch-plan", {
        method: "POST",
        body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, plan: quickPlan.value })
      });
      updateBundle(b);
      toast(`Switched active workspace to ${b.activeWorkspace.planSpec.name} plan!`);
    };
  }

  const wsSel = root.querySelector("#sidebar-ws-select");
  if (wsSel) {
    wsSel.onchange = async () => {
      await refreshBootstrap(wsSel.value);
      toast(`Switched workspace to @${store.data.activeWorkspace.ig_handle}`);
    };
  }
  const addWs = root.querySelector("#btn-add-ws");
  if (addWs) addWs.onclick = openCreateWorkspaceModal;

  if (store.mode === "site") {
    if (store.sitePage === "free-tools") bindFreeToolsEvents(root);
    else bindMarketingEvents(root, openCreateWorkspaceModal);
  } else {
    bindAppStudioEvents(root);
    bindAutomationAndInboxEvents(root);
  }
}

function syncInitialRouteFromPath() {
  const p = location.pathname.replace(/\/+$/, "") || "/";
  if (p === "/themes") { store.mode = "site"; store.sitePage = "themes"; }
  else if (p.startsWith("/free-tools")) { store.mode = "site"; store.sitePage = "free-tools"; }
  else if (p === "/pricing") { store.mode = "site"; store.sitePage = "pricing"; }
  else if (p === "/campaigns") { store.mode = "site"; store.sitePage = "campaigns"; }
  else if (p.startsWith("/docs")) { store.mode = "site"; store.sitePage = "docs"; }
  else if (p.startsWith("/app")) {
    store.mode = "app";
    store.appPage = p.split("/")[2] || "scheduler";
  }
}

subscribe(render);
syncInitialRouteFromPath();
refreshBootstrap();
