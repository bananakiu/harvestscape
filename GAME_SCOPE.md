# Harvestscape — Game Scope Document

*A cozy farming life-sim with deep, RuneScape-style skill and equipment progression.*

**Elevator pitch:** Stardew Valley's cozy life — farming, relationships, money-making, a gentle story — powered by RuneScape's progression engine: 1–99 skills with an exponential XP curve, level-gated content, and tiered equipment that makes every level-up feel like it unlocks something.

---

## 1. Vision & Design Pillars

1. **Cozy first.** 16-bit Stardew-like pixel art, warm palette, seasons, music, no fail states. Nothing punishes the player; the worst outcome is a wasted day.
2. **Number-go-up done right (the RuneScape DNA).** Every activity grants XP in a named skill. Levels are frequent early and aspirational late. The XP curve, level-gated unlocks, and tiered tools/equipment are the spine of the game.
3. **Many valid days.** Like both inspirations: any given day, the player chooses between farming, fishing, mining, socializing, questing, or decorating — and all of them advance *something* the player cares about.
4. **Progression you can see.** Better tools look better. A level-45 farm looks visibly richer than a level-10 farm. NPCs comment on your milestones.

**Anti-pillars (what this game is NOT):**
- Not combat-focused. Combat may exist later as one optional skill, not the core.
- No energy-bar anxiety or harsh time pressure (softer than early Stardew).
- No grind *walls* — RuneScape pacing, but tuned for a cozy single-player game (think 60–120 hours to "complete," not thousands).

---

## 2. Core Gameplay Loops

**Minute-to-minute:** Move around → use a tool on the world (hoe, water, chop, mine, fish) → get resources + XP → inventory fills, XP bars tick.

**Day loop:** Wake → tend crops → pick today's focus (skill grinding, gifts/social, quest, selling) → sleep → overnight: crops grow, shipped goods pay out, world resets nodes.

**Season loop (28 days):** Season-exclusive crops/fish, a festival per season, story beats, seasonal shop rotation.

**Long game:** Push skills toward 99 → unlock equipment tiers and areas → complete quest lines → max relationships/marriage → restore the town (story goal) → skill capes as endgame cosmetics.

---

## 3. Skills (the RuneScape layer)

All skills run **1–99** using the classic RuneScape XP formula (exponential; level 92 is half of 99). XP totals per level are shared across skills so players build intuition.

### Launch skills (8)

| Skill | Trained by | Sample unlocks |
|---|---|---|
| **Farming** | Planting, watering, harvesting | New crops every few levels, sprinklers (L15), giant crops (L40), greenhouse crops (L60) |
| **Fishing** | Catching fish (minigame) | New fish/waters, better rods, crab pots (L25), legendary fish (L70+) |
| **Mining** | Breaking rocks/ore | Ore tiers: copper→iron→silver→gold→mythril→star (L1/15/30/45/60/80), deeper mine floors |
| **Woodcutting** | Chopping trees | Tree tiers: oak→pine→maple→ancient, faster chopping, hardwood (L30) |
| **Cooking** | Cooking recipes | Recipes gated by level; higher-level dishes = better sell price & gift value |
| **Crafting** | Making furniture, fences, machines | Kegs (L20), quality sprinklers (L35), decor sets |
| **Smithing** | Smelting bars, forging/upgrading tools | Tool upgrades each ore tier; jewelry (gifts!) |
| **Foraging** | Gathering wild items | Rare spawns, berry bushes, truffle hunting (L50) |

*Post-launch candidates: Ranching (animals), Combat (optional cave layer), Alchemy.*

### Why this matters (design intent)
- Early levels come every few actions (RuneScape's hook); by L60+ a level is a session goal.
- **Level-gating replaces Stardew's tool-money-gating**: you can't mine gold because your Mining is 44, not because you lack cash — cash buys convenience, levels buy access.
- Total level (sum of all skills) is a visible prestige stat; NPCs and quests react to it.

---

## 4. Equipment Progression

Tools follow ore tiers and are **made, not just bought** (Smithing loop), with a purchase fallback at a markup:

**Basic → Copper → Iron → Silver → Gold → Mythril → Star**

Each tier: faster action, less energy, +yield chance, new capability (e.g., iron hoe tills 3 tiles, gold watering can waters 3×3). Tools require the matching skill level to *use*, closing the loop: Mining feeds Smithing feeds every other skill's tools.

Wearables: rings/amulets (crafted via Smithing) give small skill boosts — the "best-in-slot for your activity" dopamine without combat stats.

---

## 5. The Cozy Layer (Stardew/Harvest Moon DNA)

### Relationships
- **10–12 villagers** at launch, each with a schedule, 2 loved / 2 hated gift categories, and heart events (0–10 hearts).
- **4–6 romanceable** candidates, marriage at 10 hearts + story milestone, spouse helps on farm.
- Heart events are short scenes that reveal character depth (Stardew's strongest trick — keep them small but written well).
- NPCs react to skill milestones ("Heard you pulled a star-metal ore out of the deep mine!") — this is the crossover glue between the two halves of the game.

### Money-making
- Ship bin + shop selling; prices scale with item tier and cooked/crafted multipliers.
- Money buys convenience & cosmetics (buildings, decor, house upgrades) — **not** progression access (levels do that).
- Late-game money sinks: farm buildings, town restoration donations, cosmetic tool skins.

### Story
- **Setup:** You inherit a run-down farm on the edge of a fading valley town. The town's old guild hall — once home to the "Guild of Nine Crafts" — is shuttered.
- **Arc:** Restore the guild hall wing-by-wing (each wing = a skill-themed quest line with a villager mentor), culminating in reviving the valley's Grand Festival.
- **Quests:** RuneScape-style discrete quests with names, requirements (skill levels + hearts), multi-step objectives, and unique rewards (recipes, areas, cosmetics) — not radiant fetch quests.

### Vibe
- 16-bit pixel art, Stardew-adjacent proportions (16×16 base tiles, ~2× character height), warm saturated palette, seasonal recolors.
- Chill soundtrack per season; ambient sound (birds, rain, mine drips).
- Weather: sun/rain/storm/snow. Rain waters crops (cozy mercy rule).

---

## 6. World (launch scope)

- **The Farm** — player-owned, expandable.
- **Willowbrook Town** — shops (general, blacksmith, carpenter), villager homes, guild hall.
- **The Mine** — floors in 10-floor bands gated by Mining level.
- **The Forest** — woodcutting, foraging, forest pond.
- **The Coast** — fishing, beach forage, festival grounds.

---

## 7. Technical Plan

| Decision | Choice | Why |
|---|---|---|
| Engine | **Godot 4** (GDScript) | Free, great 2D/tilemap tooling, exports everywhere; best solo-dev fit for this genre |
| Art | 16×16 tiles, 32×32 characters; Aseprite | Stardew-like density, tractable for solo/commissioned art |
| Save | JSON save slots | Simple, debuggable |
| Platforms | PC first (Steam), then consider Switch/mobile | Genre's home platform |
| Prototype | **HTML5 canvas, zero dependencies** (this repo, `prototype/`) | Prove the loop-feel before committing to engine work |

---

## 8. Milestones

| Phase | Contents | Rough target |
|---|---|---|
| **M0 — Prototype** ✅ | Browser toy: move, farm, chop, mine, fish, cook, XP/levels with real RS curve, tool tiers, shop, one NPC with hearts, day cycle, save | now |
| **M1 — Vertical slice (Godot)** | One season, farm+town, 4 skills, 3 NPCs, real art for one biome, save/load, 1 quest line | ~3–4 months |
| **M2 — MVP / demo** | All 8 skills, all maps, 8 NPCs, year 1 story arc, festivals ×2, Steam demo | ~6–8 months after M1 |
| **M3 — Early Access / 1.0** | Full villager cast, marriage, guild hall arc complete, 4 festivals, endgame (skill capes, star tier) | scope from EA feedback |

**Scope guardrails:** cut animals, multiplayer, procedural mines, and combat from 1.0 before cutting skill depth or heart events — the two pillars are the skills engine and the cozy social layer; everything else is negotiable.

---

## 9. Open Questions (decide during M1)

- Energy system: none, soft (slower when tired), or classic bar? *(Prototype ships a gentle bar — playtest it.)*
- Day length & whether time pauses indoors.
- Do skills affect dialogue/romance options (RS-style quest reqs on heart events)?
- Combat: cut entirely, or one optional "Slayer-lite" cave skill post-1.0?
