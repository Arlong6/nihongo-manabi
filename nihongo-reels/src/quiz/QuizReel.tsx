import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { QUIZ_FPS, quizSceneFrames, quizTotal } from "./theme";
import { QuizHook } from "./scenes/QuizHook";
import { QuizCountdown } from "./scenes/QuizCountdown";
import { QuizReveal } from "./scenes/QuizReveal";
import { QuizCTA } from "./scenes/QuizCTA";
import { Watermark } from "../Watermark";
import type { QuizItem } from "./data";

export const QuizReel: React.FC<{ q: QuizItem }> = ({ q }) => {
  const s = quizSceneFrames(q.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = quizTotal(q.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm-upbeat.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (QUIZ_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (QUIZ_FPS * 0.8));
          return 0.25 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><QuizHook q={q} /></Sequence>
      <Sequence from={at(s.countdown)} durationInFrames={s.countdown}><QuizCountdown q={q} /></Sequence>
      <Sequence from={at(s.reveal)} durationInFrames={s.reveal}><QuizReveal q={q} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><QuizCTA /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
