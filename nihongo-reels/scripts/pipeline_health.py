#!/usr/bin/env python3
"""Detect silent IG pipeline failures.

The local pipeline marks an upload "uploaded" once Make.com webhook returns 200.
But Make.com can silently drop webhooks (scenario deactivated, filter blocking,
IG token expired in Make connection). This check catches that by comparing local
upload timestamps against the IG profile's actual public post count.

Logic:
  1. Fetch IG profile, parse "N Posts" from og:description meta tag.
  2. Read last cached post count from ~/.cache/nihongo-ig/pipeline_health.json.
  3. Read most recent "uploaded" entry from upload_queue.json.
  4. If we sent a webhook since last check AND IG count did not increase by >=1,
     fire a Telegram alert (silent failure detected).
  5. Persist current count for next run.

Also catches launchd not firing — if no "uploaded" entries in last 36h, alert.

Usage:
  pipeline_health.py            # run check + alert if broken
  pipeline_health.py --quiet    # exit silently on healthy (for cron)
  pipeline_health.py --reset    # clear cache (use after manually fixing IG)
"""
import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
QUEUE_FILE = ROOT / "upload_queue.json"
CACHE_DIR = Path.home() / ".cache" / "nihongo-ig"
CACHE_FILE = CACHE_DIR / "pipeline_health.json"

IG_USERNAME = "learn.nihongo.manabi"
PROFILE_URL = f"https://www.instagram.com/{IG_USERNAME}/"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

STALE_UPLOAD_HOURS = 36


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
        print("[telegram] no creds, skipping alert")
        return
    try:
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10).read()
    except Exception as e:
        print(f"[telegram] failed: {e}", file=sys.stderr)


def fetch_ig_post_count() -> int | None:
    """Scrape public profile og:description for 'N Posts'."""
    req = urllib.request.Request(PROFILE_URL, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"[ig] fetch failed: {e}", file=sys.stderr)
        return None
    m = re.search(r'property="og:description"[^>]+content="[^"]*?(\d+)\s*Posts', html)
    if not m:
        # Fallback: title page sometimes has it differently
        m = re.search(r'(\d+)\s*Posts', html)
    return int(m.group(1)) if m else None


def load_cache() -> dict:
    if CACHE_FILE.exists():
        try:
            return json.loads(CACHE_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_cache(data: dict):
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_FILE.write_text(json.dumps(data, indent=2) + "\n")


def last_uploaded(queue: list[dict]) -> dict | None:
    uploaded = [e for e in queue if e["status"] == "uploaded" and e.get("uploaded_at")]
    if not uploaded:
        return None
    return max(uploaded, key=lambda e: e["uploaded_at"])


def parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--quiet", action="store_true", help="suppress healthy output")
    parser.add_argument("--reset", action="store_true", help="clear cache and exit")
    args = parser.parse_args()

    load_env()

    if args.reset:
        if CACHE_FILE.exists():
            CACHE_FILE.unlink()
            print("[health] cache cleared")
        return

    queue = json.loads(QUEUE_FILE.read_text()) if QUEUE_FILE.exists() else []
    cache = load_cache()
    now = datetime.now(timezone.utc).astimezone()

    last = last_uploaded(queue)
    last_ts = parse_iso(last["uploaded_at"]) if last else None
    hours_since = (now - last_ts).total_seconds() / 3600 if last_ts else None

    current_count = fetch_ig_post_count()
    cached_count = cache.get("ig_post_count")
    cached_check_at = cache.get("checked_at")

    if not args.quiet:
        print(f"[health] now={now.isoformat()}")
        print(f"[health] last_uploaded={last['video'] if last else 'none'} ({hours_since:.1f}h ago)" if last else "[health] no uploads in queue")
        print(f"[health] ig_post_count: cached={cached_count} current={current_count}")

    alerts = []

    # Check 1: launchd / pipeline silent (no upload in 36h)
    if hours_since is not None and hours_since > STALE_UPLOAD_HOURS:
        alerts.append(
            f"⚠️ <b>Pipeline stale</b>\n"
            f"Last upload was {hours_since:.0f}h ago ({last['video']}).\n"
            f"Check: launchctl list | grep nihongo, tail /tmp/nihongo-ig-upload.log"
        )

    # Check 2: silent Make.com failure (we sent webhook but IG count didn't grow)
    if current_count is not None and cached_count is not None and last_ts is not None:
        cached_check_dt = parse_iso(cached_check_at) if cached_check_at else None
        # We expect: if last upload happened AFTER last check, IG count should have grown
        sent_since_last_check = cached_check_dt is None or last_ts > cached_check_dt
        count_grew = current_count > cached_count
        if sent_since_last_check and not count_grew:
            alerts.append(
                f"❌ <b>Silent IG failure</b>\n"
                f"Webhook sent for {last['video']} at {last_ts.strftime('%m-%d %H:%M')}, "
                f"but IG post count is still {current_count} (was {cached_count}).\n"
                f"Likely cause: Make.com scenario deactivated, filter blocking, "
                f"or IG connection token expired.\n"
                f"Fix: open Make.com → check scenario toggle ON + History tab."
            )

    if alerts:
        for a in alerts:
            print(a.replace("<b>", "").replace("</b>", ""))
            telegram(a)
        # Save count anyway so we don't re-alert forever
        save_cache({
            "ig_post_count": current_count,
            "checked_at": now.isoformat(),
            "last_alert_at": now.isoformat(),
        })
        sys.exit(1)

    save_cache({
        "ig_post_count": current_count,
        "checked_at": now.isoformat(),
    })

    if not args.quiet:
        print("[health] ✓ pipeline healthy")


if __name__ == "__main__":
    main()
