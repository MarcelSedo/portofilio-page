import type { Metadata } from "next";
import { TimeTraveller } from "@/components/games/TimeTraveller";

export const metadata: Metadata = {
  title: "Time Traveller – a timeline game of British culture – Marcel Šedo",
  description: "Put British books, paintings, music, plays and films from Chaucer to today on a timeline. Playable with a mouse, touch or keyboard.",
};

export default function TimeTravellerPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-8 sm:py-20">
      <TimeTraveller />
    </div>
  );
}
