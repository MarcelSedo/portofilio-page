"""
Pixel art for the Experience map, v2: a village at night during a lantern festival.

Draws two maps (wide + tall), 5 buildings, 8 villagers and the player, then writes
components/experience/layouts.ts with the same coordinates.
Usage: python3 tools/experience-art/gen.py .   (from the project root)

How the night works: everything is drawn in day colours, then "graded" to night,
except emissive colours (lit windows, lanterns, fire, ghost light, cat eyes), which stay bright
and get a soft pixel halo.
"""
import json, math, os, random, sys
from PIL import Image

ROOT = sys.argv[1]
OUT = os.path.join(ROOT, "public", "experience")
os.makedirs(OUT, exist_ok=True)
T = (0, 0, 0, 0)

# ---------------------------------------------------------------- palette (day colours)
OUTL = (14, 12, 22, 255)
G1, G2, G3, G4 = (70, 122, 53, 255), (84, 140, 62, 255), (98, 156, 72, 255), (58, 104, 46, 255)
DIRT, DIRT2, DIRT3, DIRTE = (199, 164, 106, 255), (180, 145, 90, 255), (214, 184, 128, 255), (130, 100, 60, 255)
W1, W2, W3 = (52, 108, 170, 255), (72, 132, 196, 255), (150, 196, 232, 255)
SAND = (206, 186, 136, 255)
TD, TM, TL, TH = (30, 68, 40, 255), (44, 94, 52, 255), (62, 122, 64, 255), (92, 152, 80, 255)
TRUNK, TRUNKD = (106, 70, 38, 255), (76, 48, 26, 255)
ST, STD, STL, STM = (122, 120, 136, 255), (88, 86, 104, 255), (150, 150, 166, 255), (70, 68, 86, 255)
MOSS, MOSSD = (70, 112, 64, 255), (48, 82, 48, 255)
PLASTER, PLASTERD = (236, 228, 208, 255), (206, 196, 172, 255)
BEAM, BEAMD = (90, 58, 31, 255), (64, 40, 22, 255)
ROOF, ROOFD, ROOFL = (163, 72, 47, 255), (122, 51, 34, 255), (190, 98, 66, 255)
THATCH, THATCHD, THATCHL = (201, 162, 74, 255), (156, 122, 48, 255), (224, 191, 99, 255)
FSTONE, FSTONED, FSTONEL = (201, 180, 143, 255), (168, 145, 107, 255), (222, 206, 172, 255)
DOORG = (62, 107, 58, 255)
MSTONE, MSTONED, MSTONEL = (216, 205, 184, 255), (181, 168, 143, 255), (236, 228, 210, 255)
SLATE, SLATED, SLATEL = (74, 82, 98, 255), (58, 65, 80, 255), (96, 106, 124, 255)
GLASS, GLASSL = (40, 60, 100, 255), (90, 120, 170, 255)
WHITE = (241, 239, 232, 255)
RED, BLUE = (196, 58, 48, 255), (58, 98, 176, 255)
WOOD, WOODD, WOODL = (150, 100, 56, 255), (112, 74, 40, 255), (178, 128, 76, 255)

# emissive: never darkened at night
GLOW, GLOWL, GLOWD = (255, 206, 110, 255), (255, 240, 180, 255), (232, 160, 70, 255)
LAN_R, LAN_O, LAN_Y, LAN_P, LAN_T = (255, 96, 80, 255), (255, 150, 60, 255), (255, 214, 90, 255), (240, 120, 200, 255), (110, 230, 210, 255)
FIRE1, FIRE2, FIRE3 = (255, 120, 40, 255), (255, 190, 70, 255), (255, 244, 170, 255)
GHOST, GHOSTL = (120, 255, 170, 255), (200, 255, 220, 255)
FLY = (220, 255, 120, 255)
CATEYE = (170, 255, 120, 255)
EMISSIVE = {GLOW, GLOWL, GLOWD, LAN_R, LAN_O, LAN_Y, LAN_P, LAN_T, FIRE1, FIRE2, FIRE3, GHOST, GHOSTL, FLY, CATEYE}
WARM = (255, 190, 100)


def img(w, h):
    return Image.new("RGBA", (w, h), T)


def R(im, x, y, w, h, c):
    for yy in range(max(0, y), min(im.height, y + h)):
        for xx in range(max(0, x), min(im.width, x + w)):
            im.putpixel((xx, yy), c)


def P(im, x, y, c):
    if 0 <= x < im.width and 0 <= y < im.height:
        im.putpixel((x, y), c)


def outline(im, c=OUTL):
    src = im.copy()
    for y in range(im.height):
        for x in range(im.width):
            if src.getpixel((x, y))[3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < im.width and 0 <= ny < im.height and src.getpixel((nx, ny))[3] > 0:
                        im.putpixel((x, y), c)
                        break
    return im


def mul(c, k):
    return (max(0, min(255, int(c[0] * k))), max(0, min(255, int(c[1] * k))), max(0, min(255, int(c[2] * k))), c[3])


def rim(im):
    """Pokémon-style volume: lighter inside the top-left edge, darker inside the bottom-right edge."""
    src = im.copy()
    for y in range(im.height):
        for x in range(im.width):
            c = src.getpixel((x, y))
            if c[3] == 0 or c == OUTL or c in EMISSIVE:
                continue
            def edge(dx, dy):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < im.width and 0 <= ny < im.height):
                    return True
                n = src.getpixel((nx, ny))
                return n[3] == 0 or n == OUTL
            if edge(1, 0) or edge(0, 1):
                im.putpixel((x, y), mul(c, 0.78))
            elif edge(-1, 0) or edge(0, -1):
                im.putpixel((x, y), mul(c, 1.12))
    return im


def finish(im):
    return rim(outline(im))


def night(im, k=(0.46, 0.52, 0.72), add=(6, 10, 34)):
    out = im.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            c = px[x, y]
            if c[3] == 0 or c in EMISSIVE:
                continue
            px[x, y] = (min(255, int(c[0] * k[0] + add[0])), min(255, int(c[1] * k[1] + add[1])), min(255, int(c[2] * k[2] + add[2])), c[3])
    return out


def halo(im, cx, cy, r, color=WARM, strength=0.55):
    """Soft light in three stepped rings (keeps the pixel look)."""
    px = im.load()
    for y in range(int(cy - r), int(cy + r) + 1):
        for x in range(int(cx - r), int(cx + r) + 1):
            if not (0 <= x < im.width and 0 <= y < im.height):
                continue
            d = math.hypot(x - cx, (y - cy) * 1.15) / r
            if d >= 1:
                continue
            a = strength * (0.35 if d > 0.66 else 0.6 if d > 0.33 else 1.0)
            # light dithering on the outer ring
            if d > 0.66 and (x + y) % 2:
                a *= 0.5
            c = px[x, y]
            if c[3] == 0 or c[:3] in [e[:3] for e in EMISSIVE]:
                continue
            px[x, y] = (
                min(255, int(c[0] + (color[0] - c[0]) * a * 0.55 + 18 * a)),
                min(255, int(c[1] + (color[1] - c[1]) * a * 0.45 + 12 * a)),
                min(255, int(c[2] + (color[2] - c[2]) * a * 0.25)),
                c[3],
            )


def bricks(im, x, y, w, h, base, mortar, light, rng, row=4, joint=6):
    R(im, x, y, w, h, base)
    for yy in range(y, y + h):
        r = (yy - y) // row
        if (yy - y) % row == row - 1:
            R(im, x, yy, w, 1, mortar)
        else:
            off = (r % 2) * (joint // 2)
            for xx in range(x, x + w):
                if (xx - x + off) % joint == 0:
                    P(im, xx, yy, mortar)
    for _ in range(w * h // 18):
        P(im, rng.randrange(x, x + w), rng.randrange(y, y + h), light)


def window(im, x, y, w, h, lit=True, frame=BEAMD):
    R(im, x, y, w, h, frame)
    R(im, x + 1, y + 1, w - 2, h - 2, GLOW if lit else GLASS)
    if lit:
        P(im, x + 1, y + 1, GLOWL)
        R(im, x + 1, y + h - 2, w - 2, 1, GLOWD)
    if w >= 6:
        R(im, x + w // 2, y + 1, 1, h - 2, frame)


def lantern(im, x, y, c):
    P(im, x, y - 1, OUTL)
    R(im, x - 1, y, 3, 3, c)
    P(im, x, y + 1, GLOWL)
    P(im, x, y + 3, OUTL)


# ---------------------------------------------------------------- buildings
def castle():
    """A spooky ruin: dark mossy stone, a crooked broken tower, ghost light in the gate and a window."""
    rng = random.Random(1)
    im = img(62, 60)
    # main wall
    bricks(im, 12, 26, 38, 33, ST, STD, STL, rng)
    for xx in range(12, 50, 6):
        R(im, xx, 22, 4, 4, ST)
    for xx, top in ((30, 26), (31, 28), (32, 30), (33, 29), (34, 27), (35, 26), (36, 28), (37, 26)):  # collapsed bit
        R(im, xx, 22, 1, top - 22 + 1, T)
    # tall left tower with pointed broken roof
    bricks(im, 1, 10, 15, 49, ST, STD, STL, rng)
    for i in range(8):
        R(im, 3 + i, 3 + abs(4 - i) // 1, 1, 8 - abs(4 - i), (52, 40, 62, 255))  # ragged dark roof
    R(im, 2, 9, 13, 2, STD)
    for xx in (1, 6, 11):
        R(im, xx, 7, 3, 3, ST)
    window(im, 6, 18, 4, 6, lit=False, frame=OUTL)
    R(im, 7, 19, 2, 4, GHOST); P(im, 7, 19, GHOSTL)  # eerie green light
    R(im, 7, 34, 2, 6, OUTL)
    # right tower, leaning and shattered
    bricks(im, 46, 20, 15, 39, ST, STD, STL, rng)
    jag = [24, 21, 19, 22, 18, 16, 20, 23, 25, 21, 19, 22, 26, 28, 27]
    for i, top in enumerate(jag):
        R(im, 46 + i, 20, 1, top - 20, T)
    R(im, 52, 32, 2, 6, OUTL)
    # cracks
    for (x, y) in ((20, 30), (21, 31), (21, 32), (22, 33), (40, 40), (41, 41), (41, 42), (55, 36), (54, 37), (54, 38)):
        P(im, x, y, OUTL)
    # gate with ghost glow
    R(im, 23, 38, 14, 21, (12, 10, 18, 255))
    R(im, 24, 36, 12, 2, (12, 10, 18, 255)); R(im, 26, 35, 8, 1, (12, 10, 18, 255))
    for xx in range(25, 36, 3):
        R(im, xx, 38, 1, 15, STM)
    R(im, 28, 50, 5, 3, GHOST); R(im, 29, 49, 3, 1, GHOSTL); P(im, 30, 47, GHOST)
    # moss and hanging ivy
    for (cx, cy, n) in ((3, 40, 40), (14, 52, 30), (46, 46, 26), (58, 54, 22), (24, 26, 14)):
        for _ in range(n):
            P(im, cx + rng.randrange(-3, 6), cy + rng.randrange(-8, 6), rng.choice((MOSS, MOSSD)))
    for xx in (16, 19, 43):
        for k in range(rng.randrange(4, 9)):
            P(im, xx, 26 + k, MOSSD)
    # cobweb in the corner
    for i in range(5):
        P(im, 12 + i, 26 + i, (200, 200, 210, 255)); P(im, 12 + i, 26, (200, 200, 210, 255)); P(im, 12, 26 + i, (200, 200, 210, 255))
    # rubble
    for (x, y) in ((37, 57), (40, 56), (8, 58), (57, 57), (33, 56)):
        R(im, x, y, 3, 2, STL)
    return finish(im)


def inn():
    rng = random.Random(2)
    im = img(54, 52)
    R(im, 38, 0, 6, 10, ST); R(im, 38, 0, 6, 1, STD)
    for i, y in enumerate(range(5, 21)):
        x0 = max(1, 9 - i // 2)
        R(im, x0, y, 54 - 2 * x0, 1, ROOF)
        for xx in range(x0, 54 - x0):
            if (xx + (y % 2) * 2) % 4 == 0:
                P(im, xx, y, ROOFD)
    R(im, 1, 20, 52, 1, ROOFD); R(im, 9, 5, 36, 1, ROOFL)
    R(im, 3, 21, 48, 14, PLASTER)
    for xx in (3, 15, 27, 38, 49):
        R(im, xx, 21, 2, 14, BEAM)
    R(im, 3, 21, 48, 1, BEAMD); R(im, 3, 34, 48, 2, BEAMD)
    for i in range(10):
        P(im, 5 + i, 33 - i, BEAM); P(im, 40 + i, 23 + i, BEAM)
    window(im, 18, 24, 7, 7); window(im, 30, 24, 7, 7)
    R(im, 3, 36, 48, 14, PLASTERD)
    R(im, 3, 36, 2, 14, BEAM); R(im, 49, 36, 2, 14, BEAM)
    # open, glowing door
    R(im, 22, 37, 10, 13, BEAMD); R(im, 23, 38, 8, 12, GLOW); R(im, 23, 38, 8, 1, GLOWL); R(im, 23, 47, 8, 3, GLOWD)
    R(im, 23, 38, 2, 12, BEAM)  # door ajar
    window(im, 7, 39, 9, 7); window(im, 38, 39, 9, 7)
    # sign + lantern
    R(im, 47, 36, 6, 1, BEAMD); R(im, 48, 37, 1, 2, BEAMD); R(im, 51, 37, 1, 2, BEAMD)
    R(im, 46, 39, 8, 6, WOOD); R(im, 48, 40, 3, 4, (230, 200, 120, 255)); R(im, 51, 41, 1, 2, (230, 200, 120, 255))
    lantern(im, 19, 39, GLOW)
    R(im, 2, 50, 50, 2, STD)
    return finish(im)


def farm():
    rng = random.Random(3)
    im = img(58, 52)
    R(im, 42, 0, 6, 11, FSTONED)
    bricks(im, 5, 24, 48, 26, FSTONE, FSTONED, FSTONEL, rng, row=4, joint=7)
    for i, y in enumerate(range(5, 27)):
        x0 = max(1, 13 - i)
        R(im, x0, y, 58 - 2 * x0, 1, THATCH)
        for xx in range(x0, 58 - x0):
            r = rng.random()
            if r < 0.22:
                P(im, xx, y, THATCHD)
            elif r < 0.32:
                P(im, xx, y, THATCHL)
    R(im, 1, 25, 56, 2, THATCHD)
    for xx in range(2, 56, 3):
        P(im, xx, 27, THATCHD)
    window(im, 25, 12, 8, 7, frame=FSTONED)
    R(im, 25, 35, 9, 15, BEAMD); R(im, 26, 36, 7, 14, DOORG); P(im, 31, 43, GLOWL)
    for wx in (9, 41):
        window(im, wx, 31, 9, 8, frame=WHITE)
        R(im, wx, 39, 9, 2, (160, 60, 80, 255))
        for k in range(0, 9, 2):
            P(im, wx + k, 38, (230, 120, 160, 255))
    lantern(im, 22, 35, GLOW)
    for _ in range(34):
        P(im, 6 + rng.randrange(0, 4), 28 + rng.randrange(0, 20), rng.choice((MOSS, MOSSD, (220, 90, 120, 255))))
    R(im, 4, 50, 50, 2, FSTONED)
    return finish(im)


def manor():
    rng = random.Random(4)
    im = img(66, 56)
    for cx in (10, 51):
        R(im, cx, 0, 5, 11, MSTONED)
    for i, y in enumerate(range(6, 19)):
        x0 = max(2, 9 - i // 2)
        R(im, x0, y, 66 - 2 * x0, 1, SLATE)
        for xx in range(x0, 66 - x0):
            if (xx + (y % 3) * 3) % 6 == 0:
                P(im, xx, y, SLATED)
    R(im, 9, 6, 48, 1, SLATEL); R(im, 2, 18, 62, 1, SLATED)
    R(im, 3, 19, 60, 31, MSTONE)
    for yy in range(19, 50, 5):
        R(im, 3, yy, 60, 1, MSTONED)
    for i in range(7):
        R(im, 25 - i * 2, 12 + i, 16 + i * 4, 1, MSTONEL)
    R(im, 31, 14, 4, 3, GLOW)
    for cx in (22, 28, 37, 43):
        R(im, cx, 20, 2, 28, WHITE)
    R(im, 30, 34, 6, 14, OUTL); R(im, 31, 35, 4, 13, GLOWD); R(im, 31, 35, 4, 2, GLOW)
    lit = [(6, 22), (13, 35), (48, 22), (55, 35), (55, 22)]
    for wx in (6, 13, 48, 55):
        for wy in (22, 35):
            window(im, wx, wy, 5, 8, lit=(wx, wy) in lit, frame=WHITE)
    window(im, 30, 22, 6, 7, frame=WHITE)
    R(im, 25, 50, 16, 2, MSTONEL); R(im, 23, 52, 20, 2, MSTONED); R(im, 3, 49, 60, 1, MSTONED)
    for tx in (0, 62):
        R(im, tx, 42, 4, 8, TM); R(im, tx + 1, 41, 2, 1, TL)
    lantern(im, 26, 37, GLOW); lantern(im, 40, 37, GLOW)
    return finish(im)


def market():
    im = img(58, 50)

    def stall(x, c1, c2, goods):
        R(im, x + 1, 16, 2, 22, WOODD); R(im, x + 21, 16, 2, 22, WOODD)
        for i in range(24):
            R(im, x + i, 8, 1, 9, c1 if (i // 3) % 2 == 0 else c2)
        for i in range(0, 24, 3):
            R(im, x + i, 17, 2, 1, c1 if (i // 3) % 2 == 0 else c2)
        R(im, x + 2, 6, 20, 2, c2)
        R(im, x, 28, 24, 9, WOOD); R(im, x, 28, 24, 1, WOODL); R(im, x, 36, 24, 1, WOODD)
        for xx in range(x + 4, x + 24, 6):
            R(im, xx, 29, 1, 7, WOODD)
        # string of mini lanterns under the awning
        for k, c in enumerate((LAN_R, LAN_Y, LAN_T, LAN_O)):
            lantern(im, x + 4 + k * 5, 19 + (k % 2), c)
        goods(x)

    def apples(x):
        for i in range(8):
            P(im, x + 3 + i * 2, 26 + (i % 2), RED); P(im, x + 3 + i * 2, 27 - (i % 2), (110, 170, 60, 255))
        R(im, x + 14, 24, 5, 2, (200, 140, 70, 255))

    def cloth(x):
        for i, c in enumerate(((120, 70, 150, 255), (60, 140, 120, 255), (220, 180, 60, 255))):
            R(im, x + 3 + i * 6, 23, 5, 5, c); R(im, x + 3 + i * 6, 23, 5, 1, WHITE)

    stall(2, RED, WHITE, apples)
    stall(32, BLUE, WHITE, cloth)
    for (x, y) in ((4, 40), (13, 42)):
        R(im, x, y, 8, 7, WOOD); R(im, x, y, 8, 1, WOODL); R(im, x + 3, y, 1, 7, WOODD); R(im, x, y + 3, 8, 1, WOODD)
    R(im, 46, 39, 8, 10, WOODD); R(im, 47, 39, 6, 10, WOOD); R(im, 46, 41, 8, 1, STM); R(im, 46, 45, 8, 1, STM)
    R(im, 34, 42, 9, 6, (150, 120, 70, 255))
    return finish(im)


# ---------------------------------------------------------------- people (14 x 20)
SKIN, SKIND, BLUSH = (242, 198, 152, 255), (212, 156, 116, 255), (236, 150, 140, 255)


def body(im, shirt, pants, shoes, frame, dress=False, skin=SKIN):
    shade = mul(shirt, 0.8)
    lo, ro = {0: (0, 0), 1: (-1, 1), 2: (1, -1)}[frame]
    if dress:
        for i, y in enumerate(range(10, 19)):
            R(im, 4 - i // 4, y, 6 + 2 * (i // 4), 1, shirt)
        R(im, 9, 11, 1, 8, shade)
        R(im, 4, 19, 2, 1, shoes); R(im, 8, 19, 2, 1, shoes)
    else:
        R(im, 4 + lo, 15, 2, 4, pants); R(im, 8 + ro, 15, 2, 4, pants)
        R(im, 4 + lo, 19, 3, 1, shoes); R(im, 7 + ro, 19, 3, 1, shoes)
        R(im, 4, 10, 6, 5, shirt); R(im, 8, 10, 2, 5, shade)
        R(im, 4, 14, 6, 1, mul(pants, 0.8))  # belt
    R(im, 3, 11, 1, 4, shirt); R(im, 10, 11, 1, 4, shade)
    P(im, 3, 15, skin); P(im, 10, 15, skin)


def head(im, hair, style, skin=SKIN, face="down"):
    R(im, 4, 2, 6, 8, skin); R(im, 3, 3, 8, 6, skin)
    P(im, 6, 9, SKIND); P(im, 7, 9, SKIND)  # neck shadow
    if face == "down":
        R(im, 5, 5, 1, 2, OUTL); R(im, 8, 5, 1, 2, OUTL)
        P(im, 5, 5, (80, 90, 120, 255)); P(im, 8, 5, (80, 90, 120, 255))
        P(im, 4, 7, BLUSH); P(im, 9, 7, BLUSH)
        P(im, 6, 8, SKIND); P(im, 7, 8, SKIND)
    if style == "short":
        R(im, 3, 1, 8, 3, hair); R(im, 3, 4, 1, 2, hair); R(im, 10, 4, 1, 2, hair); P(im, 9, 0, hair)
    elif style == "bun":
        R(im, 3, 1, 8, 3, hair); R(im, 5, -1 + 1, 4, 1, hair); R(im, 5, 0, 4, 1, hair); R(im, 3, 4, 1, 4, hair); R(im, 10, 4, 1, 4, hair)
    elif style == "long":
        R(im, 3, 1, 8, 3, hair); R(im, 2, 3, 2, 8, hair); R(im, 10, 3, 2, 8, hair)
    elif style == "bald":
        R(im, 3, 4, 1, 3, hair); R(im, 10, 4, 1, 3, hair); P(im, 5, 2, mul(skin, 1.1))
    if face == "up":
        R(im, 3, 1, 8, 8, hair)


def person(spec, frame=0):
    im = img(14, 20)
    body(im, spec["shirt"], spec.get("pants", (70, 70, 80, 255)), spec.get("shoes", BEAMD), frame, spec.get("dress", False))
    head(im, spec["hair"], spec["style"])
    return im


def villager(vid):
    if vid == "reader":  # Regency lady with a bonnet, reading
        im = person({"hair": (130, 80, 46, 255), "style": "bun", "shirt": (120, 60, 120, 255), "dress": True})
        R(im, 2, 1, 10, 2, (236, 220, 190, 255)); R(im, 3, 0, 8, 1, (236, 220, 190, 255)); P(im, 11, 3, (220, 90, 120, 255))
        R(im, 4, 11, 6, 4, (160, 40, 40, 255)); R(im, 4, 11, 6, 1, WHITE); R(im, 7, 11, 1, 4, (110, 30, 30, 255))
        return finish(im)
    if vid == "painter":
        base = person({"hair": (50, 40, 34, 255), "style": "short", "shirt": (54, 100, 66, 255), "pants": (110, 76, 46, 255)})
        R(base, 3, 0, 8, 2, (60, 36, 40, 255)); P(base, 9, -1 + 1, (60, 36, 40, 255))  # beret
        im = img(24, 20)
        im.alpha_composite(base, (0, 0))
        R(im, 15, 4, 8, 9, WHITE); R(im, 16, 5, 6, 4, (44, 94, 52, 255)); R(im, 16, 9, 6, 3, (120, 80, 40, 255))
        R(im, 14, 13, 1, 7, WOODD); R(im, 22, 13, 1, 7, WOODD); R(im, 18, 2, 1, 18, WOODD)
        P(im, 12, 12, (220, 60, 60, 255)); P(im, 11, 13, WOODD)
        return finish(im)
    if vid == "cook":
        im = person({"hair": (60, 40, 30, 255), "style": "short", "shirt": WHITE, "pants": (60, 60, 72, 255)})
        im2 = img(14, 22)
        im2.alpha_composite(im, (0, 2))
        R(im2, 4, 0, 6, 4, WHITE); R(im2, 3, 3, 8, 1, WHITE)  # toque
        R(im2, 3, 13, 8, 5, (70, 70, 84, 255)); R(im2, 3, 13, 8, 1, (130, 130, 144, 255))  # pot
        P(im2, 5, 11, (240, 230, 210, 255)); P(im2, 8, 10, (240, 230, 210, 255)); P(im2, 6, 9, (240, 230, 210, 255))  # steam
        return finish(im2)
    if vid == "athlete":
        im = img(18, 20)
        im.alpha_composite(person({"hair": (28, 26, 30, 255), "style": "short", "shirt": (40, 110, 210, 255), "pants": WHITE}), (0, 0))
        R(im, 6, 11, 2, 3, WHITE)  # shirt number
        R(im, 13, 12, 5, 5, WHITE); P(im, 15, 12, (240, 200, 60, 255)); P(im, 14, 14, BLUE); P(im, 16, 15, BLUE); P(im, 17, 13, (240, 200, 60, 255))
        return finish(im)
    if vid == "neighbour":
        im = img(16, 20)
        im.alpha_composite(person({"hair": (206, 206, 212, 255), "style": "bald", "shirt": (140, 92, 58, 255), "pants": (80, 72, 62, 255)}), (0, 0))
        R(im, 4, 5, 2, 1, OUTL); R(im, 8, 5, 2, 1, OUTL)  # spectacles
        R(im, 5, 8, 4, 1, (206, 206, 212, 255))  # moustache
        R(im, 12, 9, 1, 11, WOODD); R(im, 11, 9, 2, 1, WOODD)
        return finish(im)
    if vid == "birder":
        im = person({"hair": (110, 70, 40, 255), "style": "short", "shirt": (130, 120, 70, 255), "pants": (90, 76, 56, 255)})
        R(im, 2, 1, 10, 2, (70, 96, 52, 255)); R(im, 3, 0, 8, 1, (70, 96, 52, 255))  # bucket hat
        R(im, 5, 11, 4, 2, OUTL); P(im, 5, 11, GLASSL); P(im, 8, 11, GLASSL)  # binoculars on chest
        P(im, 6, 10, OUTL); P(im, 7, 10, OUTL)
        return finish(im)
    if vid == "dog":  # Sirius: dark, like the dog star at night
        im = img(18, 13)
        fur, furd, furl = (44, 40, 40, 255), (30, 28, 28, 255), (84, 76, 70, 255)
        R(im, 3, 5, 11, 5, fur); R(im, 4, 4, 9, 1, furl)
        R(im, 3, 10, 2, 3, fur); R(im, 12, 10, 2, 3, fur); R(im, 6, 10, 2, 2, furd); R(im, 10, 10, 2, 2, furd)
        R(im, 12, 1, 6, 6, fur); R(im, 12, 0, 2, 2, furd); R(im, 16, 4, 2, 2, (90, 80, 74, 255))
        P(im, 17, 4, OUTL); P(im, 14, 2, (250, 250, 240, 255)); P(im, 15, 2, OUTL)
        R(im, 0, 2, 3, 1, fur); R(im, 2, 3, 1, 2, fur)
        R(im, 12, 6, 2, 1, (210, 50, 50, 255)); P(im, 13, 7, GLOW)  # collar with a tag
        return finish(im)
    if vid == "cat":  # Ajko: ginger tom, eyes that glow at night
        im = img(13, 11)
        fur, fd = (226, 140, 60, 255), (184, 98, 38, 255)
        R(im, 2, 5, 7, 4, fur); R(im, 2, 9, 2, 2, fur); R(im, 7, 9, 2, 2, fur)
        R(im, 7, 1, 6, 5, fur); P(im, 7, 0, fur); P(im, 12, 0, fur)
        P(im, 8, 3, CATEYE); P(im, 11, 3, CATEYE); P(im, 10, 4, (230, 120, 140, 255))
        for xx in (3, 5, 7):
            R(im, xx, 5, 1, 3, fd)
        R(im, 0, 1, 1, 6, fur); P(im, 1, 7, fur)
        return finish(im)
    raise ValueError(vid)


def player(frame, facing):
    hair, beard = (76, 46, 30, 255), (92, 56, 36, 255)
    jacket, shirt, jeans = (100, 108, 110, 255), (228, 240, 238, 255), (52, 80, 116, 255)
    im = img(14, 20)
    if facing == "side":
        lo, ro = {0: (0, 0), 1: (-1, 1), 2: (1, -1)}[frame]
        R(im, 5 + lo, 15, 2, 4, jeans); R(im, 7 + ro, 15, 2, 4, mul(jeans, 0.8))
        R(im, 5 + lo, 19, 3, 1, BEAMD); R(im, 7 + ro, 19, 3, 1, BEAMD)
        R(im, 4, 10, 7, 5, jacket); R(im, 9, 10, 2, 4, shirt); R(im, 6, 11, 2, 4, mul(jacket, 0.8))
        P(im, 7 + (1 if frame == 1 else 0), 15, SKIN)
        R(im, 5, 2, 7, 8, SKIN); R(im, 4, 3, 1, 6, SKIN)
        R(im, 4, 1, 7, 2, hair); R(im, 4, 3, 3, 4, hair); P(im, 10, 1, hair)
        R(im, 8, 4, 4, 1, OUTL); R(im, 9, 5, 2, 1, OUTL); P(im, 10, 5, (200, 230, 240, 255))  # glasses
        P(im, 8, 6, OUTL)  # eye line
        R(im, 6, 7, 6, 3, beard); P(im, 11, 8, (240, 240, 240, 255))
        return finish(im)
    lo, ro = {0: (0, 0), 1: (-1, 1), 2: (1, -1)}[frame]
    R(im, 4 + lo, 15, 2, 4, jeans); R(im, 8 + ro, 15, 2, 4, jeans)
    R(im, 4 + lo, 19, 3, 1, BEAMD); R(im, 7 + ro, 19, 3, 1, BEAMD)
    R(im, 3, 10, 8, 5, jacket); R(im, 9, 10, 2, 5, mul(jacket, 0.8))
    R(im, 2, 11, 1, 4, jacket); R(im, 11, 11, 1, 4, mul(jacket, 0.8))
    P(im, 2, 15, SKIN); P(im, 11, 15, SKIN)
    if facing == "down":
        R(im, 6, 10, 2, 5, shirt); P(im, 5, 10, mul(jacket, 1.2)); P(im, 8, 10, mul(jacket, 1.2))  # lapels
    R(im, 4, 2, 6, 8, SKIN); R(im, 3, 3, 8, 6, SKIN)
    R(im, 3, 0, 8, 3, hair); R(im, 2, 1, 1, 5, hair); R(im, 11, 1, 1, 5, hair); P(im, 8, 0, (110, 70, 44, 255))
    if facing == "up":
        R(im, 3, 1, 8, 8, hair); R(im, 4, 9, 6, 1, beard)
        return finish(im)
    # round glasses
    R(im, 3, 4, 3, 3, OUTL); R(im, 8, 4, 3, 3, OUTL); P(im, 6, 4, OUTL); P(im, 7, 4, OUTL)
    P(im, 4, 5, (200, 230, 240, 255)); P(im, 9, 5, (200, 230, 240, 255))
    # beard with a smile
    R(im, 3, 7, 8, 2, beard); R(im, 4, 9, 6, 1, beard); P(im, 3, 6, beard); P(im, 10, 6, beard)
    R(im, 5, 7, 4, 1, (250, 250, 250, 255)); P(im, 5, 7, (160, 70, 60, 255)); P(im, 8, 7, (160, 70, 60, 255))
    return finish(im)


# ---------------------------------------------------------------- small decor
def sheep():
    im = img(13, 10)
    R(im, 1, 1, 9, 6, WHITE); R(im, 0, 2, 11, 4, WHITE); P(im, 3, 0, WHITE); P(im, 6, 0, WHITE)
    P(im, 3, 2, (214, 212, 204, 255)); P(im, 7, 3, (214, 212, 204, 255))
    R(im, 9, 2, 4, 4, (50, 46, 54, 255)); P(im, 11, 3, WHITE)
    R(im, 2, 7, 1, 3, (50, 46, 54, 255)); R(im, 7, 7, 1, 3, (50, 46, 54, 255))
    return finish(im)


def tree(rng, big=False, dead=False):
    w, h = (18, 22) if big else (14, 18)
    im = img(w, h)
    cx = w // 2
    if dead:  # bare spooky tree
        R(im, cx - 1, 6, 2, h - 6, TRUNKD)
        for (x, y, dx) in ((cx - 1, 10, -1), (cx, 8, 1), (cx - 1, 6, -1), (cx, 5, 1)):
            for k in range(5):
                P(im, x + dx * k, y - k // 2, TRUNKD)
        return finish(im)
    R(im, cx - 1, h - 6, 3, 6, TRUNK); R(im, cx + 1, h - 6, 1, 6, TRUNKD)
    rows = [(4, 0), (8, 1), (10, 2)] + [(w - 2, i) for i in range(3, h - 8)] + [(w - 4, h - 8), (w - 8, h - 7)]
    for width, y in rows:
        R(im, cx - width // 2, y, width, 1, TM)
    for _ in range(w * h // 4):
        x, y = rng.randrange(0, w), rng.randrange(0, h - 6)
        if im.getpixel((x, y))[3]:
            P(im, x, y, rng.choice((TD, TL, TM)))
    for _ in range(6):
        x, y = rng.randrange(cx - 4, cx + 2), rng.randrange(1, 6)
        if im.getpixel((x, y))[3]:
            P(im, x, y, TH)
    return finish(im)


def bush(rng):
    im = img(10, 7)
    R(im, 1, 1, 8, 5, TM); R(im, 0, 2, 10, 3, TM)
    for _ in range(12):
        P(im, rng.randrange(0, 10), rng.randrange(1, 6), rng.choice((TD, TL)))
    if rng.random() < 0.4:
        P(im, rng.randrange(2, 8), 2, (230, 120, 160, 255))
    return finish(im)


def tombstone(rng):
    im = img(7, 9)
    R(im, 1, 1, 5, 8, ST); R(im, 2, 0, 3, 1, ST); R(im, 3, 2, 1, 4, STD); R(im, 2, 3, 3, 1, STD)
    return finish(im)


def well():
    im = img(16, 14)
    R(im, 1, 6, 14, 7, ST); R(im, 3, 7, 10, 3, (20, 30, 60, 255)); R(im, 1, 6, 14, 1, STL)
    R(im, 1, 0, 2, 7, WOODD); R(im, 13, 0, 2, 7, WOODD); R(im, 0, 0, 16, 2, ROOFD)
    R(im, 7, 2, 1, 4, OUTL); R(im, 6, 5, 3, 2, WOOD)
    return finish(im)


def bonfire():
    im = img(14, 12)
    R(im, 1, 9, 12, 3, WOODD); R(im, 3, 8, 8, 1, WOOD)
    for (x, y, c) in ((6, 1, FIRE3), (5, 3, FIRE2), (7, 2, FIRE2), (4, 5, FIRE1), (8, 4, FIRE1), (6, 4, FIRE3), (5, 6, FIRE2), (7, 6, FIRE2), (3, 7, FIRE1), (9, 7, FIRE1), (6, 7, FIRE3)):
        R(im, x, y, 2, 2, c)
    return outline(im)


def haystack():
    im = img(14, 11)
    for i, y in enumerate(range(0, 11)):
        w = min(14, 6 + i * 2)
        R(im, 7 - w // 2, y, w, 1, THATCH)
    rng = random.Random(9)
    for _ in range(30):
        x, y = rng.randrange(0, 14), rng.randrange(0, 11)
        if im.getpixel((x, y))[3]:
            P(im, x, y, rng.choice((THATCHD, THATCHL)))
    return finish(im)


def bat():
    im = img(9, 4)
    R(im, 3, 1, 3, 2, OUTL); P(im, 0, 0, OUTL); P(im, 1, 1, OUTL); P(im, 2, 1, OUTL); P(im, 8, 0, OUTL); P(im, 7, 1, OUTL); P(im, 6, 1, OUTL)
    P(im, 4, 1, (255, 80, 80, 255))
    return im


# ---------------------------------------------------------------- layouts (organic, asymmetric)
LAYOUTS = {
    "wide": {
        "w": 320, "h": 208,
        "places": {
            "castle": {"x": 12, "y": 14, "node": "castle"},
            "inn": {"x": 116, "y": 6, "node": "inn"},
            "manor": {"x": 236, "y": 16, "node": "manor"},
            "farm": {"x": 36, "y": 110, "node": "farm"},
            "market": {"x": 202, "y": 114, "node": "market"},
        },
        "nodes": {
            "castle": [42, 77], "k1": [60, 88], "reader": [94, 92], "k2": [120, 86],
            "inn": [143, 61], "k3": [146, 74], "start": [158, 100], "cook": [196, 96],
            "k4": [226, 86], "manor": [269, 75], "k5": [276, 90], "neighbour": [298, 102],
            "cat": [24, 92], "athlete": [164, 128], "k6": [150, 148], "painter": [112, 156],
            "k7": [82, 168], "farm": [65, 165], "dog": [38, 176],
            "birder": [188, 154], "k8": [214, 168], "market": [231, 167],
        },
        "edges": [
            ["castle", "k1"], ["k1", "reader"], ["reader", "k2"], ["k2", "start"], ["castle", "cat"],
            ["inn", "k3"], ["k3", "start"], ["start", "cook"], ["cook", "k4"], ["k4", "manor"], ["k4", "k5"], ["k5", "neighbour"],
            ["start", "athlete"], ["athlete", "k6"], ["k6", "painter"], ["painter", "k7"], ["k7", "farm"], ["farm", "dog"],
            ["k6", "birder"], ["birder", "k8"], ["k8", "market"],
        ],
        "villagers": {
            "cat": [18, 106], "reader": [96, 108], "cook": [200, 114], "neighbour": [302, 120],
            "athlete": [182, 132], "painter": [114, 175], "dog": [30, 192], "birder": [190, 172],
        },
        "plaza": [158, 100, 13],
        "pond": [270, 190, 40, 11],
        "meadow": [62, 186, 168, 206],
        "sheep": [[76, 192], [104, 197], [132, 190], [152, 198]],
        "hay": [[124, 116]],
        "well": [128, 92],
        "bonfire": [170, 84],
        "graves": [[6, 74], [70, 66], [80, 72]],
        "dead": [[0, 60], [74, 42]],
        "bats": [[30, 6], [56, 10], [8, 30]],
        # lantern strings between poles (pole tops)
        "strings": [[[126, 78], [190, 78]], [[132, 118], [186, 116]], [[190, 78], [218, 100]], [[92, 140], [132, 118]], [[186, 116], [214, 150]]],
        "trees": [
            [80, 112, 0, 56], [178, 232, 0, 60], [0, 10, 100, 208], [308, 320, 0, 208],
            [0, 34, 116, 168], [100, 136, 122, 146], [264, 306, 122, 168], [230, 262, 70, 108],
            [292, 320, 170, 208], [176, 222, 182, 208], [96, 116, 52, 70],
        ],
        "flies": [[90, 30], [200, 20], [300, 60], [16, 150], [120, 132], [284, 150], [210, 196], [100, 58]],
    },
    "tall": {
        "w": 192, "h": 320,
        "places": {
            "castle": {"x": 4, "y": 12, "node": "castle"},
            "manor": {"x": 122, "y": 4, "node": "manor"},
            "inn": {"x": 8, "y": 108, "node": "inn"},
            "farm": {"x": 128, "y": 116, "node": "farm"},
            "market": {"x": 14, "y": 214, "node": "market"},
        },
        "nodes": {
            "castle": [34, 75], "k1": [50, 86], "cat": [72, 90], "k2": [96, 82], "reader": [92, 40],
            "manor": [154, 63], "k3": [140, 78], "neighbour": [136, 90],
            "cook": [100, 110], "start": [94, 136], "k4": [68, 152], "inn": [35, 163], "dog": [52, 168],
            "k5": [122, 154], "farm": [157, 171], "athlete": [100, 192], "k6": [86, 226],
            "painter": [70, 252], "market": [43, 267], "birder": [112, 270],
        },
        "edges": [
            ["castle", "k1"], ["k1", "cat"], ["cat", "k2"], ["reader", "k2"], ["manor", "k3"], ["k3", "neighbour"], ["neighbour", "k2"],
            ["k2", "cook"], ["cook", "start"], ["start", "k4"], ["k4", "dog"], ["dog", "inn"], ["start", "k5"], ["k5", "farm"],
            ["start", "athlete"], ["athlete", "k6"], ["k6", "painter"], ["painter", "market"], ["k6", "birder"],
        ],
        "villagers": {
            "reader": [108, 44], "cat": [70, 104], "neighbour": [154, 104], "cook": [116, 118],
            "dog": [56, 184], "athlete": [118, 196], "painter": [62, 290], "birder": [130, 268],
        },
        "plaza": [94, 136, 12],
        "pond": [150, 296, 34, 12],
        "meadow": [128, 196, 188, 246],
        "sheep": [[136, 208], [160, 214], [146, 232], [170, 236]],
        "hay": [[66, 200]],
        "well": [104, 140],
        "bonfire": [74, 124],
        "graves": [[66, 60], [6, 78], [76, 70]],
        "dead": [[64, 30], [0, 92]],
        "bats": [[26, 4], [52, 8]],
        "strings": [[[62, 124], [124, 122]], [[70, 150], [118, 148]], [[78, 182], [124, 180]], [[110, 92], [148, 98]]],
        "trees": [
            [64, 90, 0, 26], [0, 6, 100, 320], [184, 192, 0, 116], [60, 82, 168, 206], [0, 40, 180, 214],
            [80, 118, 236, 262], [0, 60, 296, 320], [86, 120, 290, 320], [172, 192, 250, 280], [150, 192, 56, 100],
        ],
        "flies": [[80, 20], [180, 110], [20, 200], [100, 250], [170, 260], [30, 300], [150, 60]],
    },
}

BUILD = {"castle": castle, "inn": inn, "farm": farm, "manor": manor, "market": market}
VILLAGERS = ["reader", "painter", "cook", "athlete", "neighbour", "birder", "dog", "cat"]
# sprites are graded a little brighter than the ground, so they read well
SPRITE_NIGHT = dict(k=(0.62, 0.66, 0.8), add=(8, 12, 30))
SPR = {k: night(f(), **SPRITE_NIGHT) for k, f in BUILD.items()}
# people are lit by the festival: only a light touch of night
PEOPLE_NIGHT = dict(k=(0.86, 0.84, 0.94), add=(2, 4, 16))
VSPR = {v: night(villager(v), **PEOPLE_NIGHT) for v in VILLAGERS}


def seg_points(a, b, step=2):
    (x0, y0), (x1, y1) = a, b
    n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]


def paste(im, s, x, y):
    for yy in range(s.height):
        for xx in range(s.width):
            px = s.getpixel((xx, yy))
            if px[3] and 0 <= x + xx < im.width and 0 <= y + yy < im.height:
                im.putpixel((x + xx, y + yy), px)


def draw_map(name, L):
    rng = random.Random(42 if name == "wide" else 43)
    W, H = L["w"], L["h"]
    im = Image.new("RGBA", (W, H), G2)
    for y in range(H):
        for x in range(W):
            r = rng.random()
            if r < 0.18:
                im.putpixel((x, y), G1)
            elif r < 0.28:
                im.putpixel((x, y), G3)
            elif r < 0.31:
                im.putpixel((x, y), G4)
    for _ in range(W * H // 60):
        x, y = rng.randrange(W), rng.randrange(1, H)
        P(im, x, y, G4); P(im, x, y - 1, G3)
    keep = []

    # meadow + fence
    mx0, my0, mx1, my1 = L["meadow"]
    for _ in range((mx1 - mx0) * (my1 - my0) // 14):
        P(im, rng.randrange(mx0, mx1), rng.randrange(my0, my1), rng.choice(((250, 250, 240, 255), (240, 214, 90, 255), (230, 150, 190, 255), G3)))
    for xx in range(mx0, mx1):
        P(im, xx, my0 - 1, WOODL); P(im, xx, my0 + 2, WOOD)
    for xx in range(mx0, mx1, 6):
        R(im, xx, my0 - 3, 1, 7, WOODD)
    for yy in range(my0, my1):
        if yy % 6 == 0:
            R(im, mx0, yy, 1, 4, WOODD); R(im, mx1 - 1, yy, 1, 4, WOODD)
    keep.append((mx0 - 2, my0 - 4, mx1 + 2, my1))

    # pond
    cx, cy, rx, ry = L["pond"]
    for y in range(cy - ry - 2, cy + ry + 3):
        for x in range(cx - rx - 3, cx + rx + 4):
            d = ((x - cx) / (rx + 2)) ** 2 + ((y - cy) / (ry + 2)) ** 2
            e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if e <= 1:
                P(im, x, y, W1 if rng.random() > 0.12 else W2)
            elif d <= 1:
                P(im, x, y, SAND)
    for _ in range(rx):
        R(im, cx + rng.randrange(-rx + 4, rx - 4), cy + rng.randrange(-ry + 3, ry - 2), 3, 1, W3)
    for (dx, dy) in ((-rx // 2, -2), (rx // 3, 3), (rx // 2 + 4, -4)):
        R(im, cx + dx, cy + dy, 3, 2, (70, 140, 60, 255)); P(im, cx + dx + 1, cy + dy, (230, 230, 240, 255))
    keep.append((cx - rx - 4, cy - ry - 6, cx + rx + 4, cy + ry + 4))

    # winding roads: a round brush along every edge, and an open plaza
    nodes = L["nodes"]
    dirt = set()
    def brush(px_, py_, r):
        for yy in range(int(py_ - r) - 1, int(py_ + r) + 2):
            for xx in range(int(px_ - r) - 1, int(px_ + r) + 2):
                if (xx - px_) ** 2 + (yy - py_) ** 2 <= r * r and 0 <= xx < W and 0 <= yy < H:
                    dirt.add((xx, yy))
    for a, b in L["edges"]:
        for (x, y) in seg_points(nodes[a], nodes[b]):
            brush(x, y, 4.2)
            keep.append((x - 7, y - 7, x + 7, y + 7))
    pcx, pcy, pr = L["plaza"]
    brush(pcx, pcy, pr)
    keep.append((pcx - pr - 3, pcy - pr - 3, pcx + pr + 3, pcy + pr + 3))
    for (x, y) in dirt:
        r = rng.random()
        im.putpixel((x, y), DIRT2 if r < 0.15 else DIRT3 if r < 0.22 else DIRT)
    for (x, y) in dirt:
        if (x, y + 1) not in dirt:
            im.putpixel((x, y), DIRTE)
        elif (x, y - 1) not in dirt or (x - 1, y) not in dirt or (x + 1, y) not in dirt:
            im.putpixel((x, y), DIRT2)
    for _ in range(len(dirt) // 40):
        x, y = rng.choice(sorted(dirt))
        P(im, x, y, STL)

    # buildings, villagers: shadows + keep-out
    for pid, p in L["places"].items():
        s = SPR[pid]
        x, y = p["x"], p["y"]
        R(im, x + 2, y + s.height - 2, s.width - 2, 3, G4)
        keep.append((x - 2, y - 8, x + s.width + 2, y + s.height + 3))
    for vid, (vx, vy) in L["villagers"].items():
        s = VSPR[vid]
        keep.append((vx - s.width // 2 - 3, vy - s.height - 8, vx + s.width // 2 + 3, vy + 3))
        R(im, vx - s.width // 2 + 2, vy - 1, s.width - 4, 2, G4)

    def free(x0, y0, x1, y1):
        return not any(x0 < kx1 and x1 > kx0 and y0 < ky1 and y1 > ky0 for kx0, ky0, kx1, ky1 in keep)

    deco = []
    def add(s, x, y, block=True):
        deco.append((y + s.height, s, x, y))
        if block:
            keep.append((x - 1, y - 1, x + s.width + 1, y + s.height + 1))
    wx, wy = L["well"]; add(well(), wx - 8, wy - 14)
    for (hx, hy) in L["hay"]:
        add(haystack(), hx, hy)
    for (gx, gy) in L["graves"]:
        add(tombstone(rng), gx, gy)
    for (dx, dy) in L["dead"]:
        add(tree(rng, big=True, dead=True), dx, dy)
    for (sx, sy) in L["sheep"]:
        s = sheep()
        add(s if rng.random() < 0.5 else s.transpose(Image.FLIP_LEFT_RIGHT), sx, sy, block=False)
    # lantern poles block trees too
    for a, b in L["strings"]:
        for (x, y) in (a, b):
            keep.append((x - 4, y - 4, x + 4, y + 18))
    placed = []
    for (x0, x1, y0, y1) in L["trees"]:
        tries = max(4, (x1 - x0) * (y1 - y0) // 55)
        for _ in range(tries):
            big = rng.random() < 0.4
            tw, th = (18, 22) if big else (14, 18)
            tx = rng.randrange(x0 - 4, max(x0 - 3, x1 - tw + 4))
            ty = rng.randrange(y0 - 6, max(y0 - 5, y1 - th + 2))
            if free(tx + 2, ty + th - 8, tx + tw - 2, ty + th) and free(tx + 3, ty + 2, tx + tw - 3, ty + th - 2) and all(abs(tx - px) > 8 or abs(ty - py) > 8 for px, py in placed):
                deco.append((ty + th, tree(rng, big), tx, ty))
                placed.append((tx, ty))
    for _ in range(W * H // 1100):
        bx, by = rng.randrange(0, W - 10), rng.randrange(0, H - 7)
        if free(bx, by, bx + 10, by + 7):
            add(bush(rng), bx, by)
    for _, s, x, y in sorted(deco, key=lambda d: d[0]):
        paste(im, s, x, y)

    # ---------- night ----------
    im = night(im)
    # mist around the castle
    c = L["places"]["castle"]
    for _ in range(140):
        x = c["x"] + rng.randrange(-6, 66); y = c["y"] + 46 + rng.randrange(0, 18)
        if 0 <= x < W and 0 <= y < H and rng.random() < 0.6:
            p = im.getpixel((x, y))
            im.putpixel((x, y), (min(255, p[0] + 30), min(255, p[1] + 36), min(255, p[2] + 44), 255))
    # warm light spilling from doors and windows onto the ground
    for pid, p in L["places"].items():
        if pid == "castle":
            halo(im, p["x"] + 30, p["y"] + 60, 16, (120, 255, 170), 0.45)
        else:
            s = SPR[pid]
            halo(im, p["x"] + s.width / 2, p["y"] + s.height + 2, 18, WARM, 0.5)
    # bonfire on the plaza
    bx, by = L["bonfire"]
    halo(im, bx, by, 26, (255, 170, 80), 0.55)
    paste(im, bonfire(), bx - 7, by - 10)
    # lantern strings
    colours = [LAN_R, LAN_O, LAN_Y, LAN_P, LAN_T]
    for si, (a, b) in enumerate(L["strings"]):
        for (x, y) in (a, b):
            R(im, x, y, 1, 16, (40, 28, 24, 255)); P(im, x, y - 1, (70, 50, 40, 255))
        pts = []
        n = int(math.hypot(b[0] - a[0], b[1] - a[1]))
        sag = 3 + n // 14
        for i in range(n + 1):
            t = i / n
            pts.append((round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t + sag * math.sin(math.pi * t))))
        for (x, y) in pts:
            P(im, x, y, (30, 22, 30, 255))
        for k, (x, y) in enumerate(pts[4:-3:7]):
            halo(im, x, y + 2, 7, WARM, 0.45)
        for k, (x, y) in enumerate(pts[4:-3:7]):
            lantern(im, x, y + 1, colours[(k + si) % len(colours)])
    # fireflies
    for (fx, fy) in L["flies"]:
        for _ in range(3):
            x, y = fx + rng.randrange(-10, 10), fy + rng.randrange(-8, 8)
            halo(im, x, y, 3, (200, 255, 120), 0.5); P(im, x, y, FLY)
    # bats over the castle
    for (x, y) in L["bats"]:
        paste(im, bat(), x, y)
    # reflections of lantern light on the pond
    cx, cy, rx, ry = L["pond"]
    for _ in range(10):
        x, y = cx + rng.randrange(-rx + 6, rx - 6), cy + rng.randrange(-ry + 3, ry - 2)
        R(im, x, y, 2, 1, (120, 110, 90, 255))
    im.save(os.path.join(OUT, f"map-{name}.png"))


for k, s in SPR.items():
    s.save(os.path.join(OUT, f"{k}.png"))
for v, s in VSPR.items():
    s.save(os.path.join(OUT, f"villager-{v}.png"))
sheet = img(42, 60)
for r, facing in enumerate(("down", "up", "side")):
    for c in range(3):
        sheet.alpha_composite(night(player(c, facing), **PEOPLE_NIGHT), (c * 14, r * 20))
sheet.save(os.path.join(OUT, "player.png"))
for name, L in LAYOUTS.items():
    draw_map(name, L)

sizes = {k: [s.width, s.height] for k, s in SPR.items()}
vsizes = {k: [s.width, s.height] for k, s in VSPR.items()}
data = {}
for name, L in LAYOUTS.items():
    data[name] = {
        "w": L["w"], "h": L["h"],
        "places": {k: {**v, "w": sizes[k][0], "h": sizes[k][1]} for k, v in L["places"].items()},
        "nodes": L["nodes"], "edges": L["edges"],
        "villagers": {k: {"x": v[0], "y": v[1], "w": vsizes[k][0], "h": vsizes[k][1], "node": k} for k, v in L["villagers"].items()},
    }
ts = "// Generated by tools/experience-art/gen.py – the same coordinates the map pictures were drawn with.\n"
ts += "// Units are map pixels (the picture's own pixels, before scaling).\n\n"
ts += 'import type { PlaceId, VillagerId } from "@/content/experience-map";\n\n'
ts += "export const PLAYER = { w: 14, h: 20 };\n\n"
ts += "export type Layout = {\n  w: number;\n  h: number;\n  places: Record<PlaceId, { x: number; y: number; w: number; h: number; node: string }>;\n"
ts += "  nodes: Record<string, [number, number]>;\n  edges: [string, string][];\n"
ts += "  villagers: Record<VillagerId, { x: number; y: number; w: number; h: number; node: string }>;\n};\n\n"
ts += 'export const layouts: Record<"wide" | "tall", Layout> = ' + json.dumps(data, indent=2) + ' as Record<"wide" | "tall", Layout>;\n'
open(os.path.join(ROOT, "components", "experience", "layouts.ts"), "w").write(ts)
print("ok", sizes, vsizes)
