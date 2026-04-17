import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { GRAMMAR_FPS, grammarSceneFrames, grammarTotal } from "./theme";
import { GrammarHook } from "./scenes/GrammarHook";
import { GrammarPattern } from "./scenes/GrammarPattern";
import { GrammarExampleScene } from "./scenes/GrammarExample";
import { GrammarMistake } from "./scenes/GrammarMistake";
import { GrammarCTA } from "./scenes/GrammarCTA";
import { Watermark } from "../Watermark";
import type { GrammarPoint } from "./data";

export const GrammarReel: React.FC<{ g: GrammarPoint }> = ({ g }) => {
  const s = grammarSceneFrames(g.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = grammarTotal(g.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (GRAMMAR_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (GRAMMAR_FPS * 0.8));
          return 0.30 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><GrammarHook g={g} /></Sequence>
      <Sequence from={at(s.pattern)} durationInFrames={s.pattern}><GrammarPattern g={g} /></Sequence>
      <Sequence from={at(s.example1)} durationInFrames={s.example1}>
        <GrammarExampleScene g={g} which={1} />
      </Sequence>
      <Sequence from={at(s.example2)} durationInFrames={s.example2}>
        <GrammarExampleScene g={g} which={2} />
      </Sequence>
      <Sequence from={at(s.mistake)} durationInFrames={s.mistake}><GrammarMistake g={g} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><GrammarCTA /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
