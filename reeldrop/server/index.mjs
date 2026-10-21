import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApiOrMcpRequest, sendJson } from "./appHandler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIR = path.resolve(__dirname, "../web");
const EVIDENCE_DIR = path.resolve(__dirname, "../rea-evidence");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp"
};

const server = http.createServer(async (req, res) => {
  try {
    const handled = await handleApiOrMcpRequest(req, res);
    if (handled) return;

    const u = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = u.pathname;

    if (pathname.startsWith("/rea-evidence/")) {
      const rel = path.basename(pathname);
      const evFile = path.join(EVIDENCE_DIR, rel);
      const webEvFile = path.join(WEB_DIR, "rea-evidence", rel);
      const target = fs.existsSync(evFile) ? evFile : webEvFile;
      if (fs.existsSync(target) && fs.statSync(target).isFile()) {
        const ext = path.extname(target).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(fs.readFileSync(target));
        return;
      }
    }

    const safeRel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.resolve(WEB_DIR, safeRel);
    if (candidate.startsWith(WEB_DIR) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
      res.end(fs.readFileSync(candidate));
      return;
    }

    const indexHtml = fs.readFileSync(path.join(WEB_DIR, "index.html"));
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(indexHtml);
  } catch (err) {
    console.error("[ReelDrop Server Error]", err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: err.message || "Internal server error" });
    }
  }
});

const PORT = Number(process.env.PORT || 3080);
server.listen(PORT, "0.0.0.0", () => {
  console.log(`ReelDrop Full-Stack Platform listening on http://0.0.0.0:${PORT}`);
});
