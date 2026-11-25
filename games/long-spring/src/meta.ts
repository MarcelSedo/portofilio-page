/**
 * Everything that lasts between runs: missions and the score multiplier, the daily word,
 * the chosen rider and colours, settings and the best score. Saved in this browser only.
 */
import { DEFAULT_LOOK, WORDS, type Look, type MountId, type RiderId } from "./config";

/** What a run counts. Missions are always "in one run". */
export type Stats = {
  metres: number;
  seeds: number;
  logs: number;
  /** stone arches ducked under */
  branches: number;
  pitted: number;
  crashed: number;
  trapped: number;
  arrowKills: number;
  swordKills: number;
  companions: number;
  /** the longest stretch without losing a heart, m */
  clean: number;
  /** metres ridden after the first sword kill (0 if none yet) */
  afterSword: number;
  /** spring gates ridden through the arch */
  gates: number;
  /** animals and villagers the monsters ate */
  animalsLost: number;
  peopleLost: number;
  /** villages left behind with nobody taken */
  villagesSafe: number;
  /** the mission: souls saved, villages saved and lost, memories found on this ride */
  souls: number;
  villagesSaved: number;
  villagesLost: number;
  memoriesFound: number;
};

export const emptyStats = (): Stats => ({
  metres: 0, seeds: 0, logs: 0, branches: 0, pitted: 0, crashed: 0, trapped: 0,
  arrowKills: 0, swordKills: 0, companions: 0, clean: 0, afterSword: 0,
  gates: 0, animalsLost: 0, peopleLost: 0, villagesSafe: 0,
  souls: 0, villagesSaved: 0, villagesLost: 0, memoriesFound: 0,
});

export type Mission = { stat: keyof Stats; goal: number; text: string };

const m = (stat: keyof Stats, goal: number, text: string): Mission => ({ stat, goal, text });
const n = (x: number) => x.toLocaleString("en-GB");

/** The missions in the order they are handed out; three are open at a time. */
const LIST: Mission[] = [
  m("metres", 500, "Ride 500 m"),
  m("crashed", 1, "Lead a monster into a tree or a rock"),
  m("seeds", 20, "Collect 20 seeds"),
  m("logs", 3, "Jump over 3 fallen trunks"),
  m("pitted", 1, "Lead a monster into a burning pit"),
  m("metres", 1000, "Reach First Green (1,000 m)"),
  m("gates", 1, "Ride through the arch of a spring gate"),
  m("branches", 3, "Duck under 3 stone arches"),
  m("trapped", 1, "Catch a monster in a trap"),
  m("clean", 600, "Ride 600 m without losing a heart"),
  m("arrowKills", 1, "Shoot a monster with an arrow"),
  m("seeds", 60, "Collect 60 seeds"),
  m("pitted", 3, "Lead 3 monsters into pits"),
  m("afterSword", 300, "Use a sword, then survive 300 m more"),
  m("companions", 1, "Find a companion"),
  m("metres", 2000, "Reach Deep Green (2,000 m)"),
  m("logs", 15, "Jump over 15 fallen trunks"),
  m("crashed", 5, "Lead 5 monsters into trees or rocks"),
  m("arrowKills", 2, "Shoot 2 monsters"),
  m("clean", 1500, "Ride 1,500 m without losing a heart"),
  m("trapped", 3, "Catch 3 monsters in traps"),
  m("seeds", 150, "Collect 150 seeds"),
  m("metres", 5000, "Reach Bloom (5,000 m)"),
  m("villagesSafe", 1, "Lead the hunt past a village with nobody taken"),
  m("pitted", 8, "Lead 8 monsters into pits"),
  m("swordKills", 3, "Cut down 3 monsters with a sword"),
  m("metres", 7500, "Ride 7,500 m"),
  m("villagesSafe", 3, "Keep 3 villages safe in one run"),
  m("metres", 10000, "Ride the whole Long Spring (10 km)"),
];

/** After the list runs out, the same kinds come back, harder each round. */
export function missionAt(i: number): Mission {
  if (i < LIST.length) return LIST[i];
  const round = Math.floor((i - LIST.length) / 6) + 2;
  const kinds: Mission[] = [
    m("pitted", 4 * round, `Lead ${4 * round} monsters into pits`),
    m("crashed", 6 * round, `Lead ${6 * round} monsters into trees or rocks`),
    m("seeds", 100 * round, `Collect ${n(100 * round)} seeds`),
    m("clean", 1000 * round, `Ride ${n(1000 * round)} m without losing a heart`),
    m("trapped", 2 * round, `Catch ${2 * round} monsters in traps`),
    m("arrowKills", round, `Shoot ${round} monsters`),
  ];
  return kinds[(i - LIST.length) % kinds.length];
}

export type Settings = {
  slow: boolean;
  visible: boolean;
  lessBlood: boolean;
  calm: boolean;
  sound: boolean;
  /** go full screen when a ride starts */
  full: boolean;
  /** the voice and the drum */
  music: boolean;
  musicVol: number;
  soundVol: number;
};

export type Save = {
  best: number;
  bestMetres: number;
  /** most souls saved on one endless ride */
  bestSouls: number;
  /** missions completed so far = multiplier − 1 (plus daily words) */
  multiplier: number;
  /** the three open missions, as indexes into missionAt */
  open: number[];
  nextMission: number;
  rider: RiderId;
  mount: MountId;
  looks: Record<RiderId, Look>;
  settings: Settings;
  word: { day: string; got: number; done: boolean };
  seenSword: boolean;
  seenMonsters: string[];
  /** obstacles the game has already explained */
  seenKinds: string[];
  wins: number;
  /* the mission */
  /** finished (or skipped) The First Morning */
  tutorialDone: boolean;
  /** the prologue and the codex have been shown once */
  prologueSeen: boolean;
  /** the furthest land reached in the mission (0–3); the endless ride is set there. 4 = the mission is done */
  furthestLand: number;
  /** a fallen Brigid rises again at the start of this land */
  checkpoint: number;
  /** indexes into MEMORIES, in the order found */
  memories: number[];
  /** memories found a second time, which have come back clear */
  clear: number[];
  /** everyone named she has saved, newest last (kept to the last 400) */
  named: string[];
  /** all souls ever saved, and the best ending (souls + reborn) */
  soulsTotal: number;
  bestEnding: number;
  endings: number;
};

const KEY = "long-spring-v2";

export const today = () => new Date().toISOString().slice(0, 10);

export function wordOfDay(day = today()) {
  const d = Math.floor(Date.parse(day) / 86400000);
  return WORDS[((d % WORDS.length) + WORDS.length) % WORDS.length];
}

export function freshSave(calm = false): Save {
  return {
    best: 0,
    bestMetres: 0,
    bestSouls: 0,
    multiplier: 1,
    open: [0, 1, 2],
    nextMission: 3,
    rider: "dryad",
    mount: "elk",
    looks: { ...DEFAULT_LOOK },
    settings: { slow: false, visible: false, lessBlood: false, calm, sound: false, full: false, music: true, musicVol: 0.6, soundVol: 0.8 },
    word: { day: today(), got: 0, done: false },
    seenSword: false,
    seenMonsters: [],
    seenKinds: [],
    wins: 0,
    tutorialDone: false,
    prologueSeen: false,
    furthestLand: 0,
    checkpoint: 0,
    memories: [],
    clear: [],
    named: [],
    soulsTotal: 0,
    bestEnding: 0,
    endings: 0,
  };
}

export function loadSave(): Save {
  const calm = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const base = freshSave(calm);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = { ...base, ...JSON.parse(raw) } as Save;
    s.looks = { ...DEFAULT_LOOK, ...s.looks };
    s.settings = { ...base.settings, ...s.settings };
    if (s.word.day !== today()) s.word = { day: today(), got: 0, done: false };
    return s;
  } catch {
    return base;
  }
}

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode: the game still works, it just forgets */
  }
}
