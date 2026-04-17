#!/usr/bin/env python3
"""Generate Edge TTS audio + timings for all kana pairs."""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "kana" / "data.ts"
OUT = ROOT / "public" / "kana"
TIMINGS_DIR = ROOT / "src" / "kana" / "timings"
VOICE = "ja-JP-NanamiNeural"
RATE = "-10%"


def probe_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


async def synth(text: str, path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
    print(f"  ✓ {path.name}")


def parse_pairs():
    """Extract kana pair data from data.ts via a lightweight regex parse."""
    src = DATA.read_text(encoding="utf-8")
    # crude: match each {id: "NN", ..., left: {char:"X", word:"W", ...}, right: {...}, quizWhich: "..."}
    blocks = re.findall(
        r'id:\s*"(\d+)".*?left:\s*\{\s*char:\s*"([^"]+)",\s*word:\s*"([^"]+)".*?\}.*?right:\s*\{\s*char:\s*"([^"]+)",\s*word:\s*"([^"]+)".*?\}.*?quizWhich:\s*"(left|right)"',
        src, flags=re.DOTALL,
    )
    return [
        {
            "id": b[0],
            "leftChar": b[1], "leftWord": b[2],
            "rightChar": b[3], "rightWord": b[4],
            "quizWhich": b[5],
        } for b in blocks
    ]


async def main():
    pairs = parse_pairs()
    for p in pairs:
        d = OUT / p["id"]
        print(f"[kana {p['id']}] {p['leftChar']} vs {p['rightChar']}")
        # both chars, comma pause between
        await synth(f"{p['leftChar']}、{p['rightChar']}", d / "chars.mp3")
        which_word = p["leftWord"] if p["quizWhich"] == "left" else p["rightWord"]
        await synth(which_word, d / "example.mp3")
        timings = {
            "chars": probe_duration(d / "chars.mp3"),
            "example": probe_duration(d / "example.mp3"),
        }
        (TIMINGS_DIR / f"{p['id']}.json").write_text(json.dumps(timings, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
