import { L, type Txt } from "./story";

export const UI = {
  title: L("Emma", "Emma"),
  subtitle: L("A Rainy Day at Hartfield", "Daždivý deň v Hartfielde"),
  act: L("Act I", "1. dejstvo"),
  press: L("Press Enter", "Stlač Enter"),
  continue: L("Continue", "Pokračovať"),
  newGame: L("New game", "Nová hra"),
  confirmNew: L("Start again? Your saved game will be lost.", "Začať odznova? Uložená hra sa stratí."),
  yes: L("Yes", "Áno"), no: L("No", "Nie"),
  language: L("Language: English", "Jazyk: slovenčina"),
  howTo: L("How to play", "Ako hrať"),
  portfolio: L("Back to the portfolio", "Späť do portfólia"),
  credits: L("After Jane Austen's Emma (1815). Game, words and pixels by Marcel Šedo. Type: IM Fell English (Igino Marini) and Pinyon Script (Nicole Fally), SIL Open Font License.",
    "Podľa románu Jane Austenovej Emma (1815). Hru, texty a pixely urobil Marcel Šedo. Písma: IM Fell English (Igino Marini) a Pinyon Script (Nicole Fally), licencia SIL Open Font License."),
  howToText: [
    L("Walk with the arrow keys or WASD; on a phone, use the pad.", "Chodíš šípkami alebo WASD; na mobile tlačidlami."),
    L("E, Space or Enter: talk, examine, continue.", "E, medzerník alebo Enter: rozprávať, skúmať, pokračovať."),
    L("B: the Casebook – items, letters, words, people and a map of hearts.", "B: Casebook – predmety, listiny, výpovede, osoby a mapa sŕdc."),
    L("Esc: the menu. The game saves by itself.", "Esc: menu. Hra sa ukladá sama."),
    L("Emma sends you; she has a fine nose for where to look and a terrible one for who loves whom. When she guesses wrong, object – with proof.", "Emma ťa posiela; má výborný nos na to, kde hľadať, a strašný na to, kto koho ľúbi. Keď sa pomýli, namietni – s dôkazom."),
  ],
  menu: { casebook: L("Casebook", "Casebook"), tasks: L("Tasks", "Úlohy"), skills: L("Accomplishments", "Zručnosti"), settings: L("Settings", "Nastavenia"), title: L("Save & leave", "Uložiť a odísť"), close: L("Back", "Späť") },
  tabs: { item: L("Items", "Predmety"), letter: L("Letters", "Listiny"), word: L("Words", "Výpovede"), people: L("People", "Osoby"), map: L("Map", "Mapa") },
  tabSub: { item: L("physical evidence", "hmotné dôkazy"), letter: L("papers and notes", "papiere a poznámky"), word: L("what people said", "čo kto povedal"), people: L("of Hartfield", "z Hartfieldu"), map: L("who loves whom", "kto koho ľúbi") },
  empty: L("Nothing here yet.", "Zatiaľ nič."),
  found: L("You found something!", "Našla si niečo!"),
  heard: L("Noted in your Casebook", "Zapísané do Casebooku"),
  toCasebook: L("added to the Casebook", "pridané do Casebooku"),
  given: L("You hand it over.", "Odovzdáš to."),
  where: L("Found", "Nájdené"),
  unmet: L("not yet met", "zatiaľ nestretnutá osoba"),
  emmaThinks: L("Emma thinks…", "Emma si myslí…"),
  object: L("Object!", "Namietam!"), agree: L("Agree", "Súhlasiť"),
  present: L("Present this", "Predložiť"),
  chooseProof: L("Choose your proof", "Vyber dôkaz"),
  wrongProof: L("That proves nothing at all, Harriet. Think!", "To vôbec nič nedokazuje, Harriet. Mysli!"),
  agreed: L("There, you see? I am never wrong. …Though you do look doubtful.", "No vidíš? Nikdy sa nemýlim. …Hoci sa tváriš pochybovačne."),
  task: L("Emma asks", "Emma žiada"),
  plan: L("The plan", "Plán"),
  side: L("Small kindnesses", "Drobné láskavosti"),
  sideShawl: L("Return Papa's shawl", "Vráť otcovi šál"),
  sideWindow: L("Shut the draughty gallery window", "Zavri okno na galérii, kde ťahá"),
  skillsIntro: L("A young lady's accomplishments. Practise them; they open doors.", "Zručnosti mladej dámy. Precvičuj ich; otvárajú dvere."),
  skill: {
    needle: [L("Needlework", "Vyšívanie"), L("Emma's embroidery frame, in her room.", "Emmin vyšívací rám v jej izbe."), L("A steady hand and an eye for patterns.", "Pevná ruka a oko pre vzory.")],
    music: [L("Music", "Hudba"), L("The pianoforte in the drawing room.", "Klavír v salóne."), L("Mr Woodhouse likes a soft air: it puts him in a giving mood.", "Pán Woodhouse má rád tiché piesne: naladia ho štedro.")],
    house: [L("Housekeeping", "Domácnosť"), L("Help the servants – Patrick and his silver.", "Pomáhaj služobníctvu – Patrickovi so striebrom."), L("Servants talk to those who help them.", "Služobníctvo sa zdôverí tým, čo im pomáhajú.")],
  } as Record<string, Txt[]>,
  settingsLang: L("Language", "Jazyk"), settingsSpeed: L("Text speed", "Rýchlosť textu"), speeds: [L("Gentle", "Pokojná"), L("Quick", "Rýchla"), L("Instant", "Okamžitá")],
  settingsGuide: L("Golden marker", "Zlatá značka"), settingsSound: L("Sound", "Zvuk"), on: L("On", "Zap."), off: L("Off", "Vyp."),
  next: L("Next", "Ďalej"), done: L("Done", "Hotovo"), cancel: L("Leave it", "Nechať tak"), check: L("Check", "Skontrolovať"),
  endTitle: L("Act I complete", "1. dejstvo je hotové"),
  endText: L("The rain has stopped, the wheel is on, and two people in the stable yard are not speaking about anything sensible at all.",
    "Dážď prestal, koleso je na mieste a dvaja ľudia na dvore pri stajni sa nebavia o ničom rozumnom."),
  endNext: L("Coming next: Act II – Highbury. Two couples, one high street, a fallen tree and a secret room.", "Nabudúce: 2. dejstvo – Highbury. Dva páry, jedna hlavná ulica, padnutý strom a tajná miestnosť."),
  endStats: L("Found {c} of {t} things. Accomplishments: {a}.", "Nájdené: {c} z {t}. Zručnosti: {a}."),
  backToTitle: L("Back to the title", "Späť na úvod"),
  touchHint: L("Talk", "Hovor"),
  sr: { room: L("You are in", "Si v miestnosti"), facing: L("In front of you:", "Pred tebou:"), nothing: L("nothing", "nič"), door: L("the way to", "cesta do") },
};

export const ROOM_NAMES: Record<string, Txt> = {
  emma: L("Emma's room", "Emmina izba"), gallery: L("the gallery", "galéria"), attic: L("Bessie's attic", "Bessiino podkrovie"),
  hall: L("the hall", "hala"), drawing: L("the drawing room", "salón"), dining: L("the dining room", "jedáleň"),
  corridor: L("the servants' passage", "chodba pre služobníctvo"), kitchen: L("the kitchen", "kuchyňa"), yard: L("the stable yard", "dvor pri stajni"), stable: L("the stable", "stajňa"),
};

// ------------------------------------------------------------------ puzzle content
export const LETTER_PIECES: Txt[] = [
  L("Dear T—,", "Milý T—,"),
  L("I am no good with a pen,", "s perom to veľmi neviem,"),
  L("so P. is putting my words down for me.", "tak mi slová za mňa píše P."),
  L("You looked so cross on Tuesday", "V utorok si sa tváril tak nahnevane"),
  L("and you never said why. It is not what you think.", "a nepovedal si prečo. Nie je to tak, ako si myslíš."),
  L("Your B.", "Tvoja B."),
];
export const LETTER_START = [3, 5, 1, 4, 0, 2];

export const SERLE_TALE = L(
  "\"Tuesday. Let me see. Mr Barnes took the gig to Highbury straight after dinner, for Mr Woodhouse's wine, and wasn't back till dark. Will was out digging the asparagus till the rain drove him in at half past four. Bessie had the ink out at the servants' hall table, with Patrick – writing, if you please! And at four o'clock exactly Tom came in by the back door for his tea, stopped dead in the passage, and went straight up to the loft without a word. White as milk, he was.\"",
  "„Utorok. Počkajte. Pán Barnes hneď po obede odišiel bričkou do Highbury pre víno pána Woodhousea a vrátil sa až za tmy. Will vonku ryl špargľu, kým ho o pol piatej nezahnal dnu dážď. Bessie mala vytiahnutý atrament pri stole v izbe pre služobníctvo, s Patrickom – písali, predstavte si! A presne o štvrtej prišiel Tom zadnými dverami na čaj, zastal ako obarený v chodbe a bez slova išiel rovno na senník. Biely ako stena.“");
export const TIMELINE = {
  question: L("Where was everyone at four o'clock on Tuesday?", "Kde bol kto v utorok o štvrtej?"),
  people: [L("Mr Barnes", "Pán Barnes"), L("Will", "Will"), L("Bessie and Patrick", "Bessie a Patrick"), L("Tom", "Tom")],
  places: [L("in Highbury", "v Highbury"), L("in the asparagus bed", "v špargľovom záhone"), L("at the servants' table", "pri stole pre služobníctvo"), L("in the back passage", "v zadnej chodbe")],
  answer: [0, 1, 2, 3],
  final: L("So who could have seen Bessie and Patrick at the letter?", "Kto teda mohol vidieť Bessie s Patrickom pri liste?"),
  finalOptions: [L("Mr Barnes", "Pán Barnes"), L("Will", "Will"), L("Tom", "Tom")],
  finalAnswer: 2,
  wrong: L("\"No, no, dear – listen to what I said.\"", "„Nie, nie, zlatko – počúvajte, čo som povedala.“"),
  wrongFinal: L("\"Think, miss. Who was in the house at four?\"", "„Rozmýšľajte, slečna. Kto bol o štvrtej v dome?“"),
};

export const TACT = [
  { papa: L("Poor Tom. Ill, in a hayloft, in all this damp. I cannot bear to think of it.", "Chudák Tom. Chorý, na senníku, v tom vlhku. Nemôžem na to ani pomyslieť."),
    options: [
      { t: L("A little fresh air would set him right, sir!", "Trocha čerstvého vzduchu by ho postavila na nohy, pane!"), good: false, r: L("Fresh air! In this weather! Harriet, you alarm me.", "Čerstvý vzduch! V tomto počasí! Harriet, ty ma desíš.") },
      { t: L("Something warm and wholesome would do him good, sir.", "Niečo teplé a výživné by mu prospelo, pane."), good: true, r: L("Warm and wholesome. Yes. That is very sensible, my dear.", "Teplé a výživné. Áno. To je veľmi rozumné, drahá.") },
      { t: L("Mr Perry says he is not really ill at all.", "Pán Perry vraví, že vôbec nie je chorý."), good: false, r: L("Not ill? Perry would never say anything so dangerous.", "Nie je chorý? Perry by nikdy nepovedal nič také nebezpečné.") },
    ] },
  { papa: L("But what? Nothing rich. Nothing spiced. Perry is very strict.", "Ale čo? Nič ťažké. Nič korenené. Perry je veľmi prísny."),
    options: [
      { t: L("A glass of your port wine?", "Pohárik vášho portského?"), good: false, r: L("Wine! For an invalid! My dear Harriet.", "Víno! Pre chorého! Drahá Harriet.") },
      { t: L("A slice of the wedding cake?", "Kúsok svadobnej torty?"), good: false, r: L("Wedding cake is most unwholesome. I have always said so.", "Svadobná torta je veľmi nezdravá. Vždy som to hovoril.") },
      { t: L("A basin of gruel, sir. Thin, but not too thin.", "Misku kaše, pane. Riedkej, ale nie príliš."), good: true, r: L("Gruel! The very thing. You understand these matters, Harriet.", "Kaša! Presne tak. Ty sa v tom vyznáš, Harriet.") },
    ] },
  { papa: L("And who is to carry it across the yard in the rain? Nobody must go out.", "A kto ju odnesie cez dvor v daždi? Nikto nesmie chodiť von."),
    options: [
      { t: L("I'll run across myself, bareheaded!", "Prebehnem tam sama, bez čepca!"), good: false, r: L("Bareheaded! Harriet, sit down at once.", "Bez čepca! Harriet, okamžite si sadni.") },
      { t: L("Bessie could take it, sir, under an umbrella.", "Bessie by ju mohla odniesť, pane, pod dáždnikom."), good: true, r: L("Under an umbrella… held well away from the eyes. Very well.", "Pod dáždnikom… držaným ďaleko od očí. Nuž dobre.") },
      { t: L("We could wait until summer.", "Mohli by sme počkať do leta."), good: false, r: L("Summer… but Tom is ill now. Oh dear, oh dear.", "Do leta… ale Tom je chorý teraz. Bože, bože.") },
    ] },
];

export const GRUEL = {
  rule: L("Mr Woodhouse's rule: thin – but not too thin. Smooth. Warm, never hot.", "Pravidlo pána Woodhousea: riedka – ale nie príliš. Hladká. Teplá, nikdy nie horúca."),
  parts: [
    { name: L("Oats", "Ovos"), options: [L("a pinch", "štipka"), L("a small handful", "malá hrsť"), L("two handfuls", "dve hrste")], good: 1,
      bad: [L("\"Like dishwater, miss.\"", "„Ako pomyje, slečna.“"), null, L("\"Too thick! It would stand a spoon up.\"", "„Príliš hustá! Lyžica by v nej stála.“")] },
    { name: L("Liquid", "Tekutina"), options: [L("plenty of water", "dosť vody"), L("a jug of milk", "džbán mlieka"), L("a little cream", "trocha smotany")], good: 0,
      bad: [null, L("\"Milk is very heating, Mr Woodhouse says.\"", "„Mlieko veľmi zahrieva, hovorí pán Woodhouse.“"), L("\"Cream! He'd call for Mr Perry.\"", "„Smotana! Ten by hneď volal pána Perryho.“")] },
    { name: L("Fire", "Oheň"), options: [L("low", "slabý"), L("brisk", "svižný"), L("roaring", "plápolavý")], good: 0,
      bad: [null, L("\"Scalding! He'll not have it hot.\"", "„Pálivo horúca! Horúcu nechce.“"), L("\"Burnt to the pan, miss!\"", "„Pripálená ku hrncu, slečna!“")] },
    { name: L("Stirring", "Miešanie"), options: [L("all the while", "neustále"), L("now and then", "občas"), L("not at all", "vôbec")], good: 0,
      bad: [null, L("\"Lumps! Lumps, Miss Smith!\"", "„Hrudky! Hrudky, slečna Smithová!“"), L("\"It's set like a pudding.\"", "„Stuhla ako puding.“")] },
  ],
  taste: L("Taste it", "Ochutnať"),
};

/** three airs for the pianoforte, as scale degrees 1-5 (C D E F G) */
export const AIRS = [
  { name: L("Early One Morning", "Jedného rána skoro"), notes: [1, 1, 2, 3, 3, 2] },
  { name: L("Robin Adair", "Robin Adair"), notes: [3, 2, 1, 2, 3, 5, 3, 2] },
  { name: L("The Soldier's Joy", "Vojakova radosť"), notes: [1, 3, 5, 3, 4, 2, 4, 3, 2, 1] },
];
export const NEEDLE = [
  { size: 3, pattern: [".r.", "rgr", ".r."] },
  { size: 4, pattern: [".rr.", "rggr", "rggr", ".rr."] },
  { size: 5, pattern: ["r...r", ".rgr.", ".ggg.", ".rgr.", "r...r"] },
];
