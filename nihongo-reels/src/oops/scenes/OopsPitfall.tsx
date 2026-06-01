import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { oopsTheme } from "../theme";
import type { OopsCase } from "../data";

export const OopsPitfall: React.FC<{ o: OopsCase }> = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phraseScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const readingOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.badBg, padding: 80, justifyContent: "center", alignItems: "center", gap: 32 }}>
      <Audio src={staticFile(`oops/${o.id}/pitfall.mp3`)} volume={2.5} />
      <Sequence from={Math.floor(2.0 * fps)}>
        <Audio src={staticFile(`oops/${o.id}/pitfall.mp3`)} volume={2.5} />
      </Sequence>
      <div style={{ background: oopsTheme.bad, color: "#fff", fontFamily: oopsTheme.fontZh, fontSize: 72, fontWeight: 900, padding: "16px 56px", borderRadius: 999, letterSpacing: 8 }}>
        ❌ NG
      </div>
      <div style={{ transform: `scale(${phraseScale})`, color: oopsTheme.text, fontFamily: oopsTheme.fontJa, fontSize: 110, fontWeight: 900, lineHeight: 1.25, textAlign: "center", maxWidth: 960 }}>
        {o.pitfall_phrase}
      </div>
      <div style={{ opacity: readingOpacity, color: oopsTheme.muted, fontFamily: oopsTheme.fontJa, fontSize: 54, letterSpacing: 4 }}>
        {o.pitfall_reading}
      </div>
    </AbsoluteFill>
  );
};
