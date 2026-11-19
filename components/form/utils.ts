export const cx = (...classes: (string | false | null | undefined)[]) => classes.filter(Boolean).join(" ");

/** Join ids for aria-describedby, skipping empty ones. */
export const mergeIds = (...ids: (string | false | null | undefined)[]) => ids.filter(Boolean).join(" ") || undefined;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
