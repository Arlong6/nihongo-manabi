#!/usr/bin/env bash
# Daily IG Reel upload — called by launchd
# Uploads the next pending reel from the queue via Make.com webhook (max 1/day)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG="/tmp/nihongo-ig-upload.log"

echo "=== $(date) ===" >> "$LOG"

PYTHON="${PYTHON:-python3}"
cd "$PROJECT_DIR"

# Health check FIRST — verifies yesterday's webhook actually landed on IG before
# we send today's. Catches Make.com silent failures (deactivated scenario,
# filter blocking, expired IG token in Make connection).
$PYTHON scripts/pipeline_health.py --quiet >> "$LOG" 2>&1 || echo "[schedule] pipeline_health flagged issue" >> "$LOG"

# Refresh IG Graph token if <20d remaining (self-throttles, safe to call daily).
# Only relevant if you're on the direct Graph API path (ig_graph_uploader.py);
# the Make.com webhook path manages its own token inside Make.
if grep -q "^IG_GRAPH_TOKEN=" "$PROJECT_DIR/.env" 2>/dev/null; then
    $PYTHON scripts/ig_token_refresh.py >> "$LOG" 2>&1 || echo "[schedule] ig_token_refresh exited non-zero" >> "$LOG"
fi

# Refill queue if pending < threshold (renders new mp4s as needed).
$PYTHON scripts/auto_render.py >> "$LOG" 2>&1 || echo "[schedule] auto_render exited non-zero" >> "$LOG"

# Post next pending reel via Make.com webhook.
$PYTHON scripts/auto_post.py --schedule >> "$LOG" 2>&1

# Telegram nudge with today's bio link URL (manual 30s paste in IG App).
# Half-auto fallback because IG profile-edit endpoints are anti-bot locked.
$PYTHON scripts/ig_bio_nudge.py >> "$LOG" 2>&1 || echo "[schedule] ig_bio_nudge exited non-zero" >> "$LOG"

# Daily revenue snapshot to Telegram (no-op if RC_SECRET_KEY unset in .env).
if grep -q "^RC_SECRET_KEY=" "$PROJECT_DIR/.env" 2>/dev/null; then
    $PYTHON scripts/revenue_check.py --telegram >> "$LOG" 2>&1 || echo "[schedule] revenue_check exited non-zero" >> "$LOG"
fi

# Weekly traffic digest to Telegram (Mondays) — theme-level click trends,
# tracks whether the 2026-07 content rebalance is actually improving CTR.
if [ "$(date +%u)" = "1" ]; then
    $PYTHON scripts/stats_digest.py --telegram >> "$LOG" 2>&1 || echo "[schedule] stats_digest exited non-zero" >> "$LOG"
fi

# Archive uploaded mp4s older than 7d to external drive (no-op if NIHONGO_ARCHIVE_DIR
# unset or drive unmounted — keeps disk clean without blocking today's post).
if grep -q "^NIHONGO_ARCHIVE_DIR=" "$PROJECT_DIR/.env" 2>/dev/null; then
    $PYTHON scripts/archive_uploaded.py >> "$LOG" 2>&1 || echo "[schedule] archive_uploaded exited non-zero" >> "$LOG"
fi

echo "Done at $(date)" >> "$LOG"
