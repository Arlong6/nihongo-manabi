import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { kanaTheme } from "../theme";
import type { KanaPair } from "../data";

export const KanaExample: React.FC<{ p: KanaPair }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const which = p.quizWhich === "left" ? p.left : p.right;
  const color = p.quizWhich === "left" ? kanaTheme.accentL : kanaTheme.accentR;
  const wordScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const meaningOpacity = interpolate(frame, [30, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: kanaTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <Audio src={staticFile(`kana/${p.id}/example.mp3`)} />
      <div style={{ color: kanaTheme.muted, fontFamily: kanaTheme.fontZh, fontSize: 48, fontWeight: 700, letterSpacing: 4 }}>
        例如
      </div>
      <div style={{ transform: `scale(${wordScale})`, color, fontFamily: kanaTheme.fontJa, fontSize: 240, fontWeight: 900, lineHeight: 1.2 }}>
        {which.word}
      </div>
      <div style={{ color: kanaTheme.muted, fontFamily: kanaTheme.fontJa, fontSize: 70, letterSpacing: 6 }}>
        {which.reading}
      </div>
      <div style={{ opacity: meaningOpacity, color: kanaTheme.text, fontFamily: kanaTheme.fontZh, fontSize: 84, fontWeight: 800, marginTop: 20 }}>
        {which.meaning}
      </div>
    </AbsoluteFill>
  );
};
