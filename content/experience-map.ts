// Experience page: a little RPG village map.
// Buildings open the work history, villagers tell small facts about Marcel.
// Edit the words here; the map layout lives in components/experience/layouts.ts.

export type PlaceId = "castle" | "inn" | "farm" | "manor" | "market";
export type VillagerId = "reader" | "painter" | "cook" | "athlete" | "neighbour" | "birder" | "dog" | "cat";

export type Entry = {
  title: string;
  org?: string;
  period?: string;
  type?: string;
  /** What Marcel owned and was responsible for: the selling points */
  highlights: string[];
  tags?: string[];
  link?: { label: string; href: string };
};

export type SkillBranch = { name: string; skills: string[] };

export type Place = {
  id: PlaceId;
  /** Text on the banner above the building */
  banner: string;
  /** What the building is, for screen readers and the fast-travel list */
  building: string;
  /** One line under the title in the window */
  intro: string;
  entries?: Entry[];
  branches?: SkillBranch[];
};

export type Villager = {
  id: VillagerId;
  name: string;
  /** e.g. "a woman reading a book" – used in the button name */
  who: string;
  lines: string[];
};

export const places: Place[] = [
  {
    id: "castle",
    banner: "IT Jobs",
    building: "the castle ruin",
    intro: "Where the real battles are fought: four jobs in tech, from databases and games to the state's design system.",
    entries: [
      {
        title: "Frontend Developer, ID‑SK Design System",
        org: "Ministry of Investments, Regional Development and Informatization of the Slovak Republic",
        period: "Oct 2025 – now",
        type: "Full-time · in practice the product owner",
        highlights: [
          "In practice the product owner of ID‑SK, Slovakia's national design system for state websites, aligned with GOV.UK: functionality, operation, testing and proposing solutions.",
          "Set the accessibility rules (WCAG 2.1 AA) that Slovak public services are built on.",
          "Redesigned the component library and built a new one: migrated the React library to npm as @id-sk/react and shipped it to a stable v3.2.0 with Storybook documentation. My name is on the releases.",
          "Got the ID‑SK portal working again and keep it running (Next.js, self-hosted).",
          "Responsible for the technical stack: I review the architecture, push back where it needs it, and upgraded a stack that was five years out of date.",
          "Mostly on my own: I take problems on before anyone asks and solve them without a senior colleague next to me, with documentation, tutorials and AI.",
        ],
        tags: ["Next.js", "React", "JavaScript", "Tailwind CSS", "SCSS", "Nunjucks", "HTML", "Docker", "GitHub", "Figma", "Storybook", "WCAG 2.1 AA"],
      },
      {
        title: "Web Developer",
        org: "Kolégium Antona Neuwirtha, a non-profit college",
        period: "Aug 2024 – Aug 2025",
        type: "Self-employed · the only developer",
        highlights: [
          "The organisation's only developer: I owned its whole web presence from design to launch and kept it running.",
          "Designed and built three websites, an app for tracking rooms and their occupancy, and an e-shop.",
          "Updated an outdated stack and got the e-shop working properly: automated invoicing, tipping and payment gateways.",
          "Built small apps that made everyday work easier for the staff.",
          "Ran forms, email marketing and analytics, and used the data to improve the sites.",
        ],
        tags: ["WordPress", "WooCommerce", "Webflow", "Wix", "HTML", "CSS", "JavaScript", "Mailchimp", "Google Analytics"],
      },
      {
        title: "Level Designer",
        org: "Pixel Federation, Diggy's Adventure",
        period: "Aug 2018 – Dec 2020",
        type: "Full-time",
        highlights: [
          "An independent mid-level designer on a live game played by millions and earning over a million a month.",
          "Owned each level completely: its design, interactivity and story, built in the game's XML editor.",
          "My favourite work: detective-themed mines, from the story and copy to the puzzles.",
          "Often led events, which meant coordinating other people's work into one release on time.",
          "Wrote slogans for our products, and used UX and player psychology every day. This is where my product thinking comes from.",
        ],
        tags: ["Level design", "Storytelling", "XML", "UX", "Player psychology", "Live ops"],
        link: { label: "Gameplay: Inca Village in Flames", href: "https://www.youtube.com/watch?v=OaAAchA7MKU" },
      },
      {
        title: "Database Administrator",
        org: "IGAS, s.r.o.",
        period: "Jan 2010 – Jun 2013",
        type: "Full-time",
        highlights: [
          "Looked after Datagas, the company's database system: day-to-day administration and changes to its data structures.",
          "Kept the data clean and consistent across the company.",
          "Gave technical support to colleagues and handled the administration around it.",
          "Ran the company's Joomla website.",
        ],
        tags: ["Databases", "Data structures", "Technical support", "Joomla"],
      },
    ],
  },
  {
    id: "inn",
    banner: "IT Projects",
    building: "the inn",
    intro: "Every inn has its tales. These are the things I built on my own, and the list keeps growing.",
    entries: [
      {
        title: "Story for Crave",
        org: "Hang The Eyelids, an indie game",
        period: "2024",
        highlights: ["Co-created the story of the game: its world, characters and narrative."],
        tags: ["Storytelling", "Game writing"],
        link: { label: "crave-game.com", href: "https://crave-game.com/" },
      },
      {
        title: "Client websites",
        org: "freelance",
        period: "2008 – 2024",
        highlights: [
          "Websites and digital content for clients, alongside my other jobs.",
          "For example Orchard Cottage, a stone B&B near Ripon in North Yorkshire: the whole site, from UX and SEO to booking and copy.",
        ],
        tags: ["WordPress", "UX", "SEO", "Copywriting"],
      },
      {
        title: "This website",
        org: "the one you're walking around in",
        highlights: [
          "Designed and built end to end: pixel-art forest, characters, a wizard who answers questions, and this village. All of it keyboard and screen-reader friendly.",
        ],
        tags: ["Next.js", "TypeScript", "Tailwind CSS", "Accessibility", "Game UI"],
      },
      {
        title: "Birdwatching website",
        org: "in the making",
        highlights: ["A side project for fellow birdwatchers."],
      },
      {
        title: "Small apps and games",
        org: "coming soon",
        highlights: ["My own little apps and games will move into the inn one by one."],
      },
    ],
  },
  {
    id: "farm",
    banner: "School",
    building: "the farmhouse",
    intro: "An English farm, where things grow slowly and properly.",
    entries: [
      {
        title: "PhD, Philosophy",
        org: "Comenius University in Bratislava and the Institute of Philosophy, Slovak Academy of Sciences",
        period: "2020 – 2024",
        highlights: [
          "Thesis: Event and Art. Phenomenology, hermeneutics and performative philosophy.",
          "Led my own research grant, organised conferences and spent a term at Charles University in Prague.",
        ],
      },
      {
        title: "MA, Audiovisual Studies",
        org: "Academy of Performing Arts in Bratislava (VŠMU), Faculty of Film and Television",
        period: "2013 – 2018",
        highlights: ["Film school: I shot short films, wrote stories and analysed audiovisual works."],
      },
      {
        title: "Introduction to Web Accessibility",
        org: "W3C on edX, verified certificate",
        period: "2026",
        highlights: ["Because accessibility deserves to be learnt properly, not guessed."],
      },
      {
        title: "Art school, visual arts",
        org: "a public art school for children in Žilina",
        period: "five years",
        highlights: ["Five years of drawing and painting after regular school. That's where design started for me."],
      },
      {
        title: "Language schools",
        org: "English in Žilina (1998 – 2006), French in Bratislava (2021 – 2022)",
        highlights: ["Eight years of English lessons as a child, and French as an adult, for the fun of it."],
      },
    ],
  },
  {
    id: "manor",
    banner: "Other jobs & projects",
    building: "the manor house",
    intro: "A grand old house with many rooms: research, film, writing and events. They taught me to organise, speak and write.",
    entries: [
      {
        title: "Researcher",
        org: "Slovak Academy of Sciences (postdoc) · VŠMU Faculty of Film and Television",
        period: "2025 – now · 2018 – 2019",
        type: "Part-time",
        highlights: [
          "Postdoc research on concepts and logical thinking, with public lectures.",
          "At VŠMU: a grant-funded post with a monograph as the main result, teaching and conferences. I did it alongside my full-time job at Pixel Federation.",
        ],
      },
      {
        title: "Film programmer",
        org: "a cinema and film festivals: Kino Lumière, the Japanese Film Festival at Klap, Hviezdne noci",
        period: "2015 – 2019",
        highlights: [
          "Chose and put together film programmes for a cinema and for festivals, from Scandinavian June to Japanese cinema.",
          "Introduced screenings to audiences in cinemas and at festivals.",
        ],
      },
      {
        title: "Events, talks and radio",
        org: "symposia, conferences and cultural events",
        highlights: [
          "Organised and co-organised symposia, conferences and cultural events, from the first idea to the day itself.",
          "Gave lectures, hosted discussions and presented on the radio.",
        ],
      },
      {
        title: "Director, Club of Film Journalists",
        org: "Klub filmových novinárov",
        highlights: ["Led the Slovak association of film journalists."],
      },
      {
        title: "Journalist, editor and social media",
        org: "Kinema.sk, Greencar.sk; Denník N, SME, Pravda, Kapitál",
        period: "2009 – 2023",
        highlights: [
          "Film news and features, electric mobility, essays and commentary: writing to a deadline, for real readers.",
          "Ran social media for publications and events.",
        ],
      },
      {
        title: "Film archive",
        org: "photo and poster archive",
        highlights: ["Looked after a film archive's collection of photographs and posters."],
      },
    ],
  },
  {
    id: "market",
    banner: "Skill trees",
    building: "the market",
    intro: "Everything I trade in, sorted by stall.",
    branches: [
      { name: "Frontend", skills: ["React", "Next.js", "JavaScript", "TypeScript", "Tailwind CSS", "SCSS", "Nunjucks", "Storybook"] },
      { name: "Accessibility", skills: ["WCAG 2.1 AA", "European Accessibility Act", "Accessible components", "Design system standards"] },
      { name: "Design & UX", skills: ["Design systems", "Figma", "UI and UX design", "Game design", "Gamification", "Canva, Photopea"] },
      { name: "Product", skills: ["Product ownership", "Owning a technical stack", "Testing", "Documentation", "Releases on npm"] },
      { name: "Tools & backend", skills: ["Git & GitHub", "npm", "Docker", "REST APIs (basics)", "PHP (basics)", "Databases", "WordPress & WooCommerce", "Webflow", "Analytics", "AI tools"] },
      { name: "People", skills: ["Organising symposia and events", "Public talks and radio", "Leading an association", "Writing", "Coordinating teams", "Working independently"] },
      { name: "Languages", skills: ["Slovak (native)", "English (B2)", "German (A2)", "French (A2)"] },
    ],
  },
];

export const villagers: Villager[] = [
  {
    id: "reader",
    name: "Mrs Bennet",
    who: "a woman reading a book",
    lines: ["Did you know Marcel adores Jane Austen?", "Drama, poetry, the classics… he's read over 500 books. I lend him mine."],
  },
  {
    id: "painter",
    name: "The painter",
    who: "a painter at an easel",
    lines: ["His favourite colours? Dark green and brown.", "Forest colours. Look around: he painted this whole village in them."],
  },
  {
    id: "cook",
    name: "The cook",
    who: "a cook with a big pot",
    lines: ["Marcel's favourite food is ramen.", "A good bowl fixes most bugs. The rest he fixes himself."],
  },
  {
    id: "athlete",
    name: "The sports fan",
    who: "a young man with a ball",
    lines: ["Marcel used to play volleyball and football.", "These days he'll happily watch any sport at all."],
  },
  {
    id: "neighbour",
    name: "The neighbour",
    who: "an old neighbour with a walking stick",
    lines: ["Nice lad, that Marcel. His wife is called Lenka.", "You'll see them walking the dog past my gate."],
  },
  {
    id: "birder",
    name: "The birdwatcher",
    who: "a birdwatcher with binoculars",
    lines: ["Shh! Marcel watches birds too.", "He loves the sea, gulls, fog and rain. A proper British soul."],
  },
  { id: "dog", name: "Sirius", who: "Sirius the dog", lines: ["Woof!", "(This is Sirius, Marcel's dog. He'd like a walk.)"] },
  { id: "cat", name: "Ajko", who: "Ajko the cat", lines: ["Mrrr.", "(Ajko, Marcel's tomcat, doesn't give interviews.)"] },
];
