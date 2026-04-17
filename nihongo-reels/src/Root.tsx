import { Composition } from "remotion";
import { Reel } from "./Reel";
import { words } from "./words";
import { FPS, WIDTH, HEIGHT, TOTAL } from "./theme";
import { CrimeReel } from "./crime/CrimeReel";
import { cases } from "./crime/data";
import { CRIME_FPS, CRIME_HEIGHT, CRIME_WIDTH, totalFrames } from "./crime/theme";
import { KanaReel } from "./kana/KanaReel";
import { kanaPairs } from "./kana/data";
import { KANA_FPS, KANA_HEIGHT, KANA_WIDTH, kanaTotal } from "./kana/theme";
import { GrammarReel } from "./grammar/GrammarReel";
import { grammarPoints } from "./grammar/data";
import { GRAMMAR_FPS, GRAMMAR_HEIGHT, GRAMMAR_WIDTH, grammarTotal } from "./grammar/theme";
import { TravelReel } from "./travel/TravelReel";
import { travelPhrases } from "./travel/data";
import { TRAVEL_FPS, TRAVEL_HEIGHT, TRAVEL_WIDTH, travelTotal } from "./travel/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Reel"
        component={Reel}
        durationInFrames={TOTAL}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ word: words[0], index: 1 }}
      />
      {words.map((w, i) => (
        <Composition
          key={i}
          id={`Reel-${String(i + 1).padStart(2, "0")}`}
          component={Reel}
          durationInFrames={TOTAL}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
          defaultProps={{ word: w, index: i + 1 }}
        />
      ))}
      {cases.map((c) => (
        <Composition
          key={c.id}
          id={`Crime-${c.id}`}
          component={CrimeReel}
          durationInFrames={totalFrames(c.timings)}
          fps={CRIME_FPS}
          width={CRIME_WIDTH}
          height={CRIME_HEIGHT}
          defaultProps={{ c }}
        />
      ))}
      <Composition
        id="Crime"
        component={CrimeReel}
        fps={CRIME_FPS}
        width={CRIME_WIDTH}
        height={CRIME_HEIGHT}
        durationInFrames={totalFrames(cases[0].timings)}
        defaultProps={{ c: cases[0] }}
        calculateMetadata={({ props }) => ({
          durationInFrames: totalFrames(props.c.timings),
        })}
      />
      {kanaPairs.map((p) => (
        <Composition
          key={p.id}
          id={`Kana-${p.id}`}
          component={KanaReel}
          fps={KANA_FPS}
          width={KANA_WIDTH}
          height={KANA_HEIGHT}
          durationInFrames={kanaTotal(p.timings)}
          defaultProps={{ p }}
        />
      ))}
      {grammarPoints.map((g) => (
        <Composition
          key={g.id}
          id={`Grammar-${g.id}`}
          component={GrammarReel}
          fps={GRAMMAR_FPS}
          width={GRAMMAR_WIDTH}
          height={GRAMMAR_HEIGHT}
          durationInFrames={grammarTotal(g.timings)}
          defaultProps={{ g }}
        />
      ))}
      {travelPhrases.map((p) => (
        <Composition
          key={p.id}
          id={`Travel-${p.id}`}
          component={TravelReel}
          fps={TRAVEL_FPS}
          width={TRAVEL_WIDTH}
          height={TRAVEL_HEIGHT}
          durationInFrames={travelTotal(p.timings)}
          defaultProps={{ p }}
        />
      ))}
    </>
  );
};
