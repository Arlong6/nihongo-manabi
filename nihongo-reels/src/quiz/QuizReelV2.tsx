import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { QUIZ_FPS, quizSceneFrames, quizTotal } from "./theme";
import { QuizBg } from "./v2/QuizBg";
import { FadeScene } from "./v2/FadeScene";
import { QuizHookV2 } from "./v2/QuizHookV2";
import { QuizCountdownV2 } from "./v2/QuizCountdownV2";
import { QuizRevealV2 } from "./v2/QuizRevealV2";
import { QuizCTAV2 } from "./v2/QuizCTAV2";
import { Watermark } from "../Watermark";
import type { QuizItem } from "./data";

// Motion-polished variant: persistent animated background, scenes dissolve
// through it (no hard cuts), Ken Burns push, content-native reveal motion.
export const QuizReelV2: React.FC<{ q: QuizItem }> = ({ q }) => {
  const s = quizSceneFrames(q.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = quizTotal(q.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm-quiz.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (QUIZ_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (QUIZ_FPS * 0.8));
          return 0.25 * Math.min(fadeIn, fadeOut);
        }}
      />
      <QuizBg />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}>
        <FadeScene durationInFrames={s.hook}><QuizHookV2 q={q} /></FadeScene>
      </Sequence>
      <Sequence from={at(s.countdown)} durationInFrames={s.countdown}>
        <FadeScene durationInFrames={s.countdown} kenBurns={false}><QuizCountdownV2 q={q} /></FadeScene>
      </Sequence>
      <Sequence from={at(s.reveal)} durationInFrames={s.reveal}>
        <FadeScene durationInFrames={s.reveal}><QuizRevealV2 q={q} /></FadeScene>
      </Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}>
        <FadeScene durationInFrames={s.cta}><QuizCTAV2 /></FadeScene>
      </Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
