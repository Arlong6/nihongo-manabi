#!/usr/bin/env python3
"""Read App Store Connect app metadata (name/subtitle/keywords) via the ASC API.

Auth = a short-lived JWT (ES256) signed with an ASC API key (.p8).
Env: ASC_KEY_ID, ASC_ISSUER_ID, ASC_P8_PATH, ASC_APP_ID
"""
import json
import os
import time
import urllib.error
import urllib.request

import jwt

API = "https://api.appstoreconnect.apple.com"


def token() -> str:
    now = int(time.time())
    with open(os.environ["ASC_P8_PATH"]) as f:
        key = f.read()
    return jwt.encode(
        {"iss": os.environ["ASC_ISSUER_ID"], "iat": now, "exp": now + 1200,
         "aud": "appstoreconnect-v1"},
        key, algorithm="ES256",
        headers={"kid": os.environ["ASC_KEY_ID"], "typ": "JWT"},
    )


def get(path: str, tok: str) -> dict:
    req = urllib.request.Request(API + path, headers={"Authorization": f"Bearer {tok}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    tok = token()
    app_id = os.environ["ASC_APP_ID"]

    print("### 名稱 / 副標題 (appInfoLocalizations) ###")
    for info in get(f"/v1/apps/{app_id}/appInfos", tok).get("data", []):
        a = info["attributes"]
        state = a.get("appStoreState") or a.get("state") or "?"
        locs = get(f"/v1/appInfos/{info['id']}/appInfoLocalizations", tok)
        print(f"-- appInfo state={state} --")
        for loc in locs.get("data", []):
            la = loc["attributes"]
            print(f"  [{la.get('locale')}] name={la.get('name')!r}  subtitle={la.get('subtitle')!r}")

    print("### 關鍵字 / 促銷文字 (appStoreVersionLocalizations) ###")
    for v in get(f"/v1/apps/{app_id}/appStoreVersions?limit=2", tok).get("data", []):
        va = v["attributes"]
        state = va.get("appStoreState") or va.get("appVersionState") or "?"
        print(f"-- version {va.get('versionString')} state={state} --")
        vlocs = get(f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations", tok)
        for loc in vlocs.get("data", []):
            la = loc["attributes"]
            print(f"  [{la.get('locale')}] keywords={la.get('keywords')!r}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:500]}")
