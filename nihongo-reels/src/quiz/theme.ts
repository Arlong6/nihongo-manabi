import type { QuizTimings } from "./data";

export const quizTheme = {
  bg: "linear-gradient(170deg, #0e0c2a 0%, #241454 60%, #7a1f8e 130%)",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.7)",
  cards: ["#ff5f8f", "#3fd8ff", "#3df0a8", "#ffd23f"],
  cardText: "#141230",
  right: "#3df0a8",
  dim: 0.25,
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const QUIZ_FPS = 30;
export const QUIZ_WIDTH = 1080;
export const QUIZ_HEIGHT = 1920;

const toFrames = (sec: number) => Math.ceil(sec * QUIZ_FPS);

export const quizSceneFrames = (t: QuizTimings | undefined) => ({
  hook: toFrames(3.0),
  countdown: toFrames(5.0),
  reveal: toFrames((t?.answer ?? 2.5) + 3.5),
  cta: toFrames(3.0),
});

export const quizTotal = (t: QuizTimings | undefined) => {
  const s = quizSceneFrames(t);
  return s.hook + s.countdown + s.reveal + s.cta;
};
