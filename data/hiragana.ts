import type { HiraganaChar } from '../types'

export const hiraganaChars: HiraganaChar[] = [
  // あ行
  { hiragana: 'あ', romaji: 'a',   katakana: 'ア' },
  { hiragana: 'い', romaji: 'i',   katakana: 'イ' },
  { hiragana: 'う', romaji: 'u',   katakana: 'ウ' },
  { hiragana: 'え', romaji: 'e',   katakana: 'エ' },
  { hiragana: 'お', romaji: 'o',   katakana: 'オ', similar: ['あ'] },
  // か行
  { hiragana: 'か', romaji: 'ka',  katakana: 'カ' },
  { hiragana: 'き', romaji: 'ki',  katakana: 'キ' },
  { hiragana: 'く', romaji: 'ku',  katakana: 'ク' },
  { hiragana: 'け', romaji: 'ke',  katakana: 'ケ' },
  { hiragana: 'こ', romaji: 'ko',  katakana: 'コ' },
  // さ行
  { hiragana: 'さ', romaji: 'sa',  katakana: 'サ', similar: ['ち'] },
  { hiragana: 'し', romaji: 'shi', katakana: 'シ' },
  { hiragana: 'す', romaji: 'su',  katakana: 'ス' },
  { hiragana: 'せ', romaji: 'se',  katakana: 'セ' },
  { hiragana: 'そ', romaji: 'so',  katakana: 'ソ' },
  // た行
  { hiragana: 'た', romaji: 'ta',  katakana: 'タ' },
  { hiragana: 'ち', romaji: 'chi', katakana: 'チ', similar: ['さ'] },
  { hiragana: 'つ', romaji: 'tsu', katakana: 'ツ' },
  { hiragana: 'て', romaji: 'te',  katakana: 'テ' },
  { hiragana: 'と', romaji: 'to',  katakana: 'ト' },
  // な行
  { hiragana: 'な', romaji: 'na',  katakana: 'ナ' },
  { hiragana: 'に', romaji: 'ni',  katakana: 'ニ' },
  { hiragana: 'ぬ', romaji: 'nu',  katakana: 'ヌ', similar: ['め', 'ね'] },
  { hiragana: 'ね', romaji: 'ne',  katakana: 'ネ', similar: ['ぬ', 'わ', 'れ'] },
  { hiragana: 'の', romaji: 'no',  katakana: 'ノ' },
  // は行
  { hiragana: 'は', romaji: 'ha',  katakana: 'ハ', similar: ['ほ'] },
  { hiragana: 'ひ', romaji: 'hi',  katakana: 'ヒ' },
  { hiragana: 'ふ', romaji: 'fu',  katakana: 'フ' },
  { hiragana: 'へ', romaji: 'he',  katakana: 'ヘ' },
  { hiragana: 'ほ', romaji: 'ho',  katakana: 'ホ', similar: ['は'] },
  // ま行
  { hiragana: 'ま', romaji: 'ma',  katakana: 'マ' },
  { hiragana: 'み', romaji: 'mi',  katakana: 'ミ' },
  { hiragana: 'む', romaji: 'mu',  katakana: 'ム' },
  { hiragana: 'め', romaji: 'me',  katakana: 'メ', similar: ['ぬ', 'ね'] },
  { hiragana: 'も', romaji: 'mo',  katakana: 'モ' },
  // や行
  { hiragana: 'や', romaji: 'ya',  katakana: 'ヤ' },
  { hiragana: 'ゆ', romaji: 'yu',  katakana: 'ユ' },
  { hiragana: 'よ', romaji: 'yo',  katakana: 'ヨ' },
  // ら行
  { hiragana: 'ら', romaji: 'ra',  katakana: 'ラ' },
  { hiragana: 'り', romaji: 'ri',  katakana: 'リ', similar: ['い'] },
  { hiragana: 'る', romaji: 'ru',  katakana: 'ル' },
  { hiragana: 'れ', romaji: 're',  katakana: 'レ', similar: ['ね', 'わ'] },
  { hiragana: 'ろ', romaji: 'ro',  katakana: 'ロ' },
  // わ行・ん
  { hiragana: 'わ', romaji: 'wa',  katakana: 'ワ', similar: ['ね', 'れ'] },
  { hiragana: 'を', romaji: 'wo',  katakana: 'ヲ' },
  { hiragana: 'ん', romaji: 'n',   katakana: 'ン' },
]

export const hiraganaConfusablePairs = [
  { chars: ['ぬ', 'め'], hint: 'ぬ（nu）右側有圓圈，め（me）圓圈較開放' },
  { chars: ['ぬ', 'ね'], hint: 'ぬ（nu）右側閉合，ね（ne）右側開口' },
  { chars: ['ね', 'わ'], hint: 'ね（ne）有下延伸，わ（wa）無下延伸' },
  { chars: ['は', 'ほ'], hint: 'は（ha）二筆畫右側，ほ（ho）三筆畫右側' },
  { chars: ['り', 'い'], hint: 'り（ri）右邊有延伸鉤，い（i）兩邊對稱' },
  { chars: ['さ', 'ち'], hint: 'さ（sa）上方有橫，ち（chi）無橫' },
  { chars: ['あ', 'お'], hint: 'あ（a）左上有撇，お（o）有圓點' },
]

export const hiraganaConfusableSet = new Set(['ぬ', 'め', 'ね', 'わ', 'れ', 'は', 'ほ', 'り', 'い', 'さ', 'ち', 'あ', 'お'])
