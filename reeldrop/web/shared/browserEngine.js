import { PLANS_CONFIG } from "./plansConfig.js";
import { CAROUSEL_THEMES } from "./themes.js";
import { FREE_TOOLS_CATALOG } from "./freeToolsCatalog.js";
import { createInitialSeedState } from "./seedData.js";

const STORAGE_KEY = "reeldrop_v2_persistent_state";

const RESTRICTED_HASHTAGS = new Set([
  "followforfollow", "f4f", "like4like", "l4l", "instababy", "alone",
  "beautyblogger", "desk", "pushups", "models", "tag4like", "spam4spam"
]);

const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

export function getSavedClientSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) return parsed;
  } catch {}
  return null;
}

export function saveClientSnapshot(snap) {
  try {
    if (snap && Array.isArray(snap.workspaces)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    }
  } catch {}
}

export function clearClientSnapshot() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

function getOrInitLocalState() {
  const existing = getSavedClientSnapshot();
  if (existing) return existing;
  const fresh = createInitialSeedState();
  saveClientSnapshot(fresh);
  return fresh;
}

function getPlanSpec(planId = "starter") {
  return PLANS_CONFIG.plans[planId] || PLANS_CONFIG.plans.starter;
}

function browserGenerateCaptions({ topic = "building consistent creator systems", tone = "Direct & Editorial", includeHashtags = true, keyword = "GUIDE" }) {
  const cleanTopic = (topic || "").trim() || "shipping high-retention Instagram content";
  const slugTag = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "creatorworkflow";
  const tags = includeHashtags ? `\n\n#${slugTag} #instagramgrowth #creatorworkflow #contentstrategy #reelsgrowth #solocreator` : "";
  return [
    {
      label: `${tone} · Story + Payoff`,
      body: `Most creators overcomplicate ${cleanTopic} before they ever ship post #10.\n\nHere is the 3-part loop that turned sporadic views into compounding saves:\n1. Open with the exact friction your audience felt today\n2. Show one concrete fix on screen in under 18 seconds\n3. Pair the post with an instant Comment -> DM resource\n\nComment "${keyword}" below and I'll send the full checklist straight to your DMs.${tags}`
    },
    {
      label: `${tone} · Contrarian Hook`,
      body: `Unpopular take: ${cleanTopic} isn't an algorithm problem — it's a packaging problem.\n\nWhen your first 125 characters name the exact outcome clearly, cold viewers stay through the payoff frame.\n\nComment "${keyword}" and I'll DM you the template.${tags}`
    },
    {
      label: `${tone} · Step-by-Step Checklist`,
      body: `Steal this 15-minute checklist for ${cleanTopic}:\n\n• Write Slide 1 + Slide 2 together so second-impression feed views convert\n• Cut dead air before word #1 in your Reel hook\n• Check 3:4 profile grid crop before scheduling\n\nDrop "${keyword}" below for the resource pack.${tags}`
    },
    {
      label: `${tone} · Minimal Direct`,
      body: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.\n\nLess tab-hopping. Sharper hooks. Every link delivered automatically in DMs.\n\nComment "${keyword}" for the exact setup.${tags}`
    }
  ].map((v) => ({ ...v, charCount: v.body.length, foldPreview: v.body.slice(0, 125) }));
}

function browserGenerateSlides({ prompt = "5 ways to grow with Instagram carousels", slideCount = 5, themeId = "bold_highlight" }) {
  const theme = CAROUSEL_THEMES.find((t) => t.id === themeId) || CAROUSEL_THEMES[0];
  const count = Math.min(10, Math.max(3, Number(slideCount) || 5));
  const clean = (prompt || "").trim() || "5 ways to turn profile visits into loyal followers";
  const steps = [
    ["Lead with the sharpest tension above the eye-line", "Your Slide 1 headline only needs 7–11 words so cold viewers stop immediately."],
    ["Make Slide 2 your second hook for repeat feed impressions", "Instagram re-serves carousels on Slide 2 automatically — reward the swipe."],
    ["Stick to one takeaway + one proof point per card", "Generous margins and one highlighted idea triple completion to the final slide."],
    ["Frame key typography inside the 3:4 profile grid box", "Export at 1080×1350 (4:5) while keeping headlines centered for your profile grid."],
    ["Anchor numbers with real benchmarks instead of vague claims", "Concrete specifics lift saves by over 2.1× across educational decks."],
    ["Close with a Comment-to-DM keyword reward", "Pair the final card with an instant DM link pack so saves and comments compound."]
  ];
  const slides = [{
    tag: "HOOK",
    headline: clean.slice(0, 68),
    body: `Styled in ${theme.name} — swipe through every actionable step & save this deck.`,
    badge: `${theme.category.toUpperCase()} · ${count} SLIDES`
  }];
  for (let i = 1; i < count - 1; i++) {
    const [h, b] = steps[(i - 1) % steps.length];
    slides.push({ tag: String(i).padStart(2, "0"), headline: h, body: b, badge: `STEP ${String(i).padStart(2, "0")}` });
  }
  slides.push({
    tag: String(count - 1).padStart(2, "0"),
    headline: "Save this deck + comment 'GUIDE' for the full template pack",
    body: "Hit Save in the corner and drop GUIDE below — I'll send the checklist straight to your DMs.",
    badge: "SAVE & COMMENT"
  });
  return { theme, slides, suggestedCaption: `${clean} — broken down slide by slide.\n\nComment GUIDE below for the full resource link! ↓` };
}

function buildBundleFromState(st, workspaceId = "ws_maya", reaCache = null) {
  const workspaces = st.workspaces.map((w) => ({
    ...w,
    posting_slots: typeof w.posting_slots === "string" ? JSON.parse(w.posting_slots || "[]") : w.posting_slots,
    planSpec: getPlanSpec(w.plan)
  }));
  const active = workspaces.find((w) => w.id === workspaceId) || workspaces[0];
  const posts = [...st.posts].filter((p) => p.workspace_id === active.id).sort((a, b) => String(b.scheduled_at).localeCompare(String(a.scheduled_at)));
  const gridPlaceholders = st.grid_placeholders.filter((g) => g.workspace_id === active.id);
  const carousels = st.carousels.filter((c) => c.workspace_id === active.id).map((c) => ({ ...c, slides: JSON.parse(c.slides_json || "[]") }));
  const automations = st.automations.filter((a) => a.workspace_id === active.id).map((a) => ({
    ...a,
    keywords: JSON.parse(a.keywords_json || "[]"),
    public_reply_variants: JSON.parse(a.public_reply_variants_json || "[]"),
    buttons: JSON.parse(a.buttons_json || "[]")
  }));
  const threads = [...st.inbox_threads]
    .filter((t) => t.workspace_id === active.id)
    .sort((a, b) => (b.is_pinned - a.is_pinned) || String(b.updated_at).localeCompare(String(a.updated_at)))
    .map((t) => {
      const msgs = st.inbox_messages.filter((m) => m.thread_id === t.id).map((m) => ({ ...m, buttons: JSON.parse(m.buttons_json || "[]") }));
      const ageHours = (Date.now() - new Date(t.last_user_message_at).getTime()) / 3600000;
      return {
        ...t,
        tags: JSON.parse(t.tags_json || "[]"),
        windowOpen: ageHours <= 24,
        windowHoursRemaining: Math.max(0, Number((24 - ageHours).toFixed(1))),
        messages: msgs
      };
    });
  const comments = (st.comments || []).filter((c) => c.workspace_id === active.id && !c.is_hidden);
  const notifications = st.notifications.filter((n) => n.workspace_id === active.id);

  return {
    metrics: { ...st.platform_metrics },
    plansConfig: PLANS_CONFIG,
    themes: CAROUSEL_THEMES,
    freeTools: FREE_TOOLS_CATALOG,
    mcpTools: reaCache?.mcpTools || [],
    reaEvidence: reaCache?.reaEvidence || { ready: true, reaVersion: "6.7.0", artifacts: [] },
    workspaces,
    activeWorkspace: active,
    posts,
    gridPlaceholders,
    carousels,
    automations,
    threads,
    comments,
    notifications,
    serverStateSnapshot: st
  };
}

export async function executeStaticBrowserFallback(pathUrl, options = {}, cachedMeta = {}) {
  const st = getOrInitLocalState();
  const u = new URL(pathUrl, location.origin);
  const p = u.pathname;
  const body = options.body ? JSON.parse(options.body) : {};
  const now = new Date().toISOString();

  if (p === "/api/bootstrap" || p === "/api/bootstrap/hydrate") {
    const wsId = u.searchParams.get("workspaceId") || body.workspaceId || "ws_maya";
    return buildBundleFromState(st, wsId, cachedMeta);
  }
  if (p === "/api/state/reset") {
    const fresh = createInitialSeedState();
    saveClientSnapshot(fresh);
    return buildBundleFromState(fresh, "ws_maya", cachedMeta);
  }
  if (p === "/api/workspaces/switch-plan") {
    const ws = st.workspaces.find((w) => w.id === body.workspaceId) || st.workspaces[0];
    ws.plan = body.plan;
    ws.billing_cycle = body.billingCycle || "yearly";
    saveClientSnapshot(st);
    return buildBundleFromState(st, ws.id, cachedMeta);
  }
  if (p === "/api/workspaces/settings") {
    const ws = st.workspaces.find((w) => w.id === body.workspaceId) || st.workspaces[0];
    if (body.timezone) ws.timezone = body.timezone;
    if (body.postingSlots) ws.posting_slots = JSON.stringify(body.postingSlots);
    if (body.gridCrop) ws.grid_crop = body.gridCrop;
    saveClientSnapshot(st);
    return buildBundleFromState(st, ws.id, cachedMeta);
  }
  if (p === "/api/workspaces/create") {
    const id = uid("ws");
    const handle = String(body.igHandle || "new.creator").replace(/^@/, "");
    st.workspaces.push({
      id, name: body.name || `@${handle} Studio`, ig_handle: handle, ig_account_id: "17841499120011",
      avatar_color: "#7C3AED", plan: body.plan || "creator", billing_cycle: "yearly", timezone: "Asia/Calcutta",
      posting_slots: JSON.stringify(["09:30", "14:00", "20:30"]), grid_crop: "4:5", followers_count: 14800,
      ai_captions_used: 0, ai_carousel_images_used: 0, trial_reels_used: 0, ai_dm_replies_used: 0,
      referral_code: `${handle.toUpperCase()}-FREE`, referral_months_earned: 1, created_at: now
    });
    st.platform_metrics.creators_signed_up += 1;
    saveClientSnapshot(st);
    return buildBundleFromState(st, id, cachedMeta);
  }
  if (p === "/api/posts") {
    const ws = st.workspaces.find((w) => w.id === body.workspaceId) || st.workspaces[0];
    st.posts.unshift({
      id: uid("post"), workspace_id: ws.id, media_type: (body.mediaType || "REEL").toUpperCase(),
      status: body.status || "SCHEDULED", title: body.title || "Scheduled Post", caption: body.caption || "",
      hashtags: body.hashtags || "", first_comment: body.firstComment || "", cover_style: body.coverStyle || "terracotta",
      cover_label: (body.coverLabel || body.title || "NEW POST").slice(0, 34).toUpperCase(),
      collab_handle: String(body.collabHandle || "").replace(/^@/, ""),
      is_trial_reel: body.isTrialReel ? 1 : 0, trial_graduated: 0, automation_id: body.automationId || null,
      scheduled_at: body.scheduledAt || now, published_at: null, error_reason: "",
      views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0, created_at: now
    });
    st.platform_metrics.reels_scheduled += 1;
    saveClientSnapshot(st);
    return buildBundleFromState(st, ws.id, cachedMeta);
  }
  if (p === "/api/posts/update") {
    const post = st.posts.find((x) => x.id === body.postId);
    if (post) {
      if (body.action === "delete") st.posts = st.posts.filter((x) => x.id !== post.id);
      else if (body.action === "retry") { post.status = "SCHEDULED"; post.error_reason = ""; }
      else if (body.action === "publish_now") { post.status = "PUBLISHED"; post.views = 22480; post.reach = 19120; post.saves = 1040; }
      else if (body.action === "graduate_trial") { post.trial_graduated = 1; post.views += 28400; }
      else Object.assign(post, {
        title: body.title ?? post.title,
        caption: body.caption ?? post.caption,
        scheduled_at: body.scheduledAt ?? post.scheduled_at,
        collab_handle: body.collabHandle !== undefined ? String(body.collabHandle).replace(/^@/, "") : post.collab_handle,
        automation_id: body.automationId === undefined ? post.automation_id : (body.automationId || null)
      });
      saveClientSnapshot(st);
      return buildBundleFromState(st, post.workspace_id, cachedMeta);
    }
  }
  if (p === "/api/posts/swap") {
    const a = st.posts.find((x) => x.id === body.postAId);
    const b = st.posts.find((x) => x.id === body.postBId);
    if (a && b) { const t = a.scheduled_at; a.scheduled_at = b.scheduled_at; b.scheduled_at = t; saveClientSnapshot(st); }
    return buildBundleFromState(st, a?.workspace_id || "ws_maya", cachedMeta);
  }
  if (p === "/api/grid/placeholders") {
    if (body.action === "delete") st.grid_placeholders = st.grid_placeholders.filter((g) => g.id !== body.placeholderId);
    else if (body.action === "convert") {
      const ph = st.grid_placeholders.find((g) => g.id === body.placeholderId);
      if (ph) {
        st.grid_placeholders = st.grid_placeholders.filter((g) => g.id !== ph.id);
        st.posts.unshift({ id: uid("post"), workspace_id: ph.workspace_id, media_type: "POST", status: "SCHEDULED", title: ph.note.slice(0, 48), caption: ph.note, hashtags: "", first_comment: "", cover_style: "butter", cover_label: ph.note.slice(0, 28).toUpperCase(), collab_handle: "", is_trial_reel: 0, trial_graduated: 0, automation_id: null, scheduled_at: now, published_at: null, error_reason: "", views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0, created_at: now });
      }
    } else {
      st.grid_placeholders.unshift({ id: uid("grid"), workspace_id: body.workspaceId, note: String(body.note || "").slice(0, 280), color: body.color || "#FDE68A", position_order: 0, created_at: now });
    }
    saveClientSnapshot(st);
    return buildBundleFromState(st, body.workspaceId, cachedMeta);
  }
  if (p === "/api/ai/captions") {
    return { captions: browserGenerateCaptions(body) };
  }
  if (p === "/api/ai/hashtags") {
    const tags = (String(body.text || "").match(/#[a-zA-Z0-9_]+/g) || []).map((t) => t.toLowerCase());
    const words = String(body.text || "").trim().split(/\s+/).filter(Boolean).length;
    return { count: tags.length, limit: 30, recommendedRange: "3–8 hyper-relevant tags", densityPercent: words ? Number(((tags.length / words) * 100).toFixed(1)) : 0, flaggedRestricted: tags.filter((t) => RESTRICTED_HASHTAGS.has(t.slice(1))), tags };
  }
  if (p === "/api/carousels/generate") {
    const gen = browserGenerateSlides(body);
    const id = uid("car");
    st.carousels.unshift({ id, workspace_id: body.workspaceId || "ws_maya", title: String(body.prompt || "Carousel").slice(0, 60), prompt: body.prompt, theme_id: body.themeId || "bold_highlight", aspect_ratio: "4:5", caption: gen.suggestedCaption, slides_json: JSON.stringify(gen.slides), created_at: now });
    saveClientSnapshot(st);
    return { createdId: id, ...buildBundleFromState(st, body.workspaceId || "ws_maya", cachedMeta) };
  }
  if (p === "/api/carousels/update") {
    const c = st.carousels.find((x) => x.id === body.carouselId);
    if (c) {
      if (body.themeId) c.theme_id = body.themeId;
      if (body.slides) c.slides_json = JSON.stringify(body.slides);
      saveClientSnapshot(st);
      return buildBundleFromState(st, c.workspace_id, cachedMeta);
    }
  }
  if (p === "/api/campaigns/apply") {
    return { ok: true, message: "Application submitted! Campaign briefs reach your inbox within 48h." };
  }
  return buildBundleFromState(st, body.workspaceId || "ws_maya", cachedMeta);
}
