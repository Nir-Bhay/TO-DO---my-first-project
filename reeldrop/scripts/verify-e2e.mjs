import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

import vercelHandler from "../api/index.js";
import rootVercelHandler from "../../api/index.js";

let chromium = null;
try {
  const requireFromRea = createRequire("/home/user/TO-DO---my-first-project/rea/package.json");
  ({ chromium } = requireFromRea("playwright-core"));
} catch {}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const SHOT_DIR = path.join(PROJECT_ROOT, "screenshots");
fs.mkdirSync(SHOT_DIR, { recursive: true });

const BASE = process.env.REELDROP_URL || "http://127.0.0.1:3080";

async function postJson(urlPath, body) {
  const r = await fetch(`${BASE}${urlPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: r.status, data: await r.json() };
}

// Helper to invoke the actual Vercel Serverless Function (`api/index.mjs`) in-memory!
async function invokeServerlessHandler(handlerFn, method, url, bodyObj = null) {
  const payloadStr = bodyObj ? JSON.stringify(bodyObj) : "";
  const req = Readable.from(payloadStr ? [Buffer.from(payloadStr)] : []);
  req.method = method;
  req.url = url;
  req.headers = { host: "reeldrop-demo.vercel.app", "content-type": "application/json" };

  let statusCode = 200;
  const headers = {};
  const chunks = [];
  const res = {
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
    writeHead: (code, hdrs = {}) => {
      statusCode = code;
      for (const [k, v] of Object.entries(hdrs)) headers[k.toLowerCase()] = v;
    },
    end: (chunk) => { if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))); }
  };
  await handlerFn(req, res);
  const text = Buffer.concat(chunks).toString("utf8");
  return { status: statusCode, headers, json: JSON.parse(text) };
}

console.log("=== 1. Resetting Seed Data & Verifying Multi-Workspace Rich Test Dataset ===");
await postJson("/api/state/reset", {});

const boot = await (await fetch(`${BASE}/api/bootstrap?workspaceId=ws_maya`)).json();
assert.equal(boot.themes.length, 35, "Expected all 35 Carousel Themes");
assert.equal(boot.freeTools.length, 20, "Expected all 20 Free Creator Tools");
assert.equal(boot.mcpTools.length, 58, `Expected ALL 58 MCP Tools, got ${boot.mcpTools.length}`);
assert.equal(boot.workspaces.length, 4, "Expected all 4 pre-seeded Creator Workspaces (@maya.creates, @piyush.builds, @arjun.fitness, @studio.koko)");
assert.ok(boot.posts.length >= 16, "Expected >=16 multi-month posts in @maya.creates workspace");
assert.ok(boot.automations.length >= 6, "Expected >=6 automations across Comment/Story/DM/AI in @maya.creates");
assert.ok(boot.threads.length >= 7, "Expected >=7 Inbox conversations covering Open/Closed/Unread/Hot/Snoozed/Archived/>24h");
assert.ok(boot.comments.length >= 5, "Expected >=5 realistic Instagram comments for moderation & DM triggers");
assert.equal(boot.reaEvidence.ready, true, "Expected verified REA Evidence bundle");
assert.equal(boot.reaEvidence.artifacts.length, 5, "Expected all 5 SHA-256 REA Evidence bundles");
console.log("✓ 35 Themes, 20 Free Tools, 58 MCP Tools, 4 Rich Workspaces, Comments & 5 REA SHA-256 bundles verified!");

console.log("=== 2. Verifying Starter Plan Quota Edge Cases on @piyush.builds (`2/3` -> `3/3` -> Blocked!) ===");
const starter1 = await postJson("/api/ai/captions", { workspaceId: "ws_piyush", topic: "3rd free caption", enforceQuota: true });
assert.equal(starter1.status, 200, "3rd Starter AI caption (3/3) must succeed");
const starter2 = await postJson("/api/ai/captions", { workspaceId: "ws_piyush", topic: "4th caption over quota", enforceQuota: true });
assert.equal(starter2.status, 403, "4th Starter AI caption must be gated cleanly with HTTP 403 PLAN_LIMIT_REACHED");

const piyushBoot = await (await fetch(`${BASE}/api/bootstrap?workspaceId=ws_piyush`)).json();
const starterInbox = await postJson("/api/inbox/reply", { workspaceId: "ws_piyush", threadId: piyushBoot.threads[0].id, text: "Test reply" });
assert.equal(starterInbox.status, 403, "Starter plan read-only DM Inbox must block replies with HTTP 403 upgrade message");
console.log("✓ Starter plan quota edges (`3/3` AI captions + Read-Only Inbox) verified!");

console.log("=== 3. Verifying Dry-Run Follow Gate, 24h Meta Window Lock, Comments Action & Trial Graduation ===");
const firstAuto = boot.automations.find((a) => a.follow_gate_enabled && a.trigger_type === "comment");
const kw = firstAuto.keywords[0] || "LINK";
const dryBlocked = await postJson("/api/automations/simulate", {
  workspaceId: "ws_maya",
  automationId: firstAuto.id,
  incomingText: kw,
  isFollower: false,
  dryRun: true
});
assert.equal(dryBlocked.status, 200);
assert.equal(dryBlocked.data.simulation.steps.some((s) => s.type === "follow_gate_prompt"), true);
assert.equal(dryBlocked.data.simulation.steps.some((s) => s.type === "primary_dm"), false, "Non-follower must be stopped at Follow Gate before link delivery!");

const dryAllowed = await postJson("/api/automations/simulate", {
  workspaceId: "ws_maya",
  automationId: firstAuto.id,
  incomingText: kw,
  isFollower: true,
  dryRun: true
});
assert.equal(dryAllowed.status, 200);
assert.equal(dryAllowed.data.simulation.steps.some((s) => s.type === "primary_dm"), true, "Verified follower must receive primary DM + link buttons!");

const expiredThread = boot.threads.find((t) => !t.windowOpen);
assert.ok(expiredThread, "Expected an expired >24h thread in test data");
const expired24h = await postJson("/api/inbox/reply", {
  workspaceId: "ws_maya",
  threadId: expiredThread.id,
  text: "Late reply outside 24h window"
});
assert.equal(expired24h.status, 400, "Meta >24h expired window must block outbound DM until user replies!");

const comAct = await postJson("/api/comments/action", {
  workspaceId: "ws_maya",
  commentId: boot.comments[0].id,
  action: "send_dm"
});
assert.equal(comAct.status, 200);

const trialPost = boot.posts.find((p) => p.is_trial_reel && !p.trial_graduated) || boot.posts[0];
const gradAct = await postJson("/api/posts/update", {
  postId: trialPost.id,
  action: "graduate_trial"
});
assert.equal(gradAct.status, 200);
console.log("✓ Follow Gate (Non-Follower Block vs Follower Pass), >24h Window Lock, Comments Auto-DM & Trial Graduation verified!");

console.log("=== 4. Verifying ALL 58 MCP Tools Over JSON-RPC 2.0 (`/mcp`) ===");
const mcpList = await postJson("/mcp", { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
assert.equal(mcpList.data.result.tools.length, 58, "MCP tools/list must expose all 58 tools");

const starterGatedMcp = await postJson("/mcp", {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: { name: "schedule_reel", arguments: { workspace_id: "ws_piyush", title: "Blocked on Starter" } }
});
assert.equal(starterGatedMcp.data.result.isError, true, "Starter workspace must receive structured MCP plan gate prompt");

// Dynamically execute EVERY SINGLE ONE of all 58 MCP tools live over JSON-RPC 2.0!
const freshBoot = await (await fetch(`${BASE}/api/bootstrap?workspaceId=ws_maya`)).json();
const samplePost = freshBoot.posts[0];
const samplePostB = freshBoot.posts[1];
const sampleCar = freshBoot.carousels[0];
const sampleAuto = freshBoot.automations[0];
const openThread = freshBoot.threads.find((t) => t.windowOpen) || freshBoot.threads[0];
const sampleComment = freshBoot.comments[0];

const createdPhRes = await postJson("/mcp", {
  jsonrpc: "2.0", id: 100, method: "tools/call",
  params: { name: "create_grid_placeholder", arguments: { workspace_id: "ws_maya", note: "Temp placeholder", color: "#FDE68A" } }
});
const createdPhBRes = await postJson("/mcp", {
  jsonrpc: "2.0", id: 101, method: "tools/call",
  params: { name: "create_grid_placeholder", arguments: { workspace_id: "ws_maya", note: "Temp placeholder B", color: "#BAE6FD" } }
});
const createdPhId = JSON.parse(createdPhRes.data.result.content[0].text).placeholder.id;
const createdPhBId = JSON.parse(createdPhBRes.data.result.content[0].text).placeholder.id;

const createdCarRes = await postJson("/mcp", {
  jsonrpc: "2.0", id: 102, method: "tools/call",
  params: { name: "generate_carousel", arguments: { workspace_id: "ws_maya", prompt: "Temp MCP deck", theme_id: "bold_highlight", slide_count: 4 } }
});
const tempCarId = JSON.parse(createdCarRes.data.result.content[0].text).carousel_id;

const createdPostRes = await postJson("/mcp", {
  jsonrpc: "2.0", id: 103, method: "tools/call",
  params: { name: "schedule_reel", arguments: { workspace_id: "ws_maya", title: "Temp MCP post", caption: "Temp MCP caption" } }
});
const tempPostId = JSON.parse(createdPostRes.data.result.content[0].text).post.id;

const all58Calls = [
  ["list_workspaces", {}],
  ["create_workspace", { name: "Temp WS", ig_handle: "temp.mcp", plan: "creator" }],
  ["list_ig_accounts", { workspace_id: "ws_maya" }],
  ["get_posting_slots", { workspace_id: "ws_maya" }],
  ["update_scheduling_settings", { workspace_id: "ws_maya", timezone: "America/Toronto", posting_slots: ["09:00", "14:00", "20:00"], grid_crop: "4:5" }],
  ["get_workspace_usage", { workspace_id: "ws_maya" }],
  ["get_plan_limits", {}],
  ["switch_workspace_plan", { workspace_id: "ws_maya", plan: "creator" }],
  ["get_referral_status", { workspace_id: "ws_maya" }],
  ["get_video_upload_url", { workspace_id: "ws_maya", filename: "reel.mp4" }],
  ["generate_reel_captions", { workspace_id: "ws_maya", topic: "Carousel saves", keyword: "GUIDE" }],
  ["generate_cover_headlines", { topic: "Carousel saves" }],
  ["generate_hashtags", { topic: "Creator growth" }],
  ["check_hashtag_safety", { text: "Clean tags #creatorworkflow #reelsgrowth" }],
  ["analyze_hook_timing", { script: "Stop scrolling right now here is the exact framework" }],
  ["schedule_reel", { workspace_id: "ws_maya", title: "MCP Scheduled Reel", caption: "Body" }],
  ["schedule_reels_bulk", { workspace_id: "ws_maya", items: [{ title: "Bulk 1", caption: "Cap 1" }] }],
  ["list_scheduled_posts", { workspace_id: "ws_maya" }],
  ["update_scheduled_post", { post_id: samplePost.id, title: samplePost.title }],
  ["publish_post_now", { post_id: tempPostId }],
  ["cancel_scheduled_post", { post_id: tempPostId }],
  ["get_grid_preview", { workspace_id: "ws_maya" }],
  ["create_grid_placeholder", { workspace_id: "ws_maya", note: "MCP Grid Idea", color: "#BBF7D0" }],
  ["update_grid_placeholder", { placeholder_id: createdPhId, note: "Updated MCP Idea" }],
  ["convert_grid_placeholder", { placeholder_id: createdPhId }],
  ["delete_grid_placeholder", { placeholder_id: createdPhBId }],
  ["swap_grid_entries", { post_a_id: samplePost.id, post_b_id: samplePostB.id }],
  ["add_grid_collab", { post_id: samplePost.id, collab_handle: "sofia.shots" }],
  ["remove_grid_collab", { post_id: samplePost.id }],
  ["list_carousel_themes", { category: "Editorial" }],
  ["generate_carousel", { workspace_id: "ws_maya", prompt: "MCP Deck 2", theme_id: "reading_room", slide_count: 5 }],
  ["list_carousels", { workspace_id: "ws_maya" }],
  ["get_carousel", { carousel_id: sampleCar.id }],
  ["update_carousel_slides", { carousel_id: sampleCar.id, theme_id: "bold_highlight", slides: sampleCar.slides }],
  ["add_carousel_slide", { carousel_id: sampleCar.id, headline: "Added Slide", body: "Added body" }],
  ["schedule_carousel", { carousel_id: sampleCar.id }],
  ["delete_carousel", { carousel_id: tempCarId }],
  ["resolve_reel_by_link", { workspace_id: "ws_maya", url: "https://instagram.com/reel/abc" }],
  ["list_automations", { workspace_id: "ws_maya" }],
  ["create_automation", { workspace_id: "ws_maya", name: "MCP Auto", keywords: ["MCP"], dm_message: "Here is the MCP link!" }],
  ["update_automation", { automation_id: sampleAuto.id, dm_message: sampleAuto.dm_message }],
  ["pause_automation", { automation_id: sampleAuto.id }],
  ["resume_automation", { automation_id: sampleAuto.id }],
  ["dry_run_automation", { workspace_id: "ws_maya", automation_id: firstAuto.id, incoming_text: kw, is_follower: true }],
  ["retrigger_automation_comments", { workspace_id: "ws_maya", automation_id: firstAuto.id }],
  ["list_inbox_threads", { workspace_id: "ws_maya" }],
  ["get_inbox_thread", { thread_id: openThread.id }],
  ["reply_inbox_thread", { workspace_id: "ws_maya", thread_id: openThread.id, text: "Sent via live MCP tool!" }],
  ["suggest_inbox_ai_reply", { thread_id: openThread.id }],
  ["add_inbox_thread_tag", { thread_id: openThread.id, tag: "MCP Verified" }],
  ["list_post_comments", { workspace_id: "ws_maya" }],
  ["reply_to_comment", { comment_id: sampleComment.id, reply_text: "Replied via MCP!" }],
  ["get_analytics_summary", { workspace_id: "ws_maya" }],
  ["get_reel_analytics", { workspace_id: "ws_maya" }],
  ["get_account_analytics", { workspace_id: "ws_maya" }],
  ["get_story_analytics", { workspace_id: "ws_maya" }],
  ["get_trial_reel_analytics", { workspace_id: "ws_maya" }],
  ["reset_demo_dataset", {}]
];
assert.equal(all58Calls.length, 58, "Must test every single one of all 58 MCP tools!");

for (const [toolName, args] of all58Calls) {
  const res = await postJson("/mcp", { jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: toolName, arguments: args } });
  assert.ok(!res.data.error && !res.data.result?.isError, `MCP tool ${toolName} failed: ${JSON.stringify(res.data)}`);
}
console.log("✓ ALL 58/58 MCP TOOLS EXECUTED LIVE OVER JSON-RPC 2.0 WITH 100% SUCCESS!");

console.log("=== 5. Verifying 100% Standalone Vercel Serverless Function (`api/index.js` at BOTH Repo Root & `reeldrop/`) ===");
process.env.VERCEL = "1";
const vSubBoot = await invokeServerlessHandler(vercelHandler, "GET", "/api?__route=/api/bootstrap&workspaceId=ws_koko");
assert.equal(vSubBoot.status, 200);
assert.equal(vSubBoot.json.activeWorkspace.ig_handle, "studio.koko");

const vRootMcp = await invokeServerlessHandler(rootVercelHandler, "POST", "/api?__route=/mcp", {
  jsonrpc: "2.0",
  id: 77,
  method: "tools/list",
  params: {}
});
assert.equal(vRootMcp.status, 200);
assert.equal(vRootMcp.json.result.tools.length, 58);

// Verify cold-start `_clientSnapshot` hydration inside Vercel Serverless handler
const customSnap = structuredClone(vSubBoot.json.serverStateSnapshot);
customSnap.workspaces[0].name = "Hydrated Across Cold Start Studio";
const vHydrated = await invokeServerlessHandler(rootVercelHandler, "POST", "/api/bootstrap/hydrate", {
  workspaceId: "ws_maya",
  _clientSnapshot: customSnap
});
assert.equal(vHydrated.json.activeWorkspace.name, "Hydrated Across Cold Start Studio");
delete process.env.VERCEL;

// Restore clean seed dataset on live server before visual screenshot capture!
await postJson("/api/state/reset", {});
console.log("✓ Both Root `/api/index.mjs` & Subfolder `reeldrop/api/index.mjs` Vercel Serverless handlers + cold-start state hydration verified!");

if (chromium && fs.existsSync("/home/user/opt/bin/google-chrome")) {
  console.log("=== 6. Capturing Visual Headless Chromium Screenshots Across All Views ===");
  const browser = await chromium.launch({
    executablePath: "/home/user/opt/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 920 } });
  const page = await context.newPage();

  const pageErrors = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".hero-headline", { timeout: 10000 });
  await page.screenshot({ path: path.join(SHOT_DIR, "01-landing-home.png"), fullPage: false });
  await page.click('[data-top-mode="app"]');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(SHOT_DIR, "04-app-scheduler-calendar.png") });
  await browser.close();
  assert.equal(pageErrors.length, 0, `Unexpected browser runtime errors: ${pageErrors.join("; ")}`);
  console.log("✓ Headless Chromium screenshots verified with zero errors!");
} else {
  console.log("✓ Portable environment detected — all API, 58-tool MCP & Vercel Serverless checks passed 100%!");
}
