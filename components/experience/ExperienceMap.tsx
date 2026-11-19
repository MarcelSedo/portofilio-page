"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { places, villagers, type Place, type PlaceId, type Villager, type VillagerId } from "@/content/experience-map";
import { layouts, PLAYER, type Layout } from "./layouts";
import { PlaceWindow, VillagerTalk } from "./MapDialogs";

type LayoutName = keyof typeof layouts;
type Facing = "down" | "up" | "left" | "right";
type Target = { kind: "place"; id: PlaceId } | { kind: "villager"; id: VillagerId };

const PLAYER_W = PLAYER.w;
const PLAYER_H = PLAYER.h;
const NARROW = "(max-width: 639px)";

/** Shortest path between two nodes (breadth-first; the village is small) */
function findPath(L: Layout, from: string, to: string): string[] {
  const next = new Map<string, string[]>();
  for (const [a, b] of L.edges) {
    next.set(a, [...(next.get(a) ?? []), b]);
    next.set(b, [...(next.get(b) ?? []), a]);
  }
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const m of next.get(n) ?? []) {
      if (!prev.has(m)) {
        prev.set(m, n);
        queue.push(m);
      }
    }
  }
  if (!prev.has(to)) return [to];
  const path: string[] = [];
  for (let n: string | null = to; n; n = prev.get(n) ?? null) path.unshift(n);
  return path;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The village map on the Experience page.
 *
 * - Every building and villager is a real <button>, in reading order (top to bottom, left to right),
 *   so the map works with a keyboard and a screen reader. The player walking there is decoration.
 * - With prefers-reduced-motion the player doesn't walk, the window just opens.
 * - Phones get a tall map drawn for a narrow screen (same places, different arrangement).
 * - Under the map, "Fast travel" opens any building directly.
 */
export function ExperienceMap() {
  const [layoutName, setLayoutName] = useState<LayoutName>("wide");
  const [ready, setReady] = useState(false);
  const L = layouts[layoutName];

  const [node, setNode] = useState("start");
  const [pos, setPos] = useState<[number, number]>(L.nodes.start);
  const [facing, setFacing] = useState<Facing>("down");
  const [frame, setFrame] = useState(0);
  const [walking, setWalking] = useState(false);
  const [open, setOpen] = useState<Target | null>(null);

  const anim = useRef<{ raf: number; cancel: boolean } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // choose the map for the screen
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const pick = () => setLayoutName(mq.matches ? "tall" : "wide");
    pick();
    setReady(true);
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, []);

  // a different map: put the player on the same node there
  useEffect(() => {
    if (anim.current) anim.current.cancel = true;
    setWalking(false);
    setPos(L.nodes[node] ?? L.nodes.start);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutName]);

  useEffect(() => () => { if (anim.current) anim.current.cancel = true; }, []);

  const targetNode = (t: Target) => (t.kind === "place" ? L.places[t.id].node : L.villagers[t.id].node);

  const arrive = useCallback(
    (t: Target, at: string) => {
      setNode(at);
      setWalking(false);
      setFrame(0);
      if (t.kind === "place") setFacing("up");
      else {
        const v = L.villagers[t.id];
        const [nx, ny] = L.nodes[at];
        setFacing(Math.abs(v.x - nx) > Math.abs(v.y - ny) ? (v.x > nx ? "right" : "left") : v.y > ny ? "down" : "up");
      }
      setOpen(t);
    },
    [L],
  );

  const go = useCallback(
    (t: Target, trigger: HTMLElement) => {
      triggerRef.current = trigger;
      const goal = targetNode(t);
      if (anim.current) anim.current.cancel = true;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || goal === node) {
        setPos(L.nodes[goal]);
        arrive(t, goal);
        return;
      }

      // from where the player is now (possibly halfway along a road) through the nodes to the goal
      const route = findPath(L, node, goal);
      const points: [number, number][] = [pos, ...route.slice(1).map((n) => L.nodes[n])];
      const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
      const total = lengths.reduce((a, b) => a + b, 0) || 1;
      // walk briskly, and never make anyone wait more than about a second and a half
      const speed = Math.max(110, total / 1.5); // map pixels per second

      const state = { raf: 0, cancel: false };
      anim.current = state;
      setWalking(true);
      let travelled = 0;
      let last = performance.now();
      let stepClock = 0;

      const tick = (now: number) => {
        if (state.cancel) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        travelled = Math.min(total, travelled + speed * dt);
        stepClock += dt;
        if (stepClock > 0.12) {
          stepClock = 0;
          setFrame((f) => (f === 1 ? 2 : 1));
        }
        // find the segment we're on
        let acc = 0;
        let i = 0;
        while (i < lengths.length - 1 && acc + lengths[i] < travelled) acc += lengths[i++];
        const [x0, y0] = points[i];
        const [x1, y1] = points[i + 1];
        const k = lengths[i] ? (travelled - acc) / lengths[i] : 1;
        setPos([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]);
        // roads wind, so face along whichever direction dominates
        setFacing(Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? (x1 > x0 ? "right" : "left") : y1 < y0 ? "up" : "down");
        // remember the next node, so a new click mid-walk starts from there
        setNode(route[Math.min(route.length - 1, i + 1)] ?? goal);
        if (travelled >= total) {
          setPos(L.nodes[goal]);
          arrive(t, goal);
          return;
        }
        state.raf = requestAnimationFrame(tick);
      };
      state.raf = requestAnimationFrame(tick);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [L, node, pos, arrive],
  );

  const close = () => {
    setOpen(null);
    // after the dialog has closed: while it is open the page behind it is inert and can't take focus
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  // buttons in reading order: top to bottom, then left to right
  const items = useMemo(() => {
    const list: ({ kind: "place"; data: Place } | { kind: "villager"; data: Villager })[] = [
      ...places.map((p) => ({ kind: "place" as const, data: p })),
      ...villagers.map((v) => ({ kind: "villager" as const, data: v })),
    ];
    const y = (it: (typeof list)[number]) =>
      it.kind === "place" ? L.places[it.data.id].y + L.places[it.data.id].h : L.villagers[it.data.id].y;
    const x = (it: (typeof list)[number]) => (it.kind === "place" ? L.places[it.data.id].x : L.villagers[it.data.id].x);
    return list.sort((a, b) => Math.round(y(a) / 40) - Math.round(y(b) / 40) || x(a) - x(b));
  }, [L]);

  const row = { down: 0, up: 1, left: 2, right: 2 }[facing];
  const [px, py] = pos;

  return (
    <div className="xmap-wrap">
      <div
        className={`xmap xmap-${layoutName}`}
        data-ready={ready || undefined}
        style={{ aspectRatio: `${L.w} / ${L.h}`, maxWidth: L.w * 3 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xmap-ground" src={`/experience/map-${layoutName}.png`} alt="" width={L.w} height={L.h} />

        <ul className="xmap-items" aria-label="Places and people in the village">
          {items.map((it) => {
            if (it.kind === "place") {
              const p = it.data;
              const b = L.places[p.id];
              return (
                <li
                  key={p.id}
                  className="xmap-place"
                  style={{ left: pct(b.x, L.w), top: pct(b.y, L.h), width: pct(b.w, L.w), height: pct(b.h, L.h) }}
                >
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(e) => go({ kind: "place", id: p.id }, e.currentTarget)}
                  >
                    <span className="xmap-banner">{p.banner}</span>
                    <span className="sr-only">, {p.building}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/experience/${p.id}.png`} alt="" width={b.w} height={b.h} draggable={false} />
                  </button>
                </li>
              );
            }
            const v = it.data;
            const s = L.villagers[v.id];
            return (
              <li
                key={v.id}
                className={`xmap-villager xmap-v-${v.id}`}
                style={{ left: pct(s.x - s.w / 2, L.w), top: pct(s.y - s.h, L.h), width: pct(s.w, L.w), height: pct(s.h, L.h) }}
              >
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-label={`Talk to ${v.who}`}
                  onClick={(e) => go({ kind: "villager", id: v.id }, e.currentTarget)}
                >
                  <span className="xmap-talk" aria-hidden="true">…</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/experience/villager-${v.id}.png`} alt="" width={s.w} height={s.h} draggable={false} />
                </button>
              </li>
            );
          })}
        </ul>

        {/* the player: decoration, follows the buttons */}
        <div
          className={`xmap-player${walking ? " is-walking" : ""}${facing === "left" ? " is-left" : ""}`}
          aria-hidden="true"
          style={{
            left: pct(px - PLAYER_W / 2, L.w),
            top: pct(py - PLAYER_H, L.h),
            width: pct(PLAYER_W, L.w),
            height: pct(PLAYER_H, L.h),
            backgroundPosition: `${(frame / 2) * 100}% ${(row / 2) * 100}%`,
          }}
        />
      </div>

      <nav aria-label="Fast travel" className="xmap-fast">
        <h2 className="xmap-fast-title">Fast travel</h2>
        <ul>
          {places.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-haspopup="dialog"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget;
                  setOpen({ kind: "place", id: p.id });
                }}
              >
                {p.banner}
                <span className="xmap-fast-where"> · {p.building}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {open?.kind === "place" && <PlaceWindow place={places.find((p) => p.id === open.id)!} onClose={close} />}
      {open?.kind === "villager" && <VillagerTalk villager={villagers.find((v) => v.id === open.id)!} onClose={close} />}
    </div>
  );
}
