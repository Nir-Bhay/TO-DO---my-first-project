import { store, escHtml, fmtNum } from "./api.js";
import { icon } from "./icons.js";

const QUICK_SNIPPETS = [
  "Thanks for reaching out! Just sent the resource pack right above.",
  "Yes — we have one Q4 sponsored slot open next month. Happy to share our media kit!",
  "Glad the breakdown helped! Let me know once you try it on your next post."
];

/* ============================================================================
   6. DM AUTOMATIONS + LIVE INTERACTIVE CHAT SIMULATOR (/app/automations)
   ============================================================================ */
export function renderAutomations() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const selectedAuto = b.automations[0];
  const simMsgs = store.ui.chatSimMessages;

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">DM Workflows</h1>
          <p class="page-desc">Automate comment-to-DM links, story replies, follower checks, and timed follow-ups via Official Messenger API.</p>
        </div>
        <div class="head-actions">
          <button class="btn btn-primary" id="btn-open-new-workflow">${icon("plus", 15)} New Workflow</button>
        </div>
      </div>

      <div class="split-2">
        <!-- Workflows List -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${b.automations.map((a) => {
            const ctr = a.dms_sent ? ((a.link_taps / a.dms_sent) * 100).toFixed(1) : "0.0";
            return `
              <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
                  <div>
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <strong style="font-size:15px;">${escHtml(a.name)}</strong>
                      <span class="badge ${a.status === "active" ? "badge-success" : ""}">
                        <span class="dot"></span>${a.status === "active" ? "Active" : "Paused"}
                      </span>
                      <span class="badge">${escHtml(a.trigger_type)}</span>
                    </div>
                    <div style="font-size:12.5px;color:var(--ink-muted);margin-top:5px;">
                      Keywords: ${a.keywords.length ? a.keywords.map((k) => `<code class="mono">${escHtml(k)}</code>`).join(", ") : "Contextual AI Concierge"}
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-sm" data-toggle-auto="${escHtml(a.id)}">${a.status === "active" ? "Pause" : "Resume"}</button>
                    <button class="btn btn-sm btn-ghost" data-delete-auto="${escHtml(a.id)}">${icon("trash", 14)}</button>
                  </div>
                </div>

                <div style="padding:10px 12px;border-radius:8px;background:var(--bg-subtle);font-size:12.5px;color:var(--ink-secondary);white-space:pre-line;">${escHtml(a.dm_message || a.ai_prompt)}</div>

                <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-top:4px;font-size:12.5px;" class="tabular">
                  <div style="display:flex;gap:16px;">
                    <span><strong>${fmtNum(a.dms_sent)}</strong> DMs delivered</span>
                    <span><strong>${fmtNum(a.link_taps)}</strong> button taps (${ctr}%)</span>
                  </div>
                  <button class="btn btn-sm" data-sweep-auto="${escHtml(a.id)}">${icon("refresh", 13)} Sweep Past Comments</button>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        <!-- Live Interactive Mobile Chat Simulator -->
        <div class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div class="card-title">Interactive Workflow Simulator</div>
              <div class="card-sub">Type any comment or DM below to test live delivery &amp; Inbox sync</div>
            </div>
            <button class="btn btn-sm btn-ghost" id="btn-clear-sim">Clear Chat</button>
          </div>

          <form id="form-live-sim" style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
              <select class="select" id="sim-auto-select">
                ${b.automations.map((a) => `<option value="${escHtml(a.id)}">${escHtml(a.name)}</option>`).join("")}
              </select>
              <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;white-space:nowrap;">
                <input type="checkbox" id="sim-is-follower" checked /> Following @${escHtml(ws.ig_handle)}
              </label>
            </div>

            <!-- Simulated Phone Chat Window -->
            <div id="sim-chat-stream" style="height:290px;overflow-y:auto;padding:14px;border-radius:12px;background:var(--bg-page);border:1px solid var(--border);display:flex;flex-direction:column;gap:10px;">
              ${simMsgs.length === 0 ? `
                <div style="margin:auto;text-align:center;color:var(--ink-muted);font-size:12.5px;max-width:250px;">
                  Send a trigger keyword like <code class="mono">${escHtml(selectedAuto?.keywords?.[0] || "REPO")}</code> below — watch public reply, follow gate, and CTA cards fire in real time.
                </div>
              ` : simMsgs.map((m) => `
                <div class="bubble ${m.role === "user" ? "is-them" : "is-me"}" style="max-width:85%;">
                  ${m.badge ? `<div style="font-size:10px;opacity:0.72;margin-bottom:3px;font-weight:600;">${escHtml(m.badge)}</div>` : ""}
                  <div>${escHtml(m.text)}</div>
                  ${(m.buttons || []).map((btn) => `
                    <div style="margin-top:8px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,0.16);text-align:center;font-weight:600;font-size:12px;">
                      ${escHtml(btn.label)} &rarr;
                    </div>
                  `).join("")}
                </div>
              `).join("")}
              ${store.ui.chatSimTyping ? `<div class="bubble is-me typing-dots"><span></span><span></span><span></span></div>` : ""}
            </div>

            <div style="display:flex;gap:8px;">
              <input class="input" id="sim-message-input" value="${escHtml(selectedAuto?.keywords?.[0] || "REPO")}" placeholder="Type a comment or DM message..." />
              <button class="btn btn-primary" type="submit">${icon("send", 15)} Send</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   7. UNIFIED INBOX & COMMENTS (/app/inbox) — 3-Pane Chat + Contact CRM
   ============================================================================ */
export function renderInbox() {
  const b = store.bundle;
  const tab = store.ui.inboxTab || "dms";
  const filter = store.ui.inboxFilter || "open";
  const search = (store.ui.inboxSearch || "").toLowerCase();

  const threads = b.threads.filter((t) => {
    if (search && !t.participant_handle.toLowerCase().includes(search) && !t.participant_name.toLowerCase().includes(search)) return false;
    if (filter === "open") return Boolean(t.is_open) && !t.is_archived;
    if (filter === "unread") return t.unread_count > 0;
    if (filter === "priority") return Boolean(t.is_hot_lead);
    if (filter === "archived") return Boolean(t.is_archived);
    return true;
  });

  const activeThread = threads.find((t) => t.id === store.ui.selectedThreadId) || threads[0] || b.threads[0];

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Unified Inbox</h1>
          <p class="page-desc">Respond to Instagram DMs within the 24-hour Messenger window, moderate post comments, and track lead notes.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            <button class="seg-btn ${tab === "dms" ? "is-active" : ""}" data-inbox-tab="dms">Direct Messages (${b.threads.length})</button>
            <button class="seg-btn ${tab === "comments" ? "is-active" : ""}" data-inbox-tab="comments">Post Comments (${b.comments.length})</button>
          </div>
        </div>
      </div>

      ${tab === "comments" ? `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Post Comments</div>
              <div class="card-sub">Reply publicly, trigger an instant private DM link, or hide spam comments</div>
            </div>
          </div>
          <div>
            ${b.comments.map((c) => `
              <div style="padding:16px 20px;border-bottom:1px solid var(--border-subtle);display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:14px;">
                <div style="max-width:640px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <strong>@${escHtml(c.author_handle)}</strong>
                    <span style="font-size:12px;color:var(--ink-muted);">on "${escHtml(c.post_title)}"</span>
                    ${c.dm_sent ? `<span class="badge badge-success">DM Delivered</span>` : ""}
                  </div>
                  <p style="font-size:14px;">${escHtml(c.body)}</p>
                  ${c.public_reply ? `
                    <div style="margin-top:8px;padding:8px 12px;border-left:2px solid var(--border-strong);font-size:12.5px;color:var(--ink-secondary);">
                      <strong>Your reply:</strong> ${escHtml(c.public_reply)}
                    </div>
                  ` : ""}
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  ${!c.dm_sent ? `<button class="btn btn-sm btn-primary" data-comment-dm="${escHtml(c.id)}">${icon("send", 13)} Send Link DM</button>` : ""}
                  <button class="btn btn-sm" data-comment-reply="${escHtml(c.id)}">Reply Publicly</button>
                  <button class="btn btn-sm btn-ghost" data-comment-hide="${escHtml(c.id)}">Hide</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : `
        <div class="inbox-shell ${store.mobileInboxChatOpen ? "mobile-chat-open" : ""}">
          <!-- Left Pane: Thread List -->
          <div class="inbox-list-pane">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
              <input class="input" id="inbox-search-input" value="${escHtml(store.ui.inboxSearch)}" placeholder="Search @handle or name..." style="height:32px;" />
              <div style="display:flex;gap:4px;overflow-x:auto;">
                ${[["open", "Open"], ["unread", "Unread"], ["priority", "Priority"], ["all", "All"]].map(([k, lbl]) => `
                  <button class="btn btn-sm ${filter === k ? "btn-primary" : "btn-ghost"}" style="height:25px;padding:0 8px;font-size:11.5px;" data-inbox-filter="${k}">${lbl}</button>
                `).join("")}
              </div>
            </div>
            <div style="overflow-y:auto;flex:1;">
              ${threads.map((t) => `
                <button class="inbox-thread-row ${activeThread?.id === t.id ? "is-active" : ""}" data-select-thread="${escHtml(t.id)}">
                  <span class="ws-avatar" style="background:${escHtml(t.avatar_color || "#0F172A")};margin-top:2px;">${escHtml(t.participant_handle[0].toUpperCase())}</span>
                  <div style="min-width:0;flex:1;">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
                      <strong style="font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">@${escHtml(t.participant_handle)}</strong>
                      ${t.unread_count ? `<span class="nav-count is-alert">${t.unread_count}</span>` : (t.is_hot_lead ? `<span class="badge badge-brand" style="height:18px;font-size:10px;">Priority</span>` : "")}
                    </div>
                    <div style="font-size:12px;color:var(--ink-muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                      ${escHtml(t.last_message_preview)}
                    </div>
                  </div>
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Center Pane: Active Conversation -->
          ${activeThread ? `
            <div class="inbox-chat-pane">
              <div style="padding:12px 16px;background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:9px;">
                  <button class="btn btn-sm mobile-menu-trigger" id="btn-mobile-back-threads">${icon("arrowLeft", 14)} Back</button>
                  <div>
                    <div style="font-weight:650;font-size:14px;">${escHtml(activeThread.participant_name)} <span style="color:var(--ink-muted);font-weight:450;">@${escHtml(activeThread.participant_handle)}</span></div>
                    <div style="font-size:11.5px;color:var(--ink-muted);">
                      ${activeThread.windowOpen
                        ? `<span style="color:var(--success);">&#9679;</span> 24h Meta reply window active (${activeThread.windowHoursRemaining}h left)`
                        : `<span style="color:var(--warning);">&#9679;</span> 24h window closed — simulate incoming message to re-open`}
                    </div>
                  </div>
                </div>
                <div style="display:flex;gap:6px;">
                  <button class="btn btn-sm" id="btn-simulate-incoming" data-thread="${escHtml(activeThread.id)}">Simulate Reply</button>
                  <button class="btn btn-sm ${activeThread.is_hot_lead ? "btn-brand" : ""}" data-toggle-hot="${escHtml(activeThread.id)}">Priority</button>
                  <button class="btn btn-sm" data-toggle-close="${escHtml(activeThread.id)}">${activeThread.is_open ? "Close" : "Reopen"}</button>
                </div>
              </div>

              <div class="inbox-messages" id="inbox-msg-scroll">
                ${activeThread.messages.map((m) => `
                  <div class="bubble ${m.sender === "me" ? "is-me" : "is-them"}">
                    ${m.shared_reel_title ? `<div style="font-size:11px;opacity:0.7;margin-bottom:4px;">Replied to post: "${escHtml(m.shared_reel_title)}"</div>` : ""}
                    ${m.via_automation ? `<div style="font-size:10.5px;opacity:0.75;margin-bottom:4px;">Automated via ${escHtml(m.via_automation)}</div>` : ""}
                    ${m.media_url ? `<img src="${escHtml(m.media_url)}" alt="" style="max-width:220px;border-radius:8px;margin-bottom:6px;display:block;" />` : ""}
                    <div>${escHtml(m.body)}</div>
                    ${(m.buttons || []).map((btn) => `
                      <a href="${escHtml(btn.url)}" target="_blank" rel="noopener" style="display:block;margin-top:8px;padding:6px 10px;border-radius:7px;background:rgba(255,255,255,0.16);text-align:center;font-size:12px;font-weight:600;">
                        ${escHtml(btn.label)} &rarr;
                      </a>
                    `).join("")}
                  </div>
                `).join("")}
              </div>

              <div style="padding:12px 16px;background:var(--bg-surface);border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;gap:6px;overflow-x:auto;">
                  <button type="button" class="btn btn-sm" id="btn-ai-draft-reply" data-thread="${escHtml(activeThread.id)}">${icon("wand", 13)} Draft Reply</button>
                  ${QUICK_SNIPPETS.map((s, idx) => `
                    <button type="button" class="btn btn-sm btn-ghost" data-snippet="${escHtml(s)}">Snippet ${idx + 1}</button>
                  `).join("")}
                </div>
                <form id="form-inbox-reply" data-thread="${escHtml(activeThread.id)}" style="display:flex;gap:8px;">
                  <input class="input" id="inbox-reply-input" placeholder="Write a message to @${escHtml(activeThread.participant_handle)}..." />
                  <button class="btn btn-primary" type="submit">${icon("send", 15)} Send</button>
                </form>
              </div>
            </div>

            <!-- Right Pane: Contact CRM Details & Persistent Notes -->
            <aside class="inbox-crm-pane">
              <div style="text-align:center;padding-bottom:12px;border-bottom:1px solid var(--border);">
                <span class="ws-avatar" style="width:48px;height:48px;font-size:18px;background:${escHtml(activeThread.avatar_color || "#0F172A")};margin:0 auto 8px;">
                  ${escHtml(activeThread.participant_handle[0].toUpperCase())}
                </span>
                <div style="font-weight:650;font-size:14.5px;">${escHtml(activeThread.participant_name)}</div>
                <div style="font-size:12px;color:var(--ink-muted);" class="tabular">@${escHtml(activeThread.participant_handle)} &middot; ${fmtNum(activeThread.participant_followers || 3400)} followers</div>
              </div>

              <div class="field">
                <label class="field-label">Labels (${activeThread.tags.length}/8)</label>
                <div style="display:flex;flex-wrap:wrap;gap:5px;">
                  ${activeThread.tags.map((tag) => `<span class="badge">${escHtml(tag)}</span>`).join("")}
                </div>
                <form id="form-add-thread-tag" data-thread="${escHtml(activeThread.id)}" style="display:flex;gap:6px;margin-top:6px;">
                  <input class="input" name="tag" placeholder="Add tag..." style="height:30px;font-size:12px;" />
                  <button class="btn btn-sm" type="submit">Add</button>
                </form>
              </div>

              <div class="field" style="flex:1;">
                <label class="field-label">CRM Contact Notes</label>
                <textarea class="textarea" id="crm-notes-input" rows="5" placeholder="Deal size, deliverables, follow-up dates...">${escHtml(activeThread.crm_notes || "")}</textarea>
                <button class="btn btn-sm btn-primary" id="btn-save-crm-notes" data-thread="${escHtml(activeThread.id)}">Save Notes</button>
              </div>
            </aside>
          ` : ""}
        </div>
      `}
    </div>
  `;
}

/* ============================================================================
   8. PERFORMANCE ANALYTICS (/app/analytics) — SVG Chart + Heatmap + CSV Export
   ============================================================================ */
export function renderAnalytics() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const range = store.ui.analyticsRange || "30d";
  const mult = range === "7d" ? 0.34 : range === "90d" ? 2.4 : 1;

  const published = b.posts.filter((p) => p.status === "PUBLISHED");
  const views = Math.round(published.reduce((s, p) => s + (p.views || 0), 0) * mult);
  const reach = Math.round(published.reduce((s, p) => s + (p.reach || 0), 0) * mult);
  const saves = Math.round(published.reduce((s, p) => s + (p.saves || 0), 0) * mult);
  const saveRate = reach ? ((saves / reach) * 100).toFixed(2) : "4.20";
  const trialPosts = b.posts.filter((p) => p.is_trial_reel);

  const series = [38, 52, 49, 68, 74, 63, 88, 95, 84, 108, 119, 134];
  const maxVal = Math.max(...series);
  const points = series.map((v, i) => `${28 + i * 48},${156 - Math.round((v / maxVal) * 124)}`).join(" ");

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Performance Analytics</h1>
          <p class="page-desc">Reach velocity, save-to-reach ratios, Trial Reel graduation benchmarks, and CSV reporting for @${escHtml(ws.ig_handle)}.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            ${["7d", "30d", "90d"].map((r) => `
              <button class="seg-btn ${range === r ? "is-active" : ""}" data-analytics-range="${r}">${r}</button>
            `).join("")}
          </div>
          <a class="btn" href="/api/analytics/export.csv?workspaceId=${encodeURIComponent(ws.id)}" download>
            ${icon("download", 15)} Export CSV
          </a>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="card kpi-card"><div class="kpi-top"><span>Total Views (${range})</span>${icon("eye", 15)}</div><div class="kpi-val">${fmtNum(views)}</div><div class="kpi-foot"><span class="badge badge-success">+21.6%</span> period over period</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Unique Reach</span>${icon("users", 15)}</div><div class="kpi-val">${fmtNum(reach)}</div><div class="kpi-foot">83% non-follower discovery</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Total Bookmarks</span>${icon("bookmark", 15)}</div><div class="kpi-val">${fmtNum(saves)}</div><div class="kpi-foot">${saveRate}% save-to-reach ratio</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Workflow Link CTR</span>${icon("bolt", 15)}</div><div class="kpi-val">75.4%</div><div class="kpi-foot">Direct Messenger CTA taps</div></div>
      </div>

      <div class="split-2" style="margin-bottom:20px;">
        <div class="card card-pad">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div>
              <div class="card-title">Reach &amp; Discovery Trend</div>
              <div class="card-sub">Smoothed daily impressions across Reels &amp; Carousels</div>
            </div>
            <span class="badge badge-info">Official Insights</span>
          </div>
          <svg viewBox="0 0 580 180" style="width:100%;height:auto;display:block;">
            <line x1="20" y1="160" x2="565" y2="160" stroke="var(--border)" stroke-width="1" />
            <line x1="20" y1="98" x2="565" y2="98" stroke="var(--border-subtle)" stroke-dasharray="4 4" stroke-width="1" />
            <line x1="20" y1="36" x2="565" y2="36" stroke="var(--border-subtle)" stroke-dasharray="4 4" stroke-width="1" />
            <polyline fill="none" stroke="var(--brand)" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
            ${series.map((v, i) => {
              const cx = 28 + i * 48;
              const cy = 156 - Math.round((v / maxVal) * 124);
              return `<circle cx="${cx}" cy="${cy}" r="3.8" fill="var(--bg-surface)" stroke="var(--brand)" stroke-width="2.2"><title>Window ${i + 1}: ${v}K reach</title></circle>`;
            }).join("")}
          </svg>
        </div>

        <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
          <div>
            <div class="card-title">Trial Reels Graduation Lab</div>
            <div class="card-sub">Promote winning non-follower tests onto your permanent profile grid</div>
          </div>
          ${trialPosts.length ? trialPosts.map((tp) => `
            <div style="padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--bg-page);display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <div>
                <div style="font-weight:600;font-size:13.5px;">${escHtml(tp.title)}</div>
                <div style="font-size:12px;color:var(--ink-muted);" class="tabular">${fmtNum(tp.views)} views &middot; ${tp.avg_watch_sec || 14.2}s avg watch</div>
              </div>
              ${tp.trial_graduated
                ? `<span class="badge badge-success">Graduated to Feed</span>`
                : `<button class="btn btn-sm btn-primary" data-graduate-trial="${escHtml(tp.id)}">Graduate to Feed</button>`}
            </div>
          `).join("") : `<p style="font-size:13px;color:var(--ink-muted);">Schedule a post with "Trial Reel" enabled in Create Post to benchmark hooks risk-free.</p>`}
        </div>
      </div>

      <div class="card table-wrap">
        <div class="card-header"><div class="card-title">Published Content Breakdown</div></div>
        <table class="v-table">
          <thead>
            <tr><th>Title</th><th>Type</th><th>Views</th><th>Reach</th><th>Likes</th><th>Saves</th><th>Avg Watch</th></tr>
          </thead>
          <tbody>
            ${published.map((p) => `
              <tr>
                <td><strong>${escHtml(p.title)}</strong></td>
                <td><span class="badge">${escHtml(p.media_type)}</span></td>
                <td class="tabular">${fmtNum(p.views)}</td>
                <td class="tabular">${fmtNum(p.reach)}</td>
                <td class="tabular">${fmtNum(p.likes)}</td>
                <td class="tabular"><strong>${fmtNum(p.saves)}</strong></td>
                <td class="tabular">${p.avg_watch_sec ? `${p.avg_watch_sec}s` : "Carousel"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ============================================================================
   9. WORKSPACE SETTINGS, TEAM, BILLING & DEVELOPER MCP API (/app/settings)
   ============================================================================ */
export function renderSettings() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const tab = store.ui.settingsTab || "general";
  const mcpTools = b.mcpTools || [];

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">Workspace Settings</h1>
          <p class="page-desc">Configure @${escHtml(ws.ig_handle)} profile preferences, team members, subscription tier, and Claude/Cursor MCP access.</p>
        </div>
        <div class="segmented" style="flex-wrap:wrap;">
          ${[
            ["general", "General"],
            ["team", `Team (${b.teamMembers.length})`],
            ["billing", "Plan & Billing"],
            ["developer", `Developer & MCP (${mcpTools.length})`],
            ["backup", "Data & Reset"]
          ].map(([id, label]) => `
            <button class="seg-btn ${tab === id ? "is-active" : ""}" data-settings-tab="${id}">${label}</button>
          `).join("")}
        </div>
      </div>

      ${tab === "general" ? `
        <div class="split-2">
          <form id="form-workspace-general" class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
            <div class="card-title">Profile &amp; Scheduling Defaults</div>
            <div class="field">
              <label class="field-label">Workspace Display Name</label>
              <input class="input" name="name" value="${escHtml(ws.name)}" />
            </div>
            <div class="field">
              <label class="field-label">Connected Instagram Handle</label>
              <input class="input" name="igHandle" value="@${escHtml(ws.ig_handle)}" />
            </div>
            <div class="field">
              <label class="field-label">Profile Bio (Synced to Grid Preview)</label>
              <textarea class="textarea" name="bio" rows="3">${escHtml(ws.bio || "")}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="field">
                <label class="field-label">Timezone</label>
                <select class="select" name="timezone">
                  ${["Asia/Calcutta", "America/Toronto", "America/New_York", "Europe/London", "Asia/Singapore"].map((tz) => `
                    <option value="${tz}" ${ws.timezone === tz ? "selected" : ""}>${tz}</option>
                  `).join("")}
                </select>
              </div>
              <div class="field">
                <label class="field-label">Daily Slots (comma-separated)</label>
                <input class="input" name="slots" value="${escHtml((ws.posting_slots || []).join(", "))}" />
              </div>
            </div>
            <div><button class="btn btn-primary" type="submit">Save Workspace Settings</button></div>
          </form>

          <form id="form-create-workspace" class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
            <div class="card-title">Connect Another Instagram Account</div>
            <p class="card-sub">Switch effortlessly across brand accounts in the top-left workspace switcher.</p>
            <div class="field">
              <label class="field-label">Workspace Name</label>
              <input class="input" name="name" required placeholder="Northwind Design Lab" />
            </div>
            <div class="field">
              <label class="field-label">Instagram Handle</label>
              <input class="input" name="igHandle" required placeholder="@northwind.lab" />
            </div>
            <div><button class="btn" type="submit">${icon("plus", 14)} Add Workspace</button></div>
          </form>
        </div>
      ` : ""}

      ${tab === "team" ? `
        <div class="split-2">
          <div class="card table-wrap">
            <div class="card-header"><div class="card-title">Workspace Collaborators</div></div>
            <table class="v-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
              <tbody>
                ${b.teamMembers.map((m) => `
                  <tr>
                    <td><strong>${escHtml(m.name)}</strong></td>
                    <td>${escHtml(m.email)}</td>
                    <td><span class="badge">${escHtml(m.role)}</span></td>
                    <td>${escHtml(m.status)}</td>
                    <td>${m.role !== "Owner" ? `<button class="btn btn-sm btn-ghost" data-remove-member="${escHtml(m.id)}">Remove</button>` : ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>

          <form id="form-invite-member" class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Invite Team Member</div>
            <div class="field"><label class="field-label">Full Name</label><input class="input" name="name" required placeholder="Riya Sharma" /></div>
            <div class="field"><label class="field-label">Work Email</label><input class="input" type="email" name="email" required placeholder="riya@velora.so" /></div>
            <div class="field">
              <label class="field-label">Role</label>
              <select class="select" name="role"><option>Editor</option><option>Content Manager</option><option>Analyst</option></select>
            </div>
            <button class="btn btn-primary" type="submit">Send Invite</button>
          </form>
        </div>
      ` : ""}

      ${tab === "billing" ? `
        <div class="pricing-grid">
          ${Object.values(b.plansConfig.plans).map((p) => `
            <div class="card plan-card ${ws.plan === p.id ? "is-popular" : ""}">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="font-size:16px;">${escHtml(p.name)}</strong>
                  ${ws.plan === p.id ? `<span class="badge badge-success">Current Plan</span>` : ""}
                </div>
                <p style="font-size:12.5px;color:var(--ink-muted);margin:8px 0 14px;">${escHtml(p.tagline)}</p>
                <div class="plan-price">${p.id === "lifetime" ? `$${p.priceOneTimeUsd}` : `$${p.priceMonthlyUsd}`}<span style="font-size:13px;font-weight:450;color:var(--ink-muted);">${p.id === "lifetime" ? " once" : "/mo"}</span></div>
                <ul class="plan-list">
                  ${p.highlights.slice(0, 5).map((h) => `<li>${icon("check", 14)}${escHtml(h)}</li>`).join("")}
                </ul>
              </div>
              <button class="btn ${ws.plan === p.id ? "" : "btn-primary"}" data-switch-ws-plan="${escHtml(p.id)}" ${ws.plan === p.id ? "disabled" : ""}>
                ${ws.plan === p.id ? "Active on Workspace" : `Switch to ${escHtml(p.name)}`}
              </button>
            </div>
          `).join("")}
        </div>
      ` : ""}

      ${tab === "developer" ? `
        <div class="split-2">
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Model Context Protocol (MCP) Endpoint</div>
            <p style="font-size:13px;color:var(--ink-secondary);">
              Connect Claude Desktop, Cursor, or any JSON-RPC 2.0 agent directly to your live Velora SQLite workspace.
            </p>
            <pre class="mono" style="padding:12px;border-radius:8px;background:var(--bg-subtle);overflow-x:auto;margin:0;">{
  "mcpServers": {
    "velora": {
      "url": "${escHtml(location.origin)}/mcp"
    }
  }
}</pre>
            <div class="field">
              <label class="field-label">Test Live MCP Tool (${mcpTools.length} registered tools)</label>
              <select class="select" id="mcp-tool-select">
                ${mcpTools.map((t) => `<option value="${escHtml(t.name)}" ${store.ui.mcpSelectedTool === t.name ? "selected" : ""}>${escHtml(t.category)} — ${escHtml(t.name)}</option>`).join("")}
              </select>
            </div>
            <div class="field">
              <label class="field-label">JSON Arguments</label>
              <textarea class="textarea mono" id="mcp-args-input" rows="3">{"workspace_id": "${escHtml(ws.id)}"}</textarea>
            </div>
            <button class="btn btn-primary" id="btn-invoke-mcp">${icon("code", 15)} Execute POST /mcp</button>
          </div>

          <div class="card card-pad" style="display:flex;flex-direction:column;gap:10px;">
            <div class="card-title">Live JSON-RPC Response</div>
            <pre class="mono" id="mcp-output-box" style="padding:14px;border-radius:8px;background:var(--bg-subtle);overflow:auto;max-height:380px;margin:0;font-size:12px;">${escHtml(store.ui.mcpLastResponse ? JSON.stringify(store.ui.mcpLastResponse, null, 2) : '// Click "Execute POST /mcp" to inspect live server response')}</pre>
          </div>
        </div>
      ` : ""}

      ${tab === "backup" ? `
        <div class="split-2">
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Export Workspace Snapshot</div>
            <p style="font-size:13px;color:var(--ink-secondary);">Download all workspaces, scheduled posts, carousels, DM workflows, and CRM notes as portable JSON.</p>
            <div><button class="btn btn-primary" id="btn-export-json">${icon("download", 15)} Download JSON Backup</button></div>
          </div>
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Reset Seed Dataset</div>
            <p style="font-size:13px;color:var(--ink-secondary);">Restore all 4 demo workspaces, sample posts, carousels, and Inbox threads to their clean initial state.</p>
            <div><button class="btn btn-danger" id="btn-reset-demo">${icon("refresh", 15)} Reset Demo Database</button></div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}
