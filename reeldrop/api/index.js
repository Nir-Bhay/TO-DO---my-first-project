import { handleApiOrMcpRequest, sendJson } from "../server/appHandler.mjs";

function normalizeVercelUrl(req) {
  try {
    const u = new URL(req.url || "/", `https://${req.headers?.host || "localhost"}`);
    const routed = u.searchParams.get("__route");
    if (routed) {
      u.searchParams.delete("__route");
      const qs = u.searchParams.toString();
      req.url = `${routed.startsWith("/") ? routed : "/" + routed}${qs ? "?" + qs : ""}`;
    }
  } catch {}
}

export default async function handler(req, res) {
  try {
    normalizeVercelUrl(req);
    await handleApiOrMcpRequest(req, res);
  } catch (err) {
    console.error("[ReelDrop Vercel Function Error]", err);
    sendJson(res, 500, { error: err.message || "Vercel Function Error" });
  }
}
