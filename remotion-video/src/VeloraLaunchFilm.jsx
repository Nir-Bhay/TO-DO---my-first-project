import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { FontFaces, TOKENS, VeloraLogoMark } from "./theme.jsx";
import {
  ACTS,
  AUDIO_CUES,
  TRANSITION_DURATIONS,
  beatPulse,
  evaluateCursorRig,
  tweenSettle,
  tweenWhip
} from "./motionSpec.js";
import {
  opticalIrisPortal,
  velocityWhipPush,
  cameraCraneWhip,
  diagonalShutterPrism
} from "./transitions.jsx";

const ArrowRightSvg = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const CheckSvg = ({ size = 14, color = "currentColor", strokeWidth = 2.6 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/* ============================================================================
   1. CLEAN ARCHITECTURAL STAGE BACKDROP (BEAT-REACTIVE LIGHTING, ZERO CLUTTER)
   ============================================================================ */
const DeepStageBackdrop = ({ globalFrame, variant = "studio", width, height }) => {
  const pulse = beatPulse(globalFrame);
  const driftX = Math.sin(globalFrame / 48) * 44;
  const driftY = Math.cos(globalFrame / 38) * 30;
  const gridOffset = (globalFrame * 1.25) % 80;

  if (variant === "dark") {
    return (
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(115% 95% at 50% 14%, #15264A 0%, #091122 56%, #040710 100%)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "-25%",
            right: "-25%",
            bottom: "-34%",
            height: "84%",
            perspective: 780,
            pointerEvents: "none"
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              transform: "rotateX(66deg)",
              transformOrigin: "center top",
              backgroundImage:
                "linear-gradient(to right, rgba(96,165,250,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.14) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
              backgroundPosition: `0px ${gridOffset}px`,
              maskImage: "linear-gradient(to bottom, transparent 0%, black 38%, transparent 96%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 38%, transparent 96%)"
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: width * 0.16 + driftX,
            top: height * 0.08 + driftY,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.38), transparent 68%)",
            transform: `scale(${1 + pulse * 0.09})`,
            filter: "blur(32px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: width * 0.12 - driftX * 0.7,
            bottom: height * 0.08 - driftY * 0.7,
            width: 580,
            height: 580,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.28), transparent 70%)",
            transform: `scale(${1 + pulse * 0.08})`,
            filter: "blur(32px)"
          }}
        />
        <AbsoluteFill
          style={{
            boxShadow: "inset 0 0 180px rgba(2, 6, 16, 0.72)",
            pointerEvents: "none"
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(120% 100% at 50% 6%, #F9FBFF 0%, #EDF3FE 56%, #E2ECFC 100%)",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "-25%",
          right: "-25%",
          bottom: "-36%",
          height: "80%",
          perspective: 840,
          pointerEvents: "none"
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: "rotateX(66deg)",
            transformOrigin: "center top",
            backgroundImage:
              "linear-gradient(to right, rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.08) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            backgroundPosition: `0px ${gridOffset}px`,
            maskImage: "linear-gradient(to bottom, transparent 0%, black 42%, transparent 98%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 42%, transparent 98%)"
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          right: -100 + driftX,
          top: -90 + driftY,
          width: 720,
          height: 720,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.17), transparent 68%)",
          transform: `scale(${1 + pulse * 0.07})`,
          filter: "blur(20px)"
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -100 - driftX * 0.6,
          bottom: -110 - driftY * 0.6,
          width: 660,
          height: 660,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.14), transparent 68%)",
          transform: `scale(${1 + pulse * 0.06})`,
          filter: "blur(20px)"
        }}
      />
    </AbsoluteFill>
  );
};

const SceneTag = ({ text, frame, dark = false, centered = false }) => {
  const enter = tweenSettle(frame, 0, 15, 0, 1);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 16px",
        borderRadius: 999,
        background: dark ? "rgba(37, 99, 235, 0.24)" : "rgba(255, 255, 255, 0.92)",
        border: dark ? "1px solid rgba(96, 165, 250, 0.48)" : "1px solid rgba(37, 99, 235, 0.24)",
        boxShadow: dark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 20px rgba(37,99,235,0.07)",
        fontFamily: TOKENS.fontMono,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: dark ? "#93C5FD" : "#1D4ED8",
        transform: `translateY(${(1 - enter) * 12}px)`,
        opacity: enter,
        alignSelf: centered ? "center" : "flex-start"
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: dark ? "#38BDF8" : "#2563EB",
          boxShadow: "0 0 10px #38BDF8"
        }}
      />
      {text}
    </div>
  );
};

const KineticSplitHeadline = ({
  lines,
  accentLineIndex = 1,
  frame,
  startFrame = 2,
  fontSize = 58,
  dark = false,
  align = "left"
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: align }}>
    {lines.map((line, i) => {
      const f0 = startFrame + i * 7;
      const p = tweenSettle(frame, f0, f0 + 18, 0, 1);
      const isAccent = i === accentLineIndex;
      return (
        <div key={line} style={{ overflow: "hidden", padding: "2px 0 6px" }}>
          <div
            style={{
              fontFamily: TOKENS.fontDisplay,
              fontSize,
              fontWeight: 800,
              lineHeight: 1.07,
              letterSpacing: "-0.036em",
              transform: `translateY(${(1 - p) * 110}%)`,
              opacity: interpolate(p, [0, 0.2, 1], [0, 1, 1]),
              ...(isAccent
                ? {
                    background: dark
                      ? "linear-gradient(90deg, #60A5FA 0%, #38BDF8 55%, #A5B4FC 100%)"
                      : "linear-gradient(90deg, #1D4ED8 0%, #2563EB 52%, #0284C7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }
                : { color: dark ? "#F8FAFC" : TOKENS.inkPrimary })
            }}
          >
            {line}
          </div>
        </div>
      );
    })}
  </div>
);

/* ============================================================================
   2. CINEMA VECTOR CURSOR RIG (STATIONARY ANCHORED RIPPLES + CLEAN VECTORS)
   ============================================================================ */
const HAND_SHAPES = (
  <>
    <rect x={7.2} y={2} width={3.8} height={16.5} rx={1.9} />
    <rect x={10.9} y={10.5} width={3.6} height={9.5} rx={1.8} />
    <rect x={14.2} y={12} width={3.6} height={8.5} rx={1.8} />
    <rect x={17.4} y={13.6} width={3.4} height={7} rx={1.7} />
    <rect x={3.2} y={16} width={3.6} height={6} rx={1.8} transform="rotate(-58 5 19)" />
    <rect x={4.9} y={16.5} width={14.6} height={11} rx={4.8} />
  </>
);

const GRAB_SHAPES = (
  <>
    <rect x={6.4} y={8.5} width={3.6} height={9.5} rx={1.8} />
    <rect x={10.0} y={7.5} width={3.6} height={10.5} rx={1.8} />
    <rect x={13.6} y={8.4} width={3.6} height={9.6} rx={1.8} />
    <rect x={17.0} y={10.2} width={3.3} height={8.0} rx={1.65} />
    <rect x={3.4} y={13.5} width={3.8} height={6.5} rx={1.8} transform="rotate(-38 5 16)" />
    <rect x={4.8} y={13.5} width={15.2} height={12.2} rx={5.2} />
  </>
);

const CinemaCursorRig = ({ rig }) => {
  if (!rig || rig.opacity <= 0.01) return null;

  return (
    <>
      {/* Stationary Click Ripples Anchored Strictly at the Clicked Button Coordinate! */}
      {rig.activeRipples?.map((rp, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: rp.x - 42,
            top: rp.y - 42,
            width: 84,
            height: 84,
            borderRadius: "50%",
            border: "3px solid rgba(37, 99, 235, 0.9)",
            background: "rgba(56, 189, 248, 0.16)",
            transform: `scale(${0.55 + rp.p * 0.65})`,
            opacity: 0.95 * (1 - rp.p * rp.p),
            pointerEvents: "none",
            zIndex: 87
          }}
        />
      ))}

      {/* Subtle Velocity Trail During Fast Glides Only */}
      {rig.trail?.map((pt, i) =>
        pt.opacity > 0.01 ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pt.x - pt.size / 2,
              top: pt.y - pt.size / 2,
              width: pt.size,
              height: pt.size,
              borderRadius: "50%",
              background: "radial-gradient(circle, #38BDF8, #2563EB)",
              opacity: pt.opacity,
              pointerEvents: "none",
              zIndex: 88
            }}
          />
        ) : null
      )}

      <div
        style={{
          position: "absolute",
          left: rig.x,
          top: rig.y,
          opacity: rig.opacity,
          pointerEvents: "none",
          zIndex: 90
        }}
      >
        {rig.kind === "pointer" || rig.kind === "grab" ? (
          <svg
            width={36}
            height={48}
            viewBox="0 0 24 32"
            style={{
              position: "absolute",
              left: -13,
              top: rig.kind === "grab" ? -12 : -3,
              transform: `scale(${rig.scale}) rotate(${rig.bankDeg * 0.45}deg)`,
              transformOrigin: "13px 4px",
              filter: "drop-shadow(0 10px 20px rgba(15, 23, 42, 0.38))"
            }}
          >
            <g fill="#FFFFFF" stroke="#0B111E" strokeWidth={2.0} strokeLinejoin="round">
              {rig.kind === "grab" ? GRAB_SHAPES : HAND_SHAPES}
            </g>
            <g fill="#FFFFFF">{rig.kind === "grab" ? GRAB_SHAPES : HAND_SHAPES}</g>
          </svg>
        ) : (
          <svg
            width={38}
            height={50}
            viewBox="0 0 24 32"
            style={{
              position: "absolute",
              left: -2,
              top: -2,
              transform: `scale(${rig.scale}) rotate(${rig.bankDeg}deg)`,
              transformOrigin: "2px 2px",
              filter: "drop-shadow(0 10px 20px rgba(15, 23, 42, 0.38))"
            }}
          >
            <path
              d="M1 1 L1 23 L6.5 17.8 L10.2 26.6 L13.7 25 L9.95 16.5 L17 16.3 Z"
              fill="#0B111E"
              stroke="#FFFFFF"
              strokeWidth={2.1}
              strokeLinejoin="round"
              paintOrder="stroke"
            />
          </svg>
        )}
      </div>
    </>
  );
};

/* Clean Unobstructed 3D Studio Window with Subtle Beat-Reactive Elevation */
const StudioWindow3D = ({
  src,
  secondarySrc = null,
  secondaryReveal = 0,
  secondaryMode = "fade",
  width,
  height,
  urlLabel = "velora.so/app",
  camZoom = 1.05,
  camPanX = 0,
  camPanY = 0,
  rotX = 2.4,
  rotY = -5.5,
  globalFrame = 0
}) => {
  const pulse = beatPulse(globalFrame);
  return (
    <div style={{ width, height, perspective: 1400, position: "relative" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 26,
          background: "#FFFFFF",
          border: "1.5px solid rgba(255, 255, 255, 0.95)",
          boxShadow: `0 ${44 + pulse * 8}px ${98 + pulse * 14}px rgba(15, 23, 42, 0.20), 0 12px 30px rgba(37, 99, 235, ${0.10 + pulse * 0.06}), 0 0 0 1px rgba(15, 23, 42, 0.08)`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${1 + pulse * 0.006})`,
          transformStyle: "preserve-3d"
        }}
      >
        <div
          style={{
            height: 44,
            padding: "0 18px",
            background: "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10.5, height: 10.5, borderRadius: "50%", background: "#FB7185" }} />
            <span style={{ width: 10.5, height: 10.5, borderRadius: "50%", background: "#FBBF24" }} />
            <span style={{ width: 10.5, height: 10.5, borderRadius: "50%", background: "#34D399" }} />
          </div>
          <div
            style={{
              padding: "4px 16px",
              borderRadius: 999,
              background: "#FFFFFF",
              border: "1px solid #DBEAFE",
              fontFamily: TOKENS.fontMono,
              fontSize: 12,
              fontWeight: 600,
              color: "#334155",
              display: "flex",
              alignItems: "center",
              gap: 7
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
            {urlLabel}
          </div>
          <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700, color: "#2563EB" }}>
            OFFICIAL API
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden", background: "#F8FAFC" }}>
          <Img
            src={staticFile(src)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top left",
              transform: `scale(${camZoom}) translate(${camPanX}px, ${camPanY}px)`,
              transformOrigin: "center center"
            }}
          />

          {secondarySrc && secondaryReveal > 0.002 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: secondaryMode === "fade" ? secondaryReveal : 1,
                clipPath:
                  secondaryMode === "scan"
                    ? `inset(0 ${(1 - secondaryReveal) * 100}% 0 0)`
                    : undefined
              }}
            >
              <Img
                src={staticFile(secondarySrc)}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top left",
                  transform: `scale(${camZoom}) translate(${camPanX}px, ${camPanY}px)`,
                  transformOrigin: "center center"
                }}
              />
            </div>
          )}

          {secondaryMode === "scan" && secondaryReveal > 0.02 && secondaryReveal < 0.99 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${secondaryReveal * 100}%`,
                width: 5,
                background: "linear-gradient(180deg, #38BDF8, #2563EB, #818CF8)",
                boxShadow: "0 0 32px 6px rgba(37, 99, 235, 0.85)"
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
   ACT 1 (F000 – F252, BARS 0–2 -> DROP AT F240 = 4.000s):
   SLEEK VELORA STUDIO REEL PREVIEWER HOOK (CLEAN, THEMED, ZERO OVERLAP!)
   ============================================================================ */
const HOOK_COVERS = [
  "covers/post-01.jpg",
  "covers/post-03.jpg",
  "covers/post-05.jpg",
  "covers/post-02.jpg"
];

const Act1EditorialPreviewerHook = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = beatPulse(frame);

  // Beat-synced cover cycle on exact kicks F000, F030, F060, F090 -> locks to safe 4:5 on Beat 4 (F120)!
  const isSolved = frame >= 120;
  const coverIdx = isSolved ? 0 : Math.floor(frame / 30) % HOOK_COVERS.length;
  const solveTransition = tweenWhip(frame, 114, 134, 0, 1);

  const portalExpand = tweenWhip(frame, 214, 244, 0, 1);
  const btnW = isVertical ? 480 : 520;
  const btnH = 80;
  const btnY = isVertical ? height * 0.86 : height * 0.86;

  const cursor = evaluateCursorRig(frame, [
    { at: 156, pos: [width * 0.78, btnY + 95], kind: "arrow" },
    { at: 202, pos: [width * 0.5 + btnW * 0.22, btnY + 4], kind: "pointer", arc: -28 },
    { at: 210, pos: [width * 0.5 + btnW * 0.22, btnY + 4], kind: "pointer", press: true, arc: 0 },
    { at: 238, pos: [width * 0.72, btnY + 65], kind: "arrow", arc: 14 }
  ]);

  const portalW = interpolate(portalExpand, [0, 1], [btnW, width * 1.08]);
  const portalH = interpolate(portalExpand, [0, 1], [btnH, height * 1.08]);
  const portalCenterY = interpolate(portalExpand, [0, 1], [btnY, height * 0.5]);

  const feedEvents = [
    {
      at: 15,
      user: "@arjun.codes",
      msg: 'Commented "LINK" on Reel #04',
      status: isSolved ? "Rich DM Delivered · 0.8s" : "Waiting 5h · Unanswered",
      ok: isSolved
    },
    {
      at: 45,
      user: "@riya.design",
      msg: 'Replied "KIT" to Story preview',
      status: isSolved ? "Figma Starter Sent · 0.8s" : "Buried in Requests",
      ok: isSolved
    },
    {
      at: 75,
      user: "@dev.karan",
      msg: 'Commented "REPO" for code template',
      status: isSolved ? "76.1% Link Click-Through" : "0 Links Clicked",
      ok: isSolved
    }
  ];

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={frame} variant="dark" width={width} height={height} />

      <AbsoluteFill
        style={{
          opacity: 1 - portalExpand * 0.94,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: isVertical ? 110 : 54
        }}
      >
        {/* Perfectly Centered Tag + Dynamic Hook Headline */}
        <SceneTag
          text={isSolved ? "VELORA STUDIO v3.0 · PROBLEM SOLVED" : "WHY CREATOR REELS LOSE REACH"}
          frame={frame}
          dark
          centered
        />

        <div
          style={{
            marginTop: 14,
            fontFamily: TOKENS.fontDisplay,
            fontSize: isVertical ? 60 : 64,
            fontWeight: 800,
            letterSpacing: "-0.038em",
            lineHeight: 1.08,
            color: "#FFFFFF",
            textAlign: "center"
          }}
        >
          {isSolved ? (
            <>
              Auto-fit <span style={{ color: "#38BDF8" }}>4:5 covers.</span> Instant{" "}
              <span style={{ color: "#34D399" }}>0.8s DMs.</span>
            </>
          ) : (
            <>
              Stop shipping <span style={{ color: "#FB7185" }}>cropped covers</span> &amp;{" "}
              <span style={{ color: "#93C5FD" }}>missed DMs.</span>
            </>
          )}
        </div>

        {/* Clean Symmetrical Studio Previewer Stage (ZERO overlapping text or floating clutter!) */}
        <div
          style={{
            marginTop: isVertical ? 48 : 34,
            display: "flex",
            flexDirection: isVertical ? "column" : "row",
            alignItems: "center",
            justifyContent: "center",
            gap: isVertical ? 28 : 34
          }}
        >
          {/* Sleek Velora-Themed Reel Cover Previewer Window */}
          <div
            style={{
              width: isVertical ? 540 : 460,
              borderRadius: 28,
              background: "rgba(15, 23, 42, 0.92)",
              border: `2px solid ${isSolved ? "rgba(52, 211, 153, 0.7)" : "rgba(96, 165, 250, 0.42)"}`,
              boxShadow: isSolved
                ? `0 36px 90px rgba(16, 185, 129, ${0.22 + pulse * 0.1}), 0 20px 50px rgba(0,0,0,0.6)`
                : `0 36px 90px rgba(0, 0, 0, 0.65)`,
              padding: 18,
              transform: `scale(${1 + pulse * 0.012})`,
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
          >
            {/* Clean Studio Previewer Top Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <VeloraLogoMark size={28} />
                <span style={{ fontFamily: TOKENS.fontDisplay, fontSize: 14, fontWeight: 700, color: "#F8FAFC" }}>
                  @maya.studio &middot; Feed Preview
                </span>
              </div>
              <span
                style={{
                  padding: "4px 11px",
                  borderRadius: 999,
                  background: isSolved ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.22)",
                  border: `1px solid ${isSolved ? "#34D399" : "#FB7185"}`,
                  color: isSolved ? "#6EE7B7" : "#FDA4AF",
                  fontFamily: TOKENS.fontMono,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                {isSolved ? "1080x1350 SAFE 4:5" : "RAW 1:1 CROP ERROR"}
              </span>
            </div>

            {/* Clean Artwork Viewport with Neat Framing Guides (Zero Text Collision!) */}
            <div
              style={{
                height: isVertical ? 520 : 390,
                borderRadius: 18,
                background: "linear-gradient(160deg, #090F1E 0%, #162444 100%)",
                border: `1.5px dashed ${isSolved ? "rgba(52,211,153,0.65)" : "rgba(251,113,133,0.65)"}`,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isSolved ? 14 : 0
              }}
            >
              <Img
                src={staticFile(HOOK_COVERS[coverIdx])}
                style={{
                  width: isSolved ? "78%" : "108%",
                  height: isSolved ? "96%" : "136%",
                  objectFit: isSolved ? "contain" : "cover",
                  borderRadius: 14,
                  boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
                  transform: `scale(${1 - solveTransition * 0.02})`
                }}
              />
            </div>

            {/* Clean Previewer Footer Status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 12,
                background: "rgba(30, 41, 59, 0.72)",
                fontFamily: TOKENS.fontMono,
                fontSize: 12,
                color: isSolved ? "#6EE7B7" : "#FCA5A5",
                fontWeight: 700
              }}
            >
              <span>{isSolved ? "Full Cover Visible · Zero Cut-Off" : "Top & Bottom Cover Cropped Off"}</span>
              <span>{isSolved ? "+184% Reach" : "-42% Reach"}</span>
            </div>
          </div>

          {/* Right Column: Clean Non-Overlapping Live Comment -> Auto-DM Stack */}
          <div style={{ width: isVertical ? 540 : 490, display: "flex", flexDirection: "column", gap: 14 }}>
            {feedEvents.map((ev) => {
              const p = spring({ frame: frame - ev.at, fps, config: { damping: 16, stiffness: 240 } });
              return (
                <div
                  key={ev.user}
                  style={{
                    padding: "18px 22px",
                    borderRadius: 20,
                    background: "rgba(15, 23, 42, 0.90)",
                    border: `1.5px solid ${ev.ok ? "rgba(52, 211, 153, 0.5)" : "rgba(148, 163, 184, 0.25)"}`,
                    boxShadow: "0 20px 44px rgba(0, 0, 0, 0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 14,
                    opacity: p,
                    transform: `translateX(${(1 - p) * 28}px)`
                  }}
                >
                  <div>
                    <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, color: "#93C5FD" }}>
                      {ev.user}
                    </div>
                    <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginTop: 3 }}>
                      {ev.msg}
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: ev.ok ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)",
                      color: ev.ok ? "#6EE7B7" : "#FDA4AF",
                      fontFamily: TOKENS.fontMono,
                      fontSize: 11.5,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    {ev.ok ? <CheckSvg size={13} color="#34D399" /> : null}
                    <span>{ev.status}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>

      {/* Bottom Centered Portal Launch CTA -> Expands into Live Studio on F240 Drop! */}
      {frame >= 96 && (
        <div
          style={{
            position: "absolute",
            left: width * 0.5 - portalW / 2,
            top: portalCenterY - portalH / 2,
            width: portalW,
            height: portalH,
            borderRadius: interpolate(portalExpand, [0, 0.85, 1], [44, 24, 0]),
            overflow: "hidden",
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 52%, #0284C7 100%)",
            boxShadow:
              portalExpand > 0.05
                ? "0 36px 120px rgba(37,99,235,0.75), 0 0 0 3px #38BDF8"
                : "0 22px 54px rgba(37,99,235,0.55), inset 0 1px 1px rgba(255,255,255,0.48)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: tweenSettle(frame, 96, 114, 0, 1),
            zIndex: 50
          }}
        >
          {portalExpand > 0.02 && (
            <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, portalExpand * 1.5), background: "#F8FAFC" }}>
              <Img
                src={staticFile("screens/screen-overview.webp")}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "top center",
                  transform: `scale(${1.12 - portalExpand * 0.12})`
                }}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: 1 - Math.min(1, portalExpand * 3.2),
              color: "#FFFFFF",
              fontFamily: TOKENS.fontDisplay,
              fontSize: 23,
              fontWeight: 800
            }}
          >
            <VeloraLogoMark size={36} />
            <span>Launch Velora Studio 3.0</span>
            <ArrowRightSvg size={20} />
          </div>
        </div>
      )}

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 2 (F228 – F492, BARS 2–4): LIVE /app/create SMART 4:5 STUDIO
   100% Unobstructed Live Screen + Dedicated Left Telemetry Card!
   ============================================================================ */
const Act2SmartCrop = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.SMART_CROP.from + frame;

  const hookClicked = tweenSettle(frame, 72, 92, 0, 1);
  const snapP = tweenSettle(frame, 132, 158, 0, 1);

  const camZoom = 1.03 + tweenSettle(frame, 48, 150, 0, 0.12) - tweenSettle(frame, 200, 250, 0, 0.05);
  const camPanX = interpolate(frame, [0, 264], [8, -28]);
  const rotY = interpolate(frame, [0, 264], [-7, -3]);

  const winW = isVertical ? 948 : 1068;
  const winH = isVertical ? 820 : 684;
  const winLeft = isVertical ? (width - winW) / 2 : 772;
  const winTop = isVertical ? 690 : 198;

  const aiBtnPos = [winLeft + 315, winTop + 215];
  const smartFitBtnPos = [winLeft + 615, winTop + 446];

  const cursor = evaluateCursorRig(frame, [
    { at: 20, pos: [winLeft + 140, winTop + 560], kind: "arrow" },
    { at: 66, pos: aiBtnPos, kind: "pointer", arc: -28 },
    { at: 72, pos: aiBtnPos, kind: "pointer", press: true, arc: 0 },
    { at: 124, pos: smartFitBtnPos, kind: "pointer", arc: -34 },
    { at: 132, pos: smartFitBtnPos, kind: "pointer", press: true, arc: 0 },
    { at: 176, pos: [winLeft + 145, winTop + 638], kind: "arrow", arc: 20 }
  ]);

  const typedHook = "Stop letting 1:1 grid crops cut off your best Reels — comment REPO!";
  const visibleChars = Math.floor(tweenSettle(frame, 74, 126, 0, typedHook.length));

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 84,
          top: isVertical ? 116 : 206,
          width: isVertical ? width - 132 : 624,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.SMART_CROP.label} frame={frame} />
        <KineticSplitHeadline
          lines={["AI hooks + 4:5 crop.", "Zero edge clipping."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 62 : 58}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Co-write high-retention opening hooks with AI and auto-fit full screenshots inside Instagram&rsquo;s{" "}
          <strong style={{ color: TOKENS.inkPrimary }}>1080&times;1350</strong> ratio.
        </div>

        {/* Clean Dedicated Left-Column Studio Status Card (Zero Overlap with Live Window!) */}
        <div
          style={{
            marginTop: 6,
            padding: "20px 22px",
            borderRadius: 22,
            background: "#FFFFFF",
            border: "1.5px solid #BFDBFE",
            boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            opacity: tweenSettle(frame, 18, 42, 0, 1)
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, color: "#2563EB" }}>
              AI CO-PILOT &middot; LIVE CAPTION DRAFT
            </span>
            <span
              style={{
                padding: "4px 11px",
                borderRadius: 999,
                background: hookClicked > 0.3 ? "#ECFDF5" : "#EFF6FF",
                color: hookClicked > 0.3 ? "#047857" : "#1D4ED8",
                fontFamily: TOKENS.fontMono,
                fontSize: 11.5,
                fontWeight: 800
              }}
            >
              {hookClicked > 0.3 ? "96/100 HOOK SCORE" : "READY"}
            </span>
          </div>
          <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 16.5, fontWeight: 700, color: TOKENS.inkPrimary, minHeight: 24 }}>
            {visibleChars > 0 ? typedHook.slice(0, visibleChars) : "Generating creator hook & 4:5 safe frame..."}
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              background: snapP > 0.5 ? "#ECFDF5" : "#FFF1F2",
              color: snapP > 0.5 ? "#047857" : "#BE123C",
              fontFamily: TOKENS.fontMono,
              fontSize: 13,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {snapP > 0.5 ? <CheckSvg size={15} color="#059669" /> : null}
            <span>{snapP > 0.5 ? "1080x1350 SAFE FIT APPLIED" : "1920x1080 SOURCE DETECTED"}</span>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-create.webp"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/create · AI Co-Pilot & Smart 4:5 Crop"
          camZoom={camZoom}
          camPanX={camPanX}
          rotX={2.4}
          rotY={isVertical ? 0 : rotY}
          globalFrame={globalFrame}
        />
      </div>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 3 (F468 – F732, BARS 4–6): 0.8s OFFICIAL META DM WORKFLOWS
   100% Unobstructed Live /app/automations -> /app/automations-sent Morph!
   ============================================================================ */
const Act3InstantAutoDm = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.AUTO_DM.from + frame;

  // Click lands on exact Beat 19 (global F570 -> local frame 102); live Messenger card sends on Beat 20!
  const dmSentReveal = tweenSettle(frame, 102, 132, 0, 1);
  const ctrVal = (tweenSettle(frame, 104, 164, 0, 1) * 76.1).toFixed(1);
  const dmsSentCount = Math.round(1420 + tweenSettle(frame, 104, 164, 0, 1564)).toLocaleString();

  const winW = isVertical ? 948 : 1068;
  const winH = isVertical ? 820 : 684;
  const winLeft = isVertical ? (width - winW) / 2 : 80;
  const winTop = isVertical ? 690 : 198;

  // Exact position of real "Test" button inside live DM Workflows screen!
  const realTestBtn = [winLeft + 528, winTop + 266];

  const cursor = evaluateCursorRig(frame, [
    { at: 24, pos: [winLeft + 240, winTop + 530], kind: "arrow" },
    { at: 94, pos: realTestBtn, kind: "pointer", arc: -30 },
    { at: 102, pos: realTestBtn, kind: "pointer", press: true, arc: 0 },
    { at: 150, pos: [winLeft + 230, winTop + 615], kind: "arrow", arc: 22 }
  ]);

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-automations.webp"
          secondarySrc="screens/screen-automations-sent.webp"
          secondaryReveal={dmSentReveal}
          secondaryMode="fade"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/automations · Live Messenger Previewer"
          camZoom={1.04 + dmSentReveal * 0.08}
          camPanX={dmSentReveal * -18}
          rotX={2.4}
          rotY={isVertical ? 0 : 5.5}
          globalFrame={globalFrame}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 1204,
          top: isVertical ? 114 : 210,
          width: isVertical ? width - 132 : 636,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.AUTO_DM.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Comment LINK.", "Rich DM in 0.8s."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 62 : 58}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Test and launch Official Meta Graph &amp; Messenger button cards with public reply rotation, follow gates, and live click tracking.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 20,
              background: "#FFFFFF",
              border: "1.5px solid #BFDBFE",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)"
            }}
          >
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11.5, fontWeight: 700, color: "#2563EB" }}>
              LINK CLICK-THROUGH
            </div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 44, fontWeight: 800, color: TOKENS.inkPrimary, marginTop: 4 }}>
              {ctrVal}%
            </div>
          </div>
          <div
            style={{
              padding: "20px 22px",
              borderRadius: 20,
              background: "#FFFFFF",
              border: "1.5px solid #A7F3D0",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)"
            }}
          >
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11.5, fontWeight: 700, color: "#059669" }}>
              AUTO-DMS DELIVERED
            </div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 44, fontWeight: 800, color: TOKENS.inkPrimary, marginTop: 4 }}>
              {dmsSentCount}
            </div>
          </div>
        </div>
      </div>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 4 (F708 – F972, BARS 6–8): 4:5 PROFILE GRID & LIVE ANALYTICS
   Clean Side Swap Preview + Unobstructed /app/grid Studio Window!
   ============================================================================ */
const Act4VisualGrid = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.VISUAL_GRID.from + frame;

  const swapP = tweenSettle(frame, 102, 162, 0, 1);

  const winW = isVertical ? 948 : 1068;
  const winH = isVertical ? 820 : 684;
  const winLeft = isVertical ? (width - winW) / 2 : 772;
  const winTop = isVertical ? 690 : 198;

  const tileA = [winLeft + 390, winTop + 470];
  const tileB = [winLeft + 525, winTop + 470];

  const cursor = evaluateCursorRig(frame, [
    { at: 24, pos: [winLeft + 115, winTop + 560], kind: "arrow" },
    { at: 94, pos: tileA, kind: "pointer", arc: -26 },
    { at: 102, pos: tileA, kind: "grab", press: true, arc: 0 },
    { at: 162, pos: tileB, kind: "grab", arc: -22 },
    { at: 168, pos: tileB, kind: "pointer", press: true, arc: 0 },
    { at: 206, pos: [winLeft + 115, winTop + 560], kind: "arrow", arc: 18 }
  ]);

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 84,
          top: isVertical ? 116 : 202,
          width: isVertical ? width - 132 : 624,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.VISUAL_GRID.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Plan your 4:5 grid.", "Track live reach."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 62 : 58}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Drag scheduled Reels across true <strong style={{ color: TOKENS.inkPrimary }}>4:5, 3:4 &amp; 1:1</strong> ratios while monitoring live Views, Saves, and peak slots.
        </div>

        {/* Clean Dedicated Left-Column Analytics Card */}
        <div
          style={{
            marginTop: 8,
            borderRadius: 22,
            background: "#FFFFFF",
            border: "1.5px solid #BFDBFE",
            boxShadow: "0 20px 44px rgba(15, 23, 42, 0.08)",
            padding: 18,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: tweenSettle(frame, 20, 48, 0, 1)
          }}
        >
          <Img
            src={staticFile("screens/screen-analytics.webp")}
            style={{ width: 205, height: 122, objectFit: "cover", borderRadius: 14, border: "1px solid #E2E8F0" }}
          />
          <div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11.5, fontWeight: 800, color: "#059669" }}>
              {swapP > 0.8 ? "GRID HARMONY 99% LOCKED" : "LIVE PROFILE TELEMETRY"}
            </div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 34, fontWeight: 800, color: TOKENS.inkPrimary }}>
              314.8K Views
            </div>
            <div style={{ fontFamily: TOKENS.fontSans, fontSize: 14, fontWeight: 600, color: "#2563EB" }}>
              +184% Reach &middot; 15.8K Total Saves
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-grid.webp"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/grid · 4:5 Profile Grid Planner"
          camZoom={1.04 + swapP * 0.08}
          camPanY={-swapP * 14}
          rotX={2.4}
          rotY={isVertical ? 0 : -5.5}
          globalFrame={globalFrame}
        />
      </div>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 5 (F948 – F1212, BARS 8–10): PRIORITY CRM + 58 NATIVE MCP TOOLS
   Clean Separate Two-Column Layout — ZERO Overlap Between Inbox & MCP Card!
   ============================================================================ */
const Act5InboxMcpAgent = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.INBOX_MCP.from + frame;

  const runP = tweenSettle(frame, 102, 140, 0, 1);

  const winW = isVertical ? 948 : 996;
  const winH = isVertical ? 760 : 684;
  const winLeft = isVertical ? (width - winW) / 2 : 80;
  const winTop = isVertical ? 760 : 198;

  const rightLeft = isVertical ? 66 : 1140;
  const mcpBtnPos = [rightLeft + (isVertical ? 820 : 610), isVertical ? 500 : 458];

  const cursor = evaluateCursorRig(frame, [
    { at: 24, pos: [winLeft + 620, winTop + 420], kind: "arrow" },
    { at: 94, pos: mcpBtnPos, kind: "pointer", arc: -30 },
    { at: 102, pos: mcpBtnPos, kind: "pointer", press: true, arc: 0 },
    { at: 152, pos: [rightLeft + 260, isVertical ? 660 : 760], kind: "arrow", arc: 18 }
  ]);

  const agentSteps = [
    { at: 36, cmd: "velora.get_priority_crm_leads({ unread: true })", status: "4 VIP Brand Deals" },
    { at: 104, cmd: "velora.apply_smart_4x5_crop({ asset: 'launch' })", status: "1080x1350 Ready" },
    { at: 128, cmd: "velora.deploy_auto_dm({ keyword: 'LINK' })", status: "Active · 58/58 Tools" }
  ];

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} width={width} height={height} />

      {/* Left Column: 100% Clean Unobstructed Unified Inbox Window */}
      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-inbox.webp"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/inbox · Unified Priority Creator CRM"
          camZoom={1.04 + runP * 0.06}
          rotX={2.4}
          rotY={isVertical ? 0 : 5.5}
          globalFrame={globalFrame}
        />
      </div>

      {/* Right Column: Clean Headline + Dedicated Obsidian MCP Stream Card (Zero Collision!) */}
      <div
        style={{
          position: "absolute",
          left: rightLeft,
          top: isVertical ? 104 : 168,
          width: isVertical ? width - 132 : 700,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <SceneTag text={ACTS.INBOX_MCP.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Priority Creator CRM.", "58 Native MCP Tools."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 58 : 54}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 19.5, lineHeight: 1.48, color: TOKENS.inkSecondary }}>
          Manage sponsor DMs in Unified Inbox and drive Velora directly from Claude, Cursor, or Windsurf over Streamable HTTP MCP.
        </div>

        {/* Dedicated Right-Column Obsidian MCP Terminal Card */}
        <div
          style={{
            marginTop: 6,
            padding: "20px 22px",
            borderRadius: 24,
            background: "#0B111E",
            border: "1.5px solid rgba(56, 189, 248, 0.45)",
            boxShadow: "0 28px 64px rgba(15, 23, 42, 0.22)",
            color: "#F8FAFC",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, color: "#93C5FD" }}>
              POST /mcp &middot; CLAUDE / CURSOR STREAM
            </span>
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                background: runP > 0.2 ? "#059669" : "#2563EB",
                fontFamily: TOKENS.fontMono,
                fontSize: 11.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {runP > 0.2 ? <CheckSvg size={13} color="#FFFFFF" /> : null}
              <span>{runP > 0.2 ? "58 TOOLS ACTIVE" : "RUN AGENT"}</span>
            </span>
          </div>

          {agentSteps.map((s) => {
            const p = tweenSettle(frame, s.at, s.at + 20, 0, 1);
            return (
              <div
                key={s.cmd}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "rgba(30, 41, 59, 0.85)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  opacity: p
                }}
              >
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11.5, color: "#E2E8F0" }}>{s.cmd}</span>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700, color: "#34D399", display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckSvg size={11} color="#34D399" />
                  <span>{s.status}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 6 (F1188 – F1452, BARS 10–12): LIVE WITH / WITHOUT DATA LASER SCAN
   ============================================================================ */
const Act6ModesAndTools = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.MODES_TOOLS.from + frame;

  const scanProgress = tweenSettle(frame, 102, 148, 0, 1);

  const winW = isVertical ? 948 : 1048;
  const winH = isVertical ? 800 : 684;
  const winLeft = isVertical ? (width - winW) / 2 : 80;
  const winTop = isVertical ? 690 : 198;

  const toggleX = isVertical ? width * 0.5 + 125 : 1525;
  const toggleY = isVertical ? 545 : 592;

  const cursor = evaluateCursorRig(frame, [
    { at: 24, pos: [toggleX + 160, toggleY + 135], kind: "arrow" },
    { at: 94, pos: [toggleX, toggleY], kind: "pointer", arc: -28 },
    { at: 102, pos: [toggleX, toggleY], kind: "pointer", press: true, arc: 0 },
    { at: 154, pos: [toggleX + 140, toggleY + 120], kind: "arrow", arc: 18 }
  ]);

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-overview.webp"
          secondarySrc="screens/screen-empty.webp"
          secondaryReveal={scanProgress}
          secondaryMode="scan"
          width={winW}
          height={winH}
          urlLabel={
            scanProgress > 0.5
              ? "velora.so/app · Without Data (Clean Meta OAuth Ready)"
              : "velora.so/app · With Data (4 Connected Workspaces)"
          }
          camZoom={1.04 + scanProgress * 0.05}
          rotX={2.4}
          rotY={isVertical ? 0 : 5.5}
          globalFrame={globalFrame}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 1190,
          top: isVertical ? 114 : 214,
          width: isVertical ? width - 132 : 650,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.MODES_TOOLS.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Demo Data or Clean OAuth.", "Switch in one click."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 60 : 56}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Test with 4 richly populated sample creator workspaces — or switch instantly into clean unconnected Meta OAuth mode.
        </div>

        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: 18,
            background: "#CBD5E1",
            display: "inline-flex",
            gap: 8,
            alignSelf: "flex-start"
          }}
        >
          <div
            style={{
              padding: "13px 22px",
              borderRadius: 13,
              background: scanProgress < 0.5 ? "#FFFFFF" : "transparent",
              color: scanProgress < 0.5 ? TOKENS.inkPrimary : "#475569",
              fontFamily: TOKENS.fontDisplay,
              fontWeight: 800,
              fontSize: 15.5
            }}
          >
            With Data (4 Workspaces)
          </div>
          <div
            style={{
              padding: "13px 22px",
              borderRadius: 13,
              background: scanProgress >= 0.5 ? "#2563EB" : "transparent",
              color: scanProgress >= 0.5 ? "#FFFFFF" : "#475569",
              fontFamily: TOKENS.fontDisplay,
              fontWeight: 800,
              fontSize: 15.5,
              boxShadow: scanProgress >= 0.5 ? "0 10px 24px rgba(37,99,235,0.36)" : "none"
            }}
          >
            Without Data (Clean OAuth)
          </div>
        </div>
      </div>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   ACT 7 (F1428 – F1679, BARS 12–14): SYMMETRIC 4-CORNER ORBIT & HERO LOCKUP
   ============================================================================ */
const Act7HeroFinale = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalFrame = ACTS.FINALE.from + frame;
  const pulse = beatPulse(globalFrame);

  const cardEnter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 220 } });

  const innerOrbit = [
    { src: "screens/screen-landing.webp", x: isVertical ? -260 : -610, y: isVertical ? -530 : -250, rot: -6 },
    { src: "screens/screen-overview.webp", x: isVertical ? 260 : 610, y: isVertical ? -530 : -250, rot: 6 },
    { src: "screens/screen-automations-sent.webp", x: isVertical ? -260 : -610, y: isVertical ? 530 : 255, rot: 5 },
    { src: "screens/screen-grid.webp", x: isVertical ? 260 : 610, y: isVertical ? 530 : 255, rot: -5 }
  ];

  const cursor = evaluateCursorRig(frame, [
    { at: 40, pos: [width * 0.72, height * 0.80], kind: "arrow" },
    { at: 102, pos: [width * 0.5 + 175, height * 0.5 + 112], kind: "pointer", press: true, arc: -26 },
    { at: 150, pos: [width * 0.5 + 280, height * 0.5 + 185], kind: "arrow", arc: 14 }
  ]);

  return (
    <AbsoluteFill>
      <DeepStageBackdrop globalFrame={globalFrame} variant="dark" width={width} height={height} />

      {innerOrbit.map((b, idx) => {
        const drift = Math.sin((frame + idx * 24) / 28) * 10;
        const p = tweenSettle(frame, idx * 4, 30 + idx * 4, 0, 1);
        return (
          <div
            key={b.src}
            style={{
              position: "absolute",
              left: width * 0.5 + b.x - 245,
              top: height * 0.5 + b.y + drift - 150,
              width: 490,
              height: 300,
              borderRadius: 22,
              overflow: "hidden",
              border: "1.5px solid rgba(96, 165, 250, 0.36)",
              boxShadow: "0 32px 72px rgba(0, 0, 0, 0.55)",
              opacity: p * 0.52,
              transform: `scale(${(0.82 + p * 0.18) * (1 + pulse * 0.01)}) rotate(${b.rot}deg)`
            }}
          >
            <Img src={staticFile(b.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}

      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: isVertical ? 880 : 940,
            padding: isVertical ? "56px 50px" : "58px 74px",
            borderRadius: 38,
            background: "rgba(9, 15, 28, 0.90)",
            border: "1.5px solid rgba(96, 165, 250, 0.48)",
            boxShadow: `0 48px 120px rgba(0, 0, 0, 0.72), 0 0 ${40 + pulse * 24}px rgba(37, 99, 235, 0.25)`,
            backdropFilter: "blur(22px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 24,
            transform: `scale(${(0.9 + cardEnter * 0.1) * (1 + pulse * 0.006)})`,
            opacity: cardEnter
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <VeloraLogoMark size={56} />
            <span
              style={{
                fontFamily: TOKENS.fontDisplay,
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#FFFFFF"
              }}
            >
              Velora Studio
            </span>
          </div>

          <KineticSplitHeadline
            lines={["Ship Reels that convert.", "Calm, compliant, automatic."]}
            accentLineIndex={0}
            frame={frame}
            startFrame={6}
            fontSize={isVertical ? 58 : 64}
            dark
            align="center"
          />

          <div
            style={{
              padding: "18px 36px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #2563EB 0%, #0284C7 100%)",
              color: "#FFFFFF",
              fontFamily: TOKENS.fontDisplay,
              fontSize: 22,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 20px 50px rgba(37, 99, 235, 0.6)"
            }}
          >
            <span>Explore Live Studio &middot; velora.so</span>
            <ArrowRightSvg size={20} />
          </div>

          <div
            style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#93C5FD"
            }}
          >
            OFFICIAL META GRAPH API &middot; 58 MCP TOOLS &middot; 60 FPS &middot; 120 BPM SYNC
          </div>
        </div>
      </AbsoluteFill>

      <CinemaCursorRig rig={cursor} />
    </AbsoluteFill>
  );
};

/* ============================================================================
   MASTER 28.000s · 60 FPS · 120 BPM BEAT-SYNCED LAUNCH FILM (1,680 FRAMES)
   ============================================================================ */
export const VeloraLaunchFilm = () => {
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{ backgroundColor: "#040710", overflow: "hidden" }}>
      <FontFaces />

      <Audio src={staticFile("audio/music-bed.m4a")} volume={0.68} />

      {AUDIO_CUES.map((cue, idx) => (
        <Sequence key={`${cue.file}-${cue.frame}-${idx}`} from={cue.frame} durationInFrames={90}>
          <Audio src={staticFile(cue.file)} volume={cue.volume} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACTS.HOOK_PORTAL.duration}>
          <Act1EditorialPreviewerHook isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={opticalIrisPortal()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T1_PORTAL })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.SMART_CROP.duration}>
          <Act2SmartCrop isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={velocityWhipPush("left", "#2563EB")}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T2_WHIP_L })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.AUTO_DM.duration}>
          <Act3InstantAutoDm isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={cameraCraneWhip()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T3_CRANE_UP })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.VISUAL_GRID.duration}>
          <Act4VisualGrid isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={velocityWhipPush("right", "#0284C7")}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T4_WHIP_R })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.INBOX_MCP.duration}>
          <Act5InboxMcpAgent isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={cameraCraneWhip()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T5_CRANE_UP_2 })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.MODES_TOOLS.duration}>
          <Act6ModesAndTools isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={diagonalShutterPrism()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T6_PRISM })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.FINALE.duration}>
          <Act7HeroFinale isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
