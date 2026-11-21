"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLASSIC_FAME, KINDS, cards, sourceUrl, type CultureCard, type Kind } from "@/content/games/britain";
import { Poster } from "./Poster";

/**
 * Time Traveller: put British books, paintings, music, plays and films on a timeline, oldest on the left.
 *
 * Play it with a mouse (drag a card onto a gap), touch or keyboard (pick a card, then pick a gap).
 * - Drag and drop is only a shortcut: every move can be done with simple clicks (WCAG 2.5.7).
 * - Timed mode has a free pause, and there is a relaxed mode with no clock at all (WCAG 2.2.1).
 * - Every result is announced in a live region, so screen-reader users hear what happened.
 */

const ROUND_SECONDS = 100;
const HAND_SIZE = 3;
const POINTS = 10;
const BEST_KEY = "time-traveller-britain-best";

type Card = CultureCard;
type DeckKind = "mixed" | Kind;
const KIND_ORDER: Kind[] = ["book", "art", "music", "stage", "film"];
const DECKS: Record<DeckKind, { label: string; cards: Card[] }> = {
  mixed: { label: "Everything", cards },
  ...(Object.fromEntries(
    KIND_ORDER.map((k) => [k, { label: KINDS[k].plural, cards: cards.filter((c) => c.kind === k) }]),
  ) as Record<Kind, { label: string; cards: Card[] }>),
};
const deckCards = (k: DeckKind, classicsOnly: boolean) =>
  classicsOnly ? DECKS[k].cards.filter((c) => c.fame >= CLASSIC_FAME) : DECKS[k].cards;
const span = (list: Card[]) => {
  const years = list.map((c) => c.year);
  return `${Math.min(...years)}–${Math.max(...years)}`;
};

type Mode = "timed" | "relaxed";
type Phase = "intro" | "playing" | "paused" | "over";
type Feedback = { ok: boolean; card: Card; text: string } | null;

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Is `year` allowed in the gap before timeline[index]? Equal years fit on either side. */
export function fits(timeline: Card[], index: number, year: number) {
  const before = timeline[index - 1];
  const after = timeline[index];
  return (!before || before.year <= year) && (!after || year <= after.year);
}

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

const gapLabel = (timeline: Card[], i: number) => {
  const before = timeline[i - 1];
  const after = timeline[i];
  if (!before) return `Before ${after.title} (${after.year})`;
  if (!after) return `After ${before.title} (${before.year})`;
  return `Between ${before.title} (${before.year}) and ${after.title} (${after.year})`;
};

export function TimeTraveller() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [mode, setMode] = useState<Mode>("timed");
  const [deckKind, setDeckKind] = useState<DeckKind>("mixed");
  const [classicsOnly, setClassicsOnly] = useState(true);
  const [deck, setDeck] = useState<Card[]>([]);
  const [timeline, setTimeline] = useState<Card[]>([]);
  const [hand, setHand] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [time, setTime] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [best, setBest] = useState(0);
  const [announce, setAnnounce] = useState("");

  const firstGapRef = useRef<HTMLButtonElement>(null);
  const handRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => setBest(readBest()), []);

  const start = (m: Mode) => {
    const d = shuffle(deckCards(deckKind, classicsOnly));
    setMode(m);
    setTimeline([d[0]]);
    setHand(d.slice(1, 1 + HAND_SIZE));
    setDeck(d.slice(1 + HAND_SIZE));
    setScore(0);
    setRight(0);
    setWrong(0);
    setTime(ROUND_SECONDS);
    setSelected(null);
    setFeedback(null);
    setPhase("playing");
    setAnnounce(
      `Game started. ${d[0].title} from ${d[0].year} is on the timeline. Pick a card from your hand, then pick where it goes.`,
    );
  };

  const finish = useCallback(() => {
    setPhase("over");
    setSelected(null);
    setScore((s) => {
      if (s > readBest()) {
        try {
          localStorage.setItem(BEST_KEY, String(s));
        } catch {
          /* private mode: no best score, no problem */
        }
        setBest(s);
      }
      return s;
    });
  }, []);

  // the clock
  useEffect(() => {
    if (phase !== "playing" || mode !== "timed") return;
    const t = window.setInterval(() => setTime((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase, mode]);
  useEffect(() => {
    if (phase === "playing" && mode === "timed" && time <= 0) finish();
    if (phase === "playing" && mode === "timed" && (time === 30 || time === 10)) setAnnounce(`${time} seconds left.`);
  }, [time, phase, mode, finish]);

  useEffect(() => {
    if (phase === "over") headingRef.current?.focus();
  }, [phase]);

  const place = (cardId: string, index: number) => {
    const card = hand.find((c) => c.id === cardId);
    if (!card || phase !== "playing") return;
    const ok = fits(timeline, index, card.year);
    const nextHand = hand.filter((c) => c.id !== cardId);
    const [drawn, ...rest] = deck;
    if (drawn) nextHand.push(drawn);
    setHand(nextHand);
    setDeck(rest);
    setSelected(null);

    if (ok) {
      const t = [...timeline];
      t.splice(index, 0, card);
      setTimeline(t);
      setScore((s) => s + POINTS);
      setRight((r) => r + 1);
      const text = `Well placed! ${card.title} ${KINDS[card.kind].verb} ${card.year}.`;
      setFeedback({ ok: true, card, text });
      setAnnounce(`${text} Plus ${POINTS} points.`);
    } else {
      setScore((s) => s - POINTS);
      setWrong((w) => w + 1);
      const text = `Not quite. ${card.title} ${KINDS[card.kind].verb} ${card.year}.`;
      setFeedback({ ok: false, card, text });
      setAnnounce(`${text} Minus ${POINTS} points. The card is gone.`);
    }
    if (nextHand.length === 0) finish();
    // back to the hand for the next move
    requestAnimationFrame(() => handRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
  };

  const pick = (id: string) => {
    if (selected === id) {
      setSelected(null);
      setAnnounce("Card put back.");
      return;
    }
    setSelected(id);
    const c = hand.find((h) => h.id === id);
    setAnnounce(`${c?.title} picked. Choose a place on the timeline.`);
    requestAnimationFrame(() => firstGapRef.current?.focus());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && selected) {
      setSelected(null);
      setAnnounce("Card put back.");
      handRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  };

  const active = selected ?? dragging;
  const selectedCard = hand.find((c) => c.id === active);

  // ---------- screens ----------
  if (phase === "intro") {
    return (
      <section className="tt tt-intro pixel-frame" aria-labelledby="tt-title">
        <p className="tt-kicker">A small game</p>
        <h1 id="tt-title" className="tt-h1">
          Time Traveller
        </h1>
        <p className="tt-guide">
          <span className="tt-guide-name">The Archivist:</span> Hello, time traveller. Welcome to the British collection:
          six centuries of books, paintings, music, plays and films. Put each one on the timeline, oldest on the left.
          Every right answer is worth {POINTS} points, every wrong one costs {POINTS}.
        </p>
        <ul className="tt-howto">
          <li>Drag a card onto a gap in the timeline,</li>
          <li>or tap a card and then tap the gap. With a keyboard: Tab, Enter, and Esc to put a card back.</li>
        </ul>
        <fieldset className="tt-decks">
          <legend>Which cards?</legend>
          {(Object.keys(DECKS) as DeckKind[]).map((k) => {
            const list = deckCards(k, classicsOnly);
            return (
              <label key={k} className="tt-deck">
                <input type="radio" name="tt-deck" value={k} checked={deckKind === k} onChange={() => setDeckKind(k)} />
                {k !== "mixed" && (
                  <span className={`tt-kind is-${k}`} aria-hidden="true">
                    {KINDS[k].label}
                  </span>
                )}
                <span>
                  <strong>{DECKS[k].label}</strong> – {list.length} cards, {span(list)}
                </span>
              </label>
            );
          })}
        </fieldset>
        <label className="tt-deck tt-classics">
          <input type="checkbox" checked={classicsOnly} onChange={(e) => setClassicsOnly(e.target.checked)} />
          <span>
            <strong>Classics only</strong> – the better-known half of each kind. Untick it for the deep cuts.
          </span>
        </label>
        <div className="tt-start">
          <button type="button" className="btn-pixel" onClick={() => start("timed")}>
            Play: {ROUND_SECONDS} seconds ▶
          </button>
          <button type="button" className="btn-ghost" onClick={() => start("relaxed")}>
            Relaxed: no clock
          </button>
        </div>
        {best > 0 && <p className="tt-best">Your best score: {best}</p>}
        <p className="tt-source">
          Years are first publication, first performance, the year a painting was finished or a film came out. Most come
          from{" "}
          <a href="https://www.wikidata.org/" target="_blank" rel="noreferrer">
            Wikidata<span className="sr-only"> (opens in a new tab)</span>
          </a>
          , the rest were checked by hand. The pixel pictures are drawn by code: a cover for books, a gilded frame for
          art, a record for music, a curtain for the stage and a genre poster for films. They never hint at the year.
        </p>
      </section>
    );
  }

  if (phase === "over") {
    return (
      <section className="tt tt-over pixel-frame" aria-labelledby="tt-over-title">
        <h1 id="tt-over-title" className="tt-h1" tabIndex={-1} ref={headingRef}>
          {score >= best && score > 0 ? "A new record!" : "Round over"}
        </h1>
        <p className="tt-guide">
          <span className="tt-guide-name">The Archivist:</span>{" "}
          {right > wrong
            ? "Well done. You really are a time traveller. I'll put in a word for you at the club."
            : "The timestream is a tricky place. Have another go."}
        </p>
        <dl className="tt-stats">
          <div>
            <dt>Score</dt>
            <dd>{score}</dd>
          </div>
          <div>
            <dt>Right</dt>
            <dd>{right}</dd>
          </div>
          <div>
            <dt>Wrong</dt>
            <dd>{wrong}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd>{Math.max(best, score)}</dd>
          </div>
        </dl>
        <div className="tt-start">
          <button type="button" className="btn-pixel" onClick={() => start(mode)}>
            Play again ▶
          </button>
          <button type="button" className="btn-ghost" onClick={() => setPhase("intro")}>
            Change mode
          </button>
        </div>
      </section>
    );
  }

  // ---------- the game ----------
  return (
    <section className="tt tt-play" aria-labelledby="tt-play-title" onKeyDown={onKeyDown}>
      <h1 id="tt-play-title" className="sr-only">
        Time Traveller
      </h1>

      <div className="tt-bar">
        <p className="tt-stat">
          Score <strong>{score}</strong>
        </p>
        {mode === "timed" && (
          <p className={`tt-stat${time <= 10 ? " is-low" : ""}`}>
            Time <strong>{Math.max(0, time)}</strong>
            <span className="sr-only"> seconds</span>
          </p>
        )}
        <p className="tt-stat">
          Cards left <strong>{hand.length + deck.length}</strong>
        </p>
        <div className="tt-bar-actions">
          {mode === "timed" && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setPhase(phase === "paused" ? "playing" : "paused")}
              aria-pressed={phase === "paused"}
            >
              {phase === "paused" ? "Resume ▶" : "Pause ❚❚"}
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={finish}>
            End game
          </button>
        </div>
      </div>

      {phase === "paused" ? (
        <p className="tt-paused">Paused. The clock waits for you.</p>
      ) : (
        <>
          <h2 className="tt-h2" id="tt-timeline-title">
            Timeline <span className="tt-h2-note">oldest ← → newest</span>
          </h2>
          <ol className={`tt-timeline${active ? " is-placing" : ""}`} aria-labelledby="tt-timeline-title">
            {timeline.map((c, i) => (
              <li key={c.id} className="tt-slot-row">
                <Gap
                  index={i}
                  label={gapLabel(timeline, i)}
                  active={!!active}
                  cardTitle={selectedCard?.title}
                  onPlace={(idx) => active && place(active, idx)}
                  buttonRef={i === 0 ? firstGapRef : undefined}
                />
                <div className={`tt-card is-placed${feedback?.ok && feedback.card.id === c.id ? " is-new" : ""}`}>
                  <Poster id={c.id} kind={c.kind} motif={c.motif} />
                  <span className={`tt-kind is-${c.kind}`}>{KINDS[c.kind].label}</span>
                  <span className="tt-year">{c.year}</span>
                  <span className="tt-title">{c.title}</span>
                  <span className="tt-dir">
                    <span className="sr-only">{KINDS[c.kind].by} </span>
                    {c.creator}
                  </span>
                </div>
              </li>
            ))}
            <li className="tt-slot-row">
              <Gap
                index={timeline.length}
                label={gapLabel(timeline, timeline.length)}
                active={!!active}
                cardTitle={selectedCard?.title}
                onPlace={(idx) => active && place(active, idx)}
              />
            </li>
          </ol>

          <h2 className="tt-h2" id="tt-hand-title">
            Your cards
          </h2>
          <ul className="tt-hand" ref={handRef} aria-labelledby="tt-hand-title">
            {hand.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="tt-card is-hand"
                  aria-pressed={selected === c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", c.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDragging(c.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  onClick={() => pick(c.id)}
                >
                  <Poster id={c.id} kind={c.kind} motif={c.motif} />
                  <span className={`tt-kind is-${c.kind}`}>{KINDS[c.kind].label}</span>
                  <span className="tt-year" aria-hidden="true">
                    ????
                  </span>
                  <span className="tt-title">{c.title}</span>
                  <span className="tt-dir">
                    <span className="sr-only">{KINDS[c.kind].by} </span>
                    {c.creator}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {feedback && (
        <p className={`tt-feedback ${feedback.ok ? "is-ok" : "is-bad"}`}>
          <span className="tt-guide-name">The Archivist:</span> {feedback.text}{" "}
          <a href={sourceUrl(feedback.card)} target="_blank" rel="noreferrer">
            More about {feedback.card.title} on {feedback.card.id.startsWith("Q") ? "Wikidata" : "Wikipedia"} ↗
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
      )}

      {/* everything that happens is said out loud here */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announce}
      </p>
    </section>
  );
}

function Gap({
  index,
  label,
  active,
  cardTitle,
  onPlace,
  buttonRef,
}: {
  index: number;
  label: string;
  active: boolean;
  cardTitle?: string;
  onPlace: (index: number) => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  const [over, setOver] = useState(false);
  if (!active) return <span className="tt-gap is-idle" aria-hidden="true" />;
  return (
    <button
      ref={buttonRef}
      type="button"
      className={`tt-gap${over ? " is-over" : ""}`}
      aria-label={`Place ${cardTitle ?? "the card"}: ${label}`}
      onClick={() => onPlace(index)}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onPlace(index);
      }}
    >
      <span aria-hidden="true">+</span>
    </button>
  );
}
