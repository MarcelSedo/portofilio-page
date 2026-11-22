import type { Metadata } from "next";
import { EmmaGame } from "@/components/games/emma/EmmaGame";

export const metadata: Metadata = {
  title: "Emma: The Matchmaker of Bramblewick – Marcel Šedo",
  description: "A small social deduction matchmaking game of manners: gather gossip and proof, then make four matches. Made for phones first.",
};

export default function EmmaPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-2 py-6 sm:py-10">
      <EmmaGame />
    </div>
  );
}
