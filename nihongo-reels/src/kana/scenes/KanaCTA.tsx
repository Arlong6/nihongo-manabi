import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { kanaTheme } from "../theme";

export const KanaCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const wiggle = Math.sin(frame / 5) * 3;
  return (
    <AbsoluteFill style={{ background: kanaTheme.bg, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ transform: `scale(${scale}) rotate(${wiggle}deg)`, background: kanaTheme.accentL, color: "#fff", fontFamily: kanaTheme.fontZh, fontSize: 88, fontWeight: 900, padding: "32px 72px", borderRadius: 36, boxShadow: "0 12px 40px rgba(233,74,139,0.3)" }}>
        收藏 📌
      </div>
      <div style={{ color: kanaTheme.text, fontFamily: kanaTheme.fontZh, fontSize: 52, fontWeight: 700 }}>
        每天一組假名對比
      </div>
    </AbsoluteFill>
  );
};
