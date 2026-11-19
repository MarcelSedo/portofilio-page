import type { ReactNode } from "react";

/**
 * Renders note paragraphs with three tiny conventions, so content files stay plain strings:
 *  "## Heading"            → h2
 *  "“Quoted / verse”"      → blockquote, " / " becomes a line break
 *  "_Italic paragraph_"    → em
 *  newlines inside a paragraph become line breaks
 */
export function NoteBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="note-body">
      {paragraphs.map((p, i) => {
        if (p.startsWith("## ")) return <h2 key={i}>{p.slice(3)}</h2>;
        if (p.startsWith("“") && p.includes(" / ")) {
          return (
            <blockquote key={i}>
              <p>{withBreaks(p.split(" / "))}</p>
            </blockquote>
          );
        }
        if (p.startsWith("_") && p.endsWith("_")) {
          return (
            <p key={i}>
              <em>{p.slice(1, -1)}</em>
            </p>
          );
        }
        return <p key={i}>{withBreaks(p.split("\n"))}</p>;
      })}
    </div>
  );
}

function withBreaks(lines: string[]): ReactNode[] {
  return lines.flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));
}
