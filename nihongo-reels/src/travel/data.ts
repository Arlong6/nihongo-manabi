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
import tv11 from "./timings/11.json";
import tv12 from "./timings/12.json";
import tv13 from "./timings/13.json";
import tv14 from "./timings/14.json";
import tv15 from "./timings/15.json";
import tv16 from "./timings/16.json";

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
  {
    id: "11", situation: "結帳要收據", emoji: "🧾",
    phrase: "領収書をください。", reading: "りょうしゅうしょを ください", meaning: "請給我收據。",
    breakdown: [{ word: "領収書", role: "收據" }, { word: "を", role: "助詞" }, { word: "ください", role: "請給" }],
    response: { ja: "宛名はどうしますか？", reading: "あてなは どう しますか", zh: "抬頭怎麼開？" },
    tip: "出差報帳必備。對方會問抬頭，講「上で」就是空白。", timings: tv11,
  },
  {
    id: "12", situation: "問營業時間", emoji: "🕒",
    phrase: "何時まで開いていますか？", reading: "なんじまで あいて いますか", meaning: "開到幾點？",
    breakdown: [{ word: "何時まで", role: "到幾點" }, { word: "開いて", role: "開著" }, { word: "いますか", role: "嗎" }],
    response: { ja: "夜九時までです。", reading: "よる くじまで です", zh: "到晚上九點。" },
    tip: "「〜まで」= 截止點。改成「何時から」就是「從幾點開始」。", timings: tv12,
  },
  {
    id: "13", situation: "點餐告知過敏", emoji: "🥜",
    phrase: "アレルギーがあります。", reading: "アレルギーが あります", meaning: "我有過敏。",
    breakdown: [{ word: "アレルギー", role: "過敏" }, { word: "が", role: "助詞" }, { word: "あります", role: "有" }],
    response: { ja: "何のアレルギーですか？", reading: "なんの アレルギーですか", zh: "對什麼過敏？" },
    tip: "後接物名「〇〇のアレルギー」，例：そばのアレルギー。救命關鍵句。", timings: tv13,
  },
  {
    id: "14", situation: "便利商店買便當", emoji: "🍱",
    phrase: "温めてもらえますか？",
    reading: "あたためてもらえますか",
    meaning: "可以幫我加熱嗎？",
    breakdown: [
      { word: "温めて", role: "加熱（て形）" },
      { word: "もらえますか", role: "能幫我…嗎" },
    ],
    response: { ja: "はい、少々お待ちください。", reading: "はい、しょうしょうおまちください", zh: "好的，請稍等。" },
    tip: "店員通常會先問「温めますか？」，聽到就回「お願いします」就好。",
    timings: tv14,
  },
  {
    id: "15", situation: "藥妝店找藥", emoji: "💊",
    phrase: "頭痛に効く薬はありますか？",
    reading: "ずつうにきくくすりはありますか",
    meaning: "有治頭痛的藥嗎？",
    breakdown: [
      { word: "頭痛に", role: "對頭痛" },
      { word: "効く", role: "有效" },
      { word: "薬", role: "藥" },
    ],
    response: { ja: "こちらがおすすめです。", reading: "こちらがおすすめです", zh: "這款是我們推薦的。" },
    tip: "有過敏或正在吃藥，把「アレルギー」寫在手機備忘給藥師看最保險。",
    timings: tv15,
  },
  {
    id: "16", situation: "月台上不確定搭哪班", emoji: "🚃",
    phrase: "この電車は新宿に止まりますか？",
    reading: "このでんしゃはしんじゅくにとまりますか",
    meaning: "這班電車停新宿嗎？",
    breakdown: [
      { word: "この電車", role: "這班電車" },
      { word: "新宿に", role: "在新宿" },
      { word: "止まりますか", role: "停嗎" },
    ],
    response: { ja: "いいえ、快速は止まりません。", reading: "いいえ、かいそくはとまりません", zh: "不，快速列車不停。" },
    tip: "「各駅停車」每站都停；「快速」「特急」會跳站，上車前先看月台電子看板。",
    timings: tv16,
  },
];
