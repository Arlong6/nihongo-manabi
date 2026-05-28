// /r/[filename] redirect — logs the click and 302s to the App Store.
// Reads filename from path, optional ?p= for platform (ig/tt).
// Counters persist to Upstash KV when configured; falls back to stdout otherwise.
//
// Env:
//   APP_STORE_URL — App Store URL to redirect to.
//   KV_REST_API_URL / KV_REST_API_TOKEN — auto-set by Vercel Upstash integration.

import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

const SAFE_FILENAME = /^[A-Za-z0-9_-]{1,64}$/
const KNOWN_PLATFORMS = new Set(['ig', 'tt', 'yt', 'other'])
const DEFAULT_APP_STORE_URL = 'https://apps.apple.com/search?term=Nihongo+Manabi'
const EVENT_LIST_MAX = 1000

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const filename = decodeURIComponent(url.pathname.split('/').pop() || '')
  const rawPlatform = url.searchParams.get('p') || 'other'
  const platform = KNOWN_PLATFORMS.has(rawPlatform) ? rawPlatform : 'other'

  if (!SAFE_FILENAME.test(filename)) {
    return new Response('not found', { status: 404 })
  }

  const ua = (req.headers.get('user-agent') || '').slice(0, 200)
  const ref = (req.headers.get('referer') || '').slice(0, 200)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || ''
  const ipPrefix = ip.split('.').slice(0, 2).join('.')
  const ts = new Date().toISOString()

  const event = { event: 'reel_click', filename, platform, ts, ua, ref, ip_prefix: ipPrefix }
  console.log(JSON.stringify(event))

  // Persist to KV if configured. Failures here must not block the redirect.
  const redis = getRedis()
  if (redis) {
    try {
      await Promise.all([
        redis.hincrby(`clicks:${platform}`, filename, 1),
        redis.hincrby('clicks:total', filename, 1),
        redis.set(`last_click:${filename}`, ts),
        redis.lpush('events', JSON.stringify(event)),
        redis.ltrim('events', 0, EVENT_LIST_MAX - 1),
      ])
    } catch (e) {
      console.log(JSON.stringify({ event: 'kv_error', filename, err: String(e) }))
    }
  }

  const target = process.env.APP_STORE_URL || DEFAULT_APP_STORE_URL
  return Response.redirect(target, 302)
}
