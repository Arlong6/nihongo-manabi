import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeCTA: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const tagOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 32 }}>
      <Sequence from={Math.floor(0.3 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/cta_ch.mp3`)} volume={2.4} />
      </Sequence>
      <div style={{ transform: `scale(${scale})`, color: animeTheme.accent, fontFamily: animeTheme.fontZh, fontSize: 96, fontWeight: 900, textAlign: "center", letterSpacing: 4 }}>
        想學更多日文
      </div>
      <div style={{ opacity: tagOpacity, background: animeTheme.accent2, color: "#fff", fontFamily: animeTheme.fontZh, fontSize: 56, fontWeight: 900, padding: "20px 56px", borderRadius: 999, letterSpacing: 4 }}>
        Nihongo Manabi
      </div>
      <div style={{ opacity: tagOpacity, color: animeTheme.textOnDark, fontFamily: animeTheme.fontZh, fontSize: 46, fontWeight: 700, marginTop: 4 }}>
        App Store 搜尋
      </div>
    </AbsoluteFill>
  );
};
