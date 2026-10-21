import http from "node:http";
import crypto from "node:crypto";
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

function computeWebBuildTag() {
  try {
    const h = crypto.createHash("sha1");
    for (const rel of ["index.html", "styles.css", "js/main.js", "js/marketingViews.js", "js/appViews.js", "js/automationAndInboxViews.js", "js/freeToolsViews.js", "js/api.js", "js/icons.js"]) {
      const p = path.join(WEB_DIR, rel);
      if (fs.existsSync(p)) h.update(fs.statSync(p).mtimeMs.toString());
    }
    return h.digest("hex").slice(0, 10);
  } catch {
    return Date.now().toString(36);
  }
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Surrogate-Control": "no-store",
  "Pragma": "no-cache",
  "Expires": "0"
};

setInterval(() => {
  try { processDueScheduledPosts(false); } catch {}
}, 15000).unref();

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleApiOrMcpRequest(req, res);
    if (handled) return;

    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = u.pathname;
    const tag = computeWebBuildTag();

    const safeRel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.resolve(WEB_DIR, safeRel);
    if (candidate.startsWith(WEB_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();

      if (ext === ".html") {
        let html = fs.readFileSync(candidate, "utf8");
        html = html
          .replace(/\/styles\.css(\?[^"']*)?/g, `/styles.css?v=${tag}`)
          .replace(/\/js\/main\.js(\?[^"']*)?/g, `/js/main.js?v=${tag}`);
        res.writeHead(200, { "Content-Type": MIME_TYPES[".html"], ...NO_CACHE_HEADERS });
        res.end(html);
        return;
      }

      if (ext === ".js" || ext === ".mjs") {
        let code = fs.readFileSync(candidate, "utf8");
        code = code.replace(/(from\s+["'])(\.\.?\/[^"'?]+\.js)(\?[^"']*)?(["'])/g, `$1$2?v=${tag}$4`);
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext], ...NO_CACHE_HEADERS });
        res.end(code);
        return;
      }

      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        ...(ext === ".woff2"
          ? { "Cache-Control": "public, max-age=31536000, immutable" }
          : NO_CACHE_HEADERS)
      });
      res.end(fs.readFileSync(candidate));
      return;
    }

    let indexHtml = fs.readFileSync(path.join(WEB_DIR, "index.html"), "utf8");
    indexHtml = indexHtml
      .replace(/\/styles\.css(\?[^"']*)?/g, `/styles.css?v=${tag}`)
      .replace(/\/js\/main\.js(\?[^"']*)?/g, `/js/main.js?v=${tag}`);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ...NO_CACHE_HEADERS });
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
