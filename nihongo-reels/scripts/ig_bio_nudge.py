#!/usr/bin/env python3
"""Telegram nudge: tell me which URL to put in IG bio today.

Half-auto fallback because IG profile-edit endpoints are blocked for both
instagrapi (mobile private API rejects web sessionid) and direct web API
(returns HTML to non-browser XHR). Sends one Telegram message with the URL
to copy; user pastes it into the IG bio "link" field manually (~30s).

Intended to run from ig_schedule.sh AFTER auto_post.py, so the link points
to whatever Reel just went out.

Env (.env):
  REDIRECT_BASE_URL     e.g. https://nihongo-manabi-proxy.vercel.app/r
  TELEGRAM_BOT_TOKEN
  TELEGRAM_CHAT_ID
  IG_USERNAME           optional, for nicer message

Exit codes:
  0 = nudge sent (or skipped cleanly because nothing to point at)
  1 = misconfig (telegram creds missing)
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
AIVIDEO_ENV = Path.home() / "Projects" / "AIvideo" / ".env"


def load_env():
    for env_path in [ENV_FILE, AIVIDEO_ENV]:
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


def latest_uploaded_stem() -> str | None:
    if not QUEUE_FILE.exists():
        return None
    queue = json.loads(QUEUE_FILE.read_text())
    uploaded = [e for e in queue if e.get("status") == "uploaded" and e.get("uploaded_at")]
    if not uploaded:
        return None
    newest = max(uploaded, key=lambda e: e["uploaded_at"])
    return Path(newest["video"]).stem


def telegram(msg: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("[bio_nudge] TELEGRAM_BOT_TOKEN/CHAT_ID missing — cannot send", file=sys.stderr)
        return False
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({
            "chat_id": chat_id,
            "text": msg,
            "parse_mode": "HTML",
            "disable_web_page_preview": True,
        }).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
        return True
    except Exception as e:
        print(f"[bio_nudge] telegram send failed: {e}", file=sys.stderr)
        return False


def main():
    load_env()

    base = os.environ.get("REDIRECT_BASE_URL", "").rstrip("/")
    if not base:
        print("[bio_nudge] REDIRECT_BASE_URL not set, skip")
        return

    stem = latest_uploaded_stem()
    if not stem:
        print("[bio_nudge] no uploaded entries in queue, skip")
        return

    target = f"{base}/{stem}?p=ig"
    username = os.environ.get("IG_USERNAME", "")
    profile_link = f"https://instagram.com/{username}" if username else "https://instagram.com"

    msg = (
        "🔗 <b>今日 IG bio link 更新</b>\n"
        f"剛剛發了 <code>{stem}</code>，bio 連結請改成：\n\n"
        f"<code>{target}</code>\n\n"
        f"👉 開 <a href=\"{profile_link}\">{profile_link}</a> → Edit Profile → Links → 貼上 → 儲存"
    )
    if not telegram(msg):
        sys.exit(1)
    print(f"[bio_nudge] ✓ nudged → {stem}")


if __name__ == "__main__":
    main()
