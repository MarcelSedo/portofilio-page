import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceMap } from "@/components/experience/ExperienceMap";

export const metadata: Metadata = {
  title: "Experience – Marcel Šedo",
  description:
    "Walk around a little pixel village: IT jobs in the castle, projects at the inn, school on the farm, other careers in the manor and skills at the market.",
};

export default function ExperiencePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-8 sm:py-20">
      <header className="hero-frame xmap-intro p-6 sm:p-8">
        <p className="xmap-kicker">Quest log</p>
        <h1 className="xmap-h1">Experience</h1>
        <p className="xmap-lead">
          Welcome to the village. Pick a building to walk there and read what I did, or have a chat with the locals: they
          know a thing or two about me.
        </p>
        <p className="xmap-lead-small">
          In a hurry? Use fast travel under the map, or read the <Link href="/classic-cv">classic CV</Link>.
        </p>
      </header>

      <ExperienceMap />
    </div>
  );
}
