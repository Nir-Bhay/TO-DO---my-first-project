import { CAROUSEL_THEMES } from "../config/themes.js";

const RESTRICTED_HASHTAGS = new Set([
  "followforfollow", "f4f", "like4like", "l4l", "instababy", "alone",
  "beautyblogger", "desk", "pushups", "models", "tag4like", "spam4spam"
]);

export function generateCaptions({
  topic = "building consistent creator systems",
  tone = "Direct & Editorial",
  includeHashtags = true,
  keyword = "GUIDE"
}) {
  const cleanTopic = topic.trim() || "shipping high-retention Instagram content";
  const slugTag = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "creatorworkflow";
  const kw = (keyword || "GUIDE").trim().toUpperCase();
  const tags = includeHashtags
    ? `\n\n#${slugTag} #contentstrategy #instagramcreator #designsystems #audiencegrowth #solofounder`
    : "";

  const variants = [
    {
      label: `${tone} — Hook + Three Takeaways`,
      score: 95,
      hook: `Most teams overcomplicate ${cleanTopic} before they ever ship post #10.`,
      body: `Most teams overcomplicate ${cleanTopic} before they ever ship post #10.\n\nHere is the 3-part loop that turned sporadic reach into consistent saves:\n1. Open with the exact friction your reader ran into today\n2. Show one concrete fix on screen in under 18 seconds\n3. Pair the post with an instant keyword DM resource\n\nComment "${kw}" below and I will send the full checklist straight to your DMs.${tags}`
    },
    {
      label: `${tone} — Contrarian Opener`,
      score: 92,
      hook: `Unpopular take: ${cleanTopic} is rarely an algorithm problem — it is a packaging problem.`,
      body: `Unpopular take: ${cleanTopic} is rarely an algorithm problem — it is a packaging problem.\n\nWhen your opening 125 characters name the exact outcome clearly, cold viewers stay through the payoff frame and bookmark the post for later.\n\nSave this for your next batch session, or comment "${kw}" for the template.${tags}`
    },
    {
      label: `${tone} — Practical Checklist`,
      score: 89,
      hook: `Use this 15-minute checklist before publishing on ${cleanTopic}:`,
      body: `Use this 15-minute checklist before publishing on ${cleanTopic}:\n\n- Write Slide 1 and Slide 2 together so second-chance feed impressions convert\n- Cut dead air before the first spoken word in your video hook\n- Preview your 4:5 profile grid crop before scheduling\n\nDrop "${kw}" in the comments and my automated DM workflow will send the resource pack right away.${tags}`
    },
    {
      label: `${tone} — Concise Founder Note`,
      score: 87,
      hook: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.`,
      body: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.\n\nFewer scattered docs. Stronger hooks. Every link delivered automatically inside DMs.\n\nComment "${kw}" if you want the exact setup.${tags}`
    }
  ];

  return variants.map((v) => ({
    ...v,
    charCount: v.body.length,
    foldPreview: v.body.slice(0, 125)
  }));
}

export function generateFullAiPostPack({
  topic = "design tokens & component architecture",
  tone = "Editorial",
  mediaType = "REEL",
  goal = "dm_leads",
  keyword = "KIT",
  igHandle = "maya.studio"
}) {
  const clean = topic.trim() || "clean creator workflows";
  const kw = (keyword || "KIT").trim().toUpperCase();
  const baseSlug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "velorastudio";
  const words = clean.split(/\s+/).filter(Boolean);
  const shortTitle = words.slice(0, 6).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

  const goalClosing = {
    dm_leads: `Comment "${kw}" below and I will send the complete ${shortTitle} starter kit straight to your DMs.`,
    saves: `Bookmark this ${mediaType.toLowerCase()} right now so it is sitting ready for your next weekly planning session.`,
    follows: `Follow @${igHandle} for practical weekly breakdowns on ${clean} — zero fluff.`,
    clicks: `Tap the resource link via "${kw}" in the comments to try the live template right away.`
  }[goal] || `Comment "${kw}" below for the full resource pack.`;

  const hooks = [
    { score: 96, label: "Curiosity Gap", style: "Curiosity Gap", text: `Stop guessing at ${clean} — steal the exact 3-step system we use every week.` },
    { score: 93, label: "Data-Backed", style: "Data-Backed", text: `Why 80% of creators lose retention in the first 3 seconds of ${clean} (and the quick fix).` },
    { score: 91, label: "Contrarian", style: "Contrarian", text: `You do not need 10 tools for ${clean}. You need one clean repeatable checklist.` },
    { score: 88, label: "Direct Value", style: "Direct Value", text: `Save 4+ hours a week on ${clean} with this simple structure:` }
  ];

  const caption = `${hooks[0].text}\n\nWhat actually moves the needle:\n1. Lead with one unmistakable visual outcome in frame #1\n2. Keep every slide or cut focused on a single concrete takeaway\n3. Give interested readers an instant one-word DM resource instead of a dead bio link\n\n${goalClosing}`;

  const hashtagTiers = {
    niche: [`#${baseSlug}`, "#designsystems", "#creatorops"],
    midTier: ["#contentstrategy", "#digitalproduct", "#indiefounder"],
    broad: ["#uiux", "#productivity"]
  };

  return {
    title: shortTitle,
    coverLabel: shortTitle.slice(0, 32).toUpperCase(),
    coverSub: `${mediaType} · ${tone.toUpperCase()} BREAKDOWN`,
    hooks,
    caption,
    hashtags: [...hashtagTiers.niche, ...hashtagTiers.midTier, ...hashtagTiers.broad].join(" "),
    hashtagTiers,
    firstComment: `Drop "${kw}" below and my Official API automation will send the resource link to your DMs in under 2 seconds.`,
    bestSlot: "20:30 IST",
    recommendedSlot: "20:30",
    slotReason: "Peak save-to-reach velocity (+24% non-follower completion window)"
  };
}

export function rewriteCaptionWithAi({ caption = "", mode = "punchier", keyword = "KIT" }) {
  const raw = caption.trim() || "Sharing our latest breakdown from the studio.";
  const kw = (keyword || "KIT").trim().toUpperCase();
  const lines = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const core = lines[0] || raw;

  switch (mode) {
    case "shorten":
      return `${core.slice(0, 88).replace(/[.,;:]$/, "")}. Comment "${kw}" for the full breakdown & template link.`;
    case "hook":
      return `Read this before your next post goes live:\n\n${raw}`;
    case "cta":
      return `${raw.replace(/\n*Comment\s+"[^"]+".*$/i, "")}\n\nComment "${kw}" below and I will DM you the direct resource link right away.`;
    case "story":
      return `Six months ago, this exact part of our workflow took us half a day every weekend.\n\n${raw}\n\nHope this saves you hours this week — reply "${kw}" below if you want our template.`;
    default: {
      const cleaned = lines
        .map((l) => l.replace(/\b(basically|just|actually|really|very|literally)\b\s*/gi, "").trim())
        .filter(Boolean);
      return `${cleaned[0]}\n\nKey takeaway: cut visual noise, anchor one clear hierarchy, and pair every post with a direct resource CTA.\n\n${cleaned.slice(1).join("\n\n") || `Bookmark this & comment "${kw}" for our full starter kit.`}`.trim();
    }
  }
}

export function generateWorkflowFromPrompt({ prompt = "", igHandle = "maya.studio" }) {
  const text = prompt.trim() || "Send my Figma UI kit when someone comments KIT and follow up in 2 hours";
  const upperMatches = text.match(/\b[A-Z0-9]{3,12}\b/g) || [];
  const guessedKeyword = upperMatches.find((w) => !["API", "DM", "DMS", "URL", "PDF", "VIP"].includes(w)) || "KIT";
  const isStory = /story|stories/i.test(text);
  const isDm = /direct message|ice breaker|incoming dm/i.test(text);
  const wantsFollowGate = /follow/i.test(text) && /gate|first|before|require/i.test(text);
  const hasFollowUp = /follow[- ]?up|hour|2h|24h|remind/i.test(text);

  return {
    name: `AI Workflow · ${guessedKeyword} Delivery`,
    trigger_type: isStory ? "story_reply" : isDm ? "dm" : "comment",
    keywords: [guessedKeyword, "LINK", "SEND"],
    public_reply_enabled: !isStory && !isDm,
    public_reply_variants: [
      "Just sent the link straight to your DMs!",
      "Check your message requests — sent the resource right over!",
      "Sent! Let me know once you open it."
    ],
    follow_gate_enabled: wantsFollowGate,
    follow_gate_message: `Follow @${igHandle} first so Instagram unlocks direct links, then tap Confirm below.`,
    dm_message: `Hey! Appreciate you reaching out — here is the direct resource link for ${text.slice(0, 56)}:`,
    buttons: [{ label: `Open ${guessedKeyword} Resource`.slice(0, 20), url: "https://velora.so/tools" }],
    followup_enabled: hasFollowUp,
    followup_delay: "2h",
    followup_message: "Quick check-in — did the link open cleanly for you? Reply anytime if you need help!"
  };
}

export function generateCarouselSlides({ prompt = "5 principles of clean carousel design", slideCount = 5, themeId = "swiss_white" }) {
  const theme = CAROUSEL_THEMES.find((t) => t.id === themeId) || CAROUSEL_THEMES[0];
  const count = Math.min(10, Math.max(3, Number(slideCount) || 5));
  const clean = prompt.trim() || "5 ways to turn profile visits into loyal followers";

  const stepTemplates = [
    ["Lead with one clear tension right above the eye-line", "Your cover headline only needs 7 to 11 words. Generous whitespace makes readers pause immediately."],
    ["Treat Slide 2 as your second hook for repeat feed impressions", "Instagram re-serves carousels starting on Slide 2 when someone scrolls past the cover once."],
    ["Keep one takeaway and one concrete example per card", "Trimming every sentence by half lifts swipe-through completion to the final slide."],
    ["Frame key typography inside the 3:4 profile grid safe zone", "Design at 1080x1350 (4:5) for feed height while keeping titles centered cleanly on your profile grid."],
    ["Replace vague claims with specific numbers and timeframes", "Concrete specifics ('45-minute Sunday sprint' vs 'save time') consistently double save rates."],
    ["Maintain consistent margins and type hierarchy across cards", "Predictable alignment lets readers absorb ideas effortlessly without visual fatigue."],
    ["Pair your final slide with a single keyword DM action", "Give high-intent readers an instant resource link instead of sending them hunting for a bio URL."],
    ["Review save-to-reach ratio every week", "Double down on formats crossing a 3.5% save-to-reach benchmark — those compound longest in Explore."]
  ];

  const slides = [
    {
      tag: "01",
      headline: clean.length > 68 ? `${clean.slice(0, 65)}...` : clean,
      body: `Swipe through all ${count} cards and bookmark this breakdown for your next publishing session.`,
      badge: `${theme.category} · ${count} Slides`,
      align: "left"
    }
  ];

  for (let i = 1; i < count - 1; i++) {
    const [head, body] = stepTemplates[(i - 1) % stepTemplates.length];
    slides.push({
      tag: String(i + 1).padStart(2, "0"),
      headline: head,
      body,
      badge: `Principle ${String(i).padStart(2, "0")}`,
      align: "left"
    });
  }

  slides.push({
    tag: String(count).padStart(2, "0"),
    headline: "Save this deck + comment GUIDE for the full resource kit",
    body: "Bookmark this post in the bottom-right corner and reply GUIDE below — the editable checklist will land right in your DMs.",
    badge: "Next Step",
    align: "left"
  });

  return {
    theme,
    slides,
    suggestedCaption: `${clean} — broken down step by step.\n\nSwipe through all ${count} slides, save this post for later, and comment GUIDE for the direct resource link.`
  };
}

export function generateAiDmReply({ userMessage = "", tone = "helpful", handle = "creator" }) {
  const lower = userMessage.toLowerCase();
  if (tone === "sponsor" || lower.includes("rate") || lower.includes("slot") || lower.includes("sponsor") || lower.includes("collab") || lower.includes("brief")) {
    return `Hi @${handle} — thanks for reaching out! Yes, we have one sponsored Reel + 2 Story link frames open next month ($2,800–$3,400 depending on usage rights). Share your target launch dates here and I will send our full media kit right over.`;
  }
  if (tone === "concise") {
    return `Hi @${handle} — here is the direct link: https://velora.so/tools. Let me know if you need anything else!`;
  }
  if (tone === "followup") {
    return `Hi @${handle} — quick follow-up to make sure the resource pack opened smoothly for you! Feel free to reply here anytime if you have questions.`;
  }
  return `Hi @${handle} — appreciate your note! Here is the direct link to the starter kit from that post: https://velora.so/tools. Happy to share the bonus checklist too if helpful.`;
}

export function summarizeInboxThread({ messages = [], handle = "creator" }) {
  const joined = messages.map((m) => m.body || "").join(" ").toLowerCase();
  if (/sponsor|rate|budget|slot|collab|campaign/.test(joined)) {
    return { category: "Brand Sponsorship", priority: "High Priority", summary: `@${handle} inquired about sponsored deliverable availability and rate card.` };
  }
  if (/repo|kit|guide|template|link/.test(joined)) {
    return { category: "Automated Resource Lead", priority: "Engaged Lead", summary: `@${handle} triggered an automated resource workflow and received CTA link.` };
  }
  return { category: "Creator Conversation", priority: "Active", summary: `Active direct conversation with @${handle} inside 24h Meta window.` };
}

export function analyzeHashtagDensity(text = "") {
  const tags = (text.match(/#[a-zA-Z0-9_]+/g) || []).map((t) => t.toLowerCase());
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const flagged = tags.filter((t) => RESTRICTED_HASHTAGS.has(t.slice(1)));
  return {
    count: tags.length,
    limit: 30,
    recommendedRange: "3–8 hyper-relevant tags",
    densityPercent: words ? Number(((tags.length / words) * 100).toFixed(1)) : 0,
    flaggedRestricted: flagged,
    tags
  };
}
