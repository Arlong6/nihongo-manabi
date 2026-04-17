import { AbsoluteFill } from "remotion";
import { theme } from "./theme";

export const Watermark: React.FC = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        marginBottom: 60,
        color: theme.muted,
        fontFamily: theme.fontZh,
        fontSize: 32,
        letterSpacing: 2,
        opacity: 0.7,
      }}
    >
      @llearn.nihongo.nanabi
    </div>
  </AbsoluteFill>
);
