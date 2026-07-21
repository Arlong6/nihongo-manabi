import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

export const QuizHook: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 9, stiffness: 240 } });
  const [before, after] = q.sentence.split("___");
  return (
    <AbsoluteFill style={{ background: T.bg, justifyContent: "center", alignItems: "center", padding: 70, gap: 44 }}>
      <div style={{ background: "rgba(255,255,255,0.14)", color: T.text, fontFamily: T.fontZh, fontSize: 34, fontWeight: 800, padding: "10px 28px", borderRadius: 999, letterSpacing: 2 }}>
        JLPT {q.level}
      </div>
      <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 76, fontWeight: 900, transform: `scale(${pop})`, textAlign: "center" }}>
        3 秒，這格填什麼？
      </div>
      <div style={{ color: T.text, fontFamily: T.fontJa, fontSize: 64, fontWeight: 800, textAlign: "center", lineHeight: 1.5, opacity: interpolate(frame, [8, 20], [0, 1], { extrapolateRight: "clamp" }) }}>
        {before}
        <span style={{ background: T.cards[0], color: T.cards[0], borderRadius: 10, padding: "0 30px", margin: "0 6px" }}>＿＿</span>
        {after}
      </div>
    </AbsoluteFill>
  );
};
