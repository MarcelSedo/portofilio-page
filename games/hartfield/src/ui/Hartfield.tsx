"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Game, type Dir, type CastId } from "../engine/game";
import { MAPS } from "../data/maps.gen";
import { ART } from "../engine/art";
import { setSound, sfx, startRain, stopRain } from "../engine/sound";
import {
  CARDS, NAMES, PLAN, ROUTE, TASKS, examine, fresh, guideFor, npcsFor, talk,
  type Lang, type PuzzleId, type State, type Step, type Txt,
} from "../data/story";
import { ROOM_NAMES, UI } from "../data/ui";
import { Casebook, q, type Pick } from "./Casebook";
import { PuzzleView } from "./Puzzles";
import { Icon, Portrait } from "./bits";
import { STUDIO_LOGO } from "./studio-logo";
import "../styles/hartfield.css";

export type HartfieldProps = { exitHref?: string; exitLabel?: string };
type Settings = { lang: Lang; speed: number; guide: boolean; sound: boolean };
type Screen = "studio" | "title" | "play" | "end";
type Overlay =
  | { kind: "say"; who?: CastId; text: string }
  | { kind: "found"; card: string }
  | { kind: "choose"; options: string[]; who?: CastId; text?: string }
  | { kind: "puzzle"; id: PuzzleId }
  | { kind: "object"; claim: Txt }
  | { kind: "pick"; claim: Txt };
type Panel = null | "menu" | "casebook" | "tasks" | "skills" | "settings";

const SAVE = "hartfield-act1";
const KEYDIR: Record<string, Dir> = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function loadAll(): { state: State | null; settings: Settings } {
  const def: Settings = { lang: "en", speed: 1, guide: true, sound: true };
  try {
    const raw = localStorage.getItem(SAVE); if (!raw) return { state: null, settings: def };
    const j = JSON.parse(raw);
    return { state: j.state?.v === 2 ? j.state : null, settings: { ...def, ...(j.settings || {}) } };
  } catch { return { state: null, settings: def }; }
}

export function Hartfield({ exitHref = "/", exitLabel }: HartfieldProps) {
  const [screen, setScreen] = useState<Screen>("studio");
  const [settings, setSettings] = useState<Settings>({ lang: "en", speed: 1, guide: true, sound: true });
  const [hasSave, setHasSave] = useState(false);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [, setV] = useState(0);
  const [sr, setSr] = useState("");
  const [confirmNew, setConfirmNew] = useState(false);
  const [howTo, setHowTo] = useState(false);
  const [touch, setTouch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const sRef = useRef<State>(fresh());
  const setRef = useRef(settings); setRef.current = settings;
  const waitRef = useRef<((v: unknown) => void) | null>(null);
  const busy = useRef(false);
  const cutscene = useRef(false);
  const lastLine = useRef<{ who?: CastId; text: string } | null>(null);
  const loaded = useRef(false);
  const lang = settings.lang;
  const t = useCallback((x: Txt) => x[setRef.current.lang], []);

  // ---------------------------------------------------------------- persistence
  const save = useCallback(() => {
    const g = gameRef.current, s = sRef.current;
    if (g?.room && !cutscene.current) { s.room = g.room.name; s.x = g.player.x; s.y = g.player.y; s.face = g.player.face; }
    try { localStorage.setItem(SAVE, JSON.stringify({ state: s, settings: setRef.current })); } catch { /* private mode */ }
  }, []);
  useEffect(() => {
    const { state, settings: st } = loadAll();
    setSettings(st); setHasSave(!!state && state.stage > 0); if (state) sRef.current = state;
    loaded.current = true;
    setTouch(window.matchMedia?.("(pointer: coarse)").matches ?? false);
    setSound(st.sound);
    const id = setTimeout(() => setScreen((s) => (s === "studio" ? "title" : s)), 2600);
    return () => clearTimeout(id);
  }, []);
  useEffect(() => { setSound(settings.sound); }, [settings.sound]);
  const changeSettings = useCallback((v: Settings) => {
    setRef.current = v; setSettings(v);
    try { const raw = localStorage.getItem(SAVE); const j = raw ? JSON.parse(raw) : {}; j.settings = v; localStorage.setItem(SAVE, JSON.stringify(j)); } catch { /* private mode */ }
  }, []);

  // ---------------------------------------------------------------- world sync
  const sync = useCallback(() => {
    const g = gameRef.current; if (!g || !g.room) return;
    const s = sRef.current;
    if (!cutscene.current) g.npcs = npcsFor(s).map((n) => ({ ...n }));
    g.marks = new Set<string>();
    if (s.stage === 3) g.marks.add("attic:attic_bed");
    if (s.stage === 9) g.marks.add("attic:attic_basket");
    if (s.stage === 13 && !s.cards.includes("i_horse")) g.marks.add("stable:tom_shelf");
    const goal = guideFor(s);
    if (!goal || !setRef.current.guide || cutscene.current) g.guide = null;
    else if (goal.room === g.room.name) g.guide = goal;
    else {
      const r = ROUTE[g.room.name] || {}; const next = r[goal.room] ?? r["*"];
      const w = MAPS[g.room.name].warps.find((q) => q.to === next);
      g.guide = w ? { room: g.room.name, x: w.at[0], y: w.at[1] } : null;
    }
    setV((v) => v + 1);
  }, []);

  // ---------------------------------------------------------------- overlays as promises
  const show = useCallback(<R,>(o: Overlay) => new Promise<R>((resolve) => {
    if (o.kind === "say") lastLine.current = { who: o.who, text: o.text };
    waitRef.current = resolve as (v: unknown) => void; setOverlay(o);
  }), []);
  const answer = useCallback((v: unknown) => { const w = waitRef.current; waitRef.current = null; setOverlay(null); w?.(v); }, []);

  const give = useCallback((id: string) => {
    const s = sRef.current; if (!s.cards.includes(id)) { s.cards.push(id); s.newCards.push(id); }
  }, []);

  const run = useCallback(async (steps: Step[]) => {
    const g = gameRef.current; if (!g || busy.current) return;
    busy.current = true; g.frozen = true; g.releaseAll();
    const q = [...steps];
    while (q.length) {
      const st = q.shift()!;
      if ("say" in st) await show({ kind: "say", who: st.say, text: t(st.t) });
      else if ("note" in st) await show({ kind: "say", text: t(st.note) });
      else if ("give" in st) { give(st.give); sfx.find(); await show({ kind: "found", card: st.give }); }
      else if ("take" in st) { const s = sRef.current; s.cards = s.cards.filter((c) => c !== st.take); }
      else if ("set" in st) { st.set(sRef.current); sync(); }
      else if ("choose" in st) {
        const i = await show<number>({ kind: "choose", options: st.choose.map((c) => t(c.t)), who: lastLine.current?.who, text: lastLine.current?.text });
        q.unshift(...st.choose[i].then);
      } else if ("puzzle" in st) {
        const ok = await show<boolean>({ kind: "puzzle", id: st.puzzle });
        if (ok) q.unshift(...st.win); else q.length = 0;
      } else if ("object" in st) {
        const r = await show<"agree" | "object">({ kind: "object", claim: st.object.claim });
        if (r === "agree") { q.length = 0; q.push({ say: "emma", t: UI.agreed }); continue; }
        const card = await show<string | null>({ kind: "pick", claim: st.object.claim });
        if (card && st.object.answer.includes(card)) { sfx.object(); q.unshift(...st.object.win); }
        else { sfx.wrong(); q.length = 0; if (card) q.push({ say: "emma", t: UI.wrongProof }); }
      } else if ("cutscene" in st) await ending();
      save();
    }
    busy.current = false; if (!cutscene.current) g.frozen = false; sync(); save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [give, save, show, sync, t]);

  // ---------------------------------------------------------------- the ending
  const ending = async () => {
    const g = gameRef.current!; cutscene.current = true; g.locked = true;
    g.npcs = [
      { id: "bessie", room: "yard", x: 3, y: 4, face: "down" },
      { id: "tom", room: "yard", x: 11, y: 4, face: "down", hidden: true },
      { id: "emma", room: "yard", x: 4, y: 4, face: "down", hidden: true },
      { id: "knightley", room: "yard", x: 5, y: 4, face: "down", hidden: true },
    ];
    g.guide = null; g.warpTo("yard", 2, 5, "right"); await sleep(700);
    const say = (who: CastId, en: string, sk: string) => show({ kind: "say", who, text: setRef.current.lang === "en" ? en : sk });
    await sleep(300);
    await g.walk("bessie", [[3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5]]);
    g.npcs.find((n) => n.id === "tom")!.hidden = false; sfx.door(); await sleep(300);
    await g.walk("tom", [[11, 5]]); g.npcs.find((n) => n.id === "tom")!.face = "left"; g.npcs.find((n) => n.id === "bessie")!.face = "right";
    await say("tom", "Bess? Out in this rain?", "Bess? Vonku v tomto daždi?");
    await say("bessie", "Mr Woodhouse sent you gruel. Thin, but not too thin.", "Pán Woodhouse ti posiela kašu. Riedku, ale nie príliš.");
    await say("bessie", "And Tom – that letter on Tuesday was to you. Patrick held the pen, that's all. I can't write, you great goose.", "A Tom – ten list v utorok bol pre teba. Patrick len držal pero. Ja neviem písať, ty trúba.");
    await say("tom", "To me? …Then come in out of the wet, Bess. Come in.", "Pre mňa? …Tak poď z toho mokra, Bess. Poď dnu.");
    g.heartsAt(10.5, 5); sfx.win();
    g.weather = "clearing"; stopRain();
    await show({ kind: "say", text: setRef.current.lang === "en" ? "And the rain, at last, stops." : "A dážď konečne prestane." });
    await sleep(600);
    await say("tom", "Miss Smith! Tell Mr Woodhouse the wheel will be on in a trice. You shall have the carriage within the hour!", "Slečna Smithová! Povedzte pánovi Woodhouseovi, že koleso bude na mieste raz-dva. Koč budete mať do hodiny!");
    g.gateOpen = true; sfx.door();
    for (const id of ["emma", "knightley"]) g.npcs.find((n) => n.id === id)!.hidden = false;
    g.player.face = "up";
    await say("emma", "There! I always knew it was Tom.", "No vidíte! Vždy som vedela, že je to Tom.");
    await say("knightley", "You knew nothing of the kind, Emma. You suspected the gardener, the footman and the butler. Miss Smith knew.", "Nič také ste nevedeli, Emma. Podozrievali ste záhradníka, lokaja aj komorníka. Slečna Smithová to vedela.");
    await say("emma", "Mr Knightley, you are insufferable. Harriet – your bonnet. Highbury awaits!", "Pán Knightley, ste neznesiteľný. Harriet – čepiec. Highbury čaká!");
    sRef.current.stage = 17; save();
    await sleep(400);
    setScreen("end");
  };

  // ---------------------------------------------------------------- starting the world
  useEffect(() => {
    if (screen !== "play" || !canvasRef.current) return;
    const s = sRef.current;
    const g = new Game(canvasRef.current, {
      interact: (kind, id) => {
        if (busy.current) return;
        const steps = kind === "npc" ? talk(sRef.current, id as CastId) : examine(sRef.current, id);
        void run(steps);
      },
      entered: (room) => {
        sfx.door();
        const r = MAPS[room]; const outside = r.fx.some((f) => f.type === "weather"); const windows = r.fx.some((f) => f.type === "rain");
        if (setRef.current.sound && sRef.current.stage < 17 && !cutscene.current) { if (outside) startRain(1); else if (windows) startRain(0.35); else startRain(0.15); }
        setSr(`${t(UI.sr.room)} ${t(ROOM_NAMES[room])}.`);
        setTimeout(() => { sync(); save(); }, 0);
      },
      facing: (w) => {
        if (w.kind === "none") return;
        const name = w.kind === "npc" ? t(NAMES[w.id as CastId]) : w.kind === "door" ? `${t(UI.sr.door)} ${t(ROOM_NAMES[w.id] ?? { en: w.id, sk: w.id })}` : w.id.replace(/_/g, " ");
        setSr(`${t(UI.sr.facing)} ${name}`);
      },
    });
    gameRef.current = g;
    g.npcs = npcsFor(s).map((n) => ({ ...n }));
    if (s.stage >= 17) { g.weather = "clear"; g.gateOpen = true; }
    g.load(s.room, s.x, s.y, s.face);
    g.start(); sync();
    if (typeof window !== "undefined" && window.location.search.includes("debug")) (window as unknown as { __hf: unknown }).__hf = { game: g, state: () => sRef.current };
    let intro: ReturnType<typeof setTimeout> | undefined;
    if (s.stage === 0) intro = setTimeout(() => void run(talk(sRef.current, "emma")), 700);
    return () => { if (intro) clearTimeout(intro); g.stop(); stopRain(); gameRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ---------------------------------------------------------------- keyboard in the world
  useEffect(() => {
    if (screen !== "play") return;
    const down = (e: KeyboardEvent) => {
      const g = gameRef.current; if (!g) return;
      if (overlay || panel) return;
      if (KEYDIR[e.key]) { e.preventDefault(); if (!e.repeat) g.press(KEYDIR[e.key]); return; }
      if (e.repeat) return;
      if (e.key === "e" || e.key === "E" || e.key === " " || e.key === "Enter") { e.preventDefault(); g.action(); return; }
      if (e.key === "b" || e.key === "B" || e.key === "c" || e.key === "C") { e.preventDefault(); g.releaseAll(); setPanel("casebook"); sfx.select(); return; }
      if (e.key === "Escape" || e.key === "m" || e.key === "M") { e.preventDefault(); g.releaseAll(); setPanel("menu"); sfx.select(); }
    };
    const up = (e: KeyboardEvent) => { const d = KEYDIR[e.key]; if (d) gameRef.current?.release(d); };
    const blur = () => gameRef.current?.releaseAll();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", blur);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", blur); };
  }, [screen, overlay, panel]);
  useEffect(() => { const g = gameRef.current; if (g) g.frozen = !!overlay || !!panel || busy.current || cutscene.current; }, [overlay, panel]);

  // ---------------------------------------------------------------- title actions
  const begin = (fresh_: boolean) => {
    if (fresh_) { sRef.current = fresh(); cutscene.current = false; }
    setConfirmNew(false); setScreen("play"); sfx.select();
  };
  const leave = () => { save(); setPanel(null); setScreen("title"); setHasSave(true); };

  // ---------------------------------------------------------------- render helpers
  const s = sRef.current;
  const closeCasebook = () => { s.newCards = []; setPanel(null); save(); };
  const vkey = (key: string, type: "keydown" | "keyup" = "keydown") => window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));

  return (
    <div className={`hf lang-${lang}`}>
      <div className="hf-stage" data-overlay={overlay?.kind ?? ""} data-panel={panel ?? ""} data-screen={screen} data-puzzle={overlay?.kind === "puzzle" ? overlay.id : ""}>
        {screen === "studio" && (
          <button type="button" className="hf-studio" onClick={() => setScreen("title")} aria-label="Marcel Šedo Studio presents">
            <span className="hf-studio-logo" aria-hidden="true" dangerouslySetInnerHTML={{ __html: STUDIO_LOGO }} />
            <span className="hf-studio-skip">{lang === "en" ? "presents" : "uvádza"}</span>
          </button>
        )}

        {screen === "title" && (
          <TitleScreen lang={lang} hasSave={hasSave} onContinue={() => begin(false)} onNew={() => (hasSave ? setConfirmNew(true) : begin(true))}
            onLang={() => changeSettings({ ...settings, lang: lang === "en" ? "sk" : "en" })} onHow={() => setHowTo(true)} exitHref={exitHref} exitLabel={exitLabel} />
        )}
        {screen === "title" && confirmNew && (
          <div className="hf-modal"><div className="hf-frame hf-small-frame" role="alertdialog" aria-modal="true">
            <p className="hf-p">{t(UI.confirmNew)}</p>
            <div className="hf-row hf-center"><button autoFocus type="button" className="hf-btn is-primary" onClick={() => begin(true)}>{t(UI.yes)}</button><button type="button" className="hf-btn" onClick={() => setConfirmNew(false)}>{t(UI.no)}</button></div>
          </div></div>
        )}
        {screen === "title" && howTo && (
          <div className="hf-modal" onKeyDown={(e) => { if (e.key === "Escape") setHowTo(false); }}><div className="hf-frame" role="dialog" aria-modal="true" aria-label={t(UI.howTo)}>
            <h2 className="hf-h2">{t(UI.howTo)}</h2>
            <ul className="hf-howto">{UI.howToText.map((x, i) => <li key={i}>{t(x)}</li>)}</ul>
            <p className="hf-small">{t(UI.credits)}</p>
            <div className="hf-row hf-center"><button autoFocus type="button" className="hf-btn is-primary" onClick={() => setHowTo(false)}>{t(UI.done)}</button></div>
          </div></div>
        )}

        {screen === "play" && (
          <>
            <canvas ref={canvasRef} className="hf-canvas" role="img" aria-label={`${t(UI.sr.room)} ${t(ROOM_NAMES[gameRef.current?.room?.name ?? s.room] ?? UI.title)}`} />
            <div className="hf-hud">
              <div className="hf-task" aria-live="polite"><span className="hf-task-k">{t(UI.task)}</span> {t(TASKS[s.stage] ?? TASKS[0])}</div>
              <div className="hf-hud-btns">
                <button type="button" className="hf-hudbtn" onClick={() => setPanel("casebook")} aria-label="Casebook (B)">
                  <span className="hf-bookicon" aria-hidden="true" />{s.newCards.length > 0 && <span className="hf-dot">{s.newCards.length}</span>}<kbd>B</kbd></button>
                <button type="button" className="hf-hudbtn" onClick={() => setPanel("menu")} aria-label="Menu (Esc)">☰ <kbd>Esc</kbd></button>
              </div>
            </div>
            {overlay && (overlay.kind === "say" || overlay.kind === "choose") && (
              <Dialogue o={overlay} lang={lang} speed={settings.speed} onDone={answer} />
            )}
            {overlay?.kind === "found" && <Found card={overlay.card} lang={lang} onDone={() => answer(true)} />}
            {overlay?.kind === "puzzle" && <PuzzleView id={overlay.id} lang={lang} state={s} onWin={() => { sfx.win(); answer(true); }} onCancel={() => answer(false)} />}
            {overlay?.kind === "object" && <Objection claim={overlay.claim} lang={lang} onAnswer={(v) => answer(v)} />}
            {overlay?.kind === "pick" && <Casebook lang={lang} state={s} pick={{ claim: overlay.claim, onPick: (id) => answer(id) } as Pick} onClose={() => answer(null)} />}
            {panel === "menu" && <StartMenu lang={lang} exitHref={exitHref} onPick={(p) => { sfx.select(); if (p === "leave") leave(); else if (p === "close") setPanel(null); else setPanel(p); }} />}
            {panel === "casebook" && <Casebook lang={lang} state={s} onClose={closeCasebook} />}
            {panel === "tasks" && <TasksPanel lang={lang} state={s} onClose={() => setPanel("menu")} />}
            {panel === "skills" && <SkillsPanel lang={lang} state={s} onClose={() => setPanel("menu")} />}
            {panel === "settings" && <SettingsPanel lang={lang} settings={settings} onChange={(v) => { changeSettings(v); setTimeout(sync, 0); }} onClose={() => setPanel("menu")} />}
            <p className="hf-sr" aria-live="polite">{sr}</p>
          </>
        )}

        {screen === "end" && <EndScreen lang={lang} state={s} exitHref={exitHref} exitLabel={exitLabel} onTitle={() => { cutscene.current = false; setScreen("title"); }} />}
      </div>
      {touch && screen === "play" && (
        <div className="hf-touch" aria-hidden="true">
          <div className="hf-dpad">
            {(["ArrowUp", "ArrowLeft", "ArrowRight", "ArrowDown"] as const).map((k) => (
              <button key={k} type="button" className={`hf-dk is-${k}`} tabIndex={-1}
                onPointerDown={(e) => { e.preventDefault(); vkey(k); }} onPointerUp={() => vkey(k, "keyup")} onPointerLeave={() => vkey(k, "keyup")} onPointerCancel={() => vkey(k, "keyup")}>
                {{ ArrowUp: "▲", ArrowLeft: "◀", ArrowRight: "▶", ArrowDown: "▼" }[k]}</button>
            ))}
          </div>
          <div className="hf-ab">
            <button type="button" className="hf-ak" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); vkey("Enter"); }}>A</button>
            <button type="button" className="hf-bk" tabIndex={-1} onPointerDown={(e) => { e.preventDefault(); vkey("Escape"); }}>B</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================================================================== pieces
function TitleScreen({ lang, hasSave, onContinue, onNew, onLang, onHow, exitHref, exitLabel }: { lang: Lang; hasSave: boolean; onContinue: () => void; onNew: () => void; onLang: () => void; onHow: () => void; exitHref: string; exitLabel?: string }) {
  const t = (x: Txt) => x[lang];
  const items = [...(hasSave ? [{ k: "c", label: t(UI.continue), on: onContinue }] : []), { k: "n", label: t(UI.newGame), on: onNew }, { k: "l", label: t(UI.language), on: onLang }, { k: "h", label: t(UI.howTo), on: onHow }];
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { refs.current[sel]?.focus(); }, [sel]);
  return (
    <div className="hf-title" style={{ backgroundImage: `url(${ART.titleRain})` }}
      onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setSel((sel + 1) % (items.length + 1)); } if (e.key === "ArrowUp") { e.preventDefault(); setSel((sel + items.length) % (items.length + 1)); } }}>
      <div className="hf-rain" aria-hidden="true" />
      <div className="hf-title-card">
        <p className="hf-kicker">{t(UI.act)}</p>
        <h1 className="hf-logo">{t(UI.title)}</h1>
        <p className="hf-subtitle">{t(UI.subtitle)}</p>
      </div>
      <nav className="hf-frame hf-title-menu" aria-label="Menu">
        <ul>{items.map((it, i) => <li key={it.k}><button ref={(el) => { refs.current[i] = el; }} type="button" className={`hf-mi${i === sel ? " is-cur" : ""}`} onFocus={() => setSel(i)} onClick={it.on}>{it.label}</button></li>)}
          <li><a ref={(el) => { refs.current[items.length] = el as unknown as HTMLButtonElement; }} className={`hf-mi${sel === items.length ? " is-cur" : ""}`} onFocus={() => setSel(items.length)} href={exitHref}>{exitLabel ?? t(UI.portfolio)}</a></li></ul>
      </nav>
    </div>
  );
}

function Dialogue({ o, lang, speed, onDone }: { o: Extract<Overlay, { kind: "say" | "choose" }>; lang: Lang; speed: number; onDone: (v: unknown) => void }) {
  const text = o.kind === "say" ? o.text : o.text ?? "";
  const [n, setN] = useState(speed >= 2 || o.kind === "choose" ? text.length : 0);
  const [sel, setSel] = useState(0);
  const typing = n < text.length;
  useEffect(() => {
    if (!typing) return;
    const ms = speed === 0 ? 30 : 13;
    const id = setInterval(() => setN((k) => { if (k % 3 === 0) sfx.blip(); return Math.min(text.length, k + 1); }), ms);
    return () => clearInterval(id);
  }, [typing, text, speed]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (o.kind === "choose") {
        if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); setSel((s) => (s + o.options.length - 1) % o.options.length); sfx.blip(); }
        if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); setSel((s) => (s + 1) % o.options.length); sfx.blip(); }
        if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); sfx.select(); onDone(sel); }
        return;
      }
      if (["Enter", " ", "e", "E", "Escape"].includes(e.key)) { e.preventDefault(); if (typing) setN(text.length); else onDone(true); }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [o, typing, text, sel, onDone]);
  const who = o.who;
  return (
    <div className="hf-dialogue-wrap">
      {o.kind === "choose" && (
        <ul className="hf-frame hf-choicebox" role="listbox" aria-label={lang === "en" ? "Choose" : "Vyber"}>
          {o.options.map((op, i) => <li key={i}><button type="button" role="option" aria-selected={i === sel} className={`hf-mi${i === sel ? " is-cur" : ""}`} onMouseEnter={() => setSel(i)} onClick={() => onDone(i)}>{op}</button></li>)}
        </ul>
      )}
      <div className={`hf-frame hf-dialogue${who ? "" : " is-note"}`} onClick={() => { if (o.kind === "say") { if (typing) setN(text.length); else onDone(true); } }} role="dialog" aria-live="polite">
        {who && <div className="hf-dlg-portrait"><Portrait id={who} scale={2} /></div>}
        <div className="hf-dlg-body">
          {who && <p className="hf-dlg-name">{NAMES[who][lang]}</p>}
          <p className="hf-dlg-text"><span>{text.slice(0, n)}</span><span className="hf-ghost" aria-hidden="true">{text.slice(n)}</span></p>
          <span className="hf-sr">{text}</span>
        </div>
        {o.kind === "say" && !typing && <span className="hf-more" aria-hidden="true">▼</span>}
      </div>
    </div>
  );
}

function Found({ card, lang, onDone }: { card: string; lang: Lang; onDone: () => void }) {
  const c = CARDS[card];
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.repeat) return; if (["Enter", " ", "e", "E", "Escape"].includes(e.key)) { e.preventDefault(); onDone(); } };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [onDone]);
  if (!c) { onDone(); return null; }
  return (
    <div className="hf-dialogue-wrap">
      <div className="hf-frame hf-dialogue is-found" onClick={onDone} role="status">
        <span className="hf-iconbox">{c.kind === "word" && c.who ? <Portrait id={c.who} scale={1} /> : <Icon name={c.icon || "note"} scale={3} />}</span>
        <div className="hf-dlg-body">
          <p className="hf-dlg-name">{c.kind === "word" ? UI.heard[lang] : UI.found[lang]}</p>
          <p className="hf-dlg-text"><b>{c.title[lang]}</b> – {UI.toCasebook[lang]}.</p>
        </div>
        <span className="hf-more" aria-hidden="true">▼</span>
      </div>
    </div>
  );
}

function Objection({ claim, lang, onAnswer }: { claim: Txt; lang: Lang; onAnswer: (v: "agree" | "object") => void }) {
  const [sel, setSel] = useState(0);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d"].includes(e.key)) { e.preventDefault(); setSel((s) => 1 - s); sfx.blip(); }
      if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); onAnswer(sel === 0 ? "object" : "agree"); }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, [sel, onAnswer]);
  return (
    <div className="hf-modal is-low">
      <div className="hf-frame hf-objection" role="dialog" aria-modal="true" aria-label={UI.emmaThinks[lang]}>
        <div className="hf-claim"><Portrait id="emma" scale={2} /><div><p className="hf-dlg-name">{UI.emmaThinks[lang]}</p><p className="hf-claim-text">{q(claim[lang], lang)}</p></div></div>
        <div className="hf-row hf-center">
          <button type="button" className={`hf-btn is-object${sel === 0 ? " is-cur" : ""}`} onMouseEnter={() => setSel(0)} onClick={() => onAnswer("object")}>{UI.object[lang]}</button>
          <button type="button" className={`hf-btn${sel === 1 ? " is-cur" : ""}`} onMouseEnter={() => setSel(1)} onClick={() => onAnswer("agree")}>{UI.agree[lang]}</button>
        </div>
      </div>
    </div>
  );
}

function StartMenu({ lang, onPick, exitHref }: { lang: Lang; onPick: (p: "casebook" | "tasks" | "skills" | "settings" | "leave" | "close") => void; exitHref: string }) {
  const items: { k: "casebook" | "tasks" | "skills" | "settings" | "leave" | "close"; t: Txt }[] = [
    { k: "casebook", t: UI.menu.casebook }, { k: "tasks", t: UI.menu.tasks }, { k: "skills", t: UI.menu.skills }, { k: "settings", t: UI.menu.settings }, { k: "leave", t: UI.menu.title }, { k: "close", t: UI.menu.close },
  ];
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => { refs.current[sel]?.focus(); }, [sel]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "m" || e.key === "M") { e.preventDefault(); onPick("close"); }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); setSel((x) => (x + 1) % items.length); sfx.blip(); }
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); setSel((x) => (x + items.length - 1) % items.length); sfx.blip(); }
      if (e.key === "e" || e.key === "E") { e.preventDefault(); onPick(items[sel].k); }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  });
  return (
    <div className="hf-menu-wrap" onClick={(e) => { if (e.target === e.currentTarget) onPick("close"); }}>
      <nav className="hf-frame hf-startmenu" aria-label="Menu">
        <ul>{items.map((it, i) => <li key={it.k}><button ref={(el) => { refs.current[i] = el; }} type="button" className={`hf-mi${i === sel ? " is-cur" : ""}`} onFocus={() => setSel(i)} onClick={() => onPick(it.k)}>{it.t[lang]}</button></li>)}
          <li><a className="hf-mi is-quiet" href={exitHref}>{UI.portfolio[lang]}</a></li></ul>
      </nav>
    </div>
  );
}

function PanelFrame({ title, onClose, children, lang }: { title: string; onClose: () => void; children: React.ReactNode; lang: Lang }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); const f = (e: KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); onClose(); } }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [onClose]);
  return (
    <div className="hf-modal"><div ref={ref} tabIndex={-1} className="hf-frame hf-panel" role="dialog" aria-modal="true" aria-label={title}>
      <h2 className="hf-h2">{title}</h2>{children}
      <button type="button" className="hf-link" onClick={onClose}>{UI.menu.close[lang]} <kbd>Esc</kbd></button>
    </div></div>
  );
}

function TasksPanel({ lang, state, onClose }: { lang: Lang; state: State; onClose: () => void }) {
  return (
    <PanelFrame title={UI.menu.tasks[lang]} onClose={onClose} lang={lang}>
      <div className="hf-claim"><Portrait id="emma" scale={1} /><p className="hf-p"><b>{UI.task[lang]}:</b> {(TASKS[state.stage] ?? TASKS[0])[lang]}</p></div>
      {state.stage >= 15 && state.stage < 17 && (<><h3 className="hf-h3">{UI.plan[lang]}</h3>
        <ul className="hf-facts">{PLAN.map((p) => <li key={p.id} className={state.flags[p.id] ? "is-on" : ""}><span aria-hidden="true">{state.flags[p.id] ? "✓" : "○"}</span> {p.t[lang]}</li>)}</ul></>)}
      <h3 className="hf-h3">{UI.side[lang]}</h3>
      <ul className="hf-facts">
        <li className={state.flags.shawl ? "is-on" : ""}><span aria-hidden="true">{state.flags.shawl ? "✓" : "○"}</span> {state.cards.includes("i_shawl") || state.flags.shawl ? UI.sideShawl[lang] : "…"}</li>
        <li className={state.flags.window ? "is-on" : ""}><span aria-hidden="true">{state.flags.window ? "✓" : "○"}</span> {state.cards.includes("l_draughts") || state.flags.window ? UI.sideWindow[lang] : "…"}</li>
      </ul>
    </PanelFrame>
  );
}

function SkillsPanel({ lang, state, onClose }: { lang: Lang; state: State; onClose: () => void }) {
  return (
    <PanelFrame title={UI.menu.skills[lang]} onClose={onClose} lang={lang}>
      <p className="hf-p"><i>{UI.skillsIntro[lang]}</i></p>
      <ul className="hf-skills">
        {(["needle", "music", "house"] as const).map((k) => (
          <li key={k}><b>{UI.skill[k][0][lang]}</b> <span className="hf-stars" aria-label={`${state.skills[k]} / 3`}>{"✿".repeat(state.skills[k])}<span className="hf-muted">{"✿".repeat(3 - state.skills[k])}</span></span>
            <span className="hf-small">{UI.skill[k][1][lang]} {UI.skill[k][2][lang]}</span></li>
        ))}
      </ul>
    </PanelFrame>
  );
}

function SettingsPanel({ lang, settings, onChange, onClose }: { lang: Lang; settings: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  return (
    <PanelFrame title={UI.menu.settings[lang]} onClose={onClose} lang={lang}>
      <div className="hf-settings">
        <span>{UI.settingsLang[lang]}</span>
        <div className="hf-row">{(["en", "sk"] as const).map((l) => <button key={l} type="button" className={`hf-chip${settings.lang === l ? " is-on" : ""}`} aria-pressed={settings.lang === l} onClick={() => onChange({ ...settings, lang: l })}>{l === "en" ? "English" : "Slovenčina"}</button>)}</div>
        <span>{UI.settingsSpeed[lang]}</span>
        <div className="hf-row">{UI.speeds.map((sp, i) => <button key={i} type="button" className={`hf-chip${settings.speed === i ? " is-on" : ""}`} aria-pressed={settings.speed === i} onClick={() => onChange({ ...settings, speed: i })}>{sp[lang]}</button>)}</div>
        <span>{UI.settingsGuide[lang]}</span>
        <div className="hf-row">{[true, false].map((v) => <button key={String(v)} type="button" className={`hf-chip${settings.guide === v ? " is-on" : ""}`} aria-pressed={settings.guide === v} onClick={() => onChange({ ...settings, guide: v })}>{(v ? UI.on : UI.off)[lang]}</button>)}</div>
        <span>{UI.settingsSound[lang]}</span>
        <div className="hf-row">{[true, false].map((v) => <button key={String(v)} type="button" className={`hf-chip${settings.sound === v ? " is-on" : ""}`} aria-pressed={settings.sound === v} onClick={() => { onChange({ ...settings, sound: v }); if (!v) stopRain(); }}>{(v ? UI.on : UI.off)[lang]}</button>)}</div>
      </div>
    </PanelFrame>
  );
}

function EndScreen({ lang, state, exitHref, exitLabel, onTitle }: { lang: Lang; state: State; exitHref: string; exitLabel?: string; onTitle: () => void }) {
  const total = Object.keys(CARDS).length;
  const found = new Set([...state.cards, ...(state.flags.shawl ? ["i_shawl"] : []), ...(state.flags.gruel ? ["i_gruel"] : []), ...(state.flags.umbrella ? ["i_umbrella"] : [])]).size;
  const acc = (["needle", "music", "house"] as const).map((k) => `${UI.skill[k][0][lang]} ${"✿".repeat(state.skills[k]) || "–"}`).join(", ");
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="hf-title is-end" style={{ backgroundImage: `url(${ART.titleSun})` }}>
      <div className="hf-frame hf-endcard" role="dialog" aria-label={UI.endTitle[lang]}>
        <p className="hf-kicker">{UI.act[lang]}</p>
        <h1 className="hf-logo is-small">{UI.endTitle[lang]}</h1>
        <p className="hf-p">{UI.endText[lang]}</p>
        <p className="hf-p">{UI.endStats[lang].replace("{c}", String(found)).replace("{t}", String(total)).replace("{a}", acc)}</p>
        <p className="hf-p"><i>{UI.endNext[lang]}</i></p>
        <div className="hf-row hf-center">
          <button ref={ref} type="button" className="hf-btn is-primary" onClick={onTitle}>{UI.backToTitle[lang]}</button>
          <a className="hf-btn" href={exitHref}>{exitLabel ?? UI.portfolio[lang]}</a>
        </div>
      </div>
    </div>
  );
}
