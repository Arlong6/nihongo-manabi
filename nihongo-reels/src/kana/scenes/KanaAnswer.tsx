import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kanaTheme } from "../theme";
import type { KanaPair } from "../data";

export const KanaAnswer: React.FC<{ p: KanaPair }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const which = p.quizWhich === "left" ? p.left : p.right;
  const color = p.quizWhich === "left" ? kanaTheme.accentL : kanaTheme.accentR;
  const badgeScale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const mnOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: kanaTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 50 }}>
      <div style={{ transform: `scale(${badgeScale})`, background: kanaTheme.accentOk, color: "#fff", fontFamily: kanaTheme.fontZh, fontSize: 64, fontWeight: 900, padding: "18px 56px", borderRadius: 999, letterSpacing: 4 }}>
        答案
      </div>
      <div style={{ color, fontFamily: kanaTheme.fontJa, fontSize: 400, fontWeight: 900, lineHeight: 1 }}>
        {which.char}
      </div>
      <div style={{ opacity: mnOpacity, color: kanaTheme.text, fontFamily: kanaTheme.fontZh, fontSize: 48, fontWeight: 700, textAlign: "center", maxWidth: 900, lineHeight: 1.5, background: "rgba(255,255,255,0.7)", padding: "24px 40px", borderRadius: 24 }}>
        💡 {p.mnemonic}
      </div>
    </AbsoluteFill>
  );
};
