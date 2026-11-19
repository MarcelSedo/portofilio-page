// Clickable forest folk. Positions are percentages of the background image
// (/forest/forest.jpg, 1438 × 2576), so they stay glued to the branches at any width.

export type FolkId = "elf" | "traveller" | "knight" | "fairy" | "wisp";

export type Folk = {
  id: FolkId;
  name: string;
  /** Accessible name of the button */
  label: string;
  /** Fun fact shown in the speech bubble */
  says: string;
  /** Position & size in % of the scene image */
  left: number;
  top: number;
  width: number;
  /** Sprite size in pixels (for the aspect ratio) */
  spriteW: number;
  spriteH: number;
  /** Which way the speech bubble opens */
  bubble: "left" | "right";
  /** Idle animation */
  idle?: "float" | "flutter";
};

export const FOREST_IMAGE = { src: "/forest/forest.jpg", width: 1438, height: 2576 };

export const folk: Folk[] = [
  {
    id: "elf",
    name: "The Elf",
    label: "Ask the elf on the upper branch for a fact about Marcel",
    says: "Programmed film festivals before he programmed websites. Ask him for a film and you'll get three, plus a Scandinavian one you didn't ask for.",
    left: 14.6, top: 33.7, width: 6.68, spriteW: 24, spriteH: 34,
    bubble: "right",
  },
  {
    id: "traveller",
    name: "The Traveller",
    label: "Ask the traveller on the lower branch for a fact about Marcel",
    says: "He's set on a journey there, to Britain. Unlike a certain well-known traveller, he has no plans for the 'back again' bit.",
    left: 12, top: 60.24, width: 6.68, spriteW: 24, spriteH: 32,
    bubble: "right",
  },
  {
    id: "fairy",
    name: "The Fairy",
    label: "Ask the fairy for a fact about Marcel",
    says: "His UX writing is positively Shakespearean, though he's yet to ship a button label in iambic pentameter.",
    left: 88.75, top: 38.52, width: 5.56, spriteW: 20, spriteH: 20,
    bubble: "left",
    idle: "flutter",
  },
  {
    id: "knight",
    name: "The Knight",
    label: "Ask the knight on the rock for a fact about Marcel",
    says: "A knight of the accessible realm: no button left unlabelled, no contrast below 4.5:1. Arise, Sir Alt-Text.",
    left: 87.07, top: 58.77, width: 6.68, spriteW: 24, spriteH: 38,
    bubble: "left",
  },
  {
    id: "wisp",
    name: "The Will-o'-the-wisp",
    label: "Ask the will-o'-the-wisp for a fact about Marcel",
    says: "He solves code mysteries like Miss Marple: quietly, politely, and the culprit is always the component nobody suspected.",
    left: 89.15, top: 76.63, width: 3.89, spriteW: 14, spriteH: 18,
    bubble: "left",
    idle: "float",
  },
];
