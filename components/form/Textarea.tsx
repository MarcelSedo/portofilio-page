"use client";

import { useEffect, useId, useState, type Ref, type TextareaHTMLAttributes } from "react";
import { cx, mergeIds } from "./utils";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "required" | "maxLength" | "value"> & {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  value: string;
  /** Soft limit: people can type past it and see how much to cut (GOV.UK character count) */
  maxChars?: number;
  ref?: Ref<HTMLTextAreaElement>;
  className?: string;
};

const fmt = (n: number) => n.toLocaleString("en-GB");

export function Textarea({
  id, label, hint, error, optional = false, value, maxChars, ref, className, rows = 6,
  "aria-describedby": externalDescribedBy, ...props
}: TextareaProps) {
  const autoId = useId().replace(/:/g, "");
  const areaId = id ?? `textarea-${autoId}`;
  const hintId = hint ? `${areaId}-hint` : undefined;
  const errorId = error ? `${areaId}-error` : undefined;
  const countId = maxChars ? `${areaId}-count` : undefined;

  const remaining = maxChars ? maxChars - value.length : 0;
  const over = maxChars ? remaining < 0 : false;
  const countText = !maxChars
    ? ""
    : over
      ? `You have ${fmt(-remaining)} character${remaining === -1 ? "" : "s"} too many`
      : `You have ${fmt(remaining)} character${remaining === 1 ? "" : "s"} remaining`;

  // Screen readers hear the count only after typing pauses for a second, not on every key
  const [spokenCount, setSpokenCount] = useState("");
  useEffect(() => {
    if (!maxChars) return;
    const t = window.setTimeout(() => setSpokenCount(countText), 1000);
    return () => window.clearTimeout(t);
  }, [countText, maxChars]);

  return (
    <div className={cx("form-field", error && "form-field--error", className)}>
      <label htmlFor={areaId} className="form-label">
        {label}
        {optional && <span className="form-optional"> (optional)</span>}
      </label>

      {hint && (
        <p id={hintId} className="form-hint">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="form-error">
          <span className="sr-only">Error: </span>
          <span aria-hidden="true" className="form-error-icon">!</span>
          {error}
        </p>
      )}

      <textarea
        {...props}
        ref={ref}
        id={areaId}
        rows={rows}
        value={value}
        aria-required={optional ? undefined : true}
        aria-invalid={error || over ? true : undefined}
        aria-describedby={mergeIds(externalDescribedBy, hintId, errorId, countId)}
        className="pixel-input pixel-textarea"
      />

      {maxChars && (
        <>
          {/* visible count; described-by so it's read when the field gets focus */}
          <p id={countId} className={cx("form-count", over && "form-count--over")}>
            {countText}
          </p>
          {/* polite live update after a pause */}
          <p className="sr-only" aria-live="polite">
            {spokenCount}
          </p>
        </>
      )}
    </div>
  );
}
