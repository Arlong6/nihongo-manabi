import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote as AnimeQuoteType } from "../data";

export const AnimeQuoteScene: React.FC<{ q: AnimeQuoteType }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const quoteScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const readingOpacity = interpolate(frame, [25, 50], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 50 }}>
      <Audio src={staticFile(`anime/${q.id}/quote.mp3`)} volume={2.5} />
      <Sequence from={Math.floor(2.0 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/quote.mp3`)} volume={2.5} />
      </Sequence>
      <div style={{ color: animeTheme.muted, fontFamily: animeTheme.fontZh, fontSize: 44, fontWeight: 700, letterSpacing: 3 }}>
        〝 {q.character}
      </div>
      <div style={{ transform: `scale(${quoteScale})`, color: animeTheme.textOnDark, fontFamily: animeTheme.fontJa, fontSize: 130, fontWeight: 900, lineHeight: 1.25, textAlign: "center", maxWidth: 960, textShadow: "0 6px 24px rgba(255, 210, 63, 0.4)" }}>
        {q.quote}
      </div>
      <div style={{ opacity: readingOpacity, color: animeTheme.accent, fontFamily: animeTheme.fontJa, fontSize: 60, letterSpacing: 4 }}>
        {q.reading}
      </div>
    </AbsoluteFill>
  );
};
