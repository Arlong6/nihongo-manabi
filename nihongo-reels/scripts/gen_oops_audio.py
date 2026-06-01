#!/usr/bin/env python3
"""Generate Edge TTS audio + timings for oops (tourist pitfall) cases."""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "oops" / "data.ts"
OUT = ROOT / "public" / "oops"
TIMINGS_DIR = ROOT / "src" / "oops" / "timings"
VOICE = "ja-JP-NanamiNeural"
RATE = "-10%"


def probe(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


async def synth(text: str, path: Path):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
    print(f"  ✓ {path.name}")


def parse_cases():
    src = DATA.read_text(encoding="utf-8")
    blocks = re.findall(
        r'id:\s*"(\d+)".*?pitfall_phrase:\s*"([^"]+)".*?correct_phrase:\s*"([^"]+)"',
        src, flags=re.DOTALL,
    )
    return [{"id": b[0], "pitfall": b[1], "correct": b[2]} for b in blocks]


def strip_stage_directions(text: str) -> str:
    """Remove Chinese parenthetical stage directions like （背對店員大喊） so TTS
    doesn't read them aloud. Keep Japanese full-width brackets intact."""
    return re.sub(r"（[^）]*）", "", text).strip()


async def main():
    for c in parse_cases():
        d = OUT / c["id"]
        pitfall_tts = strip_stage_directions(c["pitfall"])
        correct_tts = strip_stage_directions(c["correct"])
        print(f"[oops {c['id']}] ❌ {pitfall_tts} → ✅ {correct_tts}")
        await synth(pitfall_tts, d / "pitfall.mp3")
        await synth(correct_tts, d / "correct.mp3")
        timings = {
            "pitfall": probe(d / "pitfall.mp3"),
            "correct": probe(d / "correct.mp3"),
        }
        (TIMINGS_DIR / f"{c['id']}.json").write_text(json.dumps(timings, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
