/**
 * Pictures for Brigid's memories: small painted scenes in the manner of an old ballad, built from a handful of
 * parts (sky, hills, trees, stones, houses, figures) and drawn into a canvas, then coarsened into pixels.
 * Nothing is loaded: every scene is a few lines of data and code.
 */

type G = CanvasRenderingContext2D;
const W = 320;
const H = 180;
const TAU = Math.PI * 2;

function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/* ---------------- the parts ---------------- */

function sky(g: G, stops: [number, string][]) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  for (const [k, c] of stops) gr.addColorStop(k, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}
function stars(g: G, n: number, seed: number, maxY = 0.5) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    g.fillStyle = `rgba(230,236,245,${0.25 + r() * 0.6})`;
    g.fillRect(r() * W, r() * H * maxY, r() < 0.12 ? 2 : 1, 1);
  }
}
function moon(g: G, x: number, y: number, r: number, bg: string, phase = 0.55) {
  glow(g, x, y, r * 3, "240,236,210", 0.18);
  g.fillStyle = "#f2ecd2";
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  if (phase < 1) {
    g.fillStyle = bg;
    g.beginPath();
    g.arc(x + r * phase * 0.9, y - r * 0.2, r * 0.95, 0, TAU);
    g.fill();
  }
}
function glow(g: G, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
function hills(g: G, y: number, amp: number, colour: string, seed: number) {
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin(x / 46 + seed) * amp + Math.sin(x / 19 + seed * 2.3) * amp * 0.3);
  g.lineTo(W, H);
  g.fill();
}
function sea(g: G, y: number, colour: string, shine: string) {
  g.fillStyle = colour;
  g.fillRect(0, y, W, 8);
  g.fillStyle = shine;
  for (let x = 0; x < W; x += 9) g.fillRect(x + ((x / 9) % 2) * 4, y + 1 + ((x / 9) % 3), 4, 1);
}
function mist(g: G, y: number, a: number, rgb = "190,200,195") {
  const gr = g.createLinearGradient(0, y - 30, 0, H);
  gr.addColorStop(0, `rgba(${rgb},0)`);
  gr.addColorStop(0.5, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},${a * 0.6})`);
  g.fillStyle = gr;
  g.fillRect(0, y - 30, W, H - y + 30);
}
function rain(g: G, n: number, seed: number, rgba = "rgba(170,180,190,0.35)") {
  const r = rng(seed);
  g.strokeStyle = rgba;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const x = r() * (W + 40);
    const y = r() * H;
    g.moveTo(x, y);
    g.lineTo(x - 3, y + 9);
  }
  g.stroke();
}
function petals(g: G, n: number, seed: number, colour = "#f4d8e0", y0 = 0, y1 = H) {
  const r = rng(seed);
  g.fillStyle = colour;
  for (let i = 0; i < n; i++) g.fillRect(r() * W, y0 + r() * (y1 - y0), 2, 1 + (r() < 0.4 ? 1 : 0));
}
function grass(g: G, y: number, colour: string, seed: number, dense = 60) {
  const r = rng(seed);
  g.strokeStyle = colour;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < dense; i++) {
    const x = r() * W;
    const yy = y + r() * (H - y);
    g.moveTo(x, yy);
    g.lineTo(x + (r() - 0.5) * 3, yy - 3 - r() * 4);
  }
  g.stroke();
}

type TreeKind = "oak" | "dead" | "blossom" | "apple" | "black" | "pine";
function tree(g: G, x: number, y: number, h: number, kind: TreeKind, trunk = "#1a1410", leaf = "#24321e", seed = 1) {
  const r = rng(seed);
  g.strokeStyle = trunk;
  g.lineCap = "round";
  g.lineWidth = Math.max(2, h * 0.07);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + (r() - 0.5) * 3, y - h * 0.62);
  g.stroke();
  if (kind === "pine") {
    g.fillStyle = leaf;
    for (let k = 0; k < 4; k++) {
      const yy = y - h * (0.25 + k * 0.2);
      const w = h * (0.3 - k * 0.06);
      g.beginPath();
      g.moveTo(x - w, yy);
      g.lineTo(x, yy - h * 0.28);
      g.lineTo(x + w, yy);
      g.fill();
    }
    return;
  }
  // branches
  g.lineWidth = Math.max(1, h * 0.035);
  const tips: [number, number][] = [];
  for (let k = 0; k < 6; k++) {
    const by = y - h * (0.4 + r() * 0.25);
    const dir = k % 2 ? 1 : -1;
    const tx = x + dir * h * (0.18 + r() * 0.25);
    const ty = by - h * (0.15 + r() * 0.25);
    g.beginPath();
    g.moveTo(x, by);
    g.quadraticCurveTo(x + dir * h * 0.08, by - h * 0.1, tx, ty);
    g.stroke();
    tips.push([tx, ty]);
  }
  if (kind === "dead" || kind === "black") {
    if (kind === "black")
      for (const [tx, ty] of tips) {
        g.fillStyle = "#0a0808";
        g.beginPath();
        g.arc(tx, ty + 4, 2.4, 0, TAU);
        g.fill();
      }
    return;
  }
  const col = kind === "blossom" ? "#e8c8d2" : leaf;
  g.fillStyle = col;
  // the crown: many small clumps, not one ball
  for (const [tx, ty] of tips)
    for (let k = 0; k < 7; k++) {
      g.beginPath();
      g.arc(tx + (r() - 0.5) * h * 0.24, ty + (r() - 0.5) * h * 0.18, h * (0.035 + r() * 0.04), 0, TAU);
      g.fill();
    }
  for (let k = 0; k < 10; k++) {
    g.beginPath();
    g.arc(x + (r() - 0.5) * h * 0.4, y - h * (0.62 + r() * 0.22), h * (0.04 + r() * 0.04), 0, TAU);
    g.fill();
  }
  if (kind === "apple")
    for (let k = 0; k < 7; k++) {
      g.fillStyle = "#b8343a";
      g.fillRect(x + (r() - 0.5) * h * 0.6, y - h * (0.55 + r() * 0.3), 2, 2);
    }
}

function house(g: G, x: number, y: number, w: number, h: number, colour: string, lit: string | null, door = false) {
  g.fillStyle = colour;
  g.fillRect(x, y - h, w, h);
  g.beginPath();
  g.moveTo(x - 4, y - h + 1);
  g.lineTo(x + w / 2, y - h - h * 0.6);
  g.lineTo(x + w + 4, y - h + 1);
  g.fill();
  if (lit) {
    const wx = x + w * 0.62;
    const wy = y - h * 0.62;
    glow(g, wx + 3, wy + 3, 18, lit, 0.35);
    g.fillStyle = `rgb(${lit})`;
    g.fillRect(wx, wy, 6, 7);
    if (door) {
      glow(g, x + w * 0.25 + 3, y - 6, 16, lit, 0.3);
      g.fillRect(x + w * 0.2, y - 12, 7, 12);
    }
  }
}
/** a standing stone, with a spiral cut into it */
function stone(g: G, x: number, y: number, w: number, h: number, colour = "#3a3a38", spiral = true) {
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.lineTo(x - w * 0.42, y - h * 0.8);
  g.quadraticCurveTo(x, y - h * 1.08, x + w * 0.4, y - h * 0.85);
  g.lineTo(x + w / 2, y);
  g.fill();
  if (spiral) {
    g.strokeStyle = "rgba(200,210,190,0.35)";
    g.lineWidth = 1;
    g.beginPath();
    const cx = x;
    const cy = y - h * 0.55;
    for (let a = 0; a < TAU * 2.2; a += 0.3) {
      const rr = 0.6 + a * 0.75;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (a === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  }
}

type Fig = {
  kind?: "woman" | "man" | "child" | "old";
  colour?: string;
  /** where the arms are */
  arms?: "down" | "up" | "out" | "mouth" | "hair" | "hold";
  hair?: string;
  /** a bit of colour that matters: a ribbon, a crown */
  accent?: string;
  lean?: number;
  face?: -1 | 1;
};
/** a figure in silhouette, standing on (x, y), h tall */
function figure(g: G, x: number, y: number, h: number, f: Fig = {}) {
  const c = f.colour ?? "#0c0e0c";
  const kind = f.kind ?? "woman";
  const lean = f.lean ?? 0;
  g.save();
  g.translate(x, y);
  g.rotate(lean);
  g.fillStyle = c;
  g.strokeStyle = c;
  g.lineCap = "round";
  const head = h * 0.12;
  const shoulder = -h * 0.78;
  // body
  g.beginPath();
  if (kind === "woman" || kind === "old") {
    g.moveTo(-h * 0.07, shoulder);
    g.lineTo(-h * 0.2, 0);
    g.lineTo(h * 0.2, 0);
    g.lineTo(h * 0.07, shoulder);
  } else {
    g.moveTo(-h * 0.09, shoulder);
    g.lineTo(-h * 0.08, -h * 0.4);
    g.lineTo(-h * 0.07, 0);
    g.lineTo(-h * 0.02, 0);
    g.lineTo(0, -h * 0.36);
    g.lineTo(h * 0.02, 0);
    g.lineTo(h * 0.07, 0);
    g.lineTo(h * 0.08, -h * 0.4);
    g.lineTo(h * 0.09, shoulder);
  }
  g.closePath();
  g.fill();
  // head
  const hy = shoulder - head * 1.1 + (kind === "old" ? head * 0.4 : 0);
  g.beginPath();
  g.arc(kind === "old" ? head * 0.4 : 0, hy, head, 0, TAU);
  g.fill();
  if (kind === "woman" || (kind === "child" && f.hair)) {
    // long hair, in the wind
    g.beginPath();
    g.moveTo(-head * 0.9, hy - head * 0.4);
    g.quadraticCurveTo(-head * 2.2, hy + head * 2, -head * 1.4 - (f.face ?? 1) * 2, shoulder + h * 0.18);
    g.lineTo(-head * 0.2, shoulder + h * 0.05);
    g.fill();
  }
  // arms
  g.lineWidth = Math.max(1.4, h * 0.05);
  const arm = (dx: number, dy: number) => {
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * h * 0.07, shoulder + h * 0.04);
      g.lineTo(s * dx, dy);
      g.stroke();
    }
  };
  const a = f.arms ?? "down";
  if (a === "down") arm(h * 0.12, -h * 0.4);
  else if (a === "up") arm(h * 0.2, shoulder - h * 0.3);
  else if (a === "out") arm(h * 0.24, shoulder + h * 0.26);
  else if (a === "mouth") {
    g.beginPath();
    g.moveTo(h * 0.07, shoulder + h * 0.04);
    g.lineTo(h * 0.14, hy + head * 0.4);
    g.stroke();
    g.beginPath();
    g.moveTo(-h * 0.07, shoulder + h * 0.04);
    g.lineTo(-h * 0.12, -h * 0.4);
    g.stroke();
  } else if (a === "hair") {
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * h * 0.07, shoulder + h * 0.04);
      g.lineTo(s * h * 0.16, hy + head * 0.2);
      g.lineTo(s * head * 0.6, hy - head * 0.5);
      g.stroke();
    }
  } else if (a === "hold") {
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * h * 0.07, shoulder + h * 0.04);
      g.lineTo(s * h * 0.17, shoulder + h * 0.2);
      g.lineTo(0, shoulder + h * 0.26);
      g.stroke();
    }
  }
  if (f.accent) {
    g.fillStyle = f.accent;
    if (kind === "child" && f.arms !== "hair") {
      // a crown of leaves
      for (let k = -2; k <= 2; k++) g.fillRect(k * head * 0.45 - 1, hy - head * 1.15, 2, 2);
    } else {
      g.fillRect(-head * 1.2, hy - head * 0.3, 2, 2);
      g.fillRect(-head * 1.6, hy + head * 0.4, 1, 4);
      g.fillRect(-head * 1.3, hy + head * 0.6, 1, 5);
    }
  }
  g.restore();
}
/** a father or mother with a little one up on the shoulders */
function carrying(g: G, x: number, y: number, h: number, colour: string, onBack = false) {
  figure(g, x, y, h, { kind: onBack ? "woman" : "man", colour, arms: onBack ? "hold" : "up" });
  figure(g, x + (onBack ? 3 : 0), y - h * (onBack ? 0.62 : 0.82), h * 0.42, { kind: "child", colour, arms: onBack ? "out" : "out", hair: onBack ? "y" : undefined });
}
function dog(g: G, x: number, y: number, s: number, colour: string) {
  g.fillStyle = colour;
  g.beginPath();
  g.ellipse(x, y - s * 0.5, s * 0.9, s * 0.35, 0.15, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(x + s * 0.95, y - s * 0.32, s * 0.32, s * 0.24, 0.5, 0, TAU);
  g.fill();
  g.fillRect(x - s * 0.7, y - s * 0.4, s * 0.12, s * 0.4);
  g.fillRect(x + s * 0.5, y - s * 0.4, s * 0.12, s * 0.4);
  g.beginPath();
  g.moveTo(x - s * 0.85, y - s * 0.7);
  g.lineTo(x - s * 1.3, y - s * 0.95);
  g.lineWidth = s * 0.1;
  g.strokeStyle = colour;
  g.stroke();
  // hackles up
  for (let k = 0; k < 4; k++) g.fillRect(x - s * 0.3 + k * s * 0.2, y - s * 0.92, 1, s * 0.12);
}
function pixelate(g: G, p: number) {
  const im = g.getImageData(0, 0, g.canvas.width, g.canvas.height);
  const w = g.canvas.width;
  const h = g.canvas.height;
  const d = im.data;
  for (let y = 0; y < h; y += p)
    for (let x = 0; x < w; x += p) {
      const i = (y * w + x) * 4;
      for (let dy = 0; dy < p && y + dy < h; dy++)
        for (let dx = 0; dx < p && x + dx < w; dx++) {
          const j = ((y + dy) * w + x + dx) * 4;
          d[j] = d[i];
          d[j + 1] = d[i + 1];
          d[j + 2] = d[i + 2];
        }
    }
  g.putImageData(im, 0, 0);
}
/** a knotwork-ish corner: a faint, worn border */
function frame(g: G) {
  g.strokeStyle = "rgba(220,200,140,0.22)";
  g.lineWidth = 1;
  g.strokeRect(3.5, 3.5, W - 7, H - 7);
  for (const [x, y] of [[8, 8], [W - 8, 8], [8, H - 8], [W - 8, H - 8]]) {
    g.beginPath();
    for (let a = 0; a < TAU * 1.6; a += 0.35) {
      const rr = 0.5 + a * 0.6;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (a === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  }
}

/* ---------------- the scenes ---------------- */

const NIGHT: [number, string][] = [[0, "#0a1020"], [0.55, "#1a2636"], [1, "#0e1612"]];
const DAWN: [number, string][] = [[0, "#24304a"], [0.45, "#a8806a"], [0.62, "#e0b890"], [1, "#2a3424"]];
const DUSK: [number, string][] = [[0, "#1e1a30"], [0.5, "#6a3a40"], [0.66, "#b06a48"], [1, "#1c1a14"]];
const GREY: [number, string][] = [[0, "#4a5058"], [0.6, "#80847e"], [1, "#2a2c26"]];
const DAY: [number, string][] = [[0, "#5a7a98"], [0.55, "#b8c8c0"], [1, "#3a4a2a"]];
const RED: [number, string][] = [[0, "#2a0608"], [0.5, "#8a1a1e"], [0.7, "#c04030"], [1, "#140a08"]];

const SCENES: ((g: G) => void)[] = [
  // 0 The ribbon: dawn, a girl at a gate, tying a green ribbon
  (g) => {
    sky(g, DAWN);
    glow(g, 230, 112, 60, "255,220,160", 0.5);
    hills(g, 112, 6, "#3a3a34", 1);
    hills(g, 132, 5, "#26301e", 2);
    grass(g, 132, "#3a4a2a", 1, 90);
    g.fillStyle = "#14140e";
    for (let k = 0; k < 6; k++) g.fillRect(40 + k * 16, 132, 3, 18);
    g.fillRect(36, 136, 96, 2);
    g.fillRect(36, 143, 96, 2);
    figure(g, 170, 152, 44, { kind: "child", hair: "y", arms: "hair", accent: "#5aff6a", colour: "#141410" });
    petals(g, 20, 3, "#e8d0a0", 120, 175);
  },
  // 1 The hall of branches: a roofless hall of living trees, petals falling like snow, dancers in a ring
  (g) => {
    sky(g, NIGHT);
    stars(g, 50, 2);
    moon(g, 160, 30, 7, "#0e1626", 0.15);
    hills(g, 130, 3, "#141c18", 1);
    for (const [x, h] of [[40, 110], [90, 120], [230, 120], [280, 110]] as [number, number][]) tree(g, x, 150, h, "blossom", "#16120e", "#c8a8b4", x);
    g.strokeStyle = "#16120e";
    g.lineWidth = 2;
    for (const dy of [0, 8]) {
      g.beginPath();
      g.moveTo(40, 66 + dy);
      g.quadraticCurveTo(160, 22 + dy, 280, 66 + dy);
      g.stroke();
    }
    glow(g, 160, 130, 60, "255,200,140", 0.25);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * TAU;
      figure(g, 160 + Math.cos(a) * 42, 152 + Math.sin(a) * 8, 26, { kind: k % 2 ? "woman" : "man", arms: "out", colour: "#100c0a", lean: Math.cos(a) * 0.15 });
    }
    petals(g, 120, 4, "#f0dce4");
  },
  // 2 The crown of leaves: a child with a crown, standing stones in the morning
  (g) => {
    sky(g, DAY);
    hills(g, 110, 8, "#4a5a48", 3);
    hills(g, 126, 6, "#34422e", 4);
    for (const [x, h] of [[60, 34], [100, 42], [220, 40], [262, 30]] as [number, number][]) stone(g, x, 140, 14, h, "#3a3c38");
    grass(g, 136, "#4a6a3a", 2, 80);
    figure(g, 162, 160, 46, { kind: "child", arms: "down", accent: "#6aff5a", colour: "#161812" });
    glow(g, 162, 112, 20, "120,255,120", 0.25);
  },
  // 3 Counting: dusk, a mother at a lit door, three children coming in
  (g) => {
    sky(g, DUSK);
    hills(g, 118, 6, "#24201e", 2);
    house(g, 60, 150, 70, 40, "#141210", "255,200,120", true);
    figure(g, 82, 150, 36, { kind: "woman", arms: "out", colour: "#0e0c0a" });
    for (const [x, h] of [[170, 22], [200, 18], [226, 14]] as [number, number][]) figure(g, x, 154, h, { kind: "child", colour: "#120e0c" });
    grass(g, 145, "#2a2a1e", 5, 60);
  },
  // 4 His laugh: the orchard, a man with the youngest on his shoulders
  (g) => {
    sky(g, [[0, "#7a90a8"], [0.5, "#e8c898"], [1, "#3a4a2a"]]);
    glow(g, 260, 60, 70, "255,230,170", 0.5);
    hills(g, 116, 5, "#5a6a48", 1);
    for (let k = 0; k < 6; k++) tree(g, 20 + k * 58, 132 + (k % 2) * 6, 50, "apple", "#2a1e14", "#3a5a2a", k + 3);
    grass(g, 132, "#4a6a30", 6, 90);
    carrying(g, 160, 168, 58, "#141410");
  },
  // 5 The first hole: a dark hole under an apple tree, a boy holding a stone
  (g) => {
    sky(g, [[0, "#6a7a88"], [0.6, "#b0b4a8"], [1, "#2e3a26"]]);
    hills(g, 118, 5, "#46523a", 4);
    tree(g, 210, 140, 90, "apple", "#22180e", "#34502a", 7);
    grass(g, 130, "#3e5a2c", 7, 90);
    g.fillStyle = "#030303";
    g.beginPath();
    g.ellipse(200, 152, 30, 8, 0, 0, TAU);
    g.fill();
    glow(g, 200, 152, 34, "0,0,0", 0.5);
    figure(g, 120, 160, 34, { kind: "child", arms: "out", colour: "#161410" });
    g.fillStyle = "#8a8070";
    g.fillRect(130, 130, 3, 3);
  },
  // 6 Gold under the roots: the great oak felled, a glint of gold, the children small
  (g) => {
    sky(g, GREY);
    hills(g, 112, 8, "#3a4038", 5);
    tree(g, 60, 140, 70, "oak", "#1a1610", "#2a3624", 1);
    tree(g, 280, 140, 60, "oak", "#1a1610", "#2a3624", 2);
    g.fillStyle = "#2a2018";
    g.fillRect(140, 128, 40, 16);
    g.fillStyle = "#4a3a28";
    g.beginPath();
    g.ellipse(160, 128, 20, 5, 0, 0, TAU);
    g.fill();
    g.strokeStyle = "#3a2c1e";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(186, 142);
    g.lineTo(300, 158);
    g.stroke();
    glow(g, 160, 148, 20, "255,210,90", 0.6);
    g.fillStyle = "#ffd05a";
    g.fillRect(156, 146, 3, 3);
    g.fillRect(163, 149, 2, 2);
    for (const [x, h] of [[100, 18], [116, 16], [208, 20]] as [number, number][]) figure(g, x, 160, h, { kind: "child", colour: "#14120e", accent: "#ffd05a" });
    rain(g, 40, 6, "rgba(200,200,190,0.2)");
  },
  // 7 Lamps at night: lamps going down into a hollow, watched from the hall
  (g) => {
    sky(g, NIGHT);
    stars(g, 60, 7);
    moon(g, 262, 30, 10, "#0e1626");
    hills(g, 86, 10, "#1a2530", 1);
    hills(g, 104, 8, "#16211c", 2);
    g.fillStyle = "#050706";
    g.beginPath();
    g.ellipse(166, 132, 60, 16, 0, 0, TAU);
    g.fill();
    const pts = [[300, 96], [280, 102], [258, 108], [238, 115], [220, 122], [202, 128], [186, 132], [172, 134]];
    pts.forEach(([x, y], i) => {
      const a = 1 - (i / pts.length) * 0.9;
      glow(g, x, y, 8, "255,200,110", 0.9 * a);
      g.fillStyle = `rgba(255,230,160,${a})`;
      g.fillRect(x - 1, y - 1, 2, 2);
    });
    house(g, 20, 135, 74, 58, "#0e1410", "240,180,100");
    figure(g, 70, 115, 12, { kind: "woman", colour: "#1a1410" });
    for (const x of [124, 236, 300]) tree(g, x, 126, 34, "dead", "#0a0e0c");
    mist(g, 120, 0.2, "120,140,140");
  },
  // 8 Never again: winter, a fresh grave under a cross-stone, a man who will not stir
  (g) => {
    sky(g, [[0, "#3a4250"], [0.6, "#8a9098"], [1, "#c8ccc8"]]);
    hills(g, 112, 6, "#6a7078", 4);
    g.fillStyle = "#d8dcd8";
    g.fillRect(0, 128, W, 60);
    stone(g, 160, 136, 16, 40, "#2a2c2c");
    g.strokeStyle = "#2a2c2c";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(160, 104, 9, 0, TAU);
    g.stroke();
    g.fillStyle = "#3a2e24";
    g.beginPath();
    g.ellipse(160, 146, 24, 6, 0, 0, TAU);
    g.fill();
    figure(g, 112, 152, 40, { kind: "man", colour: "#121416", lean: 0.12 });
    for (const x of [40, 270, 300]) tree(g, x, 132, 50, "dead", "#2a2c30");
    petals(g, 90, 8, "#ffffff");
  },
  // 9 The cup: a window at night, a cracked black cup on the sill, and eyes in the dark outside
  (g) => {
    g.fillStyle = "#1a1410";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#0a1020";
    g.fillRect(90, 24, 140, 110);
    const r = rng(9);
    g.fillStyle = "#c8d0e0";
    for (let k = 0; k < 18; k++) g.fillRect(92 + r() * 136, 26 + r() * 60, 1, 1);
    moon(g, 196, 48, 8, "#0a1020", 0.7);
    g.fillStyle = "#06080a";
    g.fillRect(90, 104, 140, 30);
    g.fillStyle = "#e0d060";
    g.fillRect(126, 112, 3, 2);
    g.fillRect(136, 112, 3, 2);
    g.strokeStyle = "#2a2018";
    g.lineWidth = 4;
    g.strokeRect(90, 24, 140, 110);
    g.beginPath();
    g.moveTo(160, 24);
    g.lineTo(160, 134);
    g.moveTo(90, 79);
    g.lineTo(230, 79);
    g.stroke();
    g.fillStyle = "#2e241a";
    g.fillRect(70, 134, 180, 10);
    g.fillStyle = "#050505";
    g.beginPath();
    g.moveTo(180, 134);
    g.lineTo(178, 118);
    g.lineTo(198, 118);
    g.lineTo(196, 134);
    g.fill();
    g.strokeStyle = "#8a8278";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(178, 118.5);
    g.lineTo(198, 118.5);
    g.stroke();
    glow(g, 188, 126, 14, "200,200,220", 0.15);
    g.strokeStyle = "#6a6058";
    g.beginPath();
    g.moveTo(188, 118);
    g.lineTo(186, 126);
    g.lineTo(190, 132);
    g.stroke();
    glow(g, 60, 150, 50, "255,170,90", 0.2);
  },
  // 10 The first blossom: a blossom tree in grey dusk, petals on bare black earth
  (g) => {
    sky(g, [[0, "#2a2a36"], [0.6, "#6a6470"], [1, "#22201c"]]);
    hills(g, 116, 5, "#34343a", 2);
    tree(g, 150, 146, 110, "blossom", "#1c1612", "#c8aab4", 10);
    g.fillStyle = "#14100c";
    g.beginPath();
    g.ellipse(170, 158, 60, 10, 0, 0, TAU);
    g.fill();
    petals(g, 30, 11, "#f0d0dc", 146, 166);
    petals(g, 12, 12, "#f0d0dc", 60, 140);
  },
  // 11 I asked him: two figures at dusk, the last gentle kiss on her forehead
  (g) => {
    sky(g, DUSK);
    glow(g, 160, 110, 80, "255,140,90", 0.35);
    hills(g, 120, 4, "#201a1a", 3);
    grass(g, 140, "#2a2418", 7, 50);
    figure(g, 150, 156, 50, { kind: "woman", colour: "#0e0a0a", arms: "down" });
    figure(g, 172, 156, 58, { kind: "man", colour: "#0c0a0a", arms: "out", lean: -0.18 });
    g.fillStyle = "#0e0a0a";
    g.fillRect(156, 124, 8, 3);
  },
  // 12 The voice below: night, a dog growling at the ground, a light seeping through cracks
  (g) => {
    sky(g, NIGHT);
    stars(g, 30, 12);
    hills(g, 110, 6, "#141c18", 4);
    house(g, 220, 140, 60, 40, "#0e1210", "220,170,100");
    g.fillStyle = "#121612";
    g.fillRect(0, 140, W, 40);
    g.strokeStyle = "rgba(160,255,120,0.7)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(80, 160);
    g.lineTo(100, 156);
    g.lineTo(116, 162);
    g.lineTo(134, 157);
    g.moveTo(100, 156);
    g.lineTo(104, 150);
    g.stroke();
    glow(g, 108, 158, 30, "120,255,100", 0.3);
    dog(g, 150, 160, 14, "#0a0a08");
  },
  // 13 Too many teeth: the long table, lords leaning over raw meat, the bread untouched
  (g) => {
    g.fillStyle = "#140a08";
    g.fillRect(0, 0, W, H);
    glow(g, 160, 90, 120, "220,100,50", 0.3);
    for (const x of [70, 250]) {
      g.fillStyle = "#ffd080";
      g.fillRect(x - 1, 92, 2, 6);
      glow(g, x, 92, 20, "255,190,100", 0.5);
    }
    for (let k = 0; k < 5; k++) figure(g, 60 + k * 50, 132, 54, { kind: "man", colour: "#0a0504", arms: "out", lean: 0.1 * (k % 2 ? 1 : -1) });
    g.fillStyle = "#2a1610";
    g.fillRect(30, 120, 260, 14);
    g.fillStyle = "#8a2020";
    for (const x of [90, 150, 210]) g.fillRect(x, 116, 14, 4);
    g.fillStyle = "#c8a060";
    g.beginPath();
    g.ellipse(265, 117, 9, 4, 0, 0, TAU);
    g.fill();
    g.fillStyle = "#e8e0d0";
    for (const x of [62, 112, 162, 212]) for (let t = 0; t < 4; t++) g.fillRect(x + t * 2, 80, 1, 2);
  },
  // 14 Inside out: the sky the red of what lies under skin, over the hamlet
  (g) => {
    sky(g, RED);
    glow(g, 160, 70, 100, "255,90,60", 0.3);
    hills(g, 120, 4, "#1a0806", 1);
    for (const [x, w, h] of [[30, 50, 30], [100, 70, 40], [190, 46, 28], [250, 60, 34]] as [number, number, number][]) house(g, x, 150, w, h, "#0a0404", null);
    g.fillStyle = "#0a0404";
    g.fillRect(0, 150, W, 30);
    for (const x of [130, 150, 168]) figure(g, x, 168, 22, { kind: "man", colour: "#000000", arms: "out", lean: 0.2 });
  },
  // 15 His eyes: a tall figure with eyes that watch, the children small behind the wall with the sheep
  (g) => {
    sky(g, NIGHT);
    moon(g, 60, 34, 9, "#0e1626", 0.3);
    hills(g, 116, 5, "#141a16", 2);
    g.fillStyle = "#2a2a26";
    g.fillRect(150, 138, 170, 10);
    for (let k = 0; k < 8; k++) g.fillRect(152 + k * 21, 134, 18, 5);
    for (const x of [180, 200, 258]) {
      g.fillStyle = "#c8c4b8";
      g.beginPath();
      g.ellipse(x, 154, 8, 5, 0, 0, TAU);
      g.fill();
    }
    figure(g, 226, 150, 20, { kind: "child", colour: "#0c0e0c", hair: "y" });
    figure(g, 240, 150, 17, { kind: "child", colour: "#0c0e0c" });
    figure(g, 92, 172, 96, { kind: "man", colour: "#060706" });
    g.fillStyle = "#e8e060";
    g.fillRect(89, 86, 2, 1);
    g.fillRect(95, 86, 2, 1);
  },
  // 16 The black orchards: dead trees and apples like coal, a well
  (g) => {
    sky(g, GREY);
    hills(g, 112, 5, "#3a3c36", 6);
    for (let k = 0; k < 6; k++) tree(g, 20 + k * 56, 140 + (k % 2) * 5, 62, "black", "#141210", "#000", k + 20);
    g.fillStyle = "#2a2a28";
    g.fillRect(150, 140, 26, 18);
    g.fillStyle = "#0a0c08";
    g.beginPath();
    g.ellipse(163, 140, 13, 3.5, 0, 0, TAU);
    g.fill();
    g.strokeStyle = "rgba(90,120,40,0.6)";
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(158, 139);
    g.quadraticCurveTo(162, 134, 168, 139);
    g.stroke();
    mist(g, 140, 0.25, "120,120,110");
  },
  // 17 To see the sea: before dawn, a mother and three children setting out, the sea far off
  (g) => {
    sky(g, [[0, "#141a2a"], [0.5, "#3a4a60"], [0.62, "#8a8890"], [1, "#1c2018"]]);
    stars(g, 20, 17, 0.3);
    sea(g, 100, "#4a5a6a", "rgba(220,230,240,0.5)");
    hills(g, 112, 6, "#1e2420", 3);
    house(g, 30, 146, 56, 36, "#0e100e", "240,180,100", true);
    figure(g, 150, 160, 44, { kind: "woman", arms: "out", colour: "#0c0c0c" });
    figure(g, 172, 160, 22, { kind: "child", colour: "#0c0c0c" });
    figure(g, 188, 160, 18, { kind: "child", colour: "#0c0c0c", hair: "y" });
    figure(g, 132, 160, 16, { kind: "child", colour: "#0c0c0c" });
    g.fillStyle = "#24281e";
    g.fillRect(0, 160, W, 20);
  },
  // 18 The old road: night, the oldest road between stones; the little one on her back, the two holding hands
  (g) => {
    sky(g, NIGHT);
    stars(g, 60, 18);
    moon(g, 270, 26, 7, "#0e1626", 0.5);
    hills(g, 104, 8, "#141c1a", 5);
    g.fillStyle = "#2a2a24";
    g.beginPath();
    g.moveTo(140, 104);
    g.lineTo(180, 104);
    g.lineTo(260, H);
    g.lineTo(60, H);
    g.fill();
    for (const [x, y, h] of [[110, 120, 26], [216, 118, 30], [70, 150, 40], [262, 152, 44]] as [number, number, number][]) stone(g, x, y, h * 0.4, h, "#1e2020");
    carrying(g, 150, 160, 44, "#080808", true);
    figure(g, 186, 152, 22, { kind: "child", colour: "#080808", arms: "out" });
    figure(g, 198, 152, 19, { kind: "child", colour: "#080808", arms: "out", hair: "y" });
  },
  // 19 The bridge: rain, a broken bridge over a stream, two small figures holding hands
  (g) => {
    sky(g, [[0, "#2a3038"], [0.6, "#5a6068"], [1, "#1a2020"]]);
    hills(g, 104, 6, "#2a3030", 6);
    g.fillStyle = "#3a4a54";
    g.fillRect(0, 146, W, 14);
    g.fillStyle = "rgba(200,220,230,0.3)";
    for (let x = 0; x < W; x += 10) g.fillRect(x + ((x / 10) % 2) * 4, 150, 5, 1);
    g.fillStyle = "#1e1a16";
    g.fillRect(40, 132, 100, 6);
    g.fillRect(190, 134, 100, 6);
    g.fillRect(40, 132, 6, 20);
    g.fillRect(284, 134, 6, 20);
    g.beginPath();
    g.moveTo(140, 132);
    g.lineTo(150, 146);
    g.lineTo(142, 138);
    g.fill();
    figure(g, 98, 132, 22, { kind: "child", colour: "#0a0a0a", arms: "out" });
    figure(g, 110, 132, 19, { kind: "child", colour: "#0a0a0a", arms: "out", hair: "y" });
    rain(g, 160, 19);
  },
  // 20 The edge: the ravine in mist, a figure with a child in her arms, at the edge
  (g) => {
    sky(g, [[0, "#1a1e28"], [0.6, "#4a5058"], [1, "#0a0c0c"]]);
    g.fillStyle = "#121414";
    g.beginPath();
    g.moveTo(0, 120);
    g.lineTo(150, 124);
    g.lineTo(156, H);
    g.lineTo(0, H);
    g.fill();
    g.beginPath();
    g.moveTo(230, 118);
    g.lineTo(W, 114);
    g.lineTo(W, H);
    g.lineTo(240, H);
    g.fill();
    mist(g, 150, 0.45, "160,170,170");
    figure(g, 132, 124, 46, { kind: "woman", arms: "hold", colour: "#060606" });
    figure(g, 132, 104, 14, { kind: "child", colour: "#060606" });
    for (const x of [30, 70]) tree(g, x, 122, 40, "pine", "#0a0c0a", "#0e1210");
  },
  // 21 Not yet: roots and moss catching them, water spilling, a green light
  (g) => {
    sky(g, [[0, "#0a100c"], [1, "#10180e"]]);
    glow(g, 160, 100, 90, "110,220,120", 0.3);
    g.strokeStyle = "#3a2a1a";
    g.lineCap = "round";
    const r = rng(21);
    for (let k = 0; k < 14; k++) {
      g.lineWidth = 2 + r() * 4;
      g.beginPath();
      const sx = r() * W;
      g.moveTo(sx, H);
      g.bezierCurveTo(sx + (r() - 0.5) * 120, 120, 160 + (r() - 0.5) * 80, 120, 160 + (r() - 0.5) * 30, 90 + r() * 20);
      g.stroke();
    }
    g.fillStyle = "#3a6a2a";
    for (let k = 0; k < 40; k++) g.fillRect(100 + r() * 120, 90 + r() * 60, 3, 2);
    g.strokeStyle = "rgba(170,220,230,0.5)";
    g.lineWidth = 1;
    for (let k = 0; k < 6; k++) {
      g.beginPath();
      g.moveTo(80 + k * 30, 40);
      g.lineTo(84 + k * 30, H);
      g.stroke();
    }
    figure(g, 160, 112, 32, { kind: "woman", arms: "hold", colour: "#060806" });
  },
  // 22 Her name: morning, a woman calling across a field, a ribbon in the stream
  (g) => {
    sky(g, DAWN);
    glow(g, 260, 108, 70, "255,220,170", 0.5);
    hills(g, 108, 6, "#4a4a3a", 4);
    hills(g, 124, 5, "#34402a", 5);
    grass(g, 124, "#4a5a30", 22, 120);
    g.fillStyle = "#5a7080";
    g.beginPath();
    g.moveTo(0, 160);
    g.quadraticCurveTo(160, 150, W, 166);
    g.lineTo(W, 172);
    g.quadraticCurveTo(160, 158, 0, 168);
    g.fill();
    g.strokeStyle = "#5aff6a";
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(220, 162);
    g.quadraticCurveTo(232, 158, 244, 164);
    g.stroke();
    figure(g, 110, 150, 50, { kind: "woman", arms: "mouth", colour: "#121410" });
  },
  // 23 Where she went: spring at last, the flowers opening, a child of light in the green
  (g) => {
    sky(g, [[0, "#7aa0c0"], [0.6, "#d8e8d0"], [1, "#4a7a3a"]]);
    glow(g, 160, 80, 120, "255,250,220", 0.5);
    hills(g, 112, 6, "#6a9a5a", 2);
    for (const [x, h] of [[40, 80], [280, 90]] as [number, number][]) tree(g, x, 140, h, "blossom", "#3a2a1e", "#f0d4dc", x);
    hills(g, 128, 4, "#4a8a3a", 3);
    grass(g, 128, "#3a7a2a", 23, 120);
    const r = rng(23);
    for (let k = 0; k < 60; k++) {
      g.fillStyle = ["#f8f0a0", "#f0b0c8", "#ffffff", "#c8a8f0"][k % 4];
      g.fillRect(r() * W, 132 + r() * 46, 2, 2);
    }
    glow(g, 170, 136, 30, "255,255,230", 0.7);
    figure(g, 170, 156, 30, { kind: "child", hair: "y", arms: "up", colour: "rgba(255,255,240,0.85)", accent: "#5aff6a" });
    petals(g, 40, 24, "#ffe8f0");
  },
];

const CACHE = new Map<number, string>();
/** the picture for memory i, as an image URL (painted once) */
export function memoryPicture(i: number): string {
  const hit = CACHE.get(i);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  (SCENES[i] ?? SCENES[0])(g);
  pixelate(g, 2);
  frame(g);
  const url = c.toDataURL("image/png");
  CACHE.set(i, url);
  return url;
}
export const MEMORY_PICTURES = SCENES.length;
