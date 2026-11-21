// Preview of the Time Traveller card pictures (not part of the website).
// Run: npx tsx tools/poster-sheet.ts   → writes poster-sheet.html, open it in a browser.
import fs from "node:fs";
import { cards } from "../content/games/britain";
import { cardArt, W, H } from "../components/games/cardArt";
import type { Px } from "../components/games/poster";

const groups = new Map<string, typeof cards>();
for (const c of cards) {
  const key = c.kind === "film" ? `film: ${c.motif}` : c.kind;
  groups.set(key, [...(groups.get(key) ?? []), c]);
}

let html = `<body style="background:#0b1226;color:#ccc;font:11px sans-serif;margin:8px">`;
for (const [group, list] of groups) {
  html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;align-items:center"><b style="width:90px">${group}</b>`;
  for (const c of list.slice(0, group.startsWith("film") ? 4 : 10)) {
    const rects = cardArt(c.id, c.kind, c.motif)
      .map((p: Px) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.c}"/>`)
      .join("");
    html += `<div><svg viewBox="0 0 ${W} ${H}" width="144" height="90" shape-rendering="crispEdges">${rects}</svg>`;
    html += `<div style="width:144px;overflow:hidden;white-space:nowrap">${c.title}</div></div>`;
  }
  html += `</div>`;
}
fs.writeFileSync("poster-sheet.html", html);
console.log("Wrote poster-sheet.html");
