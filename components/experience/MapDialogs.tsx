"use client";

import { useEffect, useRef } from "react";
import type { Place, Villager } from "@/content/experience-map";

/**
 * Native modal <dialog>: focus stays inside, the page behind is inert, Esc closes it.
 * The map puts focus back on the building or villager that opened it.
 */
function useModal(onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    // showModal focuses the first focusable thing; we want a specific one (React's autoFocus runs too early)
    d?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => d?.close();
  }, []);
  return {
    ref,
    onCancel: (e: React.SyntheticEvent) => {
      e.preventDefault(); // Esc: let React close it, so focus returns properly
      onClose();
    },
    onClick: (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) onClose(); // click on the backdrop
    },
  };
}

/** A building: the work history behind it, styled like the home page windows */
export function PlaceWindow({ place, onClose }: { place: Place; onClose: () => void }) {
  const modal = useModal(onClose);
  const titleId = `place-${place.id}-title`;
  return (
    <dialog {...modal} className="xmap-dialog xmap-window" aria-labelledby={titleId}>
      <div className="pixel-frame xmap-window-inner">
        <div className="xmap-window-head">
          <div>
            <p className="xmap-window-kicker">{place.building}</p>
            {/* focused when the window opens, so a screen reader starts with the title */}
            <h2 id={titleId} className="xmap-window-title" tabIndex={-1} data-autofocus>
              {place.banner}
            </h2>
          </div>
          <button type="button" className="xmap-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="xmap-window-intro">{place.intro}</p>

        {place.entries && (
          <ul className="xmap-entries">
            {place.entries.map((e) => (
              <li key={e.title + (e.org ?? "")}>
                <article className="xmap-entry">
                  <h3 className="xmap-entry-title">{e.title}</h3>
                  {(e.org || e.period) && (
                    <p className="xmap-entry-meta">
                      {e.org && <span>{e.org}</span>}
                      {e.period && <span>{e.period}</span>}
                      {e.type && <span>{e.type}</span>}
                    </p>
                  )}
                  <ul className="xmap-entry-points">
                    {e.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                  {e.tags && (
                    <ul className="xmap-tags" aria-label="Tools and skills">
                      {e.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  )}
                  {e.link && (
                    <p className="xmap-entry-link">
                      <a href={e.link.href} target="_blank" rel="noreferrer">
                        {e.link.label}
                        <span className="sr-only"> (opens in a new tab)</span> ↗
                      </a>
                    </p>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}

        {place.branches && (
          <div className="xmap-branches">
            {place.branches.map((b) => (
              <section key={b.name} className="xmap-branch" aria-labelledby={`branch-${b.name}`}>
                <h3 id={`branch-${b.name}`} className="xmap-branch-title">
                  {b.name}
                </h3>
                <ul>
                  {b.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <p className="xmap-window-foot">
          <button type="button" className="btn-pixel" onClick={onClose}>
            Back to the map
          </button>
        </p>
      </div>
    </dialog>
  );
}

/** A villager: an RPG text box at the bottom of the screen */
export function VillagerTalk({ villager, onClose }: { villager: Villager; onClose: () => void }) {
  const modal = useModal(onClose);
  const titleId = `talk-${villager.id}-title`;
  return (
    <dialog {...modal} className="xmap-dialog xmap-talkbox" aria-labelledby={titleId}>
      <div className="xmap-talkbox-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="xmap-talk-face" src={`/experience/villager-${villager.id}.png`} alt="" />
        <div className="xmap-talk-text">
          <h2 id={titleId} className="xmap-talk-name">
            {villager.name}
          </h2>
          {villager.lines.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <button type="button" className="btn-pixel xmap-talk-ok" onClick={onClose} data-autofocus>
          OK ▶
        </button>
      </div>
    </dialog>
  );
}
