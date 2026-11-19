// Copy for the About page. Edit freely: the components just render this.

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  /** index of the correct option */
  answer: number;
  /** shown after answering */
  reveal: string;
};

export const quiz: QuizQuestion[] = [
  {
    id: "boardgame",
    question: "Which board game does Marcel love most?",
    options: ["Port Royal", "Wingspan", "Gloomhaven"],
    answer: 1,
    reveal: "Birds, eggs and engine-building. Of course it's the one about birds.",
  },
  {
    id: "videogame",
    question: "Which video game wins his heart?",
    options: ["The Witcher 3", "Pokémon Yellow", "Skyrim"],
    answer: 1,
    reveal: "A Pikachu trotting behind you beats any open world.",
  },
  {
    id: "fear",
    question: "What is Marcel most afraid of?",
    options: ["Global warming", "An enlarged prostate", "Kayako"],
    answer: 2,
    reveal: "The ghost from The Grudge. Nothing in this world beats that croak.",
  },
  {
    id: "book",
    question: "Which novel is his favourite?",
    options: ["Wuthering Heights", "The Remains of the Day", "Ulysses"],
    answer: 1,
    reveal: "Ishiguro's quiet butler: restraint turned into an art form.",
  },
  {
    id: "play",
    question: "And his favourite play?",
    options: ["A Midsummer Night's Dream", "The Importance of Being Earnest", "A Man for All Seasons"],
    answer: 0,
    reveal: "Fairies, lovers and a forest at night. Look around this website.",
  },
  {
    id: "film",
    question: "Which film does he rate above all?",
    options: ["Shadows of Forgotten Ancestors", "Prospero's Books", "Organ"],
    answer: 1,
    reveal: "Peter Greenaway's take on The Tempest. Shakespeare again.",
  },
  {
    id: "bird",
    question: "Which bird is Marcel's favourite?",
    options: ["Kingfisher", "Cuckoo", "Nightingale"],
    answer: 0,
    reveal: "A flash of blue over the river, worth every cold morning with binoculars.",
  },
  {
    id: "abbey",
    question: "Which ruined British abbey does he love most?",
    options: ["Rievaulx Abbey", "Fountains Abbey", "Kirkham Priory"],
    answer: 0,
    reveal: "Yorkshire stone in a quiet green valley. Nowhere is more peaceful.",
  },
  {
    id: "whisky",
    question: "His favourite whisky?",
    options: ["Laphroaig", "GlenAllachie", "Talisker"],
    answer: 0,
    reveal: "Islay peat and smoke. You either love it or you haven't tried it twice.",
  },
  {
    id: "weather",
    question: "Marcel's favourite weather?",
    options: ["Sunshine", "A proper drizzle", "Fog"],
    answer: 2,
    reveal: "Fog, gulls and the sea: the full British starter pack.",
  },
  {
    id: "gallup",
    question: "What is his top Gallup CliftonStrengths talent?",
    options: ["Competition", "Learner", "Communication"],
    answer: 1,
    reveal: "Learner. Hence the PhD, the skipper's course and this website.",
  },
  {
    id: "series",
    question: "Which series is his favourite?",
    options: ["True Detective", "Mr. Robot", "Serial Experiments Lain"],
    answer: 2,
    reveal: "A 1998 anime about the internet that has aged far too well.",
  },
  {
    id: "webdesign",
    question: "Which website design does he admire most?",
    options: ["crave-game.com", "kodeclubs.com", "motion.zajno.com"],
    answer: 2, // TODO: check the correct answer
    reveal: "Motion done with taste: playful, but never in the way.",
  },
];

export const aboutIntro = {
  title: "Lore",
  lead:
    "Frontend developer and philosopher. Before that, a level designer, film programmer and journalist. I like making complex things clear, and clear things a little magical.",
  /** RPG-style class line under the heading */
  classLine: {
    main: "Frontend developer & Design engineer",
    multiclass: ["Level designer", "Philosopher", "UX & Accessibility", "Full stack"],
  },
  // content/about.ts, inside `export const aboutIntro = { ... }`:
// 1. DELETE your current `origin: "I started at film school…",` line(s)
// 2. PASTE this whole block in its place (it also contains the portrait, level and attributes;
//    if you already pasted those from the first zip, keep only `origin` and `mainQuest` from here)

  /** Short version, quoted by the wizard */
  origin:
    "Film school, game design, philosophy and frontend sound like four careers. To me it's one quest: to build things from end to end and stand behind them like a product.",
  /** "Main quest" on the About character sheet: one string per paragraph */
  mainQuest: [
    "My goal has always been to build my own projects and stand behind them like a product. Not one slice of them, but the whole thing. So for years I've been collecting the skills that takes.",
    "I studied art from childhood, then went to film school and worked in the arts. I designed levels and quests for a game played by millions, wrote stories, designed websites and interfaces in Figma, and learned frontend, plus enough backend to get things running. Organising projects, working with people and giving talks taught me the other half: communication.",
    "That's why I feel at home where disciplines meet: UI and UX, design systems, gamification and frontend. I like connecting them, working independently and talking to everyone involved. When a project needs it, I can reach into the backend or bring in AI tools at a full-stack level. I'm not a backend developer, but I want to understand the whole process, not just my part of it.",
    "Seven years in, what I value most is responsibility, and being able to carry it. I've published a national design system, upgraded a stack that was five years out of date, and taken problems on before anyone asked, even with no senior colleague around to turn to. Documentation, tutorials and AI were my party.",
  ],
  /** Pixel-art portrait (public/marcel-portrait.png) */
  portrait: {
    src: "/marcel-portrait.png",
    alt: "Pixel-art portrait of Marcel: short dark hair, beard, round glasses and a grey jacket over a white shirt",
  },
  /** Shown on the name plate under the portrait */
  level: "7+ years in tech",
  /**
   * RPG attributes, out of 20. Self-assessed and tongue-in-cheek: edit freely.
   * `note` is shown next to the bar, so the number always has a human explanation.
   */
  attributes: [
    { name: "Curiosity", value: 18, note: "my top Gallup strength is Learner" },
    { name: "Empathy", value: 17, note: "for users first, then for colleagues" },
    { name: "Clarity", value: 16, note: "turning complex things into clear ones" },
    { name: "Craft", value: 14, note: "React, Next.js, CSS that holds" },
    { name: "Patience", value: 12, note: "legacy code tests it daily" },
  ],


  facts: [
    { label: "Home base", value: "Bratislava, Slovakia" },
    { label: "Languages", value: "Slovak (native), English (B2), German and French (A2)" },
    { label: "Currently learning", value: "a skipper's course, to finally sail" },
    { label: "Currently writing", value: "a comic about the Asphalt Woman, who finishes Slovakia's motorways and fights aggressive drivers" },
    { label: "Books read", value: "500+, mostly drama, poetry and the classics" },
    { label: "Wrote for", value: "Denník N, SME, Pravda, Kapitál, Startitup, Kinema.sk, Greencar.sk" },
    { label: "Side projects", value: "a website for Orchard Cottage B&B, a birdwatching website (in the making), the story of the indie game Crave" },
    { label: "Soundtrack", value: "Michael Nyman, Philip Glass, Zbigniew Preisner, Vangelis" },
  ],
  likeGroups: [
    { title: "Sea and sky", items: ["The sea, gulls, fog and rain", "Birdwatching", "Walks in the forest"] },
    { title: "Stone and land", items: ["Ruined abbeys", "The British countryside", "Travelling"] },
    { title: "Page and stage", items: ["Shakespeare, Wilde, Osborne", "Ishiguro, Joyce, the Romantics", "Japanese and ancient literature"] },
    { title: "Screen and sound", items: ["Peter Greenaway films", "Film soundtracks", "Cocteau Twins"] },
    { title: "Table and glass", items: ["Board games (Wingspan above all)", "Islay whisky"] },
  ],
  /** flat list, used by the wizard */
  get likes() {
    return this.likeGroups.flatMap((g) => g.items);
  },
};

export const loveLetter = {
  title: "A love letter to Britain",
  sections: [
    {
      heading: "The sea, the gulls and the fog",
      body:
        "I love the sea, the cry of gulls, fog and rain, though Britain is so much more than its weather. I'm taking a skipper's course because I've wanted to sail ever since I read Kipling's Captains Courageous and Defoe's Robinson Crusoe. I still love the sea as much as I did then, along with the ships, the seabirds and the English cliffs.",
    },
    {
      heading: "Stone set into the land",
      body:
        "I admire how the British set their architecture into the landscape, and I love wandering through the countryside, from one ruined abbey to the next, with a book on British history in my bag.",
    },
    {
      heading: "Manners, irony and a little mud",
      body:
        "I love the dry humour and the self-irony, and the paradox of a culture where great refinement sits right next to the gloriously blunt. I find the British attitude to the monarchy endearing: affection with a healthy dose of irony and pragmatism. And yes, I try to dress like a young Prince Charles.",
    },
    {
      heading: "Stage, page and screen",
      body:
        "I grew up on Shakespeare, then Wilde and Osborne. Wuthering Heights shaped me, so did Joyce and Ishiguro and the Romantic poets. On screen, everything from Peter Greenaway to the BBC's Pride and Prejudice.",
    },
    {
      heading: "A dram, please",
      body:
        "I enjoy British whisky, and not only Scotch, though nothing beats a peaty dram from Islay.",
    },
  ],
  signature: "In short: I'm a Britophile.",
};

/** A real email Marcel sent to Tesco when it left Central Europe. */
export const tescoLetter = {
  intro: "When Tesco announced it was leaving Central Europe after three decades, I wrote to them.",
  paragraphs: [
    "I am writing this email not as a business inquiry, but simply to share a short personal story as your time in Central Europe comes to a close.",
    "My wife and I have always shared a deep love for the United Kingdom: its culture, its art, its atmosphere and its everyday life. For us, having Tesco stores in Slovakia was far more than just a place to buy groceries. Over the decades, walking into Tesco felt like stepping onto a small, comforting bridge between our home in Bratislava and the UK. Whether it was picking up British whisky, Tesco Finest products, teas, or just recognising the familiar branding, it brought us a sense of warmth and a connection to a place we hold very dear.",
    "Hearing about Tesco's departure after three decades feels a bit like saying goodbye to an old friend who has been part of our daily routine since early childhood. To be completely honest, the other day I was standing in our local Tesco Express almost crying over a bottle of port.",
    "We just wanted to reach out to the team in the UK and say thank you for being that quiet daily reminder of British life for us over all these years.",
  ],
  signOff: ["Warmest regards,", "Marcel Šedo", "Bratislava, Slovakia"],
};
