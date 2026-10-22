import { store, escHtml, fmtNum } from "./api.js";
import { icon } from "./icons.js";
import { renderUnconnectedBanner } from "./appViews.js";

const QUICK_SNIPPETS = [
  "Thanks for reaching out! Just sent the resource pack right above.",
  "Yes — we have one Q4 sponsored slot open next month. Happy to share our media kit!",
  "Glad the breakdown helped! Let me know once you try it on your next post."
];

/* ============================================================================
   6. DM AUTOMATIONS + COLLAPSIBLE FLOW PIPELINES + AI WORKFLOW BUILDER (/app/automations)
   ============================================================================ */
export function renderAutomations() {
  const b = store.bundle;
  const ws = b.activeWorkspace;
  const statusFilter = store.ui.autoFilterStatus || "all";
  const triggerFilter = store.ui.autoTriggerFilter || "all";
  const expandedMap = store.ui.expandedAutoIds || {};

  const filteredAutos = b.automations.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (triggerFilter !== "all" && a.trigger_type !== triggerFilter) return false;
    return true;
  });

  const selectedAuto = filteredAutos[0] || b.automations[0];
  const simMsgs = store.ui.chatSimMessages;

  return `
    <div class="stage-animate">
      <div class="page-head">
        <div>
          <h1 class="page-title">DM Workflows</h1>
          <p class="page-desc">Build plain-English AI workflows, inspect collapsible 4-stage pipelines, and test live Messenger delivery.</p>
        </div>
        <div class="head-actions">
          <select class="select" id="auto-status-filter" style="width:auto;">
            <option value="all" ${statusFilter === "all" ? "selected" : ""}>Status: All (${b.automations.length})</option>
            <option value="active" ${statusFilter === "active" ? "selected" : ""}>Active Only</option>
            <option value="paused" ${statusFilter === "paused" ? "selected" : ""}>Paused Only</option>
          </select>
          <select class="select" id="auto-trigger-filter" style="width:auto;">
            <option value="all" ${triggerFilter === "all" ? "selected" : ""}>Trigger: All Types</option>
            <option value="comment" ${triggerFilter === "comment" ? "selected" : ""}>Post / Reel Comment</option>
            <option value="story_reply" ${triggerFilter === "story_reply" ? "selected" : ""}>Story Reply</option>
            <option value="dm_keyword" ${triggerFilter === "dm_keyword" ? "selected" : ""}>Direct Message Keyword</option>
          </select>
          <button class="btn btn-primary" id="btn-open-new-workflow">${icon("plus", 15)} Custom Rule</button>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      <!-- PLAIN-ENGLISH AI WORKFLOW GENERATOR BAR -->
      <form id="form-ai-workflow-builder" class="card card-pad" style="margin-bottom:20px;border-color:var(--brand-border);display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;">
        <div class="field" style="flex:1;min-width:260px;">
          <label class="field-label">${icon("wand", 13)} Build Complete Workflow from Plain English</label>
          <input class="input" id="ai-workflow-prompt" value="${escHtml(store.ui.autoPromptText || "")}" required placeholder="e.g., When viewers comment GUIDE or TEMPLATE, rotate public replies, verify follow, and DM our Notion starter kit" />
        </div>
        <button class="btn btn-primary" type="submit">${icon("wand", 14)} Generate &amp; Activate Workflow</button>
      </form>

      <div class="split-2">
        <!-- LEFT: COLLAPSIBLE 4-STAGE WORKFLOW CARDS -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${filteredAutos.length === 0 ? `
            <div class="card card-pad" style="padding:36px 24px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;">
              <span style="color:var(--ink-muted);">${icon("bolt", 28)}</span>
              <div style="font-weight:700;font-size:15.5px;">No DM Workflows Configured Yet</div>
              <p style="font-size:13px;color:var(--ink-muted);max-width:420px;line-height:1.55;">
                Live Instagram delivery requires connecting <code class="mono">instagram_manage_comments</code> &amp; <code class="mono">instagram_manage_messages</code> webhooks. You can create a workflow rule right above and test it immediately in the simulator!
              </p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                <button type="button" class="btn btn-primary btn-sm" id="btn-empty-new-auto">${icon("plus", 14)} Create First Workflow</button>
                <button type="button" class="btn btn-sm" data-open-meta-setup>Connect Meta Webhook</button>
              </div>
            </div>
          ` : filteredAutos.map((a) => {
            const ctr = a.dms_sent ? ((a.link_taps / a.dms_sent) * 100).toFixed(1) : "0.0";
            const isOpen = Boolean(expandedMap[a.id]);
            return `
              <div class="flow-card">
                <div class="flow-card-head" data-toggle-flow-expand="${escHtml(a.id)}">
                  <div style="min-width:0;flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <strong style="font-size:15px;">${escHtml(a.name)}</strong>
                      <span class="badge ${a.status === "active" ? "badge-success" : ""}">
                        <span class="dot"></span>${a.status === "active" ? "Active" : "Paused"}
                      </span>
                      <span class="badge">${escHtml(a.trigger_type)}</span>
                    </div>
                    <div style="font-size:12px;color:var(--ink-muted);margin-top:4px;display:flex;gap:14px;flex-wrap:wrap;" class="tabular">
                      <span>Keywords: ${a.keywords.length ? a.keywords.map((k) => `<code class="mono">${escHtml(k)}</code>`).join(", ") : "AI Concierge"}</span>
                      <span><strong>${fmtNum(a.dms_sent)}</strong> DMs &middot; <strong>${ctr}%</strong> CTR</span>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;" data-stop-prop>
                    <button type="button" class="btn btn-sm" data-quick-test-auto="${escHtml(a.id)}" data-kw="${escHtml(a.keywords[0] || "REPO")}">Test</button>
                    <button type="button" class="btn btn-sm" data-toggle-auto="${escHtml(a.id)}">${a.status === "active" ? "Pause" : "Resume"}</button>
                    <span style="padding:0 4px;color:var(--ink-muted);transform:rotate(${isOpen ? "90deg" : "0deg"});transition:transform 150ms ease;display:inline-flex;">
                      ${icon("chevronRight", 15)}
                    </span>
                  </div>
                </div>

                ${isOpen ? `
                  <div class="flow-card-body">
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:12px;">
                      <div class="card card-pad" style="padding:11px 13px;">
                        <div style="font-size:10.5px;font-weight:700;color:var(--brand);margin-bottom:4px;">STAGE 1 &middot; TRIGGER</div>
                        <div style="font-size:12.5px;font-weight:600;">${escHtml(a.trigger_type.replace("_", " ").toUpperCase())}</div>
                        <div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px;">Matches: ${escHtml(a.keywords.join(", ") || "All messages")}</div>
                      </div>
                      <div class="card card-pad" style="padding:11px 13px;">
                        <div style="font-size:10.5px;font-weight:700;color:var(--brand);margin-bottom:4px;">STAGE 2 &middot; PUBLIC REPLY</div>
                        <div style="font-size:12.5px;font-weight:600;">${a.public_reply_enabled ? `${(a.public_reply_variants || []).length || 3} Rotated Variants` : "Disabled"}</div>
                        <div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px;">Natural anti-spam rotation</div>
                      </div>
                      <div class="card card-pad" style="padding:11px 13px;">
                        <div style="font-size:10.5px;font-weight:700;color:var(--brand);margin-bottom:4px;">STAGE 3 &middot; FOLLOW GATE</div>
                        <div style="font-size:12.5px;font-weight:600;">${a.follow_gate_enabled ? "Follower Check Active" : "Direct Open Delivery"}</div>
                        <div style="font-size:11.5px;color:var(--ink-muted);margin-top:2px;">${a.followup_enabled ? `Follow-up after ${escHtml(a.followup_delay || "2h")}` : "Single send"}</div>
                      </div>
                    </div>

                    <div style="padding:12px 14px;border-radius:10px;background:var(--bg-surface);border:1px solid var(--border);font-size:12.5px;color:var(--ink-primary);white-space:pre-line;margin-bottom:12px;">
                      <div style="font-size:11px;font-weight:600;color:var(--ink-muted);margin-bottom:4px;"> Messenger Card Copy:</div>
                      ${escHtml(a.dm_message || a.ai_prompt)}
                      ${(a.buttons || []).length ? `
                        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                          ${a.buttons.map((btn) => `<span class="badge badge-brand">${escHtml(btn.label)} <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg></span>`).join("")}
                        </div>
                      ` : ""}
                    </div>

                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                      <button type="button" class="btn btn-sm" data-sweep-auto="${escHtml(a.id)}">${icon("refresh", 13)} Sweep Past Comments</button>
                      <button type="button" class="btn btn-sm btn-danger" data-delete-auto="${escHtml(a.id)}">${icon("trash", 13)} Delete Rule</button>
                    </div>
                  </div>
                ` : ""}
              </div>
            `;
          }).join("")}
        </div>

        <!-- RIGHT: CRISP LIGHT PEARL-SILVER MESSENGER DEVICE SIMULATOR -->
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div class="card-title">Live Messenger Previewer</div>
                <div class="card-sub">Test keyword triggers, follower gates &amp; Inbox sync in real time</div>
              </div>
              <button class="btn btn-sm btn-ghost" id="btn-clear-sim">Reset</button>
            </div>

            <form id="form-live-sim" style="display:flex;flex-direction:column;gap:12px;">
              <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;">
                <select class="select" id="sim-auto-select">
                  ${b.automations.map((a) => `<option value="${escHtml(a.id)}">${escHtml(a.name)}</option>`).join("")}
                </select>
                <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;white-space:nowrap;">
                  <input type="checkbox" id="sim-is-follower" checked /> Following
                </label>
              </div>

              <div class="phone-frame" style="max-width:100%;">
                <div class="phone-screen">
                  <div class="phone-status-bar">
                    <span>9:41</span>
                    <div class="phone-island"></div>
                    <span style="font-size:10.5px;">5G &middot; 100%</span>
                  </div>
                  <div class="phone-ig-header">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <div class="phone-story-ring"><div class="phone-story-ring-inner">${escHtml(ws.ig_handle[0].toUpperCase())}</div></div>
                      <div>
                        <div style="font-weight:700;font-size:12.5px;color:#09090B;">@${escHtml(ws.ig_handle)}</div>
                        <div style="font-size:10.5px;color:#059669;font-weight:600;">Official Messenger Sandbox</div>
                      </div>
                    </div>
                    <span style="font-size:10.5px;color:#64748B;font-weight:600;">Live Test</span>
                  </div>

                  <div id="sim-chat-stream" style="height:270px;overflow-y:auto;padding:14px;background:#F8FAFC;display:flex;flex-direction:column;gap:9px;">
                    ${simMsgs.length === 0 ? `
                      <div style="align-self:flex-end;max-width:86%;padding:9px 12px;border-radius:14px;background:#EEF2FF;color:#1E1B4B;border:1px solid #C7D2FE;font-size:12.5px;">
                        <div style="font-size:10px;color:#4338CA;font-weight:700;margin-bottom:2px;">@arjun.codes &middot; Reel Comment</div>
                        Commented <strong>"${escHtml(selectedAuto?.keywords?.[0] || "REPO")}"</strong> on Reel #04
                      </div>
                      <div style="margin:auto 0 4px;padding:10px 12px;border-radius:12px;background:#FFFFFF;border:1px dashed #CBD5E1;text-align:center;color:#475569;font-size:12px;line-height:1.45;">
                        Click <strong>Send</strong> below to fire rotated public reply &amp; Official Meta Rich DM Card in 0.8s
                      </div>
                    ` : simMsgs.map((m) => `
                      <div style="align-self:${m.role === "user" ? "flex-end" : "flex-start"};max-width:86%;padding:10px 13px;border-radius:14px;font-size:12.5px;line-height:1.45;${
                        m.role === "user"
                          ? "background:#EEF2FF;color:#1E1B4B;border:1px solid #C7D2FE;"
                          : "background:#FFFFFF;color:#09090B;border:1px solid #E2E8F0;box-shadow:0 2px 6px rgba(15,23,42,0.05);"
                      }">
                        ${m.badge ? `<div style="font-size:10px;color:#64748B;margin-bottom:3px;font-weight:600;">${escHtml(m.badge)}</div>` : ""}
                        <div>${escHtml(m.text)}</div>
                        ${(m.buttons || []).map((btn) => `
                          <div style="margin-top:8px;padding:7px 10px;border-radius:8px;background:#4F46E5;color:#FFFFFF;text-align:center;font-weight:600;font-size:12px;">
                            ${escHtml(btn.label)} <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                          </div>
                        `).join("")}
                      </div>
                    `).join("")}
                    ${store.ui.chatSimTyping ? `<div class="bubble is-them typing-dots"><span></span><span></span><span></span></div>` : ""}
                  </div>

                  <div style="padding:10px 12px 12px;background:#FFFFFF;border-top:1px solid #E2E8F0;display:flex;gap:6px;">
                    <input id="sim-message-input" value="${escHtml(selectedAuto?.keywords?.[0] || "REPO")}" placeholder="Type keyword or comment..." style="flex:1;height:35px;padding:0 12px;border-radius:999px;border:1px solid #CBD5E1;background:#F8FAFC;color:#09090B;font-size:12.5px;" />
                    <button class="btn btn-brand btn-sm" type="submit" style="border-radius:999px;padding:0 15px;">Send</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ============================================================================
   7. UNIFIED INBOX & COMMENTS (/app/inbox) — Filter Dropdowns, AI Summary & Collapsible CRM
   ============================================================================ */
export function renderInbox() {
  const b = store.bundle;
  const tab = store.ui.inboxTab || "dms";
  const filter = store.ui.inboxFilter || "open";
  const tagFilter = store.ui.inboxTagFilter || "all";
  const search = (store.ui.inboxSearch || "").toLowerCase();
  const crmOpen = store.ui.inboxCrmOpen || { deal: true, profile: true, templates: false };

  const allTags = Array.from(new Set(b.threads.flatMap((t) => t.tags || [])));

  const threads = b.threads.filter((t) => {
    if (search && !t.participant_handle.toLowerCase().includes(search) && !t.participant_name.toLowerCase().includes(search)) return false;
    if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false;
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
          <p class="page-desc">Filter conversations by label, generate multi-tone AI replies, and manage collapsible contact CRM panels.</p>
        </div>
        <div class="head-actions">
          <div class="segmented">
            <button class="seg-btn ${tab === "dms" ? "is-active" : ""}" data-inbox-tab="dms">Direct Messages (${b.threads.length})</button>
            <button class="seg-btn ${tab === "comments" ? "is-active" : ""}" data-inbox-tab="comments">Post Comments (${b.comments.length})</button>
          </div>
        </div>
      </div>

      ${renderUnconnectedBanner()}

      ${tab === "comments" ? `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Recent Post Comments</div>
              <div class="card-sub">Reply publicly, trigger an instant private DM link, or hide spam comments</div>
            </div>
          </div>
          <div>
            ${b.comments.length === 0 ? `
              <div style="padding:40px 24px;text-align:center;color:var(--ink-muted);font-size:13.5px;">
                No post comments synced yet. Connect <code class="mono">instagram_manage_comments</code> webhook in Meta App Dashboard to stream live Reel &amp; Post comments here.
              </div>
            ` : b.comments.map((c) => `
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
          <!-- Left Pane: Search + Status Filter + Label Dropdown + Thread List -->
          <div class="inbox-list-pane">
            <div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
              <input class="input" id="inbox-search-input" value="${escHtml(store.ui.inboxSearch)}" placeholder="Search @handle or name..." style="height:32px;" />
              <div style="display:flex;gap:6px;">
                <select class="select" id="inbox-filter-dropdown" style="height:30px;font-size:12px;padding:0 8px;">
                  ${[
                    ["open", "Status: Open Chats"],
                    ["unread", "Unread Only"],
                    ["priority", "Priority Leads"],
                    ["all", "All Conversations"]
                  ].map(([k, lbl]) => `<option value="${k}" ${filter === k ? "selected" : ""}>${lbl}</option>`).join("")}
                </select>
                <select class="select" id="inbox-tag-dropdown" style="height:30px;font-size:12px;padding:0 8px;">
                  <option value="all" ${tagFilter === "all" ? "selected" : ""}>All Labels</option>
                  ${allTags.map((tg) => `<option value="${escHtml(tg)}" ${tagFilter === tg ? "selected" : ""}>Label: ${escHtml(tg)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div style="overflow-y:auto;flex:1;">
              ${threads.length === 0 ? `
                <div style="padding:28px 16px;text-align:center;color:var(--ink-muted);font-size:12.5px;">
                  No DM threads match current filter.
                </div>
              ` : threads.map((t) => `
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

          <!-- Center Pane: Active Conversation + AI Summary Banner + Multi-Tone AI Composer -->
          ${activeThread ? `
            <div class="inbox-chat-pane">
              <div style="padding:12px 16px;background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:9px;">
                  <button class="btn btn-sm mobile-menu-trigger" id="btn-mobile-back-threads">${icon("arrowLeft", 14)} Back</button>
                  <div>
                    <div style="font-weight:600;font-size:14px;">${escHtml(activeThread.participant_name)} <span style="color:var(--ink-muted);font-weight:400;">@${escHtml(activeThread.participant_handle)}</span></div>
                    <div style="font-size:11.5px;color:var(--ink-muted);">
                      ${activeThread.windowOpen
                        ? `<span style="color:var(--success);"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;vertical-align:1px;margin-right:3px;"></span></span> 24h Meta reply window active (${activeThread.windowHoursRemaining}h left)`
                        : `<span style="color:var(--warning);"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:currentColor;vertical-align:1px;margin-right:3px;"></span></span> 24h window closed — simulate incoming message to re-open`}
                    </div>
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                  <button class="btn btn-sm" id="btn-simulate-incoming" data-thread="${escHtml(activeThread.id)}">Simulate Reply</button>
                  <button class="btn btn-sm ${activeThread.is_hot_lead ? "btn-brand" : ""}" data-toggle-hot="${escHtml(activeThread.id)}">Priority</button>
                  <button class="btn btn-sm" data-toggle-close="${escHtml(activeThread.id)}">${activeThread.is_open ? "Close" : "Reopen"}</button>
                </div>
              </div>

              ${store.ui.inboxThreadSummary?.threadId === activeThread.id ? `
                <div style="padding:9px 16px;background:var(--brand-soft);border-bottom:1px solid var(--brand-border);display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;">
                  <div>
                    <strong style="color:var(--brand);">AI Thread Summary (${escHtml(store.ui.inboxThreadSummary.category)}):</strong>
                    <span> ${escHtml(store.ui.inboxThreadSummary.summary)}</span>
                  </div>
                  <span class="badge badge-brand">${escHtml(store.ui.inboxThreadSummary.priority)} Priority</span>
                </div>
              ` : ""}

              <div class="inbox-messages" id="inbox-msg-scroll">
                ${activeThread.messages.map((m) => `
                  <div class="bubble ${m.sender === "me" ? "is-me" : "is-them"}" style="${m.media_url ? "background:#FFFFFF;color:#0F172A;border:1px solid #CBD5E1;box-shadow:0 6px 18px rgba(15,23,42,0.06);max-width:300px;" : ""}">
                    ${m.shared_reel_title ? `<div style="font-size:11px;opacity:0.75;margin-bottom:4px;">Replied to post: "${escHtml(m.shared_reel_title)}"</div>` : ""}
                    ${m.via_automation ? `<div style="font-size:10.5px;font-weight:700;color:${m.media_url ? "#1D4ED8" : "inherit"};opacity:${m.media_url ? "1" : "0.8"};margin-bottom:6px;">Automated via ${escHtml(m.via_automation)}</div>` : ""}
                    ${m.media_url ? `<img src="${escHtml(m.media_url)}" alt="" style="width:100%;max-width:268px;border-radius:10px;border:1px solid #E2E8F0;margin-bottom:8px;display:block;" />` : ""}
                    <div style="line-height:1.45;">${escHtml(m.body)}</div>
                    ${(m.buttons || []).map((btn) => `
                      <a href="${escHtml(btn.url)}" target="_blank" rel="noopener" style="display:block;margin-top:9px;padding:7px 12px;border-radius:8px;background:${m.media_url ? "#1D4ED8" : "rgba(255,255,255,0.16)"};color:#FFFFFF;text-align:center;font-size:12px;font-weight:600;">
                        ${escHtml(btn.label)} <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg>
                      </a>
                    `).join("")}
                  </div>
                `).join("")}
              </div>

              <div style="padding:12px 16px;background:var(--bg-surface);border-top:1px solid var(--border);display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:space-between;">
                  <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                    <select class="select" id="inbox-ai-tone" style="height:29px;width:auto;font-size:12px;padding:0 8px;">
                      <option value="helpful" ${store.ui.inboxTone === "helpful" ? "selected" : ""}>AI Tone: Warm &amp; Helpful</option>
                      <option value="sponsor" ${store.ui.inboxTone === "sponsor" ? "selected" : ""}>AI Tone: Sponsorship Quote</option>
                      <option value="concise" ${store.ui.inboxTone === "concise" ? "selected" : ""}>AI Tone: Concise Link</option>
                      <option value="followup" ${store.ui.inboxTone === "followup" ? "selected" : ""}>AI Tone: Friendly Follow-Up</option>
                    </select>
                    <button type="button" class="btn btn-sm btn-primary" id="btn-ai-draft-reply" data-thread="${escHtml(activeThread.id)}">
                      ${icon("wand", 13)} AI Draft &amp; Summarize
                    </button>
                  </div>

                  <select class="select" id="inbox-quick-snippet-select" style="height:29px;width:auto;font-size:12px;padding:0 8px;">
                    <option value="">Insert Quick Snippet...</option>
                    ${QUICK_SNIPPETS.map((s, idx) => `<option value="${escHtml(s)}">Quick Reply #${idx + 1}: ${escHtml(s.slice(0, 28))}...</option>`).join("")}
                  </select>
                </div>

                <form id="form-inbox-reply" data-thread="${escHtml(activeThread.id)}" style="display:flex;gap:8px;">
                  <input class="input" id="inbox-reply-input" placeholder="Write a message to @${escHtml(activeThread.participant_handle)}..." />
                  <button class="btn btn-primary" type="submit">${icon("send", 15)} Send</button>
                </form>
              </div>
            </div>

            <!-- Right Pane: Collapsible Contact Profile, Tags & Deal Notes CRM -->
            <aside class="inbox-crm-pane" style="gap:10px;">
              <!-- Section 1: Contact Profile Card -->
              <div class="card" style="overflow:hidden;">
                <button type="button" data-toggle-crm-sec="profile" style="width:100%;padding:11px 14px;border:none;background:transparent;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13px;cursor:pointer;">
                  <span>Contact Profile</span>
                  <span style="transform:rotate(${crmOpen.profile ? "90deg" : "0deg"});transition:transform 140ms ease;display:inline-flex;">${icon("chevronRight", 14)}</span>
                </button>
                ${crmOpen.profile ? `
                  <div style="padding:4px 14px 14px;text-align:center;border-top:1px solid var(--border-subtle);">
                    <span class="ws-avatar" style="width:46px;height:46px;font-size:17px;background:${escHtml(activeThread.avatar_color || "#0F172A")};margin:8px auto;">
                      ${escHtml(activeThread.participant_handle[0].toUpperCase())}
                    </span>
                    <div style="font-weight:600;font-size:14px;">${escHtml(activeThread.participant_name)}</div>
                    <div style="font-size:12px;color:var(--ink-muted);" class="tabular">@${escHtml(activeThread.participant_handle)} &middot; ${fmtNum(activeThread.participant_followers || 3400)} followers</div>
                  </div>
                ` : ""}
              </div>

              <!-- Section 2: Collapsible Labels & Tags -->
              <div class="card" style="overflow:hidden;">
                <button type="button" data-toggle-crm-sec="templates" style="width:100%;padding:11px 14px;border:none;background:transparent;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13px;cursor:pointer;">
                  <span>Labels &amp; Tags (${activeThread.tags.length}/8)</span>
                  <span style="transform:rotate(${crmOpen.templates !== false ? "90deg" : "0deg"});transition:transform 140ms ease;display:inline-flex;">${icon("chevronRight", 14)}</span>
                </button>
                ${crmOpen.templates !== false ? `
                  <div style="padding:10px 14px 14px;border-top:1px solid var(--border-subtle);">
                    <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:8px;">
                      ${activeThread.tags.map((tag) => `<span class="badge">${escHtml(tag)}</span>`).join("")}
                    </div>
                    <form id="form-add-thread-tag" data-thread="${escHtml(activeThread.id)}" style="display:flex;gap:6px;">
                      <input class="input" name="tag" placeholder="Add tag..." style="height:30px;font-size:12px;" />
                      <button class="btn btn-sm" type="submit">Add</button>
                    </form>
                  </div>
                ` : ""}
              </div>

              <!-- Section 3: Collapsible Deal & Sponsorship Notes -->
              <div class="card" style="overflow:hidden;flex:1;">
                <button type="button" data-toggle-crm-sec="deal" style="width:100%;padding:11px 14px;border:none;background:transparent;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:13px;cursor:pointer;">
                  <span>Deal &amp; Sponsorship Notes</span>
                  <span style="transform:rotate(${crmOpen.deal ? "90deg" : "0deg"});transition:transform 140ms ease;display:inline-flex;">${icon("chevronRight", 14)}</span>
                </button>
                ${crmOpen.deal ? `
                  <div style="padding:10px 14px 14px;border-top:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:8px;">
                    <textarea class="textarea" id="crm-notes-input" rows="5" placeholder="Deal size, deliverables, follow-up dates...">${escHtml(activeThread.crm_notes || "")}</textarea>
                    <button class="btn btn-sm btn-primary" id="btn-save-crm-notes" data-thread="${escHtml(activeThread.id)}">Save CRM Notes</button>
                  </div>
                ` : ""}
              </div>
            </aside>
          ` : `
            <div style="grid-column:span 2;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px 28px;text-align:center;gap:14px;background:var(--bg-surface);">
              <span style="color:var(--ink-muted);">${icon("inbox", 32)}</span>
              <div style="font-weight:700;font-size:16.5px;">Unified Inbox is Empty</div>
              <p style="font-size:13.5px;color:var(--ink-muted);max-width:460px;line-height:1.55;">
                Once your Meta App Messenger webhook (<code class="mono">/api/webhooks/instagram</code>) is connected with <code class="mono">instagram_manage_messages</code>, every incoming Instagram DM, Story reply, and keyword conversation streams here with a live 24h window timer.
              </p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                <button type="button" class="btn btn-primary btn-sm" id="btn-sim-first-thread">${icon("bolt", 14)} Simulate First Incoming DM</button>
                <button type="button" class="btn btn-sm" data-open-meta-setup>Connect Meta OAuth</button>
              </div>
            </div>
          `}
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
  const hasPublished = published.length > 0;
  const views = Math.round(published.reduce((s, p) => s + (p.views || 0), 0) * mult);
  const reach = Math.round(published.reduce((s, p) => s + (p.reach || 0), 0) * mult);
  const saves = Math.round(published.reduce((s, p) => s + (p.saves || 0), 0) * mult);
  const saveRate = reach ? ((saves / reach) * 100).toFixed(2) : "0.00";
  const totalAutoDms = b.automations.reduce((s, a) => s + (a.dms_sent || 0), 0);
  const totalAutoTaps = b.automations.reduce((s, a) => s + (a.link_taps || 0), 0);
  const workflowCtr = totalAutoDms > 0 ? `${((totalAutoTaps / totalAutoDms) * 100).toFixed(1)}%` : "0.0%";
  const trialPosts = b.posts.filter((p) => p.is_trial_reel);

  const series = hasPublished ? [38, 52, 49, 68, 74, 63, 88, 95, 84, 108, 119, 134] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(1, ...series);
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

      ${renderUnconnectedBanner()}

      <div class="kpi-grid">
        <div class="card kpi-card"><div class="kpi-top"><span>Total Views (${range})</span>${icon("eye", 15)}</div><div class="kpi-val">${fmtNum(views)}</div><div class="kpi-foot">${hasPublished ? `<span class="badge badge-success">+21.6%</span> period over period` : `Awaiting published posts`}</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Unique Reach</span>${icon("users", 15)}</div><div class="kpi-val">${fmtNum(reach)}</div><div class="kpi-foot">${hasPublished ? `83% non-follower discovery` : `Connect instagram_manage_insights`}</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Total Bookmarks</span>${icon("bookmark", 15)}</div><div class="kpi-val">${fmtNum(saves)}</div><div class="kpi-foot">${saveRate}% save-to-reach ratio</div></div>
        <div class="card kpi-card"><div class="kpi-top"><span>Workflow Link CTR</span>${icon("bolt", 15)}</div><div class="kpi-val">${workflowCtr}</div><div class="kpi-foot">Direct Messenger CTA taps</div></div>
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
            ${published.length === 0 ? `
              <tr>
                <td colspan="7" style="text-align:center;padding:34px 20px;color:var(--ink-muted);">
                  No published posts recorded yet. Publish a post or connect <code class="mono">instagram_manage_insights</code> via Meta OAuth.
                </td>
              </tr>
            ` : published.map((p) => `
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
            ["meta", "Meta API & OAuth"],
            ["team", `Team (${b.teamMembers.length})`],
            ["billing", "Plan & Billing"],
            ["developer", `Developer & MCP (${mcpTools.length})`],
            ["backup", "Data Mode & Backup"]
          ].map(([id, label]) => `
            <button class="seg-btn ${tab === id ? "is-active" : ""}" data-settings-tab="${id}">${label}</button>
          `).join("")}
        </div>
      </div>

      ${renderUnconnectedBanner()}

      ${tab === "meta" ? `
        <div class="split-2">
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div class="card-title">Instagram Graph &amp; Messenger Connection</div>
              ${b.isPlatformConnected
                ? `<span class="badge badge-success"><span class="dot"></span>Connected (${escHtml(ws.ig_account_id)})</span>`
                : `<span class="badge badge-warning">Not Connected</span>`}
            </div>
            <p style="font-size:13px;color:var(--ink-secondary);line-height:1.55;">
              Configure these URLs inside <code class="mono">developers.facebook.com</code> <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg> Your Business App <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-1px;"><path d="M2.5 6h7M6.5 3l3 3-3 3"/></svg> Instagram API with Instagram Login:
            </p>
            <div class="field">
              <label class="field-label">OAuth Redirect URI</label>
              <input class="input mono" readonly value="${escHtml(location.origin)}/api/meta/oauth/callback" />
            </div>
            <div class="field">
              <label class="field-label">Webhook Callback URL (Comments &amp; DMs)</label>
              <input class="input mono" readonly value="${escHtml(location.origin)}/api/webhooks/instagram" />
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:6px;">
              <button type="button" class="btn btn-primary" data-open-meta-setup>
                ${b.isPlatformConnected ? "Update Connected Account" : "Connect Instagram Account"}
              </button>
              ${b.isPlatformConnected ? `
                <button type="button" class="btn btn-danger" id="btn-disconnect-meta">Disconnect Account</button>
              ` : ""}
            </div>
          </div>

          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Required Environment Variables (<code class="mono">.env</code>)</div>
            <pre class="mono" style="padding:14px;border-radius:10px;background:var(--bg-subtle);overflow-x:auto;font-size:12px;line-height:1.6;margin:0;">META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_WEBHOOK_VERIFY_TOKEN=velora_webhook_secret_2026
META_OAUTH_REDIRECT_URI=${escHtml(location.origin)}/api/meta/oauth/callback

# Required OAuth Scopes:
# - instagram_business_basic
# - instagram_business_content_publish
# - instagram_business_manage_comments
# - instagram_business_manage_messages
# - instagram_manage_insights</pre>
          </div>
        </div>
      ` : ""}

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
            <div class="card-title">Switch Workspace Dataset Mode</div>
            <p style="font-size:13px;color:var(--ink-secondary);line-height:1.55;">
              Switch instantly between full demo data (<strong>With Data</strong>) and clean fresh-install state with no connected account (<strong>Without Data</strong>).
            </p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="btn ${b.dataMode !== "empty" ? "btn-primary" : ""}" data-switch-mode="sample">Load Sample Data</button>
              <button type="button" class="btn ${b.dataMode === "empty" ? "btn-primary" : ""}" data-switch-mode="empty">Clean No-Data Mode</button>
            </div>
          </div>
          <div class="card card-pad" style="display:flex;flex-direction:column;gap:12px;">
            <div class="card-title">Export Workspace Snapshot &amp; Reset</div>
            <p style="font-size:13px;color:var(--ink-secondary);">Download all workspaces, scheduled posts, carousels, DM workflows, and CRM notes as portable JSON.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-primary" id="btn-export-json">${icon("download", 15)} Download JSON Backup</button>
              <button class="btn btn-danger" id="btn-reset-demo">${icon("refresh", 15)} Reset Demo Database</button>
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}
