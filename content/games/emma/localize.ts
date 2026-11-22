import type { Scenario } from "./types";

/** The fields that hold words a player reads. Ids, flags and clue references are never touched. */
const TEXT = new Set([
  "text", "next", "name", "short", "role", "idle", "wait", "hint", "remind", "label", "title", "intro", "verse", "extra",
  "answer", "strips", "blurb", "away", "q", "options", "from", "good", "say", "plot", "reveal", "mapName", "book",
]);

function walk(o: unknown, key: string | null, table: Record<string, string>): unknown {
  if (typeof o === "string") return key && TEXT.has(key) ? (table[o] ?? o) : o;
  if (Array.isArray(o)) return o.map((x) => walk(x, key, table));
  if (o && typeof o === "object") return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v, k, table)]));
  return o; // numbers, booleans and the tutorial's `done` functions
}

/** The same scenario, with every line a player reads swapped for its translation (where there is one). */
export function localize(sc: Scenario, table: Record<string, string>): Scenario {
  return walk(sc, null, table) as Scenario;
}

/** Lines that have no translation yet: handy in a test. */
export function untranslated(sc: Scenario, table: Record<string, string>): string[] {
  const out: string[] = [];
  const scan = (o: unknown, key: string | null) => {
    if (typeof o === "string") {
      if (key && TEXT.has(key) && o.trim() && !(o in table) && !out.includes(o)) out.push(o);
    } else if (Array.isArray(o)) o.forEach((x) => scan(x, key));
    else if (o && typeof o === "object") Object.entries(o).forEach(([k, v]) => scan(v, k));
  };
  scan(sc, null);
  return out;
}
