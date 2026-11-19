/** Star rating: visual stars are hidden from screen readers, which get plain text instead. */
export function Rating({ value }: { value?: number | null }) {
  if (value == null) return null;
  return (
    <span className="note-rating">
      <span aria-hidden="true">
        {"★".repeat(value)}
        <span className="note-rating-off">{"★".repeat(5 - value)}</span>
      </span>
      <span className="sr-only">Rated {value} out of 5</span>
    </span>
  );
}
