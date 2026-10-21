import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInitialSeedState } from "./seedData.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export const DATA_DIR = IS_VERCEL
  ? path.join(os.tmpdir(), "reeldrop-data")
  : path.resolve(__dirname, "../data");

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });
} catch {}

export const STATE_JSON_PATH = path.join(DATA_DIR, "reeldrop-state.json");
export const DB_PATH = path.join(DATA_DIR, "reeldrop.db");

function loadOrCreateState() {
  try {
    if (fs.existsSync(STATE_JSON_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(STATE_JSON_PATH, "utf8"));
      if (parsed && Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0) {
        if (!Array.isArray(parsed.comments)) parsed.comments = createInitialSeedState().comments;
        return parsed;
      }
    }
  } catch {}
  const initial = createInitialSeedState();
  saveState(initial);
  return initial;
}

export let state = null;
state = loadOrCreateState();

export function saveState(nextState = state) {
  state = nextState;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_JSON_PATH, JSON.stringify(state, null, 2));
  } catch {
    // Graceful in strictly ephemeral memory-only environments
  }
}

export function resetStateToSeed() {
  const fresh = createInitialSeedState();
  saveState(fresh);
  return fresh;
}

export function hydrateStateFromClientSnapshot(clientSnapshot) {
  if (
    clientSnapshot &&
    typeof clientSnapshot === "object" &&
    Array.isArray(clientSnapshot.workspaces) &&
    clientSnapshot.workspaces.length > 0 &&
    Array.isArray(clientSnapshot.posts)
  ) {
    saveState(clientSnapshot);
  }
}

export function incrementPlatformMetric(key, delta = 1) {
  state.platform_metrics[key] = (Number(state.platform_metrics[key]) || 0) + delta;
  saveState();
}

export function getPlatformMetrics() {
  return { ...state.platform_metrics };
}

// Optional native SQLite mirror whenever running on Node >=22.5 (used by local dev & `rea inspect-sqlite-database`)
export async function exportSqliteMirror(targetSqlitePath = DB_PATH) {
  let sqliteMod;
  try {
    sqliteMod = await import("node:sqlite");
  } catch {
    return { supported: false, path: null };
  }

  fs.mkdirSync(path.dirname(targetSqlitePath), { recursive: true });
  if (fs.existsSync(targetSqlitePath)) fs.unlinkSync(targetSqlitePath);

  const sqlite = new sqliteMod.DatabaseSync(targetSqlitePath);
  sqlite.exec(`
    CREATE TABLE platform_metrics (key TEXT PRIMARY KEY, value INTEGER NOT NULL);
    CREATE TABLE workspaces (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, ig_handle TEXT NOT NULL, ig_account_id TEXT NOT NULL,
      avatar_color TEXT NOT NULL, plan TEXT NOT NULL, billing_cycle TEXT NOT NULL, timezone TEXT NOT NULL,
      posting_slots TEXT NOT NULL, grid_crop TEXT NOT NULL, followers_count INTEGER NOT NULL,
      ai_captions_used INTEGER NOT NULL, ai_carousel_images_used INTEGER NOT NULL,
      trial_reels_used INTEGER NOT NULL, ai_dm_replies_used INTEGER NOT NULL,
      referral_code TEXT NOT NULL, referral_months_earned INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE posts (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, media_type TEXT NOT NULL, status TEXT NOT NULL,
      title TEXT NOT NULL, caption TEXT NOT NULL, hashtags TEXT NOT NULL, first_comment TEXT NOT NULL,
      cover_style TEXT NOT NULL, cover_label TEXT NOT NULL, collab_handle TEXT NOT NULL,
      is_trial_reel INTEGER NOT NULL, trial_graduated INTEGER NOT NULL, automation_id TEXT,
      scheduled_at TEXT NOT NULL, published_at TEXT, error_reason TEXT,
      views INTEGER NOT NULL, reach INTEGER NOT NULL, likes INTEGER NOT NULL,
      comments_count INTEGER NOT NULL, saves INTEGER NOT NULL, avg_watch_sec REAL NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE grid_placeholders (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, note TEXT NOT NULL,
      color TEXT NOT NULL, position_order INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE carousels (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, title TEXT NOT NULL, prompt TEXT NOT NULL,
      theme_id TEXT NOT NULL, aspect_ratio TEXT NOT NULL, caption TEXT NOT NULL, slides_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE automations (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL,
      trigger_type TEXT NOT NULL, post_target TEXT NOT NULL, target_post_id TEXT, keywords_json TEXT NOT NULL,
      public_reply_enabled INTEGER NOT NULL, public_reply_variants_json TEXT NOT NULL,
      follow_gate_enabled INTEGER NOT NULL, follow_gate_message TEXT NOT NULL,
      opening_card_enabled INTEGER NOT NULL, opening_card_text TEXT NOT NULL, opening_button_label TEXT NOT NULL,
      dm_message TEXT NOT NULL, buttons_json TEXT NOT NULL, followup_enabled INTEGER NOT NULL,
      followup_delay TEXT NOT NULL, followup_message TEXT NOT NULL, ai_prompt TEXT NOT NULL,
      dms_sent INTEGER NOT NULL, link_taps INTEGER NOT NULL, public_replies_sent INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE inbox_threads (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, participant_handle TEXT NOT NULL, participant_name TEXT NOT NULL,
      avatar_bg TEXT NOT NULL, is_open INTEGER NOT NULL, unread_count INTEGER NOT NULL, is_hot_lead INTEGER NOT NULL,
      is_outreach INTEGER NOT NULL, is_archived INTEGER NOT NULL, is_pinned INTEGER NOT NULL, snoozed_until TEXT,
      tags_json TEXT NOT NULL, last_message_preview TEXT NOT NULL, last_user_message_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE inbox_messages (
      id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, sender TEXT NOT NULL, body TEXT NOT NULL,
      buttons_json TEXT NOT NULL, shared_reel_title TEXT, via_automation TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE comments (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, post_id TEXT NOT NULL, post_title TEXT NOT NULL,
      author_handle TEXT NOT NULL, body TEXT NOT NULL, matched_keyword TEXT, dm_sent INTEGER NOT NULL,
      public_reply TEXT, is_hidden INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE notifications (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, kind TEXT NOT NULL,
      title TEXT NOT NULL, detail TEXT NOT NULL, is_read INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE campaign_applications (
      id TEXT PRIMARY KEY, ig_handle TEXT NOT NULL, email TEXT NOT NULL,
      avg_views INTEGER NOT NULL, niche TEXT NOT NULL, sample_url TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);

  for (const [k, v] of Object.entries(state.platform_metrics)) {
    sqlite.prepare("INSERT INTO platform_metrics VALUES (?, ?)").run(k, v);
  }
  const ins = (table, cols) => {
    const stmt = sqlite.prepare(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`);
    for (const row of state[table] || []) {
      stmt.run(...cols.map((c) => row[c] ?? null));
    }
  };

  ins("workspaces", ["id","name","ig_handle","ig_account_id","avatar_color","plan","billing_cycle","timezone","posting_slots","grid_crop","followers_count","ai_captions_used","ai_carousel_images_used","trial_reels_used","ai_dm_replies_used","referral_code","referral_months_earned","created_at"]);
  ins("posts", ["id","workspace_id","media_type","status","title","caption","hashtags","first_comment","cover_style","cover_label","collab_handle","is_trial_reel","trial_graduated","automation_id","scheduled_at","published_at","error_reason","views","reach","likes","comments_count","saves","avg_watch_sec","created_at"]);
  ins("grid_placeholders", ["id","workspace_id","note","color","position_order","created_at"]);
  ins("carousels", ["id","workspace_id","title","prompt","theme_id","aspect_ratio","caption","slides_json","created_at"]);
  ins("automations", ["id","workspace_id","name","status","trigger_type","post_target","target_post_id","keywords_json","public_reply_enabled","public_reply_variants_json","follow_gate_enabled","follow_gate_message","opening_card_enabled","opening_card_text","opening_button_label","dm_message","buttons_json","followup_enabled","followup_delay","followup_message","ai_prompt","dms_sent","link_taps","public_replies_sent","created_at"]);
  ins("inbox_threads", ["id","workspace_id","participant_handle","participant_name","avatar_bg","is_open","unread_count","is_hot_lead","is_outreach","is_archived","is_pinned","snoozed_until","tags_json","last_message_preview","last_user_message_at","updated_at"]);
  ins("inbox_messages", ["id","thread_id","sender","body","buttons_json","shared_reel_title","via_automation","created_at"]);
  ins("comments", ["id","workspace_id","post_id","post_title","author_handle","body","matched_keyword","dm_sent","public_reply","is_hidden","created_at"]);
  ins("notifications", ["id","workspace_id","kind","title","detail","is_read","created_at"]);
  ins("campaign_applications", ["id","ig_handle","email","avg_views","niche","sample_url","created_at"]);

  sqlite.close();
  return { supported: true, path: targetSqlitePath };
}
