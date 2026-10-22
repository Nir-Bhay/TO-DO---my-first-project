import { Easing, interpolate } from "remotion";

export const FPS = 60;
export const BPM = 120;
export const BEAT_FRAMES = 30;
export const TOTAL_FRAMES = 1440;

export const SETTLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const WHIP_EASE = Easing.bezier(0.65, 0, 0.25, 1);

export const TRANSITION_DURATIONS = {
  T1_PORTAL: 24,
  T2_WHIP_L: 24,
  T3_CRANE_UP: 24,
  T4_WHIP_R: 24,
  T5_PRISM: 26
};

export const ACTS = {
  HOOK_PORTAL: { from: 0, duration: 264, label: "01 · KINETIC HOOK" },
  SMART_CROP: { from: 240, duration: 294, label: "02 · SMART 4:5 CROP" },
  AUTO_DM: { from: 510, duration: 300, label: "03 · INSTANT META DM" },
  VISUAL_GRID: { from: 786, duration: 264, label: "04 · 4:5 GRID SWAP" },
  INBOX_MCP: { from: 1026, duration: 240, label: "05 · CRM, MCP & MODES" },
  FINALE: { from: 1240, duration: 200, label: "06 · VELORA STUDIO" }
};

export const EVENTS = {
  HOOK_STOMP_1: 2,
  HOOK_STOMP_2: 60,
  HOOK_PILL_REVEAL: 120,
  PORTAL_PRESS: 195,
  PORTAL_DROP: 240,
  CROP_PRESS_LOCAL: 96,
  CROP_SNAP_LOCAL: 104,
  DM_MATCH_LOCAL: 26,
  DM_FIRE_LOCAL: 90,
  GRID_LIFT_LOCAL: 54,
  GRID_LOCK_LOCAL: 114,
  MODE_PRESS_LOCAL: 84,
  FINALE_CONVERGE_LOCAL: 20
};

export const AUDIO_CUES = [
  { frame: EVENTS.HOOK_STOMP_1, file: "audio/sfx-stomp.m4a", volume: 0.72 },
  { frame: EVENTS.HOOK_STOMP_2, file: "audio/sfx-stomp.m4a", volume: 0.78 },
  { frame: EVENTS.HOOK_STOMP_2, file: "audio/sfx-snap.m4a", volume: 0.58 },
  { frame: EVENTS.HOOK_PILL_REVEAL, file: "audio/sfx-stomp.m4a", volume: 0.72 },
  { frame: EVENTS.PORTAL_PRESS, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: EVENTS.PORTAL_DROP - 18, file: "audio/sfx-portal.m4a", volume: 0.88 },

  { frame: ACTS.SMART_CROP.from + EVENTS.CROP_PRESS_LOCAL, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: ACTS.SMART_CROP.from + EVENTS.CROP_SNAP_LOCAL, file: "audio/sfx-shutter.m4a", volume: 0.82 },

  { frame: 510, file: "audio/sfx-whip.m4a", volume: 0.82 },
  { frame: 512, file: "audio/sfx-snap.m4a", volume: 0.65 },

  { frame: ACTS.AUTO_DM.from + EVENTS.DM_MATCH_LOCAL, file: "audio/sfx-click.m4a", volume: 0.86 },
  { frame: ACTS.AUTO_DM.from + EVENTS.DM_FIRE_LOCAL, file: "audio/sfx-shutter.m4a", volume: 0.76 },
  { frame: ACTS.AUTO_DM.from + EVENTS.DM_FIRE_LOCAL, file: "audio/sfx-sparkle.m4a", volume: 0.68 },

  { frame: 786, file: "audio/sfx-whip.m4a", volume: 0.82 },
  { frame: ACTS.VISUAL_GRID.from + EVENTS.GRID_LOCK_LOCAL, file: "audio/sfx-shutter.m4a", volume: 0.88 },
  { frame: 1026, file: "audio/sfx-whip.m4a", volume: 0.82 },

  { frame: ACTS.INBOX_MCP.from + EVENTS.MODE_PRESS_LOCAL, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: ACTS.INBOX_MCP.from + EVENTS.MODE_PRESS_LOCAL + 2, file: "audio/sfx-snap.m4a", volume: 0.74 },

  { frame: 1240, file: "audio/sfx-whip.m4a", volume: 0.85 },
  { frame: ACTS.FINALE.from + EVENTS.FINALE_CONVERGE_LOCAL, file: "audio/sfx-stomp.m4a", volume: 0.84 },
  { frame: ACTS.FINALE.from + EVENTS.FINALE_CONVERGE_LOCAL, file: "audio/sfx-sparkle.m4a", volume: 0.72 }
];

export function tweenSettle(frame, start, end, fromVal = 0, toVal = 1) {
  return interpolate(frame, [start, end], [fromVal, toVal], {
    easing: SETTLE_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}

export function tweenWhip(frame, start, end, fromVal = 0, toVal = 1) {
  return interpolate(frame, [start, end], [fromVal, toVal], {
    easing: WHIP_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
}

export function beatPulse(globalFrame) {
  const phase = (globalFrame % BEAT_FRAMES) / BEAT_FRAMES;
  return Math.exp(-phase * 5.2);
}

export function computeCursorState(frame, { start, target, rest, approachStart, pressFrame }) {
  let x = start[0];
  let y = start[1];

  if (frame <= pressFrame + 14) {
    const p = tweenSettle(frame, approachStart, pressFrame - 6, 0, 1);
    const arcLift = Math.sin(p * Math.PI) * -26;
    x = start[0] + (target[0] - start[0]) * p;
    y = start[1] + (target[1] - start[1]) * p + arcLift;
  } else {
    const dep = tweenSettle(frame, pressFrame + 14, pressFrame + 44, 0, 1);
    x = target[0] + (rest[0] - target[0]) * dep;
    y = target[1] + (rest[1] - target[1]) * dep;
  }

  let scale = 1;
  if (frame >= pressFrame - 5 && frame <= pressFrame) {
    scale = interpolate(frame, [pressFrame - 5, pressFrame], [1, 0.88], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  } else if (frame > pressFrame && frame <= pressFrame + 10) {
    scale = interpolate(frame, [pressFrame, pressFrame + 10], [0.88, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  }

  const ripple =
    frame >= pressFrame && frame <= pressFrame + 28
      ? (frame - pressFrame) / 28
      : null;

  const opacity = tweenSettle(frame, approachStart - 8, approachStart + 6, 0, 1);
  return { x, y, scale, ripple, opacity };
}
