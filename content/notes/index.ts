// Everything on /notes, in one list.
import { categories, type Note, type NoteCategory } from "./types";
import { britainNotes } from "./britain";
import { itNotes } from "./it";
import { accessibilityNotes } from "./accessibility";
import { filmNotes } from "./films";
import { novelNotes } from "./books-novels";
import { shakespeareNotes1, shakespeareStudyNotes } from "./books-shakespeare-1";
import { shakespeareNotes2 } from "./books-shakespeare-2";
import { shakespeareNotes3 } from "./books-shakespeare-3";
import { shakespeareNotes4 } from "./books-shakespeare-4";
import { shakespeareNotes5 } from "./books-shakespeare-5";

export { categories };
export type { Note, NoteCategory };

/** Optional sub-groups inside a category ("shelves") */
export type Shelf = { title: string; notes: Note[] };

const byDateDesc = (a: Note, b: Note) => (b.date ?? "").localeCompare(a.date ?? "");
const byTitle = (a: Note, b: Note) => a.title.localeCompare(b.title, "en");

const shakespearePlays = [
  ...shakespeareNotes1,
  ...shakespeareNotes2,
  ...shakespeareNotes3,
  ...shakespeareNotes4,
  ...shakespeareNotes5,
];

export const shelves: Record<NoteCategory, Shelf[]> = {
  accessibility: [{ title: "", notes: [...accessibilityNotes].sort(byDateDesc) }],
  it: [{ title: "", notes: [...itNotes].sort(byDateDesc) }],
  britain: [{ title: "", notes: [...britainNotes] }],
  film: [
    { title: "Film diary", notes: [...filmNotes].sort(byDateDesc) },
  ],
  books: [
    { title: "Novels", notes: [...novelNotes].sort(byTitle) },
    { title: "Shakespeare, play by play", notes: [...shakespearePlays].sort(byTitle) },
    { title: "On Shakespeare and his theatre", notes: [...shakespeareStudyNotes].sort(byTitle) },
  ],
};

export const allNotes: Note[] = categories.flatMap((c) => shelves[c.id].flatMap((s) => s.notes));

export const getNote = (slug: string) => allNotes.find((n) => n.slug === slug);

export const countIn = (category: NoteCategory) => shelves[category].reduce((sum, s) => sum + s.notes.length, 0);

/** Previous / next note within the same category, in display order */
export function neighbours(note: Note) {
  const list = shelves[note.category].flatMap((s) => s.notes);
  const i = list.findIndex((n) => n.slug === note.slug);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i < list.length - 1 ? list[i + 1] : undefined };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

// Guard against duplicate slugs while editing
if (process.env.NODE_ENV !== "production") {
  const seen = new Set<string>();
  for (const n of allNotes) {
    if (seen.has(n.slug)) console.warn(`[notes] duplicate slug: ${n.slug}`);
    seen.add(n.slug);
  }
}
