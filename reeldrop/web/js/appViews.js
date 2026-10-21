import { store, escHtml, fmtNum } from "./api.js";
import { icon } from "./icons.js";

const COVER_STYLES = ["noir", "slate", "cobalt", "terracotta", "forest", "stone", "cream", "plum"];

function statusBadge(status) {
  if (status === "PUBLISHED") return `<span class="badge badge-success"><span class="dot"></span>Published</span>`;
  if (status === "SCHEDULED") return `<span class="badge badge-info"><span class="dot"></span>Scheduled</span>`;
  if (status === "FAILED") return `<span class="badge badge-danger"><span class="dot"></span>Needs Attention</span>`;
  return `<span class="badge">Draft</span>`;
}

function formatShortDate(iso) {
  if (!iso) return "Unscheduled";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " +
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function getPostVisualUrl(post, idx = 0) {
  if (post?.media_url) return post.media_url;
  const fallbackNum = String(((idx % 11) + 1)).padStart(2, "0");
  return `/media/post-${fallbackNum}.svg`;
}

export function renderUnconnectedBanner() {
  const b = store.bundle;
  if (b.isPlatformConnected) return "";
  return `
    <div class="card card-pad" style="margin-bottom:20px;background:var(--brand-soft);border-color:var(--brand-border);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;">
      <div style="display:flex;align-items:flex-start;gap:12px;max-width:720px;">
        <span style="width:34px;height:34px;border-radius:10px;background:var(--brand);color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
          ${icon("link", 17)}
        </span>
        <div>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong style="font-size:14px;">Instagram Account Not Connected (Clean Empty Mode)</strong>
            <span class="badge">Meta OAuth Required</span>
          </div>
          <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:3px;line-height:1.5;">
            Connect an Instagram Creator or Business profile via Official Meta Graph OAuth to import published grid posts, publish scheduled containers, receive comment/DM webhooks, and unlock 24h inbox replies — or create local drafts right now.
          </p>
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <button type="button" class="btn btn-primary btn-sm" data-open-meta-setup>
          ${icon("shield", 14)} Connect Instagram OAuth
        </button>
        <button type="button" class="btn btn-sm" data-switch-mode="sample">
          Load Sample Data
        </button>
      </div>
    </div>
  `;
}

/* ============================================================================
   1. OVERVIEW (/app/overview)
   ============================================================================ */
export function renderOverview() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const scheduled = b.posts.filter((p) => p.status === "SCHEDULED");
  const published = b.posts.filter((p) => p.status === "PUBLISHED");
  const failed = b.posts.filter((p) => p.status === "FAILED");
  const totalViews = published.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalDms = b.automations.reduce((acc, a) => acc + (a.dms_sent || 0), 0);
  const unreadThreads = b.threads.filter((t) => t.unread_count > 0);

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Workspace Overview</h1>
          <p class="page-desc">@${escHtml(ws.ig_handle)} &middot; ${escHtml(ws.planSpec.name)} Plan &middot; ${escHtml(ws.timezone)} ${!b.isPlatformConnected ? `&middot; <span style="color:var(--warning);font-weight:600;">Not Connected</span>` : ""}</p>
        </div>
        <div class="head-actions">
          <button class="btn" id="btn-run-queue-worker" title="Publish the next queued post right now">
            ${icon("refresh", 15)} Run Queue Worker
          </button>
          <a href="/app/automations" data-link class="btn">
            ${icon("bolt", 15)} Workflows
          </a>
          <a href="/app/create" data-link class="btn btn-primary">
            ${icon("plus", 15)} Create Post
          </a>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      ${b.posts.length === 0 && b.automations.length === 0 ? `
        <div class="card card-pad" style="margin-bottom:20px;display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
            <div>
              <div class="card-title">4-Step Studio Setup Checklist</div>
              <div class="card-sub">Follow these steps when launching a brand-new Velora workspace with zero preloaded data</div>
            </div>
            <span class="badge badge-info">${b.isPlatformConnected ? "1 / 4 Complete" : "0 / 4 Complete"}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;">
            <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <span class="mono" style="font-size:11px;font-weight:700;color:var(--brand);">STEP 01</span>
                <div style="font-weight:600;font-size:14px;margin:4px 0;">Connect Meta Graph OAuth</div>
                <p style="font-size:12px;color:var(--ink-muted);">Link your Instagram Business/Creator account &amp; Messenger webhook callback.</p>
              </div>
              <button type="button" class="btn btn-sm ${b.isPlatformConnected ? "" : "btn-primary"}" data-open-meta-setup>${b.isPlatformConnected ? "Connected ✓" : "Connect Account"}</button>
            </div>
            <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <span class="mono" style="font-size:11px;font-weight:700;color:var(--brand);">STEP 02</span>
                <div style="font-weight:600;font-size:14px;margin:4px 0;">Compose Your First Post</div>
                <p style="font-size:12px;color:var(--ink-muted);">Upload any image/MP4, crop to 4:5 or 9:16, or generate a full post pack with AI.</p>
              </div>
              <a href="/app/create" data-link class="btn btn-sm">Open Composer &rarr;</a>
            </div>
            <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <span class="mono" style="font-size:11px;font-weight:700;color:var(--brand);">STEP 03</span>
                <div style="font-weight:600;font-size:14px;margin:4px 0;">Activate Keyword DM Rule</div>
                <p style="font-size:12px;color:var(--ink-muted);">Auto-send links on comments &amp; Story replies with public reply rotation.</p>
              </div>
              <a href="/app/automations" data-link class="btn btn-sm">Create Rule &rarr;</a>
            </div>
            <div class="card card-pad" style="background:var(--bg-page);display:flex;flex-direction:column;justify-content:space-between;gap:10px;">
              <div>
                <span class="mono" style="font-size:11px;font-weight:700;color:var(--brand);">STEP 04</span>
                <div style="font-weight:600;font-size:14px;margin:4px 0;">Connect Claude / Cursor MCP</div>
                <p style="font-size:12px;color:var(--ink-muted);">Point any MCP client at <code class="mono">/mcp</code> to run all 58 studio tools.</p>
              </div>
              <a href="/app/settings" data-link class="btn btn-sm">MCP Settings &rarr;</a>
            </div>
          </div>
        </div>
      ` : ""}

      ${failed.length ? `
        <div class="card card-pad" style="margin-bottom:18px;background:var(--danger-soft);border-color:rgba(220,38,38,0.24);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${icon("alert", 18)}
            <div style="font-size:13px;">
              <strong>1 scheduled container requires attention:</strong> "${escHtml(failed[0].title)}" — ${escHtml(failed[0].error_reason || "Aspect ratio check failed")}
            </div>
          </div>
          <button class="btn btn-sm" data-retry-post="${escHtml(failed[0].id)}">Re-queue Container</button>
        </div>
      ` : ""}

      <div class="kpi-grid">
        <div class="card kpi-card">
          <div class="kpi-top"><span>Total Post Views</span>${icon("eye", 15)}</div>
          <div class="kpi-val">${fmtNum(totalViews)}</div>
          <div class="kpi-foot"><span class="badge badge-success">+18.4%</span> across ${published.length} live posts</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span>Scheduled in Queue</span>${icon("calendar", 15)}</div>
          <div class="kpi-val">${scheduled.length}</div>
          <div class="kpi-foot">${scheduled[0] ? `Next: ${formatShortDate(scheduled[0].scheduled_at)}` : "Queue clear"}</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span>Automated DMs Sent</span>${icon("bolt", 15)}</div>
          <div class="kpi-val">${fmtNum(totalDms)}</div>
          <div class="kpi-foot">${b.automations.filter((a) => a.status === "active").length} active rules running</div>
        </div>
        <div class="card kpi-card">
          <div class="kpi-top"><span>Priority Unread DMs</span>${icon("inbox", 15)}</div>
          <div class="kpi-val">${unreadThreads.length}</div>
          <div class="kpi-foot">${b.threads.length} open conversations in Inbox</div>
        </div>
      </div>

      <div class="split-2">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Upcoming Publishing Queue</div>
              <div class="card-sub">Auto-published by background worker at scheduled slot</div>
            </div>
            <a href="/app/calendar" data-link class="btn btn-sm btn-ghost">Calendar ${icon("arrowRight", 14)}</a>
          </div>
          <div>
            ${b.posts.filter((p) => p.status !== "PUBLISHED").length === 0 ? `
              <div style="padding:36px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px;">
                <span style="color:var(--ink-muted);">${icon("calendar", 24)}</span>
                <div style="font-weight:600;font-size:14px;">Publishing Queue is Empty</div>
                <p style="font-size:12.5px;color:var(--ink-muted);max-width:340px;">No Reels, Carousels, or Photos are queued yet. Schedule your first post or load demo data to test auto-publishing.</p>
                <a href="/app/create" data-link class="btn btn-sm btn-primary">${icon("plus", 14)} Schedule First Post</a>
              </div>
            ` : b.posts.filter((p) => p.status !== "PUBLISHED").slice(0, 5).map((p, idx) => {
              const vis = getPostVisualUrl(p, idx);
              return `
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border-subtle);">
                  <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                    <div style="width:44px;height:55px;border-radius:8px;flex-shrink:0;overflow:hidden;border:1px solid var(--border);background:var(--bg-subtle);">
                      ${vis.startsWith("data:video")
                        ? `<video src="${escHtml(vis)}" muted style="width:100%;height:100%;object-fit:cover;"></video>`
                        : `<img src="${escHtml(vis)}" alt="" style="width:100%;height:100%;object-fit:cover;" />`}
                    </div>
                    <div style="min-width:0;">
                      <div style="font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(p.title)}</div>
                      <div style="font-size:12px;color:var(--ink-muted);display:flex;align-items:center;gap:8px;margin-top:2px;" class="tabular">
                        <span>${escHtml(p.media_type)}</span>
                        <span>&middot;</span>
                        <span>${formatShortDate(p.scheduled_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                    ${statusBadge(p.status)}
                    <button class="btn btn-sm" data-inspect-post="${escHtml(p.id)}">Inspect</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Active DM Workflows</div>
              <a href="/app/automations" data-link class="btn btn-sm btn-ghost">Manage ${icon("arrowRight", 14)}</a>
            </div>
            <div>
              ${b.automations.length === 0 ? `
                <div style="padding:22px 18px;text-align:center;font-size:12.5px;color:var(--ink-muted);">
                  No keyword workflows active yet. <a href="/app/automations" data-link style="color:var(--brand);font-weight:600;">Create first rule &rarr;</a>
                </div>
              ` : b.automations.slice(0, 3).map((a) => {
                const ctr = a.dms_sent ? ((a.link_taps / a.dms_sent) * 100).toFixed(1) : "0.0";
                return `
                  <div style="padding:12px 18px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:10px;">
                    <div style="min-width:0;">
                      <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(a.name)}</div>
                      <div style="font-size:12px;color:var(--ink-muted);margin-top:2px;">
                        Keywords: ${a.keywords.map((k) => `<code class="mono">${escHtml(k)}</code>`).join(", ") || "AI Context"}
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;" class="tabular">
                      <div style="font-weight:700;font-size:13px;">${fmtNum(a.dms_sent)} DMs</div>
                      <div style="font-size:11px;color:var(--success);">${ctr}% CTR</div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Priority Messages</div>
              <a href="/app/inbox" data-link class="btn btn-sm btn-ghost">Open Inbox ${icon("arrowRight", 14)}</a>
            </div>
            <div>
              ${b.threads.length === 0 ? `
                <div style="padding:22px 18px;text-align:center;font-size:12.5px;color:var(--ink-muted);">
                  No incoming Instagram DMs yet. Connect Messenger Webhook to receive live conversations.
                </div>
              ` : b.threads.slice(0, 3).map((t) => `
                <a href="/app/inbox" data-link style="padding:11px 18px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                    <span class="ws-avatar" style="background:${escHtml(t.avatar_color || "#0F172A")};">${escHtml(t.participant_handle[0].toUpperCase())}</span>
                    <div style="min-width:0;">
                      <div style="font-weight:600;font-size:13px;">@${escHtml(t.participant_handle)}</div>
                      <div style="font-size:12px;color:var(--ink-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(t.last_message_preview)}</div>
                    </div>
                  </div>
                  ${t.unread_count ? `<span class="nav-count is-alert">${t.unread_count}</span>` : `<span class="badge">Open</span>`}
                </a>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   2. CREATE POST COMPOSER (/app/create) — Upload Progress, Resize/Crop & AI Studio
   ============================================================================ */
export function renderCropStudioModal() {
  const cs = store.ui.cropStudio;
  if (!cs || !cs.open || !cs.srcUrl) return "";
  return `
    <div class="crop-modal-backdrop" id="crop-modal-backdrop">
      <div class="crop-modal-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--border);">
          <div>
            <h3 style="font-size:17px;">Resize, Aspect-Ratio &amp; Crop Studio</h3>
            <p style="font-size:12.5px;color:var(--ink-muted);">Source resolution: ${cs.origW}&times;${cs.origH}px &middot; Exports crisp 1080px PNG straight to SQLite</p>
          </div>
          <button type="button" class="icon-btn" id="btn-close-crop-modal">${icon("x", 17)}</button>
        </div>

        <div class="split-2" style="align-items:center;">
          <div class="crop-stage-wrap">
            <img id="crop-live-preview-img" src="${escHtml(cs.previewUrl || cs.srcUrl)}" alt="Live crop preview" style="max-height:360px;max-width:100%;border-radius:10px;box-shadow:var(--shadow-md);" />
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="field">
              <label class="field-label">Target Instagram Ratio</label>
              <div class="segmented" style="width:100%;display:grid;grid-template-columns:repeat(4,1fr);">
                ${[
                  ["4:5", "4:5 Feed"],
                  ["9:16", "9:16 Reel"],
                  ["1:1", "1:1 Square"],
                  ["1.91:1", "16:9 Wide"]
                ].map(([val, label]) => `
                  <button type="button" class="seg-btn ${cs.aspect === val ? "is-active" : ""}" data-crop-aspect="${val}">${label}</button>
                `).join("")}
              </div>
            </div>

            <div class="field">
              <label class="field-label">Framing Mode</label>
              <div class="segmented" style="width:100%;display:grid;grid-template-columns:1fr 1fr;">
                <button type="button" class="seg-btn ${cs.fitMode === "contain" ? "is-active" : ""}" data-crop-fit="contain">Smart Fit (No Cut-Off)</button>
                <button type="button" class="seg-btn ${cs.fitMode === "cover" ? "is-active" : ""}" data-crop-fit="cover">Fill &amp; Crop</button>
              </div>
            </div>

            ${cs.fitMode === "contain" ? `
              <div class="field">
                <label class="field-label">Studio Matte Backdrop</label>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${[
                    ["blur", "Blurred Glass"],
                    ["white", "Pearl White"],
                    ["stone", "Warm Stone"],
                    ["slate", "Deep Slate"]
                  ].map(([id, name]) => `
                    <button type="button" class="btn btn-sm ${cs.bgStyle === id ? "btn-primary" : ""}" data-crop-bg="${id}">${name}</button>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            <div class="field">
              <div class="field-label">
                <span>Zoom Scale</span>
                <span class="mono" id="crop-zoom-val">${cs.zoom}%</span>
              </div>
              <input type="range" class="v-range" id="crop-zoom-slider" min="70" max="220" value="${cs.zoom}" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div class="field">
                <div class="field-label"><span>Horizontal Pan (X)</span><span class="mono" id="crop-panx-val">${cs.panX}%</span></div>
                <input type="range" class="v-range" id="crop-panx-slider" min="-60" max="60" value="${cs.panX}" />
              </div>
              <div class="field">
                <div class="field-label"><span>Vertical Pan (Y)</span><span class="mono" id="crop-pany-val">${cs.panY}%</span></div>
                <input type="range" class="v-range" id="crop-pany-slider" min="-60" max="60" value="${cs.panY}" />
              </div>
            </div>

            <div style="display:flex;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid var(--border);">
              <button type="button" class="btn btn-sm" id="btn-reset-crop">Reset Framing</button>
              <button type="button" class="btn btn-primary" id="btn-apply-crop">${icon("check", 15)} Apply High-Res Crop</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCreatePost() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const ui = store.ui;
  const isEmpty = b.dataMode === "empty";
  const defaultSched = ui.composerScheduledDate || new Date(Date.now() + 3600000 * 5).toISOString().slice(0, 16);
  const captionVal = isEmpty
    ? (ui.composerCaption || "")
    : (ui.composerCaption || "Most teams overcomplicate design tokens before shipping their very first component library.\n\nComment \"REPO\" below and I will send the complete Figma token starter file straight to your DMs.");
  const tagsVal = isEmpty
    ? (ui.composerHashtags || "")
    : (ui.composerHashtags || "#designsystems #uidesign #figmatips #productdesign");
  const fullText = `${captionVal}${tagsVal ? `\n\n${tagsVal}` : ""}`;
  const activeMediaUrl = isEmpty ? (ui.composerMediaUrl || "") : (ui.composerMediaUrl || "/media/post-01.svg");
  const isVideo = activeMediaUrl.startsWith("data:video");
  const isContain = ui.composerMediaFit === "contain";
  const aspectClass = ui.composerAspect === "9:16" || ui.composerMediaType === "REEL" && ui.composerPreviewTab === "reel"
    ? "is-reel"
    : ui.composerAspect === "1:1"
      ? "is-square"
      : ui.composerAspect === "1.91:1"
        ? "is-landscape"
        : "";

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Create Post</h1>
          <p class="page-desc">Upload media with smart aspect-ratio fitting, co-write hooks &amp; captions with AI, and inspect your live Instagram preview.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            ${["POST", "REEL", "CAROUSEL", "STORY"].map((t) => `
              <button type="button" class="seg-btn ${ui.composerMediaType === t ? "is-active" : ""}" data-composer-type="${t}">${t}</button>
            `).join("")}
          </div>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      <div class="composer-layout">
        <div style="display:flex;flex-direction:column;gap:18px;min-width:0;">
          <!-- PANEL A: AI POST CO-PILOT & VISUAL COVER GENERATOR -->
          <div class="card card-pad" style="background:var(--bg-surface);border-color:var(--brand-border);display:flex;flex-direction:column;gap:13px;">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span style="width:28px;height:28px;border-radius:8px;background:var(--brand-soft);color:var(--brand);display:inline-flex;align-items:center;justify-content:center;">${icon("wand", 15)}</span>
                <div>
                  <div style="font-weight:700;font-size:14px;">AI Post Co-Pilot &amp; Visual Card Studio</div>
                  <div style="font-size:12px;color:var(--ink-muted);">Generate scored hooks, full structured captions, safe hashtags, first comment &amp; custom 1080&times;1350 cover art</div>
                </div>
              </div>
              <button type="button" class="btn btn-sm" id="btn-generate-ai-visual">
                ${icon("image", 14)} Generate AI Cover Image
              </button>
            </div>

            <div style="display:grid;grid-template-columns:minmax(0,1.6fr) 150px 165px auto;gap:8px;align-items:end;">
              <div class="field">
                <label class="field-label">Post Topic or Raw Idea</label>
                <input class="input" id="ai-topic-input" value="${escHtml(ui.aiTopic || ui.composerTitle || "Design Tokens Starter Breakdown")}" placeholder="e.g., How we cut SaaS onboarding drop-off by 42%..." />
              </div>
              <div class="field">
                <label class="field-label">Voice &amp; Tone</label>
                <select class="select" id="ai-tone-select">
                  ${["Editorial", "Contrarian", "Founder Story", "Tactical Guide"].map((t) => `
                    <option value="${t}" ${ui.aiTone === t ? "selected" : ""}>${t}</option>
                  `).join("")}
                </select>
              </div>
              <div class="field">
                <label class="field-label">Primary Goal</label>
                <select class="select" id="ai-goal-select">
                  <option value="dm_keyword" ${ui.aiGoal === "dm_keyword" ? "selected" : ""}>Drive DM Keyword</option>
                  <option value="saves" ${ui.aiGoal === "saves" ? "selected" : ""}>Maximize Saves</option>
                  <option value="reach" ${ui.aiGoal === "reach" ? "selected" : ""}>Non-Follower Reach</option>
                  <option value="launch" ${ui.aiGoal === "launch" ? "selected" : ""}>Product Launch</option>
                </select>
              </div>
              <button type="button" class="btn btn-primary" id="btn-generate-ai-pack">
                ${icon("wand", 14)} Generate Full Post
              </button>
            </div>

            ${ui.aiPack ? `
              <div class="pane-crossfade" style="padding:12px 14px;border-radius:10px;background:var(--bg-page);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;">
                  <strong>AI Hook Alternatives (Click any hook to replace your opening line)</strong>
                  <span class="badge badge-success">Optimal Slot: ${escHtml(ui.aiPack.bestSlot)}</span>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;">
                  ${(ui.aiPack.hooks || []).map((h) => `
                    <button type="button" class="card card-pad" data-apply-ai-hook="${escHtml(h.text)}" style="padding:10px 12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px;">
                      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--brand);font-weight:700;">
                        <span>${escHtml(h.label)}</span>
                        <span>Score ${h.score}/99</span>
                      </div>
                      <div style="font-size:12.5px;color:var(--ink-primary);line-height:1.4;">"${escHtml(h.text)}"</div>
                    </button>
                  `).join("")}
                </div>
              </div>
            ` : ""}
          </div>

          <!-- PANEL B: MEDIA UPLOAD + PROGRESS + RESIZE/CROP STUDIO + FORM -->
          <form id="form-create-post" class="card card-pad" style="display:flex;flex-direction:column;gap:16px;">
            <div>
              <div class="field-label" style="margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span>Media Asset &amp; Aspect Framing</span>
                  ${ui.composerMediaDims ? `<span class="badge badge-info">${escHtml(ui.composerMediaDims)}</span>` : ""}
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                  ${!isVideo ? `
                    <button type="button" class="btn btn-sm btn-primary" id="btn-open-crop-studio">
                      ${icon("sliders", 13)} Resize &amp; Crop Studio
                    </button>
                  ` : ""}
                  ${ui.composerMediaUrl ? `<button type="button" class="btn btn-sm btn-ghost" id="btn-clear-media">Reset Media</button>` : ""}
                </div>
              </div>

              <!-- Live Animated Upload Progress Bar Container -->
              <div id="composer-upload-progress-slot">
                ${ui.uploadProgress?.active ? `
                  <div class="upload-progress-card" style="margin-bottom:10px;">
                    <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;color:var(--brand);">
                      <span>${escHtml(ui.uploadProgress.label || "Uploading media...")}</span>
                      <span class="mono">${ui.uploadProgress.pct}%</span>
                    </div>
                    <div class="upload-progress-track">
                      <div class="upload-progress-fill" style="width:${ui.uploadProgress.pct}%;"></div>
                    </div>
                  </div>
                ` : ""}
              </div>

              <label class="dropzone" id="composer-dropzone" for="composer-file-input" style="display:block;">
                <input type="file" id="composer-file-input" accept="image/*,video/*" multiple style="display:none;" />
                <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                  ${icon("upload", 22)}
                  <div style="font-weight:600;font-size:13.5px;">Drop screenshots, photos, or MP4 videos here — or click to browse</div>
                  <div style="font-size:12px;color:var(--ink-muted);">Wide screenshots automatically enable <strong>Smart Fit</strong> so zero text gets cut off &middot; Full interactive crop tool included</div>
                </div>
              </label>

              <!-- Quick Inline Aspect Ratio & Fit Mode Bar -->
              <div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--bg-subtle);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:12px;font-weight:600;color:var(--ink-secondary);">Frame Ratio:</span>
                  <div class="segmented">
                    ${[
                      ["4:5", "4:5 Feed"],
                      ["9:16", "9:16 Reel"],
                      ["1:1", "1:1 Square"],
                      ["1.91:1", "Landscape"]
                    ].map(([val, lbl]) => `
                      <button type="button" class="seg-btn ${ui.composerAspect === val ? "is-active" : ""}" data-quick-aspect="${val}">${lbl}</button>
                    `).join("")}
                  </div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:12px;font-weight:600;color:var(--ink-secondary);">Image Fit:</span>
                  <div class="segmented">
                    <button type="button" class="seg-btn ${isContain ? "is-active" : ""}" data-quick-fit="contain" title="Shows entire screenshot cleanly with blurred studio backdrop">Smart Fit</button>
                    <button type="button" class="seg-btn ${!isContain ? "is-active" : ""}" data-quick-fit="cover" title="Fills entire frame edge-to-edge">Fill Frame</button>
                  </div>
                </div>
              </div>

              <!-- Quick Studio Visual Presets + Uploaded Assets Strip -->
              <div style="margin-top:10px;display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:4px;">
                <span style="font-size:11.5px;color:var(--ink-muted);white-space:nowrap;">Studio gallery:</span>
                ${[1, 2, 3, 4, 5, 6].map((n) => {
                  const u = `/media/post-0${n}.svg`;
                  return `
                    <button type="button" data-pick-preset-media="${u}" style="padding:2px;border-radius:7px;border:2px solid ${activeMediaUrl === u ? "var(--brand)" : "transparent"};background:transparent;flex-shrink:0;">
                      <img src="${u}" alt="Preset ${n}" style="width:36px;height:45px;border-radius:5px;object-fit:cover;display:block;" />
                    </button>
                  `;
                }).join("")}
                ${b.mediaAssets.slice(0, 5).map((m) => `
                  <button type="button" class="btn btn-sm" data-pick-asset="${escHtml(m.id)}">
                    ${icon(m.mime_type.startsWith("video") ? "video" : "image", 13)} ${escHtml(m.filename.slice(0, 16))}
                  </button>
                `).join("")}
              </div>
            </div>

            <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;">
              <div class="field">
                <label class="field-label">Internal Post Title</label>
                <input class="input" name="title" id="comp-title" required value="${escHtml(ui.composerTitle || "Design Tokens Starter Breakdown")}" />
              </div>
              <div class="field">
                <label class="field-label">Location Tag (Optional)</label>
                <input class="input" name="location" id="comp-location" maxlength="40" value="${escHtml(ui.composerLocation || "Bengaluru · Studio")}" />
              </div>
            </div>

            <!-- Caption + AI Rewrite Bar + Saved Templates -->
            <div class="field">
              <div class="field-label" style="flex-wrap:wrap;gap:6px;">
                <span>Caption <span id="comp-char-counter" class="tabular" style="font-weight:400;color:var(--ink-muted);">(${fullText.length} / 2,200)</span></span>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                  <select class="select" id="comp-template-select" style="height:28px;padding:0 8px;font-size:12px;width:auto;">
                    <option value="">Insert Saved Template...</option>
                    ${b.templates.map((t) => `<option value="${escHtml(t.id)}">${escHtml(t.title)}</option>`).join("")}
                  </select>
                  <button type="button" class="btn btn-sm" id="btn-save-caption-template">Save Template</button>
                </div>
              </div>
              <textarea class="textarea" name="caption" id="comp-caption" rows="5">${escHtml(captionVal)}</textarea>

              <!-- 1-Click Inline AI Caption Rewriter Toolbar -->
              <div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:4px;">
                <span style="font-size:11.5px;font-weight:600;color:var(--ink-muted);">AI Rewrite:</span>
                ${[
                  ["punchier", "Make Punchier"],
                  ["hook", "Sharper Opening Hook"],
                  ["shorten", "Trim <125 Chars"],
                  ["cta", "+ Add DM Keyword CTA"],
                  ["story", "Founder Story Arc"]
                ].map(([mode, label]) => `
                  <button type="button" class="btn btn-sm" style="height:26px;font-size:11.5px;padding:0 9px;" data-ai-rewrite="${mode}">${label}</button>
                `).join("")}
              </div>
              <div id="comp-ai-suggestions"></div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field">
                <div class="field-label">
                  <span>Hashtags</span>
                  <button type="button" class="btn btn-sm btn-ghost" id="btn-check-tags" style="height:22px;padding:0 6px;">Check Safety</button>
                </div>
                <input class="input" name="hashtags" id="comp-hashtags" value="${escHtml(tagsVal)}" />
              </div>
              <div class="field">
                <label class="field-label">Auto First Comment (Optional)</label>
                <input class="input" name="firstComment" id="comp-first-comment" placeholder="Comment REPO for the direct link" value="${escHtml(ui.composerFirstComment)}" />
              </div>
            </div>
            <div id="comp-hashtag-report"></div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;">
              <div class="field">
                <label class="field-label">Schedule Date &amp; Time</label>
                <input class="input" type="datetime-local" name="scheduledAt" id="comp-sched" value="${escHtml(defaultSched)}" />
                <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:3px;">
                  ${(ws.posting_slots || ["09:30", "14:00", "20:30"]).map((slot) => `
                    <button type="button" class="badge" style="cursor:pointer;" data-quick-slot="${escHtml(slot)}">Today ${escHtml(slot)}</button>
                  `).join("")}
                </div>
              </div>
              <div class="field">
                <label class="field-label">Attach DM Workflow</label>
                <select class="select" name="automationId" id="comp-automation">
                  <option value="">None attached</option>
                  ${b.automations.map((a) => `<option value="${escHtml(a.id)}">${escHtml(a.name)}</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label class="field-label">Collaborator Handle</label>
                <input class="input" name="collabHandle" id="comp-collab" placeholder="@figma.design" value="${escHtml(ui.composerCollab)}" />
              </div>
            </div>

            <label style="display:flex;align-items:center;gap:9px;font-size:13px;padding:10px 12px;border-radius:8px;background:var(--bg-subtle);cursor:pointer;">
              <input type="checkbox" id="comp-trial-reel" ${ui.composerIsTrial ? "checked" : ""} />
              <span><strong>Publish as Trial Reel</strong> — test non-follower reach first before graduating to your main profile grid (${ws.trial_reels_used} used this month)</span>
            </label>

            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-top:8px;border-top:1px solid var(--border);">
              <button type="button" class="btn" data-submit-post="DRAFT">Save as Draft</button>
              <div style="display:flex;gap:8px;">
                <button type="button" class="btn" data-submit-post="PUBLISHED">Publish Now</button>
                <button type="submit" class="btn btn-primary">${icon("calendar", 15)} Schedule Post</button>
              </div>
            </div>
          </form>
        </div>

        <!-- RIGHT STICKY HIGH-DETAIL LIGHT INSTAGRAM POST PREVIEWER -->
        <aside style="position:sticky;top:76px;display:flex;flex-direction:column;gap:10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:12px;font-weight:600;color:var(--ink-secondary);">Live Instagram Preview</span>
            <div class="segmented">
              <button type="button" class="seg-btn ${ui.composerPreviewTab !== "reel" ? "is-active" : ""}" data-preview-mode="feed">Feed View</button>
              <button type="button" class="seg-btn ${ui.composerPreviewTab === "reel" ? "is-active" : ""}" data-preview-mode="reel">9:16 Reel</button>
            </div>
          </div>

          <div class="phone-frame">
            <div class="phone-screen">
              <!-- Native iOS Light Status Bar -->
              <div class="phone-status-bar">
                <span>9:41</span>
                <div class="phone-island"></div>
                <span style="font-size:10.5px;">5G &middot; 100%</span>
              </div>

              <!-- Native Instagram Post Header -->
              <div class="phone-ig-header">
                <div style="display:flex;align-items:center;gap:9px;min-width:0;">
                  <div class="phone-story-ring">
                    <div class="phone-story-ring-inner">${escHtml(ws.ig_handle[0].toUpperCase())}</div>
                  </div>
                  <div style="min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:#09090B;">
                      <span>${escHtml(ws.ig_handle)}</span>
                      <span style="display:inline-flex;width:13px;height:13px;border-radius:50%;background:#3B82F6;color:#FFFFFF;align-items:center;justify-content:center;font-size:8.5px;">&#10003;</span>
                    </div>
                    <div id="preview-location-text" style="font-size:10.5px;color:#64748B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                      ${escHtml(ui.composerLocation || "Bengaluru · Studio")}
                    </div>
                  </div>
                </div>
                <span style="font-size:15px;font-weight:700;color:#64748B;letter-spacing:1px;">&bull;&bull;&bull;</span>
              </div>

              <!-- Smart-Fitted OR Full-Bleed Crisp Visual Frame -->
              <div class="phone-media-box ${aspectClass} ${isContain ? "is-fit-contain" : ""}">
                ${activeMediaUrl ? `
                  ${isContain && !isVideo ? `<img class="phone-media-backdrop" src="${escHtml(activeMediaUrl)}" alt="" />` : ""}
                  ${isVideo
                    ? `<video class="media-main" src="${escHtml(activeMediaUrl)}" autoplay muted loop playsinline controls></video>`
                    : `<img class="media-main" src="${escHtml(activeMediaUrl)}" alt="Post preview" />`
                  }
                ` : `
                  <div style="text-align:center;color:#64748B;display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px;">
                    ${icon("image", 26)}
                    <div style="font-weight:700;font-size:13px;color:#09090B;">No Media Selected Yet</div>
                    <p style="font-size:11.5px;line-height:1.45;">Upload a photo/video on the left, pick a studio preset, or click <strong>Generate AI Cover Image</strong>.</p>
                  </div>
                `}
                ${ui.composerSlidesMedia?.length > 1 ? `
                  <span style="position:absolute;top:10px;right:10px;z-index:4;padding:3px 8px;border-radius:999px;background:rgba(15,23,42,0.72);color:#FFFFFF;font-size:10.5px;font-weight:600;">
                    1 / ${ui.composerSlidesMedia.length}
                  </span>
                ` : ""}
              </div>

              <!-- Authentic Light Instagram Action Row + Likes + Fold Caption -->
              <div class="phone-ig-actions">
                <div style="display:flex;align-items:center;gap:13px;">
                  ${icon("heart", 18)}${icon("message", 18)}${icon("send", 18)}
                </div>
                ${icon("bookmark", 18)}
              </div>

              <div class="phone-ig-caption">
                <div style="font-weight:700;font-size:12px;margin-bottom:4px;color:#09090B;">1,842 likes</div>
                <div id="preview-caption-fold">
                  <strong style="color:#09090B;">${escHtml(ws.ig_handle)}</strong>
                  <span>${escHtml(ui.composerCaptionExpanded ? fullText : fullText.slice(0, 125))}</span>
                  ${fullText.length > 125 ? `
                    <button type="button" id="btn-toggle-preview-fold" style="border:none;background:transparent;padding:0 2px;color:#64748B;font-size:12px;cursor:pointer;">
                      ${ui.composerCaptionExpanded ? "less" : "...more"}
                    </button>
                  ` : ""}
                </div>
                ${ui.composerFirstComment ? `
                  <div style="margin-top:6px;padding-top:6px;border-top:1px solid #F1F5F9;font-size:11.5px;color:#334155;">
                    <strong>${escHtml(ws.ig_handle)}</strong> ${escHtml(ui.composerFirstComment)}
                  </div>
                ` : ""}
                <div style="margin-top:5px;font-size:10px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.03em;">Scheduled Preview &middot; ${escHtml(ui.composerAspect)}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      ${renderCropStudioModal()}
    </div>
  `;
}

/* ============================================================================
   3. CALENDAR & QUEUE (/app/calendar) — Real HTML5 Drag & Drop Across Dates
   ============================================================================ */
export function renderCalendar() {
  const b = store.bundle;
  const mode = store.ui.calendarMode || "month";
  const statusFilter = store.ui.calendarStatus || "ALL";
  const filteredPosts = b.posts.filter((p) => statusFilter === "ALL" || p.status === statusFilter);

  const cells = [];
  for (let i = 28; i <= 30; i++) cells.push({ dateStr: `2026-09-${i}`, day: i, muted: true });
  for (let d = 1; d <= 31; d++) {
    cells.push({ dateStr: `2026-10-${String(d).padStart(2, "0")}`, day: d, muted: false, isToday: d === 21 });
  }
  cells.push({ dateStr: "2026-11-01", day: 1, muted: true });

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Publishing Calendar</h1>
          <p class="page-desc">Drag any post onto a new date cell to reschedule immediately, or click a post to open its inspector.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            <button class="seg-btn ${mode === "month" ? "is-active" : ""}" data-cal-mode="month">Month</button>
            <button class="seg-btn ${mode === "queue" ? "is-active" : ""}" data-cal-mode="queue">Queue List (${filteredPosts.length})</button>
          </div>
          <select class="select" id="cal-status-filter" style="width:auto;">
            ${["ALL", "SCHEDULED", "PUBLISHED", "DRAFT", "FAILED"].map((s) => `
              <option value="${s}" ${statusFilter === s ? "selected" : ""}>Status: ${s}</option>
            `).join("")}
          </select>
          <a href="/app/create" data-link class="btn btn-primary">${icon("plus", 15)} Schedule Post</a>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      ${mode === "month" ? `
        <div class="card" style="overflow:hidden;">
          <div class="card-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <strong style="font-family:var(--font-display);font-size:15.5px;">October 2026</strong>
              <span class="badge">Drag &amp; Drop Enabled</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;color:var(--ink-muted);">
              <span><span style="color:var(--info);">&#9679;</span> Scheduled</span>
              <span><span style="color:var(--success);">&#9679;</span> Published</span>
              <span><span style="color:var(--danger);">&#9679;</span> Needs Attention</span>
            </div>
          </div>
          <div class="cal-scroll-wrap">
            <div class="cal-grid">
              ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => `<div class="cal-dow">${d}</div>`).join("")}
              ${cells.map((c) => {
                const dayPosts = filteredPosts.filter((p) => String(p.scheduled_at || "").slice(0, 10) === c.dateStr);
                return `
                  <div class="cal-cell ${c.muted ? "is-muted" : ""} ${c.isToday ? "is-today" : ""}" data-cal-date="${c.dateStr}">
                    <div class="cal-day-top">
                      <span>${c.day}${c.isToday ? ` <span class="badge badge-brand" style="height:17px;font-size:10px;padding:0 5px;">Today</span>` : ""}</span>
                      <button class="cal-add-btn" title="Schedule on ${c.dateStr}" data-compose-on-date="${c.dateStr}">+</button>
                    </div>
                    ${dayPosts.map((p) => `
                      <div class="cal-pill status-${escHtml(p.status)}" draggable="true" data-drag-post="${escHtml(p.id)}" data-inspect-post="${escHtml(p.id)}" title="Drag to reschedule or click to inspect">
                        <span class="tabular" style="color:var(--ink-muted);margin-right:4px;">${new Date(p.scheduled_at).toISOString().slice(11, 16)}</span>${escHtml(p.title)}
                      </div>
                    `).join("")}
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      ` : `
        <div class="card table-wrap">
          <table class="v-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Format</th>
                <th>Status</th>
                <th>Scheduled Slot</th>
                <th>Views</th>
                <th>Saves</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPosts.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align:center;padding:38px 20px;color:var(--ink-muted);">
                    No scheduled or published posts in this workspace yet. <a href="/app/create" data-link style="color:var(--brand);font-weight:600;">Create your first post &rarr;</a>
                  </td>
                </tr>
              ` : filteredPosts.map((p, idx) => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <img src="${escHtml(getPostVisualUrl(p, idx))}" alt="" style="width:36px;height:45px;border-radius:6px;object-fit:cover;border:1px solid var(--border);" />
                      <div>
                        <div style="font-weight:600;">${escHtml(p.title)}</div>
                        <div style="font-size:12px;color:var(--ink-muted);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(p.caption)}</div>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge">${escHtml(p.media_type)}</span></td>
                  <td>${statusBadge(p.status)}</td>
                  <td class="tabular">${formatShortDate(p.scheduled_at)}</td>
                  <td class="tabular">${fmtNum(p.views)}</td>
                  <td class="tabular">${fmtNum(p.saves)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-sm" data-inspect-post="${escHtml(p.id)}">Inspect</button>
                      ${p.status !== "PUBLISHED" ? `<button class="btn btn-sm btn-primary" data-publish-post="${escHtml(p.id)}">Publish Now</button>` : ""}
                    </div>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

/* ============================================================================
   4. VISUAL PROFILE GRID PLANNER (/app/grid) — Crisp Imagery + Live Post Statistics
   ============================================================================ */
export function renderGridPlanner() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const crop = ws.grid_crop || "4:5";
  const cropCls = `crop-${crop.replace(":", "x")}`;
  const showStats = store.ui.gridShowStats !== false;
  const gridPosts = b.posts.filter((p) => !(p.is_trial_reel && !p.trial_graduated));
  const selectedIdx = Math.max(0, gridPosts.findIndex((p) => p.id === store.ui.selectedGridPostId));
  const selected = gridPosts[selectedIdx] || gridPosts[0];
  const totalGridViews = gridPosts.reduce((s, p) => s + (p.views || 0), 0);
  const totalGridSaves = gridPosts.reduce((s, p) => s + (p.saves || 0), 0);

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Profile Grid Planner</h1>
          <p class="page-desc">Inspect real cover artwork, live post engagement metrics, and drag tiles directly to reorder upcoming slots.</p>
        </div>
        <div class="head-actions">
          <button type="button" class="btn ${showStats ? "btn-primary" : ""}" id="btn-toggle-grid-stats">
            ${icon("chart", 15)} ${showStats ? "Live Stats: On" : "Live Stats: Off"}
          </button>
          <div class="segmented">
            ${["4:5", "3:4", "1:1"].map((r) => `
              <button type="button" class="seg-btn ${crop === r ? "is-active" : ""}" data-grid-crop="${r}">${r} Crop</button>
            `).join("")}
          </div>
          <a href="/app/create" data-link class="btn btn-primary">${icon("plus", 15)} Add Post</a>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      <div class="split-2">
        <!-- Authentic Light Instagram Profile Feed Card -->
        <div class="ig-profile-shell">
          <div style="padding:20px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
            <div style="display:flex;align-items:center;gap:14px;min-width:0;">
              <div class="phone-story-ring" style="width:58px;height:58px;padding:2.5px;">
                <div class="phone-story-ring-inner" style="font-size:20px;background:${escHtml(ws.avatar_color)};color:#FFFFFF;">
                  ${ws.avatar_url ? `<img src="${escHtml(ws.avatar_url)}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : escHtml(ws.ig_handle[0].toUpperCase())}
                </div>
              </div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong style="font-size:16px;">@${escHtml(ws.ig_handle)}</strong>
                  <span class="badge tabular">${fmtNum(ws.followers_count || 48200)} followers</span>
                </div>
                <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:4px;line-height:1.45;max-width:420px;">${escHtml(ws.bio || "")}</p>
              </div>
            </div>

            <div style="display:flex;gap:18px;text-align:center;" class="tabular">
              <div><div style="font-weight:700;font-size:15px;">${gridPosts.length}</div><div style="font-size:11px;color:var(--ink-muted);">Grid Tiles</div></div>
              <div><div style="font-weight:700;font-size:15px;">${fmtNum(totalGridViews)}</div><div style="font-size:11px;color:var(--ink-muted);">Total Views</div></div>
              <div><div style="font-weight:700;font-size:15px;">${fmtNum(totalGridSaves)}</div><div style="font-size:11px;color:var(--ink-muted);">Total Saves</div></div>
            </div>
          </div>

          <div class="ig-tiles">
            ${b.gridPlaceholders.length === 0 && gridPosts.length === 0 ? `
              ${[1, 2, 3, 4, 5, 6].map((slotNum) => `
                <div class="ig-tile ${cropCls}" style="background:var(--bg-subtle);border:1.5px dashed var(--border-strong);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:14px;text-align:center;color:var(--ink-muted);">
                  <span class="mono" style="font-size:10.5px;font-weight:700;">SLOT 0${slotNum}</span>
                  <span style="font-size:12px;">Empty Feed Tile</span>
                </div>
              `).join("")}
            ` : ""}
            ${b.gridPlaceholders.map((ph) => `
              <div class="ig-tile ${cropCls}" style="background:${escHtml(ph.color)};color:#18181B;padding:14px;display:flex;flex-direction:column;justify-content:space-between;">
                <span style="font-size:10px;font-weight:700;opacity:0.65;">PLANNING NOTE</span>
                <p style="font-size:12.5px;font-weight:600;line-height:1.35;">${escHtml(ph.note)}</p>
                <div style="display:flex;gap:4px;">
                  <button class="btn btn-sm" style="height:24px;font-size:11px;padding:0 7px;" data-convert-ph="${escHtml(ph.id)}">Convert</button>
                  <button class="btn btn-sm btn-ghost" style="height:24px;padding:0 6px;" data-delete-ph="${escHtml(ph.id)}">${icon("x", 12)}</button>
                </div>
              </div>
            `).join("")}

            ${gridPosts.map((p, idx) => {
              const visUrl = getPostVisualUrl(p, idx);
              const saveRate = p.views > 0 ? (((p.saves || 0) / p.views) * 100).toFixed(1) : "0.0";
              return `
                <div class="ig-tile ${cropCls} ${selected?.id === p.id ? "is-selected" : ""}"
                     draggable="true"
                     data-grid-tile="${escHtml(p.id)}">
                  ${visUrl.startsWith("data:video")
                    ? `<video class="ig-tile-media" src="${escHtml(visUrl)}" muted loop playsinline></video>`
                    : `<img class="ig-tile-media" src="${escHtml(visUrl)}" alt="${escHtml(p.title)}" />`}

                  <!-- Top Format + Status Pill -->
                  <div style="position:absolute;top:8px;left:8px;right:8px;z-index:4;display:flex;justify-content:space-between;align-items:center;gap:4px;pointer-events:none;">
                    <span style="padding:2px 6px;border-radius:5px;background:rgba(255,255,255,0.92);color:#09090B;font-size:9.5px;font-weight:700;">
                      ${escHtml(p.media_type)}
                    </span>
                    ${p.status !== "PUBLISHED" ? `
                      <span style="padding:2px 6px;border-radius:5px;background:#4F46E5;color:#FFFFFF;font-size:9.5px;font-weight:700;">
                        ${escHtml(p.status)}
                      </span>
                    ` : ""}
                  </div>

                  <!-- Inline Live Stats Footer Bar -->
                  ${showStats ? `
                    <div class="ig-tile-stats-bar">
                      <span>${p.status === "PUBLISHED" ? `${fmtNum(p.views)} views` : formatShortDate(p.scheduled_at)}</span>
                      <span>${p.status === "PUBLISHED" ? `${fmtNum(p.saves)} saves` : "Drag to swap"}</span>
                    </div>
                  ` : ""}

                  <!-- Rich Hover Post Statistics Breakdown -->
                  <div class="ig-tile-hover-detail" class="tabular">
                    <div style="font-size:12px;font-weight:700;line-height:1.25;">${escHtml(p.title.slice(0, 44))}</div>
                    ${p.status === "PUBLISHED" ? `
                      <div style="display:flex;gap:10px;font-size:11.5px;font-weight:600;">
                        <span>&#9829; ${fmtNum(p.likes)}</span>
                        <span>&middot; ${fmtNum(p.comments_count)} replies</span>
                        <span>&middot; ${saveRate}% saves</span>
                      </div>
                    ` : `<span style="font-size:11px;opacity:0.85;">Scheduled &middot; Click to inspect</span>`}
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- RIGHT SIDEBAR: SELECTED POST STATISTICS + COVER UPLOADER + NOTE TILE -->
        <div style="display:flex;flex-direction:column;gap:16px;">
          ${selected ? `
            <div class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span class="card-title">Tile Performance &amp; Visual Inspector</span>
                ${statusBadge(selected.status)}
              </div>

              <div style="display:flex;gap:14px;align-items:center;">
                <img src="${escHtml(getPostVisualUrl(selected, selectedIdx))}" alt="" style="width:74px;height:92px;border-radius:10px;object-fit:cover;border:1px solid var(--border);flex-shrink:0;" />
                <div style="min-width:0;">
                  <div style="font-weight:700;font-size:15px;line-height:1.3;">${escHtml(selected.title)}</div>
                  <div style="font-size:12px;color:var(--ink-muted);margin-top:4px;" class="tabular">
                    ${selected.status === "PUBLISHED" ? "Published on Grid" : `Scheduled: ${formatShortDate(selected.scheduled_at)}`}
                  </div>
                  <p style="font-size:12px;color:var(--ink-secondary);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
                    ${escHtml(selected.caption)}
                  </p>
                </div>
              </div>

              <!-- 4-Card Post Statistics Grid -->
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;" class="tabular">
                <div style="padding:10px;border-radius:8px;background:var(--bg-subtle);text-align:center;">
                  <div style="font-size:11px;color:var(--ink-muted);">Views</div>
                  <strong style="font-size:14.5px;">${fmtNum(selected.views)}</strong>
                </div>
                <div style="padding:10px;border-radius:8px;background:var(--bg-subtle);text-align:center;">
                  <div style="font-size:11px;color:var(--ink-muted);">Likes</div>
                  <strong style="font-size:14.5px;">${fmtNum(selected.likes)}</strong>
                </div>
                <div style="padding:10px;border-radius:8px;background:var(--bg-subtle);text-align:center;">
                  <div style="font-size:11px;color:var(--ink-muted);">Saves</div>
                  <strong style="font-size:14.5px;">${fmtNum(selected.saves)}</strong>
                </div>
                <div style="padding:10px;border-radius:8px;background:var(--bg-subtle);text-align:center;">
                  <div style="font-size:11px;color:var(--ink-muted);">Comments</div>
                  <strong style="font-size:14.5px;">${fmtNum(selected.comments_count)}</strong>
                </div>
              </div>

              <label class="btn" style="justify-content:center;cursor:pointer;">
                ${icon("upload", 15)} Upload Custom Tile Cover Image
                <input type="file" id="grid-tile-cover-upload" data-post-id="${escHtml(selected.id)}" accept="image/*,video/*" style="display:none;" />
              </label>

              <div class="field">
                <label class="field-label">Collaborator Handle (@username)</label>
                <div style="display:flex;gap:8px;">
                  <input class="input" id="grid-collab-input" value="${escHtml(selected.collab_handle || "")}" placeholder="figma.design" />
                  <button class="btn" data-save-grid-collab="${escHtml(selected.id)}">Save</button>
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid var(--border);">
                <button class="btn" data-inspect-post="${escHtml(selected.id)}">Open Full Post Inspector</button>
                <button class="btn btn-danger btn-sm" data-delete-post="${escHtml(selected.id)}">${icon("trash", 14)} Remove</button>
              </div>
            </div>
          ` : `
            <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;text-align:center;padding:28px 22px;">
              <div style="margin:0 auto;color:var(--ink-muted);">${icon("grid", 26)}</div>
              <div class="card-title">No Grid Posts Synced Yet</div>
              <p style="font-size:13px;color:var(--ink-muted);line-height:1.5;">
                Connect your Instagram Creator/Business profile via Meta Graph OAuth to import your last 18 published tiles automatically, or schedule your first post from the composer.
              </p>
              <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
                <a href="/app/create" data-link class="btn btn-primary btn-sm">${icon("plus", 14)} Create First Post</a>
                <button type="button" class="btn btn-sm" data-open-meta-setup>Connect Meta OAuth</button>
              </div>
            </div>
          `}

          <form id="form-add-placeholder" class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Pin Visual Planning Note to Grid</div>
            <textarea class="textarea" name="note" rows="2" maxlength="280" required placeholder="e.g., Client case study carousel (shoot warm studio cover photo)"></textarea>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <input type="color" name="color" value="#EEF2FF" style="width:42px;height:34px;border:1px solid var(--border);border-radius:6px;padding:2px;background:transparent;" />
              <button class="btn btn-primary" type="submit">${icon("plus", 14)} Pin Note Tile</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   5. CAROUSEL STUDIO (/app/carousels) — 16 Clean Presets + AI Deck Generator + PNG
   ============================================================================ */
export function renderCarouselsStudio() {
  const b = store.bundle;
  const deck = b.carousels.find((c) => c.id === store.ui.selectedCarouselId) || b.carousels[0];
  const slideIdx = Math.min((deck?.slides?.length || 1) - 1, Math.max(0, store.ui.selectedSlideIndex || 0));
  const slide = deck?.slides?.[slideIdx] || { tag: "01", headline: "Start designing", body: "Add your takeaway below.", badge: "Slide 01", align: "left" };
  const theme = b.themes.find((t) => t.id === deck?.theme_id) || b.themes[0];

  const bg = deck?.custom_bg || theme.bg;
  const fg = deck?.custom_fg || theme.fg;
  const accent = deck?.custom_accent || theme.accent;

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Carousel Studio</h1>
          <p class="page-desc">Generate multi-slide educational decks with AI, restyle with 16 Swiss &amp; editorial presets, and export 1080&times;1350 PNG slides.</p>
        </div>
        <div class="head-actions">
          <button class="btn" id="btn-export-slide-png">${icon("download", 15)} Export Slide PNG</button>
          ${deck ? `<button class="btn btn-primary" data-schedule-carousel="${escHtml(deck.id)}">${icon("calendar", 15)} Schedule Deck to Feed</button>` : ""}
        </div>
      </div>

      ${renderUnconnectedBanner()}

      <!-- AI Multi-Slide Deck Generator Bar -->
      <form id="form-generate-carousel" class="card card-pad" style="margin-bottom:18px;border-color:var(--brand-border);display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
        <div class="field" style="flex:1;min-width:240px;">
          <label class="field-label">${icon("wand", 13)} AI Carousel Deck Topic</label>
          <input class="input" name="prompt" required placeholder="e.g., 7 spacing & hierarchy rules that make interfaces feel calm" />
        </div>
        <div class="field" style="width:190px;">
          <label class="field-label">Design Preset</label>
          <select class="select" name="themeId">
            ${b.themes.map((t) => `<option value="${escHtml(t.id)}" ${t.id === theme.id ? "selected" : ""}>${escHtml(t.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="width:115px;">
          <label class="field-label">Slide Count</label>
          <select class="select" name="slideCount">
            ${[4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n} slides</option>`).join("")}
          </select>
        </div>
        <button class="btn btn-primary" type="submit">${icon("wand", 15)} Generate AI Deck</button>
      </form>

      ${deck ? `
        <div class="studio-grid">
          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="card card-pad">
              <div class="field-label" style="margin-bottom:8px;">Saved Decks (${b.carousels.length})</div>
              <div style="display:flex;flex-direction:column;gap:5px;">
                ${b.carousels.map((c) => `
                  <button class="btn btn-sm ${c.id === deck.id ? "btn-primary" : ""}" style="justify-content:space-between;width:100%;" data-select-carousel="${escHtml(c.id)}">
                    <span style="overflow:hidden;text-overflow:ellipsis;">${escHtml(c.title)}</span>
                    <span class="tabular">${c.slides.length}</span>
                  </button>
                `).join("")}
              </div>
            </div>

            <div class="card card-pad">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span class="field-label">Slides (${deck.slides.length})</span>
                <button class="btn btn-sm" id="btn-add-slide">${icon("plus", 13)} Slide</button>
              </div>
              <div style="display:flex;flex-direction:column;gap:6px;">
                ${deck.slides.map((s, idx) => `
                  <button class="btn btn-sm ${idx === slideIdx ? "btn-primary" : ""}" style="justify-content:flex-start;text-align:left;height:auto;padding:7px 10px;" data-select-slide="${idx}">
                    <span class="mono" style="opacity:0.7;">${String(idx + 1).padStart(2, "0")}</span>
                    <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(s.headline)}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          </div>

          <div class="slide-canvas-stage">
            <div id="carousel-live-card" class="slide-card-preview"
                 data-bg="${escHtml(bg)}" data-fg="${escHtml(fg)}" data-accent="${escHtml(accent)}"
                 style="background:${escHtml(bg)};color:${escHtml(fg)};text-align:${slide.align === "center" ? "center" : "left"};">
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:600;">
                <span style="padding:3px 9px;border-radius:999px;border:1px solid currentColor;opacity:0.75;">${escHtml(slide.badge || "SLIDE")}</span>
                <span class="mono">${slideIdx + 1} / ${deck.slides.length}</span>
              </div>

              ${slide.imageUrl ? `
                <div style="width:100%;height:150px;border-radius:10px;overflow:hidden;margin:12px 0;">
                  <img src="${escHtml(slide.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />
                </div>
              ` : ""}

              <div>
                <div style="width:32px;height:3px;background:${escHtml(accent)};border-radius:2px;margin:${slide.align === "center" ? "0 auto 14px" : "0 0 14px"};"></div>
                <div style="font-family:var(--font-display);font-weight:700;font-size:25px;line-height:1.15;letter-spacing:-0.03em;margin-bottom:12px;">
                  ${escHtml(slide.headline)}
                </div>
                <p style="font-size:13.5px;line-height:1.58;opacity:0.84;">
                  ${escHtml(slide.body)}
                </p>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;opacity:0.68;padding-top:12px;border-top:1px solid rgba(128,128,128,0.22);">
                <span>@${escHtml(b.activeWorkspace.ig_handle)}</span>
                <span>Swipe &rarr;</span>
              </div>
            </div>

            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" data-select-slide="${Math.max(0, slideIdx - 1)}" ${slideIdx === 0 ? "disabled" : ""}>${icon("arrowLeft", 14)} Previous</button>
              <button class="btn btn-sm" data-select-slide="${Math.min(deck.slides.length - 1, slideIdx + 1)}" ${slideIdx >= deck.slides.length - 1 ? "disabled" : ""}>Next ${icon("arrowRight", 14)}</button>
            </div>
          </div>

          <div class="card card-pad" style="display:flex;flex-direction:column;gap:13px;">
            <div class="card-title">Slide ${slideIdx + 1} Inspector</div>

            <div class="field">
              <label class="field-label">Design System Preset (16)</label>
              <select class="select" id="car-theme-picker">
                ${b.themes.map((t) => `<option value="${escHtml(t.id)}" ${t.id === deck.theme_id ? "selected" : ""}>${escHtml(t.name)} (${escHtml(t.category)})</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label class="field-label">Brand Palette Override</label>
              <div style="display:flex;gap:8px;align-items:center;">
                <label style="font-size:11.5px;display:flex;align-items:center;gap:5px;">Bg <input type="color" id="car-color-bg" value="${escHtml(bg)}" /></label>
                <label style="font-size:11.5px;display:flex;align-items:center;gap:5px;">Text <input type="color" id="car-color-fg" value="${escHtml(fg)}" /></label>
                <label style="font-size:11.5px;display:flex;align-items:center;gap:5px;">Accent <input type="color" id="car-color-accent" value="${escHtml(accent)}" /></label>
              </div>
            </div>

            <div class="field">
              <label class="field-label">Badge Kicker</label>
              <input class="input" id="car-slide-badge" value="${escHtml(slide.badge || "")}" />
            </div>

            <div class="field">
              <label class="field-label">Slide Headline</label>
              <input class="input" id="car-slide-headline" value="${escHtml(slide.headline || "")}" />
            </div>

            <div class="field">
              <label class="field-label">Supporting Copy</label>
              <textarea class="textarea" id="car-slide-body" rows="3">${escHtml(slide.body || "")}</textarea>
            </div>

            <label class="btn btn-sm" style="justify-content:center;cursor:pointer;">
              ${icon("image", 14)} Upload Photo onto Slide ${slideIdx + 1}
              <input type="file" id="car-slide-photo" accept="image/*" style="display:none;" />
            </label>

            <div style="display:flex;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid var(--border);">
              <button class="btn btn-sm btn-danger" id="btn-delete-slide">${icon("trash", 13)} Delete Slide</button>
              <button class="btn btn-primary" id="btn-save-carousel">Save Deck</button>
            </div>
          </div>
        </div>
      ` : `
        <div class="card card-pad" style="padding:44px 28px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;">
          <span style="color:var(--ink-muted);">${icon("layers", 28)}</span>
          <div style="font-weight:700;font-size:16px;">No Saved Carousel Decks Yet</div>
          <p style="font-size:13.5px;color:var(--ink-muted);max-width:460px;line-height:1.55;">
            Enter any topic in the <strong>AI Carousel Deck Topic</strong> bar right above and click <strong>Generate AI Deck</strong> to create your first multi-slide 1080&times;1350 deck.
          </p>
        </div>
      `}
    </div>
  `;
}
