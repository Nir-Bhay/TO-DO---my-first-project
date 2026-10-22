import React from "react";
import { AbsoluteFill, interpolate } from "remotion";

const OpticalIrisPortalComponent = ({
  children,
  presentationDirection,
  presentationProgress
}) => {
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    const scale = interpolate(p, [0, 1], [1, 1.14]);
    const blur = interpolate(p, [0, 0.7, 1], [0, 6, 10]);
    const opacity = interpolate(p, [0, 0.75, 1], [1, 0.85, 0]);
    return (
      <AbsoluteFill style={{ transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity }}>
        {children}
      </AbsoluteFill>
    );
  }

  const radiusPct = interpolate(p, [0, 1], [8, 118]);
  const innerScale = interpolate(p, [0, 1], [1.06, 1]);
  const ringOpacity = interpolate(p, [0, 0.35, 0.9, 1], [0.95, 1, 0.45, 0]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `circle(${radiusPct}% at 50% 50%)`, transform: `scale(${innerScale})` }}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: ringOpacity
        }}
      >
        <div
          style={{
            width: `${radiusPct * 2}%`,
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            border: "5px solid rgba(56, 189, 248, 0.92)",
            boxShadow: "0 0 48px rgba(37, 99, 235, 0.65), inset 0 0 28px rgba(56, 189, 248, 0.45)"
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export function opticalIrisPortal() {
  return { component: OpticalIrisPortalComponent, props: {} };
}

const VelocityWhipPushComponent = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const p = presentationProgress;
  const dir = passedProps?.direction || "left";
  const accent = passedProps?.accent || "#2563EB";
  const blur = interpolate(p, [0, 0.5, 1], [0, 8.5, 0]);

  if (presentationDirection === "exiting") {
    const shift = dir === "left" ? -p * 26 : p * 26;
    const scale = interpolate(p, [0, 1], [1, 0.91]);
    const bright = interpolate(p, [0, 1], [1, 0.56]);
    return (
      <AbsoluteFill
        style={{
          transform: `translateX(${shift}%) scale(${scale})`,
          filter: `brightness(${bright}) blur(${blur}px)`
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const fromX = dir === "left" ? (1 - p) * 100 : -(1 - p) * 100;
  const edgeGlow = interpolate(p, [0, 0.45, 1], [0.95, 1, 0]);

  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${fromX}%)`,
        filter: `blur(${blur * 0.75}px)`,
        boxShadow: dir === "left" ? "-24px 0 64px rgba(15, 23, 42, 0.35)" : "24px 0 64px rgba(15, 23, 42, 0.35)"
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          [dir === "left" ? "left" : "right"]: 0,
          width: 7,
          opacity: edgeGlow,
          background: `linear-gradient(180deg, #38BDF8, ${accent}, #A855F7)`,
          boxShadow: `0 0 32px ${accent}`
        }}
      />
    </AbsoluteFill>
  );
};

export function velocityWhipPush(direction = "left", accent = "#2563EB") {
  return { component: VelocityWhipPushComponent, props: { direction, accent } };
}

const CameraCraneWhipComponent = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;
  const blur = interpolate(p, [0, 0.5, 1], [0, 8, 0]);

  if (presentationDirection === "exiting") {
    const y = -p * 34;
    const scale = interpolate(p, [0, 1], [1, 0.9]);
    const bright = interpolate(p, [0, 1], [1, 0.58]);
    return (
      <AbsoluteFill
        style={{
          transform: `translateY(${y}%) scale(${scale})`,
          filter: `brightness(${bright}) blur(${blur}px)`
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        transform: `translateY(${(1 - p) * 100}%)`,
        filter: `blur(${blur * 0.7}px)`,
        boxShadow: "0 -28px 68px rgba(15, 23, 42, 0.32)"
      }}
    >
      {children}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          opacity: interpolate(p, [0, 0.5, 1], [1, 1, 0]),
          background: "linear-gradient(90deg, #38BDF8, #2563EB, #818CF8)"
        }}
      />
    </AbsoluteFill>
  );
};

export function cameraCraneWhip() {
  return { component: CameraCraneWhipComponent, props: {} };
}

const DiagonalShutterPrismComponent = ({ children, presentationDirection, presentationProgress }) => {
  const p = presentationProgress;

  if (presentationDirection === "exiting") {
    const scale = interpolate(p, [0, 1], [1, 0.94]);
    const blur = interpolate(p, [0, 0.6, 1], [0, 6, 8]);
    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          filter: `brightness(${interpolate(p, [0, 1], [1, 0.5])}) blur(${blur}px)`
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const sweep = interpolate(p, [0, 1], [-28, 128]);
  const leadA = Math.min(140, Math.max(-20, sweep + 14));
  const leadB = Math.min(140, Math.max(-20, sweep - 14));

  return (
    <AbsoluteFill style={{ clipPath: `polygon(0% 0%, ${leadA}% 0%, ${leadB}% 100%, 0% 100%)` }}>
      {children}
    </AbsoluteFill>
  );
};

export function diagonalShutterPrism() {
  return { component: DiagonalShutterPrismComponent, props: {} };
}
