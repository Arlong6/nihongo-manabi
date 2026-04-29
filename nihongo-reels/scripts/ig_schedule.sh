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

# Refill queue if pending < threshold (renders new mp4s as needed).
$PYTHON scripts/auto_render.py >> "$LOG" 2>&1 || echo "[schedule] auto_render exited non-zero" >> "$LOG"

# Post next pending reel via Make.com webhook.
$PYTHON scripts/auto_post.py --schedule >> "$LOG" 2>&1

echo "Done at $(date)" >> "$LOG"
