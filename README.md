# Harvestscape 🌾

A cozy pixel-art farming life-sim that runs entirely in the browser — **zero dependencies, zero asset files.** Every sprite, the painted title screen, the music, and the sound effects are generated in code, so the whole game is self-contained and portable (it even runs from a `file://` double-click).

You inherit your late grandfather's neglected farm on the edge of the fading valley town of **Willowbrook**. Wake the soil, grow it back to life, and — as a letter left on the kitchen table asks — say hello to Maya.

## Play

```sh
python3 -m http.server 8643 --directory game
# → http://localhost:8643
```

Or just open `game/index.html` in any modern browser.

## Features

- **The full cozy loop** — till, plant, water, harvest; chop trees, mine ore & gems, fish, forage, cook, and raise animals.
- **Four living seasons** — spring, summer, fall, and winter each transform the whole valley: seasonal grass and foliage, autumn leaves, falling snow and frozen ponds, warm/cool color grading. **11 crops** are season-locked (plant them in the right season or they wither at the turn), so every season farms differently — and winter is a rest season for mining, fishing, and cooking.
- **A kitchen & 12 recipes** — cook crops, fish, eggs and milk at any stove or campfire into dishes that restore energy, sell high, and make great gifts (Berry Jam, Pumpkin Soup, Fish Stew, Farmer's Omelette…). Trains Cooking.
- **A chicken coop** — buy hens from Tom, collect a fresh egg from each every morning, and pet them to raise friendship (well-loved hens lay Large Eggs).
- **A world to explore** — a farm overworld plus **enterable interiors** (your cottage, the coop, Tom's store, Maya's house, the Guild Hall), a **procedural multi-floor mine** (ore, gems, crystals, and a sealed Star-Metal vault deep down), and a **coast** (better fishing, shore forage, and the festival grounds). Doors, ladders, and paths warp you between them with a smooth fade.
- **A real cast** — Maya (romanceable), Tom the shopkeeper, Elder Rowan the guild keeper, Bram the fisher, and Pip — each with a pixel portrait, their own dialogue, favorite gifts, and a heart-based relationship.
- **An immersive storyline with a real payoff** — a 12-step arc: inherit the farm, meet the valley, help Elder Rowan relight the shuttered **Guild of Nine Crafts** wing by wing, recover the Star Metal from the deep mine, and bring the **Grand Festival** back to the coast. Quests are *reported in* to the neighbor who gave them; the **nine wings** light up (lit vs. dark) inside the Guild Hall as a living progress bar; **Grandpa's story** unfolds across letters — including the truth about why the valley went dark — and a keepsake pin you carry; and the finale is a **fully playable Festival evening** (a cinematic cutscene with the whole cast, a ceremony, a confession, and a lantern launch), not a text box. Tracked live on-screen and in your Journal.
- **Cutscenes, letters & gifting** — a data-driven cutscene engine (letterbox, staged movement, dialogue, letters) drives heart-moments and the finale; a gift picker lets you choose exactly what to give whom (with loves/likes hints), so you never fling a diamond at a stranger by accident.
- **RuneScape-style progression** — 5 skills trained 1→99 on the real RS XP curve, level-gated content, and four tiers of upgradeable tools (Basic → Copper → Iron → Gold).
- **A living world** — day/night color-grading, warm light pools from windows, lamps, campfires, torches and glowing crystals, cozy interior lighting, mine darkness lit by your lantern, weather (rain waters crops for free), and ambient pollen, fireflies, birdsong and crickets.
- **Juice** — particles and item-pops for every action, hitstop on strikes, floating XP/gold text, screen shake, an animated sun/moon clock, and a typewriter dialogue system with pixel portraits.
- **Generated audio** — an adaptive WebAudio soundtrack with distinct day, night, cozy-interior, mine and beach themes, plus a full library of synthesized sound effects.
- **Save/continue** — auto-saves each night to `localStorage`.
- **Version history in-game** — a **What's New** panel (click the version on the title screen, or open it from Settings) shows the changelog, and pops up once automatically after you update to a newer build.

## Controls

| Key | Action |
|---|---|
| WASD / arrows | Move |
| Space / click | Use selected tool on the tile you face |
| E / right-click | Interact — harvest, talk, read signs, cook, sleep |
| R | Cycle seeds · **F** eat · **G** gift Maya |
| 1–6 | Select hotbar slot |
| K / I / J | Skills · Backpack · Journal |
| M | Toggle music |

Sell and upgrade at **Tom's stall**; **sleep at your cottage door** to pass the night and grow your crops. Touch controls appear automatically on mobile.

## Layout

- `game/` — the finished game (`index.html`, `css/`, `js/` split into 15 ordered modules, `00-core` → `14-story` → `12-game`).
- `CHANGELOG.md` — the single internal audit trail of every change and the reasoning behind it (mirrored in-game by the `CHANGELOG` array in `game/js/01-data.js`).
- `AGENTS.md` — instructions for any AI agent working in this repo (canonical; `CLAUDE.md`, `GEMINI.md`, etc. are symlinks to it).
- `GAME_SCOPE.md` — the original design vision (the larger Godot ambition this browser build is the vertical slice of).
- `prototype/` — the original zero-dependency proof-of-concept.
