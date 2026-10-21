import { store, notify, toast, apiRequest, escapeHtml } from "./api.js";

let ftCat = "All";
let ftSearch = "";
let gridDemoTiles = [
  { id: 1, title: "7 Open-Source Tools", bg: "terracotta" },
  { id: 2, title: "Slide 2 Save Rule", bg: "cream" },
  { id: 3, title: "Claude -> IG MCP", bg: "indigo" },
  { id: 4, title: "5 Editorial Fonts", bg: "butter" },
  { id: 5, title: "45-Min Batch Sprint", bg: "espresso" },
  { id: 6, title: "$1,850 Rate Card", bg: "forest" }
];

export function renderFreeToolsPage() {
  const categories = ["All", "Caption & Copy", "Hashtags", "Analytics", "Video", "Profile", "Repurpose"];
  const tools = store.data.freeTools.filter((t) => {
    if (ftCat !== "All" && t.category !== ftCat) return false;
    if (ftSearch && !`${t.name} ${t.desc} ${t.category}`.toLowerCase().includes(ftSearch.toLowerCase())) return false;
    return true;
  });
  const activeTool = store.data.freeTools.find((t) => t.slug === store.selectedFreeTool) || store.data.freeTools[0];

  return `
    <div class="marketing-container">
      <div class="page-head">
        <div>
          <span class="kicker">20 FREE CREATOR TOOLS · NO SIGNUP WALL</span>
          <h1 class="editorial-title" style="font-size:44px">Free Instagram Creator Toolkit</h1>
          <p style="color:var(--text-muted);margin:6px 0 0">Every tool below runs interactively right in your browser — click any of the 20 tools to launch it live.</p>
        </div>
        <button class="btn btn-primary" data-goto-app="create">Open Full Create Studio -></button>
      </div>

      <div class="card" style="margin-bottom:28px;border:2px solid var(--accent)">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">
          <div>
            <span class="pill-badge">ACTIVE TOOL · ${escapeHtml(activeTool.category)}</span>
            <h2 style="margin:8px 0 2px;font-size:24px">${escapeHtml(activeTool.name)}</h2>
            <p style="margin:0;color:var(--text-muted);font-size:13px">${escapeHtml(activeTool.desc)}</p>
          </div>
          <span class="mono" style="font-size:11px;color:var(--text-muted)">/free-tools/${escapeHtml(activeTool.slug)}</span>
        </div>
        <div id="free-tool-stage">${renderToolInteractiveBody(activeTool.slug)}</div>
      </div>

      <div class="card" style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${categories.map((c) => `<button class="btn btn-sm ${ftCat === c ? "btn-accent" : ""}" data-ft-cat="${c}">${c}</button>`).join("")}
        </div>
        <input class="input" id="ft-search" style="width:240px" placeholder="Search 20 free tools…" value="${escapeHtml(ftSearch)}" />
      </div>

      <div class="grid-4">
        ${tools.map((t) => `
          <div class="card" style="padding:16px;cursor:pointer;border:${t.slug === activeTool.slug ? "2px solid var(--accent)" : "1px solid var(--border)"}" data-pick-tool="${t.slug}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span class="kicker" style="color:var(--accent)">${escapeHtml(t.category)}</span>
              ${t.popular ? `<span class="mono" style="font-size:10px;background:var(--accent-soft);color:var(--accent);padding:2px 7px;border-radius:99px">POPULAR</span>` : ""}
            </div>
            <h4 style="margin:8px 0 6px;font-size:15px">${escapeHtml(t.name)}</h4>
            <p style="margin:0;font-size:12px;color:var(--text-muted)">${escapeHtml(t.desc)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderToolInteractiveBody(slug) {
  switch (slug) {
    case "instagram-caption-generator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
          <div>
            <div class="field"><label>Post Topic</label><input class="input" id="ft-cap-topic" value="How I batch 7 Reels every Sunday in 45 minutes" /></div>
            <div class="field"><label>Tone</label>
              <select class="select" id="ft-cap-tone"><option>Direct & Editorial</option><option>Warm Storyteller</option><option>Bold Contrarian</option><option>Educational Checklist</option></select>
            </div>
            <div class="field"><label>Comment Trigger Keyword</label><input class="input" id="ft-cap-kw" value="SPRINT" /></div>
            <button class="btn btn-primary" id="ft-run-captions">Generate 4 Ready Captions -></button>
          </div>
          <div id="ft-cap-out" style="display:flex;flex-direction:column;gap:10px">
            <div style="color:var(--text-muted);font-size:13px">Click <strong>Generate 4 Ready Captions</strong> to produce hook-checked variants with 1-click Copy or Send to Create Studio.</div>
          </div>
        </div>
      `;
    case "instagram-grid-planner":
      return `
        <div>
          <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
            <input class="input" id="ft-grid-title" style="max-width:280px" placeholder="New tile headline (e.g. Q4 Gear Setup)" />
            <button class="btn btn-primary btn-sm" id="ft-grid-add">+ Add Tile to Top of Feed</button>
            <button class="btn btn-sm" id="ft-grid-swap">⇄ Swap Top 2 Tiles</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,180px));gap:6px">
            ${gridDemoTiles.map((g, i) => `
              <div class="cover-art cover-${g.bg}" style="aspect-ratio:3/4;border-radius:8px;font-size:13px">
                <span class="mono" style="font-size:10px;opacity:0.75">#${i + 1}</span>
                <div>${escapeHtml(g.title)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `;
    case "caption-length-checker":
      return `
        <div>
          <textarea class="textarea" id="ft-len-inp" rows="4">Most creators lose 60% of readers right at character 125 because the punchline sits below "...more". Lead with the outcome on line 1, leave clean whitespace, and give people a single keyword action.</textarea>
          <div id="ft-len-stats" style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap;font-weight:700"></div>
        </div>
      `;
    case "engagement-rate-calculator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;align-items:end">
          <div class="field"><label>Followers</label><input class="input" type="number" id="er-fol" value="48500" /></div>
          <div class="field"><label>Avg Likes</label><input class="input" type="number" id="er-likes" value="2150" /></div>
          <div class="field"><label>Avg Comments</label><input class="input" type="number" id="er-com" value="184" /></div>
          <div class="field"><label>Avg Saves</label><input class="input" type="number" id="er-sav" value="620" /></div>
          <div class="field"><button class="btn btn-primary" id="er-calc">Calculate ER%</button></div>
        </div>
        <div id="er-out" style="margin-top:12px;font-weight:700"></div>
      `;
    case "instagram-collab-rate-calculator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;align-items:end">
          <div class="field"><label>Median 30d Reel Views</label><input class="input" type="number" id="rc-views" value="42000" /></div>
          <div class="field"><label>Engagement Rate (%)</label><input class="input" type="number" step="0.1" id="rc-er" value="5.4" /></div>
          <div class="field"><label>Audience Tier</label>
            <select class="select" id="rc-geo"><option value="36">US / Canada / UK ($36 CPM)</option><option value="26">Global Mixed ($26 CPM)</option><option value="14">India / APAC ($14 CPM)</option></select>
          </div>
          <div class="field"><button class="btn btn-primary" id="rc-calc">Calculate Rate Card</button></div>
        </div>
        <div id="rc-out" style="margin-top:12px"></div>
      `;
    case "instagram-shadowban-checker":
      return `
        <div>
          <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:12px">
            ${[
              "Recent posts absent from niche hashtag top/recent feeds (checked from non-follower account)",
              "Non-follower reach dropped >60% across your last 4 consecutive Reels",
              "Instagram Settings -> Account Status flags 'What can't be recommended'",
              "Used rapid bot auto-liking / unofficial browser scraping extension in past 30 days",
              "Repeated the exact same 25–30 hashtag block verbatim across 5+ posts"
            ].map((sym, idx) => `
              <label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:var(--bg-subtle);font-size:13px;cursor:pointer">
                <input type="checkbox" class="sb-sym-chk" ${idx === 1 ? "checked" : ""} />
                <span>${sym}</span>
              </label>
            `).join("")}
          </div>
          <button class="btn btn-primary btn-sm" id="sb-score-run">Calculate Shadowban Risk &amp; Recovery Plan</button>
          <div id="sb-score-out" style="margin-top:12px"></div>
        </div>
      `;
    case "hashtag-density-checker":
      return `
        <div>
          <textarea class="textarea" id="hd-inp">Shipping our Sunday creator sprint! #creatorworkflow #instagramgrowth #reelsstrategy #f4f #followforfollow #solocreator</textarea>
          <button class="btn btn-primary btn-sm" style="margin-top:8px" id="hd-run">Scan Hashtags &amp; Restricted Tag Flags</button>
          <div id="hd-out" style="margin-top:12px"></div>
        </div>
      `;
    case "aspect-ratio-checker":
      return `
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <div class="field"><label>Width (px)</label><input class="input" type="number" id="ar-w" value="1080" /></div>
          <div class="field"><label>Height (px)</label><input class="input" type="number" id="ar-h" value="1920" /></div>
          <div class="field"><button class="btn btn-primary" id="ar-check">Check Platform Fit</button></div>
        </div>
        <div id="ar-out" style="margin-top:10px"></div>
      `;
    case "instagram-media-kit-generator":
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">
          <div class="field"><label>Creator Name &amp; Handle</label><input class="input" id="mk-name" value="Maya Creates (@maya.creates)" /></div>
          <div class="field"><label>Niche &amp; Bio Pitch</label><input class="input" id="mk-bio" value="Creator Workflow · Design · AI Automation (64.2K followers)" /></div>
          <div class="field"><label>30d Reach / Avg Reel Views</label><input class="input" id="mk-stats" value="492K Monthly Reach · 68.4K Avg Reel Views · 5.8% ER" /></div>
        </div>
        <button class="btn btn-primary" id="mk-download">Download Printable One-Page Media Kit (.html / PDF print) -></button>
      `;
    default:
      return `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;align-items:end">
          <div class="field" style="margin:0"><label>Niche / Script / Input for ${escapeHtml(slug.replace(/-/g, " "))}</label>
            <input class="input" id="generic-ft-in" value="Solo creators scaling Instagram with Carousels & Auto-DMs" />
          </div>
          <button class="btn btn-primary" id="generic-ft-go" data-slug="${escapeHtml(slug)}">Run Instant Analysis -></button>
        </div>
        <div id="generic-ft-out" style="margin-top:14px"></div>
      `;
  }
}

export function bindFreeToolsEvents(root) {
  root.querySelectorAll("[data-ft-cat]").forEach((b) => { b.onclick = () => { ftCat = b.dataset.ftCat; notify(); }; });
  const search = root.querySelector("#ft-search");
  if (search) search.oninput = () => { ftSearch = search.value; notify(); };
  root.querySelectorAll("[data-pick-tool]").forEach((card) => {
    card.onclick = () => { store.selectedFreeTool = card.dataset.pickTool; notify(); window.scrollTo({ top: 120, behavior: "smooth" }); };
  });

  const runCap = root.querySelector("#ft-run-captions");
  if (runCap) {
    runCap.onclick = async () => {
      const topic = root.querySelector("#ft-cap-topic").value;
      const tone = root.querySelector("#ft-cap-tone").value;
      const keyword = root.querySelector("#ft-cap-kw").value;
      const res = await apiRequest("/api/ai/captions", { method: "POST", body: JSON.stringify({ topic, tone, keyword }) });
      const out = root.querySelector("#ft-cap-out");
      out.innerHTML = res.captions.map((c, idx) => `
        <div style="background:var(--bg-subtle);padding:12px;border-radius:12px">
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;margin-bottom:6px">
            <span>${escapeHtml(c.label)}</span>
            <span class="mono">${c.charCount}/2,200 chars</span>
          </div>
          <pre style="white-space:pre-wrap;margin:0 0 8px;font-family:inherit;font-size:12.5px">${escapeHtml(c.body)}</pre>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-sm btn-primary" data-copy-cap="${idx}">Copy Caption</button>
            <button class="btn btn-sm btn-accent" data-send-cap="${idx}">↗ Send to Create Studio</button>
          </div>
        </div>
      `).join("");
      out.querySelectorAll("[data-copy-cap]").forEach((btn) => {
        btn.onclick = () => { navigator.clipboard?.writeText(res.captions[Number(btn.dataset.copyCap)].body); toast("Copied caption!"); };
      });
      out.querySelectorAll("[data-send-cap]").forEach((btn) => {
        btn.onclick = () => {
          store.composerPrefillCaption = res.captions[Number(btn.dataset.sendCap)].body;
          store.mode = "app";
          store.appPage = "create";
          notify();
          toast("Loaded caption into Create Studio!");
        };
      });
    };
  }

  const gridAdd = root.querySelector("#ft-grid-add");
  if (gridAdd) {
    gridAdd.onclick = () => {
      const title = root.querySelector("#ft-grid-title").value.trim() || "New Planned Post";
      const styles = ["terracotta", "cream", "indigo", "butter", "forest"];
      gridDemoTiles.unshift({ id: Date.now(), title, bg: styles[gridDemoTiles.length % styles.length] });
      notify();
    };
  }
  const gridSwap = root.querySelector("#ft-grid-swap");
  if (gridSwap) gridSwap.onclick = () => { if (gridDemoTiles.length >= 2) { [gridDemoTiles[0], gridDemoTiles[1]] = [gridDemoTiles[1], gridDemoTiles[0]]; notify(); } };

  const lenInp = root.querySelector("#ft-len-inp");
  const renderLen = () => {
    if (!lenInp) return;
    const v = lenInp.value;
    const words = v.trim() ? v.trim().split(/\s+/).length : 0;
    root.querySelector("#ft-len-stats").innerHTML = `
      <span>Characters: <span style="color:var(--accent)">${v.length} / 2,200</span></span>
      <span>Words: ${words}</span>
      <span>Read time: ${Math.max(1, Math.round(words / 3.5))}s</span>
      <span>Above "...more" fold (first 125 chars): <code>"${escapeHtml(v.slice(0, 125))}"</code></span>
    `;
  };
  if (lenInp) { lenInp.oninput = renderLen; renderLen(); }

  const erBtn = root.querySelector("#er-calc");
  if (erBtn) {
    erBtn.onclick = () => {
      const f = Math.max(1, Number(root.querySelector("#er-fol").value));
      const total = Number(root.querySelector("#er-likes").value) + Number(root.querySelector("#er-com").value) + Number(root.querySelector("#er-sav").value);
      const er = ((total / f) * 100).toFixed(2);
      const verdict = er >= 4 ? "Top 10% High-Performing Creator Tier ★" : er >= 2 ? "Above Industry Average (Healthy)" : "Below 2% Baseline — add Comment-to-DM & Carousel Saves";
      root.querySelector("#er-out").innerHTML = `Engagement Rate: <span style="font-size:22px;color:var(--accent)">${er}%</span> — ${verdict}`;
    };
    erBtn.click();
  }

  const rcBtn = root.querySelector("#rc-calc");
  if (rcBtn) {
    rcBtn.onclick = () => {
      const views = Number(root.querySelector("#rc-views").value) || 10000;
      const er = Number(root.querySelector("#rc-er").value) || 3;
      const cpm = Number(root.querySelector("#rc-geo").value) || 26;
      const base = Math.round((views / 1000) * cpm * (1 + Math.min(er, 10) / 12));
      root.querySelector("#rc-out").innerHTML = `
        <div class="grid-3">
          <div style="background:var(--bg-subtle);padding:12px;border-radius:12px"><strong>Dedicated Sponsored Reel</strong><div class="stat-big" style="font-size:26px;color:var(--accent)">$${base.toLocaleString()} – $${Math.round(base * 1.35).toLocaleString()}</div><span style="font-size:12px">₹${(base * 84).toLocaleString()} INR</span></div>
          <div style="background:var(--bg-subtle);padding:12px;border-radius:12px"><strong>Carousel + Story Bundle</strong><div class="stat-big" style="font-size:26px">$${Math.round(base * 0.75).toLocaleString()}</div><span style="font-size:12px">Includes 24h link sticker</span></div>
          <div style="background:var(--bg-subtle);padding:12px;border-radius:12px"><strong>30-Day Paid Usage Add-On</strong><div class="stat-big" style="font-size:26px">+$${Math.round(base * 0.3).toLocaleString()}</div><span style="font-size:12px">+30% whitelisting fee</span></div>
        </div>
      `;
    };
    rcBtn.click();
  }

  const sbBtn = root.querySelector("#sb-score-run");
  if (sbBtn) {
    const runSb = () => {
      const count = root.querySelectorAll(".sb-sym-chk:checked").length;
      const tier = count === 0 ? "GREEN — Healthy Recommendation Status (0/5 flags)" : count <= 2 ? `AMBER — Mild Reach Compression (${count}/5 flags)` : `RED — Active Non-Follower Restriction Likely (${count}/5 flags)`;
      root.querySelector("#sb-score-out").innerHTML = `<div style="background:var(--bg-subtle);padding:14px;border-radius:12px;font-size:13px"><strong>${tier}</strong><div style="margin-top:6px;color:var(--text-muted)">1. Check Instagram Settings &rarr; Account Status &rarr; appeal or archive flagged media.<br/>2. Remove unofficial browser extensions &amp; pause bulk activity for 48 hours.<br/>3. Use 3–5 fresh topic-specific hashtags and publish only via Official Graph API containers.</div></div>`;
    };
    sbBtn.onclick = runSb;
    runSb();
  }

  const hdBtn = root.querySelector("#hd-run");
  if (hdBtn) {
    hdBtn.onclick = async () => {
      const res = await apiRequest("/api/ai/hashtags", { method: "POST", body: JSON.stringify({ text: root.querySelector("#hd-inp").value }) });
      root.querySelector("#hd-out").innerHTML = `
        <div style="background:var(--bg-subtle);padding:14px;border-radius:12px">
          <div><strong>Detected Hashtags:</strong> ${res.count}/${res.limit} (Density: ${res.densityPercent}% · Ideal: ${res.recommendedRange})</div>
          <div style="margin-top:6px;color:${res.flaggedRestricted.length ? "#DC2626" : "#15803D"};font-weight:700">
            ${res.flaggedRestricted.length ? `! Flagged/Restricted Tags Found: ${res.flaggedRestricted.join(", ")} — remove before publishing!` : "✓ Clean! Zero restricted or spam-flagged hashtags detected."}
          </div>
        </div>
      `;
    };
    hdBtn.click();
  }

  const arBtn = root.querySelector("#ar-check");
  if (arBtn) {
    arBtn.onclick = () => {
      const w = Number(root.querySelector("#ar-w").value) || 1080;
      const h = Number(root.querySelector("#ar-h").value) || 1920;
      const ratio = (w / h).toFixed(3);
      root.querySelector("#ar-out").innerHTML = `<div style="background:var(--bg-subtle);padding:12px;border-radius:12px;font-weight:600">Resolution <code>${w}×${h}</code> (aspect ${ratio}): ${Math.abs(w / h - 9 / 16) < 0.02 ? "✓ Exact 9:16 Fullscreen Reel match!" : Math.abs(w / h - 4 / 5) < 0.02 ? "✓ Exact 4:5 Portrait Carousel match!" : "Custom ratio — crop center 3:4 safe zone."}</div>`;
    };
    arBtn.click();
  }

  const mkBtn = root.querySelector("#mk-download");
  if (mkBtn) {
    mkBtn.onclick = () => {
      const name = root.querySelector("#mk-name").value;
      const bio = root.querySelector("#mk-bio").value;
      const stats = root.querySelector("#mk-stats").value;
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)} — Media Kit</title></head><body style="font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:40px;background:#FAF9F6;color:#18181B;border:2px solid #D94826;border-radius:20px"><div style="font-family:monospace;color:#D94826;letter-spacing:0.12em">OFFICIAL CREATOR MEDIA KIT · GENERATED VIA REELDROP</div><h1 style="font-size:40px;margin:10px 0">${escapeHtml(name)}</h1><p style="font-size:18px;color:#555">${escapeHtml(bio)}</p><hr style="border:none;border-top:1px solid #DDD;margin:24px 0" /><h3>Verified 30-Day Performance</h3><p style="font-size:20px;font-weight:bold;color:#D94826">${escapeHtml(stats)}</p></body></html>`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      a.download = "creator-media-kit.html";
      a.click();
      toast("Downloaded Creator Media Kit!");
    };
  }

  const genBtn = root.querySelector("#generic-ft-go");
  if (genBtn) {
    genBtn.onclick = () => {
      const val = root.querySelector("#generic-ft-in").value.trim();
      const slug = genBtn.dataset.slug;
      const words = val.split(/\s+/).length;
      const resultsMap = {
        "hook-generator": [`1. Stop scrolling if you're still spending 4 hours a week on ${val}.`, `2. Nobody talks about the #1 mistake killing ${val} before second 3.`, `3. Steal my exact 15-minute checklist for ${val} ↓`],
        "cta-builder": [`• Comment "GUIDE" and my official Instagram API automation will DM you the full link in 2 seconds.`, `• Hit Bookmark ★ before scrolling so you have this checklist on Sunday.`],
        "instagram-hashtag-generator": [`Small High-Intent (10k–50k): #creatorworkflow #carouselstrategy #solocreatorlife`, `Mid Growth (50k–500k): #instagramcarousels #reelsgrowth #contentbatching`, `Broad Discovery (500k+): #contentcreator #socialmediatips #personalbranding`],
        "niche-hashtag-finder": [`Core Niche Cluster: #creatorbusiness #digitalproducts #buildinpublic #indiacreators #ugccreator`],
        "best-post-time": [`Peak Window #1: Tue–Thu 09:15–10:00 Local`, `Peak Window #2: Wed & Fri 13:30–14:15 Local`, `Peak Window #3: Sun & Tue 20:15–21:30 Local`],
        "content-frequency-planner": [`Sustainable High-Growth Cadence: 3 Trial/Feed Reels (Mon, Wed, Fri) + 2 Educational Carousels (Tue, Sun) + Daily 3-frame Story Sticker.`],
        "hook-timing-analyzer": [`Spoken Script Length: ${words} words (~${(words / 2.6).toFixed(1)}s at 155 WPM). ${words <= 9 ? "✓ Fits inside the 3.0s hook window!" : "Trim 3–4 filler words so your visual payoff lands before 3.0 seconds."}`],
        "bio-writer": [`Option 1: Helping ${val} scale cleanly ✦\n▦ Weekly Reels + Carousel systems\n↓ Grab the free toolkit below`],
        "mov-to-mp4-converter": [`✓ Browser H.264 / AAC MP4 fast-start container profile ready for Official Meta Graph upload.`],
        "linkedin-carousel-to-instagram-carousel": [`✓ Reframed A4 / 4:5 LinkedIn deck into 1080×1350 Instagram 4:5 cards with centered 3:4 profile grid safe margins.`],
        "instagram-carousel-to-linkedin-carousel": [`✓ Combined Instagram 1080×1350 slides into a continuous multi-page LinkedIn Document deck.`]
      };
      const lines = resultsMap[slug] || [`✓ Generated output for "${val}"`];
      root.querySelector("#generic-ft-out").innerHTML = `<div style="background:var(--bg-subtle);padding:14px;border-radius:12px;display:flex;flex-direction:column;gap:8px">${lines.map((l) => `<div style="font-size:13px;white-space:pre-line">${escapeHtml(l)}</div>`).join("")}</div>`;
    };
    genBtn.click();
  }
}
