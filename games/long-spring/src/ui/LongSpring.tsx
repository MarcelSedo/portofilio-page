"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { BIOMES, MONSTERS, MOUNTS, RIDERS, SWATCHES, TUNE, type Look, type Mount, type Rider } from "../config";
import { Game, heroPreview, type GameEvent, type Hud, type Mode } from "../game";
import { freshSave, loadSave, missionAt, today, wordOfDay, writeSave, type Save, type Settings, type Stats } from "../meta";
import { setSound } from "../sound";
import { iconUrls, type IconId, type Spr } from "../sprites";
import "../styles/long-spring.css";
import { Divider, Ornament } from "./Ornament";
import { ENDING, HEROINE, LAND_CHAPTERS, MEMORIES, MEMORIES_PER_LAND, PROLOGUE, RULES, VILLAGE_KINDS } from "../story";

export type LongSpringProps = { exitHref?: string; exitLabel?: string };

type Screen = "title" | "rider" | "missions" | "help" | "settings" | "prologue" | "book" | "play" | "over";
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
const brigidOf = (s: Save) => ({ rider: RIDERS.find((r) => r.id === "dryad")!, mount: MOUNTS.find((m) => m.id === s.mount)!, look: s.looks.dryad });
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
    setTune(new URLSearchParams(location.search).has("tune"));
    setIcons(iconUrls());
  }, []);

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
          memories: e.memory >= 0 && !s.memories.includes(e.memory) ? [...s.memories, e.memory] : s.memories,
        }));
        if (e.memory >= 0) {
          runRef.current.memories.push(e.memory);
          const mm = MEMORIES[e.memory];
          say(`${mm.sign} A memory comes back: “${mm.title}”. It is written in the Book of Memories.`, true);
        } else if (e.line && e.names[0]) say(`${e.names[0].split(" ")[0]}: “${e.line}”`);
      } else if (e.type === "tutorial") {
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
          update((s) => ({ ...s, best: Math.max(s.best, e.score), bestMetres: Math.max(s.bestMetres, e.metres) }));
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
      settings: s.settings,
      multiplier: endless ? s.multiplier : 1,
      missions: endless ? s.open.map(missionAt) : [],
      word: endless ? wordOfDay() : "",
      wordGot: s.word.done ? wordOfDay().length : s.word.got,
      seenSword: s.seenSword,
      seenMonsters: [...s.seenMonsters],
      seenKinds: [...s.seenKinds],
      onHud: setHud,
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
    if (!g || screen !== "play" || swordCard) return;
    if (g.paused) {
      setPaused(false);
      g.start();
      stageRef.current?.focus();
    } else {
      g.pause();
      setPaused(true);
    }
  }, [screen, swordCard]);

  useEffect(() => {
    if (screen !== "play") return;
    const down = (e: KeyboardEvent) => {
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
  }, [screen, paused, swordCard, togglePause]);

  const setSetting = (k: keyof Settings, v: boolean) => {
    const s = update((s) => ({ ...s, settings: { ...s.settings, [k]: v } }));
    if (k === "sound") setSound(v);
    gameRef.current?.setSettings(s.settings);
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
          ["sound", "Sound"],
          ["full", "Full screen when I ride (F or the corner button switch it at any time)"],
        ] as [keyof Settings, string][]
      ).map(([k, label]) => (
        <li key={k}>
          <label className="ls-toggle">
            <input type="checkbox" checked={save.settings[k]} onChange={(e) => setSetting(k, e.target.checked)} />
            <span>{label}</span>
          </label>
        </li>
      ))}
    </ul>
  );

  const back = (
    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("title")}>
      Back
    </button>
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
    else ride("mission");
  };
  const landName = (i: number) => BIOMES[Math.min(i, BIOMES.length - 1)].name;
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
        <div className="ls-stack">
          <button type="button" className="ls-btn is-big" onClick={openMission}>
            {save.endings > 0 ? "The mission again" : save.checkpoint > 0 ? `The mission · ${landName(save.checkpoint)}` : "The mission"}
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => ride("endless")}>
            Endless ride · {landName(endlessLand(save))}
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("book")}>
            Book of memories · {memCount}/{MEMORIES.length}
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("rider")}>
            Rider &amp; mount
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("missions")}>
            Missions · ×{save.multiplier}
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("help")}>
            How to play
          </button>
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("settings")}>
            Settings
          </button>
        </div>
        <p className="ls-muted ls-small">
          Souls saved: {fmt(save.soulsTotal)} · Endless best: {fmt(save.best)}, {km(save.bestMetres)} · Today&apos;s word:{" "}
          {wordStrip(wordGot)}
        </p>
        {exitHref && (
          <a className="ls-exit" href={exitHref}>
            {exitLabel}
          </a>
        )}
      </section>
    );
  else if (screen === "prologue")
    menu = (
      <section className="ls-panel is-text is-book" aria-labelledby="ls-prologue-title">
        <Ornament medal />
        <p className="ls-kicker">Prologue</p>
        <h2 id="ls-prologue-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          The world turned inside out
        </h2>
        {PROLOGUE.map((p, i) => (
          <p key={i} className={i === 0 ? "ls-initial" : undefined}>
            {p}
          </p>
        ))}
        <Divider />
        <h3 className="ls-h3">Three kinds of village</h3>
        <ul className="ls-kinds">
          {([6, 4, 2] as const).map((n) => (
            <li key={n}>
              <span className="ls-kind-n" aria-hidden="true">
                {n}
              </span>
              <strong>
                {VILLAGE_KINDS[n].name} <span className="sr-only">,</span>
                <span className="ls-muted"> · {n} souls</span>
              </strong>
              <span>{VILLAGE_KINDS[n].text}</span>
            </li>
          ))}
        </ul>
        <h3 className="ls-h3">How {HEROINE} saves them</h3>
        <ul className="ls-help">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="ls-stack">
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
          {back}
        </div>
      </section>
    );
  else if (screen === "book")
    menu = (
      <section className="ls-panel is-text is-book" aria-labelledby="ls-book-title">
        <Ornament medal />
        <p className="ls-kicker">
          {memCount} of {MEMORIES.length} memories · {fmt(save.soulsTotal)} souls saved
        </p>
        <h2 id="ls-book-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Book of Memories
        </h2>
        {BIOMES.map((b, land) => {
          const list = MEMORIES.map((m, i) => ({ m, i })).filter(({ m }) => m.land === land);
          const found = list.filter(({ i }) => save.memories.includes(i)).length;
          return (
            <div key={b.name} className="ls-chapter">
              <h3 className="ls-h3">
                {b.name}: {LAND_CHAPTERS[land]}{" "}
                <span className="ls-muted">
                  ({found}/{MEMORIES_PER_LAND})
                </span>
              </h3>
              <ol className="ls-memories">
                {list.map(({ m, i }) =>
                  save.memories.includes(i) ? (
                    <li key={i}>
                      <strong>{m.title}.</strong> <em className="ls-muted">{m.sign}</em> {m.text}
                    </li>
                  ) : (
                    <li key={i} className="is-missing">
                      <span aria-hidden="true">· · ·</span>
                      <span className="sr-only">A memory not found yet</span>
                    </li>
                  ),
                )}
              </ol>
            </div>
          );
        })}
        {save.endings > 0 && (
          <div className="ls-chapter">
            <h3 className="ls-h3">The golden gate</h3>
            {ENDING.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}
        <h3 className="ls-h3">The Named ({save.named.length})</h3>
        {save.named.length ? (
          <ul className="ls-named">
            {[...save.named].reverse().slice(0, 80).map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        ) : (
          <p className="ls-muted">Nobody yet. The hamlets of two souls keep their names.</p>
        )}
        <div className="ls-stack">
          <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("prologue")}>
            The prologue
          </button>
          {back}
        </div>
      </section>
    );
  else if (screen === "rider")
    menu = (
      <section className="ls-panel ls-picker" aria-labelledby="ls-rider-title">
        <Ornament />
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
            height={260}
            locked={riderLocked || mountLocked}
            label={`${bRider.name} on ${bMount.name}${riderLocked || mountLocked ? ", locked" : ""}`}
          />
          {(riderLocked || mountLocked) && (
            <p className="ls-locked">
              🔒 {riderLocked ? bRider.name : bMount.name} opens at score ×{Math.max(riderLocked ? bRider.unlock : 0, mountLocked ? bMount.unlock : 0)}. Finish
              missions to get there.
            </p>
          )}
          <p className="ls-muted ls-line">{bRider.line}</p>
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
          <h3 className="ls-h3">Colours</h3>
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
          <p className="ls-muted ls-small">Tab to a row, ← → to change it, ↑ ↓ to move between rows.</p>
          <div className="ls-stack">
            <button type="button" className="ls-btn is-go" onClick={() => ride("endless")} disabled={riderLocked || mountLocked}>
              Ride
            </button>
            {back}
          </div>
        </div>
      </section>
    );
  else if (screen === "missions")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-missions-title">
        <Ornament />
        <h2 id="ls-missions-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Missions · score ×{save.multiplier}
        </h2>
        <p className="ls-muted">
          Every finished mission raises your score multiplier by one, for good. Three are open at a time, and each must be
          done within a single run.
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
        <div className="ls-stack">{back}</div>
      </section>
    );
  else if (screen === "help")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-help-title">
        <Ornament />
        <h2 id="ls-help-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          How to play
        </h2>
        <ol className="ls-help">
          <li>
            <strong>Two ways to ride.</strong> <em>The mission</em>: {HEROINE}&apos;s story, four lands, villages to save with
            your hearts, and an end. <em>The endless ride</em>: any rider, no end, kilometres and points, in the furthest land
            the mission has reached. New to it? Ride <em>The First Morning</em> from the prologue: it can&apos;t kill you.
          </li>
          <li>
            <strong>Ride and steer.</strong> You ride down the screen; the monsters come from behind, at the top. Hitting
            anything costs a heart, and lets the nearest monster jump right onto your neck.
          </li>
          <li>
            <strong>Three rules for the land.</strong> Wood lying on the ground (fallen trunks, thorns): jump ↑. A stone arch:
            duck ↓ and ride under the middle; its pillars are solid. Everything else (trees, rocks, standing stones, the green
            fire): ride round it. The game shows you each new kind the first time it comes.
          </li>
          <li>
            <strong>You can&apos;t outrun them.</strong> They are a little faster than you, and when one is close it crouches
            (a red !) and leaps. Swerve as it leaps. Lead them into trees and rocks and they crash; into the green fire and
            they burn. The Maw follows your scent, the Eye aims where you are going, the Colossus walks through trees.
          </li>
          <li>
            <strong>Things on the road.</strong> A bow brings 3 arrows: hold Space and a line swings behind you, let go to
            shoot. A root trap (Z) drops behind you. Bark armour stops one monster. A companion, rarest of all, saves you once.
          </li>
          <li>
            <strong>The sword (X) is the last resort.</strong> It kills whatever is on your neck, but the blood wakes the rot:
            every sword kill brings two new monsters.
          </li>
          <li>
            <strong>In the mission, hearts are what you give.</strong> Ride through the glowing ring at a village&apos;s heart
            to give it one (never your last). Six souls: The Crowd, the shortest way to the gate. Four: The Grove, a tree of
            spring that gives you a heart back at the next gate. Two: The Named, people with names, a gift, and sometimes one
            of {HEROINE}&apos;s memories. A village you pass by is lost, and its souls are taken from your count. Saved
            villages are stone to the monsters: lead them in. Weapons come only from the people you save.
          </li>
          <li>
            <strong>Gates of spring.</strong> When you have saved enough souls, a brook of light runs across the land ahead.
            Beyond it the next land is greener, and crossing it heals you. Fall, and you rise again at the last gate. After
            Bloom comes the golden gate, and the end.
          </li>
          <li>
            <strong>Keep the hunt away from the living.</strong> Hares, foxes and deer cross the road. A monster that gets
            close leaps on one and stops to eat: it buys you a moment, but the monster comes back faster, glowing red (and in
            the endless ride you lose points).
          </li>
          <li>
            <strong>In the endless ride, missions and the daily word</strong> raise your score multiplier for good and open
            new riders and mounts.
          </li>
        </ol>
        <h3 className="ls-h3">Controls</h3>
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
            ].map(([k, v]) => (
              <tr key={k}>
                <th scope="row">{k}</th>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="ls-h3">The monsters</h3>
        <ul className="ls-help">
          {Object.values(MONSTERS).map((m) => (
            <li key={m.id}>
              <strong>{m.name[0].toUpperCase() + m.name.slice(1)}</strong> (from {km(m.from)}): {m.tell}
            </li>
          ))}
        </ul>
        <div className="ls-stack">{back}</div>
      </section>
    );
  else if (screen === "settings")
    menu = (
      <section className="ls-panel is-text" aria-labelledby="ls-settings-title">
        <Ornament />
        <h2 id="ls-settings-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Settings
        </h2>
        {settingsList}
        <div className="ls-stack">{back}</div>
      </section>
    );

  if (!loaded) return <div className="ls" aria-busy="true" />;
  const h = hud;
  const r = choiceOf(save).rider;
  const dialog = paused || swordCard || screen === "over";

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
                  <strong>{km(h?.metres ?? 0)}</strong>
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
              <span title="Arrows (Space: hold to aim, let go to shoot)" className={`ls-item${h?.arrows ? "" : " is-none"}`} aria-hidden="true">
                {ico("bow", "🏹")} <b>{h?.arrows ?? 0}</b>
              </span>
              <span title="Swords (X)" className={`ls-item${h?.swords ? "" : " is-none"}`} aria-hidden="true">
                {ico("sword", "🗡")} <b>{h?.swords ?? 0}</b>
              </span>
              <span title="Root traps (Z)" className={`ls-item${h?.traps ? "" : " is-none"}`} aria-hidden="true">
                {ico("trap", "⊗")} <b>{h?.traps ?? 0}</b>
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
              <span className={`ls-ability${(h?.abilityReady ?? 1) >= 1 ? " is-ready" : ""}`} title={r.abilityHelp}>
                {r.ability} {(h?.abilityReady ?? 1) >= 1 ? "✓" : `${Math.round((h?.abilityReady ?? 0) * 100)}%`}
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
        {!playing && <div className="ls-menu">{menu}</div>}
        {screen === "title" && fsButton("ls-fs")}
        {screen === "play" && h?.finale && (
          <div className="ls-finale-text" aria-live="polite">
            {h.finaleT < 6 ? ENDING[0] : ENDING[1]}
          </div>
        )}
        {screen === "play" && mode === "tutorial" && lesson && (
          <div className="ls-lesson" aria-hidden="true">
            <span className="ls-kicker">The First Morning</span>
            {lesson}
          </div>
        )}
        {playing && <div className="ls-danger" style={{ opacity: Math.max(0, (h?.danger ?? 0) - 0.3) }} aria-hidden="true" />}
        {playing && toast && !h?.finale && (
          <p className="ls-toast" aria-hidden="true">
            {toast}
          </p>
        )}
        {playing && banner && (
          <p className="ls-banner" aria-hidden="true">
            {banner}
          </p>
        )}

        {paused && screen === "play" && (
          <div className="ls-overlay" role="dialog" aria-modal="true" aria-labelledby="ls-pause-title">
            <div className="ls-panel">
              <Ornament />
              <h2 id="ls-pause-title" className="ls-h2" tabIndex={-1} ref={pauseHead}>
                Paused
              </h2>
              <div className="ls-stack">
                <button type="button" className="ls-btn is-go" onClick={togglePause}>
                  Ride on
                </button>
                <button type="button" className="ls-btn is-ghost" onClick={() => ride()}>
                  Start again
                </button>
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
              <details className="ls-details">
                <summary>Settings</summary>
                {settingsList}
              </details>
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
          <div className={`ls-overlay${result.win ? "" : " is-end"}`} role="dialog" aria-modal="true" aria-labelledby="ls-over-title">
            <div className={`ls-panel${result.win ? " is-win" : ""}`}>
              <Ornament />
              {result.mode === "tutorial" ? (
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
                    ENDING.map((p, i) => <p key={i}>{p}</p>)
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
                    <button type="button" className={`ls-btn ${result.win ? "is-go" : "is-ghost"}`} onClick={() => setScreen("book")}>
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
                  <dl className="ls-results">
                    <div>
                      <dt>Distance</dt>
                      <dd>{km(result.metres)}</dd>
                    </div>
                    <div>
                      <dt>Score</dt>
                      <dd>
                        {fmt(result.score)} {result.best && <span className="ls-new">best!</span>}
                      </dd>
                    </div>
                    <div>
                      <dt>Best</dt>
                      <dd>{fmt(save.best)}</dd>
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
