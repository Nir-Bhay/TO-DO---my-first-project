import { CAROUSEL_THEMES } from "../config/themes.js";

const RESTRICTED_HASHTAGS = new Set([
  "followforfollow", "f4f", "like4like", "l4l", "instababy", "alone",
  "beautyblogger", "desk", "pushups", "models", "tag4like", "spam4spam"
]);

export function generateCaptions({ topic = "building consistent creator systems", tone = "Direct & Editorial", includeHashtags = true, keyword = "GUIDE" }) {
  const cleanTopic = topic.trim() || "shipping high-retention Instagram content";
  const slugTag = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18) || "creatorworkflow";
  const tags = includeHashtags
    ? `\n\n#${slugTag} #instagramgrowth #creatorworkflow #contentstrategy #reelsgrowth #solocreator`
    : "";

  const variants = [
    {
      label: `${tone} · Story + Payoff`,
      hook: `Most creators overcomplicate ${cleanTopic} before they ever ship post #10.`,
      body: `Most creators overcomplicate ${cleanTopic} before they ever ship post #10.\n\nHere is the 3-part loop that turned sporadic views into compounding saves:\n1. Open with the exact friction your audience felt today\n2. Show one concrete fix on screen in under 18 seconds\n3. Pair the post with an instant Comment -> DM resource\n\nComment "${keyword}" below and I'll send the full checklist straight to your DMs.${tags}`
    },
    {
      label: `${tone} · Contrarian Hook`,
      hook: `Unpopular take: ${cleanTopic} isn't an algorithm problem — it's a packaging problem.`,
      body: `Unpopular take: ${cleanTopic} isn't an algorithm problem — it's a packaging problem.\n\nWhen your first 125 characters name the exact outcome clearly, cold viewers stay through the payoff frame AND bookmark it for later.\n\nSave this for your next Sunday batch session — or reply "${keyword}" and I'll DM you the template.${tags}`
    },
    {
      label: `${tone} · Step-by-Step Mini Essay`,
      hook: `Steal this 15-minute checklist for ${cleanTopic}:`,
      body: `Steal this 15-minute checklist for ${cleanTopic}:\n\n• Write Slide 1 + Slide 2 together so second-impression feed views convert\n• Cut dead air before word #1 in your Reel hook\n• Check 3:4 profile grid crop before scheduling\n\nDrop "${keyword}" in the comments and my official API automation will send the resource pack right away.${tags}`
    },
    {
      label: `${tone} · Punchy Minimal`,
      hook: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.`,
      body: `How we simplified ${cleanTopic} down to one repeatable weekly ritual.\n\nLess tab-hopping. Sharper hooks. Every link delivered automatically in DMs.\n\nComment "${keyword}" if you want the exact setup.${tags}`
    }
  ];

  return variants.map((v) => ({
    ...v,
    charCount: v.body.length,
    foldPreview: v.body.slice(0, 125)
  }));
}

export function generateCarouselSlides({ prompt = "5 ways to grow with Instagram carousels", slideCount = 5, themeId = "bold_highlight" }) {
  const theme = CAROUSEL_THEMES.find((t) => t.id === themeId) || CAROUSEL_THEMES[0];
  const count = Math.min(10, Math.max(3, Number(slideCount) || 5));
  const clean = prompt.trim() || "5 ways to turn profile visits into loyal followers";

  const stepTemplates = [
    ["Lead with the sharpest tension right above the eye-line", "Your Slide 1 headline only needs 7–11 words. Leave generous breathing room so viewers stop scrolling immediately."],
    ["Make Slide 2 your second hook for repeat feed impressions", "Instagram re-serves carousels on Slide 2 automatically. Give non-swipers a crisp concrete reason to stay."],
    ["Stick to one takeaway + one proof point per card", "Cut every filler sentence in half. Visual rhythm across slides triples completion to the final card."],
    ["Frame key typography inside the 3:4 profile grid box", "Export at 1080×1350 (4:5) for feed height while keeping your title clean on your profile grid."],
    ["Anchor numbers with real benchmarks instead of vague claims", "Specific numbers ('45-minute Sunday sprint' vs 'save time') lift saves by over 2.1×."],
    ["Pair visual contrast between odd and even slides", "Subtle badge pills and numbered markers keep readers oriented through longer educational decks."],
    ["Turn passive readers into active DM conversations", "Close with one clear keyword trigger so every high-intent reader gets your full toolkit automatically."],
    ["Audit save-to-reach rate every 7 days", "Double down on topics crossing a 3.5% save-to-reach ratio — those compound longest in Explore."]
  ];

  const slides = [
    {
      tag: "HOOK",
      headline: clean.length > 68 ? `${clean.slice(0, 65)}...` : clean,
      body: `Styled in ${theme.name} — swipe through every actionable step & bookmark this post for your next batch session.`,
      badge: `${theme.category.toUpperCase()} · ${count} SLIDES`
    }
  ];

  for (let i = 1; i < count - 1; i++) {
    const [head, body] = stepTemplates[(i - 1) % stepTemplates.length];
    slides.push({
      tag: String(i).padStart(2, "0"),
      headline: head,
      body: `${body} Applied directly to "${clean.slice(0, 48)}".`,
      badge: `STEP ${String(i).padStart(2, "0")}`
    });
  }

  slides.push({
    tag: String(count - 1).padStart(2, "0"),
    headline: "Save this deck + comment 'GUIDE' for the full template pack",
    body: "Tap bookmark in the bottom-right corner and drop GUIDE below — I'll send the editable checklist straight to your DMs.",
    badge: "SAVE & COMMENT"
  });

  return {
    theme,
    slides,
    suggestedCaption: `${clean} — broken down slide by slide.\n\nSwipe through all ${count} cards, hit Save so you have it for your next session, and comment GUIDE for the full resource link! ↓`
  };
}

export function generateAiDmReply({ userMessage = "", personaPrompt = "", handle = "creator" }) {
  const lower = userMessage.toLowerCase();
  const toneNote = personaPrompt ? ` (${personaPrompt.slice(0, 50)})` : "";
  if (lower.includes("rate") || lower.includes("slot") || lower.includes("sponsor") || lower.includes("collab")) {
    return `Hey @${handle}! Thanks so much for reaching out ✓ Yes — I still have one sponsored Reel + Story slot open! Drop your brief + timeline here and I'll send over my updated Q4 rate card right away.${toneNote ? "" : ""}`;
  }
  if (lower.includes("theme") || lower.includes("carousel") || lower.includes("font")) {
    return `Hey @${handle}! That deck uses the Bold Highlight & Editorial serif pairing at 1080×1350 (4:5). Want me to send the exact prompt sheet link? ✦`;
  }
  return `Hey @${handle}! Appreciate your message ✓ Just saw your note — here is the direct link to everything mentioned in my latest Reel: https://reeldrop.io/free-tools. Let me know if you want the bonus checklist too!`;
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
