// Shared shape for everything on the Notes page.

export type NoteCategory =  "accessibility" | "it" | "britain" | "film" | "books";

export const categories: { id: NoteCategory; label: string; blurb: string }[] = [
  { id: "accessibility", label: "Accessibility", blurb: "What I learn while making public services work for everyone." },
  { id: "it", label: "IT and programming", blurb: "Frontend, design systems and the occasional rabbit hole." },
  { id: "britain", label: "About Britain", blurb: "Letters, essays and small confessions of a Britophile." },
  { id: "film", label: "Film", blurb: "Notes on British films, series and adaptations of British classics." },
  { id: "books", label: "Books", blurb: "Reading notes on British literature, from Shakespeare to Ishiguro." },
];

export type Note = {
  /** URL segment: /notes/[slug] */
  slug: string;
  category: NoteCategory;
  kind: "Review" | "Reading note" | "Essay" | "Letter" | "Article";
  title: string;
  /** What the note is about (film, book, play) */
  subject?: {
    title: string;
    original?: string;
    creator?: string;
    year?: string;
    origin?: string;
  };
  /** 1–5, or null if not rated */
  rating?: number | null;
  /** ISO date when it was written, e.g. 2021-09-02 (leave out if unknown) */
  date?: string;
  excerpt: string;
  /** Paragraphs */
  body: string[];
  /** Where it was first published */
  source?: { label: string; href: string };
  /** Shown as a small note under the text */
  translatedFrom?: "Slovak" | "Czech";
};
