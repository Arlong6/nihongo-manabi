import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { oopsTheme } from "../theme";
import type { OopsCase } from "../data";

export const OopsCorrect: React.FC<{ o: OopsCase }> = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const phraseScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const readingOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  const meaningOpacity = interpolate(frame, [55, 80], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.goodBg, padding: 80, justifyContent: "center", alignItems: "center", gap: 28 }}>
      <Audio src={staticFile(`oops/${o.id}/correct.mp3`)} volume={2.5} />
      <Sequence from={Math.floor(2.0 * fps)}>
        <Audio src={staticFile(`oops/${o.id}/correct.mp3`)} volume={2.5} />
      </Sequence>
      <div style={{ background: oopsTheme.good, color: "#fff", fontFamily: oopsTheme.fontZh, fontSize: 72, fontWeight: 900, padding: "16px 56px", borderRadius: 999, letterSpacing: 8 }}>
        ✅ 正解
      </div>
      <div style={{ transform: `scale(${phraseScale})`, color: oopsTheme.text, fontFamily: oopsTheme.fontJa, fontSize: 100, fontWeight: 900, lineHeight: 1.25, textAlign: "center", maxWidth: 960 }}>
        {o.correct_phrase}
      </div>
      <div style={{ opacity: readingOpacity, color: oopsTheme.muted, fontFamily: oopsTheme.fontJa, fontSize: 52, letterSpacing: 4 }}>
        {o.correct_reading}
      </div>
      <div style={{ opacity: meaningOpacity, color: oopsTheme.good, fontFamily: oopsTheme.fontZh, fontSize: 56, fontWeight: 900, marginTop: 14 }}>
        {o.meaning}
      </div>
    </AbsoluteFill>
  );
};
