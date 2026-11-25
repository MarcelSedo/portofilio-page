/**
 * The Long Spring: the game itself. One class, one canvas, one loop.
 *
 * The world: y grows in the direction you ride (down the screen), x is sideways and endless.
 * You stay near the top of the screen; the land comes up at you from below.
 * The monsters come from behind (the top of the screen), are a little faster than you,
 * and leap at you when they are close. You can't outrun them: lead them into things.
 */
import {
  BIOMES, GOAL_M, LETTER_GAP_M, LIFE, MISSION, MONSTERS, OBSTACLES, TUNE, huntersAt,
  type Kind, type Look, type MonsterId, type Mount, type PickKind, type Rider,
} from "./config";
import { emptyStats, type Mission, type Settings, type Stats } from "./meta";
import {
  FALLEN, GROUND_TILE, HERO, HERO_FRAMES, MONSTER_BOX, allLands, companionRun, fallenFrame, heroFrame, heroFrames, letterStone, mix, monsterFrames, pickSprites, trapSet,
  type Land, type Picks, type Spr,
} from "./sprites";
import { sfx } from "./sound";
import {
  COTTAGE_DOOR, GATE, SPRING_TREE, animalSprites, cottageSprites, gateSprite, springTreeSprites, villagerSprites, wellSprite, VILLAGER_KINDS,
  type AnimalId,
} from "./art-life";
import { GIFTS, MEMORIES, VILLAGE_KINDS, line as folkLine, personName, villageName, type GiftId, type VillageKind, type VillageSize } from "./story";

/** the height of the view in world units, whatever the screen */
export const VIEW_H = 600;
const PY_AT = 0.3; // where you ride, from the top
const CELL = 160;

type Obstacle = { id: number; kind: Kind; x: number; y: number; w: number; h: number; v: number; dead?: boolean; cleared?: boolean; vid?: number; scar?: boolean };
type Pick = { id: number; kind: PickKind; x: number; y: number; taken?: boolean; letter?: string };
/** life in the woods: crows and flies in the rot, butterflies and small birds where it is green */
type Critter = { kind: "crow" | "flies" | "butterfly" | "finch"; x: number; y: number; ph: number; c: string; flown?: number };
type Cell = { obs: Obstacle[]; picks: Pick[]; scar?: boolean; life?: Critter[] };
type MState = "emerge" | "run" | "windup" | "lunge" | "recover" | "stunned" | "rooted" | "dying" | "gone";
/** something alive the monsters would eat: an animal crossing, or someone from a village */
type Prey = {
  id: number; kind: AnimalId | "villager"; v: number; x: number; y: number; vx: number; vy: number;
  state: "idle" | "run" | "flee" | "safe" | "eaten" | "cheer" | "leave"; t: number; dir: number; door?: { x: number; y: number }; village?: number;
};
/** a village of the mission: it waits for a heart, then it is saved, or it is lost */
type Village = {
  id: number; kind: VillageKind; name: string; size: VillageSize; x: number; y0: number; y1: number;
  /** the glowing ring at its heart */
  ax: number; ay: number;
  /** spared: its people were led away by a healed glade; left: a glade nobody healed */
  state: "waiting" | "saved" | "lost" | "spared" | "left"; t: number; names: string[]; memory: number; told: boolean;
  /** a glade's memory that was found before: this time it comes back clear */
  clarify?: boolean;
  tree?: { x: number; y: number; big: boolean };
  /** the other way of a fork, and where the road splits */
  pair?: number; fork?: { x: number; y: number };
};
/** a gate of spring, standing where the next land begins */
type Gate = { y: number; land: number; gold: boolean; passed: boolean };
export type Mode = "endless" | "mission" | "tutorial";
type Monster = {
  id: number; type: MonsterId; x: number; y: number; vx: number; state: MState; timer: number; cool: number;
  judged: Set<number>; dodgeT: number; dodgeDir: number; blind: number; flinch: number; phase: number;
  aimX: number; lure?: Companion; how?: "pit" | "trap" | "arrow" | "sword" | "hound" | "dawn";
  /** meals: each one makes it faster and quicker to leap */
  fed?: number;
  /** made from the people of a lost village */
  turned?: boolean;
};
type Companion = { kind: "hound" | "raven" | "doe"; x: number; y: number; state: "follow" | "act" | "gone"; t: number; target?: Monster; vx: number; kills?: number };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number; ground?: boolean };

export type Choice = { rider: Rider; mount: Mount; look: Look };

export type Hud = {
  metres: number; kmh: number; score: number; multiplier: number; hearts: number; maxHearts: number;
  arrows: number; swords: number; maxSwords: number; traps: number; bark: boolean;
  ability: string; abilityReady: number; companion: string | null; danger: number;
  biome: string; wordGot: number; aiming: boolean;
  mode: Mode; souls: number; need: number; land: number; finale: boolean; finaleT: number;
};

export type GameEvent =
  | { type: "say"; text: string; important?: boolean }
  | { type: "mission"; slot: number }
  | { type: "letter"; got: number; done: boolean }
  | { type: "biome"; index: number }
  | { type: "seen"; monster: MonsterId }
  | { type: "seenKind"; kind: Kind | "prey" | "village" }
  | { type: "swordFirst" }
  | { type: "saved"; village: string; kind: VillageKind; size: VillageSize; names: string[]; memory: number; clear: boolean; line?: string; gift?: string }
  | { type: "lost"; village: string; kind: VillageKind; size: VillageSize }
  | { type: "gateOpen" }
  | { type: "tutorial"; step: number; done: boolean }
  | { type: "lesson"; text: string }
  /** a village saved: the world holds still for `hold` seconds while the card shows what it gave */
  | {
      type: "moment"; village: string; kind: VillageKind; size: VillageSize; names: string[]; gift?: string; giftId?: GiftId; memory: number; clear: boolean; hold: number;
      hearts: number; souls: number; need: number;
    }
  | { type: "end"; win: boolean; cause: string; metres: number; score: number; stats: Stats; mode: Mode; land: number; reborn: number };

export type Options = {
  choice: Choice;
  settings: Settings;
  multiplier: number;
  missions: Mission[];
  word: string;
  wordGot: number;
  seenSword: boolean;
  seenMonsters: string[];
  seenKinds: string[];
  /** a still picture of the land for the menus: no rider, no monsters, no loop */
  showcase?: boolean;
  /** the endless ride, the mission, or The First Morning (default: endless) */
  mode?: Mode;
  /** the land to start in: the mission's checkpoint, or where the endless ride is set */
  startLand?: number;
  /** memories already found (the next marked hamlet carries the next one of its land) */
  memories?: number[];
  /** memories that have already come back clear (found twice) */
  clear?: number[];
  /** after a saved village of 4 or 2 the world waits for the player (release); false for bots */
  holdMoments?: boolean;
  onHud: (h: Hud) => void;
  onEvent: (e: GameEvent) => void;
};

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash2 = (x: number, y: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
};

/** hit boxes, in world units */
const SIZE: Record<Kind, [number, number]> = {
  tree: [16, 10], boulder: [46, 16], menhir: [20, 10], stone: [18, 8], pit: [50, 20], log: [88, 12], thorns: [84, 12], arch: [104, 12],
  cottage: [104, 46], well: [28, 12],
};
const SEES_AS: Partial<Record<Kind, "tree" | "pit">> = {
  tree: "tree", boulder: "tree", menhir: "tree", stone: "tree", arch: "tree", pit: "pit", cottage: "tree", well: "tree",
};
const fmtN = (n: number) => Math.round(n).toLocaleString("en-GB");
/** world x of the gate arches nearest to x (one every 260 px) */
const archX = (x: number) => Math.round((x - 130) / 260) * 260 + 130;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** a frame number that is always inside 0..n-1, also for odd times (NaN or below zero) */
function wrap(i: number, n: number) {
  return Number.isFinite(i) ? ((i % n) + n) % n : 0;
}

export class Game {
  private ctx: CanvasRenderingContext2D;
  W = 400;
  private S = 2;
  private PY = VIEW_H * PY_AT;
  private o: Options;
  private hero: Spr[] = [];
  /** the rider and mount on the ground, drawn the first time it is needed */
  private fallen: Spr | null = null;
  private deathSeed = 1;
  private deathDir = 1;
  private lands: Land[] = [];
  private mons = {} as Record<MonsterId, Spr[]>;
  private picksArt!: Picks;
  private runArt = {} as Record<"hound" | "raven" | "doe", Spr[]>;
  private trapArt!: Spr;
  private letters = new Map<string, Spr>();
  private life!: { cottage: Spr[]; well: Spr; folk: Spr[][]; animals: Record<AnimalId, Spr[]>; gates: Spr[]; gold: Spr; trees: Spr[] };

  // world
  private seed = (Math.random() * 1e9) | 0;
  private cells = new Map<string, Cell>();
  private nextId = 1;
  private t = 0;
  private running = false;
  private over = false;
  private raf = 0;
  private last = 0;
  private hudT = 0;

  // you
  private x = 0;
  private y = 0;
  private vx = 0;
  private speed = 0;
  private air = 0;
  private airDur = 0;
  private duck = 0;
  private hearts: number;
  private inv = 0;
  private stun = 0;
  private dead = 0;
  private won = 0;
  private camX = 0;
  private shake = 0;
  private aimT = -1;
  private keys = { left: false, right: false };
  private arrows = 0;
  private swords = 0;
  private traps = 0;
  private bark = false;
  private shieldReady = true;
  private shieldAt = 0;
  private cool = 0;
  private comp: Companion | null = null;
  private mult: number;
  private trail: { t: number; x: number }[] = [];
  private score = 0;
  private endCause = "";

  // the hunt
  private monsters: Monster[] = [];
  private respawn = 1.5;
  private pending: { t: number; n: number }[] = [];
  private placed: { x: number; y: number; alive: boolean; id: number }[] = [];
  private shots: { x: number; y: number; vx: number; vy: number; life: number; spear?: boolean; to?: Obstacle }[] = [];
  private fx: Particle[] = [];
  private swing = 0;

  // progress
  private stats: Stats = emptyStats();
  private lastHit = 0;
  private swordAt = -1;
  private biome = 0;
  private trans = { from: 0, t: 1 };
  private wave = -1;
  private done = new Set<number>();
  private nextLetter = LETTER_GAP_M * 0.6;
  private wordGot: number;
  private extra: Pick[] = [];

  // life on the road
  private prey: Prey[] = [];
  private villages: Village[] = [];
  private nextAnimal = LIFE.animalsFrom;
  private floats: { x: number; y: number; text: string; t: number; c: string }[] = [];

  // the mission
  private mode: Mode;
  private startLand: number;
  private land: number;
  /** metres added for what turns up when (obstacles, monsters) when you start in a later land */
  private mOff: number;
  private gates: Gate[] = [];
  private souls = 0;
  private need = 0;
  private needBase = 0;
  private nextHeart = 60;
  private nextVillageM = 70;
  private villageRand = rng((Math.random() * 1e9) | 0);
  private memories: number[];
  private clear: number[];
  private forkNext = Math.random() < 0.5;
  private placesBuilt = 0;
  private forkSide = Math.random() < 0.5 ? -1 : 1;
  private trees: { x: number; y: number; big: boolean; t: number }[] = [];
  private finaleT = 0;
  /** the world holds still for a moment after a grove or a hamlet is saved */
  private freeze = 0;
  /** the world waits after a moment until the player rides on (release) */
  private holding = false;
  private giftGot: GiftId | undefined;
  private cheer: { x: number; y: number; v: number; at: number; reborn: boolean }[] = [];
  private reborn = 0;
  private savedAll: VillageKind[] = [];
  /** the wells left standing at the end (the reborn come out of them) */
  private wells: Obstacle[] = [];
  // The First Morning
  private tut = { step: -1, t: 0, x0: 0, y: 0, fail: false, c0: 0, vid: -1, done: 0 };
  /** how the last monster died (the lessons with weapons watch it) */
  private lastKill: Monster["how"] | undefined;

  constructor(private canvas: HTMLCanvasElement, opts: Options) {
    this.o = opts;
    this.ctx = canvas.getContext("2d")!;
    this.mode = opts.mode ?? "endless";
    this.startLand = Math.max(0, Math.min(BIOMES.length - 1, opts.startLand ?? 0));
    this.land = this.biome = this.startLand;
    this.trans = { from: this.startLand, t: 1 };
    this.mOff = BIOMES[this.startLand].from;
    this.memories = [...(opts.memories ?? [])];
    this.clear = [...(opts.clear ?? [])];
    this.needBase = this.need = MISSION.need[this.land];
    this.hearts = opts.choice.mount.hearts + (this.mode === "tutorial" ? 2 : 0);
    this.mult = opts.multiplier;
    this.wordGot = opts.wordGot;
    this.speed = this.targetSpeed();
    if (opts.showcase) this.y = 400;
    this.resize();
    if (this.mode === "tutorial") this.tutorialNext();
  }

  /* ---------------- outside controls ---------------- */

  /** draw every picture again at the screen's resolution */
  private bakeAll() {
    const S = this.S;
    this.lands = allLands(S);
    this.picksArt = pickSprites(S);
    this.trapArt = trapSet(S);
    this.letters.clear();
    for (const id of Object.keys(MONSTERS) as MonsterId[]) this.mons[id] = monsterFrames(S, id);
    for (const id of ["hound", "raven", "doe"] as const) this.runArt[id] = companionRun(S, id);
    this.hero = heroFrames(S, this.o.choice.rider.id, this.o.choice.mount.id, this.o.choice.look);
    this.fallen = null;
    this.life = {
      cottage: cottageSprites(S),
      well: wellSprite(S),
      folk: villagerSprites(S),
      animals: animalSprites(S),
      gates: BIOMES.map((b) => gateSprite(S, b.rock, b.leaves, b.flowers, false)),
      gold: gateSprite(S, BIOMES[3].rock, BIOMES[3].leaves, BIOMES[3].flowers, true),
      trees: springTreeSprites(S),
    };
  }

  setChoice(c: Choice) {
    this.o.choice = c;
    this.hero = heroFrames(this.S, c.rider.id, c.mount.id, c.look);
    this.fallen = null;
  }
  setSettings(s: Settings) {
    if (s.lessBlood !== this.o.settings.lessBlood) this.fallen = null;
    this.o.settings = s;
  }
  setMissions(m: Mission[], multiplier: number) {
    this.o.missions = m;
    this.mult = multiplier;
    this.done.clear();
  }
  markSwordSeen() {
    this.o.seenSword = true;
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cw = Math.max(1, Math.round(r.width * dpr));
    const ch = Math.max(1, Math.round(r.height * dpr));
    this.canvas.width = cw;
    this.canvas.height = ch;
    const S = ch / VIEW_H;
    this.W = cw / S;
    if (!this.lands.length || Math.abs(S - this.S) / this.S > 0.08) {
      this.S = S;
      this.bakeAll();
    } else this.S = S;
    this.draw();
  }

  start() {
    if (this.running || this.over || this.o.showcase) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      // the first frame's time can be a hair earlier than start(): never step backwards
      const dt = Math.max(0, Math.min(1 / 30, (now - this.last) / 1000));
      this.last = now;
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  /** ride on after a saved village's moment (the world still waits out its shortest hold) */
  release() {
    if (!this.holding) return;
    this.holding = false;
    this.keys.left = this.keys.right = false;
    this.inv = Math.max(this.inv, 0.8);
  }
  get held() {
    return this.holding;
  }
  pause() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.keys.left = this.keys.right = false;
    this.aimT = -1;
  }
  get paused() {
    return !this.running;
  }
  destroy() {
    this.pause();
    this.over = true;
  }

  /** keyboard and touch both land here */
  key(k: "left" | "right" | "up" | "down" | "aim" | "sword" | "trap" | "ability", down: boolean) {
    if (!this.running || this.dead || this.won || this.finaleT) return;
    if (k === "left" || k === "right") this.keys[k] = down;
    else if (k === "aim") {
      if (down && this.arrows > 0 && this.aimT < 0) this.aimT = 0;
      else if (down && this.arrows === 0) this.say("No arrows. Find a bow on the road.");
      else if (!down && this.aimT >= 0) this.fire();
    } else if (!down) return;
    else if (k === "up") this.jump();
    else if (k === "down") this.crouch();
    else if (k === "sword") this.strike();
    else if (k === "trap") this.dropTrap();
    else if (k === "ability") this.useAbility();
  }

  /* ---------------- helpers ---------------- */

  /** important lines (new obstacles, new monsters, what a thing does) stay on screen and are not pushed off by chatter */
  private say(text: string, important = false) {
    // in The First Morning the lesson stays on screen until the next one replaces it
    if (this.mode === "tutorial" && important) return this.o.onEvent({ type: "lesson", text });
    this.o.onEvent({ type: "say", text, important });
  }
  private get metres() {
    return this.y * TUNE.metresPerPx;
  }
  private kmhNow() {
    const [a, b] = this.o.choice.mount.kmh;
    return a + (b - a) * Math.min(1, (this.metres + this.mOff) / GOAL_M);
  }
  /** which land a place belongs to: the gates divide them */
  private landAtY(y: number) {
    let l = this.startLand;
    for (const g of this.gates) if (!g.gold && y >= g.y) l = g.land;
    return l;
  }
  private get maxHearts() {
    return this.mode === "endless" ? this.o.choice.mount.hearts : MISSION.maxHearts;
  }
  /** px per second for the mount's real speed */
  private targetSpeed() {
    return ((this.kmhNow() / 3.6) / TUNE.metresPerPx) * (this.o.settings.slow || this.mode === "tutorial" ? 0.75 : 1);
  }
  private maxSwords() {
    return this.o.choice.rider.id === "knight" ? 2 : 1;
  }

  private cell(i: number, j: number): Cell {
    const key = `${i},${j}`;
    let c = this.cells.get(key);
    if (!c) {
      c = this.genCell(i, j);
      this.cells.set(key, c);
    }
    return c;
  }

  private genCell(i: number, j: number): Cell {
    const r = rng(hash2(i + this.seed, j * 7919 + 13));
    const c: Cell = { obs: [], picks: [] };
    const y0 = j * CELL;
    if (y0 < 520 && !this.o.showcase) return c; // a calm start
    if (this.mode === "tutorial") return c; // The First Morning: only what the lesson puts there
    const m = y0 * TUNE.metresPerPx + this.mOff;
    const landHere = this.landAtY(y0);
    // patches of the rot stay behind in the healing lands: half of First Green, a fifth of Deep Green, here and there in Bloom
    const scarP = [0, 0.5, 0.2, 0.1][landHere] ?? 0;
    const scar = scarP > 0 && rng(hash2(Math.floor(i / 2) * 31 + this.seed, Math.floor(j / 2) * 17 + 5))() < scarP;
    c.scar = scar;
    const b = BIOMES[scar ? 0 : landHere];
    const ramp = Math.min(1, 0.5 + m / 3000);
    const n = Math.round(TUNE.density * b.busy * ramp * (0.7 + r() * 0.6));
    const ok = (k: Kind) => m >= OBSTACLES[k].from;
    const weights: [Kind, number][] = (
      [["tree", 30], ["boulder", 12], ["menhir", 5], ["stone", 7], ["pit", 9 * b.pits], ["log", 11], ["arch", 3.5], ["thorns", 6]] as [Kind, number][]
    ).filter(([k]) => ok(k));
    const total = weights.reduce((s, [, w]) => s + w, 0);
    // the gates stand in a clearing: nothing tall may stand in front of the arches or behind them
    const nearGate = (y: number, h: number) =>
      this.gates.some((gt) => {
        const d = y - gt.y;
        return d > -135 - h / 2 && d < 130 + h / 2;
      });
    const free = (x: number, y: number, w: number, h: number, gap = 14) =>
      !nearGate(y, h) &&
      c.obs.every((o) => Math.abs(o.x - x) > (o.w + w) / 2 + gap || Math.abs(o.y - y) > (o.h + h) / 2 + gap + 10);
    const add = (kind: Kind, x: number, y: number) => {
      const [w, h] = SIZE[kind];
      if (!free(x, y, w, h, kind === "tree" ? 8 : 16)) return false;
      c.obs.push({ id: this.nextId++, kind, x, y, w, h, v: Math.floor(r() * 3), scar: scar || undefined });
      return true;
    };
    for (let k = 0; k < n; k++) {
      let roll = r() * total;
      let kind: Kind = "tree";
      for (const [kk, w] of weights) {
        if ((roll -= w) < 0) {
          kind = kk;
          break;
        }
      }
      for (let tries = 0; tries < 6; tries++) {
        const x = i * CELL + 16 + r() * (CELL - 32);
        const y = y0 + 12 + r() * (CELL - 24);
        if (add(kind, x, y)) {
          // trees like company: sometimes a little grove
          if (kind === "tree" && r() < 0.3) {
            const more = 2 + Math.floor(r() * 3);
            for (let q = 0; q < more; q++) {
              const a = r() * Math.PI * 2;
              const d = 20 + r() * 26;
              add("tree", x + Math.cos(a) * d * 1.2, y + Math.sin(a) * d * 0.7);
            }
          }
          break;
        }
      }
    }
    const okPick = (x: number, y: number) => free(x, y, 12, 12, 6);
    {
      const dark = scar || landHere === 0;
      const life: Critter[] = [];
      const want = dark ? Math.floor(r() * 2.2) : 1 + Math.floor(r() * (1 + landHere));
      for (let q = 0; q < want; q++) {
        const kind: Critter["kind"] = dark ? (r() < 0.6 ? "crow" : "flies") : r() < 0.6 ? "butterfly" : "finch";
        const x = i * CELL + 10 + r() * (CELL - 20);
        const y = y0 + 10 + r() * (CELL - 20);
        const c2 = kind === "butterfly" ? ["#ffe46a", "#ff8ab0", "#8ad8ff", "#ffffff", "#ffb35a"][Math.floor(r() * 5)] : kind === "finch" ? ["#e8743a", "#e8c84a", "#5a8ad0"][Math.floor(r() * 3)] : "#151217";
        life.push({ kind, x, y, ph: r() * 10, c: c2 });
      }
      c.life = life;
    }
    // in the mission hearts are laid out ahead of you; weapons lie here and there in the land
    if (this.mode === "mission") {
      for (const [kind, p] of [["trap", 0.01], ["bow", 0.005], ["sword", 0.004], ["bark", 0.003]] as [PickKind, number][])
        if (r() < p) {
          const x = i * CELL + 18 + r() * (CELL - 36);
          const y = y0 + 18 + r() * (CELL - 36);
          if (okPick(x, y)) c.picks.push({ id: this.nextId++, kind, x, y });
        }
      return c;
    }
    if (this.mode !== "endless") return c;
    if (r() < 0.4) {
      const x0 = i * CELL + 24 + r() * (CELL - 48);
      const yy = y0 + 10 + r() * (CELL - 90);
      const bend = (r() - 0.5) * 3;
      for (let s = 0; s < 5; s++) {
        const x = x0 + Math.sin(s * 0.8) * bend * 7;
        const y = yy + s * 17;
        if (okPick(x, y)) c.picks.push({ id: this.nextId++, kind: "seed", x, y });
      }
    }
    const trapRate = this.o.choice.rider.id === "dryad" ? 0.08 : 0.04;
    const table: [PickKind, number][] = [
      ["trap", trapRate], ["sword", 0.028], ["bow", 0.024], ["bark", 0.016], ["heart", 0.016],
      ...(m > 400 ? ([["hound", 0.004], ["raven", 0.003], ["doe", 0.003]] as [PickKind, number][]) : []),
    ];
    for (const [kind, p] of table) {
      if (r() < p) {
        const x = i * CELL + 18 + r() * (CELL - 36);
        const y = y0 + 18 + r() * (CELL - 36);
        if (okPick(x, y)) c.picks.push({ id: this.nextId++, kind, x, y });
      }
    }
    return c;
  }

  private near(x: number, y: number, rx = 1, ry = 1) {
    const ci = Math.floor(x / CELL);
    const cj = Math.floor(y / CELL);
    const out: Cell[] = [];
    for (let i = ci - rx; i <= ci + rx; i++) for (let j = cj - ry; j <= cj + ry; j++) out.push(this.cell(i, j));
    return out;
  }

  private burst(x: number, y: number, n: number, colours: string[], speed = 80, ground = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.3 + Math.random());
      this.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.5, c: colours[i % colours.length], r: 0.8 + Math.random() * 1.6, ground });
    }
  }
  private gore(x: number, y: number, n: number) {
    if (this.o.settings.lessBlood) this.burst(x, y, n, ["#9a9a8a", "#6a7a5a", "#b8c0a8"], 60);
    else this.burst(x, y, n, ["#8a1018", "#b0141c", "#5a0a10"], 100, true);
  }

  /* ---------------- actions ---------------- */

  private jump() {
    if (this.air > 0 || this.duck > 0) return;
    this.airDur = this.o.choice.mount.jump;
    this.air = this.airDur;
    sfx.jump();
  }
  private crouch() {
    if (this.air > 0 || this.duck > 0) return;
    this.duck = 0.6;
    sfx.duck();
  }
  private aimAngle() {
    const period = this.o.choice.rider.id === "amazon" ? 2.6 : 1.6;
    return Math.sin((this.aimT * Math.PI * 2) / period) * ((65 * Math.PI) / 180);
  }
  private fire() {
    const a = this.aimAngle();
    this.aimT = -1;
    if (this.arrows <= 0) return;
    this.arrows--;
    const s = 420;
    this.shots.push({ x: this.x, y: this.y - 6, vx: Math.sin(a) * s, vy: this.speed - Math.cos(a) * s, life: 0.9 });
    sfx.arrow();
  }
  private hunting(m: Monster) {
    return m.state === "run" || m.state === "windup" || m.state === "lunge" || m.state === "recover" || m.state === "stunned" || m.state === "rooted";
  }
  private strike() {
    if (this.swords <= 0) return this.say("No sword. A sword is a last resort anyway.");
    const target = this.monsters
      .filter((m) => this.hunting(m) && this.y - m.y < 70 && this.y - m.y > -14 && Math.abs(m.x - this.x) < 42)
      .sort((a, b) => b.y - a.y)[0];
    this.swing = 0.25;
    if (!target) return this.say("Nothing within reach of the sword.");
    this.swords--;
    this.kill(target, "sword");
    this.stats.swordKills++;
    if (this.swordAt < 0) this.swordAt = this.metres;
    this.pending.push({ t: 2.2, n: 2 });
    this.say("Blood on the ground. Two more are coming.", true);
    if (!this.o.seenSword) {
      this.o.seenSword = true;
      this.o.onEvent({ type: "swordFirst" });
    }
  }
  private dropTrap() {
    if (this.traps <= 0) return this.say("No traps. Root traps lie on the road.");
    this.traps--;
    this.placed.push({ x: this.x, y: this.y - 16, alive: true, id: this.nextId++ });
  }
  private useAbility() {
    const r = this.o.choice.rider;
    if (r.id === "knight") return this.say(this.shieldReady ? "Your shield is ready." : "Your shield is still growing back.");
    if (this.cool > 0) return this.say(`${r.ability}: ready in ${Math.ceil(this.cool)} s.`);
    if (r.id === "dryad") {
      const m = this.monsters.filter((q) => this.hunting(q) && q.state !== "rooted" && this.y - q.y < 320).sort((a, b) => b.y - a.y)[0];
      if (!m) return this.say("No monster close enough for the roots.");
      m.state = "rooted";
      m.timer = 2.5;
      this.cool = r.cooldown;
      this.burst(m.x, m.y, 14, ["#6a4a2a", "#8ae05a"], 40);
      this.say("Roots hold it fast.");
    } else {
      const ahead = this.near(this.x, this.y + 100, 1, 1)
        .flatMap((c) => c.obs)
        .filter((o) => !o.dead && o.kind !== "pit" && o.y > this.y + 6 && o.y < this.y + 230 && Math.abs(o.x - this.x) < o.w / 2 + 10)
        .sort((a, b) => a.y - b.y)[0];
      this.shots.push({ x: this.x, y: this.y + 6, vx: 0, vy: this.speed + 480, life: 0.6, spear: true, to: ahead });
      this.cool = r.cooldown;
      if (!ahead) this.say("The spear flies, and hits nothing.");
    }
  }

  private kill(m: Monster, how: NonNullable<Monster["how"]>) {
    this.lastKill = how;
    m.state = "dying";
    m.timer = how === "pit" ? 0.8 : 0.5;
    m.how = how;
    this.respawn = Math.max(this.respawn, 4);
    if (how === "sword" || how === "hound") this.gore(m.x, m.y - 10, 30);
    else if (how === "arrow") this.burst(m.x, m.y - 10, 16, ["#cdb39a", "#93725f", "#b8ff5a"], 70);
    else if (how === "dawn") this.burst(m.x, m.y - 10, 24, ["#fff4c0", "#b8ff5a", "#ffffff"], 60);
    else if (how === "pit") this.burst(m.x, m.y, 16, ["#7dff4f", "#d8ff9a"], 50);
    else this.gore(m.x, m.y - 6, 16);
    sfx.kill();
  }

  private hurt(cause: string) {
    if (this.inv > 0 || this.dead) return;
    if (this.mode === "tutorial") {
      this.tut.fail = true;
      this.inv = 1;
      this.stun = 0.35;
      sfx.hit();
      this.say(`${cause}.`);
      return;
    }
    this.hearts--;
    this.inv = 1.2;
    this.stun = 0.35;
    this.shake = this.o.settings.calm ? 0 : 0.3;
    this.lastHit = this.metres;
    sfx.hit();
    this.gore(this.x, this.y - 8, 8);
    // the stumble: the nearest monster is suddenly on your neck
    const hunters = this.monsters.filter((m) => m.state === "run" || m.state === "recover").sort((a, b) => b.y - a.y);
    if (hunters[0]) {
      hunters[0].y = Math.max(hunters[0].y, this.y - TUNE.surgeTo);
      hunters[0].cool = Math.min(hunters[0].cool, 0.3);
    }
    for (const m of hunters.slice(1)) m.y += 60;
    if (this.hearts <= 0) this.die(cause);
    else this.say(hunters.length ? `${cause}. It is on your neck!` : `${cause}.`);
  }

  private die(cause: string) {
    if (this.dead) return;
    if (this.mode === "tutorial") {
      // The First Morning can't kill you: it only shows what would have happened
      for (const q of this.monsters) {
        q.state = "stunned";
        q.timer = 1.5;
        q.y = Math.min(q.y, this.y - 170);
      }
      this.inv = 1.5;
      this.say(`${cause}. In a real ride, that would be the end. Ride on, and lead it into a tree.`, true);
      return;
    }
    this.dead = 0.0001;
    this.deathSeed = (Math.random() * 1e6) | 0;
    this.deathDir = this.vx < -5 ? -1 : this.vx > 5 ? 1 : Math.random() < 0.5 ? -1 : 1;
    // whatever caught you stops a step behind the body and stands over it
    let n = 0;
    for (const q of this.monsters) {
      if (q.state === "dying" || q.state === "gone" || Math.abs(q.y - this.y) > 80 || Math.abs(q.x - this.x) > 90) continue;
      q.y = this.y - 62 - n * 16;
      q.x = this.x + (n === 0 ? -12 : n % 2 ? 44 : -60);
      q.state = "run";
      n++;
    }
    this.gore(this.x, this.y - 10, 44);
    sfx.death();
    this.say(cause);
    this.endCause = cause;
  }

  /* ---------------- the loop ---------------- */

  private step(dt: number) {
    this.t += dt;
    if (this.dead) {
      this.dead += dt;
      this.particles(dt);
      if (this.dead > 2) this.finish(false);
      return;
    }
    if (this.finaleT) return this.finaleStep(dt);
    if (this.freeze > 0 || this.holding) {
      this.freeze -= dt;
      this.particles(dt);
      for (const v of this.villages) if (v.state !== "waiting") v.t += dt;
      for (const p of this.prey) p.t += dt;
      if (this.freeze <= 0 && !this.holding) this.inv = Math.max(this.inv, 0.8);
      this.o.onHud(this.hud());
      return;
    }
    if (this.won) {
      this.won += dt;
      this.y += this.speed * dt * 0.5;
      this.particles(dt);
      if (this.won > 2.5) this.finish(true);
      return;
    }

    const mount = this.o.choice.mount;
    const target = this.targetSpeed();
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    let fwd = this.speed;
    if (this.stun > 0) {
      this.stun -= dt;
      fwd *= 0.45;
    }
    const steer = (this.keys.right ? 1 : 0) - (this.keys.left ? 1 : 0);
    const maxV = TUNE.steer * mount.turn * (this.aimT >= 0 ? 0.5 : 1) * (this.o.settings.slow ? 0.85 : 1);
    this.vx += (steer * maxV - this.vx) * Math.min(1, dt * TUNE.steerAccel * mount.turn);
    fwd *= 1 - 0.12 * Math.min(1, Math.abs(this.vx) / (TUNE.steer * 1.4));
    this.x += this.vx * dt;
    const m0 = this.metres;
    this.y += fwd * dt;
    const dm = this.metres - m0;
    this.camX += (this.x - this.camX) * Math.min(1, dt * 4);
    if (this.air > 0) this.air = Math.max(0, this.air - dt);
    if (this.duck > 0) this.duck = Math.max(0, this.duck - dt);
    if (this.inv > 0) this.inv -= dt;
    if (this.shake > 0) this.shake -= dt;
    if (this.swing > 0) this.swing -= dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.aimT >= 0) this.aimT += dt;
    // your scent: where you have been
    this.trail.push({ t: this.t, x: this.x });
    while (this.trail.length && this.trail[0].t < this.t - 1.5) this.trail.shift();

    const m = this.metres;
    this.stats.metres = m;
    this.stats.clean = Math.max(this.stats.clean, m - this.lastHit);
    this.stats.afterSword = this.swordAt >= 0 ? m - this.swordAt : 0;
    this.score += dm * this.mult;
    if (!this.shieldReady && this.o.choice.rider.id === "knight" && m - this.shieldAt >= 400) {
      this.shieldReady = true;
      this.say("Your shield has grown back.");
    }

    // a new season of the land
    const bi = this.landAtY(this.y);
    if (bi !== this.biome) {
      this.trans = { from: this.biome, t: 0 };
      this.biome = this.land = bi;
      this.wave = 0;
      for (const q of this.monsters) q.flinch = 2;
      if (this.hearts < mount.hearts) {
        this.hearts = mount.hearts;
        this.say("The land heals, and so do you: every heart is back.", true);
      }
      this.o.onEvent({ type: "biome", index: bi });
    }
    if (this.trans.t < 1) this.trans.t = Math.min(1, this.trans.t + dt / 2.5);
    // the gates of spring
    for (const gt of this.gates) if (!gt.passed && this.y >= gt.y) this.passGate(gt);
    if (this.finaleT) return;
    if (this.wave >= 0) this.wave = this.wave + dt > 1.4 ? -1 : this.wave + dt;

    // the game explains each new kind of obstacle the first time you see it
    for (const c of this.near(this.x, this.y + VIEW_H * 0.55, 2, 2))
      for (const o of c.obs) {
        const hint = OBSTACLES[o.kind].hint;
        if (!hint || this.o.seenKinds.includes(o.kind) || o.dead) continue;
        if (o.y < this.y + VIEW_H * (1 - PY_AT) - 40 && o.y > this.y + 60 && Math.abs(o.x - this.camX) < this.W / 2) {
          this.o.seenKinds.push(o.kind);
          this.say(hint, true);
          this.o.onEvent({ type: "seenKind", kind: o.kind });
        }
      }

    // you against the land
    const px0 = this.x - 7, px1 = this.x + 7, py0 = this.y - 4, py1 = this.y + 4;
    for (const c of this.near(this.x, this.y)) {
      for (const o of c.obs) {
        if (o.dead) continue;
        if (px1 < o.x - o.w / 2 || px0 > o.x + o.w / 2 || py1 < o.y - o.h / 2 || py0 > o.y + o.h / 2) continue;
        this.touch(o);
        if (this.dead) return;
      }
      for (const p of c.picks) if (!p.taken && Math.abs(p.x - this.x) < 20 && Math.abs(p.y - this.y) < 18) this.take(p);
    }
    for (const p of this.extra) if (!p.taken && Math.abs(p.x - this.x) < 20 && Math.abs(p.y - this.y) < 18) this.take(p);

    // the daily word: put the next letter on the road ahead
    if (this.mode === "endless" && this.wordGot < this.o.word.length && m >= this.nextLetter - 70) {
      const ly = this.nextLetter / TUNE.metresPerPx;
      if (!this.extra.some((p) => p.kind === "letter" && !p.taken)) {
        let lx = this.x + (Math.random() - 0.5) * 140;
        for (let k = 0; k < 10; k++) {
          const hit = this.near(lx, ly).some((c) => c.obs.some((o) => !o.dead && Math.abs(o.x - lx) < o.w / 2 + 16 && Math.abs(o.y - ly) < o.h / 2 + 16));
          if (!hit) break;
          lx += 24;
        }
        this.extra.push({ id: this.nextId++, kind: "letter", x: lx, y: ly, letter: this.o.word[this.wordGot] });
      }
      this.nextLetter += LETTER_GAP_M;
    }

    this.wildlife(dt);
    if (!this.o.showcase) this.missionStep(dt);
    if (this.mode === "tutorial") this.tutorialStep();
    this.hunt(dt);
    this.companion(dt);
    this.projectiles(dt);
    this.particles(dt);

    this.o.missions.forEach((mi, slot) => {
      if (!this.done.has(slot) && this.stats[mi.stat] >= mi.goal) {
        this.done.add(slot);
        this.mult++;
        sfx.mission();
        this.o.onEvent({ type: "mission", slot });
      }
    });


    if ((this.t * 4) % 1 < dt * 4) {
      const cj = Math.floor(this.y / CELL);
      const ci = Math.floor(this.x / CELL);
      for (const k of this.cells.keys()) {
        const [i, j] = k.split(",").map(Number);
        if (j < cj - 3 || Math.abs(i - ci) > 6) this.cells.delete(k);
      }
      this.extra = this.extra.filter((p) => p.y > this.y - 400);
      this.villages = this.villages.filter((v) => v.y1 > this.y - 700);
      this.trees = this.trees.filter((t) => t.y > this.y - 700);
      this.placed = this.placed.filter((p) => p.alive && p.y > this.y - 500);
    }

    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.1;
      this.o.onHud(this.hud());
    }
  }

  private touch(o: Obstacle) {
    const mount = this.o.choice.mount;
    const up = this.air > 0;
    switch (o.kind) {
      case "log":
      case "thorns":
        if (up) {
          if (!o.cleared && o.kind === "log") this.stats.logs++;
          o.cleared = true;
          return;
        }
        if (o.kind === "thorns" && mount.smashes) return this.smash(o);
        return this.hurt(o.kind === "log" ? "You hit a fallen trunk" : "The thorns caught you");
      case "arch":
        if (Math.abs(this.x - o.x) > 34) return this.hurt("You hit the arch's pillar");
        if (this.duck > 0) {
          if (!o.cleared) this.stats.branches++;
          o.cleared = true;
          return;
        }
        return this.hurt(up ? "You jumped into the stone arch" : "The stone arch knocked you down");
      case "pit":
        return this.hurt(!o.scar && BIOMES[this.landAtY(o.y)].well >= 3 ? "You rode into the stones of a well" : "The green fire burned you");
      case "stone":
        if (mount.smashes) return this.smash(o);
        return this.hurt("You hit a stone");
      case "tree":
        return this.hurt("You hit a tree");
      case "cottage":
        return this.hurt("You rode into a cottage wall");
      case "well":
        return this.hurt("You hit the well");
      default:
        return this.hurt("You hit a rock");
    }
  }
  private smash(o: Obstacle) {
    o.dead = true;
    this.burst(o.x, o.y - 6, 14, o.kind === "thorns" ? ["#3a5a2a", "#2a2218", "#a8202a"] : ["#8a8478", "#5a564c"], 80);
    sfx.crash();
  }

  private take(p: Pick) {
    p.taken = true;
    const r = this.o.choice.rider;
    switch (p.kind) {
      case "seed":
        this.stats.seeds++;
        this.score += 10 * this.mult;
        sfx.seed();
        return;
      case "bow":
        this.arrows = Math.min(9, this.arrows + (r.id === "amazon" ? 5 : 3));
        this.say(`A bow: ${this.arrows} arrows. Hold Space and a line swings behind you; let go to shoot.`, true);
        break;
      case "sword":
        if (this.swords >= this.maxSwords()) return void (p.taken = false);
        this.swords++;
        this.say("A sword (X). It kills, but blood calls two more.", true);
        break;
      case "trap":
        if (this.traps >= 3) return void (p.taken = false);
        this.traps++;
        this.say(`A root trap (${this.traps}). Drop it behind you with Z.`, true);
        break;
      case "bark":
        if (this.bark) return void (p.taken = false);
        this.bark = true;
        this.say("Bark armour: it stops one monster that catches you.", true);
        break;
      case "heart":
        if (this.hearts >= this.maxHearts) return void (p.taken = false);
        this.hearts++;
        this.say("A heart.");
        break;
      case "letter":
        this.wordGot++;
        this.o.onEvent({ type: "letter", got: this.wordGot, done: this.wordGot >= this.o.word.length });
        break;
      default:
        if (this.comp && this.comp.state !== "gone") return void (p.taken = false);
        this.comp = { kind: p.kind, x: p.x, y: p.y, state: "follow", t: 0, vx: 0 };
        this.stats.companions++;
        this.say(
          p.kind === "hound" ? "A great hound runs with you. It will throw itself at the first monster that comes close."
            : p.kind === "raven" ? "A raven flies with you. It will blind the monsters when they come."
              : "A white doe runs with you. She will lead one monster away.",
          true,
        );
    }
    sfx.pick();
  }

  /* ---------------- the gates and life on the road ---------------- */

  private float(x: number, y: number, text: string, c: string) {
    this.floats.push({ x, y, text, t: 1.4, c });
  }

  private passGate(gt: Gate) {
    gt.passed = true;
    const b = BIOMES[gt.land];
    const colours = gt.gold ? ["#fff4a0", "#ffffff", "#ffd86a"] : [...(b.flowers.length ? b.flowers : ["#ffe46a", "#ffffff"]), "#b8ffe0"];
    this.burst(this.x, this.y - 24, this.o.settings.calm ? 16 : 44, colours, 130);
    sfx.fanfare();
    if (gt.gold) return this.startFinale();
    this.souls = 0;
    this.needBase = this.need = MISSION.need[gt.land];
    this.landM = this.metres;
  }

  /** a free spot near x on the line y (for hearts and letters) */
  private freeX(x: number, y: number) {
    for (let k = 0; k < 12; k++) {
      const hit = this.near(x, y).some((c) => c.obs.some((o) => !o.dead && Math.abs(o.x - x) < o.w / 2 + 16 && Math.abs(o.y - y) < o.h / 2 + 16));
      if (!hit) break;
      x += k % 2 ? -24 * k : 24 * k;
    }
    return x;
  }

  /* ---------------- the mission: hearts, villages, gates ---------------- */

  private landM = 0;

  private missionStep(dt: number) {
    const m = this.metres;
    const pendingGate = this.gates.some((g) => !g.passed);
    if (this.mode === "mission") {
      // hearts in the land, a little more often the longer you stay in one land
      if (m >= this.nextHeart) {
        const [a, b] = MISSION.heartGap;
        const kind = Math.max(0.55, 1 - (m - this.landM) / 4000);
        this.nextHeart = m + (a + Math.random() * (b - a)) * kind;
        const y = this.y + (VIEW_H - this.PY) + 60;
        this.extra.push({ id: this.nextId++, kind: "heart", x: this.freeX(this.x + (Math.random() - 0.5) * 260, y), y });
      }
      if (m >= this.nextVillageM && !pendingGate) {
        const [a, b] = MISSION.villageGap;
        this.nextVillageM = m + a + Math.random() * (b - a);
        // half hamlets, half forks, never two forks running
        // forks are the big moments: about two places in five, never two in a row
        const first = this.placesBuilt === 0;
        this.placesBuilt++;
        if (first || (this.forkNext && Math.random() < 0.8)) {
          this.buildFork();
          this.forkNext = false;
        } else {
          this.buildVillage("hamlet");
          this.forkNext = Math.random() < 0.7;
        }
      }
      if (!pendingGate && this.souls >= this.need) this.openGate();
    } else if (this.mode === "endless" && !this.o.showcase && m >= this.nextVillageM + 200) {
      // the endless ride has villages too, without forks: a heart for souls, and a record of them
      this.nextVillageM = m + 260 + Math.random() * 180;
      const v = this.buildVillage(Math.random() < 0.55 ? "hamlet" : "village");
      if (!this.o.seenKinds.includes("endlessVillage")) {
        this.o.seenKinds.push("endlessVillage");
        this.o.onEvent({ type: "seenKind", kind: "village" });
        this.say(`${v.name} ahead: ride through the glowing ring to give it a heart. Every soul you save counts, next to the metres.`, true);
      }
    }
    for (const v of this.villages) {
      if (v.state !== "waiting") {
        v.t += dt;
        continue;
      }
      if (Math.abs(this.x - v.ax) < 26 && Math.abs(this.y - v.ay) < 22) {
        if (v.kind === "glade" || this.hearts >= 2) this.saveVillage(v);
        else if (!v.told) {
          v.told = true;
          this.say("You have one heart left. Give it, and you die: you can't.", true);
        }
      } else if (this.y > v.y1 + 40) {
        // a fork is lost only when both ways are passed by
        const other = v.pair !== undefined ? this.villages.find((w) => w.id === v.pair) : undefined;
        if (v.kind === "glade") {
          v.state = "left";
          v.t = 0;
        } else this.loseVillage(v);
        if (other && other.state === "waiting" && other.kind === "glade") {
          other.state = "left";
          other.t = 0;
        }
      }
    }
  }

  private openGate() {
    const gold = this.land >= BIOMES.length - 1;
    const y = this.y + MISSION.gateAhead;
    this.gates.push({ y, land: gold ? this.land : this.land + 1, gold, passed: false });
    for (let i = Math.floor((this.x - 1200) / CELL); i <= Math.floor((this.x + 1200) / CELL); i++)
      for (let j = Math.floor((y - 300) / CELL); j <= Math.floor((y + 300) / CELL); j++) {
        const key = `${i},${j}`;
        const c = this.cells.get(key);
        if (!c) continue;
        for (const o of c.obs) if (o.y > y - 140 - o.h / 2 && o.y < y + 135 + o.h / 2) o.dead = true;
      }
    sfx.chime();
    this.o.onEvent({ type: "gateOpen" });
    this.say(
      gold
        ? "Enough souls. Far ahead, the golden gate has opened: the end of the road."
        : `Enough souls. A gate of spring has opened ahead: beyond it, ${BIOMES[this.land + 1].name}.`,
      true,
    );
  }

  /** clear the land in a rectangle (a village is built there) */
  private clearArea(inside: (x: number, y: number) => boolean, x0: number, x1: number, y0: number, y1: number) {
    for (let i = Math.floor(x0 / CELL); i <= Math.floor(x1 / CELL); i++)
      for (let j = Math.floor(y0 / CELL); j <= Math.floor(y1 / CELL); j++) {
        const c = this.cell(i, j);
        for (const o of c.obs) if (inside(o.x, o.y)) o.dead = true;
        for (const p of c.picks) if (inside(p.x, p.y)) p.taken = true;
      }
    this.extra = this.extra.filter((p) => !inside(p.x, p.y));
  }

  /** the next memory a healed glade gives: the first one not found yet, or else the first one not yet clear */
  private nextMemory(): { memory: number; clarify: boolean } {
    const assigned = new Set(this.villages.filter((v) => v.state === "waiting").map((v) => v.memory));
    const missing = MEMORIES.findIndex((mm, i) => mm.land <= this.land && !this.memories.includes(i) && !assigned.has(i));
    if (missing >= 0) return { memory: missing, clarify: false };
    const dim = this.memories.filter((i) => !this.clear.includes(i) && !assigned.has(i)).sort((a, b) => a - b)[0];
    return dim === undefined ? { memory: -1, clarify: false } : { memory: dim, clarify: true };
  }

  /**
   * A place to heal. The hamlet stands near the road; the village and the glade are the two ways of a fork
   * (see buildFork), `cx` and `y0` given.
   */
  private buildVillage(kind: VillageKind, at?: { cx: number; y0: number; toRoad: number }) {
    const r = this.villageRand;
    const side = Math.random() < 0.5 ? -1 : 1;
    const cx = at?.cx ?? this.x + side * (40 + Math.random() * 70);
    const toRoad = at?.toRoad ?? -side;
    const y0 = at?.y0 ?? this.y + (VIEW_H - this.PY) + 120;
    const y1 = y0 + 170;
    const half = kind === "glade" ? 120 : 110;
    const inside = (x: number, y: number) => x > cx - half && x < cx + half && y > y0 - 70 && y < y1 + 40;
    this.clearArea(inside, cx - half - 20, cx + half + 20, y0 - 80, y1 + 60);
    const id = this.nextId++;
    const place = (k: Kind, x: number, y: number, v: number) => {
      const [w, h] = SIZE[k];
      const o: Obstacle = { id: this.nextId++, kind: k, x, y, w, h, v, vid: id };
      this.cell(Math.floor(x / CELL), Math.floor(y / CELL)).obs.push(o);
      return o;
    };
    const souls = VILLAGE_KINDS[kind].souls as VillageSize;
    let ax = cx;
    const ay = y0 + 96;
    if (kind !== "glade") {
      const house = place("cottage", cx - toRoad * 30 + (Math.random() - 0.5) * 8, y0 + 40, Math.floor(Math.random() * 2));
      ax = cx + toRoad * 64;
      const d = { x: house.x + COTTAGE_DOOR[house.v], y: house.y + house.h / 2 + 1 };
      for (let k = 0; k < souls; k++)
        this.prey.push({
          id: this.nextId++, kind: "villager", v: Math.floor(Math.random() * VILLAGER_KINDS),
          x: d.x + (k % 2 ? 1 : -1) * (10 + Math.random() * 22), y: d.y + 12 + Math.random() * 22, vx: 0, vy: 0,
          state: "idle", t: Math.random() * 3, dir: Math.random() < 0.5 ? -1 : 1, door: d, village: id,
        });
    }
    let memory = -1;
    let clarify = false;
    if (kind === "glade" && this.mode === "mission") ({ memory, clarify } = this.nextMemory());
    const names = Array.from({ length: souls }, () => personName(r));
    const tree = kind === "glade" ? undefined : { x: ax - toRoad * 70, y: ay + 34, big: kind === "village" };
    const v: Village = { id, kind, name: villageName(r), size: souls, x: cx, y0, y1, ax, ay, state: "waiting", t: 0, names, memory, told: false, tree, clarify };
    this.villages.push(v);
    return v;
  }

  /** where the road forks: a village one way, a choked glade the other, as far from the road each, both on one line */
  private buildFork(at?: number) {
    const road = at ?? this.x;
    const [a, b] = MISSION.forkOff;
    const off = a + Math.random() * (b - a);
    // the village and the glade take turns on the left and the right, now and then not
    this.forkSide = Math.random() < 0.75 ? -this.forkSide : this.forkSide;
    const side = this.forkSide;
    const y0 = this.y + (VIEW_H - this.PY) + MISSION.forkAhead;
    const fork = { x: road, y: y0 - 230 };
    const vil = this.buildVillage("village", { cx: road + side * off, y0, toRoad: -side });
    const gl = this.buildVillage("glade", { cx: road - side * off, y0, toRoad: side });
    vil.pair = gl.id;
    gl.pair = vil.id;
    vil.fork = gl.fork = fork;
    // the two paths are cleared, so both ways can be ridden
    for (const v of [vil, gl])
      for (let k = 0; k <= 12; k++) {
        const t = k / 12;
        const [px, py] = this.trailAt(fork, v, t);
        this.clearArea((x, y) => Math.hypot(x - px, y - py) < 46, px - 70, px + 70, py - 70, py + 70);
      }
    this.clearArea((x, y) => Math.hypot(x - fork.x, y - fork.y) < 60, fork.x - 80, fork.x + 80, fork.y - 80, fork.y + 80);
    // the way to the glade has a weapon lying on it: one more reason to go there
    if (this.villageRand() < 0.6) {
      const [wx, wy] = this.trailAt(fork, gl, 0.45 + this.villageRand() * 0.25);
      const weapons: PickKind[] = ["bow", "sword", "trap", "bow", "trap", "bark"];
      this.extra.push({ id: this.nextId++, kind: weapons[Math.floor(this.villageRand() * weapons.length)], x: wx, y: wy });
    }
    if (!this.o.seenKinds.includes("fork")) {
      this.o.seenKinds.push("fork");
      this.o.onEvent({ type: "seenKind", kind: "village" });
      this.say(`The road forks. ${side < 0 ? "Left" : "Right"}: ${vil.name}, two souls. ${side < 0 ? "Right" : "Left"}: a glade choked by the rot. You can heal only one.`, true);
    } else this.say(`A fork: ${vil.name} (two souls) or a glade${gl.memory >= 0 ? (gl.clarify ? ", with a memory to clear" : ", with a memory") : ""}.`);
  }

  /** a point on the path from the fork to a village's ring, t from 0 to 1 */
  private trailAt(f: { x: number; y: number }, v: Village, t: number): [number, number] {
    const c1x = f.x;
    const c1y = f.y + (v.ay - f.y) * 0.55;
    const c2x = v.ax;
    const c2y = f.y + (v.ay - f.y) * 0.45;
    const u = 1 - t;
    return [
      u * u * u * f.x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * v.ax,
      u * u * u * f.y + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * (v.ay - 6),
    ];
  }

  private saveVillage(v: Village) {
    v.state = "saved";
    v.t = 0;
    const glade = v.kind === "glade";
    if (!glade) this.hearts--;
    this.souls += v.size;
    this.stats.souls += v.size;
    this.stats.villagesSaved++;
    this.savedAll.push(v.kind);
    sfx.fanfare();
    const b = BIOMES[this.land];
    this.burst(v.ax, v.ay - 10, this.o.settings.calm ? 20 : 60, [...(b.flowers.length ? b.flowers : ["#ffe46a", "#ffffff"]), "#b8ffe0", "#ff8ab0"], 140);
    for (const p of this.prey)
      if (p.village === v.id && p.state !== "eaten") {
        p.state = "cheer";
        p.t = Math.random();
      }
    if (v.tree) this.trees.push({ ...v.tree, t: this.t });
    const other = v.pair !== undefined ? this.villages.find((w) => w.id === v.pair) : undefined;
    let giftText: string | undefined;
    let said = "";
    let clear = false;
    if (glade) {
      // the animals come back; one of them walks with Brigid (or, if one already does, the land arms her)
      const walking = this.comp && this.comp.state !== "gone";
      const pool = GIFTS.filter((gf) => (walking ? ["sword", "bow", "traps", "bark"] : ["hound", "raven", "doe"]).includes(gf.id));
      let roll = this.villageRand() * pool.reduce((n, gf) => n + gf.weight, 0);
      const gf = pool.find((x) => (roll -= x.weight) < 0) ?? pool[0];
      giftText = this.applyGift(gf.id, gf.text);
      for (let k = 0; k < 3; k++)
        this.prey.push({
          id: this.nextId++, kind: (["deer", "hare", "hare"] as AnimalId[])[k], v: 0,
          x: v.ax + (k - 1) * 46 + (Math.random() - 0.5) * 12, y: v.ay - 30 + (k % 2) * 34, vx: 0, vy: 0,
          state: "cheer", t: Math.random(), dir: k === 0 ? -1 : 1, village: v.id,
        });
      if (v.memory >= 0) {
        if (v.clarify) {
          if (!this.clear.includes(v.memory)) this.clear.push(v.memory);
          clear = true;
        } else {
          this.memories.push(v.memory);
          this.stats.memoriesFound++;
        }
      }
      // its creatures lead the people of the other way into the woods
      if (other && other.state === "waiting") {
        other.state = "spared";
        other.t = 0;
        for (const p of this.prey)
          if (p.village === other.id && p.state !== "eaten") {
            p.state = "leave";
            p.door = { x: v.ax + (Math.random() - 0.5) * 60, y: v.ay - 10 };
          }
      }
      said = other ? `The glade breathes again, and its creatures lead the people of ${other.name} into the woods.` : "The glade breathes again.";
    } else {
      if (other && other.state === "waiting") {
        other.state = "left";
        other.t = 0;
      }
      said = v.kind === "village" ? `${v.names[0]} and ${v.names[1].split(" ")[0]} of ${v.name} are saved.` : `${v.names[0]} of ${v.name} is saved.`;
    }
    this.say(said, false);
    if (v.kind !== "hamlet" && this.mode !== "endless") {
      this.freeze = MISSION.moment[v.kind];
      this.holding = this.o.holdMoments !== false;
      this.keys.left = this.keys.right = false;
      this.o.onEvent({
        type: "moment", village: v.name, kind: v.kind, size: v.size, names: v.names, gift: giftText, giftId: glade ? this.giftGot : undefined,
        memory: v.memory, clear, hold: this.freeze, hearts: this.hearts, souls: this.souls, need: this.need,
      });
    }
    this.o.onEvent({
      type: "saved", village: v.name, kind: v.kind, size: v.size, names: v.names, memory: v.memory, clear,
      line: v.kind === "village" ? folkLine(this.villageRand) : undefined, gift: giftText,
    });
  }

  /** people nobody came for: their souls come off the count, and the rot makes one of them into a monster */
  private loseVillage(v: Village) {
    v.state = "lost";
    v.t = 0;
    if (this.mode !== "endless") this.souls = Math.max(0, this.souls - v.size);
    this.stats.villagesLost++;
    for (const p of this.prey)
      if (p.village === v.id && p.state !== "eaten") {
        p.state = "eaten";
        this.burst(p.x, p.y - 10, 14, ["#7dff4f", "#2a5a1a", "#1a1420"], 70);
      }
    sfx.eat();
    if (this.mode === "endless") {
      // on the endless road a village passed by is only lost: no souls taken, no monster
      this.say(`${v.name} is lost.`);
      this.o.onEvent({ type: "lost", village: v.name, kind: v.kind, size: v.size });
      return;
    }
    const turned = this.monsters.filter((q) => q.turned && q.state !== "gone" && q.state !== "dying").length;
    if (this.mode === "mission" && turned < MISSION.turnedMax) this.spawnMonster(v.ax, v.ay - 20, true);
    this.say(`${v.name} is lost: −${v.size} ${v.size === 1 ? "soul" : "souls"}. The rot takes them, and one comes after you.`, true);
    this.o.onEvent({ type: "lost", village: v.name, kind: v.kind, size: v.size });
  }

  /** what the people of a hamlet give you; returns how it reads */
  private applyGift(id: GiftId, text: string): string {
    this.giftGot = id;
    switch (id) {
      case "sword":
        if (this.swords < this.maxSwords()) this.swords++;
        else return this.applyGift("bow", "a bow and five arrows");
        return `${text} (X). It kills, but blood calls two more`;
      case "bow":
        this.arrows = Math.min(9, this.arrows + 5);
        return `${text}: hold Space to aim, let go to shoot`;
      case "traps":
        this.traps = Math.min(3, this.traps + 2);
        return `${text}: drop them behind you with Z`;
      case "bark":
        if (this.bark) return this.applyGift("traps", "two root traps");
        this.bark = true;
        return `${text}: it stops one monster that catches you`;
      case "heart":
        if (this.hearts >= this.maxHearts) return this.applyGift("traps", "two root traps");
        this.hearts++;
        return text;
      default:
        if (this.comp && this.comp.state !== "gone") return this.applyGift("bow", "a bow and five arrows");
        this.comp = { kind: id, x: this.x, y: this.y - 20, state: "follow", t: 0, vx: 0 };
        this.stats.companions++;
        return text;
    }
  }

  /* ---------------- the end of the mission ---------------- */

  private startFinale() {
    this.finaleT = 0.0001;
    for (const q of this.monsters) if (this.hunting(q) || q.state === "emerge") this.kill(q, "dawn");
    this.reborn = this.hearts;
    this.keys.left = this.keys.right = false;
    this.aimT = -1;
    sfx.chime();
    const W = this.W;
    // the rot dissolves: pits, thorns and dead wood go; trees and stones stay, and it is a meadow
    const obs: Obstacle[] = [];
    for (let i = Math.floor((this.x - W) / CELL); i <= Math.floor((this.x + W) / CELL); i++)
      for (let j = Math.floor((this.y - 300) / CELL); j <= Math.floor((this.y + 600) / CELL); j++)
        for (const o of this.cell(i, j).obs) {
          if (o.dead) continue;
          if (o.kind === "pit" && !o.scar) obs.push(o);
          else if (o.kind === "pit" || o.kind === "thorns" || o.kind === "log") {
            o.dead = true;
            this.burst(o.x, o.y - 6, 6, ["#ffe46a", "#ffffff", "#b8ffe0"], 50);
          } else obs.push(o);
        }
    const n = Math.min(40, this.stats.souls);
    const spots: [number, number][] = [];
    this.wells = obs.filter((o) => o.kind === "pit");
    const clear = (x: number, y: number) => obs.every((o) => Math.abs(o.x - x) > o.w / 2 + 14 || y < o.y - 4 || y > o.y + o.h / 2 + 40);
    for (let i = 0; i < n + this.reborn; i++) {
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 30; tries++) {
        x = this.x + (Math.random() - 0.5) * Math.min(W * 0.9, 700);
        y = this.y + 60 + Math.random() * 280;
        if (Math.abs(x - this.x) < 50 && y < this.y + 120) continue;
        if (clear(x, y) && spots.every(([sx, sy]) => Math.hypot(sx - x, (sy - y) * 1.6) > 22)) break;
      }
      // the reborn come up out of the wells, when there are wells to come out of
      const w = i >= n && this.wells.length ? this.wells[(i - n) % this.wells.length] : undefined;
      spots.push(w ? [w.x + ((i % 3) - 1) * 16, w.y + 14 + Math.floor(i / 3) % 2 * 10] : [x, y]);
    }
    this.cheer = spots.map(([x, y], i) => ({
      x, y, v: Math.floor(Math.random() * VILLAGER_KINDS),
      at: i < n ? 1.6 + i * 0.06 : 6.2 + (i - n) * 0.55,
      reborn: i >= n,
    }));
    const groves = this.savedAll.filter((s) => s !== "glade");
    groves.slice(0, 14).forEach((sz, i) => {
      const left = i % 2 === 0;
      this.trees.push({
        x: this.x + (left ? -1 : 1) * (130 + Math.random() * Math.min(260, W / 2 - 150)),
        y: this.y - 40 + Math.random() * 320,
        big: sz === "village",
        t: this.t + 0.8 + i * 0.25,
      });
    });
  }

  /** the end: no more hunt, the land blooms round her, the saved gather, and her hearts become people */
  private finaleStep(dt: number) {
    this.finaleT += dt;
    this.speed *= Math.exp(-dt * 1.4);
    this.y += this.speed * dt;
    this.camX += (this.x - this.camX) * Math.min(1, dt * 2);
    this.particles(dt);
    const last = 6.2 + this.reborn * 0.55;
    for (const c of this.cheer)
      if (c.reborn && this.finaleT >= c.at && this.finaleT - dt < c.at) {
        this.hearts = Math.max(0, this.hearts - 1);
        this.burst(c.x, c.y - 16, 18, ["#ffffff", "#fff4a0", "#b8ffe0"], 70);
        sfx.pick();
      }
    if (this.finaleT > last + 3.2) this.finish(true);
  }

  /** jump to the last moment of the finale */
  skipFinale() {
    if (!this.finaleT) return;
    this.finaleT = 6.2 + this.reborn * 0.55 + 2.4;
    this.hearts = 0;
  }

  /* ---------------- The First Morning: the lesson ---------------- */

  private tutorialNext() {
    const T = this.tut;
    T.step++;
    T.t = this.t;
    T.x0 = this.x;
    T.fail = false;
    const ahead = this.y + (VIEW_H - this.PY) + 40;
    const put = (kind: Kind, x: number, y: number) => {
      const [w, h] = SIZE[kind];
      this.cell(Math.floor(x / CELL), Math.floor(y / CELL)).obs.push({ id: this.nextId++, kind, x, y, w, h, v: 0 });
    };
    const say = (t: string) => this.say(t, true);
    switch (T.step) {
      case 0:
        say("The First Morning. Brigid wakes at the bottom of the ravine, on the back of a great elk. Steer with ← → (A D, or the buttons below).");
        break;
      case 1:
        put("log", this.x, ahead);
        T.y = ahead;
        say("A fallen trunk lies across the way. Jump it: ↑ (W). Wood on the ground is always jumped.");
        break;
      case 2:
        put("arch", this.x, ahead);
        T.y = ahead;
        say("A stone arch. Duck under its middle: ↓ (S). The pillars are solid.");
        break;
      case 3:
        for (let k = 0; k < 3; k++) this.extra.push({ id: this.nextId++, kind: "heart", x: this.x + (k - 1) * 70, y: ahead + k * 20 });
        T.y = ahead + 60;
        T.c0 = this.hearts;
        say("Hearts lie in the land. They are your life, and what you give to save others. Take one.");
        break;
      case 4:
        T.c0 = this.stats.crashed;
        this.spawnMonster();
        for (let k = 0; k < 4; k++) put("tree", this.x + (k % 2 ? 70 : -70), ahead + 60 + k * 170);
        T.y = ahead + 900;
        say("Something has followed you out of the dark. You can't outrun it. Ride close past a tree and it will run straight into it.");
        break;
      case 5: {
        const v = this.buildVillage("hamlet", { cx: this.x - 40, y0: ahead + 80, toRoad: 1 });
        T.vid = v.id;
        say(`A hamlet: one soul. Ride through the glowing ring by the cottage to give it one of your hearts.`);
        break;
      }
      case 6: {
        this.buildFork(this.x);
        const vs = this.villages.slice(-2);
        T.vid = vs[0].id;
        T.c0 = vs[1].id;
        say("The road forks. One way, a village: two souls, for a heart. The other, a glade the rot is choking: no souls, no heart, but an animal friend and a memory. Heal one of them.");
        break;
      }
      case 7:
        this.lastKill = undefined;
        this.arrows = 5;
        this.spawnMonster(this.x + 40, this.y - 230);
        say("A bow and five arrows. Hold Space: a line swings behind you. Let go when it points at the monster.");
        break;
      case 8:
        this.lastKill = undefined;
        this.traps = 2;
        this.spawnMonster(this.x, this.y - 190);
        say("Root traps. When the monster runs right behind you, drop one with Z: it runs into it.");
        break;
      case 9:
        this.lastKill = undefined;
        T.done = 0;
        this.swords = 1;
        this.spawnMonster(this.x, this.y - 170);
        say("The sword, the last resort. Let the monster come close, and when it is on your neck, strike with X.");
        break;
      case 10:
        this.gates.push({ y: this.y + 700, land: 1, gold: false, passed: false });
        say("Enough souls: a gate of spring has opened. Ride through it. Beyond it the land is greener.");
        break;
      default:
        say("You are ready. The mission begins where the rot is deepest.");
        this.o.onEvent({ type: "tutorial", step: T.step, done: true });
        this.finish(true);
        return;
    }
    this.o.onEvent({ type: "tutorial", step: T.step, done: false });
  }

  private tutorialStep() {
    const T = this.tut;
    const again = (why: string) => {
      this.say(why, true);
      T.step--;
      this.tutorialNext();
    };
    switch (T.step) {
      case 0:
        if (Math.abs(this.x - T.x0) > 60 && this.t - T.t > 1.5) this.tutorialNext();
        break;
      case 1:
      case 2:
        if (this.y > T.y + 30) {
          if (T.fail) again("Not quite. Again.");
          else this.tutorialNext();
        }
        break;
      case 3:
        if (this.hearts > T.c0) this.tutorialNext();
        else if (this.y > T.y + 80) again("You rode past it. Another one.");
        break;
      case 4:
        if (this.stats.crashed > T.c0) {
          for (const q of this.monsters) if (this.hunting(q) || q.state === "emerge" || q.state === "stunned") this.kill(q, "dawn");
          this.say("That is the whole art of it: you lead them into the land.", true);
          this.tutorialNext();
        } else if (this.y > T.y) {
          for (const q of this.monsters) this.kill(q, "dawn");
          again("Let's try that again: pass close by a tree, and it will follow you into it.");
        }
        break;
      case 5:
      case 6: {
        const vs = this.villages.filter((vv) => vv.id === T.vid || (T.step === 6 && vv.id === T.c0));
        if (!vs.length) break;
        const saved = vs.find((v) => v.state === "saved");
        if (saved && saved.t > 1.2) {
          if (this.hearts < 3) this.hearts = 3;
          for (const q of this.monsters) if (q.turned) this.kill(q, "dawn");
          this.tutorialNext();
        } else if (vs.some((v) => v.state === "lost")) {
          this.hearts = Math.max(this.hearts, 3);
          for (const q of this.monsters) this.kill(q, "dawn");
          again(T.step === 5 ? "In a real ride its soul would be lost, and come after you as a monster. Again: ride through the ring." : "You rode past both: in a real ride the village would be lost. Again: choose one.");
        }
        break;
      }
      case 7:
      case 8:
      case 9: {
        const want = T.step === 7 ? "arrow" : T.step === 8 ? "trap" : "sword";
        const alive = this.monsters.some((q) => this.hunting(q) || q.state === "emerge");
        if (T.step === 9 && T.done) {
          // the price of the sword: two more come out of the blood; then the lesson ends
          if (this.t - T.done > 3.2) {
            for (const q of this.monsters) if (this.hunting(q) || q.state === "emerge") this.kill(q, "dawn");
            this.pending = [];
            this.say("That is the price: every sword kill brings two more. Keep the sword for when nothing else will do.", true);
            this.tutorialNext();
          }
          break;
        }
        if (this.lastKill === want) {
          if (T.step === 9) {
            T.done = this.t;
            break;
          }
          this.say(T.step === 7 ? "A clean shot." : "Caught in the roots.", true);
          this.tutorialNext();
        } else if (!alive && this.t - T.t > 1.5) {
          // it died some other way, or ran off: another one, and more of what you need
          if (T.step === 7) this.arrows = Math.max(this.arrows, 5);
          if (T.step === 8) this.traps = Math.max(this.traps, 2);
          if (T.step === 9) this.swords = Math.max(this.swords, 1);
          this.lastKill = undefined;
          this.spawnMonster(this.x + (T.step === 7 ? 40 : 0), this.y - 200);
          this.say(T.step === 7 ? "Another one. Hold Space, aim, let go." : T.step === 8 ? "Another one. Z when it is right behind you." : "Another one. X when it is on your neck.", true);
        } else if (T.step === 7 && this.arrows <= 0 && this.shots.length === 0) {
          this.arrows = 5;
          this.say("Five more arrows. The line swings: let go when it points at the monster.", true);
        } else if (T.step === 8 && this.traps <= 0 && !this.placed.some((tr) => tr.alive)) {
          this.traps = 2;
          this.say("Two more traps. Drop one when the monster is right behind you.", true);
        }
        break;
      }
      case 10:
        if (this.gates.every((g) => g.passed) && this.t - T.t > 1) this.tutorialNext();
        break;
    }
  }

  /** animals crossing the road, and the people of the villages */
  private wildlife(dt: number) {
    const m = this.metres;
    if (this.mode !== "tutorial" && m + this.mOff >= this.nextAnimal) {
      const [a, b] = LIFE.animalGap;
      this.nextAnimal = m + this.mOff + a + Math.random() * (b - a);
      const kinds: AnimalId[] = this.biome <= 1 ? ["hare"] : ["hare", "hare", "fox", "deer"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      const dir = Math.random() < 0.5 ? -1 : 1;
      const sp = kind === "hare" ? 95 : kind === "fox" ? 105 : 120;
      // it comes in from the side and crosses your line about when the hunt behind you gets there
      const dy = 170 + Math.random() * 100;
      const vy = 50 + Math.random() * 30;
      let lag = Infinity;
      for (const q of this.monsters) if (this.hunting(q)) lag = Math.min(lag, this.y - q.y);
      lag = Number.isFinite(lag) ? Math.max(40, Math.min(300, lag)) : 120;
      // sometimes a little early, sometimes late: whether the hunt meets it is partly up to you
      const when = ((dy + lag) / Math.max(40, this.speed * (1 + TUNE.monsterGain) - vy)) * (0.7 + Math.random() * 0.6);
      this.prey.push({
        id: this.nextId++, kind, v: 0, x: this.x - dir * sp * when, y: this.y + dy,
        vx: dir * sp, vy, state: "run", t: Math.random(), dir,
      });
      if (!this.o.seenKinds.includes("prey")) {
        this.o.seenKinds.push("prey");
        this.o.onEvent({ type: "seenKind", kind: "prey" });
        this.say(
          this.mode === "endless"
            ? `A ${kind} is crossing. The monsters are hungry: if one catches it, it stops to eat, then runs faster, and you lose points. Keep the hunt away from it.`
            : `A ${kind} is crossing. The monsters are hungry: if one catches it, it stops to eat, and comes back faster. Keep the hunt away from it.`,
          true,
        );
      }
    }

    for (const p of this.prey) {
      if (p.state === "safe" || p.state === "eaten") continue;
      p.t += dt;
      let qd = Infinity;
      let qx = p.x;
      for (const q of this.monsters) {
        if (!this.hunting(q)) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < qd) {
          qd = d;
          qx = q.x;
        }
      }
      if (p.kind === "villager") {
        // in the villages of the mission people wait for Brigid; they don't run
        if (p.state === "leave" && p.door) {
          // led away by the creatures of a healed glade: they walk off into the woods and are gone
          const dx = p.door.x - p.x;
          const dy = p.door.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 6) {
            p.state = "safe";
            continue;
          }
          p.x += (dx / d) * 70 * dt;
          p.y += (dy / d) * 70 * dt;
          if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1;
        } else if (p.state === "flee" && p.door) {
          const dx = p.door.x - p.x;
          const dy = p.door.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 3) {
            p.state = "safe";
            continue;
          }
          p.x += (dx / d) * 48 * dt;
          p.y += (dy / d) * 48 * dt;
          if (Math.abs(dx) > 1) p.dir = dx > 0 ? 1 : -1;
        }
      } else {
        if (p.state === "run" && qd < 130) {
          // it bolts away from the monster
          p.state = "flee";
          const away = Math.sign(p.x - qx) || Math.sign(p.vx);
          p.vx = away * Math.abs(p.vx);
          p.vy += 10;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    this.prey = this.prey.filter((p) => p.state !== "safe" && p.state !== "eaten" && p.y > this.y - 500 && Math.abs(p.x - this.camX) < this.W + 500);

  }

  private eat(q: Monster, p: Prey) {
    const T = MONSTERS[q.type];
    const person = p.kind === "villager";
    p.state = "eaten";
    q.fed = (q.fed ?? 0) + (person ? 2 : 1);
    q.state = "stunned";
    q.timer = person ? 1.1 : 0.8;
    q.vx = 0;
    const loss = this.mode === "endless" ? (person ? LIFE.villagerLoss : LIFE.animalLoss) * this.mult : 0;
    this.score = Math.max(0, this.score - loss);
    if (person) this.stats.peopleLost++;
    else this.stats.animalsLost++;
    this.gore(p.x, p.y - 6, person ? 28 : 18);
    if (loss) this.float(p.x, p.y - 34, `−${fmtN(loss)}`, "#ff6a6a");
    sfx.eat();
    this.say(`${cap(T.name)} ate ${person ? "someone from the village" : `the ${p.kind}`}. It is faster now${loss ? `: −${fmtN(loss)}` : ""}.`, person);
  }

  /* ---------------- the monsters ---------------- */

  private spawnMonster(atX?: number, atY?: number, turned = false) {
    const m = this.metres;
    const kinds = this.mode === "tutorial" ? (["maw"] as MonsterId[]) : (Object.keys(MONSTERS) as MonsterId[]).filter((k) => MONSTERS[k].from <= m + this.mOff);
    const pick = kinds[Math.min(kinds.length - 1, Math.floor(Math.pow(Math.random(), 0.7) * kinds.length))];
    this.monsters.push({
      id: this.nextId++, type: pick, x: atX ?? this.x + (Math.random() - 0.5) * 120, y: atY ?? this.y - this.PY - 90, vx: 0, turned,
      state: "emerge", timer: 0.6, cool: 2, judged: new Set(), dodgeT: 0, dodgeDir: 0, blind: 0, flinch: 0,
      phase: Math.random() * 6, aimX: this.x,
    });
    sfx.roar();
    if (!this.o.seenMonsters.includes(pick)) {
      this.o.seenMonsters.push(pick);
      this.o.onEvent({ type: "seen", monster: pick });
      this.say(`Something is coming: ${MONSTERS[pick].name}. ${MONSTERS[pick].tell}`, true);
    }
  }

  private hunt(dt: number) {
    const m = this.metres;
    const alive = this.monsters.filter((q) => q.state !== "dying" && q.state !== "gone" && !q.turned).length;
    const want = this.mode === "tutorial" ? 0 : this.mode === "mission" ? MISSION.hunters[this.land] : huntersAt(m + this.mOff);
    if (m > 60 && alive < want) {
      this.respawn -= dt;
      if (this.respawn <= 0) {
        this.spawnMonster();
        this.respawn = 4;
      }
    }
    for (const p of this.pending) {
      p.t -= dt;
      if (p.t <= 0) for (let k = 0; k < p.n && this.monsters.length < 7; k++) this.spawnMonster();
    }
    this.pending = this.pending.filter((p) => p.t > 0);

    const base = this.targetSpeed();
    const scentAt = (age: number) => {
      const t = this.t - age;
      for (let i = this.trail.length - 1; i >= 0; i--) if (this.trail[i].t <= t) return this.trail[i].x;
      return this.trail[0]?.x ?? this.x;
    };
    for (const q of this.monsters) {
      const T = MONSTERS[q.type];
      q.phase += dt;
      if (q.blind > 0) q.blind -= dt;
      if (q.flinch > 0) q.flinch -= dt;
      if (q.cool > 0) q.cool -= dt;
      if (q.state === "dying") {
        q.timer -= dt;
        if (q.timer <= 0) q.state = "gone";
        continue;
      }
      if (q.state === "emerge") {
        q.y += base * 1.1 * dt;
        q.timer -= dt;
        if (q.timer <= 0) q.state = "run";
        continue;
      }
      if (q.state === "stunned" || q.state === "rooted") {
        q.timer -= dt;
        if (q.timer <= 0) {
          q.state = "run";
          q.cool = Math.max(q.cool, 0.8);
        }
        continue;
      }
      if (q.state === "gone") continue;

      const gap = this.y - q.y;
      // where it wants to be
      let tx: number;
      if (q.lure && q.lure.state !== "gone") tx = q.lure.x;
      else if (q.blind > 0) tx = q.x + Math.sin(q.phase * 3) * 60;
      else if (T.aim === "trail") tx = scentAt(Math.min(1.4, Math.max(0, gap) / Math.max(1, base)) * 0.95);
      else if (T.aim === "lead") tx = this.x + this.vx * Math.min(0.5, gap / Math.max(1, base));
      else tx = this.x + Math.sin(q.phase * 2.6) * 40;

      // hungry: anything alive just ahead of it is food, and food comes first
      let food: Prey | undefined;
      if ((q.state === "run" || q.state === "recover") && gap <= this.PY + 30 && q.blind <= 0 && !q.lure) {
        let best = 100;
        for (const p of this.prey) {
          if (p.state === "safe" || p.state === "eaten" || p.kind === "villager") continue;
          const dy = p.y - q.y;
          if (dy < -24 || dy > 115) continue;
          const dx = Math.abs(p.x - q.x);
          if (dx < best) {
            best = dx;
            food = p;
          }
        }
        if (food) tx = food.x;
      }
      // close enough: it pounces, straight at it
      if (food && Math.hypot(food.x - q.x, food.y - q.y) < 56) {
        const dx = food.x - q.x;
        const dy = food.y - q.y;
        const d = Math.hypot(dx, dy) || 1;
        const v = base * 2.4 * dt;
        q.x += (dx / d) * Math.min(v, d);
        q.y += (dy / d) * Math.min(v, d);
        q.vx = (dx / d) * base;
        if (d < 14) this.eat(q, food);
        continue;
      }

      const fed = Math.min(5, q.fed ?? 0);
      let sp = base * (1 + TUNE.monsterGain + T.gain + fed * LIFE.fedGain) * (this.mode === "tutorial" ? (this.tut.step >= 7 && this.tut.step <= 9 ? 1.25 : 0.92) : 1);
      if (gap > 300) sp *= 1.7;
      else if (gap > 180) sp *= 1.3;
      if (q.flinch > 0) sp *= 0.55;
      if (q.blind > 0) sp *= 0.92;

      // the leap: wind up, then jump at where you are going
      if (q.state === "run" && !food && this.mode !== "tutorial" && q.cool <= 0 && gap < TUNE.lungeFrom * (1 + fed * 0.08) && gap > 12 && Math.abs(q.x - this.x) < 60 && q.blind <= 0 && q.flinch <= 0) {
        q.state = "windup";
        q.timer = 0.35;
        sfx.roar();
      }
      if (q.state === "windup") {
        sp = this.speed * 0.98;
        q.timer -= dt;
        if (q.timer <= 0) {
          q.state = "lunge";
          q.timer = 0.42;
          q.aimX = this.x + this.vx * 0.3;
        }
      } else if (q.state === "lunge") {
        sp = base * 2.1;
        tx = q.aimX;
        q.timer -= dt;
        if (q.timer <= 0) {
          q.state = "recover";
          q.timer = 0.7;
        }
      } else if (q.state === "recover") {
        sp = base * 0.85;
        q.timer -= dt;
        if (q.timer <= 0) {
          q.state = "run";
          q.cool = (1.6 + Math.random() * 1.2) * (1 - fed * 0.1);
        }
      }

      // steer with some weight, not on rails
      const side = food ? T.side * 1.25 : T.side;
      let want = Math.max(-side, Math.min(side, (tx - q.x) * 2.6));
      if (q.state === "lunge") want = Math.max(-T.side * 1.6, Math.min(T.side * 1.6, (tx - q.x) * 6));
      if (q.dodgeT > 0) {
        q.dodgeT -= dt;
        want = q.dodgeDir * T.side * 1.2;
      }
      q.vx += (want - q.vx) * Math.min(1, dt * T.agility * (q.state === "lunge" ? 2.5 : 1));
      q.x += q.vx * dt;
      q.y += sp * dt;

      // off the screen they never trip: every crash is one you can see, and cause
      if (gap > this.PY + 30) continue;

      // a saved village: they break on its light like on stone
      if (this.hunting(q)) {
        const v = this.villages.find((vv) => vv.state === "saved" && Math.hypot(vv.ax - q.x, (vv.ay - q.y) * 1.3) < MISSION.sanctuary);
        if (v) {
          q.state = "stunned";
          q.timer = 1.4;
          q.y -= 26;
          this.stats.crashed++;
          this.burst(q.x, q.y - 20, 22, ["#b8ffe0", "#ffffff", "#7dff4f"], 110);
          sfx.crash();
          if (!this.o.seenKinds.includes("sanctuary")) {
            this.o.seenKinds.push("sanctuary");
            this.say(`${cap(T.name)} broke on the light of ${v.name}. Saved villages are stone to them: lead them in.`, true);
          }
          continue;
        }
      }



      if (q.state === "run" || q.state === "recover") {
        for (const c of this.near(q.x, q.y + 40, 0, 1))
          for (const o of c.obs) {
            if (o.dead || q.judged.has(o.id)) continue;
            if (o.y < q.y || o.y > q.y + 50 || Math.abs(o.x - q.x) > o.w / 2 + T.radius) continue;
            q.judged.add(o.id);
            const as = SEES_AS[o.kind];
            if (!as || (as === "tree" && T.smashes)) continue;
            if (Math.random() < (q.blind > 0 ? 0 : T.sees[as])) {
              q.dodgeT = 0.4;
              q.dodgeDir = q.x < o.x ? -1 : 1;
            }
          }
        for (const tr of this.placed) {
          if (!tr.alive || q.judged.has(tr.id) || tr.y < q.y || tr.y > q.y + 50 || Math.abs(tr.x - q.x) > 16) continue;
          q.judged.add(tr.id);
          const chance = q.blind > 0 || this.o.choice.rider.id === "dryad" ? 0 : T.sees.trap;
          if (Math.random() < chance) {
            q.dodgeT = 0.4;
            q.dodgeDir = q.x < tr.x ? -1 : 1;
          }
        }
      }

      // monsters against the land
      const r = T.radius * 0.6;
      let hit = false;
      for (const c of this.near(q.x, q.y, 0, 0)) {
        for (const o of c.obs) {
          if (o.dead || Math.abs(o.x - q.x) > o.w / 2 + r || Math.abs(o.y - q.y) > o.h / 2 + 4) continue;
          if (o.kind === "pit" && (o.scar || BIOMES[this.landAtY(o.y)].well < 3)) {
            this.kill(q, "pit");
            this.stats.pitted++;
            this.say(`${cap(T.name)} fell into the green fire.`);
            hit = true;
            break;
          }
          if (o.kind === "log" || o.kind === "thorns") {
            if (q.type === "crawler") q.y -= sp * dt * 0.5;
            continue;
          }
          if (o.kind === "arch" && Math.abs(q.x - o.x) <= 34) continue; // they slip under
          if (T.smashes && o.kind !== "cottage" && o.kind !== "well") {
            o.dead = true;
            this.burst(o.x, o.y - 8, 14, ["#6a4a2e", "#8a8478"], 80);
            sfx.crash();
            continue;
          }
          q.state = "stunned";
          q.timer = 1;
          q.y -= 8;
          q.vx = 0;
          this.stats.crashed++;
          this.burst(q.x, q.y - 8, 10, ["#cdb39a", "#93725f"], 60);
          sfx.crash();
          this.say(`${cap(T.name)} crashed.`);
          hit = true;
          break;
        }
        if (hit) break;
      }
      if (hit) continue;
      for (const tr of this.placed) {
        if (tr.alive && Math.abs(tr.x - q.x) < 12 && Math.abs(tr.y - q.y) < 9) {
          tr.alive = false;
          this.kill(q, "trap");
          this.stats.trapped++;
          this.say(`${cap(T.name)} is caught in your trap.`);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // caught?
      if (Math.abs(q.x - this.x) < T.radius + 6 && gap < T.radius + 4 && gap > -10) {
        if (this.bark || (this.o.choice.rider.id === "knight" && this.shieldReady)) {
          if (this.bark) this.bark = false;
          else {
            this.shieldReady = false;
            this.shieldAt = this.metres;
          }
          q.state = "stunned";
          q.timer = 1.2;
          q.y -= 110;
          this.inv = Math.max(this.inv, 0.6);
          this.burst(this.x, this.y - 10, 14, ["#c8a060", "#f4efe0"], 80);
          sfx.crash();
          this.say("Your shield held. Ride!");
        } else {
          this.die(`${cap(T.name)} caught you`);
          return;
        }
      }
    }
    for (let i = 0; i < this.monsters.length; i++)
      for (let j = i + 1; j < this.monsters.length; j++) {
        const a = this.monsters[i];
        const b = this.monsters[j];
        if (!this.hunting(a) || !this.hunting(b)) continue;
        const dx = b.x - a.x;
        if (Math.abs(dx) < 24 && Math.abs(b.y - a.y) < 20) {
          const s = (dx >= 0 ? 1 : -1) * 40 * dt;
          a.x -= s;
          b.x += s;
        }
      }
    this.monsters = this.monsters.filter((q) => q.state !== "gone" && q.y > this.y - 900);
  }

  private companion(dt: number) {
    const c = this.comp;
    if (!c || c.state === "gone") return;
    c.t += dt;
    const threats = this.monsters.filter((q) => this.hunting(q) && q.state !== "stunned" && q.state !== "rooted").sort((a, b) => b.y - a.y);
    if (c.state === "follow") {
      c.x += (this.x + 26 - c.x) * Math.min(1, dt * 6);
      c.y += (this.y - 8 - c.y) * Math.min(1, dt * 6);
      // in the lessons with weapons the friend only watches
      const drill = this.mode === "tutorial" && this.tut.step >= 7 && this.tut.step <= 9;
      const near = !drill && threats[0] && this.y - threats[0].y < (c.kind === "raven" ? 260 : c.kind === "doe" ? 170 : 120);
      if (near) {
        c.state = "act";
        c.t = 0;
        c.target = threats[0];
        if (c.kind === "raven") {
          for (const q of this.monsters) q.blind = 8;
          this.say("The raven blinds them. Lead them into something!");
        } else if (c.kind === "doe") {
          c.vx = c.x < this.x ? -200 : 200;
          threats[0].lure = c;
          this.say(`The doe leads ${MONSTERS[threats[0].type].name} away.`);
        }
      }
    } else if (c.kind === "hound") {
      const q = c.target!;
      if (!q || q.state === "gone" || q.state === "dying") {
        c.state = "follow";
        return;
      }
      c.x += (q.x - c.x) * Math.min(1, dt * 9);
      c.y += (q.y - c.y) * Math.min(1, dt * 9);
      if (Math.abs(q.x - c.x) < 10 && Math.abs(q.y - c.y) < 10) {
        this.kill(q, "hound");
        this.gore(q.x, q.y - 10, 40);
        this.shake = this.o.settings.calm ? 0 : 0.25;
        this.float(q.x, q.y - 40, "the hound tears it down", "#ffe0a0");
        c.kills = (c.kills ?? 0) + 1;
        if (c.kills >= 2) {
          c.state = "gone";
          this.say("The hound tore down two of them, and then it was torn too. It gave its life for you.", true);
        } else {
          c.state = "follow";
          this.say("The hound tore it down! It runs back to you, bloody.", true);
        }
      }
    } else if (c.kind === "raven") {
      const q = this.monsters.filter((z) => this.hunting(z)).sort((a, b) => b.y - a.y)[0];
      c.x += ((q?.x ?? this.x) - c.x) * dt * 3;
      c.y = (q?.y ?? this.y) - 30 + Math.sin(c.t * 4) * 8;
      // after the blinding, it goes for the eyes of the nearest one
      if (q && c.t > 1.6 && !c.kills) {
        c.kills = 1;
        this.kill(q, "hound");
        this.burst(q.x, q.y - 20, 24, ["#1a1a22", "#3a3a48", "#7a1018"], 90);
        this.float(q.x, q.y - 44, "the raven takes its eyes", "#d8d8ff");
        this.say("The raven took its eyes. The others are still blind: lead them into something!", true);
      }
      if (c.t > 8) c.state = "gone";
    } else {
      c.x += c.vx * dt;
      c.y += this.speed * 1.15 * dt;
      if (c.t > 3) {
        const q = c.target;
        if (q && this.hunting(q) && q.lure === c) {
          // the doe leads it off the road and the woods close over it
          this.kill(q, "dawn");
          this.float(q.x, q.y - 40, "lost in the woods", "#ffffff");
          this.respawn = Math.max(this.respawn, 6);
          this.say("The doe led it into the deep woods, and it never came out.", true);
        }
        c.state = "gone";
      }
    }
  }

  private projectiles(dt: number) {
    for (const s of this.shots) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.spear) {
        if (s.to && !s.to.dead && s.y >= s.to.y) {
          s.to.dead = true;
          s.life = 0;
          this.burst(s.to.x, s.to.y - 10, 18, ["#6a4a2e", "#8a8478", "#3a5a2a"], 90);
          sfx.crash();
        }
        continue;
      }
      for (const q of this.monsters) {
        if (!this.hunting(q)) continue;
        const R = MONSTERS[q.type].radius;
        if (Math.abs(q.x - s.x) < R + 3 && s.y < q.y + 6 && s.y > q.y - R * 2.4) {
          s.life = 0;
          this.kill(q, "arrow");
          this.stats.arrowKills++;
          this.say(`Your arrow found ${MONSTERS[q.type].name}.`);
          break;
        }
      }
      if (s.life > 0)
        for (const c of this.near(s.x, s.y, 0, 0))
          for (const o of c.obs)
            if (!o.dead && o.kind !== "pit" && o.kind !== "log" && o.kind !== "thorns" && Math.abs(o.x - s.x) < o.w / 2 && Math.abs(o.y - s.y) < o.h / 2 + 3) s.life = 0;
    }
    this.shots = this.shots.filter((s) => s.life > 0);
  }

  private particles(dt: number) {
    for (const f of this.floats) {
      f.t -= dt;
      f.y -= 26 * dt;
    }
    this.floats = this.floats.filter((f) => f.t > 0);
    for (const p of this.fx) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
    this.fx = this.fx.filter((p) => p.life > (p.ground ? -3 : 0));
  }

  private finish(win: boolean) {
    if (this.over) return;
    this.over = true;
    this.running = false;
    this.o.onHud(this.hud());
    this.o.onEvent({
      type: "end", win, cause: win ? (this.mode === "tutorial" ? "The First Morning" : "The Long Spring") : this.endCause,
      metres: Math.floor(this.metres), score: Math.floor(this.score), stats: { ...this.stats },
      mode: this.mode, land: this.land, reborn: this.reborn,
    });
  }

  hud(): Hud {
    const r = this.o.choice.rider;
    return {
      metres: Math.floor(this.metres),
      kmh: Math.round((this.speed * TUNE.metresPerPx * 3.6) / (this.o.settings.slow ? 0.75 : 1)),
      score: Math.floor(this.score),
      multiplier: this.mult,
      hearts: Math.max(0, this.hearts),
      maxHearts: this.mode === "endless" ? this.o.choice.mount.hearts : Math.max(this.hearts, this.o.choice.mount.hearts),
      arrows: this.arrows,
      swords: this.swords,
      maxSwords: this.maxSwords(),
      traps: this.traps,
      bark: this.bark,
      ability: r.ability,
      abilityReady:
        r.id === "knight" ? (this.shieldReady ? 1 : Math.min(0.99, (this.metres - this.shieldAt) / 400)) : this.cool > 0 ? 1 - this.cool / r.cooldown : 1,
      companion: this.comp && this.comp.state !== "gone" ? this.comp.kind : null,
      danger: this.danger(),
      biome: BIOMES[this.biome].name,
      wordGot: this.wordGot,
      aiming: this.aimT >= 0,
      mode: this.mode,
      souls: this.souls,
      need: this.need,
      land: this.land,
      finale: this.finaleT > 0 && !this.over,
      finaleT: this.finaleT,
    };
  }

  private danger() {
    let d = 0;
    for (const q of this.monsters) if (this.hunting(q) && q.state !== "stunned" && q.state !== "rooted") d = Math.max(d, 1 - Math.max(0, this.y - q.y - 20) / 260);
    return Math.max(0, Math.min(1, d));
  }

  /* ---------------- drawing ---------------- */

  private sx(x: number) {
    return x - this.camX + this.W / 2;
  }
  private sy(y: number) {
    return this.PY + (y - this.y);
  }
  private put(s: Spr | undefined, x: number, y: number, a = 1) {
    if (!s) return;
    const g = this.ctx;
    const S = this.S;
    const dx = Math.round((x - s.ax) * S) / S;
    const dy = Math.round((y - s.ay) * S) / S;
    if (a < 1) g.globalAlpha = a;
    g.drawImage(s.c, dx, dy, s.w, s.h);
    if (a < 1) g.globalAlpha = 1;
  }

  draw() {
    const g = this.ctx;
    const S = this.S;
    const W = this.W;
    const H = VIEW_H;
    const sh = this.shake > 0 ? (Math.random() - 0.5) * 6 : 0;
    g.setTransform(S, 0, 0, S, sh * S, 0);
    g.imageSmoothingEnabled = true;
    const tr = this.trans;
    const fromB = tr.t < 1 ? tr.from : this.biome;
    const k = tr.t;
    const landA = this.lands[fromB];
    const landB = this.lands[this.biome];
    if (!landB) return;

    // the ground, tiled
    const T = GROUND_TILE;
    const ox = this.camX - W / 2;
    const oy = this.y - this.PY;
    const tile = (l: Land, a: number) => {
      for (let tx = Math.floor(ox / T); tx * T < ox + W; tx++)
        for (let ty = Math.floor(oy / T); ty * T < oy + H; ty++) {
          const x = Math.floor((tx * T - ox) * S) / S;
          const y = Math.floor((ty * T - oy) * S) / S;
          if (a < 1) g.globalAlpha = a;
          g.drawImage(l.ground.c, x, y, T + 1 / S, T + 1 / S);
        }
      g.globalAlpha = 1;
    };
    // each land begins at its gate: the ground beyond a gate is already the next land
    const mpp = TUNE.metresPerPx;
    const landAt = (wy: number) => this.lands[this.landAtY(wy)] ?? landB;
    tile(landAt(oy), 1);
    const gatesOn: { gt: Gate; Y: number }[] = [];
    for (const gt of this.gates) {
      const Y = this.sy(gt.y);
      if (Y < -150 || Y > H + 150) continue;
      gatesOn.push({ gt, Y });
      if (!gt.gold && Y > 0 && Y < H && this.landAtY(oy) !== gt.land) {
        g.save();
        g.beginPath();
        g.rect(0, Y, W, H - Y);
        g.clip();
        tile(this.lands[gt.land], 1);
        g.restore();
      }
    }
    void k;
    void landA;
    void mpp;
    // the patches of rot that stay behind: burnt ground with a dark, soft edge
    {
      // each scarred cell is a ragged blot: a ring of points whose distance wavers; neighbours run together
      const blots: [number, number][][] = [];
      for (let i = Math.floor((ox - CELL) / CELL); i <= Math.floor((ox + W + CELL) / CELL); i++)
        for (let j = Math.floor((oy - CELL) / CELL); j <= Math.floor((oy + H + CELL) / CELL); j++) {
          const c = this.cell(i, j);
          if (!c.scar) continue;
          const jr = rng(hash2(i * 13 + 7, j * 29 + 3));
          const cx = i * CELL + CELL / 2 - ox + (jr() - 0.5) * 40;
          const cy = j * CELL + CELL / 2 - oy + (jr() - 0.5) * 40;
          const rx = CELL * (0.62 + jr() * 0.22);
          const ry = CELL * (0.55 + jr() * 0.2);
          const ph = [jr() * 6, jr() * 6, jr() * 6];
          const pts: [number, number][] = [];
          for (let q = 0; q < 22; q++) {
            const a = (q / 22) * Math.PI * 2;
            const w = 0.78 + 0.16 * Math.sin(a * 3 + ph[0]) + 0.1 * Math.sin(a * 5 + ph[1]) + 0.07 * Math.sin(a * 9 + ph[2]) + (jr() - 0.5) * 0.12;
            pts.push([cx + Math.cos(a) * rx * w, cy + Math.sin(a) * ry * w]);
          }
          blots.push(pts);
        }
      if (blots.length) {
        const path = (grow: number) => {
          g.beginPath();
          for (const pts of blots) {
            const [mx, my] = pts.reduce(([sx, sy], [x, y]) => [sx + x / pts.length, sy + y / pts.length], [0, 0]);
            // a smooth ragged edge: curves through the middles of the sides
            const P = pts.map(([x, y]) => [mx + (x - mx) * grow, my + (y - my) * grow] as [number, number]);
            const mid = (p: [number, number], q: [number, number]) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
            const [sx, sy] = mid(P[P.length - 1], P[0]);
            g.moveTo(sx, sy);
            P.forEach((p, q) => {
              const [nx, ny] = mid(p, P[(q + 1) % P.length]);
              g.quadraticCurveTo(p[0], p[1], nx, ny);
            });
            g.closePath();
          }
        };
        g.fillStyle = "rgba(24,18,14,0.22)";
        path(1.14);
        g.fill();
        g.fillStyle = "rgba(24,18,14,0.22)";
        path(1.06);
        g.fill();
        g.save();
        path(1);
        g.clip();
        tile(this.lands[0], 1);
        g.restore();
      }
    }
    for (const { gt, Y } of gatesOn) if (Y > -30 && Y < H + 30) this.drawBrook(Y, gt.gold);
    for (const v of this.villages) this.drawVillageGround(v);

    // blood on the ground
    for (const p of this.fx)
      if (p.ground && p.life <= 0) {
        g.globalAlpha = Math.max(0, 1 + p.life / 3) * 0.75;
        g.fillStyle = p.c;
        g.beginPath();
        g.ellipse(this.sx(p.x), this.sy(p.y), p.r * 1.4, p.r * 0.8, 0, 0, Math.PI * 2);
        g.fill();
      }
    g.globalAlpha = 1;

    // everything standing on the ground, far to near
    type D = { y: number; fn: () => void };
    const list: D[] = [];
    // every obstacle is drawn as its own land has it
    let curLand = landB;
    const twoWay = (pick: (l: Land) => Spr, x: number, y: number) => this.put(pick(curLand), x, y);
    const top = this.y - this.PY - 140;
    const bottom = this.y + (H - this.PY) + 140;
    const ci0 = Math.floor((ox - 80) / CELL);
    const ci1 = Math.floor((ox + W + 80) / CELL);
    const vis = this.o.settings.visible;
    for (let i = ci0; i <= ci1; i++)
      for (let j = Math.floor(top / CELL); j <= Math.floor(bottom / CELL); j++) {
        const c = this.cell(i, j);
        for (const o of c.obs) {
          if (o.dead) continue;
          const x = this.sx(o.x);
          const y = this.sy(o.y) + o.h / 2;
          if (x < -90 || x > W + 90) continue;
          const flat = o.kind === "pit";
          list.push({
            y: flat ? o.y - 30 : o.y,
            fn: () => {
              curLand = o.scar ? this.lands[0] : landAt(o.y);
              if (o.kind === "cottage") this.drawCottage(o, x, y + 2);
              else if (o.kind === "well") this.put(this.life.well, x, y + 2);
              else if (o.kind === "tree") twoWay((l) => l.tree[o.v], x, y + 2);
              else if (o.kind === "boulder") twoWay((l) => l.boulder[o.v % 2], x, y + 2);
              else if (o.kind === "pit") twoWay((l) => l.pit[wrap(Math.floor(this.t * 10 + o.v * 2), 6)], x, y + 4);
              else if (o.kind === "arch") twoWay((l) => l.arch, x, y + 2);
              else twoWay((l) => l[o.kind as "menhir" | "stone" | "log" | "thorns"], x, y + 1);
              if (vis) this.hint(o, x, this.sy(o.y));
            },
          });
        }
        for (const p of c.picks) if (!p.taken) list.push({ y: p.y, fn: () => this.drawPick(p) });
        if (c.life && !this.o.showcase) for (const cr of c.life) list.push({ y: cr.kind === "butterfly" ? cr.y + 40 : cr.y, fn: () => this.drawCritter(cr) });
      }
    for (const p of this.extra) if (!p.taken) list.push({ y: p.y, fn: () => this.drawPick(p) });
    for (const t of this.placed) if (t.alive) list.push({ y: t.y - 40, fn: () => this.put(this.trapArt, this.sx(t.x), this.sy(t.y) + 4) });
    for (const { gt, Y } of gatesOn)
      for (let ax = archX(ox - 70); ax <= ox + W + 70; ax += 260) list.push({ y: gt.y, fn: () => this.drawGate(gt, ax, Y) });
    for (const t of this.trees) list.push({ y: t.y, fn: () => this.drawSpringTree(t) });
    for (const c of this.cheer) if (this.finaleT >= c.at) list.push({ y: c.y, fn: () => this.drawCheer(c) });
    for (const p of this.prey) if (p.state !== "safe" && p.state !== "eaten") list.push({ y: p.y, fn: () => this.drawPrey(p) });
    if (!this.o.showcase) {
      for (const q of this.monsters) list.push({ y: q.y, fn: () => this.drawMonster(q) });
      if (this.comp && this.comp.state !== "gone") list.push({ y: this.comp.y, fn: () => this.drawCompanion() });
      if (this.dead) list.push({ y: this.y - 120, fn: () => this.drawPool() });
      list.push({ y: this.y, fn: () => this.drawHero() });
    }
    list.sort((a, b) => a.y - b.y);
    for (const d of list) d.fn();

    for (const v of this.villages) this.drawVillageLabel(v);
    if (this.finaleT) this.drawFinale();

    // points won and lost, rising
    for (const f of this.floats) {
      const a = Math.min(1, f.t / 0.5);
      g.globalAlpha = a;
      g.font = "bold 17px system-ui, sans-serif";
      g.textAlign = "center";
      g.lineWidth = 4;
      g.strokeStyle = "rgba(0,0,0,0.8)";
      g.strokeText(f.text, this.sx(f.x), this.sy(f.y));
      g.fillStyle = f.c;
      g.fillText(f.text, this.sx(f.x), this.sy(f.y));
      g.globalAlpha = 1;
    }

    // arrows and the spear
    for (const s of this.shots) {
      const x = this.sx(s.x);
      const y = this.sy(s.y);
      const vy = s.vy - this.speed;
      const len = Math.hypot(s.vx, vy) || 1;
      const dx = (s.vx / len) * 9;
      const dy = (vy / len) * 9;
      g.strokeStyle = "#1c1410";
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(x - dx, y - dy);
      g.lineTo(x + dx, y + dy);
      g.stroke();
      g.strokeStyle = s.spear ? "#d8dce4" : "#efe3c6";
      g.lineWidth = 1.4;
      g.stroke();
    }
    // the aim: a dotted line swinging behind you
    if (this.aimT >= 0) {
      const a = this.aimAngle();
      g.fillStyle = "#fff4a0";
      for (let d = 18; d < 150; d += 9) {
        g.beginPath();
        g.arc(this.sx(this.x + Math.sin(a) * d), this.PY - 20 - Math.cos(a) * d, 1.6, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (const p of this.fx) {
      if (p.life <= 0) continue;
      g.globalAlpha = Math.min(1, p.life * 2);
      g.fillStyle = p.c;
      g.beginPath();
      g.arc(this.sx(p.x), this.sy(p.y), p.r, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    if (this.o.showcase) return;

    // monsters behind you, off the top of the screen
    for (const q of this.monsters) {
      if (!this.hunting(q) && q.state !== "emerge") continue;
      const y = this.sy(q.y);
      if (y > 0) continue;
      const x = Math.max(10, Math.min(W - 10, this.sx(q.x)));
      g.globalAlpha = Math.max(0.3, 1 + y / 200);
      g.fillStyle = "#e0303a";
      g.beginPath();
      g.moveTo(x - 9, 4);
      g.lineTo(x + 9, 4);
      g.lineTo(x, 15);
      g.closePath();
      g.fill();
      g.globalAlpha = 1;
    }
    if (this.wave >= 0 && !this.o.settings.calm) {
      const wy = (this.wave / 1.4) * (H + 120) - 60;
      const grd = g.createLinearGradient(0, wy - 50, 0, wy + 50);
      grd.addColorStop(0, "rgba(255,248,200,0)");
      grd.addColorStop(0.5, "rgba(255,248,200,0.55)");
      grd.addColorStop(1, "rgba(255,248,200,0)");
      g.fillStyle = grd;
      g.fillRect(0, wy - 50, W, 100);
    }
    const d = this.danger();
    if (d > 0.3 && !this.dead) {
      const a = (d - 0.3) * (this.o.settings.calm ? 0.6 : 0.75 + 0.25 * Math.sin(this.t * 8));
      const grd = g.createLinearGradient(0, 0, 0, 140);
      grd.addColorStop(0, `rgba(170,10,20,${a.toFixed(2)})`);
      grd.addColorStop(1, "rgba(170,10,20,0)");
      g.fillStyle = grd;
      g.fillRect(0, 0, W, 140);
    }
    if (this.dead && !this.o.settings.calm && !this.o.settings.lessBlood) {
      g.fillStyle = `rgba(120,0,10,${Math.min(0.2, this.dead * 0.25).toFixed(2)})`;
      g.fillRect(0, 0, W, H);
    }
    if (this.won) {
      g.fillStyle = `rgba(255,250,220,${Math.min(0.7, this.won * 0.35).toFixed(2)})`;
      g.fillRect(0, 0, W, H);
    }
  }

  private hint(o: Obstacle, x: number, y: number) {
    const g = this.ctx;
    g.lineWidth = 1.5;
    g.strokeStyle = o.kind === "pit" ? "#ff5a5a" : "#ffffff";
    g.setLineDash([4, 3]);
    if (o.kind === "arch") {
      g.strokeStyle = "#ff5a5a";
      g.strokeRect(x - o.w / 2, y - o.h / 2, 18, o.h);
      g.strokeRect(x + o.w / 2 - 18, y - o.h / 2, 18, o.h);
      g.strokeStyle = "#ffffff";
      g.strokeRect(x - 34, y - o.h / 2, 68, o.h);
    } else g.strokeRect(x - o.w / 2, y - o.h / 2, o.w, o.h);
    g.setLineDash([]);
    const label = o.kind === "log" || o.kind === "thorns" ? "↑ jump" : o.kind === "arch" ? "↓ duck" : "";
    if (label) {
      g.font = "bold 13px system-ui, sans-serif";
      g.textAlign = "center";
      g.lineWidth = 3;
      g.strokeStyle = "#000";
      g.strokeText(label, x, y + o.h / 2 + 14);
      g.fillStyle = "#fff";
      g.fillText(label, x, y + o.h / 2 + 14);
    }
  }

  private drawPick(p: Pick) {
    const calm = this.o.settings.calm;
    const bob = calm ? 0 : Math.sin(this.t * 4 + p.id) * 2.5;
    // a ring of light on the ground, so it stands out from the leaves and stones
    if (p.kind !== "seed") {
      const g = this.ctx;
      const x = this.sx(p.x);
      const y = this.sy(p.y) + 4;
      const c = p.kind === "heart" ? "255,90,110" : p.kind === "hound" || p.kind === "raven" || p.kind === "doe" ? "150,200,255" : "255,226,120";
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 5 + p.id);
      g.fillStyle = `rgba(${c},${(0.16 + pulse * 0.14).toFixed(2)})`;
      g.beginPath();
      g.ellipse(x, y, 24, 9, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = `rgba(${c},${(0.55 + pulse * 0.4).toFixed(2)})`;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(x, y, 20 + pulse * 4, 7.5 + pulse * 1.5, 0, 0, Math.PI * 2);
      g.stroke();
    }
    let s: Spr;
    if (p.kind === "letter") {
      const ch = p.letter ?? "?";
      if (!this.letters.has(ch)) this.letters.set(ch, letterStone(this.S, ch));
      s = this.letters.get(ch)!;
    } else s = this.picksArt[p.kind];
    this.put(s, this.sx(p.x), this.sy(p.y) + 4 + bob);
  }

  /** a picture turned to face left or right */
  private putFlip(s: Spr | undefined, x: number, y: number, flip: boolean) {
    if (!flip || !s) return this.put(s, x, y);
    const g = this.ctx;
    g.save();
    g.translate(Math.round(x * this.S) / this.S, 0);
    g.scale(-1, 1);
    this.put(s, 0, y);
    g.restore();
  }

  private drawPrey(p: Prey) {
    const x = this.sx(p.x);
    const y = this.sy(p.y);
    if (y < -70 || y > VIEW_H + 70 || x < -70 || x > this.W + 70) return;
    const calm = this.o.settings.calm;
    if (p.kind === "villager") {
      const fr = this.life.folk[p.v];
      const f = p.state === "flee" || p.state === "leave" ? 1 + wrap(Math.floor(p.t * 9), 2) : 0;
      const sway = p.state === "idle" && !calm ? Math.sin(p.t * 1.6 + p.id) * 0.6 : 0;
      this.putFlip(fr[f], x + sway, y + 2, p.dir < 0);
      if (p.state === "flee") {
        const g = this.ctx;
        g.font = "bold 13px system-ui, sans-serif";
        g.textAlign = "center";
        g.lineWidth = 3;
        g.strokeStyle = "#000";
        g.strokeText("!", x, y - 40);
        g.fillStyle = "#fff4a0";
        g.fillText("!", x, y - 40);
      }
      return;
    }
    const fr = this.life.animals[p.kind];
    // at home in a healed glade they stand still, and a hare now and then hops
    const home = p.state === "cheer";
    const f = home ? 0 : wrap(Math.floor(p.t * (p.kind === "deer" ? 7 : 9)), 2);
    const hop = p.kind === "hare" && !calm && (!home || Math.sin(p.t * 1.7 + p.id) > 0.93) ? -Math.abs(Math.sin(p.t * 9 * Math.PI)) * 3 : 0;
    this.putFlip(fr[f], x, y + 2 + hop, p.vx < 0);
  }

  /** the brook of light that runs across the land where a new season begins */
  private drawBrook(Y: number, gold: boolean) {
    const g = this.ctx;
    const W = this.W;
    const ox = this.camX - W / 2;
    const calm = this.o.settings.calm;
    const wob = (x: number, ph: number) => Math.sin((x + ox) * 0.045 + ph) * 2.2 + Math.sin((x + ox) * 0.013 + ph * 0.5) * 3;
    const band = (off: number) => {
      g.beginPath();
      for (let x = -12; x <= W + 12; x += 8) {
        const y = Y - 14 - off + wob(x, 0);
        if (x === -12) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      for (let x = W + 12; x >= -12; x -= 8) g.lineTo(x, Y + 14 + off + wob(x, 2));
      g.closePath();
    };
    // a soft light standing over the water
    const glow = g.createLinearGradient(0, Y - 70, 0, Y + 30);
    glow.addColorStop(0, "rgba(190,255,230,0)");
    glow.addColorStop(0.7, gold ? "rgba(255,240,170,0.3)" : "rgba(170,255,225,0.26)");
    glow.addColorStop(1, "rgba(190,255,230,0)");
    g.fillStyle = glow;
    g.fillRect(0, Y - 70, W, 100);
    g.fillStyle = "rgba(40,30,20,0.5)";
    band(3.5);
    g.fill();
    const gr = g.createLinearGradient(0, Y - 16, 0, Y + 16);
    gr.addColorStop(0, gold ? "#b8902a" : "#1f6e62");
    gr.addColorStop(0.5, gold ? "#fff2a8" : "#86f6d8");
    gr.addColorStop(1, gold ? "#9a7420" : "#1a5c52");
    g.fillStyle = gr;
    band(0);
    g.fill();
    // pebbles on the banks, fixed to the ground
    const step = 17;
    for (let xw = Math.floor(ox / step) * step; xw < ox + W + step; xw += step) {
      const h = ((xw * 2654435761) >>> 0) % 1000;
      const x = xw - ox + (h % 9);
      for (const sgn of [-1, 1]) {
        g.fillStyle = h % 3 === 0 ? "#c8c0b0" : "#8a8478";
        g.beginPath();
        g.ellipse(x, Y + sgn * (15 + (h % 4)) + wob(x - (h % 9), sgn > 0 ? 2 : 0), 3 + (h % 3), 2 + (h % 2), 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    // ripples flowing to one side, and motes of light rising from the water
    const flow = calm ? 0 : (this.t * 34) % 37;
    g.strokeStyle = "rgba(255,255,255,0.6)";
    g.lineWidth = 1.2;
    for (let xw = Math.floor(ox / 37) * 37 - 37; xw < ox + W + 37; xw += 37) {
      const h = ((xw * 40503) >>> 0) % 5;
      const x = xw - ox + flow;
      const y = Y + (h - 2) * 4.5;
      g.beginPath();
      g.moveTo(x - 4, y);
      g.quadraticCurveTo(x, y - 1.6, x + 5, y);
      g.stroke();
    }
    for (let xw = Math.floor(ox / 29) * 29; xw < ox + W + 29; xw += 29) {
      const h = ((xw * 2246822519) >>> 0) % 997;
      const rise = calm ? (h % 50) + 10 : (this.t * (14 + (h % 9)) + h) % 75;
      const a = 1 - rise / 75;
      g.fillStyle = gold ? `rgba(255,244,170,${(a * 0.9).toFixed(2)})` : `rgba(200,255,235,${(a * 0.9).toFixed(2)})`;
      g.beginPath();
      g.arc(xw - ox + Math.sin(rise * 0.12 + h) * 4, Y - rise, 1.2 + (h % 3) * 0.4, 0, Math.PI * 2);
      g.fill();
    }
  }

  /** one living arch of a gate, with the light of the spring between its stones */
  private drawGate(gt: Gate, wx: number, Y: number) {
    const g = this.ctx;
    const x = this.sx(wx);
    if (x < -70 || x > this.W + 70) return;
    this.put(gt.gold ? this.life.gold : this.life.gates[gt.land], x, Y + 6);
    const gold = gt.gold;
    const calm = this.o.settings.calm;
    const cy = Y - 36;
    const a = calm ? 0.35 : 0.3 + 0.12 * Math.sin(this.t * 3 + wx);
    const gr = g.createRadialGradient(x, cy, 2, x, cy, 34);
    gr.addColorStop(0, gold ? `rgba(255,250,210,${(a + 0.3).toFixed(2)})` : `rgba(210,255,240,${(a + 0.25).toFixed(2)})`);
    gr.addColorStop(1, "rgba(160,255,220,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.ellipse(x, cy, 21, 38, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(255,255,255,0.75)";
    for (let k = 0; k < 7; k++) {
      const ang = (calm ? 0 : this.t * 1.4) + k * 0.9;
      g.beginPath();
      g.arc(x + Math.cos(ang) * 12, cy + Math.sin(ang) * 24, 1.1 + (k % 2) * 0.5, 0, Math.PI * 2);
      g.fill();
    }
  }

  /** a cottage, grey while its village waits in the rot, dark when it is lost */
  private drawCottage(o: Obstacle, x: number, y: number) {
    const v = o.vid !== undefined ? this.villages.find((vv) => vv.id === o.vid) : undefined;
    const g = this.ctx;
    const f = !v ? "" : v.state === "lost" ? "grayscale(1) brightness(0.42)" : v.state === "waiting" && this.land === 0 ? "grayscale(0.65) brightness(0.78)" : "";
    if (f) g.filter = f;
    this.put(this.life.cottage[o.v % 2], x, y);
    if (f) g.filter = "none";
  }

  /** under a village: the ring that asks for a heart, the green of a saved one, the scorch of a lost one */
  /** a crow, a cloud of flies, a butterfly or a little bird; crows and birds fly off when she comes close */
  private drawCritter(cr: Critter) {
    const g = this.ctx;
    const calm = this.o.settings.calm;
    const t = this.t + cr.ph;
    if ((cr.kind === "crow" || cr.kind === "finch") && cr.flown === undefined && Math.hypot(cr.x - this.x, cr.y - this.y) < 95) cr.flown = this.t;
    const away = cr.flown !== undefined ? this.t - cr.flown : 0;
    if (away > 2.2) return;
    let x = this.sx(cr.x);
    let y = this.sy(cr.y);
    if (y < -40 || y > VIEW_H + 40 || x < -40 || x > this.W + 40) return;
    if (cr.kind === "flies") {
      g.fillStyle = "rgba(20,20,20,0.85)";
      for (let k = 0; k < 5; k++) {
        const a = (calm ? k : t * (5 + k)) + k * 1.3;
        g.beginPath();
        g.arc(x + Math.cos(a) * (6 + k * 2), y - 12 + Math.sin(a * 1.3) * 5, 1.1, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    if (cr.kind === "butterfly") {
      x += calm ? 0 : Math.sin(t * 0.7) * 30;
      y += (calm ? 0 : Math.cos(t * 0.5) * 16) - 14;
      const flap = calm ? 0.8 : 0.25 + Math.abs(Math.sin(t * 11)) * 0.75;
      g.fillStyle = cr.c;
      g.strokeStyle = "rgba(0,0,0,0.5)";
      g.lineWidth = 0.6;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(x + s * 3.2 * flap, y - 1, 3.4 * flap, 2.6, s * 0.4, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      g.fillStyle = "#2a1a10";
      g.fillRect(x - 0.6, y - 3, 1.2, 5);
      return;
    }
    // crow or finch, on the ground or flying off
    const crow = cr.kind === "crow";
    if (away > 0) {
      x += away * 90 * (cr.ph % 2 > 1 ? 1 : -1);
      y -= away * 70;
      g.globalAlpha = Math.max(0, 1 - away / 2.2);
    }
    const hop = !calm && away === 0 && Math.sin(t * 2.3) > 0.92 ? -2 : 0;
    const sz = crow ? 1.35 : 0.8;
    g.fillStyle = crow ? "#151217" : cr.c;
    g.strokeStyle = "rgba(0,0,0,0.7)";
    g.lineWidth = 0.8;
    if (away > 0) {
      const w = Math.sin(this.t * 18) * 5 * sz;
      g.beginPath();
      g.moveTo(x - 7 * sz, y - 10 + w);
      g.quadraticCurveTo(x - 3 * sz, y - 13, x, y - 10);
      g.quadraticCurveTo(x + 3 * sz, y - 13, x + 7 * sz, y - 10 + w);
      g.lineWidth = 2;
      g.strokeStyle = g.fillStyle as string;
      g.stroke();
    } else {
      g.beginPath();
      g.ellipse(x, y - 5 * sz + hop, 5.5 * sz, 3.8 * sz, -0.2, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(x + 4.5 * sz, y - 8.5 * sz + hop, 2.6 * sz, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = crow ? "#3a3a3a" : "#f0c060";
      g.beginPath();
      g.moveTo(x + 6.6 * sz, y - 9 * sz + hop);
      g.lineTo(x + 10 * sz, y - 8 * sz + hop);
      g.lineTo(x + 6.6 * sz, y - 7.4 * sz + hop);
      g.fill();
      g.fillStyle = crow ? "#d8c040" : "#111";
      g.beginPath();
      g.arc(x + 5.2 * sz, y - 9.2 * sz + hop, 0.7, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  /** the path from where the road forks to a village or a glade */
  private drawTrail(v: Village) {
    if (!v.fork) return;
    const g = this.ctx;
    const f = v.fork;
    const top = Math.min(this.sy(f.y), this.sy(v.ay));
    if (top > VIEW_H + 40 || Math.max(this.sy(f.y), this.sy(v.ay)) < -40) return;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 24; k++) {
      const [x, y] = this.trailAt(f, v, k / 24);
      pts.push([this.sx(x), this.sy(y)]);
    }
    const line = (w: number, c: string) => {
      g.lineWidth = w;
      g.strokeStyle = c;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    };
    line(34, "rgba(70,52,34,0.45)");
    line(22, "rgba(150,118,80,0.42)");
    line(6, "rgba(190,160,110,0.25)");
  }

  private drawVillageGround(v: Village) {
    const g = this.ctx;
    this.drawTrail(v);
    const x = this.sx(v.ax);
    const y = this.sy(v.ay);
    if (y < -260 || y > VIEW_H + 260 || x < -300 || x > this.W + 300) return;
    const calm = this.o.settings.calm;
    if (v.kind === "glade") this.drawGlade(v, x, y);
    if (v.state === "saved") {
      const k = Math.min(1, v.t / 1.2);
      const R = (v.kind === "glade" ? 170 : v.kind === "village" ? 170 : 130) * (0.3 + 0.7 * k);
      const gr = g.createRadialGradient(x, y - 40, 4, x, y - 40, R);
      gr.addColorStop(0, "rgba(140,240,120,0.42)");
      gr.addColorStop(0.7, "rgba(120,220,110,0.18)");
      gr.addColorStop(1, "rgba(120,220,110,0)");
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(x, y - 40, R, R * 0.7, 0, 0, Math.PI * 2);
      g.fill();
      // the edge of the sanctuary
      const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 2.4 + v.id);
      g.strokeStyle = `rgba(190,255,220,${(0.25 + pulse * 0.2).toFixed(2)})`;
      g.lineWidth = 2;
      g.setLineDash([6, 8]);
      g.beginPath();
      g.ellipse(x, y, MISSION.sanctuary * k, MISSION.sanctuary * 0.77 * k, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      return;
    }
    if (v.state === "lost" || v.state === "spared" || v.state === "left") {
      if (v.kind === "glade") return;
      g.fillStyle = v.state === "lost" ? "rgba(20,10,10,0.35)" : "rgba(20,20,20,0.18)";
      g.beginPath();
      g.ellipse(x, y - 30, 130, 80, 0, 0, Math.PI * 2);
      g.fill();
      return;
    }
    // waiting: a ring of light at its heart; a heart floats over it, or, at a glade, a green shoot
    const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 4 + v.id);
    const rgb = v.kind === "glade" ? "140,255,170" : "255,140,170";
    const glow = g.createRadialGradient(x, y, 2, x, y, 40);
    glow.addColorStop(0, `rgba(${rgb},${(0.3 + pulse * 0.2).toFixed(2)})`);
    glow.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = glow;
    g.beginPath();
    g.ellipse(x, y, 40, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = "rgba(0,0,0,0.5)";
    g.beginPath();
    g.ellipse(x, y, 30, 13, 0, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2.6;
    g.strokeStyle = v.kind === "glade" ? `rgba(${200 + Math.round(pulse * 40)},255,210,0.95)` : `rgba(255,${236 + Math.round(pulse * 19)},190,0.95)`;
    g.stroke();
    g.lineWidth = 1.4;
    g.setLineDash([5, 6]);
    g.lineDashOffset = calm ? 0 : -this.t * 14;
    g.strokeStyle = v.kind === "glade" ? "rgba(150,240,120,0.9)" : "rgba(240,200,90,0.9)";
    g.beginPath();
    g.ellipse(x, y, 38, 17, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    g.lineDashOffset = 0;
    const hy = y - 18 - (calm ? 0 : Math.sin(this.t * 3 + v.id) * 3);
    if (v.kind === "glade") {
      // a shoot with two leaves
      g.strokeStyle = "#2e6a22";
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(x, hy + 8);
      g.quadraticCurveTo(x - 1, hy, x, hy - 8);
      g.stroke();
      g.fillStyle = "#8ae05a";
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(x + s * 5, hy - 4, 6, 3, s * -0.5, 0, Math.PI * 2);
        g.fill();
      }
      return;
    }
    g.beginPath();
    g.moveTo(x, hy + 7);
    g.bezierCurveTo(x - 10, hy, x - 6, hy - 9, x, hy - 4);
    g.bezierCurveTo(x + 6, hy - 9, x + 10, hy, x, hy + 7);
    g.fillStyle = "#e8304a";
    g.fill();
    g.lineWidth = 1.2;
    g.strokeStyle = "#1c1410";
    g.stroke();
  }

  /** a glade: a mire choked with rot, ringed by dead thorn; healed, a spring among bushes, ferns and fireflies */
  private drawGlade(v: Village, x: number, y: number) {
    const g = this.ctx;
    const calm = this.o.settings.calm;
    const k = v.state === "saved" ? Math.min(1, v.t / 1.4) : 0;
    const px = x;
    const py = y - 46;
    const R = rng(v.id * 7919 + 3);
    // the ground: the mire, then moss coming over it
    const mudShapes: [number, number, number, number][] = [];
    for (let q = 0; q < 6; q++) mudShapes.push([px + (R() - 0.5) * 90, py + (R() - 0.5) * 34, 34 + R() * 26, 16 + R() * 10]);
    g.fillStyle = "#2a2016";
    for (const [mx, my, rx, ry] of mudShapes) {
      g.beginPath();
      g.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#3a2c1e";
    for (const [mx, my, rx, ry] of mudShapes) {
      g.beginPath();
      g.ellipse(mx - 4, my - 3, rx * 0.7, ry * 0.6, 0, 0, Math.PI * 2);
      g.fill();
    }
    if (k > 0) {
      g.globalAlpha = k;
      g.fillStyle = "#4a8a34";
      for (const [mx, my, rx, ry] of mudShapes) {
        g.beginPath();
        g.ellipse(mx, my, rx + 4, ry + 3, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = "#62a844";
      for (const [mx, my, rx, ry] of mudShapes) {
        g.beginPath();
        g.ellipse(mx - 3, my - 3, rx * 0.65, ry * 0.55, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    // the water: a black, glistening slough, or a clear spring
    if (k < 1) {
      g.globalAlpha = 1 - k;
      g.fillStyle = "#17110c";
      g.beginPath();
      g.ellipse(px, py, 40, 17, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(150,140,110,0.3)";
      for (const [dx, dy, w] of [[-18, -5, 9], [10, -8, 6], [20, 4, 5]] as const) {
        g.beginPath();
        g.ellipse(px + dx, py + dy, w, 2, 0, 0, Math.PI * 2);
        g.fill();
      }
      for (let q = 0; q < 5; q++) {
        const ph = calm ? 0.5 : (this.t * 0.6 + q * 0.31) % 1;
        g.fillStyle = `rgba(110,150,60,${(0.7 * (1 - ph)).toFixed(2)})`;
        g.beginPath();
        g.arc(px - 26 + q * 13, py - 2 + (q % 2) * 6, 1.6 + ph * 3.4, 0, Math.PI * 2);
        g.fill();
      }
      // a rot-green breath over it
      if (!calm) {
        const ph = (this.t * 0.4) % 1;
        g.fillStyle = `rgba(125,255,79,${(0.12 * (1 - ph)).toFixed(3)})`;
        g.beginPath();
        g.ellipse(px + 6, py - 14 - ph * 26, 22 + ph * 10, 7, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    if (k > 0) {
      g.globalAlpha = k;
      const wg = g.createRadialGradient(px - 8, py - 4, 2, px, py, 36);
      wg.addColorStop(0, "#e8fdff");
      wg.addColorStop(0.45, "#6fd2dc");
      wg.addColorStop(1, "#22707e");
      g.fillStyle = wg;
      g.beginPath();
      g.ellipse(px, py, 34 * k + 6, 14 * k + 3, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#3a6a2a";
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = "rgba(255,255,255,0.7)";
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(px - 8, py - 4, 12, 2.5, -0.1, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
      g.globalAlpha = 1;
    }
    // the ring of bushes: dead thorn, or green and in flower
    for (let q = 0; q < 9; q++) {
      const a = Math.PI * 0.9 + (q / 8) * Math.PI * 1.2 + (R() - 0.5) * 0.2;
      const bx = px + Math.cos(a) * (96 + R() * 10);
      const by = py + 8 + Math.sin(a) * (46 + R() * 6);
      const size = 0.8 + R() * 0.5;
      if (k < 1) {
        g.globalAlpha = 1 - k;
        g.strokeStyle = "#3a2e26";
        g.lineWidth = 1.6;
        g.beginPath();
        for (let b = 0; b < 6; b++) {
          const ang = -Math.PI / 2 + (b - 2.5) * 0.42;
          const len = (12 + (b % 3) * 4) * size;
          g.moveTo(bx, by);
          g.lineTo(bx + Math.cos(ang) * len, by + Math.sin(ang) * len);
          g.moveTo(bx + Math.cos(ang) * len * 0.6, by + Math.sin(ang) * len * 0.6);
          g.lineTo(bx + Math.cos(ang + 0.6) * len * 0.85, by + Math.sin(ang + 0.6) * len * 0.85);
        }
        g.stroke();
        g.globalAlpha = 1;
      }
      if (k > 0) {
        const s2 = size * (0.4 + 0.6 * k);
        g.globalAlpha = Math.min(1, k * 1.4);
        g.fillStyle = "rgba(0,0,0,0.22)";
        g.beginPath();
        g.ellipse(bx, by + 2, 15 * s2, 5 * s2, 0, 0, Math.PI * 2);
        g.fill();
        for (const [dx, dy, r, c] of [[-7, -8, 9, "#2e6a22"], [7, -9, 9, "#3a7a2a"], [0, -15, 10, "#4a9a34"], [-3, -19, 6, "#6ab84a"]] as const) {
          g.fillStyle = c;
          g.beginPath();
          g.arc(bx + dx * s2, by + dy * s2, r * s2, 0, Math.PI * 2);
          g.fill();
        }
        // blossoms and berries
        const bloom = q % 3 === 0 ? "#ffffff" : q % 3 === 1 ? "#ff8ab0" : "#d02a3a";
        for (let f = 0; f < 3; f++) {
          g.fillStyle = bloom;
          g.beginPath();
          g.arc(bx + (f - 1) * 6 * s2, by - (12 + (f % 2) * 7) * s2, 1.8, 0, Math.PI * 2);
          g.fill();
        }
        g.globalAlpha = 1;
      }
    }
    if (k <= 0) return;
    // ferns and a fairy ring of mushrooms
    g.globalAlpha = k;
    g.strokeStyle = "#5aa040";
    g.lineWidth = 1.4;
    for (const [fx, fy, dir] of [[px - 52, py + 22, -1], [px + 50, py + 24, 1], [px - 10, py + 30, 1]] as const) {
      for (let f = 0; f < 4; f++) {
        const a = -Math.PI / 2 + dir * (0.3 + f * 0.35);
        g.beginPath();
        g.moveTo(fx, fy);
        g.quadraticCurveTo(fx + Math.cos(a) * 8, fy + Math.sin(a) * 12, fx + Math.cos(a) * 16, fy + Math.sin(a) * 14 + 4);
        g.stroke();
      }
    }
    for (let q = 0; q < 7; q++) {
      const a = (q / 7) * Math.PI * 2;
      const mx = px + Math.cos(a) * 58;
      const my = py + 6 + Math.sin(a) * 26;
      g.fillStyle = "#f2ead8";
      g.fillRect(mx - 0.8, my - 4, 1.6, 4);
      g.fillStyle = q % 2 ? "#d0303a" : "#e8c66a";
      g.beginPath();
      g.ellipse(mx, my - 4, 3, 1.8, 0, Math.PI, 0);
      g.fill();
    }
    // fireflies: the land's own light
    g.save();
    g.globalCompositeOperation = "lighter";
    for (let q = 0; q < 10; q++) {
      const a = (calm ? q : this.t * (0.4 + (q % 3) * 0.15)) + q * 1.9;
      const fx = px + Math.cos(a) * (30 + (q % 4) * 16);
      const fy = py - 22 + Math.sin(a * 1.3) * (14 + (q % 3) * 6);
      const tw = calm ? 0.7 : 0.4 + 0.6 * Math.abs(Math.sin(this.t * 2 + q));
      const gr = g.createRadialGradient(fx, fy, 0, fx, fy, 6);
      gr.addColorStop(0, `rgba(255,250,170,${(0.9 * tw * k).toFixed(2)})`);
      gr.addColorStop(1, "rgba(255,250,170,0)");
      g.fillStyle = gr;
      g.fillRect(fx - 6, fy - 6, 12, 12);
    }
    g.restore();
    g.globalAlpha = 1;
    // birds over it
    if (k >= 1) {
      const fr = this.runArt.raven;
      for (let q = 0; q < 2; q++) {
        const a = (calm ? 0 : this.t * 0.9) + q * Math.PI;
        const f = fr[wrap(Math.floor(this.t * 8) + q, fr.length)];
        if (f) this.putFlip(f, px + Math.cos(a) * 80, py - 74 + Math.sin(a) * 18, Math.sin(a) < 0);
      }
    }
  }

  /** where the road forks: a post with two arms */
  private drawSignpost(v: Village) {
    if (!v.fork || v.kind !== "village" || v.state !== "waiting") return;
    const other = this.villages.find((w) => w.id === v.pair);
    const g = this.ctx;
    const x = this.sx(v.fork.x);
    const y = this.sy(v.fork.y);
    if (y < -60 || y > VIEW_H + 60) return;
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.beginPath();
    g.ellipse(x, y + 2, 12, 4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#5a3a22";
    g.fillRect(x - 3, y - 44, 6, 46);
    const arm = (dir: number, label: string, c: string, yy: number) => {
      g.fillStyle = "#8a6a3a";
      g.strokeStyle = "#2a1a10";
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x, yy - 8);
      g.lineTo(x + dir * 52, yy - 8);
      g.lineTo(x + dir * 60, yy);
      g.lineTo(x + dir * 52, yy + 8);
      g.lineTo(x, yy + 8);
      g.closePath();
      g.fill();
      g.stroke();
      g.font = "bold 10px system-ui, sans-serif";
      g.textAlign = dir > 0 ? "left" : "right";
      g.fillStyle = c;
      g.fillText(label, x + dir * 6, yy + 3.5);
    };
    const vDir = Math.sign(v.ax - v.fork.x) || 1;
    arm(vDir, "2 souls", "#fff4d8", y - 36);
    if (other) arm(-vDir, other.memory >= 0 ? "glade ✦" : "glade", "#d8ffd0", y - 18);
  }

  /** what a place is, big and white, while it waits; then what came of it, for a moment */
  private drawVillageLabel(v: Village) {
    this.drawSignpost(v);
    const g = this.ctx;
    const x = Math.max(70, Math.min(this.W - 70, this.sx(v.ax)));
    const y = this.sy(v.ay) - (v.kind === "glade" ? 104 : 54);
    if (y < -40 || y > VIEW_H + 40) return;
    g.textAlign = "center";
    g.lineJoin = "round";
    const text = (t: string, yy: number, size: number, c: string, a = 1) => {
      g.globalAlpha = a;
      g.font = `bold ${size}px system-ui, sans-serif`;
      g.lineWidth = size > 16 ? 5 : 3.5;
      g.strokeStyle = "rgba(0,0,0,0.85)";
      g.strokeText(t, x, yy);
      g.fillStyle = c;
      g.fillText(t, x, yy);
      g.globalAlpha = 1;
    };
    const K = VILLAGE_KINDS[v.kind];
    if (v.state === "waiting") {
      if (v.kind === "glade") {
        text("The Glade", y, 22, "#d8ffd0");
        text(v.memory >= 0 ? `an animal friend · ✦ memory ${v.memory + 1}${v.clarify ? ", to clear" : ""}` : "an animal friend", y + 17, 12, "#b8ffe0");
      } else {
        text(`${v.size} ${v.size === 1 ? "soul" : "souls"}`, y, 24, "#ffffff");
        text(`${K.name} · ${v.name}`, y + 17, 12, "#f3e6b8");
      }
    } else if (v.t < 2.5) {
      const a = Math.max(0, 1 - v.t / 2.5);
      if (v.state === "saved") text(v.kind === "glade" ? "healed" : `+${v.size} ${v.size === 1 ? "soul" : "souls"}`, y - v.t * 14, 22, "#b8ffb0", a);
      else if (v.state === "lost") text(`${v.name} is lost`, y, 18, "#ff8a8a", a);
      else if (v.state === "spared") text("led into the woods", y, 15, "#d8e0d0", a);
    }
  }

  private drawSpringTree(t: { x: number; y: number; big: boolean; t: number }) {
    const k0 = (this.t - t.t) / 1.3;
    if (k0 <= 0) return;
    const k = this.o.settings.calm ? 1 : 1 - Math.pow(1 - Math.min(1, k0), 3);
    const s = this.life.trees[t.big ? 0 : 1];
    const x = this.sx(t.x);
    const y = this.sy(t.y);
    if (y < -160 || y > VIEW_H + 60 || x < -80 || x > this.W + 80) return;
    const g = this.ctx;
    g.save();
    g.translate(x, y + 4);
    g.scale(k, k);
    g.drawImage(s.c, -SPRING_TREE.ax, -SPRING_TREE.ay, s.w, s.h);
    g.restore();
  }

  private drawCheer(c: { x: number; y: number; v: number; at: number; reborn: boolean }) {
    const x = this.sx(c.x);
    const y = this.sy(c.y);
    const since = this.finaleT - c.at;
    const g = this.ctx;
    if (c.reborn && since < 0.6) {
      const r = 6 + since * 60;
      g.strokeStyle = `rgba(255,255,230,${(1 - since / 0.6).toFixed(2)})`;
      g.lineWidth = 3;
      g.beginPath();
      g.ellipse(x, y - 16, r, r * 0.8, 0, 0, Math.PI * 2);
      g.stroke();
    }
    const f = 3 + wrap(Math.floor(this.finaleT * 4 + c.x * 0.1), 2);
    this.put(this.life.folk[c.v][f], x, y + 2, Math.min(1, since / 0.4));
  }

  /** the light of the end: a warm wave out from her, a pillar where she stood, hearts going to the reborn */
  private drawFinale() {
    const g = this.ctx;
    const T = this.finaleT;
    const x = this.sx(this.x);
    const y = this.PY;
    const W = this.W;
    // the wells light up: a pillar of warm light out of each
    const wa = Math.min(1, Math.max(0, (T - 4.5) / 1.5));
    if (wa > 0)
      for (const o of this.wells) {
        const wx = this.sx(o.x);
        const wy = this.sy(o.y) - 8;
        if (wy < -120 || wy > VIEW_H + 40 || wx < -60 || wx > W + 60) continue;
        g.save();
        g.globalCompositeOperation = "lighter";
        const gr = g.createRadialGradient(wx, wy, 2, wx, wy, 46);
        gr.addColorStop(0, `rgba(255,250,210,${(0.9 * wa).toFixed(2)})`);
        gr.addColorStop(0.5, `rgba(180,255,230,${(0.35 * wa).toFixed(2)})`);
        gr.addColorStop(1, "rgba(180,255,230,0)");
        g.fillStyle = gr;
        g.beginPath();
        g.ellipse(wx, wy, 46, 22, 0, 0, Math.PI * 2);
        g.fill();
        const up = g.createLinearGradient(0, wy - 110, 0, wy);
        up.addColorStop(0, "rgba(255,246,210,0)");
        up.addColorStop(1, `rgba(255,246,210,${(0.45 * wa).toFixed(2)})`);
        g.fillStyle = up;
        g.fillRect(wx - 16, wy - 110, 32, 110);
        g.restore();
      }
    g.fillStyle = `rgba(255,240,190,${Math.min(0.22, T * 0.03).toFixed(3)})`;
    g.fillRect(0, 0, W, VIEW_H);
    if (!this.o.settings.calm) {
      const R = T * 240;
      if (R < 1400) {
        const gr = g.createRadialGradient(x, y, Math.max(0, R - 60), x, y, R);
        gr.addColorStop(0, "rgba(220,255,200,0)");
        gr.addColorStop(0.7, "rgba(220,255,200,0.35)");
        gr.addColorStop(1, "rgba(220,255,200,0)");
        g.fillStyle = gr;
        g.fillRect(0, 0, W, VIEW_H);
      }
    }
    if (T > 2.4) {
      // a soft beam where she stands: wide and faint at the top, bright at her feet
      const a = Math.min(1, (T - 2.4) / 1.5);
      const w = 34 + a * 16;
      g.save();
      g.globalCompositeOperation = "lighter";
      const across = g.createLinearGradient(x - w, 0, x + w, 0);
      across.addColorStop(0, "rgba(255,246,210,0)");
      across.addColorStop(0.5, `rgba(255,246,210,${(0.5 * a).toFixed(2)})`);
      across.addColorStop(1, "rgba(255,246,210,0)");
      g.fillStyle = across;
      g.beginPath();
      g.moveTo(x - w * 1.6, 0);
      g.lineTo(x + w * 1.6, 0);
      g.lineTo(x + w * 0.7, y + 6);
      g.lineTo(x - w * 0.7, y + 6);
      g.closePath();
      g.fill();
      const pool = g.createRadialGradient(x, y, 2, x, y, 70);
      pool.addColorStop(0, `rgba(255,250,225,${(0.6 * a).toFixed(2)})`);
      pool.addColorStop(1, "rgba(255,250,225,0)");
      g.fillStyle = pool;
      g.beginPath();
      g.ellipse(x, y, 70, 30, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    // her hearts leave her and become people
    const heart = this.picksArt.heart;
    for (const c of this.cheer) {
      if (!c.reborn) continue;
      const k = (T - (c.at - 1.2)) / 1.2;
      if (k < 0 || k >= 1) continue;
      const hx = x + (this.sx(c.x) - x) * k;
      const hy = y - 50 + (this.sy(c.y) - 20 - (y - 50)) * k - Math.sin(k * Math.PI) * 60;
      this.put(heart, hx, hy + 20);
    }
  }

  /** the fall: a quick tumble, then the rider and her mount lying on the ground */
  private drawFallen(x: number, y: number) {
    const g = this.ctx;
    const tumble = this.o.settings.calm ? 1 : Math.min(1, this.dead / 0.22);
    if (tumble < 1) {
      const s = this.hero[0];
      if (!s) return;
      g.save();
      g.translate(x, y + 6 + tumble * 8);
      g.rotate(this.deathDir * tumble * 1.35);
      g.drawImage(s.c, -s.ax, -s.ay, s.w, s.h);
      g.restore();
      return;
    }
    if (!this.fallen) {
      const c = this.o.choice;
      this.fallen = fallenFrame(this.S, c.rider.id, c.mount.id, c.look, !this.o.settings.lessBlood);
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.ellipse(x - 6, y + 8, FALLEN.w * 0.36, 16, 0, 0, Math.PI * 2);
    g.fill();
    this.put(this.fallen, x, y + 8);
  }

  /** the pool spreading out under the body (grey dust with "less blood") */
  private drawPool() {
    const g = this.ctx;
    const less = this.o.settings.lessBlood;
    const k = this.o.settings.calm ? 1 : 1 - Math.pow(1 - Math.min(1, this.dead / 1.5), 3);
    const R = (less ? 54 : 80) * (0.2 + 0.8 * k);
    const cx = this.sx(this.x) + 2;
    const cy = this.PY + 14;
    const sd = this.deathSeed;
    const a1 = (sd % 7) * 0.9;
    const a2 = (sd % 11) * 0.6;
    const a3 = (sd % 13) * 0.5;
    const edge = (a: number) => R * (1 + 0.14 * Math.sin(3 * a + a1) + 0.09 * Math.sin(5 * a + a2) + 0.05 * Math.sin(9 * a + a3));
    const path = (grow: number) => {
      g.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const r = edge(a) + grow;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r * 0.48;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
    };
    if (less) {
      g.fillStyle = "rgba(70,72,62,0.7)";
      path(0);
      g.fill();
      return;
    }
    // a darker rim, the pool, a wet shine
    g.fillStyle = "#3a040a";
    path(2.5);
    g.fill();
    const gr = g.createRadialGradient(cx, cy, 2, cx, cy, R * 1.1);
    gr.addColorStop(0, "#9a1020");
    gr.addColorStop(0.7, "#7a0a16");
    gr.addColorStop(1, "#56060e");
    g.fillStyle = gr;
    path(0);
    g.fill();
    g.fillStyle = "rgba(255,150,150,0.22)";
    g.beginPath();
    g.ellipse(cx - R * 0.35, cy - R * 0.2, R * 0.3, R * 0.06, -0.08, 0, Math.PI * 2);
    g.fill();
    // drops thrown further out
    if (k > 0.4) {
      g.fillStyle = "#6a0812";
      for (let i = 0; i < 7; i++) {
        const a = ((sd >> i) % 360) * (Math.PI / 180) + i;
        const r = R * (1.12 + ((sd >> (i + 3)) % 30) / 100);
        g.beginPath();
        g.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.48, 2.6 + (i % 3), 1.4 + (i % 2), 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  private drawHero() {
    const g = this.ctx;
    const x = this.sx(this.x);
    const y = this.PY;
    const jumpP = this.air > 0 ? 1 - this.air / this.airDur : 0;
    const lift = this.air > 0 ? Math.sin(jumpP * Math.PI) * 22 : 0;
    if (this.dead) {
      this.drawFallen(x, y);
      return;
    }
    g.fillStyle = "rgba(0,0,0,0.32)";
    g.beginPath();
    g.ellipse(x, y + 4, this.air > 0 ? 13 : 18, this.air > 0 ? 4 : 5.5, 0, 0, Math.PI * 2);
    g.fill();
    if (this.inv > 0 && !this.o.settings.calm && !this.finaleT && Math.floor(this.inv * 12) % 2 === 0) return;
    const f = this.air > 0 ? 8 : this.duck > 0 ? 9 : wrap(Math.floor(this.t * 12 * (Math.max(30, this.speed) / 130)), 8);
    // at the end she goes into the light
    const fade = this.finaleT ? Math.max(0, 1 - (this.finaleT - 3) / 2.6) : 1;
    if (fade <= 0) return;
    this.put(this.hero[f], x, y + 6 - lift, (this.inv > 0 && this.o.settings.calm ? 0.6 : 1) * Math.min(1, fade));
    if (this.bark || (this.o.choice.rider.id === "knight" && this.shieldReady)) {
      g.strokeStyle = this.bark ? "rgba(200,160,96,0.8)" : "rgba(200,210,230,0.8)";
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(x, y - 40 - lift, 44, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    }
    if (this.swing > 0) {
      g.strokeStyle = "rgba(255,255,255,0.9)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y - 20, 34, Math.PI * 1.1, Math.PI * 1.9);
      g.stroke();
    }
  }

  private drawMonster(q: Monster) {
    const g = this.ctx;
    const b = MONSTER_BOX[q.type];
    let x = this.sx(q.x);
    let y = this.sy(q.y);
    if (y > VIEW_H + 20 || y < -b.h) return;
    const moving = q.state === "run" || q.state === "lunge" || q.state === "recover" || q.state === "windup";
    const f = moving ? wrap(Math.floor(q.phase * (q.state === "lunge" ? 14 : 9)), 4) : 0;
    let a = 1;
    if (q.state === "emerge") a = 1 - q.timer / 0.6;
    if (q.state === "dying") {
      a = Math.max(0, q.timer / 0.6);
      if (q.how === "pit") y += (1 - q.timer / 0.8) * 16;
    }
    if (q.state === "windup" && !this.o.settings.calm) x += Math.sin(this.t * 60) * 1.6;
    // a smoke of the dark it came from, clinging round its feet
    const smoke = g.createRadialGradient(x, y - b.h * 0.25, 2, x, y - b.h * 0.25, b.w * 0.75);
    smoke.addColorStop(0, `rgba(12,4,14,${(0.42 * a).toFixed(2)})`);
    smoke.addColorStop(1, "rgba(12,4,14,0)");
    g.fillStyle = smoke;
    g.fillRect(x - b.w, y - b.h, b.w * 2, b.h * 1.3);
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.beginPath();
    g.ellipse(x, y + 2, b.w * 0.3, 5, 0, 0, Math.PI * 2);
    g.fill();
    const fed = Math.min(5, q.fed ?? 0);
    if (fed > 0 && q.state !== "dying") {
      // fed on the living: a red glow that grows with every meal
      const pulse = this.o.settings.calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 6 + q.id);
      const cy = y - b.h * 0.45;
      const gr = g.createRadialGradient(x, cy, 2, x, cy, b.w * (0.5 + fed * 0.06));
      gr.addColorStop(0, `rgba(255,40,30,${(0.16 + fed * 0.07 + pulse * 0.1).toFixed(2)})`);
      gr.addColorStop(1, "rgba(255,40,30,0)");
      g.fillStyle = gr;
      g.fillRect(x - b.w, cy - b.h, b.w * 2, b.h * 2);
    }
    const lean = q.state === "lunge" ? 6 : 0;
    this.put(this.mons[q.type][f], x, y + 2 + lean, a);
    if (q.state === "windup") {
      // the warning before it leaps
      g.font = "bold 22px system-ui, sans-serif";
      g.textAlign = "center";
      g.lineWidth = 4;
      g.strokeStyle = "#000";
      g.strokeText("!", x, y - b.h + 4);
      g.fillStyle = "#ff4040";
      g.fillText("!", x, y - b.h + 4);
    }
    if (q.state === "rooted") {
      g.strokeStyle = "#5a3a22";
      g.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(x + i * 7, y + 3);
        g.quadraticCurveTo(x + i * 9, y - 10, x + i * 5, y - 20 - (i % 2 ? 4 : 0));
        g.stroke();
      }
    }
    if (q.state === "stunned") {
      g.fillStyle = "#fff4a0";
      for (const o of [0, 2.1, 4.2]) {
        const an = q.phase * 6 + o;
        g.beginPath();
        g.arc(x + Math.cos(an) * 12, y - b.h + 8 + Math.sin(an) * 3, 2, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (q.blind > 0) {
      g.fillStyle = "rgba(20,20,30,0.85)";
      g.fillRect(x - 14, y - b.h * 0.62, 28, 6);
    }
  }

  private drawCompanion() {
    const c = this.comp!;
    const f = wrap(Math.floor(this.t * 8), 2);
    this.put(this.runArt[c.kind][f], this.sx(c.x), this.sy(c.y) + 4);
  }
}

/** an animated picture of a rider on her mount, for the menus (frame counts up) */
export function heroPreview(choice: Choice, frames: Spr[] | null, frame: number, into: HTMLCanvasElement, S: number) {
  const fr = frames ?? Array.from({ length: HERO_FRAMES }, (_, f) => heroFrame(S, choice.rider.id, choice.mount.id, choice.look, f));
  into.width = Math.ceil(HERO.w * S);
  into.height = Math.ceil((HERO.h + 4) * S);
  const g = into.getContext("2d")!;
  g.setTransform(S, 0, 0, S, 0, 0);
  g.clearRect(0, 0, HERO.w, HERO.h + 4);
  g.fillStyle = "rgba(0,0,0,0.3)";
  g.beginPath();
  g.ellipse(HERO.ax, HERO.ay + 4, 18, 5.5, 0, 0, Math.PI * 2);
  g.fill();
  const s = fr[wrap(frame, 8)];
  g.drawImage(s.c, 0, 0, s.w, s.h);
  return fr;
}

export { mix };
