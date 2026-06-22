"""RevenueCat 營收快照 — stdlib-only。

GET /v2/projects/{id}/metrics/overview，回 MRR / 活躍訂閱 / 試用 / 營收 /
新客戶。印出摘要；--telegram 推一則到 Telegram。

需要 .env:
  RC_SECRET_KEY=sk_...        (RevenueCat v2 secret key, charts_metrics:overview:read 權限)
  RC_PROJECT_ID=...           (RC dashboard URL 裡那串)
  TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID  (--telegram 時用)

用法:
  python scripts/revenue_check.py            # 印到 stdout
  python scripts/revenue_check.py --telegram # 同時推 Telegram
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env"
API_BASE = "https://api.revenuecat.com/v2"


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    for line in ENV_FILE.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def fetch_overview(secret: str, project_id: str) -> dict:
    req = urllib.request.Request(
        f"{API_BASE}/projects/{project_id}/metrics/overview",
        headers={"Authorization": f"Bearer {secret}", "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="replace")[:300]
        raise RuntimeError(f"RevenueCat API HTTP {e.code}: {detail}") from None


def format_summary(data: dict) -> str:
    """metrics 是物件陣列，各含 id/name/value/unit。防禦性逐筆顯示。"""
    metrics = data.get("metrics", [])
    if not metrics:
        return "（RevenueCat 回傳沒有 metrics — 可能還沒任何交易資料）"
    # 友善名稱對照（id → 中文）
    label = {
        "active_subscriptions": "活躍訂閱",
        "active_trials": "試用中",
        "mrr": "MRR 月經常性營收",
        "revenue": "近 28 天營收",
        "new_customers": "近 28 天新客戶",
        "active_users": "活躍用戶",
    }
    lines = []
    for m in metrics:
        mid = m.get("id", "")
        name = label.get(mid, m.get("name", mid))
        val = m.get("value", "?")
        unit = m.get("unit", "")
        if unit == "$":
            lines.append(f"• {name}: ${val}")
        elif unit:
            lines.append(f"• {name}: {val} {unit}")
        else:
            lines.append(f"• {name}: {val}")
    return "\n".join(lines)


def telegram(msg: str) -> bool:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        print("（缺 TELEGRAM_BOT_TOKEN/CHAT_ID，跳過推播）", file=sys.stderr)
        return False
    data = urllib.parse.urlencode({"chat_id": chat_id, "text": msg, "parse_mode": "HTML"}).encode()
    try:
        with urllib.request.urlopen(
            f"https://api.telegram.org/bot{token}/sendMessage", data=data, timeout=15
        ) as r:
            return r.status == 200
    except Exception as e:
        print(f"telegram error: {e}", file=sys.stderr)
        return False


def main() -> int:
    load_env()
    secret = os.environ.get("RC_SECRET_KEY")
    project_id = os.environ.get("RC_PROJECT_ID")
    if not secret or not project_id:
        print("ERROR: 缺 RC_SECRET_KEY 或 RC_PROJECT_ID（見檔頭說明）", file=sys.stderr)
        return 1
    try:
        data = fetch_overview(secret, project_id)
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2
    summary = format_summary(data)
    header = "💰 <b>Nihongo Manabi 營收</b>"
    print(header.replace("<b>", "").replace("</b>", ""))
    print(summary)
    if "--telegram" in sys.argv:
        telegram(f"{header}\n{summary}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
