"""Render the theme design mockup with Pillow (browser screenshots are blocked by
the sandbox: Chromium cannot open its mojo named pipes).

Usage: python scripts/mockup.py light|dark docs/design/preview-<mode>.png
Logical canvas is 1440x900, drawn at 2x and downsampled for crisp text.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

S = 2
W, H = 1440, 900
FONT_DIR = "C:/Windows/Fonts/"

LIGHT = dict(
    bg="#F6EEDC", surface="#FCF7EA", surface2="#F1E4C9", sidebar="#EFE2C7",
    text="#392D23", text2="#5E4B38", text3="#7A654B", text4="#8E7759",
    brand="#AE4C18", brandHover="#94400F", onBrand="#FFF6E2",
    accent="#D67D3D", success="#4C7A54", bubble="#F7E3B8", code="#F0E4CC",
)
DARK = dict(
    bg="#141A24", surface="#1B2330", surface2="#232D3D", sidebar="#101620",
    text="#F2E7CE", text2="#CDBB9E", text3="#A4927A", text4="#94846D",
    brand="#F2A93B", brandHover="#FFBE5A", onBrand="#241A10",
    accent="#E6A23C", success="#8FB794", bubble="#3A2B1B", code="#0E131B",
)


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def blend(fg, bg, a):
    f, b = rgb(fg), rgb(bg)
    return tuple(round(f[i] * a + b[i] * (1 - a)) for i in range(3))


def mix(fg, bg, t):
    f, b = rgb(fg), rgb(bg)
    return tuple(round(f[i] * t + b[i] * (1 - t)) for i in range(3))


class Canvas:
    def __init__(self, c):
        self.c = c
        self.im = Image.new("RGB", (W * S, H * S), c["bg"])
        self.d = ImageDraw.Draw(self.im)
        self.fonts = {}

    def f(self, family, size, bold=False):
        key = (family, size, bold)
        if key not in self.fonts:
            name = {"ui": "msyhbd.ttc" if bold else "msyh.ttc", "code": "consola.ttf", "codeb": "consolab.ttf"}[family]
            self.fonts[key] = ImageFont.truetype(FONT_DIR + name, int(size * S), index=0 if name.endswith("ttc") else 0)
        return self.fonts[key]

    def rect(self, x, y, w, h, fill=None, outline=None, width=1, r=0):
        box = [x * S, y * S, (x + w) * S - 1, (y + h) * S - 1]
        if r:
            self.d.rounded_rectangle(box, radius=r * S, fill=fill, outline=outline, width=width * S)
        else:
            self.d.rectangle(box, fill=fill, outline=outline, width=width * S)

    def text(self, x, y, s, font, fill, anchor="la"):
        self.d.text((x * S, y * S), s, font=font, fill=fill, anchor=anchor)

    def wrap(self, s, font, maxw):
        lines, cur = [], ""
        for ch in s:
            if self.d.textlength(cur + ch, font=font) <= maxw * S:
                cur += ch
            else:
                lines.append(cur)
                cur = ch
        if cur:
            lines.append(cur)
        return lines


def draw_lantern(cv, x, y, c):
    """20x20 paper lantern mark."""
    cv.rect(x + 6.2, y + 5.4, 7.6, 9.6, fill=c["brand"], r=2.4)
    cv.rect(x + 7.2, y + 6.4, 2.2, 7.6, fill=blend(c["onBrand"], c["brand"], 0.28), r=1.1)
    cv.rect(x + 5.6, y + 4, 8.8, 1.8, fill=c["text2"], r=0.9)
    cv.rect(x + 5.6, y + 14.4, 8.8, 1.8, fill=c["text2"], r=0.9)
    cv.d.arc([x * S + 8 * S, y * S + 1.6 * S, x * S + 12 * S, y * S + 5.6 * S], 180, 360,
             fill=c["text2"], width=1 * S)


def draw(mode, out):
    c = LIGHT if mode == "light" else DARK
    cv = Canvas(c)
    f_ui = lambda s, b=False: cv.f("ui", s, b)

    border1 = blend(c["text"], c["bg"], 0.10)
    border2 = blend(c["text"], c["bg"], 0.17)
    border3 = blend(c["text"], c["bg"], 0.27)
    shadow = blend(c["text"], c["bg"], 0.13) if mode == "light" else blend("#000000", c["bg"], 0.45)
    wash = blend(c["brand"], c["bg"], 0.07)
    on_sidebar = blend(c["text"], c["sidebar"], 0.17)
    on_sidebar1 = blend(c["text"], c["sidebar"], 0.10)

    # background wash (lantern light seeping in from the top)
    for i in range(260):
        a = 0.07 * (1 - i / 260) ** 1.6
        cv.d.line([(0, i * S), (W * S, i * S)], fill=blend(c["brand"], c["bg"], a))

    # ---- sidebar -------------------------------------------------------
    cv.rect(0, 0, 256, H, fill=c["sidebar"])
    for i in range(220):
        a = 0.06 * (1 - i / 220)
        cv.d.line([(0, i * S), (256 * S, i * S)], fill=blend(c["brand"], c["sidebar"], a))
    cv.d.line([(256 * S - 1, 0), (256 * S - 1, H * S)], fill=on_sidebar, width=1 * S)

    draw_lantern(cv, 16, 18, c)
    cv.text(44, 20, "DeepSeek Harness", f_ui(13.5, True), c["text"])
    cv.text(240, 22, "v0.2", f_ui(10.5), c["text3"], anchor="ra")

    cv.rect(12, 52, 232, 36, fill=c["surface"], outline=on_sidebar, r=4)
    cv.d.line([(13 * S, (52 + 36) * S - 1), (243 * S, (52 + 36) * S - 1)], fill=shadow, width=1 * S)
    cv.text(24, 61, "＋", f_ui(12), c["text2"])
    cv.text(40, 62, "新建会话", f_ui(13), c["text"])
    cv.text(232, 63, "Ctrl N", f_ui(10), c["text3"], anchor="ra")

    def section(y, label):
        cv.text(22, y, label, f_ui(10.5), c["text4"])
        return y + 22

    def item(y, label, active=False):
        if active:
            cv.rect(12, y - 6, 232, 30, fill=blend(c["brand"], c["sidebar"], 0.10), r=3)
            cv.rect(12, y - 2, 2, 22, fill=c["brand"], r=1)
            cv.text(22, y, label, f_ui(13), c["text"])
        else:
            cv.text(22, y, label, f_ui(13), c["text2"])
        return y + 30

    y = 108
    y = section(y, "今天")
    y = item(y, "温泉主题插件设计", True)
    y = item(y, "令牌对比度核算")
    y = section(y + 8, "更早")
    y = item(y, "Git 分支整理")
    y = item(y, "周报草稿")

    cv.d.line([(13 * S, 826 * S), (243 * S, 826 * S)], fill=on_sidebar1, width=1 * S)
    cv.text(22, 840, "设置", f_ui(12.5), c["text2"])
    cv.text(80, 840, "插件", f_ui(12.5), c["text2"])

    # ---- header --------------------------------------------------------
    cv.d.line([(256 * S, 56 * S), (W * S, 56 * S)], fill=border1, width=1 * S)
    cv.text(276, 19, "温泉主题插件设计", f_ui(14, True), c["text"])
    cv.rect(276 + 140, 21, 1, 16, fill=border2)
    cv.text(276 + 152, 21, "deepseek-flash", f_ui(11.5), c["text3"])
    cv.rect(1156, 15, 66, 26, fill=c["surface2"], outline=border2, r=3)
    cv.text(1189, 21, "自动 · 高", f_ui(11), c["text2"], anchor="ma")
    cv.rect(1230, 15, 26, 26, fill=c["surface"], outline=border2, r=3)
    for dx in (0, 5, 10):
        cv.d.ellipse([(1238 + dx) * S, 27.4 * S, (1240 + dx) * S, 29.4 * S], fill=c["text2"])

    # ---- conversation --------------------------------------------------
    X, CW = 458, 780
    body_x = X + 40
    body_w = CW - 40

    def avatar(y):
        cv.rect(X, y, 28, 28, fill=c["brand"], outline=border3, r=4)
        cv.d.line([(X * S, (y + 27) * S), ((X + 28) * S, (y + 27) * S)], fill=shadow, width=1 * S)
        cv.text(X + 14, y + 6, "D", f_ui(12, True), c["onBrand"], anchor="ma")

    def meta(y, time):
        cv.text(body_x, y, "DeepSeek", f_ui(12), c["text2"])
        cv.text(body_x + 62, y, time, f_ui(11), c["text4"])

    def para(y, s, size=14, fill=None, lh=26):
        font = f_ui(size)
        for line in cv.wrap(s, font, body_w):
            cv.text(body_x, y, line, font, fill or c["text"])
            y += lh
        return y

    y = 82
    avatar(y)
    meta(y + 2, "16:24")
    y += 24
    y = para(y, "我把参考图拆成了一套双色板，方向叫「雪夜温泉」：室外是冷蓝的雪，室内是暖木和灯笼。")
    y += 4

    bullets = [
        ("浅色", "米纸底 + 木色描边，像白天的旅馆大堂，长时间阅读不刺眼。"),
        ("深色", "夜靛底 + 灯笼黄，只留关键动作发光，像雪夜的露天温泉。"),
        ("主色只给发送、选中、焦点环；大面积仍是中性色，避免整屏发橙。", ""),
    ]
    for strong, rest in bullets:
        cv.text(body_x, y + 5, "•", f_ui(13), c["brand"])
        if rest:
            cv.text(body_x + 14, y, strong, f_ui(13.5, True), c["text"])
            w = cv.d.textlength(strong, font=f_ui(13.5, True)) / S
            line = cv.wrap(rest, f_ui(13.5), body_w - 14 - w)
            cv.text(body_x + 14 + w, y, line[0], f_ui(13.5), c["text2"])
            for extra in line[1:]:
                y += 24
                cv.text(body_x + 14, y, extra, f_ui(13.5), c["text2"])
        else:
            line = cv.wrap(strong, f_ui(13.5), body_w - 14)
            cv.text(body_x + 14, y, line[0], f_ui(13.5), c["text2"])
            for extra in line[1:]:
                y += 24
                cv.text(body_x + 14, y, extra, f_ui(13.5), c["text2"])
        y += 26

    # tool card
    y += 6
    cv.rect(body_x, y, body_w, 66, fill=c["surface"], outline=border2, r=4)
    cv.d.line([(body_x * S, (y + 65) * S), ((body_x + body_w) * S, (y + 65) * S)], fill=shadow, width=1 * S)
    cv.d.line([(body_x * S, (y + 33) * S), ((body_x + body_w) * S, (y + 33) * S)], fill=border1, width=1 * S)
    cv.text(body_x + 12, y + 10, "写入主题令牌", f_ui(12, True), c["text"])
    cv.text(body_x + 100, y + 10, "client.js", f_ui(11.5), c["text3"])
    pill_w = 62
    pill_x = body_x + body_w - pill_w - 12
    cv.rect(pill_x, y + 8, pill_w, 18, fill=blend(c["success"], c["surface"], 0.14), r=2)
    cv.d.ellipse([(pill_x + 7) * S, (y + 16) * S, (pill_x + 13) * S, (y + 22) * S], fill=c["success"])
    cv.text(pill_x + 17, y + 10, "已完成", f_ui(10.5), c["success"])
    cv.text(body_x + 12, y + 42, "ctx.theme.overrideTokens('kairosoft', tokens)", cv.f("code", 11.5), c["text3"])
    y += 78

    # code block
    cv.rect(body_x, y, body_w, 132, fill=c["code"], outline=border2, r=4)
    code_lines = [
        [("// every token needs a light and a dark value", "c")],
        [("const ", "k"), ("tokens", "p"), (" = {", "p")],
        [("  '--dsw-alias-bg-base'", "s"), (":       { light: ", "p"), ("'#F6EEDC'", "s"), (", dark: ", "p"), ("'#141A24'", "s"), (" },", "p")],
        [("  '--dsw-alias-brand-primary'", "s"), (":  { light: ", "p"), ("'#AE4C18'", "s"), (", dark: ", "p"), ("'#F2A93B'", "s"), (" },", "p")],
        [("};", "p")],
    ]
    code_colors = {"c": c["text4"], "k": c["brand"], "s": c["success"], "p": c["text2"]}
    cy = y + 10
    for line in code_lines:
        cx = body_x + 14
        for text, kind in line:
            cv.text(cx, cy, text, cv.f("code", 11.6), code_colors[kind])
            cx += cv.d.textlength(text, font=cv.f("code", 11.6)) / S
        cy += 22
    y += 146

    # user bubble
    cv.text(body_x, y + 6, "", f_ui(12), c["text2"])
    ub_text = "先按这个方向做一版，重点看深色模式的对比度。"
    bub_w = cv.d.textlength(ub_text, font=f_ui(13.5)) / S + 30
    bx = X + CW - bub_w
    cv.rect(bx, y, bub_w, 42, fill=c["bubble"], outline=blend(c["brand"], c["bubble"], 0.30), r=6)
    cv.d.line([(bx * S, (y + 41) * S), ((bx + bub_w) * S, (y + 41) * S)], fill=shadow, width=1 * S)
    cv.text(bx + 15, y + 11, ub_text, f_ui(13.5), c["text"])
    y += 60

    # assistant reply
    avatar(y)
    meta(y + 2, "16:25")
    y += 24
    def runs_line(y, runs, size=14):
        x = body_x
        for text, kind in runs:
            if kind == "code":
                fc = cv.f("code", 11.8)
                w = cv.d.textlength(text, font=fc) / S + 10
                cv.rect(x, y + 3, w, 21, fill=c["code"], outline=border1, r=2)
                cv.text(x + 5, y + 6, text, fc, c["text"])
                x += w + 2
            else:
                fb = f_ui(size)
                cv.text(x, y, text, fb, c["text"])
                x += cv.d.textlength(text, font=fb) / S
        return y + 27

    y = runs_line(y, [
        ("深色正文用暖白 ", "t"), ("#F2E7CE", "code"), ("，对底色 ", "t"), ("#141A24", "code"),
        (" 是 14.2:1；主色 ", "t"), ("#F2A93B", "code"), (" 是 8.7:1。", "t"),
    ])
    y = runs_line(y, [
        ("浅色主色 ", "t"), ("#AE4C18", "code"), (" 对米纸底 4.7:1，正文 11.6:1，都过 AA。", "t"),
    ])
    y += 10

    swatches = [("#F6EEDC", "米纸"), ("#AE4C18", "柿子"), ("#D67D3D", "灯笼"), ("#141A24", "夜靛"), ("#F2A93B", "灯芯"), ("#3A2B1B", "木影")]
    sx = body_x
    for hexv, name in swatches:
        cv.rect(sx, y, 76, 58, fill=c["surface"], outline=border2, r=3)
        cv.rect(sx + 1, y + 1, 74, 26, fill=hexv, outline=border1, r=2)
        cv.text(sx + 6, y + 31, hexv.upper(), cv.f("code", 8.6), c["text3"])
        cv.text(sx + 6, y + 43, name, f_ui(9.8), c["text2"])
        sx += 82
    y += 70

    # ---- composer ------------------------------------------------------
    box_y = 742
    cv.rect(X, box_y, CW, 100, fill=c["surface"], outline=border3, r=6)
    cv.d.line([(X * S, (box_y + 99) * S), ((X + CW) * S, (box_y + 99) * S)], fill=shadow, width=1 * S)
    cv.text(X + 16, box_y + 14, "给 DeepSeek 发送消息…", f_ui(13.5), c["text4"])

    row_y = box_y + 62
    chips = ["＋ 附件", "deepseek-flash", "/ 命令"]
    cx = X + 14
    for label in chips:
        w = cv.d.textlength(label, font=f_ui(11.5)) / S + 18
        cv.rect(cx, row_y, w, 26, fill=c["surface2"], outline=border2, r=3)
        cv.text(cx + 9, row_y + 6, label, f_ui(11.5), c["text2"])
        cx += w + 8

    send_w = 58
    cv.rect(X + CW - send_w - 14, row_y, send_w, 28, fill=c["brand"], outline=border3, r=3)
    cv.d.line([(X + CW - send_w - 14 + 1, row_y + 27), (X + CW - 14 - 1, row_y + 27)], fill=shadow, width=1 * S)
    cv.text(X + CW - send_w - 14 + send_w / 2, row_y + 7, "发送", f_ui(12), c["onBrand"], anchor="ma")

    cv.text(X + CW / 2, box_y + 118, "内容由 AI 生成，请仔细甄别", f_ui(10.5), c["text4"], anchor="ma")

    # snow in dark mode
    if mode == "dark":
        for (sx, sy, rr, a) in [(1240, 70, 1.6, .55), (1300, 110, 1.2, .4), (1360, 64, 2.0, .5), (1408, 150, 1.4, .35)]:
            cv.d.ellipse([sx * S, sy * S, (sx + rr * 2) * S, (sy + rr * 2) * S],
                         fill=blend(c["text"], c["bg"], a))

    im = cv.im.resize((W, H), Image.LANCZOS)
    im.save(out, "PNG")
    print("wrote", out)


if __name__ == "__main__":
    draw(sys.argv[1] if len(sys.argv) > 1 else "light",
         sys.argv[2] if len(sys.argv) > 2 else "preview.png")
