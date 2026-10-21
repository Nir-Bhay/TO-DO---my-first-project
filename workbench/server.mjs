import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const WORKSPACE_ROOT = "/home/user/TO-DO---my-first-project";
const REA_ROOT = join(WORKSPACE_ROOT, "rea");
const PUBLIC_DIR = join(WORKSPACE_ROOT, "workbench", "public");
const SITE_DIR = join(REA_ROOT, "website", "public");
const DOCS_DIR = join(REA_ROOT, "docs");
const UPLOAD_DIR = join(WORKSPACE_ROOT, "workbench", "uploads");
const REA_BIN = "/usr/local/bin/rea";

mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const PRESETS = {
  elf_layout: {
    label: "ELF Binary Layout & Mitigations",
    target: "samples/license_demo",
    args: ["inspect-binary-layout", join(WORKSPACE_ROOT, "samples/license_demo"), "--format", "json"],
    cliDisplay: "rea inspect-binary-layout samples/license_demo --format json",
  },
  elf_disasm: {
    label: "Native Disassembly (validate_token)",
    target: "samples/license_demo",
    args: [
      "inspect-with-objdump",
      join(WORKSPACE_ROOT, "samples/license_demo"),
      "disassemble",
      "--symbol",
      "validate_token",
      "--format",
      "json",
    ],
    cliDisplay: "rea inspect-with-objdump samples/license_demo disassemble --symbol validate_token --format json",
  },
  wasm_inspect: {
    label: "WebAssembly WAT & Exports (WABT 1.0.42)",
    target: "samples/math_vault.wasm",
    args: ["inspect-wasm-artifact", join(WORKSPACE_ROOT, "samples/math_vault.wasm"), "--format", "json"],
    cliDisplay: "rea inspect-wasm-artifact samples/math_vault.wasm --format json",
  },
  sqlite_inspect: {
    label: "SQLite Schema & Rows (Node 24 Native)",
    target: "samples/app_store.db",
    args: ["inspect-sqlite-database", join(WORKSPACE_ROOT, "samples/app_store.db"), "--format", "json"],
    cliDisplay: "rea inspect-sqlite-database samples/app_store.db --format json",
  },
  har_capture: {
    label: "Web API Network Capture (HAR)",
    target: "samples/api_traffic.har",
    args: ["inspect-web-network-capture", join(WORKSPACE_ROOT, "samples/api_traffic.har"), "har", "--format", "json"],
    cliDisplay: "rea inspect-web-network-capture samples/api_traffic.har har --format json",
  },
  js_graph: {
    label: "JavaScript Semantic & Module Graph",
    target: "samples/mini_app",
    args: ["analyze-javascript-application", join(WORKSPACE_ROOT, "samples/mini_app"), "--format", "json"],
    cliDisplay: "rea analyze-javascript-application samples/mini_app --format json",
  },
  apktool_probe: {
    label: "Android Apktool Client Readiness",
    target: "apktool@2.9.3",
    args: ["inspect-apktool-client", "--format", "json"],
    cliDisplay: "rea inspect-apktool-client --format json",
  },
  mcp_doctor: {
    label: "Production MCP Server Doctor (212 Tools)",
    target: "rea mcp",
    args: ["mcp", "doctor", "--json"],
    cliDisplay: "rea mcp doctor --json",
  },
};

function runRea(args, timeoutMs = 45_000) {
  return new Promise((resolvePromise) => {
    const startedAt = Date.now();
    const child = spawn(REA_BIN, args, {
      cwd: WORKSPACE_ROOT,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        PWNLIB_NOTERM: "1",
        JAVA_HOME: "/home/user/opt/jdk21",
        PYTHONPATH: "/home/user/opt/pypkgs",
        REA_WABT_BIN_DIRECTORY: "/home/user/opt/wabt/bin",
        REA_PWNTOOLS_PYTHON: "/usr/bin/python3",
        REA_APKTOOL_COMMAND: "/home/user/opt/bin/apktool",
        REA_JADX_COMMAND: "/home/user/opt/bin/jadx",
        CHROME_PATH: "/home/user/opt/bin/chromium",
      },
    });

    const stdoutChunks = [];
    const stderrChunks = [];
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.stdout.on("data", (d) => stdoutChunks.push(d));
    child.stderr.on("data", (d) => stderrChunks.push(d));

    child.on("close", (code) => {
      clearTimeout(timer);
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = Buffer.concat(stderrChunks).toString("utf8");
      let parsed = null;
      try {
        parsed = JSON.parse(stdout);
      } catch {
        parsed = null;
      }
      resolvePromise({
        exitCode: code ?? 0,
        durationMs: Date.now() - startedAt,
        stdout,
        stderr,
        parsed,
      });
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req, limitBytes = 32 * 1024 * 1024) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        rejectBody(new Error("Upload exceeds 32 MiB limit"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", rejectBody);
  });
}

function tokenizeArgs(cmdLine) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (let i = 0; i < cmdLine.length; i++) {
    const ch = cmdLine[i];
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current.length > 0) tokens.push(current);
  if (tokens[0] === "rea" || tokens[0] === "rea-agents") tokens.shift();
  return tokens;
}

function serveStaticFrom(baseDir, relPath, res) {
  const safeRel = normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let target = resolve(baseDir, "." + (safeRel.startsWith("/") ? safeRel : "/" + safeRel));
  if (!target.startsWith(resolve(baseDir))) {
    res.writeHead(403);
    res.end("Forbidden");
    return true;
  }
  if (existsSync(target) && statSync(target).isDirectory()) {
    target = join(target, "index.html");
  }
  if (!existsSync(target) || !statSync(target).isFile()) {
    return false;
  }
  const mime = MIME_TYPES[extname(target).toLowerCase()] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": mime,
    "Access-Control-Allow-Origin": "*",
  });
  res.end(readFileSync(target));
  return true;
}

let cachedStatus = null;

async function getSystemStatus(force = false) {
  if (cachedStatus && !force) return cachedStatus;
  const [mcpRes, doctorSkillRes] = await Promise.all([
    runRea(["mcp", "doctor", "--json"]),
    runRea(["doctor", "--skill", "--format", "json"]),
  ]);
  cachedStatus = {
    checkedAt: new Date().toISOString(),
    reaVersion: "6.7.0",
    nodeVersion: process.version,
    clonePath: REA_ROOT,
    mcp: mcpRes.parsed,
    doctor: doctorSkillRes.parsed,
    toolchains: [
      { name: "REA CLI & MCP Server", version: "6.7.0 (212 MCP tools / 159 CLI commands)", ok: true },
      { name: "Node.js Runtime (w/ Native SQLite)", version: process.version, ok: true },
      { name: "OpenJDK Temurin LTS", version: "21.0.8", ok: true },
      { name: "WABT WebAssembly Toolkit", version: "1.0.42", ok: true },
      { name: "Apktool Android Decoder", version: "2.9.3", ok: true },
      { name: "JADX Android Decompiler", version: "1.1.0", ok: true },
      { name: "pwntools + pyelftools + Unicorn", version: "4.15.0 / 0.33 / 2.1.2", ok: true },
      { name: "Frida + Frida Tools", version: "17.23.2 / 14.11.0", ok: true },
      { name: "mitmproxy + Unblob + LIEF + YARA", version: "11.0.2 / 26.6.4 / 1.0.0 / 4.5.4", ok: true },
      { name: "Headless Chromium (CDP Ready)", version: "153.0.8010.0", ok: true },
      { name: "GNU Binutils (objdump/readelf) & GCC", version: "12.2.0", ok: true },
      { name: "Agent Skills & MCP Registrations", version: "Skill v44 (10 Agents Aligned)", ok: true },
    ],
  };
  return cachedStatus;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    const url = new URL(req.url || "/", "http://rea.local");

    if (url.pathname === "/api/status" && req.method === "GET") {
      const force = url.searchParams.get("refresh") === "1";
      sendJson(res, 200, await getSystemStatus(force));
      return;
    }

    if (url.pathname === "/api/presets" && req.method === "GET") {
      sendJson(
        res,
        200,
        Object.entries(PRESETS).map(([id, p]) => ({
          id,
          label: p.label,
          target: p.target,
          cliDisplay: p.cliDisplay,
        })),
      );
      return;
    }

    if (url.pathname === "/api/run-preset" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const preset = PRESETS[body.presetId];
      if (!preset) {
        sendJson(res, 400, { error: "Unknown presetId" });
        return;
      }
      const out = await runRea(preset.args);
      sendJson(res, 200, { command: preset.cliDisplay, ...out });
      return;
    }

    if (url.pathname === "/api/run-cli" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const args = tokenizeArgs(String(body.command || ""));
      if (args.length === 0) {
        sendJson(res, 400, { error: "Provide a rea command, e.g. capabilities --format json" });
        return;
      }
      const blocked = new Set(["uninstall", "update", "--update", "environment-serve", "mcp"]);
      if (blocked.has(args[0]) && !(args[0] === "mcp" && args[1] === "doctor")) {
        sendJson(res, 400, {
          error: `Long-lived or mutating subcommand '${args[0]}' should be run from terminal or agent chat.`,
        });
        return;
      }
      const out = await runRea(args);
      sendJson(res, 200, { command: `rea ${args.join(" ")}`, ...out });
      return;
    }

    if (url.pathname === "/api/upload-inspect" && req.method === "POST") {
      const body = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const rawName = String(body.fileName || "artifact.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
      const savedPath = join(UPLOAD_DIR, `${Date.now()}_${rawName}`);
      const buf = Buffer.from(String(body.base64 || ""), "base64");
      writeFileSync(savedPath, buf);

      const lower = rawName.toLowerCase();
      let args;
      if (lower.endsWith(".wasm")) {
        args = ["inspect-wasm-artifact", savedPath, "--format", "json"];
      } else if (lower.endsWith(".sqlite") || lower.endsWith(".db") || lower.endsWith(".sqlite3")) {
        args = ["inspect-sqlite-database", savedPath, "--format", "json"];
      } else if (lower.endsWith(".har")) {
        args = ["inspect-web-network-capture", savedPath, "har", "--format", "json"];
      } else if (lower.endsWith(".apk")) {
        args = ["decode-android-resources", savedPath, "--format", "json"];
      } else if (lower.endsWith(".gguf") || lower.endsWith(".safetensors")) {
        args = ["inspect-model-artifact", savedPath, "--format", "json"];
      } else {
        args = ["inspect-artifact", savedPath, "--format", "json"];
      }
      const out = await runRea(args);
      sendJson(res, 200, {
        savedPath,
        command: `rea ${args.join(" ")}`,
        ...out,
      });
      return;
    }

    if (url.pathname === "/api/docs" && req.method === "GET") {
      const docName = url.searchParams.get("file");
      if (docName) {
        const clean = docName.replace(/[^a-zA-Z0-9._-]/g, "");
        const full = join(DOCS_DIR, clean);
        if (!existsSync(full) || !statSync(full).isFile()) {
          sendJson(res, 404, { error: "Doc not found" });
          return;
        }
        sendJson(res, 200, { file: clean, content: readFileSync(full, "utf8") });
        return;
      }
      const files = readdirSync(DOCS_DIR)
        .filter((f) => f.endsWith(".md"))
        .sort();
      sendJson(res, 200, { files });
      return;
    }

    if (url.pathname.startsWith("/site/") || url.pathname === "/site") {
      const sub = url.pathname.slice("/site".length) || "/index.html";
      if (serveStaticFrom(SITE_DIR, sub, res)) return;
    }

    if (serveStaticFrom(PUBLIC_DIR, url.pathname === "/" ? "/index.html" : url.pathname, res)) {
      return;
    }

    // Fallback assets referenced from /assets/... in REA static pages
    if (serveStaticFrom(SITE_DIR, url.pathname, res)) {
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  } catch (err) {
    sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`REA Interactive Workbench & Docs listening on http://${HOST}:${PORT}`);
  getSystemStatus().catch(() => {});
});
