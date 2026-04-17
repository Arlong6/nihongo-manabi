import type { KanaTimings } from "./data";

export const kanaTheme = {
  bg: "linear-gradient(180deg, #ffe5f0 0%, #e0f4ff 100%)",
  text: "#2a2a3e",
  muted: "#6a6a7e",
  accentL: "#e94a8b",
  accentR: "#3fb6e0",
  accentOk: "#2bb673",
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
