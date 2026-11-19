"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FOREST_IMAGE, folk, type FolkId } from "@/content/folk";
import { useFolk } from "./folk/FolkProvider";

// Pages that should stay calm: no forest, one primary action
const PLAIN_PAGES = ["/contact", "/about", "/notes", "/experience"];
/**
 * The forest background + clickable characters.
 * - The scene sits at the bottom of the page wrapper, full width, keeping the image's aspect ratio.
 * - Each character is a real <button> (disclosure pattern): aria-expanded + aria-controls.
 * - The speech bubble closes with Esc, the × button or a click outside; focus returns to the character.
 * - Characters the page is too short to show, or that a window covers, are taken out of the forest,
 *   so nobody lands on something invisible. Pages can offer them a <FolkPerch> on a window instead.
 */
export function ForestScene() {
  const pathname = usePathname();
  const [open, setOpen] = useState<FolkId | null>(null);
  const [announce, setAnnounce] = useState("");
  const [hidden, setHidden] = useState<Set<FolkId>>(new Set());
  /**
   * "scene": the page is about as tall as the picture, so the forest scrolls with the page
   *          and the characters stand on its branches.
   * "backdrop": the page is longer (phones, long pages). The picture becomes a fixed backdrop
   *          that always fills the screen, and the characters move to perches on the windows.
   */
  const [mode, setMode] = useState<"scene" | "backdrop">("scene");
  const { setOffstage } = useFolk();
  const sceneRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<FolkId, HTMLButtonElement | null>>>({});

  const close = useCallback((returnFocus: boolean) => {
    setOpen((current) => {
      if (current && returnFocus) buttons.current[current]?.focus();
      return null;
    });
  }, []);

  // Take out characters that are cut off at the top or bottom, or covered by the page content
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    const wrap = scene?.parentElement;
    if (!scene || !wrap) return;
    const update = () => {
      const sceneW = scene.offsetWidth;
      const sceneH = scene.offsetHeight;
      const visibleH = wrap.offsetHeight;
      // a page more than 15 % longer than the picture would show a big empty band above it
      const long = visibleH > sceneH * 1.15;
      setMode(long ? "backdrop" : "scene");
      if (long) {
        const all = new Set(folk.map((f) => f.id));
        setHidden((prev) => (prev.size === all.size ? prev : all));
        setOffstage(all);
        return;
      }
      const cut = (sceneH - visibleH) / 2; // px hidden at the top (and at the bottom); negative = no cut
      const header = 96; // keep characters clear of the site header
      const from = cut + header;
      const to = cut + visibleH;

      // everything people read or click, in scene coordinates
      const s = scene.getBoundingClientRect();
      const blocks = [...wrap.querySelectorAll<HTMLElement>(
          // site header + the visible boxes on the page (cards, panels, forms), not their wide wrappers,
          // so characters in the empty parts of a layout (e.g. the cik-cak) stay in the forest
          ".scene-wrap > header, .scene-wrap > a, .scene-main > header, .scene-main > a, #main :is(header, section, article, aside, form, nav > *, .perch-host, .perch)",
        )]
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ left: r.left - s.left, right: r.right - s.left, top: r.top - s.top, bottom: r.bottom - s.top }));
      const pad = 12; // the hit area and the "!" marker reach a little beyond the sprite

      const next = new Set<FolkId>();
      for (const f of folk) {
        const charLeft = (f.left / 100) * sceneW;
        const charW = (f.width / 100) * sceneW;
        const charTop = (f.top / 100) * sceneH;
        const charH = charW * (f.spriteH / f.spriteW);
        const box = { left: charLeft - pad, right: charLeft + charW + pad, top: charTop - 22 - pad, bottom: charTop + charH + pad };
        const covered = blocks.some((b) => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
        if (covered || charTop < from || charTop + charH > to) next.add(f.id);
      }
      setHidden((prev) => (prev.size === next.size && [...next].every((x) => prev.has(x)) ? prev : next));
      setOffstage(next);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(scene);
    const main = document.getElementById("main");
    if (main) ro.observe(main);
    return () => ro.disconnect();
  }, [pathname, setOffstage]);

  // Esc and click outside
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element).closest?.(".folk")) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  const toggle = (id: FolkId) => {
    const f = folk.find((x) => x.id === id)!;
    if (open === id) {
      setOpen(null);
    } else {
      setOpen(id);
      setAnnounce(`${f.name} says: ${f.says}`);
    }
  };

  if (PLAIN_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;

  return (
    <>
    {/* decorative, fixed behind long pages; .scene-wrap clips it so it never covers the footer */}
    {mode === "backdrop" && (
      <div className="forest-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${FOREST_IMAGE.src})` }} />
    )}
    <div
      ref={sceneRef}
      className={`forest-scene${mode === "backdrop" ? " is-backdrop" : ""}`}
      style={{
        aspectRatio: `${FOREST_IMAGE.width} / ${FOREST_IMAGE.height}`,
        backgroundImage: mode === "scene" ? `url(${FOREST_IMAGE.src})` : undefined,
      }}
    >
      <section aria-labelledby="folk-title">
        <h2 id="folk-title" className="sr-only">
          Forest folk: ask a character for a fun fact about Marcel
        </h2>
        <ul className="m-0 list-none p-0">
          {folk.map((f) => {
            const isOpen = open === f.id;
            if (hidden.has(f.id)) return null;
            return (
              <li
                key={f.id}
                className={`folk${isOpen ? " is-open" : ""}`}
                style={{ left: `${f.left}%`, top: `${f.top}%`, width: `${f.width}%` }}
              >
                <button
                  ref={(el) => {
                    buttons.current[f.id] = el;
                  }}
                  type="button"
                  className={`folk-btn${f.idle ? ` idle-${f.idle}` : ""}`}
                  aria-label={f.label}
                  aria-expanded={isOpen}
                  aria-controls={`folk-bubble-${f.id}`}
                  onClick={() => toggle(f.id)}
                >
                  <span className="folk-mark" aria-hidden="true">!</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/forest/folk/${f.id}.png`}
                    alt=""
                    width={f.spriteW}
                    height={f.spriteH}
                    className="folk-sprite"
                    draggable={false}
                  />
                </button>

                <div id={`folk-bubble-${f.id}`} className={`folk-bubble bubble-${f.bubble}`} hidden={!isOpen}>
                  <p className="folk-name">{f.name}</p>
                  <p className="folk-says">{f.says}</p>
                  <button type="button" className="folk-close" aria-label="Close" onClick={() => close(true)}>
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <p role="status" aria-live="polite" className="sr-only">
          {announce}
        </p>
      </section>
    </div>
    </>
  );
}
