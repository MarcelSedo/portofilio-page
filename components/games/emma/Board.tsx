"use client";

import { useState } from "react";
import { CATEGORY, type Scenario } from "@/content/games/emma/types";
import { ClueFace } from "./ClueCard";
import { Sheet } from "./Sheet";
import { QUIZ_COOLDOWN, quizLadies, quizLocked, type GameState } from "./state";

type Props = {
  sc: Scenario;
  s: GameState;
  setMatch: (woman: string, man: string | null) => void;
  setProof: (woman: string, clue: string | null) => void;
  onAnnounce: () => void;
  /** Emma's questions: are they all answered right? */
  quizDone: boolean;
  /** answer them: returns the ladies you got wrong */
  onQuiz: (answers: Record<string, number>) => string[];
  say: (text: string) => void;
  /** the tutorial can point at a part of the board */
  focus?: "board" | "proof" | "announce" | null;
};

const RIBBON = ["#b8405e", "#2f6e52", "#2f5aa8", "#a8761e", "#7a4aa8", "#2a8a8a", "#c8602a"];
const bust = (id: string) => `/emma/bust-${id}.png`;

/**
 * The wedding board at Hartfield: every lady and every gentleman, side by side.
 * Tap a lady, then the gentleman she belongs with. Then give each engagement one clue as proof.
 */
export function Board({ sc, s, setMatch, setProof, onAnnounce, quizDone, onQuiz, say, focus }: Props) {
  const ladies = sc.people.filter((p) => p.sex === "f");
  const gents = sc.people.filter((p) => p.sex === "m");
  const [picked, setPicked] = useState<string | null>(null);
  const [proofFor, setProofFor] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizWrong, setQuizWrong] = useState<string[] | null>(null);
  const couples = Object.keys(sc.pairs).length;
  const matchedCount = ladies.filter((l) => s.matches[l.id]).length;
  const short = (id: string) => sc.people.find((p) => p.id === id)!.short;
  const ribbon = (woman: string) => RIBBON[ladies.findIndex((l) => l.id === woman) % RIBBON.length];
  const ladyOf = (man: string) => ladies.find((l) => s.matches[l.id] === man)?.id;
  const allMatched = matchedCount === couples;
  const clueById = (id: string) => sc.clues.find((c) => c.id === id)!;

  const pickLady = (id: string) => {
    setPicked(picked === id ? null : id);
    if (picked !== id) say(`${short(id)} chosen. Now choose the gentleman for her.`);
  };
  const pickGent = (id: string) => {
    if (!picked) {
      const l = ladyOf(id);
      if (l) {
        setMatch(l, null);
        say(`${short(id)} is free again.`);
      } else say("Choose a lady first.");
      return;
    }
    if (!s.matches[picked] && matchedCount >= couples) {
      say(`There are only ${couples} couples. Free a lady first.`);
      setPicked(null);
      return;
    }
    setMatch(picked, id);
    say(`${short(picked)} and ${short(id)}.`);
    setPicked(null);
  };

  const person = (id: string, role: "lady" | "gent") => {
    const partner = role === "lady" ? s.matches[id] : ladyOf(id);
    const colour = role === "lady" ? (partner ? ribbon(id) : undefined) : partner ? ribbon(partner) : undefined;
    const p = sc.people.find((x) => x.id === id)!;
    return (
      <li key={id}>
        <button
          type="button"
          className={`em-person-card${colour ? " is-matched" : ""}${picked === id ? " is-picked" : ""}`}
          style={colour ? ({ "--ribbon": colour } as React.CSSProperties) : undefined}
          aria-pressed={role === "lady" ? picked === id : undefined}
          onClick={() => (role === "lady" ? pickLady(id) : pickGent(id))}
        >
          <img src={bust(id)} alt="" width={64} height={64} />
          <span className="em-person-name">{p.short}</span>
          <span className="em-person-role">{p.role}</span>
          {partner && (
            <span className="em-person-with">
              <span aria-hidden="true">♥</span> {short(partner)}
            </span>
          )}
        </button>
      </li>
    );
  };

  // clues that could prove this match: about her or about him
  const proofList = (woman: string) => {
    const man = s.matches[woman];
    return s.found.filter((id) => {
      const c = clueById(id);
      if (c.cat === "instinct") return false;
      return showAll || c.about.includes(woman) || (man ? c.about.includes(man) : false);
    });
  };

  return (
    <div className="em-board">
      <h2 className="em-h2">The wedding board</h2>
      <p className="em-muted">
        Tap a lady, then the gentleman she belongs with. {ladies.length > couples
          ? `Only ${couples} couples belong together: one lady and one gentleman are just here to confuse you.`
          : ""}{" "}
        Give each engagement one clue as proof, answer Emma&apos;s questions, and announce them at the ball.
      </p>

      <section className={`em-people${focus === "board" ? " is-focus" : ""}`} aria-label="Who belongs with whom">
        <h3 className="em-h3">The ladies</h3>
        <ul className="em-people-row">{ladies.map((l) => person(l.id, "lady"))}</ul>
        <h3 className="em-h3">The gentlemen</h3>
        <ul className="em-people-row">{gents.map((g) => person(g.id, "gent"))}</ul>
      </section>

      <section className={`em-engaged${focus === "proof" ? " is-focus" : ""}`} aria-labelledby="em-engaged-title">
        <h3 id="em-engaged-title" className="em-h3">
          Engagements and proof
        </h3>
        <ol className="em-engaged-list">
          {ladies.filter((l) => s.matches[l.id] || matchedCount < couples).map((l) => {
            const man = s.matches[l.id];
            const proof = s.proofs[l.id];
            return (
              <li key={l.id} className="em-engaged-row" style={{ "--ribbon": man ? ribbon(l.id) : "#b8a890" } as React.CSSProperties}>
                <div className="em-engaged-pair">
                  <img src={bust(l.id)} alt="" width={40} height={40} />
                  <span aria-hidden="true">♥</span>
                  {man ? <img src={bust(man)} alt="" width={40} height={40} /> : <span className="em-q" aria-hidden="true">?</span>}
                  <span className="em-engaged-names">
                    {l.short} &amp; {man ? short(man) : "…"}
                  </span>
                </div>
                {proof ? (
                  <div className="em-proof">
                    <ClueFace clue={clueById(proof)} />
                    <button type="button" className="em-btn is-ghost is-small" onClick={() => setProofFor(l.id)}>
                      Change proof<span className="sr-only"> for {l.short}</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" className="em-btn is-ghost is-small" onClick={() => setProofFor(l.id)} disabled={!man}>
                    Choose a proof<span className="sr-only"> for {l.short}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <div className={`em-announce${focus === "announce" ? " is-focus" : ""}`}>
        <button type="button" className="em-btn" onClick={() => (quizDone ? setConfirm(true) : (setQuizWrong(null), setQuizOpen(true)))} disabled={!allMatched}>
          {quizDone ? "Announce the engagements at the ball ♥" : "Emma's questions, then the ball ♥"}
        </button>
        {!allMatched && (
          <p className="em-muted">
            Choose {couples} couples first ({matchedCount} so far).
          </p>
        )}
        {s.attempts > 0 && (
          <p className="em-muted">
            Announced {s.attempts} {s.attempts === 1 ? "time" : "times"} so far.
          </p>
        )}
      </div>

      <Sheet open={!!proofFor} onClose={() => setProofFor(null)} labelledBy="em-proof-title" wide>
        {proofFor && (
          <>
            <h2 id="em-proof-title" className="em-h2">
              Proof for {short(proofFor)} &amp; {s.matches[proofFor] ? short(s.matches[proofFor]) : "…"}
            </h2>
            <p className="em-muted">Choose the one clue that shows best that they belong together. Rumours can lie.</p>
            <label className="em-toggle">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show all my clues, not only those about these two
            </label>
            <ul className="em-clue-list">
              {proofList(proofFor).map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    className={`em-proof-pick${s.proofs[proofFor] === id ? " is-chosen" : ""}`}
                    aria-pressed={s.proofs[proofFor] === id}
                    onClick={() => {
                      setProof(proofFor, id);
                      say(`Proof chosen: ${CATEGORY[clueById(id).cat].label}.`);
                      setProofFor(null);
                    }}
                  >
                    <ClueFace clue={clueById(id)} />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="em-btn" data-autofocus onClick={() => setProofFor(null)}>
              Close
            </button>
          </>
        )}
      </Sheet>


      <Sheet open={quizOpen} onClose={() => setQuizOpen(false)} labelledBy="em-quiz-title" wide>
        <div className="em-say">
          <img src={bust("emma")} alt="" width={96} height={96} className="em-say-bust" />
          <div>
            <h2 id="em-quiz-title" className="em-h2">
              Before we say anything to anybody…
            </h2>
            <p>Let us be sure we really know these young ladies. One question each. Answer from what you have heard, not from what you hope.</p>
          </div>
        </div>
        <form
          className="em-quiz"
          onSubmit={(e) => {
            e.preventDefault();
            const wrong = onQuiz(answers);
            setQuizWrong(wrong);
            setAnswers({});
            if (!wrong.length) {
              say("Every answer right. To the ball!");
            } else say(`Not quite: ${wrong.map(short).join(", ")}.`);
          }}
        >
          {quizLadies(sc).map((w) => {
            const entry = s.quiz[w] ?? { q: 0 };
            const qs = sc.questions?.[w] ?? [];
            const q = qs[entry.q % qs.length];
            if (!q) return null;
            if (entry.passed)
              return (
                <p key={w} className="em-quiz-done">
                  <img src={bust(w)} alt="" width={40} height={40} /> <span aria-hidden="true">✓</span> {short(w)}: you know her story.
                </p>
              );
            if (quizLocked(s, w))
              return (
                <p key={w} className="em-quiz-locked">
                  <img src={bust(w)} alt="" width={40} height={40} /> {short(w)}: “We don&apos;t know her well enough yet. Find {(entry.wrongAt ?? 0) + QUIZ_COOLDOWN - s.found.length} more {(entry.wrongAt ?? 0) + QUIZ_COOLDOWN - s.found.length === 1 ? "clue" : "clues"} first.”
                </p>
              );
            return (
              <fieldset key={w} className="em-quiz-q">
                <legend>
                  <img src={bust(w)} alt="" width={40} height={40} />
                  <span>
                    <strong>{short(w)}.</strong> {q.q}
                  </span>
                </legend>
                {q.options.map((o, i) => (
                  <label key={o} className="em-quiz-opt">
                    <input type="radio" name={`q-${w}`} checked={answers[w] === i} onChange={() => setAnswers({ ...answers, [w]: i })} required />
                    <span>{o}</span>
                  </label>
                ))}
              </fieldset>
            );
          })}
          {quizWrong && quizWrong.length > 0 && (
            <p className="em-note" role="status">
              Emma: “Hm. I am not at all sure about {quizWrong.map(short).join(" or ")}. Let us listen a little more: find {QUIZ_COOLDOWN} more clues, and I shall ask again, differently.”
            </p>
          )}
          <div className="em-row">
            {quizDone ? (
              <button type="button" className="em-btn" data-autofocus onClick={() => (setQuizOpen(false), setConfirm(true))}>
                To the ball ♥
              </button>
            ) : quizLadies(sc).some((w) => !s.quiz[w]?.passed && !quizLocked(s, w)) ? (
              <button type="submit" className="em-btn">
                Those are my answers
              </button>
            ) : null}
            <button type="button" className="em-btn is-ghost" onClick={() => setQuizOpen(false)}>
              {quizDone ? "Not yet" : "Back to the board"}
            </button>
          </div>
        </form>
      </Sheet>

      <Sheet open={confirm} onClose={() => setConfirm(false)} labelledBy="em-confirm-title">
        <div className="em-say">
          <img src={bust("emma")} alt="" width={96} height={96} className="em-say-bust" />
          <div>
            <h2 id="em-confirm-title" className="em-h2">
              Announce the engagements?
            </h2>
            <p>At the ball, in front of everybody, one couple at a time. If we are wrong, the whole village will know it by breakfast.</p>
            <div className="em-row">
              <button
                type="button"
                className="em-btn"
                data-autofocus
                onClick={() => {
                  setConfirm(false);
                  onAnnounce();
                }}
              >
                To the Assembly Rooms
              </button>
              <button type="button" className="em-btn is-ghost" onClick={() => setConfirm(false)}>
                Not yet
              </button>
            </div>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
