"""
Pixel art for "Emma: The Matchmaker of Bramblewick", v2.
Run:  python3 tools/emma-art/gen.py

Uses the same kit as the Experience map (kit.py): an evening village with lanterns,
winding roads, trees in clumps, a pond and sheep. Writes:
  public/emma/village.png, ball.png, room-*.png, bust-*.png, p-*.png, pn-*.png, emma-walk.png
  components/games/emma/layout.ts  (every tap target and every road, in map pixels)
"""
import json, math, os, random, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
import kit
from kit import R, P, img, finish, outline, mul, night, halo, lantern, window, bricks
import busts

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "emma")
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    if f.endswith(".png"):
        os.remove(os.path.join(OUT, f))

OUTL = kit.OUTL
WHITE = kit.WHITE
BRICK, BRICKD, BRICKL = (172, 84, 62, 255), (132, 58, 44, 255), (198, 112, 84, 255)
STRAW, STRAWD = (232, 200, 110, 255), (196, 160, 70, 255)

# ================================================================ people (14 x 22, Experience style)
PEOPLE = {
    "georgiana": dict(hair=(216, 162, 74, 255), style="bun", top=(228, 87, 122, 255), dress=True, hat="feather"),
    "eleanor": dict(hair=(90, 58, 40, 255), style="bun", top=(79, 127, 208, 255), dress=True, hat="cap", acc="book"),
    "clara": dict(hair=(34, 22, 28, 255), style="bun", top=(122, 74, 138, 255), dress=True, hat="widehat"),
    "kitty": dict(hair=(242, 200, 74, 255), style="long", top=(242, 210, 90, 255), dress=True, hat="ribbon", acc="posy"),
    "fenwick": dict(hair=(122, 74, 36, 255), style="short", top=(36, 64, 122, 255), pants=(230, 226, 214, 255), hat="bicorne", acc="epaulette"),
    "hale": dict(hair=(42, 34, 40, 255), style="short", top=(42, 42, 52, 255), pants=(42, 42, 52, 255), acc="bands"),
    "brampton": dict(hair=(154, 90, 42, 255), style="short", top=(90, 122, 58, 255), pants=(110, 80, 50, 255), hat="straw", acc="kerchief"),
    "ravel": dict(hair=(58, 36, 24, 255), style="short", top=(31, 122, 122, 255), pants=(226, 210, 170, 255), hat="tophat"),
    "emma": dict(hair=(240, 192, 96, 255), style="bun", top=(154, 208, 160, 255), dress=True, hat="bonnet"),
    "nettle": dict(hair=(184, 184, 192, 255), style="bun", top=(138, 74, 154, 255), dress=True, hat="mobcap", acc="shawl"),
    "polly": dict(hair=(106, 58, 26, 255), style="bun", top=(42, 42, 42, 255), dress=True, hat="cap", acc="apron"),
    "jenkins": dict(hair=(238, 238, 238, 255), style="bald", top=(138, 106, 58, 255), pants=(90, 74, 52, 255), acc="beard"),
    "tom": dict(hair=(216, 96, 42, 255), style="short", top=(106, 90, 74, 255), pants=(74, 64, 54, 255), hat="flatcap"),
    "twine": dict(hair=(122, 106, 90, 255), style="bald", top=(106, 58, 42, 255), pants=(70, 62, 60, 255), acc="tape"),
    "penny": dict(hair=(154, 154, 168, 255), style="bun", top=(58, 90, 154, 255), dress=True, acc="specs"),
    "pemberton": dict(hair=(200, 200, 208, 255), style="bun", top=(58, 106, 74, 255), dress=True, hat="turban"),
    "pike": dict(hair=(216, 216, 216, 255), style="short", top=(184, 48, 42, 255), pants=(230, 226, 214, 255), acc="epaulette"),
    "lake": dict(hair=(184, 90, 42, 255), style="long", top=(122, 192, 224, 255), dress=True, hat="ribbon"),
    "fiddle": dict(hair=(74, 58, 58, 255), style="bald", top=(74, 58, 90, 255), pants=(50, 44, 60, 255), acc="violin"),
    # season two: three new love stories
    "sophia": dict(hair=(150, 70, 40, 255), style="long", top=(236, 236, 246, 255), dress=True, hat="ribbon", acc="book"),
    "hartley": dict(hair=(90, 70, 50, 255), style="short", top=(70, 80, 60, 255), pants=(220, 210, 180, 255), acc="kerchief"),
    "fanny": dict(hair=(110, 80, 50, 255), style="bun", top=(150, 170, 200, 255), dress=True, hat="cap", acc="cross"),
    "edmund": dict(hair=(60, 44, 30, 255), style="short", top=(40, 44, 56, 255), pants=(40, 44, 56, 255), acc="bands"),
    "kate": dict(hair=(70, 46, 30, 255), style="long", top=(220, 170, 190, 255), dress=True, hat="bonnet", acc="book"),
    "henry": dict(hair=(140, 100, 60, 255), style="short", top=(150, 60, 50, 255), pants=(226, 210, 170, 255), hat="tophat"),
    "mrslyle": dict(hair=(170, 150, 140, 255), style="bun", top=(110, 90, 130, 255), dress=True, hat="mobcap"),
    "willard": dict(hair=(40, 30, 26, 255), style="short", top=(150, 40, 50, 255), pants=(226, 210, 170, 255), hat="tophat"),
    "crawley": dict(hair=(30, 20, 20, 255), style="bun", top=(200, 60, 80, 255), dress=True, hat="feather"),
    "general": dict(hair=(220, 220, 220, 255), style="short", top=(40, 50, 100, 255), pants=(230, 226, 214, 255), acc="epaulette", hat="bicorne"),
    "thrupp": dict(hair=(200, 120, 50, 255), style="short", top=(200, 160, 60, 255), pants=(100, 80, 60, 255), hat="flatcap", acc="kerchief"),
    # Austen's own people, out for a walk
    "mrsbennet": dict(hair=(150, 110, 80, 255), style="bun", top=(200, 120, 160, 255), dress=True, hat="mobcap", acc="shawl"),
    "lizzy": dict(hair=(80, 50, 30, 255), style="bun", top=(230, 200, 140, 255), dress=True, hat="bonnet"),
    "darcy": dict(hair=(30, 22, 20, 255), style="short", top=(30, 40, 70, 255), pants=(226, 210, 170, 255), hat="tophat"),
    "collins": dict(hair=(60, 50, 40, 255), style="bald", top=(30, 30, 36, 255), pants=(30, 30, 36, 255), acc="bands"),
    "ladycath": dict(hair=(190, 190, 200, 255), style="bun", top=(110, 40, 90, 255), dress=True, hat="turban"),
    "woodhouse": dict(hair=(230, 230, 230, 255), style="bald", top=(120, 100, 80, 255), pants=(90, 80, 70, 255), acc="shawl"),
    "bates": dict(hair=(170, 170, 180, 255), style="bun", top=(160, 140, 110, 255), dress=True, hat="cap", acc="specs"),
    "knightley": dict(hair=(70, 50, 36, 255), style="short", top=(60, 80, 50, 255), pants=(226, 210, 170, 255), hat="tophat"),
    # the tutorial: Donwell Lane
    "lucy": dict(hair=(150, 90, 50, 255), style="bun", top=(230, 150, 120, 255), dress=True, hat="cap", acc="apron"),
    "anne": dict(hair=(60, 44, 40, 255), style="bun", top=(110, 110, 130, 255), dress=True, acc="book"),
    "will": dict(hair=(40, 30, 26, 255), style="short", top=(150, 100, 60, 255), pants=(60, 50, 44, 255), acc="kerchief"),
    "arthur": dict(hair=(130, 100, 70, 255), style="short", top=(80, 66, 50, 255), pants=(70, 62, 60, 255), acc="specs"),
    # anonymous dancers at the ball
    "guest-f": dict(hair=(120, 70, 40, 255), style="bun", top=(240, 236, 226, 255), dress=True, hat="ribbon"),
    "guest-m": dict(hair=(60, 40, 30, 255), style="short", top=(90, 50, 60, 255), pants=(226, 210, 170, 255)),
    "guest-f2": dict(hair=(40, 30, 30, 255), style="bun", top=(200, 150, 220, 255), dress=True),
    "guest-m2": dict(hair=(160, 120, 70, 255), style="short", top=(50, 70, 60, 255), pants=(226, 210, 170, 255)),
}


def regency(pid, frame=0, facing="down"):
    d = PEOPLE[pid]
    base = img(14, 20)
    kit.body(base, d["top"], d.get("pants", (70, 70, 80, 255)), kit.BEAMD, frame, d.get("dress", False))
    kit.head(base, d["hair"], d["style"], face="up" if facing == "up" else "down")
    im = img(14, 22)
    im.alpha_composite(base, (0, 2))
    h = d.get("hat")
    if h == "feather":
        R(im, 5, 2, 4, 2, d["hair"]); P(im, 9, 2, WHITE); P(im, 10, 1, WHITE); P(im, 11, 0, WHITE); P(im, 10, 2, (240, 200, 210, 255))
    elif h == "cap":
        R(im, 3, 2, 8, 3, WHITE); P(im, 2, 4, WHITE); P(im, 11, 4, WHITE)
    elif h == "bonnet":
        R(im, 2, 2, 10, 3, STRAW); R(im, 2, 5, 2, 4, STRAW); R(im, 10, 5, 2, 4, STRAW); R(im, 3, 4, 8, 1, (60, 150, 90, 255))
    elif h == "widehat":
        R(im, 1, 4, 12, 1, (58, 42, 62, 255)); R(im, 4, 1, 6, 3, (58, 42, 62, 255)); R(im, 4, 3, 6, 1, (106, 74, 122, 255))
    elif h == "bicorne":
        R(im, 2, 2, 10, 2, (30, 44, 90, 255)); R(im, 4, 0, 6, 2, (30, 44, 90, 255)); R(im, 2, 3, 10, 1, (242, 192, 64, 255))
    elif h == "tophat":
        R(im, 4, 0, 6, 4, (26, 26, 34, 255)); R(im, 2, 4, 10, 1, (26, 26, 34, 255)); R(im, 4, 3, 6, 1, (242, 192, 64, 255))
    elif h == "straw":
        R(im, 1, 4, 12, 1, STRAW); R(im, 4, 1, 6, 3, STRAW); R(im, 4, 3, 6, 1, (184, 64, 42, 255))
    elif h == "flatcap":
        R(im, 3, 2, 8, 2, (90, 90, 96, 255)); R(im, 3, 4, 10, 1, (66, 66, 72, 255))
    elif h == "mobcap":
        R(im, 3, 1, 8, 4, WHITE); P(im, 2, 3, WHITE); P(im, 11, 3, WHITE)
    elif h == "ribbon":
        R(im, 9, 2, 3, 2, (242, 120, 60, 255) if pid == "kitty" else WHITE)
    elif h == "turban":
        R(im, 3, 1, 8, 4, (242, 208, 64, 255)); P(im, 9, 0, WHITE); P(im, 10, 0, WHITE)
    a = d.get("acc")
    if facing != "up":
        if a == "book":
            R(im, 4, 14, 4, 3, (138, 42, 42, 255))
        if a == "posy":
            R(im, 9, 14, 2, 3, (58, 138, 58, 255)); P(im, 9, 13, (242, 90, 138, 255)); P(im, 10, 13, WHITE)
        if a == "bands":
            R(im, 6, 12, 2, 3, WHITE)
        if a == "kerchief":
            R(im, 5, 12, 4, 1, (216, 64, 42, 255))
        if a == "apron":
            R(im, 5, 14, 4, 6, WHITE)
        if a == "shawl":
            R(im, 3, 12, 8, 2, (184, 130, 200, 255))
        if a == "beard":
            R(im, 4, 8, 6, 3, d["hair"])
        if a == "tape":
            R(im, 5, 12, 1, 5, (242, 208, 64, 255)); R(im, 8, 12, 1, 5, (242, 208, 64, 255))
        if a == "specs":
            R(im, 4, 7, 2, 1, OUTL); R(im, 8, 7, 2, 1, OUTL)
        if a == "cross":
            P(im, 7, 13, (232, 150, 40, 255)); P(im, 7, 14, (232, 150, 40, 255)); P(im, 6, 13, (232, 150, 40, 255)); P(im, 8, 13, (232, 150, 40, 255))
        if a == "violin":
            R(im, 9, 13, 3, 4, (150, 80, 40, 255)); R(im, 10, 10, 1, 3, (80, 50, 30, 255))
    if a == "epaulette":
        R(im, 2, 12, 2, 1, (242, 192, 64, 255)); R(im, 10, 12, 2, 1, (242, 192, 64, 255))
    return finish(im)


PEOPLE_NIGHT = dict(k=(0.92, 0.88, 0.9), add=(10, 6, 8))
for pid in PEOPLE:
    s = regency(pid)
    s.save(os.path.join(OUT, f"p-{pid}.png"))
    night(s, **PEOPLE_NIGHT).save(os.path.join(OUT, f"pn-{pid}.png"))
# Emma walking: rows down / up / side, three frames each
walk = img(42, 66)
for r_, facing in enumerate(("down", "up", "side")):
    for c in range(3):
        walk.alpha_composite(night(regency("emma", c, facing), **PEOPLE_NIGHT), (c * 14, r_ * 22))
walk.save(os.path.join(OUT, "emma-walk.png"))
CAMEOS = ["mrsbennet", "lizzy", "darcy", "collins", "ladycath", "woodhouse", "bates", "knightley"]
for cid in CAMEOS:
    sheet = img(42, 66)
    for r_, facing in enumerate(("down", "up", "side")):
        for c in range(3):
            sheet.alpha_composite(night(regency(cid, c, facing), **PEOPLE_NIGHT), (c * 14, r_ * 22))
    sheet.save(os.path.join(OUT, f"walk-{cid}.png"))

# portraits for dialogues (the chunky busts)
for pid in busts.P:
    busts.bust(pid).save(f"bust-{pid}.png")

# ================================================================ buildings
def manor(roof=(kit.SLATE, kit.SLATED, kit.SLATEL), stone=(kit.MSTONE, kit.MSTONED, kit.MSTONEL), w=66, lanterns=2):
    rf, rfd, rfl = roof
    st, std, stl = stone
    im = img(w, 56)
    for cx in (10, w - 15):
        R(im, cx, 0, 5, 11, std)
    for i, y in enumerate(range(6, 19)):
        x0 = max(2, 9 - i // 2)
        R(im, x0, y, w - 2 * x0, 1, rf)
        for xx in range(x0, w - x0):
            if (xx + (y % 3) * 3) % 6 == 0:
                P(im, xx, y, rfd)
    R(im, 9, 6, w - 18, 1, rfl); R(im, 2, 18, w - 4, 1, rfd)
    R(im, 3, 19, w - 6, 31, st)
    for yy in range(19, 50, 5):
        R(im, 3, yy, w - 6, 1, std)
    mid = w // 2
    for i in range(7):
        R(im, mid - 8 - i * 2, 12 + i, 16 + i * 4, 1, stl)
    R(im, mid - 2, 14, 4, 3, kit.GLOW)
    for cx in (mid - 11, mid - 5, mid + 4, mid + 10):
        R(im, cx, 20, 2, 28, WHITE)
    R(im, mid - 3, 34, 6, 14, OUTL); R(im, mid - 2, 35, 4, 13, kit.GLOWD); R(im, mid - 2, 35, 4, 2, kit.GLOW)
    rng = random.Random(w)
    for wx in list(range(6, mid - 14, 7)) + list(range(mid + 13, w - 8, 7)):
        for wy in (22, 35):
            window(im, wx, wy, 5, 8, lit=rng.random() < 0.6, frame=WHITE)
    window(im, mid - 3, 22, 6, 7, frame=WHITE)
    R(im, mid - 8, 50, 16, 2, stl); R(im, mid - 10, 52, 20, 2, std); R(im, 3, 49, w - 6, 1, std)
    for tx in (0, w - 4):
        R(im, tx, 42, 4, 8, kit.TM); R(im, tx + 1, 41, 2, 1, kit.TL)
    if lanterns:
        lantern(im, mid - 7, 37, kit.GLOW); lantern(im, mid + 7, 37, kit.GLOW)
    return finish(im)


def hall():
    """The Assembly Rooms: wide, columned, lanterns strung across: there is a ball tonight."""
    im = manor(roof=(kit.ROOF, kit.ROOFD, kit.ROOFL), stone=(kit.FSTONEL, kit.FSTONE, (240, 228, 200, 255)), w=76)
    cols = (kit.LAN_R, kit.LAN_Y, kit.LAN_T, kit.LAN_P, kit.LAN_O)
    for k, x in enumerate(range(6, 72, 7)):
        y = 20 + int(3 * math.sin(math.pi * (x - 6) / 66))
        P(im, x, y - 1, OUTL)
        lantern(im, x, y, cols[k % len(cols)])
    # a banner over the door
    R(im, 30, 30, 16, 3, (184, 48, 72, 255)); R(im, 31, 31, 14, 1, (242, 192, 64, 255))
    return im


def cottage(wall="plaster", roof="thatch", w=46, extra=None, seed=1):
    rng = random.Random(seed)
    h = 46
    im = img(w, h)
    roof_h = 20
    rc = {"thatch": (kit.THATCH, kit.THATCHD, kit.THATCHL), "slate": (kit.SLATE, kit.SLATED, kit.SLATEL), "tile": (kit.ROOF, kit.ROOFD, kit.ROOFL)}[roof]
    R(im, w - 14, 0, 5, 9, kit.FSTONED if roof != "tile" else BRICKD)   # chimney
    if wall == "stone":
        bricks(im, 3, roof_h, w - 6, h - roof_h - 2, kit.FSTONE, kit.FSTONED, kit.FSTONEL, rng, row=4, joint=7)
    elif wall == "brick":
        bricks(im, 3, roof_h, w - 6, h - roof_h - 2, BRICK, BRICKD, BRICKL, rng, row=3, joint=5)
    else:
        R(im, 3, roof_h, w - 6, h - roof_h - 2, kit.PLASTER)
        for xx in (3, w // 2 - 1, w - 5):
            R(im, xx, roof_h, 2, h - roof_h - 2, kit.BEAM)
        R(im, 3, roof_h + 11, w - 6, 1, kit.BEAMD)
    for i, y in enumerate(range(3, roof_h + 2)):
        x0 = max(1, 12 - i)
        R(im, x0, y, w - 2 * x0, 1, rc[0])
        for xx in range(x0, w - x0):
            r = rng.random()
            if roof == "thatch":
                if r < 0.2: P(im, xx, y, rc[1])
                elif r < 0.3: P(im, xx, y, rc[2])
            elif (xx + (y % 2) * 3) % 5 == 0:
                P(im, xx, y, rc[1])
    R(im, 1, roof_h, w - 2, 2, rc[1])
    window(im, 7, roof_h + 5, 8, 7, frame=WHITE)
    window(im, w - 15, roof_h + 5, 8, 7, frame=WHITE)
    dx = w // 2 - 4
    R(im, dx, h - 16, 9, 14, kit.BEAMD); R(im, dx + 1, h - 15, 7, 13, kit.DOORG); P(im, dx + 6, h - 9, kit.GLOWL)
    R(im, 2, h - 2, w - 4, 2, kit.FSTONED)
    lantern(im, dx - 3, h - 15, kit.GLOW)
    if extra == "bell":       # a little bell-cote: the vicarage stands by the church path
        R(im, w // 2 - 3, 0, 6, 6, kit.FSTONEL); R(im, w // 2 - 1, 2, 2, 3, (242, 192, 64, 255)); R(im, w // 2 - 4, 0, 8, 1, kit.SLATED)
    if extra == "cupola":     # the school bell
        R(im, 8, 0, 7, 6, WHITE); R(im, 10, 2, 3, 3, (242, 192, 64, 255)); R(im, 7, 0, 9, 1, kit.ROOFD)
    if extra == "letter":     # post office sign
        R(im, w - 9, roof_h + 14, 8, 6, WOODL := (178, 128, 76, 255)); R(im, w - 8, roof_h + 15, 6, 4, WHITE); P(im, w - 6, roof_h + 16, (196, 58, 48, 255)); P(im, w - 5, roof_h + 16, (196, 58, 48, 255))
    if extra == "bread":      # a baker's sign: a loaf
        R(im, w - 10, roof_h + 13, 9, 6, (178, 128, 76, 255)); R(im, w - 9, roof_h + 14, 7, 4, (230, 180, 100, 255)); R(im, w - 8, roof_h + 14, 1, 4, (190, 130, 60, 255)); R(im, w - 5, roof_h + 14, 1, 4, (190, 130, 60, 255))
    if extra == "forge":      # an open forge glowing at the side, and an anvil
        R(im, 4, h - 14, 10, 12, OUTL); R(im, 5, h - 13, 8, 11, kit.FIRE1); R(im, 6, h - 10, 6, 6, kit.FIRE2); R(im, 7, h - 8, 4, 3, kit.FIRE3)
        R(im, w - 12, h - 7, 9, 3, (70, 68, 86, 255)); R(im, w - 10, h - 4, 5, 3, (70, 68, 86, 255))
    if extra == "doctor":     # a brass plate and a bay window
        R(im, dx + 9, h - 12, 3, 2, (242, 192, 64, 255))
    if extra == "flowers":
        for wx in (7, w - 15):
            R(im, wx, roof_h + 12, 8, 2, (160, 60, 80, 255))
            for k in range(0, 8, 2):
                P(im, wx + k, roof_h + 11, (230, 120, 160, 255))
    return finish(im)


def townhouse(wall="brick", w=44, seed=5, roof="tile"):
    rng = random.Random(seed)
    h = 52
    im = img(w, h)
    rc = {"slate": (kit.SLATE, kit.SLATED, kit.SLATEL), "tile": (kit.ROOF, kit.ROOFD, kit.ROOFL)}[roof]
    for cx in (4, w - 9):
        R(im, cx, 0, 5, 8, BRICKD)
    for y in range(5, 14):
        R(im, 2, y, w - 4, 1, rc[0])
        for xx in range(2, w - 2):
            if (xx + (y % 2) * 2) % 4 == 0:
                P(im, xx, y, rc[1])
    R(im, 2, 5, w - 4, 1, rc[2]); R(im, 1, 13, w - 2, 1, rc[1])
    if wall == "brick":
        bricks(im, 3, 14, w - 6, h - 16, BRICK, BRICKD, BRICKL, rng, row=3, joint=5)
    else:
        bricks(im, 3, 14, w - 6, h - 16, kit.MSTONE, kit.MSTONED, kit.MSTONEL, rng, row=5, joint=9)
    for wy in (17, 29):
        for wx in (7, w - 13):
            window(im, wx, wy, 6, 8, lit=rng.random() < 0.7, frame=WHITE)
    window(im, w // 2 - 3, 17, 6, 8, frame=WHITE)
    R(im, w // 2 - 5, h - 15, 10, 1, WHITE); R(im, w // 2 - 4, h - 14, 8, 12, OUTL); R(im, w // 2 - 3, h - 13, 6, 11, (40, 60, 110, 255))
    P(im, w // 2 + 1, h - 8, kit.GLOWL)
    R(im, 2, h - 2, w - 4, 2, kit.MSTONED)
    lantern(im, w // 2 - 7, h - 14, kit.GLOW)
    return finish(im)


def inn():
    return kit.inn()


def farm():
    return kit.farm()


def drapery():
    """Twine's: a draper's market stalls, ribbons hung out to show."""
    return kit.market()


def abbey():
    """Abbey House: grey stone, pointed windows and a little tower. Very gothic. Kate is thrilled."""
    im = manor(roof=(kit.SLATE, kit.SLATED, kit.SLATEL), stone=((150, 146, 160, 255), (118, 114, 130, 255), (176, 172, 186, 255)))
    tower = img(16, 40)
    R(tower, 0, 6, 16, 34, (150, 146, 160, 255)); R(tower, 12, 6, 4, 34, (118, 114, 130, 255))
    for x in range(0, 16, 4): R(tower, x, 2, 2, 4, (150, 146, 160, 255))
    R(tower, 5, 14, 6, 10, OUTL); R(tower, 6, 16, 4, 8, kit.GLOWD); R(tower, 7, 15, 2, 1, kit.GLOWD)
    tower = finish(tower)
    out = img(im.width + 8, im.height)
    out.alpha_composite(im, (8, 0))
    out.alpha_composite(tower, (0, out.height - 40))
    return out

def library():
    im = townhouse("stone", 46, seed=8, roof="slate")
    R(im, 34, 22, 10, 8, OUTL); R(im, 35, 23, 8, 6, (138, 42, 42, 255)); R(im, 36, 24, 6, 1, (242, 210, 120, 255))
    R(im, 39, 20, 1, 2, OUTL)
    return im

BUILD = {
    "hartfield": lambda: manor(roof=(kit.SLATE, kit.SLATED, kit.SLATEL)),
    "ashby": lambda: manor(roof=((150, 60, 90, 255), (112, 40, 66, 255), (182, 90, 120, 255)), stone=((240, 222, 226, 255), (210, 190, 196, 255), (252, 240, 242, 255))),
    "vicarage": lambda: cottage("stone", "slate", 46, "bell", seed=2),
    "pryce": lambda: townhouse("brick", 44, seed=3, roof="slate"),
    "whitlock": lambda: townhouse("stone", 46, seed=4, roof="slate"),
    "school": lambda: cottage("plaster", "thatch", 56, "cupola", seed=5),
    "inn": inn,
    "draper": drapery,
    "post": lambda: cottage("brick", "tile", 42, "letter", seed=7),
    "assembly": hall,
    "farm": farm,
    "abbey": abbey,
    "library": library,
    "grange": lambda: manor(roof=(kit.ROOF, kit.ROOFD, kit.ROOFL), stone=((214, 196, 160, 255), (184, 164, 126, 255), (232, 218, 186, 255))),
    "lyle": lambda: cottage("plaster", "thatch", 44, "flowers", seed=31),
    "cleve": lambda: cottage("stone", "slate", 48, None, seed=32),
}
SPRITE_NIGHT = dict(k=(0.84, 0.78, 0.82), add=(18, 10, 14))
SPR = {k: night(f(), **SPRITE_NIGHT) for k, f in BUILD.items()}

# ================================================================ maps (village + tutorial lane)
def kit_seg(a, b, step=2):
    (x0, y0), (x1, y1) = a, b
    n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
    return [(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n) for i in range(n + 1)]

def kit_paste(im, s, x, y):
    for yy in range(s.height):
        for xx in range(s.width):
            px = s.getpixel((xx, yy))
            if px[3] and 0 <= x + xx < im.width and 0 <= y + yy < im.height:
                im.putpixel((x + xx, y + yy), px)

def doors(places, sprites, extra):
    n = {}
    for k, (x, y) in places.items():
        s = sprites[k]
        n[k] = [x + s.width // 2, y + s.height + 4]
    n.update(extra)
    return n

# --- the village: bigger than one screen. Hartfield in the middle, everyone else scattered around it
VILLAGE = dict(
    name="village", W=320, H=560, night=True, seed=7,
    places={
        "abbey": (4, 8), "vicarage": (92, 24), "assembly": (150, 8), "ashby": (250, 10),
        "library": (8, 110), "pryce": (72, 126), "whitlock": (266, 106),
        "grange": (186, 198), "hartfield": (112, 212), "inn": (6, 216), "lyle": (268, 246),
        "school": (8, 300), "draper": (190, 312),
        "post": (8, 392), "cleve": (266, 394),
        "farm": (200, 474),
    },
    junctions={
        "jW1": [60, 90], "jN1": [145, 90], "jE1": [256, 90],
        "jW2": [60, 190], "jN2": [145, 190], "jE2": [256, 190],
        "jW3": [60, 292], "jC": [145, 292], "jE3": [256, 292],
        "green": [145, 334],
        "jW4": [60, 382], "jS1": [145, 382], "jE4": [256, 382],
        "jP": [60, 452], "jC2": [256, 452], "jS2": [145, 462], "jF2": [186, 542],
    },
    folk={"nettle": (110, 312), "polly": (166, 312), "jenkins": (110, 342), "tom": (166, 342)},
    edges=[
        ["abbey", "jW1"], ["jW1", "jN1"], ["jN1", "vicarage"], ["jN1", "assembly"], ["jN1", "jE1"], ["jE1", "ashby"],
        ["jW1", "jW2"], ["jN1", "jN2"], ["jE1", "jE2"],
        ["jW2", "library"], ["jW2", "pryce"], ["jW2", "jN2"], ["jN2", "jE2"], ["jE2", "whitlock"],
        ["jW2", "jW3"], ["jE2", "jE3"],
        ["jW3", "inn"], ["jW3", "jC"], ["jC", "hartfield"], ["jC", "jE3"], ["jE3", "grange"], ["jE3", "lyle"],
        ["jC", "green"], ["green", "nettle"], ["green", "polly"], ["green", "jenkins"], ["green", "tom"], ["green", "jS1"],
        ["jW3", "jW4"], ["jE3", "jE4"], ["jW4", "school"], ["jW4", "jS1"], ["jS1", "jE4"], ["jE4", "draper"],
        ["jW4", "jP"], ["jP", "post"], ["jE4", "jC2"], ["jC2", "cleve"],
        ["jS1", "jS2"], ["jS2", "jF2"], ["jF2", "farm"],
    ],
    green=(145, 334, 20), pond=(196, 128, 22, 10), meadow=(24, 474, 140, 552),
    sheep=[(40, 490), (64, 500), (90, 520), (54, 532), (110, 496)], hay=[(120, 530)],
    strings=[[[110, 312], [180, 312]], [[110, 354], [180, 354]], [[84, 290], [110, 312]], [[180, 312], [206, 290]]],
    clumps=[(70, 90, 0, 22), (226, 248, 0, 30), (0, 40, 70, 104), (110, 140, 104, 176), (224, 262, 104, 170), (0, 56, 176, 212),
            (292, 320, 180, 244), (66, 108, 196, 264), (0, 30, 352, 392), (64, 120, 392, 456), (160, 250, 390, 460),
            (0, 24, 456, 560), (260, 320, 456, 560), (150, 196, 470, 540), (290, 320, 300, 390), (100, 140, 140, 196)],
    flies=[(30, 520), (300, 470), (60, 60), (300, 200), (100, 420), (220, 420), (150, 150)],
    spots={"willow": (162, 102, 22, 28), "reeds": (214, 128, 14, 10)},
    beds=True,
)

# --- the tutorial lane: a small sunny afternoon
LANE = dict(
    name="lane", W=176, H=224, night=False, seed=11,
    places={"bakery": (4, 10), "smithy": (126, 6), "hartfield": (55, 74), "school2": (4, 150), "cottage": (126, 152)},
    # the lane runs round Hartfield, never through it: up the west side and the east side, and Emma's
    # front door is reached from the green in front of the house
    junctions={"top": [88, 64], "nw": [40, 64], "ne": [140, 64], "mid": [88, 142], "west": [40, 142], "east": [140, 142]},
    folk={"jenkins": (100, 112)},
    edges=[["bakery", "nw"], ["nw", "top"], ["top", "ne"], ["ne", "smithy"], ["nw", "west"], ["ne", "east"],
           ["west", "mid"], ["mid", "east"], ["mid", "hartfield"], ["west", "school2"], ["east", "cottage"], ["mid", "jenkins"]],
    green=(88, 142, 12), pond=(20, 110, 11, 6), meadow=None, sheep=[(60, 200), (100, 206)], hay=[],
    strings=[], clumps=[(64, 112, 0, 20), (0, 20, 80, 104), (156, 176, 80, 120), (60, 116, 196, 224), (0, 30, 200, 224)],
    flies=[], spots={}, beds=True,
)

def blossom(rng, big=False):
    """A tree in blossom: pink and white instead of green."""
    t = kit.tree(rng, big)
    px = t.load()
    PINK = [(244, 170, 196, 255), (250, 204, 222, 255), (226, 136, 170, 255), (255, 236, 244, 255)]
    greens = {kit.TD[:3], kit.TM[:3], kit.TL[:3], kit.TH[:3]}
    for y in range(t.height):
        for x in range(t.width):
            c = px[x, y]
            if c[3] and c[:3] in greens:
                px[x, y] = PINK[(x * 7 + y * 3 + rng.randrange(0, 2)) % 4]
    return t

def willow():
    im = img(22, 28)
    R(im, 9, 14, 3, 14, kit.TRUNK); R(im, 11, 14, 1, 14, kit.TRUNKD)
    R(im, 3, 2, 16, 6, kit.TM); R(im, 1, 5, 20, 4, kit.TM)
    rng = random.Random(5)
    for x in range(1, 21):
        top = 3 if 3 < x < 18 else 6
        length = 12 + rng.randrange(0, 8) - abs(x - 10) // 3
        for y in range(top, min(27, top + length)):
            if (x + y) % 2 == 0 or rng.random() < 0.6:
                P(im, x, y, rng.choice((kit.TL, kit.TM, kit.TH)) if y < top + length - 2 else kit.TD)
    return finish(im)

def reeds():
    im = img(14, 12)
    for x in (1, 4, 6, 9, 12):
        R(im, x, 3 + (x % 3), 1, 9 - (x % 3), (70, 130, 60, 255))
        R(im, x, 1 + (x % 3), 1, 3, (120, 80, 40, 255))
    P(im, 5, 9, (220, 220, 240, 255)); P(im, 6, 9, (200, 220, 240, 255))   # a glint of glass
    return finish(im)

def draw_map(M, sprites):
    rng = random.Random(M["seed"])
    W, H = M["W"], M["H"]
    folk_nodes = {k: [x + 7 + (12 if x < M["green"][0] else -12), y + 24] for k, (x, y) in M["folk"].items()}
    nodes = doors(M["places"], sprites, {**M["junctions"], **folk_nodes})
    im = Image.new("RGBA", (W, H), kit.G2)
    for y in range(H):
        for x in range(W):
            r = rng.random()
            if r < 0.18: im.putpixel((x, y), kit.G1)
            elif r < 0.28: im.putpixel((x, y), kit.G3)
            elif r < 0.31: im.putpixel((x, y), kit.G4)
    keep = []
    if M["meadow"]:
        mx0, my0, mx1, my1 = M["meadow"]
        for _ in range((mx1 - mx0) * (my1 - my0) // 14):
            P(im, rng.randrange(mx0, mx1), rng.randrange(my0, my1), rng.choice(((250, 250, 240, 255), (240, 214, 90, 255), (230, 150, 190, 255), kit.G3)))
        for xx in range(mx0, mx1):
            P(im, xx, my0 - 1, kit.WOODL); P(im, xx, my0 + 2, kit.WOOD)
        for xx in range(mx0, mx1, 6):
            R(im, xx, my0 - 3, 1, 7, kit.WOODD)
        for yy in range(my0, my1):
            if yy % 6 == 0:
                R(im, mx0, yy, 1, 4, kit.WOODD); R(im, mx1 - 1, yy, 1, 4, kit.WOODD)
        keep.append((mx0 - 2, my0 - 4, mx1 + 2, my1))
    cx, cy, rx, ry = M["pond"]
    for y in range(cy - ry - 2, cy + ry + 3):
        for x in range(cx - rx - 3, cx + rx + 4):
            d = ((x - cx) / (rx + 2)) ** 2 + ((y - cy) / (ry + 2)) ** 2
            e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if e <= 1: P(im, x, y, kit.W1 if rng.random() > 0.12 else kit.W2)
            elif d <= 1: P(im, x, y, kit.SAND)
    for _ in range(rx):
        R(im, cx + rng.randrange(-rx + 3, rx - 3), cy + rng.randrange(-ry + 2, ry - 1), 3, 1, kit.W3)
    for (dx, dy) in ((-rx // 2, -2), (rx // 3, 2)):
        R(im, cx + dx, cy + dy, 3, 2, (70, 140, 60, 255)); P(im, cx + dx + 1, cy + dy, (230, 230, 240, 255))
    R(im, cx - 3, cy, 3, 2, WHITE); P(im, cx, cy - 1, (60, 120, 70, 255)); P(im, cx + 1, cy - 1, (240, 170, 60, 255))
    keep.append((cx - rx - 4, cy - ry - 6, cx + rx + 4, cy + ry + 4))
    dirt = set()
    def brush(px_, py_, r):
        for yy in range(int(py_ - r) - 1, int(py_ + r) + 2):
            for xx in range(int(px_ - r) - 1, int(px_ + r) + 2):
                if (xx - px_) ** 2 + (yy - py_) ** 2 <= r * r and 0 <= xx < W and 0 <= yy < H:
                    dirt.add((xx, yy))
    for a, b in M["edges"]:
        for (x, y) in kit_seg(nodes[a], nodes[b]):
            brush(x, y, 4.2)
            keep.append((x - 7, y - 7, x + 7, y + 7))
    gx, gy, gr = M["green"]
    brush(gx, gy, gr)
    keep.append((gx - gr - 4, gy - gr - 4, gx + gr + 4, gy + gr + 4))
    for (x, y) in dirt:
        r = rng.random()
        im.putpixel((x, y), kit.DIRT2 if r < 0.15 else kit.DIRT3 if r < 0.22 else kit.DIRT)
    for (x, y) in dirt:
        if (x, y + 1) not in dirt: im.putpixel((x, y), kit.DIRTE)
        elif (x, y - 1) not in dirt or (x - 1, y) not in dirt or (x + 1, y) not in dirt: im.putpixel((x, y), kit.DIRT2)
    for _ in range(len(dirt) // 40):
        x, y = rng.choice(sorted(dirt)); P(im, x, y, kit.STL)
    for pid, (x, y) in M["places"].items():
        s = sprites[pid]
        R(im, x + 2, y + s.height - 2, s.width - 2, 3, kit.G4)
        keep.append((x - 2, y - 10, x + s.width + 2, y + s.height + 3))
    for k, (x, y) in M["folk"].items():
        keep.append((x - 4, y - 4, x + 18, y + 26))
    def free(x0, y0, x1, y1):
        return not any(x0 < kx1 and x1 > kx0 and y0 < ky1 and y1 > ky0 for kx0, ky0, kx1, ky1 in keep)
    deco = []
    def add(s, x, y, block=True):
        deco.append((y + s.height, s, x, y))
        if block: keep.append((x - 1, y - 1, x + s.width + 1, y + s.height + 1))
    if gr >= 16:
        add(kit.well(), gx - 8, gy - 12)
    for (hx, hy) in M["hay"]:
        add(kit.haystack(), hx, hy)
    for (sx, sy) in M["sheep"]:
        sh = kit.sheep()
        add(sh if rng.random() < 0.5 else sh.transpose(Image.FLIP_LEFT_RIGHT), sx, sy, block=False)
    for a, b in M["strings"]:
        for (x, y) in (a, b):
            keep.append((x - 4, y - 4, x + 4, y + 18))
    placed = []
    for (x0, x1, y0, y1) in M["clumps"]:
        for _ in range(max(6, (x1 - x0) * (y1 - y0) // 45)):
            big = rng.random() < 0.45
            tw, th = (18, 22) if big else (14, 18)
            tx = rng.randrange(x0 - 4, max(x0 - 3, x1 - tw + 4))
            ty = rng.randrange(y0 - 6, max(y0 - 5, y1 - th + 2))
            if free(tx + 2, ty + th - 8, tx + tw - 2, ty + th) and all(abs(tx - px) > 7 or abs(ty - py) > 7 for px, py in placed):
                tr = blossom(rng, big) if M.get("beds") and rng.random() < 0.28 else kit.tree(rng, big)
                deco.append((ty + th, tr, tx, ty)); placed.append((tx, ty))
    for _ in range(W * H // 900):
        bx, by = rng.randrange(0, W - 10), rng.randrange(0, H - 7)
        if free(bx, by, bx + 10, by + 7):
            add(kit.bush(rng), bx, by)
    if M.get("beds"):
        # flower beds either side of every front door, and wild flowers along the paths
        PETALS = [(250, 236, 244, 255), (240, 150, 190, 255), (250, 214, 90, 255), (200, 120, 220, 255), (255, 170, 120, 255)]
        for pid, (x, y) in M["places"].items():
            sp = sprites[pid]
            dx, dy = x + sp.width // 2, y + sp.height
            for side in (-1, 1):
                bx0 = dx + side * 9 - (8 if side < 0 else 0)
                for yy in range(dy - 1, dy + 3):
                    for xx in range(bx0, bx0 + 9):
                        if 0 <= xx < W and 0 <= yy < H and (xx, yy) not in dirt:
                            P(im, xx, yy, (60, 104, 46, 255) if (xx + yy) % 3 else (74, 126, 54, 255))
                for _ in range(7):
                    xx, yy = bx0 + rng.randrange(0, 9), dy - 1 + rng.randrange(0, 4)
                    if (xx, yy) not in dirt: P(im, xx, yy, rng.choice(PETALS))
        for _ in range(W * H // 160):
            x, y = rng.randrange(0, W), rng.randrange(0, H)
            if (x, y) not in dirt and free(x, y, x + 1, y + 1):
                P(im, x, y, rng.choice(PETALS))
    for sid, (sx, sy, sw, sh_) in M.get("spots", {}).items():
        art = willow() if sid == "willow" else reeds()
        add(art, sx, sy)
    for _, s_, x, y in sorted(deco, key=lambda d: d[0]):
        kit_paste(im, s_, x, y)
    if M["night"]:
        # a warm, late-spring evening rather than a cold night
        im = night(im, k=(0.82, 0.76, 0.8), add=(22, 12, 18))
        for pid, (x, y) in M["places"].items():
            s = sprites[pid]
            halo(im, x + s.width / 2, y + s.height + 2, 16, kit.WARM, 0.45)
        halo(im, gx, gy, 24, (255, 190, 110), 0.35)
    colours = [kit.LAN_R, kit.LAN_O, kit.LAN_Y, kit.LAN_P, kit.LAN_T]
    for si, (a, b) in enumerate(M["strings"]):
        for (x, y) in (a, b):
            R(im, x, y, 1, 16, (40, 28, 24, 255)); P(im, x, y - 1, (70, 50, 40, 255))
        n = int(math.hypot(b[0] - a[0], b[1] - a[1]))
        sag = 3 + n // 14
        pts = [(round(a[0] + (b[0] - a[0]) * i / n), round(a[1] + (b[1] - a[1]) * i / n + sag * math.sin(math.pi * i / n))) for i in range(n + 1)]
        for (x, y) in pts: P(im, x, y, (30, 22, 30, 255))
        for (x, y) in pts[4:-3:7]: halo(im, x, y + 2, 7, kit.WARM, 0.45)
        for k, (x, y) in enumerate(pts[4:-3:7]): lantern(im, x, y + 1, colours[(k + si) % len(colours)])
    for (fx, fy) in M["flies"]:
        for _ in range(3):
            x, y = fx + rng.randrange(-10, 10), fy + rng.randrange(-8, 8)
            halo(im, x, y, 3, (200, 255, 120), 0.5); P(im, x, y, kit.FLY)
    for pid, (x, y) in sorted(M["places"].items(), key=lambda kv: kv[1][1]):
        kit_paste(im, sprites[pid], x, y)
    im.save(os.path.join(OUT, f"{M['name']}.png"))
    return {
        "w": W, "h": H,
        "places": {k: {"x": x, "y": y, "w": sprites[k].width, "h": sprites[k].height, "node": k} for k, (x, y) in M["places"].items()},
        "folk": {k: {"x": x, "y": y, "w": 14, "h": 22, "node": k} for k, (x, y) in M["folk"].items()},
        "nodes": nodes, "edges": M["edges"], "start": "hartfield",
        "spots": {k: {"x": x, "y": y, "w": w, "h": h} for k, (x, y, w, h) in M.get("spots", {}).items()},
    }

LANE_SPR = {
    "bakery": cottage("plaster", "tile", 50, "bread", seed=21),
    "smithy": cottage("stone", "slate", 46, "forge", seed=22),
    "hartfield": manor(roof=(kit.SLATE, kit.SLATED, kit.SLATEL), lanterns=0),
    "school2": cottage("plaster", "thatch", 50, "cupola", seed=23),
    "cottage": cottage("stone", "thatch", 46, "flowers", seed=24),
}
MAPS = {"village": draw_map(VILLAGE, SPR), "lane": draw_map(LANE, LANE_SPR)}


# ================================================================ the ball (seen from above)
BW, BH = 192, 168
FLOOR1, FLOOR2 = (196, 150, 96, 255), (176, 128, 80, 255)
def draw_ball():
    im = Image.new("RGBA", (BW, BH), FLOOR1)
    for y in range(BH):
        for x in range(BW):
            if ((x // 8) + (y // 8)) % 2: im.putpixel((x, y), FLOOR2)
            if (x % 8 == 0) or (y % 8 == 0): im.putpixel((x, y), mul(FLOOR2, 0.92))
    # walls: the far wall with tall windows, side walls
    WALL, WALLD = (232, 214, 186, 255), (200, 180, 150, 255)
    R(im, 0, 0, BW, 26, WALL); R(im, 0, 24, BW, 2, WALLD); R(im, 0, 26, BW, 1, OUTL)
    for wx in range(14, BW - 10, 34):
        R(im, wx, 3, 14, 19, OUTL); R(im, wx + 1, 4, 12, 18, (40, 56, 110, 255)); R(im, wx + 7, 4, 1, 18, WHITE); R(im, wx + 1, 12, 12, 1, WHITE)
        P(im, wx + 4, 7, (240, 240, 210, 255))
        R(im, wx - 3, 3, 3, 20, (160, 40, 60, 255)); R(im, wx + 14, 3, 3, 20, (160, 40, 60, 255))
    R(im, 0, 26, 6, BH, WALLD); R(im, BW - 6, 26, 6, BH, WALLD); R(im, 6, 26, 1, BH, OUTL); R(im, BW - 7, 26, 1, BH, OUTL)
    # rug for the dancing
    for y in range(64, 132):
        for x in range(46, 146):
            e = ((x - 96) / 50) ** 2 + ((y - 98) / 34) ** 2
            if e <= 1: P(im, x, y, (150, 44, 60, 255) if e > 0.8 else (180, 60, 76, 255) if e > 0.55 else (196, 150, 70, 255) if e > 0.5 else (170, 56, 72, 255))
    # pianoforte in the corner, music stand
    pf = img(30, 18); R(pf, 0, 0, 30, 14, (34, 26, 30, 255)); R(pf, 2, 12, 26, 4, WHITE)
    for k in range(3, 27, 3): R(pf, k, 12, 1, 3, OUTL)
    R(pf, 2, 2, 12, 8, (60, 46, 50, 255)); kit_paste(im, finish(pf), 152, 32)
    # refreshments
    tb = img(16, 50); R(tb, 0, 0, 16, 50, WHITE); R(tb, 0, 48, 16, 2, (200, 196, 186, 255))
    R(tb, 4, 6, 8, 8, (180, 196, 220, 255)); R(tb, 5, 7, 6, 6, (210, 80, 100, 255))
    for k in range(20, 44, 7): R(tb, 4, k, 8, 4, (230, 190, 120, 255)); P(tb, 7, k, (220, 60, 80, 255))
    kit_paste(im, finish(tb), 10, 40)
    # chairs along the bottom wall, and two drawn close together by the window
    for cx_ in (18, 30, 160, 172):
        ch = img(8, 8); R(ch, 0, 0, 8, 8, (140, 90, 50, 255)); R(ch, 1, 1, 6, 6, (176, 60, 80, 255)); kit_paste(im, finish(ch), cx_, 150)
    for cx_ in (34, 44):
        ch = img(8, 8); R(ch, 0, 0, 8, 8, (140, 90, 50, 255)); R(ch, 1, 1, 6, 6, (60, 100, 170, 255)); kit_paste(im, finish(ch), cx_, 30)
    # the dance list on a little table by the door
    lt = img(14, 10); R(lt, 0, 0, 14, 10, (140, 90, 50, 255)); R(lt, 3, 2, 8, 6, (250, 246, 232, 255))
    for k in (3, 5): R(lt, 4, k, 6, 1, (150, 150, 160, 255))
    kit_paste(im, finish(lt), 54, 152)
    # door at the bottom
    R(im, 84, BH - 4, 22, 4, (120, 80, 40, 255)); R(im, 84, BH - 5, 22, 1, OUTL)
    # chandeliers from above, with light
    for (cx_, cy_) in ((64, 74), (128, 74), (96, 124)):
        halo(im, cx_, cy_, 22, (255, 220, 150), 0.3)
    for (cx_, cy_) in ((64, 74), (128, 74), (96, 124)):
        for a in range(0, 360, 45):
            x = cx_ + round(7 * math.cos(math.radians(a))); y = cy_ + round(7 * math.sin(math.radians(a)))
            R(im, x - 1, y - 1, 2, 2, kit.GLOWL)
        for a in range(0, 360, 15):
            P(im, cx_ + round(5 * math.cos(math.radians(a))), cy_ + round(5 * math.sin(math.radians(a))), (200, 160, 60, 255))
        R(im, cx_ - 1, cy_ - 1, 3, 3, (220, 180, 70, 255))
    im.save(os.path.join(OUT, "ball.png"))

draw_ball()
# who stands where in the ballroom (sprite top-left); "obs" are things to watch, not people to talk to
BALL = {
    "guests": {"pemberton": [24, 96], "pike": [160, 118], "lake": [60, 40], "fiddle": [134, 30], "crawley": [150, 74], "thrupp": [140, 140]},
    "obs": {
        "o-dance": {"people": [["georgiana", 84, 84], ["ravel", 98, 84]]},
        "o-window": {"people": [["eleanor", 34, 20], ["hale", 44, 20]]},
        "o-door": {"people": [["fenwick", 112, 138], ["clara", 22, 136]], "hot": [0]},
        "o-kitty": {"people": [["kitty", 80, 140]]},
    },
    "extras": [["guest-f", 62, 104], ["guest-m", 75, 104], ["guest-f2", 112, 110], ["guest-m2", 125, 110]],
    "items": {"ball-list": [54, 152, 14, 10]},
}

# ================================================================ rooms (inside the houses)
Canvas, rgba, shade = busts.Canvas, busts.rgba, busts.shade
RW, RH = 128, 96
WALLPAPER = {"abbey": "a8a4bc", "library": "e8d8b8", "grange": "e4d8c4", "lyle": "f4dce4", "cleve": "d0dcc8", "ashby": "f0c8d4", "vicarage": "c8ccd8", "pryce": "c8dcf0", "whitlock": "d8c8e8", "school": "f4e4b0",
             "farm": "e8d4b0", "inn": "d8b890", "draper": "bce4dc", "post": "f0dcc0",
             "bakery": "f6e2c0", "smithy": "c8beb4", "school2": "e8f0d0", "cottage": "e6dcf2"}
TYPE = {"abbey": "manor", "library": "shop", "grange": "manor", "lyle": "cottage", "cleve": "cottage", "ashby": "manor", "vicarage": "cottage", "pryce": "cottage", "whitlock": "manor", "school": "cottage",
        "farm": "cottage", "inn": "shop", "draper": "shop", "post": "shop",
        "bakery": "shop", "smithy": "cottage", "school2": "cottage", "cottage": "cottage"}
FLIP = {"pryce", "school", "draper", "cottage", "lyle", "library"}
DAYLIGHT = {"bakery", "smithy", "school2", "cottage"}
ITEM_KIND = {"pianoforte": "music", "dance-card": "paper", "cowper": "book", "sermon": "paper", "borrowed": "paper", "violets": "book",
             "old-letter": "drawer", "print": "frame", "posy": "flowers", "register": "ledger", "draft": "paper", "ribbon": "book",
             "aunt-letter": "paper", "half-letter": "scraps", "music-note": "music", "riddle-book": "book", "order-book": "ledger", "ribbon-drawer": "drawer", "letter-rack": "rack", "parcel": "parcel",
             "shawl": "shawl", "torn": "scraps", "music": "music", "desk": "drawer", "script": "paper", "workbox": "box",
             "grant-letter": "paper", "ledger": "ledger", "udolpho": "book", "chest": "trunk",
             "horseshoe": "horseshoe", "rose": "rose", "novels": "book", "novel": "book"}
ROOM_ITEMS = {"lyle": ["shawl", "torn"], "cleve": ["music", "desk"], "grange": ["script", "workbox", "grant-letter"],
              "library": ["ledger", "udolpho"], "abbey": ["chest"], "ashby": ["dance-card", "pianoforte", "music-note"], "vicarage": ["cowper", "sermon"], "pryce": ["borrowed", "violets"],
              "whitlock": ["old-letter", "print"], "school": ["posy", "register", "riddle-book"], "farm": ["draft", "ribbon"],
              "inn": ["aunt-letter", "half-letter"], "draper": ["order-book", "ribbon-drawer"], "post": ["letter-rack", "parcel"],
              "bakery": ["horseshoe"], "smithy": ["rose"], "school2": ["novels"], "cottage": ["novel"]}
ROOM_PEOPLE = {"inn": 3, "lyle": 2, "grange": 2, "abbey": 2}

def item_sprite(kind):
    s = Canvas(12, 12)
    if kind == "paper":
        s.rect(2, 2, 8, 8, rgba("fbf6e8")); s.rect(3, 4, 6, 1, rgba("9a9aa8")); s.rect(3, 6, 5, 1, rgba("9a9aa8")); s.rect(3, 8, 4, 1, rgba("9a9aa8"))
    elif kind == "book":
        s.rect(2, 3, 8, 7, rgba("8a2a2a")); s.rect(2, 3, 1, 7, rgba("5a1a1a")); s.rect(4, 5, 4, 1, rgba("f2d27a"))
    elif kind == "ledger":
        s.rect(1, 3, 10, 7, rgba("3a6a3a")); s.rect(6, 3, 1, 7, rgba("fbf6e8")); s.rect(2, 4, 3, 1, rgba("fbf6e8"))
    elif kind == "trunk":
        s.rect(1, 3, 10, 8, rgba("8a5a2a")); s.rect(1, 6, 10, 1, rgba("5a3a1a")); s.rect(5, 6, 2, 2, rgba("f2c040"))
    elif kind == "drawer":
        s.rect(1, 2, 10, 9, rgba("7a4a24")); s.rect(2, 4, 8, 2, rgba("5a3418")); s.rect(5, 4, 2, 1, rgba("f2c040")); s.rect(3, 3, 5, 1, rgba("fbf6e8"))
    elif kind == "frame":
        s.rect(1, 1, 10, 9, rgba("d8a83a")); s.rect(2, 2, 8, 7, rgba("8ac8f0")); s.rect(2, 7, 8, 2, rgba("2a5a9a")); s.rect(5, 3, 1, 4, rgba("5a3a1a")); s.rect(6, 3, 2, 3, rgba("fbf6e8"))
    elif kind == "flowers":
        s.rect(4, 7, 4, 4, rgba("8ac8f0")); s.rect(5, 4, 1, 3, rgba("3a8a3a")); s.rect(7, 4, 1, 3, rgba("3a8a3a"))
        s.set(4, 3, rgba("f25a8a")); s.set(6, 2, rgba("f2d040")); s.set(8, 3, rgba("8a5af2")); s.set(5, 2, rgba("ffffff"))
    elif kind == "rack":
        s.rect(1, 1, 10, 10, rgba("8a5a2a"))
        for yy in (2, 6):
            for xx in (2, 6):
                s.rect(xx, yy, 3, 3, rgba("5a3418")); s.rect(xx, yy + 1, 3, 2, rgba("fbf6e8"))
    elif kind == "parcel":
        s.rect(1, 3, 10, 7, rgba("c8a070")); s.rect(5, 3, 2, 7, rgba("7a5a3a")); s.rect(1, 6, 10, 1, rgba("7a5a3a"))
    elif kind == "music":
        s.rect(2, 1, 8, 10, rgba("fbf6e8")); s.rect(3, 3, 6, 1, rgba("9a9aa8")); s.rect(3, 6, 6, 1, rgba("9a9aa8")); s.rect(6, 4, 1, 4, rgba("2a1a2a")); s.rect(5, 7, 2, 1, rgba("2a1a2a"))
    elif kind == "scraps":
        for (x0, y0) in ((1, 6), (4, 8), (7, 5), (3, 3)):
            s.rect(x0, y0, 4, 2, rgba("fbf6e8"))
        s.rect(0, 10, 12, 2, rgba("3a3a40"))
    elif kind == "shawl":
        s.rect(1, 4, 10, 6, rgba("d8c8e8")); s.rect(1, 9, 10, 1, rgba("8a6a4a")); s.set(3, 6, rgba("8a6a4a")); s.set(7, 5, rgba("8a6a4a"))
        for x in range(1, 11, 2): s.set(x, 10, rgba("b8a8c8"))
    elif kind == "box":
        s.rect(1, 4, 10, 7, rgba("c8905a")); s.rect(1, 4, 10, 2, rgba("a86a3a")); s.rect(4, 7, 4, 2, rgba("f2c040")); s.set(9, 3, rgba("e8e8f0"))
    elif kind == "horseshoe":
        s.rect(2, 2, 2, 8, rgba("b8b8c8")); s.rect(8, 2, 2, 8, rgba("b8b8c8")); s.rect(3, 9, 6, 2, rgba("b8b8c8")); s.set(5, 1, rgba("f2c040"))
    elif kind == "rose":
        s.rect(5, 5, 1, 6, rgba("6a6a7a")); s.ellipse(5.5, 3.5, 2.5, 2.5, rgba("8a8a9a")); s.set(5, 3, rgba("5a5a6a")); s.rect(6, 7, 2, 1, rgba("6a6a7a"))
    s.outline()
    return s

def deco_sprite(kind):
    """A few pieces of furniture to make rooms feel lived in."""
    if kind == "piano":
        s = Canvas(30, 22); s.rect(0, 0, 30, 18, rgba("2a2026")); s.rect(2, 2, 26, 6, rgba("4a3a40")); s.rect(1, 10, 28, 3, rgba("fbf6e8"))
        for k in range(3, 28, 3): s.rect(k, 10, 1, 2, rgba("2a2026"))
        s.rect(2, 18, 2, 4, rgba("2a2026")); s.rect(26, 18, 2, 4, rgba("2a2026")); s.rect(12, 4, 6, 4, rgba("fbf6e8"))
    elif kind == "portrait":
        s = Canvas(16, 20); s.rect(0, 0, 16, 20, rgba("d8a83a")); s.rect(2, 2, 12, 16, rgba("3a4a6a")); s.ellipse(8, 8, 3, 3.5, rgba("f2d0b0")); s.rect(4, 12, 8, 6, rgba("8a2a3a"))
    elif kind == "landscape":
        s = Canvas(22, 14); s.rect(0, 0, 22, 14, rgba("a8762a")); s.rect(2, 2, 18, 10, rgba("8ac8f0")); s.rect(2, 8, 18, 4, rgba("5a9a4a")); s.ellipse(8, 8, 4, 2, rgba("3a7a3a"))
    elif kind == "clock":
        s = Canvas(10, 30); s.rect(0, 0, 10, 30, rgba("7a4a24")); s.ellipse(5, 6, 3.5, 3.5, rgba("fbf6e8")); s.set(5, 6, rgba("2a1a1a")); s.set(5, 4, rgba("2a1a1a")); s.rect(3, 14, 4, 12, rgba("5a3418")); s.rect(4, 22, 2, 2, rgba("f2c040"))
    elif kind == "plant":
        s = Canvas(12, 18); s.rect(3, 12, 6, 6, rgba("b8603a")); s.ellipse(6, 7, 5, 5, rgba("3a8a3a")); s.set(4, 5, rgba("6abc4a")); s.set(8, 8, rgba("6abc4a"))
    elif kind == "bookcase":
        s = Canvas(24, 34); s.rect(0, 0, 24, 34, rgba("6a3a1e"))
        for row in range(4):
            for i in range(5):
                s.rect(2 + i * 4, 2 + row * 8, 3, 6, rgba(("8a2a2a", "2a5a8a", "3a7a3a", "c8902a", "6a3a7a")[(i + row) % 5]))
    elif kind == "harp":
        s = Canvas(14, 28); s.rect(2, 26, 10, 2, rgba("d8a83a")); s.rect(2, 2, 2, 24, rgba("d8a83a")); s.rect(2, 2, 10, 2, rgba("d8a83a"))
        for k in range(5, 12, 2): s.rect(k, 4, 1, 22 - (k - 5), rgba("fbf6e8"))
    elif kind == "barrels":
        s = Canvas(26, 16)
        for x0 in (0, 13): s.rect(x0, 2, 12, 14, rgba("8a5a2a")); s.rect(x0, 5, 12, 1, rgba("4a4a4a")); s.rect(x0, 12, 12, 1, rgba("4a4a4a")); s.ellipse(x0 + 6, 2, 6, 2, rgba("a86a3a"))
    elif kind == "desks":
        s = Canvas(40, 14)
        for x0 in (0, 21): s.rect(x0, 0, 19, 5, rgba("8a5a2a")); s.rect(x0 + 2, 5, 2, 9, rgba("6a3a1e")); s.rect(x0 + 15, 5, 2, 9, rgba("6a3a1e")); s.rect(x0 + 4, 1, 6, 3, rgba("fbf6e8"))
    elif kind == "dog":
        s = Canvas(16, 10); s.rect(2, 4, 10, 4, rgba("8a6a4a")); s.rect(11, 1, 5, 5, rgba("8a6a4a")); s.set(14, 2, rgba("2a1a1a")); s.rect(2, 8, 2, 2, rgba("8a6a4a")); s.rect(9, 8, 2, 2, rgba("8a6a4a")); s.rect(0, 3, 2, 1, rgba("8a6a4a"))
    elif kind == "bolts":
        s = Canvas(30, 16)
        for i, col in enumerate(("c84a6a", "4a7ab8", "f2c040", "3a8a5a", "8a5af2")):
            s.rect(i * 6, 4, 5, 12, rgba(col)); s.rect(i * 6, 4, 5, 1, rgba("ffffff"))
    elif kind == "stove":
        s = Canvas(20, 22); s.rect(0, 4, 20, 18, rgba("3a3a40")); s.rect(3, 10, 14, 8, rgba("2a1a1a")); s.rect(6, 13, 8, 4, rgba("f2702a")); s.rect(8, 0, 4, 4, rgba("3a3a40"))
    s.outline()
    return s

DECOR = {  # piece, x, y (before any flip)
    "abbey": [("clock", 6, 30), ("portrait", 100, 14)],
    "library": [("bookcase", 100, 30), ("plant", 4, 50)],
    "grange": [("bookcase", 4, 28), ("portrait", 100, 14)],
    "lyle": [("piano", 2, 40), ("plant", 112, 50)],
    "cleve": [("clock", 4, 32), ("landscape", 60, 8)],
    "ashby": [("piano", 6, 46), ("portrait", 100, 14), ("plant", 112, 50)],
    "vicarage": [("bookcase", 4, 28), ("landscape", 52, 10)],
    "pryce": [("clock", 4, 32), ("plant", 72, 48)],
    "whitlock": [("harp", 110, 38), ("portrait", 92, 14)],
    "school": [("desks", 4, 70), ("landscape", 52, 8)],
    "farm": [("dog", 66, 82), ("stove", 6, 40)],
    "inn": [("barrels", 98, 50), ("landscape", 52, 40)],
    "draper": [("bolts", 2, 50), ("plant", 112, 50)],
    "post": [("clock", 112, 32)],
    "bakery": [("barrels", 98, 50)],
    "smithy": [("stove", 60, 40), ("barrels", 6, 72)],
    "school2": [("desks", 4, 70), ("bookcase", 62, 28)],
    "cottage": [("plant", 112, 50), ("landscape", 70, 10)],
}

def room(hid):
    t = TYPE[hid]
    wall = rgba(WALLPAPER[hid]); wallD = shade(wall, 0.88)
    floor_y = 62 if t != "manor" else 66
    r = Canvas(RW, RH, wall)
    for y in range(4, floor_y - 2, 8):
        for x in range((y // 8) % 2 * 4, RW, 8):
            r.set(x, y, wallD); r.set(x + 1, y + 1, wallD)
    floor = rgba("b88a5a") if t != "manor" else rgba("c8a070")
    r.rect(0, floor_y, RW, RH - floor_y, floor)
    for y in range(floor_y + 4, RH, 6):
        r.rect(0, y, RW, 1, shade(floor, 0.85))
    r.rect(0, floor_y, RW, 2, shade(floor, 0.7))
    if t == "manor":
        r.rect(0, floor_y - 10, RW, 10, shade(wall, 0.8)); r.rect(0, floor_y - 10, RW, 1, shade(wall, 0.65))
        win = Canvas(30, 30); win.rect(0, 0, 30, 30, rgba("ffffff")); win.rect(2, 2, 26, 26, rgba("2a3a6a")); win.rect(14, 2, 2, 26, rgba("ffffff")); win.rect(2, 14, 26, 2, rgba("ffffff"))
        win.set(8, 7, rgba("fff4c8")); win.rect(-1, 0, 4, 30, rgba("c84a6a") if hid == "ashby" else rgba("6a3a7a")); win.outline(); r.paste(win, 49, 8)
        ch = Canvas(20, 12); ch.rect(9, 0, 2, 5, rgba("d8a83a")); ch.rect(2, 5, 16, 2, rgba("d8a83a"))
        for x in (2, 9, 16): ch.rect(x, 2, 2, 3, rgba("fff4b8"))
        ch.outline(); r.paste(ch, 54, 0)
        rug = Canvas(60, 10); rug.ellipse(30, 5, 29, 4.5, rgba("a83a4a")); rug.ellipse(30, 5, 24, 3, rgba("d8a83a")); rug.outline(); r.paste(rug, 34, 80)
        sofa = Canvas(34, 16); sofa.rect(0, 4, 34, 12, rgba("4a7ab8")); sofa.rect(2, 0, 30, 6, shade(rgba("4a7ab8"), 0.8)); sofa.outline()
        r.paste(sofa, 40, floor_y - 8)
        table = Canvas(22, 16); table.rect(0, 0, 22, 4, rgba("8a5a2a")); table.rect(2, 4, 2, 12, rgba("6a3a1e")); table.rect(18, 4, 2, 12, rgba("6a3a1e")); table.outline()
        r.paste(table, 80, floor_y - 4)
        slots_items = [(84, floor_y - 13), (16, floor_y + 12)]
        if hid == "ashby":
            slots_items = [(84, floor_y - 13), (15, 38), (50, floor_y - 10)]
        if hid == "whitlock":
            slots_items = [(84, floor_y - 13), (20, 20)]
        if hid == "grange":
            slots_items = [(84, floor_y - 13), (16, floor_y + 12), (104, floor_y + 14)]
        if hid == "abbey":
            slots_items = [(96, floor_y + 12)]
        slots_people = [(58, floor_y + 6), (20, floor_y + 6)]
    elif t == "cottage":
        win = Canvas(22, 20); win.rect(0, 0, 22, 20, rgba("ffffff")); win.rect(2, 2, 18, 16, rgba("2a3a6a")); win.rect(10, 2, 2, 16, rgba("ffffff"))
        if hid in DAYLIGHT: win.rect(2, 2, 18, 16, rgba("aee0f8")); win.rect(10, 2, 2, 16, rgba("ffffff"))
        win.set(6, 6, rgba("fff4c8")); win.rect(0, 0, 4, 20, rgba("d8584a")); win.rect(18, 0, 4, 20, rgba("d8584a")); win.outline(); r.paste(win, 30, 18)
        fire = Canvas(26, 28); fire.rect(0, 0, 26, 4, rgba("8a7a6a")); fire.rect(2, 4, 22, 24, rgba("a8988a")); fire.rect(6, 12, 14, 16, rgba("2a1a1a"))
        fire.rect(9, 20, 8, 6, rgba("f2702a")); fire.rect(11, 18, 4, 4, rgba("f2c040")); fire.outline(); r.paste(fire, 92, floor_y - 27)
        candle = Canvas(6, 8); candle.rect(2, 3, 2, 5, rgba("fbf6e8")); candle.rect(2, 1, 2, 2, rgba("f2c040")); candle.outline(); r.paste(candle, 100, floor_y - 35)
        table = Canvas(30, 16); table.rect(0, 0, 30, 4, rgba("8a5a2a")); table.rect(2, 4, 2, 12, rgba("6a3a1e")); table.rect(26, 4, 2, 12, rgba("6a3a1e")); table.outline()
        r.paste(table, 44, floor_y + 6)
        slots_items = [(53, floor_y - 4), (78, floor_y + 10), (40, floor_y + 16)]
        slots_people = [(26, floor_y + 4), (84, floor_y + 6)]
    else:
        sh = Canvas(RW, 34)
        for row_ in range(3):
            sh.rect(0, row_ * 11 + 9, RW, 2, rgba("7a4a24"))
            for i in range(0, RW, 6):
                col = ("c84a6a", "4a7ab8", "f2c040", "3a8a5a", "8a5af2", "e8e0d0")[(i // 6 + row_ * 2) % 6]
                if (i // 6 + row_) % 4 != 0:
                    sh.rect(i + 1, row_ * 11 + 2, 4, 7, rgba(col))
        sh.outline(); r.paste(sh, 0, 4)
        counter = Canvas(RW - 40, 18); counter.rect(0, 0, RW - 40, 4, rgba("a86a3a")); counter.rect(2, 4, RW - 44, 14, rgba("8a5a2a"))
        for x in range(8, RW - 44, 16): counter.rect(x, 7, 10, 8, shade(rgba("8a5a2a"), 0.85))
        counter.outline(); r.paste(counter, 20, floor_y - 2)
        slots_items = [(28, floor_y - 13), (84, floor_y - 13)]
        slots_people = [(36, floor_y + 18), (80, floor_y + 18), (58, floor_y + 30)]
    for (kind, x, y) in DECOR[hid]:
        r.paste(deco_sprite(kind) if kind != "parcel" else item_sprite("parcel"), x, y)
    item_pos = {}
    for (iid, (x, y)) in zip(ROOM_ITEMS[hid], slots_items):
        if not (hid == "whitlock" and iid == "print"):
            r.paste(item_sprite(ITEM_KIND[iid]), x, y)
        else:
            r.paste(item_sprite("frame"), x, y)
        item_pos[iid] = (x, y, 12, 12)
    if hid in FLIP:
        r.im = r.im.transpose(Image.FLIP_LEFT_RIGHT); r.px = r.im.load()
        item_pos = {k: (RW - x - w, y, w, h) for k, (x, y, w, h) in item_pos.items()}
        slots_people = [(RW - x - 14, y) for (x, y) in slots_people]
    r.save(f"room-{hid}.png")
    n = ROOM_PEOPLE.get(hid, 1)
    return {"w": RW, "h": RH,
            "items": {k: {"x": x, "y": y, "w": w, "h": h} for k, (x, y, w, h) in item_pos.items()},
            "people": [{"x": x, "y": y - 22, "w": 14, "h": 22} for (x, y) in slots_people[:n]]}

rooms = {hid: room(hid) for hid in WALLPAPER}

# ================================================================ layout for the game
sizes = {k: [s.width, s.height] for k, s in SPR.items()}
layout = {"village": MAPS["village"], "lane": MAPS["lane"], "ball": {"w": BW, "h": BH, **BALL}, "rooms": rooms}
ts = "// Generated by tools/emma-art/gen.py. Do not edit by hand: change the generator and run it again.\n"
ts += "// Units are picture pixels, before scaling.\n"
ts += "export const layout = " + json.dumps(layout, indent=1) + " as const;\n"
open(os.path.join(ROOT, "components", "games", "emma", "layout.ts"), "w").write(ts)
print("ok", sizes)
