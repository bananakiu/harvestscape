"use strict";
/* ============================================================
   03-art.js — procedural pixel-art atlas. All sprites are
   drawn in code onto offscreen canvases (no image files).
   ============================================================ */

const spr = {};
function mkSpr(name, w, h, fn){
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  fn(g, w, h); spr[name] = c; return c;
}
const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x|0, y|0, w|0, h|0); };
// Hue-shifted shading (§8.1's #1 pixel-art rule): don't just scale value — rotate hue as you go, so
// shadows lean cool/blue and highlights lean warm/gold. Value-only shading reads muddy; this gives
// the whole procedural atlas depth for free (one function, ~40 call sites). rgbToHex clamps 0–255.
function shade(hex, f){
  let [r,gg,b] = hexToRgb(hex);
  r*=f; gg*=f; b*=f;
  if(f < 1){ const d = 1-f; b += d*34; r -= d*14; }        // into shadow: cooler, bluer
  else if(f > 1){ const d = f-1; r += d*30; gg += d*12; }   // into light: warmer, more golden
  return rgbToHex(r, gg, b);
}
// deterministic scatter rng per-sprite
let _rs = 1; const rr = () => (_rs = (_rs*1103515245+12345) & 0x7fffffff) / 0x7fffffff;
function seedRR(s){ _rs = s; }

function buildArt(){
  buildTiles();
  buildCrops();
  buildTrees();
  buildRocks();
  buildDecor();
  buildInteriors();
  buildMineArt();
  buildGroveArt();
  buildBeachArt();
  buildChars();
  buildItems();
  buildWardingArt();   // v4.0 — the Stave, the warding drops/charms, the restless things
  buildPortraits();
}

// ---------------- v4.0 Warding art: the Stave, its drops & charms, and the restless things ----------
// Kept together (not scattered into buildItems/buildChars) so the whole combat layer's art reads as one
// unit. Creatures are baked as 2-frame sprites (like the animals in buildInteriors) and composited with
// dynamic state tints in drawCreature (15-warding.js). Melancholy, not menacing: soft glows, downcast
// shapes, cool blues — a garden gone untended, not a monster.
function buildWardingArt(){
  // The Stave — a pale worn shaft with a small blue ward-light bound into the head.
  const stave = g => { px(g,7,4,2,10,"#b7a48c"); px(g,7,4,1,10,"#cdb99f");   // shaft
    px(g,6,2,4,4,"#3a6ad0"); px(g,7,2,2,2,"#9fc4ff"); px(g,6,3,1,1,"#2a4a9a"); };   // sapphire head + glint
  mkSpr("tool_stave", 16, 16, stave);
  mkSpr("item_Stave", 16, 16, stave);
  // The drops — fuel, drawn plain and quiet.
  mkSpr("item_Gloam Thread", 16, 16, g => { for(let i=0;i<9;i++) px(g,4+i,10-Math.round(Math.sin(i*0.9)*2),1,1,"#bfe0ff");
    for(let i=0;i<7;i++) px(g,5+i,7-Math.round(Math.sin(i*0.9+1)*2),1,1,"#8fb8e8"); px(g,4,10,1,1,"#e8f4ff"); });
  mkSpr("item_Knotwood", 16, 16, g => { px(g,4,5,8,7,"#4a3c2c"); px(g,4,5,8,1,"#6a5540"); px(g,5,7,3,3,"#2c221a");
    px(g,9,6,2,2,"#2c221a"); px(g,6,8,1,1,"#7a6a52"); });   // a grief-dark knot with a whorl
  mkSpr("item_Ember Grit", 16, 16, g => { px(g,5,7,6,5,"#4a2a14"); px(g,6,8,4,3,"#c05a24"); px(g,7,9,2,1,"#ffab5a");
    px(g,5,6,1,1,"#ff8a3a"); px(g,10,7,1,1,"#ff8a3a"); });
  // The crafted charms — a chip of sapphire wound in thread; a bead of ember in glass.
  mkSpr("item_Warded Charm", 16, 16, g => { px(g,6,5,4,4,"#3a6ad0"); px(g,7,5,2,2,"#9fc4ff");
    for(let i=0;i<8;i++) px(g,4+i,11,1,1,"#bfe0ff"); px(g,7,9,2,2,"#8fb8e8"); });
  mkSpr("item_Emberlight Charm", 16, 16, g => { px(g,5,5,6,6,"#2a2018"); px(g,6,6,4,4,"#c05a24"); px(g,7,7,2,2,"#ffce8a");
    px(g,6,6,1,1,"#ffab5a"); });

  // ---- the restless things (2-frame idle) ----
  // Gloam Wisp — a small mournful orb with a trailing wisp; frames wobble the tail.
  const wispBody = g => { px(g,4,4,4,4,"#bfe0ff"); px(g,3,5,6,2,"#9fd0ff"); px(g,5,5,2,2,"#eaf6ff"); };
  mkSpr("wisp_0", 12, 12, g => { wispBody(g); px(g,5,8,2,2,"#7faee0"); px(g,5,10,1,1,"#5f8fc0"); });
  mkSpr("wisp_1", 12, 12, g => { wispBody(g); px(g,4,8,2,2,"#7faee0"); px(g,3,10,1,1,"#5f8fc0"); });
  // Knot-Shambler — a hunched knot of dark wood, dim eye-glints; frames shift the lean.
  const shBody = g => { px(g,3,6,8,7,"#4a3c2c"); px(g,3,6,8,1,"#5f4c38"); px(g,2,9,10,4,"#3a2e22");
    px(g,4,8,2,2,"#8fd0ff"); px(g,8,8,2,2,"#8fd0ff"); px(g,5,9,1,1,"#2a2018"); px(g,9,9,1,1,"#2a2018"); };
  mkSpr("shambler_0", 14, 14, g => { shBody(g); px(g,3,13,2,1,"#2a2018"); px(g,9,13,2,1,"#2a2018"); });
  mkSpr("shambler_1", 14, 14, g => { shBody(g); px(g,4,13,2,1,"#2a2018"); px(g,8,13,2,1,"#2a2018"); });
  // Ember Mite — a small skittering shell with a warm core and many little legs.
  const emBody = g => { px(g,3,4,6,4,"#4a2a18"); px(g,3,4,6,1,"#6a3a22"); px(g,4,5,4,2,"#c05a24"); px(g,5,5,2,1,"#ffab5a"); };
  mkSpr("embermite_0", 12, 10, g => { emBody(g); px(g,2,8,1,1,"#3a2418"); px(g,4,8,1,1,"#3a2418"); px(g,7,8,1,1,"#3a2418"); px(g,9,8,1,1,"#3a2418"); });
  mkSpr("embermite_1", 12, 10, g => { emBody(g); px(g,3,8,1,1,"#3a2418"); px(g,5,8,1,1,"#3a2418"); px(g,6,8,1,1,"#3a2418"); px(g,8,8,1,1,"#3a2418"); });

  // ---- Undercroft fixtures (drawn by the generic drawObject fallback, so they shake on hit) ----
  // The stair-knot — a dark gnarled coil hiding the way down; a settle-target for the Stave.
  mkSpr("knot", 16, 16, g => { px(g,3,4,10,10,"#3a2e22"); px(g,3,4,10,1,"#5a4a38");
    px(g,5,6,6,6,"#2a2018"); px(g,6,7,4,4,"#4a3c2c"); px(g,7,8,2,2,"#1a140e");
    px(g,4,10,2,2,"#5a4a38"); px(g,10,6,2,2,"#5a4a38"); px(g,6,5,1,1,"#8fd0ff"); px(g,9,11,1,1,"#8fd0ff"); });
  // The Warden's Bell — a green-aged bell hung on a small frame (a standing fixture; 22px tall → TALL).
  mkSpr("wardbell", 16, 22, g => { px(g,2,2,12,2,"#5a4a38"); px(g,3,2,1,20,"#4a3c2c"); px(g,12,2,1,20,"#4a3c2c");   // frame
    px(g,6,6,4,2,"#3a6a5a"); px(g,5,7,6,7,"#5a9a86"); px(g,4,13,8,3,"#4a8a76"); px(g,5,7,6,1,"#7ac0a8");            // bell body
    px(g,7,16,2,3,"#3a6a5a"); px(g,7,10,2,3,"#2a4a3e"); });                                                          // clapper + shading

  // ==== v4.1 families 4–5 + the Great Knot boss ====
  // Hollow Warden — a lost predecessor's echo: a tall armoured silhouette with a cold heart-glint.
  const hwBody = g => { px(g,4,1,6,3,"#454a5e"); px(g,5,2,4,2,"#2a2d3a");                     // hollow helm
    px(g,5,2,1,1,"#8fd0ff"); px(g,8,2,1,1,"#8fd0ff");                                          // cold eye-glints
    px(g,3,4,8,7,"#8a94b0"); px(g,3,4,8,1,"#a2acc8"); px(g,2,5,2,4,"#6a7290"); px(g,10,5,2,4,"#6a7290");
    px(g,6,6,2,4,"#5f7fbf"); px(g,6,6,2,1,"#9fc4ff"); };                                       // cold core
  mkSpr("hollowwarden_0", 14, 16, g => { hwBody(g); px(g,4,11,2,4,"#454a5e"); px(g,8,11,2,4,"#454a5e"); });
  mkSpr("hollowwarden_1", 14, 16, g => { hwBody(g); px(g,5,11,2,4,"#454a5e"); px(g,7,11,2,4,"#454a5e"); });
  // Gloam Tangle — a knotted snarl of living green thread, with sad little eyes.
  const gtBody = (g,o) => { for(let i=0;i<7;i++){ const a=i/7*6.28+o; px(g,7+Math.round(Math.cos(a)*4),7+Math.round(Math.sin(a)*4),2,2,"#3a7a5c"); }
    px(g,4,4,6,6,"#5aa87a"); px(g,5,5,4,4,"#8fe0c0"); px(g,6,6,2,2,"#c8f0e0"); px(g,5,6,1,1,"#2a4a3e"); px(g,8,7,1,1,"#2a4a3e"); };
  mkSpr("gloamtangle_0", 14, 14, g => gtBody(g,0));
  mkSpr("gloamtangle_1", 14, 14, g => gtBody(g,0.6));
  const tgBody = (g,o) => { px(g,2,2,6,6,"#5aa87a"); px(g,3,3,4,4,"#8fe0c0"); px(g,4,4,2,2,"#c8f0e0");
    px(g,3,4,1,1,"#2a4a3e"); px(g,6,5,1,1,"#2a4a3e");
    for(let i=0;i<4;i++){ const a=i/4*6.28+o; px(g,5+Math.round(Math.cos(a)*3),5+Math.round(Math.sin(a)*3),1,1,"#3a7a5c"); } };
  mkSpr("tanglet_0", 10, 10, g => tgBody(g,0));
  mkSpr("tanglet_1", 10, 10, g => tgBody(g,0.8));
  // The Great Knot — a big gnarled boss whorl, a low ember in its deep heart, two cold glints for eyes.
  const gkBody = g => { px(g,3,4,16,15,"#2c2318"); px(g,3,4,16,1,"#4a3c2c"); px(g,5,6,12,11,"#3c3020"); px(g,7,8,8,7,"#2c2318");
    px(g,9,9,4,4,"#1a140e"); px(g,10,10,2,2,"#6a4a2a");
    px(g,2,8,2,5,"#4a3c2c"); px(g,18,8,2,5,"#4a3c2c"); px(g,8,2,5,2,"#4a3c2c");
    px(g,6,7,1,1,"#8fd0ff"); px(g,15,7,1,1,"#8fd0ff");
    px(g,4,18,2,3,"#2c2318"); px(g,10,18,2,3,"#2c2318"); px(g,16,18,2,3,"#2c2318"); };
  mkSpr("greatknot_0", 22, 22, g => { gkBody(g); px(g,10,10,1,1,"#ffb060"); });
  mkSpr("greatknot_1", 22, 22, g => { gkBody(g); px(g,10,10,2,2,"#ffc880"); });   // the heart-ember pulses

  // ==== v4.1 deep item icons ====
  mkSpr("item_Warden's Ash", 16, 16, g => { px(g,4,10,8,3,"#6a7290"); px(g,5,8,6,3,"#8a94b0"); px(g,6,7,4,2,"#a2acc8");
    px(g,5,6,1,1,"#c8cfe0"); px(g,8,5,1,1,"#c8cfe0"); px(g,10,7,1,1,"#dfe6f4"); px(g,7,9,1,1,"#454a5e"); });
  mkSpr("item_Snarlthread", 16, 16, g => { for(let i=0;i<10;i++){ const a=i/10*6.28; px(g,8+Math.round(Math.cos(a*2)*4),8+Math.round(Math.sin(a*1.5)*4),1,1,"#3a7a5c"); }
    px(g,6,6,4,4,"#5aa87a"); px(g,7,7,2,2,"#8fe0c0"); px(g,5,8,1,1,"#8fe0c0"); px(g,10,7,1,1,"#8fe0c0"); });
  mkSpr("item_Heartknot", 16, 16, g => { px(g,4,4,8,9,"#2c2318"); px(g,4,4,8,1,"#4a3c2c"); px(g,6,6,4,5,"#3c3020");
    px(g,7,7,2,3,"#1a140e"); px(g,7,8,1,1,"#ffb060"); px(g,5,5,1,1,"#8fd0ff"); px(g,9,10,1,1,"#8fd0ff"); });
  mkSpr("item_Wardstone Charm", 16, 16, g => { px(g,5,6,6,6,"#2c2318"); px(g,6,7,4,4,"#6a4a2a"); px(g,7,8,2,2,"#1a140e");
    px(g,6,4,4,2,"#3a6ad0"); px(g,7,4,2,1,"#9fc4ff"); for(let i=0;i<8;i++) px(g,4+i,13,1,1,"#8a94b0"); });
  mkSpr("item_Settler's Band", 16, 16, g => { for(let i=0;i<10;i++) px(g,3+i,8+Math.round(Math.sin(i*0.9)*2),1,1,"#3a7a5c");
    for(let i=0;i<10;i++) px(g,3+i,7+Math.round(Math.sin(i*0.9+1.5)*2),1,1,"#5aa87a"); px(g,4,8,1,1,"#8fe0c0"); px(g,11,7,1,1,"#8fe0c0"); });

  // ==== v4.2 deep families 6–7 + the deepest icons ====
  // Deep Knot — a dark violet knuckle of near-stone wood; a charger.
  const dkBody = g => { px(g,3,4,10,10,"#2a2038"); px(g,3,4,10,1,"#4a3c5e"); px(g,5,6,6,6,"#3a2e4e"); px(g,6,7,4,4,"#2a2038");
    px(g,7,8,2,2,"#1a1428"); px(g,4,10,2,2,"#5a4a6a"); px(g,10,6,2,2,"#5a4a6a"); px(g,5,6,1,1,"#b8a8ff"); px(g,9,7,1,1,"#b8a8ff"); };
  mkSpr("deepknot_0", 16, 16, g => { dkBody(g); px(g,5,13,2,3,"#2a2038"); px(g,9,13,2,3,"#2a2038"); });
  mkSpr("deepknot_1", 16, 16, g => { dkBody(g); px(g,6,13,2,3,"#2a2038"); px(g,8,13,2,3,"#2a2038"); });
  // Star-Gnarl — a star-touched gnarl with a bright violet-white core; the ranged one.
  const sgBody = g => { px(g,3,5,8,9,"#3a2e5e"); px(g,3,5,8,1,"#5a4a8a"); px(g,4,6,6,6,"#4a3a7a");
    px(g,6,7,2,3,"#c8b8ff"); px(g,6,7,2,1,"#e8dcff"); px(g,4,6,1,1,"#e8dcff"); px(g,9,7,1,1,"#e8dcff");
    px(g,2,8,1,1,"#c8b8ff"); px(g,11,9,1,1,"#c8b8ff"); px(g,5,3,1,1,"#e8dcff"); };
  mkSpr("stargnarl_0", 14, 16, g => { sgBody(g); px(g,5,14,2,2,"#3a2e5e"); px(g,8,14,2,2,"#3a2e5e"); });
  mkSpr("stargnarl_1", 14, 16, g => { sgBody(g); px(g,4,14,2,2,"#3a2e5e"); px(g,9,14,2,2,"#3a2e5e"); px(g,7,2,1,1,"#e8dcff"); });

  mkSpr("item_Deepgnarl", 16, 16, g => { px(g,4,4,8,9,"#2a2038"); px(g,4,4,8,1,"#4a3c5e"); px(g,6,6,4,5,"#3a2e4e");
    px(g,7,7,2,3,"#1a1428"); px(g,5,5,1,1,"#b8a8ff"); px(g,9,10,1,1,"#b8a8ff"); px(g,5,11,2,1,"#5a4a6a"); });
  mkSpr("item_Gloamstar", 16, 16, g => { px(g,7,3,2,10,"#c8b8ff"); px(g,3,7,10,2,"#c8b8ff"); px(g,6,6,4,4,"#e8dcff"); px(g,7,7,2,2,"#ffffff");
    for(let i=0;i<6;i++) px(g,3+((i*1.6)|0), 8+Math.round(Math.sin(i)*3), 1,1, "#5aa87a"); });
  mkSpr("item_Starward Charm", 16, 16, g => { px(g,4,5,8,8,"#2c2318"); px(g,5,6,6,6,"#3c3020"); px(g,6,6,4,4,"#c8b8ff"); px(g,7,7,2,2,"#ffffff");
    px(g,3,8,1,1,"#b8ecf7"); px(g,12,8,1,1,"#b8ecf7"); px(g,7,3,1,1,"#b8ecf7"); px(g,7,13,1,1,"#b8ecf7"); });
}

/* ---------------- terrain tiles ---------------- */
const GRASS_PAL = {
  Spring:{ b:"#6aab46", d:"#5c9a3c", l:"#75ba4f", bl:"#4f8a34", tip:"#7fbe55" },
  Summer:{ b:"#5aa03c", d:"#4a8a32", l:"#72c04c", bl:"#3d7a2c", tip:"#8ace60" },
  Fall:  { b:"#b39247", d:"#9a7a3a", l:"#c7a955", bl:"#8a6a2a", tip:"#d8bc6a" },
  Winter:{ b:"#e2e9f0", d:"#c6d2de", l:"#f2f7fb", bl:"#b4c2d2", tip:"#ffffff" },
};
function buildTiles(){
  // seasonal grass, flowers, tall grass
  for(const s of SEASONS){ const p = GRASS_PAL[s];
    for(let v=0; v<4; v++){
      mkSpr("grass_"+s+v, 16, 16, g => { seedRR(11 + v*7);
        px(g,0,0,16,16,p.b);
        for(let i=0;i<26;i++){ const x=rr()*16|0, y=rr()*16|0; px(g,x,y,1,1, rr()<.5?p.l:p.d); }
        for(let i=0;i<3;i++){ const x=rr()*14+1|0, y=rr()*12+2|0; px(g,x,y,1,2,p.bl); px(g,x,y-1,1,1,p.tip); }
        if(s==="Winter"){ for(let i=0;i<4;i++) px(g,rr()*15|0,rr()*15|0,2,1,"#ffffff"); }
      });
    }
    const fcols = s==="Spring" ? ["#ff7d9c","#ffd94a","#ffffff","#b98fd4"]
                : s==="Summer" ? ["#ff6a8a","#ffce5a","#6a9aff","#ffffff"]
                : s==="Fall"   ? ["#e0783a","#d8b04a","#c04a5a"] : null;
    mkSpr("flowergrass_"+s, 16, 16, g => { g.drawImage(spr["grass_"+s+"1"],0,0);
      if(fcols){ seedRR(91); for(let i=0;i<3;i++){ const x=rr()*12+2|0, y=rr()*12+2|0, c=pick(fcols);
        px(g,x,y,2,2,c); px(g,x,y,1,1,shade(c,1.2)); px(g,x+1,y+2,1,1,p.bl); } }
      else { seedRR(4); for(let i=0;i<3;i++) px(g,rr()*13|0,rr()*13|0,3,2,"#f2f7fc"); }   // winter snow clumps
    });
    mkSpr("tallgrass_"+s, 16, 16, g => { g.drawImage(spr["grass_"+s+"2"],0,0); seedRR(55);
      for(let i=0;i<7;i++){ const x=rr()*14+1|0, h=rr()*4+4|0; px(g,x,16-h,1,h,p.bl); px(g,x,16-h,1,2,p.tip); if(s==="Winter") px(g,x,16-h,1,1,"#ffffff"); }
    });
  }
  // frozen water overlay for winter
  mkSpr("ice", 16, 16, g => { px(g,0,0,16,16,"#bcd6e8"); px(g,0,0,16,16,"#bcd6e8");
    px(g,2,3,7,1,"#d8ecf5"); px(g,9,8,5,1,"#d8ecf5"); px(g,4,11,4,1,"#a8c4d8"); px(g,0,0,16,1,"#e8f4fb"); });

  mkSpr("dirt", 16, 16, g => { px(g,0,0,16,16,"#a97e4c");
    seedRR(7); for(let i=0;i<18;i++){ const x=rr()*16|0,y=rr()*16|0; px(g,x,y,1,1, rr()<.5?"#946a3d":"#b98d59"); } });

  // Tilled soil used to be full-width straight bands inside a 1px frame — from above, a field of it
  // read as dark lumber decking, not earth (a new player couldn't tell their plot was soil). Now the
  // furrows are BROKEN (notched shadow rows, scattered ridge highlights, clods), with no frame, so a
  // bed of tiles reads as turned earth in rows.
  mkSpr("tilled", 16, 16, g => {
    px(g,0,0,16,16,"#7d5a35");
    seedRR(11);
    for(let y=2;y<16;y+=4){
      for(let x=0;x<16;x++){ if(rr()>0.14) px(g,x,y,1,2,"#5e4326"); }        // furrow shadow, notched
      for(let x=0;x<16;x++){ if(rr()>0.45) px(g,x,y+2,1,1,"#94713f"); }      // sunlit ridge crest
    }
    for(let i=0;i<9;i++){ const x=rr()*16|0, y=rr()*16|0; px(g,x,y,1,1, rr()<.5?"#6b4c2a":"#8f6a3e"); }  // clods
  });
  mkSpr("watered", 16, 16, g => {
    px(g,0,0,16,16,"#57401f");
    seedRR(11);                                                              // same furrow layout as tilled — watering darkens, doesn't rearrange
    for(let y=2;y<16;y+=4){
      for(let x=0;x<16;x++){ if(rr()>0.14) px(g,x,y,1,2,"#3f2e16"); }
      for(let x=0;x<16;x++){ if(rr()>0.45) px(g,x,y+2,1,1,"#6a5230"); }
    }
    seedRR(3); for(let i=0;i<10;i++){ const x=rr()*16|0,y=rr()*16|0; px(g,x,y,1,1,"#6b83a0"); }  // wet glints
  });

  // water — 3 shimmer frames
  for(let f=0; f<3; f++){
    mkSpr("water"+f, 16, 16, g => {
      px(g,0,0,16,16,"#3f7fbf");
      px(g,0,0,16,16,"#3f7fbf");
      // subtle vertical banding
      for(let y=0;y<16;y+=4) px(g,0,y,16,1,"#3a76b0");
      seedRR(20+f*13);
      for(let i=0;i<4;i++){ const x=(rr()*12|0), y=(rr()*12|0); px(g,x,y,3,1,"#7fbce8"); }
      px(g, (2+f*4)%14, (3+f*3)%13, 4,1,"#a9d8f5");
    });
  }
  mkSpr("sand", 16, 16, g => { px(g,0,0,16,16,"#e2cd8e"); seedRR(9);
    for(let i=0;i<12;i++){ const x=rr()*16|0,y=rr()*16|0; px(g,x,y,1,1,"#ceb474"); } });

  // path (dirt road) variants
  for(let v=0; v<2; v++){
    mkSpr("path"+v, 16, 16, g => { px(g,0,0,16,16,"#c7ac7a"); seedRR(31+v);
      for(let i=0;i<8;i++){ const x=rr()*13|0,y=rr()*13|0,s=rr()*3+2|0; px(g,x,y,s,s-1,"#b89a68"); }
      for(let i=0;i<6;i++){ px(g,rr()*16|0,rr()*16|0,1,1,"#d8c090"); } });
  }
  mkSpr("bridge", 16, 16, g => { px(g,0,0,16,16,"#8a6238");
    for(let x=0;x<16;x+=5){ px(g,x,0,1,16,"#6e4a2a"); } px(g,0,0,16,2,"#a0774a"); px(g,0,14,16,2,"#5e4426"); });

  // house — log wall, roof, door, floor, rug, bed
  mkSpr("wall", 16, 16, g => { px(g,0,0,16,16,"#b98d5a");
    for(let y=0;y<16;y+=4){ px(g,0,y,16,1,"#8a6238"); }
    px(g,0,0,16,1,"#d0a878"); px(g,0,0,1,16,"#a07a4a"); px(g,15,0,1,16,"#8a6238");
  });
  mkSpr("wall_win", 16, 16, g => { g.drawImage(spr.wall,0,0);
    px(g,3,4,10,8,"#2a3a4a"); px(g,4,5,8,6,"#7fb0d8"); px(g,8,5,1,6,"#5a4130"); px(g,4,8,8,1,"#5a4130");
    px(g,3,3,10,1,"#6e4a2a"); px(g,3,12,10,1,"#6e4a2a"); });
  mkSpr("wall_win_lit", 16, 16, g => { g.drawImage(spr.wall,0,0);
    px(g,3,4,10,8,"#2a3a4a"); px(g,4,5,8,6,"#ffd98a"); px(g,8,5,1,6,"#c99a4a"); px(g,4,8,8,1,"#c99a4a");
    px(g,3,3,10,1,"#6e4a2a"); px(g,3,12,10,1,"#6e4a2a"); });
  mkSpr("roof", 16, 16, g => { px(g,0,0,16,16,"#b7472f");
    for(let y=0;y<16;y+=4){ px(g,0,y,16,2,"#9a3a25"); px(g,0,y+2,16,1,"#c85a40"); }
    px(g,0,0,16,2,"#d86a4a"); });
  mkSpr("roof_top", 16, 16, g => { g.drawImage(spr.roof,0,0); px(g,0,0,16,3,"#6e2a1a"); px(g,0,0,16,1,"#8a3a25"); });
  mkSpr("door", 16, 16, g => { g.drawImage(spr.wall,0,0);
    px(g,3,2,10,14,"#6e4a2a"); px(g,4,3,8,13,"#8a5f38"); px(g,4,3,8,1,"#a0774a"); px(g,8,3,1,13,"#6e4a2a");
    px(g,10,9,2,2,"#ffd75a"); });
  mkSpr("floor", 16, 16, g => { px(g,0,0,16,16,"#caa06a");
    for(let y=0;y<16;y+=8) px(g,0,y,16,1,"#a8834f");
    px(g,4,0,1,8,"#a8834f"); px(g,11,8,1,8,"#a8834f"); px(g,0,7,16,1,"#b58d5a"); });
  mkSpr("rug", 16, 16, g => { g.drawImage(spr.floor,0,0);
    px(g,2,2,12,12,"#8a4a5e"); px(g,3,3,10,10,"#b3647a"); px(g,5,5,6,6,"#d98aa0"); px(g,2,2,12,1,"#6e3a4a"); });
  mkSpr("bed", 16, 16, g => { px(g,1,1,14,15,"#7a3a3a");
    px(g,2,6,12,9,"#c05a5a"); px(g,2,2,12,4,"#f0ead8"); px(g,3,3,5,2,"#d8cfb8");
    px(g,2,14,12,2,"#8a4a4a"); px(g,1,1,14,1,"#5e2a2a"); px(g,2,6,12,1,"#e07a7a"); });

  mkSpr("fence", 16, 16, g => { px(g,1,4,2,10,"#8a6238"); px(g,13,4,2,10,"#8a6238");
    px(g,0,6,16,2,"#a0774a"); px(g,0,10,16,2,"#8a6238"); px(g,1,4,2,1,"#b98d5a"); px(g,13,4,2,1,"#b98d5a"); });
}

/* ---------------- crops ---------------- */
function buildCrops(){
  for(const id in CROPS){
    const c = CROPS[id], [stalk, leaf, fruit, fruitHi] = c.pal;
    for(let s=0; s<4; s++){
      mkSpr("crop_"+id+"_"+s, 16, 16, g => {
        // little soil mound
        px(g,5,13,6,2, "#5e4527"); px(g,6,14,4,1,"#4f3a21");
        if(s===0){ px(g,7,10,2,3,leaf); px(g,6,10,1,1,stalk); px(g,9,10,1,1,stalk); return; }
        drawCrop(g, c.shape, s, stalk, leaf, fruit, fruitHi);
      });
    }
  }
}
function drawCrop(g, shape, s, stalk, leaf, fruit, fruitHi){
  const grown = s === 3;
  if(shape === "tall"){ // corn
    const h = s===1?6:s===2?9:12;
    px(g,7,14-h,2,h,stalk);
    px(g,5,14-h+2,2,3,leaf); px(g,9,14-h+1,2,3,leaf);
    px(g,4,14-h+5,3,3,leaf); px(g,9,14-h+4,3,3,leaf);
    if(grown){ px(g,8,14-h+1,3,6,fruit); px(g,9,14-h+2,1,4,fruitHi); px(g,8,14-h,2,2,leaf); }
    return;
  }
  if(shape === "gourd"){ // pumpkin
    px(g,7,7,2,6,stalk); px(g,5,7,3,2,leaf); px(g,9,6,3,2,leaf);
    if(s>=2){ const r = s===2?3:5; const cx=8, cy=13;
      px(g,cx-r,cy-r+1,r*2,r*2-1,fruit); px(g,cx-r-1,cy-r+2,1,r*2-3,fruit);
      px(g,cx+r,cy-r+2,1,r*2-3,fruit); px(g,cx-r+1,cy-r,1,2,stalk);
      if(grown){ px(g,cx-1,cy-r+1,1,r*2-2,shade(fruit,.8)); px(g,cx-r+1,cy-r+2,2,2,fruitHi); } }
    return;
  }
  if(shape === "star"){ // starfruit
    const cx=8, cy=6;
    px(g,7,6,2,8,stalk); px(g,5,7,2,2,leaf); px(g,9,8,2,2,leaf);
    if(grown){
      px(g,cx-1,cy-3,2,7,fruit); px(g,cx-3,cy,7,2,fruit);
      px(g,cx-2,cy-2,1,1,fruit); px(g,cx+1,cy-2,1,1,fruit); px(g,cx-2,cy+2,1,1,fruit); px(g,cx+1,cy+2,1,1,fruit);
      px(g,cx-1,cy-1,2,2,fruitHi); px(g,cx,cy-3,1,1,"#ffffff");
    } else if(s===2){ px(g,6,7,3,3,leaf); px(g,9,6,3,3,leaf); }
    return;
  }
  if(shape === "bush"){ // strawberry
    px(g,6,9,4,5,stalk);
    px(g,3,8,5,4,leaf); px(g,8,7,5,4,leaf); px(g,5,6,6,3,leaf);
    if(grown){ px(g,4,11,2,2,fruit); px(g,10,10,2,2,fruit); px(g,7,12,2,2,fruit);
      px(g,4,11,1,1,fruitHi); px(g,10,10,1,1,fruitHi); }
    else if(s===2){ px(g,5,9,2,2,shade(fruit,.7)); }
    return;
  }
  // root (turnip/potato/carrot) — leafy top, fruit peeks at soil
  const lh = s===1?4:6;
  px(g,7,13-lh,2,lh,stalk);
  px(g,4,13-lh,3,3,leaf); px(g,9,13-lh-1,3,3,leaf); px(g,6,13-lh-2,4,3,leaf);
  if(s>=2){ px(g,6,12,4,3,fruit); px(g,6,12,4,1,fruitHi); if(grown){ px(g,5,13,6,2,fruit); px(g,5,13,1,1,fruitHi); } }
}

/* ---------------- trees & stumps ---------------- */
const TREE_FOLIAGE = {
  oak:   { Spring:["#3f8a3f","#57ad57","#2f6a2f"], Summer:["#37803a","#4fa050","#286028"], Fall:["#c07030","#e0a048","#9a5220"], Winter:null },
  pine:  { Spring:["#2f6a52","#3f8f6a","#204a3a"], Summer:["#2f6a52","#3f8f6a","#204a3a"], Fall:["#356a4a","#4a8a62","#244a34"], Winter:["#2f6a52","#3f8f6a","#204a3a"] },
  maple: { Spring:["#b8683a","#d68a52","#8a4a28"], Summer:["#4a8a3a","#66b052","#367028"], Fall:["#d05a2a","#f08a3a","#a03a1a"], Winter:null },
  willow:    { Spring:["#4a8a4a","#6ab86a","#3a6a3a"], Summer:["#428242","#5cac5c","#326232"], Fall:["#a89a3a","#c8ba52","#7a6e28"], Winter:null },
  elderwood: { Spring:["#2c5a6a","#3f7a8a","#1e4250"], Summer:["#2c5a6a","#3f7a8a","#1e4250"], Fall:["#2c5a6a","#3f7a8a","#1e4250"], Winter:["#2c5a6a","#3f7a8a","#1e4250"] },   // evergreen, like pine
  heartwood: { Spring:["#5a9a7a","#7ac8a0","#3f7a5c"], Summer:["#5a9a7a","#7ac8a0","#3f7a5c"], Fall:["#5a9a7a","#7ac8a0","#3f7a5c"], Winter:["#5a9a7a","#7ac8a0","#3f7a5c"] },   // it doesn't sleep
  silverwood: { Spring:["#8aa0ac","#b8ccd6","#647680"], Summer:["#8aa0ac","#b8ccd6","#647680"], Fall:["#8aa0ac","#b8ccd6","#647680"], Winter:["#9ab0bc","#cad8e0","#6a7c88"] },   // pale silver foliage, brightening in the snow (v3.10)
};
function buildTrees(){
  for(const id in TREES){
    for(const s of SEASONS) mkSpr(id+"_"+s, 20, 32, g => drawTree(g, id, TREE_FOLIAGE[id][s], s));
    spr[id] = spr[id+"_Spring"];
  }
  mkSpr("stump", 16, 16, g => { px(g,5,9,6,5,"#6e4a2a"); px(g,5,9,6,2,"#8a5f38"); px(g,6,10,4,2,"#a0774a");
    px(g,7,11,2,1,"#6e4a2a"); px(g,4,13,8,2,"#5a3a20"); });
}
function drawTree(g, id, pal, season){
  px(g,8,20,4,11,"#6e4a2a"); px(g,8,20,1,11,"#5a3a20"); px(g,11,20,1,11,"#4f341c"); px(g,6,30,8,2,"#5a3a20");
  if(!pal){ // bare winter (oak/maple)
    px(g,9,13,1,7,"#6e4a2a"); px(g,6,14,3,1,"#5a3a20"); px(g,11,12,3,1,"#5a3a20");
    px(g,8,10,1,4,"#6e4a2a"); px(g,10,9,3,1,"#5a3a20"); px(g,5,12,3,1,"#5a3a20");
    px(g,4,11,4,1,"#ffffff"); px(g,10,9,4,1,"#eef4fb"); px(g,7,8,3,1,"#ffffff");
    return;
  }
  const [c1,c2,c3] = pal;
  if(id === "pine" || id === "elderwood"){
    px(g,4,12,12,9,c1); px(g,2,17,16,5,c3); px(g,6,6,8,9,c1); px(g,7,2,6,7,c2); px(g,9,0,2,4,c2);
    px(g,7,8,2,2,shade(c1,1.2)); px(g,10,14,2,2,shade(c1,1.2));
    if(id === "elderwood"){ px(g,5,15,2,1,"#8ab8c8"); px(g,12,10,2,1,"#8ab8c8"); px(g,8,5,1,1,"#a8d0e0"); }   // silver-blue needle sheen
    if(season==="Winter" && id==="pine"){ px(g,6,6,8,2,"#eef4fb"); px(g,4,12,12,2,"#e2ecf5"); px(g,8,2,4,2,"#ffffff"); }
  } else if(id === "willow"){
    // the weeper: a high crown that spills in strands past the trunk
    px(g,4,4,12,7,c2); px(g,2,7,16,5,c1);
    for(let i=0;i<6;i++){ const x=2+i*3; px(g,x,10,2,7+((i*7)%4),c1); px(g,x,10,1,5,c3); }
    px(g,6,5,4,2,shade(c2,1.15)); px(g,13,8,2,2,shade(c1,1.2));
  } else {
    px(g,3,7,14,14,c1); px(g,1,10,18,8,c1); px(g,5,3,10,7,c2); px(g,4,16,12,5,c3);
    px(g,6,5,4,3,c2); px(g,12,8,3,3,shade(c1,1.2)); px(g,5,12,3,3,shade(c1,1.2));
    if(id === "maple" && season !== "Winter"){ px(g,4,9,2,2,"#ffd75a"); px(g,13,13,2,2,"#ffb04a"); px(g,9,6,2,2,"#ffd75a"); }
    if(id === "heartwood"){ px(g,8,20,4,11,"#c9b8a0"); px(g,8,20,1,11,"#e0d4c0");   // repaint the trunk pale
      px(g,5,8,2,2,"#b0ffd8"); px(g,12,12,2,2,"#b0ffd8"); px(g,8,5,2,2,"#d8fff0"); }  // the glints
  }
}

/* ---------------- rocks / ore ---------------- */
function buildRocks(){
  for(const id in ORES){
    const o = ORES[id];
    mkSpr(id, 16, 16, g => {
      px(g,3,7,10,7,"#8a8a8a"); px(g,2,9,12,5,"#7d7d7d"); px(g,4,4,8,4,"#9a9a9a"); px(g,5,3,5,2,"#a8a8a8");
      px(g,3,13,11,2,"#5f5f5f"); px(g,4,4,3,2,"#b4b4b4");
      if(o.gem){ px(g,5,8,2,2,o.gem); px(g,9,10,2,2,o.gem); px(g,10,6,1,1,shade(o.gem,1.3));
        px(g,6,11,1,1,o.gem); px(g,5,8,1,1,shade(o.gem,1.4)); }
      // v3.42: the star vein GLOWS — white-hot cores in every fleck, and two more flecks than any
      // ordinary ore, so it never again reads as deepsilver's twin in a dark corridor
      if(id === "starmetal"){
        px(g,5,8,1,1,"#ffffff"); px(g,9,10,1,1,"#ffffff"); px(g,10,6,1,1,"#f0e6ff");
        px(g,7,5,1,1,o.gem); px(g,12,9,1,1,o.gem); px(g,7,12,1,1,shade(o.gem,1.2));
      }
    });
    mkSpr(id+"_cracked", 16, 16, g => { g.drawImage(spr[id],0,0);
      px(g,7,5,1,6,"#4a4a4a"); px(g,6,7,3,1,"#4a4a4a"); px(g,9,8,2,1,"#4a4a4a"); });
  }
}

/* ---------------- decor / props ---------------- */
function buildDecor(){
  mkSpr("bush", 16, 16, g => { px(g,2,6,12,9,"#3f7a2e"); px(g,4,4,8,5,"#5fa03e"); px(g,1,9,14,5,"#357028");
    px(g,5,6,3,2,"#6fb04a"); px(g,10,8,2,2,"#6fb04a"); });
  mkSpr("berrybush", 16, 16, g => { g.drawImage(spr.bush,0,0);
    seedRR(4); for(let i=0;i<5;i++){ const x=rr()*11+2|0,y=rr()*8+5|0; px(g,x,y,2,2,"#c03a5a"); px(g,x,y,1,1,"#ff7d9c"); } });
  // a working cart on re-laid rails
  mkSpr("railcart", 16, 16, g => {
    px(g,1,13,14,1,"#6a6256"); px(g,2,14,2,2,"#4a453c"); px(g,12,14,2,2,"#4a453c");   // rail + wheels
    px(g,2,6,12,7,"#7a4f30"); px(g,2,6,12,1,"#9a6a44"); px(g,2,12,12,1,"#5e3c24");
    px(g,3,7,10,4,"#4a3020");                                                          // dark interior
    px(g,4,7,3,2,"#9a9a9a"); px(g,9,8,3,2,"#c77b3f");                                  // ore inside
    px(g,1,6,1,7,"#8a5f38"); px(g,14,6,1,7,"#8a5f38");
  });
  // a plank gate onto the coast boardwalk
  mkSpr("boardwalk", 16, 18, g => {
    px(g,1,10,14,8,"#a5763f"); for(let x=1;x<15;x+=3) px(g,x,10,1,8,"#8a5f38");        // planks
    px(g,1,10,14,1,"#c49a68");
    px(g,2,2,2,9,"#6e4a2a"); px(g,12,2,2,9,"#6e4a2a");                                 // posts
    px(g,1,3,14,2,"#8a5f38"); px(g,1,3,14,1,"#a5763f");                                // rail
    px(g,6,5,4,3,"#e8d9a8"); px(g,7,6,2,1,"#8a7a62");                                  // little sign: ↓ coast
  });
  // the town fountain
  mkSpr("fountain", 16, 18, g => {
    px(g,1,10,14,7,"#9a9186"); px(g,1,10,14,1,"#b3aa9e"); px(g,1,16,14,1,"#6a6256");   // basin
    px(g,3,11,10,4,"#4f86b8"); px(g,3,11,10,1,"#6fa8d8");                              // water
    px(g,5,12,2,1,"#cfe6ff"); px(g,9,13,2,1,"#cfe6ff");
    px(g,7,3,2,8,"#9a9186"); px(g,6,2,4,2,"#b3aa9e");                                  // spout
    px(g,7,0,2,2,"#8fd3ff"); px(g,5,4,1,3,"#8fd3ff"); px(g,10,4,1,3,"#8fd3ff");        // arcs of water
  });
  // Rowan's ledger of unfinished valley work
  mkSpr("ledger", 16, 16, g => {
    px(g,3,4,10,10,"#7a4f30"); px(g,3,4,10,1,"#9a6a44");
    px(g,4,5,8,8,"#efe6d0"); px(g,5,7,6,1,"#8a7a62"); px(g,5,9,6,1,"#8a7a62"); px(g,5,11,4,1,"#8a7a62");
    px(g,12,4,1,10,"#5e3c24"); px(g,6,3,4,1,"#c03a3a");
  });

  // ---- the orchard ----
  // three stages per tree: a switch in the ground, a young crown, and a bearing tree
  for(const k in FRUIT_TREES){
    const t = FRUIT_TREES[k], [dark, leaf, fruit] = t.pal;
    mkSpr("sapling_"+k, 16, 16, g => {
      px(g,7,9,2,6,"#6e4a2a"); px(g,7,9,1,6,"#8a5f38");
      px(g,5,7,3,2,leaf); px(g,8,6,3,2,leaf); px(g,6,5,4,2,dark);
      px(g,3,14,10,1,"#5e4426");
    });
    mkSpr("tree_"+k+"_young", 16, 20, g => {
      px(g,7,12,2,8,"#6e4a2a"); px(g,7,12,1,8,"#8a5f38");
      px(g,4,5,8,7,dark); px(g,3,7,10,4,dark); px(g,5,4,6,2,leaf);
      px(g,5,6,4,3,leaf); px(g,9,8,2,2,leaf);
    });
    mkSpr("tree_"+k+"_bare", 16, 20, g => {
      px(g,7,10,2,10,"#6e4a2a"); px(g,7,10,1,10,"#8a5f38");
      px(g,4,7,3,1,"#6e4a2a"); px(g,9,6,3,1,"#6e4a2a"); px(g,5,4,2,3,"#6e4a2a"); px(g,10,4,1,3,"#6e4a2a");
      px(g,3,9,2,1,"#5e3f24"); px(g,11,9,2,1,"#5e3f24");
    });
    mkSpr("tree_"+k+"_full", 16, 20, g => {
      px(g,7,13,2,7,"#6e4a2a"); px(g,7,13,1,7,"#8a5f38");
      px(g,3,4,10,9,dark); px(g,2,6,12,5,dark); px(g,4,3,8,2,dark);
      px(g,4,5,5,4,leaf); px(g,9,6,3,3,leaf); px(g,5,4,3,1,leaf);
      seedRR(k.length*7); for(let i=0;i<6;i++){ const x=rr()*9+3|0, y=rr()*7+4|0;
        px(g,x,y,2,2,fruit); px(g,x,y,1,1,shade(fruit,1.35)); }
    });
  }
  mkSpr("beehive", 16, 18, g => {
    px(g,6,14,4,4,"#6e4a2a");                                   // the stand
    px(g,3,4,10,10,"#d8a83a"); px(g,3,4,10,1,"#e8c05a");        // the box
    for(let y=6;y<14;y+=3) px(g,3,y,10,1,"#a5793a");
    px(g,6,11,4,2,"#4a3420"); px(g,7,10,2,1,"#4a3420");         // the entrance
    px(g,2,3,12,2,"#8a5f38"); px(g,2,3,12,1,"#a5763f");         // the lid
    px(g,12,7,1,1,"#241a10"); px(g,13,8,1,1,"#ffd75a");         // a bee
  });
  // the Cellar, standing in the yard: a tapped barrel and a big preserves crock
  mkSpr("keg", 16, 18, g => {
    px(g,3,4,10,12,"#8a5f38"); px(g,3,4,10,1,"#a0774a"); px(g,3,15,10,1,"#5f4028");   // the barrel
    px(g,4,4,8,12,"#96693e");
    px(g,3,6,10,1,"#4a4550"); px(g,3,12,10,1,"#4a4550");                              // iron hoops
    px(g,7,9,2,3,"#3a2c1c"); px(g,7,9,2,1,"#ffd75a");                                 // the tap
    px(g,5,2,6,2,"#6e4a2a");                                                          // the bung board
  });
  mkSpr("jar", 16, 18, g => {
    px(g,4,6,8,10,"#c9b98e"); px(g,4,6,8,1,"#e0d3ac"); px(g,4,15,8,1,"#a3946c");      // the crock
    px(g,5,7,6,8,"#d4c49a");
    px(g,3,4,10,2,"#8a5f38"); px(g,3,4,10,1,"#a0774a");                               // wooden lid
    px(g,6,9,4,3,"#8a6a4a"); px(g,7,10,2,1,"#6e4a2a");                                // a tied label
  });
  mkSpr("item_Honey", 16, 16, g => {
    px(g,5,3,6,2,"#c9924a"); px(g,4,5,8,9,"#e8a83a"); px(g,4,5,8,1,"#ffd75a");
    px(g,5,7,6,5,"#f0c05a"); px(g,6,8,2,2,"#fff0b0"); px(g,4,13,8,1,"#a5793a");
  });
  for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k], [,leaf,fruit] = t.pal;
    mkSpr("item_"+t.fruit, 16, 16, g => {
      px(g,4,5,8,8,fruit); px(g,3,7,10,4,fruit); px(g,5,4,6,2,fruit);
      px(g,5,6,3,3,shade(fruit,1.35)); px(g,6,11,4,2,shade(fruit,.72));
      px(g,7,2,2,3,"#6e4a2a"); px(g,9,3,3,2,leaf);
    }); }

  // storm-wrack: a tangle of weed and rope thrown up the beach, with something glinting in it
  mkSpr("wrack", 16, 16, g => {
    px(g,2,10,12,4,"#3f5a3a"); px(g,1,12,14,2,"#33492f");
    px(g,4,8,3,3,"#4a6a44"); px(g,9,7,4,4,"#42603c"); px(g,6,9,5,2,"#557a4c");
    px(g,3,11,2,1,"#6a8a5a"); px(g,11,12,3,1,"#6a8a5a");
    px(g,7,11,2,2,"#e8e0d0"); px(g,7,11,1,1,"#ffffff");        // a shell, or a pearl
    px(g,12,10,2,1,"#a5763f"); px(g,13,11,1,2,"#8a5f38");      // a splinter of lost tackle
    px(g,5,13,1,1,"#ffd75a");
  });

  // the village noticeboard: two posts, a shingled board, pinned papers
  mkSpr("noticeboard", 16, 20, g => {
    px(g,2,14,2,6,"#6e4a2a"); px(g,12,14,2,6,"#6e4a2a");        // posts
    px(g,1,2,14,13,"#8a5f38"); px(g,1,2,14,1,"#a5763f");        // board
    px(g,1,14,14,1,"#5e3f24");
    px(g,0,1,16,2,"#6e4a2a"); px(g,0,1,16,1,"#8a6647");         // little roof
    px(g,3,5,4,5,"#efe6d0"); px(g,4,6,2,1,"#8a7a62"); px(g,4,8,3,1,"#8a7a62");   // pinned notes
    px(g,9,4,4,6,"#f4ecd8"); px(g,10,6,2,1,"#8a7a62"); px(g,10,8,2,1,"#8a7a62");
    px(g,3,11,3,3,"#e0d6bc"); px(g,4,4,1,1,"#c03a3a"); px(g,10,3,1,1,"#c03a3a");  // pins
  });

  // a bare winter bush hung with pale blue berries
  mkSpr("frostberry", 16, 16, g => {
    px(g,4,8,8,6,"#4a5a62"); px(g,3,10,10,3,"#54656e"); px(g,5,7,6,2,"#5e7078");
    px(g,4,8,8,1,"#7a8e98");
    seedRR(9); for(let i=0;i<6;i++){ const x=rr()*11+2|0,y=rr()*7+6|0;
      px(g,x,y,2,2,"#7fb8d8"); px(g,x,y,1,1,"#d8f0ff"); }
    px(g,2,13,12,1,"#ffffff");                       // a rime of frost at the base
  });
  mkSpr("sign", 16, 16, g => { px(g,7,8,2,7,"#6e4a2a"); px(g,3,3,10,6,"#a0774a"); px(g,3,3,10,1,"#c49a68");
    px(g,4,5,8,1,"#6e4a2a"); px(g,4,7,6,1,"#6e4a2a"); });
  mkSpr("chest", 16, 16, g => { px(g,3,7,10,7,"#8a5f38"); px(g,3,7,10,3,"#a0774a"); px(g,3,9,10,1,"#5e4426");
    px(g,7,9,2,3,"#ffd75a"); px(g,2,7,12,1,"#6e4a2a"); px(g,2,13,12,1,"#5e4426"); });
  mkSpr("shipbin", 16, 16, g => { px(g,2,5,12,10,"#7a5c42"); px(g,2,5,12,3,"#9a7350"); px(g,2,8,12,1,"#5e4426");
    px(g,3,9,10,5,"#3a2c1c"); px(g,2,14,12,1,"#5e4426"); px(g,4,3,8,2,"#8a6238"); });
  // shop stall
  mkSpr("stall", 24, 24, g => {
    px(g,2,10,20,12,"#8a6238"); px(g,2,10,20,2,"#a0774a"); px(g,3,20,2,3,"#5e4426"); px(g,19,20,2,3,"#5e4426");
    px(g,1,4,22,6,"#c05050"); for(let x=1;x<23;x+=4) px(g,x,4,2,6,"#f0ead8");
    px(g,0,3,24,2,"#6e4a2a"); px(g,4,12,16,7,"#3a2c1c");
    px(g,5,13,4,3,"#8fd06a"); px(g,10,13,4,3,"#ff9438"); px(g,15,13,4,3,"#ff4d55"); // produce
    px(g,5,17,14,1,"#ffd75a");
  });
  function campfire(g, ht){
    // stone ring
    px(g,2,12,3,2,"#8a8a8a"); px(g,6,13,4,2,"#7d7d7d"); px(g,11,12,3,2,"#9a9a9a");
    px(g,2,12,3,1,"#a8a8a8"); px(g,11,12,3,1,"#a8a8a8");
    // crossed logs
    px(g,3,11,10,2,"#6e4a2a"); px(g,4,11,8,1,"#8a5f38");
    px(g,7,10,2,4,"#5a3a20");
    // flame (tapered)
    const b = 13 - ht;
    px(g,6,b,4,ht,"#ff5a2a"); px(g,7,b-2,2,ht,"#ff9138");
    px(g,7,b+1,2,ht-2,"#ffd75a"); px(g,7,b-1,1,3,"#fff0a0");
    px(g,5,b+2,1,2,"#ff7a3a"); px(g,10,b+1,1,2,"#ff7a3a");
  }
  mkSpr("campfire0", 16, 16, g => campfire(g, 8));
  mkSpr("campfire1", 16, 16, g => campfire(g, 7));
}

/* ---------------- characters (articulated rig) ---------------- */
const CHAR_SPEC = {
  player: { skin:"#eec39a", skinSh:"#d8a878", hair:"#7a4a2a", hairSh:"#5e3a1f", shirt:"#4a86c0", shirtSh:"#356a9e", pants:"#5e4426", pantsSh:"#463320", shoe:"#3a2a1a" },
  maya:   { skin:"#eec39a", skinSh:"#d8a878", hair:"#a8503a", hairSh:"#82392a", shirt:"#5a9e6a", shirtSh:"#3f7a4e", pants:"#3a3a5e", pantsSh:"#2a2a46", shoe:"#5a3a2a" },
  tom:    { skin:"#d8a878", skinSh:"#bd8e60", hair:"#5a4a3a", hairSh:"#403428", shirt:"#c0a068", shirtSh:"#9a7c4c", pants:"#4a3a2a", pantsSh:"#362a1e", shoe:"#3a2a1a" },
  rowan:  { skin:"#e0bd94", skinSh:"#c49a6a", hair:"#dcdcdc", hairSh:"#b2b2b2", shirt:"#4a3f72", shirtSh:"#352c54", pants:"#3a3352", pantsSh:"#2a2540", shoe:"#3a2a1a" },
  bram:   { skin:"#c99a6a", skinSh:"#a87e50", hair:"#2e2622", hairSh:"#1c1714", shirt:"#3f88a0", shirtSh:"#2c6072", pants:"#4a4238", pantsSh:"#352f28", shoe:"#2a2018" },
  pip:    { skin:"#eec39a", skinSh:"#d8a878", hair:"#c98a3a", hairSh:"#a06a28", shirt:"#c0503a", shirtSh:"#9a3a2a", pants:"#3a5a8a", pantsSh:"#2a466e", shoe:"#3a2a1a" },
  // Maya's father: her auburn, gone grey at the edges; a ferryman's weathered coat
  elias:  { skin:"#dcae82", skinSh:"#b98c62", hair:"#8a6250", hairSh:"#66473a", shirt:"#6a7a8a", shirtSh:"#4c5a68", pants:"#413a33", pantsSh:"#2e2924", shoe:"#2a2018" },
  // v3.44 Nell, the coast dairy — Tom's wife: sandy hair under a red kerchief, a creamery apron
  nell:   { skin:"#e6bd90", skinSh:"#c69868", hair:"#c9a45a", hairSh:"#a0803a", shirt:"#cdd6dc", shirtSh:"#9aa6ae", pants:"#7a5636", pantsSh:"#5e4228", shoe:"#4a3020", kerch:"#b0483a" },
};
function buildChars(){
  for(const name in CHAR_SPEC){
    const sp = CHAR_SPEC[name];
    for(const face of ["down","up","side"]){
      for(let pose=0; pose<4; pose++){
        mkSpr(name+"_"+face+"_"+pose, 16, 22, g => drawChar(g, sp, face, pose));
      }
    }
  }
}
function drawChar(g, sp, face, pose){
  // pose: 0 stand, 1 stepA, 2 stepB, 3 swing
  const bob = (pose===1||pose===2) ? 0 : 0;         // subtle
  const y = 0;
  // legs
  const legY = 17;
  const lx = 5, rx = 8;
  let loff=0, roff=0;
  if(pose===1){ loff=1; roff=-1; } else if(pose===2){ loff=-1; roff=1; }
  px(g, lx, legY-Math.max(0,loff), 3, 4+Math.abs(loff), sp.pants); px(g, lx, legY+3, 3, 1, sp.shoe);
  px(g, rx, legY-Math.max(0,roff), 3, 4+Math.abs(roff), sp.pants); px(g, rx, legY+3, 3, 1, sp.shoe);
  px(g, lx, legY, 1, 3, sp.pantsSh); px(g, rx+2, legY, 1, 3, sp.pantsSh);
  // torso
  px(g, 4, 11, 8, 7, sp.shirt); px(g, 4, 11, 8, 1, shade(sp.shirt,1.15));
  px(g, 4, 11, 1, 7, sp.shirtSh); px(g, 11, 11, 1, 7, sp.shirtSh);
  // arms
  const swing = pose===3;
  if(face === "side"){
    // one arm visible forward
    px(g, 10, 12, 2, swing?3:5, sp.skin);
    if(swing){ px(g, 11, 10, 2, 3, sp.skin); }
  } else {
    px(g, 2, 12, 2, 5, sp.skin); px(g, 12, 12, 2, 5, sp.skin);
    if(swing){ px(g, 12, 9, 2, 4, sp.skin); }
  }
  // head
  px(g, 4, 3, 8, 8, sp.skin); px(g, 4, 3, 8, 1, shade(sp.skin,1.08));
  px(g, 4, 10, 8, 1, sp.skinSh);
  // hair + face by direction
  if(face === "down"){
    px(g, 3, 2, 10, 4, sp.hair); px(g, 3, 2, 2, 6, sp.hair); px(g, 11, 2, 2, 6, sp.hair);
    px(g, 3, 2, 10, 1, shade(sp.hair,1.2));
    px(g, 6, 6, 1, 2, "#241a10"); px(g, 9, 6, 1, 2, "#241a10");   // eyes
    px(g, 7, 9, 2, 1, "#c07a6a");                                  // mouth
  } else if(face === "up"){
    px(g, 3, 2, 10, 8, sp.hair); px(g, 3, 2, 10, 1, shade(sp.hair,1.2)); px(g, 4, 8, 8, 1, sp.hairSh);
  } else { // side (faces right)
    px(g, 3, 2, 9, 4, sp.hair); px(g, 3, 2, 2, 7, sp.hair);
    px(g, 3, 2, 9, 1, shade(sp.hair,1.2));
    px(g, 9, 6, 1, 2, "#241a10");                                  // eye
    px(g, 11, 7, 1, 1, sp.skinSh);                                 // nose
    px(g, 10, 9, 2, 1, "#c07a6a");
  }
  // tom: mustache + rounder; maya: braid + freckles
  if(sp === CHAR_SPEC.tom && face==="down"){ px(g,6,8,4,1,sp.hairSh); }
  if(sp === CHAR_SPEC.maya && face==="down"){ px(g,3,5,2,5,sp.hair); px(g,5,6,1,1,sp.skinSh); px(g,10,6,1,1,sp.skinSh); }
  if(sp === CHAR_SPEC.nell){ px(g,4,2,8,3,sp.kerch); px(g,4,2,8,1,shade(sp.kerch,1.2)); }   // v3.44: the red kerchief reads from every facing
}

/* ---------------- item icons ---------------- */
function buildItems(){
  // seed packet base, tinted per crop fruit color
  for(const id in CROPS){
    const c = CROPS[id];
    mkSpr("item_"+c.name+" Seeds", 16, 16, g => {
      px(g,4,3,8,11,"#d8c39a"); px(g,4,3,8,1,"#efe0bd"); px(g,4,13,8,1,"#b39a6e");
      px(g,5,4,6,4,c.pal[2]); px(g,6,9,1,1,c.pal[0]); px(g,9,10,1,1,c.pal[0]); px(g,7,11,1,1,c.pal[0]);
    });
    // harvested produce icon
    mkSpr("item_"+c.name, 16, 16, g => drawProduce(g, c));
  }
  // the Cellar's products: a corked bottle (wine) and a lidded crock (jam), tinted per growable
  const artisanFor = (name, tint) => {
    mkSpr("item_"+name+" Wine", 16, 16, g => {
      px(g,6,1,4,3,"#7a5634"); px(g,7,0,2,1,"#5a3f26");                 // cork
      px(g,5,4,6,2,shade(tint,0.8)); px(g,4,6,8,9,tint);                // neck + body
      px(g,4,6,8,1,shade(tint,1.25)); px(g,5,14,6,1,shade(tint,0.6));
      px(g,5,8,2,4,"rgba(255,255,255,0.35)");                          // glass shine
    });
    mkSpr("item_"+name+" Jam", 16, 16, g => {
      px(g,4,4,8,10,tint); px(g,4,4,8,1,shade(tint,1.3)); px(g,4,13,8,1,shade(tint,0.6));  // the jar
      px(g,3,2,10,3,"#e8dcc0"); px(g,3,2,10,1,"#f6eeda"); px(g,5,3,1,1,"#c9b98e");         // cloth lid
      px(g,5,8,2,3,"rgba(255,255,255,0.3)");                                                // glass shine
    });
  };
  for(const id in CROPS) artisanFor(CROPS[id].name, CROPS[id].pal[2]);
  for(const k in FRUIT_TREES) artisanFor(FRUIT_TREES[k].fruit, FRUIT_TREES[k].pal[2]);
  // the machines as carried items
  mkSpr("item_Keg", 16, 16, g => {
    px(g,3,3,10,11,"#8a5f38"); px(g,3,3,10,1,"#a0774a"); px(g,3,13,10,1,"#5f4028");
    px(g,3,5,10,1,"#4a4550"); px(g,3,11,10,1,"#4a4550");               // hoops
    px(g,7,8,2,2,"#3a2c1c"); px(g,7,8,2,1,"#ffd75a");                  // the little tap
  });
  mkSpr("item_Preserves Jar", 16, 16, g => {
    px(g,4,5,8,9,"#c9b98e"); px(g,4,5,8,1,"#e0d3ac"); px(g,4,13,8,1,"#a3946c");
    px(g,3,3,10,2,"#8a5f38"); px(g,3,3,10,1,"#a0774a");                // wooden lid
  });
  // wood, ores, stone, fish
  const woodCols = { "Wood":"#a0774a", "Pine Wood":"#8a9a7a", "Maple Wood":"#c08a5a",
    "Willow Wood":"#8ab06a", "Elder Wood":"#5a8a9a", "Heartwood":"#9ac8ae", "Silverwood":"#b8ccd6" };
  for(const w in woodCols){ mkSpr("item_"+w, 16, 16, g => {
    px(g,3,7,10,4,woodCols[w]); px(g,3,7,10,1,shade(woodCols[w],1.2)); px(g,3,10,10,1,shade(woodCols[w],.7));
    px(g,3,8,1,2,shade(woodCols[w],.6)); px(g,12,8,1,2,shade(woodCols[w],.6)); px(g,4,4,10,4,woodCols[w]); px(g,4,4,10,1,shade(woodCols[w],1.2)); }); }
  // v3.21 LUMBER — a neat stack of squared boards, tinted by its source species (vs the round raw log)
  for(const raw in WOOD_TO_LUMBER){ const c = woodCols[raw], lum = WOOD_TO_LUMBER[raw];
    mkSpr("item_"+lum, 16, 16, g => {
      px(g,3,5,10,2,c);            px(g,3,5,10,1,shade(c,1.25)); px(g,3,6,10,1,shade(c,.72));
      px(g,3,8,10,2,shade(c,.94)); px(g,3,8,10,1,shade(c,1.15)); px(g,3,9,10,1,shade(c,.68));
      px(g,3,11,10,2,c);           px(g,3,11,10,1,shade(c,1.2));  px(g,3,12,10,1,shade(c,.68));
      px(g,3,5,1,8,shade(c,.55));  px(g,12,5,1,8,shade(c,.55)); }); }   // sawn end-grain edges
  // the Sawmill, standing in the yard: a log on trestles under a bright circular blade
  mkSpr("sawmill", 16, 18, g => {
    px(g,2,13,12,2,"#7a5636"); px(g,2,12,12,1,"#96693e");                     // bench top
    px(g,3,15,2,3,"#5f4028"); px(g,11,15,2,3,"#5f4028");                      // legs
    px(g,3,9,7,3,"#a0774a"); px(g,3,9,7,1,shade("#a0774a",1.2)); px(g,3,10,1,1,"#5f4028");  // the log being cut
    px(g,9,3,6,6,"#c8ccd2"); px(g,10,4,4,4,"#e6e9ee"); px(g,11,5,2,2,"#8f97a0");            // steel blade + hub
    px(g,9,2,1,1,"#c8ccd2"); px(g,14,3,1,1,"#c8ccd2"); px(g,8,5,1,1,"#c8ccd2"); px(g,15,6,1,1,"#c8ccd2"); px(g,9,9,1,1,"#c8ccd2"); px(g,14,9,1,1,"#c8ccd2"); });  // teeth glints
  mkSpr("item_Sawmill", 16, 16, g => {
    px(g,2,6,10,4,"#c8ccd2"); px(g,2,6,10,1,"#e6e9ee");                        // blade
    px(g,2,10,1,1,"#9098a0"); px(g,4,10,1,1,"#9098a0"); px(g,6,10,1,1,"#9098a0"); px(g,8,10,1,1,"#9098a0"); px(g,10,10,1,1,"#9098a0");  // teeth
    px(g,11,4,3,5,"#8a5f38"); px(g,12,5,2,3,"#5f4028"); });                    // handle
  // v3.33 THE CHEESE PRESS — oak frame, iron screw, a wheel waiting under the plate
  mkSpr("press", 16, 18, g => {
    px(g,3,15,10,2,"#7a5636"); px(g,3,15,10,1,"#96693e");                      // base board
    px(g,3,4,2,11,"#8a6a42"); px(g,11,4,2,11,"#8a6a42"); px(g,3,4,1,11,"#a0774a"); // oak uprights
    px(g,3,3,10,2,"#8a6a42"); px(g,3,3,10,1,"#a0774a");                        // crossbeam
    px(g,7,5,2,4,"#8f97a0"); px(g,7,5,1,4,"#c8ccd2"); px(g,6,2,4,2,"#6a7078"); // iron screw + T-handle
    px(g,5,9,6,2,"#c8ccd2"); px(g,5,9,6,1,"#e6e9ee");                          // the plate
    px(g,5,11,6,3,"#f0d890"); px(g,5,11,6,1,"#fbe9b0"); px(g,5,13,6,1,"#d8bc6a"); });  // the wheel, pressing
  mkSpr("item_Cheese Press", 16, 16, g => {
    px(g,4,13,8,2,"#7a5636");                                                  // base
    px(g,4,3,2,10,"#8a6a42"); px(g,10,3,2,10,"#8a6a42"); px(g,4,2,8,2,"#8a6a42"); px(g,4,2,8,1,"#a0774a");  // frame
    px(g,7,4,2,3,"#8f97a0"); px(g,6,7,4,1,"#c8ccd2");                          // screw + plate
    px(g,5,8,6,4,"#f0d890"); px(g,5,8,6,1,"#fbe9b0"); });                      // the wheel
  mkSpr("item_Cheese", 16, 16, g => {
    px(g,3,6,10,6,"#f0d890"); px(g,3,6,10,1,"#fbe9b0"); px(g,3,11,10,1,"#d8bc6a");   // the wheel
    px(g,10,6,3,3,"#fbe9b0"); px(g,5,8,1,1,"#d8bc6a"); px(g,8,9,1,1,"#d8bc6a"); px(g,11,8,1,1,"#d8bc6a"); });  // cut face + eyes
  mkSpr("item_Fine Cheese", 16, 16, g => {
    px(g,3,5,10,7,"#e8c268"); px(g,3,5,10,1,"#f6dc90"); px(g,3,11,10,1,"#c09a48");   // a deeper, aged wheel
    px(g,3,8,10,1,"#b08838"); px(g,6,7,1,1,"#c09a48"); px(g,9,9,1,1,"#c09a48");      // the rind band + eyes
    px(g,11,4,2,2,"#c94f4f"); });                                              // wax seal — the dairy's mark
  // v3.22 THE HORSE — the mount you ride (drawn under the rider). Three facings; 'side' is mirrored
  // for left. A warm bay coat with a dark mane, tail, and hooves. 22×16 so the body has room.
  const HB="#8a5a3a", HM="#4f3320", HL="#7a4a30", HH="#2e1d12";               // body, mane/tail, leg, hoof
  const SB="#9a4636", SL="#5a3a2a";                                          // saddle blanket, saddle leather
  mkSpr("horse_side", 22, 16, g => {
    px(g,3,5,14,5,HB); px(g,3,5,14,1,shade(HB,1.18)); px(g,3,9,14,1,shade(HB,.72));   // barrel (longer, beefier)
    px(g,16,2,3,5,HB); px(g,18,1,3,3,HB); px(g,20,2,1,2,HM);                          // neck + head + muzzle
    px(g,15,0,2,6,HM);                                                                // mane
    px(g,1,4,3,7,HM);                                                                 // tail
    px(g,7,4,7,2,SB); px(g,7,4,7,1,shade(SB,1.2));                                    // saddle blanket
    px(g,8,3,5,2,SL); px(g,8,3,5,1,shade(SL,1.35));                                   // saddle seat (where the rider sits)
    px(g,9,6,1,3,SL); px(g,9,9,2,1,HH);                                               // stirrup strap + iron
    px(g,4,10,2,4,HL); px(g,8,10,2,4,HL); px(g,13,10,2,4,HL); px(g,15,10,1,3,HL);     // legs (four, staggered)
    px(g,4,13,2,1,HH); px(g,8,13,2,1,HH); px(g,13,13,2,1,HH); });                     // hooves
  mkSpr("horse_down", 18, 16, g => {   // facing the camera
    px(g,4,4,10,7,HB); px(g,4,4,10,1,shade(HB,1.18)); px(g,4,10,10,1,shade(HB,.72));  // chest/body
    px(g,6,1,6,4,HB); px(g,5,1,1,3,HM); px(g,12,1,1,3,HM);                            // head + ears/mane
    px(g,8,3,1,1,HH); px(g,10,3,1,1,HH);                                             // eyes
    px(g,6,5,6,2,SB); px(g,7,5,4,1,SL);                                              // saddle blanket over the withers
    px(g,5,11,2,4,HL); px(g,11,11,2,4,HL); px(g,5,14,2,1,HH); px(g,11,14,2,1,HH); }); // front legs
  mkSpr("horse_up", 18, 16, g => {     // rump toward camera
    px(g,4,4,10,7,HB); px(g,4,4,10,1,shade(HB,1.18)); px(g,4,10,10,1,shade(HB,.72));  // rump/body
    px(g,7,0,4,4,HM); px(g,8,4,2,3,HM);                                              // tail down the back
    px(g,5,5,8,2,SB); px(g,6,5,6,1,SL);                                             // saddle blanket over the croup
    px(g,5,11,2,4,HL); px(g,11,11,2,4,HL); px(g,5,14,2,1,HH); px(g,11,14,2,1,HH); }); // hind legs
  mkSpr("item_Stone", 16, 16, g => { px(g,4,6,8,7,"#9a9a9a"); px(g,3,8,10,4,"#8a8a8a"); px(g,5,5,5,3,"#a8a8a8"); px(g,4,12,9,1,"#6a6a6a"); });
  // v3.28 geode curios (Collection pieces from the deep)
  mkSpr("item_Amber", 16, 16, g => { px(g,5,4,6,8,"#e0a02a"); px(g,4,6,8,5,"#d8951f"); px(g,5,4,6,1,"#f2c256"); px(g,6,5,3,4,"#f6d27a"); px(g,8,8,1,1,"#3a2410"); px(g,4,11,8,1,"#a56a12"); });
  mkSpr("item_Obsidian", 16, 16, g => { px(g,5,4,6,9,"#2a2530"); px(g,4,6,8,5,"#211d28"); px(g,6,5,2,5,"#4a4458"); px(g,5,4,4,1,"#5a5468"); px(g,5,12,6,1,"#141018"); });
  mkSpr("item_Trilobite", 16, 16, g => { px(g,3,4,10,8,"#8a8478"); px(g,3,4,10,1,"#a09a8c"); px(g,3,11,10,1,"#6a6458");   // stone tablet
    px(g,6,5,4,6,"#6a5a44"); px(g,7,5,2,1,"#8a7a5c"); px(g,6,6,4,1,"#54462f"); px(g,6,8,4,1,"#54462f"); px(g,7,10,2,1,"#4a3c28"); });   // the trilobite
  mkSpr("item_Quartz Cluster", 16, 16, g => { px(g,6,3,2,10,"#dff2ff"); px(g,4,6,2,7,"#c8e6fb"); px(g,9,5,2,8,"#eef8ff"); px(g,7,8,2,5,"#d0eafd"); px(g,4,12,8,1,"#a9c4da"); });
  mkSpr("item_Geode Heart", 16, 16, g => { px(g,3,4,10,9,"#8a8a8a"); px(g,3,4,10,1,"#a2a2a2"); px(g,3,12,10,1,"#6a6a6a");   // stone shell
    px(g,5,6,6,5,"#3a2f52"); px(g,6,6,4,1,"#c8b8ff"); px(g,6,7,1,3,"#a877e0"); px(g,9,7,1,3,"#a877e0"); px(g,7,8,2,2,"#e6d8ff"); });   // crystal-lined hollow
  const oreCols = { "Copper Ore":"#c77b3f", "Iron Ore":"#bfa8a0", "Gold Ore":"#ffd75a", "Cobalt Ore":"#5a7ad0", "Deepsilver Ore":"#9ab0c8", "Star Metal Shard":"#c8a0ff" };   // v3.37: + deepsilver; v3.42: the shard goes violet with its vein
  for(const o in oreCols){ mkSpr("item_"+o, 16, 16, g => {
    px(g,4,6,8,7,"#7d7d7d"); px(g,3,8,10,4,"#6e6e6e"); px(g,5,5,5,3,"#8a8a8a");
    px(g,6,8,2,2,oreCols[o]); px(g,9,9,2,2,oreCols[o]); px(g,7,10,1,1,shade(oreCols[o],1.3)); }); }
  FISH.forEach(f => { mkSpr("item_"+f.name, 16, 16, g => drawFish(g, f.pal[0], f.pal[1]));
    mkSpr("item_Cooked "+f.name, 16, 16, g => { drawFish(g, shade(f.pal[0],.85), f.pal[1]); px(g,4,4,8,1,"#ffd08a"); px(g,3,9,3,1,"#c9884a"); }); });
  // the legends: bigger in the frame, with a glint along the flank
  LEGENDS.forEach(l => mkSpr("item_"+l.name, 16, 16, g => {
    drawFish(g, l.pal[0], l.pal[1]);
    px(g,4,5,7,1,l.pal[1]); px(g,5,4,2,1,"#ffffff");
    px(g,13,5,1,1,"#ffffff"); px(g,2,8,1,1,l.pal[1]);
  }));
  mkSpr("item_Berry Bun", 16, 16, g => { px(g,3,6,10,6,"#c9924a"); px(g,3,6,10,2,"#e0aa62"); px(g,4,5,8,2,"#e8b878");
    px(g,5,8,1,1,"#ff5a7a"); px(g,8,9,1,1,"#ff5a7a"); px(g,10,7,1,1,"#ff5a7a"); px(g,3,11,10,1,"#9a6a34"); });
  mkSpr("item_Field Salad", 16, 16, g => { px(g,3,8,10,5,"#e6ddc4"); px(g,3,8,10,1,"#f4ecd6");
    px(g,4,6,4,3,"#6fb04a"); px(g,8,5,4,3,"#5fa03e"); px(g,6,7,2,2,"#ff8a4a"); px(g,10,8,2,2,"#ff4d55"); });
  // tools
  mkSpr("tool_hoe", 16, 16, g => { px(g,4,3,2,10,"#a0774a"); px(g,4,3,1,10,"#c49a68"); px(g,4,3,7,2,"#c9c9c9"); px(g,9,3,2,4,"#c9c9c9"); });
  mkSpr("tool_can", 16, 16, g => { px(g,5,7,7,6,"#8fb0c0"); px(g,5,7,7,1,"#c9e0ec"); px(g,11,8,3,2,"#8fb0c0"); px(g,3,6,2,3,"#7a9aa8"); px(g,12,6,2,2,"#8fb0c0"); px(g,13,5,3,1,"#c9e0ec"); });
  mkSpr("tool_axe", 16, 16, g => { px(g,7,4,2,10,"#a0774a"); px(g,5,3,5,4,"#c9c9c9"); px(g,5,3,5,1,"#e6e6e6"); px(g,4,4,2,2,"#9a9a9a"); });
  mkSpr("tool_pick", 16, 16, g => { px(g,7,4,2,10,"#a0774a"); px(g,3,4,10,2,"#c9c9c9"); px(g,3,4,10,1,"#e6e6e6"); px(g,3,3,2,2,"#9a9a9a"); px(g,11,3,2,2,"#9a9a9a"); });
  mkSpr("tool_rod", 16, 16, g => { for(let i=0;i<10;i++) px(g,3+i,13-i,1,1,"#a0774a"); px(g,12,3,1,8,"#7a9aa8"); px(g,12,10,1,1,"#c03030"); });
  mkSpr("item_coin", 16, 16, g => { px(g,5,4,6,8,"#ffd75a"); px(g,4,6,8,4,"#ffd75a"); px(g,6,5,4,6,"#ffe89a"); px(g,7,6,1,4,"#c9922f"); });
  // animal produce
  mkSpr("item_Egg", 16, 16, g => { px(g,5,5,6,8,"#f4ecdc"); px(g,4,7,8,5,"#f8f2e4"); px(g,6,6,2,2,"#ffffff"); px(g,5,11,6,2,"#e0d4bc"); });
  mkSpr("item_Large Egg", 16, 16, g => { px(g,4,4,8,9,"#f8f0e0"); px(g,3,6,10,6,"#fbf4e6"); px(g,6,5,3,2,"#ffffff"); px(g,4,11,8,2,"#e4d8c0"); });
  mkSpr("item_Milk", 16, 16, g => { px(g,6,2,4,2,"#e8e8e8"); px(g,5,4,6,10,"#f4f8fb"); px(g,5,7,6,4,"#dfeaf2"); px(g,5,4,6,1,"#ffffff"); px(g,6,9,4,2,"#5a9ad0"); });
  mkSpr("item_Large Milk", 16, 16, g => { px(g,5,1,6,2,"#e8e8e8"); px(g,4,3,8,12,"#f6fafd"); px(g,4,6,8,5,"#dfeaf2"); px(g,4,3,8,1,"#ffffff");
    px(g,5,8,6,2,"#5a9ad0"); px(g,11,4,1,9,"#d8e2ea"); px(g,6,12,2,1,"#ffd75a"); });
  mkSpr("item_Wool", 16, 16, g => { px(g,4,5,8,7,"#f0f0f4"); px(g,3,7,10,4,"#f6f6fa"); px(g,5,4,6,3,"#ffffff"); for(let i=0;i<4;i++) px(g,4+i*2,7,1,3,"#dcdce4"); });
  // Prize Fleece — a fuller, cloud-white coat with a gold ribbon, the reward off a cherished sheep
  mkSpr("item_Prize Fleece", 16, 16, g => {
    px(g,3,4,10,9,"#f6f6fa"); px(g,2,6,12,5,"#ffffff"); px(g,4,3,8,3,"#ffffff");   // lush cloud
    for(let i=0;i<5;i++) px(g,3+i*2,7,1,3,"#e4e4ee");                                // curls
    px(g,5,5,2,2,"#ffffff"); px(g,9,6,2,2,"#ffffff");                                // highlights
    px(g,3,12,10,1,"#ffce5a"); px(g,7,12,2,3,"#ffce5a"); px(g,7,13,2,1,"#c9922f");   // gold ribbon
  });
  mkSpr("item_Bouquet", 16, 16, g => { // wrapped flowers
    px(g,6,8,4,6,"#e6ddc4"); px(g,6,8,4,1,"#f4ecd6");                 // paper wrap
    px(g,7,9,2,5,"#4f8a34"); px(g,5,10,1,3,"#4f8a34"); px(g,10,10,1,3,"#4f8a34"); // stems
    px(g,4,4,3,3,"#ff5a7a"); px(g,9,4,3,3,"#ffce5a"); px(g,6,2,3,3,"#b98fd4"); px(g,8,6,2,2,"#6a9aff"); // blooms
    px(g,5,5,1,1,"#ff9ab0"); px(g,10,5,1,1,"#fff0a0"); px(g,7,3,1,1,"#d8c0f0");
  });
  // cooked dishes (plate + coloured food)
  for(const r of RECIPES){ mkSpr("item_"+r.name, 16, 16, g => {
    px(g,2,9,12,4,"#e6e0d4"); px(g,2,9,12,1,"#f4efe4"); px(g,3,12,10,1,"#c8bfae");
    px(g,5,6,6,4,r.col); px(g,4,7,8,3,r.col); px(g,6,5,3,2,shade(r.col,1.25)); px(g,5,6,2,1,"#ffffff88");
  }); }
}
function drawProduce(g, c){
  const [stalk,leaf,fruit,fruitHi] = c.pal;
  if(c.shape==="tall"){ px(g,6,3,4,10,fruit); px(g,7,4,1,8,fruitHi); px(g,5,3,2,3,leaf); px(g,9,3,2,3,leaf); return; }
  if(c.shape==="star"){ px(g,7,3,2,10,fruit); px(g,3,7,10,2,fruit); px(g,5,5,1,1,fruit); px(g,10,5,1,1,fruit); px(g,5,10,1,1,fruit); px(g,10,10,1,1,fruit); px(g,7,7,2,2,fruitHi); return; }
  if(c.shape==="tall") return;
  // round-ish produce
  px(g,4,5,8,8,fruit); px(g,3,7,10,4,fruit); px(g,5,4,6,2,fruit);
  px(g,5,6,3,3,fruitHi); px(g,6,11,4,2,shade(fruit,.75));
  px(g,7,3,2,2,leaf); px(g,6,2,1,2,stalk);
  if(c.shape==="bush"){ px(g,4,6,1,1,"#fff0"); px(g,6,8,1,1,"#ffffff88"); }
}
function drawFish(g, body, belly){
  px(g,3,7,9,4,body); px(g,4,6,6,6,body); px(g,11,6,3,3,body); // tail
  px(g,4,9,7,2,belly); px(g,5,7,1,1,"#241a10"); // eye
  px(g,11,7,3,1,shade(body,.8)); px(g,6,6,3,1,shade(body,1.2));
}

/* ---------------- pixel portraits (dialogue) ---------------- */
function buildPortraits(){
  portrait("port_grandpa", { skin:"#e6bd90", skinSh:"#c99a68", hair:"#e8e8e8", brow:"#cfcfcf",
    shirt:"#4a6ea0", feature:"hat", extra:"beard" });
  portrait("port_maya", { skin:"#eec39a", skinSh:"#d8a878", hair:"#a8503a", brow:"#82392a",
    shirt:"#5a9e6a", feature:"braid", extra:"freckles" });
  portrait("port_tom", { skin:"#d8a878", skinSh:"#bd8e60", hair:"#6a5a48", brow:"#4a3a2a",
    shirt:"#c0a068", feature:"bald", extra:"mustache" });
  portrait("port_player", { skin:"#eec39a", skinSh:"#d8a878", hair:"#7a4a2a", brow:"#5e3a1f",
    shirt:"#4a86c0", feature:"hair", extra:"" });
  portrait("port_rowan", { skin:"#e0bd94", skinSh:"#c49a6a", hair:"#dcdcdc", brow:"#b0b0b0",
    shirt:"#4a3f72", feature:"hair", extra:"beard" });
  portrait("port_bram", { skin:"#c99a6a", skinSh:"#a87e50", hair:"#2e2622", brow:"#1c1714",
    shirt:"#3f88a0", feature:"beanie", extra:"mustache" });
  portrait("port_pip", { skin:"#eec39a", skinSh:"#d8a878", hair:"#c98a3a", brow:"#a06a28",
    shirt:"#c0503a", feature:"hair", extra:"freckles" });
  portrait("port_nell", { skin:"#e6bd90", skinSh:"#c69868", hair:"#c9a45a", brow:"#9a7838",
    shirt:"#cdd6dc", feature:"kerchief", kerch:"#b0483a", extra:"freckles" });
  portrait("port_elias", { skin:"#dcae82", skinSh:"#b98c62", hair:"#8a6250", brow:"#66473a",
    shirt:"#6a7a8a", feature:"hair", extra:"beard" });
  portrait("port_valley", { skin:"#8fd06a", skinSh:"#5fa03e", hair:"#4f8a34", brow:"#3f7a2e",
    shirt:"#6aab46", feature:"none", extra:"leaf" });
  mkSpr("port_sign", 64, 64, g => { px(g,0,0,64,64,"#2a2018"); for(let i=0;i<64;i+=2) px(g,0,i,64,1,"#31251a");
    px(g,6,6,52,52,"#3a2c1e"); px(g,12,14,40,34,"#8a5f38"); px(g,12,14,40,3,"#a5763f"); px(g,12,45,40,3,"#6e4a2a");
    px(g,20,8,4,10,"#6e4a2a"); px(g,40,8,4,10,"#6e4a2a"); for(let y=22;y<44;y+=6) px(g,17,y,30,2,"#6e4a2a");
    g.strokeStyle="#7a5c42"; g.lineWidth=2; g.strokeRect(1,1,62,62); });
}
function portrait(name, p){
  mkSpr(name, 64, 64, g => {
    // soft bg vignette
    px(g,0,0,64,64,"#2a2018");
    for(let i=0;i<64;i+=2) px(g,0,i,64,1,"#31251a");
    px(g,6,6,52,52,"#3a2c1e");
    // neck/shoulders
    px(g,18,44,28,20,p.shirt); px(g,18,44,28,2,shade(p.shirt,1.2)); px(g,24,40,16,8,p.skin);
    // head
    px(g,18,12,28,30,p.skin); px(g,18,12,28,2,shade(p.skin,1.08));
    px(g,16,20,2,14,p.skin); px(g,46,20,2,14,p.skin);
    px(g,18,38,28,4,p.skinSh);
    // ears
    px(g,15,26,3,6,p.skin); px(g,46,26,3,6,p.skin);
    // eyes
    px(g,24,26,4,4,"#ffffff"); px(g,36,26,4,4,"#ffffff");
    px(g,25,27,3,3,"#3a2a1a"); px(g,37,27,3,3,"#3a2a1a");
    px(g,26,27,1,1,"#fff");
    // brows
    px(g,23,23,6,1,p.brow); px(g,35,23,6,1,p.brow);
    // nose + mouth
    px(g,31,32,2,4,p.skinSh); px(g,28,38,8,1,"#b06a5a");
    // hair / features
    if(p.feature==="hat"){ // straw hat
      px(g,10,6,44,8,"#d8b46a"); px(g,10,6,44,2,"#e8c98a"); px(g,10,12,44,2,"#b8944a");
      px(g,20,0,24,8,"#c9a55a"); px(g,20,0,24,2,"#d8b46a"); px(g,20,8,24,1,"#a8843a");
    } else if(p.feature==="bald"){
      px(g,18,10,28,6,p.skin); px(g,16,14,4,8,p.hair); px(g,44,14,4,8,p.hair); px(g,18,11,28,2,shade(p.skin,1.1));
    } else if(p.feature==="braid"){
      px(g,16,8,32,10,p.hair); px(g,16,8,32,2,shade(p.hair,1.2)); px(g,14,16,4,16,p.hair); px(g,46,16,4,20,p.hair);
      px(g,46,34,4,6,shade(p.hair,.85)); px(g,16,10,6,10,p.hair);
    } else if(p.feature==="beanie"){
      px(g,15,11,34,7,p.hair);
      px(g,11,3,42,10,"#3f6a5a"); px(g,11,3,42,2,"#5a8a76"); px(g,11,11,42,2,"#2f5044");
      px(g,9,10,46,3,"#37604f");
    } else if(p.feature==="kerchief"){   // v3.44 Nell — a dairymaid's headscarf, hair tucked under
      px(g,15,8,34,8,p.hair);                                                            // a little hair at the crown
      const kc = p.kerch || "#c98a8a";
      px(g,13,9,38,7,kc); px(g,13,9,38,2,shade(kc,1.2)); px(g,13,14,38,1,shade(kc,.82));  // the scarf band
      px(g,13,15,4,6,kc); px(g,47,15,4,6,kc);                                             // sides tucked past the ears
      px(g,47,11,5,5,kc); px(g,50,13,3,4,shade(kc,.88));                                  // the knotted tail
    } else if(p.feature==="none"){
      px(g,14,6,36,14,p.hair); px(g,14,6,36,2,shade(p.hair,1.2)); // valley = leafy
    } else { // hair
      px(g,15,7,34,11,p.hair); px(g,15,7,34,2,shade(p.hair,1.25)); px(g,14,14,4,10,p.hair); px(g,46,14,4,10,p.hair);
      px(g,20,16,24,2,shade(p.hair,.85));
    }
    // extras
    if(p.extra==="beard"){ px(g,20,38,24,12,p.hair); px(g,18,40,4,8,p.hair); px(g,42,40,4,8,p.hair);
      px(g,28,38,8,3,p.skinSh); px(g,20,39,24,1,shade(p.hair,1.2)); }
    if(p.extra==="mustache"){ px(g,24,36,16,3,p.hair); px(g,24,36,16,1,shade(p.hair,1.2)); }
    if(p.extra==="freckles"){ px(g,22,33,1,1,p.skinSh); px(g,25,34,1,1,p.skinSh); px(g,39,33,1,1,p.skinSh); px(g,42,34,1,1,p.skinSh); }
    if(p.extra==="leaf"){ px(g,30,2,4,6,"#4f8a34"); px(g,28,4,8,2,"#6fb04a"); }
    // frame
    g.strokeStyle="#7a5c42"; g.lineWidth=2; g.strokeRect(1,1,62,62);
  });
}

/* ---------------- interiors ---------------- */
function buildInteriors(){
  mkSpr("iwall", 16, 16, g => { px(g,0,0,16,16,"#8a6a48");
    for(let x=0;x<16;x+=4){ px(g,x,0,1,16,"#6e5236"); } px(g,0,0,16,2,"#a5825a"); px(g,0,13,16,3,"#5e452c"); px(g,0,13,16,1,"#8a6a48"); });
  mkSpr("iwall_top", 16, 16, g => { g.drawImage(spr.iwall,0,0); px(g,0,0,16,3,"#5e452c"); px(g,0,0,16,1,"#7a5c3e"); });
  mkSpr("ifloor", 16, 16, g => { px(g,0,0,16,16,"#b58a56");
    for(let y=0;y<16;y+=8) px(g,0,y,16,1,"#96703f"); px(g,5,0,1,8,"#96703f"); px(g,11,8,1,8,"#96703f"); px(g,0,7,16,1,"#a37c49"); });
  mkSpr("plank", 16, 16, g => { px(g,0,0,16,16,"#a37c49"); for(let y=2;y<16;y+=5) px(g,0,y,16,1,"#846037"); });
  mkSpr("carpet", 16, 16, g => { px(g,0,0,16,16,"#8a4a5e"); px(g,1,1,14,14,"#a85f74"); px(g,3,3,10,10,"#c47d92"); px(g,5,5,6,6,"#8a4a5e"); px(g,0,0,16,1,"#6e3a4a"); });
  mkSpr("stove", 16, 16, g => { px(g,2,3,12,12,"#3a3a42"); px(g,2,3,12,2,"#55555f"); px(g,3,6,10,5,"#2a2a30");
    px(g,4,7,8,3,"#ff8a3a"); px(g,5,8,6,1,"#ffd75a"); px(g,3,12,10,2,"#22222a"); px(g,4,2,2,2,"#55555f"); px(g,10,2,2,2,"#55555f"); });
  mkSpr("table", 16, 16, g => { px(g,2,5,12,4,"#a5763f"); px(g,2,5,12,1,"#c29258"); px(g,3,9,2,6,"#7a5630"); px(g,11,9,2,6,"#7a5630");
    px(g,6,7,2,2,"#c2703a"); px(g,9,6,3,1,"#eae0c8"); });
  mkSpr("chair", 16, 16, g => { px(g,5,3,6,6,"#8a5f38"); px(g,5,3,6,1,"#a5763f"); px(g,4,9,8,3,"#7a5630"); px(g,5,12,2,3,"#5e4426"); px(g,9,12,2,3,"#5e4426"); });
  mkSpr("bookshelf", 16, 24, g => { px(g,1,0,14,24,"#6e4a2a"); px(g,2,1,12,22,"#8a5f38");
    for(let y=2;y<22;y+=6){ px(g,2,y,12,1,"#5e4426");
      const bk=["#c04a4a","#4a7ac0","#4ac07a","#c0a04a","#a04ac0"];
      for(let x=3;x<13;x+=2) px(g,x,y+1,2,4,bk[(x+y)%bk.length]); } px(g,1,0,14,1,"#a5763f"); });
  mkSpr("lamp", 16, 24, g => { px(g,7,10,2,12,"#5e4426"); px(g,5,21,6,2,"#4a3620"); px(g,4,4,8,7,"#f0d98a"); px(g,4,4,8,2,"#fff0c0");
    px(g,5,5,6,5,"#ffe6a0"); px(g,6,11,4,1,"#8a6a48"); });
  mkSpr("plantpot", 16, 16, g => { px(g,5,11,6,4,"#b5622f"); px(g,5,11,6,1,"#d07d47"); px(g,6,4,4,8,"#3f7a2e");
    px(g,3,6,4,4,"#5fa03e"); px(g,9,5,4,4,"#5fa03e"); px(g,6,3,3,3,"#6fb04a"); });
  // a worn garden bench for the plaza — somewhere to sit and watch the valley go about its day
  mkSpr("bench", 16, 15, g => {
    px(g,2,2,12,2,"#8a5f38"); px(g,2,2,12,1,"#a5763f"); px(g,2,3,12,1,"#6e4a2a");   // backrest rail
    px(g,3,4,1,5,"#6e4a2a"); px(g,12,4,1,5,"#6e4a2a"); px(g,7,4,1,4,"#6e4a2a");      // back slats
    px(g,1,8,14,3,"#9a6b3e"); px(g,1,8,14,1,"#b07d48"); px(g,1,10,14,1,"#7a5230");   // the seat
    px(g,2,11,2,4,"#5e4426"); px(g,12,11,2,4,"#5e4426");                             // legs
  });
  mkSpr("counter", 16, 16, g => { px(g,0,4,16,9,"#8a5f38"); px(g,0,4,16,2,"#a5763f"); px(g,0,11,16,2,"#5e4426");
    px(g,0,6,16,1,"#6e4a2a"); px(g,2,7,3,3,"#8fd06a"); px(g,7,7,3,3,"#ff9438"); px(g,12,7,2,3,"#ff4d55"); });

  // --- DÉCOR (v3.13): each piece gets a world sprite spr[kind] AND a 16×16 backpack icon
  // spr["item_<name>"]. For 16×16 pieces one drawing serves both; taller pieces pass a compact icon. ---
  const mkDecor = (kind, name, w, h, fn, iconFn) => { mkSpr(kind, w, h, fn); mkSpr("item_"+name, 16, 16, iconFn || fn); };
  mkDecor("flowerbed", "Flower Bed", 16, 16, g => {
    px(g,1,10,14,5,"#6b4c2a"); px(g,1,10,14,1,"#7d5a35");
    px(g,4,9,1,2,"#4f8a34"); px(g,7,8,1,3,"#4f8a34"); px(g,10,9,1,2,"#4f8a34"); px(g,13,8,1,3,"#4f8a34");
    px(g,3,7,2,2,"#ff4d55"); px(g,3,6,1,1,"#ff9aa0"); px(g,6,6,2,2,"#ffd94a"); px(g,6,5,1,1,"#fff0a0");
    px(g,9,7,2,2,"#5a6ad0"); px(g,9,6,1,1,"#9aa8ea"); px(g,12,6,2,2,"#ff9adf"); px(g,12,5,1,1,"#ffc0ec"); });
  mkDecor("gardenbench", "Garden Bench", 16, 15, g => {
    px(g,2,2,12,2,"#8a5f38"); px(g,2,2,12,1,"#a5763f"); px(g,3,4,1,5,"#6e4a2a"); px(g,12,4,1,5,"#6e4a2a"); px(g,7,4,1,4,"#6e4a2a");
    px(g,1,8,14,3,"#9a6b3e"); px(g,1,8,14,1,"#b07d48"); px(g,2,11,2,4,"#5e4426"); px(g,12,11,2,4,"#5e4426"); });
  mkDecor("stonelantern", "Stone Lantern", 16, 16, g => {
    px(g,6,13,4,2,"#8a8378"); px(g,7,8,2,5,"#9a9186"); px(g,5,4,6,4,"#a9a094"); px(g,5,4,6,1,"#b3aa9e");
    px(g,6,5,4,2,"#d8c68a"); px(g,4,2,8,2,"#9a9186"); px(g,6,1,4,1,"#a9a094"); });
  mkDecor("birdbath", "Bird Bath", 16, 16, g => {
    px(g,6,10,4,5,"#b3aa9e"); px(g,7,10,1,5,"#c9c0b4"); px(g,3,7,10,3,"#c9c0b4"); px(g,3,7,10,1,"#d8d0c4");
    px(g,4,8,8,1,"#8fd3ff"); px(g,5,8,2,1,"#c9ecff"); });
  mkDecor("topiary", "Topiary", 16, 18, g => {
    px(g,5,14,6,4,"#b5622f"); px(g,5,14,6,1,"#d07d47"); px(g,7,11,2,4,"#6e4a2a");
    px(g,3,3,10,9,"#3f7a2e"); px(g,2,5,12,5,"#4a8a3a"); px(g,4,4,4,3,"#5fa03e"); px(g,9,6,2,2,"#6fb04a"); },
    g => { px(g,6,12,4,3,"#b5622f"); px(g,3,1,10,10,"#3f7a2e"); px(g,2,3,12,5,"#4a8a3a"); px(g,4,2,4,3,"#5fa03e"); });
  mkDecor("sundial", "Sundial", 16, 16, g => {
    px(g,4,11,8,3,"#9a9186"); px(g,4,11,8,1,"#a9a094"); px(g,3,8,10,3,"#c9c0b4"); px(g,3,8,10,1,"#d8d0c4");
    px(g,8,4,1,5,"#6a6256"); px(g,7,8,2,1,"#7d7466"); px(g,4,9,1,1,"#6a6256"); px(g,11,9,1,1,"#6a6256"); });
  mkDecor("wishingwell", "Wishing Well", 16, 20, g => {
    px(g,3,12,10,7,"#8a8378"); px(g,3,12,10,1,"#a9a094"); px(g,4,15,1,4,"#6a6256"); px(g,8,15,1,4,"#6a6256"); px(g,11,13,1,5,"#6a6256");
    px(g,4,13,8,3,"#3a4650"); px(g,5,3,1,10,"#8a5f38"); px(g,10,3,1,10,"#8a5f38"); px(g,2,1,12,2,"#a5763f"); px(g,4,3,8,1,"#6e4a2a"); },
    g => { px(g,3,8,10,7,"#8a8378"); px(g,4,9,8,3,"#3a4650"); px(g,2,3,12,2,"#a5763f"); px(g,4,4,1,5,"#8a5f38"); px(g,11,4,1,5,"#8a5f38"); });
  mkDecor("grandfountain", "Grand Fountain", 16, 20, g => {
    px(g,2,15,12,4,"#b3aa9e"); px(g,2,15,12,1,"#c9c0b4"); px(g,3,16,10,2,"#8fd3ff");
    px(g,4,11,8,4,"#c9c0b4"); px(g,4,11,8,1,"#d8d0c4"); px(g,5,12,6,1,"#8fd3ff");
    px(g,5,6,6,5,"#c9c0b4"); px(g,7,2,2,5,"#8fd3ff"); px(g,6,3,1,2,"#c9ecff"); px(g,9,3,1,2,"#c9ecff"); },
    g => { px(g,2,11,12,4,"#b3aa9e"); px(g,3,12,10,2,"#8fd3ff"); px(g,5,5,6,6,"#c9c0b4"); px(g,7,2,2,4,"#8fd3ff"); });
  mkDecor("goldenstatue", "Golden Statue", 16, 24, g => {
    px(g,3,20,10,4,"#8a8378"); px(g,3,20,10,1,"#a9a094"); px(g,4,18,8,2,"#9a9186");
    px(g,6,4,4,4,"#ffe27a"); px(g,7,4,2,1,"#fff0a0"); px(g,5,8,6,9,"#ffd75a"); px(g,5,8,1,9,"#fff0a0"); px(g,10,8,1,9,"#c9922f");
    px(g,4,10,1,5,"#ffd75a"); px(g,11,10,1,5,"#ffd75a"); px(g,5,17,6,3,"#e0b84a"); px(g,7,2,2,2,"#ffe27a"); },
    g => { px(g,3,13,10,3,"#8a8378"); px(g,6,1,4,4,"#ffe27a"); px(g,5,5,6,8,"#ffd75a"); px(g,5,5,1,8,"#fff0a0"); px(g,10,5,1,8,"#c9922f"); });
  // v3.29 the STAR TIER — prestige monuments framed from the deep's terminal materials
  mkDecor("crystalspire", "Crystal Spire", 16, 20, g => {
    px(g,4,16,8,3,"#8a8378"); px(g,4,16,8,1,"#a9a094");                                   // stone base
    px(g,6,4,4,12,"#a877e0"); px(g,7,2,2,14,"#c8b8ff"); px(g,5,8,2,7,"#8f6fd0"); px(g,9,7,2,8,"#b898f0"); // crystals
    px(g,7,1,1,3,"#e6d8ff"); px(g,8,3,1,1,"#ffffff"); },                                  // glowing tip
    g => { px(g,4,12,8,3,"#8a8378"); px(g,6,2,4,10,"#a877e0"); px(g,7,1,2,11,"#c8b8ff"); px(g,7,0,1,2,"#e6d8ff"); });
  mkDecor("starobelisk", "Star Metal Obelisk", 16, 22, g => {
    px(g,3,18,10,3,"#b8ccd6"); px(g,3,18,10,1,"#d0e0ea"); px(g,4,16,8,2,"#a8bcc8");        // silverwood plinth
    px(g,6,4,4,12,"#a8c8e8"); px(g,7,4,2,12,"#c8ecff"); px(g,6,4,4,1,"#e6f4ff");           // star-metal spire
    px(g,7,1,2,3,"#c8ecff"); px(g,8,1,1,1,"#ffffff"); },                                  // tip glint
    g => { px(g,3,13,10,3,"#b8ccd6"); px(g,6,2,4,11,"#a8c8e8"); px(g,7,2,2,11,"#c8ecff"); px(g,7,1,2,1,"#ffffff"); });
  mkDecor("observatory", "Great Telescope", 16, 20, g => {
    px(g,4,15,2,4,"#3a3a44"); px(g,10,15,2,4,"#3a3a44"); px(g,7,14,2,5,"#4a4a54");         // tripod legs
    px(g,6,12,4,3,"#4a6ac8"); px(g,6,12,4,1,"#5a7ad0");                                    // cobalt mount
    px(g,4,6,8,4,"#c9922f"); px(g,4,6,8,1,"#e0b84a"); px(g,11,4,2,3,"#c8b8ff"); px(g,5,7,1,1,"#fff0a0"); },  // brass tube + starstone lens
    g => { px(g,4,11,2,3,"#3a3a44"); px(g,10,11,2,3,"#3a3a44"); px(g,4,4,8,4,"#c9922f"); px(g,11,3,2,3,"#c8b8ff"); });
  mkDecor("storybanner", "Storyteller's Banner", 16, 24, g => {                       // v3.32: the quest cape, flown
    px(g,7,2,2,20,"#7a5734"); px(g,7,2,1,20,"#9a744a");                               // the pole
    px(g,6,1,4,1,"#c9a44a"); px(g,7,0,2,1,"#ffce5a");                                 // gilt finial
    px(g,9,3,6,9,"#b03a3a"); px(g,9,3,6,1,"#d05a4a"); px(g,14,3,1,9,"#8a2a2a");       // the cloth
    px(g,9,12,4,2,"#b03a3a"); px(g,9,14,2,1,"#8a2a2a");                               // swallowtail
    px(g,10,5,3,1,"#ffce5a"); px(g,11,4,1,3,"#ffce5a"); px(g,10,8,4,1,"#ffe089"); },  // the gold star + underline
    g => { px(g,7,1,2,13,"#7a5734"); px(g,9,2,5,7,"#b03a3a"); px(g,9,2,5,1,"#d05a4a"); px(g,10,4,3,1,"#ffce5a"); px(g,11,3,1,3,"#ffce5a"); });
  mkSpr("barrel", 16, 16, g => { px(g,4,3,8,12,"#8a5f38"); px(g,4,3,8,1,"#a5763f"); px(g,3,5,10,2,"#6e4a2a"); px(g,3,11,10,2,"#6e4a2a");
    px(g,5,3,1,12,"#a5763f"); px(g,10,3,1,12,"#6e4a2a"); });
  mkSpr("crate", 16, 16, g => { px(g,3,4,10,10,"#a5763f"); px(g,3,4,10,1,"#c29258"); px(g,3,13,10,1,"#7a5630");
    px(g,3,4,1,10,"#7a5630"); px(g,12,4,1,10,"#7a5630");
    g.strokeStyle="#7a5630"; g.lineWidth=1; g.beginPath(); g.moveTo(4,5); g.lineTo(12,13); g.moveTo(12,5); g.lineTo(4,13); g.stroke(); });
  mkSpr("exitmat", 16, 16, g => { px(g,3,10,10,4,"#7a5630"); px(g,3,10,10,1,"#96703f"); px(g,4,11,8,2,"#5e4426"); });
  mkSpr("painting", 16, 16, g => { px(g,2,2,12,10,"#6e4a2a"); px(g,3,3,10,8,"#7fb0d8"); px(g,3,7,10,4,"#5fa03e"); px(g,9,4,3,3,"#ffd75a"); });
  mkSpr("fireplace", 16, 24, g => { px(g,1,6,14,18,"#7d7d7d"); px(g,2,7,12,16,"#5f5f5f"); px(g,3,12,10,10,"#241a12");
    px(g,5,15,6,6,"#ff8a3a"); px(g,6,17,4,4,"#ffd75a"); px(g,1,4,14,3,"#8a8a8a"); px(g,0,3,16,2,"#6a6a6a"); });
  mkSpr("desk", 16, 16, g => { px(g,1,6,14,4,"#8a5f38"); px(g,1,6,14,1,"#a5763f"); px(g,2,10,2,5,"#6e4a2a"); px(g,12,10,2,5,"#6e4a2a");
    px(g,4,4,6,3,"#eae0c8"); px(g,5,5,4,1,"#8a6a48"); px(g,10,5,3,2,"#c04a4a"); });
  mkSpr("anvil", 16, 16, g => { px(g,4,8,8,4,"#3a3a42"); px(g,3,7,3,2,"#55555f"); px(g,10,7,4,2,"#55555f"); px(g,6,12,4,3,"#2a2a30"); px(g,4,8,8,1,"#6a6a72"); });
  mkSpr("banner", 16, 24, g => { px(g,6,0,4,4,"#8a6238"); px(g,3,3,10,16,"#4a3f72"); px(g,3,3,10,2,"#6a5a92");
    px(g,3,19,3,3,"#4a3f72"); px(g,10,19,3,3,"#4a3f72"); px(g,6,7,4,4,"#ffce5a"); px(g,7,8,2,2,"#fff0a0"); });
  // ---- coop ----
  mkSpr("coopfloor", 16, 16, g => { px(g,0,0,16,16,"#c9a86a"); seedRR(33);
    for(let i=0;i<14;i++){ const x=rr()*14|0, y=rr()*14|0; px(g,x,y,3,1, rr()<.5?"#e0c488":"#b0904e"); } });
  mkSpr("nest", 16, 16, g => { px(g,3,9,10,4,"#a5763f"); px(g,3,9,10,1,"#c49a68"); px(g,4,7,8,3,"#d8b46a");
    px(g,5,8,6,2,"#c49a58"); px(g,6,9,4,2,"#f4ecdc"); px(g,7,9,2,1,"#ffffff"); });
  mkSpr("trough", 16, 16, g => { px(g,2,9,12,4,"#8a5f38"); px(g,2,9,12,1,"#a5763f"); px(g,3,10,10,2,"#e0c488"); px(g,3,10,3,2,"#d8b46a"); });
  mkSpr("chicken_0", 16, 16, g => {
    px(g,4,7,8,6,"#f4f0e6"); px(g,3,8,9,4,"#f8f4ea"); px(g,4,7,8,1,"#ffffff");
    px(g,5,9,4,2,"#e0dccc"); px(g,3,6,2,3,"#e8e4d6");
    px(g,10,4,4,4,"#f8f4ea"); px(g,10,4,4,1,"#ffffff");
    px(g,11,2,2,2,"#e0455a"); px(g,10,3,1,1,"#e0455a"); px(g,14,6,2,1,"#e8a83a"); px(g,12,5,1,1,"#241a10");
    px(g,6,13,1,2,"#e8a83a"); px(g,9,13,1,2,"#e8a83a");
  });
  mkSpr("chicken_1", 16, 16, g => {
    px(g,4,7,8,6,"#f4f0e6"); px(g,3,8,9,4,"#f8f4ea"); px(g,4,7,8,1,"#ffffff");
    px(g,5,9,4,2,"#e0dccc"); px(g,3,6,2,3,"#e8e4d6");
    px(g,10,6,4,4,"#f8f4ea"); px(g,11,4,2,2,"#e0455a"); px(g,14,9,2,1,"#e8a83a"); px(g,12,7,1,1,"#241a10");
    px(g,6,13,1,2,"#e8a83a"); px(g,10,13,1,2,"#e8a83a");
  });
  // a Holstein, facing right; frames differ only in the legs
  const cowBody = g => {
    px(g,2,6,1,5,"#2a2622"); px(g,2,10,1,3,"#1a1614");            // tail
    px(g,3,5,13,7,"#f2f0ea"); px(g,3,5,13,1,"#ffffff");           // body
    px(g,4,11,11,1,"#dcd6cd");                                    // belly shade
    px(g,5,6,4,3,"#2a2622"); px(g,11,7,3,4,"#2a2622"); px(g,8,5,2,2,"#2a2622");  // patches
    px(g,6,12,3,2,"#f0b0b8"); px(g,6,13,1,1,"#e08a96");           // udder
    px(g,15,6,4,5,"#f2f0ea"); px(g,15,6,4,1,"#ffffff");           // head
    px(g,16,7,3,2,"#2a2622");                                     // face patch
    px(g,18,9,2,2,"#f0b0b8"); px(g,18,10,1,1,"#241a10");          // muzzle + nostril
    px(g,15,4,1,2,"#d8d2c8"); px(g,18,4,1,2,"#d8d2c8");           // ears
    px(g,16,3,1,1,"#e8e0d0"); px(g,17,3,1,1,"#e8e0d0");           // horn nubs
  };
  const cowLegs = (g, a, b) => {
    px(g,a,12,2,4,"#e6e2da"); px(g,a,15,2,1,"#2a2622");
    px(g,b,12,2,4,"#e6e2da"); px(g,b,15,2,1,"#2a2622");
  };
  // a small standing stone on the Festival Green — two names, and a lantern that never goes out
  mkSpr("memorial", 16, 20, g => {
    px(g,3,18,10,2,"#6a6256"); px(g,4,17,8,1,"#7d7466");        // plinth
    px(g,4,4,8,14,"#9a9186"); px(g,5,3,6,1,"#a9a094");          // stone
    px(g,4,4,1,14,"#b3aa9e"); px(g,11,4,1,14,"#7d7466");        // light left, shade right
    px(g,6,2,4,2,"#a9a094"); px(g,7,1,2,1,"#b3aa9e");           // rounded top
    px(g,5,7,6,1,"#6a6256"); px(g,5,10,6,1,"#6a6256");          // two carved names
    px(g,6,13,4,1,"#6a6256");
    px(g,2,14,2,4,"#8a5f38"); px(g,1,12,4,3,"#ffd75a"); px(g,2,13,2,1,"#fff6d0");  // lantern
  });

  mkSpr("cow_0", 20, 16, g => { cowBody(g); cowLegs(g, 4, 12); });
  mkSpr("cow_1", 20, 16, g => { cowBody(g); cowLegs(g, 5, 11); });

  // the sheep: a cloud of fleece on dark little legs, facing right (drawSheep flips for left).
  // Fleece palette matches item_Wool so the animal and its drop read as the same soft thing.
  const sheepBody = g => {
    px(g,2,7,1,4,"#3a3630");                                      // stubby tail
    px(g,3,4,12,8,"#f0f0f4"); px(g,3,4,12,1,"#ffffff");           // fleece body
    px(g,4,5,10,1,"#f6f6fa"); px(g,5,6,3,2,"#ffffff"); px(g,9,5,2,2,"#ffffff");  // curls / highlights
    px(g,4,11,10,1,"#dcdce4");                                    // belly shade
    px(g,6,7,1,1,"#e0e0e8"); px(g,10,8,1,1,"#e0e0e8"); px(g,8,6,1,1,"#e0e0e8");  // wool dapples
    px(g,14,6,4,5,"#3a3630"); px(g,14,6,4,1,"#4a463e");           // dark face
    px(g,17,8,1,2,"#241a10");                                     // muzzle
    px(g,14,5,1,1,"#f0f0f4"); px(g,16,4,2,1,"#efe9dc");           // a tuft + ear
    px(g,15,7,1,1,"#0d0b08");                                     // eye
  };
  const sheepLegs = (g, a, b) => {
    px(g,a,12,2,4,"#4a463e"); px(g,a,15,2,1,"#241a10");
    px(g,b,12,2,4,"#4a463e"); px(g,b,15,2,1,"#241a10");
  };
  mkSpr("sheep_0", 20, 16, g => { sheepBody(g); sheepLegs(g, 5, 12); });
  mkSpr("sheep_1", 20, 16, g => { sheepBody(g); sheepLegs(g, 6, 11); });

  // staircase — packed from bulk Stone, drops you deep fast on a Deep Run (v3.15)
  mkSpr("item_Staircase", 16, 16, g => {
    px(g,2,4,5,2,"#b0a99c"); px(g,2,4,5,1,"#c8c0b2");     // top step
    px(g,6,7,5,2,"#a9a094"); px(g,6,7,5,1,"#bfb6a8");     // mid step
    px(g,10,10,4,2,"#9a9186"); px(g,10,10,4,1,"#b3aa9e"); // low step
    px(g,2,6,1,6,"#6e4a2a"); px(g,13,4,1,8,"#6e4a2a");    // rails
  });
  // shears — the one tool that gathers wool (a bought convenience, shown in the shop + backpack)
  mkSpr("item_Shears", 16, 16, g => {
    px(g,4,3,2,7,"#c7ccd2"); px(g,10,3,2,7,"#c7ccd2");            // the two blades
    px(g,4,3,2,1,"#eef1f4"); px(g,10,3,2,1,"#eef1f4");            // blade shine
    px(g,5,9,6,2,"#8a5f38");                                      // the joined wooden bows
    px(g,6,11,1,3,"#8a5f38"); px(g,9,11,1,3,"#8a5f38");           // the finger loops
    px(g,7,7,2,2,"#5a5560");                                      // the pivot rivet
  });

  mkSpr("coop", 16, 24, g => { // exterior building
    px(g,0,10,16,14,"#c9a86a"); px(g,0,10,16,2,"#e0c488"); for(let y=14;y<24;y+=4) px(g,0,y,16,1,"#a5844e");
    px(g,0,2,16,8,"#b7472f"); for(let y=2;y<10;y+=3){ px(g,0,y,16,2,"#9a3a25"); px(g,0,y+2,16,1,"#c85a40"); } px(g,0,1,16,2,"#8a3a25");
    px(g,6,14,4,10,"#6e4a2a"); px(g,7,15,2,8,"#8a5f38"); px(g,11,12,4,3,"#3a2a1a"); px(g,3,12,3,2,"#e0455a"); });
  // guild wing sconces + festival lantern
  mkSpr("wingsconce_dark", 16, 16, g => { px(g,7,9,2,5,"#4a4a52"); px(g,5,12,6,3,"#3a3a42"); px(g,5,12,6,1,"#565660"); px(g,6,6,4,4,"#2f2f37"); px(g,6,6,4,1,"#42424a"); });
  mkSpr("wingsconce_lit", 16, 16, g => { px(g,7,9,2,5,"#6e5236"); px(g,5,12,6,3,"#5a4130"); px(g,5,12,6,1,"#7a5c42");
    px(g,6,3,4,6,"#ff8a3a"); px(g,7,1,2,4,"#ffd75a"); px(g,7,3,1,3,"#fff0a0"); px(g,6,6,1,2,"#ff5a2a"); px(g,9,6,1,2,"#ff5a2a"); });
  mkSpr("lantern", 16, 16, g => { px(g,7,0,2,3,"#5a4130"); px(g,4,3,8,9,"#ffb84a"); px(g,4,3,8,1,"#ffd98a"); px(g,4,11,8,1,"#d8902a");
    px(g,6,5,4,5,"#fff2c0"); px(g,5,4,6,1,"#e8a83a"); px(g,7,12,2,2,"#d8902a"); });
}

/* ---------------- mine ---------------- */
/* ---------------- Grove Depths props ---------------- */
function buildGroveArt(){
  // the deadfall: a great mossy trunk down across the trail, branch stubs and all
  mkSpr("deadfall", 16, 16, g => {
    px(g,0,7,16,6,"#6e4a2a"); px(g,0,7,16,1,"#8a5f38"); px(g,0,12,16,1,"#4f341c");   // the trunk
    px(g,2,5,2,3,"#5a3a20"); px(g,9,4,2,4,"#5a3a20"); px(g,13,5,2,3,"#5a3a20");     // branch stubs
    px(g,0,8,2,4,"#96703f"); px(g,1,9,1,2,"#c9a86a");                                // torn end rings
    px(g,4,7,3,2,"#4a7a3a"); px(g,10,7,4,2,"#4a7a3a"); px(g,7,12,3,2,"#3a6a2e");     // moss
    px(g,3,13,10,2,"#2c3a24");                                                       // ground shadow
  });
  // waystone: a mossy Guild-era standing stone. Dormant is grey and sleeping; lit hums teal.
  const wayBase = g => {
    px(g,4,6,8,17,"#7a8078"); px(g,5,4,6,3,"#8a9088");                               // the stone
    px(g,4,6,1,17,"#9aa098"); px(g,11,6,1,17,"#5a6058");                             // edge light/shadow
    px(g,3,21,10,3,"#565c54"); px(g,2,23,12,1,"#3a4038");                            // the footing
    px(g,5,18,3,3,"#4a7a3a"); px(g,9,8,2,3,"#4a7a3a"); px(g,10,20,2,2,"#3a6a2e");    // moss
  };
  mkSpr("waystone", 16, 24, g => { wayBase(g);
    px(g,7,8,2,2,"#6a7068"); px(g,6,12,4,1,"#6a7068"); px(g,7,14,2,3,"#6a7068"); }); // runes, asleep
  mkSpr("waystone_lit", 16, 24, g => { wayBase(g);
    px(g,7,8,2,2,"#8fe8c8"); px(g,6,12,4,1,"#8fe8c8"); px(g,7,14,2,3,"#8fe8c8");     // runes, awake
    px(g,7,8,1,1,"#d8fff0"); px(g,6,12,1,1,"#d8fff0"); });
  // the trailheads: a dark gap between old trunks, with a carved marker post
  const trail = (g, arrowLeft) => {
    px(g,0,0,4,24,"#2c3a24"); px(g,12,0,4,24,"#2c3a24");                             // flanking trunks
    px(g,1,0,2,24,"#3a4a2e"); px(g,13,0,2,24,"#3a4a2e");
    px(g,4,0,8,4,"#1c2618"); px(g,4,4,8,20,"#141c10");                               // the dark way through
    px(g,5,6,1,1,"#2c3a24"); px(g,9,10,1,1,"#2c3a24");                               // hints of depth
    const mx = arrowLeft ? 10 : 4;
    px(g,mx,14,2,10,"#8a5f38"); px(g,mx-1,14,4,3,"#e8d9a8");                         // marker post + plaque
    px(g,arrowLeft?mx:mx+1,15,2,1,"#6a5a3a");                                        // the carved arrow
  };
  mkSpr("westtrail", 16, 24, g => trail(g, false));
  mkSpr("easttrail", 16, 24, g => trail(g, true));
  // the Ancient tree: one per deep ring per day — a golden-crowned elder, double timber
  mkSpr("ancient", 20, 32, g => {
    px(g,8,20,4,11,"#7a5a34"); px(g,8,20,1,11,"#96703f"); px(g,11,20,1,11,"#5e4426");
    px(g,6,30,8,2,"#5e4426"); px(g,5,18,3,3,"#7a5a34"); px(g,12,17,3,4,"#7a5a34");     // wide old boughs
    px(g,3,6,14,14,"#4a7a3a"); px(g,1,9,18,8,"#3f6a30"); px(g,5,3,10,6,"#5c9448");     // the crown
    px(g,4,15,12,5,"#356028");
    px(g,5,7,2,2,"#ffd75a"); px(g,12,10,2,2,"#ffce5a"); px(g,8,4,2,2,"#ffe89a");       // gold in the leaves
    px(g,14,14,2,2,"#ffd75a"); px(g,7,12,1,1,"#fff0b0");
  });
  // charm icons — small trinkets, each readable at 16px
  mkSpr("item_Wren Feather Charm", 16, 16, g => {
    px(g,7,2,2,10,"#8a7a62"); px(g,6,3,4,7,"#a89a80"); px(g,7,3,1,8,"#c9bda2");     // the feather
    px(g,5,11,6,2,"#c77b3f"); px(g,7,12,2,2,"#e08a45"); });                          // copper twist
  mkSpr("item_Acorn Ring", 16, 16, g => {
    px(g,4,6,8,7,"#c8d0e0"); g.clearRect(6,8,4,3);                                   // silver ring
    px(g,5,3,6,4,"#8a5f38"); px(g,5,3,6,1,"#a5763f"); px(g,7,2,2,1,"#6e4a2a"); });   // acorn cap
  mkSpr("item_Moss Locket", 16, 16, g => {
    px(g,5,4,6,8,"#b3aa9e"); px(g,6,5,4,6,"#4a7a3a"); px(g,7,6,2,2,"#6fb04a");       // moss under glass
    px(g,7,2,2,2,"#8a8478"); });
  mkSpr("item_Amber Beetle", 16, 16, g => {
    px(g,4,4,8,9,"#e8a83a"); px(g,5,3,6,2,"#f0c05a"); px(g,5,12,6,1,"#c9922f");      // the amber
    px(g,7,7,2,3,"#3a2c1a"); px(g,6,8,1,1,"#3a2c1a"); px(g,9,8,1,1,"#3a2c1a"); });   // the sleeper
  mkSpr("item_Lantern Charm", 16, 16, g => {
    px(g,6,3,4,2,"#6a6256"); px(g,5,5,6,8,"#d8ecf5"); px(g,6,6,4,5,"#fff0b0");       // glass + glow
    px(g,7,7,2,2,"#ffd75a"); px(g,7,2,2,1,"#8a8478"); });
  mkSpr("item_The Forester's Band", 16, 16, g => {
    px(g,4,5,8,8,"#ffce5a"); g.clearRect(6,7,4,4); px(g,4,5,8,1,"#ffe089");          // the gold band
    px(g,6,3,4,3,"#57ad57"); px(g,7,2,2,2,"#6ab86a"); px(g,7,4,1,1,"#b6f27a"); });   // the willow leaf
  mkSpr("item_Grandpa's Pocketwatch", 16, 16, g => {                                  // v3.32: dug up where his letter said
    px(g,7,1,2,2,"#c9a44a"); px(g,7,0,2,1,"#e0bc5a");                                // winding crown + loop
    px(g,4,3,8,10,"#ffce5a"); px(g,5,3,6,1,"#ffe089"); px(g,5,12,6,1,"#c9922f");     // gold case
    px(g,5,4,6,8,"#f4ead0"); px(g,5,4,6,1,"#fffbe8");                                // the face
    px(g,8,6,1,3,"#6a5a3a"); px(g,9,8,2,1,"#6a5a3a"); px(g,8,8,1,1,"#8a6a3a");       // hands, still keeping his time
    px(g,3,12,2,1,"#c9a44a"); px(g,2,13,2,1,"#e0bc5a"); px(g,1,14,2,1,"#c9a44a"); });// a curl of chain
  // the Heart of the Forest: pale-barked, older than the road, faintly aglow
  mkSpr("hearttree", 20, 32, g => {
    px(g,7,18,6,13,"#c9b8a0"); px(g,7,18,1,13,"#e0d4c0"); px(g,12,18,1,13,"#9a8a70"); // pale trunk
    px(g,5,29,10,3,"#8a7a62"); px(g,4,16,3,3,"#c9b8a0"); px(g,13,15,3,4,"#c9b8a0");   // roots + boughs
    px(g,2,4,16,13,"#3a6a52"); px(g,0,8,20,7,"#2f5a44");                              // deep-green crown
    px(g,4,2,12,5,"#4a8a6a"); px(g,6,1,8,2,"#5aa07a");
    px(g,5,6,2,2,"#8fe8c8"); px(g,13,9,2,2,"#8fe8c8"); px(g,9,4,2,2,"#b0ffd8");       // the glow in the leaves
    px(g,9,12,2,1,"#8fe8c8");
  });
}

function buildMineArt(){
  mkSpr("mfloor", 16, 16, g => { px(g,0,0,16,16,"#3a3540"); seedRR(41);
    for(let i=0;i<14;i++) px(g,rr()*16|0,rr()*16|0,1,1, rr()<.5?"#453f4c":"#332e38"); });
  mkSpr("mfloor2", 16, 16, g => { g.drawImage(spr.mfloor,0,0); seedRR(63); for(let i=0;i<3;i++) px(g,rr()*13|0,rr()*13|0,2,2,"#2c2833"); });
  mkSpr("mwall", 16, 16, g => { px(g,0,0,16,16,"#26222c"); px(g,0,0,16,16,"#26222c");
    px(g,1,1,14,7,"#332e3a"); px(g,2,9,12,5,"#2c2833"); px(g,3,2,7,3,"#3d3846"); px(g,0,0,16,1,"#413b4a"); px(g,0,14,16,2,"#1a171e"); });
  mkSpr("ladder", 16, 16, g => { px(g,3,0,2,16,"#a5763f"); px(g,11,0,2,16,"#a5763f");
    for(let y=1;y<16;y+=4) px(g,3,y,10,2,"#8a5f38"); px(g,3,0,2,16,"#a5763f"); });
  mkSpr("gemrock", 16, 16, g => { px(g,3,7,10,7,"#4a4550"); px(g,2,9,12,5,"#3d3846"); px(g,5,4,7,4,"#565060");
    px(g,6,8,2,3,"#a877e0"); px(g,9,9,2,2,"#3ec878"); px(g,7,10,1,1,"#e0455a"); px(g,6,8,1,1,"#d8b8f0"); });
  mkSpr("crystal", 16, 16, g => { px(g,6,4,4,10,"#8fd3ff"); px(g,4,8,3,6,"#7fc0f0"); px(g,10,7,3,7,"#a9e0ff");
    px(g,7,4,1,9,"#d8f0ff"); px(g,6,4,1,1,"#ffffff"); px(g,5,13,7,2,"#3d3846"); });
  // v3.28 geode — a rounded nodule with a hairline crack and a glint of crystal, waiting for a pick
  mkSpr("geode", 16, 16, g => { px(g,3,5,10,9,"#7a7268"); px(g,2,7,12,6,"#6a635a"); px(g,4,4,8,3,"#8a8278");
    px(g,4,4,8,1,"#9a9288"); px(g,3,13,10,1,"#4e4840");
    px(g,8,5,1,8,"#4a4448"); px(g,7,8,1,1,"#c8b8ff"); px(g,9,9,1,1,"#8fe8c8"); });   // the crack + crystal winks
  mkSpr("torch", 16, 16, g => { px(g,7,6,2,9,"#6e4a2a"); px(g,6,3,4,5,"#ff8a3a"); px(g,7,1,2,4,"#ffd75a"); px(g,7,2,1,2,"#fff0a0"); });
  mkSpr("beam", 16, 16, g => { px(g,2,0,3,16,"#6e4a2a"); px(g,11,0,3,16,"#6e4a2a"); px(g,0,0,16,3,"#7a5630"); px(g,0,0,16,1,"#96703f"); });
  mkSpr("minecart", 16, 16, g => { px(g,2,6,12,6,"#5f5f5f"); px(g,2,6,12,2,"#7a7a7a"); px(g,3,8,10,3,"#3a3a42");
    px(g,4,12,3,3,"#2a2a30"); px(g,9,12,3,3,"#2a2a30"); px(g,4,7,3,2,"#c77b3f"); px(g,8,7,4,2,"#ffd75a"); });
  mkSpr("rubble", 16, 16, g => { seedRR(17); for(let i=0;i<6;i++){ const x=rr()*11+1|0,y=rr()*7+7|0; px(g,x,y,3,2,"#4a4550"); px(g,x,y,1,1,"#565060"); } });
  // the Old Lift: a rusted cage frame with a crossbar pulley and a warm brass call-lever
  mkSpr("lift", 16, 24, g => {
    px(g,2,2,2,22,"#5a5560"); px(g,12,2,2,22,"#5a5560");        // side rails
    px(g,2,2,12,2,"#6a6472"); px(g,2,3,12,1,"#7a7484");         // headframe
    px(g,7,0,2,3,"#3a3540"); px(g,6,4,4,2,"#8a8494");           // pulley + hanger
    px(g,4,8,8,1,"#5a5560"); px(g,4,14,8,1,"#5a5560");          // cage bars
    px(g,4,20,8,2,"#4a4550");                                    // floor plate
    px(g,3,6,1,2,"#a06a3a"); px(g,12,12,1,3,"#a06a3a");          // rust
    px(g,13,9,2,3,"#ffd75a"); px(g,13,9,2,1,"#fff0b0");          // the brass call-lever
  });
  mkSpr("sealeddoor", 16, 24, g => { px(g,2,2,12,22,"#4a4550"); px(g,3,3,10,20,"#3a3540"); px(g,7,3,2,20,"#2c2833");
    px(g,4,10,8,4,"#8fd3ff"); px(g,5,11,6,2,"#c8ecff"); px(g,2,2,12,1,"#565060"); px(g,6,7,4,1,"#a877e0"); });
  // the Guild's planked-shut door: an ordinary door someone nailed boards across, years ago
  mkSpr("olddoor", 16, 24, g => {
    px(g,3,3,10,20,"#5f4630"); px(g,4,4,8,18,"#6e5238"); px(g,8,4,1,18,"#503a26");   // the door itself, dust-dark
    px(g,2,8,12,3,"#8a6647"); px(g,2,8,12,1,"#a0774a");                              // board one
    px(g,2,15,12,3,"#8a6647"); px(g,2,17,12,1,"#503a26");                            // board two
    px(g,3,9,1,1,"#3a2c1c"); px(g,12,9,1,1,"#3a2c1c"); px(g,3,16,1,1,"#3a2c1c"); px(g,12,16,1,1,"#3a2c1c");  // nail heads
  });
  // gem item icons
  for(const gm in GEMS){ mkSpr("item_"+gm, 16, 16, g => { const c=GEMS[gm];
    px(g,6,3,4,2,c); px(g,5,5,6,5,c); px(g,7,10,2,3,c); px(g,6,4,1,5,shade(c,1.4)); px(g,9,5,1,4,shade(c,.7)); px(g,7,3,1,1,"#ffffff"); }); }
  mkSpr("item_Star Metal", 16, 16, g => { px(g,5,5,6,6,"#c8d0e0"); px(g,4,6,8,4,"#e0e8f5"); px(g,7,3,2,10,"#e0e8f5"); px(g,3,7,10,2,"#e0e8f5");
    px(g,6,6,1,1,"#ffffff"); px(g,8,8,2,2,"#9fb0d8"); });
  mkSpr("mineentrance", 16, 24, g => { px(g,1,8,14,16,"#6a6a6a"); px(g,0,9,16,15,"#5f5f5f"); px(g,2,10,12,14,"#4a4550");
    px(g,4,12,8,12,"#0a0a0e"); px(g,4,12,8,2,"#050507");
    px(g,1,7,14,3,"#7a5630"); px(g,0,6,16,2,"#8a6238"); px(g,2,8,2,16,"#6e4a2a"); px(g,12,8,2,16,"#6e4a2a"); });
  mkSpr("item_Guild Seal", 16, 16, g => { px(g,4,4,8,8,"#ffce5a"); px(g,3,6,10,4,"#ffce5a"); px(g,5,5,6,6,"#e8a83a"); px(g,6,6,4,4,"#4a3f72"); px(g,7,6,1,1,"#fff0a0"); });
  mkSpr("item_Grandpa's Guild Pin", 16, 16, g => { px(g,5,4,6,6,"#ffce5a"); px(g,4,5,8,4,"#ffe089"); px(g,6,5,4,4,"#4a3f72"); px(g,7,6,2,2,"#e0455a"); px(g,7,6,1,1,"#ff9ab0"); px(g,8,9,1,4,"#c9922f"); });
  // a folded oilskin coat, Bram's own teal, weathered by every kind of sea
  mkSpr("item_Bram's Oilskin", 16, 16, g => {
    px(g,3,4,10,9,"#3f88a0"); px(g,3,4,10,1,"#5aa5bd"); px(g,3,12,10,1,"#2c6072");
    px(g,3,7,10,1,"#2c6072"); px(g,7,4,2,9,"#347082");           // the fold
    px(g,4,5,2,2,"#6ab6cc"); px(g,10,9,2,2,"#2c6072");           // sheen + shadow
    px(g,5,3,6,1,"#8a5f38"); px(g,7,2,2,2,"#6e4a2a");            // wooden toggle
  });
}

/* ---------------- beach ---------------- */
function buildBeachArt(){
  mkSpr("wetsand", 16, 16, g => { px(g,0,0,16,16,"#c9b06a"); seedRR(29); for(let i=0;i<10;i++) px(g,rr()*16|0,rr()*16|0,1,1,"#b89a56"); });
  mkSpr("palm", 20, 32, g => { px(g,8,14,3,17,"#8a6238"); px(g,8,14,1,17,"#6e4a2a"); for(let y=16;y<30;y+=4) px(g,8,y,3,1,"#6e4a2a");
    px(g,4,10,12,4,"#3f8a5a"); px(g,2,8,7,3,"#57ad74"); px(g,11,7,7,3,"#57ad74"); px(g,6,5,8,4,"#3f8a5a"); px(g,8,4,4,3,"#57ad74");
    px(g,9,12,3,2,"#c9a05a"); px(g,7,12,2,2,"#c9a05a"); });
  mkSpr("shellnode", 16, 16, g => { px(g,4,8,8,5,"#f0dcc0"); px(g,4,8,8,1,"#fff0dc"); for(let i=0;i<4;i++) px(g,5+i*2,8,1,5,"#d8b8a0"); px(g,7,7,2,1,"#f0dcc0"); });
  mkSpr("starfish", 16, 16, g => { px(g,7,4,2,9,"#ff9438"); px(g,3,8,10,2,"#ff9438"); px(g,5,6,1,1,"#ff9438"); px(g,10,6,1,1,"#ff9438"); px(g,5,11,1,1,"#ff9438"); px(g,10,11,1,1,"#ff9438"); px(g,7,7,2,2,"#ffbe6a"); });
  mkSpr("driftwood", 16, 16, g => { px(g,2,8,12,3,"#c9b499"); px(g,2,8,12,1,"#ddccb0"); px(g,4,7,2,1,"#c9b499"); px(g,10,11,3,1,"#a08f70"); });
  // v3.36 THE COAST ROAD — its landmarks and forage
  mkSpr("milestone", 16, 16, g => {                                                     // squat granite, carved face
    px(g,5,4,6,10,"#9a948a"); px(g,5,4,6,1,"#b8b2a6"); px(g,5,3,6,1,"#b8b2a6");
    px(g,6,6,4,1,"#6a655c"); px(g,6,8,4,1,"#6a655c"); px(g,7,10,2,1,"#6a655c");         // the worn carving
    px(g,4,13,8,2,"#7a746a"); px(g,10,5,1,9,"#7a746a"); });                             // base + shadowed edge
  mkSpr("shrine", 16, 18, g => {                                                        // knee-high stone hollow with a shelf
    px(g,3,6,10,10,"#8a8478"); px(g,3,6,10,1,"#a8a296"); px(g,4,4,8,2,"#9a948a");       // body + cap
    g.clearRect(5,9,6,5); px(g,5,13,6,1,"#6a655c");                                     // the hollow + shelf
    px(g,6,11,1,1,"#d8d0c0"); px(g,8,11,1,2,"#c9788a"); px(g,9,12,1,1,"#c9a44a"); });   // pebble, flower, biscuit
  mkSpr("mooring", 16, 16, g => {                                                       // salt-silvered post + rope loop
    px(g,6,3,3,11,"#8a8890"); px(g,6,3,3,1,"#a8a6ae"); px(g,6,3,1,11,"#a8a6ae");
    px(g,5,5,5,2,"#b09a6a"); px(g,5,7,1,2,"#b09a6a"); px(g,9,7,1,2,"#b09a6a"); px(g,5,9,5,1,"#98845a"); });
  mkSpr("samphirenode", 16, 16, g => {                                                  // salty green spears on sand
    for(let i=0;i<4;i++){ const x=4+i*2; px(g,x,8,1,5,"#57ad74"); px(g,x,7,1,2,"#7cc98a"); px(g,x+1,9,1,2,"#3f8a5a"); }
    px(g,4,13,8,1,"#c9b06a"); });
  mkSpr("hollynode", 16, 16, g => {                                                     // steel-blue bloom, stubborn
    px(g,7,5,2,2,"#7a9ac8"); px(g,6,6,1,1,"#7a9ac8"); px(g,9,6,1,1,"#7a9ac8"); px(g,7,4,2,1,"#a8c0e0");
    px(g,7,7,1,6,"#5a7a4a"); px(g,5,9,2,1,"#5a7a4a"); px(g,9,10,2,1,"#5a7a4a"); px(g,8,6,1,1,"#dce8f8"); });
  mkSpr("item_Samphire", 16, 16, g => {
    for(let i=0;i<3;i++){ const x=5+i*2; px(g,x,4,1,8,"#57ad74"); px(g,x,3,1,2,"#7cc98a"); px(g,x+1,6,1,2,"#3f8a5a"); }
    px(g,4,12,8,1,"#3f8a5a"); });
  mkSpr("item_Sea Holly", 16, 16, g => {
    px(g,6,3,4,3,"#7a9ac8"); px(g,7,2,2,1,"#a8c0e0"); px(g,5,4,1,1,"#7a9ac8"); px(g,10,4,1,1,"#7a9ac8"); px(g,7,4,2,1,"#dce8f8");
    px(g,7,6,2,7,"#5a7a4a"); px(g,5,8,2,1,"#5a7a4a"); px(g,9,9,2,1,"#5a7a4a"); });
  // v3.43 STARFALL RIDGE — the summit's furniture and forage
  mkSpr("cairn", 16, 18, g => {                                                       // stacked by every hand that made the climb
    px(g,4,13,8,3,"#8a8478"); px(g,4,13,8,1,"#a8a296");                               // base stones
    px(g,5,10,6,3,"#9a948a"); px(g,5,10,6,1,"#b8b2a6");
    px(g,6,7,4,3,"#8a8478"); px(g,6,7,4,1,"#a8a296");
    px(g,7,4,2,3,"#9a948a"); px(g,7,4,2,1,"#c8c2b6"); px(g,7,3,1,1,"#d8d2c6"); });    // the topstone, catching light
  mkSpr("crater", 16, 16, g => {                                                      // the star's old bed, fused smooth
    px(g,3,6,10,7,"#6a655c"); px(g,4,5,8,1,"#7a746a"); px(g,5,7,6,4,"#4a463e");       // the bowl
    px(g,6,8,4,2,"#3a362e"); px(g,7,9,2,1,"#b088e8"); px(g,8,8,1,1,"#d8b0ff"); });    // a last violet gleam at the bottom
  mkSpr("shardnode", 16, 16, g => {                                                   // starlight, caught in the scree
    px(g,6,9,4,4,"#8a8478");                                                          // the scree it landed in
    px(g,7,5,2,5,"#d8b0ff"); px(g,7,5,1,5,"#eedcff"); px(g,6,7,1,1,"#b088e8");        // the splinter
    px(g,10,8,1,1,"#b088e8"); px(g,7,4,1,1,"#ffffff"); px(g,9,6,1,1,"#ffffff"); });   // white-hot glints
  mkSpr("thymenode", 16, 16, g => {
    px(g,5,9,6,4,"#5a7a4a"); px(g,5,9,6,1,"#6f9a58"); px(g,4,11,2,2,"#4a6a3e");       // the tough little bush
    px(g,6,8,1,1,"#c9a0c8"); px(g,9,9,1,1,"#c9a0c8"); px(g,7,10,1,1,"#d8b0d8"); });   // tiny thyme flowers
  mkSpr("snowdropnode", 16, 16, g => {
    px(g,6,8,1,5,"#5a7a4a"); px(g,9,9,1,4,"#5a7a4a");                                 // stems
    px(g,5,6,3,2,"#f4f4fa"); px(g,6,5,1,1,"#ffffff"); px(g,8,7,3,2,"#eaeaf4"); px(g,9,6,1,1,"#ffffff"); });   // the nodding bells
  mkSpr("item_Mountain Thyme", 16, 16, g => {
    px(g,7,4,2,9,"#5a7a4a"); px(g,5,6,2,1,"#6f9a58"); px(g,9,7,2,1,"#6f9a58");
    px(g,4,8,2,1,"#6f9a58"); px(g,10,9,2,1,"#6f9a58"); px(g,6,4,1,1,"#c9a0c8"); px(g,9,5,1,1,"#c9a0c8"); });
  mkSpr("item_Snowdrop", 16, 16, g => {
    px(g,7,6,1,7,"#5a7a4a"); px(g,8,7,2,1,"#5a7a4a");
    px(g,6,3,3,3,"#f4f4fa"); px(g,7,2,1,1,"#ffffff"); px(g,6,6,1,1,"#eaeaf4"); px(g,8,6,1,1,"#eaeaf4"); });
  mkSpr("item_Starlight Shard", 16, 16, g => {
    px(g,7,3,2,9,"#d8b0ff"); px(g,7,3,1,9,"#eedcff"); px(g,6,6,1,2,"#b088e8"); px(g,9,7,1,2,"#b088e8");
    px(g,7,2,1,1,"#ffffff"); px(g,9,5,1,1,"#ffffff"); px(g,6,11,1,1,"#ffffff"); });
  // v3.44 BUTTERBROOK — the dairy's butter churn (a flavor prop, examined + a warm line)
  mkSpr("churn", 16, 18, g => {
    px(g,5,6,6,10,"#c9a06a"); px(g,5,6,6,1,"#e0bc86"); px(g,5,15,6,1,"#9a7648");          // the wooden tub
    px(g,4,9,8,1,"#8a6a42"); px(g,4,12,8,1,"#8a6a42");                                    // the iron bands
    px(g,7,1,2,6,"#8a6a42"); px(g,6,0,4,2,"#a5824c");                                     // the plunger handle
    px(g,5,5,6,1,"#e8dcc0"); });                                                          // a skim of cream at the rim
  mkSpr("coralnode", 16, 16, g => { px(g,6,8,2,6,"#ff7d9c"); px(g,4,9,2,5,"#ff9ab0"); px(g,9,7,2,7,"#ff5a7a"); px(g,7,6,2,3,"#ffbecb"); px(g,5,13,7,2,"#c9b06a"); });
  mkSpr("seaweednode", 16, 16, g => { for(let i=0;i<4;i++){ const x=4+i*2; px(g,x,7,1,7,"#3f8a5a"); px(g,x,7,1,3,"#57ad74"); } px(g,4,13,8,1,"#c9b06a"); });
  mkSpr("stage", 16, 16, g => { px(g,0,4,16,10,"#8a5f38"); px(g,0,4,16,2,"#a5763f"); px(g,0,12,16,2,"#5e4426"); for(let x=2;x<16;x+=4) px(g,x,6,1,6,"#6e4a2a"); });
  // shore item icons
  mkSpr("item_Shell", 16, 16, g => { px(g,4,7,8,5,"#f0dcc0"); px(g,4,7,8,1,"#fff0dc"); for(let i=0;i<4;i++) px(g,5+i*2,7,1,5,"#d8b8a0"); px(g,7,6,2,1,"#f0dcc0"); });
  mkSpr("item_Coral", 16, 16, g => { px(g,6,6,2,7,"#ff7d9c"); px(g,4,8,2,5,"#ff9ab0"); px(g,9,5,2,8,"#ff5a7a"); px(g,7,4,2,3,"#ffbecb"); });
  mkSpr("item_Seaweed", 16, 16, g => { for(let i=0;i<4;i++){ const x=4+i*2; px(g,x,4,1,10,"#3f8a5a"); px(g,x,4,1,4,"#57ad74"); } });
  mkSpr("item_Clam", 16, 16, g => { px(g,4,6,8,5,"#e0cbb0"); px(g,4,10,8,2,"#c9b499"); for(let i=0;i<4;i++) px(g,5+i*2,6,1,5,"#c9b499"); px(g,6,7,4,2,"#f5b0c0"); });
  mkSpr("item_Pearl", 16, 16, g => { px(g,5,5,6,6,"#f0f0f5"); px(g,4,6,8,4,"#f8f8ff"); px(g,6,6,2,2,"#ffffff"); px(g,8,9,2,1,"#d0d0e0"); });
}

buildArt();
