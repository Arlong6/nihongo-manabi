import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { ANIME_FPS, animeSceneFrames, animeTotal } from "./theme";
import { AnimeHook } from "./scenes/AnimeHook";
import { AnimeQuoteScene } from "./scenes/AnimeQuote";
import { AnimeMeaning } from "./scenes/AnimeMeaning";
import { AnimeGrammar } from "./scenes/AnimeGrammar";
import { AnimeExplanation } from "./scenes/AnimeExplanation";
import { AnimeModern } from "./scenes/AnimeModern";
import { AnimeCTA } from "./scenes/AnimeCTA";
import { Watermark } from "../Watermark";
import type { AnimeQuote } from "./data";

export const AnimeReel: React.FC<{ q: AnimeQuote }> = ({ q }) => {
  const s = animeSceneFrames(q.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = animeTotal(q.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/anime-bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (ANIME_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (ANIME_FPS * 0.8));
          return 0.45 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><AnimeHook q={q} /></Sequence>
      <Sequence from={at(s.quote)} durationInFrames={s.quote}><AnimeQuoteScene q={q} /></Sequence>
      <Sequence from={at(s.meaning)} durationInFrames={s.meaning}><AnimeMeaning q={q} /></Sequence>
      <Sequence from={at(s.grammar)} durationInFrames={s.grammar}><AnimeGrammar q={q} /></Sequence>
      <Sequence from={at(s.explanation)} durationInFrames={s.explanation}><AnimeExplanation q={q} /></Sequence>
      <Sequence from={at(s.modern)} durationInFrames={s.modern}><AnimeModern q={q} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><AnimeCTA q={q} /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
