#!/usr/bin/env python3
"""Upload Reels to Instagram via instagrapi.

Usage:
  ig_uploader.py --video FILE --caption TEXT [--cover FILE]
  ig_uploader.py --schedule          # upload next queued reel

Credentials are read from ../.env:
  IG_USERNAME=learn.nihongo.manabi
  IG_PASSWORD=xxxxx

Session is cached to ~/.cache/nihongo-ig/session.json to avoid
repeated logins (which trigger IG security alerts).
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# ── Config ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
SESSION_DIR = Path.home() / ".cache" / "nihongo-ig"
SESSION_FILE = SESSION_DIR / "session.json"
QUEUE_FILE = ROOT / "upload_queue.json"
LOG_FILE = ROOT / "upload_log.json"

# Telegram notifications (reuse AIvideo bot if available)
AIVIDEO_ENV = Path.home() / "Projects" / "AIvideo" / ".env"


def load_env():
    """Load .env files into os.environ."""
    for env_path in [ENV_FILE, AIVIDEO_ENV]:
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


def send_telegram(msg: str):
    """Send notification via Telegram bot (best-effort)."""
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    try:
        import urllib.request
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def get_client():
    """Login to IG via cached session or sessionid cookie."""
    from instagrapi import Client
    from urllib.parse import unquote

    cl = Client()
    cl.delay_range = [2, 5]
    SESSION_DIR.mkdir(parents=True, exist_ok=True)

    if SESSION_FILE.exists():
        try:
            cl.load_settings(SESSION_FILE)
            cl.private_request("accounts/current_user/?edit=true")
            print("  ✓ Session restored")
            return cl
        except Exception:
            print("  Session cache invalid, fresh login...")
            cl = Client()
            cl.delay_range = [2, 5]

    sessionid = os.environ.get("IG_SESSION_ID", "")
    if not sessionid:
        print("ERROR: No valid session. Set IG_SESSION_ID in .env")
        sys.exit(1)

    cl.login_by_sessionid(sessionid)
    cl.dump_settings(SESSION_FILE)
    print("  ✓ Logged in via sessionid")
    return cl


def upload_reel(video_path: str, caption: str, cover_path: str | None = None):
    """Upload a single Reel."""
    cl = get_client()
    kwargs = {
        "path": video_path,
        "caption": caption,
    }
    if cover_path:
        kwargs["thumbnail"] = cover_path

    print(f"  Uploading {video_path}...")
    media = cl.clip_upload(**kwargs)
    print(f"  ✓ Uploaded: https://www.instagram.com/reel/{media.code}/")
    cl.dump_settings(SESSION_FILE)
    return media


def log_upload(video: str, caption: str, media_code: str):
    """Append to upload log."""
    log = []
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
    log.append({
        "video": video,
        "caption": caption[:80] + "...",
        "code": media_code,
        "url": f"https://www.instagram.com/reel/{media_code}/",
        "uploaded_at": datetime.now().isoformat(),
    })
    LOG_FILE.write_text(json.dumps(log, indent=2, ensure_ascii=False))


# ── Queue-based scheduling ────────────────────────────────────────────────────

def init_queue():
    """Initialize upload queue from available videos + captions."""
    if QUEUE_FILE.exists():
        return json.loads(QUEUE_FILE.read_text())

    captions_file = ROOT.parent / "marketing" / "ig_daily_captions.txt"
    captions = {}
    if captions_file.exists():
        text = captions_file.read_text()
        import re
        for block in re.split(r"\n(?=Day \d+)", text):
            m = re.match(r"Day (\d+)", block)
            if m:
                captions[int(m.group(1))] = block.strip()

    out_dir = ROOT / "out"
    templates = ["Reel", "Kana", "Grammar", "Travel"]
    queue = []
    idx = 1

    for i in range(1, 11):
        for tmpl in templates:
            mp4 = out_dir / f"{tmpl}-{i:02d}.mp4"
            if mp4.exists():
                caption = captions.get(idx, f"每天學日文 Day {idx} 📚\n\n#日語學習 #日本語 #JLPT #nihongo #learnjapanese\n\nApp Store 搜尋 Nihongo Manabi")
                queue.append({
                    "video": str(mp4),
                    "caption": caption,
                    "status": "pending",
                })
                idx += 1

    QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
    print(f"  ✓ Queue initialized: {len(queue)} reels")
    return queue


def upload_next():
    """Upload the next pending reel from the queue."""
    queue = init_queue()
    pending = [i for i, q in enumerate(queue) if q["status"] == "pending"]
    if not pending:
        print("  No pending reels in queue.")
        send_telegram("📭 IG Queue empty — all reels uploaded!")
        return

    # Check cooldown (24h between uploads)
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
        if log:
            last = datetime.fromisoformat(log[-1]["uploaded_at"])
            hours_ago = (datetime.now() - last).total_seconds() / 3600
            if hours_ago < 23:
                print(f"  Cooldown: last upload {hours_ago:.1f}h ago, waiting until 23h+")
                return

    idx = pending[0]
    item = queue[idx]
    video = item["video"]
    caption = item["caption"]

    if not Path(video).exists():
        print(f"  SKIP: {video} not found")
        queue[idx]["status"] = "missing"
        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
        return

    try:
        media = upload_reel(video, caption)
        queue[idx]["status"] = "uploaded"
        queue[idx]["uploaded_at"] = datetime.now().isoformat()
        queue[idx]["url"] = f"https://www.instagram.com/reel/{media.code}/"
        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
        log_upload(video, caption, media.code)

        remaining = len([q for q in queue if q["status"] == "pending"])
        send_telegram(
            f"✅ <b>IG Reel uploaded</b>\n"
            f"📹 {Path(video).name}\n"
            f"🔗 https://www.instagram.com/reel/{media.code}/\n"
            f"📊 Queue remaining: {remaining}"
        )
        print(f"  ✓ Done! Remaining: {remaining}")
    except Exception as e:
        queue[idx]["status"] = "error"
        queue[idx]["error"] = str(e)
        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
        send_telegram(f"❌ <b>IG Upload failed</b>\n{Path(video).name}\n{e}")
        print(f"  ERROR: {e}")
        raise


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    load_env()
    parser = argparse.ArgumentParser(description="Upload Reels to Instagram")
    parser.add_argument("--video", help="Path to .mp4 file")
    parser.add_argument("--caption", help="Caption text")
    parser.add_argument("--cover", help="Optional cover image")
    parser.add_argument("--schedule", action="store_true", help="Upload next from queue")
    parser.add_argument("--init-queue", action="store_true", help="Initialize/reset queue")
    parser.add_argument("--status", action="store_true", help="Show queue status")
    args = parser.parse_args()

    if args.status:
        queue = init_queue()
        total = len(queue)
        uploaded = len([q for q in queue if q["status"] == "uploaded"])
        pending = len([q for q in queue if q["status"] == "pending"])
        errors = len([q for q in queue if q["status"] == "error"])
        print(f"Total: {total} | Uploaded: {uploaded} | Pending: {pending} | Errors: {errors}")
        return

    if args.init_queue:
        QUEUE_FILE.unlink(missing_ok=True)
        init_queue()
        return

    if args.schedule:
        upload_next()
        return

    if args.video and args.caption:
        media = upload_reel(args.video, args.caption, args.cover)
        log_upload(args.video, args.caption, media.code)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
