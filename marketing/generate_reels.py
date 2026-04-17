#!/usr/bin/env python3
"""
Nihongo Manabi — IG Reel Generator v2
Upgraded: hook → word → example → tip → CTA
With: fade animations, background music, watermark, dynamic text
"""

import asyncio
import json
import math
import os
import shutil
import subprocess
import edge_tts
from PIL import Image, ImageDraw, ImageFont

DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(DIR, "reels")
WORDS_FILE = os.path.join(DIR, "daily_words.json")
BGM_FILE = "/Users/arlong/Projects/AIvideo/music_cache/books_library/Fluidscape.mp3"

W, H = 1080, 1920
FPS = 30

# Theme
BG = "#1a1a2e"
ACCENT = "#e94560"
WHITE = "#ffffff"
GRAY = "#a0a0b0"
DARK_GRAY = "#505060"
WATERMARK = "@llearn.nihongo.nanabi"

# Hooks templates
HOOKS = [
    "你知道「{jp}」怎麼唸嗎？",
    "「{jp}」是什麼意思？",
    "這個漢字你會唸嗎？ → {jp}",
    "日文小測驗：「{jp}」= ？",
    "猜猜看！「{jp}」的意思是？",
]


def get_font(size):
    """Find a CJK-compatible font."""
    for fp in [
        "/System/Library/Fonts/ヒラギノ角ゴシック W6.ttc",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/System/Library/Fonts/STHeiti Light.ttc",
    ]:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                continue
    return ImageFont.load_default()


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def draw_text_centered(draw, y, text, font, fill, max_width=900):
    """Draw text centered, with word wrap for long text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]

    if tw <= max_width:
        draw.text((W // 2, y), text, fill=fill, font=font, anchor="mm")
        return bbox[3] - bbox[1]

    # Word wrap
    lines = []
    current = ""
    for char in text:
        test = current + char
        tbbox = draw.textbbox((0, 0), test, font=font)
        if tbbox[2] - tbbox[0] > max_width:
            lines.append(current)
            current = char
        else:
            current = test
    if current:
        lines.append(current)

    line_h = bbox[3] - bbox[1] + 8
    total_h = line_h * len(lines)
    start_y = y - total_h // 2

    for i, line in enumerate(lines):
        draw.text((W // 2, start_y + i * line_h + line_h // 2), line,
                  fill=fill, font=font, anchor="mm")
    return total_h


def create_frame(frame_type, word, day_num, alpha=255):
    """Create a single frame image. alpha controls fade (0-255)."""
    img = Image.new("RGBA", (W, H), hex_to_rgb(BG) + (255,))
    draw = ImageDraw.Draw(img)

    # Apply fade
    a = alpha

    def c(color, a=a):
        """Color with alpha."""
        rgb = hex_to_rgb(color) if isinstance(color, str) else color
        return rgb + (a,)

    jp = word["japanese"]
    rd = word["reading"]
    zh = word["chinese"]
    en = word["english"]
    lv = word["level"]
    ex = word.get("example", "")
    ex_zh = word.get("exampleChinese", "")

    if frame_type == "hook":
        hook_text = HOOKS[day_num % len(HOOKS)].format(jp=jp)
        font_hook = get_font(56)
        font_sub = get_font(28)

        draw_text_centered(draw, H // 2 - 40, hook_text, font_hook, c(WHITE))
        draw.text((W // 2, H // 2 + 60), f"JLPT {lv}",
                  fill=c(ACCENT), font=font_sub, anchor="mm")

    elif frame_type == "word":
        font_kanji = get_font(180)
        font_reading = get_font(52)
        font_meaning = get_font(40)
        font_level = get_font(24)

        # Level badge
        draw.text((W // 2, 350), f"JLPT {lv}",
                  fill=c(ACCENT), font=font_level, anchor="mm")

        # Big kanji
        draw.text((W // 2, H // 2 - 120), jp,
                  fill=c(WHITE), font=font_kanji, anchor="mm")

        # Reading
        draw.text((W // 2, H // 2 + 60), rd,
                  fill=c(GRAY), font=font_reading, anchor="mm")

        # Divider line
        draw.line([(W // 2 - 100, H // 2 + 120), (W // 2 + 100, H // 2 + 120)],
                  fill=c(DARK_GRAY), width=2)

        # Meaning
        draw.text((W // 2, H // 2 + 170), zh,
                  fill=c(WHITE), font=font_meaning, anchor="mm")
        draw.text((W // 2, H // 2 + 230), en,
                  fill=c(GRAY), font=get_font(32), anchor="mm")

    elif frame_type == "example":
        font_label = get_font(28)
        font_jp = get_font(44)
        font_zh = get_font(34)

        draw.text((W // 2, H // 3 - 60), "例句 Example",
                  fill=c(ACCENT), font=font_label, anchor="mm")

        # Japanese example
        draw_text_centered(draw, H // 2 - 60, ex, font_jp, c(WHITE))

        # Divider
        draw.line([(W // 2 - 80, H // 2 + 20), (W // 2 + 80, H // 2 + 20)],
                  fill=c(DARK_GRAY), width=1)

        # Chinese translation
        draw_text_centered(draw, H // 2 + 80, ex_zh, font_zh, c(GRAY))

    elif frame_type == "cta":
        font_app = get_font(44)
        font_action = get_font(36)
        font_sub = get_font(24)

        draw.text((W // 2, H // 3 + 50), "Nihongo Manabi",
                  fill=c(WHITE), font=font_app, anchor="mm")

        draw.text((W // 2, H // 2 - 20), "收藏這則 學更多",
                  fill=c(ACCENT), font=font_action, anchor="mm")

        draw.text((W // 2, H // 2 + 60), "App Store 搜尋下載 · NT$30 買斷",
                  fill=c(GRAY), font=font_sub, anchor="mm")

    # Watermark (always)
    font_wm = get_font(20)
    draw.text((W // 2, H - 80), WATERMARK,
              fill=hex_to_rgb(DARK_GRAY) + (180,), font=font_wm, anchor="mm")

    # Day number badge (top left)
    font_day = get_font(20)
    draw.text((60, 60), f"Day {day_num}",
              fill=hex_to_rgb(GRAY) + (150,), font=font_day, anchor="lm")

    return img.convert("RGB")


def generate_fade_frames(frame_type, word, day_num, duration_s, out_dir, start_idx=0):
    """Generate frames with fade-in effect (first 0.5s)."""
    total_frames = int(duration_s * FPS)
    fade_frames = int(0.4 * FPS)  # 0.4s fade in

    paths = []
    for i in range(total_frames):
        alpha = min(255, int(255 * i / fade_frames)) if i < fade_frames else 255
        img = create_frame(frame_type, word, day_num, alpha)
        path = os.path.join(out_dir, f"frame_{start_idx + i:05d}.png")
        img.save(path)
        paths.append(path)

    return paths


async def generate_audio(text, filename, voice="ja-JP-NanamiNeural", rate="-20%"):
    tts = edge_tts.Communicate(text, voice, rate=rate)
    await tts.save(filename)


def get_duration(path):
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", path],
        capture_output=True, text=True)
    try:
        return float(json.loads(r.stdout)["format"]["duration"])
    except:
        return 2.0


def assemble_reel(day_num, word, audio_word, audio_example):
    """Assemble a complete reel with fade animations and BGM."""
    tmp = os.path.join(OUTPUT_DIR, f"_tmp_{day_num:02d}")
    os.makedirs(tmp, exist_ok=True)

    word_dur = get_duration(audio_word)
    example_dur = get_duration(audio_example)

    # Section durations
    hook_dur = 2.5
    word_dur_total = max(word_dur + 1.5, 4.0)
    example_dur_total = max(example_dur + 1.5, 4.5)
    cta_dur = 3.0

    # Generate frames for each section
    sections = [
        ("hook", hook_dur, None),
        ("word", word_dur_total, audio_word),
        ("example", example_dur_total, audio_example),
        ("cta", cta_dur, None),
    ]

    segments = []
    for sec_name, sec_dur, sec_audio in sections:
        frames_dir = os.path.join(tmp, f"{sec_name}_frames")
        os.makedirs(frames_dir, exist_ok=True)

        # Generate frames with fade
        generate_fade_frames(sec_name, word, day_num, sec_dur, frames_dir)

        # Encode segment
        seg_path = os.path.join(tmp, f"{sec_name}.mp4")

        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(FPS),
            "-i", os.path.join(frames_dir, "frame_%05d.png"),
        ]

        if sec_audio:
            cmd += ["-i", sec_audio]
            cmd += [
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-t", str(sec_dur),
                "-pix_fmt", "yuv420p",
                seg_path
            ]
        else:
            cmd += [
                "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-t", str(sec_dur),
                "-pix_fmt", "yuv420p",
                "-shortest",
                seg_path
            ]

        subprocess.run(cmd, capture_output=True, text=True)
        segments.append(seg_path)

    # Concat all segments
    concat_file = os.path.join(tmp, "concat.txt")
    with open(concat_file, "w") as f:
        for seg in segments:
            f.write(f"file '{seg}'\n")

    concat_out = os.path.join(tmp, "concat.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_file, "-c", "copy", concat_out
    ], capture_output=True, text=True)

    # Add background music
    final_out = os.path.join(OUTPUT_DIR, f"reel_day{day_num:02d}.mp4")
    total_dur = get_duration(concat_out)

    if os.path.exists(BGM_FILE):
        subprocess.run([
            "ffmpeg", "-y",
            "-i", concat_out,
            "-i", BGM_FILE,
            "-filter_complex",
            f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{total_dur},volume=0.12[bgm];"
            f"[0:a][bgm]amix=inputs=2:duration=first[aout]",
            "-map", "0:v", "-map", "[aout]",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "128k",
            "-t", str(total_dur),
            final_out
        ], capture_output=True, text=True)
    else:
        shutil.copy2(concat_out, final_out)

    # Cleanup
    shutil.rmtree(tmp)

    if os.path.exists(final_out):
        return final_out, get_duration(final_out), os.path.getsize(final_out) / (1024 * 1024)
    return None, 0, 0


def generate_caption(word, day_num):
    """Generate IG caption for the reel."""
    jp = word["japanese"]
    rd = word["reading"]
    zh = word["chinese"]
    en = word["english"]
    lv = word["level"]
    ex = word.get("example", "")
    ex_zh = word.get("exampleChinese", "")

    caption = f"""📖 每日一字 Day {day_num}

{jp}（{rd}）
意思：{zh} / {en}
Level: {lv}

例句：{ex}
翻譯：{ex_zh}

💾 收藏這則，學更多日文！
📱 App Store 搜尋「Nihongo Manabi」

#日語學習 #日本語 #JLPT #{lv} #學日文 #每日一字 #nihongo #japanese #learnjapanese #日語單字 #日文 #japaneselearning"""

    return caption


async def main():
    with open(WORDS_FILE) as f:
        words = json.load(f)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    captions_dir = os.path.join(DIR, "captions")
    os.makedirs(captions_dir, exist_ok=True)

    count = int(os.environ.get("REEL_COUNT", "3"))  # Default 3 for testing
    print(f"=== Nihongo Manabi Reel Generator v2 ===")
    print(f"Generating {count} reels...\n")

    for i in range(1, count + 1):
        if i > len(words):
            break

        word = words[i - 1]
        print(f"Day {i:02d}: {word['japanese']} ({word['reading']}) ...", end=" ", flush=True)

        # Audio
        audio_dir = os.path.join(OUTPUT_DIR, f"_audio_{i:02d}")
        os.makedirs(audio_dir, exist_ok=True)

        word_audio = os.path.join(audio_dir, "word.mp3")
        await generate_audio(f"{word['japanese']}。{word['reading']}", word_audio)

        example_audio = os.path.join(audio_dir, "example.mp3")
        await generate_audio(word.get("example", ""), example_audio)

        # Assemble
        path, dur, size = assemble_reel(i, word, word_audio, example_audio)

        # Caption
        caption = generate_caption(word, i)
        with open(os.path.join(captions_dir, f"day{i:02d}.txt"), "w") as f:
            f.write(caption)

        # Cleanup audio
        shutil.rmtree(audio_dir)

        if path:
            print(f"✓ {dur:.1f}s {size:.1f}MB")
        else:
            print("✗ failed")

    print(f"\n✅ Reels: {OUTPUT_DIR}/")
    print(f"✅ Captions: {captions_dir}/")


if __name__ == "__main__":
    asyncio.run(main())
