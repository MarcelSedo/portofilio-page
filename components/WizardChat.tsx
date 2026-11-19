"use client";

import { WIZARD_NAME } from "@/content/wizard";
import { WizardConversation } from "./wizard/WizardConversation";

/**
 * The wizard on the About page, shown inline.
 * Shares one conversation with the floating chat window (see WizardProvider).
 */
export function WizardChat() {
  return (
    <section aria-labelledby="wizard-title" className="wizard">
      <div className="wizard-portrait" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/forest/folk/wizard.png" alt="" width={30} height={46} />
      </div>

      <div className="wizard-panel">
        <div className="retro-titlebar" aria-hidden="true">
          <span>ask.the.wizard</span>
          <span className="retro-buttons">
            <i>_</i>
            <i>□</i>
            <i>×</i>
          </span>
        </div>

        <div className="wizard-body">
          <h2 id="wizard-title" className="wizard-title">
            Ask {WIZARD_NAME}
          </h2>
          <p className="wizard-sub">An old wizard who knows Marcel rather well. No AI, just old-fashioned spells.</p>
          <WizardConversation idPrefix="wizard-inline" />
        </div>
      </div>
    </section>
  );
}
