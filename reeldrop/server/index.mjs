import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiOrMcpRequest, sendJson } from "./appHandler.mjs";
import { processDueScheduledPosts } from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, "../web");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4"
};

// Active background auto-publisher worker polling due scheduled posts every 15 seconds
setInterval(() => {
  try { processDueScheduledPosts(false); } catch {}
}, 15000).unref();

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleApiOrMcpRequest(req, res);
    if (handled) return;

    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = u.pathname;

    const safeRel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.resolve(WEB_DIR, safeRel);
    if (candidate.startsWith(WEB_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": ext === ".woff2" ? "public, max-age=31536000, immutable" : "no-cache"
      });
      res.end(fs.readFileSync(candidate));
      return;
    }

    const indexHtml = fs.readFileSync(path.join(WEB_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } catch (err) {
    console.error("[Velora Server Error]", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: err.message || "Internal server error" });
    }
  }
});

const PORT = Number(process.env.PORT || 3080);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Velora Studio Platform running on http://0.0.0.0:${PORT}`);
});
