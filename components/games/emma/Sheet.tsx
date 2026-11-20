"use client";

import { useEffect, useRef } from "react";

/**
 * A bottom sheet on phones, a centred card on bigger screens. Native <dialog>:
 * focus stays inside, Esc closes, the rest of the page is inert. Focus goes back
 * to whatever opened it.
 */
export function Sheet({
  open,
  onClose,
  labelledBy,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      requestAnimationFrame(() => d.querySelector<HTMLElement>("[data-autofocus]")?.focus());
    }
    if (!open && d.open) {
      d.close();
      const back = opener.current;
      requestAnimationFrame(() => back?.isConnected && back.focus());
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`em-sheet${wide ? " is-wide" : ""}`}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // tap on the backdrop
      }}
    >
      {open && <div className="em-sheet-body">{children}</div>}
    </dialog>
  );
}
