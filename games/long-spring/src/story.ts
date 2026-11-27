/**
 * The story of The Long Spring: the prologue, Brigid's memories (fourteen chapters in four lands), the ending,
 * and the generators for the names of villages and their people.
 * Everything a player reads in the mission lives here, so it can be rewritten without touching the game.
 */

export const HEROINE = "Brigid";
/** her youngest; the name is only learned near the end */
export const CHILD = "Áine";

export const PROLOGUE: string[] = [
  `The year forgot its turning,
the hawthorn kept its white;
the kings grew fat on all it gave,
and hungered in the night.`,
  `They dug beneath the oldest roots
and woke what lay below;
it turned them inside out; and I
lay broken far below.`,
  `The land took up what I had been
and gave me roots and rain:
so ride, and win back what is left,
ere dark takes all again.`,
];

/** the kinds of place Brigid can heal, as the codex explains them */
export const VILLAGE_KINDS = {
  hamlet: {
    name: "The Hamlet",
    souls: 1,
    short: "One soul",
    text: "A cottage on the way, alone. One soul, for one of your hearts. Ride past, and the rot takes it: it comes after you as a monster.",
  },
  village: {
    name: "The Village",
    souls: 2,
    short: "Two souls",
    text: "Where the road forks, one way leads to a village: two souls, a step closer to the gate. It costs a heart.",
  },
  glade: {
    name: "The Glade",
    souls: 0,
    short: "The land itself",
    text: "The other way leads to a glade choked by the rot. No souls, and it asks no heart. Heal it, and the animals come back: one walks with you, and the land gives you back a memory. Its creatures lead the villagers away into the woods: not saved, but not lost.",
  },
} as const;
export type VillageKind = keyof typeof VILLAGE_KINDS;
/** souls a place gives: 1, 2 or none */
export type VillageSize = 0 | 1 | 2;

export const RULES: string[] = [
  "Each chapter is a memory and a stretch of the road. It starts grey; ride each third of it well, and a third of its picture comes back in colour.",
  "Each chapter is a little different: a ribbon to follow, trees that dance to a drum, small lights to bring through. The road tells you how.",
  "Some stand by the road, half taken by the rot. Ride through their ring to give them a heart, or ride on: those you pass by come after you.",
  "Runes help you through the land. Fall, and you rise again at the start of the chapter. At the end of the road, the golden gate.",
];

export type Memory = {
  land: number; title: string; sign: string; text: string;
  /** the picture in /public/long-spring/memories */
  pic: string;
  /** the three parts of the moment, one for each third of the chapter (the picture colours a third at a time) */
  pieces: [string, string, string];
  /** what is different in this chapter (the rest ride as usual: a third for each stretch ridden without losing a heart) */
  rule?: ChapterRule;
  /** the place on the road where it happened, which blooms when it is remembered */
  place?: ChapterPlace;
};
/**
 * ribbon: follow Áine's ribbon (no monsters); dance: the trees of the hall step to the drum;
 * count: three small lights (the children) ride behind you, and nothing may take them
 */
export type ChapterRule = "ribbon" | "dance" | "count";
export type ChapterPlace = "thorn" | "hall" | "door" | "stone" | "riverTree" | "fire";

/**
 * Brigid's memories: fourteen chapters of the mission, in four lands (3, 4, 4, 3).
 * Each one is a moment of the old world; win it back and that place stays in the world.
 * `sign` is what she sees on the road that brings it back.
 */
export const MEMORIES: Memory[] = [
  // Before
  { land: 0, title: "The ribbon", pic: "01-ribbon", rule: "ribbon", place: "riverTree", pieces: ["the green silk", "the wind in the field", "her mother's hands"],
    sign: "A green ribbon flutters on a thorn.", text: `My mother tied a ribbon green
of river-weed and grass:
a girl who wears the field, she said,
goes where the wild things pass.` },
  { land: 0, title: "The hall", pic: "02-hall", rule: "dance", place: "fire", pieces: ["the music", "the dancers", "the fire"],
    sign: "Somewhere, someone hums a dance tune.", text: `They crowned me in a hall of trees,
its rafters living wood;
the petals fell all night like snow.
I thought they always would.` },
  { land: 0, title: "Counting", pic: "03-counting", rule: "count", place: "door", pieces: ["three pairs of shoes", "the open door", "the voices"],
    sign: "Small footprints lead up to a door.", text: `Three. I had three. I cannot hear
their names, not yet, not one;
I only hear how many times
I called them, one by one.` },
  // The hunger
  { land: 1, title: "Never again", pic: "04-never-again", pieces: ["the candles", "the grave in the snow", "his vow"],
    sign: "Two candles burn in the snow.", text: `His mother died at winter’s end.
My king knelt in the snow
and swore that none he loved would die;
and something heard, below.` },
  { land: 1, title: "The cup", pic: "05-cup", pieces: ["the knife", "the black cup", "his eyes"],
    sign: "A cracked black cup stands on a stone.", text: `He took a knife, he took a cup,
he went below the light;
he climbed back up, and something looked
out of his eyes all night.` },
  { land: 1, title: "The first blossom", pic: "06-first-blossom", pieces: ["the falling petal", "the bare earth", "the hundred springs"],
    sign: "Petals lie on bare black earth.", text: `A blossom fell, the first to fall
in a hundred years of spring;
and where it fell, the earth was bare,
and did not grow a thing.` },
  { land: 1, title: "The voice below", pic: "07-voice-below", pieces: ["the growling dog", "the mouth in the floor", "her name, in his voice"],
    sign: "A dog growls at the ground.", text: `A voice came up through root and stone
and said my name, his way,
the way he said it every dawn.
He’d gone. It meant to stay.` },
  // The turning
  { land: 2, title: "Too many teeth", pic: "08-teeth", pieces: ["the long table", "the raw meat", "the teeth"],
    sign: "Bread lies untouched on a table.", text: `The lords stopped eating bread. They ate
the meat raw from the bone,
and laughed across the table, and
their teeth were not their own.` },
  { land: 2, title: "Inside out", pic: "09-inside-out", pieces: ["the red sky", "the black sun", "the crooked houses"],
    sign: "The sky ahead is the wrong colour.", text: `One night the sky turned to the red
of what lies under skin;
and when it passed, the homes were full
of what had once been men.` },
  { land: 2, title: "His eyes", pic: "10-eyes", pieces: ["the sheep", "the wall", "his eyes"],
    sign: "Sheep huddle against a wall.", text: `He still was mostly him. And that
was the worst thing of all:
he watched our children like the sheep
are watched beyond the wall.` },
  { land: 2, title: "To see the sea", pic: "11-sea", pieces: ["the whisper", "the open door", "the sea"],
    sign: "Someone has drawn waves in the dust.", text: `I woke the children before dawn
and whispered: come with me.
We’re going on a journey, loves.
We’re going to see the sea.` },
  // The ravine
  { land: 3, title: "The bridge", pic: "12-bridge", pieces: ["the running", "the broken bridge", "their hands"],
    sign: "Two small figures stand on a broken bridge.", text: `He found us at the bridge. It broke.
Of all of it, the land
lets me keep one thing, only one:
that they were holding hands.` },
  { land: 3, title: "Her name", pic: "13-her-name", pieces: ["the stream", "the ribbon", "her name"],
    sign: "A green ribbon drifts down a stream.", text: `Her name: I lost it in the stream
like ribbon from her hair.
I have it now. I’ll hold it tight.
Her name was ${CHILD}. There.` },
  { land: 3, title: "Where she went", pic: "14-tree", pieces: ["the blossom", "the ribbon in the branches", "the green of things"],
    sign: "An apple tree in blossom, alone in the rot.", text: `The land could keep just one of us;
it chose, and it kept me,
and kept her in another way:
in every bud and tree.
Each spring I bring is ${CHILD}’s spring.
She’s in the green of things.` },
];
/** chapters in each land: 3, 4, 4, 3 */
export const CHAPTERS = [0, 1, 2, 3].map((l) => MEMORIES.filter((m) => m.land === l).length);
/** how many of a land's memories must be won back before its gate opens: all but one */
export const NEED = CHAPTERS.map((n) => n - 1);
export const memoryPic = (i: number) => `/long-spring/memories/${MEMORIES[i].pic}.webp`;


/**
 * How a memory reads the first time it comes back: in mist. A few of the longer words are hidden
 * (always the same ones) and the last two lines are missing. Found again, it comes back clear.
 */
export function mistOf(i: number): { text: string; hidden: number } {
  const lines = MEMORIES[i].text.split("\n");
  const keep = lines.length > 2 ? lines.length - 2 : lines.length;
  let n = 0;
  const shown = lines.slice(0, keep).map((line) =>
    line.replace(/[A-Za-zÁ’]{5,}/g, (w) => ((w.length * 7 + n++ * 3 + i) % 4 === 0 ? "░".repeat(Math.min(6, w.length - 1)) : w)),
  );
  return { text: shown.join("\n").replace(/\n+$/, ""), hidden: lines.filter(Boolean).length - shown.filter(Boolean).length };
}

export const LAND_CHAPTERS = ["Before", "The hunger", "The turning", "The ravine"];

export const ENDING: string[] = [
  `At the golden gate I left the elk
and walked the last alone;
one piece of heart was left to me,
and that one was my own.`,
  `Now let the heart I carried
go down into the ground;
where one red drop of me is lost,
let many more be found.`,
  `The spring broke open where I stood:
the orchards and the hall,
and ${CHILD} laughing in the light,
and those I carried, all.`,
];

/* ---------------- names: there must never be too few ---------------- */

const PRE = [
  "Ash", "Oak", "Thorn", "Wen", "Brack", "Hazel", "Stan", "Mere", "Holly", "Brad", "Elm", "Wil", "Lark", "Fern", "Rook", "Bourne", "Kings",
  "Saxon", "Tad", "Haw", "Wych", "Comb", "Shep", "Moor", "Stone", "Brook", "Black", "White", "Red", "Cold", "Willow", "Apple", "Barrow",
  "Lin", "Ox", "Wood", "Ivy", "Sedge", "Hart", "Fox",
];
const SUF = [
  "combe", "ford", "ley", "ton", "well", "bury", "stow", "wick", "ham", "by", "field", "thorpe", "den", "hurst", "brook", "cote", "wold",
  "mere", "stead", "bridge", "ridge", "worth", "hope", "low",
];
const MOD = ["", "", "", "", "", "Upper ", "Lower ", "Little ", "Long ", "Great ", "Nether "];
const GIVEN = [
  "Niamh", "Eamon", "Cormac", "Aoife", "Ciarán", "Bridie", "Orla", "Fergus", "Ruairí", "Siobhán", "Tadhg", "Nuala", "Declan", "Mairéad",
  "Rónán", "Eileen", "Peadar", "Gráinne", "Colm", "Saoirse", "Edith", "Alfred", "Hilda", "Oswin", "Wynn", "Godric", "Elsie", "Mabel", "Tom",
  "Agnes", "Walter", "Rose", "Will", "Martha", "Hal", "Ada", "Bryn", "Ellen", "Owain", "Meg", "Jack", "Ida", "Ned", "Ivy", "Seán", "Una",
];
const WHO = [
  "the weaver", "who keeps bees", "the smith's boy", "the miller's widow", "the shepherd", "who mends nets", "the midwife", "the thatcher",
  "the well-keeper's girl", "the cooper", "who sings at wakes", "the herb-woman", "the blind fiddler", "the ferryman's son", "the swineherd",
  "the hedge-layer", "the baker", "the orphan", "the old soldier", "who counts the stars", "the potter", "the reeve's daughter", "the gravedigger",
  "the goose-girl", "the carter", "the schoolmistress", "the charcoal-burner", "the twins' mother", "the apple-picker", "the tinker",
];

export const LINES = [
  "We hid in the well for three days. Then we heard you.",
  "My mother said spring would come back on an elk. I didn't believe her.",
  "We'll plant again. We kept the seed dry.",
  "Take this. We've nothing else worth giving.",
  "The beasts went round us like water round a stone.",
  "Will it hold? The light, I mean. Will it hold?",
  "Tell the others in the valley. Tell them it can be done.",
  "I counted the monsters at night. Last night there were fewer.",
  "The bees came back this morning.",
  "You look tired, lady. Sit a moment. No? Then go well.",
  "We'll remember your face. We'll carve it on the door.",
  "The children are singing again. I'd forgotten the words.",
  "The well tastes sweet. It hasn't tasted sweet in years.",
  "I thought we were the last. We weren't the last, were we?",
];

/** a little deterministic randomness, so a village keeps its name */
function pick<T>(list: readonly T[], r: () => number) {
  return list[Math.floor(r() * list.length)];
}

export function villageName(r: () => number) {
  const p = pick(PRE, r);
  let s = pick(SUF, r);
  if (p.toLowerCase().endsWith(s[0])) s = pick(SUF, r);
  return `${pick(MOD, r)}${p}${s}`;
}

export function personName(r: () => number) {
  return `${pick(GIVEN, r)} ${pick(WHO, r)}`;
}

export function line(r: () => number) {
  return pick(LINES, r);
}

export type GiftId = "sword" | "bow" | "traps" | "rune" | "hound" | "raven" | "doe" | "heart";
export const GIFTS: { id: GiftId; weight: number; text: string }[] = [
  { id: "sword", weight: 22, text: "an old sword" },
  { id: "bow", weight: 22, text: "a bow and five arrows" },
  { id: "traps", weight: 18, text: "two root traps" },
  { id: "rune", weight: 12, text: "a rune-stone" },
  { id: "hound", weight: 5, text: "a hound, who follows you" },
  { id: "raven", weight: 5, text: "a raven, who flies with you" },
  { id: "doe", weight: 5, text: "a white doe, who runs with you" },
  { id: "heart", weight: 11, text: "a heart (a healer's gift)" },
];
export function gift(r: () => number): (typeof GIFTS)[number] {
  const total = GIFTS.reduce((s, g) => s + g.weight, 0);
  let roll = r() * total;
  for (const g of GIFTS) if ((roll -= g.weight) < 0) return g;
  return GIFTS[0];
}
