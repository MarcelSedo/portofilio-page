import { CATEGORY, type Clue } from "@/content/games/emma/types";

/** One clue, as a little card: what kind of clue it is, what it says, and where Emma thinks we go next. */
export function ClueFace({ clue, fresh = false, showNext = false }: { clue: Clue; fresh?: boolean; showNext?: boolean }) {
  const k = CATEGORY[clue.cat];
  return (
    <span className={`em-clue is-${clue.cat}`}>
      <span className="em-clue-seal">
        <span aria-hidden="true">{k.icon}</span> {k.label}
        {fresh && <span className="em-new">New</span>}
      </span>
      <span className="em-clue-text">{clue.text}</span>
      {showNext && clue.next && (
        <span className="em-clue-next">
          <span className="sr-only">Emma thinks: </span>
          {clue.next}
        </span>
      )}
    </span>
  );
}
