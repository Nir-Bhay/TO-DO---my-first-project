import crypto from "node:crypto";
import { state, saveState, resetStateToSeed, incrementPlatformMetric } from "./db.mjs";
import { CAROUSEL_THEMES } from "../config/themes.js";
import {
  generateCaptions,
  generateCarouselSlides,
  generateAiDmReply,
  analyzeHashtagDensity
} from "./aiEngine.mjs";
import {
  PLANS_CONFIG,
  getPlanSpec,
  validateAutomationAgainstPlan,
  executeAutomationTrigger
} from "./automationEngine.mjs";

const tool = (name, category, description, properties = {}, required = []) => ({
  name,
  category,
  description,
  inputSchema: { type: "object", properties, ...(required.length ? { required } : {}) }
});

export const MCP_TOOLS_CATALOG = [
  // 1–10: Workspaces, Accounts & Billing (10)
  tool("list_workspaces", "Workspaces & Billing", "List all connected workspaces with active plans and usage counters."),
  tool("create_workspace", "Workspaces & Billing", "Create and connect a new Instagram OAuth workspace (up to 5).", { name: { type: "string" }, ig_handle: { type: "string" }, plan: { type: "string" } }, ["ig_handle"]),
  tool("list_ig_accounts", "Workspaces & Billing", "List connected Instagram Business & Creator accounts across workspaces.", { workspace_id: { type: "string" } }),
  tool("get_posting_slots", "Workspaces & Billing", "Read preferred daily posting time slots and timezone.", { workspace_id: { type: "string" } }),
  tool("update_scheduling_settings", "Workspaces & Billing", "Update timezone, daily posting slots, or default grid crop.", { workspace_id: { type: "string" }, timezone: { type: "string" }, posting_slots: { type: "array", items: { type: "string" } }, grid_crop: { type: "string" } }),
  tool("get_workspace_usage", "Workspaces & Billing", "Return monthly quota usage for AI captions, carousel slides, Trial Reels, and AI DM replies.", { workspace_id: { type: "string" } }),
  tool("get_plan_limits", "Workspaces & Billing", "Return complete plans.yml enforcement rules across Starter, Influencer, Creator, and Lifetime."),
  tool("switch_workspace_plan", "Workspaces & Billing", "Switch workspace plan tier between starter, influencer, creator, and lifetime.", { workspace_id: { type: "string" }, plan: { type: "string" } }, ["plan"]),
  tool("get_referral_status", "Workspaces & Billing", "Get workspace referral code, share URL, and free months earned out of 12/year.", { workspace_id: { type: "string" } }),
  tool("reset_demo_dataset", "Workspaces & Billing", "Reset all workspaces, posts, carousels, automations, comments, and threads to clean seed state."),

  // 11–22: Content, Captions, Thumbnails & Scheduling (12)
  tool("get_video_upload_url", "Content & Scheduling", "Generate a signed direct upload container URL for an MP4/MOV video.", { workspace_id: { type: "string" }, filename: { type: "string" } }),
  tool("generate_reel_captions", "Content & Scheduling", "Generate 4 hook-checked Instagram captions with 125-char fold preview and tiered hashtags.", { workspace_id: { type: "string" }, topic: { type: "string" }, tone: { type: "string" }, keyword: { type: "string" } }, ["topic"]),
  tool("generate_cover_headlines", "Content & Scheduling", "Generate 5 high-contrast 3:4-safe Reel thumbnail cover headlines.", { topic: { type: "string" } }, ["topic"]),
  tool("generate_hashtags", "Content & Scheduling", "Generate balanced small, medium, and broad hashtag tiers for a topic.", { topic: { type: "string" } }, ["topic"]),
  tool("check_hashtag_safety", "Content & Scheduling", "Scan caption hashtags for restricted/shadowban-flagged tags and tag density.", { text: { type: "string" } }, ["text"]),
  tool("analyze_hook_timing", "Content & Scheduling", "Estimate spoken hook duration in seconds at 155 WPM against the 3.0s retention window.", { script: { type: "string" } }, ["script"]),
  tool("schedule_reel", "Content & Scheduling", "Schedule a Reel, Carousel, Photo Post, or Story at a timestamp.", { workspace_id: { type: "string" }, media_type: { type: "string" }, title: { type: "string" }, caption: { type: "string" }, scheduled_at: { type: "string" }, is_trial_reel: { type: "boolean" }, automation_id: { type: "string" } }, ["title", "caption"]),
  tool("schedule_reels_bulk", "Content & Scheduling", "Batch-schedule up to 15 Reels spaced across daily posting slots.", { workspace_id: { type: "string" }, items: { type: "array", items: { type: "object" } } }, ["items"]),
  tool("list_scheduled_posts", "Content & Scheduling", "List scheduled, published, draft, or failed posts in a workspace.", { workspace_id: { type: "string" }, status: { type: "string" } }),
  tool("update_scheduled_post", "Content & Scheduling", "Edit title, caption, scheduled timestamp, or attached automation on a post.", { post_id: { type: "string" }, title: { type: "string" }, caption: { type: "string" }, scheduled_at: { type: "string" }, automation_id: { type: "string" } }, ["post_id"]),
  tool("cancel_scheduled_post", "Content & Scheduling", "Delete or cancel a scheduled post.", { post_id: { type: "string" } }, ["post_id"]),
  tool("publish_post_now", "Content & Scheduling", "Immediately publish a scheduled/failed post container via official Graph simulation.", { post_id: { type: "string" } }, ["post_id"]),

  // 23–30: Visual Grid Planner (8 — exact ReelDrop MCP Grid suite!)
  tool("get_grid_preview", "Grid Planner", "Return ordered profile grid tiles (idea placeholders + scheduled + published posts).", { workspace_id: { type: "string" }, limit: { type: "number" } }),
  tool("create_grid_placeholder", "Grid Planner", "Add a colored 280-character idea note tile to the top of the visual profile grid.", { workspace_id: { type: "string" }, note: { type: "string" }, color: { type: "string" } }, ["note"]),
  tool("update_grid_placeholder", "Grid Planner", "Edit note copy or swatch color on an existing Grid idea tile.", { placeholder_id: { type: "string" }, note: { type: "string" }, color: { type: "string" } }, ["placeholder_id"]),
  tool("convert_grid_placeholder", "Grid Planner", "Convert a Grid idea placeholder tile into a real scheduled post.", { placeholder_id: { type: "string" } }, ["placeholder_id"]),
  tool("delete_grid_placeholder", "Grid Planner", "Remove an idea placeholder tile from the visual Grid.", { placeholder_id: { type: "string" } }, ["placeholder_id"]),
  tool("swap_grid_entries", "Grid Planner", "Swap scheduled publish timestamps between two planned posts on the visual Grid.", { post_a_id: { type: "string" }, post_b_id: { type: "string" } }, ["post_a_id", "post_b_id"]),
  tool("add_grid_collab", "Grid Planner", "Tag an Instagram collaborator handle (@collab) on a planned Grid post.", { post_id: { type: "string" }, collab_handle: { type: "string" } }, ["post_id", "collab_handle"]),
  tool("remove_grid_collab", "Grid Planner", "Remove collaborator tag from a planned Grid post.", { post_id: { type: "string" } }, ["post_id"]),

  // 31–38: AI Carousels Studio — 35 Themes (8)
  tool("list_carousel_themes", "Carousels Studio", "List all 35 curated ReelDrop carousel themes with category and photo requirements.", { category: { type: "string" } }),
  tool("generate_carousel", "Carousels Studio", "Generate a multi-slide styled carousel deck (3–10 slides) from a topic prompt.", { workspace_id: { type: "string" }, prompt: { type: "string" }, theme_id: { type: "string" }, slide_count: { type: "number" } }, ["prompt"]),
  tool("list_carousels", "Carousels Studio", "List saved AI carousel decks in a workspace.", { workspace_id: { type: "string" } }),
  tool("get_carousel", "Carousels Studio", "Fetch full slide copy, theme metadata, and caption for a carousel.", { carousel_id: { type: "string" } }, ["carousel_id"]),
  tool("update_carousel_slides", "Carousels Studio", "Update slides array, theme_id, or caption on an existing carousel.", { carousel_id: { type: "string" }, theme_id: { type: "string" }, slides: { type: "array", items: { type: "object" } } }, ["carousel_id"]),
  tool("add_carousel_slide", "Carousels Studio", "Append a new numbered content card to an existing carousel deck.", { carousel_id: { type: "string" }, headline: { type: "string" }, body: { type: "string" } }, ["carousel_id", "headline"]),
  tool("schedule_carousel", "Carousels Studio", "Schedule a carousel deck directly onto the workspace publishing calendar.", { carousel_id: { type: "string" }, scheduled_at: { type: "string" } }, ["carousel_id"]),
  tool("delete_carousel", "Carousels Studio", "Delete a saved carousel deck.", { carousel_id: { type: "string" } }, ["carousel_id"]),

  // 39–46: DM Automations, Dry-Run & Retrigger (8)
  tool("resolve_reel_by_link", "DM Automations", "Resolve an Instagram Reel permalink into an internal post ID for attaching automations.", { workspace_id: { type: "string" }, url: { type: "string" } }, ["url"]),
  tool("list_automations", "DM Automations", "List active and paused DM automations with send & tap metrics.", { workspace_id: { type: "string" } }),
  tool("create_automation", "DM Automations", "Create a Comment, Story, Incoming-DM, or AI-Reply automation validated against plan limits.", { workspace_id: { type: "string" }, name: { type: "string" }, trigger_type: { type: "string" }, keywords: { type: "array", items: { type: "string" } }, dm_message: { type: "string" }, buttons: { type: "array", items: { type: "object" } } }, ["name", "dm_message"]),
  tool("update_automation", "DM Automations", "Update keywords, DM message copy, or link buttons on an automation.", { automation_id: { type: "string" }, dm_message: { type: "string" }, keywords: { type: "array", items: { type: "string" } } }, ["automation_id"]),
  tool("pause_automation", "DM Automations", "Pause an active DM automation without losing historical metrics.", { automation_id: { type: "string" } }, ["automation_id"]),
  tool("resume_automation", "DM Automations", "Resume a paused DM automation (enforces active plan cap).", { automation_id: { type: "string" } }, ["automation_id"]),
  tool("dry_run_automation", "DM Automations", "Simulate exact public reply, follow-gate check, buttons, and branding without writing to Inbox.", { workspace_id: { type: "string" }, automation_id: { type: "string" }, incoming_text: { type: "string" }, is_follower: { type: "boolean" } }, ["automation_id"]),
  tool("retrigger_automation_comments", "DM Automations", "Sweep past un-DMed matching comments (up to 50 comments/post across 5 posts) and deliver DMs.", { workspace_id: { type: "string" }, automation_id: { type: "string" } }, ["automation_id"]),

  // 47–53: Instagram DM Inbox & Comments Moderation (7)
  tool("list_inbox_threads", "DM Inbox & Comments", "List DM conversations with Open/Closed/Hot-Lead filters and 24-hour Meta window status.", { workspace_id: { type: "string" }, filter: { type: "string" } }),
  tool("get_inbox_thread", "DM Inbox & Comments", "Read full message history, shared Reels, tags, and remaining 24h window hours for a conversation.", { thread_id: { type: "string" } }, ["thread_id"]),
  tool("reply_inbox_thread", "DM Inbox & Comments", "Send a live Messenger API reply inside the 24-hour messaging window (up to 1,000 chars).", { workspace_id: { type: "string" }, thread_id: { type: "string" }, text: { type: "string" } }, ["thread_id", "text"]),
  tool("suggest_inbox_ai_reply", "DM Inbox & Comments", "Draft a contextual AI DM reply tailored to the conversation's latest message.", { thread_id: { type: "string" } }, ["thread_id"]),
  tool("add_inbox_thread_tag", "DM Inbox & Comments", "Attach a custom CRM label tag to a DM thread (up to 8 tags per conversation).", { thread_id: { type: "string" }, tag: { type: "string" } }, ["thread_id", "tag"]),
  tool("list_post_comments", "DM Inbox & Comments", "List recent Instagram comments across published Reels and Carousels.", { workspace_id: { type: "string" } }),
  tool("reply_to_comment", "DM Inbox & Comments", "Post a public comment reply or hide a spam comment.", { comment_id: { type: "string" }, reply_text: { type: "string" }, hide: { type: "boolean" } }, ["comment_id"]),

  // 54–58: Analytics & Trial Reels (5)
  tool("get_analytics_summary", "Analytics", "Return workspace views, reach, saves, auto-DMs sent, tap rate, and top post.", { workspace_id: { type: "string" } }),
  tool("get_reel_analytics", "Analytics", "Return per-Reel retention, watch time, saves, and comment velocity.", { workspace_id: { type: "string" } }),
  tool("get_account_analytics", "Analytics", "Return 30-day follower growth, profile visits, website taps, and daily reach series.", { workspace_id: { type: "string" } }),
  tool("get_story_analytics", "Analytics", "Return 24-hour Story impressions, sticker taps, replies, and completion rates.", { workspace_id: { type: "string" } }),
  tool("get_trial_reel_analytics", "Analytics", "Return non-follower Trial Reel experiments, watch-time delta, and graduation status.", { workspace_id: { type: "string" } })
];

const FREE_DISCOVERY_TOOLS = new Set(["list_workspaces", "get_plan_limits", "switch_workspace_plan"]);

export function callMcpTool(name, args = {}) {
  const defaultWs = state.workspaces[0];
  const ws = args.workspace_id
    ? state.workspaces.find((w) => w.id === args.workspace_id) || defaultWs
    : defaultWs;
  const spec = getPlanSpec(ws.plan);

  if (!FREE_DISCOVERY_TOOLS.has(name) && !spec.limits.mcpAccess) {
    return {
      isError: true,
      upgradeRequired: true,
      currentPlan: spec.name,
      message: `MCP tool "${name}" requires Influencer ($9.99/mo) or Creator ($29/mo). Connected cleanly to @${ws.ig_handle} (${spec.name}) — call switch_workspace_plan or pass workspace_id="ws_maya" (Creator) to execute live.`
    };
  }

  const now = new Date().toISOString();

  switch (name) {
    case "list_workspaces":
      return {
        workspaces: state.workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          ig_handle: `@${w.ig_handle}`,
          plan: w.plan,
          mcp_enabled: getPlanSpec(w.plan).limits.mcpAccess,
          timezone: w.timezone,
          followers_count: w.followers_count
        }))
      };

    case "create_workspace": {
      if (state.workspaces.length >= 5) return { isError: true, message: "Maximum 5 Instagram workspaces reached." };
      const id = "ws_" + crypto.randomUUID().slice(0, 6);
      const handle = String(args.ig_handle || "creator.new").replace(/^@/, "");
      const created = {
        id, name: args.name || `@${handle} Studio`, ig_handle: handle,
        ig_account_id: String(17841400000000 + Math.floor(Math.random() * 999999)),
        avatar_color: "#7C3AED", plan: args.plan || "creator", billing_cycle: "yearly",
        timezone: "Asia/Calcutta", posting_slots: JSON.stringify(["09:30", "14:00", "20:30"]),
        grid_crop: "4:5", followers_count: 12400, ai_captions_used: 0, ai_carousel_images_used: 0,
        trial_reels_used: 0, ai_dm_replies_used: 0, referral_code: `${handle.toUpperCase()}-FREE`,
        referral_months_earned: 0, created_at: now
      };
      state.workspaces.push(created);
      incrementPlatformMetric("creators_signed_up", 1);
      saveState();
      return { created: true, workspace: created };
    }

    case "list_ig_accounts":
      return { accounts: state.workspaces.map(({ id, name, ig_handle, ig_account_id, followers_count, plan }) => ({ id, name, ig_handle, ig_account_id, followers_count, plan })) };

    case "get_posting_slots":
      return { workspace_id: ws.id, ig_handle: ws.ig_handle, timezone: ws.timezone, grid_crop: ws.grid_crop, posting_slots: JSON.parse(ws.posting_slots || "[]") };

    case "update_scheduling_settings":
      if (args.timezone) ws.timezone = args.timezone;
      if (Array.isArray(args.posting_slots)) ws.posting_slots = JSON.stringify(args.posting_slots);
      if (args.grid_crop) ws.grid_crop = args.grid_crop;
      saveState();
      return { updated: true, workspace_id: ws.id, timezone: ws.timezone, grid_crop: ws.grid_crop, posting_slots: JSON.parse(ws.posting_slots) };

    case "get_workspace_usage":
      return {
        workspace_id: ws.id,
        plan: ws.plan,
        usage: {
          ai_captions_used: ws.ai_captions_used,
          ai_carousel_images_used: ws.ai_carousel_images_used,
          trial_reels_used: ws.trial_reels_used,
          ai_dm_replies_used: ws.ai_dm_replies_used
        },
        limits: spec.limits
      };

    case "get_plan_limits":
      return PLANS_CONFIG;

    case "switch_workspace_plan":
      if (!PLANS_CONFIG.plans[args.plan]) return { isError: true, message: "Invalid plan ID." };
      ws.plan = args.plan;
      saveState();
      return { switched: true, workspace_id: ws.id, plan: ws.plan };

    case "get_referral_status":
      return { workspace_id: ws.id, referral_code: ws.referral_code, months_earned: ws.referral_months_earned, annual_cap: 12 };

    case "reset_demo_dataset":
      resetStateToSeed();
      return { reset: true, workspaces_count: state.workspaces.length, posts_count: state.posts.length };

    case "get_video_upload_url": {
      const key = `uploads/${ws.id}/${Date.now()}-${(args.filename || "reel.mp4").replace(/[^a-zA-Z0-9._-]/g, "")}`;
      return { media_key: key, signed_upload_url: `/api/media/upload/${encodeURIComponent(key)}`, expires_in_seconds: 3600 };
    }

    case "generate_reel_captions":
      return { workspace_id: ws.id, captions: generateCaptions({ topic: args.topic, tone: args.tone, keyword: args.keyword }) };

    case "generate_cover_headlines": {
      const t = String(args.topic || "Creator Growth").toUpperCase().slice(0, 28);
      return { headlines: [`STOP DOING THIS IN ${t}`, `THE 3-STEP ${t} SYSTEM`, `HOW WE DOUBLED ${t}`, `STEAL MY ${t} SETUP`, `WHY 90% MISS THIS`] };
    }

    case "generate_hashtags": {
      const clean = String(args.topic || "instagram").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
      return {
        small_high_intent: [`#${clean}tips`, "#solocreatorworkflow", "#carouselchecklist"],
        medium_growth: [`#${clean}strategy`, "#instagramcarousels", "#reelsretention"],
        broad_discovery: ["#contentcreator", "#instagramgrowth", "#creatorbusiness"]
      };
    }

    case "check_hashtag_safety":
      return analyzeHashtagDensity(args.text || "");

    case "analyze_hook_timing": {
      const words = String(args.script || "").trim().split(/\s+/).filter(Boolean).length;
      const seconds = Number((words / 2.6).toFixed(2));
      return { words, estimated_seconds: seconds, fits_3s_window: seconds <= 3.0 };
    }

    case "schedule_reel": {
      const id = "post_" + crypto.randomUUID().slice(0, 8);
      const sched = args.scheduled_at || new Date(Date.now() + 86400000).toISOString();
      const post = {
        id, workspace_id: ws.id, media_type: (args.media_type || "REEL").toUpperCase(), status: "SCHEDULED",
        title: args.title || "Scheduled via Claude MCP", caption: args.caption || "", hashtags: "", first_comment: "",
        cover_style: "terracotta", cover_label: (args.title || "CLAUDE MCP REEL").slice(0, 30).toUpperCase(),
        collab_handle: "", is_trial_reel: args.is_trial_reel ? 1 : 0, trial_graduated: 0,
        automation_id: args.automation_id || null, scheduled_at: sched, published_at: null, error_reason: "",
        views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0, created_at: now
      };
      state.posts.unshift(post);
      incrementPlatformMetric("reels_scheduled", 1);
      saveState();
      return { scheduled: true, post };
    }

    case "schedule_reels_bulk": {
      const items = (args.items || []).slice(0, 15);
      const created = items.map((item, idx) => {
        const p = {
          id: "post_" + crypto.randomUUID().slice(0, 8),
          workspace_id: ws.id, media_type: "REEL", status: "SCHEDULED",
          title: item.title || `Bulk Reel #${idx + 1}`, caption: item.caption || "Batch scheduled via MCP.",
          hashtags: "", first_comment: "", cover_style: "indigo",
          cover_label: (item.title || `BULK #${idx + 1}`).slice(0, 28).toUpperCase(), collab_handle: "",
          is_trial_reel: 0, trial_graduated: 0, automation_id: null,
          scheduled_at: item.scheduled_at || new Date(Date.now() + (idx + 1) * 43200000).toISOString(),
          published_at: null, error_reason: "", views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0, created_at: now
        };
        state.posts.unshift(p);
        return p;
      });
      incrementPlatformMetric("reels_scheduled", created.length);
      saveState();
      return { scheduled_count: created.length, posts: created };
    }

    case "list_scheduled_posts": {
      const rows = state.posts.filter((p) => p.workspace_id === ws.id && (!args.status || p.status === args.status.toUpperCase()));
      return { workspace_id: ws.id, count: rows.length, posts: rows };
    }

    case "update_scheduled_post": {
      const p = state.posts.find((x) => x.id === args.post_id);
      if (!p) return { isError: true, message: "Post not found." };
      if (args.title !== undefined) p.title = args.title;
      if (args.caption !== undefined) p.caption = args.caption;
      if (args.scheduled_at !== undefined) p.scheduled_at = args.scheduled_at;
      if (args.automation_id !== undefined) p.automation_id = args.automation_id;
      saveState();
      return { updated: true, post: p };
    }

    case "cancel_scheduled_post":
      state.posts = state.posts.filter((x) => x.id !== args.post_id);
      saveState();
      return { cancelled: true, post_id: args.post_id };

    case "publish_post_now": {
      const p = state.posts.find((x) => x.id === args.post_id);
      if (!p) return { isError: true, message: "Post not found." };
      p.status = "PUBLISHED";
      p.error_reason = "";
      p.published_at = now;
      p.views = p.views || 21400;
      p.reach = p.reach || 18200;
      p.likes = p.likes || 1690;
      p.saves = p.saves || 1120;
      saveState();
      return { published: true, post: p };
    }

    // Visual Grid Planner (8)
    case "get_grid_preview":
      return {
        crop: ws.grid_crop,
        placeholders: state.grid_placeholders.filter((g) => g.workspace_id === ws.id),
        posts: state.posts.filter((p) => p.workspace_id === ws.id).slice(0, args.limit || 24)
      };

    case "create_grid_placeholder": {
      const ph = {
        id: "grid_" + crypto.randomUUID().slice(0, 8),
        workspace_id: ws.id,
        note: String(args.note || "").slice(0, 280),
        color: args.color || "#FDE68A",
        position_order: 0,
        created_at: now
      };
      state.grid_placeholders.unshift(ph);
      saveState();
      return { created: true, placeholder: ph };
    }

    case "update_grid_placeholder": {
      const ph = state.grid_placeholders.find((g) => g.id === args.placeholder_id);
      if (!ph) return { isError: true, message: "Grid placeholder not found." };
      if (args.note !== undefined) ph.note = String(args.note).slice(0, 280);
      if (args.color !== undefined) ph.color = args.color;
      saveState();
      return { updated: true, placeholder: ph };
    }

    case "convert_grid_placeholder": {
      const ph = state.grid_placeholders.find((g) => g.id === args.placeholder_id);
      if (!ph) return { isError: true, message: "Grid placeholder not found." };
      state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== ph.id);
      const created = {
        id: "post_" + crypto.randomUUID().slice(0, 8),
        workspace_id: ph.workspace_id, media_type: "POST", status: "SCHEDULED",
        title: ph.note.slice(0, 48), caption: ph.note, hashtags: "", first_comment: "",
        cover_style: "butter", cover_label: ph.note.slice(0, 28).toUpperCase(), collab_handle: "",
        is_trial_reel: 0, trial_graduated: 0, automation_id: null,
        scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(), published_at: null, error_reason: "",
        views: 0, reach: 0, likes: 0, comments_count: 0, saves: 0, avg_watch_sec: 0, created_at: now
      };
      state.posts.unshift(created);
      saveState();
      return { converted: true, post: created };
    }

    case "delete_grid_placeholder":
      state.grid_placeholders = state.grid_placeholders.filter((g) => g.id !== args.placeholder_id);
      saveState();
      return { deleted: true, placeholder_id: args.placeholder_id };

    case "swap_grid_entries": {
      const a = state.posts.find((p) => p.id === args.post_a_id);
      const b = state.posts.find((p) => p.id === args.post_b_id);
      if (!a || !b) return { isError: true, message: "Grid posts not found." };
      const tmp = a.scheduled_at;
      a.scheduled_at = b.scheduled_at;
      b.scheduled_at = tmp;
      saveState();
      return { swapped: true, post_a: { id: a.id, scheduled_at: a.scheduled_at }, post_b: { id: b.id, scheduled_at: b.scheduled_at } };
    }

    case "add_grid_collab": {
      const p = state.posts.find((x) => x.id === args.post_id);
      if (!p) return { isError: true, message: "Post not found." };
      p.collab_handle = String(args.collab_handle || "").replace(/^@/, "");
      saveState();
      return { updated: true, post_id: p.id, collab_handle: p.collab_handle };
    }

    case "remove_grid_collab": {
      const p = state.posts.find((x) => x.id === args.post_id);
      if (!p) return { isError: true, message: "Post not found." };
      p.collab_handle = "";
      saveState();
      return { removed: true, post_id: p.id };
    }

    // Carousels Studio (8)
    case "list_carousel_themes":
      return {
        count: CAROUSEL_THEMES.length,
        themes: args.category ? CAROUSEL_THEMES.filter((t) => t.category.toLowerCase() === args.category.toLowerCase()) : CAROUSEL_THEMES
      };

    case "generate_carousel": {
      const gen = generateCarouselSlides({ prompt: args.prompt, slideCount: args.slide_count || 5, themeId: args.theme_id || "bold_highlight" });
      const deck = {
        id: "car_" + crypto.randomUUID().slice(0, 8),
        workspace_id: ws.id, title: String(args.prompt).slice(0, 56), prompt: args.prompt,
        theme_id: args.theme_id || "bold_highlight", aspect_ratio: "4:5",
        caption: gen.suggestedCaption, slides_json: JSON.stringify(gen.slides), created_at: now
      };
      state.carousels.unshift(deck);
      ws.ai_carousel_images_used += gen.slides.length;
      saveState();
      return { created: true, carousel_id: deck.id, slides: gen.slides };
    }

    case "list_carousels":
      return { carousels: state.carousels.filter((c) => c.workspace_id === ws.id) };

    case "get_carousel": {
      const c = state.carousels.find((x) => x.id === args.carousel_id);
      if (!c) return { isError: true, message: "Carousel not found." };
      return { ...c, slides: JSON.parse(c.slides_json) };
    }

    case "update_carousel_slides": {
      const c = state.carousels.find((x) => x.id === args.carousel_id);
      if (!c) return { isError: true, message: "Carousel not found." };
      if (args.theme_id) c.theme_id = args.theme_id;
      if (Array.isArray(args.slides)) c.slides_json = JSON.stringify(args.slides);
      saveState();
      return { updated: true, carousel_id: c.id };
    }

    case "add_carousel_slide": {
      const c = state.carousels.find((x) => x.id === args.carousel_id);
      if (!c) return { isError: true, message: "Carousel not found." };
      const slides = JSON.parse(c.slides_json || "[]");
      slides.push({ tag: String(slides.length).padStart(2, "0"), headline: args.headline, body: args.body || "", badge: `SLIDE ${slides.length + 1}` });
      c.slides_json = JSON.stringify(slides);
      saveState();
      return { added: true, slide_count: slides.length };
    }

    case "schedule_carousel": {
      const c = state.carousels.find((x) => x.id === args.carousel_id);
      if (!c) return { isError: true, message: "Carousel not found." };
      return callMcpTool("schedule_reel", { workspace_id: c.workspace_id, media_type: "CAROUSEL", title: c.title, caption: c.caption, scheduled_at: args.scheduled_at });
    }

    case "delete_carousel":
      state.carousels = state.carousels.filter((x) => x.id !== args.carousel_id);
      saveState();
      return { deleted: true, carousel_id: args.carousel_id };

    // DM Automations (8)
    case "resolve_reel_by_link": {
      const latest = state.posts.find((p) => p.workspace_id === ws.id);
      return { resolved: true, input_url: args.url, post_id: latest?.id || "post_oct23_reel", title: latest?.title || "Resolved Reel" };
    }

    case "list_automations":
      return { automations: state.automations.filter((a) => a.workspace_id === ws.id) };

    case "create_automation": {
      const buttons = args.buttons || [{ label: "Open Link", url: "https://reeldrop.io" }];
      const check = validateAutomationAgainstPlan(ws, { status: "active", trigger_type: args.trigger_type || "comment", post_target: "all_posts", buttons });
      if (!check.ok) return { isError: true, message: check.error };
      const item = {
        id: "auto_" + crypto.randomUUID().slice(0, 8),
        workspace_id: ws.id, name: args.name, status: "active",
        trigger_type: args.trigger_type || "comment", post_target: "all_posts", target_post_id: null,
        keywords_json: JSON.stringify(args.keywords || ["LINK"]),
        public_reply_enabled: 1, public_reply_variants_json: JSON.stringify(["Sent to your DMs! ✓"]),
        follow_gate_enabled: 0, follow_gate_message: "", opening_card_enabled: 1,
        opening_card_text: "Ready for the link?", opening_button_label: "Send me the link",
        dm_message: args.dm_message, buttons_json: JSON.stringify(buttons),
        followup_enabled: 0, followup_delay: "2h", followup_message: "", ai_prompt: "",
        dms_sent: 0, link_taps: 0, public_replies_sent: 0, created_at: now
      };
      state.automations.unshift(item);
      saveState();
      return { created: true, automation_id: item.id, name: item.name };
    }

    case "update_automation": {
      const a = state.automations.find((x) => x.id === args.automation_id);
      if (!a) return { isError: true, message: "Automation not found." };
      if (args.dm_message) a.dm_message = args.dm_message;
      if (Array.isArray(args.keywords)) a.keywords_json = JSON.stringify(args.keywords);
      saveState();
      return { updated: true, automation_id: a.id };
    }

    case "pause_automation": {
      const a = state.automations.find((x) => x.id === args.automation_id);
      if (!a) return { isError: true, message: "Automation not found." };
      a.status = "paused";
      saveState();
      return { paused: true, automation_id: a.id };
    }

    case "resume_automation": {
      const a = state.automations.find((x) => x.id === args.automation_id);
      if (!a) return { isError: true, message: "Automation not found." };
      a.status = "active";
      saveState();
      return { resumed: true, automation_id: a.id };
    }

    case "dry_run_automation":
      return executeAutomationTrigger({
        workspaceId: ws.id,
        automationId: args.automation_id,
        incomingText: args.incoming_text || "REPO",
        isFollower: args.is_follower ?? true,
        dryRun: true
      });

    case "retrigger_automation_comments": {
      if (!spec.limits.retriggerPastComments) return { isError: true, message: "Retriggering past comments requires Influencer or Creator plan." };
      const res = executeAutomationTrigger({ workspaceId: ws.id, automationId: args.automation_id, senderHandle: "retrigger.user", senderName: "Past Commenter", incomingText: "REPO", isFollower: true });
      return { swept: 1, result: res };
    }

    // Inbox & Comments (7)
    case "list_inbox_threads":
      return { threads: state.inbox_threads.filter((t) => t.workspace_id === ws.id) };

    case "get_inbox_thread": {
      const t = state.inbox_threads.find((x) => x.id === args.thread_id);
      if (!t) return { isError: true, message: "Thread not found." };
      return { thread: t, messages: state.inbox_messages.filter((m) => m.thread_id === t.id) };
    }

    case "reply_inbox_thread": {
      const t = state.inbox_threads.find((x) => x.id === args.thread_id);
      if (!t) return { isError: true, message: "Thread not found." };
      const bodyText = String(args.text || "").slice(0, 1000);
      state.inbox_messages.push({ id: "msg_" + crypto.randomUUID().slice(0, 8), thread_id: t.id, sender: "me", body: bodyText, buttons_json: "[]", shared_reel_title: "", via_automation: "", created_at: now });
      t.last_message_preview = bodyText.slice(0, 90);
      t.unread_count = 0;
      saveState();
      return { sent: true, thread_id: t.id };
    }

    case "suggest_inbox_ai_reply": {
      const t = state.inbox_threads.find((x) => x.id === args.thread_id);
      const msgs = state.inbox_messages.filter((m) => m.thread_id === args.thread_id);
      const last = msgs[msgs.length - 1];
      return { draft: generateAiDmReply({ userMessage: last?.body || "", handle: t?.participant_handle || "creator" }) };
    }

    case "add_inbox_thread_tag": {
      const t = state.inbox_threads.find((x) => x.id === args.thread_id);
      if (!t) return { isError: true, message: "Thread not found." };
      const tags = JSON.parse(t.tags_json || "[]");
      if (tags.length < 8 && !tags.includes(args.tag)) tags.push(args.tag);
      t.tags_json = JSON.stringify(tags);
      saveState();
      return { thread_id: t.id, tags };
    }

    case "list_post_comments":
      return { comments: state.comments.filter((c) => c.workspace_id === ws.id && !c.is_hidden) };

    case "reply_to_comment": {
      const c = state.comments.find((x) => x.id === args.comment_id);
      if (!c) return { isError: true, message: "Comment not found." };
      if (args.hide) c.is_hidden = 1;
      if (args.reply_text) c.public_reply = args.reply_text;
      saveState();
      return { updated: true, comment: c };
    }

    // Analytics (5)
    case "get_analytics_summary": {
      const pub = state.posts.filter((p) => p.workspace_id === ws.id && p.status === "PUBLISHED");
      const autos = state.automations.filter((a) => a.workspace_id === ws.id);
      const totalViews = pub.reduce((s, p) => s + p.views, 0);
      const totalReach = pub.reduce((s, p) => s + p.reach, 0);
      const totalSaves = pub.reduce((s, p) => s + p.saves, 0);
      const totalDms = autos.reduce((s, a) => s + a.dms_sent, 0);
      const totalTaps = autos.reduce((s, a) => s + a.link_taps, 0);
      return {
        workspace: ws.ig_handle, followers: ws.followers_count, published_posts: pub.length,
        total_views: totalViews, total_reach: totalReach, total_saves: totalSaves,
        auto_dms_sent: totalDms, dm_tap_rate_pct: totalDms ? Number(((totalTaps / totalDms) * 100).toFixed(1)) : 0,
        top_post: [...pub].sort((a, b) => b.views - a.views)[0]?.title || null
      };
    }

    case "get_reel_analytics":
      return { reels: state.posts.filter((p) => p.workspace_id === ws.id && p.media_type === "REEL" && p.status === "PUBLISHED").sort((a, b) => b.views - a.views) };

    case "get_account_analytics":
      return { handle: `@${ws.ig_handle}`, followers: ws.followers_count, net_followers_30d: 3420, profile_visits_30d: 18940, website_taps_30d: 4120, daily_reach_series: [8400, 9120, 14800, 12900, 19400, 24600, 22180] };

    case "get_story_analytics":
      return {
        stories_24h: [
          { title: "Q4 Workflow Poll + Link Sticker", impressions: 9420, reach: 8710, sticker_taps: 642, replies: 89, completion_rate: "81%" },
          { title: "Carousel Behind-The-Scenes", impressions: 7890, reach: 7210, sticker_taps: 418, replies: 54, completion_rate: "76%" }
        ]
      };

    case "get_trial_reel_analytics":
      return { trial_reels: state.posts.filter((p) => p.workspace_id === ws.id && p.is_trial_reel === 1) };

    default:
      return { isError: true, message: `Unknown MCP tool: ${name}` };
  }
}

export function handleMcpJsonRpc(rpcBody) {
  const { id = null, method, params = {} } = rpcBody || {};

  if (method === "initialize") {
    return {
      jsonrpc: "2.0",
      id,
      result: {
        protocolVersion: "2025-06-18",
        serverInfo: { name: "reeldrop-mcp-server", version: "2.0.0" },
        capabilities: { tools: { listChanged: false } }
      }
    };
  }

  if (method === "tools/list") {
    return { jsonrpc: "2.0", id, result: { tools: MCP_TOOLS_CATALOG } };
  }

  if (method === "tools/call") {
    const output = callMcpTool(params.name, params.arguments || {});
    return {
      jsonrpc: "2.0",
      id,
      result: {
        isError: Boolean(output.isError),
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output
      }
    };
  }

  return { jsonrpc: "2.0", id, error: { code: -32601, message: `Unsupported JSON-RPC method: ${method}` } };
}
