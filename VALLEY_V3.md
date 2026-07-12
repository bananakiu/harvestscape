# Valley v3 — the world split & the story thread

*Plan for the owner's deferred 2026-07-12 items, green-lit 2026-07-13 (DEVLOG). Two releases.*

## v3.0.0 "The Valley Opens" — the world split

**The problem:** one 60×46 map holds the farm, the whole town, the mine mouth, and the beach
path. It reads small because it *is* small — everything is a twenty-second walk, and "town"
is three doors on the east edge of your own field.

**The shape:**
- **The farm becomes pure farm.** Town buildings, the mine entrance, and the beach path leave
  the farm map. What they leave behind becomes open land (more farmable space — a feature).
  Kept on the farm: cottage/coop/barn, the starter plot, both ponds (Elias still fishes the
  west one), the southwest woods + Grove path, the meadow, a modest ore patch on the north
  edge (the day-1 mining loop must survive), campfire/shipbin/memorial.
- **The village is its own, larger place** (`village` map, 40×28): a plaza with the fountain,
  Tom's store + noticeboard, Maya's house, the Guild hall, two ambient neighbour houses,
  lamps, benches, flowerbeds. **The mine hangs off the village's north ridge and the beach
  off its south path** — town is the hub, as in every good farm-life game.
- **A road links them:** farm east edge ⇄ village west edge (auto-warp both ways, signed).
- **Rowan's projects rewire:** the Town Fountain restores the *village* fountain; the Coast
  Boardwalk improves the *village→beach* path; the Minecart Line now runs **farm ⇄ village** —
  a fast-travel reward that finally means something at this distance.
- **NPC daylight:** Maya and Pip stroll the village plaza (they used to stand in your field);
  Tom keeps his counter, Rowan the Guild, Bram the coast. Day-1 arrival (Maya at your gate)
  and post-Act-II Elias (farm pond) unchanged.

**Save migration (the risky part, done conservatively):** `state.farm` persists tiles+objects,
so old saves have the town baked in. On load, if the farm predates the split (no village warp),
the layout regenerates and the player's own things carry over: all crops (their tiles re-tilled/
re-watered), every tilled/watered field tile, and player-placed orchard trees & hives — re-placed
at their exact coordinates (valid by construction: you could never plant inside the old town, and
every kept landmark stays at its old coordinates). Nothing the player made is lost — the cozy
contract, applied to a map.

## v3.1.0 "The Thread" — the story shines through

Three mechanisms, all cheap, all in-world (the act-aware journal from v2.2 was necessary but
not sufficient — the *world* has to point at the story):

1. **Quest markers.** The neighbour who currently matters — quest giver awaiting your report,
   or the person your story quest points at — gets a small gold ✦ bobbing overhead. The oldest,
   clearest trick in the genre; impossible to lose the thread while it's literally over
   someone's head.
2. **Wings light with a bell.** Lighting a Guild wing is the story's heartbeat, and it currently
   happens silently in a panel. Now: a banner, a warm bell, and one line from Rowan — a
   celebration per beat, nine beats to the finale.
3. **The morning names the mission.** The sleep card's last line points at the story when it's
   actionable ("✒ Rowan waits at the Guild"), so every day starts with the thread in hand.

## Explicitly still deferred
Per-NPC daily schedules with pathing, a second village district, interiors for the ambient
houses, and the art'd prologue (NPX §6) — the split makes room for all of them later.

**Land Deeds — farm expansion (owner-requested, 2026-07-13, explicitly "not right now").**
After the v3.2 shrink (60×46 → 46×36; the owner: "it's just too big… a lot of empty space
because everything was moved around"), the farm should be able to *grow back* as a mechanic:
buy or fund adjacent parcels — say a south woodland acre, an east roadside field, a north
ridge extension — and the fence moves outward. Sketch: sold as deeds at Tom's or funded as
Rowan-style projects (gold + materials, built overnight); each deed appends a fixed band to
the farm map. Purely *additive* generation means no coordinate migration pain (the v3.2
lesson: shrinking needs per-item carry-over; growing needs none — new ground is just new).
Starting tight is the setup: expansion only feels like a reward if the baseline isn't
already oversized. Pairs naturally with a late-game gold sink, which the economy audits keep
asking for.
