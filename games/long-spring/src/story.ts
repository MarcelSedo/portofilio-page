/**
 * The story of The Long Spring: the prologue, Brigid's memories (four lands, six each), the ending,
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
and called on what lay deep;
it answered them, and turned them out,
and woke what should not sleep.`,
  `The land had one last gift to give;
it found me where I lay,
broken at the ravine’s cold foot,
and would not let me stay.`,
  `It took the years I was before
and gave me roots and rain;
wherever I give my heart away,
the land is green again.`,
  `But hearts are made of only so
much giving, and no more:
so ride, and choose, and count the cost
of every open door.`,
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
  "Ride through the glowing ring of a hamlet or a village to give it one of your hearts. You can't give your last one.",
  "Where the road forks you heal only one: the village (two souls) or the glade (no souls, but your heart stays, an animal friend and a memory).",
  "Ride past both, or past a hamlet, and its people are lost: their souls come off your count, and they come after you as a monster.",
  "A saved place greens, and the monsters break on it like on stone: lead them into it.",
  "When you have saved enough souls, a gate of spring opens ahead. Four lands, and at the end, the golden gate.",
];

export type Memory = { land: number; title: string; sign: string; text: string };

/**
 * Brigid's memories. A hamlet of The Named that is marked with a spiral carries the next one; they come back in order.
 * `sign` is what she sees in the hamlet that brings it back.
 */
export const MEMORIES: Memory[] = [
  // The Rot: before
  { land: 0, title: "The ribbon", sign: "A girl ties her hair with a green ribbon.", text: `I tied a ribbon every dawn
in hair that would not wait;
small hands, small feet, a green silk tail
already through the gate.

My mother tied the same for me
with river-weed and grass;
she said, a girl who wears the field
goes where the wild things pass.` },
  { land: 0, title: "The hall of branches", sign: "An old man hums a dance tune.", text: `There was a hall that had no roof,
its rafters living wood;
we danced there every newborn moon
as only dancers could.

The petals fell all night like snow
and never ceased to fall;
I did not know a spring could end.
I did not know at all.` },
  { land: 0, title: "The crown of leaves", sign: "A child wears a crown of dead leaves.", text: `They set a crown upon my hair
no heavier than rain;
its leaves were living, and each dawn
I watered it again.` },
  { land: 0, title: "Counting", sign: "A mother counts her children in at the door.", text: `Three. I had three. I cannot hear
their names, not yet, not one;
I only hear how many times
I called them, one by one.` },
  { land: 0, title: "His laugh", sign: "A man carries his son on his shoulders.", text: `He laughed so easily, back then;
he bore our youngest high
along the orchard rows, her heels
against the apple sky.

I loved him. I must keep that too,
though it is hard to hold:
the land gives back the whole of things,
the sweet one with the cold.` },
  { land: 0, title: "The first hole", sign: "A boy shows you a stone he dug up.", text: `One morning, in the orchard grass,
a hole as deep as wells;
and no one said who dug it there,
and no one rang the bells.

I looked into it, and it looked
so patiently at me,
the way a hungry thing will wait
beneath an apple tree.` },
  // First Green: the hunger
  { land: 1, title: "Gold under the roots", sign: "A woman wears a gold coin on a string.", text: `They found the gold beneath the oak,
the oldest in the wood;
he had it felled. The children wept.
He told them gold was good,

and gave them each a shining coin
to dry their eyes upon;
they wore them strung about their necks
long after it was gone.` },
  { land: 1, title: "Lamps at night", sign: "A miner's lamp hangs over a door.", text: `Men came down from the hills with lamps
and dug while daylight slept,
so that the land would never see
how deep the hollows crept.

I watched their small lights from the hall
go under, one by one,
like stars that someone drowned at night
before the night was done.` },
  { land: 1, title: "Never again", sign: "A widow sits by a fresh grave.", text: `His mother died at winter’s end.
Three days he would not stir;
then said: no one I love will die.
No one. Not after her.

I thought that it was grief that spoke,
as grief will speak, then sleep;
I did not hear the thing below
that heard him, and would keep.` },
  { land: 1, title: "The cup", sign: "A cracked black cup stands on a windowsill.", text: `He took a knife, he took a cup,
he went below the light;
and when at last he climbed back up
his eyes stayed wide all night.

And when he blinked, they did not close;
the lids went over, slow,
and something looked at me through them
that I did not yet know.` },
  { land: 1, title: "The first blossom", sign: "Petals lie on bare earth.", text: `A blossom fell, the first to fall
in a hundred years of spring;
and where it fell, the earth was bare,
and did not grow a thing.` },
  { land: 1, title: "I asked him", sign: "Two old people hold hands.", text: `I asked him then to stop. He kissed
my forehead, soft and slow,
and said that all of it was ours.
That was the last. I know

it was the last time that his hand
was gentle on my face;
I keep it, as you keep a thorn
to know a rose’s place.` },
  // Deep Green: the turning
  { land: 2, title: "The voice below", sign: "A dog growls at the ground.", text: `Something answered from below,
from under root and stone;
it spoke to me in his own voice,
and wanted to be grown.

It said my name the way he did
at morning, by the door;
that is the way I knew he’d gone
and would come back no more.` },
  { land: 2, title: "Too many teeth", sign: "A man won't eat his bread.", text: `The lords stopped eating bread. They ate
the meat raw from the bone,
and laughed across the table, and
their teeth were not their own.` },
  { land: 2, title: "Inside out", sign: "The sky over the hamlet is the wrong colour.", text: `One night the sky turned to the red
of what lies under skin;
and when it passed, the hall was full
of what had once been men.` },
  { land: 2, title: "His eyes", sign: "A father hides his children behind him.", text: `He still was mostly him. And that
was the worst thing of all:
he watched our children like the sheep
are watched beyond the wall.` },
  { land: 2, title: "The black orchards", sign: "A blackened apple hangs on a dead tree.", text: `The orchards blackened in a week,
the apples hung like coal;
the wells filled up with something that
was moving, and not whole.` },
  { land: 2, title: "To see the sea", sign: "A girl draws waves in the dust.", text: `I woke the children before dawn
and whispered: come with me.
We’re going on a journey, loves.
We’re going to see the sea.` },
  // Bloom: the ravine
  { land: 3, title: "The old road", sign: "Two children walk hand in hand.", text: `We ran along the oldest road,
the little one on my back;
the older two held hands, and ran,
and never once looked back.

They did not cry. I tell it twice
because it must be told:
they did not cry, my brave ones, though
the night was long and cold.` },
  { land: 3, title: "The bridge", sign: "A broken bridge over a stream.", text: `He found us at the bridge. The land
is kinder than I’d be:
of all of it, it lets me keep
one thing, and gives it me:

that they were holding hands. Just that.
The rest the land has kept;
I do not ask it for the rest.
I only know I wept.` },
  { land: 3, title: "The edge", sign: "Someone looks down into a ravine.", text: `I held the little one and stepped
out where the ground was done;
I wanted us to go together.
I wanted us as one.` },
  { land: 3, title: "Not yet", sign: "Roots break through a cottage floor.", text: `But roots came up and caught us there,
and moss, and water’s spill,
and a voice that was not his said: not
yet. Not yet. Be still.` },
  { land: 3, title: "Her name", sign: "A woman calls a name across a field.", text: `My youngest was a little girl.
Her name was ${CHILD}. There.
I said it every morning once,
while combing out her hair.

I lost it for so long, so long,
like ribbon in a stream;
I have it now. I’ll hold it tight.
${CHILD}. Not a dream.` },
  { land: 3, title: "Where she went", sign: "A child laughs, and the flowers open.", text: `The land could keep just one of us.
It chose, and it kept me,
and kept her in another way:
in every bud and tree.

Each spring I bring is ${CHILD}’s spring;
she rides with me, and sings.
She always has. She always will.
She’s in the green of things.` },
];
export const MEMORIES_PER_LAND = 6;

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
