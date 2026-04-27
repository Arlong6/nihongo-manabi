#!/usr/bin/env python3
"""Upload Reels to Instagram via Meta Graph API (official).

Flow:
  1. Upload mp4 to GitHub Release → get public URL
  2. POST /{ig-user}/media (media_type=REELS, video_url) → container_id
  3. Poll until FINISHED
  4. POST /{ig-user}/media_publish (creation_id=container_id)

Required .env:
  IG_GRAPH_TOKEN=<long-lived access token>
  IG_GRAPH_USER_ID=<Instagram Business account ID>
  IG_VIDEO_REPO=Arlong6/nihongo-manabi   # GitHub repo for video hosting
  IG_VIDEO_RELEASE_TAG=reels-assets      # release tag (auto-created if missing)

Usage:
  ig_graph_uploader.py --video FILE --caption TEXT
  ig_graph_uploader.py --schedule
  ig_graph_uploader.py --status
  ig_graph_uploader.py --init-queue
"""
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
LOG_FILE = ROOT / "upload_log.json"
AIVIDEO_ENV = Path.home() / "Projects" / "AIvideo" / ".env"

GRAPH_API = "https://graph.facebook.com/v21.0"


def load_env():
    for env_path in [ENV_FILE, AIVIDEO_ENV]:
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())


def send_telegram(msg: str):
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def graph_get(path: str, params: dict) -> dict:
    params["access_token"] = os.environ["IG_GRAPH_TOKEN"]
    url = f"{GRAPH_API}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read())


def graph_post(path: str, params: dict) -> dict:
    params["access_token"] = os.environ["IG_GRAPH_TOKEN"]
    data = urllib.parse.urlencode(params).encode()
    url = f"{GRAPH_API}/{path}"
    req = urllib.request.Request(url, data=data, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


# ── Video hosting via GitHub Releases ─────────────────────────────────────────

def ensure_release(repo: str, tag: str):
    """Create release if missing."""
    result = subprocess.run(
        ["gh", "release", "view", tag, "-R", repo],
        capture_output=True, text=True,
    )
    if result.returncode == 0:
        return
    subprocess.run(
        ["gh", "release", "create", tag, "-R", repo,
         "-t", "IG Reel Assets", "-n", "Auto-uploaded video assets for IG Graph API"],
        check=True, capture_output=True,
    )


def upload_to_github_release(video_path: Path) -> str:
    """Upload mp4 as release asset, return public download URL."""
    repo = os.environ.get("IG_VIDEO_REPO", "Arlong6/nihongo-manabi")
    tag = os.environ.get("IG_VIDEO_RELEASE_TAG", "reels-assets")
    ensure_release(repo, tag)

    asset_name = video_path.name
    subprocess.run(
        ["gh", "release", "upload", tag, str(video_path), "-R", repo, "--clobber"],
        check=True, capture_output=True,
    )
    return f"https://github.com/{repo}/releases/download/{tag}/{asset_name}"


# ── Graph API upload flow ─────────────────────────────────────────────────────

def create_reel_container(video_url: str, caption: str) -> str:
    ig_user = os.environ["IG_GRAPH_USER_ID"]
    resp = graph_post(f"{ig_user}/media", {
        "media_type": "REELS",
        "video_url": video_url,
        "caption": caption,
        "share_to_feed": "true",
    })
    return resp["id"]


def wait_container_ready(container_id: str, timeout: int = 300):
    start = time.time()
    while time.time() - start < timeout:
        status = graph_get(container_id, {"fields": "status_code,status"})
        code = status.get("status_code")
        print(f"  Container: {code}")
        if code == "FINISHED":
            return
        if code == "ERROR":
            raise RuntimeError(f"Container error: {status}")
        time.sleep(10)
    raise TimeoutError(f"Container {container_id} processing timeout after {timeout}s")


def publish_container(container_id: str) -> str:
    ig_user = os.environ["IG_GRAPH_USER_ID"]
    resp = graph_post(f"{ig_user}/media_publish", {"creation_id": container_id})
    return resp["id"]


def get_media_permalink(media_id: str) -> str:
    resp = graph_get(media_id, {"fields": "permalink"})
    return resp.get("permalink", f"https://www.instagram.com/p/{media_id}/")


def upload_reel(video_path: str, caption: str) -> dict:
    vp = Path(video_path)
    if not vp.exists():
        raise FileNotFoundError(video_path)

    print(f"  Uploading {vp.name} to GitHub Releases...")
    video_url = upload_to_github_release(vp)
    print(f"  Public URL: {video_url}")

    print(f"  Creating Reel container...")
    container_id = create_reel_container(video_url, caption)
    print(f"  Container: {container_id}")

    wait_container_ready(container_id)

    print(f"  Publishing...")
    media_id = publish_container(container_id)
    permalink = get_media_permalink(media_id)
    print(f"  ✓ Published: {permalink}")
    return {"media_id": media_id, "permalink": permalink}


# ── Queue + log (shared with old uploader) ────────────────────────────────────

def init_queue():
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


def log_upload(video: str, caption: str, media_id: str, permalink: str):
    log = []
    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
    log.append({
        "video": video,
        "caption": caption[:80] + "...",
        "media_id": media_id,
        "url": permalink,
        "uploaded_at": datetime.now().isoformat(),
        "method": "graph_api",
    })
    LOG_FILE.write_text(json.dumps(log, indent=2, ensure_ascii=False))


def upload_next():
    queue = init_queue()
    pending = [i for i, q in enumerate(queue) if q["status"] == "pending"]
    if not pending:
        send_telegram("📭 IG Queue empty — all reels uploaded!")
        print("  No pending reels.")
        return

    if LOG_FILE.exists():
        log = json.loads(LOG_FILE.read_text())
        if log:
            last = datetime.fromisoformat(log[-1]["uploaded_at"])
            hours_ago = (datetime.now() - last).total_seconds() / 3600
            if hours_ago < 23:
                print(f"  Cooldown: {hours_ago:.1f}h ago, need 23h+")
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
        result = upload_reel(video, caption)
        queue[idx]["status"] = "uploaded"
        queue[idx]["uploaded_at"] = datetime.now().isoformat()
        queue[idx]["url"] = result["permalink"]
        queue[idx]["media_id"] = result["media_id"]
        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
        log_upload(video, caption, result["media_id"], result["permalink"])

        remaining = len([q for q in queue if q["status"] == "pending"])
        send_telegram(
            f"✅ <b>IG Reel uploaded (Graph API)</b>\n"
            f"📹 {Path(video).name}\n"
            f"🔗 {result['permalink']}\n"
            f"📊 Queue remaining: {remaining}"
        )
        print(f"  ✓ Done! Remaining: {remaining}")
    except Exception as e:
        queue[idx]["status"] = "error"
        queue[idx]["error"] = str(e)
        QUEUE_FILE.write_text(json.dumps(queue, indent=2, ensure_ascii=False))
        send_telegram(f"❌ <b>IG Upload failed (Graph API)</b>\n{Path(video).name}\n{e}")
        print(f"  ERROR: {e}")
        raise


def verify_credentials():
    """Sanity-check Graph API creds before any real upload."""
    for key in ["IG_GRAPH_TOKEN", "IG_GRAPH_USER_ID"]:
        if not os.environ.get(key):
            print(f"ERROR: {key} not set in .env")
            sys.exit(1)

    try:
        info = graph_get(os.environ["IG_GRAPH_USER_ID"], {"fields": "username,account_type"})
        print(f"  ✓ Token valid for @{info.get('username')} ({info.get('account_type')})")
        return info
    except Exception as e:
        print(f"  ✗ Token/ID check failed: {e}")
        sys.exit(1)


def main():
    load_env()
    parser = argparse.ArgumentParser(description="Upload Reels via IG Graph API")
    parser.add_argument("--video", help="Path to .mp4")
    parser.add_argument("--caption", help="Caption text")
    parser.add_argument("--schedule", action="store_true", help="Upload next from queue")
    parser.add_argument("--init-queue", action="store_true")
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--verify", action="store_true", help="Check credentials only")
    args = parser.parse_args()

    if args.verify:
        verify_credentials()
        return

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
        verify_credentials()
        upload_next()
        return

    if args.video and args.caption:
        verify_credentials()
        result = upload_reel(args.video, args.caption)
        log_upload(args.video, args.caption, result["media_id"], result["permalink"])
        return

    parser.print_help()


if __name__ == "__main__":
    main()
