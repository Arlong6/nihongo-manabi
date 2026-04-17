import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { crimeTheme } from "../theme";
import { PhotoLayer } from "../PhotoLayer";
import type { Case, CrimeEvent } from "../data";

const EventCard: React.FC<{ caseId: string; idx: number; total: number; ev: CrimeEvent; duration: number }> = ({
  caseId,
  idx,
  total,
  ev,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const textOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {ev.image && (
        <PhotoLayer caseId={caseId} src={ev.image} duration={duration} darken={0.5} zoomFrom={1.05} zoomTo={1.18} />
      )}

      <AbsoluteFill
        style={{
          padding: 80,
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "column",
          paddingTop: 220,
          paddingBottom: 220,
        }}
      >
        <div
          style={{
            fontFamily: crimeTheme.fontMono,
            color: crimeTheme.tape,
            fontSize: 36,
            letterSpacing: 8,
            opacity: enter,
            padding: "10px 30px",
            border: `2px solid ${crimeTheme.tape}`,
            background: "rgba(0,0,0,0.5)",
          }}
        >
          事件 {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.75)",
            borderLeft: `8px solid ${crimeTheme.accent}`,
            padding: "28px 40px",
            color: crimeTheme.text,
            fontFamily: crimeTheme.fontZh,
            fontSize: 58,
            fontWeight: 700,
            lineHeight: 1.5,
            textAlign: "left",
            maxWidth: 940,
            opacity: textOpacity,
            transform: `translateX(${(1 - textOpacity) * -30}px)`,
          }}
        >
          {ev.text}
        </div>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 80,
          right: 80,
          height: 6,
          background: "#222",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${((idx + 1) / total) * 100}%`,
            height: "100%",
            background: crimeTheme.accent,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

export const CrimeEvents: React.FC<{ c: Case; beats: number[] }> = ({ c, beats }) => {
  let cursor = 0;
  return (
    <AbsoluteFill>
      {c.events.map((ev, i) => {
        const from = cursor;
        cursor += beats[i];
        return (
          <Sequence key={i} from={from} durationInFrames={beats[i]}>
            <Audio src={staticFile(`crime/${c.id}/event-${i + 1}.mp3`)} />
            <EventCard caseId={c.id} idx={i} total={c.events.length} ev={ev} duration={beats[i]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
