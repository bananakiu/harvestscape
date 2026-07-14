# GAME BALANCE PRINCIPLES — Balancing gold, XP & progression

*The distilled, evidence-anchored companion to `GAME_DESIGN_PRINCIPLES.md`. Every rule below is a scar from this game's own 35-release balancing history — cite the version, then trust the rule.*

## How to use this

Run *every* gold, XP, or progression change through the principles below **before** you touch a number. Each one carries a real anchor from this game's own history (version codename + what actually broke or worked), so the rule is never abstract — it is a scar. This doc is the balancing-specific deepening of `GAME_DESIGN_PRINCIPLES.md` §§3/4/5/9; it does not restate the bible, it operationalizes it. When a principle here and a fun-sounding number disagree, the principle wins — that is the whole point of writing them down.

**Concrete numbers to check a proposal against live in §10.** When a rule below says "below the trend" or "under the ladder," the actual ladders (wood, ore, gem, XP curve) and demand constants are in the appendix and inline where they bite — check the proposed price against the neighbours, don't eyeball it.

---

## 1. The genre lineage & our deliberate divergences

HarvestScape is **Stardew Valley's base loop × RuneScape's 1–99 skill grind, under a hard cozy contract.** Every balance decision inherits from three ancestors, and every place we *break* from them is deliberate — know which is which before you "fix" something back toward the source.

**What we inherit from Harvest Moon** — the time/stamina economy, the shipping bin, and *time freezes indoors and underground*. The mine's frozen clock is literally called "the Harvest Moon rule" (v2.9.0 *The Old Lift*): a focused venue shouldn't yank you to bed mid-task.

**What we inherit from Stardew Valley** — crop profitability curves, artisan/processing value-add (kegs, preserves jars), the lived day loop, seasonal crop gating, a *money-crop* archetype, the mine-elevator checkpoint, legendary one-time fish, fruit-tree/apiary passive income, and the Golden-Clock vanity sink.

**What we inherit from RuneScape** — the exponential XP curve toward 99, level-gated tools and content, skilling faucets and sinks, cross-skill dependency (mining feeds smithing feeds tools), renewable resource nodes, the gem ladder (Opal→Diamond plus the ultra-rare Onyx/Zenyte), willow-camp fast-XP-low-value training, and bird's-nest woodcutting drops.

**The divergences — never revert these by accident:**

- **Gold is *not* a universal key.** Stardew lets cash buy nearly every upgrade; we refuse it. Tool tiers demand multiple skills' outputs *and* an earned skill level (v2.9.2 *Tempered Tools*, v3.17.0 *The Miner's Ladder*).
- **Gems are a treat, not income.** RuneScape gems are real money; ours are deliberately de-monetized and made rare (v2.9.2, v3.16.0 *The Long Dark*).
- **The XP curve keeps RS's *shape* but ~1/17th its magnitude, and has no prestige dead zone.** A hollow 99 only works when thousands of players can see your cape; single-player has no one to admire it (v2.7.0 *A Fair Climb*, GDP §4.1).
- **Nothing is ever taken.** No crop death, no affection decay, no loss-on-failure, no forced-bedtime confiscation. Danger is *opt-in* and its only cost is foregone gain (v3.15.0 *The Deep Run*; GDP §1, §11 F8). Even a *balance recalibration* may never demote a save (v2.8.0 *Earned*).
- **Fixed sell prices are gone.** We replaced Stardew/Harvest Moon's flat market with a per-item demand curve (v2.0 *A Day Worth Living*).

If a change would pull us back toward the ancestor on any of these five lines, that is a red flag, not a convenience.

---

## 2. The gold economy — faucets, sinks, and keys

### 2.1 The founding failure: one dominant faucet + one universal key

**The single most important lesson this game has learned — and we only found it by *measuring the loop first.*** Name your economy's *dominant faucet* (the activity minting the most currency) and its *universal key* (the currency that unlocks everything). If one activity mints the money and that money buys every other system's progress, **every other skill collapses into decoration.** You cannot spot this by intuition; you spot it by measuring gold-per-hour per activity and asking what a single currency unlocks (the same measurement discipline that caught the starfruit printer in §2.5).

> *Anchor — the "busted gold" diagnosis (pre-v2.9):* at mine depth 6+, gems spawned at 0.018×depth ≈ **10.8% per tile — more common than ore's 10%** — each worth a uniform ~312g, so a casual floor cleared 1.5–3k gold; and gold alone bought tools, animals, saplings, and hives. The owner: *"it's mining and gold and then you unlock everything else… I have a gold axe that just cuts through every tree."* Mining trivially unlocked the whole game.

**The fix is to split the key, not just throttle the faucet.** Tool tiers moved from `gold + one ore` to `wood + ore + gold + a signature gem`, so every tier now needs Mining *and* Woodcutting progress, and the Rod's Pearl pulls in beachcombing (v2.9.2 *Tempered Tools*; verified exploit: 10,000g + 10 Copper Ore *alone* refused the axe upgrade). See `ECONOMY_REBALANCE.md` for the full "one faucet, one key" write-up.

### 2.2 A renewable venue per grind skill, supply-matched to its sinks

Every grind skill needs its **own effectively-infinite renewable venue**, sized to the sinks that will consume its output. A finite trickle cannot sustain a 1–99 skill.

> *Anchor — the Deep Grove (v2.9.1):* Woodcutting's ~44 farm trees (+5/night) were *"a puddle next to the mine's infinite ore"* — the wood-hungry tool costs of the rebalance had no real supply. The fix was a ~44×30 procedural forest of ~370 trees regenerating daily via `mapCache`, the same renewal rule as the mine. The owner asked for *"the equivalent of a mine where you could cut trees."*

But **a venue is not a loop** (v3.3.0 *The Wood Remembers*): the flat Grove still felt dead until it got depth rings, level-gated deadfall doors, waystone checkpoints, and rarity-by-depth. Ship the venue *and* its progression.

### 2.3 Cross-venue sinks — make each venue crave another's output

Design sinks to demand **several resource types from several activities at once**, so no skill self-funds its own progression. The grove's waystones want *ore*; the mine's lift stops want *wood* — the two deep venues feed each other (v2.9.0, v3.3.0). A checkpoint paid in its own currency just rebuilds the parallel treadmill.

### 2.4 Keep any single faucet from dominating — and price gathering *below* the money crop

When a drop becomes the fastest money-printer, cut **rate and unit value together, with several levers at once** (rarity + weighting + price), never one lever alone. And price secondary-gathering output *deliberately under* the farming core's gold-per-level trend (see §10).

> *Anchors:* Gems: spawn 0.018→0.010→0.002 (v2.9.2, v3.16.0), payout reweighted from uniform toward cheap gems, average value ~312g→~150g. Wood: the whole timber ladder sits under the money crops on purpose — Wood 4, Willow 11, Elder Wood 32, Heartwood 70, Silverwood 113 (all cut to ~⅓ in v3.20) — *"wood value must never outrun the money crops"* (`01-data.js`, the gem lesson). Willow's 11g is the point: the fast-XP camp trains the skill *without* printing money (v3.3.0 Phase 2). *v3.20 "Timber" went further — sell ÷3 and every construction/craft/upgrade wood requirement ×5 — because the renewable grove made chop-and-sell too easy a purse; wood became a construction material, not an income loop, ahead of the lumber/building system it feeds.*

### 2.5 Anti-glut / demand — tax sameness, not any one item

Break single-item money printers with a **per-item saturation sink**: price falls as you dump one good the same day (decay 0.95 per unit past a *value-scaled* free allowance — `clamp(round(280/base)+3, 3..14)`, so dearer goods glut sooner), a price floor of 0.35, and only *partial* overnight recovery (the sold count halves, never clears) so a night's sleep can't fully reset a glut.

> *Anchor — Tom's Demand (v2.0):* a grounding pass measured a starfruit monoculture as a passive printer — **dump-selling 50 starfruit ran ~3,125g/day, sleep-skipping optimal, the day had no reason to be lived.** The first cut was too weak (a drip-seller kept ~96% of price, and the comment was inverted); the retune — value-scaled allowance + overnight *halving* + floor 0.35 + blended sell-all pricing — dropped the **bulk-dumper to ~1,100g/day (65.9% of full price)** and the **drip-seller to ~79%.** **Verify a sink actually bites: model *both* sellers — the bulk-dumper and the patient drip-seller — not just one.**

Every new sellable auto-inherits this curve — including each processed product, whose *own* demand pool means 40 identical jams glut exactly like 40 starfruit (v3.7.0 *The Cellar*).

### 2.6 The money-crop concept, and capping side-activities below it

A money-crop is fine; a *passive* money-printer is not. Keep the farm the primary income loop and **cap every side venue below it.** Deep fish were trimmed (Coelacanth 2200→1800, Gulf Sturgeon 1500→1300) *"so a coast camp doesn't out-earn a tended farm"* (v3.10.0). Passive fruit trees pay a shade *more* than a starfruit tile *only in their own season* (≈62g/tile/day in season, nothing the other three) and a year-average well under a worked field (`01-data.js`).

**A low-attention stream may trade throughput for freedom — but it must earn *less* gold/day, not more.** Sheep's wool regrows every 3 days for 120g (`WOOL_REGROW=3`), deliberately under cows; the whole payoff is that it needs no daily raid, so the attention saved *is* the price of the lower yield (v3.8.0 *The Flock*). A no-tending stream that also out-earned the tended one would just be a strictly-better printer.

### 2.7 Sinks that scale, and big-ticket vanity

Every wealth tier needs a sink, and the top needs one **deliberately absurd, non-refundable pure-status buy.** Once functional needs are met, surplus coin must have somewhere to go — and *new high-value faucets widen the drought if unmatched.*

> *Anchor — the Décor catalogue (v3.13.0 *Homestead*):* nine cosmetic pieces from a 350g Flower Bed to a **300,000g Golden Statue of yourself**, never sellable or giftable (never enters `ITEM_SELL`) — you can move a statue but never refund it, so the coin is *genuinely* sunk. This closed §3.6, "the Interlocking Economy's oldest hole," after Rowan's ~20k of projects were funded and The Long Climb's faucets widened the gap. The lineage is Stardew's 10,000,000g Golden Clock.

Turn junk into a sink where you can: **Staircases** pack 25 worthless Stone (3g) into a 3-floor plunge (v3.15.0), giving the valley's most worthless rock a purpose *and* feeding the expedition loop.

---

## 3. XP & leveling

### 3.1 Keep RuneScape's curve *shape*, cut its magnitude ~17×, leave no dead zone

RS's canonical ÷4 curve reached ~13,000,000 XP at L99 with the back half ~130× the front — *"a little too grindy and punishing."* We kept the exponential idea and compressed it. L99 now sits near **782k XP (~17× gentler than RS)** (v2.7.0 *A Fair Climb* → v2.8.0 *Earned*). RS's L99/L50 ratio was ~129×; the abandoned v2.7 curve cut it to ~10×, and the current, deliberately-steeper v2.8 curve keeps it well above 10× but still far under RS — the compression is in the *magnitude*, not the shape.

### 3.2 Early levels must be *earned* — the v2.7 overshoot → v2.8 fix

**Tune for even reward *density* across the whole journey, not for gentleness.** This is the subtle one, and we got it wrong once in exactly the tempting direction.

> *Anchor:* v2.7 optimized "gentler than RS *everywhere*" (`inc(L)=26+0.30·(L−1)^2.4`, L99 ≈ 584k, ~22× gentler), which made the opening trivial — **a level every 1–3 actions to L10.** Those became *"junk levels"* that arrived before the player noticed them. v2.8 *Earned* re-steepened the start (`inc(L)=62+1.00·(L−1)^2.18`): L2 ≈ 3–4 actions (was ~1), L10 ≈ 10/level, ~145 actions/level at 80 — and reserved a completionist steepening for **95–99 only** (`×(1+0.28·(L−94))`; the final level alone ≈550 actions, 90→99 ≈35% of the total climb). The owner: *"the first few levels won't just feel like junk levels… a sort of mastery award in the end."*

The failure mode to fear is *not* "too grindy early" — it's "too cheap early." A level a new player can't feel didn't happen.

### 3.3 XP-per-action tuning, and separating the XP faucet from the gold faucet

Space gather tiers on **clean, memorable breakpoints** (a new ore every 10 Mining levels: stone 1, copper 10, iron 20, gold 30, cobalt 40, star metal 50) and bump the *earliest* tier's XP so the pre-first-unlock grind isn't a slog (stone XP 8→12) (v3.17.0 *The Miner's Ladder*).

Crucially, **separate the XP-efficient node from the gold-efficient one.** Willow is the fast-XP tree (a quick 8-HP chop) but priced cheap (11g — a level-30 tree worth less than level-18 Maple's 17g); Heartwood is the slow, rare, premium timber (70g) (v3.3.0 Phase 2; sells cut to ⅓ in v3.20). Leveling should not automatically print money — that collapses back into the §2.1 failure.

### 3.4 Keep XP sources honest — wood must not out-earn the money crops

A gathering skill that *also* out-earns farming breaks the intended hierarchy and re-inflates the economy the nerfs just tamed. This is why wood sits below the money-crop trend (§10) and Star Metal Shard was trimmed 600g→450g to seat *just under* Diamond (520g) — *"an ore must never out-value a common gem"* (v3.10.0 review; `01-data.js`). See §5 for the rarity-ladder version of this rule.

### 3.5 The grind must stay rewarding without trivializing

The tension the whole project tracks: **keep the RuneScape 1–99 layer as rich as the Stardew base.** The answer is content density (§4.1), not gentler numbers — never buy "rewarding" by cheapening the climb.

---

## 4. Progression gating & pacing

### 4.1 No skill may ceiling in its first quarter

Stud the **whole** 1–99 with new nouns and verbs — a crop, a fish, a vein, a recipe — roughly one per step. Passive stat perks cannot carry the back three-quarters of a grind.

> *Anchor — The Long Climb (v3.10.0) + Second Helpings (v3.11.0):* a 5-agent audit found every skill hit its content ceiling in the first quarter (Farming's last crop Starfruit L24, Mining's last vein Gold L28, Fishing L34, Cooking L40), then ground **60–75 levels on passive perks alone** — three-quarters of each climb unlocked nothing new. The fix filled the deserts: crops to Everbloom L90, fish to Coelacanth L85, ores (Cobalt L45, Star Metal L70 — later respaced to L40/L50 in v3.17), Silverwood L85, and 8 late recipes to the Grand Feast L90.

### 4.2 Level gates on tools AND venues; upgrades are achievements, not purchases

Gate power on the **skill the tool belongs to**, not only on hoardable materials — stockpiling ore must never buy a tool you haven't earned the level to swing. `TIER_LEVEL=[1,10,20,30,40]` enforces this in `buyTool` on top of the material + coin cost, shown as "needs Woodcutting 20" in red (v3.17.0). And put flagship unlocks on **memorable round numbers**, always showing the next tier a band before it's usable — desire ahead of ability (v3.16.0, v3.17.0).

### 4.3 Multi-skill capstones as achievements

Crown the endgame with rewards that demand **simultaneous mastery in several skills**, so no lone specialist can shortcut it. The Grand Feast (Cooking L90) needs Gulf Sturgeon + Yam + Everbloom — peaks in Fishing, Farming, and Cooking at once (v3.11.0). The Star Metal tool tier (power 5→7) consumes all four terminal deep resources in one recipe — 12,000g + 4 Star Metal Shard + 8 Cobalt + 40 Silverwood + 20 Heartwood (v3.12.0 *Star Metal*; premium wood ×5 in v3.20); v3.18.0 later added the required **Starstone**, so the top tool is now crowned by the rarest gem too — *"the mastery award in the end"* the owner asked for.

### 4.4 One honest limiter per venue

Pick **one** limiter for a venue and don't punish it with an unrelated second. The mine already spends **energy** per swing, so its **clock is frozen** — depth costs stamina, never a surprise bedtime (v2.9.0 *The Old Lift*, "the Harvest Moon rule"). Stacking a second limiter on top of the honest one reads as punishment, not challenge; when you add tension, add it as its own opt-in axis (§5.3), not as a tax on the existing one.

### 4.5 The ladder/lift as a pacing device — and never waste the trip

The Old Lift and the grove waystones are pacing scaffolding: free quick-exit (riding UP is always free), with restorable *down*-stops every 5 floors that gate how deep you can re-enter. But the iron rule is **a waystone must never waste the trip.**

> *Anchor — the Pledge Ledger (v3.3.0):* the owner rejected coupling the trek to the payment — *"it will be frustrating to reach a waypoint and not have the resources… then you do it all over again, and you don't even remember what resources you need."* The fix: touching a stone **banks its discovery permanently and free** on arrival; the cost is filled later in *partial deposits from anywhere* (including remotely from the Journal); a filled pledge wakes the stone instantly. The cost stays — *"you still have to earn it"* — only the wasted-trip tax is removed. A "come back tomorrow" is just the same frustration made smaller.

### 4.6 Seasonal & year pacing; smaller units over one big level

Stretch a climb by **spacing tiers across wide depth bands and shrinking each unit of content** so the player descends often and leans on frequent checkpoints. Mine floors were ~halved (34×22→24×16) and ore tiers respaced into ~10-floor bands (v3.16.0 *The Long Dark*). Seasonal gating (a second Winter crop at L90) keeps late unlocks tied to the year's rhythm. And open space is not automatically a feature — the farm was *shrunk* 60×46→46×36 when the vacated town ground played as *"dead walking"* (v3.2.0). Walkable density drives pacing.

---

## 5. Reward psychology & the cozy contract

### 5.1 Variable reward is a treat, not the economy — the gem faucet nerf

Randomness may only **modulate magnitude upward**; the player's plan cannot fail (GDP §5.2). So when a random drop becomes the economy, cut it hard until it's an *event* again — the lever is numeric, not philosophical.

> *Anchor:* gems ×5 rarer (spawn 0.010→0.002) with rarity now scaling to floor 20 instead of capping at floor 6 — *"a Diamond is an event again"* (v3.16.0). Values stay deliberately low across the whole Opal(60)→Topaz(100)→Sapphire(160)→Emerald(240)→Ruby(340)→Diamond(520) ladder (v3.18.0 *A Handful of Stars*). A deterministic outer loop (the crop grows in exactly N days) carries the game; the sparkle is a bonus-only layer priced so it can never *be* the game.

### 5.2 Rare drops need *uses*, not resale value

**Treasure must have uses, or it's just another faucet** (the gem lesson, applied with teeth). Canopy nests drop mostly seeds and berries — *the grove feeds the farm, not the wallet* — plus single-slot Charms (tiny passives like +5% Woodcutting XP), each worn **one at a time** as the power-creep governor and dropping **once per save** so a charm is an event, not a stack (v3.3.0 Phase 3). The rarest gem, the Starstone, is *required* to forge Star Metal tools — a use beyond resale — yet tuned so mining the 4 shards a tool already needs yields ~76% odds of one (avoid a chicken-and-egg where the required rare is an unreliable gate) (v3.18.0).

### 5.3 Never punish, never take — reintroduce tension only as opt-in and loss-free

The cozy contract denominates *all* stakes in **foregone gains, never confiscation** (GDP §1, §11 F8). When a cozy concession removes a tension, restore it as an **opt-in mode that touches nothing** — a new axis, not a second limiter on the old one (§4.4).

> *Anchor — the Deep Run (v3.15.0):* freezing mine time (v2.9) removed all expedition tension. The opt-in `state.deepRun` toggle lets time flow underground again — but at 2am the existing `doSleep` simply *fades you home with your entire haul.* The only cost is the depth you didn't reach. Even low energy signals through a warm amber bar, never a survival-red alarm — *low must not read as a danger aimed at the player* (v2.5.1 *Homely*).

### 5.4 A recalibration must never demote a save

Extend "nothing is ever taken" to *balance patches themselves.* When you re-tune a curve, translate stored progress onto the new table so a player's level can only **hold or rise.**

> *Anchor:* v2.7's gentler thresholds let veteran XP read as a *higher* level (old-L50 → L60) — a one-time gift. v2.8's slower early thresholds *would* have demoted saves, so `migrateSave` translates XP from the retained `XP_TABLE_V27` onto the new table preserving level *and* fraction — and runs **before** the generic field-backfill to dodge the "dead-code trap," firing no retroactive banner spam.

### 5.5 Visible mechanics, and the ethical line

**A mechanic the player can't perceive isn't a reward.** The invisible "cart checkpoint" was replaced with the physical Old Lift cage; the XP orb surfaces live progress toward the next level instead of pouring XP *"into the dark between panel-checks"* (v2.9.0). Milestone crossings (25/50/75/99) fire NPC recognition — the single-player substitute for a multiplayer cape (v2.6.0 *Journeyman*). And the ethical line is firm: same mechanic + aligned incentives = juice; diverged = dark pattern. **No real money, login streaks, expiring rewards, or variance-as-punishment on any random loop.** Odds are inspectable, rare drops get bad-luck floors, the plan always succeeds (GDP §5.2).

### 5.6 Give a slow climb a ceiling worth chasing

A slowly-accumulating friendship or affinity stat reads as **dead state** unless the top of the track pays out a rare premium. Don't let the number climb toward nothing.

> *Anchor — Prize Fleece (v3.8.0 *The Flock*):* the +8-per-shear friendship climb (~40 days on the 3-day cadence) was dead state until a cherished sheep (friendship ≥180) grew a 220g Prize Fleece on a 50% shear roll — its own sprite and Collection slot, mirroring the Large Milk/Egg tier. The slow grind now has a destination; without the ceiling drop it was just a number ticking up with no payoff.

---

## 6. Tuning heuristics — numeric rules of thumb

Apply these directly to a proposed number:

- **Processed goods sell ≥ ~1.25× their ingredient value** — a chain that loses money punishes the player who engages with it (shipped as a real bug once: Berry Jam 240 < 2 Strawberries 340). But craft only from *player-gathered* inputs, never shop-bought staples — no buy-low-sell-high loop.
- **Passive/time-only value < active/attention value.** Machines (zero energy) sit *under* the kitchen's dishes (ingredients + attention): Keg 2.2×, Preserves Jar 1.6× — deliberately shy of the best dishes.
- **A no-tending stream earns less gold/day than its high-attention rival** — wool 120g/3 days sits under cows; the freedom from daily tending *is* the price of the lower yield.
- **Every product routes through its own demand pool** so bulk processing gluts like the raw crop — no infinite-money lever.
- **One honest limiter per venue** — the mine spends energy, so its clock is frozen; never stack a second unrelated limiter on the first.
- **Tier breakpoints on round numbers** — a new tier every 10 levels; flagship unlocks on the decades.
- **No side venue out-earns the farm** on a per-session basis; cap trophy fish/ore/gems accordingly.
- **Monotonic value ladder across item classes** — a common material must never out-sell a higher-class item (ore < gem; Star Metal Shard 450 < Diamond 520). Audit any new price against its neighbours (§10).
- **Passive income beats active only in a narrow window** and loses on the annual average (fruit tree ≈ 62g/tile/day *in season only*).
- **Curve steepening lives only at 95–99;** early levels ≈ 3–4 actions each, never 1.
- **Levels only rise or hold across a rebalance** — translate, never demote.
- **Rarity scales with depth/effort** and the frontier is always strictly richer than camping a known-safe spot — never let a low-risk location recycle into the optimum.

---

## 7. Balancing checklist — run before shipping

1. **What is the dominant faucet, and what is the universal key?** Measure gold/hour per activity first; if one activity feeds one currency that unlocks everything, split the key (§2.1).
2. **Does this reward feed something downstream?** Every reward must be an *input*. Ship the sink in the same release as the resource (§8, the dead-currency faucet).
3. **Is there a renewable venue sized to the new sink's demand?** (§2.2)
4. **Does any new sellable have its own demand cap?** (§2.5)
5. **Does this out-earn the farm, or out-value its rarity neighbours?** Cap it; preserve the ladder (§2.6, §6).
6. **Where does this sit on the XP curve — does it fill a desert or pile onto a crowded band?** (§4.1)
7. **Is the gate the *skill*, not just materials or coin?** (§4.2)
8. **Does this venue keep exactly one honest limiter, or did you stack a second?** (§4.4)
9. **Can arriving under-resourced waste a trip?** Decouple discovery from payment (§4.5).
10. **Could a player perceive this mechanic?** If not, make it visible (§5.5).
11. **Does any save get demoted, any crop die, anything get taken?** If yes, stop — the cozy contract forbids it (§5.3, §5.4).
12. **Did you model *both* the bulk-dumper and the drip-seller — and verify the sink actually bites?** (§2.5)

---

## 8. Balance-specific failure modes — the graveyard checklist

Each entry names the trap and points back to the body rule that governs it.

- **The grind wall** — an XP curve so steep the back half dominates the whole climb (RS's ÷4 curve; killed v2.7). → §3.1
- **The junk-level opening** — early levels so cheap they arrive before the player notices (v2.7's over-correction; fixed v2.8). → §3.2
- **The faucet blowout** — a high-frequency drop that becomes the primary money source and trivializes every upgrade (gems pre-v2.9/v3.16). → §2.4, §5.1
- **The universal key** — one currency that buys all progression, flattening every other skill into decoration (gold pre-v2.9.2). → §2.1
- **The dead currency / pure faucet** — a resource nothing downstream consumes (Cobalt/Star Metal Shard/Silverwood/Heartwood before v3.12). → §4.3
- **The trivializing purchase** — power bought with hoarded materials and no earned skill (the gold axe; closed by `TIER_LEVEL`, v3.17). → §4.2
- **The glut / monocrop printer** — one item dump-sold for passive infinite money (starfruit pre-v2.0; the weak first Demand cut). → §2.5
- **The stacked limiter** — a second, unrelated constraint punishing the venue's honest one (surprise bedtime on the energy-limited mine; fixed v2.9). → §4.4
- **The sink drought** — surplus coin with nowhere to go once finite projects are funded (closed by Décor, v3.13). → §2.7
- **The dead zone** — 60–75 levels of a 1–99 skill that unlock nothing new (all four skills pre-v3.10). → §4.1
- **The dead-state grind** — a slow friendship/affinity climb with no ceiling payoff (sheep friendship pre-v3.8). → §5.6
- **The wasted trip** — a costly journey coupled to an all-or-nothing on-the-spot payment (pre-Pledge-Ledger). → §4.5
- **The unreachable ceiling** — an unbounded difficulty curve making top content mathematically impossible (fish above ~L36; clamped `DIFF_MAX=1.20`). → §6
- **The early wall** — a node the player can't yet harvest blocking an early floor (fixed by stone-heavy shallow floors, v3.16/v3.17). → §4.2
- **The invisible mechanic** — a benefit the player never perceives (the silent cart checkpoint). → §5.5
- **The imported stress** — crop death, deadlines, or loss-on-failure smuggled in for "challenge" (genre failure F8; forbidden). → §5.3

---

## 9. Timeline of major rebalances — one lesson each

- **v1.0** — initial build. *Lesson: a farm sim is a faucet machine; sinks come later and never stop being needed.* → §2.7
- **v1.4–v2.0 *A Day Worth Living*** — measured the loop; found sleep-skip optimal and starfruit a ~3,125g/day printer. Added Tom's Demand, the Hunt, orchards/apiaries, legendary fishing. *Lesson: measure the dominant strategy before you balance anything.* → §2.1, §2.5
- **v2.0 scorecard P1 retune** — the first Demand cut barely bit. *Lesson: verify a sink against both the drip-seller and the bulk-dumper.* → §2.5
- **v2.5.1 *Homely*** — low-energy bar amber, not red. *Lesson: a non-hazard must never use danger signalling.* → §5.3
- **v2.6.0 *Journeyman*** — Cooking got a real 1→40 curve; NPC milestone recognition. *Lesson: a skill that gates nothing is a flat grind; substitute social recognition for multiplayer prestige.* → §4.1, §5.5
- **v2.7.0 *A Fair Climb*** — replaced RS's punishing curve (L99 ≈ 584k, ~22× gentler). *Lesson: keep the curve's shape, cut its magnitude, leave no dead zone.* → §3.1
- **v2.8.0 *Earned*** — re-steepened the opening the previous release had cheapened (L99 ≈ 782k, ~17× gentler). *Lesson: tune for even density, not gentleness; early levels must be earned.* → §3.2
- **v2.9.0 *The Old Lift*** — froze mine time, made the checkpoint visible. *Lesson: one honest limiter per venue; make mechanics perceivable.* → §4.4, §5.5
- **v2.9.1 *The Deep Grove*** — gave Woodcutting a renewable "mine." *Lesson: every grind skill needs an infinite venue matched to its sinks.* → §2.2
- **v2.9.2 *Tempered Tools*** — split the universal key; nerfed gems on rate + weight + price. *Lesson: never let one faucet feed one key; throttle a runaway with several levers at once.* → §2.1, §2.4
- **v3.1.0 *The Thread* / v3.2.0 *The Near Fence*** — loud milestone celebrations; shrank the too-big farm. *Lesson: celebrate at the moment it happens; walkable density beats raw space.* → §4.6, §5.5
- **v3.3.0 *The Wood Remembers*** — Grove depth rings, the Pledge Ledger, single-slot charms. *Lesson: a venue is not a loop, and a checkpoint must never waste the trip.* → §2.2, §4.5, §5.2
- **v3.5.0 *Neighbours*** — quests rewritten into NPC voice, numbers kept visible. *Lesson: dress a gate in character, never hide its mechanics.* → §5.5
- **v3.7.0 *The Cellar*** — kegs and preserves jars under the kitchen, each with its own demand pool. *Lesson: passive value sits below active; every product gluts on its own.* → §6
- **v3.8.0 *The Flock*** — sheep as low-attention income; Prize Fleece ceiling; one-time shears. *Lesson: trade throughput for not needing daily tending; give slow grinds a ceiling worth chasing.* → §2.6, §5.6
- **v3.10.0 *The Long Climb* / v3.11.0 *Second Helpings*** — filled the four content deserts; cross-skill capstones. *Lesson: content must span the whole 1–99, not its first quarter.* → §4.1, §4.3
- **v3.12.0 *Star Metal*** — a 4th tool tier consuming every terminal deep resource. *Lesson: rewards must be inputs; ship the sink with the faucet.* → §4.3
- **v3.13.0 *Homestead*** — the Décor catalogue and its 300,000g statue. *Lesson: every wealth tier needs a sink; cap the top with a non-refundable status flex.* → §2.7
- **v3.14.0 *Warmer Shadows*** — the level-up banner previews the next unlock. *Lesson: surface the next goal at the exact dopamine moment.* → §5.5
- **v3.15.0 *The Deep Run*** — opt-in timed descent that keeps the whole haul. *Lesson: reintroduce tension only as opt-in and loss-free.* → §5.3
- **v3.16.0 *The Long Dark*** — halved floors, ~10-floor ore bands, gems ×5 rarer. *Lesson: make the descent a real climb; keep the money-gem an event.* → §4.6, §5.1
- **v3.17.0 *The Miner's Ladder*** — every-10-level ore ladder; skill-level gates on tools. *Lesson: gates must be memorable and earned, not just affordable.* → §3.3, §4.2
- **v3.18.0 *A Handful of Stars*** — RuneScape gem ladder + the required-but-reliable Starstone. *Lesson: model rarity on a shape players recognize; tie the rarest drop to the finest gear without a chicken-and-egg.* → §5.1, §5.2

---

## 10. Appendix: reference numbers

*The numbers of record every "trend" and "ladder" reference in this doc checks against — the g-per-level curve, the GEM_SELL / ORES / wood ladders, and Tom's Demand constants. Audit a proposed price against its neighbours here.*

*HarvestScape balance snapshot — v3.18.0 "A Handful of Stars" (version code 55). All values pulled directly from `game/js/01-data.js`, `00-core.js`, `08-actions.js`, `13-content.js`.*

### 1. XP / level curve (1–99)

Per-level cost (`00-core.js`), summed into `XP_TABLE[L]` = total XP to reach level L:

```
inc(L) = 62 + 1.00 * (L-1)^2.18          for L = 2..99
if L >= 95:  inc *= 1 + 0.28*(L-94)       // only the last 5 levels steepen ("mastery crown")
XP_TABLE[L] = XP_TABLE[L-1] + round(inc)
levelFor(xp): highest L with XP_TABLE[L] <= xp   (capped 99)
```

| Level | Total XP | XP for that level | Level | Total XP | XP for that level |
|---|---|---|---|---|---|
| 2 | 63 | 63 | 50 | 80,014 | 4,900 |
| 5 | 286 | 83 | 60 | 141,854 | 7,314 |
| 10 | 962 | 182 | 70 | 230,772 | 10,264 |
| 15 | 2,417 | 377 | 75 | 287,080 | 11,945 |
| 20 | 5,154 | 675 | 80 | 352,209 | 13,765 |
| 25 | 9,708 | 1,083 | 90 | 511,752 | 17,831 |
| 30 | 16,638 | 1,604 | 95 | 613,218 | 25,702 |
| 40 | 39,971 | 3,003 | **99** | **782,287** | **52,761** |

Total-level cap = 495 (99 × 5 skills). Mastery perks fire at 25 / 50 / 75 / 99 in each skill.

### 2. Crops

`g/cyc` = sell − seed (one harvest, single-harvest crops); `g/day` = g/cyc ÷ grow days.

| Crop | Lvl | Days | Seed | Sell | XP | Season(s) | g/cyc | g/day |
|---|---|---|---|---|---|---|---|---|
| Turnip | 1 | 2 | 20 | 35 | 12 | Spring | 15 | 7.5 |
| Potato | 3 | 3 | 40 | 70 | 20 | Spring | 30 | 10.0 |
| Wheat | 4 | 4 | 35 | 60 | 18 | Summer/Fall | 25 | 6.3 |
| Carrot | 6 | 3 | 60 | 100 | 26 | Spring/Fall | 40 | 13.3 |
| Blueberry | 8 | 4 | 90 | 150 | 36 | Summer | 60 | 15.0 |
| Strawberry | 10 | 4 | 100 | 170 | 38 | Spring/Summer | 70 | 17.5 |
| Tomato | 12 | 4 | 110 | 180 | 42 | Summer | 70 | 17.5 |
| Frostbloom | 14 | 6 | 180 | 330 | 66 | Winter | 150 | 25.0 |
| Corn | 16 | 5 | 150 | 250 | 52 | Summer/Fall | 100 | 20.0 |
| Cranberry | 18 | 5 | 170 | 280 | 60 | Fall | 110 | 22.0 |
| Pumpkin | 22 | 6 | 220 | 400 | 72 | Fall | 180 | 30.0 |
| Starfruit | 24 | 8 | 450 | 950 | 150 | Summer | 500 | 62.5 |
| Rhubarb | 30 | 5 | 300 | 420 | 90 | Spring | 120 | 24.0 |
| Melon | 40 | 7 | 400 | 640 | 125 | Summer | 240 | 34.3 |
| Artichoke | 52 | 6 | 480 | 760 | 145 | Fall | 280 | 46.7 |
| Grape | 64 | 7 | 560 | 900 | 180 | Summer/Fall | 340 | 48.6 |
| Yam | 78 | 8 | 720 | 1,200 | 235 | Fall | 480 | 60.0 |
| Everbloom | 90 | 9 | 900 | 1,500 | 300 | Winter | 600 | 66.7 |

Trend: g/day rises ~7→67 across the curve; **Starfruit (62.5) is the deliberate mid-game peak** and the late crops (added in v3.10) sit on the g/level line but are held in check by long grow times. Fruit trees are tuned to ~62 g/tile/day in-season only (below a worked field year-average).

### 3. Trees (Woodcutting) & Ore veins (Mining)

| Tree | Lvl | HP | XP | Drop | Wood sell |
|---|---|---|---|---|---|
| Oak | 1 | 3 | 25 | Wood | 4 |
| Pine | 8 | 6 | 60 | Pine Wood | 9 |
| Maple | 18 | 11 | 115 | Maple Wood | 17 |
| Willow | 30 | 8 | 150 | Willow Wood | 11 |
| Elderwood | 45 | 16 | 260 | Elder Wood | 32 |
| Heartwood | 70 | 24 | 520 | Heartwood | 70 |
| Silverwood | 85 | 30 | 760 | Silverwood | 113 |

*Wood sell values cut to ~⅓ in v3.20 (the renewable grove made chop-and-sell too easy a purse); wood requirements ×5 across the construction/craft/upgrade sinks. Wood is now a construction material, not an income loop — its value is the XP and the timber you build with, not the coin.*

Trees drop `n:2` logs each (+1 with Clean Fell / Mining-50-equivalent perks). Wood prices sit **below** the g/level trend on purpose (must not out-earn crops).

| Ore | Lvl | HP | XP | Drop | Ore sell |
|---|---|---|---|---|---|
| Stone Rock | 1 | 2 | 12 | Stone | 3 |
| Copper Vein | 10 | 4 | 26 | Copper Ore | 30 |
| Iron Vein | 20 | 8 | 62 | Iron Ore | 68 |
| Gold Vein | 30 | 12 | 145 | Gold Ore | 165 |
| Cobalt Vein | 40 | 16 | 240 | Cobalt Ore | 300 |
| Star Metal Vein | 50 | 22 | 520 | Star Metal Shard | 450 |

Ore tier = every 10 Mining levels; Star Metal Shard (450) seats just under Diamond (520) so no ore out-values a common gem. Star Metal veins also drop a **Starstone at 30%**.

### 4. Fish

| Fish | Lvl | XP | Sell | Water |
|---|---|---|---|---|
| Sardine | 1 | 15 | 30 | pond+coast |
| Bass | 5 | 32 | 65 | pond+coast |
| Trout | 12 | 55 | 120 | pond |
| Salmon | 20 | 95 | 240 | coast |
| Golden Koi | 32 | 190 | 620 | pond+coast |
| Moonperch | 40 | 220 | 780 | coast |
| Silvergill | 55 | 300 | 1,080 | coast |
| Gulf Sturgeon | 70 | 420 | 1,300 | coast |
| Coelacanth | 85 | 620 | 1,800 | coast |

Cooked fish sells at `floor(sell×1.75)`; edible energy = `22 + fish.lvl`. Legendary "Hunt" fish (caught once): Sunfleck 700 / Moonscale 800 / Frostjaw 850 / Whitefin 950 / Stormrider 1,200.

### 5. Tool tiers

5 tools (Hoe, Can, Axe, Pick, Rod). `TIER_POWER = [1, 2, 3, 5, 7]`. Tier gate is a level in **that tool's own skill** (`TIER_LEVEL = [1, 10, 20, 30, 40]`; Hoe/Can→Farming, Axe→Woodcutting, Pick→Mining, Rod→Fishing).

| Tier | Name | Skill lvl | Gold | Materials | Signature gem |
|---|---|---|---|---|---|
| 0 | Basic | 1 | — | — | — |
| 1 | Copper | 10 | 300 | 5 Copper Ore, 50 Wood | — |
| 2 | Iron | 20 | 1,200 | 5 Iron Ore, 50 Pine Wood | — |
| 3 | Gold | 30 | 5,000 | 5 Gold Ore, 50 Maple Wood | +1 per-tool gem† |
| 4 | Star Metal | 40 | 12,000 | 4 Star Metal Shard, 8 Cobalt Ore, 40 Silverwood, 20 Heartwood | +1 Starstone |

†Tier-3 (Gold) signature gems: Hoe→Opal, Can→Topaz, Axe→Emerald, Pick→Ruby, Rod→**Pearl** (beach forage). Every upgrade spends wood + ore + coin across skills by design.

### 6. Gems

Sell prices and drop weights (from ordinary gem rocks, via `pickGem`):

| Gem | Sell | Drop weight |
|---|---|---|
| Opal | 60 | 5.0 |
| Topaz | 100 | 3.5 |
| Sapphire | 160 | 2.2 |
| Emerald | 240 | 1.4 |
| Ruby | 340 | 0.8 |
| Diamond | 520 | 0.35 |
| **Starstone** | **1,800** | not in pool — only from Star Metal veins (30%) |
| Amethyst ("Gary") | 75 | not mined — keepsake only |

Total weight = 13.25 → Opal ≈ 37.7%, Diamond ≈ 2.6% of a gem-rock roll. Gemcutter (Mining 75) raises **gem-rock XP from 55 → 138**.

Non-sell gem uses: Gold-tier tools (§5), Starstone → Star Metal tool, Diamond → floor-20+ lift stops, Ruby → Heart Waystone (way9), Emerald ×2 → Town Fountain project, plus noticeboard/quest asks (Opal, Emerald).

### 7. The mine

Floors ~24×16 (halved in v3.16), cached per depth+day; **generated per-floor** with these coefficients (`genMine`, `depth` = current floor):

```
oreP = (0.10 + 0.003 * min(depth,20)) * oreBoost      // oreBoost = 1.5 storm, else 1
gemP = 0.002 * min(depth,20) * gemBoost               // gemBoost = 2.2 fog / 1.4 storm / 1
crystal-vs-gemrock split: crystal if rng < (0.30 + depth*0.008)
gem-node HP = 3 + floor(depth/2)                      // ore-vein HP from §3 table
props (rubble/minecart/beam) fill the next +0.05 band
```
Gems were made ×5 rarer in v3.16 (0.010 → 0.002 coefficient). Ore-table by depth band: `<5` stone-heavy+copper, `<10` +iron, `<15`, `<25` +gold, `<35` +cobalt, `<45` +star metal, `45+` deepest mix.

- **Energy per swing:** Pick 2, Axe 2, Hoe 2 (till), Can 1 (water), Rod 1 (cast). Free-swing masteries (Mining/Woodcutting 25) = 20% chance of no-energy swing.
- **Time is frozen underground** (no forced bedtime) unless a **Deep Run** is active (opt-in; time flows, dawn just sends you home with the haul).
- **Old Lift stops** (restore once, permanent; funded via pledge ledger from anywhere):

| Floor | Gold | Materials |
|---|---|---|
| 5 | 500 | 100 Wood, 5 Copper Ore |
| 10 | 1,500 | 75 Pine Wood, 5 Iron Ore |
| 15 | 3,000 | 50 Maple Wood, 5 Gold Ore |
| 20 | 6,000 | 60 Elder Wood, 10 Gold Ore, 1 Diamond |
| 20+n·5 | 6,000 × 2^(n) | (same as floor 20) |

- **Staircase (Deep Run):** 25 Stone → drops you 3 floors.

### 8. Energy & the day clock

- **Start state:** gold 500, energy 100/100, day 1, time 6:00.
- **Energy max = 100.** No passive drain — cost is **per-swing only** (§7). At 0 energy actions are blocked ("Too tired — eat (F) or sleep"). Low-energy warm haze begins under 25.
- **Day runs 6:00 → 26:00 (2 AM).** Clock advances at **60 game-minutes per 16 real seconds** (a full day ≈ 320 s / ~5.3 min of active real time; frozen in the timeless mine).
- **Sleep** (bed / auto at 26:00): energy → 100, time → 6:00, day++. Overnight also recovers Tom's demand halfway, respawns nodes, rolls weather.

### 9. Market anti-glut — Tom's Demand

```
DEMAND = { decay: 0.95, floor: 0.35, overnight: 0.5 }
free(item) = clamp( round(280 / sellPrice) + 3 , 3 , 14 )     // full-price units/day, value-scaled
mult(k)    = 1                         if k < free
           = max(0.35, 0.95^(k-free+1)) otherwise             // k = units already sold today
```
Per-item, per-day. Cheap goods get up to 14 free units, luxuries as few as 3. A night restores the glut only **halfway** (`overnight 0.5`), so drip-selling a hoard can't dodge it. Price never drops below 35% of base; nothing is confiscated.

### 10. Big-ticket gold sinks

**Décor catalogue** (Tom's; cosmetic, cap 40 pieces, liftable with axe):

| Piece | Cost | Piece | Cost |
|---|---|---|---|
| Flower Bed | 350 | Sundial | 2,600 |
| Garden Bench | 600 | Wishing Well | 4,000 |
| Stone Lantern | 900 | Grand Fountain | 8,000 |
| Bird Bath | 1,400 | **Golden Statue** | **300,000** |
| Topiary | 2,000 | | |

**Rowan's restoration projects** (~20k total): Minecart Line 8,000g (+20 Iron Ore, 150 Wood); Coast Boardwalk 5,000g (+200 Wood, 50 Pine Wood); Grove Arbor 4,000g (+50 Elder Wood, 75 Willow Wood); Town Fountain 3,000g (+10 Stone, 2 Emerald). *(Wood reqs ×5 in v3.20.)*

**Other durable sinks:** Keg 900g (+40 Pine Wood, 2 Iron Ore, ×2.2 wine mult); Preserves Jar 550g (+30 Wood, ×1.6 jam); Beehive 700g (max 4); Sheep 500g (max 4) + Shears 250g one-time; fruit-tree saplings 850–1,300g; deep-lift/waystone pledges (§6–7). Wine sells at `2.2×` raw crop, jam at `1.6×` — both deliberately below the kitchen's best dishes.

---

## 11. Sources & cross-links

- **`GAME_DESIGN_PRINCIPLES.md`** — the design bible; this doc is the balancing-specific deepening of its §§3 (economy), 4 (progression), 5 (reward psychology), 9. Do not duplicate it.
- **`ECONOMY_REBALANCE.md`** — the v2.9.x "one faucet, one key" diagnosis and the three-pillar fix.
- **`GROVE_DEPTHS.md`** — the depth-ring / waystone / Pledge-Ledger design record (shipped v3.3.0).
- **`DESIGN_SCORECARD.md`** — the latest graded audit against the principles.
- **`DEVLOG.md`** — the owner's near-verbatim playtest verdicts (the raw signal behind most anchors here).
- **`CHANGELOG.md`** — the full audit trail; every version codename cited above resolves there.
- Data of record: `game/js/01-data.js` (`TIER_COST`, `TIER_LEVEL`, `TIER_POWER`, `TOOL_SKILL`, `GEM_SELL`, `GEM_WEIGHTS`, `ORES`, `DEMAND`, `STAIR_STONE`), `game/js/00-core.js` (the XP curve `inc()` and `XP_TABLE_V27`), `game/js/08-actions.js` (award/sell logic), `game/js/13-content.js` (mine floor/ore/gem tables, Deep Run).