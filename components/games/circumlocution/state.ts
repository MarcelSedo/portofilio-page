import { CASES } from "@/content/games/circumlocution/cases";
import { DAYS, EPILOGUE, PANCKS_DAYS, REFORM_BONUS, START } from "@/content/games/circumlocution/days";
import type { Case, Choice, Effect, Meter, Need, Outcome } from "@/content/games/circumlocution/types";

export const SAVE_KEY = "circumlocution-v1";
export const PREFS_KEY = "circumlocution-prefs";
export const LAST_DAY = DAYS.length;

export type Screen = "menu" | "gazette" | "morning" | "desk" | "case" | "evening" | "file";
export type Judge = "match" | "differ";

export type Work = { opened?: boolean; searched?: boolean; compared?: Judge; pancks?: boolean; atPancks?: boolean };

export type Decision = { caseId: string; day: number; stamp: string; log: string; ignored?: boolean };

export type Result = { caseId: string; choiceId: string };

export type Game = {
  v: 1;
  screen: Screen;
  day: number;
  hours: number;
  meters: Record<Meter, number>;
  flags: string[];
  counts: Record<string, number>;
  pile: string[];
  done: string[];
  work: Record<string, Work>;
  /** case id → the day it comes back from Mr Pancks */
  deferred: Record<string, number>;
  pancksDay: number;
  current: string | null;
  result: Result | null;
  decisions: Decision[];
  gazette: string[];
  /** headlines from today's stamps, printed tomorrow */
  tomorrow: string[];
  /** Pancks's reports that arrived this morning (case ids) */
  arrived: string[];
};

export const byId: Record<string, Case> = Object.fromEntries(CASES.map((c) => [c.id, c]));
export const dayInfo = (d: number) => DAYS[d - 1];

/* ------------------------------- needs ------------------------------- */
const EVIDENCE = new Set(["records", "match", "differ", "pancks"]);

function rawMet(g: Game, need: string, caseId?: string): boolean {
  const m = /^(\w+)>=(\d+)$/.exec(need);
  if (m) return (g.counts[m[1]] ?? 0) >= Number(m[2]);
  if (EVIDENCE.has(need)) {
    const w = caseId ? g.work[caseId] : undefined;
    if (!w) return false;
    if (need === "records") return !!w.searched;
    if (need === "pancks") return !!w.pancks;
    return w.compared === need;
  }
  return g.flags.includes(need);
}

export function met(g: Game, need: Need, caseId?: string) {
  return need.startsWith("!") ? !rawMet(g, need.slice(1), caseId) : rawMet(g, need, caseId);
}
export const allMet = (g: Game, needs: Need[] | undefined, caseId?: string) => (needs ?? []).every((n) => met(g, n, caseId));
const isEvidence = (n: Need) => EVIDENCE.has(n.replace(/^!/, ""));

export type ChoiceView = { choice: Choice; enabled: boolean; why?: string };

/** Story needs hide a choice; evidence, time and money only grey it out, with a reason. */
export function choiceViews(g: Game, c: Case): ChoiceView[] {
  const out: ChoiceView[] = [];
  for (const ch of c.choices) {
    const story = (ch.needs ?? []).filter((n) => !isEvidence(n));
    if (!allMet(g, story, c.id)) continue;
    const ev = (ch.needs ?? []).filter(isEvidence);
    let why: string | undefined;
    for (const n of ev) {
      if (met(g, n, c.id)) continue;
      const w = g.work[c.id];
      if (n === "records") why = "Search the Records first.";
      else if (n === "pancks") why = "Needs Mr Pancks's report.";
      else why = w?.compared ? "Your note on the signatures says otherwise." : "Compare the signatures first.";
      break;
    }
    if (!why && (ch.cost ?? 0) > g.hours) why = "Not enough hours left today.";
    const spend = -(ch.effect.money ?? 0);
    if (!why && spend > 0 && spend > g.meters.money) why = "The Relief Fund hasn't that much left.";
    out.push({ choice: ch, enabled: !why, why });
  }
  return out;
}

/* ------------------------------- days ------------------------------- */
function apply(g: Game, e: Effect | undefined) {
  if (!e) return;
  for (const k of Object.keys(e) as Meter[]) g.meters[k] += e[k] ?? 0;
}
function setFlags(g: Game, set: string[] | undefined) {
  for (const f of set ?? []) if (!g.flags.includes(f)) g.flags.push(f);
}

function startDay(g: Game, d: number) {
  const info = dayInfo(d);
  g.day = d;
  g.hours = info.hours + (d === LAST_DAY && g.flags.includes("reform") ? REFORM_BONUS : 0);
  g.current = null;
  g.result = null;

  // Mr Pancks comes back
  g.arrived = [];
  const back: string[] = [];
  for (const [id, when] of Object.entries(g.deferred)) {
    if (when !== d) continue;
    const w = (g.work[id] ??= {});
    w.atPancks = false;
    w.pancks = true;
    w.opened = false;
    setFlags(g, byId[id].pancks?.set);
    back.push(id);
    g.arrived.push(id);
    delete g.deferred[id];
  }

  // the morning paper
  const fixed = info.headlines.filter((h) => allMet(g, h.requires));
  for (const h of fixed) {
    apply(g, h.effect);
    setFlags(g, h.set);
  }
  g.gazette = [...fixed.map((h) => h.text), ...g.tomorrow];
  g.tomorrow = [];

  const fresh = CASES.filter((c) => c.day === d && !g.done.includes(c.id) && allMet(g, c.requires)).map((c) => c.id);
  g.pile = [...back, ...fresh];
  g.screen = d === 1 ? "morning" : "gazette";
}

export function newGame(): Game {
  const g: Game = {
    v: 1,
    screen: "morning",
    day: 1,
    hours: 0,
    meters: { ...START },
    flags: [],
    counts: {},
    pile: [],
    done: [],
    work: {},
    deferred: {},
    pancksDay: 0,
    current: null,
    result: null,
    decisions: [],
    gazette: [],
    tomorrow: [],
    arrived: [],
  };
  startDay(g, 1);
  return g;
}

/* ------------------------------ actions ------------------------------ */
const clone = (g: Game): Game => JSON.parse(JSON.stringify(g));

export const openCost = (g: Game, id: string) => (byId[id].quick || g.work[id]?.opened ? 0 : 1);

export function openCase(g0: Game, id: string): Game {
  const g = clone(g0);
  const cost = openCost(g, id);
  if (cost > g.hours) return g0;
  g.hours -= cost;
  (g.work[id] ??= {}).opened = true;
  g.current = id;
  g.result = null;
  g.screen = "case";
  return g;
}

export function searchRecords(g0: Game): Game {
  const id = g0.current;
  if (!id || g0.hours < 1 || g0.work[id]?.searched) return g0;
  const g = clone(g0);
  g.hours -= 1;
  g.work[id].searched = true;
  return g;
}

export function noteSignatures(g0: Game, judge: Judge): Game {
  const id = g0.current;
  if (!id || g0.work[id]?.compared) return g0;
  const g = clone(g0);
  g.work[id].compared = judge;
  return g;
}

export const canPancks = (g: Game, c: Case) =>
  !!c.pancks && PANCKS_DAYS.includes(g.day) && g.pancksDay !== g.day && !g.work[c.id]?.pancks && !g.work[c.id]?.atPancks;

export function sendToPancks(g0: Game): Game {
  const id = g0.current;
  if (!id || !canPancks(g0, byId[id])) return g0;
  const g = clone(g0);
  g.work[id].atPancks = true;
  g.deferred[id] = g.day + 1;
  g.pancksDay = g.day;
  g.pile = g.pile.filter((p) => p !== id);
  g.current = null;
  g.screen = "desk";
  return g;
}

function settle(g: Game, c: Case, o: Outcome, stamp: string, ignored = false) {
  apply(g, o.effect);
  setFlags(g, o.set);
  if (o.count) g.counts[o.count] = (g.counts[o.count] ?? 0) + 1;
  if (o.gazette) g.tomorrow.push(o.gazette);
  g.decisions.push({ caseId: c.id, day: g.day, stamp, log: o.log, ignored });
  g.done.push(c.id);
  g.pile = g.pile.filter((p) => p !== c.id);
}

export function decide(g0: Game, choiceId: string): Game {
  const id = g0.current;
  if (!id) return g0;
  const c = byId[id];
  const view = choiceViews(g0, c).find((v) => v.choice.id === choiceId);
  if (!view?.enabled) return g0;
  const g = clone(g0);
  g.hours -= view.choice.cost ?? 0;
  settle(g, c, view.choice, view.choice.stamp);
  g.result = { caseId: id, choiceId };
  return g;
}

export function backToDesk(g0: Game): Game {
  const g = clone(g0);
  g.current = null;
  g.result = null;
  g.screen = "desk";
  return g;
}

export function closeDay(g0: Game): Game {
  const g = clone(g0);
  for (const id of [...g.pile]) settle(g, byId[id], byId[id].ignored, "LEFT IN THE PILE", true);
  g.current = null;
  g.result = null;
  g.screen = "evening";
  return g;
}

export function nextDay(g0: Game): Game {
  const g = clone(g0);
  if (g.day >= LAST_DAY) {
    g.screen = "file";
    return g;
  }
  startDay(g, g.day + 1);
  return g;
}

export const goTo = (g0: Game, screen: Screen): Game => ({ ...g0, screen });

export function epilogue(g: Game) {
  return EPILOGUE.filter((e) => allMet(g, e.requires)).map((e) => e.text);
}

/** clock shown on the desk: 9 o'clock at the start, 5 o'clock at the end */
export function clock(g: Game) {
  const total = dayInfo(g.day).hours + (g.day === LAST_DAY && g.flags.includes("reform") ? REFORM_BONUS : 0);
  const h = 9 + (total - g.hours);
  const twelve = h > 12 ? h - 12 : h;
  return { label: `${twelve} o'clock`, left: g.hours, total };
}

/* ------------------------------ storage ------------------------------ */
export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const g = JSON.parse(raw) as Game;
    return g?.v === 1 ? g : null;
  } catch {
    return null;
  }
}
export function saveGame(g: Game) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(g));
  } catch {
    /* private mode: the game still works, it just won't remember */
  }
}
export function clearGame() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}
export function loadSound(): boolean {
  try {
    return localStorage.getItem(PREFS_KEY) !== "mute";
  } catch {
    return true;
  }
}
export function saveSound(on: boolean) {
  try {
    localStorage.setItem(PREFS_KEY, on ? "on" : "mute");
  } catch {
    /* ignore */
  }
}
