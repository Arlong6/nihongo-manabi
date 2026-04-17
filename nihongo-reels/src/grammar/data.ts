export type GrammarExample = { ja: string; zh: string };

export type GrammarTimings = {
  pattern: number;
  example1: number;
  example2: number;
  wrong: number;
  correct: number;
};

export type GrammarPoint = {
  id: string;
  pattern: string;
  meaning: string;
  level: string;
  example1: GrammarExample;
  example2: GrammarExample;
  wrong: GrammarExample;
  correct: GrammarExample;
  mistakeExplain: string;
  timings?: GrammarTimings;
};

import g01 from "./timings/01.json";
import g02 from "./timings/02.json";
import g03 from "./timings/03.json";
import g04 from "./timings/04.json";
import g05 from "./timings/05.json";
import g06 from "./timings/06.json";
import g07 from "./timings/07.json";
import g08 from "./timings/08.json";
import g09 from "./timings/09.json";
import g10 from "./timings/10.json";

export const grammarPoints: GrammarPoint[] = [
  {
    id: "01", pattern: "〜てしまう／〜ちゃう", meaning: "不小心／完成掉", level: "N4",
    example1: { ja: "財布を忘れてしまった。", zh: "不小心忘了錢包。" },
    example2: { ja: "ケーキを全部食べちゃった。", zh: "把蛋糕全吃完了。" },
    wrong: { ja: "財布を忘れた、しまった。", zh: "（錯誤）" },
    correct: { ja: "財布を忘れてしまった。", zh: "不小心忘了錢包。" },
    mistakeExplain: "「しまう」要接て形，不是單獨放句尾。",
    timings: g01,
  },
  {
    id: "02", pattern: "〜ばかり", meaning: "老是／才剛", level: "N4",
    example1: { ja: "彼はゲームばかりしている。", zh: "他老是在打電動。" },
    example2: { ja: "日本に来たばかりです。", zh: "才剛來日本。" },
    wrong: { ja: "彼はゲーム沢山している。", zh: "（意思不對）" },
    correct: { ja: "彼はゲームばかりしている。", zh: "他老是在打電動。" },
    mistakeExplain: "「ばかり」強調「光是」的負面感，「たくさん」只是量多。",
    timings: g02,
  },
  {
    id: "03", pattern: "〜なければならない", meaning: "必須", level: "N5",
    example1: { ja: "薬を飲まなければならない。", zh: "必須吃藥。" },
    example2: { ja: "明日早く起きなければならない。", zh: "明天必須早起。" },
    wrong: { ja: "薬を飲まない必要がある。", zh: "（錯誤）" },
    correct: { ja: "薬を飲む必要がある。", zh: "必須吃藥（另一種說法）。" },
    mistakeExplain: "「なければ」是否定形接續，別跟「必要」搞混。",
    timings: g03,
  },
  {
    id: "04", pattern: "〜ことができる", meaning: "能夠／會", level: "N4",
    example1: { ja: "日本語を話すことができる。", zh: "會說日文。" },
    example2: { ja: "泳ぐことができません。", zh: "不會游泳。" },
    wrong: { ja: "日本語が話すことができる。", zh: "（助詞錯）" },
    correct: { ja: "日本語を話すことができる。", zh: "會說日文。" },
    mistakeExplain: "動詞前用「を」，不是「が」。「が」是給「できる」單獨用。",
    timings: g04,
  },
  {
    id: "05", pattern: "〜ために", meaning: "為了", level: "N3",
    example1: { ja: "健康のために運動する。", zh: "為了健康而運動。" },
    example2: { ja: "日本に行くために貯金する。", zh: "為了去日本而存錢。" },
    wrong: { ja: "健康ために運動する。", zh: "（漏の）" },
    correct: { ja: "健康のために運動する。", zh: "為了健康而運動。" },
    mistakeExplain: "名詞 + ために 要加「の」；動詞才直接接。",
    timings: g05,
  },
  {
    id: "06", pattern: "〜ながら", meaning: "一邊…一邊", level: "N4",
    example1: { ja: "音楽を聞きながら勉強する。", zh: "一邊聽音樂一邊讀書。" },
    example2: { ja: "歩きながら話さないで。", zh: "不要邊走邊說話。" },
    wrong: { ja: "音楽を聞きますながら勉強する。", zh: "（錯誤）" },
    correct: { ja: "音楽を聞きながら勉強する。", zh: "一邊聽音樂一邊讀書。" },
    mistakeExplain: "「ながら」接動詞ます形去ます，不是直接接ます。",
    timings: g06,
  },
  {
    id: "07", pattern: "〜そうだ（聽說）", meaning: "聽說", level: "N4",
    example1: { ja: "明日は雨だそうだ。", zh: "聽說明天會下雨。" },
    example2: { ja: "彼は結婚するそうだ。", zh: "聽說他要結婚。" },
    wrong: { ja: "明日は雨そうだ。", zh: "（漏だ）" },
    correct: { ja: "明日は雨だそうだ。", zh: "聽說明天會下雨。" },
    mistakeExplain: "名詞 + そうだ（聽說）要「だ」；形容詞看樣子是另一種「そうだ」。",
    timings: g07,
  },
  {
    id: "08", pattern: "〜らしい", meaning: "好像／像是", level: "N3",
    example1: { ja: "彼は先生らしい。", zh: "他好像是老師。" },
    example2: { ja: "男らしい人だ。", zh: "很有男子氣概的人。" },
    wrong: { ja: "彼は先生らしく。", zh: "（活用錯）" },
    correct: { ja: "彼は先生らしい。", zh: "他好像是老師。" },
    mistakeExplain: "「らしい」是い形容詞活用，當結論用收在「らしい」。",
    timings: g08,
  },
  {
    id: "09", pattern: "〜はずだ", meaning: "應該會／按理說", level: "N3",
    example1: { ja: "彼は今日来るはずだ。", zh: "他今天應該會來。" },
    example2: { ja: "鍵はここにあるはずだ。", zh: "鑰匙應該在這裡。" },
    wrong: { ja: "彼は来るはずじゃない。", zh: "（錯誤）" },
    correct: { ja: "彼は来ないはずだ。", zh: "他應該不會來。" },
    mistakeExplain: "否定要放動詞，不是放「はず」後面。",
    timings: g09,
  },
  {
    id: "10", pattern: "〜のに", meaning: "明明／卻", level: "N4",
    example1: { ja: "勉強したのにテストで落ちた。", zh: "明明讀書了卻考不好。" },
    example2: { ja: "高いのに美味しくない。", zh: "很貴卻不好吃。" },
    wrong: { ja: "勉強した、のにテストで落ちた。", zh: "（斷句錯）" },
    correct: { ja: "勉強したのにテストで落ちた。", zh: "明明讀書了卻考不好。" },
    mistakeExplain: "「のに」要直接接在前句末尾，不能斷句。",
    timings: g10,
  },
];
