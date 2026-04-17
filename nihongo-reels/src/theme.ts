export const theme = {
  bg: "#1a1a2e",
  bgGradient: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
  text: "#ffffff",
  muted: "#a0a0b8",
  accent: "#e94560",
  accent2: "#f5a623",
  badge: "#0f3460",
  fontJa:
    '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh:
    '"PingFang TC", "Hiragino Sans TC", "Microsoft JhengHei", sans-serif',
};

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const SCENE = {
  hook: 60, // 0-2s
  word: 180, // 2-8s
  example: 240, // 8-16s
  tip: 120, // 16-20s
  cta: 150, // 20-25s
} as const;

export const TOTAL =
  SCENE.hook + SCENE.word + SCENE.example + SCENE.tip + SCENE.cta; // 750
