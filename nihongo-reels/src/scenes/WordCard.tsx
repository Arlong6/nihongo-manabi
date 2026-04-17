import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Word } from "../words";

export const WordCard: React.FC<{ word: Word; index: number }> = ({ word, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kanjiEnter = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const readingOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const meaningOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" });
  const meaningY = interpolate(frame, [50, 70], [30, 0], { extrapolateRight: "clamp" });
  const badgeScale = spring({
    frame: frame - 6,
    fps,
    config: { damping: 10, stiffness: 160 },
  });

  const idx = String(index).padStart(2, "0");

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <Audio src={staticFile(`audio/${idx}-reading.mp3`)} />
      <Sequence from={90}>
        <Audio src={staticFile(`audio/${idx}-reading.mp3`)} />
      </Sequence>
      <div
        style={{
          position: "absolute",
          top: 140,
          background: theme.accent,
          color: theme.text,
          fontFamily: theme.fontZh,
          fontSize: 44,
          fontWeight: 800,
          padding: "14px 40px",
          borderRadius: 999,
          letterSpacing: 2,
          transform: `scale(${badgeScale})`,
          boxShadow: "0 6px 24px rgba(233,69,96,0.4)",
        }}
      >
        JLPT {word.level}
      </div>

      <div
        style={{
          color: theme.muted,
          fontFamily: theme.fontJa,
          fontSize: 86,
          letterSpacing: 6,
          opacity: readingOpacity,
          marginBottom: 20,
        }}
      >
        {word.reading}
      </div>

      <div
        style={{
          color: theme.text,
          fontFamily: theme.fontJa,
          fontSize: 460,
          fontWeight: 900,
          lineHeight: 1,
          transform: `scale(${kanjiEnter})`,
          textShadow: "0 12px 60px rgba(255,255,255,0.15)",
        }}
      >
        {word.japanese}
      </div>

      <div
        style={{
          color: theme.accent2,
          fontFamily: theme.fontZh,
          fontSize: 80,
          fontWeight: 800,
          marginTop: 40,
          opacity: meaningOpacity,
          transform: `translateY(${meaningY}px)`,
        }}
      >
        {word.chinese}
      </div>
    </AbsoluteFill>
  );
};
