import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { quizTheme as T } from "../theme";

// Deterministic pseudo-random from index (no Math.random — Remotion needs
// frame-deterministic output).
const rnd = (i: number, n: number) => {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  x: rnd(i, 1) * 100,
  y: rnd(i, 2) * 100,
  size: 3 + rnd(i, 3) * 13,
  speed: 0.25 + rnd(i, 4) * 0.9,
  sway: 3 + rnd(i, 6) * 7, // horizontal drift amplitude (%)
  phase: rnd(i, 5) * Math.PI * 2,
  hue: i % T.cards.length,
  spark: rnd(i, 7) > 0.78, // a few brighter, faster-twinkling sparks
}));

// Two colours the mid gradient stop drifts between, for slow colour variation.
const MID_A = [58, 20, 84]; // #3a1454-ish purple
const MID_B = [20, 32, 104]; // deep blue
const mix = (a: number[], b: number[], t: number) =>
  `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(",")})`;

// Persistent animated background: swaying + colour-drifting gradient, a
// travelling colored glow, and drifting/swaying twinkling particles. Sits
// behind every scene so the frame is never static and scene crossfades
// dissolve through it.
export const QuizBg: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 7;
  const midT = 0.5 + 0.5 * Math.sin(frame / 130); // 0..1 colour drift
  const midCol = mix(MID_A, MID_B, midT);

  // Travelling glow follows a slow Lissajous path across the frame.
  const glowX = 50 + 30 * Math.sin(frame / 110);
  const glowY = 40 + 22 * Math.sin(frame / 70 + 1.3);
  const glowHue = T.cards[Math.floor(frame / 60) % T.cards.length];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(${168 + drift}deg, #0e0c2a 0%, ${midCol} 58%, #7a1f8e 130%)` }}>
      {/* travelling colored glow */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at ${glowX}% ${glowY}%, ${glowHue}22, transparent 42%)` }} />
      {PARTICLES.map((p, i) => {
        const y = (p.y - (frame * p.speed) / 3) % 116;
        const yy = y < -6 ? y + 122 : y;
        const x = p.x + p.sway * Math.sin(frame / 45 + p.phase);
        const base = p.spark ? 0.35 : 0.2;
        const amp = p.spark ? 0.4 : 0.26;
        const rate = p.spark ? 10 : 20;
        const tw = base + amp * (0.5 + 0.5 * Math.sin(frame / rate + p.phase));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${yy}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: T.cards[p.hue],
              opacity: tw,
              filter: p.spark ? "blur(0.5px)" : "blur(1px)",
              boxShadow: p.spark ? `0 0 8px ${T.cards[p.hue]}` : "none",
            }}
          />
        );
      })}
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.06), transparent 55%)" }} />
    </AbsoluteFill>
  );
};
