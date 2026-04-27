// Vercel Edge Function — Gemini API proxy for Nihongo Manabi
// Holds the API key server-side; the app only sees this endpoint URL.

export const config = { runtime: 'edge' }

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
const ALLOWED_MODELS = ['gemini-2.5-flash']
const IP_LIMIT_PER_MIN = 30

// In-memory rate limit. Best-effort; resets on cold start. Good enough for v1.
const ipBuckets = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const bucket = ipBuckets.get(ip)
  if (!bucket || now > bucket.resetAt) {
    ipBuckets.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (bucket.count >= IP_LIMIT_PER_MIN) return false
  bucket.count += 1
  return true
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return jsonError(500, 'Server misconfigured')

  const url = new URL(req.url)
  const model = url.searchParams.get('model') || 'gemini-2.5-flash'
  if (!ALLOWED_MODELS.includes(model)) {
    return jsonError(403, 'Model not allowed')
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (!checkRateLimit(ip)) {
    return jsonError(429, 'Rate limit exceeded')
  }

  const body = await req.text()
  if (body.length > 50_000) return jsonError(413, 'Payload too large')

  const upstream = await fetch(
    `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  )

  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}
