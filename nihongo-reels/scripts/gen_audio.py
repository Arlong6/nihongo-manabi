#!/usr/bin/env python3
"""Generate Edge TTS audio for every word in daily_words.json.

Outputs to public/audio/{NN}-reading.mp3 and {NN}-example.mp3.
"""
import asyncio
import json
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
WORDS = ROOT.parent / "marketing" / "daily_words.json"
OUT = ROOT / "public" / "audio"
JA_VOICE = "ja-JP-NanamiNeural"
JA_RATE = "-10%"
JA_HOOK_RATE = "-5%"


async def synth(text: str, path: Path, voice: str, rate: str) -> None:
    if path.exists():
        return
    tts = edge_tts.Communicate(text, voice, rate=rate)
    await tts.save(str(path))
    print(f"  ✓ {path.name}")


async def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    words = json.loads(WORDS.read_text(encoding="utf-8"))
    for i, w in enumerate(words, 1):
        idx = f"{i:02d}"
        print(f"[{idx}] {w['japanese']} ({w['reading']})")
        await synth(w["reading"], OUT / f"{idx}-reading.mp3", JA_VOICE, JA_RATE)
        await synth(w["example"], OUT / f"{idx}-example.mp3", JA_VOICE, JA_RATE)
        hook_text = f"「{w['japanese']}」、何て読むでしょう？"
        await synth(hook_text, OUT / f"{idx}-hook.mp3", JA_VOICE, JA_HOOK_RATE)
    await synth(
        "保存してね！",
        OUT / "cta.mp3",
        JA_VOICE,
        JA_HOOK_RATE,
    )


if __name__ == "__main__":
    asyncio.run(main())
