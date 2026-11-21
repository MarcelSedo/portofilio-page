"use client";

import type { Scenario } from "@/content/games/emma/types";
import type { GameState } from "./state";

const CHEERS = [
  "The room bursts into applause. {lady} turns quite pink, and takes {man}'s arm as if she had been waiting all her life to do it.",
  "A delighted murmur runs round the room. {man} bows; {lady} laughs out loud, which nobody has heard her do all spring.",
  "Lady Pemberton drops her fan. Then she claps. Then everyone claps. {lady} and {man} do not notice: they are looking at each other.",
  "Mr Fiddle strikes up a waltz without being asked. {man} offers {lady} his hand, and she takes it.",
];
const GASPS = [
  "A dreadful silence. {lady} goes quite white. {man} studies his boots with great attention.",
  "Somebody drops a glass. {lady} says, very clearly, “I beg your pardon?” {man} looks for the door.",
  "Mrs Nettle gasps loud enough for three. {lady} and {man} look at each other, and then, firmly, away.",
  "Lady Pemberton raises her lorgnette. “Well,” she says. Only “well”. It is the worst thing anyone has ever said.",
];

/**
 * The ball, the last evening: Emma announces the engagements one by one, and the room answers.
 * Right ones reveal their whole story; wrong ones are a public embarrassment, and are undone.
 */
export function Finale({ sc, s, calm, onNext, onEnd }: { sc: Scenario; s: GameState; calm: boolean; onNext: () => void; onEnd: () => void }) {
  const f = s.finale!;
  const lady = f.order[f.step];
  const done = f.step >= f.order.length;
  const person = (id: string) => sc.people.find((p) => p.id === id)!;
  const chainOf = (w: string) => Object.entries(sc.pairs).find(([, p]) => p.woman === w)?.[0];
  const fill = (t: string, w: string, m: string) => t.replaceAll("{lady}", person(w).short).replaceAll("{man}", person(m).short);
  const rightCount = f.order.filter((w) => f.right[w]).length;

  if (done) {
    const all = rightCount === f.order.length;
    return (
      <section className="em-finale" aria-labelledby="em-finale-title">
        <img className="em-finale-room" src="/emma/ball.png" alt="" width={192} height={168} />
        <div className="em-finale-card">
          <p className="em-kicker">The Assembly Rooms, late</p>
          <h2 id="em-finale-title" className="em-h2" tabIndex={-1}>
            {all ? "Every one of them!" : `${rightCount} of ${f.order.length}`}
          </h2>
          <div className="em-say">
            <img src="/emma/bust-emma.png" alt="" width={96} height={96} className="em-say-bust" />
            <p>
              {all
                ? "I told you I was never wrong. Well: we were never wrong. Let us go home before Papa worries."
                : rightCount === 0
                  ? "Oh dear. Oh dear, oh dear. We shall go home to Hartfield, and never speak of this evening again, and then we shall look again."
                  : "Some of them, at least, will end happily. As for the others: we shall go home to Hartfield, listen a little more, and say nothing to anybody."}
            </p>
          </div>
          <div className="em-row">
            <button type="button" className="em-btn" onClick={onEnd}>
              {all ? "A year later… ▶" : "Back to Hartfield"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  const man = s.matches[lady];
  const right = f.right[lady];
  const ch = chainOf(lady);
  const line = fill((right ? CHEERS : GASPS)[f.step % 4], lady, man);
  return (
    <section className="em-finale" aria-labelledby="em-finale-title">
      <img className="em-finale-room" src="/emma/ball.png" alt="" width={192} height={168} />
      <div className={`em-finale-card${right ? " is-right" : " is-wrong"}${calm ? "" : " is-animated"}`} key={lady}>
        <p className="em-kicker">
          The announcement · {f.step + 1} of {f.order.length}
        </p>
        <h2 id="em-finale-title" className="em-h2" tabIndex={-1}>
          “Ladies and gentlemen: {person(lady).name}, and {person(man).name}!”
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
            <p className="em-muted em-small">After {sc.chains[ch].plot}</p>
          </div>
        )}
        {!right && <p className="em-muted">This engagement is off. You will have to think again about {person(lady).short}.</p>}
        <div className="em-row">
          <button type="button" className="em-btn" onClick={onNext}>
            {f.step + 1 < f.order.length ? "The next couple ▶" : "And so…"}
          </button>
        </div>
      </div>
    </section>
  );
}
