export type OopsTimings = {
  pitfall: number;
  correct: number;
};

export type OopsCase = {
  id: string;
  scenario: string;
  pitfall_phrase: string;
  pitfall_reading: string;
  why_wrong: string;
  correct_phrase: string;
  correct_reading: string;
  meaning: string;
  context_tip: string;
  emoji: string;
  timings?: OopsTimings;
};

import o01 from "./timings/01.json";
import o02 from "./timings/02.json";
import o03 from "./timings/03.json";
import o04 from "./timings/04.json";
import o05 from "./timings/05.json";
import o06 from "./timings/06.json";
import o07 from "./timings/07.json";
import o08 from "./timings/08.json";
import o09 from "./timings/09.json";
import o10 from "./timings/10.json";
import o11 from "./timings/11.json";
import o12 from "./timings/12.json";
import o13 from "./timings/13.json";
import o14 from "./timings/14.json";
import o15 from "./timings/15.json";
import o16 from "./timings/16.json";
import o17 from "./timings/17.json";
import o18 from "./timings/18.json";
import o19 from "./timings/19.json";
import o20 from "./timings/20.json";

export const oopsCases: OopsCase[] = [
  {
    id: "01",
    scenario: "便利商店店員問「要袋子嗎？」",
    pitfall_phrase: "大丈夫です。",
    pitfall_reading: "だいじょうぶです",
    why_wrong: "語意太曖昧！店員無法判斷你是「沒關係要袋子」還是「不需要袋子」，只能無奈再問一次。",
    correct_phrase: "いらないです。",
    correct_reading: "いらないです",
    meaning: "不用，謝謝。",
    context_tip: "台灣人常把「大丈夫」當「不用」拒絕，但在服務業情境它同時帶肯定與否定語感。面對二選一問句，直接說「いらないです」或「お願いします」才不卡關！",
    emoji: "🏪",
    timings: o01,
  },
  {
    id: "02",
    scenario: "居酒屋上沒點的小菜「お通し」",
    pitfall_phrase: "これ、頼んでいません！",
    pitfall_reading: "これ、たのんでいません",
    why_wrong: "語氣像在質疑店家送錯菜，店員會面露難色，氣氛瞬間僵硬。",
    correct_phrase: "これ、お通しですか？",
    correct_reading: "これ、おとおしですか",
    meaning: "請問這是開胃小菜（人頭費）嗎？",
    context_tip: "居酒屋的「お通し」等同強制基本消費。直接用強硬文法說沒點，會顯得不尊重當地文化。先禮貌確認，就能避免誤會並安心享受！",
    emoji: "🍻",
    timings: o02,
  },
  {
    id: "03",
    scenario: "餐廳用餐完想叫店員結帳",
    pitfall_phrase: "チェック、お願いします！",
    pitfall_reading: "ちぇっく、おねがいします",
    why_wrong: "語感太美式且偏商務檢查。雖有店員聽得懂，但日式小店用會不夠道地。",
    correct_phrase: "お会計、お願いします。",
    correct_reading: "おかいけい、おねがいします",
    meaning: "我要結帳。",
    context_tip: "日本最普及的結帳說法是「お会計」。一邊說一邊雙手食指交叉比「X」（日本結帳手勢），店員立刻心領神會把帳單拿過來！",
    emoji: "💰",
    timings: o03,
  },
  {
    id: "04",
    scenario: "服飾店想問「我可以試穿嗎？」",
    pitfall_phrase: "これ、着てください。",
    pitfall_reading: "これ、きてください",
    why_wrong: "文法大顛倒！「〜てください」是請對方做某事，這句變成「請店員穿給你看」。",
    correct_phrase: "試着してもいいですか？",
    correct_reading: "しちゃくしてもいいですか",
    meaning: "請問我可以試穿嗎？",
    context_tip: "尋求許可一定要用「〜てもいいですか（可以做...嗎？）」。搭配試穿的日文「試着」，店員會熱情引導你到試衣間！",
    emoji: "👕",
    timings: o04,
  },
  {
    id: "05",
    scenario: "藥妝店不小心擋到日本客人動線",
    pitfall_phrase: "ごめんなさい！",
    pitfall_reading: "ごめんなさい",
    why_wrong: "只是公共場合小摩擦，說「ごめんなさい」過於沉重，對方會嚇一跳不知所措。",
    correct_phrase: "すみません。",
    correct_reading: "すみません",
    meaning: "不好意思（借過一下）。",
    context_tip: "陌生人間的輕微越界、擋道，一律用「すみません」。這是維持文明邊界感。用「ごめんなさい」會破壞那層社會保護色，顯得太私人。",
    emoji: "💊",
    timings: o05,
  },
  {
    id: "06",
    scenario: "飯店退房想跟前台表達感謝",
    pitfall_phrase: "ありがとうございました！",
    pitfall_reading: "ありがとうございました",
    why_wrong: "雖然能用，但這只是流水線應答，無法傳達承蒙多日照顧的深刻謝意。",
    correct_phrase: "お世話になりました。",
    correct_reading: "おせわになりました",
    meaning: "這幾天承蒙您的照顧了。",
    context_tip: "「お世話になりました」是日文社交超高階的一句！停留過或被款待，離開時眼神對上說出來，日本人好感度瞬間爆棚，覺得你超懂禮儀！",
    emoji: "🏨",
    timings: o06,
  },
  {
    id: "07",
    scenario: "車站人潮中想穿過人群到剪票口",
    pitfall_phrase: "ごめん、通ります！",
    pitfall_reading: "ごめん、とおります",
    why_wrong: "「ごめん」是對熟人用的口語。對陌生路人大喊會顯得非常無禮。",
    correct_phrase: "すみません、通ります。",
    correct_reading: "すみません、とおります",
    meaning: "不好意思，借過一下。",
    context_tip: "在日本，無論對象年齡，公共場合需要陌生人配合，最安全的起手永遠是「すみません」。加上「通ります」大家會自律讓路！",
    emoji: "🚉",
    timings: o07,
  },
  {
    id: "08",
    scenario: "拉麵店店員端上拉麵時想回應",
    pitfall_phrase: "いただきます！",
    pitfall_reading: "いただきます",
    why_wrong: "對錯對象！「いただきます」是對食物大自然表達謝意，不是給服務生的回應。",
    correct_phrase: "ありがとうございます。",
    correct_reading: "ありがとうございます",
    meaning: "謝謝你。",
    context_tip: "「いただきます」是動筷子前的個人儀式。當店員端菜倒水，這是人際服務互動，看著店員點頭說謝謝才符合情境。",
    emoji: "🍜",
    timings: o08,
  },
  {
    id: "09",
    scenario: "伴手禮店想請店員推薦",
    pitfall_phrase: "どれが一番美味しいですか？",
    pitfall_reading: "どれがいちばんおいしいですか",
    why_wrong: "美味很主觀。店員為求客觀禮貌，通常會為難地回答「都很美味」。",
    correct_phrase: "一番人気があるのはどれですか？",
    correct_reading: "いちばんにんきがあるのはどれですか",
    meaning: "哪一個最受歡迎（最熱賣）？",
    context_tip: "日本人不喜歡替客人主觀感受下定義。改問客觀的「人気（熱賣）」或店家立場的「おすすめ（推薦）」，店員就能毫不顧慮指出銷量冠軍！",
    emoji: "🎁",
    timings: o09,
  },
  {
    id: "10",
    scenario: "想問店員「有沒有中文菜單？」",
    pitfall_phrase: "中国語のメニュー、あります？",
    pitfall_reading: "ちゅうごくごのめにゅー、あります",
    why_wrong: "語氣太生硬且句尾上揚，聽起來像在命令、質問店員，缺乏禮貌。",
    correct_phrase: "中国語のメニューはありますか？",
    correct_reading: "ちゅうごくごのめにゅーはありますか",
    meaning: "請問有中文的菜單嗎？",
    context_tip: "詢問有沒有某樣東西時，句尾一定要加「ますか」。多了這幾個字，整句從「粗魯質問」變「有教養詢問」，店員態度更熱情！",
    emoji: "🍣",
    timings: o10,
  },
  {
    id: "11",
    scenario: "小餐館用餐完店員說「謝謝光臨」時",
    pitfall_phrase: "（背對店員大喊）ごちそうさまでした！",
    pitfall_reading: "ごちそうさまでした",
    why_wrong: "句子沒錯，但常被頭也不回地一邊走一邊喊出，顯得粗魯敷衍。",
    correct_phrase: "ごちそうさまでした。美味しかったです！",
    correct_reading: "ごちそうさまでした。おいしかったです",
    meaning: "多謝款待，真的很好吃！",
    context_tip: "「ごちそうさまでした」精髓在人與人連結。完美時機：結完帳、跨出門口前，眼神跟店員對上、點頭微笑說，再補一句「很好吃」店員的心情會被點亮！",
    emoji: "🍱",
    timings: o11,
  },
  {
    id: "12",
    scenario: "電器行店員問「要不要拆外箱？」",
    pitfall_phrase: "いりません！",
    pitfall_reading: "いりません",
    why_wrong: "拒絕太生硬冰冷，聽起來像「少囉唆」，會讓熱心店員瞬間受挫。",
    correct_phrase: "そのままで大丈夫です。",
    correct_reading: "そのままでだいじょうぶです",
    meaning: "維持那樣就可以了（不用拆）。",
    context_tip: "日本文化講究「柔軟拒絕」。即使不需要，避免用死板的「いりません」。「そのままで」+「大丈夫」既明確表達不拆，又保留對店員的感激。",
    emoji: "📺",
    timings: o12,
  },
  {
    id: "13",
    scenario: "街上想問日本路人「車站怎麼走？」",
    pitfall_phrase: "あのう、駅はどこですか？",
    pitfall_reading: "あのう、えきはどこですか",
    why_wrong: "上來直接「車站在哪？」對重視邊界感的日本人來說太突兀沒緩衝。",
    correct_phrase: "駅に行きたいんですが、どう行けばいいですか？",
    correct_reading: "えきにいきたいんですが、どういけばいいですか",
    meaning: "我想去車站，請問該怎麼走呢？",
    context_tip: "問路起手要先「すみません」。用「〜んですが（我想...但...）」鋪墊，能營造「我有點困擾」的弱勢語感，日本人幫忙意願瞬間翻倍！",
    emoji: "🗺️",
    timings: o13,
  },
  {
    id: "14",
    scenario: "便利商店店員找零錢遞給你時",
    pitfall_phrase: "どうもありがとうございました！",
    pitfall_reading: "どうもありがとうございました",
    why_wrong: "這是最高規格正式道謝。一分鐘極速結帳情境用，會顯得用力過猛、太客套。",
    correct_phrase: "ありがとうございます。",
    correct_reading: "ありがとうございます",
    meaning: "謝謝。",
    context_tip: "日常的小恩小惠（找零、遞收據），日本人最常用「あ、どうも（啊，謝啦）」或輕點頭說謝謝。不用過去式，簡潔節奏符合便利商店文化。",
    emoji: "☕",
    timings: o14,
  },
  {
    id: "15",
    scenario: "百貨公司問鞋子「有沒有別的顏色？」",
    pitfall_phrase: "他の色、あります？",
    pitfall_reading: "ほかのいろ、あります",
    why_wrong: "少了助詞與禮貌句尾，聽起來像沒禮貌的網路留言，破壞購物氛圍。",
    correct_phrase: "これ、他の色はありますか？",
    correct_reading: "これ、ほかのいろはありますか",
    meaning: "這款還有其他顏色嗎？",
    context_tip: "問細節時，先用「これ」指著商品鎖定目標，再用標準「〜はありますか？」結尾。語氣最溫和有禮，店員更樂意去倉庫翻找！",
    emoji: "👟",
    timings: o15,
  },
  {
    id: "16",
    scenario: "餐廳指著隔壁桌的菜想點「我要那個」",
    pitfall_phrase: "あれ、ください！",
    pitfall_reading: "あれ、ください",
    why_wrong: "一邊喊一邊指著隔壁桌客人的食物，非常不禮貌，會讓日本路人感到尷尬。",
    correct_phrase: "これと同じものをください。",
    correct_reading: "これとおなじものをください",
    meaning: "請給我跟這個一樣的餐點。",
    context_tip: "別光明正大指著別人桌子。把店員拉到身邊，用手指菜單上的圖片，或小聲說「これと同じもの」，既點到美食又不會打擾別人。",
    emoji: "👉",
    timings: o16,
  },
  {
    id: "17",
    scenario: "居酒屋店員問要點什麼飲料",
    pitfall_phrase: "ビール、ビール！",
    pitfall_reading: "びーる、びーる",
    why_wrong: "瘋狂重複單字聽起來像小孩鬧脾氣，或毫無教養的客人在下命令，讓人反感。",
    correct_phrase: "とりあえずビールでお願いします。",
    correct_reading: "とりあえずびーるでおねがいします",
    meaning: "總之先給我們來杯啤酒吧！",
    context_tip: "日本居酒屋最靈魂的黃金社交句！「とりあえず」是「總之、先不管後面」。坐下說這句先上啤酒乾杯，後面慢慢點菜。學會超道地！",
    emoji: "🍺",
    timings: o17,
  },
  {
    id: "18",
    scenario: "想請路人幫忙拍照，遞過手機時",
    pitfall_phrase: "写真を撮ってください。",
    pitfall_reading: "しゃしんをとってください",
    why_wrong: "單向的強烈命令句「請幫我拍照」。對素不相識路人用命令句直接塞手機，會讓人覺得強人所難。",
    correct_phrase: "写真を撮っていただけますか？",
    correct_reading: "しゃしんをとっていただけますか",
    meaning: "可以請您幫我們拍張照嗎？",
    context_tip: "請求路人幫忙一定要用最高級客氣句型「〜ていただけますか」。配上「すみません」這整套組合拳，日本人聽來舒服，通常都樂意幫忙！",
    emoji: "📸",
    timings: o18,
  },
  {
    id: "19",
    scenario: "想跟店員確認「這樣可以嗎？」",
    pitfall_phrase: "いいですか？",
    pitfall_reading: "いいですか",
    why_wrong: "「いい」是雙面刃，既是「OK」也是「不用了」。單問這句，店員分不清你是要確認還是要拒絕。",
    correct_phrase: "これで大丈夫ですか？",
    correct_reading: "これでだいじょうぶですか",
    meaning: "請問這樣子可以嗎？",
    context_tip: "想確認動作、信用卡、填寫方式行不行得通，「大丈夫ですか？」比「いいですか」精準一百倍！疑問句的「大丈夫」代表「安全、無誤」，給店員明確核對方向。",
    emoji: "👌",
    timings: o19,
  },
  {
    id: "20",
    scenario: "拉麵店結帳時對著廚房大喊「不好意思」",
    pitfall_phrase: "（對廚房大喊）すみません！",
    pitfall_reading: "すみません",
    why_wrong: "主廚正在大火煮麵，這時大喊會打斷出菜節奏，且通常廚房噪音大，主廚也無法直接幫你結帳。",
    correct_phrase: "（對外場店員）お会計をお願いします。",
    correct_reading: "おかいけいをおねがいします",
    meaning: "我要結帳。",
    context_tip: "日本餐廳分工細緻：內場主廚專注料理，外場店員負責接待收銀。要結帳找外場店員眼神，或走到收銀台前再開口，這是尊重職人分工的餐飲禮儀！",
    emoji: "👨‍🍳",
    timings: o20,
  },
];
