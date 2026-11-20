import type { Metadata } from "next";
import { Bylines } from "@/components/notes/Bylines";
import { caseStudies, comingSoon, diggyVideos, githubProfile, portfolioIntro } from "@/content/portfolio";

export const metadata: Metadata = {
  title: "Portfolio – Marcel Šedo",
  description:
    "Selected work: ID‑SK, Slovakia's national design system; a non-profit's websites built solo; game levels for Diggy's Adventure; and writing for Slovak national media.",
};

const ext = { target: "_blank", rel: "noreferrer" } as const;
const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

export default function PortfolioPage() {
  return (
    <div className="pf mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16 sm:px-8 sm:py-20">
      <header className="hero-frame p-6 sm:p-8">
        <p className="pf-kicker">Selected work</p>
        <h1 className="pf-h1">{portfolioIntro.title}</h1>
        <p className="pf-lead">{portfolioIntro.lead}</p>
        <nav aria-label="On this page" className="pf-toc">
          <ul>
            {caseStudies.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.title}</a>
              </li>
            ))}
            <li>
              <a href="#writing">Writing</a>
            </li>
          </ul>
        </nav>
      </header>

      {caseStudies.map((c) => (
        <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="pixel-frame pf-case scroll-mt-6">
          <p className="pf-kicker">{c.kicker}</p>
          <h2 id={`${c.id}-title`} className="pf-h2">
            {c.title}
          </h2>
          <p className="pf-meta">
            <span>{c.role}</span>
            <span>{c.period}</span>
          </p>
          <p className="pf-summary">{c.summary}</p>

          <h3 className="pf-h3">What was mine</h3>
          <ul className="pf-did">
            {c.did.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>

          {c.id === "diggy" && (
            <>
              <h3 className="pf-h3">Watch the levels</h3>
              <ul className="pf-videos">
                {diggyVideos.map((v) => (
                  <li key={v.href}>
                    <a href={v.href} {...ext} className="pf-video">
                      <span className="pf-video-play" aria-hidden="true">
                        ▶
                      </span>
                      <span>
                        <span className="pf-video-title">{v.title}</span>
                        <span className="pf-video-what">{v.what}</span>
                        <span className="pf-video-where">YouTube</span>
                      </span>
                      <NewTab />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}

          {c.links.length > 0 && (
            <>
              <h3 className="pf-h3">See it live</h3>
              <ul className="pf-links">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} {...ext}>
                      {l.label} ↗
                      <NewTab />
                    </a>
                    {l.note && <span className="pf-link-note">{l.note}</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <ul className="pf-tags" aria-label="Tools and skills">
            {c.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ))}

      <section aria-labelledby="soon-title" className="pf-soon">
        <h2 id="soon-title" className="pf-h2">
          {comingSoon.title}
        </h2>
        <p>{comingSoon.text}</p>
        <p>
          <a href={comingSoon.href} className="btn-pixel">
            Play Time Traveller ▶
          </a>
        </p>
      </section>

      <div id="writing" className="scroll-mt-6">
        <Bylines />
      </div>
    </div>
  );
}
