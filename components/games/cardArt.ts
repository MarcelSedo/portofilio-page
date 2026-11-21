/**
 * Pixel pictures for Time Traveller cards, one style per kind of work:
 * - book: a cloth-bound cover with a spine, gilt border and a small ornament
 * - art: a gilded frame around a tiny landscape, seascape or portrait
 * - music: a record sleeve with the vinyl sliding out
 * - stage: red curtains, footlights and a figure in the spotlight
 * - film: the genre posters from poster.ts
 * Nothing is copied from real covers or paintings. Each card's picture is varied by a seed from its id,
 * and colours are never tied to the era, so the picture never gives the year away.
 * Pure functions: rectangles on the same 48×30 grid as the posters.
 */
import type { Kind } from "@/content/games/britain";
import { H, W, poster, type Motif, type Px } from "./poster";

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

type Draw = {
  px: (x: number, y: number, w: number, h: number, c: string) => void;
  int: (a: number, b: number) => number;
  pick: <T>(xs: T[]) => T;
  r: () => number;
};

function canvas(seed: string): [Px[], Draw] {
  const r = rng(seed);
  const out: Px[] = [];
  return [
    out,
    {
      r,
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (xs) => xs[Math.floor(r() * xs.length)],
      px: (x, y, w, h, c) => {
        if (w > 0 && h > 0) out.push({ x, y, w, h, c });
      },
    },
  ];
}

/* ---------------- book ---------------- */
const CLOTH = [
  ["#7a1f2b", "#521219"], ["#1f4a7a", "#122f52"], ["#2c5e3a", "#183b22"], ["#5a2c6e", "#391a47"],
  ["#8a5a1f", "#5a3a12"], ["#1d3b3b", "#0f2424"], ["#3a3a3a", "#1f1f1f"], ["#a8472a", "#6e2b17"],
];
const GILT = ["#e8c15a", "#d9b35a", "#f0dca0", "#c8cbd2"];
const DESK = ["#3b2a1d", "#2a1f17", "#4a3424", "#26303a"];

function book(id: string): Px[] {
  const [out, d] = canvas(id);
  const [cloth, dark] = d.pick(CLOTH);
  const gilt = d.pick(GILT);
  d.px(0, 0, W, H, d.pick(DESK));
  // a little lamp light on the desk
  d.px(0, 0, W, 2, "#00000030");
  const bw = d.int(24, 30);
  const x0 = d.int(6, W - bw - 6);
  const y0 = 2;
  const bh = H - 4;
  // pages peeking out at the bottom and the right
  d.px(x0 + 2, y0 + 1, bw, bh, "#efe6cf");
  d.px(x0 + 3, y0 + 2, bw - 1, bh - 1, "#d8cdb0");
  // the cover
  d.px(x0, y0, bw, bh, cloth);
  d.px(x0, y0, 4, bh, dark); // spine
  d.px(x0 + 4, y0, 1, bh, "#00000040");
  for (let y = y0 + 3; y < y0 + bh - 2; y += d.int(5, 7)) d.px(x0, y, 4, 1, gilt); // spine bands
  // gilt border
  const bx = x0 + 6;
  const by = y0 + 2;
  const bwi = bw - 8;
  const bhi = bh - 4;
  d.px(bx, by, bwi, 1, gilt);
  d.px(bx, by + bhi - 1, bwi, 1, gilt);
  d.px(bx, by, 1, bhi, gilt);
  d.px(bx + bwi - 1, by, 1, bhi, gilt);
  if (d.r() < 0.5) {
    // corner pieces
    for (const [cx, cy] of [[bx + 2, by + 2], [bx + bwi - 4, by + 2], [bx + 2, by + bhi - 4], [bx + bwi - 4, by + bhi - 4]])
      d.px(cx, cy, 2, 2, gilt);
  }
  // title plaque
  const tw = bwi - 6;
  d.px(bx + 3, by + 3, tw, 4, d.r() < 0.5 ? gilt : dark);
  d.px(bx + 5, by + 4, tw - 4, 1, d.r() < 0.5 ? dark : cloth);
  d.px(bx + 6, by + 6, tw - 6, 1, dark);
  // ornament in the middle
  const cx = bx + Math.floor(bwi / 2);
  const cy = by + Math.floor(bhi / 2) + 3;
  const orn = d.int(0, 3);
  if (orn === 0) {
    // diamond
    for (let i = 0; i < 4; i++) d.px(cx - i, cy - 3 + i, 1 + i * 2, 1, gilt);
    for (let i = 0; i < 3; i++) d.px(cx - 2 + i, cy + 1 + i, 5 - i * 2, 1, gilt);
  } else if (orn === 1) {
    // star
    d.px(cx, cy - 4, 1, 9, gilt);
    d.px(cx - 4, cy, 9, 1, gilt);
    d.px(cx - 1, cy - 1, 3, 3, gilt);
  } else if (orn === 2) {
    // leaf sprig
    d.px(cx, cy - 4, 1, 9, gilt);
    for (let i = 0; i < 3; i++) {
      d.px(cx - 3, cy - 3 + i * 3, 3, 1, gilt);
      d.px(cx + 1, cy - 2 + i * 3, 3, 1, gilt);
    }
  } else {
    // crest: a shield
    d.px(cx - 3, cy - 4, 7, 5, gilt);
    d.px(cx - 2, cy + 1, 5, 2, gilt);
    d.px(cx - 1, cy + 3, 3, 1, gilt);
    d.px(cx - 1, cy - 3, 3, 3, cloth);
  }
  // ribbon bookmark
  if (d.r() < 0.6) d.px(x0 + bw - d.int(5, 8), y0 + bh, 2, 2, d.pick(["#c0303a", "#e8c15a", "#3a7ad8"]));
  return out;
}

/* ---------------- art ---------------- */
const WALL = ["#5a1e2a", "#1f3a4a", "#2c4030", "#4a3a5a", "#6a4a2a"];
const GOLD = { hi: "#f2d27a", mid: "#c8962a", lo: "#7a5212" };

function art(id: string): Px[] {
  const [out, d] = canvas(id);
  d.px(0, 0, W, H, d.pick(WALL));
  // wallpaper stripes
  for (let x = d.int(0, 3); x < W; x += 6) d.px(x, 0, 1, H, "#ffffff12");
  const fw = d.int(30, 38);
  const fh = 26;
  const fx = Math.floor((W - fw) / 2) + d.int(-3, 3);
  const fy = 2;
  // frame: three steps of gold
  d.px(fx, fy, fw, fh, GOLD.lo);
  d.px(fx, fy, fw, 1, GOLD.hi);
  d.px(fx, fy, 1, fh, GOLD.hi);
  d.px(fx + 1, fy + 1, fw - 2, fh - 2, GOLD.mid);
  for (let x = fx + 2; x < fx + fw - 2; x += 3) {
    d.px(x, fy + 1, 1, 1, GOLD.hi);
    d.px(x, fy + fh - 2, 1, 1, GOLD.lo);
  }
  d.px(fx + 2, fy + 2, fw - 4, fh - 4, GOLD.lo);
  // the canvas
  const cx = fx + 3;
  const cy = fy + 3;
  const cw = fw - 6;
  const ch = fh - 6;
  const scene = d.int(0, 3);
  if (scene === 0 || scene === 1) {
    // landscape (0) or seascape (1)
    const sky = d.pick([["#8ab0d8", "#c8d8e8"], ["#e8a86a", "#f4d8a8"], ["#5a6a8a", "#a8b0c0"], ["#b8c8b0", "#e8e8d0"]]);
    const h1 = Math.floor(ch * 0.4);
    d.px(cx, cy, cw, h1, sky[0]);
    d.px(cx, cy + h1, cw, ch - h1, sky[1]);
    // sun or moon
    if (d.r() < 0.6) d.px(cx + d.int(2, cw - 6), cy + d.int(1, 4), 3, 3, d.pick(["#fff4c0", "#ffe08a", "#ffffff"]));
    // clouds
    for (let i = 0; i < d.int(1, 3); i++) {
      const x = cx + d.int(0, cw - 8);
      const y = cy + d.int(1, 6);
      d.px(x, y, d.int(5, 8), 1, "#ffffffb0");
      d.px(x + 1, y - 1, d.int(2, 4), 1, "#ffffffb0");
    }
    const gy = cy + d.int(Math.floor(ch * 0.55), Math.floor(ch * 0.7));
    if (scene === 0) {
      const greens = d.pick([["#5a7a3a", "#3a5a24"], ["#8a8a3a", "#5a6a2a"], ["#6a8a5a", "#3a5a3a"]]);
      let y = gy;
      for (let x = cx; x < cx + cw; x += 2) {
        y = Math.max(gy - 2, Math.min(gy + 2, y + d.int(-1, 1)));
        d.px(x, y, Math.min(2, cx + cw - x), cy + ch - y, greens[0]);
      }
      d.px(cx, cy + ch - 3, cw, 3, greens[1]);
      // a tree
      const tx = cx + d.int(2, cw - 7);
      d.px(tx + 2, gy - 1, 1, 5, "#4a3020");
      d.px(tx, gy - 6, 5, 5, greens[1]);
      d.px(tx + 1, gy - 7, 3, 1, greens[1]);
      // a cottage or a church
      if (d.r() < 0.5) {
        const hx = cx + d.int(2, cw - 8);
        d.px(hx, gy, 5, 3, "#e8dcc0");
        d.px(hx - 1, gy - 1, 7, 1, "#8a3a2a");
        d.px(hx, gy - 2, 5, 1, "#8a3a2a");
        d.px(hx + 2, gy + 1, 1, 2, "#4a3020");
      }
      // a river
      if (d.r() < 0.4) d.px(cx, cy + ch - 2, cw, 1, sky[0]);
    } else {
      const sea = d.pick(["#2a5a7a", "#3a6a6a", "#4a5a6a"]);
      d.px(cx, gy, cw, cy + ch - gy, sea);
      for (let i = 0; i < 8; i++) d.px(cx + d.int(0, cw - 3), d.int(gy + 1, cy + ch - 1), d.int(2, 3), 1, "#ffffff70");
      // a sailing ship
      const sx = cx + d.int(2, cw - 10);
      d.px(sx, gy - 1, 8, 2, "#3a2418");
      d.px(sx + 1, gy + 1, 6, 1, "#3a2418");
      d.px(sx + 3, gy - 9, 1, 8, "#3a2418");
      d.px(sx + 1, gy - 8, 2, 5, "#f0e8d0");
      d.px(sx + 4, gy - 7, 3, 5, "#f0e8d0");
    }
  } else {
    // portrait (2) or still life (3)
    const bg = d.pick(["#2a2420", "#3a3428", "#24302a", "#3a2a30", "#5a6a7a"]);
    d.px(cx, cy, cw, ch, bg);
    d.px(cx, cy, cw, 2, "#00000030");
    if (scene === 2) {
      const skin = d.pick(["#f0d0b0", "#e8c098", "#d8a880", "#a8704a", "#7a4a30"]);
      const hair = d.pick(["#3a2418", "#8a5a2a", "#d8c080", "#1a1410", "#e8e0d0", "#a83a1a"]);
      const dress = d.pick(["#2a4a8a", "#8a2a3a", "#2a2a2a", "#3a6a4a", "#e8e0d0", "#6a3a7a"]);
      const mx = cx + Math.floor(cw / 2);
      // shoulders
      d.px(mx - 8, cy + ch - 6, 16, 6, dress);
      d.px(mx - 6, cy + ch - 7, 12, 1, dress);
      if (d.r() < 0.5) d.px(mx - 2, cy + ch - 6, 4, 2, "#f0e8e0"); // collar / lace
      // neck and head
      d.px(mx - 1, cy + ch - 9, 3, 3, skin);
      d.px(mx - 3, cy + 3, 7, 8, skin);
      d.px(mx - 2, cy + 11, 5, 1, skin);
      // hair: short, long or a wig
      const style = d.int(0, 2);
      d.px(mx - 4, cy + 2, 9, 2, hair);
      if (style === 0) d.px(mx - 4, cy + 4, 1, 4, hair);
      if (style === 1) {
        d.px(mx - 5, cy + 3, 2, 10, hair);
        d.px(mx + 4, cy + 3, 2, 10, hair);
      }
      if (style === 2) {
        d.px(mx - 5, cy + 1, 11, 2, "#e8e4dc");
        d.px(mx - 5, cy + 3, 2, 6, "#e8e4dc");
        d.px(mx + 4, cy + 3, 2, 6, "#e8e4dc");
      }
      // eyes and mouth
      d.px(mx - 2, cy + 6, 1, 1, "#2a1a10");
      d.px(mx + 2, cy + 6, 1, 1, "#2a1a10");
      d.px(mx, cy + 9, 1, 1, "#a8504a");
      // a hat, sometimes
      if (d.r() < 0.3) {
        const hat = d.pick(["#1a1a1a", "#5a2a1a", "#2a3a5a"]);
        d.px(mx - 6, cy + 2, 13, 1, hat);
        d.px(mx - 3, cy, 7, 2, hat);
      }
    } else {
      // still life: a table, a vase of flowers, fruit
      const table = d.pick(["#6a4424", "#4a3020", "#8a6a4a"]);
      const ty = cy + ch - 7;
      d.px(cx, ty, cw, 7, table);
      d.px(cx, ty, cw, 1, "#ffffff30");
      const vx = cx + d.int(3, cw - 9);
      const vase = d.pick(["#3a6a8a", "#e8e0d0", "#8a3a2a", "#2a5a3a"]);
      d.px(vx + 1, ty - 6, 4, 6, vase);
      d.px(vx, ty - 4, 6, 3, vase);
      d.px(vx + 2, ty - 10, 1, 4, "#3a6a2a");
      d.px(vx + 4, ty - 9, 1, 3, "#3a6a2a");
      for (let i = 0; i < d.int(3, 5); i++)
        d.px(vx + d.int(-2, 6), ty - d.int(10, 13), 2, 2, d.pick(["#e0304a", "#ffd23f", "#ffffff", "#c060c0", "#ff8a3a"]));
      for (let i = 0; i < d.int(1, 3); i++) {
        const fx2 = cx + d.int(1, cw - 4);
        if (Math.abs(fx2 - vx) > 6) d.px(fx2, ty - 2, 3, 2, d.pick(["#c0303a", "#e8b030", "#6a9a3a"]));
      }
    }
  }
  // varnish glint
  d.px(cx + 1, cy + 1, 1, 1, "#ffffff40");
  // a small brass label under the frame is implied by the frame's bottom edge
  return out;
}

/* ---------------- music ---------------- */
const SLEEVE = [
  ["#e0303a", "#ffd23f", "#1a1a2a"], ["#1a1a1a", "#f0f0f0", "#e0303a"], ["#3a6ad8", "#f4efe0", "#1a1a3a"],
  ["#f4efe0", "#1a1a1a", "#3ac0b0"], ["#5a2a7a", "#ff8ab0", "#ffe05a"], ["#2a6a3a", "#f2d27a", "#1a2a1a"],
  ["#f08a3a", "#2a1a3a", "#fff4d0"], ["#7a1f2b", "#e8c15a", "#f4efe0"],
];

function music(id: string): Px[] {
  const [out, d] = canvas(id);
  const [base, fg, ink] = d.pick(SLEEVE);
  const room = d.pick(["#4a3a5a", "#3a4a5a", "#5a4a3a", "#3a5a4a"]);
  d.px(0, 0, W, H, room);
  // shelf line
  d.px(0, H - 3, W, 3, "#00000050");
  const s = 24;
  const sx = d.int(4, 10);
  const sy = 3;
  // the record, sliding out to the right
  const rx = sx + s - d.int(8, 13);
  const disc = (ox: number, oy: number) => {
    const rows = [6, 10, 14, 16, 18, 20, 20, 22, 22, 24, 24, 24, 24, 24, 24, 22, 22, 20, 20, 18, 16, 14, 10, 6];
    rows.forEach((w, y) => d.px(ox + (24 - w) / 2, oy + y, w, 1, "#141414"));
    for (const gy of [3, 6, 17, 20]) d.px(ox + 6, oy + gy, 12, 1, "#2a2a2a"); // grooves
    d.px(ox + 9, oy + 9, 6, 6, d.pick([fg, "#e0303a", "#ffd23f", "#f4efe0"])); // label
    d.px(ox + 11, oy + 11, 2, 2, "#141414");
    d.px(ox + 5, oy + 4, 3, 1, "#ffffff30"); // shine
  };
  disc(rx, sy);
  // the sleeve
  d.px(sx, sy, s, s, base);
  d.px(sx, sy, s, 1, "#ffffff30");
  d.px(sx + s - 1, sy, 1, s, "#00000040");
  const art = d.int(0, 4);
  if (art === 0) {
    // stripes
    for (let y = sy + 3; y < sy + s - 3; y += 4) d.px(sx + 2, y, s - 4, 2, fg);
  } else if (art === 1) {
    // a big circle
    const rows = [4, 8, 10, 12, 12, 14, 14, 14, 14, 12, 12, 10, 8, 4];
    rows.forEach((w, y) => d.px(sx + (s - w) / 2, sy + 5 + y, w, 1, fg));
  } else if (art === 2) {
    // checkerboard
    for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++) if ((x + y) % 2 === 0) d.px(sx + 2 + x * 4, sy + 2 + y * 4, 4, 4, fg);
  } else if (art === 3) {
    // a lightning bolt
    for (let i = 0; i < 8; i++) d.px(sx + 13 - i, sy + 3 + i, 4, 1, fg);
    d.px(sx + 6, sy + 11, 10, 2, fg);
    for (let i = 0; i < 8; i++) d.px(sx + 12 - i, sy + 13 + i, 4, 1, fg);
  } else {
    // a skyline of notes: five staff lines with note heads (sheet music for older pieces)
    for (let i = 0; i < 5; i++) d.px(sx + 2, sy + 6 + i * 3, s - 4, 1, fg);
    for (let i = 0; i < 5; i++) {
      const nx = sx + 4 + i * 4;
      const ny = sy + 5 + d.int(0, 10);
      d.px(nx, ny, 2, 2, ink);
      d.px(nx + 2, ny - 5, 1, 6, ink);
    }
  }
  // band name strip
  d.px(sx + 2, sy + s - 4, d.int(10, 18), 2, ink);
  return out;
}

/* ---------------- stage ---------------- */
const CURTAIN = [
  ["#9a1a24", "#6a0e16", "#c8303a"], ["#2a3a8a", "#1a2458", "#3a5ac0"], ["#2a6a3a", "#183f22", "#3a8a4a"],
  ["#6a1a5a", "#420e38", "#8a2a7a"],
];

function stage(id: string): Px[] {
  const [out, d] = canvas(id);
  const [c, cd, cl] = d.pick(CURTAIN);
  d.px(0, 0, W, H, d.pick(["#2a2438", "#1f2a3a", "#33261f"]));
  // stage floor
  d.px(0, H - 7, W, 7, "#5a3a24");
  for (let y = H - 6; y < H; y += 2) d.px(0, y, W, 1, "#4a2e1c");
  // spotlight cone and pool
  const sx = d.int(16, 30);
  for (let y = 0; y < H - 7; y++) {
    const w = 2 + Math.floor(y / 2.2);
    d.px(sx - Math.floor(w / 2), y, w, 1, "#fff4c040");
  }
  d.px(sx - 7, H - 7, 14, 2, "#fff4c080");
  // the figure: a silhouette with a prop
  const fx = sx - 2;
  const fy = H - 18;
  const fig = "#141018";
  d.px(fx + 1, fy, 3, 3, fig); // head
  d.px(fx, fy + 3, 5, 6, fig); // body
  d.px(fx, fy + 9, 2, 3, fig);
  d.px(fx + 3, fy + 9, 2, 3, fig);
  const prop = d.int(0, 3);
  if (prop === 0) {
    // a skull held up
    d.px(fx + 5, fy + 2, 1, 3, fig);
    d.px(fx + 6, fy, 3, 3, "#e8e0d0");
  } else if (prop === 1) {
    // a crown
    d.px(fx + 1, fy - 1, 3, 1, "#ffd23f");
    d.px(fx + 1, fy - 2, 1, 1, "#ffd23f");
    d.px(fx + 3, fy - 2, 1, 1, "#ffd23f");
  } else if (prop === 2) {
    // a sword
    d.px(fx - 1, fy + 3, 1, 2, fig);
    d.px(fx - 2, fy - 3, 1, 7, "#c8ccd4");
  } else {
    // a top hat and a cane
    d.px(fx, fy - 1, 5, 1, fig);
    d.px(fx + 1, fy - 4, 3, 3, fig);
    d.px(fx + 6, fy + 4, 1, 8, "#c8a060");
  }
  // curtains with folds, drawn back to the sides
  const left = d.int(10, 14);
  const right = d.int(10, 14);
  for (let x = 0; x < left; x++) {
    const h = H - 6 - Math.max(0, x - left + 4) * 3;
    d.px(x, 0, 1, h, x % 3 === 0 ? cd : x % 3 === 1 ? c : cl);
  }
  for (let x = 0; x < right; x++) {
    const h = H - 6 - Math.max(0, x - right + 4) * 3;
    d.px(W - 1 - x, 0, 1, h, x % 3 === 0 ? cd : x % 3 === 1 ? c : cl);
  }
  // tie-backs
  d.px(left - 4, 15, 4, 1, "#e8c15a");
  d.px(W - right, 15, 4, 1, "#e8c15a");
  // valance with tassels
  d.px(0, 0, W, 4, c);
  d.px(0, 4, W, 1, cd);
  for (let x = 1; x < W; x += 4) d.px(x, 5, 2, 1, "#e8c15a");
  // footlights
  for (let x = 4; x < W - 3; x += 6) d.px(x, H - 7, 2, 1, "#ffe08a");
  // theatre masks on the valance, sometimes
  if (d.r() < 0.5) {
    const mx = Math.floor(W / 2) - 3;
    d.px(mx, 1, 3, 3, "#f4efe0");
    d.px(mx + 4, 1, 3, 3, "#e8c15a");
  }
  return out;
}

/** The picture for one card. Films get a genre poster; everything else its own kind of picture. */
export function cardArt(id: string, kind: Kind, motif?: Motif): Px[] {
  if (kind === "book") return book(id);
  if (kind === "art") return art(id);
  if (kind === "music") return music(id);
  if (kind === "stage") return stage(id);
  return poster(id, motif ?? "drama");
}

export { W, H };
