"use client";

import type { Scenario } from "@/content/games/emma/types";
import { useT } from "./i18n";
import type { GameState } from "./state";


/**
 * The ball, the last evening: Emma announces the engagements one by one, and the room answers.
 * Right ones reveal their whole story; wrong ones are a public embarrassment, and are undone.
 */
export function Finale({ sc, s, calm, onNext, onEnd }: { sc: Scenario; s: GameState; calm: boolean; onNext: () => void; onEnd: () => void }) {
  const T = useT();
  const f = s.finale!;
  const lady = f.order[f.step];
  const done = f.step >= f.order.length;
  const person = (id: string) => sc.people.find((p) => p.id === id)!;
  const chainOf = (w: string) => Object.entries(sc.pairs).find(([, p]) => p.woman === w)?.[0];
  // names start with a capital at the start of a sentence, and with a small "slečna"/"pán" inside one (Slovak)
  const fill = (t: string, w: string, m: string) =>
    t.replace(/\{(lady|man)\}/g, (_, k: string, at: number) => {
      const n = person(k === "lady" ? w : m).short;
      return at === 0 || /[.!?„“]\s*$/.test(t.slice(0, at)) ? n : T.mid(n);
    });
  const rightCount = f.order.filter((w) => f.right[w]).length;

  if (done) {
    const all = rightCount === f.order.length;
    return (
      <section className="em-finale" aria-labelledby="em-finale-title">
        <img className="em-finale-room" src="/emma/ball.png" alt="" width={192} height={168} />
        <div className="em-finale-card">
          <p className="em-kicker">{T.finale.late}</p>
          <h2 id="em-finale-title" className="em-h2" tabIndex={-1}>
            {all ? T.finale.all : T.finale.some(rightCount, f.order.length)}
          </h2>
          <div className="em-say">
            <img src="/emma/bust-emma.png" alt="" width={96} height={96} className="em-say-bust" />
            <p>
              {all ? T.finale.allLine : rightCount === 0 ? T.finale.noneLine : T.finale.someLine}
            </p>
          </div>
          <div className="em-row">
            <button type="button" className="em-btn" onClick={onEnd}>
              {all ? T.finale.yearLater : T.finale.home}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const man = s.matches[lady];
  const right = f.right[lady];
  const ch = chainOf(lady);
  const line = fill((right ? T.finale.cheers : T.finale.gasps)[f.step % 4], lady, man);
  return (
    <section className="em-finale" aria-labelledby="em-finale-title">
      <img className="em-finale-room" src="/emma/ball.png" alt="" width={192} height={168} />
      <div className={`em-finale-card${right ? " is-right" : " is-wrong"}${calm ? "" : " is-animated"}`} key={lady}>
        <p className="em-kicker">
          {T.finale.step(f.step + 1, f.order.length)}
        </p>
        <h2 id="em-finale-title" className="em-h2" tabIndex={-1}>
          {T.finale.call(person(lady).name, person(man).name)}
        </h2>
        <div className="em-finale-pair" aria-hidden="true">
          <img src={`/emma/bust-${lady}.png`} alt="" width={96} height={96} />
          <span className="em-finale-heart">{right ? "♥" : "✕"}</span>
          <img src={`/emma/bust-${man}.png`} alt="" width={96} height={96} />
        </div>
        <p className="em-finale-line" role="status">
          {line}
        </p>
        {right && ch && sc.chains?.[ch] && (
          <div className="em-finale-story">
            <p className="em-finale-title">{sc.chains[ch].title}</p>
            <p>{sc.chains[ch].reveal}</p>
            <p className="em-muted em-small">{T.finale.after(sc.chains[ch].plot)}</p>
          </div>
        )}
        {!right && <p className="em-muted">{T.finale.off(person(lady).short)}</p>}
        <div className="em-row">
          <button type="button" className="em-btn" onClick={onNext}>
            {f.step + 1 < f.order.length ? T.finale.next : T.finale.andSo}
          </button>
        </div>
      </div>
    </section>
  );
}
