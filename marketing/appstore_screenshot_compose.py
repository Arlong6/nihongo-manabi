"""Compose App Store screenshots: phone capture + marketing headline + brand bg.

Takes a raw 1290x2796 / 1320x2868 iPhone screenshot and frames it on a
brand-colored background with a Traditional-Chinese headline above (AIDA:
benefit-led title + supporting sub-line), output at App Store 6.9" size.

Usage:
    python appstore_screenshot_compose.py <source.png> <out.png> "主標" "副標"

Or run with no args to batch-process the SHOTS table below (expects sources
in marketing/screenshots_raw/, writes to marketing/screenshots_final/).
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# Brand palette (from app splash #1E1B4B indigo)
BG_TOP = (30, 27, 75)        # #1E1B4B deep indigo
BG_BOTTOM = (76, 29, 149)    # #4C1D95 purple — subtle vertical gradient
TEXT_MAIN = (255, 255, 255)
TEXT_SUB = (196, 181, 253)   # light lavender

CANVAS = (1320, 2868)        # App Store 6.9" (iPhone 16 Pro Max)
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"

ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "screenshots_raw"
OUT_DIR = ROOT / "screenshots_final"

# (source filename, main headline, sub headline)
SHOTS = [
    ("01_home.png",    "AI 老師陪你學日文",   "N5 到 N1，一站搞定"),
    ("02_ai_chat.png", "跟 AI 練口說",        "講錯立刻糾正，24/7 不用找老師"),
    ("03_jlpt.png",    "N5–N1 模擬考",        "答錯，AI 用中文解釋文法重點"),
    ("04_watch.png",   "看 Reel 學日文",      "像滑短影音一樣，每天自動更新"),
    ("05_phrases.png", "念出日文，即時評分",  "看得到自己哪裡不準"),
    ("06_camera.png",  "拍照翻譯，旅遊神器",  "招牌、菜單一拍秒懂"),
    ("07_paywall.png", "解鎖 Nihongo Pro",    "無限 AI 對話・進階模考・無廣告"),
]


def gradient_bg(size: tuple[int, int]) -> Image.Image:
    w, h = size
    bg = Image.new("RGB", size)
    px = bg.load()
    for y in range(h):
        t = y / h
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return bg


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, img.size[0], img.size[1]], radius=radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def fit_text(draw, text, font_path, max_w, start_size):
    size = start_size
    while size > 24:
        f = ImageFont.truetype(font_path, size)
        w = draw.textbbox((0, 0), text, font=f)[2]
        if w <= max_w:
            return f
        size -= 4
    return ImageFont.truetype(font_path, 24)


def compose(src: Path, out: Path, main: str, sub: str) -> None:
    canvas = gradient_bg(CANVAS)
    draw = ImageDraw.Draw(canvas)
    cw, ch = CANVAS
    margin = 90

    # Headline block (top ~16%)
    main_font = fit_text(draw, main, FONT_BOLD, cw - 2 * margin, 96)
    sub_font = fit_text(draw, sub, FONT_BOLD, cw - 2 * margin, 52)
    mb = draw.textbbox((0, 0), main, font=main_font)
    draw.text(((cw - mb[2]) / 2, 150), main, font=main_font, fill=TEXT_MAIN)
    sb = draw.textbbox((0, 0), sub, font=sub_font)
    draw.text(((cw - sb[2]) / 2, 150 + (mb[3] - mb[1]) + 50), sub, font=sub_font, fill=TEXT_SUB)

    # Phone screenshot, scaled to fit the lower ~78%, centered, rounded + shadow
    shot = Image.open(src).convert("RGB")
    top_y = 470
    avail_h = ch - top_y - 120
    avail_w = cw - 2 * 140
    scale = min(avail_w / shot.width, avail_h / shot.height)
    new = (int(shot.width * scale), int(shot.height * scale))
    shot = shot.resize(new, Image.LANCZOS)
    shot = rounded(shot, radius=56)
    px = (cw - new[0]) // 2
    # drop shadow
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([px + 8, top_y + 14, px + new[0] + 8, top_y + new[1] + 14],
                         radius=56, fill=(0, 0, 0, 90))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), shadow)
    canvas.alpha_composite(shot, (px, top_y))

    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, "PNG")
    print(f"✓ {out.name}  ({main})")


def main() -> int:
    if len(sys.argv) == 5:
        compose(Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4])
        return 0
    # batch mode
    missing = []
    for fname, m, s in SHOTS:
        src = RAW_DIR / fname
        if not src.exists():
            missing.append(fname)
            continue
        compose(src, OUT_DIR / fname, m, s)
    if missing:
        print(f"\n⚠️  缺來源圖（放進 {RAW_DIR}/）: {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
