import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import { FolkPerch } from "@/components/folk/FolkPerch";

export const metadata: Metadata = { title: "Quest Log – Marcel Šedo" };

/*
 * Zig-zag layout: the cards are signposts that alternate sides,
 * so the middle stays clear for the tall pixel-art forest behind them.
 *
 * The forest folk: when a card covers one of them (phone, tablet…), it sits on the card's top edge (FolkPerch).
 * A figure always sits OUTSIDE the card's link, never inside it (an interactive element inside another is an error).
 */

// A card = the RPG window from globals.css (.quest-card: orange pixel frame,
// hover / active / focus states, respects prefers-reduced-motion).
const cardBase = "quest-card flex w-full flex-col p-7 no-underline";

const h2 = "m-0 mb-3 font-pixel text-base leading-relaxed tracking-wide text-amber contrast-more:text-white";
const textMuted = "m-0 text-sm leading-relaxed text-slate-300 contrast-more:text-slate-100";
// the call to action looks like a button, but it is only text inside the link (aria-hidden: the card has the name)
const cta = "quest-cta mt-6 self-start px-3 py-2 font-pixel text-[11px] !text-[#0b1226]";

// The card's wrapper: its width and side (zig-zag), and room for a figure
const left = "perch-host perch-roomy w-full md:w-5/12 self-start";
const right = "perch-host perch-roomy w-full md:w-5/12 self-end";

export default function QuestLog() {
  return (
    // a <div>, not <main>: <main id="main"> is already in the layout, and a page has only one
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-8 sm:py-24">
      {/* The header: full width but compact (the character's opening screen) */}
      <div className="perch-host mb-24">
        <FolkPerch id="elf" side="left" />
        <header className="hero-frame flex flex-col items-center p-8 text-center">
          <h1 className="m-0 text-4xl font-bold text-white md:text-5xl">{profile.name}</h1>
          <p className="mt-3 font-pixel text-sm leading-relaxed text-amber">{profile.className}</p>
          <p className="mt-4 max-w-2xl text-slate-300 leading-relaxed">
            I build accessible design systems for Slovakia&apos;s public services, and small browser games that have
            something to say.
          </p>
        </header>
      </div>

      {/* Signposts: zig-zag with flex and self-start / self-end */}
      <nav aria-label="Where to go" className="flex w-full flex-col gap-24 md:gap-32">
        {/* Left: experience */}
        <div className={left}>
          <FolkPerch id="knight" side="right" />
          <Link href="/experience" className={cardBase} aria-labelledby="nav-exp">
            <h2 id="nav-exp" className={h2}>EXPERIENCE</h2>
            <p className={textMuted}>
              From databases and level design to accessible public services: the ID-SK design system, aligned with
              GOV.UK, and the React library behind it.
            </p>
            <span className={cta} aria-hidden="true">
              Open the quest log →
            </span>
          </Link>
        </div>

        {/* Right: the games (there is no fifth figure in the forest, so this card has none) */}
        <div className={right}>
          <Link href="/portfolio" className={cardBase} aria-labelledby="nav-games">
            <h2 id="nav-games" className={h2}>GAMES & PORTFOLIO</h2>
            <p className={textMuted}>
              Browser games I designed and built end to end, art and all: The Long Spring, Emma, Time Traveller and
              more. Every one is playable here.
            </p>
            <span className={cta} aria-hidden="true">
              Play →
            </span>
          </Link>
        </div>

        {/* Left: about */}
        <div className={left}>
          <FolkPerch id="fairy" side="right" />
          <Link href="/about" className={cardBase} aria-labelledby="nav-about">
            <h2 id="nav-about" className={h2}>ABOUT</h2>
            <p className={textMuted}>
              Who is behind the code: a philosopher, a former level designer and an incurable Britophile. A love letter to
              Britain, and a quiz.
            </p>
            <span className={cta} aria-hidden="true">
              Meet the character →
            </span>
          </Link>
        </div>

        {/* Right: notes */}
        <div className={right}>
          <FolkPerch id="traveller" side="left" />
          <Link href="/notes" className={cardBase} aria-labelledby="nav-notes">
            <h2 id="nav-notes" className={h2}>NOTES</h2>
            <p className={textMuted}>
              Letters about Britain, film reviews and reading notes on British literature, from Shakespeare to Ishiguro.
            </p>
            <span className={cta} aria-hidden="true">
              Read the notes →
            </span>
          </Link>
        </div>

        {/* Left: contact */}
        <div className={left}>
          <FolkPerch id="wisp" side="right" />
          <Link href="/contact" className={cardBase} aria-labelledby="nav-contact">
            <h2 id="nav-contact" className={h2}>CONTACT</h2>
            <p className={textMuted}>
              A role, a project, or a question about web accessibility: send a raven.
            </p>
            <span className={cta} aria-hidden="true">
              Get in touch →
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
