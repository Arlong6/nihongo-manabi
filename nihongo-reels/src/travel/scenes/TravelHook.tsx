import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";
import type { TravelPhrase } from "../data";

export const TravelHook: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const titleOpacity = interpolate(frame, [12, 30], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [28, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ transform: `scale(${iconScale})`, fontSize: 360 }}>
        {p.emoji}
      </div>
      <div style={{ opacity: titleOpacity, color: travelTheme.text, fontFamily: travelTheme.fontZh, fontSize: 72, fontWeight: 900, textAlign: "center" }}>
        去日本旅遊
      </div>
      <div style={{ opacity: tagOpacity, background: travelTheme.accent, color: "#fff", fontFamily: travelTheme.fontZh, fontSize: 56, fontWeight: 900, padding: "16px 48px", borderRadius: 999, letterSpacing: 4 }}>
        {p.situation}
      </div>
      <div style={{ opacity: tagOpacity, color: travelTheme.muted, fontFamily: travelTheme.fontZh, fontSize: 42, fontWeight: 600, marginTop: 10 }}>
        這句你一定會用到 ↓
      </div>
    </AbsoluteFill>
  );
};
