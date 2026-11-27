"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent as RKeyboardEvent } from "react";
import { BIOMES, ENDLESS, EXTREME, MONSTERS, type MonsterId, MOUNTS, RIDERS, SPELLS, SWATCHES, TUNE, type Look, type Mount, type Rider } from "../config";
import { Game, heroPreview, type GameEvent, type Hud, type Mode } from "../game";
import { freshSave, loadSave, missionAt, writeSave, type Save, type Settings, type Stats } from "../meta";
import { setSound, setSoundVolume } from "../sound";
import { setMusic, setMusicDanger, setMusicLand, setMusicMood, setMusicVolume } from "../music";
import { STUDIO_LOGO } from "../studio-logo";
import { MONSTER_BOX, iconUrls, monsterFrames, type IconId, type Spr } from "../sprites";
import "../styles/long-spring.css";
import { Divider, Ornament } from "./Ornament";
import { CHAPTERS, ENDING, HEROINE, LAND_CHAPTERS, MEMORIES, NEED, PROLOGUE, RULES, memoryPic, mistOf, type ChapterRule } from "../story";

export type LongSpringProps = { exitHref?: string; exitLabel?: string };

type Screen = "title" | "begin" | "credits" | "rider" | "bestiary" | "help" | "settings" | "prologue" | "book" | "play" | "over";
type Result = {
  win: boolean; cause: string; metres: number; score: number; stats: Stats; best: boolean; missions: string[]; word: boolean;
  mode: Mode; land: number; reborn: number; memories: number[];
};
type Act = "left" | "right" | "up" | "down" | "aim" | "sword" | "trap" | "ability" | "rune";

const KEYS: Record<string, Act> = {
  ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right",
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down",
  Space: "aim", KeyX: "sword", KeyK: "sword", KeyZ: "trap", KeyJ: "trap", KeyC: "ability", KeyL: "ability", ShiftLeft: "ability", ShiftRight: "ability", KeyR: "rune", KeyE: "rune",
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
/** the endless ride is always painted as the second land: dark, with green coming through, and the rain */
const endlessLand = (_s: Save) => 1;

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

/**
 * A memory's picture: in the dark until it is reached; then grey, with the colour coming back a third at a time
 * from the middle out (`thirds` 0–3)
 */
function MemPic({ i, state, thirds }: { i: number; state: "missing" | "mist" | "clear"; thirds?: number }) {
  const t = thirds ?? (state === "clear" ? 3 : 0);
  if (state === "missing")
    return (
      <span className="ls-mempic is-missing" aria-hidden="true">
        <img src={memoryPic(i)} alt="" draggable={false} loading="lazy" decoding="async" />
      </span>
    );
  return (
    <span className={`ls-mempic is-thirds is-t${t}`} aria-hidden="true">
      <img src={memoryPic(i)} alt="" draggable={false} loading="lazy" decoding="async" className="is-grey" />
      <img src={memoryPic(i)} alt="" draggable={false} loading="lazy" decoding="async" className="is-col" />
    </span>
  );
}
/** a poem as far as it has come back: whole at three thirds, otherwise some lines are still missing */
function partOf(text: string, thirds: number) {
  if (thirds >= 3) return text;
  const lines = text.split("\n");
  const keep = Math.ceil((lines.length * thirds) / 3);
  return lines.map((l, k) => (k < keep || !l.trim() ? l : "· · ·")).join("\n");
}

/** what each chapter asks, in one line, under its picture */
const TASKS: Record<ChapterRule | "plain", string> = {
  ribbon: "Follow the ribbon's glowing path. A green ring round you means you are on it.",
  dance: "The trees step aside on every beat of the drum. A shadow shows where each will stand.",
  count: "Three small lights ride behind you. Keep the monsters and the trees off them.",
  plain: "Ride each third of the road without losing a heart.",
};
/** a small picture of what to do */
function TaskPic({ rule }: { rule?: ChapterRule }) {
  return (
    <svg className="ls-taskpic" viewBox="0 0 80 60" aria-hidden="true">
      {rule === "ribbon" ? (
        <>
          <path d="M40 58 C20 44 62 32 40 18 C28 10 46 4 44 0" fill="none" stroke="rgba(120,255,140,0.35)" strokeWidth="12" strokeLinecap="round" />
          <path d="M40 58 C20 44 62 32 40 18 C28 10 46 4 44 0" fill="none" stroke="#e6ffe0" strokeWidth="2" strokeDasharray="2 6" />
          <path d="M44 6 q6 4 2 10 q-4 6 4 10" fill="none" stroke="#2bbf6a" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="40" cy="52" rx="10" ry="3.5" fill="none" stroke="#bfffbf" strokeWidth="1.5" />
          <circle cx="40" cy="48" r="4" fill="#fff4d8" />
        </>
      ) : rule === "dance" ? (
        <>
          <ellipse cx="40" cy="50" rx="30" ry="8" fill="none" stroke="rgba(255,220,150,0.6)" strokeWidth="2" />
          <rect x="20" y="22" width="5" height="22" fill="#6a4a2e" />
          <circle cx="22.5" cy="20" r="10" fill="#4a7a3a" />
          <ellipse cx="54" cy="45" rx="9" ry="3.5" fill="rgba(255,230,170,0.25)" stroke="#ffe6aa" strokeDasharray="2 2" />
          <path d="M32 30 h18 m-5 -4 l5 4 l-5 4" fill="none" stroke="#ffe6aa" strokeWidth="2" />
        </>
      ) : rule === "count" ? (
        <>
          <circle cx="40" cy="12" r="5" fill="#fff4d8" />
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <circle cx={40} cy={26 + k * 11} r={6} fill="rgba(255,220,150,0.35)" />
              <circle cx={40} cy={26 + k * 11} r={2.5} fill="#fff4d8" />
            </g>
          ))}
          <path d="M10 56 l8 -8 m0 0 l-3 1 m3 -1 l-1 3" stroke="#ff8080" strokeWidth="2" fill="none" />
        </>
      ) : (
        <path d="M40 52 C10 32 18 10 32 14 C36 15 39 18 40 22 C41 18 44 15 48 14 C62 10 70 32 40 52 Z" fill="#ff6a80" stroke="#fff4d8" strokeWidth="1.5" />
      )}
    </svg>
  );
}

/** the kingdom: the road of her life, from the hall to the sea, and the fourteen places on it */
const MAP_PTS: [number, number][] = [
  [60, 40], [108, 62], [150, 46], [196, 74], [236, 58], [270, 92], [244, 128], [204, 148], [160, 136], [118, 160], [86, 196], [128, 222], [178, 232], [226, 246],
];
const MAP_REGIONS = ["#2a2420", "#3a4034", "#4a2a2a", "#2e5a44"];
function KingdomMap({ thirds, at, light }: { thirds: number[]; at: number; light: number }) {
  const d = MAP_PTS.map(([x, y], k) => `${k ? "L" : "M"}${x} ${y}`).join(" ");
  return (
    <svg className="ls-map" viewBox="0 0 300 280" role="img" aria-label={`The road from the hall to the sea: ${thirds.filter((t) => t >= 3).length} of 14 places remembered whole`}>
      <rect x="2" y="2" width="296" height="276" rx="14" fill="#16120c" stroke="#c9a24a" strokeWidth="3" />
      <rect x="9" y="9" width="282" height="262" rx="10" fill="none" stroke="#c9a24a" strokeOpacity="0.5" strokeDasharray="6 3" />
      {/* the four lands */}
      <path d="M20 20 H200 L170 110 H20 Z" fill={MAP_REGIONS[0]} />
      <path d="M200 20 H280 V150 L210 150 L170 110 Z" fill={MAP_REGIONS[1]} />
      <path d="M20 110 H170 L210 150 L170 185 H20 Z" fill={MAP_REGIONS[2]} />
      <path d="M20 185 H170 L210 150 H280 V260 H20 Z" fill={MAP_REGIONS[3]} />
      {/* the sea */}
      <path d="M200 260 Q240 236 280 246 V260 Z" fill="#2a6a8a" />
      <path d={d} fill="none" stroke="#e8d8a8" strokeWidth="3" strokeDasharray="2 5" strokeLinecap="round" />
      {MAP_PTS.map(([x, y], k) => {
        const t = thirds[k] ?? 0;
        const fill = t >= 3 ? "#7dff78" : t > 0 ? "#e8c84a" : "#6a6a66";
        return (
          <g key={k}>
            {t > 0 && <circle cx={x} cy={y} r={11} fill={fill} opacity="0.25" />}
            <circle cx={x} cy={y} r={6} fill={fill} stroke="#16120c" strokeWidth="2" />
            {k === at && <circle cx={x} cy={y} r={10} fill="none" stroke="#fff4d8" strokeWidth="1.5" />}
          </g>
        );
      })}
      {/* the people she gave a heart to: small lights along the road */}
      {Array.from({ length: Math.min(40, light) }, (_, k) => {
        const [x, y] = MAP_PTS[k % MAP_PTS.length];
        return <circle key={`l${k}`} cx={x + Math.cos(k * 2.4) * 15} cy={y + Math.sin(k * 2.4) * 12} r={1.6} fill="#fff4c0" />;
      })}
      <text x="60" y="30" fill="#c9a24a" fontSize="9" fontFamily="Georgia, serif" textAnchor="middle">the hall</text>
      <text x="240" y="272" fill="#c9a24a" fontSize="9" fontFamily="Georgia, serif" textAnchor="middle">the sea</text>
    </svg>
  );
}

/** the browser's own voice for now (a woman's, soft and slow, if the browser has one); a recorded voice can replace it later */
function pickVoice(): SpeechSynthesisVoice | null {
  const all = window.speechSynthesis.getVoices();
  const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const wanted = ["Moira", "Fiona", "Serena", "Kate", "Tessa", "Martha", "Stephanie", "Karen", "Samantha", "Libby", "Sonia", "Hazel", "Emily", "Maisie", "Google UK English Female", "Female"];
  for (const w of wanted) {
    const v = en.find((x) => x.name.includes(w));
    if (v) return v;
  }
  return en.find((v) => /en[-_](IE|GB)/i.test(v.lang)) ?? en[0] ?? null;
}
function Recite({ title, text }: { title: string; text: string }) {
  const [on, setOn] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    setCan(true);
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, [text]);
  if (!can) return null;
  const go = () => {
    const sy = window.speechSynthesis;
    sy.cancel();
    if (on) return setOn(false);
    const lines = [title, ...text.split("\n")].map((l) => l.trim()).filter(Boolean);
    const voice = pickVoice();
    lines.forEach((l, k) => {
      const u = new SpeechSynthesisUtterance(l);
      u.rate = 0.78;
      u.pitch = 1.04;
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else u.lang = "en-GB";
      if (k === lines.length - 1) u.onend = u.onerror = () => setOn(false);
      sy.speak(u);
    });
    setOn(true);
  };
  return (
    <button type="button" className="ls-chipbtn ls-recite" onClick={go} aria-pressed={on}>
      <span aria-hidden="true">{on ? "■" : "▶"}</span> {on ? "Stop reading" : "Read it aloud"}
    </button>
  );
}

/** A monster of the bestiary, alive on its page; one not met yet is only a shadow */
function BeastPic({ id, known, calm, height }: { id: MonsterId; known: boolean; calm: boolean; height: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const b = MONSTER_BOX[id];
  // each fills its frame: the small ones are not shrunk next to the Colossus
  const scale = Math.min(height / b.h, 156 / b.w);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const S = scale * dpr;
    const frames = monsterFrames(S, id);
    c.width = Math.ceil(b.w * S);
    c.height = Math.ceil(b.h * S);
    const g = c.getContext("2d")!;
    let f = 0;
    const paintIt = () => {
      g.clearRect(0, 0, c.width, c.height);
      g.globalCompositeOperation = "source-over";
      g.drawImage(frames[f % 4].c, 0, 0);
      if (!known) {
        g.globalCompositeOperation = "source-in";
        g.fillStyle = "#0b120d";
        g.fillRect(0, 0, c.width, c.height);
      }
    };
    paintIt();
    if (calm || !known) return;
    const t = setInterval(() => {
      f++;
      paintIt();
    }, 140);
    return () => clearInterval(t);
  }, [id, known, calm, scale, b.w, b.h]);
  return <canvas ref={ref} className="ls-beast-pic" style={{ width: b.w * scale, height: b.h * scale }} aria-hidden="true" />;
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

/** A touch stick: a ring with a knob that follows the thumb. It reports the offset from where the thumb came down. */
function Stick({ side, label, onDown, onMove, onUp }: {
  side: "left" | "right"; label: string;
  onDown?: () => void; onMove: (dx: number, dy: number) => void; onUp: () => void;
}) {
  const [knob, setKnob] = useState<{ x: number; y: number } | null>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const RAD = 46;
  const end = () => {
    if (!origin.current) return;
    origin.current = null;
    setKnob(null);
    onUp();
  };
  return (
    <div
      className={`ls-stick is-${side}${knob ? " is-on" : ""}`}
      aria-hidden="true"
      onPointerDown={(e) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2, id: e.pointerId };
        onDown?.();
        const dx = e.clientX - origin.current.x;
        const dy = e.clientY - origin.current.y;
        setKnob({ x: dx, y: dy });
        onMove(dx, dy);
      }}
      onPointerMove={(e) => {
        const o = origin.current;
        if (!o || o.id !== e.pointerId) return;
        let dx = e.clientX - o.x;
        let dy = e.clientY - o.y;
        onMove(dx, dy);
        const d = Math.hypot(dx, dy);
        if (d > RAD) {
          dx = (dx / d) * RAD;
          dy = (dy / d) * RAD;
        }
        setKnob({ x: dx, y: dy });
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onContextMenu={(e) => e.preventDefault()}
    >
      {side === "left" ? (
        <>
          <span className="ls-stick-mark is-up">▲</span>
          <span className="ls-stick-mark is-down">▼</span>
          <span className="ls-stick-mark is-left">◀</span>
          <span className="ls-stick-mark is-right">▶</span>
        </>
      ) : (
        <span className="ls-stick-ring" />
      )}
      <span className="ls-stick-knob" style={knob ? { transform: `translate(${knob.x}px, ${knob.y}px)` } : undefined} />
      <span className="ls-stick-label">{label}</span>
    </div>
  );
}

type Moment = {
  village: string; kind: "village" | "glade"; names: string[]; gift?: string; giftId?: string; memory: number; clear: boolean; line?: string; key: number;
  hearts: number; souls: number; need: number;
};
/** what a memory is won back from, as the prologue explains it */
const PIECES = [
  { name: "The road", short: "fourteen chapters", text: "From the hall where it began to the sea where it ended. Each chapter is a memory and a stretch of the road, and each is a little different: a ribbon to follow, trees that dance, small lights to bring through." },
  { name: "The colour", short: "a third at a time", text: "A chapter starts grey. Ride each third of it well and a third of its picture comes back in colour. At the end the place blooms, and the poem comes back as far as you won it." },
  { name: "The hearts", short: "yours to give", text: "Some stand by the road, half taken by the rot. Ride through their ring to give them one of your hearts, or ride on. Those you pass by turn, and come after you." },
];
/** the picture for each gift of the Named */
const GIFT_ICON: Record<string, IconId> = { sword: "sword", bow: "bow", traps: "trap", rune: "rune", heart: "heart", hound: "hound", raven: "raven", doe: "doe" };

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
  const [memThirds, setMemThirds] = useState(3);
  /** the grey picture shown as a chapter begins */
  const [introCard, setIntroCard] = useState<number | null>(null);
  const introAt = useRef(0);
  const introBtn = useRef<HTMLButtonElement>(null);
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
      else setScreen(screen === "book" ? "begin" : "title");
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
      } else if (e.type === "chapter") {
        update((s) => ({ ...s, chapterAt: e.memory, memories: s.memories.includes(e.memory) ? s.memories : [...s.memories, e.memory] }));
        // the picture, grey, and what this chapter asks: the world waits until the player rides on
        introAt.current = Date.now();
        setIntroCard(e.memory);
      } else if (e.type === "piece") setLive(`${e.name}: ${e.n} of 3 parts of the picture in colour.`);
      else if (e.type === "shade") setLive(e.saved ? "You gave a heart. They thank you, and walk away into the woods." : "You passed them by. The rot takes them.");
      else if (e.type === "event") {
        setBanner(e.name);
        setTimeout(() => setBanner(""), 2400);
      } else if (e.type === "memory") {
        // the chapter is ridden: the world holds still while the picture and the poem are shown
        g?.pause();
        if (g) setHud(g.hud());
        update((s) => {
          const thirds = [...(s.thirds ?? [])];
          thirds[e.memory] = Math.max(thirds[e.memory] ?? 0, e.thirds);
          return {
            ...s,
            thirds,
            chapterAt: Math.min(MEMORIES.length - 1, e.memory + 1),
            memories: s.memories.includes(e.memory) ? s.memories : [...s.memories, e.memory],
            clear: e.thirds >= 3 && !s.clear.includes(e.memory) ? [...s.clear, e.memory] : s.clear,
          };
        });
        if (e.thirds > 0) runRef.current.memories.push(e.memory);
        setMemThirds(e.thirds);
        setMemClear(e.thirds >= 3);
        setMemoryCard(e.memory);
      } else if (e.type === "tutorial") {
        setTutStep(e.done ? -1 : e.step);
        if (e.done) update((s) => ({ ...s, tutorialDone: true }));
      } else if (e.type === "seen") update((s) => ({ ...s, seenMonsters: [...new Set([...s.seenMonsters, e.monster])] }));
      else if (e.type === "killed") {
        if (!saveRef.current.killedMonsters.includes(e.monster)) update((s) => ({ ...s, killedMonsters: [...new Set([...s.killedMonsters, e.monster])] }));
      } else if (e.type === "wisp") {
        // a memory shot out of the air: the world holds still while it is read
        g?.pause();
        update((s) => ({
          ...s,
          memories: !e.clear && !s.memories.includes(e.memory) ? [...s.memories, e.memory] : s.memories,
          clear: e.clear && !s.clear.includes(e.memory) ? [...s.clear, e.memory] : s.clear,
        }));
        runRef.current.memories.push(e.memory);
        setMemClear(e.clear);
        setMemoryCard(e.memory);
      } else if (e.type === "spell") setLive(e.ok ? `${SPELLS[e.spell].name} cast.` : "The rune breaks.");
      else if (e.type === "seenKind") update((s) => ({ ...s, seenKinds: [...new Set([...s.seenKinds, e.kind])] }));
      else if (e.type === "swordFirst") {
        g?.pause();
        setSwordCard(true);
        update((s) => ({ ...s, seenSword: true }));
      } else if (e.type === "end") {
        let best = false;
        if (e.mode === "mission") update((s) => ({ ...s, soulsTotal: s.soulsTotal + e.stats.souls }));
        if (e.mode === "endless") {
          best = e.score > saveRef.current.best;
          update((s) => ({
            ...s, best: Math.max(s.best, e.score), bestMetres: Math.max(s.bestMetres, e.metres), bestSouls: Math.max(s.bestSouls, e.stats.souls), bestLamps: Math.max(s.bestLamps ?? 0, e.stats.lamps),
          }));
        } else if (e.mode === "extreme") {
          best = e.stats.kills > (saveRef.current.bestKills ?? 0);
          update((s) => ({ ...s, bestKills: Math.max(s.bestKills ?? 0, e.stats.kills), huntsWon: (s.huntsWon ?? 0) + (e.win ? 1 : 0) }));
        } else if (e.mode === "mission" && e.win)
          update((s) => ({
            ...s, wins: s.wins + 1, endings: s.endings + 1, furthestLand: BIOMES.length, checkpoint: 0, chapterAt: 0,
            bestEnding: Math.max(s.bestEnding, s.clear.length + e.stats.souls),
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
    setIntroCard(null);
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
    const own = endless || m === "extreme";
    const game = new Game(canvasRef.current, {
      choice: own ? choiceOf(s) : brigidOf(s),
      mode: m,
      startLand: endless ? endlessLand(s) : m === "mission" ? Math.min(s.checkpoint, BIOMES.length - 1) : 0,
      memories: [...s.memories],
      clear: [...s.clear],
      startChapter: m === "mission" ? Math.min(MEMORIES.length - 1, s.chapterAt ?? 0) : undefined,
      settings: s.settings,
      multiplier: endless ? s.multiplier : 1,
      missions: endless ? s.open.map(missionAt) : [],
      word: "",
      wordGot: 0,
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
    const c = own ? choiceOf(s) : brigidOf(s);
    if (endless) say(`${c.rider.name} on ${c.mount.name.toLowerCase()}, in ${BIOMES[endlessLand(s)].name}. Ride, and fill your lamp! ← → to steer.`);
    else if (m === "extreme") say(`The hunt: five minutes in ${BIOMES[0].name}. Bring down all you can, and live. Pick up weapons and hearts as you go.`, true);
    else if (m === "mission")
      say(`${HEROINE} rides out into ${BIOMES[Math.min(s.checkpoint, BIOMES.length - 1)].name}. Her memories are slipping away: win them back before they are forgotten.`);
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

  const closeIntro = useCallback(() => {
    setIntroCard(null);
    gameRef.current?.release();
    stageRef.current?.focus();
  }, []);
  useEffect(() => {
    if (introCard !== null) introBtn.current?.focus({ preventScroll: true });
  }, [introCard]);
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
      if (introCard !== null) {
        if (!e.repeat && Date.now() - introAt.current > 700 && (e.code === "Space" || e.code === "Enter" || e.code === "Escape" || KEYS[e.code])) closeIntro();
        e.preventDefault();
        return;
      }
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
  }, [screen, paused, swordCard, togglePause, memoryCard, closeMemory, view, moment, rideOn, introCard, closeIntro]);
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

  /** the left stick: held to a side it steers; a flick up jumps, down ducks; while a rune is cast each flick is a stroke */
  const lDir = useRef<"left" | "right" | "up" | "down" | null>(null);
  const leftMove = (dx: number, dy: number) => {
    const g = gameRef.current;
    if (!g) return;
    const d = Math.hypot(dx, dy);
    let dir: typeof lDir.current = null;
    if (d > 28) dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
    else if (d > 14) dir = lDir.current;
    if (dir === lDir.current) return;
    if (lDir.current === "left" || lDir.current === "right") g.key(lDir.current, false);
    lDir.current = dir;
    if (dir) {
      g.key(dir, true);
      if (dir === "up" || dir === "down") g.key(dir, false);
    }
  };
  const leftUp = () => {
    const d = lDir.current;
    lDir.current = null;
    if (d === "left" || d === "right") gameRef.current?.key(d, false);
  };

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
  const memCount = save.clear.length;
  const openMission = () => {
    if (!save.prologueSeen || !save.tutorialDone) setScreen("prologue");
    else setScreen("begin");
  };
  /** the whole mission again from the Rot: the book and the Named stay */
  const beginAgain = () => {
    update((s) => ({ ...s, checkpoint: 0, chapterAt: 0 }));
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
    setBookTab(0);
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
          Chapter {i + 1} of {MEMORIES.length} · {(save.thirds[i] ?? 0) >= 3 ? "whole" : `${save.thirds[i] ?? 0} of 3 in colour`}
        </p>
        <MemPic i={i} state="mist" thirds={save.thirds[i] ?? 0} />
        <p className="ls-mist-sign">{m.sign}</p>
        <h4 className="ls-mist-title">{m.title}</h4>
        <p className="ls-mist-text">{partOf(m.text, save.thirds[i] ?? 0)}</p>
        {save.clear.includes(i) ? (
          <Recite title={m.title} text={m.text} />
        ) : (
          <p className="ls-muted ls-small ls-mist-more-note">The rest is in mist. Ride this land again and win it back before it is forgotten.</p>
        )}
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
  const mapTab: Tab = {
    id: "map",
    label: "The road",
    content: (
      <>
        <KingdomMap thirds={save.thirds ?? []} at={save.chapterAt ?? 0} light={save.soulsTotal} />
        <p className="ls-muted ls-small ls-center">
          From the hall where it began to the sea where it ended: the road of {HEROINE}&apos;s life. Green, a place remembered
          whole; gold, in part; grey, not yet. The small lights are those she gave a heart to.
        </p>
      </>
    ),
  };
  const bookTabs: Tab[] = BIOMES.map((b, land) => {
    const list = MEMORIES.map((m, i) => ({ m, i })).filter(({ m }) => m.land === land);
    const found = list.filter(({ i }) => (save.thirds[i] ?? 0) >= 3).length;
    const per = CHAPTERS[land];
    const locked = land > reached;
    return {
      id: `land${land}`,
      state: locked ? "locked" : land === curLand ? "now" : land < curLand ? "done" : undefined,
      aria: `${land + 1}. ${b.name}${locked ? ", not reached yet" : `, ${found} of ${per} memories remembered`}${land === curLand && !locked ? ", where you are now" : ""}`,
      label: (
        <>
          <span className="ls-step-n" aria-hidden="true">
            {found === per ? "✓" : land + 1}
          </span>
          <span className="ls-step-name" aria-hidden="true">
            {b.name}
          </span>
          <span className="ls-step-count" aria-hidden="true">
            {locked ? "not yet" : `${found}/${per}`}
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
                      <MemPic i={i} state="mist" thirds={save.thirds[i] ?? 0} />
                      <span className="ls-mist-n" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span className="sr-only">Chapter {i + 1}, {save.thirds[i] ?? 0} of 3 in colour:</span>
                      <span className="ls-mist-title">{m.title}</span>
                      <span className="ls-mist-state" aria-hidden="true">
                        {(save.thirds[i] ?? 0) >= 3 ? "whole" : `${save.thirds[i] ?? 0}/3`}
                      </span>
                    </button>
                  </li>
                ) : (
                  <li key={i}>
                    <span className="ls-mist is-card is-missing">
                      <MemPic i={i} state="missing" />
                      <span className="ls-mist-n" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span aria-hidden="true">· · ·</span>
                      <span className="sr-only">Chapter {i + 1}, not reached yet</span>
                    </span>
                  </li>
                ),
              )}
            </ul>
            <p className="ls-muted ls-small ls-center">
              {found === per
                ? "Every memory of this land has come back, and stays in the world."
                : "Each chapter is a stretch of the road. Ride it well and its picture comes back in colour; any part that stays grey can be won back on another ride."}
            </p>
          </>
        ),
    };
  });
  bookTabs.unshift(mapTab);
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
          The world has turned inside out, and {HEROINE} is forgetting it. Ride with her, win back her memories, and bring the spring back.
        </p>
        <div className="ls-stack is-wide">
          <button type="button" className="ls-btn is-big" onClick={openMission}>
            {save.endings > 0 ? "The mission again" : "The mission"}
            <span className="ls-btn-sub">
              {HEROINE}&apos;s story · {save.endings > 0 ? "from the start" : landName(save.checkpoint)}
            </span>
          </button>
          <div className="ls-grid2">
            <button type="button" className="ls-btn is-big" onClick={() => ride("endless")}>
              Endless ride
              <span className="ls-btn-sub">as far as you can</span>
            </button>
            <button type="button" className="ls-btn is-big is-alt" onClick={() => ride("extreme")}>
              The hunt
              <span className="ls-btn-sub">five minutes of fight</span>
            </button>
          </div>
          <div className="ls-grid2">
            <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("bestiary")}>
              Bestiary · {save.seenMonsters.length}/{Object.keys(MONSTERS).length}
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
          Memories: {save.clear.length}/{MEMORIES.length} · Endless best: {fmt(save.best)} ({km(save.bestMetres)}, {fmt(save.bestSouls)} souls) · The hunt: {fmt(save.bestKills ?? 0)} brought down
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
            {(save.chapterAt ?? 0) > 0 ? "Ride on" : "Ride"}
            <span className="ls-btn-sub">{(save.chapterAt ?? 0) > 0 ? `chapter ${(save.chapterAt ?? 0) + 1}: ${MEMORIES[save.chapterAt ?? 0].title}` : "from the hall, where it began"}</span>
          </button>
          {(save.chapterAt ?? 0) > 0 && (
            <button type="button" className="ls-btn is-big is-alt" onClick={beginAgain}>
              Begin again
              <span className="ls-btn-sub">the whole mission, from The Rot</span>
            </button>
          )}
          <button
            type="button"
            className="ls-btn is-ghost"
            onClick={() => {
              openBook();
              setScreen("book");
            }}
          >
            Book of Memories · {memCount}/{MEMORIES.length}
          </button>
        </div>
        {save.checkpoint > 0 && (
          <p className="ls-muted ls-small">
            Beginning again keeps the Book of Memories. The lands and the gates start over.
          </p>
        )}
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
    const titles = ["The world turned inside out", "The road of her life", `How ${HEROINE} remembers`];
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
            {PIECES.map((n, k) => (
              <li key={n.name}>
                <span className="ls-kind-n" aria-hidden="true">
                  {k + 1}
                </span>
                <strong>
                  {n.name} <span className="sr-only">,</span>
                  <span className="ls-muted"> · {n.short}</span>
                </strong>
                <span>{n.text}</span>
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
        <Close onClick={() => setScreen("begin")} label="Close, back to the mission" />
        <p className="ls-kicker">
          {memCount} of {MEMORIES.length} memories remembered
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
            <button type="button" className="ls-btn is-go" onClick={() => ride("extreme")} disabled={riderLocked || mountLocked}>
              The hunt
            </button>
          </div>
        </div>
      </section>
    );
  else if (screen === "bestiary")
    menu = (
      <section className="ls-panel is-text is-bestiary" aria-labelledby="ls-beast-title">
        <Ornament />
        {x}
        <p className="ls-kicker">What the rot made</p>
        <h2 id="ls-beast-title" className="ls-h2" tabIndex={-1} ref={headRef}>
          Bestiary
        </h2>
        <p className="ls-muted ls-small ls-center">
          Everything you carry works on every one of them. What sets them apart is how they come for you. A page fills in once
          you have met the monster.
        </p>
        <ul className="ls-beasts">
          {(Object.values(MONSTERS)).map((m) => {
            const seen = save.seenMonsters.includes(m.id);
            const killed = save.killedMonsters.includes(m.id);
            const title = m.name[0].toUpperCase() + m.name.slice(1);
            return (
              <li key={m.id} className={`ls-beast${seen ? "" : " is-unknown"}`}>
                <div className="ls-beast-frame">
                  <BeastPic id={m.id} known={seen} calm={save.settings.calm} height={m.id === "colossus" ? 150 : 112} />
                </div>
                <div className="ls-beast-text">
                  <h3 className="ls-beast-name">
                    {seen ? title : "Not met yet"}
                    <span className="ls-muted ls-small">
                      {" "}
                      · {m.hp} {m.hp === 1 ? "blow" : "blows"}
                      {killed ? " · ✓ killed" : ""}
                    </span>
                  </h3>
                  {seen ? (
                    <>
                      <p className="ls-beast-lore">{m.lore}</p>
                      <dl className="ls-beast-dl">
                        <div>
                          <dt>How it hunts</dt>
                          <dd>{m.danger}</dd>
                        </div>
                        <div>
                          <dt>How to live</dt>
                          <dd>{m.counter}</dd>
                        </div>
                      </dl>
                    </>
                  ) : (
                    <p className="ls-muted">Something waits further on the road.</p>
                  )}
                </div>
              </li>
            );
          })}
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
              <strong>Three ways to ride.</strong> <em>The mission</em>: {HEROINE}&apos;s story, fourteen memories to win back
              in four lands, and an end. <em>The endless ride</em>: any rider, no end, a lamp to fill with lights, for as long
              as you last. <em>The hunt</em>: five minutes of nothing but monsters; what counts is how many you bring down, and
              whether you live.
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
              <strong>Fog</strong> creeps in now and then along the edges: green in the rot, grey as the land heals, a bright,
              magic blue in Bloom. You see things later in it.
            </li>
            <li>
              New to it? Ride <em>The First Morning</em> from the mission: it can&apos;t kill you.
            </li>
          </ul>
        ),
      },
      {
        id: "hunt",
        label: "Monsters",
        content: (
          <ul className="ls-help">
            <li>
              <strong>You can&apos;t outrun them.</strong> They are a little faster than you, and when one is close it crouches
              (a red !) and leaps. Swerve as it leaps.
            </li>
            <li>
              <strong>Use the land.</strong> Lead them into trees and rocks and they crash; into the green fire and they burn.
              A memory won back makes them fall back for a moment.
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
              <strong>The bow is everything.</strong> Hold to draw, let go to shoot. With the <em>mouse</em> the arrow flies
              where the pointer is (hold the left button); on a <em>phone</em>, push the right stick where you want to shoot
              and let go; with the <em>keyboard</em> (Space) a line swings behind you and you let go when it points right.
            </li>
            <li>
              <strong>Calm.</strong> While the string is drawn the world slows down. The ring above {HEROINE} is how much calm
              is left: it fills again as you ride, and faster with every hit. Hold too long and the bow starts to shake.
            </li>
            <li>
              <strong>Arrows</strong> of green light come with a bow found on the road; in the mission a memory lends you two
              when your quiver is empty. A <strong>root trap</strong> bursts into glowing lianas that wrap whatever runs into it.
            </li>
            <li>
              <strong>Everything works on everything.</strong> An arrow is one blow, a root trap (Z, dropped behind you) or the
              sword three. Most monsters fall to one; the Colossus takes six. The monsters differ in how they come for you:
              see the <em>Bestiary</em>.
            </li>
            <li>
              <strong>The sword (X) is the last resort.</strong> It burns with a blue flame and kills whatever is on your
              neck, but the blood wakes the rot: every sword kill brings two new monsters.
            </li>
            <li>
              <strong>Companions.</strong> Hares, foxes and deer cross the road, fast. Catch one as it runs (ride right into its
              path) and it runs with you. When a monster is on your heels it throws itself at it, kills it, and dies with it.
            </li>
          </ul>
        ),
      },
      {
        id: "runes",
        label: "Runes & fords",
        content: (
          <>
            <ul className="ls-help">
              <li>
                <strong>Rune-stones</strong> stand here and there in the land. Ride through one to carry its rune. Press{" "}
                <kbd>R</kbd> (or the rune button): round the rune, its strokes light up one after another (↑ → ↓ …). Then draw
                them again with the arrows, in the same order (on a phone, flick the left stick). A wrong stroke breaks it.
              </li>
              <li>The further you ride, the more strokes: three in The Rot, five in Bloom.</li>
              <li>A rune cast right also looses a beam of green light, made of small glowing leaves, at the nearest monster.</li>
            </ul>
            <ul className="ls-spells">
              {Object.entries(SPELLS).map(([id, sp]) => (
                <li key={id}>
                  <span className="ls-ogham" style={{ color: sp.colour }} aria-hidden="true">
                    {sp.ogham}
                  </span>
                  <strong>{sp.name}</strong> <span>{sp.help}</span>
                </li>
              ))}
            </ul>
            <ul className="ls-help">
              <li>
                <strong>Fords.</strong> Black water across the whole road, and rows of stepping stones. As the ford comes into
                view, one stone in each row lights up, one row after another. Then they go dark: ride the same stones from
                memory. A wrong stone costs a heart. One ford in each of the first three lands of the mission, now and then in
                the endless ride, none in Bloom.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "mission",
        label: "The mission",
        content: (
          <ul className="ls-help">
            <li>
              <strong>The road of her life.</strong> The mission is fourteen chapters, from the hall where it all began to the
              sea where it ended. Each chapter is one of {HEROINE}&apos;s memories and one stretch of the road. Fall, and you
              rise again at the start of the chapter.
            </li>
            <li>
              <strong>Grey, then colour.</strong> A chapter starts with its picture in grey, and the land greys with it. It
              has three stretches: ride one well and a third of the picture comes back in colour, and the land with it. At the
              end the place itself comes into sight and blooms, and the poem comes back as far as you won it.
            </li>
            <li>
              <strong>Each chapter is a little different.</strong> In <em>The ribbon</em> you follow Áine&apos;s ribbon and
              must stay close to it. In <em>The hall</em> the trees step aside to the drum. In <em>Counting</em> three small
              lights ride behind you: bring them all through. In the others, ride each stretch without losing a heart.
            </li>
            <li>
              <strong>Your hearts are yours to give.</strong> Some stand by the road, half taken by the rot. Ride through their
              ring to give them a heart (never your last); they thank you, and go. Pass them by and the rot takes them: they
              come after you in the next chapter.
            </li>
            <li>
              <strong>Runes help you through the land</strong>: a bridge over a ford, light against the monsters, a hedge of
              thorns, the wind in your arrows, and a beam that destroys the nearest monster.
            </li>
          </ul>
        ),
      },
      {
        id: "endless",
        label: "Endless",
        content: (
          <>
            <ul className="ls-help">
              <li>
                <strong>Ride as far as you can</strong>, on any rider and mount. It starts gently: one monster at a time, and
                more kinds the further you get. Weapons and now and then a heart lie on the road.
              </li>
              <li>
                <strong>The score</strong> is the kilometres, the souls you save and the lamps you fill. Now and then a hamlet or
                a village waits by the road: ride through its glowing ring to give it a heart (never your last). Every task you
                finish (the missions below) gives a heart back.
              </li>
              <li>
                <strong>The lamp</strong>, now and then: lights float over the road three at a time, one of each colour. Ride
                through the ones it wants, in order (shown in the bar). A wrong one spills it. Fill it and it gives you a heart.
                From ten minutes it wants four lights, from twenty-five five; a <em>mirrored</em> lamp (⇄) wants them the other
                way round.
              </li>
              <li>
                <strong>Every five minutes the land does something</strong>: a storm, a run of fords, rune-stones, the Colossus.
                Then it goes quiet for a while.
              </li>
              <li>An animal eaten by the rot costs you points.</li>
            </ul>
            <h3 className="ls-h3">Missions · score ×{save.multiplier}</h3>
            <p className="ls-muted ls-small">
              Each one you finish raises your score multiplier by one, for good, and opens new riders and mounts. Three are
              open at a time, each to be done within a single run.
            </p>
            <ol className="ls-missions">
              {save.open.map((i) => (
                <li key={i}>{missionAt(i).text}</li>
              ))}
            </ol>
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
          </>
        ),
      },
      {
        id: "extreme",
        label: "The hunt",
        content: (
          <ul className="ls-help">
            <li>
              <strong>Five minutes</strong> in The Rot, on any rider. Fewer obstacles, more monsters, no fords, villages or
              lamps: weapons and hearts lie on the road, more of them than elsewhere. The monsters come more and more ({EXTREME.hunters[0]} at once at first, up to {EXTREME.hunters[EXTREME.hunters.length - 1]}).
            </li>
            <li>
              <strong>What counts</strong> is how many you bring down, by any means: arrows, traps, the sword, trees, rocks and
              the green fire. And whether you are still riding when the time is up.
            </li>
            <li>
              <strong>Keep picking up</strong>: bows, traps, swords, rune-stones and hearts. Catch a crossing animal and it fights
              for you once.
            </li>
            <li>Near the end the Colossus comes.</li>
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
                ["Mouse: point, hold the button, let go", "Aim the bow and shoot"],
                ["Space (hold, then let go)", "The bow, with the swinging line"],
                ["R or E, then the arrows", "Cast the rune you carry: repeat its strokes"],
                ["X", "Sword"],
                ["Z", "Drop a trap"],
                ["C or Shift", "Your rider's ability"],
                ["Esc or P", "Pause"],
                ["F", "Full screen"],
                ["Phone: left stick", "Steer; flick up to jump, down to duck; while casting, flick to choose and set"],
                ["Phone: right stick", "Push to aim and draw, let go to shoot"],
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

  const statTable = (caption: string, rows: [string, React.ReactNode][]) => (
    <table className="ls-stats">
      <caption>{caption}</caption>
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th scope="row">{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
  const monsterRows = (st: Stats): [string, React.ReactNode][] => [
    ["Shot", st.arrowKills],
    ["Into trees and rocks", st.crashed],
    ["Burned", st.pitted],
    ["Trapped", st.trapped],
    ["By the sword", st.swordKills],
    ["In all", st.kills ?? st.arrowKills + st.crashed + st.pitted + st.trapped + st.swordKills],
  ];

  if (!loaded) return <div className="ls" aria-busy="true" />;
  const h = hud;
  const r = mode === "endless" || mode === "extreme" ? choiceOf(save).rider : brigidOf(save).rider;
  const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
  const dialog = paused || swordCard || memoryCard !== null || introCard !== null || !!moment || screen === "over";

  return (
    <div className={`ls${playing ? " is-playing" : ""}${save.settings.calm ? " is-calm" : ""}${full ? " is-full" : ""}`} ref={rootRef}>
      {playing && (
        <div className="ls-hud" inert={dialog}>
          <div className="ls-hud-row">
            {h && h.mode === "extreme" ? (
              <>
                <span className="ls-dist">
                  <strong className={`ls-souls${h.timeLeft < 60 ? " is-late" : ""}`} aria-label={`${clock(h.timeLeft)} left`}>
                    {clock(h.timeLeft)}
                  </strong>
                  <strong className="ls-souls is-small"> · {h.kills} brought down</strong>
                </span>
                <span className="ls-score">best {fmt(save.bestKills ?? 0)}</span>
              </>
            ) : h && h.mode !== "endless" ? (
              <span className="ls-dist">
                <strong className="ls-souls">
                  {h.mode === "tutorial" ? "The First Morning" : `${BIOMES[h.land].name} · ${Math.min(h.souls + (h.chapter ? 1 : 0), h.need)}/${h.need}`}
                </strong>
                <span className="ls-muted"> {h.mode === "tutorial" ? `· ${h.biome}` : "chapters"}</span>
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
                    · {h?.kmh ?? 0} km/h{h?.event ? ` · ${h.event}` : ""}
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
          {h?.chapter && (
            <div
              className="ls-chapter-bar"
              role="group"
              aria-label={`${MEMORIES[h.chapter.memory].title}: ${h.chapter.kids >= 0 ? `${h.chapter.kids} of 3 small lights with you` : `${h.chapter.got} of 3 parts in colour`}; ${Math.round(h.chapter.forget * 100)} percent of the way`}
            >
              <span className="ls-chapter-thumb" aria-hidden="true">
                <MemPic i={h.chapter.memory} state="mist" thirds={h.chapter.kids >= 0 ? h.chapter.kids : h.chapter.got} />
              </span>
              <span className="ls-chapter-name" aria-hidden="true">
                {MEMORIES[h.chapter.memory].title}
              </span>
              <span className="ls-chapter-pieces" aria-hidden="true">
                {[0, 1, 2].map((k) => (
                  <span key={k} className={k < (h.chapter!.kids >= 0 ? h.chapter!.kids : h.chapter!.got) ? "is-in" : ""}>
                    {h.chapter!.kids >= 0 ? "✦" : "◆"}
                  </span>
                ))}
              </span>
              <span className="ls-chapter-time" aria-hidden="true">
                <span style={{ width: `${Math.max(0, h.chapter.forget * 100)}%` }} />
              </span>
            </div>
          )}
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
              aria-label={`${h?.arrows ?? 0} arrows, ${h?.swords ?? 0} swords, ${h?.traps ?? 0} root traps${h?.rune ? `, the rune ${SPELLS[h.rune].name}` : ""}${h?.homing ? `, ${h.homing} wind arrows` : ""}${h?.companion ? `, a ${h.companion} guards you${h.companionRest ? ", resting" : ""}` : ""}`}
            >
              <span
                title="Arrows (mouse: point and hold; Space: hold, let go to shoot)"
                className={`ls-item${h?.arrows ? "" : " is-none"}${mode === "tutorial" && tutStep === 7 ? " is-teach" : ""}`}
                aria-hidden="true"
              >
                {ico("bow", "🏹")} <b>{h?.arrows ?? 0}</b>
                {!!h?.homing && <span className="ls-homing">+{h.homing} wind</span>}
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
              <span
                title={h?.rune ? `Rune: ${SPELLS[h.rune].name} (R). ${SPELLS[h.rune].help}` : "No rune: ride through a rune-stone"}
                className={`ls-item is-rune${h?.rune ? "" : " is-none"}${h?.casting ? " is-casting" : ""}${mode === "tutorial" && tutStep === 10 ? " is-teach" : ""}`}
                style={h?.rune ? { color: SPELLS[h.rune].colour } : undefined}
                aria-hidden="true"
              >
                {ico("rune", "ᚑ")} <b>{h?.rune ? SPELLS[h.rune].name : "–"}</b>
                {mode === "tutorial" && tutStep === 10 && <span className="ls-teach">R · watch, then the same arrows</span>}
              </span>
              {h?.companion && (
                <span title={h.companionRest ? "Companion, resting" : "Companion, on guard"} className={`ls-item${h.companionRest ? " is-rest" : ""}`} aria-hidden="true">
                  {ico((h.companion === "fox" ? "hound" : h.companion === "hare" ? "doe" : h.companion) as "hound" | "raven" | "doe", "✦")}
                  {h.companionRest && <span className="ls-zz">z</span>}
                </span>
              )}
              <span className="ls-focus" title="Calm: time slows while the bow is drawn" aria-hidden="true">
                <span style={{ width: `${Math.round((h?.focus ?? 1) * 100)}%` }} />
              </span>
              <span className={`ls-ability${(h?.abilityReady ?? 1) >= 1 ? " is-ready" : ""}`} title={`${r.ability} (C or Shift): ${r.abilityHelp}`}>
                <kbd>C</kbd> {r.ability} {(h?.abilityReady ?? 1) >= 1 ? "ready" : `${Math.round((h?.abilityReady ?? 0) * 100)}%`}
              </span>
            </span>
            {mode === "endless" && h?.lamp && (
              <span
                className={`ls-lamp${h.lamp.mirror ? " is-mirror" : ""}`}
                aria-label={`Lamp${h.lamp.mirror ? ", mirrored: take them from the last to the first" : ""}: wants ${h.lamp.want.join(", ")}; ${h.lamp.got} of ${h.lamp.want.length} in`}
                title={h.lamp.mirror ? "A mirrored lamp: take its lights from the last to the first" : "The lamp wants these lights, in this order"}
              >
                <span className="ls-lamp-ico" aria-hidden="true">🏮</span>
                {h.lamp.mirror && <span className="ls-lamp-mirror" aria-hidden="true">⇄</span>}
                {h.lamp.want.map((c, i) => {
                  const n = h.lamp!.want.length;
                  const inLamp = h.lamp!.mirror ? i >= n - h.lamp!.got : i < h.lamp!.got;
                  return <span key={i} className={`ls-lamp-dot is-${c}${inLamp ? " is-in" : ""}`} aria-hidden="true" />;
                })}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className="ls-stage"
        ref={stageRef}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || screen !== "play") return;
          const c = canvasRef.current;
          const g = gameRef.current;
          if (!c || !g) return;
          const rr = c.getBoundingClientRect();
          const p = g.viewPoint(e.clientX - rr.left, e.clientY - rr.top);
          g.setPointer(p.x, p.y);
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || e.button !== 0 || screen !== "play" || dialog) return;
          if ((e.target as HTMLElement).closest("button, a, input, [role=dialog]")) return;
          const c = canvasRef.current;
          const g = gameRef.current;
          if (!c || !g) return;
          const rr = c.getBoundingClientRect();
          const p = g.viewPoint(e.clientX - rr.left, e.clientY - rr.top);
          g.setPointer(p.x, p.y);
          g.key("aim", true);
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse" || screen !== "play") return;
          gameRef.current?.key("aim", false);
        }}
        tabIndex={playing ? 0 : -1}
        role={playing ? "application" : undefined}
        aria-roledescription={playing ? "game" : undefined}
        aria-label={
          playing
            ? "The Long Spring. Left and right arrows steer, up jumps, down ducks, hold Space or the mouse button to draw the bow, R casts a rune, X sword, Z trap, C ability, Escape pauses."
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
        {screen === "play" && introCard !== null && (
          <div className="ls-overlay is-intro" role="dialog" aria-modal="true" aria-labelledby="ls-intro-title" aria-describedby="ls-intro-task">
            <div className="ls-intro-card">
              <p className="ls-kicker">Chapter {introCard + 1} of {MEMORIES.length}</p>
              <MemPic i={introCard} state="mist" thirds={0} />
              <p className="ls-ch-sign">{MEMORIES[introCard].sign}</p>
              <h2 id="ls-intro-title" className="ls-ch-title">
                {MEMORIES[introCard].title}
              </h2>
              <div id="ls-intro-task" className="ls-task">
                <TaskPic rule={MEMORIES[introCard].rule} />
                <p>{TASKS[MEMORIES[introCard].rule ?? "plain"]}</p>
              </div>
              {introCard > 0 && (
                <p className="ls-task-more">
                  <span aria-hidden="true">♥</span> Someone by the road in a ring? Ride through it to give them a heart, if you will.
                </p>
              )}
              <button type="button" className="ls-btn is-go" onClick={closeIntro} ref={introBtn}>
                Ride ▶
              </button>
            </div>
          </div>
        )}
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
                Chapter {memoryCard + 1} of {MEMORIES.length} · {memThirds >= 3 ? "it comes back whole" : memThirds ? `${memThirds} of 3 in colour` : "it stays grey"}
              </p>
              <MemPic i={memoryCard} state="mist" thirds={memThirds} />
              <p className="ls-mist-sign">{MEMORIES[memoryCard].sign}</p>
              <h2 id="ls-mem-title" className="ls-mist-title" tabIndex={-1} ref={memHead}>
                {MEMORIES[memoryCard].title}
              </h2>
              <p id="ls-mem-text" className="ls-mist-text">
                {partOf(MEMORIES[memoryCard].text, memThirds)}
              </p>
              {memThirds >= 3 ? (
                <Recite title={MEMORIES[memoryCard].title} text={MEMORIES[memoryCard].text} />
              ) : (
                <p className="ls-muted ls-small">The rest is still grey. Ride this chapter again some time, and win it back whole.</p>
              )}
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
                    {HEROINE} knows how to ride, how to lead the rot into the land, and how a memory is won back. The mission
                    begins where the rot is deepest.
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
                      The land catches her, as it did once before. She rises again at the start of the chapter{" "}
                      <em>{MEMORIES[Math.min(MEMORIES.length - 1, save.chapterAt ?? 0)].title}</em>.
                    </p>
                  )}
                  <div className="ls-tables">
                    {statTable("The ride", [
                      ["Memories won back", result.stats.memoriesFound],
                      ["Forgotten", result.stats.memoriesLost ?? 0],
                      ...(result.win ? [["Reborn", `${result.reborn}, from the hearts she had left`] as [string, React.ReactNode]] : []),
                      ["Fords crossed dry", result.stats.fords],
                      ["Runes cast", result.stats.spells],
                      ["Ridden", km(result.metres)],
                    ])}
                    {statTable("The rot", monsterRows(result.stats))}
                  </div>
                  <p className="ls-mem-line">
                    <strong>Remembered:</strong>{" "}
                    {result.memories.length ? result.memories.map((i) => MEMORIES[i].title).join(" · ") : "nothing on this ride"}{" "}
                    <span className="ls-muted">
                      ({save.clear.length}/{MEMORIES.length} in the book)
                    </span>
                  </p>
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
              ) : result.mode === "extreme" ? (
                <>
                  <p className="ls-kicker">The hunt · {result.win ? "you outlasted it" : "it caught you"}</p>
                  <h2 id="ls-over-title" className="ls-h2" tabIndex={-1} ref={headRef}>
                    {result.cause}
                  </h2>
                  <div className="ls-records">
                    <div>
                      <span className="ls-record-n">{fmt(result.stats.kills)}</span>
                      <span className="ls-record-l">
                        brought down{result.best && <span className="ls-new"> best!</span>}
                      </span>
                      <span className="ls-record-b">best {fmt(save.bestKills ?? 0)}</span>
                    </div>
                    <div>
                      <span className="ls-record-n">{result.win ? clock(EXTREME.time) : km(result.metres)}</span>
                      <span className="ls-record-l">{result.win ? "survived" : "ridden before the end"}</span>
                      <span className="ls-record-b">hunts outlasted: {fmt(save.huntsWon ?? 0)}</span>
                    </div>
                  </div>
                  <div className="ls-tables is-one">
                    {statTable("Brought down", [...monsterRows(result.stats), ["Runes cast", result.stats.spells], ["Ridden", km(result.metres)]])}
                  </div>
                  <div className="ls-actions">
                    <button type="button" className="ls-btn is-go" onClick={() => ride("extreme")}>
                      Hunt again
                    </button>
                    <button type="button" className="ls-btn is-ghost" onClick={() => setScreen("rider")}>
                      Change rider
                    </button>
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
                  <div className="ls-tables">
                    {statTable("The ride", [
                      ["Score", `${fmt(result.score)} (best ${fmt(save.best)})`],
                      ["Villages saved", result.stats.villagesSaved],
                      ["Lamps filled", result.stats.lamps],
                      ["Companions", result.stats.companions],
                      ["Fords crossed dry", result.stats.fords],
                      ["Runes cast", result.stats.spells],
                      ...(result.stats.animalsLost > 0 ? [["Animals eaten", result.stats.animalsLost] as [string, React.ReactNode]] : []),
                    ])}
                    {statTable("The rot", monsterRows(result.stats))}
                  </div>
                  {result.missions.length > 0 && (
                    <div className="ls-done">
                      <h3 className="ls-h3">This run</h3>
                      <ul>
                        {result.missions.map((m) => (
                          <li key={m}>✓ {m}</li>
                        ))}
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
        <div className="ls-pad is-twin" role="group" aria-label="Touch controls" inert={dialog}>
          <Stick side="left" label="steer · jump · duck" onMove={leftMove} onUp={leftUp} />
          <div className="ls-pad-mid">
            {touchBtn("sword", "Sword", ico("sword", "🗡"))}
            {touchBtn("trap", "Drop a trap", ico("trap", "⊗"))}
            {touchBtn("ability", r.ability, "✦")}
            {touchBtn("rune", h?.rune ? `Cast the rune: ${SPELLS[h.rune].name}` : "Cast a rune (none carried)", ico("rune", "ᚑ"), h?.rune ? "is-rune" : "is-none")}
          </div>
          <Stick
            side="right"
            label="aim · let go to shoot"
            onDown={() => gameRef.current?.key("aim", true)}
            onMove={(dx, dy) => {
              if (Math.hypot(dx, dy) > 12) gameRef.current?.setStick(Math.atan2(dx, -dy));
            }}
            onUp={() => {
              gameRef.current?.key("aim", false);
              gameRef.current?.setStick(null);
            }}
          />
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
