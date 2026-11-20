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
};

export type Person = { id: string; name: string; short: string; role: string; sex: "f" | "m" };

/** A line someone will say once you know any one of `needs`. */
export type Line = { clue: string; needs?: string[] };
/** Someone you can talk to. `wait` is what they say (with Emma's aside) while their next line is locked. */
export type Speaker = { who: string; lines: Line[]; wait: string };
/** Something to look at. Hidden until you know any one of `needs`. */
export type Item = { id: string; label: string; clue: string; needs?: string[] };

export type House = {
  id: string;
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
};
