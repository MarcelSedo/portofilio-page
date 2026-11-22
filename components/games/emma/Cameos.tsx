"use client";

import { useEffect, useRef, useState } from "react";
import type { Cameo } from "@/content/games/emma/types";
import { useT } from "./i18n";

type MapLayout = { w: number; h: number; nodes: Record<string, readonly number[]>; edges: readonly (readonly string[])[]; folk: Record<string, unknown> };
type Walker = { id: string; from: string; to: string; t: number; len: number; frame: number; facing: "down" | "up" | "left" | "right" };

const SPEED = 11; // map pixels a second: a gentle stroll
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

/**
 * Jane Austen's own people, strolling about Bramblewick. Tap one and they say something
 * straight out of their book. With "calmer" on (or reduced motion), they stand still.
 */
export function Cameos({ M, cameos, still, onTalk }: { M: MapLayout; cameos: Cameo[]; still: boolean; onTalk: (id: string) => void }) {
  const T = useT();
  const graph = useRef<Map<string, string[]>>(new Map());
  if (!graph.current.size) {
    for (const [a, b] of M.edges) {
      if (a in M.folk || b in M.folk) continue;
      graph.current.set(a, [...(graph.current.get(a) ?? []), b]);
      graph.current.set(b, [...(graph.current.get(b) ?? []), a]);
    }
  }
  const xy = (n: string) => M.nodes[n] as unknown as [number, number];
  const dist = (a: string, b: string) => Math.hypot(xy(a)[0] - xy(b)[0], xy(a)[1] - xy(b)[1]) || 1;
  const nodes = [...graph.current.keys()].filter((n) => n !== "hartfield");

  const [walkers, setWalkers] = useState<Walker[]>(() =>
    cameos.map((c, i) => {
      const from = nodes[(i * 5 + 3) % nodes.length];
      const next = graph.current.get(from)!;
      const to = next[i % next.length];
      return { id: c.id, from, to, t: (i * 0.37) % 1, len: dist(from, to), frame: 0, facing: "down" };
    }),
  );

  useEffect(() => {
    if (still) return;
    let last = performance.now();
    let clock = 0;
    const timer = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      clock += dt;
      const step = clock > 0.18;
      if (step) clock = 0;
      setWalkers((ws) =>
        ws.map((w) => {
          let { from, to, t, len } = w;
          t += (SPEED * dt) / len;
          if (t >= 1) {
            const options = (graph.current.get(to) ?? [from]).filter((n) => n !== from);
            const next = options.length ? options[Math.floor(Math.random() * options.length)] : from;
            from = to;
            to = next;
            t = 0;
            len = dist(from, to);
          }
          const [x0, y0] = xy(from);
          const [x1, y1] = xy(to);
          const facing = Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? (x1 > x0 ? "right" : "left") : y1 < y0 ? "up" : "down";
          return { ...w, from, to, t, len, facing, frame: step ? (w.frame === 1 ? 2 : 1) : w.frame };
        }),
      );
    }, 80);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);

  return (
    <>
      {walkers.map((w) => {
        const c = cameos.find((x) => x.id === w.id)!;
        const [x0, y0] = xy(w.from);
        const [x1, y1] = xy(w.to);
        const x = x0 + (x1 - x0) * w.t;
        const y = y0 + (y1 - y0) * w.t;
        const row = { down: 0, up: 1, left: 2, right: 2 }[w.facing];
        return (
          <button
            key={w.id}
            type="button"
            className="em-spot is-cameo"
            style={{ left: pct(x - 7, M.w), top: pct(y - 21, M.h), width: pct(14, M.w), height: pct(22, M.h) }}
            onClick={() => onTalk(w.id)}
          >
            <span
              className="em-cameo-sprite"
              aria-hidden="true"
              style={{
                backgroundImage: `url(/emma/walk-${w.id}.png)`,
                backgroundPosition: `${((still ? 0 : w.frame) / 2) * 100}% ${(row / 2) * 100}%`,
                transform: w.facing === "left" ? "scaleX(-1)" : undefined,
              }}
            />
            <span className="sr-only">
              {T.talk.walking(c.name, c.book)}
            </span>
          </button>
        );
      })}
    </>
  );
}
