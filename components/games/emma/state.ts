import type { House, Item, Line, Progress, Scenario, Speaker, Spot } from "@/content/games/emma/types";
import { chainsOf, pickCast } from "./cast";

export type Screen = "menu" | "intro" | "village" | "house" | "ball" | "board" | "finale" | "ending";
export type Settings = { bigText: boolean; calm: boolean };

/** The announcement at the ball, one couple at a time. */
export type Finale = { order: string[]; step: number; right: Record<string, boolean> };

export type GameState = {
  v: 4;
  /** the four love stories told this season, and one more couple only there to confuse */
  cast?: string[];
  decoy?: string | null;
  /** lady → which of her questions Emma asks, and how many clues you had when you last got it wrong */
  quiz: Record<string, { q: number; wrongAt?: number; passed?: boolean }>;
  finale: Finale | null;
  /** cameo lines already heard: "who:index" */
  heard: string[];
  scenario: Scenario["id"];
  screen: Screen;
  house: string | null;
  /** where Emma stands on the map */
  node: string;
  /** clue ids in the order they were found */
  found: string[];
  /** clue ids already looked at in the book */
  read: string[];
  bookOpened: boolean;
  /** woman → man */
  matches: Record<string, string>;
  /** woman → the clue chosen as proof of her match */
  proofs: Record<string, string>;
  /** how many times the engagements were announced */
  attempts: number;
  /** favours asked, things picked up, puzzles solved */
  flags: string[];
  /** things in Emma's pocket */
  pocket: string[];
  sound: boolean;
  settings: Settings;
};

const SAVE_KEY = (id: string) => `emma-bramblewick-v4-${id}`;
/** how many new clues you must find before Emma asks a question again */
export const QUIZ_COOLDOWN = 2;
const PREFS_KEY = "emma-bramblewick-prefs";

export function newGame(sc: Scenario, settings?: Settings): GameState {
  const { cast, decoy } = sc.chains ? pickCast(sc) : { cast: undefined, decoy: undefined };
  const quiz: GameState["quiz"] = {};
  for (const [w, qs] of Object.entries(sc.questions ?? {})) quiz[w] = { q: Math.floor(Math.random() * qs.length) };
  // Emma's instincts, only about the stories being told
  const told = (id: string) => {
    const c = sc.clues.find((x) => x.id === id);
    return !cast || !c || chainsOf(c).every((ch) => cast.includes(ch));
  };
  return {
    v: 4,
    cast,
    decoy,
    quiz,
    finale: null,
    heard: [],
    scenario: sc.id,
    screen: "intro",
    house: null,
    node: "hartfield",
    found: sc.instincts.filter(told),
    read: [],
    bookOpened: false,
    matches: {},
    proofs: {},
    attempts: 0,
    flags: [],
    pocket: [],
    sound: true,
    settings: settings ?? loadPrefs().settings,
  };
}

const safe = <T,>(f: () => T, fallback: T) => {
  try {
    return f();
  } catch {
    return fallback;
  }
};
export function loadGame(id: Scenario["id"]): GameState | null {
  return safe(() => {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY(id)) ?? "null") as GameState | null;
    return s && s.v === 4 ? (Object.assign({ flags: [], pocket: [], sound: true, quiz: {}, finale: null, heard: [] }, s) as GameState) : null;
  }, null);
}
export function saveGame(s: GameState) {
  safe(() => localStorage.setItem(SAVE_KEY(s.scenario), JSON.stringify(s)), undefined);
}
export function clearGame(id: Scenario["id"]) {
  safe(() => localStorage.removeItem(SAVE_KEY(id)), undefined);
}

export type Prefs = { settings: Settings; tutorialDone: boolean; lang?: "en" | "sk" };
export function loadPrefs(): Prefs {
  return safe(
    () => ({ settings: { bigText: false, calm: false }, tutorialDone: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") }),
    { settings: { bigText: false, calm: false }, tutorialDone: false },
  );
}
export function savePrefs(p: Partial<Prefs>) {
  safe(() => localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadPrefs(), ...p })), undefined);
}

export const knows = (s: GameState, ids?: string[]) => !ids || ids.some((id) => s.found.includes(id) || s.flags.includes(id));

/** What happens when you talk to someone. */
export type Reply =
  | { kind: "clue"; clue: string; uses?: string }
  | { kind: "quest"; flag: string; text: string }
  | { kind: "give"; item: string; text: string }
  | { kind: "wait"; text: string }
  | { kind: "done"; clue?: string };

const lineDone = (s: GameState, l: Line) =>
  l.clue ? s.found.includes(l.clue) : l.quest ? s.flags.includes(l.quest.flag) : l.give ? s.flags.includes(`got-${l.give.item}`) : true;

export function reply(s: GameState, sp: Speaker): Reply {
  const open = sp.lines.filter((l) => !lineDone(s, l));
  for (const l of open) {
    if (!knows(s, l.needs)) continue;
    if (l.item && !s.pocket.includes(l.item)) continue;
    if (l.quest) return { kind: "quest", flag: l.quest.flag, text: l.quest.text };
    if (l.give) return { kind: "give", item: l.give.item, text: l.give.text };
    if (l.clue) return { kind: "clue", clue: l.clue, uses: l.item };
  }
  // waiting for a thing you were asked to fetch
  const waiting = open.find((l) => l.item && knows(s, l.needs) && l.remind);
  if (waiting) return { kind: "wait", text: waiting.remind! };
  // a locked line: their usual words, then Emma's hint about where to look
  const locked = open.find((l) => l.hint && !knows(s, l.needs));
  if (open.length && sp.wait) return { kind: "wait", text: locked ? `${sp.wait} Emma: ${locked.hint}` : sp.wait };
  if (open.length && locked) return { kind: "wait", text: `Emma: ${locked.hint}` };
  const last = [...sp.lines].reverse().find((l) => l.clue);
  return { kind: "done", clue: last?.clue };
}
export const hasNews = (s: GameState, sp: Speaker) => ["clue", "quest", "give"].includes(reply(s, sp).kind);
export const isOpen = (s: GameState, h: House) => !h.locked || knows(s, h.locked.needs);
export const isVisible = (s: GameState, it: Item) => knows(s, it.needs);

export const progress = (s: GameState): Progress => ({
  found: s.found,
  screen: s.screen,
  house: s.house,
  bookOpened: s.bookOpened,
  matches: s.matches,
  proofs: s.proofs,
});

/** How many of the chosen matches are right (said aloud only as a number). */
export function rightMatches(sc: Scenario, s: GameState) {
  return Object.values(sc.pairs).filter((p) => s.matches[p.woman] === p.man).length;
}

export function score(sc: Scenario, s: GameState) {
  const clue = (id: string) => sc.clues.find((c) => c.id === id);
  const results = Object.entries(sc.pairs).map(([pid, p]) => {
    const proofId = s.proofs[p.woman];
    const proof = proofId ? clue(proofId) : undefined;
    const proved = !!proof && proof.truth && proof.supports === pid;
    return { pid, woman: p.woman, man: p.man, proofId, proved };
  });
  const n = results.length;
  const proofs = results.filter((r) => r.proved).length;
  const tries = s.attempts <= 1 ? n : s.attempts === 2 ? Math.ceil(n / 2) : s.attempts === 3 ? 1 : 0;
  const total = proofs + tries;
  const max = n * 2;
  /** 0 = best; the words for each rank are in i18n.tsx (ending.ranks) */
  const rank = total >= max ? 0 : total >= max * 0.75 ? 1 : total >= max * 0.4 ? 2 : 3;
  return { results, proofs, tries, total, max, rank };
}

/** A spot on the map shows up once you know about it, and stays until you've used it. */
export const spotVisible = (s: GameState, sp: Spot) =>
  knows(s, sp.needs) && !(sp.clue && s.found.includes(sp.clue)) && !(sp.give && s.flags.includes(`got-${sp.give.item}`));

/** How far each love story has got: true clues that prove it, found so far. */
export function storyProgress(sc: Scenario, s: GameState) {
  return Object.entries(sc.pairs).map(([pid, p]) => {
    const all = sc.clues.filter((c) => c.supports === pid && c.truth).map((c) => c.id);
    const got = all.filter((id) => s.found.includes(id)).length;
    return { pid, woman: p.woman, got, total: all.length };
  });
}

/* ------------------------------------------------------------------ */
/* questions before announcing                                         */
/* ------------------------------------------------------------------ */

/** the ladies whose stories are told this season, in the order Emma asks about them */
export const quizLadies = (sc: Scenario) => Object.values(sc.pairs).map((p) => p.woman).filter((w) => sc.questions?.[w]);

/** a question is locked for a while after a wrong answer: find more clues first */
export const quizLocked = (s: GameState, w: string) => {
  const e = s.quiz[w];
  return !!e && e.wrongAt !== undefined && s.found.length < e.wrongAt + QUIZ_COOLDOWN;
};
export const quizDone = (sc: Scenario, s: GameState) => quizLadies(sc).every((w) => s.quiz[w]?.passed);

export function answerQuiz(sc: Scenario, s: GameState, answers: Record<string, number>): { state: GameState; wrong: string[] } {
  const quiz = { ...s.quiz };
  const wrong: string[] = [];
  for (const w of quizLadies(sc)) {
    const e = quiz[w] ?? { q: 0 };
    if (e.passed || quizLocked(s, w) || answers[w] === undefined) continue;
    const q = sc.questions![w][e.q % sc.questions![w].length];
    if (answers[w] === q.answer) quiz[w] = { ...e, passed: true, wrongAt: undefined };
    else {
      // next time, the other question
      quiz[w] = { q: e.q + 1, wrongAt: s.found.length };
      wrong.push(w);
    }
  }
  return { state: { ...s, quiz }, wrong };
}

/* ------------------------------------------------------------------ */
/* the finale: announce one couple at a time                           */
/* ------------------------------------------------------------------ */

export function startFinale(sc: Scenario, s: GameState): GameState {
  const order = Object.keys(s.matches).filter((w) => s.matches[w]);
  const right: Record<string, boolean> = {};
  for (const w of order) right[w] = Object.values(sc.pairs).some((p) => p.woman === w && p.man === s.matches[w]);
  return { ...s, screen: "finale", attempts: s.attempts + 1, finale: { order, step: 0, right } };
}

/** after the last couple: everyone right → the ending; otherwise the wrong ones are undone */
export function endFinale(s: GameState): GameState {
  const f = s.finale;
  if (!f) return s;
  const allRight = f.order.length > 0 && f.order.every((w) => f.right[w]);
  if (allRight) return { ...s, screen: "ending" };
  const matches = { ...s.matches };
  const proofs = { ...s.proofs };
  for (const w of f.order) if (!f.right[w]) (delete matches[w], delete proofs[w]);
  return { ...s, screen: "board", matches, proofs, finale: null };
}

/* ------------------------------------------------------------------ */
/* Austen's own people, out for a walk                                 */
/* ------------------------------------------------------------------ */

export function cameoMoment(sc: Scenario, s: GameState) {
  const right = s.finale ? Object.values(s.finale.right).filter(Boolean).length : 0;
  const moments = new Set<string>(["start"]);
  if (s.found.length >= 10) moments.add("found10");
  if (s.found.length >= 25) moments.add("found25");
  if (s.attempts > 0 && s.screen !== "ending") moments.add("wrong");
  if (right > 0 || Object.keys(s.matches).length >= 2) moments.add("matched");
  if (s.screen === "ending") moments.add("finale");
  return moments;
}

/** the next thing a cameo says: something new for this moment first, otherwise round again */
export function cameoLine(sc: Scenario, s: GameState, who: string): { text: string; key: string } | null {
  const c = sc.cameos?.find((x) => x.id === who);
  if (!c) return null;
  const now = cameoMoment(sc, s);
  const ok = c.lines.map((l, i) => ({ l, i })).filter(({ l }) => !l.when || now.has(l.when));
  const fresh = ok.filter(({ i }) => !s.heard.includes(`${who}:${i}`));
  // the newest moment first
  const pick = (fresh.length ? fresh : ok).sort((a, b) => (b.l.when ? 1 : 0) - (a.l.when ? 1 : 0) || b.i - a.i)[0];
  return pick ? { text: pick.l.text, key: `${who}:${pick.i}` } : null;
}
