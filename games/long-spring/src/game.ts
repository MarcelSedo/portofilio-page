/**
 * The Long Spring: the game itself. One class, one canvas, one loop.
 *
 * The world: y grows in the direction you ride (down the screen), x is sideways and endless.
 * You stay near the top of the screen; the land comes up at you from below.
 * The monsters come from behind (the top of the screen), are a little faster than you,
 * and leap at you when they are close. You can't outrun them: lead them into things.
 */
import {
  BIOMES, ENDLESS, EVENTS, EXTREME, FORD, GOAL_M, LETTER_GAP_M, LIFE, MISSION, MISSION_ROSTER, MONSTERS, OBSTACLES, RUIN, RUNE, SPELLS, TUNE, huntersAt,
  type EndlessEvent, type Kind, type Look, type MonsterId, type Mount, type PickKind, type Rider, type SpellId,
} from "./config";
import { emptyStats, type Mission, type Settings, type Stats } from "./meta";
import {
  FALLEN, GROUND_TILE, HERO, HERO_FRAMES, MONSTER_BOX, allLands, boneSprites, ruinSprites, companionRun, fallenFrame, heroFrame, heroFrames, letterStone, mix, monsterFrames, pickSprites, trapSet,
  type Land, type Picks, type Spr,
} from "./sprites";
import { sfx } from "./sound";
import {
  COTTAGE_DOOR, GATE, SPRING_TREE, animalSprites, cottageSprites, gateSprite, springTreeSprites, villagerSprites, wellSprite, VILLAGER_KINDS,
  type AnimalId,
} from "./art-life";
import { GIFTS, MEMORIES, NEED, VILLAGE_KINDS, line as folkLine, personName, villageName, type GiftId, type VillageKind, type VillageSize } from "./story";

/** the height of the view in world units, whatever the screen */
export const VIEW_H = 600;
const PY_AT = 0.3; // where you ride, from the top
const CELL = 160;

type Obstacle = { id: number; kind: Kind; x: number; y: number; w: number; h: number; v: number; dead?: boolean; cleared?: boolean; vid?: number; scar?: boolean };
type Pick = { id: number; kind: PickKind; x: number; y: number; taken?: boolean; letter?: string };
/** life in the woods: crows and flies in the rot, butterflies and small birds where it is green */
type Critter = { kind: "crow" | "flies" | "butterfly" | "finch" | "fairy"; x: number; y: number; ph: number; c: string; flown?: number; ring?: { cx: number; cy: number; i: number; n: number } };
type Cell = { obs: Obstacle[]; picks: Pick[]; scar?: boolean; life?: Critter[]; decor?: { x: number; y: number; v: number }[] };
type MState = "emerge" | "run" | "windup" | "lunge" | "recover" | "stunned" | "rooted" | "flee" | "dying" | "gone" | "under" | "burst" | "swell" | "reach";
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
export type Mode = "endless" | "mission" | "tutorial" | "extreme";
type Monster = {
  id: number; type: MonsterId; x: number; y: number; vx: number; state: MState; timer: number; cool: number;
  judged: Set<number>; dodgeT: number; dodgeDir: number; blind: number; flinch: number; phase: number;
  aimX: number; lure?: Companion; how?: "pit" | "trap" | "arrow" | "sword" | "hound" | "dawn" | "beam";
  /** when lianas from a root trap took hold of it */
  vines?: number;
  /** meals: each one makes it faster and quicker to leap */
  fed?: number;
  /** made from the people of a lost village */
  turned?: boolean;
  /** what is left of it (arrows), and a flash when hit */
  hp: number; hitT: number;
  /** which side it flees to, the Collector's stolen soul */
  side: number; stolen?: { kind: "piece" | "lamp" | "arrows"; n: number };
  /** the Hands: where the arm is thrown */
  reachX?: number;
};
export type LampColour = "green" | "gold" | "blue";
export const LAMP: Record<LampColour, { rgb: string; core: string; name: string; gift: string }> = {
  green: { rgb: "125,255,120", core: "#d8ffd0", name: "green", gift: "a heart" },
  gold: { rgb: "255,208,90", core: "#fff4c8", name: "gold", gift: "three arrows" },
  blue: { rgb: "120,190,255", core: "#e0f0ff", name: "blue", gift: "a quiet step: they lose you for a while" },
};
type LampLight = { id: number; row: number; colour: LampColour; x: number; y: number; ph: number; gone?: boolean; taken?: boolean };
type Spit = { x: number; y: number; tx: number; ty: number; t: number; dur: number };
type Puddle = { x: number; y: number; t: number; hit?: boolean };
type Companion = { kind: "hound" | "raven" | "doe" | "fox" | "hare"; x: number; y: number; state: "follow" | "fight" | "rest" | "gone"; t: number; target?: Monster; vx: number; kills?: number };
type Dir4 = "up" | "down" | "left" | "right";
type Ford = { id: number; y0: number; y1: number; cx: number; land: number; rows: { y: number; xs: number[]; ok: number; passed?: boolean }[]; lit: number; bridged?: boolean; slipped?: boolean; told?: boolean; counted?: boolean };
type Wisp = { id: number; x: number; y: number; vx: number; ph: number; memory: number; clarify: boolean; hit?: number; piece?: boolean };
/** a chapter of the mission: a memory coming back, and the forgetting that runs against it */
type Chapter = { i: number; t: number; limit: number; got: number; wait: number; ring?: { x: number; y: number; ph: number }; stone?: number; told?: boolean };
/** one notch-group of an ogham letter: strokes to the right, to the left, across the stem, or dots on it */
type Piece = { side: "R" | "L" | "X" | "D"; n: number };
/** a rune being cast: its letter-pieces, shown for a moment, then set back on the stem from memory, bottom up */
type Cast = { slots: Piece[]; tray: number[]; cur: number; got: number; t: number; show: number; limit: number; spell: SpellId; end?: number; ok?: boolean };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number; ground?: boolean };

export type Choice = { rider: Rider; mount: Mount; look: Look };

export type Hud = {
  metres: number; kmh: number; score: number; multiplier: number; hearts: number; maxHearts: number;
  arrows: number; swords: number; maxSwords: number; traps: number;
  rune: SpellId | null; casting: boolean; focus: number; homing: number;
  ability: string; abilityReady: number; companion: string | null; companionRest: boolean; danger: number;
  biome: string; wordGot: number; aiming: boolean;
  /** the endless ride's lamp: the lights it wants, in order, and how many are in */
  lamp: { want: LampColour[]; got: number; mirror: boolean; streak: number } | null;
  mode: Mode; souls: number; need: number; land: number; finale: boolean; finaleT: number;
  /** the mission's chapter: the memory, its pieces won back, and how far the forgetting has gone (0–1) */
  chapter: { memory: number; got: number; forget: number } | null;
  /** the endless ride's event, and the hunt's clock and count */
  event: string | null; timeLeft: number; kills: number; lamps: number;
};

/** soft round glows, painted once per colour and stamped wherever they are needed */
const GLOWS = new Map<string, HTMLCanvasElement>();
function glowCanvas(rgb: string) {
  let c = GLOWS.get(rgb);
  if (!c) {
    c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`);
    gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    GLOWS.set(rgb, c);
  }
  return c;
}

/** a copy of a sprite with a canvas filter baked in (filters are slow when drawn every frame) */
function tinted(s: Spr, filter: string): Spr {
  const c = document.createElement("canvas");
  c.width = s.c.width;
  c.height = s.c.height;
  const g = c.getContext("2d")!;
  g.filter = filter;
  g.drawImage(s.c, 0, 0);
  return { ...s, c };
}

export type GameEvent =
  | { type: "say"; text: string; important?: boolean }
  | { type: "mission"; slot: number }
  | { type: "letter"; got: number; done: boolean }
  | { type: "lamp" }
  | { type: "biome"; index: number }
  | { type: "seen"; monster: MonsterId }
  | { type: "killed"; monster: MonsterId }
  | { type: "wisp"; memory: number; clear: boolean }
  /** a chapter begins; a piece of it is won back; it is remembered (the world waits `hold` s) or forgotten */
  | { type: "chapter"; memory: number }
  | { type: "piece"; memory: number; n: number; name: string }
  | { type: "memory"; memory: number; saved: boolean; hold: number; hearts: number; got: number; need: number }
  | { type: "event"; name: string }
  | { type: "spell"; spell: SpellId; ok: boolean }
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
  cottage: [104, 46], well: [28, 12], ruin: [70, 16],
};
const SEES_AS: Partial<Record<Kind, "tree" | "pit">> = {
  tree: "tree", boulder: "tree", menhir: "tree", stone: "tree", arch: "tree", pit: "pit", cottage: "tree", well: "tree", ruin: "tree",
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
  private ruinArt: Spr[] = [];
  private boneArt: Spr[] = [];
  private picksArt!: Picks;
  private runArt = {} as Record<"hound" | "raven" | "doe", Spr[]>;
  private trapArt!: Spr;
  private letters = new Map<string, Spr>();
  private life!: { cottage: Spr[]; cottageGrey: Spr[]; cottageLost: Spr[]; well: Spr; folk: Spr[][]; animals: Record<AnimalId, Spr[]>; gates: Spr[]; gold: Spr; trees: Spr[] };

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
  /** the rune you carry, and the one being cast */
  private rune: SpellId | null = null;
  private casting: Cast | null = null;
  /** the endless ride: a lamp to fill with lights, in the right order */
  private lamp: { want: LampColour[]; got: number; spilt: number; mirror: boolean } | null = null;
  private lampStreak = 0;
  /** rows of lights shown for this lamp so far */
  private lampRows = 0;
  private lights: LampLight[] = [];
  private nextLights: number = ENDLESS.lampFirst;
  private lightRow = 0;
  /** the Hands have hold of you */
  private grab: { q: Monster; t: number } | null = null;
  private spits: Spit[] = [];
  private puddles: Puddle[] = [];
  /** the Colossus comes rarely, and only to someone armed */
  private nextBoss = 0;
  private bossDone = false;
  private lastCast: { ok: boolean; t: number } | undefined;
  private coarse = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  private homing = 0;
  private bridge = false;
  private lastSpell: SpellId | undefined;
  /** the bow: where the mouse or the right stick points (screen units), and the calm of a drawn string */
  private pointer: { x: number; y: number; t: number } | null = null;
  private stick: number | null = null;
  private focus = 1;
  private slow = 1;
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
  private shots: { x: number; y: number; vx: number; vy: number; life: number; spear?: boolean; to?: Obstacle; home?: boolean; skip?: number[] }[] = [];
  private fords: Ford[] = [];
  private fordDone = -1;
  private fordAtM = 0;
  private wisps: Wisp[] = [];
  private nextWisp = 0;
  private soulRun = 0;
  private drops: { x: number; y: number; l: number; s: number }[] = [];
  private fx: Particle[] = [];
  private swing = 0;

  // the clock of the ride (s, real time, not counting held moments), what comes back by itself, and the endless ride's events
  private runT = 0;
  private regen = { a: 0, t: 0, s: 0, h: 0 };
  private event: { name: EndlessEvent; t: number; len: number } | null = null;
  private eventN = 0;
  private nextEventT: number = ENDLESS.firstEvent;
  private calmT = 0;
  private flash = 0;
  private beams: { x0: number; y0: number; x1: number; y1: number; t: number }[] = [];
  /** the creeping fog: comes now and then, green in the rot, grey as it heals, a bright blue in Bloom */
  private fog: { t: number; len: number } | null = null;
  private nextFogT = 70 + Math.random() * 60;
  private nextRuneT = 0;
  private extremeBoss = false;
  // the mission's chapters
  private chapter: Chapter | null = null;
  private queue: number[] = [];
  private savedLand = 0;
  private nextChapterM = 0;
  private savedRun: number[] = [];
  private lostRun: number[] = [];
  /** how grey the world is: follows the forgetting, and comes back to colour when a memory is won */
  private forgetVis = 0;
  /** The First Morning's ring of light */
  private tring: { x: number; y: number; ph: number } | null = null;

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
  private nextVillageM: number = ENDLESS.villageFirst;
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
    // the endless ride always starts from nothing, whatever land it is painted in
    this.mOff = this.mode === "endless" ? 0 : this.mode === "extreme" ? EXTREME.mOff : BIOMES[this.startLand].from;
    this.memories = [...(opts.memories ?? [])];
    this.clear = [...(opts.clear ?? [])];
    this.needBase = this.need = NEED[this.land];
    if (this.mode === "mission") this.startLandChapters(this.land);
    this.hearts = opts.choice.mount.hearts + (this.mode === "tutorial" ? 2 : 0);
    this.mult = opts.multiplier;
    this.wordGot = opts.wordGot;
    this.speed = this.targetSpeed();
    if (this.mode === "mission") this.arrows = MISSION.arrows;
    else if (this.mode === "extreme") this.arrows = EXTREME.arrows;
    const [wa, wb] = this.mode === "mission" ? MISSION.wispGap : ENDLESS.wispGap;
    this.nextWisp = 120 + Math.random() * (wb - wa) * 0.5 + wa * 0.4;
    this.fordAtM = this.mode === "endless" ? FORD.endlessGap[0] * 0.6 : MISSION.fordAt[0] + Math.random() * (MISSION.fordAt[1] - MISSION.fordAt[0]);
    for (let i = 0; i < 110; i++) this.drops.push({ x: Math.random() * 1600, y: Math.random() * VIEW_H, l: 7 + Math.random() * 7, s: 0.8 + Math.random() * 0.5 });
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
    this.ruinArt = ruinSprites(S);
    this.boneArt = boneSprites(S);
    for (const id of ["hound", "raven", "doe"] as const) this.runArt[id] = companionRun(S, id);
    this.hero = heroFrames(S, this.o.choice.rider.id, this.o.choice.mount.id, this.o.choice.look);
    this.fallen = null;
    this.life = {
      cottage: cottageSprites(S),
      cottageGrey: [],
      cottageLost: [],
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
    // never more than twice the CSS pixels, and less when the machine can't keep up
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * this.quality;
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
      const raw = (now - this.last) / 1000;
      const dt = Math.max(0, Math.min(1 / 30, raw));
      this.last = now;
      this.watchFrames(raw);
      this.step(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  private quality = 1;
  private frameSum = 0;
  private frameN = 0;
  private slowRuns = 0;
  /** if frames keep coming late, draw the canvas at a lower resolution (twice at most) */
  private watchFrames(raw: number) {
    if (raw <= 0 || raw > 0.25) return;
    this.frameSum += raw;
    this.frameN++;
    if (this.frameN < 120) return;
    const avg = this.frameSum / this.frameN;
    this.frameSum = 0;
    this.frameN = 0;
    if (avg > 1 / 48) this.slowRuns++;
    else this.slowRuns = 0;
    if (this.slowRuns >= 2 && this.quality > 0.6) {
      this.slowRuns = 0;
      this.quality = Math.max(0.6, this.quality - 0.2);
      this.resize();
    }
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
  key(k: "left" | "right" | "up" | "down" | "aim" | "sword" | "trap" | "ability" | "rune", down: boolean) {
    if (!this.running || this.dead || this.won || this.finaleT) return;
    // while a rune is being cast the arrows choose and set its pieces, and the mount runs straight on
    if (this.casting && !this.casting.end && (k === "left" || k === "right" || k === "up" || k === "down")) {
      if (down) this.runeStroke(k);
      return;
    }
    if (k === "rune") {
      if (down) this.startCast();
      return;
    }
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
    return this.mode === "endless" || this.mode === "extreme" ? this.o.choice.mount.hearts : MISSION.maxHearts;
  }
  /** px per second for the mount's real speed */
  private targetSpeed() {
    return ((this.kmhNow() / 3.6) / TUNE.metresPerPx) * (this.o.settings.slow || this.mode === "tutorial" ? 0.75 : 1) * (this.mode === "mission" ? MISSION.pace : 1);
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
    const scarP = landHere === 0 ? 0 : RUIN[landHere] ?? 0;
    const scar = scarP > 0 && rng(hash2(Math.floor(i / 2) * 31 + this.seed, Math.floor(j / 2) * 17 + 5))() < scarP;
    c.scar = scar;
    const b = BIOMES[scar ? 0 : landHere];
    const ramp = Math.min(1, 0.5 + m / 3000);
    const n = Math.round(TUNE.density * b.busy * ramp * (0.7 + r() * 0.6) * (this.mode === "extreme" ? 0.62 : 1));
    const ok = (k: Kind) => m >= OBSTACLES[k].from;
    const weights: [Kind, number][] = (
      [
        ["tree", 30], ["boulder", 12], ["menhir", 5], ["stone", 7], ["pit", 9 * b.pits], ["log", 11], ["arch", 3.5], ["thorns", 6],
        // what the rot left: burnt-out houses in the dark lands
        ["ruin", landHere === 0 ? 2 : landHere === 1 ? 1 : scar ? 0.6 : 0],
      ] as [Kind, number][]
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
    // bones and ash where the rot has been
    {
      const pBones = landHere === 0 ? 0.12 : landHere === 1 ? 0.06 : scar ? 0.04 : 0;
      if (r() < pBones) {
        const k = 1;
        c.decor = [];
        for (let q = 0; q < k; q++) {
          const x = i * CELL + 20 + r() * (CELL - 40);
          const y = y0 + 16 + r() * (CELL - 32);
          if (free(x, y, 40, 10, 2)) c.decor.push({ x, y, v: r() < 0.25 ? 4 : Math.floor(r() * 4) });
        }
      }
    }
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
      // in Bloom, now and then, fairies dance in a ring in a clearing; they scatter when you come
      if (landHere === 3 && !scar && r() < 0.09) {
        const cx = i * CELL + 40 + r() * (CELL - 80);
        const cy = y0 + 40 + r() * (CELL - 80);
        if (free(cx, cy, 46, 30, 4)) {
          const n = 6 + Math.floor(r() * 2);
          for (let q = 0; q < n; q++)
            life.push({ kind: "fairy", x: cx, y: cy, ph: r() * 10, c: ["#fff4c0", "#c8f0ff", "#ffd0e8", "#d8ffc8"][q % 4], ring: { cx, cy, i: q, n } });
        }
      }
      c.life = life;
    }
    // in the mission hearts are laid out ahead of you; weapons lie here and there in the land
    if (this.mode === "mission") {
      for (const [kind, p] of [["trap", 0.01], ["bow", 0.006], ["sword", 0.004], ["rune", 0.006]] as [PickKind, number][])
        if (r() < p) {
          const x = i * CELL + 18 + r() * (CELL - 36);
          const y = y0 + 18 + r() * (CELL - 36);
          if (okPick(x, y)) c.picks.push({ id: this.nextId++, kind, x, y });
        }
      return c;
    }
    if (this.mode !== "endless" && this.mode !== "extreme") return c;
    // the endless road and the hunt: weapons and now and then a heart lie on the road (more of them in the hunt)
    const hunt = this.mode === "extreme";
    const trapRate = (this.o.choice.rider.id === "dryad" ? 0.08 : 0.04) * (hunt ? 1.4 : 1);
    const table: [PickKind, number][] = [
      ["trap", trapRate], ["sword", hunt ? 0.04 : 0.028], ["bow", hunt ? 0.06 : 0.026], ["rune", hunt ? 0.016 : 0.012], ["heart", hunt ? 0.012 : 0.006],
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
  /** the mouse or a finger points the bow; null lets the keyboard's swinging line do it */
  setPointer(x: number | null, y = 0) {
    this.pointer = x === null ? null : { x, y, t: performance.now() };
  }
  /** the right stick: an angle (0 = straight behind you, up the screen), or null when let go */
  setStick(a: number | null) {
    this.stick = a;
  }
  /** a point on the canvas (CSS pixels) in view units */
  viewPoint(px: number, py: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: (px / Math.max(1, r.width)) * this.W, y: (py / Math.max(1, r.height)) * VIEW_H };
  }
  private aimFree() {
    return this.stick !== null || (this.pointer !== null && performance.now() - this.pointer.t < 4000);
  }
  private aimAngle() {
    if (this.stick !== null) return this.stick;
    if (this.pointer && this.aimFree()) {
      const dx = this.pointer.x - this.sx(this.x);
      const dy = this.pointer.y - (this.PY - 14);
      return Math.atan2(dx, -dy);
    }
    const period = this.o.choice.rider.id === "amazon" ? 2.6 : 1.6;
    return Math.sin((this.aimT * Math.PI * 2) / period) * ((65 * Math.PI) / 180);
  }
  private fire() {
    let a = this.aimAngle();
    const free = this.aimFree();
    const held = this.aimT;
    this.aimT = -1;
    if (this.arrows <= 0) return;
    this.arrows--;
    // aimed freely, a bow drawn too briefly is loose, and one held too long trembles
    if (free) {
      const spread = 0.34 * Math.max(0, 1 - held / 0.45) + Math.max(0, held - 1.8) * 0.22;
      a += (Math.random() - 0.5) * spread;
    }
    const s = 440;
    const home = this.homing > 0;
    if (home) this.homing--;
    this.shots.push({ x: this.x, y: this.y - 6, vx: Math.sin(a) * s, vy: this.speed - Math.cos(a) * s, life: home ? 1.4 : 0.95, home });
    sfx.arrow();
  }

  /* ---------------- runes ---------------- */

  private startCast() {
    if (this.casting && !this.casting.end) return;
    if (!this.rune) return this.say("No rune. Rune-stones stand here and there in the land: ride through one.");
    const m = this.metres;
    const len = RUNE.len[Math.min(3, this.mode === "endless" ? (m < 1500 ? 0 : m < 4000 ? 1 : m < 7000 ? 2 : 3) : this.mode === "tutorial" ? 0 : this.land)];
    const all: Piece[] = [];
    for (const side of ["R", "L", "X", "D"] as Piece["side"][]) for (let n = 1; n <= 4; n++) all.push({ side, n });
    const slots: Piece[] = [];
    while (slots.length < len) {
      const p = all.splice(Math.floor(Math.random() * all.length), 1)[0];
      slots.push(p);
    }
    const tray = slots.map((_, i) => i).sort(() => Math.random() - 0.5);
    if (tray.every((v, i) => v === i) && len > 1) tray.reverse();
    const show = RUNE.show + len * 0.2;
    this.casting = { slots, tray, cur: 0, got: 0, t: 0, show, limit: show + RUNE.base + len * RUNE.perPiece, spell: this.rune };
    this.keys.left = this.keys.right = false;
    this.aimT = -1;
    sfx.chime();
  }
  /** while casting: left and right choose a piece, up (or down) sets it on the stem */
  private runeStroke(d: Dir4) {
    const c = this.casting!;
    if (c.t < c.show || !c.tray.length) return;
    if (d === "left" || d === "right") {
      c.cur = (c.cur + (d === "left" ? -1 : 1) + c.tray.length) % c.tray.length;
      sfx.duck();
      return;
    }
    const pick = c.tray[c.cur];
    if (pick !== c.got) {
      const a = c.slots[pick];
      const b = c.slots[c.got];
      if (a.side !== b.side || a.n !== b.n) return this.endCast(false);
    }
    c.tray.splice(c.cur, 1);
    c.cur = Math.min(c.cur, Math.max(0, c.tray.length - 1));
    c.got++;
    sfx.pick();
    if (c.got >= c.slots.length) this.endCast(true);
  }
  private endCast(ok: boolean) {
    const c = this.casting!;
    c.end = this.t;
    c.ok = ok;
    this.lastCast = { ok, t: this.t };
    this.rune = null;
    this.o.onEvent({ type: "spell", spell: c.spell, ok });
    const anchoring = this.chapter && this.chapter.got === 2;
    if (!ok) {
      sfx.hit();
      if (anchoring) {
        this.chapter!.wait = MISSION.chapter.again;
        this.say("The rune breaks, and the memory slips. Another stone will come: find it, and try again.", true);
      } else this.say("The rune breaks, and the spell is gone.");
      return;
    }
    if (anchoring) {
      this.chapter!.got = 3;
      this.remember();
    }
    this.lastSpell = c.spell;
    this.stats.spells = (this.stats.spells ?? 0) + 1;
    this.beam();
    sfx.fanfare();
    const sp = SPELLS[c.spell];
    if (c.spell === "thorn") {
      let n = 0;
      for (const q of this.monsters)
        if (this.hunting(q) && q.state !== "flee" && this.y - q.y > -20 && this.y - q.y < 360) {
          q.state = "rooted";
          q.timer = 3;
          n++;
        }
      for (let k = -8; k <= 8; k++) this.burst(this.x + k * 22, this.y - 70, 6, ["#3a5a2a", "#6a8a3a", "#a8202a"], 50, true);
      this.say(n ? "A hedge of thorns springs up behind you. They are held." : "Thorns spring up behind you, and hold nothing.");
    } else if (c.spell === "light") {
      for (const q of this.monsters) {
        if (!this.hunting(q) || q.state === "flee" || Math.hypot(q.x - this.x, q.y - this.y) > 260) continue;
        if (q.type === "hollow" || q.type === "hound") this.kill(q, "dawn");
        else {
          q.state = "stunned";
          q.timer = 2;
        }
      }
      this.burst(this.x, this.y - 20, this.o.settings.calm ? 24 : 70, ["#ffffff", "#fff4a0", "#b8ffe0"], 220);
      this.say("Light! The rot falls back from it.");
    } else if (c.spell === "wind") {
      this.homing = 3;
      this.say("The wind is in your arrows: the next three find their own way.");
    } else {
      this.bridge = true;
      const f = this.fords.find((q) => this.y < q.y1 + 10);
      if (f) f.bridged = true;
      this.say(f ? "Roots knit across the ford ahead." : "The roots will knit across the next ford.");
    }
    void sp;
  }
  /** a cast rune looses a beam of green light, made of small glowing leaves, at the nearest monster: it is gone */
  private beam() {
    const q = this.monsters
      .filter((m) => this.hunting(m) && m.state !== "dying" && this.sy(m.y) > -20 && this.sy(m.y) < VIEW_H)
      .sort((a, b) => Math.hypot(a.x - this.x, a.y - this.y) - Math.hypot(b.x - this.x, b.y - this.y))[0];
    if (!q) return;
    this.beams.push({ x0: this.x, y0: this.y, x1: q.x, y1: q.y, t: this.t });
    for (let k = 0; k < (this.o.settings.calm ? 10 : 30); k++) {
      const f = Math.random();
      this.fx.push({ x: this.x + (q.x - this.x) * f, y: this.y + (q.y - this.y) * f - 16, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, life: 0.5 + Math.random() * 0.5, c: ["#b8ff9a", "#6aff6a", "#ffffff"][k % 3], r: 1.4 });
    }
    if (q.type === "colossus") this.heavyBlow(q, "beam", "The beam burns into the Colossus.");
    else {
      this.giveSoulBack(q);
      this.kill(q, "beam");
    }
  }
  private hunting(m: Monster) {
    return (
      m.state === "run" || m.state === "windup" || m.state === "lunge" || m.state === "recover" || m.state === "stunned" || m.state === "rooted" ||
      m.state === "flee" || m.state === "burst" || m.state === "swell" || m.state === "reach"
    );
  }
  private strike() {
    if (this.swords <= 0) return this.say("No sword. A sword is a last resort anyway.");
    const target = this.monsters
      .filter((m) => this.hunting(m) && this.y - m.y < 70 && this.y - m.y > -40 && Math.abs(m.x - this.x) < 46)
      .sort((a, b) => b.y - a.y)[0];
    this.swing = 0.35;
    if (!target) return this.say("Nothing within reach of the sword.");
    this.swords--;
    if (target.hp > 3) {
      target.hp -= 3;
      target.hitT = 0.4;
      target.state = "stunned";
      target.timer = 0.9;
      target.y -= 30;
      this.gore(target.x, target.y - 20, 24);
      sfx.crash();
      this.say(`${cap(MONSTERS[target.type].name)} staggers. One more blow.`, true);
      return;
    }
    if (target.stolen) this.giveSoulBack(target);
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
    if (this.cool > 0) return this.say(`${r.ability}: ready in ${Math.ceil(this.cool)} s.`);
    if (r.id === "knight") {
      const behind = this.monsters.filter((q) => this.hunting(q) && this.y - q.y > -20 && this.y - q.y < 420).sort((a, b) => b.y - a.y);
      for (const q of behind) {
        q.state = "stunned";
        q.timer = 1.5;
      }
      if (behind[0]) behind[0].y -= 90;
      this.cool = r.cooldown;
      this.burst(this.x, this.y - 20, 30, ["#f4efe0", "#d8b45a"], 160);
      sfx.roar();
      this.say(behind.length ? "The horn! They stop dead." : "The horn sounds over the empty land.");
      return;
    }
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
    if (how !== "dawn" || !this.won) this.stats.kills = (this.stats.kills ?? 0) + 1;
    // (once, in the hunt, what fell dropped arrows; now they lie on the road)
    if (false as boolean) {
      const n = m.type === "colossus" ? 5 : Math.random() < 0.5 ? 1 : 0;
      if (n) {
        this.arrows = Math.min(EXTREME.maxArrows, this.arrows + n);
        this.float(m.x, m.y - 40, `+${n} ${n === 1 ? "arrow" : "arrows"}`, "#efe3c6");
      }
    }
    if (this.grab?.q === m) this.grab = null;
    this.o.onEvent({ type: "killed", monster: m.type });
    m.state = "dying";
    m.timer = how === "pit" ? 0.8 : 0.5;
    m.how = how;
    this.respawn = Math.max(this.respawn, 4);
    if (how === "sword" || how === "hound") this.gore(m.x, m.y - 10, 30);
    else if (how === "arrow") this.burst(m.x, m.y - 10, 18, ["#b8ff9a", "#6aff6a", "#93725f"], 70);
    else if (how === "dawn") this.burst(m.x, m.y - 10, 24, ["#fff4c0", "#b8ff5a", "#ffffff"], 60);
    else if (how === "beam") this.burst(m.x, m.y - 14, 34, ["#b8ff9a", "#6aff6a", "#ffffff", "#1a3a12"], 110);
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
      // it closes in, but you always see it come over the edge before it can leap
      hunters[0].y = Math.max(hunters[0].y, this.y - Math.max(TUNE.surgeTo, this.PY - 24));
      hunters[0].cool = Math.max(hunters[0].cool, 1.2);
      if (hunters[0].state === "recover") hunters[0].state = "run";
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
    // a rune being cast: its time runs in real seconds
    if (this.casting) {
      this.casting.t += dt;
      if (!this.casting.end && this.casting.t > this.casting.limit) this.endCast(false);
      if (this.casting.end && this.t - this.casting.end > 0.9) this.casting = null;
    }
    this.runT += dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.mode !== "tutorial" && !this.o.showcase && !this.finaleT) {
      if (this.fog) {
        this.fog.t += dt;
        if (this.fog.t >= this.fog.len) {
          this.fog = null;
          this.nextFogT = this.runT + 70 + Math.random() * 80;
        }
      } else if (this.runT >= this.nextFogT) {
        this.fog = { t: 0, len: 25 + Math.random() * 20 };
        const l = this.landAtY(this.y);
        this.say(l === 0 ? "A green fog creeps in from the edges." : l === 3 ? "A blue fog rises, bright as magic." : "A grey fog creeps over the land.");
      }
    }
    this.armoury(dt);
    if (this.mode === "endless") this.eventStep(dt);
    if (this.mode === "extreme" && this.runT >= EXTREME.time && !this.won) return this.outlast();
    this.forgetVis += ((this.chapter ? Math.min(1, this.chapter.t / this.chapter.limit) : 0) - this.forgetVis) * Math.min(1, dt * (this.chapter ? 2 : 0.8));
    // the drawn bow: the world slows while you hold your breath, for as long as your calm lasts
    const drawing = this.aimT > 0.22 && this.arrows > 0 && this.focus > 0;
    this.slow += ((drawing ? 0.5 : 1) - this.slow) * Math.min(1, dt * 8);
    if (drawing) this.focus = Math.max(0, this.focus - dt * 0.5);
    else this.focus = Math.min(1, this.focus + dt * 0.07);
    if (this.aimT >= 0) this.aimT += dt;
    dt *= this.slow;

    const mount = this.o.choice.mount;
    const target = this.targetSpeed();
    this.speed += (target - this.speed) * Math.min(1, dt * 2);
    let fwd = this.speed;
    if (this.stun > 0) {
      this.stun -= dt;
      fwd *= 0.45;
    }
    if (this.grab) {
      const q = this.grab.q;
      this.grab.t -= dt;
      if (this.grab.t <= 0 || q.state === "dying" || q.state === "gone" || q.state === "stunned") this.grab = null;
      else {
        fwd *= 0.3;
        this.x += (q.x - this.x) * Math.min(1, dt * 1.5);
      }
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
    // your scent: where you have been
    this.trail.push({ t: this.t, x: this.x });
    while (this.trail.length && this.trail[0].t < this.t - 1.5) this.trail.shift();

    const m = this.metres;
    this.stats.metres = m;
    this.stats.clean = Math.max(this.stats.clean, m - this.lastHit);
    this.stats.afterSword = this.swordAt >= 0 ? m - this.swordAt : 0;
    if (this.mode === "extreme") this.score = this.stats.kills;
    else this.score += dm * this.mult;

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

    this.wildlife(dt);
    if (!this.o.showcase) this.missionStep(dt);
    if (!this.o.showcase) {
      this.fordStep();
      this.wispStep(dt);
      this.lampStep(dt);
    }
    if (this.mode === "tutorial") this.tutorialStep();
    this.hunt(dt);
    this.companion(dt);
    this.projectiles(dt);
    this.particles(dt);

    this.o.missions.forEach((mi, slot) => {
      if (!this.done.has(slot) && this.stats[mi.stat] >= mi.goal) {
        this.done.add(slot);
        this.mult++;
        // a task done is a heart back
        if (this.hearts < this.maxHearts) {
          this.hearts++;
          this.float(this.x, this.y - 70, "task done: +♥", "#ff8aa0");
        }
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
      this.beams = this.beams.filter((b) => this.t - b.t < 1);
      this.fords = this.fords.filter((f) => f.y1 > this.y - 600);
    }

    this.hudT -= dt;
    if (this.hudT <= 0) {
      this.hudT = 0.15;
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
      case "ruin":
        return this.hurt("You rode into a burnt-out ruin");
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
      case "soul":
        this.souls++;
        this.stats.souls++;
        this.score += 10 * this.mult;
        this.soulRun++;
        sfx.seed();
        if (this.soulRun >= ENDLESS.soulsPerHeart) {
          this.soulRun = 0;
          if (this.hearts < this.maxHearts) {
            this.hearts++;
            this.float(this.x, this.y - 30, "+♥", "#ff8aa0");
            this.say(`${ENDLESS.soulsPerHeart} souls: a heart comes back to you.`);
          }
        }
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
      case "rune": {
        if (this.rune) return void (p.taken = false);
        const fordAhead = this.fords.some((f) => !f.bridged && f.y0 > this.y) || (this.mode === "mission" && this.fordDone < this.land && this.land <= 2);
        const pool: SpellId[] = fordAhead ? ["thorn", "light", "wind", "bridge"] : ["thorn", "light", "wind"];
        this.rune = pool[Math.floor(Math.random() * pool.length)];
        if (this.chapter && this.chapter.got === 2) this.say(`The memory's rune-stone. Press R and cast it: remember its letter, then set the pieces back on the stem, bottom up.`, true);
        else this.say(`A rune-stone: ${SPELLS[this.rune].name}. ${SPELLS[this.rune].help} Press R to cast it: remember its letter, then set the pieces back on the stem.`, true);
        break;
      }
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
        this.comp = { kind: p.kind as Companion["kind"], x: p.x, y: p.y, state: "follow", t: 0, vx: 0 };
        this.stats.companions++;
        this.say(
          p.kind === "hound" ? "A great hound runs with you. When a monster is on your heels, it will give its life to stop it."
            : p.kind === "raven" ? "A raven flies with you. When a monster is on your heels, it will give its life to stop it."
              : "A white doe runs with you. When a monster is on your heels, she will give her life to stop it.",
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
    this.needBase = this.need = NEED[gt.land];
    this.landM = this.metres;
    this.startLandChapters(gt.land);
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
      const fordNear = this.fords.some((f) => f.y1 + 260 > this.y && f.y0 - 900 < this.y + VIEW_H);
      // hearts lie in the land, a little more often the longer you stay in one land
      if (m >= this.nextHeart && fordNear) this.nextHeart = m + 30;
      if (m >= this.nextHeart) {
        const [a, b] = MISSION.heartGap;
        const kind = Math.max(0.55, 1 - (m - this.landM) / 4000);
        this.nextHeart = m + (a + Math.random() * (b - a)) * kind;
        const y = this.y + (VIEW_H - this.PY) + 60;
        if (this.hearts < this.maxHearts) this.extra.push({ id: this.nextId++, kind: "heart", x: this.freeX(this.x + (Math.random() - 0.5) * 260, y), y });
      }
      this.chapterStep(dt);
      if (!pendingGate && !fordNear && !this.chapter && !this.queue.length && this.savedLand >= this.need) this.openGate();
    } else if (this.mode === "endless" && !this.o.showcase && m >= this.nextVillageM && this.fords.some((f) => f.y1 + 260 > this.y && f.y0 - 900 < this.y + VIEW_H)) {
      this.nextVillageM += 40;
    } else if (this.mode === "endless" && !this.o.showcase && m >= this.nextVillageM) {
      // now and then a village: give it a heart, and its souls count in the final score next to the kilometres
      this.nextVillageM = m + ENDLESS.villageGap[0] + Math.random() * (ENDLESS.villageGap[1] - ENDLESS.villageGap[0]);
      const v = this.buildVillage(Math.random() < 0.6 ? "hamlet" : "village");
      if (!this.o.seenKinds.includes("endlessVillage")) {
        this.o.seenKinds.push("endlessVillage");
        this.o.onEvent({ type: "seenKind", kind: "village" });
        this.say(`${v.name} ahead: ride through the glowing ring to give it a heart (never your last). Every soul saved counts in your score, next to the kilometres.`, true);
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
        ? "She remembers. Far ahead, the golden gate has opened: the end of the road."
        : `The land remembers enough. A gate of spring has opened ahead: beyond it, ${BIOMES[this.land + 1].name}.`,
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
    // nothing else lies near a place to heal: what it gives is all there is
    // only what is still off the screen: nothing may vanish in front of your eyes
    const seen = this.y + (VIEW_H - this.PY) + 30;
    const wide = (x: number, y: number) => Math.abs(x - cx) < 420 && y > Math.max(y0 - 280, seen) && y < y1 + 220;
    for (let i = Math.floor((cx - 440) / CELL); i <= Math.floor((cx + 440) / CELL); i++)
      for (let j = Math.floor((y0 - 300) / CELL); j <= Math.floor((y1 + 240) / CELL); j++)
        for (const p of this.cell(i, j).picks) if (wide(p.x, p.y) && p.kind !== "letter") p.taken = true;
    this.extra = this.extra.filter((p) => !wide(p.x, p.y));
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
    {
      const [wx, wy] = this.trailAt(fork, gl, 0.45 + this.villageRand() * 0.25);
      const weapons: PickKind[] = ["bow", "sword", "trap", "bow", "trap", "rune"];
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
    if (this.mode === "endless") {
      const pts = ENDLESS.soulPts * v.size * this.mult;
      this.score += pts;
      this.float(v.ax, v.ay - 50, `+${fmtN(pts)}`, "#b8ffe0");
    }
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
      const pool = GIFTS.filter((gf) => (walking ? ["sword", "bow", "traps", "rune"] : ["hound", "raven", "doe"]).includes(gf.id));
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
      case "rune": {
        if (this.rune) return this.applyGift("bow", "a bow and five arrows");
        const pool: SpellId[] = this.land <= 2 && this.fordDone < this.land ? ["thorn", "light", "wind", "bridge"] : ["thorn", "light", "wind"];
        this.rune = pool[Math.floor(Math.random() * pool.length)];
        return `${text}: ${SPELLS[this.rune].name}. Press R to cast it`;
      }
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

  /* ---------------- the mission's chapters: memories coming back ---------------- */

  /** a new land: its memories wait in order */
  private startLandChapters(land: number) {
    this.queue = MEMORIES.map((mm, i) => ({ mm, i })).filter(({ mm }) => mm.land === land).map(({ i }) => i);
    this.savedLand = 0;
    this.need = NEED[land];
    this.nextChapterM = this.metres + MISSION.chapter.first;
  }

  private chapterStep(dt: number) {
    const C = MISSION.chapter;
    const m = this.metres;
    if (!this.chapter) {
      if (this.gates.some((g) => !g.passed) || !this.queue.length || m < this.nextChapterM) return;
      if (this.fords.some((f) => f.y1 + 200 > this.y && f.y0 - 700 < this.y + VIEW_H)) {
        this.nextChapterM = m + 30;
        return;
      }
      const i = this.queue.shift()!;
      const again = this.lostRun.includes(i);
      this.chapter = { i, t: 0, limit: C.limit[this.land] * (again ? 0.9 : 1), got: 0, wait: 1.6 };
      if (!this.memories.includes(i)) this.memories.push(i);
      sfx.chime();
      this.wave = 0;
      this.o.onEvent({ type: "chapter", memory: i });
      this.say(
        again
          ? `${MEMORIES[i].sign} It comes back once more, fainter: ${MEMORIES[i].title}.`
          : `${MEMORIES[i].sign} A memory is coming back: ${MEMORIES[i].title}. Win back its three pieces before it is forgotten.`,
        true,
      );
      if (!this.o.seenKinds.includes("chapter")) {
        this.o.seenKinds.push("chapter");
        this.say("The colour drains out of the land as she forgets. Shoot the drifting light, ride through the ring, then take the rune-stone and cast it (R).", true);
      }
      return;
    }
    const ch = this.chapter;
    ch.t += dt;
    if (ch.ring) {
      ch.ring.ph += dt;
      if (Math.abs(ch.ring.x - this.x) < 30 && Math.abs(ch.ring.y - this.y) < 22) {
        const r = ch.ring;
        ch.ring = undefined;
        this.gotPiece(r.x, r.y - 10);
      } else if (ch.ring.y < this.y - this.PY - 40) {
        ch.ring = undefined;
        ch.wait = C.again;
        this.say("You missed the ring of light. It will come again.");
      }
    }
    if (ch.got === 2 && ch.stone !== undefined) {
      const st = this.extra.find((p) => p.id === ch.stone);
      if (!st || st.taken) ch.stone = undefined;
      else if (st.y < this.y - this.PY - 30) {
        st.taken = true;
        ch.stone = undefined;
        ch.wait = C.again;
        this.say("The rune-stone is behind you. Another will rise.");
      }
    }
    if (ch.got < 3 && !this.pieceOut()) {
      ch.wait -= dt;
      if (ch.wait <= 0) this.putPiece();
    }
    if (ch.t >= ch.limit) this.forget();
  }

  /** is the next piece already out there (or, for the last, is a rune in hand)? */
  private pieceOut() {
    const ch = this.chapter!;
    if (ch.got === 0) return this.wisps.some((w) => w.piece && w.hit === undefined);
    if (ch.got === 1) return !!ch.ring;
    return ch.stone !== undefined || !!this.rune || (!!this.casting && !this.casting.end);
  }

  private putPiece() {
    const ch = this.chapter!;
    const ahead = this.y + (VIEW_H - this.PY) + 70;
    if (ch.got === 0) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.wisps.push({ id: this.nextId++, x: this.x + side * (60 + Math.random() * 90), y: this.y + VIEW_H * 0.62, vx: -side * (8 + Math.random() * 12), ph: Math.random() * 6, memory: -2, clarify: false, piece: true });
      if (this.arrows <= 0) {
        this.arrows = MISSION.chapter.lend;
        this.say(`The memory lends you ${MISSION.chapter.lend} arrows. Shoot its light: hold Space, let go.`, true);
      }
    } else if (ch.got === 1) {
      const x = this.freeX(this.x + (Math.random() - 0.5) * 220, ahead);
      this.clearArea((ox, oy) => Math.hypot(ox - x, (oy - ahead) * 1.3) < 60, x - 80, x + 80, ahead - 80, ahead + 80);
      ch.ring = { x, y: ahead, ph: 0 };
    } else {
      if (this.rune) {
        if (!ch.told) this.say("Cast your rune (R) to anchor the memory.", true);
        ch.told = true;
        return;
      }
      const x = this.freeX(this.x + (Math.random() - 0.5) * 160, ahead);
      this.clearArea((ox, oy) => Math.hypot(ox - x, (oy - ahead) * 1.3) < 44, x - 60, x + 60, ahead - 60, ahead + 60);
      const p: Pick = { id: this.nextId++, kind: "rune", x, y: ahead };
      this.extra.push(p);
      ch.stone = p.id;
    }
  }

  private gotPiece(x: number, y: number) {
    const ch = this.chapter;
    if (!ch || ch.got >= 2 + 1) return;
    const name = MEMORIES[ch.i].pieces[Math.min(2, ch.got)];
    ch.got++;
    ch.wait = MISSION.chapter.pieceDelay;
    this.burst(x, y, this.o.settings.calm ? 12 : 30, ["#fff4c0", "#ffe46a", "#b8ffe0"], 90);
    this.float(x, y - 20, name, "#fff4c0");
    sfx.pick();
    this.o.onEvent({ type: "piece", memory: ch.i, n: ch.got, name });
    if (ch.got === 2) this.say(`${cap(name)}. One more: the rune-stone, to anchor it.`);
    else this.say(`${cap(name)} comes back.`);
  }

  /** a memory won back: it stays in the world */
  private remember() {
    const ch = this.chapter!;
    this.chapter = null;
    for (const w of this.wisps) if (w.piece) w.hit = this.t;
    this.savedLand++;
    this.savedRun.push(ch.i);
    if (!this.clear.includes(ch.i)) this.clear.push(ch.i);
    this.stats.memoriesFound++;
    if (this.hearts < this.maxHearts) this.hearts++;
    for (const q of this.monsters)
      if (this.hunting(q)) {
        q.y = Math.min(q.y, this.y - 280);
        q.flinch = 2.5;
        q.state = "stunned";
        q.timer = 1.6;
      }
    const b = BIOMES[this.land];
    this.burst(this.x, this.y - 20, this.o.settings.calm ? 24 : 80, [...(b.flowers.length ? b.flowers : ["#ffe46a", "#ffffff"]), "#b8ffe0", "#ff8ab0"], 180);
    const side = Math.random() < 0.5 ? -1 : 1;
    this.trees.push({ x: this.x + side * (80 + Math.random() * 60), y: this.y + 110, big: true, t: this.t });
    sfx.fanfare();
    this.wave = 0;
    const [a, bb] = MISSION.chapter.gap;
    this.nextChapterM = this.metres + a + Math.random() * (bb - a);
    this.freeze = 0.6;
    this.keys.left = this.keys.right = false;
    this.aimT = -1;
    this.say(`${MEMORIES[ch.i].title}: remembered. That place stays in the world.`, true);
    this.o.onEvent({ type: "memory", memory: ch.i, saved: true, hold: this.freeze, hearts: this.hearts, got: this.savedLand, need: this.need });
  }

  /** too late: the memory goes dark, and what was forgotten comes after you */
  private forget() {
    const ch = this.chapter!;
    this.chapter = null;
    for (const w of this.wisps) if (w.piece) w.hit = this.t;
    if (ch.stone !== undefined) this.extra = this.extra.filter((p) => p.id !== ch.stone);
    this.lostRun.push(ch.i);
    this.stats.memoriesLost = (this.stats.memoriesLost ?? 0) + 1;
    // it comes back later only if the land still needs it
    if (this.savedLand + this.queue.length < this.need) this.queue.push(ch.i);
    const turned = this.monsters.filter((q) => q.turned && q.state !== "gone" && q.state !== "dying").length;
    if (turned < MISSION.turnedMax) this.spawnMonster(undefined, undefined, true);
    sfx.eat();
    this.shake = this.o.settings.calm ? 0 : 0.3;
    const [a, b] = MISSION.chapter.gap;
    this.nextChapterM = this.metres + (a + Math.random() * (b - a)) * 0.7;
    this.say(`Forgotten. ${MEMORIES[ch.i].title} goes dark, and something comes after you.`, true);
    this.o.onEvent({ type: "memory", memory: ch.i, saved: false, hold: 0, hearts: this.hearts, got: this.savedLand, need: this.need });
  }

  /* ---------------- what comes back by itself, the endless ride's events, the end of the hunt ---------------- */

  private armoury(dt: number) {
    // weapons and hearts are found on the road again in every mode: nothing comes back by itself
    const R = null as typeof ENDLESS | typeof EXTREME | null;
    if (!R || this.o.showcase) return;
    const g = this.regen;
    g.a += dt;
    g.t += dt;
    g.s += dt;
    if (g.a >= R.arrowEvery) {
      g.a = 0;
      if (this.arrows < R.maxArrows) this.arrows++;
    }
    if (g.t >= R.trapEvery) {
      g.t = 0;
      if (this.traps < R.maxTraps) this.traps++;
    }
    if (g.s >= R.swordEvery) {
      g.s = 0;
      if (this.swords < this.maxSwords()) this.swords++;
    }
    if (this.mode === "extreme") {
      g.h += dt;
      if (g.h >= EXTREME.healEvery) {
        g.h = 0;
        if (this.hearts < this.maxHearts) {
          this.hearts++;
          this.float(this.x, this.y - 40, "+♥", "#ff8aa0");
          this.say("You held on: a heart comes back.");
        }
      }
    }
  }

  private eventStep(dt: number) {
    if (this.o.showcase) return;
    if (this.calmT > 0) this.calmT -= dt;
    const e = this.event;
    if (!e) {
      if (this.runT < this.nextEventT) return;
      const order: EndlessEvent[] = ["storm", "fords", "runes", "boss"];
      const name = order[this.eventN++ % order.length];
      this.event = { name, t: 0, len: EVENTS[name].len };
      this.nextEventT = this.runT + ENDLESS.every;
      if (name === "boss") this.bossDone = false;
      if (name === "fords") this.fordAtM = Math.min(this.fordAtM, this.metres + 40);
      sfx.chime();
      this.say(EVENTS[name].say, true);
      this.o.onEvent({ type: "event", name: EVENTS[name].name });
      return;
    }
    e.t += dt;
    if (e.name === "storm" && Math.random() < dt / 5 && !this.o.settings.calm) {
      this.flash = 0.35;
      sfx.crash();
    }
    if (e.name === "runes" && this.runT >= this.nextRuneT && !this.rune) {
      this.nextRuneT = this.runT + 8;
      const y = this.y + (VIEW_H - this.PY) + 80;
      const x = this.freeX(this.x + (Math.random() - 0.5) * 200, y);
      this.clearArea((ox, oy) => Math.hypot(ox - x, (oy - y) * 1.3) < 44, x - 60, x + 60, y - 60, y + 60);
      this.extra.push({ id: this.nextId++, kind: "rune", x, y });
    }
    const bossGone = e.name === "boss" && e.t > 8 && !this.monsters.some((q) => q.type === "colossus" && q.state !== "gone" && q.state !== "dying");
    if (e.t >= e.len || bossGone) {
      this.event = null;
      this.calmT = ENDLESS.calm;
      for (const q of this.monsters) if (this.hunting(q)) q.blind = Math.max(q.blind, ENDLESS.calm * 0.6);
      this.say("The land goes quiet for a while. Breathe.", true);
      this.o.onEvent({ type: "event", name: "Quiet" });
    }
  }

  /** the hunt is over: ten minutes, and she is still riding */
  private outlast() {
    this.won = 0.0001;
    for (const q of this.monsters) if (this.hunting(q) || q.state === "emerge") this.kill(q, "dawn");
    sfx.fanfare();
    this.say(`Ten minutes, and you are still riding. ${this.stats.kills} brought down.`, true);
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
    const n = Math.min(40, 6 + this.clear.length * 3);
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
    const groves: VillageKind[] = this.savedRun.map((_, k) => (k % 2 ? "village" : "hamlet"));
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
        say("Hearts lie here, for the lesson. They are your life. In the mission one comes back with every memory she wins back. Take one.");
        break;
      case 4:
        T.c0 = this.stats.crashed;
        this.spawnMonster();
        for (let k = 0; k < 4; k++) put("tree", this.x + (k % 2 ? 70 : -70), ahead + 60 + k * 170);
        T.y = ahead + 900;
        say("Something has followed you out of the dark. You can't outrun it. Ride close past a tree and it will run straight into it.");
        break;
      case 5: {
        const x = this.x + (Math.random() < 0.5 ? -1 : 1) * 70;
        this.tring = { x, y: ahead + 60, ph: 0 };
        say("Brigid is forgetting. When a memory comes back, the place where it happened waits on the road as a ring of light. Ride through it.");
        break;
      }
      case 6: {
        this.arrows = Math.max(this.arrows, 5);
        T.c0 = this.stats.wisps;
        this.wisps.push({ id: this.nextId++, x: this.x + 80, y: this.y + VIEW_H * 0.62, vx: -10, ph: 0, memory: -3, clarify: false });
        say("A memory's first piece is a light drifting over the land. Shoot it: hold Space, and let go when the line points at it. With a mouse, point at it and hold the button.");
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
        this.lastSpell = undefined;
        this.rune = "light";
        this.spawnMonster(this.x, this.y - 220);
        say("A rune-stone: Light. Press R: its ogham letter shows for a moment, then falls apart. Set the pieces back on the stem, from the bottom up: left and right to choose, up to set. In the mission a cast rune is also what anchors a memory.");
        break;
      case 11:
        this.hearts = Math.max(this.hearts, 3);
        this.buildFord();
        T.vid = this.fords[this.fords.length - 1].id;
        say("A ford over black water. One stone in each row lights up, in turn. Remember them, then ride across on them.");
        break;
      case 12:
        this.gates.push({ y: this.y + 700, land: 1, gold: false, passed: false });
        say("When a land remembers enough, a gate of spring opens. Ride through it. Beyond it the land is greener.");
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
      case 5: {
        const r = this.tring;
        if (!r) break;
        r.ph += 1 / 60;
        if (Math.abs(r.x - this.x) < 30 && Math.abs(r.y - this.y) < 22) {
          this.tring = null;
          this.burst(r.x, r.y - 10, 30, ["#fff4c0", "#ffe46a", "#b8ffe0"], 90);
          sfx.pick();
          this.say("The place comes back.", true);
          this.tutorialNext();
        } else if (this.y > r.y + 80) {
          this.tring = null;
          again("You rode past it. Another ring: steer into it.");
        }
        break;
      }
      case 6:
        if (this.stats.wisps > T.c0) {
          this.say("A clean shot: the light comes back to her.", true);
          this.tutorialNext();
        } else if (!this.wisps.some((w) => w.hit === undefined) && this.t - T.t > 1) again("It drifted past. Another light: hold Space, aim, let go.");
        else if (this.arrows <= 0 && this.shots.length === 0) this.arrows = 5;
        break;
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
      case 10: {
        const c = this.casting;
        const lc = this.lastCast && this.lastCast.t > T.t ? this.lastCast : undefined;
        if (lc?.ok && this.t - lc.t > 1) {
          for (const q of this.monsters) if (this.hunting(q) || q.state === "emerge" || q.state === "stunned") this.kill(q, "dawn");
          this.tutorialNext();
        } else if (lc && !lc.ok && this.t - lc.t > 1) {
          for (const q of this.monsters) this.kill(q, "dawn");
          again("The rune broke. Another stone: look hard at the letter, then set its pieces again.");
        } else if (!this.monsters.some((q) => this.hunting(q) || q.state === "emerge" || q.state === "stunned") && !c && this.t - T.t > 2) {
          this.spawnMonster(this.x, this.y - 220);
        }
        break;
      }
      case 11: {
        const f = this.fords.find((q) => q.id === T.vid);
        if (!f) break;
        if (this.y > f.y1 + 30) {
          if (f.slipped) {
            this.hearts = Math.max(this.hearts, 3);
            again("Into the water. Again: watch the lit stones, then ride them in the same order.");
          } else {
            this.say("Dry-shod. Watch, remember, ride.", true);
            this.tutorialNext();
          }
        }
        break;
      }
      case 12:
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
      const sp = kind === "hare" ? 120 : kind === "fox" ? 130 : 140;
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
        this.say(`An animal is crossing. Catch it as it runs (ride right into its path) and it becomes your companion.`, true);
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
        // catch it as it crosses, and it runs with you: a friend who will give its life for yours
        if ((p.state === "run" || p.state === "flee") && this.mode !== "tutorial" && (!this.comp || this.comp.state === "gone") && Math.abs(p.x - this.x) < 16 && Math.abs(p.y - this.y) < 14 && this.air <= 0) {
          p.state = "safe";
          const kind: Companion["kind"] = p.kind === "deer" ? "doe" : p.kind === "fox" ? "fox" : "hare";
          this.comp = { kind, x: p.x, y: p.y, state: "follow", t: 0, vx: 0 };
          this.stats.companions++;
          this.burst(p.x, p.y - 10, 20, ["#b8ffe0", "#ffffff", "#8ae05a"], 70);
          sfx.chime();
          const who = kind === "doe" ? "The deer" : kind === "fox" ? "The fox" : "The hare";
          this.say(`${who} runs with you now. When a monster is on your heels, it will give its life to stop it.`, true);
          continue;
        }
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

  /** who may hunt you here: in the mission each land has its own; in the endless ride it grows with the distance */
  private roster(): MonsterId[] {
    if (this.mode === "mission") return (MISSION_ROSTER[this.land] ?? MISSION_ROSTER[0]) as MonsterId[];
    const m = this.metres + this.mOff;
    return (Object.keys(MONSTERS) as MonsterId[]).filter((k) => MONSTERS[k].weight > 0 && MONSTERS[k].from <= m);
  }

  private spawnMonster(atX?: number, atY?: number, turned = false, force?: MonsterId) {
    let pick: MonsterId = "hollow";
    if (force) pick = force;
    else if (!(this.mode === "tutorial" || turned)) {
      const kinds = this.roster();
      // the newest kind comes a little more often while it is new to you; the oldest stay the most common
      const total = kinds.reduce((a, k) => a + MONSTERS[k].weight, 0);
      let r = Math.random() * total;
      for (const k of kinds) {
        r -= MONSTERS[k].weight;
        if (r <= 0) {
          pick = k;
          break;
        }
      }
    }
    const T = MONSTERS[pick];
    const q: Monster = {
      id: this.nextId++, type: pick, x: atX ?? this.x + (Math.random() - 0.5) * 120, y: atY ?? this.y - this.PY - 90, vx: 0, turned,
      state: "emerge", timer: 0.6, cool: 2, judged: new Set(), dodgeT: 0, dodgeDir: 0, blind: 0, flinch: 0,
      phase: Math.random() * 6, aimX: this.x, hp: T.hp, hitT: 0, side: Math.random() < 0.5 ? -1 : 1,
    };
    if (T.way === "burrow" && atY === undefined) {
      // it comes from in front, under the ground
      q.state = "under";
      q.y = this.y + 320;
      q.x = this.x + (Math.random() - 0.5) * 140;
      q.timer = 0;
    }
    this.monsters.push(q);
    if (q.state !== "under") sfx.roar();
    if (pick === "colossus") {
      this.shake = this.o.settings.calm ? 0 : 0.5;
      this.say("The ground shakes. The Colossus is coming: it breaks trees like straw. Six blows bring it down.", true);
    }
    if (!this.o.seenMonsters.includes(pick)) {
      this.o.seenMonsters.push(pick);
      this.o.onEvent({ type: "seen", monster: pick });
      if (pick !== "colossus") this.say(`Something is coming: ${T.name}. ${T.tell}`, true);
    }
  }

  /** what the Collector takes: a piece of the memory you are winning back, the lamp's lights, or arrows */
  private steal(): Monster["stolen"] {
    if (this.chapter && this.chapter.got > 0 && this.chapter.got < 3) {
      this.chapter.got--;
      this.chapter.wait = Math.min(this.chapter.wait, MISSION.chapter.again);
      this.float(this.x, this.y - 30, "−1 piece", "#fff0c0");
      return { kind: "piece", n: 1 };
    }
    if (this.lamp && this.lamp.got > 0) {
      const n = this.lamp.got;
      this.lamp.got = 0;
      this.float(this.x, this.y - 30, "the lamp is emptied", "#fff0c0");
      return { kind: "lamp", n };
    }
    if (this.arrows > 0) {
      const n = Math.min(3, this.arrows);
      this.arrows -= n;
      this.float(this.x, this.y - 30, `−${n} arrows`, "#fff0c0");
      return { kind: "arrows", n };
    }
    return undefined;
  }
  private giveSoulBack(q: Monster) {
    const st = q.stolen;
    if (!st) return;
    q.stolen = undefined;
    if (st.kind === "piece") {
      if (this.chapter && this.chapter.got < 3) {
        this.chapter.got++;
        if (this.chapter.got >= 3) this.chapter.got = 2;
      }
    } else if (st.kind === "lamp") {
      if (this.lamp) this.lamp.got = Math.min(this.lamp.want.length - 1, this.lamp.got + st.n);
    } else this.arrows = Math.min(9, this.arrows + st.n);
    this.float(q.x, q.y - 50, "got it back", "#b8ffe0");
    this.say("Got it: what it took comes back to you.", true);
  }

  /** a blow from a trap, the sword or a companion: three of an arrow's */
  private heavyBlow(q: Monster, how: NonNullable<Monster["how"]>, line: string) {
    if (q.hp > 3) {
      q.hp -= 3;
      q.hitT = 0.4;
      q.state = "stunned";
      q.timer = 2;
      q.vx = 0;
      q.y -= 20;
      this.burst(q.x, q.y - 14, 18, ["#6a4a2a", "#8ae05a", "#a8202a"], 70);
      sfx.crash();
      this.say(`${cap(MONSTERS[q.type].name)} staggers: ${q.hp} ${q.hp === 1 ? "blow" : "blows"} to go.`, true);
      return false;
    }
    this.giveSoulBack(q);
    this.kill(q, how);
    if (line) this.say(line);
    return true;
  }

  private newLamp() {
    const all: LampColour[] = ["green", "gold", "blue"];
    const len = this.runT < ENDLESS.lampAt[0] ? 3 : this.runT < ENDLESS.lampAt[1] ? 4 : 5;
    // the colour it wants most is the gift: it comes twice (or more), the others fill the rest
    const gift = all[Math.floor(Math.random() * 3)];
    const others = all.filter((c) => c !== gift);
    const want: LampColour[] = [gift, gift, others[Math.floor(Math.random() * 2)]];
    // the rest: never more of the gift than of the others put together plus one, so the lamp stays a puzzle
    while (want.length < len) want.push(want.filter((c) => c === gift).length * 2 > want.length ? others[Math.floor(Math.random() * 2)] : all[Math.floor(Math.random() * 3)]);
    for (let i = want.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [want[i], want[j]] = [want[j], want[i]];
    }
    const mirror = this.runT >= ENDLESS.mirrorFrom && Math.random() < ENDLESS.mirrorP;
    this.lamp = { want, got: 0, spilt: 0, mirror };
    if (mirror && !this.o.seenKinds.includes("mirror")) {
      this.o.seenKinds.push("mirror");
      this.say("A mirrored lamp: it wants its lights the other way round, from the last to the first.", true);
    }
  }
  private lampGift(): LampColour {
    const w = this.lamp!.want;
    const n = (c: LampColour) => w.filter((x) => x === c).length;
    return [...w].sort((a, b) => n(b) - n(a))[0];
  }
  /** the light the lamp wants now */
  private lampNext(): LampColour | undefined {
    const l = this.lamp;
    if (!l) return undefined;
    return l.mirror ? l.want[l.want.length - 1 - l.got] : l.want[l.got];
  }

  /** lights float over the road in threes; ride through the one the lamp wants next */
  private lampStep(dt: number) {
    if (this.mode !== "endless" || this.o.showcase) return;
    const m = this.metres;
    if (!this.lamp && m >= this.nextLights - 40) {
      this.newLamp();
      this.lampRows = 0;
      if (!this.o.seenKinds.includes("lamp")) {
        this.o.seenKinds.push("lamp");
        this.say(`Lights ahead! Your lamp wants them in order: ${this.lamp!.want.join(", ")}. Ride through the right ones: a full lamp gives you a heart.`, true);
      }
    }
    for (const l of this.lights) l.ph += dt;
    // a lamp left half-filled for too long is put out; the next lights bring a new one
    if (this.lamp && this.lampRows > this.lamp.want.length && m >= this.nextLights) {
      this.newLamp();
      this.lampRows = 0;
    }
    if (this.lamp && m >= this.nextLights) {
      const y = this.y + (VIEW_H - this.PY) + 140;
      const busy =
        this.fords.some((f) => y > f.y0 - 160 && y < f.y1 + 160) ||
        this.villages.some((v) => v.state === "waiting" && y > v.y0 - 300 && y < v.y1 + 200);
      if (busy) this.nextLights = m + 20;
      else {
        const row = ++this.lightRow;
        const cols: LampColour[] = ["green", "gold", "blue"].sort(() => Math.random() - 0.5) as LampColour[];
        const cx = this.x + (Math.random() - 0.5) * 120;
        cols.forEach((colour, k) => {
          const x = cx + (k - 1) * 78;
          this.clearArea((ox, oy) => Math.hypot(ox - x, (oy - y) * 1.4) < 40, x - 50, x + 50, y - 50, y + 50);
          this.lights.push({ id: this.nextId++, row, colour, x, y, ph: Math.random() * 6 });
        });
        // the next light of the same lamp comes soon; a new lamp only after a long while
        this.lampRows++;
        this.nextLights = m + (this.lampRows < (this.lamp?.want.length ?? 3) + 1 ? 60 + Math.random() * 40 : ENDLESS.lampGap[0] + Math.random() * (ENDLESS.lampGap[1] - ENDLESS.lampGap[0]));
      }
    }
    for (const l of this.lights) {
      if (l.gone || l.taken) continue;
      if (Math.abs(l.x - this.x) < 26 && Math.abs(l.y - this.y) < 20) {
        l.taken = true;
        for (const o of this.lights) if (o.row === l.row && o !== l) o.gone = true;
        this.takeLight(l);
      }
    }
    this.lights = this.lights.filter((l) => l.y > this.y - this.PY - 60);
  }

  private takeLight(l: LampLight) {
    const lamp = this.lamp;
    if (!lamp) return;
    const c = LAMP[l.colour];
    this.burst(l.x, l.y - 24, 12, [c.core, `rgb(${c.rgb})`], 70);
    if (this.lampNext() === l.colour) {
      lamp.got++;
      sfx.pick();
      const pts = ENDLESS.lightPts * this.mult;
      this.score += pts;
      if (lamp.got >= lamp.want.length) {
        // a lamp filled in the right order gives a heart (points, if you are whole)
        const full = Math.round(ENDLESS.lampPts * lamp.want.length * (lamp.mirror ? 1.5 : 1) * this.mult);
        this.score += full;
        let what = "a heart";
        if (this.hearts < this.maxHearts) this.hearts++;
        else {
          this.score += full;
          what = "double points (you are whole)";
        }
        this.lampStreak++;
        this.float(this.x, this.y - 60, `+${fmtN(full)} · ${what}`, c.core);
        this.say(`The lamp is full: +${fmtN(full)}, and ${what}.`);
        this.stats.lamps++;
        sfx.chime();
        this.lamp = null;
        this.lampRows = 0;
        this.nextLights = this.metres + ENDLESS.lampGap[0] + Math.random() * (ENDLESS.lampGap[1] - ENDLESS.lampGap[0]);
        this.o.onEvent({ type: "lamp" });
      } else this.float(l.x, l.y - 40, `+${fmtN(pts)}`, c.core);
    } else {
      lamp.got = 0;
      lamp.spilt = this.t;
      this.lampStreak = 0;
      this.lampRows = 0;
      sfx.hit();
      this.float(this.x, this.y - 60, "the lamp spills", "#e0c0c0");
      const order = lamp.mirror ? [...lamp.want].reverse() : lamp.want;
      this.say(`Wrong light: the lamp spills. It wants ${order.join(", ")}.`);
    }
  }

  /** the Spitter's rot in the air, and burning on the ground */
  private spitStep(dt: number) {
    for (const p of this.spits) {
      p.t += dt;
      if (p.t >= p.dur) {
        this.puddles.push({ x: p.tx, y: p.ty, t: 4 });
        this.burst(p.tx, p.ty, 12, ["#7a8a2a", "#3a4a12", "#b8c040"], 70);
        sfx.crash();
      }
    }
    this.spits = this.spits.filter((p) => p.t < p.dur);
    for (const p of this.puddles) {
      p.t -= dt;
      if (!p.hit && p.t > 0 && Math.abs(p.x - this.x) < 26 && Math.abs(p.y - this.y) < 16 && this.air <= 0) {
        p.hit = true;
        this.hurt("The Spitter's rot burned you");
      }
    }
    this.puddles = this.puddles.filter((p) => p.t > 0 && p.y > this.y - this.PY - 60);
  }

  private hunt(dt: number) {
    const m = this.metres;
    const alive = this.monsters.filter((q) => q.state !== "dying" && q.state !== "gone" && !q.turned).length;
    const want =
      this.mode === "tutorial" || this.calmT > 0 ? 0
        : this.mode === "mission" ? MISSION.hunters[this.land]
          : this.mode === "extreme" ? EXTREME.hunters[Math.min(EXTREME.hunters.length - 1, Math.floor(this.runT / 100))]
            : huntersAt(m + this.mOff);
    if (m > 60 && alive < want) {
      this.respawn -= dt;
      if (this.respawn <= 0) {
        this.spawnMonster();
        // early in the endless ride they come one at a time, with room to breathe
        this.respawn = this.mode === "endless" ? Math.max(4, 8 - m / 600) : this.mode === "extreme" ? EXTREME.respawn : 4;
      }
    }
    // the Colossus: rare, one at a time, and only when you have something to fight it with
    const armed = this.arrows >= 3 || this.swords > 0 || this.traps > 0;
    const bossNow = this.monsters.some((q) => q.type === "colossus" && q.state !== "dying" && q.state !== "gone");
    if (!bossNow && this.mode === "extreme" && !this.extremeBoss && this.runT >= EXTREME.boss) {
      this.extremeBoss = true;
      this.spawnMonster(undefined, undefined, false, "colossus");
    }
    if (!bossNow && armed && this.mode !== "tutorial" && this.mode !== "extreme") {
      const ok =
        this.mode === "endless"
          ? this.event?.name === "boss" && !this.bossDone
          : this.land === 3 && !this.bossDone && m - (this.landM ?? 0) > 450;
      if (ok) {
        this.spawnMonster(undefined, undefined, false, "colossus");
        this.bossDone = true;
        this.nextBoss = m + 1400 + Math.random() * 900;
      }
    }
    this.spitStep(dt);
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
      if (q.hitT > 0) q.hitT -= dt;
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
      if (q.state === "under") {
        // a swelling in the ground ahead, creeping towards your line
        q.x += Math.max(-75 * dt, Math.min(75 * dt, this.x - q.x));
        q.phase += dt;
        if (q.y - this.y < 80) {
          q.state = "burst";
          q.timer = 0.4;
          sfx.roar();
        } else if (q.y < this.y - 40) q.state = "gone";
        continue;
      }
      if (q.state === "burst") {
        q.timer -= dt;
        if (q.timer <= 0) {
          this.burst(q.x, q.y, 26, ["#4a3a2a", "#6a5a42", "#a8202a"], 140);
          this.shake = this.o.settings.calm ? 0 : 0.2;
          if (Math.abs(q.x - this.x) < 30 && Math.abs(q.y - this.y) < 40) this.hurt("The Burrower burst out under you");
          q.state = "stunned";
          q.timer = 0.5;
          q.cool = 2;
        }
        continue;
      }
      if (q.state === "swell") {
        // the Spitter holds still behind you and swells
        q.y += base * dt;
        q.timer -= dt;
        if (q.timer <= 0) {
          const lead = 0.85;
          const tx = Math.max(this.camX - this.W / 2 + 30, Math.min(this.camX + this.W / 2 - 30, this.x + this.vx * lead));
          this.spits.push({ x: q.x, y: q.y - 20, tx, ty: this.y + this.speed * lead, t: 0, dur: lead });
          sfx.eat();
          q.state = "run";
          q.cool = 2.6 + Math.random() * 1.6;
        }
        continue;
      }
      if (q.state === "reach") {
        // the Hands draw an arm back, then throw it where you are going
        q.y += base * dt;
        q.timer -= dt;
        if (q.timer <= 0) {
          const gapNow = this.y - q.y;
          if (Math.abs(this.x - (q.reachX ?? this.x)) < 34 && gapNow < 220 && !this.grab && this.inv <= 0) {
            this.grab = { q, t: 0.9 };
            sfx.hit();
            this.say("The Hands have you! Shoot them, or wait it out.", true);
          }
          q.state = "recover";
          q.timer = this.grab?.q === q ? 1 : 0.5;
          q.cool = 3 + Math.random();
        }
        continue;
      }
      if (q.state === "flee") {
        q.timer -= dt;
        q.y += base * 0.5 * dt;
        q.x += q.side * 150 * dt;
        if (q.timer <= 0) {
          q.state = "gone";
          this.say("The Collector got away with a soul.");
        }
        continue;
      }

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
      if (this.event?.name === "storm") sp *= 1.1;
      if (this.fords.some((f) => q.y > f.y0 - 30 && q.y < f.y1 + 30)) sp *= T.smashes ? 0.45 : 0.7;
      if (this.mode === "endless" && this.metres < 900) sp *= 0.95;
      // the Spitter keeps its distance and swells; the Hands reach from far off
      if (T.way === "spit" && q.state === "run") {
        // it hangs back at the top edge of what you can see
        if (gap < 130) sp *= 0.85;
        if (q.cool <= 0 && gap > 100 && gap < 200 && q.blind <= 0) {
          q.state = "swell";
          q.timer = 0.7;
          continue;
        }
      }
      if (T.way === "grab" && q.state === "run" && q.cool <= 0 && gap > 80 && gap < 185 && Math.abs(q.x - this.x) < 90 && q.blind <= 0 && !this.grab) {
        q.state = "reach";
        q.timer = 0.6;
        q.reachX = this.x + this.vx * 0.5;
        continue;
      }

      // the leap: wind up, then jump at where you are going
      if (q.state === "run" && !food && this.mode !== "tutorial" && q.cool <= 0 && gap < TUNE.lungeFrom * (1 + fed * 0.08) && gap > 12 && Math.abs(q.x - this.x) < (q.type === "hound" ? 80 : 60) && q.blind <= 0 && q.flinch <= 0 && T.way !== "spit") {
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
            if (q.type === "hound") q.y -= sp * dt * 0.5;
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
        if (tr.alive && Math.abs(tr.x - q.x) < 14 && Math.abs(tr.y - q.y) < 10) {
          tr.alive = false;
          this.stats.trapped++;
          q.vines = this.t;
          this.heavyBlow(q, "trap", `${cap(T.name)} is caught in your trap.`);
          hit = true;
          break;
        }
      }
      if (hit) continue;

      // caught?
      if (Math.abs(q.x - this.x) < T.radius + 6 && gap < T.radius + 4 && gap > -10) {
        if (T.way === "thief") {
          // the Collector takes a soul and runs
          q.state = "flee";
          q.timer = 3.2;
          q.side = q.x < this.x ? -1 : 1;
          this.inv = Math.max(this.inv, 0.6);
          const took = this.steal();
          if (took) {
            q.stolen = took;
            sfx.eat();
            this.say(`The Collector took ${took.kind === "piece" ? "a piece of the memory" : took.kind === "lamp" ? "the lights in your lamp" : `${took.n} arrows`}! Shoot it before it is gone.`, true);
          } else this.say("The Collector found nothing to take, and runs.");
          continue;
        }
        if (this.inv > 0 && this.mode === "tutorial") continue;
        this.die(`${cap(T.name)} caught you`);
        return;
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
    const flyer = c.kind === "raven";
    const follow = () => {
      c.x += (this.x + 26 - c.x) * Math.min(1, dt * 6);
      c.y += (this.y - (flyer ? 26 : 8) + (flyer ? Math.sin(c.t * 5) * 4 : 0) - c.y) * Math.min(1, dt * 6);
    };
    if (c.state === "follow") {
      follow();
      // in the lessons with weapons the friend only watches
      const drill = this.mode === "tutorial" && this.tut.step >= 7 && this.tut.step <= 9;
      // only when one is right on your heels
      const threat = this.monsters
        .filter((q) => this.hunting(q) && q.state !== "stunned" && q.state !== "rooted" && q.state !== "flee" && !q.lure)
        .sort((a, b) => b.y - a.y)[0];
      // not by a place you have healed: its light stops them anyway, and the friend should not die for nothing
      const sheltered = this.villages.some(
        (v) => (v.state === "saved" || (v.kind === "glade" && v.state === "waiting")) && Math.hypot(v.ax - this.x, (v.ay - this.y) * 1.3) < MISSION.sanctuary + 140,
      );
      if (!drill && !sheltered && threat && (threat.state === "windup" || threat.state === "lunge" || this.y - threat.y < 75)) {
        c.state = "fight";
        c.t = 0;
        c.target = threat;
        threat.lure = c;
      }
      return;
    }
    // the fight: it runs at the monster, the two of them roll in the dirt, and it is over
    const q = c.target;
    if (!q || q.state === "gone" || q.state === "dying") {
      c.state = "follow";
      if (q) q.lure = undefined;
      return;
    }
    const close = Math.abs(q.x - c.x) < 12 && Math.abs(q.y - c.y) < 14;
    if (!close && c.t < 1.4) {
      c.x += (q.x - c.x) * Math.min(1, dt * 10);
      c.y += (q.y - (flyer ? 20 : 0) - c.y) * Math.min(1, dt * 10);
      return;
    }
    if (q.state !== "stunned") {
      q.state = "stunned";
      q.timer = 1.1;
      c.t = Math.min(c.t, 0.2);
    }
    // the struggle
    c.x = q.x + Math.sin(c.t * 40) * 4;
    c.y = q.y - (flyer ? 22 : 2) + Math.cos(c.t * 33) * 3;
    if (Math.random() < dt * 14) this.gore(q.x + (Math.random() - 0.5) * 16, q.y - 12, 3);
    if (c.t < 0.9) return;
    q.lure = undefined;
    c.kills = (c.kills ?? 0) + 1;
    // one fight, and it is the last: the friend dies with the monster
    const name = c.kind === "raven" ? "raven" : c.kind === "doe" ? "deer" : c.kind;
    const fell = this.heavyBlow(q, "hound", "");
    this.gore(c.x, c.y - 6, 34);
    this.shake = this.o.settings.calm ? 0 : 0.25;
    this.float(c.x, c.y - 40, `the ${name} gave its life`, "#ffe0a0");
    this.say(fell ? `The ${name} brought it down, and did not get up again.` : `The ${name} tore into the Colossus and fell. It staggers.`, true);
    c.state = "gone";
    this.comp = null;
  }

  private projectiles(dt: number) {
    for (const s of this.shots) {
      if (s.home && !s.spear) {
        // the wind arrow bends towards the nearest memory or monster
        let best: { x: number; y: number } | null = null;
        let bd = 340;
        for (const w of this.wisps) if (w.hit === undefined) {
          const d = Math.hypot(w.x - s.x, w.y - 30 - s.y);
          if (d < bd) { bd = d; best = { x: w.x, y: w.y - 30 }; }
        }
        for (const q of this.monsters) if (this.hunting(q) && q.state !== "dying") {
          const d = Math.hypot(q.x - s.x, q.y - 12 - s.y);
          if (d < bd) { bd = d; best = { x: q.x, y: q.y - 12 }; }
        }
        if (best) {
          const vy = s.vy - this.speed;
          const a0 = Math.atan2(vy, s.vx);
          const a1 = Math.atan2(best.y - s.y, best.x - s.x);
          let da = a1 - a0;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const a = a0 + Math.max(-7 * dt, Math.min(7 * dt, da));
          const sp = Math.hypot(s.vx, vy);
          s.vx = Math.cos(a) * sp;
          s.vy = this.speed + Math.sin(a) * sp;
        }
        if (Math.random() < dt * 30) this.fx.push({ x: s.x, y: s.y, vx: 0, vy: this.speed, life: 0.3, c: "#a8e8ff", r: 1.2 });
      }
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
      // a drifting memory, or a soul-light
      for (const w of this.wisps) {
        if (w.hit !== undefined) continue;
        if (Math.hypot(w.x - s.x, w.y - 30 - s.y) < 15) {
          s.life = 0;
          this.hitWisp(w);
          break;
        }
      }
      if (s.life <= 0) continue;
      for (const q of this.monsters) {
        if (!this.hunting(q) || s.skip?.includes(q.id)) continue;
        const T = MONSTERS[q.type];
        const R = T.radius;
        if (Math.abs(q.x - s.x) < R + 3 && s.y < q.y + 6 && s.y > q.y - R * 2.4) {
          s.life = 0;
          this.focus = Math.min(1, this.focus + 0.3);
          q.hp--;
          if (q.hp > 0) {
            q.hitT = 0.3;
            if (q.state !== "flee") {
              q.state = "stunned";
              q.timer = 0.35;
              if (this.grab?.q === q) this.grab = null;
            }
            q.y -= 16;
            this.burst(q.x, q.y - 16, 10, ["#cdb39a", "#93725f", "#b8ff5a"], 60);
            sfx.crash();
            this.say(`${cap(T.name)} is hit${q.hp === 1 ? ": once more" : ` (${q.hp} to go)`}.`);
            break;
          }
          const had = q.stolen;
          this.giveSoulBack(q);
          this.kill(q, "arrow");
          this.stats.arrowKills++;
          if (!had) this.say(`Your arrow found ${T.name}.`);
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

  /* ---------------- memories in the air ---------------- */

  private wispStep(dt: number) {
    const m = this.metres;
    const placeNear = this.villages.some((v) => v.state === "waiting" && v.y0 < this.y + VIEW_H + 200 && v.y1 > this.y - 150);
    // memories no longer drift by on their own: the chapters bring them (kept for the code that reads it)
    if (false as boolean && this.mode !== "tutorial" && m >= this.nextWisp && !placeNear && !this.fords.some((f) => this.y > f.y0 - 500 && this.y < f.y1)) {
      const [a, b] = this.mode === "mission" ? MISSION.wispGap : ENDLESS.wispGap;
      this.nextWisp = m + a + Math.random() * (b - a);
      const nm = this.mode === "mission" ? this.nextMemory() : { memory: -1, clarify: false };
      if (this.mode === "endless" || nm.memory >= 0) {
        const side = Math.random() < 0.5 ? -1 : 1;
        this.wisps.push({ id: this.nextId++, x: this.x + side * (70 + Math.random() * 110), y: this.y + VIEW_H * 0.72, vx: -side * (10 + Math.random() * 18), ph: Math.random() * 6, memory: nm.memory, clarify: nm.clarify });
        if (!this.o.seenKinds.includes("wisp")) {
          this.o.seenKinds.push("wisp");
          this.say(
            this.mode === "mission"
              ? "A light drifts over the land: one of Brigid's lost memories. Shoot it with an arrow and it comes back to her."
              : `A soul-light drifts over the land. Shoot it with an arrow: ${ENDLESS.wispSouls} souls.`,
            true,
          );
        }
      }
    }
    for (const w of this.wisps) {
      w.ph += dt;
      if (w.hit !== undefined) continue;
      w.x += (w.vx + Math.sin(w.ph * 1.3) * 26) * dt;
      w.y += this.speed * 0.3 * dt;
    }
    for (const w of this.wisps)
      if (w.piece && w.hit === undefined && w.y <= this.y - this.PY - 40 && this.chapter) {
        this.chapter.wait = MISSION.chapter.again;
        this.say("The light is gone. It will come again.");
      }
    this.wisps = this.wisps.filter((w) => (w.hit === undefined ? w.y > this.y - this.PY - 40 : this.t - w.hit < 1));
  }
  private hitWisp(w: Wisp) {
    w.hit = this.t;
    this.stats.wisps++;
    this.focus = Math.min(1, this.focus + 0.4);
    this.burst(w.x, w.y - 30, this.o.settings.calm ? 14 : 36, ["#fff4c0", "#a8e8ff", "#ffffff"], 120);
    sfx.chime();
    if (w.piece) return this.gotPiece(w.x, w.y - 30);
    if (this.mode === "tutorial") return;
    if (this.mode === "endless" || w.memory < 0) {
      this.souls += ENDLESS.wispSouls;
      this.stats.souls += ENDLESS.wispSouls;
      this.float(w.x, w.y - 40, `+${ENDLESS.wispSouls} souls`, "#b8ffe0");
      return;
    }
    // the memory may have come back some other way meanwhile: take the next one
    let { memory, clarify } = w;
    if ((!clarify && this.memories.includes(memory)) || (clarify && this.clear.includes(memory))) ({ memory, clarify } = this.nextMemory());
    if (memory < 0) return;
    if (clarify) {
      if (!this.clear.includes(memory)) this.clear.push(memory);
    } else {
      this.memories.push(memory);
      this.stats.memoriesFound++;
    }
    this.keys.left = this.keys.right = false;
    this.aimT = -1;
    this.o.onEvent({ type: "wisp", memory, clear: clarify });
  }

  /* ---------------- fords ---------------- */

  private buildFord() {
    const y0 = this.y + FORD.ahead;
    const cx = this.x;
    const rows: Ford["rows"] = [];
    let ok = Math.floor(Math.random() * FORD.stones);
    for (let r = 0; r < FORD.rows; r++) {
      if (r > 0) ok = Math.max(0, Math.min(FORD.stones - 1, ok + [-1, 0, 1][Math.floor(Math.random() * 3)]));
      const xs = Array.from({ length: FORD.stones }, (_, k) => cx + (k - (FORD.stones - 1) / 2) * FORD.spread + (Math.random() - 0.5) * 8);
      rows.push({ y: y0 + 40 + r * FORD.gap, xs, ok });
    }
    const y1 = y0 + 80 + (FORD.rows - 1) * FORD.gap;
    this.clearArea(() => true, cx - 900, cx + 900, y0 - 60, y1 + 60);
    for (const c of this.near(cx, (y0 + y1) / 2, 6, 2)) for (const p of c.picks) if (p.y > y0 - 40 && p.y < y1 + 40) p.taken = true;
    this.extra = this.extra.filter((p) => p.y < y0 - 40 || p.y > y1 + 40);
    const f: Ford = { id: this.nextId++, y0, y1, cx, land: this.land, rows, lit: -1, bridged: this.bridge };
    if (this.bridge) this.bridge = false;
    this.fords.push(f);
    return f;
  }
  private fordStep() {
    const m = this.metres;
    const pendingGate = this.gates.some((g) => !g.passed && g.y > this.y - 100 && g.y < this.y + 1600);
    if (this.mode === "mission" && this.land <= 2 && this.fordDone < this.land && m - (this.landM ?? 0) >= this.fordAtM && !this.fords.some((f) => f.y1 > this.y)) {
      const busy = pendingGate || !!this.chapter || this.villages.some((v) => v.state === "waiting" && v.y1 > this.y - 100 && v.y0 < this.y + FORD.ahead + 600);
      if (busy) this.fordAtM += 40;
      else {
        this.buildFord();
        this.fordDone = this.land;
        this.fordAtM = MISSION.fordAt[0] + Math.random() * (MISSION.fordAt[1] - MISSION.fordAt[0]);
      }
    } else if (this.mode === "endless" && this.biome <= 2 && m >= this.fordAtM && !this.fords.some((f) => f.y1 > this.y)) {
      if (this.villages.some((v) => v.state === "waiting" && v.y1 > this.y - 100 && v.y0 < this.y + FORD.ahead + 600)) this.fordAtM += 40;
      else {
        this.buildFord();
        this.fordAtM = this.event?.name === "fords" ? m + 200 + Math.random() * 100 : m + FORD.endlessGap[0] + Math.random() * (FORD.endlessGap[1] - FORD.endlessGap[0]);
      }
    }
    for (const f of this.fords) {
      // the right stones light up one after another as the ford comes into view
      if (f.lit < 0 && this.sy(f.rows[0].y) < VIEW_H * 0.8) {
        f.lit = this.t;
        if (!f.told) {
          f.told = true;
          if (!this.o.seenKinds.includes("ford")) {
            this.o.seenKinds.push("ford");
            this.say(f.bridged ? "A ford, and your roots knit across it." : "A ford. A will-o'-the-wisp hops across it on the safe stones: watch where it treads, then ride the same stones from memory.", true);
          }
        }
      }
      for (const r of f.rows) {
        if (r.passed || this.y < r.y) continue;
        r.passed = true;
        // one slip per ford is enough: the current carries you over the rest
        if (f.bridged || f.slipped) continue;
        if (Math.abs(this.x - r.xs[r.ok]) <= 27) {
          this.burst(this.x, this.y + 2, 8, ["#cfe0e8", "#8ea2b0", "#ffffff"], 50, true);
        } else {
          f.slipped = true;
          this.burst(this.x, this.y, 18, ["#2a3a30", "#7a9a8a", "#cfe0e8"], 90);
          this.hurt("You slipped into the black water");
        }
      }
      if (!f.slipped && !f.counted && f.rows.every((r) => r.passed) && !f.bridged) {
        f.counted = true;
        this.stats.fords++;
        this.say("Across, dry-shod.");
      }
    }
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
      type: "end", win, cause: win ? (this.mode === "tutorial" ? "The First Morning" : this.mode === "extreme" ? "You outlasted the hunt" : "The Long Spring") : this.endCause,
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
      maxHearts: this.mode === "endless" || this.mode === "extreme" ? this.o.choice.mount.hearts : Math.max(this.hearts, this.o.choice.mount.hearts),
      arrows: this.arrows,
      swords: this.swords,
      maxSwords: this.maxSwords(),
      traps: this.traps,
      rune: this.rune,
      casting: !!this.casting && !this.casting.end,
      focus: this.focus,
      homing: this.homing,
      ability: r.ability,
      abilityReady: this.cool > 0 ? 1 - this.cool / r.cooldown : 1,
      companion: this.comp && this.comp.state !== "gone" ? this.comp.kind : null,
      companionRest: !!this.comp && this.comp.state === "rest",
      danger: this.danger(),
      biome: BIOMES[this.biome].name,
      wordGot: this.wordGot,
      lamp: this.lamp ? { want: this.lamp.want, got: this.lamp.got, mirror: this.lamp.mirror, streak: this.lampStreak } : null,
      aiming: this.aimT >= 0,
      mode: this.mode,
      souls: this.mode === "mission" ? this.savedLand : this.souls,
      need: this.need,
      chapter: this.chapter ? { memory: this.chapter.i, got: this.chapter.got, forget: Math.min(1, this.chapter.t / this.chapter.limit) } : null,
      event: this.calmT > 0 ? "Quiet" : this.event ? EVENTS[this.event.name].name : this.fog ? "Fog" : null,
      timeLeft: this.mode === "extreme" ? Math.max(0, EXTREME.time - this.runT) : 0,
      kills: this.stats.kills ?? 0,
      lamps: this.stats.lamps,
      land: this.land,
      finale: this.finaleT > 0 && !this.over,
      finaleT: this.finaleT,
    };
  }

  private danger() {
    let d = 0;
    for (const q of this.monsters) if (this.hunting(q) && q.state !== "stunned" && q.state !== "rooted" && q.state !== "flee") d = Math.max(d, 1 - Math.max(0, this.y - q.y - 20) / 260);
    return Math.max(0, Math.min(1, d));
  }

  /* ---------------- drawing ---------------- */

  private sx(x: number) {
    return x - this.camX + this.W / 2;
  }
  private sy(y: number) {
    return this.PY + (y - this.y);
  }
  private glow(x: number, y: number, r: number, rgb: string, a: number) {
    if (a <= 0.004 || r <= 0) return;
    const g = this.ctx;
    const was = g.globalAlpha;
    g.globalAlpha = was * Math.min(1, a);
    g.drawImage(glowCanvas(rgb), x - r, y - r, r * 2, r * 2);
    g.globalAlpha = was;
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
    for (const f of this.fords) this.drawFord(f);
    this.drawRot();

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
              else if (o.kind === "ruin") this.put(this.ruinArt[o.v % 3], x, y + 4);
              else if (o.kind === "pit") twoWay((l) => l.pit[wrap(Math.floor(this.t * 10 + o.v * 2), 6)], x, y + 4);
              else if (o.kind === "arch") twoWay((l) => l.arch, x, y + 2);
              else twoWay((l) => l[o.kind as "menhir" | "stone" | "log" | "thorns"], x, y + 1);
              if (vis) this.hint(o, x, this.sy(o.y));
            },
          });
        }
        if (c.decor) for (const d of c.decor) list.push({ y: d.y - 40, fn: () => this.put(this.boneArt[d.v % 5], this.sx(d.x), this.sy(d.y)) });
        for (const p of c.picks) if (!p.taken) list.push({ y: p.y, fn: () => this.drawPick(p) });
        if (c.life && !this.o.showcase) for (const cr of c.life) list.push({ y: cr.kind === "butterfly" ? cr.y + 40 : cr.y, fn: () => this.drawCritter(cr) });
      }
    // the pieces of a memory keep their colour while the land around them greys: they are drawn after the grey
    const grey = this.forgetVis > 0.03;
    const stoneId = this.chapter?.stone;
    for (const p of this.extra) if (!p.taken && !(grey && p.id === stoneId)) list.push({ y: p.y, fn: () => this.drawPick(p) });
    for (const w of this.wisps) if (!(grey && w.piece)) list.push({ y: w.y + 40, fn: () => this.drawWisp(w) });
    for (const l of this.lights) if (!l.taken && !l.gone) list.push({ y: l.y, fn: () => this.drawLight(l) });
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
    // forgetting: the colour drains out of the world, and the dark closes in from the edges
    if (this.forgetVis > 0.01 && !this.o.showcase) {
      const f = this.forgetVis;
      g.save();
      g.globalCompositeOperation = "saturation";
      g.fillStyle = `rgba(128,128,128,${Math.min(0.92, f * 1.05).toFixed(3)})`;
      g.fillRect(0, 0, W, H);
      g.globalCompositeOperation = "source-over";
      const vg = g.createRadialGradient(W / 2, this.PY + 60, Math.min(W, H) * (0.55 - f * 0.25), W / 2, this.PY + 60, Math.max(W, H) * 0.75);
      vg.addColorStop(0, "rgba(8,6,10,0)");
      vg.addColorStop(1, `rgba(8,6,10,${(f * 0.7).toFixed(3)})`);
      g.fillStyle = vg;
      g.fillRect(0, 0, W, H);
      g.restore();
    }
    if (this.chapter?.ring) this.drawRing(this.chapter.ring);
    if (this.tring) this.drawRing(this.tring);
    if (grey) {
      for (const p of this.extra) if (!p.taken && p.id === stoneId) {
        this.glow(this.sx(p.x), this.sy(p.y) - 14, 34, "255,240,190", 0.5 + Math.sin(this.t * 4) * 0.15);
        this.drawPick(p);
      }
      for (const w of this.wisps) if (w.piece) this.drawWisp(w);
    }

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
      if (s.spear) {
        g.strokeStyle = "#1c1410";
        g.lineWidth = 2.6;
        g.beginPath();
        g.moveTo(x - dx, y - dy);
        g.lineTo(x + dx, y + dy);
        g.stroke();
        g.strokeStyle = "#d8dce4";
        g.lineWidth = 1.4;
        g.stroke();
        continue;
      }
      // the dryad's arrows are light: a glowing green shaft with a trail
      const home = s.home ? "168,232,255" : "120,255,110";
      this.glow(x, y, 16, home, 0.55);
      g.strokeStyle = `rgba(${home},0.35)`;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x - dx * 2.4, y - dy * 2.4);
      g.lineTo(x + dx, y + dy);
      g.stroke();
      g.strokeStyle = s.home ? "#d8f6ff" : "#c8ffb0";
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(x - dx, y - dy);
      g.lineTo(x + dx, y + dy);
      g.stroke();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.arc(x + dx, y + dy, 1.6, 0, Math.PI * 2);
      g.fill();
    }
    // the rune's beam: a river of small glowing leaves from her to what it struck
    for (const bm of this.beams) {
      const a = 1 - (this.t - bm.t) / 0.7;
      if (a <= 0) continue;
      const x0 = this.sx(bm.x0), y0 = this.sy(bm.y0) - 18, x1 = this.sx(bm.x1), y1 = this.sy(bm.y1) - 14;
      const d = Math.hypot(x1 - x0, y1 - y0);
      g.save();
      g.globalAlpha = a;
      g.strokeStyle = "rgba(150,255,140,0.35)";
      g.lineWidth = 10 * a + 2;
      g.beginPath();
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
      g.stroke();
      const n = Math.max(8, Math.floor(d / 7));
      for (let k = 0; k < n; k++) {
        const f = k / n;
        const w = Math.sin(f * 18 + this.t * 20 + k) * 6 * a;
        const nx = -(y1 - y0) / (d || 1), ny = (x1 - x0) / (d || 1);
        const px = x0 + (x1 - x0) * f + nx * w, py = y0 + (y1 - y0) * f + ny * w;
        g.fillStyle = k % 3 === 0 ? "#ffffff" : k % 3 === 1 ? "#b8ff9a" : "#6aff6a";
        g.beginPath();
        g.ellipse(px, py, 3, 1.4, f * 9 + this.t * 6, 0, Math.PI * 2);
        g.fill();
      }
      this.glow(x1, y1, 40 * a + 10, "150,255,140", a);
      g.restore();
    }
    // the aim: a dotted line swinging behind you, or following the mouse or the stick
    if (this.aimT >= 0 && !this.o.showcase) {
      const a = this.aimAngle();
      const free = this.aimFree();
      // aimed freely, the line steadies as the string is drawn, and shakes if it is held too long
      const loose = free ? 0.34 * Math.max(0, 1 - this.aimT / 0.45) + Math.max(0, this.aimT - 1.8) * 0.22 : 0;
      const shake = free && this.aimT > 1.8 && !this.o.settings.calm ? Math.sin(this.t * 40) * loose * 0.5 : 0;
      const len = free ? 230 : 150;
      g.fillStyle = this.homing > 0 ? "#a8e8ff" : "#fff4a0";
      for (let d = 18; d < len; d += 9) {
        g.beginPath();
        g.arc(this.sx(this.x) + Math.sin(a + shake) * d, this.PY - 14 - Math.cos(a + shake) * d, 1.6, 0, Math.PI * 2);
        g.fill();
      }
      if (loose > 0.02) {
        g.strokeStyle = "rgba(255,244,160,0.35)";
        g.lineWidth = 1;
        for (const sd of [-1, 1]) {
          g.beginPath();
          g.moveTo(this.sx(this.x), this.PY - 14);
          g.lineTo(this.sx(this.x) + Math.sin(a + sd * loose / 2) * len * 0.7, this.PY - 14 - Math.cos(a + sd * loose / 2) * len * 0.7);
          g.stroke();
        }
      }
    }
    // calm, while the bow is drawn: a ring that empties
    if (this.aimT > 0.22 && !this.o.showcase) {
      g.strokeStyle = this.focus > 0 ? "rgba(168,232,255,0.8)" : "rgba(255,120,120,0.6)";
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(this.sx(this.x), this.PY - 50, 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.focus);
      g.stroke();
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
    // in The Rot a dirty rain is always falling
    const rainLand = this.landAtY(this.y);
    const rain = this.event?.name === "storm" ? 1 : ([1, 0.7, 0.3, 0][rainLand] ?? 0);
    if (rain > 0 && !this.finaleT) {
      g.strokeStyle = rainLand === 0 ? "rgba(150,140,110,0.38)" : rainLand === 1 ? "rgba(160,170,160,0.32)" : "rgba(190,200,200,0.22)";
      g.lineWidth = rainLand === 2 ? 0.8 : 1.1;
      g.beginPath();
      const ph = this.t;
      const n = Math.round(this.drops.length * rain);
      for (let di = 0; di < n; di++) {
        const d = this.drops[di];
        const dy = (d.y + ph * 520 * d.s) % (H + 30) - 15;
        const dx = ((d.x - ph * 130 * d.s - (this.camX % 1600)) % (W + 40) + W + 40) % (W + 40) - 20;
        g.moveTo(dx, dy);
        g.lineTo(dx - d.l * 0.28, dy + d.l);
      }
      g.stroke();
      if (rainLand <= 1) {
        const mist = g.createLinearGradient(0, H * 0.4, 0, H);
        mist.addColorStop(0, "rgba(60,58,50,0)");
        mist.addColorStop(1, `rgba(60,58,50,${rainLand === 0 ? 0.22 : 0.12})`);
        g.fillStyle = mist;
        g.fillRect(0, H * 0.4, W, H * 0.6);
      }
    }
    if (this.fog) this.drawFog();
    if (this.flash > 0) {
      g.fillStyle = `rgba(235,240,255,${(this.flash * 1.2).toFixed(3)})`;
      g.fillRect(0, 0, W, H);
    }
    if (this.casting) this.drawCast();
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
    if (p.kind !== "soul") {
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
    void g;
    const kind = !v ? 0 : v.state === "lost" ? 2 : v.state === "waiting" && this.land === 0 ? 1 : 0;
    const i = o.v % 2;
    if (!kind) return this.put(this.life.cottage[i], x, y);
    // the grey and the burnt-out cottage are painted once, not filtered every frame
    const list = kind === 2 ? this.life.cottageLost : this.life.cottageGrey;
    if (!list[i]) list[i] = tinted(this.life.cottage[i], kind === 2 ? "grayscale(1) brightness(0.42)" : "grayscale(0.65) brightness(0.78)");
    this.put(list[i], x, y);
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
    if (cr.kind === "fairy" && cr.ring) {
      const rg = cr.ring;
      if (cr.flown === undefined && Math.hypot(rg.cx - this.x, rg.cy - this.y) < 110) cr.flown = this.t;
      const an = (calm ? 0 : this.t * 1.7) + (rg.i / rg.n) * Math.PI * 2;
      let fx = this.sx(rg.cx) + Math.cos(an) * 17;
      let fy = this.sy(rg.cy) + Math.sin(an) * 8 - 10 - (calm ? 0 : Math.abs(Math.sin(this.t * 5 + rg.i)) * 4);
      if (away > 0) {
        // scattered: each flies off its own way and fades
        const out = an + 0.3;
        fx += Math.cos(out) * away * 120;
        fy += Math.sin(out) * away * 60 - away * 50;
        g.globalAlpha = Math.max(0, 1 - away / 2.2);
      }
      this.glow(fx, fy, 8, "255,250,220", 0.75);
      const flap = calm ? 0.8 : 0.4 + Math.abs(Math.sin(this.t * 20 + rg.i)) * 0.6;
      g.fillStyle = "rgba(220,240,255,0.7)";
      for (const sd of [-1, 1]) {
        g.beginPath();
        g.ellipse(fx + sd * 2.6 * flap, fy - 1.5, 2.6 * flap, 1.6, sd * 0.5, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = cr.c;
      g.beginPath();
      g.arc(fx, fy, 1.6, 0, Math.PI * 2);
      g.fill();
      g.fillRect(fx - 0.6, fy, 1.2, 3);
      // a faint ring of mushrooms where they dance
      if (rg.i === 0 && away === 0) {
        g.fillStyle = "rgba(240,230,210,0.85)";
        for (let k = 0; k < 9; k++) {
          const a2 = (k / 9) * Math.PI * 2;
          g.beginPath();
          g.ellipse(this.sx(rg.cx) + Math.cos(a2) * 24, this.sy(rg.cy) + Math.sin(a2) * 11, 2, 1.2, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      return;
    }
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
      this.glow(fx, fy, 6, "255,250,170", 0.9 * tw * k);
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
    if (this.swing > 0) {
      // the sword burns with a blue flame as it is drawn
      const k = this.swing / 0.35;
      this.glow(x, y - 34, 52, "90,150,255", 0.6 * k);
      for (let i = 0; i < 3; i++) {
        g.strokeStyle = ["rgba(60,110,255,0.55)", "rgba(120,190,255,0.8)", "rgba(230,245,255,0.95)"][i];
        g.lineWidth = [9, 5, 2][i];
        g.beginPath();
        g.arc(x, y - 20, 34 + Math.sin(this.t * 40 + i) * 1.5, Math.PI * (1.1 + (1 - k) * 0.2), Math.PI * 1.9);
        g.stroke();
      }
      g.fillStyle = "rgba(160,210,255,0.9)";
      for (let i = 0; i < 8; i++) {
        const an = Math.PI * (1.1 + (i / 8) * 0.8);
        const r = 34 + Math.random() * 8;
        g.beginPath();
        g.arc(x + Math.cos(an) * r, y - 20 + Math.sin(an) * r - Math.random() * 6, 1.4, 0, Math.PI * 2);
        g.fill();
      }
    }
  }

  private drawMonster(q: Monster) {
    const g = this.ctx;
    const b = MONSTER_BOX[q.type];
    let x = this.sx(q.x);
    let y = this.sy(q.y);
    if (y > VIEW_H + 20 || y < -b.h) return;
    if (q.state === "under" || q.state === "burst") return this.drawMound(q, x, y);
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
    this.glow(x, y - b.h * 0.25, b.w * 0.75, "12,4,14", 0.42 * a);
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.beginPath();
    g.ellipse(x, y + 2, b.w * 0.3, 5, 0, 0, Math.PI * 2);
    g.fill();
    const fed = Math.min(5, q.fed ?? 0);
    if (fed > 0 && q.state !== "dying") {
      // fed on the living: a red glow that grows with every meal
      const pulse = this.o.settings.calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.t * 6 + q.id);
      const cy = y - b.h * 0.45;
      this.glow(x, cy, b.w * (0.5 + fed * 0.06), "255,40,30", 0.16 + fed * 0.07 + pulse * 0.1);
    }
    const lean = q.state === "lunge" ? 6 : 0;
    if (q.state === "reach" || this.grab?.q === q) this.drawReach(q, x, y);
    if (q.state === "swell") {
      // it swells before it spits
      const k = 1 + (1 - q.timer / 0.7) * 0.22 + (this.o.settings.calm ? 0 : Math.sin(this.t * 40) * 0.02);
      g.save();
      g.translate(x, y + 2);
      g.scale(k, k);
      this.put(this.mons[q.type][f], 0, 0, a);
      g.restore();
      this.glow(x, y - b.h * 0.5, b.w * 0.6, "190,220,70", 0.35);
    } else this.put(this.mons[q.type][f], x, y + 2 + lean, a);
    if (q.hitT > 0) {
      g.globalCompositeOperation = "lighter";
      this.put(this.mons[q.type][f], x, y + 2 + lean, Math.min(1, q.hitT * 2.5) * a);
      g.globalCompositeOperation = "source-over";
    }
    const T = MONSTERS[q.type];
    if (T.hp > 1 && q.state !== "dying") {
      if (q.type === "colossus" && q.hp < T.hp) {
        // the bark splits open, and the rot inside glows through
        g.strokeStyle = `rgba(184,255,90,${(0.5 + 0.4 * Math.sin(this.t * 7)).toFixed(2)})`;
        g.lineWidth = 1.6;
        const r = rng(q.id * 7 + 3);
        for (let k = 0; k < (T.hp - q.hp) * 2; k++) {
          let cx = x + (r() - 0.5) * 50;
          let cy = y - 30 - r() * 60;
          g.beginPath();
          g.moveTo(cx, cy);
          for (let z = 0; z < 4; z++) {
            cx += (r() - 0.5) * 12;
            cy += (r() - 0.3) * 10;
            g.lineTo(cx, cy);
          }
          g.stroke();
        }
      }
      for (let k = 0; k < T.hp; k++) {
        g.fillStyle = k < q.hp ? "#e0303a" : "rgba(40,20,20,0.6)";
        g.beginPath();
        g.arc(x + (k - (T.hp - 1) / 2) * 7, y - b.h - 4, 2.4, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (q.stolen && q.state === "flee") {
      const gy = y - b.h * 0.55;
      this.glow(x + 18, gy, 16, "184,255,224", 0.9);
    }
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
    if (q.vines !== undefined && this.t - q.vines < 1.8) {
      // lianas burst out of the trap and wrap it, glowing
      const k = Math.min(1, (this.t - q.vines) / 0.35);
      const fade = Math.max(0, 1 - Math.max(0, this.t - q.vines - 1.2) / 0.6);
      g.save();
      g.globalAlpha = fade;
      this.glow(x, y - b.h * 0.4, b.w * 0.8, "120,255,110", 0.35);
      for (let i = 0; i < 5; i++) {
        const side = i % 2 ? 1 : -1;
        g.strokeStyle = i % 2 ? "#3a8a2a" : "#6ad84a";
        g.lineWidth = 2.6 - i * 0.25;
        g.beginPath();
        g.moveTo(x + side * (4 + i * 3), y + 3);
        const top = y + 3 - b.h * 0.95 * k;
        for (let s2 = 1; s2 <= 8; s2++) {
          const f = s2 / 8;
          const yy = y + 3 + (top - y - 3) * f;
          g.lineTo(x + Math.sin(f * 7 + i * 1.3) * b.w * 0.32 * side, yy);
        }
        g.stroke();
        g.fillStyle = "#9aff7a";
        for (let s2 = 2; s2 <= 7; s2 += 2) {
          const f = (s2 / 8) * k;
          g.beginPath();
          g.ellipse(x + Math.sin(f * 7 + i * 1.3) * b.w * 0.32 * side + 3, y + 3 - b.h * 0.95 * f, 3, 1.5, 0.6 * side, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
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

  /** the Burrower under the ground: a swelling that creeps towards your line, then splits */
  private drawMound(q: Monster, x: number, y: number) {
    const g = this.ctx;
    const burst = q.state === "burst" ? 1 - q.timer / 0.4 : 0;
    const shake = this.o.settings.calm ? 0 : Math.sin(this.t * 50) * (1 + burst * 3);
    const r = 20 + Math.sin(q.phase * 6) * 2 + burst * 8;
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.beginPath();
    g.ellipse(x, y + 3, r + 4, r * 0.4, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#4e3e2c";
    g.strokeStyle = "#1c1410";
    g.lineWidth = 1.3;
    g.beginPath();
    g.ellipse(x + shake, y - 4, r, r * 0.55, 0, Math.PI, 0);
    g.lineTo(x + r + shake, y);
    g.lineTo(x - r + shake, y);
    g.closePath();
    g.fill();
    g.stroke();
    g.strokeStyle = "#2a1e14";
    g.lineWidth = 1.2;
    g.beginPath();
    for (const k of [-1, 0, 1]) {
      g.moveTo(x + k * 6 + shake, y - r * 0.5);
      g.lineTo(x + k * 9 + shake, y - r * 0.2);
      g.lineTo(x + k * 13 + shake, y - 2);
    }
    g.stroke();
    // a trail of turned earth behind it
    g.fillStyle = "rgba(70,56,40,0.6)";
    for (let k = 1; k < 5; k++) {
      g.beginPath();
      g.ellipse(x + Math.sin(q.phase * 2 + k) * 3, y + k * 10, 6 - k, 3, 0, 0, Math.PI * 2);
      g.fill();
    }
    if (burst > 0) {
      this.put(this.mons[q.type][wrap(Math.floor(this.t * 12), 4)], x, y + 2 + (1 - burst) * 50, burst);
    }
  }

  /** the Hands' arm: drawn back while it aims, then out to wherever you are */
  private drawReach(q: Monster, x: number, y: number) {
    const g = this.ctx;
    const holding = this.grab?.q === q;
    const tx = holding ? this.sx(this.x) : this.sx(q.reachX ?? this.x);
    const ty = holding ? this.PY - 10 : this.PY;
    if (!holding) {
      // where it will land: a ring on the ground ahead of you
      const k = 1 - q.timer / 0.6;
      g.strokeStyle = `rgba(224,48,58,${(0.35 + k * 0.5).toFixed(2)})`;
      g.lineWidth = 2;
      g.beginPath();
      g.ellipse(tx, ty + 6, 34, 11, 0, 0, Math.PI * 2);
      g.stroke();
      return;
    }
    const mx = (x + tx) / 2 + Math.sin(this.t * 9) * 8;
    const my = (y - 30 + ty) / 2;
    for (const [w, c] of [[8, "#1c1410"], [5.5, "#bdb2a6"]] as [number, string][]) {
      g.strokeStyle = c;
      g.lineWidth = w;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x, y - 30);
      g.quadraticCurveTo(mx, my, tx, ty);
      g.stroke();
    }
    g.fillStyle = "#bdb2a6";
    g.strokeStyle = "#1c1410";
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(tx, ty, 7, 5, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  /** the Spitter's rot: an arc through the air, a ring where it will land, and a burning pool after */
  private drawRot() {
    const g = this.ctx;
    for (const p of this.puddles) {
      const x = this.sx(p.x);
      const y = this.sy(p.y);
      if (y < -30 || y > VIEW_H + 30) continue;
      const a = Math.min(1, p.t / 0.8);
      g.fillStyle = `rgba(60,70,14,${(0.75 * a).toFixed(2)})`;
      g.beginPath();
      g.ellipse(x, y, 26, 10, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = `rgba(168,184,58,${(0.55 * a).toFixed(2)})`;
      for (let k = 0; k < 5; k++) {
        const an = k * 1.3 + p.t * 2;
        g.beginPath();
        g.arc(x + Math.cos(an) * 14, y + Math.sin(an) * 4, 2 + (k % 2), 0, Math.PI * 2);
        g.fill();
      }
      this.glow(x, y, 30, "190,220,70", 0.18 * a);
    }
    for (const p of this.spits) {
      const k = p.t / p.dur;
      const tx = this.sx(p.tx);
      const ty = this.sy(p.ty);
      g.strokeStyle = `rgba(190,220,70,${(0.4 + k * 0.5).toFixed(2)})`;
      g.lineWidth = 2;
      g.setLineDash([5, 4]);
      g.beginPath();
      g.ellipse(tx, ty, 26 * (1.4 - k * 0.4), 10 * (1.4 - k * 0.4), 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
      const wx = p.x + (p.tx - p.x) * k;
      const wy = p.y + (p.ty - p.y) * k;
      const x = this.sx(wx);
      const y = this.sy(wy) - Math.sin(k * Math.PI) * 70;
      g.fillStyle = "#a8b83a";
      g.strokeStyle = "#2a3008";
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(x, y, 6, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }

  private drawFord(f: Ford) {
    const g = this.ctx;
    const top = this.sy(f.y0);
    const bot = this.sy(f.y1);
    if (bot < -20 || top > VIEW_H + 20) return;
    const land = Math.min(2, f.land);
    const deep = ["#12191a", "#16262a", "#1a3236"][land];
    const shallow = ["rgba(80,96,70,0.5)", "rgba(90,120,110,0.45)", "rgba(110,150,150,0.45)"][land];
    const calm = this.o.settings.calm;
    // a river across the whole land, running from left to right, with muddy banks
    g.fillStyle = "#3a3024";
    g.fillRect(0, top - 10, this.W, 10);
    g.fillRect(0, bot, this.W, 10);
    g.fillStyle = deep;
    g.fillRect(0, top, this.W, bot - top);
    // the shallows where the stones are, a paler band through the middle of the road
    const sx0 = this.sx(f.cx) - (FORD.stones / 2) * FORD.spread - 20;
    const sw = FORD.stones * FORD.spread + 40;
    const sh = g.createLinearGradient(sx0 - 30, 0, sx0 + sw + 30, 0);
    sh.addColorStop(0, "rgba(0,0,0,0)");
    sh.addColorStop(0.2, shallow);
    sh.addColorStop(0.8, shallow);
    sh.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sh;
    g.fillRect(sx0 - 30, top + 4, sw + 60, bot - top - 8);
    // the current: streaks drifting sideways
    g.strokeStyle = land === 0 ? "rgba(140,170,110,0.28)" : "rgba(190,225,230,0.3)";
    g.lineWidth = 1.2;
    g.beginPath();
    const flow = calm ? this.t * 12 : this.t * 46;
    for (let k = 0; k < 26; k++) {
      const wy = top + 8 + ((k * 23.7) % Math.max(1, bot - top - 16));
      const wx = (((k * 173 + flow - this.camX) % (this.W + 60)) + this.W + 60) % (this.W + 60) - 30;
      g.moveTo(wx, wy);
      g.quadraticCurveTo(wx + 10, wy - 2, wx + 22, wy);
    }
    g.stroke();
    // the guide: a will-o'-the-wisp hops from stone to stone over the right way, once, then is gone
    const each = FORD.lightEach;
    const since = f.lit >= 0 ? this.t - f.lit : -1;
    const ri = since >= 0 ? Math.floor(since / each) : -1;
    f.rows.forEach((row, r) => {
      const ry = this.sy(row.y);
      if (f.bridged) {
        g.strokeStyle = "#6a4a2a";
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(this.sx(row.xs[0]) - 26, ry);
        g.lineTo(this.sx(row.xs[row.xs.length - 1]) + 26, ry);
        g.stroke();
        g.strokeStyle = "#8ae05a";
        g.lineWidth = 1;
        g.stroke();
      }
      row.xs.forEach((sx0, k) => {
        const x = this.sx(sx0);
        const touched = r === ri && k === row.ok;
        // a ring of water round each stone, as it breaks the current
        g.strokeStyle = "rgba(220,240,240,0.35)";
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(x - 3, ry + 1, 17, 6.5, 0, Math.PI * 0.6, Math.PI * 1.45);
        g.stroke();
        // flat stones, their tops just above the water, wet and dark
        g.fillStyle = ["#4a4840", "#55564c", "#5e6258"][land];
        g.strokeStyle = "#141210";
        g.lineWidth = 1;
        g.beginPath();
        g.ellipse(x, ry, 13, 5, 0, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        g.fillStyle = "rgba(255,255,255,0.1)";
        g.beginPath();
        g.ellipse(x - 3, ry - 1.5, 5, 1.6, 0, 0, Math.PI * 2);
        g.fill();
        if (touched) this.glow(x, ry, 22, "255,236,170", 0.7 * (1 - (since % each) / each));
      });
    });
    if (ri >= 0 && ri < f.rows.length && !f.bridged) {
      const k = (since % each) / each;
      const cur = f.rows[ri];
      const prev = ri > 0 ? f.rows[ri - 1] : null;
      const x0 = prev ? prev.xs[prev.ok] : cur.xs[cur.ok];
      const y0 = prev ? prev.y : cur.y + 50;
      const x1 = cur.xs[cur.ok];
      const t = Math.min(1, k * 1.6);
      const wx = this.sx(x0 + (x1 - x0) * t);
      const wy = this.sy(y0 + (cur.y - y0) * t) - 16 - Math.sin(t * Math.PI) * 18;
      const fade = ri === f.rows.length - 1 ? 1 - Math.max(0, k - 0.7) / 0.3 : 1;
      this.glow(wx, wy, 20, "200,255,230", 0.8 * fade);
      g.fillStyle = `rgba(255,255,255,${fade.toFixed(2)})`;
      g.beginPath();
      g.arc(wx, wy, 3, 0, Math.PI * 2);
      g.fill();
    }
  }

  /** a lamp-light hanging over the road on its own glow */
  private drawLight(l: LampLight) {
    const g = this.ctx;
    const c = LAMP[l.colour];
    const x = this.sx(l.x);
    const gy = this.sy(l.y);
    if (gy < -40 || gy > VIEW_H + 40) return;
    const y = gy - 26 + Math.sin(l.ph * 2.4) * 3;
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.beginPath();
    g.ellipse(x, gy + 1, 8, 3, 0, 0, Math.PI * 2);
    g.fill();
    this.glow(x, gy, 18, c.rgb, 0.25);
    this.glow(x, y, 22 + Math.sin(l.ph * 5) * 2, c.rgb, 0.75);
    // not by colour alone: green round, gold a diamond, blue a square
    g.fillStyle = c.core;
    g.beginPath();
    if (l.colour === "green") g.arc(x, y, 4.4, 0, Math.PI * 2);
    else if (l.colour === "gold") {
      g.moveTo(x, y - 5.5);
      g.lineTo(x + 5.5, y);
      g.lineTo(x, y + 5.5);
      g.lineTo(x - 5.5, y);
      g.closePath();
    } else g.rect(x - 4, y - 4, 8, 8);
    g.fill();
    // a thin thread of light down to the ground, so you can tell where it stands
    g.strokeStyle = `rgba(${c.rgb},0.35)`;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x, y + 5);
    g.lineTo(x, gy);
    g.stroke();
  }

  /** the creeping fog: soft banks rolling in along the edges and the bottom, thin over the middle */
  private drawFog() {
    const g = this.ctx;
    const f = this.fog!;
    const W = this.W;
    const H = VIEW_H;
    const k = Math.min(1, f.t / 5, (f.len - f.t) / 5);
    if (k <= 0) return;
    const l = this.landAtY(this.y);
    const rgb = l === 0 ? "120,180,96" : l === 3 ? "110,190,255" : "190,196,200";
    g.fillStyle = `rgba(${rgb},${(0.12 * k).toFixed(3)})`;
    g.fillRect(0, 0, W, H);
    const t = this.t;
    const banks = 9;
    for (let i = 0; i < banks; i++) {
      const ph = i * 1.7;
      const side = i % 3;
      const r = 90 + (i % 4) * 30;
      // left edge, right edge, the bottom; they creep in and out
      const reach = (0.6 + 0.4 * Math.sin(t * 0.35 + ph)) * k;
      let x = 0;
      let y = 0;
      if (side === 0) {
        x = -r * 0.5 + reach * r * 0.6;
        y = ((i * 97 + t * 14) % (H + 200)) - 100;
      } else if (side === 1) {
        x = W + r * 0.5 - reach * r * 0.6;
        y = ((i * 131 + t * 11) % (H + 200)) - 100;
      } else {
        x = ((i * 173 + t * 18) % (W + 200)) - 100;
        y = H + r * 0.3 - reach * r * 0.7;
      }
      this.glow(x, y, r, rgb, (l === 3 ? 0.75 : 0.55) * k);
    }
    // in Bloom it is magic: it glitters
    if (l === 3 && !this.o.settings.calm) {
      g.fillStyle = `rgba(220,240,255,${(0.8 * k).toFixed(3)})`;
      for (let i = 0; i < 24; i++) {
        const x = (i * 53 + Math.sin(t + i) * 20) % W;
        const y = (i * 71 + t * 9) % H;
        if (Math.sin(t * 3 + i * 2) > 0.4) g.fillRect(x, y, 1.6, 1.6);
      }
    }
  }

  /** the ring of light a memory's second piece waits in: ride through it */
  private drawRing(r: { x: number; y: number; ph: number }) {
    const g = this.ctx;
    const x = this.sx(r.x);
    const y = this.sy(r.y);
    if (y < -40 || y > VIEW_H + 40) return;
    const p = 1 + Math.sin(r.ph * 4) * 0.08;
    this.glow(x, y, 60 * p, "255,236,170", 0.55);
    g.lineWidth = 3;
    g.strokeStyle = "rgba(255,244,200,0.95)";
    g.beginPath();
    g.ellipse(x, y, 30 * p, 13 * p, 0, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 1.4;
    g.strokeStyle = "rgba(255,210,120,0.9)";
    g.setLineDash([3, 4]);
    g.lineDashOffset = -r.ph * 20;
    g.beginPath();
    g.ellipse(x, y, 22 * p, 9 * p, 0, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([]);
    for (let k = 0; k < 6; k++) {
      const a = r.ph * 1.5 + (k * Math.PI) / 3;
      g.fillStyle = "rgba(255,250,220,0.9)";
      g.fillRect(x + Math.cos(a) * 30 * p - 1, y - 8 - Math.abs(Math.sin(r.ph * 2 + k)) * 18 + Math.sin(a) * 4, 2, 2);
    }
  }

  private drawWisp(w: Wisp) {
    const g = this.ctx;
    const x = this.sx(w.x);
    const y = this.sy(w.y) - 30 + Math.sin(w.ph * 2.2) * 4;
    if (w.hit !== undefined) return;
    const mem = this.mode === "mission";
    const c = mem ? "255,240,190" : "184,255,224";
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.beginPath();
    g.ellipse(x, this.sy(w.y) + 2, 7, 2.5, 0, 0, Math.PI * 2);
    g.fill();
    const r = 16 + Math.sin(w.ph * 5) * 2;
    const gl = g.createRadialGradient(x, y, 0, x, y, r);
    gl.addColorStop(0, `rgba(${c},0.95)`);
    gl.addColorStop(0.35, `rgba(${c},0.45)`);
    gl.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gl;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(x, y, 3.2, 0, Math.PI * 2);
    g.fill();
    for (let k = 0; k < 4; k++) {
      const a = w.ph * 3 + k * 1.6;
      g.fillStyle = `rgba(${c},0.8)`;
      g.fillRect(x + Math.cos(a) * 9 - 0.8, y + Math.sin(a) * 6 + 6 + k * 2, 1.6, 1.6);
    }
  }

  /** one ogham piece: a few strokes off the stem (or across it, or dots on it) */
  private drawPiece(cx: number, cy: number, p: Piece, colour: string, stem: boolean, scale = 1) {
    const g = this.ctx;
    const gap = 6 * scale;
    const len = 13 * scale;
    const top = cy - ((p.n - 1) * gap) / 2;
    g.lineCap = "round";
    if (stem) {
      g.strokeStyle = "rgba(240,230,200,0.35)";
      g.lineWidth = 3 * scale;
      g.beginPath();
      g.moveTo(cx, top - 9 * scale);
      g.lineTo(cx, top + (p.n - 1) * gap + 9 * scale);
      g.stroke();
    }
    g.strokeStyle = colour;
    g.fillStyle = colour;
    g.lineWidth = 3 * scale;
    for (let k = 0; k < p.n; k++) {
      const y = top + k * gap;
      g.beginPath();
      if (p.side === "R") {
        g.moveTo(cx, y);
        g.lineTo(cx + len, y);
      } else if (p.side === "L") {
        g.moveTo(cx - len, y);
        g.lineTo(cx, y);
      } else if (p.side === "X") {
        g.moveTo(cx - len * 0.9, y + 3 * scale);
        g.lineTo(cx + len * 0.9, y - 3 * scale);
      } else {
        g.arc(cx, y, 2.6 * scale, 0, Math.PI * 2);
        g.fill();
        continue;
      }
      g.stroke();
    }
  }

  /** the rune being cast: the letter on its stem, then the pieces to set back, and the time left */
  private drawCast() {
    const g = this.ctx;
    const c = this.casting!;
    const sp = SPELLS[c.spell];
    const W = this.W;
    const n = c.slots.length;
    const cw = Math.min(W - 24, 150 + n * 54);
    const x0 = (W - cw) / 2;
    // up at the top, over the monsters behind, never over the road ahead
    const y0 = 6;
    const ph = 50 + n * 25;
    const fade = c.end ? Math.max(0, 1 - (this.t - c.end) / 0.9) : 1;
    const showing = c.t < c.show && !c.end;
    g.globalAlpha = fade;
    g.fillStyle = "rgba(16,18,16,0.86)";
    g.strokeStyle = c.end ? (c.ok ? sp.colour : "#e0303a") : "#a8a090";
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x0, y0, cw, ph, 10);
    g.fill();
    g.stroke();
    g.textAlign = "center";
    g.fillStyle = sp.colour;
    g.font = "bold 15px Georgia, serif";
    g.fillText(c.end ? (c.ok ? `${sp.name}!` : "The rune breaks") : showing ? `${sp.name}: remember the rune` : `${sp.name}: set it again, from the bottom`, W / 2, y0 + 21);
    // the stem: the letter, bottom to top
    const sx = x0 + 52;
    const bottom = y0 + ph - 24;
    const topY = y0 + 40;
    g.strokeStyle = "#d8ccb0";
    g.lineWidth = 3.4;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(sx, bottom + 8);
    g.lineTo(sx, topY - 6);
    g.stroke();
    const step = (bottom - topY) / Math.max(1, n - 1 || 1);
    c.slots.forEach((p, i) => {
      const cy = n === 1 ? (bottom + topY) / 2 : bottom - i * step;
      if (showing || i < c.got || (c.end && !c.ok)) {
        const col = i < c.got ? sp.colour : showing ? "#f6f1e4" : "rgba(255,120,120,0.75)";
        this.drawPiece(sx, cy, p, col, false);
      } else {
        g.strokeStyle = i === c.got ? "rgba(255,240,180,0.7)" : "rgba(255,255,255,0.18)";
        g.lineWidth = 1;
        g.setLineDash([3, 3]);
        g.strokeRect(sx - 16, cy - 11, 32, 22);
        g.setLineDash([]);
      }
    });
    // the pieces, mixed up, to choose from
    if (!showing && !c.end) {
      const tx0 = x0 + 104;
      const tw = cw - 116;
      const each = Math.min(54, tw / Math.max(1, c.tray.length));
      const ty = y0 + ph / 2 + 6;
      c.tray.forEach((si, k) => {
        const cx = tx0 + each * (k + 0.5);
        const sel = k === c.cur;
        g.fillStyle = sel ? "rgba(255,240,180,0.18)" : "rgba(255,255,255,0.05)";
        g.strokeStyle = sel ? "#f6e6a0" : "rgba(255,255,255,0.2)";
        g.lineWidth = sel ? 2 : 1;
        g.beginPath();
        g.roundRect(cx - each / 2 + 3, ty - 26, each - 6, 52, 8);
        g.fill();
        g.stroke();
        this.drawPiece(cx, ty, c.slots[si], sel ? "#fff6d0" : "#d8ccb0", true, 0.9);
      });
      g.fillStyle = "rgba(246,241,228,0.6)";
      g.font = "12px Georgia, serif";
      g.fillText(this.coarse ? "flick ◀ ▶ to choose, ▲ to set" : "◀ ▶ choose · ▲ set", tx0 + tw / 2, ty + 40);
    } else if (showing) {
      g.fillStyle = "rgba(246,241,228,0.6)";
      g.font = "italic 13px Georgia, serif";
      g.fillText("Look hard: it fades.", x0 + 104 + (cw - 116) / 2, y0 + ph / 2 + 6);
    }
    if (!c.end) {
      const k = c.t < c.show ? 1 : Math.max(0, 1 - (c.t - c.show) / (c.limit - c.show));
      g.fillStyle = "rgba(255,255,255,0.15)";
      g.fillRect(x0 + 14, y0 + ph - 9, cw - 28, 4);
      g.fillStyle = k > 0.3 ? sp.colour : "#e0303a";
      g.fillRect(x0 + 14, y0 + ph - 9, (cw - 28) * k, 4);
    }
    g.globalAlpha = 1;
    g.textAlign = "left";
  }

  private drawCompanion() {
    const c = this.comp!;
    if (c.state === "rest") {
      const g = this.ctx;
      g.font = "italic bold 13px Georgia, serif";
      g.textAlign = "center";
      g.fillStyle = `rgba(240,240,255,${(0.5 + 0.4 * Math.sin(this.t * 3)).toFixed(2)})`;
      g.fillText("z", this.sx(c.x) + 10, this.sy(c.y) - 34 - ((this.t * 10) % 8));
    }
    const f = wrap(Math.floor(this.t * 8), 2);
    if (c.kind === "fox" || c.kind === "hare") {
      const fr = this.life.animals[c.kind];
      this.putFlip(fr[wrap(Math.floor(this.t * 9), 2)], this.sx(c.x), this.sy(c.y) + 4, c.vx < 0);
      this.glow(this.sx(c.x), this.sy(c.y) - 8, 18, "150,255,170", 0.25);
    } else this.put(this.runArt[c.kind][f], this.sx(c.x), this.sy(c.y) + 4);
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
