# The Long Spring

Brigid's ride through a world turned inside out. Three ways to play, one set of controls:

- **The mission** (the story, the slowest): Brigid (the dryad) rides through four lands, The Rot, First Green, Deep
  Green, Bloom, and wins back fourteen of her memories (3, 4, 4, 3). Each memory is a chapter, raced against the
  forgetting. Win back all but one of a land's memories and the gate of spring opens; after Bloom, the golden gate and
  the end. Fall, and you rise again at the last gate.
- **The endless ride** (30–60 minutes): any rider and mount. Score = kilometres + souls saved + lamps. Weapons and now
  and then a heart lie on the road; now and then a village waits for a heart; every task done gives a heart; now and
  then a lamp of coloured lights (fill it in order: a heart). Every five minutes an event (storm, fords, rune-stones,
  the Colossus), then quiet. Missions and the score multiplier.
- **The hunt** (10 minutes): any rider, The Rot, fewer obstacles, more monsters, weapons and hearts on the road.
  Score = how many you bring down, and whether you live.
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

## The mission (numbers in `MISSION.chapter`, `config.ts`; texts in `story.ts`)

- **The road of her life**: 14 chapters from the hall (where it began) to the sea (where it ended), in four lands
  (3, 4, 4, 3). A chapter is three stretches of `seg` m (480 m, about 1.5 min). Fall, and you rise again at the start of
  the chapter (`chapterAt` in the save).
- **Grey, then colour**: a chapter begins with its picture in grey (a card for 3 s) and the land greys. Each stretch
  ridden well brings a third of the picture back in colour (from the middle out), and the land with it. Near the end the
  place itself appears (thorn with the ribbon, the arched trees of the hall, the door with three pairs of shoes, a
  standing stone for the rest) and blooms. The card shows the picture and the poem as far as it was won; the book keeps
  the best (`thirds`).
- **Rules** (`rule` in `MEMORIES`): *ribbon*: follow Áine's ribbon, no monsters (a stretch counts if you stayed close for
  `near` of it); *dance*: the trees step aside on every drum beat (`beat`, `step`); *count*: three small lights ride
  behind you, a monster or a hit takes one, the picture comes back by as many as you bring through. The rest: a stretch
  without losing a heart. The rules of chapters 4–14 are still to come.
- **Hearts to give**: in a chapter one or two people stand by the road, half taken by the rot (they grey further as you
  come). Ride through their ring to give a heart (never your last): "Thank you", they walk off in colour. Passed by,
  they turn, and come after you when the next chapter begins.
- **Runes** are tools for the land (a beam at the nearest monster, bridge, light, thorns, wind): press R, watch the
  strokes light up round the rune, repeat them with the arrows.
- **The book** opens on a map of the kingdom: the road, the 14 places (green whole, gold in part, grey not yet), and a
  small light for everyone given a heart.

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
- **Everywhere**: a creeping fog now and then (green in The Rot, grey in the middle lands, glittering blue in Bloom);
  animals that cross the road become a one-use companion if you catch them; green arrows of light, root traps that
  burst into glowing lianas, a rune cast right looses a beam of leaf-light that destroys the nearest monster (three
  blows on the Colossus), and the sword burns blue.
- **The endless ride** (`ENDLESS`, `EVENTS`): lights from 250 m, a new lamp every 450–750 m; a full lamp gives a heart;
  villages from 380 m, every 650–1000 m, 100 points a soul. Lamps of 3 lights, 4 from 10 min, 5 from 25 min; a mirrored lamp (⇄,
  from 10 min, 30 %) wants them backwards. Right light +20 × multiplier, full lamp +150 per light (×1.5 mirrored);
  Records: score, metres, souls, lamps (`best`, `bestMetres`, `bestSouls`, `bestLamps`).
- **The hunt** (`EXTREME`): 600 s, 62 % of the obstacles, hunters 3, 3, 4, 4, 5, 6 (every 100 s), respawn 1.3 s, the
  Colossus at 520 s. Weapons and hearts lie on the road more often than elsewhere. Records: `bestKills`, `huntsWon`.

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
