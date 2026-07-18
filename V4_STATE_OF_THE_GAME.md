# V4 State of the Game — what HarvestScape is at v3.45.0

*Written 2026-07-18 as the factual baseline for the Version 4 plan (`V4_PLAN.md`), per the
owner's call (DEVLOG 2026-07-18): "assess the whole game as it is first and save that."
Inventory verified against live code (`01-data.js`, `13-content.js`, `14-story.js`,
`09-quests.js`, `08-actions.js`, `07-entities.js`), not the docs.*

---

## 1. The game in one paragraph

A finished, polished cozy farming/skill game: **5 skills (1–99), 15 maps, 7 NPCs with hearts
and marriage, a 14-quest two-act story, 4 festivals, ~10.8k lines of dependency-free JS.** The
day loop, economy, and progression ladder are the product of ~45 releases of audited iteration
(current design grade A−). There is no combat, no failure state, and no hazard anywhere. The
story fully resolves early; the long tail is skill grinding and collection.

## 2. Systems inventory

### Skills (5, all 1–99)

Shared XP curve `inc = 62 + (l-1)^2.18`, **L99 ≈ 782k XP** (~17× gentler than RuneScape).
Total-level cap **495**. Mastery milestones at 25/50/75/99 grant passive perks + a warm line
from each skill's "caring" NPC.

| Skill | Trained by | Ladder |
|---|---|---|
| Farming | till/plant/water/harvest; Nell's dairy orders | 20 crops L1–90 (Turnip→Everbloom) |
| Woodcutting | 7 tree species | Pine 10 → Silverwood 85 |
| Mining | rocks/veins | Copper 10 → Star Metal 85 |
| Fishing | cast→hook→hold minigame | 21 fish L1–85 + 5 Legendaries |
| Cooking | 21 recipes L1–90 | Fried Egg → Grand Feast |

Ore and wood tiers share **one unified ladder (1/10/20/30/45/70/85)**; each tool tier needs
its own skill level + wood + ore + gold (+ gems/deep mats at the top). This is the game's
existing anti-rabbit-hole machinery — and the owner's named model for more of it.

### World (15 maps)

- **Outdoor (7):** Farm (persistent home) · Village (hub) · Beach · Coast Road (river,
  Marrow Point landing) · Starfall Ridge (night star-gleaning) · Butterbrook (dairy meadow)
  · Deep Grove (9 rings, the axe's "mine").
- **Interior/procedural (8):** Cottage, Coop, Barn, Store, Alderman House, Guild, Coast
  Dairy, the Old Mine (∞ procedural floors, Old Lift + Deep Runs + geodes past floor 25).
- Fast travel: minecart, grove waystones, lift stops — all funded through the **Pledge
  Ledger** (discover-now, fund-later partial deposits).

### People (7)

Maya (love interest, alderman's daughter) · Tom (store) · Elder Rowan (Guild, story spine) ·
Bram (coast, romanceable) · Pip (kid, comic relief) · Nell (dairy, v3.44) · Elias (Act II
payload, Marrow Point ferryman). Hearts 0–6, gifts/birthdays, heart events, confide scenes,
marriage (Maya or Bram, one per save).

### Story & quests

- **Act I "The Quiet Valley"** — 11 quests: farm proof-of-crafts → relight the Guild's 9
  wings → **finale at total level 60**: the Grand Festival fires, ninth wing lights,
  "Thank you for playing."
- **Act II "The Empty Chair"** — 3 quests + epilogue: Maya's estranged father Elias, the
  Homecoming at Marrow Point, "One Last Letter."
- **Repeatables:** 1 noticeboard request/day (20 defined), 1 Nell dairy order/day (6),
  festivals ×4 + anniversary Lantern Festival, 9 Almanac pages, Collection museum,
  Quest Points → Storyteller's Banner.

### Economy

Demand system (anti-glut price slide), artisan machines (Keg/Jar/Cheese Press/Sawmill),
orchard + apiary + animals (hens/cows/sheep, named, hearts), 7 gems + geodes, charms (7,
one worn). Big sinks: Star Metal tools (~12k gold + 5-material bill each), deep lift stops,
civic projects, star monuments, the 300k Golden Statue.

## 3. Diagnosis — the three v4 problems, quantified

**P1. The story is thin relative to the grind — and ends first.** The Act I finale gates on
**total level 60 of 495 (12%)**; Act II adds hearts, not levels. A player who "finishes the
story" has ~88% of the progression system still ahead with **zero narrative pull** on any of
it. Stardew/Harvest Moon invert this: the long quest (Community Center; town/family arcs) is
the destination and skills rise *incidentally* on the way. Here, after ~2 seasons the story
hands the valley over and the skill grind becomes the whole game — which is exactly the
"incentivizes skill progression too much" complaint.

**P2. Rabbit-holing is possible because breadth is only gated at tools.** The multi-resource
tool gates work (owner endorses them), but they're the *only* structural breadth pressure.
Nothing stops a player grinding one skill to 99 while the rest sit at 10 — no content asks
for breadth after total-60, and mastery perks reward depth in place. The 86–99 tail of every
skill "pays nothing" (a three-audit-old finding) precisely because no system upstream ever
asks for those levels.

**P3. No combat means the world has a content ceiling.** Every venue is a gather loop; every
new area must invent a new gather verb (star-gleaning, milk round) to justify itself. The
mine's back half is a "49-level desert" partly because rocks are the only thing that can live
there. A combat layer is the genre's proven engine for: danger-tiered zones, gear ladders
that consume the whole crafting economy, expedition pacing, and boss-shaped story beats.

## 4. Assets v4 inherits (don't rebuild these)

1. **The design bible already specifies cozy combat** — `GAME_DESIGN_PRINCIPLES.md` §6, an
   "expedition system, not a combat system": loot feeds other loops, dual risk clock,
   bankable checkpoints, forgiving knockout, no forced combat, opt-up difficulty, gear
   routed through non-combat verbs. Written before combat was green-lit; v4 builds to it.
2. **`GAME_SCOPE.md` always reserved combat** as a possible post-1.0 optional skill
   ("Slayer-lite cave layer"). This is a cheque being cashed, not a pivot.
3. **The Guild of Nine Crafts has 9 wings but only 5 skills** — Hearthcraft, Smithing,
   Foraging, Ranching are wings without ladders. The fiction has room for new skills built in.
4. **The Pledge Ledger + wing machinery** are a ready-made *bundle* system (multi-resource,
   partial-deposit, celebration-per-beat) — the exact skeleton a Community-Center-style long
   quest needs.
5. **Planted, unspent story hooks:** Marrow Point (permanently off-map), the Guild's
   eleven-year darkness (told, never fully explained), the founding star in the ridge
   crater, the mine below the deepest lift stop.
6. **The cozy contract survives combat.** "Nothing is ever taken" (AGENTS.md, amended
   2026-07-18) — knockouts, not deaths; the home valley stays hazard-free.

## 5. What "done" looks like today (end-game)

After both acts: grind 5×99, complete the Collection, 5 Legendaries, full quest book, all
restorations, Star tool set, monuments, marriage, annual festivals. **All accumulation, no
narrative.** That open end-game is v4's canvas.
