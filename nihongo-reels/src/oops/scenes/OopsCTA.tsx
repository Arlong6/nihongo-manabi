import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { oopsTheme } from "../theme";

export const OopsCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const tagOpacity = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 32 }}>
      <div style={{ transform: `scale(${scale})`, color: oopsTheme.text, fontFamily: oopsTheme.fontZh, fontSize: 88, fontWeight: 900, textAlign: "center", letterSpacing: 4 }}>
        旅遊前必學日文
      </div>
      <div style={{ opacity: tagOpacity, background: oopsTheme.accent, color: "#fff", fontFamily: oopsTheme.fontZh, fontSize: 56, fontWeight: 900, padding: "20px 56px", borderRadius: 999, letterSpacing: 4 }}>
        Nihongo Manabi
      </div>
      <div style={{ opacity: tagOpacity, color: oopsTheme.muted, fontFamily: oopsTheme.fontZh, fontSize: 46, fontWeight: 700, marginTop: 4 }}>
        App Store 搜尋
      </div>
    </AbsoluteFill>
  );
};
