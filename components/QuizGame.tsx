"use client";

import { useEffect, useRef, useState } from "react";
import type { QuizQuestion } from "@/content/about";

const LIVES = 5;
const POINTS = 10;
const LETTERS = ["A", "B", "C", "D"];

type Phase = "start" | "question" | "answered" | "gameover" | "win";

/**
 * Retro quiz in the style of the candidate brochure: HUD (lives, level, score), window with a title bar.
 * Accessibility: real buttons, the result is announced and focused, ✓ / ✗ are text (never colour alone),
 * no timers, game over just offers "Continue".
 */
export function QuizGame({ questions }: { questions: QuizQuestion[] }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLHeadingElement>(null);

  const q = questions[index];
  const total = questions.length;

  // move focus to whatever just appeared, so keyboard and screen reader users follow along
  useEffect(() => {
    if (phase === "question") headingRef.current?.focus();
    if (phase === "answered") resultRef.current?.focus();
    if (phase === "gameover" || phase === "win") screenRef.current?.focus();
  }, [phase, index]);

  const start = () => {
    setIndex(0);
    setPicked(null);
    setLives(LIVES);
    setScore(0);
    setCorrectCount(0);
    setPhase("question");
  };

  const answer = (i: number) => {
    if (phase !== "question") return;
    setPicked(i);
    if (i === q.answer) {
      setScore((s) => s + POINTS);
      setCorrectCount((c) => c + 1);
    } else {
      setLives((l) => l - 1);
    }
    setPhase("answered");
  };

  const next = () => {
    if (lives <= 0) return setPhase("gameover");
    if (index + 1 >= total) return setPhase("win");
    setIndex((n) => n + 1);
    setPicked(null);
    setPhase("question");
  };

  const continueGame = () => {
    setLives(LIVES);
    if (index + 1 >= total) return setPhase("win");
    setIndex((n) => n + 1);
    setPicked(null);
    setPhase("question");
  };

  const isCorrect = picked === q?.answer;

  return (
    <section aria-labelledby="quiz-title" className="quiz">
      <h2 id="quiz-title" className="quiz-title">
        Quiz: how well do you know Marcel?
      </h2>

      {/* HUD */}
      <div className="quiz-hud">
        <p className="m-0">
          <span aria-hidden="true" className="quiz-hearts">
            {"♥".repeat(Math.max(lives, 0))}
            <span className="quiz-hearts-lost">{"♥".repeat(LIVES - Math.max(lives, 0))}</span>
          </span>
          <span className="sr-only">
            Lives: {Math.max(lives, 0)} of {LIVES}
          </span>
        </p>
        <p className="m-0">
          Level {phase === "start" ? 0 : Math.min(index + 1, total)}
          <span className="sr-only"> of {total}</span>
        </p>
        <p className="m-0">Score {String(score).padStart(3, "0")}</p>
      </div>

      <div className="retro-window">
        <div className="retro-titlebar" aria-hidden="true">
          <span>marcel.quiz</span>
          <span className="retro-buttons">
            <i>_</i>
            <i>□</i>
            <i>×</i>
          </span>
        </div>

        <div className="retro-body">
          {phase === "start" && (
            <div className="quiz-screen">
              <p className="quiz-big" aria-hidden="true">START</p>
              <p className="m-0">
                {total} questions about Marcel. {LIVES} lives. No timer, no pressure.
              </p>
              <button type="button" className="btn-pixel" onClick={start}>
                Press start ▶
              </button>
            </div>
          )}

          {(phase === "question" || phase === "answered") && q && (
            <div>
              <p className="quiz-progress">
                Question {index + 1} of {total}
              </p>
              <h3 ref={headingRef} tabIndex={-1} className="quiz-question">
                {q.question}
              </h3>

              <ul className="quiz-options">
                {q.options.map((opt, i) => {
                  const state =
                    phase !== "answered" ? "" : i === q.answer ? "is-correct" : i === picked ? "is-wrong" : "is-dim";
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        className={`quiz-option ${state}`}
                        onClick={() => answer(i)}
                        aria-disabled={phase === "answered" || undefined}
                      >
                        <span className="quiz-letter" aria-hidden="true">{LETTERS[i]}.</span>
                        <span>{opt}</span>
                        {state === "is-correct" && <span className="quiz-mark"> ✓<span className="sr-only"> correct answer</span></span>}
                        {state === "is-wrong" && <span className="quiz-mark"> ✗<span className="sr-only"> your answer</span></span>}
                      </button>
                    </li>
                  );
                })}
              </ul>

              {phase === "answered" && (
                <div ref={resultRef} tabIndex={-1} className={`quiz-result ${isCorrect ? "ok" : "ko"}`}>
                  <p className="quiz-result-title">
                    {isCorrect ? `Correct! +${POINTS}` : `Not quite: it's “${q.options[q.answer]}”. −1 life`}
                  </p>
                  <p className="m-0">{q.reveal}</p>
                  <button type="button" className="btn-pixel mt-5" onClick={next}>
                    {lives <= 0 ? "Uh oh ▶" : index + 1 >= total ? "See your score ▶" : "Next level ▶"}
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "gameover" && (
            <div className="quiz-screen">
              <h3 ref={screenRef} tabIndex={-1} className="quiz-big">Game over</h3>
              <p className="m-0">Out of lives on level {index + 1}. Insert coin?</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  className="btn-pixel"
                  onClick={continueGame}
                >
                  Continue (keep score) ▶
                </button>
                <button type="button" className="btn-ghost" onClick={start}>
                  Start again
                </button>
              </div>
            </div>
          )}

          {phase === "win" && (
            <div className="quiz-screen">
              <h3 ref={screenRef} tabIndex={-1} className="quiz-big">You win</h3>
              <p className="m-0 text-lg">
                {correctCount} of {total} right · score {score}
              </p>
              <p className="m-0">
                {correctCount === total
                  ? "Flawless. Are we already friends?"
                  : correctCount >= total / 2
                    ? "Not bad at all. We'd get on."
                    : "Plenty left to talk about, then."}{" "}
                I hope we&apos;ll meet at the interview.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/contact" className="btn-pixel">Send a raven ▶</a>
                <button type="button" className="btn-ghost" onClick={start}>
                  Play again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* one polite announcement for results */}
      <p role="status" className="sr-only">
        {phase === "answered" ? (isCorrect ? "Correct." : `Not quite. The answer is ${q.options[q.answer]}.`) : ""}
      </p>
    </section>
  );
}
