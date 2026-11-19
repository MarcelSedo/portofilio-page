"use client";

import { useId, type InputHTMLAttributes, type Ref } from "react";
import { cx, mergeIds } from "./utils";

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "required"> & {
  id?: string;
  label: string;
  /** Short help text under the label (GOV.UK "hint") */
  hint?: string;
  /** Error message; when set the field is marked invalid */
  error?: string;
  /** Required fields are the default; optional ones get "(optional)" in the label */
  optional?: boolean;
  ref?: Ref<HTMLInputElement>;
  className?: string;
};

export function TextInput({
  id, label, hint, error, optional = false, ref, className, type = "text",
  "aria-describedby": externalDescribedBy, ...props
}: TextInputProps) {
  const autoId = useId().replace(/:/g, "");
  const inputId = id ?? `input-${autoId}`;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cx("form-field", error && "form-field--error", className)}>
      <label htmlFor={inputId} className="form-label">
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

      <input
        {...props}
        ref={ref}
        id={inputId}
        type={type}
        // aria-required instead of required: no native browser bubbles, our own messages instead
        aria-required={optional ? undefined : true}
        aria-invalid={error ? true : undefined}
        // the error is part of the description, so screen readers read it with the label
        aria-describedby={mergeIds(externalDescribedBy, hintId, errorId)}
        className="pixel-input"
      />
    </div>
  );
}
