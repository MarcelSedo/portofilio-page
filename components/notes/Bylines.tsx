import { bylines, bylinesIntro } from "@/content/writing";
import { formatDate } from "@/content/notes";

const LANG = { sk: "Slovak", cs: "Czech" } as const;

/**
 * "Published elsewhere" on the Notes page: links to Marcel's articles in Slovak and Czech media.
 * - Each title is in English (translated); the original title is marked with lang="sk"/"cs",
 *   so screen readers pronounce it correctly.
 * - Links say in text that they lead to another site and language (not an icon alone).
 */
export function Bylines() {
  return (
    <section aria-labelledby="bylines-title" className="bylines">
      <h2 id="bylines-title" className="notes-h2">
        {bylinesIntro.title}
      </h2>
      <p className="notes-blurb">{bylinesIntro.lead}</p>

      <details className="bylines-primer">
        <summary>Who are these papers? A quick guide</summary>
        <ul>
          {bylinesIntro.primer.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </details>

      <ul className="bylines-list">
        {bylines.map((b) => (
          <li key={b.href} className="byline">
            <p className="byline-meta">
              <span className="byline-kind">{b.kind}</span>
              <span>
                <strong>{b.outlet}</strong>, {b.outletNote}
              </span>
              {b.kind !== "Papers" && b.kind !== "News" && <time dateTime={b.date}>{formatDate(b.date)}</time>}
            </p>
            <h3 className="byline-title">
              <a href={b.href} hrefLang={b.lang} target="_blank" rel="noreferrer">
                {b.title}
                <span className="sr-only">
                  {" "}
                  (in {LANG[b.lang]}, on {b.outlet}, opens in a new tab)
                </span>
              </a>
            </h3>
            {b.original !== b.outlet && (
              <p className="byline-original">
                Original title: <span lang={b.lang}>{b.original}</span>
              </p>
            )}
            <p className="byline-summary">{b.summary}</p>
            <p className="byline-lang" aria-hidden="true">
              In {LANG[b.lang]} ↗
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
