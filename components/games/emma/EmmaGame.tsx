"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { season } from "@/content/games/emma/season";
import { tutorial } from "@/content/games/emma/tutorial";
import type { Item, Scenario, Speaker, Spot, Target } from "@/content/games/emma/types";
import { Board } from "./Board";
import { Cameos } from "./Cameos";
import { castView } from "./cast";
import { Finale } from "./Finale";
import { PuzzleView } from "./Puzzles";
import { sfx, startWaltz, stopWaltz, type Sfx } from "./sound";
import { Book } from "./Book";
import { ClueFace } from "./ClueCard";
import { Sheet } from "./Sheet";
import { layout } from "./layout";
import {
  answerQuiz, cameoLine, clearGame, endFinale, hasNews, isOpen, isVisible, loadGame, loadPrefs, newGame, progress, quizDone, reply, saveGame,
  savePrefs, score, spotVisible, startFinale, storyProgress,
  type GameState, type Settings,
} from "./state";

const SCENARIOS: Record<Scenario["id"], Scenario> = { tutorial, season };

type Talk = { who: string; title?: string; clue?: string; fresh?: boolean; wait?: string; note?: string; quote?: string } | null;
type MapLayout = {
  w: number;
  h: number;
  places: Record<string, { x: number; y: number; w: number; h: number; node: string }>;
  spots?: Record<string, { x: number; y: number; w: number; h: number }>;
  folk: Record<string, { x: number; y: number; w: number; h: number; node: string }>;
  nodes: Record<string, readonly number[]>;
  edges: readonly (readonly string[])[];
};
type Box = { x: number; y: number; w: number; h: number };
const B = layout.ball;
const ROOMS = layout.rooms as unknown as Record<string, { w: number; h: number; items: Record<string, Box>; people: Box[] }>;
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

/** how big the village is drawn: bigger than a phone screen, so you can wander */
const VILLAGE_SCALE = 2.3;

const LABEL: Record<string, string> = {
  abbey: "Abbey House", library: "Library", grange: "Elmwood Grange", lyle: "Lyle Cottage", cleve: "Cleve Lodge",
  hartfield: "Hartfield ♥", ashby: "Ashby Hall", vicarage: "Vicarage", pryce: "Dr Pryce", whitlock: "Whitlock House",
  school: "School", inn: "The Crown", draper: "Twine's", post: "Post Office", assembly: "Assembly Rooms", farm: "Brampton Farm",
  bakery: "Bakery", smithy: "Smithy", school2: "Schoolhouse", cottage: "Lavender Cottage",
};

function findPath(M: MapLayout, from: string, to: string): string[] {
  const next = new Map<string, string[]>();
  for (const [a, b] of M.edges) {
    next.set(a, [...(next.get(a) ?? []), b]);
    next.set(b, [...(next.get(b) ?? []), a]);
  }
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const n = queue.shift()!;
    if (n === to) break;
    for (const m of next.get(n) ?? []) if (!prev.has(m)) (prev.set(m, n), queue.push(m));
  }
  if (!prev.has(to)) return [to];
  const path: string[] = [];
  for (let n: string | null = to; n; n = prev.get(n) ?? null) path.unshift(n);
  return path;
}

export function EmmaGame() {
  const [s, setS] = useState<GameState | null>(null);
  const [menu, setMenu] = useState(true);
  const [prefs, setPrefs] = useState(() => ({ settings: { bigText: false, calm: false }, tutorialDone: false }));
  const [talk, setTalk] = useState<Talk>(null);
  const [verdict, setVerdict] = useState<number | null>(null);
  const [puzzle, setPuzzle] = useState<string | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [msg, setMsg] = useState("");
  const [introStep, setIntroStep] = useState(0);
  const mainRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [facing, setFacing] = useState<"down" | "up" | "left" | "right">("down");
  const [frame, setFrame] = useState(0);
  const anim = useRef<{ cancel: boolean } | null>(null);
  const mapWrap = useRef<HTMLDivElement>(null);

  // what's saved in this browser is only known after the page has loaded (not on the server)
  const [seasonSave, setSeasonSave] = useState<GameState | null>(null);
  useEffect(() => setPrefs(loadPrefs()), []);
  useEffect(() => {
    if (menu) setSeasonSave(loadGame("season"));
  }, [menu]);
  useEffect(() => {
    if (s && !menu) saveGame(s);
  }, [s, menu]);
  useEffect(() => () => void (anim.current && (anim.current.cancel = true)), []);
  const screen = s?.screen;
  useEffect(() => {
    if (!screen) return;
    requestAnimationFrame(() => mainRef.current?.querySelector<HTMLElement>("h1, h2")?.focus());
  }, [screen, s?.house, menu]);

  const say = useCallback((text: string) => {
    setMsg("");
    requestAnimationFrame(() => setMsg(text));
  }, []);
  const update = (f: (x: GameState) => GameState) => setS((x) => (x ? f(x) : x));
  const soundOn = !!s?.sound && !menu;
  const play = (k: Sfx) => soundOn && sfx(k);
  // the waltz plays at the ball, if sound is on
  const atBall = !menu && s?.screen === "ball" && !!s?.sound;
  useEffect(() => {
    if (atBall) startWaltz();
    else stopWaltz();
    return () => stopWaltz();
  }, [atBall]);

  const sc = s ? castView(SCENARIOS[s.scenario], s.cast, s.decoy) : season;
  const M = (layout[sc.map] as unknown) as MapLayout;
  const nodeXY = (n: string) => (M.nodes[n] ?? M.nodes.hartfield) as unknown as [number, number];
  const clue = (id: string) => sc.clues.find((c) => c.id === id)!;
  const cameo = (id: string) => sc.cameos?.find((c) => c.id === id);
  const name = (id: string) => sc.people.find((p) => p.id === id)?.name ?? sc.speakers[id]?.name ?? cameo(id)?.name ?? id;
  const role = (id: string) => sc.people.find((p) => p.id === id)?.role ?? sc.speakers[id]?.role ?? (cameo(id) ? `from ${cameo(id)!.book}` : "");
  const talkCameo = (id: string) => {
    if (!s) return;
    const l = cameoLine(sc, s, id);
    if (!l) return;
    update((x) => (x.heard.includes(l.key) ? x : { ...x, heard: [...x.heard, l.key] }));
    setTalk({ who: id, quote: l.text });
    play("page");
  };
  const settings: Settings = s?.settings ?? prefs.settings;
  const calm = settings.calm;

  // keep Emma in sight while the big village scrolls
  const followKey = s?.screen === "village" ? `${Math.round(pos[0] / 12)}-${Math.round(pos[1] / 12)}` : "";
  useEffect(() => {
    const wrap = mapWrap.current;
    if (!wrap || !s || s.screen !== "village") return;
    const scale = wrap.scrollWidth / M.w;
    const ex = pos[0] * scale;
    const ey = pos[1] * scale;
    const mx = wrap.clientWidth * 0.3;
    const my = wrap.clientHeight * 0.3;
    let left = wrap.scrollLeft;
    let top = wrap.scrollTop;
    if (ex < left + mx || ex > left + wrap.clientWidth - mx) left = ex - wrap.clientWidth / 2;
    if (ey < top + my || ey > top + wrap.clientHeight - my) top = ey - wrap.clientHeight / 2;
    if (left !== wrap.scrollLeft || top !== wrap.scrollTop) wrap.scrollTo({ left, top, behavior: calm ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followKey, s?.screen]);

  const start = (id: Scenario["id"], fresh: boolean) => {
    const scn = SCENARIOS[id];
    const saved = fresh ? null : loadGame(id);
    const next = saved ? { ...saved, screen: saved.screen === "intro" ? "village" : saved.screen } : newGame(scn, settings);
    if (fresh) clearGame(id);
    setIntroStep(0);
    setPos(((layout[scn.map] as unknown) as MapLayout).nodes[next.node] as unknown as [number, number]);
    setS(next as GameState);
    setMenu(false);
  };

  // ---------- tutorial guide ----------
  const step = s && sc.steps ? sc.steps.find((st) => !st.done(progress(s))) : undefined;
  const target: Target | undefined = !menu && s && s.screen !== "intro" ? step?.target : undefined;
  const isTarget = (kind: string, id?: string) => !!target && target.kind === kind && (!("id" in target) || target.id === id);

  // ---------- talking ----------
  const thing = (id: string) => sc.things?.[id] ?? { name: id, icon: "•" };
  const speak = (sp: Speaker) => {
    if (!s) return;
    const r = reply(s, sp);
    if (r.kind === "clue") {
      update((x) => ({ ...x, found: [...x.found, r.clue], pocket: r.uses ? x.pocket.filter((p) => p !== r.uses) : x.pocket }));
      setTalk({ who: sp.who, clue: r.clue, fresh: true, note: r.uses ? `You gave ${thing(r.uses).name.toLowerCase()} ${thing(r.uses).icon}` : undefined });
      play("clue");
    } else if (r.kind === "quest") {
      update((x) => ({ ...x, flags: [...x.flags, r.flag] }));
      setTalk({ who: sp.who, wait: r.text, note: "A favour to do" });
      play("page");
    } else if (r.kind === "give") {
      update((x) => ({ ...x, flags: [...x.flags, `got-${r.item}`], pocket: [...x.pocket, r.item] }));
      setTalk({ who: sp.who, wait: r.text, note: `${thing(r.item).icon} ${thing(r.item).name} is in your pocket` });
      play("pick");
    } else if (r.kind === "wait") setTalk({ who: sp.who, wait: r.text });
    else setTalk(r.clue ? { who: sp.who, clue: r.clue, fresh: false } : { who: sp.who, wait: `${name(sp.who)} has nothing more to tell you.` });
  };
  const look = (label: string, id: string) => {
    if (!s) return;
    const fresh = !s.found.includes(id);
    if (fresh) {
      update((x) => ({ ...x, found: [...x.found, id] }));
      play("clue");
    }
    setTalk({ who: "emma", title: label, clue: id, fresh });
  };
  const examine = (it: Item) => {
    if (!s) return;
    if (it.puzzle && !s.flags.includes(`solved-${it.puzzle}`)) {
      setPuzzle(it.puzzle);
      play("page");
      return;
    }
    look(it.label, it.clue);
  };
  const visitSpot = (sp: Spot) => {
    if (!s) return;
    if (sp.give) {
      const g = sp.give;
      update((x) => ({ ...x, flags: [...x.flags, `got-${g.item}`], pocket: [...x.pocket, g.item] }));
      setTalk({ who: "emma", title: sp.label, wait: g.text, note: `${thing(g.item).icon} ${thing(g.item).name} is in your pocket` });
      play("pick");
    } else if (sp.clue) look(sp.label, sp.clue);
  };

  // ---------- walking ----------
  const arrive = (kind: "place" | "folk", id: string, at: string) => {
    if (!s) return;
    setFrame(0);
    update((x) => ({ ...x, node: at }));
    if (kind === "folk") {
      const sp = sc.green.find((g) => g.who === id)!;
      setFacing(M.folk[id].x < nodeXY(at)[0] ? "left" : "right");
      speak(sp);
      return;
    }
    setFacing("up");
    if (id === "hartfield") return update((x) => ({ ...x, screen: "board", house: null }));
    if (id === "assembly") return update((x) => ({ ...x, screen: "ball", house: null }));
    const h = sc.houses.find((x) => x.id === id)!;
    if (!isOpen(s, h)) {
      setTalk({ who: "emma", title: h.name, wait: h.locked!.text });
      return;
    }
    play("door");
    update((x) => ({ ...x, screen: "house", house: id }));
  };

  const walkTo = (kind: "place" | "folk", id: string) => {
    if (!s) return;
    const goal = kind === "place" ? M.places[id].node : M.folk[id].node;
    if (anim.current) anim.current.cancel = true;
    const reduced = calm || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || goal === s.node) {
      setPos(nodeXY(goal));
      arrive(kind, id, goal);
      return;
    }
    const route = findPath(M, s.node, goal);
    const points: [number, number][] = [pos, ...route.slice(1).map(nodeXY)];
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    const total = lengths.reduce((a, b) => a + b, 0) || 1;
    const speed = Math.max(90, total / 1.6);
    const state = { cancel: false };
    anim.current = state;
    let travelled = 0;
    let last = performance.now();
    let clock = 0;
    const tick = (now: number) => {
      if (state.cancel) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      travelled = Math.min(total, travelled + speed * dt);
      clock += dt;
      if (clock > 0.12) {
        clock = 0;
        setFrame((f) => (f === 1 ? 2 : 1));
      }
      let acc = 0;
      let i = 0;
      while (i < lengths.length - 1 && acc + lengths[i] < travelled) acc += lengths[i++];
      const [x0, y0] = points[i];
      const [x1, y1] = points[i + 1];
      const k = lengths[i] ? (travelled - acc) / lengths[i] : 1;
      setPos([x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]);
      setFacing(Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? (x1 > x0 ? "right" : "left") : y1 < y0 ? "up" : "down");
      if (travelled >= total) {
        setPos(nodeXY(goal));
        arrive(kind, id, goal);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // ---------- menu ----------
  if (menu || !s) {
    return (
      <div className={`em${settings.bigText ? " is-big" : ""}${calm ? " is-calm" : ""}`} ref={mainRef}>
        <section className="em-menu" aria-labelledby="em-title">
          <img className="em-menu-art" src="/emma/village.png" alt="" width={320} height={560} />
          <div className="em-menu-card">
            <p className="em-kicker">A small detective game of manners</p>
            <h1 id="em-title" className="em-h1" tabIndex={-1}>
              Emma
              <span>The Matchmaker of Bramblewick</span>
            </h1>
            <div className="em-menu-buttons">
              <button type="button" className={`em-btn${prefs.tutorialDone ? " is-ghost" : ""}`} onClick={() => start("tutorial", true)}>
                {prefs.tutorialDone ? "Practise again on Donwell Lane" : "Start here: an afternoon with Emma"}
              </button>
              {seasonSave && seasonSave.screen !== "ending" && (
                <button type="button" className="em-btn" onClick={() => start("season", false)}>
                  Continue the season
                </button>
              )}
              <button
                type="button"
                className={`em-btn${prefs.tutorialDone && !seasonSave ? "" : " is-ghost"}`}
                onClick={() => (seasonSave && seasonSave.screen !== "ending" ? setConfirmNew(true) : start("season", true))}
              >
                The season in Bramblewick
              </button>
              <button type="button" className="em-btn is-ghost" onClick={() => setHelp(true)}>
                How to play
              </button>
              <button type="button" className="em-btn is-ghost" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
            </div>
            <p className="em-muted em-small">
              Emma Woodhouse is Jane Austen&apos;s; the stories borrow her plots. Bramblewick and everyone in it are
              invented. Your game is saved in this browser only.
            </p>
          </div>
        </section>
        {sheets()}
      </div>
    );
  }

  const newCount = s.found.filter((id) => !s.read.includes(id)).length;
  const hud = (place: string) => (
    <>
      <header className="em-hud">
        <p className="em-where">{place}</p>
        {s.pocket.length > 0 && (
          <p className="em-pocket">
            <span className="sr-only">In your pocket: </span>
            {s.pocket.map((p) => (
              <span key={p} title={thing(p).name}>
                <span aria-hidden="true">{thing(p).icon}</span>
                <span className="sr-only">{thing(p).name}</span>
              </span>
            ))}
          </p>
        )}
        <div className="em-hud-actions">
          <button
            type="button"
            className="em-hud-btn is-icon"
            aria-pressed={s.sound}
            onClick={() => update((x) => ({ ...x, sound: !x.sound }))}
          >
            <span aria-hidden="true">{s.sound ? "🔊" : "🔇"}</span>
            <span className="sr-only">Sound and music</span>
          </button>
          <button
            type="button"
            className={`em-hud-btn${isTarget("book") ? " is-target" : ""}`}
            onClick={() => {
              setBookOpen(true);
              play("page");
            }}
          >
            <span aria-hidden="true">📖</span> Book
            {newCount > 0 && (
              <span className="em-badge">
                {newCount}
                <span className="sr-only"> new</span>
              </span>
            )}
          </button>
          <button type="button" className="em-hud-btn" onClick={() => update((x) => ({ ...x, screen: "board", house: null }))}>
            <span aria-hidden="true">♥</span> Board
          </button>
          <button type="button" className="em-hud-btn is-icon" onClick={() => setMenu(true)}>
            <span aria-hidden="true">☰</span>
            <span className="sr-only">Menu</span>
          </button>
        </div>
      </header>
      {sc.id === "season" && (
        <ul className="em-ribbons" aria-label="How far each love story has got">
          {storyProgress(sc, s).map((r) => {
            const lady = sc.people.find((p) => p.id === r.woman)!;
            const pctDone = Math.round((r.got / r.total) * 100);
            return (
              <li key={r.pid}>
                <span className="em-ribbon-name">{lady.short}</span>
                <span className="em-ribbon" role="img" aria-label={`${lady.short}'s story: ${pctDone}%`}>
                  <span style={{ width: `${pctDone}%` }} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {step && (
        <p className="em-guide" role="status">
          <img src="/emma/bust-emma.png" alt="" width={40} height={40} />
          <span>
            <strong>Emma:</strong> {step.say}
          </span>
        </p>
      )}
    </>
  );
  // the next step is out on the map: point at the way back
  const insideTarget = !!target && target.kind === "place" && s.screen === "house" && s.house === target.id;
  const backIsTarget = !!target && (target.kind === "place" || target.kind === "folk") && s.screen !== "village" && !insideTarget;
  const back = (
    <div className="em-row">
      <button
        type="button"
        className={`em-btn${backIsTarget ? " is-target" : ""}`}
        onClick={() => update((x) => ({ ...x, screen: "village", house: null }))}
      >
        ← Back to {sc.mapName}
      </button>
    </div>
  );
  const sprite = (id: string, x: number, y: number, of: { w: number; h: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img key={`${id}-${x}-${y}`} src={`/emma/p-${id}.png`} alt="" className="em-sprite"
      style={{ left: pct(x, of.w), top: pct(y, of.h), width: pct(14, of.w), height: pct(22, of.h) }} />
  );
  const arrow = <span className="em-arrow" aria-hidden="true">▼</span>;

  let body: React.ReactNode = null;

  if (s.screen === "intro") {
    const last = introStep >= sc.intro.length - 1;
    const toMap = () => update((x) => ({ ...x, screen: "village" }));
    body = (
      <section className="em-intro" aria-labelledby="em-intro-title">
        <h1 id="em-intro-title" className="sr-only" tabIndex={-1}>
          Emma introduces {sc.title}
        </h1>
        <img className="em-intro-bust" src="/emma/bust-emma.png" alt="" width={128} height={128} />
        <div className="em-letter">
          <p className="em-letter-name">Emma Woodhouse</p>
          <Typewriter key={`${s.scenario}-${introStep}`} text={sc.intro[introStep]} calm={calm} />
          <p className="em-muted em-small" aria-hidden="true">
            {introStep + 1} / {sc.intro.length}
          </p>
        </div>
        <div className="em-row">
          <button type="button" className="em-btn" onClick={() => (last ? toMap() : setIntroStep(introStep + 1))}>
            {last ? `To ${sc.mapName} ▶` : "Go on ▶"}
          </button>
          {!last && (
            <button type="button" className="em-btn is-ghost" onClick={toMap}>
              Skip
            </button>
          )}
        </div>
      </section>
    );
  }

  if (s.screen === "village") {
    const row = { down: 0, up: 1, left: 2, right: 2 }[facing];
    const places = Object.entries(M.places).sort((a, b) => a[1].y - b[1].y || a[1].x - b[1].x);
    body = (
      <>
        {hud(sc.mapName)}
        <section aria-labelledby="em-village-title">
          <h2 id="em-village-title" className="em-place" tabIndex={-1}>
            {sc.mapName} <span className="em-muted">· tap a house or a neighbour; drag to look around</span>
          </h2>
          <div className={`em-mapwrap${sc.map === "village" ? " is-big" : ""}`} ref={mapWrap}>
          <div
            className={`em-map is-village${sc.map === "lane" ? " is-day" : ""}`}
            style={{ aspectRatio: `${M.w} / ${M.h}`, width: sc.map === "village" ? `${M.w * VILLAGE_SCALE}px` : undefined }}
          >
            <img src={`/emma/${sc.map}.png`} alt="" width={M.w} height={M.h} className="em-map-img" />
            {places.map(([id, b]) => {
              const right = b.x + b.w > M.w - 12;
              const left = b.x < 12;
              return (
                <button
                  key={id}
                  type="button"
                  className={`em-spot is-place${id === "hartfield" ? " is-home" : ""}${id === "assembly" ? " is-ball" : ""}${isTarget("place", id) ? " is-target" : ""}`}
                  style={{ left: pct(b.x, M.w), top: pct(b.y, M.h), width: pct(b.w, M.w), height: pct(b.h, M.h) }}
                  onClick={() => walkTo("place", id)}
                >
                  <span
                    className="em-label"
                    aria-hidden="true"
                    style={{
                      left: left ? 0 : right ? "auto" : "50%",
                      right: right ? 0 : "auto",
                      transform: `translate(${left || right ? "0" : "-50%"}, ${b.y < 16 ? "2px" : "-110%"})`,
                    }}
                  >
                    {LABEL[id] ?? id}
                  </span>
                  {isTarget("place", id) && arrow}
                  <span className="sr-only">
                    {id === "hartfield" ? "Hartfield, your wedding board" : id === "assembly" ? "The Assembly Rooms, the ball" : sc.houses.find((h) => h.id === id)?.name}
                  </span>
                </button>
              );
            })}
            {sc.green.map((f) => {
              const p = M.folk[f.who];
              const news = hasNews(s, f);
              return (
                <button
                  key={f.who}
                  type="button"
                  className={`em-spot is-folk${isTarget("folk", f.who) ? " is-target" : ""}`}
                  style={{ left: pct(p.x, M.w), top: pct(p.y, M.h), width: pct(p.w, M.w), height: pct(p.h, M.h) }}
                  onClick={() => walkTo("folk", f.who)}
                >
                  <img src={`/emma/${sc.map === "lane" ? "p" : "pn"}-${f.who}.png`} alt="" width={14} height={22} />
                  {news && (
                    <span className="em-bubble" aria-hidden="true">
                      …
                    </span>
                  )}
                  {isTarget("folk", f.who) && arrow}
                  <span className="sr-only">
                    {name(f.who)}, {role(f.who)}
                    {news ? ", has something to say" : ""}
                  </span>
                </button>
              );
            })}
            {(sc.spots ?? []).filter((sp) => spotVisible(s, sp)).map((sp) => {
              const b = M.spots?.[sp.id];
              if (!b) return null;
              return (
                <span key={sp.id}>
                  {sp.people?.map(([id, x, y]) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={id} src={`/emma/pn-${id}.png`} alt="" className="em-sprite"
                      style={{ left: pct(b.x + x, M.w), top: pct(b.y + y, M.h), width: pct(14, M.w), height: pct(22, M.h) }} />
                  ))}
                  <button
                    type="button"
                    className={`em-spot is-glint${sp.people ? " is-meeting" : ""}`}
                    style={{ left: pct(b.x, M.w), top: pct(b.y, M.h), width: pct(b.w, M.w), height: pct(b.h, M.h) }}
                    onClick={() => visitSpot(sp)}
                  >
                    <span className="em-glint" aria-hidden="true">✦</span>
                    <span className="sr-only">{sp.label}</span>
                  </button>
                </span>
              );
            })}
            <span
              className="em-walker"
              aria-hidden="true"
              style={{
                left: pct(pos[0] - 7, M.w),
                top: pct(pos[1] - 21, M.h),
                width: pct(14, M.w),
                height: pct(22, M.h),
                backgroundPosition: `${(frame / 2) * 100}% ${(row / 2) * 100}%`,
                transform: facing === "left" ? "scaleX(-1)" : undefined,
              }}
            />
            {sc.id === "season" && sc.cameos && <Cameos M={M} cameos={sc.cameos} still={calm} onTalk={talkCameo} />}
          </div>
          </div>
          <details className="em-travel" open>
            <summary>Go straight to a place</summary>
            <ul>
              {places.map(([id]) => (
                <li key={id}>
                  <button
                    type="button"
                    className="em-link"
                    onClick={() => {
                      setPos(nodeXY(M.places[id].node));
                      arrive("place", id, M.places[id].node);
                    }}
                  >
                    {LABEL[id] ?? id}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </>
    );
  }

  if (s.screen === "house" && s.house) {
    const h = sc.houses.find((x) => x.id === s.house)!;
    const R = ROOMS[h.id];
    body = (
      <>
        {hud(h.name)}
        <section aria-labelledby="em-house-title">
          <h2 id="em-house-title" className="em-place" tabIndex={-1}>
            {h.name} <span className="em-muted">· {h.blurb}</span>
          </h2>
          <div className="em-map" style={{ aspectRatio: `${R.w} / ${R.h}` }}>
            <img src={`/emma/room-${h.id}.png`} alt="" width={R.w} height={R.h} className="em-map-img" />
            {h.people.map((p, i) => {
              const box = R.people[i] ?? R.people[0];
              const news = hasNews(s, p);
              return (
                <button
                  key={p.who}
                  type="button"
                  className={`em-spot is-person${isTarget("person", p.who) || (insideTarget && news) ? " is-target" : ""}`}
                  style={{ left: pct(box.x, R.w), top: pct(box.y, R.h), width: pct(box.w, R.w), height: pct(box.h, R.h) }}
                  onClick={() => speak(p)}
                >
                  <img src={`/emma/p-${p.who}.png`} alt="" width={14} height={22} />
                  {news && (
                    <span className="em-bubble" aria-hidden="true">
                      …
                    </span>
                  )}
                  {(isTarget("person", p.who) || (insideTarget && news)) && arrow}
                  <span className="sr-only">Talk to {name(p.who)}</span>
                </button>
              );
            })}
            {h.items.filter((it) => isVisible(s, it)).map((it) => {
              const box = R.items[it.id];
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`em-spot is-item${isTarget("item", it.id) || (insideTarget && !s.found.includes(it.clue)) ? " is-target" : ""}`}
                  style={{ left: pct(box.x, R.w), top: pct(box.y, R.h), width: pct(box.w, R.w), height: pct(box.h, R.h) }}
                  onClick={() => examine(it)}
                >
                  <span className="em-mark is-look" aria-hidden="true">
                    {it.puzzle && !s.flags.includes(`solved-${it.puzzle}`) ? "✎" : "?"}
                  </span>
                  <span className="sr-only">
                    {it.puzzle && !s.flags.includes(`solved-${it.puzzle}`) ? "Puzzle: " : "Look at: "}
                    {it.label}
                  </span>
                </button>
              );
            })}
          </div>
          {back}
        </section>
      </>
    );
  }

  if (s.screen === "ball" && sc.ball) {
    const ball = sc.ball;
    type Obs = { people: readonly (readonly [string, number, number])[]; hot?: readonly number[] };
    const boxOf = (ps: readonly (readonly [string, number, number])[]) => {
      const xs = ps.map((p) => p[1]);
      const ys = ps.map((p) => p[2]);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) + 14 - Math.min(...xs), h: Math.max(...ys) + 22 - Math.min(...ys) };
    };
    body = (
      <>
        {hud(ball.name)}
        <section aria-labelledby="em-ball-title">
          <h2 id="em-ball-title" className="em-place" tabIndex={-1}>
            {ball.name} <span className="em-muted">· {ball.blurb}</span>
          </h2>
          <div className="em-map is-ball" style={{ aspectRatio: `${B.w} / ${B.h}` }}>
            <img src="/emma/ball.png" alt="" width={B.w} height={B.h} className="em-map-img" />
            {B.extras.map(([id, x, y]) => sprite(id, x, y, B))}
            {Object.values(B.obs).flatMap((o) => (o as Obs).people.map(([id, x, y]) => sprite(id, x, y, B)))}
            {ball.watch.map((w) => {
              const o = B.obs[w.id as keyof typeof B.obs] as Obs;
              const box = boxOf(o.hot ? o.hot.map((i) => o.people[i]) : o.people);
              return (
                <button
                  key={w.id}
                  type="button"
                  className="em-spot is-watch"
                  style={{ left: pct(box.x, B.w), top: pct(box.y, B.h), width: pct(box.w, B.w), height: pct(box.h, B.h) }}
                  onClick={() => look(w.label, w.clue)}
                >
                  <span className="em-mark is-eye" aria-hidden="true">
                    👁
                  </span>
                  <span className="sr-only">Watch: {w.label}</span>
                </button>
              );
            })}
            {ball.guests.map((g) => {
              const [x, y] = B.guests[g.who as keyof typeof B.guests];
              const news = hasNews(s, g);
              return (
                <button
                  key={g.who}
                  type="button"
                  className="em-spot is-person"
                  style={{ left: pct(x, B.w), top: pct(y, B.h), width: pct(14, B.w), height: pct(22, B.h) }}
                  onClick={() => speak(g)}
                >
                  <img src={`/emma/p-${g.who}.png`} alt="" width={14} height={22} />
                  {news && (
                    <span className="em-bubble" aria-hidden="true">
                      …
                    </span>
                  )}
                  <span className="sr-only">
                    Talk to {name(g.who)}, {role(g.who)}
                  </span>
                </button>
              );
            })}
            {ball.items.map((it) => {
              const [x, y, w, h] = B.items[it.id as keyof typeof B.items];
              return (
                <button
                  key={it.id}
                  type="button"
                  className="em-spot is-item"
                  style={{ left: pct(x, B.w), top: pct(y, B.h), width: pct(w, B.w), height: pct(h, B.h) }}
                  onClick={() => look(it.label, it.clue)}
                >
                  <span className="em-mark is-look" aria-hidden="true">
                    ?
                  </span>
                  <span className="sr-only">Look at: {it.label}</span>
                </button>
              );
            })}
          </div>
          <p className="em-muted em-small">Talk to the guests (…), watch the dancers (👁) and read the dance list (?).</p>
          {back}
        </section>
      </>
    );
  }

  if (s.screen === "board") {
    const focus = target && (target.kind === "board" || target.kind === "proof" || target.kind === "announce") ? target.kind : null;
    body = (
      <>
        {hud("Hartfield")}
        <h2 className="sr-only" tabIndex={-1}>
          Hartfield
        </h2>
        {back}
        <Board
          sc={sc}
          s={s}
          say={say}
          focus={focus}
          setMatch={(w, m) =>
            update((x) => {
              const matches = { ...x.matches };
              for (const k of Object.keys(matches)) if (m && matches[k] === m) delete matches[k];
              if (m) matches[w] = m;
              else delete matches[w];
              return { ...x, matches };
            })
          }
          setProof={(w, c) =>
            update((x) => {
              const proofs = { ...x.proofs };
              if (c) proofs[w] = c;
              else delete proofs[w];
              return { ...x, proofs };
            })
          }
          quizDone={quizDone(sc, s)}
          onQuiz={(answers) => {
            const r = answerQuiz(sc, s, answers);
            setS(r.state);
            return r.wrong;
          }}
          onAnnounce={() => {
            play("solve");
            update((x) => startFinale(sc, x));
          }}
        />
      </>
    );
  }

  if (s.screen === "finale" && s.finale) {
    body = (
      <Finale
        sc={sc}
        s={s}
        calm={calm}
        onNext={() => {
          const f = s.finale!;
          const nextLady = f.order[f.step + 1];
          if (nextLady !== undefined) play(f.right[nextLady] ? "solve" : "wrong");
          update((x) => ({ ...x, finale: x.finale && { ...x.finale, step: x.finale.step + 1 } }));
        }}
        onEnd={() => {
          const f = s.finale!;
          const all = f.order.every((w) => f.right[w]);
          if (all && sc.id === "tutorial") {
            savePrefs({ tutorialDone: true });
            setPrefs((p) => ({ ...p, tutorialDone: true }));
          }
          update((x) => endFinale(x));
        }}
      />
    );
  }

  if (s.screen === "ending") {
    const r = score(sc, s);
    body = (
      <section className="em-ending" aria-labelledby="em-end-title">
        <p className="em-kicker">{sc.id === "tutorial" ? "Well done" : "A year later"}</p>
        <h2 id="em-end-title" className="em-h2" tabIndex={-1}>
          {r.title}
        </h2>
        <p className="em-score">
          {r.total} <span>/ {r.max}</span>
        </p>
        <p className="em-muted">
          {r.proofs} of {r.results.length} matches proved by a true clue · announced {s.attempts}{" "}
          {s.attempts === 1 ? "time" : "times"}.
        </p>
        <ul className="em-letters">
          {r.results.map((m) => {
            const w = sc.people.find((p) => p.id === m.woman)!;
            const letter = sc.letters[m.woman];
            return (
              <li key={m.woman} className="em-letter-card is-good">
                <div className="em-letter-head">
                  <img src={`/emma/bust-${m.woman}.png`} alt="" width={48} height={48} />
                  <img src={`/emma/bust-${m.man}.png`} alt="" width={48} height={48} />
                  <p>
                    <strong>{letter?.from ?? w.name}</strong>
                  </p>
                </div>
                <p className="em-letter-text">{letter?.good}</p>
                {m.proofId ? (
                  <p className={`em-verdict ${m.proved ? "is-true" : "is-false"}`}>
                    <span aria-hidden="true">{m.proved ? "✓" : "✗"}</span> Your proof: {clue(m.proofId).text}
                    <span className="em-muted">
                      {" "}
                      {m.proved ? "A true clue about these two." : clue(m.proofId).truth ? "True, but it doesn't prove this match." : "That one was not true."}
                    </span>
                  </p>
                ) : (
                  <p className="em-muted">No proof chosen.</p>
                )}
              </li>
            );
          })}
        </ul>
        <div className="em-row">
          {sc.id === "tutorial" ? (
            <button type="button" className="em-btn" onClick={() => start("season", true)}>
              On to the season in Bramblewick ▶
            </button>
          ) : (
            <button type="button" className="em-btn" onClick={() => start("season", true)}>
              Play the season again
            </button>
          )}
          <button type="button" className="em-btn is-ghost" onClick={() => setMenu(true)}>
            To the menu
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={`em${settings.bigText ? " is-big" : ""}${calm ? " is-calm" : ""}`} ref={mainRef}>
      {body}
      <p className="sr-only" aria-live="polite">
        {msg}
      </p>
      {sheets()}
    </div>
  );

  // ---------- dialogs ----------
  function sheets() {
    const splitWait = (text: string) => {
      const i = text.indexOf(" Emma: ");
      return i < 0 ? [text, ""] : [text.slice(0, i), text.slice(i + 7)];
    };
    const setSetting = (k: keyof Settings, v: boolean) => {
      const next = { ...settings, [k]: v };
      savePrefs({ settings: next });
      setPrefs((p) => ({ ...p, settings: next }));
      update((x) => ({ ...x, settings: next }));
    };
    return (
      <>
        <Sheet open={!!talk} onClose={() => setTalk(null)} labelledBy="em-talk-title">
          {talk && (
            <div className="em-say">
              <img src={`/emma/bust-${talk.who}.png`} alt="" width={96} height={96} className="em-say-bust" />
              <div>
                <h2 id="em-talk-title" className="em-h3">
                  {talk.title ?? name(talk.who)} <span className="em-muted">· {talk.title ? (talk.wait ? "closed" : "you look closer") : role(talk.who)}</span>
                </h2>
                {talk.quote ? (
                  <figure className="em-quote">
                    <blockquote>
                      <p>“{talk.quote}”</p>
                    </blockquote>
                    <figcaption>
                      {name(talk.who)}, <cite>{cameo(talk.who)?.book}</cite>, by Jane Austen
                    </figcaption>
                  </figure>
                ) : talk.wait ? (
                  <>
                    {splitWait(talk.wait)[0] && <p className="em-said">{splitWait(talk.wait)[0]}</p>}
                    {splitWait(talk.wait)[1] && (
                      <p className="em-aside">
                        <img src="/emma/bust-emma.png" alt="" width={32} height={32} />
                        <span>
                          <strong>Emma, to herself:</strong> {splitWait(talk.wait)[1]}
                        </span>
                      </p>
                    )}
                  </>
                ) : talk.clue ? (
                  <>
                    <ClueFace clue={clue(talk.clue)} fresh={talk.fresh} showNext />
                    {talk.fresh ? <p className="em-added">＋ Added to your book</p> : <p className="em-muted em-small">Nothing new. You already have this in your book.</p>}
                  </>
                ) : null}
                {talk.note && <p className="em-note">{talk.note}</p>}
                <button type="button" className="em-btn" data-autofocus onClick={() => setTalk(null)}>
                  {talk.quote ? "How very… Austen" : talk.wait ? "I'll remember that" : "Thank you"}
                </button>
              </div>
            </div>
          )}
        </Sheet>

        <Sheet open={!!puzzle} onClose={() => setPuzzle(null)} labelledBy="em-puzzle-title" wide>
          {puzzle && s && sc.puzzles?.find((p) => p.id === puzzle) && (
            <>
              <PuzzleView
                puzzle={sc.puzzles.find((p) => p.id === puzzle)!}
                onWrong={() => play("wrong")}
                onSolved={() => {
                  const pz = sc.puzzles!.find((p) => p.id === puzzle)!;
                  play("solve");
                  update((x) => ({ ...x, flags: [...x.flags, `solved-${pz.id}`], found: x.found.includes(pz.clue) ? x.found : [...x.found, pz.clue] }));
                  setPuzzle(null);
                  setTalk({ who: "emma", title: pz.title, clue: pz.clue, fresh: true, note: "Solved!" });
                }}
              />
              <button type="button" className="em-btn is-ghost" onClick={() => setPuzzle(null)}>
                Leave it for now
              </button>
            </>
          )}
        </Sheet>

        <Sheet open={verdict !== null} onClose={() => setVerdict(null)} labelledBy="em-verdict-title">
          <div className="em-say">
            <img src="/emma/bust-emma.png" alt="" width={96} height={96} className="em-say-bust" />
            <div>
              <h2 id="em-verdict-title" className="em-h2">
                Not quite
              </h2>
              <p>
                {verdict === 0
                  ? "Oh dear. Not one of these would end happily."
                  : `Only ${verdict} of these ${Object.keys(sc.pairs).length} would end happily. I shan't say which.`}{" "}
                Let us listen a little more before the banns are read.
              </p>
              <button type="button" className="em-btn" data-autofocus onClick={() => setVerdict(null)}>
                Back to the board
              </button>
            </div>
          </div>
        </Sheet>

        <Sheet
          open={bookOpen}
          onClose={() => {
            setBookOpen(false);
            update((x) => ({ ...x, bookOpened: true }));
          }}
          labelledBy="em-book-title"
          wide
        >
          {bookOpen && s && (
            <>
              <Book sc={sc} s={s} onRead={(ids) => update((x) => ({ ...x, read: [...new Set([...x.read, ...ids])] }))} />
              <button
                type="button"
                className="em-btn"
                data-autofocus
                onClick={() => {
                  setBookOpen(false);
                  update((x) => ({ ...x, bookOpened: true }));
                }}
              >
                Close the book
              </button>
            </>
          )}
        </Sheet>

        <Sheet open={help} onClose={() => setHelp(false)} labelledBy="em-help-title" wide>
          <h2 id="em-help-title" className="em-h2">
            How to play
          </h2>
          <ol className="em-help">
            <li>Find out who belongs with whom. Four couples belong together; one lady and one gentleman are only there to confuse you. Every new season tells different stories.</li>
            <li>Tap a house and Emma walks there. Inside, talk to people (…) and look at things (?).</li>
            <li>Every clue ends with Emma&apos;s idea of where to go next. Some doors and some people only open up once you know something.</li>
            <li>Clues have kinds: feelings, the past, obstacles, secrets and rumours. Rumours can be false.</li>
            <li>At Hartfield (♥) tap a lady, then her gentleman, and give each engagement one clue as proof.</li>
            <li>Before you announce, Emma asks one question about each young lady&apos;s story. Get one wrong and you must find two more clues before she asks again.</li>
            <li>Then the ball: Emma announces the couples one by one, in front of everybody. Wrong ones are undone, and you try again. There is no clock.</li>
            <li>Mrs Bennet, Mr Darcy and other people from Jane Austen&apos;s novels are visiting. Tap them as they stroll past.</li>
          </ol>
          <button type="button" className="em-btn" data-autofocus onClick={() => setHelp(false)}>
            Understood
          </button>
        </Sheet>

        <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} labelledBy="em-settings-title">
          <h2 id="em-settings-title" className="em-h2">
            Settings
          </h2>
          <label className="em-toggle">
            <input type="checkbox" checked={settings.bigText} onChange={(e) => setSetting("bigText", e.target.checked)} />
            Larger text
          </label>
          <label className="em-toggle">
            <input type="checkbox" checked={settings.calm} onChange={(e) => setSetting("calm", e.target.checked)} />
            Calmer: no walking, no moving text or bouncing marks
          </label>
          {s && (
            <label className="em-toggle">
              <input type="checkbox" checked={s.sound} onChange={(e) => update((x) => ({ ...x, sound: e.target.checked }))} />
              Sound and music (also the 🔊 button at the top)
            </label>
          )}
          <button type="button" className="em-btn" data-autofocus onClick={() => setSettingsOpen(false)}>
            Done
          </button>
        </Sheet>

        <Sheet open={confirmNew} onClose={() => setConfirmNew(false)} labelledBy="em-new-title">
          <h2 id="em-new-title" className="em-h2">
            Start the season again?
          </h2>
          <p>Your current season will be forgotten.</p>
          <div className="em-row">
            <button type="button" className="em-btn" data-autofocus onClick={() => (setConfirmNew(false), start("season", true))}>
              Yes, start again
            </button>
            <button type="button" className="em-btn is-ghost" onClick={() => setConfirmNew(false)}>
              Keep my season
            </button>
          </div>
        </Sheet>
      </>
    );
  }
}

/** Emma's letters write themselves, unless the player prefers calm. */
function Typewriter({ text, calm }: { text: string; calm: boolean }) {
  const [n, setN] = useState(0);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const instant = calm || reduced;
  useEffect(() => {
    if (instant) return;
    const t = window.setInterval(() => setN((k) => (k >= text.length ? (window.clearInterval(t), k) : k + 2)), 24);
    return () => window.clearInterval(t);
  }, [text, instant]);
  return (
    <p className="em-letter-text" onClick={() => setN(text.length)}>
      <span aria-hidden="true">{instant ? text : text.slice(0, n)}</span>
      <span className="sr-only">{text}</span>
    </p>
  );
}
