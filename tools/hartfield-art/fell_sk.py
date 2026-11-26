"""Add Slovak letters (č ď ľ ĺ ň ŕ š ť ž + capitals) to IM Fell English (OFL) by composing them
from the font's own glyphs: the caron is the circumflex flipped, ľ ť ď take the apostrophe."""
import sys, copy
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphComponent, Glyph
from fontTools.pens.boundsPen import BoundsPen

def build(src, dst):
    f = TTFont(src); glyf = f['glyf']; hmtx = f['hmtx']; cmap = f.getBestCmap()
    order = f.getGlyphOrder()
    def bounds(name):
        bp = BoundsPen(f.getGlyphSet()); f.getGlyphSet()[name].draw(bp); return bp.bounds
    # caron = circumflex flipped vertically
    circ = copy.deepcopy(glyf['circumflex']); circ.expand(glyf)
    x0, y0, x1, y1 = bounds('circumflex')
    coords = circ.coordinates
    for i in range(len(coords)): coords[i] = (coords[i][0], y0 + y1 - coords[i][1])
    # flipping reverses winding: reverse every contour
    ends = list(circ.endPtsOfContours); start = 0; newc, newf = [], []
    for e in ends:
        seg = list(range(start, e + 1)); seg = [seg[0]] + seg[1:][::-1]
        newc += [coords[k] for k in seg]; newf += [circ.flags[k] for k in seg]; start = e + 1
    from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
    circ.coordinates = GlyphCoordinates(newc); circ.flags = bytearray(newf)
    circ.recalcBounds(glyf)
    glyf.glyphs['caron'] = circ; order.append('caron'); hmtx.metrics['caron'] = hmtx.metrics['circumflex']
    cx0, cy0, cx1, cy1 = bounds('circumflex')
    accw = cx1 - cx0
    xh = bounds('x')[3]; capH = bounds('H')[3]
    def compose(name, base, accent, uni, dy=0, dx=None, right=False):
        bx0, by0, bx1, by1 = bounds(base)
        ax0, ay0, ax1, ay1 = bounds(accent) if accent != 'caron' else (cx0, cy0, cx1, cy1)
        if right:
            x = bx1 - ax0 - 40; y = 0
        else:
            x = int((bx0 + bx1) / 2 - (ax0 + ax1) / 2) if dx is None else dx
            y = dy
        g = Glyph(); g.numberOfContours = -1; g.components = []
        for (gn, gx, gy) in ((base, 0, 0), (accent, x, y)):
            c = GlyphComponent(); c.glyphName = gn; c.x = gx; c.y = gy; c.flags = 0x4 if gn == base else 0; g.components.append(c)
        glyf.glyphs[name] = g; order.append(name)
        adv = hmtx.metrics[base][0] + (int((ax1 - ax0) * 0.55) if right else 0)
        hmtx.metrics[name] = (adv, hmtx.metrics[base][1])
        for t in f['cmap'].tables:
            if t.isUnicode(): t.cmap[uni] = name
    up = int(capH - xh) + 40
    lc = {'c': 0x10d, 'n': 0x148, 's': 0x161, 'z': 0x17e, 'e': 0x11b, 'r': 0x159}
    for b, u in lc.items(): compose(b + 'caron', b, 'caron', u)
    uc = {'C': 0x10c, 'N': 0x147, 'S': 0x160, 'Z': 0x17d, 'E': 0x11a, 'R': 0x158, 'D': 0x10e, 'T': 0x164}
    for b, u in uc.items(): compose(b + 'caron', b, 'caron', u, dy=up)
    for b, u in {'l': 0x13e, 't': 0x165, 'd': 0x10f}.items(): compose(b + 'caron', b, 'quoteright', u, right=True)
    compose('Lcaron', 'L', 'quoteright', 0x13d, right=True)
    ldy = int(bounds('l')[3] - xh) + 30
    compose('lacute', 'l', 'acute', 0x13a, dy=ldy); compose('racute', 'r', 'acute', 0x155)
    compose('Lacute', 'L', 'acute', 0x139, dy=up); compose('Racute', 'R', 'acute', 0x154, dy=up)
    f.setGlyphOrder(order); f['maxp'].numGlyphs = len(order)
    if 'post' in f and hasattr(f['post'], 'extraNames'): pass
    f['post'].formatType = 3.0
    f.flavor = 'woff2'; f.save(dst)

if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
