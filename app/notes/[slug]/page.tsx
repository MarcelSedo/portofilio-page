import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteBody } from "@/components/notes/NoteBody";
import { Rating } from "@/components/notes/Rating";
import { allNotes, categories, formatDate, getNote, neighbours } from "@/content/notes";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allNotes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const note = getNote((await params).slug);
  if (!note) return {};
  return { title: `${note.title} – Notes – Marcel Šedo`, description: note.excerpt };
}

export default async function NotePage({ params }: Props) {
  const note = getNote((await params).slug);
  if (!note) notFound();

  const category = categories.find((c) => c.id === note.category)!;
  const { prev, next } = neighbours(note);
  const s = note.subject;

  return (
    <div className="notes mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16 sm:px-8 sm:py-20">
      <nav aria-label="Breadcrumb">
        <ol className="notes-crumbs">
          <li>
            <Link href="/notes">Notes</Link>
          </li>
          <li>
            <Link href={`/notes?category=${category.id}`}>{category.label}</Link>
          </li>
          <li aria-current="page">{note.title}</li>
        </ol>
      </nav>

      <article className="note-paper" lang="en">
        <header>
          <p className="note-kind">{note.kind}</p>
          <h1 className="note-title">{note.title}</h1>

          {(s || note.rating != null || note.date) && (
            <dl className="note-facts">
              {s?.original && (
                <div>
                  <dt>Original title</dt>
                  <dd>{s.original}</dd>
                </div>
              )}
              {s?.creator && (
                <div>
                  <dt>{note.category === "film" ? "Director" : "By"}</dt>
                  <dd>{s.creator}</dd>
                </div>
              )}
              {s?.year && (
                <div>
                  <dt>Year</dt>
                  <dd>{s.year}</dd>
                </div>
              )}
              {s?.origin && (
                <div>
                  <dt>Made in</dt>
                  <dd>{s.origin}</dd>
                </div>
              )}
              {note.rating != null && (
                <div>
                  <dt>My rating</dt>
                  <dd>
                    <Rating value={note.rating} />
                  </dd>
                </div>
              )}
              {note.date && (
                <div>
                  <dt>Written</dt>
                  <dd>
                    <time dateTime={note.date}>{formatDate(note.date)}</time>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </header>

        <NoteBody paragraphs={note.body} />

        {(note.translatedFrom || note.source) && (
          <footer className="note-source">
            {note.translatedFrom && <p>Translated from {note.translatedFrom}.</p>}
            {note.source && (
              <p>
                <a href={note.source.href} rel="noopener">
                  {note.source.label}
                </a>
              </p>
            )}
          </footer>
        )}
      </article>

      {(prev || next) && (
        <nav aria-label={`More in ${category.label}`} className="note-pager">
          {prev ? (
            <Link href={`/notes/${prev.slug}`} className="note-pager-link">
              <span className="note-pager-dir">← Previous</span>
              {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={`/notes/${next.slug}`} className="note-pager-link note-pager-next">
              <span className="note-pager-dir">Next →</span>
              {next.title}
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
