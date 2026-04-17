import type { KatakanaChar } from '../types'

export const katakanaChars: KatakanaChar[] = [
  // ア行
  { katakana: 'ア', romaji: 'a', hiragana: 'あ' },
  { katakana: 'イ', romaji: 'i', hiragana: 'い' },
  { katakana: 'ウ', romaji: 'u', hiragana: 'う' },
  { katakana: 'エ', romaji: 'e', hiragana: 'え' },
  { katakana: 'オ', romaji: 'o', hiragana: 'お' },
  // カ行
  { katakana: 'カ', romaji: 'ka', hiragana: 'か' },
  { katakana: 'キ', romaji: 'ki', hiragana: 'き' },
  { katakana: 'ク', romaji: 'ku', hiragana: 'く' },
  { katakana: 'ケ', romaji: 'ke', hiragana: 'け' },
  { katakana: 'コ', romaji: 'ko', hiragana: 'こ' },
  // サ行
  { katakana: 'サ', romaji: 'sa', hiragana: 'さ' },
  { katakana: 'シ', romaji: 'shi', hiragana: 'し', similar: ['ツ', 'ン'] },
  { katakana: 'ス', romaji: 'su', hiragana: 'す' },
  { katakana: 'セ', romaji: 'se', hiragana: 'せ' },
  { katakana: 'ソ', romaji: 'so', hiragana: 'そ', similar: ['ン', 'リ'] },
  // タ行
  { katakana: 'タ', romaji: 'ta', hiragana: 'た' },
  { katakana: 'チ', romaji: 'chi', hiragana: 'ち' },
  { katakana: 'ツ', romaji: 'tsu', hiragana: 'つ', similar: ['シ', 'ソ'] },
  { katakana: 'テ', romaji: 'te', hiragana: 'て' },
  { katakana: 'ト', romaji: 'to', hiragana: 'と' },
  // ナ行
  { katakana: 'ナ', romaji: 'na', hiragana: 'な' },
  { katakana: 'ニ', romaji: 'ni', hiragana: 'に' },
  { katakana: 'ヌ', romaji: 'nu', hiragana: 'ぬ' },
  { katakana: 'ネ', romaji: 'ne', hiragana: 'ね' },
  { katakana: 'ノ', romaji: 'no', hiragana: 'の' },
  // ハ行
  { katakana: 'ハ', romaji: 'ha', hiragana: 'は' },
  { katakana: 'ヒ', romaji: 'hi', hiragana: 'ひ' },
  { katakana: 'フ', romaji: 'fu', hiragana: 'ふ' },
  { katakana: 'ヘ', romaji: 'he', hiragana: 'へ' },
  { katakana: 'ホ', romaji: 'ho', hiragana: 'ほ' },
  // マ行
  { katakana: 'マ', romaji: 'ma', hiragana: 'ま' },
  { katakana: 'ミ', romaji: 'mi', hiragana: 'み' },
  { katakana: 'ム', romaji: 'mu', hiragana: 'む' },
  { katakana: 'メ', romaji: 'me', hiragana: 'め' },
  { katakana: 'モ', romaji: 'mo', hiragana: 'も' },
  // ヤ行
  { katakana: 'ヤ', romaji: 'ya', hiragana: 'や' },
  { katakana: 'ユ', romaji: 'yu', hiragana: 'ゆ' },
  { katakana: 'ヨ', romaji: 'yo', hiragana: 'よ' },
  // ラ行
  { katakana: 'ラ', romaji: 'ra', hiragana: 'ら' },
  { katakana: 'リ', romaji: 'ri', hiragana: 'り', similar: ['ソ', 'ン'] },
  { katakana: 'ル', romaji: 'ru', hiragana: 'る' },
  { katakana: 'レ', romaji: 're', hiragana: 'れ' },
  { katakana: 'ロ', romaji: 'ro', hiragana: 'ろ' },
  // ワ行
  { katakana: 'ワ', romaji: 'wa', hiragana: 'わ' },
  { katakana: 'ヲ', romaji: 'wo', hiragana: 'を' },
  // ン
  { katakana: 'ン', romaji: 'n', hiragana: 'ん', similar: ['ソ', 'シ', 'リ'] },
]

// 容易混淆的片假名對照
export const confusablePairs = [
  { chars: ['シ', 'ツ'], hint: 'シ（shi）筆畫橫向，ツ（tsu）筆畫縱向' },
  { chars: ['ソ', 'ン'], hint: 'ソ（so）一撇斜右，ン（n）一撇斜左' },
  { chars: ['ソ', 'リ'], hint: 'ソ（so）有短橫，リ（ri）無短橫' },
  { chars: ['ア', 'マ'], hint: 'ア（a）中間有橫，マ（ma）無橫' },
  { chars: ['ウ', 'ワ'], hint: 'ウ（u）上有點，ワ（wa）無點' },
]

// 依難度分組
export const katakanaGroups = {
  easy: ['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ'],
  medium: ['サ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'テ', 'ト', 'ナ', 'ニ', 'ヌ', 'ネ', 'ノ'],
  hard: ['シ', 'ツ', 'ン', 'リ', 'ソ'],
  all: katakanaChars.map(c => c.katakana),
}
