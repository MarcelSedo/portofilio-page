"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CARDS, NAMES, PEOPLE, relations, type Card, type Lang, type State, type Txt } from "../data/story";
import { UI } from "../data/ui";
import { sfx } from "../engine/sound";
import { Icon, Portrait } from "./bits";

type Tab = "item" | "letter" | "word" | "people" | "map";
const TABS: Tab[] = ["item", "letter", "word", "people", "map"];
export type Pick = { claim: Txt; onPick: (id: string) => void };
const tr = (t: Txt, l: Lang) => t[l];
export const q = (s: string, l: Lang) => (l === "sk" ? `„${s}“` : `“${s}”`);

const POS: Record<string, [number, number]> = { bessie: [30, 46], tom: [76, 30], patrick: [74, 74], will: [26, 82], nan: [6, 64], barnes: [52, 14] };

export function Casebook({ lang, state, pick, onClose, startTab }: { lang: Lang; state: State; pick?: Pick; onClose: () => void; startTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(startTab ?? (pick ? "word" : "item"));
  const [sel, setSel] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const cards: Card[] = useMemo(() => state.cards.map((c) => CARDS[c]).filter((c) => c && c.kind === tab), [state.cards, tab]);
  const people = PEOPLE;
  const listLen = tab === "people" ? people.length : tab === "map" ? 0 : cards.length;
  const cycle = (d: number) => { const i = (TABS.indexOf(tab) + d + TABS.length) % TABS.length; setTab(TABS[i]); setSel(0); sfx.blip(); };
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape" || ((e.key === "b" || e.key === "B") && !pick)) { e.preventDefault(); onClose(); return; }
      if (e.key === "Tab") { e.preventDefault(); cycle(e.shiftKey ? -1 : 1); return; }
      if (e.key === "q" || e.key === "Q") { cycle(-1); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); cycle(-1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); cycle(1); return; }
      if (e.key === "ArrowUp" || e.key === "w") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); sfx.blip(); }
      if (e.key === "ArrowDown" || e.key === "s") { e.preventDefault(); setSel((s) => Math.min(Math.max(0, listLen - 1), s + 1)); sfx.blip(); }
      if (pick && (e.key === "Enter" || e.key === "e" || e.key === "E" || e.key === " ") && (tab === "item" || tab === "letter" || tab === "word") && cards[sel]) { e.preventDefault(); pick.onPick(cards[sel].id); }
    };
    window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f);
  });

  const detail = () => {
    if (tab === "people") {
      const p = people[sel]; if (!p) return null;
      const met = state.met.includes(p.id);
      return (
        <div className="hf-detail">
          <div className="hf-detail-head"><Portrait id={p.id} scale={2} unknown={!met} />
            <div><h3 className="hf-h3">{met ? tr(NAMES[p.id], lang) : "???"}</h3><p className="hf-sub">{met ? tr(p.role, lang) : tr(UI.unmet, lang)}</p></div></div>
          {met && <p className="hf-p">{tr(p.note, lang)}</p>}
          {met && <ul className="hf-facts">{p.facts.map((f, i) => { const ok = f.on(state); return <li key={i} className={ok ? "is-on" : ""}><span aria-hidden="true">{ok ? "✓" : "·"}</span> {ok ? tr(f.t, lang) : "…"}</li>; })}</ul>}
        </div>
      );
    }
    const c = cards[sel];
    if (!c) return <p className="hf-p hf-muted">{tr(UI.empty, lang)}</p>;
    return (
      <div className="hf-detail">
        <div className="hf-detail-head">
          {c.kind === "word" && c.who ? <Portrait id={c.who} scale={2} /> : <span className="hf-iconbox"><Icon name={c.icon || "note"} scale={4} /></span>}
          <div><h3 className="hf-h3">{tr(c.title, lang)}</h3><p className="hf-sub">{tr(UI.where, lang)}: {tr(c.where, lang)}</p></div>
        </div>
        <p className={`hf-p${c.kind === "letter" ? " hf-letterpaper" : ""}`}>{tr(c.text, lang).split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</p>
        {pick && <button type="button" className="hf-btn is-primary" onClick={() => pick.onPick(c.id)}>{tr(UI.present, lang)} <kbd>E</kbd></button>}
      </div>
    );
  };

  const rel = relations(state);
  return (
    <div className="hf-modal" role="dialog" aria-modal="true" aria-label="Casebook">
      <div ref={ref} tabIndex={-1} className="hf-book">
        <div className="hf-tabs" role="tablist">
          {TABS.map((t) => {
            const n = t === "people" || t === "map" ? 0 : state.newCards.filter((c) => CARDS[c]?.kind === t).length;
            return <button key={t} role="tab" aria-selected={tab === t} type="button" className={`hf-tab is-${t}${tab === t ? " is-on" : ""}`} onClick={() => { setTab(t); setSel(0); sfx.blip(); }}>
              {tr(UI.tabs[t], lang)}{n > 0 && <span className="hf-dot" aria-label="new">{n}</span>}</button>;
          })}
        </div>
        {pick && <div className="hf-claim"><Portrait id="emma" scale={1} /><div><b>{tr(UI.emmaThinks, lang)}</b> {q(tr(pick.claim, lang), lang)} <span className="hf-muted">— {tr(UI.chooseProof, lang)}</span></div></div>}
        {tab === "map" ? (
          <div className="hf-pages is-map">
            <h2 className="hf-script">{tr(UI.tabSub.map, lang)}</h2>
            <div className="hf-map">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {rel.edges.map((e, i) => { const a = POS[e.a], b = POS[e.b]; if (!a || !b) return null;
                  return <line key={i} x1={a[0] + 4} y1={a[1] + 6} x2={b[0] + 4} y2={b[1] + 6} className={`hf-edge is-${e.kind}`} />; })}
              </svg>
              {rel.edges.map((e, i) => { const a = POS[e.a], b = POS[e.b]; if (!a || !b) return null;
                const sym = e.kind === "love" ? "♥" : e.kind === "guess" ? "?" : e.kind === "out" ? "✕" : "";
                return sym ? <span key={i} className={`hf-edge-mark is-${e.kind}`} style={{ left: `${(a[0] + b[0]) / 2 + 4}%`, top: `${(a[1] + b[1]) / 2 + 6}%` }}>{sym}</span> : null; })}
              {rel.nodes.map((n) => { const p = POS[n]; if (!p) return null;
                return <div key={n} className="hf-node" style={{ left: `${p[0]}%`, top: `${p[1]}%` }}>
                  {n === "nan" ? <span className="hf-portrait-unknown" style={{ width: 40, height: 44 }}>?</span> : <Portrait id={n} scale={1} />}
                  <span className="hf-node-name">{n === "nan" ? "Nan" : tr(NAMES[n as keyof typeof NAMES], lang)}</span></div>; })}
              {rel.emmaSays && <div className="hf-emma-bubble"><Portrait id="emma" scale={1} /> <span>{q(tr(rel.emmaSays, lang), lang)}</span></div>}
            </div>
            <p className="hf-legend"><span className="is-love">♥ {lang === "en" ? "in love" : "zaľúbení"}</span> <span className="is-guess">? {lang === "en" ? "suspected" : "podozrenie"}</span> <span className="is-out">✕ {lang === "en" ? "ruled out" : "vylúčené"}</span> <span className="is-work">– {lang === "en" ? "work together" : "pracujú spolu"}</span></p>
          </div>
        ) : (
          <div className="hf-pages">
            <div className="hf-page">
              <h2 className="hf-script">{tr(UI.tabs[tab], lang)} <small>{tr(UI.tabSub[tab], lang)}</small></h2>
              {tab === "people" ? (
                <ul className="hf-people">{people.map((p, i) => { const met = state.met.includes(p.id);
                  return <li key={p.id}><button type="button" className={`hf-person${i === sel ? " is-cur" : ""}`} onClick={() => setSel(i)}><Portrait id={p.id} scale={1} unknown={!met} /><span>{met ? tr(NAMES[p.id], lang) : "???"}</span></button></li>; })}</ul>
              ) : cards.length ? (
                <ul className="hf-list">{cards.map((c, i) => (
                  <li key={c.id}><button type="button" className={`hf-entry${i === sel ? " is-cur" : ""}`} onClick={() => setSel(i)}>
                    {c.kind === "word" && c.who ? <Portrait id={c.who} scale={1} /> : <span className="hf-slot"><Icon name={c.icon || "note"} scale={2} /></span>}
                    <span>{tr(c.title, lang)}{state.newCards.includes(c.id) && <span className="hf-new">{lang === "en" ? "new" : "nové"}</span>}</span></button></li>))}</ul>
              ) : <p className="hf-p hf-muted">{tr(UI.empty, lang)}</p>}
            </div>
            <div className="hf-page">{detail()}</div>
          </div>
        )}
        <p className="hf-keyhint"><kbd>Tab</kbd> {lang === "en" ? "section" : "sekcia"} · <kbd>↑↓</kbd> {lang === "en" ? "select" : "výber"} · {pick ? <><kbd>E</kbd> {tr(UI.present, lang)} · </> : null}<kbd>Esc</kbd> {lang === "en" ? "close" : "zavrieť"}</p>
        <button type="button" className="hf-close" onClick={onClose} aria-label={lang === "en" ? "Close" : "Zavrieť"}>×</button>
      </div>
    </div>
  );
}
