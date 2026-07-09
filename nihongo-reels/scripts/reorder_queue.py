#!/usr/bin/env python3
"""Interleave pending queue entries by theme. Uploaded entries untouched.

Usage: reorder_queue.py [--dry-run]
"""
import json
import sys
from pathlib import Path

QUEUE = Path(__file__).resolve().parent.parent / "upload_queue.json"
ORDER = ["Kana", "Reel", "Grammar", "Anime", "Travel", "Oops"]


def theme_of(entry: dict) -> str:
    name = Path(entry["video"]).name
    return name.split("-")[0]


def main():
    dry = "--dry-run" in sys.argv
    q = json.loads(QUEUE.read_text())
    uploaded = [e for e in q if e["status"] != "pending"]
    pending = [e for e in q if e["status"] == "pending"]
    buckets = {t: [] for t in ORDER}
    for e in pending:
        buckets.setdefault(theme_of(e), []).append(e)
    interleaved = []
    while any(buckets.get(t) for t in buckets):
        for t in ORDER:
            if buckets.get(t):
                interleaved.append(buckets[t].pop(0))
        for t in list(buckets):
            if t not in ORDER and buckets[t]:
                interleaved.append(buckets[t].pop(0))
    assert len(interleaved) == len(pending), "entry count changed!"
    print("new pending order:")
    for e in interleaved:
        print(" ", Path(e["video"]).name)
    if dry:
        return
    QUEUE.write_text(json.dumps(uploaded + interleaved, ensure_ascii=False, indent=2) + "\n")
    print(f"✓ reordered {len(interleaved)} pending entries")


if __name__ == "__main__":
    main()
