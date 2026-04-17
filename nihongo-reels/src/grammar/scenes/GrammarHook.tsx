import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { grammarTheme } from "../theme";
import type { GrammarPoint } from "../data";

export const GrammarHook: React.FC<{ g: GrammarPoint }> = ({ g }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeScale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const patternScale = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 110 } });
  const hintOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: grammarTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ transform: `scale(${badgeScale})`, background: grammarTheme.level, color: "#fff", fontFamily: grammarTheme.fontJa, fontSize: 56, fontWeight: 900, padding: "18px 48px", borderRadius: 999, letterSpacing: 6 }}>
        JLPT {g.level}
      </div>
      <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontZh, fontSize: 64, fontWeight: 900, marginTop: 20 }}>
        這個文法你用對了嗎？
      </div>
      <div style={{ transform: `scale(${patternScale})`, color: grammarTheme.accent, fontFamily: grammarTheme.fontJa, fontSize: 180, fontWeight: 900, marginTop: 20, textShadow: "0 8px 24px rgba(43,182,115,0.25)" }}>
        {g.pattern}
      </div>
      <div style={{ opacity: hintOpacity, color: grammarTheme.muted, fontFamily: grammarTheme.fontZh, fontSize: 44, fontWeight: 600 }}>
        超多人搞錯的細節 →
      </div>
    </AbsoluteFill>
  );
};
