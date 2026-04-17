import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame } from "remotion";
import { crimeTheme } from "../theme";
import { PhotoLayer } from "../PhotoLayer";
import type { Case } from "../data";

export const CrimeAftermath: React.FC<{ c: Case; duration: number }> = ({ c, duration }) => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const chars = Array.from(c.aftermath);
  const startAt = 40;
  const cpf = 2.2;

  return (
    <AbsoluteFill>
      <Audio src={staticFile(`crime/${c.id}/aftermath.mp3`)} />
      {c.aftermathImage && (
        <PhotoLayer
          caseId={c.id}
          src={c.aftermathImage}
          duration={duration}
          darken={0.78}
          zoomFrom={1.2}
          zoomTo={1.32}
        />
      )}

      <AbsoluteFill
        style={{
          padding: 80,
          paddingTop: 280,
          alignItems: "center",
          flexDirection: "column",
          gap: 50,
        }}
      >
        <div
          style={{
            fontFamily: crimeTheme.fontMono,
            color: crimeTheme.muted,
            fontSize: 34,
            letterSpacing: 10,
            opacity: labelOpacity,
            padding: "8px 28px",
            border: `1px solid ${crimeTheme.muted}`,
          }}
        >
          AFTERMATH · 後續
        </div>

        <div
          style={{
            color: crimeTheme.text,
            fontFamily: crimeTheme.fontZh,
            fontSize: 46,
            fontWeight: 500,
            lineHeight: 1.65,
            textAlign: "center",
            maxWidth: 920,
            textShadow: "0 4px 16px rgba(0,0,0,0.9)",
          }}
        >
          {chars.map((ch, i) => {
            const appearAt = startAt + i * cpf;
            const opacity = interpolate(frame, [appearAt, appearAt + 4], [0, 1], {
              extrapolateRight: "clamp",
            });
            return (
              <span key={i} style={{ opacity }}>
                {ch}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
