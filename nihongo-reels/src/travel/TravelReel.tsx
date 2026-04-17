import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TRAVEL_FPS, travelSceneFrames, travelTotal } from "./theme";
import { TravelHook } from "./scenes/TravelHook";
import { TravelPhraseScene } from "./scenes/TravelPhrase";
import { TravelBreakdown } from "./scenes/TravelBreakdown";
import { TravelResponse } from "./scenes/TravelResponse";
import { TravelTip } from "./scenes/TravelTip";
import { TravelCTA } from "./scenes/TravelCTA";
import { Watermark } from "../Watermark";
import type { TravelPhrase } from "./data";

export const TravelReel: React.FC<{ p: TravelPhrase }> = ({ p }) => {
  const s = travelSceneFrames(p.timings);
  let cur = 0;
  const at = (d: number) => { const f = cur; cur += d; return f; };
  const total = travelTotal(p.timings);
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (TRAVEL_FPS * 0.8));
          const fadeOut = Math.min(1, (total - f) / (TRAVEL_FPS * 0.8));
          return 0.30 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}><TravelHook p={p} /></Sequence>
      <Sequence from={at(s.phrase)} durationInFrames={s.phrase}><TravelPhraseScene p={p} /></Sequence>
      <Sequence from={at(s.breakdown)} durationInFrames={s.breakdown}><TravelBreakdown p={p} /></Sequence>
      <Sequence from={at(s.response)} durationInFrames={s.response}><TravelResponse p={p} /></Sequence>
      <Sequence from={at(s.tip)} durationInFrames={s.tip}><TravelTip p={p} /></Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}><TravelCTA /></Sequence>
      <Watermark />
    </AbsoluteFill>
  );
};
