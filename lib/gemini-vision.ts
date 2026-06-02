/**
 * Gemini Vision wrapper for OCR + translation of Japanese signs / menus.
 *
 * The Vercel /api/gemini proxy already forwards arbitrary
 * `generateContent` payloads to the model, so we just shape a
 * multimodal request (image + instruction) the way Google expects.
 */

const GEMINI_URL = 'https://nihongo-manabi-proxy.vercel.app/api/gemini?model=gemini-2.5-flash'

export interface OCRResult {
  /** Raw Japanese text the model extracted from the image. */
  detected: string
  /** Chinese (zh-TW) translation suitable for a traveler. */
  translation: string
  /** Optional word-by-word breakdown to scaffold learning. */
  breakdown: Array<{ word: string; reading: string; meaning: string }>
}

const PROMPT = `你是一個幫台灣旅客辨識日文招牌、菜單、文宣的助手。
從圖片中讀出所有可辨識的「日文文字」(漢字+假名)，然後做以下三件事：

1. 把日文原文整理成乾淨的一段（去掉 noise，多行就用換行分開）
2. 翻譯成自然的繁體中文（旅遊者看得懂、不要學術翻譯）
3. 挑出 3-5 個關鍵單字/片語做學習用拆解（含假名讀音 + 中文意思）

嚴格回傳一個 JSON 物件，不要包 markdown code fence，不要任何解說，schema:
{
  "detected": "日文原文 (string, 多行用 \\n)",
  "translation": "繁體中文翻譯",
  "breakdown": [
    {"word": "日文詞", "reading": "假名讀音", "meaning": "中文意思"}
  ]
}

如果圖中沒有可辨識的日文，回傳 {"detected":"","translation":"","breakdown":[]}.`

export async function ocrAndTranslate(base64Image: string, mimeType: string = 'image/jpeg'): Promise<OCRResult> {
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType, data: base64Image } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,        // factual extraction; don't get creative
      responseMimeType: 'application/json',
    },
  }

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 200)}`)
  }

  const json = await res.json()
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('empty response from Gemini')

  // The model is asked for application/json, but it sometimes wraps in ``` anyway.
  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  let parsed: OCRResult
  try {
    parsed = JSON.parse(stripped)
  } catch (e) {
    throw new Error(`failed to parse Gemini JSON: ${stripped.slice(0, 200)}`)
  }
  return {
    detected: parsed.detected || '',
    translation: parsed.translation || '',
    breakdown: Array.isArray(parsed.breakdown) ? parsed.breakdown : [],
  }
}
