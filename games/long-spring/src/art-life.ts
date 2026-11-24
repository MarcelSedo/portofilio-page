/**
 * The living things of the last stretches, and the gates of spring:
 * stone cottages and a well, the people of the villages, hares, foxes and deer, the living arches.
 * Same style as sprites.ts: canvas paths with a dark outline, drawn once at the screen's resolution.
 */
import { OL, TAU, alpha, bake, blobs, ell, line, paint, rnd, shade, type Spr } from "./sprites";

type G = CanvasRenderingContext2D;

/* ======================================================================
 * Cotswold cottages: honey-coloured stone, steep roofs, roses by the door
 * ==================================================================== */

export const COTTAGE = { w: 136, h: 120, ax: 68, ay: 112 };
/** where each cottage's door is, from its middle (villagers run there) */
export const COTTAGE_DOOR = [10, -18];

function stoneWall(g: G, x0: number, y0: number, x1: number, y1: number, base: string, seed: number) {
  const r = rnd(seed);
  g.beginPath();
  g.rect(x0, y0, x1 - x0, y1 - y0);
  paint(g, base, 1.3);
  g.save();
  g.clip();
  // courses of stone, each block a little different
  for (let y = y1 - 5; y > y0 - 5; y -= 5.2) {
    let x = x0 - r() * 8;
    while (x < x1) {
      const w = 7 + r() * 9;
      g.fillStyle = shade(base, (r() - 0.5) * 0.18);
      g.fillRect(x + 0.4, y + 0.4, w - 0.8, 4.4);
      x += w;
    }
  }
  g.strokeStyle = alpha(shade(base, -0.4), 0.45);
  g.lineWidth = 0.5;
  for (let y = y1 - 5; y > y0; y -= 5.2) {
    g.beginPath();
    g.moveTo(x0, y);
    g.lineTo(x1, y);
    g.stroke();
  }
  // light from the left
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, "rgba(255,248,220,0.18)");
  gr.addColorStop(1, "rgba(60,30,10,0.18)");
  g.fillStyle = gr;
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.restore();
}

function window2(g: G, x: number, y: number, w: number, h: number, stone: string) {
  // the stone hood above, the frame, leaded panes and a glint
  g.beginPath();
  g.moveTo(x - w / 2 - 2.5, y - h / 2 - 2);
  g.lineTo(x + w / 2 + 2.5, y - h / 2 - 2);
  g.lineTo(x + w / 2 + 1.5, y - h / 2 - 4.5);
  g.lineTo(x - w / 2 - 1.5, y - h / 2 - 4.5);
  g.closePath();
  paint(g, shade(stone, -0.12), 0.8);
  g.beginPath();
  g.rect(x - w / 2, y - h / 2, w, h);
  paint(g, "#2e3a44", 1);
  g.strokeStyle = "#5a6670";
  g.lineWidth = 0.5;
  for (let i = 1; i < 4; i++) {
    g.beginPath();
    g.moveTo(x - w / 2 + (w * i) / 4, y - h / 2);
    g.lineTo(x - w / 2 + (w * i) / 4, y + h / 2);
    g.stroke();
  }
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.lineTo(x + w / 2, y);
  g.stroke();
  g.fillStyle = "rgba(200,230,255,0.35)";
  g.beginPath();
  g.moveTo(x - w / 2 + 1, y - h / 2 + 1);
  g.lineTo(x - w / 2 + w * 0.4, y - h / 2 + 1);
  g.lineTo(x - w / 2 + 1, y + h * 0.1);
  g.closePath();
  g.fill();
  // mullion
  g.fillStyle = shade(stone, 0.1);
  g.fillRect(x - 0.9, y - h / 2, 1.8, h);
  // sill
  g.beginPath();
  g.rect(x - w / 2 - 2, y + h / 2, w + 4, 2.2);
  paint(g, shade(stone, 0.08), 0.7);
}

function roses(g: G, pts: [number, number][], seed: number) {
  const r = rnd(seed);
  blobs(g, pts.map(([x, y]) => [x, y, 4 + r() * 3, 3.4 + r() * 2.4, r() * 3] as [number, number, number, number, number]), "#4a8a3a", 0.8);
  for (const [x, y] of pts)
    for (let k = 0; k < 3; k++) {
      ell(g, x + (r() - 0.5) * 8, y + (r() - 0.5) * 6, 1.3, 1.3);
      paint(g, k % 2 ? "#ff8ab0" : "#fff0f4", 0.4);
    }
}

function cottageArt(g: G, v: number) {
  const stone = v === 1 ? "#d2ac6c" : "#dcbc80";
  const r = rnd(40 + v);
  // ground shadow and a strip of garden
  ell(g, 0, 1, 62, 8);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  // chimneys behind the ridge
  for (const cx of v === 1 ? [-40] : [-44, 44]) {
    g.beginPath();
    g.rect(cx - 5, -104, 10, 22);
    paint(g, shade(stone, -0.05), 1.1);
    g.beginPath();
    g.rect(cx - 6.5, -106, 13, 3.5);
    paint(g, shade(stone, -0.2), 0.9);
    for (const px of [-2.5, 2.5]) {
      g.beginPath();
      g.rect(cx + px - 1.4, -110, 2.8, 4.5);
      paint(g, "#a8583a", 0.7);
    }
  }
  // the roof, sloping away from you
  if (v === 1) {
    // thatch: soft and thick, curving over the eaves
    g.beginPath();
    g.moveTo(-60, -44);
    g.quadraticCurveTo(-62, -52, -54, -58);
    g.lineTo(-46, -92);
    g.quadraticCurveTo(0, -98, 46, -92);
    g.lineTo(54, -58);
    g.quadraticCurveTo(62, -52, 60, -44);
    g.quadraticCurveTo(0, -38, -60, -44);
    paint(g, "#c8a058", 1.3);
    g.save();
    g.clip();
    g.strokeStyle = "rgba(110,76,30,0.45)";
    g.lineWidth = 0.6;
    for (let i = 0; i < 90; i++) {
      const x = -60 + r() * 120;
      const y = -94 + r() * 50;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + (r() - 0.5) * 2, y + 5 + r() * 4);
      g.stroke();
    }
    g.fillStyle = "rgba(255,240,190,0.18)";
    g.fillRect(-60, -96, 120, 12);
    g.restore();
    // the ridge
    g.beginPath();
    g.moveTo(-46, -92);
    g.quadraticCurveTo(0, -100, 46, -92);
    g.lineWidth = 3;
    g.strokeStyle = shade("#c8a058", -0.25);
    g.stroke();
  } else {
    // stone slates in rows, smaller towards the ridge
    g.beginPath();
    g.moveTo(-60, -46);
    g.lineTo(-48, -94);
    g.lineTo(48, -94);
    g.lineTo(60, -46);
    g.closePath();
    paint(g, "#8a8070", 1.3);
    g.save();
    g.clip();
    let row = 0;
    for (let y = -48; y > -96; y -= 4.2 - row * 0.12) {
      g.strokeStyle = "rgba(40,34,28,0.45)";
      g.lineWidth = 0.6;
      g.beginPath();
      g.moveTo(-62, y);
      g.lineTo(62, y);
      g.stroke();
      const off = (row % 2) * 3;
      for (let x = -62 + off; x < 62; x += 6) {
        g.fillStyle = shade("#8a8070", (r() - 0.5) * 0.22);
        g.fillRect(x + 0.4, y - 3.8, 5.2, 3.4);
      }
      row++;
    }
    ell(g, -30, -80, 12, 4);
    g.fillStyle = "rgba(120,150,70,0.4)";
    g.fill();
    g.restore();
    line(g, [[-48, -94], [48, -94]], 2.4, shade("#8a8070", -0.2));
  }
  // a dormer window in the roof
  const dx = v === 1 ? 14 : -4;
  g.beginPath();
  g.moveTo(dx - 11, -50);
  g.lineTo(dx - 11, -66);
  g.lineTo(dx, -76);
  g.lineTo(dx + 11, -66);
  g.lineTo(dx + 11, -50);
  g.closePath();
  paint(g, stone, 1.1);
  g.beginPath();
  g.moveTo(dx - 13, -65);
  g.lineTo(dx, -78);
  g.lineTo(dx + 13, -65);
  g.lineWidth = 2.6;
  g.strokeStyle = OL;
  g.stroke();
  g.lineWidth = 1.6;
  g.strokeStyle = v === 1 ? "#c8a058" : "#8a8070";
  g.stroke();
  window2(g, dx, -58, 10, 9, stone);
  // the front wall
  stoneWall(g, -52, -46, 52, 0, stone, 7 + v);
  // corner quoins
  for (const sx of [-1, 1])
    for (let y = -46; y < 0; y += 8) {
      g.beginPath();
      g.rect(sx > 0 ? 52 - (y / 8) % 2 * 0 - 6 : -52, y, 6, 4);
      paint(g, shade(stone, 0.12), 0.5);
    }
  // windows and the door
  const door = COTTAGE_DOOR[v];
  window2(g, door < 0 ? 20 : -26, -26, 16, 13, stone);
  window2(g, door < 0 ? 42 : 36, -26, 12, 13, stone);
  if (v === 0) window2(g, -42, -26, 10, 13, stone);
  // a porch over the door
  g.beginPath();
  g.moveTo(door - 10, -32);
  g.lineTo(door, -40);
  g.lineTo(door + 10, -32);
  g.closePath();
  paint(g, v === 1 ? "#c8a058" : "#8a8070", 1);
  g.beginPath();
  g.moveTo(door - 6, 0);
  g.lineTo(door - 6, -22);
  g.quadraticCurveTo(door, -28, door + 6, -22);
  g.lineTo(door + 6, 0);
  g.closePath();
  paint(g, v === 1 ? "#3a5a7a" : "#5a3a22", 1.1);
  g.strokeStyle = "rgba(0,0,0,0.3)";
  g.lineWidth = 0.6;
  for (const lx of [-3, 0, 3]) {
    g.beginPath();
    g.moveTo(door + lx, -1);
    g.lineTo(door + lx, -22);
    g.stroke();
  }
  ell(g, door + 3.6, -11, 0.8, 0.8);
  paint(g, "#f0c85a", 0);
  // roses round the door and along the wall
  roses(g, [[door - 9, -16], [door - 10, -26], [door - 6, -34], [door + 8, -30], [door + 9, -8]], 50 + v);
  // flowers at the foot of the wall
  for (let i = 0; i < 14; i++) {
    const x = -50 + r() * 100;
    if (Math.abs(x - door) < 8) continue;
    ell(g, x, -1.5, 2.6, 2);
    paint(g, "#5a9a40", 0.5);
    ell(g, x + (r() - 0.5) * 2, -3, 1.1, 1.1);
    paint(g, ["#ffe46a", "#c8a0ff", "#ffffff", "#ff9ab4"][i % 4], 0.3);
  }
}

export function cottageSprites(S: number): Spr[] {
  return [0, 1].map((v) => bake(S, COTTAGE.w, COTTAGE.h, COTTAGE.ax, COTTAGE.ay, (g) => cottageArt(g, v)));
}

/* ---------------- the village well ---------------- */

export function wellSprite(S: number): Spr {
  return bake(S, 48, 70, 24, 64, (g) => {
    ell(g, 0, 1, 20, 5);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fill();
    // posts and the little roof
    for (const x of [-12, 12]) {
      g.beginPath();
      g.rect(x - 1.6, -50, 3.2, 40);
      paint(g, "#6a4a2e", 0.9);
    }
    line(g, [[-12, -38], [12, -38]], 1.6, "#7a5a3a");
    line(g, [[1, -38], [1, -26]], 0.6, "#c8b890", false);
    g.beginPath();
    g.rect(-3, -27, 7, 6);
    paint(g, "#8a6440", 0.8);
    g.beginPath();
    g.moveTo(-19, -46);
    g.lineTo(0, -60);
    g.lineTo(19, -46);
    g.lineTo(15, -44);
    g.lineTo(0, -55);
    g.lineTo(-15, -44);
    g.closePath();
    paint(g, "#7a5034", 1);
    // the round stone shaft
    g.beginPath();
    g.moveTo(-15, -16);
    g.lineTo(-15, -2);
    g.quadraticCurveTo(0, 4, 15, -2);
    g.lineTo(15, -16);
    g.closePath();
    paint(g, "#c8b088", 1.1);
    g.strokeStyle = "rgba(90,70,40,0.45)";
    g.lineWidth = 0.5;
    for (let y = -12; y < 0; y += 4.5) {
      g.beginPath();
      g.moveTo(-15, y);
      g.quadraticCurveTo(0, y + 4, 15, y);
      g.stroke();
    }
    ell(g, 0, -16, 15, 5);
    paint(g, "#d8c098", 1.1);
    ell(g, 0, -16, 11, 3.4);
    paint(g, "#1e3a40", 0.6);
    ell(g, -3, -16.8, 4, 0.9);
    g.fillStyle = "rgba(160,255,230,0.5)";
    g.fill();
    // moss and a few flowers
    ell(g, 10, -4, 5, 2.4);
    g.fillStyle = "rgba(90,150,60,0.7)";
    g.fill();
  });
}

/* ======================================================================
 * The villagers: small, plainly dressed, running for their doors
 * ==================================================================== */

export const VILLAGER = { w: 26, h: 44, ax: 13, ay: 41 };
export const VILLAGER_KINDS = 5;

type Folk = { skin: string; hair: string; top: string; low: string; dress: boolean; hat: "cap" | "straw" | "bonnet" | "shawl" | "none"; small: number };
const FOLK: Folk[] = [
  { skin: "#f0c8a8", hair: "#6a3a20", top: "#3a6a9a", low: "#3a6a9a", dress: true, hat: "bonnet", small: 1 },
  { skin: "#e0b088", hair: "#3a2418", top: "#e8e0c8", low: "#6a5038", dress: false, hat: "cap", small: 1 },
  { skin: "#f4d0b0", hair: "#c8902a", top: "#b8323a", low: "#b8323a", dress: true, hat: "none", small: 0.75 },
  { skin: "#e8c0a0", hair: "#d8d8d0", top: "#7a6a8a", low: "#4a4058", dress: true, hat: "shawl", small: 0.95 },
  { skin: "#8a5a3a", hair: "#1a1410", top: "#5a8a4a", low: "#5a4a38", dress: false, hat: "straw", small: 1.02 },
];

function villagerArt(g: G, k: number, f: number) {
  const p = FOLK[k];
  g.save();
  g.scale(p.small, p.small);
  ell(g, 0, 0.5, 7, 2.2);
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.fill();
  const wave = f >= 3;
  const run = f > 0 && !wave;
  const a = f === 1 ? 1 : f === 2 ? -1 : 0;
  // legs
  for (const s of [-1, 1]) {
    const lift = run && s === a ? 3 : 0;
    line(g, [[s * 2, -11], [s * 2.6 + (run ? s * a * 1.2 : 0), -lift - 1]], 2.2, p.dress ? p.skin : p.low);
    ell(g, s * 2.8, -lift - 0.6, 1.8, 1.2);
    paint(g, "#3a2418", 0.6);
  }
  // body
  if (p.dress) {
    g.beginPath();
    g.moveTo(-3.6, -21);
    g.lineTo(3.6, -21);
    g.lineTo(6.5, -8);
    g.quadraticCurveTo(0, -6.5, -6.5, -8);
    g.closePath();
    paint(g, p.top, 1);
    if (p.hat === "bonnet") {
      // a white apron
      g.beginPath();
      g.moveTo(-2.4, -17);
      g.lineTo(2.4, -17);
      g.lineTo(3.6, -8.4);
      g.lineTo(-3.6, -8.4);
      g.closePath();
      paint(g, "#f4f0e4", 0.6);
    }
  } else {
    g.beginPath();
    g.rect(-3.4, -12.5, 6.8, 2.5);
    paint(g, p.low, 0.8);
    g.beginPath();
    g.moveTo(-3.8, -21);
    g.lineTo(3.8, -21);
    g.lineTo(4.4, -11);
    g.lineTo(-4.4, -11);
    g.closePath();
    paint(g, p.top, 1);
    if (p.hat === "cap") {
      g.beginPath();
      g.moveTo(-3.6, -20.5);
      g.lineTo(-1, -12);
      g.moveTo(3.6, -20.5);
      g.lineTo(1, -12);
      g.lineWidth = 1.4;
      g.strokeStyle = "#5a4430";
      g.stroke();
    }
  }
  if (p.hat === "shawl") {
    g.beginPath();
    g.moveTo(-5, -21);
    g.quadraticCurveTo(0, -14, 5, -21);
    g.lineTo(3, -24);
    g.lineTo(-3, -24);
    g.closePath();
    paint(g, "#9a8a6a", 0.8);
  }
  // arms: by the sides, up in fright when running, or waving with both hands
  for (const s of [-1, 1]) {
    const sleeve = p.hat === "shawl" ? "#9a8a6a" : p.top;
    if (wave) {
      const hx = s * 6.5 + (f === 3 ? 1.6 : -1.6);
      line(g, [[s * 3.6, -20], [s * 6.2, -26], [hx, -33]], 1.8, sleeve);
      ell(g, hx, -33.5, 1.3, 1.3);
      paint(g, p.skin, 0.6);
      continue;
    }
    const up = run ? (s === a ? -9 : -4) : 0;
    line(g, [[s * 3.6, -20], [s * 5.6, -15 + up * 0.5], [s * 5.2 + (run ? s * 1.5 : 0), -10 + up]], 1.8, sleeve);
    ell(g, s * 5.2 + (run ? s * 1.5 : 0), -10 + up, 1.2, 1.2);
    paint(g, p.skin, 0.6);
  }
  // head
  ell(g, 0, -25.5, 3.8, 4.1);
  paint(g, p.skin, 0.9);
  // eyes: wide when running
  for (const s of [-1, 1]) {
    ell(g, s * 1.4, -25.5, run ? 0.75 : 0.55, run ? 0.85 : 0.6);
    paint(g, "#1e1612", 0);
  }
  if (run) {
    ell(g, 0, -23.4, 0.9, 0.7);
    paint(g, "#5a2028", 0);
  } else if (wave) {
    g.beginPath();
    g.moveTo(-1.3, -23.6);
    g.quadraticCurveTo(0, -22.4, 1.3, -23.6);
    g.lineWidth = 0.6;
    g.strokeStyle = "#5a2028";
    g.stroke();
  }
  // hair and hats
  g.beginPath();
  g.moveTo(-3.9, -25);
  g.bezierCurveTo(-4.4, -31, 4.4, -31, 3.9, -25);
  g.bezierCurveTo(2, -27.5, -2, -27.5, -3.9, -25);
  paint(g, p.hair, 0.8);
  if (p.hat === "bonnet") {
    g.beginPath();
    g.moveTo(-4.8, -24);
    g.bezierCurveTo(-5.6, -33, 5.6, -33, 4.8, -24);
    g.bezierCurveTo(3, -28.5, -3, -28.5, -4.8, -24);
    paint(g, "#f4f0e4", 0.8);
  } else if (p.hat === "cap") {
    g.beginPath();
    g.moveTo(-4.4, -27.5);
    g.quadraticCurveTo(0, -32, 4.4, -27.5);
    g.lineTo(5.6, -27);
    g.lineTo(-4.4, -27);
    g.closePath();
    paint(g, "#5a4430", 0.8);
  } else if (p.hat === "straw") {
    ell(g, 0, -28.2, 7.4, 1.8);
    paint(g, "#e8c870", 0.8);
    g.beginPath();
    g.moveTo(-3.6, -28.4);
    g.quadraticCurveTo(0, -33.5, 3.6, -28.4);
    paint(g, "#e8c870", 0.8);
    line(g, [[-3.4, -29], [3.4, -29]], 0.9, "#b8323a", false);
  } else if (p.hat === "shawl") {
    g.beginPath();
    g.moveTo(-4.8, -23);
    g.bezierCurveTo(-5.6, -33, 5.6, -33, 4.8, -23);
    g.bezierCurveTo(3, -28, -3, -28, -4.8, -23);
    paint(g, "#9a8a6a", 0.8);
  } else {
    // two plaits
    for (const s of [-1, 1]) line(g, [[s * 3.6, -26], [s * 4.6, -21]], 1.6, p.hair);
  }
  g.restore();
}

/** [kind][0 standing, 1 and 2 running, 3 and 4 waving] */
export function villagerSprites(S: number): Spr[][] {
  return Array.from({ length: VILLAGER_KINDS }, (_, k) => [0, 1, 2, 3, 4].map((f) => bake(S, VILLAGER.w, VILLAGER.h, VILLAGER.ax, VILLAGER.ay, (g) => villagerArt(g, k, f))));
}

/* ======================================================================
 * Animals running across: drawn facing right, flipped by the game
 * ==================================================================== */

export type AnimalId = "hare" | "fox" | "deer";
export const ANIMAL_BOX: Record<AnimalId, { w: number; h: number; ax: number; ay: number }> = {
  hare: { w: 34, h: 26, ax: 17, ay: 23 },
  fox: { w: 50, h: 28, ax: 25, ay: 25 },
  deer: { w: 50, h: 50, ax: 25, ay: 47 },
};

function animalArt(g: G, id: AnimalId, f: number) {
  const stretch = f === 0;
  ell(g, 0, 0.5, id === "hare" ? 9 : 14, 2.4);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  if (id === "hare") {
    const c = "#a88660";
    // hind legs, long
    line(g, stretch ? [[-5, -6], [-11, -2], [-14, -1]] : [[-4, -6], [-2, -2], [1, -1]], 2.2, shade(c, -0.15));
    line(g, stretch ? [[5, -6], [10, -2], [12, -1]] : [[4, -6], [2, -2], [0, -1]], 1.6, shade(c, -0.15));
    ell(g, 0, stretch ? -8 : -9, stretch ? 9 : 7, stretch ? 4.4 : 5.4, stretch ? -0.1 : -0.2);
    paint(g, c, 1);
    ell(g, -2, stretch ? -6.2 : -6.6, 5, 2);
    g.fillStyle = "#e8dcc8";
    g.fill();
    // white scut
    ell(g, stretch ? -9 : -7.5, stretch ? -9.5 : -10.5, 2.2, 2);
    paint(g, "#ffffff", 0.7);
    // head and the long ears laid back
    ell(g, stretch ? 9 : 7, stretch ? -11 : -13, 3.6, 3);
    paint(g, c, 0.9);
    for (const k of [0, 1]) {
      ell(g, (stretch ? 5 : 3.5) - k * 1.6, (stretch ? -15 : -17.5) - k * 0.6, 1.3, 4.6, stretch ? -1.2 : -0.7);
      paint(g, k ? shade(c, -0.2) : c, 0.8);
    }
    ell(g, stretch ? 10.2 : 8.2, stretch ? -11.8 : -13.8, 0.7, 0.8);
    paint(g, "#1a1410", 0);
  } else if (id === "fox") {
    const c = "#d8722a";
    const dark = "#2a1c14";
    const legs = stretch ? [[-9, -5, -15, -1], [-6, -5, -2, -1], [7, -5, 3, -1], [10, -5, 15, -1]] : [[-8, -5, -6, -1], [-5, -5, -8, -1], [7, -5, 9, -1], [10, -5, 6, -1]];
    for (const [x0, y0, x1, y1] of legs) line(g, [[x0, y0], [x1, y1]], 1.8, dark);
    // the brush, with its white tip
    g.beginPath();
    g.moveTo(-11, -9);
    g.bezierCurveTo(-18, -12, -24, -10, -25, stretch ? -11 : -7);
    g.bezierCurveTo(-23, -5, -17, -5, -11, -6);
    g.closePath();
    paint(g, c, 1);
    ell(g, -23.5, stretch ? -10.4 : -7.4, 2.6, 2);
    paint(g, "#fff8ee", 0.6);
    ell(g, 0, -8, 12, 4.4);
    paint(g, c, 1.1);
    ell(g, 4, -5.6, 7, 1.8);
    g.fillStyle = "#fff4e4";
    g.fill();
    // head, pointed snout and ears
    g.beginPath();
    g.moveTo(9, -12);
    g.lineTo(19, -8.6);
    g.lineTo(11, -5.4);
    g.closePath();
    paint(g, c, 1);
    g.beginPath();
    g.moveTo(14, -7.6);
    g.lineTo(19, -8.6);
    g.lineTo(12, -5.6);
    g.closePath();
    paint(g, "#fff4e4", 0);
    for (const x of [9.5, 12]) {
      g.beginPath();
      g.moveTo(x, -11.5);
      g.lineTo(x + 1, -16);
      g.lineTo(x + 2.6, -11);
      g.closePath();
      paint(g, x > 10 ? c : shade(c, -0.25), 0.8);
    }
    ell(g, 19, -8.6, 0.9, 0.8);
    paint(g, "#1a1410", 0);
    ell(g, 14, -9.6, 0.7, 0.6);
    paint(g, "#1a1410", 0);
  } else {
    const c = "#b8864e";
    const leg = shade(c, -0.15);
    const legs = stretch
      ? [[-10, -18, -17, -6, -19, -1], [-7, -18, -6, -8, -2, -1], [9, -18, 12, -8, 18, -2], [11, -18, 8, -8, 5, -1]]
      : [[-9, -18, -8, -8, -10, -1], [-7, -18, -5, -8, -6, -1], [9, -18, 9, -8, 8, -1], [11, -18, 12, -8, 12, -1]];
    for (const [x0, y0, x1, y1, x2, y2] of legs) line(g, [[x0, y0], [x1, y1], [x2, y2]], 1.8, leg);
    ell(g, 0, -21, 14, 6.6, -0.05);
    paint(g, c, 1.1);
    // the white rump
    ell(g, -12.5, -21, 3.6, 4.4);
    paint(g, "#fff8ee", 0.8);
    ell(g, 0, -17, 10, 2.2);
    g.fillStyle = alpha("#f0dcc0", 0.7);
    g.fill();
    // neck and head held high
    g.beginPath();
    g.moveTo(9, -25);
    g.lineTo(15, -35);
    g.lineTo(19, -33);
    g.lineTo(14, -21);
    g.closePath();
    paint(g, c, 1);
    ell(g, 18.5, -35.5, 4.6, 3, 0.25);
    paint(g, c, 1);
    ell(g, 22.6, -34.4, 1.1, 1.1);
    paint(g, "#1a1410", 0);
    ell(g, 18, -36.5, 0.8, 0.9);
    paint(g, "#1a1410", 0);
    ell(g, 15.4, -39.6, 1.4, 3, -0.6);
    paint(g, c, 0.8);
    // small antlers
    line(g, [[17, -38], [17.5, -44], [16, -47]], 1, "#e8dcc0");
    line(g, [[17.5, -43], [19.5, -45]], 0.9, "#e8dcc0");
  }
}

/** [frame 0 stretched, frame 1 gathered] */
export function animalSprites(S: number): Record<AnimalId, Spr[]> {
  const out = {} as Record<AnimalId, Spr[]>;
  for (const id of ["hare", "fox", "deer"] as AnimalId[]) {
    const b = ANIMAL_BOX[id];
    out[id] = [0, 1].map((f) => bake(S, b.w, b.h, b.ax, b.ay, (g) => animalArt(g, id, f)));
  }
  return out;
}

/* ======================================================================
 * The gates of spring: two carved stones and an arch of living branches
 * ==================================================================== */

export const GATE = { w: 104, h: 128, ax: 52, ay: 118, open: 21 };

function gateArt(g: G, rock: string, leaves: string[], bloom: string[], gold: boolean) {
  const r = rnd(gold ? 77 : 66);
  ell(g, 0, 1, 44, 7);
  g.fillStyle = "rgba(0,0,0,0.28)";
  g.fill();
  // the stones, carved with spirals that glow
  for (const s of [-1, 1]) {
    const x = s * 30;
    g.beginPath();
    g.moveTo(x - 8, 0);
    g.quadraticCurveTo(x - 10, -40, x - 6, -74);
    g.quadraticCurveTo(x, -82, x + 6, -74);
    g.quadraticCurveTo(x + 10, -40, x + 8, 0);
    g.closePath();
    paint(g, gold ? "#e8d8a8" : rock, 1.3);
    g.save();
    g.clip();
    const gr = g.createLinearGradient(x - 10, 0, x + 10, 0);
    gr.addColorStop(0, "rgba(255,255,240,0.3)");
    gr.addColorStop(1, "rgba(0,0,0,0.28)");
    g.fillStyle = gr;
    g.fillRect(x - 12, -90, 24, 92);
    g.restore();
    // a triple spiral, the old sign of the spring
    g.strokeStyle = gold ? "#fff4c0" : "#c8ffd8";
    g.lineWidth = 1.1;
    for (const [cx, cy] of [[x, -50], [x - 2.6, -45.5], [x + 2.6, -45.5]] as [number, number][]) {
      g.beginPath();
      for (let t = 0; t < 2.2 * TAU; t += 0.25) {
        const rr = 0.4 + t * 0.32;
        const px = cx + Math.cos(t) * rr * 0.9;
        const py = cy + Math.sin(t) * rr;
        if (t === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
    for (let y = -30; y > -70; y -= 14) {
      g.beginPath();
      g.moveTo(x - 4, y);
      g.lineTo(x + 4, y - 3);
      g.stroke();
    }
    // moss and ivy climbing
    blobs(g, [[x - s * 5, -12, 4, 6, 0.2], [x - s * 6, -22, 3, 5, -0.3], [x + s * 4, -6, 4, 3, 0]], leaves[0], 0.7);
  }
  // the arch of branches, twisting together
  for (const [w, c, off] of [[5, shade(leaves[1] ?? leaves[0], -0.35), 0], [3.4, "#6a4a2e", 1.5], [2.2, "#8a6440", -1.2]] as [number, string, number][]) {
    g.beginPath();
    g.moveTo(-31, -72);
    g.bezierCurveTo(-30 + off, -104, 30 - off, -104, 31, -72);
    g.lineWidth = w + 2;
    g.strokeStyle = OL;
    g.stroke();
    g.lineWidth = w;
    g.strokeStyle = c;
    g.stroke();
  }
  // leaves and blossom along the arch
  const shapes: [number, number, number, number, number][] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const bx = (1 - t) ** 3 * -31 + 3 * (1 - t) ** 2 * t * -30 + 3 * (1 - t) * t * t * 30 + t ** 3 * 31;
    const by = (1 - t) ** 3 * -72 + 3 * (1 - t) ** 2 * t * -104 + 3 * (1 - t) * t * t * -104 + t ** 3 * -72;
    shapes.push([bx + (r() - 0.5) * 6, by + (r() - 0.5) * 5 - 2, 4 + r() * 3.4, 2.6 + r() * 1.6, r() * 3]);
  }
  blobs(g, shapes, leaves[0], 0.8);
  for (const [x, y] of shapes) {
    if (r() < 0.6) {
      ell(g, x + (r() - 0.5) * 4, y + (r() - 0.5) * 3, 1.6, 1.6);
      paint(g, bloom[Math.floor(r() * bloom.length)], 0.4);
    }
  }
  // a little stone basin where the spring wells up, between the stones
  ell(g, 0, -3, 15, 5);
  paint(g, gold ? "#e8d8a8" : shade(rock, 0.1), 1.1);
  ell(g, 0, -4, 11, 3.2);
  paint(g, gold ? "#fff0b0" : "#9affe0", 0.6);
}

export function gateSprite(S: number, rock: string, leaves: string[], bloom: string[], gold = false): Spr {
  return bake(S, GATE.w, GATE.h, GATE.ax, GATE.ay, (g) => gateArt(g, rock, leaves, bloom.length ? bloom : ["#ffe46a", "#ffffff"], gold));
}

/* ======================================================================
 * Trees of spring: what grows where Brigid gives her heart
 * ==================================================================== */

export const SPRING_TREE = { w: 120, h: 150, ax: 60, ay: 142 };

function springTreeArt(g: G, big: boolean) {
  const r = rnd(big ? 91 : 92);
  const k = big ? 1 : 0.55;
  ell(g, 0, 1, 34 * k, 7 * k);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fill();
  // a soft light round it
  const glow = g.createRadialGradient(0, -70 * k, 4, 0, -70 * k, 70 * k);
  glow.addColorStop(0, "rgba(210,255,230,0.45)");
  glow.addColorStop(1, "rgba(210,255,230,0)");
  g.fillStyle = glow;
  g.fillRect(-70, -150, 140, 150);
  // the trunk, twisting up out of the heart
  g.beginPath();
  g.moveTo(-7 * k, 0);
  g.bezierCurveTo(-12 * k, -25 * k, 6 * k, -40 * k, -3 * k, -70 * k);
  g.lineTo(5 * k, -70 * k);
  g.bezierCurveTo(14 * k, -40 * k, -2 * k, -25 * k, 8 * k, 0);
  g.closePath();
  paint(g, "#7a5a3a", 1.2);
  g.strokeStyle = "#a07a50";
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(-2 * k, -4 * k);
  g.bezierCurveTo(-6 * k, -25 * k, 6 * k, -40 * k, 0, -66 * k);
  g.stroke();
  // the heart, glowing in the bark
  g.beginPath();
  g.moveTo(1, -22 * k);
  g.bezierCurveTo(-5 * k, -26 * k, -3 * k, -32 * k, 1, -29 * k);
  g.bezierCurveTo(5 * k, -32 * k, 7 * k, -26 * k, 1, -22 * k);
  paint(g, "#ff6a8a", 0.7);
  // the crown: green, heavy with blossom
  const blobsList: [number, number, number, number, number][] = [];
  const n = big ? 11 : 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    blobsList.push([Math.cos(a) * 26 * k + (r() - 0.5) * 6, -84 * k + Math.sin(a) * 16 * k, (14 + r() * 6) * k, (11 + r() * 4) * k, r() * 3]);
  }
  blobsList.push([0, -88 * k, 22 * k, 16 * k, 0]);
  blobs(g, blobsList, big ? "#5ab04a" : "#6ac04a", 1);
  for (const [x, y, rx, ry] of blobsList) {
    ell(g, x - rx * 0.25, y - ry * 0.3, rx * 0.5, ry * 0.35, -0.3);
    g.fillStyle = "rgba(200,255,170,0.35)";
    g.fill();
  }
  for (let i = 0; i < (big ? 46 : 18); i++) {
    const [x, y, rx, ry] = blobsList[Math.floor(r() * blobsList.length)];
    const px = x + (r() - 0.5) * rx * 1.4;
    const py = y + (r() - 0.5) * ry * 1.3;
    ell(g, px, py, 1.7 * (big ? 1 : 0.9), 1.7 * (big ? 1 : 0.9));
    paint(g, i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffc8dc" : "#fff0a0", 0.4);
  }
  if (!big) {
    // a green ribbon tied round the young trunk
    line(g, [[-4, -30], [4, -31]], 1.6, "#3aa060");
    line(g, [[3, -31], [7, -24], [9, -20]], 1, "#3aa060");
    line(g, [[3, -31], [9, -27], [12, -26]], 1, "#3aa060");
  }
}

/** [0] the big tree of a grove, [1] the young tree of a hamlet with names */
export function springTreeSprites(S: number): Spr[] {
  return [true, false].map((big) => bake(S, SPRING_TREE.w, SPRING_TREE.h, SPRING_TREE.ax, SPRING_TREE.ay, (g) => springTreeArt(g, big)));
}
