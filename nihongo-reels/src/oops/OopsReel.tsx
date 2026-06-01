import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { OOPS_FPS, oopsSceneFrames, oopsTotal } from "./theme";
import { OopsHook } from "./scenes/OopsHook";
import { OopsPitfall } from "./scenes/OopsPitfall";
import { OopsWhy } from "./scenes/OopsWhy";
import { OopsCorrect } from "./scenes/OopsCorrect";
import { OopsTip } from "./scenes/OopsTip";
import { OopsCTA } from "./scenes/OopsCTA";
import { Watermark } from "../Watermark";
import type { OopsCase } from "./data";

export const OopsReel: React.FC<{ o: OopsCase }> = ({ o }) => {
  const s = oopsSceneFrames(o.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = oopsTotal(o.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (OOPS_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (OOPS_FPS * 0.8));
          return 0.28 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><OopsHook o={o} /></Sequence>
      <Sequence from={at(s.pitfall)} durationInFrames={s.pitfall}><OopsPitfall o={o} /></Sequence>
      <Sequence from={at(s.why)} durationInFrames={s.why}><OopsWhy o={o} /></Sequence>
      <Sequence from={at(s.correct)} durationInFrames={s.correct}><OopsCorrect o={o} /></Sequence>
      <Sequence from={at(s.tip)} durationInFrames={s.tip}><OopsTip o={o} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><OopsCTA /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
