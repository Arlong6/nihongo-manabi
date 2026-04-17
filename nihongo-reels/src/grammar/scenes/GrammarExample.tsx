import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { grammarTheme } from "../theme";
import type { GrammarPoint } from "../data";

export const GrammarExampleScene: React.FC<{ g: GrammarPoint; which: 1 | 2 }> = ({ g, which }) => {
  const frame = useCurrentFrame();
  const ex = which === 1 ? g.example1 : g.example2;
  const zhOpacity = interpolate(frame, [Math.floor(ex.ja.length * 3.5) + 15, Math.floor(ex.ja.length * 3.5) + 40], [0, 1], { extrapolateRight: "clamp" });
  const chars = Array.from(ex.ja);
  const cpf = 3.5;
  return (
    <AbsoluteFill style={{ background: grammarTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 60 }}>
      <Audio src={staticFile(`grammar/${g.id}/example-${which}.mp3`)} />
      <div style={{ color: grammarTheme.accent, fontFamily: grammarTheme.fontZh, fontSize: 44, fontWeight: 900, letterSpacing: 6, padding: "10px 30px", border: `3px solid ${grammarTheme.accent}`, borderRadius: 999 }}>
        例 句 {which}
      </div>
      <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontJa, fontSize: 80, fontWeight: 800, lineHeight: 1.5, textAlign: "center", maxWidth: 920 }}>
        {chars.map((ch, i) => {
          const at = 10 + i * cpf;
          const opacity = interpolate(frame, [at, at + 5], [0, 1], { extrapolateRight: "clamp" });
          const highlighted = g.pattern.includes(ch) || ch === "〜";
          return <span key={i} style={{ opacity, color: highlighted ? grammarTheme.accent : grammarTheme.text, fontWeight: highlighted ? 900 : 700 }}>{ch}</span>;
        })}
      </div>
      <div style={{ opacity: zhOpacity, color: grammarTheme.muted, fontFamily: grammarTheme.fontZh, fontSize: 48, fontWeight: 600, textAlign: "center", maxWidth: 900, lineHeight: 1.5, borderTop: `2px solid ${grammarTheme.muted}55`, paddingTop: 24 }}>
        {ex.zh}
      </div>
    </AbsoluteFill>
  );
};
