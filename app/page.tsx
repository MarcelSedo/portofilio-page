import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";
import { FolkPerch } from "@/components/folk/FolkPerch";

export const metadata: Metadata = { title: "Quest Log – Marcel Šedo" };

/*
 * Cik-Cak rozloženie (Zig-Zag layout).
 * Karty sú interaktívne "rázcestníky" (teasers), ktoré striedajú strany.
 * Stred zostáva voľný pre vyniknutie vertikálneho pixel art pozadia.
 *
 * Postavičky z lesa: keď ich v lese zakryje karta (mobil, tablet…), sadnú si
 * na hornú hranu karty (FolkPerch). Postavička je vždy MIMO odkazu karty,
 * nikdy nie vnorená do neho (interaktívny prvok v interaktívnom prvku je chyba).
 */

// Karta = tvoje RPG okno z globals.css (.quest-card: oranžový pixelový rámik,
// hover / active / focus stavy, rešpektuje prefers-reduced-motion).
const cardBase = "quest-card flex w-full flex-col p-7 no-underline";

const h2 = "m-0 mb-3 font-pixel text-base leading-relaxed tracking-wide text-amber contrast-more:text-white";
const textMuted = "m-0 text-sm leading-relaxed text-slate-300 contrast-more:text-slate-100";
// výzva vyzerá ako tlačidlo, ale je to len text vnútri odkazu (aria-hidden, názov má karta)
const cta = "quest-cta mt-6 self-start px-3 py-2 font-pixel text-[11px] !text-[#0b1226]";

// Obal karty: nesie šírku a stranu (cik-cak) + miesto pre postavičku
const left = "perch-host perch-roomy w-full md:w-5/12 self-start";
const right = "perch-host perch-roomy w-full md:w-5/12 self-end";

export default function QuestLog() {
  const { intro } = profile;

  return (
    // <div>, nie <main>: <main id="main"> už je v layoute a stránka má mať len jeden
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-8 sm:py-24">

      {/* Hlavička - Plná šírka, ale kompaktná (Úvodná obrazovka postavy) */}
      <div className="perch-host mb-24">
        <FolkPerch id="elf" side="left" />
        <header className="hero-frame flex flex-col items-center p-8 text-center">
          <h1 className="m-0 text-4xl font-bold text-white md:text-5xl">{profile.name}</h1>
          <p className="mt-3 font-pixel text-sm leading-relaxed text-amber">{profile.className}</p>
          <p className="mt-4 max-w-2xl text-slate-300 leading-relaxed">
            {intro.mainQuest}
          </p>
        </header>
      </div>

      {/* Rázcestníky - Cik-cak rozloženie cez flex a self-start / self-end */}
      <nav aria-label="Hlavné menu dobrodružstva" className="flex w-full flex-col gap-24 md:gap-32">

        {/* Ľavá strana: Skúsenosti */}
        <div className={left}>
          <FolkPerch id="knight" side="right" />
          <Link href="/experience" className={cardBase} aria-labelledby="nav-exp">
            <h2 id="nav-exp" className={h2}>EXPERIENCE</h2>
            <p className={textMuted}>
              Preskúmaj moju cestu od správy databáz a level dizajnu až po aktuálne pôsobenie
              v oblasti prístupnosti webov a dizajnových systémov vo verejnej správe.
            </p>
            <span className={cta} aria-hidden="true">
              Zobraziť quest log →
            </span>
          </Link>
        </div>

        {/* Pravá strana: Vedľajšie úlohy (Side Quests) */}
        <div className={right}>
          <FolkPerch id="fairy" side="left" />
          <Link href="/side-quests" className={cardBase} aria-labelledby="nav-side">
            <h2 id="nav-side" className={h2}>SIDE QUESTS</h2>
            <p className={textMuted}>
              Projekty z vášne. Od vývoja indie hier, cez naratívny storytelling, až po
              výskum v oblasti fenomenológie a estetiky.
            </p>
            <span className={cta} aria-hidden="true">
              Preskúmať lokality →
            </span>
          </Link>
        </div>

        {/* Ľavá strana: Schopnosti a Inventár */}
        <div className={left}>
          <FolkPerch id="traveller" side="right" />
          <Link href="/skills" className={cardBase} aria-labelledby="nav-skills">
            <h2 id="nav-skills" className={h2}>SKILLS & INVENTORY</h2>
            <p className={textMuted}>
              Technologický stack, WCAG štandardy, React, Next.js a nástroje,
              ktoré nosím vo svojom vývojárskom inventári.
            </p>
            <span className={cta} aria-hidden="true">
              Otvor inventár →
            </span>
          </Link>
        </div>

        {/* Pravá strana: Vzdelanie a certifikáty */}
        <div className={right}>
          <FolkPerch id="wisp" side="left" />
          <Link href="/education" className={cardBase} aria-labelledby="nav-edu">
            <h2 id="nav-edu" className={h2}>LORE & EDUCATION</h2>
            <p className={textMuted}>
              Akademické zázemie, W3C certifikácie a PhD. výskum. Formálne ukotvenie
              môjho interdisclipinárneho prístupu k dizajnu.
            </p>
            <span className={cta} aria-hidden="true">
              Čítať grimoár →
            </span>
          </Link>
        </div>

      </nav>
    </div>
  );
}
