/**
 * The story of The Long Spring: the prologue, Brigid's memories (four lands, six each), the ending,
 * and the generators for the names of villages and their people.
 * Everything a player reads in the mission lives here, so it can be rewritten without touching the game.
 */

export const HEROINE = "Brigid";
/** her youngest; the name is only learned near the end */
export const CHILD = "Áine";

export const PROLOGUE: string[] = [
  "There was a land where spring never ended. Its kings grew rich on what the earth gave freely, and then they wanted what it would not give: gold from under the roots, years beyond their years, strength that never tired.",
  "They dug, they tore, and they called on a darkness older than the land. The darkness answered, and it was stronger than they were. It turned them inside out. It turned the world inside out, and up from below came things that eat everything alive.",
  "The land had one gift left. At the bottom of a ravine it found a woman who wanted to die, and it would not let her. It took her memory, gave her its strength, and sent her out on a great elk: Brigid, who carries spring.",
  "Wherever she rides, the land remembers what it was. Wherever she gives a piece of her heart, it lives again. But a heart has only so many pieces.",
];

/** the three kinds of village, as the codex explains them */
export const VILLAGE_KINDS = {
  6: { name: "The Crowd", short: "Many souls", text: "Six people you will never know. Saving them brings you closest to the next gate." },
  4: {
    name: "The Grove",
    short: "A tree of spring",
    text: "Four souls, and Brigid plants her heart in the ground. A tree of spring grows from it, and at the next gate it gives you a heart back.",
  },
  2: {
    name: "The Named",
    short: "Names and a gift",
    text: "Two people with names, away from the easy road. They always give you something, and some carry what Brigid has forgotten.",
  },
} as const;
export type VillageSize = 6 | 4 | 2;

export const RULES: string[] = [
  "Ride through the glowing ring at the heart of a village to give it one of your hearts. You can't give your last one.",
  "A saved village lights up and greens, and the monsters break on it like on stone: lead them into it.",
  "A village you ride past without giving is lost, and its souls are taken from your count.",
  "When you have saved enough souls, a gate of spring opens ahead. Four lands, and at the end, the golden gate.",
  "Hearts lie in the land: gather them. Weapons you only get from the people you save.",
];

export type Memory = { land: number; title: string; sign: string; text: string };

/**
 * Brigid's memories. A hamlet of The Named that is marked with a spiral carries the next one; they come back in order.
 * `sign` is what she sees in the hamlet that brings it back.
 */
export const MEMORIES: Memory[] = [
  // The Rot: before
  { land: 0, title: "The ribbon", sign: "A girl ties her hair with a green ribbon.", text: "I tied that knot every morning. Small hands, impatient. Someone always ran off before I had finished." },
  { land: 0, title: "The hall of branches", sign: "An old man hums a dance tune.", text: "There was a hall with no roof, only branches. We danced there at every new moon, and the petals never stopped falling." },
  { land: 0, title: "The crown of leaves", sign: "A child wears a crown of dead leaves.", text: "They put a crown on my head that was never heavy. It was made of living leaves, and it had to be watered." },
  { land: 0, title: "Counting", sign: "A mother counts her children in at the door.", text: "Three. I had three. I can't hear their names yet, only how many times I called." },
  { land: 0, title: "His laugh", sign: "A man carries his son on his shoulders.", text: "He laughed easily, then. He carried the youngest on his shoulders through the orchards. I loved him. I have to remember that too." },
  { land: 0, title: "The first hole", sign: "A boy shows you a stone he dug up.", text: "One morning there was a hole in the orchard, deep as a well, and nobody would say who had dug it." },
  // First Green: the hunger
  { land: 1, title: "Gold under the roots", sign: "A woman wears a gold coin on a string.", text: "They found gold under the oldest oak. He had the oak cut down. The children cried, and he gave them each a coin." },
  { land: 1, title: "Lamps at night", sign: "A miner's lamp hangs over a door.", text: "Men came down from the hills with lamps. They dug at night, so the land wouldn't see." },
  { land: 1, title: "Never again", sign: "A widow sits by a fresh grave.", text: "His mother died that winter. He sat by her for three days and said: no one I love will ever die again. I thought it was grief talking." },
  { land: 1, title: "The cup", sign: "A cracked black cup stands on a windowsill.", text: "He went down into the deepest mine with a knife and a cup. When he came back, his eyes didn't close when he blinked." },
  { land: 1, title: "The first blossom", sign: "Petals lie on bare earth.", text: "For the first time in a hundred years a blossom fell, and nothing grew where it fell." },
  { land: 1, title: "I asked him", sign: "Two old people hold hands.", text: "I asked him to stop. He kissed my forehead and said he was doing it for us. That was the last time he touched me gently." },
  // Deep Green: the turning
  { land: 2, title: "The voice below", sign: "A dog growls at the ground.", text: "Something answered from under the land. It spoke with his voice, and it was hungry." },
  { land: 2, title: "Too many teeth", sign: "A man won't eat his bread.", text: "The lords stopped eating bread. They ate meat raw at the table, and laughed with too many teeth." },
  { land: 2, title: "Inside out", sign: "The sky over the hamlet is the wrong colour.", text: "One night the sky turned the colour of the inside of a body. When it was over, the hall was full of things that had been men." },
  { land: 2, title: "His eyes", sign: "A father hides his children behind him.", text: "He was still mostly himself. That was the worst of it. He looked at our children the way the others looked at the sheep." },
  { land: 2, title: "The black orchards", sign: "A blackened apple hangs on a dead tree.", text: "The orchards went black in a week. The wells filled with something that moved." },
  { land: 2, title: "To see the sea", sign: "A girl draws waves in the dust.", text: "I woke the children before dawn. I told them we were going to see the sea." },
  // Bloom: the ravine
  { land: 3, title: "The old road", sign: "Two children walk hand in hand.", text: "We ran along the old road, the youngest on my back. The two older ones held hands and didn't cry." },
  { land: 3, title: "The bridge", sign: "A broken bridge over a stream.", text: "He found us at the bridge. The land is kind: it lets me keep only that they were holding hands." },
  { land: 3, title: "The edge", sign: "Someone looks down into a ravine.", text: "I held the little one and stepped off the edge. I wanted us to go together." },
  { land: 3, title: "Not yet", sign: "Roots break through a cottage floor.", text: "Roots caught us. Moss, and water, and a voice that wasn't his. It said: not yet." },
  { land: 3, title: "Her name", sign: "A woman calls a name across a field.", text: `My youngest was a girl. Her name was ${CHILD}. I said it every morning. I forgot it for so long.` },
  { land: 3, title: "Where she went", sign: "A child laughs, and the flowers open.", text: `The land could keep only one of us. It kept me, and it kept her another way: every spring I bring is ${CHILD}'s. She rides with me. She always has.` },
];
export const MEMORIES_PER_LAND = 6;

export const LAND_CHAPTERS = ["Before", "The hunger", "The turning", "The ravine"];

export const ENDING: string[] = [
  "At the golden gate Brigid got down from the elk for the first time. There was nothing left of her heart to give but the last piece, and she gave it.",
  `Where she stood, the spring broke open. ${CHILD} was in it, and the orchards, and the hall of branches, and everyone she had carried through the rot.`,
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

export type GiftId = "sword" | "bow" | "traps" | "bark" | "hound" | "raven" | "doe" | "heart";
export const GIFTS: { id: GiftId; weight: number; text: string }[] = [
  { id: "sword", weight: 22, text: "an old sword" },
  { id: "bow", weight: 22, text: "a bow and five arrows" },
  { id: "traps", weight: 18, text: "two root traps" },
  { id: "bark", weight: 12, text: "a coat of bark" },
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
