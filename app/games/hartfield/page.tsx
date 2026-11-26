import type { Metadata } from "next";
import { Hartfield } from "@/games/hartfield";

export const metadata: Metadata = {
  title: "Emma: A Rainy Day at Hartfield – Marcel Šedo",
  description: "Act I of a detective game after Jane Austen. Emma sends you about the house, guesses wrong, and you prove who loves whom. In English and Slovak.",
};

export default function HartfieldPage() {
  return (
    <div className="mx-auto w-full max-w-[1024px] px-2 py-6 sm:py-10">
      <Hartfield exitHref="/portfolio#games" exitLabel="Back to the portfolio" />
    </div>
  );
}
