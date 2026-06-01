import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { oopsTheme } from "../theme";
import type { OopsCase } from "../data";

export const OopsHook: React.FC<{ o: OopsCase }> = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const iconScale = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const titleOpacity = interpolate(frame, [10, 28], [0, 1], { extrapolateRight: "clamp" });
  const tagOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 36 }}>
      <div style={{ transform: `scale(${iconScale})`, fontSize: 320 }}>
        {o.emoji}
      </div>
      <div style={{ opacity: titleOpacity, color: oopsTheme.bad, fontFamily: oopsTheme.fontZh, fontSize: 82, fontWeight: 900, textAlign: "center", letterSpacing: 6 }}>
        ⚠️ 觀光客踩雷
      </div>
      <div style={{ opacity: tagOpacity, background: oopsTheme.accent, color: "#fff", fontFamily: oopsTheme.fontZh, fontSize: 48, fontWeight: 900, padding: "14px 40px", borderRadius: 999, letterSpacing: 2, maxWidth: 920, textAlign: "center" }}>
        {o.scenario}
      </div>
      <div style={{ opacity: tagOpacity, color: oopsTheme.muted, fontFamily: oopsTheme.fontZh, fontSize: 40, fontWeight: 600, marginTop: 6 }}>
        你是不是也這樣說？↓
      </div>
    </AbsoluteFill>
  );
};
