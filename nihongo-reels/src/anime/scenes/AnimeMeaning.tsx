import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeMeaning: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const labelOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 36 }}>
      <Sequence from={Math.floor(0.4 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/meaning_ch.mp3`)} volume={2.4} />
      </Sequence>
      <div style={{ opacity: labelOpacity, color: animeTheme.muted, fontFamily: animeTheme.fontZh, fontSize: 52, fontWeight: 700, letterSpacing: 6 }}>
        中文意思
      </div>
      <div style={{ transform: `scale(${scale})`, color: animeTheme.accent, fontFamily: animeTheme.fontZh, fontSize: 88, fontWeight: 900, lineHeight: 1.35, textAlign: "center", maxWidth: 960 }}>
        {q.meaning}
      </div>
    </AbsoluteFill>
  );
};
