import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeExplanation: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labelOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 36 }}>
      <Sequence from={Math.floor(0.5 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/explanation_ch.mp3`)} volume={2.4} />
      </Sequence>
      <div style={{ opacity: labelOpacity, color: animeTheme.accent, fontFamily: animeTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>
        💡 噢原來如此
      </div>
      <div style={{ opacity: textOpacity, color: animeTheme.textOnDark, fontFamily: animeTheme.fontZh, fontSize: 44, fontWeight: 600, lineHeight: 1.7, textAlign: "left", maxWidth: 920, padding: "0 20px" }}>
        {q.explanation}
      </div>
    </AbsoluteFill>
  );
};
