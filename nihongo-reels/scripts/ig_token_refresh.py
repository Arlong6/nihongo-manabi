#!/usr/bin/env python3
"""Refresh IG Graph API long-lived token.

Long-lived tokens last 60 days and can be refreshed any time after day 1.
Run this weekly via launchd to keep token fresh automatically.

Required .env:
  IG_GRAPH_TOKEN=<current long-lived token>
  IG_GRAPH_TOKEN_EXPIRES=<ISO timestamp>  (auto-updated by this script)

Exit codes:
  0 = refreshed OK (or no refresh needed yet)
  1 = refresh failed (manual intervention required)
"""
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
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


def update_env_value(key: str, value: str):
    """Update or append key=value in .env, preserving other lines."""
    lines = ENV_FILE.read_text().splitlines() if ENV_FILE.exists() else []
    found = False
    for i, line in enumerate(lines):
        if line.strip().startswith(f"{key}="):
            lines[i] = f"{key}={value}"
            found = True
            break
    if not found:
        lines.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(lines) + "\n")


def refresh_token():
    current = os.environ.get("IG_GRAPH_TOKEN")
    if not current:
        print("ERROR: IG_GRAPH_TOKEN not set")
        sys.exit(1)

    url = (
        f"{GRAPH_API}/oauth/access_token"
        f"?grant_type=fb_exchange_token"
        f"&client_id={os.environ.get('IG_GRAPH_APP_ID', '')}"
        f"&client_secret={os.environ.get('IG_GRAPH_APP_SECRET', '')}"
        f"&fb_exchange_token={current}"
    )
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            resp = json.loads(r.read())
    except Exception as e:
        print(f"✗ Refresh failed: {e}")
        send_telegram(f"❌ <b>IG Graph Token refresh failed</b>\n{e}\n\nRe-generate token manually at developers.facebook.com")
        sys.exit(1)

    new_token = resp.get("access_token")
    expires_in = resp.get("expires_in", 5184000)  # default 60d
    if not new_token:
        print(f"✗ No access_token in response: {resp}")
        sys.exit(1)

    new_expiry = datetime.now() + timedelta(seconds=expires_in)
    update_env_value("IG_GRAPH_TOKEN", new_token)
    update_env_value("IG_GRAPH_TOKEN_EXPIRES", new_expiry.isoformat())

    days = expires_in // 86400
    print(f"✓ Refreshed. New expiry: {new_expiry.isoformat()} ({days}d)")
    return new_expiry


def main():
    load_env()

    expires_str = os.environ.get("IG_GRAPH_TOKEN_EXPIRES")
    if expires_str:
        try:
            expires = datetime.fromisoformat(expires_str)
            days_left = (expires - datetime.now()).days
            print(f"Current token expires in {days_left}d ({expires.isoformat()})")
            if days_left > 20:
                print("  Skip refresh (>20d remaining)")
                sys.exit(0)
        except Exception:
            pass

    print("Refreshing token...")
    new_expiry = refresh_token()
    send_telegram(f"🔄 <b>IG Graph Token refreshed</b>\nValid until {new_expiry.strftime('%Y-%m-%d')}")


if __name__ == "__main__":
    main()
