import type { Need } from "./types";

/**
 * The corkboard: everyone you meet gets a card, and what you learn ties red
 * strings between them. Your stamps pull a string tight, or cut it.
 *
 * Needs work as elsewhere, plus three that point at a case:
 *   "seen@id" you have called them in, "records@id" you searched their Records,
 *   "pancks@id" Mr Pancks reported on them.
 */
export type Pin = { id: string; name: string; face: string; col: number; row: number; caseId?: string };
export type StrandState = "strong" | "strained" | "cut";
export type Strand = {
  id: string;
  a: string;
  b: string;
  label: string;
  reveal: Need[];
  /** first matching state wins; none means an ordinary string */
  states?: { when: Need[]; state: StrandState; note: string }[];
};

/** a 4-column board; rows go down as far as needed */
export const PINS: Pin[] = [
  { id: "casby", name: "Mr Casby, landlord", face: "casby", col: 0, row: 0 },
  { id: "pancks", name: "Mr Pancks", face: "pancks", col: 1, row: 0 },
  { id: "flora", name: "Flora Finching", face: "flora", col: 2, row: 0, caseId: "flora" },
  { id: "dorrit", name: "William Dorrit", face: "dorrit", col: 3, row: 0, caseId: "dorrit1" },
  { id: "plornish", name: "Mr Plornish", face: "plornish", col: 0, row: 1, caseId: "plornish" },
  { id: "doyce", name: "Daniel Doyce", face: "doyce", col: 1, row: 1, caseId: "doyce1" },
  { id: "tite", name: "Tite Barnacle", face: "tite", col: 2, row: 1 },
  { id: "merdle", name: "Mr Merdle", face: "merdle", col: 3, row: 1, caseId: "merdle" },
  { id: "micawber", name: "Mr Micawber", face: "micawber", col: 0, row: 2, caseId: "micawber" },
  { id: "heep", name: "Uriah Heep", face: "heep", col: 1, row: 2, caseId: "heep" },
  { id: "wickfield", name: "Mr Wickfield", face: "wickfield", col: 2, row: 2 },
  { id: "bucket", name: "Inspector Bucket", face: "bucket", col: 3, row: 2, caseId: "bucket" },
  { id: "scrooge", name: "Mr Scrooge", face: "scrooge", col: 0, row: 3, caseId: "scrooge1" },
  { id: "cratchit", name: "Bob Cratchit", face: "cratchit", col: 1, row: 3, caseId: "cratchit" },
  { id: "losberne", name: "Mr Losberne, surgeon", face: "losberne", col: 2, row: 3 },
  { id: "bumble", name: "Mr Bumble", face: "bumble", col: 3, row: 3, caseId: "bumble" },
  { id: "widows", name: "Rachael Hopkins", face: "widows", col: 0, row: 4, caseId: "widows" },
  { id: "squeers", name: "Mr Squeers", face: "squeers", col: 1, row: 4, caseId: "squeers" },
  { id: "stephen", name: "Stephen Blackpool", face: "stephen", col: 2, row: 4, caseId: "stephen" },
  { id: "bounderby", name: "Mr Bounderby", face: "bounderby", col: 3, row: 4, caseId: "bounderby" },
  { id: "jo", name: "Jo", face: "jo", col: 0, row: 5, caseId: "jo" },
  { id: "oliver", name: "Oliver Twist", face: "oliver", col: 1, row: 5, caseId: "oliver" },
  { id: "betty", name: "Betty Higden", face: "betty", col: 2, row: 5, caseId: "betty" },
  { id: "tomg", name: "Tom Gradgrind", face: "tomg", col: 3, row: 5 },
];

export const STRANDS: Strand[] = [
  {
    id: "rent",
    a: "plornish",
    b: "casby",
    label: "Plornish rents his room from Casby",
    reveal: ["records@plornish"],
    states: [
      { when: ["plornish_paid"], state: "strained", note: "The Office paid one rent, so Casby raised everyone's." },
      { when: ["casby_shorn"], state: "cut", note: "Casby's rents are public now, and so is Casby." },
    ],
  },
  {
    id: "collector",
    a: "casby",
    b: "pancks",
    label: "Pancks collects Casby's rents, and hates it",
    reveal: ["records@plornish"],
    states: [{ when: ["casby_shorn"], state: "cut", note: "Pancks sheared the Patriarch." }],
  },
  { id: "daughter", a: "casby", b: "flora", label: "Flora is Casby's daughter", reveal: ["records@flora"] },
  {
    id: "fortune",
    a: "pancks",
    b: "dorrit",
    label: "Pancks is hunting a Dorrit fortune",
    reveal: ["dorrit_heir"],
    states: [{ when: ["dorrit_free"], state: "strong", note: "Proved, and paid. Dorrit walked free." }],
  },
  { id: "gossip", a: "flora", b: "dorrit", label: "Flora heard about the fortune from Pancks", reveal: ["seen@flora"] },
  {
    id: "yard",
    a: "doyce",
    b: "plornish",
    label: "Doyce's works are in Bleeding Heart Yard, next to Plornish",
    reveal: ["records@doyce1"],
    states: [{ when: ["reform"], state: "strong", note: "With a patent, Doyce can hire. He starts with Plornish." }],
  },
  {
    id: "decimus",
    a: "tite",
    b: "merdle",
    label: "The Barnacles have their savings in Merdle's",
    reveal: ["seen@merdle"],
    states: [
      { when: ["merdle_ok"], state: "strong", note: "You tied the Office's money to Merdle too." },
      { when: ["merdle_no"], state: "strained", note: "You refused the Barnacles' friend." },
    ],
  },
  {
    id: "clerk",
    a: "micawber",
    b: "heep",
    label: "Micawber is going to work for Heep",
    reveal: ["seen@micawber"],
    states: [
      { when: ["heep_caught"], state: "cut", note: "Micawber's note brought Heep down." },
      { when: ["micawber_canterbury"], state: "strained", note: "Micawber is inside Heep's office now, watching." },
    ],
  },
  {
    id: "deed",
    a: "heep",
    b: "wickfield",
    label: "Heep holds Wickfield's pen, and his port",
    reveal: ["seen@heep"],
    states: [
      { when: ["heep_caught"], state: "cut", note: "The deed was refused. Wickfield is free of him." },
      { when: ["heep_ok"], state: "strong", note: "Heep owns half the firm now." },
    ],
  },
  { id: "bucket-heep", a: "bucket", b: "heep", label: "Bucket is asking about Heep", reveal: ["seen@bucket"] },
  { id: "bucket-merdle", a: "bucket", b: "merdle", label: "Bucket is asking about Merdle", reveal: ["seen@bucket"] },
  {
    id: "employer",
    a: "scrooge",
    b: "cratchit",
    label: "Cratchit is Scrooge's clerk, on fifteen shillings",
    reveal: ["seen@cratchit"],
    states: [{ when: ["scrooge_tim"], state: "strong", note: "Scrooge went to Camden Town himself." }],
  },
  {
    id: "certificate",
    a: "cratchit",
    b: "losberne",
    label: "Losberne charges 5s for a certificate the Cratchits can't afford",
    reveal: ["records@cratchit"],
    states: [{ when: ["losberne_friend"], state: "strong", note: "You paid him. He remembers it." }],
  },
  {
    id: "infirmary",
    a: "losberne",
    b: "bumble",
    label: "Losberne attends Bumble's workhouse, and is never paid",
    reveal: ["records@bumble"],
    states: [{ when: ["losberne_paid"], state: "cut", note: "You paid the surgeon over the beadle's head." }],
  },
  {
    id: "will",
    a: "widows",
    b: "squeers",
    label: "Rachael's eldest, Will, is a pupil at Dotheboys Hall",
    reveal: ["records@squeers"],
    states: [
      { when: ["squeers_placed"], state: "cut", note: "Will was placed in a decent school." },
      { when: ["rachael_paid"], state: "strained", note: "With the pension, Rachael could bring him home, if the school lets go." },
    ],
  },
  {
    id: "accused",
    a: "bounderby",
    b: "stephen",
    label: "Bounderby accuses Stephen of the robbery",
    reveal: ["seen@bounderby"],
    states: [
      { when: ["tom_found"], state: "cut", note: "The accusation fell apart." },
      { when: ["stephen_warrant"], state: "strong", note: "There is a warrant out for Stephen." },
    ],
  },
  { id: "key", a: "bounderby", b: "tomg", label: "Tom Gradgrind holds the other key to the bank", reveal: ["records@bounderby"] },
  {
    id: "box",
    a: "oliver",
    b: "jo",
    label: "Oliver's new box on the form could help Jo",
    reveal: ["box_other", "seen@jo"],
    states: [{ when: ["jo_ok"], state: "strong", note: "It did." }],
  },
  {
    id: "box2",
    a: "oliver",
    b: "betty",
    label: "…and Betty Higden",
    reveal: ["box_other", "seen@betty"],
  },
];
