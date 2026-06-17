"""Vercel Blob upload — stdlib-only (urllib), no @vercel/blob, no requests.

launchd cron's Python lacks third-party packages (same reason publer_client
is stdlib-only), so we hit the Blob HTTP API directly. Contract mirrored from
the vercel_blob package single-part PUT path:

    PUT https://blob.vercel-storage.com/?pathname={name}
    headers: authorization: Bearer <token>, x-api-version: 10,
             x-content-type: <mime>, access: public, x-allow-overwrite: 1
    body: raw file bytes  ->  JSON { url, downloadUrl, pathname, ... }

The response `url` is the permanent public URL we store in the feed manifest.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

API_BASE = "https://blob.vercel-storage.com"
API_VERSION = "10"
CACHE_MAX_AGE = "31536000"   # 1 year — videos are immutable once posted
USER_AGENT = "nihongo-manabi-reels/1.0 (blob_upload.py; +https://github.com/Arlong6)"


def upload_blob(file_path: Path, pathname: str | None = None,
                content_type: str = "video/mp4") -> str:
    """Upload a file to Vercel Blob, return its public URL.

    Raises RuntimeError on missing token or non-200 response.
    """
    token = os.environ.get("BLOB_READ_WRITE_TOKEN")
    if not token:
        raise RuntimeError("BLOB_READ_WRITE_TOKEN not set")
    name = pathname or file_path.name
    data = file_path.read_bytes()
    req = urllib.request.Request(
        f"{API_BASE}/?pathname={urllib.parse.quote(name)}",
        data=data,
        method="PUT",
        headers={
            "authorization": f"Bearer {token}",
            "x-api-version": API_VERSION,
            "x-content-type": content_type,
            "x-cache-control-max-age": CACHE_MAX_AGE,
            "x-allow-overwrite": "1",
            "access": "public",
            "content-type": content_type,
            "content-length": str(len(data)),
            "user-agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            body = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = e.read().decode("utf-8", errors="replace")[:400]
        except Exception:
            pass
        raise RuntimeError(f"Blob PUT HTTP {e.code}: {detail}") from None
    url = body.get("url")
    if not url:
        raise RuntimeError(f"Blob upload returned no url: {body}")
    return url
