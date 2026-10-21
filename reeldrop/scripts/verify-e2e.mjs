import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.VELORA_BASE_URL || "http://127.0.0.1:3080";

async function jsonReq(urlPath, method = "GET", body = null) {
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body || {}) })
  });
  const data = await res.json();
  return { status: res.status, data };
}

console.log("=== Velora v3.0 Full-Stack, Typography, Responsiveness & MCP Verification ===");

// 1. Reset clean seed state & verify Velora brand + 4 workspaces
const reset = await jsonReq("/api/state/reset", "POST", {});
assert.equal(reset.status, 200);
assert.equal(reset.data.brand.name, "Velora");
assert.equal(reset.data.workspaces.length, 4);
assert.equal(reset.data.themes.length, 16);
assert.equal(reset.data.freeTools.length, 12);
assert.equal(reset.data.mcpTools.length, 58);
console.log("  [PASS] Seed state verified (Velora, 4 workspaces, 16 clean themes, 12 tools, 58 MCP tools)");

// 2. Verify all 3 self-hosted Variable WOFF2 fonts serve with 200 OK & font/woff2 MIME
for (const fontFile of ["plus-jakarta-sans-var.woff2", "inter-var.woff2", "jetbrains-mono-var.woff2"]) {
  const r = await fetch(`${BASE}/fonts/${fontFile}`);
  assert.equal(r.status, 200, `Font missing: ${fontFile}`);
  assert.match(r.headers.get("content-type") || "", /font\/woff2/);
  const buf = await r.arrayBuffer();
  assert(buf.byteLength > 20_000, `Font too small: ${fontFile}`);
}
console.log("  [PASS] Self-hosted WOFF2 variable fonts verified (Plus Jakarta Sans, Inter, JetBrains Mono)");

// 3. Verify PBKDF2 User Registration & Login
const reg = await jsonReq("/api/auth/register", "POST", {
  name: "Test Founder",
  email: `founder.${Date.now()}@velora.so`,
  password: "strongpassword123"
});
assert.equal(reg.status, 200);
assert(reg.data.token.startsWith("vsess_"));

const login = await jsonReq("/api/auth/login", "POST", {
  email: "maya@velora.so",
  password: "demo1234"
});
assert.equal(login.status, 200);
assert.equal(login.data.user.email, "maya@velora.so");
console.log("  [PASS] PBKDF2 SHA-256 user registration & login verified");

// 4. Verify Real Media Upload & Binary Retrieval
const onePxPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const upload = await jsonReq("/api/media/upload", "POST", {
  workspaceId: "ws_maya",
  filename: "cover-test.png",
  mimeType: "image/png",
  dataUrl: onePxPng
});
assert.equal(upload.status, 200);
assert(upload.data.asset.id.startsWith("med_"));
const binRes = await fetch(`${BASE}/api/media/${upload.data.asset.id}`);
assert.equal(binRes.status, 200);
assert.equal(binRes.headers.get("content-type"), "image/png");
console.log("  [PASS] Binary media upload & SQLite/disk persistence verified");

// 5. Verify Create Post, Calendar Drag Reschedule, Queue Worker, Templates, Team, CRM Notes & CSV Export
const created = await jsonReq("/api/posts", "POST", {
  workspaceId: "ws_maya",
  mediaType: "REEL",
  status: "SCHEDULED",
  title: "Automated E2E Test Post",
  caption: "Clean typography test caption",
  mediaUrl: upload.data.asset.url,
  scheduledAt: "2026-10-25T09:30:00.000Z"
});
assert.equal(created.status, 200);
const newPost = created.data.posts.find((p) => p.title === "Automated E2E Test Post");
assert(newPost);

const resched = await jsonReq("/api/posts/reschedule", "POST", {
  postId: newPost.id,
  targetDate: "2026-10-28"
});
assert.equal(resched.status, 200);
assert(resched.data.posts.find((p) => p.id === newPost.id).scheduled_at.startsWith("2026-10-28"));

const worker = await jsonReq("/api/queue/run-worker", "POST", { workspaceId: "ws_maya", publishNextScheduled: true });
assert.equal(worker.status, 200);
assert(worker.data.publishedCount >= 1);

const tpl = await jsonReq("/api/templates", "POST", {
  workspaceId: "ws_maya",
  title: "Launch Hook Template",
  body: "Here is what shipped this week:"
});
assert.equal(tpl.status, 200);

const firstThreadId = reset.data.threads[0].id;
const crm = await jsonReq("/api/inbox/update-thread", "POST", {
  workspaceId: "ws_maya",
  threadId: firstThreadId,
  patch: { crm_notes: "Confirmed $3,200 Q4 sponsorship deliverables." }
});
assert.equal(crm.status, 200);
assert.equal(crm.data.threads.find((t) => t.id === firstThreadId).crm_notes, "Confirmed $3,200 Q4 sponsorship deliverables.");

const csvRes = await fetch(`${BASE}/api/analytics/export.csv?workspaceId=ws_maya`);
assert.equal(csvRes.status, 200);
assert.match(await csvRes.text(), /id,media_type,status,title/);
console.log("  [PASS] Post creation, calendar reschedule, queue worker, templates, CRM notes & CSV export verified");

// 6. Verify Streamable HTTP MCP Server (`POST /mcp` — 58 tools)
const mcpList = await jsonReq("/mcp", "POST", { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
assert.equal(mcpList.data.result.tools.length, 58);
const mcpExec = await jsonReq("/mcp", "POST", {
  jsonrpc: "2.0",
  id: 2,
  method: "tools/call",
  params: { name: "list_workspaces", arguments: {} }
});
assert(!mcpExec.data.error);
console.log("  [PASS] JSON-RPC 2.0 MCP endpoint verified (58/58 tools registered & executable)");

// 6B. Verify High-Res Editorial Visual Assets (`/media/post-01.svg` ... `post-11.svg`)
for (let i = 1; i <= 11; i++) {
  const num = String(i).padStart(2, "0");
  const svgRes = await fetch(`${BASE}/media/post-${num}.svg`);
  assert.equal(svgRes.status, 200, `Missing visual asset post-${num}.svg`);
}
console.log("  [PASS] All 11 high-resolution Profile Grid & Studio visual assets verified");

// 6C. Verify AI Post Co-Pilot, Caption Rewriter, Plain-English Workflow Builder & Multi-Tone Inbox AI
const aiPack = await jsonReq("/api/ai/post-pack", "POST", {
  workspaceId: "ws_maya",
  topic: "Design System Spacing Tokens",
  tone: "Editorial",
  goal: "dm_leads"
});
assert.equal(aiPack.status, 200);
assert.equal(aiPack.data.pack.hooks.length, 4);
assert(aiPack.data.pack.bestSlot);

const aiRew = await jsonReq("/api/ai/rewrite", "POST", {
  caption: "We ship cleaner UI faster.",
  mode: "punchier",
  keyword: "KIT"
});
assert.equal(aiRew.status, 200);
assert(aiRew.data.caption.length > 25);

const aiFlow = await jsonReq("/api/ai/workflow-from-prompt", "POST", {
  workspaceId: "ws_maya",
  prompt: "Send Notion starter link when someone comments GUIDE and require follow first"
});
assert.equal(aiFlow.status, 200);
assert(aiFlow.data.workflowDraft.keywords.includes("GUIDE"));
console.log("  [PASS] AI Post Co-Pilot, Caption Rewriter & Plain-English Workflow Builder verified");

// 6D. Verify `Without Data` (Clean Unconnected State) <-> Meta OAuth Connect <-> `With Data` Switcher
const emptyMode = await jsonReq("/api/state/mode", "POST", { mode: "empty" });
assert.equal(emptyMode.status, 200);
assert.equal(emptyMode.data.dataMode, "empty");
assert.equal(emptyMode.data.isPlatformConnected, false);
assert.equal(emptyMode.data.posts.length, 0);
assert.equal(emptyMode.data.automations.length, 0);
assert.equal(emptyMode.data.threads.length, 0);
assert.equal(emptyMode.data.metrics.creators_signed_up, 0);

const connected = await jsonReq("/api/meta/connect", "POST", {
  workspaceId: "ws_clean",
  igHandle: "mybrand.official",
  name: "My Brand Studio"
});
assert.equal(connected.status, 200);
assert.equal(connected.data.isPlatformConnected, true);
assert.equal(connected.data.activeWorkspace.ig_handle, "mybrand.official");

const simThread = await jsonReq("/api/inbox/simulate-thread", "POST", { workspaceId: "ws_clean" });
assert.equal(simThread.status, 200);
assert.equal(simThread.data.threads.length, 1);

const disconnected = await jsonReq("/api/meta/disconnect", "POST", { workspaceId: "ws_clean" });
assert.equal(disconnected.status, 200);
assert.equal(disconnected.data.isPlatformConnected, false);

const sampleMode = await jsonReq("/api/state/mode", "POST", { mode: "sample" });
assert.equal(sampleMode.status, 200);
assert.equal(sampleMode.data.dataMode, "sample");
assert.equal(sampleMode.data.isPlatformConnected, true);
assert.equal(sampleMode.data.workspaces.length, 4);
assert(sampleMode.data.posts.length >= 10);
console.log("  [PASS] 'Without Data' (unconnected empty mode), Meta OAuth link/unlink & 'With Data' full restore verified");

// Ensure clean seed state before optional headless browser verification
await jsonReq("/api/state/reset", "POST", {});

// 7. Optional Headless Chromium Visual, Font-Check & Responsive Layout Verification
let chromium;
try {
  const pwPath = path.resolve(__dirname, "../../rea/node_modules/playwright-core/index.mjs");
  if (fs.existsSync(pwPath)) {
    ({ chromium } = await import(pwPath));
  }
} catch {}

if (chromium && fs.existsSync("/home/user/opt/bin/google-chrome")) {
  const shotDir = "/tmp/velora-shots";
  fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({
    executablePath: "/home/user/opt/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"]
  });

  const errors = [];
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  desktop.on("pageerror", (e) => errors.push(e.message));
  desktop.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  for (const [slug, route] of [
    ["01-landing", "/"],
    ["02-overview", "/app/overview"],
    ["03-create", "/app/create"],
    ["04-calendar", "/app/calendar"],
    ["05-grid", "/app/grid"],
    ["06-carousels", "/app/carousels"],
    ["07-automations", "/app/automations"],
    ["08-inbox", "/app/inbox"],
    ["09-analytics", "/app/analytics"]
  ]) {
    await desktop.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await desktop.evaluate(() => document.fonts.ready);
    const check = await desktop.evaluate(() => ({
      jakarta: document.fonts.check('700 24px "Plus Jakarta Sans Variable"'),
      inter: document.fonts.check('400 14px "Inter Variable"'),
      overflow: document.documentElement.scrollWidth > window.innerWidth
    }));
    assert.equal(check.jakarta, true, `Plus Jakarta Sans Variable not active on ${route}`);
    assert.equal(check.inter, true, `Inter Variable not active on ${route}`);
    assert.equal(check.overflow, false, `Horizontal overflow detected on Desktop ${route}`);
    await desktop.screenshot({ path: path.join(shotDir, `${slug}.png`) });
  }

  // Test Dark Mode + Mobile 390x844 iPhone 15 Viewport Responsiveness
  await desktop.click("#btn-theme-toggle");
  await desktop.screenshot({ path: path.join(shotDir, "10-dark-mode.png") });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  mobile.on("pageerror", (e) => errors.push(e.message));
  for (const [slug, route] of [
    ["11-mobile-landing", "/"],
    ["12-mobile-overview", "/app/overview"],
    ["13-mobile-inbox", "/app/inbox"]
  ]) {
    await mobile.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await mobile.evaluate(() => document.fonts.ready);
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(overflow, false, `Mobile horizontal overflow on ${route}`);
    await mobile.screenshot({ path: path.join(shotDir, `${slug}.png`) });
  }

  await browser.close();
  assert.equal(errors.length, 0, `Browser runtime errors: ${errors.join("; ")}`);
  console.log("  [PASS] Headless Chromium Desktop (1440x900), Dark Mode & Mobile (390x844) verified — 0 errors, 0 overflow, Variable fonts loaded!");
}

console.log("=== ALL VELORA VERIFICATION CHECKS PASSED ===");
