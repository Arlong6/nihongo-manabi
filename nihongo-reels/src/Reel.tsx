import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SCENE, TOTAL, FPS } from "./theme";
import { Hook } from "./scenes/Hook";
import { WordCard } from "./scenes/WordCard";
import { Example } from "./scenes/Example";
import { Tip } from "./scenes/Tip";
import { CTA } from "./scenes/CTA";
import { Watermark } from "./Watermark";
import type { Word } from "./words";

export type ReelProps = { word: Word; index: number };

export const Reel: React.FC<ReelProps> = ({ word, index }) => {
  let cursor = 0;
  const at = (d: number) => {
    const from = cursor;
    cursor += d;
    return from;
  };

  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (FPS * 1));
          const fadeOut = Math.min(1, (TOTAL - f) / (FPS * 1));
          return 0.28 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(SCENE.hook)} durationInFrames={SCENE.hook}>
        <Hook word={word} index={index} />
      </Sequence>
      <Sequence from={at(SCENE.word)} durationInFrames={SCENE.word}>
        <WordCard word={word} index={index} />
      </Sequence>
      <Sequence from={at(SCENE.example)} durationInFrames={SCENE.example}>
        <Example word={word} index={index} />
      </Sequence>
      <Sequence from={at(SCENE.tip)} durationInFrames={SCENE.tip}>
        <Tip word={word} />
      </Sequence>
      <Sequence from={at(SCENE.cta)} durationInFrames={SCENE.cta}>
        <CTA />
      </Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
