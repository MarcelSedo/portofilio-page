"""Pixel-art title picture for The Circumlocution Office: a Whitehall facade at gaslight, in fog.
Run from games/circumlocution: python3 tools/facade.py -> src/assets/facade.png (320x180, scaled up in CSS)."""
import random
from PIL import Image

W, H = 320, 180
rnd = random.Random(1855)
img = Image.new("RGB", (W, H))
px = img.load()
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
INK = (24, 18, 20)

def hexc(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def mix(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def rect(x0, y0, x1, y1, c):
    for y in range(max(0, y0), min(H, y1 + 1)):
        for x in range(max(0, x0), min(W, x1 + 1)):
            px[x, y] = c
def dither(x, y, a, b, t):
    return b if t * 16 > BAYER[y % 4][x % 4] else a

# sky: dusk fog, dithered between bands
bands = [hexc("#2b3140"), hexc("#3d4352"), hexc("#565a62"), hexc("#7a7868"), hexc("#9a9278")]
for y in range(H):
    t = y / 120 * (len(bands) - 1)
    i = min(int(t), len(bands) - 2)
    for x in range(W):
        px[x, y] = dither(x, y, bands[i], bands[i + 1], t - i)

# far rooftops and chimneys
far = hexc("#30343e")
x = 0
while x < W:
    w = rnd.randint(14, 30); h = rnd.randint(58, 88)
    rect(x, h, x + w, 130, far)
    for _ in range(rnd.randint(1, 3)):
        cx = x + rnd.randint(2, max(3, w - 4)); rect(cx, h - 7, cx + 2, h, far)
        for k in range(10):  # smoke
            sx = cx + 1 + k // 2 + rnd.randint(-1, 1); sy = h - 9 - k * 2
            if 0 <= sy < H and 0 <= sx < W: px[sx, sy] = mix(px[sx, sy], hexc("#8a8a88"), 0.35)
    x += w + rnd.randint(-3, 2)

# the Office: neoclassical, stone blocks
stone, stone_d, stone_l = hexc("#a59a84"), hexc("#7f7562"), hexc("#c4b99f")
L, R, TOP, BASE = 34, 286, 52, 150
rect(L, TOP, R, BASE, stone)
for y in range(TOP, BASE, 6):
    rect(L, y, R, y, stone_d)
    off = 0 if (y // 6) % 2 else 6
    for xx in range(L + off, R, 12): rect(xx, y, xx, y + 5, stone_d)
rect(L - 3, TOP - 4, R + 3, TOP - 1, stone_l); rect(L - 3, TOP - 1, R + 3, TOP - 1, stone_d)  # cornice
# pediment over the portico
PL, PR, PT = 96, 224, 16
for y in range(PT, TOP - 4):
    half = int((y - PT) / (TOP - 4 - PT) * (PR - PL) / 2)
    rect(160 - half, y, 160 + half, y, stone_l if y < PT + 3 else stone)
for y in range(PT, TOP - 4):
    half = int((y - PT) / (TOP - 4 - PT) * (PR - PL) / 2)
    px[160 - half, y] = INK; px[160 + half, y] = INK
rect(PL - 2, TOP - 5, PR + 2, TOP - 5, INK)
# royal arms in the tympanum: a little gold blob
rect(156, 30, 164, 36, hexc("#b8892a")); rect(158, 28, 162, 29, hexc("#d9b45a"))

# frieze lettering, 3x5 pixel font
FONT = {
    "C": ["111", "100", "100", "100", "111"], "I": ["111", "010", "010", "010", "111"], "R": ["110", "101", "110", "101", "101"],
    "U": ["101", "101", "101", "101", "111"], "M": ["101", "111", "111", "101", "101"], "L": ["100", "100", "100", "100", "111"],
    "O": ["111", "101", "101", "101", "111"], "T": ["111", "010", "010", "010", "010"], "N": ["101", "111", "111", "111", "101"],
    "F": ["111", "100", "110", "100", "100"], "E": ["111", "100", "110", "100", "111"], " ": ["000"] * 5,
}
text = "CIRCUMLOCUTION OFFICE"
tw = len(text) * 4 - 1
fx, fy = 160 - tw // 2, TOP + 3
rect(fx - 3, fy - 2, fx + tw + 2, fy + 6, stone_d)
for i, ch in enumerate(text):
    for r, row in enumerate(FONT[ch]):
        for c, bit in enumerate(row):
            if bit == "1": px[fx + i * 4 + c, fy + r] = hexc("#f3e2b0")

# portico columns
col, col_d = hexc("#d8d0bc"), hexc("#9a9282")
for i in range(6):
    cx = 102 + i * 23
    rect(cx, TOP + 12, cx + 8, BASE - 4, col)
    rect(cx + 6, TOP + 12, cx + 8, BASE - 4, col_d)
    rect(cx - 1, TOP + 10, cx + 9, TOP + 11, stone_l)
    rect(cx - 1, BASE - 4, cx + 9, BASE - 3, stone_l)
    for yy in range(TOP + 13, BASE - 4, 3): px[cx + 3, yy] = col_d
# doors between the middle columns
rect(150, 100, 170, BASE - 4, hexc("#22302a")); rect(159, 100, 160, BASE - 4, INK); px[156, 124] = hexc("#d9b45a"); px[163, 124] = hexc("#d9b45a")
rect(148, 96, 172, 99, stone_l)

# windows on the wings: gaslight in some, dark in others
lit, lit2, dark = hexc("#e7c86a"), hexc("#b8892a"), hexc("#2a3440")
for wx in list(range(42, 92, 14)) + list(range(232, 282, 14)):
    for wy in (64, 92, 120):
        on = rnd.random() < 0.55
        rect(wx - 1, wy - 1, wx + 8, wy + 15, INK)
        for y in range(wy, wy + 15):
            for xx in range(wx, wx + 8):
                px[xx, y] = dither(xx, y, lit2, lit, 0.6) if on else dark
        rect(wx + 3, wy, wx + 4, wy + 14, INK); rect(wx, wy + 7, wx + 7, wy + 7, INK)
        rect(wx - 2, wy + 15, wx + 9, wy + 16, stone_l)
        if on:  # glow on the stone below
            for y in range(wy + 17, wy + 21):
                for xx in range(wx - 2, wx + 10):
                    if (xx + y) % 2 == 0: px[xx, y] = mix(px[xx, y], lit, 0.25)
# outline of the building
for y in range(TOP - 5, BASE + 1):
    px[L - 4, y] = INK; px[R + 4, y] = INK

# steps
for i, y in enumerate(range(BASE, BASE + 9, 3)):
    rect(96 - i * 6, y, 224 + i * 6, y + 2, mix(stone_l, stone_d, i / 3))
    rect(96 - i * 6, y + 2, 224 + i * 6, y + 2, stone_d)

# street and cobbles
for y in range(BASE + 9, H):
    for xx in range(W):
        c = hexc("#3a3634") if ((xx // 5 + (y // 3) % 2 * 2) % 2) else hexc("#46413c")
        if y % 3 == 0 or (xx + (y // 3) * 2) % 5 == 0: c = hexc("#2a2624")
        px[xx, y] = c

# railings
for xx in range(20, 300, 4):
    if 92 <= xx <= 228: continue
    rect(xx, BASE - 2, xx, BASE + 12, INK); px[xx, BASE - 3] = hexc("#5a5650")
rect(20, BASE + 1, 92, BASE + 1, INK); rect(228, BASE + 1, 300, BASE + 1, INK)

# gas lamps with halos
def lamp(lx):
    rect(lx, 104, lx + 1, BASE + 14, INK); rect(lx - 2, BASE + 12, lx + 3, BASE + 14, INK)
    rect(lx - 3, 96, lx + 4, 103, INK); rect(lx - 2, 97, lx + 3, 102, hexc("#ffe08a"))
    for y in range(80, 122):
        for xx in range(lx - 22, lx + 24):
            d = ((xx - lx) ** 2 + (y - 99) ** 2) ** 0.5
            if 5 < d < 22 and 0 <= xx < W and BAYER[y % 4][xx % 4] < (22 - d) * 0.9:
                px[xx, y] = mix(px[xx, y], hexc("#ffe08a"), 0.3)
lamp(14); lamp(304)

# the queue: small figures waiting on the steps and pavement
coats = ["#3a3a46", "#5a3d2a", "#2c3a5a", "#4a4038", "#6a4a5a", "#2a2a2a", "#5a5a40"]
fig_x = [70, 79, 87, 96, 104, 113, 123]
for i, fx0 in enumerate(fig_x):
    base_y = BASE + 14 if fx0 < 96 else BASE + 7
    coat = hexc(coats[i % len(coats)])
    hat = rnd.choice(["top", "bonnet", "cap", "none"])
    rect(fx0, base_y - 9, fx0 + 4, base_y, coat)            # body
    rect(fx0 + 1, base_y - 12, fx0 + 3, base_y - 10, hexc("#e2c0a0"))  # face
    if hat == "top": rect(fx0, base_y - 17, fx0 + 4, base_y - 13, INK); rect(fx0 - 1, base_y - 13, fx0 + 5, base_y - 13, INK)
    elif hat == "bonnet": rect(fx0, base_y - 14, fx0 + 4, base_y - 12, hexc("#8a7a9e")); px[fx0, base_y - 11] = hexc("#8a7a9e")
    elif hat == "cap": rect(fx0, base_y - 14, fx0 + 4, base_y - 13, hexc("#4a4038"))
    else: rect(fx0 + 1, base_y - 13, fx0 + 3, base_y - 13, hexc("#3a2a1a"))
    for y in range(base_y - 17, base_y + 1):  # outline left/right
        for xx in (fx0 - 1, fx0 + 5):
            if px[xx, y] != INK and (px[xx + 1, y] != px[xx, y] if xx < fx0 else px[xx - 1, y] != px[xx, y]): pass

# fog: a pale band drifting across the bottom of the building
for y in range(118, 168):
    t = 1 - abs(y - 146) / 26
    for xx in range(W):
        wave = 0.5 + 0.5 * __import__("math").sin(xx / 17 + y / 9)
        if BAYER[y % 4][xx % 4] < t * 7 * wave:
            px[xx, y] = mix(px[xx, y], hexc("#b8b4a4"), 0.35)

img.save("src/assets/facade.png")
print("ok")
