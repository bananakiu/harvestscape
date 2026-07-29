"use strict";
/* ============================================================
   01-data.js — all game content tables & writing.
   Colour palettes here drive the procedural pixel art.
   ============================================================ */

// ---- VERSION ----
// Single source of truth for the build. `name` is the semantic version shown to players;
// `code` is a monotonic integer (bump every release) used to detect "you've updated" and
// to gate save migrations. Keep this in lockstep with CHANGELOG.md and CHANGELOG (below).
const VERSION = { name: "6.4.3", code: 147, codename: "Hands", date: "2026-07-29" };

// ---- IN-GAME CHANGE LOG ----
// The player-readable mirror of CHANGELOG.md (the full audit trail lives there, with the
// design reasoning). Newest first. Shown in the "What's New" panel. When you cut a release:
// bump VERSION, add an entry here, and write the detailed version in CHANGELOG.md — same change.
const CHANGELOG = [
  { v:"6.4.3", code:147, date:"2026-07-29", name:"Hands", notes:[
    { t:"change", s:"Housekeeping you will never see: the game now has a check that walks up to every object on every map and presses the button, so the kind of fault that killed every bench in the valley for three releases gets caught before a release instead of after one." },
  ]},
  { v:"6.4.2", code:146, date:"2026-07-29", name:"Hands", notes:[
    { t:"fix", s:"Benches work again. Every bench in the valley \u2014 the ridge, Butterbrook, the village square, Marrow Point, the Green \u2014 has done nothing at all since the Festival Green shipped: one letter wrong in the code that runs when you sit down, and pressing E on any of them quietly failed. Sitting is a small thing and it should not have been broken for two releases." },
  ]},
  { v:"6.4.1", code:145, date:"2026-07-29", name:"Hands", notes:[
    { t:"fix", s:"The Hammer does something now. Yesterday's release gave Smithing a hammer on seven tiers and then gave the tool no job \u2014 it wasn't in the belt, so it couldn't even be held, and the note saying the hotbar went to eight was wrong: that key pressed nothing. A better hammer now works the anvil for less: six energy a working at Basic, none at all with Star Metal." },
  ]},
  { v:"6.4.0", code:144, date:"2026-07-29", name:"Hands", notes:[
    { t:"new", s:"Smithing \u2014 the seventh craft, trained 1 to 99. Fenn's forge stands on the village road where you pass it walking home with ore in your pack: smelt ore into bars, forge bars into the things the valley actually runs on. Nails and hinges, chain and braziers, lantern frames, a plough blade, a bell. Twenty-six workings, and every one of them is an input to something rather than a trophy." },
    { t:"new", s:"Fenn. She has been here the whole time \u2014 the anvil that rings outside Tom's store is hers, and Tom has been selling you tools he plainly does not make. Her sign says so, in different paint. Four scenes, a birthday in Fall, and an arc about the one thing a maker can't make." },
    { t:"new", s:"You can strike your own tool heads now, for 55% less than Tom charges. \u2605 What it does NOT do is gate them: a Gold Pick still needs Mining 30 and Tom will still sell you one at Smithing 0. The forge only ever offers a cheaper way to pay. No craft in this game waits on another one, and adding a smith was never going to be the thing that broke that." },
    { t:"new", s:"A Hammer joins the tool ladder. It is not a belt tool \u2014 you don\u2019t swing a smith\u2019s hammer at a valley \u2014 it is what you work at the anvil with, and a better one takes less out of you: six energy a working down to none at all." },
    { t:"change", s:"Smithing's ladder is the densest in the game on purpose: 38 things to reach, no gap longer than five levels, and five of them above level 85. For comparison, the other six ladders go quiet for between a third and three-fifths of the climb. It is meant to be the shape the next three crafts copy." },
  ]},
  { v:"6.3.0", code:143, date:"2026-07-29", name:"The Green", notes:[
    { t:"new", s:"The Festival Green. East off the village's south lane, through a gap in the hedge: the valley's old festival grounds. You have been able to fund it for some time \u2014 the weekly writ called The Festival Green promises \u201ctrestles, canopy, and a table long enough for everybody\u201d \u2014 and until now that bought a sentence. Now it builds a field. Before the writ: a leaning flagpole, a cold fire-ring, and four bald patches where the tables used to stand. After it: the tables are back, the canopy is up, and the flag flies." },
    { t:"new", s:"Maya's bench is real. \u201cI saved a bench for us at the old festival grounds,\u201d she has said at three hearts for a very long time. It is here, under the trees, and it has three things to say depending on how well she knows you and whether the festivals ever came back." },
    { t:"change", s:"The Egg Fair and the Harvest Fair have moved to the Green. An egg hunt belongs in long grass and a crop judging belongs on trestle tables; the Luau and the Star-Watch keep the sea, because Bram's pot and the winter sky both want a coast." },
    { t:"change", s:"The whole valley turns up now. Ada, Corin, Sable, Wick and Thea have never attended a single festival since they moved in \u2014 on Harvest Fair day the village gathered and two of them strolled an empty plaza. Eleven at the festival now, not six. Nell still keeps the dairy, on purpose." },
    { t:"fix", s:"Nobody is in two places at once, still. Giving Maya her sketching afternoons on the Green double-booked her against the village square on the very first check; standing appointments are a list now rather than a rule buried in a branch." },
  ]},
  { v:"6.2.0", code:142, date:"2026-07-29", name:"The Promised Coast", notes:[
    { t:"new", s:"Marrow Point. Thirty-nine miles up the coast, at the end of a headland that narrows until there is only the light — a lighthouse, a ferry-master's hut, a mooring, and sea holly and samphire growing where nothing else will. The ferry has been sailing there since the coast road opened; it just never sailed with you on it." },
    { t:"new", s:"The first crossing is Elias's. He worked that ferry for eleven years and never once made the trip in this direction." },
    { t:"new", s:"A boatyard on the beach, once you're four writs in \u2014 three keels on the sand, still open at the ribs." },
    { t:"change", s:"The lighthouse blinking on the horizon from Starfall Ridge and the tower you can now stand under are the same light, on the same clock: two quick flashes, then a long dark. It always was supposed to be the same light; now the code says so too." },
    { t:"change", s:"The ferry sign on the coast road stops reading \u201cno service\u201d." },
  ]},
  { v:"6.1.5", code:141, date:"2026-07-29", name:"Room for Ten", notes:[
    { t:"change", s:"The Skills panel is ready for a valley with more crafts in it than it has today. It's wider, it lays the crafts out four across instead of three, and the total at the top counts whatever the game actually trains rather than a number typed in once." },
  ]},
  { v:"6.1.4", code:140, date:"2026-07-29", name:"Nothing Lost", notes:[
    { t:"change", s:"Groundwork, all of it invisible: the game now has one shared answer to \u201cis this a place where Resolve matters?\u201d instead of a hard-coded name in two places, the Warden's Bell list reads the wing's real depth instead of a number typed next to it, and the single function every reward in the game passes through can no longer be made to take something away by accident." },
  ]},
  { v:"6.1.3", code:139, date:"2026-07-29", name:"Nothing Lost", notes:[
    { t:"fix", s:"Waking up at the door after a knockout now actually saves. It was supposed to \u2014 there is a line of code whose whole job is to write the game down at that moment, and it has quietly been doing nothing since the day it was written. If you'd closed the tab right after being carried out of the wing, everything you found down there would have gone with it. Six other moments had the same silent problem, including the one that records the tenth door being opened." },
  ]},
  { v:"6.1.2", code:138, date:"2026-07-29", name:"Room to Stand", notes:[
    { t:"fix", s:"Nell walks up to the shop of an evening now instead of Tom walking down to the dairy \u2014 which was the plan, until it turned out it would have shut the shop three evenings a week. Same twenty-year marriage finally happening on screen; nothing closed." },
    { t:"fix", s:"More room on the square. The four people on the plaza had their patches set edge to edge, which still let them meet along the borders; there are proper gaps between them now." },
  ]},
  { v:"6.1.1", code:137, date:"2026-07-29", name:"Room to Stand", notes:[
    { t:"fix", s:"The plaza got crowded. Adding Wick and Corin to the village left three people sharing one patch of ground with Maya and Pip \u2014 they drifted to about a tile apart and their floating name tags sat on top of each other. The square is divided between its four people now: nobody's name covers anybody else's." },
  ]},
  { v:"6.1.0", code:136, date:"2026-07-29", name:"Neighbours", notes:[
    { t:"new", s:"A boat comes in at the ferry landing. There has not been one in eleven years \u2014 the mooring's own description has read \u201cnothing has tied up here in years; somebody keeps the boards good anyway\u201d since v3.36. Thea gets off it. She was one of Orla's wardens; four of them were sent north the summer before the wing closed, and she saw the tenth window lit from the water on the northern run." },
    { t:"new", s:"She's the third person you can marry, and she has everything the other two have \u2014 hearts all the way to ten, a proposal of her own on the boards she arrived on, morning and evening talk once you're wed, an arc that keeps going after the wedding, and her things in the cottage (including a chair she bought deliberately too heavy to carry)." },
    { t:"new", s:"People visit each other now. Tom walks the milk down to Nell two evenings a week after the shop shuts. Pip fishes beside Bram on the sand some mornings \u2014 which he has wanted since the very first version. Sable brings Elias a tea he doesn't need and sits with him. Corin works the Guild's stonework with Rowan two days in five." },
    { t:"fix", s:"Nobody is in two places at once any more. Giving people second homes exposed that your own spouse had been standing in the cottage AND on the village plaza every single morning since v5.5, and that on festival days the whole cast was on the sand and at their day jobs simultaneously. Checked now across a full month, every few hours, every map: 2,781 placements, no duplicates." },
  ]},
  { v:"6.0.0", code:135, date:"2026-07-29", name:"The Wrens and the Harrows", notes:[
    { t:"new", s:"The two houses on the village's south lane open. They have had family names on their signs since Version 3 \u2014 \u201cThe Wrens'\u201d and \u201cThe Harrows'\u201d \u2014 above doors that were nailed shut, with a note in the game's own source promising they'd open \u201cin a later chapter\u201d. This is that chapter. The valley's cast goes from seven people to eleven." },
    { t:"new", s:"The Wrens came back. Ada weaves \u2014 bring her fleece, any fleece, she'll take the ugly stuff \u2014 and Corin is the mason who has quietly been building every one of Rowan's restorations, with his initials underneath where nobody will ever see them. They're the only family in the valley who left in the dark years and returned, and Ada would rather you said so out loud than were gracious about it." },
    { t:"new", s:"The Harrows never left. Sable keeps a herbalist's kitchen, a sharp tongue, and forty-one made-up jars nobody ever came back to collect. Wick is her son, Pip's age \u2014 and the two of them worked out they'd each spent years thinking they were the only child in the village, about eight hundred paces apart." },
    { t:"new", s:"All four have full lives: their own hours, their own places to be, gift tastes, birthdays, opinions about what you build, and a heart ladder all the way to ten with scenes of their own. Walk into the Wrens' at noon and it's empty, because they're out \u2014 Ada's at the dairy buying fleece, Corin's on the plaza stonework, Sable's up on the ridge gathering." },
  ]},
  { v:"5.9.0", code:134, date:"2026-07-29", name:"The Writ", notes:[
    { t:"new", s:"Rowan keeps a writ \u2014 a list of what the valley needs next, sized to a few relaxed evenings. Eight of them, each asking for things from three different crafts, each one a job that visibly changes something: the village road re-lit, the Guild larder full, Bram's three half-built hulls finished, the ridge path shored before winter takes it." },
    { t:"new", s:"There is no date on it. None. The next writ is only written when this one is finished \u2014 nothing expires, nothing is missed, and nobody is counting the days. Take a season over one if you like; you have lost exactly nothing." },
    { t:"new", s:"Writs pay gold and writ marks, and marks buy four things the Guild gives and does not sell: a pennant for the kitchen wall, the writ desk, a row of little lamps lit the way the village road is lit, and a map of the valley drawn by somebody who watched you mend it." },
    { t:"change", s:"The long-sight card in your Journal names the writ first \u2014 it's the only standing goal in the game that fits inside a few evenings rather than a season or a whole skill." },
  ]},
  { v:"5.8.0", code:133, date:"2026-07-29", name:"The Ferry Comes In", notes:[
    { t:"new", s:"Some mornings the ferry is in. A trader ties up at the coast road landing with four things off the boat \u2014 seeds out of season, a deep material, something salvaged, a stone with no story \u2014 and two hours later the tide turns and he's gone. About twice a week, never on a day you could name in advance. Nothing he carries is anything the valley can't give you eventually; he just has it today." },
    { t:"new", s:"Some nights the sky does something. Meteor showers, the northern lights over the ridge, and once in about five years, the comet. The board tells you the evening before, so it's a thing you can plan an early night around \u2014 and it arrives as a MORNING, with star-glass in the grass, so sleeping is never the wrong move." },
    { t:"new", s:"Tom is short of something every day and pays half again for it \u2014 announced on the board, and named right on the price wherever you look at it. It's the texture the old sliding prices used to give the sell screen, with the sign flipped: this one is only ever good news." },
    { t:"balance", s:"No number in the game is tuned assuming any of it. The ferry sells conveniences, never necessities; the sky gives a handful of things you could also find; the craving only ever pays more, never less." },
  ]},
  { v:"5.7.0", code:132, date:"2026-07-29", name:"Four Walls", notes:[
    { t:"new", s:"The cottage is yours to furnish. Fifteen pieces at Tom's \u2014 rugs, lamps, a bookcase, an armchair you will absolutely fall asleep in, a standing clock \u2014 bought, carried home, and set down wherever you like. And they STAY. The one room you wake up in every single day has been a diorama since the game began; it isn't one now." },
    { t:"new", s:"Rowan will build onto the house. Two expansions on the ledger, paid in pieces like everything else he builds: he knocks through the east wall, and later puts up the long room with the good light. The cottage stops being a cottage." },
    { t:"change", s:"Nothing is ever stuck. The axe shifts any piece back into your bag, exactly like the outdoor décor \u2014 rearrange as often as you like, lose nothing, ever." },
    { t:"balance", s:"Furniture is priced under the outdoor décor at every tier and none of it does anything at all. That is the entire point of it." },
  ]},
  { v:"5.6.0", code:131, date:"2026-07-29", name:"Ten Hearts", notes:[
    { t:"change", s:"Hearts go to ten. They stopped at six, which meant that after about two seasons every kind word, gift and shared morning went into a number the game had stopped reading \u2014 the friendship system quietly switched itself off right when you'd made friends. If you're long past six with someone, you simply have more hearts the moment you load: the points were always there, only the reading was capped." },
    { t:"new", s:"Tom's ladder ended at five hearts and Pip's at four. They both have proper endings now. Tom tells you why he kept the shop open through nine years of eleven customers, and what it meant when somebody finally bought six turnip seeds. Pip works out that he doesn't have to be the thing everyone said he'd be, and goes to tell his dad \u2014 the scared way, on purpose, alone." },
    { t:"new", s:"A late scene for everyone else too. Rowan burns a list he's been reading on bad nights for twenty years. Elias goes back to his old house on the ridge and finds a birch growing where the kitchen was. Nell tells you the thing nobody in the village knows. And at ten hearts, Maya counts the windows, and Bram finally says what thirty-one years alone on the water was actually about." },
    { t:"new", s:"Tom means it about the discount \u2014 everything in his shop is 10% off, forever, from the moment he says it." },
  ]},
  { v:"5.5.0", code:130, date:"2026-07-29", name:"Moved In", notes:[
    { t:"fix", s:"Your spouse actually lives with you now. Maya says at her own wedding \u2014 out loud, on screen \u2014 that she's moving her sketchbooks into the cottage that night, and then for four whole versions she went home to her father's house and slept there forever. She's in the kitchen mornings and evenings now. So is Bram." },
    { t:"new", s:"And their things are in the house. Maya's sketchbook shelf goes up by the window because that's the good light, and the painting of the valley as it was goes on the wall. Bram's rod rack takes an entire wall, and he offers to move it, and then doesn't." },
    { t:"new", s:"Two scenes after the wedding \u2014 one a week in, one a season in \u2014 because the story of a marriage shouldn't stop at the bouquet. Maya finishes the sketchbook she started when she was nine. Bram makes a speech, badly, once, and then never speaks of it again." },
    { t:"change", s:"Married talk knows what time it is. Instead of four lines rotating forever, there's a morning pool, a daytime pool and an evening pool for each of them \u2014 so the person you live with says morning things in the morning and tired things at night." },
  ]},
  { v:"5.4.0", code:129, date:"2026-07-29", name:"The Oldest Knot", notes:[
    { t:"new", s:"Floor 45 finally has something on it. The bottom of the Undercroft \u2014 the place Act III's last chapter names, and the place that until today simply said \u201cthe wing ends here\u201d \u2014 is where the Oldest Knot has been all along. Three phases, and every single move in all three is one the wing already taught you: it slams, then it starts shedding halves, then it throws the dark and learns to face you. A final exam, not a new syllabus." },
    { t:"change", s:"The Great Knots stop being the same fight four times. Every tenth floor's boss now has its own shape: floor 10 is the ring and the reach you learned it on; floor 20 comes apart as you strike it; floor 30 throws the dark between slams; floor 40 does both at once. Their numbers grew too, but the numbers were never the problem \u2014 by the Star Stave the old one died in four swings." },
    { t:"balance", s:"None of it bends the contract. A knockout still costs nothing, the floor-45 bell is still a checkpoint, and the whole fight is tuned for someone who walked in with an empty bag. It is long, not punishing." },
    { t:"new", s:"Settle the Oldest Knot and it stays settled \u2014 a finale you have to re-fight every morning isn't a finale. The wing stays open, and its drops keep dropping." },
  ]},
  { v:"5.3.0", code:128, date:"2026-07-29", name:"The Deep Seams", notes:[
    { t:"new", s:"Four gem seams in the deep mine \u2014 opal, emerald, ruby and diamond \u2014 each a band of the gem running visibly through the rock, each unlocked at its own Mining level (15 / 35 / 55 / 78). You learn where rubies LIVE instead of hoping a gem rock rolls one. The Ruby Seam sits at 55, right in the middle of the emptiest stretch of any skill in the game." },
    { t:"new", s:"Read the seams \u2014 at Mining 60, every seam on a floor shimmers once as you arrive. It shows you nothing you couldn't find by walking the whole floor yourself; it saves the walking, which is what a prospector's eye actually is." },
    { t:"new", s:"Two more of Bram's legends, for anglers who've grown into them: the Lantern-Jaw, which carries its own light through the estuary on a foggy autumn night, and the Tide-Warden, which comes in on a winter storm at first light \u2014 the morning nobody sane is on the water. He'll only tell you about them once you've earned the hearts." },
    { t:"fix", s:"Facing a geode with \u201cPick tools for me\u201d on, the game wouldn't reach for your pick \u2014 so the rock simply didn't respond. It has been that way since geodes arrived. Found while testing the new seams; both are fixed." },
    { t:"balance", s:"Seams are deliberately scarce \u2014 measured at under one per floor \u2014 and yield a single gem. Gems were made rare on purpose years ago because they were the game's runaway money-maker, and nothing here reopens that. What a seam is worth is the rung on the ladder, not the coin." },
  ]},
  { v:"5.2.0", code:127, date:"2026-07-29", name:"The Warden's Table", notes:[
    { t:"new", s:"Food finally means something in the dark. Eat anything while you're in the Undercroft and it steadies you as well as feeding you \u2014 the better the dish, the more Resolve it gives back, up to a bit under half a bar. Cooking has been a skill with no reason to exist down there since the tenth door opened; now the kitchen is part of going down." },
    { t:"new", s:"Three Warden's tonics, brewed at any bell alongside the charms, each one spending a COOKED DISH and something you settled \u2014 so the two systems finally feed each other both ways. Ember Broth steadies you slowly for a whole descent. Warden's Tea makes the Guard more forgiving. Gloamsalve catches you once: you go down on one knee and come straight back up, keeping the floor you'd have had to walk back to." },
    { t:"new", s:"Elias's daily round asks for supper now. Four of the wing's rotations want a fish stew, six good eggs, honey for the salve, or three cheese toasties for a lad who never packs a lunch \u2014 the first time the endgame's daily job has ever looked at your farm. Rowan's standing commissions ask for cheese, wheat and crumble too." },
    { t:"balance", s:"Nothing down there is balanced around any of it. Every floor, every creature and every boss is still tuned for someone who walked in with an empty bag, and the free Resolve refill at every bell, at the door and at dawn all stay exactly as they were. A tonic lasts one descent and never survives a night." },
  ]},
  { v:"5.1.0", code:126, date:"2026-07-29", name:"The Trials", notes:[
    { t:"new", s:"Every craft now has two moments in it that aren't a number. Passing 50 in a skill \u2014 and again passing 75 \u2014 means the person who cares about that craft asks you for one thing first, and it is always something from a DIFFERENT craft. Maya wants the beds framed in sawn boards and iron pins. Rowan won't call you a miner until you've propped a roof. Bram won't teach the deep casts to anyone holding a bent stick. Twelve of them, one per craft per gate." },
    { t:"new", s:"Nothing is ever held back from you \u2014 only held. Your XP keeps counting at full rate past the gate; it is the LEVEL that waits, and the moment the trial is done every banked level lands at once. There is no timer, no failure, and no way to lose it. If you were already past a gate when this update arrived, that trial is simply marked done \u2014 you keep everything." },
    { t:"new", s:"Warding levels finally buy something. Five techniques along the ladder: the lantern flares when you settle something and whatever's close hesitates (15); your sweep reaches wider (35); a perfectly-timed Guard sends a star-bolt back where it came from (55); the Guard forgives and recovers faster (65); and a perfect parry rings outward and staggers everything around you (80). Not one of them is a damage number." },
    { t:"new", s:"Two Stave arts, taught by Elias at Warding 50 and 75, set at any Warden's Bell before you go down. The Sweep is a wider arc and a softer blow \u2014 for when they crowd you. The Settling Blow is narrow, heavy, and goes straight through a Hollow Warden's guard instead of round it. One at a time; each is a trade, not an upgrade." },
    { t:"change", s:"The Skills panel says what's happening. A held craft shows a full gold bar, who is waiting, how many levels are banked, and exactly what they asked for \u2014 and the Journal takes the payment in pieces from anywhere, like every other pledge." },
  ]},
  { v:"5.0.0", code:125, date:"2026-07-28", name:"The Strongbox", notes:[
    { t:"new", s:"Your farm is now a file you own. Until today the whole valley lived in one slot of this browser's storage — clearing your browsing data, switching browsers, or getting a new computer left it behind, permanently, with nothing you could have done about it. There is now a Save File panel, on the title screen and in Settings: copy your save, download it, and load it back any time, on any device." },
    { t:"new", s:"Nothing this panel does can cost you a farm. Restoring keeps the save it replaced in an undo slot — one click puts it back, and the one you just loaded takes ITS place, so you can swap either way. “Delete Save & Restart” keeps a copy there too; it is no longer the one button in the game you can't take back." },
    { t:"new", s:"A pasted save that is incomplete is refused, not half-loaded. Every exported file carries a checksum, so “I copied all but the last line” is caught before it costs you anything." },
    { t:"fix", s:"The starter pine on your farm was tougher than it was meant to be. Last version's tree rebalance lowered pines from six chops to four everywhere except the one hand-placed pine every farm starts with — which then quietly dropped to four the next time you loaded. Found by the game's new save-checking tool, on its first run." },
    { t:"fix", s:"Panels opened from the title screen no longer have the menu showing through them — and “New Game” can no longer be clicked by accident behind an open panel, which is a strange thing to have been possible on the screen where your save lives." },
    { t:"change", s:"Behind the scenes: the game now checks itself. Ten test saves — nine of them built from the actual code of releases going back to v2.1 — are run through the save-upgrade path on demand and checked for lost items, lost levels, lost animals and lost friendships; a performance budget is measured against a deliberately overloaded year-3 farm; and the level ladders are measured for stretches that unlock nothing. None of it changes how the game plays. All of it is why the next few versions can safely add much more." },
  ]},
  { v:"4.37.0", code:124, date:"2026-07-26", name:"The Honest Panel", notes:[
    { t:"fix", s:"Cooking finally gets its level-up moment. Every way of cooking is a button inside the Kitchen, and the level-up banner was painted UNDERNEATH open panels \u2014 so for the whole game, one of your six crafts levelled in complete silence while five others got a card and a chime." },
    { t:"fix", s:"Item prices were wrong wherever you looked at them. Hovering a Cooked Salmon in winter as a good cook read 336g while Tom's counter paid 462g \u2014 the bonuses you'd earned were exactly the ones being hidden. Every price readout now shows what the counter will actually pay, and names why when it's more." },
    { t:"fix", s:"Small print you couldn't read. The muted text carrying every recipe's ingredients, energy and price sat at about a third of the contrast it needed; on the wood panels it was effectively invisible. Both are readable now, and the blinking \"press E\" hint no longer fades to nothing on every blink." },
    { t:"fix", s:"The newest pickup no longer gets cut off. When several things arrived at once the list overflowed downward and clipped the most recent line \u2014 the one you were waiting to read. It clips the oldest now." },
    { t:"fix", s:"Examining something then talking to someone no longer buries your tool belt under the readout." },
  ]},
  { v:"4.36.0", code:123, date:"2026-07-26", name:"True Pixels", notes:[
    { t:"fix", s:"The game is drawn at the shape it was actually painted in, on every window size. On any window that wasn't tall enough, the whole valley was being stretched sideways \u2014 sprites wider than they should be, tiles no longer square." },
    { t:"fix", s:"That stretch was hiding text, too. Name tags over people's heads, the +XP and +gold numbers, the HOLD prompts \u2014 all of them were placed using the sideways stretch as though it applied downward as well, so anything low on the screen drifted down and off the bottom. Fixed at the root: the picture can no longer be stretched, so the text can no longer be misplaced." },
    { t:"change", s:"The game is bigger. It was capped at 1040 pixels wide and reserving room for a two-line controls strip that became one line in 4.32 \u2014 together those cost a lot of screen. On a 1440\u00d7900 display it now fills 85% of the window instead of 54%, and on a large monitor it lands on a clean 5\u00d7 scale." },
  ]},
  { v:"4.35.0", code:122, date:"2026-07-26", name:"Where You Left It", notes:[
    { t:"fix", s:"Tom's sell list stays put. It was ordered by whenever each thing first entered your bag, and selling out of something removes it \u2014 so earning it again sent its row to the bottom. On the one screen where you empty stacks by definition, the list reshuffled itself almost every visit. Crops, fish and dishes are grouped first now (matching the sell-all button above them), then everything else, each in alphabetical order." },
    { t:"fix", s:"The same fix for the machine loader and the gift picker \u2014 both were in that same shifting order, and both are things you do daily aimed at a tile you remember." },
  ]},
  { v:"4.34.0", code:121, date:"2026-07-26", name:"Said Aloud", notes:[
    { t:"fix", s:"The last slot on your belt used to change without telling you. Set down your last beehive and it quietly became a crop \u2014 so the next time you pressed USE you planted a turnip where you meant to place a keg. It now says what the slot holds instead." },
    { t:"fix", s:"The noticeboard card says when what's being asked for is sitting in your cottage chest, so a request never looks impossible when it isn't." },
  ]},
  { v:"4.33.0", code:120, date:"2026-07-26", name:"In the Chest", notes:[
    { t:"fix", s:"The cottage chest can no longer look like a loss. Since the pack arrived, anything it sent home was missing from every materials list in the game — you'd open Tom's shop to buy a Keg, read \"4 Iron Ore (0)\" in red, and reasonably conclude the ore you just mined was gone. Every one of those lists now says how many are waiting in the chest, right where you're deciding." },
    { t:"fix", s:"Shop rows, tool upgrades, décor, recipes, the Warden's bench and the Ledger's bundles all carry the note. So do the refusals: try to cook, craft or set something down without enough, and the message tells you if the rest is at home." },
    { t:"fix", s:"\"Missing ingredients.\" now says which ones and how many more you need — it used to name the problem and leave you to work out the rest by hand." },
    { t:"fix", s:"The planting board tells you when a hive, keg or ornament is sitting in the chest. It lists only what you're carrying, so a stored one used to vanish from it completely, with nothing to explain why." },
  ]},
  { v:"4.32.0", code:119, date:"2026-07-26", name:"The Card", notes:[
    { t:"feature", s:"There's a Controls card now — press ? for it, or open ☰ and tap ❔. Every control in the game, grouped, with the touch instruction beside each one if you're playing on a phone. Until now the only control reference was the strip under the screen, which is hidden on small screens — so phone players had no way to learn that ☰ holds Eat, Gift and Ride at all." },
    { t:"change", s:"That strip under the screen is one line now instead of twenty-odd bindings in two. It kept only what you need in the first ten seconds; everything else moved to the card, and the game got the space back." },
    { t:"fix", s:"How to Play was teaching a rule that no longer exists. It told you Tom's prices slide if you sell too much of one thing and to bring him variety — that was retired long ago, and every unit has fetched full price ever since. You were being asked to spread your sales for nothing. It now explains what selling actually rewards: cooking is worth about half again its ingredients, a keg more than doubles a crop, and the noticeboard pays better than the counter." },
    { t:"fix", s:"How to Play never once mentioned the Undercroft, Warding, Resolve or the Guard — a whole skill, forty-five floors and the entire back half of the story, missing from the game's own guide. Nor the pack and the cottage chest. Both are in there now." },
  ]},
  { v:"4.31.0", code:118, date:"2026-07-26", name:"The Shelf", notes:[
    { t:"feature", s:"Your pack now holds a set number of DIFFERENT things — 24 to begin with. Not amounts: you can still carry nine hundred wood in one pocket. It's the number of separate names that counts, which is the thing that actually made the bag hard to read." },
    { t:"feature", s:"Nothing is ever lost to it. If your pack is full and you find something new out in the world, it goes to the chest in your cottage and a note tells you what and where. It is never destroyed, never refused, and never left behind — only set down at home." },
    { t:"feature", s:"The cottage chest opens properly now. What's in the chest on top, what's in your pack below, one click to move a whole stack either way — so you choose what rides along with you." },
    { t:"feature", s:"Tom sells bigger packs: 2,500g for 36 kinds, 12,000g for 48. Somewhere for early money to go, at exactly the point the bag starts to feel tight." },
    { t:"note", s:"Tools, the charm you're wearing and Grandpa's keepsakes don't take up any room, and can never be sent home. Neither can anything you were handed on purpose — a shop purchase, a quest reward, a gift in a cutscene — even if your pack is over its limit at the time." },
    { t:"note", s:"If you were already carrying more than 24 kinds, you keep every one of them, plus room to spare. A rule added today never costs you anything you already had." },
  ]},
  { v:"4.30.0", code:117, date:"2026-07-26", name:"The Pack", notes:[
    { t:"feature", s:"Hover anything to see what it is. Item name, how many you're carrying, what it sells for, what it restores, what a charm does, and its little line of flavour — on the backpack, in shops, at the machines, everywhere. You used to have to click an item and wait for the whole bag to redraw just to learn a price." },
    { t:"fix", s:"Your backpack keeps its place. Clicking any item rebuilt the entire bag and snapped you back to the top, so checking something halfway down meant scrolling back down to it afterwards." },
    { t:"fix", s:"Items stop moving around. Tiles were laid out in the order things first entered your bag, so spending the last of something and picking it up again sent its tile to the bottom of the section. Each section is sorted by name now, and stays put." },
  ]},
  { v:"4.29.0", code:116, date:"2026-07-26", name:"What to Plant", notes:[
    { t:"feature", s:"Choosing what to plant is a menu now, not a guessing game. The sixth slot used to funnel every seed, sapling, hive, machine and décor piece through one blind ring you had to tap R through — often thirty-odd presses to reach the crop you wanted. Tap the slot (or press Shift+R) and you get a proper board instead: seeds, orchard, workshop and décor in their own sections, with how many you're carrying on each." },
    { t:"feature", s:"Seeds tell you their season. In-season ones say so plainly; the rest are dimmed and labelled with the season they belong to — so you'll never again cycle onto something the ground won't take. You can still pick a dimmed one on purpose if you're getting ready for next season." },
    { t:"change", s:"The R key stops walking you past things you can't use. It now cycles only what's actually in season AND in your bag — usually a handful — instead of every crop your Farming level has ever unlocked, most of which you own none of." },
  ]},
  { v:"4.28.0", code:115, date:"2026-07-26", name:"Two Anchors", notes:[
    { t:"fix", s:"Your messages stop stacking on top of each other. Notifications and the item-pickup log were two separate columns pinned to the same edge, growing down into one another — and the newer, more useful message was the one drawn underneath. They share one lane now, so they simply queue instead of fighting." },
    { t:"fix", s:"Talking to someone no longer covers your tools. The dialogue box sat over the top of the hotbar, burying every slot number and the name of whatever you were holding; the examine readout landed squarely on the tool name too, so pressing Q hid the very thing you'd asked about. Both now sit above the belt, and the belt keeps its whole height." },
    { t:"change", s:"The tile outline tells the truth about what a swing will do. Holding the watering can while facing a tree used to draw a blank white square — 'nothing happens here' — and then chop the tree anyway. It now lights up gold when the swing will reach for a different tool, so you can see the substitution before you commit." },
    { t:"fix", s:"Scrolling a letter scrolls the letter. The new tool-wheel was reading your scroll while a letter, journal page or epilogue was open, so the longest things to read were the hardest to scroll. Tab no longer steals keyboard navigation inside menus either." },
    { t:"change", s:"Facing bare tilled soil with the wrong tool in hand now reaches for the watering can. Before, it stood aside whenever two tools could apply — which meant it helped least on the till, water, plant loop you do most. Planting is still never guessed at; seeds only go in the ground when you choose them." },
  ]},
  { v:"4.27.0", code:114, date:"2026-07-26", name:"In Reach", notes:[
    { t:"feature", s:"Hold to keep working. Every swing used to be its own keypress — felling a heartwood with a starter axe meant twenty-four of them, and a Great Knot meant forty-two taps mid-fight. Now you just hold USE and the swings keep coming, at exactly the pace a perfect masher managed. It's the same speed; it's only your wrist that's better off." },
    { t:"feature", s:"The mouse wheel changes tools. Scroll to move along the hotbar without ever taking a hand off the movement keys — the way you'd expect — and Tab does the same from the keyboard (hold Shift to go back). Tuned so a mouse notch is exactly one step and a trackpad flick is one step too, rather than spinning through the whole bar." },
    { t:"feature", s:"The right tool comes to hand. Face a tree holding the watering can and pressing USE now reaches for the axe instead of doing nothing; face a rock, you take the pick; face water, the rod. It only ever steps in when there's exactly ONE right answer and what you're holding would have done nothing — so bare tilled soil, where you might water OR plant, stays entirely your call. Planting is never guessed at either: seeds only go in the ground because you said so. You can turn the whole thing off in Settings." },
  ]},
  { v:"4.26.0", code:113, date:"2026-07-25", name:"The Patron", notes:[
    { t:"feature", s:"Rowan keeps a list now, and it never runs out. Once the Guild is properly awake he starts naming things the valley could use — the plaza lanterns, the market planters, the square's stone benches — and each one you fund is built, for good, where you can walk past it. They're paid the way the waystones and the bells are: set down what you can carry, come back with the rest, and the ledger remembers. Coin finally has somewhere to go for the whole back half of the game instead of running out of things to buy around your second season." },
    { t:"balance", s:"The deep-water fish have come back to the pack. Landing a coelacanth was worth more than a season's best crop for eight seconds of work, which quietly made every other way of earning a living pointless. The deepest five now sell for less, and the grilling premium is lower — but part of it is earned back at the stove, so a master cook's fish is worth noticeably more than a novice's. Everything up to the Golden Koi is untouched, so the early and middle game are exactly as they were. Fishing is still the finest living in the valley; it just isn't the only one worth having." },
    { t:"polish", s:"Your gold has commas. A seven-figure purse used to be an unreadable run of digits." },
  ]},
  { v:"4.25.0", code:112, date:"2026-07-25", name:"The Long Sight", notes:[
    { t:"fix", s:"Your morning card was hiding its most important lines. Everything after the eighth item simply never appeared — and on a busy morning (married, an orchard bearing, hives full, a workshop batch done, a season turning) the ones that fell off the end were exactly the ones worth reading: tomorrow's weather, the festival or birthday coming up, and what the story is waiting on. The card now paces itself to fit however much it has to say." },
    { t:"feature", s:"You can skip the morning card. Click it, or press Space, and you're up — no more waiting out the same three seconds every single day. 'Energy restored' and 'progress saved' have moved down into the footer, since they were true every morning for two hundred days and never told you anything." },
    { t:"feature", s:"The morning names what the valley is asking for today — the board request, Nell's order, the Warden's Round — on one line, so you know the day's small errands before you've walked anywhere." },
    { t:"feature", s:"The corner tracker no longer goes blank when the story is done. Once there's nothing pressing, it quietly shows the long view instead: the craft you're closest to mastering, the Collection shelf nearest completion, and how far off the Valley's Crown is. It only ever appears when nothing else needs that corner — it never crowds a live task." },
  ]},
  { v:"4.24.0", code:111, date:"2026-07-25", name:"The Morning Round", notes:[
    { t:"change", s:"Sowing a field is one press per swathe now, not one press per furrow. Your seeds go into the same patch your can waters and your harvest gathers — so tilling, watering, planting and picking all cover the same ground. Short on seeds? It plants what you're holding, starting with the tile you're actually pointing at, and stops. Planting was the last field verb still charging you by the furrow." },
    { t:"feature", s:"You can see what a tool is about to touch. The hoe and can have watered and tilled whole swathes for a long time without ever showing you where — you aimed at one tile and four more quietly happened. Now the full footprint is outlined faintly with the tile you're facing picked out bright, so a mis-aimed sweep never buries a handful of expensive seed in soil you meant to leave alone." },
    { t:"change", s:"An orchard is gathered by the cluster, hives by the apiary, and a row of ready kegs in one go — anything of the same kind within reach comes in together. The walk between them is untouched, because the walk was never the tedious part. Loading a machine is deliberately still one at a time: choosing what goes into which keg is a real decision, and a sweep there would empty your whole bag into the nearest six jars." },
    { t:"change", s:"Collecting from an animal is now the same gesture as making a fuss of it. You used to press once for the egg and again to pet the hen; the second press was doing nothing at all for any animal that already adored you. One press now gives the produce and the affection together — exactly what the two presses gave — so your morning rounds are half as many button-taps and the flock is no less loved." },
  ]},
  { v:"4.23.0", code:110, date:"2026-07-25", name:"The Even Hand", notes:[
    { t:"balance", s:"Woodcutting no longer costs half again as much as Mining for the same 99. Trees were simply tougher than rocks for what they paid — the same climb took 94 days of energy against the pick's 81 — so the axe always felt like the chore of the six. Pine, maple and elderwood now come down in fewer swings (the deep woods are untouched; they were already fair). The experience per tree is exactly what it was, and so is the number of trees — the climb just stopped charging you a toll for choosing the axe." },
    { t:"balance", s:"The kitchen ladder is worth climbing now. Every dish from level 20 up was paying so little that the whole 32-recipe ladder cost nearly 4,000 cooked plates — while simply frying a fish, which needs no ingredients, no energy and no level at all, was more than twice as fast. Your best dish paid HALF what a plain fried fish did. Dishes now pay on a proper curve, roughly twenty to a level all the way up: the Grand Feast goes 285 → 913, and Nell's Butterbrook Reserve — a friendship secret — 150 → 330. Nothing pays less than it did yesterday, and frying a fish is still there for a quiet evening." },
    { t:"feature", s:"The variety spark now keeps a rhythm. It always gave the first ten actions in a craft bonus experience, but rotating was only ever advice. Now every different craft you take up in a day adds five more sparked actions to all of them — touch five and you're working on thirty apiece instead of ten. Focus on one craft and you get exactly what you always got; nobody is worse off. Warding counts, but the bonus tops out before it needs to, so the Undercroft is never homework." },
  ]},
  { v:"4.22.0", code:109, date:"2026-07-24", name:"The Way Down", notes:[
    { t:"balance", s:"The Hollow Warden's guard breathes now. It used to hold its shield up permanently — the only way through was to out-circle it or land a parry, which made it a wall to grind rather than a fight to read. Now the guard holds, then visibly sags open for a beat, then re-sets: wait for the drop, get behind it, or parry it open — three honest answers instead of one fiddly one. It also turns to face you more slowly, so circling round the back is a real option again. It's no weaker; it's just readable." },
    { t:"feature", s:"The way down falls out of the fighting. Hunting the floor for a stair-knot was dead time, so now settling the restless things can shake the stair loose where one comes apart — the same idea as the mine, where the way down hides under a rock and turns up while you're already swinging. It usually takes two or three, and the floor's old knot loosens along with it. Clear as you go and the dark opens up." },
    { t:"polish", s:"A way down looks like a way DOWN. Every descending stair — in the mine and in the Undercroft both — was drawn as an upright ladder with rungs, which reads as something you climb. It's a shaft cut into the floor now: a lit stone lip at your feet and steps receding away into the black. Ladders still stand upright where you're actually going up." },
  ]},
  { v:"4.21.0", code:108, date:"2026-07-24", name:"The Mantle", notes:[
    { t:"feature", s:"Reaching 99 gives you something to wear it on your sleeve with. Six mantles — one per craft — hang in Tom's shop from your very first day, locked, so you can see exactly what the long climb is for. Master a craft and yours comes off the peg: the Farmer's green, the Forester's bark-brown, the Delver's ore-flecked slate, the Angler's salt-stiff blue, the Hearthmaster's ember-red, and the Warden's lantern-blue. Purely for the showing off — which is the entire point." },
    { t:"feature", s:"And for the one who masters every craft: the Valley's Crown, gated behind all six at ninety-nine — total level 594, the number the skills panel has been quietly showing you all along with nothing at the end of it. Cross it and the valley says so out loud, Rowan included." },
    { t:"feature", s:"The Collection celebrates now instead of counting in silence. Every shelf shows how far along it is, and the moment you complete one — every crop, every fish, every gem — it's announced properly. Fill them all and you're named Curator. (Shelves you'd already finished are simply marked done; no sudden pile of fanfares for old work.)" },
  ]},
  { v:"4.20.0", code:107, date:"2026-07-24", name:"True Ladders", notes:[
    { t:"fix", s:"Your tool upgrades finally show up on the skill ladder. Every tool tier has always had a hard level requirement — you cannot buy an Iron Hoe below Farming 20 — but none of them appeared in the skill guide or the level-up notice, so the game's most-felt upgrades were invisible progression. They're all listed now, with what each one actually buys you: 'Iron Hoe — tills a 5-tile row' at Farming 20, a faster Rod, a stronger Pick, the Stave tiers for Warding. Four skills that looked like they had long empty stretches turn out to have been quietly handing you things the whole way." },
    { t:"fix", s:"The skill guide no longer padlocks things you've already met. It used to list the restless things of the Undercroft as if they were level unlocks — so the Great Knot sat locked behind 'Warding 40' even though you fight one on the tenth floor long before that. The wing has never cared about your Warding level; it's the depth you walk to that decides what's down there. The guide now says so plainly, listing each family by the floor you first meet it." },
    { t:"change", s:"The grove's deadfalls join the ladder too — each ring's Woodcutting requirement is a real gate you chop through, and now the guide names it, so you can see the seventh ring waiting at 52 instead of wondering why nothing seemed to unlock." },
  ]},
  { v:"4.19.0", code:106, date:"2026-07-24", name:"In Hand", notes:[
    { t:"fix", s:"The game is properly playable by touch at last. Four things could only ever be done with a keyboard: choosing what to plant, eating, giving a gift, and mounting the horse. On a phone that quietly removed most of the game — you could plant turnips and nothing else ever again (so farming stopped dead the moment spring ended), you could never set down a keg or a beehive or a single piece of décor, never eat when you were tired, and never give anyone a gift, which meant no friendships and no wedding. All four have proper controls now." },
    { t:"feature", s:"Anything you can plant or place can be chosen straight from your backpack — tap a seed packet, sapling, beehive, machine or décor piece and there's a 'select this' button waiting. It's the fix touch play needed, and honestly it's better on a keyboard too: no more tapping R thirty times to find the one thing you meant to put down." },
    { t:"change", s:"Tapping the seed slot on the hotbar when it's already selected now switches what's in hand — the touch equivalent of pressing R. And Eat, Gift and Ride joined the ☰ menu alongside the Backpack and Journal." },
    { t:"change", s:"The game stops telling you to press keys you haven't got. Hints now name the control you're actually using — 'press USE' rather than 'press SPACE' on a touchscreen, and the out-of-energy nudge points at the menu instead of a key that isn't there." },
  ]},
  { v:"4.18.0", code:105, date:"2026-07-24", name:"The Standing Board", notes:[
    { t:"feature", s:"The noticeboard grows up with you. It used to top out early — its hardest ask was a couple of pumpkins — so a seasoned farmer would wander up to the board by Tom's door and get asked for eight logs. Now there are sixteen new higher requests running all the way to the Everbloom and the coelacanth, and the board leans toward asks near your own skill: a master angler gets asked for the deep-water fish, a master miner for cobalt and deepsilver, and the trivial little errands fade to rare. New hands still get the small starter favours they can actually fill — nothing's out of reach, and nothing's beneath notice for long." },
    { t:"change", s:"Because the board asks for finer things now, it pays for them: the reward has always been a share of the item's worth, so a request for a coelacanth or a winter Everbloom is worth a proper day's coin, not pocket change. The daily board is a reason to visit town again, whatever your level." },
  ]},
  { v:"4.17.0", code:104, date:"2026-07-24", name:"After the Lantern", notes:[
    { t:"feature", s:"The valley finally reacts to the tenth lantern. Before this, lighting the Warden's wing — the whole point of Act III — changed almost nothing anyone could see. Now the entire cast speaks to it: Rowan walks all ten windows of an evening and thanks you for counting the wing he couldn't; Maya's painted the two wardens in lantern-light and hung it in the Guild; Tom's ordered more festival lanterns and is loudly not complaining; Pip is scandalised the number was ten all along; Nell sees a tired man set something down; and Elias — the last Warden — finally sleeps the night through." },
    { t:"feature", s:"A letter, in a warden's hand. The morning after the tenth lantern is lit, Elias leaves you one last letter — his own, in the register of Grandpa's — closing the thread of Orla, the warden before him, and handing the craft on for good. It's the quiet coda the long descent was always walking toward." },
    { t:"feature", s:"The Lantern Festival keeps a third light now. Each year Rowan lights two lanterns last — for Rosa, and for Grandpa. Once the tenth wing is lit, Elias lights a third: for Orla, lost in the deep and brought back into the light at last. Her name is spoken aloud every festival now — the finale made into a thing the valley keeps, not just a thing you did once." },
    { t:"fix", s:"Rowan no longer contradicts himself. He personally says 'there were always ten' when he lights the wing — but his everyday line still insisted 'nine wings, lit' forever after. That and the other stale nine-only lines (the Guild's sign, the planked door, the Journal's wing count) now read the tenth in once it's lit: ten crafts, ten wings, the Warden's last of all." },
  ]},
  { v:"4.16.0", code:103, date:"2026-07-24", name:"The Warden's Round", notes:[
    { t:"feature", s:"The tenth door is worth opening forever now. Once you've lit the Tenth Lantern and the Warden's Ledger's every page is kept, the book keeps writing itself — one fresh Round a day: a single thing the wing still needs tended out of it, from re-wicking the first-floor lanterns to lifting deepgnarl from the root-dark. Bring what it asks and walk it at the Ledger for good coin and Warding practice. It's the standing reason to keep descending — the deep never quite stops needing a warden." },
    { t:"feature", s:"Two Warden's monuments for the farm, built from the deep's own spoils. The Settled Cairn stacks grief-dark wood and pale ash into something quiet and kept; the Warden's Round-Lantern burns a gloamstar that never quite goes out. They give everything you settle in the dark — deepgnarl, snarlthread, warden's ash, the star-touched gloamstar — a standing home in the light, the way the star-tier monuments did for the mine's rarest ore." },
    { t:"change", s:"Act III finally shows on-screen. For three releases the whole Warden's Ledger arc left the corner tracker, the morning wake-card and the Continue recap blank — the game went quiet the moment its longest act began. Now the tracker names your current chapter and what it still wants (the bundle and the round to walk), points you back to the book to close a finished page, and after the finale shows today's Round. You always know the next step again." },
    { t:"fix", s:"The game no longer announces it's over eight chapters early. Finishing the valley's quest book used to flash 'Every Story Told' and print 'Every task complete — the valley is yours' the instant Act III opened — directly above a ledger with eight pages still to keep. The quest cape you earn there is for the book of tasks, and it says so now; the grand 'valley whole at last' is saved for where it belongs, the Tenth Lantern." },
    { t:"change", s:"The wing's finds are welcome as gifts at last. Elias — the last Warden — treasures a twist of warden's ash and likes the gloam thread and knotwood you tend out of his wing; Rowan, who sealed it, values the deep trophies (a heartknot, a gloamstar). And every restless-thing material now has a page in the Collection, under a new 'Tenth Wing' heading (Sea Aster joins The Shore, too)." },
  ]},
  { v:"4.15.0", code:102, date:"2026-07-24", name:"Nothing Lost", notes:[
    { t:"fix", s:"'Sell all produce' will never sell your legendary fish. The five trophy catches each rise exactly once in the whole valley — landed one and it's gone for good — so having a convenience button quietly ship one off to market broke the promise that nothing is ever taken from you. Sell-all now leaves every legend (and every warding material) right where it belongs; you can still sell one by hand at the counter if you truly mean to." },
    { t:"fix", s:"Settling a Great Knot can never trap you anymore. When the boss came apart it dropped its stair on the very tile it had rooted on — which could be the tile you were standing on — and the old stone would pen you in with no way to step off it. The Undercroft's stairs are now something you simply stand on, like the mine's ladders, and you're nudged gently clear for good measure. (This was the boss that guards the second chapter of the Warden's Ledger — no one gets stranded there again.)" },
    { t:"fix", s:"A knockout in the Undercroft now only re-tangles the floor you fell on — not the whole valley. Waking at the door used to quietly reshuffle every mine seam, grove ring and forage patch in the world, which handed out an unlimited re-roll of a day's gathering for the price of a free, painless knockout. The floors still knit themselves back so a restless thing can't be whittled down across trips; everything else you'd already uncovered stays exactly as you left it." },
    { t:"fix", s:"The forged Warden's charms no longer turn up free in a bird's nest. The Warded, Emberlight, Wardstone, Settler's and Starward charms are meant to be earned at a Warden's Bell from what you settle in the dark — the top one costs a Star-Gnarl's gloamstar — so finding the best charm in the game shaken out of a tree in the grove undercut the whole climb. Nests go back to the woodland charms they were always for." },
  ]},
  { v:"4.14.0", code:101, date:"2026-07-23", name:"Never Stranded", notes:[
    { t:"fix", s:"The heads-up display can't vanish on you anymore. Pressing U (Hide HUD) turns it off and — because that choice is remembered between sessions — it used to stay off with no obvious way back, so it looked like the HUD had simply disappeared while you played. Now, whenever the HUD is hidden, a small '◔ Show HUD · U' button sits in the bottom-left corner: click it (or press U) to bring everything back. You can never be stranded without your clock, gold and energy again." },
  ]},
  { v:"4.13.0", code:100, date:"2026-07-22", name:"Butterbrook", notes:[
    { t:"feature", s:"Butterbrook is worth the walk now. The salt meadow grows Sea Aster — a lilac wildflower that blooms nowhere else in the valley; gather it for coin and Farming practice, fresh every day. And there's a bench at the water's edge, for when you just want to let the coast be the coast." },
    { t:"feature", s:"Nell has a heart to know, and a secret to share. Grow close to the dairy keeper across three quiet scenes — the twenty-year supply-line she calls a marriage, why she came to the coast where a thing takes exactly as long as it takes — and at the last, as a true friend, she teaches you her own recipe: the Butterbrook Reserve. The finest cheese, the richest milk, and a handful of the meadow's sea asters, cooked into a dish you can make nowhere else and sell for a fine price. It's the ONLY way to learn it." },
  ]},
  { v:"4.12.0", code:99, date:"2026-07-22", name:"The Skill Guide", notes:[
    { t:"feature", s:"Every skill now has a full Skill Guide, like RuneScape's. Open Skills (K), tap a skill, and expand its guide to see everything it unlocks across the whole climb to 99 — every crop, tree, ore, fish, recipe and (for Warding) restless-thing family, plus the four mastery perks, listed in level order. What you've already reached is ticked; what's still ahead is padlocked, so you always know exactly what the next level is for." },
    { t:"change", s:"Warding's progress is clearer everywhere as a side effect: it now names its next unlock (the next creature family) in the skills panel and at level-up, instead of going quiet." },
  ]},
  { v:"4.11.0", code:98, date:"2026-07-22", name:"Less Fuss", notes:[
    { t:"change", s:"Harvesting keeps up with your watering can now. A ripe harvest gathers the same swathe your can waters — a whole row or 3×3 in one press, not one tile at a time. (A basic can still picks a single tile; upgrade it and your reach grows for both.) Only ripe crops in reach are taken; anything still growing is left alone." },
    { t:"change", s:"Crops tell you what they need at a glance: a warm gold sparkle bobs over anything ripe and ready to pick, and a faint droplet marks a crop sitting on dry soil that won't grow tonight until it's watered." },
    { t:"feature", s:"A 'Sell all produce' button at the top of the sell counter — one press sells every crop, fish and cooked dish you're carrying, and deliberately leaves your materials (wood, ore, warding drops, gems) untouched, so you can't fat-finger away what you're saving for tools and projects." },
  ]},
  { v:"4.10.0", code:97, date:"2026-07-22", name:"Clear & Fair", notes:[
    { t:"fix", s:"Levelling up tells the truth now. The 'nothing left to learn' line used to appear far too early — at nearly every Warding level, and a dozen levels before the end on the older skills. It now points you at the next thing to work toward (a new crop or catch, or the next mastery) right up until there genuinely is nothing left." },
    { t:"change", s:"The Energy and Resolve bars show their numbers now, so you can plan the exact swing or the last safe hit at a glance." },
    { t:"balance", s:"A couple of honest tightenings (nothing taken from you): the orchard now caps at 30 fruit trees — a full orchard, but no longer an endless one (any trees you've already planted stay) — and re-parrying the same restless thing over and over no longer farms Warding XP (each creature only rewards a parry once every little while; settling is still the real teacher). Both keep the game from getting too easy now that selling is flat-priced." },
  ]},
  { v:"4.9.0", code:96, date:"2026-07-22", name:"Worth the Trip", notes:[
    { t:"change", s:"Selling is simple again. The old market-demand system — where dumping a lot of one thing dropped its price — is gone. Every crop, fish and good now sells at its full price, always, however much you bring." },
    { t:"feature", s:"The coast and the dairy have their own shops now, each stocking something you can't buy in town. Tom's General Store keeps the seeds, food, tools and décor. Down at the beach, Bram's Bait & Tackle sells fresh bait — carry it and the fish bite quicker (it's used up as you land them). Out at the Butterbrook dairy, Nell's Larder sells the kitchen staples — milk, honey, eggs (milk moved here from Tom's, where it never really belonged). You can still sell anything at any of them; they just differ by what's for sale." },
  ]},
  { v:"4.8.0", code:95, date:"2026-07-22", name:"Nothing Wasted", notes:[
    { t:"feature", s:"The kitchen catches up — ten new dishes, so nothing you grow or make dead-ends at the counter. The dairy's own Cheese and Fine Cheese, the orchard's apples, cherries and plums, the prized Starfruit, and every one of last update's new crops now have a recipe: Apple Crumble, Cheese Toastie, Cherry Tart, Starfruit Sorbet, Asparagus Quiche, Plum Pudding, Cloudberry Preserve, Frostmelon Ice, Peony Cordial and the Dragonfruit Parfait, learned from Cooking 20 up to 84. Each is worth more cooked than sold raw, and slots into the gaps on the recipe ladder — so Cooking keeps teaching you something new the whole climb." },
  ]},
  { v:"4.7.0", code:94, date:"2026-07-22", name:"A Fuller Table", notes:[
    { t:"feature", s:"Five new crops fill the seasons' quiet stretches. Spring no longer dead-ends at Rhubarb — there's Asparagus (Farming 50) and, up high, Peony (75). Winter grows more than two things now: Cloudberry (35) and Frostmelon (60) between Frostbloom and Everbloom. And Summer tops out sweeter with Dragonfruit (82). Each is season-locked, priced on the same honest curve as the Long Climb, and — like every crop — makes its own wine and preserves, feeds the shelf and the Collection, and delights whoever likes it." },
    { t:"feature", s:"Two new charms round out the set — every skill has a trinket now. The Heron Feather Charm (+5% Fishing XP) and the Hearth Charm (+5% Cooking XP) join the birds'-nest finds, so Fishing and Cooking finally have something to collect and wear the way Woodcutting and Mining always have. One worn at a time, as ever." },
  ]},
  { v:"4.6.0", code:93, date:"2026-07-22", name:"The Kept Chair", notes:[
    { t:"feature", s:"Elias has a heart to know now. Grow close to the last Warden — at the pond by day, the coast on his fourth days — and he opens up across four quiet scenes: teaching you to sit still enough for the koi to rise; finally opening the letter your grandfather sent him eleven years ago and never dared read; rehearsing on you the apology he owes his daughter; and, at the last, making his peace and pressing a pearl into your hand. Aldous kept a chair by the pond for him the whole time — and, it turns out, one for you." },
    { t:"feature", s:"The valley talks about your Warding now. The whole cast finally has a word for the tenth door and the dark under the Guild — Pip wants to see the magic stick, Bram nods warden-to-quiet-man, Tom would like it on record that his line of work is safer, Maya worries and is proud in the same breath, Rowan owns what he sealed, and word even reaches Nell at the dairy. Two new birthdays, too: Elias (Fall 26) and Nell (Summer 24)." },
  ]},
  { v:"4.5.0", code:92, date:"2026-07-22", name:"The Tenth Lantern", notes:[
    { t:"feature", s:"Act III is complete. The Warden's Ledger now runs all the way to the bottom of the wing — five new chapters and a finale. Walk past where Elias himself always turned back (floor 20); make the deep floors safe enough that Rowan comes down to the wing he sealed with his own hands; find the mark of Orla, the warden before Elias, on a floor that keeps her name; settle the oldest, deepest knot she went down for and never rose from (floor 40); then stand at the very bottom (floor 45) and come up to light the Tenth Lantern." },
    { t:"feature", s:"The Tenth Lantern — the finale. The Warden's wing is counted at last: the tenth of the ten crafts. Rowan lights the tenth door, eleven years late, with the whole valley watching; the cold planked door becomes a warm-lit wing for good, and the Guild hall blazes corner to corner. The story that began with a farmer's letter ends with a valley made truly whole." },
    { t:"note", s:"Each chapter still asks only a bundle you gather at your own pace plus a floor to reach — nothing is ever taken, there is no failing, only a round not yet walked. The deep grind (floors 20–45, the Great Knots, the +15 charms) finally has a story to be the point of." },
  ]},
  { v:"4.4.0", code:91, date:"2026-07-22", name:"Hold the Line", notes:[
    { t:"feature", s:"The Warden's Guard — stand your ground. Raise your Stave to guard (Shift, right-click in the Undercroft, or the 🛡 on touch) and a restless thing's blow coming from the front is turned aside. Time it right — guard just as the strike lands — and it's a PARRY: no Resolve lost, the attacker staggered, and the Hollow Warden's guarded stance knocked open so your next swing lands. A beat late is still a BLOCK — most of the blow caught. One press stops one strike, then a short breath before you can raise it again." },
    { t:"change", s:"The Hollow Warden is a fight now, not a footrace. It still guards the side it faces — but instead of only circling behind it, you can meet its strike, parry, and break its stance where it stands. You must face what you block, and you can't turtle: guarding is a timed beat, not a wall." },
    { t:"note", s:"Guarding costs nothing (like every Warding action) and can only ever SAVE Resolve, never spend it — fully in keeping with the cozy contract. A first Hollow Warden shows you how." },
  ]},
  { v:"4.3.0", code:90, date:"2026-07-22", name:"The Warden's Ledger", notes:[
    { t:"feature", s:"Act III begins in earnest. Find Elias's Warden's Ledger — a book by the tenth door in the Guild — and keep it as he once did. Each chapter asks for a bundle of materials AND a round walked in the Undercroft; gather and go deep at your own pace, set down what you carry whenever you pass (the ledger keeps the tally — you never lose a deposit), then close the page. Three chapters to start: Relighting the Rounds, The Old Rounds, and What the Thread Remembers." },
    { t:"feature", s:"The wing heals where you can see it. Close a chapter and the Guild hall warms — a pair of lanterns catches along the back wall, one pair per chapter, the same felt beat as relighting the nine wings. And Maya finally comes down to paint the place she used to fear." },
    { t:"note", s:"Nothing here can be lost. The bundles only ever take what you choose to set down; closing a chapter never asks for it twice; there is no failing a round, only one you haven't finished yet." },
  ]},
  { v:"4.2.1", code:89, date:"2026-07-19", name:"Easy Does It", notes:[
    { t:"change", s:"Warding no longer costs energy. Your Resolve — and the health bars on what you're settling — already pace a fight; an energy tax on every swing just got in the way. Settle as long as your Resolve holds. (The Steady Ward mastery now gives back a little Resolve on each settle, instead of the old free-swing.)" },
    { t:"fix", s:"Watering the empty air no longer tires you out. The can used to spend energy even when there was nothing in reach to water — now a miss costs nothing, the same as swinging a hoe, axe or pick at empty ground." },
  ]},
  { v:"4.2.0", code:88, date:"2026-07-19", name:"Deeper Still", notes:[
    { t:"new", s:"The Undercroft goes deeper again — down to floor forty-five, the bottom of the wing for now — and Warding finally has a restless thing to settle at every rung of the ladder, all the way to the top." },
    { t:"new", s:"The Deep Knot (Lv70) — a dark, near-stone thing that lowers its head and CHARGES in a straight line. Sidestep it and it slams the wall and knocks itself silly — that's your moment. Stand in the way and it'll run you right over." },
    { t:"new", s:"The Star-Gnarl (Lv85) — the first restless thing that fights from a distance. It keeps its space and lobs slow star-bolts at where you're standing; watch the wind-up and step aside. Settle it for the deepest spoils in the wing." },
    { t:"new", s:"The deepest finds — Deepgnarl and the star-touched Gloamstar — forge the Starward Charm, the finest ward a Warden ever wore (+15 Resolve), and fund the deep bells at floors 35, 40 and 45. Tom's salvage will part with the odd Deepgnarl too, for the coin." },
  ]},
  { v:"4.1.0", code:87, date:"2026-07-19", name:"The Great Knot", notes:[
    { t:"new", s:"The Undercroft runs deeper — twice as far. Fifteen more floors (down to thirty), with two new restless things waiting in the dark and a proper checkpoint bell on every fifth floor all the way down." },
    { t:"new", s:"The Hollow Warden — a lost warden's echo that turns to keep its guarded front toward you. Strike it head-on and your Stave clangs off; circle round to its side or back to settle it. Slow, patient, and very hard to hurry." },
    { t:"new", s:"The Gloam Tangle — a snarl of living thread that splits in two the moment you strike it. Settle both halves before they wear you down." },
    { t:"new", s:"The first Great Knot — a boss guarding the way down on every tenth floor. Years of untended grief wound into one great whorl, with two clearly-telegraphed moves: a ground-slam that rings out around it (step outside the circle) and a long reaching lunge. Settle it and the stair it guarded opens — and it leaves a Heartknot, the core of the best charm in the wing." },
    { t:"new", s:"Deeper spoils: Warden's Ash, Snarlthread and the rare Heartknot feed two new charms — the Wardstone (+10 Resolve) and the Settler's Band (+5% Warding XP) — plus the deep bells. Tom's daily salvage now rotates the deeper finds too, so you're never gated on fighting." },
  ]},
  { v:"4.0.3", code:86, date:"2026-07-19", name:"By the Numbers", notes:[
    { t:"new", s:"Warding reads like real combat now. Every restless thing you strike shows a floating damage number — a red splat for a hit, a bigger violet one for the settling blow that finishes it — and the Resolve a creature takes from you pops up in blue, right on you." },
    { t:"new", s:"Restless things wear a little health bar (green → amber → red) once you've engaged them, with their name and level above it, so you can see at a glance what you're facing and how close it is to settled." },
    { t:"new", s:"A first-descent note: the very first time you go down the tenth door, a word explains the settling swing and the Resolve bar — so nobody's left guessing what to do in the dark." },
  ]},
  { v:"4.0.2", code:85, date:"2026-07-19", name:"Clear View", notes:[
    { t:"new", s:"The on-screen display no longer has to cover the map. In Settings, a new Heads-up display row lets you dim it — so the map shows right through — or switch it off entirely. Whatever you choose is remembered." },
    { t:"new", s:"Press U any time to hide or show the HUD in a tap — handy when you walk to the edge of a map and the clock, purse or quest cards were sitting over the corner you wanted to see. Your hotbar and any dialogue stay put." },
  ]},
  { v:"4.0.1", code:84, date:"2026-07-19", name:"Sure Footing", notes:[
    { t:"fix", s:"No more getting wedged in a wall. When a restless thing knocks you back, you'll never be shoved so hard your feet end up inside the stone — you're always set down somewhere you can actually stand." },
    { t:"fix", s:"Planting a tree or a hive right at the edge of a tile could leave you standing on top of the new solid thing, stuck. Now the moment you plant, you step clear of it automatically." },
  ]},
  { v:"4.0.0", code:83, date:"2026-07-18", name:"The Tenth Door", notes:[
    { t:"new", s:"Version 4 begins. Behind the planked door in the Guild — the one Rowan would never talk about — a stair now goes down into the Undercroft: the tenth wing, the Warden's wing, sealed the night the Guild went dark. Finish Elias's story and grow into the valley (total level 100), and Rowan will finally take you to it." },
    { t:"new", s:"Warding — a new craft, trained 1 to 99, the sixth skill on the wall. Below the valley the dark has knotted itself into restless things — gloam wisps, knot-shamblers, ember mites — where warding lapsed for eleven years. You don't fight them. You settle them: a swing of a forged Warden's Stave, and they come apart into the materials they were knotted from. It is cozy, and it is opt-in, and it lives only down there." },
    { t:"new", s:"Nothing is ever taken from you — not even here. If your Resolve runs out, the lantern-bearers carry you back to the door with every last coin and thread still yours. A knockout costs a run, never a thing. The farm, the village, every place you already know stays exactly as safe as it always was; the dark is only ever a place you choose to walk into." },
    { t:"new", s:"The Stave rides the same seven-tier ladder as your other tools — Elias gives you a basic one, and Tom forges it up from there. Warden's Bells on the 5th, 10th and 15th floors are checkpoints you fund and ring back down to; settling drops become charms at the bell's workbench (a wider lantern, a deeper Resolve). Combat-shy? Tom keeps a bit of warden's salvage on his shelf each day, so the story finishes either way." },
    { t:"new", s:"The variety spark: the first few actions in each skill each day now glow with bonus experience. Rotate your crafts and the valley quietly pays you for it — never a penalty for focusing, just a small, warm nudge to try a bit of everything." },
  ]},
  { v:"3.45.0", code:82, date:"2026-07-18", name:"Quietude", notes:[
    { t:"fix", s:"Turn the music off and it's off now. A faint reverb tail used to keep whispering under everything after the music stopped — that leak is gone, so off is truly silent." },
    { t:"new", s:"Music and Sound Effects have their own On/Off switches in Settings now, each beside its own volume slider. Hush the soundtrack but keep the birds, rain and chimes — or the other way round. Rain and birdsong follow the Sound Effects switch." },
  ]},
  { v:"3.44.0", code:81, date:"2026-07-17", name:"Butterbrook", notes:[
    { t:"new", s:"The dairy down the coast is real now. West off the beach, the shore opens south to Butterbrook — meadows, a brook running to the sea under a plank bridge, and the creamery alone at the far end. It's the longest walk in the valley, and worth it: at the end of it is Nell." },
    { t:"new", s:"Nell — Tom's wife, the coast dairy keeper the barn's been shipping milk to for twenty years, and the valley's first new face in a long while. She keeps a standing order: bring her the day's ask — milk, cheese, wool, the good big eggs — and she pays a premium over Tom's counter, with Farming practice and her thanks besides. Talk to her to hear what she needs." },
    { t:"new", s:"The dairy chain comes full circle: your barn makes the milk, your press makes the cheese, and now there's someone down the coast who's glad of both." },
  ]},
  { v:"3.43.0", code:80, date:"2026-07-17", name:"Starfall Ridge", notes:[
    { t:"new", s:"The world grows upward. Past the mine mouth, switchbacks climb Starfall Ridge — through the tree line, up the scree, to a snow-pale summit where the Guild's founding star came down. The crater is still there, fused smooth. So is a wind-worn bench at the cliff edge, and a cairn stacked by every hand that ever made the climb." },
    { t:"new", s:"Star-gleaning. On clear nights the summit catches Starlight Shards — splinters of the old light, gleanable after dusk for Mining practice and honest coin. Once in a while, one turns out to be true star metal. By day the ridge offers humbler things: mountain thyme and snowdrops on the scree, and stone for whoever swings at it." },
    { t:"new", s:"The cairn opens the panorama: the whole valley from above, painted by the hour — the grove, your farm and its chimney smoke, the village, the umbrellas on the sand, the Gullwater running to the sea, and far up the coast, if you watch a moment, a light blinking at Marrow Point." },
  ]},
  { v:"3.42.0", code:79, date:"2026-07-17", name:"Starlight", notes:[
    { t:"polish", s:"Star metal looks like what it is now. The veins run violet — the Starstone's own colour, off the same fallen star — with white-hot flecks, and each one casts a soft breathing glow in the dark of the deep floors. No more squinting to tell it from deepsilver; the star shard and the Star Metal tools wear the same violet." },
  ]},
  { v:"3.41.0", code:78, date:"2026-07-17", name:"Provisions", notes:[
    { t:"new", s:"Buying works like selling now. Seeds, food, and saplings all take a quantity — the same ± arrows and number box — so stocking a season's planting is one click, not twenty. Ask for more than your purse covers and Tom sells you what it does, plainly." },
    { t:"new", s:"Every buy row shows what you already hold (×N), same as the sell page — seeds in the bag, buns in the pack, hives and machines waiting to be placed — so you never buy blind." },
  ]},
  { v:"3.40.0", code:77, date:"2026-07-17", name:"The Quartermaster", notes:[
    { t:"new", s:"You decide how much, everywhere. Selling at Tom's now has a number box with ± arrows beside every item — sell exactly as many as you like, or the whole stack with one click — and how many you're holding stays visible even when the demand note appears (it used to hide your count at the worst moment)." },
    { t:"new", s:"The cellar asks before it takes. When a sawmill, keg, jar, or press could take more than one thing from your bag, a picker opens — choose the wood, the crop, or the pail yourself. If you're only carrying one thing it wants, it loads instantly, same as ever." },
    { t:"new", s:"Pledges take portions now: a little (a tenth), half, or all — no more emptying your purse and half your bag in one click. And typing in a number box never trips the game's hotkeys." },
  ]},
  { v:"3.39.0", code:76, date:"2026-07-17", name:"The Counterweight", notes:[
    { t:"balance", s:"Restoring the deep lift stops is a project now, not a fantasy. Past floor 20 the cost used to double every five floors — by the deep floors it wanted more coin than a farm sees in seasons. It climbs gently now: a few thousand more per stop, all the way down. The deepest stops (45 and below) ask for heartwood and cobalt instead of yet more elder and gold ore — the deep shaft wants the deep materials — and still exactly one diamond." },
    { t:"fix", s:"If you'd already pledged more toward a stop than its new price, the ledger settles up: the stop completes the next time you visit it, no further deposit needed." },
  ]},
  { v:"3.38.0", code:75, date:"2026-07-17", name:"One Ladder", notes:[
    { t:"balance", s:"The rocks and the trees climb the same ladder now. Mining and Woodcutting share one set of rungs — 1, 10, 20, 30, 45, 70, 85 — pairing each ore with its timber: copper with pine, iron with maple, gold with willow, cobalt with elderwood, deepsilver with heartwood, and star metal with silverwood at the very top. Where the two ladders disagreed, the higher rung won: pine and maple ask a little more; cobalt, deepsilver and star metal ask what their timber always did." },
    { t:"balance", s:"Tool tiers sit on the same rungs — so no tool anywhere asks for an ore or a wood above its own level, in either skill. (The star axe used to want silverwood forty-odd levels before you could chop it. No longer.) Anything already forged is untouched, as always." },
    { t:"balance", s:"The deep floors re-seat to match: deepsilver veins from floor 50, star metal only below 65 — each arriving a stretch before you can mine it, the way the shallow floors always have. Something you can't cut yet, standing right there, is the point." },
  ]},
  { v:"3.37.0", code:74, date:"2026-07-17", name:"The Long Ladder", notes:[
    { t:"balance", s:"The climb to the star tools is stairs now, not a cliff. Two new tool tiers sit between Gold and Star Metal — Cobalt at level 40, forged from cobalt and willow, and Deepsilver at 50, from a new pale ore in the deep floors and the grove's dark elder boards. Star Metal moves to level 60, where its own ore now lives — the silverwood and the Starstone come at the top of a long ladder, not one step after gold." },
    { t:"new", s:"A new ore: Deepsilver, in veins from floor 35 down — it holds the lamplight a moment longer than it should. Star metal now runs deeper (floor 45 and below), and every ore still arrives one rung per ten levels." },
    { t:"balance", s:"If you'd already forged Star Metal tools, they're still Star Metal — nothing is ever taken. They even swing a little harder now, sitting at the top of the taller ladder." },
  ]},
  { v:"3.36.0", code:73, date:"2026-07-16", name:"The Coast Road", notes:[
    { t:"new", s:"The world grows. East along the shore past Bram's coast, a new road follows the headland: the Coast Road. The Gullwater river comes down to meet the sea there — the first river in the valley — with an old plank ford, a roadside shrine, and at the road's end, a weathered ferry landing and a milestone that reads MARROW POINT — 39. The road runs on north past the landing. You can't. That's rather the point." },
    { t:"new", s:"River fishing. The Gullwater holds its own catch — the cheerful Chub, the Grayling (the lady of the stream), and the Trout, finally home in moving water. Where the river meets the sea, the estuary mixes river fish with the salmon run. And when a storm is on the sea, something rare runs upriver — Bram always said the rain brings things with it." },
    { t:"new", s:"Roadside forage grows back daily: salty samphire on the tideline, sea holly on the headland. And every fourth day, someone walks up the road to stand at the landing and look north, the way he never used to." },
  ]},
  { v:"3.35.0", code:72, date:"2026-07-16", name:"The Flock", notes:[
    { t:"new", s:"Every animal has a name now. New arrivals are named at the counter; the animals you already keep found their names too — and your very first hen turns out to have been Sir Cluckington all along, exactly as Pip promised. Pet toasts show each animal's hearts, examining one (Q) tells you how the friendship is going in its own words, and the first time a well-loved animal gives its best — a large egg, a brimming pail, a prize fleece — the moment gets its due." },
    { t:"new", s:"On clear days the flock goes out. Hens scratch in front of the coop, cows and sheep take the grass by the barn — and the morning egg, pail, and coat can all be gathered right there in the yard. They keep close to home, and head in when the weather turns (and through the winter)." },
  ]},
  { v:"3.34.0", code:71, date:"2026-07-16", name:"Small Talk", notes:[
    { t:"new", s:"The valley notices more. Bram has a word for whoever keeps casting after the water goes hard — and words he's been saving for the first Frostfin and the first Glassperch anyone's landed since his day. Pip has urgent questions about treasure inside rocks (and one worry about Gary). And the star monuments no longer stand in silence: Pip begs a turn at the telescope, Rowan has a long look at the obelisk, and Maya has seen the spire glowing from the meadow." },
    { t:"polish", s:"If you'd already caught the winter fish, cracked a geode, or raised a monument before this update — everyone still remembers. The lines wait for your next visit." },
  ]},
  { v:"3.33.0", code:70, date:"2026-07-16", name:"The Dairy", notes:[
    { t:"new", s:"The barn's milk finally has somewhere to go. A new Cheese Press sets a pail into a wheel of cheese overnight — plain milk into Cheese, a well-loved cow's brimming pail into Fine Cheese. Load it like a keg; both wheels keep, eat well, and sell honestly." },
    { t:"new", s:"Your first press is a gift. Once the barn is up, talk to Tom — his wife runs the dairy down the coast, and she's sent something up for the farm that supplies her milk. More presses are on his shelf after that, built from oak lumber and iron." },
  ]},
  { v:"3.32.0", code:69, date:"2026-07-16", name:"The Storyteller", notes:[
    { t:"new", s:"Quest Points. Every task in the valley's book now weighs something — a point for an errand, more for the great ones — and the Journal's Quests page keeps the count. Each completed quest announces its points, and old saves get full credit for everything already done." },
    { t:"new", s:"One more letter. After the coast road ends where it ends, a last envelope from Grandpa turns up behind the seed drawer — older and softer than the rest, with a riddle in it instead of a task. Follow it with your hoe. What you find is his, and now it's yours to wear." },
    { t:"new", s:"For whoever fills the whole book: Tom keeps the Storyteller's Banner behind the counter. You'll see it in his décor catalogue long before you can buy it — that's the point." },
  ]},
  { v:"3.31.0", code:68, date:"2026-07-16", name:"Ice Fishing", notes:[
    { t:"new", s:"Winter has its own catches now. When the water skins over with ice, two fish rise that you'll see no other season: the Frostfin off the pond and coast, and the rare Glassperch out on the deep coast. They bite only in winter — a reason to keep casting through the cold, when the fields are asleep. Both join the Almanac and the Collection like any fish, and cook up just as well." },
  ]},
  { v:"3.30.0", code:67, date:"2026-07-14", name:"Loose Ends", notes:[
    { t:"polish", s:"Small tidying. Each kind of lumber now has its own word when you examine it — oak, pine, maple, willow, elder, and the fine heartwood and silverwood beams, each described in its own right instead of one shared line." },
    { t:"fix", s:"On older farms where the stable was built before a recent fix, a stray bit of ridge rock could sit against its back wall. It's cleared now, so the stable stands clean." },
  ]},
  { v:"3.29.0", code:66, date:"2026-07-14", name:"Starfall", notes:[
    { t:"new", s:"The deepest treasures finally have somewhere to go. Once your tools are forged, the rarest stock — star metal, cobalt, your heartwood and silverwood beams, a Starstone, even a geode's crystal heart — had nothing left to become. Now they become wonders: three prestige monuments in Tom's décor catalogue, framed from the deep itself." },
    { t:"new", s:"A Crystal Spire lit from within, a Star Metal Obelisk on a silverwood plinth pointing back the way it fell, and a Great Telescope with a Starstone for its lens — the Guild kept one once, Rowan says, to watch for the next star. Set as many as your farm can hold. The deep keeps paying forward." },
  ]},
  { v:"3.28.0", code:65, date:"2026-07-14", name:"Geodes", notes:[
    { t:"new", s:"The deep mine gives up more than ore now. Past floor 25, a rare geode sits among the stone — a plain round nodule with a crack of crystal showing through. Crack it with your pick and it splits open on something worth keeping: amber with a gnat inside, a trilobite older than any story, black obsidian, a fist of quartz — or, one in a while, a gem grown in the dark, or the rarest thing of all." },
    { t:"new", s:"There's a new page in your Collection for them — The Deep. And the mine rewards the long climb more honestly: the ore keeps growing richer all the way down to floor 40, not just to 20, so diving deep is finally worth more than camping shallow." },
  ]},
  { v:"3.27.0", code:64, date:"2026-07-14", name:"Rowan's Workshop", notes:[
    { t:"new", s:"Construction has a voice at last. The first time you raise the coop, Elder Rowan comes to see it — and tells you what you didn't know you'd learned: that the making of a home was the tenth craft the old Guild never counted. His workshop is open again, and it's yours." },
    { t:"new", s:"And the first board you ever mill at the Sawmill comes with a word from him about timber and patience — a small welcome to the carpenter's trade. The coop that taught you to build was always meant to be a beginning." },
  ]},
  { v:"3.26.0", code:63, date:"2026-07-14", name:"In the Saddle", notes:[
    { t:"polish", s:"Your horse is properly tacked up now — a saddle, a red blanket, a stirrup — so riding looks like riding, not perching. Swinging up kicks a little dust and gives a good thump, and hopping down does the same." },
    { t:"new",    s:"And your horse has a name. Look at it (Examine) — in the stall or from the saddle — and you'll meet Biscuit, or Clover, or whoever it turns out to be, along with its frank opinions about grass and carrots." },
  ]},
  { v:"3.25.0", code:62, date:"2026-07-14", name:"Spring in the Step", notes:[
    { t:"polish", s:"A little more life in the small motions. Water a growing crop and it gives a quick, happy stretch — a gulp and a bounce back — the moment it drinks. And your swing lands with a touch more weight, a subtle squash on the impact. Nothing changes but the feel, and the feel is better." },
  ]},
  { v:"3.24.0", code:61, date:"2026-07-14", name:"Raising the Roof", notes:[
    { t:"new",     s:"Raising a building is a moment now. Step out the morning your coop, barn, or stable is finished and the whole farm cheers it up — a banner, a shower of sparks over the new roof, a good solid thump. The homestead you build deserved a little ceremony." },
    { t:"new",     s:"And the valley notices. The first time you visit after you've built something, the neighbours have words for it — Tom about the coop that lets him sell you hens, Pip already naming a chicken, Rowan on the carpentry in your hands, Maya about seeing you ride past. They've been watching you make a home." },
    { t:"balance", s:"Buildings ask for more than timber now — a coop wants a stone footing; a barn, stone and iron for its nails; a stable, stone, iron, and an emerald set in the gate-post. Raising the homestead draws on your mining as well as your axe, the way real building does." },
  ]},
  { v:"3.23.0", code:60, date:"2026-07-14", name:"The Paddock", notes:[
    { t:"polish", s:"Your horse is home. Once the stable stands, it waits in the stall — you can see it there whenever you're not out riding, breathing slow in the sun. Press H nearby to swing up; hop down and it's back at the stable, as ever." },
  ]},
  { v:"3.22.0", code:59, date:"2026-07-14", name:"The Stable", notes:[
    { t:"new",   s:"A horse of your own. Raise the Stable from the Ledger — milled oak, pine, and maple — and then, out in the open, press H to swing up and ride. The valley gets a good deal smaller: a horse covers ground the better part of twice as fast." },
    { t:"new",   s:"Press H again to hop down, and your horse ambles back to the stable — it's never lost and never hungry, the cozy way. Step into any building and you dismount at the door (no riding through the kitchen). You can't work from the saddle; hop down to swing a tool." },
    { t:"note",  s:"That completes the homestead you build from the ground up: a coop for hens, a barn for cows and sheep, and now a stable and a horse — all framed from your own lumber." },
  ]},
  { v:"3.21.0", code:58, date:"2026-07-14", name:"The Sawmill", notes:[
    { t:"new",   s:"Build your farm, plank by plank. The new Sawmill mills your raw logs into lumber overnight — a whole stack at a time, each species its own board: oak, pine, maple, willow, elder, and the fine heartwood and silverwood beams. Lumber is what you build with." },
    { t:"new",   s:"The Chicken Coop and the Barn are now yours to raise. Open the Journal's Ledger, spend your milled lumber and a little coin, and Rowan helps you frame them up by morning — the coop for hens, the barn for cows and sheep. A new farm starts as open land and grows into a homestead, the way it should." },
    { t:"change", s:"Because of that, a brand-new farm no longer comes with the coop and barn already standing — you build them. (Every existing farm keeps both, exactly as they were; nothing you've made is lost.) Animals wait on their building now: a coop before hens, a barn before cows and sheep." },
    { t:"note",  s:"Lumber sells for the same as the log it came from — there's no coin in milling, only building. Wood stays a material, not a money crop (see last patch). More to come: a stable, and a horse for the road." },
  ]},
  { v:"3.20.0", code:57, date:"2026-07-14", name:"Timber", notes:[
    { t:"balance", s:"Wood is worth a third of what it was. The renewable grove made chopping-and-selling a lazy purse, and wood was quietly one of the game's easiest incomes — so every log now sells for roughly ⅓ (Wood 12→4, Pine 28→9, Maple 52→17, Willow 34→11, Elder 95→32, Heartwood 210→70, Silverwood 340→113). Woodcutting still pays in what it always should have: the XP, and the timber itself." },
    { t:"balance", s:"And the timber itself matters more: everything you build, craft, or upgrade now wants about five times the wood. Tool upgrades, kegs and jars, the Old Lift's restoration, and Rowan's civic projects all take a proper stack now — wood is a building material, not a rounding error. (Small daily favours on the noticeboard and one-off story errands were left alone; only the things you construct got heavier.)" },
    { t:"balance", s:"Groundwork for what's coming: a real construction system — a sawmill that mills your logs into lumber, and buildings you raise plank by plank. Wood had to become precious before it could become lumber." },
  ]},
  { v:"3.19.0", code:56, date:"2026-07-14", name:"The Way Down", notes:[
    { t:"new",     s:"The stairs down are hidden. There's no ladder waiting in the corner anymore — the way down is buried under a single rock, somewhere on the floor, and you won't know which until you break it open. So you work the whole floor, swinging at the plain grey stone, until one rock crumbles away over a black shaft. It's a little dungeon-crawl now, the way the old farm games did it — every floor a small search." },
    { t:"balance", s:"Ore is about three times rarer, and most of what you'll break is plain stone. So a copper vein actually feels like a find again — and to match, every ore is worth roughly three times the Mining XP it used to be. You swing more and strike ore less, but each strike counts for more. The way down is always diggable by anyone: whatever lies on the path to the stairs is guaranteed to be plain stone, so a green miner can never get walled off from descending." },
  ]},
  { v:"3.18.0", code:55, date:"2026-07-14", name:"A Handful of Stars", notes:[
    { t:"new",   s:"The gems now read like an old adventurer's haul: Opal, Topaz, Sapphire, Emerald, Ruby, and Diamond, humblest to grandest. And above them all — the Starstone: a violet gem of the same fallen light as the star metal, given up only by the deep Star Metal veins, maybe one a season. It's what the finest tools are forged around." },
    { t:"new",   s:"(Gary is safe. He's still an amethyst, still Pip's, still yours — just no longer something the mine hands out to anyone. Pip would like an Opal to keep him company, though.)" },
  ]},
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
const MASTERY_NPC = { Farming:"maya", Woodcutting:"tom", Mining:"rowan", Fishing:"bram", Cooking:"pip", Warding:"elias", Smithing:"fenn" };   // v6.4: Fenn, who reopened the forge   // v4.0: Elias, the last Warden, is the one who cares about the tenth craft
const MASTERY_PRAISE = {
  Smithing: { 25:"You've stopped flinching at the heat. That's most of it, honestly.",
              50:"Half the ironwork in this valley has your hammer marks on it now.",
              75:"I've started sending people to you when I'm busy. I don't do that.",
              99:"There isn't a thing I know that you can't do better. That's the job done, then." },
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
  // v4.0 — Elias, quiet and self-aware, an old maker watching someone tend what he couldn't.
  Warding: { 25:"You've the hands for it. My father used to say warding was only tending, with the lights turned low.",
             50:"The old wing feels less heavy since you started going down. I notice. So does the valley.",
             75:"I sealed that door because I couldn't face what wanted tending. You faced it. …Thank you for that.",
             99:"There hasn't been a Warden like you in living memory. Go gently down there — the dark is only lonely." },
};

// ---- THE VARIETY SPARK (v4.0, V4_PLAN §4) ----
// Anti-rabbit-hole, reward-shaped and never punitive (GBP §5.3 stands — no XP tax, no daily cap).
// The first few actions in each skill each DAY glow with bonus XP, so rotating between crafts is
// visibly optimal while single-skill focus is still allowed and never taxed. Ships in v4.0 (small,
// sets the tone early). Tracked in state.dailyXpActs (reset each dawn); hooked in addXP.
const SPARK_MULT = 1.5;   // +50% XP on a sparked grant
const SPARK_CAP = 10;     // the first N grants per skill per day spark

// ---- RESTLESS THINGS (v4.0 Warding — the creatures of the Undercroft) ----
// Not animals, never people (V4_BUILD_PLAN §1): melancholy nature-spirits knotted out of the
// materials warding lapsed on. You don't kill them, you SETTLE them — a Stave swing bursts them
// back into what they're knotted from. Creature tiers ride the unified 1/10/20 ladder so zone
// depth reads like ore depth. XP sits UNDER the ore curve for the band (copper L10=78, iron L20=186)
// on purpose: settling is a frequent action (several per floor, low hp), so per-settle XP is modest
// — it must not out-pace mining an ore vein per unit time (GBP §3.4). Drops are FUEL, priced below
// same-band gather income (ITEM_SELL below) — settling never out-earns the money crop (GBP §2.4).
// Every attack is TELEGRAPHED (a shimmer/creak ≥0.5s before it lands) — the bible's cozy-combat rule.
const CREATURES = {
  wisp:      { name:"Gloam Wisp",     lvl:1,  hp:3, dmg:10, xp:14, drop:"Gloam Thread", n:1,
               tele:0.6, speed:26, col:"#9fd0ff", col2:"#5f7fbf" },   // drifts, shies from light, lunges after a shimmer
  shambler:  { name:"Knot-Shambler",  lvl:10, hp:8, dmg:15, xp:30, drop:"Knotwood",     n:1, drop2:"Gloam Thread", n2:1,
               tele:0.7, speed:16, col:"#7a6a52", col2:"#4a3c2c" },   // slow, then a straight root-creak charge
  embermite: { name:"Ember Mite",     lvl:20, hp:6, dmg:15, xp:46, drop:"Ember Grit",   n:1,
               tele:0.5, speed:40, col:"#ffab5a", col2:"#c05a24" },   // skitters, quick, leaves a warm patch behind
  // v4.1 families 4–5 (V4_BUILD_PLAN §4). Same ladder (30 / 45); XP stays under the ore curve
  // (gold L30=435, cobalt L45=720) for the band — settling is the frequent action, mining the paying one.
  hollowwarden:{ name:"Hollow Warden", lvl:30, hp:16, dmg:15, xp:74, drop:"Warden's Ash", n:1, drop2:"Knotwood", n2:1,
               tele:0.8, speed:14, col:"#8a94b0", col2:"#454a5e", block:true },   // a lost predecessor's echo — turns to face you and GUARDS its front; circle to its back to land a hit
  gloamtangle:{ name:"Gloam Tangle",   lvl:45, hp:8,  dmg:18, xp:0,  splits:true,
               tele:0.6, speed:22, col:"#8fe0c0", col2:"#3a7a5c" },   // splits ONCE when first struck — two Tanglets, no loot itself
  tanglet:   { name:"Tanglet",         lvl:45, hp:6,  dmg:14, xp:65, drop:"Snarlthread", n:1,
               tele:0.5, speed:30, col:"#8fe0c0", col2:"#3a7a5c" },   // the halves a Gloam Tangle breaks into; these carry the loot
  // v4.1 the first Great Knot — a named boss guarding the descent on every 10th floor. ~3× a deep
  // creature's HP, two telegraphed moves (a ground-slam ring + a reaching lunge), a signature drop.
  greatknot: { name:"The Great Knot",  lvl:40, hp:42, dmg:20, xp:360, drop:"Heartknot", n:1, drop2:"Warden's Ash", n2:3,
               tele:0.9, speed:12, col:"#6a5a44", col2:"#2c2318", boss:true },
  // v5.4 "The Oldest Knot" — the TERMINAL fight, on floor 45, the bottom of the wing.
  //
  // Act III's finale chapter names this place, ch7's dialogue calls it "the deepest knot", and until
  // today floor 45 spawned NOTHING: `genUndercroft` printed "the wing ends here — for now" and the
  // emotional climax of the whole game had no mechanical mirror at all. This is that mirror.
  //
  // Deliberately built from the vocabulary the wing already taught rather than a new move set: it
  // slams (floor 10's lesson), it sheds Tanglets (the Gloam Tangle), it lobs star-bolts (the
  // Star-Gnarl), and in its last phase it guards a front (the Hollow Warden). Every telegraph the
  // player has learned in forty-five floors, asked all at once. Knockout is still free — the contract
  // does not bend for a finale.
  oldestknot: { name:"The Oldest Knot", lvl:85, hp:240, dmg:24, xp:6000, drop:"Heartknot", n:3, drop2:"Gloamstar", n2:2,
                tele:0.85, speed:14, col:"#7a6448", col2:"#241c14", boss:true, terminal:true },
  // v4.2 the top two tiers — Warding now has a family at every rung of the unified ladder (1/10/20/30/45/70/85).
  // XP stays under the deep ore curve (deepsilver L70=1050, star metal L85=1560).
  deepknot:  { name:"Deep Knot",       lvl:70, hp:22, dmg:20, xp:190, drop:"Deepgnarl", n:1, drop2:"Snarlthread", n2:1,
               tele:0.7, speed:20, col:"#5a4a6a", col2:"#2a2038", charger:true },   // telegraphs a long charge; slams a wall and STUNS itself — punish the recovery
  stargnarl: { name:"Star-Gnarl",      lvl:85, hp:18, dmg:18, xp:270, drop:"Gloamstar", n:1, drop2:"Deepgnarl", n2:1,
               tele:0.75, speed:16, col:"#c8b8ff", col2:"#6a5a9a", ranged:true },   // the first RANGED restless thing — lobs a slow star-bolt at where you stand; sidestep it
};

// v4.20 — the Undercroft's family bands, lifted out of genUndercroft so ONE table drives both the
// spawner and the Skill Guide. This is the fix for the bug class that made the guide lie: creature
// families were listed as LEVEL unlocks (CREATURES[k].lvl) when spawns have ALWAYS been keyed on depth,
// so the guide padlocked the Great Knot at Warding 40 while the player meets it on floor 10 at ~Warding 8.
// Warding levels gate your Stave and your Resolve, never which restless thing is down there — the wing does.
const WARD_BANDS = [
  { below:5,        kinds:["wisp","wisp","wisp"] },
  { below:10,       kinds:["wisp","wisp","shambler"] },
  { below:15,       kinds:["wisp","shambler","shambler","embermite"] },
  { below:20,       kinds:["shambler","embermite","embermite","hollowwarden"] },
  { below:25,       kinds:["embermite","hollowwarden","hollowwarden","gloamtangle"] },
  { below:30,       kinds:["hollowwarden","hollowwarden","gloamtangle","gloamtangle","embermite"] },
  { below:35,       kinds:["gloamtangle","hollowwarden","deepknot","deepknot"] },
  { below:40,       kinds:["deepknot","deepknot","gloamtangle","stargnarl"] },
  { below:Infinity, kinds:["deepknot","stargnarl","stargnarl","gloamtangle"] },
];
function wardBandFor(depth){ for(const b of WARD_BANDS) if(depth < b.below) return b.kinds; return WARD_BANDS[WARD_BANDS.length-1].kinds; }
// The shallowest floor a family can appear on — DERIVED from the bands, so adding a band can never
// leave the guide stale (the exact drift this release exists to kill).
function wardFirstFloor(kind){
  let lo = 1;
  for(const b of WARD_BANDS){ if(b.kinds.includes(kind)) return lo; lo = b.below; }
  return null;
}

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
  nell:  { season:"Summer", day:24 },   // v4.6 — the dairy keeper, Tom's wife (clear of the Luau d14)
  rowan: { season:"Fall",   day:3  },
  elias: { season:"Fall",   day:26 },   // v4.6 — the last Warden; late fall, clear of the Harvest Fair d22
  bram:  { season:"Winter", day:11 },
  fenn:  { season:"Fall",   day:9  },   // v6.4 — clear of the Harvest Fair (d22) and of Rowan (d3) and Elias (d26)
  // v6.0 the two households. Spread across the four seasons and clear of every festival date and of
  // each other — eleven birthdays on a 112-day year needs placing, not sprinkling.
  ada:   { season:"Spring", day:26 },
  wick:  { season:"Summer", day:2  },
  corin: { season:"Fall",   day:11 },
  sable: { season:"Winter", day:24 },
  thea:  { season:"Summer", day:19 },   // v6.1 (clear of the Luau d14 and Tom d6/Nell d24)
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
  // v4.7 "levelling the seasons" — the Long Climb (v3.10) filled the shared L30–90 desert, but three
  // seasons stayed lopsided: Spring dead-ended at Rhubarb (L30), Winter had only two crops between
  // Frostbloom (L14) and Everbloom (L90), and Summer topped out at Grape (L64). Five season-locked crops
  // close those holes, each priced on the same g/level trend as the Long Climb with long grow times to
  // keep daily yield honest (GBP §9: a season-exclusive crop makes each season a rolling content unlock).
  cloudberry: { name:"Cloudberry", lvl:35, days:6, seed:340, sell:540,  xp:108, shape:"bush",  seasons:["Winter"],          pal:["#4a6a7a","#6a94a8","#e8b45a","#ffd98a"] },
  asparagus:  { name:"Asparagus",  lvl:50, days:6, seed:440, sell:730,  xp:145, shape:"tall",  seasons:["Spring"],          pal:["#4f8a34","#7fbe55","#7a9a4a","#a8c86a"] },
  frostmelon: { name:"Frostmelon", lvl:60, days:7, seed:520, sell:860,  xp:172, shape:"gourd", seasons:["Winter"],          pal:["#4a6a7a","#6a94a8","#8fb8d8","#c8e4f5"] },
  peony:      { name:"Peony",      lvl:75, days:8, seed:680, sell:1140, xp:228, shape:"bush",  seasons:["Spring"],          pal:["#3f7a2e","#5fa03e","#e06a9a","#ff9ac0"] },
  dragonfruit:{ name:"Dragonfruit",lvl:82, days:8, seed:780, sell:1300, xp:252, shape:"star",  seasons:["Summer"],          pal:["#3f7a2e","#5fa03e","#d0407a","#ff7aae"] },
};

// ---- TREES ----
// Willow/Elderwood/Heartwood (Grove Depths Phase 2) fill what was a dead skill from 18 to 99 —
// three species couldn't carry a 99-level grind. Willow is the RS-style fast-XP tree (quick
// chop, cheap wood); Elderwood is the premium timber the late-game sinks ask for; Heartwood is
// the yew/magic analog — slow, sparse, an event to find. Sell prices sit BELOW the g-per-level
// trend on purpose (the gem lesson, 2026-07-12): wood value must never outrun the money crops.
// v3.38 (owner call: "match the tiers of the rocks with the tiers of the trees, higher where
// possible"): ONE ladder for both gathering skills — 1 / 10 / 20 / 30 / 45 / 70 / 85, the higher
// of the two old ladders at every rung. Pine 8→10 and Maple 18→20 here; the rocks moved up to
// meet elderwood/heartwood/silverwood on their side. Rung for rung, oak↔stone, pine↔copper,
// maple↔iron, willow↔gold, elderwood↔cobalt, heartwood↔deepsilver, silverwood↔star metal.
const TREES = {
  // v4.23 "The Even Hand" — HP ONLY (xp untouched). Woodcutting cost 1.17× Mining's energy for the
  // same "99" on the same panel: 94.5 in-game days against 81.1, because a tree's HP-to-XP ratio was
  // 2-3× worse than a rock's at the middle rungs. Measured fix: pine 6→4, maple 11→8, elderwood 16→14
  // lands Woodcutting at 81.0 days — parity to within a rounding error — while the NODE count barely
  // moves (2,084 → 1,992), so the flat ~20-30 actions/level shape the curve was built around is intact.
  // Heartwood and silverwood are deliberately UNCHANGED: at the tool powers you actually hold when they
  // unlock they were already at parity with deepsilver/star metal (silverwood 3 swings = star metal 3).
  // Checked with a reachability-aware sweep (compare only trees you can chop at the power you'd have at
  // that level): this introduces ZERO new ordering inversions; the two pre-existing ones (maple<pine at
  // the Basic axe, elder<willow at high power) are untouched, neither better nor worse.
  oak:       { name:"Oak",       lvl:1,  hp:3,  xp:25,  drop:"Wood",        n:2, pal:["#3f8a3f","#57ad57","#2f6a2f"] },
  pine:      { name:"Pine",      lvl:10, hp:4,  xp:60,  drop:"Pine Wood",   n:2, pal:["#2f6a52","#3f8f6a","#204a3a"] },
  maple:     { name:"Maple",     lvl:20, hp:8,  xp:115, drop:"Maple Wood",  n:2, pal:["#b8683a","#d68a52","#8a4a28"] },
  willow:    { name:"Willow",    lvl:30, hp:8,  xp:150, drop:"Willow Wood", n:2, pal:["#4a8a4a","#6ab86a","#3a6a3a"] },
  elderwood: { name:"Elderwood", lvl:45, hp:14, xp:260, drop:"Elder Wood",  n:2, pal:["#2c5a6a","#3f7a8a","#1e4250"] },
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
  // v3.19 — a vein is ~3× rarer now (the mine is mostly plain stone you dig through), so each is a
  // real find and pays ~3× the XP to match. Stone stays humble filler (there's a lot of it, and it
  // hides the stairs down + feeds Deep Run staircases).
  stone:  { name:"Stone Rock",  lvl:1,  hp:2,  xp:8,   drop:"Stone",      gem:null,      col:"#9a9a9a" },
  copper: { name:"Copper Vein", lvl:10, hp:4,  xp:78,  drop:"Copper Ore", gem:"#e08a45", col:"#c77b3f" },
  iron:   { name:"Iron Vein",   lvl:20, hp:8,  xp:186, drop:"Iron Ore",   gem:"#d8c4bc", col:"#bfa8a0" },
  gold:   { name:"Gold Vein",   lvl:30, hp:12, xp:435, drop:"Gold Ore",   gem:"#ffe27a", col:"#ffd75a" },
  // The Long Climb (v3.10): two deep veins so Mining pays content past Gold (L28) — planted at L45
  // and L70, the heart of the old 71-level dead zone. They spawn only on the deep ore table (below),
  // so shallow floors read exactly as tuned; a low miner facing one gets the "come back stronger"
  // gate, same as Gold today. Rock + cracked sprites auto-generate from `gem`; the drop is a sink.
  // v3.38 (owner call, one day after v3.37's stretch): the rock ladder now matches the TREE
  // ladder rung for rung — 1/10/20/30/45/70/85, the higher of the two old ladders at every slot.
  // Cobalt 40→45 (elderwood's rung), Deepsilver 50→70 (heartwood's), Star Metal 60→85
  // (silverwood's). One ladder, two skills, and no tier anywhere feeds a tool it out-levels.
  cobalt:    { name:"Cobalt Vein",     lvl:45, hp:16, xp:720,  drop:"Cobalt Ore",       gem:"#6a8ad8", col:"#4a6ac8" },
  deepsilver:{ name:"Deepsilver Vein", lvl:70, hp:19, xp:1050, drop:"Deepsilver Ore",   gem:"#c8d8e8", col:"#9ab0c8" },
  // v3.42 (owner: "they look too alike… a little bit of purple, glows more"): star metal goes
  // VIOLET — the Starstone's own family, off the same celestial deposit — with white-hot fleck
  // cores and a light pool in the mine (collectLights). Deepsilver stays put; the gap comes from
  // moving the star, not both.
  starmetal: { name:"Star Metal Vein", lvl:85, hp:22, xp:1560, drop:"Star Metal Shard", gem:"#d8b0ff", col:"#b088e8" },
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
  { name:"Moonperch",     lvl:40, xp:220, sell:620,  pal:["#7a8ac0","#d0d8f0"] },
  { name:"Silvergill",    lvl:55, xp:300, sell:800, pal:["#a8b0bc","#e8ecf2"] },
  { name:"Gulf Sturgeon", lvl:70, xp:420, sell:980, pal:["#5a6a5a","#9ab090"] },
  { name:"Coelacanth",    lvl:85, xp:620, sell:1200, pal:["#2f4a6a","#5a7a9a"] },   // a living fossil — the deep's trophy (trimmed from 2200 so fishing doesn't out-earn the farm base)
  // ---- Winter ice fishing (v3.31) ----
  // Winter is the one crop-less season: farming, orchards and the apiary all suspend, leaving no
  // *renewable* reason unique to the cold. (There's a winter LEGEND — Frostjaw — but a legend is a
  // one-and-done catch, not a loop.) These two bite ONLY in Winter (the `season` field, gated in
  // hookFish's pool) — the frozen coast's own renewable pull. A modest premium for their 28-day
  // window; each still auto-inherits its Cooked variant, EDIBLE, the Almanac, Tom's demand,
  // gifting, and the Collection, exactly like every other fish.
  { name:"Frostfin",      lvl:15, xp:80,  sell:300,  pal:["#8fc0d8","#e0f2fa"], season:"Winter" },   // early-mid; pond + coast
  { name:"Glassperch",    lvl:48, xp:300, sell:760, pal:["#a8c4d8","#eef6fb"], season:"Winter" },   // late trophy; coast only — sits between Moonperch (780) and Silvergill (1080)
  // ---- The Coast Road (v3.36) — the Gullwater's fish ----
  // The river finally exists (WORLD_EXPANSION.md), so the river fish do too. Chub is the friendly
  // early catch; Grayling the river's pride (between Koi 620 and Moonperch 780 — on-curve, no new
  // faucet); Rainrunner is the Stormrider's COUSIN — a regular fish that only runs upriver in a
  // storm (`weather` field, gated in hookFish exactly like the winter fish's `season`), cashing
  // Bram's old line about what the rain brings up the stream.
  { name:"Minnow",        lvl:1,  xp:12,  sell:18,   pal:["#9aa8b0","#d8e2e8"] },   // the river's own level-1 anchor (review fix: without one, beginners' casts fell through to the Sardine fallback — a sea fish in the flagship river)
  { name:"Chub",          lvl:8,  xp:28,  sell:85,   pal:["#8a9a6a","#c8d8a8"] },
  { name:"Grayling",      lvl:35, xp:210, sell:680,  pal:["#9a8ac8","#d8d0f0"] },
  { name:"Rainrunner",    lvl:25, xp:240, sell:550,  pal:["#5a7a9a","#a8d0e8"], weather:"storm" },
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

// ---- LUMBER (construction material) ----
// v3.21 "Raising the Coop": raw logs are milled at the Sawmill into typed Lumber, the currency of
// construction. Each wood species mills to its own board — you need the right lumber for the right
// build (Harvest Moon's carpentry). Lumber sells for EXACTLY its raw-wood value on purpose: there is
// no profit in milling-to-sell (you'd only burn a night), so lumber is a thing you make to BUILD,
// never a money loop — the whole point of the v3.20 wood nerf. Over-milled boards can still be sold
// back at cost, so a mistake is never a loss (the cozy contract).
const WOOD_TO_LUMBER = {
  "Wood":"Oak Lumber", "Pine Wood":"Pine Lumber", "Maple Wood":"Maple Lumber",
  "Willow Wood":"Willow Lumber", "Elder Wood":"Elder Lumber",
  "Heartwood":"Heartwood Beam", "Silverwood":"Silverwood Beam",
};
const WOOD_NAMES = new Set(Object.keys(WOOD_TO_LUMBER));      // what the Sawmill will take
const LUMBER_NAMES = new Set(Object.values(WOOD_TO_LUMBER));  // what it makes

// ---- THE CELLAR (artisan machines) ----
// A crop's second life: the keg ages anything into wine (slow, rich), the preserves jar sets it
// into jam (quick, modest). The multipliers are deliberately shy of the kitchen's best dishes —
// machines trade TIME for value with zero energy, so they must never beat cooking (which costs
// ingredients + attention) or the field itself. And because every product is its own item name,
// Tom's Demand saturates per-product: forty jars of the same jam glut just like forty starfruit.
const MACHINES = {
  // v3.33: each machine declares what it ACCEPTS (and how it asks for it) instead of the old
  // shared machineLoadable() — the Cheese Press takes animal produce, not crops, so the predicate
  // had to move onto the machine. machineLoadable (below) survives as the growable test keg/jar use.
  keg: { name:"Keg",           days:3, mult:2.2, max:4,
         cost:{ g:900, mats:{ "Pine Wood":40, "Iron Ore":2 } },   // v3.20: wood ×5
         product: n => n + " Wine",
         accepts: n => machineLoadable(n), wants:"something grown — a crop or an orchard fruit",
         blurb:"Ages a crop into wine over three days. Patience in a barrel." },
  jar: { name:"Preserves Jar", days:2, mult:1.6, max:6,
         cost:{ g:550, mats:{ "Wood":30, "Copper Ore":2 } },   // v3.20: wood ×5
         product: n => n + " Jam",
         accepts: n => machineLoadable(n), wants:"something grown — a crop or an orchard fruit",
         blurb:"Sets a crop into jam over two days. Summer, kept." },
  // v3.33 "The Dairy": the barn's produce finally has a second life (§3.5 — Milk and Large Milk
  // were the last dead-end goods). One night, ×1.5 — the fastest per-night rate of the cellar,
  // because the input is capped by cows, not fields. Built from LUMBER so the sawmill chain feeds
  // it (cross-skill, like the buildings). The FIRST press is Tom's gift — see NPC_RECOG.
  press: { name:"Cheese Press", days:1, mult:1.5, max:2,
         cost:{ g:1100, mats:{ "Oak Lumber":6, "Iron Ore":2 } },
         product: n => n === "Milk" ? "Cheese" : "Fine Cheese",
         accepts: n => n === "Milk" || n === "Large Milk", wants:"a pail of milk — the cows make the good stuff",
         blurb:"Sets a pail of milk into a wheel of cheese overnight. The barn's answer to the keg." },
  // v3.21: the Sawmill mills raw logs into lumber. Unlike the keg/jar it takes WOOD (not crops), works
  // a BATCH at once (up to sawBatch logs → that many boards) in a single night, and feeds construction.
  sawmill: { name:"Sawmill", days:1, mult:1, max:3, batch:10,
         cost:{ g:1200, mats:{ "Wood":30, "Iron Ore":3 } },
         product: n => WOOD_TO_LUMBER[n],
         accepts: n => WOOD_NAMES.has(n),   // v3.40: the chooser asks every machine the same question
         wants:"a stack of raw logs — one species at a time",   // v3.33: used by the placement toast (its load branch has its own line)
         blurb:"Mills a stack of raw logs into building lumber overnight. One species at a time." },
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
  // v3.29 — the STAR TIER: prestige monuments framed from the deep's terminal materials. This is the
  // downstream loop the Star Metal tools left open (§3.5): once the tools are forged, Star Metal Shard,
  // Cobalt, the Heartwood/Silverwood Beams, Starstone, and Geode Hearts had no consumer and reverted to
  // sell-only. Now they build wonders. Repeatable (placed like any décor, up to the cap) — a real
  // endgame sink for both coin AND the rarest stock, so the deep keeps paying forward.
  crystalspire:{ name:"Crystal Spire",   cost:6000,   mats:{ "Geode Heart":4, "Gold Ore":10 },
                 blurb:"A spire of geode-crystal, lit from within by the mine's own light." },
  starobelisk: { name:"Star Metal Obelisk", cost:8000, mats:{ "Star Metal Shard":4, "Silverwood Beam":6 },
                 blurb:"A finger of star metal on a silverwood plinth, pointing back the way it fell." },
  observatory: { name:"Great Telescope", cost:12000,  mats:{ "Cobalt Ore":8, "Heartwood Beam":6, "Starstone":1 },
                 blurb:"Brass and cobalt, a Starstone for its lens. Rowan says the Guild kept one, once — to watch for the next star to fall." },
  // v4.16 — the WARDEN'S monuments. Same move the star tier made for the mine's terminal ore (§3.5): once
  // Act III's bundles, the nine bells and the five charms were all fed, the eight Undercroft drops had no
  // repeatable consumer and reverted to sell-only. These two give the deep's spoils a standing home on the
  // farm — a bulk sink for the mid-deep materials, and a capstone that eats the rarest of them.
  settledcairn: { name:"Settled Cairn", cost:4000, mats:{ "Deepgnarl":10, "Snarlthread":16, "Warden's Ash":12 },
                 blurb:"A cairn of grief-dark wood and pale ash, stacked and settled. Each stone was a knot in the dark once — quiet now, and kept in the light." },
  wardenlantern:{ name:"Warden's Round-Lantern", cost:6000, mats:{ "Gloamstar":3, "Heartknot":1, "Gold Ore":10 },
                 blurb:"A round-lantern like the ones you relit down the whole wing, a gloamstar for its flame. It never quite goes out — the way a tended place never quite goes cold." },
  // The Storyteller's Banner (v3.32) — the quest cape. Tom shows it locked until every quest in
  // the book is done (state.flags.qpAllTold, set in checkQuests); price is the RuneScape nod —
  // you earned it, but the vendor still charges for the cloth.
  // v4.21 "The Mantle" — the PRESTIGE tier. The bible's §4.6 lists four stand-ins for multiplayer
  // prestige (villagers comment · a title · a mastery cape shown off · a trophy room); only the first
  // ever shipped. Crossing 99 granted a passive perk, a banner and one toast — then nothing to SHOW.
  // These use the proven Storyteller's-Banner pattern: displayed in Tom's shop LOCKED from day one, so
  // the goal advertises itself for the whole climb. Purely cosmetic (the cozy contract: a cape is a
  // flex, never a stat), priced as a nod rather than a sink — you earned it, Tom still charges cloth.
  cape_farming:     { name:"Farmer's Mantle",      cost:990, capeSkill:"Farming",     blurb:"Green as a spring row, hemmed in gold. Ninety-nine levels of soil under one pair of hands." },
  cape_woodcutting: { name:"Forester's Mantle",    cost:990, capeSkill:"Woodcutting", blurb:"Deep bark-brown, lined with leaf. Every tree in the valley knows the sound of you coming." },
  cape_mining:      { name:"Delver's Mantle",      cost:990, capeSkill:"Mining",      blurb:"Slate grey shot through with ore-glint. You have been to the bottom and come back up." },
  cape_fishing:     { name:"Angler's Mantle",      cost:990, capeSkill:"Fishing",     blurb:"Sea-blue, salt-stiff at the hem. Bram will pretend not to look at it. He will look at it." },
  cape_cooking:     { name:"Hearthmaster's Mantle",cost:990, capeSkill:"Cooking",     blurb:"Warm ember-red, faintly flour-dusted. Nobody in this valley goes hungry near you." },
  cape_warding:     { name:"Warden's Mantle",      cost:990, capeSkill:"Warding",     blurb:"Lantern-blue, quiet as the deep. Orla's craft, carried to the end of its ladder." },
  // The capstone: every skill to 99 — total level 594. Gated on the ceremony flag, not the number, so
  // it can never be bought a moment before the valley has said so out loud.
  mastercrown:      { name:"The Valley's Crown",   cost:9900, masterGate:true,
                      blurb:"Nine hundred and ninety-nine mornings, six crafts, one pair of hands. There is nothing left in Willowbrook you have not learned." },
  storybanner: { name:"Storyteller's Banner", cost:500, qpGate:true,
                 blurb:"Every task the valley ever asked — done, and told. It flies for the teller." },
};
// ============================================================
// v5.7 "Four Walls" — THE INTERIOR CATALOG
//
// The measured problem: `genCottage` hard-codes every prop and the cottage **regenerates nightly**
// (only `state.farm` persists), and `plantPermanent`'s very first line refuses décor anywhere but the
// farm. So the one room the player wakes in every single day of the game was the one room they could
// not touch — a diorama. Four expression channels the cozy genre lives on (home, ground, avatar,
// automation) were entirely absent; the one that exists (outdoor décor, 21 pieces, cap 40, lossless
// pickup) is well built and proves the appetite exists.
//
// Fifteen pieces at launch, priced under the outdoor catalog at every tier on purpose: an interior
// piece is seen by you, and the outdoor ones are seen by the valley. The Loom's soft goods arrive in
// V6 (`V6_PLAN.md` §2, v6.4) and slot straight into this table.
const FURNITURE = {
  // rugs & floor
  woolrug:     { name:"Wool Rug",         cost:280,  blurb:"Warm underfoot on a cold floor. Practically a personality." },
  hearthrug:   { name:"Hearthrug",        cost:520,  blurb:"Thick, dark, and slightly singed at one corner already." },
  // light
  candlestand: { name:"Candle Stand",     cost:340,  blurb:"Three candles, none of them level. It's charming." },
  brasslamp:   { name:"Brass Lamp",       cost:900,  blurb:"Polished brass. Throws a good, steady, reading sort of light." },
  hearthfire:  { name:"Hearth Fire",      cost:2600, blurb:"A proper open fire. The room will never be cold again." },
  // storage & surfaces
  smallshelf:  { name:"Small Shelf",      cost:300,  blurb:"For the things that have nowhere else to be." },
  bookcase:    { name:"Bookcase",         cost:780,  blurb:"Tall, honest oak. Will hold more books than you own." },
  sidetable:   { name:"Side Table",       cost:420,  blurb:"Exactly the right height for a cup and nothing else." },
  dresser:     { name:"Dresser",          cost:1200, blurb:"Six drawers, three of which stick. All six will be full." },
  // seats
  armchair:    { name:"Armchair",         cost:1100, blurb:"You will fall asleep in this. Everyone does. That's the point." },
  bench:       { name:"Window Bench",     cost:640,  blurb:"Sit in the good light and watch it rain on somebody else's field." },
  // walls & warmth
  wallhanging: { name:"Wall Hanging",     cost:1500, blurb:"Woven in the old valley pattern. Nobody remembers what it means." },
  potted:      { name:"Potted Fern",      cost:260,  blurb:"Green, undemanding, quietly judging your watering habits." },
  // the dear ones
  cornerdesk:  { name:"Corner Desk",      cost:2200, blurb:"For ledgers, letters, and the long evening sort of thinking." },
  standclock:  { name:"Standing Clock",   cost:5200, blurb:"It keeps the valley's time and says so, once an hour, whether asked or not." },
  // v5.9: the writ set — bought with writ MARKS only, never with coin. The owner's reward-channel
  // decision (`V5_PLAN.md` §6.2) needed a catalog to be worth anything, and this is it: four pieces
  // that say, in a room, that you did the valley's work. Cosmetic to the last pixel, per the contract
  // — marks may never gate anything a player needs.
  guildbanner: { name:"Guild Pennant",  marks:6,  blurb:"The Guild's own colours, small enough for a kitchen wall. They gave you one." },
  writdesk:    { name:"Writ Desk",      marks:10, blurb:"Where the valley's lists get written. There is always another list." },
  lanternrow:  { name:"Lantern Row",    marks:14, blurb:"Five little lamps on a rail, lit the way the village road is lit." },
  valleymap:   { name:"The Valley, Mapped", marks:20, blurb:"Every path you've mended, drawn by somebody who watched you mend them." },
};
// ============================================================
// v5.8 "The Ferry Comes In" — the visiting merchant, Tom's Craving, and the rare sky.
//
// Three separate answers to the same finding: **the valley's week has no texture.** Every day offers
// the same shops, the same noticeboard shape and the same sky; week 40 holds nothing week 4 didn't.
//
// ★ Owner decision (`V5_PLAN.md` §6.3): the ferry comes in on **~2 days a week, SEEDED** — not a
// fixed weekday. Seeded reads as life; a fixed day reads as a schedule to plan around, and planning
// around a schedule is work.
//
// ★ THE CONTRACT LINE, and it governs the whole stall: **nothing baseline-required is ever
// merchant-exclusive.** An expiring offer is foregone gain, which is legal (v3.15's Deep Run
// established it); a missed NECESSITY would not be. Everything below is a convenience, a shortcut or
// a curio — the seeds are out-of-season copies of seeds Tom sells in season, the material is one you
// can mine, and the décor is cosmetic. GBP §5.2b, pointed at the economy: **no number in this game is
// tuned assuming the merchant.**
const FERRY_STOCK = [
  { item:"Starfruit Seeds", cost:900,  n:3, blurb:"out of season, and none of my business why you want them" },
  { item:"Cloudberry Seeds", cost:700, n:3, blurb:"they'll not grow for me. Perhaps they'll grow for you" },
  { item:"Deepsilver Ore",  cost:1400, n:4, blurb:"bought off a miner three coasts north. He was retiring" },
  { item:"Silverwood Beam", cost:2600, n:2, blurb:"pale as a moon and twice as stubborn to cut" },
  { item:"Fine Cheese",     cost:520,  n:4, blurb:"not as good as Nell's. Don't tell her I said the reverse" },
  { item:"Diamond",         cost:2800, n:1, blurb:"one stone, one price, no haggling and no story" },
  { item:"Wall Hanging",    cost:1900, n:1, blurb:"woven inland. The pattern means something there" },
  { item:"Brass Lamp",      cost:1200, n:1, blurb:"salvage. Somebody read by this for forty years" },
  { item:"Bait",            cost:10,   n:20, blurb:"cheaper than Bram's, and he knows it, and we don't discuss it" },
];
// ~2 days in 7, seeded off the day number so it is the same for a given save and unknowable in
// advance. Never on a festival day: the coast belongs to the festival, and a stall competing with a
// ceremony helps nobody.
function ferryToday(){
  if(typeof todaysFestival === "function" && todaysFestival()) return false;   // v6.3: any festival day, wherever it is held
  return makeRng(9001 + state.day * 17)() < 0.28;
}
function ferryStockToday(){
  const rng = makeRng(3300 + state.day * 41);
  const pool = FERRY_STOCK.slice();
  const out = [];
  for(let i = 0; i < 4 && pool.length; i++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
// Tom's Craving — the sell-side texture that Tom's Demand used to provide, rebuilt POSITIVE-ONLY.
// The retired mechanic slid a price DOWN for selling too much of one thing; this pays MORE for one
// thing today. Same texture, opposite sign — and the reason the sign matters is the owner's own call
// on why Demand was retired (v4.9): the slide read as a punishment for a good harvest.
function todaysCraving(){
  const pool = [];
  for(const k in CROPS) pool.push(CROPS[k].name);
  for(const f of FISH) pool.push(f.name);
  for(const r of RECIPES) if(!r.flag) pool.push(r.name);
  const rng = makeRng(7777 + state.day * 13);
  return pool.length ? pool[Math.floor(rng() * pool.length)] : null;
}
const CRAVING_MULT = 1.5;

// ★ Rare sky events — the cross-check's best impact-per-effort item. Seeded, ~2–3 a season,
// announced the evening before by the board so it is a thing you can plan an early night around.
// Each is a MORNING, not a mechanic: a small gatherable or a warm hour, and nothing that punishes
// having slept through it.
const SKY_EVENTS = [
  // ★ Odds MEASURED against a full 112-day year, not guessed: the first pass gave 7 events a year
  // (under the "~2–3 a season" target) and put the comet on the sky twice a year while its own text
  // says "it was last here before Rowan was born". Retuned to ~9–10 a year — and the comet to roughly
  // once every five years, so the line stays true.
  { id:"meteor",  name:"a meteor shower", odds:0.050,
    eve:"The board says: clear skies tonight, and the old almanac marks it a night for falling stars.",
    morn:"Half the night the sky was throwing sparks. There's star-glass in the grass this morning.",
    gift:{ item:"Starlight Shard", n:3 } },
  { id:"aurora",  name:"an aurora", odds:0.032,
    eve:"The board says: the ridge folk expect the lights tonight. Nobody can say why they come.",
    morn:"Green light stood over the ridge until nearly dawn. Nobody in the valley slept, and nobody minded.",
    buff:"aurora" },
  { id:"comet",   name:"the comet", odds:0.002,
    eve:"The board says: the comet is due. It was last here before Rowan was born.",
    morn:"The comet hung over the water all night with a tail like a dropped ribbon. You will not see it again.",
    gift:{ item:"Starstone", n:1 } },
];
function skyTonight(){
  const rng = makeRng(555 + state.day * 29);
  const r = rng();
  let acc = 0;
  for(const e of SKY_EVENTS){ acc += e.odds; if(r < acc) return e; }
  return null;
}
// ============================================================
// v5.9 "The Writ" — the missing middle rung of the goal ladder. The last release of Version 5.
//
// The measured gap: the game has DAILIES (the noticeboard request, Nell's order, Elias's round) and
// then, as the very next rung up, a FESTIVAL every 28 days. There is nothing in between — no goal
// sized to a few relaxed evenings, which is exactly the size most play sessions actually are.
//
// ★ THE FRAMING DECISION, made deliberately and stated in the plan before a line was written: **the
// writ rotates when COMPLETED, never on a timer.** No expiry, no streak, no "3 days left". The
// living-world lens's anti-nagging objection (bible §8.4) is honoured by construction rather than by
// restraint — there is no clock to be behind, so there is nothing to feel guilty about. A player who
// takes a season over one writ has lost nothing at all.
//
// Cross-skill by construction, like the mastery trials: a writ names things from three different
// crafts, so it cannot be fed by rabbit-holing. Sized to ~4–7 relaxed days.
const WRITS = [
  { id:"lanterns", name:"The Lantern Round",
    ask:{ "Pine Lumber":14, "Copper Ore":10, "Cooked Salmon":4 },
    blurb:"Rowan wants every lamp on the village road re-posted before the nights draw in.",
    done:"The road is lit end to end. Folk are walking it after dark again, which is the whole point of a lit road." },
  { id:"larder", name:"The Guild Larder",
    ask:{ "Fine Cheese":5, "Honey":10, "Large Egg":10, "Wheat":24 },
    blurb:"The hall feeds whoever turns up, and lately that is rather a lot of people.",
    done:"The Guild larder is full for the first time since it closed. Rowan keeps opening the door to look at it." },
  { id:"deeproad", name:"The Deep Road",
    ask:{ "Iron Ore":16, "Stone":60, "Maple Lumber":10 },
    blurb:"The lift line wants re-shoring: iron for the brackets, stone for the bed, maple for the cribbing.",
    done:"The lift runs quiet now. A miner three floors down can hear themselves think, which they will tell you is a mixed blessing." },
  { id:"boatyard", name:"The Boatyard",
    ask:{ "Elder Wood":18, "Gold Ore":6, "Prize Fleece":5, "Fish Stew":3 },
    blurb:"Bram has three hulls half-built and a shortage of everything that finishes a hull.",
    done:"Three boats, finished, on the sand. Bram walked round them twice and said 'aye' and that was the speech." },
  { id:"wing", name:"The Warden's Wing",
    ask:{ "Gloam Thread":16, "Warden's Ash":8, "Ember Grit":10, "Peony Cordial":2 },
    blurb:"Elias keeps the wing alone. He has stopped pretending that is sustainable.",
    done:"The wing is stocked corner to corner. He said thank you twice, which from him is a parade." },
  { id:"green", name:"The Festival Green",
    ask:{ "Willow Lumber":16, "Silverwood Beam":2, "Starfruit Sorbet":3, "Cherry Tart":3 },
    blurb:"The Green wants proper trestles and a canopy before the next festival, not the borrowed nonsense of last year.",
    done:"Trestles, canopy, and a table long enough for everybody. Maya has already drawn it." },
  { id:"ridge", name:"The Ridge Path",
    ask:{ "Stone":80, "Heartwood Beam":4, "Cobalt Ore":8 },
    blurb:"The switchbacks up to the ridge are one bad winter from being no path at all.",
    done:"Cut, shored and stepped the whole way to the cairn. The view was always free; now the climb is fair." },
  { id:"creamery", name:"The Butterbrook Line",
    ask:{ "Oak Lumber":16, "Deepsilver Ore":6, "Large Milk":12, "Butterbrook Reserve":1 },
    blurb:"Nell's creamery has outgrown its own plumbing, and she is too polite to say so loudly.",
    done:"The creamery runs on new pipe and new sense. Nell says nothing and gives you cheese, which IS her saying something." },
];
// Writ marks — the reward channel the owner chose (`V5_PLAN.md` §6.2: gold + marks toward cosmetics).
// ★ The dependency that came with that decision, honoured by the release order: marks are worthless
// until a catalog exists, so v5.7's interior list had to land first. It did.
function writIndex(){ return (state.writDone || 0) % WRITS.length; }
// v6.3 — has the Festival Green writ been closed? Derived from the book's own order rather than a
// new flag, so it can never disagree with the writ list: writs are strictly sequential (writIndex is
// a function of writDone alone), so "done >= index+1" is exact. The same shape as v6.2's boatyard
// gate. Keyed by id, not by a typed-in number, so reordering WRITS cannot silently move the payoff.
function writClosed(id){ const i = WRITS.findIndex(w => w.id === id); return i >= 0 && (state.writDone || 0) > i; }
function writGreenDone(){ return writClosed("green"); }
function currentWrit(){ return WRITS[writIndex()]; }
function writRemaining(){
  const w = currentWrit(), paid = state.writBundle || {}, rem = {};
  for(const it in w.ask){ const r = w.ask[it] - (paid[it] || 0); if(r > 0) rem[it] = r; }
  return rem;
}
function writFunded(){ return Object.keys(writRemaining()).length === 0; }
// Pay scales with how many you have finished, gently — the eighth writ asks for deeper things than
// the first, so it should pay like it. Linear, never exponential (the lift's lesson, GBP §2.7).
function writPay(){ return 6000 + 1500 * (state.writDone || 0); }
function writMarks(){ return 3 + Math.floor((state.writDone || 0) / 2); }
const HOME_MAX = 24;   // the cottage is 11×9; two dozen pieces dresses it without making it a warehouse
const DECOR_MAX = 40;   // a generous cap so a farm can be dressed, but not infinitely spammed
const ORCHARD_MAX = 30;   // v4.9: fruit trees were the ONE uncapped placeable (hives/machines/décor all cap). A full orchard, bounded — restores passive-beats-active income (more warranted now flat pricing removed the sell-side brake). Grandfathered: only blocks NEW plantings past the cap.

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
  pond:  ["Sardine", "Bass", "Trout",  "Frostfin", "Golden Koi"],   // trout are a river fish; no salmon inland — Frostfin bites only in winter (season-gated in the pool)
  // the deep-water rarities (v3.10) rise only off the open sea, and only for anglers who've grown
  // into them (the f.lvl filter) — so the coast stays worth casting from L34 all the way to L85
  coast: ["Sardine", "Bass", "Salmon", "Frostfin", "Golden Koi", "Moonperch", "Silvergill", "Glassperch", "Gulf Sturgeon", "Coelacanth"],   // Frostfin + Glassperch are winter-only (season-gated in the pool); pool re-sorts by sell, so order here is just for reading
  // v3.36 The Coast Road: the Gullwater runs on one map only (WORLD_EXPANSION.md's one-river rule).
  // Trout is REHOMED here — its examine always called it a river fish — but stays in the pond table
  // too for now, so no save's routine breaks mid-season; the pond copy can retire in a later pass.
  river:   ["Minnow", "Chub", "Trout", "Rainrunner", "Grayling"],
  estuary: ["Sardine", "Chub", "Salmon", "Rainrunner", "Grayling", "Gulf Sturgeon"],
  // v6.2 Marrow Point: open northern water, deeper and colder than Willowbrook's coast. Same pool as
  // the coast — deliberately NOT a new fish table. The place's reason to exist is the place, and a
  // new species here would be content the coast then lacks. (Foraging's release adds its own nouns.)
  point:   ["Salmon", "Frostfin", "Moonperch", "Silvergill", "Glassperch", "Gulf Sturgeon", "Coelacanth"],   // brackish mouth — the sea-run overlap, where "fresh off the sea-run" is literally true
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
// v5.3 "The Deep Seams" — the late waters. Fishing's last content unlock sat at 85 (a rod tier) with
// nothing between 55 and 70 and nothing between 75 and 85; the cadence linter measured 79.0% dead.
// Legends are the cheapest high-value content in the repo — pure data on a shipped engine — and they
// are the RIGHT content for a late band: a legend is a condition to read and a morning to plan, not
// another number. Both of these are heart-gated clues (Bram tells one per heart), which finally gives
// his ladder a late payoff rather than running out at five.
LEGENDS.push(
  { id:"lanternjaw", name:"Lantern-Jaw", lvl:60, sell:2100, xp:900,
    where:"estuary", from:20, to:26, weather:"fog", season:"Fall", chance:0.30,
    pal:["#3a4a5a","#9fe0d0"],
    clue:"There's a thing in the estuary on a foul autumn night — fog on the water, after eight, where the salt meets the fresh. It carries its own light in front of it, like a lantern-bearer. I've never landed one. You might." },
  // Placed at 80, not the plan's "~75": 75 is ALREADY a milestone on every ladder (the mastery tier),
  // so a legend there would have added a name and moved the cadence not at all. At 80 it splits the
  // 75→85 band in two and the dead zone disappears outright. Measured, not guessed — this is exactly
  // the decision the v5.0 linter exists to make possible.
  { id:"tidewarden", name:"Tide-Warden", lvl:80, sell:3400, xp:1500,
    where:"coast", from:5, to:9, weather:"storm", season:"Winter", chance:0.26,
    pal:["#2f3f52","#c8d4dc"],
    clue:"And the last one, which I'll only tell you because you've earned it. Winter storm, first light, out on the open coast — the morning nobody sane is on the water. Something old comes in on that tide. My father called it the Tide-Warden and never fished again after he saw it." }
);
const LEGEND_BY_ID = {}; LEGENDS.forEach(l => LEGEND_BY_ID[l.id] = l);

// ============================================================
// v5.3 "The Deep Seams" — GEM SEAMS, and Mining's 19.3% void
//
// The measurement, from the game's own linter: **Mining 50→70 is 20 levels and 19.3% of the entire
// 1–99 climb with literally nothing in it** — the single worst void in the game — and Mining has the
// fewest milestone levels of any gathering skill. The ore ladder cannot fix it: 1/10/20/30/45/70/85
// is the unified tier ladder that six systems key off, and V5's constraint #4 says it does not move.
//
// So the answer interleaves BETWEEN its rungs: four dedicated gem seams at 15 / 35 / 55 / 78, the
// third of which lands squarely inside the 50→70 void. A seam is a distinct rock that yields a
// SPECIFIC gem — you learn where rubies live, instead of hoping a gem rock rolls one.
//
// ★ THE BALANCE PASS, done at spec time per V5's constraint #3 (there is no demand curve any more —
// `demandMult` returns 1 — so a new sellable has no systemic brake and its arithmetic must be done
// BEFORE the code). Gems were deliberately de-monetized twice (v2.9.2, v3.16 "The Long Dark":
// spawn 0.018 → 0.002, average value ~312g → ~150g) precisely because they were the game's runaway
// faucet. This release must not quietly undo that. So:
//   · Seams are RARER than ore veins by an order of magnitude (0.0012 base vs ore's 0.03), and their
//     depth scaling is clamped like the gem clamp above it, never like ore's to floor 40.
//   · A seam yields ONE gem (a second only on a Mining-75 mastery roll). It is not a pile.
//   · ★ MEASURED, not estimated — and the first pass was wrong by 6×. A mine floor carries ~100 open
//     tiles, not the ~600 first assumed, so the original rate produced 0.23 seams per floor (one every
//     four floors — too scarce to read as an unlock). Sampled over 40 deep floors and retuned to land
//     at ~0.85 per floor: you meet a seam on most floors of a deep run, and a Ruby Seam
//     floor is worth ~340g — real, and a rounding error beside the fishing loop the docs clock at
//     ~64,000 g/day. The seam's value is the LADDER, not the coin.
//   · Every gem already has sinks (tool tiers, charms, pledges), so this feeds demand that exists.
const GEM_SEAMS = {
  opalseam:    { name:"Opal Seam",    lvl:15, hp:6,  gem:"Opal",    xp:120,  col:"#bcd8d4", depth:8  },
  emeraldseam: { name:"Emerald Seam", lvl:35, hp:12, gem:"Emerald", xp:340,  col:"#3ec878", depth:22 },
  // ★ the one this release exists for — planted inside Mining's 50→70 void
  rubyseam:    { name:"Ruby Seam",    lvl:55, hp:18, gem:"Ruby",    xp:760,  col:"#e0455a", depth:38 },
  diamondseam: { name:"Diamond Seam", lvl:78, hp:26, gem:"Diamond", xp:1400, col:"#b8ecf7", depth:58 },
};
// ★ "Read the seams" — Mining 60, a METHOD unlock rather than a number, and the second thing in the
// 50→70 band. On entering a mine floor, every seam on it shimmers once. It reveals nothing you could
// not find by walking; it saves the walking, which is exactly what a veteran prospector's eye is.
const PROSPECT_LEVEL = 60;

// ---- SELL VALUES ----
const ITEM_SELL = { "Wood":4, "Pine Wood":9, "Maple Wood":17, "Willow Wood":11, "Elder Wood":32, "Heartwood":70, "Silverwood":113,   // v3.20: wood sells for ~1/3 — the renewable grove made chop-and-sell too easy a purse; wood is a construction material now, not a money crop
  "Stone":3, "Copper Ore":30, "Iron Ore":68, "Gold Ore":165, "Cobalt Ore":300, "Deepsilver Ore":370, "Star Metal Shard":450,   // shard seats under Diamond (520) — an ore must never out-value a common gem (the Starstone is a class apart); Deepsilver (v3.37) sits between Cobalt and the shard, on-curve
  // v4.0 warding drops — FUEL, not a faucet (GBP §2.4). Priced deliberately LOW: the Undercroft is
  // gated behind Act II + total-100, so a settler always has iron/gold to mine (68/165g) — these sit
  // well under that, and under the wood ladder they resemble (Maple 17 · Elder 32). Their real value
  // is as materials (charms, bell pledges, machine feed), so resale is a floor, never the point.
  "Gloam Thread":18, "Knotwood":24, "Ember Grit":30,
  // v4.1 deeper drops — same rule: priced under the same-band gather (gold ore 165 · cobalt 300),
  // fuel for the charm/bell sinks, never a money faucet. Heartknot is a rare boss trophy whose real
  // value is the top Resolve charm, not the counter.
  "Warden's Ash":34, "Snarlthread":42, "Heartknot":130,
  // v4.2 deepest drops — still under same-band gather (deepsilver ore 370 · star metal shard 450);
  // Gloamstar is the star-touched warding material, its real value the ultimate charm.
  "Deepgnarl":55, "Gloamstar":85 };
// v4.26: the grilled premium drops 1.75 → 1.40 as the base, and the rest is EARNED — see cookedMult()
// in 08-actions.js, which adds a Cooking band on top (×1.00/1.05/1.10/1.18 at 1/40/70/99, i.e. a net
// 1.40/1.47/1.54/1.65). Every rung sits under today's flat 1.75, so this is a genuine trim of the
// runaway loop AND Cooking 99 becomes a visible reward instead of a number. ITEM_SELL keeps the base;
// the band is applied at price time so it tracks your level without a table rebuild.
const GRILL_MULT = 1.40;
FISH.forEach(f => { ITEM_SELL[f.name] = f.sell; ITEM_SELL["Cooked "+f.name] = Math.floor(f.sell*GRILL_MULT); });
LEGENDS.forEach(l => { ITEM_SELL[l.name] = l.sell; });   // trophies. You don't cook a Stormrider.
for(const k in CROPS) ITEM_SELL[CROPS[k].name] = CROPS[k].sell;

// ---- EDIBLES (energy restored) ----
const EDIBLE = { "Berry Bun":34, "Field Salad":26 };
FISH.forEach(f => EDIBLE["Cooked "+f.name] = 22 + f.lvl);

// ---- GEMS (from the mine) & SHORE forage (from the beach) ----
// v3.18 — a RuneScape-shaped gem ladder: Opal (humblest) → Topaz → Sapphire → Emerald → Ruby →
// Diamond, and above them all the STARSTONE — the Onyx/Zenyte-rare gem, kin to the vault's star
// metal, that only the deep Star Metal veins give up (and that the ultimate tools are forged around).
// Amethyst stays for one reason: it's Gary, Pip's keepsake — kept for his sprite/lore, out of the pool.
const GEMS = { Opal:"#bcd8d4", Topaz:"#e8b23a", Sapphire:"#3a6ad0", Emerald:"#3ec878", Ruby:"#e0455a",
  Diamond:"#b8ecf7", Starstone:"#c8b8ff", Amethyst:"#a877e0" };
// Values sit low (owner playtest 2026-07-12: gems are a treat, not the economy) and gems are 5× rarer
// since v3.16; the Starstone is the exception — a genuine trophy, though you'll want to keep it for a tool.
const GEM_SELL = { Opal:60, Topaz:100, Sapphire:160, Emerald:240, Ruby:340, Diamond:520, Starstone:1800 };
// Drops weighted toward the humble end — a Diamond is an event. (Starstone is NOT here: it never rolls
// from an ordinary gem rock; it comes only off a Star Metal vein — see the mining code.)
const GEM_WEIGHTS = [["Opal",5],["Topaz",3.5],["Sapphire",2.2],["Emerald",1.4],["Ruby",0.8],["Diamond",0.35]];
function pickGem(){
  let t=0; for(const [,w] of GEM_WEIGHTS) t+=w;
  let x=Math.random()*t;
  for(const [g,w] of GEM_WEIGHTS){ if((x-=w)<0) return g; }
  return "Opal";
}
for(const g in GEM_SELL) ITEM_SELL[g] = GEM_SELL[g];
ITEM_SELL["Amethyst"] = 75;   // Gary — kept sellable (Pip will "KNOW"), but he's no longer mined or in the museum
const SHORE = { Shell:22, Coral:48, Seaweed:14, Clam:38, Pearl:260 };
for(const s in SHORE) ITEM_SELL[s] = SHORE[s];
EDIBLE["Clam"] = 20;
// v3.36 The Coast Road: roadside forage — real coastal plants, priced as small daily treats
// on the shore curve (Seaweed 14 … Coral 48), never a faucet.
const ROADSIDE = { Samphire:55, "Sea Holly":40 };
for(const s in ROADSIDE) ITEM_SELL[s] = ROADSIDE[s];
EDIBLE["Samphire"] = 14;   // crisp, salty — the coast's pocket snack
// v3.43 Starfall Ridge: alpine forage by day, starlight by night. The Starlight Shard is a
// gleanable CURIO (sellable per the owner's call) — deliberately its own item, never the mine's
// Star Metal Shard, so the summit is a treat and not a surface faucet for the L85 material
// (though a glean has a small chance of turning up the real thing — a trickle, bounded).
// (Review rebalance, same release: the shard launched at 120g × ~8.5 nodes + a 6% star-metal
// roll ≈ 1.4k/night, UNGATED — a bigger printer than the one v2.0 nerfed, live from day 2. It
// now sits at the top of the forage band like everything else pickable by hand: ~350g/night,
// the beach's own ungated envelope, with the star-metal trickle at 3% as the real prize.)
const ALPINE = { "Mountain Thyme":45, "Snowdrop":38, "Starlight Shard":42 };
for(const s in ALPINE) ITEM_SELL[s] = ALPINE[s];
// v3.28 "Geodes": the mine's canopy-nest — a rare deep geode cracks into a curio for the shelf. These
// are Collection pieces first, coin a distant second (they never out-earn the field), so the deep pays
// in wonder, not gold. GEODE_CURIOS are the common set; a Geode Heart is the rare prize.
const GEODE_CURIOS = ["Amber","Obsidian","Trilobite","Quartz Cluster"];
const SPECIMENS = { Amber:40, Obsidian:26, Trilobite:58, "Quartz Cluster":34, "Geode Heart":90 };
for(const s in SPECIMENS) ITEM_SELL[s] = SPECIMENS[s];   // (their EXAMINE lines live after `const EXAMINE`, below)
ITEM_SELL["Frostberry"] = 40;             // winter forage — the valley still gives, just less
EDIBLE["Frostberry"] = 20;
for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k];
  ITEM_SELL[t.fruit] = t.sell; EDIBLE[t.fruit] = 24; }
ITEM_SELL["Honey"] = 100; EDIBLE["Honey"] = 30;
const FRUIT_NAMES = new Set(Object.values(FRUIT_TREES).map(t => t.fruit));

// Lumber sells for its raw-wood value — milling adds no coin, only build-ability (see WOOD_TO_LUMBER).
for(const raw in WOOD_TO_LUMBER) ITEM_SELL[WOOD_TO_LUMBER[raw]] = ITEM_SELL[raw];
ITEM_SELL["Sawmill"] = 0;   // the machine itself isn't resold (mirrors Keg/Jar)

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
// v3.33: the press's wheels — Milk×1.5 and Large Milk×~1.5, on the keg discipline (processed goods
// earn their margin from the wait, never from thin air)
ITEM_SELL["Cheese"] = 135; ITEM_SELL["Fine Cheese"] = 250;
ITEM_SELL["Bait"] = 8;   // v4.9 fishing bait — cheap; bought at Bram's (15g), a low resale so there's no buy-low-sell-high loop
ITEM_SELL["Sea Aster"] = 55; EDIBLE["Sea Aster"] = 12;   // v4.13 Butterbrook's coastal wildflower forage — a garnish's worth of coin, and the key to Nell's secret dish
EDIBLE["Cheese"] = 30; EDIBLE["Fine Cheese"] = 50;
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
  { name:"Tomato Soup",       lvl:15, ing:{Tomato:2},                    energy:66,  sell:470, xp:38, col:"#e0452a" },
  { name:"Blueberry Tart",    lvl:18, ing:{Blueberry:2, Wheat:1},        energy:80,  sell:470, xp:42, col:"#5a6ad0" },
  { name:"Farmer's Omelette", lvl:22, ing:{Egg:2, Milk:1},               energy:100, sell:360, xp:50, col:"#ffe08a" },
  { name:"Pumpkin Soup",      lvl:28, ing:{Pumpkin:1, Milk:1},           energy:95,  sell:680, xp:75, col:"#ff8a2a" },
  { name:"Fish Stew",         lvl:32, ing:{Salmon:1, Carrot:1, Tomato:1},energy:88,  sell:680, xp:99, col:"#d76a4a" },
  { name:"Cranberry Sauce",   lvl:36, ing:{Cranberry:2},                 energy:60,  sell:730, xp:127, col:"#c02a3a" },
  { name:"Frostbloom Tea",    lvl:40, ing:{Frostbloom:1, Milk:1},        energy:70,  sell:590, xp:159, col:"#a8d8f0" },
  // Second Helpings (v3.11): eight late dishes so Cooking keeps unlocking recipes to L90, not just
  // perks — and they eat The Long Climb's new crops & fish, closing that loop. Each sells at the
  // series' ~1.4x-over-ingredients profit line (Tom's per-dish demand still caps the daily take),
  // and auto-inherits its plate sprite (from col), sell, EDIBLE, the Kitchen collection, and the
  // skills-panel next-unlock. The crown, Grand Feast, needs mastery in Farming, Fishing AND Cooking.
  { name:"Rhubarb Pie",       lvl:44, ing:{Rhubarb:1, Wheat:2},              energy:85,  sell:820,  xp:194,  col:"#d0454a" },
  { name:"Melon Sorbet",      lvl:48, ing:{Melon:1, Milk:1},                 energy:90,  sell:1050, xp:234, col:"#8fd06a" },
  { name:"Stuffed Artichoke", lvl:54, ing:{Artichoke:1, Egg:1, Wheat:1},     energy:96,  sell:1280, xp:302, col:"#a8b87a" },
  { name:"Grape Tart",        lvl:60, ing:{Grape:1, Wheat:1},                energy:92,  sell:1400, xp:379, col:"#7a4a9a" },
  { name:"Harvest Roast",     lvl:68, ing:{Yam:1, Carrot:2},                 energy:100, sell:2050, xp:497, col:"#c06a3a" },
  { name:"Fisherman's Pie",   lvl:74, ing:{Salmon:1, Yam:1, Milk:1},         energy:100, sell:2250, xp:597, col:"#d0a060" },
  { name:"Everbloom Cordial", lvl:82, ing:{Everbloom:1, Honey:1},            energy:90,  sell:2400, xp:746, col:"#c8b0f0" },
  { name:"Grand Feast",       lvl:90, ing:{"Gulf Sturgeon":1, Yam:1, Everbloom:1}, energy:100, sell:5400, xp:913, col:"#e0c070" },
  // v4.8 "the kitchen catches up" — every produced good should feed a downstream loop (GBP §3.5,
  // reward-is-an-input), but several premium goods dead-ended at the counter: the Cheese Press's own
  // Cheese/Fine Cheese, the orchard's Apple/Cherry/Plum, Starfruit, and v4.7's five new crops all had
  // NO recipe. Ten dishes close those loops, priced ~1.4–1.5× their ingredient cost (so cooking always
  // beats selling the raw good) and slotted into the Cooking unlock ladder's gaps (L20–84). Sell tracks
  // the ingredients (a Starfruit dish is dear, a Plum dish humble), not strictly the level.
  { name:"Apple Crumble",       lvl:20, ing:{Apple:3, Wheat:1},               energy:80,  sell:420,  xp:44,  col:"#d0403a" },   // orchard: Apple
  { name:"Cheese Toastie",      lvl:26, ing:{Cheese:2, Wheat:1},              energy:76,  sell:500,  xp:64,  col:"#e8c85a" },   // dairy: Cheese
  { name:"Cherry Tart",         lvl:34, ing:{Cherry:3, Egg:1, Wheat:1},       energy:82,  sell:580,  xp:112,  col:"#c02a3a" },   // orchard: Cherry
  { name:"Starfruit Sorbet",    lvl:38, ing:{Starfruit:1, Milk:1},            energy:88,  sell:1480, xp:142,  col:"#ffe25a" },   // Starfruit (premium)
  { name:"Asparagus Quiche",    lvl:46, ing:{Asparagus:1, Egg:2, Cheese:1},   energy:92,  sell:1400, xp:214,  col:"#7a9a4a" },   // v4.7 crop + Cheese
  { name:"Plum Pudding",        lvl:52, ing:{Plum:3, "Large Milk":1},         energy:90,  sell:720,  xp:278, col:"#7a4a9a" },   // orchard: Plum
  { name:"Cloudberry Preserve", lvl:58, ing:{Cloudberry:2, Honey:1},          energy:70,  sell:1700, xp:352, col:"#e8b45a" },   // v4.7 crop
  { name:"Frostmelon Ice",      lvl:64, ing:{Frostmelon:1, "Large Milk":1},   energy:90,  sell:1500, xp:436, col:"#8fb8d8" },   // v4.7 crop
  { name:"Peony Cordial",       lvl:78, ing:{Peony:1, Honey:1},               energy:88,  sell:1820, xp:670, col:"#e06a9a" },   // v4.7 crop
  { name:"Dragonfruit Parfait", lvl:84, ing:{Dragonfruit:1, "Fine Cheese":1}, energy:94,  sell:2300, xp:786, col:"#d0407a" },   // v4.7 crop + Fine Cheese
  // v4.13 (owner update 2) — Nell's secret. NOT learned by Cooking level: it's flag-gated on `nellRecipe`,
  // which only her 6♥ heart event sets — a true friendship payoff. Uses the finest dairy + a Butterbrook
  // Sea Aster, so it ties her Larder, the coast forage and a well-loved cow together into one prize dish.
  { name:"Butterbrook Reserve", lvl:0, flag:"nellRecipe", ing:{"Fine Cheese":1, "Large Milk":1, "Sea Aster":2}, energy:95, sell:1100, xp:330, col:"#f0e0a8" },
];
RECIPES.sort((a,b) => a.lvl - b.lvl);   // v4.8: keep the Kitchen list level-ordered so appended recipes slot in (nothing indexes RECIPES by position)
// v4.23: the ladder must never regress — a higher-level dish that pays LESS XP than one you already knew
// is a level-up that hands you a downgrade, and the Kitchen shipped five of those. This is the guard, not
// a comment: it runs at load, costs one pass, and console.warns rather than throwing so a bad number can
// never black-screen the game. (lvl:0 dishes are friendship-taught — outside the level ladder, skipped.)
(function auditRecipeLadder(){
  let prev = 0, prevName = "";
  for(const r of RECIPES){
    if(r.lvl <= 0) continue;
    if(r.xp < prev) console.warn(`[recipe ladder] ${r.name} (Lv${r.lvl}) pays ${r.xp} XP — less than ${prevName}'s ${prev}. A later dish must never pay less.`);
    if(r.xp > prev){ prev = r.xp; prevName = r.name; }
  }
})();
RECIPES.forEach(r => { ITEM_SELL[r.name] = r.sell; EDIBLE[r.name] = r.energy; });
// v5.2 the Warden's tonics. Priced deliberately BELOW the dish that goes into them: a tonic must
// never be a way to launder a Fish Stew into more gold than the stew was worth, or the kitchen grows
// a second faucet by accident (GBP §2.5's obligation — the arithmetic before the code). They are a
// SINK: brewing one spends a dish and a settling drop and returns something you drink.
// v5.6: Tom's Ledger — a 10♥ keepsake, not a commodity. Sell value 0 for the same reason the
// Pocketwatch and the Forester's Band have none: a gift that closes somebody's arc is not inventory.
ITEM_SELL["Tom's Ledger"] = 0;
ITEM_SELL["Sable's Remedy Book"] = 0;   // v6.0 — a 10♥ keepsake, like the Ledger and the Pocketwatch
// v5.6: Tom's 8♥ discount. He says "have a discount and stop looking at me like that" and this is it —
// 10% off everything he sells, forever. ★ Deliberately ONE function called by BOTH the shop rows and
// the buy handlers: v4.37's whole release was about prices that disagreed with the counter, and a
// discount applied in one place and not the other is exactly that bug wearing a bow.
function tomPrice(g){ return (state.flags && state.flags.tomDiscount) ? Math.max(1, Math.round(g * 0.9)) : g; }
ITEM_SELL["Ember Broth"] = 240; ITEM_SELL["Gloamsalve"] = 300; ITEM_SELL["Warden's Tea"] = 260;

// ---- ROWAN'S RESTORATION PROJECTS ----
// Late-game gold has nowhere to go. These turn a pile of coin into things you can walk on.
// Fund one, sleep, and it exists. ~16,000g of sinks in total.
const PROJECTS = [
  // ---- FARM CONSTRUCTION (v3.21+) — building:true entries render under their own Ledger heading and
  // stamp a structure onto the persistent farm when funded. The Coop is the on-ramp: it teaches the
  // sawmill→lumber→build loop, and a new farm starts WITHOUT it (built here), while old saves keep theirs.
  // site = the exact structure rect the stamp overwrites; sign = the one extra tile the sign object lands on.
  // buildingSiteBlocked guards exactly these (no looser bbox — else a respawned ridge rock in the gap
  // could spuriously block funding), and it is re-checked at build time so nothing is ever buried.
  // v3.24: buildings pull from MORE than Woodcutting — a stone foundation, iron footings, a gem fitting —
  // so raising the homestead craves several skills' output (cross-feed), escalating coop→barn→stable.
  { id:"coop", name:"The Chicken Coop", gold:500, items:{ "Oak Lumber":12, "Wood":15, "Stone":8 }, building:true, site:[14,4,17,6], sign:[18,6],
    blurb:"Raise a coop from your own milled oak on a footing of stone — Rowan will walk you through the joinery. Hens want a home before they'll come to stay.",
    done:"The coop stands, snug and dry. Tom can sell you hens now." },
  { id:"barn", name:"The Barn", gold:1800, items:{ "Oak Lumber":18, "Pine Lumber":14, "Maple Lumber":8, "Wood":30, "Stone":20, "Iron Ore":4 }, building:true, site:[20,3,25,6], sign:[26,6],
    blurb:"A proper barn takes stouter framing — oak sills, pine studs, maple beams, stone footings, iron for the nails. Cows and sheep will want the room.",
    done:"The barn is raised, sound to the ridgepole. Tom can sell you cows and sheep now." },
  // v3.22: a wholly NEW structure (never existed) — no save migration needed; proj_stable defaults
  // unset for every save, so old and new alike must build it. Unlocks the horse (press H to ride).
  { id:"stable", name:"The Stable", gold:3000, items:{ "Oak Lumber":20, "Pine Lumber":16, "Maple Lumber":12, "Wood":40, "Stone":24, "Iron Ore":6, "Emerald":1 }, building:true, site:[28,3,31,5], sign:[32,6],
    blurb:"An open-fronted stall for a horse of your own — timber and stone, iron fittings, an emerald set in the gate-post for luck. Once it stands, press H out in the open to swing up and ride; the valley gets a good deal smaller.",
    done:"The stable stands, straw down and rail up. Press H outdoors to call your horse and ride." },
  { id:"minecart", name:"The Minecart Line", gold:8000, items:{ "Iron Ore":20, "Wood":150 },
    blurb:"Re-lay the old rails from the cottage to the mine mouth. No more trudging the ridge.",
    done:"The rails are re-laid. A cart waits at each end." },
  { id:"boardwalk", name:"The Coast Boardwalk", gold:5000, items:{ "Wood":200, "Pine Wood":50 },
    blurb:"Plank the marsh path and hang lanterns. The coast stops being a hike.",
    done:"The boardwalk is laid, and the lanterns are lit." },
  { id:"fountain", name:"The Town Fountain", gold:3000, items:{ "Stone":10, "Emerald":2 },
    blurb:"A fountain by Tom's door, as there was once. Toss a coin; word of your wish gets around.",
    done:"The fountain runs again. Pip has already fallen in." },
  // the deep grove's timber gets a civic home — Elderwood's first sink outside the lift
  { id:"arbor", name:"The Grove Arbor", gold:4000, items:{ "Elder Wood":50, "Willow Wood":75 },
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
// v4.9 (owner call): Tom's Demand is RETIRED. The per-item, per-day price slide (the v2.0
// anti-hoarding tax) is gone — every unit now sells at full base price, always. This function is
// kept as a no-op so all its call sites (nextUnitPrice / bundlePrice / sellItem / the sell panel)
// keep working untouched; they just always see a multiplier of 1. The rest of the demand plumbing
// (state.market tracking, the overnight halving) is now dormant and harmless.
function demandMult(item, k){ return 1; }

// ---- MASTERY ----
// The 1-99 curve promised mastery and paid out nothing past the last content unlock.
// Four milestones per skill, all small and passive — you feel them, you don't manage them.
const MASTERY = {
  // v6.4 Smithing. Every effect is a SAVING, never a gate — the same rule that keeps Smithing off the
  // tool ladder. A smith who never levels loses nothing; a smith who does spends less.
  Smithing: {
    25: "Hot Work — a forging sometimes costs no energy",
    50: "Thrift — a forging sometimes returns a bar",
    75: "True Temper — forged goods are sometimes worth more",
    99: "Master of the Fire — the forge rarely takes anything at all",
  },
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
  // v4.0 Warding — cozy, never punishing: the capstone makes you effectively un-knock-out-able
  // (Resolve floored at 10), the earlier tiers ease the grind and soften the dark's touch.
  Warding: {
    25: "Steady Ward — settling a restless thing gives back a little Resolve",
    50: "Gloamwise — restless things sometimes give an extra material",
    75: "Unshaken — the dark's touch costs you less Resolve",
    99: "Lanternheart — your Resolve never falls below 10",
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
  { who:"pip",   item:"Opal",        qty:1,  lvl:10, line:"Gary needs a FRIEND. It's not for me. It's for Gary. He gets lonely in the box." },
  { who:"maya",  item:"Carrot",      qty:5,  lvl:6,  line:"Soup for Rowan. He'll say he isn't hungry and then eat the whole pot. He does it every year." },
  { who:"bram",  item:"Salmon",      qty:2,  lvl:20, line:"Not for me. For the smoker. The smoker doesn't care whose hands did the work — and neither do I." },
  { who:"rowan", item:"Emerald",     qty:1,  lvl:20, line:"For the Guild seal. Green for growing. Your grandfather chose that stone and I have never told him I agreed." },
  { who:"tom",   item:"Pumpkin",     qty:2,  lvl:22, line:"Two. Enormous ones. I want them in the window and I want the whole valley to see them." },
  // v4.18 "The Standing Board" — higher-tier asks so the board stays worth reading past the early game.
  // Appended (never inserted) so any save's cached reqIdx stays valid. Requesters stay the board's five
  // (tom/pip/maya/bram/rowan) — Nell and Elias have their own daily loops (NELL_ORDERS / the Warden's Round).
  { who:"maya",  item:"Corn",         qty:4,  lvl:16, line:"Gold on the stalk — I want to paint a whole field of it, and I've run clean out of yellow twice already. Four ears?" },
  { who:"tom",   item:"Cranberry",    qty:4,  lvl:18, line:"Cranberries, a crate of them. I've a plan involving a sauce and a very large customer, and I'll say no more than that." },
  { who:"maya",  item:"Starfruit",    qty:2,  lvl:24, line:"A starfruit, cut across — a perfect star, right there inside it. I don't believe it every single time. Two, so I can eat one and doubt the other." },
  { who:"rowan", item:"Gold Ore",     qty:3,  lvl:30, line:"Gold for the hall's old fittings. Not for show — for the doing of a thing properly, which is the only kind of show I'll permit." },
  { who:"maya",  item:"Rhubarb",      qty:3,  lvl:30, line:"Rhubarb's an ugly, wonderful thing and nobody paints it. I intend to correct the record. Three stalks." },
  { who:"tom",   item:"Melon",        qty:3,  lvl:40, line:"Melons — big ones. I've a mind to slice them at the counter and give the pieces away, which my ledger calls madness and I call Tuesday." },
  { who:"rowan", item:"Ruby",         qty:1,  lvl:45, line:"A ruby, for the forge-master's seal we never recut after the fire. Red for the hearth. …It's time we did." },
  { who:"rowan", item:"Cobalt Ore",   qty:2,  lvl:45, line:"Cobalt — the deep blue. The Guild used it for the cold-work, and I've forgotten more of that craft than I'd care to admit. Two, to remember by." },
  { who:"maya",  item:"Artichoke",    qty:3,  lvl:52, line:"An artichoke is a rose that decided to become a vegetable, and I respect it enormously. Three, for a study." },
  { who:"tom",   item:"Grape",        qty:4,  lvl:64, line:"Grapes — for the good wine, the sort I don't sell to just anyone. You qualify. Four bunches?" },
  { who:"bram",  item:"Gulf Sturgeon",qty:1,  lvl:70, line:"A gulf sturgeon. Old fish, deep water, older than the Guild. Land me one and I'll not ask where — and ask Maya to keep it off her plate, she'll try." },
  { who:"rowan", item:"Deepsilver Ore",qty:2, lvl:70, line:"Deepsilver, from below the old workings — pale as a winter moon. The founders swore it kept the dark honest. I've a mind to test the claim." },
  { who:"tom",   item:"Yam",          qty:3,  lvl:78, line:"Yams. Don't laugh. There's a woman up the coast who trades me cheese for them, and I'll not jeopardise that arrangement for anyone." },
  { who:"pip",   item:"Dragonfruit",  qty:2,  lvl:82, line:"DRAGON. FRUIT. It's PINK and it has SPIKES and it's the COOLEST fruit and I need TWO — one to eat and one to scare Gary with." },
  { who:"bram",  item:"Coelacanth",   qty:1,  lvl:85, line:"…The coelacanth. The fish that was meant to be gone before there were people to miss it. Land one and don't tell me it was easy. Let an old man keep the mystery." },
  { who:"maya",  item:"Everbloom",    qty:2,  lvl:90, line:"The Everbloom — the flower that keeps through winter. Gran said they only grow for someone who never gave up on the valley. Two, to paint. …And to prove her right about you. ♥" },
];

// ---- TOOLS ----
// v4.0 "The Tenth Door": the Stave joins as the sixth tool — the Warden's tool, the weapon of the
// new Warding skill. It rides the SAME 7-tier ore+wood ladder as every other tool (V4_PLAN §2:
// "Warding gear = the sixth line on the tool wall"), so all the tier-indexed tables below cover it
// unchanged; only TOOL_SKILL and a tier-3 gem are Stave-specific. Unlike the five starting tools it
// is not granted at freshState — Elias gives the Basic Stave in the door scene (state.flags.staveEarned),
// and only then does it show in the bag and Tom's upgrade wall.

// ======================================================================
//  ★ v6.4 SMITHING — the forge (the seventh craft)
// ======================================================================
//  THE HARD PROBLEM, AND THE ANSWER.
//
//  Every tool tier in this game is gated on the tool's OWN craft (TOOL_SKILL + TIER_LEVEL): a Star
//  Metal Pick needs Mining 85, a Star Metal Rod needs Fishing 85. The obvious design for a smithing
//  skill — "the smith makes the tools" — would move all six of those gates onto Smithing, and then
//  **six skills would be waiting on a seventh**. A player at Fishing 85 who had not touched the forge
//  would be told their fishing is not the problem. That is the single worst thing a new craft could
//  do to this game, and it is the reason a smithing skill was never added before.
//
//  So Smithing NEVER gates a tool. It gives you a second way to pay for one.
//  `forgeHeadFor(tool, tier)` lets a smith of the right level forge the head themselves, for
//  FORGE_HEAD_DISCOUNT of the gold and the same materials plus bars. The level requirement on the
//  tool is untouched; what changes is the price. Purely additive, never blocking — which is the cozy
//  contract ("nothing is ever taken from the player") applied to a production skill.
//
//  THE LADDER. Graded by auditUnlockCadence(): 36 marks, largest empty band 5 levels, 0.0% dead XP,
//  five marks above L85. It is deliberately the densest ladder in the game, because V6_WORLD_AND_CRAFTS
//  §4 makes Smithing the template the other three crafts must copy — and the measured failure mode of
//  every ladder in this game is a long silent stretch in the top third.
//
//  Three kinds of thing fill it:
//    · BARS   — smelt an ore. Six, tracking the ore ladder one step behind it (you can smelt a metal
//               slightly before a Mining ladder that gates it, so the forge is never the bottleneck).
//    · GOODS  — twenty forged items, every one of which is an INPUT to something the game already
//               wants: nails and hinges for the projects, lantern frames for the Lantern Round writ,
//               brazier and bell for the Guild's wings, a plough blade for the fields.
//    · TIERS  — the Hammer, the seventh tool, on the standard TIER_LEVEL rungs.
const FORGE_HEAD_DISCOUNT = 0.45;   // you pay 45% of the shop's gold if you forge the head yourself
const FORGE = [
  // ---- bars: the spine. `smelt` marks it as an ore conversion for the panel's own heading. ----
  { name:"Copper Bar",      lvl:5,  smelt:true, ing:{"Copper Ore":2},                       sell:75,   xp:26,  col:"#c77b3f" },
  { name:"Iron Bar",        lvl:15, smelt:true, ing:{"Iron Ore":2},                         sell:165,  xp:62,  col:"#bfa8a0" },
  { name:"Gold Bar",        lvl:28, smelt:true, ing:{"Gold Ore":2},                         sell:395,  xp:150, col:"#ffd75a" },
  { name:"Cobalt Bar",      lvl:42, smelt:true, ing:{"Cobalt Ore":2},                       sell:720,  xp:290, col:"#4f7ac9" },
  { name:"Deepsilver Bar",  lvl:62, smelt:true, ing:{"Deepsilver Ore":2},                   sell:890,  xp:430, col:"#b8c4d0" },
  { name:"Star Metal Bar",  lvl:80, smelt:true, ing:{"Star Metal Shard":2},                 sell:1080, xp:620, col:"#c8b4ff" },
  // ---- goods: every one of these is an input to something, not a trophy ----
  { name:"Nails",           lvl:1,  ing:{"Copper Ore":1},                                   sell:40,   xp:14,  col:"#9a8a78" },
  { name:"Hook",            lvl:3,  ing:{"Copper Ore":1, "Wood":2},                         sell:55,   xp:20,  col:"#a8917a" },
  { name:"Hinge",           lvl:8,  ing:{"Copper Bar":1},                                   sell:130,  xp:38,  col:"#b08a5a" },
  { name:"Horseshoe",       lvl:12, ing:{"Copper Bar":1, "Nails":2},                        sell:210,  xp:52,  col:"#9a9a9a" },
  { name:"Chain",           lvl:18, ing:{"Iron Bar":1},                                     sell:300,  xp:80,  col:"#8f9aa6" },
  { name:"Trivet",          lvl:22, ing:{"Iron Bar":1, "Nails":2},                          sell:380,  xp:98,  col:"#7e8894" },
  { name:"Fire-Iron",       lvl:26, ing:{"Iron Bar":2},                                     sell:520,  xp:126, col:"#6e7883" },
  { name:"Lantern Frame",   lvl:33, ing:{"Iron Bar":1, "Gold Bar":1, "Hinge":1},            sell:900,  xp:190, col:"#ffce5a" },
  { name:"Brazier",         lvl:36, ing:{"Iron Bar":3, "Chain":1},                          sell:1050, xp:215, col:"#c98a4a" },
  { name:"Plough Blade",    lvl:39, ing:{"Iron Bar":2, "Gold Bar":1},                       sell:1180, xp:245, col:"#a8b0bc" },
  { name:"Gate Hinge",      lvl:47, ing:{"Cobalt Bar":1, "Hinge":2},                        sell:1500, xp:330, col:"#5f86c9" },
  { name:"Forge Tongs",     lvl:52, ing:{"Cobalt Bar":2, "Chain":1},                        sell:1750, xp:385, col:"#4f6a8a" },
  { name:"Cauldron",        lvl:56, ing:{"Cobalt Bar":3, "Trivet":1},                       sell:2050, xp:440, col:"#3f4a5a" },
  { name:"Weathervane",     lvl:59, ing:{"Cobalt Bar":2, "Gold Bar":2},                     sell:2300, xp:490, col:"#d8b45a" },
  { name:"Founder's Bell",  lvl:65, ing:{"Deepsilver Bar":2, "Gold Bar":2, "Chain":1},      sell:3000, xp:600, col:"#c8b478" },
  { name:"Fine Lantern",    lvl:68, ing:{"Deepsilver Bar":2, "Lantern Frame":1},            sell:3350, xp:660, col:"#ffe6a0" },
  { name:"Warden's Fitting",lvl:73, ing:{"Deepsilver Bar":3, "Gloam Thread":6},             sell:3900, xp:760, col:"#9fc4e8" },
  { name:"Anvil-Steel",     lvl:78, ing:{"Deepsilver Bar":4, "Cobalt Bar":2},               sell:4400, xp:880, col:"#7e8894" },
  { name:"Star Fitting",    lvl:88, ing:{"Star Metal Bar":2, "Warden's Fitting":1},         sell:6200, xp:1180,col:"#c8b4ff" },
  { name:"Sun-Bell",        lvl:90, ing:{"Star Metal Bar":2, "Founder's Bell":1},           sell:6900, xp:1290,col:"#ffe27a" },
  { name:"The Long Chain",  lvl:94, ing:{"Star Metal Bar":3, "Chain":4},                    sell:8200, xp:1520,col:"#b8c4d0" },
  { name:"Starward Anvil",  lvl:97, ing:{"Star Metal Bar":4, "Anvil-Steel":2},              sell:9800, xp:1800,col:"#d8c8ff" },
];
const FORGE_BY_NAME = (() => { const m = {}; for(const r of FORGE) m[r.name] = r; return m; })();
// The forge's outputs sell at the price FORGE already states — derived, never re-typed, because a
// second hand-written price table is a second thing that can drift (GBP §9's recorded failure).
// ★ Written first as `const ITEM_SELL = { ...FORGE_SELL, … }` at ITEM_SELL's own definition, which is
// 400 lines ABOVE this one: a straight TDZ crash on boot, since `const` does not hoist its value.
// This is the second time that exact shape has bitten in this version line (v5.0's LADDER_AUDIT).
// The rule for this file: a table may only READ a table defined above it — otherwise mutate after.
Object.assign(ITEM_SELL, (() => { const m = {}; for(const r of FORGE) m[r.name] = r.sell; return m; })());

const TOOLS = ["Hoe", "Can", "Axe", "Pick", "Rod", "Stave", "Hammer"];   // v6.4: the Hammer, Smithing's own tool
const TOOL_ICON = { Hoe:"hoe", Can:"can", Axe:"axe", Pick:"pick", Rod:"rod", Stave:"stave", Hammer:"hammer" };
// The Star Metal tier (v3.12) is the 4th and final rung. It exists to close the reward-is-an-input
// rule (§3.5): before it, everything The Long Climb (v3.10) added below the surface — Cobalt Ore,
// Star Metal Shard, Silverwood, Heartwood — was sell-only, a pure faucet. This tier CONSUMES all
// four, so the deepest veins and the rarest timber finally forge something. It's a transformative
// unlock (§4.2), not another same-verb bump: a jump in power that only a master miner + woodcutter
// can even gather the materials for.
// v3.37 (owner call): the ladder gains two rungs between Gold and Star Metal — Cobalt and
// Deepsilver. The old jump was a cliff: silverwood beams and a Starstone one step after Gold
// ("kinda unreasonable to need silverwood for the upgrade right after gold tools"). Existing
// Star tools were remapped at the insertion, never downgraded (migrateSave, flags.ladder6).
// v3.38 (owner call, next day): rocks, trees, and tools all sit on ONE ladder now —
// 1/10/20/30/45/70/85 — so every tier's ore AND wood are gatherable exactly at that tier's own
// level in their own skills. (v3.37 fixed the ore side; the tree side was still backwards — a
// WC-60 Star axe needing WC-85 silverwood. No longer, in either direction.)
const TOOL_TIERS = ["Basic", "Copper", "Iron", "Gold", "Cobalt", "Deepsilver", "Star Metal"];
const TIER_POWER = [1, 2, 3, 5, 7, 9, 11];   // old Star owners land on 11 — a small buff; cozy contract says never a nerf
const MAX_TIER = TOOL_TIERS.length - 1;   // = 6; used everywhere instead of a hardcoded number
// v3.17 — a tool upgrade now needs SKILL, not just materials + coin. Gathering a pile of ore never
// makes sense as the sole gate for an OP tool; you must have earned the level in that tool's own
// craft. Clean & memorable, matching the unified gathering ladder: Copper 10, Iron 20, Gold 30,
// Cobalt 45, Deepsilver 70, Star Metal 85 (v3.38).
const TOOL_SKILL = { Hoe:"Farming", Can:"Farming", Axe:"Woodcutting", Pick:"Mining", Rod:"Fishing", Stave:"Warding", Hammer:"Smithing" };
const TIER_LEVEL = [1, 10, 20, 30, 45, 70, 85];   // v3.38: the unified ladder — each tier's level IS its ore's and its wood's level, in every skill
// v4.20: what each tier actually BUYS you, indexed by tier. Lifted out of renderShop (where they were
// local consts) so the shop and the Skill Guide read ONE source — the guide had no way to see them, which
// is why the game's most-felt Farming upgrade (the 5-tile reach at 20) was invisible on the ladder.
const TOOL_PERK = {
  Can: ["", "waters a 3-tile row", "waters a 5-tile row", "waters 3×3", "waters 3×3, next to no energy", "waters 3×3, harder steel", "waters 3×3, the star's own temper"],
  Hoe: ["", "tills a 3-tile row", "tills a 5-tile row", "tills 3×3", "tills 3×3, next to no energy", "tills 3×3, harder steel", "tills 3×3, the star's own temper"],
  Rod: ["", "faster bites, steadier reel", "faster bites, steadier reel", "faster bites, steadier reel", "faster bites, steadier reel", "faster bites, steadier reel", "faster bites, steadier reel"],
};
const toolPerk = (tool, tier) => (TOOL_PERK[tool] && TOOL_PERK[tool][tier]) || "stronger, less energy";
// Tool tiers cost wood + ore + gold — and the top tiers a signature gem / the deep materials — so
// every upgrade needs Mining AND Woodcutting progress (and the Rod's Pearl, the beach). A gold tool
// is an achievement across skills, not a purchase. (Owner playtest 2026-07-12: "right now it's
// mining and gold and then you unlock everything else" — gold alone must never be the universal key.)
const TIER_COST  = [null,
  { g:300,   mats:{ "Copper Ore":5, "Wood":50 } },        // v3.20: wood reqs ×5 (wood is a construction material now, not a rounding error)
  { g:1200,  mats:{ "Iron Ore":5,  "Pine Wood":50 } },
  { g:5000,  mats:{ "Gold Ore":5,  "Maple Wood":50 } },
  { g:7500,  mats:{ "Cobalt Ore":6, "Willow Wood":60 } },                 // v3.37: the first new rung — mid woods, no premium timber yet
  { g:10000, mats:{ "Deepsilver Ore":6, "Elder Wood":50 } },              // v3.37: the deep grove's dark boards carry the second rung
  { g:12000, mats:{ "Star Metal Shard":4, "Cobalt Ore":8, "Silverwood":40, "Heartwood":20, "Starstone":1 } }];   // v3.18: the star gem crowns the ultimate tool; unchanged in v3.37 — at L60 with two rungs before it, its cost finally matches its place
const TIER3_GEM  = { Hoe:"Opal", Can:"Topaz", Axe:"Emerald", Pick:"Ruby", Rod:"Pearl", Stave:"Sapphire" };   // Hoe was Amethyst (now Gary-only); the Stave takes a Sapphire — cool ward-light set into the head (v4.0)
function toolCost(tool, tier){
  const base = TIER_COST[tier]; if(!base) return null;
  const mats = Object.assign({}, base.mats);
  if(tier === 3 && TIER3_GEM[tool]) mats[TIER3_GEM[tool]] = 1;   // the keepsake set into the handle
  return { g: base.g, mats };
}
const TIER_COL   = ["#b7a48c", "#c77b3f", "#d8c4bc", "#ffd75a", "#5a7ad0", "#9ab0c8", "#c8a8ff"];   // v3.37: + cobalt, deepsilver; v3.42: star follows its ore to violet (ice-blue sat one hue off deepsilver)

// ---- THE OLD LIFT ----
// A rusted lift shaft stands by the entry ladder of every mine floor. Riding UP is always free —
// the counterweight still works; it's the STOPS that rusted. Every 5th floor's stop can be restored
// once, permanently (state.liftStops), with a resource dump made while standing at it. The costs
// deliberately sink wood + ore + gold together — the multi-skill economy in miniature — and the
// deepest stops want a gem, giving gems a life beyond Tom's counter.
function liftStopCost(n){
  // v3.20: rebuilding the old lift is construction — its timber wants ×5 (paid in deposits via the Pledge Ledger)
  if(n === 5)  return { g:500,  mats:{ "Wood":100, "Copper Ore":5 } };
  if(n === 10) return { g:1500, mats:{ "Pine Wood":75, "Iron Ore":5 } };
  if(n === 15) return { g:3000, mats:{ "Maple Wood":50, "Gold Ore":5 } };
  // the deep stops want the deep grove's timber — Elderwood replacing a second helping of maple
  // (Grove Depths Phase 2: the two deep venues feed each other)
  if(n === 20) return { g:6000, mats:{ "Elder Wood":60, "Gold Ore":10, "Diamond":1 } };
  // v3.39 (owner call: "the restorations get so insane… too expensive, coins-wise especially"):
  // past 20 the gold used to DOUBLE every 5 floors — 384,000g at floor 50, 3M at 65 — a prestige
  // tail written before the deep floors mattered. v3.38 made floors 50-65 the core destination
  // (deepsilver, star metal), so the exponential had become a wall across the main road. Now the
  // gold climbs LINEARLY (+3,000 per stop: 9k at 25 … 33k at 65 — each a few good days, the whole
  // shaft a long-arc project), and the deepest stops (45+) sink the deep tier's own neighbours
  // (heartwood + cobalt) instead of a fourth helping of elder and gold ore. Still one Diamond —
  // gems keep their life beyond Tom's counter.
  const g = 6000 + ((n - 20) / 5) * 3000;
  if(n >= 45) return { g, mats:{ "Heartwood":25, "Cobalt Ore":10, "Diamond":1 } };
  return { g, mats:{ "Elder Wood":60, "Gold Ore":10, "Diamond":1 } };
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

// ---- WARDEN'S BELLS (v4.0) — the Undercroft's checkpoints, on the same Pledge Ledger ----
// Every 5th floor holds a silent Warden's Bell; funding it is a permanent checkpoint you can ring
// back down to (renderBells clones renderLift). Like the lift/waystones, the sink is CROSS-skill —
// gold + the settle drops (Knotwood/thread/grit) + timber/ore — so warding never self-funds its own
// checkpoints (GBP §2.2/§2.4). Scaled to the lift's 500/1500/3000 so the two deep venues rhyme.
function bellCost(n){
  if(n === 5)  return { g:600,  mats:{ "Knotwood":10, "Wood":40 } };
  if(n === 10) return { g:1500, mats:{ "Knotwood":20, "Gloam Thread":15, "Pine Wood":40 } };
  if(n === 15) return { g:3000, mats:{ "Knotwood":30, "Ember Grit":10, "Iron Ore":8 } };
  // v4.1 deep bells — the deeper floors sink the deeper warding drops + the deep ore/timber ladder,
  // scaled up from the lift's tail. bell30 wants a Heartknot (a Great Knot's core) — a deep ask for the deepest ring.
  if(n === 20) return { g:5000, mats:{ "Warden's Ash":12, "Gold Ore":6, "Elder Wood":30 } };
  if(n === 25) return { g:7000, mats:{ "Snarlthread":12, "Cobalt Ore":6, "Heartwood":20 } };
  if(n === 30) return { g:9000, mats:{ "Snarlthread":18, "Heartknot":1, "Deepsilver Ore":5 } };
  // v4.2 the deepest bells sink the deep drops + the deepest ore/timber — the wing's long-arc project.
  if(n === 35) return { g:11000, mats:{ "Deepgnarl":10, "Heartwood":25, "Deepsilver Ore":6 } };
  if(n === 40) return { g:13000, mats:{ "Deepgnarl":16, "Heartknot":1, "Silverwood":20 } };
  if(n === 45) return { g:15000, mats:{ "Gloamstar":8, "Star Metal Shard":3, "Heartknot":1 } };
  return null;
}

// ---- THE PLEDGE LEDGER ----
// The owner's no-wasted-trips rule (DEVLOG 2026-07-13): reaching a restorable thing banks its
// DISCOVERY permanently and for free; the cost is a PLEDGE you fill later, from anywhere, in
// partial deposits, and the ledger — not the player — remembers the remainder. A pledge id is
// "way3"/"way6"/"way9" (waystones) or "lift5"/"lift10"/… (Old Lift stops, retrofitted onto the
// same system). state.pledges[id] = { gPaid, mats:{item:nPaid} }; the record is created on
// discovery/first deposit and deleted on completion — done-ness lives in state.waystones /
// state.liftStops, so all pre-ledger code keeps working unchanged.
// v4.26 "The Patron" — the valley's standing commissions, the game's first UNCAPPED repeatable gold sink.
// Everything gold could buy was one-time and finite (~426k of gold-only content), while the fishing loop
// clears ~64,000 g/day at Fishing 85 — so coin stopped meaning anything around day 45-60, with ~200 days
// of intended play left. Rowan keeps a list of things the valley could use; it never runs out.
//
// A FOURTH PREFIX on the pledge system, deliberately NOT a PROJECTS entry: fundProject is atomic (no
// partial deposits), its done-ness is a permanent boolean, PROJECT_BY_ID is built once at load so a
// runtime-appended entry would be dead on click, and an endless PROJECTS tier would permanently delete
// the "every page of the ledger is struck through" completion beat. As a pledge it inherits partial
// deposits, the Journal's Restorations UI and the no-wasted-trip rule for free.
//
// COST CURVE — linear-plus-mild-quadratic, the shape the owner already signed off on for the lift
// (DEVLOG: "the restorations get so insane… it's just too expensive, coins-wise", and the fix was to go
// linear). n=1: 30,000 · n=5: 84,400 · n=10: 170,400 · n=20: 402,400. Every rung stays a few days of
// income even deep in the series; an exponential would re-create the exact complaint that was fixed.
function patronCost(n){
  return { g: 30000 + 12000*(n-1) + 400*(n-1)*(n-1), mats: PATRON_MATS[(n-1) % PATRON_MATS.length] };
}
// FLAT material ask, rotating — never escalating. An escalating ask would make the MATERIAL the binding
// constraint instead of the gold, which is precisely the defect that makes the tool ladder useless as a
// coin sink. Each of these is roughly one expedition's worth.
const PATRON_MATS = [
  { "Elder Wood":20 }, { "Heartwood Beam":12 }, { "Silverwood Beam":8 },
  { "Deepgnarl":10 },  { "Gloamstar":6 },       { "Starstone":2 },
  // v5.2: two rotations that ask the FARM and the KITCHEN. Every entry above comes out of the woods
  // or the deep, so the valley's endless commission — the one sink a long save actually lives on —
  // never once wanted a crop or a dish. A civic work is built by people who have to be fed; the
  // rotation should say so. (Flat ask, like every other rung: escalating a material makes the
  // MATERIAL the binding constraint instead of the gold, which is the defect this table avoids.)
  { "Fine Cheese":6, "Wheat":40 },
  { "Apple Crumble":4, "Honey":12 },
];
// The first ten are named civic fixtures that visibly warm the village; past that Rowan keeps finding
// more to do. Authoring stops at ten and the tail generates, which bounds the writing without bounding
// the sink.
// Each named work maps to a real fixture stamped into the village at generation time (13-content.js).
// All reuse EXISTING sprites — the art is procedural and a commission tier shouldn't need new pixels.
const PATRON_WORKS = [
  "the plaza lanterns", "the market planters", "the square's stone benches", "the guild-steps rail",
  "the south lane's lamps", "the old well's winch", "the plaza cook-fire", "the lane hedges",
  "the smith's second anvil", "the market's long stall",
];
function patronName(n){ return PATRON_WORKS[n-1] || ("the valley's " + ordinalRing(n) + " commission"); }

// v5.7 the house-expansion pledges. The expression gold sink the economy lens found missing: décor
// tops out at the 300,000g statue and then coin has only the Patron (whose *desire* runs out at tier
// ten), so a rich save had nothing left it actually WANTED. A bigger house is want-shaped — it isn't
// a number going up, it is more room for the things you chose.
//
// On the Pledge Ledger like everything Rowan builds (partial deposits, the Journal page, the
// no-wasted-trip rule). Two rungs only: authoring stops where the room does.
const HOME_ROOMS = [
  { g:24000, mats:{ "Oak Lumber":30, "Maple Lumber":18, "Stone":40 },
    name:"the cottage's second room", done:"Rowan knocks through the east wall and the cottage is suddenly a house." },
  { g:60000, mats:{ "Silverwood Beam":4, "Heartwood Beam":8, "Deepsilver Ore":10, "Stone":80 },
    name:"the long room", done:"The gable goes up, the light comes in, and the room is longer than the whole cottage used to be." },
];
function homeRoomCost(n){ const r = HOME_ROOMS[n-1]; return r ? { g:r.g, mats:r.mats } : null; }
function pledgeCost(id){
  if(id.startsWith("way"))  return waystoneCost(id);
  if(id.startsWith("lift")) return liftStopCost(parseInt(id.slice(4), 10));
  if(id.startsWith("bell")) return bellCost(parseInt(id.slice(4), 10));   // v4.0 Warden's Bells
  if(id.startsWith("patron")) return patronCost(parseInt(id.slice(6), 10));   // v4.26 the standing commissions
  // v5.1 the mastery trials — the SIXTH prefix, and the reason the trial ask cost nothing to build:
  // partial deposits, the Journal page, and the no-wasted-trip rule all come free with the ledger.
  // Colon-delimited because a trial id carries two fields (skill and gate), not one number.
  if(id.startsWith("trial:")){
    const t = trialParse(id), d = trialDef(t.skill, t.gate);
    return d ? { g: d.g || 0, mats: d.mats } : null;
  }
  if(id.startsWith("room")) return homeRoomCost(parseInt(id.slice(4), 10));   // v5.7
  return null;
}
function pledgeName(id){
  if(id.startsWith("trial:")){ const t = trialParse(id), d = trialDef(t.skill, t.gate);
    return d ? `${d.title} — ${t.skill} ${t.gate}` : id; }   // v5.1
  if(id.startsWith("room")){ const r = HOME_ROOMS[parseInt(id.slice(4),10)-1]; return r ? r.name : id; }   // v5.7
  if(id === "way3") return "the Third-Ring Waystone";
  if(id === "way6") return "the Sixth-Ring Waystone";
  if(id === "way9") return "the Heart Waystone";
  if(id.startsWith("lift")) return "the floor-" + id.slice(4) + " lift stop";
  if(id.startsWith("bell")) return "the floor-" + id.slice(4) + " Warden's Bell";   // v4.0
  if(id.startsWith("patron")) return patronName(parseInt(id.slice(6), 10));         // v4.26
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
  if(id.startsWith("bell")) return (state.wardBells||[]).includes(parseInt(id.slice(4), 10));   // v4.0
  if(id.startsWith("patron")) return (state.patronTier||0) >= parseInt(id.slice(6), 10);        // v4.26
  if(id.startsWith("trial:")){ const t = trialParse(id); return trialPassed(t.skill, t.gate); }  // v5.1
  if(id.startsWith("room")) return ((state.home && state.home.rooms) || 0) >= parseInt(id.slice(4), 10);   // v5.7
  return false;
}
function pledgeDiscovered(id){
  if(pledgeDone(id)) return true;
  if(id.startsWith("way"))  return !!(state.pledges && state.pledges[id]);   // touched the stone once
  if(id.startsWith("lift")) return (state.mineBest||0) >= parseInt(id.slice(4), 10);  // reached the floor once
  if(id.startsWith("bell")) return (state.wardBest||0) >= parseInt(id.slice(4), 10);  // reached the Undercroft floor once
  // v4.26: only the NEXT commission is ever visible — DERIVED from patronTier, so there is nothing to
  // migrate and the ledger never renders an infinite list.
  if(id.startsWith("patron")) return (state.patronTier||0) >= parseInt(id.slice(6), 10) - 1;
  // v5.1: a trial is only ever visible once you have actually REACHED its gate. A trial you cannot
  // start is a chore posted early, and the Journal is not a list of things you are not allowed to do.
  if(id.startsWith("trial:")){ const t = trialParse(id); return trialOpen(t.skill, t.gate); }
  // v5.7: only the NEXT room is ever offered, and only once the Guild is properly awake — the same
  // derive-don't-store shape the Patron uses, so there is nothing to migrate.
  if(id.startsWith("room")){ const n = parseInt(id.slice(4), 10);
    return (state.wingsLit||0) >= 3 && ((state.home && state.home.rooms) || 0) >= n - 1; }
  return false;
}
// Everything the Journal's Restorations section should list, in display order.
// Lift stops are discovered by DERIVATION — mineBest ≥ n means you stood on that floor once —
// so old saves backfill retroactively with zero migration. Listing stops at mineBest keeps the
// doubling series past floor 20 from rendering to infinity.
// WARD_FLOOR_MAX lives in 13-content.js, which loads AFTER this file — so read it lazily rather than
// at load time (the const-TDZ trap this repo has already shipped once, v5.1).
function WARD_FLOOR_MAX_SAFE(){ return (typeof WARD_FLOOR_MAX !== "undefined") ? WARD_FLOOR_MAX : 45; }
function ledgerPledges(){
  const out = [];
  for(const id of ["way3","way6","way9"]) if(pledgeDiscovered(id)) out.push(id);
  for(let n = 5; n <= (state.mineBest||0); n += 5) out.push("lift"+n);
  // ★ v6.1.4: reads the CAP, not a literal 45 — the two disagreed the moment anything moved the cap,
  // and v6.2 adds floors past it that must never grow bell pledges.
  for(let n = 5; n <= Math.min(WARD_FLOOR_MAX_SAFE(), state.wardBest||0); n += 5) out.push("bell"+n);
  // v4.26: the standing commissions — only ever ONE open at a time, so the ledger stays a list of real
  // work rather than an infinite scroll. Rowan starts keeping the list once the Guild is properly awake.
  if((state.wingsLit||0) >= 3 || (state.patronTier||0) > 0) out.push("patron" + ((state.patronTier||0) + 1));
  { const next = ((state.home && state.home.rooms) || 0) + 1;   // v5.7 the house, one room at a time
    if(next <= HOME_ROOMS.length && pledgeDiscovered("room"+next)) out.push("room"+next); }
  // v5.1 the mastery trials — listed FIRST when open, because a trial is the only pledge in the
  // ledger that is currently holding something back, and the ledger should say so at the top.
  const trials = [];
  for(const skill in TRIALS){ const g = trialCurrent(skill); if(g) trials.push(trialId(skill, g)); }
  return trials.concat(out);
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
  "Heron Feather Charm": { sell:130, effect:"+5% Fishing XP while worn" },   // v4.7 — the Fishing skill-charm (Wren/Amber pattern), nest-found
  "Hearth Charm":        { sell:130, effect:"+5% Cooking XP while worn" },    // v4.7 — the Cooking skill-charm; closes the charm-per-skill gap (was 4 of 6)
  "Lantern Charm":       { sell:100, effect:"your light reaches a little farther" },
  "The Forester's Band": { sell:0,   effect:"+8% Woodcutting XP and an extra log, now and then" },  // once per valley
  "Grandpa's Pocketwatch": { sell:0, effect:"+5% Farming XP while worn" },   // dug up where his last letter said (v3.32) — once per valley, never in a nest
  // v4.0 — the first CRAFTED charms (forged at a Warden's Bell from settling drops, not nest-found).
  // They extend the v3.3 one-charm system rather than adding armour: Warded lifts your Resolve cap,
  // Emberlight widens your lantern for the dark. Modest sells; the point is wearing them.
  // `crafted:true` is load-bearing, not documentation: the canopy-nest pools (08-actions.js) exclude
  // every crafted charm by this flag. Until v4.15 they only excluded the Band and the Pocketwatch by
  // name, so a nest could hand you the Starward — a Gloamstar + Heartknot + Diamond — for free,
  // contradicting the "not nest-found" note above. Flagging beats name-listing: the next crafted
  // charm is covered the day it is added, instead of silently leaking until someone notices.
  "Warded Charm":     { sell:150, crafted:true, effect:"+5 maximum Resolve while worn" },
  "Emberlight Charm": { sell:150, crafted:true, effect:"your lantern reaches much farther" },
  // v4.1 deep-warding charms — the top Resolve charm (from the Great Knot's Heartknot) and a Warding-XP band.
  "Wardstone Charm":  { sell:300, crafted:true, effect:"+10 maximum Resolve while worn" },
  "Settler's Band":   { sell:200, crafted:true, effect:"+5% Warding XP while worn" },
  // v4.2 the capstone Resolve charm — forged around a Star-Gnarl's Gloamstar.
  "Starward Charm":   { sell:500, crafted:true, effect:"+15 maximum Resolve while worn" },
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
// qp: Quest Points (v3.32) — the RuneScape ledger. Weighted by heft (finale 4, capstones 2-3,
// errands 1); questPoints() in 09-quests.js derives the total from questIdx, so no save field.
const QUESTS = [
  { id:"first-sprout", qp:1, title:"First Sprout", giver:"Grandpa's Letter",
    desc:"“Tend it, and it'll tend to you.” Wake the soil in the plot below your cottage.",
    obj:[ {text:"Till a patch of soil", stat:"tilled", goal:1},
          {text:"Plant a seed", stat:"planted", goal:1},
          {text:"Water your crop", stat:"watered", goal:1} ],
    reward:{ gold:60, items:{"Turnip Seeds":4}, msg:"Grandpa tucked seeds into the envelope." } },

  { id:"good-harvest", qp:1, title:"A Good Harvest", giver:"Grandpa's Letter",
    desc:"Patience, sun, and water. Bring in your very first crops.",
    obj:[ {text:"Harvest 3 crops", stat:"harvested", goal:3} ],
    reward:{ gold:120, items:{"Carrot Seeds":3}, msg:"Word spreads; Tom sends carrot seeds." } },

  { id:"meet-tom", qp:1, title:"Coin & Company", giver:"Tom",
    desc:"A valley is its people. Step inside Tom's store, east down the road, and let him talk your ear off.",
    obj:[ {text:"Visit Tom's store & say hello", talk:"tom"},
          {text:"Sell him the valley's good things — 250g earned", stat:"earned", goal:250} ],
    reward:{ gold:100, items:{"Berry Bun":3}, msg:"“First proper trade this counter's seen in months.” Tom rounds up, with a wink." } },

  { id:"old-keeper", qp:1, title:"The Old Keeper", giver:"Willowbrook",
    desc:"An old man keeps the shuttered Guild Hall in the north of town. Go and hear him out.",
    obj:[ {text:"Speak with Elder Rowan at the Guild Hall", talk:"rowan"} ],
    reward:{ gold:80, items:{"Guild Seal":1}, msg:"Rowan presses a worn Guild Seal into your hand." } },

  { id:"neighborly", qp:1, title:"Neighborly", giver:"Maya",
    desc:"Maya walks the south meadow by day. A valley grows warmer with friends.",
    obj:[ {text:"Reach 2 hearts with Maya", heart:2} ],
    reward:{ gold:120, items:{"Strawberry Seeds":3}, msg:"Strawberries — her favorite, if you were wondering." } },

  { id:"prove-crafts", qp:2, title:"Prove the Crafts", giver:"Elder Rowan",
    desc:"“Anyone can hold a seal. Show me the crafts still live in someone's hands — the field, the axe, the pick. Then we'll talk about wings.”",
    obj:[ {text:"Show him a farmer's hands — Farming 10", level:{skill:"Farming",n:10}},
          {text:"Show him a forester's swing — Woodcutting 8", level:{skill:"Woodcutting",n:8}},
          {text:"Show him a miner's eye — Mining 8", level:{skill:"Mining",n:8}} ],
    reward:{ gold:250, items:{"Iron Ore":4}, msg:"Rowan stands at the wall a long moment. Three wings, flickering. “Well,” he says. “Well.”" } },

  { id:"the-coast", qp:1, title:"Salt & Silver", giver:"Bram",
    desc:"Follow the village's south path to the coast. An old fisher tends the Fishing wing — mostly by ignoring it, and everyone else.",
    obj:[ {text:"Meet Bram at the coast", talk:"bram"},
          {text:"Fish beside him until he nods — Fishing 10", level:{skill:"Fishing",n:10}} ],
    reward:{ gold:300, items:{"Cooked Salmon":2}, msg:"Bram grunts. From him, that's a medal." } },

  { id:"into-deep", qp:2, title:"Into the Deep", giver:"Elder Rowan",
    desc:"“The mine remembers the Guild's founding — it's all still down there, past the easy seams. Go deep enough that the mountain learns your name.”",
    obj:[ {text:"Go down past the easy seams — mine floor 5", mineDepth:5},
          {text:"Swing until the mountain knows you — 25 rocks mined", stat:"mined", goal:25} ],
    reward:{ gold:300, items:{"Gold Ore":3}, msg:"“Deep enough,” Rowan says, and for a moment he looks young. “Now I can tell you what's down there.”" } },

  { id:"star-metal", qp:2, title:"The Founding Gift", giver:"Elder Rowan",
    desc:"Deep in the mine a sealed vault holds Star Metal — the Guild's heart. Break it open (Mining 20) and recover it.",
    obj:[ {text:"Recover the Star Metal from the vault", flag:"foundVault"} ],
    reward:{ gold:400, items:{"Emerald":1}, msg:"The Mining wing blazes to life." } },

  { id:"master-tools", qp:2, title:"Master Smith", giver:"Tom",
    desc:"“Your grandpa's kit got him by, bless him — but the Guild deserves better iron. Bring me the makings and we'll build you something worthy.”",
    obj:[ {text:"Let Tom improve your kit — 3 tool upgrades", stat:"toolUpgrades", goal:3} ],
    reward:{ gold:250, items:{"Gold Ore":3}, msg:"Tom turns the tool over twice and whistles. “Now THAT would've made your grandpa jealous.”" } },

  { id:"wake-valley", qp:4, title:"Wake the Valley", giver:"The Valley",
    desc:"They said Willowbrook was finished. Light every wing and bring the Grand Festival back to the coast.",
    obj:[ {text:"Let every craft live in you — total level 60", totalLevel:60},
          {text:"Let Maya believe it's real — 4 hearts", heart:4},
          {text:"Recover the Star Metal", flag:"foundVault"} ],
    reward:{ gold:2000, msg:"Lanterns rise over the water. The valley is awake — and it's yours." },
    finale:true },

  // ---------- ACT TWO: the empty chair ----------
  { id:"long-way-home", qp:2, title:"The Long Way Home", giver:"Elder Rowan",
    desc:"The lanterns are lit and the valley is whole — save for one empty chair. Rowan would like a word.",
    obj:[ {text:"Light the lanterns at the Grand Festival", flag:"festivalDone"},
          {text:"Learn what Bram has been carrying", flag:"knowsElias"} ],
    reward:{ gold:200, msg:"Rowan asks you to do a hard, kind thing." },
    act2:true },

  { id:"driftwood", qp:1, title:"Driftwood & Waxed Paper", giver:"Bram",
    desc:"“If the festival ever comes back… I'll make them again.” Bring Bram the wood for his water lanterns.",
    obj:[ {text:"Bring 12 Wood", item:"Wood", n:12},
          {text:"Bring 3 Pine Wood", item:"Pine Wood", n:3} ],
    reward:{ gold:250, msg:"Bram's hands remember the folds." },
    act2:true },

  { id:"coast-road", qp:3, title:"The Coast Road", giver:"Maya",
    desc:"Forty miles north, a ferryman has spent eleven years counting the days he didn't come home.",
    obj:[ {text:"Reach 5 hearts with Maya", heart:5},
          {text:"Bram folds the water lanterns", flag:"lanternsFolded"} ],
    reward:{ gold:500, msg:"" },
    act2:true },

  // ---- the epilogue (v3.32): the one quest step that isn't a number ----
  // Appended, never inserted — questIdx is a raw index into this array, so any mid-chain insert
  // would corrupt every existing save. The objective flag is brand new, so a finished save can't
  // auto-complete it; the giver isn't in QUEST_GIVER_NPC, so the find IS the turn-in (the sender
  // is gone — that's the point). The dig hook lives at the top of the Hoe branch in 08-actions.js.
  { id:"one-last-letter", qp:2, title:"One Last Letter", giver:"Grandpa's Letter",
    desc:"Tucked behind the seed drawer — one more envelope, older and softer than the rest. “If you're reading this, the farm is yours now, and I'd wager the valley is too. I left you one thing more. Look under the sign that bears our name — a single step below it. Bring your hoe.”",
    obj:[ {text:"Follow Grandpa's last riddle", flag:"keepsakeFound"} ],
    reward:{ msg:"The last envelope goes back in the drawer, lighter now." },
    act2:true },

  // ---- Act III opener (v4.0 "The Tenth Door") ----
  // Appended last, per the questIdx-is-a-raw-index rule (see the epilogue note above). Its objectives
  // are act2Done (guaranteed true by the time the chain reaches here — it reads as "the valley is
  // whole") + total level 100 (the real gate: you've grown deep enough to be trusted with the tenth
  // craft). Turn-in is a cutscene at the Guild where Elias takes the boards down and hands over the
  // Basic Stave; it sets state.flags.tenthDoorOpen, which turns the planked door into the Undercroft
  // mouth. The turnIn.cutscene is attached in 15-warding.js (after this array + NPCDEF exist).
  { id:"tenth-door", qp:3, title:"The Tenth Door", giver:"Elder Rowan", act3:true,
    desc:"The valley is whole again — and Rowan has stopped pretending the planked door in the Guild isn't there. “Nine wings we lit. There was always a tenth. Come see me when you've grown into it — there's a thing I should have told you eleven years ago, and a thing that wants doing.”",
    obj:[ {text:"See the valley made whole (Act II)", flag:"act2Done"},
          {text:"Reach total level 100", totalLevel:100} ],
    reward:{ msg:"The boards come down. Cold air rises from the dark below the Guild." } },
];
const FINALE_IDX = QUESTS.findIndex(q => q.finale);
const ACT3_IDX = QUESTS.findIndex(q => q.act3);   // v4.0 — first Act III quest (The Tenth Door)

// ---- HOW TO PLAY ----
// One source of truth for the reference text, shown on the title screen (showHowto) AND inside
// the in-game Journal (so a playing player can actually consult it — the NPX moved it in-world).
// ---- THE CONTROLS CARD (v4.32) ----
// Every binding in the game, in one grouped table, with a TOUCH column beside the key column.
// This exists because the only control reference the game had was `#belowbar` — two lines of
// run-on text under the stage — and `#belowbar` is `display:none` below 640px wide OR 520px tall.
// A phone player therefore had *no* way, anywhere in the game, to learn that ☰ hides Eat, Gift and
// Ride, or that tapping slot 6 opens the planting board. The reference now renders per-device from
// one table, so a binding can never again exist on one platform's list and not the other's.
// `when:"undercroft"` rows are shown always but marked — they're real controls, just situational.
const CONTROLS = [
  { sec:"Out in the world", rows:[
    { key:"WASD or the arrows", touch:"The D-pad, bottom-left",  what:"Move" },
    { key:"Space",              touch:"USE",                     what:"Use the selected tool on the tile you face — <i>hold it</i> to keep swinging" },
    { key:"E",                  touch:"ACT",                     what:"Harvest, talk, open a door, cook, load a machine, sleep" },
    { key:"Q",                  touch:"🔍",                       what:"Examine whatever you're facing" },
    { key:"F",                  touch:"☰ then 🍎 Eat",           what:"Eat the best food you're carrying" },
    { key:"G",                  touch:"☰ then 🎁 Gift",          what:"Give a gift to whoever you're standing beside" },
    { key:"H",                  touch:"☰ then 🐴 Ride",          what:"Get on or off the horse" },
    { key:"Shift or right-click", touch:"🛡",                     what:"Raise the Warden's Guard — time it to parry a blow", when:"in the Undercroft" },
  ]},
  { sec:"Your belt", rows:[
    { key:"1 – 6",              touch:"Tap a slot",              what:"Pick a tool" },
    // touch:"—" is deliberate and CHECKED, not a gap: the belt has no swipe handler (refreshHotbar
    // gives each slot a plain onclick), and it needs none — all six slots are on screen and tappable,
    // which the row above already documents. Omitting beats printing a gesture that does nothing.
    { key:"Tab or the scroll wheel", touch:"—",                  what:"Move along the belt" },
    { key:"R",                  touch:"Tap the last slot",       what:"Choose what to plant — seeds, saplings, hives, machines, décor" },
  ]},
  { sec:"Books and panels", rows:[
    { key:"I",                  touch:"☰ then 🎒 Backpack",      what:"What you're carrying, and how full your pack is" },
    { key:"J",                  touch:"☰ then ✒ Journal",        what:"Your tasks, the Almanac, and the Collection" },
    { key:"K",                  touch:"☰ then ★ Skills",         what:"Levels, mastery, and every perk still ahead of you" },
    { key:"P",                  touch:"☰ then ⚙ Settings",       what:"Sound, music and the HUD" },
    { key:"U",                  touch:"☰ then ⚙ Settings",       what:"Hide the HUD for a clean look at the valley" },
    { key:"?",                  touch:"☰ then ❔ Controls",       what:"This card" },
    { key:"Esc",                touch:"✕",                       what:"Close whatever's open" },
  ]},
];

const HOWTO_TEXT =
"Move with WASD or the arrow keys.\n\n" +
"Space uses your selected tool on the tile you face:\n" +
"• Hoe tills soil  • Watering Can waters it  • Seeds plant a crop\n" +
"• Axe chops trees  • Pick mines rock  • Rod fishes water\n\n" +
"E interacts — harvest crops, talk to folk, open doors, cook, and step inside your cottage to sleep in your bed and pass the night.\n\n" +
"Fishing: cast with the Rod, wait for the !, then press Space to hook it. Now HOLD Space to raise the green bar and keep the fish inside it — let it slip and the line goes slack. Land one cleanly for a perfect catch.\n\n" +
"Explore! The east road leads to the village — shops, the Guild, and your neighbours. The old mine opens on the village's north ridge, the coast lies down its south path, and the Deep Grove waits through the farm's western trees. Keep hens in the coop and cows in the barn — visit them each morning.\n\n" +
"Read the sky. Tomorrow's weather is chalked on the noticeboard every evening, and each kind of day offers something the others don't — rain doubles your foraging and brings the fish up; a storm shuts the coast but drives the veins, and leaves wrack on the sand the morning after; fog makes the deep seams read rich. Sleep through a day and you miss what it was offering. Nothing is ever lost.\n\n" +
// v4.32: the paragraph that stood here taught Tom's Demand — "sell forty of the same crop and the
// price slides; watch the price before you sell". That mechanic was RETIRED in v4.9 and
// `demandMult()` (01-data.js) has been a hardcoded `return 1` ever since. The How-to was still
// coaching a new player to spread their sales and watch a number that never moves: worse than no
// advice, because it costs real time and teaches distrust of the shop UI. Replaced with what the
// selling loop actually rewards now.
"Sell at Tom's counter — every unit fetches its full price, however many you bring, so there's never a reason to hold back a good harvest.\n\n" +
"But raw is the worst price anything will ever fetch. Cooking is worth about half as much again as the ingredients you put in; the Cellar's kegs more than double a crop, if you can spare three nights. And the noticeboard by Tom's door pays better than the counter for the very thing you were going to sell anyway — and whoever asked will warm to you for it.\n\n" +
"Bram knows five fish that rise only when everything lines up — the right water, the right hour, the right weather, the right season. He'll tell you about one for every heart you earn, and the Almanac remembers.\n\n" +
"Saplings and beehives go in open ground (press R to select one, then Space). A tree takes a season to bear, then bears every day of its season, forever. Bees make more honey where more is in bloom.\n\n" +
"The valley keeps a calendar. Four festivals return every year — be on the coast on the day, and bring something (Bram's Luau wants a fish; the Harvest Fair judges the best crop you've sold that season). Everyone has a birthday, too: a gift on the day is worth three. Check the Almanac in your Journal (J).\n\n" +
"A noticeboard stands by Tom's door. Each morning someone in the valley wants something small — bring it to them for good coin and warmer feelings. It's never required, and it's gone by dawn.\n\n" +
"Your grandfather tore up his old almanac and left the pages where he lived. You'll find them by working the way he worked. Nine in all, and the last one isn't a page about farming.\n\n" +
"Every skill keeps paying past its last unlock: mastery lands at 25, 50, 75 and 99. And when your coin outgrows your needs, read the ledger on Rowan's desk — the valley has unfinished work.\n\n" +
// v4.32: Warding and the pack were BOTH absent from this text. Warding is the sixth 1-99 skill,
// 45 floors of the Undercroft, seven creature families and the whole of Act III's story spine —
// shipped across v4.0-v4.5 and never once mentioned in the game's own how-to. The pack shipped in
// v4.31 and changes how the player relates to every pickup. A How-to that omits two whole systems
// isn't a how-to, it's an archive of an older game.
"There is a tenth door under the Guild, and behind it the Undercroft — the one place in the valley that isn't safe. Warding is a craft like any other, 1 to 99, and the floors go down a long way. Nothing down there can take anything from you: lose your Resolve and you simply wake up at home, everything still yours. Hold Shift as a blow lands to guard it, and time it well to turn the blow back. It's yours to enter, or not.\n\n" +
"Your pack holds so many different things — not so much of each, so carry nine hundred wood if you like. Find something new with no room for it and it goes to the chest in your cottage, and the game tells you so. Nothing is ever lost that way; open the chest to fetch it, or store what you don't need. Tom sells a roomier pack when you've the coin.\n\n" +
"Give your neighbours time and gifts and they'll open up — each has scenes of their own. Two of them might one day accept a Willowbrook bouquet.\n\n" +
"Sell at Tom's stall, buy seeds and upgrade tools. Every action trains a skill from 1 to 99. Follow the tasks in your Journal (J) to wake the valley.\n\n" +
// v4.32: this trailing crib-sheet listed five bindings out of twenty-odd and had no touch column,
// so it was both incomplete and useless on a phone. The full, per-device table now lives in the
// Controls card (CONTROLS above; ? on a keyboard, ☰ then ❔ on touch) — point at that instead of
// maintaining a second, always-drifting copy here.
"Every control in the game is listed on the Controls card — press ? for it, or open ☰ and tap ❔.";

// ---- EXAMINE TEXT (RuneScape-style "look" flavor; generated, then hand-tuned) ----
const EXAMINE = {
  // v3.28 geode curios
  "Amber": "A drop of old sun, hardened. There's a gnat in this one, older than the valley.",
  "Obsidian": "Volcanic glass, black as the deep. It takes an edge you could shave with.",
  "Trilobite": "A little armoured creature, curled in stone since before there were stories.",
  "Quartz Cluster": "A fist of clear crystal points, cold and perfect. It catches the lamplight and keeps it.",
  "Geode Heart": "A plain stone, hollow, its whole inside grown over with crystal. The mine's best-kept secret.",
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
  "Frostfin": "It only rises when the water skins over with ice — blue as the cold morning it's caught in.",
  "Glassperch": "So clear you can see the winter light straight through it. Comes up once a year, and only to the patient.",
  "Deepsilver Ore": "Pale metal from the deep floors — it holds the lamplight a moment longer than it should.",
  "Minnow": "Barely a mouthful, endlessly pleased with itself. Every river starts somewhere.",
  "Chub": "A cheerful, blunt-headed river fish. Takes anything, regrets nothing.",
  "Grayling": "The lady of the stream — a sail of a fin, violet in the right light. The Gullwater's pride.",
  "Rainrunner": "It runs up the river only when the storm is on the sea. Bram always said the rain brings something with it.",
  "Samphire": "Crisp green spears from the tideline, salty as the wind that grew them.",
  "Sea Aster": "A lilac wildflower that only takes to the salt meadow at Butterbrook. Nell swears by it.",
  "Butterbrook Reserve": "Nell's secret — the finest cheese, the richest milk, and a Butterbrook flower. She'd only teach it to a true friend.",
  "Sea Holly": "A steel-blue bloom that thrives on salt and neglect. Maya would paint it; Bram would call it a weed.",
  "Mountain Thyme": "Tough little leaves from the high scree — half the flavour of the valley in a pinch.",
  "Snowdrop": "It blooms where the snow never quite leaves. Proof that stubbornness can be delicate.",
  "Starlight Shard": "A splinter of last night's sky, still faintly warm. It hums if you hold it to your ear. Probably.",
  "Cooked Sardine": "Fried whole, and crunched from head to tail.",
  "Cooked Bass": "Firm white flakes, honestly earned.",
  "Cooked Trout": "Pan-browned and river-sweet.",
  "Cooked Salmon": "Rich and rosy — Bram's idea of a medal.",
  "Cooked Golden Koi": "Almost a shame to eat something so gold.",
  "Cooked Moonperch": "Firm, cold-water flesh, sweeter than it has any right to be.",
  "Cooked Silvergill": "Delicate to the point of showing off.",
  "Cooked Gulf Sturgeon": "A steak, really. It could feed the whole plaza.",
  "Cooked Coelacanth": "You cooked a living fossil. The valley will talk for weeks.",
  "Cooked Frostfin": "Seared hot against the cold — sweet, firm, and gone too fast.",
  "Cooked Glassperch": "Winter on a plate. Delicate enough that Bram forgets to grumble.",
  "Cooked Minnow": "Three bites, generously counted. Crisp, though.",
  "Cooked Chub": "Humble and honest, like everything else off the road.",
  "Cooked Grayling": "Thyme-white flesh with a whisper of the mountain the water came from.",
  "Cooked Rainrunner": "Tastes faintly of the storm it rode in on. In a good way, mostly.",
  "Grandpa's Pocketwatch": "Still ticking. He wound it the morning he buried it, and it's kept his time ever since.",
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
  "Amethyst": "Gary. Pip found him in the dark and named him. A purple keepsake worth more than any vein.",
  "Opal": "Milky and shy, until the light hits it — then a whole quiet rainbow.",
  "Sapphire": "Deep cold blue, like the pond under winter ice.",
  "Starstone": "It holds a fleck of light that moves when you turn it. Kin to the star metal — the deep gives up maybe one a season.",
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
  "Cheese": "A small wheel, waxed and patient. The barn, kept.",
  "Fine Cheese": "Aged from a well-loved cow's best pail. Tom's wife would call it competition.",
  "Cheese Press": "An oak-and-iron press from the coast dairy. It knows exactly what to do with a pail.",
  "Wool": "Soft, warm, and freshly off the sheep.",
  "Prize Fleece": "The finest coat in the valley — only a truly cherished sheep grows one.",
  "Shears": "Well-oiled, sharp, and shepherd-approved. A sheep never minds.",
  // v4.0 Warding
  "Stave": "A warden's tool. Not for striking — for settling. It hums, very faintly, the way a held breath does.",
  "Gloam Thread": "Cool, silver-blue, and impossibly fine. It was a wisp a moment ago; now it's just thread.",
  "Knotwood": "A knot of grief-dark wood, smooth as a worry stone. Warding lapsed, and the wood remembered.",
  "Ember Grit": "Warm grit that ticks like a cooling stove. It doesn't burn — it only wants to be near something.",
  "Warded Charm": "Thread wound tight around a chip of sapphire. Wearing it, the dark feels a little less like it wants you.",
  "Emberlight Charm": "A pinch of ember grit in a glass bead. It throws your lantern-light farther than any lantern should.",
  "Warden's Ash": "Pale grey ash that never quite goes cold. It's what an old warden's echo comes apart into — lighter than it should be.",
  "Snarlthread": "A knot of living thread that keeps trying to tie itself back together in your hand. Best kept in a tight coil.",
  "Heartknot": "The dense, dark core of a Great Knot — years of untended grief wound into a fist-sized whorl. It hums, very low. The heart of a good charm.",
  "Wardstone Charm": "A Heartknot bound in ash and sapphire. Worn, it steadies you — the dark takes a good deal longer to wear you down.",
  "Settler's Band": "A band of snarlthread that's finally learned to lie still. It makes the work of settling come a little quicker to the hand.",
  "Deepgnarl": "A knuckle of wood so old and so deep it's gone almost to stone. Cold in the middle, always.",
  "Gloamstar": "A splinter of the founding star, tangled through with gloam-thread. It holds a little of the sky it fell from — and a little of the dark it landed in.",
  "Starward Charm": "A Gloamstar set in a Heartknot, ringed with diamond. The finest ward a Warden ever wore: the deep dark barely touches you at all.",
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
  "geode": "A round, plain nodule — but it's hollow, and something catches the lamplight through the crack. Worth a pick.",
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
  // v4.0 The Undercroft
  "knot": "A knot of the dark, wound tight around the stair. Settle it and the way down opens.",
  "wardbell": "A Warden's bell, green with age and silent. Fund it and it rings you home — or back down here.",
  "wardup": "Worn stone steps, climbing back toward the Guild and the light.",
  "wardladderdown": "The stair drops away into a deeper, quieter dark.",
  "wardledger": "Elias's book of rounds. Each page is one thing the wing needs; close it, and the hall warms a little more.",   // v4.3
};
const EXAMINE_NPC = {
  "maya": "Always paints the valley greener than it is; lately it obliges.",
  "tom": "Sells the whole valley back to itself, cheerfully, at a markup.",
  "rowan": "Keeps the Guild's keys long after the Guild went quiet.",
  "bram": "An old fisher who believed the legends only once he'd hooked them.",
  "pip": "A valley kid, mostly powered by Berry Buns.",
  "elias": "A quiet man the valley kept a chair for, all those years.",
  "nell": "Tom's better half and the better cook; the coast dairy runs on her patience.",
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
  // v5.2 the Warden's tonics — three lines in Elias's register: practical, understated, a little sad.
  // v5.3 the gem seams — each reads as a band running through the rock, in a miner's register.
  for(const sk in GEM_SEAMS){
    const sm = GEM_SEAMS[sk];
    EXAMINE_OBJ[sk] = "A seam of " + sm.gem.toLowerCase() + " running clean through the stone. Follow it, don't chase it.";
  }
  EXAMINE["Sable's Remedy Book"] = "Two hands: her mother's, then hers. Every plant in the valley, what it's good for, and three entries she has never bothered to correct.";
  EXAMINE["Tom's Ledger"] = "Every price in the valley, in three generations of handwriting. The early pages are his father's. The last one is blank, and has your name at the top of it.";
  EXAMINE["Ember Broth"] = "Ember grit stirred through good stew. Warm the whole way down, and it keeps being warm.";
  EXAMINE["Gloamsalve"] = "Gloam thread steeped in honey until it goes clear. Orla swore by it. She would.";
  EXAMINE["Warden's Tea"] = "Ash and apple, which sounds worse than it tastes. Steadies the hands, and that is the entire trick.";
  EXAMINE["Keg"] = "It ages whatever you trust it with.";
  EXAMINE["Preserves Jar"] = "A crock with a patient lid.";
  EXAMINE["Sawmill"] = "Feed it logs at night; it gives back clean lumber by morning.";
  // v3.30: each board gets its own word (the raw woods had bespoke lines; the lumber shouldn't step down)
  EXAMINE["Oak Lumber"] = "Honest oak boards, planed smooth. What every good building starts as.";
  EXAMINE["Pine Lumber"] = "Pale, straight pine planks — light, clean, and quick to raise.";
  EXAMINE["Maple Lumber"] = "Close-grained maple, milled true. It carries a beam's weight without a groan.";
  EXAMINE["Willow Lumber"] = "Springy willow boards, cut cheap and plentiful — the workhorse of the woodpile.";
  EXAMINE["Elder Lumber"] = "Dark elder boards from the deep grove, close and heavy. Old wood remembers.";
  EXAMINE["Heartwood Beam"] = "A single beam of heartwood, dense as iron and twice as stubborn. It will outlast you.";
  EXAMINE["Silverwood Beam"] = "A silverwood beam, pale and faintly luminous. The finest timber the valley grows.";
  EXAMINE_OBJ["keg"] = "Something in there is taking its time.";
  EXAMINE_OBJ["jar"] = "The lid says: not yet.";
  EXAMINE_OBJ["sawmill"] = "Sawdust in the bed, and an edge that means it.";                        // v3.33: was falling through to the grass under it
  EXAMINE_OBJ["press"] = "Oak and iron from the coast dairy. The screw turns slow, and that's the whole trick.";
  // v3.36 The Coast Road landmarks (the full stories live in their interact dialogs)
  EXAMINE_OBJ["milestone"] = "MARROW POINT — 39. The carving has outlasted everyone who cut it.";
  EXAMINE_OBJ["shrine"] = "Leave what you can spare; take what you need. Today: a pebble, a flower, half a biscuit.";
  // v6.2 The Promised Coast
  EXAMINE_OBJ["lighthouse"] = "Forty feet of whitewashed stone with four red bands. It has been blinking at this valley from thirty-nine miles away the whole time.";
  EXAMINE_OBJ["hut"] = "One room, one stove, one chair. Somebody has swept it recently, which is the strangest thing about it.";
  EXAMINE_OBJ["hull"] = "Ribs and a keel and no planking yet. A boat is mostly an argument about curves.";
  EXAMINE_OBJ["mooring"] = "Nothing has tied up here in years. Somebody keeps the boards good anyway.";
  EXAMINE_OBJ["samphirenode"] = "Salty green spears, growing where only the tide waters them.";
  EXAMINE_OBJ["asternode"] = "Lilac asters, nodding in the salt wind. They grow nowhere but this meadow.";
  EXAMINE_OBJ["hollynode"] = "Steel-blue and stubborn — the headland's one flower.";
  // v3.43 Starfall Ridge
  EXAMINE_OBJ["cairn"] = "Stacked by every hand that ever made the climb. The view is the payment.";
  EXAMINE_OBJ["crater"] = "The star's old bed. The stone is fused smooth, like the mountain flinched once and never again.";
  EXAMINE_OBJ["shardnode"] = "A splinter of last night's sky, caught in the scree. It waits for the dark to let go.";
  EXAMINE_OBJ["thymenode"] = "Tough little leaves that out-stubborn the wind.";
  EXAMINE_OBJ["snowdropnode"] = "White bells at the snow line, nodding at nothing.";
  // v3.44 Butterbrook
  EXAMINE_OBJ["churn"] = "An old butter churn, worn pale where a hundred mornings of hands have held it.";
  EXAMINE_OBJ["bench"] = "Worn smooth by years of sitting. Still room for one more.";
  EXAMINE_OBJ["plantpot"] = "Someone tends these — the blooms are always fresh.";
  // décor (v3.13): the placed pieces read back their catalogue blurb (OBJ_TITLE set in 08-actions.js,
  // where that map lives — it isn't defined yet during this file's load)
  for(const k in DECOR){ EXAMINE_OBJ[k] = DECOR[k].blurb; EXAMINE[DECOR[k].name] = DECOR[k].blurb; }
  for(const k in FURNITURE){ EXAMINE_OBJ[k] = FURNITURE[k].blurb; EXAMINE[FURNITURE[k].name] = FURNITURE[k].blurb; }   // v5.7
  // v3.32: the quest cape earns a bespoke line — assigned AFTER the loop above, which would
  // otherwise clobber it with the catalogue blurb (Tom's locked-shop tease reads differently
  // from what the earned thing should say to its owner).
  EXAMINE["Storyteller's Banner"] = EXAMINE_OBJ["storybanner"] =
    "Every task done, every story told. Some capes are earned; this one was lived.";
})();

// ============================================================
// v5.0 "The Strongbox" — THE UNLOCK-CADENCE LINTER
//
// Why this exists. `GAME_DESIGN_PRINCIPLES.md` §4.1 states the single-player rule plainly:
// "never leave a dead zone." Nothing enforced it, and by v4.37 the ladders had quietly grown
// large ones — the V5 review measured that the band 85→99 is 45.4% of a skill's entire 1–99 XP
// while being, for four of six skills, entirely empty; and that Mining 50→70 alone is 19.3% of
// the climb with literally nothing in it. Those numbers were extracted BY HAND for the roadmap.
// A number you have to re-derive by hand is a number nobody checks, so V5's content releases
// would have shipped against a spreadsheet that went stale the first time a table moved.
//
// This is that measurement, made a permanent part of the build. It reads the SAME tables the
// game plays from, so it can never disagree with the game; the atlas renders it every release;
// and `?lint` in the URL prints it to the console.
//
// Deliberately NOT a thrown error and NOT an unconditional console.warn. Every gap it reports
// today is real and known — warning on load would print twenty lines into every player's console
// for content the roadmap has already scheduled. The dev flag is the honest middle: loud for
// whoever is looking, silent for whoever is playing. (v4.23's auditRecipeLadder warns
// unconditionally because a recipe that pays LESS XP than an earlier one is always a BUG; a
// sparse band is a design debt, which is a different thing and wants a different volume.)
//
// This is state-free by construction — it runs at load, when `state` is null, so it must never
// call anything that reads a save. That is why it re-walks the tables instead of reusing
// unlocksAt (08-actions.js), which hides the Stave behind state.flags.staveEarned.
// ============================================================
// ============================================================
// v5.4 — THE BOSS LADDER
//
// `CREATURES.greatknot` was stat-frozen: hp 42, dmg 20, xp 360, no depth term at all. Floors 10, 20,
// 30 and 40 hosted the IDENTICAL two-move fight, and by the Star Stave it died in four swings — so
// the game's recurring set-piece got less interesting exactly as the player got better, which is the
// opposite of a ladder.
//
// The fix is composition, not numbers. Each decade's Knot keeps the slam-and-lunge base and gains ONE
// move the wing has already taught you, so every boss asks the question the preceding floors answered:
//   · 10 — the plain Knot. Learn the ring and the lunge.
//   · 20 — it SHEDS Tanglets when struck (the Gloam Tangle's lesson: clear the halves).
//   · 30 — it lobs star-bolts between slams (the Star-Gnarl's lesson: sidestep, or turn them at 55).
//   · 40 — both at once.
// Stats scale gently alongside — the composition is the difficulty, the numbers only keep pace.
const KNOT_LADDER = {
  10: { hp:42,  dmg:20, xp:360,  moves:[],                  blurb:"the first of them — a ring and a reach" },
  20: { hp:78,  dmg:22, xp:900,  moves:["shed"],            blurb:"it comes apart as you strike it" },
  30: { hp:130, dmg:24, xp:1900, moves:["bolt"],            blurb:"it throws the dark at you between slams" },
  40: { hp:190, dmg:26, xp:3400, moves:["shed","bolt"],     blurb:"everything the wing has taught you, at once" },
};
function knotRungFor(depth){ return KNOT_LADDER[depth] || KNOT_LADDER[10]; }

// ★ v6.1.5 — DERIVED, not listed. This was a hardcoded array of six, which meant the moment a new
// craft shipped it would be graded by nothing: the linter would report six clean-ish ladders and stay
// silent about the new one, which is the ladder most likely to have holes. `freshState().skills` is
// the same source `renderSkills` and `totalLevel` already read, so the linter now grades whatever the
// game actually trains. (Four more crafts are coming — Ranching, Foraging, Smithing, Hearthcraft —
// and the whole point of the linter is to grade them as they are built, not after.)
function ladderSkills(){
  try { return Object.keys(freshState().skills); }
  catch(e){ return ["Farming", "Woodcutting", "Mining", "Fishing", "Cooking", "Warding"]; }
}
const LADDER_GAP_WARN = 8;   // levels with no new noun before a band counts as dead

// Every level-gated thing a skill unlocks, as {lvl,label}. The mirror of unlocksAt, minus state.
function unlockLadder(skill){
  const u = [];
  const add = (lvl, label) => { if(lvl >= 1 && lvl <= 99) u.push({ lvl, label }); };
  if(skill === "Farming")     for(const k in CROPS) add(CROPS[k].lvl, CROPS[k].name + " seeds");
  if(skill === "Woodcutting"){ for(const k in TREES) add(TREES[k].lvl, TREES[k].name);
                               for(const r in DEADFALL) add(DEADFALL[r].lvl, "grove ring " + r); }
  if(skill === "Mining"){ for(const k in ORES) add(ORES[k].lvl, ORES[k].name);
    for(const k in GEM_SEAMS) add(GEM_SEAMS[k].lvl, GEM_SEAMS[k].name);          // v5.3 the gem seams
    add(PROSPECT_LEVEL, "◇ Read the seams"); }
  if(skill === "Fishing"){ FISH.forEach(f => add(f.lvl, f.name));
                           LEGENDS.forEach(l => add(l.lvl, l.name + " (legend)")); }
  if(skill === "Cooking")     for(const r of RECIPES) if(!r.flag) add(r.lvl, r.name);
  if(skill === "Smithing")    for(const r of FORGE) add(r.lvl, r.name);   // v6.4
  for(const tool of TOOLS){    // the tool ladder is a hard gate (buyTool enforces TIER_LEVEL) — real content
    if(TOOL_SKILL[tool] !== skill) continue;
    for(let t = 1; t <= MAX_TIER; t++) add(TIER_LEVEL[t], TOOL_TIERS[t] + " " + tool);
  }
  if(skill === "Warding") for(const t of WARD_TECHS) add(t.lvl, "⟡ " + t.name);   // v5.1 the technique ladder
  if(MASTERY[skill]) for(const l in MASTERY[skill]) add(+l, "★ " + MASTERY[skill][l]);
  u.sort((a,b) => a.lvl - b.lvl);
  return u;
}
// The report. `dead` bands are runs of ≥LADDER_GAP_WARN levels between one unlock and the next,
// weighted by what they actually COST — XP, not level count, because the curve is exponential and
// a 14-level band at the top is worth more hours than a 40-level band at the bottom.
function auditUnlockCadence(){
  const total = XP_TABLE[99], rows = [];
  for(const skill of ladderSkills()){
    const ladder = unlockLadder(skill);
    const marks = [...new Set(ladder.map(x => x.lvl))].sort((a,b) => a-b);
    const gaps = [];
    // Level 1 is where every skill starts, so the run from 1 to the first unlock counts too.
    const walk = marks[0] === 1 ? marks : [1, ...marks];
    for(let i = 0; i < walk.length - 1; i++){
      const from = walk[i], to = walk[i+1];
      if(to - from < LADDER_GAP_WARN) continue;
      gaps.push({ from, to, span: to - from, share: (XP_TABLE[to] - XP_TABLE[from]) / total });
    }
    const last = marks.length ? marks[marks.length-1] : 1;
    if(99 - last >= LADDER_GAP_WARN) gaps.push({ from:last, to:99, span:99-last, share:(XP_TABLE[99]-XP_TABLE[last])/total, tail:true });
    rows.push({
      skill, unlocks: ladder.length, milestones: marks.length, first: marks[0] || 1, last,
      gaps, dead: gaps.reduce((a,g) => a + g.share, 0),
      worst: gaps.slice().sort((a,b) => b.share - a.share)[0] || null,
      ladder,
    });
  }
  return rows;
}
// ★ LAZY ON PURPOSE (v5.1). This was `const LADDER_AUDIT = auditUnlockCadence()` — evaluated at load,
// at the point in the file where it happens to sit. The very next release appended a new unlock table
// (WARD_TECHS, the Warding technique ladder) BELOW it, `unlockLadder` reached for that table, and the
// game died at boot with "Cannot access 'WARD_TECHS' before initialization" — a `const` TDZ, in a
// codebase whose whole architecture is one shared script scope where load order is load-bearing.
// A memoized function has no position in the file, so no table added later can ever be too late.
// The same reasoning applies to the `?lint` print below: deferred a tick, so it reads a fully
// evaluated file rather than whatever had been declared by the time this line was reached.
let _ladderAudit = null;
function ladderAudit(){ return _ladderAudit || (_ladderAudit = auditUnlockCadence()); }
// `?lint` (or localStorage.hs_lint) prints it. Silent for everyone else — see the note above.
setTimeout(function(){
  let on = false;
  try{ on = /[?&]lint\b/.test(location.search) || !!localStorage.getItem("hs_lint"); }catch(e){}
  if(!on) return;
  const LADDER_AUDIT = ladderAudit();
  console.info("[ladder cadence] XP-weighted dead share per skill (bands of ≥" + LADDER_GAP_WARN + " levels with no unlock):");
  for(const r of LADDER_AUDIT){
    console.info(`  ${r.skill.padEnd(12)} ${r.unlocks} unlocks over ${r.milestones} levels · dead ${(r.dead*100).toFixed(1)}%` +
                 (r.worst ? ` · worst ${r.worst.from}→${r.worst.to} (${(r.worst.share*100).toFixed(1)}%)` : ""));
    for(const g of r.gaps) console.warn(`    [dead band] ${r.skill} ${g.from}→${g.to}: ${g.span} levels, ${(g.share*100).toFixed(1)}% of the 1–99 climb, nothing unlocked${g.tail ? " (tail)" : ""}.`);
  }
}, 0);

// ============================================================
// v5.1 "The Trials" — THE MASTERY TRIALS (V4_PLAN §4.1, deferred from v4.1/v4.3/v4.4/v4.5)
//
// The problem, measured. `auditUnlockCadence` (above) prints it every release: the back half of
// every ladder pays almost nothing. Four of six skills have their LAST content unlock at level 85,
// and the band 85→99 alone is 45.4% of a skill's entire 1–99 XP. The middle is nearly as bad —
// Mining 50→70 is 19.3% of the climb with literally nothing in it. A player who commits is climbing
// through silence for most of the journey.
//
// The trials are the breadth engine's first mechanism: advancing a craft past **50**, and again past
// **75**, takes a one-time favour asked by the person who cares about that craft — and every favour
// is deliberately CROSS-SKILL. Rowan won't call you a miner until you've cut props and cooked a
// meal worth carrying down. That is the anti-rabbit-hole design: the story is structurally incapable
// of being fed by one skill, and now neither is the ladder.
//
// ★ THE CONTRACT, and the reason this took five releases to ship. A naive reading — "your level
// drops until you clear the trial" — TAKES A LEVEL, and this game does not take. So:
//   · **Bank, never regress.** XP keeps accruing at full rate past the gate. The LEVEL waits. The
//     moment the trial clears, every banked level lands at once, with the banner it was owed.
//   · **Grandfather everything.** Any save already past a gate when this shipped auto-passes it
//     (`migrateSave`, guarded by `trialsSeeded`). A rule added today may never cost anyone anything
//     they already had — the same principle as v4.31's bagBonus.
//   · **No timer, no failure, no expiry.** A trial can be ignored forever; you simply keep the
//     level you have and bank the rest. `tools/check-saves.mjs` asserts both properties.
//
// The ASK rides the Pledge Ledger (the fifth prefix — `trial:<Skill>:<gate>`), which buys partial
// deposits, the Journal's Restorations page, and the no-wasted-trip rule for free. The SCENE fires
// when you next talk to the NPC (14-story.js), never mid-swing: a cutscene that yanks you out of a
// harvest to congratulate you is a punishment wearing a party hat.
//
// Owner decision 2026-07-29 (`V5_PLAN.md` §6.1): **both gates, live from the start** — not "75 ships
// dark". Shipping 75 dark would have left L75 empty in the exact band this release exists to fill.
// ============================================================
// ★ v6.1.4 — WARD_MAPS: the one place that answers "is this a combat map?".
//
// `inCombatMap()` (15-warding.js) and `updateTime()` (08-actions.js) each hard-coded the string
// "undercroft". Between them those two decide whether Resolve drains, whether tonics tick, whether
// food restores Resolve, and whether the day clock runs. v6.2 adds two more combat venues, and
// missing either call site would silently disable the whole Resolve layer in the new places, or
// silently switch the sun back on underground — with no error anywhere to notice.
//
// Declared here rather than in 15-warding.js because 08-actions.js loads FIRST and must see it.
const WARD_MAPS = new Set(["undercroft"]);
const TRIAL_GATES = [50, 75];

// Each trial: who asks, what it's called, the cross-skill ask, and the words. `mats` is a plain
// pledge cost (gold optional) — deliberately materials-first, because a gold-only ask is just a
// wait, and the whole point is that you had to go and DO something in another craft.
//
// Sizing (GBP §2.5's obligation — the arithmetic before the code): each 50-trial asks roughly one
// good afternoon's work in two other crafts, each 75-trial roughly two, drawn from tiers a player at
// that level demonstrably reaches. Nothing here is rare-drop-gated: every item is farmable, choppable,
// mineable, catchable or cookable on demand, so a trial can never become a wall of bad luck.
const TRIALS = {
  // v6.4 — Smithing's two, on v5.1's shipped engine. Both are things the valley visibly needed and
  // could not have before: the mine lift's chain, and the Guild's ten lantern brackets.
  Smithing: {
    50: { title:"The Lift Chain", g:3000,
          mats:{ "Chain":6, "Cobalt Bar":4, "Fish Stew":2 },
          ask:"Fenn wants the mine lift re-chained end to end — six lengths, cobalt for the shackles, and something hot to eat while it cools.",
          intro:[["Fenn","Fifty. Right. You know what fifty means in this trade? It means you stop asking me whether it's hot enough."],
                 ["Fenn","The lift chain down the mine is original. Original means older than me, and I am not young. Rowan won't say it because Rowan won't spend."],
                 ["Fenn","Six lengths, cobalt shackles. We do it in a day and nobody ever knows we did it. That's the job."]],
          done:"Fenn: “Nobody will ever thank us for that. Nobody will ever fall down that shaft either. I'll take the second one.”" },
    75: { title:"The Ten Brackets", g:11000,
          mats:{ "Lantern Frame":10, "Deepsilver Bar":4, "Star Metal Shard":6, "Cherry Tart":2 },
          ask:"Ten lantern brackets for the Guild hall — one for each craft, deepsilver-pinned, made to outlast everyone who will ever stand under them.",
          intro:[["Fenn","Seventy-five. Now the hard one, and I want you to hear the whole of it before you say yes."],
                 ["Fenn","There are ten crafts in that hall and every lantern hangs off a bracket some smith made. Nine of them are mine. They're fine. They'll last my lifetime."],
                 ["Fenn","I want ten that'll last longer than that. Deepsilver pins, star metal in the shoulder. Made by somebody who'll still be here."],
                 ["Fenn","That's not me asking for work. That's me asking you to outlive me. Bring the frames."]],
          done:"Fenn: “Ten. Straight, matched, and pinned so they'll never sag.” She looks up a long while. “Right. That's mine done, then.”" },
  },
  Farming: {
    50: { title:"The Long Row", g:2000,
          mats:{ "Pine Lumber":8, "Iron Ore":6, "Cooked Salmon":2 },
          ask:"Maya wants the east beds framed and pinned — sawn boards, iron for the pins — and lunch for the two of you while you do it.",
          intro:[["Maya","You're about to pass a line most folk never get near. Fifty. Half the ladder."],
                 ["Maya","Papa said a farmer past fifty stops growing food and starts growing a FARM. Bigger thought. Harder."],
                 ["Maya","So — frame the east beds properly. Sawn boards, iron pins, none of your propped-up nonsense. And bring lunch; I'm helping."]],
          done:"Maya: “There. Straight as anything, and it'll still be straight in ten years. Go on — you've earned the rest of that ladder.”" },
    75: { title:"The Seed Vault", g:9000,
          mats:{ "Silverwood Beam":3, "Cobalt Ore":8, "Cloudberry Preserve":2, "Honey":10 },
          ask:"A cold-room under the barn: silverwood framing, cobalt fittings, and something sweet on the shelf to prove it keeps.",
          intro:[["Maya","Seventy-five. You know what happens to a valley when the person who feeds it forgets to write anything down?"],
                 ["Maya","It goes quiet. Like this one did. Rosa kept a seed vault — every strain she ever grew, labelled, cold, patient. It rotted out the winter after she died."],
                 ["Maya","Build it again. Silverwood, cobalt fittings, cold and dry. Put something sweet on the shelf so we know it keeps."]],
          done:"Maya: “Every seed in the valley has a home now. That'll outlive us both, you know. …Sorry. That's the nice version of a compliment.”" },
  },
  Woodcutting: {
    50: { title:"The Sawyer's Bargain", g:2500,
          mats:{ "Copper Ore":10, "Stone":30, "Farmer's Omelette":2 },
          ask:"Tom wants the mill's saw re-toothed and its bed re-laid — copper for the teeth, stone for the bed, breakfast for the smith.",
          intro:[["Tom","Fifty! Right. Before you go swinging at anything bigger, we're fixing my saw, because you BROKE my saw."],
                 ["Tom","Not maliciously. Volumetrically. Copper for the teeth, stone to re-lay the bed, and feed the smith or he'll do it badly on purpose."],
                 ["Tom","Do that and I'll stop pretending the deep stuff is out of stock."]],
          done:"Tom: “Listen to that. Sings, doesn't it? Right — the woods are yours. Try to leave me a tree.”" },
    75: { title:"The Standing Grove", g:10000,
          mats:{ "Heartwood Beam":6, "Gold Ore":6, "Starfruit Sorbet":2, "Elder Wood":25 },
          ask:"Not a felling — a planting. Frame the grove's east ring so the young wood grows straight, and stand a marker in gold.",
          intro:[["Tom","Seventy-five, and I'm going to ask you for the strangest thing anyone's asked you all year."],
                 ["Tom","Don't cut anything. Frame the grove's east ring — heartwood posts, so the young trees come up straight instead of leaning for the light."],
                 ["Tom","Grandad Alder framed the west ring the year I was born. It's the finest wood in the valley now and I've never taken a stick of it. Your turn."]],
          done:"Tom: “That's a hundred years of good timber you just planted and won't live to sell. Best day's work in the ledger.”" },
  },
  Mining: {
    50: { title:"The Sound Roof", g:2500,
          mats:{ "Oak Lumber":12, "Maple Lumber":6, "Fish Stew":2 },
          ask:"Rowan won't sign off on a miner who doesn't prop a roof — oak sills, maple beams, and a stew that keeps in a cold gallery.",
          intro:[["Elder Rowan","Fifty. Sit down a moment. …No, properly sit. This is the part where I tell you what killed miners here."],
                 ["Elder Rowan","Not the dark. Not the deep. The roof. Every one of them was a good enough miner to be somewhere a bad roof was."],
                 ["Elder Rowan","So: props. Oak sills, maple beams, cut by you, set by you, in the galleries you use. And a stew that keeps — a cold miner makes cold decisions."]],
          done:"Elder Rowan: “Sound as a bell. Now you're a miner, and not before. Go down as far as you like — the roof will hold.”" },
    75: { title:"The Deep Ledger", g:11000,
          mats:{ "Deepsilver Ore":8, "Silverwood Beam":3, "Emerald":3, "Plum Pudding":2 },
          ask:"The Guild's assay ledger, rebuilt: deepsilver rules, a silverwood case, and three true stones to calibrate it.",
          intro:[["Elder Rowan","Seventy-five. There is one thing left the old Guild had that we do not, and it is not a tool. It is a LEDGER."],
                 ["Elder Rowan","Every seam this valley ever cut, its depth, its yield, its temperament. Burned, I assume, by someone who thought paper was the least of it."],
                 ["Elder Rowan","Rebuild the case — deepsilver rules, silverwood, three true stones to calibrate against. And bring pudding; I intend to be here some hours."]],
          done:"Elder Rowan: “Two hundred years of stone, written down again. …I have wanted this since before you were born, child.”" },
  },
  Fishing: {
    50: { title:"A Proper Gaff", g:2000,
          mats:{ "Iron Ore":8, "Willow Lumber":6, "Apple Crumble":2 },
          ask:"Bram won't teach the deep casts to anyone holding a bent stick — iron for the hook, willow for the haft.",
          intro:[["Bram","Fifty. Aye. And still using that…" ],
                 ["Bram","…whatever that is. Lad, a fish worth landing will take that off you and leave you apologising to the water."],
                 ["Bram","Iron for the hook, willow for the haft — springs, won't crack cold. Make one. Make it well. Bring cake; I get maudlin around the forge."]],
          done:"Bram: “Now THAT'S a gaff. Right — I'll show you the deep casts. Watch my wrists, not the water.”" },
    75: { title:"The Long Water", g:9500,
          mats:{ "Cobalt Ore":10, "Heartwood Beam":4, "Frostmelon Ice":2, "Prize Fleece":4 },
          ask:"A boat that will sit the estuary in weather: heartwood ribs, cobalt fittings, fleece for the caulking.",
          intro:[["Bram","Seventy-five. There's water out past the ferry landing I've not fished in eleven years, and it is not because I got old."],
                 ["Bram","It's because the boat went. And I never had the heart. Heartwood ribs, cobalt fittings, fleece for the caulking — she'll sit anything the coast throws."],
                 ["Bram","Build her and I'll take you out. Both of us. That water remembers me and I'd like to see if it still does."]],
          done:"Bram: “She sits the swell like she was born to it. …Aye. Aye, it remembers me. Thank you, lad.”" },
  },
  Cooking: {
    50: { title:"The Long Table", g:2200,
          mats:{ "Maple Lumber":10, "Copper Ore":8, "Large Milk":6, "Wheat":20 },
          ask:"Pip wants the Guild kitchen's long table back — maple top, copper pans hung over it, and the makings of a proper bake.",
          intro:[["Pip","FIFTY! Okay okay okay — you know what fifty means? Fifty means you're allowed to cook for more than one person."],
                 ["Pip","Which we CAN'T. Because the Guild kitchen has no table. It has a plank. On two barrels. It's an insult."],
                 ["Pip","Maple top, copper pans hung over it, and enough milk and wheat that we can bake the day it's finished. Please please please."]],
          done:"Pip: “It's SO BIG. Eleven people could eat at this. …We don't have eleven people. Yet. But we could!”" },
    75: { title:"The Winter Larder", g:10000,
          mats:{ "Fine Cheese":6, "Silverwood Beam":2, "Deepsilver Ore":6, "Cloudberry":12 },
          ask:"A larder that carries the valley through a hard winter — silverwood shelving, deepsilver-lined crocks, and the stock to fill them.",
          intro:[["Pip","Seventy-five. Right. I'm going to be serious for once and it's going to be weird for both of us."],
                 ["Pip","Nell told me what the bad winters were like. Not hungry — SCARED. Counting jars in November and doing sums you don't say out loud."],
                 ["Pip","I want a larder that means nobody in this valley ever does that sum again. Silverwood shelves, deepsilver crocks, and full. Properly full."]],
          done:"Pip: “Look at it. LOOK at it. Nobody's counting jars this year. …Okay I'm going to cry, go away, I love you, go away.”" },
  },
  Warding: {
    50: { title:"The Sweeping Art", g:3000,
          mats:{ "Gloam Thread":8, "Ember Grit":6, "Pine Lumber":8, "Cheese Toastie":2 },
          ask:"Elias will teach the Sweep — but the stave has to be rewound first, and he has to be fed while he remembers how.",
          intro:[["Elias","Fifty. Hm. Then it's time I taught you something my hands still know and my mouth has forgotten how to say."],
                 ["Elias","The Sweep. You stop striking AT things and start moving them. Wider arc, softer touch, two at once if they're foolish enough to stand together."],
                 ["Elias","Rewind the stave first — gloam thread, ember grit, a new pine core. And bring something hot. I think better with my hands warm."]],
          done:"Elias: “There. Now it's a warden's stave and not a stick with history. …Hold it lightly. That's the whole art.”" },
    75: { title:"The Settling Blow", g:12000,
          mats:{ "Deepgnarl":8, "Gloamstar":4, "Starstone":1, "Peony Cordial":2 },
          ask:"The last thing Orla taught him, and the only one he never wrote down: a blow that goes through a guard instead of around it.",
          intro:[["Elias","Seventy-five. …Orla taught me one more thing than I've ever admitted to anyone, and I've been deciding for a year whether to pass it on."],
                 ["Elias","The Settling Blow. You hold it. You let it build. And it goes THROUGH a guard rather than round it, because some things down there have learned to face you."],
                 ["Elias","It wants a core that doesn't flinch — deepgnarl, gloamstar, and a true starstone at the heart. And a drink, after. I'll want one."]],
          done:"Elias: “That's all of it. Everything Orla knew, in someone's hands again. …I've been carrying that alone a long while. Thank you.”" },
  },
};
function trialDef(skill, gate){ return (TRIALS[skill] || {})[gate] || null; }
function trialKey(skill, gate){ return skill + gate; }
function trialId(skill, gate){ return "trial:" + skill + ":" + gate; }
function trialParse(id){ const p = String(id).split(":"); return { skill:p[1], gate:+p[2] }; }
function trialPassed(skill, gate){ return ((state.trialsDone) || []).includes(trialKey(skill, gate)); }
// The gate a skill is currently held at — the FIRST unpassed trial, or 99 if both are behind you.
// The whole banking design is this one function: raw XP is untouched, the LEVEL is clamped.
function trialCap(skill){
  if(!TRIALS[skill]) return 99;
  for(const g of TRIAL_GATES) if(!trialPassed(skill, g)) return g;
  return 99;
}
// Is a trial open — i.e. have you actually reached its gate? (Never shown before you get there:
// a trial you cannot start is just a chore posted early.)
function trialOpen(skill, gate){ return !trialPassed(skill, gate) && levelFor(state.skills[skill] || 0) >= gate; }
function trialCurrent(skill){   // the one open trial for a skill, if any
  for(const g of TRIAL_GATES) if(trialOpen(skill, g)) return g;
  return null;
}
// How many levels are waiting behind the gate right now. Shown everywhere the hold is mentioned,
// because "banked" is only reassuring if you can see the number.
function trialBanked(skill){
  const raw = levelFor(state.skills[skill] || 0);
  return Math.max(0, raw - Math.min(raw, trialCap(skill)));
}

// ============================================================
// v5.1 — THE WARDING TECHNIQUE LADDER
//
// Warding shipped in v4.0 as the game's newest 1–99 skill and immediately became the one whose
// levels mean the LEAST: the cadence linter measures 10 unlocks in total and an 88.5% dead share,
// worst in the game, because v4.20 correctly moved creature spawns to depth-keyed WARD_BANDS and
// left `unlocksAt` with no Warding branch at all. A Warding level bought a bigger number and
// nothing else.
//
// These are the answer, and the rule they obey is the important part: **every rung is a new INPUT
// or a new OUTCOME, never a damage stat.** A "+3% stave power at 55" would be another number; a
// guard that suddenly deflects star-bolts changes what you can stand in front of. The tier ladder
// (1/10/20/30/45/70/85 — six systems key off it) does NOT move; these interleave between its rungs.
// ============================================================
const WARD_TECHS = [
  { lvl:15, id:"flare",   name:"Lantern Flare",
    blurb:"settling a creature flares the lantern — anything close hesitates" },
  { lvl:35, id:"cleave",  name:"Cleaving Sweep",
    blurb:"one swing settles two, if they crowd you" },
  { lvl:55, id:"boltpar", name:"Bolt-Parry",
    blurb:"the Guard turns a star-bolt aside, not just a blow" },
  { lvl:65, id:"footing", name:"Sure Footing",
    blurb:"the Guard recovers faster, and its window is a little kinder" },
  { lvl:80, id:"pulse",   name:"Ward-Pulse",
    blurb:"a perfect parry rings outward — everything adjacent staggers" },
];
function hasTech(id){
  const t = WARD_TECHS.find(x => x.id === id);
  return !!t && skillLvl("Warding") >= t.lvl;
}
