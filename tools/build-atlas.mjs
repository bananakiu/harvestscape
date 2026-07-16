#!/usr/bin/env node
/* ============================================================
   build-atlas.mjs — generates GAME_ATLAS.html from the LIVE game data.

   Why a generator: the atlas is the owner's "see the whole game without
   playing it" document. If it were hand-written it would drift from the
   build within a release. Instead this script evaluates the real data
   files (00-core, 01-data, 13-content, 14-story, 11-title) in a node vm
   with browser stubs, extracts every table, and renders the page.

   Run after ANY content change:   node tools/build-atlas.mjs
   Output:                          GAME_ATLAS.html (repo root, the current build)
                                    atlas/v<version>.html (versioned snapshot)
                                    atlas/index.html (regenerated list of snapshots)

   Every run also writes a snapshot named after the build's own VERSION,
   so each release leaves a permanent record of the game's state — the
   owner's "reference for what the state of the game is" per version.
   Regenerating within the same version just refreshes that snapshot.

   Retro-generation (backfill a past release):
     git archive v2.3.0 game/js | tar -x -C /tmp/v230
     node tools/build-atlas.mjs --src /tmp/v230/game/js
   With --src, only the atlas/ snapshot is written (the root file keeps
   tracking the current build), missing data degrades to a note instead
   of failing, and the footer marks the page as retro-generated.

   The few hand-written mappings in here (wing requirements, almanac page
   triggers, map access notes) are guarded by assertions that THROW when
   the game data they describe changes shape — so the generator fails
   loudly instead of publishing stale prose. (With --src they downgrade
   to warnings: a past release can't be edited to satisfy them.)
   ============================================================ */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import url from "node:url";

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const srcFlag = argv.indexOf("--src");
const RETRO = srcFlag >= 0;                       // generating a PAST release from --src
const SRC_DIR = RETRO ? path.resolve(argv[srcFlag + 1]) : path.join(ROOT, "game", "js");
const GAME_FILES = ["00-core.js", "01-data.js", "04-world.js", "13-content.js", "14-story.js", "11-title.js"]
  .map(f => path.join(SRC_DIR, f))
  .filter(f => fs.existsSync(f));                 // older builds may predate a module

/* ---------------- load the game data in a sandbox ---------------- */
function makeEl(){
  return {
    classList: { add(){}, remove(){}, toggle(){}, contains: () => false },
    style: {}, textContent: "", innerHTML: "",
    getContext: () => ({}),
    addEventListener(){}, removeEventListener(){},
    appendChild(){}, querySelector: () => makeEl(),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }),
  };
}
const sandbox = {
  console,
  document: { getElementById: () => makeEl(), createElement: () => makeEl(), addEventListener(){} },
  localStorage: { getItem: () => null, setItem(){}, removeItem(){} },
  navigator: { userAgent: "", maxTouchPoints: 0 },
  matchMedia: () => ({ matches: false, addEventListener(){} }),
  requestAnimationFrame: () => 0,
  setTimeout: () => 0, clearTimeout(){}, setInterval: () => 0, clearInterval(){},
};
sandbox.window = sandbox;
sandbox.window.addEventListener = () => {};

// Every key except VERSION goes through __opt: a past build that predates a system
// (or a future rename) yields null there, and the renderer degrades to a note.
const PLAIN_KEYS = ["SEASONS", "SEASON_DAYS", "FESTIVALS", "BIRTHDAYS",
  "CROPS", "TREES", "ORES", "FISH", "FRUIT_TREES", "TREE_MATURE_DAYS", "TREE_FRUIT_CAP",
  "HIVE_COST", "HIVE_RADIUS", "HIVE_CAP", "HIVE_MAX",
  "WATER", "LEGENDS", "ITEM_SELL", "GEM_SELL", "SHORE",
  "RECIPES", "PROJECTS", "WEATHERS", "WEATHER_ODDS",
  "MASTERY", "MASTERY_NPC", "REQUESTS", "TOOLS", "TOOL_TIERS", "TIER_POWER", "TIER_COST",
  "QUESTS", "FINALE_IDX", "XP_TABLE", "NPCDEF", "NPC_LINES",
  "HEART_EVENTS", "MARRIAGE_SCENES", "FESTIVAL_SCENES", "JOURNAL_PAGES"];
const src = GAME_FILES.map(f => fs.readFileSync(f, "utf8")).join("\n;\n") + `
;const __opt = n => { try { return eval(n); } catch(e){ return null; } };
globalThis.__DATA__ = JSON.stringify({
  VERSION,
  ${PLAIN_KEYS.map(k => `${k}: __opt("${k}")`).join(",\n  ")},
  MAPS: __opt("MAPS") && Object.fromEntries(Object.entries(MAPS).map(([k,v]) =>
    [k, { w:v.w, h:v.h, outdoor:!!v.outdoor, name:v.name, subtitle:v.subtitle||"" }])),
  WINGS: __opt("WINGS") && WINGS.map(w => ({ id:w.id, name:w.name })),
  LETTERS: {
    intro: __opt("LETTER"), chest: __opt("LETTER_CHEST"), rowan: __opt("LETTER_ROWAN"),
    unsent: __opt("LETTER_ROWAN_UNSENT"), memorial: __opt("LETTER_MEMORIAL"), festival: __opt("LETTER_FESTIVAL"),
  },
});`;
vm.runInNewContext(src, sandbox, { filename: "harvestscape-data.js" });
const D = JSON.parse(sandbox.__DATA__);

/* ---------------- hand-written mappings, assertion-guarded ---------------- */
// How each Guild wing lights (WINGS.lit closures can't be serialized; mirror them here).
const WING_REQ = {
  farming: "Reach Farming 10", woodcutting: "Reach Woodcutting 8", mining: "Reach Mining 8",
  fishing: "Reach Fishing 8", cooking: "Cook 8 dishes", ranching: "Keep at least one hen",
  foraging: "Forage 10 wild finds", smithing: "Upgrade tools twice",
  hearth: "Hold the Grand Festival",
};
// Hard failures for the current build; warnings for retro snapshots (can't edit the past).
const stale = msg => { if (RETRO) console.warn("  warn: " + msg); else throw new Error(msg); };
if (D.WINGS && (D.WINGS.length !== 9 || !D.WINGS.every(w => WING_REQ[w.id])))
  stale("WINGS changed — update WING_REQ in build-atlas.mjs");

// How each almanac page is found (mirrors the queuePage call sites).
const PAGE_TRIGGER = {
  1: "Till your first patch of soil",
  2: "Reach mine floor 3",
  3: "Chop down a pine",
  4: "Catch a salmon",
  5: "Visit the Guild with five wings lit",
  6: "Wake to a rainy morning",
  7: "Give a neighbour a gift",
  8: "Open the vault (Mining 20)",
  9: "The morning after the memorial, with all eight pages found — slipped under the cottage door",
};
if (D.JOURNAL_PAGES && (D.JOURNAL_PAGES.length !== 9 || !D.JOURNAL_PAGES.every(p => PAGE_TRIGGER[p.n])))
  stale("JOURNAL_PAGES changed — update PAGE_TRIGGER in build-atlas.mjs");

// How each map is reached (mirrors the warps laid down by the generators).
const MAP_ACCESS = {
  farm: "Where you wake on day 1 — and since v3, purely a farm: fields, both ponds, the meadow, the southwest woods. The east road leads to the village; the Grove path west.",
  village: "East road from the farm. The valley's hub since v3: the plaza (fountain, lamps), Tom's store + noticeboard, the Aldermans', the Guild hall, two neighbour houses — with the mine off its north ridge and the coast down its south path. Maya and Pip stroll the plaza by day.",
  cottage: "Your front door, on the farm. Sleep here to pass the night; the chest holds a letter, later.",
  coop: "On the farm — houses up to 6 hens (300g each at Tom's).",
  barn: "On the farm — houses up to 4 cows (600g) and up to 4 sheep (500g) at Tom's; shear wool with shears (250g).",
  store: "On the village plaza. Selling, seeds, tools, animals, saplings, hives — and the noticeboard by the door.",
  mayahouse: "On the village plaza. Maya's home (and later, Elias's tea by the pond).",
  guild: "North of the village plaza. Elder Rowan keeps the nine dark wings; the story's heart.",
  mine: "The village's north ridge. Endless floors, regenerated daily. The Old Lift beside each floor's ladder rides to the surface free; every 5th floor's stop can be restored (wood + ore + gold) to skip down forever. Time stands still underground. The sealed vault waits below (Mining 20).",
  beach: "The village's south path. Bram's coast — salmon water, shore forage, festivals, and every finale.",
  coastroad: "East along the shore from the coast (v3.36). The Gullwater river and its estuary — river fishing's home water — the plank ford, roadside forage (samphire, sea holly), and the old ferry landing where the milestone reads MARROW POINT — 39. Elias walks up every fourth day. The road runs on north; the map never will.",
  grove: "West, through the farm's treeline. Nine rings of forest, each older and rarer than the last — chop through the deadfall (its WC req is the ring's gate) to go deeper; waystones on rings 1/3/6/9 teleport between funded stones. Regrows nightly; ring 9 is the Heart of the Forest.",
};
for (const id of Object.keys(D.MAPS || {}))
  if (!MAP_ACCESS[id]) stale(`MAPS gained "${id}" — update MAP_ACCESS in build-atlas.mjs`);

/* ---------------- tiny html helpers ---------------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const nl = s => esc(s).replace(/\n/g, "<br>");
const g = n => `<b class="g">${n.toLocaleString("en-US")}g</b>`;
const dots = pal => `<span class="pal">${pal.map(c => `<i style="background:${c}"></i>`).join("")}</span>`;
const chip = (t, cls = "") => `<span class="chip ${cls}">${esc(t)}</span>`;
const hourFmt = h => { const x = Math.floor(h) % 24, ap = x >= 12 ? "pm" : "am"; let t = x % 12; if (!t) t = 12; return t + ap; };
const seasonCls = { Spring: "sp", Summer: "su", Fall: "fa", Winter: "wi" };
const seasonChips = arr => arr.map(s => chip(s, seasonCls[s])).join(" ");

function table(head, rows){
  return `<div class="tw"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead>` +
         `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function spoiler(label, body, open = false){
  return `<details${open ? " open" : ""}><summary>${label}</summary><div class="dbody">${body}</div></details>`;
}
function letterBlock(head, text){
  return `<div class="letter"><div class="lhead">${esc(head)}</div><div class="lbody">${nl(text)}</div></div>`;
}
// Render a cutscene step list as a readable script (dialogue + banners + letters only).
function script(steps){
  const out = [];
  for (const s of steps || []){
    if (s.type === "say") out.push(`<p class="line"><b>${esc((s.who || "…").replace(/\s+♥*$/, ""))}</b> ${esc(s.text)}</p>`);
    else if (s.type === "banner" && s.big) out.push(`<p class="ban">✦ ${esc(s.big)}${s.small ? " — " + esc(s.small) : ""}</p>`);
    else if (s.type === "letter") out.push(letterBlock(s.head || "✒ A letter", s.text || ""));
  }
  return out.join("");
}

/* ---------------- derived numbers ---------------- */
const npcIds = Object.keys(D.NPCDEF || {});
const cropList = Object.values(D.CROPS || {});
const heartSceneCount = Object.values(D.HEART_EVENTS || {}).reduce((n, a) => n + a.length, 0);
const letterCount = Object.values(D.LETTERS).filter(Boolean).length;
const masteryCount = Object.values(D.MASTERY || {}).reduce((n, m) => n + Object.keys(m).length, 0);
const XP_ROWS = [2, 5, 10, 20, 25, 40, 50, 65, 75, 90, 95, 99];

const STATS = [
  [(D.QUESTS || []).length, "story quests, two acts"],
  [(D.WINGS || []).length || 9, "Guild wings to light"],
  [Object.keys(D.MAPS || {}).length, "places (plus endless mine floors)"],
  [npcIds.length, "villagers to know"],
  [heartSceneCount, "heart scenes"],
  [letterCount, "letters from the story"],
  [(D.JOURNAL_PAGES || []).length, "almanac pages hidden in the work"],
  [cropList.length, "crops"],
  [(D.FISH || []).length + (D.LEGENDS || []).length, "fish (5 of them legendary)"],
  [(D.RECIPES || []).length, "recipes"],
  [(D.FESTIVALS || []).length + 1, "festivals a year (one earned)"],
  [masteryCount, "mastery perks across 5 skills"],
].filter(([n]) => n > 0);

/* ---------------- sections ---------------- */
const NAV = [
  ["story", "The Story"], ["crafts", "The Nine Crafts"], ["skills", "Skills & Unlocks"],
  ["world", "The World"], ["people", "The People"], ["calendar", "Calendar & Weather"],
  ["economy", "Economy & Collections"], ["completion", "100%"],
];

function heroSection(){
  return `
<header class="hero">
  <p class="kicker">The Complete Game Atlas · v${esc(D.VERSION.name)} “${esc(D.VERSION.codename)}” · ${esc(D.VERSION.date)}</p>
  <h1>HARVEST<span>SCAPE</span></h1>
  <p class="lede">A cozy valley that went quiet, and the whole of what it takes to wake it —
  every quest, letter, unlock, place, person, and perk, laid out so you can see the finished
  game without playing a minute of it. <b>Spoilers throughout, folded behind ▸ toggles.</b></p>
  <div class="stats">${STATS.map(([n, t]) => `<div class="stat"><b>${n}</b><span>${esc(t)}</span></div>`).join("")}</div>
  <p class="regen">Generated from the live game data by <code>node tools/build-atlas.mjs</code> — rerun it after any content change.</p>
</header>`;
}

function storySection(){
  const actI = D.QUESTS.slice(0, D.FINALE_IDX + 1);
  const actII = D.QUESTS.slice(D.FINALE_IDX + 1);
  const questCard = (q, i) => {
    const badge = q.finale ? chip("FINALE", "gold") : q.act2 ? chip("Act II", "pink") : chip("Act I", "sky");
    const objs = q.obj.map(o => `<li>${esc(o.text)}</li>`).join("");
    const rw = [];
    if (q.reward?.gold) rw.push(g(q.reward.gold));
    if (q.reward?.items) rw.push(Object.entries(q.reward.items).map(([it, n]) => esc(`${n} × ${it}`)).join(", "));
    if (q.reward?.msg) rw.push(`<i>${esc(q.reward.msg)}</i>`);
    const turnIn = q.turnIn?.cutscene ? spoiler("Turn-in scene (spoilers)", script(q.turnIn.cutscene))
                 : q.turnIn?.line ? spoiler("Turn-in line", `<p class="line"><b>${esc(q.giver)}</b> ${esc(q.turnIn.line)}</p>`) : "";
    return `<div class="quest">
      <div class="qhead"><span class="qn">${i + 1}</span><b>${esc(q.title)}</b> ${badge} <span class="giver">given by ${esc(q.giver)}</span></div>
      <p class="qdesc">${esc(q.desc)}</p>
      <ul class="objs">${objs}</ul>
      ${rw.length ? `<p class="reward">Reward: ${rw.join(" · ")}</p>` : ""}
      ${turnIn}
    </div>`;
  };

  const letters = [
    ["✒ The letter on the kitchen table (the game's opening)", D.LETTERS.intro, "Read automatically when a new game begins."],
    ["✒ The letter in the cottage chest", D.LETTERS.chest, "Found in your cottage chest once the farm feels like a home again."],
    ["✒ The letter Rowan kept", D.LETTERS.rowan, "Handed over when you deliver the Star Metal."],
    ["✒ The letter Rowan never sent", D.LETTERS.unsent, "Rowan's 6-heart scene — the letter he wrote Grandpa and couldn't deliver."],
    ["✒ Carved into the standing stone", D.LETTERS.memorial, "The memorial raised at the end of Act II."],
    ["✒ One last letter, tucked inside a lantern", D.LETTERS.festival, "Read as the lanterns rise at the Grand Festival."],
  ].filter(([, text]) => text);   // a retro build may predate some letters

  return `
<section id="story"><h2>The Story</h2>
<p class="prose">Willowbrook was once bound together by the <b>Guild of Nine Crafts</b> — nine wings,
nine trades, and one night a year when the whole valley gathered on the coast under floating
lanterns. Then Rosa Alderman died, her closest friend — your grandfather Aldous, the
Festival-Keeper — let the lanterns go dark, and the valley began to forget how to be a valley.
The Guild closed one craft at a time. Maya's father walked north and didn't come back. Decades
later, Grandpa leaves you the farm — and, without quite saying so at first, the one thing he
couldn't do himself.</p>
<p class="prose"><b>Act I — wake the valley.</b> Prove the crafts still live (farm, chop, mine,
fish, cook), light the Guild's wings, recover the Star Metal from the sealed vault, and bring
the Grand Festival back to the coast. The finale plays as a full festival-night cutscene and
ends the main chain — but not the story.</p>
<p class="prose"><b>Act II — the empty chair.</b> After the lanterns, Rowan asks a harder, kinder
thing: the truth about Elias Alderman, eleven years up the coast road, and whether Maya's father
can be brought home. It ends with two names carved on a standing stone on your own farm.</p>
<p class="prose"><b>And after:</b> the festival becomes an annual fixture (the anniversary of
<i>your</i> night), the almanac pages keep arriving through the long middle of the game, and the
last page — found only after everything else — asks you to do the one thing Grandpa never did:
write to your mother.</p>

<h3>The quest spine — every mission in order</h3>
${actI.map(questCard).join("")}
<div class="actbreak">— the Grand Festival plays here: the ninth wing lights, the lanterns rise —</div>
${actII.map((q, i) => questCard(q, D.FINALE_IDX + 1 + i)).join("")}

<h3>Grandpa's letters (${letterCount})</h3>
<p class="prose">The story's spine is epistolary — six letters, each landing at a turning point.</p>
${letters.map(([head, text, how]) => spoiler(`${esc(head)} <span class="how">· ${esc(how)}</span>`, letterBlock(head, text))).join("")}

<h3>Grandpa's Almanac — nine torn pages</h3>
<p class="prose">Found by <i>doing things in the places he lived</i>, not by hunting collectibles.
They carry the story through the long middle where the quest chain goes quiet.</p>
${table(["#", "Page", "How it's found"],
  D.JOURNAL_PAGES.map(p => [p.n, `<b>${esc(p.title)}</b>`, esc(PAGE_TRIGGER[p.n])]))}
${D.JOURNAL_PAGES.map(p => spoiler(`Page ${p.n} — ${esc(p.title)}`, letterBlock("✒ A torn page — " + p.title, p.text))).join("")}
</section>`;
}

function craftsSection(){
  return `
<section id="crafts"><h2>The Nine Crafts</h2>
<p class="prose">The Guild Hall's nine wings are the game's macro-progress bar: each lights when
the valley proves that craft lives again. The ninth was never a trade at all.</p>
<div class="wings">${D.WINGS.map((w, i) => `
  <div class="wing${w.id === "hearth" ? " hearth" : ""}">
    <span class="wnum">${i + 1}</span><b>${esc(w.name)}</b>
    <span class="wreq">${esc(WING_REQ[w.id])}</span>
  </div>`).join("")}</div>
</section>`;
}

function skillsSection(){
  const xp = D.XP_TABLE;
  const curve = table(["Level", "Total XP", "XP for this level"],
    XP_ROWS.map(l => [l, xp[l].toLocaleString("en-US"), (xp[l] - xp[l - 1]).toLocaleString("en-US")]));

  // masteries arrived in v2.6.0 — a retro snapshot before that just shows the ladders
  const masteryRows = lvls => Object.entries(lvls || {}).map(([l, t]) =>
    [`<b class="gold">★ ${l}</b>`, `<i>${esc(t)}</i>`]);

  const ladder = (title, mentor, rows, mastery) => {
    const mentorNpc = mentor && D.NPCDEF[mentor];
    return `
    <div class="skill">
      <h3>${title}${mentorNpc ? ` <span class="mentor">mastery praised by ${esc(mentorNpc.name)}</span>` : ""}</h3>
      ${table(["Lvl", "Unlock"], rows.concat(masteryRows(mastery)))}
    </div>`;
  };

  const farmRows = cropList.map(c => [c.lvl, `${dots(c.pal)} <b>${esc(c.name)}</b> — ${seasonChips(c.seasons)} · ${c.days}d · seed ${c.seed}g → sells ${c.sell}g`]);
  const woodRows = Object.values(D.TREES).map(t => [t.lvl, `${dots(t.pal)} <b>${esc(t.name)}</b> — drops ${t.n} × ${esc(t.drop)} (${D.ITEM_SELL[t.drop]}g each)`]);
  const mineRows = Object.values(D.ORES).map(o => [o.lvl, `<b>${esc(o.name)}</b> — drops ${esc(o.drop)} (${D.ITEM_SELL[o.drop]}g)${o.gem ? " · can hold a gem" : ""}`])
    .concat([[20, `<b>The sealed vault</b> — break the seal on the deep floor and recover the Star Metal (story)`]]);
  const fishRows = D.FISH.map(f => [f.lvl, `${dots(f.pal)} <b>${esc(f.name)}</b> — ${f.sell}g · lives in ${["pond", "coast"].filter(w => D.WATER[w].includes(f.name)).join(" & ") || "both waters"}`])
    .concat(D.LEGENDS.map(l => [l.lvl, `${dots(l.pal)} <b class="gold">★ ${esc(l.name)}</b> — legendary, ${l.sell}g (see The Hunt)`]));
  const cookRows = D.RECIPES.map(r => [r.lvl, `<b>${esc(r.name)}</b> — ${Object.entries(r.ing).map(([i, n]) => `${n}× ${esc(i)}`).join(" + ")} · ${r.energy} energy · ${r.sell}g`]);

  return `
<section id="skills"><h2>Skills & Unlocks</h2>
<p class="prose">Five skills, each 1–99 on the game's own curve (v2.8 “Earned”): the first levels
are earned, the middle is a long steady climb, and only 95–99 steepen into the completionist
crown. Every skill keeps paying past its last content unlock — <b>mastery perks land at
25 / 50 / 75 / 99</b>, each announced by the villager who cares most. Carrying
<b>Grandpa's Guild Pin</b> (from the chest letter) grants +10% XP to everything.</p>
${curve}
<p class="prose small">Reaching 99 in one skill ≈ ${(xp[99] / 1000).toFixed(0)}k XP. For scale: a turnip harvest is ${D.CROPS.turnip.xp} XP, a starfruit ${D.CROPS.starfruit.xp}, a Golden Koi ${D.FISH.find(f => f.name === "Golden Koi").xp}.</p>
${ladder("🌱 Farming", D.MASTERY_NPC?.Farming, farmRows, D.MASTERY?.Farming)}
${ladder("🪓 Woodcutting", D.MASTERY_NPC?.Woodcutting, woodRows, D.MASTERY?.Woodcutting)}
${ladder("⛏ Mining", D.MASTERY_NPC?.Mining, mineRows, D.MASTERY?.Mining)}
${ladder("🎣 Fishing", D.MASTERY_NPC?.Fishing, fishRows, D.MASTERY?.Fishing)}
${ladder("🍳 Cooking", D.MASTERY_NPC?.Cooking, cookRows, D.MASTERY?.Cooking)}

<h3>Tools — four tiers each</h3>
<p class="prose">Five tools (${D.TOOLS.join(", ")}), upgraded at Tom's forge. Power multiplies the work per swing.</p>
${table(["Tier", "Power", "Cost"],
  D.TOOL_TIERS.map((t, i) => [`<b>${esc(t)}</b>`, `×${D.TIER_POWER[i]}`,
    D.TIER_COST[i] ? `${D.TIER_COST[i].g.toLocaleString("en-US")}g + ${Object.entries(D.TIER_COST[i].mats).map(([m, n]) => `${n}× ${esc(m)}`).join(" + ")}` : "— (starting kit)"]))}
</section>`;
}

function worldSection(){
  const order = ["farm", "cottage", "coop", "barn", "store", "mayahouse", "guild", "mine", "beach"];
  return `
<section id="world"><h2>The World</h2>
<p class="prose">One valley, ${Object.keys(D.MAPS).length} places. Only the farm persists between
days — interiors, the mine, and the coast regenerate each morning, which is why the mine can be
endless and the beach can be storm-strewn. Late-game gold buys back three pieces of the old
valley (Rowan's ledger), which then exist in the world forever.</p>
<div class="maps">${order.map(id => { const m = D.MAPS[id]; return `
  <div class="map">
    <b>${esc(m.name)}</b>${m.subtitle ? ` <i class="sub">· ${esc(m.subtitle)}</i>` : ""}
    <span class="dims">${m.outdoor ? "outdoor" : "interior"} · ${m.w}×${m.h}</span>
    <p>${esc(MAP_ACCESS[id])}</p>
  </div>`; }).join("")}</div>

<h3>Rowan's restoration projects — ~16,000g of world-changing sinks</h3>
${table(["Project", "Costs", "What it changes"],
  D.PROJECTS.map(p => [`<b>${esc(p.name)}</b>`,
    `${p.gold.toLocaleString("en-US")}g + ${Object.entries(p.items).map(([i, n]) => `${n}× ${esc(i)}`).join(" + ")}`,
    `${esc(p.blurb)} <i>(${esc(p.done)})</i>`]))}
<p class="prose small">The fountain adds a daily ritual: toss 10g and someone in the valley hears you were thinking of them (+10 hearts).</p>
</section>`;
}

function peopleSection(){
  const roleNote = {
    maya: "Painter of the festival that was; the story's heart, and Act II's reason.",
    tom: "Shopkeeper who kept the lights on out of stubbornness. Runs the forge, the stock, and the demand ledger.",
    rowan: "Last keeper of the Guild. Gives the story its spine, its projects, and its hardest apology.",
    bram: "The coast's quiet fisherman. Keeper of the Hunt's five secrets — and of one much heavier.",
    pip: "Tom's kid. Has never seen a festival. The game's best questions.",
    elias: "Maya's father, eleven years up the coast road. Joins the valley only if Act II brings him home.",
  };
  const bday = id => D.BIRTHDAYS[id] ? `${D.BIRTHDAYS[id].season} ${D.BIRTHDAYS[id].day}` : "—";
  const card = id => { const d = D.NPCDEF[id]; const evs = D.HEART_EVENTS[id] || []; return `
  <div class="npc">
    <div class="nhead"><b>${esc(d.name)}</b>${d.romance ? chip("romanceable ♥", "pink") : ""}<span class="bday">birthday: ${bday(id)}</span></div>
    <p class="role">${esc(roleNote[id] || "")}</p>
    <p class="gifts"><b>Loves</b> ${d.loved.map(x => chip(x, "gold")).join(" ")} · <b>likes</b> ${d.liked.map(x => chip(x)).join(" ")}</p>
    <p class="firstline">“${esc((D.NPC_LINES[id] || [""])[0])}”</p>
    ${evs.map(ev => spoiler(`Heart scene at ${ev.hearts} ♥`, script(ev.steps))).join("")}
    ${id === "bram" ? `<p class="small prose">Bram also hands over one legendary-fish clue per heart earned — five in all (see The Hunt).</p>` : ""}
  </div>`; };

  const spouses = npcIds.filter(id => D.NPCDEF[id].romance).map(id => D.NPCDEF[id].name);
  return `
<section id="people"><h2>The People</h2>
<p class="prose">Six villagers, each with a dialogue ladder that deepens by heart tier (0–6 ♥,
100 points per heart; talking daily and gifting build it, a birthday gift counts triple). The
scripted heart scenes below are where the backstory actually lives.</p>
${npcIds.map(card).join("")}

<h3>Courtship & marriage</h3>
<p class="prose">Two villagers can be wooed: <b>${spouses.join(" and ")}</b>. At 6 ♥ each confides
where they stand — which puts a <b>Willowbrook Bouquet</b> (500g) on Tom's shelf. Hand it to your
beloved to propose; the wedding plays on the coast. A spouse tends a few crops overnight,
sometimes leaves breakfast, and gets a whole new voice.</p>
${Object.entries(D.MARRIAGE_SCENES || {}).map(([id, steps]) => spoiler(`The wedding — ${esc(D.NPCDEF[id]?.name || id)}`, script(steps))).join("")}
</section>`;
}

function calendarSection(){
  const seasonsOf = o => D.SEASONS.filter(s => (D.WEATHER_ODDS[s][o] || 0) > 0)
    .map(s => `${s} ${Math.round(D.WEATHER_ODDS[s][o] * 100)}%`).join(" · ");
  return `
<section id="calendar"><h2>Calendar & Weather</h2>
<p class="prose">Four seasons of ${D.SEASON_DAYS} days. Four festivals return every year on the
coast — and after the finale, a fifth: <b>the Lantern Festival</b>, held forever on the
anniversary of <i>your</i> festival night. Weather never takes anything away; each day
<i>offers</i> something, posted on the noticeboard the evening before.</p>
<h3>Festivals</h3>
${table(["Festival", "Date", "Hours", "What happens"],
  D.FESTIVALS.map(f => [`<b>${esc(f.name)}</b>`, `${f.season} ${f.day}`, `${hourFmt(f.from)}–${hourFmt(f.to)}`, esc(f.blurb)])
  .concat([[`<b>The Lantern Festival</b> ${chip("earned", "gold")}`, "the night you woke the valley", "evening", "The whole valley gathers again, every year after the finale."]]))}
${Object.keys(D.FESTIVAL_SCENES || {}).length ? spoiler("Festival scenes (spoilers — each has a full script)",
  Object.entries(D.FESTIVAL_SCENES).map(([id, steps]) => `<h4>${esc((D.FESTIVALS.find(f => f.id === id) || { name: id }).name)}</h4>${script(Array.isArray(steps) ? steps : steps.steps || [])}`).join("")) : ""}
<h3>Birthdays</h3>
${table(["Villager", "Day"], Object.entries(D.BIRTHDAYS).map(([id, b]) => [esc(D.NPCDEF[id].name), `${b.season} ${b.day}`]))}
<h3>Weather — what each day offers</h3>
${table(["Weather", "The offer", "Odds by season"],
  Object.entries(D.WEATHERS).map(([id, w]) => [`${w.icon} <b>${esc(w.name)}</b>`, esc(w.offer), seasonsOf(id) || "—"]))}
</section>`;
}

function economySection(){
  const cropRows = cropList.slice().sort((a, b) => a.lvl - b.lvl).map(c =>
    [c.lvl, `${dots(c.pal)} <b>${esc(c.name)}</b>`, seasonChips(c.seasons), `${c.days}d`, `${c.seed}g`, `${c.sell}g`, `${Math.round((c.sell - c.seed) / c.days)}g`]);
  const legendRows = D.LEGENDS.map(l =>
    [`${dots(l.pal)} <b class="gold">${esc(l.name)}</b>`, l.lvl,
     `${l.where === "pond" ? "farm pond" : "the coast"} · ${hourFmt(l.from)}–${hourFmt(l.to)} · ${esc(D.WEATHERS[l.weather].name)} · ${l.season || "any season"}`,
     `${l.sell}g`]);
  return `
<section id="economy"><h2>Economy & Collections</h2>
<p class="prose"><b>Tom's demand:</b> the first few of any item sell at full price, then the price
slides (never below 35%), recovering halfway overnight — a tax on <i>sameness</i>, not on any
crop. Variety is the strategy the whole economy points at.</p>

<h3>Crops (${cropList.length})</h3>
${table(["Lvl", "Crop", "Seasons", "Grows", "Seed", "Sells", "≈g/day"], cropRows)}

<h3>The orchard & the apiary</h3>
${table(["Tree", "Season", "Sapling", "Fruit sells"],
  Object.values(D.FRUIT_TREES).map(t => [`${dots(t.pal)} <b>${esc(t.name)}</b>`, chip(t.season, seasonCls[t.season]), `${t.cost.toLocaleString("en-US")}g`, `${t.sell}g`]))}
<p class="prose small">A sapling takes a full season (${D.TREE_MATURE_DAYS} days) to mature, then bears daily in
its season forever, holding up to ${D.TREE_FRUIT_CAP} days of fruit. Beehives (${D.HIVE_COST}g, max ${D.HIVE_MAX}) make
honey (100g) faster where more blooms nearby.</p>

<h3>Animals</h3>
<p class="prose">Hens 300g (coop holds 6) → eggs 55g, large eggs 95g with friendship. Cows 600g
(barn holds 4) → milk 90g, large milk 165g. Sheep 500g (share the barn, up to 4) → wool 120g,
sheared with shears (250g, one-time at Tom's), coat regrows every few days. Visit each morning;
pet for friendship.</p>

<h3>The Hunt — five legendary fish</h3>
<p class="prose">Bram tells one clue per heart. Each legend rises only under exact conditions,
is caught once, and is yours forever. Landing all five earns <b>Bram's Oilskin</b> — faster
bites, and the sea fishable in any storm.</p>
${table(["Legend", "Lvl", "Conditions", "Worth"], legendRows)}

<h3>From the deep & the shore</h3>
${table(["Find", "Sells"],
  Object.entries(D.GEM_SELL).map(([k, v]) => [`💎 ${esc(k)}`, `${v}g`])
  .concat(Object.entries(D.SHORE).map(([k, v]) => [`🐚 ${esc(k)}`, `${v}g`])))}

<h3>The noticeboard</h3>
<p class="prose">One request a day, drawn from a pool of ${D.REQUESTS.length}, always fillable at
your level. Pays ~1.4× value plus 25 heart points with the asker. Never required; gone by dawn.</p>
</section>`;
}

function completionSection(){
  const items = [
    `Finish <b>Act I</b> (${D.FINALE_IDX + 1} quests) and hold the Grand Festival`,
    `Finish <b>Act II</b> (${D.QUESTS.length - D.FINALE_IDX - 1} quests) — bring Elias home, raise the memorial`,
    `Light all <b>9 Guild wings</b>`,
    `Find all <b>${D.JOURNAL_PAGES.length} almanac pages</b> (the last one only comes after the memorial)`,
    `Catch all <b>${D.LEGENDS.length} legendary fish</b> → Bram's Oilskin`,
    `Reach <b>level 99</b> in all 5 skills — ${masteryCount} mastery perks along the way`,
    `<b>6 hearts</b> with all ${npcIds.length} villagers; see every heart scene (${heartSceneCount})`,
    `Marry <b>Maya or Bram</b>`,
    `Fund all <b>${D.PROJECTS.length} restoration projects</b> (~16,000g)`,
    `<b>Gold-tier</b> all ${D.TOOLS.length} tools`,
    `Attend all <b>${D.FESTIVALS.length} seasonal festivals</b> and the Lantern Festival anniversary`,
    `Read all <b>${letterCount} letters</b> — and then write the one Grandpa never did`,
    `Fill the coop (6 hens), the barn (4 cows), the meadow (${D.HIVE_MAX} hives), and the orchard`,
  ];
  return `
<section id="completion"><h2>What 100% looks like</h2>
<ul class="check">${items.map(i => `<li>${i}</li>`).join("")}</ul>
<p class="prose">And the one thing the game will never ask: nothing here can be failed, lost,
or taken away. That's the cozy contract.</p>
</section>`;
}

/* ---------------- page shell ---------------- */
const CSS = `
:root{--bg:#131019;--card:#1c1723;--card2:#211b2b;--ink:#e9decc;--mut:#a89f8f;--line:#ffffff14;
--gold:#ffce5a;--green:#8fd06a;--sky:#8fd3ff;--pink:#ff9ab0;--purp:#c9b6ff}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:linear-gradient(#0d0b12,var(--bg) 300px);color:var(--ink);
font:16px/1.6 Georgia,'Times New Roman',serif;padding-bottom:80px}
.wrap{max-width:980px;margin:0 auto;padding:0 20px}
h1,h2,h3,h4,.kicker,summary,.chip,th,.qn,.stat b,nav a{font-family:ui-monospace,Menlo,Consolas,monospace}
.hero{text-align:center;padding:56px 16px 8px}
.kicker{color:var(--gold);letter-spacing:.18em;text-transform:uppercase;font-size:12px;margin:0 0 10px}
h1{font-size:clamp(34px,7vw,58px);letter-spacing:.14em;margin:0;color:#fff}
h1 span{color:var(--green)}
.lede{max-width:720px;margin:14px auto 6px;color:var(--ink)}
.regen{color:var(--mut);font-size:13px}
.regen code{color:var(--sky)}
.stats{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:22px 0 8px}
.stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;min-width:118px}
.stat b{display:block;font-size:22px;color:var(--gold)}
.stat span{font-size:12px;color:var(--mut)}
nav{position:sticky;top:0;z-index:5;background:#0d0b12;
border-bottom:1px solid var(--line);padding:9px 8px;text-align:center}
nav a{color:var(--mut);text-decoration:none;font-size:12.5px;margin:0 9px;letter-spacing:.05em}
nav a:hover{color:var(--gold)}
section{margin:56px auto;max-width:980px;padding:0 20px}
h2{color:var(--gold);font-size:24px;letter-spacing:.1em;text-transform:uppercase;
border-bottom:1px solid var(--line);padding-bottom:10px}
h3{color:var(--sky);font-size:16px;letter-spacing:.06em;margin-top:34px}
h4{color:var(--pink);margin:18px 0 6px}
.prose{max-width:820px}.small{font-size:13.5px;color:var(--mut)}
.tw{overflow-x:auto;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:14px}
th{color:var(--mut);text-transform:uppercase;font-size:11px;letter-spacing:.08em;text-align:left}
th,td{padding:7px 10px;border-bottom:1px solid var(--line);vertical-align:top}
tr:hover td{background:#ffffff06}
.g,.gold{color:var(--gold)}
.chip{display:inline-block;background:#ffffff10;border:1px solid var(--line);border-radius:20px;
padding:1px 9px;font-size:11px;color:var(--ink);white-space:nowrap}
.chip.gold{color:var(--gold);border-color:#ffce5a44}.chip.pink{color:var(--pink);border-color:#ff9ab044}
.chip.sky{color:var(--sky);border-color:#8fd3ff44}
.chip.sp{color:#a5e08a;border-color:#a5e08a44}.chip.su{color:#ffd94a;border-color:#ffd94a44}
.chip.fa{color:#ffab6a;border-color:#ffab6a44}.chip.wi{color:#a8d8f0;border-color:#a8d8f044}
.pal{display:inline-flex;gap:2px;margin-right:6px;vertical-align:middle}
.pal i{width:9px;height:9px;border-radius:2px;display:inline-block;border:1px solid #0006}
.quest{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:12px 0}
.qhead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.qn{background:var(--gold);color:#1a1408;border-radius:8px;min-width:26px;text-align:center;font-weight:bold;padding:1px 4px}
.giver{color:var(--mut);font-size:13px;font-style:italic}
.qdesc{margin:8px 0 4px;color:var(--ink)}
.objs{margin:4px 0;color:var(--mut)}.objs li{margin:2px 0}
.reward{color:var(--green);font-size:14px;margin:6px 0}
.actbreak{text-align:center;color:var(--gold);font-style:italic;margin:26px 0;letter-spacing:.04em}
details{background:var(--card2);border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:0 14px}
summary{cursor:pointer;padding:9px 0;color:var(--sky);font-size:13px;letter-spacing:.03em}
summary .how{color:var(--mut);font-style:italic;letter-spacing:0}
.dbody{padding:4px 2px 14px}
.line{margin:7px 0}.line b{color:var(--gold)}
.ban{color:var(--purp);text-align:center;font-style:italic}
.letter{background:#241d15;border:1px solid #ffce5a2b;border-radius:10px;padding:14px 18px;margin:10px 0;
font-style:italic;color:#f0e6cf}
.lhead{font-style:normal;color:var(--gold);font-family:ui-monospace,Menlo,monospace;font-size:12.5px;margin-bottom:8px}
.wings{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:16px 0}
.wing{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.wing.hearth{border-color:#ffce5a55;background:#251d10}
.wnum{color:var(--gold);margin-right:8px}
.wreq{display:block;color:var(--mut);font-size:13px;margin-top:3px}
.skill{margin:8px 0}
.mentor{color:var(--mut);font-size:12px;font-style:italic;letter-spacing:0;text-transform:none}
.maps{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin:14px 0}
.map{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px}
.map .sub{color:var(--mut)}.map .dims{float:right;color:var(--mut);font-size:11.5px;font-family:ui-monospace,Menlo,monospace}
.map p{color:var(--mut);font-size:13.5px;margin:6px 0 0}
.npc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin:12px 0}
.nhead{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.nhead b{font-size:17px}
.bday{margin-left:auto;color:var(--mut);font-size:12.5px}
.role{color:var(--mut);font-style:italic;margin:6px 0}
.gifts{font-size:13.5px}
.firstline{color:var(--sky);font-size:14px}
.check{list-style:none;padding:0;max-width:760px}
.check li{padding:7px 0 7px 30px;border-bottom:1px dashed var(--line);position:relative}
.check li:before{content:"☐";position:absolute;left:4px;color:var(--gold)}
footer{text-align:center;color:var(--mut);font-size:12.5px;margin-top:70px}
@media print{nav{position:static}details{page-break-inside:avoid}}
`;

// One bad section (e.g. a retro build missing a system) must not sink the whole page.
const section = fn => {
  try { return fn(); }
  catch (e) {
    if (!RETRO) throw e;
    return `<section><p class="prose small">— this section isn't available for this build (${esc(e.message)}) —</p></section>`;
  }
};

const retroNote = RETRO
  ? ` · <b>retro-generated snapshot</b> — data is this release's; hand-written blurbs reflect the generator's era`
  : "";

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HarvestScape — Game Atlas v${esc(D.VERSION.name)}</title>
<style>${CSS}</style></head><body>
${section(heroSection)}
<nav>${NAV.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join("")}</nav>
${section(storySection)}
${section(craftsSection)}
${section(skillsSection)}
${section(worldSection)}
${section(peopleSection)}
${section(calendarSection)}
${section(economySection)}
${section(completionSection)}
<footer>HarvestScape v${esc(D.VERSION.name)} “${esc(D.VERSION.codename)}” · generated ${esc(D.VERSION.date)} from <code>game/js</code> data · regenerate with <code>node tools/build-atlas.mjs</code>${retroNote}</footer>
</body></html>`;

/* ---------------- write: snapshot always, root only for the current build ---------------- */
const ATLAS_DIR = path.join(ROOT, "atlas");
fs.mkdirSync(ATLAS_DIR, { recursive: true });
const snapName = `v${D.VERSION.name}.html`;
fs.writeFileSync(path.join(ATLAS_DIR, snapName), html);
const wrote = [`atlas/${snapName}`];
if (!RETRO){
  fs.writeFileSync(path.join(ROOT, "GAME_ATLAS.html"), html);
  wrote.unshift("GAME_ATLAS.html");
}

// Regenerate the snapshot index (newest version first).
const semver = f => f.slice(1, -5).split(".").map(Number);
const snaps = fs.readdirSync(ATLAS_DIR)
  .filter(f => /^v\d+(\.\d+)*\.html$/.test(f))
  .sort((a, b) => { const x = semver(a), y = semver(b);
    for (let i = 0; i < 3; i++){ if ((y[i] || 0) !== (x[i] || 0)) return (y[i] || 0) - (x[i] || 0); } return 0; });
const indexHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HarvestScape — Atlas Archive</title>
<style>${CSS}</style></head><body>
<header class="hero">
  <p class="kicker">Atlas Archive · one snapshot per release</p>
  <h1>HARVEST<span>SCAPE</span></h1>
  <p class="lede">The state of the game at every release — each page is the full Game Atlas as
  generated from that version's data. The newest one matches <code>GAME_ATLAS.html</code> at the
  repo root.</p>
</header>
<section><div class="tw"><table><thead><tr><th>Version</th><th>Snapshot</th></tr></thead><tbody>
${snaps.map(f => `<tr><td><b>${esc(f.slice(0, -5))}</b>${f === snaps[0] ? " " + chip("newest", "gold") : ""}</td><td><a style="color:var(--sky)" href="${esc(f)}">${esc(f)}</a></td></tr>`).join("\n")}
</tbody></table></div></section>
<footer>Regenerated by every <code>node tools/build-atlas.mjs</code> run.</footer>
</body></html>`;
fs.writeFileSync(path.join(ATLAS_DIR, "index.html"), indexHtml);

console.log(`${wrote.join(" + ")} written (${(html.length / 1024).toFixed(0)} KB) — v${D.VERSION.name} "${D.VERSION.codename}", ` +
  `${(D.QUESTS || []).length} quests, ${Object.keys(D.MAPS || {}).length} maps, ${npcIds.length} NPCs. ` +
  `Archive: ${snaps.length} snapshot${snaps.length === 1 ? "" : "s"}.`);
