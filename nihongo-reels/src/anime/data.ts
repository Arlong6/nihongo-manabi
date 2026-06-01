export type AnimeTimings = {
  quote: number;
  modern?: number;
  meaning_ch?: number;
  explanation_ch?: number;
  hook_ch?: number;
  grammar_ch?: number;
  cta_ch?: number;
};

export type AnimeQuote = {
  id: string;
  anime: string;
  anime_en: string;
  character: string;
  quote: string;
  reading: string;
  meaning: string;
  grammar_point: string;
  explanation: string;
  modern_usage: string;
  emoji: string;
  timings?: AnimeTimings;
};

import a01 from "./timings/01.json";
import a02 from "./timings/02.json";
import a03 from "./timings/03.json";
import a04 from "./timings/04.json";
import a05 from "./timings/05.json";
import a06 from "./timings/06.json";
import a07 from "./timings/07.json";
import a08 from "./timings/08.json";
import a09 from "./timings/09.json";
import a10 from "./timings/10.json";
import a11 from "./timings/11.json";
import a12 from "./timings/12.json";
import a13 from "./timings/13.json";
import a14 from "./timings/14.json";
import a15 from "./timings/15.json";
import a16 from "./timings/16.json";
import a17 from "./timings/17.json";

export const animeQuotes: AnimeQuote[] = [
  {
    id: "01",
    anime: "火影忍者",
    anime_en: "Naruto",
    character: "漩渦鳴人",
    quote: "だってばよ！",
    reading: "だってばよ",
    meaning: "就是說咩！反正就是這樣啦！",
    grammar_point: "強烈語氣的口頭禪與強調句尾",
    explanation: "鳴人的招牌口頭禪！「だって」是「因為、可是」，「ば」帶強調與不耐煩感，「よ」是句尾告知。雖是動漫專屬自創組合，但完美展現了極度想說服別人、帶點中二與任性的說話節奏。",
    modern_usage: "現代日本人會用變形「〜だってば！」對熟人撒嬌或表示微慍。",
    emoji: "🦊",
    timings: a01,
  },
  {
    id: "02",
    anime: "JOJO的奇妙冒險",
    anime_en: "JoJo's Bizarre Adventure",
    character: "迪奧",
    quote: "無駄無駄無駄！",
    reading: "むだむだむだ",
    meaning: "沒用沒用沒用！",
    grammar_point: "重複名詞作形容動詞的壓倒性否定",
    explanation: "DIO 連擊時的必備台詞。「無駄」本意是徒勞、浪費。重複三次以上會產生「你做什麼都白工」的絕對壓制感，被 JOJO 大張力配音一催，變成極具羞辱感與自信的代名詞。",
    modern_usage: "朋友做無意義掙扎（快遲到還慢慢化妝），可幽默吐槽「無駄無駄！」",
    emoji: "🧛",
    timings: a02,
  },
  {
    id: "03",
    anime: "咒術迴戰",
    anime_en: "Jujutsu Kaisen",
    character: "五條悟",
    quote: "大丈夫、僕最強だから。",
    reading: "だいじょうぶ ぼくさいきょうだから",
    meaning: "沒事啦，因為我可是最強的。",
    grammar_point: "原因助詞「だから」的句尾倒裝用法",
    explanation: "五條悟最帥的自信發言。正常文法把「だから」放在前面，他故意倒裝把「大丈夫」先丟，後補理由。這種倒裝在口語中常見，能把最飽滿的情緒先給對方，後面再帥氣補上理由。",
    modern_usage: "幫朋友打氣、展現可靠感時：「大丈夫、俺いるから。」",
    emoji: "🕶️",
    timings: a03,
  },
  {
    id: "04",
    anime: "進擊的巨人",
    anime_en: "Attack on Titan",
    character: "艾連",
    quote: "駆逐してやる！",
    reading: "くちくしてやる",
    meaning: "我要把他們全趕盡殺絕！",
    grammar_point: "動詞て形 + 上對下的「〜てやる」",
    explanation: "艾連看著母親被吞噬時的憤怒誓言。「駆逐」是高高在上的軍事用語，「〜てやる」字面是「做給你看」，在對敵人的語境下帶有「老子絕對要制裁你」的強烈惡意與決心。",
    modern_usage: "上班族開玩笑：夏天看到房間有蚊子時大喊「駆逐してやる！」",
    emoji: "⚔️",
    timings: a04,
  },
  {
    id: "05",
    anime: "航海王",
    anime_en: "One Piece",
    character: "魯夫",
    quote: "海賊王に、俺はなる！",
    reading: "かいぞくおうに おれはなる",
    meaning: "海賊王，我當定了！",
    grammar_point: "目的語提前的「に」變形倒裝句",
    explanation: "課本文法應該是「俺は海賊王になる」。魯夫偏偏把「海賊王に」放最前！口語中把靈魂核心名詞砸在句首，能讓聽者第一秒就抓住你的野心，不是宣示，是要把夢想刻進腦海。",
    modern_usage: "新年許願、發表大志向：「億万長者に、俺はなる！」",
    emoji: "👒",
    timings: a05,
  },
  {
    id: "06",
    anime: "北斗神拳",
    anime_en: "Fist of the North Star",
    character: "拳四郎",
    quote: "お前はもう死んでいる。",
    reading: "おまえはもうしんでいる",
    meaning: "你已經死了。",
    grammar_point: "瞬間動詞「死ぬ」+ 狀態持續體「〜ている」",
    explanation: "動漫界迷因始祖！很多人以為「〜ている」只表「正在做」，但接在「死ぬ」這種瞬間動詞後，代表「動作完成後的狀態持續」。意思不是正在死，而是「死亡命運已完成，活著只是假象」。",
    modern_usage: "打遊戲對手血條歸零、考試完蛋自嘲：「もう死んでいる。」",
    emoji: "👊",
    timings: a06,
  },
  {
    id: "07",
    anime: "鬼滅之刃",
    anime_en: "Demon Slayer",
    character: "煉獄杏壽郎",
    quote: "心を燃やせ。",
    reading: "こころをもやせ",
    meaning: "燃燒心靈吧！",
    grammar_point: "他動詞「燃やす」的命令形「〜せ」",
    explanation: "煉獄留給炭治郎的燃魂金句！命令形通常給人粗魯感，但在傳承時刻反而轉化成「不容質疑的強大信念」。他動詞「燃やせ」比自動詞更有「主動掌控生命熱情」的壯烈感。",
    modern_usage: "面對死線、加班衝刺時，同事間互相打氣：「心を燃やせ！」",
    emoji: "🔥",
    timings: a07,
  },
  {
    id: "08",
    anime: "東京復仇者",
    anime_en: "Tokyo Revengers",
    character: "佐野萬次郎",
    quote: "日和ってる奴いる？",
    reading: "ひよってるやついる",
    meaning: "有人在退縮/怯戰的嗎？",
    grammar_point: "流行語「ひよる」+ 現在進行式省略",
    explanation: "Mikey 集會名台詞，引爆日本流行語大賞！「ひよる」原是政治術語「觀望」，被不良少年傳開後變成「遇事就退縮」。句尾省略「か」用上揚「いる？」，不怒而威，全場氣勢拉滿。",
    modern_usage: "朋友突然不敢玩大老二、不敢高空彈跳：「ひよってる奴いる？」",
    emoji: "🏍️",
    timings: a08,
  },
  {
    id: "09",
    anime: "銀魂",
    anime_en: "Gintama",
    character: "坂田銀時",
    quote: "ギャーギャー言うな！",
    reading: "ぎゃーぎゃーいうな",
    meaning: "少在那邊嘰嘰歪歪！",
    grammar_point: "動詞原形 + 「な」的強烈禁止形",
    explanation: "日文最直接的禁止：動詞原形+「な」。配上擬聲詞「ギャーギャー」（形容尖叫吵鬧），整句聽起來就像阿銀挖著鼻孔不耐煩叫人閉嘴，生活感十足。",
    modern_usage: "對嘮叨死黨、抱怨不停的朋友開玩笑：「ギャーギャー言うな！」",
    emoji: "🍓",
    timings: a09,
  },
  {
    id: "10",
    anime: "一拳超人",
    anime_en: "One Punch Man",
    character: "埼玉",
    quote: "趣味でヒーローをやっている者だ。",
    reading: "しゅみでひーろーをやっているものだ",
    meaning: "我只是憑興趣在當英雄的人。",
    grammar_point: "名詞 + 「で」表示原因或動機",
    explanation: "埼玉老師最無情的自我介紹。一般英雄會說為了正義，他用「趣味で」。助詞「で」限定做事的出發點，最後用「者だ」結尾，極度低調的語氣跟他無敵實力形成超級反差萌。",
    modern_usage: "裝低調：電競高手說「趣味でゲームをやっている者だ。」",
    emoji: "🥚",
    timings: a10,
  },
  {
    id: "11",
    anime: "航海王",
    anime_en: "One Piece",
    character: "喬巴",
    quote: "そんなに褒められても嬉しくねぇよ！",
    reading: "そんなにほめられてもうれしくねぇよ",
    meaning: "就算這樣誇我，我也不會高興啦！",
    grammar_point: "被動「られる」+ 傲嬌口語「〜ねぇ」",
    explanation: "喬巴口嫌體正直的標準台詞。「褒める」變被動「褒められて」，接「も（即使）」。否定「ない」粗魯化成「ねぇ」，這種「老子才沒開心」的傲嬌語氣，配上扭動肢體，就是反差精髓。",
    modern_usage: "被瘋狂誇獎、暗爽但想裝酷時直接複製這句回應！",
    emoji: "🦌",
    timings: a11,
  },
  {
    id: "12",
    anime: "名偵探柯南",
    anime_en: "Detective Conan",
    character: "江戶川柯南",
    quote: "真実はいつも一つ！",
    reading: "しんじつはいつもひとつ",
    meaning: "真相永遠只有一個！",
    grammar_point: "時間副詞「いつも」+ 數量詞的強調",
    explanation: "陪伴無數人長大的神級台詞。主詞「真実」+「は」+ 副詞「いつも」+ 數量「一つ」，省略「だ」。口語省略斷定助動詞能讓語氣更加斬釘截鐵，極具正義感與權威性。",
    modern_usage: "抓到朋友偷吃最後一塊蛋糕時指著對方大喊。",
    emoji: "👓",
    timings: a12,
  },
  {
    id: "13",
    anime: "美少女戰士",
    anime_en: "Sailor Moon",
    character: "月野兔",
    quote: "月に代わってお仕置きよ！",
    reading: "つきにかわっておしおきよ",
    meaning: "我要代替月亮懲罰你！",
    grammar_point: "慣用語「〜に代わって」+ 美化語「お」",
    explanation: "經典變身台詞。「〜に代わって」是「代替、代表某人」。有趣的是「仕置き」前面加美化的「お」，最後配女性化句尾「よ」。把「老子要揍你」用優雅溫柔的女性語氣說出來，正是魔法少女魅力。",
    modern_usage: "開玩笑教訓朋友、媽媽要懲罰調皮小孩時都能套用。",
    emoji: "🌙",
    timings: a13,
  },
  {
    id: "14",
    anime: "排球少年",
    anime_en: "Haikyu!!",
    character: "日向翔陽",
    quote: "おれにトス、持ってこい！",
    reading: "おれにとす もってこい",
    meaning: "把球傳給我！",
    grammar_point: "複合動詞「持ってくる」的命令形「〜こい」",
    explanation: "日向震撼全場的球權渴望。「持つ」+「来る」變複合動詞「持ってくる」，他直接把「来る」轉成最硬派命令「こい」。軟萌身材矮小的角色突然用不容置疑命令句，野心溢滿出來。",
    modern_usage: "想主動承擔核心任務：「その仕事、おれに持ってこい！」",
    emoji: "🏐",
    timings: a14,
  },
  {
    id: "15",
    anime: "七龍珠",
    anime_en: "Dragon Ball",
    character: "達爾",
    quote: "まるで戦闘力のバーゲンセールだな。",
    reading: "まるでせんとうりょくのばーげんせーるだな",
    meaning: "簡直就像戰鬥力在大特價一樣啊。",
    grammar_point: "比喻副詞「まるで」+ 句尾「だな」嘲諷",
    explanation: "達爾自尊心受創的名嘲諷。「まるで」要搭「〜ようだ」或「〜だな」做比喻。他把高貴賽亞人戰鬥力比喻成百貨「バーゲンセール（大特價）」，高傲中帶滿滿酸味的黑色幽默。",
    modern_usage: "原本稀有東西突然滿街都是時：「戦闘力のバーゲンセール」",
    emoji: "🥦",
    timings: a15,
  },
  {
    id: "16",
    anime: "灌籃高手",
    anime_en: "Slam Dunk",
    character: "安西教練",
    quote: "あきらめたらそこで試合終了ですよ。",
    reading: "あきらめたらそこでしあいしゅうりょうですよ",
    meaning: "現在放棄的話，比賽就結束了喔。",
    grammar_point: "假設「〜たら」+ 溫柔叮嚀「ですよ」",
    explanation: "動漫史最強雞湯。「あきらめる」過去式+「ら」變假設「如果放棄」。「そこで」精準指出放棄的瞬間。安西用「〜ですよ」溫柔提醒，比一昧說教更能直擊靈魂深處。",
    modern_usage: "已超越動漫成為社會通用語。減肥想偷吃時都會被拿出來用。",
    emoji: "🏀",
    timings: a16,
  },
  {
    id: "17",
    anime: "JOJO的奇妙冒險",
    anime_en: "JoJo's Bizarre Adventure",
    character: "岸邊露伴",
    quote: "だが断る。",
    reading: "だがことわる",
    meaning: "但我拒絕。",
    grammar_point: "逆接連詞「だが」造成的超神速語意轉折",
    explanation: "JOJO 最帥拒絕方式！「だが」是極硬的書面語逆接連詞。岸邊面對誘惑時先順著節奏，再突然用「だが断る」瞬間斷開。毫無商量餘地、極度貫徹個人美學，玩弄對手於股掌之間的致命快感。",
    modern_usage: "朋友提誘人或理所當然提議想搞笑拒絕時，神回覆。",
    emoji: "✒️",
    timings: a17,
  },
];
