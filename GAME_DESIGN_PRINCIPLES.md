# GAME DESIGN PRINCIPLES — The Cozy Farming Game Bible

**Purpose:** This is the durable reference for what makes a great game in our target genre:
a Stardew Valley / Harvest Moon base, with the progression depth and whimsy of RuneScape
(OSRS), light combat in the Stardew mold, and an unbreakable cozy contract.
Any agent designing, building, or tuning a feature for this game should check the work
against this document. It is synthesized from primary research: GDC talks, designer
postmortems, ConcernedApe and Jagex interviews, the Project Horseshoe cozy-games report,
OSRS wiki data, and genre-wide criticism of failed Stardew-likes. Sources at the end.

**How to use it:** Sections 1–9 are principles. Section 10 is the set of quick design
tests — run every proposed feature through them. Section 11 is the anti-pattern list —
if a feature matches one, it needs a rewrite or a written justification.

---

## 1. THE NORTH STAR

> A cozy farming game is a machine for making ordinary days feel worth living.
> Every system exists to give the player a reason to want tomorrow.

Three commitments, in priority order:

1. **The cozy contract** (Project Horseshoe framework): the game evokes
   **Safety + Abundance + Softness**. No permanent loss, no fear, no imposed
   responsibility, no FOMO punishment, no harsh stimulus. Stakes are denominated
   only in *foregone gains*, never in confiscation. Break one leg and the others weaken.
2. **The interlocking economy is the product.** Not the feature list. Dozens of
   Stardew clones shipped the visible checklist (fishing minigame, seasons, hearts,
   mines) and failed because the loops didn't feed each other. The tuning — crop
   prices × growth times × tool costs × energy × XP gates — is invisible in a feature
   comparison and is where the actual game lives.
3. **Whimsy is cheap; deploy it everywhere.** OSRS proves tone is delivered almost
   entirely through text: examine descriptions, silly NPC names, absurd premises played
   straight, recurring motifs. The world may be silly; the systems must be numerically
   honest and deep. Players trust the numbers and love the jokes.

---

## 2. THE DAY LOOP — the game's heartbeat

**2.1 The day is a turn, and its scarcity is the engine.**
Stardew: 6:00am–2:00am at ~14m20s real time per day; a season ≈ 6.5h, a year ≈ 26h.
The sweet spot: long enough for morning chores + ONE self-chosen project, short enough
that "one more day" is always a defensible commitment. *Deliberate insufficiency* —
never enough hours to do everything — is what generates compulsion, not content volume.

**2.2 Forced session boundaries create the loop, they don't fight it.**
Mandatory sleep-to-progress converts play into discrete turns with a clean stop/continue
decision. Every day must end with progress visibly banked (shipping receipt, growth tick,
XP gained) AND a live desire for tomorrow (crop ripening, upgrade finishing, festival
coming). Send the player to bed mid-want — the Civilization "end the turn wanting
something" trick. The hard day-end is also an *ethical stopping cue*: the game closes
its own loop every 15–20 real minutes instead of running an endless treadmill.

**2.3 Day structure = ritual → project → wind-down.**
- **Ritual:** low-decision morning chores (water, pet, collect). These are "safe
  rituals" — repeated, known, hands-busy/mind-free tasks that are intrinsically
  pleasant on the 500th repetition. Protect them; don't optimize them away entirely.
- **Project:** the day's remaining time/energy goes to ONE self-chosen thing:
  mine expedition, fishing session, social day, festival.
- **Wind-down:** forced by the clock. The 2am deadline substitutes for difficulty.

**2.4 Two budgets that bind at different times.**
Energy binds early game (limits work per day); time binds forever (energy becomes
abundant via food/upgrades, the clock never grows). This handoff is correct — keep it.
Harvest Moon BtN's refinement: overwork penalties steal *tomorrow's morning* (wake late,
or collapse), making limit-pushing a real gamble rather than a UI slap. Time passing
only during "live" play (not in menus/shops) is a quietly important mercy.

**2.5 The player is always mid-progress on ≥3 timescales.**
~15-second loops (chop → wood), ~5-minute loops (clear a field, one mine floor),
day loops, season loops, multi-season infrastructure loops — each feeding the tier
above. Quitting must always feel like abandoning something *about to pay off*.

---

## 3. THE INTERLOCKING ECONOMY

**3.1 Every activity pays into at least one other activity.**
Canonical Stardew edges: crops→gold→tools→deeper mining; mining→ore→sprinklers→farming
scales; foraging→gifts→friendship→recipes→energy→longer mine runs; combat→loot→faster
mining. **The test: does the output of activity A change your capacity in activity B?**
A system that only pays its own currency is a disconnected minigame, not a loop.

**3.2 Skills must cross-feed (the OSRS lesson).**
Farming grows ingredients for Cooking; Fishing feeds Cooking; Mining feeds Smithing
feeds tools and weapons. Skills should read as one connected economy, not parallel
treadmills. Pick 2–3 **bridge objects** (e.g., monster drops → smithing; ore → tool
tiers; crops → dishes → combat buffs) rather than building parallel economies.

**3.3 Processing chains are the 30h→300h multiplier.**
Artisan chains (milk→cheese, fruit→wine→aged wine) convert "sell raw output" into a
logistics metagame. Rule: **processed goods must sell ≥ ~1.25× ingredient value** —
a chain that loses money punishes engagement (a real bug class; we shipped it once).

**3.4 Gift the first machine.**
First scarecrow / preserves jar / bee house arrive as level-up recipe unlocks or
literal gifts, never speculative purchases. New loops are sampled free, then invested in.

**3.5 Rewards must be inputs.**
Audit every reward: *"what does this let me START?"* Wood → coop → chickens → mayo
machine → artisan economy. A reward that terminates a chain is dead weight.

**3.6 The economy needs sinks at every wealth tier.**
Single-player farm sims are faucet machines — income scales superlinearly, early sinks
exhaust, and by year 2 money loses meaning. Required, in escalating tiers:
- capability purchases that change how you play (buildings, upgrades),
- consumable sinks feeding other loops (bombs/food/staircases for expeditions —
  combat as a gold sink is elegant),
- an infinite low-pressure cosmetic/decor catalogue,
- one deliberately absurd vanity sink (Stardew's 10,000,000g Golden Clock).
Every wealth tier needs one purchase that changes play + one pure-status purchase.

---

## 4. PROGRESSION — the RuneScape layer

**4.1 The XP curve shape: exponential, with the magnitude compressed.**
OSRS: each level costs ~10.4% more; total XP doubles every 7 levels; level 92 is half
of 99. The *shape* is right; the *scale* is multiplayer-dependent. OSRS's 85–99 dead
zone (levels as pure prestige) only works because thousands of other players can see
your cape. **Single-player rule: keep the curve, cut the magnitude to ~1/20th, and
never leave a dead zone.** A 1–50 curve with dense unlocks beats a 1–99 curve with
hollow tail levels.

**4.2 Unlock density is the whole game.**
Grind is meaningful only when the curve is studded with unlocks. OSRS spacing pattern:
- **Early levels (first third):** an unlock every 1–3 levels — new crop, fish, recipe,
  verb. Fast levels + dense unlocks = constant novelty during onboarding.
- **Middle (second third):** unlocks every ~5 levels, but each is a *tier jump*
  (willow→maple→yew; iron→steel→mithril). Round numbers carry flagship unlocks.
- **Late (final third):** sparse but *transformative* — area access, best-in-slot
  gear, method upgrades. Plus a mastery ceremony at cap (see 4.6).
**Unlocks must be new nouns and verbs** (a crop, a place, a machine, a mechanic) —
never bare stat increments. "+2% sell price" is hollow; "sprinkler recipe" changes
your daily routine.

**4.3 Always show the next unlock.**
The level-up moment: jingle + fireworks + "Congratulations — you can now X" popup that
also lists the NEXT unlock. The skill panel shows the full unlock table. The player
should always hold a concrete near-term goal ("2 more Fishing for river trout") inside
a long-term one. This is the "just one more level" engine and it is cheap to build.

**4.4 Quests are content, not chores.**
OSRS has 181 quests and zero "kill 10 boars." Every quest is a one-time handcrafted
adventure: absurd premise played straight (fetch ingredients for a cake the cook has
failed at for decades; become a monkey to infiltrate monkey civilization), 2–3 puzzle
types mixed per quest, bespoke dialogue. Structural rules:
- **Quest points** aggregate every quest into a visible meta-currency that gates
  capstone content — even trivial quests contribute.
- **The Barrows-gloves pattern:** the best rewards are earned once, kept forever, and
  used every day after — a permanent capability (top-tier tool, new transport, new
  mechanic) locked behind a long, silly, memorable chain. A daily-use item is a
  daily reminder of the adventure.
- Quest XP rewards double as an alternate leveling path past hated grinds.

**4.5 Layered optional completionist structures.**
Each layer re-monetizes existing content with a checklist and a modest reward, each
targeting a different player type. All optional; the sandbox never forces them:
- **Collection log / museum / almanac:** every crop, fish, mineral, artifact ever
  obtained, with visible empty slots and tiered ranks. An empty silhouette is a quest
  that never nags.
- **Achievement diaries (regional task lists):** tasks themed to a map region, 3–4
  tiers, rewards that are *convenience, not power* (a shortcut, a teleport, a discount
  in that region). Makes geography meaningful.
- **Challenge achievements:** replay existing content under constraints (speed, no
  damage, restricted gear) for QoL perks. Free content multiplication.

**4.6 Replace multiplayer prestige with NPC recognition.**
No other players exist to admire a 99. Substitute: villagers comment on your specific
milestones ("saw your new barn!", "the whole town's talking about that iridium melon"),
title changes, a mastery cape/trophy shown in cutscenes, a trophy room. Social
acknowledgment is the intrinsic patch for grind — when a mechanic feels grindy, the fix
is competence feedback, a choice, or social acknowledgment, NOT a bigger reward.

**4.7 The attention spectrum: offer ≥2 methods per goal.**
OSRS lets you fish semi-AFK or sweat tick-manipulation; both are viable, attention buys
~20–50% better rates, and the AFK method is never punished. Farming is literally the
AFK-est loop (plant, leave, return) — pair it with attentive options (fishing minigame,
combat) so the player mixes attention levels within one session at their own pace.

**4.8 Progress is permanent.**
Never decays, never resets, still counts next year. "Play 10 minutes or 10 hours, it
counts." This is the foundation of the efficiency-vs-enjoyment truce: both playstyles
win because all progress banks.

---

## 5. PSYCHOLOGY — why it works, and the ethical line

**5.1 Self-Determination Theory is the actual engine.**
Competence, autonomy, relatedness independently predict enjoyment and healthy long-term
engagement (Ryan/Rigby/Przybylski). Extrinsic rewards sustain short-term behavior only.
- **Competence:** visible mastery curves, immediate legible feedback per action
  (harvest pop, XP tick, profit ledger), friction that decreases as skill/tools grow
  so mastery is *felt as speed*.
- **Autonomy:** the genre's superpower. No forced order; multiple viable economies;
  the farm as a canvas. **Design test: can the player ignore any one pillar for a whole
  season and still progress?** If yes, autonomy is intact. This is why combat must be
  optional.
- **Relatedness:** works single-player via parasocial NPCs — gift preferences, heart
  events, NPCs that remember and react. Community-restoration meta-goals convert
  relatedness into progression.

**5.2 Reward schedules: the plan always succeeds; randomness only adds.**
Farming sims are wholesome slot machines. The line between wholesome and dark:
- **Deterministic outer loop** (crop grows in exactly N days, geode always opens,
  fish always eventually bites) — the player's plan cannot fail.
- **Variable-ratio sparkle on top, bonus-only** (quality stars, rare drops, treasure
  chests). **Variance modulates magnitude upward, never downward.** Randomness is
  never punishment.
- Bad-luck floors / pity timers on rare drops.
- Odds inspectable or intuitively learnable ("higher farming level = more gold stars,"
  stated on the level-up screen).
- The anticipation window (walking to the geode cracker, watching the bobber) is where
  the dopamine lives — stage it deliberately.
- Never: real money near any random loop, login streaks, expiring rewards,
  manufactured FOMO. Same mechanic + aligned incentives = juice; diverged = dark pattern.

**5.3 Goal ladders: always three goals visible.**
At any moment the player can name ≥3 active goals at different horizons without a wiki:
- **Today** (minutes): water, gift, hit floor 45. Delivered via quest board/mail.
- **This season** (hours): complete the fall bundle, steel axe, 4 hearts, save for coop.
  Delivered via bundle plaques with visibly part-filled slots (the Zeigarnik-effect
  machine — visible incomplete sets nag productively).
- **This year+** (tens of hours): restore the [community center equivalent],
  greenhouse, marriage, deep cavern. Delivered by the world itself — locked areas,
  NPC hints — not a log.
Cap *tracked* quests (~5) to avoid checklist paralysis. Long-horizon goals live in the
world, not in menus.

**5.4 Delays are redirection devices — when they redirect.**
The blacksmith holding your tool for 2 days shoves you into another pillar: forced
variety without forced content. A delay that merely requires spreadsheet-planning the
same activity is a tax. Test: does the delay push the player *laterally* into an
underused loop?

**5.5 Arcs need an announced endpoint and a completion ceremony.**
- A **soft evaluation, never a deadline**: Grandpa's Year-3 evaluation is a re-takeable
  report card. Creates an arc without a fail state.
- An explicit **perfection tracker** for the completionist tail, ending in a finale
  ceremony. Players need *permission to feel done*; post-endpoint rewards are
  celebratory, not a new treadmill. A cozy game should end warmly, not stretch hollowly.
- **Anti-hollowness test: every +1 to any number must change something observable** —
  new dialogue, recipe, visual, option. Prefer few chunky named unlocks over continuous
  scalar growth. The strongest progress feedback available is environmental: the farm
  itself transforming, the town reacting.

---

## 6. COMBAT — an expedition system, not a combat system

Stardew's combat is mechanically shallow (swing, knockback, food-as-potions) and it
works anyway, because all the design lives in the *run structure*:

**6.1 Combat is a resource run feeding the farm.**
You descend for ore/gems that feed sprinklers, tool upgrades, machines. Combat loot is
fuel for other loops, never its own parallel economy — so even combat-averse players
have a shopping list, and every run has a purpose.

**6.2 Dual risk clock: health AND time-of-day.**
The 2am deadline means even a flawless fighter faces push-your-luck every run: one more
floor or head home? Time pressure substitutes for enemy difficulty.

**6.3 Floors are push-your-luck units; checkpoints bank progress.**
Elevator checkpoints every ~5 floors convert a deep dungeon into bankable increments.
**Permanent macro-progress, disposable micro-runs — the single most load-bearing
coziness mechanic in the genre.** Death costs the current run, never the campaign.
Then offer an opt-in high-variance version (Skull Cavern pattern: no checkpoints,
gamble-shafts that trade HP for depth, luck-of-the-day modulating rewards so players
*schedule* risk — risk management as farm planning).

**6.4 Preparation is the real combat skill.**
The difference between a 10-floor and 100-floor day is bombs, food buffs, staircases
(craftable from bulk stone — a resource sink!), and picking a good day. The challenge
is mostly *solved on the farm*, keeping the farmer fantasy central.

**6.5 The cozy combat checklist:**
1. **Forgiving death:** never lose macro-progress. Pass out → wake safe, small capped
   fee. Give an escape verb (warp totem, ladder-out) so quitting a run is a priced
   choice, not a failure.
2. **No forced combat:** story and social progression completable with minimal
   fighting; combat-gated resources have slow alternate sources (shops, trades).
3. **Legibility:** telegraphed attacks, generous hitboxes, knockback for breathing
   room, few enemy types per zone with one gimmick each, healing = food you cooked.
4. **Short sessions:** a run fits inside one in-game day; any session length banks.
5. **Difficulty is opt-UP:** baseline gentle; danger is a place you walk to.

**6.6 Gear routes through non-combat verbs.**
Every combat-power increase passes through mining/smithing/cooking/befriending —
gear progression then feels like farming: planned, material, deterministic, with
variable-ratio sparkle only on rare drops. (Rune Factory's deeper integration —
monsters as tameable farmhands, one stamina pool for hoeing and sword swings, combat
as just another skill column — is the archetype if combat ever deepens.)

**6.7 Depth budget rule:** any loop that eats double-digit percent of playtime needs
its own progression ladder, or it should shrink. Combat at 40% of playtime with
one-button depth is a top-3 genre complaint.

---

## 7. WHIMSY & TONE — the RuneScape voice

- **Text is the delivery vehicle and it's free.** Examine/inspect text on *everything*,
  most of it deadpan jokes. Absurd NPC names. Item descriptions with personality.
  British-register humor: politeness colliding with absurdity, played straight.
- **Pick 2–3 recurring absurd motifs and commit hard** (OSRS: cabbages, gnomes,
  rubber chickens). Repetition turns a joke into a world. One-off jokes are spice;
  recurring motifs are lore.
- **Absurd premises, serious execution.** The quest about the cook's birthday cake has
  real puzzles. Whimsy never discounts mechanical honesty.
- **Holiday/seasonal events:** short (15–30 min), silly, cosmetic-only rewards,
  recurring annually in-game. Extremely cheap content with outsized affection; missing
  one never punishes (next year always comes).
- **The contrast IS the brand:** silly world, ruthless systems. Never let tone excuse
  shallow mechanics or let mechanics flatten the tone.

---

## 8. ART, AUDIO, FEEL — coding "cozy" (procedural/code-drawn constraints)

### 8.1 Visual coziness
- **Warm palette bias** (yellows/oranges/warm greens), soft contrast, no pure black or
  white in world art. High contrast reserved for interactables.
- **Hue-shifted ramps** — the #1 pro pixel-art rule, trivial in code:
  `shade(c) = darken ~20% + rotate hue toward blue 10–15°`; highlights rotate warm.
  Value-only ramps read muddy.
- **Limited palette discipline:** ~16–32 named colors in a constants array, 4–5 shade
  ramps per material family. Never inline ad-hoc hex. Consistency reads as style even
  when shapes are crude.
- **Lighting cycle is the #1 cozy engine:** full-screen tint lerped through keyframes —
  dawn pink-gold → neutral day → orange-purple dusk → deep blue night (never black) —
  with warm radial window/lamp glows punching through the cool night. Warm-light-in-
  cool-dark is *the* cozy image.
- **Idle life:** something on screen always gently moving, none of it demanding
  attention — chimney smoke, per-tile sine grass sway (`sin(t*2 + x*0.7)`), butterflies
  that flee, autumn leaves, fireflies, water ripples.
- **Seasonal recolor:** same tiles, swapped ramps. Cheapest "living world" signal.
- **Craft rules that survive programmer art:** silhouette-first (identifiable as a flat
  black shape at gameplay zoom); big head-to-body ratio, 1–2 px eyes, animation carries
  personality; dark-hue (not black) outlines on characters/interactables, none on
  terrain; 3–4 tile variants chosen by `hash(x,y)`; decorations clustered by noise
  threshold, not uniform-random scattered; shadows as dark ellipses under anything
  with height; dithering only in sky/water.

### 8.2 Juice — soft, springy, generous
Universal law: juice changes feel, never rules; every player action gets instant
visual + audio acknowledgment.
- **Over-invest in the item-get loop** (the emotional core of a farming game): item
  pops up in an arc, hangs at apex, vacuums to player with ease-in, sparkle + soft
  pluck on collect.
- Squash & stretch on jumps/presses/watered crops; trees shake on chop via decaying
  sine. Ease-out-back (slight overshoot) on everything that appears; never linear.
- Micro hit-pause 30–60 ms on tool impact (under ~80 ms; longer reads as combat).
  2–3 frame tool wind-up (anticipation frames beat resolution).
- Particles in small counts (3–8): leaf confetti, dirt puffs, sparkles on quality
  items, heart puffs on petting.
- Gold "+15" popups floating up and fading — warm colors, never red at the player.
- **Permanence:** footprints, stubble, tilled texture that persists — the world
  remembers your care (inherently cozy).
- Screen shake: 1–2 px, ~100 ms, big events only.
- **Movement forgiveness (Celeste's transferable gift):** ~100 ms input buffering,
  corner nudging, interaction hitboxes larger than sprites, 4–6 frame accel/decel
  ramps. Cozy = the game quietly conspires to make you succeed.
- **Forbidden juice** (breaks the contract): heavy/long shake, red damage flash, harsh
  full-screen flashes, strobing, klaxon failure sounds, shaking UI. Negative feedback
  is melodramatic, not menacing: gray-out, gentle sag, a soft low "womp."

### 8.3 Audio
- **Seasonal musical identity** via instrumentation/timbre (spring = major pentatonic,
  soft leads; winter = sparse, slow, reverberant). For WebAudio: season selects the
  oscillator/filter set and scale mood. Humanize: ±5 cents detune, loose timing.
- **Silence as rest:** music plays, then minutes of ambience-only. Constant music
  fatigues; the track's return feels like a gift.
- **Rain replaces music entirely.** Rain IS the soundtrack and the single strongest
  cozy audio signal (filtered white noise ~1–2 kHz lowpass + soft droplet blips).
  Rainy days = "no fieldwork pressure, stay in and be cozy."
- **Ambient bed always on, mixed low,** keyed to time/season: wind noise floor +
  daytime birdsong figures + night crickets. The bed, more than music, makes an empty
  screen feel alive.
- **Your most-repeated verb needs the most audio variation** (the Unpacking lesson):
  hoe/water/harvest get 3–4 variants + ±10% random pitch per trigger. Material-aware
  footsteps are the cheapest immersion multiplier in the game.
- UI sounds: woody, muffled, rounded. Item-get = 2–3 note ascending pentatonic chime.
  Error = single soft low bump. Never buzzers.

### 8.4 UI
Chunky wooden panels (bevel = 1–2 px light top-left edge, dark bottom-right),
parchment content areas, rounded corners, dark-brown-on-cream generous type,
typewriter text reveal (instantly skippable), click targets larger than visuals,
menus pause the world (checking inventory must cost nothing — safety), 150–250 ms
eased transitions, minimal persistent HUD (clock, money, toolbar, energy), no badges
or exclamation-point nagging.

### 8.5 Highest cozy-per-line-of-code (priority order)
1. Day/night tint + warm window lights
2. Rain (visuals + audio replacing music)
3. Item-get arc + sparkle + chime
4. Hue-shifted ramps + tile-variant hashing
5. Ambient bird/wind/cricket bed
6. Squash-stretch + eased tweens everywhere
7. Grass sway + chimney smoke + fleeing butterflies
8. Tool SFX pitch-randomization + material footsteps
9. Wooden bevel UI + soft UI sounds
10. Micro hit-pause + tree-shake on chop

---

## 9. PACING THE YEAR

- **Seasons = content rotation + soft deadline + palette cleanse.** Season-exclusive
  crops/fish/forage make each season a rolling content unlock; "will it mature by day
  28?" is the core planning puzzle (urgent, never punishing beyond opportunity cost);
  winter deliberately suspends farming to force rotation into other pillars — but
  winter must get a replacement identity (winter forage, ice fishing, social season),
  or it's 28 days of hollow game.
- **Festivals are calendar anchors:** 2–4 per season on fixed, publicly-visible dates.
  They're pattern-interrupts (normal loop suspended), whole-cast paydays for the
  social loop, and sources of once-a-year exclusives that reward calendar literacy
  without punishing absence.
- **The long-term goal board (Community Center pattern):** many small checkboxes →
  staged room-level payoffs → every reward is a capability that feeds back into loops
  (greenhouse, fast travel, new area). Cross-system demands so no specialist finishes
  it alone; something always within reach for any playstyle; naturally spans 1–2 years.
  Mis-tune warning: one unforeseeable item must never silently add a year (Stardew's
  Red Cabbage bug).
- **Narrative drip between milestones.** Story delivered only at quest turn-ins leaves
  dead air during grind gates ("the muddy middle"). Schedule ambient story beats —
  letters, overheard dialogue, small scenes — on calendar time, not just on quest
  completion.
- **A repeatable light daily objective** (quest board, "help wanted") gives directionless
  days a pull toward town — kept small so it proposes rather than assigns.

---

## 10. DESIGN TESTS — run every feature through these

1. **Interlock test:** does its output change the player's capacity in another system?
2. **Tomorrow test:** does it give the player a reason to want tomorrow specifically?
3. **Autonomy test:** can a player ignore it for a full season and still progress?
4. **Cozy contract test:** can the player lose something they already banked? (Must be no.)
5. **Variance direction test:** does randomness only ever improve the planned outcome?
6. **Unlock test:** is every threshold reward a new noun/verb, not a percentage?
7. **Next-goal test:** after engaging with it, can the player name their next goal in
   this system without a wiki?
8. **Chore test:** if it's friction, is its removal a visible purchasable dream, and
   does removal free time *into* other loops? What replaces the dream after removal?
9. **Attention test:** is there a lower-attention method for the same goal, honestly priced?
10. **Anti-hollowness test:** when its number goes +1, what does the player *see* change?
11. **Whimsy test:** does it have an examine text / name / description with personality?
12. **Ceremony test:** if it's a milestone, is it celebrated (jingle, popup, NPC
    comment), and does the popup show the next milestone?

---

## 11. FAILURE MODES — the Stardew-like graveyard checklist

- **F1. Cloned features, not the economy.** Five disconnected minigames sharing a save
  file. The tuning is the product.
- **F2. Friction removed without replacing the dream.** Sun Haven deleted energy and
  time pressure and became aimless — no chore means no automation fantasy, no reason
  for the day to end. When automation lands mid-game, NEW goal categories must be
  waiting (perfection %, endgame zone, decoration), or the midgame is where the game ends.
- **F3. Quest-log-ification.** Heavy to-do systems convert self-authored play into
  checklist execution — the game starts assigning your day. The game proposes; the
  player disposes. Stardew's restraint in quest volume is a feature.
- **F4. The midgame cliff.** Passive income + automation → decisions vanish → "press
  Sleep repeatedly." Ship the post-automation layer at launch, not as DLC.
- **F5. Content density too thin for the calendar.** If seasons rotate nothing but a
  palette, the calendar is dead. Every villager needs a schedule, birthday, heart
  events; every season changes shops/fish/forage/music.
- **F6. Undifferentiated identity.** A pure clone competes with a $15 game with 41M
  owners and thousands of mods. Our differentiators must stay loud: RuneScape-style
  skill depth + quest whimsy + collection-log completionism inside a cozy farm.
- **F7. A 40%-of-playtime system at 5% depth** (usually combat). Match depth budget to
  time share or shrink the time share.
- **F8. Importing stress for "challenge":** crop death, affection decay, hard deadlines,
  loss-on-failure. Cozy players want stakes — denominated only in foregone gains.
- **F9. Dead levels** (from OSRS analysis): >10 levels without an unlock, or unlocks
  that are only bigger numbers. The curve promises mastery; pay it out.
- **F10. Economy verbs that lose money** (cooking selling below ingredients): punishes
  engagement with the system that should reward it.

---

## 12. SOURCES

**Cozy framework & loops**
- Project Horseshoe 2017, "Coziness in Games" (Cook, Short, Howe et al.) — projecthorseshoe.com/reports/featured/ph17r3.htm (also Lostgarden "Cozy Games")
- Tanya X. Short, "Designing for Coziness" — gamedeveloper.com
- Pixelated Playgrounds, "Game Design Perspective: Stardew Valley" (nested reward cycles)
- In An Age, "Farm-Sim Annoyances" (genre-wide friction critique, midgame cliff)
- Shakeeb Zacky, "Stardew Valley: Player Engagement Done Right" (Medium)
- Kelsey Kinney, "Deceptively Simple Design" (Medium/The Startup)
- Game Developer, "Road to the IGF: ConcernedApe's Stardew Valley"; "Stardew Valley's Platform Shift"; "How Eric Barone coped with a four year dev cycle"
- Stardew Valley Wiki: Day Cycle, Seasons, The Mines, Skull Cavern, Perfection
- Harvest Moon Wiki: Stamina and Fatigue (FoMT/BtN)

**RuneScape**
- OSRS Wiki: Experience (curve formula), Quests, Collection Log, Achievement Diary, Efficiency, Barrows gloves, Examine, Holiday events, Farming level-up table
- Creative Cuts, "Why Old School RuneScape Is Still Growing After 12 Years" (Substack)
- RSBANDB, "All Puns in Game: RS' Love for Wordplay"
- Escapist, OSRS/Jagex interview; Michigan Daily, "Born on the Internet: Raised by RuneScape"

**Psychology & combat**
- Ryan, Rigby & Przybylski, "The Motivational Pull of Video Games: A Self-Determination Theory Approach" (Motivation & Emotion, 2006)
- Celia Hodent, "The Gamer's Brain Part 3: UX of Engagement" (GDC 2017)
- Daniel Cook (Lostgarden): "Loot Drop Tables"; "Value Chains" (faucet/sink economies)
- Game Developer: "Reward Schedules and When to Use Them"; "Cognitive Flow: The Psychology of Great Game Design"
- Machinations.io, "Game Economy Inflation"
- Sam Liberty, "Ethical Gamification: Designing for User Well-being"
- GMTK, "10 Game Design Lessons from 10 Years" (assist modes / opt-in difficulty)
- Moonlighter design analyses (Game Wisdom; Yadi on Medium); Rune Factory Wiki (RF4 monster taming)

**Art / audio / feel**
- Jonasson & Purho, "Juice It or Lose It" (talk); Jan Willem Nijman, "The Art of Screenshake"
- Maddy Thorson, "Celeste & Forgiveness" (Medium)
- Pedro Medeiros (saint11), pixel art tutorials — saint11.art
- ConcernedApe interviews on pixel art (Mental Nerd) and music (NPR; VI-Control)
- Jeff van Dyck, "Unpacking: The Fun Behind the Foley" (GDC 2022)
- Adam Robinson-Yu, "Crafting a Tiny Open World: A Short Hike Postmortem" (GDC 2020)
