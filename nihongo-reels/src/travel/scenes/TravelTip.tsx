import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";
import type { TravelPhrase } from "../data";

export const TravelTip: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${cardScale})`, background: travelTheme.paper, borderRadius: 36, padding: 60, maxWidth: 920, border: `4px solid ${travelTheme.accent}`, display: "flex", flexDirection: "column", gap: 30, boxShadow: "0 16px 48px rgba(255,138,61,0.25)" }}>
        <div style={{ color: travelTheme.accent, fontFamily: travelTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>
          💡 旅行小撇步
        </div>
        <div style={{ opacity: textOpacity, color: travelTheme.text, fontFamily: travelTheme.fontZh, fontSize: 52, fontWeight: 700, lineHeight: 1.55 }}>
          {p.tip}
        </div>
      </div>
    </AbsoluteFill>
  );
};
