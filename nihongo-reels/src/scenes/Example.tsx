import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import type { Word } from "../words";

export const Example: React.FC<{ word: Word; index: number }> = ({ word, index }) => {
  const frame = useCurrentFrame();
  const idx = String(index).padStart(2, "0");

  const chars = Array.from(word.example);
  const charsPerFrame = 5;

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const translationOpacity = interpolate(
    frame,
    [chars.length * charsPerFrame + 20, chars.length * charsPerFrame + 50],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
        gap: 60,
      }}
    >
      <Audio src={staticFile(`audio/${idx}-example.mp3`)} />
      <div
        style={{
          color: theme.accent2,
          fontFamily: theme.fontZh,
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: 8,
          opacity: titleOpacity,
        }}
      >
        例 句
      </div>

      <div
        style={{
          color: theme.text,
          fontFamily: theme.fontJa,
          fontSize: 92,
          fontWeight: 700,
          lineHeight: 1.5,
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        {chars.map((c, i) => {
          const appearAt = 15 + i * charsPerFrame;
          const isTarget = word.japanese.includes(c);
          const opacity = interpolate(frame, [appearAt, appearAt + 6], [0, 1], {
            extrapolateRight: "clamp",
          });
          return (
            <span
              key={i}
              style={{
                opacity,
                color: isTarget ? theme.accent : theme.text,
                fontWeight: isTarget ? 900 : 700,
              }}
            >
              {c}
            </span>
          );
        })}
      </div>

      <div
        style={{
          color: theme.muted,
          fontFamily: theme.fontZh,
          fontSize: 56,
          fontWeight: 500,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.4,
          opacity: translationOpacity,
          borderTop: `2px solid ${theme.muted}40`,
          paddingTop: 40,
        }}
      >
        {word.exampleChinese}
      </div>
    </AbsoluteFill>
  );
};
