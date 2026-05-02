#!/usr/bin/env python3
"""Move already-uploaded mp4s out of `out/` to long-term archive (e.g. external drive).

Frees up internal disk while keeping a copy in case you need to re-share or
debug. Reads upload_queue.json for entries with status=uploaded, moves the
mp4 to the archive destination, and stamps `archived_at` on the queue entry
so this script is idempotent.

Destination resolution (priority):
  1. --dest flag
  2. NIHONGO_ARCHIVE_DIR env var (set in nihongo-reels/.env)
  3. fail with helpful message

Default safety: only archives entries uploaded more than --min-age days ago
(default 7). This gives you a window to re-grab a file if Make.com re-fires
or you want to verify on IG.

Usage:
  archive_uploaded.py                                # archive uploaded > 7 days ago to $NIHONGO_ARCHIVE_DIR
  archive_uploaded.py --dest /Volumes/MyDrive/reels  # explicit destination
  archive_uploaded.py --min-age 0                    # archive everything uploaded
  archive_uploaded.py --dry-run                      # show what would move, no changes
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
OUT_DIR = ROOT / "out"


def load_env():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def resolve_dest(cli_dest: str | None) -> Path:
    raw = cli_dest or os.environ.get("NIHONGO_ARCHIVE_DIR")
    if not raw:
        sys.exit(
            "[archive] no destination set. Either:\n"
            "  - pass --dest /Volumes/YourDrive/nihongo-reels\n"
            "  - or add NIHONGO_ARCHIVE_DIR=/Volumes/... to nihongo-reels/.env"
        )
    dest = Path(raw).expanduser()
    if not dest.exists():
        sys.exit(f"[archive] destination does not exist: {dest}\n  (mount the drive or create the dir)")
    if not dest.is_dir():
        sys.exit(f"[archive] destination is not a directory: {dest}")
    if not os.access(dest, os.W_OK):
        sys.exit(f"[archive] destination not writable: {dest}")
    return dest


def parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dest", help="destination dir (overrides NIHONGO_ARCHIVE_DIR)")
    parser.add_argument("--min-age", type=int, default=7,
                        help="only archive entries uploaded > N days ago (default 7)")
    parser.add_argument("--dry-run", action="store_true", help="show plan, no changes")
    args = parser.parse_args()

    load_env()
    dest = resolve_dest(args.dest)

    if not QUEUE_FILE.exists():
        sys.exit("[archive] no upload_queue.json found")
    queue = json.loads(QUEUE_FILE.read_text())

    now = datetime.now(timezone.utc).astimezone()
    cutoff = now - timedelta(days=args.min_age)

    targets = []
    for entry in queue:
        if entry["status"] != "uploaded":
            continue
        if entry.get("archived_at"):
            continue
        ts = entry.get("uploaded_at")
        if not ts:
            continue
        if parse_iso(ts) > cutoff:
            continue
        src = ROOT / entry["video"]
        if not src.exists():
            # Already gone — mark archived to avoid re-checking
            entry["archived_at"] = now.isoformat()
            entry["archive_note"] = "source file missing at archive time"
            continue
        targets.append((entry, src))

    if not targets:
        print(f"[archive] nothing to archive (cutoff: uploaded > {args.min_age}d ago)")
        # Still save queue if we touched any "missing source" entries
        if not args.dry_run:
            QUEUE_FILE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")
        return

    total_bytes = sum(src.stat().st_size for _, src in targets)
    print(f"[archive] {len(targets)} files ({total_bytes / 1024 / 1024:.1f} MB) → {dest}")
    for entry, src in targets:
        age_days = (now - parse_iso(entry["uploaded_at"])).days
        print(f"  {src.name}  ({src.stat().st_size / 1024 / 1024:.1f} MB, uploaded {age_days}d ago)")

    if args.dry_run:
        print("[archive] dry run, no changes")
        return

    moved = 0
    for entry, src in targets:
        dst = dest / src.name
        if dst.exists():
            print(f"  [skip] {src.name} already at destination, removing source")
            src.unlink()
        else:
            shutil.move(str(src), str(dst))
        entry["archived_at"] = now.isoformat()
        entry["archive_path"] = str(dst)
        moved += 1

    QUEUE_FILE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")
    freed_mb = total_bytes / 1024 / 1024
    print(f"[archive] ✓ moved {moved} files, freed {freed_mb:.1f} MB")


if __name__ == "__main__":
    main()
