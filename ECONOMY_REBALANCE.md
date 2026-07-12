# The Economy Rebalance — one faucet, one key

*Plan for the owner's 2026-07-12 playtest feedback (see [DEVLOG.md](DEVLOG.md)). Built as the
v2.9.x series. Read this before touching the economy again — the numbers interlock.*

## Diagnosis

The game has **one dominant faucet and one universal key**, measured in code:

- **Faucet:** at mine depth 6+, gem nodes spawn at `0.018 × 6 = 10.8%` per candidate tile —
  *more common than ore* (10%) — and every node pays a uniformly random gem worth 120–640g
  (avg ~312g; a Diamond is as likely as an Amethyst). A casual floor clears ~1.5–3k gold.
- **Key:** everything is bought with gold alone — tool tiers (`TIER_COST`: gold + one ore),
  chickens, cows, saplings, hives. So the mine's gold torrent unlocks *every other system*,
  and a gold axe (a purchase, not an achievement) trivializes woodcutting.

Secondary frictions the same playtest surfaced: the mine has no quick exit and no persistent
checkpoints ("climbing 10 flights isn't economical"), the day clock punishes being underground
at all, and woodcutting has no renewable venue — the farm's ~44 trees + 5/day regrowth are a
puddle next to the mine's infinite ore.

## The fix — three pillars, three releases

### 1. v2.9.0 "The Old Lift" — mine QoL (no balance risk, pure feel)
- **Time freezes underground** (Harvest Moon rule): `updateTime` doesn't advance the clock in
  the mine. Energy is the real limiter there and it still drains per swing. No more "in the
  thick of it and suddenly asleep."
- **The Old Lift** — a rusted lift shaft stands near the entry ladder of *every* floor:
  - **Going UP is always free**: the counterweight still works. Ride from any floor straight
    to the surface — the quick exit, everywhere.
  - **Going DOWN needs restored stops**: every 5th floor has a lift *stop* that can be
    restored **once, permanently** (saved in `state.liftStops`) by a resource dump made while
    standing at it. Restored stops become a floor picker at the lift (surface ⇄ any stop).
  - **Restoration costs scale and sink all three currencies** (wood + ore + gold — this is
    pillar 3's multi-skill economy showing up early):
    floor 5: 500g + 20 Wood + 5 Copper Ore · floor 10: 1,500g + 15 Pine Wood + 5 Iron Ore ·
    floor 15: 3,000g + 10 Maple Wood + 5 Gold Ore · floor 20: 6,000g + 20 Maple Wood +
    10 Gold Ore + 1 Diamond · each deeper stop ~doubles.
  - Replaces the old invisible "cart checkpoint" entry banking (which the owner never even
    perceived) — `enterMine` now always starts at floor 1, where the lift top offers the picker.

### 2. v2.9.1 "The Grove" — woodcutting's mine
A procedural forest map off the farm's western treeline, regenerating daily like the mine/beach:
oak everywhere, pine stands, maple groves deeper in, plus forage. Wood becomes renewable at
scale, giving the axe a *place* the way the pick has the mine — and giving pillar 3's wood
costs a farm. (Trees stay level-gated: WC 8 for pine, 18 for maple — the venue is generous,
the skill still gates the yield.)

### 3. v2.9.2 "Tempered Tools" — multi-resource upgrades + the gem nerf
- **Tool tiers cost wood + ore + gold, and the top tier a signature gem:**
  - Copper: 300g + 5 Copper Ore + 10 Wood
  - Iron: 1,200g + 5 Iron Ore + 10 Pine Wood
  - Gold: 5,000g + 5 Gold Ore + 10 Maple Wood + a per-tool keepsake gem
    (Hoe Amethyst · Can Topaz · Axe Emerald · Pick Ruby · Rod **Pearl**, from the beach)
  Every tier now requires Mining *and* Woodcutting progress (maple = WC 18); the Rod's Pearl
  pulls in beachcombing. A gold tool is an achievement across skills, not a purchase.
- **Gem faucet turned down to a treat:** spawn coefficient 0.018 → 0.010, and the payout is
  weighted (Amethyst 4 : Topaz 3 : Emerald 2 : Ruby 1.5 : Diamond 0.5) instead of uniform.
- **Gem prices trimmed** toward "nice bonus," not "economy": 75 / 110 / 190 / 260 / 480.
  Net: average gem value ~312g → ~150g, and roughly half as many gems drop — while gems gain
  *non-sell* uses (tier-3 tools, the deep lift stop), so finding one still feels great.

## Deliberately recorded, NOT built now
- **World split / bigger village** — owner: "you don't need to implement this." It's the
  natural v3 arc (farm map / village map / spread-out world), and the right home for…
- **Story visibility** — "the main mission doesn't shine through; lots of fetch quests." The
  act-aware tracker (v2.2) helps but isn't enough; the real fix is story beats that live in
  the world (scenes at the Guild, visible restoration progress) — which wants the bigger
  village. Deferred together, deliberately.

## Save compatibility
`state.liftStops` (array) via `migrateSave`; the grove regenerates daily (never saved);
`TIER_COST` is data-only (owned tools keep working). Nothing is taken from anyone.
