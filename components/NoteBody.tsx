import type { ReactNode } from "react";

/**
 * Renders note paragraphs with a few tiny conventions, so content files stay plain strings:
 *  "## Heading"            → h2
 *  "```scss\n…code…"       → code block (language after the backticks is optional)
 *  "- item\n- item"        → bulleted list
 *  "“Quoted / verse”"      → blockquote, " / " becomes a line break
 *  "_Italic paragraph_"    → em
 *  `inline code`           → code, anywhere in a paragraph or list item
 *  [text](https://…)       → link, anywhere in a paragraph or list item
 *  newlines inside a paragraph become line breaks
 */
export function NoteBody({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="note-body">
      {paragraphs.map((p, i) => {
        if (p.startsWith("## ")) return <h2 key={i}>{p.slice(3)}</h2>;
        if (p.startsWith("```")) {
          const [first, ...rest] = p.split("\n");
          const lang = first.slice(3).trim();
          const code = rest.join("\n").replace(/\n?```$/, "");
          return (
            <pre key={i} className="note-code" tabIndex={0} aria-label={lang ? `${lang.toUpperCase()} code example` : "Code example"}>
              <code>{code}</code>
            </pre>
          );
        }
        if (p.startsWith("- ")) {
          return (
            <ul key={i}>
              {p.split("\n").map((li, j) => (
                <li key={j}>{inline(li.replace(/^- /, ""))}</li>
              ))}
            </ul>
          );
        }
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
        return <p key={i}>{withBreaks(p.split("\n").map((line) => inline(line)))}</p>;
      })}
    </div>
  );
}

/** `code` spans, **strong** text and [links](url) inside a line */
function inline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) return <a key={i} href={link[2]} rel="noopener">{link[1]}</a>;
    return part;
  });
}

function withBreaks(lines: ReactNode[]): ReactNode[] {
  return lines.flatMap((line, i) => (i === 0 ? [line] : [<br key={`br${i}`} />, line]));
}
