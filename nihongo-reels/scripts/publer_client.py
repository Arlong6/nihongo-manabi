"""Publer API client for TikTok auto-posting.

Auth: Authorization: Bearer-API <key>, Publer-Workspace-Id: <ws_id>.
Two-step post: upload media → schedule post referencing media id.
"""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import requests

API_BASE = "https://app.publer.com/api/v1"


def _headers(api_key: str, workspace_id: str | None = None) -> dict[str, str]:
    h = {"Authorization": f"Bearer-API {api_key}"}
    if workspace_id:
        h["Publer-Workspace-Id"] = workspace_id
    return h


def list_workspaces(api_key: str) -> list[dict[str, Any]]:
    r = requests.get(f"{API_BASE}/workspaces", headers=_headers(api_key), timeout=30)
    r.raise_for_status()
    data = r.json()
    return data.get("workspaces", data) if isinstance(data, dict) else data


def list_accounts(api_key: str, workspace_id: str) -> list[dict[str, Any]]:
    r = requests.get(f"{API_BASE}/accounts", headers=_headers(api_key, workspace_id), timeout=30)
    r.raise_for_status()
    data = r.json()
    return data.get("accounts", data) if isinstance(data, dict) else data


def upload_video(api_key: str, workspace_id: str, video_path: Path) -> dict[str, Any]:
    """POST /media with file. Returns {id, thumbnail, ...}."""
    with open(video_path, "rb") as f:
        files = {"file": (video_path.name, f, "video/mp4")}
        data = {"direct_upload": "true", "in_library": "false"}
        r = requests.post(
            f"{API_BASE}/media",
            headers=_headers(api_key, workspace_id),
            files=files,
            data=data,
            timeout=600,
        )
    r.raise_for_status()
    return r.json()


def schedule_tiktok_video(
    api_key: str,
    workspace_id: str,
    tiktok_account_id: str,
    media_id: str,
    caption: str,
    thumbnail_url: str | None = None,
    scheduled_at: datetime | None = None,
) -> dict[str, Any]:
    """Schedule a TikTok video. Default scheduled_at = now+90s (effectively immediate)."""
    if scheduled_at is None:
        scheduled_at = datetime.now(timezone.utc) + timedelta(seconds=90)
    thumb = thumbnail_url or ""
    payload = {
        "bulk": {
            "state": "scheduled",
            "posts": [
                {
                    "networks": {
                        "tiktok": {
                            "type": "video",
                            "media": [
                                {
                                    "id": media_id,
                                    "thumbnails": [{"real": thumb, "small": thumb}],
                                }
                            ],
                            "text": caption,
                            "details": {},
                        }
                    },
                    "accounts": [
                        {
                            "id": tiktok_account_id,
                            "scheduled_at": scheduled_at.isoformat(timespec="seconds").replace("+00:00", "Z"),
                        }
                    ],
                }
            ],
        }
    }
    r = requests.post(
        f"{API_BASE}/posts/schedule",
        headers={**_headers(api_key, workspace_id), "Content-Type": "application/json"},
        json=payload,
        timeout=60,
    )
    r.raise_for_status()
    return r.json()


def post_video_to_tiktok(video_path: Path, caption: str) -> dict[str, Any]:
    """High-level helper auto_post.py uses. Reads env, uploads, schedules.

    Returns {"media_id": ..., "schedule_response": ...}.
    Raises RuntimeError if env vars missing.
    """
    api_key = os.environ.get("PUBLER_API_KEY")
    workspace_id = os.environ.get("PUBLER_WORKSPACE_ID")
    account_id = os.environ.get("PUBLER_TIKTOK_ACCOUNT_ID")
    missing = [k for k, v in [
        ("PUBLER_API_KEY", api_key),
        ("PUBLER_WORKSPACE_ID", workspace_id),
        ("PUBLER_TIKTOK_ACCOUNT_ID", account_id),
    ] if not v]
    if missing:
        raise RuntimeError(f"Publer env vars missing: {', '.join(missing)}")
    upload = upload_video(api_key, workspace_id, video_path)
    media_id = upload.get("id")
    if not media_id:
        raise RuntimeError(f"Publer upload returned no id: {upload}")
    thumb = upload.get("thumbnail") or upload.get("path")
    schedule = schedule_tiktok_video(api_key, workspace_id, account_id, media_id, caption, thumbnail_url=thumb)
    return {"media_id": media_id, "thumbnail": thumb, "schedule_response": schedule}
