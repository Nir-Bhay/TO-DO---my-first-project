import { store, escHtml } from "./api.js";
import { icon } from "./icons.js";
import { renderMarketingNavbar, renderMarketingFooter } from "./marketingViews.js";

function renderToolInteractivePanel(tool) {
  switch (tool.slug) {
    case "caption-length-checker":
      return `
        <div class="field">
          <label class="field-label">Paste or draft your caption</label>
          <textarea class="textarea" id="tool-caption-input" rows="5">Most creators lose 60% of readers right after character 125 because the core takeaway sits buried at the bottom of the caption.

Here are 3 quick edits that double read-through:
1. Front-load the concrete outcome in line one
2. Leave white space between short paragraphs
3. End with a single keyword call-to-action

#designsystems #contentstrategy #creatorworkflow</textarea>
        </div>
        <div id="tool-caption-stats" style="margin-top:14px;"></div>
      `;

    case "engagement-rate-calculator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;">
          <div class="field"><label class="field-label">Followers</label><input class="input" type="number" id="er-followers" value="48200" /></div>
          <div class="field"><label class="field-label">Post Reach</label><input class="input" type="number" id="er-reach" value="31500" /></div>
          <div class="field"><label class="field-label">Likes</label><input class="input" type="number" id="er-likes" value="1840" /></div>
          <div class="field"><label class="field-label">Comments + Saves</label><input class="input" type="number" id="er-saves" value="620" /></div>
        </div>
        <div id="er-output" style="margin-top:16px;"></div>
      `;

    case "instagram-collab-rate-calculator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">
          <div class="field"><label class="field-label">Avg Views per Post</label><input class="input" type="number" id="rate-views" value="42000" /></div>
          <div class="field"><label class="field-label">Niche CPM Tier ($)</label><input class="input" type="number" id="rate-cpm" value="28" /></div>
          <div class="field">
            <label class="field-label">Usage Rights</label>
            <select class="select" id="rate-rights">
              <option value="1">Organic Only (1.0x)</option>
              <option value="1.35">30-Day Paid Spark/Whitelisting (1.35x)</option>
              <option value="1.75">90-Day Paid Usage (1.75x)</option>
            </select>
          </div>
        </div>
        <div id="rate-output" style="margin-top:16px;"></div>
      `;

    case "hook-timing-analyzer":
      return `
        <div class="field">
          <label class="field-label">Spoken opening hook (155 words/min natural speaking pace)</label>
          <textarea class="textarea" id="hook-text" rows="3">Stop exporting carousels at 1080 by 1080 — you are giving away 25 percent of vertical screen space.</textarea>
        </div>
        <div id="hook-output" style="margin-top:14px;"></div>
      `;

    default:
      return `
        <div class="field">
          <label class="field-label">Topic, Handle, or Caption Input</label>
          <textarea class="textarea" id="generic-tool-input" rows="3" placeholder="Enter your topic, handle, or draft copy...">Weekly UI teardown & design systems studio (@maya.studio)</textarea>
        </div>
        <div style="margin-top:12px;display:flex;gap:8px;">
          <button class="btn btn-primary" id="btn-run-generic-tool" data-slug="${escHtml(tool.slug)}">Run ${escHtml(tool.name)}</button>
          <a href="/app/create" data-link class="btn">Send to Studio Composer ${icon("arrowRight", 14)}</a>
        </div>
        <div id="generic-tool-output" style="margin-top:14px;"></div>
      `;
  }
}

export function renderFreeToolsPage(slug = null) {
  const tools = store.bundle.freeTools || [];
  const categories = ["All", ...new Set(tools.map((t) => t.category))];
  const cat = store.ui.toolsCategory || "All";
  const q = (store.ui.toolsSearch || "").toLowerCase();

  const activeTool = slug ? tools.find((t) => t.slug === slug) : null;
  const filtered = tools.filter((t) => {
    const matchCat = cat === "All" || t.category === cat;
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return `
    ${renderMarketingNavbar("/tools")}
    <main class="mkt-container stage-animate" style="padding-top:44px;padding-bottom:72px;">
      ${activeTool ? `
        <div style="margin-bottom:18px;">
          <a href="/tools" data-link class="btn btn-sm btn-ghost">${icon("arrowLeft", 14)} All Creator Tools</a>
        </div>
        <div class="card card-pad" style="max-width:820px;padding:26px;">
          <span class="badge" style="margin-bottom:10px;">${escHtml(activeTool.category)}</span>
          <h1 style="font-size:26px;margin-bottom:6px;">${escHtml(activeTool.name)}</h1>
          <p style="font-size:14px;color:var(--ink-secondary);margin-bottom:20px;">${escHtml(activeTool.desc)}</p>
          ${renderToolInteractivePanel(activeTool)}
        </div>
      ` : `
        <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:24px;">
          <div>
            <h1 class="mkt-h2" style="font-size:32px;">Free Creator Utilities</h1>
            <p style="font-size:14.5px;color:var(--ink-secondary);">
              12 fast, browser-native calculators and checkers — zero login required.
            </p>
          </div>
          <div style="min-width:250px;">
            <input class="input" id="tools-search-input" value="${escHtml(store.ui.toolsSearch)}" placeholder="Search tools..." />
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:22px;">
          ${categories.map((c) => `
            <button class="btn btn-sm ${cat === c ? "btn-primary" : ""}" data-tool-cat="${escHtml(c)}">${escHtml(c)}</button>
          `).join("")}
        </div>

        <div class="mkt-bento">
          ${filtered.map((t) => `
            <a href="/tools/${escHtml(t.slug)}" data-link class="card mkt-feature-card">
              <div style="display:flex;align-items:center;justify-content:space-between;">
                <span class="badge">${escHtml(t.category)}</span>
                ${icon("arrowRight", 15)}
              </div>
              <h3 style="font-size:16px;margin-top:4px;">${escHtml(t.name)}</h3>
              <p style="font-size:13px;color:var(--ink-secondary);line-height:1.55;">${escHtml(t.desc)}</p>
            </a>
          `).join("")}
        </div>
      `}
    </main>
    ${renderMarketingFooter()}
  `;
}

export function bindToolCalculators() {
  const capEl = document.getElementById("tool-caption-input");
  const capOut = document.getElementById("tool-caption-stats");
  if (capEl && capOut) {
    const update = () => {
      const val = capEl.value;
      const tags = val.match(/#[a-zA-Z0-9_]+/g) || [];
      capOut.innerHTML = `
        <div class="card card-pad" style="background:var(--bg-subtle);display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:13px;font-weight:600;" class="tabular">
            <span>Characters: ${val.length} / 2,200</span>
            <span>Hashtags: ${tags.length} / 30</span>
            <span>Lines: ${val.split("\n").length}</span>
          </div>
          <div style="font-size:12px;color:var(--ink-muted);">First 125 characters before Instagram's "...more" fold:</div>
          <div style="padding:10px 12px;border-radius:8px;background:var(--bg-surface);border:1px solid var(--border);font-size:13px;">
            ${escHtml(val.slice(0, 125))}<strong style="color:var(--ink-muted);">... more</strong>
          </div>
        </div>
      `;
    };
    capEl.addEventListener("input", update);
    update();
  }

  const erF = document.getElementById("er-followers");
  const erOut = document.getElementById("er-output");
  if (erF && erOut) {
    const calc = () => {
      const f = Math.max(1, Number(document.getElementById("er-followers").value || 1));
      const r = Math.max(1, Number(document.getElementById("er-reach").value || 1));
      const total = Number(document.getElementById("er-likes").value || 0) + Number(document.getElementById("er-saves").value || 0);
      const byFollowers = ((total / f) * 100).toFixed(2);
      const byReach = ((total / r) * 100).toFixed(2);
      erOut.innerHTML = `
        <div class="kpi-grid" style="margin-bottom:0;">
          <div class="card kpi-card"><div class="kpi-top">By Followers</div><div class="kpi-val">${byFollowers}%</div><div class="kpi-foot">${byFollowers >= 3.5 ? "Above creator median" : "Healthy baseline"}</div></div>
          <div class="card kpi-card"><div class="kpi-top">By Reach</div><div class="kpi-val">${byReach}%</div><div class="kpi-foot">True audience resonance</div></div>
        </div>
      `;
    };
    ["er-followers", "er-reach", "er-likes", "er-saves"].forEach((id) => document.getElementById(id)?.addEventListener("input", calc));
    calc();
  }

  const rv = document.getElementById("rate-views");
  const rOut = document.getElementById("rate-output");
  if (rv && rOut) {
    const calcRate = () => {
      const views = Number(document.getElementById("rate-views").value || 0);
      const cpm = Number(document.getElementById("rate-cpm").value || 25);
      const mult = Number(document.getElementById("rate-rights").value || 1);
      const base = Math.round((views / 1000) * cpm * mult);
      rOut.innerHTML = `
        <div class="card card-pad" style="background:var(--bg-subtle);">
          <div style="font-size:12px;color:var(--ink-muted);">Recommended Sponsorship Quote Range</div>
          <div class="plan-price" style="margin-top:4px;">$${Math.round(base * 0.85).toLocaleString()} &ndash; $${Math.round(base * 1.2).toLocaleString()}</div>
          <div style="font-size:12.5px;color:var(--ink-secondary);margin-top:4px;">Includes 1 Reel + 2 Link Sticker Story frames.</div>
        </div>
      `;
    };
    ["rate-views", "rate-cpm", "rate-rights"].forEach((id) => document.getElementById(id)?.addEventListener("input", calcRate));
    calcRate();
  }

  const hookEl = document.getElementById("hook-text");
  const hookOut = document.getElementById("hook-output");
  if (hookEl && hookOut) {
    const calcHook = () => {
      const words = hookEl.value.trim().split(/\s+/).filter(Boolean).length;
      const secs = ((words / 155) * 60).toFixed(1);
      hookOut.innerHTML = `
        <div class="card card-pad" style="background:var(--bg-subtle);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:12px;color:var(--ink-muted);">Estimated Spoken Duration</div>
            <div class="kpi-val" style="margin-top:2px;">${secs}s <span style="font-size:13px;font-weight:500;color:var(--ink-muted);">(${words} words)</span></div>
          </div>
          <span class="badge ${Number(secs) <= 4.5 ? "badge-success" : "badge-warning"}">
            ${Number(secs) <= 4.5 ? "Strong 3–4s Hook Window" : "Trim by ~4 words for punchier hook"}
          </span>
        </div>
      `;
    };
    hookEl.addEventListener("input", calcHook);
    calcHook();
  }

  document.getElementById("btn-run-generic-tool")?.addEventListener("click", () => {
    const val = document.getElementById("generic-tool-input")?.value || "";
    const out = document.getElementById("generic-tool-output");
    if (out) {
      out.innerHTML = `
        <div class="card card-pad" style="background:var(--bg-subtle);display:flex;flex-direction:column;gap:6px;">
          <div style="font-weight:650;font-size:13.5px;">Analysis Ready</div>
          <p style="font-size:13px;color:var(--ink-secondary);">
            Processed input (${val.length} chars). Optimal posting windows: <strong>09:30</strong>, <strong>14:00</strong>, and <strong>20:30 local time</strong> at <strong>1080&times;1350 (4:5)</strong> resolution with 3–5 niche hashtags.
          </p>
        </div>
      `;
    }
  });
}
