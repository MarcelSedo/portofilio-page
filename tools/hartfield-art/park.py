import os
TITLE = bool(os.environ.get("HF_TITLE"))
"""Hartfield park in the rain – pixel-art mockup (animated GIF + PNG still)."""
import random, math
from PIL import Image, ImageDraw, ImageFont

W, H, S = 384, 224, 3
R = random.Random(7)

def hexc(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2],16), int(h[2:4],16), int(h[4:6],16), a)

P = {k: hexc(v) for k, v in dict(
    g0='#24402c', g1='#2f5435', g2='#3d6a3c', g3='#4f8044', g4='#6a9a4e', g5='#8db85e',
    hedge='#22442a', hedge2='#2e5a33', hedgeL='#4a7d3f',
    grav='#b9a888', grav2='#a39272', grav3='#cfc0a0',
    st='#e6d9bd', st2='#cdbd9c', st3='#a8977a', st4='#f3ead6',
    slate='#4c5566', slate2='#5f6a7d', slate3='#3a4150',
    win='#2b3346', warm='#f4c463', warm2='#e09a3e', frame='#f6f1e4',
    brick='#9a5646', brick2='#7c4237', brick3='#b56b56',
    wood='#6b4630', wood2='#4e3222', wood3='#8a6040',
    iron='#20232b', iron2='#3a3f4c',
    rose='#d4587a', rose2='#f09ab0', rose3='#a23a5c', lav='#9a82cc', lav2='#7a62ac',
    fox='#c77ab8', white='#f6f2ea', yel='#efd36a', blue='#7fa6d8',
    skin='#f0c8a8', hair='#c89a5a', hairD='#6a4028', pink='#e8a0b4', pinkD='#c27890',
    maid='#3c4a6a', apron='#f4f0e8', umb='#7a3550', umb2='#9c4a6a',
    puddle='#8ea2b0', puddle2='#b8c8d2',
).items()}

img = Image.new('RGBA', (W, H), P['g2'])
d = ImageDraw.Draw(img)
px = lambda x, y, c: d.point((x, y), fill=c)

# ---------- lawn texture ----------
for y in range(H):
    for x in range(W):
        r = R.random()
        if r < .12: px(x, y, P['g3'])
        elif r < .17: px(x, y, P['g1'])
        elif r < .19: px(x, y, P['g4'])
# grass tufts
for _ in range(500):
    x, y = R.randrange(W), R.randrange(95, H)
    px(x, y, P['g4']); px(x, y-1, P['g5'])

# ---------- gravel paths ----------
def gravel_rect(x0, y0, x1, y1):
    for y in range(y0, y1):
        for x in range(x0, x1):
            r = R.random()
            c = P['grav'] if r < .6 else P['grav2'] if r < .85 else P['grav3']
            px(x, y, c)
    d.line((x0, y0, x0, y1-1), fill=P['grav2']); d.line((x1-1, y0, x1-1, y1-1), fill=P['grav2'])
gravel_rect(172, 98, 212, H)          # main drive
gravel_rect(212, 150, 330, 172)       # to stable yard
gravel_rect(285, 100, 345, 172)       # stable yard
# round bed in front of house (carriage turn)
d.ellipse((150, 100, 234, 126), fill=P['grav'])
d.ellipse((168, 104, 216, 122), fill=P['hedge'])
d.ellipse((171, 106, 213, 120), fill=P['g3'])

# ---------- the house ----------
hx0, hx1, hy0, hy1 = 92, 292, 18, 98
# roof
d.polygon([(hx0+6, hy0+10), (hx1-6, hy0+10), (hx1+2, hy0+26), (hx0-2, hy0+26)], fill=P['slate'])
for y in range(hy0+12, hy0+26, 3):
    d.line((hx0, y, hx1, y), fill=P['slate3'])
for x in range(hx0, hx1, 6):
    for y in range(hy0+12, hy0+26, 6): px(x + (y//3) % 2*3, y+1, P['slate2'])
# chimneys
for cx in (112, 160, 224, 272):
    d.rectangle((cx, hy0-2, cx+8, hy0+12), fill=P['brick']); d.rectangle((cx-1, hy0-3, cx+9, hy0-1), fill=P['st2'])
    d.line((cx+8, hy0-2, cx+8, hy0+12), fill=P['brick2'])
    for pot in (cx+1, cx+5): d.rectangle((pot, hy0-7, pot+2, hy0-3), fill=P['brick3'])
# cornice + facade
d.rectangle((hx0-3, hy0+26, hx1+3, hy0+29), fill=P['st4'])
for x in range(hx0-3, hx1+3, 3): px(x, hy0+29, P['st3'])
d.rectangle((hx0, hy0+30, hx1, hy1), fill=P['st'])
for y in range(hy0+34, hy1, 6): d.line((hx0, y, hx1, y), fill=P['st2'])
d.rectangle((hx0, hy1-6, hx1, hy1), fill=P['st2'])   # plinth
d.line((hx0, hy1-6, hx1, hy1-6), fill=P['st4'])
# string course
d.line((hx0, hy0+55, hx1, hy0+55), fill=P['st4']); d.line((hx0, hy0+56, hx1, hy0+56), fill=P['st3'])

lit = {(0,0), (3,1), (5,0), (4,1), (1,1)}
def window(x, y, w=12, h=18, on=False):
    d.rectangle((x-2, y-3, x+w+1, y-1), fill=P['st4'])  # lintel
    d.rectangle((x-1, y-1, x+w, y+h), fill=P['frame'])
    inner = P['warm'] if on else P['win']
    d.rectangle((x, y, x+w-1, y+h-1), fill=inner)
    if on:
        d.rectangle((x, y+h//2, x+w-1, y+h-1), fill=P['warm2'])
        # curtain
        d.rectangle((x, y, x+2, y+h-1), fill=P['rose3']); d.rectangle((x+w-3, y, x+w-1, y+h-1), fill=P['rose3'])
    else:
        px(x+2, y+2, P['slate2']); px(x+3, y+2, P['slate2']); px(x+2, y+3, P['slate2'])
    for gx in range(x+w//3, x+w-1, w//3): d.line((gx, y, gx, y+h-1), fill=P['frame'])
    for gy in range(y+h//3, y+h-1, h//3): d.line((x, gy, x+w-1, gy), fill=P['frame'])
    d.rectangle((x-2, y+h+1, x+w+1, y+h+2), fill=P['st3'])  # sill
    # window box with flowers on ground floor
    return inner

cols = [102, 124, 146, 226, 248, 270]
for i, x in enumerate(cols):
    window(x, hy0+34, on=(i, 0) in lit)
    window(x, hy0+62, h=20, on=(i, 1) in lit)
    # flower boxes under ground floor windows
    d.rectangle((x-2, hy0+85, x+13, hy0+87), fill=P['wood'])
    for k in range(x-2, x+14):
        if R.random() < .7: px(k, hy0+84, R.choice([P['rose'], P['rose2'], P['hedgeL'], P['white']]))
        if R.random() < .4: px(k, hy0+83, R.choice([P['hedgeL'], P['rose']]))

# portico in the middle
px0, px1 = 168, 216
d.polygon([(px0-4, hy0+32), (px1+4, hy0+32), ((px0+px1)//2, hy0+22)], fill=P['st4'])
d.polygon([(px0+2, hy0+31), (px1-2, hy0+31), ((px0+px1)//2, hy0+25)], fill=P['st2'])
# fanlight window (Emma's) over portico
d.rectangle((px0-4, hy0+32, px1+4, hy0+35), fill=P['st4'])
for cx in (px0, px0+14, px1-18, px1-4):
    d.rectangle((cx, hy0+36, cx+4, hy1-4), fill=P['st4'])
    d.line((cx+4, hy0+36, cx+4, hy1-4), fill=P['st3'])
    d.rectangle((cx-1, hy0+36, cx+5, hy0+38), fill=P['st'])
# door
d.rectangle((184, hy0+50, 200, hy1-4), fill=P['hedge'])
d.pieslice((184, hy0+44, 200, hy0+58), 180, 360, fill=P['warm'])
for a in range(180, 361, 30):
    xx = 192 + 8*math.cos(math.radians(a)); yy = hy0+51 + 7*math.sin(math.radians(a))
    d.line((192, hy0+51, xx, yy), fill=P['frame'])
d.line((192, hy0+51, 192, hy1-4), fill=P['hedge2'])
px(189, hy0+70, P['yel']); px(195, hy0+70, P['yel'])
# steps
for i in range(3):
    d.rectangle((176-i*3, hy1-3+i*2, 208+i*3, hy1-2+i*2), fill=[P['st4'], P['st'], P['st2']][i])
# climbing wisteria / roses on facade
def climber(x, y0, y1, col1, col2):
    for y in range(y0, y1):
        xx = x + int(2*math.sin(y/4))
        px(xx, y, P['hedge2'])
        if R.random() < .55:
            for _ in range(2): px(xx + R.randint(-3, 3), y + R.randint(-1, 1), R.choice([col1, col2, P['hedgeL']]))
climber(hx0+2, hy0+30, hy1-2, P['lav'], P['lav2'])
climber(hx1-3, hy0+30, hy1-2, P['lav'], P['lav2'])
climber(164, hy0+40, hy1-3, P['rose'], P['rose2'])
climber(220, hy0+40, hy1-3, P['rose'], P['rose2'])

# ---------- stable / coach house (stone, Georgian like the house) ----------
sx0, sx1, sy0, sy1 = 298, 374, 40, 100
d.polygon([(sx0-3, sy0+14), (sx1+3, sy0+14), (sx1-6, sy0+2), (sx0+6, sy0+2)], fill=P['slate'])
for y in range(sy0+4, sy0+14, 3): d.line((sx0, y, sx1, y), fill=P['slate3'])
d.rectangle((sx0-2, sy0+14, sx1+2, sy0+16), fill=P['st4'])
d.rectangle((sx0, sy0+17, sx1, sy1), fill=P['st'])
for y in range(sy0+21, sy1, 6): d.line((sx0, y, sx1, y), fill=P['st2'])
for y in range(sy0+17, sy1, 6):  # quoins
    for qx in (sx0, sx1-5):
        d.rectangle((qx, y, qx+5, y+2), fill=P['st4'])
d.rectangle((sx0, sy1-5, sx1, sy1), fill=P['st2'])
# pediment with clock
mx = (sx0+sx1)//2
d.polygon([(mx-16, sy0+14), (mx+16, sy0+14), (mx, sy0+2)], fill=P['st4'])
d.polygon([(mx-12, sy0+13), (mx+12, sy0+13), (mx, sy0+5)], fill=P['st2'])
d.ellipse((mx-4, sy0+6, mx+4, sy0+13), fill=P['white'], outline=P['st3']); px(mx, sy0+9, P['iron']); px(mx+1, sy0+8, P['iron'])
d.rectangle((mx-4, sy0-8, mx+4, sy0+2), fill=P['st4'])  # cupola
d.polygon([(mx-6, sy0-8), (mx+6, sy0-8), (mx, sy0-15)], fill=P['slate2']); px(mx, sy0-17, P['yel']); px(mx, sy0-16, P['yel'])
def arch_door(x0, x1, top, lit=False):
    d.rectangle((x0-2, top-2, x1+2, sy1), fill=P['st4'])
    d.pieslice((x0-2, top-8, x1+2, top+8), 180, 360, fill=P['st4'])
    d.rectangle((x0, top, x1, sy1), fill=P['wood2'])
    d.pieslice((x0, top-6, x1, top+6), 180, 360, fill=P['win'])
    for k in range(x0+2, x1, 3): d.line((k, top-4, (x0+x1)//2, top), fill=P['frame'])
    d.rectangle(((x0+x1)//2-1, top-10, (x0+x1)//2+1, top-6), fill=P['st'])  # keystone
    for k in range(x0+2, x1, 3): d.line((k, top+1, k, sy1), fill=P['wood'])
    if lit:
        d.rectangle((x0+3, top+4, x0+9, sy1), fill=P['warm2']); d.rectangle((x0+5, top+6, x0+8, sy1), fill=P['warm'])
arch_door(304, 326, sy0+40, lit=True)
arch_door(348, 368, sy0+40)
# hayloft window (oval, oeil-de-boeuf) with the sulking coachman
d.ellipse((mx-6, sy0+20, mx+6, sy0+30), fill=P['st4'])
d.ellipse((mx-4, sy0+21, mx+4, sy0+29), fill=P['win'])
d.rectangle((mx-1, sy0+24, mx+2, sy0+29), fill=P['wood2']); d.rectangle((mx-1, sy0+22, mx+2, sy0+24), fill=P['hairD'])
# lantern
d.line((302, sy0+30, 302, sy0+33), fill=P['iron']); d.rectangle((300, sy0+33, 304, sy0+37), fill=P['warm'])
# climbing roses on stable
for y in range(sy0+20, sy1-2):
    xx = sx1-2 + int(1.5*math.sin(y/3)); px(xx, y, P['hedge2'])
    if R.random() < .5: px(xx+R.randint(-2, 1), y, R.choice([P['rose'], P['rose2'], P['hedgeL']]))
# ---------- the broken carriage ----------
cx, cy = 262, 124
d.rectangle((cx, cy, cx+30, cy+14), fill=P['umb'])               # body (claret)
d.rectangle((cx+2, cy+2, cx+12, cy+8), fill=P['win'])
d.rectangle((cx+16, cy+2, cx+28, cy+12), fill=P['umb2'])
d.line((cx, cy, cx+30, cy), fill=P['yel']); d.line((cx, cy+14, cx+30, cy+14), fill=P['yel'])
d.rectangle((cx-2, cy-3, cx+32, cy-1), fill=P['iron2'])
# wheel on (right) and wheel off leaning (left) – carriage tilted
d.ellipse((cx+20, cy+12, cx+32, cy+24), outline=P['wood'], width=2)
for a in range(0, 360, 45):
    d.line((cx+26, cy+18, cx+26+5*math.cos(math.radians(a)), cy+18+5*math.sin(math.radians(a))), fill=P['wood3'])
d.rectangle((cx+2, cy+14, cx+5, cy+20), fill=P['wood2'])        # block under axle
d.ellipse((cx-14, cy+8, cx-2, cy+22), outline=P['wood'], width=2)  # the loose wheel
d.line((cx-8, cy+9, cx-8, cy+21), fill=P['wood3']); d.line((cx-13, cy+15, cx-3, cy+15), fill=P['wood3'])
# shaft lying on the ground
d.line((cx+32, cy+16, cx+46, cy+22), fill=P['wood'], width=2)

# ---------- parterres with flowers ----------
def parterre(x0, y0, x1, y1, scheme):
    d.rectangle((x0, y0, x1, y1), fill=P['hedge'])
    d.rectangle((x0+1, y0+1, x1-1, y1-1), fill=P['hedge2'])
    for x in range(x0, x1+1, 2): px(x, y0, P['hedgeL'])
    d.rectangle((x0+3, y0+3, x1-3, y1-3), fill=P['g1'])
    for y in range(y0+4, y1-3):
        for x in range(x0+4, x1-3):
            if R.random() < .25: px(x, y, P['g2'])
    for _ in range((x1-x0)*(y1-y0)//14):
        bx, by = R.randint(x0+5, x1-6), R.randint(y0+5, y1-6)
        c = R.choice(scheme)
        px(bx, by+1, P['hedge2']); px(bx+1, by+1, P['hedgeL'])
        d.rectangle((bx, by-1, bx+1, by), fill=c)
        px(bx, by-1, tuple(min(255, v+45) for v in c[:3]) + (255,))
    # diagonal box-hedge cross, knot-garden style
    d.line((x0+3, y0+3, x1-3, y1-3), fill=P['hedge2']); d.line((x1-3, y0+3, x0+3, y1-3), fill=P['hedge2'])
    mx, my = (x0+x1)//2, (y0+y1)//2
    d.ellipse((mx-3, my-3, mx+3, my+3), fill=P['hedge']); px(mx, my-1, P['rose2'])

roses = [P['rose'], P['rose2'], P['rose3'], P['white']]
lav = [P['lav'], P['lav2'], P['white'], P['blue']]
parterre(96, 132, 160, 166, roses)
parterre(96, 176, 160, 210, lav)
parterre(224, 176, 284, 210, roses)
# foxglove spires along the drive
for y in range(132, 214, 9):
    for x in (165, 219):
        d.line((x, y, x, y+6), fill=P['hedge2'])
        for k in range(5): px(x + (k % 2) - (0 if x < 190 else 0), y+k, R.choice([P['fox'], P['rose2'], P['white']]))

# ---------- trees & topiary ----------
def yew(x, y, h=16):
    for i in range(h):
        w = max(1, int((i/h) * 6))
        d.line((x-w, y+i, x+w, y+i), fill=P['hedge'] if i % 3 else P['hedge2'])
        px(x-w+1, y+i, P['hedgeL'])
    d.rectangle((x-6, y+h, x+6, y+h+2), fill=(0, 0, 0, 60))
for y in (130, 160, 190):
    yew(168, y); yew(216, y)

def oak(x, y, r):
    d.ellipse((x-r+4, y+r*.45, x+r+8, y+r*.95), fill=(10, 25, 15, 120))  # shadow on lawn
    d.polygon([(x-3, y+r*.7), (x+3, y+r*.7), (x+5, y+r*.2), (x-4, y+r*.2)], fill=P['wood2'])
    d.line((x-4, y+r*.7, x-7, y+r*.75), fill=P['wood2']); d.line((x+3, y+r*.7, x+7, y+r*.76), fill=P['wood2'])
    blobs = []
    for i in range(26):
        a = R.random()*math.tau; rr = R.random()*r*.7
        blobs.append((x + rr*math.cos(a), y - r*.25 + rr*math.sin(a)*.75, R.randint(7, 11)))
    blobs.sort(key=lambda b: b[1])
    for bx, by, br in blobs:  # dark base
        d.ellipse((bx-br, by-br, bx+br, by+br), fill=P['g0'])
    for bx, by, br in blobs:  # mid tone, shifted up-left (light from top-left)
        d.ellipse((bx-br+1, by-br, bx+br-2, by+br-3), fill=P['g1'])
    for bx, by, br in blobs:
        d.ellipse((bx-br+2, by-br+1, bx+br-5, by+br-6), fill=P['g2'])
    for bx, by, br in blobs:
        if R.random() < .6:
            d.ellipse((bx-br+3, by-br+2, bx-1, by-2), fill=P['g3'])
            px(int(bx-br+5), int(by-br+3), P['g4'])
oak(40, 80, 34)
oak(30, 170, 26)
oak(372, 190, 22)

# hedge wall along the bottom with the iron gate
d.rectangle((0, 212, 160, H), fill=P['hedge'])
d.rectangle((224, 212, W, H), fill=P['hedge'])
for x in range(0, W, 2):
    if not 160 < x < 224: px(x, 212, P['hedgeL']); px(x+1, 213, P['hedge2'])
for gx in (158, 214):
    d.rectangle((gx, 200, gx+10, H), fill=P['st'])
    d.rectangle((gx-1, 198, gx+11, 201), fill=P['st4'])
    d.line((gx+10, 200, gx+10, H), fill=P['st3'])
    # urn with trailing flowers
    d.ellipse((gx+1, 190, gx+9, 198), fill=P['st2']); d.rectangle((gx+3, 196, gx+7, 198), fill=P['st3'])
    for k in range(10): px(gx + R.randint(0, 10), 188 + R.randint(0, 4), R.choice([P['rose'], P['rose2'], P['hedgeL']]))
# gate bars (closed, chained)
for x in range(170, 214, 4):
    d.line((x, 203, x, H), fill=P['iron'])
    px(x, 202, P['iron2']); px(x, 201, P['iron'])
d.arc((168, 196, 214, 214), 180, 360, fill=P['iron'])
d.line((168, 208, 214, 208), fill=P['iron2'])
d.ellipse((188, 206, 195, 212), outline=P['yel'])   # padlock/chain
d.rectangle((189, 210, 194, 215), fill=P['yel'])

# ---------- puddles on the path ----------
puddles = [(180, 140, 196, 145), (193, 182, 208, 187), (240, 158, 256, 163), (300, 146, 318, 151)]
for p in puddles:
    d.ellipse(p, fill=P['puddle'])
    d.line((p[0]+3, p[1]+1, p[2]-6, p[1]+1), fill=P['puddle2'])

# ---------- characters ----------

HEADS = {
'harriet': [
"....oooooo....",
"...oBBBBBBo...",
"..oBBBBBBBBo..",
".oBBrrrrrrBBo.",
".oBhhhhhhhhBo.",
".oBhhsssshhBo.",
".oBsessssesBo.",
".oBsbssssbsBo.",
"..oBsssmssBo..",
"...rossssor...",
],
'emma': [
"....ohhhho....",
"...ohhhhhho...",
"..ohhhhhhhho..",
".ohhHhhhhHhho.",
".ohhssssssho..",
".hHsessssesHh.",
".hHsbssssbsHh.",
"..hosssmssoh..",
"...oossssoo...",
"....osSso.....",
],
'bessie': [
"...owwwwwwo...",
"..owwwwwwwwo..",
".owwwwwwwwwwo.",
".owhhhhhhhhwo.",
"..ohsssssssho.",
".oohsesssesho.",
"..ohsbsssbsho.",
"...osssmsso...",
"....osSso.....",
"....osSso.....",
],
}
BODY = [
"...owwwwwwo...",
"..odwrrrrwdo..",
".oSddddddddSo.",
".oSddddddDdSo.",
".osdddddDDdso.",
"..oddddddDDo..",
"..odddddddDo..",
".odddddddDDDo.",
".oddddddddDDo.",
".odddddddddDDo",
"oddddddddddDDo",
"oooooooooooooo",
"...okko.okko..",
]
def sprite(x, y, who, cols, apron=False):
    rows = HEADS[who] + BODY
    d.ellipse((x-1, y+len(rows)-3, x+15, y+len(rows)+2), fill=(0, 0, 0, 80))
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.': continue
            c = cols.get(ch)
            if apron and j >= 12 and 4 <= i <= 9 and ch in 'dD': c = P['apron'] if ch == 'd' else P['st2']
            if c: px(x+i, y+j, c)
base_cols = {'o': hexc('#2a1c22'), 's': P['skin'], 'S': hexc('#d8a688'), 'e': hexc('#2a2030'),
             'b': hexc('#f0a0a0'), 'm': hexc('#b04a5a'), 'w': P['white'], 'k': hexc('#3a2a2a')}
harriet = dict(base_cols, B=hexc('#f4ecd8'), r=P['rose'], h=P['hair'], H=hexc('#a87a40'), d=P['pink'], D=P['pinkD'])
emma = dict(base_cols, h=P['hairD'], H=hexc('#4a2a18'), r=hexc('#7fa6d8'), d=P['white'], D=hexc('#c8c0d8'))
bessie = dict(base_cols, h=P['hairD'], H=hexc('#4a2a18'), r=P['apron'], d=P['maid'], D=P['slate3'])
pass
base = img.copy()
if TITLE:
    _t = Image.alpha_composite(base, Image.new('RGBA', (W, H), hexc('#4a5a78', 70)))
    _g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); _gd = ImageDraw.Draw(_g)
    for (i, row) in lit:
        x = cols[i]; y = 18+34 if row == 0 else 18+62
        _gd.rectangle((x+1, y+1, x+10, y+16), fill=hexc('#f4c463', 90))
    title_rain = Image.alpha_composite(_t, _g)
    title_sun = Image.alpha_composite(base, Image.new('RGBA', (W, H), hexc('#fff0c8', 28)))

if not TITLE:
    # ---------- UI chrome (drawn on each frame, above weather) ----------
    font = ImageFont.load_default()
    def ui(fr):
        dd = ImageDraw.Draw(fr)
        # quest card top-left
        x0, y0, x1, y1 = 6, 6, 150, 38
        dd.rectangle((x0, y0, x1, y1), fill=hexc('#f6efdd', 240), outline=P['umb'])
        dd.rectangle((x0+2, y0+2, x1-2, y1-2), outline=hexc('#d9b9a8'))
        for cxp, cyp in ((x0+2, y0+2), (x1-2, y0+2), (x0+2, y1-2), (x1-2, y1-2)):
            dd.point([(cxp+dx, cyp+dy) for dx, dy in ((0,0),(1,0),(-1,0),(0,1),(0,-1))], fill=P['rose'])
        dd.text((x0+7, y0+5), "EMMA SUGGESTS", fill=P['umb'], font=font)
        dd.text((x0+7, y0+18), "Look in Bessie's basket.", fill=hexc('#3a2a2a'), font=font)
        # cards counter top-right
        dd.rectangle((W-66, 6, W-6, 22), fill=hexc('#f6efdd', 240), outline=P['umb'])
        dd.text((W-61, 8), "Clues 2/5", fill=hexc('#3a2a2a'), font=font)
        # floral frame
        dd.rectangle((0, 0, W-1, H-1), outline=P['umb'])
        dd.rectangle((1, 1, W-2, H-2), outline=hexc('#e8c9b8'))
        for x in range(8, W-8, 16):
            for yy in (1, H-2):
                dd.point([(x, yy), (x+1, yy)], fill=P['rose'])
        for y in range(8, H-8, 16):
            for xx in (1, W-2):
                dd.point([(xx, y), (xx, y+1)], fill=P['rose'])
    
    # ---------- weather ----------
    NF = 16
    drops = [(R.randrange(-60, W), R.randrange(H), R.choice([5, 6, 7])) for _ in range(380)]
    fogbands = [(R.randrange(W), R.randrange(110, H), R.randint(50, 110), R.randint(10, 22)) for _ in range(9)]
    splash_pts = [(R.randrange(W), R.randrange(100, H)) for _ in range(60)]
    frames = []
    for f in range(NF):
        fr = base.copy()
        # rainy-day grade: desaturate & cool
        tint = Image.new('RGBA', (W, H), hexc('#4a5a78', 70))
        fr = Image.alpha_composite(fr, tint)
        # warm window glow (stays warm through the tint)
        glow = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
        for (i, row) in lit:
            x = cols[i]; y = 18+34 if row == 0 else 18+62
            gd.rectangle((x+1, y+1, x+10, y+16), fill=hexc('#f4c463', 90))
        gd.rectangle((307, 84, 313, 100), fill=hexc('#f4c463', 110))
        gd.rectangle((299, 72, 305, 78), fill=hexc('#ffd98a', 160))
        fr = Image.alpha_composite(fr, glow)
        # chimney smoke
        sm = Image.new('RGBA', (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sm)
        for cxs in (112, 224):
            for k in range(5):
                t = (f/NF + k/5) % 1
                yy = 8 - t*30; xx = cxs + 4 + t*22 + 3*math.sin(t*6)
                r = 2 + t*6
                sd.ellipse((xx-r, yy-r, xx+r, yy+r), fill=hexc('#d8dde6', int(110*(1-t))))
        fr = Image.alpha_composite(fr, sm)
        # fog bands drifting
        fog = Image.new('RGBA', (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fog)
        for (x, y, w, h) in fogbands:
            xx = (x + f*2) % (W + w) - w//2
            for k in range(4):
                fd.ellipse((xx-w//2+k*6, y-h//2+k, xx+w//2-k*6, y+h//2-k), fill=hexc('#dfe6ec', 22))
        # thick fog beyond the gate
        for k in range(6):
            fd.rectangle((0, H-6-k*3, W, H), fill=hexc('#e3e9ee', 18))
        fr = Image.alpha_composite(fr, fog)
        # rain
        rn = Image.new('RGBA', (W, H), (0, 0, 0, 0)); rd = ImageDraw.Draw(rn)
        for (x, y, L) in drops:
            yy = (y + f*14) % H; xx = x + (f*14)//3
            rd.line((xx, yy, xx+L//3, yy+L), fill=hexc('#cfe0f2', 120))
        for i, (x, y) in enumerate(splash_pts):
            ph = (f + i) % 4
            if ph == 0: rd.point([(x, y), (x-1, y-1), (x+1, y-1)], fill=hexc('#e6f0fa', 170))
            elif ph == 1: rd.point([(x-2, y), (x+2, y)], fill=hexc('#e6f0fa', 110))
        # puddle ripples
        for j, p in enumerate(puddles):
            ph = (f + j*3) % 6
            mx, my = (p[0]+p[2])//2 + (j % 2)*3 - 2, (p[1]+p[3])//2
            rr = 1 + ph
            rd.ellipse((mx-rr, my-rr//2, mx+rr, my+rr//2), outline=hexc('#e8f2fa', max(0, 170 - ph*28)))
        fr = Image.alpha_composite(fr, rn)
        ui(fr)
        frames.append(fr.resize((W*S, H*S), Image.NEAREST))
    
    frames[3].convert('RGB').save('/tmp/emma-mock/hartfield-park.png')
    pal = [fr.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE) for fr in frames]
    pal[0].save('/tmp/emma-mock/hartfield-park-rain.gif', save_all=True, append_images=pal[1:], duration=80, loop=0, optimize=False)
    print('ok')
    