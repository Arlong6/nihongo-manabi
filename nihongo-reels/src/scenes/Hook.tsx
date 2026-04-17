import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Word } from "../words";

export const Hook: React.FC<{ word: Word; index: number }> = ({ word, index }) => {
  const idx = String(index).padStart(2, "0");
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 120 } });
  const kanjiScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 10, stiffness: 160 },
  });
  const pulse = 1 + Math.sin(frame / 6) * 0.02;

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <Audio src={staticFile(`audio/${idx}-hook.mp3`)} />
      <div
        style={{
          color: theme.text,
          fontFamily: theme.fontZh,
          fontSize: 88,
          fontWeight: 900,
          textAlign: "center",
          transform: `scale(${scale})`,
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        你知道
      </div>
      <div
        style={{
          color: theme.accent,
          fontFamily: theme.fontJa,
          fontSize: 340,
          fontWeight: 900,
          lineHeight: 1,
          margin: "40px 0",
          transform: `scale(${kanjiScale * pulse})`,
          textShadow: "0 8px 40px rgba(233,69,96,0.5)",
        }}
      >
        「{word.japanese}」
      </div>
      <div
        style={{
          color: theme.text,
          fontFamily: theme.fontZh,
          fontSize: 88,
          fontWeight: 900,
          textAlign: "center",
          transform: `scale(${scale})`,
          opacity: interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        怎麼唸？
      </div>
    </AbsoluteFill>
  );
};
