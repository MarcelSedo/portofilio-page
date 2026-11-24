# The Long Spring

Brigid's ride through a world turned inside out. Two ways to play:

- **The mission**: Brigid (the dryad) rides through four lands: The Rot, First Green, Deep Green, Bloom. Villages turn up
  on the way; ride through the glowing ring at a village's heart to give it one of your hearts. Saved souls open the gate
  of spring into the next land; after Bloom, the golden gate and the end. Fall, and you rise again at the last gate.
- **The endless ride**: any rider and mount, no villages, no end, kilometres and points, missions and the daily word.
  It is set in the furthest land the mission has reached, and stays there.
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
| `src/story.ts` | **Everything the player reads in the mission**: the prologue, the three kinds of village, the rules, Brigid's 24 memories (4 lands × 6), the ending, and the generators for village names, people's names, their lines and gifts |
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

## The mission (numbers in `MISSION`, `config.ts`)

- **Villages** come every 190–290 m: The Crowd (6 souls, on the road), The Grove (4, a little aside), The Named (2, away
  from the road). Giving a heart: 6 → six souls; 4 → four souls and a tree of spring, which gives you a heart back at
  the next gate; 2 → two souls, two named people (kept in the book), a gift (weapons come only from them in the mission)
  and, if the hamlet is marked "✦ a memory", the next of Brigid's memories for that land.
- You can't give your last heart. A village you ride past is **lost**: its souls come off your count, and the land asks
  one soul fewer of you (down to half). A saved village is a sanctuary: monsters that run into it are stunned.
- **Souls needed** per land: 8, 12, 14, 16. Then the gate appears ahead. Hearts lie in the land every 140–220 m (a little
  more often the longer you stay in one land); at most 9.
- **The finale** at the golden gate: the hunt ends, the rot dissolves, everyone saved gathers and waves, the trees of the
  groves and hamlets grow, Brigid goes into the light, and every heart she still has becomes one more person (reborn).
  Enter, Space or Esc skips it.
- The save remembers the memories found, the named, the checkpoint (last land reached), the furthest land (which sets
  the endless ride) and the endings.

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
