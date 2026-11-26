/**
 * Hartfield engine: a Pokémon-like tile world. 16 px tiles, one room at a time, the player walks
 * from tile to tile, faces things and examines them. Rooms, collisions, doors and effects come from
 * maps.gen.ts (drawn by tools/hartfield-art). The engine knows nothing about the story: it asks the
 * UI what to do through callbacks.
 */
import { MAPS, CAST_ORDER, type MapData, type Fx } from "../data/maps.gen";
import { ART } from "./art";

export const T = 16;
export const VIEW_W = 16, VIEW_H = 12;
export type Dir = "up" | "down" | "left" | "right";
export type CastId = (typeof CAST_ORDER)[number];
export type Npc = { id: CastId; room: string; x: number; y: number; face: Dir; pose?: "seated"; hidden?: boolean };
export type Weather = "rain" | "clearing" | "clear";

const DIRV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRROW: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 3 };
export const STEP_MS = 190;

export type Hooks = {
  /** player pressed the action key facing an NPC or a thing */
  interact(kind: "npc" | "thing", id: string): void;
  /** player stepped into a room */
  entered(room: string): void;
  /** nothing in front of the player */
  idle?(): void;
  /** the tile in front changed (for screen readers) */
  facing?(what: { kind: "npc" | "thing" | "door" | "none"; id: string }): void;
};

type Mover = { x: number; y: number; fx: number; fy: number; t0: number; face: Dir; moving: boolean; step: number };
type Script = { id: string; path: [number, number][]; resolve: () => void; i: number; t0: number; from: [number, number] };

function img(src: string) { const i = new Image(); i.src = src; return i; }

export class Game {
  ctx: CanvasRenderingContext2D;
  hooks: Hooks;
  room!: MapData;
  rooms: Record<string, HTMLImageElement> = {};
  cast = img(ART.cast); seated = img(ART.seated);
  player: Mover = { x: 7, y: 6, fx: 7, fy: 6, t0: 0, face: "up", moving: false, step: 0 };
  npcs: Npc[] = [];
  held: Dir[] = [];
  frozen = false;
  locked = false;   // cut-scenes: the player cannot move
  fade = 0; fadeTo: null | { room: string; x: number; y: number; face: Dir } = null; fadeT = 0;
  weather: Weather = "rain"; weatherK = 1;
  gateOpen = false;
  marks = new Set<string>();      // "room:id" of things that glimmer
  guide: { room: string; x: number; y: number } | null = null;   // golden marker over the next goal
  hearts: { x: number; y: number; t: number }[] = [];
  scripts: Script[] = [];
  tick = 0; raf = 0; last = 0; turnT = 0;
  lastFacing = "";
  drops: { x: number; y: number; l: number; s: number }[] = [];

  constructor(canvas: HTMLCanvasElement, hooks: Hooks) {
    canvas.width = VIEW_W * T; canvas.height = VIEW_H * T;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("no canvas");
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx; this.hooks = hooks;
    for (const k of Object.keys(MAPS)) this.rooms[k] = img(ART.rooms[k]);
    for (let i = 0; i < 140; i++) this.drops.push({ x: Math.random() * VIEW_W * T, y: Math.random() * VIEW_H * T, l: 4 + Math.random() * 4, s: 0.18 + Math.random() * 0.12 });
  }

  start() { this.last = performance.now(); const loop = (t: number) => { this.update(t); this.draw(t); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { cancelAnimationFrame(this.raf); }

  // ------------------------------------------------------------------ rooms & placement
  load(room: string, x: number, y: number, face: Dir) {
    this.room = MAPS[room];
    Object.assign(this.player, { x, y, fx: x, fy: y, face, moving: false });
    this.hooks.entered(room);
    this.reportFacing(true);
  }
  warpTo(room: string, x: number, y: number, face: Dir) {
    this.fadeTo = { room, x, y, face }; this.fadeT = performance.now(); this.frozen = true;
  }
  npcAt(x: number, y: number) { return this.npcs.find((n) => !n.hidden && n.room === this.room.name && n.x === x && n.y === y); }
  solid(x: number, y: number) {
    const r = this.room;
    if (x < 0 || y < 0 || x >= r.cols || y >= r.rows) return true;
    if (r.solid[y][x] === "#") return true;
    if (this.npcAt(x, y)) return true;
    return false;
  }
  warpAt(x: number, y: number) { return this.room.warps.find((w) => w.at[0] === x && w.at[1] === y); }
  thingAt(x: number, y: number) { return this.room.things[`${x},${y}`]; }
  front(): [number, number] { const [dx, dy] = DIRV[this.player.face]; return [this.player.x + dx, this.player.y + dy]; }

  // ------------------------------------------------------------------ input
  press(d: Dir) { if (!this.held.includes(d)) this.held.push(d); if (!this.player.moving && this.player.face !== d) { this.player.face = d; this.turnT = performance.now(); this.reportFacing(); } }
  release(d: Dir) { this.held = this.held.filter((h) => h !== d); }
  releaseAll() { this.held = []; }
  action() {
    if (this.frozen || this.locked || this.player.moving) return;
    const [fx, fy] = this.front();
    const n = this.npcAt(fx, fy);
    if (n) { n.face = (({ up: "down", down: "up", left: "right", right: "left" }) as Record<Dir, Dir>)[this.player.face]; this.hooks.interact("npc", n.id); return; }
    const t = this.thingAt(fx, fy);
    if (t) { this.hooks.interact("thing", t); return; }
    this.hooks.idle?.();
  }
  reportFacing(force = false) {
    if (!this.hooks.facing || !this.room) return;
    const [fx, fy] = this.front();
    const n = this.npcAt(fx, fy); const t = this.thingAt(fx, fy); const w = this.warpAt(fx, fy);
    const what = n ? { kind: "npc" as const, id: n.id } : t ? { kind: "thing" as const, id: t } : w ? { kind: "door" as const, id: w.to } : { kind: "none" as const, id: "" };
    const key = `${what.kind}:${what.id}`;
    if (force || key !== this.lastFacing) { this.lastFacing = key; this.hooks.facing(what); }
  }

  // ------------------------------------------------------------------ scripted moves (cut-scenes)
  walk(id: string, path: [number, number][]) {
    return new Promise<void>((resolve) => {
      const n = id === "player" ? null : this.npcs.find((q) => q.id === id);
      const from: [number, number] = n ? [n.x, n.y] : [this.player.x, this.player.y];
      this.scripts.push({ id, path, resolve, i: 0, t0: performance.now(), from });
    });
  }
  heartsAt(x: number, y: number) { for (let i = 0; i < 9; i++) this.hearts.push({ x: x * T + 8 + (Math.random() - 0.5) * 14, y: y * T + (Math.random() - 0.5) * 6, t: performance.now() + i * 140 }); }

  // ------------------------------------------------------------------ update
  update(now: number) {
    this.tick = now;
    // fades between rooms
    if (this.fadeTo) {
      const k = (now - this.fadeT) / 220;
      if (k < 1) this.fade = k;
      else if (this.fadeTo) {
        const f = this.fadeTo; this.fadeTo = null; this.load(f.room, f.x, f.y, f.face); this.fadeT = now; this.fade = 1;
      }
    } else if (this.fade > 0) {
      this.fade = Math.max(0, 1 - (now - this.fadeT) / 220);
      if (this.fade === 0) this.frozen = false;
    }
    // weather
    if (this.weather === "clearing") { this.weatherK = Math.max(0, this.weatherK - 0.006); if (this.weatherK === 0) this.weather = "clear"; }
    // scripted walkers
    for (const s of [...this.scripts]) {
      const target = s.path[s.i];
      const n = s.id === "player" ? null : this.npcs.find((q) => q.id === s.id);
      const k = Math.min(1, (now - s.t0) / (STEP_MS * 1.6));
      const [ox, oy] = s.from; const [tx, ty] = target;
      const face: Dir = tx > ox ? "right" : tx < ox ? "left" : ty > oy ? "down" : "up";
      if (n) { n.face = face; (n as Npc & { fx?: number; fy?: number }).fx = ox + (tx - ox) * k; (n as Npc & { fy?: number }).fy = oy + (ty - oy) * k; }
      else { this.player.face = face; this.player.fx = ox + (tx - ox) * k; this.player.fy = oy + (ty - oy) * k; this.player.moving = k < 1; }
      if (k >= 1) {
        if (n) { n.x = tx; n.y = ty; } else { this.player.x = tx; this.player.y = ty; this.player.moving = false; }
        s.i++; s.from = [tx, ty]; s.t0 = now;
        if (s.i >= s.path.length) { this.scripts = this.scripts.filter((q) => q !== s); if (n) { delete (n as { fx?: number }).fx; delete (n as { fy?: number }).fy; } s.resolve(); }
      }
    }
    // the player
    const p = this.player;
    if (p.moving && !this.scripts.some((s) => s.id === "player")) {
      const k = (now - p.t0) / STEP_MS;
      if (k >= 1) {
        p.moving = false; p.fx = p.x; p.fy = p.y;
        const w = this.warpAt(p.x, p.y);
        if (w) { this.warpTo(w.to, w.arrive[0], w.arrive[1], w.face); return; }
        this.reportFacing();
      } else {
        const [dx, dy] = DIRV[p.face]; p.fx = p.x - dx * (1 - k); p.fy = p.y - dy * (1 - k);
      }
    }
    if (!p.moving && !this.frozen && !this.locked && this.held.length) {
      const d = this.held[this.held.length - 1];
      if (p.face !== d) { p.face = d; this.turnT = now; this.reportFacing(); }
      else if (now - this.turnT > 90) {
        const [dx, dy] = DIRV[d];
        const nx = p.x + dx, ny = p.y + dy;
        const w = this.warpAt(nx, ny);
        if (!this.solid(nx, ny) || (w && !this.npcAt(nx, ny))) {
          p.x = nx; p.y = ny; p.moving = true; p.t0 = now; p.step = (p.step + 1) % 2;
        } else this.reportFacing();
      }
    }
  }

  // ------------------------------------------------------------------ drawing
  origin() {
    const r = this.room;
    const ox = r.cols < VIEW_W ? Math.floor((VIEW_W - r.cols) * T / 2) : 0;
    const oy = r.rows < VIEW_H ? Math.floor((VIEW_H - r.rows) * T / 2) : 0;
    return [ox, oy];
  }
  drawChar(id: CastId, fx: number, fy: number, face: Dir, frame: number, ox: number, oy: number, pose?: "seated") {
    const ctx = this.ctx;
    const x = Math.round(ox + fx * T), y = Math.round(oy + fy * T);
    ctx.fillStyle = "rgba(60,30,20,0.28)"; ctx.beginPath(); ctx.ellipse(x + 8, y + 14, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    if (pose === "seated") {
      const i = id === "woodhouse" ? 0 : 1;
      ctx.drawImage(this.seated, i * 16, 0, 16, 26, x, y - 10, 16, 26); return;
    }
    const ci = CAST_ORDER.indexOf(id);
    ctx.drawImage(this.cast, frame * 16, (ci * 4 + DIRROW[face]) * 26, 16, 26, x, y - 10, 16, 26);
  }
  draw(now: number) {
    const ctx = this.ctx, r = this.room; if (!r) return;
    ctx.fillStyle = "#2a1c22"; ctx.fillRect(0, 0, VIEW_W * T, VIEW_H * T);
    const [ox, oy] = this.origin();
    const bg = this.rooms[r.name]; if (bg.complete) ctx.drawImage(bg, ox, oy);
    // gate (yard)
    for (const f of r.fx) if (f.type === "gate") this.drawGate(f, ox, oy);
    // glow & fx under characters
    for (const f of r.fx) this.drawFx(f, ox, oy, now, false);
    // characters, back to front
    const ents: { y: number; draw: () => void }[] = [];
    for (const n of this.npcs) {
      if (n.hidden || n.room !== r.name) continue;
      const m = n as Npc & { fx?: number; fy?: number };
      const moving = m.fx !== undefined;
      const fr = moving ? 1 + (Math.floor(now / 150) % 2) : 0;
      ents.push({ y: m.fy ?? n.y, draw: () => this.drawChar(n.id, m.fx ?? n.x, m.fy ?? n.y, n.face, fr, ox, oy, n.pose) });
    }
    const p = this.player;
    const pf = p.moving ? 1 + p.step : 0;
    ents.push({ y: p.fy, draw: () => this.drawChar("harriet", p.fx, p.fy, p.face, pf, ox, oy) });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
    for (const f of r.fx) this.drawFx(f, ox, oy, now, true);
    // golden guide marker: a bobbing arrow over the next goal
    if (this.guide && this.guide.room === r.name) {
      const gx = ox + this.guide.x * T + 8, gy = oy + this.guide.y * T - 13 + Math.round(Math.sin(now / 220) * 2);
      ctx.fillStyle = "#3a2630"; ctx.beginPath(); ctx.moveTo(gx - 6, gy - 7); ctx.lineTo(gx + 6, gy - 7); ctx.lineTo(gx, gy + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f4c463"; ctx.beginPath(); ctx.moveTo(gx - 4, gy - 6); ctx.lineTo(gx + 4, gy - 6); ctx.lineTo(gx, gy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff6c8"; ctx.fillRect(gx - 3, gy - 6, 2, 1);
    }
    // hearts
    this.hearts = this.hearts.filter((h) => now - h.t < 1800);
    for (const h of this.hearts) {
      const k = (now - h.t) / 1800; if (k < 0) continue;
      const x = ox + h.x + Math.sin(k * 6 + h.x) * 3, y = oy + h.y - 26 - k * 22;
      ctx.globalAlpha = 1 - k; ctx.fillStyle = "#d4587a";
      ctx.fillRect(x - 2, y - 1, 2, 2); ctx.fillRect(x + 1, y - 1, 2, 2); ctx.fillRect(x - 2, y, 5, 2); ctx.fillRect(x - 1, y + 2, 3, 1); ctx.fillRect(x, y + 3, 1, 1);
      ctx.globalAlpha = 1;
    }
    // weather for the yard
    if (r.fx.some((f) => f.type === "weather")) this.drawWeather(now);
    // fade
    if (this.fade > 0) { ctx.fillStyle = `rgba(42,28,34,${this.fade})`; ctx.fillRect(0, 0, VIEW_W * T, VIEW_H * T); }
  }
  drawGate(f: Fx, ox: number, oy: number) {
    const ctx = this.ctx; const [x0, y0, x1, y1] = f.rect!;
    ctx.fillStyle = "#20232b";
    if (!this.gateOpen) {
      for (let x = x0; x <= x1; x += 4) ctx.fillRect(ox + x, oy + y0 + 4, 1, y1 - y0 - 4);
      ctx.fillRect(ox + x0, oy + y0 + 10, x1 - x0, 1);
      ctx.strokeStyle = "#20232b"; ctx.beginPath(); ctx.ellipse(ox + (x0 + x1) / 2, oy + y0 + 8, (x1 - x0) / 2, 6, 0, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "#d8b45a"; ctx.fillRect(ox + (x0 + x1) / 2 - 2, oy + y0 + 9, 4, 4);
    } else {
      for (let k = 0; k < 6; k++) { ctx.fillRect(ox + x0 + k, oy + y0 + 4 + k * 2, 1, y1 - y0 - 6); ctx.fillRect(ox + x1 - k, oy + y0 + 4 + k * 2, 1, y1 - y0 - 6); }
    }
  }
  drawFx(f: Fx, ox: number, oy: number, now: number, top: boolean) {
    const ctx = this.ctx;
    if (!top) {
      if (f.type === "glow" || f.type === "candle") {
        const [x, y] = f.at!; const r = f.r ?? 9; const a = 0.12 + 0.05 * Math.sin(now / 120 + x);
        const g = ctx.createRadialGradient(ox + x, oy + y, 0, ox + x, oy + y, r);
        g.addColorStop(0, `rgba(255,217,138,${a * 2})`); g.addColorStop(1, "rgba(255,217,138,0)");
        ctx.fillStyle = g; ctx.fillRect(ox + x - r, oy + y - r, r * 2, r * 2);
        if (f.type === "candle") { ctx.fillStyle = Math.sin(now / 90 + x) > 0 ? "#f8d060" : "#f4c463"; ctx.fillRect(ox + x, oy + y - 1, 1, 2); }
      }
      if (f.type === "fire") {
        const [x0, y0, x1, y1] = f.rect!;
        const g = ctx.createRadialGradient(ox + (x0 + x1) / 2, oy + y1, 0, ox + (x0 + x1) / 2, oy + y1, 40);
        g.addColorStop(0, `rgba(255,176,80,${0.22 + 0.06 * Math.sin(now / 80)})`); g.addColorStop(1, "rgba(255,176,80,0)");
        ctx.fillStyle = g; ctx.fillRect(ox + x0 - 40, oy + y1 - 40, x1 - x0 + 80, 80);
        for (let x = x0 + 1; x < x1; x += 2) {
          const h = 3 + ((x * 7 + Math.floor(now / 90) * 5) % 7);
          ctx.fillStyle = "#f08a3a"; ctx.fillRect(ox + x, oy + y1 - h, 1, h);
          ctx.fillStyle = "#f8d060"; ctx.fillRect(ox + x, oy + y1 - Math.floor(h / 2), 1, Math.floor(h / 2));
        }
        ctx.fillStyle = "#c8442a"; ctx.fillRect(ox + x0, oy + y1 - 1, x1 - x0, 2);
      }
      if (f.type === "puddle" && this.weather !== "clear") {
        const [x, y] = f.at!; const ph = ((now / 140 + x) % 6);
        ctx.strokeStyle = `rgba(232,242,250,${(1 - ph / 6) * 0.7 * this.weatherK})`;
        ctx.beginPath(); ctx.ellipse(ox + x, oy + y, 1 + ph, (1 + ph) / 2.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }
    if (f.type === "rain") {
      const [x0, y0, x1, y1] = f.rect!;
      ctx.save(); ctx.beginPath(); ctx.rect(ox + x0, oy + y0, x1 - x0 + 1, y1 - y0 + 1); ctx.clip();
      if (this.weather !== "clear") {
        ctx.fillStyle = `rgba(200,216,234,${0.65 * this.weatherK})`;
        for (let i = 0; i < 9; i++) {
          const x = x0 + ((i * 37 + x0) % (x1 - x0 + 1)); const y = y0 + ((now / 30 + i * 53) % (y1 - y0 + 8)) - 4;
          ctx.fillRect(ox + x, oy + y, 1, 3);
        }
      } else { ctx.fillStyle = "rgba(255,236,170,0.25)"; ctx.fillRect(ox + x0, oy + y0, x1 - x0 + 1, y1 - y0 + 1); }
      ctx.restore();
    }
    if (f.type === "drip" && this.weather !== "clear") {
      const [x, y] = f.at!; const to = f.to!; const t = (now / 160) % 6;
      if (t < 5) { ctx.fillStyle = "rgba(184,208,232,0.9)"; ctx.fillRect(ox + x, oy + y + (to - y) * (t / 5), 1, 2); }
      else { ctx.strokeStyle = "rgba(224,236,246,0.8)"; ctx.beginPath(); ctx.ellipse(ox + x, oy + to, 3, 1.4, 0, 0, Math.PI * 2); ctx.stroke(); }
    }
    if (f.type === "sparkle" && f.id && this.marks.has(`${this.room.name}:${f.id}`)) {
      const [x, y] = f.at!; const s = [0, 1, 2, 1, 0, 0][Math.floor(now / 140) % 6];
      if (s) { ctx.fillStyle = "#fff6c8"; ctx.fillRect(ox + x, oy + y - s - 1, 1, s * 2 + 3); ctx.fillRect(ox + x - s - 1, oy + y, s * 2 + 3, 1); ctx.fillStyle = "#ffffff"; ctx.fillRect(ox + x, oy + y, 1, 1); }
    }
    if (f.type === "canary") {
      const [x, y] = f.at!; const hop = [0, -1, -2, -1, 0, 0][Math.floor(now / 160) % 6];
      ctx.fillStyle = "#f4d040"; ctx.fillRect(ox + x - 1, oy + y + hop, 4, 3); ctx.fillStyle = "#e89030"; ctx.fillRect(ox + x + 3, oy + y + 1 + hop, 1, 1);
    }
  }
  drawWeather(now: number) {
    const ctx = this.ctx; const k = this.weatherK;
    const W = VIEW_W * T, H = VIEW_H * T;
    if (k > 0) {
      ctx.fillStyle = `rgba(74,90,120,${0.26 * k})`; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = `rgba(207,224,242,${0.5 * k})`; ctx.lineWidth = 1; ctx.beginPath();
      for (const d of this.drops) {
        const y = (d.y + now * d.s) % (H + 10) - 10; const x = (d.x + now * d.s * 0.3) % (W + 10) - 10;
        ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5 + d.l / 3, y + d.l);
      }
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const x = ((now / 90 + i * 97) % (W + 160)) - 80, y = 60 + i * 26;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 70);
        g.addColorStop(0, `rgba(223,230,236,${0.12 * k})`); g.addColorStop(1, "rgba(223,230,236,0)");
        ctx.fillStyle = g; ctx.fillRect(x - 70, y - 70, 140, 140);
      }
    }
    if (k < 1) { ctx.fillStyle = `rgba(255,236,170,${0.14 * (1 - k)})`; ctx.fillRect(0, 0, W, H); }
  }
}
