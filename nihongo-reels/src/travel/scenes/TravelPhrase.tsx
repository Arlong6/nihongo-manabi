import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { travelTheme } from "../theme";
import type { TravelPhrase } from "../data";

export const TravelPhraseScene: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phraseScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const readingOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const meaningOpacity = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: travelTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <Audio src={staticFile(`travel/${p.id}/phrase.mp3`)} volume={2.5} />
      <Sequence from={Math.floor(2.0 * fps)}>
        <Audio src={staticFile(`travel/${p.id}/phrase.mp3`)} volume={2.5} />
      </Sequence>
      <div style={{ transform: `scale(${phraseScale})`, color: travelTheme.text, fontFamily: travelTheme.fontJa, fontSize: 150, fontWeight: 900, lineHeight: 1.25, textAlign: "center", maxWidth: 960 }}>
        {p.phrase}
      </div>
      <div style={{ opacity: readingOpacity, color: travelTheme.muted, fontFamily: travelTheme.fontJa, fontSize: 64, letterSpacing: 4 }}>
        {p.reading}
      </div>
      <div style={{ opacity: meaningOpacity, color: travelTheme.accent, fontFamily: travelTheme.fontZh, fontSize: 68, fontWeight: 900, marginTop: 20 }}>
        {p.meaning}
      </div>
    </AbsoluteFill>
  );
};
