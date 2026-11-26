"""Characters for Hartfield: 14x23 px sprites in four directions with a two-step walk,
seated poses, and small oval portraits for the dialogue box and the Casebook."""
from PIL import Image, ImageDraw
from kit import hexc, C

HEAD = {
 'bonnet': {
  'down': ["....oooooo....","...oBBBBBBo...","..oBBBBBBBBo..",".oBBrrrrrrBBo.",".oBhhhhhhhhBo.",".oBhhsssshhBo.",".oBsessssesBo.",".oBsbssssbsBo.","..oBsssmssBo..","...rossssor..."],
  'left': ["....oooooo....","...oBBBBBBo...","..oBBBBBBBBo..",".oBrrrrrrBBBo.",".ohhhhhhhhBBo.","osshhhhhhBBo..","oessshhhhBBo..","osbsshhhBBo...",".osmsssBBo....","..roSso......."]},
 'updo': {
  'down': ["....ohhhho....","...ohhhhhho...","..ohhhhhhhho..",".ohhHhhhhHhho.",".ohhssssssho..",".hHsessssesHh.",".hHsbssssbsHh.","..hosssmssoh..","...oossssoo...","....osSso....."],
  'left': ["......ohhho...","....ohhhhhhho.","...ohhhhhhhhho","..ohhhhhhHhhho",".osshhhhhhhho.",".oesssshhhHho.",".osbsssshhho..","..osmssshho...","...ossso......","....osSo......"]},
 'mobcap': {
  'down': ["...owwwwwwo...","..owwwwwwwwo..",".owwwwwwwwwwo.",".owhhhhhhhhwo.","..ohsssssssho.",".oohsesssesho.","..ohsbsssbsho.","...osssmsso...","....osSso.....","....osSso....."],
  'left': ["...owwwwwwo...","..owwwwwwwwo..",".owwwwwwwwwwo.",".owhhhhhhhwwo.",".osshhhhhhwo..","oesssshhhho...",".osbssshho....","..osmsssso....","...ossso......","....osSo......"]},
 'male': {
  'down': ["...oooooooo...","..ohhhhhhhho..",".ohhhhhhhhhho.",".ohhsssssshho.",".ohsessssesho.","..osbssssbso..","..ossssmssso..","...osssssso...","....osSso.....","..owwwwwwwwo.."],
  'left': ["....oooooo....","...ohhhhhho...","..ohhhhhhhho..","..oshhhhhhho..",".osesshhhhho..",".ossssshhhho..","..osmsssshho..","...osssssso...","....osSso.....","...owwwwwo...."]},
 'nightcap': {
  'down': ["...oooooooo...","..owwwwwwwwo..",".owwwwwwwwwwo.",".owwsssssswwo.",".owsessssesow.","..osSssssSso..","..osssmmssso..","...oswwwwso...","....owwwwo....","....oSSSSo...."],
  'left': ["...oooooooo...","..owwwwwwwwo..",".owwwwwwwwwwwo",".owwwwwwwwwwo.",".osswwwwwwwo..","oessswwwwwo...",".osSsssssso...","..osmmssso....","...oswwso.....","....owwo......"]},
 'hat': {   # top hat (Mr Perry, Mr Knightley out of doors)
  'down': ["...oHHHHHHo...","...oHHHHHHo...","..oHHHHHHHHo..","oHHHHHHHHHHHHo",".ohhsssssshho.",".ohsessssesho.","..osbssssbso..","..ossssmssso..","....osSso.....","..owwwwwwwwo.."],
  'left': ["....oHHHHHo...","....oHHHHHo...","...oHHHHHHHo..",".oHHHHHHHHHHHo",".osshhhhhhho..","osesshhhhho...",".osssssshho...","..osmssssso...","....osSso.....","...owwwwwo...."]},
}

FEM = {
 'down': ["...owwwwwwo...","..odwrrrrwdo..",".oSddddddddSo.",".oSddddddDdSo.",".osdddddDDdso.","..oddddddDDo..","..odddddddDo..",".odddddddDDDo.",".oddddddddDDo.",".odddddddddDDo","oddddddddddDDo","oooooooooooooo"],
 'up':   ["...oddddddo...","..odrrrrrrdo..",".oSddddddddSo.",".oSddddddddSo.",".osddddddddso.","..oddddddddo..","..oddddddddo..",".odddddddddDo.",".oddddddddDDo.",".odddddddddDDo","oddddddddddDDo","oooooooooooooo"],
 'left': ["....owwwwo....","....odrrdo....","...oSdddddo...","...oSdddddo...","...osddddDo...","...oddddDDo...","...odddddDo...","..oddddddDDo..","..oddddddDDo..","..odddddddDDo.",".oddddddddDDo.",".oooooooooooo."],
}
FEM_FEET = {
 'down': ["...okko.okko..", "..okko...oko..", "...oko...okko."],
 'up':   ["...okko.okko..", "..okko...oko..", "...oko...okko."],
 'left': ["....okko......", "...okko.oko...", "....oko.okko.."],
}
APRON = set([(r, c) for r in range(1, 10) for c in range(4, 10)])

MAL = {
 'down': [".oddwwrrwwddo.","oddddwrrwddddo","oSddddwwddddSo","oSdddddDddddSo","osdddddDdddDso",".odddddDddDDo.",".occcccDcccco.",".occcc..cccco."],
 'up':   [".oddddddddddo.","oddddddddddddo","oSddddddddddSo","oSdddddDddddSo","osdddddDdddDso",".odddddDddDDo.",".occcccDcccco.",".occcc..cccco."],
 'left': ["...odwrddo....","...oddddddo...","...oSddddDo...","...oSddddDo...","...osdddDDo...","...odddDDDo...","....occcco....","....occcco...."],
}
MAL_LEGS = {
 'down': [[".occo....occo.", ".oggo....oggo.", ".oggo....oggo.", ".okkko..okkko."],
          [".occo....occo.", ".oggo....oggo.", ".oggo....okko.", ".okkko........"],
          [".occo....occo.", ".oggo....oggo.", ".okko....oggo.", "........okkko."]],
 'left': [["....occo......", "....oggo......", "....oggo......", "...okkko......"],
          ["...occ.oco....", "..ogo...ogo...", ".ogo.....ogo..", "okko.....okko."],
          ["....occco.....", "...oggogo.....", "...oggogo.....", "..okkokko....."]],
}
MAL_LEGS['up'] = MAL_LEGS['down']

SEATED = ["..owwwwwwwwo..", ".oddwwrrwwddo.", "oddddwrrwddddo", "oSddddwwddddSo", "oSdddddDddddSo", "oqqqqqqqqqqqqo", "oqqqqqqqqqqqqo", ".oqqqqqqqqqqo."]

FACE = {'o': hexc('#2a1c22'), 's': C['skin'], 'S': hexc('#d8a688'), 'e': hexc('#2a2030'),
        'b': hexc('#f0a0a0'), 'm': hexc('#b04a5a'), 'w': C['white'], 'k': hexc('#3a2a2a')}

CAST = {
 'harriet':   dict(head='bonnet', body='f', B=hexc('#f4ecd8'), r=C['rose'], h=C['hair'], H=hexc('#a87a40'), d=C['pink'], D=C['pinkD']),
 'emma':      dict(head='updo', body='f', h=C['hairD'], H=hexc('#4a2a18'), r=hexc('#7fa6d8'), d=C['white'], D=hexc('#c8c0d8')),
 'bessie':    dict(head='mobcap', body='f', apron=True, h=C['hairD'], H=hexc('#4a2a18'), r=C['white'], d=hexc('#3c4a6a'), D=hexc('#2a3450')),
 'serle':     dict(head='mobcap', body='f', apron=True, h=hexc('#9a9488'), H=hexc('#7a746a'), r=C['white'], d=hexc('#7a5a3a'), D=hexc('#5a3e28'), s=hexc('#eab898'), b=hexc('#e88a8a')),
 'knightley': dict(head='male', body='m', h=hexc('#4a3020'), H=hexc('#3a2418'), r=C['white'], d=hexc('#2e4a3a'), D=hexc('#1e3428'), c=hexc('#d8c8a0'), g=hexc('#3a2a22'), k=hexc('#2a1c18')),
 'patrick':   dict(head='male', body='m', h=hexc('#eeeae2'), H=hexc('#cfc8bc'), r=C['gold'], d=hexc('#7a2a3a'), D=hexc('#5a1a2a'), c=C['white'], g=C['white'], k=hexc('#2a1c18')),
 'will':      dict(head='male', body='m', h=hexc('#c8a050'), H=hexc('#a8803a'), r=hexc('#e8dcc0'), d=hexc('#5a7a3a'), D=hexc('#3e5a28'), c=hexc('#8a6a4a'), g=hexc('#6a5a4a'), k=hexc('#4a3424'), w=hexc('#e8dcc0')),
 'barnes':    dict(head='male', body='m', h=hexc('#b8b2a8'), H=hexc('#9a948a'), r=C['white'], d=hexc('#2a2a30'), D=hexc('#1a1a20'), c=hexc('#2a2a30'), g=hexc('#2a2a30'), k=hexc('#1a1418')),
 'perry':     dict(head='hat', body='m', h=hexc('#6a4a30'), H=hexc('#2a2428'), r=C['white'], d=hexc('#3a3a44'), D=hexc('#24242c'), c=hexc('#3a3a44'), g=hexc('#3a3a44'), k=hexc('#1a1418')),
 'tom':       dict(head='male', body='m', h=hexc('#a0502a'), H=hexc('#7a3a1e'), r=hexc('#e8dcc0'), d=hexc('#5a4a3a'), D=hexc('#3e3226'), c=hexc('#8a6a4a'), g=hexc('#6a5a4a'), k=hexc('#3a2a20'), q=hexc('#8a3a3a')),
 'woodhouse': dict(head='nightcap', body='m', r=hexc('#d8d0b8'), d=hexc('#5a3a4a'), D=hexc('#3e2834'), c=hexc('#5a3a4a'), g=C['white'], k=hexc('#2a1c18'), q=hexc('#b8a0c0')),
}

def back_head(rows):
    out = []
    for r, row in enumerate(rows):
        row2 = ''
        for ch in row:
            if ch in 'sebm': ch = 'h' if r < 8 else 'S'
            if ch == 'S' and r < 8: ch = 'H'
            row2 += ch
        out.append(row2)
    return out

def frame_rows(spec, dir_, step):
    hs = HEAD[spec['head']]
    if dir_ == 'up':
        head = back_head(hs['down'])
        if spec['head'] == 'nightcap': head = [r.replace('h', 'w').replace('H', 'w') for r in head]
    else: head = hs['left' if dir_ in ('left', 'right') else 'down']
    d = 'left' if dir_ in ('left', 'right') else dir_
    if spec['body'] == 'f':
        body = FEM[d] + [FEM_FEET[d][step]]
    else:
        body = MAL[d] + MAL_LEGS[d][step]
    return head + body

def paint(spec, rows, img, ox, oy, mirror=False, apron_dir=None):
    pal = dict(FACE); pal.update({k: v for k, v in spec.items() if len(k) == 1})
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == '.': continue
            c = pal.get(ch)
            if spec.get('apron') and apron_dir == 'down' and 11 <= j <= 19 and 4 <= i <= 9 and ch in 'dD': c = C['white'] if ch == 'd' else hexc('#d8d0c0')
            if spec.get('apron') and apron_dir == 'left' and 11 <= j <= 19 and 3 <= i <= 6 and ch in 'dD': c = C['white']
            if c is None: continue
            x = ox + (13 - i if mirror else i)
            img.putpixel((x, oy + j), c)

CELL_W, CELL_H = 16, 26
def sheet(name):
    spec = CAST[name]
    img = Image.new('RGBA', (CELL_W * 3, CELL_H * 4), (0, 0, 0, 0))
    for di, dir_ in enumerate(('down', 'up', 'left', 'right')):
        for step in range(3):
            rows = frame_rows(spec, dir_, step)
            bob = 0 if step == 0 else 1
            paint(spec, rows, img, step * CELL_W + 1, di * CELL_H + 2 + bob, mirror=(dir_ == 'right'),
                  apron_dir='down' if dir_ == 'down' else ('left' if dir_ in ('left', 'right') else None))
    return img

def seated(name):
    spec = CAST[name]
    img = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    rows = HEAD[spec['head']]['down'] + SEATED
    paint(spec, rows, img, 1, CELL_H - len(rows) - 2)
    return img

def portrait(name, size=40):
    """oval-framed bust, 40x44"""
    spec = CAST[name]
    img = Image.new('RGBA', (40, 44), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse((0, 0, 39, 43), fill=C['gold']); d.ellipse((2, 2, 37, 41), fill=hexc('#e8dcc4'))
    d.ellipse((3, 3, 36, 40), outline=C['gold2'])
    bust = Image.new('RGBA', (14, 15), (0, 0, 0, 0))
    rows = HEAD[spec['head']]['down'] + (FEM['down'] if spec['body'] == 'f' else MAL['down'])[:5]
    paint(spec, rows, bust, 0, 0, apron_dir='down')
    bust = bust.resize((28, 30), Image.NEAREST)
    mask = Image.new('L', (40, 44), 0); ImageDraw.Draw(mask).ellipse((3, 3, 36, 40), fill=255)
    lay = Image.new('RGBA', (40, 44), (0, 0, 0, 0)); lay.alpha_composite(bust, (6, 10))
    img.paste(lay, (0, 0), Image.composite(lay, Image.new('RGBA', (40, 44)), mask).getchannel('A'))
    return img
