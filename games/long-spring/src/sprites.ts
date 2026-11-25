/**
 * All the art, drawn by code with canvas paths (no image files). Every picture is drawn once,
 * at the screen's real resolution, onto its own small canvas, so it stays sharp on any screen.
 * The rider and her mount are redrawn whenever you change colours.
 *
 * Coordinates: each sprite has an anchor (ax, ay) = the point that stands on the ground.
 * y grows downwards; a rider is about 100 units tall.
 */
import { BIOMES, type Biome, type Look, type MonsterId, type MountId, type RiderId } from "./config";

type G = CanvasRenderingContext2D;
export type Spr = { c: HTMLCanvasElement; w: number; h: number; ax: number; ay: number };

export const OL = "#1c1410";
export const TAU = Math.PI * 2;

/** draw a sprite of w × h units with its anchor at (ax, ay), at S device pixels per unit */
export function bake(S: number, w: number, h: number, ax: number, ay: number, fn: (g: G) => void): Spr {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w * S));
  c.height = Math.max(1, Math.ceil(h * S));
  const g = c.getContext("2d")!;
  g.scale(S, S);
  g.translate(ax, ay);
  g.lineJoin = "round";
  g.lineCap = "round";
  fn(g);
  return { c, w, h, ax, ay };
}

/** lighten (k > 0) or darken (k < 0) a #rrggbb colour */
export function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1, 7), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}
/** mix two #rrggbb colours, t = 0 → a, 1 → b */
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1, 7), 16);
  const y = parseInt(b.slice(1, 7), 16);
  const ch = (s: number) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export function ell(g: G, x: number, y: number, rx: number, ry: number, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
}
export function paint(g: G, fill: string, lw = 1.1, stroke = OL) {
  g.fillStyle = fill;
  g.fill();
  if (lw > 0) {
    g.lineWidth = lw;
    g.strokeStyle = stroke;
    g.stroke();
  }
}
export function line(g: G, pts: [number, number][], w: number, c: string, outline = true) {
  const path = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  };
  if (outline) {
    path();
    g.lineWidth = w + 2;
    g.strokeStyle = OL;
    g.stroke();
  }
  path();
  g.lineWidth = w;
  g.strokeStyle = c;
  g.stroke();
}
/** a small seeded random generator, so every tree is the same tree each time */
export function rnd(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/* ======================================================================
 * The rider on her mount, coming towards you
 * ==================================================================== */

export const HERO = { w: 84, h: 136, ax: 42, ay: 128 };
/** 8 running frames, then jump, then duck */
export const HERO_FRAMES = 10;

type Mode = "run" | "jump" | "duck" | "dead";

/** long hair streaming back in the wind: a full shape that bends with the gallop and ends in three locks */
function hairMass(g: G, c: string, cx: number, cy: number, len: number, width: number, ph: number) {
  const sway = Math.sin(ph * TAU) * 5;
  const bend = Math.sin(ph * TAU + 1.2) * 3;
  const L = (k: number) => cy - len * k;
  g.beginPath();
  g.moveTo(cx - 5.5, cy + 4);
  g.bezierCurveTo(cx - width - 3, cy - 2, cx - width + bend, L(0.35), cx - width * 0.75 + bend + sway * 0.5, L(0.68));
  g.quadraticCurveTo(cx - width * 0.7 + sway * 0.8, L(0.86), cx - width * 0.45 + sway, L(0.92));
  g.quadraticCurveTo(cx - width * 0.3 + sway, L(0.8), cx - width * 0.12 + sway, L(0.76));
  g.quadraticCurveTo(cx - width * 0.1 + sway * 1.2, L(0.95), cx + sway * 1.35, L(1.04));
  g.quadraticCurveTo(cx + width * 0.12 + sway, L(0.86), cx + width * 0.2 + sway, L(0.76));
  g.quadraticCurveTo(cx + width * 0.35 + sway, L(0.82), cx + width * 0.52 + sway, L(0.9));
  g.quadraticCurveTo(cx + width * 0.75 + sway * 0.7, L(0.8), cx + width * 0.78 + bend + sway * 0.4, L(0.62));
  g.bezierCurveTo(cx + width + bend, L(0.32), cx + width + 3, cy - 2, cx + 5.5, cy + 4);
  g.closePath();
  paint(g, c, 1.2);
  g.lineWidth = 0.75;
  const strands: [number, number, string][] = [[-0.55, 0.85, shade(c, 0.25)], [-0.2, 0.95, shade(c, -0.3)], [0.15, 0.98, shade(c, 0.25)], [0.45, 0.84, shade(c, -0.3)]];
  for (const [x, k, col] of strands) {
    g.strokeStyle = col;
    g.beginPath();
    g.moveTo(cx + x * width * 0.4, cy - 3);
    g.bezierCurveTo(cx + x * width * 1.1 + bend, L(0.3), cx + x * width * 0.9 + sway * 0.6, L(0.6), cx + x * width * 0.6 + sway, L(k * 0.9));
    g.stroke();
  }
}

function hair(g: G, look: Look, rider: RiderId, hx: number, hy: number, ph: number, mode: Mode) {
  const c = look.hair;
  const lift = mode === "jump" ? 5 : mode === "duck" ? -7 : 0;
  if (rider === "dryad") {
    hairMass(g, c, hx, hy - 1, 40 + lift, 13, ph);
    // leaves caught in her hair
    const r = rnd(5);
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + 0.6 + r() * 1.9;
      const d = 10 + r() * 14;
      ell(g, hx + Math.cos(a) * d * 0.8, hy + Math.sin(a) * d, 1, 2, a);
      paint(g, i % 2 ? "#6ac04a" : look.accent, 0.4);
    }
  } else if (rider === "amazon") {
    hairMass(g, c, hx, hy - 1, 30 + lift, 10, ph + 0.3);
    // a long braid flying out behind
    const sway = Math.sin(ph * TAU + 1) * 3;
    for (let k = 4; k >= 0; k--) {
      const t = k / 4;
      const x = hx + 6 + Math.sin(t * 3 + ph * TAU) * 2.2 + sway * t + t * 6;
      const y = hy - 6 - t * (22 + lift);
      ell(g, x, y, 2.2 - t * 0.6, 2.6);
      paint(g, k % 2 ? c : shade(c, 0.18), 0.9);
    }
    ell(g, hx + 12 + sway, hy - 30 - lift, 1.5, 1.1);
    paint(g, look.accent, 0.6);
  } else {
    // the knight: a high ponytail streaming back
    const sway = Math.sin(ph * TAU) * 4;
    g.beginPath();
    g.moveTo(hx - 2.6, hy - 5);
    g.bezierCurveTo(hx - 5 + sway, hy - 16, hx - 4 - sway, hy - 26, hx + sway * 1.4, hy - 36 - lift);
    g.bezierCurveTo(hx + 5 - sway, hy - 26, hx + 6 + sway, hy - 16, hx + 2.6, hy - 5);
    g.closePath();
    paint(g, c, 1.2);
    g.strokeStyle = shade(c, 0.25);
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(hx, hy - 7);
    g.bezierCurveTo(hx - 1 + sway, hy - 16, hx - sway, hy - 26, hx + sway * 1.3, hy - 33 - lift);
    g.stroke();
    ell(g, hx, hy - 6, 2.2, 1.4);
    paint(g, look.accent, 0.7);
  }
}

function face(g: G, look: Look, rider: RiderId, hx: number, hy: number, mode: Mode) {
  g.save();
  g.translate(hx, hy);
  g.scale(1.22, 1.22);
  g.translate(-hx, -hy);
  faceInner(g, look, rider, hx, hy, mode);
  g.restore();
}

function faceInner(g: G, look: Look, rider: RiderId, hx: number, hy: number, mode: Mode) {
  const skin = look.skin;
  // head
  g.beginPath();
  g.moveTo(hx - 4.6, hy - 1);
  g.bezierCurveTo(hx - 4.8, hy - 7, hx + 4.8, hy - 7, hx + 4.6, hy - 1);
  g.bezierCurveTo(hx + 4.4, hy + 4, hx + 1.6, hy + 6.4, hx, hy + 6.6);
  g.bezierCurveTo(hx - 1.6, hy + 6.4, hx - 4.4, hy + 4, hx - 4.6, hy - 1);
  paint(g, skin, 1);
  // eyes (looking down a little when ducking)
  const ey = hy + (mode === "duck" ? 1.2 : 0.4);
  for (const s of [-1, 1]) {
    if (mode === "dead") {
      // closed eyes
      g.beginPath();
      g.moveTo(hx + s * 1, ey - 0.2);
      g.quadraticCurveTo(hx + s * 1.9, ey + 0.8, hx + s * 2.8, ey - 0.2);
      g.lineWidth = 0.6;
      g.strokeStyle = "#1e1612";
      g.stroke();
    } else {
      ell(g, hx + s * 1.9, ey, 0.95, 1.25);
      paint(g, "#1e1612", 0);
      g.fillStyle = "#ffffff";
      g.fillRect(hx + s * 1.9 - 0.2, ey - 0.8, 0.5, 0.5);
    }
    g.beginPath();
    g.moveTo(hx + s * 1.1, ey - 2);
    g.lineTo(hx + s * 2.9, ey - 2.3 + (rider === "amazon" ? 0.3 : 0));
    g.lineWidth = 0.6;
    g.strokeStyle = shade(look.hair, -0.3);
    g.stroke();
  }
  // blush and lips
  g.fillStyle = "rgba(220,90,100,0.25)";
  ell(g, hx - 2.8, hy + 2.4, 1.1, 0.6);
  g.fill();
  ell(g, hx + 2.8, hy + 2.4, 1.1, 0.6);
  g.fill();
  ell(g, hx, hy + 4.1, 1, 0.45);
  paint(g, "#b8424e", 0);
  if (rider === "amazon") {
    // war paint
    g.strokeStyle = look.accent;
    g.lineWidth = 0.7;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(hx + s * 1.5, hy + 1.8);
      g.lineTo(hx + s * 3.6, hy + 1.4);
      g.stroke();
    }
  }
  // fringe and side locks
  const c = look.hair;
  g.beginPath();
  g.moveTo(hx - 5, hy + 1);
  g.bezierCurveTo(hx - 5.8, hy - 8, hx + 5.8, hy - 8, hx + 5, hy + 1);
  g.bezierCurveTo(hx + 3.5, hy - 3.5, hx + 1, hy - 2.5, hx, hy - 4);
  g.bezierCurveTo(hx - 1, hy - 2.4, hx - 3.4, hy - 3.6, hx - 5, hy + 1);
  paint(g, c, 1);
  if (rider !== "knight")
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(hx + s * 4.6, hy - 2);
      g.bezierCurveTo(hx + s * 6.4, hy + 4, hx + s * 6, hy + 9, hx + s * 7.5, hy + 14);
      g.lineWidth = 3.8;
      g.strokeStyle = OL;
      g.stroke();
      g.lineWidth = 2.6;
      g.strokeStyle = c;
      g.stroke();
    }
  // crowns and bands
  if (rider === "dryad") {
    const leaves: [number, number, number][] = [[-5, -3, -0.9], [-3.4, -5.6, -0.4], [0, -6.6, 0], [3.4, -5.6, 0.4], [5, -3, 0.9]];
    for (const [x, y, r] of leaves) {
      ell(g, hx + x, hy + y, 1.3, 2.6, r);
      paint(g, "#5aa040", 0.6);
    }
    for (const [x, y] of [[-4.2, -4.6], [0, -7.4], [4.2, -4.6]]) {
      ell(g, hx + x, hy + y, 1.2, 1.2);
      paint(g, look.accent, 0.5);
    }
  } else if (rider === "knight") {
    g.beginPath();
    g.moveTo(hx - 4.8, hy - 3.6);
    g.quadraticCurveTo(hx, hy - 5.6, hx + 4.8, hy - 3.6);
    g.lineWidth = 1.2;
    g.strokeStyle = "#f0c85a";
    g.stroke();
    ell(g, hx, hy - 4.9, 0.9, 0.9);
    paint(g, look.accent, 0.4);
  } else {
    g.beginPath();
    g.moveTo(hx - 4.9, hy - 3);
    g.quadraticCurveTo(hx, hy - 5, hx + 4.9, hy - 3);
    g.lineWidth = 1.4;
    g.strokeStyle = look.accent;
    g.stroke();
  }
}

/** the slim torso with its clothes and shoulders, hips at sy, shoulders at sh */
function torso(g: G, rider: RiderId, look: Look, sy: number, sh: number) {
  const { skin, garment, accent } = look;
  // torso: slim, a narrow waist
  g.beginPath();
  g.moveTo(-3.4, sy + 1);
  g.bezierCurveTo(-3.6, sy - 4, -3, sh + 8, -4.4, sh + 3);
  g.bezierCurveTo(-5.4, sh + 1, -6.2, sh, -6, sh - 0.5);
  g.lineTo(6, sh - 0.5);
  g.bezierCurveTo(6.2, sh, 5.4, sh + 1, 4.4, sh + 3);
  g.bezierCurveTo(3, sh + 8, 3.6, sy - 4, 3.4, sy + 1);
  g.closePath();
  const top = rider === "knight" ? garment : rider === "dryad" ? garment : garment;
  paint(g, skin, 1);
  // clothes over it
  g.save();
  g.clip();
  if (rider === "knight") {
    g.fillStyle = garment;
    g.fillRect(-8, sh - 2, 16, sy - sh + 4);
    g.fillStyle = shade(garment, 0.35);
    g.fillRect(-3.5, sh + 1, 2, sy - sh - 4);
    g.strokeStyle = shade(garment, -0.35);
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(-5, sh + 9);
    g.quadraticCurveTo(0, sh + 11, 5, sh + 9);
    g.stroke();
  } else if (rider === "dryad") {
    // a bodice of leaves
    g.fillStyle = top;
    g.fillRect(-8, sh + 1, 16, 9);
    for (let i = -3; i <= 3; i++) {
      ell(g, i * 1.7, sh + 9.6, 1.1, 2.2, i * 0.15);
      paint(g, i % 2 ? "#4f8a3a" : "#5aa040", 0.4);
    }
    g.fillStyle = shade(top, -0.2);
    g.fillRect(-8, sy - 3, 16, 5);
  } else {
    g.fillStyle = top;
    g.fillRect(-8, sh + 1, 16, 8);
    g.fillRect(-8, sy - 4, 16, 6);
    g.strokeStyle = accent;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-6, sh);
    g.lineTo(5, sh + 9);
    g.stroke();
  }
  g.restore();
  g.lineWidth = 1;
  g.strokeStyle = OL;
  g.stroke();
  // shoulders
  if (rider === "knight")
    for (const s of [-1, 1]) {
      ell(g, s * 6, sh + 1, 3, 2.4);
      paint(g, shade(garment, 0.15), 0.9);
    }
}

function riderBody(g: G, rider: RiderId, look: Look, sy: number, ph: number, mode: Mode) {
  const { skin, garment, accent } = look;
  const duck = mode === "duck";
  const sh = duck ? sy - 13 : sy - 20; // shoulders
  const hx = 0;
  const hy = duck ? sy - 20 : sy - 29;
  // cape (knight) and bow (amazon) go behind
  if (rider === "knight") {
    // a long scarf streaming out behind her, in two tails
    const w = Math.sin(ph * TAU) * 3;
    for (const [dx, dy, len] of [[0, 0, 1], [3, 5, 0.8]] as [number, number, number][]) {
      g.beginPath();
      g.moveTo(-3, sh - 1);
      g.bezierCurveTo(8 + dx, sh - 4 + w, 12 + dx, sh - 12 * len - w + dy, 22 * len + dx + w, sh - 20 * len + dy);
      g.lineTo(20 * len + dx + w, sh - 13 * len + dy);
      g.bezierCurveTo(12 + dx, sh - 6 + w + dy, 8, sh + 1, 3, sh + 1);
      g.closePath();
      paint(g, dx ? shade(accent, -0.15) : accent, 1);
    }
  }
  if (rider === "amazon") {
    g.beginPath();
    g.moveTo(-9, sh - 6);
    g.quadraticCurveTo(-1, sh - 18, 9, sh - 4);
    g.lineWidth = 2.6;
    g.strokeStyle = OL;
    g.stroke();
    g.lineWidth = 1.5;
    g.strokeStyle = "#8a5a2a";
    g.stroke();
  }
  hair(g, look, rider, hx, hy, ph, mode);
  // legs over the mount's back
  const legC = rider === "knight" ? garment : rider === "dryad" ? skin : skin;
  for (const s of [-1, 1]) {
    line(g, [[s * 3.4, sy - 1], [s * 10.5, sy + 4], [s * 11, sy + 12]], 3.4, legC);
    ell(g, s * 11.2, sy + 12.6, 2.1, 1.8);
    paint(g, rider === "dryad" ? "#5a3a22" : "#3a2418", 0.9);
    if (rider === "dryad") {
      g.beginPath();
      g.moveTo(s * 8, sy + 2);
      g.quadraticCurveTo(s * 11.5, sy + 5, s * 10, sy + 8);
      g.lineWidth = 0.7;
      g.strokeStyle = "#3f7a3a";
      g.stroke();
    }
  }
  torso(g, rider, look, sy, sh);
  // arms reaching for the reins
  const armC = rider === "knight" ? shade(garment, -0.05) : skin;
  for (const s of [-1, 1]) {
    line(g, [[s * 5.8, sh + 1], [s * 9, sh + 8], [s * 5, sy - 3]], 2.4, armC);
    ell(g, s * 4.8, sy - 2.6, 1.5, 1.4);
    paint(g, skin, 0.8);
  }
  if (rider === "dryad") {
    g.strokeStyle = "#3f7a3a";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(-8.6, sh + 5);
    g.lineTo(-7.2, sh + 7);
    g.stroke();
  }
  // neck and face
  g.fillStyle = skin;
  g.fillRect(-1.4, hy + 5, 2.8, sh - hy - 4);
  g.strokeStyle = OL;
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(-1.4, hy + 5);
  g.lineTo(-1.4, sh);
  g.moveTo(1.4, hy + 5);
  g.lineTo(1.4, sh);
  g.stroke();
  face(g, look, rider, hx, hy, mode);
}

function legsFront(g: G, coat: string, ph: number, mode: Mode, w: number, top: number, spread: number, len: number) {
  const dark = shade(coat, -0.3);
  for (const s of [-1, 1]) {
    const a = mode === "jump" ? -0.8 : Math.sin(ph * TAU + (s > 0 ? Math.PI : 0));
    const lift = Math.max(0, -a);
    const kneeY = top + len * 0.5 - lift * 3;
    const footY = -lift * len * 0.55;
    line(g, [[s * spread, top], [s * (spread + 1 + a), kneeY], [s * spread, footY - 1.5]], w, coat);
    ell(g, s * spread, footY - 0.5, w * 0.6, 1.4);
    paint(g, dark === coat ? "#2a1c14" : shade(coat, -0.6), 0.8);
  }
}

function mountFront(g: G, id: MountId, look: Look, ph: number, mode: Mode, part: "back" | "front") {
  const c = look.coat;
  const dark = shade(c, -0.3);
  const light = shade(c, 0.22);
  const bob = mode === "run" ? -Math.abs(Math.sin(ph * TAU)) * 1.6 : 0;
  if (id === "elk") {
    if (part === "back") {
      // hind legs, further away
      legsFront(g, dark, ph + 0.5, mode, 3, -30 + bob, 6, 22);
      ell(g, 0, -40 + bob, 13.5, 17);
      paint(g, c, 1.2);
      ell(g, -3.5, -45 + bob, 6.5, 8);
      g.fillStyle = alpha(light, 0.6);
      g.fill();
      return;
    }
    ell(g, 0, -25 + bob, 11.5, 10);
    paint(g, shade(c, -0.1), 1.1);
    legsFront(g, c, ph, mode, 4, -20 + bob, 6.5, 20);
    // the long moose head, coming at you
    const t = -37 + bob;
    g.beginPath();
    g.moveTo(-5, t);
    g.bezierCurveTo(-7.5, t + 6, -7, t + 16, -6, t + 21);
    g.bezierCurveTo(-5, t + 25, 5, t + 25, 6, t + 21);
    g.bezierCurveTo(7, t + 16, 7.5, t + 6, 5, t);
    g.closePath();
    paint(g, c, 1.1);
    ell(g, 0, t + 20, 5.5, 3.6);
    paint(g, shade(c, -0.25), 0.8);
    for (const s of [-1, 1]) {
      ell(g, s * 2, t + 20.5, 0.9, 1.1);
      paint(g, "#1a1410", 0);
      ell(g, s * 4.3, t + 8, 1.2, 1.4);
      paint(g, "#1a1410", 0);
      g.fillStyle = "#fff";
      g.fillRect(s * 4.3 - 0.3, t + 7.2, 0.5, 0.5);
      ell(g, s * 8.5, t + 3, 2, 4.2, s * 1.1);
      paint(g, c, 0.9);
    }
    // palmate antlers
    const h = look.horn;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 3, t + 1);
      g.quadraticCurveTo(s * 7, t - 4, s * 11, t - 6);
      g.lineTo(s * 11, t - 13);
      const tips = [[13, -19], [16, -16], [19, -21], [22, -17], [25, -21], [28, -15], [30, -10]];
      for (const [x, y] of tips) g.lineTo(s * x, t + y);
      g.quadraticCurveTo(s * 26, t - 4, s * 18, t - 4);
      g.quadraticCurveTo(s * 10, t - 2, s * 5, t + 3);
      g.closePath();
      paint(g, h, 1.1);
      g.beginPath();
      g.moveTo(s * 13, t - 9);
      g.quadraticCurveTo(s * 20, t - 12, s * 26, t - 10);
      g.lineWidth = 0.7;
      g.strokeStyle = shade(h, -0.25);
      g.stroke();
    }
  } else if (id === "wolf") {
    if (part === "back") {
      legsFront(g, dark, ph + 0.5, mode, 2.6, -28 + bob, 5.5, 20);
      ell(g, 0, -37 + bob, 12, 15.5);
      paint(g, c, 1.2);
      ell(g, -3, -42 + bob, 6, 7.5);
      g.fillStyle = alpha(light, 0.55);
      g.fill();
      return;
    }
    // fluffy ruff
    g.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const r = i % 2 ? 11.5 : 13;
      g.lineTo(Math.cos(a) * r * 0.95, -24 + bob - Math.sin(a) * r * 0.75);
    }
    g.closePath();
    paint(g, light, 1.1);
    legsFront(g, c, ph, mode, 3.2, -18 + bob, 5.5, 18);
    const t = -36 + bob;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 3.5, t + 2);
      g.lineTo(s * 9.5, t - 9);
      g.lineTo(s * 9.5, t + 5);
      g.closePath();
      paint(g, c, 1);
      g.beginPath();
      g.moveTo(s * 5.5, t + 2);
      g.lineTo(s * 8.6, t - 5);
      g.lineTo(s * 8.6, t + 3);
      g.closePath();
      paint(g, "#e8b8a8", 0);
    }
    g.beginPath();
    g.moveTo(-8.5, t + 3);
    g.bezierCurveTo(-9, t + 12, -4, t + 18, -3, t + 23);
    g.lineTo(3, t + 23);
    g.bezierCurveTo(4, t + 18, 9, t + 12, 8.5, t + 3);
    g.bezierCurveTo(5, t - 1, -5, t - 1, -8.5, t + 3);
    paint(g, c, 1.1);
    g.beginPath();
    g.moveTo(-4.5, t + 12);
    g.quadraticCurveTo(0, t + 10, 4.5, t + 12);
    g.lineTo(3, t + 23);
    g.lineTo(-3, t + 23);
    g.closePath();
    paint(g, light, 0);
    ell(g, 0, t + 22, 2.3, 1.6);
    paint(g, "#141010", 0.6);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 1.8, t + 7.5);
      g.lineTo(s * 5.6, t + 6.4);
      g.lineTo(s * 4.6, t + 8.8);
      g.closePath();
      paint(g, "#f0d040", 0.6);
    }
  } else {
    if (part === "back") {
      legsFront(g, dark, ph + 0.5, mode, 4, -26 + bob, 8, 18);
      ell(g, 0, -36 + bob, 16, 16);
      paint(g, c, 1.2);
      // bristles along the spine
      g.strokeStyle = shade(c, -0.55);
      g.lineWidth = 1.2;
      for (let y = -50; y < -26; y += 2.5) {
        g.beginPath();
        g.moveTo(-1.5, y + bob);
        g.lineTo(0, y - 3 + bob);
        g.lineTo(1.5, y + bob);
        g.stroke();
      }
      return;
    }
    ell(g, 0, -23 + bob, 13, 9);
    paint(g, dark, 1.1);
    legsFront(g, c, ph, mode, 5, -17 + bob, 8.5, 16);
    const t = -34 + bob;
    g.beginPath();
    g.moveTo(-10, t + 2);
    g.bezierCurveTo(-11, t + 12, -7, t + 19, -6, t + 21);
    g.lineTo(6, t + 21);
    g.bezierCurveTo(7, t + 19, 11, t + 12, 10, t + 2);
    g.bezierCurveTo(6, t - 2, -6, t - 2, -10, t + 2);
    paint(g, c, 1.1);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 7, t + 1);
      g.lineTo(s * 12, t - 4);
      g.lineTo(s * 10.5, t + 5);
      g.closePath();
      paint(g, c, 0.9);
      ell(g, s * 4.5, t + 8, 1, 1);
      paint(g, "#2a0808", 0);
      g.fillStyle = "#ff8060";
      g.fillRect(s * 4.5 - 0.3, t + 7.6, 0.5, 0.5);
    }
    ell(g, 0, t + 21, 6.2, 4);
    paint(g, "#c08878", 1);
    for (const s of [-1, 1]) {
      ell(g, s * 2, t + 21, 1, 1.4);
      paint(g, "#3a1a14", 0);
      g.beginPath();
      g.moveTo(s * 5.5, t + 18);
      g.quadraticCurveTo(s * 11, t + 16, s * 11, t + 8);
      g.lineWidth = 3.4;
      g.strokeStyle = OL;
      g.stroke();
      g.lineWidth = 2.2;
      g.strokeStyle = look.horn;
      g.stroke();
    }
  }
}

const SEAT: Record<MountId, number> = { elk: -47, wolf: -43, boar: -46 };

export function heroFrame(S: number, rider: RiderId, mount: MountId, look: Look, f: number): Spr {
  const mode: Mode = f === 8 ? "jump" : f === 9 ? "duck" : "run";
  const ph = f < 8 ? f / 8 : 0.25;
  return bake(S, HERO.w, HERO.h, HERO.ax, HERO.ay, (g) => {
    const bob = mode === "run" ? -Math.abs(Math.sin(ph * TAU)) * 1.6 : 0;
    mountFront(g, mount, look, ph, mode, "back");
    riderBody(g, rider, look, SEAT[mount] + bob, ph, mode);
    mountFront(g, mount, look, ph, mode, "front");
  });
}

export function heroFrames(S: number, rider: RiderId, mount: MountId, look: Look): Spr[] {
  return Array.from({ length: HERO_FRAMES }, (_, f) => heroFrame(S, rider, mount, look, f));
}

/* ---------------- fallen: the rider and her mount on the ground ---------------- */

/** the picture's box; its anchor is where the rider was */
export const FALLEN = { w: 196, h: 116, ax: 98, ay: 66 };

/** many soft shapes drawn as one: outline pass first, then the fill, so only the outer edge shows */
export function blobs(g: G, shapes: [number, number, number, number, number][], fill: string, lw = 1.2) {
  g.lineWidth = lw * 2;
  g.strokeStyle = OL;
  for (const [x, y, rx, ry, r] of shapes) {
    ell(g, x, y, rx, ry, r);
    g.stroke();
  }
  g.fillStyle = fill;
  for (const [x, y, rx, ry, r] of shapes) {
    ell(g, x, y, rx, ry, r);
    g.fill();
  }
}

/** hair spread out on the ground around the head, in locks pointing away from the face */
function hairFan(g: G, c: string, hx: number, hy: number, len: number, spread: number, n: number, seed: number) {
  const r = rnd(seed);
  const shapes: [number, number, number, number, number][] = [[hx, hy - 1, 7, 7.5, 0]];
  const ends: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 1.5 - spread + (2 * spread * i) / (n - 1) + (r() - 0.5) * 0.12;
    const L = len * (0.78 + r() * 0.3);
    shapes.push([hx + Math.cos(a) * L * 0.5, hy + Math.sin(a) * L * 0.5, L * 0.55, 3.6 + r() * 1.4, a]);
    ends.push([a, L, 0]);
  }
  blobs(g, shapes, c);
  g.lineWidth = 0.7;
  for (const [a, L] of ends) {
    for (const [off, col] of [[-0.12, shade(c, 0.25)], [0.1, shade(c, -0.3)]] as [number, string][]) {
      g.strokeStyle = col;
      g.beginPath();
      g.moveTo(hx + Math.cos(a + off) * 6, hy + Math.sin(a + off) * 6);
      g.quadraticCurveTo(hx + Math.cos(a + off * 2) * L * 0.6, hy + Math.sin(a + off * 2) * L * 0.6, hx + Math.cos(a) * L * 0.92, hy + Math.sin(a) * L * 0.92);
      g.stroke();
    }
  }
}

/** a splash of blood on cloth or skin */
export function splat(g: G, x: number, y: number, rr: number, seed: number) {
  const r = rnd(seed);
  g.fillStyle = "#8a0d18";
  ell(g, x, y, rr, rr * 0.75, r() * 3);
  g.fill();
  for (let i = 0; i < 4; i++) {
    const a = r() * TAU;
    ell(g, x + Math.cos(a) * rr * 1.5, y + Math.sin(a) * rr * 1.2, rr * 0.25, rr * 0.2);
    g.fill();
  }
  g.fillStyle = "rgba(255,180,180,0.35)";
  ell(g, x - rr * 0.3, y - rr * 0.3, rr * 0.3, rr * 0.18, -0.5);
  g.fill();
}

/** the rider on her back, drawn upright (head up, hips at 0,0) and turned by the caller */
function lyingRider(g: G, rider: RiderId, look: Look, blood: boolean) {
  const { skin, garment, accent } = look;
  const sh = -20;
  const hy = -29;
  // what lies under her: hair, the knight's scarf, the amazon's spear
  if (rider === "knight") {
    for (const [dx, len] of [[0, 1], [4, 0.8]] as [number, number][]) {
      g.beginPath();
      g.moveTo(-2, sh);
      g.bezierCurveTo(-12, sh + 2 + dx, -20, sh + 10 + dx, -30 * len, sh + 6 + dx * 2);
      g.lineTo(-29 * len, sh + 12 + dx * 2);
      g.bezierCurveTo(-18, sh + 15 + dx, -10, sh + 8, 2, sh + 3);
      g.closePath();
      paint(g, dx ? shade(accent, -0.15) : accent, 1);
    }
    hairFan(g, look.hair, 0, hy, 13, 0.7, 4, 3);
    // the ponytail, fallen to one side
    blobs(g, [[9, hy - 9, 10, 3.6, -0.7], [15, hy - 16, 6, 2.8, -1]], look.hair);
    ell(g, 4.5, hy - 4.6, 2.2, 1.4, -0.7);
    paint(g, accent, 0.7);
  } else if (rider === "amazon") {
    line(g, [[-22, sh - 20], [20, sh + 10]], 1.8, "#8a5a2a");
    g.beginPath();
    g.moveTo(20, sh + 10);
    g.lineTo(28, sh + 14);
    g.lineTo(22, sh + 6.5);
    g.closePath();
    paint(g, "#d8dce4", 0.8);
    hairFan(g, look.hair, 0, hy, 20, 1.0, 6, 11);
    // the braid, lying in a curve
    for (let k = 0; k < 6; k++) {
      const t = k / 5;
      ell(g, -8 - t * 14, hy - 10 - Math.sin(t * 2.6) * 7, 2.4 - t * 0.6, 2.8, 0.9);
      paint(g, k % 2 ? look.hair : shade(look.hair, 0.18), 0.9);
    }
    ell(g, -23, hy - 13, 1.5, 1.1);
    paint(g, accent, 0.6);
  } else {
    hairFan(g, look.hair, 0, hy, 30, 1.35, 8, 5);
    const r = rnd(9);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 1.5 + (r() - 0.5) * 2.6;
      const d = 10 + r() * 20;
      ell(g, Math.cos(a) * d, hy + Math.sin(a) * d, 1.1, 2.2, a);
      paint(g, i % 2 ? "#6ac04a" : accent, 0.4);
    }
  }
  // arms flung out: one above her head, one to the side
  const armC = rider === "knight" ? shade(garment, -0.05) : skin;
  line(g, [[-5.8, sh + 1], [-12, sh - 6], [-14, sh - 17]], 2.4, armC);
  ell(g, -14.2, sh - 18, 1.6, 1.5);
  paint(g, skin, 0.8);
  line(g, [[5.8, sh + 1], [12.5, sh + 5], [19, sh + 4]], 2.4, armC);
  ell(g, 19.8, sh + 4, 1.6, 1.5);
  paint(g, skin, 0.8);
  // legs, one bent
  const legC = rider === "knight" ? garment : skin;
  const boot = rider === "dryad" ? "#5a3a22" : "#3a2418";
  line(g, [[-3, -1], [-5, 10], [-7.5, 21]], 3.4, legC);
  line(g, [[3, -1], [9, 8], [6.5, 19]], 3.4, legC);
  for (const [x, y] of [[-7.8, 22], [6.4, 20]]) {
    ell(g, x, y, 2.2, 1.9);
    paint(g, boot, 0.9);
  }
  if (rider === "dryad") {
    g.strokeStyle = "#3f7a3a";
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(-4, 4);
    g.quadraticCurveTo(-7, 9, -5, 14);
    g.moveTo(5, 3);
    g.quadraticCurveTo(10, 7, 8, 12);
    g.stroke();
  }
  // a short skirt or tunic over the hips
  g.beginPath();
  g.moveTo(-4.6, -3);
  g.lineTo(4.6, -3);
  g.lineTo(6.4, 3.5);
  g.quadraticCurveTo(0, 5.5, -6.4, 3.5);
  g.closePath();
  paint(g, rider === "dryad" ? "#4f8a3a" : shade(garment, -0.15), 1);
  torso(g, rider, look, 0, sh);
  g.fillStyle = skin;
  g.fillRect(-1.4, hy + 5, 2.8, sh - hy - 4);
  g.strokeStyle = OL;
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(-1.4, hy + 5);
  g.lineTo(-1.4, sh);
  g.moveTo(1.4, hy + 5);
  g.lineTo(1.4, sh);
  g.stroke();
  face(g, look, rider, 0, hy, "dead");
  if (blood) {
    splat(g, 2.5, sh + 9, 2.6, 21);
    splat(g, -2, hy + 5.5, 1.3, 22);
  }
}

/** the mount on its side, legs stretched towards you, head on the ground to the left */
function lyingMount(g: G, id: MountId, look: Look, blood: boolean) {
  const c = look.coat;
  const dark = shade(c, -0.3);
  const light = shade(c, 0.22);
  const hoof = shade(c, -0.6);
  const legs = (xs: number[], w: number, len: number, col: string, kick: number) => {
    for (const [i, x] of xs.entries()) {
      const k = kick * (i % 2 ? 1 : -0.6);
      line(g, [[x, -6], [x + 4 + k, -6 + len * 0.5], [x + 2 + k * 2, -6 + len]], w, col);
      ell(g, x + 2 + k * 2, -5 + len, w * 0.65, w * 0.45);
      paint(g, hoof, 0.8);
    }
  };
  if (id === "elk") {
    legs([-14, 22], 3.2, 22, dark, 3);
    // the body: shoulder hump on the left, rump on the right
    g.beginPath();
    g.moveTo(-26, -10);
    g.bezierCurveTo(-28, -26, -12, -32, -2, -27);
    g.bezierCurveTo(10, -26, 30, -28, 33, -14);
    g.bezierCurveTo(35, -2, 20, 2, 4, 1);
    g.bezierCurveTo(-12, 2, -25, 2, -26, -10);
    paint(g, c, 1.2);
    ell(g, 4, -5, 22, 4.6);
    g.fillStyle = alpha(light, 0.55);
    g.fill();
    g.strokeStyle = shade(c, -0.2);
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-16, -22);
    g.quadraticCurveTo(-8, -26, 2, -24);
    g.stroke();
    legs([-19, 16], 4, 24, c, 4);
    // the long head on the ground
    g.beginPath();
    g.moveTo(-22, -20);
    g.bezierCurveTo(-30, -22, -38, -16, -50, -10);
    g.bezierCurveTo(-58, -7, -64, -4, -64, 1);
    g.bezierCurveTo(-63, 5, -56, 6, -50, 4);
    g.bezierCurveTo(-42, 2, -32, 0, -24, -4);
    g.closePath();
    paint(g, c, 1.1);
    ell(g, -60, 1.5, 5, 4, 0.2);
    paint(g, shade(c, -0.25), 0.9);
    ell(g, -63, 1, 0.9, 1.1);
    paint(g, "#1a1410", 0);
    ell(g, -58, 6, 2.4, 1.2, 0.3);
    paint(g, "#c86a74", 0.6);
    // closed eye and the ear
    g.beginPath();
    g.moveTo(-49, -8);
    g.quadraticCurveTo(-47, -6.6, -45, -8);
    g.lineWidth = 0.8;
    g.strokeStyle = OL;
    g.stroke();
    ell(g, -38, -17, 2.2, 5, -0.9);
    paint(g, c, 0.9);
    // one palmate antler lying flat behind the head
    const h = look.horn;
    g.save();
    g.translate(-42, -15);
    g.rotate(-0.5);
    g.beginPath();
    g.moveTo(2, 2);
    g.quadraticCurveTo(-2, -4, -4, -10);
    const tips = [[-10, -14], [-8, -19], [-13, -22], [-11, -27], [-16, -29], [-17, -35], [-22, -33], [-24, -26]];
    for (const [x, y] of tips) g.lineTo(x, y);
    g.quadraticCurveTo(-20, -16, -12, -8);
    g.quadraticCurveTo(-6, -2, -2, 4);
    g.closePath();
    paint(g, h, 1.1);
    g.restore();
    if (blood) splat(g, 6, -16, 3.2, 31);
  } else if (id === "wolf") {
    legs([-12, 18], 2.8, 20, dark, 3);
    // a bushy tail
    blobs(g, [[36, -8, 10, 4.5, 0.4], [44, -3, 6, 3.4, 0.6]], c);
    g.beginPath();
    g.moveTo(-24, -9);
    g.bezierCurveTo(-25, -22, -10, -27, 2, -25);
    g.bezierCurveTo(16, -24, 30, -22, 31, -11);
    g.bezierCurveTo(31, -2, 18, 1, 2, 0);
    g.bezierCurveTo(-12, 1, -23, 1, -24, -9);
    paint(g, c, 1.2);
    ell(g, 2, -4, 20, 4);
    g.fillStyle = alpha(light, 0.6);
    g.fill();
    legs([-17, 13], 3.2, 20, c, 4);
    // ruff and head
    blobs(g, [[-24, -12, 9, 10, 0], [-30, -8, 6, 7, 0]], light);
    g.beginPath();
    g.moveTo(-28, -18);
    g.bezierCurveTo(-36, -20, -44, -14, -48, -8);
    g.lineTo(-58, -4);
    g.bezierCurveTo(-60, -2, -59, 2, -55, 2);
    g.bezierCurveTo(-46, 3, -36, 2, -28, -2);
    g.closePath();
    paint(g, c, 1.1);
    ell(g, -58, -2, 2.2, 1.6);
    paint(g, "#141010", 0.6);
    // tongue out
    ell(g, -52, 3.6, 3, 1.4, 0.2);
    paint(g, "#d86a7a", 0.6);
    g.beginPath();
    g.moveTo(-44, -9);
    g.quadraticCurveTo(-42, -7.6, -40, -9);
    g.lineWidth = 0.8;
    g.strokeStyle = OL;
    g.stroke();
    for (const [x, r] of [[-34, -0.4], [-30, -0.1]]) {
      g.beginPath();
      g.moveTo(x - 3, -17);
      g.lineTo(x + 2, -28);
      g.lineTo(x + 4, -16);
      g.closePath();
      paint(g, x < -32 ? shade(c, -0.15) : c, 1);
      void r;
    }
    if (blood) splat(g, 4, -14, 3, 32);
  } else {
    legs([-12, 20], 4, 15, dark, 2);
    g.beginPath();
    g.moveTo(-26, -10);
    g.bezierCurveTo(-28, -28, -8, -34, 6, -31);
    g.bezierCurveTo(22, -29, 34, -24, 34, -12);
    g.bezierCurveTo(34, 0, 20, 3, 4, 2);
    g.bezierCurveTo(-14, 2, -25, 2, -26, -10);
    paint(g, c, 1.2);
    // bristles along the spine
    g.strokeStyle = shade(c, -0.55);
    g.lineWidth = 1.2;
    for (let x = -18; x < 26; x += 3) {
      const y = -29 + Math.abs(x - 4) * 0.12;
      g.beginPath();
      g.moveTo(x - 1.5, y + 1);
      g.lineTo(x, y - 3);
      g.lineTo(x + 1.5, y + 1);
      g.stroke();
    }
    ell(g, 4, -4, 22, 4.5);
    g.fillStyle = alpha(light, 0.45);
    g.fill();
    legs([-17, 15], 5, 16, c, 3);
    // the big head with its snout disc and tusks
    g.beginPath();
    g.moveTo(-24, -22);
    g.bezierCurveTo(-36, -22, -46, -14, -52, -6);
    g.bezierCurveTo(-55, -1, -52, 4, -46, 4);
    g.bezierCurveTo(-36, 4, -28, 2, -22, -4);
    g.closePath();
    paint(g, c, 1.1);
    ell(g, -53, -1, 3.4, 5, 0.3);
    paint(g, "#c08878", 1);
    ell(g, -53.6, -2.4, 0.8, 1.1);
    paint(g, "#3a1a14", 0);
    ell(g, -53, 1, 0.8, 1.1);
    paint(g, "#3a1a14", 0);
    g.beginPath();
    g.moveTo(-47, 1);
    g.quadraticCurveTo(-46, -6, -40, -8);
    g.lineWidth = 3.4;
    g.strokeStyle = OL;
    g.stroke();
    g.lineWidth = 2.2;
    g.strokeStyle = look.horn;
    g.stroke();
    g.beginPath();
    g.moveTo(-40, -13);
    g.quadraticCurveTo(-38, -11.6, -36, -13);
    g.lineWidth = 0.8;
    g.strokeStyle = OL;
    g.stroke();
    g.beginPath();
    g.moveTo(-30, -20);
    g.lineTo(-26, -30);
    g.lineTo(-23, -19);
    g.closePath();
    paint(g, c, 0.9);
    if (blood) splat(g, 8, -18, 3.4, 33);
  }
}

/** the end of a run: the mount on its side and the rider thrown in front of it */
export function fallenFrame(S: number, rider: RiderId, mount: MountId, look: Look, blood = true): Spr {
  return bake(S, FALLEN.w, FALLEN.h, FALLEN.ax, FALLEN.ay, (g) => {
    g.save();
    g.translate(-16, -12);
    lyingMount(g, mount, look, blood);
    g.restore();
    g.save();
    g.translate(18, 22);
    g.rotate(Math.PI / 2 - 0.2);
    g.scale(1.15, 1.15);
    lyingRider(g, rider, look, blood);
    g.restore();
  });
}

/* ======================================================================
 * Monsters (coming at you)
 * ==================================================================== */

// the colour of something that has been dead a while and walks anyway
const FLESH = "#968980";
const FLESH_D = "#655852";
const FLESH_S = "#352828";
const GORE = "#7a1018";
const GLOW = "#b8ff5a";
const TOOTH = "#e2d6b0";

export const MONSTER_BOX: Record<MonsterId, { w: number; h: number }> = {
  maw: { w: 70, h: 66 },
  crawler: { w: 92, h: 54 },
  eye: { w: 80, h: 70 },
  colossus: { w: 112, h: 112 },
};

function limb(g: G, pts: [number, number][], w: number) {
  line(g, pts, w, FLESH_D);
  const [x, y] = pts[pts.length - 1];
  g.strokeStyle = FLESH_S;
  g.lineWidth = 1;
  for (const d of [-2, 0, 2]) {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + d, y + 2.5);
    g.stroke();
  }
}

function monsterArt(g: G, id: MonsterId, f: number) {
  const a = Math.sin((f / 4) * TAU);
  if (id === "maw") {
    for (const s of [-1, 1]) limb(g, [[s * 9, -16], [s * 16, -8 + s * a * 2], [s * 11, -1]], 5);
    for (const s of [-1, 1]) limb(g, [[s * 12, -46], [s * 24, -58 + s * a * 3], [s * 27, -38 - s * a * 3]], 3.4);
    ell(g, 0, -32, 23, 21);
    paint(g, FLESH, 1.3);
    ell(g, 7, -24, 13, 11);
    g.fillStyle = alpha(FLESH_D, 0.55);
    g.fill();
    const open = 10 + (f % 2) * 2;
    ell(g, 0, -28, 16, open);
    const gr = g.createRadialGradient(0, -26, 2, 0, -28, 16);
    gr.addColorStop(0, "#4a0a10");
    gr.addColorStop(1, "#1a0204");
    g.fillStyle = gr;
    g.fill();
    g.lineWidth = 1.3;
    g.strokeStyle = OL;
    g.stroke();
    ell(g, 0, -22 + (f % 2), 7, 3.5);
    paint(g, GORE, 0);
    // teeth
    g.fillStyle = TOOTH;
    g.strokeStyle = OL;
    g.lineWidth = 0.5;
    for (let i = -6; i <= 6; i++) {
      const x = i * 2.3;
      const top = -28 - open * Math.sqrt(1 - (x / 16) ** 2) + 0.5;
      const bot = -28 + open * Math.sqrt(1 - (x / 16) ** 2) - 0.5;
      g.beginPath();
      g.moveTo(x - 1.1, top);
      g.lineTo(x, top + 3.2 + (i % 2));
      g.lineTo(x + 1.1, top);
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(x - 1.1, bot);
      g.lineTo(x, bot - 3 - ((i + 1) % 2));
      g.lineTo(x + 1.1, bot);
      g.fill();
      g.stroke();
    }
    // drool
    g.strokeStyle = "rgba(220,240,200,0.7)";
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-5, -19);
    g.lineTo(-5.5, -13 + a * 2);
    g.moveTo(6, -19);
    g.lineTo(6.3, -15 - a * 2);
    g.stroke();
    // a cluster of tiny eyes
    for (const [x, y] of [[-6, -46], [-2, -49], [2, -48], [6, -45], [0, -44.5]]) {
      ell(g, x, y, 1.4, 1.4);
      paint(g, "#1a0a04", 0);
      ell(g, x, y, 0.8, 0.8);
      paint(g, GLOW, 0);
    }
    g.strokeStyle = "rgba(140,20,30,0.5)";
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(-18, -40);
    g.quadraticCurveTo(-12, -38, -14, -32);
    g.moveTo(16, -42);
    g.quadraticCurveTo(12, -40, 14, -34);
    g.stroke();
  } else if (id === "eye") {
    for (const s of [-1, 1]) {
      limb(g, [[s * 14, -34], [s * 28, -46 + s * a * 3], [s * 26, -10]], 3);
      limb(g, [[s * 12, -24], [s * 22, -20 - s * a * 3], [s * 15, -1]], 3);
      limb(g, [[s * 16, -42], [s * 32, -60 - s * a * 2], [s * 34, -34]], 2.6);
    }
    ell(g, 0, -36, 21, 20);
    paint(g, FLESH_D, 1.3);
    ell(g, 0, -36, 17, 16);
    const gr = g.createRadialGradient(-5, -42, 2, 0, -36, 18);
    gr.addColorStop(0, "#ffffff");
    gr.addColorStop(1, "#d8ccb8");
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = "rgba(190,30,40,0.8)";
    g.lineWidth = 0.7;
    for (const [x0, y0, x1, y1] of [[-16, -36, -7, -34], [16, -32, 7, -35], [-8, -50, -4, -42], [10, -48, 5, -41], [-12, -26, -5, -31]]) {
      g.beginPath();
      g.moveTo(x0, y0);
      g.quadraticCurveTo((x0 + x1) / 2 + 2, (y0 + y1) / 2 - 2, x1, y1);
      g.stroke();
    }
    const ig = g.createRadialGradient(0, -35, 1, 0, -35, 8);
    ig.addColorStop(0, "#f8ff90");
    ig.addColorStop(0.6, "#b8d030");
    ig.addColorStop(1, "#4a6010");
    ell(g, 0, -35, 7.5, 7.5);
    g.fillStyle = ig;
    g.fill();
    ell(g, 0, -35, 1.6, 5.5);
    paint(g, "#050505", 0);
    ell(g, -2.6, -38, 1.4, 1);
    paint(g, "#ffffff", 0);
    // eyelids, blinking on the last frame
    const lid = f === 3 ? 13 : 4;
    g.beginPath();
    g.ellipse(0, -36, 17.5, 16.5, 0, Math.PI, TAU);
    g.lineTo(17.5, -36);
    g.ellipse(0, -36 - 16.5 + lid, 17.5, lid, 0, 0, Math.PI, false);
    g.closePath();
    paint(g, FLESH, 1.1);
    g.beginPath();
    g.ellipse(0, -36, 17.5, 16.5, 0, 0, Math.PI);
    g.ellipse(0, -36 + 16.5 - 3, 17.5, 3, 0, Math.PI, TAU, true);
    g.closePath();
    paint(g, FLESH, 1.1);
    ell(g, 0, -15, 4, 1.4);
    paint(g, "#2a0608", 0.8);
  } else if (id === "crawler") {
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const lift = (i + (s > 0 ? 1 : 0) + f) % 2 === 0 ? -3 : 0;
        const bx = s * (7 + i * 4);
        limb(g, [[bx, -16], [s * (16 + i * 7), -26 + i * 2 + lift], [s * (19 + i * 7), -2 + lift * 0.5]], 3);
      }
    ell(g, 0, -16, 19, 10);
    paint(g, FLESH, 1.3);
    ell(g, 5, -12, 11, 6);
    g.fillStyle = alpha(FLESH_D, 0.5);
    g.fill();
    // the head, hair dragging, the face upside down
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 6, -32);
      g.bezierCurveTo(s * 13, -24, s * 10, -10, s * 13 + a, 0);
      g.lineTo(s * 8 + a, 0);
      g.bezierCurveTo(s * 6, -10, s * 7, -22, s * 3, -30);
      paint(g, "#141214", 1);
    }
    ell(g, 0, -26, 8, 9);
    paint(g, FLESH, 1.2);
    g.beginPath();
    g.moveTo(-5, -31);
    g.quadraticCurveTo(0, -36, 5, -31);
    g.quadraticCurveTo(0, -28, -5, -31);
    paint(g, "#2a0608", 0.8);
    g.fillStyle = TOOTH;
    for (let x = -3.5; x <= 3.5; x += 1.75) g.fillRect(x - 0.4, -32.2, 0.8, 1.4);
    for (const s of [-1, 1]) {
      ell(g, s * 3, -22, 1.6, 2);
      paint(g, "#100804", 0);
      ell(g, s * 3, -21.8, 0.8, 1);
      paint(g, GLOW, 0);
    }
    g.beginPath();
    g.moveTo(-8, -33);
    g.quadraticCurveTo(0, -40, 8, -33);
    g.lineWidth = 3;
    g.strokeStyle = "#141214";
    g.stroke();
  } else {
    for (const s of [-1, 1]) {
      line(g, [[s * 12, -26], [s * 15, -10 + s * a * 2], [s * 12, -2]], 10, FLESH_D);
      ell(g, s * 12, -1, 7, 3);
      paint(g, FLESH_S, 1);
    }
    // the great dragging arm
    line(g, [[-28, -76], [-42, -48], [-44, -14 + a * 2]], 12, FLESH);
    ell(g, -44, -8 + a * 2, 10, 7);
    paint(g, FLESH_D, 1.2);
    for (const d of [-6, -2, 2, 6]) {
      g.beginPath();
      g.moveTo(-44 + d, -4 + a * 2);
      g.lineTo(-44 + d * 1.2, 0 + a * 2);
      g.lineWidth = 2;
      g.strokeStyle = FLESH_S;
      g.stroke();
    }
    limb(g, [[26, -64], [36, -50], [32, -36]], 4);
    ell(g, 0, -56, 34, 34);
    paint(g, FLESH, 1.4);
    ell(g, 10, -46, 20, 22);
    g.fillStyle = alpha(FLESH_D, 0.55);
    g.fill();
    ell(g, -12, -70, 12, 9);
    g.fillStyle = "rgba(255,240,220,0.25)";
    g.fill();
    // stitches
    g.strokeStyle = FLESH_S;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-10, -84);
    g.bezierCurveTo(-4, -64, -8, -44, -2, -26);
    g.stroke();
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const x = -10 + 8 * t + Math.sin(t * 3) * 2;
      const y = -84 + 58 * t;
      g.beginPath();
      g.moveTo(x - 3, y);
      g.lineTo(x + 3, y + 1);
      g.stroke();
    }
    for (const [x, y, r] of [[10, -60, 4], [18, -46, 3.2], [6, -38, 3.6]]) {
      ell(g, x, y, r + 1, r);
      paint(g, "#2a0608", 1);
      ell(g, x, y, r * 0.55, r * 0.55);
      paint(g, GLOW, 0);
    }
    ell(g, 0, -92, 8, 8);
    paint(g, FLESH, 1.2);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 1.5, -93);
      g.lineTo(s * 5, -93);
      g.lineWidth = 1;
      g.strokeStyle = FLESH_S;
      g.stroke();
    }
    g.fillStyle = "#2a0608";
    g.fillRect(-2.5, -88, 5, 1.4);
  }
}

export function monsterFrames(S: number, id: MonsterId): Spr[] {
  const b = MONSTER_BOX[id];
  return [0, 1, 2, 3].map((f) =>
    bake(S, b.w, b.h, b.w / 2, b.h - 3, (g) => {
      monsterArt(g, id, f);
      // darker towards the ground, as if the dark it came out of still clings to it, with veins showing through
      g.globalCompositeOperation = "source-atop";
      const sh = g.createLinearGradient(0, -b.h, 0, 0);
      sh.addColorStop(0, "rgba(30,0,20,0.05)");
      sh.addColorStop(0.55, "rgba(30,0,20,0.25)");
      sh.addColorStop(1, "rgba(10,0,8,0.6)");
      g.fillStyle = sh;
      g.fillRect(-b.w / 2, -b.h, b.w, b.h + 4);
      const r = rnd(id.length * 13 + 5);
      g.strokeStyle = "rgba(90,10,30,0.45)";
      g.lineWidth = 0.7;
      for (let v = 0; v < 7; v++) {
        let vx = (r() - 0.5) * b.w * 0.6;
        let vy = -b.h * (0.25 + r() * 0.5);
        g.beginPath();
        g.moveTo(vx, vy);
        for (let s2 = 0; s2 < 4; s2++) {
          vx += (r() - 0.5) * 8;
          vy += (r() - 0.3) * 7;
          g.lineTo(vx, vy);
        }
        g.stroke();
      }
      g.globalCompositeOperation = "source-over";
    }),
  );
}

/* ======================================================================
 * The land: one set per biome
 * ==================================================================== */

export type Land = {
  ground: Spr;
  tree: Spr[];
  boulder: Spr[];
  menhir: Spr;
  stone: Spr;
  log: Spr;
  thorns: Spr;
  arch: Spr;
  pit: Spr[];
};

export const GROUND_TILE = 160;

function groundTile(S: number, b: Biome): Spr {
  const T = GROUND_TILE;
  return bake(S, T, T, 0, 0, (g) => {
    g.fillStyle = b.ground[0];
    g.fillRect(0, 0, T, T);
    const r = rnd(b.from + 7);
    const wrap = (fn: (x: number, y: number) => void, x: number, y: number, pad: number) => {
      for (const dx of [-T, 0, T])
        for (const dy of [-T, 0, T]) if (x + dx > -pad && x + dx < T + pad && y + dy > -pad && y + dy < T + pad) fn(x + dx, y + dy);
    };
    for (let i = 0; i < 14; i++) {
      const x = r() * T;
      const y = r() * T;
      const rx = 18 + r() * 34;
      const ry = 10 + r() * 18;
      wrap((xx, yy) => {
        ell(g, xx, yy, rx, ry);
        g.fillStyle = alpha(b.ground[1], 0.35);
        g.fill();
      }, x, y, 40);
    }
    if (b.foliage === 0)
      for (let i = 0; i < 6; i++) {
        const x = r() * T;
        const y = r() * T;
        const pts: [number, number][] = [[x, y]];
        for (let k = 0; k < 4; k++) pts.push([pts[k][0] + (r() - 0.5) * 14, pts[k][1] + (r() - 0.5) * 14]);
        g.strokeStyle = "rgba(20,18,14,0.45)";
        g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(pts[0][0], pts[0][1]);
        for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
        g.stroke();
      }
    for (let i = 0; i < 90; i++) {
      const x = r() * T;
      const y = r() * T;
      const c = b.specks[i % b.specks.length];
      wrap((xx, yy) => {
        ell(g, xx, yy, 0.6 + r() * 0.9, 0.5 + r() * 0.5);
        g.fillStyle = c;
        g.fill();
      }, x, y, 3);
    }
    // grass tufts
    for (let i = 0; i < (b.foliage === 0 ? 14 : 40); i++) {
      const x = r() * T;
      const y = r() * T;
      wrap((xx, yy) => {
        g.strokeStyle = i % 3 ? b.grass : shade(b.grass, 0.15);
        g.lineWidth = 0.8;
        g.beginPath();
        for (const d of [-1.6, 0, 1.6]) {
          g.moveTo(xx, yy);
          g.quadraticCurveTo(xx + d, yy - 2, xx + d * 1.5, yy - 3.5 - Math.abs(d) * 0.3);
        }
        g.stroke();
      }, x, y, 5);
    }
    for (let i = 0; i < (b.flowers.length ? 26 : 0); i++) {
      const x = r() * T;
      const y = r() * T;
      const c = b.flowers[i % b.flowers.length];
      wrap((xx, yy) => {
        for (let k = 0; k < 5; k++) {
          ell(g, xx + Math.cos((k / 5) * TAU) * 1.2, yy + Math.sin((k / 5) * TAU) * 1.2, 0.9, 0.9);
          g.fillStyle = c;
          g.fill();
        }
        ell(g, xx, yy, 0.6, 0.6);
        g.fillStyle = "#ffe46a";
        g.fill();
      }, x, y, 4);
    }
  });
}

function tree(S: number, b: Biome, v: number): Spr {
  return bake(S, 76, 112, 38, 104, (g) => {
    const r = rnd(v * 977 + b.from + 3);
    // shadow on the ground
    ell(g, 3, 1, 20, 6);
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fill();
    // trunk with roots
    const tr = b.trunk;
    g.beginPath();
    g.moveTo(-11, 1);
    g.quadraticCurveTo(-6, -2, -6, -10);
    g.lineTo(-4.5, -40);
    g.lineTo(4.5, -40);
    g.lineTo(6, -10);
    g.quadraticCurveTo(6, -2, 11, 1);
    g.quadraticCurveTo(0, -2, -11, 1);
    paint(g, tr, 1.2);
    g.strokeStyle = shade(tr, -0.3);
    g.lineWidth = 0.7;
    for (const x of [-1.6, 1.2]) {
      g.beginPath();
      g.moveTo(x, -4);
      g.lineTo(x + 0.6, -36);
      g.stroke();
    }
    if (b.foliage === 0) {
      // dead, twisted branches
      const branch = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
        const x2 = x + Math.cos(ang) * len;
        const y2 = y + Math.sin(ang) * len;
        line(g, [[x, y], [(x + x2) / 2 + (r() - 0.5) * 4, (y + y2) / 2], [x2, y2]], w, b.leaves[0]);
        if (depth > 0) {
          branch(x2, y2, ang - 0.5 - r() * 0.3, len * 0.65, w * 0.65, depth - 1);
          branch(x2, y2, ang + 0.4 + r() * 0.3, len * 0.6, w * 0.6, depth - 1);
        }
      };
      branch(0, -42, -Math.PI / 2 - 0.5, 20 + v * 2, 3.4, 2);
      branch(0, -40, -Math.PI / 2 + 0.55, 19, 3.2, 2);
      branch(0, -44, -Math.PI / 2 + 0.05, 16, 2.6, 1);
      // hanging grey moss
      g.strokeStyle = "rgba(120,120,100,0.6)";
      g.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        const x = -14 + r() * 28;
        g.beginPath();
        g.moveTo(x, -62 + r() * 8);
        g.lineTo(x + 0.5, -50 + r() * 8);
        g.stroke();
      }
      return;
    }
    const [l1, l2] = b.leaves;
    const leaf = b.foliage === 3 ? "#4aa040" : l1;
    const blobs: [number, number, number][] = [];
    const n = b.foliage === 1 ? 4 : 8;
    const size = b.foliage === 1 ? 0.7 : 1;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.5;
      blobs.push([Math.cos(a) * 17 * size, -60 + Math.sin(a) * 12 * size - r() * 4, (12 + r() * 6) * size]);
    }
    blobs.push([0, -64, 17 * size]);
    if (b.foliage === 1) {
      line(g, [[0, -42], [-10, -56]], 2.4, tr);
      line(g, [[0, -42], [11, -58]], 2.4, tr);
    }
    // outline pass, then fills, then light on top
    for (const [x, y, rr] of blobs) {
      ell(g, x, y, rr + 1.1, rr * 0.9 + 1.1);
      g.fillStyle = OL;
      g.fill();
    }
    for (const [x, y, rr] of blobs) {
      ell(g, x, y, rr, rr * 0.9);
      g.fillStyle = shade(leaf, -0.18);
      g.fill();
    }
    for (const [x, y, rr] of blobs) {
      ell(g, x - 2, y - 3, rr * 0.75, rr * 0.62);
      g.fillStyle = leaf;
      g.fill();
    }
    for (const [x, y, rr] of blobs.slice(0, 5)) {
      ell(g, x - 4, y - 5, rr * 0.35, rr * 0.25);
      g.fillStyle = shade(leaf, 0.3);
      g.fill();
    }
    if (b.foliage === 1)
      for (let i = 0; i < 6; i++) {
        ell(g, -16 + r() * 32, -74 + r() * 20, 2.5, 2);
        g.fillStyle = l2;
        g.fill();
      }
    if (b.foliage === 3) {
      for (let i = 0; i < 34; i++) {
        ell(g, -20 + r() * 40, -84 + r() * 30, 1.2, 1.1);
        g.fillStyle = i % 3 ? l2 : "#ffffff";
        g.fill();
      }
      for (let i = 0; i < 6; i++) {
        ell(g, -14 + r() * 30, -2 + r() * 5, 0.9, 0.6);
        g.fillStyle = l2;
        g.fill();
      }
    }
  });
}

function rock(g: G, b: Biome, pts: [number, number][], seed: number) {
  const r = rnd(seed);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= pts.length; i++) {
    const p = pts[i % pts.length];
    const q = pts[(i - 1) % pts.length];
    g.quadraticCurveTo(q[0], q[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
  }
  g.closePath();
  paint(g, b.rock, 1.3);
  g.save();
  g.clip();
  // light from the upper left, shadow on the right
  const gr = g.createLinearGradient(-30, -60, 30, 0);
  gr.addColorStop(0, "rgba(255,255,240,0.28)");
  gr.addColorStop(0.55, "rgba(255,255,255,0)");
  gr.addColorStop(1, "rgba(0,0,0,0.3)");
  g.fillStyle = gr;
  g.fillRect(-60, -120, 120, 130);
  g.strokeStyle = shade(b.rock, -0.35);
  g.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    const x = -14 + r() * 28;
    const y = -30 + r() * 20;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + (r() - 0.5) * 10, y + 6 + r() * 6);
    g.lineTo(x + (r() - 0.5) * 12, y + 12 + r() * 4);
    g.stroke();
  }
  if (b.foliage >= 1)
    for (let i = 0; i < 4; i++) {
      ell(g, -16 + r() * 22, -36 + r() * 10, 5 + r() * 5, 2.5 + r() * 2);
      g.fillStyle = alpha(b.moss, 0.85);
      g.fill();
    }
  g.restore();
}

/** a pit of green fire that, land by land, turns back into the well it once was */
function pitFrame(S: number, b: Biome, f: number): Spr {
  const stage = b.well ?? 0;
  return bake(S, 84, 118, 42, 96, (g) => {
    const t = f / 6;
    const water = stage >= 3;
    // the ground round it: scorched, or moss again
    ell(g, 0, -8, 36, 15);
    g.fillStyle = water ? "rgba(70,120,50,0.5)" : "rgba(10,14,8,0.55)";
    g.fill();
    if (!water) {
      g.strokeStyle = alpha(b.glow, 0.55 * (1 - stage * 0.3));
      g.lineWidth = 0.9;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.3;
        g.beginPath();
        g.moveTo(Math.cos(a) * 24, -8 + Math.sin(a) * 10);
        g.lineTo(Math.cos(a + 0.12) * 34, -8 + Math.sin(a + 0.12) * 14);
        g.stroke();
      }
    }
    // the hole: lit from inside, or full of clear water
    ell(g, 0, -8, 27, 11.5);
    paint(g, water ? "#1d3a40" : "#0a1406", 1.4);
    if (water) {
      const wg = g.createRadialGradient(-6, -10, 1, 0, -8, 26);
      wg.addColorStop(0, "#e8fdff");
      wg.addColorStop(0.35, "#7fd6e0");
      wg.addColorStop(1, "#2a7a8a");
      ell(g, 0, -8, 25, 10);
      g.fillStyle = wg;
      g.fill();
      // the shine, moving a little
      g.strokeStyle = "rgba(255,255,255,0.7)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(-6 + Math.sin(t * TAU) * 2, -11, 9, 2.2, -0.1, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    } else {
      const k = [1, 0.75, 0.45][stage] ?? 1;
      const gr = g.createRadialGradient(0, -7, 1, 0, -8, 26);
      gr.addColorStop(0, alpha("#ffffff", k));
      gr.addColorStop(0.2, alpha(shade(b.glow, 0.5), k));
      gr.addColorStop(0.55, alpha(b.glow, k));
      gr.addColorStop(1, alpha(b.glow, 0));
      ell(g, 0, -8, 25, 10);
      g.fillStyle = gr;
      g.fill();
    }
    const stonesRing = (front: boolean) => {
      // the stones of the old well: the first few, then a broken ring, then the whole of it
      const stones = [0, 5, 10, 16][stage] ?? 0;
      const gaps = stage === 1 ? [1, 2, 4, 6, 7, 9, 11, 12, 14, 15] : stage === 2 ? [3, 8, 12] : [];
      const r = rnd(7);
      for (let i = 0; i < 16 && stones; i++) {
        if (gaps.includes(i)) continue;
        if (!water && (Math.sin((i / 16) * TAU) > 0) !== front) continue;
        const a = (i / 16) * TAU;
        const sx = Math.cos(a) * 29;
        const sy = -8 + Math.sin(a) * 12.5;
        const w = 5 + r() * 2;
        ell(g, sx, sy, w, 3.6 + r());
        paint(g, stage >= 3 ? "#9a968a" : r() < 0.5 ? "#6e6a60" : "#5e5a52", 1.1);
      }
    };
    if (water) {
      stonesRing(true);
      return;
    }
    stonesRing(false);
    // a soft halo
    g.globalCompositeOperation = "lighter";
    const hk = [0.35, 0.25, 0.12][stage] ?? 0.35;
    const halo = g.createRadialGradient(0, -20, 4, 0, -20, 42);
    halo.addColorStop(0, alpha(b.glow, hk));
    halo.addColorStop(1, alpha(b.glow, 0));
    g.fillStyle = halo;
    g.fillRect(-42, -96, 84, 104);
    // the flames: tall in the rot, lower land by land, only embers at the last
    const tall = [1, 0.55, 0.2][stage] ?? 1;
    const rr = rnd(11);
    for (let i = 0; i < 9; i++) {
      const x = -20 + i * 5 + (rr() - 0.5) * 3;
      const ph = t * TAU + i * 1.7;
      const hgt = (36 + Math.sin(ph) * 12 + rr() * 18 - Math.abs(x) * 0.7) * tall;
      const w = 5 + rr() * 3;
      const sway = Math.sin(ph * 1.3) * 4;
      const fg = g.createLinearGradient(0, -8, 0, -8 - hgt);
      fg.addColorStop(0, alpha(shade(b.glow, 0.6), 0.95));
      fg.addColorStop(0.4, alpha(b.glow, 0.7));
      fg.addColorStop(1, alpha(b.glow, 0));
      g.beginPath();
      g.moveTo(x - w, -8);
      g.bezierCurveTo(x - w, -8 - hgt * 0.4, x + sway - 1, -8 - hgt * 0.7, x + sway, -8 - hgt);
      g.bezierCurveTo(x + sway + 1, -8 - hgt * 0.7, x + w, -8 - hgt * 0.4, x + w, -8);
      g.closePath();
      g.fillStyle = fg;
      g.fill();
    }
    // embers
    for (let i = 0; i < 8; i++) {
      const y = -10 - ((t * 80 + i * 23) % (80 * tall + 10));
      const x = -18 + ((i * 37) % 36) + Math.sin(t * TAU + i) * 3;
      ell(g, x, y, 0.9, 0.9);
      g.fillStyle = alpha(shade(b.glow, 0.5), Math.max(0, 1 - (-y - 10) / (80 * tall + 10)));
      g.fill();
    }
    g.globalCompositeOperation = "source-over";
    stonesRing(true);
  });
}

export function landSet(S: number, b: Biome): Land {
  return {
    ground: groundTile(S, b),
    tree: [0, 1, 2].map((v) => tree(S, b, v)),
    boulder: [0, 1].map((v) =>
      bake(S, 70, 60, 35, 52, (g) => {
        ell(g, 4, 1, 30, 7);
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.fill();
        rock(g, b, v ? [[-28, 0], [-30, -20], [-18, -40], [2, -46], [22, -36], [30, -14], [26, 0]] : [[-26, 0], [-24, -26], [-8, -44], [14, -40], [28, -22], [28, 0]], v + 5);
      }),
    ),
    menhir: bake(S, 40, 92, 20, 86, (g) => {
      ell(g, 6, 1, 14, 4.5);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fill();
      rock(g, b, [[-11, 0], [-12, -40], [-8, -76], [2, -82], [9, -70], [12, -30], [11, 0]], 9);
      // a carved spiral that glows in the rot
      g.strokeStyle = b.foliage === 0 ? alpha(b.glow, 0.7) : alpha(shade(b.rock, -0.4), 0.8);
      g.lineWidth = 1.1;
      g.beginPath();
      for (let a = 0; a < 3 * TAU; a += 0.2) g.lineTo(Math.cos(a) * a * 0.55, -44 + Math.sin(a) * a * 0.55);
      g.stroke();
    }),
    stone: bake(S, 30, 24, 15, 18, (g) => {
      ell(g, 2, 1, 12, 3.5);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fill();
      rock(g, b, [[-11, 0], [-10, -9], [-2, -14], [8, -11], [11, 0]], 4);
    }),
    log: bake(S, 112, 34, 56, 24, (g) => {
      ell(g, 2, 2, 50, 5);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fill();
      const tr = shade(b.trunk, 0.1);
      g.beginPath();
      g.moveTo(-46, -14);
      g.lineTo(46, -14);
      g.quadraticCurveTo(51, -7, 46, 0);
      g.lineTo(-46, 0);
      g.closePath();
      paint(g, tr, 1.2);
      g.fillStyle = shade(tr, 0.2);
      g.fillRect(-46, -13, 92, 3);
      g.strokeStyle = shade(tr, -0.35);
      g.lineWidth = 0.7;
      for (let x = -40; x < 42; x += 9) {
        g.beginPath();
        g.moveTo(x, -9);
        g.lineTo(x + 6, -8);
        g.stroke();
      }
      ell(g, -46, -7, 4.5, 7);
      paint(g, "#c8a478", 1.1);
      ell(g, -46, -7, 2.4, 4);
      g.strokeStyle = "#8a6a44";
      g.lineWidth = 0.6;
      g.stroke();
      // a broken branch stub
      line(g, [[18, -13], [22, -22], [26, -24]], 2.4, tr);
      if (b.foliage >= 1)
        for (let x = -30; x < 40; x += 14) {
          ell(g, x, -13, 5, 1.8);
          g.fillStyle = alpha(b.moss, 0.9);
          g.fill();
        }
    }),
    thorns: bake(S, 104, 34, 52, 24, (g) => {
      ell(g, 0, 2, 46, 5);
      g.fillStyle = "rgba(0,0,0,0.3)";
      g.fill();
      const r = rnd(21);
      const c = b.foliage === 0 ? "#3a3026" : "#2f4a26";
      for (let i = 0; i < 18; i++) {
        const x0 = -42 + r() * 84;
        g.beginPath();
        g.moveTo(x0, 0);
        g.bezierCurveTo(x0 + (r() - 0.5) * 20, -10 - r() * 6, x0 + (r() - 0.5) * 24, -14, x0 + (r() - 0.5) * 30, -4 - r() * 8);
        g.lineWidth = 2.6;
        g.strokeStyle = OL;
        g.stroke();
        g.lineWidth = 1.5;
        g.strokeStyle = c;
        g.stroke();
      }
      g.fillStyle = "#d8d0b8";
      for (let i = 0; i < 26; i++) {
        const x = -42 + r() * 84;
        const y = -2 - r() * 13;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 1.2, y - 2.2);
        g.lineTo(x + 0.6, y);
        g.fill();
      }
      for (let i = 0; i < 8; i++) {
        ell(g, -38 + r() * 76, -4 - r() * 10, 1.3, 1.3);
        g.fillStyle = b.foliage === 3 ? "#ff9ab4" : "#a8202a";
        g.fill();
      }
    }),
    arch: bake(S, 140, 118, 70, 104, (g) => {
      // the shadow of the lintel on the ground: that is where you duck
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.fillRect(-34, -6, 68, 10);
      for (const s of [-1, 1]) {
        ell(g, s * 46 + 4, 1, 12, 4);
        g.fillStyle = "rgba(0,0,0,0.3)";
        g.fill();
        g.save();
        g.translate(s * 46, 0);
        rock(g, b, [[-10, 0], [-11, -40], [-9, -72], [9, -74], [11, -38], [10, 0]], 13 + s);
        g.restore();
      }
      g.save();
      g.translate(0, -76);
      rock(g, b, [[-62, 6], [-60, -8], [-30, -18], [0, -21], [30, -18], [60, -8], [62, 6], [30, 2], [0, 0], [-30, 2]], 17);
      g.restore();
      g.strokeStyle = shade(b.rock, -0.45);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-6, -95);
      g.lineTo(-4, -76);
      g.moveTo(6, -95);
      g.lineTo(4, -76);
      g.stroke();
    }),
    pit: [0, 1, 2, 3, 4, 5].map((f) => pitFrame(S, b, f)),
  };
}

export function allLands(S: number): Land[] {
  return BIOMES.map((b) => landSet(S, b));
}

/* ======================================================================
 * Things to pick up, companions, small things
 * ==================================================================== */

export type Picks = Record<"seed" | "bow" | "sword" | "trap" | "bark" | "heart" | "hound" | "raven" | "doe", Spr>;

/** icons for the HUD are drawn without the soft light around them */
let glowOn = true;

function glow(g: G, r: number, c = "rgba(255,240,160,0.35)") {
  if (!glowOn) return;
  const gr = g.createRadialGradient(0, -r, 1, 0, -r, r);
  gr.addColorStop(0, c);
  gr.addColorStop(1, "rgba(255,240,160,0)");
  g.fillStyle = gr;
  g.fillRect(-r, -2 * r, 2 * r, 2 * r);
}

export function companionArt(g: G, id: "hound" | "raven" | "doe", f: number, sitting: boolean) {
  const a = Math.sin((f / 2) * TAU);
  if (id === "hound") {
    const c = "#6e6e78";
    if (!sitting) for (const s of [-1, 1]) line(g, [[s * 4, -12], [s * 4.5, -6], [s * 4, -1 + (s * a > 0 ? -2 : 0)]], 2.4, shade(c, -0.25));
    ell(g, 0, -15, 7, 8);
    paint(g, c, 1.1);
    ell(g, 0, -11, 5, 4);
    paint(g, "#9a9aa4", 0);
    g.beginPath();
    g.moveTo(-5, -20);
    g.bezierCurveTo(-6, -14, -3, -10, 0, -9);
    g.bezierCurveTo(3, -10, 6, -14, 5, -20);
    g.bezierCurveTo(3, -24, -3, -24, -5, -20);
    paint(g, c, 1);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 3, -22);
      g.lineTo(s * 6.5, -27);
      g.lineTo(s * 6, -19);
      g.closePath();
      paint(g, c, 0.9);
      ell(g, s * 2, -17, 0.9, 0.9);
      paint(g, "#f0c84a", 0);
    }
    ell(g, 0, -10, 1.5, 1);
    paint(g, "#111", 0);
  } else if (id === "raven") {
    const c = "#1c1c28";
    const up = sitting ? 0 : a;
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * 2, -14);
      g.quadraticCurveTo(s * 8, -20 - up * 6, s * 14, -14 - up * 8);
      g.quadraticCurveTo(s * 8, -12 - up * 3, s * 2, -10);
      paint(g, c, 0.9);
    }
    ell(g, 0, -12, 3, 5);
    paint(g, c, 1);
    ell(g, 0, -18, 2.6, 2.6);
    paint(g, c, 1);
    g.beginPath();
    g.moveTo(-0.8, -17);
    g.lineTo(0, -13.5);
    g.lineTo(0.8, -17);
    paint(g, "#3a3a44", 0.5);
    for (const s of [-1, 1]) {
      ell(g, s * 1.2, -18.6, 0.5, 0.5);
      paint(g, "#f0c84a", 0);
    }
  } else {
    const c = "#c08a5a";
    if (!sitting) for (const s of [-1, 1]) line(g, [[s * 3, -12], [s * 3.5, -6], [s * 3, -1 + (s * a > 0 ? -2.5 : 0)]], 1.8, shade(c, -0.25));
    ell(g, 0, -15, 6, 8);
    paint(g, c, 1.1);
    for (const [x, y] of [[-2, -17], [2.5, -15], [-1, -12], [1.5, -19]]) {
      ell(g, x, y, 0.8, 0.8);
      paint(g, "#f6f1e4", 0);
    }
    g.beginPath();
    g.moveTo(-3.5, -22);
    g.bezierCurveTo(-4, -17, -2, -14, 0, -13);
    g.bezierCurveTo(2, -14, 4, -17, 3.5, -22);
    g.bezierCurveTo(2, -25, -2, -25, -3.5, -22);
    paint(g, c, 1);
    ell(g, 0, -14, 1.6, 1.2);
    paint(g, "#2a1a10", 0);
    for (const s of [-1, 1]) {
      ell(g, s * 5, -23, 1.6, 3, s * 0.9);
      paint(g, c, 0.8);
      ell(g, s * 1.6, -19, 0.8, 1);
      paint(g, "#111", 0);
    }
  }
}

/** how much bigger things lying on the ground are drawn than the art (big enough to see at speed) */
export const PICK_SCALE = 1.8;

export function pickSprites(S: number, big = true): Picks {
  const box = (fn: (g: G) => void, w = 30, h = 30, k = big ? PICK_SCALE : 1) =>
    bake(S, w * k, h * k, (w / 2) * k, (h - 3) * k, (g) => {
      g.scale(k, k);
      fn(g);
    });
  const small = big ? 1.4 : 1;
  return {
    seed: box((g) => {
      glow(g, 10);
      ell(g, 0, -6, 3.4, 4.6);
      const gr = g.createLinearGradient(-3, -10, 3, -2);
      gr.addColorStop(0, "#fff4b0");
      gr.addColorStop(1, "#d89a2a");
      g.fillStyle = gr;
      g.fill();
      g.lineWidth = 0.9;
      g.strokeStyle = OL;
      g.stroke();
      line(g, [[0, -10], [0.5, -13], [2.5, -14]], 1, "#6ac04a");
    }, 20, 22, small),
    bow: box((g) => {
      glow(g, 14);
      g.beginPath();
      g.moveTo(-3, -24);
      g.quadraticCurveTo(-12, -13, -3, -2);
      g.lineWidth = 3.4;
      g.strokeStyle = OL;
      g.stroke();
      g.lineWidth = 2.2;
      g.strokeStyle = "#a06a30";
      g.stroke();
      g.beginPath();
      g.moveTo(-3, -24);
      g.lineTo(-3, -2);
      g.lineWidth = 0.6;
      g.strokeStyle = "#f6f1e4";
      g.stroke();
      line(g, [[-9, -13], [9, -13]], 1.2, "#e8dcc0");
      g.beginPath();
      g.moveTo(9, -15.5);
      g.lineTo(13, -13);
      g.lineTo(9, -10.5);
      paint(g, "#d8dce4", 0.8);
      line(g, [[-10, -15], [-8, -13], [-10, -11]], 1, "#d0303a", false);
    }),
    sword: box((g) => {
      glow(g, 14);
      g.save();
      g.translate(0, -13);
      g.rotate(-0.75);
      g.beginPath();
      g.moveTo(-1.6, -12);
      g.lineTo(0, -16);
      g.lineTo(1.6, -12);
      g.lineTo(1.6, 5);
      g.lineTo(-1.6, 5);
      g.closePath();
      paint(g, "#e4e8f0", 0.9);
      g.fillStyle = "#ffffff";
      g.fillRect(-0.4, -12, 0.8, 16);
      line(g, [[-5, 5.5], [5, 5.5]], 1.8, "#f0c85a");
      line(g, [[0, 6.5], [0, 11]], 2, "#5a3a22");
      g.restore();
    }),
    trap: box((g) => {
      glow(g, 13, "rgba(160,255,120,0.25)");
      ell(g, 0, -6, 11, 5);
      paint(g, "#5a3a22", 1.1);
      ell(g, 0, -6, 7.5, 3);
      paint(g, "#1a1008", 0);
      g.fillStyle = "#d8c8a0";
      for (let i = -4; i <= 4; i++) {
        g.beginPath();
        g.moveTo(i * 2 - 0.8, -8.5);
        g.lineTo(i * 2, -12 - (i % 2));
        g.lineTo(i * 2 + 0.8, -8.5);
        g.fill();
      }
    }, 30, 22),
    bark: box((g) => {
      glow(g, 13);
      g.beginPath();
      g.moveTo(-8, -22);
      g.lineTo(8, -22);
      g.lineTo(8, -10);
      g.quadraticCurveTo(7, -3, 0, -1);
      g.quadraticCurveTo(-7, -3, -8, -10);
      g.closePath();
      paint(g, "#8a6440", 1.2);
      g.strokeStyle = "#5a3e26";
      g.lineWidth = 1;
      for (const x of [-4, 0, 4]) {
        g.beginPath();
        g.moveTo(x, -20);
        g.lineTo(x + 0.6, -5);
        g.stroke();
      }
      ell(g, 2, -13, 2, 1.4, 0.4);
      paint(g, "#8ae05a", 0.6);
    }),
    heart: box((g) => {
      glow(g, 12, "rgba(255,120,140,0.3)");
      heartShape(g, "#e8304a", "#ffb0c0");
    }, 26, 24),
    hound: box((g) => {
      glow(g, 16, "rgba(200,220,255,0.3)");
      companionArt(g, "hound", 0, true);
    }, 34, 34, small),
    raven: box((g) => {
      glow(g, 16, "rgba(200,220,255,0.3)");
      companionArt(g, "raven", 0, true);
    }, 34, 34, small),
    doe: box((g) => {
      glow(g, 16, "rgba(200,220,255,0.3)");
      companionArt(g, "doe", 0, true);
    }, 34, 34, small),
  };
}

function heartShape(g: G, fill: string, shine: string, edge = OL) {
  g.beginPath();
  g.moveTo(0, -3);
  g.bezierCurveTo(-11, -10, -7, -20, 0, -15);
  g.bezierCurveTo(7, -20, 11, -10, 0, -3);
  paint(g, fill, 1.1, edge);
  ell(g, -3.5, -14, 1.6, 1.1, -0.5);
  paint(g, shine, 0);
}

export type IconId = Exclude<keyof Picks, "seed"> | "heartEmpty";

/** the same pictures as on the ground, as image URLs for the HUD and the touch buttons */
export function iconUrls(): Record<IconId, string> {
  glowOn = false;
  try {
    const p = pickSprites(3, false);
    const out = {} as Record<IconId, string>;
    for (const k of Object.keys(p) as (keyof Picks)[]) if (k !== "seed") out[k] = p[k].c.toDataURL();
    out.heartEmpty = bake(3, 26, 24, 13, 21, (g) => heartShape(g, "#2a2022", "#2a2022", "#9a8a8c")).c.toDataURL();
    return out;
  } finally {
    glowOn = true;
  }
}

export function companionRun(S: number, id: "hound" | "raven" | "doe"): Spr[] {
  return [0, 1].map((f) => bake(S, 34, 34, 17, 31, (g) => companionArt(g, id, f, false)));
}

export function letterStone(S: number, ch: string): Spr {
  const k = 1.5;
  return bake(S, 30 * k, 34 * k, 15 * k, 30 * k, (g) => {
    g.scale(k, k);
    glow(g, 15);
    ell(g, 0, -10, 10, 10);
    paint(g, "#8a8478", 1.2);
    ell(g, -2, -13, 6, 5);
    g.fillStyle = "rgba(255,255,255,0.15)";
    g.fill();
    g.fillStyle = "#fff4a0";
    g.font = "bold 13px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(ch, 0, -9.5);
  });
}

export function trapSet(S: number): Spr {
  return bake(S, 30, 20, 15, 14, (g) => {
    ell(g, 0, -4, 11, 5);
    paint(g, "#5a3a22", 1.1);
    ell(g, 0, -4, 7.5, 3);
    paint(g, "#1a1008", 0);
    g.fillStyle = "#d8c8a0";
    for (let i = -4; i <= 4; i++) {
      g.beginPath();
      g.moveTo(i * 2 - 0.8, -6.5);
      g.lineTo(i * 2, -10 - (i % 2));
      g.lineTo(i * 2 + 0.8, -6.5);
      g.fill();
    }
  });
}
