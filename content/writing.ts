// "Published elsewhere": a short, curated list of Marcel's bylines in Slovak and Czech media,
// with English titles and one-line summaries for readers who don't speak Slovak.
// Shown on the Portfolio page (components/notes/Bylines.tsx).

export type Byline = {
  /** English title (translation) */
  title: string;
  /** Original title */
  original: string;
  outlet: string;
  /** What the outlet is, in a few words, for a UK reader */
  outletNote: string;
  date: string; // ISO date
  kind: "Essay" | "Interview" | "Radio" | "News" | "Papers";
  summary: string;
  href: string;
  lang: "sk" | "cs";
};

export const bylinesIntro = {
  title: "Published elsewhere",
  lead:
    "Before frontend, I wrote for Slovakia's national press for more than a decade: reviews, interviews, essays and commentary for papers that set the public conversation, from Denník N, SME and Pravda to cultural magazines and public radio. Most of it is in Slovak, so here is a short selection with English summaries.",
  primer: [
    "Denník N: the country's leading independent quality daily, founded by journalists who left SME.",
    "SME and Pravda: two of the longest-running national daily newspapers.",
    "Rádio Devín: the arts and culture station of Slovak public radio, roughly the BBC Radio 3 of Slovakia.",
    "Kapitál: a monthly paper on culture, philosophy and society.",
    "Postoj: a national daily news and opinion site.",
  ],
};

export const bylines: Byline[] = [
  {
    title: "To become Michael Scott",
    original: "Stať sa Michaelom Scottom",
    outlet: "Kapitál",
    outletNote: "monthly on culture and philosophy",
    date: "2023-05-24",
    kind: "Essay",
    summary:
      "What The Office teaches us about embarrassment: with Erving Goffman, how comedy lets us survive the moments when our social roles fall apart.",
    href: "https://kapital-noviny.sk/stat-sa-michaelom-scottom/",
    lang: "sk",
  },
  {
    title: "In Poland I'm a co-author, in Hollywood just a technician",
    original: "Idziak: V Poľsku som spolutvorca, v Hollywoode len technik",
    outlet: "Pravda",
    outletNote: "national daily",
    date: "2018-05-14",
    kind: "Interview",
    summary:
      "An interview with Sławomir Idziak, cinematographer of Kieślowski's films, Harry Potter and the Order of the Phoenix and Black Hawk Down, on how the job differs in Europe and in Hollywood.",
    href: "https://www.pravda.sk/spravy/kultura/clanok/469557-idziak-v-polsku-som-spolutvorca-v-hollywoode-len-technik",
    lang: "sk",
  },
  {
    title: "Shedding light on film theory",
    original: "V dotyku s kultúrou na festivale 4 živly: Svetlo do filmovej teórie",
    outlet: "Rádio Devín",
    outletNote: "Slovak public radio, arts and culture",
    date: "2023-08-12",
    kind: "Radio",
    summary:
      "I co-hosted a live public-radio discussion with four film scholars at the 4 živly film festival: what film theory is for, and why young people should care.",
    href: "https://devin.stvr.sk/clanky/temy/333838/v-dotyku-s-kulturou-na-festivale-4-zivly-svetlo-do-filmovej-teorie",
    lang: "sk",
  },
  {
    title: "Bring back the hat, or the paradox of conservatism",
    original: "Za návrat klobúkov alebo Paradox konzervativizmu",
    outlet: "Postoj",
    outletNote: "national news and opinion site",
    date: "2021-10-09",
    kind: "Essay",
    summary:
      "A light-hearted essay on why hardly anyone wears a hat any more, what clothes say about ceremony and growing up, and why Ascot still gets it right.",
    href: "https://www.postoj.sk/90000/za-navrat-klobukov-alebo-paradox-konzervativizmu",
    lang: "sk",
  },
  {
    title: "Academic papers",
    original: "Academia.edu",
    outlet: "Academia.edu",
    outletNote: "research papers, mostly in Slovak with English abstracts",
    date: "2026-01-01",
    kind: "Papers",
    summary:
      "Phenomenology, the philosophy of the event and film theory, published in journals such as Filozofia, Filosofický časopis and Slovenské divadlo.",
    href: "https://sav-sk.academia.edu/Marcel%C5%A0edo",
    lang: "sk",
  },
];
