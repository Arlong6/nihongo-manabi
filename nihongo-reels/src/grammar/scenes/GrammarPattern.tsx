import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { grammarTheme } from "../theme";
import type { GrammarPoint } from "../data";

export const GrammarPattern: React.FC<{ g: GrammarPoint }> = ({ g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const meaningOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: grammarTheme.bg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      <Audio src={staticFile(`grammar/${g.id}/pattern.mp3`)} />
      <div style={{ transform: `scale(${cardScale})`, background: grammarTheme.paper, borderRadius: 40, padding: 70, width: "100%", maxWidth: 920, border: `4px solid ${grammarTheme.accent}`, boxShadow: "0 20px 60px rgba(43,182,115,0.2)" }}>
        <div style={{ color: grammarTheme.muted, fontFamily: grammarTheme.fontZh, fontSize: 36, letterSpacing: 6, marginBottom: 16 }}>
          文型
        </div>
        <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontJa, fontSize: 140, fontWeight: 900, lineHeight: 1.2, marginBottom: 40 }}>
          {g.pattern}
        </div>
        <div style={{ opacity: meaningOpacity, borderTop: `3px dashed ${grammarTheme.muted}`, paddingTop: 32 }}>
          <div style={{ color: grammarTheme.muted, fontFamily: grammarTheme.fontZh, fontSize: 32, marginBottom: 8 }}>意思</div>
          <div style={{ color: grammarTheme.accent, fontFamily: grammarTheme.fontZh, fontSize: 80, fontWeight: 900 }}>
            {g.meaning}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
