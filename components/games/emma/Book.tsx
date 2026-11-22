"use client";

import { useEffect, useState } from "react";
import { CATEGORY, type Category, type Scenario } from "@/content/games/emma/types";
import { ClueFace } from "./ClueCard";
import { useT } from "./i18n";
import type { GameState } from "./state";

type Filter = "all" | "new" | `cat:${Category}` | `who:${string}`;

/** The commonplace book: every clue you have, always at hand, sorted by person or by kind. */
export function Book({ sc, s, onRead }: { sc: Scenario; s: GameState; onRead: (ids: string[]) => void }) {
  const T = useT();
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
        {T.book.title}
      </h2>
      <p className="em-muted">{T.book.count(s.found.length)}</p>
      <div className="em-chips" role="group" aria-label={T.book.show}>
        {chip("all", T.book.all)}
        {wasNew.size > 0 && chip("new", T.book.fresh(wasNew.size))}
      </div>
      <div className="em-chips" role="group" aria-label={T.book.about}>
        {sc.people.map((p) => chip(`who:${p.id}`, p.short))}
      </div>
      <div className="em-chips" role="group" aria-label={T.book.kind}>
        {cats.map((k) => chip(`cat:${k}`, `${CATEGORY[k].icon} ${T.cat[k].label}`))}
      </div>
      {list.length === 0 ? (
        <p className="em-muted">{T.book.empty}</p>
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
