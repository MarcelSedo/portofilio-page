import { memo } from "react";
import { H, W, poster, type Motif } from "./poster";

/** A decorative pixel poster. Hidden from screen readers: the card's text says everything. */
export const Poster = memo(function Poster({ id, motif }: { id: string; motif: Motif }) {
  const rects = poster(id, motif);
  return (
    <svg
      className="tt-poster"
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
