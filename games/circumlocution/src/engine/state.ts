import { CASES } from "../content/cases";
import { PINS, STRANDS, type StrandState } from "../content/board";
import { AUDITOR, DAYS, DISMISS_AT, EPILOGUE, HOUSE, PANCKS_DAYS, REFORM_BONUS, START } from "../content/days";
import type { Case, Choice, Effect, Meter, Need, Outcome } from "../content/types";

export const SAVE_KEY = "circumlocution-v2";
export const PREFS_KEY = "circumlocution-prefs";
export const LAST_DAY = DAYS.length;

export type Screen = "menu" | "gazette" | "morning" | "desk" | "case" | "evening" | "night" | "over" | "file";
export type Judge = "match" | "differ";
export type Over = "dismissed" | "evicted" | "alone";

export type Work = { opened?: boolean; searched?: boolean; compared?: Judge; pancks?: boolean; atPancks?: boolean };
export type Decision = { caseId: string; day: number; stamp: string; log: string; ignored?: boolean };
export type Result = { caseId: string; choiceId: string };
export type Risk = { caseId: string; day: number; finding: string; safe: boolean; audited?: boolean };
export type Home = { hungry: number; cold: number; arrears: number; ill: string | null; illNights: number };
export type Night = { wage: number; spent: number; notes: string[] };
export type Bills = { rent: boolean; food: boolean; coal: boolean; medicine: boolean };

export type Game = {
  v: 2;
  screen: Screen;
  day: number;
  hours: number;
  meters: Record<Meter, number>;
  purse: number;
  home: Home;
  night: Night | null;
  over: Over | null;
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
  risks: Risk[];
  audit: { text: string; ok: boolean } | null;
  gazette: string[];
  /** headlines from today's stamps, printed tomorrow */
  tomorrow: string[];
  /** Pancks's reports that arrived this morning (case ids) */
  arrived: string[];
  /** the game as it was this morning, for "try the day again" */
  snapshot: string | null;
  /** strings on the corkboard you have already looked at */
  boardSeen: string[];
};

export const byId: Record<string, Case> = Object.fromEntries(CASES.map((c) => [c.id, c]));
export const dayInfo = (d: number) => DAYS[d - 1];
export const wage = (g: Game) => HOUSE.wage(g.meters.favour);

/* ------------------------------- needs ------------------------------- */
const EVIDENCE = new Set(["records", "match", "differ", "pancks"]);

function rawMet(g: Game, need: string, caseId?: string): boolean {
  const at = /^(seen|records|pancks)@(\w+)$/.exec(need);
  if (at) {
    const w = g.work[at[2]];
    if (at[1] === "seen") return !!w?.opened || g.done.includes(at[2]);
    if (at[1] === "records") return !!w?.searched;
    return !!w?.pancks;
  }
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
    let why: string | undefined;
    for (const n of (ch.needs ?? []).filter(isEvidence)) {
      if (met(g, n, c.id)) continue;
      const w = g.work[c.id];
      if (n === "records") why = "Search the Records first.";
      else if (n === "pancks") why = "Needs Mr Pancks's report.";
      else why = w?.compared ? "Your note on the signatures says otherwise." : "Compare the signatures first.";
      break;
    }
    if (!why && (ch.cost ?? 0) > g.hours) why = "Not enough hours left today.";
    const spend = -(ch.effect.money ?? 0);
    if (!why && spend > 0 && spend > g.meters.money) why = `The Relief Fund has only £${g.meters.money} left.`;
    if (!why && (ch.purse ?? 0) < 0 && -(ch.purse ?? 0) > g.purse) why = `You have only ${g.purse}s in your purse.`;
    out.push({ choice: ch, enabled: !why, why });
  }
  return out;
}

/* ------------------------------- days ------------------------------- */
function apply(g: Game, e: Effect | undefined) {
  if (!e) return;
  for (const k of Object.keys(e) as Meter[]) g.meters[k] += e[k] ?? 0;
  if (g.meters.money < 0) g.meters.money = 0;
  if (g.meters.favour <= DISMISS_AT && !g.over) g.over = "dismissed";
}
function setFlags(g: Game, set: string[] | undefined) {
  for (const f of set ?? []) if (!g.flags.includes(f)) g.flags.push(f);
}

function runAudit(g: Game) {
  const open = g.risks.filter((r) => !r.audited);
  const pick = open.find((r) => !r.safe) ?? open[0];
  if (!pick) {
    g.audit = { text: "Mr Rugg goes through your stamps and finds nothing irregular. He seems disappointed.", ok: true };
    return;
  }
  pick.audited = true;
  const who = byId[pick.caseId].who;
  if (pick.safe) {
    apply(g, { favour: 1 });
    g.audit = { text: `Mr Rugg checks your stamp for ${who}: ${pick.finding}. The evidence is on file. "Irregular, but documented. Hm." Favour +1.`, ok: true };
  } else {
    apply(g, { favour: -3 });
    g.audit = { text: `Mr Rugg checks your stamp for ${who} and finds ${pick.finding}, with nothing on file to explain it. A black mark: favour −3.`, ok: false };
  }
}

function startDay(g: Game, d: number) {
  const info = dayInfo(d);
  g.day = d;
  g.hours = info.hours + (d === LAST_DAY && g.flags.includes("reform") ? REFORM_BONUS : 0);
  g.current = null;
  g.result = null;
  g.audit = null;
  g.night = null;

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

  // the morning paper, then the auditor
  const fixed = info.headlines.filter((h) => allMet(g, h.requires));
  for (const h of fixed) {
    apply(g, h.effect);
    setFlags(g, h.set);
  }
  g.gazette = [...fixed.map((h) => h.text), ...g.tomorrow];
  g.tomorrow = [];
  if (info.audit) runAudit(g);

  const fresh = CASES.filter((c) => c.day === d && !g.done.includes(c.id) && allMet(g, c.requires)).map((c) => c.id);
  g.pile = [...back, ...fresh];
  g.screen = g.over ? "over" : d === 1 ? "morning" : "gazette";
  g.snapshot = null;
  g.snapshot = JSON.stringify(g);
}

export function newGame(): Game {
  const g: Game = {
    v: 2,
    screen: "morning",
    day: 1,
    hours: 0,
    meters: { ...START },
    purse: HOUSE.purse,
    home: { hungry: 0, cold: 0, arrears: 0, ill: null, illNights: 0 },
    night: null,
    over: null,
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
    risks: [],
    audit: null,
    gazette: [],
    tomorrow: [],
    arrived: [],
    snapshot: null,
    boardSeen: [],
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
  !!c.pancks && PANCKS_DAYS.includes(g.day) && g.pancksDay !== g.day && g.purse >= HOUSE.pancks && !g.work[c.id]?.pancks && !g.work[c.id]?.atPancks;

export function sendToPancks(g0: Game): Game {
  const id = g0.current;
  if (!id || !canPancks(g0, byId[id])) return g0;
  const g = clone(g0);
  g.purse -= HOUSE.pancks;
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
  g.purse += o.purse ?? 0;
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
  const ch = view.choice;
  g.hours -= ch.cost ?? 0;
  if (ch.risky) g.risks.push({ caseId: id, day: g.day, finding: ch.risky.finding, safe: !!ch.risky.safeWith && allMet(g, ch.risky.safeWith, id) });
  settle(g, c, ch, ch.stamp);
  g.result = { caseId: id, choiceId };
  return g;
}

/** after the stamp: back to the pile, or out of the building */
export function backToDesk(g0: Game): Game {
  const g = clone(g0);
  g.current = null;
  g.result = null;
  g.screen = g.over ? "over" : "desk";
  return g;
}

export function closeDay(g0: Game): Game {
  const g = clone(g0);
  for (const id of [...g.pile]) settle(g, byId[id], byId[id].ignored, "LEFT IN THE PILE", true);
  g.current = null;
  g.result = null;
  g.screen = g.over ? "over" : "evening";
  return g;
}

export function billsFor(g: Game) {
  const list: { key: keyof Bills; label: string; cost: number; note: string }[] = [
    { key: "rent", label: "Rent", cost: HOUSE.rent, note: g.home.arrears ? "Already one night behind. Another, and the landlord puts you out." : "Due every night." },
    { key: "food", label: "Food", cost: HOUSE.food, note: g.home.hungry ? "They went hungry last night." : "Bread, dripping, tea." },
    { key: "coal", label: "Coal", cost: HOUSE.coal, note: g.home.cold ? "The room was cold last night." : "A November fire." },
  ];
  if (g.home.ill) list.push({ key: "medicine", label: "Medicine", cost: HOUSE.medicine, note: `For ${g.home.ill}. ${g.home.illNights ? "No better since last night." : "Fever."}` });
  return list;
}

/** pay the bills at home, see what the night brings */
export function goToBed(g0: Game, pay: Bills): Game {
  const g = clone(g0);
  const earned = wage(g);
  g.purse += earned;
  const notes: string[] = [];
  let spent = 0;
  const payIf = (want: boolean, cost: number) => {
    if (want && g.purse >= cost) {
      g.purse -= cost;
      spent += cost;
      return true;
    }
    return false;
  };
  const [kid1, kid2] = HOUSE.kids;

  // medicine first, for whoever was already ill
  if (g.home.ill) {
    if (payIf(pay.medicine, HOUSE.medicine)) {
      notes.push(`${g.home.ill} sleeps through the night. The fever has broken.`);
      g.home.ill = null;
      g.home.illNights = 0;
    } else {
      g.home.illNights += 1;
      notes.push(`${g.home.ill} is worse. ${HOUSE.wife} sits up all night.`);
      if (g.home.illNights >= 2) g.over = g.over ?? "alone";
    }
  }
  if (payIf(pay.rent, HOUSE.rent)) g.home.arrears = 0;
  else {
    g.home.arrears += 1;
    notes.push(g.home.arrears >= 2 ? "The landlord comes with two men and a cart." : "The landlord knocks, and says he'll come back tomorrow.");
    if (g.home.arrears >= 2) g.over = g.over ?? "evicted";
  }
  if (payIf(pay.food, HOUSE.food)) g.home.hungry = 0;
  else {
    g.home.hungry += 1;
    notes.push("Supper is bread and water. The children don't complain, which is worse.");
  }
  if (payIf(pay.coal, HOUSE.coal)) g.home.cold = 0;
  else {
    g.home.cold += 1;
    notes.push("No fire. You all sleep in your coats.");
  }

  // new illness
  if (!g.home.ill && !g.over) {
    if (g.flags.includes("jo_home") && !g.flags.includes("jo_fever")) {
      g.flags.push("jo_fever");
      g.home.ill = kid2;
      g.home.illNights = 0;
      notes.push(`Jo sleeps by your fire and is better by morning. But ${kid2} wakes up burning. It's the same fever.`);
    } else if (g.home.hungry >= 2 || g.home.cold >= 2) {
      g.home.ill = kid1;
      g.home.illNights = 0;
      notes.push(`${kid1} has caught a chill and a fever with it.`);
    }
  }
  if (!notes.length) notes.push(`${HOUSE.wife} has kept supper warm. The children are asleep. A quiet night.`);
  g.night = { wage: earned, spent, notes };
  g.screen = g.over ? "over" : "night";
  return g;
}

export function nextDay(g0: Game): Game {
  const g = clone(g0);
  if (g.over) {
    g.screen = "over";
    return g;
  }
  if (g.day >= LAST_DAY) {
    g.screen = "file";
    return g;
  }
  startDay(g, g.day + 1);
  return g;
}

/** "Try the day again": back to this morning */
export function retryDay(g0: Game): Game | null {
  if (!g0.snapshot) return null;
  const g = JSON.parse(g0.snapshot) as Game;
  g.snapshot = g0.snapshot;
  return g;
}

export const goTo = (g0: Game, screen: Screen): Game => ({ ...g0, screen });

export function epilogue(g: Game) {
  return EPILOGUE.filter((e) => allMet(g, e.requires)).map((e) => e.text);
}

export function homeLine(g: Game) {
  if (g.home.ill) return `${g.home.ill} is still ill at home.`;
  if (g.home.hungry || g.home.cold) return "Your family got through the week, cold and hungry some nights.";
  return "Your family ate every night and had a fire. In that street, that is a lot.";
}

export const auditor = AUDITOR;

/* ------------------------------ corkboard ------------------------------ */
export type BoardStrand = { id: string; a: string; b: string; label: string; state: StrandState | "plain"; note?: string; fresh: boolean };

export function board(g: Game) {
  const strands: BoardStrand[] = STRANDS.filter((s) => allMet(g, s.reveal)).map((s) => {
    const st = s.states?.find((x) => allMet(g, x.when));
    return { id: s.id, a: s.a, b: s.b, label: s.label, state: st?.state ?? "plain", note: st?.note, fresh: !g.boardSeen.includes(s.id) };
  });
  const onBoard = new Set<string>();
  for (const s of strands) {
    onBoard.add(s.a);
    onBoard.add(s.b);
  }
  for (const p of PINS) if (p.caseId && met(g, `seen@${p.caseId}`)) onBoard.add(p.id);
  const pins = PINS.filter((p) => onBoard.has(p.id));
  return { pins, strands, fresh: strands.filter((s) => s.fresh).length };
}

export function lookAtBoard(g0: Game): Game {
  const ids = board(g0).strands.map((s) => s.id);
  if (ids.every((id) => g0.boardSeen.includes(id))) return g0;
  return { ...g0, boardSeen: ids };
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
    if (g?.v !== 2) return null;
    g.boardSeen ??= [];
    return g;
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
