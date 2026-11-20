import type { House, Item, Progress, Scenario, Speaker } from "@/content/games/emma/types";

export type Screen = "menu" | "intro" | "village" | "house" | "ball" | "board" | "ending";
export type Settings = { bigText: boolean; calm: boolean };

export type GameState = {
  v: 3;
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
  settings: Settings;
};

const SAVE_KEY = (id: string) => `emma-bramblewick-v3-${id}`;
const PREFS_KEY = "emma-bramblewick-prefs";

export function newGame(sc: Scenario, settings?: Settings): GameState {
  return {
    v: 3,
    scenario: sc.id,
    screen: "intro",
    house: null,
    node: "hartfield",
    found: [...sc.instincts],
    read: [],
    bookOpened: false,
    matches: {},
    proofs: {},
    attempts: 0,
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
    return s && s.v === 3 ? s : null;
  }, null);
}
export function saveGame(s: GameState) {
  safe(() => localStorage.setItem(SAVE_KEY(s.scenario), JSON.stringify(s)), undefined);
}
export function clearGame(id: Scenario["id"]) {
  safe(() => localStorage.removeItem(SAVE_KEY(id)), undefined);
}

export type Prefs = { settings: Settings; tutorialDone: boolean };
export function loadPrefs(): Prefs {
  return safe(
    () => ({ settings: { bigText: false, calm: false }, tutorialDone: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}") }),
    { settings: { bigText: false, calm: false }, tutorialDone: false },
  );
}
export function savePrefs(p: Partial<Prefs>) {
  safe(() => localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadPrefs(), ...p })), undefined);
}

const knows = (s: GameState, ids?: string[]) => !ids || ids.some((id) => s.found.includes(id));

/** What happens when you talk to someone: a new clue, a hint to look elsewhere, or nothing new. */
export type Reply = { kind: "clue"; clue: string } | { kind: "wait"; text: string } | { kind: "done"; clue: string };

export function reply(s: GameState, sp: Speaker): Reply {
  const open = sp.lines.filter((l) => !s.found.includes(l.clue));
  const next = open.find((l) => knows(s, l.needs));
  if (next) return { kind: "clue", clue: next.clue };
  if (open.length && sp.wait) return { kind: "wait", text: sp.wait };
  return { kind: "done", clue: sp.lines[sp.lines.length - 1].clue };
}
export const hasNews = (s: GameState, sp: Speaker) => reply(s, sp).kind === "clue";
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
  const title =
    total >= max ? "The most celebrated matchmaker in the county"
      : total >= max * 0.75 ? "A very tolerable matchmaker"
        : total >= max * 0.4 ? "Promising, but a little impulsive"
          : "Right in the end, after a good deal of guessing";
  return { results, proofs, tries, total, max, title };
}
