#!/usr/bin/env python3
"""Generate Edge TTS audio + timings for grammar points.

Keeps the Japanese example sentences, wrong and correct demos, and the pattern read-out.
"""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "grammar" / "data.ts"
OUT = ROOT / "public" / "grammar"
TIMINGS_DIR = ROOT / "src" / "grammar" / "timings"
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


def parse_points():
    src = DATA.read_text(encoding="utf-8")
    blocks = re.findall(
        r'id:\s*"(\d+)".*?pattern:\s*"([^"]+)".*?example1:\s*\{\s*ja:\s*"([^"]+)".*?\}.*?example2:\s*\{\s*ja:\s*"([^"]+)".*?\}.*?wrong:\s*\{\s*ja:\s*"([^"]+)".*?\}.*?correct:\s*\{\s*ja:\s*"([^"]+)".*?\}',
        src, flags=re.DOTALL,
    )
    return [{"id": b[0], "pattern": b[1], "ex1": b[2], "ex2": b[3], "wrong": b[4], "correct": b[5]} for b in blocks]


async def main():
    for p in parse_points():
        d = OUT / p["id"]
        print(f"[grammar {p['id']}] {p['pattern']}")
        # strip tilde markers for TTS (〜 reads awkwardly)
        pattern_clean = p["pattern"].replace("〜", "")
        await synth(pattern_clean, d / "pattern.mp3")
        await synth(p["ex1"], d / "example-1.mp3")
        await synth(p["ex2"], d / "example-2.mp3")
        await synth(p["wrong"], d / "wrong.mp3")
        await synth(p["correct"], d / "correct.mp3")
        timings = {
            "pattern": probe(d / "pattern.mp3"),
            "example1": probe(d / "example-1.mp3"),
            "example2": probe(d / "example-2.mp3"),
            "wrong": probe(d / "wrong.mp3"),
            "correct": probe(d / "correct.mp3"),
        }
        (TIMINGS_DIR / f"{p['id']}.json").write_text(json.dumps(timings, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
