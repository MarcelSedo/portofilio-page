"""
Pixel art for "Emma: The Matchmaker of Bramblewick".
Run:  python3 tools/emma-art/gen.py
Writes public/emma/*.png and components/games/emma/layout.ts (hotspot positions),
so pictures and tap targets always line up.
Style: chunky 1px dark outline around every object, flat colours, spring daylight.
"""
import json, os, math
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "public", "emma")
os.makedirs(OUT_DIR, exist_ok=True)

INK = (30, 18, 34, 255)          # the outline colour
T = (0, 0, 0, 0)

def rgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)

def shade(c, f):
    return (max(0, min(255, int(c[0] * f))), max(0, min(255, int(c[1] * f))), max(0, min(255, int(c[2] * f))), c[3])

class Canvas:
    def __init__(self, w, h, bg=T):
        self.w, self.h = w, h
        self.im = Image.new("RGBA", (w, h), bg)
        self.px = self.im.load()
    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[x, y] = c
    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, c)
    def ellipse(self, cx, cy, rx, ry, c):
        for yy in range(int(cy - ry - 1), int(cy + ry + 2)):
            for xx in range(int(cx - rx - 1), int(cx + rx + 2)):
                if ((xx - cx) / (rx + 0.01)) ** 2 + ((yy - cy) / (ry + 0.01)) ** 2 <= 1.0:
                    self.set(xx, yy, c)
    def poly_rows(self, rows, c):
        """rows: list of (y, x0, x1) inclusive"""
        for y, x0, x1 in rows:
            for x in range(x0, x1 + 1):
                self.set(x, y, c)
    def line(self, x0, y0, x1, y1, c):
        n = max(abs(x1 - x0), abs(y1 - y0), 1)
        for i in range(n + 1):
            self.set(round(x0 + (x1 - x0) * i / n), round(y0 + (y1 - y0) * i / n), c)
    def outline(self, color=INK):
        """1px outline around everything opaque (4-neighbourhood)."""
        src = self.im.copy().load()
        for y in range(self.h):
            for x in range(self.w):
                if src[x, y][3] == 0:
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < self.w and 0 <= ny < self.h and src[nx, ny][3] > 0:
                            self.px[x, y] = color
                            break
        return self
    def paste(self, other, x, y):
        self.im.alpha_composite(other.im, (x, y))
        self.px = self.im.load()
    def save(self, name, scale=1):
        im = self.im if scale == 1 else self.im.resize((self.w * scale, self.h * scale), Image.NEAREST)
        im.save(os.path.join(OUT_DIR, name))

# ---------------------------------------------------------------- people
SKIN = {"fair": rgba("f6d3b5"), "rosy": rgba("f2c1a0"), "tan": rgba("d9a27a"), "ruddy": rgba("e8a58a"), "old": rgba("eec8ae")}
P = {
    "georgiana": dict(skin="fair", hair="d8a24a", style="updo", outfit="e4577a", acc="fan", extra="ffffff", sex="f"),
    "eleanor":   dict(skin="fair", hair="5a3a28", style="cap", outfit="4f7fd0", acc="book", extra="ffffff", sex="f"),
    "clara":     dict(skin="rosy", hair="22161c", style="widehat", outfit="7a4a8a", acc="gloves", extra="3a2a3e", sex="f"),
    "kitty":     dict(skin="rosy", hair="f2c84a", style="loose", outfit="f2d25a", acc="posy", extra="f28a3a", sex="f"),
    "fenwick":   dict(skin="tan", hair="7a4a24", style="bicorne", outfit="24407a", acc="epaulette", extra="f2c040", sex="m"),
    "hale":      dict(skin="fair", hair="2a2228", style="neat", outfit="2a2a34", acc="bands", extra="ffffff", sex="m"),
    "brampton":  dict(skin="ruddy", hair="9a5a2a", style="straw", outfit="5a7a3a", acc="kerchief", extra="d8402a", sex="m"),
    "ravel":     dict(skin="fair", hair="3a2418", style="tophat", outfit="1f7a7a", acc="monocle", extra="f2c040", sex="m"),
    "emma":      dict(skin="fair", hair="f0c060", style="bonnet", outfit="9ad0a0", acc="none", extra="3a9a5a", sex="f"),
    "nettle":    dict(skin="old", hair="b8b8c0", style="mobcap", outfit="8a4a9a", acc="shawl", extra="ffffff", sex="f", old=True),
    "polly":     dict(skin="rosy", hair="6a3a1a", style="maid", outfit="2a2a2a", acc="apron", extra="ffffff", sex="f"),
    "jenkins":   dict(skin="ruddy", hair="eeeeee", style="bald", outfit="8a6a3a", acc="beard", extra="eeeeee", sex="m", old=True),
    "tom":       dict(skin="rosy", hair="d8602a", style="flatcap", outfit="6a5a4a", acc="freckles", extra="5a5a5a", sex="m"),
    "twine":     dict(skin="fair", hair="7a6a5a", style="balding", outfit="6a3a2a", acc="tape", extra="f2d040", sex="m"),
    "penny":     dict(skin="fair", hair="9a9aa8", style="bun", outfit="3a5a9a", acc="specs", extra="ffffff", sex="f", old=True),
    "pemberton": dict(skin="old", hair="c8c8d0", style="updo", outfit="3a6a4a", acc="fan", extra="f2d040", sex="f", old=True),
    "pike":      dict(skin="ruddy", hair="d8d8d8", style="neat", outfit="b8302a", acc="epaulette", extra="f2c040", sex="m", old=True),
    "lake":      dict(skin="fair", hair="b85a2a", style="loose", outfit="7ac0e0", acc="posy", extra="ffffff", sex="f"),
    "lucy":      dict(skin="rosy", hair="965a32", style="maid", outfit="e69678", acc="apron", extra="ffffff", sex="f"),
    "anne":      dict(skin="fair", hair="3c2c28", style="bun", outfit="6e6e82", acc="book", extra="ffffff", sex="f"),
    "will":      dict(skin="tan", hair="281e1a", style="neat", outfit="96643c", acc="kerchief", extra="5a3a2a", sex="m"),
    "arthur":    dict(skin="fair", hair="82644a", style="balding", outfit="504232", acc="specs", extra="ffffff", sex="m"),
    "fiddle":    dict(skin="fair", hair="4a3a3a", style="balding", outfit="4a3a5a", acc="bands", extra="ffffff", sex="m"),
}

def bust(pid):
    d = P[pid]
    skin = SKIN[d["skin"]]
    hair = rgba(d["hair"]); hairD = shade(hair, 0.75)
    out = rgba(d["outfit"]); outD = shade(out, 0.75); outL = shade(out, 1.18)
    ex = rgba(d["extra"])
    c = Canvas(32, 32)
    st = d["style"]

    # long hair behind the shoulders
    if st == "loose":
        c.rect(8, 10, 16, 15, hair); c.rect(7, 14, 2, 10, hairD); c.rect(23, 14, 2, 10, hairD)

    # shoulders and clothes
    if d["sex"] == "f":
        c.poly_rows([(y, 5 - (1 if y > 26 else 0), 26 + (1 if y > 26 else 0)) for y in range(23, 32)], out)
        c.ellipse(7, 25, 3, 2.5, outL); c.ellipse(24, 25, 3, 2.5, outL)            # puff sleeves
        c.poly_rows([(23, 12, 19), (24, 13, 18), (25, 14, 17)], skin)            # neckline
        c.rect(11, 26, 10, 1, outD)                                              # empire waist
    else:
        c.poly_rows([(y, 4, 27) for y in range(23, 32)], out)
        c.poly_rows([(y, 13 - (y - 23), 18 + (y - 23)) for y in range(23, 28)], outD)  # lapels
        c.rect(14, 22, 4, 5, rgba("ffffff"))                                     # cravat
        c.rect(15, 27, 2, 4, outD)
    # neck
    c.rect(14, 19, 4, 4, shade(skin, 0.92))
    # head
    c.ellipse(16, 13.5, 5.6, 6.6, skin)
    # ears
    c.set(10, 14, shade(skin, 0.9)); c.set(22, 14, shade(skin, 0.9))

    # hair and hats
    if st in ("updo", "cap", "loose", "bonnet", "mobcap", "maid", "bun", "neat", "bicorne", "tophat", "straw", "flatcap", "widehat", "balding"):
        if st not in ("balding",):
            c.poly_rows([(7, 12, 20), (8, 11, 21), (9, 10, 22), (10, 10, 22), (11, 10, 12), (11, 20, 22), (12, 10, 11), (12, 21, 22)], hair)
            c.set(13, 10, hair); c.set(19, 10, hair)
    if st == "updo":
        c.ellipse(16, 5, 3.5, 2.6, hair); c.rect(13, 6, 7, 1, hairD)
        c.line(19, 4, 24, -1, ex); c.line(20, 4, 25, 0, ex); c.line(19, 5, 23, 1, ex)   # feather
        c.set(10, 13, hair); c.set(22, 13, hair); c.set(10, 14, hairD); c.set(22, 14, hairD)  # ringlets
    if st == "cap":
        c.poly_rows([(5, 12, 20), (6, 10, 22), (7, 9, 23), (8, 9, 23), (9, 9, 10), (9, 22, 23)], ex)
        c.rect(9, 9, 15, 1, shade(ex, 0.85))
    if st == "loose":
        c.rect(19, 7, 4, 2, ex); c.set(22, 6, ex); c.set(23, 9, ex)  # ribbon
    if st == "widehat":
        c.rect(3, 8, 26, 2, ex); c.rect(10, 3, 12, 5, ex); c.rect(10, 6, 12, 1, shade(rgba("6a4a7a"), 1)); c.set(9, 10, ex); c.set(22, 10, ex)
        c.rect(11, 10, 10, 1, shade(ex, 1.6))
    if st == "bicorne":
        c.poly_rows([(2, 13, 19), (3, 10, 22), (4, 7, 25), (5, 5, 27), (6, 4, 28), (7, 5, 27)], out)
        c.rect(5, 7, 23, 1, ex); c.ellipse(16, 4, 1.4, 1.4, ex)
        c.rect(10, 12, 1, 4, hair); c.rect(22, 12, 1, 4, hair)                   # sideburns
    if st == "tophat":
        c.poly_rows([(y, 11 + (1 if y < 4 else 0), 21 + (1 if y < 4 else 0)) for y in range(-1, 7)], rgba("1a1a22"))
        c.rect(8, 7, 17, 2, rgba("1a1a22")); c.rect(11, 5, 11, 1, ex)
        c.set(10, 11, hair); c.set(9, 12, hair); c.set(22, 11, hair); c.set(23, 12, hair)   # curls
    if st == "straw":
        c.rect(4, 8, 24, 2, rgba("e8c86a")); c.rect(10, 4, 12, 4, rgba("e8c86a")); c.rect(10, 7, 12, 1, rgba("b8402a"))
        c.line(5, 9, 27, 9, rgba("c8a84a"))
    if st == "flatcap":
        c.rect(9, 6, 14, 3, ex); c.rect(9, 9, 16, 1, shade(ex, 0.8))
        c.set(10, 10, hair); c.set(9, 11, hair); c.set(22, 10, hair)
    if st == "bonnet":
        c.poly_rows([(4, 11, 21), (5, 9, 23), (6, 8, 24), (7, 7, 25), (8, 7, 25), (9, 7, 9), (9, 23, 25), (10, 7, 8), (10, 24, 25), (11, 7, 8), (11, 24, 25)], rgba("ecd08a"))
        c.rect(8, 7, 17, 1, ex); c.set(9, 17, ex); c.set(23, 17, ex); c.set(9, 18, ex); c.set(23, 18, ex)
        c.set(11, 11, hair); c.set(21, 11, hair); c.set(11, 12, hair); c.set(21, 12, hair)   # curls
    if st == "mobcap":
        c.poly_rows([(4, 11, 21), (5, 9, 23), (6, 8, 24), (7, 8, 24), (8, 8, 24), (9, 8, 9), (9, 23, 24)], ex)
        c.rect(8, 9, 17, 1, shade(ex, 0.85))
    if st == "maid":
        c.rect(11, 6, 11, 3, ex); c.rect(10, 8, 13, 1, shade(ex, 0.85))
    if st == "bun":
        c.ellipse(16, 6, 3, 2, hair)
    if st == "balding":
        c.rect(10, 11, 2, 4, hair); c.rect(21, 11, 2, 4, hair); c.rect(13, 8, 6, 1, shade(skin, 0.94))
    if st == "bald":
        c.rect(10, 12, 2, 4, hair); c.rect(21, 12, 2, 4, hair)
    if st == "neat":
        c.rect(10, 9, 13, 2, hair); c.set(13, 11, hair)

    # face
    eye = rgba("2a1a2a")
    c.set(13, 14, eye); c.set(19, 14, eye); c.set(13, 13, eye if d["sex"] == "f" else skin); c.set(19, 13, eye if d["sex"] == "f" else skin)
    if d["sex"] == "f":
        c.set(12, 16, rgba("f29a9a")); c.set(20, 16, rgba("f29a9a"))
        c.rect(15, 18, 2, 1, rgba("c8506a"))
    else:
        c.rect(15, 18, 3, 1, shade(skin, 0.7))
        c.rect(12, 12, 3, 1, shade(rgba(d["hair"]), 0.9)); c.rect(18, 12, 3, 1, shade(rgba(d["hair"]), 0.9))  # brows
    c.set(16, 16, shade(skin, 0.85))   # nose
    if d.get("old"):
        c.set(12, 15, shade(skin, 0.82)); c.set(20, 15, shade(skin, 0.82))

    # accessories
    a = d["acc"]
    if a == "fan":
        c.poly_rows([(26, 21, 23), (27, 20, 25), (28, 20, 27), (29, 21, 28)], ex); c.line(22, 31, 26, 27, shade(ex, 0.8))
    if a == "book":
        c.rect(19, 25, 7, 6, rgba("8a2a2a")); c.rect(20, 26, 5, 1, rgba("f2d27a"))
    if a == "gloves":
        c.rect(19, 27, 6, 3, ex)
    if a == "posy":
        c.rect(20, 28, 2, 3, rgba("3a8a3a")); c.set(19, 26, rgba("f25a8a")); c.set(21, 25, ex); c.set(22, 27, rgba("8a5af2")); c.set(20, 27, rgba("ffffff"))
    if a == "epaulette":
        c.rect(4, 23, 5, 2, ex); c.rect(23, 23, 5, 2, ex); c.rect(10, 27, 1, 1, ex); c.rect(21, 27, 1, 1, ex)
    if a == "bands":
        c.rect(14, 22, 4, 2, ex); c.rect(15, 24, 1, 3, ex); c.rect(16, 24, 1, 3, ex)
    if a == "kerchief":
        c.rect(13, 22, 6, 2, ex); c.set(15, 24, ex); c.set(16, 24, ex)
    if a == "monocle":
        c.set(18, 13, ex); c.set(20, 13, ex); c.set(18, 15, ex); c.set(20, 15, ex); c.set(19, 12, ex); c.set(19, 16, ex); c.line(20, 16, 22, 22, ex)
    if a == "shawl":
        c.poly_rows([(y, 5, 26) for y in range(23, 26)], shade(out, 1.3))
    if a == "apron":
        c.rect(12, 24, 8, 8, ex)
    if a == "beard":
        c.poly_rows([(17, 11, 21), (18, 11, 21), (19, 12, 20), (20, 13, 19)], ex); c.rect(15, 18, 2, 1, shade(ex, 0.8))
    if a == "freckles":
        c.set(12, 16, rgba("c8703a")); c.set(14, 16, rgba("c8703a")); c.set(18, 16, rgba("c8703a")); c.set(20, 16, rgba("c8703a"))
    if a == "tape":
        c.rect(12, 23, 1, 8, ex); c.rect(20, 23, 1, 8, ex)
    if a == "specs":
        for x0 in (12, 18):
            c.set(x0, 14, ink := rgba("3a3a3a")); c.set(x0 + 2, 14, ink); c.set(x0 + 1, 13, ink); c.set(x0 + 1, 15, ink)
        c.set(15, 14, rgba("3a3a3a")); c.set(16, 14, rgba("3a3a3a"))
    if pid == "twine":
        for x0 in (12, 18):
            c.set(x0, 14, rgba("3a3a3a")); c.set(x0 + 2, 14, rgba("3a3a3a"))
    c.outline()
    return c
