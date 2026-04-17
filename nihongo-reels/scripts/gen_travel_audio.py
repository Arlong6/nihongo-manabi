#!/usr/bin/env python3
"""Generate Edge TTS audio + timings for travel phrases."""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "travel" / "data.ts"
OUT = ROOT / "public" / "travel"
TIMINGS_DIR = ROOT / "src" / "travel" / "timings"
VOICE = "ja-JP-NanamiNeural"
RATE = "-10%"


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", str(path)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


async def synth(text, path):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
    print(f"  ✓ {path.name}")


def parse_phrases():
    src = DATA.read_text(encoding="utf-8")
    blocks = re.findall(
        r'id:\s*"(\d+)".*?phrase:\s*"([^"]+)".*?response:\s*\{\s*ja:\s*"([^"]+)"',
        src, flags=re.DOTALL,
    )
    return [{"id": b[0], "phrase": b[1], "response": b[2]} for b in blocks]


async def main():
    for p in parse_phrases():
        d = OUT / p["id"]
        print(f"[travel {p['id']}] {p['phrase']}")
        await synth(p["phrase"], d / "phrase.mp3")
        await synth(p["response"], d / "response.mp3")
        timings = {
            "phrase": probe(d / "phrase.mp3"),
            "response": probe(d / "response.mp3"),
        }
        (TIMINGS_DIR / f"{p['id']}.json").write_text(json.dumps(timings, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
