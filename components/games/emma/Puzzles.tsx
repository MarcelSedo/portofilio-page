"use client";

import { useMemo, useState } from "react";
import type { Puzzle } from "@/content/games/emma/types";
import { useT } from "./i18n";

/** Compare answers without caring about case or accents: "vrba" counts for "VŔBA". */
const plain = (w: string) => w.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().trim();

/** A fixed shuffle (the same every time), so the puzzle doesn't jump about between renders. */
function shuffle<T>(xs: T[], seed: number) {
  const a = [...xs];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Props = { puzzle: Puzzle; onSolved: () => void; onWrong: () => void };

export function PuzzleView({ puzzle, onSolved, onWrong }: Props) {
  return puzzle.kind === "charade" ? (
    <Charade puzzle={puzzle} onSolved={onSolved} onWrong={onWrong} />
  ) : (
    <TornLetter puzzle={puzzle} onSolved={onSolved} />
  );
}

/** A Regency charade: read the verse, build the word from letter tiles, or type it. */
function Charade({ puzzle, onSolved, onWrong }: Props & { puzzle: Extract<Puzzle, { kind: "charade" }> }) {
  const T = useT();
  const tiles = useMemo(() => shuffle([...(puzzle.answer + puzzle.extra)], puzzle.answer.length * 7 + 3), [puzzle]);
  const [used, setUsed] = useState<number[]>([]); // indexes into tiles, in order
  const [typed, setTyped] = useState("");
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState("");
  const word = typed || used.map((i) => tiles[i]).join("");

  const check = () => {
    if (plain(word) === plain(puzzle.answer)) {
      setMsg("");
      onSolved();
      return;
    }
    setTries((t) => t + 1);
    onWrong();
    setMsg(tries >= 1 ? T.puzzle.hint(puzzle.answer[0]) : T.puzzle.again);
  };

  return (
    <div className="em-puzzle">
      <h2 id="em-puzzle-title" className="em-h2">
        {puzzle.title}
      </h2>
      <p className="em-muted">{puzzle.intro}</p>
      <blockquote className="em-verse">
        {puzzle.verse.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </blockquote>
      <p className="em-slots" aria-label={T.puzzle.letters(puzzle.answer.length)}>
        {[...puzzle.answer].map((_, i) => (
          <button
            key={i}
            type="button"
            className="em-slot"
            disabled={!!typed || i >= used.length}
            onClick={() => setUsed(used.filter((_, k) => k !== i))}
          >
            {typed ? (typed[i] ?? "").toUpperCase() : used[i] !== undefined ? tiles[used[i]] : ""}
            <span className="sr-only">{i < used.length ? T.puzzle.takeBack : T.puzzle.empty}</span>
          </button>
        ))}
      </p>
      <div className="em-tiles" role="group" aria-label={T.puzzle.tiles}>
        {tiles.map((ch, i) => (
          <button
            key={i}
            type="button"
            className="em-tile"
            disabled={!!typed || used.includes(i) || used.length >= puzzle.answer.length}
            onClick={() => setUsed([...used, i])}
          >
            {ch}
          </button>
        ))}
      </div>
      <label className="em-type">
        <span>{T.puzzle.type}</span>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value.replace(/[^\p{L}]/gu, "").slice(0, puzzle.answer.length + 2))}
          onKeyDown={(e) => e.key === "Enter" && check()}
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      <p className="em-puzzle-msg" role="status">
        {msg}
      </p>
      <div className="em-row">
        <button type="button" className="em-btn" onClick={check} disabled={word.length < puzzle.answer.length}>
          {T.puzzle.solve}
        </button>
        <button type="button" className="em-btn is-ghost" onClick={() => (setUsed([]), setTyped(""), setMsg(""))}>
          {T.puzzle.clear}
        </button>
      </div>
    </div>
  );
}

/** The torn letter: put the strips in order by tapping two to swap them, or with the arrow buttons. */
function TornLetter({ puzzle, onSolved }: { puzzle: Extract<Puzzle, { kind: "letter" }>; onSolved: () => void }) {
  const T = useT();
  const [order, setOrder] = useState(() => shuffle(puzzle.strips.map((_, i) => i), 11));
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");

  const commit = (next: number[]) => {
    setOrder(next);
    if (next.every((v, i) => v === i)) {
      setDone(true);
      setMsg(T.puzzle.whole);
      window.setTimeout(onSolved, 900);
    }
  };
  const swap = (a: number, b: number) => {
    const next = [...order];
    [next[a], next[b]] = [next[b], next[a]];
    setPicked(null);
    setMsg(T.puzzle.swapped(a + 1, b + 1));
    commit(next);
  };

  return (
    <div className="em-puzzle">
      <h2 id="em-puzzle-title" className="em-h2">
        {puzzle.title}
      </h2>
      <p className="em-muted">
        {puzzle.intro} {T.puzzle.howTo}
      </p>
      <ol className={`em-strips${done ? " is-done" : ""}`}>
        {order.map((si, pos) => (
          <li key={si} className={`em-strip${picked === pos ? " is-picked" : ""}`} style={{ rotate: done ? "0deg" : `${((si * 37) % 7) - 3}deg` }}>
            <button
              type="button"
              className="em-strip-text"
              aria-pressed={picked === pos}
              disabled={done}
              onClick={() => (picked === null ? setPicked(pos) : picked === pos ? setPicked(null) : swap(picked, pos))}
            >
              {puzzle.strips[si]}
            </button>
            <span className="em-strip-moves">
              <button type="button" disabled={done || pos === 0} onClick={() => swap(pos, pos - 1)}>
                ↑<span className="sr-only">{T.puzzle.up}</span>
              </button>
              <button type="button" disabled={done || pos === order.length - 1} onClick={() => swap(pos, pos + 1)}>
                ↓<span className="sr-only">{T.puzzle.down}</span>
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p className="em-puzzle-msg" role="status">
        {msg}
      </p>
    </div>
  );
}
