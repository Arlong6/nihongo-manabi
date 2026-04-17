import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kanaTheme } from "../theme";
import type { KanaPair } from "../data";

export const KanaQuiz: React.FC<{ p: KanaPair }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const which = p.quizWhich === "left" ? p.left : p.right;
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 130 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.03;
  const qOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: kanaTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 60 }}>
      <div style={{ color: kanaTheme.text, fontFamily: kanaTheme.fontZh, fontSize: 68, fontWeight: 900 }}>
        這個是哪個？
      </div>
      <div style={{ transform: `scale(${scale * pulse})`, color: kanaTheme.text, fontFamily: kanaTheme.fontJa, fontSize: 560, fontWeight: 900, lineHeight: 1 }}>
        {which.char}
      </div>
      <div style={{ opacity: qOpacity, display: "flex", gap: 40, marginTop: 40 }}>
        <div style={{ color: kanaTheme.accentL, fontFamily: kanaTheme.fontJa, fontSize: 120, fontWeight: 900, padding: "20px 60px", border: `6px solid ${kanaTheme.accentL}`, borderRadius: 30 }}>A · {p.left.char}</div>
        <div style={{ color: kanaTheme.accentR, fontFamily: kanaTheme.fontJa, fontSize: 120, fontWeight: 900, padding: "20px 60px", border: `6px solid ${kanaTheme.accentR}`, borderRadius: 30 }}>B · {p.right.char}</div>
      </div>
    </AbsoluteFill>
  );
};
