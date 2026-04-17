import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const saveScale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const appOpacity = interpolate(frame, [30, 60], [0, 1], { extrapolateRight: "clamp" });
  const appY = interpolate(frame, [30, 60], [40, 0], { extrapolateRight: "clamp" });
  const wiggle = Math.sin(frame / 5) * 4;

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
        gap: 80,
      }}
    >
      <Audio src={staticFile("audio/cta.mp3")} />
      <div
        style={{
          transform: `scale(${saveScale}) rotate(${wiggle}deg)`,
          background: theme.accent,
          color: theme.text,
          fontFamily: theme.fontZh,
          fontSize: 96,
          fontWeight: 900,
          padding: "40px 80px",
          borderRadius: 40,
          boxShadow: "0 12px 48px rgba(233,69,96,0.5)",
        }}
      >
        收藏這則 📌
      </div>

      <div
        style={{
          opacity: appOpacity,
          transform: `translateY(${appY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            color: theme.muted,
            fontFamily: theme.fontZh,
            fontSize: 44,
            letterSpacing: 2,
          }}
        >
          App Store 搜尋
        </div>
        <div
          style={{
            color: theme.text,
            fontFamily: theme.fontZh,
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          Nihongo Manabi
        </div>
        <div
          style={{
            color: theme.accent2,
            fontFamily: theme.fontZh,
            fontSize: 38,
            marginTop: 20,
          }}
        >
          每天一字 · 輕鬆學日文
        </div>
      </div>
    </AbsoluteFill>
  );
};
