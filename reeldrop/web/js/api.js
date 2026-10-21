import {
  getSavedClientSnapshot,
  saveClientSnapshot,
  clearClientSnapshot,
  executeStaticBrowserFallback
} from "/shared/browserEngine.js";

export const store = {
  mode: "site",
  sitePage: "home",
  appPage: "scheduler",
  theme: "light",
  currency: "usd",
  billingCycle: "yearly",
  selectedFreeTool: "instagram-caption-generator",
  selectedCarouselId: null,
  selectedSlideIndex: 0,
  selectedThreadId: null,
  inboxFilter: "open",
  inboxChip: "all",
  inboxSearch: "",
  calView: "month",
  calYear: 2026,
  calMonth: 9,
  calWeekOffset: 0,
  calStatusFilter: "ALL",
  gridShowAll: false,
  analyticsRange: "30d",
  composerPrefillCaption: "",
  data: null,
  listeners: new Set()
};

export function subscribe(fn) {
  store.listeners.add(fn);
  return () => store.listeners.delete(fn);
}

export function notify() {
  for (const fn of store.listeners) fn();
}

export function toast(message, type = "info") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

export async function apiRequest(path, options = {}) {
  const savedSnap = getSavedClientSnapshot();
  let finalOptions = { ...options };

  if ((options.method === "POST" || options.method === "PATCH") && savedSnap) {
    try {
      const parsed = options.body ? JSON.parse(options.body) : {};
      parsed._clientSnapshot = savedSnap;
      finalOptions.body = JSON.stringify(parsed);
    } catch {}
  }

  let res;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...finalOptions
    });
  } catch {
    return executeStaticBrowserFallback(path, options, store.data);
  }

  const contentType = res.headers.get("content-type") || "";
  if ((res.status === 404 || res.status === 405) && !contentType.includes("application/json")) {
    return executeStaticBrowserFallback(path, options, store.data);
  }

  const payload = await res.json();
  if (!res.ok) {
    const err = new Error(payload.error || `Request failed (${res.status})`);
    err.code = payload.code;
    throw err;
  }
  if (payload?.serverStateSnapshot) {
    saveClientSnapshot(payload.serverStateSnapshot);
  } else if (payload?.bundle?.serverStateSnapshot) {
    saveClientSnapshot(payload.bundle.serverStateSnapshot);
  }
  return payload;
}

export async function refreshBootstrap(workspaceId) {
  const ws = workspaceId || store.data?.activeWorkspace?.id || "ws_maya";
  const savedSnap = getSavedClientSnapshot();
  const bundle = savedSnap
    ? await apiRequest("/api/bootstrap/hydrate", {
        method: "POST",
        body: JSON.stringify({ workspaceId: ws })
      })
    : await apiRequest(`/api/bootstrap?workspaceId=${encodeURIComponent(ws)}`);

  if (!bundle.reaEvidence?.artifacts?.length) {
    try {
      const r = await fetch("/rea-evidence/rea-summary.json");
      if (r.ok) bundle.reaEvidence = await r.json();
    } catch {}
  }

  store.data = bundle;
  if (!store.selectedCarouselId || !bundle.carousels.some((c) => c.id === store.selectedCarouselId)) {
    store.selectedCarouselId = bundle.carousels[0]?.id || null;
  }
  if (!store.selectedThreadId || !bundle.threads.some((t) => t.id === store.selectedThreadId)) {
    store.selectedThreadId = bundle.threads[0]?.id || null;
  }
  notify();
  return bundle;
}

export async function resetAllDemoData() {
  clearClientSnapshot();
  const bundle = await apiRequest("/api/state/reset", { method: "POST", body: "{}" });
  updateBundle(bundle);
  toast("Reset all 4 Creator Workspaces, Calendar, Automations & Inbox to full test dataset!");
}

export function updateBundle(bundle) {
  if (bundle?.serverStateSnapshot) saveClientSnapshot(bundle.serverStateSnapshot);
  store.data = {
    ...bundle,
    reaEvidence: bundle.reaEvidence?.artifacts?.length
      ? bundle.reaEvidence
      : (store.data?.reaEvidence || { ready: true, artifacts: [] })
  };
  notify();
}

export function escapeHtml(val) {
  return String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
