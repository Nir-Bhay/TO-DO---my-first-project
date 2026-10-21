const STORAGE_SNAPSHOT_KEY = "velora_state_snapshot_v3";
const STORAGE_TOKEN_KEY = "velora_session_token_v3";
const STORAGE_USER_KEY = "velora_user_v3";

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
    composerMediaType: "REEL",
    composerMediaUrl: "",
    composerSlidesMedia: [],
    composerCoverStyle: "noir",
    composerCoverLabel: "SYSTEM DESIGN NOTES",
    composerScheduledDate: "",
    composerTitle: "",
    composerCaption: "",
    composerHashtags: "",
    composerFirstComment: "",
    composerCollab: "",
    composerLocation: "",
    composerAutomationId: "",
    composerIsTrial: false,
    selectedGridPostId: null,
    selectedCarouselId: null,
    selectedSlideIndex: 0,
    selectedThreadId: null,
    inboxTab: "dms",
    inboxFilter: "open",
    inboxSearch: "",
    analyticsRange: "30d",
    settingsTab: "general",
    activeToolSlug: null,
    toolsCategory: "All",
    toolsSearch: "",
    mcpSelectedTool: "list_workspaces",
    mcpLastResponse: null,
    chatSimMessages: [],
    chatSimTyping: false
  }
};

function persistSnapshot(bundle) {
  if (!bundle) return;
  if (bundle.serverStateSnapshot) {
    try {
      localStorage.setItem(STORAGE_SNAPSHOT_KEY, JSON.stringify(bundle.serverStateSnapshot));
    } catch {
      // If snapshot grows large from uploaded base64 videos, trim media blobs in localStorage cache while server SQLite keeps full data
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
  if (method !== "GET" && snap && path !== "/api/state/reset" && path !== "/api/media/upload") {
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

export async function uploadMediaFile(file, workspaceId = store.activeWorkspaceId) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return apiRequest("/api/media/upload", "POST", {
    workspaceId,
    filename: file.name,
    mimeType: file.type || "image/png",
    dataUrl
  });
}

export async function resetAllDemoData() {
  localStorage.removeItem(STORAGE_SNAPSHOT_KEY);
  return apiRequest("/api/state/reset", "POST", {});
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
