"use client";

import { useEffect, useRef, useState } from "react";
import { folk, type FolkId } from "@/content/folk";
import { useFolk } from "./FolkProvider";

type Props = {
  id: FolkId;
  /** Which end of the window's top edge the character sits on */
  side?: "left" | "right";
};

/**
 * A forest character sitting on the top edge of a window.
 * Rendered only when the character can't be shown in the forest itself
 * (phones, tablets, or whenever a window covers its branch), so there's
 * never a second copy of the same button.
 *
 * Put it as the first child of an element with class "perch-host".
 * - It comes before the window in the DOM, so the focus order matches what you see.
 * - It sits in the gap above the window, away from the window's own controls
 *   (target size and spacing, WCAG 2.5.8).
 * - Same disclosure pattern as in the forest: aria-expanded, Esc / × / click outside closes,
 *   focus returns to the character.
 */
export function FolkPerch({ id, side = "left" }: Props) {
  const { offstage } = useFolk();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const f = folk.find((x) => x.id === id)!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  if (!offstage?.has(id)) return null;

  const scale = f.spriteW < 18 ? 3 : 2; // keep tiny sprites (the wisp) tappable and visible
  return (
    <div ref={wrapRef} className={`perch perch-${side}${open ? " is-open" : ""}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`folk-btn perch-btn${f.idle ? ` idle-${f.idle}` : ""}`}
        aria-label={f.label.replace(/ on the (upper|lower) branch| on the rock/, "")}
        aria-expanded={open}
        aria-controls={`perch-bubble-${id}`}
        onClick={() => setOpen((o) => !o)}
        style={{ width: f.spriteW * scale }}
      >
        <span className="folk-mark" aria-hidden="true">!</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/forest/folk/${id}.png`}
          alt=""
          width={f.spriteW}
          height={f.spriteH}
          className="folk-sprite"
          draggable={false}
        />
      </button>

      <div id={`perch-bubble-${id}`} className="folk-bubble perch-bubble" hidden={!open}>
        <p className="folk-name">{f.name}</p>
        <p className="folk-says">{f.says}</p>
        <button
          type="button"
          className="folk-close"
          aria-label="Close"
          onClick={() => {
            setOpen(false);
            buttonRef.current?.focus();
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
