#!/usr/bin/env python3
"""IG Reels insights — per-reel reach & views via the Graph API.

One-time setup (needs a Business/Creator IG account linked to a FB Page):
  1. Open https://developers.facebook.com/tools/explorer
  2. Pick your app, then "Add a Permission" → check:
       instagram_basic, instagram_manage_insights,
       pages_show_list, pages_read_engagement
  3. Click "Generate Access Token", approve, copy the token.
  4. Run locally (token stays on disk, never in git):
       python3 scripts/ig_insights.py --setup <PASTED_TOKEN>
     → exchanges it for a 60-day token, discovers the IG business account id,
       writes IG_GRAPH_TOKEN + IG_BUSINESS_ID to .env, and verifies.

After setup:
  python3 scripts/ig_insights.py     # print last-7-day reel reach/views
  (also consumed by stats_digest.py)

The 60-day token is auto-refreshed daily by ig_token_refresh.py, which
ig_schedule.sh already runs once IG_GRAPH_TOKEN is present.
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
GRAPH_API = "https://graph.facebook.com/v21.0"
# Meta renamed reel video metrics over time (plays → views). Request the most
# likely set first and ladder down so one deprecated name can't zero the call.
METRIC_SETS = ["reach,views", "reach,plays", "reach"]


def load_env():
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


def _get(path: str, params: dict) -> dict:
    url = f"{GRAPH_API}/{path}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read())


def set_env_var(key: str, value: str) -> None:
    """Upsert KEY=value in .env (gitignored — never committed)."""
    lines = ENV_FILE.read_text().splitlines() if ENV_FILE.exists() else []
    out, found = [], False
    for ln in lines:
        if ln.startswith(f"{key}="):
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(ln)
    if not found:
        out.append(f"{key}={value}")
    ENV_FILE.write_text("\n".join(out) + "\n")


def _media_insights(media_id: str, token: str) -> dict:
    for metrics in METRIC_SETS:
        try:
            data = _get(f"{media_id}/insights", {"access_token": token, "metric": metrics})
            out = {}
            for row in data.get("data", []):
                vals = row.get("values", [{}])
                out[row.get("name")] = vals[0].get("value") if vals else None
            return out
        except Exception:
            continue
    return {}


def fetch(days: int = 7, token: str | None = None, ig_id: str | None = None):
    token = token or os.environ.get("IG_GRAPH_TOKEN")
    ig_id = ig_id or os.environ.get("IG_BUSINESS_ID")
    if not token or not ig_id:
        return []
    since = datetime.now(timezone.utc) - timedelta(days=days)
    media = _get(f"{ig_id}/media", {
        "access_token": token,
        "fields": "id,caption,timestamp,media_product_type",
        "limit": 25,
    })
    rows = []
    for m in media.get("data", []):
        ts = m.get("timestamp", "")
        try:
            when = datetime.fromisoformat(ts.replace("+0000", "+00:00"))
        except ValueError:
            continue
        if when < since:
            continue
        ins = _media_insights(m["id"], token)
        rows.append({
            "when": ts[:10],
            "cap": (m.get("caption") or "").split("\n")[0][:22],
            "reach": ins.get("reach"),
            "views": ins.get("views") if ins.get("views") is not None else ins.get("plays"),
        })
    return rows


def setup(short_token: str) -> None:
    app_id = os.environ.get("IG_GRAPH_APP_ID", "")
    app_secret = os.environ.get("IG_GRAPH_APP_SECRET", "")
    if not app_id or not app_secret:
        sys.exit("ERROR: IG_GRAPH_APP_ID / IG_GRAPH_APP_SECRET missing in .env")

    resp = _get("oauth/access_token", {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_token,
    })
    long_token = resp.get("access_token")
    if not long_token:
        sys.exit(f"ERROR: token exchange failed: {resp}")
    print(f"✓ 60-day token obtained (expires_in={resp.get('expires_in')}s)")

    pages = _get("me/accounts", {
        "access_token": long_token,
        "fields": "id,name,instagram_business_account",
    })
    ig_id = None
    for pg in pages.get("data", []):
        iba = pg.get("instagram_business_account")
        if iba:
            ig_id = iba.get("id")
            print(f"✓ IG business account via Page '{pg.get('name')}': {ig_id}")
            break
    if not ig_id:
        sys.exit(
            "ERROR: no Instagram Business account linked to any of your Pages.\n"
            "  → Convert @learn.nihongo.manabi to a Business/Creator account and\n"
            "    link it to a Facebook Page, then re-run --setup."
        )

    set_env_var("IG_GRAPH_TOKEN", long_token)
    set_env_var("IG_BUSINESS_ID", ig_id)
    print("✓ saved IG_GRAPH_TOKEN + IG_BUSINESS_ID to .env")

    rows = fetch(days=30, token=long_token, ig_id=ig_id)
    if rows:
        r = rows[0]
        print(f"✓ insights verified — e.g. {r['when']} reach={r['reach']} views={r['views']}")
        print("  Done. stats_digest will now include reach/views; the token auto-refreshes daily.")
    else:
        print("⚠️ token saved but no recent media/insights returned — check the account has recent reels.")


def main():
    load_env()
    if len(sys.argv) >= 3 and sys.argv[1] == "--setup":
        setup(sys.argv[2])
        return
    rows = fetch()
    if not rows:
        print("(no IG insights — run --setup first, or no recent reels)")
        return
    print("IG 近 7 天 Reel 觸及/觀看：")
    for r in rows:
        print(f"  {r['when']} {r['cap']} — reach {r['reach']}, views {r['views']}")


if __name__ == "__main__":
    main()
