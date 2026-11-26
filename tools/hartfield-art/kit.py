"""Drawing kit for Hartfield: palette, a Room that records what is solid / what can be examined /
where the doors lead, and a library of furniture painted in the 16 px Pokémon-like perspective."""
import math, random
from PIL import Image, ImageDraw

T = 16
def hexc(h, a=255):
    h = h.lstrip('#'); return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)
def shade(c, k):
    return tuple(max(0, min(255, int(v * k))) for v in c[:3]) + (255,)

C = {k: hexc(v) for k, v in dict(
    void='#2a1c22', wain='#f3ead8', wain2='#ddcdb0', wain3='#c4b08c',
    wood='#6e4a32', wood2='#4e3222', wood3='#8f6444', wood4='#a87a52', gold='#d8b45a', gold2='#a8843a',
    rug='#8e3a4c', rug2='#b25a6a', rug3='#e0b870', rugB='#3e5a7a', rugB2='#5a7a9a',
    glass='#46546e', frame='#f6f1e4', warm='#f4c463', fire1='#f08a3a', fire2='#f8d060', fire3='#c8442a',
    rose='#d4587a', rose2='#f09ab0', rose3='#a23a5c', leaf='#4f8044', leaf2='#2f5435', leaf3='#6a9a4e', white='#f6f2ea',
    marble='#ece6da', marble2='#cfc6b4', marble3='#b0a690', ink='#2a1c22', china='#6a86c0', china2='#dfe6f2',
    skin='#f0c8a8', hair='#c89a5a', hairD='#6a4028', pink='#e8a0b4', pinkD='#c27890',
    chair='#5f7f8f', chair2='#466270', chair3='#7fa0ae', silver='#c8ccd4', iron='#3a3f4c', iron2='#5a6070',
    stone='#b8ad9a', stone2='#a39882', stone3='#cfc5b2', copper='#c8743a', copper2='#a05a2a',
).items()}

WALLS = {
    'duck':   dict(paper='#dfe9ec', stripe='#cddde2', sprig='#d88a9a', leaf='#8eae84'),
    'cream':  dict(paper='#f0dcb8', stripe='#e8c89c', sprig='#d89a8a', leaf='#9cae84'),
    'sage':   dict(paper='#d4dcc4', stripe='#c4ceb0', sprig='#b8848a', leaf='#7e9a6e'),
    'rose':   dict(paper='#f0dad4', stripe='#e6c6c0', sprig='#c87888', leaf='#8eae84'),
    'plaster': None, 'servant': None,
}
FLOORS = {
    'oak':   ([hexc('#c9915c'), hexc('#b98250'), hexc('#d6a06a')], hexc('#9c6a40')),
    'pale':  ([hexc('#b9a07c'), hexc('#ab9270'), hexc('#c6ae88')], hexc('#8a7454')),
    'dark':  ([hexc('#a8744a'), hexc('#9a6a42'), hexc('#b47e52')], hexc('#7a5234')),
}

class Room:
    """cols x rows tiles. Rows 0..2 are the back wall (3 tiles high), the rest is floor."""
    WALLROWS = 3
    def __init__(self, name, cols, rows, seed=1):
        self.name, self.cols, self.rows = name, cols, rows
        self.W, self.H = cols * T, rows * T
        self.img = Image.new('RGBA', (self.W, self.H), C['void'])
        self.d = ImageDraw.Draw(self.img)
        self.R = random.Random(seed)
        self.solid = [[r < self.WALLROWS for c in range(cols)] for r in range(rows)]
        self.things = {}     # "c,r" -> id (examine)
        self.warps = []      # dict(at=[c,r], to=room, arrive=[c,r], face=dir)
        self.fx = []         # overlays the engine animates: rain windows, fire, candles, sparkles
        self.WT, self.WB = 0, self.WALLROWS * T - 1
        self.F0 = self.WALLROWS * T
    # ---- primitives
    def px(self, x, y, c): self.d.point((x, y), fill=c)
    def rect(self, x0, y0, x1, y1, c): self.d.rectangle((x0, y0, x1, y1), fill=c)
    def ell(self, box, c=None, outline=None): self.d.ellipse(box, fill=c, outline=outline)
    def poly(self, pts, c): self.d.polygon(pts, fill=c)
    def line(self, pts, c, w=1): self.d.line(pts, fill=c, width=w)
    def shadow(self, x0, y0, x1, y1, a=60):
        lay = Image.new('RGBA', (self.W, self.H), (0, 0, 0, 0))
        ImageDraw.Draw(lay).ellipse((x0, y0, x1, y1), fill=(60, 30, 20, a))
        self.img.alpha_composite(lay); self.d = ImageDraw.Draw(self.img)
    # ---- grid meta
    def block(self, c0, r0, c1=None, r1=None):
        c1 = c0 if c1 is None else c1; r1 = r0 if r1 is None else r1
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1):
                if 0 <= r < self.rows and 0 <= c < self.cols: self.solid[r][c] = True
    def thing(self, tid, c0, r0, c1=None, r1=None, solid=True):
        c1 = c0 if c1 is None else c1; r1 = r0 if r1 is None else r1
        for r in range(r0, r1 + 1):
            for c in range(c0, c1 + 1): self.things[f'{c},{r}'] = tid
        if solid: self.block(c0, r0, c1, r1)
    def warp(self, c, r, to, ac, ar, face='down', solid=False, kind='door'):
        self.warps.append(dict(at=[c, r], to=to, arrive=[ac, ar], face=face, kind=kind))
        self.solid[r][c] = solid
    # ---- shells
    def floor(self, kind='oak', worn=0.0):
        cols3, gap = FLOORS[kind]
        for y in range(self.F0, self.H):
            row = (y - self.F0) // 5; off = (row * 11) % 32
            for x in range(self.W):
                seg = (x + off) // 32
                c = cols3[(seg * 7 + row * 3) % 3]
                if (y - self.F0) % 5 == 4 or (x + off) % 32 == 0: c = gap
                elif self.R.random() < .03 + worn: c = gap
                self.px(x, y, c)
        for x in range(self.W): self.px(x, self.F0, C['wood2']); self.px(x, self.F0 + 1, gap)
    def flags(self):
        for y in range(self.F0, self.H):
            for x in range(self.W):
                tx, ty = x // 16, (y - self.F0) // 16
                c = [C['stone'], C['stone2'], C['stone3']][(tx * 5 + ty * 3) % 3]
                if x % 16 == 0 or (y - self.F0) % 16 == 0: c = shade(C['stone2'], .85)
                elif self.R.random() < .05: c = shade(c, .93)
                self.px(x, y, c)
        for x in range(self.W): self.px(x, self.F0, C['wood2'])
    def wall(self, style='cream'):
        WT, WB, W = self.WT, self.WB, self.W - 1
        s = WALLS.get(style)
        if s is None:   # whitewashed plaster (servants)
            self.rect(0, WT, W, WB, hexc('#e9e2d2'))
            for _ in range(self.W * 3): self.px(self.R.randint(0, W), self.R.randint(WT + 4, WB), hexc('#d8cfbc'))
            self.rect(0, WT + 30, W, WB, hexc('#8a7a64')); self.line((0, WT + 30, W, WT + 30), hexc('#6a5a48'))
            for x in range(0, W, 9): self.line((x, WT + 31, x, WB), hexc('#7a6a56'))
            self.rect(0, WB - 1, W, WB, C['wood2'])
            return
        P = {k: hexc(v) for k, v in s.items()}
        self.rect(0, WT, W, WB, P['paper'])
        for x in range(0, W, 12):
            self.rect(x, WT, x + 3, WB, P['stripe'])
            for y in range(WT + 8, WT + 30, 8):
                xx = x + 8
                self.px(xx, y, P['sprig']); self.px(xx - 1, y + 1, P['sprig']); self.px(xx + 1, y + 1, P['sprig'])
                self.px(xx, y + 2, P['leaf']); self.px(xx, y + 3, P['leaf'])
        self.rect(0, WT, W, WT + 3, C['wain']); self.line((0, WT + 4, W, WT + 4), C['wain3'])
        for x in range(0, W, 4): self.px(x, WT + 2, C['wain2'])
        self.rect(0, WT + 31, W, WT + 32, C['wain']); self.line((0, WT + 33, W, WT + 33), C['wain3'])
        self.rect(0, WT + 34, W, WB, C['wain'])
        for x in range(3, W, 16): self.d.rectangle((x, WT + 36, x + 10, WB - 3), outline=C['wain2'])
        self.rect(0, WB - 1, W, WB, C['wain3'])
    def edges(self):
        for k, c in enumerate((C['wood2'], C['wain3'])):
            self.line((k, 0, k, self.H), c); self.line((self.W - 1 - k, 0, self.W - 1 - k, self.H), c)
    def save(self, out):
        self.edges()
        self.img.save(out)
        return dict(name=self.name, cols=self.cols, rows=self.rows,
                    solid=[''.join('#' if s else '.' for s in row) for row in self.solid],
                    things=self.things, warps=self.warps, fx=self.fx)

# =================== furniture (tile coordinates) ===================
def tx(c): return c * T
def ty(r): return r * T

def door(rm, col, to, ac, ar, kind='wood', locked=None):
    x = tx(col); top = rm.WB - 34; d = rm.d
    rm.rect(x + 1, top - 3, x + 14, rm.WB, C['frame'])
    rm.poly([(x, top - 3), (x + 15, top - 3), (x + 7, top - 8)], C['frame'])
    rm.poly([(x + 3, top - 4), (x + 12, top - 4), (x + 7, top - 6)], C['wain2'])
    col_ = {'wood': C['wood'], 'baize': hexc('#3f6b4a'), 'plain': C['wood3'], 'white': hexc('#e8e0cc')}[kind]
    rm.rect(x + 3, top, x + 12, rm.WB, col_)
    edge = C['wood3'] if kind != 'white' else hexc('#c8bea8')
    d.rectangle((x + 4, top + 2, x + 7, top + 14), outline=edge); d.rectangle((x + 8, top + 2, x + 11, top + 14), outline=edge)
    d.rectangle((x + 4, top + 17, x + 7, rm.WB - 2), outline=edge); d.rectangle((x + 8, top + 17, x + 11, rm.WB - 2), outline=edge)
    if kind == 'baize':
        for yy in range(top + 3, rm.WB - 1, 4): rm.px(x + 4, yy, C['gold']); rm.px(x + 11, yy, C['gold'])
    rm.px(x + 10, top + 16, C['gold'])
    if locked: rm.thing(locked, col, 2, solid=True)
    else: rm.warp(col, 2, to, ac, ar, face='down')

def window(rm, col, w=2, curtain=C['rug'], curtain2=C['rug2'], sill_pots=True, rain=True):
    x0, x1, y0, y1 = tx(col) + 3, tx(col + w) - 4, rm.WT + 8, rm.WT + 30
    rm.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, C['frame']); rm.rect(x0, y0, x1, y1, C['glass'])
    for gx in range(x0 + 6, x1, 7): rm.line((gx, y0, gx, y1), C['frame'])
    rm.line((x0, y0 + 11, x1, y0 + 11), C['frame'])
    rm.rect(x0 - 3, y1 + 1, x1 + 3, y1 + 3, C['wain3'])
    for xx in (x0 - 5, x1 + 2):
        rm.rect(xx, y0 - 4, xx + 3, y1 + 4, curtain); rm.px(xx + 1, y0 + 2, curtain2); rm.px(xx + 2, y0 + 12, curtain2); rm.px(xx + 1, y1, curtain2)
    rm.rect(x0 - 7, y0 - 6, x1 + 7, y0 - 4, C['gold'])
    if sill_pots:
        for k in (x0 + 3, x1 - 6):
            rm.rect(k, y1 - 3, k + 3, y1, hexc('#b8683a')); rm.px(k + 1, y1 - 4, C['rose']); rm.px(k + 2, y1 - 5, C['rose2']); rm.px(k, y1 - 4, C['leaf'])
    if rain: rm.fx.append(dict(type='rain', rect=[x0, y0, x1, y1]))

def portrait(rm, col, coat, oval=False, hair=None, tid=None):
    x = tx(col) + 3; y = rm.WT + 9
    if oval:
        rm.ell((x - 1, y - 1, x + 10, y + 15), C['gold']); rm.ell((x + 1, y + 1, x + 8, y + 13), hexc('#4a4038'))
        rm.ell((x + 2, y + 3, x + 7, y + 8), C['skin']); rm.rect(x + 2, y + 2, x + 7, y + 4, hair or C['hairD'])
        rm.poly([(x + 2, y + 13), (x + 7, y + 13), (x + 6, y + 8), (x + 3, y + 8)], coat)
    else:
        rm.rect(x - 1, y - 1, x + 10, y + 14, C['gold']); rm.rect(x, y, x + 9, y + 13, hexc('#3a3a30'))
        rm.ell((x + 2, y + 2, x + 7, y + 7), C['skin']); rm.rect(x + 2, y + 1, x + 7, y + 3, hair or C['white'])
        rm.poly([(x, y + 13), (x + 9, y + 13), (x + 7, y + 7), (x + 2, y + 7)], coat)
    if tid: rm.thing(tid, col, 2)

def landscape(rm, x0, x1, y0=None, h=14):
    y0 = rm.WT + 7 if y0 is None else y0
    rm.rect(x0, y0, x1, y0 + h, C['gold']); rm.rect(x0 + 1, y0 + 1, x1 - 1, y0 + h - 1, hexc('#9ab0c0'))
    rm.rect(x0 + 1, y0 + h // 2 + 1, x1 - 1, y0 + h - 1, hexc('#6a8a5a'))
    rm.ell((x0 + 4, y0 + 3, x0 + 11, y0 + 9), hexc('#4a6a4a'))
    rm.poly([(x1 - 12, y0 + h // 2 + 1), (x1 - 6, y0 + 3), (x1 - 2, y0 + h // 2 + 1)], hexc('#e8dcc0'))

def sconce(rm, col, off=7):
    x = tx(col) + off; y = rm.WT + 14
    rm.rect(x - 1, y, x + 1, y + 6, C['gold2']); rm.line((x - 4, y + 5, x + 4, y + 5), C['gold'])
    for k in (x - 4, x + 4): rm.rect(k, y + 1, k, y + 4, C['white']); rm.fx.append(dict(type='candle', at=[k, y]))

def fireplace(rm, col, w=2, tid=None, painting=True):
    fx0, fx1 = tx(col) + 2, tx(col + w) - 3
    WB, F0 = rm.WB, rm.F0
    if painting: landscape(rm, fx0 + 5, fx1 - 5)
    rm.rect(fx0 - 1, WB - 18, fx1 + 1, WB - 16, C['marble']); rm.line((fx0 - 1, WB - 15, fx1 + 1, WB - 15), C['marble3'])
    rm.rect(fx0 + 1, WB - 14, fx0 + 6, F0 + 3, C['marble']); rm.rect(fx1 - 6, WB - 14, fx1 - 1, F0 + 3, C['marble'])
    rm.line((fx0 + 6, WB - 14, fx0 + 6, F0 + 3), C['marble2']); rm.line((fx1 - 1, WB - 14, fx1 - 1, F0 + 3), C['marble2'])
    rm.rect(fx0 + 7, WB - 14, fx1 - 7, WB - 11, C['marble2'])
    fb = [fx0 + 7, WB - 10, fx1 - 7, F0 + 3]
    rm.rect(*fb, hexc('#1e1418'))
    rm.rect(fx0 - 3, F0 + 4, fx1 + 3, F0 + 7, C['marble3'])
    cx = (fx0 + fx1) // 2
    rm.rect(cx - 3, WB - 24, cx + 3, WB - 19, C['gold']); rm.ell((cx - 2, WB - 24, cx + 2, WB - 20), C['white'])
    for k in (fx0 + 2, fx1 - 4):
        rm.rect(k, WB - 22, k + 2, WB - 19, C['china']); rm.px(k + 1, WB - 23, C['rose']); rm.px(k, WB - 24, C['leaf'])
    rm.fx.append(dict(type='fire', rect=fb))
    rm.thing(tid or f'{rm.name}_fire', col, 3, col + w - 1, 3)

def clock(rm, col):
    x = tx(col); WT, F0 = rm.WT, rm.F0
    rm.shadow(x + 2, F0 + 4, x + 14, F0 + 9)
    rm.rect(x + 3, WT + 7, x + 12, F0 + 5, C['wood2']); rm.rect(x + 4, WT + 9, x + 11, WT + 17, C['wood3'])
    rm.ell((x + 4, WT + 9, x + 11, WT + 16), C['white']); rm.px(x + 7, WT + 11, C['ink']); rm.px(x + 8, WT + 13, C['ink']); rm.px(x + 7, WT + 12, C['ink'])
    rm.rect(x + 5, WT + 21, x + 10, F0 + 2, C['wood']); rm.ell((x + 6, WT + 36, x + 9, WT + 39), C['gold'])
    rm.poly([(x + 2, WT + 7), (x + 13, WT + 7), (x + 7, WT + 2)], C['wood2']); rm.px(x + 7, WT + 1, C['gold'])
    rm.thing(f'{rm.name}_clock', col, 3)

def china_cabinet(rm, col, tid=None):
    x0, x1 = tx(col) + 1, tx(col + 2) - 2; WT, WB, F0 = rm.WT, rm.WB, rm.F0
    rm.shadow(x0 - 1, F0 + 3, x1 + 1, F0 + 10)
    rm.rect(x0, WT + 6, x1, F0 + 6, C['wood2']); rm.rect(x0 - 1, WT + 5, x1 + 1, WT + 8, C['wood3'])
    rm.poly([(x0 + 6, WT + 5), (x1 - 6, WT + 5), ((x0 + x1) // 2, WT + 1)], C['wood3'])
    rm.rect(x0 + 2, WT + 10, x1 - 2, WB - 6, hexc('#5a6a7a'))
    for sy in range(WT + 17, WB - 6, 9):
        rm.line((x0 + 2, sy, x1 - 2, sy), C['wood3'])
        for k in range(x0 + 4, x1 - 4, 5):
            if rm.R.random() < .5: rm.ell((k, sy - 6, k + 4, sy - 1), C['china2']); rm.px(k + 2, sy - 4, C['china'])
            else: rm.rect(k + 1, sy - 5, k + 3, sy - 1, C['china2']); rm.px(k + 2, sy - 3, C['china'])
    rm.line(((x0 + x1) // 2, WT + 10, (x0 + x1) // 2, WB - 6), C['wood3'])
    rm.rect(x0 + 1, WB - 4, x1 - 1, F0 + 4, C['wood']); rm.line((x0 + 1, WB - 1, x1 - 1, WB - 1), C['wood3'])
    rm.thing(tid or f'{rm.name}_china', col, 3, col + 1, 3)

def bookcase(rm, col, w=2, tid=None):
    x0, x1 = tx(col) + 1, tx(col + w) - 2; WT, F0 = rm.WT, rm.F0
    rm.shadow(x0 - 1, F0 + 3, x1 + 1, F0 + 10)
    rm.rect(x0, WT + 5, x1, F0 + 6, C['wood2']); rm.rect(x0 - 1, WT + 4, x1 + 1, WT + 7, C['wood3'])
    for sy in range(WT + 15, F0 + 4, 9):
        rm.rect(x0 + 2, sy - 8, x1 - 2, sy, hexc('#3a2620'))
        x = x0 + 2
        while x < x1 - 2:
            w_ = rm.R.randint(2, 3); h_ = rm.R.randint(5, 8)
            rm.rect(x, sy - h_, min(x + w_ - 1, x1 - 2), sy - 1, rm.R.choice([C['rug'], C['rugB'], hexc('#5a6a3a'), hexc('#8a6a3a'), hexc('#6a3a5a'), C['wood3']]))
            rm.px(x, sy - h_ + 1, C['gold']); x += w_
        rm.line((x0 + 1, sy, x1 - 1, sy), C['wood3'])
    rm.thing(tid or f'{rm.name}_books', col, 3, col + w - 1, 3)

def plant(rm, c, r, s=1.0, pot=None, tid=None):
    cx, cy = tx(c) + 8, ty(r) + 9
    rm.shadow(cx - 7, cy + 4, cx + 7, cy + 9)
    pot = pot or hexc('#5a7aa8')
    rm.rect(cx - 5, cy - 2, cx + 5, cy + 6, pot); rm.rect(cx - 6, cy - 3, cx + 6, cy - 1, shade(pot, 1.3))
    rm.px(cx - 2, cy + 2, C['white']); rm.px(cx + 2, cy + 3, C['white'])
    for a in range(-170, -9, 18):
        for rr in range(3, int(13 * s)):
            xx = cx + rr * math.cos(math.radians(a)); yy = cy - 4 + rr * math.sin(math.radians(a)) + rr * rr * .035
            if 0 <= xx < rm.W: rm.px(int(xx), int(yy), C['leaf'] if rr % 3 else C['leaf2'])
    rm.thing(tid or f'{rm.name}_plant', c, r)

def wing_chair(rm, c, r, col=None):
    x, y = tx(c), ty(r) + 4
    col = col or (C['chair'], C['chair2'], C['chair3'])
    rm.shadow(x - 1, y + 12, x + 16, y + 18)
    rm.rect(x + 1, y - 6, x + 14, y + 6, col[1]); rm.rect(x + 2, y - 5, x + 13, y + 4, col[0])
    for k in range(x + 3, x + 13, 3): rm.px(k, y - 3, C['gold'])
    rm.rect(x + 1, y + 5, x + 14, y + 11, col[2]); rm.rect(x + 1, y + 11, x + 14, y + 14, col[1])
    rm.rect(x - 1, y - 2, x + 2, y + 13, col[1]); rm.rect(x + 13, y - 2, x + 16, y + 13, col[1])

def side_table(rm, c, r, what='tea'):
    x, y = tx(c) + 8, ty(r) + 6
    rm.shadow(x - 8, y + 6, x + 8, y + 11)
    rm.rect(x - 7, y, x + 6, y + 2, C['wood3']); rm.rect(x - 7, y + 3, x + 6, y + 6, C['wood'])
    for k in (x - 6, x + 5): rm.rect(k, y + 6, k, y + 10, C['wood2'])
    if what == 'tea':
        rm.rect(x - 4, y - 4, x - 1, y - 1, C['white']); rm.px(x, y - 3, C['white']); rm.px(x - 3, y - 5, C['white'])
        rm.ell((x + 1, y - 3, x + 5, y - 1), C['white']); rm.px(x + 3, y - 2, C['rose2'])
    elif what == 'lamp':
        rm.rect(x - 1, y - 8, x + 1, y, C['silver']); rm.ell((x - 5, y - 14, x + 5, y - 6), hexc('#f4ecd8'))
        rm.fx.append(dict(type='glow', at=[x, y - 10], r=12))
    elif what == 'books':
        rm.rect(x - 5, y - 3, x + 3, y - 1, C['rugB']); rm.rect(x - 4, y - 5, x + 2, y - 3, C['rug'])

def rug(rm, c0, r0, c1, r1, kind='red'):
    x0, y0, x1, y1 = tx(c0) + 2, ty(r0) + 2, tx(c1 + 1) - 3, ty(r1 + 1) - 3
    if kind == 'red':
        rm.rect(x0, y0, x1, y1, C['rug']); rm.d.rectangle((x0 + 2, y0 + 2, x1 - 2, y1 - 2), outline=C['rug3'])
        rm.d.rectangle((x0 + 5, y0 + 5, x1 - 5, y1 - 5), outline=C['rug2'])
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
        for k in range(3, 0, -1):
            rm.ell((cx - k * 8, cy - k * 4, cx + k * 8, cy + k * 4), outline=C['rug3'] if k % 2 else C['rug2'])
    elif kind == 'blue':
        rm.rect(x0, y0, x1, y1, C['rugB']); rm.d.rectangle((x0 + 2, y0 + 2, x1 - 2, y1 - 2), outline=C['rug3'])
        for k in range(x0 + 5, x1 - 4, 6):
            rm.poly([(k, y0 + 6), (k + 2, y0 + 4), (k + 4, y0 + 6), (k + 2, y0 + 8)], C['rugB2'])
            rm.poly([(k, y1 - 6), (k + 2, y1 - 8), (k + 4, y1 - 6), (k + 2, y1 - 4)], C['rugB2'])
    elif kind == 'aubusson':
        P1, P2, P3, P4 = hexc('#e9dcc4'), hexc('#c88a8a'), hexc('#8aa07a'), hexc('#b8a07a')
        rm.rect(x0, y0, x1, y1, P1); rm.d.rectangle((x0 + 2, y0 + 2, x1 - 2, y1 - 2), outline=P2); rm.d.rectangle((x0 + 4, y0 + 4, x1 - 4, y1 - 4), outline=P3)
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; rx, ry = (x1 - x0) // 3, (y1 - y0) // 3
        rm.ell((cx - rx, cy - ry, cx + rx, cy + ry), outline=P2); rm.ell((cx - rx + 6, cy - ry + 4, cx + rx - 6, cy + ry - 4), P4)
        rm.ell((cx - rx + 10, cy - ry + 7, cx + rx - 10, cy + ry - 7), P1)
        for a in range(0, 360, 30):
            xx, yy = cx + (rx - 8) * math.cos(math.radians(a)), cy + (ry - 5) * math.sin(math.radians(a))
            rm.ell((xx - 2, yy - 2, xx + 2, yy + 2), P2)
    elif kind == 'rag':
        cx, cy = (x0 + x1) // 2, (y0 + y1) // 2; rx, ry = (x1 - x0) // 2, (y1 - y0) // 2
        for k, c in enumerate([hexc('#8a5a4a'), hexc('#c8a06a'), hexc('#5a7a9a'), hexc('#b25a6a'), hexc('#d8c8a0'), hexc('#7a8a5a')]):
            rm.ell((cx - rx + k * 5, cy - ry + k * 3, cx + rx - k * 5, cy + ry - k * 3), c)
    elif kind == 'runner':
        rm.rect(x0, y0, x1, y1, C['rug']); rm.line((x0, y0 + 2, x1, y0 + 2), C['rug3']); rm.line((x0, y1 - 2, x1, y1 - 2), C['rug3'])
        for k in range(x0 + 4, x1 - 3, 8): rm.poly([(k, (y0 + y1) // 2), (k + 3, (y0 + y1) // 2 - 3), (k + 6, (y0 + y1) // 2), (k + 3, (y0 + y1) // 2 + 3)], C['rug2'])
    for k in range(x0, x1 + 1, 2): rm.px(k, y0 - 1, C['rug3'] if kind != 'rag' else C['wood3'])

def mat(rm, c, r, to, ac, ar, face='down', vertical=False, kind='mat'):
    """an exit runner on the floor edge (Pokémon-style); stepping on it leaves the room"""
    x0, y0 = tx(c), ty(r)
    if vertical: box = (x0 + 1, y0 - 3, x0 + 14, y0 + 18)
    else: box = (x0 - 3, y0 + 3, x0 + 18, y0 + 14)
    rm.rect(*box, C['rugB']); rm.d.rectangle((box[0] + 1, box[1] + 1, box[2] - 1, box[3] - 1), outline=C['rug3'])
    cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
    # chevrons pointing out of the room
    dirx = -1 if c == 0 else (1 if c == rm.cols - 1 else 0)
    for n in (0, 4):
        for j in range(3):
            if dirx: rm.px(cx + dirx * (j + n - 2), cy - 2 + j, C['rug3']); rm.px(cx + dirx * (j + n - 2), cy + 2 - j, C['rug3'])
            else: rm.px(cx - 2 + j, cy + j + n - 3, C['rug3']); rm.px(cx + 2 - j, cy + j + n - 3, C['rug3'])
    rm.warp(c, r, to, ac, ar, face=face, kind=kind)

def stairs_up(rm, c0, c1, to, ac, ar):
    """stair block rising into the back wall; the floor row in front of it leads up"""
    sx0, sx1 = tx(c0) + 3, tx(c1 + 1) - 4
    top, bot = rm.WT - 2, ty(rm.WALLROWS + 1) - 1
    rm.rect(sx0 - 4, top, sx1 + 4, bot, C['wood2'])
    rm.rect(sx0 - 3, top, sx0 - 1, bot, C['wood3']); rm.rect(sx1 + 1, top, sx1 + 3, bot, C['wood3'])
    n = 8; step = (bot - top) // n
    for i in range(n):
        y1 = bot - i * step; y0 = y1 - step + 1; k = 0.55 + 0.45 * (1 - i / n)
        rm.rect(sx0, y0, sx1, y1, shade(C['wain'], k)); rm.rect(sx0, y1 - 1, sx1, y1, C['wain3'])
        rm.rect(sx0 + 5, y0, sx1 - 5, y1 - 1, shade(C['rug'], k + .05))
        rm.px(sx0 + 5, y1 - 1, C['gold']); rm.px(sx1 - 5, y1 - 1, C['gold'])
    rm.rect(sx0 - 4, 0, sx1 + 4, top + 3, C['void'])
    for xx in (sx0 - 5, sx1 + 2):
        rm.rect(xx, bot - 7, xx + 3, bot + 3, C['wood']); rm.rect(xx - 1, bot - 9, xx + 4, bot - 7, C['gold'])
    rm.block(c0, 0, c1, rm.WALLROWS)
    for c in range(c0, c1 + 1): rm.warp(c, rm.WALLROWS, to, ac, ar, face='down', kind='stairs')

def stairs_down(rm, c0, r0, c1, r1, to, ac, ar, face='down'):
    """a stair well going down through the floor, with a banister"""
    x0, y0, x1, y1 = tx(c0) + 1, ty(r0) + 1, tx(c1 + 1) - 2, ty(r1 + 1) - 1
    n = (y1 - y0) // 6
    for i in range(n):
        k = 1 - i * 0.12
        rm.rect(x0, y0 + i * 6, x1, y0 + i * 6 + 5, shade(C['wain'], max(.35, k)))
        rm.line((x0, y0 + i * 6, x1, y0 + i * 6), shade(C['wain3'], max(.35, k)))
        rm.rect(x0 + 5, y0 + i * 6, x1 - 5, y0 + i * 6 + 4, shade(C['rug'], max(.35, k)))
    rm.rect(x0 - 3, y0 - 2, x0 - 1, y1, C['wood']); rm.rect(x1 + 1, y0 - 2, x1 + 3, y1, C['wood'])
    for yy in range(y0, y1, 4): rm.px(x0 - 2, yy, C['wood3']); rm.px(x1 + 2, yy, C['wood3'])
    for c in range(c0, c1 + 1):
        for r in range(r0, r1 + 1): rm.warp(c, r, to, ac, ar, face=face, kind='stairs')

def sparkle(rm, c, r, tid):
    rm.fx.append(dict(type='sparkle', at=[tx(c) + 8, ty(r) - 2], id=tid))
