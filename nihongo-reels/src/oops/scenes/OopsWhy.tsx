import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { oopsTheme } from "../theme";
import type { OopsCase } from "../data";

export const OopsWhy: React.FC<{ o: OopsCase }> = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cardScale = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = interpolate(frame, [18, 42], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: oopsTheme.badBg, padding: 80, justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `scale(${cardScale})`, background: oopsTheme.paper, borderRadius: 36, padding: 56, maxWidth: 920, border: `4px solid ${oopsTheme.bad}`, display: "flex", flexDirection: "column", gap: 28, boxShadow: "0 16px 48px rgba(231,76,60,0.25)" }}>
        <div style={{ color: oopsTheme.bad, fontFamily: oopsTheme.fontZh, fontSize: 56, fontWeight: 900, letterSpacing: 6 }}>
          ⚠️ 為什麼這樣會踩雷
        </div>
        <div style={{ opacity: textOpacity, color: oopsTheme.text, fontFamily: oopsTheme.fontZh, fontSize: 48, fontWeight: 700, lineHeight: 1.55 }}>
          {o.why_wrong}
        </div>
      </div>
    </AbsoluteFill>
  );
};
