import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { oopsTheme } from "../theme";
import type { OopsCase } from "../data";

export const OopsTip: React.FC<{ o: OopsCase }> = ({ o }) => {
  const frame = useCurrentFrame();
  const labelOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const textOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 36 }}>
      <div style={{ opacity: labelOpacity, color: oopsTheme.accent, fontFamily: oopsTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>
        💡 噢原來如此
      </div>
      <div style={{ opacity: textOpacity, color: oopsTheme.text, fontFamily: oopsTheme.fontZh, fontSize: 44, fontWeight: 600, lineHeight: 1.7, textAlign: "left", maxWidth: 920, padding: "0 20px" }}>
        {o.context_tip}
      </div>
    </AbsoluteFill>
  );
};
