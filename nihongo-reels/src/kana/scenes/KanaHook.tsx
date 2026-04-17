import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { kanaTheme } from "../theme";
import type { KanaPair } from "../data";

export const KanaHook: React.FC<{ p: KanaPair }> = ({ p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const leftEnter = spring({ frame, fps, config: { damping: 12, stiffness: 110 } });
  const rightEnter = spring({ frame: frame - 6, fps, config: { damping: 12, stiffness: 110 } });
  const qOpacity = interpolate(frame, [12, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: kanaTheme.bg, padding: 80, justifyContent: "center", alignItems: "center", gap: 40 }}>
      <Audio src={staticFile(`kana/${p.id}/chars.mp3`)} />
      <div style={{ color: kanaTheme.muted, fontFamily: kanaTheme.fontZh, fontSize: 56, fontWeight: 800, letterSpacing: 4 }}>
        分得出這兩個嗎？
      </div>
      <div style={{ display: "flex", gap: 80, marginTop: 20 }}>
        <div style={{ transform: `scale(${leftEnter})`, color: kanaTheme.accentL, fontFamily: kanaTheme.fontJa, fontSize: 460, fontWeight: 900, lineHeight: 1 }}>
          {p.left.char}
        </div>
        <div style={{ color: kanaTheme.muted, fontFamily: kanaTheme.fontJa, fontSize: 200, fontWeight: 900, alignSelf: "center" }}>
          vs
        </div>
        <div style={{ transform: `scale(${rightEnter})`, color: kanaTheme.accentR, fontFamily: kanaTheme.fontJa, fontSize: 460, fontWeight: 900, lineHeight: 1 }}>
          {p.right.char}
        </div>
      </div>
      <div style={{ opacity: qOpacity, color: kanaTheme.text, fontFamily: kanaTheme.fontZh, fontSize: 48, fontWeight: 600, marginTop: 40 }}>
        {p.kind === "katakana" ? "片假名" : "平假名"}
      </div>
    </AbsoluteFill>
  );
};
