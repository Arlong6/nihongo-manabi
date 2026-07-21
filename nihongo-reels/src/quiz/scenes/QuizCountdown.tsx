import { AbsoluteFill, Audio, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

export const QuizCountdown: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const secLeft = Math.max(1, 3 - Math.floor(Math.max(0, frame - fps * 2) / fps));
  const digitPulse = 1 + ((frame % fps) / fps) * -0.15 + 0.15;
  return (
    <AbsoluteFill style={{ background: T.bg, justifyContent: "center", alignItems: "center", padding: 60, gap: 40 }}>
      <Audio src={staticFile("quiz/tick.mp3")} startFrom={0} volume={0.9} />
      <div style={{ color: T.muted, fontFamily: T.fontJa, fontSize: 46, fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>
        {q.sentence}
      </div>
      <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 200, fontWeight: 900, transform: `scale(${digitPulse})`, textShadow: "0 10px 60px rgba(255,95,143,0.6)" }}>
        {secLeft}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%" }}>
        {q.options.map((opt, i) => {
          const enter = spring({ frame: frame - i * 4, fps, config: { damping: 10, stiffness: 200 } });
          return (
            <div key={i} style={{ background: T.cards[i % T.cards.length], color: T.cardText, fontFamily: T.fontJa, fontSize: 58, fontWeight: 900, borderRadius: 20, padding: "34px 20px", textAlign: "center", transform: `scale(${enter})` }}>
              {opt}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
