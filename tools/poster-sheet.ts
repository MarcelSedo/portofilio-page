import { poster, W, H, type Motif } from "/home/claude/marcel-cv/components/games/poster";
import fs from "node:fs";
const films = JSON.parse(fs.readFileSync("/home/claude/films/films.json", "utf8"));
const by: Record<string, any[]> = {};
for (const f of films) (by[f.motif] ??= []).push(f);
let html = `<body style="background:#0b1226;color:#ccc;font:11px sans-serif;margin:8px">`;
for (const m of Object.keys(by)) {
  html += `<div style="display:flex;gap:6px;margin-bottom:6px;align-items:center"><b style="width:70px">${m}</b>`;
  for (const f of by[m].slice(0, 6)) {
    const rects = poster(f.id, m as Motif).map(p => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${p.c}"/>`).join("");
    html += `<div><svg viewBox="0 0 ${W} ${H}" width="144" height="90" shape-rendering="crispEdges">${rects}</svg><div style="width:144px;overflow:hidden;white-space:nowrap">${f.title}</div></div>`;
  }
  html += `</div>`;
}
fs.writeFileSync("/tmp/sheet.html", html);
