import type { Metadata } from "next";
import { QuizGame } from "@/components/QuizGame";
import { AboutSheet } from "@/components/AboutSheet";
import { quiz } from "@/content/about";

export const metadata: Metadata = {
  title: "About – Marcel Šedo",
  description: "Who's behind the code: a philosopher, former level designer and incurable Britophile. Plus a quiz.",
};

export default function AboutPage() {
  return (
    <div className="about mx-auto flex w-full max-w-4xl flex-col gap-20 px-4 py-16 sm:px-8 sm:py-20">
      {/* ---------- Intro: character sheet ---------- */}
      <AboutSheet />

      {/* ---------- Quiz ---------- */}
      <QuizGame questions={quiz} />
    </div>
  );
}
