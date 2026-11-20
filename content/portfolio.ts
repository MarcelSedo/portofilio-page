// Portfolio page: selected work with links. Edit the words here.

export type Link = { label: string; href: string; note?: string };

export type CaseStudy = {
  id: string;
  kicker: string;
  title: string;
  period: string;
  role: string;
  summary: string;
  /** What I owned / decided / did */
  did: string[];
  tags: string[];
  links: Link[];
};

export type Video = { title: string; href: string; what: string };

export const portfolioIntro = {
  title: "Portfolio",
  lead:
    "Selected work: a national design system I run, a non-profit's whole web presence I built on my own, game levels played by millions, and the writing I did before frontend. Each project says what was mine.",
};

export const caseStudies: CaseStudy[] = [
  {
    id: "idsk",
    kicker: "Design system · Government",
    title: "ID‑SK, Slovakia's national design system",
    period: "Oct 2025 – now",
    role: "Frontend developer, in practice the product owner",
    summary:
      "The design system behind Slovakia's state websites and e-services, aligned with GOV.UK. I decide how it works, test it, run it, and fix the code myself.",
    did: [
      "Migrated the React component library to npm as @id-sk/react and took it to a stable v3.2.0, documented in Storybook.",
      "Got the ID‑SK portal working again and keep it running (Next.js, self-hosted).",
      "Upgraded a stack that was five years out of date and review the architecture.",
      "Set the accessibility rules (WCAG 2.1 AA) that Slovak public services are built on.",
    ],
    tags: ["React", "Next.js", "Storybook", "SCSS", "Tailwind CSS", "npm", "Docker", "WCAG 2.1 AA"],
    links: [
      { label: "ID‑SK portal", href: "https://idsk.gov.sk/", note: "the design system's home" },
      { label: "@id-sk/react on npm", href: "https://www.npmjs.com/package/@id-sk/react?activeTab=versions", note: "release history" },
      { label: "Storybook: components", href: "https://komponenty.idsk3.gov.sk/?path=/docs/molecules-accordion--docs", note: "e.g. the accordion" },
      { label: "IDSK 3 Frontend on GitHub", href: "https://github.com/id-sk/idsk3-frontend", note: "the previous library" },
    ],
  },
  {
    id: "kolegium",
    kicker: "Websites · Non-profit",
    title: "The only developer of a non-profit college",
    period: "Aug 2024 – Aug 2025",
    role: "Web developer, on my own",
    summary:
      "Kolégium Antona Neuwirtha runs a college, a primary school and educational programmes. I owned their whole web presence: design, build, launch and upkeep.",
    did: [
      "Designed and built their websites, an e-shop and an app for tracking rooms and their occupancy.",
      "Updated an outdated stack and got the e-shop working properly: automated invoicing, tipping and payment gateways.",
      "Built small apps that made everyday work easier for the staff, and ran forms, email marketing and analytics.",
    ],
    tags: ["WordPress", "WooCommerce", "Webflow", "Wix", "JavaScript", "Analytics"],
    links: [
      { label: "E-shop", href: "https://kolegium.org/obchod/", note: "kolegium.org" },
      { label: "Citadela primary school", href: "https://citadela.kolegium.org/", note: "Bratislava and Ivanka pri Dunaji" },
      { label: "The campus", href: "https://kampus.kolegium.org/", note: "Kampus Kolégia" },
      { label: "Akadémia veľkých diel", href: "https://www.akademiavelkychdiel.sk/", note: "character education through great books" },
    ],
  },
  {
    id: "diggy",
    kicker: "Level design · Live game",
    title: "Levels for Diggy's Adventure",
    period: "Aug 2018 – Dec 2020",
    role: "Level designer at Pixel Federation, working independently",
    summary:
      "A live free-to-play game with millions of players. The framing story of each event was agreed in team sessions; the levels themselves were mine.",
    did: [
      "Wrote the dialogues and designed the puzzles.",
      "Built the environments from the game's assets in its XML editor.",
      "Decided the player's whole flow through a level, and tested every level myself before the testers did.",
      "Often led events, coordinating other people's work into one release on time.",
    ],
    tags: ["Level design", "Puzzle design", "Dialogue", "Player flow", "Playtesting"],
    links: [],
  },
  {
    id: "site",
    kicker: "Personal project",
    title: "This website",
    period: "2026",
    role: "Design, code, art direction",
    summary:
      "A CV you can play: a pixel-art forest, characters, a wizard who answers questions and a village map. Built so every bit of it works with a keyboard and a screen reader.",
    did: [
      "Accessible game UI: real buttons, native dialogs, focus management, reduced-motion and high-contrast modes.",
      "Pixel art drawn by code, so pictures and click targets always line up.",
    ],
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Accessibility", "Game UI"],
    links: [{ label: "Source on GitHub", href: "https://github.com/MarcelSedo/portofilio-page" }],
  },
];

export const diggyVideos: Video[] = [
  {
    title: "Queen of Hearts' Court",
    href: "https://www.youtube.com/watch?v=dUrmUre23cc",
    what: "The detective-themed finale of the Alice in Wonderland event, which I designed.",
  },
  {
    title: "Inca Village in Flames",
    href: "https://www.youtube.com/watch?v=OaAAchA7MKU",
    what: "The first level in Diggy's where players choose where the story goes, with a new mechanic I brought in.",
  },
  {
    title: "Futurocity #7, Valentine 2020",
    href: "https://www.youtube.com/watch?v=sdByRdWmJuY",
    what: "Puzzles spread over several floors that only make sense together.",
  },
];

export const comingSoon = {
  title: "Play: Time Traveller",
  text:
    "A small timeline game: put famous films in the right order before the clock runs out. Playable with a mouse, touch or keyboard, with a relaxed mode without a clock. The 124 cards come from Wikidata, so every year can be checked.",
  href: "/games/time-traveller",
};

export const githubProfile = { label: "GitHub: MarcelSedo", href: "https://github.com/MarcelSedo" };
