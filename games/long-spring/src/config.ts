/**
 * Everything you might want to tune lives here. The ?tune panel changes TUNE while you play.
 * Units: world pixels (the game draws at whatever resolution the screen has) and seconds.
 * Speeds are real: a mount runs at its own km/h, and the metres on the counter are real metres.
 */

export const TUNE = {
  /** metres of land per world pixel: sets how fast the land slides past at a given km/h */
  metresPerPx: 0.12,
  /** how much faster than you a monster runs (0.08 = 8 %) */
  monsterGain: 0.1,
  /** side speed, px/s (multiplied by the mount's turning) */
  steer: 135,
  /** how quickly you reach full side speed (1/s) */
  steerAccel: 7,
  /** obstacles per 160×160 px of ground before the land gets busier */
  density: 2.8,
  /** after you hit something: how close the nearest monster jumps (px behind you) */
  surgeTo: 60,
  /** the lunge: how close a monster must be before it leaps at you (px) */
  lungeFrom: 90,
};

/** where the run ends: ten kilometres of real riding is about nine minutes */
export const GOAL_M = 10000;

export type Kind = "tree" | "boulder" | "menhir" | "stone" | "pit" | "log" | "thorns" | "arch" | "cottage" | "well";
export type PickKind = "seed" | "bow" | "sword" | "trap" | "bark" | "heart" | "hound" | "raven" | "doe" | "letter";

/**
 * What you do with each obstacle. The rule is simple and the pictures say it:
 * wood lying on the ground you jump, a stone arch you duck under, everything else you ride round.
 */
export const OBSTACLES: Record<Kind, { from: number; hint?: string }> = {
  tree: { from: 0 },
  boulder: { from: 0 },
  menhir: { from: 0 },
  stone: { from: 0 },
  pit: { from: 0 },
  log: { from: 700, hint: "A fallen trunk: jump over it (↑)." },
  arch: { from: 1600, hint: "A stone arch: duck (↓) and ride under it. Its pillars are solid." },
  thorns: { from: 2600, hint: "Thorns lying low: jump them (↑). The boar runs straight through." },
  // only in the villages, never scattered on their own
  cottage: { from: Infinity },
  well: { from: Infinity },
};

/* ---------------- riders and mounts ---------------- */

export type RiderId = "dryad" | "knight" | "amazon";
export type MountId = "elk" | "wolf" | "boar";

export type Rider = {
  id: RiderId;
  name: string;
  line: string;
  ability: string;
  abilityHelp: string;
  passive: string;
  /** multiplier the player needs before this rider can be chosen */
  unlock: number;
  cooldown: number;
};

export const RIDERS: Rider[] = [
  {
    id: "dryad",
    name: "The Dryad",
    line: "She was a tree for three hundred years. Now she runs.",
    ability: "Roots",
    abilityHelp: "Roots grab the nearest monster and hold it for 2.5 s. Ready again after 12 s.",
    passive: "Traps turn up twice as often, and no monster ever sees her traps.",
    unlock: 1,
    cooldown: 12,
  },
  {
    id: "knight",
    name: "The Knight",
    line: "The last of an order that swore to hold the rot back.",
    ability: "Shield",
    abilityHelp: "Her shield stops one monster that catches her, then grows back after 400 m. It works on its own.",
    passive: "She can carry two swords.",
    unlock: 3,
    cooldown: 0,
  },
  {
    id: "amazon",
    name: "The Amazon",
    line: "She has never missed. She has never had to shoot backwards at seventy.",
    ability: "Spear",
    abilityHelp: "She throws a spear ahead and breaks the first thing in her way. Ready again after 8 s.",
    passive: "Her aim swings slower, and every bow brings 5 arrows.",
    unlock: 5,
    cooldown: 8,
  },
];

export type Mount = {
  id: MountId;
  name: string;
  strength: string;
  weakness: string;
  unlock: number;
  /** real speed at the start and at the end of the run */
  kmh: [number, number];
  turn: number;
  /** seconds in the air */
  jump: number;
  hearts: number;
  /** runs straight through small stones and thorns */
  smashes: boolean;
};

export const MOUNTS: Mount[] = [
  {
    id: "elk",
    name: "The Great Elk",
    strength: "The longest jump: logs and thorns are easy to time.",
    weakness: "Turns like any honest elk.",
    unlock: 1,
    kmh: [56, 68],
    turn: 1,
    jump: 0.8,
    hearts: 3,
    smashes: false,
  },
  {
    id: "wolf",
    name: "The Giant Wolf",
    strength: "Fast and the quickest to turn: the best for leading monsters into things.",
    weakness: "A short jump.",
    unlock: 2,
    kmh: [60, 72],
    turn: 1.35,
    jump: 0.5,
    hearts: 3,
    smashes: false,
  },
  {
    id: "boar",
    name: "The War Boar",
    strength: "Runs straight through small stones and thorns, and takes one more hit.",
    weakness: "The slowest, and turns heavily.",
    unlock: 4,
    kmh: [48, 60],
    turn: 0.8,
    jump: 0.5,
    hearts: 4,
    smashes: true,
  },
];

/* ---------------- colours you can choose ---------------- */

export type Look = {
  hair: string;
  skin: string;
  garment: string;
  accent: string;
  coat: string;
  horn: string;
};

export const SWATCHES: Record<keyof Look, { label: string; colours: string[] }> = {
  hair: { label: "Hair", colours: ["#2b1d14", "#6b3a1e", "#c8742a", "#f0d27a", "#efe9e0", "#b8322a", "#3f7a3a", "#5a4aa0"] },
  skin: { label: "Skin", colours: ["#f6d8bf", "#e6b48c", "#c78a5e", "#8d5a3a", "#5e3a26", "#b8d49a"] },
  garment: { label: "Clothes", colours: ["#3f7a3a", "#2a4a8a", "#8a2a3a", "#6a4226", "#c8ccd6", "#2a2a32", "#d0a84a", "#6a3a8a"] },
  accent: { label: "Trim", colours: ["#f0c85a", "#e85a82", "#6ad0e8", "#f6f1e4", "#8ae05a", "#d0303a"] },
  coat: { label: "Mount", colours: ["#8a5a32", "#5a3f2e", "#c0ae94", "#4a4a54", "#e2dacb", "#33261f"] },
  horn: { label: "Antlers & tusks", colours: ["#efe3c6", "#c09a6a", "#7a5a3a", "#9ae8a8"] },
};

export const DEFAULT_LOOK: Record<RiderId, Look> = {
  dryad: { hair: "#3f7a3a", skin: "#b8d49a", garment: "#6a4226", accent: "#e85a82", coat: "#8a5a32", horn: "#efe3c6" },
  knight: { hair: "#f0d27a", skin: "#f6d8bf", garment: "#c8ccd6", accent: "#d0303a", coat: "#4a4a54", horn: "#c09a6a" },
  amazon: { hair: "#2b1d14", skin: "#c78a5e", garment: "#8a2a3a", accent: "#f0c85a", coat: "#5a3f2e", horn: "#7a5a3a" },
};

/* ---------------- monsters ---------------- */

export type MonsterId = "maw" | "crawler" | "eye" | "colossus";

export type MonsterType = {
  id: MonsterId;
  name: string;
  /** what the player learns about it the first time it appears */
  tell: string;
  /** shows up from this distance (m) */
  from: number;
  /** extra speed on top of TUNE.monsterGain */
  gain: number;
  /** side speed px/s, and how quickly it can change direction (1/s) */
  side: number;
  agility: number;
  radius: number;
  /** how it aims: "trail" follows your scent (where you were), "lead" aims where you will be */
  aim: "trail" | "lead" | "zigzag";
  /** chance to see and dodge each kind of thing in its path */
  sees: { tree: number; pit: number; trap: number };
  smashes: boolean;
};

export const MONSTERS: Record<MonsterId, MonsterType> = {
  maw: {
    id: "maw",
    name: "the Maw",
    tell: "The Maw is nearly blind: it follows your scent, so it runs where you ran. Swerve close past a tree and it goes straight in.",
    from: 0,
    gain: 0.03,
    side: 120,
    agility: 4,
    radius: 13,
    aim: "trail",
    sees: { tree: 0.25, pit: 0.2, trap: 0.15 },
    smashes: false,
  },
  crawler: {
    id: "crawler",
    name: "the Crawler",
    tell: "The Crawler runs on its hands and never in a straight line.",
    from: 500,
    gain: 0.02,
    side: 150,
    agility: 6,
    radius: 12,
    aim: "zigzag",
    sees: { tree: 0.6, pit: 0.45, trap: 0.4 },
    smashes: false,
  },
  eye: {
    id: "eye",
    name: "the Eye",
    tell: "The Eye sees pits and traps, and aims where you are going. Blind it, or shoot it.",
    from: 1500,
    gain: 0,
    side: 115,
    agility: 5,
    radius: 13,
    aim: "lead",
    sees: { tree: 0.85, pit: 0.9, trap: 0.8 },
    smashes: false,
  },
  colossus: {
    id: "colossus",
    name: "the Colossus",
    tell: "The Colossus walks through trees and rocks. Only pits and traps stop it.",
    from: 4000,
    gain: -0.02,
    side: 80,
    agility: 2.5,
    radius: 20,
    aim: "lead",
    sees: { tree: 0, pit: 0.35, trap: 0.45 },
    smashes: true,
  },
};

/** how many monsters hunt you at once, by distance (m) */
export const huntersAt = (m: number) => (m < 1000 ? 1 : m < 3000 ? 2 : 3);

/* ---------------- the land ---------------- */

export type Biome = {
  name: string;
  from: number;
  banner: string;
  ground: [string, string];
  specks: string[];
  grass: string;
  flowers: string[];
  trunk: string;
  leaves: string[];
  /** 0 = dead branches, 1 = some leaves, 2 = full, 3 = full with blossom */
  foliage: number;
  rock: string;
  moss: string;
  glow: string;
  busy: number;
  pits: number;
  /** the pits heal land by land: 0 green fire, 1 lower fire and the first stones, 2 a broken rim with embers, 3 a well of water */
  well: number;
};

export const BIOMES: Biome[] = [
  {
    name: "The Rot",
    from: 0,
    banner: "",
    ground: ["#3b3a35", "#33322e"],
    specks: ["#4a4840", "#2a2925", "#55523f"],
    grass: "#4f4c3c",
    flowers: [],
    trunk: "#4a4239",
    leaves: ["#5c564b", "#48423a"],
    foliage: 0,
    rock: "#6a665c",
    moss: "#55523f",
    glow: "#7dff4f",
    busy: 1,
    pits: 1,
    well: 0,
  },
  {
    name: "First Green",
    from: 1000,
    banner: "First Green: the rot gives way",
    ground: ["#41452f", "#383c2a"],
    specks: ["#4f5a34", "#32352a", "#5a663a"],
    grass: "#5f7a38",
    flowers: [],
    trunk: "#4f4030",
    leaves: ["#5a7a38", "#46602c"],
    foliage: 1,
    rock: "#6e6c60",
    moss: "#5a7a38",
    glow: "#72f24c",
    busy: 1.1,
    pits: 0.85,
    well: 1,
  },
  {
    name: "Deep Green",
    from: 2000,
    banner: "Deep Green: the forest remembers",
    ground: ["#476836", "#3d5a2f"],
    specks: ["#5a7e40", "#36502a", "#6a8f48"],
    grass: "#6aa048",
    flowers: ["#f0e070"],
    trunk: "#56402c",
    leaves: ["#3f8a38", "#2f6a2a"],
    foliage: 2,
    rock: "#787666",
    moss: "#4f8a3a",
    glow: "#8aff6a",
    busy: 1.15,
    pits: 0.7,
    well: 2,
  },
  {
    name: "Bloom",
    from: 5000,
    banner: "Bloom: spring has come back",
    ground: ["#5e9440", "#548638"],
    specks: ["#6ea44c", "#4a7a32", "#7cb456"],
    grass: "#86c058",
    flowers: ["#ffd6e2", "#ffe46a", "#ffffff", "#c8a0ff", "#ff9ab4"],
    trunk: "#5c4430",
    leaves: ["#4aa040", "#ffc4d8"],
    foliage: 3,
    rock: "#828074",
    moss: "#5aa040",
    glow: "#b8ffb0",
    busy: 1.2,
    pits: 0.45,
    well: 3,
  },
];

export const biomeAt = (m: number) => {
  let i = 0;
  for (let k = 0; k < BIOMES.length; k++) if (m >= BIOMES[k].from) i = k;
  return i;
};

/** the daily word: one letter waits on the road every LETTER_GAP_M metres */
export const WORDS = ["SPRING", "BLOOM", "ANTLER", "ACORN", "WILLOW", "THAW", "FERN", "ROWAN", "BRAMBLE", "MOSS", "DAWN", "CLOVER", "BIRCH", "HAZEL"];
export const LETTER_GAP_M = 450;

/** the gates of spring: a glowing brook with living arches where each new land begins, and a golden one at the end */
export const GATES = [
  ...BIOMES.slice(1).map((b, i) => ({ m: b.from, biome: i + 1, gold: false })),
  { m: GOAL_M, biome: BIOMES.length - 1, gold: true },
];

/** life on the road: animals crossing (from First Green), villages (in Bloom), and what they are worth */
export const LIFE = {
  animalsFrom: 1100,
  /** metres between two animals, at least and at most */
  animalGap: [220, 480] as [number, number],
  villagesFrom: 5500,
  villageGap: [800, 1200] as [number, number],
  /** points lost when a monster eats an animal / a villager (times the multiplier) */
  animalLoss: 100,
  villagerLoss: 300,
  /** points for leaving a village with nobody taken, and for riding through a gate's arch */
  villageSafe: 250,
  gateBonus: 150,
  /** how much faster a monster gets with each meal (0.07 = 7 %), counted up to five meals; a villager counts as two */
  fedGain: 0.07,
  /** how close a monster must come before villagers run for their doors (px) */
  fleeAt: 170,
};

export const VILLAGE_NAMES = ["Bibury", "Lower Slaughter", "Castle Combe", "Snowshill", "Stanton", "Naunton", "Great Tew", "Guiting Power", "Upper Swell", "Broadwell"];

/** the mission: souls open the gates, hearts are what you pay with */
export const MISSION = {
  /** souls each land asks before its gate opens */
  need: [10, 10, 10, 15],
  villageGap: [190, 280],
  /** the shortest the world holds still after a saved village or glade (then it waits for the player) */
  moment: { village: 1.2, glade: 1.6 },
  heartGap: [150, 240], maxHearts: 9, hunters: [1, 2, 2, 3], sanctuary: 120, gateAhead: 900,
  /** how far each way of a fork lies from the road, and how far ahead the fork shows */
  forkOff: [215, 255], forkAhead: 380,
  /** monsters made from lost people, beyond the usual hunt */
  turnedMax: 4,
};
