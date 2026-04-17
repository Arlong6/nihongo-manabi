import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { grammarTheme } from "../theme";

export const GrammarCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: grammarTheme.bg, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <div style={{ transform: `scale(${scale})`, background: grammarTheme.accent, color: "#fff", fontFamily: grammarTheme.fontZh, fontSize: 84, fontWeight: 900, padding: "30px 64px", borderRadius: 32, boxShadow: "0 12px 40px rgba(43,182,115,0.3)" }}>
        存下來複習 📌
      </div>
      <div style={{ color: grammarTheme.text, fontFamily: grammarTheme.fontZh, fontSize: 48, fontWeight: 700 }}>
        每天搞懂一個文法點
      </div>
    </AbsoluteFill>
  );
};
