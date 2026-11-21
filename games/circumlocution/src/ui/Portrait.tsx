import { memo } from "react";
import { FACES } from "../content/days";
import type { Face } from "../content/types";

/**
 * Pixel portraits drawn by code on an 18×22 grid, with a dark outline round
 * everything, the same way the posters in Time Traveller are made.
 */
const W = 18;
const H = 22;
const INK = "#1a1014";

function draw(f: Face): string[][] {
  const g: string[][] = Array.from({ length: H }, () => Array<string>(W).fill(""));
  const put = (x: number, y: number, c: string) => {
    if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c;
  };
  const box = (x0: number, y0: number, x1: number, y1: number, c: string) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(x, y, c);
  };
  const dy = f.young ? 1 : 0;

  // coat and shoulders
  box(3, 17, 14, 21, f.coat);
  box(2, 18, 15, 21, f.coat);
  // lapels
  put(7, 17, shade(f.coat, -30));
  put(10, 17, shade(f.coat, -30));
  // neck and cravat
  box(7, 15 + dy, 10, 16, f.skin);
  if (f.cravat) {
    box(7, 16, 10, 17, f.cravat);
    put(8, 18, f.cravat);
    put(9, 18, f.cravat);
  }

  // head (rounded)
  const top = 6 + dy;
  box(5, top, 12, 14 + dy, f.skin);
  box(4, top + 1, 13, 13 + dy, f.skin);
  for (const [x, y] of [[4, top + 1], [13, top + 1], [4, 13 + dy], [13, 13 + dy]]) put(x, y, "");
  // ears
  put(4, top + 4, shade(f.skin, -18));
  put(13, top + 4, shade(f.skin, -18));

  // hair
  if (f.hat !== "bald") {
    box(5, top - 1, 12, top, f.hair);
    box(4, top, 13, top + 1, f.hair);
    put(4, top + 2, f.hair);
    put(13, top + 2, f.hair);
  } else {
    put(4, top + 2, f.hair);
    put(13, top + 2, f.hair);
    put(4, top + 3, f.hair);
    put(13, top + 3, f.hair);
    put(9, top, shade(f.skin, 22)); // shine
  }

  // eyes, brows, nose, mouth
  const ey = top + 4;
  put(6, ey, INK);
  put(11, ey, INK);
  put(6, ey - 1, shade(f.hair, -20));
  put(7, ey - 1, shade(f.hair, -20));
  put(10, ey - 1, shade(f.hair, -20));
  put(11, ey - 1, shade(f.hair, -20));
  put(8, ey + 2, shade(f.skin, -28));
  put(9, ey + 2, shade(f.skin, -28));
  put(8, ey + 4, "#8a3a3a");
  put(9, ey + 4, "#8a3a3a");
  put(5, ey + 2, "#e89a8a"); // cheeks
  put(12, ey + 2, "#e89a8a");

  if (f.specs) {
    for (const cx of [6, 11]) {
      put(cx - 1, ey, "#c9a23a");
      put(cx + 1, ey, "#c9a23a");
    }
    put(8, ey, "#c9a23a");
    put(9, ey, "#c9a23a");
  }
  if (f.monocle) {
    put(10, ey, "#c9a23a");
    put(12, ey, "#c9a23a");
    put(11, ey - 1, "#c9a23a");
    put(11, ey + 1, "#c9a23a");
    put(12, ey + 2, "#c9a23a");
    put(12, ey + 3, "#c9a23a");
  }

  // beards
  if (f.beard === "mutton") {
    box(4, top + 3, 5, top + 7, f.hair);
    box(12, top + 3, 13, top + 7, f.hair);
  } else if (f.beard === "full") {
    box(5, ey + 3, 12, 15 + dy, f.hair);
    put(8, ey + 4, "#8a3a3a");
    put(9, ey + 4, "#8a3a3a");
  } else if (f.beard === "stubble") {
    for (let x = 5; x <= 12; x += 2) put(x, ey + 5, shade(f.skin, -40));
    for (let x = 6; x <= 11; x += 2) put(x, ey + 6, shade(f.skin, -40));
  }

  // hats
  const hc = f.hatColor ?? "#222";
  if (f.hat === "top") {
    box(5, top - 6, 12, top - 1, hc);
    box(3, top - 1, 14, top, hc);
    box(5, top - 2, 12, top - 2, shade(hc, 40));
  } else if (f.hat === "bonnet") {
    box(3, top - 2, 14, top + 1, hc);
    box(3, top + 2, 4, top + 6, hc);
    box(13, top + 2, 14, top + 6, hc);
    put(5, top + 9, "#d8c070");
    put(12, top + 9, "#d8c070");
  } else if (f.hat === "cap") {
    box(4, top - 2, 13, top, hc);
    box(10, top + 1, 15, top + 1, shade(hc, -20));
  } else if (f.hat === "cocked") {
    box(2, top - 1, 15, top, hc);
    box(4, top - 3, 13, top - 2, hc);
    box(7, top - 4, 10, top - 4, hc);
    put(8, top - 2, "#e8c24a");
    put(9, top - 2, "#e8c24a");
  } else if (f.hat === "mob") {
    box(4, top - 2, 13, top, hc);
    box(3, top - 1, 14, top + 1, hc);
    put(3, top + 2, hc);
    put(14, top + 2, hc);
  } else if (f.hat === "feather") {
    box(4, top - 2, 13, top, hc);
    box(11, top - 6, 12, top - 3, "#f0e6c8");
    put(13, top - 5, "#f0e6c8");
    put(10, top - 4, "#f0e6c8");
  }

  // props
  if (f.prop === "bird") {
    box(1, 15, 3, 16, "#e6c22a");
    put(0, 16, "#e08a2a");
    put(2, 14, "#e6c22a");
  } else if (f.prop === "broom") {
    for (let y = 9; y <= 21; y++) put(16, y, "#8a5a2a");
    box(15, 7, 17, 9, "#c9a45a");
  } else if (f.prop === "quill") {
    box(15, 12, 16, 17, "#f0ecdf");
    put(14, 18, INK);
  } else if (f.prop === "bag") {
    box(14, 18, 17, 21, "#2a1a14");
    put(15, 17, "#2a1a14");
    put(16, 17, "#2a1a14");
  } else if (f.prop === "crutch") {
    for (let y = 12; y <= 21; y++) put(16, y, "#9a6a3a");
    box(15, 12, 17, 12, "#9a6a3a");
  }
  return g;
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16);
  const gg = c((n >> 8) & 255);
  const b = c(n & 255);
  return `#${((r << 16) | (gg << 8) | b).toString(16).padStart(6, "0")}`;
}

function outline(g: string[][]) {
  const out = g.map((r) => [...r]);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (g[y][x]) continue;
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => g[y + dy]?.[x + dx]);
      if (near) out[y][x] = INK;
    }
  return out;
}

const cache = new Map<string, string[][]>();
function pixels(id: string) {
  let p = cache.get(id);
  if (!p) {
    p = outline(draw(FACES[id] ?? FACES.junior));
    cache.set(id, p);
  }
  return p;
}

export const Portrait = memo(function Portrait({ id, size = 72, className = "" }: { id: string; size?: number; className?: string }) {
  const p = pixels(id);
  const rects: React.ReactNode[] = [];
  p.forEach((row, y) => row.forEach((c, x) => c && rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={c} />)));
  return (
    <svg
      className={`co-face ${className}`}
      viewBox={`0 0 ${W} ${H}`}
      width={size}
      height={(size * H) / W}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {rects}
    </svg>
  );
});
