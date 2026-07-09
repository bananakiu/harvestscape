"use strict";
/* ============================================================
   01-data.js — all game content tables & writing.
   Colour palettes here drive the procedural pixel art.
   ============================================================ */

const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
const SEASON_DAYS = 28;

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
};

// ---- TREES ----
const TREES = {
  oak:   { name:"Oak",   lvl:1,  hp:3,  xp:25,  drop:"Wood",       n:2, pal:["#3f8a3f","#57ad57","#2f6a2f"] },
  pine:  { name:"Pine",  lvl:8,  hp:6,  xp:60,  drop:"Pine Wood",  n:2, pal:["#2f6a52","#3f8f6a","#204a3a"] },
  maple: { name:"Maple", lvl:18, hp:11, xp:115, drop:"Maple Wood", n:2, pal:["#b8683a","#d68a52","#8a4a28"] },
};

// ---- ORES / ROCKS ----
const ORES = {
  stone:  { name:"Stone Rock",  lvl:1,  hp:2,  xp:8,   drop:"Stone",      gem:null,      col:"#9a9a9a" },
  copper: { name:"Copper Vein", lvl:1,  hp:4,  xp:26,  drop:"Copper Ore", gem:"#e08a45", col:"#c77b3f" },
  iron:   { name:"Iron Vein",   lvl:12, hp:8,  xp:62,  drop:"Iron Ore",   gem:"#d8c4bc", col:"#bfa8a0" },
  gold:   { name:"Gold Vein",   lvl:28, hp:12, xp:145, drop:"Gold Ore",   gem:"#ffe27a", col:"#ffd75a" },
};

// ---- FISH ----
const FISH = [
  { name:"Sardine",    lvl:1,  xp:15,  sell:30,  pal:["#8fb0c0","#d8e6ee"] },
  { name:"Bass",       lvl:5,  xp:32,  sell:65,  pal:["#5f7a4a","#a9c98a"] },
  { name:"Trout",      lvl:12, xp:55,  sell:120, pal:["#7a6a9a","#c9b0e0"] },
  { name:"Salmon",     lvl:20, xp:95,  sell:240, pal:["#d76a4a","#ffb090"] },
  { name:"Golden Koi", lvl:32, xp:190, sell:620, pal:["#ffb02a","#ffe27a"] },
];

// ---- SELL VALUES ----
const ITEM_SELL = { "Wood":12, "Pine Wood":28, "Maple Wood":52, "Stone":3, "Copper Ore":30, "Iron Ore":68, "Gold Ore":165 };
FISH.forEach(f => { ITEM_SELL[f.name] = f.sell; ITEM_SELL["Cooked "+f.name] = Math.floor(f.sell*1.75); });
for(const k in CROPS) ITEM_SELL[CROPS[k].name] = CROPS[k].sell;

// ---- EDIBLES (energy restored) ----
const EDIBLE = { "Berry Bun":34, "Field Salad":26 };
FISH.forEach(f => EDIBLE["Cooked "+f.name] = 22 + f.lvl);

// ---- GEMS (from the mine) & SHORE forage (from the beach) ----
const GEMS = { Amethyst:"#a877e0", Topaz:"#e8b23a", Emerald:"#3ec878", Ruby:"#e0455a", Diamond:"#b8ecf7" };
const GEM_SELL = { Amethyst:120, Topaz:160, Emerald:280, Ruby:360, Diamond:640 };
for(const g in GEM_SELL) ITEM_SELL[g] = GEM_SELL[g];
const SHORE = { Shell:22, Coral:48, Seaweed:14, Clam:38, Pearl:260 };
for(const s in SHORE) ITEM_SELL[s] = SHORE[s];
EDIBLE["Clam"] = 20;
ITEM_SELL["Star Metal"] = 0;              // story items, not for sale
ITEM_SELL["Guild Seal"] = 0;
ITEM_SELL["Grandpa's Guild Pin"] = 0;     // keepsake — grants +10% XP while carried

// ---- ANIMAL PRODUCE ----
ITEM_SELL["Egg"] = 55; ITEM_SELL["Large Egg"] = 95; ITEM_SELL["Milk"] = 90; ITEM_SELL["Wool"] = 120;
EDIBLE["Egg"] = 16; EDIBLE["Milk"] = 22;

// ---- COOKING RECIPES (made at a stove or campfire) ----
// ing: {item:qty}. Dishes give energy + sell + Cooking XP + are good gifts.
const RECIPES = [
  { name:"Fried Egg",         ing:{Egg:1},                       energy:45,  sell:90,  xp:16, col:"#ffd75a" },
  { name:"Baked Potato",      ing:{Potato:1},                    energy:42,  sell:95,  xp:16, col:"#caa06a" },
  { name:"Bread",             ing:{Wheat:2},                     energy:48,  sell:110, xp:22, col:"#e0b46a" },
  { name:"Garden Salad",      ing:{"Field Salad":1, Carrot:1},   energy:55,  sell:160, xp:28, col:"#7fbe55" },
  { name:"Berry Jam",         ing:{Strawberry:2},                energy:50,  sell:240, xp:32, col:"#e0455a" },
  { name:"Corn Bread",        ing:{Corn:1, Wheat:1},             energy:72,  sell:220, xp:36, col:"#ffd94a" },
  { name:"Tomato Soup",       ing:{Tomato:2},                    energy:66,  sell:230, xp:34, col:"#e0452a" },
  { name:"Blueberry Tart",    ing:{Blueberry:2, Wheat:1},        energy:80,  sell:320, xp:42, col:"#5a6ad0" },
  { name:"Pumpkin Soup",      ing:{Pumpkin:1, Milk:1},           energy:95,  sell:400, xp:52, col:"#ff8a2a" },
  { name:"Farmer's Omelette", ing:{Egg:2, Milk:1},               energy:100, sell:360, xp:50, col:"#ffe08a" },
  { name:"Fish Stew",         ing:{Salmon:1, Carrot:1, Tomato:1},energy:88,  sell:380, xp:48, col:"#d76a4a" },
  { name:"Cranberry Sauce",   ing:{Cranberry:2},                 energy:60,  sell:300, xp:40, col:"#c02a3a" },
];
RECIPES.forEach(r => { ITEM_SELL[r.name] = r.sell; EDIBLE[r.name] = r.energy; });

// ---- TOOLS ----
const TOOLS = ["Hoe", "Can", "Axe", "Pick", "Rod"];
const TOOL_ICON = { Hoe:"hoe", Can:"can", Axe:"axe", Pick:"pick", Rod:"rod" };
const TOOL_TIERS = ["Basic", "Copper", "Iron", "Gold"];
const TIER_POWER = [1, 2, 3, 5];
const TIER_COST  = [null, {g:300, ore:"Copper Ore", n:5}, {g:1200, ore:"Iron Ore", n:5}, {g:5000, ore:"Gold Ore", n:5}];
const TIER_COL   = ["#b7a48c", "#c77b3f", "#d8c4bc", "#ffd75a"];

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
    desc:"A valley is its people. Step inside Tom's store, east down the path, and sell your goods.",
    obj:[ {text:"Visit Tom's store & say hello", talk:"tom"},
          {text:"Earn 250g from selling", stat:"earned", goal:250} ],
    reward:{ gold:100, items:{"Berry Bun":3}, msg:"Tom rounds up your total, with a wink." } },

  { id:"old-keeper", title:"The Old Keeper", giver:"Willowbrook",
    desc:"An old man keeps the shuttered Guild Hall in the north of town. Go and hear him out.",
    obj:[ {text:"Speak with Elder Rowan at the Guild Hall", talk:"rowan"} ],
    reward:{ gold:80, items:{"Guild Seal":1}, msg:"Rowan presses a worn Guild Seal into your hand." } },

  { id:"neighborly", title:"Neighborly", giver:"Maya",
    desc:"Maya walks the south meadow by day. A valley grows warmer with friends.",
    obj:[ {text:"Reach 2 hearts with Maya", heart:2} ],
    reward:{ gold:120, items:{"Strawberry Seeds":3}, msg:"Strawberries — her favorite, if you were wondering." } },

  { id:"prove-crafts", title:"Prove the Crafts", giver:"Elder Rowan",
    desc:"“Show me the crafts still live here.” Light the first three wings of the Guild.",
    obj:[ {text:"Reach Farming 10", level:{skill:"Farming",n:10}},
          {text:"Reach Woodcutting 8", level:{skill:"Woodcutting",n:8}},
          {text:"Reach Mining 8", level:{skill:"Mining",n:8}} ],
    reward:{ gold:250, items:{"Iron Ore":4}, msg:"Three wings flicker back to light." } },

  { id:"the-coast", title:"Salt & Silver", giver:"Bram",
    desc:"Follow the south path to the coast. Bram the fisher tends the Fishing wing.",
    obj:[ {text:"Meet Bram at the coast", talk:"bram"},
          {text:"Reach Fishing 12", level:{skill:"Fishing",n:12}} ],
    reward:{ gold:300, items:{"Cooked Salmon":2}, msg:"Bram grunts. From him, that's a medal." } },

  { id:"into-deep", title:"Into the Deep", giver:"Elder Rowan",
    desc:"The old mine north of the ridge runs deep. Rowan whispers of a founding gift below.",
    obj:[ {text:"Reach mine floor 5", mineDepth:5},
          {text:"Mine 25 rocks", stat:"mined", goal:25} ],
    reward:{ gold:300, items:{"Gold Ore":3}, msg:"The deep opens to you." } },

  { id:"star-metal", title:"The Founding Gift", giver:"Elder Rowan",
    desc:"Deep in the mine a sealed vault holds Star Metal — the Guild's heart. Break it open (Mining 20) and recover it.",
    obj:[ {text:"Recover the Star Metal from the vault", flag:"foundVault"} ],
    reward:{ gold:400, items:{"Emerald":1}, msg:"The Mining wing blazes to life." } },

  { id:"master-tools", title:"Master Smith", giver:"Tom",
    desc:"Grandpa's basic tools got him by. Forge yourself something worthy of the Guild.",
    obj:[ {text:"Upgrade tools 3 times", stat:"toolUpgrades", goal:3} ],
    reward:{ gold:250, items:{"Gold Ore":3}, msg:"Tom whistles at your new kit." } },

  { id:"wake-valley", title:"Wake the Valley", giver:"The Valley",
    desc:"They said Willowbrook was finished. Light every wing and bring the Grand Festival back to the coast.",
    obj:[ {text:"Reach total level 60", totalLevel:60},
          {text:"Reach 4 hearts with Maya", heart:4},
          {text:"Recover the Star Metal", flag:"foundVault"} ],
    reward:{ gold:2000, msg:"Lanterns rise over the water. The valley is awake — and it's yours." },
    finale:true },
];
