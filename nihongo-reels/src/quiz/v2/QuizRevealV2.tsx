import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

// A quick green flash on entry, the correct card pops + glows while wrong cards
// desaturate and shrink, and the answer word "drops into" the blank of the now-
// completed sentence.
export const QuizRevealV2: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 8, stiffness: 220 } });
  const flash = interpolate(frame, [0, 4, 12], [0, 0.9, 0], { extrapolateRight: "clamp" });
  const [before, after] = q.sentence.split("___");
  const drop = spring({ frame: frame - 6, fps, config: { damping: 9, stiffness: 200 } });
  const dropY = interpolate(drop, [0, 1], [-50, 0]);
  const explainOp = interpolate(frame, [20, 32], [0, 1], { extrapolateRight: "clamp" });
  const wrongShrink = interpolate(pop, [0, 1], [1, 0.9]);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60, gap: 34 }}>
      <Audio src={staticFile(`quiz/${q.id}/answer.mp3`)} />
      <AbsoluteFill style={{ background: T.right, opacity: flash * 0.35 }} />
      <div style={{ color: T.right, fontFamily: T.fontZh, fontSize: 64, fontWeight: 900, transform: `scale(${0.6 + 0.4 * pop})`, textShadow: `0 0 40px ${T.right}` }}>答案</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%" }}>
        {q.options.map((opt, i) => {
          const isRight = i === q.answerIndex;
          return (
            <div key={i} style={{ background: T.cards[i % T.cards.length], color: T.cardText, fontFamily: T.fontJa, fontSize: 58, fontWeight: 900, borderRadius: 20, padding: "34px 20px", textAlign: "center", opacity: isRight ? 1 : T.dim, filter: isRight ? "none" : "grayscale(0.6)", transform: isRight ? `scale(${1 + 0.1 * pop})` : `scale(${wrongShrink})`, boxShadow: isRight ? `0 0 60px ${T.right}` : "none" }}>
              {opt}
            </div>
          );
        })}
      </div>
      <div style={{ color: T.text, fontFamily: T.fontJa, fontSize: 52, fontWeight: 800, textAlign: "center", lineHeight: 1.4 }}>
        {before}
        <span style={{ display: "inline-block", color: T.right, transform: `translateY(${dropY}px)`, opacity: drop, textShadow: `0 0 24px ${T.right}` }}>{q.answer}</span>
        {after}
      </div>
      <div style={{ background: "rgba(255,255,255,0.92)", color: "#141230", fontFamily: T.fontZh, fontSize: 36, fontWeight: 600, borderRadius: 16, padding: "18px 26px", textAlign: "center", opacity: explainOp }}>
        💡 {q.explanation}
      </div>
    </AbsoluteFill>
  );
};
