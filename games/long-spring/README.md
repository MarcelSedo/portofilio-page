# The Long Spring

Brigid's ride through a world turned inside out. Three ways to play, one set of controls:

- **The mission** (the story, the slowest): Brigid (the dryad) rides through four lands, The Rot, First Green, Deep
  Green, Bloom, and wins back fourteen of her memories (3, 4, 4, 3). Each memory is a chapter, raced against the
  forgetting. Win back all but one of a land's memories and the gate of spring opens; after Bloom, the golden gate and
  the end. Fall, and you rise again at the last gate.
- **The endless ride** (30–60 minutes): any rider and mount, no villages, no hearts on the road. The only thing to
  gather is the lamp's coloured lights, in order. Weapons come back by themselves; every five minutes the land does
  something (fog, a storm, fords, rune-stones, the Colossus), then goes quiet. Missions and the score multiplier.
- **The hunt** (10 minutes): any rider, The Rot, only monsters. Score = how many you bring down, and whether you live.
- **The First Morning**: a short lesson ride that can't kill you, offered before the first mission.

## Files

| File | What it is |
|---|---|
| `src/config.ts` | **Every number to tune** (`TUNE`), obstacle rules and when each kind appears, riders, mounts (km/h), colours, monsters, the four lands, the daily words |
| `src/game.ts` | The game: one class, one canvas, one loop (world, steering, jump/duck, monsters and their leap, weapons, companions, drawing) |
| `src/art-life.ts` | Cottages, the well, villagers, animals and the gates of spring |
| `src/ui/Ornament.tsx` | The knotwork corners, the antler medallion and the vine divider of the menus |
| `src/styles/fonts/` | Uncial Antiqua (SIL Open Font License) for the titles |
| `src/sprites.ts` | All the art, drawn with canvas paths at the screen's real resolution (no image files); rider and mount are redrawn when colours change |
| `src/story.ts` | **Everything the player reads in the mission**: the prologue, the rules, Brigid's 14 memories (title, sign, poem, picture, its three pieces), how many each land needs, the ending |
| `public/long-spring/memories/` | The fourteen pictures of the memories (webp, 1200×900) |
| `src/meta.ts` | What lasts between runs: missions and the multiplier, the daily word, the save (`long-spring-v2`) |
| `src/sound.ts` | Tiny Web Audio beeps (off by default) |
| `src/ui/LongSpring.tsx` | React shell: menus over the still land, the Edge-surf-style picker, HUD, touch buttons, dialogs, the `?tune` panel |
| `src/styles/long-spring.css` | Styles, all under `.ls` |

## The rules of the land (the pictures say them too)

- **Wood lying on the ground** (fallen trunks from 700 m, thorns from 2.6 km): jump ↑. The boar runs through thorns.
- **A stone arch** (from 1.6 km): duck ↓ and ride under the middle, where its shadow lies. The pillars are solid.
- **Everything else** (trees and groves, boulders, standing stones, small stones, the green fire): ride round it.
  Nothing jumps the green fire. The boar breaks small stones.
- The first time each new kind appears, the game says what to do with it.

## The hunt

- Hitting anything costs a heart **and** the nearest monster jumps onto your neck (the Subway Surfers stumble).
- A monster that gets close crouches (a red **!**) for a third of a second, then leaps at where you are going. Swerve.
- The Maw follows your scent (where you rode), so swerving close past a tree sends it straight in. The Crawler zigzags.
  The Eye aims ahead and sees pits and traps. The Colossus walks through trees and rocks.
- Off the screen they never crash: every crash is one the player can see and cause.
- When the last heart goes, the rider tumbles and lies by her mount in a spreading pool of blood (grey dust with
  "less blood"); whatever caught her stands over the body, and the end panel sits low so the body stays in sight.
- One hunter, two from 1 km, three from 3 km. At 1, 2 and 5 km the land turns greener and heals your hearts.
- Bow (hold Space, let go), sword (X, but every sword kill brings two more), root trap (Z), bark armour, companions.

## Tuning

Open the page with `?tune`: sliders for metres per pixel, monster speed, the leap distance, steering, density and
the stumble, and a box with the values to paste back into `TUNE`. With `?tune` the game is also on
`window.longSpring` for experiments in the console.

## The mission (numbers in `MISSION`, `config.ts`; texts in `story.ts`)

- **A chapter** begins 110 m into a land, then 150–220 m after the last. Its sign shows (a ribbon on a thorn, candles
  in the snow), and the forgetting starts: `chapter.limit` seconds (80, 74, 70, 66 by land; 10 % less when a forgotten
  one comes again). The world loses its colour (a saturation pass over the canvas) and darkens from the edges.
- **Three pieces**, one after another: a **light** drifting over the land (shoot it; an empty quiver is lent two
  arrows), a **ring** of light on the road (ride through it), a **rune-stone** (take it and cast it; a rune already in
  hand anchors it too). A missed piece comes again after 3 s. The pieces keep their colour in the grey world.
- **Remembered**: the colour comes back, a heart, the hunt is thrown back and stunned, a spring tree grows, and the
  card shows the picture and the poem, with *Read it aloud* (the browser's own voice for now, a woman's if it has
  one, slow, line by line; to be replaced by a recording). **Forgotten**: the memory goes dark (mist in the book), one
  monster comes after you, and the memory comes back later in the land only if the land still needs it.
- **The gate** opens when every chapter of the land has been played and all but one are remembered.
- **The Collector** steals a won piece (in the endless ride the lamp's lights, in the hunt three arrows); shoot it to
  get it back.
- **Pace**: the mission rides at 85 % (`MISSION.pace`), with one hunter in the first two lands, two in the last two.
- **The save** keeps `memories` (chapters reached) and `clear` (remembered). Older saves with the 24 memories are let
  go once (`book: 2`).
- **Wells**: the pits of green fire heal land by land, as before. In the finale the wells light up and the reborn come
  out of them.
- **Starting over**: once you have passed a gate, The mission asks where to ride from: on from the last gate, or the
  whole mission again (the book stays).
- **The finale** at the golden gate: the hunt ends, the rot dissolves, the people gather, a tree grows for every
  memory won on the ride, Brigid goes into the light, and every heart she still has becomes one more person.

## The First Morning (tutorial)

Steer, jump a log, duck an arch, take a heart, lead a monster into a tree, ride through a memory's ring, shoot a
memory's light, then three drills with
a slow practice monster: the bow (hold Space, let go when the line points at it), a root trap (Z when it is right
behind you) and the sword (X when it is on your neck; two more come out of the blood, then the lesson ends). Then
a gate. Nothing can kill you.

## The land

- **Scars**: patches of the rot stay behind in the healing lands (burnt ground, dead trees, green fire): half of First
  Green, a fifth of Deep Green, here and there in Bloom.
- **Life**: crows and flies where it is dark, butterflies and small birds where it is green; crows and birds fly off
  when she comes close.
- **Monsters** are ash-grey, darker towards the ground, with veins, and a smoke of the dark round their feet.
- **Companions** act where you can see it: the hound tears a monster down (twice, then it falls), the raven blinds
  them all and takes the eyes of the nearest, the doe leads one into the woods for good.
- **The endless ride** (`ENDLESS`, `EVENTS`): lamps of 3 lights, 4 from 10 min, 5 from 25 min; a mirrored lamp (⇄,
  from 10 min, 30 %) wants them backwards. Right light +20 × multiplier, full lamp +150 per light (×1.5 mirrored);
  three full lamps without a spill give a heart. Arrows +1 every 4 s (max 6), a trap every 30 s, the sword every 55 s.
  Records: score, metres, lamps (`best`, `bestMetres`, `bestLamps`).
- **The hunt** (`EXTREME`): 600 s, hunters 2, 3, 3, 4, 4, 5 (every 100 s), respawn 1.6 s, the Colossus at 520 s.
  Arrows +1 every 2.2 s (max 9), half the kills drop one more (the Colossus five), a heart every 150 s. No animals,
  fords, lamps or memories. Records: `bestKills`, `huntsWon`.

## Music and the opening

`music.ts`: ethereal and Celtic rather than tribal. A slow wash of chords, a harp picking out each chord, a high, airy
wordless voice floating over it (long vowels, a big room and an echo) and a tin whistle playing the old airs. Low and
dark in The Rot, lighter land by land, the whistle leading in Bloom; at the golden gate harp, whistle and a bird.
A light bodhrán comes in only when the hunt is close, and the harp runs like a reel; when Brigid falls, a slow lament.
`renderMusic` renders a stretch offline (for listening outside the game; the game never calls it). It starts on the first key or click (browsers need one). Settings: music on/off and the
two volumes. The opening shows the studio wordmark (`studio-logo.ts`, outlines only) and then the title; any key or
click skips it.

## Menus

- Every page fits one screen on a desktop (checked at 1024×640 up to 1920×1080, full screen); long ones are split: the
  prologue into three pages, How to play into tabs, the book into the four lands. Each page has a × (and Esc) to close.
- **The Book of Memories** is a road of four steps, one per land; it opens on the land you are in. Lands not reached yet
  are locked. Memories are misty cards; click one to read it, ◂ ▸ to go through that land. Then the Named, and the
  ending once you have seen it. It opens from the title, from the pause (in the mission) and from the end of a mission.
- **Pause**: Ride on, Settings, The book (mission), Start again, To the menu. Settings and the book open inside the pause.
- The endless missions (score ×) live under Rider & mount, as they only matter for the endless ride.

## Animals (both rides)

Hares (and from Deep Green foxes and roe deer) cross the road, timed to meet the hunt behind you (`LIFE` in `config.ts`).
A monster that gets within reach leaps on one and stops to eat: it buys you a moment, but the monster comes back faster
(7 % per meal, up to five) with a red glow; in the endless ride you also lose points.

## Full screen

The corner button (on the menus and in the HUD) or **F** switches full screen at any time; the setting "Full screen when
I ride" turns it on with every Ride. Where the browser has no full screen for a page (iPhone Safari), the game simply
covers the page instead.

## Things on the ground

Hearts, weapons, traps, armour, companions and letters are drawn 1.4–1.8 × bigger than the art (`PICK_SCALE` in
`sprites.ts`) with a pulsing ring of light under them; the HUD and touch buttons use the same pictures.

## Accessibility

Keyboard first (arrows/WASD, Space, X, Z, C, Esc; the picker is ← → on a row, ↑ ↓ between rows), big touch
buttons on phones, real buttons and headings in every menu, focus moved to each dialog, every message read out in a
polite live region (important ones stay on screen until read). Settings: reduced speed (¾), high visibility (outlines,
"↑ jump", "↓ duck"), less blood, calmer (no shaking, flashing or waves; on by default with reduced motion), sound, full screen when riding.
