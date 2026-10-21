# REA (`morluto/rea`) — Complete Clone, Installation & Setup Guide

`https://github.com/morluto/rea` (`rea-agents` **v6.7.0**) ko poora clone, compile, build, verify aur agent + CLI + live browser workbench ke saath completely set up kar diya gaya hai.

---

## 1. Repository & Installed Locations

| Component | Path | Status |
| --- | --- | --- |
| **Full REA Source Checkout** | `/home/user/TO-DO---my-first-project/rea` (symlinked at `/home/user/rea`) | Full Git history (`main`), 100% clean working tree |
| **Global CLI Commands** | `/usr/local/bin/rea` & `/usr/local/bin/rea-agents` | Ready (`rea@6.7.0`, 159 CLI commands) |
| **Production MCP Server** | `rea mcp` (stdio) & `rea mcp --http` (Streamable HTTP) | Healthy (`212/212` tools, `6/6` prompts) |
| **Bundled REA Skill (`v44`)** | `/home/user/.agents/skills/reverse-engineer-anything` + `/home/user/.claude/skills/reverse-engineer-anything` | Installed & `aligned` |
| **Configured AI Agent Clients** | `claude_code`, `codex`, `cursor`, `gemini_cli`, `opencode`, `qwen_code`, `kimi`, `vscode`, `grok_build`, `copilot_cli` | All 10 configured & verified |
| **Interactive Web Workbench** | `workbench/server.mjs` (Live Preview on port `3000`) | Running live |
| **Ready-to-Run Sample Targets** | `/home/user/TO-DO---my-first-project/samples/` | ELF, WASM, SQLite DB, HAR, JS App |

---

## 2. Installed Runtime & Reverse-Engineering Toolchains

- **Node.js `v24.18.0` & npm `11.16.0`** (matches `.nvmrc`, enables native `node:sqlite` database inspection)
- **OpenJDK Temurin `21.0.8` LTS** (`java`, `javac`, `jar`, `javap`, `keytool`)
- **WABT `1.0.42`** (`wasm2wat`, `wat2wasm`, `wasm-validate`, `wasm-objdump`, `wasm-strip`, `wasm2c`) — verified against all **51/51** upstream `verify-wasm-artifact.mjs` E2E tests
- **Apktool `2.9.3`** (`apktool`) — verified against `verify-apktool.mjs`
- **JADX `1.1.0`** (`jadx`) — headless Android DEX/APK Java decompiler
- **pwntools `4.15.0` + pyelftools `0.33` + Unicorn `2.1.2`** — offline ELF layout & mitigation inspection + recorded crash analysis
- **Frida `17.23.2` + `frida-tools 14.11.0`** — dynamic binary instrumentation toolkit
- **mitmproxy `11.0.2` (`mitmdump`), Unblob `26.6.4`, LIEF `1.0.0`, Capstone `6.0`, Keystone `0.9.2`, Ropper `1.13.13`, Androguard `4.1.3`, `pefile`, `yara-python`, `oletools`, `wasmtime`**
- **Headless Chromium `153.0.8010.0`** — headless browser & CDP runtime for live web observation
- **GNU Binutils (`objdump`, `readelf`, `strings`) & GCC `12.2.0`**

---

## 3. Quick Commands You Can Use Immediately

```bash
# Check REA & MCP server health
rea --version
rea mcp doctor --json
rea doctor --skill --format json

# Inspect a compiled native ELF binary & disassemble a function with SHA-256 Evidence
rea inspect-binary-layout samples/license_demo --format json
rea inspect-with-objdump samples/license_demo disassemble --symbol validate_token --format json

# Inspect & decompile a WebAssembly (.wasm) binary
rea inspect-wasm-artifact samples/math_vault.wasm --format json

# Inspect a SQLite database schema & rows without mutating the file
rea inspect-sqlite-database samples/app_store.db --format json

# Analyze a HAR / API network capture
rea inspect-web-network-capture samples/api_traffic.har har --format json

# Reconstruct a JavaScript / Electron application & semantic module graph
rea analyze-javascript-application samples/mini_app --format json

# Decode Android APK resources & manifest
rea decode-android-resources /path/to/app.apk --format json
```
