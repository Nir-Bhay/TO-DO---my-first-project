import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { state, saveState, incrementPlatformMetric } from "./db.mjs";
import { generateAiDmReply } from "./aiEngine.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PLANS_CONFIG = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, "../config/plans.json"), "utf8")
);

export function getPlanSpec(planId = "starter") {
  return PLANS_CONFIG.plans[planId] || PLANS_CONFIG.plans.starter;
}

export function validateButtons(buttons = []) {
  const rules = PLANS_CONFIG.globalRules;
  if (!Array.isArray(buttons)) return { ok: false, error: "buttons must be an array." };
  if (buttons.length > rules.maxButtonsPerDm) {
    return { ok: false, error: `Maximum ${rules.maxButtonsPerDm} link buttons allowed per DM.` };
  }
  for (const btn of buttons) {
    if (!btn.label || btn.label.trim().length === 0) {
      return { ok: false, error: "Every DM button requires a non-empty label." };
    }
    if (btn.label.trim().length > rules.maxButtonLabelLength) {
      return { ok: false, error: `Button label "${btn.label}" exceeds ${rules.maxButtonLabelLength} characters.` };
    }
    if (!String(btn.url || "").startsWith("https://")) {
      return { ok: false, error: `Button URL "${btn.url}" must start with https:// (official Meta Messenger API requirement).` };
    }
  }
  return { ok: true };
}

export function validateAutomationAgainstPlan(workspace, payload, existingId = null) {
  const spec = getPlanSpec(workspace.plan);
  const limits = spec.limits;

  if (limits.activeDmAutomations !== null && (payload.status ?? "active") === "active") {
    const activeCount = state.automations.filter(
      (a) => a.workspace_id === workspace.id && a.status === "active" && a.id !== existingId
    ).length;
    if (activeCount >= limits.activeDmAutomations) {
      return {
        ok: false,
        code: "PLAN_LIMIT_AUTOMATIONS",
        error: `${spec.name} plan allows up to ${limits.activeDmAutomations} active DM automations (${activeCount}/${limits.activeDmAutomations} active). Upgrade to Influencer ($9.99/mo) or Creator ($29/mo) for unlimited automations.`
      };
    }
  }

  const triggerType = payload.trigger_type || "comment";
  if (triggerType === "story_reply" && !limits.storyReplyTriggers) {
    return {
      ok: false,
      code: "PLAN_LIMIT_STORY_TRIGGER",
      error: "Story reply triggers require Influencer ($9.99/mo) or Creator ($29/mo)."
    };
  }
  if (triggerType === "dm" && !limits.dmKeywordTriggers) {
    return {
      ok: false,
      code: "PLAN_LIMIT_DM_TRIGGER",
      error: "Incoming DM keyword & Ice Breaker triggers require Influencer ($9.99/mo) or Creator ($29/mo)."
    };
  }
  if (triggerType === "ai_reply" && !limits.aiDmRepliesPerMonth) {
    return {
      ok: false,
      code: "PLAN_LIMIT_AI_DM",
      error: "DM reply by AI requires Creator plan ($29/mo — includes 2,000 AI DM replies/month)."
    };
  }
  if (payload.post_target === "specific_post" && !limits.dmOnPostsAndCarousels) {
    return {
      ok: false,
      code: "PLAN_LIMIT_POST_TARGET",
      error: "Starter covers comment-to-DM on Reels only. Upgrade to Influencer or Creator for Photo Posts & Carousels."
    };
  }
  if (payload.follow_gate_enabled && !limits.followGate) {
    return {
      ok: false,
      code: "PLAN_LIMIT_FOLLOW_GATE",
      error: "'Ask for follow' follower-verification gate requires Influencer or Creator plan."
    };
  }
  if (payload.followup_enabled && !limits.timedFollowUps) {
    return {
      ok: false,
      code: "PLAN_LIMIT_FOLLOWUP",
      error: "Timed follow-up DMs (30m–24h) require Influencer or Creator plan."
    };
  }

  const variants = payload.public_reply_variants || [];
  if (limits.publicReplyVariantsMax !== null && variants.length > limits.publicReplyVariantsMax) {
    return {
      ok: false,
      code: "PLAN_LIMIT_VARIANTS",
      error: `${spec.name} supports up to ${limits.publicReplyVariantsMax} rotating public reply variants.`
    };
  }

  return validateButtons(payload.buttons || []);
}

export function executeAutomationTrigger({
  workspaceId,
  automationId,
  senderHandle = "alex.creates",
  senderName = "Alex Morgan",
  incomingText = "LINK",
  isFollower = true,
  dryRun = false,
  postTitle = "7 Open-Source Tools Replacing My $86/mo Creator Stack"
}) {
  const ws = state.workspaces.find((w) => w.id === workspaceId);
  const auto = state.automations.find((a) => a.id === automationId && a.workspace_id === workspaceId);
  if (!ws || !auto) return { ok: false, error: "Workspace or automation not found." };

  const spec = getPlanSpec(ws.plan);
  const keywords = JSON.parse(auto.keywords_json || "[]");
  const upper = String(incomingText || "").toUpperCase();
  const matched =
    auto.trigger_type === "ai_reply" ||
    keywords.length === 0 ||
    keywords.includes("ANY") ||
    keywords.some((k) => upper.includes(String(k).toUpperCase()));

  if (!matched) {
    return {
      ok: false,
      matched: false,
      error: `Message "${incomingText}" did not match keywords [${keywords.join(", ")}].`
    };
  }

  const now = new Date().toISOString();
  const variants = JSON.parse(auto.public_reply_variants_json || "[]");
  const chosenPublicReply = auto.public_reply_enabled && variants.length > 0
    ? variants[Math.floor(Math.random() * variants.length)]
    : null;

  const brandingFooter = spec.limits.removeBrandingFooter ? "" : "\n\nSent via reeldrop.io";
  const steps = [];

  if (chosenPublicReply && auto.trigger_type === "comment") {
    steps.push({ type: "public_comment_reply", text: `@${senderHandle} ${chosenPublicReply}` });
  }

  if (auto.trigger_type === "ai_reply") {
    const aiText = generateAiDmReply({
      userMessage: incomingText,
      personaPrompt: auto.ai_prompt,
      handle: senderHandle
    }) + brandingFooter;
    steps.push({ type: "dm_ai_reply", text: aiText, buttons: [] });
    if (!dryRun) ws.ai_dm_replies_used = (ws.ai_dm_replies_used || 0) + 1;
  } else {
    if (auto.follow_gate_enabled && !isFollower) {
      steps.push({
        type: "follow_gate_prompt",
        text: auto.follow_gate_message,
        buttons: [{ label: "I followed ✓", url: "https://reeldrop.io" }],
        gateBlockedPrimary: true
      });
    } else {
      if (auto.opening_card_enabled || !spec.limits.removeBrandingFooter) {
        steps.push({
          type: "opening_card",
          text: auto.opening_card_text || "Tap below to get the link!",
          buttons: [{ label: (auto.opening_button_label || "Send me the link").slice(0, 20), url: "https://reeldrop.io" }]
        });
      }
      const buttons = JSON.parse(auto.buttons_json || "[]");
      steps.push({
        type: "primary_dm",
        text: auto.dm_message + brandingFooter,
        buttons
      });
      if (auto.followup_enabled && spec.limits.timedFollowUps) {
        steps.push({
          type: "scheduled_followup",
          delay: auto.followup_delay,
          text: auto.followup_message + brandingFooter,
          note: `Queued for +${auto.followup_delay} (auto-cancels if @${senderHandle} replies first).`
        });
      }
    }
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      matched: true,
      automationName: auto.name,
      planApplied: spec.name,
      brandingIncluded: !spec.limits.removeBrandingFooter,
      followerVerified: Boolean(isFollower),
      chosenPublicReply,
      steps
    };
  }

  let thread = state.inbox_threads.find(
    (t) => t.workspace_id === ws.id && t.participant_handle === senderHandle
  );
  const lastStep =
    steps.find((s) => s.type === "primary_dm" || s.type === "dm_ai_reply" || s.type === "follow_gate_prompt") ||
    steps[steps.length - 1];

  if (!thread) {
    thread = {
      id: "thr_" + crypto.randomUUID().slice(0, 8),
      workspace_id: ws.id,
      participant_handle: senderHandle,
      participant_name: senderName,
      avatar_bg: "#D94826",
      is_open: 1,
      unread_count: 1,
      is_hot_lead: 0,
      is_outreach: 1,
      is_archived: 0,
      is_pinned: 0,
      snoozed_until: null,
      tags_json: JSON.stringify([isFollower ? "Auto-DM Delivered" : "Awaiting Follow"]),
      last_message_preview: lastStep.text.slice(0, 90),
      last_user_message_at: now,
      updated_at: now
    };
    state.inbox_threads.unshift(thread);
  } else {
    thread.is_open = 1;
    thread.is_archived = 0;
    thread.unread_count = (thread.unread_count || 0) + 1;
    thread.last_message_preview = lastStep.text.slice(0, 90);
    thread.last_user_message_at = now;
    thread.updated_at = now;
  }

  state.inbox_messages.push({
    id: "msg_" + crypto.randomUUID().slice(0, 8),
    thread_id: thread.id,
    sender: "them",
    body: incomingText,
    buttons_json: "[]",
    shared_reel_title: postTitle,
    via_automation: "",
    created_at: now
  });
  state.inbox_messages.push({
    id: "msg_" + crypto.randomUUID().slice(0, 8),
    thread_id: thread.id,
    sender: "me",
    body: lastStep.text,
    buttons_json: JSON.stringify(lastStep.buttons || []),
    shared_reel_title: "",
    via_automation: auto.name,
    created_at: now
  });

  auto.dms_sent += 1;
  if (isFollower) auto.link_taps += 1;
  if (chosenPublicReply) auto.public_replies_sent += 1;

  state.notifications.unshift({
    id: "notif_" + crypto.randomUUID().slice(0, 8),
    workspace_id: ws.id,
    kind: "dm",
    title: `Auto-DM sent to @${senderHandle} (${isFollower ? "Follower ✓" : "Follow Gate Held"})`,
    detail: `"${auto.name}" matched "${incomingText}" -> thread ${thread.id}.`,
    is_read: 0,
    created_at: now
  });

  incrementPlatformMetric("dms_sent_automatically", 1);
  saveState();

  return {
    ok: true,
    dryRun: false,
    matched: true,
    automationName: auto.name,
    planApplied: spec.name,
    brandingIncluded: !spec.limits.removeBrandingFooter,
    followerVerified: Boolean(isFollower),
    chosenPublicReply,
    steps,
    threadId: thread.id
  };
}
