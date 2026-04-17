export type KanaSide = {
  char: string;
  word: string;
  reading: string;
  meaning: string;
};

export type KanaTimings = {
  chars: number;
  example: number;
};

export type KanaPair = {
  id: string;
  kind: "hiragana" | "katakana";
  left: KanaSide;
  right: KanaSide;
  mnemonic: string;
  quizWhich: "left" | "right";
  timings?: KanaTimings;
};

import t01 from "./timings/01.json";
import t02 from "./timings/02.json";
import t03 from "./timings/03.json";
import t04 from "./timings/04.json";
import t05 from "./timings/05.json";
import t06 from "./timings/06.json";
import t07 from "./timings/07.json";
import t08 from "./timings/08.json";
import t09 from "./timings/09.json";
import t10 from "./timings/10.json";

export const kanaPairs: KanaPair[] = [
  {
    id: "01", kind: "katakana",
    left: { char: "ル", word: "ルビー", reading: "るびー", meaning: "紅寶石" },
    right: { char: "レ", word: "レモン", reading: "れもん", meaning: "檸檬" },
    mnemonic: "ル 尾巴翹起，レ 尾巴平直。",
    quizWhich: "left", timings: t01,
  },
  {
    id: "02", kind: "katakana",
    left: { char: "ウ", word: "ウサギ", reading: "うさぎ", meaning: "兔子" },
    right: { char: "ク", word: "クリーム", reading: "くりーむ", meaning: "奶油" },
    mnemonic: "ウ 有頂、ク 沒頂。",
    quizWhich: "right", timings: t02,
  },
  {
    id: "03", kind: "katakana",
    left: { char: "ナ", word: "ナイフ", reading: "ないふ", meaning: "刀子" },
    right: { char: "メ", word: "メガネ", reading: "めがね", meaning: "眼鏡" },
    mnemonic: "ナ 橫加 丿、メ 是兩撇交叉。",
    quizWhich: "left", timings: t03,
  },
  {
    id: "04", kind: "katakana",
    left: { char: "ハ", word: "ハサミ", reading: "はさみ", meaning: "剪刀" },
    right: { char: "ノ", word: "ノート", reading: "のーと", meaning: "筆記本" },
    mnemonic: "ハ 兩撇分開、ノ 只有一撇。",
    quizWhich: "right", timings: t04,
  },
  {
    id: "05", kind: "katakana",
    left: { char: "コ", word: "コーヒー", reading: "こーひー", meaning: "咖啡" },
    right: { char: "ユ", word: "ユニク", reading: "ゆにく", meaning: "獨特" },
    mnemonic: "コ 是ㄇ形、ユ 多一橫。",
    quizWhich: "left", timings: t05,
  },
  {
    id: "06", kind: "hiragana",
    left: { char: "き", word: "きつね", reading: "きつね", meaning: "狐狸" },
    right: { char: "さ", word: "さくら", reading: "さくら", meaning: "櫻花" },
    mnemonic: "き 有兩橫、さ 只有一橫。",
    quizWhich: "right", timings: t06,
  },
  {
    id: "07", kind: "hiragana",
    left: { char: "あ", word: "あき", reading: "あき", meaning: "秋天" },
    right: { char: "お", word: "おちゃ", reading: "おちゃ", meaning: "茶" },
    mnemonic: "あ 中間 +、お 右上有點。",
    quizWhich: "left", timings: t07,
  },
  {
    id: "08", kind: "hiragana",
    left: { char: "る", word: "るす", reading: "るす", meaning: "不在家" },
    right: { char: "ろ", word: "ろうそく", reading: "ろうそく", meaning: "蠟燭" },
    mnemonic: "る 有圈、ろ 沒有圈。",
    quizWhich: "right", timings: t08,
  },
  {
    id: "09", kind: "hiragana",
    left: { char: "わ", word: "わに", reading: "わに", meaning: "鱷魚" },
    right: { char: "れ", word: "れきし", reading: "れきし", meaning: "歷史" },
    mnemonic: "わ 右邊彎回、れ 右邊往下。",
    quizWhich: "left", timings: t09,
  },
  {
    id: "10", kind: "hiragana",
    left: { char: "ふ", word: "ふゆ", reading: "ふゆ", meaning: "冬天" },
    right: { char: "み", word: "みず", reading: "みず", meaning: "水" },
    mnemonic: "ふ 像波浪、み 像蛇的圈。",
    quizWhich: "right", timings: t10,
  },
];
