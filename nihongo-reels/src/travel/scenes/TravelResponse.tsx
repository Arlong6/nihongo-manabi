import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";
import type { TravelPhrase } from "../data";

export const TravelResponse: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const replyOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const zhOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <Audio src={staticFile(`travel/${p.id}/response.mp3`)} volume={2.5} />
      <div style={{ transform: `scale(${iconScale})`, background: travelTheme.accent2, color: "#fff", fontFamily: travelTheme.fontZh, fontSize: 48, fontWeight: 900, padding: "14px 40px", borderRadius: 999, letterSpacing: 4 }}>
        🗣️ 對方可能回你
      </div>
      <div style={{ opacity: replyOpacity, color: travelTheme.text, fontFamily: travelTheme.fontJa, fontSize: 78, fontWeight: 800, textAlign: "center", lineHeight: 1.45, maxWidth: 960, background: travelTheme.paper, padding: 40, borderRadius: 28, borderLeft: `12px solid ${travelTheme.accent2}` }}>
        {p.response.ja}
      </div>
      <div style={{ opacity: replyOpacity, color: travelTheme.muted, fontFamily: travelTheme.fontJa, fontSize: 46, letterSpacing: 4 }}>
        {p.response.reading}
      </div>
      <div style={{ opacity: zhOpacity, color: travelTheme.accent, fontFamily: travelTheme.fontZh, fontSize: 56, fontWeight: 800, textAlign: "center", maxWidth: 900 }}>
        → {p.response.zh}
      </div>
    </AbsoluteFill>
  );
};
