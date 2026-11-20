// Preview of all Time Traveller poster motifs (not part of the website).
// Run: npx tsx tools/poster-sheet.ts   → writes poster-sheet.html, open it in a browser.
import fs from "node:fs";
import { films } from "../content/games/films";
import { poster, W, H, type Px } from "../components/games/poster";

const byMotif = new Map<string, typeof films>();
for (const f of films) byMotif.set(f.motif, [...(byMotif.get(f.motif) ?? []), f]);

let html = `<body style="background:#0b1226;color:#ccc;font:11px sans-serif;margin:8px">`;
for (const [motif, list] of byMotif) {
  html += `<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center"><b style="width:70px">${motif}</b>`;
  for (const f of list.slice(0, 6)) {
    const rects = poster(f.id, f.motif)
      .map((p: Px) => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.c}"/>`)
      .join("");
    html += `<div><svg viewBox="0 0 ${W} ${H}" width="144" height="90" shape-rendering="crispEdges">${rects}</svg>`;
    html += `<div style="width:144px;overflow:hidden;white-space:nowrap">${f.title}</div></div>`;
  }
  html += `</div>`;
}
fs.writeFileSync("poster-sheet.html", html);
console.log("Wrote poster-sheet.html");
