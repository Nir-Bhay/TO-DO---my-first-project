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
          <p class="page-desc">@${escHtml(ws.ig_handle)} &middot; ${escHtml(ws.planSpec.name)} Plan &middot; ${escHtml(ws.timezone)}</p>
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

      ${failed.length ? `
        <div class="card card-pad" style="margin-bottom:18px;background:var(--danger-soft);border-color:rgba(220,38,38,0.28);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
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
            ${b.posts.filter((p) => p.status !== "PUBLISHED").slice(0, 5).map((p) => `
              <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border-subtle);">
                <div style="display:flex;align-items:center;gap:12px;min-width:0;">
                  <div class="cover-${escHtml(p.cover_style || "noir")}" style="width:42px;height:52px;border-radius:7px;flex-shrink:0;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;padding:4px;text-align:center;">
                    ${p.media_url
                      ? (p.media_url.startsWith("data:video")
                        ? `<video src="${escHtml(p.media_url)}" muted style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"></video>`
                        : `<img src="${escHtml(p.media_url)}" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />`)
                      : `<span style="font-size:8px;font-weight:700;line-height:1.1;">${escHtml((p.cover_label || p.media_type).slice(0, 16))}</span>`}
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
            `).join("")}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Active DM Workflows</div>
              <a href="/app/automations" data-link class="btn btn-sm btn-ghost">Manage ${icon("arrowRight", 14)}</a>
            </div>
            <div>
              ${b.automations.slice(0, 3).map((a) => {
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
                      <div style="font-weight:650;font-size:13px;">${fmtNum(a.dms_sent)} DMs</div>
                      <div style="font-size:11.5px;color:var(--success);">${ctr}% clicks</div>
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Recent Inbox Activity</div>
              <a href="/app/inbox" data-link class="btn btn-sm btn-ghost">Open Inbox ${icon("arrowRight", 14)}</a>
            </div>
            <div>
              ${b.threads.slice(0, 3).map((t) => `
                <a href="/app/inbox" data-link data-jump-thread="${escHtml(t.id)}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 18px;border-bottom:1px solid var(--border-subtle);">
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
   2. CREATE POST COMPOSER (/app/create) — Real Video/Image Upload + Live Preview
   ============================================================================ */
export function renderCreatePost() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const ui = store.ui;
  const defaultSched = ui.composerScheduledDate || new Date(Date.now() + 3600000 * 5).toISOString().slice(0, 16);
  const captionVal = ui.composerCaption || "Most teams overcomplicate design tokens before shipping their very first component library.\n\nComment \"REPO\" below and I will send the complete Figma token starter file straight to your DMs.";
  const tagsVal = ui.composerHashtags || "#designsystems #uidesign #figmatips #productdesign";
  const fullText = `${captionVal}${tagsVal ? `\n\n${tagsVal}` : ""}`;
  const isVideo = ui.composerMediaUrl && ui.composerMediaUrl.startsWith("data:video");

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Create Post</h1>
          <p class="page-desc">Upload local video or photo media, preview mobile crop &amp; caption fold live, and schedule or publish immediately.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            ${["REEL", "CAROUSEL", "POST", "STORY"].map((t) => `
              <button class="seg-btn ${ui.composerMediaType === t ? "is-active" : ""}" data-composer-type="${t}">${t}</button>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="composer-layout">
        <form id="form-create-post" class="card card-pad" style="display:flex;flex-direction:column;gap:16px;">
          <!-- Real Local File Dropzone -->
          <div>
            <div class="field-label" style="margin-bottom:8px;">
              <span>Media Asset (MP4, WebM, PNG, JPG, WebP)</span>
              ${ui.composerMediaUrl ? `<button type="button" class="btn btn-sm btn-ghost" id="btn-clear-media">Clear Uploaded Media</button>` : `<span class="field-hint">Stored in workspace media library</span>`}
            </div>
            <label class="dropzone" id="composer-dropzone" for="composer-file-input" style="display:block;">
              <input type="file" id="composer-file-input" accept="image/*,video/*" multiple style="display:none;" />
              <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                ${icon("upload", 22)}
                <div style="font-weight:600;font-size:13.5px;">Drop video or image files here, or click to browse</div>
                <div style="font-size:12px;color:var(--ink-muted);">Supports 9:16 Reels, 4:5 Carousels &amp; high-resolution photos &middot; Instant mobile preview</div>
              </div>
            </label>

            ${b.mediaAssets.length ? `
              <div style="margin-top:10px;display:flex;align-items:center;gap:8px;overflow-x:auto;padding-bottom:4px;">
                <span style="font-size:11.5px;color:var(--ink-muted);white-space:nowrap;">Recent uploads:</span>
                ${b.mediaAssets.slice(0, 6).map((m) => `
                  <button type="button" class="btn btn-sm" data-pick-asset="${escHtml(m.id)}">
                    ${icon(m.mime_type.startsWith("video") ? "video" : "image", 13)} ${escHtml(m.filename.slice(0, 18))}
                  </button>
                `).join("")}
              </div>
            ` : ""}
          </div>

          <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;">
            <div class="field">
              <label class="field-label">Internal Post Title</label>
              <input class="input" name="title" id="comp-title" required value="${escHtml(ui.composerTitle || "Design Tokens Starter Breakdown")}" />
            </div>
            <div class="field">
              <label class="field-label">Cover Typography Label</label>
              <input class="input" name="coverLabel" id="comp-cover-label" maxlength="36" value="${escHtml(ui.composerCoverLabel)}" />
            </div>
          </div>

          <div class="field">
            <label class="field-label">
              <span>Fallback Cover Backdrop (used when no custom image/video is uploaded)</span>
            </label>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${COVER_STYLES.map((cs) => `
                <button type="button" class="btn btn-sm ${ui.composerCoverStyle === cs ? "btn-primary" : ""}" data-cover-style="${cs}">
                  ${cs}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Caption + Templates + Draft Variants -->
          <div class="field">
            <div class="field-label" style="flex-wrap:wrap;gap:6px;">
              <span>Caption <span id="comp-char-counter" class="tabular" style="font-weight:400;color:var(--ink-muted);">(${fullText.length} / 2,200)</span></span>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                <select class="select" id="comp-template-select" style="height:28px;padding:0 8px;font-size:12px;width:auto;">
                  <option value="">Insert Saved Template...</option>
                  ${b.templates.map((t) => `<option value="${escHtml(t.id)}">${escHtml(t.title)}</option>`).join("")}
                </select>
                <button type="button" class="btn btn-sm" id="btn-save-caption-template">Save as Template</button>
                <button type="button" class="btn btn-sm" id="btn-caption-assist">${icon("wand", 13)} Draft Ideas</button>
              </div>
            </div>
            <textarea class="textarea" name="caption" id="comp-caption" rows="5">${escHtml(captionVal)}</textarea>
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

        <!-- Sticky Live Mobile Phone Preview -->
        <aside style="position:sticky;top:76px;">
          <div class="phone-frame">
            <div class="phone-screen">
              <div class="phone-notch"></div>
              <div style="padding:6px 14px 10px;display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="ws-avatar" style="width:24px;height:24px;font-size:11px;background:${escHtml(ws.avatar_color)};">${escHtml(ws.ig_handle[0].toUpperCase())}</span>
                  <strong>${escHtml(ws.ig_handle)}</strong>
                </div>
                <span style="font-size:11px;opacity:0.7;">${escHtml(ui.composerMediaType)}</span>
              </div>

              <div class="phone-media-box ${ui.composerMediaType === "POST" || ui.composerMediaType === "CAROUSEL" ? "is-feed" : ""} cover-${escHtml(ui.composerCoverStyle)}">
                ${ui.composerMediaUrl
                  ? (isVideo
                    ? `<video src="${escHtml(ui.composerMediaUrl)}" autoplay muted loop playsinline controls></video>`
                    : `<img src="${escHtml(ui.composerMediaUrl)}" alt="Uploaded media preview" />`)
                  : `<div style="text-align:center;position:relative;z-index:1;">
                       <div style="font-size:10.5px;opacity:0.72;margin-bottom:8px;">@${escHtml(ws.ig_handle)}</div>
                       <div id="preview-cover-label" style="font-family:var(--font-display);font-weight:780;font-size:21px;line-height:1.15;letter-spacing:-0.025em;">${escHtml(ui.composerCoverLabel)}</div>
                     </div>`
                }
              </div>

              <div style="padding:12px 14px 16px;font-size:12px;line-height:1.45;color:#E4E4E7;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;opacity:0.85;">
                  <div style="display:flex;gap:12px;">${icon("heart", 17)}${icon("message", 17)}${icon("send", 17)}</div>
                  ${icon("bookmark", 17)}
                </div>
                <div id="preview-caption-fold">
                  <strong>${escHtml(ws.ig_handle)}</strong> ${escHtml(fullText.slice(0, 125))}${fullText.length > 125 ? `<span style="color:#A1A1AA;">... more</span>` : ""}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
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

  // Build October 2026 35-day calendar grid (Oct 1, 2026 is Thursday -> 3 leading days)
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPosts.map((p) => `
                <tr>
                  <td>
                    <div style="font-weight:600;">${escHtml(p.title)}</div>
                    <div style="font-size:12px;color:var(--ink-muted);max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(p.caption)}</div>
                  </td>
                  <td><span class="badge">${escHtml(p.media_type)}</span></td>
                  <td>${statusBadge(p.status)}</td>
                  <td class="tabular">${formatShortDate(p.scheduled_at)}</td>
                  <td class="tabular">${fmtNum(p.views)}</td>
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
   4. VISUAL PROFILE GRID PLANNER (/app/grid) — Drag & Drop Tile Reordering
   ============================================================================ */
export function renderGridPlanner() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const crop = ws.grid_crop || "4:5";
  const cropCls = `crop-${crop.replace(":", "x")}`;
  const gridPosts = b.posts.filter((p) => !(p.is_trial_reel && !p.trial_graduated));
  const selected = gridPosts.find((p) => p.id === store.ui.selectedGridPostId) || gridPosts[0];

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Profile Grid Planner</h1>
          <p class="page-desc">Drag tiles directly on the 3-column grid to swap publishing order, preview feed crops, or add visual planning notes.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            ${["4:5", "3:4", "1:1"].map((r) => `
              <button class="seg-btn ${crop === r ? "is-active" : ""}" data-grid-crop="${r}">${r} Crop</button>
            `).join("")}
          </div>
          <a href="/app/create" data-link class="btn btn-primary">${icon("plus", 15)} Add Post</a>
        </div>
      </div>

      <div class="split-2">
        <div class="ig-profile-shell">
          <div style="padding:18px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:16px;">
            <span class="ws-avatar" style="width:58px;height:58px;font-size:22px;background:${escHtml(ws.avatar_color)};">
              ${ws.avatar_url ? `<img src="${escHtml(ws.avatar_url)}" alt="" />` : escHtml(ws.ig_handle[0].toUpperCase())}
            </span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                <strong style="font-size:15.5px;">@${escHtml(ws.ig_handle)}</strong>
                <span class="badge tabular">${fmtNum(ws.followers_count || 48200)} followers</span>
              </div>
              <p style="font-size:12.5px;color:var(--ink-secondary);margin-top:4px;line-height:1.45;">${escHtml(ws.bio || "")}</p>
            </div>
          </div>

          <div class="ig-tiles">
            ${b.gridPlaceholders.map((ph) => `
              <div class="ig-tile ${cropCls}" style="background:${escHtml(ph.color)};color:#18181B;">
                <span style="font-size:10px;font-weight:700;opacity:0.65;">IDEA NOTE</span>
                <p style="font-size:12px;font-weight:600;line-height:1.35;">${escHtml(ph.note)}</p>
                <div style="display:flex;gap:4px;">
                  <button class="btn btn-sm" style="height:24px;font-size:11px;padding:0 7px;" data-convert-ph="${escHtml(ph.id)}">Convert</button>
                  <button class="btn btn-sm btn-ghost" style="height:24px;padding:0 6px;" data-delete-ph="${escHtml(ph.id)}">${icon("x", 12)}</button>
                </div>
              </div>
            `).join("")}

            ${gridPosts.map((p) => `
              <div class="ig-tile ${cropCls} cover-${escHtml(p.cover_style || "noir")} ${selected?.id === p.id ? "is-selected" : ""}"
                   draggable="true"
                   data-grid-tile="${escHtml(p.id)}">
                ${p.media_url
                  ? (p.media_url.startsWith("data:video")
                    ? `<video class="ig-tile-media" src="${escHtml(p.media_url)}" muted loop playsinline></video>`
                    : `<img class="ig-tile-media" src="${escHtml(p.media_url)}" alt="" />`)
                  : ""}
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:9.5px;font-weight:650;">
                  <span style="background:rgba(0,0,0,0.52);color:#fff;padding:2px 5px;border-radius:4px;">${escHtml(p.status === "PUBLISHED" ? fmtNum(p.views) : p.status)}</span>
                  ${p.collab_handle ? `<span style="background:rgba(0,0,0,0.52);color:#fff;padding:2px 5px;border-radius:4px;">+@${escHtml(p.collab_handle)}</span>` : ""}
                </div>
                <strong style="font-family:var(--font-display);font-size:13px;line-height:1.18;text-shadow:0 1px 8px rgba(0,0,0,0.45);">
                  ${escHtml(p.cover_label || p.title)}
                </strong>
              </div>
            `).join("")}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          ${selected ? `
            <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span class="card-title">Selected Tile Inspector</span>
                ${statusBadge(selected.status)}
              </div>
              <div style="font-weight:650;font-size:15px;">${escHtml(selected.title)}</div>
              <div style="font-size:12.5px;color:var(--ink-muted);" class="tabular">Scheduled: ${formatShortDate(selected.scheduled_at)}</div>

              <label class="btn" style="justify-content:center;">
                ${icon("upload", 15)} Upload Custom Tile Cover Photo
                <input type="file" id="grid-tile-cover-upload" data-post-id="${escHtml(selected.id)}" accept="image/*,video/*" style="display:none;" />
              </label>

              <div class="field">
                <label class="field-label">Collaborator Handle (@username)</label>
                <div style="display:flex;gap:8px;">
                  <input class="input" id="grid-collab-input" value="${escHtml(selected.collab_handle || "")}" placeholder="figma.design" />
                  <button class="btn" data-save-grid-collab="${escHtml(selected.id)}">Save</button>
                </div>
              </div>

              <div style="display:flex;gap:8px;padding-top:6px;border-top:1px solid var(--border);">
                <button class="btn" data-inspect-post="${escHtml(selected.id)}">Full Post Editor</button>
                <button class="btn btn-danger btn-sm" data-delete-post="${escHtml(selected.id)}">${icon("trash", 14)} Remove</button>
              </div>
            </div>
          ` : ""}

          <form id="form-add-placeholder" class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Add Visual Planning Note Tile</div>
            <textarea class="textarea" name="note" rows="2" maxlength="280" required placeholder="e.g., Client case study carousel (shoot warm studio cover photo)"></textarea>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <input type="color" name="color" value="#E2E8F0" style="width:42px;height:34px;border:1px solid var(--border);border-radius:6px;padding:2px;background:transparent;" />
              <button class="btn btn-primary" type="submit">${icon("plus", 14)} Pin Note to Top of Grid</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   5. CAROUSEL STUDIO (/app/carousels) — 16 Clean Presets + Custom Colors + PNG Export
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
          <p class="page-desc">Design crisp 1080&times;1350 slide decks with Swiss &amp; editorial typography, custom brand colors, slide photos, and PNG export.</p>
        </div>
        <div class="head-actions">
          <button class="btn" id="btn-export-slide-png">${icon("download", 15)} Export Slide PNG</button>
          ${deck ? `<button class="btn btn-primary" data-schedule-carousel="${escHtml(deck.id)}">${icon("calendar", 15)} Schedule Deck to Feed</button>` : ""}
        </div>
      </div>

      <!-- Generate New Deck Bar -->
      <form id="form-generate-carousel" class="card card-pad" style="margin-bottom:18px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
        <div class="field" style="flex:1;min-width:240px;">
          <label class="field-label">New Deck Topic</label>
          <input class="input" name="prompt" required placeholder="e.g., 7 spacing & hierarchy rules that make interfaces feel calm" />
        </div>
        <div class="field" style="width:190px;">
          <label class="field-label">Design Preset</label>
          <select class="select" name="themeId">
            ${b.themes.map((t) => `<option value="${escHtml(t.id)}" ${t.id === theme.id ? "selected" : ""}>${escHtml(t.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field" style="width:110px;">
          <label class="field-label">Slides</label>
          <select class="select" name="slideCount">
            ${[4, 5, 6, 7, 8].map((n) => `<option value="${n}" ${n === 5 ? "selected" : ""}>${n} slides</option>`).join("")}
          </select>
        </div>
        <button class="btn btn-primary" type="submit">${icon("plus", 15)} Create Deck</button>
      </form>

      ${deck ? `
        <div class="studio-grid">
          <!-- Left Rail: Saved Decks + Slide List -->
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

          <!-- Center Stage: Live 1080x1350 Slide Preview -->
          <div class="slide-canvas-stage">
            <div id="carousel-live-card" class="slide-card-preview"
                 data-bg="${escHtml(bg)}" data-fg="${escHtml(fg)}" data-accent="${escHtml(accent)}"
                 style="background:${escHtml(bg)};color:${escHtml(fg)};text-align:${slide.align === "center" ? "center" : "left"};">
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:11.5px;font-weight:650;">
                <span style="padding:3px 9px;border-radius:999px;border:1px solid currentColor;opacity:0.75;">${escHtml(slide.badge || "SLIDE")}</span>
                <span class="mono">${slideIdx + 1} / ${deck.slides.length}</span>
              </div>

              ${slide.imageUrl ? `
                <div style="width:100%;height:150px;border-radius:10px;overflow:hidden;margin:12px 0;">
                  <img src="${escHtml(slide.imageUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;" />
                </div>
              ` : ""}

              <div style="my:auto;">
                <div style="width:32px;height:3px;background:${escHtml(accent)};border-radius:2px;margin:${slide.align === "center" ? "0 auto 14px" : "0 0 14px"};"></div>
                <div style="font-family:var(--font-display);font-weight:780;font-size:25px;line-height:1.15;letter-spacing:-0.03em;margin-bottom:12px;">
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

          <!-- Right Inspector: Edit Copy, Theme Preset, Custom Hex Colors & Photo -->
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

            <label class="btn btn-sm" style="justify-content:center;">
              ${icon("image", 14)} Upload Photo onto Slide ${slideIdx + 1}
              <input type="file" id="car-slide-photo" accept="image/*" style="display:none;" />
            </label>

            <div style="display:flex;justify-content:space-between;gap:8px;padding-top:8px;border-top:1px solid var(--border);">
              <button class="btn btn-sm btn-danger" id="btn-delete-slide">${icon("trash", 13)} Delete Slide</button>
              <button class="btn btn-primary" id="btn-save-carousel">Save Deck</button>
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}
