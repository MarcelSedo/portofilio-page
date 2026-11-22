import { CATEGORY, type Clue } from "@/content/games/emma/types";
import { useT } from "./i18n";

/** One clue, as a little card: what kind of clue it is, what it says, and where Emma thinks we go next. */
export function ClueFace({ clue, fresh = false, showNext = false }: { clue: Clue; fresh?: boolean; showNext?: boolean }) {
  const T = useT();
  const k = { icon: CATEGORY[clue.cat].icon, label: T.cat[clue.cat].label };
  return (
    <span className={`em-clue is-${clue.cat}`}>
      <span className="em-clue-seal">
        <span aria-hidden="true">{k.icon}</span> {k.label}
        {fresh && <span className="em-new">{T.book.isNew}</span>}
      </span>
      <span className="em-clue-text">{clue.text}</span>
      {showNext && clue.next && (
        <span className="em-clue-next">
          <span className="sr-only">{T.book.thinks}</span>
          {clue.next}
        </span>
      )}
    </span>
  );
}
