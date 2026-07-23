import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

// Transparent bg (QuizBg shows through). Badge drops in, question pops with
// overshoot, the blank pulses to pull the eye.
export const QuizHookV2: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = spring({ frame, fps, config: { damping: 11, stiffness: 200 } });
  const pop = spring({ frame: frame - 4, fps, config: { damping: 8, stiffness: 220 } });
  const [before, after] = q.sentence.split("___");
  const blankPulse = 1 + 0.06 * Math.sin(frame / 5);
  const sentOpacity = interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 70, gap: 44 }}>
      <div style={{ transform: `translateY(${interpolate(badge, [0, 1], [-40, 0])}px)`, opacity: badge, background: "rgba(255,255,255,0.14)", color: T.text, fontFamily: T.fontZh, fontSize: 34, fontWeight: 800, padding: "10px 28px", borderRadius: 999, letterSpacing: 2 }}>
        JLPT {q.level}
      </div>
      <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 76, fontWeight: 900, transform: `scale(${pop})`, textAlign: "center", textShadow: "0 8px 40px rgba(255,95,143,0.4)" }}>
        3 秒，這格填什麼？
      </div>
      <div style={{ color: T.text, fontFamily: T.fontJa, fontSize: 64, fontWeight: 800, textAlign: "center", lineHeight: 1.5, opacity: sentOpacity }}>
        {before}
        <span style={{ display: "inline-block", background: T.cards[0], color: T.cards[0], borderRadius: 10, padding: "0 30px", margin: "0 6px", transform: `scale(${blankPulse})`, boxShadow: "0 0 30px rgba(255,95,143,0.6)" }}>＿＿</span>
        {after}
      </div>
    </AbsoluteFill>
  );
};
