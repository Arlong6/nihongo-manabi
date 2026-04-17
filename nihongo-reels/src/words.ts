import daily from "../../marketing/daily_words.json";

export type Word = {
  japanese: string;
  reading: string;
  chinese: string;
  english: string;
  example: string;
  exampleChinese: string;
  level: string;
};

export const words: Word[] = daily as Word[];
