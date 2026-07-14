"use strict";
/* ============================================================
   01-data.js — all game content tables & writing.
   Colour palettes here drive the procedural pixel art.
   ============================================================ */

// ---- VERSION ----
// Single source of truth for the build. `name` is the semantic version shown to players;
// `code` is a monotonic integer (bump every release) used to detect "you've updated" and
// to gate save migrations. Keep this in lockstep with CHANGELOG.md and CHANGELOG (below).
const VERSION = { name: "3.17.0", code: 54, codename: "The Miner's Ladder", date: "2026-07-14" };

// ---- IN-GAME CHANGE LOG ----
// The player-readable mirror of CHANGELOG.md (the full audit trail lives there, with the
// design reasoning). Newest first. Shown in the "What's New" panel. When you cut a release:
// bump VERSION, add an entry here, and write the detailed version in CHANGELOG.md — same change.
const CHANGELOG = [
  { v:"3.17.0", code:54, date:"2026-07-14", name:"The Miner's Ladder", notes:[
    { t:"balance", s:"Tiering is clean and predictable now, every ten levels: mine stone from the start, copper at Mining 10, iron 20, gold 30, cobalt 40, star metal 50. There's plenty of stone to begin with — above ground on the ridge and on the early floors — so you've always something to swing at while you climb." },
    { t:"balance", s:"Tool upgrades are gated behind skill, not just materials. A shiny Copper Pick wants Mining 10; an Iron Axe wants Woodcutting 20; and so on up the ladder. Hoarding a pile of ore no longer buys you a tool you haven't earned the skill to swing — progression stays honest." },
  ]},
  { v:"3.16.0", code:53, date:"2026-07-14", name:"The Long Dark", notes:[
    { t:"balance", s:"The mine is a longer, more honest climb. Each floor is about half the size — quicker to work, so you lean on the checkpoints and keep descending. The ore tiers are spaced far deeper: iron waits until floor 5, gold until 15, cobalt 25, star metal 35 — so an un-minable vein never walls off floor 3, and reaching each new metal is a real climb you grind and level into." },
    { t:"balance", s:"Gems are five times rarer — they'd become a too-easy shortcut to money and cheap upgrades. They still grow more common the deeper you push (a deep run stays sparkly), but you can't farm them in the shallows anymore, so a Diamond is a genuine event and every tool upgrade is earned." },
  ]},
  { v:"3.15.0", code:52, date:"2026-07-14", name:"The Deep Run", notes:[
    { t:"new",   s:"The mine has a new mood, if you want it. At the Old Lift, begin a Deep Run: time starts flowing underground and you race the dark for the rich deep floors. Pack Staircases from your hoard of worthless Stone and plunge three floors at a time. And — this is the valley — nothing is ever lost: when dawn comes you simply wake at home with everything you found, having gone as deep as you dared. The default mine stays timeless; the run is always your choice." },
  ]},
  { v:"3.14.0", code:51, date:"2026-07-14", name:"Warmer Shadows", notes:[
    { t:"polish", s:"A gentle depth pass over all the pixel art: shadows now lean a touch cooler and bluer, highlights a touch warmer and more golden — the way good pixel art breathes, instead of just going darker and lighter." },
    { t:"polish", s:"When you level a skill and it happens not to unlock anything new that level, the banner now tells you what's next and when — so the climb always shows you where it's going." },
  ]},
  { v:"3.13.0", code:50, date:"2026-07-14", name:"Homestead", notes:[
    { t:"new",   s:"Make the farm yours. Tom's new Décor catalogue sells cosmetic pieces — flower beds, a garden bench, a bird bath, a sundial, a wishing well, a grand fountain — that you set down like a hive and lift again with the axe. At the top: a solid-gold statue of you for 300,000g, utterly pointless and utterly magnificent. Somewhere for a rich valley's coin to finally go." },
  ]},
  { v:"3.12.0", code:49, date:"2026-07-14", name:"Star Metal", notes:[
    { t:"new",   s:"A fourth and final tool tier: Star Metal. Forged at Tom's from the valley's deepest and rarest finds — Star Metal Shards and Cobalt from the deep floors, Silverwood and Heartwood from the grove's heart — it's the strongest, gentlest tool there is. Now the deep mine and the old grove finally make something, not just money." },
  ]},
  { v:"3.11.0", code:48, date:"2026-07-14", name:"Second Helpings", notes:[
    { t:"new",   s:"The kitchen keeps teaching you dishes all the way up — eight new recipes from Rhubarb Pie (Cooking 44) to the Grand Feast (Cooking 90), the crown dish that needs the valley's finest crop, catch, and a master's hand. They cook up The Long Climb's new harvest and deep-sea fish, so nothing you grow or land goes to waste." },
  ]},
  { v:"3.10.0", code:47, date:"2026-07-14", name:"The Long Climb", notes:[
    { t:"new",   s:"Every skill keeps giving you new things to find, all the way up. Farming gains six late crops (Rhubarb, Melon, Artichoke, Grape, Yam, and a winter Everbloom); the coast hides four deep-water fish for master anglers (up to the Coelacanth, a living fossil)." },
    { t:"new",   s:"The mine's deep floors now hold Cobalt and Star Metal veins, and the deepest grove ring grows Silverwood — so Mining and Woodcutting reward levels past where they used to run dry. Each new find feeds the Cellar, the Collection, gifts, and the market." },
  ]},
  { v:"3.9.0", code:46, date:"2026-07-14", name:"Plaza Life", notes:[
    { t:"new",   s:"The village square feels lived-in now: benches and flower planters to sit among, and Tom steps out of his store for a stretch around midday — a third face in the plaza beside Maya and Pip, with a lighter word or two if you stop to chat." },
  ]},
  { v:"3.8.0", code:45, date:"2026-07-14", name:"The Flock", notes:[
    { t:"new",   s:"Sheep join the barn (500g at Tom's, up to four). Buy a pair of shears (250g, once) and shear a full coat with E for Wool — a soft armful worth 120g. Coats regrow every few days, so a flock rewards a steady visit, not a daily raid." },
    { t:"new",   s:"Wool rejoins the Collection at last — it was held back for years because nothing could produce it. Now the sheep make it real, and the museum can be completed with it in." },
  ]},
  { v:"3.7.0", code:44, date:"2026-07-14", name:"The Cellar", notes:[
    { t:"new",   s:"The Cellar arrives: buy Kegs and Preserves Jars at Tom's, set them in your yard like hives, and give any crop or orchard fruit a second life — jam in two nights, wine in three. Every product sells under its own name, so the market can glut on each." },
    { t:"new",   s:"Machines load with one press — they take the best growable in your bag — and an axe lifts them (with their load returned) if you change your mind. Nothing is ever lost." },
    { t:"polish",s:"A game-feel pass rode along: a warm halo behind the level-up banner, menu buttons that press down under your click, and corner-nudging so you slip around obstacles instead of catching on them." },
  ]},
  { v:"3.6.0", code:43, date:"2026-07-13", name:"The Lantern Test", notes:[
    { t:"new",   s:"At five relit wings, the valley takes a breath: Rowan risks stringing the old lanterns across the plaza — and half the line lights. A taste of the festival, years early, with a flicker of doubt in it. The two that lit stay up." },
  ]},
  { v:"3.5.0", code:42, date:"2026-07-13", name:"Neighbours", notes:[
    { t:"change",s:"The valley's requests sound like the valley now — Rowan asks to see the crafts live in your hands, Tom wants to build you better iron, Bram wants you fishing beside him. Same tasks; real voices." },
  ]},
  { v:"3.4.0", code:41, date:"2026-07-13", name:"What the Valley Lost", notes:[
    { t:"new",   s:"Every Guild wing you relight now changes the village itself — a market stall appears, barrels of the day's catch, a cook-fire on the plaza, lanterns up the mine path… the valley visibly wakes as you work." },
    { t:"new",   s:"Until three wings are lit, the shuttered years still show: rubble by the neighbours' doors, and their signs say so." },
    { t:"new",   s:"Small questions have appeared, for those who look closely — a door in the Guild nailed shut with suspiciously new nails, a figure scribbled out of an old sketch, a name Tom doesn't finish saying." },
  ]},
  { v:"3.3.0", code:40, date:"2026-07-13", name:"The Wood Remembers", notes:[
    { t:"new",   s:"The Deep Grove goes DEEP now: nine rings of forest, each older than the last. A great deadfall seals every trail west — chop through it (the door pays you in wood and XP) and the way stays open till dawn." },
    { t:"new",   s:"Guild-era waystones stand on rings 1, 3, 6 and 9. Touch a dormant stone once and it remembers you forever — then fund its pledge from ANYWHERE, a little at a time, in the Journal's new ❖ Restorations page. A woken stone carries you between stones, free, always." },
    { t:"new",   s:"Three new trees fill the wood: Willow (30) for fast training, blue-grained Elderwood (45) for the deep works, and pale Heartwood (70), the rarest timber in the valley. Deeper rings grow rarer wood — and one golden ANCIENT tree per deep ring gives double timber, every day." },
    { t:"new",   s:"Nests fall from the canopy: seeds, saplings, and CHARMS — small trinkets you wear one at a time for a little extra luck. Somewhere in the wood, the old Forester's Band is still waiting." },
    { t:"change",s:"The Old Lift's stops now fund the same way as waystones: every 5th floor you've ever reached appears in ❖ Restorations, takes partial deposits from anywhere, and wakes the moment the pledge fills. Arriving short is never a wasted trip again." },
    { t:"new",   s:"Ring 9 holds the Heart of the Forest. It sleeps, for now." },
  ]},
  { v:"3.2.0", code:39, date:"2026-07-13", name:"The Near Fence", notes:[
    { t:"change",s:"The farm pulled its fence in — the empty ground the old town left behind is gone, and everything you use sits closer together. Same cottage, same plot, same woods and Green, just a shorter walk between them." },
    { t:"change",s:"Everything you'd planted and built came along: crops, worked soil, orchard trees, and hives keep their spots — and anything that stood beyond the new fence was moved, growth and honey intact, to the nearest open ground." },
    { t:"fix",   s:"Windows across the valley now glow in the right places after dark (some lit the wrong tiles, or not at all)." },
  ]},
  { v:"3.1.1", code:38, date:"2026-07-13", name:"Doors & Roads", notes:[
    { t:"fix",   s:"Stepping out of Tom's, the Aldermans', or the Guild now puts you back at their village door — not on the farm where the old town used to stand." },
    { t:"fix",   s:"The Old Mine's mouth moved to open ground on the village's northeast ridge — no more hiding behind the Guild's roof. Surfacing (ladder or lift) drops you right there." },
    { t:"change",s:"The village got a proper street plan: every door meets a path, the Guild's door is centred, and the Wrens' and the Harrows' finally have doors on a south lane. (Knock — nobody's home just yet.)" },
    { t:"fix",   s:"Map crossings (coast path, farm road, grove footpath) now catch you even if you hug the very edge of the map — no more sliding past the way through." },
    { t:"fix",   s:"The coast's exit door now stands where the village path drops you off, instead of behind the festival stage." },
  ]},
  { v:"3.1.0", code:37, date:"2026-07-13", name:"The Thread", notes:[
    { t:"new",   s:"A gold ✦ now floats over whoever the main story needs next — you can always see where the thread leads." },
    { t:"new",   s:"When a Guild wing lights, the valley celebrates: a banner, a word from Rowan, and the count of crafts relit. Nine beats to the festival." },
    { t:"new",   s:"Each morning's summary names the story's next step, so every day starts with the mission in hand." },
  ]},
  { v:"3.0.0", code:36, date:"2026-07-13", name:"The Valley Opens", notes:[
    { t:"new",   s:"The world grew: your farm is purely a farm now, and the east road leads to Willowbrook Village — a real plaza with the store, the Guild, your neighbours' houses, and lamps that glow at dusk." },
    { t:"new",   s:"The mine opens on the village's north ridge and the coast lies down its south path — the town is the valley's hub, the way it always should have been." },
    { t:"change",s:"Everything you've planted and built carries over exactly as it was — crops, fields, orchard trees, hives. The Minecart Line project now runs farm ⇄ village: real fast travel." },
  ]},
  { v:"2.9.2", code:35, date:"2026-07-13", name:"Tempered Tools", notes:[
    { t:"balance",s:"Tool upgrades now take wood AND ore AND coin — and a gold tool wants a signature gem set into the handle (the Rod's is a Pearl from the beach). An upgrade is earned across crafts now, not bought with mine money." },
    { t:"balance",s:"Gems are rarer and humbler-priced — a treat, not the economy. A Diamond is an event again. (They gained real uses too: top-tier tools and the deep lift stops.)" },
    { t:"new",   s:"XP orbs now line up side by side at the top of the screen when you're training several skills — one ring each, RuneScape-style." },
  ]},
  { v:"2.9.1", code:34, date:"2026-07-12", name:"The Deep Grove", notes:[
    { t:"new",   s:"A footpath through the farm's western treeline leads to the Deep Grove — a true forest that regrows overnight. Older wood grows deeper in, and there's forage along the way." },
  ]},
  { v:"2.9.0", code:33, date:"2026-07-12", name:"The Old Lift", notes:[
    { t:"new",   s:"The Guild's old lift stands beside every mine floor's ladder — riding up to the surface is always free, and every 5th floor's stop can be restored (wood, ore, and coin) to skip straight down, forever." },
    { t:"new",   s:"Time now stands still underground, like the old farming games — no more being yanked to bed mid-vein. Your energy is the mine's honest limit." },
    { t:"new",   s:"An XP orb appears by your energy bar while you train — a little ring that fills toward your next level, with your level on it." },
  ]},
  { v:"2.8.2", code:32, date:"2026-07-12", name:"Turned Earth", notes:[
    { t:"polish",s:"Tilled soil finally looks like soil — broken furrows and clods instead of what used to read as wooden decking. Watered earth darkens the same rows." },
  ]},
  { v:"2.8.1", code:31, date:"2026-07-12", name:"Lamplight", notes:[
    { t:"new",   s:"Every house in the valley now has windows — and after dark they glow, so the town looks lived-in from the fields." },
    { t:"polish",s:"The coast got a real shoreline: wet sand along the waterline, foam on the sea's edge, and grass creeping onto the dunes." },
    { t:"fix",   s:"The controls hint no longer clips off-screen on short windows, and the skills panel no longer claims a RuneScape XP curve." },
  ]},
  { v:"2.8.0", code:30, date:"2026-07-12", name:"Earned", notes:[
    { t:"change",s:"Levels are paced to be savored now — the first few take real work instead of arriving unnoticed, the climb stretches long and steady, and the final stretch is a true mastery award." },
    { t:"change",s:"Your existing skills keep exactly the levels you had — the recalibration converts your progress underneath, and nothing is ever taken." },
  ]},
  { v:"2.7.0", code:29, date:"2026-07-11", name:"A Fair Climb", notes:[
    { t:"change",s:"Skills level up on a new, kinder curve — quick and rewarding early, a real climb through the middle, and only the last few levels a true completionist grind (no more RuneScape-sized wall)." },
    { t:"change",s:"Because the new curve is gentler at every level, your existing skills may read a little higher than before — the valley recognising work you'd already done. Nothing is ever lost." },
  ]},
  { v:"2.6.1", code:28, date:"2026-07-11", name:"Second Look", notes:[
    { t:"fix",   s:"The “Skip intro” button now actually appears and works during the opening." },
    { t:"fix",   s:"The Collection no longer lists an item you can't get, so it can be completed — and a returning save fills in from what you already own." },
    { t:"fix",   s:"Reloading during the very first Maya scene no longer skips it forever." },
  ]},
  { v:"2.6.0", code:27, date:"2026-07-11", name:"Journeyman", notes:[
    { t:"new",   s:"Cooking now has a real ladder — recipes unlock as your Cooking level climbs, from Fried Egg all the way to Frostbloom Tea." },
    { t:"new",   s:"Reach a skill mastery (25/50/75/99) and the neighbour who cares most about that craft says a warm word — in their own voice." },
  ]},
  { v:"2.5.1", code:26, date:"2026-07-11", name:"Homely", notes:[
    { t:"polish",s:"The calendar cue up top no longer lingers all week — it appears only on the day itself or its eve, with a warm heads-up in your evening summary." },
    { t:"polish",s:"Low energy now deepens to warm amber instead of flashing red — nothing in the valley is a danger." },
    { t:"polish",s:"Pickup notices show how many you now hold, and on touch devices a 🔍 button examines whatever's in front of you." },
  ]},
  { v:"2.5.0", code:25, date:"2026-07-11", name:"The Collection", notes:[
    { t:"new",   s:"The Journal now keeps a Collection — a museum of everything you've ever found, filling in as you discover crops, fish, gems, dishes and more." },
  ]},
  { v:"2.4.0", code:24, date:"2026-07-11", name:"With Feeling", notes:[
    { t:"polish",s:"Your gold now counts up (and down) with a little pulse when it changes, instead of silently blinking to a new number." },
    { t:"polish",s:"Items pop off with a satisfying little flourish when you collect them." },
    { t:"new",   s:"Landing a legendary fish now gets its own triumphant fanfare, distinct from a level-up." },
  ]},
  { v:"2.3.0", code:23, date:"2026-07-11", name:"A Word on Everything", notes:[
    { t:"new",   s:"Press X to examine whatever you're facing — a crop, a rock, a neighbour, the water — for a little line of flavour, RuneScape-style." },
    { t:"new",   s:"Your Backpack now reads like a museum: every item carries its own description." },
  ]},
  { v:"2.2.0", code:22, date:"2026-07-11", name:"First Light", notes:[
    { t:"new",   s:"A proper opening: a short prologue tells you what became of the valley, and Grandpa's letter now names your mission — wake it back up." },
    { t:"new",   s:"Maya meets you at the farm on your first morning to welcome you and point you at Elder Rowan." },
    { t:"new",   s:"Gentle, one-time hints teach each tool the first moment you need it — nothing forced, and never for returning players." },
    { t:"new",   s:"The Journal now groups the story into acts and shows where the chapter is heading, so the plot is visible in casual play." },
    { t:"change",s:"How to Play now also lives inside the Journal, and Continue reminds you what act you're in and what's next." },
  ]},
  { v:"2.1.0", code:21, date:"2026-07-11", name:"Clear Skies", notes:[
    { t:"new",   s:"Version history — read this changelog any time from the title screen or Settings." },
    { t:"change",s:"Night on the farm now reads as a clear moonlit valley instead of black-with-a-glare; your light is a warm lantern, not a cold searchlight." },
    { t:"change",s:"The mine is brighter and readable — you can see the ore to swing at, while the corners stay dark and atmospheric." },
    { t:"new",   s:"Collecting items pops a fading notice in the corner, and item names no longer overlap the XP text." },
    { t:"polish",s:"All in-game text (floaters, prompts, name tags) is now crisp instead of pixel-blurred." },
    { t:"balance",s:"Tom's demand retuned, mine depth banks every 5 floors, skills preview their next unlock, and the Hunt has a 5/5 capstone." },
  ]},
  { v:"2.0.0", code:20, date:"2026-07-10", name:"A Day Worth Living", notes:[
    { t:"new",   s:"Tom's Demand: sell too much of one thing in a day and its price slides — variety pays." },
    { t:"new",   s:"The Hunt: five legendary fish that rise only when water, hour, weather and season all line up." },
    { t:"new",   s:"Orchards & apiaries — plant fruit trees and set beehives for slow, permanent income." },
    { t:"new",   s:"A weather forecast and a daily offering give you a reason to plan tomorrow and show up today." },
    { t:"change",s:"Bigger hoe tiers, honest winter snow, and a mine that deepens into a real descent." },
  ]},
  { v:"1.5.0", code:15, date:"2026-07-10", name:"The Valley Fills In", notes:[
    { t:"new",   s:"Grandpa's nine journal pages, a village noticeboard, and Rowan's restoration projects." },
    { t:"new",   s:"Skill mastery milestones at 25 / 50 / 75 / 99." },
    { t:"change",s:"Watering-can tiers and an economy & season balance pass." },
  ]},
  { v:"1.0.0", code:10, date:"2026-07-09", name:"Willowbrook", notes:[
    { t:"new",   s:"The first cozy build: farming, fishing, mining, foraging, skills 1–99, townsfolk, quests, seasons and weather — all procedural, no combat." },
  ]},
];

// ---- MASTERY RECOGNITION ----
// The 1–99 grind used to pass its milestones in silence. Now, when you cross a mastery tier
// (25/50/75/99) in a skill, the neighbour who cares most about that craft says a warm word — in
// their own voice. One line per skill per tier; fires once, naturally, as you cross it.
const MASTERY_NPC = { Farming:"maya", Woodcutting:"tom", Mining:"rowan", Fishing:"bram", Cooking:"pip" };
const MASTERY_PRAISE = {
  Farming: { 25:"Your rows are getting straighter than mine. I'm a little jealous.",
             50:"The whole valley's greener since you came — I paint it that way now.",
             75:"Your grandpa would hardly know the place. In the best possible way.",
             99:"You've made this soil sing. I don't think anyone's ever farmed like you." },
  Woodcutting: { 25:"That's good clean timber you keep bringing me. Keep it coming!",
                 50:"You go through axes like I go through sales patter. Respect.",
                 75:"Half my lumber stock has your name on it now. Business is good!",
                 99:"Nobody's felled a tree in this valley like you. I should charge admission." },
  Mining: { 25:"The old shafts haven't heard a pick that sure in years.",
            50:"You read the stone the way a Guild miner ought to. Good.",
            75:"The deep seams are giving themselves up to you. Few ever earned that.",
            99:"You mine as though the mountain trusts you. And I believe it does." },
  Fishing: { 25:"You're not scaring them off anymore. That's something, that is.",
             50:"Cleaner line than most who've fished these waters twice as long.",
             75:"I've stopped giving you pointers. You'd only go and correct me.",
             99:"You fish better than your grandpa did. Don't you dare tell him I said so." },
  Cooking: { 25:"That smelled AMAZING. Can I try some? Please? Please?",
             50:"You cook better than the festival stalls! I'm telling everyone.",
             75:"When I grow up I'm gonna cook just like you. Save me a plate?",
             99:"You're the best cook in the whole valley. That's a FACT, not an opinion." },
};

const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
const SEASON_DAYS = 28;
const YEAR_DAYS = SEASON_DAYS * 4;

// ---- THE CALENDAR ----
// Festivals recur every year on a fixed date, on the coast. `window` is the hour range you must
// arrive within; arriving on the day outside the window just tells you when to come back.
const FESTIVALS = [
  { id:"eggfair",   name:"The Egg Fair",    season:"Spring", day:14, from:9,  to:18, blurb:"Pip hides eggs all over the sand." },
  { id:"luau",      name:"The Summer Luau", season:"Summer", day:14, from:11, to:19, blurb:"Bring a fish for Bram's pot." },
  { id:"harvest",   name:"The Harvest Fair",season:"Fall",   day:22, from:9,  to:18, blurb:"Your best crop of the season is judged." },
  { id:"starwatch", name:"The Star-Watch",  season:"Winter", day:24, from:19, to:26, blurb:"The valley watches the winter sky." },
];

// Give them each a gift on their day and it counts for far more.
const BIRTHDAYS = {
  pip:   { season:"Spring", day:5  },
  maya:  { season:"Spring", day:19 },
  tom:   { season:"Summer", day:6  },
  rowan: { season:"Fall",   day:3  },
  bram:  { season:"Winter", day:11 },
};

// ---- CROPS (level- & season-gated) ----
// pal: [stalk, leaf, fruit, fruitHi]  — used by the sprite generator
const CROPS = {
  turnip:     { name:"Turnip",     lvl:1,  days:2, seed:20,  sell:35,  xp:12,  shape:"root",   seasons:["Spring"],          pal:["#4f8a34","#6fb04a","#e8d5ef","#ffffff"] },
  potato:     { name:"Potato",     lvl:3,  days:3, seed:40,  sell:70,  xp:20,  shape:"root",   seasons:["Spring"],          pal:["#4f8a34","#6fb04a","#caa06a","#e6c793"] },
  wheat:      { name:"Wheat",      lvl:4,  days:4, seed:35,  sell:60,  xp:18,  shape:"tall",   seasons:["Summer","Fall"],   pal:["#7a8a3a","#a0b055","#e8d94a","#fff0a0"] },
  carrot:     { name:"Carrot",     lvl:6,  days:3, seed:60,  sell:100, xp:26,  shape:"root",   seasons:["Spring","Fall"],   pal:["#4f8a34","#7fbe55","#ff9438","#ffbe6a"] },
  strawberry: { name:"Strawberry", lvl:10, days:4, seed:100, sell:170, xp:38,  shape:"bush",   seasons:["Spring","Summer"], pal:["#3f7a2e","#5fa03e","#ff4d55","#ff9aa0"] },
  blueberry:  { name:"Blueberry",  lvl:8,  days:4, seed:90,  sell:150, xp:36,  shape:"bush",   seasons:["Summer"],          pal:["#3f7a2e","#5fa03e","#5a6ad0","#9aa8ea"] },
  tomato:     { name:"Tomato",     lvl:12, days:4, seed:110, sell:180, xp:42,  shape:"bush",   seasons:["Summer"],          pal:["#3f7a2e","#5fa03e","#e0452a","#ff8a6a"] },
  corn:       { name:"Corn",       lvl:16, days:5, seed:150, sell:250, xp:52,  shape:"tall",   seasons:["Summer","Fall"],   pal:["#4f8a34","#7fbe55","#ffd94a","#fff0a0"] },
  cranberry:  { name:"Cranberry",  lvl:18, days:5, seed:170, sell:280, xp:60,  shape:"bush",   seasons:["Fall"],            pal:["#3f7a2e","#5fa03e","#c02a3a","#ff5a6a"] },
  pumpkin:    { name:"Pumpkin",    lvl:22, days:6, seed:220, sell:400, xp:72,  shape:"gourd",  seasons:["Fall"],            pal:["#3f7a2e","#5fa03e","#ff8a2a","#ffb35a"] },
  starfruit:  { name:"Starfruit",  lvl:24, days:8, seed:450, sell:950, xp:150, shape:"star",   seasons:["Summer"],          pal:["#4f8a34","#7fbe55","#ffe25a","#fff6b0"] },
  frostbloom: { name:"Frostbloom", lvl:14, days:6, seed:180, sell:330, xp:66,  shape:"bush",   seasons:["Winter"],          pal:["#4a6a7a","#6a94a8","#a8d8f0","#e6f6ff"] },
  // The Long Climb (v3.10): six late crops so Farming pays new CONTENT — not just perks — from L30
  // to L90, one per rung across the old L25–99 desert. Prices sit on the g/level trend but the long
  // grow times keep daily yield in check, and (like every crop) each auto-inherits its produce/seed
  // sprite, ITEM_SELL, Cellar wine+jam, Tom's per-item demand, gifting, and the Collection.
  rhubarb:    { name:"Rhubarb",    lvl:30, days:5, seed:300, sell:420,  xp:90,  shape:"tall",  seasons:["Spring"],          pal:["#4f8a34","#7fbe55","#d0454a","#f07a7e"] },
  melon:      { name:"Melon",      lvl:40, days:7, seed:400, sell:640,  xp:125, shape:"gourd", seasons:["Summer"],          pal:["#3f7a2e","#5fa03e","#5aa84a","#8fd06a"] },
  artichoke:  { name:"Artichoke",  lvl:52, days:6, seed:480, sell:760,  xp:145, shape:"bush",  seasons:["Fall"],            pal:["#3f7a2e","#5fa03e","#7a8a5a","#a8b87a"] },
  grape:      { name:"Grape",      lvl:64, days:7, seed:560, sell:900,  xp:180, shape:"bush",  seasons:["Summer","Fall"],   pal:["#3f7a2e","#5fa03e","#7a4a9a","#a87ac8"] },
  yam:        { name:"Yam",        lvl:78, days:8, seed:720, sell:1200, xp:235, shape:"root",  seasons:["Fall"],            pal:["#4f8a34","#7fbe55","#c06a3a","#e0955a"] },
  everbloom:  { name:"Everbloom",  lvl:90, days:9, seed:900, sell:1500, xp:300, shape:"star",  seasons:["Winter"],          pal:["#4a6a7a","#6a94a8","#c8b0f0","#eaddff"] },
};

// ---- TREES ----
// Willow/Elderwood/Heartwood (Grove Depths Phase 2) fill what was a dead skill from 18 to 99 —
// three species couldn't carry a 99-level grind. Willow is the RS-style fast-XP tree (quick
// chop, cheap wood); Elderwood is the premium timber the late-game sinks ask for; Heartwood is
// the yew/magic analog — slow, sparse, an event to find. Sell prices sit BELOW the g-per-level
// trend on purpose (the gem lesson, 2026-07-12): wood value must never outrun the money crops.
const TREES = {
  oak:       { name:"Oak",       lvl:1,  hp:3,  xp:25,  drop:"Wood",        n:2, pal:["#3f8a3f","#57ad57","#2f6a2f"] },
  pine:      { name:"Pine",      lvl:8,  hp:6,  xp:60,  drop:"Pine Wood",   n:2, pal:["#2f6a52","#3f8f6a","#204a3a"] },
  maple:     { name:"Maple",     lvl:18, hp:11, xp:115, drop:"Maple Wood",  n:2, pal:["#b8683a","#d68a52","#8a4a28"] },
  willow:    { name:"Willow",    lvl:30, hp:8,  xp:150, drop:"Willow Wood", n:2, pal:["#4a8a4a","#6ab86a","#3a6a3a"] },
  elderwood: { name:"Elderwood", lvl:45, hp:16, xp:260, drop:"Elder Wood",  n:2, pal:["#2c5a6a","#3f7a8a","#1e4250"] },
  heartwood: { name:"Heartwood", lvl:70, hp:24, xp:520, drop:"Heartwood",   n:2, pal:["#5a9a7a","#7ac8a0","#3f7a5c"] },
  // The Long Climb (v3.10): the deepest-ring wood, so the axe has a live target past Heartwood (L70)
  // — the last 30 levels were pure grind with the skills panel showing "nothing left to unlock".
  silverwood: { name:"Silverwood", lvl:85, hp:30, xp:760, drop:"Silverwood", n:2, pal:["#9aa8b0","#c8d4dc","#6a7a86"] },
};

// ---- ORES / ROCKS ----
const ORES = {
  // v3.17 — a clean, RuneScape-style Mining ladder: a new ore every 10 levels, easy to remember.
  // Stone at 1 (you start here — there's plenty of it, above ground and on the early floors), then
  // copper 10, iron 20, gold 30, cobalt 40, star metal 50. Stone gives a little more XP now so the
  // grind up to copper isn't a slog.
  stone:  { name:"Stone Rock",  lvl:1,  hp:2,  xp:12,  drop:"Stone",      gem:null,      col:"#9a9a9a" },
  copper: { name:"Copper Vein", lvl:10, hp:4,  xp:26,  drop:"Copper Ore", gem:"#e08a45", col:"#c77b3f" },
  iron:   { name:"Iron Vein",   lvl:20, hp:8,  xp:62,  drop:"Iron Ore",   gem:"#d8c4bc", col:"#bfa8a0" },
  gold:   { name:"Gold Vein",   lvl:30, hp:12, xp:145, drop:"Gold Ore",   gem:"#ffe27a", col:"#ffd75a" },
  // The Long Climb (v3.10): two deep veins so Mining pays content past Gold (L28) — planted at L45
  // and L70, the heart of the old 71-level dead zone. They spawn only on the deep ore table (below),
  // so shallow floors read exactly as tuned; a low miner facing one gets the "come back stronger"
  // gate, same as Gold today. Rock + cracked sprites auto-generate from `gem`; the drop is a sink.
  cobalt:    { name:"Cobalt Vein",     lvl:40, hp:16, xp:240, drop:"Cobalt Ore",       gem:"#6a8ad8", col:"#4a6ac8" },
  starmetal: { name:"Star Metal Vein", lvl:50, hp:22, xp:520, drop:"Star Metal Shard", gem:"#c8ecff", col:"#a8c8e8" },
};

// ---- FISH ----
const FISH = [
  { name:"Sardine",    lvl:1,  xp:15,  sell:30,  pal:["#8fb0c0","#d8e6ee"] },
  { name:"Bass",       lvl:5,  xp:32,  sell:65,  pal:["#5f7a4a","#a9c98a"] },
  { name:"Trout",      lvl:12, xp:55,  sell:120, pal:["#7a6a9a","#c9b0e0"] },
  { name:"Salmon",     lvl:20, xp:95,  sell:240, pal:["#d76a4a","#ffb090"] },
  { name:"Golden Koi", lvl:32, xp:190, sell:620, pal:["#ffb02a","#ffe27a"] },
  // The Long Climb (v3.10): four deep-water fish for the L34–98 tail the audits (and the v2.0
  // scorecard) flagged as the game's longest desert. Each is its own item, so it auto-inherits the
  // Cooked variant, EDIBLE, the Almanac list, Tom's per-name demand, gifting, and the Collection;
  // the `f.lvl <= level` filter in hookFish holds each back until you've grown into it.
  { name:"Moonperch",     lvl:40, xp:220, sell:780,  pal:["#7a8ac0","#d0d8f0"] },
  { name:"Silvergill",    lvl:55, xp:300, sell:1080, pal:["#a8b0bc","#e8ecf2"] },
  { name:"Gulf Sturgeon", lvl:70, xp:420, sell:1300, pal:["#5a6a5a","#9ab090"] },
  { name:"Coelacanth",    lvl:85, xp:620, sell:1800, pal:["#2f4a6a","#5a7a9a"] },   // a living fossil — the deep's trophy (trimmed from 2200 so fishing doesn't out-earn the farm base)
];

const CROP_NAMES = new Set(Object.keys(CROPS).map(k => CROPS[k].name));

// ---- THE ORCHARD AND THE APIARY ----
// A sapling takes a whole season to come good, then fruits every day of its season, forever.
// Yield per tile sits deliberately UNDER a starfruit's — a tree is patience, not a money press.
// And because it pays in *variety*, Tom's demand rewards it more than another row of the same.
// Prices are set so that a mature tree pays a shade MORE than a starfruit tile in its own season
// (~62g/tile/day) and nothing at all in the other three — a year-average well under a worked field.
// A tree is a slow, gentle, diversified income. It must never become the new passive base layer.
const FRUIT_TREES = {
  cherry: { name:"Cherry Tree", fruit:"Cherry", season:"Spring", sell:85,  cost:1000,
            pal:["#3f7a2e","#57ad57","#e0455a"], blurb:"Bears every day of spring, once it's grown." },
  plum:   { name:"Plum Tree",   fruit:"Plum",   season:"Summer", sell:100, cost:1300,
            pal:["#3a6a34","#4e9a4a","#7a4a9a"], blurb:"Bears every day of summer, once it's grown." },
  apple:  { name:"Apple Tree",  fruit:"Apple",  season:"Fall",   sell:70,  cost:850,
            pal:["#4a7a34","#69ad50","#d0403a"], blurb:"Bears every day of autumn, once it's grown." },
};
const TREE_MATURE_DAYS = 28;      // one full season of waiting
const TREE_FRUIT_CAP   = 3;       // it holds three days of fruit, then waits for you — never a chore

// A hive yields more where more is in bloom. Wild flowering ground counts, and so do berry bushes,
// so the meadow is generous and your starfruit rows are not. Four hives is the valley's limit.
const HIVE_COST = 700, HIVE_RADIUS = 4, HIVE_CAP = 3, HIVE_MAX = 4;

// ---- THE CELLAR (artisan machines) ----
// A crop's second life: the keg ages anything into wine (slow, rich), the preserves jar sets it
// into jam (quick, modest). The multipliers are deliberately shy of the kitchen's best dishes —
// machines trade TIME for value with zero energy, so they must never beat cooking (which costs
// ingredients + attention) or the field itself. And because every product is its own item name,
// Tom's Demand saturates per-product: forty jars of the same jam glut just like forty starfruit.
const MACHINES = {
  keg: { name:"Keg",           days:3, mult:2.2, max:4,
         cost:{ g:900, mats:{ "Pine Wood":8, "Iron Ore":2 } },
         product: n => n + " Wine",
         blurb:"Ages a crop into wine over three days. Patience in a barrel." },
  jar: { name:"Preserves Jar", days:2, mult:1.6, max:6,
         cost:{ g:550, mats:{ "Wood":6, "Copper Ore":2 } },
         product: n => n + " Jam",
         blurb:"Sets a crop into jam over two days. Summer, kept." },
};
// what the machines will take: anything grown — crops and orchard fruit
function machineLoadable(item){ return CROP_NAMES.has(item) || FRUIT_NAMES.has(item); }

// ---- DÉCOR (v3.13) ----
// The economy's oldest hole (§3.6): late coin had nowhere to go once Rowan's ~20k of projects were
// funded — and The Long Climb's faucets widened it. Décor is the sink: purely cosmetic pieces you
// buy at Tom's and set on the farm like a hive, from a 350g flower bed to a deliberately absurd
// 300,000g golden statue (the Golden-Clock flex — coin as pure status). Nothing functional, nothing
// taken; you can always lift a piece back up with the axe. `kind` is the object kind AND sprite key.
const DECOR = {
  flowerbed:   { name:"Flower Bed",     cost:350,    blurb:"A tended bed of colour, blooming whatever the season." },
  gardenbench: { name:"Garden Bench",   cost:600,    blurb:"A quiet place to sit and look at what you've made." },
  stonelantern:{ name:"Stone Lantern",  cost:900,    blurb:"Weathered grey stone, patient in any weather." },
  birdbath:    { name:"Bird Bath",      cost:1400,   blurb:"The valley's songbirds will find it within a day." },
  topiary:     { name:"Topiary",        cost:2000,   blurb:"A hedge, clipped into something with opinions." },
  sundial:     { name:"Sundial",        cost:2600,   blurb:"Tells the time, on the days the sun cooperates." },
  wishingwell: { name:"Wishing Well",   cost:4000,   blurb:"Deep, cool, and full of other people's hopes." },
  grandfountain:{name:"Grand Fountain", cost:8000,   blurb:"Three tiers of falling water. Frankly, a bit much — perfect." },
  goldenstatue:{ name:"Golden Statue",  cost:300000, blurb:"A solid-gold likeness of you, valley's finest. Utterly pointless. Magnificent." },
};
const DECOR_MAX = 40;   // a generous cap so a farm can be dressed, but not infinitely spammed

// ---- THE DEEP RUN (v3.15) ----
// The mine froze time (v2.9) to be cozy — but that also removed every trace of expedition tension
// (§6). The Deep Run restores it WITHOUT breaking the contract: it's opt-in (the default mine stays
// timeless), and nothing is ever taken — when the day ends you wake at home with your whole haul,
// having simply not gone as deep as you hoped. A Staircase (packed from bulk Stone — a sink for the
// valley's most worthless rock) punches you STAIR_DROP floors down in a blink, so you can pioneer
// the rich deep floors before 2am. The push-your-luck is pure opportunity: Stone spent, depth dared.
const STAIR_STONE = 25;   // Stone to pack one Staircase
const STAIR_DROP  = 3;    // floors a Staircase drops you

// ---- THE HUNT ----
// Where a fish lives. The pond and the coast are different water, and the valley knows it.
const WATER = {
  pond:  ["Sardine", "Bass", "Trout",  "Golden Koi"],   // trout are a river fish; no salmon inland
  // the deep-water rarities (v3.10) rise only off the open sea, and only for anglers who've grown
  // into them (the f.lvl filter) — so the coast stays worth casting from L34 all the way to L85
  coast: ["Sardine", "Bass", "Salmon", "Golden Koi", "Moonperch", "Silvergill", "Gulf Sturgeon", "Coelacanth"],
};

// Five fish that rise only under exact conditions. Bram knows all five, and will tell you one
// for every heart you earn. Each is caught once, and then it is yours forever.
// `hours` are raw clock hours (the day runs 6 → 26), so night wraps past midnight.
const LEGENDS = [
  { id:"sunfleck", name:"Sunfleck",   lvl:14, sell:700,  xp:220,
    where:"pond",  from:5,  to:8,  weather:"clear", season:"Spring", chance:0.40,
    pal:["#e8b23a","#fff0b0"],
    clue:"There's a fish in your own pond that only shows in the first light of a spring morning. Clear sky. Before eight. Blink and it's gone." },
  { id:"moonscale", name:"Moonscale", lvl:22, sell:800,  xp:260,
    where:"coast", from:20, to:26, weather:"clear", season:"Summer", chance:0.40,
    pal:["#8a9ad0","#dfe6ff"],
    clue:"Summer nights, clear sky, out on my rocks after eight. Something comes up that takes the moon on its back. I've seen it twice." },
  { id:"whitefin", name:"Whitefin",   lvl:30, sell:950,  xp:340,
    where:"coast", from:8,  to:17, weather:"fog",   season:"Fall",   chance:0.38,
    pal:["#cfd6e0","#ffffff"],
    clue:"A fall fog on the water, in broad daylight — that's the only time the Whitefin comes in. Everyone else stays home on a fog day. That's rather the point." },
  { id:"frostjaw", name:"Frostjaw",   lvl:26, sell:850,  xp:300,
    where:"pond",  from:5,  to:8,  weather:"snow",  season:"Winter", chance:0.40,
    pal:["#5a8aa8","#cfeaff"],
    clue:"Winter. Snow falling. Your pond, at first light, when the ice is thin enough to break with a boot. Frostjaw. Ugly thing. Worth a fortune." },
  { id:"stormrider", name:"Stormrider", lvl:34, sell:1200, xp:480,
    where:"pond",  from:20, to:26, weather:"storm", season:null,     chance:0.34,
    pal:["#6a5a9a","#c9b6ff"],
    clue:"…And one more. When it storms at night, don't go to the sea — go to your own pond. Something comes up the stream ahead of the weather. My father called it the Stormrider. I never believed him. Then I saw it." },
];
const LEGEND_BY_ID = {}; LEGENDS.forEach(l => LEGEND_BY_ID[l.id] = l);

// ---- SELL VALUES ----
const ITEM_SELL = { "Wood":12, "Pine Wood":28, "Maple Wood":52, "Willow Wood":34, "Elder Wood":95, "Heartwood":210, "Silverwood":340,
  "Stone":3, "Copper Ore":30, "Iron Ore":68, "Gold Ore":165, "Cobalt Ore":300, "Star Metal Shard":450 };   // shard seats just under Diamond (480) — an ore must never out-value the rarest gem
FISH.forEach(f => { ITEM_SELL[f.name] = f.sell; ITEM_SELL["Cooked "+f.name] = Math.floor(f.sell*1.75); });
LEGENDS.forEach(l => { ITEM_SELL[l.name] = l.sell; });   // trophies. You don't cook a Stormrider.
for(const k in CROPS) ITEM_SELL[CROPS[k].name] = CROPS[k].sell;

// ---- EDIBLES (energy restored) ----
const EDIBLE = { "Berry Bun":34, "Field Salad":26 };
FISH.forEach(f => EDIBLE["Cooked "+f.name] = 22 + f.lvl);

// ---- GEMS (from the mine) & SHORE forage (from the beach) ----
const GEMS = { Amethyst:"#a877e0", Topaz:"#e8b23a", Emerald:"#3ec878", Ruby:"#e0455a", Diamond:"#b8ecf7" };
// Trimmed from 120/160/280/360/640 (owner playtest 2026-07-12: "the gems are just too easy to
// get… suddenly everything else is immaterial"). Gems are a treat now, not the economy — and they
// gained non-sell uses the same week (tier-3 tools, the deep lift stop), so finding one still sings.
const GEM_SELL = { Amethyst:75, Topaz:110, Emerald:190, Ruby:260, Diamond:480 };
// Drops are weighted toward the humble end — a Diamond is an event, not a Tuesday.
const GEM_WEIGHTS = [["Amethyst",4],["Topaz",3],["Emerald",2],["Ruby",1.5],["Diamond",0.5]];
function pickGem(){
  let t=0; for(const [,w] of GEM_WEIGHTS) t+=w;
  let x=Math.random()*t;
  for(const [g,w] of GEM_WEIGHTS){ if((x-=w)<0) return g; }
  return "Amethyst";
}
for(const g in GEM_SELL) ITEM_SELL[g] = GEM_SELL[g];
const SHORE = { Shell:22, Coral:48, Seaweed:14, Clam:38, Pearl:260 };
for(const s in SHORE) ITEM_SELL[s] = SHORE[s];
EDIBLE["Clam"] = 20;
ITEM_SELL["Frostberry"] = 40;             // winter forage — the valley still gives, just less
EDIBLE["Frostberry"] = 20;
for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k];
  ITEM_SELL[t.fruit] = t.sell; EDIBLE[t.fruit] = 24; }
ITEM_SELL["Honey"] = 100; EDIBLE["Honey"] = 30;
const FRUIT_NAMES = new Set(Object.values(FRUIT_TREES).map(t => t.fruit));

// ---- the Cellar's products, generated for every growable ----
// Wine 2.2× and Jam 1.6× the raw sell price (see MACHINES for why those sit under the kitchen's
// dishes). Each product is a distinct item, so Tom's Demand gluts per product — and each gets an
// examine line, because everything in this valley deserves a word.
(function(){
  const each = (name, sell) => {
    ITEM_SELL[name+" Wine"] = Math.round(sell * 2.2);
    ITEM_SELL[name+" Jam"]  = Math.round(sell * 1.6);
  };
  for(const k in CROPS) each(CROPS[k].name, CROPS[k].sell);
  for(const k in FRUIT_TREES) each(FRUIT_TREES[k].fruit, FRUIT_TREES[k].sell);
})();
ITEM_SELL["Keg"] = 0; ITEM_SELL["Preserves Jar"] = 0;   // the machines themselves aren't for resale
// Shop staples. Both priced below their buy cost (24g / 30g) so there is no buy-low-sell-high
// loop. Berry Bun previously had no price at all, which quietly made it ungiftable — and it is
// Pip's favourite thing in the world.
ITEM_SELL["Field Salad"] = 22;
ITEM_SELL["Berry Bun"]   = 22;
ITEM_SELL["Star Metal"] = 0;              // story items, not for sale
ITEM_SELL["Guild Seal"] = 0;
ITEM_SELL["Bouquet"] = 0;                 // Willowbrook courtship — give to your beloved
ITEM_SELL["Grandpa's Guild Pin"] = 0;     // keepsake — grants +10% XP while carried
ITEM_SELL["Bram's Oilskin"] = 0;          // the Hunt's crown — faster bites, and the sea in any weather

// ---- ANIMAL PRODUCE ----
ITEM_SELL["Egg"] = 55; ITEM_SELL["Large Egg"] = 95; ITEM_SELL["Milk"] = 90; ITEM_SELL["Large Milk"] = 165; ITEM_SELL["Wool"] = 120; ITEM_SELL["Prize Fleece"] = 220;
EDIBLE["Egg"] = 16; EDIBLE["Milk"] = 22; EDIBLE["Large Milk"] = 40;
// Sheep (v3.8): the barn's third resident, and the honest source that finally makes Wool obtainable.
// Wool is priced above milk but regrows over several days, not daily — a coat is worth the wait, and
// this keeps a flock of sheep from out-earning the whole field. Shears are a one-time buy at Tom's
// (a gentle gold sink), never consumed — the cozy contract: nothing is taken, nothing wears out.
const SHEEP_COST = 500, SHEEP_MAX = 4, SHEARS_COST = 250, WOOL_REGROW = 3;
ITEM_SELL["Shears"] = 0;   // a keepsake tool, not for resale

// ---- COOKING RECIPES (made at a stove or campfire) ----
// ing: {item:qty}. Dishes give energy + sell + Cooking XP + are good gifts.
// Sell values obey one rule: a dish must never be worth LESS than the crops that went into it.
// Anything that lost money was raised to ~1.30x its ingredient value; anything already above
// that was left alone. No dish is craftable purely from shop-bought inputs, so there is no loop.
// `lvl` gates the recipe on your Cooking level — so Cooking finally has a 1→40 curve of its own
// (it used to unlock nothing). Grilling raw fish stays ungated as the entry-level way to train.
const RECIPES = [
  { name:"Fried Egg",         lvl:1,  ing:{Egg:1},                       energy:45,  sell:90,  xp:16, col:"#ffd75a" },
  { name:"Baked Potato",      lvl:1,  ing:{Potato:1},                    energy:42,  sell:95,  xp:16, col:"#caa06a" },
  { name:"Bread",             lvl:3,  ing:{Wheat:2},                     energy:48,  sell:160, xp:22, col:"#e0b46a" },
  { name:"Garden Salad",      lvl:5,  ing:{"Field Salad":1, Carrot:1},   energy:55,  sell:160, xp:28, col:"#7fbe55" },
  { name:"Berry Jam",         lvl:8,  ing:{Strawberry:2},                energy:50,  sell:440, xp:32, col:"#e0455a" },
  { name:"Corn Bread",        lvl:12, ing:{Corn:1, Wheat:1},             energy:72,  sell:400, xp:36, col:"#ffd94a" },
  { name:"Tomato Soup",       lvl:15, ing:{Tomato:2},                    energy:66,  sell:470, xp:34, col:"#e0452a" },
  { name:"Blueberry Tart",    lvl:18, ing:{Blueberry:2, Wheat:1},        energy:80,  sell:470, xp:42, col:"#5a6ad0" },
  { name:"Farmer's Omelette", lvl:22, ing:{Egg:2, Milk:1},               energy:100, sell:360, xp:50, col:"#ffe08a" },
  { name:"Pumpkin Soup",      lvl:28, ing:{Pumpkin:1, Milk:1},           energy:95,  sell:680, xp:52, col:"#ff8a2a" },
  { name:"Fish Stew",         lvl:32, ing:{Salmon:1, Carrot:1, Tomato:1},energy:88,  sell:680, xp:48, col:"#d76a4a" },
  { name:"Cranberry Sauce",   lvl:36, ing:{Cranberry:2},                 energy:60,  sell:730, xp:40, col:"#c02a3a" },
  { name:"Frostbloom Tea",    lvl:40, ing:{Frostbloom:1, Milk:1},        energy:70,  sell:590, xp:44, col:"#a8d8f0" },
  // Second Helpings (v3.11): eight late dishes so Cooking keeps unlocking recipes to L90, not just
  // perks — and they eat The Long Climb's new crops & fish, closing that loop. Each sells at the
  // series' ~1.4x-over-ingredients profit line (Tom's per-dish demand still caps the daily take),
  // and auto-inherits its plate sprite (from col), sell, EDIBLE, the Kitchen collection, and the
  // skills-panel next-unlock. The crown, Grand Feast, needs mastery in Farming, Fishing AND Cooking.
  { name:"Rhubarb Pie",       lvl:44, ing:{Rhubarb:1, Wheat:2},              energy:85,  sell:820,  xp:92,  col:"#d0454a" },
  { name:"Melon Sorbet",      lvl:48, ing:{Melon:1, Milk:1},                 energy:90,  sell:1050, xp:100, col:"#8fd06a" },
  { name:"Stuffed Artichoke", lvl:54, ing:{Artichoke:1, Egg:1, Wheat:1},     energy:96,  sell:1280, xp:115, col:"#a8b87a" },
  { name:"Grape Tart",        lvl:60, ing:{Grape:1, Wheat:1},                energy:92,  sell:1400, xp:130, col:"#7a4a9a" },
  { name:"Harvest Roast",     lvl:68, ing:{Yam:1, Carrot:2},                 energy:100, sell:2050, xp:155, col:"#c06a3a" },
  { name:"Fisherman's Pie",   lvl:74, ing:{Salmon:1, Yam:1, Milk:1},         energy:100, sell:2250, xp:178, col:"#d0a060" },
  { name:"Everbloom Cordial", lvl:82, ing:{Everbloom:1, Honey:1},            energy:90,  sell:2400, xp:215, col:"#c8b0f0" },
  { name:"Grand Feast",       lvl:90, ing:{"Gulf Sturgeon":1, Yam:1, Everbloom:1}, energy:100, sell:5400, xp:285, col:"#e0c070" },
];
RECIPES.forEach(r => { ITEM_SELL[r.name] = r.sell; EDIBLE[r.name] = r.energy; });

// ---- ROWAN'S RESTORATION PROJECTS ----
// Late-game gold has nowhere to go. These turn a pile of coin into things you can walk on.
// Fund one, sleep, and it exists. ~16,000g of sinks in total.
const PROJECTS = [
  { id:"minecart", name:"The Minecart Line", gold:8000, items:{ "Iron Ore":20, "Wood":30 },
    blurb:"Re-lay the old rails from the cottage to the mine mouth. No more trudging the ridge.",
    done:"The rails are re-laid. A cart waits at each end." },
  { id:"boardwalk", name:"The Coast Boardwalk", gold:5000, items:{ "Wood":40, "Pine Wood":10 },
    blurb:"Plank the marsh path and hang lanterns. The coast stops being a hike.",
    done:"The boardwalk is laid, and the lanterns are lit." },
  { id:"fountain", name:"The Town Fountain", gold:3000, items:{ "Stone":10, "Emerald":2 },
    blurb:"A fountain by Tom's door, as there was once. Toss a coin; word of your wish gets around.",
    done:"The fountain runs again. Pip has already fallen in." },
  // the deep grove's timber gets a civic home — Elderwood's first sink outside the lift
  { id:"arbor", name:"The Grove Arbor", gold:4000, items:{ "Elder Wood":10, "Willow Wood":15 },
    blurb:"Lantern-posts of elder and willow along the Deep Grove's footpath, the way the foresters kept it.",
    done:"The arbor stands. The grove's first ring glows kindly after dark." },
];
const PROJECT_BY_ID = {}; PROJECTS.forEach(p => PROJECT_BY_ID[p.id] = p);

// ---- THE WEATHER, AND WHAT EACH DAY OFFERS ----
// Weather never takes anything from you. It changes what the valley OFFERS, and always for one day
// only — so a day slept through is a thing missed, not a thing lost. Tomorrow's is posted tonight.
const WEATHERS = {
  clear: { name:"Clear",  icon:"☀", tone:"#ffce5a",
    line:"A clear day. The valley is exactly itself.",
    offer:"Fireflies at dusk." },
  rain:  { name:"Rain",   icon:"☔", tone:"#8fd3ff",
    line:"Rain drums on the roof — your crops drink for free.",
    offer:"The fish bite fast. Forage gives double. No watering needed." },
  storm: { name:"Storm",  icon:"⛈", tone:"#c9b6ff",
    line:"A storm off the sea. Bram won't take the boat out today.",
    offer:"The coast is too rough to fish — but the veins run rich underground. Tomorrow the beach will be strewn with wrack." },
  fog:   { name:"Fog",    icon:"🌫", tone:"#cfd6e0",
    line:"Fog lies in the hollows. The valley has gone very quiet.",
    offer:"The seams read richer — gems come easier in the dark." },
  snow:  { name:"Snow",   icon:"❄", tone:"#e6f6ff",
    line:"Snow settles quietly over the valley.",
    offer:"Frostberries in the meadow. Winter fish fetch a premium. The ground is frozen — your crops still need the can." },
};
// per-season odds; they must sum to 1. Winter trades rain for snow and never storms.
const WEATHER_ODDS = {
  Spring: { clear:0.55, rain:0.30, fog:0.10, storm:0.05 },
  Summer: { clear:0.62, rain:0.22, storm:0.10, fog:0.06 },
  Fall:   { clear:0.48, rain:0.28, fog:0.16, storm:0.08 },
  Winter: { clear:0.45, snow:0.42, fog:0.13 },
};

// ---- TOM'S DEMAND ----
// A village shop can only shift so much of one thing in a day. The first few of any item sell at
// full price; after that the price slides.
//
// This exists to tax SAMENESS, not any particular crop. A farmer who harvests a few tiles each
// morning never notices it. A farmer who DUMPS fifty starfruit at once keeps only about half —
// and, crucially, a night's sleep does NOT wipe the glut clean (it recovers halfway), so
// drip-selling a hoard six at a time no longer sidesteps the whole system.
//
// The free allowance is value-scaled: Tom can move a great many turnips at full price but only a
// handful of luxury goods, so the dearer the item, the sooner its price begins to slide.
// Nothing is ever confiscated — you simply get less for the fortieth identical thing.
const DEMAND = { decay:0.95, floor:0.35, overnight:0.5 };
function demandFree(item){
  const base = ITEM_SELL[item] || 40;
  return Math.max(3, Math.min(14, Math.round(280 / base) + 3));
}
// price multiplier for the (k+1)-th unit of `item` sold today, k = how many already went
function demandMult(item, k){
  const free = demandFree(item);
  if(k < free) return 1;
  return Math.max(DEMAND.floor, Math.pow(DEMAND.decay, k - free + 1));
}

// ---- MASTERY ----
// The 1-99 curve promised mastery and paid out nothing past the last content unlock.
// Four milestones per skill, all small and passive — you feel them, you don't manage them.
const MASTERY = {
  Farming: {
    25: "Deep Roots — watered soil sometimes stays wet overnight",
    50: "Bountiful — crops sometimes yield twice",
    75: "Green Thumb — crops sometimes grow two days in one night",
    99: "Fields of Gold — double yields become common",
  },
  Woodcutting: {
    25: "Easy Swing — some swings cost no energy",
    50: "Clean Fell — every tree gives an extra log",
    75: "Steward — the woods grow back faster",
    99: "One Stroke — an oak falls to a single swing",
  },
  Mining: {
    25: "Sure Grip — some swings cost no energy",
    50: "Rich Seam — veins sometimes give twice",
    75: "Gemcutter — gems are worth far more experience",
    99: "Stonebreaker — no vein takes more than two swings",
  },
  Fishing: {
    25: "Still Water — the fish bite sooner",
    50: "Steady Hand — a taller catch bar",
    75: "Angler's Eye — a far more forgiving perfect catch",
    99: "Deep Caller — your catch sometimes runs bigger",
  },
  Cooking: {
    25: "Second Helping — you sometimes plate two",
    50: "Hearth Warmth — every dish restores more energy",
    75: "Comfort Food — a cooked dish is beloved by anyone who likes cooking",
    99: "Renowned — your cooking fetches a premium",
  },
};

// ---- THE VILLAGE NOTICEBOARD ----
// One request a day, pinned beside Tom's door. Deliver by talking to the villager who asked.
// `lvl` is the rough skill level at which the item becomes obtainable — the board never asks
// for something you couldn't plausibly have. Pay is ~1.4x sell + 25 heart points.
const REQUESTS = [
  { who:"tom",   item:"Wood",        qty:8,  lvl:1,  line:"Shelves again. Always shelves. The shelves are winning." },
  { who:"tom",   item:"Stone",       qty:10, lvl:1,  line:"The step outside is cracked and I've tripped on it twice this week. Only twice. Fine, four times." },
  { who:"tom",   item:"Turnip",      qty:3,  lvl:1,  line:"Somebody asked for turnips. One somebody. I have built an entire order around one somebody." },
  { who:"pip",   item:"Shell",       qty:4,  lvl:1,  line:"I'm making a CROWN. It needs FOUR. Three is a hat and a hat is NOT the same." },
  { who:"maya",  item:"Field Salad", qty:3,  lvl:1,  line:"I'm painting greens and I keep eating my references. It's becoming a problem." },
  { who:"bram",  item:"Sardine",     qty:5,  lvl:1,  line:"Bait. Don't look at me like that — the big ones eat the little ones. That's the arrangement." },
  { who:"tom",   item:"Potato",      qty:4,  lvl:3,  line:"Potatoes keep. Potatoes always keep. A shopkeeper's favourite word is 'keep'." },
  { who:"maya",  item:"Egg",         qty:4,  lvl:1,  line:"Gran's sponge takes four and I've got three, and I am NOT walking to the dairy in this wind." },
  { who:"rowan", item:"Copper Ore",  qty:5,  lvl:10, line:"The hall's brackets are green with age. Copper for copper. It's what the Guild would have done." },
  { who:"pip",   item:"Bass",        qty:2,  lvl:5,  line:"Dad says if I catch one I can keep it. Dad did NOT say who has to catch it." },
  { who:"tom",   item:"Wheat",       qty:5,  lvl:4,  line:"Bread sells. Bread always sells. I'd bake it myself but the last loaf frightened a customer." },
  { who:"bram",  item:"Pine Wood",   qty:4,  lvl:8,  line:"Pine takes the water. For the boats. Don't bring me oak and don't argue with me about it." },
  { who:"maya",  item:"Strawberry",  qty:3,  lvl:10, line:"…No reason. No reason at all. Stop smiling like that." },
  { who:"rowan", item:"Iron Ore",    qty:4,  lvl:20, line:"A hinge on the mining wing. Eleven years it has hung crooked and eleven years it has bothered me." },
  { who:"tom",   item:"Trout",       qty:2,  lvl:12, line:"A gentleman from the coast is coming and I have promised him river fish. I have promised him a great deal." },
  { who:"pip",   item:"Amethyst",    qty:1,  lvl:12, line:"Gary needs a FRIEND. It's not for me. It's for Gary. He gets lonely in the box." },
  { who:"maya",  item:"Carrot",      qty:5,  lvl:6,  line:"Soup for Rowan. He'll say he isn't hungry and then eat the whole pot. He does it every year." },
  { who:"bram",  item:"Salmon",      qty:2,  lvl:20, line:"Not for me. For the smoker. The smoker doesn't care whose hands did the work — and neither do I." },
  { who:"rowan", item:"Emerald",     qty:1,  lvl:20, line:"For the Guild seal. Green for growing. Your grandfather chose that stone and I have never told him I agreed." },
  { who:"tom",   item:"Pumpkin",     qty:2,  lvl:22, line:"Two. Enormous ones. I want them in the window and I want the whole valley to see them." },
];

// ---- TOOLS ----
const TOOLS = ["Hoe", "Can", "Axe", "Pick", "Rod"];
const TOOL_ICON = { Hoe:"hoe", Can:"can", Axe:"axe", Pick:"pick", Rod:"rod" };
// The Star Metal tier (v3.12) is the 4th and final rung. It exists to close the reward-is-an-input
// rule (§3.5): before it, everything The Long Climb (v3.10) added below the surface — Cobalt Ore,
// Star Metal Shard, Silverwood, Heartwood — was sell-only, a pure faucet. This tier CONSUMES all
// four, so the deepest veins and the rarest timber finally forge something. It's a transformative
// unlock (§4.2), not another same-verb bump: a jump in power that only a master miner + woodcutter
// can even gather the materials for.
const TOOL_TIERS = ["Basic", "Copper", "Iron", "Gold", "Star Metal"];
const TIER_POWER = [1, 2, 3, 5, 7];
const MAX_TIER = TOOL_TIERS.length - 1;   // = 4; used everywhere instead of a hardcoded 3
// v3.17 — a tool upgrade now needs SKILL, not just materials + coin. Gathering a pile of ore never
// makes sense as the sole gate for an OP tool; you must have earned the level in that tool's own
// craft. Clean & memorable, matching the ore ladder: Copper at 10, Iron 20, Gold 30, Star Metal 40.
const TOOL_SKILL = { Hoe:"Farming", Can:"Farming", Axe:"Woodcutting", Pick:"Mining", Rod:"Fishing" };
const TIER_LEVEL = [1, 10, 20, 30, 40];   // skill level required to reach each tier (index = tier)
// Tool tiers cost wood + ore + gold — and the top tiers a signature gem / the deep materials — so
// every upgrade needs Mining AND Woodcutting progress (and the Rod's Pearl, the beach). A gold tool
// is an achievement across skills, not a purchase. (Owner playtest 2026-07-12: "right now it's
// mining and gold and then you unlock everything else" — gold alone must never be the universal key.)
const TIER_COST  = [null,
  { g:300,   mats:{ "Copper Ore":5, "Wood":10 } },
  { g:1200,  mats:{ "Iron Ore":5,  "Pine Wood":10 } },
  { g:5000,  mats:{ "Gold Ore":5,  "Maple Wood":10 } },
  { g:12000, mats:{ "Star Metal Shard":4, "Cobalt Ore":8, "Silverwood":8, "Heartwood":4 } }];
const TIER3_GEM  = { Hoe:"Amethyst", Can:"Topaz", Axe:"Emerald", Pick:"Ruby", Rod:"Pearl" };
function toolCost(tool, tier){
  const base = TIER_COST[tier]; if(!base) return null;
  const mats = Object.assign({}, base.mats);
  if(tier === 3 && TIER3_GEM[tool]) mats[TIER3_GEM[tool]] = 1;   // the keepsake set into the handle
  return { g: base.g, mats };
}
const TIER_COL   = ["#b7a48c", "#c77b3f", "#d8c4bc", "#ffd75a", "#bfe4ff"];

// ---- THE OLD LIFT ----
// A rusted lift shaft stands by the entry ladder of every mine floor. Riding UP is always free —
// the counterweight still works; it's the STOPS that rusted. Every 5th floor's stop can be restored
// once, permanently (state.liftStops), with a resource dump made while standing at it. The costs
// deliberately sink wood + ore + gold together — the multi-skill economy in miniature — and the
// deepest stops want a gem, giving gems a life beyond Tom's counter.
function liftStopCost(n){
  if(n === 5)  return { g:500,  mats:{ "Wood":20, "Copper Ore":5 } };
  if(n === 10) return { g:1500, mats:{ "Pine Wood":15, "Iron Ore":5 } };
  if(n === 15) return { g:3000, mats:{ "Maple Wood":10, "Gold Ore":5 } };
  // the deep stops want the deep grove's timber — Elderwood replacing a second helping of maple
  // (Grove Depths Phase 2: the two deep venues feed each other)
  if(n === 20) return { g:6000, mats:{ "Elder Wood":12, "Gold Ore":10, "Diamond":1 } };
  // past 20 the shaft is old beyond reckoning — each deeper stop doubles the 20-cost in gold
  return { g: 6000 * Math.pow(2, (n-20)/5), mats:{ "Elder Wood":12, "Gold Ore":10, "Diamond":1 } };
}

// ---- GROVE DEPTHS ----
// The grove is the axe's mine: nine RINGS of forest, oldest wood westmost, each ring generated
// per ring+day like a mine floor. A DEADFALL seals the way west out of every ring — you chop
// THROUGH it (the door pays you in wood and XP), and its Woodcutting requirement is the ring's
// soft level gate, which is what lets deep rings assume the level for their spawn tables.
// Deadfalls regrow overnight with the forest; waystones are what persist.
const GROVE_RINGS = 9;
const DEADFALL = {  // keyed by the ring the deadfall opens INTO
  2:{lvl:5, hp:10}, 3:{lvl:12, hp:14}, 4:{lvl:20, hp:18}, 5:{lvl:30, hp:24},
  6:{lvl:40, hp:30}, 7:{lvl:52, hp:38}, 8:{lvl:64, hp:46}, 9:{lvl:78, hp:56},
};
// Ring spawn tables — the rarity system the owner asked for: shallow rings are commons,
// deep rings phase them out and rares in. Every ring keeps SOME tree at or under its own
// deadfall gate's level, so nothing you walk into is uniformly unchoppable. A species you
// can't cut yet standing right there IS the design (desire ahead of ability).
const RING_TREES = {
  1:[["oak",.70],["pine",.27],["maple",.03]],
  2:[["oak",.55],["pine",.35],["maple",.10]],
  3:[["oak",.35],["pine",.40],["maple",.17],["willow",.08]],
  4:[["oak",.22],["pine",.34],["maple",.26],["willow",.18]],
  5:[["oak",.12],["pine",.24],["maple",.28],["willow",.26],["elderwood",.10]],
  6:[["oak",.06],["pine",.16],["maple",.26],["willow",.30],["elderwood",.22]],
  7:[["pine",.10],["maple",.20],["willow",.28],["elderwood",.30],["heartwood",.12]],
  8:[["pine",.06],["maple",.14],["willow",.26],["elderwood",.34],["heartwood",.20]],
  9:[["maple",.08],["willow",.20],["elderwood",.34],["heartwood",.26],["silverwood",.12]],   // silverwood (WC 85) — the deepest ring's rarest timber (v3.10)
};
function pickRingTree(ring, r){
  const tbl = RING_TREES[clamp(ring,1,GROVE_RINGS)] || RING_TREES[1];
  for(const [k,w] of tbl){ if((r -= w) < 0) return k; }
  return tbl[tbl.length-1][0];
}
// One ANCIENT tree per ring 5+, per day: a glowing elder of the ring's rarest species — double
// timber, double XP, and (Phase 3) a guaranteed canopy drop. The grove's "something glimmers".
const ANCIENT_MIN_RING = 5;
function ringTopSpecies(ring){ const tbl = RING_TREES[clamp(ring,1,GROVE_RINGS)]; return tbl[tbl.length-1][0]; }

// Waystones: mossy Guild-era standing stones on rings 1/3/6/9. The mouth stone (way1) never
// slept — it's free. The rest wake through the Pledge Ledger below. Once awake, stepping
// between any two awake stones is free, so home is always one interaction from a funded ring.
const WAYSTONE_RING = { way1:1, way3:3, way6:6, way9:9 };
function waystoneCost(id){
  // cross-economy on purpose: the grove's stones want ORE the way the mine's lift wants wood —
  // the two deep venues feed each other. The deep stone takes a Ruby; the deep lift stop
  // already owns the Diamond.
  if(id === "way3") return { g:800,  mats:{ "Copper Ore":10, "Iron Ore":5 } };
  if(id === "way6") return { g:2500, mats:{ "Iron Ore":10, "Gold Ore":5 } };
  if(id === "way9") return { g:6000, mats:{ "Gold Ore":10, "Ruby":1 } };
  return null;   // way1 is already awake
}

// ---- THE PLEDGE LEDGER ----
// The owner's no-wasted-trips rule (DEVLOG 2026-07-13): reaching a restorable thing banks its
// DISCOVERY permanently and for free; the cost is a PLEDGE you fill later, from anywhere, in
// partial deposits, and the ledger — not the player — remembers the remainder. A pledge id is
// "way3"/"way6"/"way9" (waystones) or "lift5"/"lift10"/… (Old Lift stops, retrofitted onto the
// same system). state.pledges[id] = { gPaid, mats:{item:nPaid} }; the record is created on
// discovery/first deposit and deleted on completion — done-ness lives in state.waystones /
// state.liftStops, so all pre-ledger code keeps working unchanged.
function pledgeCost(id){
  if(id.startsWith("way"))  return waystoneCost(id);
  if(id.startsWith("lift")) return liftStopCost(parseInt(id.slice(4), 10));
  return null;
}
function pledgeName(id){
  if(id === "way3") return "the Third-Ring Waystone";
  if(id === "way6") return "the Sixth-Ring Waystone";
  if(id === "way9") return "the Heart Waystone";
  if(id.startsWith("lift")) return "the floor-" + id.slice(4) + " lift stop";
  return id;
}
function pledgePaid(id){ return (state.pledges && state.pledges[id]) || { gPaid:0, mats:{} }; }
function pledgeRemaining(id){
  const c = pledgeCost(id); if(!c) return { g:0, mats:{} };
  const p = pledgePaid(id);
  const rem = { g: Math.max(0, c.g - (p.gPaid||0)), mats:{} };
  for(const it in c.mats){ const r = c.mats[it] - ((p.mats||{})[it]||0); if(r > 0) rem.mats[it] = r; }
  return rem;
}
function pledgeFunded(id){ const r = pledgeRemaining(id); return r.g <= 0 && !Object.keys(r.mats).length; }
function pledgeDone(id){
  if(id.startsWith("way"))  return id === "way1" || (state.waystones||[]).includes(id);
  if(id.startsWith("lift")) return (state.liftStops||[]).includes(parseInt(id.slice(4), 10));
  return false;
}
function pledgeDiscovered(id){
  if(pledgeDone(id)) return true;
  if(id.startsWith("way"))  return !!(state.pledges && state.pledges[id]);   // touched the stone once
  if(id.startsWith("lift")) return (state.mineBest||0) >= parseInt(id.slice(4), 10);  // reached the floor once
  return false;
}
// Everything the Journal's Restorations section should list, in display order.
// Lift stops are discovered by DERIVATION — mineBest ≥ n means you stood on that floor once —
// so old saves backfill retroactively with zero migration. Listing stops at mineBest keeps the
// doubling series past floor 20 from rendering to infinity.
function ledgerPledges(){
  const out = [];
  for(const id of ["way3","way6","way9"]) if(pledgeDiscovered(id)) out.push(id);
  for(let n = 5; n <= (state.mineBest||0); n += 5) out.push("lift"+n);
  return out;
}

// ---- CANOPY NESTS & CHARMS (Grove Depths Phase 3) ----
// RuneScape's birds' nests, grown here: felling a grove tree sometimes shakes something loose.
// The gem lesson (2026-07-12) applies with teeth — treasure must have USES, not resale value,
// or it's another economy faucet. So a charm's value is a SMALL passive while worn (one worn at
// a time, the Grandpa's-Pin pattern), sell prices stay modest, and the common tier feeds
// farming (seeds), not the wallet.
const CHARMS = {
  "Wren Feather Charm":  { sell:120, effect:"+5% Woodcutting XP while worn" },
  "Acorn Ring":          { sell:120, effect:"an extra log, now and then" },
  "Moss Locket":         { sell:120, effect:"forage sometimes comes up double" },
  "Amber Beetle":        { sell:150, effect:"+5% Mining XP while worn" },
  "Lantern Charm":       { sell:100, effect:"your light reaches a little farther" },
  "The Forester's Band": { sell:0,   effect:"+8% Woodcutting XP and an extra log, now and then" },  // once per valley
};
for(const c in CHARMS) ITEM_SELL[c] = CHARMS[c].sell;
function charmActive(name){ return state.charm === name && (state.inv[name]||0) > 0; }
// Nest odds: ~4.5% base, deeper rings a touch kinder, and the canopy answers the weather the
// way the seams do (fog reads rich here too).
function nestChance(ring){
  const wx = isFog() ? 1.6 : isStorm() ? 1.3 : 1;
  return Math.min(0.12, (0.045 + ring*0.004) * wx);
}

// ---- NPCS ----
const NPCS = {
  maya: { name:"Maya",  loved:["Strawberry","Golden Koi"], likes:["Cooked","Starfruit","Carrot"] },
  tom:  { name:"Tom" },
};

// Maya's dialogue by heart tier (0..5)
const MAYA_LINES = [
  "Oh! You must be the one who took over the old farm. I'm Maya. It's... good to have someone here again. The valley's been so quiet.",
  "The pond's lovely at dusk. My dad used to fish Golden Koi there, back when the Guild was still open.",
  "You've been working so hard — I can see it. The fields look alive again. It's like the whole valley is waking up.",
  "I saved a bench for us at the old festival grounds. Maybe one day there'll be a festival again. I'd like that.",
  "Honestly? The days feel warmer when you wander by. Don't you dare tell Tom I said that. ♥",
  "You did all this. From weeds and dust, you made a home. I'm really glad you stayed... I'm glad I'm here with you. ♥",
];

const TOM_GREET = [
  "Welcome, welcome! Coin for goods, goods for coin — that's the Tom guarantee.",
  "Fresh stock today! Well... the same stock. But I dusted it.",
  "You bring me the best crops in the valley, you know that? Keep 'em coming.",
];

// ---- QUEST CHAIN (the story spine) ----
// obj kinds: {stat,goal} | {level:{skill,n}} | {heart:n} | {gold:n}
//            | {totalLevel:n} | {talk:npcId} | {mineDepth:n} | {flag:name}
const QUESTS = [
  { id:"first-sprout", title:"First Sprout", giver:"Grandpa's Letter",
    desc:"“Tend it, and it'll tend to you.” Wake the soil in the plot below your cottage.",
    obj:[ {text:"Till a patch of soil", stat:"tilled", goal:1},
          {text:"Plant a seed", stat:"planted", goal:1},
          {text:"Water your crop", stat:"watered", goal:1} ],
    reward:{ gold:60, items:{"Turnip Seeds":4}, msg:"Grandpa tucked seeds into the envelope." } },

  { id:"good-harvest", title:"A Good Harvest", giver:"Grandpa's Letter",
    desc:"Patience, sun, and water. Bring in your very first crops.",
    obj:[ {text:"Harvest 3 crops", stat:"harvested", goal:3} ],
    reward:{ gold:120, items:{"Carrot Seeds":3}, msg:"Word spreads; Tom sends carrot seeds." } },

  { id:"meet-tom", title:"Coin & Company", giver:"Tom",
    desc:"A valley is its people. Step inside Tom's store, east down the road, and let him talk your ear off.",
    obj:[ {text:"Visit Tom's store & say hello", talk:"tom"},
          {text:"Sell him the valley's good things — 250g earned", stat:"earned", goal:250} ],
    reward:{ gold:100, items:{"Berry Bun":3}, msg:"“First proper trade this counter's seen in months.” Tom rounds up, with a wink." } },

  { id:"old-keeper", title:"The Old Keeper", giver:"Willowbrook",
    desc:"An old man keeps the shuttered Guild Hall in the north of town. Go and hear him out.",
    obj:[ {text:"Speak with Elder Rowan at the Guild Hall", talk:"rowan"} ],
    reward:{ gold:80, items:{"Guild Seal":1}, msg:"Rowan presses a worn Guild Seal into your hand." } },

  { id:"neighborly", title:"Neighborly", giver:"Maya",
    desc:"Maya walks the south meadow by day. A valley grows warmer with friends.",
    obj:[ {text:"Reach 2 hearts with Maya", heart:2} ],
    reward:{ gold:120, items:{"Strawberry Seeds":3}, msg:"Strawberries — her favorite, if you were wondering." } },

  { id:"prove-crafts", title:"Prove the Crafts", giver:"Elder Rowan",
    desc:"“Anyone can hold a seal. Show me the crafts still live in someone's hands — the field, the axe, the pick. Then we'll talk about wings.”",
    obj:[ {text:"Show him a farmer's hands — Farming 10", level:{skill:"Farming",n:10}},
          {text:"Show him a forester's swing — Woodcutting 8", level:{skill:"Woodcutting",n:8}},
          {text:"Show him a miner's eye — Mining 8", level:{skill:"Mining",n:8}} ],
    reward:{ gold:250, items:{"Iron Ore":4}, msg:"Rowan stands at the wall a long moment. Three wings, flickering. “Well,” he says. “Well.”" } },

  { id:"the-coast", title:"Salt & Silver", giver:"Bram",
    desc:"Follow the village's south path to the coast. An old fisher tends the Fishing wing — mostly by ignoring it, and everyone else.",
    obj:[ {text:"Meet Bram at the coast", talk:"bram"},
          {text:"Fish beside him until he nods — Fishing 10", level:{skill:"Fishing",n:10}} ],
    reward:{ gold:300, items:{"Cooked Salmon":2}, msg:"Bram grunts. From him, that's a medal." } },

  { id:"into-deep", title:"Into the Deep", giver:"Elder Rowan",
    desc:"“The mine remembers the Guild's founding — it's all still down there, past the easy seams. Go deep enough that the mountain learns your name.”",
    obj:[ {text:"Go down past the easy seams — mine floor 5", mineDepth:5},
          {text:"Swing until the mountain knows you — 25 rocks mined", stat:"mined", goal:25} ],
    reward:{ gold:300, items:{"Gold Ore":3}, msg:"“Deep enough,” Rowan says, and for a moment he looks young. “Now I can tell you what's down there.”" } },

  { id:"star-metal", title:"The Founding Gift", giver:"Elder Rowan",
    desc:"Deep in the mine a sealed vault holds Star Metal — the Guild's heart. Break it open (Mining 20) and recover it.",
    obj:[ {text:"Recover the Star Metal from the vault", flag:"foundVault"} ],
    reward:{ gold:400, items:{"Emerald":1}, msg:"The Mining wing blazes to life." } },

  { id:"master-tools", title:"Master Smith", giver:"Tom",
    desc:"“Your grandpa's kit got him by, bless him — but the Guild deserves better iron. Bring me the makings and we'll build you something worthy.”",
    obj:[ {text:"Let Tom improve your kit — 3 tool upgrades", stat:"toolUpgrades", goal:3} ],
    reward:{ gold:250, items:{"Gold Ore":3}, msg:"Tom turns the tool over twice and whistles. “Now THAT would've made your grandpa jealous.”" } },

  { id:"wake-valley", title:"Wake the Valley", giver:"The Valley",
    desc:"They said Willowbrook was finished. Light every wing and bring the Grand Festival back to the coast.",
    obj:[ {text:"Let every craft live in you — total level 60", totalLevel:60},
          {text:"Let Maya believe it's real — 4 hearts", heart:4},
          {text:"Recover the Star Metal", flag:"foundVault"} ],
    reward:{ gold:2000, msg:"Lanterns rise over the water. The valley is awake — and it's yours." },
    finale:true },

  // ---------- ACT TWO: the empty chair ----------
  { id:"long-way-home", title:"The Long Way Home", giver:"Elder Rowan",
    desc:"The lanterns are lit and the valley is whole — save for one empty chair. Rowan would like a word.",
    obj:[ {text:"Light the lanterns at the Grand Festival", flag:"festivalDone"},
          {text:"Learn what Bram has been carrying", flag:"knowsElias"} ],
    reward:{ gold:200, msg:"Rowan asks you to do a hard, kind thing." },
    act2:true },

  { id:"driftwood", title:"Driftwood & Waxed Paper", giver:"Bram",
    desc:"“If the festival ever comes back… I'll make them again.” Bring Bram the wood for his water lanterns.",
    obj:[ {text:"Bring 12 Wood", item:"Wood", n:12},
          {text:"Bring 3 Pine Wood", item:"Pine Wood", n:3} ],
    reward:{ gold:250, msg:"Bram's hands remember the folds." },
    act2:true },

  { id:"coast-road", title:"The Coast Road", giver:"Maya",
    desc:"Forty miles north, a ferryman has spent eleven years counting the days he didn't come home.",
    obj:[ {text:"Reach 5 hearts with Maya", heart:5},
          {text:"Bram folds the water lanterns", flag:"lanternsFolded"} ],
    reward:{ gold:500, msg:"" },
    act2:true },
];
const FINALE_IDX = QUESTS.findIndex(q => q.finale);

// ---- HOW TO PLAY ----
// One source of truth for the reference text, shown on the title screen (showHowto) AND inside
// the in-game Journal (so a playing player can actually consult it — the NPX moved it in-world).
const HOWTO_TEXT =
"Move with WASD or the arrow keys.\n\n" +
"Space uses your selected tool on the tile you face:\n" +
"• Hoe tills soil  • Watering Can waters it  • Seeds plant a crop\n" +
"• Axe chops trees  • Pick mines rock  • Rod fishes water\n\n" +
"E interacts — harvest crops, talk to folk, open doors, cook, and step inside your cottage to sleep in your bed and pass the night.\n\n" +
"Fishing: cast with the Rod, wait for the !, then press Space to hook it. Now HOLD Space to raise the green bar and keep the fish inside it — let it slip and the line goes slack. Land one cleanly for a perfect catch.\n\n" +
"Explore! The east road leads to the village — shops, the Guild, and your neighbours. The old mine opens on the village's north ridge, the coast lies down its south path, and the Deep Grove waits through the farm's western trees. Keep hens in the coop and cows in the barn — visit them each morning.\n\n" +
"Read the sky. Tomorrow's weather is chalked on the noticeboard every evening, and each kind of day offers something the others don't — rain doubles your foraging and brings the fish up; a storm shuts the coast but drives the veins, and leaves wrack on the sand the morning after; fog makes the deep seams read rich. Sleep through a day and you miss what it was offering. Nothing is ever lost.\n\n" +
"Tom can only shift so much of one thing a day. Sell forty of the same crop and the price slides; bring him variety and it doesn't. Watch the price in his shop before you sell.\n\n" +
"Bram knows five fish that rise only when everything lines up — the right water, the right hour, the right weather, the right season. He'll tell you about one for every heart you earn, and the Almanac remembers.\n\n" +
"Saplings and beehives go in open ground (press R to select one, then Space). A tree takes a season to bear, then bears every day of its season, forever. Bees make more honey where more is in bloom.\n\n" +
"The valley keeps a calendar. Four festivals return every year — be on the coast on the day, and bring something (Bram's Luau wants a fish; the Harvest Fair judges the best crop you've sold that season). Everyone has a birthday, too: a gift on the day is worth three. Check the Almanac in your Journal (J).\n\n" +
"A noticeboard stands by Tom's door. Each morning someone in the valley wants something small — bring it to them for good coin and warmer feelings. It's never required, and it's gone by dawn.\n\n" +
"Your grandfather tore up his old almanac and left the pages where he lived. You'll find them by working the way he worked. Nine in all, and the last one isn't a page about farming.\n\n" +
"Every skill keeps paying past its last unlock: mastery lands at 25, 50, 75 and 99. And when your coin outgrows your needs, read the ledger on Rowan's desk — the valley has unfinished work.\n\n" +
"Give your neighbours time and gifts and they'll open up — each has scenes of their own. Two of them might one day accept a Willowbrook bouquet.\n\n" +
"Sell at Tom's stall, buy seeds and upgrade tools. Every action trains a skill from 1 to 99. Follow the tasks in your Journal (J) to wake the valley.\n\n" +
"R cycles seeds · F eats food · G gifts Maya · K skills · I backpack";

// ---- EXAMINE TEXT (RuneScape-style "look" flavor; generated, then hand-tuned) ----
const EXAMINE = {
  "Turnip": "A turnip. Spring's least ambitious vegetable.",
  "Potato": "Knobbly, dependable, and wearing good honest dirt.",
  "Wheat": "Golden stalks, still whispering about the summer wind.",
  "Carrot": "It grew in the dark and turned out fine.",
  "Strawberry": "Red, sweet, and gone before it reaches the shop.",
  "Blueberry": "Small blue summers, clustered on the bush.",
  "Tomato": "Technically a fruit, and never lets anyone forget.",
  "Corn": "A cob of corn, every kernel accounted for.",
  "Cranberry": "Bright, tart, and downright hostile eaten raw.",
  "Pumpkin": "Big, orange, and taking up the whole cart.",
  "Starfruit": "Summer's rare prize, glowing like it knows its worth.",
  "Frostbloom": "The only flower brave enough for winter.",
  "Rhubarb": "Tart red stalks — sour raw, wonderful with a little sugar.",
  "Melon": "Heavy, green-ribbed, and sloshing faintly when you lift it.",
  "Artichoke": "All armour and no apology, until you get to the heart.",
  "Grape": "A heavy bunch, dusty-sweet, half of them gone before the cart.",
  "Yam": "Knobbled and honest — sweetest after the first frost threatens.",
  "Everbloom": "It flowers in deep winter and doesn't seem to know it shouldn't.",
  "Turnip Seeds": "Tiny promises of a very quick vegetable.",
  "Potato Seeds": "Little eyes, already dreaming of the dark soil.",
  "Wheat Seeds": "A handful of grain and a summer's patience.",
  "Carrot Seeds": "Small enough to lose, stubborn enough to grow.",
  "Strawberry Seeds": "Specks that somehow become something sweet.",
  "Blueberry Seeds": "Modest seeds hiding a whole summer of blue.",
  "Tomato Seeds": "Flat little seeds with big red ambitions.",
  "Corn Seeds": "Dried kernels, waiting to stand tall again.",
  "Cranberry Seeds": "Small seeds that prefer their feet wet.",
  "Pumpkin Seeds": "Pale seeds, and a promise of something enormous.",
  "Starfruit Seeds": "Rare seeds worth more than most whole crops.",
  "Frostbloom Seeds": "Seeds that sleep until the cold wakes them.",
  "Rhubarb Seeds": "Crowns, really — plant them and stand well back.",
  "Melon Seeds": "Flat pale seeds with a whole lazy summer inside.",
  "Artichoke Seeds": "Spiky little things, already looking defensive.",
  "Grape Seeds": "Pips saved from a very good year.",
  "Yam Seeds": "Knobbly starts for a knobbly, patient root.",
  "Everbloom Seeds": "They only ever sprout when the frost is deepest.",
  "Cherry": "Spring's sweetest, and it lasts the whole season through.",
  "Plum": "Dusky and soft, heavy with summer.",
  "Apple": "Crisp, red, and autumn in a single bite.",
  "Sardine": "Small, silver, and rarely the last one eaten.",
  "Bass": "A broad green fish that fights for its dignity.",
  "Trout": "A speckled river fish, all muscle and current.",
  "Salmon": "Fresh off the sea-run, still tasting of salt.",
  "Golden Koi": "A ribbon of gold that haunts the pond at dusk.",
  "Moonperch": "Pale and cold-eyed; it only rises where the water runs deep.",
  "Silvergill": "So bright it seems lit from within — a mirror with fins.",
  "Gulf Sturgeon": "Ancient, armoured, and heavier than any two ordinary fish.",
  "Coelacanth": "A living fossil. It was old when the valley was young.",
  "Cooked Sardine": "Fried whole, and crunched from head to tail.",
  "Cooked Bass": "Firm white flakes, honestly earned.",
  "Cooked Trout": "Pan-browned and river-sweet.",
  "Cooked Salmon": "Rich and rosy — Bram's idea of a medal.",
  "Cooked Golden Koi": "Almost a shame to eat something so gold.",
  "Cooked Moonperch": "Firm, cold-water flesh, sweeter than it has any right to be.",
  "Cooked Silvergill": "Delicate to the point of showing off.",
  "Cooked Gulf Sturgeon": "A steak, really. It could feed the whole plaza.",
  "Cooked Coelacanth": "You cooked a living fossil. The valley will talk for weeks.",
  "Sunfleck": "It only shows at spring dawn. This one showed.",
  "Moonscale": "Only the summer midnight ever gives one up.",
  "Whitefin": "Comes in on the fall fog, when no one's looking.",
  "Frostjaw": "Ugly as a winter dawn, and priced like a gem.",
  "Stormrider": "It rode the storm up the stream, just as he swore.",
  "Wood": "Ordinary wood, still smelling faintly of the tree.",
  "Pine Wood": "Pale and resinous; it never quite loses its scent.",
  "Maple Wood": "Warm reddish grain, prized by those who build to last.",
  "Silverwood": "Pale as moonlight and lighter than it looks — the deep grove's rarest timber.",
  "Stone": "A plain grey stone, patient as the valley itself.",
  "Copper Ore": "Dull green-brown rock hiding a hint of shine.",
  "Iron Ore": "Heavier than it looks, and rusting already.",
  "Gold Ore": "Even in the rough, it catches the lantern light.",
  "Cobalt Ore": "A cold blue metal from the deep floors — it rings when you tap it.",
  "Star Metal Shard": "A splinter of the vault's own metal, humming with a faint blue light.",
  "Staircase": "A folding rig of ladder and plank. Drop it down a shaft and you're three floors deeper in a blink.",
  "Amethyst": "A purple gem the mine kept to itself for ages.",
  "Topaz": "Warm as bottled afternoon sun.",
  "Emerald": "Green as the valley on its best morning.",
  "Ruby": "A deep red gem, quietly showing off.",
  "Diamond": "The mine's finest work, clear straight through.",
  "Shell": "The sea gave it up without much of a fight.",
  "Coral": "A little branch of the reef, gone still and pink.",
  "Seaweed": "A salty green tangle the tide left behind.",
  "Clam": "Shut tight, keeping whatever secrets clams keep.",
  "Pearl": "The beach's rarest gift, pale and perfectly round.",
  "Fried Egg": "A yolk like a small gold coin.",
  "Baked Potato": "A potato, baked. The valley's plainest comfort.",
  "Bread": "A warm loaf, plain and good.",
  "Garden Salad": "Green things, arranged with mild ambition.",
  "Berry Jam": "Summer, caught and sealed in a jar.",
  "Corn Bread": "Golden and crumbly, best while it's warm.",
  "Tomato Soup": "Red and warm, and asking for bread.",
  "Blueberry Tart": "The berries have stained the crust purple.",
  "Pumpkin Soup": "Thick, orange, and faintly of nutmeg.",
  "Farmer's Omelette": "Everything the coop spared, folded in half.",
  "Fish Stew": "Even Bram would nod at this one.",
  "Cranberry Sauce": "Tart enough to wake the whole table.",
  "Frostbloom Tea": "Steam on the window while snow falls outside.",
  "Rhubarb Pie": "Sweet-tart under a golden lid — best still warm from the oven.",
  "Melon Sorbet": "Cold, pale green, and gone in about four spoonfuls.",
  "Stuffed Artichoke": "Fiddly to make, and worth every leaf.",
  "Grape Tart": "Glossy dark fruit on butter pastry. A little showy, honestly.",
  "Harvest Roast": "Roots and roast, the whole of autumn on one plate.",
  "Fisherman's Pie": "Bram's mother's recipe, more or less. He'd never admit it.",
  "Everbloom Cordial": "Winter's only flower, bottled bright. It tastes like a held breath.",
  "Grand Feast": "The whole valley's best on one table — land, sea, and the long climb it took to set it.",
  "Field Salad": "Wild greens, gathered along the lane.",
  "Frostberry": "It ripens only when everything else sleeps.",
  "Berry Bun": "Pip's favourite thing in the entire world.",
  "Honey": "Amber, slow, and borrowed from the bees.",
  "Egg": "One egg, still warm from the nest.",
  "Large Egg": "A generous egg from a contented hen.",
  "Milk": "A pail of white, still faintly warm.",
  "Large Milk": "A brimming pail from a well-loved cow.",
  "Wool": "Soft, warm, and freshly off the sheep.",
  "Prize Fleece": "The finest coat in the valley — only a truly cherished sheep grows one.",
  "Shears": "Well-oiled, sharp, and shepherd-approved. A sheep never minds.",
  "Star Metal": "Star-fallen metal that slept in the vault; the Guild's forge wakes with it.",
  "Guild Seal": "Proof a craft was mastered, not merely attempted.",
  "Bouquet": "A Willowbrook bouquet, carried straight to one particular door.",
  "Grandpa's Guild Pin": "Grandpa's old pin, worn smooth by a thumb that hoped.",
  "Bram's Oilskin": "Bram's coat: thirty years of weather it simply refused to let in.",
  "Willow Wood": "Quick-grown and kind to the axe. The foresters trained on willow.",
  "Elder Wood": "Blue-grained timber from the old grove. The deep works were built of this.",
  "Heartwood": "Dense, pale, and faintly warm. A tree carries this for a hundred years.",
  "Wren Feather Charm": "A wren's tail-feather in a twist of copper wire. Wear it and the axe listens.",
  "Acorn Ring": "An acorn cap ringed in silver. Every so often, the tree gives one more.",
  "Moss Locket": "Old moss pressed under glass. The undergrowth treats you as a friend.",
  "Amber Beetle": "A beetle older than the Guild, asleep in amber. It dreams of deep stone.",
  "Lantern Charm": "A firefly's worth of glass. Your light carries a little farther.",
  "The Forester's Band": "The old forester's own ring, willow-leaf worked in gold. The whole wood remembers it.",
};
const EXAMINE_OBJ = {
  "bed": "The quilt is worn thin and warmer for it.",
  "campfire": "A ring of stones around a friendly little blaze.",
  "stove": "Cast iron, and always hungry for firewood.",
  "fireplace": "The hearth where the long evenings are spent.",
  "counter": "Tom leans here when the shop is slow.",
  "stall": "Planks and a striped awning, open for trade.",
  "shipbin": "Whatever goes in tonight is sold by morning.",
  "sign": "It points the way, for those who can't decide.",
  "noticeboard": "The valley's small wants, pinned and fluttering.",
  "ledger": "Rowan's book of all the valley could be again.",
  "fountain": "It runs again, which is its own small news.",
  "boardwalk": "The way onto the coast, planked and lantern-lit.",
  "railcart": "It rattles the old rails, both directions.",
  "memorial": "Grandpa's standing stone, quiet at the field's edge.",
  "berrybush": "Heavy with berries, generous as ever.",
  "frostberry": "Only winter coaxes these pale berries out.",
  "fruittree": "Fruit ripens in its own unhurried time.",
  "beehive": "The hum inside means honey is coming.",
  "torch": "A rag of flame against the dark.",
  "lamp": "It keeps a small circle of night at bay.",
  "lantern": "A pool of warm light, swinging gently.",
  "crystal": "It glows with a light no one lit.",
  "gemrock": "Something bright is hiding in the stone.",
  "sealeddoor": "The deep vault, shut and waiting on the Star-Metal.",
  "wing": "One of the Guild's nine craft-halls, patient and proud.",
  "banner": "The Guild's colours, hung out again at last.",
  "ladder": "Down into the dark, one rung at a time.",
  "lift": "The Guild's old lift. The counterweight still works; the stops are what rusted.",
  "olddoor": "Nailed shut. The dust is old; the nails aren't.",
};
const EXAMINE_NPC = {
  "maya": "Always paints the valley greener than it is; lately it obliges.",
  "tom": "Sells the whole valley back to itself, cheerfully, at a markup.",
  "rowan": "Keeps the Guild's keys long after the Guild went quiet.",
  "bram": "An old fisher who believed the legends only once he'd hooked them.",
  "pip": "A valley kid, mostly powered by Berry Buns.",
  "elias": "A quiet man the valley kept a chair for, all those years.",
};
const EXAMINE_TILE = {
  "GRASS": "Ordinary green, and none the worse for it.",
  "DIRT": "Bare earth, waiting on a hoe.",
  "TILLED": "Turned and ready for whatever's planted.",
  "WATERED": "Dark and damp, just how seeds like it.",
  "WATER": "Cool, clear, and full of fish.",
  "PATH": "Worn smooth by generations of boots.",
  "SAND": "Warm underfoot, and gets everywhere.",
  "TALLGRASS": "It hides small things and rustles at nothing.",
  "FLOWERGRASS": "Wildflowers have made themselves at home here.",
  "BRIDGE": "Old planks over the water, still sound.",
};
// the Cellar's products each get a word too (generated — one warm voice, every crop covered)
(function(){
  const all = Object.values(CROPS).map(c=>c.name).concat(Object.values(FRUIT_TREES).map(t=>t.fruit));
  for(const n of all){
    EXAMINE[n+" Wine"] = `Three days in the barrel, and the ${n.toLowerCase()} learned patience.`;
    EXAMINE[n+" Jam"]  = `${n}, kept the old way — under a lid, for later.`;
  }
  EXAMINE["Keg"] = "It ages whatever you trust it with.";
  EXAMINE["Preserves Jar"] = "A crock with a patient lid.";
  EXAMINE_OBJ["keg"] = "Something in there is taking its time.";
  EXAMINE_OBJ["jar"] = "The lid says: not yet.";
  EXAMINE_OBJ["bench"] = "Worn smooth by years of sitting. Still room for one more.";
  EXAMINE_OBJ["plantpot"] = "Someone tends these — the blooms are always fresh.";
  // décor (v3.13): the placed pieces read back their catalogue blurb (OBJ_TITLE set in 08-actions.js,
  // where that map lives — it isn't defined yet during this file's load)
  for(const k in DECOR){ EXAMINE_OBJ[k] = DECOR[k].blurb; EXAMINE[DECOR[k].name] = DECOR[k].blurb; }
})();
