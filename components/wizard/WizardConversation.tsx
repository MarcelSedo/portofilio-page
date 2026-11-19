"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";
import { WIZARD_NAME } from "@/content/wizard";
import { topicById, useWizard } from "./WizardProvider";

type Props = {
  /** Prefix for element ids, so the inline and floating chat never clash */
  idPrefix: string;
  /** Called when a link inside the conversation is followed (the floating window closes) */
  onNavigate?: () => void;
};

/**
 * The conversation itself: message log, suggested questions and the question form.
 * Used by the floating window and the About page.
 * The forwarded ref points at the text input (so the window can focus it).
 */
export const WizardConversation = forwardRef<HTMLInputElement, Props>(function WizardConversation(
  { idPrefix, onNavigate },
  inputRef,
) {
  const { messages, chips, thinking, ask, askTopic } = useWizard();
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLOListElement>(null);

  // keep the newest message in view
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || thinking) return;
    ask(input);
    setInput("");
  };

  return (
    <>
      {/* role=log: new messages are announced politely, in order */}
      <ol
        ref={logRef}
        tabIndex={0}
        className="wizard-log"
        role="log"
        aria-live="polite"
        aria-label="Conversation with the wizard"
      >
        {messages.map((m) => (
          <li key={m.id} className={`bubble bubble-${m.from}`}>
            <span className="sr-only">{m.from === "wizard" ? `${WIZARD_NAME}: ` : "You: "}</span>
            {m.text}
            {m.link && (
              <>
                {" "}
                <Link href={m.link.href} className="bubble-link" onClick={onNavigate}>
                  {m.link.label} →
                </Link>
              </>
            )}
          </li>
        ))}
        {thinking && (
          <li className="bubble bubble-wizard bubble-thinking">
            <span className="sr-only">The wizard is thinking</span>
            <span aria-hidden="true">· · ·</span>
          </li>
        )}
      </ol>

      {chips.length > 0 && (
        <div role="group" aria-label="Suggested questions" className="wizard-chips">
          {chips.map((topicId) => {
            const t = topicById.get(topicId);
            if (!t) return null;
            return (
              <button key={topicId} type="button" className="wizard-chip" onClick={() => askTopic(topicId)}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={onSubmit} className="wizard-form">
        <label htmlFor={`${idPrefix}-input`} className="wizard-label">
          Or ask your own question
        </label>
        <div className="wizard-row">
          <input
            ref={inputRef}
            id={`${idPrefix}-input`}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={200}
            autoComplete="off"
            enterKeyHint="send"
            placeholder="e.g. Would he move to the UK?"
            className="pixel-input"
          />
          <button type="submit" className="btn-pixel" aria-disabled={thinking || !input.trim() || undefined}>
            Ask ▶
          </button>
        </div>
      </form>
    </>
  );
});
