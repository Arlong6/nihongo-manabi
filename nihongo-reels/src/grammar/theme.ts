import type { GrammarTimings } from "./data";

export const grammarTheme = {
  bg: "linear-gradient(180deg, #f0fff4 0%, #e0f5eb 100%)",
  paper: "#ffffff",
  text: "#1f3a2a",
  muted: "#5a7a6a",
  accent: "#2bb673",
  wrong: "#e94560",
  right: "#2bb673",
  level: "#6c5ce7",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const GRAMMAR_FPS = 30;
export const GRAMMAR_WIDTH = 1080;
export const GRAMMAR_HEIGHT = 1920;
export const GRAMMAR_BREATH = 1.2;

const toFrames = (sec: number) => Math.ceil(sec * GRAMMAR_FPS);

export const grammarSceneFrames = (t: GrammarTimings | undefined) => ({
  hook: toFrames(3.0),
  pattern: toFrames((t?.pattern ?? 2.5) + GRAMMAR_BREATH),
  example1: toFrames((t?.example1 ?? 3.5) + GRAMMAR_BREATH),
  example2: toFrames((t?.example2 ?? 3.5) + GRAMMAR_BREATH),
  mistake: toFrames((t?.wrong ?? 3.0) + (t?.correct ?? 3.0) + GRAMMAR_BREATH + 1.0),
  cta: toFrames(2.8),
});

export const grammarTotal = (t: GrammarTimings | undefined) => {
  const s = grammarSceneFrames(t);
  return s.hook + s.pattern + s.example1 + s.example2 + s.mistake + s.cta;
};
