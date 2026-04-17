#!/usr/bin/env python3
"""Generate Edge TTS (zh-CN Xiaoxiao) audio for every crime case.

Also measures each mp3's actual duration via ffprobe and writes timings JSON
to src/crime/timings/{id}.json, which the Remotion composition reads so each
scene is long enough for its audio (no cut-offs).
"""
import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "crime"
TIMINGS_DIR = ROOT / "src" / "crime" / "timings"
VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+0%"


def probe_duration(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())

CASES = [
    {
        "id": "300m-yen",
        "hook": "日本史上最离奇的劫案——警方追了七年，连一个嫌犯都找不到。他们到底怎么做到的？",
        "setup": "1968年12月，东京府中。运钞车上的四人，不知道即将遇到什么。",
        "events": [
            "一名骑白色警用摩托车的警察，突然拦下运钞车。",
            "「车上被装了炸弹，快下车！」警察大喊，钻到车底检查。",
            "突然一阵白烟冒出——「要爆炸了，快逃！」",
            "四人躲远，回头一看。运钞车不见了。",
        ],
        "twist": "白烟是烟雾弹。摩托车是喷漆的假货。警察，是假扮的。三亿日元，在光天化日下蒸发。",
        "aftermath": "警方公开嫌犯的蒙太奇画像，动员全国追查七年。1975年公诉时效到期，1988年连民事追诉都结束。那七年的追查，化为一场空。嫌犯的真实身份，至今成谜。",
        "cta": "追踪看更多真实悬案。",
    }
]


async def synth(text: str, path: Path) -> None:
    if path.exists():
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(path))
    print(f"  ✓ {path.relative_to(ROOT)}")


async def main() -> None:
    TIMINGS_DIR.mkdir(parents=True, exist_ok=True)
    for case in CASES:
        cid = case["id"]
        d = OUT / cid
        print(f"[{cid}]")
        await synth(case["hook"], d / "hook.mp3")
        await synth(case["setup"], d / "setup.mp3")
        for i, ev in enumerate(case["events"], 1):
            await synth(ev, d / f"event-{i}.mp3")
        await synth(case["twist"], d / "twist.mp3")
        await synth(case["aftermath"], d / "aftermath.mp3")
        await synth(case["cta"], d / "cta.mp3")

        timings = {
            "hook": probe_duration(d / "hook.mp3"),
            "setup": probe_duration(d / "setup.mp3"),
            "events": [probe_duration(d / f"event-{i}.mp3") for i in range(1, len(case["events"]) + 1)],
            "twist": probe_duration(d / "twist.mp3"),
            "aftermath": probe_duration(d / "aftermath.mp3"),
            "cta": probe_duration(d / "cta.mp3"),
        }
        out = TIMINGS_DIR / f"{cid}.json"
        out.write_text(json.dumps(timings, indent=2))
        print(f"  ✓ {out.relative_to(ROOT)} ({sum([timings['hook'], timings['setup'], sum(timings['events']), timings['twist'], timings['aftermath'], timings['cta']]):.1f}s total audio)")


if __name__ == "__main__":
    asyncio.run(main())
