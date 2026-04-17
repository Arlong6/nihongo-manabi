import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { crimeTheme } from "../theme";
import type { Case } from "../data";

export const CrimeCTA: React.FC<{ c: Case }> = ({ c }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const pulse = 1 + Math.sin(frame / 6) * 0.03;

  return (
    <AbsoluteFill
      style={{
        background: crimeTheme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        gap: 60,
      }}
    >
      <Audio src={staticFile(`crime/${c.id}/cta.mp3`)} />

      <div
        style={{
          transform: `scale(${scale * pulse})`,
          color: crimeTheme.tape,
          fontFamily: crimeTheme.fontMono,
          fontSize: 56,
          letterSpacing: 6,
        }}
      >
        ▶ FOLLOW
      </div>

      <div
        style={{
          color: crimeTheme.text,
          fontFamily: crimeTheme.fontZh,
          fontSize: 76,
          fontWeight: 900,
          textAlign: "center",
          transform: `scale(${scale})`,
        }}
      >
        {c.cta}
      </div>

      {c.credits && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            color: crimeTheme.muted,
            fontFamily: crimeTheme.fontMono,
            fontSize: 22,
            letterSpacing: 2,
            opacity: interpolate(frame, [30, 60], [0, 0.7], { extrapolateRight: "clamp" }),
          }}
        >
          {c.credits}
        </div>
      )}
    </AbsoluteFill>
  );
};
