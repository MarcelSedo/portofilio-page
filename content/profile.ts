// All site copy lives here. Edit this file, not the components.
// Anything in [square brackets] is a placeholder for you to fill in.

export type Ability = {
  name: string;
  /** 1–10. Leave null until you decide on a level. */
  level: number | null;
};

export type Job = {
  title: string;
  org: string;
  /** Short context for the organisation, shown after its name */
  orgNote?: string;
  period: string;
  type?: string;
  current?: boolean;
  bullets: string[];
  link?: { label: string; href: string };
};

export type SideQuest = {
  title: string;
  org: string;
  period: string;
  text: string;
  href?: string;
};

export type Stat = { value: string; label: string };

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index into options */
  answer: number;
  /** Shown after answering */
  reveal: string;
};

export const profile = {
  name: "Marcel Sedo",
  className: "Frontend & Design Systems Engineer",
  level: "7+ years in tech",
  background: "Philosopher · PhD",
  base: "Bratislava, Slovakia",
  status: "Open to work · UK relocation / remote",
  mainQuest: "Accessible public services for Slovakia",

  // Variant C intro
  intro: {
    class: "Design Systems Engineer",
    multiclass: "Game Designer, Philosopher",
    mainQuest: "making services fun and accessible to everyone.",
    sideQuests: "a B&B website in North Yorkshire, a Japanese film festival, the story of an indie game.",
  },

  stats: [
    { value: "7+", label: "years in tech" },
    { value: "2+", label: "years building for the web" },
    { value: "1", label: "national design system, aligned with GOV.UK" },
    { value: "v3.2.0", label: "@id-sk/react, stable on npm" },
    { value: "2.5", label: "years designing a live game" },
    { value: "PhD", label: "Philosophy" },
    { value: "5", label: "languages" },
  ] satisfies Stat[],

  links: {
    github: "https://github.com/MarcelSedo",
    cvPdf: "/Marcel-Sedo-CV.pdf",
    npm: "https://www.npmjs.com/package/@id-sk/react",
    email: "marcel.sedo1@gmail.com",
    linkedin: "https://www.linkedin.com/in/marcel-%C5%A1edo-61a841194/",
  },

  abilities: [
    { name: "Web accessibility (WCAG, EAA)", level: null },
    { name: "Design systems", level: null },
    { name: "Product ownership", level: null },
    { name: "React & Next.js", level: null },
    { name: "Game & UX design", level: null },
  ] satisfies Ability[],

  inventory: [
    "React",
    "Next.js",
    "JavaScript",
    "TypeScript",
    "Tailwind CSS",
    "SCSS",
    "Nunjucks",
    "Storybook",
    "npm",
    "Git & GitHub",
    "Figma",
    "WordPress & Webflow",
  ],

  experience: [
    {
      title: "IDSK Developer",
      org: "Ministry of Investments, Regional Development and Informatization of the Slovak Republic",
      orgNote: "the team behind Slovakia's state web standards",
      period: "Oct 2025 – now",
      type: "Full-time",
      current: true,
      bullets: [
        "Responsible for ID‑SK, the design system behind Slovakia's state websites, aligned with GOV.UK. In practice the product owner: functionality, operation, testing and proposing solutions.",
        "Helped set the accessibility standards (WCAG 2.1 AA) that Slovak public services are built on.",
        "Migrated the React component library to npm as @id-sk/react and shipped it to a stable v3.2.0, with Storybook documentation. My name is on the releases.",
        "Maintain the project's GitHub and the ID‑SK portal (Next.js): go into the code, fix bugs, review the stack and push back where the architecture needs it.",
      ],
    },
    {
      title: "Postdoctoral Researcher",
      org: "Slovak Academy of Sciences",
      period: "Jul 2025 – now",
      type: "Part-time",
      current: true,
      bullets: ["Research on concepts and logical thinking; public lectures."],
    },
    {
      title: "Web Developer",
      org: "Kolégium Antona Neuwirtha",
      orgNote: "non-profit college with university-level reach",
      period: "Aug 2024 – Aug 2025",
      type: "Self-employed",
      bullets: [
        "Worked independently as the organisation's developer: designed and built three websites (WordPress, Webflow, Wix).",
        "Built an app for tracking rooms and their occupancy, and an e-shop.",
        "Ran forms, email marketing and analytics (Paperform, Mailchimp, Mailmunch, Google Analytics).",
      ],
    },
    {
      title: "Game Designer",
      org: "Pixel Federation",
      period: "Aug 2018 – Dec 2020",
      type: "Full-time",
      bullets: [
        "Designed levels, quests and story content for Diggy's Adventure, a live free-to-play game earning over a million a month at the time.",
        "Applied UX and player psychology to keep players engaged. This is where my product thinking comes from.",
      ],
      link: { label: "Gameplay: Inca Village in Flames", href: "https://www.youtube.com/watch?v=OaAAchA7MKU" },
    },
  ] satisfies Job[],

  sideQuests: [
    {
      title: "Freelance web",
      org: "Orchard Cottage B&B, North Yorkshire",
      period: "[year]",
      text: "Website for a stone guesthouse near Ripon: UX, SEO, booking and copy (WordPress).",
    },
    {
      title: "Storyteller",
      org: "Hang The Eyelids",
      period: "2024",
      text: "Co-created the story of the indie game Crave.",
      href: "https://crave-game.com/",
    },
    {
      title: "Film Programmer",
      org: "Kino Lumière, Klap, Hviezdne noci",
      period: "2015 – 2019",
      text: "Curated Scandinavian June at Kino Lumière, the Japanese Film Festival at Klap and film sections of Hviezdne noci.",
    },
    {
      title: "Data Operations & Support Specialist",
      org: "IGAS",
      period: "2011 – 2013",
      text: "Managed internal database systems and kept data quality consistent across the company.",
    },
  ] satisfies SideQuest[],

  education: [
    { title: "PhD, Philosophy", org: "Comenius University in Bratislava", period: "2020 – 2024" },
    { title: "MA, Audiovisual Studies", org: "Academy of Performing Arts in Bratislava (VŠMU)", period: "2013 – 2018" },
  ],

  certifications: [{ title: "Introduction to Web Accessibility", org: "edX, verified certificate", period: "2026" }],

  // Explore mode
  trivia: [
    "Designed levels for Diggy's Adventure, a mobile game earning over a million a month.",
    "Programmed a whole Japanese film festival and a Scandinavian June at Kino Lumière.",
    "Built a website for a stone B&B near Ripon, with sheep in the fields and fresh bread in the kitchen.",
    "Co-wrote the story of the indie game Crave.",
    "Can explain why your bug didn't exist in the eyes of David Hume.",
  ],

  quiz: [
    {
      question: "[Which British thing does Marcel love most?]",
      options: ["[Option A]", "[Option B]", "[Option C]"],
      answer: 0,
      reveal: "[Short story behind the answer]",
    },
    {
      question: "[Guilty pleasure question]",
      options: ["[Option A]", "[Option B]", "[Option C]"],
      answer: 1,
      reveal: "[Short story behind the answer]",
    },
  ] satisfies QuizQuestion[],
};
