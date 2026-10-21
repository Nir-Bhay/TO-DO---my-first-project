import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import {
  state,
  saveState,
  resetStateToSeed,
  hydrateStateFromClientSnapshot,
  getPlatformMetrics,
  incrementPlatformMetric
} from "./db.mjs";
import { CAROUSEL_THEMES } from "../config/themes.js";
import { FREE_TOOLS_CATALOG } from "../config/freeToolsCatalog.js";
import {
  generateCaptions,
  generateCarouselSlides,
  generateAiDmReply,
  analyzeHashtagDensity
} from "./aiEngine.mjs";
import {
  PLANS_CONFIG,
  getPlanSpec,
  validateAutomationAgainstPlan,
  executeAutomationTrigger
} from "./automationEngine.mjs";
import { MCP_TOOLS_CATALOG, callMcpTool, handleMcpJsonRpc } from "./mcpServer.mjs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(__dirname, "..");
export const PUBLIC_DIR = path.join(ROOT_DIR, "public");
export const REA_EVIDENCE_DIR = path.join(ROOT_DIR, "rea-evidence");

export function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

export function loadReaEvidenceSummary() {
  for (const dir of [REA_EVIDENCE_DIR, path.join(PUBLIC_DIR, "rea-evidence")]) {
    const p = path.join(dir, "rea-summary.json");
    if (fs.existsSync(p)) {
      try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
    }
  }
  return { ready: true, reaVersion: "6.7.0", artifacts: [] };
}

export function getWorkspaceBundle(workspaceId) {
  const workspaces = state.workspaces.map((w) => ({
    ...w,
    posting_slots: typeof w.posting_slots === "string" ? JSON.parse(w.posting_slots || "[]") : w.posting_slots,
    planSpec: getPlanSpec(w.plan)
  }));
  const active = workspaces.find((w) => w.id === workspaceId) || workspaces[0];

  const posts = [...state.posts]
    .filter((p) => p.workspace_id === active.id)
    .sort((a, b) => String(b.scheduled_at).localeCompare(String(a.scheduled_at)));

  const gridPlaceholders = [...state.grid_placeholders]
    .filter((g) => g.workspace_id === active.id);

  const carousels = [...state.carousels]
    .filter((c) => c.workspace_id === active.id)
    .map((c) => ({ ...c, slides: JSON.parse(c.slides_json || "[]") }));

  const automations = [...state.automations]
    .filter((a) => a.workspace_id === active.id)
    .map((a) => ({
      ...a,
      keywords: JSON.parse(a.keywords_json || "[]"),
      public_reply_variants: JSON.parse(a.public_reply_variants_json || "[]"),
      buttons: JSON.parse(a.buttons_json || "[]")
    }));

  const threads = [...state.inbox_threads]
    .filter((t) => t.workspace_id === active.id)
    .sort((a, b) => (b.is_pinned - a.is_pinned) || String(b.updated_at).localeCompare(String(a.updated_at)))
    .map((t) => {
      const msgs = state.inbox_messages
        .filter((m) => m.thread_id === t.id)
        .map((m) => ({ ...m, buttons: JSON.parse(m.buttons_json || "[]") }));
      const ageHours = (Date.now() - new Date(t.last_user_message_at).getTime()) / 3600000;
      return {
        ...t,
        tags: JSON.parse(t.tags_json || "[]"),
        windowOpen: ageHours <= 24,
        windowHoursRemaining: Math.max(0, Number((24 - ageHours).toFixed(1))),
        messages: msgs
      };
    });

  const comments = [...(state.comments || [])]
    .filter((c) => c.workspace_id === active.id && !c.is_hidden);

  const notifications = [...state.notifications]
    .filter((n) => n.workspace_id === active.id)
    .slice(0, 25);

  return {
    metrics: getPlatformMetrics(),
    plansConfig: PLANS_CONFIG,
    themes: CAROUSEL_THEMES,
    freeTools: FREE_TOOLS_CATALOG,
    mcpTools: MCP_TOOLS_CATALOG,
    reaEvidence: loadReaEvidenceSummary(),
    workspaces,
    activeWorkspace: active,
    posts,
    gridPlaceholders,
    carousels,
    automations,
    threads,
    comments,
    notifications,
    serverStateSnapshot: state
  };
}

// Handles all `/mcp` and `/api/*` requests. Returns `true` if handled, `false` to fall through to static assets.
export async function handleApiOrMcpRequest(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    });
    res.end();
    return true;
  }

  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  // 1. Official Streamable HTTP JSON-RPC 2.0 MCP Server (`/mcp` — ALL 58 TOOLS!)
  if (pathname === "/mcp") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        server: "reeldrop-mcp-server",
        version: "2.0.0",
        protocol: "Model Context Protocol (Streamable HTTP JSON-RPC 2.0)",
        tools_count: MCP_TOOLS_CATALOG.length,
        connect_command: "claude mcp add --transport http reeldrop <YOUR_DEPLOYMENT_URL>/mcp",
        tools: MCP_TOOLS_CATALOG
      });
      return true;
    }
    if (req.method === "POST") {
      const rpcBody = await readBody(req);
      if (rpcBody._clientSnapshot) hydrateStateFromClientSnapshot(rpcBody._clientSnapshot);
      const out = handleMcpJsonRpc(rpcBody);
      out.serverStateSnapshot = state;
      sendJson(res, 200, out);
      return true;
    }
  }

  if (!pathname.startsWith("/api/")) return false;

  if (pathname === "/api/bootstrap" && req.method === "GET") {
    const wsId = url.searchParams.get("workspaceId") || "ws_maya";
    sendJson(res, 200, getWorkspaceBundle(wsId));
    return true;
  }

  if (pathname === "/api/bootstrap/hydrate" && req.method === "POST") {
    const body = await readBody(req);
    if (body._clientSnapshot) hydrateStateFromClientSnapshot(body._clientSnapshot);
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId || "ws_maya"));
    return true;
  }

  const body = req.method === "POST" ? await readBody(req) : {};
  if (body && body._clientSnapshot && pathname !== "/api/state/reset") {
    hydrateStateFromClientSnapshot(body._clientSnapshot);
  }

  if (pathname === "/api/state/reset" && req.method === "POST") {
    resetStateToSeed();
    sendJson(res, 200, getWorkspaceBundle("ws_maya"));
    return true;
  }

  if (pathname === "/api/mcp/call" && req.method === "POST") {
    const result = callMcpTool(body.name, body.args || {});
    sendJson(res, 200, { ok: !result.isError, result, bundle: getWorkspaceBundle(body.workspaceId || "ws_maya") });
    return true;
  }

  if (pathname === "/api/workspaces/switch-plan" && req.method === "POST") {
    const { workspaceId, plan, billingCycle = "yearly" } = body;
    if (!PLANS_CONFIG.plans[plan]) { sendJson(res, 400, { error: "Unknown plan." }); return true; }
    const ws = state.workspaces.find((w) => w.id === workspaceId) || state.workspaces[0];
    ws.plan = plan;
    ws.billing_cycle = billingCycle;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/workspaces/settings" && req.method === "POST") {
    const { workspaceId, timezone, postingSlots, gridCrop } = body;
    const ws = state.workspaces.find((w) => w.id === workspaceId);
    if (!ws) { sendJson(res, 404, { error: "Workspace not found." }); return true; }
    if (timezone) ws.timezone = timezone;
    if (postingSlots) ws.posting_slots = JSON.stringify(postingSlots);
    if (gridCrop) ws.grid_crop = gridCrop;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/workspaces/create" && req.method === "POST") {
    const { name, igHandle, plan = "creator" } = body;
    if (state.workspaces.length >= 5) {
      sendJson(res, 403, { error: "Maximum 5 Instagram workspaces reached on Creator/Lifetime tier." });
      return true;
    }
    const id = "ws_" + crypto.randomUUID().slice(0, 6);
    const handle = String(igHandle || "new.creator").replace(/^@/, "").trim();
    const now = new Date().toISOString();
    state.workspaces.push({
      id,
      name: name || `@${handle} Studio`,
      ig_handle: handle,
      ig_account_id: String(17841400000000 + Math.floor(Math.random() * 999999)),
      avatar_color: "#7C3AED",
      plan,
      billing_cycle: "yearly",
      timezone: "Asia/Calcutta",
      posting_slots: JSON.stringify(["09:30", "14:00", "20:30"]),
      grid_crop: "4:5",
      followers_count: 14800,
      ai_captions_used: 0,
      ai_carousel_images_used: 0,
      trial_reels_used: 0,
      ai_dm_replies_used: 0,
      referral_code: `${handle.toUpperCase().replace(/[^A-Z0-9]/g, "")}-FREE`,
      referral_months_earned: 1,
      created_at: now
    });
    incrementPlatformMetric("creators_signed_up", 1);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(id));
    return true;
  }

  if (pathname === "/api/posts" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === (body.workspaceId || "ws_maya")) || state.workspaces[0];
    const spec = getPlanSpec(ws.plan);

    if (body.isTrialReel && spec.limits.trialReelsPerMonth !== null && ws.trial_reels_used >= spec.limits.trialReelsPerMonth) {
      sendJson(res, 403, {
        code: "PLAN_LIMIT_TRIAL_REELS",
        error: `${spec.name} plan includes ${spec.limits.trialReelsPerMonth} Trial Reels/month (${ws.trial_reels_used}/${spec.limits.trialReelsPerMonth} used). Switch to Influencer ($9.99/mo) or Creator ($29/mo) for unlimited Trial Reels.`
      });
      return true;
    }
    if (body.firstComment && !spec.limits.firstCommentScheduling) {
      sendJson(res, 403, {
        code: "PLAN_LIMIT_FIRST_COMMENT",
        error: "Auto-posting first comment requires Influencer or Creator plan."
      });
      return true;
    }

    const id = "post_" + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    state.posts.unshift({
      id,
      workspace_id: ws.id,
      media_type: (body.mediaType || "REEL").toUpperCase(),
      status: body.status || "SCHEDULED",
      title: body.title || "Untitled Scheduled Post",
      caption: body.caption || "",
      hashtags: body.hashtags || "",
      first_comment: body.firstComment || "",
      cover_style: body.coverStyle || "terracotta",
      cover_label: (body.coverLabel || body.title || "NEW POST").slice(0, 34).toUpperCase(),
      collab_handle: String(body.collabHandle || "").replace(/^@/, ""),
      is_trial_reel: body.isTrialReel ? 1 : 0,
      trial_graduated: 0,
      automation_id: body.automationId || null,
      scheduled_at: body.scheduledAt || new Date(Date.now() + 3600000 * 6).toISOString(),
      published_at: null,
      error_reason: "",
      views: 0,
      reach: 0,
      likes: 0,
      comments_count: 0,
      saves: 0,
      avg_watch_sec: 0,
      created_at: now
    });

    if (body.isTrialReel) ws.trial_reels_used += 1;
    incrementPlatformMetric("reels_scheduled", 1);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/posts/update" && req.method === "POST") {
    const post = state.posts.find((p) => p.id === body.postId);
    if (!post) { sendJson(res, 404, { error: "Post not found." }); return true; }

    if (body.action === "delete") {
      state.posts = state.posts.filter((p) => p.id !== post.id);
      saveState();
      sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
      return true;
    }
    if (body.action === "retry") {
      post.status = "SCHEDULED";
      post.error_reason = "";
      post.scheduled_at = new Date(Date.now() + 3600000 * 2).toISOString();
      saveState();
      sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
      return true;
    }
    if (body.action === "publish_now") {
      post.status = "PUBLISHED";
      post.error_reason = "";
      post.published_at = new Date().toISOString();
      post.views = post.views || 22480;
      post.reach = post.reach || 19120;
      post.likes = post.likes || 1680;
      post.saves = post.saves || 1040;
      post.avg_watch_sec = post.avg_watch_sec || 14.4;
      saveState();
      sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
      return true;
    }
    if (body.action === "graduate_trial") {
      post.trial_graduated = 1;
      post.views = (post.views || 32000) + 28400;
      post.reach = (post.reach || 28000) + 24100;
      post.saves = (post.saves || 1800) + 1450;
      saveState();
      sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
      return true;
    }

    if (body.title !== undefined) post.title = body.title;
    if (body.caption !== undefined) post.caption = body.caption;
    if (body.scheduledAt !== undefined) post.scheduled_at = body.scheduledAt;
    if (body.coverStyle !== undefined) post.cover_style = body.coverStyle;
    if (body.coverLabel !== undefined) post.cover_label = body.coverLabel;
    if (body.collabHandle !== undefined) post.collab_handle = String(body.collabHandle).replace(/^@/, "");
    if (body.automationId !== undefined) post.automation_id = body.automationId || null;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
    return true;
  }

  if (pathname === "/api/posts/swap" && req.method === "POST") {
    const a = state.posts.find((p) => p.id === body.postAId);
    const b = state.posts.find((p) => p.id === body.postBId);
    if (!a || !b) { sendJson(res, 404, { error: "Posts not found." }); return true; }
    const tmp = a.scheduled_at;
    a.scheduled_at = b.scheduled_at;
    b.scheduled_at = tmp;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(a.workspace_id));
    return true;
  }

  if (pathname === "/api/grid/placeholders" && req.method === "POST") {
    const { workspaceId, note, color = "#FDE68A", action = "create", placeholderId } = body;
    if (action === "delete") {
      state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== placeholderId);
      saveState();
      sendJson(res, 200, getWorkspaceBundle(workspaceId));
      return true;
    }
    if (action === "convert") {
      const ph = state.grid_placeholders.find((g) => g.id === placeholderId);
      if (ph) {
        state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== ph.id);
        state.posts.unshift({
          id: "post_" + crypto.randomUUID().slice(0, 8),
          workspace_id: ph.workspace_id,
          media_type: "POST",
          status: "SCHEDULED",
          title: ph.note.slice(0, 48),
          caption: ph.note,
          hashtags: "",
          first_comment: "",
          cover_style: "butter",
          cover_label: ph.note.slice(0, 28).toUpperCase(),
          collab_handle: "",
          is_trial_reel: 0,
          trial_graduated: 0,
          automation_id: null,
          scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
          published_at: null,
          error_reason: "",
          views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0,
          created_at: new Date().toISOString()
        });
        saveState();
      }
      sendJson(res, 200, getWorkspaceBundle(workspaceId));
      return true;
    }
    state.grid_placeholders.unshift({
      id: "grid_" + crypto.randomUUID().slice(0, 8),
      workspace_id: workspaceId,
      note: String(note || "").slice(0, 280),
      color,
      position_order: 0,
      created_at: new Date().toISOString()
    });
    saveState();
    sendJson(res, 200, getWorkspaceBundle(workspaceId));
    return true;
  }

  if (pathname === "/api/ai/captions" && req.method === "POST") {
    const { workspaceId, topic, tone, includeHashtags = true, keyword = "GUIDE", enforceQuota = false } = body;
    let updatedWs = null;
    if (enforceQuota && workspaceId) {
      const ws = state.workspaces.find((w) => w.id === workspaceId);
      if (ws) {
        const spec = getPlanSpec(ws.plan);
        if (spec.limits.aiCaptionGenerationsPerMonth !== null && ws.ai_captions_used >= spec.limits.aiCaptionGenerationsPerMonth) {
          sendJson(res, 403, {
            code: "PLAN_LIMIT_CAPTIONS",
            error: `${spec.name} plan includes ${spec.limits.aiCaptionGenerationsPerMonth} AI caption generations/month (${ws.ai_captions_used}/${spec.limits.aiCaptionGenerationsPerMonth} used). Switch to Creator ($29/mo) for unlimited AI captions.`
          });
          return true;
        }
        ws.ai_captions_used += 1;
        updatedWs = ws.id;
        saveState();
      }
    }
    sendJson(res, 200, {
      captions: generateCaptions({ topic, tone, includeHashtags, keyword }),
      ...(updatedWs ? { bundle: getWorkspaceBundle(updatedWs) } : { serverStateSnapshot: state })
    });
    return true;
  }

  if (pathname === "/api/ai/hashtags" && req.method === "POST") {
    sendJson(res, 200, analyzeHashtagDensity(body.text));
    return true;
  }

  if (pathname === "/api/carousels/generate" && req.method === "POST") {
    const { workspaceId, prompt, slideCount = 5, themeId = "bold_highlight", aspectRatio = "4:5" } = body;
    const ws = state.workspaces.find((w) => w.id === (workspaceId || "ws_maya")) || state.workspaces[0];
    const generated = generateCarouselSlides({ prompt, slideCount, themeId });
    const id = "car_" + crypto.randomUUID().slice(0, 8);
    state.carousels.unshift({
      id,
      workspace_id: ws.id,
      title: (prompt || "New Themed Carousel").slice(0, 60),
      prompt: prompt || "New Themed Carousel",
      theme_id: themeId,
      aspect_ratio: aspectRatio,
      caption: generated.suggestedCaption,
      slides_json: JSON.stringify(generated.slides),
      created_at: new Date().toISOString()
    });
    ws.ai_carousel_images_used += generated.slides.length;
    saveState();
    sendJson(res, 200, { createdId: id, ...getWorkspaceBundle(ws.id) });
    return true;
  }

  if (pathname === "/api/carousels/update" && req.method === "POST") {
    const existing = state.carousels.find((c) => c.id === body.carouselId);
    if (!existing) { sendJson(res, 404, { error: "Carousel not found." }); return true; }
    if (body.action === "delete") {
      state.carousels = state.carousels.filter((c) => c.id !== existing.id);
      saveState();
      sendJson(res, 200, getWorkspaceBundle(existing.workspace_id));
      return true;
    }
    if (body.themeId) existing.theme_id = body.themeId;
    if (body.caption !== undefined) existing.caption = body.caption;
    if (body.slides) existing.slides_json = JSON.stringify(body.slides);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(existing.workspace_id));
    return true;
  }

  if (pathname === "/api/automations" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === (body.workspaceId || "ws_maya")) || state.workspaces[0];
    const check = validateAutomationAgainstPlan(ws, body, body.id || null);
    if (!check.ok) {
      sendJson(res, 403, { code: check.code || "VALIDATION_ERROR", error: check.error });
      return true;
    }
    const id = body.id || ("auto_" + crypto.randomUUID().slice(0, 8));
    const now = new Date().toISOString();
    const record = {
      id,
      workspace_id: ws.id,
      name: body.name || "Untitled Automation",
      status: body.status || "active",
      trigger_type: body.trigger_type || "comment",
      post_target: body.post_target || "specific_reel",
      target_post_id: body.target_post_id || null,
      keywords_json: JSON.stringify(body.keywords || ["LINK"]),
      public_reply_enabled: body.public_reply_enabled ? 1 : 0,
      public_reply_variants_json: JSON.stringify(body.public_reply_variants || ["Sent to your DMs! ✓"]),
      follow_gate_enabled: body.follow_gate_enabled ? 1 : 0,
      follow_gate_message: body.follow_gate_message || "Follow me first then tap below!",
      opening_card_enabled: body.opening_card_enabled ? 1 : 0,
      opening_card_text: body.opening_card_text || "Want me to send the link right over?",
      opening_button_label: body.opening_button_label || "Send me the link",
      dm_message: body.dm_message || "Here is your link!",
      buttons_json: JSON.stringify(body.buttons || []),
      followup_enabled: body.followup_enabled ? 1 : 0,
      followup_delay: body.followup_delay || "2h",
      followup_message: body.followup_message || "",
      ai_prompt: body.ai_prompt || "",
      dms_sent: 0,
      link_taps: 0,
      public_replies_sent: 0,
      created_at: now
    };
    const idx = state.automations.findIndex((a) => a.id === id);
    if (idx >= 0) state.automations[idx] = { ...state.automations[idx], ...record };
    else state.automations.unshift(record);
    saveState();
    sendJson(res, 200, { savedId: id, ...getWorkspaceBundle(ws.id) });
    return true;
  }

  if (pathname === "/api/automations/toggle" && req.method === "POST") {
    const auto = state.automations.find((a) => a.id === body.automationId);
    if (!auto) { sendJson(res, 404, { error: "Automation not found." }); return true; }
    const ws = state.workspaces.find((w) => w.id === auto.workspace_id);
    if (auto.status === "paused") {
      const check = validateAutomationAgainstPlan(ws, { status: "active", trigger_type: auto.trigger_type, post_target: auto.post_target, buttons: JSON.parse(auto.buttons_json || "[]") }, auto.id);
      if (!check.ok) { sendJson(res, 403, { error: check.error }); return true; }
      auto.status = "active";
    } else {
      auto.status = "paused";
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(auto.workspace_id));
    return true;
  }

  if (pathname === "/api/automations/delete" && req.method === "POST") {
    const auto = state.automations.find((a) => a.id === body.automationId);
    if (!auto) { sendJson(res, 404, { error: "Automation not found." }); return true; }
    state.automations = state.automations.filter((a) => a.id !== auto.id);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(auto.workspace_id));
    return true;
  }

  if (pathname === "/api/automations/simulate" && req.method === "POST") {
    const sim = executeAutomationTrigger(body);
    if (!sim.ok) { sendJson(res, 400, sim); return true; }
    sendJson(res, 200, { simulation: sim, bundle: getWorkspaceBundle(body.workspaceId) });
    return true;
  }

  if (pathname === "/api/automations/retrigger" && req.method === "POST") {
    const { workspaceId, automationId } = body;
    const ws = state.workspaces.find((w) => w.id === workspaceId);
    const spec = getPlanSpec(ws.plan);
    if (!spec.limits.retriggerPastComments) {
      sendJson(res, 403, {
        code: "PLAN_LIMIT_RETRIGGER",
        error: "Retriggering over past un-DMed comments (up to 50 comments/post across 5 posts) requires Influencer or Creator plan."
      });
      return true;
    }
    const auto = state.automations.find((a) => a.id === automationId);
    const kws = JSON.parse(auto.keywords_json || '["LINK"]');
    const sampleHandles = [
      ["nina.edits", "Nina Patel"],
      ["liam.motion", "Liam Brooks"],
      ["kavya.studio", "Kavya Nair"]
    ];
    const runs = sampleHandles.map(([h, n]) =>
      executeAutomationTrigger({
        workspaceId,
        automationId,
        senderHandle: h,
        senderName: n,
        incomingText: kws[0] || "LINK",
        isFollower: true,
        postTitle: "Retrigger Sweep (Past Un-DMed Comments)"
      })
    );
    for (const c of state.comments || []) {
      if (c.workspace_id === workspaceId && !c.dm_sent && c.matched_keyword) {
        c.dm_sent = 1;
        c.public_reply = "Swept via Retrigger — sent link to DMs! ✓";
      }
    }
    saveState();
    sendJson(res, 200, { swept: runs.length, bundle: getWorkspaceBundle(workspaceId) });
    return true;
  }

  if (pathname === "/api/inbox/reply" && req.method === "POST") {
    const { workspaceId, threadId, text, simulateUserIncoming = false } = body;
    const ws = state.workspaces.find((w) => w.id === workspaceId);
    const spec = getPlanSpec(ws.plan);
    const thread = state.inbox_threads.find((t) => t.id === threadId);
    if (!thread) { sendJson(res, 404, { error: "Conversation not found." }); return true; }

    const now = new Date().toISOString();
    if (simulateUserIncoming) {
      const msgText = text || "Hey! Just saw your new Reel — reopening our 24h chat window ✓";
      state.inbox_messages.push({
        id: "msg_" + crypto.randomUUID().slice(0, 8),
        thread_id: thread.id, sender: "them", body: msgText,
        buttons_json: "[]", shared_reel_title: "", via_automation: "", created_at: now
      });
      thread.last_user_message_at = now;
      thread.updated_at = now;
      thread.is_open = 1;
      thread.last_message_preview = msgText.slice(0, 90);
      saveState();
      sendJson(res, 200, getWorkspaceBundle(ws.id));
      return true;
    }

    if (!spec.limits.inboxReply) {
      sendJson(res, 403, {
        code: "PLAN_LIMIT_INBOX_REPLY",
        error: "Starter includes a read-only DM Inbox. Switch workspace plan to Influencer ($9.99/mo) or Creator ($29/mo) to send live replies."
      });
      return true;
    }

    const ageHours = (Date.now() - new Date(thread.last_user_message_at).getTime()) / 3600000;
    if (ageHours > 24) {
      sendJson(res, 400, {
        code: "WINDOW_EXPIRED",
        error: "Instagram's 24-hour standard messaging window has expired for this thread. Click 'Simulate User Reply' above to reopen the 24h window."
      });
      return true;
    }

    const bodyText = String(text || "").trim().slice(0, 1000);
    state.inbox_messages.push({
      id: "msg_" + crypto.randomUUID().slice(0, 8),
      thread_id: thread.id, sender: "me", body: bodyText,
      buttons_json: "[]", shared_reel_title: "", via_automation: "", created_at: now
    });
    thread.last_message_preview = bodyText.slice(0, 90);
    thread.updated_at = now;
    thread.unread_count = 0;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/inbox/update-thread" && req.method === "POST") {
    const { workspaceId, threadId, patch } = body;
    const t = state.inbox_threads.find((x) => x.id === threadId);
    if (!t) { sendJson(res, 404, { error: "Thread not found." }); return true; }
    if (patch.is_open !== undefined) t.is_open = patch.is_open ? 1 : 0;
    if (patch.unread_count !== undefined) t.unread_count = patch.unread_count;
    if (patch.is_hot_lead !== undefined) t.is_hot_lead = patch.is_hot_lead ? 1 : 0;
    if (patch.is_archived !== undefined) t.is_archived = patch.is_archived ? 1 : 0;
    if (patch.is_pinned !== undefined) t.is_pinned = patch.is_pinned ? 1 : 0;
    if (patch.snoozed_until !== undefined) t.snoozed_until = patch.snoozed_until;
    if (patch.tags) t.tags_json = JSON.stringify(patch.tags.slice(0, 8));
    saveState();
    sendJson(res, 200, getWorkspaceBundle(workspaceId));
    return true;
  }

  if (pathname === "/api/inbox/ai-suggest" && req.method === "POST") {
    const { threadId } = body;
    const t = state.inbox_threads.find((x) => x.id === threadId);
    const msgs = state.inbox_messages.filter((m) => m.thread_id === threadId);
    const lastMsg = msgs[msgs.length - 1];
    sendJson(res, 200, {
      draft: generateAiDmReply({ userMessage: lastMsg?.body || "", handle: t?.participant_handle || "creator" })
    });
    return true;
  }

  if (pathname === "/api/comments/action" && req.method === "POST") {
    const { workspaceId, commentId, action, replyText } = body;
    const c = (state.comments || []).find((x) => x.id === commentId);
    if (!c) { sendJson(res, 404, { error: "Comment not found." }); return true; }
    if (action === "hide") c.is_hidden = 1;
    if (action === "reply") c.public_reply = String(replyText || "Thanks so much! Just sent details to your DMs ✓").slice(0, 300);
    if (action === "send_dm") {
      const auto = state.automations.find((a) => a.workspace_id === workspaceId) || state.automations[0];
      if (auto) {
        executeAutomationTrigger({
          workspaceId,
          automationId: auto.id,
          senderHandle: c.author_handle,
          senderName: `@${c.author_handle}`,
          incomingText: c.matched_keyword || "LINK",
          isFollower: true,
          postTitle: c.post_title
        });
      }
      c.dm_sent = 1;
      if (!c.public_reply) c.public_reply = "Just sent it straight to your DMs! ✓";
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(workspaceId));
    return true;
  }

  if (pathname === "/api/notifications/read-all" && req.method === "POST") {
    for (const n of state.notifications) {
      if (n.workspace_id === body.workspaceId) n.is_read = 1;
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId));
    return true;
  }

  if (pathname === "/api/campaigns/apply" && req.method === "POST") {
    const { igHandle, email, avgViews = 15000, niche = "Creator Tools", sampleUrl = "" } = body;
    state.campaign_applications.push({
      id: "cmp_" + crypto.randomUUID().slice(0, 8),
      ig_handle: igHandle,
      email,
      avg_views: Number(avgViews) || 0,
      niche,
      sample_url: sampleUrl,
      created_at: new Date().toISOString()
    });
    saveState();
    sendJson(res, 200, { ok: true, message: "Application submitted! Campaign briefs reach your inbox within 48h.", serverStateSnapshot: state });
    return true;
  }

  if (pathname === "/api/rea/run" && req.method === "POST") {
    const reaBin = "/home/user/opt/rea-launcher/rea";
    if (fs.existsSync(reaBin)) {
      await execFileAsync(process.execPath, [path.join(ROOT_DIR, "scripts/build-rea-evidence.mjs")], {
        cwd: ROOT_DIR,
        timeout: 45000
      });
    }
    sendJson(res, 200, loadReaEvidenceSummary());
    return true;
  }

  sendJson(res, 404, { error: `Unknown API route: ${pathname}` });
  return true;
}
