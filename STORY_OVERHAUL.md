# The Story Overhaul — building the debt that makes the payoff land

*Green-lit 2026-07-13 (DEVLOG: "the story kind of falls flat"). Diagnosis: the content is good —
the structure never makes you care. Five causes: the Guild's darkness is a checklist, not a felt
absence; Act I never seeds a question; quests are systemic gates in costume; NPCs never talk to
each other; no midpoint, no authorship. Three releases. (Version numbers moved up from the pitch:
v3.2/v3.3 were taken by the Near Fence and Grove Depths while this was being approved.)*

## v3.4.0 "What the Valley Lost" — healing is physical, questions get planted
- **Every lit wing changes the world** (all laid by `genVillage`/`genGuild` reading `wingLit()`
  live — the village regenerates daily, so zero new persistence):
  Farming → market stall + produce crates by Tom's · Woodcutting → fresh timber along the west
  road · Mining → lantern posts up the mine path · Fishing → the day's catch barreled by the
  coast path · Cooking → a communal cook-fire on the plaza · Ranching → hay and a feed crate by
  the Wrens' · Foraging → berry bushes along the lanes · Smithing → an anvil rings outside the
  store · Hearthcraft → lanterns strung across the plaza. In the Guild, **a lantern kindles
  under each lit wing** — the hall warms with the count.
- **The valley starts visibly diminished:** rubble by the shuttered neighbour houses and
  "(shuttered)" on their signs until three wings are lit — the healing engine needs a "before."
- **Three planted hooks, paying off existing Act II lore (no new plot):**
  1. A **planked-shut door** in the Guild's back wall. Rowan, without looking up: "Not that one.
     Not yet." (After Act II it examines as closure.)
  2. **Maya's sketchbook** (existing 2-heart scene) gains a scribbled-out fourth figure at the
     festival table. "…Nobody. The pencil slipped."
  3. **Tom's unfinished name** — once, after meeting Rowan: "Him and El— …and everyone else,
     back then. Anyway! Coin for goods!"

## v3.5.0 "Neighbours" — the gates become people
A writing pass over the QUESTS array: same objectives underneath (zero balance change), reworded
as personal asks in the giver's voice, with completion messages that thank you like a neighbour
rather than paying you like a vending machine. "Reach total level 60" is Rowan needing to *see
the crafts alive in you* before the festival can be risked, in his words.

## v3.6.0 "The Lantern Test" — a midpoint with a flicker of doubt
At **5 of 9 wings**, entering the village triggers one evening scene: Rowan risks stringing the
old lanterns; half light; one gutters; nobody speaks for a beat. "Not yet. But nearer than I've
been in eleven years." Two test-lanterns stay up afterward (`lanternTest` flag) — the finale's
first physical foreshadow. *(The Star-Metal "which side lights first" choice from the pitch is
deferred — it wants a choice UI the dialogue system doesn't have yet; noted for the roadmap.)*
