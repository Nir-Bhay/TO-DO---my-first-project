import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiOrMcpRequest } from "./appHandler.mjs";
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
    for (const rel of [
      "index.html",
      "styles.css",
      "js/main.js",
      "js/marketingViews.js",
      "js/appViews.js",
      "js/automationAndInboxViews.js",
      "js/freeToolsViews.js",
      "js/api.js",
      "js/icons.js"
    ]) {
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

const DOWNLOAD_MAP = {
  "/download/velora-launch-demo-16x9.mp4": {
    file: "media/velora-launch-demo-16x9.mp4",
    downloadName: "velora-launch-demo-1920x1080-60fps.mp4"
  },
  "/download/velora-social-reel-9x16.mp4": {
    file: "media/velora-social-reel-9x16.mp4",
    downloadName: "velora-social-reel-1080x1920-60fps.mp4"
  },
  "/download/velora-social-reel.mp4": {
    file: "media/velora-social-reel-9x16.mp4",
    downloadName: "velora-social-reel-1080x1920-60fps.mp4"
  }
};

function serveVideoRange(req, res, filePath) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(fileSize - 1, parseInt(parts[1], 10)) : fileSize - 1;
    if (Number.isNaN(start) || start >= fileSize || end < start) {
      res.writeHead(416, { "Content-Range": `bytes */${fileSize}` });
      res.end();
      return;
    }
    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "no-cache"
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(filePath, { start, end }).pipe(res);
    return;
  }

  res.writeHead(200, {
    "Content-Length": fileSize,
    "Accept-Ranges": "bytes",
    "Content-Type": "video/mp4",
    "Cache-Control": "no-cache"
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

setInterval(() => {
  try {
    processDueScheduledPosts(false);
  } catch {}
}, 15000).unref();

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleApiOrMcpRequest(req, res);
    if (handled) return;

    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = u.pathname;
    const tag = computeWebBuildTag();

    if (DOWNLOAD_MAP[pathname]) {
      const target = path.resolve(WEB_DIR, DOWNLOAD_MAP[pathname].file);
      if (fs.existsSync(target)) {
        const stat = fs.statSync(target);
        res.writeHead(200, {
          "Content-Type": "video/mp4",
          "Content-Length": stat.size,
          "Content-Disposition": `attachment; filename="${DOWNLOAD_MAP[pathname].downloadName}"`
        });
        if (req.method === "HEAD") {
          res.end();
          return;
        }
        fs.createReadStream(target).pipe(res);
        return;
      }
    }

    const mappedRel =
      pathname === "/media/velora-intro-reel.mp4"
        ? "media/velora-social-reel-9x16.mp4"
        : pathname === "/"
        ? "index.html"
        : pathname.replace(/^\/+/, "");

    const candidate = path.resolve(WEB_DIR, mappedRel);
    if (candidate.startsWith(WEB_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();

      if (ext === ".mp4") {
        serveVideoRange(req, res, candidate);
        return;
      }

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
    res.writeHead(200, { "Content-Type": MIME_TYPES[".html"], ...NO_CACHE_HEADERS });
    res.end(indexHtml);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: err.message }));
  }
});

const PORT = Number(process.env.PORT || 3080);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Velora Studio Platform running on http://0.0.0.0:${PORT}`);
});
