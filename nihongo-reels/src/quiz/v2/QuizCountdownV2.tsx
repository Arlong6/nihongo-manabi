import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";
import type { QuizItem } from "../data";

// Depleting ring around the count number (drains over the 3 counting seconds),
// number snaps big each second, ring shifts toward the hot colour as time runs
// out; option cards slide + stagger in from alternating sides.
export const QuizCountdownV2: React.FC<{ q: QuizItem }> = ({ q }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  // Count from frame 0 so 3→2→1 lines up with the tick sfx (beeps at ~0/1/2s)
  // instead of freezing on "3" for the scene's first 2 seconds.
  const countF = frame;
  const secLeft = Math.max(1, 3 - Math.floor(countF / fps));

  const R = 120;
  const C = 2 * Math.PI * R;
  const prog = Math.min(1, countF / (fps * 3));
  const offset = C * prog; // 0 = full ring, C = empty

  // secLeft 3→0 (calm), 1→1 (urgent); input range must be increasing.
  const urgency = interpolate(secLeft, [1, 3], [1, 0]);
  const ringColor = urgency < 0.5 ? T.cards[2] : T.cards[0];
  const numPulse = 1.15 - (0.15 * (countF % fps)) / fps;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60, gap: 34 }}>
      <Audio src={staticFile("quiz/tick.mp3")} volume={0.9} />
      <div style={{ color: T.muted, fontFamily: T.fontJa, fontSize: 46, fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>
        {q.sentence}
      </div>
      <div style={{ position: "relative", width: 300, height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg width="300" height="300" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
          <circle cx="150" cy="150" r={R} stroke="rgba(255,255,255,0.12)" strokeWidth="14" fill="none" />
          <circle cx="150" cy="150" r={R} stroke={ringColor} strokeWidth="14" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset} style={{ filter: `drop-shadow(0 0 12px ${ringColor})` }} />
        </svg>
        <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 190, fontWeight: 900, transform: `scale(${numPulse})`, textShadow: `0 10px 50px ${ringColor}99` }}>
          {secLeft}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, width: "100%" }}>
        {q.options.map((opt, i) => {
          const enter = spring({ frame: frame - i * 5, fps, config: { damping: 12, stiffness: 180 } });
          const slide = interpolate(enter, [0, 1], [i % 2 === 0 ? -60 : 60, 0]);
          return (
            <div key={i} style={{ background: T.cards[i % T.cards.length], color: T.cardText, fontFamily: T.fontJa, fontSize: 58, fontWeight: 900, borderRadius: 20, padding: "34px 20px", textAlign: "center", transform: `translateX(${slide}px) scale(${enter})`, opacity: enter }}>
              {opt}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
