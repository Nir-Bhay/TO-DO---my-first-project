import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  state,
  saveState,
  resetStateToSeed,
  hydrateStateFromClientSnapshot,
  incrementPlatformMetric,
  saveUploadedMedia,
  processDueScheduledPosts,
  hashPassword,
  verifyPassword,
  createSessionToken
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
import { MCP_TOOLS_CATALOG, handleMcpJsonRpc } from "./mcpServer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
      resolve(req.body);
      return;
    }
    if (typeof req.body === "string") {
      try { resolve(req.body ? JSON.parse(req.body) : {}); } catch (e) { reject(e); }
      return;
    }
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

export function sendJson(res, status, data) {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Velora-Workspace",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  });
  res.end(payload);
}

export function getWorkspaceBundle(workspaceId = "ws_maya", currentUser = null) {
  const workspaces = state.workspaces.map((w) => ({
    ...w,
    posting_slots: typeof w.posting_slots === "string" ? JSON.parse(w.posting_slots || "[]") : (w.posting_slots || []),
    planSpec: getPlanSpec(w.plan)
  }));
  const active = workspaces.find((w) => w.id === workspaceId) || workspaces[0];

  const posts = [...state.posts]
    .filter((p) => p.workspace_id === active.id)
    .sort((a, b) => (a.grid_order || 999) - (b.grid_order || 999) || String(b.scheduled_at).localeCompare(String(a.scheduled_at)));

  const gridPlaceholders = (state.grid_placeholders || [])
    .filter((g) => g.workspace_id === active.id)
    .sort((a, b) => (a.position_order || 0) - (b.position_order || 0));

  const carousels = (state.carousels || [])
    .filter((c) => c.workspace_id === active.id)
    .map((c) => ({ ...c, slides: JSON.parse(c.slides_json || "[]") }));

  const automations = (state.automations || [])
    .filter((a) => a.workspace_id === active.id)
    .map((a) => ({
      ...a,
      keywords: JSON.parse(a.keywords_json || "[]"),
      public_reply_variants: JSON.parse(a.public_reply_variants_json || "[]"),
      buttons: JSON.parse(a.buttons_json || "[]")
    }));

  const threads = [...(state.inbox_threads || [])]
    .filter((t) => t.workspace_id === active.id)
    .sort((a, b) => (b.is_pinned - a.is_pinned) || String(b.updated_at).localeCompare(String(a.updated_at)))
    .map((t) => {
      const msgs = (state.inbox_messages || [])
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

  const comments = (state.comments || []).filter((c) => c.workspace_id === active.id && !c.is_hidden);
  const notifications = (state.notifications || []).filter((n) => n.workspace_id === active.id);
  const templates = (state.caption_templates || []).filter((t) => t.workspace_id === active.id);
  const teamMembers = (state.team_members || []).filter((m) => m.workspace_id === active.id);
  const mediaAssets = (state.media_assets || []).filter((m) => m.workspace_id === active.id).map((m) => ({
    id: m.id,
    filename: m.filename,
    mime_type: m.mime_type,
    size_bytes: m.size_bytes,
    url: m.data_url,
    created_at: m.created_at
  }));

  const m = state.platform_metrics || {};

  return {
    brand: { name: "Velora", domain: "velora.so" },
    currentUser: currentUser || { id: "usr_demo", name: "Maya Kapoor", email: "maya@velora.so" },
    metrics: {
      creators_signed_up: m.creators_signed_up || 4820,
      dms_sent_automatically: m.dms_sent_automatically || 194680,
      posts_scheduled: m.posts_scheduled || m.reels_scheduled || 31450
    },
    plansConfig: PLANS_CONFIG,
    themes: CAROUSEL_THEMES,
    freeTools: FREE_TOOLS_CATALOG,
    mcpTools: MCP_TOOLS_CATALOG,
    workspaces,
    activeWorkspace: active,
    posts,
    gridPlaceholders,
    carousels,
    automations,
    threads,
    comments,
    notifications,
    templates,
    teamMembers,
    mediaAssets,
    serverStateSnapshot: state
  };
}

export async function handleApiOrMcpRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return true;
  }

  const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = u.pathname;

  if (pathname === "/mcp") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        server: "velora-mcp",
        version: "3.0.0",
        transport: "streamable-http",
        toolsCount: MCP_TOOLS_CATALOG.length,
        status: "ready"
      });
      return true;
    }
    const rpcBody = await readBody(req);
    if (rpcBody?._clientSnapshot) hydrateStateFromClientSnapshot(rpcBody._clientSnapshot);
    const rpcResult = await handleMcpJsonRpc(rpcBody);
    sendJson(res, 200, { ...rpcResult, serverStateSnapshot: state });
    return true;
  }

  if (!pathname.startsWith("/api/")) return false;

  // Serve stored binary media if requested via /api/media/:id
  if (pathname.startsWith("/api/media/") && req.method === "GET") {
    const assetId = pathname.split("/")[3];
    const asset = (state.media_assets || []).find((m) => m.id === assetId);
    if (!asset) { sendJson(res, 404, { error: "Media asset not found" }); return true; }
    const b64 = String(asset.data_url || "").match(/^data:([^;]+);base64,(.+)$/);
    if (b64) {
      const buf = Buffer.from(b64[2], "base64");
      res.writeHead(200, { "Content-Type": b64[1], "Cache-Control": "public, max-age=31536000" });
      res.end(buf);
      return true;
    }
    sendJson(res, 200, asset);
    return true;
  }

  // Export Analytics CSV Report
  if (pathname === "/api/analytics/export.csv" && req.method === "GET") {
    const wsId = u.searchParams.get("workspaceId") || "ws_maya";
    const rows = state.posts.filter((p) => p.workspace_id === wsId);
    const header = "id,media_type,status,title,scheduled_at,views,reach,likes,comments,shares,saves,avg_watch_sec\n";
    const csv = header + rows.map((p) =>
      [p.id, p.media_type, p.status, `"${String(p.title).replace(/"/g, '""')}"`, p.scheduled_at, p.views, p.reach, p.likes, p.comments_count, p.shares || 0, p.saves, p.avg_watch_sec].join(",")
    ).join("\n");
    res.writeHead(200, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="velora-analytics-${wsId}.csv"`
    });
    res.end(csv);
    return true;
  }

  if (pathname === "/api/bootstrap" && req.method === "GET") {
    const wsId = u.searchParams.get("workspaceId") || "ws_maya";
    sendJson(res, 200, getWorkspaceBundle(wsId));
    return true;
  }

  const body = (req.method === "POST" || req.method === "PATCH" || req.method === "DELETE")
    ? await readBody(req)
    : {};

  if (body?._clientSnapshot && pathname !== "/api/state/reset") {
    hydrateStateFromClientSnapshot(body._clientSnapshot);
  }

  if (pathname === "/api/bootstrap/hydrate" && req.method === "POST") {
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId || "ws_maya"));
    return true;
  }

  if (pathname === "/api/state/reset" && req.method === "POST") {
    resetStateToSeed();
    sendJson(res, 200, getWorkspaceBundle("ws_maya"));
    return true;
  }

  // Real PBKDF2 Authentication Endpoints
  if (pathname === "/api/auth/register" && req.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");
    if (!email || !password || password.length < 6) {
      sendJson(res, 400, { error: "Provide a valid email and password (at least 6 characters)." });
      return true;
    }
    state.users = state.users || [];
    if (state.users.some((u) => u.email === email)) {
      sendJson(res, 400, { error: "An account with this email already exists. Sign in instead." });
      return true;
    }
    const { salt, hash } = hashPassword(password);
    const user = {
      id: "usr_" + crypto.randomUUID().slice(0, 8),
      name: name || email.split("@")[0],
      email,
      password_salt: salt,
      password_hash: hash,
      created_at: new Date().toISOString()
    };
    state.users.push(user);
    const token = createSessionToken(user.id);
    incrementPlatformMetric("creators_signed_up", 1);
    saveState();
    sendJson(res, 200, {
      token,
      user: { id: user.id, name: user.name, email: user.email },
      bundle: getWorkspaceBundle("ws_maya", { id: user.id, name: user.name, email: user.email })
    });
    return true;
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = (state.users || []).find((u) => u.email === email);
    if (!user || !verifyPassword(password, user)) {
      sendJson(res, 401, { error: "Invalid email or password. Try demo account maya@velora.so / demo1234." });
      return true;
    }
    const token = createSessionToken(user.id);
    sendJson(res, 200, {
      token,
      user: { id: user.id, name: user.name, email: user.email },
      bundle: getWorkspaceBundle("ws_maya", { id: user.id, name: user.name, email: user.email })
    });
    return true;
  }

  // Real File Upload Endpoint (Image / Video Base64 Data URL -> Disk + SQLite `media_assets`)
  if (pathname === "/api/media/upload" && req.method === "POST") {
    if (!body.dataUrl) {
      sendJson(res, 400, { error: "Missing media file payload." });
      return true;
    }
    const asset = saveUploadedMedia({
      workspaceId: body.workspaceId || "ws_maya",
      filename: body.filename || "media.png",
      mimeType: body.mimeType || "image/png",
      dataUrl: body.dataUrl
    });
    sendJson(res, 200, {
      asset: { id: asset.id, filename: asset.filename, mime_type: asset.mime_type, size_bytes: asset.size_bytes, url: asset.data_url },
      bundle: getWorkspaceBundle(body.workspaceId || "ws_maya")
    });
    return true;
  }

  // Run Background Queue Worker Manually
  if (pathname === "/api/queue/run-worker" && req.method === "POST") {
    const count = processDueScheduledPosts(Boolean(body.publishNextScheduled));
    sendJson(res, 200, { publishedCount: count, bundle: getWorkspaceBundle(body.workspaceId || "ws_maya") });
    return true;
  }

  // Reusable Caption Templates CRUD
  if (pathname === "/api/templates" && req.method === "POST") {
    state.caption_templates = state.caption_templates || [];
    if (body.action === "delete") {
      state.caption_templates = state.caption_templates.filter((t) => t.id !== body.templateId);
    } else {
      state.caption_templates.unshift({
        id: "tpl_" + crypto.randomUUID().slice(0, 8),
        workspace_id: body.workspaceId || "ws_maya",
        title: String(body.title || "Untitled Template").slice(0, 60),
        category: String(body.category || "General"),
        body: String(body.body || ""),
        hashtags: String(body.hashtags || ""),
        created_at: new Date().toISOString()
      });
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId || "ws_maya"));
    return true;
  }

  // Team Member Invite & Removal
  if (pathname === "/api/team" && req.method === "POST") {
    state.team_members = state.team_members || [];
    if (body.action === "remove") {
      state.team_members = state.team_members.filter((m) => m.id !== body.memberId);
    } else {
      state.team_members.push({
        id: "tm_" + crypto.randomUUID().slice(0, 8),
        workspace_id: body.workspaceId || "ws_maya",
        name: String(body.name || "New Member").trim(),
        email: String(body.email || "").trim(),
        role: body.role || "Editor",
        status: "Invited",
        created_at: new Date().toISOString()
      });
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId || "ws_maya"));
    return true;
  }

  if (pathname === "/api/workspaces/switch-plan" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === body.workspaceId) || state.workspaces[0];
    ws.plan = body.plan;
    if (body.billingCycle) ws.billing_cycle = body.billingCycle;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/workspaces/settings" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === body.workspaceId) || state.workspaces[0];
    if (body.name !== undefined) ws.name = String(body.name).trim() || ws.name;
    if (body.igHandle !== undefined) ws.ig_handle = String(body.igHandle).replace(/^@/, "").trim() || ws.ig_handle;
    if (body.bio !== undefined) ws.bio = String(body.bio);
    if (body.website !== undefined) ws.website = String(body.website);
    if (body.timezone) ws.timezone = body.timezone;
    if (body.postingSlots) ws.posting_slots = JSON.stringify(body.postingSlots);
    if (body.gridCrop) ws.grid_crop = body.gridCrop;
    if (body.avatarColor) ws.avatar_color = body.avatarColor;
    if (body.avatarUrl !== undefined) ws.avatar_url = body.avatarUrl;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/workspaces/create" && req.method === "POST") {
    if (state.workspaces.length >= 8) {
      sendJson(res, 403, { error: "Maximum workspace limit reached." });
      return true;
    }
    const id = "ws_" + crypto.randomUUID().slice(0, 8);
    const handle = String(body.igHandle || "new.studio").replace(/^@/, "").trim();
    const now = new Date().toISOString();
    state.workspaces.push({
      id,
      owner_id: "usr_demo",
      name: body.name || `@${handle}`,
      ig_handle: handle,
      bio: body.bio || "Digital creator & brand studio.",
      website: "",
      ig_account_id: String(Math.floor(17841400000000 + Math.random() * 9000000)),
      avatar_color: body.avatarColor || "#0F172A",
      avatar_url: "",
      plan: body.plan || "studio",
      billing_cycle: "yearly",
      timezone: "Asia/Calcutta",
      posting_slots: JSON.stringify(["09:30", "14:00", "20:15"]),
      grid_crop: "4:5",
      followers_count: 12400,
      following_count: 310,
      ai_captions_used: 0,
      ai_carousel_images_used: 0,
      trial_reels_used: 0,
      ai_dm_replies_used: 0,
      referral_code: `${handle.toUpperCase().replace(/[^A-Z0-9]/g, "")}-VIP`,
      referral_months_earned: 0,
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
        error: `${spec.name} plan includes ${spec.limits.trialReelsPerMonth} Trial Reels/month (${ws.trial_reels_used}/${spec.limits.trialReelsPerMonth} used). Upgrade to Growth or Studio for unlimited Trial Reels.`
      });
      return true;
    }

    const id = "post_" + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const isImmediate = body.status === "PUBLISHED";
    const views = isImmediate ? 14200 + Math.floor(Math.random() * 9000) : 0;

    state.posts.unshift({
      id,
      workspace_id: ws.id,
      media_type: (body.mediaType || "REEL").toUpperCase(),
      status: body.status || "SCHEDULED",
      title: body.title || "Untitled Post",
      caption: body.caption || "",
      hashtags: body.hashtags || "",
      first_comment: body.firstComment || "",
      media_url: body.mediaUrl || "",
      slides_media_json: JSON.stringify(body.slidesMedia || []),
      cover_style: body.coverStyle || "noir",
      cover_label: (body.coverLabel || body.title || "NEW POST").slice(0, 36).toUpperCase(),
      collab_handle: String(body.collabHandle || "").replace(/^@/, ""),
      location_tag: body.locationTag || "",
      is_trial_reel: body.isTrialReel ? 1 : 0,
      trial_graduated: 0,
      automation_id: body.automationId || null,
      grid_order: 0,
      scheduled_at: body.scheduledAt || new Date(Date.now() + 3600000 * 4).toISOString(),
      published_at: isImmediate ? now : null,
      error_reason: "",
      views,
      reach: isImmediate ? Math.round(views * 0.84) : 0,
      likes: isImmediate ? Math.round(views * 0.056) : 0,
      comments_count: isImmediate ? 42 : 0,
      shares: isImmediate ? 118 : 0,
      saves: isImmediate ? Math.round(views * 0.041) : 0,
      avg_watch_sec: isImmediate ? 13.4 : 0,
      created_at: now
    });

    if (body.isTrialReel) ws.trial_reels_used += 1;
    incrementPlatformMetric("posts_scheduled", 1);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/posts/update" && req.method === "POST") {
    const post = state.posts.find((p) => p.id === body.postId);
    if (!post) { sendJson(res, 404, { error: "Post not found." }); return true; }

    if (body.action === "delete") {
      state.posts = state.posts.filter((p) => p.id !== post.id);
    } else if (body.action === "duplicate") {
      state.posts.unshift({
        ...structuredClone(post),
        id: "post_" + crypto.randomUUID().slice(0, 8),
        title: `${post.title} (Copy)`,
        status: "DRAFT",
        created_at: new Date().toISOString()
      });
    } else if (body.action === "retry") {
      post.status = "SCHEDULED";
      post.error_reason = "";
    } else if (body.action === "publish_now") {
      post.status = "PUBLISHED";
      post.published_at = new Date().toISOString();
      post.views = 26400;
      post.reach = 22100;
      post.likes = 1580;
      post.saves = 1140;
      post.comments_count = 164;
    } else if (body.action === "graduate_trial") {
      post.trial_graduated = 1;
      post.views += 29400;
      post.reach += 24200;
      post.saves += 1290;
    } else {
      if (body.title !== undefined) post.title = body.title;
      if (body.caption !== undefined) post.caption = body.caption;
      if (body.hashtags !== undefined) post.hashtags = body.hashtags;
      if (body.firstComment !== undefined) post.first_comment = body.firstComment;
      if (body.mediaUrl !== undefined) post.media_url = body.mediaUrl;
      if (body.coverStyle !== undefined) post.cover_style = body.coverStyle;
      if (body.status !== undefined) post.status = body.status;
      if (body.scheduledAt !== undefined) post.scheduled_at = body.scheduledAt;
      if (body.collabHandle !== undefined) post.collab_handle = String(body.collabHandle).replace(/^@/, "");
      if (body.locationTag !== undefined) post.location_tag = body.locationTag;
      if (body.automationId !== undefined) post.automation_id = body.automationId || null;
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
    return true;
  }

  // Drag-and-Drop Calendar Date Reschedule
  if (pathname === "/api/posts/reschedule" && req.method === "POST") {
    const post = state.posts.find((p) => p.id === body.postId);
    if (!post) { sendJson(res, 404, { error: "Post not found." }); return true; }
    const timePart = new Date(post.scheduled_at).toISOString().slice(11, 19);
    post.scheduled_at = `${body.targetDate}T${timePart}Z`;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(post.workspace_id));
    return true;
  }

  if (pathname === "/api/posts/swap" && req.method === "POST") {
    const a = state.posts.find((p) => p.id === body.postAId);
    const b = state.posts.find((p) => p.id === body.postBId);
    if (!a || !b) { sendJson(res, 404, { error: "Posts not found." }); return true; }
    const tmpSched = a.scheduled_at;
    a.scheduled_at = b.scheduled_at;
    b.scheduled_at = tmpSched;
    const tmpOrder = a.grid_order || 0;
    a.grid_order = b.grid_order || 0;
    b.grid_order = tmpOrder;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(a.workspace_id));
    return true;
  }

  if (pathname === "/api/grid/placeholders" && req.method === "POST") {
    const wsId = body.workspaceId || "ws_maya";
    if (body.action === "delete") {
      state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== body.placeholderId);
    } else if (body.action === "convert") {
      const ph = state.grid_placeholders.find((g) => g.id === body.placeholderId);
      if (ph) {
        state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== ph.id);
        state.posts.unshift({
          id: "post_" + crypto.randomUUID().slice(0, 8),
          workspace_id: ph.workspace_id,
          media_type: "POST",
          status: "DRAFT",
          title: ph.note.slice(0, 52),
          caption: ph.note,
          hashtags: "",
          first_comment: "",
          media_url: "",
          slides_media_json: "[]",
          cover_style: "cream",
          cover_label: ph.note.slice(0, 28).toUpperCase(),
          collab_handle: "",
          location_tag: "",
          is_trial_reel: 0,
          trial_graduated: 0,
          automation_id: null,
          grid_order: 0,
          scheduled_at: new Date(Date.now() + 86400000).toISOString(),
          published_at: null,
          error_reason: "",
          views: 0, reach: 0, likes: 0, comments_count: 0, shares: 0, saves: 0, avg_watch_sec: 0,
          created_at: new Date().toISOString()
        });
      }
    } else {
      state.grid_placeholders.unshift({
        id: "gp_" + crypto.randomUUID().slice(0, 8),
        workspace_id: wsId,
        note: String(body.note || "Grid note").slice(0, 280),
        color: body.color || "#F4F4F5",
        position_order: 0,
        created_at: new Date().toISOString()
      });
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(wsId));
    return true;
  }

  if (pathname === "/api/ai/captions" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === body.workspaceId);
    if (ws && body.enforceQuota) {
      const spec = getPlanSpec(ws.plan);
      const cap = spec.limits.aiCaptionGenerationsPerMonth;
      if (cap !== null && ws.ai_captions_used >= cap) {
        sendJson(res, 403, {
          code: "PLAN_LIMIT_REACHED",
          error: `${spec.name} plan includes ${cap} AI captions/month (${ws.ai_captions_used}/${cap} used). Switch to Growth or Studio for more.`
        });
        return true;
      }
      ws.ai_captions_used += 1;
      saveState();
    }
    const captions = generateCaptions(body);
    sendJson(res, 200, { captions, bundle: ws ? getWorkspaceBundle(ws.id) : null });
    return true;
  }

  if (pathname === "/api/ai/hashtags" && req.method === "POST") {
    sendJson(res, 200, analyzeHashtagDensity(body.text || ""));
    return true;
  }

  if (pathname === "/api/carousels/generate" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === (body.workspaceId || "ws_maya")) || state.workspaces[0];
    const generated = generateCarouselSlides(body);
    const id = "car_" + crypto.randomUUID().slice(0, 8);
    state.carousels.unshift({
      id,
      workspace_id: ws.id,
      title: String(body.prompt || "Untitled Carousel").slice(0, 64),
      prompt: body.prompt || "",
      theme_id: body.themeId || "swiss_white",
      aspect_ratio: body.aspectRatio || "4:5",
      caption: generated.suggestedCaption,
      slides_json: JSON.stringify(generated.slides.map((s) => ({ ...s, imageUrl: "" }))),
      created_at: new Date().toISOString()
    });
    ws.ai_carousel_images_used = (ws.ai_carousel_images_used || 0) + generated.slides.length;
    saveState();
    sendJson(res, 200, { createdId: id, ...getWorkspaceBundle(ws.id) });
    return true;
  }

  if (pathname === "/api/carousels/update" && req.method === "POST") {
    const car = state.carousels.find((c) => c.id === body.carouselId);
    if (!car) { sendJson(res, 404, { error: "Carousel not found." }); return true; }
    if (body.action === "delete") {
      state.carousels = state.carousels.filter((c) => c.id !== car.id);
      saveState();
      sendJson(res, 200, getWorkspaceBundle(car.workspace_id));
      return true;
    }
    if (body.title !== undefined) car.title = body.title;
    if (body.themeId !== undefined) car.theme_id = body.themeId;
    if (body.caption !== undefined) car.caption = body.caption;
    if (body.slides !== undefined) car.slides_json = JSON.stringify(body.slides);
    if (body.customBg !== undefined) car.custom_bg = body.customBg;
    if (body.customFg !== undefined) car.custom_fg = body.customFg;
    if (body.customAccent !== undefined) car.custom_accent = body.customAccent;
    saveState();
    sendJson(res, 200, getWorkspaceBundle(car.workspace_id));
    return true;
  }

  if (pathname === "/api/automations" && req.method === "POST") {
    const ws = state.workspaces.find((w) => w.id === (body.workspaceId || "ws_maya")) || state.workspaces[0];
    const check = validateAutomationAgainstPlan(ws, body, body.id || null);
    if (!check.ok) { sendJson(res, 403, check); return true; }

    if (body.id) {
      const existing = state.automations.find((a) => a.id === body.id);
      if (existing) {
        Object.assign(existing, {
          name: body.name || existing.name,
          trigger_type: body.trigger_type || existing.trigger_type,
          post_target: body.post_target || existing.post_target,
          target_post_id: body.target_post_id || null,
          keywords_json: JSON.stringify(body.keywords || []),
          public_reply_enabled: body.public_reply_enabled ? 1 : 0,
          public_reply_variants_json: JSON.stringify(body.public_reply_variants || []),
          follow_gate_enabled: body.follow_gate_enabled ? 1 : 0,
          follow_gate_message: body.follow_gate_message || "",
          opening_card_enabled: body.opening_card_enabled ? 1 : 0,
          opening_card_text: body.opening_card_text || "",
          opening_button_label: body.opening_button_label || "Get Link",
          dm_message: body.dm_message || "",
          buttons_json: JSON.stringify(body.buttons || []),
          followup_enabled: body.followup_enabled ? 1 : 0,
          followup_delay: body.followup_delay || "2h",
          followup_message: body.followup_message || "",
          ai_prompt: body.ai_prompt || ""
        });
        saveState();
        sendJson(res, 200, getWorkspaceBundle(ws.id));
        return true;
      }
    }

    state.automations.unshift({
      id: "auto_" + crypto.randomUUID().slice(0, 8),
      workspace_id: ws.id,
      name: body.name || "Untitled Workflow",
      status: "active",
      trigger_type: body.trigger_type || "comment",
      post_target: body.post_target || "all_posts",
      target_post_id: body.target_post_id || null,
      keywords_json: JSON.stringify(body.keywords || ["LINK"]),
      public_reply_enabled: body.public_reply_enabled ? 1 : 0,
      public_reply_variants_json: JSON.stringify(body.public_reply_variants || ["Sent to your DMs."]),
      follow_gate_enabled: body.follow_gate_enabled ? 1 : 0,
      follow_gate_message: body.follow_gate_message || "",
      opening_card_enabled: body.opening_card_enabled ? 1 : 0,
      opening_card_text: body.opening_card_text || "",
      opening_button_label: body.opening_button_label || "Get Link",
      dm_message: body.dm_message || "Here is your requested link:",
      buttons_json: JSON.stringify(body.buttons || []),
      followup_enabled: body.followup_enabled ? 1 : 0,
      followup_delay: body.followup_delay || "2h",
      followup_message: body.followup_message || "",
      ai_prompt: body.ai_prompt || "",
      dms_sent: 0,
      link_taps: 0,
      created_at: new Date().toISOString()
    });
    saveState();
    sendJson(res, 200, getWorkspaceBundle(ws.id));
    return true;
  }

  if (pathname === "/api/automations/toggle" && req.method === "POST") {
    const auto = state.automations.find((a) => a.id === body.automationId);
    if (!auto) { sendJson(res, 404, { error: "Workflow not found." }); return true; }
    auto.status = auto.status === "active" ? "paused" : "active";
    saveState();
    sendJson(res, 200, getWorkspaceBundle(auto.workspace_id));
    return true;
  }

  if (pathname === "/api/automations/delete" && req.method === "POST") {
    const auto = state.automations.find((a) => a.id === body.automationId);
    const wsId = auto?.workspace_id || "ws_maya";
    state.automations = state.automations.filter((a) => a.id !== body.automationId);
    saveState();
    sendJson(res, 200, getWorkspaceBundle(wsId));
    return true;
  }

  if (pathname === "/api/automations/simulate" && req.method === "POST") {
    const result = executeAutomationTrigger(body);
    if (!result.ok) { sendJson(res, 400, result); return true; }
    sendJson(res, 200, { simulation: result, bundle: getWorkspaceBundle(body.workspaceId || "ws_maya") });
    return true;
  }

  if (pathname === "/api/automations/retrigger" && req.method === "POST") {
    const { workspaceId, automationId } = body;
    const ws = state.workspaces.find((w) => w.id === workspaceId);
    const spec = getPlanSpec(ws.plan);
    if (!spec.limits.retriggerPastComments) {
      sendJson(res, 403, { error: "Past-comment sweep requires Growth or Studio plan." });
      return true;
    }
    const auto = state.automations.find((a) => a.id === automationId);
    const kws = JSON.parse(auto?.keywords_json || '["LINK"]');
    const runs = ["alex.product", "nina.ux", "samir.dev"].map((handle) =>
      executeAutomationTrigger({
        workspaceId,
        automationId,
        senderHandle: handle,
        senderName: handle,
        incomingText: kws[0] || "LINK",
        isFollower: true,
        postTitle: "Past Comment Sweep"
      })
    );
    for (const c of state.comments || []) {
      if (c.workspace_id === workspaceId && !c.dm_sent && c.matched_keyword) {
        c.dm_sent = 1;
        c.public_reply = "Sent the link straight to your DMs.";
      }
    }
    saveState();
    sendJson(res, 200, { swept: runs.length, bundle: getWorkspaceBundle(workspaceId) });
    return true;
  }

  if (pathname === "/api/comments/action" && req.method === "POST") {
    const { workspaceId, commentId, action, replyText } = body;
    const c = (state.comments || []).find((x) => x.id === commentId);
    if (!c) { sendJson(res, 404, { error: "Comment not found." }); return true; }
    if (action === "hide") {
      c.is_hidden = 1;
    } else if (action === "reply") {
      c.public_reply = String(replyText || "").trim();
    } else if (action === "send_dm") {
      c.dm_sent = 1;
      c.public_reply = c.public_reply || "Just sent the link straight to your DMs.";
      const matchAuto = state.automations.find((a) => a.workspace_id === workspaceId) || state.automations[0];
      if (matchAuto) {
        executeAutomationTrigger({
          workspaceId,
          automationId: matchAuto.id,
          senderHandle: c.author_handle,
          senderName: c.author_handle,
          incomingText: c.matched_keyword || "LINK",
          isFollower: true,
          postTitle: c.post_title
        });
      }
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(workspaceId));
    return true;
  }

  if (pathname === "/api/inbox/reply" && req.method === "POST") {
    const { workspaceId, threadId, text, mediaUrl = "", simulateUserIncoming = false } = body;
    const ws = state.workspaces.find((w) => w.id === workspaceId);
    const spec = getPlanSpec(ws.plan);
    const thread = state.inbox_threads.find((t) => t.id === threadId);
    if (!thread) { sendJson(res, 404, { error: "Conversation not found." }); return true; }

    const now = new Date().toISOString();
    if (simulateUserIncoming) {
      const msgText = text || "Just saw your follow-up — ready when you are!";
      state.inbox_messages.push({
        id: "msg_" + crypto.randomUUID().slice(0, 8),
        thread_id: thread.id,
        sender: "them",
        body: msgText,
        buttons_json: "[]",
        shared_reel_title: "",
        via_automation: "",
        media_url: "",
        created_at: now
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
        error: "Starter includes a read-only Inbox. Upgrade to Growth ($12/mo) or Studio ($29/mo) to reply directly."
      });
      return true;
    }

    const ageHours = (Date.now() - new Date(thread.last_user_message_at).getTime()) / 3600000;
    if (ageHours > 24) {
      sendJson(res, 400, {
        code: "WINDOW_EXPIRED",
        error: "Instagram's 24-hour messaging window has expired. Wait for the user to reply or click Simulate Incoming Message."
      });
      return true;
    }

    const bodyText = String(text || "").trim().slice(0, 1000);
    state.inbox_messages.push({
      id: "msg_" + crypto.randomUUID().slice(0, 8),
      thread_id: thread.id,
      sender: "me",
      body: bodyText || "Sent an attachment",
      buttons_json: "[]",
      shared_reel_title: "",
      via_automation: "",
      media_url: mediaUrl,
      created_at: now
    });
    thread.last_message_preview = (bodyText || "Attachment").slice(0, 90);
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
    if (patch.crm_notes !== undefined) t.crm_notes = String(patch.crm_notes);
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

  if (pathname === "/api/notifications/read-all" && req.method === "POST") {
    for (const n of state.notifications || []) {
      if (!body.workspaceId || n.workspace_id === body.workspaceId) n.is_read = 1;
    }
    saveState();
    sendJson(res, 200, getWorkspaceBundle(body.workspaceId || "ws_maya"));
    return true;
  }

  if (pathname === "/api/campaigns/apply" && req.method === "POST") {
    state.campaign_applications = state.campaign_applications || [];
    state.campaign_applications.push({ id: "cmp_" + crypto.randomUUID().slice(0, 8), ...body, created_at: new Date().toISOString() });
    saveState();
    sendJson(res, 200, { ok: true, message: "Application received! Our partnerships team replies within 48 hours." });
    return true;
  }

  sendJson(res, 404, { error: `Unknown API endpoint: ${pathname}` });
  return true;
}
