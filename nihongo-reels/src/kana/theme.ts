import type { KanaTimings } from "./data";

export const kanaTheme = {
  bg: "linear-gradient(165deg, #191036 0%, #3b1660 55%, #c2247a 130%)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.72)",
  accentL: "#ff6ea9",
  accentR: "#4fd8ff",
  accentOk: "#35f0a6",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const KANA_FPS = 30;
export const KANA_WIDTH = 1080;
export const KANA_HEIGHT = 1920;
export const KANA_BREATH = 1.0;

const toFrames = (sec: number) => Math.ceil(sec * KANA_FPS);

export const kanaSceneFrames = (t: KanaTimings | undefined) => {
  const chars = t?.chars ?? 2.0;
  const example = t?.example ?? 3.0;
  return {
    hook: toFrames(chars + KANA_BREATH + 0.5),
    quiz: toFrames(2.5),
    answer: toFrames(2.8),
    example: toFrames(example + KANA_BREATH + 0.5),
    cta: toFrames(2.5),
  };
};

export const kanaTotal = (t: KanaTimings | undefined) => {
  const s = kanaSceneFrames(t);
  return s.hook + s.quiz + s.answer + s.example + s.cta;
};
