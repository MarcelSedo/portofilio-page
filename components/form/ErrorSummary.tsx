"use client";

import type { Ref } from "react";
import { prefersReducedMotion } from "./utils";

export type SummaryError = {
  /** id of the field to focus; omit for a general error */
  targetId?: string;
  message: string;
};

type ErrorSummaryProps = {
  errors: SummaryError[];
  title?: string;
  description?: string;
  ref?: Ref<HTMLDivElement>;
};

/**
 * GOV.UK-style error summary. Give it focus after a failed submit (tabIndex -1 is set).
 * Clicking an error moves focus to the field and scrolls so its label is visible too.
 */
export function ErrorSummary({ errors, title = "There is a problem", description, ref }: ErrorSummaryProps) {
  if (!errors.length) return null;

  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    const field = document.getElementById(targetId);
    if (!field) return; // fall back to the normal #anchor jump
    e.preventDefault();
    field.focus({ preventScroll: true });
    const label = document.querySelector(`label[for="${CSS.escape(targetId)}"]`) ?? field;
    label.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  return (
    <div ref={ref} tabIndex={-1} className="error-summary" aria-labelledby="error-summary-title">
      <div role="alert">
        <h2 id="error-summary-title" className="error-summary-title">
          {title}
        </h2>
        {description && <p className="m-0 mt-3">{description}</p>}
        <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
          {errors.map((er, i) => (
            <li key={`${er.targetId ?? "general"}-${i}`}>
              {er.targetId ? (
                <a href={`#${er.targetId}`} onClick={(e) => goTo(e, er.targetId!)}>
                  {er.message}
                </a>
              ) : (
                er.message
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
