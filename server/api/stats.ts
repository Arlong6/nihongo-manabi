// /api/stats — return aggregated click counters from Upstash KV.
// Requires ?token=<STATS_TOKEN> matching env. Read-only.

import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const provided = url.searchParams.get('token') || ''
  const expected = process.env.STATS_TOKEN || ''
  if (!expected || provided !== expected) {
    return new Response('unauthorized', { status: 401 })
  }

  const redis = getRedis()
  if (!redis) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const recentLimit = Math.min(parseInt(url.searchParams.get('recent') || '20'), 200)
    const [igRaw, ttRaw, totalRaw, recentRaw] = await Promise.all([
      redis.hgetall<Record<string, number>>('clicks:ig'),
      redis.hgetall<Record<string, number>>('clicks:tt'),
      redis.hgetall<Record<string, number>>('clicks:total'),
      redis.lrange('events', 0, recentLimit - 1),
    ])

    const ig = igRaw || {}
    const tt = ttRaw || {}
    const total = totalRaw || {}

    const byFilename: Record<string, { ig: number; tt: number; total: number }> = {}
    for (const f of Object.keys(total)) {
      byFilename[f] = {
        ig: Number(ig[f] || 0),
        tt: Number(tt[f] || 0),
        total: Number(total[f] || 0),
      }
    }

    const ranked = Object.entries(byFilename)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 50)

    const recent = (recentRaw as unknown[]).map((e) => {
      try { return typeof e === 'string' ? JSON.parse(e) : e } catch { return e }
    })

    return new Response(JSON.stringify({
      totals: {
        ig: Object.values(ig).reduce((a, b) => a + Number(b), 0),
        tt: Object.values(tt).reduce((a, b) => a + Number(b), 0),
        all: Object.values(total).reduce((a, b) => a + Number(b), 0),
      },
      top_50: Object.fromEntries(ranked),
      recent,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
