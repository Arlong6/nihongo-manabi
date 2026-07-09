#!/usr/bin/env python3
"""Weekly traffic digest — theme-level click trends, optionally to Telegram.

Compares last-7-days vs previous-7-days reel clicks (from /api/stats recent
events, bot hits excluded), grouped by theme, with the 2026-07-09 new
episodes (Kana-15+ / Grammar-14+ / Travel-14+) tracked separately.

Usage:
  stats_digest.py             # print digest
  stats_digest.py --telegram  # also send to Telegram (never exits non-zero)
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
STATS_URL = "https://nihongo-manabi-proxy.vercel.app/api/stats"
RECENT_LIMIT = 200

NEW_EPISODES = {
    f"{tpl}-{n:02d}"
    for tpl, ids in [("Kana", (15, 16, 17)), ("Grammar", (14, 15, 16)), ("Travel", (14, 15, 16))]
    for n in ids
}


def load_env():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def fetch_events() -> list[dict]:
    token = os.environ.get("STATS_TOKEN", "")
    url = f"{STATS_URL}?token={token}&recent={RECENT_LIMIT}"
    with urllib.request.urlopen(url, timeout=20) as r:
        data = json.loads(r.read())
    events = []
    for e in data.get("recent", []):
        if not isinstance(e, dict) or e.get("event") != "reel_click" or e.get("bot"):
            continue
        try:
            ts = datetime.fromisoformat(e["ts"].replace("Z", "+00:00"))
        except (KeyError, ValueError):
            continue
        if ts.tzinfo is None:
            continue
        events.append({"filename": e.get("filename", ""), "ts": ts})
    return events


def theme_of(filename: str) -> str:
    stem = filename.replace(".mp4", "")
    return stem.split("-")[0] if "-" in stem else "bio/other"


def build_digest(events: list[dict], now: datetime) -> str:
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)
    this_week = [e for e in events if e["ts"] >= week_ago]
    last_week = [e for e in events if two_weeks_ago <= e["ts"] < week_ago]

    def by_theme(evts):
        counts: dict[str, int] = {}
        for e in evts:
            t = theme_of(e["filename"])
            counts[t] = counts.get(t, 0) + 1
        return counts

    cur, prev = by_theme(this_week), by_theme(last_week)
    diff = len(this_week) - len(last_week)
    lines = [
        "📊 Reels 週流量",
        f"本週點擊: {len(this_week)} (上週 {len(last_week)}, {'+' if diff >= 0 else ''}{diff})",
        "主題別（本週/上週）:",
    ]
    for theme in sorted(set(cur) | set(prev), key=lambda t: cur.get(t, 0), reverse=True):
        lines.append(f"  {theme}: {cur.get(theme, 0)}/{prev.get(theme, 0)}")

    new_hits: dict[str, int] = {}
    for e in this_week:
        stem = e["filename"].replace(".mp4", "")
        if stem in NEW_EPISODES:
            new_hits[stem] = new_hits.get(stem, 0) + 1
    lines.append(f"新集數 (7/9 上線): {sum(new_hits.values())} 次點擊")
    if new_hits:
        lines.append("  " + ", ".join(f"{k}: {v}" for k, v in sorted(new_hits.items(), key=lambda x: -x[1])))
    lines.append(f"提醒: recent 樣本上限 {RECENT_LIMIT} 筆")
    return "\n".join(lines)


def send_telegram(text: str):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "")
    if not token or not chat_id:
        print("[digest] telegram not configured, skip send")
        return
    payload = urllib.parse.urlencode({"chat_id": chat_id, "text": text}).encode()
    req = urllib.request.Request(f"https://api.telegram.org/bot{token}/sendMessage", data=payload)
    with urllib.request.urlopen(req, timeout=20) as r:
        r.read()
    print("[digest] sent to telegram")


def main():
    load_env()
    try:
        events = fetch_events()
        digest = build_digest(events, datetime.now(timezone.utc))
    except Exception as e:
        print(f"[digest] failed to build digest: {e}")
        sys.exit(0)  # never break the daily schedule
    print(digest)
    if "--telegram" in sys.argv:
        try:
            send_telegram(digest)
        except Exception as e:
            print(f"[digest] telegram send failed: {e}")


if __name__ == "__main__":
    main()
