import { Easing, interpolate } from "remotion";

export const FPS = 60;
export const BPM = 120;
export const BEAT_FRAMES = 30; // Exact 0.500s per kick beat!
export const BAR_FRAMES = 120; // Exact 2.000s per 4/4 musical bar!
export const TOTAL_FRAMES = 1680; // Exact 28.000s = 56 beats = 14 bars!

export const SETTLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);
export const WHIP_EASE = Easing.bezier(0.65, 0, 0.25, 1);

export const TRANSITION_DURATIONS = {
  T1_PORTAL: 24,
  T2_WHIP_L: 24,
  T3_CRANE_UP: 24,
  T4_WHIP_R: 24,
  T5_CRANE_UP_2: 24,
  T6_PRISM: 24
};

// Every transition spans [BarFrame - 12 .. BarFrame + 12], placing EVERY transition peak
// right on exact Bar Downbeats F240 (4.0s), F480 (8.0s), F720 (12.0s), F960 (16.0s), F1200 (20.0s), F1440 (24.0s)!
// Sum = 252 + 264 + 264 + 264 + 264 + 264 + 252 = 1824; minus 6*24 (144) = 1680 exact!
export const ACTS = {
  HOOK_PORTAL: { from: 0, duration: 252, label: "01 · CREATOR REEL HOOK" },
  SMART_CROP: { from: 228, duration: 264, label: "02 · SMART 4:5 STUDIO" },
  AUTO_DM: { from: 468, duration: 264, label: "03 · 0.8s OFFICIAL META DM" },
  VISUAL_GRID: { from: 708, duration: 264, label: "04 · 4:5 PROFILE GRID" },
  INBOX_MCP: { from: 948, duration: 264, label: "05 · PRIORITY CRM & 58 MCP" },
  MODES_TOOLS: { from: 1188, duration: 264, label: "06 · LIVE OAUTH MODES" },
  FINALE: { from: 1428, duration: 252, label: "07 · VELORA STUDIO 3.0" }
};

// Every audio cue sits squarely on a 30-frame kick or 15-frame eighth-note subdivision!
export const AUDIO_CUES = [
  // Act 1 (Bars 0–2, Build -> Full Drop at F240!)
  { frame: 0, file: "audio/sfx-stomp.m4a", volume: 0.72 },
  { frame: 30, file: "audio/sfx-pop.m4a", volume: 0.58 },
  { frame: 60, file: "audio/sfx-pop.m4a", volume: 0.62 },
  { frame: 90, file: "audio/sfx-shutter.m4a", volume: 0.72 },
  { frame: 120, file: "audio/sfx-stomp.m4a", volume: 0.82 },
  { frame: 120, file: "audio/sfx-whip.m4a", volume: 0.75 },
  { frame: 180, file: "audio/sfx-swoosh.m4a", volume: 0.42 },
  { frame: 210, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: 225, file: "audio/sfx-portal.m4a", volume: 0.92 },

  // Act 2 (Bars 2–4: F240 .. F480)
  { frame: 300, file: "audio/sfx-tap.m4a", volume: 0.85 },
  { frame: 360, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: 360, file: "audio/sfx-shutter.m4a", volume: 0.82 },
  { frame: 468, file: "audio/sfx-whip.m4a", volume: 0.84 },

  // Act 3 (Bars 4–6: F480 .. F720)
  { frame: 570, file: "audio/sfx-click.m4a", volume: 0.94 },
  { frame: 600, file: "audio/sfx-pop.m4a", volume: 0.84 },
  { frame: 600, file: "audio/sfx-sparkle.m4a", volume: 0.68 },
  { frame: 708, file: "audio/sfx-whip.m4a", volume: 0.84 },

  // Act 4 (Bars 6–8: F720 .. F960)
  { frame: 810, file: "audio/sfx-tap.m4a", volume: 0.84 },
  { frame: 840, file: "audio/sfx-swoosh.m4a", volume: 0.45 },
  { frame: 870, file: "audio/sfx-shutter.m4a", volume: 0.88 },
  { frame: 948, file: "audio/sfx-whip.m4a", volume: 0.84 },

  // Act 5 (Bars 8–10: F960 .. F1200)
  { frame: 1050, file: "audio/sfx-click.m4a", volume: 0.92 },
  { frame: 1080, file: "audio/sfx-pop.m4a", volume: 0.78 },
  { frame: 1188, file: "audio/sfx-whip.m4a", volume: 0.84 },

  // Act 6 (Bars 10–12: F1200 .. F1440)
  { frame: 1290, file: "audio/sfx-click.m4a", volume: 0.95 },
  { frame: 1290, file: "audio/sfx-snap.m4a", volume: 0.78 },
  { frame: 1428, file: "audio/sfx-whip.m4a", volume: 0.86 },

  // Act 7 (Bars 12–14: F1440 .. F1680)
  { frame: 1440, file: "audio/sfx-stomp.m4a", volume: 0.86 },
  { frame: 1440, file: "audio/sfx-sparkle.m4a", volume: 0.74 },
  { frame: 1530, file: "audio/sfx-tap.m4a", volume: 0.72 }
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

export function sampleWaypointsAt(frame, waypoints) {
  if (!waypoints || waypoints.length === 0) {
    return { x: 0, y: 0, kind: "arrow", scale: 1, opacity: 0 };
  }

  let x = waypoints[0].pos[0];
  let y = waypoints[0].pos[1];
  let kind = waypoints[0].kind || "arrow";

  if (frame <= waypoints[0].at) {
    x = waypoints[0].pos[0];
    y = waypoints[0].pos[1];
  } else if (frame >= waypoints[waypoints.length - 1].at) {
    const last = waypoints[waypoints.length - 1];
    x = last.pos[0];
    y = last.pos[1];
    kind = last.kind || "arrow";
  } else {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      if (frame >= a.at && frame <= b.at) {
        const dur = Math.max(1, b.at - a.at);
        const p = tweenSettle(frame, a.at, b.at, 0, 1);
        const arc = b.arc !== undefined ? b.arc : -26;
        x = a.pos[0] + (b.pos[0] - a.pos[0]) * p;
        y = a.pos[1] + (b.pos[1] - a.pos[1]) * p + Math.sin(p * Math.PI) * arc;
        kind = p > 0.55 || dur < 14 ? b.kind || a.kind || "arrow" : a.kind || "arrow";
        break;
      }
    }
  }

  let scale = 1;
  for (const wp of waypoints) {
    if (!wp.press) continue;
    if (frame >= wp.at - 4 && frame <= wp.at) {
      scale = Math.min(
        scale,
        interpolate(frame, [wp.at - 4, wp.at], [1, 0.85], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        })
      );
    } else if (frame > wp.at && frame <= wp.at + 10) {
      scale = Math.min(
        scale,
        interpolate(frame, [wp.at, wp.at + 10], [0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        })
      );
    }
  }

  const opacity = tweenSettle(frame, waypoints[0].at - 6, waypoints[0].at + 8, 0, 1);
  return { x, y, kind, scale, opacity };
}

export function evaluateCursorRig(frame, waypoints) {
  const curr = sampleWaypointsAt(frame, waypoints);
  const prev = sampleWaypointsAt(frame - 2, waypoints);
  const vx = (curr.x - prev.x) * 0.5;
  const vy = (curr.y - prev.y) * 0.5;
  const speed = Math.hypot(vx, vy);
  const bankDeg = Math.max(-12, Math.min(12, vx * 0.32));

  // Stationary anchored click rings right at the clicked button position [wp.pos[0], wp.pos[1]]!
  const activeRipples = [];
  for (const wp of waypoints || []) {
    if (wp.press && frame >= wp.at && frame <= wp.at + 24) {
      activeRipples.push({
        x: wp.pos[0],
        y: wp.pos[1],
        p: (frame - wp.at) / 24
      });
    }
  }

  const trail = [3, 6, 9].map((lag, idx) => {
    const tSample = sampleWaypointsAt(frame - lag, waypoints);
    return {
      x: tSample.x,
      y: tSample.y,
      opacity: speed > 5.5 ? curr.opacity * (0.28 - idx * 0.08) : 0,
      size: 11 - idx * 2.5
    };
  });

  return { ...curr, vx, vy, speed, bankDeg, activeRipples, trail };
}
