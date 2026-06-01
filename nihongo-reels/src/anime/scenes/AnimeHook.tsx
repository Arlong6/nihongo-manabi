import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeHook: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const titleOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 36 }}>
      <Sequence from={Math.floor(0.3 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/hook_ch.mp3`)} volume={2.4} />
      </Sequence>
      <div style={{ transform: `scale(${iconScale})`, fontSize: 320 }}>
        {q.emoji}
      </div>
      <div style={{ opacity: titleOpacity, color: animeTheme.accent, fontFamily: animeTheme.fontZh, fontSize: 80, fontWeight: 900, textAlign: "center", letterSpacing: 4 }}>
        動漫經典台詞
      </div>
      <div style={{ opacity: tagOpacity, background: animeTheme.accent2, color: "#fff", fontFamily: animeTheme.fontZh, fontSize: 50, fontWeight: 900, padding: "14px 44px", borderRadius: 999, letterSpacing: 4 }}>
        {q.anime} · {q.character}
      </div>
      <div style={{ opacity: tagOpacity, color: animeTheme.muted, fontFamily: animeTheme.fontZh, fontSize: 40, fontWeight: 600, marginTop: 6 }}>
        這句你一定聽過 ↓
      </div>
    </AbsoluteFill>
  );
};
