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
    # season two
    "sophia":    dict(skin="fair", hair="96462a", style="loose", outfit="eeeef6", acc="book", extra="c84a6a", sex="f", eye="4a6a9a"),
    "hartley":   dict(skin="tan", hair="5a4632", style="neat", outfit="46503c", acc="kerchief", extra="e8e0d0", sex="m", whiskers=True),
    "fanny":     dict(skin="fair", hair="6e5032", style="cap", outfit="96aac8", acc="cross", extra="ffffff", sex="f", eye="6a8a5a"),
    "edmund":    dict(skin="fair", hair="3c2c1e", style="neat", outfit="282c38", acc="bands", extra="ffffff", sex="m"),
    "kate":      dict(skin="rosy", hair="462e1e", style="bonnet", outfit="dcaabe", acc="book", extra="7a5aa8", sex="f", eye="6a4a2a"),
    "henry":     dict(skin="fair", hair="8c643c", style="curly", outfit="963c32", acc="none", extra="e8d8a0", sex="m", eye="3a6a5a"),
    "mrslyle":   dict(skin="old", hair="aa968c", style="mobcap", outfit="6e5a82", acc="shawl", extra="ffffff", sex="f", old=True),
    "willard":   dict(skin="fair", hair="281e1a", style="curly", outfit="96282e", acc="none", extra="f2c040", sex="m", eye="2a2a4a"),
    "crawley":   dict(skin="fair", hair="1e1414", style="updo", outfit="c83c50", acc="pearls", extra="ffffff", sex="f", eye="2a1a1a"),
    "general":   dict(skin="ruddy", hair="dcdcdc", style="neat", outfit="283264", acc="epaulette", extra="f2c040", sex="m", old=True, whiskers=True),
    "thrupp":    dict(skin="ruddy", hair="c8782f", style="flatcap", outfit="c8a03c", acc="kerchief", extra="7a6a5a", sex="m"),
    # Austen's own people
    "mrsbennet": dict(skin="rosy", hair="966e50", style="mobcap", outfit="c878a0", acc="shawl", extra="ffffff", sex="f", old=True),
    "lizzy":     dict(skin="rosy", hair="50321e", style="bun", outfit="e6c88c", acc="book", extra="ffffff", sex="f", eye="5a3a1a"),
    "darcy":     dict(skin="fair", hair="1e1614", style="curly", outfit="1e2846", acc="none", extra="e8e0d0", sex="m", eye="2a2a3a"),
    "collins":   dict(skin="fair", hair="3c3228", style="balding", outfit="1e1e24", acc="bands", extra="ffffff", sex="m"),
    "ladycath":  dict(skin="old", hair="bebec8", style="turban", outfit="6e285a", acc="pearls", extra="f2c040", sex="f", old=True),
    "woodhouse": dict(skin="old", hair="e6e6e6", style="balding", outfit="786450", acc="shawl", extra="d8c8b0", sex="m", old=True),
    "bates":     dict(skin="old", hair="aaaab4", style="cap", outfit="a08c6e", acc="specs", extra="ffffff", sex="f", old=True),
    "knightley": dict(skin="tan", hair="463224", style="neat", outfit="3c5032", acc="none", extra="e8e0d0", sex="m"),
}


# ---------------------------------------------------------------- busts v2: 48 × 48, with real faces
SIZE = 48
LIP_F, LIP_M = rgba("c4566a"), None
BLUSH = rgba("f2a0a0")

def mix(a, b, t):
    return (int(a[0] + (b[0] - a[0]) * t), int(a[1] + (b[1] - a[1]) * t), int(a[2] + (b[2] - a[2]) * t), 255)

def bust(pid):
    d = P[pid]
    skin = SKIN[d["skin"]]
    skinL, skinD, skinDD = shade(skin, 1.07), shade(skin, 0.86), shade(skin, 0.74)
    hair = rgba(d["hair"]); hairD = shade(hair, 0.7); hairL = shade(hair, 1.3) if sum(hair[:3]) < 600 else shade(hair, 0.9)
    out = rgba(d["outfit"]); outD = shade(out, 0.72); outL = shade(out, 1.16)
    ex = rgba(d["extra"])
    eye = rgba(d.get("eye", "3a2a1a"))
    female = d["sex"] == "f"
    old = d.get("old", False)
    st = d["style"]
    c = Canvas(SIZE, SIZE)
    cx, cy, rx, ry = 24, 21, 8.6, 10.2

    # ---- long hair falls behind the shoulders
    if st == "loose":
        for y in range(14, 42):
            w = 3 + (1 if (y // 3) % 2 else 0)
            c.rect(14 - w, y, w + 1, 1, hair if y % 4 else hairD)
            c.rect(34, y, w + 1, 1, hair if y % 4 else hairD)

    # ---- shoulders and clothes
    if female:
        for y in range(34, 48):
            half = 15 + min(4, (y - 34))
            for x in range(cx - half, cx + half + 1):
                t = (x - (cx - half)) / (2 * half)
                c.set(x, y, outL if t < 0.25 else out if t < 0.75 else outD)
        c.ellipse(8, 38, 4.5, 3.6, outL); c.ellipse(40, 38, 4.5, 3.6, out)          # puff sleeves
        for y in range(34, 40):                                                     # a soft round neckline
            half = int(7 - (y - 34) * 0.9)
            c.rect(cx - half, y, half * 2 + 1, 1, skin if y < 38 else skinD)
        c.rect(cx - 12, 44, 25, 1, outD)                                           # empire waist
        c.rect(cx - 12, 45, 25, 1, ex if st != "maid" else outD)
    else:
        for y in range(33, 48):
            half = 17 + min(3, (y - 33))
            for x in range(cx - half, cx + half + 1):
                t = (x - (cx - half)) / (2 * half)
                c.set(x, y, outL if t < 0.2 else out if t < 0.8 else outD)
        c.poly_rows([(y, cx - 6, cx + 6) for y in range(34, 48)], ex if ex[:3] != (255, 255, 255) else shade(out, 1.3))  # waistcoat
        for y in range(33, 46):                                                      # lapels
            k = (y - 33) // 2
            c.rect(cx - 8 + k, y, 2, 1, outD); c.rect(cx + 7 - k, y, 2, 1, outD)
        c.poly_rows([(30, 20, 28), (31, 19, 29), (32, 19, 29), (33, 20, 28), (34, 21, 27), (35, 22, 26), (36, 23, 25)], rgba("f4f0e6"))  # cravat
        c.set(24, 33, rgba("d8d2c4")); c.set(23, 34, rgba("d8d2c4")); c.set(25, 34, rgba("d8d2c4"))
        c.rect(18, 29, 2, 3, rgba("f4f0e6")); c.rect(29, 29, 2, 3, rgba("f4f0e6"))   # collar points
        for y in (38, 41, 44): c.set(cx, y, rgba("d8b048"))                          # buttons

    # ---- neck
    c.rect(20, 27, 9, 7 if female else 4, skinD); c.rect(20, 27, 4, 7 if female else 4, skin)

    # ---- head, lit from the upper left
    for y in range(int(cy - ry - 1), int(cy + ry + 2)):
        for x in range(int(cx - rx - 1), int(cx + rx + 2)):
            nx, ny = (x - cx) / rx, (y - cy) / ry
            if ny > 0.35:   # a narrower, softer jaw
                nx = nx * (1 + (ny - 0.35) * 0.9)
            if nx * nx + ny * ny <= 1:
                col = skin
                if nx > 0.55 or ny > 0.82: col = skinD
                if nx < -0.35 and ny < 0.3: col = skinL
                c.set(x, y, col)
    for y in (19, 20, 21):                                                           # ears
        c.set(15, y, skinD); c.set(33, y, skinD)
    c.set(14, 20, skinD); c.set(34, 20, skinD)

    # ---- hair (the top and sides, under any hat)
    bald = st in ("balding", "bald")
    if not bald:
        for y in range(9, 19):
            for x in range(14, 35):
                nx, ny = (x - cx) / 10.2, (y - 15) / 7.2
                if nx * nx + ny * ny <= 1 and (y < 14 or x < 17 or x > 31):
                    c.set(x, y, hair if (x + y) % 5 else hairD)
        for x in range(17, 32):                                                       # a soft fringe line
            if (x * 3) % 5 < 3: c.set(x, 14, hair)
        for x in (18, 21, 26, 29): c.set(x, 11, hairL); c.set(x + 1, 10, hairL)     # highlights
        if female:
            c.rect(14, 15, 2, 7, hair); c.rect(33, 15, 2, 7, hair)                   # side curls
            c.set(14, 22, hairD); c.set(34, 22, hairD); c.set(13, 23, hair); c.set(35, 23, hair)
        else:
            c.rect(15, 15, 2, 6, hair); c.rect(32, 15, 2, 6, hair)                   # short sides
            if d.get("whiskers"):
                c.rect(15, 21, 2, 5, hairD); c.rect(32, 21, 2, 5, hairD)
    else:
        c.rect(14, 15, 3, 7, hair); c.rect(32, 15, 3, 7, hair)
        c.set(20, 12, skinL); c.set(21, 11, skinL); c.set(22, 11, skinL)            # shine on the scalp

    if st == "updo":
        c.ellipse(24, 7, 5.5, 3.8, hair); c.rect(20, 7, 9, 1, hairD); c.set(22, 5, hairL); c.set(26, 6, hairL)
        for (x, y) in ((13, 22), (35, 22), (12, 24), (36, 24), (13, 26), (35, 26)):
            c.set(x, y, hair)
    if st == "bun":
        c.ellipse(24, 8, 4, 2.8, hair); c.set(23, 7, hairL)
    if st == "curly":
        for x in range(15, 34, 3):
            c.ellipse(x, 10 + (x % 2), 2, 2, hair); c.set(x, 9 + (x % 2), hairL)
        c.ellipse(17, 15, 1.6, 1.6, hair); c.ellipse(31, 15, 1.6, 1.6, hair)
    if st == "neat":
        c.rect(15, 11, 19, 2, hair); c.line(20, 10, 20, 13, hairD)                    # side parting
    if st == "cap":
        for y in range(6, 15):
            for x in range(12, 37):
                nx, ny = (x - 24) / 12, (y - 13) / 7.5
                if nx * nx + ny * ny <= 1 and y < 15: c.set(x, y, ex if y > 7 else shade(ex, 0.92))
        for x in range(12, 37, 2): c.set(x, 15, shade(ex, 0.85))                     # the frill
        c.rect(14, 12, 21, 1, rgba("e8a0b8") if pid != "bates" else rgba("b8b0a0"))  # a ribbon
    if st == "mobcap":
        c.ellipse(24, 10, 13, 7.5, ex); c.rect(11, 14, 27, 2, ex)
        for x in range(11, 38, 2): c.set(x, 16, shade(ex, 0.82))
        c.rect(14, 13, 21, 1, rgba("c8a0d0") if pid != "mrsbennet" else rgba("e86a9a"))
    if st == "maid":
        c.rect(16, 7, 17, 5, ex); c.rect(15, 11, 19, 1, shade(ex, 0.85))
    if st == "bonnet":
        straw, strawD = rgba("ecd08a"), rgba("c8a85a")
        for y in range(2, 27):
            for x in range(8, 41):
                o = ((x - 24) / 15.5) ** 2 + ((y - 16) / 13.5) ** 2
                i = ((x - 24) / 10.8) ** 2 + ((y - 19) / 11.0) ** 2
                if o <= 1 and (i > 1 or y < 10) and y < 25:
                    c.set(x, y, straw if (x + y) % 4 else strawD)
        c.rect(10, 9, 29, 2, ex)                                                        # ribbon round the crown
        c.line(13, 24, 19, 31, ex); c.line(35, 24, 29, 31, ex); c.rect(28, 30, 4, 2, ex)  # tied under the chin
        c.set(16, 17, hair); c.set(32, 17, hair); c.set(15, 18, hair); c.set(33, 18, hair)
    if st == "turban":
        c.ellipse(24, 10, 12.5, 7, ex)
        for y in range(5, 16, 3): c.rect(13, y, 23, 1, shade(ex, 0.8))
        c.line(31, 5, 36, -1, rgba("ffffff")); c.line(32, 5, 38, 0, rgba("f0f0f0")); c.set(30, 6, rgba("f2c040"))
    if st == "widehat":
        c.rect(4, 9, 41, 2, ex); c.rect(13, 2, 23, 7, ex); c.rect(13, 7, 23, 1, shade(ex, 1.5)); c.rect(5, 11, 39, 1, shade(ex, 0.7))
    if st == "tophat":
        hat = rgba("1a1a22")
        c.rect(14, -1, 21, 10, hat); c.rect(15, 0, 3, 8, rgba("34343e")); c.rect(14, 6, 21, 2, ex)
        c.rect(10, 9, 29, 2, hat); c.rect(11, 9, 6, 1, rgba("34343e"))
    if st == "bicorne":
        hat = rgba("1e2850")
        c.poly_rows([(1, 20, 28), (2, 17, 31), (3, 13, 35), (4, 9, 39), (5, 7, 41), (6, 6, 42), (7, 7, 41), (8, 9, 39)], hat)
        c.rect(7, 8, 35, 1, ex); c.ellipse(24, 4, 2, 2, ex)
    if st == "straw":
        c.rect(6, 9, 37, 2, rgba("e8c86a")); c.rect(15, 3, 19, 6, rgba("e8c86a")); c.rect(15, 7, 19, 1, rgba("b8402a"))
        for x in range(7, 42, 3): c.set(x, 10, rgba("c8a84a"))
    if st == "flatcap":
        c.rect(14, 7, 21, 4, ex); c.rect(14, 11, 23, 1, shade(ex, 0.75)); c.set(18, 8, shade(ex, 1.3))
    if st == "feather" or pid in ("georgiana", "crawley"):
        c.line(28, 6, 36, -1, rgba("ffffff")); c.line(29, 6, 37, 0, rgba("f4e8f0")); c.line(28, 7, 35, 1, rgba("ffffff"))

    # ---- the face
    ink = rgba("2a1a22")
    lid = mix(hairD, ink, 0.5)
    for ex0 in (19, 27):
        c.rect(ex0, 19, 3, 1, lid)                                   # upper lid
        c.set(ex0, 20, rgba("f8f4ee")); c.set(ex0 + 1, 20, eye); c.set(ex0 + 2, 20, shade(eye, 0.6))
        c.set(ex0 + 1, 21, shade(eye, 0.6))
        c.set(ex0 + 1, 20, shade(eye, 1.35))                          # a catch-light
        if female:
            c.set(ex0 - 1 if ex0 == 19 else ex0 + 3, 18, lid)          # lashes at the outer corner
        if old:
            c.set(ex0, 22, skinDD); c.set(ex0 + 2, 22, skinDD)
    bc = hairD if not bald else shade(hair, 0.8)
    if female:
        c.rect(18, 17, 4, 1, bc); c.rect(27, 17, 4, 1, bc); c.set(17, 18, bc); c.set(31, 18, bc)
    else:
        c.rect(18, 16, 5, 2, bc); c.rect(26, 16, 5, 2, bc)
    c.set(24, 22, skinD); c.set(24, 23, skinD); c.set(25, 24, skinDD); c.set(23, 24, skinD); c.set(23, 22, skinL)   # nose
    if female:
        c.rect(22, 26, 5, 1, LIP_F); c.rect(23, 27, 3, 1, shade(LIP_F, 1.15)); c.set(24, 26, shade(LIP_F, 0.85))
        for (x, y) in ((18, 24), (19, 24), (29, 24), (30, 24), (19, 25), (29, 25)):
            c.set(x, y, mix(c.px[x, y], BLUSH, 0.55))
    else:
        c.rect(22, 26, 5, 1, skinDD); c.set(23, 27, skinD); c.set(25, 27, skinD)
        if old:
            c.set(21, 25, skinDD); c.set(27, 25, skinDD)
    if old:
        c.set(18, 15, skinD); c.set(30, 15, skinD)

    # ---- accessories
    a = d["acc"]
    if a == "fan":
        c.poly_rows([(38, 33, 36), (39, 31, 39), (40, 30, 41), (41, 30, 42), (42, 31, 42)], ex)
        for x in range(31, 42, 2): c.set(x, 40, shade(ex, 0.85))
        c.line(34, 47, 37, 42, rgba("8a5a2a"))
    if a == "book":
        c.rect(30, 39, 11, 8, rgba("8a2a2a")); c.rect(31, 40, 9, 1, rgba("f2d27a")); c.rect(30, 46, 11, 1, rgba("f4ecd8"))
    if a == "gloves":
        c.rect(30, 41, 9, 4, ex); c.rect(30, 41, 9, 1, shade(ex, 1.4))
    if a == "posy":
        c.rect(32, 42, 2, 5, rgba("3a8a3a"))
        for (x, y, col) in ((31, 40, "f25a8a"), (33, 39, "ffffff"), (35, 40, "8a5af2"), (32, 38, "f2d040"), (34, 41, "f25a8a")):
            c.set(x, y, rgba(col))
    if a == "epaulette":
        for x0 in (6, 37):
            c.rect(x0, 33, 6, 2, ex)
            for k in range(0, 6, 2): c.set(x0 + k, 35, ex)
    if a == "bands":
        c.rect(22, 30, 5, 6, rgba("f4f0e6")); c.rect(24, 31, 1, 5, rgba("c8c2b4"))
    if a == "kerchief":
        c.poly_rows([(30, 20, 28), (31, 20, 28), (32, 21, 27), (33, 22, 26), (34, 23, 25)], ex if pid != "brampton" else rgba("d8402a"))
    if a == "monocle":
        for (x, y) in ((26, 19), (30, 19), (26, 22), (30, 22), (27, 18), (29, 18), (27, 23), (29, 23)): c.set(x, y, ex)
        c.line(30, 23, 33, 32, ex)
    if a == "specs":
        fr = rgba("8a7a5a")
        for x0 in (18, 26):
            c.rect(x0, 19, 5, 1, fr); c.rect(x0, 22, 5, 1, fr); c.set(x0, 20, fr); c.set(x0, 21, fr); c.set(x0 + 4, 20, fr); c.set(x0 + 4, 21, fr)
        c.rect(23, 20, 3, 1, fr)
    if a == "shawl":
        sh = shade(out, 1.35)
        c.poly_rows([(y, 6 + (y - 34) // 2, 42 - (y - 34) // 2) for y in range(34, 39)], sh)
        for x in range(8, 41, 3): c.set(x, 39, shade(sh, 0.85))
    if a == "apron":
        c.rect(18, 38, 13, 10, ex)
    if a == "beard":
        c.poly_rows([(25, 17, 31), (26, 17, 31), (27, 18, 30), (28, 19, 29), (29, 20, 28), (30, 22, 26)], ex); c.rect(22, 26, 5, 1, shade(ex, 0.8))
    if a == "freckles":
        for (x, y) in ((18, 23), (20, 24), (28, 24), (30, 23), (19, 22), (29, 22)): c.set(x, y, rgba("c8703a"))
    if a == "tape":
        c.rect(17, 34, 2, 14, ex); c.rect(30, 34, 2, 14, ex)
        for y in range(35, 48, 3): c.set(17, y, rgba("2a2a2a")); c.set(31, y, rgba("2a2a2a"))
    if a == "cross":
        gold = rgba("e8a83a")
        for x in range(19, 30): c.set(x, 36 + (1 if 21 < x < 27 else 0), rgba("f2c040"))
        c.rect(24, 37, 1, 5, gold); c.rect(23, 38, 3, 1, gold)
    if a == "pearls":
        for x in range(19, 30, 2): c.set(x, 36 + (1 if 21 < x < 27 else 0), rgba("f8f4f0"))
    if pid == "twine":
        for x0 in (18, 26):
            c.rect(x0, 19, 5, 1, rgba("3a3a3a")); c.set(x0, 20, rgba("3a3a3a")); c.set(x0 + 4, 20, rgba("3a3a3a"))
    c.outline()
    return c
