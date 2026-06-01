import type { AnimeTimings } from "./data";

export const animeTheme = {
  bg: "linear-gradient(180deg, #1a1033 0%, #2d1b5c 50%, #4a2a8c 100%)",
  paper: "#fdfbff",
  text: "#1a1033",
  textOnDark: "#fff",
  muted: "#b5a8d4",
  accent: "#ffd23f",
  accent2: "#ff6b9d",
  badge: "#ff6b9d",
  fontJa: '"Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif',
  fontZh: '"PingFang TC", "Microsoft JhengHei", sans-serif',
};

export const ANIME_FPS = 30;
export const ANIME_WIDTH = 1080;
export const ANIME_HEIGHT = 1920;
export const ANIME_BREATH = 1.2;

const toFrames = (sec: number) => Math.ceil(sec * ANIME_FPS);

export const animeSceneFrames = (t: AnimeTimings | undefined) => ({
  hook: toFrames(Math.max(3.0, (t?.hook_ch ?? 2.5) + 0.6)),
  quote: toFrames((t?.quote ?? 3.0) + ANIME_BREATH + 0.6),
  // Meaning scene has zh-TW narration. Stretch to fit the audio + a breath.
  meaning: toFrames(Math.max(3.0, (t?.meaning_ch ?? 2.5) + 1.0)),
  // Grammar scene now also has zh-TW narration of the grammar_point.
  grammar: toFrames(Math.max(3.5, (t?.grammar_ch ?? 3.0) + 0.8)),
  // Explanation scene has the longest zh-TW narration (80-120 chars ≈ 8-12s).
  explanation: toFrames(Math.max(7.0, (t?.explanation_ch ?? 6.0) + 0.8)),
  // Modern usage scene plays a character-voiced JP echo.
  modern: toFrames((t?.modern ?? 3.0) + ANIME_BREATH + 0.8),
  // CTA scene now has a CTA voice line.
  cta: toFrames(Math.max(2.8, (t?.cta_ch ?? 2.5) + 0.6)),
});

export const animeTotal = (t: AnimeTimings | undefined) => {
  const s = animeSceneFrames(t);
  return s.hook + s.quote + s.meaning + s.grammar + s.explanation + s.modern + s.cta;
};
