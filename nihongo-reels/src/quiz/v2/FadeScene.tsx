import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// Wraps a scene so it dissolves in from / out to the persistent background at
// its boundaries (no hard cut, no black gap — the animated QuizBg shows
// through), plus a subtle Ken Burns push so the frame always breathes.
export const FadeScene: React.FC<{
  durationInFrames: number;
  children: React.ReactNode;
  kenBurns?: boolean;
}> = ({ durationInFrames, children, kenBurns = true }) => {
  const frame = useCurrentFrame();
  const f = 7;
  const opacity = interpolate(
    frame,
    [0, f, durationInFrames - f, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = kenBurns ? interpolate(frame, [0, durationInFrames], [1.0, 1.045]) : 1;
  return <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>{children}</AbsoluteFill>;
};
