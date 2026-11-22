# The Circumlocution Office

A desk game after Charles Dickens: five days as a new clerk in the office whose motto is
*How Not To Do It*. Read papers, check signatures, search the Records, send Mr Pancks,
stamp. Pay the rent at home. Read about it in the morning paper. You can lose.

## Folder
```
games/circumlocution/
  index.ts              the only entry point: export { CircumlocutionGame }
  src/content/          all the writing, as data (cases, days, corkboard strings, portraits)
  src/engine/state.ts   rules: hours, evidence, audit, household, losing, save
  src/ui/               React components (Office, Board, Portrait, Sheet, sound)
  src/styles/           one CSS file, imported by Office.tsx
  src/assets/           facade.png + self-hosted fonts (SIL OFL, see fonts/OFL.txt)
  tools/facade.py       regenerates the title picture (Python + Pillow)
```
Nothing here imports from the host site, so the folder can move to its own repository as it is.

## Hosting it (Next.js App Router)
```tsx
import { CircumlocutionGame } from "@/games/circumlocution";
export default function Page() {
  return <CircumlocutionGame exitHref="/portfolio#games" exitLabel="Back to the portfolio" />;
}
```
The CSS, fonts and picture are imported by the component and bundled by Next; nothing goes in `public/`.
Saves live in localStorage under `circumlocution-v2`.

## Writing more
Cases are plain objects in `src/content/cases.ts`. A choice can need evidence (`records`, `match`,
`differ`, `pancks`), earlier events (flags, `!flag`, `count>=n`) or another case (`seen@id`,
`records@id`, `pancks@id`). Strings on the board live in `src/content/board.ts`.

## Changelog
- **0.4** Precedents (your exceptions come back: the Yard after Plornish, a false "widow" after Rachael,
  Turveydrop and the 'Other needs' box), Mr Rugg with a logic of his own (Junior hints the day before;
  biggest unexplained sum first; two of a kind = a file; answer him: accept, repay, or blame Junior),
  Miss Flite's line rewritten (Krook's will, Richard's loan, the Court's deadline, judgment day),
  Merdle in three phases (Ferdinand's pre-approval on Tuesday, the licence on Wednesday, your wages
  on Thursday), Bucket can get Heep's file without your confession (Heep keeps books), evening
  extras (night copying, pawning the watch, a loan to Mrs Bagnet), "Our Man at Whitehall" in every
  Gazette, ten endings by favour, good, Fund, family, reforms and bribes.
- **0.3** Own folder, corkboard with strings, cross-links, Pancks's Friday case.
- **0.2** Losing, household, scarce Fund, auditor, bribes, Victorian look.
- **0.1** Five-day MVP.
