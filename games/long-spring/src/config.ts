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

export type Kind = "tree" | "boulder" | "menhir" | "stone" | "pit" | "log" | "thorns" | "arch" | "cottage" | "well" | "ruin";
export type PickKind = "soul" | "bow" | "sword" | "trap" | "rune" | "heart" | "hound" | "raven" | "doe" | "letter";

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
  ruin: { from: 0 },
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
    ability: "Warhorn",
    abilityHelp: "Her horn stops every monster behind her for 1.5 s and throws the nearest one back. Ready again after 14 s.",
    passive: "She can carry two swords.",
    unlock: 3,
    cooldown: 14,
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

export type MonsterId = "hollow" | "hound" | "spitter" | "burrower" | "hands" | "collector" | "colossus";

export type MonsterType = {
  id: MonsterId;
  name: string;
  /** what it was before the rot (the bestiary) */
  lore: string;
  /** what the player learns about it the first time it appears */
  tell: string;
  /** how it gets you, and how to stay alive (the bestiary) */
  danger: string;
  counter: string;
  /** shows up from this distance (m) in the endless ride */
  from: number;
  /** extra speed on top of TUNE.monsterGain */
  gain: number;
  /** side speed px/s, and how quickly it can change direction (1/s) */
  side: number;
  agility: number;
  radius: number;
  /** how it aims: "trail" follows your scent (where you were), "lead" aims where you will be */
  aim: "trail" | "lead" | "zigzag";
  /** how it reaches you */
  way: "plain" | "spit" | "burrow" | "grab" | "thief";
  /** chance to see and dodge each kind of thing in its path */
  sees: { tree: number; pit: number; trap: number };
  /** walks through trees and rocks */
  smashes: boolean;
  /** blows to bring it down: an arrow is one, a trap, the sword or a companion three */
  hp: number;
  /** how often it turns up, against the others it is allowed beside */
  weight: number;
};

/** every weapon works on every monster; they differ in how they come for you */
export const MONSTERS: Record<MonsterId, MonsterType> = {
  hollow: {
    id: "hollow",
    name: "the Hollow",
    lore: "Once a villager nobody reached in time. The rot ate the rest and left the hunger. It runs on all fours now, on arms grown too long, and its jaw hangs open to the chest.",
    tell: "The Hollow is slow and nearly blind: it runs where you ran. Swerve close past a tree and it goes straight in.",
    danger: "Numbers. It follows your scent and leaps when it is close.",
    counter: "Anything kills it. Lead it into a tree, or shoot it once.",
    from: 0, gain: 0, side: 115, agility: 4, radius: 13, aim: "trail", way: "plain",
    sees: { tree: 0.25, pit: 0.2, trap: 0.15 }, smashes: false, hp: 1, weight: 5,
  },
  hound: {
    id: "hound",
    name: "the Rot-hound",
    lore: "It has more legs than a dog should, and they do not all bend the same way. Its spine has come out through its back like a row of thorns.",
    tell: "The Rot-hound is fast and never runs straight, and it jumps the logs you jump.",
    danger: "Speed. It weaves from side to side and leaps from further off than the rest.",
    counter: "Anything kills it, if you can hit it. A trap where it will run is surest.",
    from: 600, gain: 0.06, side: 170, agility: 7, radius: 12, aim: "zigzag", way: "plain",
    sees: { tree: 0.5, pit: 0.4, trap: 0.2 }, smashes: false, hp: 1, weight: 4,
  },
  spitter: {
    id: "spitter",
    name: "the Spitter",
    lore: "A thing of swollen throats. It has three mouths and every one of them is full. What it brings up burns the ground for a long time.",
    tell: "The Spitter keeps its distance and spits rot where you are going. A ring on the ground shows where it will land: don't be there.",
    danger: "From afar. It stops, swells and spits; the rot lands where you will be, and burns there a while.",
    counter: "Watch for the ring and swerve. Shoot it while it swells: it holds still.",
    from: 1300, gain: -0.04, side: 120, agility: 4, radius: 14, aim: "lead", way: "spit",
    sees: { tree: 0.6, pit: 0.6, trap: 0.3 }, smashes: false, hp: 1, weight: 3,
  },
  burrower: {
    id: "burrower",
    name: "the Burrower",
    lore: "A worm the length of a cart, with a ring of teeth that were once somebody's. It hears hooves through the ground.",
    tell: "The Burrower comes from in front, under the ground. Where the earth swells ahead of you, ride round it.",
    danger: "From below and ahead. The ground swells, follows you a little, and bursts.",
    counter: "Steer away from the swelling. Once it is out, anything kills it.",
    from: 2000, gain: 0, side: 110, agility: 3, radius: 15, aim: "trail", way: "burrow",
    sees: { tree: 0.4, pit: 0.4, trap: 0.3 }, smashes: false, hp: 2, weight: 2,
  },
  hands: {
    id: "hands",
    name: "the Hands",
    lore: "No body any more: only arms, knotted together, walking on their fingers. Some of them still wear rings.",
    tell: "The Hands reach. When one stretches out behind you, swerve, or it drags you back to the rest.",
    danger: "Reach. It throws out a long arm from far behind and pulls you back towards it.",
    counter: "Swerve when the arm draws back. Two arrows, a trap, the sword.",
    from: 2800, gain: 0.02, side: 150, agility: 6, radius: 14, aim: "lead", way: "grab",
    sees: { tree: 0.6, pit: 0.6, trap: 0.4 }, smashes: false, hp: 2, weight: 2,
  },
  collector: {
    id: "collector",
    name: "the Collector",
    lore: "A belly like a sack, sewn shut with sinew, and inside it the stolen souls glow. It has no face to speak of: only a slit, and fingers.",
    tell: "The Collector does not kill. It takes a soul and runs: shoot it before it is gone, and the soul comes back.",
    danger: "Theft. It rushes you, takes a soul and runs off sideways.",
    counter: "Shoot it as it runs. Anything kills it.",
    from: 3600, gain: 0.06, side: 170, agility: 6, radius: 11, aim: "lead", way: "thief",
    sees: { tree: 0.7, pit: 0.7, trap: 0.5 }, smashes: false, hp: 1, weight: 1,
  },
  colossus: {
    id: "colossus",
    name: "the Colossus",
    lore: "Stitched together out of many: arms and legs that belonged to other people stick out of it at every angle, and some of them still move on their own.",
    tell: "The Colossus! It breaks trees and rocks like straw. It takes six blows: arrows, traps, the sword, the green fire.",
    danger: "Strength. Trees and rocks don't stop it; it only slows in the water and the fire.",
    counter: "Six blows: an arrow is one, a trap or the sword three. It comes only when you are armed.",
    from: 4500, gain: -0.03, side: 80, agility: 2.5, radius: 20, aim: "lead", way: "plain",
    sees: { tree: 0, pit: 0.35, trap: 0.3 }, smashes: true, hp: 6, weight: 0,
  },
};

/* ---------------- runes and fords ---------------- */

export type SpellId = "thorn" | "light" | "wind" | "bridge";
export const SPELLS: Record<SpellId, { name: string; help: string; colour: string; ogham: string }> = {
  thorn: { name: "Thorn wall", help: "A hedge of thorns springs up behind you and holds every monster there for 3 s.", colour: "#8ae05a", ogham: "᚛ᚑᚅ᚜" },
  light: { name: "Light", help: "A burst of light: the Hollow and the Rot-hound near you fall, the rest stagger.", colour: "#fff4a0", ogham: "᚛ᚂᚔ᚜" },
  wind: { name: "Wind arrow", help: "Your next three arrows bend in the air and find a memory or a monster on their own.", colour: "#a8e8ff", ogham: "᚛ᚃᚆ᚜" },
  bridge: { name: "Root bridge", help: "Roots knit across the next ford: you ride over it safely.", colour: "#d8b070", ogham: "᚛ᚇᚏ᚜" },
};
/** a rune is cast by repeating its pattern: how long it is in each land, how long it shows, time per stroke */
export const RUNE = { len: [3, 4, 5, 6], show: 1.0, perStroke: 0.62, base: 0.9 };
/** fords: rows of stepping stones over black water; the right stone of each row lights up in turn, then goes dark */
export const FORD = { rows: 5, gap: 70, stones: 4, spread: 56, lightEach: 0.42, ahead: 470, endlessGap: [700, 1100] as [number, number] };

/** how many monsters hunt you at once, by distance (m) */
/** how many hunt you at once in the endless ride: one for a long while, then more */
export const huntersAt = (m: number) => (m < 1500 ? 1 : m < 4000 ? 2 : 3);
/** who hunts in each land of the mission (the Colossus comes on its own, once, in Bloom) */
export const MISSION_ROSTER: MonsterId[][] = [
  ["hollow", "hound"],
  ["hollow", "hound", "spitter", "burrower"],
  ["hollow", "hound", "spitter", "burrower", "hands", "collector"],
  ["hollow", "hound", "spitter", "burrower", "hands", "collector"],
];

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
  /** the quiver: arrows at the start of each ride, and what a saved village or glade gives */
  arrows: 4, villageArrows: 3,
  /** a lost memory floats over the land every so often: shoot it to bring it back (m) */
  wispGap: [240, 400] as [number, number],
  /** a ford in each of the first three lands, this far past its gate (m) */
  fordAt: [380, 700] as [number, number],
};

/** the endless ride: only souls lie on the road; every ten bring a heart back */
export const ENDLESS = { soulsPerHeart: 10, wispGap: [300, 520] as [number, number], wispSouls: 3 };

/** how much of each land the rot still holds: all of The Rot, then less and less */
export const RUIN = [1, 0.7, 0.4, 0.2];
