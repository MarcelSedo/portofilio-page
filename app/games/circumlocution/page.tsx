import type { Metadata } from "next";
import { CircumlocutionGame } from "@/games/circumlocution";

export const metadata: Metadata = {
  title: "The Circumlocution Office – Marcel Šedo",
  description: "A five-day desk game after Charles Dickens: read the papers, check the signatures, stamp them, pay the rent at home, and read about it in the morning paper.",
};

export default function CircumlocutionPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-2 py-6 sm:py-10">
      <CircumlocutionGame exitHref="/portfolio#games" exitLabel="Back to the portfolio" />
    </div>
  );
}