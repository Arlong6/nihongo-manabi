"""Discover Publer workspace_id + tiktok account_id, write to .env.

Run once after PUBLER_API_KEY is set in .env.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))

# Load .env first
from dotenv import load_dotenv  # type: ignore

load_dotenv(ROOT / ".env")

from publer_client import list_accounts, list_workspaces  # noqa: E402

ENV_PATH = ROOT / ".env"


def upsert_env(key: str, value: str) -> None:
    lines = ENV_PATH.read_text().splitlines() if ENV_PATH.exists() else []
    new_lines, found = [], False
    for ln in lines:
        if ln.startswith(f"{key}="):
            new_lines.append(f"{key}={value}")
            found = True
        else:
            new_lines.append(ln)
    if not found:
        new_lines.append(f"{key}={value}")
    ENV_PATH.write_text("\n".join(new_lines) + "\n")


def main() -> int:
    api_key = os.environ.get("PUBLER_API_KEY")
    if not api_key:
        print("ERROR: PUBLER_API_KEY not in .env", file=sys.stderr)
        return 1

    print("[setup] listing workspaces...")
    ws = list_workspaces(api_key)
    if not ws:
        print("ERROR: no workspaces returned", file=sys.stderr)
        return 1
    print(f"[setup] found {len(ws)} workspace(s)")
    for w in ws:
        print(f"  - {w.get('name', '?')} ({w.get('id')})")
    workspace = ws[0]
    workspace_id = workspace.get("id") or workspace.get("_id")
    if not workspace_id:
        print(f"ERROR: workspace has no id field: {workspace}", file=sys.stderr)
        return 1
    print(f"[setup] using workspace: {workspace_id}")

    print("[setup] listing connected accounts...")
    accounts = list_accounts(api_key, workspace_id)
    print(f"[setup] found {len(accounts)} account(s)")
    tiktok_acc = None
    for a in accounts:
        provider = (a.get("provider") or a.get("network") or "").lower()
        username = a.get("username") or a.get("name") or a.get("display_name") or "?"
        print(f"  - [{provider}] {username} ({a.get('id') or a.get('_id')})")
        if provider == "tiktok" and not tiktok_acc:
            tiktok_acc = a

    if not tiktok_acc:
        print("ERROR: no tiktok account connected on this workspace", file=sys.stderr)
        return 2
    tiktok_id = tiktok_acc.get("id") or tiktok_acc.get("_id")
    print(f"[setup] using tiktok account: {tiktok_id}")

    upsert_env("PUBLER_WORKSPACE_ID", workspace_id)
    upsert_env("PUBLER_TIKTOK_ACCOUNT_ID", tiktok_id)
    print(f"[setup] ✅ wrote to {ENV_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
