// /api/feed — returns the list of posted Reels for the in-app Watch screen.
// Sourced from Upstash KV key `feed:manifest`, which auto_post.py refreshes
// after every successful IG webhook fire. No auth (public read).

import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

const HOST_REPO_BASE = 'https://raw.githubusercontent.com/Arlong6/nihongo-reels-host/main'

type ManifestEntry = {
  filename: string
  uploaded_at: string
  caption?: string
  caption_used?: string
}

type FeedItem = {
  filename: string
  stem: string
  theme: string
  video_url: string
  caption: string
  uploaded_at: string
  redirect_path: string
}

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL
  const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function themeFromStem(stem: string): string {
  const prefix = stem.split('-')[0].toLowerCase()
  // Maps composition prefixes to a UI-friendly theme bucket.
  // "reel" = daily vocab; keep distinct from "anime" so client filters work.
  const map: Record<string, string> = {
    reel: 'vocab',
    kana: 'kana',
    grammar: 'grammar',
    travel: 'travel',
    anime: 'anime',
    oops: 'oops',
  }
  return map[prefix] ?? 'other'
}

export default async function handler(req: Request): Promise<Response> {
  const redis = getRedis()
  if (!redis) {
    return new Response(JSON.stringify({ error: 'KV not configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let manifest: ManifestEntry[] = []
  try {
    const raw = await redis.get<ManifestEntry[]>('feed:manifest')
    if (Array.isArray(raw)) manifest = raw
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Newest first. Defensive: skip entries missing required fields.
  const items: FeedItem[] = manifest
    .filter(e => e?.filename && e?.uploaded_at)
    .sort((a, b) => (a.uploaded_at < b.uploaded_at ? 1 : -1))
    .map(e => {
      const stem = e.filename.replace(/\.mp4$/i, '')
      return {
        filename: e.filename,
        stem,
        theme: themeFromStem(stem),
        video_url: `${HOST_REPO_BASE}/${e.filename}`,
        caption: e.caption_used || e.caption || '',
        uploaded_at: e.uploaded_at,
        redirect_path: `/r/${stem}?p=app`,
      }
    })

  return new Response(JSON.stringify({ count: items.length, items }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // Edge cache 60s so the app doesn't hammer KV — feed only changes 1x/day.
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
