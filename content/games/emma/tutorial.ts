// The tutorial: one sunny afternoon on Donwell Lane. Emma leads, step by step.
// Two pairs. Emma's instinct says "bread and books" (the baker's daughter and the schoolmaster);
// the truth is bread and iron, and books and books.

import type { Clue, Progress, Scenario } from "./types";

const c = (id: string, cat: Clue["cat"], about: string[], truth: boolean, supports: string | undefined, text: string, next?: string): Clue => ({
  id, cat, about, truth, supports, text, next,
});
const has = (p: Progress, ...ids: string[]) => ids.every((id) => p.found.includes(id));

export const tutorial: Scenario = {
  id: "tutorial",
  title: "An afternoon on Donwell Lane",
  map: "lane",
  mapName: "Donwell Lane",
  people: [
    { id: "lucy", name: "Miss Lucy Baker", short: "Miss Baker", role: "the baker's daughter", sex: "f" },
    { id: "anne", name: "Miss Anne Carey", short: "Miss Carey", role: "a governess", sex: "f" },
    { id: "will", name: "Mr Will Hatch", short: "Mr Hatch", role: "the blacksmith", sex: "m" },
    { id: "arthur", name: "Mr Arthur Quill", short: "Mr Quill", role: "the schoolmaster", sex: "m" },
  ],
  speakers: {
    emma: { name: "Emma Woodhouse", role: "of Hartfield, matchmaker" },
    jenkins: { name: "Old Jenkins", role: "gardener, and gossip" },
  },
  pairs: { A: { woman: "lucy", man: "will" }, B: { woman: "anne", man: "arthur" } },
  clues: [
    c("t-instinct", "instinct", ["lucy", "arthur"], false, undefined, "The baker's daughter and the schoolmaster: bread and books. A perfect match!"),
    c("t-lucy", "heart", ["lucy", "arthur"], true, undefined, "Miss Baker: “Mr Quill corrects the spelling on my price board. I do wish he wouldn't.”", "Not a promising start for my plan. Let us look around the bakery."),
    c("t-horseshoe", "heart", ["lucy", "will"], true, "A", "A horseshoe nailed above the oven, polished bright: “For luck. W. H.”", "W. H.? Will Hatch, the blacksmith. To the smithy!"),
    c("t-will", "heart", ["will", "lucy"], true, "A", "Mr Hatch: “Lucy's bread is the best in the county. I mend her oven for nothing, and I'd mend it for ever.”", "That is one match, I think. Now the schoolmaster."),
    c("t-rose", "secret", ["will", "lucy"], true, "A", "On the anvil, an iron rose, half finished. An “L” is scratched on the stem."),
    c("t-jenkins", "rumour", ["lucy", "arthur"], false, undefined, "Old Jenkins: “Miss Baker's sweet on the schoolmaster, everybody knows.”", "Everybody knows a great many wrong things."),
    c("t-arthur", "heart", ["arthur", "anne"], true, "B", "Mr Quill: “Miss Carey lends me French novels. Shocking, isn't it? I've read every one twice.”", "Miss Carey lives at Lavender Cottage. She is home now."),
    c("t-novels", "heart", ["arthur", "anne"], true, "B", "Six French novels on the schoolmaster's desk, each with a sprig of lavender for a bookmark.", "Lavender? Lavender Cottage!"),
    c("t-novel", "secret", ["anne", "arthur"], true, "B", "A French novel on the windowsill, inscribed: “To A. C., with all my thanks. A. Q.”"),
    c("t-anne", "obstacle", ["anne", "arthur"], true, "B", "Miss Carey: “A governess cannot marry a poor schoolmaster, Miss Woodhouse. We should both starve on French novels.”", "Obstacles are made to be overcome. To Hartfield, and the wedding board!"),
  ],
  instincts: ["t-instinct"],
  green: [{ who: "jenkins", lines: [{ clue: "t-jenkins" }], wait: "" }],
  houses: [
    { id: "bakery", name: "The Bakery", blurb: "Warm bread, and the baker's daughter.",
      people: [{ who: "lucy", lines: [{ clue: "t-lucy" }], wait: "" }],
      items: [{ id: "horseshoe", label: "A horseshoe above the oven", clue: "t-horseshoe" }] },
    { id: "smithy", name: "The Smithy", blurb: "Hot, loud, and smelling of iron.",
      people: [{ who: "will", lines: [{ clue: "t-will", needs: ["t-horseshoe"] }], wait: "Mr Hatch is busy at the forge. Emma: We should ask him about something particular. Did we look closely at the bakery?" }],
      items: [{ id: "rose", label: "Something on the anvil", clue: "t-rose" }] },
    { id: "school2", name: "The Schoolhouse", blurb: "Slates, chalk, and Mr Quill.",
      people: [{ who: "arthur", lines: [{ clue: "t-arthur" }], wait: "" }],
      items: [{ id: "novels", label: "Books on the desk", clue: "t-novels" }] },
    { id: "cottage", name: "Lavender Cottage", blurb: "Where Miss Carey lives with her pupils.",
      locked: { needs: ["t-arthur", "t-novels"], text: "Miss Carey is still out walking with the children. Emma: Let us see the schoolmaster first." },
      people: [{ who: "anne", lines: [{ clue: "t-anne" }], wait: "" }],
      items: [{ id: "novel", label: "A book on the windowsill", clue: "t-novel" }] },
  ],
  intro: [
    "Good afternoon! Before the great season begins, let me show you how a matchmaker works. A little practice, here on Donwell Lane.",
    "Two young ladies, two gentlemen, and my own excellent instinct, which says the baker's daughter should marry the schoolmaster. We shall see.",
  ],
  letters: {
    lucy: { from: "Mrs Hatch, the Smithy", good: "Will finished the iron rose. It stands by the oven, and the bread has never risen better." },
    anne: { from: "Mrs Quill, the Schoolhouse", good: "We do not starve. We teach, we read, and on Sundays we read French novels aloud to each other." },
  },
  steps: [
    { say: "This is Donwell Lane. Let us begin at the bakery: tap it, and I shall walk us there.", target: { kind: "place", id: "bakery" }, done: (p) => p.house === "bakery" || has(p, "t-lucy") },
    { say: "Talk to Miss Baker. People with something to tell you have a … bubble. Tap her.", target: { kind: "person", id: "lucy" }, done: (p) => has(p, "t-lucy") },
    { say: "Now look closely at things. Tap the ? by the oven.", target: { kind: "item", id: "horseshoe" }, done: (p) => has(p, "t-horseshoe") },
    { say: "Every clue goes into your book. Open it with the 📖 Book button up top, then close it again.", target: { kind: "book" }, done: (p) => p.bookOpened },
    { say: "W. H.: the blacksmith! Back to the lane, and on to the smithy.", target: { kind: "place", id: "smithy" }, done: (p) => has(p, "t-will") },
    { say: "Neighbours gossip on the lane. Talk to Old Jenkins, but remember: a rumour can be wrong.", target: { kind: "folk", id: "jenkins" }, done: (p) => has(p, "t-jenkins") },
    { say: "Now the schoolhouse. Talk to Mr Quill and look at his desk.", target: { kind: "place", id: "school2" }, done: (p) => has(p, "t-arthur", "t-novels") },
    { say: "Lavender Cottage is open now. Look around, and talk to Miss Carey.", target: { kind: "place", id: "cottage" }, done: (p) => has(p, "t-novel", "t-anne") },
    { say: "Home to Hartfield, and my wedding board!", target: { kind: "place", id: "hartfield" }, done: (p) => p.screen === "board" || p.screen === "ending" },
    { say: "Tap a lady, then the gentleman she belongs with. Do it for both ladies.", target: { kind: "board" }, done: (p) => Object.keys(p.matches).length >= 2 },
    { say: "Now give each engagement its best proof: a true clue that shows they belong together.", target: { kind: "proof" }, done: (p) => Object.keys(p.proofs).length >= 2 },
    { say: "Announce the engagements! In the real season I will only tell you whether all four are right.", target: { kind: "announce" }, done: (p) => p.screen === "ending" },
  ],
};
