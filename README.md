# Harvestscape 🌾

A cozy pixel-art farming life-sim that runs entirely in the browser — **zero dependencies, zero asset files.** Every sprite, the painted title screen, the music, and the sound effects are generated in code, so the whole game is self-contained and portable (it even runs from a `file://` double-click).

You inherit your late grandfather's neglected farm on the edge of the fading valley town of **Willowbrook**. Wake the soil, grow it back to life, and — as a letter left on the kitchen table asks — say hello to Maya.

## Play

**▶ Play it live: [harvestscape.vercel.app](https://harvestscape.vercel.app)** — the current `master`,
auto-deployed on every push (saves live in your browser's localStorage).

Or run it locally:

```sh
python3 -m http.server 8643 --directory game
# → http://localhost:8643
```

Or just open `game/index.html` in any modern browser.

> **Hosting.** The game is a pure static site served from `game/` (config in `vercel.json`:
> `outputDirectory: game`, no build). Importing the repo on Vercel with default settings deploys
> it as-is; every push to `master` republishes to the live URL above.

## Features

- **The full cozy loop** — till, plant, water, harvest; chop trees, mine ore & gems, fish, forage, cook, and raise animals.
- **Four living seasons** — spring, summer, fall, and winter each transform the whole valley: seasonal grass and foliage, autumn leaves, falling snow and frozen ponds, warm/cool color grading. **11 crops** are season-locked (plant them in the right season or they wither at the turn), so every season farms differently — and winter is a rest season for mining, fishing, and cooking.
- **A kitchen & 12 recipes** — cook crops, fish, eggs and milk at any stove or campfire into dishes that restore energy, sell high, and make great gifts (Berry Jam, Pumpkin Soup, Fish Stew, Farmer's Omelette…). Trains Cooking.
- **A chicken coop** — buy hens from Tom, collect a fresh egg from each every morning, and pet them to raise friendship (well-loved hens lay Large Eggs).
- **A world to explore** — a farm overworld plus **enterable interiors** (your cottage, the coop, Tom's store, Maya's house, the Guild Hall), a **procedural multi-floor mine** (ore, gems, crystals, and a sealed Star-Metal vault deep down), and a **coast** (better fishing, shore forage, and the festival grounds). Doors, ladders, and paths warp you between them with a smooth fade.
- **A real cast** — Maya (romanceable), Tom the shopkeeper, Elder Rowan the guild keeper, Bram the fisher, and Pip — each with a pixel portrait, their own dialogue, favorite gifts, and a heart-based relationship.
- **An immersive storyline with a real payoff** — a 12-step arc: inherit the farm, meet the valley, help Elder Rowan relight the shuttered **Guild of Nine Crafts** wing by wing, recover the Star Metal from the deep mine, and bring the **Grand Festival** back to the coast. Quests are *reported in* to the neighbor who gave them; the **nine wings** light up (lit vs. dark) inside the Guild Hall as a living progress bar; **Grandpa's story** unfolds across letters — including the truth about why the valley went dark — and a keepsake pin you carry; and the finale is a **fully playable Festival evening** (a cinematic cutscene with the whole cast, a ceremony, a confession, and a lantern launch), not a text box. Tracked live on-screen and in your Journal.
- **A gentle on-ramp** — a short, skippable prologue and a revised opening letter tell you where you are and what you're here to do (wake the valley); one-time contextual hints teach each tool the first moment you need it; and the Journal frames the quests into acts — with the finale shown early as the destination — so the plot is always visible, never a wall of text. Returning saves skip all of it.
- **Cutscenes, letters & gifting** — a data-driven cutscene engine (letterbox, staged movement, dialogue, letters) drives heart-moments, the day-one arrival, and the finale; a gift picker lets you choose exactly what to give whom (with loves/likes hints), so you never fling a diamond at a stranger by accident.
- **RuneScape-style progression, paced to be savored** — 5 skills trained 1→99 on a bespoke XP curve (early levels earned, not showered; a long steady climb; only the final stretch a true completionist mastery award — no 13-million-XP wall), level-gated content (crops, trees, ores, fish, and a full Cooking recipe ladder), mastery perks at 25/50/75/99 — and when you hit one, the neighbour who cares most about that craft says a warm word. Four tiers of upgradeable tools (Basic → Copper → Iron → Gold).
- **A living world** — day/night color-grading, warm light pools from windows, lamps, campfires, torches and glowing crystals, cozy interior lighting, mine darkness lit by your lantern, weather (rain waters crops for free), and ambient pollen, fireflies, birdsong and crickets.
- **Juice** — particles and item-pops for every action, hitstop on strikes, floating XP/gold text, screen shake, an animated sun/moon clock, and a typewriter dialogue system with pixel portraits.
- **Generated audio** — an adaptive WebAudio soundtrack with distinct day, night, cozy-interior, mine and beach themes, plus a full library of synthesized sound effects.
- **Examine anything** — press **X** to look at whatever you're facing (a crop, a rock, a neighbour, the sea) for a wry little line of flavour, RuneScape-style; your Backpack reads like a museum, every item described.
- **The Collection** — the Journal keeps a discovery museum of everything you've ever found (crops, fish, gems, dishes, and more), filling in as you play — the completionist's slow reward.
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
- `DEVLOG.md` — the owner's playtest feedback and direction calls, recorded near-verbatim; the human signal behind the changelog's decisions.
- `GAME_ATLAS.html` — the whole game on one page (story, quests, unlocks, maps, people, economy, 100% checklist), generated from the live game data by `tools/build-atlas.mjs`; regenerate after any content change.
- `atlas/` — one atlas snapshot per release (start at `atlas/index.html`): the state of the game at every version, back to v2.1.0. Written automatically by the generator; part of the release checklist.
- `tools/` — repo tooling (currently just the atlas generator).
- `GROVE_DEPTHS.md` — the Grove Depths plan (depth rings, waystones on a pledge ledger, tree rarity, canopy treasure, plus the mine lift's ledger retrofit). Shipped in v3.3.0 "The Wood Remembers".
- `WORLD_EXPANSION.md` — the world-expansion plan: three new areas (the Coast Road, Starfall Ridge, Butterbrook), sequenced and scoped to one release each. All three shipped (v3.36 / v3.43 / v3.44); later layers remain.
- `V4_STATE_OF_THE_GAME.md` — the factual assessment of the game at v3.45.0: full systems inventory + the diagnosis behind Version 4.
- `V4_PLAN.md` — the Version 4 roadmap ("The Warden's Valley"): combat as the sixth skill, the year-long Act III story spine, and the breadth-pacing engine. Planned, not yet built.
- `GAME_DESIGN_PRINCIPLES.md` — the design bible; the yardstick the audits grade against.
- `GAME_BALANCE_PRINCIPLES.md` — the balancing playbook: distilled rules for gold, XP, and progression, each anchored to a real rebalance in this game's history, with a checklist, failure-mode list, and a live reference-numbers appendix. Read it before touching any economy/XP/tier number.
- `NEW_PLAYER_EXPERIENCE.md` — the onboarding beta plan (shipped in v2.2.0 "First Light"; its polish tier remains on the roadmap).
- `AGENTS.md` — instructions for any AI agent working in this repo (canonical; `CLAUDE.md`, `GEMINI.md`, etc. are symlinks to it).
- `GAME_SCOPE.md` — the original design vision (the larger Godot ambition this browser build is the vertical slice of).
- `prototype/` — the original zero-dependency proof-of-concept.
