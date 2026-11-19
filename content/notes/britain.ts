// "About Britain" notes. The love letter and the Tesco email come straight from about.ts,
// so they stay in sync with the About page.
import type { Note } from "./types";
import { loveLetter, tescoLetter } from "../about";

export const britainNotes: Note[] = [
  {
    slug: "a-love-letter-to-britain",
    category: "britain",
    kind: "Letter",
    title: loveLetter.title,
    excerpt: "The sea, the gulls and the fog, ruined abbeys, dry humour, Shakespeare and a peaty dram from Islay.",
    body: [
      ...loveLetter.sections.flatMap((s) => [`## ${s.heading}`, s.body]),
      loveLetter.signature,
    ],
  },
  {
    slug: "a-letter-to-tesco",
    category: "britain",
    kind: "Letter",
    title: "A letter to Tesco",
    excerpt: tescoLetter.intro,
    body: [`_${tescoLetter.intro}_`, ...tescoLetter.paragraphs, tescoLetter.signOff.join("\n")],
  },
];
