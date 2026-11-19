"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { WIZARD_NAME } from "@/content/wizard";
import { WizardConversation } from "./WizardConversation";
import { useWizard } from "./WizardProvider";

// The About page has the wizard inline, so the floating button would only duplicate it
const INLINE_PAGES: string[] = [];

/**
 * Floating "Ask the wizard" button (bottom right, every page) + chat window.
 *
 * Accessibility:
 * - The window is a native modal <dialog>: focus stays inside, the page behind is inert,
 *   Esc closes it, and focus goes back to the button. No custom focus trap to get wrong.
 * - On a phone the window is full screen; on larger screens it docks above the button.
 * - The button has a visible text label from 640px up and an accessible name everywhere.
 * - html has scroll-padding-bottom, so a focused element is never hidden behind the button (WCAG 2.4.11).
 */
export function WizardLauncher() {
  const pathname = usePathname();
  const { isOpen, open, close } = useWizard();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const hidden = INLINE_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // keep the <dialog> in sync with state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
      // With a mouse, go straight to the question box. On touch screens that would pop up
      // the keyboard over the conversation, so focus the title and let people read first.
      const fine = window.matchMedia("(pointer: fine)").matches;
      (fine ? inputRef.current : titleRef.current)?.focus();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // navigating away (e.g. to the About page) closes the window
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (hidden) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="wizard-launcher"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="wizard-dialog"
        onClick={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/forest/folk/wizard.png" alt="" width={30} height={46} className="wizard-launcher-sprite" />
        <span className="wizard-launcher-text">Ask the wizard</span>
      </button>

      <dialog
        id="wizard-dialog"
        ref={dialogRef}
        className="wizard-dialog"
        aria-labelledby="wizard-dialog-title"
        // Esc and the close button both end up here
        onClose={() => {
          close();
          buttonRef.current?.focus();
        }}
        // click on the backdrop (outside the window) closes it
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="wizard-dialog-inner wizard-panel">
          <div className="retro-titlebar wizard-dialog-bar">
            <span aria-hidden="true">ask.the.wizard</span>
            <button type="button" className="wizard-dialog-close" onClick={close} aria-label="Close the chat">
              ×
            </button>
          </div>

          <div className="wizard-body wizard-dialog-body">
            <div className="wizard-dialog-head">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/forest/folk/wizard.png" alt="" width={30} height={46} className="wizard-dialog-portrait" />
              <div>
                <h2 id="wizard-dialog-title" ref={titleRef} tabIndex={-1} className="wizard-title">
                  Ask {WIZARD_NAME}
                </h2>
                <p className="wizard-sub">Knows Marcel rather well. No AI, just old-fashioned spells.</p>
              </div>
            </div>
            <WizardConversation ref={inputRef} idPrefix="wizard-floating" onNavigate={close} />
          </div>
        </div>
      </dialog>
    </>
  );
}
