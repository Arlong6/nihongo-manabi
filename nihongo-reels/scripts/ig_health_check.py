#!/usr/bin/env python3
"""IG session health checker.

Validates session is alive, warns before expiry, and sends Telegram alerts
when action is needed. Runs daily via launchd (before upload schedule).

Exit codes:
  0 = healthy
  1 = session expired or missing (upload will fail)
  2 = session works but expiring soon (warning)
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
SESSION_DIR = Path.home() / ".cache" / "nihongo-ig"
SESSION_FILE = SESSION_DIR / "session.json"
HEALTH_LOG = SESSION_DIR / "health.json"
AIVIDEO_ENV = Path.home() / "Projects" / "AIvideo" / ".env"


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
        import urllib.request
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        data = json.dumps({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass


def log_health(status: str, detail: str):
    HEALTH_LOG.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if HEALTH_LOG.exists():
        try:
            history = json.loads(HEALTH_LOG.read_text())
        except Exception:
            pass
    history.append({
        "timestamp": datetime.now().isoformat(),
        "status": status,
        "detail": detail,
    })
    history = history[-30:]
    HEALTH_LOG.write_text(json.dumps(history, indent=2))


def check_session_file():
    if not SESSION_FILE.exists():
        return "missing", "Session file not found"
    mtime = datetime.fromtimestamp(SESSION_FILE.stat().st_mtime)
    age_days = (datetime.now() - mtime).days
    return "exists", f"Session file age: {age_days} days"


def check_session_valid():
    """Try a lightweight API call to verify session works."""
    try:
        from instagrapi import Client
        cl = Client()
        cl.delay_range = [1, 2]
        cl.load_settings(SESSION_FILE)
        cl.get_timeline_feed()
        return True, "API call succeeded"
    except Exception as e:
        return False, f"{type(e).__name__}: {e}"


def check_session_age_warning():
    """Warn if session is older than 60 days (expires ~90 days)."""
    if not SESSION_FILE.exists():
        return None
    mtime = datetime.fromtimestamp(SESSION_FILE.stat().st_mtime)
    age_days = (datetime.now() - mtime).days
    if age_days >= 75:
        return "critical", f"Session is {age_days} days old — will expire soon! Refresh sessionid NOW."
    elif age_days >= 60:
        return "warning", f"Session is {age_days} days old — consider refreshing sessionid within 2 weeks."
    return None


def try_refresh_session():
    """Attempt to refresh session using sessionid from .env."""
    sessionid = os.environ.get("IG_SESSION_ID", "")
    if not sessionid:
        return False, "No IG_SESSION_ID in .env"
    try:
        from instagrapi import Client
        cl = Client()
        cl.delay_range = [2, 4]
        cl.login_by_sessionid(sessionid)
        cl.dump_settings(SESSION_FILE)
        return True, "Session refreshed from IG_SESSION_ID"
    except Exception as e:
        return False, f"Refresh failed: {type(e).__name__}"


def main():
    load_env()
    print("=== IG Session Health Check ===")
    print(f"Time: {datetime.now().isoformat()}")

    file_status, file_detail = check_session_file()
    print(f"Session file: {file_status} — {file_detail}")

    if file_status == "missing":
        print("Attempting refresh from .env sessionid...")
        ok, detail = try_refresh_session()
        if not ok:
            msg = f"❌ <b>IG Session Missing</b>\n{detail}\n\nNeed to get new sessionid from browser."
            send_telegram(msg)
            log_health("expired", detail)
            print(f"FAIL: {detail}")
            sys.exit(1)
        print(f"✓ {detail}")

    valid, api_detail = check_session_valid()
    print(f"API check: {'✓' if valid else '✗'} — {api_detail}")

    if not valid:
        print("Session invalid, attempting refresh...")
        ok, detail = try_refresh_session()
        if ok:
            valid2, api2 = check_session_valid()
            if valid2:
                print(f"✓ Refreshed and verified")
                log_health("refreshed", detail)
                send_telegram("🔄 <b>IG Session refreshed</b> automatically")
                sys.exit(0)

        msg = (
            f"❌ <b>IG Session Expired</b>\n"
            f"{api_detail}\n\n"
            f"Action needed:\n"
            f"1. Open instagram.com in browser\n"
            f"2. DevTools → Cookies → copy sessionid\n"
            f"3. Update nihongo-reels/.env IG_SESSION_ID=...\n"
            f"4. Run: python3 scripts/ig_health_check.py"
        )
        send_telegram(msg)
        log_health("expired", api_detail)
        print("FAIL: Session expired, Telegram alert sent")
        sys.exit(1)

    age_warn = check_session_age_warning()
    if age_warn:
        level, warn_msg = age_warn
        print(f"⚠️  {warn_msg}")
        last_warn = None
        if HEALTH_LOG.exists():
            history = json.loads(HEALTH_LOG.read_text())
            warnings = [h for h in history if h["status"] in ("warning", "critical")]
            if warnings:
                last_warn = datetime.fromisoformat(warnings[-1]["timestamp"])
        should_alert = last_warn is None or (datetime.now() - last_warn).days >= 3
        if should_alert:
            emoji = "🔴" if level == "critical" else "🟡"
            send_telegram(f"{emoji} <b>IG Session {level}</b>\n{warn_msg}")
        log_health(level, warn_msg)
        sys.exit(2)

    log_health("healthy", api_detail)
    print("✓ Session healthy")
    sys.exit(0)


if __name__ == "__main__":
    main()
