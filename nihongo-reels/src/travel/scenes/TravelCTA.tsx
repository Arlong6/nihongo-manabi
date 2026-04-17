import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";

export const TravelCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ transform: `scale(${scale})`, background: travelTheme.accent, color: "#fff", fontFamily: travelTheme.fontZh, fontSize: 84, fontWeight: 900, padding: "30px 64px", borderRadius: 32, boxShadow: "0 12px 40px rgba(255,138,61,0.4)" }}>
        存去旅遊用 ✈️
      </div>
      <div style={{ color: travelTheme.text, fontFamily: travelTheme.fontZh, fontSize: 48, fontWeight: 700 }}>
        每天一句去日本就會用
      </div>
    </AbsoluteFill>
  );
};
