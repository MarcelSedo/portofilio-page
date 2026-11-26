"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Lang, State, PuzzleId, Txt } from "../data/story";
import { AIRS, GRUEL, LETTER_PIECES, LETTER_START, NEEDLE, SERLE_TALE, TACT, TIMELINE, UI } from "../data/ui";
import { sfx } from "../engine/sound";
import { Icon } from "./bits";

type P = { lang: Lang; state: State; onWin: () => void; onCancel: () => void };
const tr = (t: Txt, l: Lang) => t[l];

function Frame({ title, children, onCancel, lang, wide }: { title: string; children: ReactNode; onCancel: () => void; lang: Lang; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="hf-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div ref={ref} tabIndex={-1} className={`hf-frame hf-puzzle${wide ? " is-wide" : ""}`}>
        <h2 className="hf-h2">{title}</h2>
        {children}
        <button type="button" className="hf-link" onClick={onCancel}>{tr(UI.cancel, lang)} <kbd>Esc</kbd></button>
      </div>
    </div>
  );
}
/** keys for a puzzle, ignoring repeats from held keys */
function useKeys(handler: (e: KeyboardEvent) => void) {
  const h = useRef(handler); h.current = handler;
  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.repeat && !e.key.startsWith("Arrow")) return; h.current(e); };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  }, []);
}

// ------------------------------------------------------------------ polishing the silver (repeatable)
const PIECES = [L3("a spoon", "lyžica"), L3("a fork", "vidlička"), L3("a ladle", "naberačka")];
function L3(en: string, sk: string): Txt { return { en, sk }; }
export function Silver({ lang, state, onWin, onCancel }: P) {
  const need = [12, 9, 7, 6][state.skills.house];
  const [piece, setPiece] = useState(0);
  const [shine, setShine] = useState(0);
  const [last, setLast] = useState<"l" | "r" | null>(null);
  const [msg, setMsg] = useState<Txt | null>(null);
  const rub = (k: "l" | "r") => {
    if (piece >= 3) return;
    if (k === last) { setShine((s) => Math.max(0, s - 1)); setMsg(L3("A smudge! Rub the other way.", "Šmuha! Treba z druhej strany.")); sfx.wrong(); return; }
    setLast(k); setMsg(null); sfx.rub();
    const n = shine + 1;
    if (n >= need) { sfx.find(); if (piece === 2) { setPiece(3); setTimeout(onWin, 600); } else { setPiece(piece + 1); setShine(0); setLast(null); } }
    else setShine(n);
  };
  useKeys((e) => {
    if (e.key === "Escape") return onCancel();
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") { e.preventDefault(); rub("l"); }
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") { e.preventDefault(); rub("r"); }
  });
  const k = piece >= 3 ? 1 : shine / need;
  return (
    <Frame title={tr(L3("Polishing the silver", "Leštenie striebra"), lang)} onCancel={onCancel} lang={lang}>
      <p className="hf-p">{tr(L3("Rub left, then right, then left – never the same way twice.", "Treba šúchať doľava, doprava, doľava – nikdy dvakrát rovnako."), lang)}</p>
      <div className="hf-silver" aria-hidden="true">
        <div className="hf-silver-piece" style={{ filter: `brightness(${0.55 + k * 0.7}) saturate(${0.4 + k})` }}><Icon name="silver" scale={6} /></div>
        {k > 0.9 && <span className="hf-glint" />}
      </div>
      <p className="hf-p hf-center" aria-live="polite">{piece < 3 ? `${tr(PIECES[piece], lang)} – ${Math.round(k * 100)} %` : tr(L3("All shining!", "Všetko sa leskne!"), lang)}{msg ? ` · ${tr(msg, lang)}` : ""}</p>
      <div className="hf-meter"><span style={{ width: `${k * 100}%` }} /></div>
      <div className="hf-row hf-center">
        <button type="button" className="hf-btn" onClick={() => rub("l")}>◀ <kbd>←</kbd></button>
        <button type="button" className="hf-btn" onClick={() => rub("r")}><kbd>→</kbd> ▶</button>
      </div>
    </Frame>
  );
}

// ------------------------------------------------------------------ the torn letter
export function Letter({ lang, onWin, onCancel }: P) {
  const [order, setOrder] = useState<number[]>(LETTER_START);
  const [cur, setCur] = useState(0);
  const [held, setHeld] = useState(false);
  const [done, setDone] = useState(false);
  const check = (o: number[]) => { if (o.every((v, i) => v === i)) { setDone(true); sfx.find(); setTimeout(onWin, 1100); } };
  const move = (d: number) => {
    const to = cur + d; if (to < 0 || to >= order.length) return;
    if (held) { const o = [...order]; [o[cur], o[to]] = [o[to], o[cur]]; setOrder(o); setCur(to); sfx.blip(); check(o); }
    else setCur(to);
  };
  useKeys((e) => {
    if (done) return;
    if (e.key === "Escape") return onCancel();
    if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); move(-1); }
    if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); move(1); }
    if (e.key === "Enter" || e.key === " " || e.key === "e" || e.key === "E") { e.preventDefault(); setHeld((h) => !h); sfx.select(); }
  });
  const click = (i: number) => {
    if (done) return;
    if (held && i !== cur) { const o = [...order]; [o[cur], o[i]] = [o[i], o[cur]]; setOrder(o); setHeld(false); setCur(i); sfx.blip(); check(o); }
    else { setCur(i); setHeld(!held || i !== cur); sfx.select(); }
  };
  return (
    <Frame title={tr(L3("The torn letter", "Roztrhaný list"), lang)} onCancel={onCancel} lang={lang}>
      <p className="hf-p">{tr(L3("Put the strips back in order. Pick one up, move it, put it down.", "Poskladaj pásiky do správneho poradia. Zdvihni jeden, presuň ho, polož."), lang)}</p>
      <ol className={`hf-letter${done ? " is-done" : ""}`} aria-label={tr(L3("Strips of the letter", "Pásiky listu"), lang)}>
        {order.map((p, i) => (
          <li key={p}>
            <button type="button" className={`hf-strip${i === cur ? " is-cur" : ""}${i === cur && held ? " is-held" : ""}`} onClick={() => click(i)}
              aria-pressed={i === cur && held} style={{ transform: `rotate(${((p * 37) % 5 - 2) * 0.5}deg)` }}>
              {tr(LETTER_PIECES[p], lang)}
            </button>
          </li>
        ))}
      </ol>
      <p className="hf-small hf-center"><kbd>↑</kbd><kbd>↓</kbd> {tr(L3("choose", "vyber"), lang)} · <kbd>Enter</kbd> {tr(L3("pick up / put down", "zdvihni / polož"), lang)}</p>
    </Frame>
  );
}

// ------------------------------------------------------------------ Mrs Serle's Tuesday
export function Timeline({ lang, onWin, onCancel }: P) {
  const [pick, setPick] = useState<number[]>([-1, -1, -1, -1]);
  const [phase, setPhase] = useState<"table" | "final">("table");
  const [msg, setMsg] = useState<string | null>(null);
  useKeys((e) => { if (e.key === "Escape") onCancel(); });
  const set = (r: number, v: number) => { const p = [...pick]; p[r] = v; setPick(p); sfx.blip(); setMsg(null); };
  const check = () => {
    if (pick.every((v, i) => v === TIMELINE.answer[i])) { sfx.select(); setPhase("final"); setMsg(null); }
    else { sfx.wrong(); setMsg(tr(TIMELINE.wrong, lang)); }
  };
  return (
    <Frame title={tr(L3("Mrs Serle remembers Tuesday", "Pani Serleová si spomína na utorok"), lang)} onCancel={onCancel} lang={lang} wide>
      <blockquote className="hf-quote">{tr(SERLE_TALE, lang)}</blockquote>
      {phase === "table" ? (
        <>
          <p className="hf-p"><b>{tr(TIMELINE.question, lang)}</b></p>
          <div className="hf-table" role="group">
            {TIMELINE.people.map((who, r) => (
              <label key={r} className="hf-trow">
                <span>{tr(who, lang)}</span>
                <select value={pick[r]} onChange={(e) => set(r, Number(e.target.value))}>
                  <option value={-1}>…</option>
                  {TIMELINE.places.map((pl, i) => <option key={i} value={i}>{tr(pl, lang)}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="hf-row hf-center"><button type="button" className="hf-btn is-primary" onClick={check}>{tr(UI.check, lang)}</button></div>
        </>
      ) : (
        <>
          <p className="hf-p"><b>{tr(TIMELINE.final, lang)}</b></p>
          <div className="hf-row hf-center">
            {TIMELINE.finalOptions.map((o, i) => (
              <button key={i} type="button" className="hf-btn" onClick={() => { if (i === TIMELINE.finalAnswer) { sfx.find(); onWin(); } else { sfx.wrong(); setMsg(tr(TIMELINE.wrongFinal, lang)); } }}>{tr(o, lang)}</button>
            ))}
          </div>
        </>
      )}
      {msg && <p className="hf-p hf-warn" role="status">{msg}</p>}
    </Frame>
  );
}

// ------------------------------------------------------------------ persuading Mr Woodhouse
export function Tact({ lang, state, onWin, onCancel }: P) {
  const bonus = (state.flags.shawl ? 1 : 0) + (state.flags.window ? 1 : 0) + (state.skills.music > 0 ? 1 : 0);
  const rounds = useMemo(() => [bonus >= 1 ? null : TACT[0], TACT[1], bonus >= 2 ? null : TACT[2]].filter(Boolean) as typeof TACT, [bonus]);
  const [r, setR] = useState(0);
  const [reply, setReply] = useState<{ t: Txt; good: boolean } | null>(null);
  const [sel, setSel] = useState(0);
  const cur = rounds[r];
  const choose = (i: number) => {
    const o = cur.options[i]; setReply({ t: o.r, good: o.good });
    if (o.good) sfx.select(); else sfx.wrong();
  };
  const next = () => {
    if (!reply) return;
    if (reply.good) { if (r + 1 >= rounds.length) onWin(); else { setR(r + 1); setSel(0); } }
    setReply(null);
  };
  useKeys((e) => {
    if (e.key === "Escape") return onCancel();
    if (reply) { if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); next(); } return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s + 2) % 3); }
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % 3); }
    if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); choose(sel); }
  });
  return (
    <Frame title={tr(L3("A word with Mr Woodhouse", "Slovo s pánom Woodhouseom"), lang)} onCancel={onCancel} lang={lang} wide>
      <p className="hf-small">{tr(L3("Speak of his health, never of adventure.", "Hovor o jeho zdraví, nikdy o dobrodružstve."), lang)} {bonus > 0 && tr(L3("He is in a kindly mood – your small kindnesses have helped.", "Je dobre naladený – tvoje drobné láskavosti pomohli."), lang)}</p>
      <div className="hf-speech"><b>{tr({ en: "Mr Woodhouse", sk: "Pán Woodhouse" }, lang)}</b> {reply ? tr(reply.t, lang) : tr(cur.papa, lang)}</div>
      {reply ? (
        <div className="hf-row hf-center"><button type="button" className="hf-btn is-primary" onClick={next}>{tr(UI.next, lang)} ▼</button></div>
      ) : (
        <ul className="hf-choices">
          {cur.options.map((o, i) => (
            <li key={i}><button type="button" className={`hf-choice${i === sel ? " is-cur" : ""}`} onMouseEnter={() => setSel(i)} onClick={() => choose(i)}>{tr(o.t, lang)}</button></li>
          ))}
        </ul>
      )}
      <p className="hf-small hf-center">{r + 1} / {rounds.length}</p>
    </Frame>
  );
}

// ------------------------------------------------------------------ making the gruel
export function Gruel({ lang, onWin, onCancel }: P) {
  const [pick, setPick] = useState<number[]>([-1, -1, -1, -1]);
  const [msg, setMsg] = useState<string | null>(null);
  useKeys((e) => { if (e.key === "Escape") onCancel(); });
  const taste = () => {
    if (pick.some((v) => v < 0)) { setMsg(tr(L3("Choose something for every part first.", "Najprv vyber všetky časti."), lang)); return; }
    const bad = GRUEL.parts.findIndex((p, i) => pick[i] !== p.good);
    if (bad < 0) { sfx.find(); onWin(); return; }
    sfx.wrong(); const b = GRUEL.parts[bad].bad[pick[bad]]; setMsg(b ? tr(b, lang) : "…");
  };
  return (
    <Frame title={tr(L3("Thin, but not too thin", "Riedka, ale nie príliš"), lang)} onCancel={onCancel} lang={lang} wide>
      <p className="hf-p"><i>{tr(GRUEL.rule, lang)}</i></p>
      {GRUEL.parts.map((p, i) => (
        <fieldset key={i} className="hf-field">
          <legend>{tr(p.name, lang)}</legend>
          {p.options.map((o, j) => (
            <button key={j} type="button" className={`hf-chip${pick[i] === j ? " is-on" : ""}`} aria-pressed={pick[i] === j} onClick={() => { const q = [...pick]; q[i] = j; setPick(q); setMsg(null); sfx.blip(); }}>{tr(o, lang)}</button>
          ))}
        </fieldset>
      ))}
      <div className="hf-row hf-center"><button type="button" className="hf-btn is-primary" onClick={taste}>{tr(GRUEL.taste, lang)}</button></div>
      {msg && <p className="hf-p hf-warn" role="status"><b>{tr({ en: "Mrs Serle:", sk: "Pani Serleová:" }, lang)}</b> {msg}</p>}
    </Frame>
  );
}

// ------------------------------------------------------------------ needlework (repeatable accomplishment)
export function Needle({ lang, state, onWin, onCancel }: P) {
  const lvl = Math.min(2, state.skills.needle);
  const { size, pattern } = NEEDLE[lvl];
  const [grid, setGrid] = useState<string[]>(() => Array(size * size).fill("."));
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState(false);
  const cycle = (i: number) => {
    if (done) return;
    const g = [...grid]; g[i] = g[i] === "." ? "r" : g[i] === "r" ? "g" : "."; setGrid(g); sfx.stitch();
    if (g.every((v, k) => v === pattern[Math.floor(k / size)][k % size])) { setDone(true); sfx.find(); setTimeout(onWin, 800); }
  };
  useKeys((e) => {
    if (e.key === "Escape") return onCancel();
    const m: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -size, ArrowDown: size };
    if (m[e.key] !== undefined) { e.preventDefault(); const n = cur + m[e.key]; if (n >= 0 && n < size * size && !(Math.abs(m[e.key]) === 1 && Math.floor(n / size) !== Math.floor(cur / size))) setCur(n); }
    if (["Enter", " ", "e", "E"].includes(e.key)) { e.preventDefault(); cycle(cur); }
  });
  const cell = (v: string) => (v === "r" ? "is-r" : v === "g" ? "is-g" : "");
  return (
    <Frame title={tr(L3("Needlework", "Vyšívanie"), lang)} onCancel={onCancel} lang={lang}>
      <p className="hf-p">{tr(L3("Copy Emma's pattern. Each stitch: empty, rose, leaf.", "Odvyšívaj Emmin vzor. Každý steh: prázdny, ruža, lístok."), lang)}</p>
      <div className="hf-row hf-center hf-gap">
        <div className="hf-grid is-target" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} aria-label={tr(L3("Emma's pattern", "Emmin vzor"), lang)}>
          {pattern.join("").split("").map((v, i) => <span key={i} className={`hf-cell ${cell(v)}`} />)}
        </div>
        <div className={`hf-grid${done ? " is-done" : ""}`} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }} role="grid">
          {grid.map((v, i) => <button key={i} type="button" className={`hf-cell ${cell(v)}${i === cur ? " is-cur" : ""}`} onClick={() => { setCur(i); cycle(i); }} aria-label={`${Math.floor(i / size) + 1}, ${(i % size) + 1}`} />)}
        </div>
      </div>
      <p className="hf-small hf-center">{tr(L3("Level", "Úroveň"), lang)} {lvl + 1} · <kbd>←↑→↓</kbd> <kbd>Enter</kbd></p>
    </Frame>
  );
}

// ------------------------------------------------------------------ the pianoforte (repeatable accomplishment)
const KEYNAMES = ["C", "D", "E", "F", "G"];
export function Piano({ lang, state, onWin, onCancel }: P) {
  const air = AIRS[Math.min(2, state.skills.music)];
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState(false);
  const play = (deg: number) => {
    if (i >= air.notes.length) return;
    sfx.note(deg);
    if (deg === air.notes[i]) { setMiss(false); const n = i + 1; setI(n); if (n >= air.notes.length) setTimeout(() => { sfx.win(); onWin(); }, 700); }
    else setMiss(true);
  };
  useKeys((e) => {
    if (e.key === "Escape") return onCancel();
    const n = "12345".indexOf(e.key); if (n >= 0) { e.preventDefault(); play(n + 1); }
    const m = "asdfg".indexOf(e.key.toLowerCase()); if (m >= 0) { e.preventDefault(); play(m + 1); }
  });
  return (
    <Frame title={tr(air.name, lang)} onCancel={onCancel} lang={lang}>
      <p className="hf-p">{tr(L3("Play the air note by note. Keys 1–5 (or A S D F G).", "Zahraj pieseň tón po tóne. Klávesy 1–5 (alebo A S D F G)."), lang)}</p>
      <div className="hf-staff" aria-label={air.notes.map((n) => KEYNAMES[n - 1]).join(" ")}>
        {air.notes.map((n, k) => <span key={k} className={`hf-note${k < i ? " is-done" : ""}${k === i ? " is-cur" : ""}`} style={{ bottom: `${(n - 1) * 14 + 6}%` }}>♪</span>)}
      </div>
      <p className="hf-p hf-center" aria-live="polite">{i < air.notes.length ? `${tr(L3("Next note:", "Ďalší tón:"), lang)} ${KEYNAMES[air.notes[i] - 1]}` : "♫"}{miss ? ` · ${tr(L3("Not quite – try again.", "Nie celkom – skús znova."), lang)}` : ""}</p>
      <div className="hf-keys">
        {KEYNAMES.map((k, n) => <button key={k} type="button" className="hf-key" onClick={() => play(n + 1)}><span>{k}</span><kbd>{n + 1}</kbd></button>)}
      </div>
    </Frame>
  );
}

export function PuzzleView({ id, ...p }: P & { id: PuzzleId }) {
  switch (id) {
    case "silver": return <Silver {...p} />;
    case "letter": return <Letter {...p} />;
    case "timeline": return <Timeline {...p} />;
    case "tact": return <Tact {...p} />;
    case "gruel": return <Gruel {...p} />;
    case "needle": return <Needle {...p} />;
    case "piano": return <Piano {...p} />;
  }
}
