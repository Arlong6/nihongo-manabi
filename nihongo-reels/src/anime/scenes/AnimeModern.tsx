import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { animeTheme } from "../theme";
import type { AnimeQuote } from "../data";

export const AnimeModern: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: animeTheme.bg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      {/* Character-voiced reading of the modern usage example. Delayed slightly so
          the card has time to animate in before the line plays. */}
      <Sequence from={Math.floor(0.7 * fps)}>
        <Audio src={staticFile(`anime/${q.id}/modern.mp3`)} volume={2.6} />
      </Sequence>
      <div style={{ transform: `scale(${cardScale})`, background: animeTheme.paper, borderRadius: 36, padding: 56, maxWidth: 920, border: `4px solid ${animeTheme.accent2}`, display: "flex", flexDirection: "column", gap: 28, boxShadow: "0 20px 60px rgba(255,107,157,0.4)" }}>
        <div style={{ color: animeTheme.accent2, fontFamily: animeTheme.fontZh, fontSize: 52, fontWeight: 900, letterSpacing: 6 }}>
          🎯 現代怎麼用
        </div>
        <div style={{ opacity: textOpacity, color: animeTheme.text, fontFamily: animeTheme.fontZh, fontSize: 50, fontWeight: 700, lineHeight: 1.55 }}>
          {q.modern_usage}
        </div>
        <div style={{ opacity: textOpacity, color: animeTheme.accent, fontFamily: animeTheme.fontZh, fontSize: 36, fontWeight: 700, marginTop: 4, letterSpacing: 2 }}>
          🔊 聽聽看角色口氣
        </div>
      </div>
    </AbsoluteFill>
  );
};
