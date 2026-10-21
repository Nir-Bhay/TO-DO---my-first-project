const STORAGE_SNAPSHOT_KEY = "velora_state_snapshot_v4";
const STORAGE_TOKEN_KEY = "velora_session_token_v4";
const STORAGE_USER_KEY = "velora_user_v4";

export const store = {
  bundle: null,
  activeWorkspaceId: localStorage.getItem("velora_ws_id") || "ws_maya",
  theme: localStorage.getItem("velora_theme") || "light",
  currency: "USD",
  billing: "yearly",
  currentUser: (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "null"); } catch { return null; }
  })(),
  token: localStorage.getItem(STORAGE_TOKEN_KEY) || "",
  mobileSidebarOpen: false,
  mobileInboxChatOpen: false,
  ui: {
    heroTab: "workflow",
    calendarMode: "month",
    calendarStatus: "ALL",
    composerMediaType: "POST",
    composerMediaUrl: "",
    composerMediaDims: "",
    composerMediaFit: "cover",
    composerAspect: "4:5",
    composerPreviewTab: "feed",
    composerCaptionExpanded: false,
    composerSlidesMedia: [],
    composerCoverStyle: "noir",
    composerCoverLabel: "SYSTEM DESIGN NOTES",
    composerScheduledDate: "",
    composerTitle: "",
    composerCaption: "",
    composerHashtags: "",
    composerFirstComment: "",
    composerCollab: "",
    composerLocation: "Bengaluru · Studio",
    composerAutomationId: "",
    composerIsTrial: false,
    uploadProgress: { active: false, pct: 0, label: "" },
    cropStudio: {
      open: false,
      srcUrl: "",
      origW: 1080,
      origH: 1350,
      aspect: "4:5",
      fitMode: "contain",
      bgStyle: "blur",
      zoom: 100,
      panX: 0,
      panY: 0,
      padding: 44
    },
    aiTopic: "",
    aiTone: "Editorial",
    aiGoal: "dm_keyword",
    aiPack: null,
    selectedGridPostId: null,
    gridShowStats: true,
    selectedCarouselId: null,
    selectedSlideIndex: 0,
    expandedAutoIds: { auto_maya_1: true },
    autoFilterStatus: "all",
    autoTriggerFilter: "all",
    autoPromptText: "",
    selectedThreadId: null,
    inboxTab: "dms",
    inboxFilter: "open",
    inboxTagFilter: "all",
    inboxTone: "helpful",
    inboxThreadSummary: null,
    inboxCrmOpen: { deal: true, profile: true, templates: false },
    inboxSearch: "",
    analyticsRange: "30d",
    settingsTab: "general",
    activeToolSlug: null,
    toolsCategory: "All",
    toolsSearch: "",
    mcpSelectedTool: "list_workspaces",
    mcpLastResponse: null,
    chatSimMessages: [],
    chatSimTyping: false,
    landingSimScenario: "repo",
    landingThemeId: "swiss_white",
    landingGridCrop: "4:5",
    landingChatMsgs: [
      { role: "them", badge: "Comment on Reel", text: "Cleanest design system breakdown all week — commenting REPO!" },
      { role: "me", badge: "Auto-Sent in 0.6s", text: "Hey! Here is the complete Figma token starter file + Notion checklist from my Reel:", cta: "Open Token Starter Kit ->" }
    ],
    calcPostsPerWeek: 6,
    calcCommentsPerPost: 85,
    openFaqIdx: 0
  }
};

function persistSnapshot(bundle) {
  if (!bundle) return;
  if (bundle.serverStateSnapshot) {
    try {
      localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(bundle.serverStateSnapshot));
    } catch {
      try {
        const light = { ...bundle.serverStateSnapshot, media_assets: [] };
        localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(light));
      } catch {}
    }
  }
  store.bundle = bundle;
  if (bundle.activeWorkspace?.id) {
    store.activeWorkspaceId = bundle.activeWorkspace.id;
    localStorage.setItem("velora_ws_id", bundle.activeWorkspace.id);
  }
}

function getSavedSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, method = "GET", body = null) {
  const payload = body ? { ...body } : {};
  const snap = getSavedSnapshot();
  if (method !== "GET" && snap && path !== "/api/state/reset" && path !== "/api/state/mode" && path !== "/api/media/upload") {
    payload._clientSnapshot = snap;
  }

  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(store.token ? { Authorization: `Bearer ${store.token}` } : {})
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(payload) })
  });

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.code = data.code;
    throw err;
  }
  if (data.workspaces && data.activeWorkspace) persistSnapshot(data);
  if (data.bundle?.workspaces) persistSnapshot(data.bundle);
  return data;
}

export async function bootstrapApp(workspaceId = store.activeWorkspaceId) {
  const savedSnap = getSavedSnapshot();
  if (savedSnap) {
    return apiRequest("/api/bootstrap/hydrate", "POST", { workspaceId, _clientSnapshot: savedSnap });
  }
  return apiRequest(`/api/bootstrap?workspaceId=${encodeURIComponent(workspaceId)}`, "GET");
}

export async function registerAccount(payload) {
  const res = await apiRequest("/api/auth/register", "POST", payload);
  store.token = res.token;
  store.currentUser = res.user;
  localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
  return res;
}

export async function loginAccount(payload) {
  const res = await apiRequest("/api/auth/login", "POST", payload);
  store.token = res.token;
  store.currentUser = res.user;
  localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.user));
  return res;
}

export function logoutAccount() {
  store.token = "";
  store.currentUser = null;
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
}

export function inspectImageDimensions(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || 1080, height: img.naturalHeight || 1350 });
    img.onerror = () => resolve({ width: 1080, height: 1350 });
    img.src = url;
  });
}

export async function uploadMediaFile(file, workspaceId = store.activeWorkspaceId, onProgress = null) {
  const report = (pct, label) => {
    store.ui.uploadProgress = { active: pct < 100, pct, label };
    if (onProgress) onProgress(pct, label);
  };

  report(18, `Reading ${file.name}...`);
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        const pct = 18 + Math.round((ev.loaded / ev.total) * 42);
        report(pct, `Processing ${file.name} (${pct}%)...`);
      }
    };
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  report(72, "Inspecting dimensions & aspect ratio...");
  let dims = { width: 1080, height: 1350 };
  if ((file.type || "").startsWith("image/")) {
    dims = await inspectImageDimensions(dataUrl);
  }

  report(88, "Saving high-resolution studio asset...");
  const uploaded = await apiRequest("/api/media/upload", "POST", {
    workspaceId,
    filename: file.name,
    mimeType: file.type || "image/png",
    dataUrl
  });

  report(100, "Asset ready");
  setTimeout(() => {
    store.ui.uploadProgress = { active: false, pct: 0, label: "" };
  }, 350);

  return { ...uploaded, width: dims.width, height: dims.height, rawDataUrl: dataUrl };
}

export async function renderCroppedStudioImage({
  srcUrl,
  aspect = "4:5",
  fitMode = "contain",
  bgStyle = "blur",
  zoom = 100,
  panX = 0,
  panY = 0,
  padding = 44
}) {
  const ASPECT_MAP = {
    "4:5": [1080, 1350],
    "9:16": [1080, 1920],
    "1:1": [1080, 1080],
    "1.91:1": [1080, 566]
  };
  const [targetW, targetH] = ASPECT_MAP[aspect] || [1080, 1350];
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");

  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = srcUrl;
  });

  // 1. Fill backdrop cleanly
  if (bgStyle === "white") {
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(0, 0, targetW, targetH);
  } else if (bgStyle === "stone") {
    ctx.fillStyle = "#EFECE6";
    ctx.fillRect(0, 0, targetW, targetH);
  } else if (bgStyle === "slate") {
    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, targetW, targetH);
  } else {
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.save();
    ctx.filter = "blur(42px) saturate(1.15)";
    ctx.globalAlpha = 0.85;
    const bgScale = Math.max(targetW / img.width, targetH / img.height) * 1.15;
    const bw = img.width * bgScale;
    const bh = img.height * bgScale;
    ctx.drawImage(img, (targetW - bw) / 2, (targetH - bh) / 2, bw, bh);
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // 2. Compute foreground scale + zoom + X/Y pan
  const zoomFactor = Math.max(0.5, Number(zoom || 100) / 100);
  const availW = fitMode === "contain" ? targetW - padding * 2 : targetW;
  const availH = fitMode === "contain" ? targetH - padding * 2 : targetH;
  const baseScale = fitMode === "contain"
    ? Math.min(availW / img.width, availH / img.height)
    : Math.max(targetW / img.width, targetH / img.height);

  const drawW = img.width * baseScale * zoomFactor;
  const drawH = img.height * baseScale * zoomFactor;
  const dx = (targetW - drawW) / 2 + (Number(panX || 0) * targetW) / 200;
  const dy = (targetH - drawH) / 2 + (Number(panY || 0) * targetH) / 200;

  if (fitMode === "contain") {
    ctx.save();
    ctx.shadowColor = "rgba(15, 23, 42, 0.22)";
    ctx.shadowBlur = 38;
    ctx.shadowOffsetY = 16;
    const r = 24;
    ctx.beginPath();
    ctx.roundRect(dx, dy, drawW, drawH, r);
    ctx.clip();
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  return {
    dataUrl: canvas.toDataURL("image/png", 0.94),
    width: targetW,
    height: targetH
  };
}

export async function generateAiVisualCardDataUrl({
  category = "STUDIO BRIEFING",
  headline = "Clean Architecture Scales Faster Than Viral Hacks",
  igHandle = "maya.creates",
  theme = "editorial"
}) {
  const THEMES = {
    editorial: { bg1: "#FAF8F5", bg2: "#EFECE6", ink: "#09090B", sub: "#52525B", accent: "#4F46E5" },
    indigo: { bg1: "#EEF2FF", bg2: "#E0E7FF", ink: "#1E1B4B", sub: "#4338CA", accent: "#4F46E5" },
    slate: { bg1: "#0F172A", bg2: "#1E293B", ink: "#F8FAFC", sub: "#94A3B8", accent: "#38BDF8" },
    emerald: { bg1: "#ECFDF5", bg2: "#D1FAE5", ink: "#064E3B", sub: "#047857", accent: "#059669" }
  };
  const pal = THEMES[theme] || THEMES.editorial;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
  grad.addColorStop(0, pal.bg1);
  grad.addColorStop(1, pal.bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);

  // Subtle architectural grid frame
  ctx.strokeStyle = pal.accent + "24";
  ctx.lineWidth = 2;
  ctx.strokeRect(64, 64, 952, 1222);

  // Category tag
  ctx.fillStyle = pal.accent;
  ctx.font = "700 26px system-ui, -apple-system, sans-serif";
  ctx.fillText(String(category).toUpperCase().slice(0, 34), 104, 152);

  // Wrapped headline
  ctx.fillStyle = pal.ink;
  ctx.font = "800 68px system-ui, -apple-system, sans-serif";
  const words = String(headline).split(/\s+/);
  let line = "";
  let y = 390;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 860 && line) {
      ctx.fillText(line, 104, y);
      line = word;
      y += 84;
      if (y > 960) break;
    } else {
      line = test;
    }
  }
  if (line && y <= 1040) ctx.fillText(line, 104, y);

  // Accent bar + creator footer
  ctx.fillStyle = pal.accent;
  ctx.fillRect(104, 1120, 110, 8);
  ctx.fillStyle = pal.sub;
  ctx.font = "600 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(`@${igHandle}  ·  Velora Studio Edition`, 104, 1196);

  return canvas.toDataURL("image/png", 0.94);
}

export async function resetAllDemoData() {
  localStorage.removeItem(STORAGE_SNAPSHOT_KEY);
  return apiRequest("/api/state/reset", "POST", {});
}

export async function switchDataMode(mode = "sample") {
  localStorage.removeItem(STORAGE_SNAPSHOT_KEY);
  store.ui.selectedGridPostId = null;
  store.ui.selectedThreadId = null;
  store.ui.selectedCarouselId = null;
  store.ui.selectedSlideIndex = 0;
  store.ui.chatSimMessages = [];
  store.ui.aiPack = null;
  if (mode === "empty") {
    store.ui.composerMediaUrl = "";
    store.ui.composerMediaDims = "";
    store.ui.composerTitle = "";
    store.ui.composerCaption = "";
    store.ui.composerHashtags = "";
    store.ui.composerFirstComment = "";
  }
  return apiRequest("/api/state/mode", "POST", { mode });
}

export async function mcpCall(method, params = {}) {
  const snap = getSavedSnapshot();
  const res = await fetch("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
      ...(snap ? { _clientSnapshot: snap } : {})
    })
  });
  const data = await res.json();
  if (data.serverStateSnapshot) {
    try { localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(data.serverStateSnapshot)); } catch {}
  }
  await bootstrapApp(store.activeWorkspaceId);
  return data;
}

export function showToast(message, isError = false) {
  const root = document.getElementById("velora-toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${isError ? "is-error" : ""}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    el.style.transition = "opacity 160ms ease, transform 160ms ease";
    setTimeout(() => el.remove(), 180);
  }, 3200);
}

export function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function fmtNum(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 10_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString("en-US");
}
