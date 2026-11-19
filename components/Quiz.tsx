"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/content/profile";

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const done = index >= questions.length;

  if (done) {
    return (
      <div className="flex flex-col items-start gap-4" role="status" aria-live="polite">
        <p className="m-0 font-pixel text-sm text-teal">QUEST COMPLETE</p>
        <p className="m-0 text-lg">
          You scored {score} / {questions.length}.
        </p>
        <button
          type="button"
          onClick={() => {
            setIndex(0);
            setScore(0);
            setPicked(null);
            setSubmitted(false);
          }}
          className="min-h-11 cursor-pointer border-[3px] border-frame px-5 font-bold text-ink"
        >
          Play again
        </button>
      </div>
    );
  }

  const q = questions[index];
  const correct = picked === q.answer;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (picked === null) return;
    if (picked === q.answer) setScore((s) => s + 1);
    setSubmitted(true);
  }

  function next() {
    setIndex((i) => i + 1);
    setPicked(null);
    setSubmitted(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-3 text-lg font-semibold">
          <span className="text-muted">
            Question {index + 1} of {questions.length}:{" "}
          </span>
          {q.question}
        </legend>
        {q.options.map((option, i) => (
          <label
            key={i}
            className={`flex min-h-11 cursor-pointer items-center gap-3 border-[3px] px-4 py-2 ${
              picked === i ? "border-amber" : "border-line"
            }`}
          >
            <input
              type="radio"
              name={`q-${index}`}
              value={i}
              checked={picked === i}
              disabled={submitted}
              onChange={() => setPicked(i)}
              className="h-5 w-5 accent-amber"
            />
            {option}
          </label>
        ))}
      </fieldset>

      <div role="status" aria-live="polite">
        {submitted && (
          <p className="m-0">
            <strong className={correct ? "text-teal" : "text-amber"}>
              {correct ? "Correct!" : `Not quite. It's “${q.options[q.answer]}”.`}
            </strong>{" "}
            {q.reveal}
          </p>
        )}
      </div>

      {submitted ? (
        <button
          type="button"
          onClick={next}
          className="min-h-11 cursor-pointer self-start bg-teal px-5 font-bold text-ground"
        >
          {index + 1 < questions.length ? "Next question" : "See score"}
        </button>
      ) : (
        <button
          type="submit"
          disabled={picked === null}
          className="min-h-11 cursor-pointer self-start bg-amber px-5 font-bold text-ground disabled:cursor-not-allowed disabled:opacity-60"
        >
          Check answer
        </button>
      )}
    </form>
  );
}
