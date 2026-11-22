import type { DayInfo, Epilogue, Face } from "./types";

/** The Relief Fund is in pounds; the clerk's purse is in shillings (20s = £1). */
export const START = { favour: 0, good: 0, money: 35 };
export const PANCKS_DAYS = [1, 2, 3, 4];
/** the week is lost at this favour: Mr Tite Barnacle dismisses you */
export const DISMISS_AT = -10;

export const HOUSE = {
  purse: 10,
  /** daily wage in shillings, docked when the Barnacles are displeased */
  wage: (favour: number) => (favour >= 0 ? 6 : favour > -6 ? 5 : 4),
  rent: 3,
  food: 2,
  coal: 1,
  medicine: 3,
  pancks: 1,
  wife: "Ellen",
  kids: ["Polly", "little Tom"],
};

export const DAYS: DayInfo[] = [
  {
    day: 1,
    name: "Monday",
    hours: 8,
    morning: [
      "Morning! You're the new clerk? Barnacle. Junior. My father runs the place, you know. Well, he sits in it.",
      "Look here. People come in with papers. You read them, you stamp them. APPROVED, REFUSED, REFERRED. Referred is best. It sends them somewhere else.",
      "Each one you call in takes an hour, and we close at five. Whatever's left in the pile at five just… stays in the pile. Lovely.",
      "The Records are downstairs: an hour to search, but sometimes worth it. Mr Pancks will check one thing a day for you, and bring it back tomorrow. He snorts. Don't mind him.",
      "Oh, and your wages depend on how my father feels about you. Six shillings when he's pleased, less when he isn't. Push him too far and you're out on your ear. Ten black marks, roughly. Nobody counts.",
      "Our motto is How Not To Do It. You'll pick it up.",
    ],
    headlines: [],
  },
  {
    day: 2,
    name: "Tuesday",
    hours: 8,
    morning: [
      "Morning! Read the paper? Nobody does, but you should, you know. Everything you stamped yesterday is in it somehow.",
      "Oh, and Mr Rugg the auditor comes in tomorrow. Between ourselves, he's been going on about relief paid out without proper papers. Loans, certificates, that sort of thing.",
    ],
    memo: {
      id: "memo2",
      kind: "memo",
      title: "From the desk of Mr Tite Barnacle",
      lines: [
        "To the new clerk.",
        "Mr Merdle's application will reach you shortly. Lord Decimus takes an interest. The Department expects no difficulty.",
        "On another matter: I have been told that papers have been moving. Papers should not move. T. B.",
      ],
    },
    headlines: [{ text: "MR MERDLE DINES WITH LORD DECIMUS TITE BARNACLE. 'A great man,' says everyone at the table." }],
  },
  {
    day: 3,
    name: "Wednesday",
    hours: 8,
    morning: ["Morning! Mr Rugg the auditor is in the building. He picks one of your irregular stamps and asks to see the evidence. Hope you kept some.", "And Merdle's coming in today. Merdle! Do be nice to him, you know. My father's put his own savings in."],
    audit: true,
    headlines: [
      { text: "MERDLE SHARES RISE AGAIN. Society can talk of nothing else." },
      { text: "Rents raised across Bleeding Heart Yard by sixpence a week. 'The Office pays,' says Mr Casby, smiling.", requires: ["plornish_paid"], effect: { good: -1 } },
      { text: "Mr Scrooge, of Scrooge and Marley, gives £100 to the Charity Commissioners: 'Not one penny to that Office.'", requires: ["scrooge_spite"] },
    ],
  },
  {
    day: 4,
    name: "Thursday",
    hours: 8,
    morning: [
      "Morning! Busy day. There's a detective in the waiting room. And a very small boy with a broom. I didn't ask.",
      "Rugg's back on Friday, you know. He told me he looks hardest at whatever a clerk does most often. Says it's a habit by then, not an accident.",
    ],
    headlines: [
      { text: "From Mr Tite Barnacle's office: the new clerk's wages are 'under review'. One shilling a day, from today.", requires: ["merdle_no"], set: ["wage_cut"] },
      { text: "MERDLE SHARES AT A RECORD. 'He cannot fail,' writes our City correspondent." },
      { text: "Mr Tite Barnacle 'has questions' about the new clerk's speed.", requires: ["doyce>=2"] },
    ],
  },
  {
    day: 5,
    name: "Friday",
    hours: 8,
    morning: ["Morning! Last day of the week, you know. Mr Rugg is back for a second look at your stamps. And my father writes your personal file tonight."],
    audit: true,
    headlines: [
      {
        text: "Inspector Bucket asks the Office about a gold sovereign that passed from Mr Heep to one of its clerks.",
        requires: ["heep_bribe", "bucket_ally", "!confessed"],
        effect: { favour: -6 },
      },
      { text: "A list of Office clerks who held Merdle shares is printed in full. Yours is on it.", requires: ["merdle_shares"], effect: { favour: -3 } },
      { text: "MERDLE DEAD. The great financier found in a Turkish bath. His bank was a fraud from the start. Thousands ruined." },
      {
        text: "The Office Relief Fund, placed with Merdle on the new clerk's stamp, is lost. Questions asked.",
        requires: ["merdle_ok", "!bucket_ally"],
        effect: { money: -15, favour: -3, good: -2 },
      },
      {
        text: "Inspector Bucket, who had seen the Merdle file, warned the Office in time. The Fund was taken out the night before.",
        requires: ["merdle_ok", "bucket_ally"],
        effect: { favour: -1 },
      },
      {
        text: "Mr Tite Barnacle now says he 'always had doubts' about Merdle, and praises 'the caution of this Office'.",
        requires: ["merdle_no"],
        effect: { favour: 3, good: 1 },
      },
      { text: "Under the new one-page form, patent clerks find they have an hour or two to spare.", requires: ["reform"] },
    ],
  },
];

/** extra hours on Friday if the one-page form is in use */
export const REFORM_BONUS = 2;

export const EPILOGUE: Epilogue[] = [
  { text: "The later Jarndyce will was read in Court. It ended the suit in a day.", requires: ["will_copied"] },
  { text: "Jarndyce and Jarndyce reached judgment while something was left. Ada Clare and Richard Carstone got a little money, and Miss Flite let her birds go.", requires: ["jarndyce>=3"] },
  { text: "Jarndyce and Jarndyce ended at last. The costs had eaten the whole estate. Miss Flite let her birds go anyway.", requires: ["!jarndyce>=3"] },
  { text: "Daniel Doyce got his patent in a week on the one-page form. The form spread to three other departments before anyone noticed.", requires: ["reform"] },
  { text: "Daniel Doyce's machine now runs in a foreign country, which is grateful for it.", requires: ["doyce_gone"] },
  { text: "Daniel Doyce is still being passed from desk to desk. He has stopped minding.", requires: ["!reform", "!doyce_gone"] },
  { text: "William Dorrit left the Marshalsea a rich man. Amy, his daughter, still visits the prison sometimes.", requires: ["dorrit_free"] },
  { text: "William Dorrit is still the Father of the Marshalsea. A fortune lies unclaimed in Chancery with his name on it.", requires: ["!dorrit_free"] },
  { text: "Inspector Bucket read the Heep file and arrested him for forgery. The Wickfields got their house back.", requires: ["heep_ok", "bucket_ally"] },
  { text: "Uriah Heep still runs the Wickfield firm. He is very umble about it.", requires: ["heep_ok", "!bucket_ally"] },
  { text: "Mr Micawber, Heep's new clerk, sent the court twenty-two pages of evidence against him.", requires: ["heep_caught", "micawber_canterbury"] },
  { text: "Mr Micawber went to Australia, where something did at last turn up: he became a magistrate.", requires: ["micawber_canterbury"] },
  { text: "Tiny Tim did not die. He grew up.", requires: ["tim_ok"] },
  { text: "Nobody at the Office knows what became of the little boy with the crutch.", requires: ["tim_no", "!tim_ok"] },
  { text: "Jo lives at Bleak House now. He has learned to write his name.", requires: ["jo_ok"] },
  { text: "Jo was not seen again at his crossing.", requires: ["jo_gone"] },
  { text: "Young Tom Gradgrind was found to have robbed the bank. Stephen Blackpool was cleared.", requires: ["tom_found"] },
  { text: "Stephen Blackpool, walking back to clear his name, fell into an old mine shaft. He was cleared too late.", requires: ["stephen_warrant"] },
  { text: "Your letter about the divorce law was filed. In 1857 Parliament changed the law anyway.", requires: ["reform_letter"] },
  { text: "Abel Magwitch was taken on the river. Pip lost his fortune and found out who his friends were.", requires: ["magwitch_reported"] },
  { text: "Pip learned in time who 'Provis' was, and helped him get away.", requires: ["magwitch_safe"] },
  { text: "Merdle's Bank fell with the Office's money in it. Your signature is on the licence, and in Mr Tite Barnacle's report.", requires: ["merdle_ok", "!bucket_ally"] },
  { text: "Merdle's Bank fell, but Inspector Bucket got the Office's money out the night before. Nobody upstairs has thanked him.", requires: ["merdle_ok", "bucket_ally"] },
  { text: "You refused Merdle's Bank. Mr Tite Barnacle now tells everyone it was his idea.", requires: ["merdle_no"] },
  { text: "Inspector Bucket thanked you for the sovereign and used it as evidence against Mr Heep.", requires: ["confessed"] },
  { text: "Uriah Heep's books listed 'one sovereign, to the clerk'. Inspector Bucket read them aloud in court.", requires: ["heep_bribe", "bucket_ally", "!confessed"] },
  { text: "Nobody ever learned about Heep's sovereign. You did not tell Bucket, and Bucket never saw the books.", requires: ["heep_bribe", "!bucket_ally"] },
  { text: "Rachael Hopkins's three children stayed out of the workhouse.", requires: ["rachael_paid"] },
  { text: "Charley Neckett kept her brother and sister together all winter.", requires: ["neckett_ok"] },
  { text: "Pancks cut off the Patriarch's long white hair in front of the whole Yard. The rents came down the next week.", requires: ["casby_shorn"] },
  { text: "Daniel Doyce took on twenty men at his works in Bleeding Heart Yard. The first was Mr Plornish.", requires: ["reform"] },
  { text: "Rachael Hopkins brought her son Will home from Yorkshire.", requires: ["rachael_paid", "squeers_placed"] },
  { text: "Will Hopkins is still at Dotheboys Hall. His mother writes every week. The letters are not given to him.", requires: ["seen@widows", "!squeers_placed"] },
  { text: "Richard Carstone, who never signed Vholes's last loan, got his share.", requires: ["will_copied", "!richard_loan"] },
  { text: "Richard Carstone's share went to Mr Vholes, at forty per cent.", requires: ["richard_loan"] },
  { text: "Seven Dials learned that the Office paid pensions to anyone with a story. The queue on Monday went round the block.", requires: ["cobb_paid"] },
  { text: "Your exception for Rachael Hopkins stood, because you could say why it was one.", requires: ["precedent_reasoned"] },
  { text: "Bleeding Heart Yard's own list of rents went into the record beside Pancks's. Casby could not call it one man's spite.", requires: ["yard_free"] },
  { text: "The five sixpences you paid for the Yard went to Mr Casby, who raised the rents again in December.", requires: ["yard_paid", "!casby_shorn"] },
  { text: "Mr Turveydrop wore his new gloves to the Office's Christmas party. Upstairs, they started to look hard at your box.", requires: ["box_abused"] },
  { text: "The 'Other needs' box keeps the line you wrote under it: 'for those with no one else to help them'. It is still used.", requires: ["box_rule"] },
  { text: "Without a rule, the 'Other needs' box was quietly taken off the form in the spring.", requires: ["box_other", "!box_rule", "box_doubted"] },
  { text: "Mr Rugg opened a file on you. It is still open.", requires: ["rugg_file"] },
  { text: "Barnacle Junior took the blame for your stamp. He never mentioned it again, and never quite looked at you again either.", requires: ["junior_blamed"] },
  { text: "Your watch is still at the pawnbroker's. You tell the time by the Office clock.", requires: ["watch_pawned"] },
  { text: "Mrs Bagnet next door paid back your two shillings with a third, and a stew.", requires: ["bagnet_lent"] },
  { text: "The 'Other needs' box is still on Form R-4. Nobody has dared take it off.", requires: ["box_other", "!box_rule", "!box_doubted", "!box_abused"] },
];

export type Ledger = { favour: number; good: number; money: number; purse: number; badNights: number; reforms: number; bribes: number };

/** title for the personal file: the first that fits */
export const ENDINGS: { title: string; note: string; when: (l: Ledger) => boolean }[] = [
  { title: "A Comfortable Man", note: "Your purse is heavier than your conscience. Mr Tite Barnacle notes that you 'understand how things are done'.", when: (l) => l.bribes > 0 && l.good <= 4 },
  { title: "A Perfect Barnacle", note: "Mr Tite Barnacle recommends you for promotion. Nothing happened all week, beautifully.", when: (l) => l.favour >= 6 && l.good <= 2 },
  { title: "A Pillar of the Office", note: "The pile on your desk is the tallest in the building. People have been seen to weep near it.", when: (l) => l.good <= -6 },
  { title: "A Quiet Reformer", note: "You changed the forms and kept your post. Upstairs, nobody is quite sure who drew the new boxes.", when: (l) => l.reforms >= 2 && l.favour > -4 && l.good >= 8 },
  { title: "A Dangerous Reformer", note: "Mr Tite Barnacle recommends that you be moved to a room without a door.", when: (l) => l.good >= 12 && l.favour <= -4 },
  { title: "Kind at Home's Expense", note: "The Yard blesses your name. Your own children went to bed hungry for it.", when: (l) => l.good >= 8 && l.badNights >= 3 },
  { title: "A Clerk Who Got Things Done", note: "Nobody upstairs is quite sure how. They are looking into it.", when: (l) => l.good >= 10 },
  { title: "A Careful Steward", note: "You spent the Fund as if it were your own, which is to say, hardly at all, and well.", when: (l) => l.money >= 15 && l.good >= 4 },
  { title: "A Family Man", note: "You kept your post and your family warm, and did what good you could around the edges. In 1855, that is not nothing.", when: (l) => l.badNights === 0 && l.good >= 2 },
  { title: "An Ordinary Clerk", note: "Some papers moved, some didn't. Mr Tite Barnacle could not remember your name, which he considers a compliment.", when: () => true },
];
export const REFORM_FLAGS = ["box_other", "box_rule", "reform", "casby_shorn", "reform_letter", "precedent_reasoned"];
export const BRIBE_FLAGS = ["heep_bribe", "merdle_shares", "magwitch_reported"];

export function titleFor(l: Ledger) {
  return ENDINGS.find((e) => e.when(l))!;
}

export const AUDITOR = { name: "Mr Rugg, auditor", face: "rugg" };

/* -------------------------------- faces -------------------------------- */
const S = { pale: "#f2d3b6", warm: "#e7b98f", ruddy: "#e9a985", old: "#e8c9a8", dark: "#b07a52", grey: "#d9c3ae" };

export const FACES: Record<string, Face> = {
  junior: { skin: S.pale, hair: "#c9a25a", hat: "none", coat: "#3b4a7a", monocle: true, cravat: "#f2efe6", young: true },
  tite: { skin: S.ruddy, hair: "#e7e2d6", hat: "none", coat: "#1d1d24", cravat: "#f2efe6", beard: "mutton" },
  pancks: { skin: S.warm, hair: "#1b1410", hat: "none", coat: "#4a3b2a", beard: "stubble", cravat: "#6b2b2b" },
  micawber: { skin: S.ruddy, hair: "#1b1410", hat: "bald", coat: "#5a3d2a", cravat: "#e8e0c8", specs: true },
  flite: { skin: S.old, hair: "#b8b0a2", hat: "bonnet", hatColor: "#8a7a9e", coat: "#6c5f78", prop: "bird" },
  doyce: { skin: S.warm, hair: "#7a6a5a", hat: "none", coat: "#2f4a3a", beard: "full", prop: "quill" },
  dorrit: { skin: S.grey, hair: "#e2ddd2", hat: "cap", hatColor: "#3a3030", coat: "#4b4038" },
  heep: { skin: "#e8d0c0", hair: "#b8471f", hat: "none", coat: "#22201e", cravat: "#e8e0d0" },
  cratchit: { skin: S.pale, hair: "#6a4a2a", hat: "none", coat: "#40504a", cravat: "#9a2a2a" },
  scrooge: { skin: S.grey, hair: "#e9e5dc", hat: "top", hatColor: "#1a1a1a", coat: "#2a2a2a", beard: "mutton" },
  flora: { skin: S.pale, hair: "#a8642a", hat: "feather", hatColor: "#c26a8a", coat: "#9a4a6a" },
  merdle: { skin: S.ruddy, hair: "#4a3a2a", hat: "top", hatColor: "#12121a", coat: "#1a1a2a", cravat: "#e8e0d0" },
  bumble: { skin: S.ruddy, hair: "#4a3a2a", hat: "cocked", hatColor: "#1d1d2e", coat: "#2c3a7a", cravat: "#e8c24a" },
  oliver: { skin: S.pale, hair: "#7a5a3a", hat: "none", coat: "#7a7064", young: true },
  skimpole: { skin: S.pale, hair: "#d6a75a", hat: "none", coat: "#6a8a5a", cravat: "#d66a6a" },
  squeers: { skin: S.ruddy, hair: "#2a2a2a", hat: "top", hatColor: "#3a3530", coat: "#2a2a24", beard: "stubble" },
  jellyby: { skin: S.pale, hair: "#a6743a", hat: "mob", hatColor: "#efe8da", coat: "#5a6a8a", prop: "quill" },
  jo: { skin: S.warm, hair: "#3a2a1a", hat: "cap", hatColor: "#4a4038", coat: "#5a5048", young: true, prop: "broom" },
  bucket: { skin: S.warm, hair: "#2a2018", hat: "top", hatColor: "#26241e", coat: "#24262a", beard: "mutton", prop: "bag" },
  stephen: { skin: S.warm, hair: "#7a7066", hat: "cap", hatColor: "#3a3a3a", coat: "#4a4a40" },
  bounderby: { skin: "#eaa07a", hair: "#c87a4a", hat: "top", hatColor: "#2a221a", coat: "#3a2a1a", cravat: "#e8e0d0" },
  jaggers: { skin: S.warm, hair: "#1a1a1a", hat: "bald", coat: "#1a1a1a", cravat: "#e8e0d0", beard: "stubble" },
  plornish: { skin: S.warm, hair: "#8a6a4a", hat: "cap", hatColor: "#c8c0b0", coat: "#7a6a52", beard: "stubble" },
  widows: { skin: S.pale, hair: "#3a2a20", hat: "bonnet", hatColor: "#141216", coat: "#1c1a1e" },
  rugg: { skin: S.ruddy, hair: "#b8a890", hat: "bald", coat: "#3a3428", specs: true, cravat: "#e8e0d0" },
  ellen: { skin: S.pale, hair: "#6a3a2a", hat: "mob", hatColor: "#efe8da", coat: "#5a4a6a" },
  casby: { skin: S.ruddy, hair: "#f2efe6", hat: "bald", coat: "#4a3a5a", cravat: "#f2efe6" },
  wickfield: { skin: "#e9b8a0", hair: "#d8d0c4", hat: "none", coat: "#2a2a30", cravat: "#e8e0d0" },
  losberne: { skin: S.warm, hair: "#5a4a3a", hat: "none", coat: "#3a3a2a", specs: true, beard: "mutton" },
  tomg: { skin: S.pale, hair: "#9a7a4a", hat: "none", coat: "#5a4a3a", cravat: "#a83a3a", young: true },
  ferdinand: { skin: S.pale, hair: "#d8b06a", hat: "none", coat: "#5a6a9a", cravat: "#e8d0e0", monocle: true, young: true },
  yard: { skin: S.warm, hair: "#5a4a3a", hat: "cap", hatColor: "#6a5a4a", coat: "#5a5040", beard: "stubble" },
  cobb: { skin: S.pale, hair: "#c8642a", hat: "bonnet", hatColor: "#6a2a4a", coat: "#8a3a5a" },
  turveydrop: { skin: "#f0c8b0", hair: "#3a2a1a", hat: "none", coat: "#3a5a8a", cravat: "#f2efe6", beard: "mutton", monocle: true },
  betty: { skin: S.old, hair: "#c8c2b6", hat: "mob", hatColor: "#e6dfcf", coat: "#6a4a3a" },
};
