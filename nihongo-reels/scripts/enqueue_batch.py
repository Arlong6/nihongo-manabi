#!/usr/bin/env python3
"""One-shot helper: append all unqueued mp4s in out/ matching given prefixes
to upload_queue.json with status=pending. Used after a manual batch render
when we want to skip running auto_render.py many times.

Usage:
  enqueue_batch.py Anime Oops          # enqueue every Anime-*.mp4 and Oops-*.mp4
                                       # in out/ that's not already in queue.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE = ROOT / "upload_queue.json"
OUT = ROOT / "out"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prefixes", nargs="+", help="composition prefixes (e.g. Anime Oops)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    queue = json.loads(QUEUE.read_text())
    in_queue = {Path(e["video"]).name for e in queue}

    to_add = []
    for prefix in args.prefixes:
        for mp4 in sorted(OUT.glob(f"{prefix}-*.mp4")):
            if mp4.name in in_queue:
                continue
            to_add.append(mp4)

    if not to_add:
        print("[enqueue] nothing to add — all mp4s already in queue")
        return

    print(f"[enqueue] {len(to_add)} new entries:")
    for mp4 in to_add:
        print(f"  + {mp4.name}")
    if args.dry_run:
        print("[enqueue] dry-run, no changes")
        return

    now = datetime.now(timezone.utc).astimezone().isoformat()
    for mp4 in to_add:
        rel = str(mp4.relative_to(ROOT))
        prefix = mp4.stem.split("-")[0]
        queue.append({
            "video": rel,
            "caption": f"{mp4.stem} (manual batch enqueue)",
            "status": "pending",
            "enqueued_at": now,
        })

    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")
    print(f"[enqueue] ✓ appended {len(to_add)} entries to queue")


if __name__ == "__main__":
    main()
