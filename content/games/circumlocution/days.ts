import type { DayInfo, Epilogue, Face } from "./types";

export const START = { favour: 0, good: 0, money: 150 };
export const PANCKS_DAYS = [1, 2, 3, 4];

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
      "Our motto is How Not To Do It. You'll pick it up.",
    ],
    headlines: [],
  },
  {
    day: 2,
    name: "Tuesday",
    hours: 8,
    morning: ["Morning! Read the paper? Nobody does, but you should, you know. Everything you stamped yesterday is in it somehow."],
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
    morning: ["Morning! Merdle's coming in today. Merdle! Do be nice to him, you know. My father's put his own savings in."],
    headlines: [{ text: "MERDLE SHARES RISE AGAIN. Society can talk of nothing else." }],
  },
  {
    day: 4,
    name: "Thursday",
    hours: 8,
    morning: ["Morning! Busy day. There's a detective in the waiting room. And a very small boy with a broom. I didn't ask."],
    headlines: [
      { text: "MERDLE SHARES AT A RECORD. 'He cannot fail,' writes our City correspondent." },
      { text: "Mr Tite Barnacle 'has questions' about the new clerk's speed.", requires: ["doyce>=2"] },
    ],
  },
  {
    day: 5,
    name: "Friday",
    hours: 8,
    morning: ["Morning! Last day of the week, you know. My father will write your report tonight. Your personal file. Don't worry. Nobody reads them."],
    headlines: [
      { text: "MERDLE DEAD. The great financier found in a Turkish bath. His bank was a fraud from the start. Thousands ruined." },
      {
        text: "The Office Relief Fund, placed with Merdle on the new clerk's stamp, is lost. Questions asked.",
        requires: ["merdle_ok", "!bucket_ally"],
        effect: { money: -60, favour: -3, good: -2 },
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
  { text: "Jarndyce and Jarndyce reached judgment while something was left. Ada Clare and Richard Carstone got a little money, and Miss Flite let her birds go.", requires: ["jarndyce>=3"] },
  { text: "Jarndyce and Jarndyce ended at last. The costs had eaten the whole estate. Miss Flite let her birds go anyway.", requires: ["!jarndyce>=3"] },
  { text: "Daniel Doyce got his patent in a week on the one-page form. The form spread to three other departments before anyone noticed.", requires: ["reform"] },
  { text: "Daniel Doyce's machine now runs in a foreign country, which is grateful for it.", requires: ["doyce_gone"] },
  { text: "Daniel Doyce is still being passed from desk to desk. He has stopped minding.", requires: ["!reform", "!doyce_gone"] },
  { text: "William Dorrit left the Marshalsea a rich man. Amy, his daughter, still visits the prison sometimes.", requires: ["dorrit_free"] },
  { text: "William Dorrit is still the Father of the Marshalsea. A fortune lies unclaimed in Chancery with his name on it.", requires: ["!dorrit_free"] },
  { text: "Inspector Bucket read the Heep file and arrested him for forgery. The Wickfields got their house back.", requires: ["heep_ok", "bucket_ally"] },
  { text: "Uriah Heep still runs the Wickfield firm. He is very umble about it.", requires: ["heep_ok", "!bucket_ally"] },
  { text: "Mr Micawber, Heep's new clerk, sent the court twenty-two pages of evidence against him.", requires: ["heep_caught", "micawber_helped"] },
  { text: "Mr Micawber went to Australia, where something did at last turn up: he became a magistrate.", requires: ["micawber_helped"] },
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
  { text: "The 'Other needs' box is still on Form R-4. Nobody has dared take it off.", requires: ["box_other"] },
];

/** title for the personal file */
export function titleFor(favour: number, good: number): { title: string; note: string } {
  if (favour >= 6 && good <= 2) return { title: "A Perfect Barnacle", note: "Mr Tite Barnacle recommends you for promotion. Nothing happened all week, beautifully." };
  if (good >= 12 && favour <= -4) return { title: "A Dangerous Reformer", note: "Mr Tite Barnacle recommends that you be moved to a room without a door." };
  if (good >= 10) return { title: "A Clerk Who Got Things Done", note: "Nobody upstairs is quite sure how. They are looking into it." };
  if (good <= -6) return { title: "A Pillar of the Office", note: "The pile on your desk is the tallest in the building. People have been seen to weep near it." };
  return { title: "An Ordinary Clerk", note: "Some papers moved, some didn't. Mr Tite Barnacle could not remember your name, which he considers a compliment." };
}

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
  betty: { skin: S.old, hair: "#c8c2b6", hat: "mob", hatColor: "#e6dfcf", coat: "#6a4a3a" },
};
