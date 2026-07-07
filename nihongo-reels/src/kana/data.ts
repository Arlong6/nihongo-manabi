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
import t11 from "./timings/11.json";
import t12 from "./timings/12.json";
import t13 from "./timings/13.json";
import t14 from "./timings/14.json";
import t15 from "./timings/15.json";
import t16 from "./timings/16.json";
import t17 from "./timings/17.json";

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
  {
    id: "11", kind: "hiragana",
    left: { char: "ね", word: "ねこ", reading: "ねこ", meaning: "貓" },
    right: { char: "れ", word: "れんしゅう", reading: "れんしゅう", meaning: "練習" },
    mnemonic: "ね 右下有圈、れ 右下沒圈直接收。",
    quizWhich: "left", timings: t11,
  },
  {
    id: "12", kind: "hiragana",
    left: { char: "ま", word: "まど", reading: "まど", meaning: "窗戶" },
    right: { char: "も", word: "もも", reading: "もも", meaning: "桃子" },
    mnemonic: "ま 中間有圈、も 中間是橫穿。",
    quizWhich: "right", timings: t12,
  },
  {
    id: "13", kind: "hiragana",
    left: { char: "ち", word: "ちず", reading: "ちず", meaning: "地圖" },
    right: { char: "ら", word: "らいねん", reading: "らいねん", meaning: "明年" },
    mnemonic: "ち 上面是 7、ら 上面是一撇。",
    quizWhich: "left", timings: t13,
  },
  {
    id: "14", kind: "katakana",
    left: { char: "ヌ", word: "ヌードル", reading: "ぬーどる", meaning: "麵類" },
    right: { char: "ス", word: "スープ", reading: "すーぷ", meaning: "湯" },
    mnemonic: "ヌ 多一撇、ス 是 J 形。",
    quizWhich: "right", timings: t14,
  },
  {
    id: "15", kind: "katakana",
    left: { char: "シ", word: "シャワー", reading: "しゃわー", meaning: "淋浴" },
    right: { char: "ツ", word: "ツナ", reading: "つな", meaning: "鮪魚" },
    mnemonic: "シ 的點橫著躺、ツ 的點站著排。",
    quizWhich: "left", timings: t15,
  },
  {
    id: "16", kind: "katakana",
    left: { char: "ソ", word: "ソース", reading: "そーす", meaning: "醬汁" },
    right: { char: "ン", word: "ラーメン", reading: "らーめん", meaning: "拉麵" },
    mnemonic: "ソ 由上往下畫、ン 由下往上甩。",
    quizWhich: "right", timings: t16,
  },
  {
    id: "17", kind: "hiragana",
    left: { char: "は", word: "はし", reading: "はし", meaning: "筷子" },
    right: { char: "ほ", word: "ほし", reading: "ほし", meaning: "星星" },
    mnemonic: "は 少一橫在吃飯、ほ 多一橫掛天上。",
    quizWhich: "left", timings: t17,
  },
];
