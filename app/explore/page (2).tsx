import type { Metadata } from "next";
import { profile } from "@/content/profile";
import { Quiz } from "@/components/Quiz";
import { Panel } from "@/components/ui";

export const metadata: Metadata = { title: "Explore mode – Marcel Šedo" };

export default function ExploreMode() {
  return (
    <>
      <Panel id="quiz" title="HOW WELL DO YOU KNOW MARCEL?">
        <Quiz questions={profile.quiz} />
      </Panel>

      <Panel id="trivia" title="TRIVIA & GUILTY PLEASURES">
        <ul className="m-0 flex flex-col gap-2 pl-5 leading-relaxed">
          {profile.trivia.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Panel>

      {/* Later: NPC dialogue with pre-written questions and answers */}
    </>
  );
}
