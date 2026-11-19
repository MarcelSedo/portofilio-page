// The wizard's brain: no AI, just topics, keywords and answers.
//
// Most answers are built from the rest of the content (profile.ts, about.ts),
// so when you edit the CV, the quiz or the love letter, the wizard knows it too.
// Here you only decide which words trigger what, and how the wizard talks.

import { profile } from "./profile";
import { aboutIntro, loveLetter, quiz, tescoLetter } from "./about";
import { lore } from "./lore";

export type Topic = {
  id: string;
  /** Button text */
  label: string;
  /** Words that trigger this topic when typed (lowercase, no diacritics needed) */
  keywords: string[];
  /** Each string is a separate bubble. A function is called fresh every time (e.g. random trivia). */
  answer: string[] | (() => string[]);
  link?: { href: string; label: string };
  /** Which buttons to offer next: this is how the wizard nudges people along */
  next: string[];
};

export const WIZARD_NAME = "Elderwick the Wise";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const list = (items: string[]) => items.map((i) => `• ${i}`).join("\n");
/** Skip anything that still has a [placeholder] in it */
const ready = (s: string) => !/\[.*\]/.test(s);
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
/** CV bullets are sometimes in first person; the wizard talks about Marcel */
const third = (s: string) =>
  s.replace(/\bMy\b/g, "His").replace(/\bmy\b/g, "his").replace(/\bI'm\b/g, "he's").replace(/\bI\b/g, "he").replace(/\bme\b/g, "him");
const lcFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const currentJob = profile.experience.find((j) => j.current && j.type === "Full-time") ?? profile.experience[0];
const research = profile.experience.find((j) => /research/i.test(j.title));
const learning = aboutIntro.facts.find((f) => /learning/i.test(f.label));
const sideProjects = aboutIntro.facts.find((f) => /side projects/i.test(f.label));

/* ------------------------------------------------------------------ */
/* Quiz → one topic per question                                      */
/* Keywords and button labels live here; answers come from about.ts.  */
/* A new quiz question still works without an entry: its id becomes   */
/* the keyword and the question becomes the label.                    */
/* ------------------------------------------------------------------ */

const quizTriggers: Record<string, { label: string; keywords: string[] }> = {
  boardgame: { label: "Favourite board game?", keywords: ["board game", "board games", "boardgame", "tabletop", "wingspan"] },
  videogame: { label: "Favourite video game?", keywords: ["video game", "videogame", "pokemon", "witcher", "gaming", "console"] },
  fear: { label: "What scares him?", keywords: ["afraid", "fear", "scared", "scares", "scary", "horror", "ghost", "kayako", "grudge"] },
  book: { label: "Favourite book?", keywords: ["book", "novel", "ishiguro", "favourite book", "favorite book"] },
  play: { label: "Favourite play?", keywords: ["play", "theatre", "theater", "drama", "midsummer"] },
  film: { label: "Favourite film?", keywords: ["film", "films", "movie", "movies", "cinema", "greenaway", "director"] },
  bird: { label: "Favourite bird?", keywords: ["bird", "birds", "kingfisher", "birdwatching", "birding"] },
  abbey: { label: "Favourite abbey?", keywords: ["abbey", "abbeys", "ruin", "ruins", "rievaulx", "monastery", "priory"] },
  whisky: { label: "Favourite whisky?", keywords: ["whisky", "whiskey", "scotch", "dram", "islay", "laphroaig", "drink"] },
  weather: { label: "Favourite weather?", keywords: ["weather", "fog", "rain", "sunshine", "drizzle"] },
  gallup: { label: "His top strength?", keywords: ["gallup", "strength", "strengths", "cliftonstrengths", "talent", "personality"] },
  series: { label: "Favourite TV series?", keywords: ["series", "tv", "anime", "lain", "netflix"] },
  webdesign: { label: "Favourite web design?", keywords: ["web design", "website design", "inspiration", "favourite website", "favorite website"] },
};

const quizTopics: Topic[] = quiz.map((q) => {
  const t = quizTriggers[q.id] ?? { label: q.question, keywords: [q.id] };
  return {
    id: `quiz-${q.id}`,
    label: t.label,
    keywords: t.keywords,
    answer: [`${q.options[q.answer]}. ${q.reveal}`],
    link: { href: "/about#quiz-title", label: "Test yourself in the quiz" },
    next: ["favourites", "hobbies", "contact"],
  };
});

/* ------------------------------------------------------------------ */
/* Love letter → one topic per section (by order in about.ts)         */
/* ------------------------------------------------------------------ */

const letterTriggers: { label: string; keywords: string[] }[] = [
  { label: "The sea?", keywords: ["sea", "sail", "sailing", "skipper", "boat", "ships", "gulls", "seagulls", "kipling", "defoe", "cliffs", "coast"] },
  { label: "British landscape?", keywords: ["architecture", "countryside", "landscape", "buildings", "history", "villages", "castle", "castles"] },
  { label: "British humour?", keywords: ["humour", "humor", "irony", "monarchy", "king", "royal", "charles", "manners", "dress", "style", "fashion", "clothes"] },
  { label: "British literature?", keywords: ["literature", "poetry", "poets", "poem", "shakespeare", "wilde", "osborne", "joyce", "romantics", "bronte", "bbc", "pride and prejudice", "culture"] },
  { label: "A dram?", keywords: ["british whisky", "english whisky", "welsh whisky"] },
];

const letterTopics: Topic[] = loveLetter.sections.map((s, i) => {
  const t = letterTriggers[i] ?? { label: `${s.heading}?`, keywords: s.heading.toLowerCase().split(/\W+/).filter((w) => w.length > 4) };
  return {
    id: `letter-${i}`,
    label: t.label,
    keywords: t.keywords,
    answer: [`“${s.heading}”, he calls it. In his own words:`, `“${s.body}”`],
    link: { href: "/about#letter-title", label: "Read the whole love letter" },
    next: [...loveLetter.sections.map((_, j) => `letter-${j}`).filter((id) => id !== `letter-${i}`).slice(0, 2), "relocate"],
  };
});

/* ------------------------------------------------------------------ */
/* The conversation                                                   */
/* ------------------------------------------------------------------ */

export const greeting = [
  "Greetings, traveller. I am Elderwick, keeper of this forest. I've known Marcel since he first designed dungeons for a living.",
  "Ask me anything about him: his work, his favourite things, his strange love for British weather. Or choose a path below.",
];

export const startTopics = ["who", "work", "favourites", "britain", "contact"];

export const fallback = {
  answer: [
    "Hmm. My crystal ball is cloudy on that one.",
    "Try one of these paths, or ask Marcel himself: he answers ravens rather quickly.",
  ],
  next: ["who", "work", "favourites", "contact"],
};

const coreTopics: Topic[] = [
  {
    id: "hello",
    label: "Hello!",
    keywords: ["hello", "hi", "hey", "greetings", "good morning", "good evening", "ahoj", "cau"],
    answer: ["Well met! Sit by the fire. What would you like to know about Marcel?"],
    next: ["who", "work", "favourites"],
  },
  {
    id: "who",
    label: "Who is Marcel?",
    keywords: ["who", "marcel", "about him", "himself", "introduce", "background", "lore"],
    answer: [
      `${profile.name}: ${profile.className}, based in ${profile.base}.`,
      `In his own words: “${aboutIntro.origin}”`,
    ],
    next: ["work", "level", "funfact"],
  },
  {
    id: "work",
    label: "What does he do now?",
    keywords: ["work", "job", "now", "current", "role", "ministry", "mirri", "position", "employer"],
    answer: [`${currentJob.title} since ${currentJob.period.replace(/ – now/, "")}.`, third(currentJob.bullets[0])],
    link: { href: "/experience", label: "See his experience" },
    next: ["idsk", "experience", "a11y"],
  },
  {
    id: "experience",
    label: "Where has he worked?",
    keywords: ["experience", "career", "worked", "previous", "jobs", "history", "path", "employers"],
    answer: [
      "Here's his path so far:",
      list(profile.experience.map((j) => `${j.title}, ${j.org.split(" of the ")[0]} (${j.period})`)),
    ],
    link: { href: "/experience", label: "Read the details" },
    next: ["games", "sidequests", "level"],
  },
  {
    id: "idsk",
    label: "Tell me about ID‑SK",
    keywords: ["idsk", "id-sk", "design system", "library", "npm", "storybook", "components", "gov.uk", "govuk"],
    answer: currentJob.bullets.slice(1).map(third),
    link: { href: "/projects", label: "Explore his projects" },
    next: ["a11y", "skills", "contact"],
  },
  {
    id: "a11y",
    label: "Accessibility?",
    keywords: ["accessibility", "a11y", "wcag", "screen reader", "eaa", "inclusive", "disability", "aria"],
    answer: [
      "His hill to die on. He works to WCAG 2.1 AA, tests with screen readers and builds accessibility into the components, not on top of them.",
      "Try this very chat with a keyboard or a screen reader. He'd be delighted.",
    ],
    next: ["skills", "idsk", "contact"],
  },
  {
    id: "level",
    label: "How senior is he?",
    keywords: ["senior", "junior", "mid", "medior", "level", "experienced", "years"],
    answer: [
      `${profile.level}. Honestly? A mid-level frontend developer with near-senior product thinking.`,
      "He owns a national design system end to end, but he'd rather tell you that than pretend to be a wizard like me.",
    ],
    link: { href: "/experience", label: "See his experience" },
    next: ["skills", "work", "contact"],
  },
  {
    id: "skills",
    label: "What are his skills?",
    keywords: ["skill", "skills", "stack", "tech", "react", "next", "javascript", "typescript", "css", "tailwind", "figma", "tools"],
    answer: [
      `His strengths: ${profile.abilities.map((a) => a.name).join(", ")}.`,
      `His toolbox: ${profile.inventory.join(", ")}.`,
    ],
    link: { href: "/classic-cv", label: "Read the classic CV" },
    next: ["level", "games", "contact"],
  },
  {
    id: "games",
    label: "Game design?",
    keywords: ["game design", "game designer", "level design", "pixel federation", "diggy", "designer", "crave"],
    answer: () => {
      const job = profile.experience.find((j) => /game/i.test(j.title));
      return job ? [`${job.title} at ${job.org}, ${job.period}.`, ...job.bullets.map(third)] : [];
    },
    link: profile.experience.find((j) => /game/i.test(j.title))?.link,
    next: ["quiz-videogame", "philosophy", "work"],
  },
  {
    id: "sidequests",
    label: "Side projects?",
    keywords: ["side project", "side projects", "freelance", "hobby project", "festival", "b&b", "cottage", "projects"],
    answer: [
      "Side quests, as we say in the forest:",
      list(profile.sideQuests.filter((q) => ready(q.org) && ready(q.text)).map((q) => `${q.title}, ${q.org}: ${q.text}`)),
      ...(sideProjects ? [`His own side projects: ${sideProjects.value}.`] : []),
    ],
    link: { href: "/projects", label: "Explore his projects" },
    next: ["webwork", "comic", "contact"],
  },
  {
    id: "philosophy",
    label: "Why a PhD in philosophy?",
    keywords: ["phd", "philosophy", "doctor", "university", "postdoc", "education", "study", "studies", "degree"],
    answer: [
      "Because some questions deserve a few years.",
      list(profile.education.map((e) => `${e.title}, ${e.org} (${e.period})`)),
      ...(research ? [`Now: ${research.title}, ${research.org}. ${third(research.bullets[0])}`] : []),
      "In a product team it shows as systems thinking and the knack of explaining hard things simply.",
    ],
    next: ["research", "cinema", "contact"],
  },
  {
    id: "writing",
    label: "Can he write?",
    keywords: ["write", "writing", "journalist", "journalism", "articles", "copy", "ux writing", "dennik", "sme", "pravda"],
    answer: [
      `He wrote as a journalist from ${lore.journalism.period.replace(" – ", " to ")}:\n${list(lore.journalism.beats)}`,
      "So yes: UX writing, documentation and the occasional rather good email.",
    ],
    next: ["comic", "tesco", "contact"],
  },
  {
    id: "tesco",
    label: "The Tesco letter?",
    keywords: ["tesco", "supermarket", "groceries", "shop", "shopping", "port"],
    answer: [
      tescoLetter.intro.replace(/\bI\b/g, "he"),
      "The best line? He admitted to standing in a Tesco Express almost crying over a bottle of port.",
    ],
    link: { href: "/about#tesco-title", label: "Read the email" },
    next: ["britain", "writing"],
  },
  {
    id: "britain",
    label: "Why Britain?",
    keywords: ["britain", "uk", "england", "british", "london", "why uk", "scotland", "wales", "united kingdom", "britophile"],
    answer: [
      `Ah, his great love. ${loveLetter.signature.replace("I'm", "he's")}`,
      "Ask me about the sea, the landscape, the humour or the literature. Or about GOV.UK, which shaped his whole career.",
    ],
    link: { href: "/about#letter-title", label: "Read his love letter to Britain" },
    next: ["letter-0", "letter-2", "relocate"],
  },
  {
    id: "relocate",
    label: "Would he relocate?",
    keywords: ["relocate", "relocation", "move", "move to", "moving", "live in the uk", "visa", "sponsor", "sponsorship", "remote", "hybrid", "location"],
    answer: [
      `${profile.status}. Happily, with his family.`,
      "As an EU citizen he'd need a Skilled Worker visa, so roles with sponsorship are the natural fit.",
    ],
    link: { href: "/contact", label: "Talk to him about a role" },
    next: ["languages", "contact"],
  },
  {
    id: "languages",
    label: "Languages?",
    keywords: ["language", "languages", "english", "german", "french", "slovak", "speak"],
    answer: ["Slovak natively, English at B2, German and French at A2. Elvish is still a work in progress."],
    next: ["relocate", "contact"],
  },
  {
    id: "hobbies",
    label: "What does he do for fun?",
    keywords: ["hobby", "hobbies", "fun", "free time", "weekend", "interests", "likes", "enjoy"],
    answer: [
      `Things he loves:\n${list(aboutIntro.likes)}`,
      ...(learning ? [`Currently learning: ${learning.value}.`] : []),
    ],
    link: { href: "/about#quiz-title", label: "Take the quiz about him" },
    next: ["reading", "music", "comic"],
  },
  {
    id: "favourites",
    label: "His favourite things?",
    keywords: ["favourite", "favourites", "favorite", "favorites", "best", "loves most"],
    answer: [
      "Ah, his favourites. The quiz above tests them all, but I'll spill a few. Pick one:",
    ],
    next: ["quiz-book", "quiz-film", "quiz-bird", "quiz-whisky", "quiz-fear"],
  },
  {
    id: "funfact",
    label: "Tell me a fun fact",
    keywords: ["fun fact", "fact", "secret", "surprise", "trivia", "interesting", "random", "something"],
    answer: () => [`Did you know? He ${lcFirst(pick(profile.trivia))}`],
    next: ["funfact", "favourites", "contact"],
  },
  {
    id: "research",
    label: "What does he research?",
    keywords: ["research", "researcher", "thesis", "dissertation", "heidegger", "gadamer", "phenomenology", "hermeneutics", "romano", "maldiney", "academic", "academy", "science"],
    answer: [
      `His dissertation was called “${lore.research.thesis.title}”. At the ${lore.research.institute} he works on ${lore.research.focus}.`,
      `His usual companions: ${lore.research.thinkers.join(", ")}. Long winter evenings, mostly.`,
    ],
    next: ["grants", "talks", "abroad"],
  },
  {
    id: "grants",
    label: "Research grants?",
    keywords: ["grant", "grants", "funding", "vega", "apvv", "principal investigator", "project lead"],
    answer: [
      `He led: ${lore.research.grants.led.map((g) => `“${g.title}” (${g.id}, ${g.period})`).join("; ")}.`,
      `And worked on:\n${list(lore.research.grants.coInvestigator.map((g) => `${g.title} (${g.id}, ${g.period})`))}`,
      "Writing a grant proposal, by the way, is product thinking in a very formal coat.",
    ],
    next: ["talks", "research", "contact"],
  },
  {
    id: "talks",
    label: "Talks and events?",
    keywords: ["talk", "talks", "conference", "conferences", "lecture", "lectures", "speaker", "public speaking", "presentation", "organised", "organized", "organiser", "organizer", "events", "symposium"],
    answer: [
      `A few of his conference talks:\n${list(lore.research.talks.map((t) => `“${t.title}”, ${t.where} (${t.year})`))}`,
      `Events he organised:\n${list(lore.research.organised.map((e) => `${e.name} (${e.year}), ${e.role}`))}`,
      lore.research.outreach,
    ],
    next: ["abroad", "grants", "contact"],
  },
  {
    id: "abroad",
    label: "Has he worked abroad?",
    keywords: ["abroad", "study abroad", "worked abroad", "prague", "praha", "scholarship", "mobility", "international", "foreign", "exchange"],
    answer: [
      list(lore.research.abroad.map((a) => `${a.what}${a.where ? `, ${a.where}` : ""} (${a.period})`)),
      "Britain would be the next step. He's been practising with fog for years.",
    ],
    next: ["relocate", "languages", "contact"],
  },
  {
    id: "webwork",
    label: "Websites he built?",
    keywords: ["websites", "wordpress", "woocommerce", "webflow", "wix", "e-shop", "eshop", "kolegium", "php", "payment", "freelance web", "built"],
    answer: [
      `For Kolégium Antona Neuwirtha: ${lore.web.kolegiumSites.join(", ")}.`,
      `Along the way he:\n${list(lore.web.kolegiumWork)}`,
    ],
    link: { href: "/projects", label: "Explore his projects" },
    next: ["sidequests", "skills", "contact"],
  },
  {
    id: "cinema",
    label: "Is he a film buff?",
    keywords: ["film buff", "cinephile", "csfd", "film school", "vsmu", "short films", "film programmer", "film theory", "audiovisual"],
    answer: [
      `Thoroughly. He studied audiovisual studies at film school, where he ${lore.web.filmSchool}.`,
      "Then he programmed film festivals and wrote about cinema for years. His favourite film is in the quiz, if you dare.",
    ],
    link: lore.films.profile,
    next: ["quiz-film", "writing", "sidequests"],
  },
  {
    id: "reading",
    label: "What does he read?",
    keywords: ["read", "reads", "reading", "reader", "literature", "bookworm", "library", "how many books", "databaze knih", "books"],
    answer: [
      `${lore.reading.booksRead} books so far, mostly ${lore.reading.tastes}.`,
      `Lately: ${lore.reading.recently.join(", ")}.`,
    ],
    link: lore.reading.profile,
    next: ["quiz-book", "quiz-play", "music"],
  },
  {
    id: "music",
    label: "What music?",
    keywords: ["music", "listen", "listens", "composer", "composers", "soundtrack", "soundtracks", "nyman", "glass", "vangelis", "band", "songs", "classical"],
    answer: [
      `Classical music and film soundtracks: ${lore.music.classical.join(", ")}.`,
      `And a little pop: ${lore.music.pop.join(" and ")}. He may well be listening to one of them right now.`,
    ],
    next: ["reading", "cinema", "hobbies"],
  },
  {
    id: "comic",
    label: "Does he write stories?",
    keywords: ["comic", "comics", "asphalt", "motorway", "motorways", "highway", "stories", "story", "storytelling", "fiction", "drivers"],
    answer: [
      `He does. At the moment, ${lore.writing.comic}.`,
      "Somebody has to finish them. Before that he wrote quests for Diggy's Adventure and the story of an indie game.",
    ],
    next: ["games", "writing", "sidequests"],
  },
  {
    id: "salary",
    label: "Salary?",
    keywords: ["salary", "pay", "earn", "earns", "how much", "money", "rate", "wage", "gold", "price", "cost"],
    answer: ["A wizard never discusses gold in public. Send Marcel a raven and he'll tell you himself."],
    link: { href: "/contact", label: "Send a raven" },
    next: ["contact", "relocate"],
  },
  {
    id: "contact",
    label: "How do I reach him?",
    keywords: ["contact", "reach", "email", "mail", "hire", "interview", "call", "talk", "message", "raven", "linkedin"],
    answer: ["Send a raven. That is, the contact form. He usually replies within a couple of working days."],
    link: { href: "/contact", label: "Open the contact form" },
    next: ["cv", "who"],
  },
  {
    id: "cv",
    label: "Can I see his CV?",
    keywords: ["cv", "resume", "pdf", "download"],
    answer: ["Of course. The classic version is plain and quick, and there's a PDF too."],
    link: { href: "/classic-cv", label: "Open the classic CV" },
    next: ["contact", "work"],
  },
  {
    id: "magic",
    label: "Are you real?",
    keywords: ["real", "magic", "who are you", "your name", "are you", "ai", "bot", "chatgpt", "robot", "wizard", "human"],
    answer: [
      "I'm about as real as the rest of this forest: some TypeScript and a lot of pixels. No AI, just good old spells (if‑statements).",
      "Everything I know, I read in Marcel's CV, his quiz and his love letter to Britain.",
    ],
    next: ["who", "a11y"],
  },
  {
    id: "thanks",
    label: "Thank you!",
    keywords: ["thanks", "thank you", "cheers", "ta", "dakujem", "diky"],
    answer: ["You're most welcome, traveller. Safe paths."],
    next: ["contact", "who"],
  },
];

/** Order matters on a tie: earlier topics win. The general "favourites" hub goes last,
 *  so "favourite book" lands on the book, not on the hub. */
const isHub = (t: Topic) => t.id === "favourites";
export const topics: Topic[] = [
  ...coreTopics.filter((t) => !isHub(t)),
  ...quizTopics,
  ...letterTopics,
  ...coreTopics.filter(isHub),
];
