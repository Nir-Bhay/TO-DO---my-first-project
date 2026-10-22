import React from "react";
import { staticFile } from "remotion";

export const TOKENS = {
  bgCanvas: "#F6F9FE",
  inkPrimary: "#0B111E",
  inkSecondary: "#475569",
  inkMuted: "#64748B",
  borderSubtle: "#E2E8F0",
  brandPrimary: "#2563EB",
  fontDisplay: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
  fontSans: "'Inter', -apple-system, sans-serif",
  fontMono: "'JetBrains Mono', monospace"
};

export const FontFaces = () => {
  const css = `
    @font-face {
      font-family: 'Plus Jakarta Sans';
      src: url('${staticFile("fonts/plus-jakarta-sans-var.woff2")}') format('woff2');
      font-weight: 400 800;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'Inter';
      src: url('${staticFile("fonts/inter-var.woff2")}') format('woff2');
      font-weight: 400 800;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: 'JetBrains Mono';
      src: url('${staticFile("fonts/jetbrains-mono-var.woff2")}') format('woff2');
      font-weight: 400 700;
      font-style: normal;
      font-display: block;
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
};

export const VeloraLogoMark = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" style={{ flexShrink: 0 }}>
    <rect width="36" height="36" rx="10" fill="#0B111E" />
    <path
      d="M11.2 11.5L18 24.8L24.8 11.5"
      stroke="#FFFFFF"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24.8" cy="11.5" r="2.3" fill="#38BDF8" />
  </svg>
);

export const StudioIcon = ({ name, size = 20, color = "currentColor", strokeWidth = 2.2 }) => {
  if (name === "check") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }
  if (name === "crop") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2v14a2 2 0 0 0 2 2h14" />
        <path d="M18 22V8a2 2 0 0 0-2-2H2" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
};
