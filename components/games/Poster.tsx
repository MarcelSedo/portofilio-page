import { memo } from "react";
import type { Kind } from "@/content/games/britain";
import { cardArt } from "./cardArt";
import { H, W, type Motif } from "./poster";

/** A decorative pixel picture for a card. Hidden from screen readers: the card's text says everything. */
export const Poster = memo(function Poster({ id, kind, motif }: { id: string; kind: Kind; motif?: Motif }) {
  const rects = cardArt(id, kind, motif);
  return (
    <svg
      className={`tt-poster is-${kind}`}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid slice"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.c} />
      ))}
    </svg>
  );
});
