# Emma: A Rainy Day at Hartfield – Act I

A small detective adventure after Jane Austen's *Emma*, played like an old Pokémon game: one room at a time,
tile by tile, with a keyboard (or a pad on a phone). English and Slovak.

## The story

It is raining, the coachman Tom has "taken to his bed", and Mr Woodhouse will not let the carriage out.
Emma has decided the housemaid Bessie is in love – and sends Harriet (you) about the house to find out with whom.
Emma has a fine nose for **where** to look and a terrible one for **who** loves whom: she accuses the gardener,
the footman and the butler in turn. Each time you **object** with proof from your Casebook.

Then the second half: bring Bessie and Tom together – Papa must order gruel, Mrs Serle must make it,
Bessie must learn the truth, and she needs an umbrella. The rain stops; the gate to Highbury opens.

## How it plays

- **Emma is the quest giver.** She stays in her room and always tells you what to do next. A golden arrow
  points at the next goal, or at the door that leads towards it (can be switched off).
- **Everything can be examined.** Most things answer with a line; a few hold clues, and those glimmer when they matter.
- **Casebook** (B): Items, Letters, Words (what people said), People (a little Pokédex) and a Map of hearts
  that updates as you learn – who is suspected, who is ruled out, who is in love.
- **Objections:** when Emma states a wrong theory, choose *Object!* and present the card that disproves it.
- **Puzzles with a purpose** – each gives a card or opens the way: polishing the silver, the torn letter,
  Mrs Serle's Tuesday timeline, a tactful word with Mr Woodhouse, making the gruel.
- **Accomplishments** (repeatable): needlework, music, housekeeping. Small kindnesses (Papa's shawl, the draughty
  window) and a little music make Mr Woodhouse easier to persuade.
- No timers, no way to lose. The game saves by itself in the browser.

Keys: arrows/WASD walk · E, Space or Enter talk/examine/continue · B Casebook · Esc menu.
On touch screens a pad appears under the picture.

## Files

```
index.ts                 export { Hartfield }
src/engine/game.ts       tile engine: rooms, movement, doors, NPCs, rain/fire/candles, cut-scene walks
src/engine/art.ts        the pictures (static imports)
src/engine/sound.ts      tiny Web Audio sounds and rain
src/data/maps.gen.ts     generated: room grids, doors, things to examine, effects
src/data/story.ts        the whole act: state, people, cards, tasks, dialogue (EN/SK), examine lines
src/data/ui.ts           interface words and puzzle content (EN/SK)
src/ui/Hartfield.tsx     screens, dialogue, menu, objections, the ending
src/ui/Casebook.tsx      the Casebook
src/ui/Puzzles.tsx       the seven puzzles
src/assets/              PNGs drawn by tools/hartfield-art
src/styles/              CSS and fonts (SIL OFL)
```

The pictures are drawn by code: `python3 tools/hartfield-art/build.py` (needs Pillow) redraws every room,
character, portrait and icon and regenerates `maps.gen.ts`, so pictures and collisions always agree.

## Type

IM Fell English (Igino Marini) for the text and Pinyon Script (Nicole Fally) for names and titles, both under the
SIL Open Font License. IM Fell has no Slovak háčeks; `tools/hartfield-art/fell_sk.py` builds č ď ľ ĺ ň ŕ š ť ž
(and capitals) from the font's own circumflex and apostrophe, so Slovak is set in the same face.

Add `?debug` to the address to expose `window.__hf` (the game and its state) for testing.
