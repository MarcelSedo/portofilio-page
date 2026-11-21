// Shared shapes for both scenarios (the tutorial and the season).

/** What a clue tells you about, from each little love story. */
export type Category = "heart" | "past" | "obstacle" | "secret" | "rumour" | "instinct";

export const CATEGORY: Record<Category, { label: string; icon: string; note: string }> = {
  heart: { label: "Feelings", icon: "♥", note: "Who loves whom, or doesn't." },
  past: { label: "The past", icon: "⌛", note: "What happened before this spring." },
  obstacle: { label: "Obstacle", icon: "✕", note: "What stands in the way." },
  secret: { label: "Secret", icon: "✉", note: "Something someone is hiding." },
  rumour: { label: "Rumour", icon: "“”", note: "Gossip. It may be true, or not." },
  instinct: { label: "Emma's instinct", icon: "★", note: "Emma is never wrong. Emma says." },
};

export type Clue = {
  id: string;
  text: string;
  cat: Category;
  /** who the clue is about */
  about: string[];
  /** is it actually true? revealed only at the end */
  truth: boolean;
  /** a true clue that proves this match */
  supports?: string;
  /** where Emma thinks you should go next */
  next?: string;
  /** the love stories this clue belongs to; it only exists if all of them are in this season's cast.
   *  Left out, it is worked out from `supports` or the id's letter (a-, b-, …). */
  chain?: string[];
};

export type Person = {
  id: string;
  name: string;
  short: string;
  role: string;
  sex: "f" | "m";
  /** which love story they belong to */
  chain?: string;
  /** what they say in a season when their story isn't being told (they're only a distraction) */
  idle?: string;
};

/**
 * A line someone will say once you know any one of `needs` (clue ids or flags).
 * - `clue`: they tell you something.
 * - `quest`: they ask you a favour (sets a flag); `remind` is said while you haven't done it.
 * - `item`: they need this thing from your pocket before they say `clue` (it is used up).
 * - `give`: they hand you a thing for your pocket.
 */
export type Line = {
  clue?: string;
  needs?: string[];
  quest?: { flag: string; text: string };
  item?: string;
  remind?: string;
  give?: { item: string; text: string };
  /** Emma's hint, said after `wait` while this line is still locked */
  hint?: string;
  /** the love story a quest or gift belongs to */
  chain?: string;
};
/** Someone you can talk to. `wait` is what they say while their next line is locked; the line's `hint` follows it. */
export type Speaker = { who: string; lines: Line[]; wait: string; chain?: string };
/** Something to look at. Hidden until you know any one of `needs`. With `puzzle`, you must solve it first. */
export type Item = { id: string; label: string; clue: string; needs?: string[]; puzzle?: string };

/** A charade (solve the word) or a torn letter (put the strips in order). Solving gives `clue`. */
export type Puzzle =
  | { id: string; kind: "charade"; title: string; intro: string; verse: string[]; answer: string; extra: string; clue: string }
  | { id: string; kind: "letter"; title: string; intro: string; strips: string[]; clue: string };

/** A place on the village map that only matters once you know something: a meeting, a lost thing. */
export type Spot = {
  id: string;
  label: string;
  needs: string[];
  clue?: string;
  give?: { item: string; text: string };
  /** little people standing there once it's visible: [sprite, x, y] in map pixels */
  people?: [string, number, number][];
};

export type House = {
  id: string;
  /** whose love story lives here; in a season without it, the house is shut */
  chain?: string;
  /** what the door says then */
  away?: string;
  name: string;
  blurb: string;
  people: Speaker[];
  items: Item[];
  /** shut until you know any one of `needs` */
  locked?: { needs: string[]; text: string };
};

export type Ball = {
  name: string;
  blurb: string;
  guests: Speaker[];
  watch: { id: string; label: string; clue: string }[];
  items: Item[];
};

/** What the tutorial's steps can look at. */
export type Progress = {
  found: string[];
  screen: string;
  house: string | null;
  bookOpened: boolean;
  matches: Record<string, string>;
  proofs: Record<string, string>;
};

export type Target =
  | { kind: "place" | "folk" | "person" | "item"; id: string }
  | { kind: "book" | "board" | "proof" | "announce" };

export type Step = { say: string; target?: Target; done: (p: Progress) => boolean };

/** A question Emma asks about a lady before you may announce: you must have read the story. */
export type Question = { q: string; options: [string, string, string]; answer: 0 | 1 | 2 };

/** An Austen character out for a walk: they say lines straight from the books. `when` picks the moment. */
export type CameoLine = { text: string; when?: "start" | "matched" | "wrong" | "found10" | "found25" | "finale" };
export type Cameo = { id: string; name: string; book: string; lines: CameoLine[] };

export type Scenario = {
  id: "tutorial" | "season";
  title: string;
  map: "village" | "lane";
  mapName: string;
  people: Person[];
  speakers: Record<string, { name: string; role: string }>;
  pairs: Record<string, { woman: string; man: string }>;
  clues: Clue[];
  instincts: string[];
  green: Speaker[];
  houses: House[];
  ball?: Ball;
  intro: string[];
  letters: Record<string, { from: string; good: string }>;
  steps?: Step[];
  puzzles?: Puzzle[];
  spots?: Spot[];
  /** things you can carry */
  things?: Record<string, { name: string; icon: string }>;
  /** all love stories that can be told; each season picks `castSize` of them */
  chains?: Record<string, { title: string; plot: string; reveal: string }>;
  castSize?: number;
  questions?: Record<string, Question[]>;
  cameos?: Cameo[];
};
