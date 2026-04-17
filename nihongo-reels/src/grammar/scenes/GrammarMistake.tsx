import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { grammarTheme } from "../theme";
import type { GrammarPoint } from "../data";

export const GrammarMistake: React.FC<{ g: GrammarPoint }> = ({ g }) => {
  const frame = useCurrentFrame();
  const explainOpacity = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: grammarTheme.bg, padding: 60, justifyContent: "center", alignItems: "center", gap: 30 }}>
      <Sequence from={0} durationInFrames={90}>
        <Audio src={staticFile(`grammar/${g.id}/wrong.mp3`)} />
      </Sequence>
      <Sequence from={95}>
        <Audio src={staticFile(`grammar/${g.id}/correct.mp3`)} />
      </Sequence>

      <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 4, marginBottom: 10 }}>
        常見錯誤
      </div>

      <div style={{ width: "100%", maxWidth: 960, padding: 40, borderRadius: 24, background: "#ffe5ea", border: `4px solid ${grammarTheme.wrong}` }}>
        <div style={{ color: grammarTheme.wrong, fontFamily: grammarTheme.fontZh, fontSize: 42, fontWeight: 900, marginBottom: 10 }}>
          ✗ 錯誤
        </div>
        <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontJa, fontSize: 56, fontWeight: 700, lineHeight: 1.4 }}>
          {g.wrong.ja}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 960, padding: 40, borderRadius: 24, background: "#e5fff0", border: `4px solid ${grammarTheme.right}` }}>
        <div style={{ color: grammarTheme.right, fontFamily: grammarTheme.fontZh, fontSize: 42, fontWeight: 900, marginBottom: 10 }}>
          ✓ 正確
        </div>
        <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontJa, fontSize: 56, fontWeight: 700, lineHeight: 1.4 }}>
          {g.correct.ja}
        </div>
      </div>

      <div style={{ opacity: explainOpacity, color: grammarTheme.text, fontFamily: grammarTheme.fontZh, fontSize: 40, fontWeight: 700, textAlign: "center", maxWidth: 900, marginTop: 12, background: "rgba(255,255,255,0.8)", padding: "18px 28px", borderRadius: 20 }}>
        💡 {g.mistakeExplain}
      </div>
    </AbsoluteFill>
  );
};
