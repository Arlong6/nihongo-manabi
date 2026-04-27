#!/usr/bin/env python3
"""Auto-post next pending Reel via Make.com webhook.

Flow:
  1. Pick first `pending` entry from upload_queue.json
  2. Push mp4 to Arlong6/nihongo-reels-host repo (raw.githubusercontent.com host)
  3. POST { video_url, caption, filename } to Make.com webhook
  4. Mark status=uploaded with timestamp

Required .env:
  MAKE_WEBHOOK_URL=https://hook.us2.make.com/xxx
  IG_HOST_REPO=Arlong6/nihongo-reels-host    (optional, has default)
  TELEGRAM_BOT_TOKEN                          (optional)
  TELEGRAM_CHAT_ID                            (optional)

Usage:
  python scripts/auto_post.py --schedule    # post next pending
  python scripts/auto_post.py --status      # show queue status
  python scripts/auto_post.py --video out/X.mp4 --caption "..."   # one-off
"""
import argparse
import json
import os
import random
import shutil
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
HOST_REPO_CLONE = ROOT / ".host-repo"

DEFAULT_HOST_REPO = "Arlong6/nihongo-reels-host"
RAW_URL_TMPL = "https://raw.githubusercontent.com/{repo}/main/{filename}"

# Caption variants — one randomly chosen per upload to add variety.
# Theme is detected by filename prefix (Reel / Kana / Grammar / Travel).
CAPTION_VARIANTS = {
    "Reel": [
        "每天一個日文單字 📚\n學日文從單字開始 ✨\n\n#日語學習 #日本語 #JLPT #nihongo #learnjapanese #每日一字\nApp Store 搜尋 Nihongo Manabi",
        "今天的日文單字 🌸\n你學會了嗎？\n\n#日語學習 #日本語 #JLPT #nihongo #learnjapanese #日文單字\nApp Store 搜尋 Nihongo Manabi",
        "通勤學日文 ☕\n一天一單字 累積大不同\n\n#日語學習 #日本語 #JLPT #nihongo #learnjapanese #每日學日文\nApp Store 搜尋 Nihongo Manabi",
    ],
    "Kana": [
        "假名對比練習 ✍️\n你分得出來嗎？\n\n#日語學習 #日本語 #假名 #平假名 #片假名 #nihongo\nApp Store 搜尋 Nihongo Manabi",
        "ひらがな vs カタカナ 🔤\n一眼分得出來嗎？\n\n#日語學習 #日本語 #五十音 #平假名 #片假名 #nihongo\nApp Store 搜尋 Nihongo Manabi",
        "五十音速記 📝\n哪個唸法你會？\n\n#日語學習 #日本語 #五十音 #假名 #日文初學 #nihongo\nApp Store 搜尋 Nihongo Manabi",
    ],
    "Grammar": [
        "日文文法攻略 📖\n這個文法你用對了嗎？\n\n#日語學習 #日本語 #JLPT #文法 #nihongo #learnjapanese\nApp Store 搜尋 Nihongo Manabi",
        "JLPT 必考文法 ✏️\n你會這個句型嗎？\n\n#日語學習 #日本語 #JLPT #日文文法 #nihongo #N5 #N4\nApp Store 搜尋 Nihongo Manabi",
        "一分鐘學文法 ⚡\n例句記下來會話用得到\n\n#日語學習 #日本語 #日文文法 #JLPT #nihongo #日文會話\nApp Store 搜尋 Nihongo Manabi",
    ],
    "Travel": [
        "旅遊日文必學句 ✈️\n去日本旅遊一定會用到！\n\n#日語學習 #日本語 #旅遊日文 #nihongo #learnjapanese #日本旅遊\nApp Store 搜尋 Nihongo Manabi",
        "日本旅行救命金句 🗾\n用得到記下來\n\n#日語學習 #日本語 #日本旅遊 #旅遊日文 #nihongo #日本自由行\nApp Store 搜尋 Nihongo Manabi",
        "出國前先背 🍱\n日本旅遊實用句\n\n#日語學習 #日本語 #旅遊日文 #日本自由行 #nihongo #日本旅遊\nApp Store 搜尋 Nihongo Manabi",
    ],
}


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


def detect_theme(filename: str) -> str | None:
    base = Path(filename).stem
    for theme in CAPTION_VARIANTS:
        if base.lower().startswith(theme.lower()):
            return theme
    return None


def pick_caption(filename: str, fallback: str) -> str:
    theme = detect_theme(filename)
    if theme and CAPTION_VARIANTS.get(theme):
        return random.choice(CAPTION_VARIANTS[theme])
    return fallback


def load_queue() -> list[dict]:
    return json.loads(QUEUE_FILE.read_text())


def save_queue(queue: list[dict]):
    QUEUE_FILE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")


def push_to_host_repo(mp4_path: Path, repo: str) -> str:
    """Push mp4 to the public host repo. Return the raw URL."""
    if not HOST_REPO_CLONE.exists():
        print(f"[host] cloning {repo} → {HOST_REPO_CLONE}")
        subprocess.run(
            ["git", "clone", f"https://github.com/{repo}.git", str(HOST_REPO_CLONE)],
            check=True,
        )
    else:
        subprocess.run(["git", "-C", str(HOST_REPO_CLONE), "pull", "--ff-only"], check=True)

    target = HOST_REPO_CLONE / mp4_path.name
    shutil.copy2(mp4_path, target)
    subprocess.run(["git", "-C", str(HOST_REPO_CLONE), "add", mp4_path.name], check=True)

    status = subprocess.run(
        ["git", "-C", str(HOST_REPO_CLONE), "status", "--porcelain"],
        capture_output=True, text=True, check=True,
    )
    if status.stdout.strip():
        subprocess.run(
            ["git", "-C", str(HOST_REPO_CLONE), "-c", "commit.gpgsign=false",
             "commit", "-m", f"add {mp4_path.name}"],
            check=True,
        )
        subprocess.run(["git", "-C", str(HOST_REPO_CLONE), "push"], check=True)
    else:
        print(f"[host] {mp4_path.name} already in repo")

    url = RAW_URL_TMPL.format(repo=repo, filename=mp4_path.name)
    # Wait for raw URL to be live
    for attempt in range(6):
        time.sleep(2)
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=10) as r:
                if r.status == 200:
                    return url
        except Exception:
            continue
    raise RuntimeError(f"raw URL not reachable after retries: {url}")


def fire_webhook(url: str, payload: dict) -> str:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        url, data=data, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace").strip()


def cmd_status():
    q = load_queue()
    pending = [e for e in q if e["status"] == "pending"]
    uploaded = [e for e in q if e["status"] == "uploaded"]
    print(f"Pending: {len(pending)}")
    print(f"Uploaded: {len(uploaded)}")
    if pending:
        print("\nNext up:")
        for e in pending[:5]:
            print(f"  - {e['video']}")


def cmd_post(specific_video: Path | None = None, specific_caption: str | None = None):
    webhook = os.environ.get("MAKE_WEBHOOK_URL")
    if not webhook:
        print("ERROR: MAKE_WEBHOOK_URL not set in .env", file=sys.stderr)
        sys.exit(1)
    repo = os.environ.get("IG_HOST_REPO", DEFAULT_HOST_REPO)

    queue = load_queue()
    if specific_video is not None:
        entry = {"video": str(specific_video.relative_to(ROOT)) if specific_video.is_absolute() else str(specific_video),
                 "caption": specific_caption or ""}
        queue_entry = None
    else:
        queue_entry = next((e for e in queue if e["status"] == "pending"), None)
        if not queue_entry:
            msg = "🚫 Reel queue empty — render more content."
            print(msg)
            telegram(msg)
            sys.exit(2)
        entry = queue_entry

    mp4_path = ROOT / entry["video"]
    if not mp4_path.exists():
        print(f"ERROR: {mp4_path} not found", file=sys.stderr)
        sys.exit(1)

    caption = pick_caption(mp4_path.name, entry.get("caption", ""))
    print(f"[post] {mp4_path.name}")
    print(f"[post] caption: {caption[:60]}...")

    print("[post] pushing to host repo...")
    video_url = push_to_host_repo(mp4_path, repo)
    print(f"[post] hosted at {video_url}")

    print("[post] firing webhook...")
    payload = {"video_url": video_url, "caption": caption, "filename": mp4_path.name}
    response = fire_webhook(webhook, payload)
    print(f"[post] webhook: {response}")

    if queue_entry is not None:
        queue_entry["status"] = "uploaded"
        queue_entry["uploaded_at"] = datetime.now(timezone.utc).astimezone().isoformat()
        queue_entry["uploaded_via"] = "make.com"
        queue_entry["caption_used"] = caption
        save_queue(queue)
        print(f"[post] marked {mp4_path.name} as uploaded")

    remaining = sum(1 for e in queue if e["status"] == "pending")
    msg = f"✅ Posted: <code>{mp4_path.name}</code>\nRemaining: {remaining}"
    if remaining <= 3:
        msg += "\n⚠️ 素材剩 ≤ 3 支,該渲染新內容了"
    telegram(msg)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--schedule", action="store_true", help="post next pending entry")
    parser.add_argument("--status", action="store_true", help="show queue status")
    parser.add_argument("--video", type=str, help="post specific video file (one-off)")
    parser.add_argument("--caption", type=str, help="caption for one-off")
    args = parser.parse_args()

    load_env()

    if args.status:
        cmd_status()
    elif args.video:
        cmd_post(specific_video=Path(args.video), specific_caption=args.caption)
    elif args.schedule:
        cmd_post()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
