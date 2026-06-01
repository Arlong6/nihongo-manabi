import type { OopsTimings } from "./data";

export const oopsTheme = {
  bg: "linear-gradient(180deg, #fff8e7 0%, #ffe2c5 60%, #ffc8a8 100%)",
  paper: "#ffffff",
  text: "#2d1f0e",
  muted: "#8a6e4a",
  bad: "#e74c3c",
  badBg: "#ffe5e0",
  good: "#27ae60",
  goodBg: "#e0f5e9",
  accent: "#f39c12",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const OOPS_FPS = 30;
export const OOPS_WIDTH = 1080;
export const OOPS_HEIGHT = 1920;
export const OOPS_BREATH = 1.2;

const toFrames = (sec: number) => Math.ceil(sec * OOPS_FPS);

export const oopsSceneFrames = (t: OopsTimings | undefined) => ({
  hook: toFrames(3.2),
  pitfall: toFrames((t?.pitfall ?? 3.0) + OOPS_BREATH + 0.5),
  why: toFrames(4.0),
  correct: toFrames((t?.correct ?? 3.0) + OOPS_BREATH + 0.5),
  tip: toFrames(6.0),
  cta: toFrames(2.8),
});

export const oopsTotal = (t: OopsTimings | undefined) => {
  const s = oopsSceneFrames(t);
  return s.hook + s.pitfall + s.why + s.correct + s.tip + s.cta;
};
