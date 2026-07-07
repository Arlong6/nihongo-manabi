import type { TravelTimings } from "./data";

export const travelTheme = {
  bg: "linear-gradient(180deg, #ffe9c2 0%, #ffc37a 55%, #7ac2ff 130%)",
  paper: "#fffdf5",
  text: "#2d1f0e",
  muted: "#8a6e4a",
  accent: "#ff6a00",
  accent2: "#0d8bff",
  badge: "#ff6a00",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const TRAVEL_FPS = 30;
export const TRAVEL_WIDTH = 1080;
export const TRAVEL_HEIGHT = 1920;
export const TRAVEL_BREATH = 1.2;

const toFrames = (sec: number) => Math.ceil(sec * TRAVEL_FPS);

export const travelSceneFrames = (t: TravelTimings | undefined) => ({
  hook: toFrames(3.2),
  phrase: toFrames((t?.phrase ?? 3.2) + TRAVEL_BREATH + 0.5),
  breakdown: toFrames(4.5),
  response: toFrames((t?.response ?? 3.2) + TRAVEL_BREATH),
  tip: toFrames(3.5),
  cta: toFrames(2.8),
});

export const travelTotal = (t: TravelTimings | undefined) => {
  const s = travelSceneFrames(t);
  return s.hook + s.phrase + s.breakdown + s.response + s.tip + s.cta;
};
