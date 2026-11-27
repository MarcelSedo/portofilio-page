"use client";

/**
 * Time Traveller: a timeline game of British culture (version 2).
 *
 * Drop-in replacement for components/games/TimeTraveller.tsx: same export name, same data
 * (@/content/games/britain) and the same pixel pictures (./cardArt). Styles and fonts live in this file,
 * so app/time-traveller.css is no longer needed for the game.
 *
 * Three modes:
 *  - Catalogue: put cards from your hand on the timeline (100 seconds, or relaxed with 20 cards and no clock).
 *  - Paradox Repair: a saboteur moved some cards. Put them back within a few moves, then stabilise.
 *  - Archivist's Challenge: six case files. Order the cards from clues, no knowledge of years needed.
 * Wren, the time traveller, comments, gives tips and opens Time Capsules: checked facts with a source.
 *
 * Accessibility: every drag has a click or keyboard path (WCAG 2.5.7), the timed mode has a pause and a relaxed
 * alternative (2.2.1), every result is announced in a live region, kinds are named in text and not by colour
 * alone, motion follows prefers-reduced-motion, and below 600 px the timeline turns vertical instead of
 * scrolling sideways.
 */

import { Atkinson_Hyperlegible, Bricolage_Grotesque } from "next/font/google";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { CLASSIC_FAME, KINDS, cards, sourceUrl, type CultureCard, type Kind } from "@/content/games/britain";
import { cardArt } from "./cardArt";
import type { Motif } from "./poster";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--tt-display", display: "swap" });
const reading = Atkinson_Hyperlegible({ subsets: ["latin"], weight: ["400", "700"], variable: "--tt-text", display: "swap" });

const ROUND_SECONDS = 100;
const RELAXED_CARDS = 20;
const HAND_SIZE = 3;
const POINTS = 10;
const TIP_COST = 5;
const STORAGE_KEY = "time-traveller-2";

type Card = CultureCard;
type Mode = "catalogue" | "paradox" | "challenge";
type Screen = "menu" | "play" | "over";
type DeckKind = "mixed" | Kind;
type Mood = "calm" | "happy" | "worried";
type Status = "new" | "ok" | "bad" | "misfiled" | "hint";
type Speech = { text: string; mood: Mood; link?: Card; tale?: string };
type Saved = { best: Partial<Record<"timed" | "relaxed" | "paradox", number>>; capsule: string[]; cases: Record<string, number> };

const EMPTY: Saved = { best: {}, capsule: [], cases: {} };
const BY_ID = new Map(cards.map((c) => [c.id, c]));
const KIND_ORDER: Kind[] = ["book", "art", "music", "stage", "film"];
const CLASSICS = cards.filter((c) => c.fame >= CLASSIC_FAME);

/* --------------------------------------------------------------------------------------------- facts */

type Fact = { id: string; topic: string; text: string; source: string; url: string };

/** Time Capsule facts. Each one was checked against the linked page on 27 Nov 2026. Add more the same way. */
const FACTS: Fact[] = [
  { id: "Q278596", topic: "First performance", text: "It premiered on 17 July 1717 for George I, played by about 50 musicians on a barge on the Thames.", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Water_Music" },
  { id: "Q207732", topic: "How it was made", text: "Handel began it on 22 August 1741 and had the whole score in about three weeks. It was first heard in Dublin in 1742.", source: "BBC Music Magazine", url: "https://www.classical-music.com/features/articles/hallelujah-story-handel-s-messiah/" },
  { id: "Q170583", topic: "Behind the title", text: "Austen first called it First Impressions. Another novel took that title first, so hers became Pride and Prejudice.", source: "JASNA", url: "https://jasna.org/austen/works/pride-prejudice/" },
  { id: "Q150827", topic: "Birth of the book", text: "It began as a ghost-story challenge at the Villa Diodati in 1816, and the first edition carried no author's name.", source: "National Library of Medicine", url: "https://www.nlm.nih.gov/frankenstein/exhibition1.html" },
  { id: "Q257580", topic: "Afterlife", text: "In 2005 a BBC Radio 4 poll voted it the greatest painting in Britain. It is now on the £20 note.", source: "National Gallery", url: "https://www.nationalgallery.org.uk/about-us/press-and-media/press-releases/national-gallery-s-iconic-work-featured-on-new-bank-of-england-20-note" },
  { id: "Q1065493", topic: "In the studio", text: "Elizabeth Siddall posed in a bath warmed by lamps. Once the lamps went out unnoticed, and she fell ill.", source: "Tate", url: "https://tate.org.uk/art/artworks/millais-ophelia-n01506/story-ophelia" },
  { id: "Q92640", topic: "Birth of the book", text: "Carroll first told the story on a rowing trip on 4 July 1862 to amuse Alice Liddell and her sisters.", source: "Lady Margaret Hall, Oxford", url: "https://www.lmh.ox.ac.uk/node/1216" },
  { id: "x-stage-peter-pan", topic: "Afterlife", text: "In 1929 Barrie gave the rights to Peter Pan to Great Ormond Street Hospital, which still benefits from them.", source: "Great Ormond Street Hospital", url: "https://gosh.nhs.uk/about-us/our-history/peter-pan-at-great-ormond-street-hospital" },
  { id: "Q489607", topic: "Behind the words", text: "The words are Blake's, from the preface to his poem Milton. Parry set them to music in 1916.", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/And_did_those_feet_in_ancient_time" },
  { id: "Q303508", topic: "What's missing", text: "There is no movement for Pluto: it was only discovered in 1930, years after the suite was finished.", source: "San Francisco Classical Voice", url: "https://sfcv.org/learn/composer-gallery/gustav-holst" },
  { id: "Q74287", topic: "Birth of the book", text: "Tolkien scribbled its first line on a blank page he found while marking exam papers.", source: "Tolkien Estate", url: "https://www.tolkienestate.com/?p=33583" },
  { id: "Q208460", topic: "Behind the title", text: "Orwell wrote it on the island of Jura. Its working title was The Last Man in Europe.", source: "History Today", url: "https://www.historytoday.com/node/57086" },
  { id: "Q271830", topic: "The soundtrack", text: "The whole score is one zither, played by Anton Karas, whom Carol Reed heard in Vienna.", source: "Wikipedia", url: "https://en.wikipedia.org/wiki/Anton_Karas" },
  { id: "x-stage-the-mousetrap", topic: "Backstage", text: "It began as Three Blind Mice, a radio play written for Queen Mary, then grew into a full stage play.", source: "Agatha Christie Ltd", url: "https://agathachristie.com/theatre/the-mousetrap" },
  { id: "Q169226", topic: "The cover", text: "Pop artists Peter Blake and Jann Haworth staged the cover: a crowd of cut-outs, waxworks and props around the band.", source: "V&A", url: "https://collections.vam.ac.uk/item/O88532" },
  { id: "Q173643", topic: "The cover", text: "Iain Macmillan stood on a stepladder while a policeman held up the traffic, and took just six shots.", source: "The Beatles Bible", url: "https://www.beatlesbible.com/1969/08/08/the-abbey-road-cover-photography-session" },
  { id: "Q25043", topic: "On set", text: "There was no money for horses, so the knights ride on foot while their squires bang coconuts together.", source: "Medievalists.net", url: "https://www.medievalists.net/?p=106085" },
  { id: "Q187745", topic: "In the studio", text: "Recording began at Rockfield in Wales in August 1975, and four more studios were needed to finish it.", source: "Sound On Sound", url: "https://www.soundonsound.com/people/roy-thomas-baker-gary-langan-making-queens-bohemian-rhapsody" },
  { id: "Q43361", topic: "Birth of the book", text: "Several publishers turned it down (accounts say up to twelve) before Bloomsbury took it on.", source: "Business Insider via Yahoo", url: "https://uk.news.yahoo.com/original-synopsis-harry-potter-j-141039082.html" },
].filter((f) => BY_ID.has(f.id));
const FACT_BY_ID = new Map(FACTS.map((f) => [f.id, f]));

/* --------------------------------------------------------------------------------------------- cases */

type Rule =
  | { t: "first"; a: string }
  | { t: "last"; a: string }
  | { t: "before"; a: string; b: string }
  | { t: "between"; a: string; b: string; c: string }
  | { t: "groups"; a: string[]; b: string[] };
type Clue = { text: string; rule: Rule };
type CaseFile = { id: string; title: string; brief: string; ids: string[]; clues: Clue[] };

/**
 * Archivist's Challenge. Every clue is true and is checked only against the years in britain.ts.
 * Each case has exactly one order that satisfies all its clues, so it can be solved without knowing a year.
 * When you add a case, check that with solveCount() (see the bottom of this file).
 */
const RAW_CASES: CaseFile[] = [
  {
    id: "page-to-screen",
    title: "From page to screen",
    brief: "Two Bond novels and three Bond films have lost their dates. Rebuild the order.",
    ids: ["Q1047711", "Q26541", "Q102754", "Q27204", "x-film-casino-royale"],
    clues: [
      { text: "Every book in this file came out before every film in it.", rule: { t: "groups", a: ["Q1047711", "Q26541"], b: ["Q102754", "Q27204", "x-film-casino-royale"] } },
      { text: "Casino Royale was Fleming's first Bond novel. The book opens the file.", rule: { t: "first", a: "Q1047711" } },
      { text: "The film of Dr. No reached cinemas before Live and Let Die.", rule: { t: "before", a: "Q102754", b: "Q27204" } },
      { text: "The Casino Royale film is the newest card here.", rule: { t: "last", a: "x-film-casino-royale" } },
    ],
  },
  {
    id: "gothic",
    title: "Gothic shadows",
    brief: "Monsters, doubles and vampires, all out of order. Trust the clues.",
    ids: ["Q150827", "Q202975", "Q1043792", "Q217352", "Q82464", "Q41542"],
    clues: [
      { text: "Mary Shelley's novel is the oldest in the file.", rule: { t: "first", a: "Q150827" } },
      { text: "Dracula closes the file.", rule: { t: "last", a: "Q41542" } },
      { text: "Emily Brontë's novel came before every vampire and every double in here.", rule: { t: "groups", a: ["Q202975"], b: ["Q1043792", "Q217352", "Q82464", "Q41542"] } },
      { text: "Carmilla, a vampire novella, came out before Stevenson's Jekyll and Hyde.", rule: { t: "before", a: "Q1043792", b: "Q217352" } },
      { text: "Wilde's only novel came after Jekyll and Hyde.", rule: { t: "before", a: "Q217352", b: "Q82464" } },
    ],
  },
  {
    id: "brushes",
    title: "Brotherhood of brushes",
    brief: "Six Victorian paintings, one shuffled gallery wall.",
    ids: ["Q1065493", "Q1757920", "Q477764", "Q2712679", "x-art-the-lady-of-shalott", "Q846213"],
    clues: [
      { text: "Ophelia is the oldest painting here.", rule: { t: "first", a: "Q1065493" } },
      { text: "Flaming June is the newest.", rule: { t: "last", a: "Q846213" } },
      { text: "Hunt's The Light of the World sits between the two Millais paintings.", rule: { t: "between", a: "Q1065493", b: "Q1757920", c: "Q477764" } },
      { text: "Both Millais paintings came before anything by Rossetti.", rule: { t: "groups", a: ["Q1065493", "Q477764"], b: ["Q2712679"] } },
      { text: "Waterhouse's The Lady of Shalott came after Rossetti's Beata Beatrix.", rule: { t: "before", a: "Q2712679", b: "x-art-the-lady-of-shalott" } },
    ],
  },
  {
    id: "sixties",
    title: "Sixties into seventies",
    brief: "Someone shuffled the record shelf. Put the singles and albums back in order.",
    ids: ["x-music-love-me-do", "Q158553", "Q169226", "x-music-space-oddity", "Q192023", "Q187745"],
    clues: [
      { text: "Love Me Do, the Beatles' first single, opens the file.", rule: { t: "first", a: "x-music-love-me-do" } },
      { text: "Queen's song is the newest card.", rule: { t: "last", a: "Q187745" } },
      { text: "The Rolling Stones' hit came before Sgt. Pepper.", rule: { t: "before", a: "Q158553", b: "Q169226" } },
      { text: "Sgt. Pepper came before Bowie's Space Oddity.", rule: { t: "before", a: "Q169226", b: "x-music-space-oddity" } },
      { text: "Led Zeppelin's Stairway to Heaven came after Space Oddity.", rule: { t: "before", a: "x-music-space-oddity", b: "Q192023" } },
    ],
  },
  {
    id: "stage",
    title: "All the world's a stage",
    brief: "Four Shakespeare plays, a ballad opera and a comedy of manners.",
    ids: ["Q83186", "Q41567", "Q130283", "Q86440", "x-stage-the-beggar-s-opera", "Q830501"],
    clues: [
      { text: "Romeo and Juliet is the oldest play here.", rule: { t: "first", a: "Q83186" } },
      { text: "Hamlet was staged before Macbeth.", rule: { t: "before", a: "Q41567", b: "Q130283" } },
      { text: "Of the Shakespeare plays here, The Tempest came last.", rule: { t: "groups", a: ["Q83186", "Q41567", "Q130283"], b: ["Q86440"] } },
      { text: "The Beggar's Opera opened more than a century after Shakespeare died.", rule: { t: "groups", a: ["Q83186", "Q41567", "Q130283", "Q86440"], b: ["x-stage-the-beggar-s-opera"] } },
      { text: "Wilde's comedy closes the file.", rule: { t: "last", a: "Q830501" } },
    ],
  },
  {
    id: "screen",
    title: "Big screen, big names",
    brief: "Six films, four decades, one tangled reel.",
    ids: ["Q228186", "Q103474", "Q103569", "Q202211", "Q109135", "Q128518"],
    clues: [
      { text: "David Lean's desert epic is the oldest film here.", rule: { t: "first", a: "Q228186" } },
      { text: "Gladiator is the newest.", rule: { t: "last", a: "Q128518" } },
      { text: "Kubrick's space voyage came before Ridley Scott's space horror.", rule: { t: "before", a: "Q103474", b: "Q103569" } },
      { text: "Gandhi came out three years after Alien.", rule: { t: "before", a: "Q103569", b: "Q202211" } },
      { text: "Danny Boyle's Trainspotting came after Gandhi.", rule: { t: "before", a: "Q202211", b: "Q109135" } },
    ],
  },
];
const CASES = RAW_CASES.filter((c) => c.ids.every((id) => BY_ID.has(id)));

export function ruleHolds(rule: Rule, line: Card[]): boolean {
  const pos = (id: string) => line.findIndex((c) => c.id === id);
  switch (rule.t) {
    case "first":
      return pos(rule.a) === 0;
    case "last":
      return pos(rule.a) === line.length - 1;
    case "before":
      return pos(rule.a) < pos(rule.b);
    case "between":
      return pos(rule.a) < pos(rule.b) && pos(rule.b) < pos(rule.c);
    case "groups":
      return Math.max(...rule.a.map(pos)) < Math.min(...rule.b.map(pos));
  }
}

/* --------------------------------------------------------------------------------------------- Wren */

const WREN = {
  hello:
    "Hello, I'm Wren. I travel through time and look after this archive of British culture: six centuries of books, paintings, music, plays and films. Somebody has to keep it in order.",
  catalogue: "Put each card where it belongs, oldest on the left.",
  paradox: "Someone has been meddling with the timeline. Some cards were moved. Put them back before the continuum notices.",
  right: ["Spot on.", "Filed exactly where it belongs.", "The archive purrs.", "Clean placement.", "Yes. Right there."],
  wrong: ["Not quite. I've pinned it where it really goes.", "The timestream disagrees. Here's its real place.", "Close, but no."],
  streak: "Three in a row. You've done this before, haven't you?",
  tales: [
    "I once tried to return a library book in 1851. The fine was in guineas.",
    "Never sneeze in a Victorian darkroom. Trust me on this.",
    "I left my umbrella in 1666. Bad year for wooden things.",
    "The trick with stagecoaches is to look bored. Everyone else does.",
  ],
};
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/* --------------------------------------------------------------------------------------------- helpers */

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const deckFor = (kind: DeckKind, classicsOnly: boolean) =>
  cards.filter((c) => (kind === "mixed" || c.kind === kind) && (!classicsOnly || c.fame >= CLASSIC_FAME));

const span = (list: Card[]) => {
  if (!list.length) return "";
  const ys = list.map((c) => c.year);
  return `${Math.min(...ys)}–${Math.max(...ys)}`;
};

/** Is `year` allowed in the gap before line[index]? Equal years fit on either side. */
export function fits(line: Card[], index: number, year: number) {
  const before = line[index - 1];
  const after = line[index];
  return (!before || before.year <= year) && (!after || year <= after.year);
}

const rightIndex = (line: Card[], year: number) => {
  for (let i = 0; i <= line.length; i++) if (fits(line, i, year)) return i;
  return line.length;
};

export const isSorted = (line: Card[]) => line.every((c, i) => i === 0 || line[i - 1].year <= c.year);

/** Fewest single-card moves that sort the line: its length minus its longest non-decreasing run of years. */
export function movesNeeded(line: Card[]) {
  const tails: number[] = [];
  for (const c of line) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (tails[m] <= c.year) lo = m + 1;
      else hi = m;
    }
    tails[lo] = c.year;
  }
  return line.length - tails.length;
}

function centuryHint(y: number) {
  const c = Math.floor((y - 1) / 100) + 1;
  const end = c % 10 === 1 && c !== 11 ? "st" : c % 10 === 2 && c !== 12 ? "nd" : c % 10 === 3 && c !== 13 ? "rd" : "th";
  const half = y % 100 >= 1 && y % 100 <= 50 ? "first" : "second";
  return `the ${half} half of the ${c}${end} century`;
}

const LEVELS = [
  { n: 6, k: 2 },
  { n: 7, k: 2 },
  { n: 8, k: 3 },
  { n: 9, k: 3 },
  { n: 10, k: 4 },
];

/** A sorted run of classics at least 15 years apart, with k of them moved two or more places away. */
function makeAnomaly(level: number) {
  const { n, k } = LEVELS[Math.min(level, LEVELS.length - 1)];
  for (let tries = 0; tries < 300; tries++) {
    const chosen: Card[] = [];
    for (const c of shuffle(CLASSICS)) {
      if (chosen.every((x) => Math.abs(x.year - c.year) >= 15 && x.title !== c.title)) chosen.push(c);
      if (chosen.length === n) break;
    }
    if (chosen.length < n) continue;
    chosen.sort((a, b) => a.year - b.year);
    const line = [...chosen];
    const moved = shuffle(chosen)
      .slice(0, k)
      .map((c) => c.id);
    for (const id of moved) {
      const from = line.findIndex((c) => c.id === id);
      const to = pick(line.map((_, i) => i).filter((i) => Math.abs(i - from) >= 2));
      const [c] = line.splice(from, 1);
      line.splice(to, 0, c);
    }
    if (!isSorted(line) && movesNeeded(line) <= k) return { line, moved, k };
  }
  const line = [...CLASSICS].sort((a, b) => a.year - b.year).slice(0, n);
  [line[0], line[n - 1]] = [line[n - 1], line[0]];
  return { line, moved: [line[0].id, line[n - 1].id], k: 2 };
}

function readSaved(): Saved {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<Saved> | null;
    return { best: raw?.best ?? {}, capsule: raw?.capsule ?? [], cases: raw?.cases ?? {} };
  } catch {
    return EMPTY;
  }
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function centerIn(container: HTMLElement, el: Element, smooth: boolean) {
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  container.scrollBy({
    left: e.left + e.width / 2 - (c.left + c.width / 2),
    top: e.top + e.height / 2 - (c.top + c.height / 2),
    behavior: smooth ? "smooth" : "auto",
  });
}

/* ============================================================================================= game */

export function TimeTraveller() {
  const rootRef = useRef<HTMLDivElement>(null);
  const capsuleRef = useRef<HTMLDialogElement>(null);
  const overRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);

  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<Mode>("catalogue");
  const [speech, setSpeech] = useState<Speech>({ text: WREN.hello, mood: "calm" });
  const [announce, setAnnounce] = useState("");
  const [placing, setPlacing] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [center, setCenter] = useState<{ id: string; n: number } | null>(null);
  const [record, setRecord] = useState(false);
  const [finishSoon, setFinishSoon] = useState(0);
  const [line, setLine] = useState<Card[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});

  // Catalogue
  const [deckKind, setDeckKind] = useState<DeckKind>("mixed");
  const [classicsOnly, setClassicsOnly] = useState(true);
  const [timed, setTimed] = useState(true);
  const [hand, setHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [paused, setPaused] = useState(false);
  const [tipped, setTipped] = useState<string[]>([]);

  // Paradox Repair
  const [level, setLevel] = useState(0);
  const [stability, setStability] = useState(3);
  const [solved, setSolved] = useState(0);
  const [startLine, setStartLine] = useState<Card[]>([]);
  const [moved, setMoved] = useState<string[]>([]);
  const [budget, setBudget] = useState(0);
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<null | "ok" | "no">(null);
  const [hinted, setHinted] = useState(false);

  // Archivist's Challenge
  const [caseIdx, setCaseIdx] = useState(0);
  const [seals, setSeals] = useState(3);
  const [revealed, setRevealed] = useState<string[]>([]);

  const caseFile = CASES[caseIdx];

  useEffect(() => setSaved(readSaved()), []);

  const updateSaved = (fn: (s: Saved) => Saved) =>
    setSaved((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* private mode: nothing is kept, the game still works */
      }
      return next;
    });

  const say = (text: string, mood: Mood = "calm", link?: Card, tale?: string) => setSpeech({ text, mood, link, tale });

  /** Opens capsules for the given cards; returns the titles that were new. */
  const unlock = (ids: string[]) => {
    const fresh = ids.filter((id) => FACT_BY_ID.has(id) && !saved.capsule.includes(id));
    if (fresh.length) updateSaved((s) => ({ ...s, capsule: [...s.capsule, ...fresh.filter((id) => !s.capsule.includes(id))] }));
    return fresh.map((id) => BY_ID.get(id)?.title ?? "");
  };
  const capsuleLine = (titles: string[]) =>
    titles.length ? ` A Time Capsule opened: ${titles.join(", ")}. Open it from the top bar.` : "";

  // Focus requests and scrolling run after React has drawn the new state.
  useEffect(() => {
    if (!pendingFocus.current) return;
    const el = rootRef.current?.querySelector<HTMLElement>(pendingFocus.current);
    if (el) el.focus({ preventScroll: true });
    pendingFocus.current = null;
  });
  useEffect(() => {
    if (screen === "over") overRef.current?.focus();
  }, [screen]);

  /* ------------------------------------------------------------------------------- shared */

  const begin = (text: string) => {
    setPlacing(null);
    setDragging(null);
    setResult(null);
    setRecord(false);
    setMarks({});
    setScreen("play");
    say(text, "calm");
    setAnnounce("");
    pendingFocus.current = ".tt2-hand button, .tt2-rail [data-card]";
    rootRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
  };

  const endRound = () => {
    if (mode !== "challenge") {
      const key = mode === "paradox" ? "paradox" : timed ? "timed" : "relaxed";
      const value = mode === "paradox" ? solved : score;
      const isRecord = value > 0 && value > (saved.best[key] ?? 0);
      if (isRecord) updateSaved((s) => ({ ...s, best: { ...s.best, [key]: value } }));
      setRecord(isRecord);
    }
    setPlacing(null);
    setDragging(null);
    setPaused(false);
    setScreen("over");
  };

  const toMenu = () => {
    setPlacing(null);
    setDragging(null);
    setPaused(false);
    setScreen("menu");
    say(WREN.hello, "calm");
  };

  const pickUp = (id: string, viaKeyboardOrClick: boolean) => {
    if (placing === id) {
      setPlacing(null);
      setAnnounce("Card put back.");
      return;
    }
    setPlacing(id);
    const c = BY_ID.get(id);
    setAnnounce(`${c?.title} picked up. Choose a place on the timeline. Arrow keys move between places, Escape cancels.`);
    if (viaKeyboardOrClick) setFocusToken((n) => n + 1);
  };

  const cancelPlacing = () => {
    if (!placing) return;
    const id = placing;
    setPlacing(null);
    setDragging(null);
    setAnnounce("Card put back.");
    pendingFocus.current = mode === "catalogue" ? `.tt2-hand [data-hand="${id}"]` : `.tt2-rail [data-card="${id}"]`;
  };

  const onPlace = (gap: number) => {
    const id = placing ?? dragging;
    if (!id) return;
    if (mode === "catalogue") placeFromHand(id, gap);
    else moveOnRail(id, gap);
  };

  /* ------------------------------------------------------------------------------- Catalogue */

  const startCatalogue = (isTimed: boolean) => {
    const pool = deckFor(deckKind, classicsOnly);
    if (pool.length < 2) return;
    let d = shuffle(pool);
    if (!isTimed) d = d.slice(0, 1 + RELAXED_CARDS);
    setMode("catalogue");
    setTimed(isTimed);
    setLine([d[0]]);
    setHand(d.slice(1, 1 + HAND_SIZE));
    setDeck(d.slice(1 + HAND_SIZE));
    setScore(0);
    setRight(0);
    setWrong(0);
    setStreak(0);
    setTime(ROUND_SECONDS);
    setPaused(false);
    setTipped([]);
    begin(`${WREN.catalogue} ${d[0].title} (${d[0].year}) is already filed. Pick a card below.`);
  };

  const placeFromHand = (id: string, gap: number) => {
    const card = hand.find((c) => c.id === id);
    if (!card || screen !== "play" || paused) return;
    const ok = fits(line, gap, card.year);
    const at = ok ? gap : rightIndex(line, card.year);
    const nextLine = [...line];
    nextLine.splice(at, 0, card);
    const nextHand = hand.filter((c) => c.id !== id);
    const [drawn, ...rest] = deck;
    if (drawn) nextHand.push(drawn);
    setLine(nextLine);
    setHand(nextHand);
    setDeck(rest);
    setPlacing(null);
    setDragging(null);
    setMarks((m) => {
      const next: Record<string, Status> = {};
      for (const [k, v] of Object.entries(m)) if (v === "misfiled") next[k] = v;
      next[id] = ok ? "new" : "misfiled";
      return next;
    });
    setCenter({ id, n: Date.now() });

    const verb = KINDS[card.kind].verb;
    if (ok) {
      const s = streak + 1;
      setStreak(s);
      setScore((v) => v + POINTS);
      setRight((v) => v + 1);
      const opened = capsuleLine(unlock([id]));
      const tale = !opened && Math.random() < 0.12 ? pick(WREN.tales) : undefined;
      say(`${s === 3 ? WREN.streak : pick(WREN.right)} ${card.title} ${verb} ${card.year}.${opened}`, "happy", card, tale);
      setAnnounce(`Right. ${card.title}, ${card.year}. Plus ${POINTS} points.${opened}`);
    } else {
      setStreak(0);
      setScore((v) => v - POINTS);
      setWrong((v) => v + 1);
      say(`${pick(WREN.wrong)} ${card.title} ${verb} ${card.year}.`, "worried", card);
      setAnnounce(`Not quite. ${card.title} ${verb} ${card.year}. Minus ${POINTS} points. It is now marked as misfiled.`);
    }
    if (!nextHand.length) {
      // let the last result show for a moment; the effect below then reads the final score
      setTimeout(() => setFinishSoon((n) => n + 1), 900);
      return;
    }
    pendingFocus.current = ".tt2-hand button";
  };

  useEffect(() => {
    if (finishSoon && screen === "play" && mode === "catalogue") endRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finishSoon]);

  // The clock
  useEffect(() => {
    if (screen !== "play" || mode !== "catalogue" || !timed || paused) return;
    const t = window.setInterval(() => setTime((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [screen, mode, timed, paused]);
  useEffect(() => {
    if (screen !== "play" || mode !== "catalogue" || !timed) return;
    if (time <= 0) endRound();
    else if (time === 30 || time === 10) setAnnounce(`${time} seconds left.`);
    // endRound reads the latest state on purpose; it only runs when the clock changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time]);

  const catalogueTip = () => {
    const card = hand.find((c) => c.id === placing) ?? hand[0];
    if (!card) return;
    if (tipped.includes(card.id)) {
      say(`I've already told you about ${card.title}: ${centuryHint(card.year)}.`, "calm");
      return;
    }
    setTipped((t) => [...t, card.id]);
    setScore((s) => s - TIP_COST);
    say(`${card.title}? That one is from ${centuryHint(card.year)}. (Tip: minus ${TIP_COST} points.)`, "calm");
  };

  /* ------------------------------------------------------------------------------- Paradox Repair */

  const loadAnomaly = (lvl: number) => {
    const a = makeAnomaly(lvl);
    setLine(a.line);
    setStartLine(a.line);
    setMoved(a.moved);
    setBudget(a.k);
    setMoves(a.k);
    setResult(null);
    setHinted(false);
    setMarks({});
    setPlacing(null);
    return a;
  };

  const startParadox = () => {
    setMode("paradox");
    setLevel(0);
    setStability(3);
    setSolved(0);
    const a = loadAnomaly(0);
    begin(`${WREN.paradox} ${a.k} cards were moved. You have ${a.k} moves. Pick a card, then a new place for it.`);
  };

  const stabilize = () => {
    const ok = isSorted(line);
    const m: Record<string, Status> = {};
    line.forEach((c, i) => (m[c.id] = i > 0 && line[i - 1].year > c.year ? "bad" : "ok"));
    setMarks(m);
    setResult(ok ? "ok" : "no");
    setPlacing(null);
    if (ok) {
      setSolved((s) => s + 1);
      const opened = capsuleLine(unlock(line.map((c) => c.id)));
      say(`The continuum holds. Beautifully done.${opened}`, "happy");
      setAnnounce(`Timeline stable. Every year is now shown.${opened}`);
    } else {
      const left = stability - 1;
      setStability(left);
      const breaks = Object.values(m).filter((v) => v === "bad").length;
      const msg =
        left > 0
          ? `A paradox! Time runs backwards in ${breaks} ${breaks === 1 ? "place" : "places"}, marked in red. The continuum is shaken.`
          : "The continuum has given way. Let's see how far you got.";
      say(msg, "worried");
      setAnnounce(`${msg} Every year is now shown.`);
    }
    pendingFocus.current = ".tt2-dock .tt2-btn";
  };

  const nextAnomaly = () => {
    if (stability <= 0) {
      endRound();
      return;
    }
    const lvl = result === "ok" ? level + 1 : level;
    setLevel(lvl);
    const a = loadAnomaly(lvl);
    say(`Another anomaly. ${a.k} cards moved, ${a.k} moves. ${a.line.length} cards on the line.`, "calm");
    pendingFocus.current = ".tt2-rail [data-card]";
  };

  const paradoxTip = () => {
    if (hinted || result) {
      say("One clue per anomaly. You can do the rest.", "calm");
      return;
    }
    const outOfPlace = moved.filter((id) => {
      const i = line.findIndex((c) => c.id === id);
      return !fits(
        line.filter((c) => c.id !== id),
        i,
        line[i].year,
      );
    });
    if (!outOfPlace.length) {
      say("Everything the saboteur touched looks right to me now. Try stabilising.", "happy");
      return;
    }
    const id = pick(outOfPlace);
    setHinted(true);
    setMarks((m) => ({ ...m, [id]: "hint" }));
    say(`Between you and me: ${BY_ID.get(id)?.title} is one of the cards that was moved.`, "calm");
  };

  /* ------------------------------------------------------------------------------- Archivist's Challenge */

  const startCase = (idx: number) => {
    const cf = CASES[idx];
    if (!cf) return;
    const list = cf.ids.map((id) => BY_ID.get(id)).filter((c): c is Card => !!c);
    let l = shuffle(list);
    for (let i = 0; i < 50 && (isSorted(l) || cf.clues.every((cl) => ruleHolds(cl.rule, l))); i++) l = shuffle(list);
    setMode("challenge");
    setCaseIdx(idx);
    setLine(l);
    setSeals(3);
    setRevealed([]);
    begin(`Case file: ${cf.title}. ${cf.brief} The clues are below. Move cards until every clue holds, then seal the file.`);
  };

  const sealFile = () => {
    if (!caseFile) return;
    if (isSorted(line)) {
      setResult("ok");
      setMarks(Object.fromEntries(line.map((c) => [c.id, "ok" as Status])));
      updateSaved((s) => ({ ...s, cases: { ...s.cases, [caseFile.id]: Math.max(s.cases[caseFile.id] ?? 0, seals) } }));
      const opened = capsuleLine(unlock(line.map((c) => c.id)));
      say(`Case closed with ${seals} ${seals === 1 ? "seal" : "seals"}. The Archivist will be pleased.${opened}`, "happy");
      setAnnounce(`Case solved. Every year is now shown.${opened}`);
    } else {
      const broken = caseFile.clues.filter((cl) => !ruleHolds(cl.rule, line)).length;
      const left = seals - 1;
      setSeals(left);
      if (left <= 0) {
        setResult("no");
        const m: Record<string, Status> = {};
        line.forEach((c, i) => (m[c.id] = i > 0 && line[i - 1].year > c.year ? "bad" : "ok"));
        setMarks(m);
        say("Out of seals. Here are the real years, so the case still teaches you something.", "worried");
      } else {
        say(`Not yet: ${broken} ${broken === 1 ? "clue disagrees" : "clues disagree"} with this order. One seal lost.`, "worried");
      }
    }
    pendingFocus.current = ".tt2-dock .tt2-btn";
  };

  const challengeTip = () => {
    const hidden = line.filter((c) => !revealed.includes(c.id));
    if (seals <= 1 || !hidden.length || result) {
      say("I'd rather not spend your last seal. Read the clues once more.", "calm");
      return;
    }
    const c = pick(hidden);
    setRevealed((r) => [...r, c.id]);
    setSeals((s) => s - 1);
    say(`Fine, one year: ${c.title} is from ${c.year}. That cost a seal.`, "calm");
  };

  /* ------------------------------------------------------------------------------- moving cards on the rail */

  const moveOnRail = (id: string, gap: number) => {
    if (result || (mode === "paradox" && moves <= 0)) return;
    const from = line.findIndex((c) => c.id === id);
    if (from < 0) return;
    const to = gap > from ? gap - 1 : gap;
    setPlacing(null);
    setDragging(null);
    if (to === from) return;
    const next = [...line];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    setLine(next);
    setCenter({ id, n: Date.now() });
    pendingFocus.current = `.tt2-rail [data-card="${id}"]`;
    if (mode === "paradox") {
      const left = moves - 1;
      setMoves(left);
      setAnnounce(`${c.title} moved to place ${to + 1} of ${next.length}. ${left} ${left === 1 ? "move" : "moves"} left.`);
      if (left === 0) say("That was your last move. Stabilise when you're ready.", "calm");
    } else if (caseFile) {
      const holding = caseFile.clues.filter((cl) => ruleHolds(cl.rule, next)).length;
      setAnnounce(`${c.title} moved to place ${to + 1} of ${next.length}. ${holding} of ${caseFile.clues.length} clues hold.`);
    }
  };

  const resetAnomaly = () => {
    setLine(startLine);
    setMoves(budget);
    setPlacing(null);
    setMarks((m) => Object.fromEntries(Object.entries(m).filter(([, v]) => v === "hint")));
    say("Back to how the saboteur left it.", "calm");
  };

  /* ------------------------------------------------------------------------------- render */

  const onRootKey = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape" && placing && !capsuleRef.current?.open) {
      e.preventDefault();
      cancelPlacing();
    }
  };

  const openCapsule = () => capsuleRef.current?.showModal();

  const showYear = (c: Card) =>
    mode === "catalogue" || result !== null || (mode === "challenge" && revealed.includes(c.id));
  const canPickRail = screen === "play" && mode !== "catalogue" && !result && (mode === "challenge" || moves > 0);
  const active = placing ?? dragging;
  const activeFrom = mode === "catalogue" ? "hand" : "rail";

  const tip = mode === "catalogue" ? catalogueTip : mode === "paradox" ? paradoxTip : challengeTip;
  const tipLabel =
    mode === "catalogue" ? `Ask Wren (−${TIP_COST})` : mode === "paradox" ? "Ask Wren" : "Reveal a year (−1 seal)";

  const capsuleCount = saved.capsule.filter((id) => FACT_BY_ID.has(id)).length;

  return (
    <div ref={rootRef} className={`tt2 ${display.variable} ${reading.variable}`} onKeyDown={onRootKey}>
      <style>{STYLES}</style>

      {/* top bar */}
      <header className="tt2-bar">
        <p className="tt2-brand">
          Time Traveller
          {screen === "play" && <span className="tt2-brand-mode"> · {MODE_NAMES[mode]}</span>}
        </p>
        {screen === "play" && mode === "catalogue" && (
          <dl className="tt2-stats">
            <Stat label="Score" value={score} />
            {timed && <Stat label="Time" value={Math.max(0, time)} low={time <= 10} unit="seconds" />}
            <Stat label="Cards left" value={hand.length + deck.length} />
          </dl>
        )}
        {screen === "play" && mode === "paradox" && (
          <dl className="tt2-stats">
            <Stat label="Anomaly" value={solved + 1 + (result === "ok" ? -1 : 0)} />
            <Stat label="Moves" value={`${moves}/${budget}`} low={moves === 0 && !result} />
            <div className="tt2-stat">
              <dt>Continuum</dt>
              <dd className="tt2-cells" aria-label={`${stability} of 3`}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < stability ? "is-on" : ""} aria-hidden="true" />
                ))}
              </dd>
            </div>
          </dl>
        )}
        {screen === "play" && mode === "challenge" && (
          <dl className="tt2-stats">
            <Stat label="Case" value={`${caseIdx + 1}/${CASES.length}`} />
            <div className="tt2-stat">
              <dt>Seals</dt>
              <dd className="tt2-seals" aria-label={`${seals} of 3`}>
                <span aria-hidden="true">{"●".repeat(seals) + "○".repeat(3 - seals)}</span>
              </dd>
            </div>
          </dl>
        )}
        <div className="tt2-bar-actions">
          <button type="button" className="tt2-btn tt2-btn-ghost" onClick={openCapsule}>
            <span className="tt2-wide">Time </span>Capsule <span className="tt2-badge">{capsuleCount}/{FACTS.length}</span>
          </button>
          {screen === "play" && mode === "catalogue" && timed && (
            <button type="button" className="tt2-btn tt2-btn-ghost" aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          {screen === "play" && (
            <button type="button" className="tt2-btn tt2-btn-ghost" onClick={mode === "challenge" ? toMenu : endRound}>
              {mode === "challenge" ? "Menu" : "End"}
            </button>
          )}
        </div>
      </header>

      {/* Wren */}
      <section className="tt2-wren" aria-label="Wren, the time traveller">
        <WrenFace mood={speech.mood} />
        <div className="tt2-speech">
          <p aria-live="polite">
            <strong>Wren:</strong> {speech.text}{" "}
            {speech.link && (
              <a href={sourceUrl(speech.link)} target="_blank" rel="noreferrer">
                More about {speech.link.title}
                <span className="tt2-sr"> (opens in a new tab)</span> ↗
              </a>
            )}
          </p>
          {speech.tale && (
            <p className="tt2-tale">
              <span>Wren&apos;s tale (made up):</span> {speech.tale}
            </p>
          )}
        </div>
        {screen === "play" && (
          <button type="button" className="tt2-btn tt2-btn-ghost tt2-tip" onClick={tip} disabled={paused}>
            {tipLabel}
          </button>
        )}
      </section>

      {screen === "menu" && (
        <Menu
          saved={saved}
          deckKind={deckKind}
          setDeckKind={setDeckKind}
          classicsOnly={classicsOnly}
          setClassicsOnly={setClassicsOnly}
          onCatalogue={startCatalogue}
          onParadox={startParadox}
          onCase={startCase}
        />
      )}

      {screen === "play" && (
        <>
          <section className="tt2-stage" aria-labelledby="tt2-rail-title">
            <h2 id="tt2-rail-title" className="tt2-sr">
              Timeline, oldest first
            </h2>
            {paused ? (
              <p className="tt2-paused">Paused. The clock waits for you.</p>
            ) : (
              <Rail
                items={line}
                showYear={showYear}
                marks={marks}
                active={active}
                activeFrom={activeFrom}
                canPick={canPickRail}
                picked={placing}
                focusToken={focusToken}
                center={center}
                showMap={mode === "catalogue" || result !== null}
                onPick={(id) => pickUp(id, true)}
                onDragFrom={(id) => setTimeout(() => setDragging(id), 0)}
                onDragEnd={() => setDragging(null)}
                onPlace={onPlace}
              />
            )}
          </section>

          <section className="tt2-dock" aria-labelledby="tt2-dock-title">
            {mode === "catalogue" && (
              <>
                <h2 id="tt2-dock-title" className="tt2-h2">
                  Your cards
                  <span className="tt2-h2-note">Drag one onto the timeline, or tap it and then tap a gap.</span>
                </h2>
                <ul className="tt2-hand">
                  {hand.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        data-hand={c.id}
                        className={`tt2-card is-hand k-${c.kind}${placing === c.id ? " is-picked" : ""}`}
                        aria-pressed={placing === c.id}
                        disabled={paused}
                        draggable={!paused}
                        onDragStart={(e: ReactDragEvent) => {
                          e.dataTransfer.setData("text/plain", c.id);
                          e.dataTransfer.effectAllowed = "move";
                          setTimeout(() => setDragging(c.id), 0);
                        }}
                        onDragEnd={() => setDragging(null)}
                        onClick={() => pickUp(c.id, true)}
                      >
                        <CardFace card={c} showYear={false} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {mode === "paradox" && (
              <>
                <h2 id="tt2-dock-title" className="tt2-h2">
                  {result === "ok" ? "Continuum stable" : result === "no" ? "Paradox" : "Repair the timeline"}
                  {!result && (
                    <span className="tt2-h2-note">
                      Pick a card on the timeline, then pick its new place. Each move costs one of your {budget}.
                    </span>
                  )}
                </h2>
                <div className="tt2-actions">
                  {result ? (
                    <button type="button" className="tt2-btn" onClick={nextAnomaly}>
                      {stability <= 0 ? "See results" : result === "ok" ? "Next anomaly ▶" : "Try a new anomaly ▶"}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="tt2-btn" onClick={stabilize}>
                        Stabilise timeline
                      </button>
                      <button type="button" className="tt2-btn tt2-btn-ghost" onClick={resetAnomaly}>
                        Undo all moves
                      </button>
                    </>
                  )}
                </div>
              </>
            )}

            {mode === "challenge" && caseFile && (
              <>
                <h2 id="tt2-dock-title" className="tt2-h2">
                  Clues · {caseFile.title}
                  <span className="tt2-h2-note">
                    {caseFile.clues.filter((cl) => ruleHolds(cl.rule, line)).length} of {caseFile.clues.length} hold
                  </span>
                </h2>
                <ol className="tt2-clues">
                  {caseFile.clues.map((cl) => {
                    const ok = ruleHolds(cl.rule, line);
                    return (
                      <li key={cl.text} className={ok ? "is-ok" : ""}>
                        <span aria-hidden="true">{ok ? "✓" : "·"}</span>
                        {cl.text}
                        <span className="tt2-sr">{ok ? " (holds)" : " (does not hold yet)"}</span>
                      </li>
                    );
                  })}
                </ol>
                <div className="tt2-actions">
                  {result ? (
                    <>
                      {caseIdx < CASES.length - 1 && (
                        <button type="button" className="tt2-btn" onClick={() => startCase(caseIdx + 1)}>
                          Next case ▶
                        </button>
                      )}
                      <button type="button" className="tt2-btn tt2-btn-ghost" onClick={() => startCase(caseIdx)}>
                        Play this case again
                      </button>
                      <button type="button" className="tt2-btn tt2-btn-ghost" onClick={toMenu}>
                        All cases
                      </button>
                    </>
                  ) : (
                    <button type="button" className="tt2-btn" onClick={sealFile}>
                      Seal the file
                    </button>
                  )}
                </div>
              </>
            )}
          </section>
        </>
      )}

      {screen === "over" && (
        <section className="tt2-over" aria-labelledby="tt2-over-title">
          <h2 id="tt2-over-title" className="tt2-h1" tabIndex={-1} ref={overRef}>
            {record ? "A new record!" : mode === "paradox" ? "The continuum rests" : "Round over"}
          </h2>
          {mode === "catalogue" ? (
            <dl className="tt2-summary">
              <Stat label="Score" value={score} />
              <Stat label="Right" value={right} />
              <Stat label="Wrong" value={wrong} />
              <Stat label="Best" value={Math.max(saved.best[timed ? "timed" : "relaxed"] ?? 0, score)} />
            </dl>
          ) : (
            <dl className="tt2-summary">
              <Stat label="Anomalies repaired" value={solved} />
              <Stat label="Best" value={Math.max(saved.best.paradox ?? 0, solved)} />
            </dl>
          )}
          <p className="tt2-over-note">
            {mode === "catalogue"
              ? right > wrong
                ? "Well done. You really are a time traveller."
                : "The timestream is a tricky place. Have another go."
              : solved > 2
                ? "The saboteur will think twice before coming back."
                : "Saboteurs are sneaky. You'll catch the next one."}
          </p>
          <div className="tt2-actions">
            <button type="button" className="tt2-btn" onClick={() => (mode === "paradox" ? startParadox() : startCatalogue(timed))}>
              Play again ▶
            </button>
            <button type="button" className="tt2-btn tt2-btn-ghost" onClick={toMenu}>
              Choose a mode
            </button>
          </div>
        </section>
      )}

      <dialog ref={capsuleRef} className="tt2-dialog" aria-labelledby="tt2-capsule-title">
        <h2 id="tt2-capsule-title" className="tt2-h1">
          Time Capsule
        </h2>
        <p className="tt2-dialog-lead">
          {capsuleCount} of {FACTS.length} opened. A capsule opens when you place its card correctly or solve a timeline
          that contains it.
        </p>
        {capsuleCount === 0 ? (
          <p>Nothing yet. Keep playing.</p>
        ) : (
          <ul className="tt2-facts">
            {FACTS.filter((f) => saved.capsule.includes(f.id)).map((f) => {
              const c = BY_ID.get(f.id);
              return (
                <li key={f.id}>
                  <p className="tt2-fact-head">
                    <strong>{c?.title}</strong> <span>· {f.topic}</span>
                  </p>
                  <p>{f.text}</p>
                  <a href={f.url} target="_blank" rel="noreferrer">
                    Source: {f.source}
                    <span className="tt2-sr"> (opens in a new tab)</span> ↗
                  </a>
                </li>
              );
            })}
          </ul>
        )}
        <form method="dialog">
          <button className="tt2-btn">Close</button>
        </form>
      </dialog>

      <p className="tt2-sr" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
    </div>
  );
}

const MODE_NAMES: Record<Mode, string> = {
  catalogue: "Catalogue",
  paradox: "Paradox Repair",
  challenge: "Archivist's Challenge",
};

/* ============================================================================================= pieces */

function Stat({ label, value, low, unit }: { label: string; value: number | string; low?: boolean; unit?: string }) {
  return (
    <div className={`tt2-stat${low ? " is-low" : ""}`}>
      <dt>{label}</dt>
      <dd>
        {value}
        {unit && <span className="tt2-sr"> {unit}</span>}
      </dd>
    </div>
  );
}

function Menu({
  saved,
  deckKind,
  setDeckKind,
  classicsOnly,
  setClassicsOnly,
  onCatalogue,
  onParadox,
  onCase,
}: {
  saved: Saved;
  deckKind: DeckKind;
  setDeckKind: (k: DeckKind) => void;
  classicsOnly: boolean;
  setClassicsOnly: (v: boolean) => void;
  onCatalogue: (timed: boolean) => void;
  onParadox: () => void;
  onCase: (i: number) => void;
}) {
  const decks: DeckKind[] = ["mixed", ...KIND_ORDER];
  const sealsTotal = CASES.reduce((n, c) => n + (saved.cases[c.id] ?? 0), 0);
  return (
    <section className="tt2-menu" aria-labelledby="tt2-menu-title">
      <h1 id="tt2-menu-title" className="tt2-h1">
        Choose a mission
      </h1>
      <div className="tt2-modes">
        <article className="tt2-mode">
          <h2 className="tt2-mode-title">Catalogue</h2>
          <p>Put cards from your hand on the timeline. 10 points for each right answer, minus 10 for a wrong one.</p>
          <fieldset className="tt2-decks">
            <legend>Which cards?</legend>
            {decks.map((k) => {
              const list = deckFor(k, classicsOnly);
              return (
                <label key={k} className="tt2-deck">
                  <input type="radio" name="tt2-deck" checked={deckKind === k} onChange={() => setDeckKind(k)} />
                  <span className="tt2-deck-name">{k === "mixed" ? "Everything" : KINDS[k].plural}</span>
                  <span className="tt2-deck-meta">
                    {list.length} · {span(list)}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <label className="tt2-check">
            <input type="checkbox" checked={classicsOnly} onChange={(e) => setClassicsOnly(e.target.checked)} />
            <span>Classics only (untick for the deep cuts)</span>
          </label>
          <div className="tt2-actions">
            <button type="button" className="tt2-btn" onClick={() => onCatalogue(true)}>
              {ROUND_SECONDS} seconds ▶
            </button>
            <button type="button" className="tt2-btn tt2-btn-ghost" onClick={() => onCatalogue(false)}>
              Relaxed: {RELAXED_CARDS} cards, no clock
            </button>
          </div>
          <p className="tt2-best">
            Best: {saved.best.timed ?? 0} timed · {saved.best.relaxed ?? 0} relaxed
          </p>
        </article>

        <article className="tt2-mode">
          <h2 className="tt2-mode-title">Paradox Repair</h2>
          <p>
            A saboteur moved some cards and hid every year. Put them back within a few moves, then stabilise. Three
            paradoxes and the continuum gives way.
          </p>
          <div className="tt2-actions">
            <button type="button" className="tt2-btn" onClick={onParadox}>
              Repair the timeline ▶
            </button>
          </div>
          <p className="tt2-best">Best: {saved.best.paradox ?? 0} anomalies repaired</p>
        </article>

        <article className="tt2-mode">
          <h2 className="tt2-mode-title">Archivist&apos;s Challenge</h2>
          <p>Six case files with no years at all. The clues are enough, if you read them carefully.</p>
          <ol className="tt2-cases">
            {CASES.map((c, i) => {
              const got = saved.cases[c.id] ?? 0;
              return (
                <li key={c.id}>
                  <button type="button" className="tt2-case" onClick={() => onCase(i)}>
                    <span>{c.title}</span>
                    <span className="tt2-case-seals" aria-label={got ? `solved with ${got} of 3 seals` : "not solved yet"}>
                      <span aria-hidden="true">{got ? "●".repeat(got) + "○".repeat(3 - got) : "○○○"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="tt2-best">
            {sealsTotal} of {CASES.length * 3} seals
          </p>
        </article>
      </div>
      <p className="tt2-source">
        Years are first publication, first performance, the year a painting was finished or a film came out. Most come
        from{" "}
        <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">
          Wikidata<span className="tt2-sr"> (opens in a new tab)</span>
        </a>
        , the rest were checked by hand. The pixel pictures are drawn by code and never hint at the year. Wren&apos;s
        tales are made up; Time Capsule facts are not, and each one links to its source.
      </p>
    </section>
  );
}

/* --------------------------------------------------------------------------------------------- the timeline */

function Rail({
  items,
  showYear,
  marks,
  active,
  activeFrom,
  canPick,
  picked,
  focusToken,
  center,
  showMap,
  onPick,
  onDragFrom,
  onDragEnd,
  onPlace,
}: {
  items: Card[];
  showYear: (c: Card) => boolean;
  marks: Record<string, Status>;
  active: string | null;
  activeFrom: "hand" | "rail";
  canPick: boolean;
  picked: string | null;
  focusToken: number;
  center: { id: string; n: number } | null;
  showMap: boolean;
  onPick: (id: string) => void;
  onDragFrom: (id: string) => void;
  onDragEnd: () => void;
  onPlace: (gap: number) => void;
}) {
  const railRef = useRef<HTMLOListElement>(null);
  const [over, setOver] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const fromIdx = activeFrom === "rail" && active ? items.findIndex((c) => c.id === active) : -1;
  const activeTitle = active ? BY_ID.get(active)?.title : undefined;

  // Centre the card that just moved.
  useEffect(() => {
    const rail = railRef.current;
    const el = center && rail?.querySelector(`[data-item="${CSS.escape(center.id)}"]`);
    if (rail && el) centerIn(rail, el, !reducedMotion());
  }, [center]);

  // After picking with a click or a key, move focus to the gap nearest the middle of the view.
  useEffect(() => {
    if (!focusToken) return;
    const rail = railRef.current;
    if (!rail) return;
    const gaps = [...rail.querySelectorAll<HTMLButtonElement>("[data-gap]")];
    if (!gaps.length) return;
    const r = rail.getBoundingClientRect();
    const mid = (el: Element) => {
      const b = el.getBoundingClientRect();
      return Math.hypot(b.left + b.width / 2 - (r.left + r.width / 2), b.top + b.height / 2 - (r.top + r.height / 2));
    };
    const g = gaps.sort((a, b) => mid(a) - mid(b))[0];
    g.focus({ preventScroll: true });
    centerIn(rail, g, !reducedMotion());
  }, [focusToken]);

  // A vertical mouse wheel scrolls a sideways timeline sideways.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onWheel = (e: WheelEvent) => {
      const sideways = rail.scrollWidth > rail.clientWidth + 1 && rail.scrollHeight <= rail.clientHeight + 1;
      if (sideways && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        rail.scrollLeft += e.deltaY;
      }
    };
    rail.addEventListener("wheel", onWheel, { passive: false });
    return () => rail.removeEventListener("wheel", onWheel);
  }, []);

  const onScroll = () => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setProgress(max > 0 ? rail.scrollLeft / max : 0);
  };

  const onRailKey = (e: ReactKeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.dataset.gap) return;
    const gaps = [...(railRef.current?.querySelectorAll<HTMLButtonElement>("[data-gap]") ?? [])];
    const i = gaps.indexOf(target as HTMLButtonElement);
    const next =
      e.key === "ArrowLeft" || e.key === "ArrowUp"
        ? i - 1
        : e.key === "ArrowRight" || e.key === "ArrowDown"
          ? i + 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? gaps.length - 1
              : null;
    if (next === null || !gaps[next]) return;
    e.preventDefault();
    gaps[next].focus({ preventScroll: true });
    if (railRef.current) centerIn(railRef.current, gaps[next], !reducedMotion());
  };

  const onDragOverRail = (e: ReactDragEvent) => {
    const rail = railRef.current;
    if (!rail || !active) return;
    const r = rail.getBoundingClientRect();
    const edge = 70;
    if (e.clientX < r.left + edge) rail.scrollLeft -= 16;
    else if (e.clientX > r.right - edge) rail.scrollLeft += 16;
    if (e.clientY < r.top + edge) rail.scrollTop -= 16;
    else if (e.clientY > r.bottom - edge) rail.scrollTop += 16;
  };

  const describe = (c: Card) => (showYear(c) ? `${c.title} (${c.year})` : c.title);
  const gapLabel = (i: number) => {
    const before = items[i - 1];
    const after = items[i];
    const where = !before
      ? `at the start, before ${describe(after)}`
      : !after
        ? `at the end, after ${describe(before)}`
        : `between ${describe(before)} and ${describe(after)}`;
    return `Place ${activeTitle ?? "the card"} ${where}`;
  };

  const gap = (i: number) => {
    const usable = !!active && !(fromIdx >= 0 && (i === fromIdx || i === fromIdx + 1));
    if (!usable) return <span className="tt2-spacer" aria-hidden="true" />;
    return (
      <button
        type="button"
        data-gap={i}
        className={`tt2-gap${over === i ? " is-over" : ""}`}
        aria-label={gapLabel(i)}
        onClick={() => onPlace(i)}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(i);
        }}
        onDragLeave={() => setOver(null)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(null);
          onPlace(i);
        }}
      >
        <span aria-hidden="true">+</span>
      </button>
    );
  };

  // Overview: one dot per card by year; close dots merge into one.
  const dots = useMemo(() => {
    const lo = 1100;
    const hi = 2030;
    const out: { x: number; ids: string[]; label: string }[] = [];
    for (const c of items) {
      const x = ((c.year - lo) / (hi - lo)) * 100;
      const last = out[out.length - 1];
      if (last && Math.abs(last.x - x) < 1.6) {
        last.ids.push(c.id);
        last.label = `${last.ids.length} cards around ${c.year}`;
      } else out.push({ x, ids: [c.id], label: `${c.title}, ${c.year}` });
    }
    return out;
  }, [items]);

  const scrollToId = (id: string) => {
    const rail = railRef.current;
    const el = rail?.querySelector(`[data-item="${CSS.escape(id)}"]`);
    if (rail && el) centerIn(rail, el, !reducedMotion());
  };

  return (
    <div className="tt2-railwrap">
      <div className="tt2-railrow">
        <button
          type="button"
          className="tt2-btn tt2-btn-ghost tt2-scroll"
          aria-label="Scroll to older"
          onClick={() => railRef.current?.scrollBy({ left: -320, behavior: reducedMotion() ? "auto" : "smooth" })}
        >
          ‹
        </button>
        <ol
          ref={railRef}
          className={`tt2-rail${active ? " is-placing" : ""}`}
          aria-label="Timeline, oldest first"
          onScroll={onScroll}
          onKeyDown={onRailKey}
          onDragOver={onDragOverRail}
        >
          {items.map((c, i) => {
            const status = marks[c.id];
            const cls = `tt2-card k-${c.kind}${status ? ` is-${status}` : ""}${picked === c.id ? " is-picked" : ""}`;
            return (
              <li key={c.id} className="tt2-slot" data-item={c.id}>
                {gap(i)}
                {canPick ? (
                  <button
                    type="button"
                    data-card={c.id}
                    className={`${cls} is-movable`}
                    aria-pressed={picked === c.id}
                    aria-label={`${describe(c)}, ${KINDS[c.kind].label}, ${c.creator}. Place ${i + 1} of ${items.length}. Pick up to move.`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", c.id);
                      e.dataTransfer.effectAllowed = "move";
                      onDragFrom(c.id);
                    }}
                    onDragEnd={onDragEnd}
                    onClick={() => onPick(c.id)}
                  >
                    <CardFace card={c} showYear={showYear(c)} status={status} />
                  </button>
                ) : (
                  <div className={cls} data-card={c.id} tabIndex={-1}>
                    <CardFace card={c} showYear={showYear(c)} status={status} />
                  </div>
                )}
              </li>
            );
          })}
          <li className="tt2-slot is-end">{gap(items.length)}</li>
        </ol>
        <button
          type="button"
          className="tt2-btn tt2-btn-ghost tt2-scroll"
          aria-label="Scroll to newer"
          onClick={() => railRef.current?.scrollBy({ left: 320, behavior: reducedMotion() ? "auto" : "smooth" })}
        >
          ›
        </button>
      </div>
      <div className="tt2-under">
        {showMap ? (
          <div className="tt2-map" role="group" aria-label="Overview by year">
            {[1200, 1400, 1600, 1800, 2000].map((y) => (
              <span key={y} className="tt2-map-tick" style={{ left: `${((y - 1100) / 930) * 100}%` }} aria-hidden="true">
                {y}
              </span>
            ))}
            {dots.map((d) => (
              <button
                key={d.ids[0]}
                type="button"
                className={`tt2-dot${d.ids.length > 1 ? " is-group" : ""}`}
                style={{ left: `${d.x}%` }}
                aria-label={`Show ${d.label}`}
                onClick={() => scrollToId(d.ids[0])}
              >
                {d.ids.length > 1 && <span aria-hidden="true">{d.ids.length}</span>}
              </button>
            ))}
          </div>
        ) : (
          <p className="tt2-map-off">Years are hidden until you finish.</p>
        )}
        <input
          className="tt2-scrub"
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          aria-label="Scroll the timeline"
          onChange={(e) => {
            const rail = railRef.current;
            if (rail) rail.scrollLeft = (Number(e.target.value) / 1000) * (rail.scrollWidth - rail.clientWidth);
          }}
        />
      </div>
    </div>
  );
}

/* --------------------------------------------------------------------------------------------- card */

const Art = memo(function Art({ id, kind, motif }: { id: string; kind: Kind; motif?: Motif }) {
  const rects = cardArt(id, kind, motif);
  return (
    <svg viewBox="0 0 48 30" aria-hidden="true" focusable="false" shapeRendering="crispEdges" preserveAspectRatio="xMidYMid slice">
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} />
      ))}
    </svg>
  );
});

const STATUS_TEXT: Partial<Record<Status, string>> = {
  misfiled: "Misfiled",
  bad: "Out of order",
  hint: "Moved by the saboteur",
  new: "Just filed",
};

function CardFace({ card, showYear, status }: { card: Card; showYear: boolean; status?: Status }) {
  const flag = status && STATUS_TEXT[status];
  return (
    <>
      {card.fame >= 90 && (
        <span className="tt2-treasure" title="Archive treasure: one of the best-known works">
          <span aria-hidden="true">★</span>
          <span className="tt2-sr">Archive treasure. </span>
        </span>
      )}
      <span className="tt2-art">
        <Art id={card.id} kind={card.kind} motif={card.motif} />
      </span>
      <span className="tt2-meta">
        <span className="tt2-kind">{KINDS[card.kind].label}</span>
        {showYear ? (
          <span className="tt2-year">{card.year}</span>
        ) : (
          <span className="tt2-year is-hidden" aria-hidden="true">
            ????
          </span>
        )}
      </span>
      <span className="tt2-title">{card.title}</span>
      <span className="tt2-by">
        <span className="tt2-sr">{KINDS[card.kind].by} </span>
        {card.creator}
      </span>
      {flag && <span className={`tt2-flag is-${status}`}>{flag}</span>}
    </>
  );
}

/* --------------------------------------------------------------------------------------------- Wren's face */

const FACE_BASE = [
  "......hhhhhhhh......",
  "....hhhhhhhhhhhh....",
  "...hkggggkkggggkh...",
  "...hkgGGgkkgGGgkh...",
  "...hhggggssgggghh...",
  "...hssssssssssssh...",
  "...hsseesssseessh...",
  "...hsseesssseessh...",
  "...hSssssssssssSh...",
  "....SsssmmmmsssS....",
  "....SSssssssssSS....",
  ".....SSSssssSSS.....",
  "....cccccSScccccc...",
  "...cccCCccccCCccc...",
  "..jjccccjjjjCCCcjj..",
  ".jjjjjjjjbjjjcccjjj.",
  ".jjjjjjjjjjjjcccjjj.",
  ".JjjjjjjjbjjjjCCjjJ.",
  ".JJjjjjjjjjjjjCCjJJ.",
  ".JJJjjjjjjjjjjjjJJJ.",
];
const FACE_MOOD: Record<Mood, Record<number, string>> = {
  calm: {},
  happy: { 6: "...hsseesssseessh...", 7: "...hsSSsssssSSssh...", 9: "....SssmssssmssS....", 10: "....SSssmmmmssSS...." },
  worried: { 5: "...hsHHssssHHssh....", 9: "....SssssssssssS....", 10: "....SSsmmmmmmsSS...." },
};
const FACE_COLORS: Record<string, string> = {
  h: "#7a4426",
  H: "#3a2418",
  k: "#3a2418",
  g: "#d9a441",
  G: "#9be8ff",
  s: "#f2c9a0",
  S: "#d9a27c",
  e: "#1d160c",
  m: "#9b4a42",
  c: "#5ec4b6",
  C: "#3a8f84",
  j: "#2b3b6b",
  J: "#1a2444",
  b: "#ffe2a0",
};

function WrenFace({ mood }: { mood: Mood }) {
  const rows = FACE_BASE.map((r, i) => FACE_MOOD[mood][i] ?? r);
  const rects: { x: number; y: number; w: number; c: string }[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let w = 1;
      while (row[x + w] === ch) w++;
      if (FACE_COLORS[ch]) rects.push({ x, y, w, c: FACE_COLORS[ch] });
      x += w;
    }
  });
  return (
    <span className={`tt2-face is-${mood}`}>
      <svg viewBox="0 0 20 20" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.c} />
        ))}
      </svg>
    </span>
  );
}

/* --------------------------------------------------------------------------------------------- checks */

/**
 * How many orders satisfy all clues of a case? Must be 1 for every case.
 * Run in a test, e.g. expect(CASES.every((c) => solveCount(c) === 1)).toBe(true).
 */
export function solveCount(cf: CaseFile) {
  const list = cf.ids.map((id) => BY_ID.get(id)).filter((c): c is Card => !!c);
  let n = 0;
  const perm = (rest: Card[], acc: Card[]) => {
    if (!rest.length) {
      if (cf.clues.every((cl) => ruleHolds(cl.rule, acc))) n++;
      return;
    }
    rest.forEach((c, i) => perm([...rest.slice(0, i), ...rest.slice(i + 1)], [...acc, c]));
  };
  perm(list, []);
  return n;
}
export { CASES as TIME_TRAVELLER_CASES, FACTS as TIME_TRAVELLER_FACTS };

/* ============================================================================================= styles */

const STYLES = `
.tt2{--night:#0a0f22;--deck:#111a36;--line:#2a3766;--brass:#d9a441;--brass-d:#7a5212;--brass-l:#ffe2a0;--teal:#5ec4b6;
 --red:#ff8a7a;--paper:#f6ead0;--ink:#1d160c;--muted:#aab1c5;
 font-family:var(--tt-text),system-ui,sans-serif;font-size:16px;line-height:1.45;color:#f3eee2;
 position:relative;display:flex;flex-direction:column;gap:10px;padding:12px;
 height:clamp(600px,calc(100dvh - 24px),880px);overflow:hidden;border-radius:16px;
 background:radial-gradient(120% 80% at 50% -10%,#26305e 0,var(--night) 60%),var(--night);
 box-shadow:0 0 0 1px #ffffff14 inset,0 0 0 3px var(--brass-d),0 0 0 4px #1c100a,0 18px 40px #0008;scroll-margin-top:12px}
.tt2 *,.tt2 *::before,.tt2 *::after{box-sizing:border-box}
.tt2 :is(h1,h2,p,ol,ul,dl,dd,fieldset){margin:0;padding:0}
.tt2 :is(ol,ul){list-style:none}
.tt2 a{color:var(--brass-l);text-underline-offset:3px}
.tt2 :focus-visible{outline:3px solid #fff;outline-offset:3px}
.tt2-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.tt2-h1{font:800 clamp(22px,3vw,30px)/1.15 var(--tt-display),system-ui,sans-serif;letter-spacing:-.02em;color:var(--brass-l)}
.tt2-h1:focus{outline:none}
.tt2-h2{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;font:700 15px/1.2 var(--tt-display),sans-serif;color:var(--brass-l)}
.tt2-h2-note{font:400 14px/1.3 var(--tt-text),sans-serif;color:var(--muted)}

/* buttons */
.tt2-btn{font:700 15px/1 var(--tt-display),sans-serif;letter-spacing:-.005em;min-height:40px;padding:10px 16px;border:0;border-radius:8px;cursor:pointer;
 color:var(--ink);background:linear-gradient(#ffe7ad,#e0ab4a);box-shadow:inset 0 1px 0 #fff8,0 3px 0 var(--brass-d),0 5px 10px #0006}
.tt2-btn:hover{filter:brightness(1.06)}
.tt2-btn:active{transform:translateY(2px);box-shadow:inset 0 1px 0 #fff8,0 1px 0 var(--brass-d)}
.tt2-btn-ghost{color:#f3eee2;background:#1a2447;box-shadow:inset 0 0 0 1px #ffffff1f,0 3px 0 #05070f}
.tt2-btn-ghost[aria-pressed=true]{background:#2e3c70}
.tt2-btn:disabled{opacity:.45;cursor:default;filter:none;transform:none}
.tt2-badge{margin-left:6px;padding:2px 7px;border-radius:99px;font-size:12px;background:#ffffff1a}
.tt2-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center}

/* bar */
.tt2-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 18px;padding:8px 10px 8px 14px;border-radius:10px;
 background:linear-gradient(#3e2717,#2b1a10);box-shadow:inset 0 0 0 1px #00000080,inset 0 0 0 2px var(--brass-d),inset 0 1px 0 3px #ffffff0d}
.tt2-brand{font:800 20px/1 var(--tt-display),sans-serif;letter-spacing:-.02em;color:var(--brass-l)}
.tt2-brand-mode{font-weight:500;color:#e8d6b0}
.tt2-stats{display:flex;flex-wrap:wrap;gap:6px 18px}
.tt2-stat{display:flex;align-items:baseline;gap:6px}
.tt2-stat dt{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#d8c49a}
.tt2-stat dd{font:800 18px/1 var(--tt-display),sans-serif;font-variant-numeric:tabular-nums;color:#fff}
.tt2-stat.is-low dd{color:var(--red)}
.tt2-cells{display:flex;gap:4px;align-self:center}
.tt2-cells span{width:14px;height:14px;border-radius:3px;background:#ffffff1c;box-shadow:inset 0 0 0 1px #ffffff2a}
.tt2-cells span.is-on{background:linear-gradient(#9ef0e4,var(--teal));box-shadow:0 0 8px #5ec4b680}
.tt2-seals{letter-spacing:2px;color:var(--brass-l)!important}
.tt2-bar-actions{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px}

/* Wren */
.tt2-wren{display:flex;align-items:center;gap:12px}
.tt2-face{flex:none;width:72px;height:72px;border-radius:50%;padding:8px;background:radial-gradient(circle at 50% 40%,#33457f,#18224a);
 box-shadow:0 0 0 3px var(--brass),0 0 0 5px #1c100a,0 6px 14px #0008}
.tt2-face svg{display:block;width:100%;height:100%;image-rendering:pixelated}
.tt2-speech{position:relative;flex:1;min-width:0;padding:9px 14px;border-radius:10px;color:var(--ink);background:var(--paper);box-shadow:0 4px 0 #0005}
.tt2-speech::before{content:"";position:absolute;left:-8px;top:50%;margin-top:-8px;border:8px solid transparent;border-right-color:var(--paper);border-left:0}
.tt2-speech strong{color:#1c5d55}
.tt2-speech a{color:#174a86}
.tt2-tale{margin-top:4px!important;font-size:14px;color:#5d4c36}
.tt2-tale span{font-weight:700}
.tt2-tip{flex:none}

/* menu */
.tt2-menu{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:14px;padding:4px 2px 6px}
.tt2-modes{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;align-items:start}
.tt2-mode{display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:12px;background:#111a36;box-shadow:inset 0 0 0 1px var(--line)}
.tt2-mode-title{font:800 20px/1.1 var(--tt-display),sans-serif;letter-spacing:-.02em;color:var(--brass-l)}
.tt2-mode p{color:#d9dceb}
.tt2-decks{border:0;display:grid;gap:4px}
.tt2-decks legend{margin-bottom:4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.tt2-deck,.tt2-check{display:flex;align-items:center;gap:10px;min-height:36px;padding:4px 10px;border-radius:8px;cursor:pointer;background:#0c1430}
.tt2-deck:has(input:checked){box-shadow:inset 0 0 0 2px var(--brass)}
.tt2-deck input,.tt2-check input{width:18px;height:18px;flex:none;accent-color:var(--brass)}
.tt2-deck-name{font-weight:700}
.tt2-deck-meta{margin-left:auto;font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
.tt2-best{font-size:14px;color:var(--brass-l)}
.tt2-cases{display:grid;gap:6px}
.tt2-case{display:flex;width:100%;justify-content:space-between;gap:10px;align-items:center;min-height:40px;padding:8px 12px;border:0;border-radius:8px;cursor:pointer;
 font:700 15px/1.2 var(--tt-display),sans-serif;text-align:left;color:#f3eee2;background:#0c1430;box-shadow:inset 0 0 0 1px var(--line)}
.tt2-case:hover{box-shadow:inset 0 0 0 2px var(--brass)}
.tt2-case-seals{color:var(--brass-l);letter-spacing:2px;flex:none}
.tt2-source{font-size:13px;color:var(--muted);max-width:80ch}

/* stage + rail */
.tt2-stage{flex:1;min-height:0;display:flex;flex-direction:column;border-radius:12px;
 background:linear-gradient(#0d1430,#141e40);box-shadow:inset 0 0 0 1px #00000080,inset 0 0 0 2px var(--brass-d),inset 0 0 40px #0007}
.tt2-paused{margin:auto!important;font:700 20px var(--tt-display),sans-serif;color:var(--brass-l)}
.tt2-railwrap{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:6px 6px 8px}
.tt2-railrow{flex:1;min-height:0;display:flex;align-items:center;gap:6px}
.tt2-scroll{flex:none;width:40px;padding:0;font-size:22px}
.tt2-rail{flex:1;min-width:0;align-self:stretch;display:flex;align-items:flex-end;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;
 padding:18px max(16px,calc(50% - 80px)) 30px;scroll-snap-type:x proximity;
 background:
  linear-gradient(transparent calc(100% - 19px),#ffffff12 0 calc(100% - 18px),var(--brass-d) 0 calc(100% - 16px),var(--brass) 0 calc(100% - 13px),#5a3c0d 0 calc(100% - 11px),transparent 0),
  repeating-linear-gradient(90deg,transparent 0 31px,#ffffff10 0 32px);
 background-attachment:local,local}
.tt2-rail::-webkit-scrollbar{display:none}
.tt2-slot{flex:none;display:flex;align-items:flex-end;position:relative;scroll-snap-align:center}
.tt2-slot:not(.is-end)>.tt2-card::after{content:"";position:absolute;left:50%;bottom:-24px;width:11px;height:11px;margin-left:-5px;transform:rotate(45deg);
 background:var(--brass-l);box-shadow:0 0 0 2px #5a3c0d}
.tt2-spacer{width:14px;flex:none}
.tt2-gap{flex:none;width:46px;height:150px;margin:0 3px;border:2px dashed var(--teal);border-radius:10px;cursor:pointer;
 font:700 24px var(--tt-display),sans-serif;color:var(--teal);background:#5ec4b61a}
.tt2-gap:hover,.tt2-gap:focus-visible,.tt2-gap.is-over{border-style:solid;color:var(--ink);background:var(--teal);box-shadow:0 0 18px #5ec4b699}
.tt2-under{display:flex;flex-direction:column;gap:2px;padding:0 50px}
.tt2-map{position:relative;height:28px;margin-top:4px;border-bottom:2px solid #7a521299}
.tt2-map-tick{position:absolute;top:0;transform:translateX(-50%);font-size:11px;color:var(--muted)}
.tt2-dot{position:absolute;bottom:-9px;width:22px;height:22px;margin-left:-11px;padding:0;border:0;border-radius:50%;cursor:pointer;background:transparent}
.tt2-dot::before{content:"";position:absolute;inset:6px;border-radius:50%;background:var(--brass-l);box-shadow:0 0 0 2px #5a3c0d}
.tt2-dot.is-group::before{inset:3px;background:var(--brass)}
.tt2-dot span{position:relative;font:700 10px/22px var(--tt-display),sans-serif;color:var(--ink)}
.tt2-map-off{font-size:13px;color:var(--muted);text-align:center}
.tt2-scrub{width:100%;accent-color:var(--brass);height:22px;margin:0}

/* card */
.tt2-card{--k:#555;position:relative;flex:none;width:142px;display:flex;flex-direction:column;gap:5px;padding:6px 6px 8px;border:0;border-radius:9px;
 font:inherit;text-align:left;color:var(--ink);cursor:default;
 background:radial-gradient(120% 70% at 50% 0%,#fffaf0 0,#fffaf000 65%),repeating-linear-gradient(0deg,#7a5a2a0b 0 1px,transparent 1px 3px),var(--paper);
 box-shadow:inset 0 0 0 1px #7a521259,inset 0 0 0 4px var(--paper),inset 0 0 0 5px #7a52122b,0 2px 0 #2b1600,0 8px 16px #0007}
.k-book{--k:#7a1f2b}.k-art{--k:#8a5a12}.k-music{--k:#1f4a7a}.k-stage{--k:#5a1a4a}.k-film{--k:#2d3340}
.tt2-art{position:relative;display:block;overflow:hidden;border-radius:5px;border-bottom:4px solid var(--k);background:#222}
.tt2-art svg{display:block;width:100%;aspect-ratio:48/30;height:auto;image-rendering:pixelated}
.tt2-art::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;
 background:linear-gradient(180deg,#ffffff24,#ffffff00 38%);box-shadow:inset 0 0 0 1px #0000004d,inset 0 -8px 12px #0000002e}
.tt2-meta{display:flex;align-items:center;justify-content:space-between;gap:4px}
.tt2-kind{padding:3px 6px 2px;border-radius:4px;font:700 10.5px/1 var(--tt-display),sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--k)}
.tt2-year{padding:3px 7px;border-radius:5px;font:800 15px/1 var(--tt-display),sans-serif;font-variant-numeric:tabular-nums;color:#5b3a07;
 background:linear-gradient(#f6e2a8,#e3c47a);box-shadow:inset 0 -1px 0 #0000002a,0 1px 0 #fff8}
.tt2-year.is-hidden{color:#8a7350;background:none;box-shadow:none;border:1.5px dashed #b59a66;padding:2px 6px}
.tt2-title{font:700 14.5px/1.2 var(--tt-display),sans-serif;letter-spacing:-.01em;overflow-wrap:anywhere;hyphens:auto}
.tt2-by{margin-top:auto;padding-top:5px;border-top:1px dotted #5a4a3573;font-size:12.5px;line-height:1.25;color:#5d4c36}
.tt2-treasure{position:absolute;z-index:2;top:-8px;right:-8px;display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font-size:12px;color:#5b3a07;
 background:radial-gradient(circle at 35% 30%,#fff1c0,#d9a441 60%,#7a5212);box-shadow:0 2px 0 #0006}
.tt2-flag{position:absolute;z-index:2;left:-6px;top:10px;padding:3px 8px;border-radius:4px;font:700 11px/1 var(--tt-display),sans-serif;letter-spacing:.04em;
 text-transform:uppercase;color:#fff;background:#b3261e;box-shadow:0 2px 0 #0006}
.tt2-flag.is-new{background:#1f7a6e}
.tt2-flag.is-hint{background:#8a5a12}
.tt2-card.is-misfiled,.tt2-card.is-bad{box-shadow:inset 0 0 0 1px #7a521259,inset 0 0 0 4px var(--paper),0 0 0 3px var(--red),0 8px 16px #0007}
.tt2-card.is-new,.tt2-card.is-ok{box-shadow:inset 0 0 0 1px #7a521259,inset 0 0 0 4px var(--paper),0 0 0 3px var(--teal),0 8px 16px #0007}
.tt2-card.is-hint{box-shadow:inset 0 0 0 1px #7a521259,inset 0 0 0 4px var(--paper),0 0 0 3px var(--brass),0 0 18px #d9a44188}
.tt2-card.is-hand,.tt2-card.is-movable{cursor:grab}
@media (hover:hover){.tt2-card.is-hand:hover .tt2-title,.tt2-card.is-movable:hover .tt2-title{text-decoration:underline;text-underline-offset:3px}}
.tt2-card.is-picked{background:linear-gradient(#fff1c8,#f6dc98);box-shadow:0 0 0 3px #fff,0 0 0 6px var(--brass),0 0 26px #ffd27a99,0 10px 18px #0008}
.tt2-card.is-picked::before{content:"Picked";position:absolute;z-index:3;left:8px;top:8px;padding:2px 7px;border-radius:4px;font:700 11px/1.3 var(--tt-display),sans-serif;color:var(--ink);background:var(--brass-l);box-shadow:0 0 0 2px var(--ink)}
.tt2-card:disabled{opacity:.6;cursor:default}

/* dock */
.tt2-dock{flex:none;display:flex;flex-direction:column;gap:8px;padding:10px 12px 12px;border-radius:12px;
 background:linear-gradient(#3a2416,#28180e);box-shadow:inset 0 0 0 1px #00000080,inset 0 0 0 2px var(--brass-d)}
.tt2-hand{display:flex;justify-content:center;gap:16px;padding-top:4px}
.tt2-clues{display:grid;gap:4px;max-height:132px;overflow:auto}
.tt2-clues li{display:flex;gap:8px;align-items:baseline;padding:5px 10px;border-radius:6px;background:#0000002e;color:#f3eee2}
.tt2-clues li>span:first-child{flex:none;width:14px;font-weight:700;color:var(--muted)}
.tt2-clues li.is-ok{background:#1f7a6e33}
.tt2-clues li.is-ok>span:first-child{color:var(--teal)}

/* over + capsule */
.tt2-over{flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:12px 20px}
.tt2-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;max-width:640px}
.tt2-summary .tt2-stat{flex-direction:column;gap:4px;padding:12px 14px;border-radius:10px;background:var(--deck);box-shadow:inset 0 0 0 1px var(--line)}
.tt2-summary .tt2-stat dd{font-size:26px;color:var(--brass-l)}
.tt2-over-note{font-size:18px}
.tt2-dialog{width:min(640px,94vw);max-height:86vh;padding:20px 22px;border:0;border-radius:14px;color:var(--ink);background:var(--paper);
 font-family:var(--tt-text),system-ui,sans-serif;box-shadow:0 0 0 4px var(--brass),0 20px 50px #000a}
.tt2-dialog::backdrop{background:#05081acc}
.tt2-dialog .tt2-h1{color:#5b3a07}
.tt2-dialog-lead{margin:6px 0 14px;color:#5d4c36}
.tt2-facts{display:grid;gap:12px;margin:0 0 16px;padding:0;list-style:none}
.tt2-facts li{padding:10px 12px;border-radius:8px;background:#fffaf0;box-shadow:inset 0 0 0 1px #7a521240}
.tt2-facts p{margin:0 0 4px}
.tt2-fact-head span{color:#7a5212}
.tt2-facts a{color:#174a86;font-size:14px}

@media (prefers-reduced-motion:no-preference){
 .tt2-card{transition:transform .14s steps(2),box-shadow .14s}
 @media (hover:hover){.tt2-card.is-hand:hover,.tt2-card.is-movable:hover{transform:translateY(-4px)}}
 .tt2-card.is-picked{transform:translateY(-8px)}
 .tt2-card.is-new{animation:tt2-drop .32s steps(4)}
 .tt2-card.is-misfiled.is-new{animation:none}
}
@keyframes tt2-drop{from{transform:translateY(-14px)}}
@media (forced-colors:active){
 .tt2-card,.tt2-gap,.tt2-speech{border:2px solid CanvasText}
 .tt2-card.is-picked{border-width:5px}
 .tt2-kind,.tt2-flag{border:1px solid CanvasText}
}

/* below 600 px the timeline turns vertical: no sideways scrolling (WCAG 1.4.10) */
@media (max-width:600px){
 .tt2{height:clamp(560px,calc(100dvh - 16px),900px);padding:8px;gap:8px;border-radius:12px}
 .tt2-bar{display:grid;grid-template-columns:1fr auto;gap:6px 8px;padding:6px 8px}
 .tt2-brand{font-size:17px}.tt2-brand-mode,.tt2-wide{display:none}
 .tt2-stats{grid-column:1/-1;order:3;gap:4px 14px}
 .tt2-bar-actions{margin-left:0;flex-wrap:nowrap;gap:6px}
 .tt2-bar-actions .tt2-btn{min-height:36px;padding:8px 10px;font-size:14px}
 .tt2-wren{display:grid;grid-template-columns:48px 1fr;gap:6px 10px;align-items:start}
 .tt2-face{width:48px;height:48px;padding:5px}
 .tt2-speech{font-size:14.5px;padding:7px 10px;max-height:96px;overflow:auto}
 .tt2-speech::before{top:22px}
 .tt2-tip{grid-column:2;justify-self:end;min-height:32px;padding:6px 12px;font-size:13px}
 .tt2-scroll,.tt2-under{display:none}
 .tt2-railwrap{padding:4px}
 .tt2-rail{flex-direction:column;align-items:stretch;overflow-x:hidden;overflow-y:auto;scroll-snap-type:y proximity;padding:10px 10px 10px 28px;
  background:linear-gradient(90deg,transparent 9px,var(--brass-d) 9px 11px,var(--brass) 11px 14px,#5a3c0d 14px 16px,transparent 16px)}
 .tt2-slot{flex-direction:column;align-items:stretch}
 .tt2-slot:not(.is-end)>.tt2-card::after{left:-23px;top:50%;bottom:auto;margin:-5px 0 0}
 .tt2-spacer{width:auto;height:8px}
 .tt2-gap{width:auto;height:40px;margin:3px 0}
 .tt2-rail .tt2-card{width:100%;display:grid;grid-template-columns:76px 1fr;grid-template-areas:"art meta" "art title" "art by";column-gap:10px;row-gap:2px;align-items:start}
 .tt2-rail .tt2-art{grid-area:art;align-self:center}
 .tt2-rail .tt2-meta{grid-area:meta;justify-content:flex-start;gap:8px}
 .tt2-rail .tt2-title{grid-area:title}
 .tt2-rail .tt2-by{grid-area:by;border:0;padding:0}
 .tt2-hand{justify-content:flex-start;gap:8px;overflow-x:auto;padding:12px 4px 6px}
 .tt2-hand .tt2-card{width:100px}
 .tt2-hand .tt2-title{font-size:13px}
 .tt2-hand .tt2-by{display:none}
 .tt2-clues{max-height:110px;font-size:14px}
 .tt2-dock{padding:8px}
 .tt2-dock .tt2-h2-note{display:none}
}
@media (max-height:640px) and (min-width:601px){
 .tt2-card{width:128px}
 .tt2-hand .tt2-art{display:none}
 .tt2-under{display:none}
}
`;
