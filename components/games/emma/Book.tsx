"use client";

import { useEffect, useState } from "react";
import { CATEGORY, type Category, type Scenario } from "@/content/games/emma/types";
import { ClueFace } from "./ClueCard";
import type { GameState } from "./state";

type Filter = "all" | "new" | `cat:${Category}` | `who:${string}`;

/** The commonplace book: every clue you have, always at hand, sorted by person or by kind. */
export function Book({ sc, s, onRead }: { sc: Scenario; s: GameState; onRead: (ids: string[]) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const fresh = s.found.filter((id) => !s.read.includes(id));
  const [wasNew] = useState(() => new Set(fresh));
  useEffect(() => {
    onRead(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = (id: string) => sc.clues.find((c) => c.id === id)!;
  const list = [...s.found].reverse().filter((id) => {
    const c = byId(id);
    if (filter === "all") return true;
    if (filter === "new") return wasNew.has(id);
    if (filter.startsWith("cat:")) return c.cat === filter.slice(4);
    return c.about.includes(filter.slice(4));
  });
  const cats = (Object.keys(CATEGORY) as Category[]).filter((k) => s.found.some((id) => byId(id).cat === k));

  const chip = (f: Filter, label: string) => (
    <button key={f} type="button" className="em-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
      {label}
    </button>
  );

  return (
    <div className="em-book">
      <h2 id="em-book-title" className="em-h2">
        Your commonplace book
      </h2>
      <p className="em-muted">{s.found.length} clues. The last line of a clue is Emma&apos;s idea of where to go next.</p>
      <div className="em-chips" role="group" aria-label="Show">
        {chip("all", "All")}
        {wasNew.size > 0 && chip("new", `New (${wasNew.size})`)}
      </div>
      <div className="em-chips" role="group" aria-label="Clues about">
        {sc.people.map((p) => chip(`who:${p.id}`, p.short))}
      </div>
      <div className="em-chips" role="group" aria-label="Kind of clue">
        {cats.map((k) => chip(`cat:${k}`, `${CATEGORY[k].icon} ${CATEGORY[k].label}`))}
      </div>
      {list.length === 0 ? (
        <p className="em-muted">Nothing here yet.</p>
      ) : (
        <ul className="em-clue-list">
          {list.map((id) => (
            <li key={id}>
              <ClueFace clue={byId(id)} fresh={wasNew.has(id)} showNext />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
