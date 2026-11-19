"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { fallback, greeting, startTopics, topics, type Topic } from "@/content/wizard";

/**
 * One conversation with the wizard for the whole site.
 * Lives in the root layout, so it survives page navigation and is shared by
 * the floating chat window and the inline chat on the About page.
 */

export type WizardMessage = { id: number; from: "wizard" | "you"; text: string; link?: Topic["link"] };

type WizardState = {
  messages: WizardMessage[];
  chips: string[];
  thinking: boolean;
  /** Ask a free-text question */
  ask: (question: string) => void;
  /** Ask one of the suggested topics */
  askTopic: (id: string) => void;
  /** Floating window */
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const WizardContext = createContext<WizardState | null>(null);

export const topicById = new Map(topics.map((t) => [t.id, t]));

/** lowercase, strip diacritics and punctuation */
const normalise = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9.+#\s-]/g, " ").replace(/\s+/g, " ").trim();

/** Pick the topic whose keywords match best. Multi-word keywords count double. */
function match(input: string): Topic | null {
  const text = ` ${normalise(input)} `;
  let best: Topic | null = null;
  let bestScore = 0;
  for (const t of topics) {
    let score = 0;
    for (const k of t.keywords) {
      const key = normalise(k);
      if (text.includes(` ${key} `) || (key.length > 4 && text.includes(key))) score += key.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return best;
}

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const nextId = useRef(1);
  const id = () => nextId.current++;

  const [messages, setMessages] = useState<WizardMessage[]>(() =>
    greeting.map((text) => ({ id: nextId.current++, from: "wizard" as const, text })),
  );
  const [chips, setChips] = useState<string[]>(startTopics);
  const [thinking, setThinking] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const busy = useRef(false);

  const reply = useCallback((question: string, topic: Topic | null) => {
    if (busy.current) return;
    busy.current = true;
    setMessages((m) => [...m, { id: id(), from: "you", text: question }]);
    setChips([]);
    setThinking(true);
    window.setTimeout(() => {
      const answer = topic ? (typeof topic.answer === "function" ? topic.answer() : topic.answer) : fallback.answer;
      setMessages((m) => [
        ...m,
        ...answer.map((text, i) => ({
          id: id(),
          from: "wizard" as const,
          text,
          link: topic && i === answer.length - 1 ? topic.link : undefined,
        })),
      ]);
      setChips(topic ? topic.next : fallback.next);
      setThinking(false);
      busy.current = false;
    }, 450);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WizardState>(
    () => ({
      messages,
      chips,
      thinking,
      ask: (q) => {
        const question = q.trim();
        if (question) reply(question, match(question));
      },
      askTopic: (topicId) => {
        const t = topicById.get(topicId);
        if (t) reply(t.label, t);
      },
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [messages, chips, thinking, isOpen, reply],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");
  return ctx;
}
