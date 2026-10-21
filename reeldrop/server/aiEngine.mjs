import { CAROUSEL_THEMES } from "../config/themes.js";

const RESTRICTED_HASHTAGS = new Set([
  "followforfollow", "f4f", "like4like", "l4l", "instababy", "alone",
  "beautyblogger", "desk", "pushups", "models", "tag4like", "spam4spam"
]);

export function generateCaptions({ topic = "building consistent creator systems", tone = "Direct & Editorial", includeHashtags = true, keyword = "GUIDE" }) {
  const cleanTopic = topic.trim() || "shipping high-retention Instagram content";
  const slugTag = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "creatorworkflow";
  const tags = includeHashtags
    ? `\n\n#${slugTag} #contentstrategy #instagramcreator #designsystems #audiencegrowth #solofounder`
    : "";

  const variants = [
    {
      label: `${tone} — Hook + Three Takeaways`,
      hook: `Most teams overcomplicate ${cleanTopic} before they ever ship post #10.`,
      body: `Most teams overcomplicate ${cleanTopic} before they ever ship post #10.\n\nHere is the 3-part loop that turned sporadic reach into consistent saves:\n1. Open with the exact friction your reader ran into today\n2. Show one concrete fix on screen in under 18 seconds\n3. Pair the post with an instant keyword DM resource\n\nComment "${keyword}" below and I will send the full checklist straight to your DMs.${tags}`
    },
    {
      label: `${tone} — Contrarian Opener`,
      hook: `Unpopular take: ${cleanTopic} is rarely an algorithm problem — it is a packaging problem.`,
      body: `Unpopular take: ${cleanTopic} is rarely an algorithm problem — it is a packaging problem.\n\nWhen your opening 125 characters name the exact outcome clearly, cold viewers stay through the payoff frame and bookmark the post for later.\n\nSave this for your next batch session, or comment "${keyword}" for the template.${tags}`
    },
    {
      label: `${tone} — Practical Checklist`,
      hook: `Use this 15-minute checklist before publishing on ${cleanTopic}:`,
      body: `Use this 15-minute checklist before publishing on ${cleanTopic}:\n\n- Write Slide 1 and Slide 2 together so second-chance feed impressions convert\n- Cut dead air before the first spoken word in your video hook\n- Preview your 3:4 profile grid crop before scheduling\n\nDrop "${keyword}" in the comments and my automated DM workflow will send the resource pack right away.${tags}`
    },
    {
      label: `${tone} — Concise Editorial`,
      hook: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.`,
      body: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.\n\nFewer scattered docs. Stronger hooks. Every link delivered automatically inside DMs.\n\nComment "${keyword}" if you want the exact setup.${tags}`
    }
  ];

  return variants.map((v) => ({
    ...v,
    charCount: v.body.length,
    foldPreview: v.body.slice(0, 125)
  }));
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

export function generateAiDmReply({ userMessage = "", personaPrompt = "", handle = "creator" }) {
  const lower = userMessage.toLowerCase();
  if (lower.includes("rate") || lower.includes("slot") || lower.includes("sponsor") || lower.includes("collab") || lower.includes("brief")) {
    return `Hi @${handle} — thanks for reaching out! Yes, we have one sponsored Reel + Story slot open next month. Share your campaign brief and target dates here and I will send over our media kit right away.`;
  }
  if (lower.includes("theme") || lower.includes("carousel") || lower.includes("font") || lower.includes("kit")) {
    return `Hi @${handle} — glad that post resonated! Here is the direct link to the template kit from that breakdown: https://velora.so/tools. Let me know if you have any questions about setting it up.`;
  }
  return `Hi @${handle} — appreciate the message! Here is the direct resource link mentioned in the post: https://velora.so/tools. Feel free to reply here anytime if you want the bonus checklist too.`;
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
