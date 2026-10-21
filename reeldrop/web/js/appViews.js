import { store, notify, toast, apiRequest, updateBundle, escapeHtml } from "./api.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

let selectedSwapFirstId = null;

let createDraft = {
  mediaType: "REEL",
  title: "How Official API Auto-DMs Triple Link Clicks",
  caption: "",
  firstComment: "Comment GUIDE below and I'll DM you the full resource bundle! ↓",
  coverStyle: "terracotta",
  collabHandle: "",
  automationId: "auto_repo_pack",
  isTrialReel: true,
  scheduledLocal: "2026-10-24T14:00"
};

export function renderCreateStudioView() {
  const ws = store.data.activeWorkspace;
  if (store.composerPrefillCaption) {
    createDraft.caption = store.composerPrefillCaption;
    store.composerPrefillCaption = "";
  }
  if (!createDraft.caption) {
    createDraft.caption = "Stop putting \"link in bio\" on high-retention Reels.\n\nComment GUIDE below and my official Instagram API workflow will send the resource bundle straight to your DMs in under 2 seconds! ↓";
  }

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">OFFICIAL GRAPH PUBLISHING CONTAINER · @${escapeHtml(ws.ig_handle)}</span>
          <h1 class="editorial-title">Create Studio</h1>
        </div>
        <div style="font-size:12.5px;color:var(--text-muted)">
          AI Captions: <strong>${ws.planSpec.limits.aiCaptionGenerationsPerMonth === null ? "Unlimited" : `${ws.ai_captions_used}/${ws.planSpec.limits.aiCaptionGenerationsPerMonth}`}</strong> ·
          Trial Reels: <strong>${ws.planSpec.limits.trialReelsPerMonth === null ? "Unlimited" : `${ws.trial_reels_used}/${ws.planSpec.limits.trialReelsPerMonth}`}</strong>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,0.9fr);gap:26px;align-items:start">
        <form class="card" id="full-create-form">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
            <div class="field">
              <label>Media Format</label>
              <select class="select" id="cr-type">
                ${["REEL", "CAROUSEL", "POST", "STORY"].map((t) => `<option value="${t}" ${createDraft.mediaType === t ? "selected" : ""}>${t}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label>Cover Visual Palette</label>
              <select class="select" id="cr-cover">
                ${[["terracotta", "Terracotta Editorial"], ["cream", "Warm Cream Paper"], ["noir", "Obsidian Noir"], ["indigo", "Indigo Studio"], ["butter", "Butter & Periwinkle"], ["forest", "Forest Cutting Mat"], ["sky", "Studio Sky"], ["espresso", "Morning Espresso"]].map(([v, l]) => `<option value="${v}" ${createDraft.coverStyle === v ? "selected" : ""}>${l}</option>`).join("")}
              </select>
            </div>
          </div>

          <div class="field">
            <label>Post Title / Cover Safe-Zone Headline *</label>
            <input class="input" id="cr-title" required value="${escapeHtml(createDraft.title)}" />
          </div>

          <div class="field">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <label style="margin:0">Caption (${createDraft.caption.length}/2,200 chars)</label>
              <button type="button" class="btn btn-sm btn-accent" id="cr-ai-btn">✦ Generate with AI</button>
            </div>
            <textarea class="textarea" id="cr-caption" rows="5">${escapeHtml(createDraft.caption)}</textarea>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
            <div class="field">
              <label>First Comment (Auto-Posted)</label>
              <input class="input" id="cr-first" value="${escapeHtml(createDraft.firstComment)}" placeholder="Influencer & Creator plans" />
            </div>
            <div class="field">
              <label>Collaborator Handle (@collab)</label>
              <input class="input" id="cr-collab" value="${escapeHtml(createDraft.collabHandle)}" placeholder="e.g. sofia.shots" />
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px">
            <div class="field">
              <label>Publish Date &amp; Time (${escapeHtml(ws.timezone)})</label>
              <input class="input" type="datetime-local" id="cr-sched" value="${createDraft.scheduledLocal}" required />
            </div>
            <div class="field">
              <label>⚡ Attach Comment-to-DM Automation</label>
              <select class="select" id="cr-auto">
                <option value="">— No automation —</option>
                ${store.data.automations.map((a) => `<option value="${a.id}" ${createDraft.automationId === a.id ? "selected" : ""}>${escapeHtml(a.name)} [${a.keywords.join(", ")}]</option>`).join("")}
              </select>
            </div>
          </div>

          <label style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:12px;background:var(--bg-subtle);cursor:pointer;font-weight:600;margin-bottom:16px">
            <input type="checkbox" id="cr-trial" ${createDraft.isTrialReel ? "checked" : ""} />
            Publish as Trial Reel (test on cold non-followers before followers)
          </label>

          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button type="submit" class="btn btn-primary btn-lg">+ Schedule to Calendar &rarr;</button>
            <button type="button" class="btn btn-lg" id="cr-save-draft">Save as Draft</button>
          </div>
        </form>

        <div style="text-align:center">
          <div class="kicker" style="margin-bottom:10px">◉ LIVE INSTAGRAM CONTAINER PREVIEW</div>
          <div class="iphone-frame">
            <div class="iphone-notch"></div>
            <div class="iphone-screen">
              <div class="cover-art cover-${createDraft.coverStyle}" style="flex:1;justify-content:space-between;text-align:left;padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
                  <span>@${escapeHtml(ws.ig_handle)}${createDraft.collabHandle ? ` & @${escapeHtml(createDraft.collabHandle)}` : ""}</span>
                  <span class="mono" style="font-size:10px;background:rgba(0,0,0,0.5);padding:2px 7px;border-radius:99px">${createDraft.mediaType}</span>
                </div>
                <div style="text-align:center;margin:28px 0">
                  <div style="font-family:'Fraunces',Georgia,serif;font-size:21px;line-height:1.15">${escapeHtml(createDraft.title.toUpperCase())}</div>
                </div>
                <div>
                  <div style="font-size:11.5px;opacity:0.92;margin-bottom:10px">${escapeHtml(createDraft.caption.slice(0, 115))}${createDraft.caption.length > 115 ? "… more" : ""}</div>
                  <div style="display:flex;justify-content:space-between;font-size:14px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.2)">
                    <span>♡  ✉  ↗</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function openPostComposerModal(prefillDateIso = "") {
  const modalRoot = document.getElementById("modal-root");
  const ws = store.data.activeWorkspace;
  const defaultIso = prefillDateIso ? `${prefillDateIso}T14:00` : new Date(Date.now() + 86400000).toISOString().slice(0, 16);

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="composer-backdrop">
      <div class="modal-card" style="max-width:780px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <span class="kicker">QUICK COMPOSER · @${escapeHtml(ws.ig_handle)}</span>
            <h2 class="editorial-title" style="font-size:28px">Schedule New Post</h2>
          </div>
          <button class="btn btn-sm" id="close-composer">✕ Close</button>
        </div>

        <form id="schedule-post-form" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px">
          <div>
            <div class="field">
              <label>Media Format</label>
              <select class="select" name="mediaType">
                <option value="REEL">REEL (9:16 Vertical Video)</option>
                <option value="CAROUSEL">CAROUSEL (Multi-Slide 4:5)</option>
                <option value="POST">POST (Single Feed Photo)</option>
                <option value="STORY">STORY (24h Ephemeral Frame)</option>
              </select>
            </div>
            <div class="field">
              <label>Post Title / Cover Hook *</label>
              <input class="input" name="title" required value="How Official API Auto-DMs Triple Link Clicks" />
            </div>
            <div class="field">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <label style="margin:0">Caption (${ws.planSpec.limits.aiCaptionGenerationsPerMonth === null ? "Unlimited AI" : `${ws.ai_captions_used}/${ws.planSpec.limits.aiCaptionGenerationsPerMonth} AI used`})</label>
                <button type="button" class="btn btn-sm btn-accent" id="btn-composer-ai">✦ Generate with AI</button>
              </div>
              <textarea class="textarea" name="caption" id="comp-caption" style="margin-top:6px" rows="5">Stop putting "link in bio" on high-retention Reels.\n\nComment GUIDE below and my official Instagram API workflow will send the resource bundle straight to your DMs in under 2 seconds! ↓</textarea>
            </div>
            <div class="field">
              <label>First Comment (Auto-Posted after publish)</label>
              <input class="input" name="firstComment" placeholder="Optional first comment (Influencer & Creator plans)" />
            </div>
          </div>

          <div>
            <div class="field">
              <label>Scheduled Date &amp; Time (${escapeHtml(ws.timezone)})</label>
              <input class="input" type="datetime-local" name="scheduledLocal" value="${defaultIso}" required />
            </div>
            <div class="field">
              <label>Cover Visual Palette</label>
              <select class="select" name="coverStyle">
                <option value="terracotta">Terracotta Editorial</option>
                <option value="cream">Warm Cream Paper</option>
                <option value="noir">Obsidian Noir</option>
                <option value="indigo">Indigo Studio</option>
                <option value="butter">Butter &amp; Periwinkle</option>
                <option value="forest">Forest Cutting Mat</option>
              </select>
            </div>
            <div class="field">
              <label>Collaborator (@collab)</label>
              <input class="input" name="collabHandle" placeholder="Optional co-author handle" />
            </div>
            <div class="field">
              <label>⚡ Attach Comment-to-DM Automation</label>
              <select class="select" name="automationId">
                <option value="">— No automation attached —</option>
                ${store.data.automations.map((a) => `<option value="${a.id}">${escapeHtml(a.name)} [${a.keywords.join(", ")}]</option>`).join("")}
              </select>
            </div>
            <label style="display:flex;align-items:center;gap:8px;padding:12px;border-radius:12px;background:var(--bg-subtle);cursor:pointer;font-weight:600;margin-bottom:16px">
              <input type="checkbox" name="isTrialReel" />
              Publish as Trial Reel (test with cold non-followers first)
            </label>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%">+ Schedule Post to Calendar &rarr;</button>
          </div>
        </form>
      </div>
    </div>
  `;

  modalRoot.querySelector("#close-composer").onclick = () => { modalRoot.innerHTML = ""; };
  modalRoot.querySelector("#btn-composer-ai").onclick = async () => {
    try {
      const title = modalRoot.querySelector("[name='title']").value;
      const res = await apiRequest("/api/ai/captions", { method: "POST", body: JSON.stringify({ workspaceId: ws.id, topic: title, enforceQuota: true }) });
      if (res.bundle) updateBundle(res.bundle);
      const inp = document.getElementById("comp-caption");
      if (inp) inp.value = res.captions[0].body;
      toast("AI generated hook-checked caption!");
    } catch (err) { toast(err.message, "error"); }
  };
  modalRoot.querySelector("#schedule-post-form").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const bundle = await apiRequest("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: ws.id,
          mediaType: fd.get("mediaType"),
          title: fd.get("title"),
          caption: fd.get("caption"),
          firstComment: fd.get("firstComment"),
          collabHandle: fd.get("collabHandle"),
          coverStyle: fd.get("coverStyle"),
          automationId: fd.get("automationId") || null,
          isTrialReel: fd.get("isTrialReel") === "on",
          scheduledAt: new Date(fd.get("scheduledLocal")).toISOString()
        })
      });
      modalRoot.innerHTML = "";
      updateBundle(bundle);
      toast("Scheduled post added to Calendar & Grid Planner!");
    } catch (err) { toast(err.message, "error"); }
  };
}

export function openPostDetailsModal(postId) {
  const post = store.data.posts.find((p) => p.id === postId);
  if (!post) return;
  const ws = store.data.activeWorkspace;
  const modalRoot = document.getElementById("modal-root");
  const attached = store.data.automations.find((a) => a.id === post.automation_id);

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-card" style="max-width:880px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="pill-badge">${post.media_type}</span>
            <h3 style="margin:0;font-size:20px">${post.media_type} Details</h3>
            <span class="mono" style="font-size:11px;padding:4px 9px;border-radius:99px;background:var(--bg-subtle)">${post.status}</span>
          </div>
          <button class="btn btn-sm" id="close-detail-modal">✕</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:22px;align-items:start">
          <div class="iphone-frame">
            <div class="iphone-notch"></div>
            <div class="iphone-screen">
              <div class="cover-art cover-${post.cover_style}" style="flex:1;justify-content:space-between;padding:16px">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px">
                  <span>@${escapeHtml(ws.ig_handle)}${post.collab_handle ? ` & @${escapeHtml(post.collab_handle)}` : ""}</span>
                  <span class="mono" style="font-size:10px;background:rgba(0,0,0,0.45);padding:3px 7px;border-radius:99px">${post.media_type}</span>
                </div>
                <div style="text-align:center;margin:28px 0">
                  <div style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.22);display:inline-grid;place-items:center;font-size:18px;margin-bottom:10px">▶</div>
                  <div style="font-size:18px;font-family:'Fraunces',Georgia,serif;line-height:1.15">${escapeHtml(post.cover_label || post.title)}</div>
                </div>
                <div>
                  <div style="font-size:11.5px;opacity:0.9;margin-bottom:10px">${escapeHtml(post.caption.slice(0, 95))}…</div>
                  <div style="display:flex;justify-content:space-between;font-size:15px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.2)">
                    <span>♡  ✉  ↗</span>
                    <span>★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            ${post.status === "FAILED" ? `
              <div style="background:rgba(220,38,38,0.12);border:1px solid #DC2626;padding:12px;border-radius:12px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:8px">
                <span style="font-size:12.5px;color:#DC2626;font-weight:600">! ${escapeHtml(post.error_reason)}</span>
                <button class="btn btn-sm btn-accent" id="btn-retry-post">Retry Container</button>
              </div>
            ` : ""}

            <div class="field">
              <label>Scheduled Timestamp</label>
              <input class="input" type="datetime-local" id="det-sched" value="${new Date(post.scheduled_at).toISOString().slice(0, 16)}" />
            </div>
            <div class="field">
              <label>Caption</label>
              <textarea class="textarea" id="det-cap" rows="4">${escapeHtml(post.caption)}</textarea>
            </div>
            <div class="field">
              <label>Collaborator Handle (@collab)</label>
              <input class="input" id="det-collab" value="${escapeHtml(post.collab_handle || "")}" placeholder="e.g. sofia.shots" />
            </div>
            <div class="field">
              <label>⚡ Automation Attached (${attached ? escapeHtml(attached.name) : "None"})</label>
              <select class="select" id="det-auto">
                <option value="">— None —</option>
                ${store.data.automations.map((a) => `<option value="${a.id}" ${a.id === post.automation_id ? "selected" : ""}>⚡ ${escapeHtml(a.name)} (${a.dms_sent} DMs sent)</option>`).join("")}
              </select>
            </div>

            ${post.status === "PUBLISHED" ? `
              <div style="background:var(--bg-subtle);padding:12px;border-radius:12px;margin-bottom:14px;display:flex;justify-content:space-between;font-size:12.5px;font-weight:700">
                <span>Views: ${post.views.toLocaleString()}</span>
                <span>Reach: ${post.reach.toLocaleString()}</span>
                <span>Saves: ${post.saves.toLocaleString()}</span>
              </div>
            ` : ""}

            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" id="btn-save-detail">Save Changes</button>
              ${post.status !== "PUBLISHED" ? `<button class="btn btn-accent" id="btn-pub-now">Publish Now (Simulate API)</button>` : ""}
              ${post.is_trial_reel && !post.trial_graduated ? `<button class="btn" id="btn-grad-trial">↗ Graduate Trial Reel</button>` : ""}
              <button class="btn btn-danger" id="btn-del-post">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  modalRoot.querySelector("#close-detail-modal").onclick = () => { modalRoot.innerHTML = ""; };
  const retryBtn = modalRoot.querySelector("#btn-retry-post");
  if (retryBtn) retryBtn.onclick = async () => { const b = await apiRequest("/api/posts/update", { method: "POST", body: JSON.stringify({ postId: post.id, action: "retry" }) }); modalRoot.innerHTML = ""; updateBundle(b); toast("Re-queued container!"); };
  const gradBtn = modalRoot.querySelector("#btn-grad-trial");
  if (gradBtn) gradBtn.onclick = async () => { const b = await apiRequest("/api/posts/update", { method: "POST", body: JSON.stringify({ postId: post.id, action: "graduate_trial" }) }); modalRoot.innerHTML = ""; updateBundle(b); toast("Graduated Trial Reel!"); };
  modalRoot.querySelector("#btn-save-detail").onclick = async () => {
    const b = await apiRequest("/api/posts/update", {
      method: "POST",
      body: JSON.stringify({ postId: post.id, caption: modalRoot.querySelector("#det-cap").value, collabHandle: modalRoot.querySelector("#det-collab").value, scheduledAt: new Date(modalRoot.querySelector("#det-sched").value).toISOString(), automationId: modalRoot.querySelector("#det-auto").value || null })
    });
    modalRoot.innerHTML = "";
    updateBundle(b);
    toast("Updated post details!");
  };
  const pubBtn = modalRoot.querySelector("#btn-pub-now");
  if (pubBtn) pubBtn.onclick = async () => { const b = await apiRequest("/api/posts/update", { method: "POST", body: JSON.stringify({ postId: post.id, action: "publish_now" }) }); modalRoot.innerHTML = ""; updateBundle(b); toast("Published live!"); };
  modalRoot.querySelector("#btn-del-post").onclick = async () => { const b = await apiRequest("/api/posts/update", { method: "POST", body: JSON.stringify({ postId: post.id, action: "delete" }) }); modalRoot.innerHTML = ""; updateBundle(b); toast("Deleted post."); };
}

export function renderSchedulerView() {
  const year = store.calYear;
  const month = store.calMonth;
  const filteredPosts = store.data.posts.filter((p) => {
    if (store.calStatusFilter === "ALL") return true;
    if (store.calStatusFilter === "TRIAL") return Boolean(p.is_trial_reel);
    return p.status === store.calStatusFilter;
  });

  let displayCells = [];
  let rangeHeading = `${MONTHS[month]} ${year}`;

  if (store.calView === "week") {
    const baseSun = new Date(Date.UTC(2026, 9, 18 + store.calWeekOffset * 7));
    for (let i = 0; i < 7; i++) {
      const dt = new Date(baseSun.getTime() + i * 86400000);
      const y = dt.getUTCFullYear();
      const m = dt.getUTCMonth();
      const d = dt.getUTCDate();
      const datePrefix = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      displayCells.push({ day: d, monthShort: MONTHS[m].slice(0, 3), datePrefix, posts: filteredPosts.filter((p) => p.scheduled_at.startsWith(datePrefix)), isToday: y === 2026 && m === 9 && d === 21 });
    }
    rangeHeading = `Week of ${displayCells[0].monthShort} ${displayCells[0].day} – ${displayCells[6].monthShort} ${displayCells[6].day}, ${baseSun.getUTCFullYear()}`;
  } else {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) displayCells.push({ day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const datePrefix = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      displayCells.push({ day: d, datePrefix, posts: filteredPosts.filter((p) => p.scheduled_at.startsWith(datePrefix)), isToday: year === 2026 && month === 9 && d === 21 });
    }
    while (displayCells.length % 7 !== 0) displayCells.push({ day: null });
  }

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">PLAN · SCHEDULE · SHIP</span>
          <h1 class="editorial-title">Scheduler</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" data-app-nav="create">Open Full Create Studio</button>
          <button class="btn btn-primary btn-lg" id="btn-open-composer">+ Schedule post</button>
        </div>
      </div>

      <div class="cal-toolbar">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <button class="btn btn-sm" id="cal-prev">&lt;</button>
          <button class="btn btn-sm" id="cal-today">TODAY</button>
          <button class="btn btn-sm" id="cal-next">&gt;</button>
          <strong style="font-size:16px;margin-left:6px">${rangeHeading}</strong>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${["ALL", "SCHEDULED", "PUBLISHED", "DRAFT", "FAILED", "TRIAL"].map((st) => `<button class="btn btn-sm ${store.calStatusFilter === st ? "btn-accent" : ""}" style="padding:4px 9px;font-size:11px" data-cal-status="${st}">${st}</button>`).join("")}
          </div>
          <div class="mode-switch">
            <button data-cal-view="week" class="${store.calView === "week" ? "active" : ""}">week</button>
            <button data-cal-view="month" class="${store.calView === "month" ? "active" : ""}">month</button>
          </div>
        </div>
      </div>

      <div class="cal-grid">
        ${DOW.map((d) => `<div class="cal-dow">${d}</div>`).join("")}
        ${displayCells.map((c) => c.day === null
          ? `<div class="cal-cell is-muted"></div>`
          : `
            <div class="cal-cell ${c.isToday ? "is-today" : ""}" style="min-height:${store.calView === "week" ? "260px" : "126px"}">
              <div class="cal-day-top">
                <span class="${c.isToday ? "today-num" : ""}">${c.day}</span>
                <button class="cal-add-btn" title="Schedule on ${c.datePrefix}" data-quick-add="${c.datePrefix}">+</button>
              </div>
              ${c.posts.map((p) => `
                <div class="post-chip type-${p.media_type} status-${p.status}" data-open-post="${p.id}">
                  <div class="chip-row">
                    <span class="mono" style="font-size:9.5px">${p.media_type}${p.status === "DRAFT" ? "·DFT" : ""}</span>
                    <span class="mono" style="font-size:9.5px">${new Date(p.scheduled_at).toISOString().slice(11, 16)}</span>
                  </div>
                  <div class="chip-title">${p.status === "FAILED" ? "! " : p.automation_id ? "⚡ " : ""}${escapeHtml(p.title)}</div>
                </div>
              `).join("")}
            </div>
          `).join("")}
      </div>
    </div>
  `;
}

export function renderGridPlannerView() {
  const ws = store.data.activeWorkspace;
  const crop = ws.grid_crop || "4:5";
  const aspectCss = crop === "1:1" ? "1/1" : crop === "4:5" ? "4/5" : "3/4";
  const scheduled = store.data.posts.filter((p) => p.status !== "PUBLISHED");
  const allPublished = store.data.posts.filter((p) => p.status === "PUBLISHED");
  const published = store.gridShowAll ? allPublished : allPublished.slice(0, 6);

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">VISUAL FEED · DRAG OR CLICK TO SWAP SCHEDULE TIMES</span>
          <h1 class="editorial-title">Grid Planner</h1>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <div class="mode-switch">
            ${["1:1", "4:5", "3:4"].map((r) => `<button data-grid-crop="${r}" class="${crop === r ? "active" : ""}">${r}</button>`).join("")}
          </div>
          <button class="btn btn-primary" id="btn-grid-new-post">+ Schedule Post</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(280px,1fr);gap:24px;align-items:start">
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;margin-bottom:16px;border-bottom:1px solid var(--border);flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="width:52px;height:52px;border-radius:50%;background:${ws.avatar_color};color:#FFF;display:grid;place-items:center;font-weight:800;font-size:18px">${ws.ig_handle.slice(0, 2).toUpperCase()}</div>
              <div>
                <div style="font-weight:800;font-size:16px">@${escapeHtml(ws.ig_handle)}</div>
                <div style="font-size:12.5px;color:var(--text-muted)">${ws.followers_count.toLocaleString()} followers · Drag tiles OR click <code>⇄ Swap</code> on any two planned posts!</div>
              </div>
            </div>
            ${selectedSwapFirstId ? `<span class="pill-badge">Select 2nd tile to swap schedule time…</span>` : ""}
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px">
            ${store.data.gridPlaceholders.map((ph) => `
              <div style="aspect-ratio:${aspectCss};background:${ph.color};color:#18181B;padding:12px;border-radius:6px;display:flex;flex-direction:column;justify-content:space-between;font-size:12px">
                <span class="mono" style="font-size:9.5px;font-weight:700">IDEA PLACEHOLDER</span>
                <div style="font-weight:700">${escapeHtml(ph.note)}</div>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-sm btn-primary" style="padding:3px 8px;font-size:10px" data-ph-convert="${ph.id}">&rarr; Draft</button>
                  <button class="btn btn-sm" style="padding:3px 7px;font-size:10px" data-ph-del="${ph.id}">✕</button>
                </div>
              </div>
            `).join("")}

            ${scheduled.map((p) => `
              <div class="cover-art cover-${p.cover_style}" draggable="true" data-drag-post="${p.id}" data-open-post="${p.id}"
                   style="aspect-ratio:${aspectCss};border-radius:6px;cursor:grab;outline:${selectedSwapFirstId === p.id ? "3px solid #FACC15" : "2px dashed rgba(255,255,255,0.45)"}">
                <div style="position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;font-size:9.5px;gap:4px" class="mono">
                  <button type="button" data-click-swap="${p.id}" style="border:none;cursor:pointer;background:rgba(0,0,0,0.72);padding:2px 6px;border-radius:4px;color:#FFF;font-family:inherit;font-size:9.5px">⇄ Swap</button>
                  <span style="background:var(--accent);padding:2px 6px;border-radius:4px;color:#FFF">${new Date(p.scheduled_at).toLocaleDateString()}</span>
                </div>
                <div>
                  ${p.collab_handle ? `<div class="mono" style="font-size:9.5px;opacity:0.9;margin-bottom:3px">Collab @${escapeHtml(p.collab_handle)}</div>` : ""}
                  <div style="font-size:13px;line-height:1.2">${escapeHtml(p.cover_label || p.title)}</div>
                </div>
              </div>
            `).join("")}

            ${published.map((p) => `
              <div class="cover-art cover-${p.cover_style}" data-open-post="${p.id}" style="aspect-ratio:${aspectCss};border-radius:6px;cursor:pointer">
                <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.55);color:#FFF;padding:2px 6px;border-radius:4px;font-size:9.5px" class="mono">LIVE · ${(p.views / 1000).toFixed(1)}K</div>
                <div>
                  ${p.collab_handle ? `<div class="mono" style="font-size:9.5px;opacity:0.9;margin-bottom:3px">Collab @${escapeHtml(p.collab_handle)}</div>` : ""}
                  <div style="font-size:13px;line-height:1.2">${escapeHtml(p.cover_label || p.title)}</div>
                </div>
              </div>
            `).join("")}
          </div>

          ${allPublished.length > 6 ? `<div style="text-align:center;margin-top:14px"><button class="btn btn-sm" id="btn-grid-more">${store.gridShowAll ? "Show Compact Feed" : `Load All ${allPublished.length} Published Posts ↓`}</button></div>` : ""}
        </div>

        <div class="card">
          <span class="kicker">IDEA TILE HOLDER (280 CHARS)</span>
          <h3 style="margin:6px 0 10px">Drop unscheduled color notes onto your grid</h3>
          <form id="grid-placeholder-form">
            <div class="field"><label>Idea Note (Max 280 chars)</label><textarea class="textarea" name="note" maxlength="280" required placeholder="IDEA: 5-slide Reading Room breakdown of our Q4 setup…"></textarea></div>
            <div class="field"><label>Tile Color Swatch</label><select class="select" name="color"><option value="#FDE68A">Warm Butter Yellow</option><option value="#FBCFE8">Soft Rose Pink</option><option value="#BAE6FD">Studio Sky Blue</option><option value="#BBF7D0">Mint Sage</option><option value="#FED7AA">Apricot Cream</option></select></div>
            <button class="btn btn-primary" style="width:100%" type="submit">+ Add Idea Tile to Top of Grid</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function renderCarouselsStudioView() {
  if (store.pendingThemeId && store.data.carousels.length) {
    store.selectedThemeOverride = store.pendingThemeId;
    store.pendingThemeId = null;
  }
  const active = store.data.carousels.find((c) => c.id === store.selectedCarouselId) || store.data.carousels[0];
  const activeThemeId = store.selectedThemeOverride || active?.theme_id || "bold_highlight";
  const theme = store.data.themes.find((t) => t.id === activeThemeId) || store.data.themes[0];
  const slides = active ? active.slides : [];
  const idx = Math.min(Math.max(0, slides.length - 1), Math.max(0, store.selectedSlideIndex));
  const slide = slides[idx] || { tag: "HOOK", headline: "Create your first carousel above", body: "", badge: "SLIDE" };

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">35 THEMES · LIVE SLIDE EDITOR · PNG EXPORT</span>
          <h1 class="editorial-title">Carousels</h1>
        </div>
        <button class="btn" data-site-nav="themes">Browse All 35 Theme Previews &rarr;</button>
      </div>

      <form class="card" id="carousel-gen-form" style="margin-bottom:24px;display:grid;grid-template-columns:minmax(220px,2fr) minmax(170px,1fr) 110px auto;gap:12px;align-items:end">
        <div class="field" style="margin:0"><label>Prompt / Topic &rarr; AI Multi-Slide Deck</label><input class="input" name="prompt" required placeholder="e.g. 6 habits that doubled our Instagram saves this quarter" /></div>
        <div class="field" style="margin:0"><label>Theme (All 35 Available)</label><select class="select" name="themeId" id="car-theme-select">${store.data.themes.map((t) => `<option value="${t.id}" ${t.id === theme.id ? "selected" : ""}>${escapeHtml(t.name)} (${t.category})</option>`).join("")}</select></div>
        <div class="field" style="margin:0"><label>Slides</label><input class="input" type="number" name="slideCount" min="3" max="10" value="5" /></div>
        <button class="btn btn-primary btn-lg" type="submit">✦ Generate Deck</button>
      </form>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">
        ${store.data.carousels.map((c) => `<button class="btn btn-sm ${c.id === active?.id ? "btn-accent" : ""}" data-pick-carousel="${c.id}">${escapeHtml(c.title)} (${c.slides.length} slides)</button>`).join("")}
      </div>

      <div style="display:grid;grid-template-columns:minmax(290px,400px) minmax(0,1fr);gap:24px;align-items:start">
        <div>
          <div style="aspect-ratio:4/5;border-radius:20px;padding:28px;background:${theme.bg};color:${theme.fg};border:1px solid var(--border);box-shadow:var(--shadow-md);display:flex;flex-direction:column;justify-content:space-between;position:relative">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="mono" style="font-size:11px;padding:4px 10px;border-radius:999px;background:${theme.pillBg};color:${theme.fg}">${escapeHtml(slide.badge || theme.name)}</span>
              <span class="mono" style="font-size:11px;background:rgba(0,0,0,0.18);padding:3px 9px;border-radius:999px">${idx + 1}/${slides.length}</span>
            </div>
            <div>
              <div class="mono" style="font-size:12px;font-weight:800;color:${theme.accent};margin-bottom:8px">${escapeHtml(slide.tag)}</div>
              <h2 style="font-family:${theme.fontStyle === "serif" || theme.fontStyle === "editorial" ? "'Fraunces', Georgia, serif" : "'Inter', sans-serif"};font-size:27px;line-height:1.14;margin:0 0 14px">${escapeHtml(slide.headline)}</h2>
              <p style="font-size:14px;opacity:0.86;line-height:1.55;margin:0">${escapeHtml(slide.body)}</p>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid rgba(128,128,128,0.22);font-size:12px;font-weight:700">
              <span>@${escapeHtml(store.data.activeWorkspace.ig_handle)}</span>
              <span style="color:${theme.accent}">${idx < slides.length - 1 ? "Swipe >" : "SAVE THIS POST ★"}</span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;gap:8px;flex-wrap:wrap">
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm" id="car-prev-slide">&larr; Prev</button>
              <button class="btn btn-sm" id="car-next-slide">Next &rarr;</button>
              <button class="btn btn-sm" id="car-add-slide">+ Slide</button>
            </div>
            <button class="btn btn-sm" id="car-download-png">&darr; Export 4:5 PNG</button>
          </div>
          <div class="card" style="margin-top:12px;padding:14px">
            <div style="font-weight:700;font-size:13px">${escapeHtml(theme.name)}</div>
            <div style="font-size:12px;color:var(--text-muted)">${escapeHtml(theme.desc)}</div>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:8px">
            <span class="kicker">SLIDE TEXT EDITOR · LIVE UPDATES</span>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-sm btn-primary" id="btn-save-carousel">Save Edits</button>
              <button class="btn btn-sm btn-accent" id="btn-schedule-carousel">+ Send Deck to Scheduler &rarr;</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${slides.map((s, sIdx) => `
              <div style="padding:14px;border-radius:14px;background:${sIdx === idx ? "var(--accent-soft)" : "var(--bg-subtle)"};border:1px solid ${sIdx === idx ? "var(--accent)" : "var(--border)"}" data-focus-slide="${sIdx}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                  <span class="mono" style="font-size:11px;font-weight:800;color:var(--accent)">${escapeHtml(s.tag)}</span>
                  ${slides.length > 2 ? `<button class="btn btn-sm" style="padding:1px 7px;font-size:10px" data-rm-slide="${sIdx}">Remove</button>` : ""}
                </div>
                <input class="input" data-slide-head="${sIdx}" value="${escapeHtml(s.headline)}" style="font-weight:700;margin-bottom:8px" />
                <textarea class="textarea" data-slide-body="${sIdx}" rows="2" style="min-height:58px">${escapeHtml(s.body)}</textarea>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindAppStudioEvents(root) {
  const createForm = root.querySelector("#full-create-form");
  if (createForm) {
    const syncDraft = () => {
      createDraft.mediaType = root.querySelector("#cr-type").value;
      createDraft.coverStyle = root.querySelector("#cr-cover").value;
      createDraft.title = root.querySelector("#cr-title").value;
      createDraft.caption = root.querySelector("#cr-caption").value;
      createDraft.firstComment = root.querySelector("#cr-first").value;
      createDraft.collabHandle = root.querySelector("#cr-collab").value;
      createDraft.scheduledLocal = root.querySelector("#cr-sched").value;
      createDraft.automationId = root.querySelector("#cr-auto").value;
      createDraft.isTrialReel = root.querySelector("#cr-trial").checked;
    };
    ["#cr-type", "#cr-cover", "#cr-auto", "#cr-trial"].forEach((sel) => { root.querySelector(sel).onchange = () => { syncDraft(); notify(); }; });
    ["#cr-title", "#cr-caption", "#cr-collab", "#cr-first", "#cr-sched"].forEach((sel) => { root.querySelector(sel).oninput = () => { syncDraft(); }; });
    root.querySelector("#cr-ai-btn").onclick = async () => {
      syncDraft();
      try {
        const res = await apiRequest("/api/ai/captions", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, topic: createDraft.title, enforceQuota: true }) });
        createDraft.caption = res.captions[0].body;
        if (res.bundle) updateBundle(res.bundle); else notify();
        toast("Generated AI caption!");
      } catch (err) { toast(err.message, "error"); }
    };
    const submitPost = async (status) => {
      syncDraft();
      try {
        const b = await apiRequest("/api/posts", {
          method: "POST",
          body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, status, mediaType: createDraft.mediaType, title: createDraft.title, caption: createDraft.caption, firstComment: createDraft.firstComment, collabHandle: createDraft.collabHandle, coverStyle: createDraft.coverStyle, automationId: createDraft.automationId || null, isTrialReel: createDraft.isTrialReel, scheduledAt: new Date(createDraft.scheduledLocal).toISOString() })
        });
        updateBundle(b);
        store.appPage = "scheduler";
        notify();
        toast(status === "DRAFT" ? "Saved post draft to Calendar!" : "Scheduled post to Calendar & Grid!");
      } catch (err) { toast(err.message, "error"); }
    };
    createForm.onsubmit = (e) => { e.preventDefault(); submitPost("SCHEDULED"); };
    root.querySelector("#cr-save-draft").onclick = () => submitPost("DRAFT");
  }

  const openComp = root.querySelector("#btn-open-composer") || root.querySelector("#btn-grid-new-post");
  if (openComp) openComp.onclick = () => openPostComposerModal();
  root.querySelectorAll("[data-quick-add]").forEach((btn) => { btn.onclick = (e) => { e.stopPropagation(); openPostComposerModal(btn.dataset.quickAdd); }; });
  root.querySelectorAll("[data-open-post]").forEach((chip) => { chip.onclick = () => openPostDetailsModal(chip.dataset.openPost); });

  const prev = root.querySelector("#cal-prev");
  const next = root.querySelector("#cal-next");
  const today = root.querySelector("#cal-today");
  if (prev) prev.onclick = () => { if (store.calView === "week") store.calWeekOffset--; else if (store.calMonth === 0) { store.calMonth = 11; store.calYear--; } else store.calMonth--; notify(); };
  if (next) next.onclick = () => { if (store.calView === "week") store.calWeekOffset++; else if (store.calMonth === 11) { store.calMonth = 0; store.calYear++; } else store.calMonth++; notify(); };
  if (today) today.onclick = () => { store.calYear = 2026; store.calMonth = 9; store.calWeekOffset = 0; notify(); };
  root.querySelectorAll("[data-cal-view]").forEach((b) => { b.onclick = () => { store.calView = b.dataset.calView; notify(); }; });
  root.querySelectorAll("[data-cal-status]").forEach((b) => { b.onclick = () => { store.calStatusFilter = b.dataset.calStatus; notify(); }; });

  root.querySelectorAll("[data-grid-crop]").forEach((b) => {
    b.onclick = async () => { const bundle = await apiRequest("/api/workspaces/settings", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, gridCrop: b.dataset.gridCrop }) }); updateBundle(bundle); };
  });
  const moreBtn = root.querySelector("#btn-grid-more");
  if (moreBtn) moreBtn.onclick = () => { store.gridShowAll = !store.gridShowAll; notify(); };

  root.querySelectorAll("[data-click-swap]").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.dataset.clickSwap;
      if (!selectedSwapFirstId) { selectedSwapFirstId = id; notify(); }
      else if (selectedSwapFirstId === id) { selectedSwapFirstId = null; notify(); }
      else {
        const first = selectedSwapFirstId;
        selectedSwapFirstId = null;
        const bundle = await apiRequest("/api/posts/swap", { method: "POST", body: JSON.stringify({ postAId: first, postBId: id }) });
        updateBundle(bundle);
        toast("Swapped scheduled publish timestamps across both grid posts!");
      }
    };
  });

  let draggedId = null;
  root.querySelectorAll("[data-drag-post]").forEach((tile) => {
    tile.ondragstart = () => { draggedId = tile.dataset.dragPost; };
    tile.ondragover = (e) => e.preventDefault();
    tile.ondrop = async (e) => {
      e.preventDefault();
      const targetId = tile.dataset.dragPost;
      if (draggedId && targetId && draggedId !== targetId) {
        const bundle = await apiRequest("/api/posts/swap", { method: "POST", body: JSON.stringify({ postAId: draggedId, postBId: targetId }) });
        updateBundle(bundle);
        toast("Swapped scheduled publish timestamps across both grid posts!");
      }
    };
  });

  const phForm = root.querySelector("#grid-placeholder-form");
  if (phForm) {
    phForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(phForm);
      const bundle = await apiRequest("/api/grid/placeholders", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, note: fd.get("note"), color: fd.get("color") }) });
      updateBundle(bundle);
      toast("Added idea placeholder tile to top of grid!");
    };
  }
  root.querySelectorAll("[data-ph-del]").forEach((b) => { b.onclick = async () => { const bundle = await apiRequest("/api/grid/placeholders", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, action: "delete", placeholderId: b.dataset.phDel }) }); updateBundle(bundle); }; });
  root.querySelectorAll("[data-ph-convert]").forEach((b) => { b.onclick = async () => { const bundle = await apiRequest("/api/grid/placeholders", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, action: "convert", placeholderId: b.dataset.phConvert }) }); updateBundle(bundle); toast("Converted idea tile into a Scheduled Post!"); }; });

  const carForm = root.querySelector("#carousel-gen-form");
  if (carForm) {
    carForm.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(carForm);
      const res = await apiRequest("/api/carousels/generate", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, prompt: fd.get("prompt"), themeId: fd.get("themeId"), slideCount: Number(fd.get("slideCount")) }) });
      store.selectedCarouselId = res.createdId;
      store.selectedSlideIndex = 0;
      store.selectedThemeOverride = null;
      updateBundle(res);
      toast("Generated multi-slide themed carousel!");
    };
  }
  const themeSel = root.querySelector("#car-theme-select");
  if (themeSel) themeSel.onchange = () => { store.selectedThemeOverride = themeSel.value; notify(); };
  root.querySelectorAll("[data-pick-carousel]").forEach((b) => { b.onclick = () => { store.selectedCarouselId = b.dataset.pickCarousel; store.selectedSlideIndex = 0; store.selectedThemeOverride = null; notify(); }; });

  const activeCar = store.data.carousels.find((c) => c.id === store.selectedCarouselId) || store.data.carousels[0];
  const prevS = root.querySelector("#car-prev-slide");
  const nextS = root.querySelector("#car-next-slide");
  const addS = root.querySelector("#car-add-slide");
  if (prevS) prevS.onclick = () => { store.selectedSlideIndex = Math.max(0, store.selectedSlideIndex - 1); notify(); };
  if (nextS && activeCar) nextS.onclick = () => { store.selectedSlideIndex = Math.min(activeCar.slides.length - 1, store.selectedSlideIndex + 1); notify(); };
  if (addS && activeCar) {
    addS.onclick = async () => {
      activeCar.slides.push({ tag: String(activeCar.slides.length).padStart(2, "0"), headline: "Bonus takeaway slide", body: "Edit this slide copy on the right and click Save Edits.", badge: "BONUS" });
      store.selectedSlideIndex = activeCar.slides.length - 1;
      const b = await apiRequest("/api/carousels/update", { method: "POST", body: JSON.stringify({ carouselId: activeCar.id, slides: activeCar.slides }) });
      updateBundle(b);
      toast("Added new slide card!");
    };
  }
  root.querySelectorAll("[data-rm-slide]").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      activeCar.slides.splice(Number(btn.dataset.rmSlide), 1);
      store.selectedSlideIndex = 0;
      const b = await apiRequest("/api/carousels/update", { method: "POST", body: JSON.stringify({ carouselId: activeCar.id, slides: activeCar.slides }) });
      updateBundle(b);
    };
  });
  root.querySelectorAll("[data-focus-slide]").forEach((box) => { box.onclick = () => { const n = Number(box.dataset.focusSlide); if (store.selectedSlideIndex !== n) { store.selectedSlideIndex = n; notify(); } }; });
  root.querySelectorAll("[data-slide-head]").forEach((inp) => { inp.oninput = () => { activeCar.slides[Number(inp.dataset.slideHead)].headline = inp.value; }; });
  root.querySelectorAll("[data-slide-body]").forEach((inp) => { inp.oninput = () => { activeCar.slides[Number(inp.dataset.slideBody)].body = inp.value; }; });

  const saveCar = root.querySelector("#btn-save-carousel");
  if (saveCar && activeCar) {
    saveCar.onclick = async () => {
      const themeId = root.querySelector("#car-theme-select").value;
      const bundle = await apiRequest("/api/carousels/update", { method: "POST", body: JSON.stringify({ carouselId: activeCar.id, themeId, slides: activeCar.slides }) });
      store.selectedThemeOverride = null;
      updateBundle(bundle);
      toast("Saved slide edits & active theme!");
    };
  }
  const schedCar = root.querySelector("#btn-schedule-carousel");
  if (schedCar && activeCar) {
    schedCar.onclick = async () => {
      const bundle = await apiRequest("/api/posts", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, mediaType: "CAROUSEL", title: activeCar.title, caption: activeCar.caption, coverStyle: "cream", scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString() }) });
      updateBundle(bundle);
      store.appPage = "scheduler";
      notify();
      toast("Scheduled Carousel onto Calendar & Grid!");
    };
  }
  const dlPng = root.querySelector("#car-download-png");
  if (dlPng && activeCar) {
    dlPng.onclick = () => {
      const s = activeCar.slides[store.selectedSlideIndex] || activeCar.slides[0];
      const th = store.data.themes.find((t) => t.id === (store.selectedThemeOverride || activeCar.theme_id)) || store.data.themes[0];
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = th.bg;
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = th.accent;
      ctx.font = "bold 36px monospace";
      ctx.fillText(s.tag, 90, 180);
      ctx.fillStyle = th.fg;
      const wrapDraw = (text, maxChars, startY, lineH, font) => {
        ctx.font = font;
        let line = "", y = startY;
        for (const w of String(text || "").split(" ")) {
          if ((line + w).length > maxChars) { ctx.fillText(line.trim(), 90, y); line = w + " "; y += lineH; }
          else line += w + " ";
        }
        if (line.trim()) { ctx.fillText(line.trim(), 90, y); y += lineH; }
        return y;
      };
      const nextY = wrapDraw(s.headline, 23, 300, 82, "bold 64px Georgia, serif");
      wrapDraw(s.body, 40, nextY + 54, 52, "36px sans-serif");
      ctx.fillStyle = th.accent;
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(`@${store.data.activeWorkspace.ig_handle} · Swipe >`, 90, 1250);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${activeCar.id}-slide-${store.selectedSlideIndex + 1}.png`;
      a.click();
      toast("Exported 1080×1350 (4:5) slide PNG!");
    };
  }
}
