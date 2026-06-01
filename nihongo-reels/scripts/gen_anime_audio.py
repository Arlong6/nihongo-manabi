#!/usr/bin/env python3
"""Generate Edge TTS audio + timings for anime quotes.

Four tracks per entry:
  - quote.mp3         — Nanami JP (clean teaching voice) for the original quote
  - modern.mp3        — Character-matched JP voice for the modern echo (male
                        Keita for male characters, female Nanami for female,
                        prosody tuned per character vibe)
  - meaning_ch.mp3    — zh-TW HsiaoChen reading the Chinese translation
  - explanation_ch.mp3 — zh-TW HsiaoChen reading the deep-dive explanation
"""
import asyncio
import json
import re
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "anime" / "data.ts"
OUT = ROOT / "public" / "anime"
TIMINGS_DIR = ROOT / "src" / "anime" / "timings"

# Clean teaching voice for the canonical quote line
QUOTE_VOICE = "ja-JP-NanamiNeural"
QUOTE_RATE = "-10%"

# Chinese narrator for translation + deep-dive explanation
CH_VOICE = "zh-TW-HsiaoChenNeural"
CH_RATE = "-5%"

# Per-id voice + prosody for the modern_usage echo. Keita = male, Nanami = female.
# rate/pitch given as Edge-TTS deltas; default to slight slow & natural pitch.
CHAR_VOICE: dict[str, dict[str, str]] = {
    "01": {"voice": "ja-JP-KeitaNeural", "rate": "+5%",  "pitch": "+10Hz"},  # 鳴人 — energetic
    "02": {"voice": "ja-JP-KeitaNeural", "rate": "-15%", "pitch": "-30Hz"},  # DIO  — slow sneer
    "03": {"voice": "ja-JP-KeitaNeural", "rate": "-5%",  "pitch": "-10Hz"},  # 五條 — cool low
    "04": {"voice": "ja-JP-KeitaNeural", "rate": "+5%",  "pitch": "+5Hz"},   # 艾連 — intense
    "05": {"voice": "ja-JP-KeitaNeural", "rate": "+5%",  "pitch": "+15Hz"},  # 魯夫 — bright bold
    "06": {"voice": "ja-JP-KeitaNeural", "rate": "-15%", "pitch": "-25Hz"},  # 拳四郎 — cold flat
    "07": {"voice": "ja-JP-KeitaNeural", "rate": "+0%",  "pitch": "+0Hz"},   # 煉獄 — clean passionate
    "08": {"voice": "ja-JP-KeitaNeural", "rate": "-10%", "pitch": "-25Hz"},  # Mikey — menacing low
    "09": {"voice": "ja-JP-KeitaNeural", "rate": "+5%",  "pitch": "-5Hz"},   # 銀時 — annoyed
    "10": {"voice": "ja-JP-KeitaNeural", "rate": "-5%",  "pitch": "-5Hz"},   # 埼玉 — deadpan
    "11": {"voice": "ja-JP-NanamiNeural","rate": "+10%", "pitch": "+25Hz"},  # 喬巴 — small/cute
    "12": {"voice": "ja-JP-NanamiNeural","rate": "+5%",  "pitch": "+15Hz"},  # 柯南 — boyish (use female voice with higher pitch)
    "13": {"voice": "ja-JP-NanamiNeural","rate": "+5%",  "pitch": "+10Hz"},  # 月野兔 — genki
    "14": {"voice": "ja-JP-KeitaNeural", "rate": "+5%",  "pitch": "+10Hz"},  # 日向 — energetic
    "15": {"voice": "ja-JP-KeitaNeural", "rate": "-10%", "pitch": "-15Hz"},  # 達爾 — sneering
    "16": {"voice": "ja-JP-KeitaNeural", "rate": "-15%", "pitch": "-10Hz"},  # 安西 — gentle wise
    "17": {"voice": "ja-JP-KeitaNeural", "rate": "-5%",  "pitch": "-15Hz"},  # 露伴 — cold firm
}


def probe(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


async def synth(text: str, path: Path, voice: str, rate: str, pitch: str = "+0Hz"):
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, voice, rate=rate, pitch=pitch).save(str(path))
    print(f"  ✓ {path.name} ({voice.split('-')[-1]} {rate} {pitch})")


def parse_entries():
    src = DATA.read_text(encoding="utf-8")
    blocks = re.findall(
        r'id:\s*"(\d+)".*?'
        r'quote:\s*"([^"]+)".*?'
        r'meaning:\s*"([^"]+)".*?'
        r'explanation:\s*"([^"]+)".*?'
        r'modern_usage:\s*"([^"]+)"',
        src, flags=re.DOTALL,
    )
    return [
        {"id": b[0], "quote": b[1], "meaning": b[2], "explanation": b[3], "modern_raw": b[4]}
        for b in blocks
    ]


def pick_modern_speech(quote: str, modern_raw: str) -> str:
    """Return the line for the character-voiced modern echo.

    Many modern_usage entries are Chinese narration. We want a clean Japanese line.
    Strategy:
      1. If modern_raw contains a Japanese sentence inside 「」, speak that.
      2. Otherwise fall back to the original quote (so the echo is still useful —
         the character re-says their iconic line with their own voice/tone).
    """
    m = re.search(r"「([^」]+)」", modern_raw)
    if m:
        return m.group(1).strip()
    return quote


def parse_extra(src: str, q_id: str) -> tuple[str, str, str]:
    """Re-parse a single entry to also grab anime + character + grammar_point."""
    entry = re.search(
        rf'id:\s*"{q_id}"(.*?)(?=id:\s*"\d+"|\Z)',
        src, flags=re.DOTALL,
    )
    block = entry.group(1) if entry else ""
    anime = re.search(r'anime:\s*"([^"]+)"', block)
    character = re.search(r'character:\s*"([^"]+)"', block)
    grammar = re.search(r'grammar_point:\s*"([^"]+)"', block)
    return (
        anime.group(1) if anime else "",
        character.group(1) if character else "",
        grammar.group(1) if grammar else "",
    )


async def main():
    src = DATA.read_text(encoding="utf-8")
    for q in parse_entries():
        d = OUT / q["id"]
        anime, character, grammar = parse_extra(src, q["id"])

        print(f"[anime {q['id']}] quote: {q['quote']}")
        await synth(q["quote"], d / "quote.mp3", QUOTE_VOICE, QUOTE_RATE)

        cfg = CHAR_VOICE.get(q["id"], {"voice": QUOTE_VOICE, "rate": "+0%", "pitch": "+0Hz"})
        speech = pick_modern_speech(q["quote"], q["modern_raw"])
        print(f"           echo:    {speech}")
        await synth(speech, d / "modern.mp3", cfg["voice"], cfg["rate"], cfg["pitch"])

        print(f"           meaning: {q['meaning']}")
        await synth(q["meaning"], d / "meaning_ch.mp3", CH_VOICE, CH_RATE)

        print(f"           explain: {q['explanation'][:30]}...")
        await synth(q["explanation"], d / "explanation_ch.mp3", CH_VOICE, CH_RATE)

        hook_line = f"{anime}的{character}，經典台詞。"
        print(f"           hook:    {hook_line}")
        await synth(hook_line, d / "hook_ch.mp3", CH_VOICE, "+0%")

        print(f"           grammar: {grammar}")
        await synth(grammar, d / "grammar_ch.mp3", CH_VOICE, CH_RATE)

        cta_line = "想學更多日文，App Store 搜尋 Nihongo Manabi。"
        await synth(cta_line, d / "cta_ch.mp3", CH_VOICE, "+0%")

        timings = {
            "quote": probe(d / "quote.mp3"),
            "modern": probe(d / "modern.mp3"),
            "meaning_ch": probe(d / "meaning_ch.mp3"),
            "explanation_ch": probe(d / "explanation_ch.mp3"),
            "hook_ch": probe(d / "hook_ch.mp3"),
            "grammar_ch": probe(d / "grammar_ch.mp3"),
            "cta_ch": probe(d / "cta_ch.mp3"),
        }
        (TIMINGS_DIR / f"{q['id']}.json").write_text(json.dumps(timings, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
