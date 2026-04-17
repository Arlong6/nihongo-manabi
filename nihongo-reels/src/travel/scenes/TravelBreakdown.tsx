import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";
import type { TravelPhrase } from "../data";

export const TravelBreakdown: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const colors = [travelTheme.accent, travelTheme.accent2, "#9b59b6", "#27ae60"];
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <Audio src={staticFile(`travel/${p.id}/phrase.mp3`)} volume={2.5} />
      <div style={{ color: travelTheme.text, fontFamily: travelTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>
        逐字拆解
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 20, width: "100%", maxWidth: 920 }}>
        {p.breakdown.map((b, i) => {
          const delay = i * 18;
          const scale = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 100 } });
          const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" });
          const color = colors[i % colors.length];
          return (
            <div key={i} style={{ opacity, transform: `scale(${scale})`, display: "flex", alignItems: "center", gap: 40, background: travelTheme.paper, padding: "24px 40px", borderRadius: 24, borderLeft: `12px solid ${color}`, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ color, fontFamily: travelTheme.fontJa, fontSize: 72, fontWeight: 900, minWidth: 280 }}>
                {b.word}
              </div>
              <div style={{ color: travelTheme.text, fontFamily: travelTheme.fontZh, fontSize: 48, fontWeight: 700 }}>
                = {b.role}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
