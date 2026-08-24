#!/usr/bin/env python3
"""One-off Telegram nudge to check Publer Business quota.

Triggered by launchd job ~/Library/LaunchAgents/com.nihongo.publer-quota-nudge.plist.
"""
import os
import sys
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def telegram(msg: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID", file=sys.stderr)
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({
        "chat_id": chat_id,
        "text": msg,
        "parse_mode": "HTML",
        "disable_web_page_preview": "true",
    }).encode()
    try:
        with urllib.request.urlopen(url, data=data, timeout=15) as r:
            return r.status == 200
    except Exception as e:
        print(f"telegram error: {e}", file=sys.stderr)
        return False


if __name__ == "__main__":
    load_env()
    msg = (
        "🔍 <b>Publer quota check</b>\n\n"
        "今天提醒去看 Publer Business 方案的 quota:\n"
        "<a href='https://app.publer.com/settings/billing'>app.publer.com/settings/billing</a>\n\n"
        "重點看 <b>video: 10</b> 是月限還是日限。\n"
        "1. 月限 → 30 篇/月會爆 → 升 Enterprise 或改隔天發\n"
        "2. 日限 → 1 篇/天完全 OK\n\n"
        "順便看 TikTok 上 Anime-17 (JoJo) 那篇有沒有公開發出來。"
    )
    ok = telegram(msg)
    sys.exit(0 if ok else 1)
