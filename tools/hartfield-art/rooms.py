"""The ten places of Act I. Each function paints a room and records its grid."""
import math
from kit import *

def emma():
    rm = Room('emma', 13, 10, seed=21); d = rm.d
    rm.floor('oak'); rm.wall('duck')
    WT, WB, F0 = rm.WT, rm.WB, rm.F0
    # window with chintz curtains + window seat
    window(rm, 1, curtain=hexc('#e2b8c0'), curtain2=hexc('#b86a7a'))
    x0, x1 = tx(1) + 3, tx(3) - 4
    rm.rect(x0 - 6, WB - 2, x1 + 6, F0 + 8, C['wood3']); rm.rect(x0 - 6, WB - 6, x1 + 6, WB - 2, hexc('#f3e3e3'))
    for k in (x0 - 3, x0 + 10): rm.ell((k, WB - 10, k + 9, WB - 3), hexc('#e2b8c0'))
    rm.thing('emma_window', 1, 3, 2, 3)
    portrait(rm, 3, hexc('#9ab0d0'), oval=True, hair=C['hair'], tid='emma_portrait')
    # dressing table with triple mirror (cols 4-5)
    x0, x1 = tx(4) + 2, tx(6) - 3
    rm.rect(x0 + 6, WT + 10, x1 - 6, WT + 30, C['gold']); rm.rect(x0 + 7, WT + 11, x1 - 7, WT + 29, hexc('#b8c8d4'))
    rm.rect(x0 + 1, WT + 16, x0 + 6, WT + 30, C['gold']); rm.rect(x0 + 2, WT + 17, x0 + 5, WT + 29, hexc('#a8b8c4'))
    rm.rect(x1 - 6, WT + 16, x1 - 1, WT + 30, C['gold']); rm.rect(x1 - 5, WT + 17, x1 - 2, WT + 29, hexc('#a8b8c4'))
    rm.line((x0 + 10, WT + 13, x0 + 14, WT + 20), C['white'])
    rm.shadow(x0 - 2, F0 + 6, x1 + 2, F0 + 12)
    rm.rect(x0 - 1, WB - 6, x1 + 1, WB - 3, C['wood4']); rm.rect(x0, WB - 2, x1, F0 + 8, hexc('#f3e3e3'))
    for k in range(x0, x1 + 1, 3): rm.line((k, WB - 2, k, F0 + 8), hexc('#e2b8c0'))
    for k, c in ((x0 + 3, hexc('#c8e0f0')), (x0 + 6, hexc('#e8b8d0')), (x1 - 5, hexc('#d0e8c8'))):
        rm.rect(k, WB - 10, k + 2, WB - 7, c); rm.px(k + 1, WB - 11, C['gold'])
    rm.ell((x0 + 10, WB - 10, x0 + 16, WB - 6), hexc('#f0d8e0'))
    rm.thing('emma_dresser', 4, 3, 5, 3)
    fireplace(rm, 6, tid='emma_fire')
    # four-poster bed cols 8-10, rows 2-5
    bx0, bx1 = tx(8) + 2, tx(11) - 3; by1 = ty(6) - 2
    rm.shadow(bx0 - 4, by1 - 4, bx1 + 4, by1 + 7)
    rm.rect(bx0, WT + 1, bx1, WT + 8, hexc('#e9c9cf'))
    for k in range(bx0, bx1 + 1, 4): d.arc((k, WT + 4, k + 4, WT + 10), 0, 180, fill=hexc('#b86a7a'))
    rm.rect(bx0, WT, bx1, WT + 1, C['gold'])
    rm.rect(bx0 + 3, WT + 8, bx1 - 3, WB, hexc('#f3e3e3'))
    for k in range(bx0 + 5, bx1 - 3, 6): rm.line((k, WT + 9, k, WB), hexc('#e2b8c0'))
    rm.rect(bx0 + 4, WT + 18, bx1 - 4, WB - 2, C['wood3']); d.arc((bx0 + 8, WT + 14, bx1 - 8, WT + 28), 180, 360, fill=C['gold'])
    for xx in (bx0, bx1 - 3): rm.rect(xx, WT, xx + 3, by1, C['wood2']); rm.px(xx + 1, WT + 20, C['gold'])
    rm.rect(bx0 + 4, WB, bx1 - 4, by1 - 6, C['white'])
    for k in (bx0 + 6, bx0 + 24): rm.ell((k, WB + 1, k + 14, WB + 10), hexc('#fbf8f2'))
    rm.rect(bx0 + 4, WB + 12, bx1 - 4, by1 - 6, hexc('#f3e3e3'))
    for yy in range(WB + 15, by1 - 8, 7):
        for xx in range(bx0 + 8 + (yy // 7 % 2) * 5, bx1 - 6, 10): rm.px(xx, yy, hexc('#b86a7a')); rm.px(xx + 1, yy, hexc('#b86a7a')); rm.px(xx, yy + 1, C['leaf3'])
    rm.rect(bx0 + 4, by1 - 6, bx1 - 4, by1, hexc('#e2b8c0'))
    rm.poly([(bx0 + 22, WB + 22), (bx0 + 36, WB + 18), (bx0 + 40, WB + 28), (bx0 + 26, WB + 31)], hexc('#7fa6d8'))
    rm.thing('emma_bed', 8, 3, 10, 5)
    # bedside table with candle (col 11) and wardrobe (col 12)
    x = tx(11) + 2
    rm.shadow(x - 2, F0 + 10, x + 14, F0 + 16)
    rm.rect(x, WB - 4, x + 12, WB - 1, C['wood4']); rm.rect(x, WB - 1, x + 12, F0 + 10, C['wood'])
    rm.rect(x + 3, WB - 11, x + 4, WB - 5, C['white']); rm.rect(x + 1, WB - 5, x + 6, WB - 4, C['gold'])
    rm.fx.append(dict(type='candle', at=[x + 3, WB - 12]))
    rm.thing('emma_bedside', 11, 3)
    x0, x1 = tx(12) + 1, tx(13) - 3
    rm.rect(x0, WT + 4, x1, F0 + 8, C['wood2']); rm.rect(x0 - 1, WT + 3, x1 + 1, WT + 6, C['wood3'])
    rm.rect(x0 + 2, WT + 8, x1 - 2, F0 + 2, C['wood']); d.rectangle((x0 + 3, WT + 10, x1 - 3, WT + 30), outline=C['wood3'])
    rm.px(x0 + 3, WT + 32, C['gold']); rm.ell((x0, WT - 3, x1, WT + 4), hexc('#e8b8c8'))
    rm.thing('emma_wardrobe', 12, 3)
    # embroidery frame (Needlework) col 2, row 5
    x, y = tx(2) + 1, ty(5) + 2
    rm.shadow(x - 1, y + 10, x + 15, y + 14)
    for k in (x + 2, x + 12): rm.line((k, y + 4, k, y + 12), C['wood2'])
    rm.rect(x, y - 4, x + 14, y + 4, C['wood3']); rm.rect(x + 2, y - 3, x + 12, y + 3, hexc('#f4ecd8'))
    for k in range(4): rm.px(x + 4 + k * 2, y - 1, C['rose']); rm.px(x + 5 + k * 2, y + 1, C['leaf'])
    rm.thing('needlework', 2, 5)
    # chaise longue on the left (col 0, rows 6-7) – Papa's shawl lies on it
    x, y = 2, ty(6)
    rm.shadow(x - 2, y + 28, x + 16, y + 34)
    rm.rect(x, y, x + 5, y + 28, hexc('#5a7a9a')); rm.rect(x + 1, y + 2, x + 4, y + 26, hexc('#7a9aba'))
    rm.rect(x + 5, y + 4, x + 12, y + 28, hexc('#9ab8d4')); rm.rect(x + 4, y - 1, x + 13, y + 4, C['wood'])
    rm.thing('emma_chaise', 0, 6, 0, 7)
    # Aubusson rug
    rug(rm, 4, 6, 9, 8, 'aubusson')
    # easel with Harriet's half-finished portrait (col 11, rows 6-7)
    x, y = tx(11), ty(6) + 2
    rm.shadow(x - 3, y + 24, x + 19, y + 29)
    rm.line((x + 2, y - 8, x - 1, y + 26), C['wood3']); rm.line((x + 14, y - 8, x + 17, y + 26), C['wood3']); rm.line((x + 8, y - 10, x + 8, y + 24), C['wood2'])
    rm.rect(x - 1, y + 12, x + 17, y + 13, C['wood3'])
    rm.rect(x, y - 6, x + 16, y + 12, C['gold2']); rm.rect(x + 1, y - 5, x + 15, y + 11, hexc('#e8dcc8'))
    rm.ell((x + 4, y - 3, x + 12, y + 5), C['skin']); rm.rect(x + 4, y - 4, x + 12, y - 1, C['hair'])
    rm.poly([(x + 3, y + 11), (x + 13, y + 11), (x + 11, y + 5), (x + 5, y + 5)], C['pink'])
    rm.thing('emma_easel', 11, 6, 11, 7)
    # drawing table (cols 1-2, row 8)
    x, y = tx(1) + 2, ty(8) + 4
    rm.shadow(x - 2, y + 11, x + 28, y + 16)
    rm.rect(x, y, x + 26, y + 3, C['wood4']); rm.rect(x, y + 3, x + 26, y + 8, C['wood'])
    for k in (x + 1, x + 24): rm.rect(k, y + 8, k + 1, y + 13, C['wood2'])
    rm.rect(x + 2, y - 6, x + 13, y + 1, hexc('#3a4a5a')); rm.rect(x + 3, y - 5, x + 12, y, hexc('#efe6d2'))
    for k, c in enumerate((C['rose'], hexc('#5a7aa8'), C['warm'], C['leaf'])): rm.px(x + 17 + k * 2, y - 1, c)
    rm.rect(x + 16, y - 3, x + 24, y + 1, C['white'])
    rm.thing('emma_portfolio', 1, 8, 2, 8)
    # canary on a stand (col 12, row 8)
    x, y = tx(12) + 6, ty(8) + 2
    rm.shadow(x - 6, y + 12, x + 8, y + 16)
    rm.rect(x + 1, y, x + 2, y + 13, C['gold2']); rm.line((x - 3, y + 13, x + 6, y + 13), C['gold2'])
    rm.ell((x - 5, y - 14, x + 8, y + 1), outline=C['gold'])
    for k in range(x - 3, x + 7, 3): rm.line((k, y - 12, k, y), C['gold'])
    rm.fx.append(dict(type='canary', at=[x, y - 8]))
    rm.thing('emma_canary', 12, 8)
    # flowers in a jardinière (col 4, row 5)
    x, y = tx(4) + 8, ty(5) + 6
    rm.shadow(x - 7, y + 10, x + 7, y + 14)
    rm.rect(x - 1, y + 2, x + 1, y + 11, C['wood2']); rm.ell((x - 6, y - 4, x + 6, y + 3), C['china2'])
    for _ in range(60):
        a = rm.R.random() * math.pi; r_ = rm.R.random() ** .7 * 9
        rm.px(int(x + r_ * math.cos(a) * 1.2), int(y - 5 - r_ * math.sin(a) * .9), rm.R.choice([C['rose'], C['rose2'], C['white'], C['leaf'], C['leaf2']]))
    rm.thing('emma_flowers', 4, 5)
    mat(rm, 6, 9, 'gallery', 3, 3, face='down')
    return rm

def gallery():
    rm = Room('gallery', 16, 6, seed=3)
    rm.floor('oak'); rm.wall('sage')
    door(rm, 1, 'attic', 8, 7, kind='plain')
    door(rm, 3, 'emma', 6, 8)
    window(rm, 5, curtain=C['rugB'], curtain2=C['rugB2'])
    rm.thing('gallery_window', 5, 2, 6, 2)
    door(rm, 8, None, 0, 0, locked='papa_door')
    portrait(rm, 9, hexc('#3a4a6a'), tid='gallery_portrait')
    door(rm, 10, None, 0, 0, kind='white', locked='harriet_door')
    sconce(rm, 7); sconce(rm, 12)
    rug(rm, 0, 4, 12, 4, 'runner')
    # console with a vase (col 12)
    x, y = tx(11) + 1, rm.F0 - 4
    rm.shadow(x - 2, y + 14, x + 16, y + 19)  # console
    rm.rect(x, y, x + 14, y + 3, C['wood4']); rm.rect(x, y + 3, x + 14, y + 7, C['wood'])
    for k in (x + 1, x + 12): rm.rect(k, y + 7, k + 1, y + 14, C['wood2'])
    rm.rect(x + 5, y - 7, x + 9, y, C['china2']); rm.px(x + 7, y - 4, C['china'])
    for _ in range(30): rm.px(x + 7 + rm.R.randint(-5, 5), y - 9 + rm.R.randint(-4, 2), rm.R.choice([C['rose'], C['white'], C['leaf']]))
    rm.thing('gallery_vase', 11, 3)
    plant(rm, 0, 3, .8)
    stairs_down(rm, 14, 4, 15, 5, 'hall', 11, 4, face='down')
    x = tx(13) + 13
    rm.rect(x, ty(4) - 2, x + 2, rm.H, C['wood']); rm.rect(x - 1, ty(4) - 4, x + 3, ty(4) - 2, C['gold'])
    rm.block(13, 4, 13, 5)
    return rm

def attic():
    rm = Room('attic', 10, 9, seed=4)
    P = dict(beam=hexc('#5a3e2c'), beam2=hexc('#7a563c'), stain=hexc('#cfc3a8'))
    rm.floor('pale', worn=.02); rm.wall('plaster')
    WT, WB, F0 = rm.WT, rm.WB, rm.F0; d = rm.d
    rm.rect(0, WT, rm.W, WT + 9, P['beam'])
    for x in range(0, rm.W, 24): rm.rect(x, WT, x + 3, WT + 9, P['beam2'])
    rm.line((0, WT + 10, rm.W, WT + 10), hexc('#3a281c'))
    rm.ell((tx(7), WT + 16, tx(7) + 18, WT + 28), P['stain'])
    # dormer window cols 4-5
    x0, x1, y0, y1 = tx(4) + 3, tx(6) - 4, WT + 12, WT + 34
    rm.rect(x0 - 4, y0 - 4, x1 + 4, y1 + 4, hexc('#d8cfbc')); rm.rect(x0 - 6, y0 - 6, x1 + 6, y0 - 4, P['beam2'])
    rm.rect(x0, y0, x1, y1, C['glass']); rm.line(((x0 + x1) // 2, y0, (x0 + x1) // 2, y1), C['frame']); rm.line((x0, (y0 + y1) // 2, x1, (y0 + y1) // 2), C['frame'])
    d.rectangle((x0, y0, x1, y1), outline=C['frame']); rm.rect(x0 - 3, y1 + 1, x1 + 3, y1 + 3, C['wood3'])
    rm.rect(x0 + 2, y1 - 4, x0 + 5, y1, hexc('#9a6a4a')); rm.px(x0 + 3, y1 - 5, C['leaf']); rm.px(x0 + 4, y1 - 6, hexc('#a8c8e8'))
    rm.fx.append(dict(type='rain', rect=[x0, y0, x1, y1]))
    rm.thing('attic_window', 4, 2, 5, 2)
    # peg rail with dresses (cols 0-2)
    rm.rect(3, WT + 14, 44, WT + 15, C['wood3'])
    rm.poly([(4, WT + 17), (13, WT + 17), (15, WB - 4), (2, WB - 4)], hexc('#7a5a8a'))
    rm.poly([(18, WT + 17), (27, WT + 17), (29, WT + 34), (16, WT + 34)], hexc('#c8a06a'))
    rm.ell((32, WT + 16, 42, WT + 23), C['white'])
    rm.thing('attic_pegs', 0, 2, 2, 2)
    # mirror + sampler on the wall (cols 6-7)
    x = tx(6) + 3
    rm.rect(x - 1, WT + 15, x + 9, WT + 28, C['wood3']); rm.rect(x, WT + 16, x + 8, WT + 27, hexc('#a8b8c8')); rm.line((x + 2, WT + 18, x + 5, WT + 23), C['white'])
    rm.thing('attic_mirror', 6, 2)
    x = tx(7) + 3
    rm.rect(x - 1, WT + 15, x + 10, WT + 30, C['wood']); rm.rect(x, WT + 16, x + 9, WT + 29, hexc('#efe6d2'))
    for k in range(x + 1, x + 9, 2): rm.px(k, WT + 18, C['rug']); rm.px(k + 1, WT + 21, C['rugB'])
    rm.px(x + 4, WT + 25, C['rose']); rm.px(x + 5, WT + 25, C['rose'])
    rm.thing('attic_sampler', 7, 2)
    # shelf with candle (cols 8-9)
    rm.rect(tx(8) + 2, WT + 22, rm.W - 4, WT + 24, C['wood3']); rm.rect(tx(8) + 5, WT + 16, tx(8) + 10, WT + 21, hexc('#8a6a6a'))
    rm.rect(tx(9) + 2, WT + 17, tx(9) + 4, WT + 21, C['white'])
    rm.thing('attic_shelf', 8, 2, 9, 2)
    # iron bed (cols 0-2, rows 3-5)
    bx0, bx1, by0, by1 = 3, 44, WB - 10, ty(6) - 2
    rm.shadow(bx0 - 2, by1 - 4, bx1 + 2, by1 + 5)
    for k in range(bx0, bx1 + 1, 5): rm.line((k, by0 - 4, k, by0 + 6), C['iron2'])
    rm.rect(bx0 - 1, by0 - 6, bx1 + 1, by0 - 4, C['iron']); rm.rect(bx0 - 2, by0 - 8, bx0, by1, C['iron']); rm.rect(bx1, by0 - 8, bx1 + 2, by1, C['iron'])
    rm.rect(bx0 + 1, by0 + 2, bx1 - 1, by0 + 12, C['white']); rm.ell((bx0 + 6, by0 + 3, bx1 - 6, by0 + 11), hexc('#f8f4ec'))
    rm.rect(bx0 + 1, by0 + 12, bx1 - 1, by1 - 4, hexc('#efe6d2'))
    q = [hexc('#b25a6a'), hexc('#e0b870'), hexc('#5a7a9a'), hexc('#6a9a5a'), hexc('#efe6d2')]
    for yy in range(by0 + 13, by1 - 4, 5):
        for xx in range(bx0 + 1, bx1 - 1, 5): rm.rect(xx, yy, min(xx + 4, bx1 - 1), min(yy + 4, by1 - 5), q[(xx // 5 * 3 + yy // 5) % 5])
    rm.rect(bx0 + 1, by1 - 4, bx1 - 1, by1, hexc('#b25a6a'))
    rm.rect(bx0 + 16, by0 + 6, bx0 + 23, by0 + 11, hexc('#3a2a2a')); rm.px(bx0 + 22, by0 + 5, C['rose']); rm.px(bx0 + 23, by0 + 5, C['leaf'])
    rm.thing('attic_bed', 0, 3, 2, 5)
    sparkle(rm, 1, 3, 'attic_bed')
    # washstand col 3
    x, y = tx(3) + 2, WB - 6
    rm.shadow(x - 2, y + 18, x + 16, y + 24)
    rm.rect(x, y + 4, x + 14, y + 7, C['marble']); rm.rect(x, y + 7, x + 14, y + 20, C['wood3'])
    rm.ell((x + 1, y + 1, x + 11, y + 6), C['china2']); rm.rect(x + 8, y - 5, x + 12, y + 2, C['china2'])
    rm.thing('attic_wash', 3, 3)
    # table with slate & primer (cols 6-7, row 4) and chair (col 8)
    x, y = tx(6) + 2, ty(4) + 4
    rm.shadow(x - 2, y + 14, x + 28, y + 20)
    rm.rect(x, y, x + 26, y + 3, C['wood4']); rm.rect(x, y + 3, x + 26, y + 8, C['wood'])
    for k in (x + 1, x + 24): rm.rect(k, y + 8, k + 1, y + 14, C['wood2'])
    rm.rect(x + 2, y - 5, x + 10, y + 1, hexc('#4a4e52')); d.rectangle((x + 2, y - 5, x + 10, y + 1), outline=C['wood3'])
    rm.px(x + 4, y - 3, C['white']); rm.px(x + 5, y - 3, C['white']); rm.px(x + 7, y - 2, C['white'])
    rm.rect(x + 13, y - 3, x + 20, y + 1, hexc('#b8483a')); rm.rect(x + 22, y - 6, x + 24, y, C['white'])
    rm.fx.append(dict(type='candle', at=[x + 23, y - 7]))
    rm.thing('attic_table', 6, 4, 7, 4)
    x, y = tx(8) + 3, ty(4) + 6
    rm.rect(x + 1, y - 6, x + 11, y + 2, C['wood']); rm.rect(x, y + 2, x + 12, y + 8, C['wood4']); rm.rect(x + 2, y + 1, x + 10, y + 5, C['white'])
    rm.block(8, 4)
    # trunk (cols 0-1, row 7)
    x, y = 4, ty(7) + 2
    rm.shadow(x - 2, y + 12, x + 28, y + 18)
    rm.rect(x, y, x + 26, y + 4, hexc('#6a7a6a')); rm.rect(x, y + 4, x + 26, y + 13, hexc('#4e5e4e'))
    for k in (x + 3, x + 23): rm.rect(k, y, k + 1, y + 13, hexc('#8a9a7a'))
    rm.rect(x + 11, y + 6, x + 15, y + 9, C['gold2'])
    rm.thing('attic_trunk', 0, 7, 1, 7)
    rug(rm, 3, 5, 6, 7, 'rag')
    # leak basin (col 7, row 6)
    x, y = tx(7) + 3, ty(6) + 5
    rm.ell((x, y, x + 10, y + 6), C['iron2']); rm.ell((x + 2, y + 1, x + 8, y + 4), hexc('#8ea2b0'))
    rm.fx.append(dict(type='drip', at=[x + 5, rm.WT + 28], to=y + 2))
    rm.thing('attic_leak', 7, 6)
    # waste basket (col 8, row 6)
    x, y = tx(8) + 3, ty(6) + 3
    rm.shadow(x - 3, y + 10, x + 14, y + 15)
    rm.poly([(x, y), (x + 10, y), (x + 9, y + 10), (x + 1, y + 10)], C['wood4'])
    for k in range(x + 1, x + 10, 2): rm.line((k, y + 1, k, y + 9), C['wood3'])
    rm.ell((x - 1, y - 2, x + 11, y + 2), C['wood3'])
    for (a, b) in ((x + 2, y - 3), (x + 6, y - 4), (x + 12, y + 7)): rm.ell((a, b, a + 4, b + 3), C['white'])
    rm.thing('attic_basket', 8, 6)
    sparkle(rm, 8, 6, 'attic_basket')
    stairs_down(rm, 8, 8, 9, 8, 'gallery', 1, 3, face='down')
    return rm

def hall():
    rm = Room('hall', 14, 11, seed=9)
    rm.floor('oak'); rm.wall('cream')
    window(rm, 1)
    door(rm, 3, 'drawing', 6, 8)
    clock(rm, 4)
    fireplace(rm, 5, w=3, tid='hall_fire')
    portrait(rm, 8, hexc('#2a4a3a'), tid='hall_portrait')
    door(rm, 9, 'dining', 10, 7)
    sconce(rm, 8, off=2)
    stairs_up(rm, 11, 12, 'gallery', 14, 3)
    rm.block(13, 0, 13, 3)
    # china cabinet in the corner (col 13 is the banister) -> bookcase instead at cols 0? keep simple
    rug(rm, 4, 4, 8, 5, 'blue')
    wing_chair(rm, 4, 4); wing_chair(rm, 8, 4)
    rm.block(4, 4); rm.block(8, 4)
    side_table(rm, 6, 4, 'tea'); rm.thing('hall_tea', 6, 4)
    # centre table with flowers on a red rug
    rug(rm, 4, 6, 9, 8, 'red')
    cx, cy = tx(7), ty(7) + 6
    rm.shadow(cx - 15, cy + 6, cx + 15, cy + 13)
    rm.rect(cx - 3, cy, cx + 3, cy + 9, C['wood2'])
    rm.ell((cx - 14, cy - 8, cx + 14, cy + 5), C['wood']); rm.ell((cx - 14, cy - 10, cx + 14, cy + 3), C['wood3'])
    rm.rect(cx - 3, cy - 11, cx + 3, cy - 4, C['china2'])
    for _ in range(90):
        a = rm.R.random() * math.pi; r_ = rm.R.random() ** .7 * 12
        rm.px(int(cx + r_ * math.cos(a) * 1.15), int(cy - 12 - r_ * math.sin(a) * .85), rm.R.choice([C['rose'], C['rose'], C['rose2'], C['white'], C['warm'], C['leaf'], C['leaf2']]))
    rm.thing('hall_table', 6, 7, 7, 7)
    # hall table under the stairs with the silver salver of letters (cols 11-12, row 5)
    x, y = tx(11) + 2, ty(5) + 4
    rm.shadow(x - 2, y + 11, x + 28, y + 16)
    rm.rect(x, y, x + 26, y + 3, C['wood4']); rm.rect(x, y + 3, x + 26, y + 8, C['wood'])
    for k in (x + 1, x + 24): rm.rect(k, y + 8, k + 1, y + 13, C['wood2'])
    rm.ell((x + 3, y - 3, x + 13, y + 1), C['silver']); rm.rect(x + 5, y - 3, x + 11, y - 1, C['white']); rm.px(x + 8, y - 2, C['rose'])
    rm.ell((x + 16, y - 5, x + 25, y + 1), hexc('#3a3a4a')); rm.rect(x + 18, y - 9, x + 23, y - 3, hexc('#3a3a4a'))
    rm.thing('hall_salver', 11, 5, 12, 5)
    # settee on the left wall (col 0, rows 5-6)
    x, y = 2, ty(5)
    rm.shadow(x - 2, y + 28, x + 16, y + 34)
    rm.rect(x, y, x + 5, y + 28, C['rug']); rm.rect(x + 1, y + 2, x + 4, y + 26, C['rug2'])
    rm.rect(x + 5, y + 4, x + 12, y + 28, hexc('#c86a7a')); rm.rect(x + 4, y - 1, x + 13, y + 4, C['wood'])
    rm.thing('hall_settee', 0, 5, 0, 6)
    # pianoforte? no – a marble bust and an umbrella stand by the door
    x, y = tx(12) + 3, ty(8)
    rm.shadow(x - 3, y + 16, x + 13, y + 21)
    rm.rect(x, y + 2, x + 10, y + 18, C['marble']); rm.rect(x - 1, y, x + 11, y + 2, C['marble2'])
    rm.ell((x + 2, y - 10, x + 8, y - 3), C['white']); rm.poly([(x, y), (x + 10, y), (x + 7, y - 4), (x + 3, y - 4)], C['white'])
    rm.thing('hall_bust', 12, 8)
    x = tx(9) + 4; y = ty(9)
    rm.rect(x, y, x + 7, y + 12, hexc('#5a7aa8')); rm.px(x + 2, y + 4, C['white'])
    for k, c in ((x + 1, hexc('#7a3550')), (x + 4, hexc('#2a3a2a'))): rm.line((k, y - 9, k + 1, y + 1), c)
    rm.thing('hall_umbrellas', 9, 9)
    plant(rm, 1, 9); plant(rm, 12, 10, .8)
    # columns flanking the front door
    for col in (4, 9):
        x = tx(col) + 3; yt, yb = ty(9) - 2, ty(10) + 12
        if col == 9: continue
        rm.shadow(x - 3, yb - 2, x + 13, yb + 4)
        rm.rect(x - 1, yt - 4, x + 11, yt - 1, C['marble']); rm.rect(x + 1, yt - 1, x + 9, yb - 3, C['marble'])
        for k in (x + 3, x + 6): rm.line((k, yt - 1, k, yb - 3), C['marble2'])
        rm.rect(x - 1, yb - 3, x + 11, yb, C['marble2'])
        rm.block(col, 9, col, 10)
    # front door mat (bottom) – leads nowhere today: it is pouring
    x0 = tx(6)
    rm.rect(x0 + 2, rm.H - 7, tx(8) - 3, rm.H - 1, hexc('#7a5a3a'))
    for k in range(x0 + 4, tx(8) - 4, 3): rm.line((k, rm.H - 6, k, rm.H - 2), hexc('#8a6a48'))
    rm.thing('front_door', 6, 10, 7, 10, solid=True)
    mat(rm, 0, 8, 'corridor', 1, 4, face='right', vertical=True)
    return rm

def drawing():
    rm = Room('drawing', 13, 10, seed=12)
    rm.floor('dark'); rm.wall('rose')
    window(rm, 1)
    # pianoforte against the wall (cols 3-4)
    x, y = tx(3) + 2, rm.WB - 8
    rm.shadow(x - 2, y + 22, x + 30, y + 28)
    rm.rect(x, y, x + 28, y + 14, C['wood2']); rm.rect(x + 1, y + 1, x + 27, y + 12, C['wood'])
    rm.rect(x + 3, y + 14, x + 25, y + 18, C['white'])
    for k in range(x + 5, x + 25, 3): rm.rect(k, y + 14, k + 1, y + 16, C['ink'])
    rm.rect(x + 1, y + 18, x + 27, y + 21, C['wood2'])
    rm.rect(x + 9, y - 6, x + 19, y + 1, C['white']); rm.line((x + 10, y - 4, x + 18, y - 4), C['ink'])
    rm.thing('piano', 3, 3, 4, 3)
    fireplace(rm, 6, tid='drawing_fire')
    wing_chair(rm, 6, 4, col=(hexc('#a86a7a'), hexc('#7a4a5a'), hexc('#c88a98')))
    wing_chair(rm, 9, 4)
    rm.block(9, 4)
    # Papa's fire screen (col 5, row 4)
    x = tx(5) + 4
    rm.rect(x, ty(4) - 4, x + 8, ty(4) + 14, C['gold2']); rm.rect(x + 1, ty(4) - 3, x + 7, ty(4) + 13, hexc('#efe2c8'))
    for k in range(4): rm.px(x + 3 + k % 2, ty(4) + k * 4, C['rose']); rm.px(x + 4, ty(4) + 1 + k * 4, C['leaf'])
    rm.thing('fire_screen', 5, 4)
    rug(rm, 4, 4, 10, 5, 'aubusson')
    window(rm, 9, curtain=hexc('#c86a7a'))
    bookcase(rm, 11, 2, tid='drawing_books')
    # backgammon table (cols 10-11, row 6)
    x, y = tx(10) + 2, ty(6) + 4
    rm.shadow(x - 2, y + 11, x + 28, y + 16)
    rm.rect(x, y, x + 26, y + 3, C['wood4']); rm.rect(x, y + 3, x + 26, y + 8, C['wood'])
    for k in (x + 1, x + 24): rm.rect(k, y + 8, k + 1, y + 13, C['wood2'])
    rm.rect(x + 4, y - 4, x + 22, y + 1, hexc('#2e5238'))
    for k in range(x + 5, x + 22, 3): rm.poly([(k, y - 4), (k + 2, y - 4), (k + 1, y - 1)], C['rug3'] if (k // 3) % 2 else C['rug'])
    rm.px(x + 8, y, C['white']); rm.px(x + 15, y - 2, C['ink'])
    rm.thing('backgammon', 10, 6, 11, 6)
    # sofa (cols 3-6, row 7)
    x, y = tx(3) + 2, ty(7)
    rm.shadow(x - 2, y + 14, x + 62, y + 20)
    rm.rect(x, y - 4, x + 60, y + 4, hexc('#7a4a5a')); rm.rect(x + 1, y - 3, x + 59, y + 2, hexc('#a86a7a'))
    for k in range(x + 4, x + 58, 6): rm.px(k, y - 1, C['gold'])
    rm.rect(x, y + 4, x + 60, y + 10, hexc('#c88a98')); rm.rect(x, y + 10, x + 60, y + 14, hexc('#7a4a5a'))
    rm.rect(x - 2, y, x + 1, y + 14, C['wood']); rm.rect(x + 59, y, x + 62, y + 14, C['wood'])
    rm.ell((x + 8, y + 2, x + 16, y + 8), hexc('#f0d0a0')); rm.ell((x + 44, y + 2, x + 52, y + 8), hexc('#d0e0f0'))
    rm.thing('drawing_sofa', 3, 7, 6, 7)
    # harp (col 11, row 8)
    x, y = tx(11) + 3, ty(8) - 8
    rm.shadow(x - 4, y + 22, x + 14, y + 27)
    rm.line((x, y, x + 8, y + 22), C['gold']); rm.line((x + 1, y, x + 9, y + 22), C['gold2'])
    rm.d.arc((x - 2, y - 6, x + 16, y + 10), 180, 330, fill=C['gold'])
    rm.line((x + 14, y + 2, x + 14, y + 24), C['gold'])
    for k in range(3, 13, 2): rm.line((x + k, y + 2 + k // 2, x + k, y + 21 - (12 - k) // 3), hexc('#efe6d2'))
    rm.rect(x + 5, y + 22, x + 16, y + 25, C['wood3'])
    rm.thing('harp', 11, 8)
    plant(rm, 0, 3); plant(rm, 0, 8, .9)
    mat(rm, 6, 9, 'hall', 3, 3, face='down')
    return rm

def dining():
    rm = Room('dining', 12, 9, seed=13)
    rm.floor('dark'); rm.wall('sage')
    window(rm, 1); portrait(rm, 3, hexc('#6a3a3a'), tid='dining_portrait')
    # sideboard with silver (cols 4-7)
    x0, x1 = tx(4) + 2, tx(8) - 3; y = rm.WB - 8
    landscape(rm, x0 + 14, x1 - 14, rm.WT + 6, 16)
    rm.shadow(x0 - 2, rm.F0 + 6, x1 + 2, rm.F0 + 12)
    rm.rect(x0, y, x1, y + 3, C['wood4']); rm.rect(x0, y + 3, x1, rm.F0 + 8, C['wood'])
    for k in range(x0 + 4, x1 - 4, 14): rm.d.rectangle((k, y + 6, k + 10, rm.F0 + 4), outline=C['wood3'])
    for k in range(x0 + 3, x1 - 3, 6):
        rm.rect(k, y - 6, k + 3, y - 1, C['silver']); rm.px(k + 1, y - 7, C['silver']); rm.px(k + 1, y - 4, C['white'])
    rm.ell((x0 + 24, y - 5, x0 + 36, y), C['silver'])
    rm.thing('sideboard', 4, 3, 7, 3)
    china_cabinet(rm, 9, 'dining_china')
    sconce(rm, 8, off=4)
    # long table with chairs (cols 3-8, rows 6-7)
    x0, y0, x1, y1 = tx(3) + 2, ty(6) - 2, tx(9) - 3, ty(8) - 6
    for cc in range(3, 9, 2):
        for yy, back in ((y0 - 10, True), (y1 + 1, False)):
            xx = tx(cc) + 10
            rm.rect(xx, yy, xx + 10, yy + 8, hexc('#7a3a4a')); rm.rect(xx - 1, yy + (0 if back else 6), xx + 11, yy + (3 if back else 9), C['wood'])
    rm.shadow(x0 - 2, y1 - 2, x1 + 2, y1 + 6)
    rm.rect(x0, y0, x1, y1, C['wood3']); rm.rect(x0, y1, x1, y1 + 4, C['wood']); rm.rect(x0 + 2, y0 + 2, x1 - 2, y1 - 2, C['white'])
    for k in range(x0 + 8, x1 - 6, 16):
        rm.ell((k, y0 + 6, k + 7, y0 + 11), C['china2']); rm.px(k + 3, y0 + 8, C['china'])
    rm.rect((x0 + x1) // 2 - 2, y0 + 3, (x0 + x1) // 2 + 2, y0 + 9, C['silver'])
    for _ in range(30): rm.px((x0 + x1) // 2 + rm.R.randint(-6, 6), y0 + 1 + rm.R.randint(-4, 3), rm.R.choice([C['rose'], C['white'], C['leaf']]))
    rm.thing('dining_table', 3, 6, 8, 7)
    plant(rm, 0, 3); plant(rm, 11, 7, .9)
    mat(rm, 10, 8, 'hall', 9, 3, face='down')
    return rm

def corridor():
    rm = Room('corridor', 14, 6, seed=14)
    rm.flags(); rm.wall('servant')
    WT, WB, F0 = rm.WT, rm.WB, rm.F0
    # bell board (cols 2-3)
    x0, x1 = tx(2) + 2, tx(4) - 3
    rm.rect(x0, WT + 6, x1, WT + 22, C['wood3']); rm.rect(x0 + 1, WT + 7, x1 - 1, WT + 21, C['wood'])
    for i, k in enumerate(range(x0 + 4, x1 - 2, 5)):
        rm.line((k, WT + 8, k, WT + 12), C['iron']); rm.ell((k - 2, WT + 12, k + 2, WT + 16), C['gold']); rm.px(k, WT + 18, C['white'])
    rm.thing('bells', 2, 2, 3, 2)
    door(rm, 5, 'kitchen', 6, 8, kind='plain')
    # coat hooks with greatcoats (cols 7-8)
    rm.rect(tx(7), WT + 12, tx(9) - 1, WT + 13, C['wood3'])
    for k, c in ((tx(7) + 3, hexc('#4a4a3a')), (tx(7) + 14, hexc('#5a3a2a')), (tx(8) + 8, hexc('#3a4a5a'))):
        rm.poly([(k, WT + 14), (k + 7, WT + 14), (k + 9, WB - 4), (k - 2, WB - 4)], c); rm.px(k + 3, WT + 13, C['iron'])
    rm.thing('coats', 7, 2, 8, 2)
    # boot bench (col 9) where Will shelters
    x, y = tx(9), F0 - 4
    rm.rect(x, y, x + 15, y + 4, C['wood4']); rm.rect(x + 1, y + 4, x + 3, y + 12, C['wood2']); rm.rect(x + 12, y + 4, x + 14, y + 12, C['wood2'])
    rm.block(9, 3)
    # boots and a muddy trug of flowerpots (col 10)
    x, y = tx(10) + 1, F0 + 2
    for k in (x, x + 6):
        rm.rect(k, y, k + 4, y + 8, hexc('#3a2a22')); rm.rect(k, y + 6, k + 6, y + 8, hexc('#3a2a22')); rm.px(k + 1, y + 9, hexc('#6a5a3a'))
    rm.thing('boots', 10, 3)
    door(rm, 12, 'yard', 3, 4, kind='plain')
    rm.fx.append(dict(type='rain', rect=[tx(12) + 5, rm.WB - 30, tx(12) + 10, rm.WB - 22]))
    rm.rect(tx(12) + 5, rm.WB - 30, tx(12) + 10, rm.WB - 22, C['glass'])
    # stone sink & bucket (col 1, row 3)
    x, y = tx(1), F0 - 4
    rm.rect(x, y, x + 15, y + 8, C['stone3']); rm.rect(x + 2, y + 2, x + 13, y + 6, hexc('#8ea2b0'))
    rm.rect(x + 1, y + 8, x + 3, y + 14, C['stone2']); rm.rect(x + 12, y + 8, x + 14, y + 14, C['stone2'])
    rm.thing('sink', 1, 3)
    x, y = tx(4) + 4, ty(5) + 4
    rm.poly([(x, y), (x + 9, y), (x + 8, y + 9), (x + 1, y + 9)], C['wood3']); rm.line((x, y + 3, x + 9, y + 3), C['iron'])
    rm.ell((x, y - 2, x + 9, y + 2), hexc('#8ea2b0')); rm.thing('bucket', 4, 5)
    # strip of matting along the passage
    for x in range(tx(1), tx(13), 2):
        for y in (ty(4) + 3, ty(4) + 12): rm.px(x, y, hexc('#a8946a'))
    mat(rm, 0, 4, 'hall', 1, 8, face='right', vertical=True)
    return rm

def kitchen():
    rm = Room('kitchen', 12, 10, seed=15)
    rm.flags(); rm.wall('servant')
    WT, WB, F0 = rm.WT, rm.WB, rm.F0
    window(rm, 1, curtain=hexc('#c8a06a'), curtain2=hexc('#a8804a'), sill_pots=False)
    # range / open hearth (cols 4-6) with pots and a spit
    x0, x1 = tx(4) + 1, tx(7) - 2
    rm.rect(x0 - 2, WT + 4, x1 + 2, F0 + 6, hexc('#8a5a46'))
    for y in range(WT + 6, F0 + 6, 4):
        for x in range(x0 - 2 + (y // 4 % 2) * 4, x1 + 2, 8): rm.rect(x, y, x + 6, y + 2, hexc('#9a6a52'))
    rm.rect(x0 + 4, WB - 18, x1 - 4, F0 + 6, hexc('#1e1418'))
    rm.rect(x0, WB - 20, x1, WB - 18, C['wood2'])
    rm.line((x0 + 6, WB - 12, x1 - 6, WB - 12), C['iron'])
    rm.ell((x0 + 12, WB - 12, x0 + 24, WB - 2), C['iron']); rm.rect(x0 + 17, WB - 15, x0 + 19, WB - 12, C['iron'])
    rm.ell((x1 - 20, WB - 8, x1 - 10, WB + 1), C['copper'])
    rm.fx.append(dict(type='fire', rect=[x0 + 6, F0 - 2, x1 - 6, F0 + 5]))
    for k in range(x0, x1, 9): rm.rect(k, WT + 8, k + 6, WT + 13, rm.R.choice([C['copper'], C['copper2']])); rm.px(k + 3, WT + 7, C['iron'])
    rm.thing('range', 4, 3, 6, 3)
    # dresser with plates (cols 8-10)
    x0, x1 = tx(8) + 1, tx(11) - 2
    rm.shadow(x0 - 1, F0 + 4, x1 + 1, F0 + 10)
    rm.rect(x0, WT + 6, x1, F0 + 6, C['wood3']); rm.rect(x0 - 1, WT + 4, x1 + 1, WT + 7, C['wood4'])
    for sy in (WT + 16, WT + 26):
        rm.line((x0 + 1, sy, x1 - 1, sy), C['wood2'])
        for k in range(x0 + 3, x1 - 4, 7): rm.ell((k, sy - 8, k + 6, sy - 1), rm.R.choice([C['china2'], hexc('#e8d8b8')])); rm.px(k + 3, sy - 5, C['china'])
    rm.rect(x0, WB - 3, x1, F0 + 6, C['wood']); rm.line((x0, WB - 3, x1, WB - 3), C['wood4'])
    rm.thing('dresser', 8, 3, 10, 3)
    # hanging herbs on the beam
    for k in range(tx(1), tx(4), 6):
        rm.line((k, WT + 4, k, WT + 9), C['wood3']); rm.ell((k - 2, WT + 9, k + 2, WT + 15), rm.R.choice([C['leaf'], C['leaf3'], hexc('#8a7a4a')]))
    # big scrubbed table (cols 3-7, rows 5-6) with bread, onions, a basin of potatoes
    x0, y0, x1, y1 = tx(3) + 2, ty(5) + 2, tx(8) - 3, ty(7) - 4
    rm.shadow(x0 - 2, y1, x1 + 2, y1 + 8)
    rm.rect(x0, y0, x1, y1, hexc('#d8c8a0')); rm.rect(x0, y1, x1, y1 + 5, C['wood3'])
    for k in range(x0, x1, 12): rm.line((k, y0, k, y1), hexc('#c8b890'))
    rm.ell((x0 + 6, y0 + 4, x0 + 18, y0 + 12), hexc('#c8904a')); rm.line((x0 + 9, y0 + 7, x0 + 15, y0 + 7), hexc('#a8703a'))
    for k in range(4): rm.ell((x0 + 26 + k * 5, y0 + 6, x0 + 30 + k * 5, y0 + 10), hexc('#c89a6a'))
    rm.ell((x1 - 24, y0 + 3, x1 - 6, y0 + 14), C['iron2']); rm.ell((x1 - 22, y0 + 4, x1 - 8, y0 + 11), hexc('#c8b070'))
    rm.rect(x0 + 44, y0 + 10, x0 + 52, y0 + 13, C['silver'])
    rm.thing('kitchen_table', 3, 5, 7, 6)
    # flour barrel & sacks (col 10, rows 6-7)
    x, y = tx(10) + 2, ty(6)
    rm.shadow(x - 2, y + 14, x + 14, y + 18)
    rm.rect(x, y, x + 12, y + 14, C['wood3']); rm.ell((x, y - 3, x + 12, y + 3), hexc('#efe6d2'))
    for k in (y + 4, y + 10): rm.line((x, k, x + 12, k), C['iron'])
    rm.thing('flour', 10, 6)
    x, y = tx(10) + 1, ty(7) + 6
    rm.ell((x, y, x + 13, y + 9), hexc('#c8b890')); rm.line((x + 3, y + 2, x + 9, y + 2), hexc('#a8986a'))
    rm.block(10, 7)
    # stool and potato bucket where Bessie works (col 2, row 6)
    x, y = tx(2) + 2, ty(6) + 4
    rm.ell((x, y, x + 12, y + 5), C['wood4']); rm.rect(x + 2, y + 5, x + 3, y + 10, C['wood2']); rm.rect(x + 9, y + 5, x + 10, y + 10, C['wood2'])
    x, y = tx(1) + 4, ty(7) + 2
    rm.poly([(x, y), (x + 9, y), (x + 8, y + 9), (x + 1, y + 9)], C['wood3']); rm.ell((x, y - 2, x + 9, y + 2), hexc('#c8a070'))
    rm.thing('potatoes', 1, 7)
    rm.thing('kitchen_cat', 8, 8, solid=False)
    x, y = tx(8) + 8, ty(8) + 8
    rm.ell((x - 7, y - 4, x + 5, y + 3), hexc('#5a5a5a')); rm.ell((x + 1, y - 5, x + 7, y + 1), hexc('#5a5a5a'))
    rm.px(x + 2, y - 6, hexc('#3a3a3a')); rm.px(x + 6, y - 6, hexc('#3a3a3a'))
    rm.block(8, 8)
    mat(rm, 6, 9, 'corridor', 5, 3, face='down')
    return rm

def yard():
    """The stable yard behind the house, in the rain."""
    rm = Room('yard', 16, 12, seed=16); d = rm.d
    R = rm.R
    # cobbles
    for y in range(rm.H):
        for x in range(rm.W):
            c = hexc('#8a8478') if (x // 5 + (y // 4) % 2 * 2) % 2 else hexc('#7c766a')
            if x % 5 == 0 or y % 4 == 0: c = hexc('#5e5a52')
            if R.random() < .06: c = hexc('#9a9488')
            rm.px(x, y, c)
    # grass & hedges at the bottom and sides
    for y in range(ty(10), rm.H):
        for x in range(rm.W):
            rm.px(x, y, R.choice([hexc('#3d6a3c'), hexc('#4f8044'), hexc('#2f5435'), hexc('#3d6a3c')]))
    for c in list(range(0, 6)) + list(range(10, 16)):
        x = tx(c)
        rm.rect(x, ty(11) - 4, x + 15, rm.H, hexc('#22442a'))
        for k in range(x, x + 16, 2): rm.px(k, ty(11) - 4, hexc('#4a7d3f')); rm.px(k + 1, ty(11) - 3, hexc('#2e5a33'))
        rm.block(c, 11)
    # the gate to the park and the lane (cols 6-9, row 11)
    for gx in (tx(6) - 6, tx(10) - 2):
        rm.rect(gx, ty(10) + 2, gx + 8, rm.H, C['stone3']); rm.rect(gx - 1, ty(10), gx + 9, ty(10) + 3, C['white'])
        rm.ell((gx + 1, ty(10) - 8, gx + 7, ty(10)), C['stone2'])
    rm.block(6, 11, 9, 11)
    rm.thing('gate', 6, 11, 9, 11)
    rm.fx.append(dict(type='gate', rect=[tx(6) + 2, ty(10) + 4, tx(10) - 3, rm.H - 1]))
    # back of the house along the top (rows 0-3)
    rm.rect(0, 0, tx(10) - 1, ty(4) - 1, C['marble'])
    for y in range(4, ty(4), 6): rm.line((0, y, tx(10) - 1, y), C['marble2'])
    rm.rect(0, ty(4) - 6, tx(10) - 1, ty(4) - 1, C['marble2']); rm.line((0, ty(4) - 6, tx(10), ty(4) - 6), C['white'])
    for c in (1, 5, 7):
        x = tx(c) + 3
        rm.rect(x - 1, 9, x + 10, 31, C['frame']); rm.rect(x, 10, x + 9, 30, C['glass'])
        rm.line((x + 4, 10, x + 4, 30), C['frame']); rm.line((x, 20, x + 9, 20), C['frame']); rm.rect(x - 2, 31, x + 11, 33, C['marble3'])
        rm.fx.append(dict(type='glow', at=[x + 5, 20], r=9))
    rm.rect(tx(3) - 2, ty(2) + 2, tx(4) + 1, ty(4) - 1, C['marble3'])
    rm.rect(tx(3) + 1, ty(2) + 4, tx(4) - 2, ty(4) - 1, C['wood'])
    rm.d.rectangle((tx(3) + 3, ty(2) + 7, tx(4) - 4, ty(3) + 6), outline=C['wood3'])
    rm.px(tx(4) - 4, ty(3) + 8, C['gold'])
    rm.ell((tx(3) - 4, ty(2) - 4, tx(4) + 3, ty(2) + 6), C['marble3'])   # fanlight
    rm.ell((tx(3) - 1, ty(2) - 1, tx(4), ty(2) + 5), C['glass'])
    rm.block(0, 0, 9, 3)
    rm.warp(3, 3, 'corridor', 12, 3, face='down')
    # climbing roses on the house wall
    for x0 in (6, tx(6) + 4, tx(9)):
        for y in range(8, ty(4) - 6):
            xx = x0 + int(2 * math.sin(y / 4)); rm.px(xx, y, hexc('#2e5a33'))
            if R.random() < .5: rm.px(xx + R.randint(-2, 2), y, R.choice([C['rose'], C['rose2'], hexc('#4a7d3f')]))
    # stable block (cols 10-15, rows 0-5), stone like the house, with a clock in the pediment
    sx0, sx1 = tx(10), rm.W - 1
    rm.rect(sx0, 0, sx1, ty(5) - 1, C['marble'])
    for y in range(6, ty(5), 6): rm.line((sx0, y, sx1, y), C['marble2'])
    for y in range(0, ty(5), 6):
        for qx in (sx0, sx1 - 5): rm.rect(qx, y, qx + 5, y + 2, C['white'])
    mx = (sx0 + sx1) // 2
    rm.poly([(mx - 18, 16), (mx + 18, 16), (mx, 2)], C['white']); rm.poly([(mx - 13, 15), (mx + 13, 15), (mx, 5)], C['marble2'])
    rm.ell((mx - 4, 6, mx + 4, 14), C['white'], outline=C['marble3']); rm.px(mx, 9, C['ink']); rm.px(mx + 1, 8, C['ink'])
    rm.rect(sx0, ty(5) - 6, sx1, ty(5) - 1, C['marble2'])
    for (a, b, lit) in ((tx(11), tx(13) - 4, True), (tx(13) + 4, tx(15) + 6, False)):
        top = ty(2) + 4
        rm.rect(a - 2, top - 2, b + 2, ty(5) - 1, C['white']); rm.d.pieslice((a - 2, top - 8, b + 2, top + 8), 180, 360, fill=C['white'])
        rm.rect(a, top, b, ty(5) - 1, C['wood2']); rm.d.pieslice((a, top - 6, b, top + 6), 180, 360, fill=C['glass'])
        for k in range(a + 2, b, 3): rm.line((k, top + 1, k, ty(5) - 1), C['wood'])
        if lit:
            rm.rect(a + 4, top + 6, a + 10, ty(5) - 1, C['fire1']); rm.rect(a + 6, top + 8, a + 9, ty(5) - 1, C['warm'])
            rm.fx.append(dict(type='glow', at=[a + 7, ty(5) - 8], r=14))
    rm.ell((mx - 6, ty(1) + 4, mx + 6, ty(1) + 14), C['white']); rm.ell((mx - 4, ty(1) + 5, mx + 4, ty(1) + 13), C['glass'])
    rm.rect(mx - 1, ty(1) + 8, mx + 2, ty(1) + 13, C['wood2']); rm.rect(mx - 1, ty(1) + 6, mx + 2, ty(1) + 8, hexc('#8a4a2a'))
    rm.block(10, 0, 15, 4)
    rm.warp(11, 4, 'stable', 6, 7, face='up')
    rm.thing('stable_door2', 14, 4)
    # lantern
    rm.line((sx0 + 6, ty(2) + 10, sx0 + 6, ty(2) + 14), C['iron']); rm.rect(sx0 + 4, ty(2) + 14, sx0 + 8, ty(2) + 18, C['warm'])
    # the broken carriage (cols 6-8, rows 6-7)
    cx, cy = tx(6) + 4, ty(6) + 4
    rm.shadow(cx - 6, cy + 18, cx + 44, cy + 26)
    rm.rect(cx, cy, cx + 34, cy + 16, hexc('#7a3550')); rm.rect(cx + 2, cy + 2, cx + 14, cy + 9, C['glass'])
    rm.rect(cx + 18, cy + 2, cx + 32, cy + 14, hexc('#9c4a6a'))
    rm.line((cx, cy, cx + 34, cy), C['gold']); rm.line((cx, cy + 16, cx + 34, cy + 16), C['gold']); rm.rect(cx - 2, cy - 3, cx + 36, cy - 1, C['iron2'])
    rm.ell((cx + 22, cy + 13, cx + 35, cy + 26), outline=C['wood']); rm.ell((cx + 23, cy + 14, cx + 34, cy + 25), outline=C['wood'])
    for a in range(0, 360, 45): rm.line((cx + 28, cy + 19, cx + 28 + 5 * math.cos(math.radians(a)), cy + 19 + 5 * math.sin(math.radians(a))), C['wood3'])
    rm.rect(cx + 2, cy + 16, cx + 6, cy + 22, C['wood2'])
    rm.ell((cx - 14, cy + 8, cx - 1, cy + 22), outline=C['wood']); rm.ell((cx - 13, cy + 9, cx - 2, cy + 21), outline=C['wood'])
    rm.line((cx - 8, cy + 9, cx - 8, cy + 21), C['wood3']); rm.line((cx - 13, cy + 15, cx - 2, cy + 15), C['wood3'])
    rm.thing('carriage', 5, 6, 8, 7)
    # pump & trough (col 1, rows 6-7)
    x, y = tx(1) + 4, ty(6) - 4
    rm.rect(x, y, x + 6, y + 22, C['iron2']); rm.rect(x - 1, y - 3, x + 7, y, C['iron']); rm.line((x + 6, y + 4, x + 12, y + 1), C['iron'])
    rm.rect(x - 4, y + 20, x + 22, y + 28, C['stone2']); rm.rect(x - 2, y + 21, x + 20, y + 25, hexc('#7a92a4'))
    rm.thing('pump', 1, 6, 2, 7)
    # puddles
    for (a, b, w) in ((tx(4), ty(5) + 6, 18), (tx(10), ty(8) + 4, 22), (tx(12) + 4, ty(6) + 6, 14), (tx(2), ty(9) + 2, 16)):
        rm.ell((a, b, a + w, b + 6), hexc('#6a7e8c')); rm.line((a + 3, b + 1, a + w - 6, b + 1), hexc('#a8bcc8'))
        rm.fx.append(dict(type='puddle', at=[a + w // 2, b + 3], w=w))
    # dovecote / water butt (col 14, row 8)
    x, y = tx(14) + 2, ty(8) - 2
    rm.rect(x, y, x + 12, y + 16, C['wood3']); rm.ell((x, y - 3, x + 12, y + 3), hexc('#6a7e8c'))
    for k in (y + 4, y + 11): rm.line((x, k, x + 12, k), C['iron'])
    rm.thing('water_butt', 14, 8)
    rm.fx.append(dict(type='weather'))
    return rm

def stable():
    rm = Room('stable', 12, 9, seed=17)
    WT, WB, F0 = rm.WT, rm.WB, rm.F0; R = rm.R
    # straw-strewn brick floor
    for y in range(F0, rm.H):
        for x in range(rm.W):
            c = hexc('#9a6a52') if ((x // 8) + (y // 4)) % 2 else hexc('#8a5c46')
            if y % 4 == 0 or (x + (y // 4) % 2 * 4) % 8 == 0: c = hexc('#6a4434')
            rm.px(x, y, c)
    for _ in range(700):
        x, y = R.randrange(rm.W), R.randrange(F0, rm.H); rm.line((x, y, x + R.randint(-2, 2), y + 1), R.choice([hexc('#d8b860'), hexc('#c8a050')]))
    # wall: whitewashed with timber posts
    rm.rect(0, WT, rm.W, WB, hexc('#e4dccb'))
    for x in range(0, rm.W, 32): rm.rect(x, WT, x + 4, WB, hexc('#5a3e2c'))
    rm.rect(0, WT, rm.W, WT + 5, hexc('#5a3e2c')); rm.rect(0, WB - 2, rm.W, WB, hexc('#5a3e2c'))
    # harness & horseshoes on the wall
    for x in (tx(6) + 4, tx(7) + 6):
        rm.d.arc((x, WT + 12, x + 10, WT + 26), 0, 360, fill=hexc('#4a2e20')); rm.line((x + 5, WT + 8, x + 5, WT + 12), hexc('#4a2e20'))
    rm.d.arc((tx(8) + 2, WT + 14, tx(8) + 10, WT + 22), 200, 340, fill=C['iron2'])
    rm.thing('harness', 6, 2, 8, 2)
    # stalls with two horses (cols 0-4, rows 2-5)
    for i, (c0, coat, mane) in enumerate(((0, hexc('#7a4a2a'), hexc('#3a2418')), (2, hexc('#d8c8b0'), hexc('#8a7a6a')))):
        x0 = tx(c0) + 1; x1 = tx(c0 + 2) - 2
        rm.rect(x1, WT + 18, x1 + 3, ty(6), C['wood2'])
        rm.rect(x0, ty(5) + 6, x1, ty(5) + 9, C['wood3'])
        hx, hy = x0 + 6, ty(3) + 2
        rm.ell((hx, hy + 6, hx + 20, hy + 26), coat)                 # body seen from above-front
        rm.rect(hx + 6, hy - 6, hx + 14, hy + 12, coat); rm.rect(hx + 7, hy - 10, hx + 13, hy - 4, coat)
        rm.rect(hx + 9, hy - 6, hx + 11, hy + 10, mane); rm.px(hx + 7, hy - 10, mane); rm.px(hx + 13, hy - 10, mane)
        rm.px(hx + 8, hy - 7, C['ink']); rm.px(hx + 12, hy - 7, C['ink']); rm.rect(hx + 9, hy - 2, hx + 11, hy - 1, shade(coat, .7))
        rm.block(c0, 3, c0 + 1, 5)
        rm.thing(f'horse{i + 1}', c0, 3, c0 + 1, 5)
    # hay manger
    rm.rect(tx(0), WT + 26, tx(4) - 2, WT + 34, C['wood3'])
    for _ in range(80): rm.px(R.randint(2, tx(4) - 4), R.randint(WT + 20, WT + 28), R.choice([hexc('#d8b860'), hexc('#c8a050')]))
    # ladder up to the hayloft (col 9)
    x = tx(9) + 3
    rm.rect(x, 0, x + 1, F0 + 4, C['wood3']); rm.rect(x + 9, 0, x + 10, F0 + 4, C['wood3'])
    for y in range(4, F0 + 4, 6): rm.rect(x, y, x + 10, y + 1, C['wood4'])
    rm.block(9, 3)
    rm.thing('ladder', 9, 2, 9, 3)
    # Tom's shelf with a carved horse (col 10)
    x = tx(10) + 2
    rm.rect(x, WT + 24, x + 13, WT + 26, C['wood3']); rm.rect(x + 2, WT + 18, x + 7, WT + 23, hexc('#b08050'))
    rm.px(x + 6, WT + 16, hexc('#b08050')); rm.rect(x + 9, WT + 19, x + 11, WT + 23, C['white'])
    rm.thing('tom_shelf', 10, 2)
    sparkle(rm, 10, 3, 'tom_shelf')
    # hay bales where Tom sulks (cols 9-11, rows 4-5)
    for (c, r) in ((11, 3), (11, 4), (11, 5)):
        x, y = tx(c), ty(r) + 2
        rm.rect(x, y, x + 15, y + 12, hexc('#d8b860')); rm.rect(x, y, x + 15, y + 3, hexc('#e8cc78'))
        for k in range(x + 2, x + 15, 3): rm.line((k, y + 3, k, y + 12), hexc('#c8a050'))
        rm.line((x + 4, y, x + 4, y + 12), hexc('#8a6a3a')); rm.line((x + 11, y, x + 11, y + 12), hexc('#8a6a3a'))
        rm.block(c, r)
    rm.thing('hay', 11, 4, 11, 5)
    # lantern & saddle rack
    rm.line((tx(5) + 8, 0, tx(5) + 8, WT + 10), C['iron']); rm.rect(tx(5) + 6, WT + 10, tx(5) + 10, WT + 15, C['warm'])
    rm.fx.append(dict(type='glow', at=[tx(5) + 8, WT + 13], r=18))
    x, y = tx(6) + 2, ty(6)
    rm.rect(x, y + 6, x + 12, y + 8, C['wood2']); rm.ell((x - 1, y - 2, x + 13, y + 8), hexc('#5a3020')); rm.rect(x + 2, y + 8, x + 3, y + 14, C['wood2'])
    rm.thing('saddle', 6, 6)
    # bucket of oats
    x, y = tx(4) + 4, ty(7) + 2
    rm.poly([(x, y), (x + 9, y), (x + 8, y + 9), (x + 1, y + 9)], C['wood3']); rm.ell((x, y - 2, x + 9, y + 2), hexc('#d8c8a0'))
    rm.thing('oats', 4, 7)
    mat(rm, 6, 8, 'yard', 11, 5, face='down')
    return rm

ALL = [emma, gallery, attic, hall, drawing, dining, corridor, kitchen, yard, stable]
