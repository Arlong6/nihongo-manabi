#!/usr/bin/env python3
"""Auto-render new Reels and append to upload queue.

Triggers when queue has fewer than THRESHOLD pending entries. Picks the next
unrendered composition (by template rotation), renders via Remotion, then
appends to upload_queue.json with status=pending.

The actual posting is handled by auto_post.py (separate cron). This script
just keeps the pipeline fed.

Usage:
  auto_render.py                # check + render if pending < 7
  auto_render.py --threshold 5  # custom threshold
  auto_render.py --batch 5      # render up to N this run
  auto_render.py --force        # ignore threshold, always render
  auto_render.py --dry-run      # show what would render

Composition universe (auto-skipped if mp4 already exists):
  - Reel-15..30   (vocab; 04-14 skipped to avoid duplicating earlier IG posts)
  - Kana-04..14
  - Grammar-04..13
  - Travel-04..13
"""
import argparse
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
OUT_DIR = ROOT / "out"
REMOTION_BIN = ROOT / "node_modules" / ".bin" / "remotion"

DEFAULT_THRESHOLD = 7
DEFAULT_BATCH = 5

# Rotation order — alternates templates so queue stays varied.
# Reel-04..14 intentionally skipped (those vocabs duplicate PIL Day 4-14 posts).
ROTATION = []
for n in range(15, 31):
    ROTATION.append(("Reel", f"{n:02d}"))
for n in range(4, 15):
    ROTATION.append(("Kana", f"{n:02d}"))
for n in range(4, 14):
    ROTATION.append(("Grammar", f"{n:02d}"))
for n in range(4, 14):
    ROTATION.append(("Travel", f"{n:02d}"))

# Interleave so each batch is varied (Reel, Kana, Grammar, Travel, Reel, ...)
def interleaved_rotation():
    buckets = {}
    for tpl, n in ROTATION:
        buckets.setdefault(tpl, []).append((tpl, n))
    order = ["Reel", "Kana", "Grammar", "Travel"]
    out = []
    while any(buckets.get(t) for t in order):
        for t in order:
            if buckets.get(t):
                out.append(buckets[t].pop(0))
    return out


def load_env():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def telegram(msg: str):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        print(f"[telegram] failed: {e}", file=sys.stderr)


def load_queue() -> list[dict]:
    if not QUEUE_FILE.exists():
        return []
    return json.loads(QUEUE_FILE.read_text())


def save_queue(queue: list[dict]):
    QUEUE_FILE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")


def queue_video_set(queue: list[dict]) -> set[str]:
    return {Path(e["video"]).name for e in queue}


def pick_targets(queue: list[dict], batch: int) -> list[tuple[str, str]]:
    """Return list of (template, id) tuples to render this run."""
    in_queue = queue_video_set(queue)
    targets = []
    for tpl, n in interleaved_rotation():
        if len(targets) >= batch:
            break
        mp4_name = f"{tpl}-{n}.mp4"
        mp4_path = OUT_DIR / mp4_name
        if mp4_name in in_queue:
            continue
        # Already rendered + not in queue: just enqueue, no need to re-render
        targets.append((tpl, n))
    return targets


def render(tpl: str, n: str) -> Path:
    mp4_path = OUT_DIR / f"{tpl}-{n}.mp4"
    if mp4_path.exists():
        print(f"  [skip render] {mp4_path.name} already exists")
        return mp4_path

    composition_id = f"{tpl}-{n}"
    print(f"  [render] {composition_id} → {mp4_path}")
    result = subprocess.run(
        [str(REMOTION_BIN), "render", "src/index.ts", composition_id, str(mp4_path)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"render failed for {composition_id}: {result.stderr[-500:]}")
    return mp4_path


def append_to_queue(queue: list[dict], targets: list[tuple[str, str]]):
    """Render (if needed) + append entries to queue."""
    for tpl, n in targets:
        mp4_path = render(tpl, n)
        rel_video = str(mp4_path.relative_to(ROOT))
        # Caption is just a fallback — auto_post.py picks from CAPTION_VARIANTS.
        queue.append({
            "video": rel_video,
            "caption": f"{tpl}-{n} (auto-enqueued)",
            "status": "pending",
            "enqueued_at": datetime.now(timezone.utc).astimezone().isoformat(),
        })
    save_queue(queue)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--threshold", type=int, default=DEFAULT_THRESHOLD,
                        help=f"trigger when pending < this (default {DEFAULT_THRESHOLD})")
    parser.add_argument("--batch", type=int, default=DEFAULT_BATCH,
                        help=f"max items to enqueue per run (default {DEFAULT_BATCH})")
    parser.add_argument("--force", action="store_true",
                        help="ignore threshold, always run")
    parser.add_argument("--dry-run", action="store_true",
                        help="show what would happen, no changes")
    args = parser.parse_args()

    load_env()
    queue = load_queue()
    pending = sum(1 for e in queue if e["status"] == "pending")
    print(f"[auto_render] pending={pending} threshold={args.threshold}")

    if not args.force and pending >= args.threshold:
        print(f"[auto_render] queue healthy, exit")
        return

    targets = pick_targets(queue, args.batch)
    if not targets:
        msg = "🚫 Reel rotation exhausted — all compositions already in queue. Add new data entries."
        print(msg)
        telegram(msg)
        sys.exit(2)

    print(f"[auto_render] enqueueing {len(targets)} reels: {[f'{t}-{n}' for t,n in targets]}")
    if args.dry_run:
        return

    try:
        append_to_queue(queue, targets)
    except Exception as e:
        telegram(f"❌ <b>auto_render failed</b>\n{e}")
        raise

    new_pending = pending + len(targets)
    msg = (
        f"🎬 <b>Auto-rendered {len(targets)} reels</b>\n"
        f"Pending: {pending} → {new_pending}\n"
        f"Added: {', '.join(f'{t}-{n}' for t,n in targets)}"
    )
    print(msg.replace("<b>", "").replace("</b>", ""))
    telegram(msg)


if __name__ == "__main__":
    main()
