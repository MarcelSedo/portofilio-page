import type { Metadata } from "next";
import { LongSpring } from "@/games/long-spring";

export const metadata: Metadata = {
  title: "The Long Spring – Marcel Šedo",
  description: "An endless ride through the rot on an elk, a wolf or a boar. The monsters are faster than you: lead them into trees, pits and traps, and bring spring back.",
};

export default function LongSpringPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-2 py-6 sm:py-10">
      <LongSpring exitHref="/portfolio#games" exitLabel="Back to the portfolio" />
    </div>
  );
}
