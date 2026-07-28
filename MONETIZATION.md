# Inward Monetization — the ad slot points at our own brands

> **Status:** roadmap / not built. Owner direction call, 2026-07-28 (see `DEVLOG.md`).
> **Target build:** the mobile app (the Godot track), with a reduced web variant possible today.
> **Read first:** `GAME_DESIGN_PRINCIPLES.md` §the cozy contract, and `GAME_BALANCE_PRINCIPLES.md`.

---

## 1. The idea

Owner, near-verbatim:

> Convert all forms of traditional monetization and turn it inwards. Instead of watching an ad of a
> competitor or the ad network on iOS, we instead make them watch videos of H&Y — our latest
> products, or some crave-worthy video — to gain some boosters. Just to induce craving, or make them
> visit our store, or like our pages, like a video, share a video. It's a way to engage our audience,
> keep them in our brand, or even cross-brand.

The inversion in one line: **a rewarded-ad slot is a rented audience. We already own the audience —
so rent it to ourselves.**

Every rewarded-video placement in a normal free-to-play game does three things at once: it interrupts
the player, it hands attention to a third party (often a direct competitor, since ad networks sell to
whoever bids), and it returns a few cents. The same slot, pointed inward, does something strictly
better on all three counts — it can be made *pleasant* rather than tolerated, the attention goes to
our own catalogue, and the return is a warm lead instead of a fraction of a cent.

**This is not a way to make money from the game. It is a way to make the game pay for the brand.**
Worth stating plainly up front, because it changes every decision below: we are not optimising
impressions or eCPM, we are optimising *how a player feels about H&Y afterwards*. A player who
watched three of our videos and now finds the brand slightly annoying is a net loss, no matter what
the completion rate says.

---

## 2. Why this game in particular

The cozy contract — **nothing is ever taken from the player** — makes conventional monetization
structurally impossible here. No energy timers to sell, no revives, no loss to insure against, no
pay-to-skip because there is nothing painful to skip. Every standard free-to-play lever is a lever
this game deliberately removed.

That normally reads as a monetization problem. It is actually the precondition that makes inward
monetization work: because we have nothing to sell the player, **every offer we make can be pure
upside**, and the player can tell. An offer that costs nothing to refuse is one the audience doesn't
resent — which is exactly the state you want them in before showing them a product video.

The game already has the right shape for this, twice over:

- **The noticeboard** (`REQUESTS` / `todaysRequest` / `requestFilled`, `08-actions.js`) — one small
  optional ask per day, gone by dawn, costs nothing to ignore, pays 1.4× the counter and +25 relationship.
- **Tom's Warden's Salvage** (`todaysSalvage` / `buySalvage`, `15-warding.js`) — an explicit daily
  offer with **its own button**, deliberately never an auto-drain, per a standing owner note that
  interfaces must not silently spend what you carry.

Both are the pattern to copy: *daily, optional, explicit, expiring, and free to decline.*

---

## 3. The one inviolable rule

> **The baseline is the balanced game. Boosters are a bonus on top, and the game is never tuned
> around them.**

A player who engages with zero brand content must experience exactly the game described in
`GAME_BALANCE_PRINCIPLES.md` — same XP curve, same gold curve, same pacing. Boosters sit strictly
*above* that line.

The failure mode this prevents is the one that kills cozy games: tuning the baseline down so the
booster feels necessary. That converts "pure upside" into "a tax you can pay with attention", the
player feels the loss even if they can't name it, and the cozy contract is broken in spirit while
technically intact. **If a balance change is ever justified by "they can always watch a video for
it", the change is wrong.**

Practical test to apply to any proposed booster: *would the game be worse if this booster did not
exist?* If yes, it isn't a booster — it's a missing feature being sold back.

---

## 4. What a booster may be

Boosters must be **temporary, additive, and invisible in their absence**. Ranked by how well they fit:

| Booster | Shape | Existing anchor | Fit |
| --- | --- | --- | --- |
| **A spark** — a few hours of bonus XP in one skill | time-boxed multiplier | the v4.0 variety spark (`SPARK_CAP`, `sparkCap()`, `dailyXpActs`) | **best** — the mechanic already exists, is already understood, and is already framed as a gift |
| **A second wind** — a partial energy refill | one-shot, same day | `state.energy`, `spendEnergy` | strong — a late-afternoon top-up extends a good session, changes no curve |
| **A lucky day** — better forage/gem odds for the day | probability nudge | `pickGem`, forage rolls | strong — invisible if unused, and never *needed* |
| **A cosmetic** — a branded décor piece for the farm | permanent, purely vanity | `DECOR`, `DECOR_MAX` | **best for brand** — the player *keeps* the brand on their farm by choice, and it's the only reward that keeps working after the session |
| Gold | — | — | **no** — the economy is tuned tightly; direct gold is the fastest way to break it |
| XP grants | — | — | **no** — skipping the 1–99 grind is skipping the game |
| Anything that unlocks content | — | — | **absolutely not** — that is a paywall wearing a costume |

The cosmetic deserves emphasis. A tasteful branded object — a crate, a delivery cart, a hand-painted
sign — is the only reward on this list that **the player chooses to keep looking at**. Everything
else is a multiplier that expires; a décor piece is brand presence the player opted into and
arranged themselves. It is also the one reward that is completely impossible to abuse.

---

## 5. Where the offer appears

Cozy games are destroyed by interruption. The offer must never be a launch modal, never mid-action,
never a thing you dismiss to keep playing. It should be somewhere the player **walks to**.

Ranked:

1. **A village noticeboard / poster.** Diegetic, opt-in, and already the established idiom for
   "today's optional thing" — the player has been trained to check the board. A second board (or a
   second card on the existing one) reading *"a travelling merchant is showing something"* costs
   nothing to walk past.
2. **The sleep card** (`#sleepCard`, `scList`) — the day is over, the player is already reading a
   summary. One quiet line. Never a video *there*; just the offer.
3. **Tom's shelf** — the salvage-row pattern, with its own button.
4. **Never**: on launch, on death/knockout, on a failed action, or as a gate on anything.

---

## 6. The engagement ladder

Different actions, different weights, all daily-capped. **Critically, the weights are shaped by
platform policy, not just by value to us — see §7, which rules two rungs out.**

| Action | Reward weight | Cap | Notes |
| --- | --- | --- | --- |
| Watch a product video (~30s) | small | 1–2/day | the core rung; must be skippable after start with no penalty |
| Watch to completion | small bonus | — | additive on top, never the only way to get credit |
| Visit the store / a product page | medium | 1/day | verifiable via deep-link return; the strongest *commercial* signal |
| Follow / subscribe a channel | large | one-time | **policy-restricted — see §7** |
| Like / share a post | large | one-time | **policy-restricted — see §7** |
| Rate the game | — | — | **prohibited outright — never build this** |

Design note: the ladder should be **front-loaded and then flat**. The first engagement of the day
gives a good booster; the second gives noticeably less; there is no third. This is deliberate — the
goal is a pleasant daily touch, not a grind that trains the player to farm our own marketing.

---

## 7. Hard constraints — these change what is buildable

Stated plainly because they determine the shipping shape, not as a caveat to skim.

**Platform and network policy rules out part of the ladder.**
- **Incentivized ratings and reviews are prohibited** by both the App Store and Google Play. This
  rung must never be built, in any form, however it is dressed up.
- **Incentivized likes, follows and shares generally violate social platform terms** (Meta's platform
  terms are explicit about not incentivizing likes; others are similar). Treat the "like our page"
  and "share a video" rungs as **blocked pending legal review**, and design the system so those rungs
  can be switched off without a rebalance.
- **Incentivized video views of our own content, and incentivized store visits, are the safe core.**
  Build these two first; they are also the two with the clearest commercial value.

Policy text changes; the owner should confirm current wording before build, not before design.

**Audience age is a real exposure.** Cozy farming games skew young. Incentivized marketing aimed at
minors carries regulatory weight (COPPA in the US, GDPR-K in the EU) well beyond ordinary
advertising. This needs an explicit owner decision on target rating and whether under-13 accounts see
brand content at all. It is cheaper to decide now than to retrofit an age gate.

**This breaks the "no asset files" rule, and that has to be deliberate.** `AGENTS.md` is emphatic:
100% procedural, no asset files, all art is canvas code and all audio is WebAudio synthesis. Brand
video is the first non-procedural dependency the project would take. The carve-out is defensible —
**brand media is content, not game art; the game itself stays procedural** — but it must be written
down, or a future agent will read it as the rule having been broken by accident. Video must also be
streamed and lazily loaded, never bundled, so the game's cold-start stays instant.

**It targets the app build, not today's web build.** The premise ("instead of the ad network on iOS")
is a mobile-app frame, which puts this in the **Godot track**. The web build on Vercel could ship a
reduced version today — a poster that opens the store, or an embedded video — with no SDK at all.
That is worth doing first as a cheap read on whether players engage at all.

---

## 8. Cross-brand

The owner explicitly wants this to work across brands, so build it as a **roster from day one**, not
a single hardcoded advertiser. A data table in the `01-data.js` idiom:

```js
const BRANDS = [
  { id:"hy", name:"H&Y", cta:"…", media:[…], reward:"spark", weight:3 },
  // …
];
```

with per-brand weighting, a daily rotation seeded like `todaysRequest` does (`makeRng(seed + day)`,
so it's stable across a day and reloads), and per-brand frequency caps. That way a new product launch
is a data change, and one brand can be dialled up for a campaign without touching code.

**Roster to confirm with the owner.** The direction call named **H&Y** as the example and mentioned
**Nasalite** before correcting to it — unclear whether that is a sibling brand, a product line, or a
misspeak. Do not guess: get the actual roster, the product lines, and which of them are appropriate
for this audience before writing any copy.

---

## 9. Open questions for the owner

1. **The roster** — what are the brands, and is Nasalite one of them? (§8)
2. **Age rating and the under-13 question** — does this need an age gate? (§7)
3. **Do the social rungs matter enough to seek legal review**, or ship video + store visits only?
4. **What counts as success** — video completions, store click-throughs, or actual attributed sales?
   The answer changes what to build first, and it is the one number that should decide whether this
   ships at all.
5. **Tone.** Should the brand appear *diegetically* (a travelling merchant in the valley, in-world
   framing) or *honestly out-of-world* (a clearly-marked sponsor card)? The first is warmer; the
   second is more defensible with regulators and with players. Recommendation: **out-of-world and
   clearly marked**, because a cozy game's core asset is trust, and disguising marketing as story is
   the one thing that would spend it.

---

## 10. Sequencing

| Step | What | Why first |
| --- | --- | --- |
| **0** | Owner answers §9 Q1, Q2, Q5 | copy and legal shape depend on it |
| **1** | `BRANDS` data table + the daily-rotation picker | pure data, no UI, testable alone |
| **2** | The booster grants (spark / second wind / lucky day) as an internal debug command | proves the balance rule of §3 in isolation |
| **3** | The village poster + one card, web build, **store-visit rung only** | cheapest possible read on whether anyone engages |
| **4** | Video, streamed, web build | first real content test |
| **5** | Branded décor pieces | the highest-value brand reward, and the safest |
| **6** | Mobile/Godot: the full ladder minus whatever §7 rules out | only after 3–4 show engagement |

Do not build step 6 first. If the poster at step 3 gets ignored, everything above it is wasted, and
that is a two-day experiment rather than a two-month one.
