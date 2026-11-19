import type { Metadata } from "next";
import Link from "next/link";
import { profile } from "@/content/profile";

export const metadata: Metadata = { title: "Quest Log – Marcel Šedo" };

/*
 * Cik-Cak rozloženie (Zig-Zag layout).
 * Karty sú interaktívne "rázcestníky" (teasers), ktoré striedajú strany.
 * Stred zostáva voľný pre vyniknutie vertikálneho pixel art pozadia.
 */

// Interaktívna karta s hover a focus stavmi. 
// contrast-more:* zabezpečí čitateľnosť pre OS High Contrast mód.
const cardBase = `
  group relative flex flex-col rounded-sm border-2 border-slate-700/50 
  bg-[#0A1128]/85 p-6 backdrop-blur-md transition-all duration-300 
  hover:-translate-y-1 hover:border-slate-400 hover:bg-[#0A1128]/95 hover:shadow-2xl 
  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white 
  contrast-more:border-white contrast-more:bg-black
`;

const h2 = "m-0 mb-3 font-pixel text-xl tracking-wide text-amber-400 contrast-more:text-white";
const textMuted = "m-0 text-sm leading-relaxed text-slate-300 contrast-more:text-slate-100";

export default function QuestLog() {
  const { intro } = profile;

  return (
    // Hlavný kontajner s paddingom, aby karty neboli nalepené na okrajoch
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-16 sm:px-8 sm:py-24">
      
      {/* Hlavička - Plná šírka, ale kompaktná (Úvodná obrazovka postavy) */}
      <header className="mb-24 flex flex-col items-center rounded-sm bg-[#0A1128]/90 p-8 text-center shadow-xl backdrop-blur-md contrast-more:bg-black">
        <h1 className="m-0 text-4xl font-bold text-white md:text-5xl">{profile.name}</h1>
        <p className="mt-2 font-pixel text-lg text-amber-400">{profile.className}</p>
        <p className="mt-4 max-w-2xl text-slate-300 leading-relaxed">
          {intro.mainQuest}
        </p>
      </header>

      {/* Rázcestníky - Cik-cak rozloženie cez flex a self-start / self-end */}
      <nav aria-label="Hlavné menu dobrodružstva" className="flex w-full flex-col gap-24 md:gap-32">
        
        {/* L'avá strana: Skúsenosti */}
        <Link href="/experience" className={`w-full md:w-5/12 self-start ${cardBase}`} aria-labelledby="nav-exp">
          <h2 id="nav-exp" className={h2}>EXPERIENCE</h2>
          <p className={textMuted}>
            Preskúmaj moju cestu od správy databáz a level dizajnu až po aktuálne pôsobenie 
            v oblasti prístupnosti webov a dizajnových systémov vo verejnej správe.
          </p>
          <span className="mt-6 font-pixel text-sm text-amber-400 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true">
            Zobraziť quest log →
          </span>
        </Link>

        {/* Pravá strana: Vedľajšie úlohy (Side Quests) */}
        <Link href="/side-quests" className={`w-full md:w-5/12 self-end ${cardBase}`} aria-labelledby="nav-side">
          <h2 id="nav-side" className={h2}>SIDE QUESTS</h2>
          <p className={textMuted}>
            Projekty z vášne. Od vývoja indie hier, cez naratívny storytelling, až po 
            výskum v oblasti fenomenológie a estetiky.
          </p>
          <span className="mt-6 font-pixel text-sm text-amber-400 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true">
            Preskúmať lokality →
          </span>
        </Link>

        {/* L'avá strana: Schopnosti a Inventár */}
        <Link href="/skills" className={`w-full md:w-5/12 self-start ${cardBase}`} aria-labelledby="nav-skills">
          <h2 id="nav-skills" className={h2}>SKILLS & INVENTORY</h2>
          <p className={textMuted}>
            Technologický stack, WCAG štandardy, React, Next.js a nástroje, 
            ktoré nosím vo svojom vývojárskom inventári.
          </p>
          <span className="mt-6 font-pixel text-sm text-amber-400 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true">
            Otvor inventár →
          </span>
        </Link>

        {/* Pravá strana: Vzdelanie a certifikáty */}
        <Link href="/education" className={`w-full md:w-5/12 self-end ${cardBase}`} aria-labelledby="nav-edu">
          <h2 id="nav-edu" className={h2}>LORE & EDUCATION</h2>
          <p className={textMuted}>
            Akademické zázemie, W3C certifikácie a PhD. výskum. Formálne ukotvenie 
            môjho interdisclipinárneho prístupu k dizajnu.
          </p>
          <span className="mt-6 font-pixel text-sm text-amber-400 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true">
            Čítať grimoár →
          </span>
        </Link>

      </nav>
    </main>
  );
}