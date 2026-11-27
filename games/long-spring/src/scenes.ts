/**
 * The scenes at the end of each chapter: where the memory happened, green and in bloom.
 * Drawn in "scene units": Brigid arrives at (360, 110); the scene lies below her, roughly x 30–690, y 120–480.
 * The still part is baked once into a sprite; the live part (fire, ribbons, dancers, petals) is drawn every frame.
 */
import { OL, TAU, alpha, bake, blobs, ell, line, paint, rnd, shade, type Land, type Spr } from "./sprites";
import type { AnimalId } from "./art-life";

type G = CanvasRenderingContext2D;
type Item = [number, (g: G) => void];

export type SceneArt = { land: Land; spring: Spr[]; folk: Spr[][]; beasts: Record<AnimalId, Spr[]>; cott: Spr[]; well: Spr; flowers: string[] };

/** where she stands when the chapter ends, in scene units */
export const SCENE_AT = { x: 360, y: 85 };
const BOX = { x0: 0, y0: 30, x1: 720, y1: 520 };

/* ---------------- small helpers, same hand as the sprites ---------------- */

function put(g: G, s: Spr, x: number, y: number, k = 1, flip = false) {
  g.save();
  g.translate(x, y);
  if (flip) g.scale(-1, 1);
  g.drawImage(s.c, -s.ax * k, -s.ay * k, s.w * k, s.h * k);
  g.restore();
}

function zoom(g: G, cx: number, cy: number, k: number, fn: () => void) {
  g.save();
  g.translate(cx, cy);
  g.scale(k, k);
  g.translate(-cx, -cy);
  fn();
  g.restore();
}

function sorted(g: G, items: Item[]) {
  items.sort((a, b) => a[0] - b[0]);
  for (const [, fn] of items) fn(g);
}

function tufts(g: G, seed: number, x0: number, y0: number, w: number, h: number, n: number) {
  const r = rnd(seed);
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w;
    const y = y0 + r() * h;
    g.strokeStyle = r() < 0.5 ? "#3f7a2c" : "#86c058";
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(x - 3, y - 4);
    g.lineTo(x, y);
    g.lineTo(x + 1, y - 6);
    g.moveTo(x, y);
    g.lineTo(x + 4, y - 4);
    g.stroke();
  }
}

function flowers(g: G, seed: number, x0: number, y0: number, w: number, h: number, n: number, cols: string[]) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w;
    const y = y0 + r() * h;
    const c = cols[Math.floor(r() * cols.length)];
    for (let p = 0; p < 4; p++) {
      const a = (p / 4) * TAU + 0.4;
      ell(g, x + Math.cos(a) * 1.8, y + Math.sin(a) * 1.3, 1.5, 1.2);
      paint(g, c, 0.35);
    }
    ell(g, x, y, 0.9, 0.9);
    g.fillStyle = "#f0b030";
    g.fill();
  }
}

function glowAt(g: G, x: number, y: number, r: number, rgb: string, a = 0.45) {
  const gr = g.createRadialGradient(x, y, 2, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}

/** the meadow: green ground and flowers, fading out at the edges into whatever the land is */
function meadow(g: G, art: SceneArt, seed: number) {
  g.save();
  for (let y = BOX.y0 - 40; y < BOX.y1; y += 160) for (let x = BOX.x0; x < BOX.x1; x += 160) g.drawImage(art.land.ground.c, x, y, 160, 160);
  const r = rnd(seed);
  for (let i = 0; i < 18; i++) {
    ell(g, 40 + r() * 640, 140 + r() * 340, 30 + r() * 60, 12 + r() * 22);
    g.fillStyle = alpha("#7cb456", 0.35);
    g.fill();
  }
  tufts(g, seed + 1, 30, 130, 660, 360, 150);
  flowers(g, seed + 2, 30, 130, 660, 360, 120, art.flowers);
  // soft edge: an oval of meadow, the top narrowing to where she comes in
  g.globalCompositeOperation = "destination-in";
  g.translate(360, 300);
  g.scale(1, 0.62);
  const m = g.createRadialGradient(0, 0, 150, 0, 0, 340);
  m.addColorStop(0, "rgba(0,0,0,1)");
  m.addColorStop(0.75, "rgba(0,0,0,0.85)");
  m.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = m;
  g.fillRect(-400, -400, 800, 800);
  g.restore();
  g.globalCompositeOperation = "source-over";
}

/** a few trees in bloom at the sides, framing it */
function frame(items: Item[], art: SceneArt, seed: number, wide = 280) {
  const r = rnd(seed);
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const x = 360 + side * (wide + k * 26 + r() * 20);
      const y = 190 + k * 100 + r() * 20;
      const big = r() < 0.4;
      items.push([y, (g) => (big ? put(g, art.spring[0], x, y, 0.85) : put(g, art.land.tree[Math.floor(r() * 3)], x, y, 1.05, side > 0))]);
    }
  }
}

function water(g: G, pts: [number, number][], wide: number) {
  const path = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i][0] + pts[i + 1][0]) / 2;
      const my = (pts[i][1] + pts[i + 1][1]) / 2;
      g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
    }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  };
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const [w, c] of [[wide + 14, "#4a7a32"], [wide + 3, OL], [wide, "#3a86c0"], [wide * 0.55, "#5aa8dc"]] as const) {
    path();
    g.strokeStyle = c;
    g.lineWidth = w;
    g.stroke();
  }
}

/** glints drifting along the water */
function glints(g: G, pts: [number, number][], wide: number, t: number, seed: number) {
  const r = rnd(seed);
  for (let i = 0; i < pts.length - 1; i++) {
    for (let k = 0; k < 3; k++) {
      const t0 = (r() + t * 0.06) % 1;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t0 + (r() - 0.5) * wide * 0.5;
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t0 + (r() - 0.5) * wide * 0.3;
      const a = Math.sin(t0 * Math.PI);
      g.strokeStyle = `rgba(220,245,255,${(0.85 * a).toFixed(2)})`;
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(x, y + 3, 5, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
  }
}

function reeds(g: G, x: number, y: number, seed: number) {
  const r = rnd(seed);
  for (let i = 0; i < 5; i++) {
    const dx = (i - 2) * 3 + (r() - 0.5) * 2;
    const h = 12 + r() * 8;
    line(g, [[x + dx, y], [x + dx + (r() - 0.5) * 4, y - h]], 1.2, "#5a9a3a");
    if (i % 2) {
      ell(g, x + dx, y - h + 2, 1.6, 3.5);
      paint(g, "#7a4a2a", 0.5);
    }
  }
}

function ribbonStream(g: G, x: number, y: number, len: number, dir: number, ph: number, w = 3) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    pts.push([x + dir * len * t, y + Math.sin(t * 7 + ph) * 7 * t + t * 10]);
  }
  line(g, pts, w, "#3aa060");
  line(g, pts.map(([a, b]) => [a, b - w * 0.25] as [number, number]), w * 0.35, "#7ad890", false);
}

function bow(g: G, x: number, y: number) {
  ell(g, x - 4, y, 4, 2.6, -0.3);
  paint(g, "#3aa060", 0.7);
  ell(g, x + 4, y, 4, 2.6, 0.3);
  paint(g, "#3aa060", 0.7);
  ell(g, x, y, 1.6, 1.6);
  paint(g, "#2a8050", 0.6);
}

/** a big apple tree in blossom */
function bigBlossom(g: G, x: number, y: number, k: number, seed: number) {
  const r = rnd(seed);
  ell(g, x + 6, y + 2, 60 * k, 14 * k);
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.fill();
  glowAt(g, x, y - 90 * k, 130 * k, "255,236,200", 0.35);
  g.beginPath();
  g.moveTo(x - 12 * k, y);
  g.bezierCurveTo(x - 20 * k, y - 30 * k, x + 8 * k, y - 50 * k, x - 6 * k, y - 82 * k);
  g.lineTo(x + 8 * k, y - 82 * k);
  g.bezierCurveTo(x + 20 * k, y - 50 * k, x - 2 * k, y - 30 * k, x + 13 * k, y);
  g.closePath();
  paint(g, "#6a4a30", 1.3);
  line(g, [[x, y - 60 * k], [x - 34 * k, y - 92 * k]], 4 * k, "#6a4a30");
  line(g, [[x + 2 * k, y - 66 * k], [x + 36 * k, y - 96 * k]], 4 * k, "#6a4a30");
  const bl: [number, number, number, number, number][] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    bl.push([x + Math.cos(a) * 48 * k + (r() - 0.5) * 8, y - 112 * k + Math.sin(a) * 28 * k, (18 + r() * 8) * k, (14 + r() * 5) * k, r() * 3]);
  }
  bl.push([x, y - 116 * k, 34 * k, 24 * k, 0]);
  blobs(g, bl, "#5ab04a", 1.1);
  const cx0 = x;
  const cy0 = y - 112 * k;
  const pink = bl.map(([bx, by, rx, ry, rr]) => [cx0 + (bx - cx0) * 0.9, cy0 + (by - cy0) * 0.85 - 5 * k, rx * 0.92, ry * 0.85, rr] as [number, number, number, number, number]);
  blobs(g, pink, "#ffc8da", 0);
  for (const [bx, by, rx, ry] of pink) {
    ell(g, bx - rx * 0.25, by - ry * 0.35, rx * 0.5, ry * 0.35, -0.3);
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.fill();
  }
  for (let i = 0; i < 70; i++) {
    const [bx, by, rx, ry] = bl[Math.floor(r() * bl.length)];
    ell(g, bx + (r() - 0.5) * rx * 1.5, by + (r() - 0.5) * ry * 1.4, 1.9, 1.9);
    paint(g, i % 3 ? "#ffffff" : "#ff9ab4", 0.4);
  }
}

function petals(g: G, seed: number, x: number, y: number, w: number, h: number, n: number) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    ell(g, x + r() * w, y + r() * h, 2.2, 1.3, r() * 3);
    paint(g, r() < 0.6 ? "#ffd6e2" : "#ffffff", 0.35);
  }
}

/** petals in the air, drifting down and sideways */
function fallingPetals(g: G, seed: number, x: number, y: number, w: number, h: number, n: number, t: number) {
  const r = rnd(seed);
  for (let i = 0; i < n; i++) {
    const sp = 0.05 + r() * 0.05;
    const f = (r() + t * sp) % 1;
    const px = x + r() * w + Math.sin(t * 1.3 + i) * 10 + f * 30;
    const py = y + f * h;
    g.globalAlpha = Math.sin(f * Math.PI);
    ell(g, px, py, 2.2, 1.3, t * 2 + i);
    paint(g, i % 3 ? "#ffd6e2" : "#ffffff", 0.35);
  }
  g.globalAlpha = 1;
}

function stone(g: G, x: number, y: number, rx: number, ry: number, c = "#8a8678") {
  ell(g, x + 2, y + 2, rx, ry * 0.6);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  ell(g, x, y, rx, ry);
  paint(g, c, 1);
  ell(g, x - rx * 0.3, y - ry * 0.35, rx * 0.45, ry * 0.3);
  g.fillStyle = alpha(shade(c, 0.3), 0.8);
  g.fill();
}

function flame(g: G, x: number, y: number, k: number, t: number) {
  const fl = Math.sin(t * 9) * 0.06 + Math.sin(t * 13.7) * 0.04;
  glowAt(g, x, y - 20 * k, (110 + Math.sin(t * 5) * 8) * k, "255,170,60", 0.5);
  const layer = (s: number, c: string, lean: number) => {
    const h = 1 + fl * (2 - s);
    g.beginPath();
    g.moveTo(x - 22 * k * s, y);
    g.bezierCurveTo(x - 30 * k * s, y - 24 * k * s * h, x - 8 * k * s, y - 30 * k * s * h, x - 10 * k * s + lean, y - 52 * k * s * h);
    g.bezierCurveTo(x - 2 * k * s, y - 40 * k * s * h, x + 2 * k * s, y - 58 * k * s * h, x + 4 * k * s + lean * 1.5, y - 70 * k * s * h);
    g.bezierCurveTo(x + 12 * k * s, y - 46 * k * s * h, x + 20 * k * s, y - 44 * k * s * h, x + 16 * k * s + lean, y - 30 * k * s * h);
    g.bezierCurveTo(x + 30 * k * s, y - 20 * k * s, x + 26 * k * s, y - 6 * k * s, x + 22 * k * s, y);
    g.closePath();
    paint(g, c, s === 1 ? 1.2 : 0);
  };
  const lean = Math.sin(t * 3.1) * 3;
  layer(1, "#e0482a", lean);
  layer(0.72, "#ff9a2a", lean * 1.3);
  layer(0.42, "#ffe46a", lean * 1.6);
  // sparks rising
  for (let i = 0; i < 8; i++) {
    const f = (i / 8 + t * 0.5) % 1;
    const sx = x + Math.sin(i * 2.3 + t) * 16 * k;
    const sy = y - 40 * k - f * 90 * k;
    g.fillStyle = `rgba(255,${180 + i * 8},90,${(1 - f).toFixed(2)})`;
    g.fillRect(sx, sy, 1.6, 1.6);
  }
}

function candle(g: G, x: number, y: number, t: number) {
  const fl = Math.sin(t * 11 + x) * 0.12;
  glowAt(g, x, y - 18, 34 * (1 + fl), "255,210,120", 0.55);
  g.beginPath();
  g.rect(x - 3, y - 14, 6, 14);
  paint(g, "#f6f1e4", 0.9);
  ell(g, x, y - 14, 3, 1.2);
  paint(g, "#e8dcc0", 0.6);
  const top = y - 24 - fl * 6;
  g.beginPath();
  g.moveTo(x + fl * 3, top);
  g.quadraticCurveTo(x + 3.5, y - 17, x, y - 15);
  g.quadraticCurveTo(x - 3.5, y - 17, x + fl * 3, top);
  paint(g, "#ffd84a", 0.7);
}

function sheep(g: G, x: number, y: number, flip: boolean, seed: number) {
  const r = rnd(seed);
  const s = flip ? -1 : 1;
  ell(g, x, y + 1, 11, 3.5);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  for (const dx of [-5, 4]) line(g, [[x + dx, y - 4], [x + dx, y]], 1.6, "#2a2420");
  const wool: [number, number, number, number, number][] = [];
  for (let i = 0; i < 7; i++) wool.push([x + (i - 3) * 2.6, y - 9 + (r() - 0.5) * 4, 4.5, 4, 0]);
  blobs(g, wool, "#f4efe2", 0.9);
  ell(g, x + s * 11, y - 9, 3.4, 4.2, s * 0.4);
  paint(g, "#2a2420", 0.8);
  ell(g, x + s * 12.5, y - 10.5, 0.7, 0.7);
  g.fillStyle = "#fff";
  g.fill();
}

/** the hound, sitting (same drawing as the companion) */
function hound(g: G, x: number, y: number, k: number) {
  g.save();
  g.translate(x, y);
  g.scale(k, k);
  const c = "#6e6e78";
  ell(g, 0, 1, 9, 3);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  ell(g, 0, -9, 7, 9);
  paint(g, c, 1);
  ell(g, 0, -21, 5.5, 5);
  paint(g, c, 1);
  for (const s of [-1, 1]) {
    g.beginPath();
    g.moveTo(s * 2.5, -24);
    g.lineTo(s * 6, -31);
    g.lineTo(s * 5.5, -22);
    g.closePath();
    paint(g, shade(c, -0.2), 0.8);
  }
  ell(g, 0, -18.5, 2.6, 2);
  paint(g, shade(c, 0.25), 0.6);
  ell(g, 0, -19.5, 1, 0.8);
  g.fillStyle = OL;
  g.fill();
  for (const s of [-1, 1]) {
    ell(g, s * 2.2, -22.5, 0.8, 0.8);
    g.fillStyle = OL;
    g.fill();
  }
  g.restore();
}

/* ---------------- the scenes ---------------- */

type Scene = { still: (g: G, a: SceneArt) => void; live?: (g: G, a: SceneArt, t: number) => void };

const RIVER1: [number, number][] = [[-20, 400], [180, 384], [360, 420], [540, 392], [740, 410]];
const BROOK5: [number, number][] = [[372, 330], [410, 370], [380, 420], [420, 520]];
const RIVER12: [number, number][] = [[-20, 330], [200, 310], [400, 350], [740, 320]];
const STREAM13: [number, number][] = [[200, 60], [300, 160], [420, 260], [380, 380], [520, 520]];

const SCENES: Scene[] = [
  // 1. The ribbon: an apple tree in blossom by a river, a green ribbon in the wind, her mother under it
  {
    still(g, a) {
      meadow(g, a, 11);
      water(g, RIVER1, 46);
      const it: Item[] = [];
      frame(it, a, 12, 270);
      it.push([350, (g) => bigBlossom(g, 350, 350, 1.25, 5)]);
      it.push([366, (g) => put(g, a.folk[2][3], 318, 366, 1.3)]);
      it.push([390, (g) => { reeds(g, 250, 390, 1); reeds(g, 470, 400, 2); reeds(g, 560, 388, 3); }]);
      sorted(g, it);
    },
    live(g, _a, t) {
      glints(g, RIVER1, 46, t, 3);
      bow(g, 392, 246);
      ribbonStream(g, 392, 246, 150, 1, t * 2.2, 3.6);
      ribbonStream(g, 392, 248, 110, 1, t * 2.6 + 2.1, 2.6);
    },
  },
  // 2. The hall: a hall of trees, a great fire, people dancing round it, lanterns in the branches
  {
    still(g, a) {
      meadow(g, a, 21);
      ell(g, 360, 330, 170, 80);
      g.fillStyle = alpha("#c8b070", 0.45);
      g.fill();
      const it: Item[] = [];
      for (let i = 0; i < 12; i++) {
        const an = (i / 12) * TAU;
        const x = 360 + Math.cos(an) * 280;
        const y = 300 + Math.sin(an) * 150;
        if (y < 150 || Math.abs(x - 360) < 120) continue;
        it.push([y, (g) => put(g, i % 3 ? a.land.tree[i % 3] : a.spring[0], x, y, 1.15, x > 360)]);
      }
      it.push([320, (g) => {
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * TAU;
          stone(g, 360 + Math.cos(an) * 34, 322 + Math.sin(an) * 14, 6, 4);
        }
        line(g, [[336, 326], [384, 316]], 6, "#6a4226");
        line(g, [[338, 316], [384, 328]], 6, "#7a5236");
      }]);
      sorted(g, it);
    },
    live(g, a, t) {
      const it: Item[] = [];
      it.push([322, (g) => flame(g, 360, 322, 1.25, t)]);
      // the ring turns slowly: they dance round the fire, waving on the beat
      for (let i = 0; i < 10; i++) {
        const an = (i / 10) * TAU + 0.3 + t * 0.35;
        const x = 360 + Math.cos(an) * 130;
        const y = 330 + Math.sin(an) * 64;
        const f = 3 + (Math.floor(t * 2.6 + i) % 2);
        it.push([y, (g) => put(g, a.folk[i % 5][f], x, y - Math.abs(Math.sin(t * 5.2 + i)) * 3, 1.35, Math.sin(an) > 0)]);
      }
      sorted(g, it);
      for (const [x, y] of [[150, 200], [250, 170], [470, 170], [570, 200]]) {
        line(g, [[x, y - 30], [x, y - 14]], 0.8, "#3a2a1a", false);
        glowAt(g, x, y - 8, 26 + Math.sin(t * 4 + x) * 3, "255,200,90", 0.6);
        ell(g, x, y - 8, 5, 7);
        paint(g, "#ffb84a", 0.8);
      }
    },
  },
  // 3. Counting: a cottage with its door open, warm light on the step, three pairs of small shoes
  {
    still(g, a) {
      meadow(g, a, 31);
      const it: Item[] = [];
      frame(it, a, 32, 280);
      it.push([330, (g) => {
        put(g, a.cott[0], 360, 330, 1.6);
        glowAt(g, 376, 316, 90, "255,200,110", 0.55);
        g.beginPath();
        g.moveTo(366, 332);
        g.lineTo(388, 332);
        g.lineTo(420, 400);
        g.lineTo(340, 400);
        g.closePath();
        g.fillStyle = "rgba(255,220,130,0.35)";
        g.fill();
        for (let i = 0; i < 3; i++) {
          const x = 346 + i * 20;
          for (const d of [-2.6, 2.6]) {
            ell(g, x + d, 352 + i * 3, 2.4, 4);
            paint(g, ["#8a3a2a", "#2a4a8a", "#3f7a3a"][i], 0.7);
          }
        }
        flowers(g, 6, 280, 330, 40, 30, 14, ["#ff6a8a", "#ff9ab4", "#ffffff"]);
        flowers(g, 7, 420, 330, 40, 30, 14, ["#ff6a8a", "#ffe46a", "#ffffff"]);
      }]);
      it.push([380, (g) => put(g, a.well, 470, 380, 1)]);
      sorted(g, it);
    },
  },
  // 4. Never again: snow melting in a ring, a stone cross with a spiral, two candles, snowdrops
  {
    still(g, a) {
      meadow(g, a, 41);
      ell(g, 360, 330, 150, 64);
      paint(g, "#eef3f6", 1.2);
      ell(g, 340, 320, 100, 40);
      g.fillStyle = "#ffffff";
      g.fill();
      const it: Item[] = [];
      frame(it, a, 42, 290);
      it.push([320, (g) => {
        ell(g, 360, 330, 34, 12);
        paint(g, "#6a5a48", 1);
        g.beginPath();
        g.rect(352, 248, 16, 82);
        g.rect(334, 268, 52, 14);
        paint(g, "#9a968a", 1.2);
        ell(g, 360, 275, 12, 12);
        g.strokeStyle = OL;
        g.lineWidth = 1.2;
        g.stroke();
        g.strokeStyle = alpha("#5aa040", 0.9);
        g.lineWidth = 1;
        g.beginPath();
        for (let an = 0; an < 2.5 * TAU; an += 0.2) g.lineTo(360 + Math.cos(an) * an * 0.7, 275 + Math.sin(an) * an * 0.7);
        g.stroke();
        const r = rnd(9);
        for (let i = 0; i < 40; i++) {
          const an = r() * TAU;
          const d = 0.75 + r() * 0.3;
          const x = 360 + Math.cos(an) * 150 * d;
          const y = 330 + Math.sin(an) * 64 * d;
          line(g, [[x, y], [x, y - 7]], 0.8, "#4a8a34", false);
          g.beginPath();
          g.moveTo(x, y - 7);
          g.quadraticCurveTo(x + 3, y - 3, x, y - 2);
          g.quadraticCurveTo(x - 3, y - 3, x, y - 7);
          paint(g, "#ffffff", 0.5);
        }
      }]);
      sorted(g, it);
    },
    live(g, _a, t) {
      candle(g, 330, 340, t);
      candle(g, 390, 340, t + 1.7);
    },
  },
  // 5. The cup: the cracked black cup on a stone, and a clear spring running out of the crack
  {
    still(g, a) {
      meadow(g, a, 51);
      const it: Item[] = [];
      frame(it, a, 52, 280);
      water(g, BROOK5, 18);
      it.push([330, (g) => zoom(g, 360, 320, 1.7, () => {
        stone(g, 360, 322, 46, 22, "#8a8678");
        g.beginPath();
        g.moveTo(346, 312);
        g.lineTo(374, 312);
        g.lineTo(369, 290);
        g.lineTo(351, 290);
        g.closePath();
        paint(g, "#222026", 1.1);
        ell(g, 360, 290, 10, 3.5);
        paint(g, "#5aa8dc", 1);
        line(g, [[358, 292], [362, 300], [357, 306], [361, 312]], 0.8, "#cfe8ff", false);
        line(g, [[369, 296], [374, 312], [376, 324]], 2, "#5aa8dc");
      })]);
      it.push([340, (g) => flowers(g, 8, 360, 340, 110, 160, 70, ["#c8a0ff", "#ffe46a", "#ffffff"])]);
      it.push([340, (g) => put(g, a.folk[1][0], 270, 340, 1.4)]);
      it.push([330, (g) => put(g, a.folk[3][3], 450, 330, 1.4, true)]);
      sorted(g, it);
    },
    live(g, _a, t) {
      glowAt(g, 360, 286, 60 + Math.sin(t * 2.5) * 8, "180,230,255", 0.5);
      glints(g, BROOK5, 18, t, 5);
    },
  },
  // 6. The first blossom: a great tree just come into flower, petals falling on black earth turning green
  {
    still(g, a) {
      meadow(g, a, 61);
      ell(g, 360, 380, 180, 70);
      g.fillStyle = alpha("#3a2c1e", 0.75);
      g.fill();
      tufts(g, 62, 200, 330, 320, 100, 40);
      const it: Item[] = [];
      frame(it, a, 63, 300);
      it.push([370, (g) => {
        petals(g, 4, 190, 320, 340, 120, 160);
        bigBlossom(g, 360, 370, 1.4, 66);
      }]);
      sorted(g, it);
    },
    live(g, _a, t) {
      fallingPetals(g, 5, 200, 150, 320, 240, 60, t);
    },
  },
  // 7. The voice below: an ivied well, the faithful dog on guard; the mouth in the floor closed, flowers in a ring of stones
  {
    still(g, a) {
      meadow(g, a, 71);
      const it: Item[] = [];
      frame(it, a, 72, 280);
      it.push([360, (g) => zoom(g, 440, 372, 1.5, () => {
        for (let i = 0; i < 12; i++) {
          const an = (i / 12) * TAU;
          stone(g, 440 + Math.cos(an) * 44, 372 + Math.sin(an) * 18, 8, 5);
        }
        flowers(g, 9, 404, 360, 72, 26, 30, a.flowers);
      })]);
      it.push([330, (g) => {
        put(g, a.well, 300, 330, 2.3);
        for (let i = 0; i < 8; i++) {
          ell(g, 278 + i * 6, 320 - (i % 3) * 8, 4, 3, i);
          paint(g, "#3f8a3a", 0.7);
        }
      }]);
      it.push([350, (g) => hound(g, 372, 350, 2.2)]);
      sorted(g, it);
    },
  },
  // 8. Too many teeth: a long table under the trees, a white cloth, bread and apples; they eat bread again
  {
    still(g, a) {
      meadow(g, a, 81);
      const it: Item[] = [];
      frame(it, a, 82, 300);
      it.push([330, (g) => zoom(g, 360, 320, 1.35, () => {
        ell(g, 362, 334, 130, 14);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fill();
        g.beginPath();
        g.rect(240, 292, 240, 40);
        paint(g, "#8a5a32", 1.3);
        g.beginPath();
        g.rect(244, 290, 232, 30);
        paint(g, "#f6f1e4", 1);
        for (let i = 0; i < 6; i++) {
          const x = 264 + i * 38;
          ell(g, x, 304, 10, 6);
          paint(g, "#d09a4a", 0.9);
          line(g, [[x - 5, 302], [x + 5, 302]], 0.8, "#a06a2a", false);
          ell(g, x + 18, 300, 3.4, 3.4);
          paint(g, i % 2 ? "#d0303a" : "#8ad04a", 0.7);
        }
        for (const x of [300, 420]) {
          g.beginPath();
          g.rect(x - 4, 290, 8, 10);
          paint(g, "#c0ae94", 0.8);
        }
      })]);
      for (let i = 0; i < 6; i++) it.push([286, (g) => put(g, a.folk[i % 5][0], 220 + i * 56, 286, 1.35)]);
      sorted(g, it);
    },
    live(g, a, t) {
      for (let i = 0; i < 6; i++) {
        const f = i % 2 ? 3 + (Math.floor(t * 1.5 + i) % 2) : 0;
        put(g, a.folk[(i + 2) % 5][f], 220 + i * 56, 384, 1.35);
      }
    },
  },
  // 9. Inside out: the crooked houses stand straight again; a pond holds the golden morning sun. The way runs between them.
  {
    still(g, a) {
      meadow(g, a, 91);
      ell(g, 360, 400, 120, 40);
      paint(g, "#3a86c0", 1.4);
      ell(g, 360, 396, 94, 29);
      g.fillStyle = "#5aa8dc";
      g.fill();
      // a path of beaten earth from where she comes in, round the pond
      g.strokeStyle = alpha("#c8b070", 0.7);
      g.lineWidth = 26;
      g.beginPath();
      g.moveTo(360, 150);
      g.lineTo(360, 340);
      g.stroke();
      const it: Item[] = [];
      frame(it, a, 92, 320);
      for (const [x, y, v, fl] of [[200, 270, 0, false], [215, 370, 1, false], [520, 310, 0, true]] as const)
        it.push([y, (g) => {
          put(g, a.cott[v], x, y, 1.1, fl);
          glowAt(g, x, y - 30, 50, "255,210,120", 0.4);
        }]);
      it.push([440, (g) => { reeds(g, 250, 420, 1); reeds(g, 470, 424, 2); }]);
      sorted(g, it);
    },
    live(g, _a, t) {
      glowAt(g, 360, 396, 80 + Math.sin(t * 1.5) * 6, "255,220,120", 0.7);
      ell(g, 360, 396, 22, 9);
      paint(g, "#ffe46a", 0.8);
      g.strokeStyle = "rgba(255,250,220,0.8)";
      g.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const w = 30 + ((t * 8 + i * 14) % 42);
        ell(g, 360, 396, w, w * 0.32);
        g.globalAlpha = 1 - (w - 30) / 42;
        g.stroke();
      }
      g.globalAlpha = 1;
    },
  },
  // 10. His eyes: a dry-stone wall across the meadow, sheep grazing in peace, the shepherd with his crook
  {
    still(g, a) {
      meadow(g, a, 101);
      const it: Item[] = [];
      frame(it, a, 102, 300);
      it.push([300, (g) => {
        const r = rnd(3);
        for (let x = 150; x < 580; x += 11) stone(g, x, 300 + Math.sin(x / 60) * 10 + (r() - 0.5) * 3, 7, 5, r() < 0.5 ? "#8a8678" : "#9a968a");
        for (let x = 156; x < 580; x += 11) stone(g, x, 292 + Math.sin(x / 60) * 10, 6, 4, "#a29e90");
      }]);
      const r = rnd(7);
      for (let i = 0; i < 9; i++) {
        const x = 200 + r() * 330;
        const y = 330 + r() * 110;
        const fl = r() < 0.5;
        it.push([y, (g) => sheep(g, x, y, fl, i)]);
      }
      for (let i = 0; i < 3; i++) {
        const x = 220 + i * 120;
        const y = 250 + r() * 20;
        it.push([y, (g) => sheep(g, x, y, i === 1, 20 + i)]);
      }
      it.push([318, (g) => {
        put(g, a.folk[3][0], 470, 318, 1.15);
        line(g, [[482, 318], [486, 270], [480, 264]], 1.6, "#7a5a3a");
      }]);
      sorted(g, it);
    },
  },
  // 11. To see the sea: the wood opens on a beach; sand, dune grass, waves and a boat; children's footprints down to the water
  {
    still(g, a) {
      meadow(g, a, 111);
      g.beginPath();
      g.moveTo(0, 270);
      g.bezierCurveTo(200, 250, 500, 290, 720, 262);
      g.lineTo(720, 520);
      g.lineTo(0, 520);
      g.closePath();
      paint(g, "#e8d6a0", 1.3);
      g.beginPath();
      g.moveTo(0, 370);
      g.bezierCurveTo(200, 352, 500, 390, 720, 360);
      g.lineTo(720, 520);
      g.lineTo(0, 520);
      g.closePath();
      paint(g, "#3a86c0", 1.3);
      g.beginPath();
      g.moveTo(0, 410);
      g.bezierCurveTo(200, 400, 500, 430, 720, 404);
      g.lineTo(720, 520);
      g.lineTo(0, 520);
      g.closePath();
      g.fillStyle = "#2a6aa0";
      g.fill();
      for (let i = 0; i < 9; i++) {
        const y = 280 + i * 9;
        const x = 350 + Math.sin(i) * 6 + (i % 2) * 10;
        ell(g, x, y, 2, 3);
        g.fillStyle = alpha("#a08a5a", 0.9);
        g.fill();
      }
      tufts(g, 5, 60, 270, 200, 40, 30);
      tufts(g, 6, 480, 270, 200, 40, 30);
      // fade the sea out at the far edges like the meadow
      const it: Item[] = [];
      frame(it, a, 112, 330);
      it.push([352, (g) => put(g, a.folk[4][3], 340, 352, 0.85)]);
      it.push([356, (g) => put(g, a.folk[1][4], 370, 356, 0.8)]);
      sorted(g, it);
    },
    live(g, _a, t) {
      g.strokeStyle = "#f6f1e4";
      g.lineWidth = 2;
      const sw = Math.sin(t * 1.2) * 4;
      g.beginPath();
      g.moveTo(0, 374 + sw);
      g.bezierCurveTo(200, 356 + sw, 500, 394 + sw, 720, 364 + sw);
      g.stroke();
      for (let i = 0; i < 18; i++) {
        const x = (30 + i * 40 + t * 10) % 740;
        g.strokeStyle = "rgba(220,245,255,0.8)";
        g.lineWidth = 1.2;
        g.beginPath();
        g.arc(x, 400 + (i % 3) * 22, 7, Math.PI * 1.15, Math.PI * 1.85);
        g.stroke();
      }
      const by = Math.sin(t * 1.6) * 2;
      g.beginPath();
      g.moveTo(470, 420 + by);
      g.quadraticCurveTo(500, 436 + by, 530, 420 + by);
      g.lineTo(520, 430 + by);
      g.lineTo(480, 430 + by);
      g.closePath();
      paint(g, "#8a5a32", 1.1);
      line(g, [[500, 420 + by], [500, 380 + by]], 1.5, "#6a4226");
      g.beginPath();
      g.moveTo(502, 382 + by);
      g.lineTo(524, 412 + by);
      g.lineTo(502, 414 + by);
      g.closePath();
      paint(g, "#f6f1e4", 1);
    },
  },
  // 12. The bridge: the stone bridge over the stream whole again; on it two small figures hand in hand
  {
    still(g, a) {
      meadow(g, a, 121);
      water(g, RIVER12, 70);
      const it: Item[] = [];
      frame(it, a, 122, 290);
      it.push([360, (g) => {
        ell(g, 360, 336, 70, 30);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fill();
        g.beginPath();
        g.rect(320, 260, 80, 120);
        paint(g, "#a29e90", 1.3);
        const r = rnd(4);
        for (let y = 262; y < 378; y += 9) for (let x = 322 + (y % 18 ? 0 : 6); x < 396; x += 12) {
          g.fillStyle = shade("#a29e90", (r() - 0.5) * 0.2);
          g.fillRect(x, y, 10, 7);
        }
        for (const x of [316, 404]) {
          g.beginPath();
          g.rect(x - 5, 256, 10, 128);
          paint(g, "#8a8678", 1.1);
        }
        flowers(g, 3, 300, 250, 120, 10, 8, a.flowers);
        line(g, [[352, 318], [368, 318]], 1.4, "#e6b48c");
        put(g, a.folk[4][0], 348, 330, 0.9);
        put(g, a.folk[1][0], 372, 330, 0.85, true);
      }]);
      it.push([300, (g) => { reeds(g, 220, 300, 1); reeds(g, 520, 316, 2); }]);
      sorted(g, it);
    },
    live(g, _a, t) {
      g.save();
      g.beginPath();
      g.rect(0, 0, 316, 520);
      g.rect(404, 0, 400, 520);
      g.clip();
      glints(g, RIVER12, 70, t, 9);
      g.restore();
    },
  },
  // 13. Her name: a stream with stepping stones; the green ribbon caught on a reed among the irises
  {
    still(g, a) {
      meadow(g, a, 131);
      water(g, STREAM13, 54);
      const it: Item[] = [];
      frame(it, a, 132, 300);
      it.push([300, (g) => {
        for (const [x, y] of [[330, 190], [372, 230], [410, 270], [400, 316], [396, 360]]) stone(g, x - 30, y, 10, 6, "#9a968a");
        reeds(g, 438, 300, 4);
        reeds(g, 350, 300, 5);
        const r = rnd(5);
        for (let i = 0; i < 9; i++) {
          const x = 300 + r() * 220;
          const y = 340 + r() * 80;
          line(g, [[x, y], [x, y - 10]], 1, "#4a8a34");
          ell(g, x - 2, y - 12, 2.4, 3.2, -0.5);
          paint(g, i % 2 ? "#8a6ad0" : "#ffd84a", 0.5);
          ell(g, x + 2, y - 12, 2.4, 3.2, 0.5);
          paint(g, i % 2 ? "#a88ae8" : "#ffe46a", 0.5);
        }
      }]);
      it.push([330, (g) => put(g, a.beasts.deer[0], 520, 330, 1.1, true)]);
      sorted(g, it);
    },
    live(g, _a, t) {
      glints(g, STREAM13, 54, t, 13);
      ribbonStream(g, 436, 286, 70, -1, t * 2 + 1.2, 3);
      bow(g, 436, 286);
    },
  },
  // 14. Where she went: one great apple tree in full flower, ribbons in its branches; people and animals gathered round
  {
    still(g, a) {
      meadow(g, a, 141);
      glowAt(g, 360, 280, 260, "255,240,200", 0.35);
      const it: Item[] = [];
      frame(it, a, 142, 310);
      it.push([375, (g) => {
        petals(g, 3, 200, 350, 320, 70, 90);
        bigBlossom(g, 360, 375, 1.7, 14);
      }]);
      for (let i = 0; i < 9; i++) {
        if (i % 3 !== 1) continue;
        const an = Math.PI * 0.08 + (i / 8) * Math.PI * 0.84;
        const x = 360 - Math.cos(an) * 190;
        const y = 372 + Math.sin(an) * 46;
        it.push([y, (g) => put(g, a.beasts[(["hare", "fox", "deer"] as const)[(i / 3) | 0]][1], x, y, 1, x > 360)]);
      }
      sorted(g, it);
    },
    live(g, a, t) {
      const k = 1.7;
      for (let i = 0; i < 5; i++) {
        const bx = 360 + (i - 2) * 30 * k;
        const by = 375 - 92 * k + (i % 2) * 8;
        bow(g, bx, by);
        ribbonStream(g, bx, by, 26 + i * 4, i % 2 ? 1 : -1, t * 2.4 + i, 2);
      }
      for (let i = 0; i < 9; i++) {
        if (i % 3 === 1) continue;
        const an = Math.PI * 0.08 + (i / 8) * Math.PI * 0.84;
        const x = 360 - Math.cos(an) * 190;
        const y = 372 + Math.sin(an) * 46;
        put(g, a.folk[i % 5][3 + (Math.floor(t * 1.8 + i) % 2)], x, y, 1.3, x > 360);
      }
      fallingPetals(g, 7, 160, 120, 400, 260, 40, t);
    },
  },
];

/** the still part of chapter i's scene, baked at the screen's resolution × scale k */
export function bakeScene(S: number, i: number, art: SceneArt, k: number): Spr {
  const sc = SCENES[Math.max(0, Math.min(SCENES.length - 1, i))];
  const w = BOX.x1 - BOX.x0;
  const h = BOX.y1 - BOX.y0;
  const s = bake(S * k, w, h, SCENE_AT.x - BOX.x0, SCENE_AT.y - BOX.y0, (g) => {
    g.translate(-SCENE_AT.x, -SCENE_AT.y);
    sc.still(g, art);
  });
  return s;
}

/** the moving part, drawn in scene units: the caller has put (SCENE_AT) where she stops */
export function liveScene(g: G, i: number, art: SceneArt, t: number) {
  const sc = SCENES[Math.max(0, Math.min(SCENES.length - 1, i))];
  if (!sc.live) return;
  g.save();
  g.lineJoin = "round";
  g.lineCap = "round";
  g.translate(-SCENE_AT.x, -SCENE_AT.y);
  sc.live(g, art, t);
  g.restore();
}

export const SCENE_COUNT = SCENES.length;
