import { store, notify, toast, apiRequest, updateBundle, resetAllDemoData, escapeHtml } from "./api.js";

let builderDraft = {
  step: 1,
  simTab: "comment",
  name: "Send links for open-source carousel",
  trigger_type: "comment",
  post_target: "specific_reel",
  target_post_id: "post_oct23_reel",
  keywords: ["REPO", "LINK"],
  public_reply_enabled: true,
  public_reply_variants: [
    "Just dropped all 7 links in your DMs! ✓",
    "Check your message requests — sent right over! ✦",
    "Sent! Tap the button inside your DMs ★"
  ],
  follow_gate_enabled: true,
  follow_gate_message: "Hit Follow on @maya.creates first so Meta lets me send links, then tap 'I followed ✓'!",
  opening_card_enabled: true,
  opening_card_text: "Ready for all 7 creator tools + setup notes?",
  opening_button_label: "Send me the link",
  dm_message: "Amazing! Here are your links — bookmarked by workflow:",
  buttons: [{ label: "Open 7-Tool Pack", url: "https://reeldrop.io/themes" }],
  followup_enabled: true,
  followup_delay: "2h",
  followup_message: "Hey! Did you get a chance to try tool #2 yet? Reply if you want part 2!",
  ai_prompt: "Friendly creator assistant sharing resources & booking brand slots"
};

let labSender = "test.creator";
let labText = "REPO";
let labIsFollower = false;
let lastSimResult = null;

let mcpCategoryFilter = "All";
let mcpSearch = "";
let mcpSelectedTool = "get_analytics_summary";
let mcpArgsText = '{"workspace_id": "ws_maya"}';
let mcpOutputText = "";

export function renderAutomationsListView() {
  const autos = store.data.automations;
  const totalDms = autos.reduce((s, a) => s + a.dms_sent, 0);
  const totalTaps = autos.reduce((s, a) => s + a.link_taps, 0);

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">OFFICIAL MESSENGER API · WEBHOOK TRIGGERS</span>
          <h1 class="editorial-title">Automations</h1>
        </div>
        <button class="btn btn-primary btn-lg" id="btn-new-automation">+ New automation</button>
      </div>

      <div class="grid-3" style="margin-bottom:20px">
        <div class="card"><span class="kicker">ACTIVE WORKFLOWS</span><div class="stat-big">${autos.filter((a) => a.status === "active").length}</div><span style="font-size:12px;color:var(--text-muted)">Plan limit: ${store.data.activeWorkspace.planSpec.limits.activeDmAutomations ?? "Unlimited"}</span></div>
        <div class="card"><span class="kicker">AUTO-DMS DELIVERED</span><div class="stat-big" style="color:var(--accent)">${totalDms.toLocaleString()}</div><span style="font-size:12px;color:var(--text-muted)">Zero bots · Official Meta webhooks</span></div>
        <div class="card"><span class="kicker">AVERAGE LINK TAP RATE</span><div class="stat-big">${totalDms ? ((totalTaps / totalDms) * 100).toFixed(1) : 0}%</div><span style="font-size:12px;color:var(--text-muted)">${totalTaps.toLocaleString()} verified button taps</span></div>
      </div>

      <div class="card" style="margin-bottom:20px;background:var(--bg-subtle)">
        <div class="kicker" style="margin-bottom:8px">⚡ INTERACTIVE WEBHOOK &amp; FOLLOW-GATE TEST BENCH</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;align-items:end">
          <div class="field" style="margin:0"><label>Simulated Handle</label><input class="input" id="lab-handle" value="${escapeHtml(labSender)}" /></div>
          <div class="field" style="margin:0"><label>Incoming Comment / DM</label><input class="input" id="lab-text" value="${escapeHtml(labText)}" /></div>
          <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg-surface);border-radius:10px;border:1px solid var(--border);font-weight:700;cursor:pointer">
            <input type="checkbox" id="lab-follower" ${labIsFollower ? "checked" : ""} />
            Follows @${escapeHtml(store.data.activeWorkspace.ig_handle)}
          </label>
          <div style="font-size:12px;color:var(--text-muted)">Toggle <em>Follows</em> ON/OFF then click <strong>Dry Run</strong> or <strong>Test Live Trigger</strong> on any workflow below!</div>
        </div>
      </div>

      ${lastSimResult ? `
        <div class="card" style="margin-bottom:20px;border:2px solid var(--accent);background:var(--accent-soft)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:8px">
            <strong>⚡ ${lastSimResult.dryRun ? "Dry-Run Preview" : "Live Webhook Execution"} — "${escapeHtml(lastSimResult.automationName)}" (${escapeHtml(lastSimResult.planApplied)} Plan · Follower=${String(lastSimResult.followerVerified)})</strong>
            ${!lastSimResult.dryRun ? `<button class="btn btn-sm btn-primary" data-goto-app="inbox">View Live Thread in DM Inbox &rarr;</button>` : ""}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;font-size:12.5px">
            ${lastSimResult.steps.map((s) => `
              <div style="background:var(--bg-surface);padding:8px 12px;border-radius:10px">
                <strong class="mono">[${escapeHtml(s.type)}]</strong> ${escapeHtml(s.text)}
                ${s.buttons?.length ? ` &rarr; Buttons: <code>${s.buttons.map((b) => b.label).join(" | ")}</code>` : ""}
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <div style="display:flex;flex-direction:column;gap:14px">
        ${autos.map((a) => `
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="max-width:540px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <span class="pill-badge">${a.status.toUpperCase()} · ${a.trigger_type.replace("_", " ")}</span>
                <span class="mono" style="font-size:11px;color:var(--text-muted)">Keywords: ${a.keywords.map((k) => `"${k}"`).join(", ")}</span>
              </div>
              <h3 style="margin:0 0 6px;font-size:17px">${escapeHtml(a.name)}</h3>
              <p style="margin:0;font-size:12.5px;color:var(--text-muted)">
                ${a.follow_gate_enabled ? "✓ Ask for follow · " : ""}
                ${a.public_reply_enabled ? `✓ ${a.public_reply_variants.length} rotating public replies · ` : ""}
                ${a.followup_enabled ? `✓ +${a.followup_delay} follow-up · ` : ""}
                <strong>${a.dms_sent.toLocaleString()} DMs</strong> (${a.link_taps.toLocaleString()} taps)
              </p>
            </div>
            <div style="display:flex;gap:7px;flex-wrap:wrap">
              <button class="btn btn-sm" data-dry-auto="${a.id}" data-sim-kw="${escapeHtml(a.keywords[0] || "LINK")}">Dry Run</button>
              <button class="btn btn-sm btn-accent" data-sim-auto="${a.id}" data-sim-kw="${escapeHtml(a.keywords[0] || "LINK")}">▶ Test Live Trigger</button>
              <button class="btn btn-sm" data-retrigger-auto="${a.id}">↻ Retrigger Comments</button>
              <button class="btn btn-sm" data-toggle-auto="${a.id}">${a.status === "active" ? "Pause" : "Resume"}</button>
              <button class="btn btn-sm btn-danger" data-del-auto="${a.id}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderAutomationBuilderView() {
  const ws = store.data.activeWorkspace;
  const d = builderDraft;
  const targetPost = store.data.posts.find((p) => p.id === d.target_post_id) || store.data.posts[0];
  const watermark = ws.planSpec.limits.removeBrandingFooter ? "" : "\n\nSent via reeldrop.io";

  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding-bottom:16px;margin-bottom:22px;border-bottom:1px solid var(--border)">
        <div>
          <h2 style="margin:0;font-size:20px">New automation</h2>
          <div style="font-size:12px;color:var(--text-muted)">@${escapeHtml(ws.ig_handle)} · ${escapeHtml(ws.planSpec.name)} Plan</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          ${[[1, "Trigger"], [2, "Actions"], [3, "Follow-up"]].map(([num, label]) => `<button class="btn btn-sm ${d.step === num ? "btn-accent" : ""}" data-bstep="${num}">${num}. ${label}</button>`).join("")}
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1.4fr) minmax(300px,0.9fr);gap:28px;align-items:start">
        <div class="card">
          ${d.step === 1 ? `
            <div class="field"><label>AUTOMATION NAME *</label><input class="input" id="b-name" value="${escapeHtml(d.name)}" /></div>
            <div class="field">
              <label>TRIGGER TYPE</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${[["comment", "Comment on post/reel"], ["dm", "Incoming DM"], ["story_reply", "Story reply"], ["ai_reply", "DM reply by AI"]].map(([val, label]) => `<button type="button" class="btn btn-sm ${d.trigger_type === val ? "btn-accent" : ""}" data-btrig="${val}">${label}</button>`).join("")}
              </div>
            </div>
            <div class="field">
              <label>POST TARGET</label>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
                ${[["specific_reel", "Specific reel"], ["specific_post", "Specific post"], ["all_posts", "All reels & posts"]].map(([val, label]) => `<button type="button" class="btn btn-sm ${d.post_target === val ? "btn-accent" : ""}" data-btarget="${val}">${label}</button>`).join("")}
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
                ${store.data.posts.slice(0, 4).map((p) => `
                  <div class="cover-art cover-${p.cover_style}" data-bpost="${p.id}" style="aspect-ratio:1/1;border-radius:10px;padding:10px;cursor:pointer;outline:${p.id === d.target_post_id ? "3px solid var(--accent)" : "none"}">
                    ${p.id === d.target_post_id ? `<span style="position:absolute;top:6px;right:6px;background:var(--accent);color:#FFF;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font-size:11px">✓</span>` : ""}
                    <span style="font-size:11px;line-height:1.2">${escapeHtml(p.title.slice(0, 34))}</span>
                  </div>
                `).join("")}
              </div>
            </div>
            <div class="field">
              <label>KEYWORDS (CASE-INSENSITIVE)</label>
              <div style="display:flex;gap:8px;margin-bottom:8px">
                <input class="input" id="b-kw-input" placeholder="e.g. LINK, GUIDE, REPO" />
                <button type="button" class="btn btn-primary" id="b-kw-add">Add</button>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                ${d.keywords.map((k, idx) => `<span class="pill-badge">${escapeHtml(k)} <b style="cursor:pointer" data-rm-kw="${idx}">×</b></span>`).join("")}
              </div>
            </div>
            <div style="padding:14px;border-radius:14px;background:var(--bg-subtle)">
              <label style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700">
                <span>Public reply under triggering comment (rotates randomly)</span>
                <input type="checkbox" id="b-pub-toggle" ${d.public_reply_enabled ? "checked" : ""} />
              </label>
              ${d.public_reply_enabled ? `<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">${d.public_reply_variants.map((v, vi) => `<input class="input" data-bvar="${vi}" value="${escapeHtml(v)}" />`).join("")}</div>` : ""}
            </div>
          ` : d.step === 2 ? `
            <div style="padding:14px;border-radius:14px;background:var(--bg-subtle);margin-bottom:14px">
              <label style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700">
                <span>Ask for follow first (verifies follower status via Official Graph API)</span>
                <input type="checkbox" id="b-fg-toggle" ${d.follow_gate_enabled ? "checked" : ""} />
              </label>
              ${d.follow_gate_enabled ? `<input class="input" id="b-fg-msg" style="margin-top:8px" value="${escapeHtml(d.follow_gate_message)}" />` : ""}
            </div>
            <div class="field"><label>PRIMARY DM MESSAGE *</label><textarea class="textarea" id="b-dm-msg" rows="3">${escapeHtml(d.dm_message)}</textarea></div>
            <div class="field">
              <label>HTTPS LINK BUTTONS (MAX 3 · LABEL &le;20 CHARS)</label>
              ${d.buttons.map((btn, bi) => `
                <div style="display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;margin-bottom:8px">
                  <input class="input" maxlength="20" data-blabel="${bi}" value="${escapeHtml(btn.label)}" placeholder="Button label" />
                  <input class="input" data-burl="${bi}" value="${escapeHtml(btn.url)}" placeholder="https://…" />
                  <button type="button" class="btn btn-sm btn-danger" data-rm-btn="${bi}">✕</button>
                </div>
              `).join("")}
              ${d.buttons.length < 3 ? `<button type="button" class="btn btn-sm" id="b-add-btn">+ Add Link Button</button>` : ""}
            </div>
          ` : `
            <div style="padding:16px;border-radius:14px;background:var(--bg-subtle);margin-bottom:16px">
              <label style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700">
                <span>Send timed follow-up DM if user hasn't replied</span>
                <input type="checkbox" id="b-fu-toggle" ${d.followup_enabled ? "checked" : ""} />
              </label>
              ${d.followup_enabled ? `
                <div class="field" style="margin-top:12px">
                  <label>Delay Window</label>
                  <select class="select" id="b-fu-delay">${["30m", "1h", "2h", "6h", "24h"].map((dl) => `<option value="${dl}" ${d.followup_delay === dl ? "selected" : ""}>After ${dl}</option>`).join("")}</select>
                </div>
                <div class="field"><label>Follow-up Message Copy</label><textarea class="textarea" id="b-fu-msg">${escapeHtml(d.followup_message)}</textarea></div>
              ` : ""}
            </div>
          `}

          <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
            <button class="btn" id="b-cancel">Cancel</button>
            <div style="display:flex;gap:8px">
              ${d.step > 1 ? `<button class="btn" id="b-prev">&larr; Back</button>` : ""}
              ${d.step < 3 ? `<button class="btn btn-primary" id="b-next">Next &rarr;</button>` : `<button class="btn btn-accent btn-lg" id="b-publish-auto">✓ Publish Active Automation</button>`}
            </div>
          </div>
        </div>

        <div style="text-align:center">
          <div class="kicker" style="margin-bottom:10px">◉ LIVE PREVIEW</div>
          <div class="iphone-frame">
            <div class="iphone-notch"></div>
            <div class="iphone-screen">
              ${d.simTab === "post" ? `
                <div class="cover-art cover-${targetPost?.cover_style || "terracotta"}" style="flex:1;text-align:left;justify-content:space-between">
                  <div style="font-size:12px">@${escapeHtml(ws.ig_handle)}</div>
                  <div style="font-family:'Fraunces',Georgia,serif;font-size:20px">${escapeHtml(targetPost?.title || "Selected Reel")}</div>
                  <div style="font-size:11.5px;opacity:0.9">Comment <strong>${escapeHtml(d.keywords[0] || "LINK")}</strong> below for the link ↓</div>
                </div>
              ` : d.simTab === "comment" ? `
                <div style="padding:16px;text-align:left;display:flex;flex-direction:column;gap:12px">
                  <div style="font-size:12px;font-weight:700;text-align:center;padding-bottom:8px;border-bottom:1px solid #27272D">Comments</div>
                  <div style="font-size:12.5px"><strong>@jordan.films</strong> <span style="color:#E4E4E7">${escapeHtml(d.keywords[0] || "LINK")} ✓</span></div>
                  ${d.public_reply_enabled ? `<div style="margin-left:20px;padding-left:10px;border-left:2px solid #D94826;font-size:12.5px"><strong>@${escapeHtml(ws.ig_handle)}</strong><div style="color:#E4E4E7;margin-top:2px">${escapeHtml(d.public_reply_variants[0] || "Sent to your DMs!")}</div></div>` : ""}
                </div>
              ` : `
                <div style="padding:14px;text-align:left;display:flex;flex-direction:column;gap:8px;font-size:12px">
                  <div style="font-weight:700;text-align:center;padding-bottom:8px;border-bottom:1px solid #27272D">@${escapeHtml(ws.ig_handle)} · Official API</div>
                  ${d.follow_gate_enabled ? `<div style="background:#26262E;padding:9px 11px;border-radius:14px">${escapeHtml(d.follow_gate_message)}<div style="margin-top:6px;background:#FAFAFA;color:#111;padding:5px;border-radius:7px;text-align:center;font-weight:700">I followed ✓</div></div>` : ""}
                  <div style="background:#D94826;color:#FFF;padding:10px 12px;border-radius:14px;white-space:pre-line">${escapeHtml(d.dm_message + watermark)}</div>
                  ${d.buttons.map((b) => `<div style="background:#FAFAFA;color:#111;padding:7px;border-radius:9px;text-align:center;font-weight:700">${escapeHtml(b.label)} ↗</div>`).join("")}
                </div>
              `}
            </div>
          </div>
          <div class="mode-switch" style="margin-top:14px">
            <button data-simtab="post" class="${d.simTab === "post" ? "active" : ""}">Post</button>
            <button data-simtab="comment" class="${d.simTab === "comment" ? "active" : ""}">Comment</button>
            <button data-simtab="dm" class="${d.simTab === "dm" ? "active" : ""}">DM</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCommentsModerationView() {
  const comments = store.data.comments || [];
  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">COMMENT WEBHOOK STREAM · MODERATION &amp; MANUAL DM TRIGGER</span>
          <h1 class="editorial-title">Comments</h1>
        </div>
        <span class="pill-badge">${comments.length} Visible Comments</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        ${comments.map((c) => `
          <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="max-width:620px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
                <strong>@${escapeHtml(c.author_handle)}</strong>
                <span class="mono" style="font-size:11px;color:var(--text-muted)">on "${escapeHtml(c.post_title)}"</span>
                ${c.matched_keyword ? `<span class="pill-badge">Keyword: ${escapeHtml(c.matched_keyword)}</span>` : ""}
                ${c.dm_sent ? `<span class="mono" style="font-size:10.5px;color:#15803D;font-weight:700">✓ DM Sent</span>` : ""}
              </div>
              <div style="font-size:14px;margin:4px 0">${escapeHtml(c.body)}</div>
              ${c.public_reply ? `<div style="margin-top:6px;padding-left:10px;border-left:2px solid var(--accent);font-size:12.5px;color:var(--text-muted)">Author Reply: ${escapeHtml(c.public_reply)}</div>` : ""}
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${!c.dm_sent ? `<button class="btn btn-sm btn-accent" data-com-dm="${c.id}">⚡ Send Auto-DM + Reply</button>` : ""}
              <button class="btn btn-sm" data-com-reply="${c.id}">Public Reply</button>
              <button class="btn btn-sm btn-danger" data-com-hide="${c.id}">Hide Spam</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderInboxView() {
  const ws = store.data.activeWorkspace;
  const threads = store.data.threads.filter((t) => {
    if (store.inboxChip === "archived") return Boolean(t.is_archived);
    if (t.is_archived) return false;
    if (store.inboxFilter === "open" && !t.is_open) return false;
    if (store.inboxFilter === "closed" && t.is_open) return false;
    if (store.inboxChip === "unread" && t.unread_count === 0) return false;
    if (store.inboxChip === "hot" && !t.is_hot_lead) return false;
    if (store.inboxChip === "outreach" && !t.is_outreach) return false;
    if (store.inboxChip === "snoozed" && !t.snoozed_until) return false;
    if (store.inboxSearch && !`${t.participant_handle} ${t.participant_name} ${t.last_message_preview}`.toLowerCase().includes(store.inboxSearch.toLowerCase())) return false;
    return true;
  });

  const active = threads.find((t) => t.id === store.selectedThreadId) || threads[0];

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">META MESSENGER API · 24-HOUR WINDOW ENFORCED</span>
          <h1 class="editorial-title">DM Inbox</h1>
        </div>
        ${!ws.planSpec.limits.inboxReply ? `<span class="pill-badge">Starter Plan: Read-Only Inbox (Switch plan above to unlock live replies)</span>` : ""}
      </div>

      <div style="display:grid;grid-template-columns:minmax(270px,340px) minmax(0,1fr);gap:18px;align-items:start">
        <div class="card" style="padding:14px;display:flex;flex-direction:column;gap:10px">
          <div style="display:flex;gap:8px">
            <select class="select" id="inbox-status-sel">
              <option value="open" ${store.inboxFilter === "open" ? "selected" : ""}>Open chats</option>
              <option value="closed" ${store.inboxFilter === "closed" ? "selected" : ""}>Closed chats</option>
              <option value="all" ${store.inboxFilter === "all" ? "selected" : ""}>All chats</option>
            </select>
            <input class="input" id="inbox-search" placeholder="Search…" value="${escapeHtml(store.inboxSearch)}" />
          </div>

          <div style="display:flex;gap:5px;flex-wrap:wrap">
            ${[["all", "All"], ["unread", "Unread"], ["hot", "★ Hot lead"], ["outreach", "Outreach"], ["snoozed", "Snoozed"], ["archived", "Archived"]].map(([k, label]) => `<button class="btn btn-sm ${store.inboxChip === k ? "btn-accent" : ""}" style="padding:4px 9px;font-size:11px" data-inbox-chip="${k}">${label}</button>`).join("")}
          </div>

          <div style="display:flex;flex-direction:column;gap:6px;max-height:460px;overflow-y:auto">
            ${threads.map((t) => `
              <div style="padding:10px 12px;border-radius:12px;cursor:pointer;background:${t.id === active?.id ? "var(--accent-soft)" : "var(--bg-subtle)"};border:1px solid ${t.id === active?.id ? "var(--accent)" : "transparent"}" data-pick-thread="${t.id}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <strong style="font-size:13px">${t.is_pinned ? "★ " : ""}${t.is_hot_lead ? "♦ " : ""}@${escapeHtml(t.participant_handle)}</strong>
                  ${t.unread_count ? `<span style="background:var(--accent);color:#FFF;border-radius:99px;padding:1px 7px;font-size:10px;font-weight:800">${t.unread_count}</span>` : ""}
                </div>
                <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px">${escapeHtml(t.last_message_preview)}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;gap:14px">
          ${active ? `
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding-bottom:12px;border-bottom:1px solid var(--border)">
                <div>
                  <strong style="font-size:16px">${escapeHtml(active.participant_name)} (@${escapeHtml(active.participant_handle)})</strong>
                  <span class="mono" style="margin-left:8px;font-size:11px;color:${active.windowOpen ? "#15803D" : "#DC2626"}">
                    ${active.windowOpen ? `● 24h Window Open (${active.windowHoursRemaining}h left)` : "● 24h Meta Window Expired"}
                  </span>
                  <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px">
                    ${active.tags.map((tg) => `<span class="pill-badge" style="font-size:10.5px;padding:2px 8px">${escapeHtml(tg)}</span>`).join("")}
                    <button class="btn btn-sm" style="padding:2px 8px;font-size:10.5px" id="btn-add-tag">+ Add tag (${active.tags.length}/8)</button>
                  </div>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-sm" id="btn-toggle-hot">${active.is_hot_lead ? "★ Unmark Hot" : "★ Hot Lead"}</button>
                  <button class="btn btn-sm" id="btn-toggle-pin">${active.is_pinned ? "Unpin" : "Pin"}</button>
                  <button class="btn btn-sm" id="btn-toggle-snooze">${active.snoozed_until ? "Unsnooze" : "Snooze 24h"}</button>
                  <button class="btn btn-sm" id="btn-toggle-archive">${active.is_archived ? "Unarchive" : "Archive"}</button>
                  <button class="btn btn-sm" id="btn-toggle-close">${active.is_open ? "✓ Close Chat" : "Reopen Chat"}</button>
                </div>
              </div>

              <div id="inbox-messages-scroll" style="display:flex;flex-direction:column;gap:12px;padding:18px 6px 24px;max-height:460px;overflow-y:auto">
                ${active.messages.map((m) => `
                  <div style="flex-shrink:0;align-self:${m.sender === "me" ? "flex-end" : "flex-start"};max-width:76%;padding:12px 15px;border-radius:16px;background:${m.sender === "me" ? "var(--accent)" : "var(--bg-subtle)"};color:${m.sender === "me" ? "#FFF" : "var(--text-main)"}">
                    ${m.shared_reel_title ? `<div class="mono" style="font-size:10px;opacity:0.8;margin-bottom:4px">Replied to Reel: ${escapeHtml(m.shared_reel_title)}</div>` : ""}
                    ${m.via_automation ? `<div class="mono" style="font-size:10px;opacity:0.88;margin-bottom:4px">⚡ Auto-DM: ${escapeHtml(m.via_automation)}</div>` : ""}
                    <div style="white-space:pre-line;font-size:13px">${escapeHtml(m.body)}</div>
                    ${m.buttons?.length ? `<div style="margin-top:9px;display:flex;gap:6px;flex-wrap:wrap">${m.buttons.map((b) => `<span style="background:#FFF;color:#111;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700">${escapeHtml(b.label)} ↗</span>`).join("")}</div>` : ""}
                  </div>
                `).join("")}
              </div>
            </div>

            <form id="inbox-reply-form" style="border-top:1px solid var(--border);padding-top:12px">
              ${!active.windowOpen ? `
                <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-subtle);padding:10px 12px;border-radius:10px;margin-bottom:10px;font-size:12.5px;gap:8px;flex-wrap:wrap">
                  <span>Instagram blocks outbound DMs &gt;24h after the user's last reply.</span>
                  <button type="button" class="btn btn-sm btn-accent" id="btn-sim-incoming">Simulate User Reply (Reopen 24h Window)</button>
                </div>
              ` : ""}
              <div style="display:flex;gap:8px">
                <input class="input" id="inbox-reply-input" maxlength="1000" placeholder="Write a reply (max 1,000 chars)…" />
                <button type="button" class="btn" id="btn-inbox-ai">✦ AI Draft</button>
                <button type="submit" class="btn btn-primary">Send Reply</button>
              </div>
            </form>
          ` : `<div style="padding:20px;color:var(--text-muted)">No conversations match current filter.</div>`}
        </div>
      </div>
    </div>
  `;
}

export function renderAnalyticsView() {
  const pub = store.data.posts.filter((p) => p.status === "PUBLISHED");
  const mult = store.analyticsRange === "7d" ? 0.32 : store.analyticsRange === "90d" ? 2.6 : 1;
  const views = Math.round(pub.reduce((s, p) => s + p.views, 0) * mult);
  const reach = Math.round(pub.reduce((s, p) => s + p.reach, 0) * mult);
  const saves = Math.round(pub.reduce((s, p) => s + p.saves, 0) * mult);
  const trials = store.data.posts.filter((p) => p.is_trial_reel);

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">OFFICIAL GRAPH INSIGHTS · TRIAL REELS SURGE</span>
          <h1 class="editorial-title">Analytics</h1>
        </div>
        <div class="mode-switch">
          ${["7d", "30d", "90d"].map((r) => `<button data-ana-range="${r}" class="${store.analyticsRange === r ? "active" : ""}">${r}</button>`).join("")}
        </div>
      </div>

      <div class="grid-4" style="margin-bottom:24px">
        <div class="card"><span class="kicker">${store.analyticsRange.toUpperCase()} VIEWS</span><div class="stat-big">${views.toLocaleString()}</div><span style="color:#15803D;font-size:12px;font-weight:700">+38.4% vs prior window</span></div>
        <div class="card"><span class="kicker">UNIQUE ACCOUNTS REACHED</span><div class="stat-big">${reach.toLocaleString()}</div><span style="font-size:12px;color:var(--text-muted)">64% non-followers</span></div>
        <div class="card"><span class="kicker">BOOKMARK SAVES</span><div class="stat-big" style="color:var(--accent)">${saves.toLocaleString()}</div><span style="font-size:12px;color:var(--text-muted)">${reach ? ((saves / reach) * 100).toFixed(2) : 0}% save-to-reach</span></div>
        <div class="card"><span class="kicker">TRIAL REELS GRADUATED</span><div class="stat-big">${trials.filter((t) => t.trial_graduated).length}/${trials.length}</div><span style="font-size:12px;color:var(--text-muted)">Cold audience A/B wins</span></div>
      </div>

      <div class="card" style="margin-bottom:22px">
        <span class="kicker">DAILY REACH TRAJECTORY</span>
        <svg viewBox="0 0 700 170" style="width:100%;height:170px;margin-top:12px">
          <polyline fill="none" stroke="#D94826" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" points="20,140 130,126 240,92 350,104 460,64 570,28 680,40" />
          ${[[20,140,"8.4K"],[130,126,"9.1K"],[240,92,"14.8K"],[350,104,"12.9K"],[460,64,"19.4K"],[570,28,"24.6K"],[680,40,"22.1K"]].map(([x,y,lbl]) => `<circle cx="${x}" cy="${y}" r="5" fill="#D94826" /><text x="${x}" y="${y - 11}" text-anchor="middle" fill="currentColor" font-size="11" font-family="monospace">${lbl}</text>`).join("")}
        </svg>
      </div>

      <div class="card" style="overflow-x:auto">
        <span class="kicker">PUBLISHED POST &amp; TRIAL REEL LEADERBOARD</span>
        <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px">
          <thead><tr style="border-bottom:2px solid var(--border);text-align:left"><th style="padding:8px">Post</th><th style="padding:8px">Format</th><th style="padding:8px">Views</th><th style="padding:8px">Reach</th><th style="padding:8px">Saves</th><th style="padding:8px">Action / Watch Time</th></tr></thead>
          <tbody>
            ${pub.map((p) => `
              <tr style="border-bottom:1px solid var(--border)">
                <td style="padding:9px;font-weight:700">${escapeHtml(p.title)} ${p.trial_graduated ? `<span class="pill-badge" style="font-size:10px">Graduated Trial</span>` : ""}</td>
                <td style="padding:9px" class="mono">${p.media_type}</td>
                <td style="padding:9px">${p.views.toLocaleString()}</td>
                <td style="padding:9px">${p.reach.toLocaleString()}</td>
                <td style="padding:9px;font-weight:700;color:var(--accent)">${p.saves.toLocaleString()}</td>
                <td style="padding:9px">${p.is_trial_reel && !p.trial_graduated ? `<button class="btn btn-sm btn-accent" data-ana-grad="${p.id}">↗ Graduate Trial</button>` : (p.avg_watch_sec ? `${p.avg_watch_sec}s avg watch` : "Carousel Deck")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function renderSettingsAndBillingView() {
  const ws = store.data.activeWorkspace;
  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">WORKSPACE SETTINGS · BILLING · QA RESET</span>
          <h1 class="editorial-title">Billing &amp; Settings</h1>
        </div>
        <button class="btn btn-accent" id="btn-reset-seed">↻ Reset All 4 Workspaces to Clean Test Data</button>
      </div>

      <div class="grid-3" style="margin-bottom:22px">
        <div class="card">
          <span class="kicker">ACTIVE WORKSPACE &amp; TIER</span>
          <h3 style="margin:8px 0 4px">@${escapeHtml(ws.ig_handle)} — ${escapeHtml(ws.planSpec.name)}</h3>
          <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 12px">${escapeHtml(ws.planSpec.description)}</p>
          <select class="select" id="settings-plan-sel">
            ${["starter", "influencer", "creator", "lifetime"].map((p) => `<option value="${p}" ${ws.plan === p ? "selected" : ""}>Switch to ${store.data.plansConfig.plans[p].name}</option>`).join("")}
          </select>
        </div>

        <div class="card">
          <span class="kicker">MONTHLY USAGE QUOTAS</span>
          <div style="margin-top:10px;display:flex;flex-direction:column;gap:7px;font-size:13px">
            <div>AI Captions: <strong>${ws.planSpec.limits.aiCaptionGenerationsPerMonth === null ? `${ws.ai_captions_used} / Unlimited` : `${ws.ai_captions_used} / ${ws.planSpec.limits.aiCaptionGenerationsPerMonth}`}</strong></div>
            <div>Trial Reels: <strong>${ws.planSpec.limits.trialReelsPerMonth === null ? `${ws.trial_reels_used} / Unlimited` : `${ws.trial_reels_used} / ${ws.planSpec.limits.trialReelsPerMonth}`}</strong></div>
            <div>Carousel Images: <strong>${ws.ai_carousel_images_used} / ${ws.planSpec.limits.aiCarouselImagesPerMonth || "Draft Mode"}</strong></div>
            <div>AI DM Replies: <strong>${ws.ai_dm_replies_used} / ${ws.planSpec.limits.aiDmRepliesPerMonth || "Creator Only"}</strong></div>
          </div>
        </div>

        <div class="card">
          <span class="kicker">POSTING SCHEDULE &amp; TIMEZONE</span>
          <form id="settings-tz-form" style="margin-top:10px">
            <div class="field"><label>Timezone</label><input class="input" name="timezone" value="${escapeHtml(ws.timezone)}" /></div>
            <div class="field"><label>Daily Slots (comma-separated)</label><input class="input" name="slots" value="${escapeHtml(ws.posting_slots.join(", "))}" /></div>
            <button class="btn btn-primary btn-sm" type="submit">Save Schedule Settings</button>
          </form>
        </div>
      </div>

      <div class="card">
        <span class="kicker">PRE-SEEDED MULTI-ACCOUNT QA GUIDE</span>
        <p style="color:var(--text-muted);font-size:13px;margin:8px 0 0">
          Switch accounts anytime in the top-left dropdown to test different real-world states:<br/>
          • <strong>@maya.creates (Creator)</strong>: 17 posts across Sept/Oct/Nov, 6 automations (Comment, Story, DM Ice Breaker, AI Reply), 7 Inbox states (Hot Lead, Snoozed, Archived, Expired &gt;24h Window), 4 Carousels.<br/>
          • <strong>@piyush.builds (Starter $0 Quota Test)</strong>: Pre-set at <code>2/3</code> AI captions, <code>2/3</code> Trial Reels, and <code>4/5</code> active automations — test hitting exact Starter limits in 1 click!<br/>
          • <strong>@arjun.fitness (Influencer $9.99)</strong> &amp; <strong>@studio.koko (Founding Lifetime $249)</strong>: Coaching &amp; E-commerce Story restock funnels.
        </p>
      </div>
    </div>
  `;
}

export function renderMcpConsoleView() {
  const categories = ["All", ...new Set(store.data.mcpTools.map((t) => t.category))];
  const visibleTools = store.data.mcpTools.filter((t) => {
    if (mcpCategoryFilter !== "All" && t.category !== mcpCategoryFilter) return false;
    if (mcpSearch && !`${t.name} ${t.description}`.toLowerCase().includes(mcpSearch.toLowerCase())) return false;
    return true;
  });

  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">STREAMABLE HTTP JSON-RPC 2.0 · ALL ${store.data.mcpTools.length} TOOLS ACTIVE</span>
          <h1 class="editorial-title">Claude &amp; AI MCP Server</h1>
        </div>
        <span class="pill-badge">Endpoint Live: POST ${escapeHtml(location.origin)}/mcp (${store.data.mcpTools.length} Tools)</span>
      </div>

      <div class="card" style="margin-bottom:20px;background:#111114;color:#FAFAFA">
        <div class="kicker" style="color:#A7F3D0">ONE-LINE CLAUDE / CURSOR CONNECTION COMMAND (WORKS ON VERCEL URL TOO!)</div>
        <pre style="margin:8px 0 0;font-size:13px;overflow-x:auto;color:#F4F4F5">claude mcp add --transport http reeldrop ${escapeHtml(location.origin)}/mcp</pre>
      </div>

      <div style="display:grid;grid-template-columns:minmax(290px,1.05fr) minmax(0,1.35fr);gap:20px;align-items:start">
        <div class="card">
          <div class="kicker" style="margin-bottom:8px">ALL ${store.data.mcpTools.length} REELDROP MCP TOOLS</div>
          <input class="input" id="mcp-search" placeholder="Filter 58 tools…" value="${escapeHtml(mcpSearch)}" style="margin-bottom:8px" />
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px">
            ${categories.map((c) => `<button class="btn btn-sm ${mcpCategoryFilter === c ? "btn-accent" : ""}" style="padding:3px 8px;font-size:10.5px" data-mcp-cat="${c}">${escapeHtml(c)}</button>`).join("")}
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:440px;overflow-y:auto">
            ${visibleTools.map((t) => `<button class="side-nav-btn ${mcpSelectedTool === t.name ? "active" : ""}" data-mcp-tool="${t.name}"><span class="mono" style="font-size:11.5px">${t.name}</span><span style="font-size:10px;opacity:0.7">${escapeHtml(t.category.split(" ")[0])}</span></button>`).join("")}
          </div>
        </div>

        <div class="card">
          <span class="kicker">LIVE JSON-RPC 2.0 MCP EXECUTOR</span>
          <h3 style="margin:6px 0 12px" class="mono">${escapeHtml(mcpSelectedTool)}</h3>
          <div class="field"><label>JSON Arguments Payload</label><textarea class="textarea mono" id="mcp-args" rows="5">${escapeHtml(mcpArgsText)}</textarea></div>
          <button class="btn btn-primary" id="btn-run-mcp">▶ Execute MCP Tool via POST /mcp &rarr;</button>
          <pre style="margin-top:14px;background:#111114;color:#A7F3D0;padding:14px;border-radius:12px;font-size:12px;max-height:320px;overflow:auto">${escapeHtml(mcpOutputText || "// Click 'Execute MCP Tool' to send a real JSON-RPC 2.0 request to /mcp!")}</pre>
        </div>
      </div>
    </div>
  `;
}

export function renderReaEvidenceView() {
  const rea = store.data.reaEvidence || { ready: true, artifacts: [] };
  return `
    <div>
      <div class="page-head">
        <div>
          <span class="kicker">MORLUTO/REA V6.7.0 · SHA-256 VERIFIED REVERSE ENGINEERING</span>
          <h1 class="editorial-title">REA Evidence &amp; Obligation Ledger</h1>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-accent" id="btn-rerun-rea">↻ Verify REA Evidence Bundle</button>
          <a class="btn btn-primary" href="/rea-evidence/obligation-ledger.html" target="_blank">Open Full Obligation Ledger HTML ↗</a>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom:22px">
        <div class="card"><span class="kicker">REA ENGINE VERSION</span><div class="stat-big" style="font-size:30px">${escapeHtml(rea.reaVersion || "6.7.0")}</div><span style="font-size:12px;color:var(--text-muted)">212 RE tools · SHA-256 sealed</span></div>
        <div class="card"><span class="kicker">VERIFIED EVIDENCE BUNDLES</span><div class="stat-big" style="color:var(--accent);font-size:30px">${rea.artifacts?.length || 0}</div><span style="font-size:12px;color:var(--text-muted)">HAR + SQLite + JS App + Trace + Ledger</span></div>
        <div class="card"><span class="kicker">RECONSTRUCTED MODULES</span><div class="stat-big" style="font-size:30px">100%</div><span style="font-size:12px;color:var(--text-muted)">Site + 20 Tools + 35 Themes + 58 MCP</span></div>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        ${(rea.artifacts || []).map((a) => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:6px">
              <strong><code>rea ${escapeHtml(a.command)}</code></strong>
              <span class="pill-badge mono">${escapeHtml(a.evidenceId || "verified")}</span>
            </div>
            <div class="mono" style="font-size:11.5px;color:var(--text-muted);margin-bottom:6px">SHA-256: ${escapeHtml(a.sha256 || "n/a")} · File: rea-evidence/${escapeHtml(a.file)}</div>
            <div style="font-size:13px">${escapeHtml(a.summary || "")}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function bindAutomationAndInboxEvents(root) {
  const newAutoBtn = root.querySelector("#btn-new-automation");
  if (newAutoBtn) newAutoBtn.onclick = () => { store.appPage = "automation-builder"; notify(); };

  const lh = root.querySelector("#lab-handle");
  const lt = root.querySelector("#lab-text");
  const lf = root.querySelector("#lab-follower");
  if (lh) lh.oninput = () => { labSender = lh.value; };
  if (lt) lt.oninput = () => { labText = lt.value; };
  if (lf) lf.onchange = () => { labIsFollower = lf.checked; };

  const fireSim = async (automationId, fallbackKw, dryRun) => {
    try {
      const res = await apiRequest("/api/automations/simulate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, automationId, senderHandle: labSender || "test.creator", senderName: `@${labSender || "test.creator"}`, incomingText: labText || fallbackKw || "LINK", isFollower: labIsFollower, dryRun })
      });
      lastSimResult = res.simulation;
      updateBundle(res.bundle);
      toast(dryRun ? "Dry-run preview evaluated cleanly!" : "Fired live webhook & wrote thread to DM Inbox!");
    } catch (err) { toast(err.message, "error"); }
  };

  root.querySelectorAll("[data-dry-auto]").forEach((btn) => { btn.onclick = () => fireSim(btn.dataset.dryAuto, btn.dataset.simKw, true); });
  root.querySelectorAll("[data-sim-auto]").forEach((btn) => { btn.onclick = () => fireSim(btn.dataset.simAuto, btn.dataset.simKw, false); });
  root.querySelectorAll("[data-retrigger-auto]").forEach((btn) => {
    btn.onclick = async () => {
      try {
        const res = await apiRequest("/api/automations/retrigger", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, automationId: btn.dataset.retriggerAuto }) });
        updateBundle(res.bundle);
        toast(`Swept ${res.swept} past un-DMed comments & delivered links!`);
      } catch (err) { toast(err.message, "error"); }
    };
  });
  root.querySelectorAll("[data-toggle-auto]").forEach((btn) => { btn.onclick = async () => { try { const b = await apiRequest("/api/automations/toggle", { method: "POST", body: JSON.stringify({ automationId: btn.dataset.toggleAuto }) }); updateBundle(b); } catch (err) { toast(err.message, "error"); } }; });
  root.querySelectorAll("[data-del-auto]").forEach((btn) => { btn.onclick = async () => { const b = await apiRequest("/api/automations/delete", { method: "POST", body: JSON.stringify({ automationId: btn.dataset.delAuto }) }); updateBundle(b); toast("Deleted automation."); }; });

  root.querySelectorAll("[data-bstep]").forEach((b) => { b.onclick = () => { builderDraft.step = Number(b.dataset.bstep); notify(); }; });
  root.querySelectorAll("[data-simtab]").forEach((b) => { b.onclick = () => { builderDraft.simTab = b.dataset.simtab; notify(); }; });
  root.querySelectorAll("[data-btrig]").forEach((b) => { b.onclick = () => { builderDraft.trigger_type = b.dataset.btrig; notify(); }; });
  root.querySelectorAll("[data-btarget]").forEach((b) => { b.onclick = () => { builderDraft.post_target = b.dataset.btarget; notify(); }; });
  root.querySelectorAll("[data-bpost]").forEach((el) => { el.onclick = () => { builderDraft.target_post_id = el.dataset.bpost; notify(); }; });
  const bName = root.querySelector("#b-name");
  if (bName) bName.oninput = () => { builderDraft.name = bName.value; };
  const kwAdd = root.querySelector("#b-kw-add");
  if (kwAdd) kwAdd.onclick = () => { const v = root.querySelector("#b-kw-input").value.trim().toUpperCase(); if (v && !builderDraft.keywords.includes(v)) builderDraft.keywords.push(v); notify(); };
  root.querySelectorAll("[data-rm-kw]").forEach((x) => { x.onclick = () => { builderDraft.keywords.splice(Number(x.dataset.rmKw), 1); notify(); }; });
  const pubTog = root.querySelector("#b-pub-toggle");
  if (pubTog) pubTog.onchange = () => { builderDraft.public_reply_enabled = pubTog.checked; notify(); };
  root.querySelectorAll("[data-bvar]").forEach((inp) => { inp.oninput = () => { builderDraft.public_reply_variants[Number(inp.dataset.bvar)] = inp.value; }; });
  const fgTog = root.querySelector("#b-fg-toggle");
  if (fgTog) fgTog.onchange = () => { builderDraft.follow_gate_enabled = fgTog.checked; notify(); };
  const fgMsg = root.querySelector("#b-fg-msg");
  if (fgMsg) fgMsg.oninput = () => { builderDraft.follow_gate_message = fgMsg.value; };
  const dmMsg = root.querySelector("#b-dm-msg");
  if (dmMsg) dmMsg.oninput = () => { builderDraft.dm_message = dmMsg.value; };
  root.querySelectorAll("[data-blabel]").forEach((inp) => { inp.oninput = () => { builderDraft.buttons[Number(inp.dataset.blabel)].label = inp.value; }; });
  root.querySelectorAll("[data-burl]").forEach((inp) => { inp.oninput = () => { builderDraft.buttons[Number(inp.dataset.burl)].url = inp.value; }; });
  root.querySelectorAll("[data-rm-btn]").forEach((b) => { b.onclick = () => { builderDraft.buttons.splice(Number(b.dataset.rmBtn), 1); notify(); }; });
  const addBtn = root.querySelector("#b-add-btn");
  if (addBtn) addBtn.onclick = () => { builderDraft.buttons.push({ label: "Bonus Resource", url: "https://reeldrop.io/free-tools" }); notify(); };
  const fuTog = root.querySelector("#b-fu-toggle");
  if (fuTog) fuTog.onchange = () => { builderDraft.followup_enabled = fuTog.checked; notify(); };
  const fuDelay = root.querySelector("#b-fu-delay");
  if (fuDelay) fuDelay.onchange = () => { builderDraft.followup_delay = fuDelay.value; notify(); };
  const fuMsg = root.querySelector("#b-fu-msg");
  if (fuMsg) fuMsg.oninput = () => { builderDraft.followup_message = fuMsg.value; };

  const bCancel = root.querySelector("#b-cancel");
  if (bCancel) bCancel.onclick = () => { store.appPage = "automations"; notify(); };
  const bPrev = root.querySelector("#b-prev");
  if (bPrev) bPrev.onclick = () => { builderDraft.step--; notify(); };
  const bNext = root.querySelector("#b-next");
  if (bNext) bNext.onclick = () => { builderDraft.step++; builderDraft.simTab = "dm"; notify(); };
  const bPub = root.querySelector("#b-publish-auto");
  if (bPub) {
    bPub.onclick = async () => {
      try {
        const res = await apiRequest("/api/automations", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, ...builderDraft }) });
        updateBundle(res);
        builderDraft.step = 1;
        store.appPage = "automations";
        notify();
        toast("Published active automation!");
      } catch (err) { toast(err.message, "error"); }
    };
  }

  root.querySelectorAll("[data-com-dm]").forEach((b) => { b.onclick = async () => { const res = await apiRequest("/api/comments/action", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, commentId: b.dataset.comDm, action: "send_dm" }) }); updateBundle(res); toast("Delivered Auto-DM & posted public comment reply!"); }; });
  root.querySelectorAll("[data-com-reply]").forEach((b) => { b.onclick = async () => { const replyText = prompt("Public reply under comment:", "Yes! Works in both Claude Code and Cursor via /mcp ✓"); if (!replyText) return; const res = await apiRequest("/api/comments/action", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, commentId: b.dataset.comReply, action: "reply", replyText }) }); updateBundle(res); toast("Posted public comment reply!"); }; });
  root.querySelectorAll("[data-com-hide]").forEach((b) => { b.onclick = async () => { const res = await apiRequest("/api/comments/action", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, commentId: b.dataset.comHide, action: "hide" }) }); updateBundle(res); toast("Hidden comment."); }; });

  const statusSel = root.querySelector("#inbox-status-sel");
  if (statusSel) statusSel.onchange = () => { store.inboxFilter = statusSel.value; notify(); };
  const inbSearch = root.querySelector("#inbox-search");
  if (inbSearch) inbSearch.oninput = () => { store.inboxSearch = inbSearch.value; notify(); };
  root.querySelectorAll("[data-inbox-chip]").forEach((b) => { b.onclick = () => { store.inboxChip = b.dataset.inboxChip; notify(); }; });
  root.querySelectorAll("[data-pick-thread]").forEach((el) => { el.onclick = () => { store.selectedThreadId = el.dataset.pickThread; notify(); }; });

  const activeThread = store.data.threads.find((t) => t.id === store.selectedThreadId) || store.data.threads[0];
  if (activeThread) {
    const patchThread = async (patch) => { const b = await apiRequest("/api/inbox/update-thread", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, threadId: activeThread.id, patch }) }); updateBundle(b); };
    const hotBtn = root.querySelector("#btn-toggle-hot");
    if (hotBtn) hotBtn.onclick = () => patchThread({ is_hot_lead: !activeThread.is_hot_lead });
    const pinBtn = root.querySelector("#btn-toggle-pin");
    if (pinBtn) pinBtn.onclick = () => patchThread({ is_pinned: !activeThread.is_pinned });
    const snzBtn = root.querySelector("#btn-toggle-snooze");
    if (snzBtn) snzBtn.onclick = () => patchThread({ snoozed_until: activeThread.snoozed_until ? null : new Date(Date.now() + 86400000).toISOString() });
    const arcBtn = root.querySelector("#btn-toggle-archive");
    if (arcBtn) arcBtn.onclick = () => patchThread({ is_archived: !activeThread.is_archived });
    const closeBtn = root.querySelector("#btn-toggle-close");
    if (closeBtn) closeBtn.onclick = () => patchThread({ is_open: !activeThread.is_open });
    const tagBtn = root.querySelector("#btn-add-tag");
    if (tagBtn) tagBtn.onclick = () => { const tag = prompt("Tag label (up to 8 per thread):", "Brand Deal"); if (tag) patchThread({ tags: [...activeThread.tags, tag] }); };
    const simIn = root.querySelector("#btn-sim-incoming");
    if (simIn) simIn.onclick = async () => { const b = await apiRequest("/api/inbox/reply", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, threadId: activeThread.id, simulateUserIncoming: true }) }); updateBundle(b); toast("Reopened 24h Meta window!"); };
    const aiDraftBtn = root.querySelector("#btn-inbox-ai");
    if (aiDraftBtn) aiDraftBtn.onclick = async () => { const res = await apiRequest("/api/inbox/ai-suggest", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, threadId: activeThread.id }) }); root.querySelector("#inbox-reply-input").value = res.draft; toast("Drafted AI reply!"); };
    const replyForm = root.querySelector("#inbox-reply-form");
    if (replyForm) {
      replyForm.onsubmit = async (e) => {
        e.preventDefault();
        const inp = root.querySelector("#inbox-reply-input");
        if (!inp.value.trim()) return;
        try { const b = await apiRequest("/api/inbox/reply", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, threadId: activeThread.id, text: inp.value }) }); inp.value = ""; updateBundle(b); toast("Sent DM reply!"); } catch (err) { toast(err.message, "error"); }
      };
    }
  }

  root.querySelectorAll("[data-ana-range]").forEach((b) => { b.onclick = () => { store.analyticsRange = b.dataset.anaRange; notify(); }; });
  root.querySelectorAll("[data-ana-grad]").forEach((b) => { b.onclick = async () => { const res = await apiRequest("/api/posts/update", { method: "POST", body: JSON.stringify({ postId: b.dataset.anaGrad, action: "graduate_trial" }) }); updateBundle(res); toast("Graduated Trial Reel!"); }; });

  const resetBtn = root.querySelector("#btn-reset-seed");
  if (resetBtn) resetBtn.onclick = () => resetAllDemoData();
  const setPlanSel = root.querySelector("#settings-plan-sel");
  if (setPlanSel) setPlanSel.onchange = async () => { const b = await apiRequest("/api/workspaces/switch-plan", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, plan: setPlanSel.value }) }); updateBundle(b); toast(`Switched plan to ${b.activeWorkspace.planSpec.name}!`); };
  const tzForm = root.querySelector("#settings-tz-form");
  if (tzForm) tzForm.onsubmit = async (e) => { e.preventDefault(); const fd = new FormData(tzForm); const slots = String(fd.get("slots") || "").split(",").map((s) => s.trim()).filter(Boolean); const b = await apiRequest("/api/workspaces/settings", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id, timezone: fd.get("timezone"), postingSlots: slots }) }); updateBundle(b); toast("Updated schedule settings!"); };

  const mSearch = root.querySelector("#mcp-search");
  if (mSearch) mSearch.oninput = () => { mcpSearch = mSearch.value; notify(); };
  root.querySelectorAll("[data-mcp-cat]").forEach((b) => { b.onclick = () => { mcpCategoryFilter = b.dataset.mcpCat; notify(); }; });
  root.querySelectorAll("[data-mcp-tool]").forEach((b) => {
    b.onclick = () => {
      mcpSelectedTool = b.dataset.mcpTool;
      const wsId = store.data.activeWorkspace.id;
      const sampleMap = {
        generate_reel_captions: { workspace_id: wsId, topic: "3 rules for 5% carousel saves", keyword: "GUIDE" },
        schedule_reel: { workspace_id: wsId, title: "Scheduled directly from Claude MCP!", caption: "Testing live 58-tool MCP scheduling", is_trial_reel: true },
        create_grid_placeholder: { workspace_id: wsId, note: "IDEA FROM CLAUDE MCP: Q4 Year-in-Review Carousel", color: "#BAE6FD" },
        generate_carousel: { workspace_id: wsId, prompt: "5 Claude MCP prompts saving 6 hours every week", theme_id: "bold_highlight", slide_count: 5 },
        dry_run_automation: { workspace_id: wsId, automation_id: store.data.automations[0]?.id || "auto_repo_pack", incoming_text: "REPO", is_follower: false }
      };
      mcpArgsText = JSON.stringify(sampleMap[mcpSelectedTool] || { workspace_id: wsId }, null, 2);
      notify();
    };
  });

  const runMcpBtn = root.querySelector("#btn-run-mcp");
  if (runMcpBtn) {
    runMcpBtn.onclick = async () => {
      try {
        mcpArgsText = root.querySelector("#mcp-args").value;
        const parsed = JSON.parse(mcpArgsText || "{}");
        const rpcRes = await apiRequest("/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method: "tools/call", params: { name: mcpSelectedTool, arguments: parsed } }) });
        mcpOutputText = JSON.stringify(rpcRes, null, 2);
        const refreshed = await apiRequest("/api/bootstrap/hydrate", { method: "POST", body: JSON.stringify({ workspaceId: store.data.activeWorkspace.id }) });
        updateBundle(refreshed);
        toast(`Executed MCP tool "${mcpSelectedTool}" over JSON-RPC 2.0!`);
      } catch (err) { toast(err.message, "error"); }
    };
  }

  const rerunRea = root.querySelector("#btn-rerun-rea");
  if (rerunRea) {
    rerunRea.onclick = async () => {
      rerunRea.disabled = true;
      rerunRea.textContent = "Verifying REA v6.7.0 Evidence…";
      const summary = await apiRequest("/api/rea/run", { method: "POST", body: "{}" });
      store.data.reaEvidence = summary;
      notify();
      toast("Verified all 5 SHA-256 REA Evidence bundles!");
    };
  }
}
