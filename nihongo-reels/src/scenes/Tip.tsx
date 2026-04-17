import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { Word } from "../words";

export const Tip: React.FC<{ word: Word }> = ({ word }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const lineOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: theme.bgGradient,
        justifyContent: "center",
        alignItems: "center",
        padding: 100,
      }}
    >
      <div
        style={{
          transform: `scale(${boxScale})`,
          background: `${theme.badge}cc`,
          border: `3px solid ${theme.accent2}`,
          borderRadius: 40,
          padding: "60px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          maxWidth: 900,
        }}
      >
        <div
          style={{
            color: theme.accent2,
            fontFamily: theme.fontZh,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: 4,
          }}
        >
          💡 記住它
        </div>
        <div
          style={{
            color: theme.text,
            fontFamily: theme.fontJa,
            fontSize: 120,
            fontWeight: 900,
          }}
        >
          {word.japanese}
          <span style={{ color: theme.muted, fontSize: 60, marginLeft: 20 }}>
            ({word.reading})
          </span>
        </div>
        <div
          style={{
            color: theme.text,
            fontFamily: theme.fontZh,
            fontSize: 54,
            fontWeight: 600,
            textAlign: "center",
            opacity: lineOpacity,
          }}
        >
          {word.english}
        </div>
      </div>
    </AbsoluteFill>
  );
};
