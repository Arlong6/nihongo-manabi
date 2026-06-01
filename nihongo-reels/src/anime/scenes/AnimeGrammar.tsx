import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeGrammar: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      <Sequence from={Math.floor(0.5 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/grammar_ch.mp3`)} volume={2.4} />
      </Sequence>
      <div style={{ transform: `scale(${cardScale})`, background: animeTheme.paper, borderRadius: 36, padding: 56, maxWidth: 920, border: `4px solid ${animeTheme.accent}`, display: "flex", flexDirection: "column", gap: 28, boxShadow: "0 20px 60px rgba(255,210,63,0.4)" }}>
        <div style={{ color: animeTheme.accent2, fontFamily: animeTheme.fontZh, fontSize: 52, fontWeight: 900, letterSpacing: 6 }}>
          📝 文法重點
        </div>
        <div style={{ opacity: textOpacity, color: animeTheme.text, fontFamily: animeTheme.fontZh, fontSize: 56, fontWeight: 700, lineHeight: 1.45 }}>
          {q.grammar_point}
        </div>
      </div>
    </AbsoluteFill>
  );
};
