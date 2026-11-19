import { profile } from "@/content/profile";
import { FaGithub, FaLinkedin } from "react-icons/fa6";

function PixelEnvelope() {
  const flap = [[2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [7, 9], [8, 9], [9, 8], [10, 7], [11, 6], [12, 5], [13, 4]];
  return (
    <svg viewBox="0 0 16 16" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true">
      <path d="M1 3h14v1H1zM1 12h14v1H1zM1 4h1v8H1zM14 4h1v8h-1z" />
      {flap.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
      ))}
    </svg>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pixel-bar-top relative z-10 bg-[#0b1226]/95">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-8 md:grid-cols-3">
        <section aria-labelledby="footer-contact">
          <h2 id="footer-contact" className="m-0 mb-4 font-pixel text-xs text-amber">
            SEND A RAVEN
          </h2>
          <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
        <li>
            <a href={`mailto:${profile.links.email}`} className="icon-link" aria-label={`Email ${profile.name}`}>
            <PixelEnvelope />
            </a>
        </li>
        <li>
            <a href={profile.links.linkedin} className="icon-link" aria-label={`${profile.name} on LinkedIn`}>
            <FaLinkedin aria-hidden="true" />
            </a>
        </li>
        <li>
            <a href={profile.links.github} className="icon-link" aria-label={`${profile.name} on GitHub`}>
            <FaGithub aria-hidden="true" />
            </a>
        </li>
        </ul>
        <p className="m-0 mt-4 text-sm text-slate-300">
        or write to <a href={`mailto:${profile.links.email}`}>{profile.links.email}</a>
        </p>
        </section>

        <section aria-labelledby="footer-cv">
          <h2 id="footer-cv" className="m-0 mb-4 font-pixel text-xs text-amber">
            SAVE GAME
          </h2>
          <p className="m-0 mb-4 text-sm leading-relaxed text-slate-300">
            Prefer it the old-fashioned way? Take the whole adventure as a PDF.
          </p>
          <a
            href={profile.links.cvPdf}
            download
            className="pixel-badge inline-flex min-h-11 items-center bg-amber px-4 font-pixel text-[11px] !text-[#0b1226] no-underline hover:bg-amber-hover"
          >
            Download CV (PDF)
          </a>
        </section>

        <section aria-labelledby="footer-about">
          <h2 id="footer-about" className="m-0 mb-4 font-pixel text-xs text-amber">
            CREDITS
          </h2>
          <p className="m-0 text-sm leading-relaxed text-slate-300">
            Built with Next.js and Tailwind CSS. Designed to meet WCAG 2.1 AA: keyboard friendly,
            screen reader friendly, and calm with reduced motion.
          </p>
        </section>
      </div>

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-[#8a5a12] px-4 py-6 text-sm text-slate-400 sm:px-8">
        <p className="m-0">© {year} {profile.name}</p>
        <a href="#top" className="font-pixel text-[11px]">
          Back to top ▲
        </a>
      </div>
    </footer>
  );
}