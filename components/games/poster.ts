/**
 * Pixel "posters" for Time Traveller cards. No real posters (they're copyrighted):
 * each film gets a small scene drawn from its genre motif, varied by a seed from
 * its Wikidata id, so two sci-fi films never look the same. No title, no year hints.
 * Pure function: returns rectangles on a 48×30 pixel grid.
 */

export type Motif =
  | "anim" | "hero" | "western" | "war" | "scifi" | "horror" | "fantasy" | "music"
  | "sport" | "noir" | "romance" | "history" | "adventure" | "action" | "comedy" | "drama";

export const W = 48;
export const H = 30;

export type Px = { x: number; y: number; w: number; h: number; c: string };

type Palette = { sky: [string, string, string]; ground: string; m: string; a: string; d: string; l: string };

const P: Record<Motif, Palette[]> = {
  scifi: [
    { sky: ["#0b0f2a", "#1b1f4d", "#3a2f6e"], ground: "#5a3a6e", m: "#cfd6e6", a: "#ff8a3d", d: "#4b5675", l: "#ffffff" },
    { sky: ["#03131c", "#0c3140", "#1d5a63"], ground: "#2b4a3c", m: "#e6e1cf", a: "#5ee6d0", d: "#6b6f80", l: "#ffffff" },
    { sky: ["#1a0b24", "#3b1446", "#7a2a5a"], ground: "#c26a4a", m: "#d9dde8", a: "#ffd23f", d: "#55607a", l: "#ffffff" },
  ],
  horror: [
    { sky: ["#05070d", "#141a26", "#2a3140"], ground: "#0e1410", m: "#3b3f46", a: "#ffcf4a", d: "#07090c", l: "#e9f0d0" },
    { sky: ["#140406", "#2e0a10", "#5c1420"], ground: "#120708", m: "#2a1013", a: "#ffef8a", d: "#0a0304", l: "#f2d7c4" },
    { sky: ["#071009", "#0f2414", "#21462a"], ground: "#081009", m: "#1d261f", a: "#d8ff6a", d: "#040805", l: "#e8f5d0" },
  ],
  western: [
    { sky: ["#f5b04a", "#f08a3a", "#d4543a"], ground: "#a8552c", m: "#3f7a3a", a: "#fff1b0", d: "#5a2a14", l: "#ffe08a" },
    { sky: ["#8ecae6", "#bfe3ef", "#f3e3c3"], ground: "#d9a066", m: "#4c8a3c", a: "#fff6d0", d: "#7a4a24", l: "#fff4c0" },
    { sky: ["#2a1b3d", "#6b2f5a", "#e0703a"], ground: "#5a2a24", m: "#2f5a2c", a: "#ffd27a", d: "#2a120c", l: "#ffb35a" },
  ],
  war: [
    { sky: ["#4a4e45", "#6b6e5e", "#8d8a72"], ground: "#3a3a2c", m: "#5b6b3a", a: "#e0a040", d: "#262a1c", l: "#b0b090" },
    { sky: ["#2a2a2a", "#4a3a30", "#8a5a3a"], ground: "#2a221c", m: "#4f5a38", a: "#ff7a3a", d: "#1a1814", l: "#c8b090" },
    { sky: ["#3c4a5a", "#6a7a86", "#a8b0b0"], ground: "#4a4a3c", m: "#606b48", a: "#d8c060", d: "#2c2f24", l: "#e0e0d0" },
  ],
  fantasy: [
    { sky: ["#140a2e", "#2e1a5a", "#5a3a8a"], ground: "#1e3a2a", m: "#b8b0d8", a: "#ffd75a", d: "#3a3060", l: "#fff6d8" },
    { sky: ["#0d2a3a", "#1f5a6a", "#7ab8a8"], ground: "#2a5a30", m: "#d8d0c0", a: "#ff8ab0", d: "#5a5048", l: "#fffbe8" },
    { sky: ["#2a0e1e", "#5a1e3a", "#c25a6a"], ground: "#2a1a24", m: "#c8b8b0", a: "#8ae0ff", d: "#4a3040", l: "#fff0f0" },
  ],
  music: [
    { sky: ["#2a0a3a", "#5a1a6a", "#a83a8a"], ground: "#1a0a24", m: "#ffd23f", a: "#3ae0d0", d: "#120614", l: "#ffffff" },
    { sky: ["#0a1a3a", "#1a3a7a", "#3a6ac0"], ground: "#0a1024", m: "#ff6a8a", a: "#ffe05a", d: "#060a16", l: "#ffffff" },
    { sky: ["#3a0a0a", "#7a1a1a", "#d84a2a"], ground: "#240606", m: "#fff0c0", a: "#5ae0ff", d: "#140404", l: "#ffffff" },
  ],
  sport: [
    { sky: ["#3a8ad8", "#6ab0e8", "#a8d8f0"], ground: "#3a9a3a", m: "#ffffff", a: "#ffe05a", d: "#1a1a1a", l: "#ffffff" },
    { sky: ["#0a1a3a", "#1a3060", "#3a5a8a"], ground: "#2a7a2a", m: "#f0f0f0", a: "#ffd23f", d: "#141414", l: "#ffffff" },
    { sky: ["#d85a3a", "#f08a4a", "#f8c06a"], ground: "#8a5a2a", m: "#f4efe0", a: "#ffffff", d: "#2a1a10", l: "#ffffff" },
  ],
  noir: [
    { sky: ["#0a0c10", "#16191f", "#262a32"], ground: "#101216", m: "#2a2e36", a: "#ffd86a", d: "#05060a", l: "#f0e6c0" },
    { sky: ["#0c0a14", "#1c1626", "#3a2a3e"], ground: "#120e18", m: "#2e2636", a: "#ff4a6a", d: "#06040a", l: "#ffd0e0" },
    { sky: ["#071214", "#0e2226", "#1c3a3e"], ground: "#0a1618", m: "#22383c", a: "#5ae0e0", d: "#030809", l: "#d0f5f5" },
  ],
  romance: [
    { sky: ["#f2a0b0", "#f8c4c8", "#ffe4d8"], ground: "#d87a8a", m: "#e0304a", a: "#ffffff", d: "#8a1a2a", l: "#ffd0d8" },
    { sky: ["#2a1a3a", "#5a2a5a", "#c25a7a"], ground: "#3a1a2a", m: "#ff5a7a", a: "#ffe0a0", d: "#5a0a1a", l: "#ffc0d0" },
    { sky: ["#ffb07a", "#ffcf9a", "#fff0c8"], ground: "#c87a5a", m: "#d8304a", a: "#fff8e0", d: "#7a1a20", l: "#ffd8c8" },
  ],
  history: [
    { sky: ["#d8b070", "#e8c890", "#f4e0b8"], ground: "#a8804a", m: "#f0e6d0", a: "#c08a2a", d: "#6a4a24", l: "#ffffff" },
    { sky: ["#3a2a1a", "#7a4a2a", "#c8803a"], ground: "#4a3020", m: "#e0d4b8", a: "#ffd06a", d: "#2a1a10", l: "#fff6e0" },
    { sky: ["#5a7a9a", "#8aa8c0", "#c8d8e0"], ground: "#7a7a6a", m: "#f2ede0", a: "#b8902a", d: "#4a4a40", l: "#ffffff" },
  ],
  adventure: [
    { sky: ["#3a9ad8", "#7ac0e8", "#c8e8f8"], ground: "#1a5a8a", m: "#7a4a24", a: "#ffe05a", d: "#4a2a10", l: "#fff8e8" },
    { sky: ["#f08a4a", "#f8b06a", "#ffe0a0"], ground: "#1a4a6a", m: "#5a3418", a: "#ff5a3a", d: "#2a1808", l: "#fff4dc" },
    { sky: ["#0a2a3a", "#1a4a5a", "#3a7a7a"], ground: "#0a2a3a", m: "#6a4424", a: "#ffd23f", d: "#2a1a0a", l: "#e8f0f0" },
  ],
  action: [
    { sky: ["#1a0a0a", "#4a1410", "#8a2a14"], ground: "#141010", m: "#ff8a1a", a: "#ffe04a", d: "#2a0a04", l: "#fffbe0" },
    { sky: ["#0a1020", "#1a2440", "#3a3a5a"], ground: "#0a0c14", m: "#ff5a2a", a: "#ffd23f", d: "#1a0804", l: "#ffffff" },
    { sky: ["#2a2a2a", "#4a3a2a", "#a8602a"], ground: "#1a1612", m: "#ffa83a", a: "#fff06a", d: "#3a1a08", l: "#ffffff" },
  ],
  comedy: [
    { sky: ["#ffd23f", "#ffe07a", "#fff2b8"], ground: "#ff8a3a", m: "#ffffff", a: "#ff4a6a", d: "#2a1a3a", l: "#ffffff" },
    { sky: ["#5ae0d0", "#9af0e0", "#d8fff4"], ground: "#3ab0a0", m: "#fff4d0", a: "#ff6a3a", d: "#1a2a3a", l: "#ffffff" },
    { sky: ["#ff8ab0", "#ffb0c8", "#ffe0ea"], ground: "#c85a8a", m: "#fffbe8", a: "#5a8aff", d: "#2a1030", l: "#ffffff" },
  ],
  anim: [
    { sky: ["#5ab0ff", "#8ad0ff", "#c8ecff"], ground: "#5ad05a", m: "#ffb03a", a: "#ff5a8a", d: "#1a1a3a", l: "#ffffff" },
    { sky: ["#a87aff", "#c8a8ff", "#ece0ff"], ground: "#ff8ab0", m: "#5ae0b0", a: "#ffe05a", d: "#1a1a3a", l: "#ffffff" },
    { sky: ["#ff9a5a", "#ffc08a", "#ffe8c8"], ground: "#8a5ad8", m: "#5ac8ff", a: "#ff4a6a", d: "#1a1a3a", l: "#ffffff" },
  ],
  hero: [
    { sky: ["#0a1a4a", "#1a3a8a", "#3a6ad8"], ground: "#0a0e24", m: "#e0303a", a: "#ffd23f", d: "#05081a", l: "#ffffff" },
    { sky: ["#1a0a2a", "#3a1a5a", "#7a3ab0"], ground: "#0c0614", m: "#3ad05a", a: "#ffffff", d: "#06030a", l: "#ffffff" },
    { sky: ["#2a0a0a", "#6a1a1a", "#d8503a"], ground: "#120404", m: "#2a5ad8", a: "#ffe05a", d: "#060202", l: "#ffffff" },
  ],
  drama: [
    { sky: ["#2a3a4a", "#4a5a6a", "#7a8a96"], ground: "#2a2e34", m: "#c8ccd4", a: "#ffd88a", d: "#3a3a40", l: "#fff0c8" },
    { sky: ["#3a2a2a", "#6a4a40", "#a8806a"], ground: "#2a2020", m: "#d8c8b8", a: "#ffc06a", d: "#4a3430", l: "#fff0d8" },
    { sky: ["#1a2a2a", "#2a4a48", "#5a7a70"], ground: "#142020", m: "#c0d0c8", a: "#f0e08a", d: "#2a3a36", l: "#fff8d8" },
  ],
};

/** Sprites: m main, a accent, d dark, l light, . empty */
const S: Record<Motif, string[]> = {
  scifi: [".....l.....", "....lml....", "....mmm....", "...mmamm...", "...mmamm...", "...mmmmm...", "...mmmmm...", "..dmmmmmd..", ".ddmmmmmdd.", ".d.mmmmm.d.", "...a.a.a...", "...a.a.a...", "....a.a...."],
  horror: [".....d.......", "....ddd....d.", "...ddddd..dd.", "..ddddddd.dd.", ".ddddddddddd.", "..dad.ddadd..", "..ddd.ddddd..", "..dad.ddadd..", "..ddddddddd..", "..ddddaaddd..", "..ddddaaddd.."],
  western: ["....mm....", "....mm....", ".m..mm....", ".m..mm..m.", ".mmmmm..m.", "....mm..m.", "....mmmmm.", "....mm....", "....mm....", "....mm...."],
  war: [".....mmmm.......", "....mmmmmmdddddd", "..mmmmmmmmm.....", ".mmmmmmmmmmmm...", "dddddddddddddd..", "dldldldldldldd..", ".dddddddddddd..."],
  fantasy: [".a.......a..", ".m...a...m..", "mmm..m..mmm.", "mmm.mmm.mmm.", "mdm.mmm.mdm.", "mmmmmmmmmmm.", "mmmmmdmmmmm.", "mmmmddmmmmm.", "mmmmddmmmmm."],
  music: [".....dddddd", ".....dmmmmd", ".....d....d", ".....d....d", ".....d....d", "..mmmd..mmd", ".mmmmd.mmmd", ".mmmm..mmmm", "..mm....mm."],
  sport: ["...mmmm...", "..mmddmm..", ".mmmddmmm.", "mmdmmmmdmm", "mmddmmmddm", "mmmmmmmmmm", "mmdmmmmdmm", ".mmmddmmm.", "..mmmmmm..", "...mmmm..."],
  noir: ["..ddd..", ".ddddd.", "ddddddd", "..ddd..", "..ddd..", ".ddddd.", "ddddddd", "ddddddd", "ddddddd", ".ddddd.", ".dd.dd.", ".dd.dd.", ".dd.dd."],
  romance: [".mm...mm.", "mmmm.mmmm", "mmlmmmmmm", "mmmmmmmmm", ".mmmmmmm.", "..mmmmm..", "...mmm...", "....m...."],
  history: ["......m......", "....mmmmm....", "..mmmmmmmmm..", "mmmmmmmmmmmmm", ".l.l.l.l.l.l.", ".l.l.l.l.l.l.", ".l.l.l.l.l.l.", ".l.l.l.l.l.l.", "mmmmmmmmmmmmm"],
  adventure: ["......l......", "......ll.....", "......lll....", "......llll...", "......lllll..", "......l......", ".mmmmmmmmmm..", "..mmmmmmmm...", "...dddddd...."],
  action: [".....a.....", "..a..a..a..", "...aama....", ".aaammmaa..", "..ammlmma..", "aammlllmmaa", "..ammlmma..", ".aaammmaa..", "...aama....", "..a..a..a..", ".....a....."],
  comedy: ["..mmmmmmm..", ".mmmmmmmmm.", "mmddmmmddmm", "mmddmmmddmm", "mmmmmmmmmmm", "mdmmmmmmmdm", "mmdmmmmmdmm", ".mmdddddmm.", "..mmmmmmm.."],
  anim: ["...mmmmm...", ".mmmmmmmmm.", "mmmmmmmmmmm", "mllldmlllmm", "mlldlmlldlm", "mmmmmmmmmmm", "mmmmmaammmm", ".mmmmmmmmm.", ".mm.....mm."],
  hero: ["mmmmmmmmmmm", "mmmmmmmaamm", "mmmmmmaammm", "mmmmmaammmm", "mmmmaaaaamm", "mmmmmmaammm", ".mmmmaammm.", "..mmaammm..", "...mmmmm...", "....mmm....", ".....m....."],
  drama: ["ddddddddddd", "dlllldlllld", "dlllldlllld", "dlllldlllld", "ddddddddddd", "dlllldlllld", "dlllldlllld", "dlllldlllld", "ddddddddddd"],
};

type Extra = "stars" | "moon" | "sun" | "rain" | "confetti" | "clouds" | "smoke";
type Ground = "hills" | "city" | "flat" | "sea" | "dunes" | "crater";
const SCENE: Record<Motif, { extras: Extra[]; ground: Ground[] }> = {
  scifi: { extras: ["stars"], ground: ["crater", "hills"] },
  horror: { extras: ["moon", "stars"], ground: ["hills"] },
  western: { extras: ["sun"], ground: ["dunes", "flat"] },
  war: { extras: ["smoke"], ground: ["hills", "flat"] },
  fantasy: { extras: ["moon", "stars"], ground: ["hills"] },
  music: { extras: ["confetti"], ground: ["flat", "city"] },
  sport: { extras: ["sun", "clouds"], ground: ["flat"] },
  noir: { extras: ["rain"], ground: ["city"] },
  romance: { extras: ["sun", "clouds"], ground: ["hills", "city"] },
  history: { extras: ["sun", "clouds"], ground: ["dunes", "flat"] },
  adventure: { extras: ["sun", "clouds"], ground: ["sea"] },
  action: { extras: ["smoke"], ground: ["city"] },
  comedy: { extras: ["confetti"], ground: ["flat", "hills"] },
  anim: { extras: ["confetti", "clouds"], ground: ["hills"] },
  hero: { extras: ["stars"], ground: ["city"] },
  drama: { extras: ["clouds"], ground: ["city", "hills"] },
};

function rng(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let s = h >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function poster(id: string, motif: Motif): Px[] {
  const r = rng(id);
  const int = (a: number, b: number) => a + Math.floor(r() * (b - a + 1));
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const pal = pick(P[motif]);
  const scene = SCENE[motif];
  const out: Px[] = [];
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    if (w > 0 && h > 0) out.push({ x, y, w, h, c });
  };

  // sky in three stepped bands
  const b1 = int(8, 11);
  const b2 = b1 + int(6, 8);
  px(0, 0, W, b1, pal.sky[0]);
  px(0, b1, W, b2 - b1, pal.sky[1]);
  px(0, b2, W, H - b2, pal.sky[2]);

  // sky extras
  for (const e of scene.extras) {
    if (e === "stars") for (let i = 0; i < int(8, 16); i++) px(int(0, W - 1), int(0, b2), 1, 1, pal.l);
    if (e === "moon" || e === "sun") {
      const cx = int(4, W - 10);
      const cy = int(2, 7);
      const c = e === "sun" ? pal.a : pal.l;
      px(cx + 1, cy, 4, 6, c);
      px(cx, cy + 1, 6, 4, c);
      if (e === "moon") px(cx + 3, cy, 3, 5, pal.sky[0]);
    }
    if (e === "rain") for (let i = 0; i < 26; i++) px(int(0, W - 1), int(0, H - 8), 1, int(2, 3), pal.m);
    if (e === "confetti") {
      const cs = [pal.a, pal.l, pal.m];
      for (let i = 0; i < int(12, 20); i++) px(int(0, W - 1), int(0, 18), 1, 1, pick(cs));
    }
    if (e === "clouds") for (let i = 0; i < int(1, 3); i++) {
      const x = int(-4, W - 6);
      const y = int(1, 9);
      px(x + 2, y, 6, 1, pal.l);
      px(x, y + 1, 11, 2, pal.l);
    }
    if (e === "smoke") for (let i = 0; i < int(3, 5); i++) {
      const x = int(0, W - 8);
      const y = int(4, 14);
      px(x, y, int(5, 9), 2, pal.sky[0]);
      px(x + 2, y - 1, int(3, 5), 1, pal.sky[0]);
    }
  }

  // ground
  const g = pick(scene.ground);
  const gy = H - int(5, 7);
  if (g === "hills" || g === "dunes") {
    let y = gy - int(0, 3);
    for (let x = 0; x < W; x += 2) {
      y = Math.max(gy - 6, Math.min(gy + 1, y + int(-1, 1)));
      px(x, y, 2, H - y, pal.ground);
    }
    if (g === "dunes") px(0, gy + 2, W, 1, pal.d);
  } else if (g === "city") {
    for (let x = 0; x < W; ) {
      const bw = int(3, 7);
      const bh = int(4, 12);
      px(x, H - bh, bw, bh, pal.ground);
      for (let wy = H - bh + 1; wy < H - 1; wy += 2)
        for (let wx = x + 1; wx < x + bw - 1; wx += 2) if (r() < 0.35) px(wx, wy, 1, 1, pal.a);
      x += bw + int(0, 1);
    }
  } else if (g === "sea") {
    px(0, gy, W, H - gy, pal.ground);
    for (let i = 0; i < 10; i++) px(int(0, W - 3), int(gy + 1, H - 1), int(2, 4), 1, pal.l);
  } else if (g === "crater") {
    px(0, gy, W, H - gy, pal.ground);
    for (let i = 0; i < 4; i++) px(int(0, W - 5), int(gy + 1, H - 2), int(3, 5), 1, pal.d);
    const px0 = int(2, W - 14);
    px(px0, gy - 3, 10, 1, pal.ground); // a ridge
  } else {
    px(0, gy, W, H - gy, pal.ground);
  }

  // the motif sprite
  const rows = S[motif];
  const sw = Math.max(...rows.map((row) => row.length));
  const sh = rows.length;
  const scale = sh * 2 <= H - 4 && r() < 0.45 ? 2 : 1;
  const flip = r() < 0.5;
  const slots = [3, Math.floor((W - sw * scale) / 2), W - sw * scale - 3];
  const ox = slots[int(0, 2)];
  const oy = Math.min(H - sh * scale - 1, gy - sh * scale + int(1, 3));
  const color: Record<string, string> = { m: pal.m, a: pal.a, d: pal.d, l: pal.l };
  rows.forEach((row, y) => {
    let run = 0;
    let runC = "";
    let runX = 0;
    const cells = row.padEnd(sw, ".").split("");
    if (flip) cells.reverse();
    cells.push("."); // flush
    cells.forEach((ch, x) => {
      const c = color[ch] ?? "";
      if (c && c === runC) run++;
      else {
        if (runC) px(ox + runX * scale, oy + y * scale, run * scale, scale, runC);
        runC = c;
        runX = x;
        run = 1;
      }
    });
  });

  return out;
}
