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
  if (planId === "influencer") return PLANS_CONFIG.plans.growth;
  if (planId === "creator") return PLANS_CONFIG.plans.studio;
  return PLANS_CONFIG.plans[planId] || PLANS_CONFIG.plans.starter;
}

export function validateButtons(buttons = []) {
  const rules = PLANS_CONFIG.globalRules;
  if (!Array.isArray(buttons)) return { ok: false, error: "Buttons must be an array." };
  if (buttons.length > rules.maxButtonsPerDm) {
    return { ok: false, error: `Maximum ${rules.maxButtonsPerDm} CTA buttons allowed per DM.` };
  }
  for (const btn of buttons) {
    if (!btn.label || btn.label.trim().length === 0) {
      return { ok: false, error: "Every CTA button requires a label." };
    }
    if (btn.label.trim().length > rules.maxButtonLabelLength) {
      return { ok: false, error: `Button label "${btn.label}" exceeds ${rules.maxButtonLabelLength} characters.` };
    }
    if (!String(btn.url || "").startsWith("https://")) {
      return { ok: false, error: `Button URL "${btn.url}" must start with https:// (Instagram Messenger API rule).` };
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
        error: `${spec.name} plan includes up to ${limits.activeDmAutomations} active automations (${activeCount}/${limits.activeDmAutomations} used). Upgrade to Growth or Studio for unlimited workflows.`
      };
    }
  }

  const triggerType = payload.trigger_type || "comment";
  if (triggerType === "story_reply" && !limits.storyReplyTriggers) {
    return { ok: false, code: "PLAN_LIMIT_STORY_TRIGGER", error: "Story reply workflows require Growth ($12/mo) or Studio ($29/mo)." };
  }
  if (triggerType === "dm" && !limits.dmKeywordTriggers) {
    return { ok: false, code: "PLAN_LIMIT_DM_TRIGGER", error: "Direct DM keyword & Ice Breaker workflows require Growth or Studio." };
  }
  if (triggerType === "ai_reply" && !limits.aiDmRepliesPerMonth) {
    return { ok: false, code: "PLAN_LIMIT_AI_DM", error: "AI Concierge DM workflows require Growth or Studio." };
  }
  if (payload.follow_gate_enabled && !limits.followGate) {
    return { ok: false, code: "PLAN_LIMIT_FOLLOW_GATE", error: "Follower verification prompt requires Growth or Studio plan." };
  }
  if (payload.followup_enabled && !limits.timedFollowUps) {
    return { ok: false, code: "PLAN_LIMIT_FOLLOWUP", error: "Automated follow-up messages require Growth or Studio plan." };
  }

  const variants = payload.public_reply_variants || [];
  if (limits.publicReplyVariantsMax !== null && variants.length > limits.publicReplyVariantsMax) {
    return { ok: false, code: "PLAN_LIMIT_VARIANTS", error: `${spec.name} supports up to ${limits.publicReplyVariantsMax} public reply variants.` };
  }

  return validateButtons(payload.buttons || []);
}

export function executeAutomationTrigger({
  workspaceId,
  automationId,
  senderHandle = "alex.design",
  senderName = "Alex Morgan",
  incomingText = "REPO",
  isFollower = true,
  dryRun = false,
  postTitle = "7 Open-Source UI Kits Worth Bookmarking"
}) {
  const ws = state.workspaces.find((w) => w.id === workspaceId);
  const auto = state.automations.find((a) => a.id === automationId && a.workspace_id === workspaceId);
  if (!ws || !auto) return { ok: false, error: "Workspace or workflow not found." };

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
      error: `"${incomingText}" did not match trigger keywords [${keywords.join(", ")}].`
    };
  }

  const now = new Date().toISOString();
  const variants = JSON.parse(auto.public_reply_variants_json || "[]");
  const chosenPublicReply = auto.public_reply_enabled && variants.length > 0
    ? variants[Math.floor(Math.random() * variants.length)]
    : null;

  const brandingFooter = spec.limits.removeBrandingFooter ? "" : "\n\nSent via velora.so";
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
        text: auto.follow_gate_message || `Follow @${ws.ig_handle} first so Instagram lets me send your link, then tap Confirm below.`,
        buttons: [{ label: "Confirm follow", url: "https://velora.so" }],
        gateBlockedPrimary: true
      });
    } else {
      if (auto.opening_card_enabled || !spec.limits.removeBrandingFooter) {
        steps.push({
          type: "opening_card",
          text: auto.opening_card_text || "Tap below to receive your resource link:",
          buttons: [{ label: (auto.opening_button_label || "Send me the link").slice(0, 24), url: "https://velora.so" }]
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
          note: `Queued for +${auto.followup_delay} (cancels automatically if @${senderHandle} replies).`
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
      id: "th_" + crypto.randomUUID().slice(0, 8),
      workspace_id: ws.id,
      participant_handle: senderHandle,
      participant_name: senderName,
      participant_followers: 3400,
      avatar_color: "#0F172A",
      is_open: 1,
      unread_count: 0,
      is_hot_lead: 0,
      is_outreach: 0,
      is_archived: 0,
      is_pinned: 0,
      snoozed_until: null,
      tags_json: JSON.stringify([`Workflow: ${auto.trigger_type}`]),
      crm_notes: "",
      last_user_message_at: now,
      last_message_preview: lastStep.text.slice(0, 90),
      updated_at: now
    };
    state.inbox_threads.unshift(thread);
  } else {
    thread.last_user_message_at = now;
    thread.last_message_preview = lastStep.text.slice(0, 90);
    thread.updated_at = now;
    thread.is_open = 1;
  }

  state.inbox_messages.push({
    id: "msg_" + crypto.randomUUID().slice(0, 8),
    thread_id: thread.id,
    sender: "them",
    body: incomingText,
    buttons_json: "[]",
    shared_reel_title: auto.trigger_type === "comment" ? postTitle : "",
    via_automation: "",
    media_url: "",
    created_at: now
  });

  for (const s of steps) {
    if (s.type === "public_comment_reply" || s.type === "scheduled_followup") continue;
    state.inbox_messages.push({
      id: "msg_" + crypto.randomUUID().slice(0, 8),
      thread_id: thread.id,
      sender: "me",
      body: s.text,
      buttons_json: JSON.stringify(s.buttons || []),
      shared_reel_title: "",
      via_automation: auto.name,
      media_url: "",
      created_at: now
    });
  }

  auto.dms_sent = (auto.dms_sent || 0) + 1;
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
    steps
  };
}
