// Portfolio page: selected work with links. Edit the words here.

/**
 * A tile in a project's gallery. Screenshots: put the file in public/portfolio/
 * under the name given in `image`. Until the file exists, the tile shows a pixel
 * placeholder, so nothing breaks. Best size: 1280×800 (16:10), .webp or .png.
 */
export type Tile = {
  label: string;
  href: string;
  note?: string;
  /** e.g. "/portfolio/idsk-portal.webp" */
  image?: string;
  /** YouTube video id: its thumbnail is used when there's no own screenshot */
  youtube?: string;
  kind: "site" | "design" | "docs" | "package" | "code" | "video";
};

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
  tiles: Tile[];
  tilesHeading: string;
};

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
      "Wrote the documentation for the ID‑SK 3.1.0 Figma kit, tested it and consulted on UX proposals.",
    ],
    tags: ["React", "Next.js", "Storybook", "Figma", "SCSS", "Tailwind CSS", "npm", "Docker", "WCAG 2.1 AA"],
    tilesHeading: "See it live",
    tiles: [
      { kind: "site", label: "ID‑SK portal", href: "https://idsk.gov.sk/", note: "The design system's home", image: "/portfolio/idsk-portal.webp" },
      { kind: "design", label: "ID‑SK 3.1.0 in Figma", href: "https://www.figma.com/community/file/1581301778555425083/idsk-3-1-0", note: "Design kit: documentation, testing, UX consulting", image: "/portfolio/idsk-figma.webp" },
      { kind: "docs", label: "Storybook: components", href: "https://komponenty.idsk3.gov.sk/?path=/docs/molecules-accordion--docs", note: "Live component docs", image: "/portfolio/idsk-storybook.webp" },
      { kind: "package", label: "@id-sk/react on npm", href: "https://www.npmjs.com/package/@id-sk/react?activeTab=versions", note: "Release history up to v3.2.0", image: "/portfolio/idsk-npm.webp" },
      { kind: "code", label: "IDSK 3 Frontend on GitHub", href: "https://github.com/id-sk/idsk3-frontend", note: "The previous library" },
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
    tilesHeading: "See it live",
    tiles: [
      { kind: "site", label: "E-shop", href: "https://kolegium.org/obchod/", note: "kolegium.org", image: "/portfolio/kolegium-eshop.webp" },
      { kind: "site", label: "Citadela primary school", href: "https://citadela.kolegium.org/", note: "Bratislava and Ivanka pri Dunaji", image: "/portfolio/kolegium-citadela.webp" },
      { kind: "site", label: "The campus", href: "https://kampus.kolegium.org/", note: "Kampus Kolégia", image: "/portfolio/kolegium-kampus.webp" },
      { kind: "site", label: "Akadémia veľkých diel", href: "https://www.akademiavelkychdiel.sk/", note: "Character education through great books", image: "/portfolio/kolegium-avd.webp" },
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
    tilesHeading: "Watch the levels",
    tiles: [
      { kind: "video", label: "Queen of Hearts' Court", href: "https://www.youtube.com/watch?v=dUrmUre23cc", youtube: "dUrmUre23cc", image: "/portfolio/diggy-queen.webp", note: "The detective-themed finale of the Alice in Wonderland event." },
      { kind: "video", label: "Inca Village in Flames", href: "https://www.youtube.com/watch?v=OaAAchA7MKU", youtube: "OaAAchA7MKU", image: "/portfolio/diggy-inca.webp", note: "The first level where players choose where the story goes, with a new mechanic I brought in." },
      { kind: "video", label: "Futurocity #7, Valentine 2020", href: "https://www.youtube.com/watch?v=sdByRdWmJuY", youtube: "sdByRdWmJuY", image: "/portfolio/diggy-futurocity.webp", note: "Puzzles spread over several floors that only make sense together." },
    ],
  },
];

export const comingSoon = {
  title: "Time Traveller",
  text:
    "A small timeline game: put famous films in the right order before the clock runs out. Playable with a mouse, touch or keyboard, with a relaxed mode without a clock. 661 films with pixel posters drawn by code; every year comes from Wikidata and can be checked.",
  href: "/games/time-traveller",
  image: "/portfolio/time-traveller.webp",
};

export const githubProfile = { label: "GitHub: MarcelSedo", href: "https://github.com/MarcelSedo" };
