# Nihongo Reels — IG auto-publish pipeline

Self-running pipeline that renders Japanese-learning Reels (Remotion) and publishes one per day to `@learn.nihongo.manabi` via Make.com.

## Daily flow

```
launchd (02:00) → scripts/ig_schedule.sh
  ├─ pipeline_health.py    verify yesterday's post actually landed on IG
  ├─ auto_render.py        refill queue if pending < 7 (renders new mp4s)
  └─ auto_post.py          push next pending mp4 to host repo + fire webhook
                           ↓
                    Make.com webhook → IG for Business → Reel posted
```

## Required `.env`

```
MAKE_WEBHOOK_URL=https://hook.us2.make.com/...
IG_HOST_REPO=Arlong6/nihongo-reels-host
TELEGRAM_BOT_TOKEN=...    # alerts when pipeline breaks
TELEGRAM_CHAT_ID=...
```

## Health check

`scripts/pipeline_health.py` runs daily before next post. Compares local
"uploaded" timestamps vs IG profile's public post count (scraped from
`og:description`). Two alerts:

- **Pipeline stale** — no upload in 36h (launchd not firing, render broken)
- **Silent IG failure** — webhook sent but IG count didn't grow (Make.com issue)

Manual run: `python3 scripts/pipeline_health.py`

After fixing IG manually, reset baseline: `python3 scripts/pipeline_health.py --reset`

## Troubleshooting Make.com

These bit me on 2026-04-30 — write them down so future-me doesn't repeat.

### Symptom: History shows `Success` but Duration `<1 sec`
The webhook was received but downstream IG module didn't fire. Two causes:

**(a) Filter on connector blocks execution.** Look at the line between
Webhooks and Instagram modules — if there's a 🔻 (filter) or 🔧 (wrench) icon,
filter is active and probably empty.
Fix: click icon → set both fields to `1` → Save (1=1 always passes).

**(b) Variable mapping uses wrong syntax.** The IG module's `Video URL` field
must reference the flat field we send:

| Field syntax | Result |
|---|---|
| `{{1.video_url}}` | ✅ correct (flat field with underscore) |
| `{{1.video.url}}` | ❌ tries to access nested `.url` property — fails with `BundleValidationError "Missing video_url"` |

Our webhook payload is `{ video_url, caption, filename }` — flat, no nesting.

### Symptom: scenario stops processing webhooks entirely
Make.com auto-deactivates the scenario after any error. History will show
`Scenario was deactivated by Make because of reason: ...`.

Fix:
1. Scenario main page → bottom-left toggle **`Immediately as data arrives`** → ON (blue)
2. Verify with manual webhook: `python3 scripts/auto_post.py --schedule`
3. Check History — Duration should be 30-60 sec (real upload), not <1 sec

### Symptom: webhook variables not auto-completing in Make.com editor
Re-determine data structure: open Webhook module → bottom **"Re-determine data structure"** → fire one webhook → it learns the field names.

## Content rotation

`auto_render.py` ROTATION pool (93 unique reels):

- Reel-15..30 (16) — vocab; **04..14 skipped** to avoid duplicating PIL Day 4-14 IG posts
- Kana-04..17 (14) — kana drills
- Grammar-04..16 (13) — grammar patterns
- Travel-04..16 (13) — travel phrases
- Anime-01..17 (17) — 動漫經典台詞
- Oops-01..20 (20) — 觀光客踩雷

When pool exhausts, Telegram alert fires. Add new entries to
`src/{kana,grammar,travel}/data.ts` to extend.

## Quick health commands

```bash
# Last 50 lines of cron log
tail -50 /tmp/nihongo-ig-upload.log

# Queue stats
python3 scripts/auto_post.py --status

# Manually fire next pending
python3 scripts/auto_post.py --schedule

# Force render N more reels
python3 scripts/auto_render.py --force --batch 5

# launchd is loaded?
launchctl list | grep nihongo
```
