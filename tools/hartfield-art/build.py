"""Build every picture of Hartfield and the map data the game reads.

    python3 tools/hartfield-art/build.py

writes games/hartfield/src/assets/*.png and games/hartfield/src/data/maps.gen.ts
"""
import json, math, os, random, sys
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from kit import hexc, C, T
import rooms, sprites

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'games', 'hartfield', 'src', 'assets')
DATA = os.path.join(ROOT, 'games', 'hartfield', 'src', 'data')
os.makedirs(OUT, exist_ok=True); os.makedirs(DATA, exist_ok=True)

# ---------------- rooms ----------------
maps = {}
for fn in rooms.ALL:
    rm = fn()
    maps[rm.name] = rm.save(os.path.join(OUT, f'room-{rm.name}.png'))

# ---------------- characters ----------------
names = list(sprites.CAST)
sheet = Image.new('RGBA', (sprites.CELL_W * 3, sprites.CELL_H * 4 * len(names)), (0, 0, 0, 0))
for i, n in enumerate(names): sheet.alpha_composite(sprites.sheet(n), (0, i * sprites.CELL_H * 4))
sheet.save(os.path.join(OUT, 'cast.png'))
seat = Image.new('RGBA', (sprites.CELL_W * 2, sprites.CELL_H), (0, 0, 0, 0))
seat.alpha_composite(sprites.seated('woodhouse'), (0, 0)); seat.alpha_composite(sprites.seated('tom'), (sprites.CELL_W, 0))
seat.save(os.path.join(OUT, 'seated.png'))
por = Image.new('RGBA', (40 * len(names), 44), (0, 0, 0, 0))
for i, n in enumerate(names): por.alpha_composite(sprites.portrait(n), (i * 40, 0))
por.save(os.path.join(OUT, 'portraits.png'))

# ---------------- item icons (16x16) ----------------
INK, PAPER, ROSE, ROSE2, LEAF, GOLD = hexc('#3a2630'), hexc('#f7efdc'), C['rose'], C['rose2'], C['leaf'], C['gold']
def icon(kind):
    lay = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    if kind == 'prayerbook':
        d.rectangle((2, 3, 12, 14), fill=hexc('#3a2a2a')); d.rectangle((3, 4, 11, 13), outline=hexc('#5a3a3a'))
        d.line((12, 4, 12, 14), fill=hexc('#eadcbc')); d.rectangle((6, 6, 8, 8), fill=GOLD)
        d.point((11, 1), fill=ROSE); d.point((12, 2), fill=ROSE2); d.point((10, 2), fill=LEAF); d.point((11, 3), fill=LEAF)
    if kind == 'horse':
        d.rectangle((3, 8, 12, 11), fill=hexc('#b08050')); d.rectangle((10, 4, 13, 9), fill=hexc('#b08050'))
        d.point((13, 3), fill=hexc('#b08050')); d.point((12, 5), fill=INK)
        for lx in (4, 6, 9, 11): d.line((lx, 12, lx, 14), fill=hexc('#8a6040'))
        d.line((2, 8, 2, 11), fill=hexc('#8a6040')); d.rectangle((6, 9, 7, 10), fill=INK)
    if kind == 'slate':
        d.rectangle((1, 3, 14, 13), fill=hexc('#8f6444')); d.rectangle((3, 5, 12, 11), fill=hexc('#4a4e52'))
        d.line((4, 7, 6, 7), fill=PAPER); d.point((5, 6), fill=PAPER); d.line((8, 6, 8, 9), fill=PAPER); d.point((9, 7), fill=PAPER)
    if kind == 'letter':
        d.polygon([(2, 3), (13, 2), (13, 13), (7, 12), (2, 14)], fill=PAPER); d.line((7, 2, 6, 14), fill=hexc('#c8b890'))
        for yy in (5, 7, 9): d.line((3, yy, 12, yy), fill=hexc('#7a5a5a'))
        d.ellipse((9, 10, 12, 13), fill=hexc('#a23a4c'))
    if kind == 'shawl':
        d.polygon([(1, 4), (14, 4), (8, 14)], fill=hexc('#b8a0c0')); d.line((1, 4, 14, 4), fill=hexc('#9a80a8'))
        for k in range(2, 14, 2): d.point((k, 5), fill=hexc('#efe6d2'))
    if kind == 'umbrella':
        d.pieslice((1, 2, 15, 14), 180, 360, fill=hexc('#7a3550')); d.line((8, 3, 8, 14), fill=hexc('#4e3222')); d.point((7, 14), fill=hexc('#4e3222'))
        for k in (3, 8, 13): d.line((8, 2, k, 8), fill=hexc('#9c4a6a'))
    if kind == 'gruel':
        d.ellipse((2, 7, 13, 13), fill=hexc('#dfe6f2')); d.ellipse((3, 7, 12, 10), fill=hexc('#efe2c0')); d.line((11, 3, 9, 9), fill=C['silver'])
        d.point((5, 4), fill=hexc('#e8eef4')); d.point((6, 2), fill=hexc('#e8eef4'))
    if kind == 'rose':
        d.line((7, 7, 9, 15), fill=hexc('#2f5435')); d.ellipse((4, 2, 11, 8), fill=ROSE); d.point((7, 4), fill=ROSE2)
    if kind == 'primer':
        d.rectangle((3, 3, 13, 13), fill=hexc('#b8483a')); d.rectangle((4, 4, 12, 12), outline=hexc('#d8684a')); d.text((5, 3), 'A', fill=hexc('#e0b870'))
    if kind == 'note':
        d.rectangle((3, 2, 13, 14), fill=PAPER); [d.line((4, y, 12, y), fill=hexc('#9a8a8a')) for y in (5, 7, 9, 11)]
    if kind == 'silver':
        d.ellipse((2, 9, 13, 14), fill=C['silver']); d.rectangle((5, 3, 7, 10), fill=C['silver']); d.ellipse((4, 1, 8, 5), fill=hexc('#e8ecf0'))
    return lay
ICONS = ['prayerbook', 'slate', 'letter', 'horse', 'shawl', 'umbrella', 'gruel', 'rose', 'primer', 'note', 'silver']
ic = Image.new('RGBA', (16 * len(ICONS), 16), (0, 0, 0, 0))
for i, k in enumerate(ICONS): ic.alpha_composite(icon(k), (i * 16, 0))
ic.save(os.path.join(OUT, 'icons.png'))

# ---------------- floral 9-slice frames for the UI ----------------
def frame(size=48, s=16, light=True):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    WINE, GOLD2 = hexc('#6a2a3a'), hexc('#a8843a')
    fill = hexc('#f7efdc') if light else hexc('#3a2630')
    d.rounded_rectangle((0, 0, size - 1, size - 1), 5, fill=WINE)
    d.rounded_rectangle((2, 2, size - 3, size - 3), 4, fill=fill)
    d.rounded_rectangle((3, 3, size - 4, size - 4), 3, outline=GOLD2)
    R = random.Random(4)
    # vine along the inner edge
    for i in range(6, size - 6):
        for (x, y) in ((i, 6), (i, size - 7), (6, i), (size - 7, i)):
            w = int(1.2 * math.sin(i / 2.2))
            px = (x, y + w) if y in (6, size - 7) else (x + w, y)
            d.point(px, fill=hexc('#3a6a34'))
    for (x, y) in ((24, 6), (24, size - 7), (6, 24), (size - 7, 24)):
        d.point((x, y), fill=ROSE); d.point((x + 1, y), fill=ROSE2)
    # corner bouquets
    for (cx, cy, fx, fy) in ((7, 7, 1, 1), (size - 8, 7, -1, 1), (7, size - 8, 1, -1), (size - 8, size - 8, -1, -1)):
        for (a, b, c) in ((0, 0, ROSE), (3, 1, hexc('#a23a5c')), (1, 3, hexc('#e8b04a')), (5, -1, ROSE2)):
            x, y = cx + fx * a, cy + fy * b
            d.ellipse((x - 1, y - 1, x + 1, y + 1), fill=c); d.point((x, y), fill=hexc('#fff0f4'))
        for (a, b) in ((6, 2), (2, 6), (7, 0), (0, 7)): d.point((cx + fx * a, cy + fy * b), fill=LEAF)
    return img
frame().save(os.path.join(OUT, 'frame.png'))
frame(light=False).save(os.path.join(OUT, 'frame-dark.png'))

# ---------------- title & ending pictures (from the park study) ----------------
import importlib.util
os.environ['HF_TITLE'] = '1'
spec = importlib.util.spec_from_file_location('park', os.path.join(HERE, 'park.py'))
park = importlib.util.module_from_spec(spec); spec.loader.exec_module(park)
park.title_rain.save(os.path.join(OUT, 'title-rain.png')); park.title_sun.save(os.path.join(OUT, 'title-sun.png'))

# ---------------- map data ----------------
CAST_ORDER = names
with open(os.path.join(DATA, 'maps.gen.ts'), 'w') as fh:
    fh.write('// Generated by tools/hartfield-art/build.py – do not edit by hand.\n')
    fh.write('/* eslint-disable */\n')
    fh.write('export type Warp = { at: [number, number]; to: string; arrive: [number, number]; face: "up" | "down" | "left" | "right"; kind: string };\n')
    fh.write('export type Fx = { type: string; rect?: number[]; at?: number[]; r?: number; w?: number; to?: number; id?: string };\n')
    fh.write('export type MapData = { name: string; cols: number; rows: number; solid: string[]; things: Record<string, string>; warps: Warp[]; fx: Fx[] };\n')
    fh.write(f'export const CAST_ORDER = {json.dumps(CAST_ORDER)} as const;\n')
    fh.write(f'export const ICON_ORDER = {json.dumps(ICONS)} as const;\n')
    fh.write('export const MAPS: Record<string, MapData> = ' + json.dumps(maps, indent=1) + ' as unknown as Record<string, MapData>;\n')
print('rooms:', ', '.join(maps)); print('cast:', ', '.join(names))
