/**
 * Act I – A Rainy Day at Hartfield. Everything the characters say, what the player can find,
 * and the order of events. Emma gives the tasks (and guesses wrong); the player finds the proof.
 */
import type { CastId, Dir } from "../engine/game";

export type Lang = "en" | "sk";
export type Txt = { en: string; sk: string };
export const L = (en: string, sk: string): Txt => ({ en, sk });

// ------------------------------------------------------------------ state
export type Skill = "needle" | "music" | "house";
export type State = {
  v: 2;
  room: string; x: number; y: number; face: Dir;
  stage: number;
  cards: string[];          // collected Casebook cards, in order
  met: string[];            // people met
  flags: Record<string, boolean>;
  trust: number;            // Patrick's goodwill
  skills: Record<Skill, number>;
  newCards: string[];
};
export const fresh = (): State => ({
  v: 2, room: "emma", x: 7, y: 6, face: "up", stage: 0,
  cards: [], met: ["emma"], flags: {}, trust: 0, skills: { needle: 0, music: 0, house: 0 }, newCards: [],
});

// ------------------------------------------------------------------ people
export const NAMES: Record<CastId, Txt> = {
  harriet: L("Harriet", "Harriet"), emma: L("Emma", "Emma"), bessie: L("Bessie", "Bessie"), serle: L("Mrs Serle", "pani Serleová"),
  knightley: L("Mr Knightley", "pán Knightley"), patrick: L("Patrick", "Patrick"), will: L("Will", "Will"), barnes: L("Mr Barnes", "pán Barnes"),
  perry: L("Mr Perry", "pán Perry"), tom: L("Tom", "Tom"), woodhouse: L("Mr Woodhouse", "pán Woodhouse"),
};
export type Person = { id: CastId; role: Txt; note: Txt; facts: { t: Txt; on: (s: State) => boolean }[] };
const has = (s: State, c: string) => s.cards.includes(c);
export const PEOPLE: Person[] = [
  { id: "emma", role: L("Mistress of Hartfield", "Pani Hartfieldu"), note: L("Clever, handsome and rich – and never, ever wrong. Ask her.", "Múdra, pekná a bohatá – a nikdy, ale nikdy sa nemýli. Spýtajte sa jej."),
    facts: [{ t: L("Gives you your tasks", "Zadáva ti úlohy"), on: () => true }, { t: L("Has a good nose for where to look", "Má dobrý nos na to, kde hľadať"), on: (s) => s.stage >= 4 }, { t: L("Draws the wrong conclusions", "Vyvodzuje zlé závery"), on: (s) => s.stage >= 7 }] },
  { id: "woodhouse", role: L("Emma's father", "Emmin otec"), note: L("Fears draughts, damp, weddings and anything not boiled.", "Bojí sa prievanu, vlhka, svadieb a všetkého, čo nie je uvarené."),
    facts: [{ t: L("Will not allow the carriage out in the rain", "V daždi koč von nepustí"), on: () => true }, { t: L("Lost his shawl", "Stratil šál"), on: (s) => has(s, "i_shawl") || !!s.flags.shawl }, { t: L("Believes gruel cures everything", "Verí, že kaša vylieči všetko"), on: (s) => s.stage >= 14 }] },
  { id: "bessie", role: L("Housemaid, nineteen", "Slúžka, devätnásť rokov"), note: L("Sleeps in the attic. Has been sighing since Tuesday.", "Spí v podkroví. Od utorka vzdychá."),
    facts: [{ t: L("Says nothing is the matter", "Tvrdí, že sa nič nedeje"), on: (s) => has(s, "w_bessie") }, { t: L("Keeps a pressed rose", "Má vylisovanú ružu"), on: (s) => has(s, "i_prayerbook") }, { t: L("Cannot write well", "Nevie dobre písať"), on: (s) => has(s, "i_slate") || has(s, "w_patrick") }, { t: L("Wrote to someone called T.", "Písala niekomu menom T."), on: (s) => has(s, "l_letter") }, { t: L("Loves Tom", "Miluje Toma"), on: (s) => !!s.flags.bessie }] },
  { id: "will", role: L("Gardener", "Záhradník"), note: L("Grows the Hartfield roses. Sheltering from the rain.", "Pestuje hartfieldské ruže. Schováva sa pred dažďom."),
    facts: [{ t: L("Engaged to Nan in the village", "Zasnúbený s Nan z dediny"), on: (s) => has(s, "w_will") }, { t: L("Gave Bessie a rose – for someone else", "Dal Bessie ružu – pre niekoho iného"), on: (s) => has(s, "w_will") }] },
  { id: "patrick", role: L("Footman", "Lokaj"), note: L("Forty spoons to polish before dinner.", "Do večere musí vyleštiť štyridsať lyžíc."),
    facts: [{ t: L("Holds the pen for Bessie", "Píše za Bessie"), on: (s) => has(s, "w_patrick") }, { t: L("Swore not to say who the letter is for", "Prisahal, že nepovie, komu je list"), on: (s) => has(s, "w_patrick") }] },
  { id: "serle", role: L("Cook", "Kuchárka"), note: L("Knows where everyone in the house is, at every hour.", "Vie, kde je ktokoľvek v dome v ktorúkoľvek hodinu."),
    facts: [{ t: L("Remembers Tuesday exactly", "Presne si pamätá utorok"), on: (s) => has(s, "w_serle") }] },
  { id: "barnes", role: L("Butler", "Komorník"), note: L("His Christian name is Thomas.", "Krstným menom Thomas."),
    facts: [{ t: L("Was in Highbury on Tuesday afternoon", "V utorok popoludní bol v Highbury"), on: (s) => has(s, "w_serle") }] },
  { id: "tom", role: L("Young coachman", "Mladý kočiš"), note: L("Has taken to his bed in the hayloft. Hence: no carriage.", "Ľahol si na senník. Preto: žiadny koč."),
    facts: [{ t: L("Saw Bessie and Patrick at the letter", "Videl Bessie s Patrickom pri liste"), on: (s) => has(s, "w_serle") }, { t: L("Not ill – heartsick", "Nie je chorý – je zaľúbený"), on: (s) => has(s, "w_perry") }, { t: L("Carved a horse marked B", "Vyrezal koníka s písmenom B"), on: (s) => has(s, "i_horse") }] },
  { id: "knightley", role: L("Neighbour, of Donwell Abbey", "Sused z Donwellského opátstva"), note: L("Walks everywhere, in any weather. Tells Emma the truth.", "Všade chodí pešo, v každom počasí. Hovorí Emme pravdu."), facts: [{ t: L("Gives good advice, if asked", "Dobre poradí, ak sa ho spýtaš"), on: () => true }] },
  { id: "perry", role: L("Apothecary", "Lekárnik"), note: L("Mr Woodhouse's oracle.", "Orákulum pána Woodhousea."), facts: [{ t: L("Says Tom's chest is sound", "Tvrdí, že Tom má zdravé pľúca"), on: (s) => has(s, "w_perry") }] },
];

// ------------------------------------------------------------------ the Casebook
export type CardKind = "item" | "letter" | "word";
export type Card = { id: string; kind: CardKind; icon?: string; who?: CastId; title: Txt; text: Txt; where: Txt };
export const CARDS: Record<string, Card> = {
  i_prayerbook: { id: "i_prayerbook", kind: "item", icon: "prayerbook", title: L("Bessie's prayer book", "Bessiina modlitebná knižka"), where: L("Under Bessie's pillow", "Pod Bessiiným vankúšom"),
    text: L("A worn little prayer book. Pressed between the Psalms: a red rose, carefully dried.", "Ošúchaná modlitebná knižka. Medzi žalmami je vylisovaná červená ruža, starostlivo usušená.") },
  i_slate: { id: "i_slate", kind: "item", icon: "slate", title: L("Slate and primer", "Tabuľka a šlabikár"), where: L("Bessie's table", "Bessiin stolík"),
    text: L("A child's primer and a slate. Someone has been practising letters, over and over: B, T, B, T.", "Detský šlabikár a bridlicová tabuľka. Niekto si znova a znova cvičil písmená: B, T, B, T.") },
  i_horse: { id: "i_horse", kind: "item", icon: "horse", title: L("Carved horse", "Vyrezávaný koník"), where: L("Tom's shelf in the stable", "Tomova polička v stajni"),
    text: L("A little horse whittled from pear wood – rough, but loving. Burnt into its flank with a hot nail: B.", "Malý koník vyrezaný z hruškového dreva – hrubo, ale s láskou. Na boku vypálené rozžeraveným klincom: B.") },
  i_shawl: { id: "i_shawl", kind: "item", icon: "shawl", title: L("Papa's shawl", "Otcov šál"), where: L("Emma's chaise longue", "Emmina pohovka"),
    text: L("Mr Woodhouse's grey shawl. He will certainly catch his death without it.", "Šedý šál pána Woodhousea. Bez neho určite prechladne na smrť.") },
  i_umbrella: { id: "i_umbrella", kind: "item", icon: "umbrella", title: L("Umbrella", "Dáždnik"), where: L("The stand in the hall", "Stojan v hale"),
    text: L("A claret silk umbrella. Mr Woodhouse thinks them dangerous to the eyes.", "Bordový hodvábny dáždnik. Pán Woodhouse ich považuje za nebezpečné pre oči.") },
  i_gruel: { id: "i_gruel", kind: "item", icon: "gruel", title: L("A basin of gruel", "Miska kaše"), where: L("Mrs Serle's kitchen", "Kuchyňa pani Serleovej"),
    text: L("Thin, but not too thin. Smooth. Warm, never hot. Exactly as Mr Woodhouse likes it.", "Riedka, ale nie príliš. Hladká. Teplá, nikdy nie horúca. Presne podľa gusta pána Woodhousea.") },
  l_letter: { id: "l_letter", kind: "letter", icon: "letter", title: L("Bessie's letter (draft)", "Bessiin list (koncept)"), where: L("Bessie's waste basket", "Bessiin kôš"),
    text: L("Dear T—,\nI am no good with a pen, so P. is putting my words down for me.\nYou looked so cross on Tuesday and you never said why.\nIt is not what you think.\nYour B.",
      "Milý T—,\ns perom to veľmi neviem, tak mi slová píše P.\nV utorok si sa tváril tak nahnevane a nepovedal si prečo.\nNie je to tak, ako si myslíš.\nTvoja B.") },
  l_draughts: { id: "l_draughts", kind: "letter", icon: "note", title: L("Papa's list of draughts", "Otcov zoznam prievanov"), where: L("Tucked in a book in the drawing room", "Vložený v knihe v salóne"),
    text: L("Places at Hartfield where there is a Draught:\n1. The gallery window (dreadful)\n2. The hall when the door is opened (very dreadful)\n3. Everywhere else, a little.",
      "Miesta v Hartfielde, kde je Prievan:\n1. Okno na galérii (strašné)\n2. Hala, keď sa otvoria dvere (veľmi strašné)\n3. Všade inde, trochu.") },
  w_bessie: { id: "w_bessie", kind: "word", who: "bessie", title: L("Bessie", "Bessie"), where: L("The kitchen", "Kuchyňa"),
    text: L("\"Nothing's the matter, miss. Only the weather.\"", "„Nič sa nedeje, slečna. To len to počasie.“") },
  w_will: { id: "w_will", kind: "word", who: "will", title: L("Will", "Will"), where: L("The servants' passage", "Chodba pre služobníctvo"),
    text: L("\"My roses go to my Nan – we're to be wed at Michaelmas. Bessie begged one off me Monday. Not for herself, she said.\"",
      "„Moje ruže idú mojej Nan – na Michala sa berieme. Bessie si odo mňa v pondelok jednu vyprosila. Vraj nie pre seba.“") },
  w_patrick: { id: "w_patrick", kind: "word", who: "patrick", title: L("Patrick", "Patrick"), where: L("The dining room", "Jedáleň"),
    text: L("\"I only hold the pen for her, miss. She tells me the words. Who it's for, I swore not to say.\"",
      "„Ja len držím za ňu pero, slečna. Ona mi hovorí slová. Komu to je, som prisahal, že nepoviem.“") },
  w_serle: { id: "w_serle", kind: "word", who: "serle", title: L("Mrs Serle", "Pani Serleová"), where: L("The kitchen", "Kuchyňa"),
    text: L("\"Mr Barnes was in Highbury all Tuesday afternoon. At four, Tom came in by the back door, saw Bessie and Patrick at the letter, and went up to the loft white as milk.\"",
      "„Pán Barnes bol v utorok celé popoludnie v Highbury. O štvrtej prišiel Tom zadnými dverami, uvidel Bessie s Patrickom pri liste a išiel na senník biely ako stena.“") },
  w_perry: { id: "w_perry", kind: "word", who: "perry", title: L("Mr Perry", "Pán Perry"), where: L("The stable", "Stajňa"),
    text: L("\"Nothing ails the young man's chest. It is his heart, I fear – and there is no powder for that.\"",
      "„Pľúca má mladík zdravé. Obávam sa, že je to srdce – a na to niet prášku.“") },
  w_tom: { id: "w_tom", kind: "word", who: "tom", title: L("Tom", "Tom"), where: L("The stable", "Stajňa"),
    text: L("\"Bessie's sweet on Patrick. I saw 'em Tuesday, heads together over a letter. That's all I need to know.\"",
      "„Bessie sa páči Patrick. V utorok som ich videl, hlavy pri sebe nad listom. Viac vedieť nepotrebujem.“") },
};

// ------------------------------------------------------------------ tasks Emma gives
export const TASKS: Txt[] = [
  L("Talk to Emma.", "Porozprávaj sa s Emmou."),
  L("Ask Bessie what is troubling her. She is in the kitchen: downstairs, then through the passage.", "Spýtaj sa Bessie, čo ju trápi. Je v kuchyni: dolu schodmi a chodbou."),
  L("Go back to Emma in her room.", "Vráť sa za Emmou do jej izby."),
  L("Search Bessie's room in the attic. The little door at the end of the gallery.", "Prehľadaj Bessiinu izbu v podkroví. Malé dvierka na konci galérie."),
  L("Show Emma what you found.", "Ukáž Emme, čo si našla."),
  L("Ask Will the gardener about roses. He is sheltering in the servants' passage.", "Spýtaj sa záhradníka Willa na ruže. Schováva sa v chodbe pre služobníctvo."),
  L("Tell Emma what Will said.", "Povedz Emme, čo povedal Will."),
  L("Speak to Patrick, the footman, in the dining room.", "Porozprávaj sa s lokajom Patrickom v jedálni."),
  L("Tell Emma what Patrick confessed.", "Povedz Emme, čo Patrick priznal."),
  L("Find Bessie's letter. Try her waste basket in the attic.", "Nájdi Bessiin list. Skús jej kôš v podkroví."),
  L("Bring the letter to Emma.", "Prines list Emme."),
  L("Ask Mrs Serle in the kitchen what happened on Tuesday.", "Spýtaj sa pani Serleovej v kuchyni, čo sa stalo v utorok."),
  L("Tell Emma what Mrs Serle said.", "Povedz Emme, čo povedala pani Serleová."),
  L("Go out to the stable and see Tom. Look about while you are there.", "Choď do stajne za Tomom. Rozhliadni sa tam."),
  L("Tell Emma what you found in the stable.", "Povedz Emme, čo si našla v stajni."),
  L("Make the match. Papa must order gruel, Mrs Serle must make it, Bessie must learn the truth – and she will need an umbrella.", "Daj ich dokopy. Otec musí nariadiť kašu, pani Serleová ju musí uvariť, Bessie sa musí dozvedieť pravdu – a bude potrebovať dáždnik."),
  L("Everything is ready. Give Bessie the gruel and the umbrella.", "Všetko je pripravené. Daj Bessie kašu a dáždnik."),
  L("Act I is complete.", "1. dejstvo je hotové."),
];
export const PLAN = [
  { id: "papa", t: L("Persuade Papa to order gruel (drawing room)", "Presvedč otca, aby nariadil kašu (salón)") },
  { id: "gruel", t: L("Help Mrs Serle make the gruel (kitchen)", "Pomôž pani Serleovej uvariť kašu (kuchyňa)") },
  { id: "bessie", t: L("Show Bessie the carved horse", "Ukáž Bessie vyrezávaného koníka") },
  { id: "umbrella", t: L("Take an umbrella from the hall", "Vezmi dáždnik z haly") },
];
export const planDone = (s: State) => PLAN.every((p) => s.flags[p.id]);

/** where the golden marker points */
export function guideFor(s: State): { room: string; x: number; y: number } | null {
  const emma = { room: "emma", x: 7, y: 4 };
  switch (s.stage) {
    case 0: case 2: case 4: case 6: case 8: case 10: case 12: case 14: return emma;
    case 1: return { room: "kitchen", x: 2, y: 6 };
    case 3: return { room: "attic", x: 1, y: 3 };
    case 5: return { room: "corridor", x: 9, y: 4 };
    case 7: return { room: "dining", x: 5, y: 4 };
    case 9: return { room: "attic", x: 8, y: 6 };
    case 11: return { room: "kitchen", x: 5, y: 4 };
    case 13: return has(s, "w_tom") ? { room: "stable", x: 10, y: 2 } : { room: "stable", x: 10, y: 5 };
    case 15:
      if (!s.flags.papa) return { room: "drawing", x: 6, y: 4 };
      if (!s.flags.gruel) return { room: "kitchen", x: 5, y: 4 };
      if (!s.flags.umbrella) return { room: "hall", x: 9, y: 9 };
      if (!s.flags.bessie) return { room: "kitchen", x: 2, y: 6 };
      return null;
    case 16: return { room: "kitchen", x: 2, y: 6 };
  }
  return null;
}

/** which room leads towards the goal: used to point at doors when the goal is elsewhere */
export const ROUTE: Record<string, Record<string, string>> = {
  emma: { "*": "gallery" }, attic: { "*": "gallery" },
  gallery: { emma: "emma", attic: "attic", "*": "hall" },
  hall: { drawing: "drawing", dining: "dining", gallery: "gallery", emma: "gallery", attic: "gallery", "*": "corridor" },
  drawing: { "*": "hall" }, dining: { "*": "hall" },
  corridor: { kitchen: "kitchen", yard: "yard", stable: "yard", "*": "hall" },
  kitchen: { "*": "corridor" }, yard: { stable: "stable", "*": "corridor" }, stable: { "*": "yard" },
};

// ------------------------------------------------------------------ NPC positions
export type NpcPlace = { id: CastId; room: string; x: number; y: number; face: Dir; pose?: "seated" };
export function npcsFor(s: State): NpcPlace[] {
  const out: NpcPlace[] = [
    { id: "emma", room: "emma", x: 7, y: 4, face: "down" },
    { id: "woodhouse", room: "drawing", x: 6, y: 4, face: "down", pose: "seated" },
    { id: "serle", room: "kitchen", x: 5, y: 4, face: "up" },
    { id: "will", room: "corridor", x: 9, y: 4, face: "down" },
    { id: "patrick", room: "dining", x: 5, y: 4, face: "up" },
    { id: "barnes", room: "hall", x: 10, y: 5, face: "down" },
    { id: "tom", room: "stable", x: 10, y: 5, face: "down", pose: "seated" },
  ];
  if (s.stage < 17) out.push({ id: "bessie", room: "kitchen", x: 2, y: 6, face: "right" });
  if (s.stage >= 7) out.push({ id: "knightley", room: "hall", x: 2, y: 7, face: "right" });
  if (s.stage >= 13 && s.stage <= 15) out.push({ id: "perry", room: "stable", x: 8, y: 5, face: "right" });
  return out;
}

// ------------------------------------------------------------------ the script
export type PuzzleId = "silver" | "letter" | "timeline" | "tact" | "gruel" | "needle" | "piano";
export type Step =
  | { say: CastId; t: Txt }
  | { note: Txt }
  | { give: string }
  | { take: string }
  | { set: (s: State) => void }
  | { choose: { t: Txt; then: Step[] }[] }
  | { puzzle: PuzzleId; win: Step[]; lose?: Step[] }
  | { object: { claim: Txt; answer: string[]; win: Step[] } }
  | { cutscene: "ending" };

const say = (who: CastId, en: string, sk: string): Step => ({ say: who, t: L(en, sk) });
const note = (en: string, sk: string): Step => ({ note: L(en, sk) });
const stage = (n: number): Step => ({ set: (s) => { s.stage = n; } });
const flag = (f: string, v = true): Step => ({ set: (s) => { s.flags[f] = v; } });

export const TUTORIAL = L(
  "Walk with the arrow keys or WASD. E or Space talks and examines. B opens the Casebook, Esc the menu. The golden marker shows the way.",
  "Chodíš šípkami alebo WASD. E alebo medzerník – rozprávať a skúmať. B otvorí Casebook, Esc menu. Zlatá značka ukazuje cestu.");

/** Emma's opening, played once at the start */
export const INTRO: Step[] = [
  say("emma", "Harriet! There you are. Is it not the most provoking weather?", "Harriet! Tu si. Nie je to počasie na zlosť?"),
  say("emma", "Papa will not hear of the carriage today. Tom the coachman has taken to his bed, so we cannot go to Highbury.", "Otec dnes o koči ani nechce počuť. Kočiš Tom si ľahol do postele, a tak do Highbury nepôjdeme."),
  say("emma", "But there is something better than Highbury, Harriet: a mystery, under our very roof.", "Ale máme niečo lepšie než Highbury, Harriet: záhadu priamo pod našou strechou."),
  say("emma", "Bessie the housemaid has been moping since Tuesday. Red eyes, sighs over the coal scuttle. She is in love, depend upon it.", "Slúžka Bessie je od utorka celá zronená. Červené oči, vzdychy nad vedierkom s uhlím. Je zaľúbená, na to vezmi jed."),
  say("emma", "Go and ask her what troubles her. She is in the kitchen: down the stairs, and through the passage.", "Choď sa jej spýtať, čo ju trápi. Je v kuchyni: dolu schodmi a chodbou."),
  { note: TUTORIAL },
  stage(1),
];

/** Emma's reminder when there is nothing new */
const EMMA_NUDGE: Txt[] = [
  L("Well, Harriet?", "Nuž, Harriet?"),
  L("The kitchen, Harriet. Bessie. Do go!", "Kuchyňa, Harriet. Bessie. No tak, choď!"),
  L("", ""), L("The attic, Harriet. Under her pillow, I should think.", "Podkrovie, Harriet. Pod vankúšom, myslím."), L("", ""),
  L("Will is in the servants' passage, by the back door.", "Will je v chodbe pre služobníctvo, pri zadných dverách."), L("", ""),
  L("Patrick is in the dining room with his spoons.", "Patrick je v jedálni so svojimi lyžicami."), L("", ""),
  L("Her waste basket, Harriet. Girls who cannot write make many drafts.", "Jej kôš, Harriet. Dievčatá, čo nevedia písať, robia veľa konceptov."), L("", ""),
  L("Mrs Serle, in the kitchen. She knows everything about everybody.", "Pani Serleová, v kuchyni. Vie všetko o každom."), L("", ""),
  L("The stable, Harriet! Through the back door and across the yard.", "Stajňa, Harriet! Zadnými dverami a cez dvor."), L("", ""),
  L("Papa, Mrs Serle, Bessie, an umbrella. Off you go.", "Otec, pani Serleová, Bessie, dáždnik. Bež."),
  L("Go with Bessie, Harriet – I shall watch from the window.", "Choď s Bessie, Harriet – ja sa budem pozerať z okna."),
];

export function talk(s: State, id: CastId): Step[] {
  const met: Step = { set: (st) => { if (!st.met.includes(id)) st.met.push(id); } };
  switch (id) {
    case "emma": return [met, ...emmaTalk(s)];
    case "bessie": return [met, ...bessieTalk(s)];
    case "will": return [met, ...willTalk(s)];
    case "patrick": return [met, ...patrickTalk(s)];
    case "serle": return [met, ...serleTalk(s)];
    case "tom": return [met, ...tomTalk(s)];
    case "perry": return [met, say("perry", "Ah, Miss Smith. I have examined the young man. Nothing ails his chest.", "Á, slečna Smithová. Prezrel som mladíka. Pľúca má zdravé."),
      say("perry", "It is his heart, I fear – and there is no powder for that. Good day.", "Obávam sa, že je to srdce – a na to niet prášku. Dobrý deň."), ...(has(s, "w_perry") ? [] : [{ give: "w_perry" } as Step]), ...checkStable()];
    case "woodhouse": return [met, ...papaTalk(s)];
    case "knightley": return [met, ...knightleyTalk(s)];
    case "barnes": return [met, ...(s.stage >= 11
      ? [say("barnes", "Tuesday afternoon, miss? I was in Highbury, fetching Mr Woodhouse's wine. Not that it is anyone's business.", "Utorok popoludní, slečna? Bol som v Highbury pre víno pána Woodhousea. Nie že by to bola niečia vec.")]
      : [say("barnes", "Mind the floor, Miss Smith. Patrick has waxed it, for once.", "Pozor na dlážku, slečna Smithová. Patrick ju raz za čas navoskoval.")])];
    default: return [];
  }
}

function emmaTalk(s: State): Step[] {
  switch (s.stage) {
    case 0: return INTRO;
    case 2: return [
      say("emma", "'Only the weather'? Harriet, when a maid says 'nothing', she means 'everything'.", "„To len to počasie“? Harriet, keď slúžka povie „nič“, myslí tým „všetko“."),
      say("emma", "Go up to her room in the attic and look about. Maids keep their secrets under their pillows. Discreetly, mind!", "Choď hore do jej izby v podkroví a poobzeraj sa. Slúžky schovávajú tajomstvá pod vankúš. Ale nenápadne!"),
      say("emma", "The little door at the end of the gallery leads up to the attics.", "Malé dvierka na konci galérie vedú do podkrovia."), stage(3)];
    case 4: return [
      say("emma", "A rose! Pressed in her prayer book! Oh, Harriet, this is better than a novel.", "Ruža! Vylisovaná v modlitebnej knižke! Ach, Harriet, to je lepšie než román."),
      say("emma", "And who grows the roses at Hartfield? Will, the gardener. It is Will, of course.", "A kto pestuje ruže v Hartfielde? Záhradník Will. Je to Will, samozrejme."),
      say("emma", "He is sheltering from the rain in the servants' passage. Go and hear what he has to say.", "Schováva sa pred dažďom v chodbe pre služobníctvo. Choď si vypočuť, čo povie."), stage(5)];
    case 6: return [
      say("emma", "Well? It is Will, is it not? Say it is Will!", "Nuž? Je to Will, však? Povedz, že je to Will!"),
      { object: { claim: L("Will gave Bessie a rose. Will is her sweetheart.", "Will dal Bessie ružu. Will je jej milý."), answer: ["w_will"], win: [
        say("emma", "Betrothed? To a person called Nan? How very inconsiderate of him.", "Zasnúbený? S nejakou Nan? Aké bezohľadné."),
        say("emma", "Then the rose was for somebody else… Patrick! The footman. I have seen them whispering in corners.", "Tak tá ruža bola pre niekoho iného… Patrick! Lokaj. Videla som ich šepkať po kútoch."),
        say("emma", "He is polishing the silver in the dining room. Go and find out.", "Leští striebro v jedálni. Choď to zistiť."),
        note("You hear the front door below: someone has walked over through the rain.", "Dolu počuť vchodové dvere: niekto prišiel pešo cez dážď."), stage(7)] } }];
    case 8: return [
      say("emma", "He holds the pen for her! Harriet, a man does not hold a pen for a girl unless he is in love with her.", "Drží za ňu pero! Harriet, muž nedrží dievčaťu pero, pokiaľ nie je do nej zaľúbený."),
      say("emma", "…Oh, very well, you look doubtful. Then find me the letter itself, and I shall believe you.", "…No dobre, tváriš sa pochybovačne. Tak mi nájdi ten list a uverím ti."),
      say("emma", "A girl who cannot write makes many drafts and throws them away. Try her waste basket.", "Dievča, čo nevie písať, urobí veľa konceptov a vyhodí ich. Skús jej kôš."), stage(9)];
    case 10: return [
      say("emma", "Patrick writes her letters. Patrick is her sweetheart. It is perfectly plain.", "Patrick jej píše listy. Patrick je jej milý. Je to úplne jasné."),
      { object: { claim: L("Patrick writes Bessie's love letters, so Patrick is her sweetheart.", "Patrick píše Bessiine ľúbostné listy, takže Patrick je jej milý."), answer: ["l_letter"], win: [
        say("emma", "'Dear T'… 'so P. is putting my words down for me'… Oh. So Patrick is only the pen.", "„Milý T“… „tak mi slová píše P.“… Aha. Takže Patrick je len pero."),
        say("emma", "T… T… Harriet! Mr Barnes, the butler – his Christian name is Thomas! Thomas Barnes!", "T… T… Harriet! Pán Barnes, komorník – krstným menom Thomas! Thomas Barnes!"),
        say("emma", "He is sixty if he is a day. How very romantic. Mrs Serle knows where everyone was on Tuesday – go and ask her.", "Má aspoň šesťdesiat. Aké romantické. Pani Serleová vie, kde bol kto v utorok – choď sa jej spýtať."), stage(11)] } }];
    case 12: return [
      say("emma", "Thomas Barnes and Bessie. I shall arrange everything. Do not argue, Harriet.", "Thomas Barnes a Bessie. Všetko zariadim. Neodvrávaj, Harriet."),
      { object: { claim: L("T stands for Thomas Barnes, the butler.", "T znamená Thomas Barnes, komorník."), answer: ["w_serle"], win: [
        say("emma", "In Highbury all afternoon… then it cannot be Barnes.", "Celé popoludnie v Highbury… tak to nemôže byť Barnes."),
        say("emma", "But Tom… T… Tom the coachman! He saw them at the letter, thought the worst, and took to his bed!", "Ale Tom… T… kočiš Tom! Videl ich pri liste, pomyslel si to najhoršie a ľahol do postele!"),
        say("emma", "Of course. I always suspected Tom. Go out to the stable, Harriet, and mind the puddles.", "Samozrejme. Toma som podozrievala odjakživa. Choď do stajne, Harriet, a pozor na mláky."), stage(13)] } }];
    case 14: return [
      say("emma", "He carved her a horse! Oh, Harriet, they are in love and neither of them knows it. We must bring them together.", "Vyrezal jej koníka! Ach, Harriet, ľúbia sa a ani jeden o tom nevie. Musíme ich dať dokopy."),
      say("emma", "Here is my plan. Tom is ill, so Papa must send him something warm: gruel, naturally. And who shall carry it across the yard? Bessie.", "Môj plán: Tom je chorý, tak mu otec musí poslať niečo teplé – kašu, prirodzene. A kto ju odnesie cez dvor? Bessie."),
      say("emma", "Papa must agree, Mrs Serle must make it, Bessie must know the truth – and she will need an umbrella.", "Otec musí súhlasiť, pani Serleová ju musí uvariť, Bessie musí poznať pravdu – a bude potrebovať dáždnik."),
      say("emma", "Papa is in the drawing room. Be gentle: speak of his health, never of adventure.", "Otec je v salóne. Buď jemná: hovor o jeho zdraví, nikdy o dobrodružstve."), stage(15)];
    default: {
      const n = EMMA_NUDGE[s.stage];
      return [say("emma", n?.en || "Well, Harriet?", n?.sk || "Nuž, Harriet?")];
    }
  }
}

function bessieTalk(s: State): Step[] {
  if (s.stage === 1) return [
    say("bessie", "Oh! Miss Smith. You did give me a turn.", "Ach! Slečna Smithová. Ale ste ma vyľakali."),
    { choose: [
      { t: L("Are you unwell, Bessie?", "Nie je ti dobre, Bessie?"), then: [say("bessie", "Unwell? No, miss. Nothing's the matter.", "Zle? Nie, slečna. Nič sa nedeje.")] },
      { t: L("Emma thinks you are in love.", "Emma si myslí, že si zaľúbená."), then: [say("bessie", "In love! Me, miss? Lord, no. Who'd look at the likes of me?", "Zaľúbená! Ja, slečna? Pane Bože, nie. Kto by sa pozrel na takú, ako som ja?")] },
    ] },
    say("bessie", "It's only the weather, miss. Truly.", "To len to počasie, slečna. Naozaj."),
    note("Bessie peels the same potato for the third time.", "Bessie šúpe ten istý zemiak už tretí raz."),
    { give: "w_bessie" }, stage(2)];
  if (s.stage === 15 && !s.flags.bessie) return [
    note("You show Bessie the little carved horse.", "Ukážeš Bessie malého vyrezávaného koníka."),
    say("bessie", "B… that's me. He made this? For me?", "B… to som ja. On to vyrobil? Pre mňa?"),
    { choose: [
      { t: L("He saw you and Patrick with the letter.", "Videl ťa s Patrickom pri liste."), then: [] },
      { t: L("He thinks you love Patrick.", "Myslí si, že ľúbiš Patricka."), then: [] },
    ] },
    say("bessie", "Patrick! Oh, the great soft lump. The letter was for him – for Tom!", "Patricka! Ach, ten veľký trúba. Ten list bol preňho – pre Toma!"),
    say("bessie", "If there's a way to get across to him without Mr Woodhouse fretting, miss, I'll go this minute.", "Ak sa k nemu dá dostať bez toho, aby sa pán Woodhouse rozčuľoval, slečna, idem hneď teraz."),
    flag("bessie"), ...planCheck()];
  if (s.stage === 16) return [
    say("bessie", "Gruel and an umbrella! Give them here, miss. I'll carry it across myself.", "Kaša aj dáždnik! Dajte mi ich, slečna. Odnesiem to sama."),
    { take: "i_gruel" }, { take: "i_umbrella" }, { cutscene: "ending" }];
  return [say("bessie", s.stage < 15 ? "Mind the step, miss, it's wet." : "Is it true, miss? About Tom?", s.stage < 15 ? "Pozor na schod, slečna, je mokrý." : "Je to pravda, slečna? O Tomovi?")];
}

function planCheck(): Step[] {
  return [{ set: (s) => { if (s.stage === 15 && planDone(s)) s.stage = 16; } }];
}

function willTalk(s: State): Step[] {
  if (s.stage === 5) return [
    say("will", "Afternoon, miss. Don't mind me – I'm dripping like a spout.", "Dobrý deň, slečna. Nevšímajte si ma – kvapká zo mňa ako zo žľabu."),
    { choose: [
      { t: L("Did you give Bessie a rose?", "Dal si Bessie ružu?"), then: [] },
      { t: L("Is Bessie your sweetheart?", "Je Bessie tvoja milá?"), then: [say("will", "Bessie? Ha! Not likely, miss.", "Bessie? Ha! To sotva, slečna.")] },
    ] },
    say("will", "My roses go to my Nan, down in the village. We're to be wed at Michaelmas.", "Moje ruže idú mojej Nan, dolu v dedine. Na Michala sa berieme."),
    say("will", "Though now you say it… Bessie did beg one rose off me on Monday. Begged it proper. Not for herself, she said. Wouldn't say who for.", "Hoci, keď už o tom hovoríte… Bessie si odo mňa v pondelok jednu ružu vyprosila. Poriadne prosila. Vraj nie pre seba. Pre koho, nepovedala."),
    { give: "w_will" }, stage(6)];
  return [say("will", s.stage < 5 ? "Rain's drowned my asparagus, miss. Drowned it dead." : "Nan says I'm to stop gossiping. So I've stopped.", s.stage < 5 ? "Dážď mi utopil špargľu, slečna. Načisto utopil." : "Nan vraví, že mám prestať klebetiť. Tak som prestal.")];
}

function patrickTalk(s: State): Step[] {
  if (s.stage === 7 && s.trust < 2) return [
    say("patrick", s.trust === 0 ? "Begging your pardon, Miss Smith, I can't stop. Mr Barnes wants every spoon shining before dinner, and there's forty of 'em." : "There's still the forks, miss. Forty of 'em, and the ladles.",
      s.trust === 0 ? "Prepáčte, slečna Smithová, nemôžem prestať. Pán Barnes chce mať každú lyžicu vyleštenú do večere, a je ich štyridsať." : "Ešte sú tu vidličky, slečna. Štyridsať a k tomu naberačky."),
    { choose: [
      { t: L("Let me help you polish.", "Pomôžem ti leštiť."), then: [{ puzzle: "silver", win: [
        { set: (st) => { st.trust += 1; st.skills.house = Math.min(3, st.skills.house + 1); } },
        say("patrick", "Well I never – a young lady with a polishing cloth! Thank you, miss.", "No toto – mladá dáma s leštiacou handrou! Ďakujem, slečna."),
        ...(s.trust + 1 >= 2 ? patrickConfess() : [])] }] },
      { t: L("Never mind.", "To nič."), then: [] },
    ] }];
  if (s.stage === 7) return patrickConfess();
  if (s.stage > 7) return [
    say("patrick", "The spoons are done, miss, thanks to you. Mr Barnes didn't believe it.", "Lyžice sú hotové, slečna, vďaka vám. Pán Barnes tomu neveril."),
    { choose: [
      { t: L("Shall we polish some more?", "Vyleštíme ešte niečo?"), then: [{ puzzle: "silver", win: [{ set: (st) => { st.skills.house = Math.min(3, st.skills.house + 1); } }, say("patrick", "You'll put me out of a place, miss.", "Ešte ma pripravíte o miesto, slečna.")] }] },
      { t: L("Goodbye, Patrick.", "Zbohom, Patrick."), then: [] },
    ] }];
  return [say("patrick", "Forty spoons, miss. Forty.", "Štyridsať lyžíc, slečna. Štyridsať.")];
}
function patrickConfess(): Step[] {
  return [
    say("patrick", "You've been very good to me, miss. So I'll tell you straight.", "Boli ste ku mne veľmi dobrá, slečna. Tak vám to poviem rovno."),
    say("patrick", "I've been helping Bessie with a letter. She can't hardly write, see, so I hold the pen and she tells me the words.", "Pomáham Bessie s listom. Ona skoro nevie písať, tak držím pero a ona mi hovorí slová."),
    say("patrick", "But who it's for, I swore on my mother's Bible not to say. And I'll not say it.", "Ale komu je, som prisahal na mamkinu Bibliu, že nepoviem. A nepoviem."),
    { give: "w_patrick" }, stage(8)];
}

function serleTalk(s: State): Step[] {
  if (s.stage === 11) return [
    say("serle", "Tuesday, is it? Sit you down, Miss Smith, and mind the cat.", "Utorok, hovoríte? Sadnite si, slečna Smithová, a pozor na mačku."),
    { puzzle: "timeline", win: [
      say("serle", "There. Clever girl. Now out of my kitchen, I've Mr Woodhouse's dinner to think of.", "No vidíte. Šikovné dievča. A teraz von z mojej kuchyne, musím myslieť na večeru pána Woodhousea."),
      { give: "w_serle" }, stage(12)] }];
  if (s.stage === 15 && s.flags.papa && !s.flags.gruel) return [
    say("serle", "Gruel for Tom, by Mr Woodhouse's orders? Then you'll help me make it. I'll not have it said Hartfield gruel was lumpy.", "Kaša pre Toma, na príkaz pána Woodhousea? Tak mi ju pomôžete uvariť. Nech sa nepovie, že hartfieldská kaša mala hrudky."),
    { puzzle: "gruel", win: [
      say("serle", "Thin, but not too thin. Mr Woodhouse himself couldn't fault it.", "Riedka, ale nie príliš. Ani pán Woodhouse by jej nič nevytkol."),
      { give: "i_gruel" }, flag("gruel"), ...planCheck()] }];
  if (s.stage === 15 && !s.flags.papa) return [say("serle", "Gruel? Not without Mr Woodhouse's say-so, miss. He's very particular about gruel.", "Kaša? Nie bez slova pána Woodhousea, slečna. Na kašu je veľmi prieberčivý.")];
  return [say("serle", "Don't stand in the draught, miss. Mr Woodhouse would never forgive me.", "Nestojte v prievane, slečna. To by mi pán Woodhouse nikdy neodpustil.")];
}

function checkStable(): Step[] {
  return [{ set: (s) => { if (s.stage === 13 && s.cards.includes("w_tom") && s.cards.includes("i_horse")) s.stage = 14; } }];
}
function tomTalk(s: State): Step[] {
  if (s.stage < 13) return [say("tom", "Go away, miss. I'm poorly. Very poorly.", "Choďte preč, slečna. Som chorý. Veľmi chorý."), note("Tom pulls the blanket over his head.", "Tom si pretiahne deku cez hlavu.")];
  if (s.stage === 13 && !has(s, "w_tom")) return [
    say("tom", "Go away, miss. I'm poorly.", "Choďte preč, slečna. Som chorý."),
    { choose: [
      { t: L("Is it about Bessie?", "Je to kvôli Bessie?"), then: [] },
      { t: L("Mr Perry says your chest is sound.", "Pán Perry vraví, že máš zdravé pľúca."), then: [say("tom", "Mr Perry can mind his own chest.", "Nech si pán Perry hľadí svojich pľúc.")] },
    ] },
    say("tom", "Bessie? Bessie's sweet on Patrick. I saw 'em on Tuesday, heads together over a letter.", "Bessie? Bessie sa páči Patrick. V utorok som ich videl, hlavy pri sebe nad listom."),
    say("tom", "That's all I need to know, miss. Now leave a man to his straw.", "Viac vedieť nepotrebujem, slečna. Nechajte človeka s jeho slamou."),
    { give: "w_tom" }, ...checkStable()];
  if (s.stage >= 14 && s.stage < 17) return [say("tom", "Is she… is Bessie well, miss?", "Má sa… má sa Bessie dobre, slečna?")];
  return [say("tom", "The wheel's on, miss!", "Koleso je na mieste, slečna!")];
}

function papaTalk(s: State): Step[] {
  const out: Step[] = [];
  if (has(s, "i_shawl") && !s.flags.shawl) {
    out.push(say("woodhouse", "My shawl! Harriet, you are an angel. I had felt a draught on my shoulders all afternoon.", "Môj šál! Harriet, si anjel. Celé popoludnie som cítil prievan na pleciach."),
      { take: "i_shawl" }, flag("shawl"));
  }
  if (s.stage === 15 && !s.flags.papa) {
    out.push(say("woodhouse", "Harriet, my dear. Do not stand by the window, you will take cold.", "Harriet, drahá. Nestoj pri okne, prechladneš."),
      { puzzle: "tact", win: [
        say("woodhouse", "Gruel. Yes. Poor Tom shall have a basin of gruel – thin, but not too thin. Tell Serle I ordered it.", "Kaša. Áno. Chudák Tom dostane misku kaše – riedkej, ale nie príliš. Povedz Serleovej, že som to nariadil ja."),
        flag("papa"), ...planCheck()] });
    return out;
  }
  if (!out.length) {
    if (s.skills.music > 0 && !s.flags.papaMusic) out.push(say("woodhouse", "Was that you at the instrument, Harriet? Very pretty. Not too loud, which is the great thing.", "To si bola ty pri klavíri, Harriet? Veľmi pekné. A nie príliš nahlas, to je hlavné."), flag("papaMusic"));
    else if (s.flags.window && !s.flags.papaWindow) out.push(say("woodhouse", "Someone has shut the gallery window. I felt the difference at once.", "Niekto zavrel okno na galérii. Hneď som pocítil rozdiel."), flag("papaWindow"));
    else out.push(say("woodhouse", s.stage < 15 ? "Is not this dreadful weather? Perry says the damp is very bad for the chest. Nobody should go out." : "Gruel is the only thing, Harriet. The only thing.",
      s.stage < 15 ? "Nie je to strašné počasie? Perry hovorí, že vlhko je veľmi zlé na pľúca. Nikto by nemal chodiť von." : "Kaša je jediná vec, Harriet. Jediná."));
  }
  return out;
}

const HINTS: Record<number, Txt> = {
  7: L("Patrick will not leave his spoons. Perhaps if they were polished sooner…", "Patrick od lyžíc neodíde. Možno keby boli vyleštené skôr…"),
  8: L("Emma has decided again, has she? Then let her see it in writing.", "Emma sa už zase rozhodla? Tak nech to vidí napísané."),
  9: L("A girl who cannot write wastes a good deal of paper.", "Dievča, čo nevie písať, minie veľa papiera."),
  10: L("Show Emma the letter. Ink is harder to argue with than whispers.", "Ukážte Emme list. S atramentom sa háda ťažšie než so šepotom."),
  11: L("Servants know more about this house than its master. Mrs Serle most of all.", "Služobníctvo vie o tomto dome viac než jeho pán. Pani Serleová najviac."),
  12: L("A man who was in Highbury cannot have seen anything in the passage.", "Muž, ktorý bol v Highbury, nemohol nič vidieť v chodbe."),
  13: L("Mr Perry's horse is in the yard. He is with the coachman, I believe. Look about the stable, too.", "Na dvore stojí kôň pána Perryho. Myslím, že je u kočiša. Rozhliadnite sa aj po stajni."),
  14: L("Go back to Emma. She will want to be the one with the plan.", "Vráťte sa k Emme. Bude chcieť mať plán ona."),
  15: L("Mr Woodhouse cannot be hurried. Find his shawl, shut the gallery window, play him something soft – and he will be the readier.", "Pána Woodhousea nemožno súriť. Nájdite mu šál, zatvorte okno na galérii, zahrajte mu niečo jemné – a bude ochotnejší."),
};
function knightleyTalk(s: State): Step[] {
  const first: Step[] = s.flags.knightley ? [] : [say("knightley", "Miss Smith. I walked over from Donwell – the lane is a river.", "Slečna Smithová. Prišiel som pešo z Donwellu – cesta je rieka."), flag("knightley")];
  const h = HINTS[s.stage];
  return [...first, h ? { say: "knightley", t: h } : say("knightley", "Emma's guesses are bold, Miss Smith. Yours had better be right.", "Emmine odhady sú odvážne, slečna Smithová. Tie vaše by mali byť správne.")];
}

// ------------------------------------------------------------------ examining things
type Ex = Txt | ((s: State) => Step[]);
const ex = (en: string, sk: string): Txt => L(en, sk);
export const EXAMINE: Record<string, Ex> = {
  emma_window: ex("Rain streams down the panes. The window seat is heaped with Emma's cushions.", "Po tabuliach steká dážď. Sedadlo pri okne je plné Emminých vankúšikov."),
  emma_portrait: ex("Miss Taylor – Mrs Weston now. Emma made that match, and has not stopped mentioning it.", "Slečna Taylorová – teraz pani Westonová. Tento pár dala dokopy Emma a odvtedy o tom nemlčí."),
  emma_dresser: ex("Scent bottles, a powder box, three hair ribbons. All perfectly arranged.", "Flakóny, pudrenka, tri stužky do vlasov. Všetko dokonale usporiadané."),
  emma_fire: ex("A good fire. Mr Woodhouse insists on fires in every room from September to June.", "Poriadny oheň. Pán Woodhouse trvá na kúrení v každej izbe od septembra do júna."),
  emma_bed: ex("Emma's bed, under a canopy of rose chintz. A novel lies face down on the coverlet.", "Emmina posteľ pod nebesami z ružového kretónu. Na prikrývke leží otvorený román."),
  emma_bedside: ex("A candlestick, a bell and a list headed 'Matches to make'. Your name is on it.", "Svietnik, zvonček a zoznam nadpísaný „Páry, ktoré treba dať dokopy“. Je na ňom aj tvoje meno."),
  emma_wardrobe: ex("Gowns for every weather except, apparently, rain.", "Šaty na každé počasie okrem, zdá sa, dažďa."),
  emma_easel: ex("Your portrait, half finished. Emma has made you a little taller than you are.", "Tvoj portrét, napoly hotový. Emma ťa trochu zväčšila."),
  emma_portfolio: ex("Emma's portfolio: many beginnings, very few endings.", "Emmino portfólio: veľa začiatkov, veľmi málo koncov."),
  emma_canary: ex("The canary cocks its head at you and says nothing useful.", "Kanárik na teba nakloní hlavu a nepovie nič užitočné."),
  emma_flowers: ex("Hothouse roses from Donwell. Mr Knightley sends them; Emma pretends not to notice.", "Ruže zo skleníka v Donwelle. Posiela ich pán Knightley; Emma predstiera, že si to nevšimla."),
  gallery_portrait: ex("A Woodhouse ancestor, looking worried about a draught.", "Predok Woodhouseovcov, ktorý sa tvári, že ho trápi prievan."),
  papa_door: ex("Mr Woodhouse's bedroom. Better not – he is downstairs anyway.", "Spálňa pána Woodhousea. Radšej nie – aj tak je dolu."),
  harriet_door: ex("Your guest room. Nothing you need in there.", "Tvoja izba pre hostí. Nič odtiaľ nepotrebuješ."),
  gallery_vase: ex("A blue-and-white vase of late roses, shedding petals on the console.", "Modrobiela váza s neskorými ružami, z ktorých padajú lupene na konzolu."),
  gallery_plant: ex("A palm in a jardinière. It has seen many draughts.", "Palma v kvetináči. Zažila už veľa prievanov."),
  attic_window: ex("A cracked cup on the sill holds forget-me-nots. Forget me not.", "Na parapete stojí puknutý hrnček s nezábudkami. Nezabudni na mňa."),
  attic_pegs: ex("Bessie's Sunday dress, a shawl and a spare cap. She has mended the dress very neatly.", "Bessiine nedeľné šaty, šál a náhradný čepiec. Šaty má veľmi úhľadne zašité."),
  attic_mirror: ex("A small cracked mirror. Someone has tucked a sprig of heather into the frame.", "Malé puknuté zrkadlo. Niekto zastrčil do rámu vetvičku vresu."),
  attic_sampler: ex("An embroidered sampler: the alphabet, a house, a little horse. The 'B' and the 'T' are stitched in red.", "Vyšívaná vzorkovnica: abeceda, domček, malý koník. „B“ a „T“ sú vyšité červenou."),
  attic_shelf: ex("A tin box, a stub of candle, a hymn book. Nothing hidden here.", "Plechová škatuľka, ohorok sviečky, spevník. Nič tu nie je skryté."),
  attic_wash: ex("A jug and basin. The water is cold enough to make you gasp.", "Džbán a umývadlo. Voda je taká studená, že sa zadýchaš."),
  attic_trunk: ex("Bessie's trunk. Locked – and opening it would be too much, even for Emma.", "Bessiina truhlica. Zamknutá – a otvoriť ju by bolo priveľa, aj na Emmu."),
  attic_leak: ex("Rain drips through the roof into a basin. Plink. Plink. Plink.", "Cez strechu kvapká dážď do misky. Kvap. Kvap. Kvap."),
  hall_clock: ex("The clock says a quarter past two. It has said so since 1809.", "Hodiny ukazujú štvrť na tri. Ukazujú to od roku 1809."),
  hall_fire: ex("Two chairs drawn up to the fire, and a tea tray nobody is allowed to move.", "Dve kreslá pritiahnuté k ohňu a čajová tácka, s ktorou nikto nesmie pohnúť."),
  hall_tea: ex("Cold tea. Mr Woodhouse thinks warm tea overexcites the nerves.", "Studený čaj. Pán Woodhouse si myslí, že teplý čaj dráždi nervy."),
  hall_portrait: ex("Mr Woodhouse as a young man, already wearing a muffler.", "Pán Woodhouse ako mladík, už vtedy so šálom okolo krku."),
  hall_table: ex("A great bowl of roses. Will must have cut them before the rain.", "Veľká misa ruží. Will ich musel narezať pred dažďom."),
  hall_salver: ex("The silver salver: two letters for Mr Woodhouse and Mr Knightley's hat, dripping.", "Strieborná tácka: dva listy pre pána Woodhousea a premočený klobúk pána Knightleyho."),
  hall_settee: ex("A settee nobody sits on, because it is too near the door.", "Pohovka, na ktorej nikto nesedí, lebo je príliš blízko pri dverách."),
  hall_bust: ex("A marble Cicero, who would have something to say about all this.", "Mramorový Cicero, ktorý by k tomu všetkému mal čo povedať."),
  front_door: ex("The front door. Through the fanlight: rain, rain and more rain. Mr Woodhouse would faint.", "Vchodové dvere. Cez okienko nad nimi: dážď, dážď a zase dážď. Pán Woodhouse by omdlel."),
  hall_plant: ex("A potted palm, wilting slightly in protest at the weather.", "Palma v kvetináči, trochu zvädnutá na protest proti počasiu."),
  drawing_fire: ex("The fire is built up very high. Mr Woodhouse still feels cold.", "Oheň je rozkúrený veľmi vysoko. Pánovi Woodhouseovi je aj tak zima."),
  fire_screen: ex("A fire screen embroidered with roses – placed between Mr Woodhouse and any conceivable draught.", "Paraván s vyšívanými ružami – postavený medzi pána Woodhousea a akýkoľvek mysliteľný prievan."),
  drawing_sofa: ex("A rose silk sofa, plumped and perfect.", "Pohovka z ružového hodvábu, načechraná a dokonalá."),
  harp: ex("A gilded harp. Nobody at Hartfield can play it, which suits Mr Woodhouse.", "Pozlátená harfa. Nikto v Hartfielde na nej nevie hrať, čo pánovi Woodhouseovi vyhovuje."),
  backgammon: ex("The backgammon board, set up for Mr Woodhouse's evening game.", "Vrchcáby pripravené na večernú hru pána Woodhousea."),
  drawing_plant: ex("A potted palm, positioned to block the draught from the window.", "Palma v kvetináči, postavená tak, aby zastavila prievan od okna."),
  dining_portrait: ex("A gentleman in a red coat, painted at the moment of disapproving of something.", "Pán v červenom kabáte, namaľovaný vo chvíli, keď s niečím nesúhlasí."),
  dining_china: ex("The best china. Used twice a year and dusted every day.", "Najlepší porcelán. Používa sa dvakrát do roka a utiera sa každý deň."),
  dining_table: ex("The table is laid for dinner. Mr Woodhouse will eat only the gruel.", "Stôl je prestretý na večeru. Pán Woodhouse bude jesť len kašu."),
  dining_plant: ex("A palm in the corner, keeping very still.", "Palma v kúte, ktorá sa ani nepohne."),
  bells: ex("The bell board: Drawing Room, Dining Room, Miss Woodhouse, Mr Woodhouse – and Mr Woodhouse again, in case.", "Tabuľa so zvončekmi: Salón, Jedáleň, slečna Woodhousová, pán Woodhouse – a pre istotu ešte raz pán Woodhouse."),
  coats: ex("Greatcoats on pegs. One is Tom's: there is a carving knife in the pocket.", "Plášte na vešiakoch. Jeden je Tomov: vo vrecku má rezbársky nožík."),
  boots: ex("Muddy boots and a trug of flowerpots. Will's, by the smell of the earth.", "Zablatené čižmy a kôš s kvetináčmi. Willove, podľa vône hliny."),
  sink: ex("A stone sink. The pump is in the yard, so this is mostly for show.", "Kamenný drez. Pumpa je na dvore, takže je hlavne na okrasu."),
  bucket: ex("A mop bucket. You resist the temptation.", "Vedro s mopom. Odoláš pokušeniu."),
  range: ex("The great kitchen range, with a kettle singing and a pot of something good.", "Veľký kuchynský sporák, na ňom spieva kanvica a hrniec niečoho dobrého."),
  dresser: ex("Rows of plates, each in its place. Mrs Serle counts them every night.", "Rady tanierov, každý na svojom mieste. Pani Serleová ich každý večer počíta."),
  kitchen_table: ex("Bread, onions, a basin of potatoes – most of them peeled three times.", "Chlieb, cibuľa, misa zemiakov – väčšina ošúpaná trikrát."),
  flour: ex("A barrel of flour and a sack of oats. Oats: useful, in this house.", "Sud múky a vrece ovsa. Ovos: v tomto dome užitočný."),
  potatoes: ex("A bucket of potatoes, waiting for Bessie to stop sighing.", "Vedro zemiakov, ktoré čakajú, kým Bessie prestane vzdychať."),
  kitchen_cat: ex("The kitchen cat opens one eye. Closes it again.", "Kuchynská mačka otvorí jedno oko. A zase ho zatvorí."),
  gate: ex("The gate to the park and the lane to Highbury. It stays shut while the carriage is broken.", "Brána do parku a na cestu do Highbury. Kým je koč pokazený, ostane zatvorená."),
  carriage: ex("The carriage, with a wheel off. Only Tom knows how to put it back.", "Koč so stiahnutým kolesom. Ako ho nasadiť, vie len Tom."),
  pump: ex("The yard pump. The trough is overflowing anyway.", "Pumpa na dvore. Koryto aj tak preteká."),
  water_butt: ex("A water butt, full to the brim and then some.", "Sud na dažďovú vodu, plný po okraj a ešte viac."),
  stable_door2: ex("The coach house. The carriage is outside, so it is empty but for spiders.", "Kôlňa na koč. Koč je vonku, takže je prázdna, okrem pavúkov."),
  harness: ex("Harness hung neatly on pegs – everything in order, except the coachman.", "Postroje úhľadne zavesené na kolíkoch – všetko v poriadku, okrem kočiša."),
  horse1: ex("The bay mare nuzzles your bonnet hopefully.", "Hnedá kobyla ti s nádejou ňuchá čepiec."),
  horse2: ex("The grey gelding sighs, as only horses and Bessie can.", "Sivý valach vzdychne, ako to vedia len kone a Bessie."),
  ladder: ex("The ladder up to the hayloft. Your bonnet would not survive.", "Rebrík na senník. Tvoj čepiec by to neprežil."),
  hay: ex("Bales of hay. Tom has made himself a very sorry nest.", "Balíky sena. Tom si z nich urobil veľmi smutné hniezdo."),
  saddle: ex("A side-saddle, very well kept.", "Dámske sedlo, veľmi dobre udržiavané."),
  oats: ex("A bucket of oats for the horses. Not for gruel.", "Vedro ovsa pre kone. Nie na kašu."),
};

/** things whose answer depends on the story */
export function examine(s: State, id: string): Step[] {
  switch (id) {
    case "attic_bed":
      if (s.stage === 3) return [note("Under the pillow lies a small prayer book. Pressed between its pages: a red rose.", "Pod vankúšom leží malá modlitebná knižka. Medzi stránkami: vylisovaná červená ruža."), { give: "i_prayerbook" }, stage(4)];
      if (s.stage < 3) return [note("Bessie's bed, neatly made under a patchwork quilt.", "Bessiina posteľ, úhľadne ustlaná pod deku z farebných kúskov.")];
      return [note("The patchwork quilt is straight again. Nobody would know.", "Deka je zase urovnaná. Nikto nič nespozná.")];
    case "attic_table":
      if (s.stage >= 3 && !has(s, "i_slate")) return [note("A slate and a child's primer. Someone has been practising letters, over and over: B, T, B, T.", "Tabuľka a detský šlabikár. Niekto si znova a znova cvičil písmená: B, T, B, T."), { give: "i_slate" }];
      return [note("A little table with a candle stub.", "Stolík s ohorkom sviečky.")];
    case "attic_basket":
      if (s.stage === 9) return [note("Crumpled papers… and the torn pieces of a letter.", "Pokrčené papiere… a roztrhané kúsky listu."), { puzzle: "letter", win: [
        note("The pieces fit. It is only a draft – but it is enough.", "Kúsky do seba zapadli. Je to len koncept – ale stačí to."), { give: "l_letter" }, stage(10)] }];
      if (s.stage > 9) return [note("Only old laundry lists now.", "Už len staré zoznamy bielizne.")];
      return [note("A waste basket of crumpled paper. Rummaging in it seems… a little low.", "Kôš plný pokrčeného papiera. Prehrabávať sa v ňom sa zdá… trochu nízke.")];
    case "tom_shelf":
      if (s.stage >= 13 && !has(s, "i_horse")) return [note("On Tom's shelf, beside a whittling knife: a little carved horse.", "Na Tomovej poličke, vedľa rezbárskeho nožíka: malý vyrezávaný koník."), { give: "i_horse" }, ...checkStable()];
      return [note("Tom's shelf: a whittling knife, a curry comb and a great many shavings.", "Tomova polička: rezbársky nožík, česák na kone a kopa hoblín.")];
    case "emma_chaise":
      if (!has(s, "i_shawl") && !s.flags.shawl) return [note("Papa's grey shawl, left on the chaise longue. He will be missing it.", "Otcov šedý šál, zabudnutý na pohovke. Určite mu chýba."), { give: "i_shawl" }];
      return [note("Emma's chaise longue, made for reading novels and plotting.", "Emmina pohovka, stvorená na čítanie románov a kovanie plánov.")];
    case "gallery_window":
      if (!s.flags.window) return [note("The window rattles and a cold draught whistles in. Papa would be horrified.", "Okno drnčí a dnu fúka studený prievan. Otec by bol zdesený."),
        { choose: [{ t: L("Close it tight.", "Pevne ho zavri."), then: [note("You latch it tight. Somewhere downstairs, Mr Woodhouse sighs with relief.", "Pevne ho zatvoríš. Kdesi dolu si pán Woodhouse s úľavou vydýchne."), flag("window")] }, { t: L("Leave it.", "Nechaj ho tak."), then: [] }] }];
      return [note("The window is shut tight. Not a breath of draught.", "Okno je pevne zatvorené. Ani závan prievanu.")];
    case "drawing_books":
      if (!has(s, "l_draughts")) return [note("Between two volumes of sermons, a folded paper in Mr Woodhouse's hand.", "Medzi dvoma zväzkami kázní je zložený papier písaný rukou pána Woodhousea."), { give: "l_draughts" }];
      return [note("Sermons, a herbal, and 'A Treatise on the Dangers of Damp'.", "Kázne, herbár a „Pojednanie o nebezpečenstvách vlhka“.")];
    case "hall_umbrellas":
      if (s.stage === 15 && !s.flags.umbrella) return [note("You take the claret silk umbrella.", "Vezmeš si bordový hodvábny dáždnik."), { give: "i_umbrella" }, flag("umbrella"), ...planCheck()];
      return [note("Umbrellas. Mr Woodhouse thinks them dangerous to the eyes.", "Dáždniky. Pán Woodhouse ich považuje za nebezpečné pre oči.")];
    case "sideboard":
      if (s.stage === 7) return [note("Patrick's silver, half polished.", "Patrickovo striebro, napoly vyleštené.")];
      return [note("The silver gleams.", "Striebro sa leskne.")];
    case "needlework": {
      const lvl = s.skills.needle;
      return [note(lvl >= 3 ? "Emma's embroidery: the rose garland is finished, thanks to you." : "Emma's embroidery frame: a garland of roses, half done. Add a few stitches?", lvl >= 3 ? "Emmina výšivka: ružová girlanda je hotová, vďaka tebe." : "Emmin vyšívací rám: girlanda ruží, napoly hotová. Pridáš pár stehov?"),
        ...(lvl >= 3 ? [] : [{ choose: [{ t: L("Stitch a while.", "Chvíľu vyšívaj."), then: [{ puzzle: "needle" as const, win: [{ set: (st: State) => { st.skills.needle = Math.min(3, st.skills.needle + 1); } }, note("A row of neat little roses. Your needlework improves.", "Rad úhľadných ružičiek. Tvoje vyšívanie sa zlepšuje.")] }] }, { t: L("Not now.", "Teraz nie."), then: [] }] } as Step])];
    }
    case "piano": {
      const lvl = s.skills.music;
      return [note(lvl >= 3 ? "The pianoforte. You can play all three airs by heart now." : "Emma's pianoforte, open at a book of airs. Practise one?", lvl >= 3 ? "Klavír. Všetky tri piesne už vieš naspamäť." : "Emmin klavír, otvorený pri zbierke piesní. Precvičíš si jednu?"),
        ...(lvl >= 3 ? [] : [{ choose: [{ t: L("Play.", "Hraj."), then: [{ puzzle: "piano" as const, win: [{ set: (st: State) => { st.skills.music = Math.min(3, st.skills.music + 1); } }, note("Mr Woodhouse nods along by the fire. Your music improves.", "Pán Woodhouse pri ohni pokyvuje hlavou. Tvoje hranie sa zlepšuje.")] }] }, { t: L("Not now.", "Teraz nie."), then: [] }] } as Step])];
    }
  }
  const e = EXAMINE[id];
  if (!e) return [note("Nothing of interest.", "Nič zaujímavé.")];
  if (typeof e === "function") return e(s);
  return [{ note: e }];
}

/** the Map tab: who is linked to whom, as far as the player knows */
export type Edge = { a: string; b: string; kind: "love" | "guess" | "out" | "work" };
export function relations(s: State): { nodes: string[]; edges: Edge[]; emmaSays?: Txt } {
  const e: Edge[] = [];
  const nodes = new Set<string>(["bessie"]);
  if (s.stage >= 4) { nodes.add("will"); e.push({ a: "bessie", b: "will", kind: has(s, "w_will") ? "out" : "guess" }); }
  if (has(s, "w_will")) { nodes.add("nan"); e.push({ a: "will", b: "nan", kind: "love" }); }
  if (s.stage >= 7) { nodes.add("patrick"); e.push({ a: "bessie", b: "patrick", kind: has(s, "l_letter") && s.stage >= 11 ? "out" : "guess" }); }
  if (s.stage >= 11) { nodes.add("barnes"); e.push({ a: "bessie", b: "barnes", kind: has(s, "w_serle") && s.stage >= 13 ? "out" : "guess" }); }
  if (has(s, "w_serle") || s.stage >= 13) { nodes.add("tom"); e.push({ a: "bessie", b: "tom", kind: s.flags.bessie ? "love" : "guess" }); e.push({ a: "patrick", b: "tom", kind: "work" }); }
  const emmaSays: Record<number, Txt> = {
    4: L("Will! Surely Will.", "Will! Určite Will."), 5: L("Will! Surely Will.", "Will! Určite Will."), 6: L("Will! Surely Will.", "Will! Určite Will."),
    7: L("Patrick! Surely Patrick.", "Patrick! Určite Patrick."), 8: L("Patrick! Surely Patrick.", "Patrick! Určite Patrick."), 9: L("Patrick, depend upon it.", "Patrick, na to vezmi jed."), 10: L("Patrick, depend upon it.", "Patrick, na to vezmi jed."),
    11: L("Mr Barnes – Thomas!", "Pán Barnes – Thomas!"), 12: L("Mr Barnes – Thomas!", "Pán Barnes – Thomas!"), 13: L("Tom. I always knew it.", "Tom. Vždy som to vedela."), 14: L("Tom. I always knew it.", "Tom. Vždy som to vedela."),
  };
  return { nodes: [...nodes], edges: e, emmaSays: emmaSays[s.stage] };
}
