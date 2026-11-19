"use client";

import { useEffect, useRef, useState } from "react";
import {
  FIELD_LIMITS, validateContact,
  type ContactValues, type Field, type FieldError,
} from "@/app/api/contact/validation";
import { profile } from "@/content/profile";
import { TextInput } from "@/components/form/TextInput";
import { Textarea } from "@/components/form/Textarea";
import { ErrorSummary, type SummaryError } from "@/components/form/ErrorSummary";

const EMPTY: ContactValues = { name: "", email: "", company: "", message: "" };
const FIELD_ORDER: Field[] = ["name", "email", "company", "message"];
const fieldId = (f: Field) => `contact-${f}`;

export function ContactForm() {
  const email = profile.links.email;
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string; email: string; reference: string } | null>(null);
  const startedAt = useRef(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const errorFor = (f: Field) => errors.find((e) => e.field === f)?.message;

  const update = (f: Field) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = { ...values, [f]: e.target.value };
    setValues(next);
    // once a field has an error, re-check it as people fix it
    if (errorFor(f)) {
      const msg = validateContact(trim(next)).find((er) => er.field === f);
      setErrors((cur) => (msg ? cur.map((er) => (er.field === f ? msg : er)) : cur.filter((er) => er.field !== f)));
    }
  };

  const fail = (errs: FieldError[], msg: string | null) => {
    // keep the summary in the same order as the fields on the page
    setErrors([...errs].sort((a, b) => FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field)));
    setProblem(msg);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const clean = trim(values);
    const clientErrors = validateContact(clean);
    if (clientErrors.length) return fail(clientErrors, null);

    setErrors([]);
    setProblem(null);
    setSending(true);
    try {
      const honey = new FormData(e.currentTarget).get("website") ?? "";
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clean, website: honey, startedAt: startedAt.current }),
      });
      const data = (await res.json()) as { ok: boolean; message?: string; errors?: FieldError[]; reference?: string };
      if (!res.ok || !data.ok) {
        return fail(data.errors ?? [], data.errors?.length ? null : data.message ?? "Something went wrong.");
      }
      setSent({ name: clean.name, email: clean.email, reference: data.reference ?? "" });
    } catch {
      fail([], "Your message could not be sent. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="confirm-panel">
        <h2 ref={successRef} tabIndex={-1} className="confirm-title">
          Raven dispatched
        </h2>
        <p className="m-0 mt-4 text-lg">
          Thanks, {sent.name.split(" ")[0]}. I&apos;ll reply to <strong>{sent.email}</strong>, usually within a couple
          of working days.
        </p>
        {sent.reference && (
          <p className="m-0 mt-3 text-sm">
            Your reference: <strong>{sent.reference}</strong>
          </p>
        )}
        <button
          type="button"
          className="btn-ghost mt-6"
          onClick={() => {
            setValues(EMPTY);
            setSent(null);
            startedAt.current = Date.now();
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const summary: SummaryError[] = [
    ...(problem ? [{ message: problem }] : []),
    ...errors.map((er) => ({ targetId: fieldId(er.field), message: er.message })),
  ];

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending || undefined} className="flex flex-col gap-8">
      <ErrorSummary ref={summaryRef} errors={summary} />

      <TextInput
        id={fieldId("name")} name="name" label="Your name" autoComplete="name" spellCheck={false}
        value={values.name} onChange={update("name")} error={errorFor("name")}
      />
      <TextInput
        id={fieldId("email")} name="email" type="email" label="Email address" autoComplete="email" spellCheck={false}
        hint="I'll only use it to reply to you." value={values.email} onChange={update("email")} error={errorFor("email")}
      />
      <TextInput
        id={fieldId("company")} name="company" label="Company or project" optional autoComplete="organization"
        value={values.company} onChange={update("company")} error={errorFor("company")}
      />
      <Textarea
        id={fieldId("message")} name="message" label="Your message"
        hint="A role, a project, a question about accessibility, or just hello."
        maxChars={FIELD_LIMITS.message} value={values.message} onChange={update("message")} error={errorFor("message")}
      />

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <button type="submit" className="btn-pixel" aria-disabled={sending || undefined}>
          {sending ? "Sending…" : "Send the raven ▶"}
        </button>
        <p className="m-0 text-sm text-slate-300">
          Prefer email? <a href={`mailto:${email}`}>{email}</a>
        </p>
      </div>
      <p role="status" className="sr-only">
        {sending ? "Sending your message" : ""}
      </p>
    </form>
  );
}

const trim = (v: ContactValues): ContactValues =>
  Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x.trim()])) as ContactValues;
