import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { KANA_FPS, kanaSceneFrames, kanaTotal } from "./theme";
import { KanaHook } from "./scenes/KanaHook";
import { KanaQuiz } from "./scenes/KanaQuiz";
import { KanaAnswer } from "./scenes/KanaAnswer";
import { KanaExample } from "./scenes/KanaExample";
import { KanaCTA } from "./scenes/KanaCTA";
import { Watermark } from "../Watermark";
import type { KanaPair } from "./data";

export const KanaReel: React.FC<{ p: KanaPair }> = ({ p }) => {
  const s = kanaSceneFrames(p.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = kanaTotal(p.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (KANA_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (KANA_FPS * 0.8));
          return 0.30 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><KanaHook p={p} /></Sequence>
      <Sequence from={at(s.quiz)} durationInFrames={s.quiz}><KanaQuiz p={p} /></Sequence>
      <Sequence from={at(s.answer)} durationInFrames={s.answer}><KanaAnswer p={p} /></Sequence>
      <Sequence from={at(s.example)} durationInFrames={s.example}><KanaExample p={p} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><KanaCTA /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
