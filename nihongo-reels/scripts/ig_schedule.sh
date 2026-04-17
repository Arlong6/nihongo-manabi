#!/usr/bin/env bash
# Daily IG Reel upload — called by launchd
# Uploads the next pending reel from the queue (max 1/day)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG="/tmp/nihongo-ig-upload.log"

echo "=== $(date) ===" >> "$LOG"

# Use the same Python that has instagrapi
PYTHON="${PYTHON:-python3}"

cd "$PROJECT_DIR"
$PYTHON scripts/ig_uploader.py --schedule >> "$LOG" 2>&1

echo "Done at $(date)" >> "$LOG"
