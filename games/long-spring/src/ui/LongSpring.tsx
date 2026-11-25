"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { BIOMES, MONSTERS, MOUNTS, RIDERS, SWATCHES, TUNE, type Look, type Mount, type Rider } from "../config";
import { Game, heroPreview, type GameEvent, type Hud, type Mode } from "../game";
import { freshSave, loadSave, missionAt, today, wordOfDay, writeSave, type Save, type Settings, type Stats } from "../meta";
import { setSound, setSoundVolume } from "../sound";
import { setMusic, setMusicDanger, setMusicLand, setMusicMood, setMusicVolume } from "../music";
import { STUDIO_LOGO } from "../studio-logo";
import { iconUrls, type IconId, type Spr } from "../sprites";
import "../styles/long-spring.css";
import { Divider, Ornament } from "./Ornament";
import { ENDING, HEROINE, LAND_CHAPTERS, MEMORIES, MEMORIES_PER_LAND, PROLOGUE, RULES, VILLAGE_KINDS, mistOf } from "../story";

export type LongSpringProps = { exitHref?: string; exitLabel?: string };

type Screen = "title" | "begin" | "credits" | "rider" | "missions" | "help" | "settings" | "prologue" | "book" | "play" | "over";
type Result = {
  win: boolean; cause: string; metres: number; score: number; stats: Stats; best: boolean; missions: string[]; word: boolean;
  mode: Mode; land: number; reborn: number; memories: number[];
};
type Act = "left" | "right" | "up" | "down" | "aim" | "sword" | "trap" | "ability";

const KEYS: Record<string, Act> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  Space: "aim", KeyX: "sword", KeyK: "sword", KeyZ: "trap", KeyJ: "trap", KeyC: "ability", KeyL: "ability", ShiftLeft: "ability", ShiftRight: "ability",
};

const fmt = (n: number) => Math.floor(n).toLocaleString("en-GB");
const km = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.floor(m)} m`);
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };

/** four corners pointing out (go full screen) or in (leave it) */
function FsIcon({ on }: { on: boolean }) {
  const d = on
    ? "M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"
    : "M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const choiceOf = (s: Save) => ({ rider: RIDERS.find((r) => r.id === s.rider)!, mount: MOUNTS.find((m) => m.id === s.mount)!, look: s.looks[s.rider] });
/** the mission is always Brigid (the dryad), on whichever mount you have chosen */
/** the mission is always Brigid on her elk, whatever rides the endless road */
const brigidOf = (s: Save) => ({ rider: RIDERS.find((r) => r.id === "dryad")!, mount: MOUNTS.find((m) => m.id === "elk")!, look: s.looks.dryad });
const endlessLand = (s: Save) => Math.min(BIOMES.length - 1, s.furthestLand);

/** An animated picture of a rider on her mount, at the screen's resolution. */
function Preview({ rider, mount, look, calm, height, label, locked }: { rider: Rider; mount: Mount; look: Look; calm: boolean; height: number; label: string; locked?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const S = (height / 140) * Math.min(window.devicePixelRatio || 1, 2.5);
    const choice = { rider, mount, look };
    let f = 0;
    const frames: Spr[] = heroPreview(choice, null, 0, c, S);
    if (calm) return;
    const id = setInterval(() => heroPreview(choice, frames, ++f, c, S), 85);
    return () => clearInterval(id);
  }, [rider, mount, look, calm, height]);
  return (
    <canvas
      ref={ref}
      className={`ls-preview${locked ? " is-locked" : ""}`}
      style={{ height, width: (height * 84) / 140 }}
      role="img"
      aria-label={label}
    />
  );
}

/** A row in the picker: ◀ value ▶, also worked by the arrow keys. */
function Spinner({ label, value, onPrev, onNext, children, rowKey }: { label: string; value: string; onPrev: () => void; onNext: () => void; children?: React.ReactNode; rowKey: string }) {
  const onKey = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") onPrev();
    else if (e.key === "ArrowRight") onNext();
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const rows = [...document.querySelectorAll<HTMLElement>(".ls-spin .ls-spin-next")];
      const here = rows.findIndex((r) => r.closest(".ls-spin") === e.currentTarget);
      const to = rows[here + (e.key === "ArrowDown" ? 1 : -1)];
      to?.focus();
    } else return;
    e.preventDefault();
  };
  return (
    <div className="ls-spin" role="group" aria-label={label} onKeyDown={onKey} data-row={rowKey}>
      <span className="ls-spin-label">{label}</span>
      <button type="button" className="ls-spin-btn" onClick={onPrev} aria-label={`Previous ${label.toLowerCase()}`}>
        ◀
      </button>
      <span className="ls-spin-value" aria-live="polite">
        {children}
        {value}
      </span>
      <button type="button" className="ls-spin-btn ls-spin-next" onClick={onNext} aria-label={`Next ${label.toLowerCase()}`}>
        ▶
      </button>
    </div>
  );
}

function Bar({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="ls-bar">
      <span>{label}</span>
      <span className="ls-bar-track" aria-hidden="true">
        <span style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="ls-bar-text">{text}</span>
    </div>
  );
}

/** The round × in the corner of every page that can be closed. */
function Close({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ls-x" onClick={onClick} aria-label={label}>
      <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}

type Tab = { id: string; label: React.ReactNode; aria?: string; state?: "done" | "now" | "locked"; content: React.ReactNode };
/** Tabs (or, with `stepper`, the steps of a road): ← → move between them, as tabs should. */
function Tabs({ id, label, tabs, index, onIndex, stepper }: { id: string; label: string; tabs: Tab[]; index: number; onIndex: (i: number) => void; stepper?: boolean }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const open = tabs.map((t, i) => (t.state === "locked" ? -1 : i)).filter((i) => i >= 0);
  const onKey = (e: RKeyboardEvent<HTMLDivElement>) => {
    const at = open.indexOf(index);
    let to = -1;
    if (e.key === "ArrowRight") to = open[(at + 1) % open.length];
    else if (e.key === "ArrowLeft") to = open[(at - 1 + open.length) % open.length];
    else if (e.key === "Home") to = open[0];
    else if (e.key === "End") to = open[open.length - 1];
    else return;
    e.preventDefault();
    onIndex(to);
    refs.current[to]?.focus();
  };
  const cur = tabs[index] ?? tabs[0];
  return (
    <>
      <div className={stepper ? "ls-steps" : "ls-tabs"} role="tablist" aria-label={label} onKeyDown={onKey}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-controls={`${id}-panel`}
            aria-selected={i === index}
            aria-disabled={t.state === "locked" || undefined}
            aria-label={t.aria}
            tabIndex={i === index ? 0 : -1}
            className={`${stepper ? "ls-step" : "ls-tab"}${i === index ? " is-on" : ""}${t.state ? ` is-${t.state}` : ""}`}
            onClick={() => t.state !== "locked" && onIndex(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="ls-tabpanel" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${cur.id}`}>
        {cur.content}
      </div>
    </>
  );
}

/** A small living tree for the cards: it grows when the card comes up. */
function Sapling({ big }: { big: boolean }) {
  return (
    <svg className="ls-sapling" viewBox="0 0 80 90" aria-hidden="true" focusable="false">
      <ellipse cx="40" cy="84" rx="22" ry="4" fill="rgba(0,0,0,0.35)" />
      <g className="ls-sapling-grow">
        <path d="M40 84 C39 70 41 58 40 44" stroke="#6a4226" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M40 58 C33 52 28 50 22 50 M40 52 C48 46 54 44 60 45" stroke="#6a4226" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <circle cx="40" cy="32" r={big ? 24 : 18} fill="#3f8f2c" />
        <circle cx="28" cy="40" r={big ? 15 : 11} fill="#5aa040" />
        <circle cx="53" cy="38" r={big ? 16 : 12} fill="#4a9a34" />
        <circle cx="42" cy="22" r={big ? 13 : 10} fill="#7ac04a" />
        <circle cx="33" cy="30" r="2.6" fill="#ffe46a" />
        <circle cx="50" cy="27" r="2.6" fill="#ff8ab0" />
        <circle cx="45" cy="42" r="2.4" fill="#ffffff" />
        {!big && <path d="M40 46 l-7 10 M40 46 l6 11" stroke="#d0303a" strokeWidth="2.4" strokeLinecap="round" />}
      </g>
    </svg>
  );
}

type Moment = {
  village: string; kind: "village" | "glade"; names: string[]; gift?: string; giftId?: string; memory: number; clear: boolean; line?: string; key: number;
  hearts: number; souls: number; need: number;
};
/** the picture for each gift of the Named */
const GIFT_ICON: Record<string, IconId> = { sword: "sword", bow: "bow", traps: "trap", bark: "bark", heart: "heart", hound: "hound", raven: "raven", doe: "doe" };

export function LongSpring({ exitHref, exitLabel = "Back" }: LongSpringProps) {
  const [save, setSave] = useState<Save>(() => freshSave());
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>("title");
  const [hud, setHud] = useState<Hud | null>(null);
  const [toast, setToast] = useState("");
  const [live, setLive] = useState("");
  const [paused, setPaused] = useState(false);
  const [swordCard, setSwordCard] = useState(false);
  const [banner, setBanner] = useState("");
  const [lesson, setLesson] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [tune, setTune] = useState(false);
  const [, setTuneTick] = useState(0);
  const [runId, setRunId] = useState(0);
  const [browse, setBrowse] = useState({ rider: 0, mount: 0 });
  const [icons, setIcons] = useState<Record<IconId, string> | null>(null);
  const [full, setFull] = useState(false);
  const [moment, setMoment] = useState<Moment | null>(null);
  const [memoryCard, setMemoryCard] = useState<number | null>(null);
  /** the memory on the card has come back clear (found a second time) */
  const [memClear, setMemClear] = useState(false);
  /** what the pause (or the end) dialog shows: its own buttons, the settings, or the book */
  const [view, setView] = useState<"main" | "settings" | "book">("main");
  const [bookTab, setBookTab] = useState(0);
  const [reading, setReading] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [helpTab, setHelpTab] = useState(0);
  /** the step of The First Morning, so the hud can point at what the lesson is about */
  const [tutStep, setTutStep] = useState(-1);
  /** the opening: 0 the studio, 1 the title, 2 over */
  const [intro, setIntro] = useState<0 | 1 | 2>(0);
  const momentAt = useRef(0);
  const momentBtn = useRef<HTMLButtonElement>(null);
  const screenRef = useRef<Screen>("title");
  const memHead = useRef<HTMLHeadingElement>(null);
  const viewHead = useRef<HTMLHeadingElement>(null);
  const fullOn = useRef(false);
  const nativeFull = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const saveRef = useRef(save);
  const runRef = useRef<{ missions: string[]; word: boolean; memories: number[] }>({ missions: [], word: false, memories: [] });
  const modeRef = useRef<Mode>("endless");
  const [mode, setMode] = useState<Mode>("endless");
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const pauseHead = useRef<HTMLHeadingElement>(null);
  const swordHead = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const s = loadSave();
    setSave(s);
    saveRef.current = s;
    setBrowse({ rider: RIDERS.findIndex((r) => r.id === s.rider), mount: MOUNTS.findIndex((m) => m.id === s.mount) });
    setLoaded(true);
    setSound(s.settings.sound);
    setSoundVolume(s.settings.soundVol);
    setMusicVolume(s.settings.musicVol);
    setMusic(false);
    setTune(new URLSearchParams(location.search).has("tune"));
    setIcons(iconUrls());
  }, []);

  // the opening: the studio, then the title; any key or click skips it, and lets the music begin
  useEffect(() => {
    if (!loaded) return;
    const calm = saveRef.current.settings.calm;
    const t1 = setTimeout(() => setIntro((i) => (i === 0 ? 1 : i)), calm ? 1000 : 2000);
    const t2 = setTimeout(() => setIntro(2), calm ? 2200 : 4600);
    const first = () => {
      if (saveRef.current.settings.music) setMusic(true);
      setIntro(2);
      window.removeEventListener("pointerdown", first);
      window.removeEventListener("keydown", first);
    };
    window.addEventListener("pointerdown", first);
    window.addEventListener("keydown", first);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("pointerdown", first);
      window.removeEventListener("keydown", first);
    };
  }, [loaded]);
  const finaleOn = !!hud?.finale;
  useEffect(() => {
    if (screen === "play") setMusicMood(finaleOn ? "finale" : "ride");
    else if (screen === "over") setMusicMood(result?.win ? "finale" : "death");
    else setMusicMood("menu");
  }, [screen, finaleOn, result]);

  /* ---------------- full screen ---------------- */

  // the browser's own full screen where there is one; otherwise (iPhone) the game simply covers the page
  const setFullscreen = useCallback((on: boolean) => {
    const el = rootRef.current as FsEl | null;
    const d = document as FsDoc;
    fullOn.current = on;
    setFull(on);
    if (on && el) {
      try {
        if (el.requestFullscreen) {
          nativeFull.current = true;
          el.requestFullscreen({ navigationUI: "hide" }).catch(() => {
            nativeFull.current = false;
          });
        } else if (el.webkitRequestFullscreen) {
          nativeFull.current = true;
          el.webkitRequestFullscreen();
        }
      } catch {
        nativeFull.current = false;
      }
    } else if (!on) {
      nativeFull.current = false;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else if (d.webkitFullscreenElement) d.webkitExitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const d = document as FsDoc;
    // Esc or the browser's own button left full screen
    const changed = () => {
      if (!(document.fullscreenElement ?? d.webkitFullscreenElement) && nativeFull.current) {
        nativeFull.current = false;
        fullOn.current = false;
        setFull(false);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.code !== "KeyF" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      setFullscreen(!fullOn.current);
    };
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("webkitfullscreenchange", changed);
    window.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("webkitfullscreenchange", changed);
      window.removeEventListener("keydown", key);
      if (fullOn.current) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        document.documentElement.classList.remove("ls-lock");
      }
    };
  }, [setFullscreen]);

  useEffect(() => {
    document.documentElement.classList.toggle("ls-lock", full);
  }, [full]);

  const update = useCallback((fn: (s: Save) => Save) => {
    const next = fn(saveRef.current);
    saveRef.current = next;
    setSave(next);
    writeSave(next);
    return next;
  }, []);

  useEffect(() => {
    if (screen !== "play") headRef.current?.focus();
  }, [screen]);
  useEffect(() => {
    if (paused) pauseHead.current?.focus();
  }, [paused]);
  useEffect(() => {
    if (screen === "prologue" && !saveRef.current.prologueSeen) update((s) => ({ ...s, prologueSeen: true }));
  }, [screen, update]);
  useEffect(() => {
    if (swordCard) swordHead.current?.focus();
  }, [swordCard]);
  useEffect(() => {
    if (memoryCard !== null) memHead.current?.focus();
  }, [memoryCard]);
  useEffect(() => {
    if (view !== "main") viewHead.current?.focus();
    else if (paused) pauseHead.current?.focus();
    else if (screenRef.current === "over") headRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);
  useEffect(() => {
    screenRef.current = screen;
    setPage(0);
    setReading(null);
  }, [screen]);
  // Esc closes a page of the menu, as its × does
  useEffect(() => {
    if (screen === "play" || screen === "title" || (screen === "over" && view === "main")) return;
    const down = (e: KeyboardEvent) => {
      if (e.code !== "Escape") return;
      e.preventDefault();
      if (screen === "over") setView("main");
      else if (reading !== null) setReading(null);
      else if (screen === "prologue" && page > 0) setPage(page - 1);
      else setScreen(screen === "missions" ? "rider" : "title");
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [screen, view, reading, page]);

  const holdUntil = useRef(0);
  const queue = useRef<string[]>([]);
  const show = useCallback((text: string, ms: number) => {
    setToast(text);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => {
      setToast("");
      const next = queue.current.shift();
      if (next) {
        const t = Math.min(6500, 2600 + next.length * 35);
        holdUntil.current = Date.now() + t;
        show(next, t);
      }
    }, ms);
  }, []);
  const say = useCallback(
    (text: string, important = false) => {
      setLive(text);
      const busy = Date.now() < holdUntil.current;
      // important lines wait their turn and stay up; chatter never pushes them off (it still goes to screen readers)
      if (busy) {
        if (important && queue.current.length < 3) queue.current.push(text);
        return;
      }
      const ms = Math.min(6500, (important ? 2600 : 1600) + text.length * 35);
      if (important) holdUntil.current = Date.now() + ms;
      show(text, ms);
    },
    [show],
  );

  /* ---------------- the run ---------------- */

  const onEvent = useCallback(
    (e: GameEvent) => {
      const g = gameRef.current;
      if (e.type === "say") say(e.text, e.important);
      else if (e.type === "lesson") {
        setLesson(e.text);
        setLive(e.text);
      }
      else if (e.type === "mission") {
        const s = update((s) => {
          const open = [...s.open];
          runRef.current.missions.push(missionAt(open[e.slot]).text);
          open[e.slot] = s.nextMission;
          return { ...s, open, nextMission: s.nextMission + 1, multiplier: s.multiplier + 1 };
        });
        say(`Mission complete! Score multiplier ×${s.multiplier}.`);
        g?.setMissions(s.open.map(missionAt), s.multiplier);
      } else if (e.type === "letter") {
        const word = wordOfDay();
        const s = update((s) => {
          const done = e.done && !s.word.done;
          return { ...s, word: { day: today(), got: e.got, done: s.word.done || e.done }, multiplier: s.multiplier + (done ? 1 : 0) };
        });
        if (e.done) {
          runRef.current.word = true;
          say(`You spelled ${word}! Score multiplier ×${s.multiplier}.`);
          g?.setMissions(s.open.map(missionAt), s.multiplier);
        } else say(`Letter ${word[e.got - 1]}: ${word.slice(0, e.got)}${"·".repeat(word.length - e.got)}`);
      } else if (e.type === "biome") {
        const b = BIOMES[e.index];
        setBanner(b.banner);
        setLive(b.banner);
        setTimeout(() => setBanner(""), 3200);
        if (modeRef.current === "mission")
          update((s) => ({ ...s, furthestLand: Math.max(s.furthestLand, e.index), checkpoint: e.index }));
      } else if (e.type === "saved") {
        if (modeRef.current !== "mission") return;
        update((s) => ({
          ...s,
          named: [...s.named, ...e.names.map((n) => `${n}, of ${e.village}`)].slice(-400),
          soulsTotal: s.soulsTotal + e.size,
          memories: e.memory >= 0 && !e.clear && !s.memories.includes(e.memory) ? [...s.memories, e.memory] : s.memories,
          clear: e.memory >= 0 && e.clear && !s.clear.includes(e.memory) ? [...s.clear, e.memory] : s.clear,
        }));
        if (e.memory >= 0) runRef.current.memories.push(e.memory);
        if (e.line) setMoment((m) => (m && m.village === e.village ? { ...m, line: e.line } : m));
      } else if (e.type === "moment") {
        // the world holds still until the player rides on: a card says what the village gave
        momentAt.current = Date.now();
        setMoment({
          village: e.village, kind: e.kind === "glade" ? "glade" : "village", names: e.names, gift: e.gift, giftId: e.giftId, memory: e.memory,
          clear: e.clear, key: Date.now(), hearts: e.hearts, souls: e.souls, need: e.need,
        });
        const what =
          e.kind === "glade"
            ? `The glade is healed. No souls, and your heart stays.${e.gift ? ` A gift of the land: ${e.gift}.` : ""}${e.memory >= 0 ? (e.clear ? ` Memory ${e.memory + 1} comes back clear.` : ` Memory ${e.memory + 1} comes back.`) : ""}`
            : `${e.names.join(" and ")} of ${e.village} are saved: two souls, ${e.souls} of ${e.need}.`;
        setLive(`${what} Press Space or Enter to ride on.`);
      } else if (e.type === "tutorial") {
        setTutStep(e.done ? -1 : e.step);
        if (e.done) update((s) => ({ ...s, tutorialDone: true }));
      } else if (e.type === "seen") update((s) => ({ ...s, seenMonsters: [...new Set([...s.seenMonsters, e.monster])] }));
      else if (e.type === "seenKind") update((s) => ({ ...s, seenKinds: [...new Set([...s.seenKinds, e.kind])] }));
      else if (e.type === "swordFirst") {
        g?.pause();
        setSwordCard(true);
        update((s) => ({ ...s, seenSword: true }));
      } else if (e.type === "end") {
        let best = false;
        if (e.mode === "endless") {
          best = e.score > saveRef.current.best;
          update((s) => ({
            ...s, best: Math.max(s.best, e.score), bestMetres: Math.max(s.bestMetres, e.metres), bestSouls: Math.max(s.bestSouls, e.stats.souls),
          }));
        } else if (e.mode === "mission" && e.win)
          update((s) => ({
            ...s, wins: s.wins + 1, endings: s.endings + 1, furthestLand: BIOMES.length, checkpoint: 0,
            bestEnding: Math.max(s.bestEnding, e.stats.souls + e.reborn),
          }));
        setResult({ ...e, best, missions: runRef.current.missions, word: runRef.current.word, memories: runRef.current.memories });
        setScreen("over");
      }
    },
    [say, update],
  );

  const ride = useCallback((m: Mode = modeRef.current) => {
    modeRef.current = m;
    setMode(m);
    if (saveRef.current.settings.full && !fullOn.current) setFullscreen(true);
    gameRef.current?.destroy();
    runRef.current = { missions: [], word: false, memories: [] };
    setResult(null);
    setPaused(false);
    setSwordCard(false);
    setMemoryCard(null);
    setMoment(null);
    setView("main");
    setBanner("");
    setLesson("");
    setToast("");
    queue.current = [];
    holdUntil.current = 0;
    setScreen("play");
    setRunId((n) => n + 1);
  }, [setFullscreen]);

  const playing = screen === "play" || screen === "over";

  // the still land behind the menus
  useEffect(() => {
    if (!loaded || playing || !canvasRef.current) return;
    const s = saveRef.current;
    gameRef.current?.destroy();
    const g = new Game(canvasRef.current, {
      choice: choiceOf(s), settings: s.settings, multiplier: 1, missions: [], word: "", wordGot: 0,
      seenSword: true, seenMonsters: [], seenKinds: [], showcase: true, onHud: () => {}, onEvent: () => {},
      startLand: endlessLand(s),
    });
    gameRef.current = g;
    const ro = new ResizeObserver(() => g.resize());
    ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [loaded, playing]);

  // a real run
  useEffect(() => {
    if (!runId || !canvasRef.current) return;
    const s = saveRef.current;
    gameRef.current?.destroy();
    const m = modeRef.current;
    const endless = m === "endless";
    const game = new Game(canvasRef.current, {
      choice: endless ? choiceOf(s) : brigidOf(s),
      mode: m,
      startLand: endless ? endlessLand(s) : m === "mission" ? Math.min(s.checkpoint, BIOMES.length - 1) : 0,
      memories: [...s.memories],
      clear: [...s.clear],
      settings: s.settings,
      multiplier: endless ? s.multiplier : 1,
      missions: endless ? s.open.map(missionAt) : [],
      word: endless ? wordOfDay() : "",
      wordGot: s.word.done ? wordOfDay().length : s.word.got,
      seenSword: s.seenSword,
      seenMonsters: [...s.seenMonsters],
      seenKinds: [...s.seenKinds],
      onHud: (h) => {
        setHud(h);
        setMusicDanger(h.danger);
        setMusicLand(h.land);
      },
      onEvent,
    });
    gameRef.current = game;
    rootRef.current?.scrollIntoView({ block: "start", behavior: "auto" });
    if (new URLSearchParams(location.search).has("tune")) (window as unknown as { longSpring: Game }).longSpring = game;
    setHud(game.hud());
    stageRef.current?.focus();
    game.start();
    const c = endless ? choiceOf(s) : brigidOf(s);
    if (endless) say(`${c.rider.name} on ${c.mount.name.toLowerCase()}, in ${BIOMES[endlessLand(s)].name}. Ride! ← → to steer.`);
    else if (m === "mission")
      say(`${HEROINE} rides out into ${BIOMES[Math.min(s.checkpoint, BIOMES.length - 1)].name}. Give your hearts to the villages; when enough souls are saved, a gate opens.`);
    const ro = new ResizeObserver(() => game.resize());
    ro.observe(canvasRef.current);
    const hide = () => {
      if (document.hidden && !game.paused) {
        game.pause();
        setPaused(true);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      ro.disconnect();
      document.removeEventListener("visibilitychange", hide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => () => gameRef.current?.destroy(), []);

  const togglePause = useCallback(() => {
    const g = gameRef.current;
    if (!g || screen !== "play" || swordCard || memoryCard !== null) return;
    if (g.paused) {
      setPaused(false);
      setView("main");
      g.start();
      stageRef.current?.focus();
    } else {
      g.pause();
      setView("main");
      setPaused(true);
    }
  }, [screen, swordCard, memoryCard]);

  const closeMemory = useCallback(() => {
    setMemoryCard(null);
    gameRef.current?.release();
    gameRef.current?.start();
    stageRef.current?.focus();
  }, []);

  /** ride on from a saved village: first its memory, if it had one */
  const rideOn = useCallback(() => {
    setMoment((m) => {
      if (!m) return m;
      if (m.memory >= 0) {
        setMemClear(m.clear);
        setMemoryCard(m.memory);
      }
      else {
        gameRef.current?.release();
        stageRef.current?.focus();
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (screen !== "play") return;
    const down = (e: KeyboardEvent) => {
      if (memoryCard !== null) {
        if (e.code === "Escape") {
          e.preventDefault();
          closeMemory();
        }
        return;
      }
      if (moment && !paused && e.code !== "Escape" && e.code !== "KeyP") {
        // Space, Enter or a steering key rides on; not in the first moment, so a key held from riding doesn't skip it
        if (!e.repeat && Date.now() - momentAt.current > 900 && (e.code === "Space" || e.code === "Enter" || KEYS[e.code])) rideOn();
        e.preventDefault();
        return;
      }
      if (paused && view !== "main" && e.code === "Escape") {
        e.preventDefault();
        setView("main");
        return;
      }
      if (e.code === "Escape" || e.code === "KeyP" || ((e.code === "Enter" || e.code === "Space") && gameRef.current?.hud().finale)) {
        e.preventDefault();
        if (gameRef.current?.hud().finale) gameRef.current.skipFinale();
        else togglePause();
        return;
      }
      const a = KEYS[e.code];
      if (!a || paused || swordCard) return;
      e.preventDefault();
      if (e.repeat) return;
      gameRef.current?.key(a, true);
    };
    const up = (e: KeyboardEvent) => {
      const a = KEYS[e.code];
      if (!a) return;
      e.preventDefault();
      gameRef.current?.key(a, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [screen, paused, swordCard, togglePause, memoryCard, closeMemory, view, moment, rideOn]);
  useEffect(() => {
    if (moment && !paused) momentBtn.current?.focus({ preventScroll: true });
  }, [moment, paused]);

  type Flag = { [K in keyof Settings]: Settings[K] extends boolean ? K : never }[keyof Settings];
  const setSetting = (k: Flag, v: boolean) => {
    const s = update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));
    if (k === "sound") setSound(v);
    if (k === "music") setMusic(v);
    gameRef.current?.setSettings(s.settings);
  };
  const setVolume = (k: "musicVol" | "soundVol", v: number) => {
    update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));
    if (k === "musicVol") setMusicVolume(v);
    else setSoundVolume(v);
  };

  /* ---------------- pieces ---------------- */

  const touchBtn = (a: Act, label: string, icon: React.ReactNode, extra = "") => (
    <button
      type="button"
      className={`ls-touch ${extra}`}
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        gameRef.current?.key(a, true);
      }}
      onPointerUp={() => gameRef.current?.key(a, false)}
      onPointerCancel={() => gameRef.current?.key(a, false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  );

  const word = wordOfDay();
  const wordGot = save.word.done ? word.length : save.word.got;
  const wordStrip = (got: number) => (
    <span className="ls-word" aria-label={`Today's word: ${got} of ${word.length} letters found${got ? `, ${word.slice(0, got)}` : ""}`}>
      {[...word].map((ch, i) => (
        <span key={i} className={i < got ? "is-got" : ""} aria-hidden="true">
          {i < got ? ch : "·"}
        </span>
      ))}
    </span>
  );

  const ico = (id: IconId, fallback: string) =>
    icons ? <img src={icons[id]} alt="" className="ls-ico" draggable={false} /> : <span aria-hidden="true">{fallback}</span>;
  const fsButton = (cls: string) => (
    <button
      type="button"
      className={cls}
      aria-pressed={full}
      onClick={() => {
        setFullscreen(!full);
        if (screen === "play") stageRef.current?.focus();
      }}
    >
      <FsIcon on={full} />
      <span className={cls === "ls-fs" ? "" : "sr-only"}>Full screen</span>
    </button>
  );

  const settingsList = (
    <ul className="ls-toggles">
      {(
        [
          ["slow", "Reduced speed: everything runs at three quarters of the speed"],
          ["visible", "High visibility: outlines on everything you can hit, “↑ jump” under logs and thorns, “↓ duck” under arches"],
          ["lessBlood", "Less blood: grey dust instead of blood"],
          ["calm", "Calmer: no shaking, flashing or waves of light"],
          ["music", "Music: a voice and a drum"],
          ["sound", "Sounds"],
          ["full", "Full screen when I ride (F or the corner button switch it at any time)"],
        ] as [Flag, string][]
      ).map(([k, label]) => (
        <li key={k}>
          <label className="ls-toggle">
            <input type="checkbox" checked={save.settings[k]} onChange={(e) => setSetting(k, e.target.checked)} />
            <span>{label}</span>
          </label>
        </li>
      ))}
      <li className="ls-volumes">
        {(
          [
            ["musicVol", "Music volume", save.settings.music],
            ["soundVol", "Sound volume", save.settings.sound],
          ] as ["musicVol" | "soundVol", string, boolean][]
        ).map(([k, label, enabled]) => (
          <label key={k} className="ls-volume">
            <span>{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(save.settings[k] * 100)}
              disabled={!enabled}
              aria-valuetext={`${Math.round(save.settings[k] * 100)} percent`}
              onChange={(e) => setVolume(k, +e.target.value / 100)}
            />
          </label>
        ))}
      </li>
    </ul>
  );


  /* ---------------- menus (over the still land) ---------------- */

  const bRider = RIDERS[browse.rider] ?? RIDERS[0];
  const bMount = MOUNTS[browse.mount] ?? MOUNTS[0];
  const riderLocked = save.multiplier < bRider.unlock;
  const mountLocked = save.multiplier < bMount.unlock;
  const look = save.looks[bRider.id];
  const cycle = (dir: number, n: number, i: number) => (i + dir + n) % n;
  const pickRider = (dir: number) => {
    const i = cycle(dir, RIDERS.length, browse.rider);
    setBrowse((b) => ({ ...b, rider: i }));
    if (save.multiplier >= RIDERS[i].unlock) update((s) => ({ ...s, rider: RIDERS[i].id }));
  };
  const pickMount = (dir: number) => {
    const i = cycle(dir, MOUNTS.length, browse.mount);
    setBrowse((b) => ({ ...b, mount: i }));
    if (save.multiplier >= MOUNTS[i].unlock) update((s) => ({ ...s, mount: MOUNTS[i].id }));
  };
  const pickColour = (slot: keyof Look, dir: number) => {
    const list = SWATCHES[slot].colours;
    const i = cycle(dir, list.length, Math.max(0, list.indexOf(look[slot])));
    update((s) => ({ ...s, looks: { ...s.looks, [bRider.id]: { ...s.looks[bRider.id], [slot]: list[i] } } }));
  };

  let menu: React.ReactNode = null;
  const memCount = save.memories.length;
  const openMission = () => {
    if (!save.prologueSeen || !save.tutorialDone) setScreen("prologue");
    else if (save.checkpoint > 0) setScreen("begin");
    else ride("mission");
  };
  /** the whole mission again from the Rot: the book and the Named stay */
  const beginAgain = () => {
    update((s) => ({ ...s, checkpoint: 0 }));
    ride("mission");
  };
  const landName = (i: number) => BIOMES[Math.min(i, BIOMES.length - 1)].name;
  const toTitle = () => setScreen("title");
  const x = <Close onClick={toTitle} label="Close, back to the menu" />;

  /* the Book of Memories: four lands, one after the other like the steps of a road, then the Named */
  const inRun = screen === "play" || screen === "over";
  const curLand = Math.min(
    BIOMES.length - 1,
    inRun && hud && hud.mode === "mission" ? hud.land : save.endings > 0 ? BIOMES.length - 1 : save.checkpoint,
  );
  const reached = Math.max(save.furthestLand, curLand);
  const openBook = () => {
    setBookTab(curLand);
    setReading(null);
  };
  const memoryArticle = (i: number, nav: boolean) => {
    const m = MEMORIES[i];
    const mine = MEMORIES.map((mm, j) => ({ mm, j })).filter(({ mm, j }) => mm.land === m.land && save.memories.includes(j));
    const at = mine.findIndex(({ j }) => j === i);
    const prev = mine[at - 1]?.j;
    const next = mine[at + 1]?.j;
    return (
      <article className="ls-mist is-page" aria-label={`Memory ${i + 1}: ${m.title}`}>
        <p className="ls-kicker ls-mist-kick">
          Memory {i + 1} of {MEMORIES.length} · {save.clear.includes(i) ? "clear" : "still in mist"}
        </p>
        <p className="ls-mist-sign">{m.sign}</p>
        <h4 className="ls-mist-title">{m.title}</h4>
        <p className="ls-mist-text">{save.clear.includes(i) ? m.text : mistOf(i).text}</p>
        {!save.clear.includes(i) && <p className="ls-muted ls-small ls-mist-more-note">The rest is in mist. A glade will bring it back clear, once every memory has been found.</p>}
        {nav && (
          <div className="ls-mist-nav">
            <button type="button" className="ls-chipbtn" onClick={() => prev !== undefined && setReading(prev)} disabled={prev === undefined}>
              ◂ <span className="sr-only">Previous memory</span>
            </button>
            <button type="button" className="ls-chipbtn" onClick={() => setReading(null)}>
              All of {BIOMES[m.land].name}
            </button>
            <button type="button" className="ls-chipbtn" onClick={() => next !== undefined && setReading(next)} disabled={next === undefined}>
              <span className="sr-only">Next memory</span> ▸
            </button>
          </div>
        )}
      </article>
    );
  };
  const bookTabs: Tab[] = BIOMES.map((b, land) => {
    const list = MEMORIES.map((m, i) => ({ m, i })).filter(({ m }) => m.land === land);
    const found = list.filter(({ i }) => save.memories.includes(i)).length;
    const locked = land > reached;
    return {
      id: `land${land}`,
      state: locked ? "locked" : land === curLand ? "now" : land < curLand ? "done" : undefined,
      aria: `${land + 1}. ${b.name}${locked ? ", not reached yet" : `, ${found} of ${MEMORIES_PER_LAND} memories`}${land === curLand && !locked ? ", where you are now" : ""}`,
      label: (
        <>
          <span className="ls-step-n" aria-hidden="true">
            {found === MEMORIES_PER_LAND ? "✓" : land + 1}
          </span>
          <span className="ls-step-name" aria-hidden="true">
            {b.name}
          </span>
          <span className="ls-step-count" aria-hidden="true">
            {locked ? "not yet" : `${found}/${MEMORIES_PER_LAND}`}
          </span>
        </>
      ),
      content:
        reading !== null && MEMORIES[reading].land === land ? (
          memoryArticle(reading, true)
        ) : (
          <>
            <h3 className="ls-h3 ls-chapter-title">
              {b.name}: <em>{LAND_CHAPTERS[land]}</em>
            </h3>
            <ul className="ls-mist-grid">
              {list.map(({ m, i }) =>
                save.memories.includes(i) ? (
                  <li key={i}>
                    <button type="button" className="ls-mist is-card" onClick={() => setReading(i)}>
                      <span className="ls-mist-n" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="sr-only">Memory {i + 1}{save.clear.includes(i) ? ", clear" : ", in mist"}:</span>
                      <span className="ls-mist-title">{m.title}</span>
                      <span className="ls-mist-state" aria-hidden="true">
                        {save.clear.includes(i) ? "clear" : "in mist"}
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={i}>
                    <span className="ls-mist is-card is-missing">
                      <span className="ls-mist-n" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span aria-hidden="true">· · ·</span>
                      <span className="sr-only">Memory {i + 1}, not found yet</span>
                    </span>
                  </li>
                ),
              )}
            </ul>
            <p className="ls-muted ls-small ls-center">
              {found === MEMORIES_PER_LAND
                ? "Every memory of this land has come back."
                : "Hamlets of two souls carry them, always the first one missing. Any you miss here wait for you in the next land."}
            </p>
          </>
        ),
    };
  });
  bookTabs.push({
    id: "named",
    label: <>The Named · {fmt(save.named.length)}</>,
    content: save.named.length ? (
      <>
        <ul className="ls-named">
          {[...save.named].reverse().slice(0, 30).map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
        {save.named.length > 30 && <p className="ls-muted ls-small ls-center">and {fmt(save.named.length - 30)} more before them.</p>}
      </>
    ) : (
      <p className="ls-muted ls-center">Nobody yet. The hamlets of two souls keep their names.</p>
    ),
  });
  if (save.endings > 0)
    bookTabs.push({
      id: "end",
      label: "The golden gate",
      content: (
        <div className="ls-chapter">
          {ENDING.map((p, i) => (
            <p key={i} className="ls-verse">
              {p}
            </p>
          ))}
        </div>
      ),
    });
  const bookBody = (
    <Tabs
      id="ls-book"
      label="Lands of the book"
      tabs={bookTabs}
      index={Math.min(bookTab, bookTabs.length - 1)}
      onIndex={(i) => {
        setBookTab(i);
        setReading(null);
      }}
      stepper
    />
  );

  if (screen === "title")
    menu = (
      <section className="ls-panel is-title" aria-labelledby="ls-title">
        <Ornament medal />
        <p className="ls-kicker">{HEROINE}&apos;s ride through the rot</p>
        <h1 id="ls-title" className="ls-h1" tabIndex={-1} ref={headRef}>
          The Long Spring
        </h1>
        <Divider />
        <div className="ls-hero">
          <Preview {...brigidOf(save)} calm={save.settings.calm} height={120} label={`${HEROINE} on ${brigidOf(save).mount.name}`} />
        </div>
        <p className="ls-lead">
          The world has turned inside out. Ride with {HEROINE}, give your heart to the villages, and bring the spring back.
        </p>
        <div className="ls-stack is-wide">
          <button type="button" className="ls-btn is-big" onClick={openMission}>
            {save.endings > 0 ? "The mission again" : "The mission"}
            <span className="ls-btn-sub">
              {HEROINE}&apos;s story · {save.endings > 0 ? "from the start" : landName(save.checkpoint)}
            </span>
          </button>
          <button type="button" className="ls-btn is-big" onClick={() => ride("endless")}>
            Endless ride
            <span className="ls-btn-sub">Any rider · {landName(endlessLand(save))}</span>
          </button>
          <div className="ls-grid2">
            <button
              type="button"
              className="ls-btn is-ghost"
              onClick={() => {
                openBook();
                setScreen("book");
              }}
            >
              The book · {memCount}/{MEMORIES.length}
            </button>
            <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("rider")}>
              Rider &amp; mount
            </button>
            <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("help")}>
              How to play
            </button>
            <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("settings")}>
              Settings
            </button>
          </div>
        </div>
        <p className="ls-muted ls-small">
          Souls saved: {fmt(save.soulsTotal)} · Endless best: {km(save.bestMetres)}, {fmt(save.bestSouls)} souls
        </p>
        <p className="ls-credits-link">
          <button type="button" className="ls-linkbtn" onClick={() => setScreen("credits")}>
            Credits &amp; legal
          </button>
        </p>
        {exitHref && (
          <a className="ls-exit" href={exitHref}>
            {exitLabel}
          </a>
        )}
      </section>
    );
  else if (screen === "credits")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-credits-title">
        <Ornament />
        {x}
        <div className="ls-credits-logo" dangerouslySetInnerHTML={{ __html: STUDIO_LOGO }} />
        <h2 id="ls-credits-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Credits &amp; legal
        </h2>
        <dl className="ls-credits">
          <dt>The Long Spring</dt>
          <dd>A game by Marcel Šedo · Marcel Šedo Studio, Bratislava.</dd>
          <dt>Copyright</dt>
          <dd>© 2026 Marcel Šedo. All rights reserved. The game, its pictures, story and verses may not be copied or sold without permission.</dd>
          <dt>Music</dt>
          <dd>A voice and a frame drum, made in your browser as you play. There are no recordings.</dd>
          <dt>Lettering</dt>
          <dd>
            Uncial Antiqua by Astigmatic, under the SIL Open Font License 1.1. Everything else is drawn in code for this
            game.
          </dd>
          <dt>Privacy</dt>
          <dd>Your progress is kept only in this browser. Nothing is sent anywhere, and nothing is tracked.</dd>
        </dl>
      </section>
    );
  else if (screen === "begin")
    menu = (
      <section className="ls-panel" aria-labelledby="ls-begin-title">
        <Ornament medal />
        {x}
        <p className="ls-kicker">The mission</p>
        <h2 id="ls-begin-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Where does {HEROINE} ride from?
        </h2>
        <div className="ls-stack is-wide">
          <button type="button" className="ls-btn is-big" onClick={() => ride("mission")}>
            Ride on
            <span className="ls-btn-sub">from the gate of {landName(save.checkpoint)}</span>
          </button>
          <button type="button" className="ls-btn is-big is-alt" onClick={beginAgain}>
            Begin again
            <span className="ls-btn-sub">the whole mission, from The Rot</span>
          </button>
        </div>
        <p className="ls-muted ls-small">
          Beginning again keeps the Book of Memories and the Named. The lands, the souls and the gates start over.
        </p>
        <div className="ls-grid2 is-narrow">
          <button type="button" className="ls-btn is-ghost" onClick={() => ride("tutorial")}>
            The First Morning
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("prologue")}>
            The prologue
          </button>
        </div>
      </section>
    );
  else if (screen === "prologue") {
    const pages = 3;
    const pager = (
      <div className="ls-pager">
        <button type="button" className="ls-chipbtn" onClick={() => setPage(page - 1)} disabled={page === 0}>
          ◂ Back
        </button>
        <span className="ls-dots" aria-label={`Page ${page + 1} of ${pages}`}>
          {Array.from({ length: pages }, (_, i) => (
            <span key={i} className={i === page ? "is-on" : ""} aria-hidden="true" />
          ))}
        </span>
        <button type="button" className="ls-chipbtn" onClick={() => setPage(page + 1)} disabled={page === pages - 1}>
          Next ▸
        </button>
      </div>
    );
    const titles = ["The world turned inside out", "People, or the land", `How ${HEROINE} heals`];
    menu = (
      <section className="ls-panel is-text is-book" aria-labelledby="ls-prologue-title">
        <Ornament medal />
        {x}
        <p className="ls-kicker">Prologue · {page + 1} of {pages}</p>
        <h2 id="ls-prologue-title" className="ls-h2" tabIndex={-1} ref={headRef} key={page}>
          {titles[page]}
        </h2>
        {page === 0 && (
          <div className="ls-prologue-verses">
            {PROLOGUE.map((p, i) => (
              <p key={i} className={`ls-verse${i === 0 ? " ls-initial" : ""}`}>
                {p}
              </p>
            ))}
          </div>
        )}
        {page === 1 && (
          <ul className="ls-kinds">
            {(["hamlet", "village", "glade"] as const).map((n) => (
              <li key={n}>
                <span className="ls-kind-n" aria-hidden="true">
                  {VILLAGE_KINDS[n].souls || "✦"}
                </span>
                <strong>
                  {VILLAGE_KINDS[n].name} <span className="sr-only">,</span>
                  <span className="ls-muted"> · {VILLAGE_KINDS[n].short}</span>
                </strong>
                <span>{VILLAGE_KINDS[n].text}</span>
              </li>
            ))}
          </ul>
        )}
        {page === 2 && (
          <>
            <ul className="ls-help">
              {RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <div className="ls-stack is-wide">
              {!save.tutorialDone ? (
                <>
                  <button type="button" className="ls-btn is-big" onClick={() => ride("tutorial")}>
                    Begin: The First Morning
                  </button>
                  <button
                    type="button"
                    className="ls-btn is-ghost"
                    onClick={() => {
                      update((s) => ({ ...s, tutorialDone: true }));
                      ride("mission");
                    }}
                  >
                    Skip it: ride the mission
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="ls-btn is-big" onClick={() => ride("mission")}>
                    Ride
                  </button>
                  <button type="button" className="ls-btn is-ghost" onClick={() => ride("tutorial")}>
                    The First Morning again
                  </button>
                </>
              )}
            </div>
          </>
        )}
        {pager}
      </section>
    );
  } else if (screen === "book")
    menu = (
      <section className="ls-panel is-text is-book" aria-labelledby="ls-book-title">
        <Ornament medal />
        {x}
        <p className="ls-kicker">
          {memCount} of {MEMORIES.length} memories · {fmt(save.soulsTotal)} souls saved
        </p>
        <h2 id="ls-book-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Book of Memories
        </h2>
        {bookBody}
        <p className="ls-center">
          <button type="button" className="ls-chipbtn" onClick={() => setScreen("prologue")}>
            Read the prologue again
          </button>
        </p>
      </section>
    );
  else if (screen === "rider")
    menu = (
      <section className="ls-panel ls-picker" aria-labelledby="ls-rider-title">
        <Ornament />
        {x}
        <div className="ls-picker-stage">
          <h2 id="ls-rider-title" className="ls-h2" tabIndex={-1} ref={headRef}>
            {bRider.name}
            <span className="ls-on"> on {bMount.name.replace("The ", "the ")}</span>
          </h2>
          <Preview
            rider={bRider}
            mount={bMount}
            look={look}
            calm={save.settings.calm}
            height={200}
            locked={riderLocked || mountLocked}
            label={`${bRider.name} on ${bMount.name}${riderLocked || mountLocked ? ", locked" : ""}`}
          />
          {(riderLocked || mountLocked) && (
            <p className="ls-locked">
              🔒 {riderLocked ? bRider.name : bMount.name} opens at score ×{Math.max(riderLocked ? bRider.unlock : 0, mountLocked ? bMount.unlock : 0)}. Finish
              endless missions to get there.
            </p>
          )}
          <p className="ls-muted ls-line">{bRider.line}</p>
          <p className="ls-muted ls-small">For the endless ride. The mission is always {HEROINE} on her elk.</p>
        </div>
        <div className="ls-picker-side">
          <Spinner label="Rider" rowKey="rider" value={bRider.name} onPrev={() => pickRider(-1)} onNext={() => pickRider(1)} />
          <p className="ls-desc">
            {riderLocked ? (
              <>Opens at ×{bRider.unlock}.</>
            ) : (
              <>
                <strong>{bRider.ability}:</strong> {bRider.abilityHelp} {bRider.passive}
              </>
            )}
          </p>
          <Spinner label="Mount" rowKey="mount" value={bMount.name} onPrev={() => pickMount(-1)} onNext={() => pickMount(1)} />
          <div className="ls-bars">
            <Bar label="Speed" value={(bMount.kmh[0] - 40) / 35} text={`${bMount.kmh[0]}–${bMount.kmh[1]} km/h`} />
            <Bar label="Turning" value={bMount.turn / 1.5} text={bMount.turn >= 1.3 ? "sharp" : bMount.turn >= 1 ? "steady" : "heavy"} />
            <Bar label="Jump" value={bMount.jump / 0.9} text={`${bMount.jump.toFixed(1)} s`} />
            <Bar label="Hearts" value={bMount.hearts / 4} text={"♥".repeat(bMount.hearts)} />
          </div>
          <p className="ls-desc">
            {mountLocked ? <>Opens at ×{bMount.unlock}.</> : <>{bMount.strength} {bMount.weakness}</>}
          </p>
          <div className="ls-swatches">
          {(Object.keys(SWATCHES) as (keyof Look)[]).map((slot) => {
            const list = SWATCHES[slot].colours;
            const i = Math.max(0, list.indexOf(look[slot]));
            return (
              <Spinner
                key={slot}
                rowKey={slot}
                label={SWATCHES[slot].label}
                value={`${i + 1} of ${list.length}`}
                onPrev={() => pickColour(slot, -1)}
                onNext={() => pickColour(slot, 1)}
              >
                <span className="ls-chip" style={{ background: look[slot] }} aria-hidden="true" />
              </Spinner>
            );
          })}
          </div>
          <div className="ls-ridebar">
            <button type="button" className="ls-btn is-go" onClick={() => ride("endless")} disabled={riderLocked || mountLocked}>
              Endless ride
            </button>
            <button type="button" className="ls-chipbtn" onClick={() => setScreen("missions")}>
              Missions · ×{save.multiplier}
            </button>
          </div>
        </div>
      </section>
    );
  else if (screen === "missions")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-missions-title">
        <Ornament />
        <Close onClick={() => setScreen("rider")} label="Close, back to the rider" />
        <p className="ls-kicker">The endless ride</p>
        <h2 id="ls-missions-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Missions · score ×{save.multiplier}
        </h2>
        <p className="ls-muted">
          Small tasks for the endless ride. Each one you finish raises your score multiplier by one, for good, and opens new
          riders and mounts. Three are open at a time, each to be done within a single run.
        </p>
        <ol className="ls-missions">
          {save.open.map((i) => (
            <li key={i}>{missionAt(i).text}</li>
          ))}
        </ol>
        <h3 className="ls-h3">Today&apos;s word</h3>
        <p>
          {wordStrip(wordGot)}{" "}
          {save.word.done ? "Spelled! Come back tomorrow for a new word." : "Its letters lie on the road, one at a time. Spell it for one more ×."}
        </p>
        <h3 className="ls-h3">Opens as you grow</h3>
        <ul className="ls-unlocks">
          {[...RIDERS, ...MOUNTS]
            .filter((x) => x.unlock > 1)
            .sort((a, b) => a.unlock - b.unlock)
            .map((x) => (
              <li key={x.id} className={save.multiplier >= x.unlock ? "is-open" : ""}>
                ×{x.unlock}: {x.name} {save.multiplier >= x.unlock ? "✓" : "🔒"}
              </li>
            ))}
        </ul>
      </section>
    );
  else if (screen === "help") {
    const helpTabs: Tab[] = [
      {
        id: "ride",
        label: "Riding",
        content: (
          <ul className="ls-help">
            <li>
              <strong>Two ways to ride.</strong> <em>The mission</em>: {HEROINE}&apos;s story, four lands, villages to save,
              and an end. <em>The endless ride</em>: any rider, no end, kilometres and points, in the furthest land the mission
              has reached.
            </li>
            <li>
              <strong>Ride and steer.</strong> You ride down the screen; the monsters come from behind, at the top. Hitting
              anything costs a heart, and lets the nearest monster jump onto your neck.
            </li>
            <li>
              <strong>Three rules for the land.</strong> Wood on the ground (trunks, thorns): jump ↑. A stone arch: duck ↓ under
              the middle. Everything else (trees, rocks, stones, the green fire): ride round it.
            </li>
            <li>
              New to it? Ride <em>The First Morning</em> from the prologue: it can&apos;t kill you.
            </li>
          </ul>
        ),
      },
      {
        id: "hunt",
        label: "The hunt",
        content: (
          <ul className="ls-help">
            <li>
              <strong>You can&apos;t outrun them.</strong> They are a little faster than you, and when one is close it crouches
              (a red !) and leaps. Swerve as it leaps.
            </li>
            <li>
              <strong>Use the land.</strong> Lead them into trees and rocks and they crash; into the green fire and they burn.
              Saved villages are stone to them.
            </li>
            <li>
              <strong>Keep them from the living.</strong> Hares, foxes and deer cross the road. A monster that catches one
              stops to eat: it buys you a moment, but it comes back faster, glowing red.
            </li>
          </ul>
        ),
      },
      {
        id: "things",
        label: "Weapons",
        content: (
          <ul className="ls-help">
            <li>
              <strong>A bow</strong> brings arrows: hold Space and a line swings behind you, let go to shoot.
            </li>
            <li>
              <strong>A root trap</strong> (Z) drops behind you. <strong>Bark armour</strong> stops one monster. <strong>A companion</strong>, rarest
              of all, saves you once.
            </li>
            <li>
              <strong>The sword (X) is the last resort.</strong> It kills whatever is on your neck, but the blood wakes the
              rot: every sword kill brings two new monsters.
            </li>
            <li>In the mission, weapons come only from the glades you heal, when an animal already walks with you.</li>
          </ul>
        ),
      },
      {
        id: "mission",
        label: "The mission",
        content: (
          <ul className="ls-help">
            <li>
              <strong>Hearts are what you give.</strong> Ride through the glowing ring of a hamlet (one soul) or a village
              (two) to give it a heart, never your last.
            </li>
            <li>
              <strong>Where the road forks</strong> you heal one way only: the village, two souls, or the glade, no souls
              and no heart, but an animal friend and one of {HEROINE}&apos;s memories. Its animals lead the villagers away.
            </li>
            <li>
              <strong>Ride past</strong> a hamlet, or both ways of a fork, and the people are lost: their souls come off your
              count, and the rot makes one of them into a monster that hunts you.
            </li>
            <li>
              <strong>Gates of spring.</strong> When enough souls are saved, a brook of light runs across the land ahead.
              Crossing it heals you. Fall, and you rise again at the last gate. After Bloom comes the golden gate, and the end.
            </li>
          </ul>
        ),
      },
      {
        id: "endless",
        label: "Endless",
        content: (
          <ul className="ls-help">
            <li>
              <strong>Ride as far as you can.</strong> Any rider, any mount, in the furthest land the mission has opened.
            </li>
            <li>
              <strong>Missions and the daily word</strong> raise your score multiplier for good and open new riders and mounts.
              You find them under <em>Rider &amp; mount</em>.
            </li>
            <li>An animal eaten by the rot costs you points.</li>
          </ul>
        ),
      },
      {
        id: "keys",
        label: "Controls",
        content: (
          <table className="ls-keys">
            <tbody>
              {[
                ["← →  or  A D", "Steer"],
                ["↑  or  W", "Jump"],
                ["↓  or  S", "Duck"],
                ["Space (hold, then let go)", "Aim the bow and shoot"],
                ["X", "Sword"],
                ["Z", "Drop a trap"],
                ["C or Shift", "Your rider's ability"],
                ["Esc or P", "Pause"],
                ["F", "Full screen"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ),
      },
      {
        id: "monsters",
        label: "Monsters",
        content: (
          <ul className="ls-help is-tight">
            {Object.values(MONSTERS).map((m) => (
              <li key={m.id}>
                <strong>{m.name[0].toUpperCase() + m.name.slice(1)}</strong> <span className="ls-muted">(from {km(m.from)})</span>: {m.tell}
              </li>
            ))}
          </ul>
        ),
      },
    ];
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-help-title">
        <Ornament />
        {x}
        <h2 id="ls-help-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          How to play
        </h2>
        <Tabs id="ls-help" label="How to play" tabs={helpTabs} index={helpTab} onIndex={setHelpTab} />
      </section>
    );
  } else if (screen === "settings")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-settings-title">
        <Ornament />
        {x}
        <h2 id="ls-settings-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Settings
        </h2>
        {settingsList}
      </section>
    );

  /* what the game gave: a card while the world holds still */
  const glade = moment?.kind === "glade";
  const momentCard = moment && (
    <div key={moment.key} className={`ls-moment is-${moment.kind}`} role="dialog" aria-modal="false" aria-labelledby="ls-moment-name">
      <Ornament />
      <span className="ls-kicker">{glade ? "The Glade · healed" : "The Village · saved"}</span>
      <h2 id="ls-moment-name" className="ls-moment-name">
        {glade ? "The glade breathes again" : moment.village}
      </h2>
      {!glade && <p className="ls-moment-names">{moment.names.join(" & ")}</p>}
      <div className="ls-moment-row">
        <Sapling big={!glade} />
        <div className="ls-moment-gain">
          <p className="ls-kicker">What you got</p>
          <ul className="ls-gains">
            <li>
              <span className="ls-gain-ico is-souls" aria-hidden="true">
                +{glade ? 0 : 2}
              </span>
              <span>
                <strong>souls</strong> · {Math.min(moment.souls, moment.need)} of {moment.need} for the gate
                <span className="ls-gain-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, (moment.souls / moment.need) * 100)}%` }} />
                </span>
              </span>
            </li>
            {glade && moment.gift && (
              <li>
                <span className="ls-gain-ico" aria-hidden="true">
                  {ico(GIFT_ICON[moment.giftId ?? ""] ?? "bow", "✦")}
                </span>
                <span>
                  <strong>{["hound", "raven", "doe"].includes(moment.giftId ?? "") ? "a friend:" : "a gift:"}</strong> {moment.gift}
                </span>
              </li>
            )}
            {glade && moment.memory >= 0 && (
              <li className="is-mem">
                <span className="ls-gain-ico is-mem" aria-hidden="true">
                  {moment.memory + 1}
                </span>
                <span>
                  <strong>memory {moment.memory + 1}</strong> of {MEMORIES.length}
                  {moment.clear ? ": it comes back clear" : ": it comes back, still in mist"}
                </span>
              </li>
            )}
            {glade ? (
              <li className="is-cost">
                <span className="ls-gain-ico" aria-hidden="true">
                  {ico("heart", "♥")}
                </span>
                <span>your heart stays · {moment.hearts} · the animals led the villagers into the woods</span>
              </li>
            ) : (
              <li className="is-cost">
                <span className="ls-gain-ico" aria-hidden="true">
                  {ico("heartEmpty", "♡")}
                </span>
                <span>you gave a heart · {moment.hearts} left · the glade stays in the rot</span>
              </li>
            )}
          </ul>
          {!glade && moment.line && <p className="ls-moment-line">“{moment.line}”</p>}
        </div>
      </div>
      <button type="button" ref={momentBtn} className={`ls-btn ${moment.memory >= 0 ? "is-mem" : "is-go"}`} onClick={rideOn}>
        {moment.memory >= 0 ? `${moment.clear ? "Clear" : "Read"} memory ${moment.memory + 1}` : "Ride on"}
      </button>
      <span className="ls-moment-hint" aria-hidden="true">
        Space or Enter
      </span>
    </div>
  );

  if (!loaded) return <div className="ls" aria-busy="true" />;
  const h = hud;
  const r = mode === "endless" ? choiceOf(save).rider : brigidOf(save).rider;
  const dialog = paused || swordCard || memoryCard !== null || !!moment || screen === "over";

  return (
    <div className={`ls${playing ? " is-playing" : ""}${save.settings.calm ? " is-calm" : ""}${full ? " is-full" : ""}`} ref={rootRef}>
      {playing && (
        <div className="ls-hud" inert={dialog}>
          <div className="ls-hud-row">
            {h && h.mode !== "endless" ? (
              <span className="ls-dist">
                <strong className="ls-souls">
                  {h.souls} / {h.need} souls
                </strong>
                <span className="ls-muted">
                  {" "}
                  · {h.biome} · {km(h.metres)}
                </span>
              </span>
            ) : (
              <>
                <span className="ls-dist">
                  <strong className="ls-souls">{km(h?.metres ?? 0)}</strong>
                  <strong className="ls-souls is-small">
                    {" "}
                    · {h?.souls ?? 0} {h?.souls === 1 ? "soul" : "souls"}
                  </strong>
                  <span className="ls-muted">
                    {" "}
                    · {h?.kmh ?? 0} km/h · {h?.biome}
                  </span>
                </span>
                <span className="ls-score">
                  {fmt(h?.score ?? 0)} <span className="ls-mult">×{h?.multiplier ?? save.multiplier}</span>
                </span>
              </>
            )}
            {h?.finale ? (
              <button type="button" className="ls-pause ls-skip" onClick={() => gameRef.current?.skipFinale()}>
                Skip ▶▶
              </button>
            ) : (
              <button type="button" className="ls-pause" onClick={togglePause} aria-label={paused ? "Resume" : "Pause"}>
                {paused ? "▶" : "❚❚"}
              </button>
            )}
            {fsButton("ls-pause ls-fsbtn")}
          </div>
          <div className="ls-hud-row is-small">
            <span className="ls-hearts" aria-label={`${h?.hearts ?? 0} of ${h?.maxHearts ?? 3} hearts`}>
              {Array.from({ length: h?.maxHearts ?? 3 }, (_, i) => (
                <span key={i} className={i < (h?.hearts ?? 0) ? "is-full" : ""} aria-hidden="true">
                  {ico(i < (h?.hearts ?? 0) ? "heart" : "heartEmpty", "♥")}
                </span>
              ))}
            </span>
            <span
              className="ls-items"
              role="group"
              aria-label={`${h?.arrows ?? 0} arrows, ${h?.swords ?? 0} swords, ${h?.traps ?? 0} root traps${h?.bark ? ", bark armour" : ""}${h?.companion ? `, a ${h.companion} runs with you` : ""}`}
            >
              <span
                title="Arrows (Space: hold to aim, let go to shoot)"
                className={`ls-item${h?.arrows ? "" : " is-none"}${mode === "tutorial" && tutStep === 7 ? " is-teach" : ""}`}
                aria-hidden="true"
              >
                {ico("bow", "🏹")} <b>{h?.arrows ?? 0}</b>
                {mode === "tutorial" && tutStep === 7 && <span className="ls-teach">Hold Space · let go when the line points at it</span>}
              </span>
              <span title="Swords (X)" className={`ls-item${h?.swords ? "" : " is-none"}${mode === "tutorial" && tutStep === 9 ? " is-teach" : ""}`} aria-hidden="true">
                {ico("sword", "🗡")} <b>{h?.swords ?? 0}</b>
                {mode === "tutorial" && tutStep === 9 && <span className="ls-teach">X · when it is on your neck</span>}
              </span>
              <span title="Root traps (Z)" className={`ls-item${h?.traps ? "" : " is-none"}${mode === "tutorial" && tutStep === 8 ? " is-teach" : ""}`} aria-hidden="true">
                {ico("trap", "⊗")} <b>{h?.traps ?? 0}</b>
                {mode === "tutorial" && tutStep === 8 && <span className="ls-teach">Z · when it is right behind you</span>}
              </span>
              {h?.bark && (
                <span title="Bark armour" className="ls-item" aria-hidden="true">
                  {ico("bark", "🛡")}
                </span>
              )}
              {h?.companion && (
                <span title="Companion" className="ls-item" aria-hidden="true">
                  {ico(h.companion as "hound" | "raven" | "doe", "✦")}
                </span>
              )}
              <span className={`ls-ability${(h?.abilityReady ?? 1) >= 1 ? " is-ready" : ""}`} title={`${r.ability} (C or Shift): ${r.abilityHelp}`}>
                <kbd>C</kbd> {r.ability} {(h?.abilityReady ?? 1) >= 1 ? "ready" : `${Math.round((h?.abilityReady ?? 0) * 100)}%`}
              </span>
            </span>
            {wordStrip(h?.wordGot ?? wordGot)}
          </div>
        </div>
      )}

      <div
        className="ls-stage"
        ref={stageRef}
        tabIndex={playing ? 0 : -1}
        role={playing ? "application" : undefined}
        aria-roledescription={playing ? "game" : undefined}
        aria-label={
          playing
            ? "The Long Spring. Left and right arrows steer, up jumps, down ducks, hold Space to aim the bow, X sword, Z trap, C ability, Escape pauses."
            : undefined
        }
      >
        <canvas ref={canvasRef} className="ls-canvas" aria-hidden="true" />
        {intro < 2 && !playing && (
          <div className={`ls-intro is-${intro}`} role="img" aria-label="Marcel Šedo Studio presents The Long Spring">
            <div className="ls-intro-logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: STUDIO_LOGO }} />
            <div className="ls-intro-title" aria-hidden="true">
              <span className="ls-intro-h">The Long Spring</span>
              <span className="ls-intro-tag">Give your heart to the land.</span>
            </div>
            <span className="ls-intro-skip" aria-hidden="true">
              any key to skip
            </span>
          </div>
        )}
        {!playing && <div className="ls-menu">{menu}</div>}
        {screen === "title" && fsButton("ls-fs")}
        {screen === "play" && h?.finale && (
          <div className="ls-finale-text" aria-live="polite">
            {ENDING[h.finaleT < 4.5 ? 0 : h.finaleT < 9 ? 1 : 2]}
          </div>
        )}
        {screen === "play" && mode === "tutorial" && lesson && (
          <div className="ls-lesson" aria-hidden="true">
            <span className="ls-kicker">The First Morning</span>
            {lesson}
          </div>
        )}
        {playing && <div className="ls-danger" style={{ opacity: Math.max(0, (h?.danger ?? 0) - 0.3) }} aria-hidden="true" />}
        {playing && toast && !h?.finale && !moment && !dialog && (
          <p className="ls-toast" aria-hidden="true">
            {toast}
          </p>
        )}
        {playing && banner && (
          <p className="ls-banner" aria-hidden="true">
            {banner}
          </p>
        )}

        {playing && momentCard}

        {paused && screen === "play" && (
          <div className="ls-overlay" role="dialog" aria-modal="true" aria-labelledby={view === "main" ? "ls-pause-title" : "ls-view-title"}>
            <div className={`ls-panel${view === "main" ? "" : " is-text"}${view === "book" ? " is-book" : ""}`}>
              <Ornament />
              {view === "main" ? (
                <>
                  <Close onClick={togglePause} label="Close and ride on" />
                  <h2 id="ls-pause-title" className="ls-h2" tabIndex={-1} ref={pauseHead}>
                    Paused
                  </h2>
                  <div className="ls-stack">
                    <button type="button" className="ls-btn is-go" onClick={togglePause}>
                      Ride on
                    </button>
                    <button type="button" className="ls-btn is-ghost" onClick={() => setView("settings")}>
                      Settings
                    </button>
                    {mode === "mission" && (
                      <button
                        type="button"
                        className="ls-btn is-ghost"
                        onClick={() => {
                          openBook();
                          setView("book");
                        }}
                      >
                        The book · {memCount}/{MEMORIES.length}
                      </button>
                    )}
                    <button type="button" className="ls-btn is-ghost" onClick={() => ride()}>
                      {mode === "mission" ? "Start this land again" : "Start again"}
                    </button>
                    {mode === "mission" && save.checkpoint > 0 && (
                      <button type="button" className="ls-btn is-ghost" onClick={beginAgain}>
                        Begin the whole mission again
                      </button>
                    )}
                    <button
                      type="button"
                      className="ls-btn is-ghost"
                      onClick={() => {
                        gameRef.current?.destroy();
                        setScreen("title");
                      }}
                    >
                      To the menu
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Close onClick={() => setView("main")} label="Close, back to the pause" />
                  <h2 id="ls-view-title" className="ls-h2" tabIndex={-1} ref={viewHead}>
                    {view === "settings" ? "Settings" : "Book of Memories"}
                  </h2>
                  {view === "settings" ? settingsList : bookBody}
                  <div className="ls-stack">
                    <button type="button" className="ls-btn is-ghost" onClick={() => setView("main")}>
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {memoryCard !== null && (
          <div className="ls-overlay is-mist" role="dialog" aria-modal="true" aria-labelledby="ls-mem-title" aria-describedby="ls-mem-text">
            <div className="ls-mist-frame">
            <Ornament />
            <div className="ls-mist is-pop">
              <Close onClick={closeMemory} label="Close and ride on" />
              <p className="ls-kicker">
                Memory {memoryCard + 1} of {MEMORIES.length} · {memClear ? "it comes back clear" : "it comes back, in mist"}
              </p>
              <p className="ls-mist-sign">{MEMORIES[memoryCard].sign}</p>
              <h2 id="ls-mem-title" className="ls-mist-title" tabIndex={-1} ref={memHead}>
                {MEMORIES[memoryCard].title}
              </h2>
              <p id="ls-mem-text" className="ls-mist-text">
                {memClear ? MEMORIES[memoryCard].text : mistOf(memoryCard).text}
              </p>
              {!memClear && <p className="ls-muted ls-small">The rest is still in mist.</p>}
              <p className="ls-muted ls-small">Written in the Book of Memories, {BIOMES[MEMORIES[memoryCard].land].name}.</p>
              <div className="ls-stack">
                <button type="button" className="ls-btn is-go" onClick={closeMemory}>
                  Ride on
                </button>
              </div>
            </div>
            </div>
          </div>
        )}

        {swordCard && (
          <div className="ls-overlay" role="dialog" aria-modal="true" aria-labelledby="ls-sword-title">
            <div className="ls-panel is-blood">
              <Ornament />
              <h2 id="ls-sword-title" className="ls-h2" tabIndex={-1} ref={swordHead}>
                Blood calls the rot
              </h2>
              <p>
                The sword killed it. But its blood has run into the ground, and the rot has smelt it:{" "}
                <strong>two more are crawling out of the fire behind you.</strong>
              </p>
              <p className="ls-muted">
                Every time you use a sword, two new monsters come. Keep it for when one is already on your neck. Arrows, traps,
                rocks, trees and the green fire kill cleanly.
              </p>
              <div className="ls-stack">
                <button
                  type="button"
                  className="ls-btn is-go"
                  onClick={() => {
                    setSwordCard(false);
                    gameRef.current?.markSwordSeen();
                    gameRef.current?.start();
                    stageRef.current?.focus();
                  }}
                >
                  Ride on
                </button>
              </div>
            </div>
          </div>
        )}

        {screen === "over" && result && (
          <div className={`ls-overlay${result.win || view !== "main" ? "" : " is-end"}`} role="dialog" aria-modal="true" aria-labelledby={view === "book" ? "ls-view-title" : "ls-over-title"}>
            <div className={`ls-panel${view === "book" ? " is-text is-book" : result.win ? " is-win" : ""}`}>
              <Ornament />
              {view === "book" ? (
                <>
                  <Close onClick={() => setView("main")} label="Close the book" />
                  <h2 id="ls-view-title" className="ls-h2" tabIndex={-1} ref={viewHead}>
                    Book of Memories
                  </h2>
                  {bookBody}
                  <div className="ls-stack">
                    <button type="button" className="ls-btn is-ghost" onClick={() => setView("main")}>
                      Back
                    </button>
                  </div>
                </>
              ) : result.mode === "tutorial" ? (
                <>
                  <p className="ls-kicker">The First Morning</p>
                  <h2 id="ls-over-title" className="ls-h2" tabIndex={-1} ref={headRef}>
                    You are ready
                  </h2>
                  <p>
                    {HEROINE} knows how to ride, how to lead the rot into the land, and what a heart is for. The mission begins
                    where the rot is deepest.
                  </p>
                  <div className="ls-stack">
                    <button type="button" className="ls-btn is-go" onClick={() => ride("mission")}>
                      Begin the mission
                    </button>
                    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("title")}>
                      To the menu
                    </button>
                  </div>
                </>
              ) : result.mode === "mission" ? (
                <>
                  <p className="ls-kicker">{result.win ? "The golden gate" : `${HEROINE} has fallen`}</p>
                  <h2 id="ls-over-title" className="ls-h2" tabIndex={-1} ref={headRef}>
                    {result.win ? "The Long Spring" : result.cause}
                  </h2>
                  {result.win ? (
                    ENDING.map((p, i) => <p key={i} className="ls-verse">{p}</p>)
                  ) : (
                    <p>
                      The land catches her, as it did once before. She rises again at the start of{" "}
                      {BIOMES[Math.min(save.checkpoint, BIOMES.length - 1)].name}.
                    </p>
                  )}
                  <dl className="ls-results">
                    <div>
                      <dt>Souls saved</dt>
                      <dd>{result.stats.souls}</dd>
                    </div>
                    {result.win && (
                      <div>
                        <dt>Reborn</dt>
                        <dd>
                          {result.reborn} more, from the hearts she had left
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt>Villages</dt>
                      <dd>
                        {result.stats.villagesSaved} saved · {result.stats.villagesLost} lost
                      </dd>
                    </div>
                    <div>
                      <dt>Memories</dt>
                      <dd>
                        {result.memories.length
                          ? result.memories.map((i) => MEMORIES[i].title).join(" · ")
                          : "none on this ride"}{" "}
                        <span className="ls-muted">
                          ({save.memories.length}/{MEMORIES.length} in the book)
                        </span>
                      </dd>
                    </div>
                  </dl>
                  {result.win && <p className="ls-muted">The endless ride now runs through Bloom.</p>}
                  <div className="ls-actions">
                    {!result.win && (
                      <button type="button" className="ls-btn is-go" onClick={() => ride("mission")}>
                        Rise again
                      </button>
                    )}
                    <button
                      type="button"
                      className={`ls-btn ${result.win ? "is-go" : "is-ghost"}`}
                      onClick={() => {
                        openBook();
                        setView("book");
                      }}
                    >
                      The book
                    </button>
                    {result.win && (
                      <button type="button" className="ls-btn is-ghost" onClick={() => ride("endless")}>
                        Endless ride
                      </button>
                    )}
                    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("title")}>
                      To the menu
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="ls-kicker">The run is over · {BIOMES[result.land].name}</p>
                  <h2 id="ls-over-title" className="ls-h2" tabIndex={-1} ref={headRef}>
                    {result.cause}
                  </h2>
                  <div className="ls-records">
                    <div>
                      <span className="ls-record-n">{km(result.metres)}</span>
                      <span className="ls-record-l">
                        ridden{result.metres >= save.bestMetres && result.metres > 0 && <span className="ls-new"> best!</span>}
                      </span>
                      <span className="ls-record-b">best {km(save.bestMetres)}</span>
                    </div>
                    <div>
                      <span className="ls-record-n">{fmt(result.stats.souls)}</span>
                      <span className="ls-record-l">
                        {result.stats.souls === 1 ? "soul saved" : "souls saved"}
                        {result.stats.souls >= save.bestSouls && result.stats.souls > 0 && <span className="ls-new"> best!</span>}
                      </span>
                      <span className="ls-record-b">best {fmt(save.bestSouls)}</span>
                    </div>
                  </div>
                  <dl className="ls-results">
                    <div>
                      <dt>Score</dt>
                      <dd>
                        {fmt(result.score)} · best {fmt(save.best)}
                      </dd>
                    </div>
                    <div>
                      <dt>Monsters lost</dt>
                      <dd>
                        {result.stats.pitted} burned · {result.stats.crashed} crashed · {result.stats.trapped} trapped ·{" "}
                        {result.stats.arrowKills} shot · {result.stats.swordKills} by the sword
                      </dd>
                    </div>
                    {result.stats.animalsLost > 0 && (
                      <div>
                        <dt>Eaten</dt>
                        <dd>
                          {result.stats.animalsLost} {result.stats.animalsLost === 1 ? "animal" : "animals"}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {(result.missions.length > 0 || result.word) && (
                    <div className="ls-done">
                      <h3 className="ls-h3">This run</h3>
                      <ul>
                        {result.missions.map((m) => (
                          <li key={m}>✓ {m}</li>
                        ))}
                        {result.word && <li>✓ You spelled today&apos;s word, {word}</li>}
                      </ul>
                      <p className="ls-muted">Score multiplier now ×{save.multiplier}.</p>
                    </div>
                  )}
                  <div className="ls-actions">
                    <button type="button" className="ls-btn is-go" onClick={() => ride("endless")}>
                      Ride again
                    </button>
                    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("rider")}>
                      Change rider
                    </button>
                    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("title")}>
                      To the menu
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {screen === "play" && (
        <div className="ls-pad" role="group" aria-label="Touch controls" inert={dialog}>
          <div className="ls-pad-steer">
            {touchBtn("left", "Steer left", "◀", "is-big")}
            {touchBtn("right", "Steer right", "▶", "is-big")}
          </div>
          <div className="ls-pad-acts">
            {touchBtn("up", "Jump", "⤒")}
            {touchBtn("down", "Duck", "⤓")}
            {touchBtn("aim", "Bow: hold to aim, let go to shoot", ico("bow", "🏹"))}
            {touchBtn("sword", "Sword", ico("sword", "🗡"))}
            {touchBtn("trap", "Drop a trap", ico("trap", "⊗"))}
            {touchBtn("ability", r.ability, "✦")}
          </div>
        </div>
      )}

      <p className="sr-only" aria-live="polite">
        {live}
      </p>
      {tune && <TunePanel onChange={() => setTuneTick((n) => n + 1)} />}
    </div>
  );
}

/** ?tune in the address: sliders for the numbers in TUNE, to set the feel side by side with another game. */
function TunePanel({ onChange }: { onChange: () => void }) {
  const ranges: Record<keyof typeof TUNE, [number, number, number]> = {
    metresPerPx: [0.05, 0.3, 0.01],
    monsterGain: [-0.1, 0.4, 0.01],
    steer: [60, 260, 5],
    steerAccel: [1, 20, 0.5],
    density: [1, 12, 0.5],
    surgeTo: [20, 200, 5],
    lungeFrom: [0, 200, 5],
  };
  return (
    <details className="ls-tune" open>
      <summary>Tune</summary>
      {(Object.keys(ranges) as (keyof typeof TUNE)[]).map((k) => (
        <label key={k}>
          <span>
            {k}: {TUNE[k]}
          </span>
          <input
            type="range"
            min={ranges[k][0]}
            max={ranges[k][1]}
            step={ranges[k][2]}
            value={TUNE[k]}
            onChange={(e) => {
              TUNE[k] = Number(e.target.value);
              onChange();
            }}
          />
        </label>
      ))}
      <textarea readOnly rows={4} value={JSON.stringify(TUNE)} aria-label="Current values, to copy into config.ts" />
    </details>
  );
}
