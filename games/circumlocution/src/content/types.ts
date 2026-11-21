/**
 * The Circumlocution Office: data types.
 * A desk game after Dickens's Little Dorrit. Every case is plain data, so the
 * stories can be read and edited without touching the engine.
 *
 * Money: the Relief Fund is counted in pounds (£), the clerk's own purse in shillings (s).
 */

export type Meter = "favour" | "good" | "money";
export type Effect = Partial<Record<Meter, number>>;

/** A handwritten signature. Forgeries differ in spelling, slant or flourish. */
export type Sig = { text: string; slant: number; flourish?: boolean };

/** A line on a document: plain text, or a labelled field. */
export type DocLine = string | [label: string, value: string];

export type Doc = {
  id: string;
  kind: "form" | "letter" | "ledger" | "certificate" | "memo" | "note" | "notice";
  title: string;
  ref?: string;
  lines: DocLine[];
  sig?: Sig;
  /** signed by (shown under the signature) */
  signer?: string;
  /** only on the desk if this has happened */
  requires?: Need[];
};

/**
 * What a choice needs before it can be stamped:
 * - "records"  the Records were searched for this case
 * - "match" / "differ"  you compared signatures and noted that
 * - "pancks"  Mr Pancks's report is on the desk
 * - "flag" or "!flag"  something that happened earlier (hidden if unmet)
 * - "count>=n"  a thread counter (hidden if unmet)
 */
export type Need = string;

export type Choice = {
  id: string;
  /** the word on the rubber stamp */
  stamp: string;
  /** the button text: what you decide */
  label: string;
  needs?: Need[];
  /** extra hours it takes (on top of opening the case) */
  cost?: number;
  effect: Effect;
  /** shillings into (+) or out of (−) your own purse */
  purse?: number;
  /** an irregular stamp the auditor may look at; safe if you hold this evidence */
  risky?: { safeWith?: Need[]; finding: string };
  set?: string[];
  count?: string;
  /** what the applicant says back */
  reply: string;
  /** Barnacle Junior's remark */
  junior?: string;
  /** tomorrow's headline in The Gazette */
  gazette?: string;
  /** one line for your personal file */
  log: string;
};

export type Outcome = Omit<Choice, "id" | "stamp" | "label" | "needs" | "cost" | "risky">;

export type Thread = "jarndyce" | "doyce" | "merdle" | "dorrit";

export type Case = {
  id: string;
  day: number;
  who: string;
  /** the novel they come from, or "A stranger" */
  from: string;
  face: string;
  requires?: Need[];
  thread?: Thread;
  /** costs no hour to call in */
  quick?: boolean;
  /** what they say when they sit down */
  opening: string;
  docs: Doc[];
  /** a question for the signature lens; needsRecords: a signature to compare comes from the Records */
  compare?: { question: string; needsRecords?: boolean };
  /** what the Records hold */
  records: { lines: string[]; doc?: Doc };
  /** Mr Pancks's report, delivered next morning (costs a shilling) */
  pancks?: { lines: string[]; set?: string[] };
  choices: Choice[];
  /** if the case is still in the pile at five o'clock */
  ignored: Outcome;
};

export type Headline = { text: string; requires?: Need[]; effect?: Effect; set?: string[] };

export type DayInfo = {
  day: number;
  name: string;
  hours: number;
  /** Barnacle Junior in the morning */
  morning: string[];
  memo?: Doc;
  headlines: Headline[];
  /** Mr Rugg the auditor looks at one irregular stamp this morning */
  audit?: boolean;
};

export type Epilogue = { text: string; requires?: Need[] };

export type Face = {
  skin: string;
  hair: string;
  hat: "none" | "top" | "bonnet" | "cap" | "cocked" | "mob" | "bald" | "feather";
  hatColor?: string;
  coat: string;
  beard?: "none" | "mutton" | "full" | "stubble";
  specs?: boolean;
  monocle?: boolean;
  cravat?: string;
  /** a small mark: a crutch, a broom, a quill */
  prop?: "crutch" | "broom" | "quill" | "bird" | "bag";
  young?: boolean;
};
