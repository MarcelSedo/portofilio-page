"use client";

import { useState } from "react";
import type { Pin } from "../content/board";
import { board, type BoardStrand, type Game } from "../engine/state";
import { Portrait } from "./Portrait";

/**
 * The corkboard. Cards are pinned on a 4-column grid; red string runs between
 * people you know are connected. Tight string = strong tie, dashed = strained,
 * snipped = cut. The picture is decoration: the same facts are in the list below it.
 */
const COL_W = 100;
const ROW_H = 112;
const pos = (p: Pin) => ({ x: 50 + p.col * COL_W, y: 52 + p.row * ROW_H });

export function Corkboard({ g }: { g: Game }) {
  const { pins, strands } = board(g);
  const [sel, setSel] = useState<string | null>(null);
  const byId = Object.fromEntries(pins.map((p) => [p.id, p]));
  const rows = Math.max(1, ...pins.map((p) => p.row + 1));
  const H = rows * ROW_H + 10;
  const shown = sel ? strands.filter((s) => s.a === sel || s.b === sel) : strands;

  if (!pins.length) return <p className="co-empty">The board is bare. Call someone in, and search the Records: connections show up here.</p>;

  return (
    <div>
      <div className="co-cork" style={{ aspectRatio: `400 / ${H}` }}>
        <svg className="co-cork-strings" viewBox={`0 0 400 ${H}`} preserveAspectRatio="none" aria-hidden="true">
          {strands.map((s, i) => {
            const a = byId[s.a];
            const b = byId[s.b];
            if (!a || !b) return null;
            const p1 = pos(a);
            const p2 = pos(b);
            const mx = (p1.x + p2.x) / 2;
            const my = (p1.y + p2.y) / 2 - 40 + 16 + (i % 3) * 16; // strings sag a little, each its own way
            const dim = sel && s.a !== sel && s.b !== sel;
            const cls = `co-string is-${s.state}${dim ? " is-dim" : ""}${s.fresh ? " is-fresh" : ""}`;
            if (s.state === "cut") {
              // two loose ends hanging, with a gap in the middle
              const ax = p1.x, ay = p1.y - 40, bx = p2.x, by = p2.y - 40;
              const e1 = { x: ax + (bx - ax) * 0.36, y: ay + (by - ay) * 0.36 + 28 };
              const e2 = { x: ax + (bx - ax) * 0.64, y: ay + (by - ay) * 0.64 + 28 };
              return (
                <g key={s.id} className={cls}>
                  <path d={`M${ax},${ay} Q${(ax + e1.x) / 2},${(ay + e1.y) / 2 + 6} ${e1.x},${e1.y}`} />
                  <path d={`M${bx},${by} Q${(bx + e2.x) / 2},${(by + e2.y) / 2 + 6} ${e2.x},${e2.y}`} />
                </g>
              );
            }
            return <path key={s.id} className={cls} d={`M${p1.x},${p1.y - 40} Q${mx},${my} ${p2.x},${p2.y - 40}`} />;
          })}
        </svg>
        {pins.map((p) => {
          const { x, y } = pos(p);
          const on = sel === p.id;
          return (
            <button
              key={p.id}
              type="button"
              className={`co-pin${on ? " is-on" : ""}`}
              style={{ left: `${((x - 44) / 400) * 100}%`, top: `${((y - 40) / H) * 100}%`, width: `${(88 / 400) * 100}%` }}
              aria-pressed={on}
              onClick={() => setSel(on ? null : p.id)}
            >
              <span className="co-pin-head" aria-hidden="true" />
              <span className="co-pin-face" aria-hidden="true">
                <Portrait id={p.face} size={34} />
              </span>
              <span className="co-pin-name">{p.name}</span>
            </button>
          );
        })}
      </div>
      <h3 className="co-h3">{sel ? `What ties ${byId[sel]?.name}` : "What you know"}</h3>
      <ul className="co-strands">
        {shown.map((s) => (
          <StrandLine key={s.id} s={s} names={byId} />
        ))}
        {!shown.length && <li>Nothing yet. Search the Records, or ask Mr Pancks.</li>}
      </ul>
    </div>
  );
}

function StrandLine({ s, names }: { s: BoardStrand; names: Record<string, Pin> }) {
  const tag = s.state === "strong" ? "Strong" : s.state === "strained" ? "Strained" : s.state === "cut" ? "Cut" : null;
  return (
    <li className={`co-strand is-${s.state}`}>
      <span className="co-strand-who">
        {names[s.a]?.name} — {names[s.b]?.name}
        {s.fresh && <span className="co-tag is-pancks">New</span>}
      </span>
      <span>{s.label}.</span>
      {tag && (
        <span className="co-strand-note">
          <b>{tag}:</b> {s.note}
        </span>
      )}
    </li>
  );
}
