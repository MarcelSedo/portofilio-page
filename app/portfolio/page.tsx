import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Bylines } from "@/components/notes/Bylines";
import { caseStudies, comingSoon, githubProfile, portfolioIntro, type Tile } from "@/content/portfolio";

export const metadata: Metadata = {
  title: "Portfolio – Marcel Šedo",
  description:
    "Selected work: ID‑SK, Slovakia's national design system; a non-profit's websites built solo; game levels for Diggy's Adventure; and writing for Slovak national media.",
};

const ext = { target: "_blank", rel: "noreferrer" } as const;
const NewTab = () => <span className="sr-only"> (opens in a new tab)</span>;

/** Use a screenshot only once its file is really in public/, so missing ones never show as broken images. */
function hasFile(src?: string) {
  return !!src && fs.existsSync(path.join(process.cwd(), "public", src));
}
function picture(t: Tile) {
  if (hasFile(t.image)) return t.image;
  if (t.youtube) return `https://i.ytimg.com/vi/${t.youtube}/hqdefault.jpg`;
  return undefined;
}
const GLYPH: Record<Tile["kind"], string> = {
  site: "www",
  design: "◆◇",
  docs: "{ }",
  package: "npm",
  code: "</>",
  video: "▶",
};
function host(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

function Shot({ src, kind }: { src?: string; kind: Tile["kind"] }) {
  return (
    <span className="pf-shot" aria-hidden="true">
      <span className="pf-shot-bar">
        <i />
        <i />
        <i />
      </span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <span className="pf-shot-empty">{GLYPH[kind]}</span>
      )}
      {kind === "video" && <span className="pf-shot-play">▶</span>}
    </span>
  );
}

export default function PortfolioPage() {
  return (
    <div className="pf mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-16 sm:px-8 sm:py-20">
      <header className="hero-frame p-6 sm:p-8">
        <p className="pf-kicker">Selected work</p>
        <h1 className="pf-h1">{portfolioIntro.title}</h1>
        <p className="pf-lead">{portfolioIntro.lead}</p>
        <nav aria-label="On this page" className="pf-toc">
          <ul>
            {caseStudies.map((c) => (
              <li key={c.id}>
                <a href={`#${c.id}`}>{c.kicker.split(" · ")[0]}</a>
              </li>
            ))}
            <li>
              <a href="#play">Play</a>
            </li>
            <li>
              <a href="#writing">Writing</a>
            </li>
          </ul>
        </nav>
      </header>

      {caseStudies.map((c) => (
        <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="pixel-frame pf-case scroll-mt-6">
          <div className="pf-case-head">
            <div>
              <p className="pf-kicker">{c.kicker}</p>
              <h2 id={`${c.id}-title`} className="pf-h2">
                {c.title}
              </h2>
              <p className="pf-meta">
                <span>{c.role}</span>
                <span>{c.period}</span>
              </p>
              <p className="pf-summary">{c.summary}</p>
            </div>
            <div className="pf-did-box">
              <h3 className="pf-h3">What was mine</h3>
              <ul className="pf-did">
                {c.did.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3 className="pf-h3">{c.tilesHeading}</h3>
          <ul className={`pf-tiles ${c.tiles.length === 3 ? "is-three" : c.tiles.length === 5 ? "is-five" : ""}`}>
            {c.tiles.map((t) => (
              <li key={t.href}>
                <a href={t.href} {...ext} className="pf-tile">
                  <Shot src={picture(t)} kind={t.kind} />
                  <span className="pf-tile-text">
                    <span className="pf-tile-label">
                      {t.label} ↗
                      <NewTab />
                    </span>
                    {t.note && <span className="pf-tile-note">{t.note}</span>}
                    <span className="pf-tile-host">{t.kind === "video" ? "YouTube" : host(t.href)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <ul className="pf-tags" aria-label="Tools and skills">
            {c.tags.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      ))}

      <section id="play" aria-labelledby="play-title" className="pf-play scroll-mt-6">
        <h2 id="play-title" className="sr-only">
          Play and code
        </h2>
        <a href={comingSoon.href} className="pf-card pixel-frame">
          <Shot src={hasFile(comingSoon.image) ? comingSoon.image : undefined} kind="code" />
          <span className="pf-card-body">
            <span className="pf-kicker">Small game · Playable here</span>
            <span className="pf-card-title">{comingSoon.title} ▶</span>
            <span className="pf-card-text">{comingSoon.text}</span>
          </span>
        </a>
        <a href={githubProfile.href} {...ext} className="pf-card pixel-frame">
          <Shot kind="code" />
          <span className="pf-card-body">
            <span className="pf-kicker">Code</span>
            <span className="pf-card-title">
              {githubProfile.label} ↗<NewTab />
            </span>
            <span className="pf-card-text">My own repositories and small experiments.</span>
          </span>
        </a>
      </section>

      <div id="writing" className="scroll-mt-6">
        <Bylines />
      </div>
    </div>
  );
}
