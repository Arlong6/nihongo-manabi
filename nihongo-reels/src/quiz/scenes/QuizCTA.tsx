import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { quizTheme as T } from "../theme";

export const QuizCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 10, stiffness: 180 } });
  return (
    <AbsoluteFill style={{ background: T.bg, justifyContent: "center", alignItems: "center", padding: 80, gap: 30 }}>
      <div style={{ color: T.text, fontFamily: T.fontZh, fontSize: 78, fontWeight: 900, transform: `scale(${pop})`, textAlign: "center" }}>
        答對的留言 ✋
      </div>
      <div style={{ color: T.muted, fontFamily: T.fontZh, fontSize: 44, fontWeight: 700, textAlign: "center" }}>
        App 還有 900 題等你練
      </div>
    </AbsoluteFill>
  );
};
