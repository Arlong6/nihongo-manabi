import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CRIME_FPS, sceneFrames, totalFrames } from "./theme";
import { CrimeHook } from "./scenes/CrimeHook";
import { CrimeSetup } from "./scenes/CrimeSetup";
import { CrimeEvents } from "./scenes/CrimeEvents";
import { CrimeTwist } from "./scenes/CrimeTwist";
import { CrimeAftermath } from "./scenes/CrimeAftermath";
import { CrimeCTA } from "./scenes/CrimeCTA";
import type { Case } from "./data";

export type CrimeReelProps = { c: Case };

export const CrimeReel: React.FC<CrimeReelProps> = ({ c }) => {
  const s = sceneFrames(c.timings);
  const total = totalFrames(c.timings);

  let cursor = 0;
  const at = (d: number) => {
    const from = cursor;
    cursor += d;
    return from;
  };

  return (
    <AbsoluteFill>
      <Audio
        src={staticFile("music/crime-bgm.mp3")}
        volume={(f) => {
          const fadeIn = Math.min(1, f / (CRIME_FPS * 1));
          const fadeOut = Math.min(1, (total - f) / (CRIME_FPS * 1));
          return 0.22 * Math.min(fadeIn, fadeOut);
        }}
      />
      <Sequence from={at(s.hook)} durationInFrames={s.hook}>
        <CrimeHook c={c} duration={s.hook} />
      </Sequence>
      <Sequence from={at(s.setup)} durationInFrames={s.setup}>
        <CrimeSetup c={c} duration={s.setup} />
      </Sequence>
      <Sequence
        from={at(s.events.reduce((a, b) => a + b, 0))}
        durationInFrames={s.events.reduce((a, b) => a + b, 0)}
      >
        <CrimeEvents c={c} beats={s.events} />
      </Sequence>
      <Sequence from={at(s.twist)} durationInFrames={s.twist}>
        <CrimeTwist c={c} duration={s.twist} />
      </Sequence>
      <Sequence from={at(s.aftermath)} durationInFrames={s.aftermath}>
        <CrimeAftermath c={c} duration={s.aftermath} />
      </Sequence>
      <Sequence from={at(s.cta)} durationInFrames={s.cta}>
        <CrimeCTA c={c} />
      </Sequence>
    </AbsoluteFill>
  );
};
