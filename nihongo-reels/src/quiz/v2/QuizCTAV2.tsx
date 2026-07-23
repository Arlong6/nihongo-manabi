import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";

// Waving hand, headline pops, subline fades up. Transparent bg (QuizBg shows).
export const QuizCTAV2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  const wave = Math.sin(frame / 4) * 12;
  const sub = interpolate(frame, [10, 24], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 80, gap: 30 }}>
      <div style={{ fontSize: 120, transform: `rotate(${wave}deg)` }}>✋</div>
      <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 78, fontWeight: 900, transform: `scale(${pop})`, textAlign: "center" }}>
        答對的留言
      </div>
      <div style={{ color: T.muted, fontFamily: T.fontZh, fontSize: 44, fontWeight: 700, textAlign: "center", opacity: sub }}>
        App 還有 900 題等你練
      </div>
    </AbsoluteFill>
  );
};
