export type BreakdownPart = { word: string; role: string };

export type TravelTimings = {
  phrase: number;
  response: number;
};

export type TravelPhrase = {
  id: string;
  situation: string;
  emoji: string;
  phrase: string;
  reading: string;
  meaning: string;
  breakdown: BreakdownPart[];
  response: { ja: string; reading: string; zh: string };
  tip: string;
  timings?: TravelTimings;
};

import tv01 from "./timings/01.json";
import tv02 from "./timings/02.json";
import tv03 from "./timings/03.json";
import tv04 from "./timings/04.json";
import tv05 from "./timings/05.json";
import tv06 from "./timings/06.json";
import tv07 from "./timings/07.json";
import tv08 from "./timings/08.json";
import tv09 from "./timings/09.json";
import tv10 from "./timings/10.json";

export const travelPhrases: TravelPhrase[] = [
  {
    id: "01", situation: "在店裡結帳", emoji: "🛍️",
    phrase: "これください。", reading: "これ ください", meaning: "請給我這個。",
    breakdown: [{ word: "これ", role: "這個" }, { word: "ください", role: "請給" }],
    response: { ja: "かしこまりました。", reading: "かしこまりました", zh: "好的，我知道了。" },
    tip: "指著商品最好用，店員一看就懂。", timings: tv01,
  },
  {
    id: "02", situation: "在咖啡廳", emoji: "☕",
    phrase: "Wi-Fi ありますか？", reading: "わいふぁい ありますか", meaning: "有 Wi-Fi 嗎？",
    breakdown: [{ word: "Wi-Fi", role: "Wi-Fi" }, { word: "ありますか", role: "有嗎" }],
    response: { ja: "あります。パスワードはレシートに。", reading: "あります、パスワードはレシートに", zh: "有，密碼在收據上。" },
    tip: "ありますか 是萬用句：___ありますか？任何東西都可問。", timings: tv02,
  },
  {
    id: "03", situation: "在餐廳", emoji: "🍜",
    phrase: "英語のメニューありますか？", reading: "えいごの メニュー ありますか", meaning: "有英文菜單嗎？",
    breakdown: [{ word: "英語の", role: "英文的" }, { word: "メニュー", role: "菜單" }, { word: "ありますか", role: "有嗎" }],
    response: { ja: "こちらです。", reading: "こちらです", zh: "在這裡。" },
    tip: "的結構「〜の〇〇」，用 の 連接名詞。", timings: tv03,
  },
  {
    id: "04", situation: "結帳時", emoji: "💳",
    phrase: "カード使えますか？", reading: "カード つかえますか", meaning: "可以刷卡嗎？",
    breakdown: [{ word: "カード", role: "卡片" }, { word: "使えますか", role: "可以用嗎" }],
    response: { ja: "はい、Visaも使えます。", reading: "はい、Visaも つかえます", zh: "可以，Visa 也可以。" },
    tip: "「使えます」是「使う」的可能形。", timings: tv04,
  },
  {
    id: "05", situation: "觀光拍照", emoji: "📸",
    phrase: "写真撮ってもいいですか？", reading: "しゃしん とっても いいですか", meaning: "可以拍照嗎？",
    breakdown: [{ word: "写真", role: "照片" }, { word: "撮っても", role: "拍了也" }, { word: "いいですか", role: "可以嗎" }],
    response: { ja: "どうぞ。", reading: "どうぞ", zh: "請。" },
    tip: "「〜てもいいですか」是請求許可的超強句型。", timings: tv05,
  },
  {
    id: "06", situation: "點餐猶豫", emoji: "🍣",
    phrase: "おすすめは何ですか？", reading: "おすすめは なんですか", meaning: "有推薦的嗎？",
    breakdown: [{ word: "おすすめ", role: "推薦" }, { word: "は", role: "主題助詞" }, { word: "何ですか", role: "是什麼" }],
    response: { ja: "今日は鮮魚の刺身です。", reading: "きょうは せんぎょの さしみ です", zh: "今天是新鮮的生魚片。" },
    tip: "不知道點什麼，丟給店員最快。", timings: tv06,
  },
  {
    id: "07", situation: "在服飾店", emoji: "👗",
    phrase: "試着してもいいですか？", reading: "しちゃく しても いいですか", meaning: "可以試穿嗎？",
    breakdown: [{ word: "試着", role: "試穿" }, { word: "しても", role: "做了也" }, { word: "いいですか", role: "可以嗎" }],
    response: { ja: "あちらの試着室へどうぞ。", reading: "あちらの しちゃくしつへ どうぞ", zh: "請到那邊試衣間。" },
    tip: "「試着」= 試穿；同一句型可套到其他動作。", timings: tv07,
  },
  {
    id: "08", situation: "找廁所", emoji: "🚻",
    phrase: "トイレはどこですか？", reading: "トイレは どこですか", meaning: "洗手間在哪？",
    breakdown: [{ word: "トイレ", role: "洗手間" }, { word: "は", role: "助詞" }, { word: "どこですか", role: "在哪裡" }],
    response: { ja: "あの角を右へ。", reading: "あの かどを みぎへ", zh: "那個轉角右轉。" },
    tip: "「〜はどこですか」萬用找路句型。", timings: tv08,
  },
  {
    id: "09", situation: "點外帶", emoji: "🥡",
    phrase: "テイクアウトできますか？", reading: "テイクアウト できますか", meaning: "可以外帶嗎？",
    breakdown: [{ word: "テイクアウト", role: "外帶" }, { word: "できますか", role: "可以嗎" }],
    response: { ja: "はい、袋に入れますね。", reading: "はい、ふくろに いれますね", zh: "好的，幫您裝袋。" },
    tip: "日本店家「テイクアウト」跟「お持ち帰り」都能通。", timings: tv09,
  },
  {
    id: "10", situation: "飯店 Check-in", emoji: "🏨",
    phrase: "予約しました。", reading: "よやく しました", meaning: "我有預約。",
    breakdown: [{ word: "予約", role: "預約" }, { word: "しました", role: "做過（完成形）" }],
    response: { ja: "お名前をお願いします。", reading: "おなまえを おねがいします", zh: "請告訴我您的姓名。" },
    tip: "先講這句，接著對方會問名字，流程很順。", timings: tv10,
  },
];
