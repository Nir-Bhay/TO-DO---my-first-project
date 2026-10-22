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
import { FontFaces, TOKENS, VeloraLogoMark, StudioIcon } from "./theme.jsx";
import {
  ACTS,
  AUDIO_CUES,
  EVENTS,
  TRANSITION_DURATIONS,
  beatPulse,
  computeCursorState,
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

const StudioBackdrop = ({ globalFrame, variant = "light", width, height }) => {
  const pulse = beatPulse(globalFrame);
  const orbX = Math.sin(globalFrame / 54) * 56;
  const orbY = Math.cos(globalFrame / 42) * 38;

  if (variant === "dark") {
    return (
      <AbsoluteFill style={{ background: "radial-gradient(125% 110% at 50% 22%, #13203B 0%, #070B14 68%, #04070D 100%)" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            transform: `translate(${(globalFrame * 0.45) % 72}px, ${(globalFrame * 0.3) % 72}px)`,
            maskImage: "radial-gradient(circle at 50% 50%, black 42%, transparent 88%)",
            WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 42%, transparent 88%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            left: width * 0.18 + orbX,
            top: height * 0.14 + orbY,
            width: 580,
            height: 580,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.42), transparent 68%)",
            transform: `scale(${1 + pulse * 0.08})`,
            filter: "blur(24px)"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: width * 0.12 - orbX * 0.7,
            bottom: height * 0.1 - orbY * 0.7,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(56,189,248,0.28), transparent 70%)",
            transform: `scale(${1 + pulse * 0.06})`,
            filter: "blur(26px)"
          }}
        />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: "linear-gradient(155deg, #F8FAFF 0%, #EEF4FF 52%, #F5F8FE 100%)" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(to right, rgba(37,99,235,0.048) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.048) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: `translate(${-(globalFrame * 0.5) % 64}px, ${-(globalFrame * 0.25) % 64}px)`
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -120 + orbX,
          top: -110 + orbY,
          width: 680,
          height: 680,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 68%)",
          transform: `scale(${1 + pulse * 0.06})`
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -130 - orbX * 0.6,
          bottom: -140 - orbY * 0.6,
          width: 640,
          height: 640,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(14,165,233,0.13), transparent 70%)",
          transform: `scale(${1 + pulse * 0.05})`
        }}
      />
    </AbsoluteFill>
  );
};

const SceneTag = ({ text, frame, dark = false }) => {
  const enter = tweenSettle(frame, 0, 18, 0, 1);
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 15px",
        borderRadius: 999,
        background: dark ? "rgba(37, 99, 235, 0.2)" : "rgba(37, 99, 235, 0.09)",
        border: dark ? "1px solid rgba(96, 165, 250, 0.45)" : "1px solid rgba(37, 99, 235, 0.22)",
        fontFamily: TOKENS.fontMono,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.08em",
        color: dark ? "#93C5FD" : "#1D4ED8",
        transform: `translateY(${(1 - enter) * 14}px)`,
        opacity: enter,
        alignSelf: "flex-start"
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
  startFrame = 4,
  fontSize = 62,
  dark = false,
  align = "left"
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: align }}>
    {lines.map((line, i) => {
      const f0 = startFrame + i * 7;
      const p = tweenSettle(frame, f0, f0 + 22, 0, 1);
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
              transform: `translateY(${(1 - p) * 112}%)`,
              opacity: interpolate(p, [0, 0.25, 1], [0, 1, 1]),
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

const StudioWindow3D = ({
  src,
  secondarySrc = null,
  secondaryReveal = 0,
  secondaryMode = "fade",
  width,
  height,
  urlLabel = "velora.so/app",
  camZoom = 1.06,
  camPanX = 0,
  camPanY = 0,
  rotX = 2.5,
  rotY = -5,
  children
}) => (
  <div style={{ width, height, perspective: 1550, position: "relative" }}>
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 24,
        background: "#FFFFFF",
        border: "1.5px solid rgba(15, 23, 42, 0.12)",
        boxShadow:
          "0 36px 84px rgba(15, 23, 42, 0.16), 0 8px 24px rgba(37, 99, 235, 0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        transformStyle: "preserve-3d"
      }}
    >
      <div
        style={{
          height: 42,
          padding: "0 18px",
          background: "linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FCA5A5" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#FCD34D" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#86EFAC" }} />
        </div>
        <div
          style={{
            padding: "4px 16px",
            borderRadius: 999,
            background: "#FFFFFF",
            border: "1px solid #E2E8F0",
            fontFamily: TOKENS.fontMono,
            fontSize: 12,
            fontWeight: 600,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: 7
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981" }} />
          {urlLabel}
        </div>
        <div style={{ fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700, color: "#2563EB" }}>
          LIVE v3.0
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
              width: 4,
              background: "linear-gradient(180deg, #38BDF8, #2563EB, #818CF8)",
              boxShadow: "0 0 26px 5px rgba(37, 99, 235, 0.78)"
            }}
          />
        )}

        {children}
      </div>
    </div>
  </div>
);

const PrecisionCursor = ({ state }) => {
  if (!state || state.opacity <= 0.01) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: state.x,
        top: state.y,
        opacity: state.opacity,
        pointerEvents: "none",
        zIndex: 60
      }}
    >
      {state.ripple !== null && (
        <div
          style={{
            position: "absolute",
            left: -30,
            top: -30,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: "3px solid #2563EB",
            background: "rgba(56, 189, 248, 0.18)",
            transform: `scale(${0.35 + state.ripple * 1.65})`,
            opacity: 1 - state.ripple
          }}
        />
      )}
      <svg
        width="34"
        height="34"
        viewBox="0 0 32 32"
        fill="none"
        style={{
          transform: `scale(${state.scale})`,
          transformOrigin: "4px 4px",
          filter: "drop-shadow(0 8px 16px rgba(15,23,42,0.34))"
        }}
      >
        <path
          d="M4.5 3.5L26.5 14.2L16.4 17.3L12.2 27.2L4.5 3.5Z"
          fill="#0F172A"
          stroke="#FFFFFF"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const Act1HookPortal = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stomp1 = spring({ frame: frame - EVENTS.HOOK_STOMP_1, fps, config: { damping: 15, stiffness: 260, mass: 0.7 } });
  const stomp2 = spring({ frame: frame - EVENTS.HOOK_STOMP_2, fps, config: { damping: 14, stiffness: 270, mass: 0.7 } });
  const strikeP = tweenWhip(frame, 108, 128, 0, 1);
  const pillEnter = spring({ frame: frame - EVENTS.HOOK_PILL_REVEAL, fps, config: { damping: 16, stiffness: 220 } });

  const pressP = tweenWhip(frame, EVENTS.PORTAL_PRESS, EVENTS.PORTAL_PRESS + 8, 0, 1);
  const portalExpand = tweenWhip(frame, EVENTS.PORTAL_PRESS + 8, 250, 0, 1);

  const btnW = isVertical ? 470 : 510;
  const btnH = isVertical ? 88 : 84;
  const btnCenterY = isVertical ? height * 0.67 : height * 0.69;

  const cursor = computeCursorState(frame, {
    start: [width * 0.74, btnCenterY + 190],
    target: [width * 0.5 + btnW * 0.24, btnCenterY + 6],
    rest: [width * 0.84, btnCenterY + 150],
    approachStart: 142,
    pressFrame: EVENTS.PORTAL_PRESS
  });

  const portalW = interpolate(portalExpand, [0, 1], [btnW, width * 1.06]);
  const portalH = interpolate(portalExpand, [0, 1], [btnH, height * 1.06]);
  const portalRadius = interpolate(portalExpand, [0, 0.85, 1], [44, 26, 0]);
  const portalY = interpolate(portalExpand, [0, 1], [btnCenterY, height * 0.5]);

  const headlineFadeOut = 1 - tweenWhip(frame, EVENTS.PORTAL_PRESS + 4, EVENTS.PORTAL_PRESS + 26, 0, 1);

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={frame} variant="dark" width={width} height={height} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isVertical ? "0 64px 210px" : "0 120px 140px",
          opacity: headlineFadeOut,
          transform: `scale(${1 - (1 - headlineFadeOut) * 0.08})`
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <SceneTag text="VELORA STUDIO v3.0 · 60 FPS LAUNCH" frame={frame} dark />
        </div>

        <div
          style={{
            position: "relative",
            fontFamily: TOKENS.fontDisplay,
            fontSize: isVertical ? 76 : 92,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.04,
            color: strikeP > 0.3 ? "#94A3B8" : "#F8FAFC",
            transform: `translateY(${(1 - stomp1) * 58}px) scale(${0.9 + stomp1 * 0.1})`,
            opacity: stomp1,
            textAlign: "center"
          }}
        >
          Cropped covers.
          <div
            style={{
              position: "absolute",
              left: "-3%",
              top: "53%",
              height: 7,
              width: `${strikeP * 106}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, #F43F5E, #FB7185)",
              boxShadow: "0 0 24px rgba(244,63,94,0.8)"
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            fontFamily: TOKENS.fontDisplay,
            fontSize: isVertical ? 76 : 92,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.06,
            color: strikeP > 0.45 ? "#94A3B8" : "#E2E8F0",
            transform: `translateY(${(1 - stomp2) * 58}px) scale(${0.9 + stomp2 * 0.1})`,
            opacity: stomp2,
            marginTop: 8,
            textAlign: "center"
          }}
        >
          Missed DMs.
          <div
            style={{
              position: "absolute",
              left: "-3%",
              top: "53%",
              height: 7,
              width: `${Math.max(0, (strikeP - 0.15) / 0.85) * 106}%`,
              borderRadius: 99,
              background: "linear-gradient(90deg, #38BDF8, #2563EB)",
              boxShadow: "0 0 24px rgba(56,189,248,0.85)"
            }}
          />
        </div>

        <div
          style={{
            marginTop: 28,
            fontFamily: TOKENS.fontSans,
            fontSize: isVertical ? 26 : 27,
            fontWeight: 600,
            color: "#CBD5E1",
            opacity: pillEnter,
            transform: `translateY(${(1 - pillEnter) * 24}px)`,
            textAlign: "center"
          }}
        >
          Meet the calm creator studio built for <strong style={{ color: "#60A5FA" }}>Official Meta speed</strong>.
        </div>
      </div>

      {pillEnter > 0.02 && (
        <div
          style={{
            position: "absolute",
            left: width * 0.5 - portalW / 2,
            top: portalY - portalH / 2,
            width: portalW,
            height: portalH,
            borderRadius: portalRadius,
            overflow: "hidden",
            transform: `scale(${(0.84 + pillEnter * 0.16) * (1 - pressP * 0.04 + portalExpand * 0.04)})`,
            boxShadow:
              portalExpand > 0.05
                ? "0 30px 110px rgba(37,99,235,0.65), 0 0 0 3px rgba(56,189,248,0.75)"
                : "0 22px 54px rgba(37,99,235,0.5), inset 0 1px 1px rgba(255,255,255,0.45)",
            background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 55%, #0284C7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {portalExpand > 0.02 && (
            <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, portalExpand * 1.45), background: "#F8FAFC" }}>
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
              gap: 16,
              opacity: 1 - Math.min(1, portalExpand * 3.2),
              color: "#FFFFFF",
              fontFamily: TOKENS.fontDisplay,
              fontSize: 25,
              fontWeight: 800,
              letterSpacing: "-0.02em"
            }}
          >
            <VeloraLogoMark size={40} />
            <span>Enter Live Studio</span>
            <ArrowRightSvg size={22} />
          </div>
        </div>
      )}

      <PrecisionCursor state={cursor} />
    </AbsoluteFill>
  );
};

const Act2SmartCrop = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.SMART_CROP.from + frame;

  const snapP = tweenSettle(frame, EVENTS.CROP_PRESS_LOCAL, EVENTS.CROP_PRESS_LOCAL + 28, 0, 1);
  const camZoom = interpolate(frame, [0, ACTS.SMART_CROP.duration], [1.02, 1.13]);
  const camPanX = interpolate(frame, [0, ACTS.SMART_CROP.duration], [10, -28]);
  const camPanY = interpolate(frame, [0, ACTS.SMART_CROP.duration], [8, -22]);
  const rotY = interpolate(frame, [0, ACTS.SMART_CROP.duration], [-7.5, -2.5]);

  const winW = isVertical ? 948 : 1060;
  const winH = isVertical ? 820 : 680;
  const winLeft = isVertical ? (width - winW) / 2 : 776;
  const winTop = isVertical ? 650 : 200;

  const btnX = winLeft + (isVertical ? 280 : 320);
  const btnY = winTop + (isVertical ? 560 : 495);

  const cursor = computeCursorState(frame, {
    start: [winLeft + winW - 90, winTop + 150],
    target: [btnX + 118, btnY + 26],
    rest: [btnX + 310, btnY + 108],
    approachStart: 36,
    pressFrame: EVENTS.CROP_PRESS_LOCAL
  });

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 88,
          top: isVertical ? 118 : 228,
          width: isVertical ? width - 132 : 620,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.SMART_CROP.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Auto-fit 4:5 covers.", "Zero edge clipping."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 66 : 62}
        />
        <div
          style={{
            fontFamily: TOKENS.fontSans,
            fontSize: 22,
            lineHeight: 1.5,
            color: TOKENS.inkSecondary,
            opacity: tweenSettle(frame, 16, 40, 0, 1)
          }}
        >
          Smart Safe-Pad frames full 16:9 screenshots inside Instagram&rsquo;s{" "}
          <strong style={{ color: TOKENS.inkPrimary }}>1080&times;1350</strong> feed ratio in one click.
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 6,
            opacity: tweenSettle(frame, 24, 48, 0, 1)
          }}
        >
          <div
            style={{
              padding: "11px 18px",
              borderRadius: 14,
              background: snapP > 0.5 ? "#ECFDF5" : "#FFF1F2",
              border: `1.5px solid ${snapP > 0.5 ? "#10B981" : "#FDA4AF"}`,
              fontFamily: TOKENS.fontMono,
              fontSize: 15,
              fontWeight: 700,
              color: snapP > 0.5 ? "#047857" : "#BE123C",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            {snapP > 0.5 ? <CheckSvg size={16} color="#059669" /> : null}
            {snapP > 0.5 ? "1080x1350 SAFE FIT LOCKED" : "RAW 1920x1080 CLIPPED"}
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-create.webp"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/create · Smart 4:5 Studio"
          camZoom={camZoom}
          camPanX={camPanX}
          camPanY={camPanY}
          rotX={isVertical ? 2 : 2.2}
          rotY={isVertical ? 0 : rotY}
        >
          <div
            style={{
              position: "absolute",
              right: 26,
              top: 24,
              width: isVertical ? 360 : 372,
              borderRadius: 22,
              background: "rgba(255, 255, 255, 0.96)",
              border: "1.5px solid #DBEAFE",
              boxShadow: "0 24px 56px rgba(15, 23, 42, 0.18)",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: TOKENS.fontDisplay, fontWeight: 800, fontSize: 15, color: TOKENS.inkPrimary }}>
                4:5 Feed Safe Inspector
              </span>
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 999,
                  fontFamily: TOKENS.fontMono,
                  fontSize: 11,
                  fontWeight: 700,
                  background: snapP > 0.5 ? "#DCFCE7" : "#FEE2E2",
                  color: snapP > 0.5 ? "#15803D" : "#B91C1C"
                }}
              >
                {snapP > 0.5 ? "SAFE 4:5" : "CLIPPING"}
              </span>
            </div>

            <div
              style={{
                height: 290,
                borderRadius: 16,
                background: snapP > 0.2 ? "linear-gradient(160deg, #EFF6FF, #E0F2FE)" : "#0F172A",
                position: "relative",
                overflow: "hidden",
                border: `2px dashed ${snapP > 0.5 ? "#10B981" : "#F43F5E"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Img
                src={staticFile("screens/screen-overview.webp")}
                style={{
                  width: snapP > 0 ? `${142 - snapP * 48}%` : "142%",
                  borderRadius: 10,
                  boxShadow: "0 14px 32px rgba(15,23,42,0.18)"
                }}
              />
            </div>

            <div
              style={{
                height: 48,
                borderRadius: 13,
                background: snapP > 0.4 ? "#059669" : "#2563EB",
                color: "#FFFFFF",
                fontFamily: TOKENS.fontDisplay,
                fontWeight: 700,
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 10px 24px rgba(37, 99, 235, 0.28)"
              }}
            >
              <StudioIcon name="crop" size={16} color="#FFFFFF" />
              {snapP > 0.4 ? "4:5 Safe Canvas Applied" : "Apply 4:5 Safe Fit"}
            </div>
          </div>
        </StudioWindow3D>
      </div>

      <PrecisionCursor state={cursor} />
    </AbsoluteFill>
  );
};

const Act3InstantAutoDm = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalFrame = ACTS.AUTO_DM.from + frame;

  const commentEnter = spring({ frame: frame - 10, fps, config: { damping: 15, stiffness: 230 } });
  const dmSentReveal = tweenSettle(frame, EVENTS.DM_FIRE_LOCAL - 12, EVENTS.DM_FIRE_LOCAL + 18, 0, 1);
  const ctrProgress = tweenSettle(frame, EVENTS.DM_FIRE_LOCAL, EVENTS.DM_FIRE_LOCAL + 54, 0, 1);
  const ctrVal = (ctrProgress * 76.1).toFixed(1);

  const camZoom = interpolate(frame, [0, ACTS.AUTO_DM.duration], [1.03, 1.12]);
  const camPanX = interpolate(frame, [0, ACTS.AUTO_DM.duration], [-16, 18]);

  const winW = isVertical ? 948 : 1030;
  const winH = isVertical ? 790 : 676;
  const winLeft = isVertical ? (width - winW) / 2 : 84;
  const winTop = isVertical ? 690 : 202;

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-automations.webp"
          secondarySrc="screens/screen-automations-sent.webp"
          secondaryReveal={dmSentReveal}
          secondaryMode="fade"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/automations · Official Messenger API"
          camZoom={camZoom}
          camPanX={camPanX}
          rotX={2.2}
          rotY={isVertical ? 0 : 5.5}
        >
          <div
            style={{
              position: "absolute",
              left: 24,
              bottom: 24,
              padding: "14px 20px",
              borderRadius: 18,
              background: "rgba(15, 23, 42, 0.92)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `translateY(${(1 - commentEnter) * 40}px)`,
              opacity: commentEnter,
              boxShadow: "0 20px 44px rgba(15,23,42,0.3)"
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #38BDF8, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: TOKENS.fontDisplay,
                fontWeight: 800,
                fontSize: 15
              }}
            >
              AK
            </div>
            <div>
              <div style={{ fontFamily: TOKENS.fontSans, fontSize: 13, color: "#94A3B8" }}>
                @arjun.codes commented 0.8s ago
              </div>
              <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 16, fontWeight: 700 }}>
                &ldquo;LINK please! Need this setup&rdquo;
              </div>
            </div>
            <span
              style={{
                padding: "5px 11px",
                borderRadius: 999,
                background: dmSentReveal > 0.4 ? "#10B981" : "#2563EB",
                fontFamily: TOKENS.fontMono,
                fontSize: 12,
                fontWeight: 700
              }}
            >
              {dmSentReveal > 0.4 ? "DM SENT · 0.8s" : "KEYWORD MATCH"}
            </span>
          </div>
        </StudioWindow3D>
      </div>

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 1168,
          top: isVertical ? 116 : 214,
          width: isVertical ? width - 132 : 668,
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
          fontSize={isVertical ? 66 : 62}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          100% compliant Official Meta Graph &amp; Messenger API triggers with button cards, follow gates, and live click tracking.
        </div>

        <div
          style={{
            marginTop: 8,
            padding: "20px 26px",
            borderRadius: 22,
            background: "#FFFFFF",
            border: "1.5px solid #DBEAFE",
            boxShadow: "0 18px 42px rgba(37, 99, 235, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: tweenSettle(frame, 30, 56, 0, 1)
          }}
        >
          <div>
            <div style={{ fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, color: "#2563EB" }}>
              VERIFIED CAMPAIGN CLICK-THROUGH
            </div>
            <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 48, fontWeight: 800, color: TOKENS.inkPrimary }}>
              {ctrVal}% CTR
            </div>
          </div>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 14,
              background: "#ECFDF5",
              color: "#047857",
              fontFamily: TOKENS.fontMono,
              fontSize: 14,
              fontWeight: 700
            }}
          >
            99.8% DELIVERED
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Act4VisualGrid = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.VISUAL_GRID.from + frame;

  const swapP = tweenSettle(frame, EVENTS.GRID_LIFT_LOCAL, EVENTS.GRID_LOCK_LOCAL, 0, 1);
  const liftArc = Math.sin(swapP * Math.PI);

  const camZoom = interpolate(frame, [0, ACTS.VISUAL_GRID.duration], [1.03, 1.11]);
  const camPanY = interpolate(frame, [0, ACTS.VISUAL_GRID.duration], [14, -20]);

  const winW = isVertical ? 948 : 1050;
  const winH = isVertical ? 810 : 680;
  const winLeft = isVertical ? (width - winW) / 2 : 786;
  const winTop = isVertical ? 660 : 200;

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 88,
          top: isVertical ? 118 : 230,
          width: isVertical ? width - 132 : 636,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.VISUAL_GRID.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Plan your 4:5 grid", "before publishing."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 64 : 60}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 22, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Drag scheduled Reels across true <strong style={{ color: TOKENS.inkPrimary }}>4:5, 3:4 &amp; 1:1</strong> ratios while checking live Views, Saves, and colour harmony.
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
          {["4:5 Default Feed", "Drag Reorder", "Live Saves Telemetry"].map((chip, idx) => (
            <div
              key={chip}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                fontFamily: TOKENS.fontSans,
                fontSize: 14,
                fontWeight: 700,
                color: TOKENS.inkPrimary,
                opacity: tweenSettle(frame, 18 + idx * 8, 38 + idx * 8, 0, 1)
              }}
            >
              {chip}
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-grid.webp"
          width={winW}
          height={winH}
          urlLabel="velora.so/app/grid · Visual Profile Planner"
          camZoom={camZoom}
          camPanY={camPanY}
          rotX={2.4}
          rotY={isVertical ? 0 : -5.5}
        >
          <div
            style={{
              position: "absolute",
              right: 26,
              bottom: 24,
              width: 392,
              padding: 18,
              borderRadius: 22,
              background: "rgba(255,255,255,0.96)",
              border: "1.5px solid #DBEAFE",
              boxShadow: "0 24px 54px rgba(15,23,42,0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: TOKENS.fontDisplay, fontWeight: 800, fontSize: 14, color: TOKENS.inkPrimary }}>
                4:5 Scheduled Slot Swap
              </span>
              <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12, fontWeight: 700, color: swapP > 0.85 ? "#059669" : "#2563EB" }}>
                {swapP > 0.85 ? "GRID HARMONY 99%" : "DRAGGING SLOT #1 <-> #2"}
              </span>
            </div>

            <div style={{ position: "relative", height: 205 }}>
              <div
                style={{
                  position: "absolute",
                  left: swapP * 184,
                  top: -liftArc * 16,
                  width: 172,
                  height: 202,
                  borderRadius: 16,
                  background: "linear-gradient(155deg, #1E3A8A 0%, #2563EB 55%, #38BDF8 100%)",
                  color: "#FFFFFF",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transform: `scale(${1 + liftArc * 0.07}) rotate(${liftArc * -3.5}deg)`,
                  boxShadow: `0 ${14 + liftArc * 22}px 38px rgba(37,99,235,0.34)`,
                  zIndex: 4
                }}
              >
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, fontWeight: 700 }}>PINNED · THU 18:30</span>
                <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 18, fontWeight: 800, lineHeight: 1.2 }}>
                  v3.0 Launch Reel
                </div>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12 }}>148.4K Est. Reach</span>
              </div>

              <div
                style={{
                  position: "absolute",
                  left: (1 - swapP) * 184,
                  top: liftArc * 8,
                  width: 172,
                  height: 202,
                  borderRadius: 16,
                  background: "linear-gradient(155deg, #0F172A 0%, #1E293B 100%)",
                  color: "#F8FAFC",
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transform: `scale(${1 - liftArc * 0.04})`,
                  zIndex: 2
                }}
              >
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 11, color: "#93C5FD" }}>SLOT #2 · CAROUSEL</span>
                <div style={{ fontFamily: TOKENS.fontDisplay, fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                  58 MCP Agent Tools
                </div>
                <span style={{ fontFamily: TOKENS.fontMono, fontSize: 12, color: "#38BDF8" }}>9.4K Saves</span>
              </div>
            </div>
          </div>
        </StudioWindow3D>
      </div>
    </AbsoluteFill>
  );
};

const Act5InboxMcpModes = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const globalFrame = ACTS.INBOX_MCP.from + frame;

  const scanProgress = tweenSettle(frame, EVENTS.MODE_PRESS_LOCAL, EVENTS.MODE_PRESS_LOCAL + 42, 0, 1);
  const camZoom = interpolate(frame, [0, ACTS.INBOX_MCP.duration], [1.03, 1.1]);

  const winW = isVertical ? 948 : 1040;
  const winH = isVertical ? 800 : 676;
  const winLeft = isVertical ? (width - winW) / 2 : 84;
  const winTop = isVertical ? 675 : 202;

  const toggleX = isVertical ? width * 0.5 + 115 : 1495;
  const toggleY = isVertical ? 565 : 642;

  const cursor = computeCursorState(frame, {
    start: [toggleX + 180, toggleY + 135],
    target: [toggleX, toggleY],
    rest: [toggleX + 165, toggleY + 95],
    approachStart: 28,
    pressFrame: EVENTS.MODE_PRESS_LOCAL
  });

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={globalFrame} width={width} height={height} />

      <div style={{ position: "absolute", left: winLeft, top: winTop }}>
        <StudioWindow3D
          src="screens/screen-inbox.webp"
          secondarySrc="screens/screen-empty.webp"
          secondaryReveal={scanProgress}
          secondaryMode="scan"
          width={winW}
          height={winH}
          urlLabel={
            scanProgress > 0.5
              ? "velora.so/app · Without Data (Clean Meta OAuth)"
              : "velora.so/app/inbox · Priority CRM & 58 MCP Tools"
          }
          camZoom={camZoom}
          rotX={2.2}
          rotY={isVertical ? 0 : 5}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: isVertical ? 66 : 1170,
          top: isVertical ? 114 : 216,
          width: isVertical ? width - 132 : 666,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <SceneTag text={ACTS.INBOX_MCP.label} frame={frame} />
        <KineticSplitHeadline
          lines={["Priority CRM + 58 MCP.", "Instant Data Toggle."]}
          accentLineIndex={1}
          frame={frame}
          fontSize={isVertical ? 62 : 58}
        />
        <div style={{ fontFamily: TOKENS.fontSans, fontSize: 21, lineHeight: 1.5, color: TOKENS.inkSecondary }}>
          Connect Claude or Cursor over Streamable HTTP MCP — and flip live between populated workspaces and clean OAuth zero-state.
        </div>

        <div
          style={{
            marginTop: 8,
            padding: 8,
            borderRadius: 18,
            background: "#E2E8F0",
            display: "inline-flex",
            gap: 8,
            alignSelf: "flex-start",
            boxShadow: "inset 0 2px 6px rgba(15,23,42,0.08)"
          }}
        >
          <div
            style={{
              padding: "13px 24px",
              borderRadius: 13,
              background: scanProgress < 0.5 ? "#FFFFFF" : "transparent",
              color: scanProgress < 0.5 ? TOKENS.inkPrimary : TOKENS.inkSecondary,
              fontFamily: TOKENS.fontDisplay,
              fontWeight: 800,
              fontSize: 16,
              boxShadow: scanProgress < 0.5 ? "0 6px 18px rgba(15,23,42,0.1)" : "none"
            }}
          >
            With Data (4 Workspaces)
          </div>
          <div
            style={{
              padding: "13px 24px",
              borderRadius: 13,
              background: scanProgress >= 0.5 ? "#2563EB" : "transparent",
              color: scanProgress >= 0.5 ? "#FFFFFF" : TOKENS.inkSecondary,
              fontFamily: TOKENS.fontDisplay,
              fontWeight: 800,
              fontSize: 16,
              boxShadow: scanProgress >= 0.5 ? "0 8px 22px rgba(37,99,235,0.34)" : "none"
            }}
          >
            Without Data (Clean OAuth)
          </div>
        </div>
      </div>

      <PrecisionCursor state={cursor} />
    </AbsoluteFill>
  );
};

const Act6HeroFinale = ({ isVertical, width, height }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const globalFrame = ACTS.FINALE.from + frame;

  const cardEnter = spring({ frame: frame - 8, fps, config: { damping: 16, stiffness: 210 } });

  const bentoScreens = [
    { src: "screens/screen-landing.webp", x: isVertical ? -250 : -590, y: isVertical ? -520 : -250, rot: -6 },
    { src: "screens/screen-overview.webp", x: isVertical ? 250 : 590, y: isVertical ? -520 : -250, rot: 6 },
    { src: "screens/screen-automations-sent.webp", x: isVertical ? -250 : -590, y: isVertical ? 520 : 255, rot: 5 },
    { src: "screens/screen-grid.webp", x: isVertical ? 250 : 590, y: isVertical ? 520 : 255, rot: -5 }
  ];

  return (
    <AbsoluteFill>
      <StudioBackdrop globalFrame={globalFrame} variant="dark" width={width} height={height} />

      {bentoScreens.map((b, idx) => {
        const drift = Math.sin((frame + idx * 24) / 28) * 10;
        const p = tweenSettle(frame, idx * 4, 34 + idx * 4, 0, 1);
        return (
          <div
            key={b.src}
            style={{
              position: "absolute",
              left: width * 0.5 + b.x - 245,
              top: height * 0.5 + b.y + drift - 150,
              width: 490,
              height: 300,
              borderRadius: 20,
              overflow: "hidden",
              border: "1.5px solid rgba(148, 163, 184, 0.28)",
              boxShadow: "0 28px 64px rgba(0, 0, 0, 0.45)",
              opacity: p * 0.46,
              transform: `scale(${0.82 + p * 0.18}) rotate(${b.rot}deg)`
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
            padding: isVertical ? "58px 52px" : "60px 76px",
            borderRadius: 36,
            background: "rgba(11, 17, 30, 0.84)",
            border: "1.5px solid rgba(96, 165, 250, 0.38)",
            boxShadow: "0 40px 110px rgba(0, 0, 0, 0.62), inset 0 1px 0 rgba(255,255,255,0.16)",
            backdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 24,
            transform: `scale(${0.9 + cardEnter * 0.1})`,
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

          <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 8 }}>
            <div
              style={{
                padding: "18px 34px",
                borderRadius: 999,
                background: "linear-gradient(135deg, #2563EB 0%, #0284C7 100%)",
                color: "#FFFFFF",
                fontFamily: TOKENS.fontDisplay,
                fontSize: 22,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 18px 46px rgba(37, 99, 235, 0.55)"
              }}
            >
              <span>Explore Live Studio · velora.so</span>
              <ArrowRightSvg size={20} />
            </div>
          </div>

          <div
            style={{
              fontFamily: TOKENS.fontMono,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#93C5FD"
            }}
          >
            OFFICIAL META GRAPH API · 58 MCP TOOLS · 60 FPS PRODUCTION BUILD
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const VeloraLaunchFilm = () => {
  const { width, height } = useVideoConfig();
  const isVertical = height > width;

  return (
    <AbsoluteFill style={{ backgroundColor: "#04070D", overflow: "hidden" }}>
      <FontFaces />

      <Audio src={staticFile("audio/music-bed.m4a")} volume={0.62} />

      {AUDIO_CUES.map((cue, idx) => (
        <Sequence key={`${cue.file}-${cue.frame}-${idx}`} from={cue.frame} durationInFrames={90}>
          <Audio src={staticFile(cue.file)} volume={cue.volume} />
        </Sequence>
      ))}

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={ACTS.HOOK_PORTAL.duration}>
          <Act1HookPortal isVertical={isVertical} width={width} height={height} />
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
          <Act5InboxMcpModes isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={diagonalShutterPrism()}
          timing={linearTiming({ durationInFrames: TRANSITION_DURATIONS.T5_PRISM })}
        />

        <TransitionSeries.Sequence durationInFrames={ACTS.FINALE.duration}>
          <Act6HeroFinale isVertical={isVertical} width={width} height={height} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
