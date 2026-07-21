import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

export const QuizReveal: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 8, stiffness: 220 } });
  return (
    <AbsoluteFill style={{ background: T.bg, justifyContent: "center", alignItems: "center", padding: 60, gap: 36 }}>
      <Audio src={staticFile(`quiz/${q.id}/answer.mp3`)} />
      <div style={{ color: T.right, fontFamily: T.fontZh, fontSize: 64, fontWeight: 900 }}>答案</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%" }}>
        {q.options.map((opt, i) => {
          const isRight = i === q.answerIndex;
          return (
            <div key={i} style={{ background: T.cards[i % T.cards.length], color: T.cardText, fontFamily: T.fontJa, fontSize: 58, fontWeight: 900, borderRadius: 20, padding: "34px 20px", textAlign: "center", opacity: isRight ? 1 : T.dim, transform: isRight ? `scale(${1 + 0.08 * pop})` : "scale(1)", boxShadow: isRight ? "0 0 60px rgba(61,240,168,0.55)" : "none" }}>
              {opt}
            </div>
          );
        })}
      </div>
      <div style={{ color: T.text, fontFamily: T.fontJa, fontSize: 52, fontWeight: 800, textAlign: "center", opacity: interpolate(frame, [10, 22], [0, 1], { extrapolateRight: "clamp" }) }}>
        {q.sentence.replace("___", q.answer)}
      </div>
      <div style={{ background: "rgba(255,255,255,0.92)", color: "#141230", fontFamily: T.fontZh, fontSize: 36, fontWeight: 600, borderRadius: 16, padding: "18px 26px", textAlign: "center", opacity: interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" }) }}>
        💡 {q.explanation}
      </div>
    </AbsoluteFill>
  );
};
