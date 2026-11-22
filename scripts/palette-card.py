"""Draw a palette card for one theme in design/themes.json.

Usage: python scripts/palette-card.py home docs/design/home-palette.png
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

S = 2
W, H = 1200, 470
FONT_DIR = "C:/Windows/Fonts/"

NAMES = [
    ("bg", "底色"),
    ("surface", "面板"),
    ("sidebar", "侧栏"),
    ("text", "正文"),
    ("brand", "主色"),
    ("accent", "强调"),
    ("bubble", "气泡"),
]


def hexrgb(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in range(0, 6, 2))


def main(theme_id, out):
    with open("design/themes.json", encoding="utf-8") as handle:
        theme = json.load(handle)["themes"][theme_id]

    img = Image.new("RGB", (W * S, H * S), (24, 24, 27))
    draw = ImageDraw.Draw(img)
    font_title = ImageFont.truetype(FONT_DIR + "msyhbd.ttc", 34 * S)
    font_body = ImageFont.truetype(FONT_DIR + "msyh.ttc", 20 * S)
    font_mono = ImageFont.truetype(FONT_DIR + "consola.ttf", 17 * S)

    draw.text((48 * S, 30 * S), theme["label"]["zh"] + "  ·  " + theme_id.upper(),
              font=font_title, fill=(242, 231, 206))

    for row, mode in enumerate(("light", "dark")):
        palette = theme[mode]
        top = (118 + row * 176) * S
        draw.text((48 * S, top - 26 * S), "浅色 light" if mode == "light" else "深色 dark",
                  font=font_body, fill=(150, 140, 125))
        for index, (key, label) in enumerate(NAMES):
            left = (48 + index * 158) * S
            width, height = 146 * S, 92 * S
            color = hexrgb(palette[key])
            draw.rounded_rectangle([left, top, left + width, top + height],
                                   radius=10 * S, fill=color, outline=(255, 255, 255, 24), width=1 * S)
            draw.text((left, top + height + 8 * S), label, font=font_body, fill=(214, 205, 190))
            draw.text((left, top + height + 36 * S), palette[key].upper(), font=font_mono, fill=(150, 140, 125))

    img = img.resize((W, H), Image.LANCZOS)
    img.save(out, optimize=True)
    print("wrote", out)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "home",
         sys.argv[2] if len(sys.argv) > 2 else "docs/design/home-palette.png")
