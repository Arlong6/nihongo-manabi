const GEMINI_URL = 'https://nihongo-manabi-proxy.vercel.app/api/gemini?model=gemini-2.5-flash'

export interface ChatMessage {
  role: 'user' | 'model'
  text: string
}

export interface AIResponse {
  japanese: string
  reading: string
  translation: string
  correction?: string
  hint?: string
}

function buildSystemPrompt(scene: string, level: string, uiLang: string): string {
  const langMap: Record<string, string> = {
    'zh-TW': '繁體中文',
    'en': 'English',
    'ko': '한국어',
  }
  const transLang = langMap[uiLang] || 'English'

  return `You are a friendly Japanese conversation partner helping a language learner practice.

Scene: ${scene}
Learner level: ${level}

RULES:
- Respond naturally in Japanese appropriate for the scene and level
- Keep responses SHORT (1-2 sentences max)
- If the learner makes a grammar or vocabulary mistake, gently correct it
- Stay in character for the scene
- If the learner writes in English or another language, gently redirect them to use Japanese

RESPONSE FORMAT: a SINGLE JSON object (not an array), no markdown, no explanation outside JSON:
{
  "japanese": "your response in Japanese (Japanese text only)",
  "reading": "hiragana reading of your response (kana only, no romaji, no translation)",
  "translation": "${transLang} translation only",
  "correction": "correction explanation in ${transLang} if learner made a mistake, otherwise null",
  "hint": "a single suggested reply the learner could say next, JAPANESE TEXT ONLY no explanation no translation no parentheses, or null if not needed"
}

CRITICAL:
- Return ONE object, never an array
- "hint" must be pure Japanese text that can be used as a reply directly. Do NOT include English/Chinese explanations or parentheses.
- Do not wrap output in markdown code blocks.`
}

function buildOpeningPrompt(scene: string, level: string, uiLang: string): string {
  const langMap: Record<string, string> = {
    'zh-TW': '繁體中文',
    'en': 'English',
    'ko': '한국어',
  }
  const transLang = langMap[uiLang] || 'English'

  return `You are starting a Japanese conversation practice. You play the role of a native speaker in this scene.

Scene: ${scene}
Learner level: ${level}

Start the conversation with a natural opening line appropriate for the scene. Keep it simple and friendly.

RESPONSE FORMAT: a SINGLE JSON object (not an array), no markdown:
{
  "japanese": "your opening line (Japanese text only)",
  "reading": "hiragana reading (kana only)",
  "translation": "${transLang} translation only",
  "correction": null,
  "hint": "a single suggested reply in pure Japanese text only, no explanation no parentheses"
}

CRITICAL:
- Return ONE object, never an array
- "hint" must be pure Japanese text (no English/Chinese explanations, no parentheses).`
}

function parseAIResponse(text: string): AIResponse {
  let cleaned = text.trim()
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Try to extract first {...} block
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Could not parse AI response')
    parsed = JSON.parse(match[0])
  }

  // If Gemini returned an array, take the first element
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) throw new Error('Empty array from AI')
    parsed = parsed[0]
  }

  const result: AIResponse = {
    japanese: String(parsed.japanese ?? ''),
    reading: String(parsed.reading ?? ''),
    translation: String(parsed.translation ?? ''),
    correction: parsed.correction ? String(parsed.correction) : undefined,
    hint: parsed.hint ? sanitizeHint(String(parsed.hint)) : undefined,
  }
  return result
}

// Strip English/Chinese explanations from hint — keep only Japanese
function sanitizeHint(hint: string): string | undefined {
  // Remove parenthetical explanations like "(Yes, I'm good!)"
  let cleaned = hint.replace(/[（(][^)）]*[)）]/g, '').trim()
  // If hint starts with English explanation like "When a staff asks..." drop it
  if (/^[A-Za-z]/.test(cleaned) && cleaned.length > 30) {
    // Try to extract the first Japanese sentence
    const jpMatch = cleaned.match(/[ぁ-んァ-ン一-龥][ぁ-んァ-ン一-龥ー。、！？\s]*/)
    if (jpMatch) cleaned = jpMatch[0].trim()
    else return undefined
  }
  return cleaned || undefined
}

export async function startConversation(
  scene: string,
  level: string,
  uiLang: string
): Promise<AIResponse> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: buildOpeningPrompt(scene, level, uiLang) }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  return parseAIResponse(text)
}

export async function sendMessage(
  userText: string,
  history: ChatMessage[],
  scene: string,
  level: string,
  uiLang: string
): Promise<AIResponse> {
  const contents = [
    {
      role: 'user',
      parts: [{ text: buildSystemPrompt(scene, level, uiLang) }],
    },
    {
      role: 'model',
      parts: [{ text: '{"japanese":"understood","reading":"","translation":"","correction":null,"hint":null}' }],
    },
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    })),
    {
      role: 'user' as const,
      parts: [{ text: userText }],
    },
  ]

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  return parseAIResponse(text)
}
