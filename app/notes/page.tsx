import type { Metadata } from "next";
import Link from "next/link";
import { Rating } from "@/components/notes/Rating";
import { categories, countIn, formatDate, shelves, type Note, type NoteCategory } from "@/content/notes";

export const metadata: Metadata = {
  title: "Notes – Marcel Šedo",
  description: "Letters about Britain, film reviews and reading notes on British literature, from Shakespeare to Ishiguro.",
};

type Props = { searchParams: Promise<{ category?: string }> };

/** How many notes each shelf shows before "Show more" in the All view */
const PREVIEW = 3;

export default async function NotesPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const active = categories.find((c) => c.id === category)?.id;
  const shown = active ? categories.filter((c) => c.id === active) : categories;
  const total = categories.reduce((sum, c) => sum + countIn(c.id), 0);

  return (
    <div className="notes mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-16 sm:px-8 sm:py-20">
      <header className="notes-intro">
        <p className="notes-kicker">The library</p>
        <h1 className="notes-h1">Notes</h1>
        <p className="notes-lead">
          Letters to Britain, film reviews and reading notes. Most of them I first wrote in Slovak on ČSFD and Databáze
          knih, and translated into English for this site.
        </p>
      </header>

      <nav aria-label="Note categories">
        <ul className="notes-filter">
          <li>
            <Link href="/notes" aria-current={!active ? "page" : undefined}>
              All <span className="notes-count">{total}</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/notes?category=${c.id}`} aria-current={active === c.id ? "page" : undefined}>
                {c.label} <span className="notes-count">{countIn(c.id)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {shown.map((c) => (
        <section key={c.id} aria-labelledby={`cat-${c.id}`} className="notes-section">
          <h2 id={`cat-${c.id}`} className="notes-h2">
            {c.label}
          </h2>
          <p className="notes-blurb">{c.blurb}</p>
          {/* "All": a short taste of each shelf. One category picked: everything. */}
          <CategoryList id={c.id} limit={active ? undefined : PREVIEW} />
        </section>
      ))}
    </div>
  );
}

function CategoryList({ id, limit }: { id: NoteCategory; limit?: number }) {
  const list = shelves[id];
  if (list.length === 0) return <p className="notes-empty">First notes are on their way.</p>;
  return (
    <>
      {list.map((shelf) => {
        const headingLevel = shelf.title ? 4 : 3;
        // never hide just one note behind a button
        const cut = limit && shelf.notes.length > limit + 1 ? limit : shelf.notes.length;
        const first = shelf.notes.slice(0, cut);
        const rest = shelf.notes.slice(cut);
        const what = (shelf.title || categories.find((c) => c.id === id)?.label || "notes").toLowerCase();
        return (
          <div key={shelf.title || id} className="notes-shelf">
            {shelf.title && <h3 className="notes-h3">{shelf.title}</h3>}
            <ul className="notes-list">
              {first.map((n) => (
                <li key={n.slug}>
                  <NoteCard note={n} headingLevel={headingLevel} />
                </li>
              ))}
            </ul>
            {rest.length > 0 && (
              /* Native disclosure: works without JavaScript, announced as expanded / collapsed,
                 and browsers open it by themselves when "Find in page" matches something inside. */
              <details className="notes-more">
                <summary>
                  <span className="notes-more-closed">
                    Show {rest.length} more <span className="sr-only">in {what}</span>
                  </span>
                  <span className="notes-more-open">
                    Show fewer <span className="sr-only">in {what}</span>
                  </span>
                </summary>
                <ul className="notes-list">
                  {rest.map((n) => (
                    <li key={n.slug}>
                      <NoteCard note={n} headingLevel={headingLevel} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </>
  );
}

function NoteCard({ note, headingLevel }: { note: Note; headingLevel: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  // The whole card is clickable through the title link (::after overlay); only one link per card for screen readers
  return (
    <article className="note-card">
      <p className="note-card-meta">
        <span>{note.kind}</span>
        {note.subject?.creator && <span>{note.subject.creator}</span>}
        {note.subject?.year && <span>{note.subject.year}</span>}
      </p>
      <Heading className="note-card-title">
        <Link href={`/notes/${note.slug}`}>{note.title}</Link>
      </Heading>
      <p className="note-card-excerpt">{note.excerpt}</p>
      <p className="note-card-foot">
        <Rating value={note.rating} />
        {note.date && <time dateTime={note.date}>{formatDate(note.date)}</time>}
      </p>
    </article>
  );
}
