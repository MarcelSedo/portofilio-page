/**
 * The Circumlocution Office: a desk game after Charles Dickens.
 * Self-contained: content, engine, UI, styles, fonts and art all live in this folder.
 * Host it anywhere in a Next.js (App Router) app:
 *
 *   import { CircumlocutionGame } from "@/games/circumlocution";
 *   export default function Page() { return <CircumlocutionGame exitHref="/portfolio#games" />; }
 */
export { Office as CircumlocutionGame, type OfficeProps as CircumlocutionGameProps } from "./src/ui/Office";
