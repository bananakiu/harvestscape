"use strict";
/* ============================================================
   10-ui.js — HUD, panels, dialogue, input wiring.
   ============================================================ */

// ?touch=1 forces the on-screen controls (handy for testing, and for hybrid laptops)
const IS_TOUCH = matchMedia("(pointer:coarse)").matches || "ontouchstart" in window
              || /[?&]touch=1/.test(location.search);

// ---- open-panel tracking ----
const openPanels = new Set();
function anyPanelOpen(){ return openPanels.size > 0; }
function uiBlocking(){ return dlg.open || anyPanelOpen() || !!_panoClose; }   // v3.43: the panorama blocks like a panel (story triggers must not fire beneath it)

// ---- toasts / banner ----
function toast(msg, col){
  const box = $("toasts"); if(!box) return;
  const d = document.createElement("div"); d.className = "toast"; d.textContent = msg;
  if(col) d.style.color = col;
  box.appendChild(d);
  while(box.children.length > 5) box.removeChild(box.firstChild);
  setTimeout(() => d.remove(), 2400);
}

// The examine readout — a calm parchment line at the bottom, fades on its own. Used by the
// X-to-look verb and by tapping an item in the Backpack.
let _examineT = null;
function showExamine(title, text){
  const el = $("examineBar"); if(!el) return;
  el.innerHTML = `<span class="exTitle">${escapeHtml(title)}</span><span class="exText">${escapeHtml(text)}</span>`;
  el.classList.remove("hidden", "out"); void el.offsetWidth; el.classList.add("show");
  if(_examineT) clearTimeout(_examineT);
  _examineT = setTimeout(() => { el.classList.remove("show"); el.classList.add("out");
    setTimeout(() => { el.classList.add("hidden"); el.classList.remove("out"); }, 400); }, 4200);
}

// ---- item pickup log ---- a fading, stacking notification of what you just collected.
// Repeat pickups of the same item roll up into one entry (which pulses and its timer resets),
// so mass-harvesting reads as "+50 Corn" rather than fifty separate lines.
// Each row also carries the running TOTAL you now own of that item — a small, de-emphasized
// number on the right ("+1 Stone … 12"), so a pickup answers "and how many do I have?" at a
// glance, the way Stardew shows the stack size. The total is read straight from state.inv, which
// give() has already incremented by the time we're called, so there's no separate counter to sync.
const _pickups = new Map();          // item name -> { el, amtEl, totEl, count, timer }
function clearPickups(){ const b = $("pickups"); if(b) b.innerHTML = ""; _pickups.clear(); }
function notePickup(item, n){
  const box = $("pickups"); if(!box) return;
  const owned = (state && state.inv[item]) || n;   // total held AFTER this pickup
  let p = _pickups.get(item);
  if(p && p.el.isConnected){
    p.count += n; p.amtEl.textContent = "+" + p.count;
    if(p.totEl) p.totEl.textContent = owned;
    p.el.classList.remove("out","bump"); void p.el.offsetWidth; p.el.classList.add("bump");
  } else {
    const el = document.createElement("div"); el.className = "pickup";
    el.appendChild(mkIcon("item_" + item));
    const amt = document.createElement("span"); amt.className = "amt"; amt.textContent = "+" + n;
    const nm  = document.createElement("span"); nm.className = "pname"; nm.textContent = item;
    const tot = document.createElement("span"); tot.className = "ptot"; tot.textContent = owned;
    tot.title = "in your backpack";
    el.appendChild(amt); el.appendChild(nm); el.appendChild(tot);
    box.appendChild(el);
    p = { el, amtEl: amt, totEl: tot, count: n, timer: 0 };
    _pickups.set(item, p);
    while(box.children.length > 6) box.removeChild(box.firstChild);
  }
  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    p.el.classList.add("out");
    setTimeout(() => { p.el.remove(); if(_pickups.get(item) === p) _pickups.delete(item); }, 520);
  }, 2600);
}
function banner(big, small){
  const b = $("banner");
  b.innerHTML = `<div class="big">${big}</div>` + (small ? `<div class="small">${small}</div>` : "");
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
}

// ---- dialogue ----
const dlg = { open:false, full:"", i:0, timer:null, done:true };
function drawPortrait(name){
  const c = $("portrait"), g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.clearRect(0,0,64,64);
  const s = spr[name] || spr.port_valley;
  if(s) g.drawImage(s, 0, 0);
}
function showDialog(who, txt, portraitName){
  playSfx("menu");
  const d = $("dialog"); d.classList.remove("hidden");
  $("stage").classList.add("talking");   // v4.28: the hotbar steps aside instead of being covered
  // v4.37: retire the examine readout when a conversation starts. This used to be a CSS rule that
  // MOVED it to bottom:2.6% — the exact offset of #hotbar, at a higher z-index, so it covered the
  // belt. Clearing it is right instead of relocating it: examine() early-returns on uiBlocking()
  // (08-actions.js), so a readout can never legally be raised while a dialogue is open — the rule
  // was guarding an impossible state and paying for it with the tool tiles.
  const ex = $("examineBar"); if(ex) ex.classList.add("hidden");
  d.querySelector(".who").textContent = who;
  drawPortrait(portraitName || "port_valley");
  dlg.open = true; dlg.full = txt; dlg.i = 0; dlg.done = false;
  const el = d.querySelector(".txt"); el.textContent = "";
  clearInterval(dlg.timer);
  dlg.timer = setInterval(() => {
    dlg.i++; el.textContent = dlg.full.slice(0, dlg.i);
    if(dlg.i % 2 === 0) playSfx("blipTalk");
    if(dlg.i >= dlg.full.length){ clearInterval(dlg.timer); dlg.done = true; }
  }, 22);
}
function advanceDialog(){
  if(!dlg.open) return false;
  if(!dlg.done){ clearInterval(dlg.timer); dlg.i = dlg.full.length;
    $("dialog").querySelector(".txt").textContent = dlg.full; dlg.done = true; return true; }
  closeDialog(); return true;
}
function closeDialog(){ $("dialog").classList.add("hidden"); dlg.open = false; clearInterval(dlg.timer); $("stage").classList.remove("talking"); playSfx("menuClose"); }

// ---- HUD ----
// The gold counter eases toward its true value each frame (via a tween on goldUI.shown) and the
// pill pulses on the way — earning 400g reads as a little count-up, not a silent number-swap.
const goldUI = { shown: 0, target: null };
function syncGold(){
  const el = $("goldVal"); if(!el || !state) return;
  if(goldUI.target === null){ goldUI.target = goldUI.shown = state.gold; }
  else if(state.gold !== goldUI.target){
    const up = state.gold > goldUI.target;
    goldUI.target = state.gold;
    retween(goldUI, "shown", state.gold, 0.5);
    const pill = $("goldPill");
    if(pill){ pill.classList.remove("earn","spend"); void pill.offsetWidth; pill.classList.add(up ? "earn" : "spend"); }
  }
  // v4.26: thousands separators. Once the commissions give coin somewhere to go, a purse runs to seven
  // figures, and "1500000" is a run of digits nobody can read at a glance.
  el.textContent = Math.round(goldUI.shown).toLocaleString();
}
function refreshHUD(){
  if(!state) return;
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  const d = ((state.day-1)%SEASON_DAYS)+1;
  $("dateLine").textContent = seas + " · Day " + d + "  " + weatherInfo(state.weather).icon;
  let h = Math.floor(state.time/60)%24, m = Math.floor(state.time%60/10)*10;
  const ap = h>=12 ? "pm":"am"; let h12 = h%12; if(h12===0) h12=12;
  $("timeLine").textContent = (state.deepRun ? "⏱ " : "") + h12 + ":" + String(m).padStart(2,"0") + " " + ap;
  // gold is drawn by syncGold() each frame so it counts up (see below); don't snap it here
  const e = state.energy, bar = $("energyBar");
  bar.style.width = e + "%";
  { const el = $("energyLabel"); if(el) el.textContent = "ENERGY " + Math.round(e); }   // v4.9: a plannable number, not just an eyeballed bar
  // Warm all the way down — green → gold → deep amber. Energy is deliberately non-hazardous (you can
  // always eat or sleep), so "low" must not read as a survival-red alarm at the player (Cozy Contract
  // + palette discipline 8.1): the narrowing bar already says "low"; the tone just deepens, never reddens.
  bar.style.background = e>50 ? "linear-gradient(#b6f27a,#5aa733)"
                       : e>22 ? "linear-gradient(var(--gold-hi),var(--gold))"
                       :        "linear-gradient(var(--gold),var(--gold-d))";
  // v4.0: the Resolve bar shows only inside a combat map (the Undercroft); elsewhere it's hidden
  // and irrelevant. inCombatMap()/resolveMax() live in 15-warding.js.
  const rw = $("resolveWrap");
  if(rw){
    const combat = typeof inCombatMap === "function" && inCombatMap();
    rw.classList.toggle("hidden", !combat);
    const gb = $("btnGuard"); if(gb) gb.classList.toggle("hidden", !(combat && IS_TOUCH));   // v4.4: the touch 🛡 appears only in the Undercroft
    if(combat){
      const rmax = resolveMax(), rp = Math.max(0, Math.min(rmax, state.resolve || 0));
      const rbar = $("resolveBar"); rbar.style.width = Math.round(rp/rmax*100) + "%";
      { const rl = $("resolveLabel"); if(rl) rl.textContent = "RESOLVE " + Math.round(rp) + "/" + rmax; }   // v4.9: exact Resolve — "one more hit?"
      const frac = rp/rmax;
      rbar.style.background = frac>0.5 ? "linear-gradient(#bfe4ff,#5a9ad8)"
                           : frac>0.25 ? "linear-gradient(#cfe0ff,#6a86d0)"
                           :             "linear-gradient(#dcd6ff,#8a7ad0)";   // deepens toward violet, never a red alarm
    }
  }
  refreshEventPill();
  drawClockDial();
}

// A gentle cue that only appears on the day itself or the eve of it — never a week-long countdown.
// Because every festival, the anniversary AND all five birthdays feed nextEvent() across a 112-day
// year, a 7-day window meant *something* was almost always inside it, so the pill read as permanent
// top-of-screen chrome — the "badge / nagging" the design bible (8.4) forbids. Tightening to
// today/tomorrow makes it vanish on the ~26 of 28 days when nothing's imminent; the full calendar
// still lives in the Almanac, and a one-line warm nudge is surfaced at wake (see showSleepCard).
function refreshEventPill(){
  const pill = $("eventPill"); if(!pill) return;
  const ev = nextEvent();
  if(!ev || ev.daysAway > 1){ pill.classList.add("hidden"); return; }
  const icon = ev.kind === "birthday" ? "🎂" : "✦";
  pill.textContent = ev.daysAway === 0 ? `${icon} ${ev.name} — today!`
                   : ev.daysAway === 1 ? `${icon} ${ev.name} — tomorrow`
                   : `${icon} ${ev.name} in ${ev.daysAway} days`;
  pill.classList.remove("hidden", "soon", "today");
  pill.classList.add(ev.daysAway === 0 ? "today" : "soon");
}
function drawClockDial(){
  const c = $("clockDial"); if(!c) return; const g = c.getContext("2d");
  g.clearRect(0,0,22,22);
  const h = curHour(), nf = nightFactor(h);
  g.save(); g.beginPath(); g.arc(11,13,10,Math.PI,0); g.closePath(); g.clip();
  g.fillStyle = gradHex(SKY_STOPS, h/24); g.fillRect(0,0,22,13);
  g.restore();
  g.fillStyle = "#3a2c1c"; g.fillRect(1,13,20,8);
  const dt = clamp(inv(h,6,20),0,1), ang = Math.PI - dt*Math.PI;
  const sx = 11 + Math.cos(ang)*8, sy = 13 - Math.sin(ang)*8;
  if(nf > 0.5){ g.fillStyle = "#e8ecf0"; g.beginPath(); g.arc(sx,sy,2.4,0,7); g.fill(); g.fillStyle=gradHex(SKY_STOPS,h/24); g.beginPath(); g.arc(sx+1.4,sy-0.6,2,0,7); g.fill(); }
  else { g.fillStyle = "#ffd75a"; g.beginPath(); g.arc(sx,sy,3,0,7); g.fill(); g.fillStyle="#fff0a0"; g.beginPath(); g.arc(sx,sy,1.4,0,7); g.fill(); }
  g.strokeStyle = "#00000066"; g.lineWidth=1; g.beginPath(); g.arc(11,13,10,Math.PI,0); g.stroke();
}

// ---- XP orbs ----
// The RuneScape hover-orb, adopted: circular rings that fill clockwise with your progress through
// the CURRENT level, the skill's icon in the middle and the level in a badge below. They exist
// because "+12 farm" floaters answer *what you earned* but never *how far along you are* —
// grinding felt like pouring XP into the dark. Each skill you train gets its OWN orb; train
// several in quick succession (cook the fish you just caught, chop on the way home) and the orbs
// line up SIDE BY SIDE in a rail at top-center — the RS placement, and the one spot the HUD keeps
// deliberately clear (clock left, gold right). Each orb eases its arc toward its new fraction, on
// a level-up sweeps to full, flashes, then resets to the remainder, and fades ~3s after ITS last
// gain — training-time feedback, never permanent HUD chrome (design bible 8.4).
const _xpOrbs = new Map();   // skill -> { el, cv, badge, lvl, shown, target, sweep, flash, hideT }
let _orbRaf = 0, _orbLast = 0;
function xpFrac(skill){
  // v5.1: effective level, and a held craft's ring reads FULL — its XP genuinely is past the top of
  // the level it is standing on. (`clamp` already guarded the overflow; this makes it deliberate.)
  const xp = state.skills[skill], lvl = skillLvl(skill);
  return lvl >= 99 ? 1 : clamp(inv(xp, XP_TABLE[lvl], XP_TABLE[lvl+1]), 0, 1);
}
function showXpOrb(skill){
  const rail = $("xpOrbs"); if(!rail || !state || !(skill in state.skills)) return;
  const lvl = skillLvl(skill), frac = xpFrac(skill);   // v5.1: the orb shows the level the game treats you as
  let o = _xpOrbs.get(skill);
  if(!o || !o.el.isConnected){
    // first gain for this skill — build its orb and slot it onto the rail
    const el = document.createElement("div"); el.className = "xpOrbItem in";
    const cv = document.createElement("canvas"); cv.width = 96; cv.height = 96;
    const badge = document.createElement("span"); badge.className = "olvl"; badge.textContent = lvl;
    el.appendChild(cv); el.appendChild(badge); rail.appendChild(el);
    o = { el, cv, badge, lvl, shown:frac, target:frac, sweep:false, flash:0, hideT:0 };
    _xpOrbs.set(skill, o);
  } else if(lvl > o.lvl){
    // levelled up — sweep the ring to full first; the tick resets it to the new remainder
    o.lvl = lvl; o.sweep = true; o.target = frac;
    o.badge.classList.remove("bump"); void o.badge.offsetWidth; o.badge.classList.add("bump");
  } else {
    o.target = frac;
  }
  o.badge.textContent = o.lvl;
  o.el.classList.remove("out");
  if(!_orbRaf){ _orbLast = performance.now(); _orbRaf = requestAnimationFrame(xpOrbTick); }
  clearTimeout(o.hideT);
  o.hideT = setTimeout(() => hideXpOrb(skill), 3200);
}
function hideXpOrb(skill){
  const o = _xpOrbs.get(skill); if(!o) return;
  // never cut off the level-up payoff — if the ring is mid-sweep (or still flashing), come back
  if(o.sweep || o.flash > 0){ o.hideT = setTimeout(() => hideXpOrb(skill), 600); return; }
  o.el.classList.add("out");
  setTimeout(() => {
    o.el.remove();
    if(_xpOrbs.get(skill) === o) _xpOrbs.delete(skill);
    if(!_xpOrbs.size && _orbRaf){ cancelAnimationFrame(_orbRaf); _orbRaf = 0; }
  }, 380);
}
function xpOrbTick(now){
  const dt = Math.min(0.05, (now - _orbLast)/1000); _orbLast = now;
  for(const [skill, o] of _xpOrbs){
    if(o.sweep){
      o.shown += dt * 2.4;                                   // fast, readable sweep to full
      if(o.shown >= 1){ o.shown = 0; o.sweep = false; o.flash = 0.5; }
    } else {
      o.shown += (o.target - o.shown) * Math.min(1, dt*6);   // ease toward the new fraction
      if(Math.abs(o.target - o.shown) < 0.002) o.shown = o.target;
    }
    if(o.flash > 0) o.flash = Math.max(0, o.flash - dt);
    drawXpOrb(skill, o);
  }
  _orbRaf = _xpOrbs.size ? requestAnimationFrame(xpOrbTick) : 0;
}
function drawXpOrb(skill, o){
  const g = o.cv.getContext("2d"); g.clearRect(0,0,96,96);
  const cx = 48, cy = 48;
  // inner disc — the same dark wood as the tracker cards
  g.beginPath(); g.arc(cx,cy,34,0,7); g.fillStyle = "rgba(30,22,15,.88)"; g.fill();
  // track ring — near-black, like the unfilled ring in RS
  g.beginPath(); g.arc(cx,cy,39,0,7); g.lineWidth = 9; g.strokeStyle = "rgba(12,9,6,.92)"; g.stroke();
  // progress arc — gold, clockwise from 12 o'clock
  if(o.shown > 0.004){
    const grad = g.createLinearGradient(0,0,0,96);
    grad.addColorStop(0,"#ffe6a0"); grad.addColorStop(1,"#ffce5a");
    g.beginPath(); g.arc(cx,cy,39,-Math.PI/2, -Math.PI/2 + o.shown*Math.PI*2);
    g.lineWidth = 9; g.lineCap = "round"; g.strokeStyle = grad; g.stroke(); g.lineCap = "butt";
  }
  // level-up flash — a soft bloom over the whole ring that decays
  if(o.flash > 0){
    g.beginPath(); g.arc(cx,cy,39,0,7); g.lineWidth = 13;
    g.strokeStyle = `rgba(255,240,190,${(o.flash*1.4).toFixed(3)})`; g.stroke();
  }
  // hairline edges keep it crisp against any backdrop
  g.lineWidth = 2; g.strokeStyle = "rgba(0,0,0,.55)";
  g.beginPath(); g.arc(cx,cy,44.5,0,7); g.stroke();
  g.beginPath(); g.arc(cx,cy,33.5,0,7); g.stroke();
  // the skill's icon, pixel-crisp at 3x, centred
  const s = spr[SKILL_ICON[skill]];
  if(s){ g.imageSmoothingEnabled = false; g.drawImage(s, cx-24, cy-24, 48, 48); }
}

// ---- icons ----
function mkIcon(spriteName){
  const s = spr[spriteName];
  const c = document.createElement("canvas");
  c.width = s ? s.width : 16; c.height = s ? s.height : 16;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  if(s) g.drawImage(s,0,0);
  return c;
}

// ---- hotbar ----
function refreshHotbar(){
  const hb = $("hotbar"); if(!hb) return; hb.innerHTML = "";
  HOTBAR.forEach((slot, i) => {
    const d = document.createElement("div");
    d.className = "slot" + (i===slotSel ? " sel" : "");
    let iconName, name, tierIdx = null, count = null;
    if(slot.tool === "Seeds"){
      normalizeSeedSel();
      name = plantableName(state.seedSel);
      iconName = plantableIcon(state.seedSel);
      count = isHiveSel(state.seedSel) ? (state.inv["Beehive"]||0)
            : isSapSel(state.seedSel)  ? (state.inv[FRUIT_TREES[state.seedSel.slice(4)].name]||0)
            : (state.inv[name] || 0);
    } else {
      iconName = "tool_" + TOOL_ICON[slot.tool];
      tierIdx = state.tools[slot.tool];
      name = TOOL_TIERS[tierIdx] + " " + slot.tool;
    }
    d.appendChild(mkIcon(iconName));
    const kk = document.createElement("span"); kk.className="key"; kk.textContent = i+1; d.appendChild(kk);
    if(count !== null){ const cn = document.createElement("span"); cn.className="cnt"; cn.textContent = "×"+count; d.appendChild(cn); }
    if(tierIdx !== null && tierIdx > 0){ const tp = document.createElement("span"); tp.className="tier"; tp.textContent="◆"; tp.style.color = TIER_COL[tierIdx]; d.appendChild(tp); }
    const nm = document.createElement("span"); nm.className="slotName"; nm.textContent = name; d.appendChild(nm);
    // v4.19: tapping the Seeds tile when it's ALREADY selected cycles what's in hand — the touch parity
    // for R (which had no touch path at all). Any other tile, or a first tap, just selects as before.
    // v4.29: a second tap on the Seeds tile now opens the PICKER rather than advancing a blind ring.
    // Cycling still exists on R (and it is short now — in-season, in-stock only), but choosing what to
    // plant should be a choice you make by looking, not by pressing until the right thing comes round.
    d.onclick = (slot.tool === "Seeds")
      ? () => { if(i === slotSel) openSeedPicker(); else selectSlot(i); }
      : () => selectSlot(i);
    hb.appendChild(d);
  });
}

// ---- v4.29 the seed / placeable picker ----
// Owner playtest: "there's an inventory slot for every tool, but the miscellaneous slot — I just have to
// cycle through a thousand options. Different seeds that I don't even know if it's in season… all the
// trees are there, all the seeds, all of the miscellaneous items you can place down. It doesn't seem
// natural." Right on every count: `plantables()` returned one flat ring mixing four different KINDS of
// thing, and the only way through it was pressing R until the right one came round.
//
// So: a grid, grouped by kind, with the season stated on every seed and the out-of-season ones dimmed
// rather than hidden — you can still deliberately pick one (buying ahead for next season is a real thing
// to want), you just can't stumble onto it by cycling, because the CYCLE is now in-season + in-stock only.
function openSeedPicker(){ openPanel("seedPanel", renderSeedPicker); }
// Is this item NAME something you set down on the farm? Built once, lazily, from the same four
// tables plantables() walks — so it can never drift out of step with what the board can list.
let _placeableNames = null;
function isPlaceableName(name){
  if(!_placeableNames){
    _placeableNames = new Set(["Beehive"]);
    for(const k in FRUIT_TREES) _placeableNames.add(FRUIT_TREES[k].name);
    for(const k in MACHINES)    _placeableNames.add(MACHINES[k].name);
    for(const k in DECOR)       _placeableNames.add(DECOR[k].name);
  }
  return _placeableNames.has(name);
}
function renderSeedPicker(){
  const b = $("seedPanel").querySelector(".body");
  const seas = curSeason(), lvl = skillLvl("Farming");
  const cell = (sel, icon, label, sub, dim, count) =>
    `<div class="seedCell${dim?" dim":""}${state.seedSel===sel?" sel":""}" data-icon="${icon}" onclick="pickPlantable('${jsq(sel)}')">` +
      `<canvas></canvas><span class="scName">${label}</span>` +
      (count != null ? `<span class="scCnt">×${count}</span>` : "") +
      `<span class="scSub">${sub}</span></div>`;
  let h = "", any = false;

  // --- seeds, in season first ---
  const crops = Object.keys(CROPS).filter(id => lvl >= CROPS[id].lvl && (state.inv[CROPS[id].name+" Seeds"]||0) > 0);
  if(crops.length){
    any = true;
    crops.sort((a,bb) => (CROPS[bb].seasons.includes(seas)?1:0) - (CROPS[a].seasons.includes(seas)?1:0));
    h += `<div class="secHead">🌱 Seeds</div><div class="seedGrid">` + crops.map(id => {
      const c = CROPS[id], inSeason = c.seasons.includes(seas);
      return cell(id, "item_"+c.name+" Seeds", c.name, inSeason ? "in season" : c.seasons.join(" & "),
                  !inSeason, state.inv[c.name+" Seeds"]||0);
    }).join("") + `</div>`;
  }
  // --- saplings & hives ---
  const perm = [];
  for(const k in FRUIT_TREES) if((state.inv[FRUIT_TREES[k].name]||0) > 0)
    perm.push(cell("sap:"+k, "item_"+FRUIT_TREES[k].name, FRUIT_TREES[k].name, FRUIT_TREES[k].season + " fruit", false, state.inv[FRUIT_TREES[k].name]));
  if((state.inv["Beehive"]||0) > 0) perm.push(cell("hive", "beehive", "Beehive", "needs flowers near", false, state.inv["Beehive"]));
  if(perm.length){ any = true; h += `<div class="secHead">🌳 Orchard & Apiary</div><div class="seedGrid">${perm.join("")}</div>`; }
  // --- machines ---
  const mach = [];
  for(const k in MACHINES) if((state.inv[MACHINES[k].name]||0) > 0)
    mach.push(cell("mach:"+k, "item_"+MACHINES[k].name, MACHINES[k].name, "workshop", false, state.inv[MACHINES[k].name]));
  if(mach.length){ any = true; h += `<div class="secHead">⚙ Workshop</div><div class="seedGrid">${mach.join("")}</div>`; }
  // --- décor ---
  const dec = [];
  for(const k in DECOR) if((state.inv[DECOR[k].name]||0) > 0)
    dec.push(cell("decor:"+k, "item_"+DECOR[k].name, DECOR[k].name, "décor", false, state.inv[DECOR[k].name]));
  if(dec.length){ any = true; h += `<div class="secHead">✿ Décor</div><div class="seedGrid">${dec.join("")}</div>`; }

  if(!any) h = `<div class="locked">Nothing to plant or place just yet — buy a few seeds at Tom's.</div>`;
  else h += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">Dimmed seeds are out of season — you can still choose one to sow when its season comes round.</div>`;
  // v4.33: placeables are listed from state.inv ONLY (plantables(), 08-actions.js:128-131), so a hive
  // or a keg sitting in the cottage chest is not dimmed here — it is absent entirely, with nothing to
  // say why. Buying one can't put it there (all four purchase paths pass quiet, so they bypass the
  // pack cap), but STORING one can, and a board that silently omits something you own is the same
  // "where did it go?" the chest must never cause.
  {
    const stored = Object.keys(state.shelf || {}).filter(it => isPlaceableName(it));
    if(stored.length)
      h += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">` +
           `<span style="color:var(--gold-hi)">${stored.join(", ")}</span> ` +
           `${stored.length===1?"is":"are"} in your cottage chest — fetch ${stored.length===1?"it":"them"} to set ${stored.length===1?"it":"them"} down.</div>`;
  }
  b.innerHTML = h;
  hydrateIcons(b);
}
function pickPlantable(sel){
  state.seedSel = sel; slotSel = 5;
  refreshHotbar(); playSfx("select");
  closePanel("seedPanel");
  toast("Selected: " + plantableName(sel), "#8fd06a");
}

// ---- quest tracker ----
// v4.26 "The Long Sight" — the standing goals card. Past the story (and the Warden's Round), trackerData()
// returns null and #questTracker rendered a LITERALLY EMPTY box for the rest of the save — hundreds of
// hours with nothing on screen naming what you are building toward. This is read-only projection of
// numbers already stored: no XP, no gold, no items, no rate change, nothing to accelerate.
//
// MEMOIZED, and it has to be: refreshQuestTracker is called from checkQuests, which runs unconditionally
// at the end of EVERY addXP — 50-200×/day beside a 60fps canvas loop. The shelf line alone would otherwise
// re-invoke all 13 MUSEUM items() closures (re-mapping CROPS, FISH, RECIPES, CHARMS and flat-mapping
// CREATURES) on every single swing. Invalidated on a day change and whenever a new item is discovered.
let _goalCache = null, _goalStamp = "";
function invalidateGoals(){ _goalCache = null; }
function standingGoalsHtml(){
  if(gameMode !== "play" || !state || !state.skills) return "";
  const stamp = state.day + ":" + (state.discovered ? Object.keys(state.discovered).length : 0);
  if(_goalCache !== null && _goalStamp === stamp) return _goalCache;
  _goalStamp = stamp;
  const rows = [];
  // 1) the closest craft to 99 — rotate DAILY through the unfinished ones (never `day % 6`, which lands
  //    on an already-99 skill and prints "Farming 99 → 99"), and prefer one with sparks left today so the
  //    line reinforces v4.23's rhythm rather than parking you in whichever craft is deepest in the desert.
  const unfinished = Object.keys(state.skills).filter(s => skillLvl(s) < 99);
  if(unfinished.length){
    const sparky = unfinished.filter(s => sparkCap() - ((state.dailyXpActs && state.dailyXpActs[s]) || 0) > 0);
    const pool = sparky.length ? sparky : unfinished;
    const s = pool[state.day % pool.length];
    rows.push(`<div class="qt-obj">✦ ${s} ${skillLvl(s)} <span class="sub">→ 99</span></div>`);
  }
  // 2) the shelf closest to done — a concrete, findable errand
  if(typeof MUSEUM !== "undefined"){
    let best = null;
    for(const sec of MUSEUM){
      const c = collSectionCount(sec); const left = c.total - c.found;
      if(left > 0 && (!best || left < best.left)) best = { name:sec.name, left, ...c };
    }
    if(best) rows.push(`<div class="qt-obj">🗃 ${best.name} <span class="sub">${best.found}/${best.total}</span></div>`);
  }
  // 3) the crown, counted in LEVELS — never raw XP; "3,488,124 XP remaining" fights the curve's own stated
  //    intent that the climb is paced to be savoured.
  if(!state.flags.valleyMaster && typeof totalLevel === "function")
    rows.push(`<div class="qt-obj">♛ Total ${totalLevel()} <span class="sub">/ ${99*Object.keys(state.skills).length} · the Valley's Crown</span></div>`);
  _goalCache = rows.length
    ? `<div class="qt-card" style="opacity:.9"><div class="qt-title" style="color:#cbb98f">✦ The long sight</div>${rows.join("")}</div>`
    : "";
  return _goalCache;
}

function refreshQuestTracker(){
  const box = $("questTracker"); if(!box) return;
  const q = trackerData();
  let html = "";
  if(q){
    html += `<div class="qt-card"><div class="qt-act">${actInfo().title}</div><div class="qt-title">✒ ${q.title}</div>`;
    for(const o of q.objs){
      html += `<div class="qt-obj ${o.done?"done":""}">${o.done?'<span class="chk">✔</span> ':"• "}${o.text}` +
              (o.max>1 && !o.done ? ` (${o.cur}/${o.max})` : "") + `</div>`;
    }
    if(q.reportTo) html += `<div class="qt-obj" style="color:var(--gold-hi)">▸ ${q.ledger ? "Close the page at" : "Report to"} ${q.reportTo}</div>`;
    html += `</div>`;
  }
  html += boardTrackerHtml();
  // v4.26: ONLY when there is no live quest/ledger card. Never append it faintly alongside one — the
  // v3.x event-pill lesson (tightened because "*something* was almost always inside the window, so it read
  // as permanent top-of-screen chrome") applies exactly here: #questTracker is ~36% of a 320×208 stage, and
  // a ledger card + a board card + a 3-line standing card is ten lines of overlay in a third of the screen.
  if(!q) html += standingGoalsHtml();
  box.innerHTML = html;
}
// a faint second card for today's noticeboard request — the small, skippable goal of the day
function boardTrackerHtml(){
  if(gameMode !== "play" || !state || !state.flags) return "";
  if(requestFilled()) return "";
  const r = todaysRequest(); if(!r) return "";
  const have = state.inv[r.item] || 0, ready = have >= r.qty;
  const stored = chestQty(r.item);   // v4.33's rule, applied to the board: never let the chest read as a loss
  return `<div class="qt-card" style="opacity:.82"><div class="qt-title" style="color:#cbb98f">📌 Noticeboard</div>` +
    `<div class="qt-obj ${ready?"done":""}">${ready?'<span class="chk">✔</span> ':"• "}${r.qty} × ${r.item} — ${NPCDEF[r.who].name}` +
    (ready ? "" : ` (${have}/${r.qty})`) + `</div>` +
    (!ready && stored ? `<div class="qt-obj" style="color:var(--gold-hi)">▸ ${stored} in your cottage chest</div>` : "") +
    (ready ? `<div class="qt-obj" style="color:var(--gold-hi)">▸ Take them to ${NPCDEF[r.who].name}</div>` : "") +
    `</div>`;
}

// ---- panels ----
// v5.0: two panels open OVER the title screen (What's New, and now Save File). The title's logo and
// menu sit at z-index 20 and were painting through them; worse, the live "New Game" button stayed
// clickable behind an open panel — one stray click from overwriting the very save the Save File panel
// exists to protect. This dims and disarms the title menu for as long as any panel is up.
function syncTitleDim(){ const t = $("title"); if(t) t.classList.toggle("panelopen", openPanels.size > 0); }
function openPanel(id, render){
  closeAllPanels(true);
  openPanels.add(id); $(id).classList.remove("hidden");
  if(render) render();
  syncTitleDim();
  playSfx("menu");
}
function closePanel(id){ if(openPanels.has(id)){ openPanels.delete(id); $(id).classList.add("hidden"); syncTitleDim(); playSfx("menuClose"); } }
function closeAllPanels(silent){ for(const id of Array.from(openPanels)){ openPanels.delete(id); $(id).classList.add("hidden"); } syncTitleDim(); if(!silent && dlg.open) closeDialog(); if(!dlg.open) $("stage").classList.remove("talking"); }   // v4.28: never leave the belt hidden
function togglePanel(id, render){ if(openPanels.has(id)) closePanel(id); else openPanel(id, render); }

// A shared tab-strip component. Panels that page their .body (Shop, Journal) render their tab row
// into a sibling strip via this; the active tab is remembered per-panel in _panelTab, so a
// re-render (funding a pledge, switching seasons) keeps you on the same page for free.
const _panelTab = {};
function panelTabs(panelId, stripId, tabs, render){
  const strip = $(stripId); if(!strip) return tabs[0][0];
  const active = _panelTab[panelId] || (_panelTab[panelId] = tabs[0][0]);
  strip.innerHTML = tabs.map(([k,l]) => `<div class="tab ${k===active?"active":""}" data-tab="${k}">${l}</div>`).join("");
  strip.querySelectorAll(".tab").forEach(t => t.onclick = () => { _panelTab[panelId] = t.dataset.tab; playSfx("select"); render(); });
  return active;
}

// ---- Skills panel: a RuneScape-style skill grid ----
// A compact tile per skill — procedural icon + level badge + XP bar + one muted next-goal line —
// instead of the old wall of prose. The full detail (exact XP, remaining to next, earned masteries
// and the whole 25/50/75/99 table) opens on tap, one skill at a time, so the reference is all still
// there (principle 4.3) without burying the levels. Icons reuse the mkIcon/hydrateIcons sprite
// pipeline; every colour role is the pre-blessed one (level --gold, bar --blue, unlock --blue,
// mastery --gold-hi, next-mastery --ink-soft) — no new hex, no new frame.
const SKILL_ICON = { Farming:"item_Turnip", Woodcutting:"item_Wood", Mining:"item_Stone", Fishing:"item_Sardine", Cooking:"item_Berry Bun", Warding:"item_Stave" };   // v4.0
let skillSel = null;   // which skill's detail is expanded (null = grid only)
function selectSkill(s){ skillSel = (skillSel === s) ? null : s; playSfx("select"); renderSkills(); }
// v4.11 (owner update 1) — a RuneScape-style Skill Guide: EVERY level that unlocks something, for the
// whole climb to 99, built straight from unlocksAt (so it can never drift from the real gates). Reached
// milestones are ticked + gold; the rest are dimmed and padlocked. Scrolls inside the detail panel.
function skillGuideHtml(s){
  const lvl = skillLvl(s);   // v5.1
  let rows = "", count = 0;
  for(let L = 1; L <= 99; L++){
    const u = (typeof unlocksAt === "function") ? unlocksAt(s, L) : [];
    if(!u.length) continue;
    count++;
    const got = lvl >= L;
    rows += `<div style="display:flex;gap:.5em;padding:1px 4px;${got?'':'opacity:.5;'}">` +
      `<span style="min-width:3.4em;font-weight:bold;color:${got?'var(--gold-hi)':'var(--ink-soft)'};">${got?'✔':'🔒'} ${L}</span>` +
      `<span style="flex:1;">${u.join(", ")}</span></div>`;
  }
  // v4.20 — Warding's families used to be listed as LEVEL unlocks, which was simply false: the Undercroft
  // spawns by DEPTH (WARD_BANDS), so the guide padlocked the Great Knot at "level 40" while you meet it on
  // floor 10. They're shown here honestly instead — by the floor you first meet them, derived from the same
  // table the spawner uses, and never padlocked (there is no level to reach; you just go down).
  let extra = "";
  if(s === "Warding" && typeof wardFirstFloor === "function"){
    const fams = Object.keys(CREATURES)
      .filter(k => k !== "tanglet" && !CREATURES[k].boss && wardFirstFloor(k) != null)
      .map(k => ({ name:CREATURES[k].name, floor:wardFirstFloor(k) }))
      .sort((a,b) => a.floor - b.floor);
    if(fams.length){
      extra = `<div style="margin-top:.4em;padding-top:.3em;border-top:1px solid rgba(255,255,255,.08);">` +
        `<div style="color:var(--ink-soft);margin-bottom:.15em;">The wing itself, by depth — not by level:</div>` +
        fams.map(f => `<div style="display:flex;gap:.5em;padding:1px 4px;${(state.wardBest||0) >= f.floor ? "" : "opacity:.5;"}">` +
          `<span style="min-width:4.6em;font-weight:bold;color:var(--blue,#bfe4ff);">floor ${f.floor}</span>` +
          `<span style="flex:1;">${f.name}</span></div>`).join("") +
        `<div style="display:flex;gap:.5em;padding:1px 4px;${(state.wardBest||0) >= 10 ? "" : "opacity:.5;"}">` +
        `<span style="min-width:4.6em;font-weight:bold;color:var(--blue,#bfe4ff);">every 10th</span>` +
        `<span style="flex:1;">${CREATURES.greatknot ? CREATURES.greatknot.name : "The Great Knot"}</span></div></div>`;
    }
  }
  return `<details class="skillGuide"><summary style="cursor:pointer;color:var(--gold-hi);margin-top:.5em;font-size:.95em;">📖 Skill guide — everything ${s} unlocks (${count} milestones)</summary>` +
    `<div style="max-height:210px;overflow-y:auto;margin-top:.3em;font-size:.92em;line-height:1.4;border-top:1px solid rgba(255,255,255,.08);padding-top:.2em;">${rows}${extra}</div></details>`;
}
function skillDetailHtml(s){
  if(!s || !(s in state.skills))
    return `<div class="skillHint">Tap a skill for its XP, unlocks and mastery milestones.</div>`;
  const xp = state.skills[s], lvl = skillLvl(s), raw = levelFor(xp);
  const next = lvl>=99 ? xp : XP_TABLE[lvl+1], remain = Math.max(0, next - xp);
  let h = `<div class="sdHead"><span class="sdName">${s}</span><span class="sdLvl">Level ${lvl}</span></div>`;
  // v5.1: "0 to Lv 51" is nonsense while a trial holds the level — the XP is already past it. Say
  // what is actually true: how much is banked and waiting.
  const heldAt = trialCurrent(s);
  h += `<div class="sdXp">${xp.toLocaleString()} XP` +
       (lvl>=99   ? ` · <span class="max">MAX</span>`
        : heldAt  ? ` · <span class="max">banked past Lv ${lvl}</span>`
        :           ` · ${remain.toLocaleString()} to Lv ${lvl+1}`) + `</div>`;
  // v5.1: when a trial is holding this craft, the detail strip says so FIRST, in full — what is
  // held, how much is banked, who is waiting, and exactly what they asked for. Everything about the
  // hold has to be legible from one place, or "banked" is just a word we used once in a banner.
  const gate = heldAt;
  if(gate){
    const d = trialDef(s, gate), who = (NPCDEF[MASTERY_NPC[s]] || {}).name || "";
    const rem = pledgeRemaining(trialId(s, gate)), owed = [];
    if(rem.g > 0) owed.push(`${rem.g.toLocaleString()}g`);
    for(const it in rem.mats) owed.push(`${rem.mats[it]}× ${it}`);
    h += `<div class="sdLine trial">✦ <b>${escapeHtml(d.title)}</b> — ${escapeHtml(who)} asks, before ${s} goes past ${gate}.</div>`;
    h += `<div class="sdLine muted">${escapeHtml(d.ask)}</div>`;
    h += `<div class="sdLine">Still owed: ${owed.length ? escapeHtml(owed.join(", ")) : "nothing — go and see " + escapeHtml(who)}</div>`;
    h += `<div class="sdLine bank">⏸ Held at ${gate}${raw > gate ? ` · ${raw - gate} level${raw-gate>1?"s":""} banked and waiting` : ""} — XP keeps counting, and none of it can be lost. There is no timer.</div>`;
  }
  const un = nextUnlock(s);
  if(un) h += `<div class="sdLine unlock">▸ Unlocks ${un.label} at Lv ${un.at}</div>`;
  const earned = [25,50,75,99].filter(n => lvl >= n);
  if(earned.length) h += earned.map(n => `<div class="sdLine earned">★ ${MASTERY[s][n]}</div>`).join("");
  const nx = nextMastery(s);
  if(nx) h += `<div class="sdLine next">☆ Lv ${nx.at}: ${nx.text}</div>`;
  else if(!un) h += `<div class="sdLine earned">Mastered — every craft learned.</div>`;
  h += skillGuideHtml(s);   // v4.11: the full unlock ladder, 1→99
  return h;
}
function renderSkills(){
  const b = $("skillsPanel").querySelector(".body");
  let total = 0; for(const s in state.skills) total += skillLvl(s);   // v5.1: the total counts EFFECTIVE levels — the same number every gate and cape reads
  // v4.0: the cap is derived from the live skill count (594 with Warding), so it never drifts again.
  let html = `<div class="skillTotal">Total Level <b>${total}</b> / ${99*Object.keys(state.skills).length}</div>`;
  // v4.0 variety spark — a quiet nudge to rotate: the first few actions in each skill each day earn +50% XP.
  // v4.23: show the spark COUNT the day's rhythm has actually bought, not a static promise — the number
  // climbs live as you touch a new craft, which is the whole point of the rhythm term.
  html += `<div class="sparkNote">✦ <b>Variety spark</b> — the first <b>${sparkCap()}</b> actions in each craft today earn +50% XP, and every craft you take up today adds 5 more to all of them.</div>`;
  html += `<div class="skillGrid">`;
  for(const s in state.skills){
    // v5.1: the tile shows the EFFECTIVE level (skillLvl), because that is the level the game is
    // treating you as — but when a trial is holding it, the raw progress and the banked count are
    // spelled out right there. A held level that doesn't explain itself is indistinguishable from
    // a bug, and this panel is where a player will come looking.
    const xp = state.skills[s], lvl = skillLvl(s);
    const cur = XP_TABLE[lvl], next = lvl>=99?cur:XP_TABLE[lvl+1];
    const gate = trialCurrent(s), tdef = gate ? trialDef(s, gate) : null, banked = trialBanked(s);
    // Held at a gate, the XP is already past the top of this level — the bar is genuinely full, and
    // showing it full (rather than letting `inv` run past 1) is the honest picture of a bank.
    const pct = (lvl >= 99 || gate) ? 100 : Math.floor(inv(xp,cur,next)*100);
    const un = nextUnlock(s), nx = nextMastery(s);
    const spk = Math.max(0, sparkCap() - ((state.dailyXpActs && state.dailyXpActs[s]) || 0));   // sparks left today (v4.23: clamp — the cap can rise mid-day, never let this read negative)
    const sparkBadge = spk > 0 ? `<span class="sgoal spark">✦ ${spk} spark${spk>1?"s":""} left today</span>` : "";
    // Kept SHORT on purpose: `.sgoal` is one nowrap line in a narrow grid cell — measured, anything
    // longer than ~14 characters ellipsises, and a truncated name ("Tom as…") is worse than none.
    // The tile flags THAT a trial is waiting; tapping it names who, what, and what's still owed.
    const goal = gate ? `<span class="sgoal trial">✦ Trial waiting</span>`
               : un ? `<span class="sgoal unlock">▸ ${un.label} · ${un.at}</span>`
               : nx ? `<span class="sgoal mast">☆ Lv ${nx.at}: ${MASTERY[s][nx.at].split(" — ")[0]}</span>`
               :      `<span class="sgoal done">★ mastered</span>`;
    const bankBadge = banked > 0
      ? `<span class="sgoal bank">⏸ ${banked} level${banked>1?"s":""} banked, nothing lost</span>`
      : (gate ? `<span class="sgoal bank">⏸ held at ${gate} — XP still banks</span>` : "");
    html += `<div class="skillCell${s===skillSel?" sel":""}" onclick="selectSkill('${s}')">` +
      `<span class="sIcon" data-icon="${SKILL_ICON[s]}"><canvas></canvas><span class="sLvl">${lvl}</span></span>` +
      `<span class="sBody"><span class="sName">${s}</span>` +
      `<span class="xpbarWrap"><span class="xpbar${gate?" held":""}" style="width:${pct}%"></span></span>` +
      goal + bankBadge + sparkBadge + `</span></div>`;
  }
  html += `</div><div id="skillDetail">${skillDetailHtml(skillSel)}</div>`;
  html += `<details class="skillHelp"><summary>About the XP curve</summary>` +
    `<div>Levels are paced to be savored — each takes a little more than the last, and only the final stretch to 99 is a true completionist climb. Every skill earns a mastery at 25 · 50 · 75 · 99.</div></details>`;
  b.innerHTML = html;
  hydrateIcons(b);   // draw the skill-tile icons (the old panel declared an icon map but never used it)
}
// The Backpack, Stardew-style: a visual grid of item tiles (icon + a corner stack count), sorted
// into the same category sections the Collection uses, with the examine flavour, sell/energy value
// and the charm's wear control moved onto a tap-to-open detail strip — so the bag reads at a glance
// instead of as a wall of one-line-plus-italic-paragraph rows.
let invSel = null;
function selectInvItem(it){ invSel = (invSel === it ? null : it); playSfx("select"); renderInv(); }
function invDetailHtml(it){
  if(!it || !state.inv[it]) return "";   // empty → the sticky detail bar collapses (see #invDetail:not(:empty))
  let h = `<div class="sdHead"><span class="sdName">${it}</span><span class="sdLvl">×${state.inv[it]}</span></div>`;
  const bits = [];
  if(ITEM_SELL[it]) bits.push(`${sellPriceNow(it)}g each${sellPriceTag(it)}`);
  if(EDIBLE[it])    bits.push(`+${EDIBLE[it]} energy`);
  if(bits.length) h += `<div class="sdXp">${bits.join(" · ")}</div>`;
  if(EXAMINE[it]) h += `<div class="sdLine muted" style="font-style:italic">${escapeHtml(EXAMINE[it])}</div>`;
  // v5.2: a Warden's tonic is drunk from the bag, at the start of a descent — deliberately not a
  // hotbar verb, because it is a decision you make once and never mid-swing.
  if(typeof WARD_TONICS !== "undefined"){
    const t = WARD_TONICS.find(x => x.out === it);
    if(t){
      h += `<div class="sdLine unlock">☕ ${escapeHtml(t.blurb)}</div>`;
      const here = (typeof inCombatMap === "function") && inCombatMap();
      const on = state.tonic && state.tonic.out === it;
      h += on ? `<div class="sdLine earned">working — until this descent ends</div>`
         : here ? `<button class="buy" onclick="drinkTonic('${jsq(it)}')">drink it</button>`
         : `<div class="sdLine muted">Keep it for the Undercroft — it does nothing up here.</div>`;
    }
  }
  if(CHARMS[it]){
    const worn = state.charm === it;
    h += `<div class="sdLine unlock">✦ ${CHARMS[it].effect}</div>`;
    h += worn ? `<button class="buy" onclick="wearCharm(null)">worn ✓ — take it off</button>`
              : `<button class="buy" onclick="wearCharm('${jsq(it)}')">wear this</button>`;
  }
  // v4.19: anything plantable/placeable can be chosen straight from the bag. Cycling (R) used to be the
  // ONLY way to set state.seedSel — unreachable without a keyboard, so touch play could never plant past
  // the default turnip or place a single machine or décor piece. Works on every input, and beats cycling
  // thirty-odd entries on desktop too.
  const psel = (typeof plantableFor === "function") ? plantableFor(it) : null;
  if(psel){
    const cur = state.seedSel === psel;
    h += cur ? `<button class="buy" disabled>selected ✓ — set it down with USE</button>`
             : `<button class="buy" onclick="selectPlantable('${jsq(psel)}')">select this to plant / place</button>`;
  }
  return h;
}
function renderInv(){
  const b = $("invPanel").querySelector(".body");
  const items = Object.keys(state.inv);
  // v4.31: an empty bag with a loaded chest must still point at the chest, or storing everything
  // reads as having lost it — the one impression this whole feature exists to prevent.
  if(!items.length){
    invSel = null;
    const n = Object.keys(state.shelf||{}).length;
    b.innerHTML = n ? `<div class="locked">Empty — but <span style="color:var(--gold-hi)">${n}</span> ${n===1?"thing is":"things are"} in your cottage chest, waiting for you.</div>`
                    : `<div class="locked">Empty. The valley provides — go get it!</div>`;
    return;
  }
  // bucket items into the same sections the Collection uses, so the bag reads sorted like Stardew's
  const SEC = {}; MUSEUM.forEach(s => s.items().forEach(n => SEC[n] = s.name));
  const groups = {};
  for(const it of items){ const g = SEC[it] || "Satchel"; (groups[g] = groups[g] || []).push(it); }
  // v4.30: sort each section by NAME. Tiles were laid out in Object.keys insertion order and take()
  // deletes a key at zero, so spending an item and re-earning it moved its tile to the end of its
  // section — the exact opposite of the fixed-slot muscle memory a bag is supposed to build.
  for(const g in groups) groups[g].sort((a,bb) => a.localeCompare(bb));
  const secOrder = MUSEUM.map(s => s.name).filter(n => groups[n]);
  if(groups["Satchel"]) secOrder.push("Satchel");
  // v4.31: the pack meter. A carry limit the player can't see is just an ambush, so the number is
  // stated wherever the bag is — and it names the two ways out (a bigger pack, or the chest) rather
  // than only reporting the problem.
  const kinds = bagKinds(), cap = bagCap(), shelved = Object.keys(state.shelf||{}).length;
  // The chest clause is written once and reads correctly in both positions — mid-sentence after a
  // "·", or sentence-initial when the pack is full. Starting the shelved form with the NUMBER means
  // no capitalisation is needed either way.
  const chest = shelved
    ? `<span style="color:var(--gold-hi)">${shelved}</span> ${shelved===1?"thing waits":"things wait"} in your cottage chest`
    : `New finds will wait in your cottage chest`;
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `Pack <span style="color:${kinds>=cap?"#e8a06a":"var(--gold-hi)"}">${kinds}/${cap}</span> kinds` +
    (kinds >= cap ? ` — full. ${chest}; Tom sells a roomier pack.`
     : shelved    ? ` · ${chest.replace("New finds","new finds")}.`
     :              `.`) +
    `</div>`;
  for(const g of secOrder){
    html += `<div class="museSec">${g}</div><div class="museGrid">`;
    for(const it of groups[g]){
      const worn = state.charm === it;
      html += `<div class="museItem has invTile${it===invSel?" sel":""}${worn?" worn":""}" data-icon="item_${it}" title="${escapeHtml(it)}" onclick="selectInvItem('${jsq(it)}')">` +
        `<canvas></canvas><span class="invCount">×${state.inv[it]}</span><span>${it}</span></div>`;
    }
    html += `</div>`;
  }
  html += `<div id="invDetail">${invDetailHtml(invSel)}</div>`;
  // v4.30: keep the scroll position. renderInv rewrites the whole body, and selectInvItem calls it on
  // EVERY tile click — so clicking anything in a scrolled bag snapped you back to the top, and you had to
  // scroll down and find your place again just to read what you'd tapped.
  const keepScroll = b.scrollTop;
  b.innerHTML = html;
  b.scrollTop = keepScroll;
  hydrateIcons(b);
}
function wearCharm(name){
  state.charm = name;
  if(name){ toast("You put on the " + name + ".", "#8fe8c8"); playSfx("gift"); }
  else playSfx("select");
  saveGame(); renderInv();   // invSel persists (module var), so the detail strip stays open on the new state
}
// ---- The Collection: a museum of everything you've ever found, with its examine flavour ----
const MUSEUM = [
  { name:"Crops",         items:()=>Object.values(CROPS).map(c=>c.name) },
  { name:"The Orchard",   items:()=>Object.values(FRUIT_TREES).map(t=>t.fruit) },
  { name:"Fish",          items:()=>FISH.map(f=>f.name) },
  { name:"The Legends",   items:()=>LEGENDS.map(l=>l.name) },
  { name:"Gems",          items:()=>Object.keys(GEM_SELL) },
  { name:"The Shore",     items:()=>[...Object.keys(SHORE), ...Object.keys(ROADSIDE), "Sea Aster"] },   // + the coast road's forage (v3.36); Sea Aster the salt-meadow bloom (v4.16)
  { name:"Farm & Forage", items:()=>["Field Salad","Frostberry","Berry Bun","Honey","Egg","Large Egg","Milk","Large Milk","Cheese","Fine Cheese","Wool","Prize Fleece","Mountain Thyme","Snowdrop"] },   // Wool since v3.8; Cheese v3.33; the ridge's forage v3.43
  { name:"The Kitchen",   items:()=>RECIPES.map(r=>r.name) },
  { name:"Materials",     items:()=>["Wood","Pine Wood","Maple Wood","Willow Wood","Elder Wood","Heartwood","Silverwood",...Object.values(WOOD_TO_LUMBER),...Object.values(ORES).map(o=>o.drop)] },   // + milled lumber (v3.21); ores DERIVED from ORES (v3.37 review fix — a hand-list forgot Deepsilver the day it shipped; now the next ore can't be missed)
  { name:"The Deep",      items:()=>[...GEODE_CURIOS, "Geode Heart", "Starlight Shard"] },   // v3.28: geode curios; v3.43: the summit's splinter joins the celestial family
  { name:"The Canopy",    items:()=>Object.keys(CHARMS) },
  // v4.16 — the eight materials the Undercroft's restless things are knotted from. DERIVED from CREATURES
  // (drop + drop2), not hand-listed, so the day a new family is added its spoils join the Collection for
  // free — the exact lesson the v3.37 review taught when a hand-list forgot Deepsilver the day it shipped.
  { name:"The Tenth Wing", items:()=>[...new Set(Object.values(CREATURES).flatMap(c=>[c.drop,c.drop2]).filter(Boolean))] },
];
// (The Collection tile grid now lives in renderCollectionHtml, the Journal's Collection tab.)
// The Journal, once a single 3-screen scroll of nine unrelated systems, is now a tabbed book —
// Quests / Map / Calendar / Ledger / Collection — the FoMT/Stardew "one clean page each" model.
// renderJournal keeps its name + zero-arg signature so the J key and the touch menu stay wired.
let _lastJournalTab = null;
function renderJournal(){
  const b = $("questPanel").querySelector(".body");
  const tab = panelTabs("questPanel", "journalTabs",
    [["quests","Quests"],["map","Map"],["calendar","Calendar"],["ledger","Ledger"],["collect","Collection"]],
    renderJournal);
  if(tab !== _lastJournalTab){ b.scrollTop = 0; _lastJournalTab = tab; }
  if(tab === "map"){ renderWorldMap(b); return; }        // draws + hydrates itself
  let html = "";
  if(tab === "quests")        html = journalQuestsHtml();
  else if(tab === "calendar") html = renderCalendarHtml();
  else if(tab === "ledger")   html = renderLedger();
  else                        html = renderCollectionHtml();
  b.innerHTML = html;
  hydrateIcons(b);
}
// Quests tab: the guild-wings progress strip, the act-grouped story spine with the finale
// pre-revealed, and Grandpa's found pages at the foot (the story lore beside the story tasks).
function journalQuestsHtml(){
  let html = "";
  const lit = wingsLit();
  // v4.17: the tenth wing (the Warden's) never lived in WINGS — it's Act III, driven by the ledger. Once
  // the finale lights it, the header stops reading a flat "9" and counts the tenth in, so the Journal no
  // longer under-counts what the player has actually done.
  const tenth = !!state.flags.tenthWingLit;
  html += `<div class="jq"><h3 style="color:var(--gold-hi)">🏛 Guild of ${tenth ? "Ten" : "Nine"} Crafts — ${lit + (tenth?1:0)}/${tenth?10:9} wings lit</h3><div style="display:flex;flex-wrap:wrap;gap:.25em .6em;font-size:.86em;">`;
  WINGS.forEach(w => { const on = w.lit();
    html += `<span style="color:${on?"var(--gold-hi)":"var(--ink-soft)"}">${on?"◆":"◇"} ${w.name}</span>`; });
  if(tenth) html += `<span style="color:var(--gold-hi)">◆ The Warden's</span>`;   // the tenth, lit at last
  html += `</div></div>`;
  // ★ Quest Points (v3.32) — the ledger's one number, right where the story lives
  const qpNow = questPoints(), qpAll = questPointsTotal();
  html += `<div class="jq"><h3 style="color:var(--gold-hi)">✦ Quest Points — ${qpNow}/${qpAll}</h3>` +
          `<div class="desc" style="color:var(--ink-soft)">` +
          (state.flags.qpAllTold
            ? `Every story told. The Storyteller's Banner is yours — Tom keeps it behind the counter.`
            : `Every task in the valley's book weighs a point or more. Fill the book, and Tom will have something for the teller.`) +
          `</div></div>`;
  html += `<div class="actHead">${ACT_TITLES[1]}</div>`;
  let act2Open = false, act3Open = false;
  QUESTS.forEach((q, idx) => {
    const done = idx < state.questIdx;
    const active = idx === state.questIdx;
    if(idx > state.questIdx){
      if(idx === FINALE_IDX && state.questIdx < FINALE_IDX){
        html += `<div class="jq dest"><h3>◇ ${QUESTS[FINALE_IDX].title} <span style="color:var(--ink-soft);font-size:.8em;">— where Act I is heading</span></h3>` +
                `<div class="desc">Relight the Nine Crafts and bring the Grand Festival back to the coast.</div></div>`;
      }
      return; // other future quests stay hidden
    }
    if(idx > FINALE_IDX && idx < ACT3_IDX && !act2Open){ html += `<div class="actHead">${ACT_TITLES[2]}</div>`; act2Open = true; }
    if(idx >= ACT3_IDX && !act3Open){ html += `<div class="actHead">${ACT_TITLES[3]}</div>`; act3Open = true; }   // v4.0
    html += `<div class="jq"><h3 class="${done?"done":""}">${done?"✔ ":active?"✒ ":""}${q.title} <span style="color:var(--ink-soft);font-size:.8em;">— ${q.giver}</span></h3>`;
    html += `<div class="desc">“${q.desc}”</div>`;
    q.obj.forEach(o => { const [c,m] = objProgress(o); const d = c>=m;
      html += `<div class="obj ${d?"done":""}">${d?"✔":"•"} ${o.text}${m>1?` (${c}/${m})`:""}</div>`; });
    html += `</div>`;
  });
  // v4.16: this triumphant line used to print the instant the QUESTS chain finished — which is the exact
  // moment the tenth-door turn-in OPENS Act III, so it sat directly above a 0/8 ledger claiming the valley
  // was done while its longest act was just beginning. Now it waits until Act III is genuinely closed (or
  // shows for the rare save that finished the quest book without ever opening the door).
  if(state.questIdx >= QUESTS.length && (!state.flags.tenthDoorOpen || (typeof wardChaptersAllDone === "function" && wardChaptersAllDone())))
    html += `<div style="text-align:center;color:var(--gold-hi);">✦ Every task complete. The valley is yours. ✦</div>`;
  if(state.flags.tenthDoorOpen && typeof renderWardLedgerJournal === "function") html += renderWardLedgerJournal();   // v4.3 Act III mirror
  html += renderPages();
  return html;
}
// Ledger tab: the valley's unfinished work, all payable from here — the Restorations pledges plus
// Rowan's civic projects, once two separate panels, now one page.
function renderLedger(){
  return `<div class="secHead">📜 The Valley Ledger</div>` + renderRestorations() + projectsRowsHtml();
}
// Collection tab: the discovery museum, promoted out of its old collapsed <details> into a full page.
function renderCollectionHtml(){
  const disc = state.discovered || {};
  let total=0, found=0, body="";
  for(const sec of MUSEUM){
    let cells = "", sFound = 0, sTotal = 0;
    for(const it of sec.items()){
      total++; sTotal++;
      if(disc[it]){ found++; sFound++;
        cells += `<div class="museItem has" data-icon="item_${it}" title="${escapeHtml(EXAMINE[it]||it)}"><canvas></canvas><span>${it}</span></div>`;
      } else {
        cells += `<div class="museItem locked" title="Not yet discovered"><span class="q">?</span><span>· · ·</span></div>`;
      }
    }
    // v4.21: per-section progress. A single 147-item number told you nothing about WHICH shelf was
    // one piece short — the whole point of a collection is knowing what you're hunting.
    const done = sTotal > 0 && sFound >= sTotal;
    body += `<div class="museSec">${sec.name} <span class="sub" style="color:${done?'var(--gold-hi)':'var(--ink-soft)'}">${done?'✦ complete':`${sFound}/${sTotal}`}</span></div><div class="museGrid">${cells}</div>`;
  }
  return `<div class="secHead">🗃 The Collection — ${found}/${total} discovered</div>${body}`;
}
// v4.21 — the Collection celebrates. It was a silent counter: completing a shelf moved a number and said
// nothing. Each section now banners once, the moment it closes, on a coll_<name> flag. Existing saves are
// backfilled SILENTLY on the first run (state.flags.collInit) so a long save never gets a retro storm of
// fanfares for shelves it filled seasons ago — the same guard shape migrateSave uses.
function collSectionKey(name){ return "coll_" + name.replace(/[^A-Za-z0-9]/g, ""); }
// v4.26: one source for a shelf's progress. renderCollectionHtml computed found/total inline, so the
// Journal page and anything else showing the same number could silently drift apart.
function collSectionCount(sec){
  const d = state.discovered || {}, items = sec.items();
  let found = 0; for(const it of items) if(d[it]) found++;
  return { found, total: items.length };
}
function collSectionComplete(sec){
  const d = state.discovered || {}, items = sec.items();
  return items.length > 0 && items.every(it => d[it]);
}
function checkCollection(){
  if(!state || !state.flags || typeof MUSEUM === "undefined") return;
  const silent = !state.flags.collInit;
  const newly = [];
  for(const sec of MUSEUM){
    const k = collSectionKey(sec.name);
    if(state.flags[k]) continue;
    if(collSectionComplete(sec)){ state.flags[k] = true; if(!silent) newly.push(sec.name); }
  }
  if(silent){ state.flags.collInit = true; return; }   // first run on an existing save: flag, don't fanfare
  newly.forEach((name, i) => {
    // The Legends have their own ceremony already (Bram's Hunt Crown) — don't double-celebrate them.
    if(name === "The Legends") return;
    setTimeout(() => { banner("🗃 " + name + " — complete", "Every last one of them found, and kept. The shelf is full.");
      playSfx("quest"); }, 700 + i*900);
  });
  if(!state.flags.collAll && MUSEUM.every(s => state.flags[collSectionKey(s.name)])){
    state.flags.collAll = true;
    setTimeout(() => { banner("✦ The Curator ✦", "Every shelf in the valley, filled. Not one thing that grows, swims, blooms or glints in Willowbrook has gone unseen by you.");
      playSfx("legend"); pSparkle(state.px, state.py-16, "#ffd75a", 30); }, 1800 + newly.length*900);
  }
}

// ---- The Valley of Willowbrook: a schematic town map (Journal → Map tab) ----
// Owner asked for "a map of the whole city with an indicator of where you are." Drawn as CSS grid
// boxes (not the pixel canvas) so region labels stay crisp and NPC dots can be procedural portraits.
// The layout mirrors the real warp cardinals: grove W of the farm, village E, guild N of the plaza,
// mine on the NE ridge, coast S. Regions are static; the you-are-here marker and the neighbour dots
// are derived live from state.map and the day's clock.
const WORLD_MAP = [
  { id:"grove",   area:"grove",   label:"The Deep Grove",     sub:"forest & rings" },
  { id:"farm",    area:"farm",    label:"Willowbrook Farm",   sub:"home · coop · barn" },
  { id:"village", area:"village", label:"Willowbrook Village",sub:"plaza · store · Alderman" },
  { id:"guild",   area:"guild",   label:"Guild of Nine Crafts",sub:"the valley's heart" },
  { id:"mine",    area:"mine",    label:"The Old Mine",       sub:"ore & gems" },
  { id:"coast",   area:"coast",   label:"Willowbrook Coast",  sub:"fishing & festivals" },
  { id:"coastroad", area:"coastroad", label:"The Coast Road", sub:"the Gullwater · the landing" },   // v3.36
  { id:"ridge",     area:"ridge",     label:"Starfall Ridge",  sub:"the summit · the view" },         // v3.43
  { id:"butterbrook", area:"butterbrook", label:"Butterbrook", sub:"the coast dairy · Nell" },          // v3.44
];
// every live map id folds onto one of the nine board regions
const MAP_REGION = { farm:"farm", cottage:"farm", coop:"farm", barn:"farm",
  village:"village", store:"village", mayahouse:"village", guild:"guild", undercroft:"guild",   // v4.0: the tenth door is inside the Guild
  mine:"mine", beach:"coast", grove:"grove", coastroad:"coastroad", ridge:"ridge",
  butterbrook:"butterbrook", dairy:"butterbrook" };
// Where each neighbour is right now — inferred read-only from the spawn schedule (spawnMapNpcs,
// 13-content.js). Live NPC entities only exist on the loaded map, so the map reconstructs their
// whereabouts from the same clock rules rather than reading entities off other maps.
function npcRegionNow(id){
  const h = (typeof curHour === "function") ? curHour() : 12;
  if(typeof beachEvent === "function" && beachEvent() && id !== "nell") return "coast";   // a festival gathers everyone on the sand — except Nell, who keeps the dairy (review fix: she was never in the festival cast, so the blanket "coast" put a false dot on her)
  switch(id){
    case "tom":   return "village";
    case "rowan": return "guild";
    case "bram":  return "coast";
    case "maya":  return "village";
    case "pip":   return "village";
    case "elias": return (state.flags && state.flags.act2Done && h >= 7 && h < 19)
      ? (state.day % 4 === 0 ? "coastroad" : "farm") : null;   // v3.36: fourth days he walks to the landing
    case "nell":  return (h >= 7 && h < 22) ? "butterbrook" : null;   // v3.44: dairy 7–18:30, meadow 18:30–22, home after — matches spawnMapNpcs exactly (review fix)
  }
  return null;
}
function renderWorldMap(b){
  const cur = MAP_REGION[state.map] || "farm";
  const byRegion = {};
  for(const id in NPCDEF){ const r = npcRegionNow(id); if(r){ (byRegion[r] = byRegion[r] || []).push(id); } }
  let nodes = "";
  for(const n of WORLD_MAP){
    const here = n.id === cur;
    const dots = (byRegion[n.id] || []).map(id => spr[NPCDEF[id].portrait]
      ? `<span class="wmNpc" data-icon="${NPCDEF[id].portrait}" title="${escapeHtml(NPCDEF[id].name)} is here"><canvas></canvas></span>` : "").join("");
    nodes += `<div class="wmNode${here?" here":""}" style="grid-area:${n.area}">` +
      `<span class="wmName">${n.label}</span><span class="wmSub">${n.sub}</span>` +
      (here ? `<span class="wmYou">✦ you are here</span>` : "") +
      (dots ? `<span class="wmNpcs">${dots}</span>` : "") + `</div>`;
  }
  const where = (MAPS[state.map] || {}).name || "the valley";
  b.innerHTML = `<div class="wmBoard">${nodes}</div>` +
    `<div class="wmFoot">You're in <b>${escapeHtml(where)}</b>. The faces show where the valley folk are about now.</div>`;
  hydrateIcons(b);
}

// ---- Grandpa's torn pages: found by living, re-readable forever ----
function renderPages(){
  const n = pagesFound();
  let h = `<div class="jq"><h3 style="color:#e8d9a8">📜 Grandpa's Pages — ${n}/9 found</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">Torn pages, tucked where he left them. You find them by doing what he did.</div>`;
  for(const p of JOURNAL_PAGES){
    const got = !!state.flags["page_"+p.n];
    if(p.n === 9 && !got){ h += `<div class="obj" style="color:var(--ink-soft)">· · ·</div>`; continue; }
    h += got
      ? `<div class="obj" style="color:var(--parch);cursor:pointer" onclick="rereadPage(${p.n})">✔ ${p.title} <span style="color:var(--ink-soft);font-size:.8em;">— read again</span></div>`
      : `<div class="obj" style="color:var(--ink-soft)">· · ·</div>`;
  }
  h += `</div>`;
  return h;
}
function rereadPage(n){
  const p = PAGE_BY_N[n]; if(!p || !state.flags["page_"+n]) return;
  closeAllPanels();
  openLetter(n===9 ? "✒ Slipped under the cottage door" : "✒ A torn page — " + p.title, p.text);
}

// ---- the almanac: what's coming, and what you've already seen this year ----
// Calendar tab: the flat year-long almanac list is now a Harvest Moon month grid — a 7×4 board of
// the selected season's 28 days, festivals and birthdays marked in place so you can read "what's on
// THIS season" at a glance, with the sky at the top and Bram's legend ledger below.
let calSeason = null;
function selectCalSeason(s){ calSeason = s; playSfx("select"); renderJournal(); }
function renderCalendarHtml(){
  if(calSeason === null) calSeason = curSeason();
  const wNow = weatherInfo(state.weather), wNext = weatherInfo(state.forecast || "clear");
  // ---- the sky ----
  let h = `<div class="skyRow">` +
    `<span class="skyChip" style="border-color:${wNow.tone}"><b style="color:${wNow.tone}">${wNow.icon} Today</b> ${wNow.name}</span>` +
    `<span class="skyChip" style="border-color:${wNext.tone}"><b style="color:${wNext.tone}">${wNext.icon} Tomorrow</b> ${wNext.name}</span></div>`;
  h += `<div class="desc muted" style="margin:.1em 0 .5em;font-size:.82em;">${wNow.offer}</div>`;
  // ---- season selector ----
  h += `<div class="tabs calTabs">` + SEASONS.map(s =>
    `<div class="tab ${s===calSeason?"active":""}" onclick="selectCalSeason('${s}')">${s}</div>`).join("") + `</div>`;
  // ---- index this season's marked days ----
  const ev = {};
  const put = (day, cls, glyph, name, blurb, done) => { ev[day] = { cls, glyph, name, blurb, done }; };
  for(const f of FESTIVALS) if(f.season === calSeason) put(f.day, "fest", "✦", f.name, f.blurb, festivalDoneThisYear(f));
  if(state.flags.anniversaryDay != null){
    const aS = SEASONS[Math.floor((state.flags.anniversaryDay-1)/SEASON_DAYS)];
    const aD = ((state.flags.anniversaryDay-1) % SEASON_DAYS) + 1;
    if(aS === calSeason) put(aD, "fest", "🏮", "The Lantern Festival", "The night the valley woke. Every year, on the coast.", !!state.flags["did_anniversary_"+YEAR()]);
  }
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id]; if(b.season === calSeason)
    put(b.day, "bday", "🎂", NPCDEF[id].name + "'s birthday", "Bring a gift they love — it counts for far more today.", !!state.flags["bday_"+id+"_"+YEAR()]); }
  const todaySlot = yearSlot(curSeason(), dayOfSeason());
  // ---- the 28-day grid ----
  h += `<div class="calGrid">`;
  for(let d=1; d<=SEASON_DAYS; d++){
    const e = ev[d], isToday = yearSlot(calSeason, d) === todaySlot;
    let cls = "calCell";
    if(e){ cls += " mark " + e.cls; if(e.done) cls += " done"; }
    if(isToday) cls += " today";
    h += `<div class="${cls}"${e?` title="${escapeHtml(e.name)}"`:""}><span class="calNum">${d}</span>${e?`<span class="calDot">${e.glyph}</span>`:""}</div>`;
  }
  h += `</div>`;
  // ---- what's on, this season ----
  const days = Object.keys(ev).map(Number).sort((a,b)=>a-b);
  if(days.length){
    h += `<div class="secHead" style="margin-top:.6em;">${calSeason} · Year ${YEAR()}</div>`;
    for(const d of days){ const e = ev[d];
      h += `<div class="obj ${e.done?"done":""}"><b style="color:${e.cls==="bday"?"var(--rose)":"var(--gold-hi)"}">${e.glyph} ${e.name}</b>` +
        `<span class="muted" style="font-size:.85em;"> — ${calSeason} ${d}${e.done?" · done this year":""}</span>` +
        (e.blurb?`<div class="muted" style="font-size:.82em;margin-left:1.1em;">${e.blurb}</div>`:"") + `</div>`;
    }
  } else h += `<div class="desc muted" style="text-align:center;">A quiet season — nothing on the calendar.</div>`;
  return h + bramLedgerHtml();
}
// Bram's ledger of the five legendary fish — kept from the old almanac, now under the Calendar tab.
function bramLedgerHtml(){
  const allLanded = legendsCaught() >= LEGENDS.length;
  let h = `<div class="jq" style="margin-top:.7em;"><h3 style="color:var(--blue)">🎣 Bram's Ledger — ${legendsCaught()}/${LEGENDS.length} landed</h3>`;
  h += allLanded
    ? `<div class="desc" style="margin-bottom:.3em;color:var(--gold-hi)">All five landed. ${state.flags.huntCrowned ? "Bram's oilskin is yours — the fish come faster, and the storm is yours to fish." : "Go and see Bram."}</div>`
    : `<div class="desc" style="margin-bottom:.3em;">Five fish that rise only when everything lines up. Bram tells you one for every heart.</div>`;
  for(const l of LEGENDS){
    const caught = !!state.flags["caught_"+l.id], known = !!state.flags["clue_"+l.id];
    if(!known){ h += `<div class="obj" style="color:var(--ink-soft)">· · ·<span style="font-size:.82em;"> — Bram hasn't told you about this one yet</span></div>`; continue; }
    h += `<div class="obj" style="color:${caught?"var(--gold-hi)":"var(--parch)"}">${caught?"✔":"○"} ${l.name}` +
      `<div style="color:var(--ink-soft);font-size:.82em;margin-left:1.1em;">${legendConditions(l)}</div></div>`;
  }
  h += `</div>`;
  return h;
}

// ---- Rowan's ledger: the valley's unfinished work ----
// Rowan's guild-desk ledger and the Journal's Restorations were two names for one idea — funding the
// valley's unfinished work — under two panels. They're now one Ledger tab. The desk opens the Journal
// there; renderProjects() survives only as a re-render shim for fundProject() (in 14-story.js, which
// this session must not edit).
function openProjects(){ _panelTab["questPanel"] = "ledger"; openPanel("questPanel", renderJournal); }
function renderProjects(){ if(openPanels.has("questPanel") && _panelTab["questPanel"] === "ledger") renderJournal(); }
function projectRowHtml(p){
  const done = projectDone(p.id), pending = projectPending(p.id);
  const cost = Object.entries(p.items).map(([it,n]) =>
    `<span style="color:${(state.inv[it]||0)>=n?"var(--parch)":"#c98a6a"}">${n}× ${it}</span>`).join(" · ");
  const goldOk = state.gold >= p.gold;
  let html = `<div class="row"><span class="lead"><span>` +
    `<span style="display:block;color:${done?"var(--gold-hi)":"var(--parch)"}">${done?"✔ ":pending?"🔨 ":""}${p.name}</span>` +
    `<span class="sub" style="display:block;margin:.1em 0;">${done ? p.done : pending ? "The work begins at dawn." : p.blurb}</span>` +
    (done||pending ? "" : `<span class="sub" style="display:block;">${cost}</span>`) +
    `</span></span>`;
  html += done || pending
    ? `<span><span class="price" style="color:var(--gold-hi)">${done?"built":"pending"}</span></span>`
    : `<span><span class="price" style="color:${goldOk?"var(--gold-hi)":"#c98a6a"}">${p.gold}g</span> ` +
      `<button class="buy" ${canFund(p)?"":"disabled"} onclick="fundProject('${p.id}')">fund</button></span>`;
  return html + `</div>`;
}
function projectsRowsHtml(){
  const builds = PROJECTS.filter(p => p.building), civic = PROJECTS.filter(p => !p.building);
  // Farm construction (v3.21) — your own buildings, milled from lumber, raised by morning
  let html = `<div class="secHead">🏗 Farm Construction</div>`;
  html += `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">Mill your logs at the Sawmill, bring the lumber here, and Rowan will help you raise it.</div>`;
  html += builds.map(projectRowHtml).join("");
  // Rowan's civic restorations — coin turned back into the valley
  html += `<div class="secHead" style="margin-top:.7em;">🔨 Rowan's Restorations</div>`;
  html += `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">“Coin is only stored work, child. Spend it and the valley remembers.” — Rowan</div>`;
  html += civic.map(projectRowHtml).join("");
  if(!PROJECTS.filter(p=>!projectDone(p.id)).length)
    html += `<div style="margin-top:.4em;text-align:center;color:var(--gold-hi);">✦ Every page of the ledger is struck through. ✦</div>`;
  return html;
}

// ---- shop ----
// v4.9 specialty vendors: the shop panel is shared, but each vendor stocks different BUY wares
// (selling is universal — sell anything, anywhere, at full price). Tom is the general store (+ tools,
// décor); Bram's Bait & Tackle is on the coast; Nell's Larder is at the Butterbrook dairy.
let _shopVendor = "tom";
const SHOP_TITLES = { tom:"TOM'S GENERAL STORE", bram:"BRAM'S BAIT & TACKLE", nell:"NELL'S LARDER" };
function openShop(tab, silent, vendor){ _shopVendor = vendor || "tom"; _panelTab["shopPanel"] = tab || "sell"; openPanel("shopPanel", renderShop);
  if(!silent && _shopVendor === "tom") toast(pick(TOM_GREET), "#e9dcc0"); }
function renderShop(){
  const b = $("shopPanel").querySelector(".body");
  const vendor = _shopVendor || "tom";
  const h2 = $("shopPanel").querySelector(".phead h2"); if(h2) h2.textContent = SHOP_TITLES[vendor] || "SHOP";
  const TABS = vendor === "tom"  ? [["sell","Sell"],["buy","Seeds & Food"],["tools","Tools"],["decor","Décor"]]
             : vendor === "bram" ? [["sell","Sell"],["buy","Bait & Tackle"]]
             :                     [["sell","Sell"],["buy","Larder"]];
  if(!TABS.some(t => t[0] === _panelTab["shopPanel"])) _panelTab["shopPanel"] = "sell";   // snap to a tab this vendor has
  const shopTab = panelTabs("shopPanel", "shopTabs", TABS, renderShop);
  let html = "";
  if(shopTab === "sell"){
    // v4.35: stable order. v4.30 fixed exactly this in the backpack and stopped there — these rows were
    // still in `Object.keys` insertion order, and since `take()` deletes a key at zero, SELLING something
    // and earning it again sent it to the bottom of the list. This is the screen where that happens most:
    // you empty stacks here by definition, so the list reshuffled itself on almost every visit.
    // Produce first, matching the "sell all produce" button directly above it, then alphabetical within
    // each group — so the things you came to sell are at the top and stay where you left them.
    const sellables = Object.keys(state.inv).filter(i => ITEM_SELL[i])
      .sort((a, b) => (isProduce(b) - isProduce(a)) || a.localeCompare(b));
    if(!sellables.length) html += `<div class="locked">Nothing to sell yet — go harvest, chop, mine or fish!</div>`;
    // v4.11: one-click "sell all produce" — crops, fish & cooked dishes only (materials are kept safe).
    const pv = (typeof produceValue === "function") ? produceValue() : 0;
    if(pv > 0) html += `<div class="row"><span class="lead"><span style="color:var(--gold-hi)">Sell all produce <span class="sub">crops, fish &amp; cooked dishes — your materials stay put</span></span></span>` +
      `<span><button class="buy" onclick="sellAllProduce()">sell all · ${pv}g</button></span></div>`;
    sellables.forEach((i, idx) => {
      // v4.9: Tom's Demand retired — every unit sells at full base price, so no more "demand %" note.
      const now = nextUnitPrice(i);   // = the full base unit price
      const note = `<span class="sub">×${state.inv[i]}</span>`;
      const priceHtml = `<span class="price">${now}g</span>`;
      // "all" total = base × count (no more slide)
      const allTotal = bundlePrice(i, state.inv[i]);
      // v3.40: the owner's quantity controls — clickable ± arrows around a real number box,
      // "sell" for that many, "all" for the lot. The box id is index-based (names carry spaces).
      const qid = "sq_" + idx;
      html += `<div class="row"><span class="lead" data-icon="item_${i}"><canvas></canvas><span>${i} ${note}</span></span>` +
        `<span>${priceHtml} ` +
        `<button onclick="stepQty('${qid}',-1)">−</button>` +
        `<input type="number" class="qty" id="${qid}" value="1" min="1" max="${state.inv[i]}" onclick="this.select()">` +
        `<button onclick="stepQty('${qid}',1)">+</button> ` +
        `<button onclick="sellQty('${jsq(i)}','${qid}')">sell</button> ` +
        `<button onclick="sellItem('${jsq(i)}',${state.inv[i]})" title="${allTotal}g for all ${state.inv[i]}">all · ${allTotal}g</button></span></div>`;
    });
  } else if(shopTab === "buy"){
    if(vendor === "bram" || vendor === "nell"){
      // the specialty vendors: a small, distinct buy list (buyFood is generic — spends gold, gives the item).
      const row = (item, cost, sub) => { const qid = "vq_" + item.replace(/[^a-z0-9]/gi,"");
        return `<div class="row"><span class="lead" data-icon="item_${item}"><canvas></canvas><span>${item} <span class="sub">×${state.inv[item]||0}</span> <span class="sub">${sub}</span></span></span>` +
          `<span><span class="price">${cost}g</span> ${qtyCtl(qid, Math.floor(state.gold/cost))} ` +
          `<button class="buy" ${state.gold>=cost?"":"disabled"} onclick="buyFood('${jsq(item)}',${cost},qv('${qid}'))">buy</button></span></div>`; };
      if(vendor === "bram"){
        html += `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">Bram's bait &amp; tackle. Fresh bait brings the fish in quicker — they bite while you carry it.</div>`;
        html += row("Bait", 15, "faster bites · used up as you land them");
      } else {
        html += `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">Nell's larder — the dairy's own goods, and what a kitchen wants. (Sell her your surplus, too.)</div>`;
        html += row("Milk", 110, "fresh from the dairy · for cooking");
        html += row("Large Milk", 200, "the rich pail · for finer dishes");
        html += row("Honey", 120, "from the hives · sweetens a recipe");
        html += row("Egg", 70, "a good brown egg · for baking");
      }
    } else {
    // v4.0: Tom's daily "warden's salvage" — the non-combat trickle for warding materials (V4_PLAN §2),
    // an EXPLICIT buy row (own button), never an auto-drain. Only once the tenth door is open.
    { const o = (typeof todaysSalvage === "function") ? todaysSalvage() : null;
      if(o){ const bought = state.flags.salvageDone === state.day, owned = state.inv[o.item]||0;
        html += `<div class="row"><span class="lead" data-icon="item_${o.item}"><canvas></canvas><span style="color:var(--gold-hi)">✦ Warden's Salvage — ${o.qty}× ${o.item}${owned?` <span class="sub">×${owned}</span>`:''} <span class="sub">${o.want}</span></span></span>` +
          `<span><span class="price">${o.price}g</span> <button class="buy" ${(!bought && state.gold>=o.price)?"":"disabled"} onclick="buySalvage()">${bought?"gone today":"buy"}</button></span></div>`;
      } }
    // v3.41 (owner, extending the sweep): buy rows show WHAT YOU ALREADY HOLD (×N, same badge as
    // selling) and take a quantity — steppers on everything bought in multiples (seeds, food,
    // saplings); one-of-a-kind rows (hive, machines, bouquet) keep single buy but gain the badge.
    let bidx = 0;
    for(const id in CROPS){ const c = CROPS[id]; const ok = skillLvl("Farming") >= c.lvl;
      const inSeason = c.seasons.includes(curSeason());
      const owned = state.inv[c.name+" Seeds"]||0;
      const sub = ok ? `${c.seasons.join("/")} · ${c.days}d · ${c.sell}g${inSeason?"":" · <span style='color:#c98a6a'>off-season</span>"}` : `🔒 Farming ${c.lvl}`;
      const qid = "bq_" + (bidx++);
      html += `<div class="row ${ok?"":"locked"}"><span class="lead" data-icon="item_${c.name} Seeds"><canvas></canvas>` +
        `<span>${c.name} Seeds <span class="sub">×${owned}</span> <span class="sub">${sub}</span></span></span>` +
        `<span><span class="price">${tomPrice(c.seed)}g${state.flags.tomDiscount?` <span class="sub" style="color:var(--green)">−10%</span>`:""}</span> ${ok ? qtyCtl(qid, Math.floor(state.gold/tomPrice(c.seed))) : ""} ` +
        `<button class="buy" ${ok&&state.gold>=tomPrice(c.seed)?"":"disabled"} onclick="buySeed('${id}',qv('${qid}'))">buy</button></span></div>`;
    }
    const foodRow = (item, cost0, sub) => {
      const qid = "bq_" + (bidx++), cost = tomPrice(cost0);   // v5.6: priced once, printed and charged from the same number
      return `<div class="row"><span class="lead" data-icon="item_${item}"><canvas></canvas><span>${item} <span class="sub">×${state.inv[item]||0}</span> <span class="sub">${sub}</span></span></span>` +
        `<span><span class="price">${cost}g${state.flags.tomDiscount?` <span class="sub" style="color:var(--green)">−10%</span>`:""}</span> ${qtyCtl(qid, Math.floor(state.gold/cost))} ` +
        `<button class="buy" ${state.gold>=cost?"":"disabled"} onclick="buyFood('${jsq(item)}',${cost},qv('${qid}'))">buy</button></span></div>`;
    };
    html += foodRow("Berry Bun", 30, "+34 energy");
    html += foodRow("Field Salad", 24, "+26 energy");
    // (Milk moved to Nell's Larder at the Butterbrook dairy — v4.9)
    if(anyConfided() && !state.flags.married){
      const hasBq = (state.inv["Bouquet"]||0)>0;
      html += `<h2 style="font-size:1em;color:var(--rose);margin:.4em 0 .2em;">COURTSHIP</h2>`;
      html += `<div class="row"><span class="lead" data-icon="item_Bouquet"><canvas></canvas><span>Willowbrook Bouquet <span class="sub">${hasBq?"you have one — give it to your beloved":"give it to the one who has your heart"}</span></span></span><span><span class="price">500g</span> <button class="buy" ${state.gold>=500&&!hasBq?"":"disabled"} onclick="buyBouquet()">buy</button></span></div>`;
    }
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">ORCHARD &amp; APIARY</h2>`;
    for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k];
      const qid = "bq_" + (bidx++);
      html += `<div class="row"><span class="lead" data-icon="item_${t.fruit}"><canvas></canvas><span>${t.name} <span class="sub">×${state.inv[t.name]||0}</span> ` +
        `<span class="sub">${t.blurb} · ${t.sell}g a fruit</span></span></span>` +
        `<span><span class="price">${t.cost}g</span> ${qtyCtl(qid, Math.floor(state.gold/t.cost))} ` +
        `<button class="buy" ${state.gold>=t.cost?"":"disabled"} onclick="buySapling('${jsq(k)}',qv('${qid}'))">buy</button></span></div>`;
    }
    html += `<div class="row"><span class="lead" data-icon="item_Honey"><canvas></canvas><span>Beehive <span class="sub">×${state.inv["Beehive"]||0}</span> ` +
      `<span class="sub">honey every morning · more where more is in bloom</span></span></span>` +
      `<span><span class="price">${HIVE_COST}g</span> <button class="buy" ${state.gold>=HIVE_COST?"":"disabled"} onclick="buyHive()">buy</button></span></div>`;
    // the Cellar: machines that give a crop a second life (wood + ore + coin, like every good tool)
    for(const mk in MACHINES){
      const M = MACHINES[mk];
      // v3.33: the press only reaches the shelf AFTER the dairy's gift — "your first press is a
      // gift; more are on his shelf after that" must be true, not just printed (§3.4).
      if(mk === "press" && !state.flags.ack_tom_press) continue;
      const matStr = matList(M.cost.mats);
      const can = state.gold >= M.cost.g && Object.keys(M.cost.mats).every(it => (state.inv[it]||0) >= M.cost.mats[it]);
      html += `<div class="row"><span class="lead" data-icon="item_${M.name}"><canvas></canvas><span>${M.name} <span class="sub">×${state.inv[M.name]||0}</span> ` +
        `<span class="sub">${M.blurb}<br>${M.cost.g}g + ${matStr}</span></span></span>` +
        `<span><button class="buy" ${can?"":"disabled"} onclick="buyMachine('${mk}')">buy</button></span></div>`;
    }

    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">RANCH</h2>`;
    const hens = state.animals.chickens.length;
    html += `<div class="row"><span class="lead" data-icon="item_Egg"><canvas></canvas><span>Chicken <span class="sub">lays an egg daily · lives in your coop · ${hens}/6 hens</span></span></span><span><span class="price">300g</span> <button class="buy" ${state.gold>=300&&hens<6?"":"disabled"} onclick="buyChicken()">buy</button></span></div>`;
    const cows = (state.animals.cows||[]).length;
    html += `<div class="row"><span class="lead" data-icon="item_Milk"><canvas></canvas><span>Cow <span class="sub">milk her every morning · lives in your barn · ${cows}/4 cows</span></span></span><span><span class="price">600g</span> <button class="buy" ${state.gold>=600&&cows<4?"":"disabled"} onclick="buyCow()">buy</button></span></div>`;
    const sheep = (state.animals.sheep||[]).length;
    html += `<div class="row"><span class="lead" data-icon="item_Wool"><canvas></canvas><span>Sheep <span class="sub">shear a full coat every few days · shares the barn · ${sheep}/${SHEEP_MAX} sheep</span></span></span><span><span class="price">${SHEEP_COST}g</span> <button class="buy" ${state.gold>=SHEEP_COST&&sheep<SHEEP_MAX?"":"disabled"} onclick="buySheep()">buy</button></span></div>`;
    html += `<div class="row"><span class="lead" data-icon="item_Shears"><canvas></canvas><span>Shears <span class="sub">${state.flags.hasShears?"you own a pair — shear any sheep with E":"gather wool from your sheep · one and done"}</span></span></span><span><span class="price">${SHEARS_COST}g</span> <button class="buy" ${!state.flags.hasShears&&state.gold>=SHEARS_COST?"":"disabled"} onclick="buyShears()">${state.flags.hasShears?"owned":"buy"}</button></span></div>`;
    // v4.31: the pack. Sits on Tom's shelf rather than in the Tools tab because it isn't a tool
    // upgrade — no skill gate, no materials, pure coin. That makes it the early-to-mid gold sink
    // the economy has been missing: 2,500g is a real ask at the point the bag first feels tight,
    // and 12,000g lands right where crop income outruns anything else to spend it on.
    { const tier = state.bagTier || 0;
      html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">THE PACK</h2>`;
      if(tier >= BAG_UPGRADES.length){
        html += `<div class="row"><span class="lead" data-icon="item_Wood"><canvas></canvas><span>Wayfarer's Pack ★ <span class="sub">${bagCap()} kinds — the biggest Tom has ever stitched</span></span></span></div>`;
      } else {
        const u = BAG_UPGRADES[tier], to = BAG_CAPS[u.to] + (state.bagBonus||0);
        html += `<div class="row"><span class="lead" data-icon="item_Wood"><canvas></canvas><span>${tier===0?"Roomier Pack":"Wayfarer's Pack"} ` +
          `<span class="sub">carry ${bagCap()} → ${to} different things · what won't fit waits in your cottage chest</span></span></span>` +
          `<span><span class="price">${u.cost.toLocaleString()}g</span> <button class="buy" ${state.gold>=u.cost?"":"disabled"} onclick="buyBag()">buy</button></span></div>`;
      }
    }
    }   // end Tom's buy list (v4.9 vendor split)
  } else if(shopTab === "decor"){
    const placed = (state.farm ? Object.values(state.farm.objects) : []).filter(o => DECOR[o.kind]).length;
    html += `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">Pieces to make the farm yours — buy one, then set it down like a hive (select it, press USE on open ground; the axe lifts it again). Purely for the joy of it. <span style="color:var(--gold-hi)">${placed}/${DECOR_MAX} placed.</span></div>`;
    for(const k in DECOR){
      const D = DECOR[k], own = state.inv[D.name]||0, vanity = D.cost >= 100000;
      // The Storyteller's Banner (v3.32) shows LOCKED, not hidden — a quest cape you can't see
      // isn't worth chasing. The row itself is the advertisement.
      const qpLocked = D.qpGate && !state.flags.qpAllTold;
      // v4.21 the mantles + the Crown ride the same show-it-locked rule: the row IS the advertisement,
      // and it names exactly how far off you are, so the 99 climb has a visible prize the whole way.
      const capeLocked = D.capeSkill && skillLvl(D.capeSkill) < 99;
      const crownLocked = D.masterGate && !state.flags.valleyMaster;
      const locked = qpLocked || capeLocked || crownLocked;
      const matsOk = !D.mats || Object.keys(D.mats).every(it => (state.inv[it]||0) >= D.mats[it]);   // v3.29
      const matStr = D.mats ? "<br>" + matList(D.mats) : "";
      const blurb = qpLocked ? `“Not for sale — not to you, not yet. Finish every task the valley's book ever asks, and we'll talk.” <span style="color:var(--gold-hi)">✦ ${questPoints()}/${questPointsTotal()} Quest Points</span>`
        : capeLocked ? `“Woven, folded, and waiting. It goes to a master of ${D.capeSkill} — nobody else.” <span style="color:var(--gold-hi)">✦ ${D.capeSkill} ${skillLvl(D.capeSkill)}/99</span>`
        : crownLocked ? `“There's one of these. I'll not part with it for anything less than every craft in the valley.” <span style="color:var(--gold-hi)">✦ Total level ${totalLevel()}/594</span>`
        : D.blurb;
      html += `<div class="row"><span class="lead" data-icon="item_${D.name}"><canvas></canvas><span style="${vanity||D.qpGate||D.capeSkill||D.masterGate?`color:${'#ffd75a'}`:''}">${locked?"🔒 ":""}${D.name}${own?` <span class="sub" style="color:var(--gold-hi)">×${own} in bag</span>`:''} <span class="sub">${blurb}${matStr}</span></span></span>` +
        `<span><span class="price">${D.cost.toLocaleString()}g</span> <button class="buy" ${state.gold>=D.cost&&matsOk&&!locked?"":"disabled"} onclick="buyDecor('${k}')">${locked?"locked":"buy"}</button></span></div>`;
    }
  } else {
    for(const tool of TOOLS){
      if(tool === "Stave" && !state.flags.staveEarned) continue;   // v4.0: the Stave only appears on the wall once Elias has given it
      const cur = state.tools[tool];
      if(cur >= MAX_TIER){ html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur]}">${TOOL_TIERS[cur]} ${tool} ★ <span class="sub">maxed</span></span></span></div>`; continue; }
      const c = toolCost(tool, cur+1);
      const need = TIER_LEVEL[cur+1], sk = TOOL_SKILL[tool], haveLvl = skillLvl(sk) >= need;
      const can = haveLvl && state.gold>=c.g && Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it]);
      const perk = toolPerk(tool, cur+1);   // v4.20: from TOOL_PERK in 01-data — shared with the Skill Guide
      const matStr = matList(c.mats);
      const lvlStr = `<span style="color:${haveLvl?'#8fd06a':'#c98a6a'}">needs ${sk} ${need}</span>`;
      html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur+1]}">${TOOL_TIERS[cur+1]} ${tool}</span> ` +
        `<span class="sub">${lvlStr} · ${c.g}g + ${matStr}<br>${perk}</span></span>` +
        `<button class="buy" ${can?"":"disabled"} onclick="buyTool('${tool}')">upgrade</button></div>`;
    }
  }
  b.innerHTML = html;
  hydrateIcons(b);
}
function jsq(s){ return s.replace(/'/g,"\\'"); }

// ---- gift picker ----
function openGiftPicker(id, items){
  $("giftHead").textContent = "GIVE " + NPCDEF[id].name.toUpperCase();
  openPanel("giftPanel", () => renderGift(id, items));
}
// ---- v3.43: the cairn panorama — the game's own geography, painted from the one spot the
// fiction promised. A single static scene keyed to hour + weather (never a live second camera),
// drawn at the game's native 320×208 and upscaled pixelated like everything else. ----
let _panoClose = null;   // live close handle — uiBlocking() and doSleep() check/clear it (review fixes)
function openPanorama(){
  if(_panoClose){ _panoClose(); return; }   // second press on the cairn climbs down
  const wrap = document.createElement("div");
  wrap.id = "panorama";
  Object.assign(wrap.style, { position:"absolute", inset:"0", zIndex:"60", background:"#000", cursor:"pointer" });
  const cv = document.createElement("canvas"); cv.width = 320; cv.height = 208;
  Object.assign(cv.style, { width:"100%", height:"100%", imageRendering:"pixelated" });
  wrap.appendChild(cv);
  $("stage") ? $("stage").appendChild(wrap) : document.body.appendChild(wrap);
  const g = cv.getContext("2d");
  paintPanorama(g);
  // the Marrow Point light really blinks (review fix: one paint froze the animT sample) —
  // a slow repaint while open, cleared on EVERY close path below
  const tick = setInterval(() => paintPanorama(g), 600);
  const onKey = e => { e.stopPropagation(); e.preventDefault(); close(); };
  const close = () => { clearInterval(tick); document.removeEventListener("keydown", onKey, true); wrap.remove(); _panoClose = null; };
  _panoClose = close;
  wrap.onclick = close;
  // one keypress also climbs down — captured ahead of the game's own handler, and properly
  // REMOVED on click-close too (review fix: the once-listener used to dangle and silently
  // swallow one future keypress at some random later moment)
  document.addEventListener("keydown", onKey, { capture:true });
  playSfx("menu");
}
function paintPanorama(g){
  const h = state.time/60, night = (h >= 20 || h < 5.5), dusk = (h >= 17.5 && h < 20), dawn = (h >= 5.5 && h < 8);
  g.imageSmoothingEnabled = false;
  // the sky — the hour picks the palette
  const sky = g.createLinearGradient(0,0,0,120);
  if(night){ sky.addColorStop(0,"#0a0c1e"); sky.addColorStop(1,"#1c2340"); }
  else if(dusk){ sky.addColorStop(0,"#3a3560"); sky.addColorStop(1,"#d8784a"); }
  else if(dawn){ sky.addColorStop(0,"#4a5a8a"); sky.addColorStop(1,"#e8a86a"); }
  else { sky.addColorStop(0,"#6aa0d8"); sky.addColorStop(1,"#b8d8ee"); }
  g.fillStyle = sky; g.fillRect(0,0,320,120);
  // stars / sun / moon
  if(night){ g.fillStyle="#e8ecff"; for(let i=0;i<70;i++){ const x=(i*47)%320, y=(i*31)%95; g.fillRect(x,y,1,1); }
    g.fillStyle="#f4f0e0"; g.beginPath(); g.arc(258,30,9,0,7); g.fill(); g.fillStyle= "#1c2340"; g.beginPath(); g.arc(262,27,8,0,7); g.fill(); }
  else { g.fillStyle = dusk||dawn ? "#ffd88a" : "#fff2c0"; g.beginPath(); g.arc(dusk?60:250, dusk?95:35, 11, 0, 7); g.fill(); }
  // far hills, two silhouettes deep
  g.fillStyle = night ? "#131a2e" : dusk ? "#4a3a55" : "#5a7a9a";
  g.beginPath(); g.moveTo(0,105); for(let x=0;x<=320;x+=16) g.lineTo(x, 95 + Math.sin(x*0.05)*7); g.lineTo(320,120); g.lineTo(0,120); g.fill();
  g.fillStyle = night ? "#0e1424" : dusk ? "#3a2e46" : "#46617e";
  g.beginPath(); g.moveTo(0,115); for(let x=0;x<=320;x+=16) g.lineTo(x, 108 + Math.cos(x*0.04)*6); g.lineTo(320,125); g.lineTo(0,125); g.fill();
  // the valley floor
  g.fillStyle = night ? "#16241a" : "#4a7a3e"; g.fillRect(0,118,320,90);
  // the sea, along the south — a band across the bottom
  g.fillStyle = night ? "#101c30" : "#2f5a7e"; g.fillRect(0,178,320,30);
  g.fillStyle = night ? "#1a2a44" : "#4a7aa0"; for(let x=0;x<320;x+=22) g.fillRect(x+((state.day*3)%11),182+((x/22)%3),9,1);
  // the grove, a dark mass to the west (left)
  g.fillStyle = night ? "#0c1810" : "#2c4a28"; g.fillRect(0,120,66,52);
  for(let i=0;i<26;i++){ const x=(i*13)%62, y=124+(i*17)%42; g.fillStyle = night ? "#122414" : "#39602f"; g.fillRect(x,y,5,4); }
  // the farm — fields, the cottage, a thread of chimney smoke
  g.fillStyle = night ? "#233020" : "#7aa04e"; g.fillRect(84,132,42,26);
  g.fillStyle = night ? "#1c281a" : "#68904a"; for(let i=0;i<5;i++) g.fillRect(84,134+i*5,42,2);
  g.fillStyle="#5a3f28"; g.fillRect(96,124,12,8); g.fillStyle="#7a5636"; g.fillRect(94,122,16,3);
  g.fillStyle = night ? "#ffd88a" : "#3a2c1c"; g.fillRect(99,127,2,2);   // one lit window after dark
  g.fillStyle="rgba(220,220,220,0.5)"; for(let i=0;i<4;i++) g.fillRect(106, 116-i*4, 2, 2);
  // the village + the guild on its rise
  for(let i=0;i<6;i++){ const x=150+i*11, y=140+(i%2)*6; g.fillStyle="#5a3f28"; g.fillRect(x,y,9,7); g.fillStyle="#7a5636"; g.fillRect(x-1,y-2,11,3);
    if(night){ g.fillStyle="#ffd88a"; g.fillRect(x+3,y+3,2,2); } }
  g.fillStyle="#6a4e32"; g.fillRect(176,126,16,10); g.fillStyle="#8a6647"; g.fillRect(174,123,20,4);   // the guild
  // the coast: umbrellas on the sand
  for(let i=0;i<5;i++){ g.fillStyle=["#c94f4f","#4f7ac9","#c9a44a","#4fa06a","#b06ac9"][i]; g.fillRect(140+i*14,172,6,2); g.fillStyle="#e8dcc0"; g.fillRect(142+i*14,174,2,2); }
  // the Gullwater, down from the hills to the sea — and the coast road running north (right)
  g.fillStyle = night ? "#1a2a44" : "#4a7aa0"; for(let y=120;y<178;y+=2) g.fillRect(236 + Math.round(Math.sin(y*0.12)*4), y, 3, 2);
  g.fillStyle = night ? "#3a3226" : "#b8a06a"; for(let y=126;y<176;y+=2) g.fillRect(262 + Math.round((176-y)*0.4), y, 3, 2);
  // Marrow Point's light, far up the coast — a blink you can just make out
  if(Math.floor(animT*1.2)%2===0){ g.fillStyle="#ffe6a0"; g.fillRect(312,121,2,2); g.fillStyle="rgba(255,230,160,0.35)"; g.fillRect(310,119,6,6); }
  // weather over everything
  if(isRain() || isStorm()){ g.fillStyle="rgba(140,170,210,0.25)"; for(let i=0;i<90;i++){ const x=(i*37)%320, y=(i*53)%200; g.fillRect(x,y,1,4); } }
  if(isFog()){ g.fillStyle="rgba(200,205,215,0.35)"; g.fillRect(0,100,320,108); }
  if(isSnow()){ g.fillStyle="rgba(240,244,250,0.8)"; for(let i=0;i<60;i++){ const x=(i*41)%320, y=(i*61)%200; g.fillRect(x,y,1,1); } }
  // the caption, on the pixel canvas like a postcard
  g.fillStyle="rgba(0,0,0,0.55)"; g.fillRect(0,196,320,12);
  g.fillStyle="#e9dcc0"; g.font="8px monospace"; g.textAlign="center";
  g.fillText("The valley, from Starfall Ridge. (click to climb down)", 160, 204);
  g.textAlign="left";
}

// ---- v3.40 quantity controls (owner sweep: "give the option to modify the quantity") ----
function stepQty(qid, d){
  const el = $(qid); if(!el) return;
  const max = parseInt(el.max, 10) || 1;
  el.value = Math.max(1, Math.min(max, (parseInt(el.value, 10) || 1) + d));
}
function sellQty(item, qid){
  const el = $(qid);
  const n = Math.max(1, Math.min((state.inv[item]||0), parseInt(el && el.value, 10) || 1));
  sellItem(item, n);
}
// v3.41: read a quantity box for the BUY side (the purchase fns clamp to the purse themselves)
function qv(qid){ const el = $(qid); return Math.max(1, parseInt(el && el.value, 10) || 1); }
// one stepper cluster, shared by every buy row that sells in multiples
function qtyCtl(qid, max){
  return `<button onclick="stepQty('${qid}',-1)">−</button>` +
    `<input type="number" class="qty" id="${qid}" value="1" min="1" max="${Math.max(1,max)}" onclick="this.select()">` +
    `<button onclick="stepQty('${qid}',1)">+</button>`;
}
// The machine chooser — the gift panel's pattern for the cellar. interact() opens it whenever a
// ============================== WHAT IT ACTUALLY SELLS FOR (v4.37) ==============================
// Both item readouts — the click-through detail (invDetailHtml) and v4.30's hover tooltip
// (tipBodyFor, delegated over EVERY `data-icon="item_*"` surface in the game) — printed the raw
// `ITEM_SELL` figure, while Tom's counter pays `baseUnitPrice()`. Those differ by up to 37%:
// baseUnitPrice layers the Winter ×1.25 on fish, the ★Renowned ×1.25 on dishes, and cookedMult()
// to ×1.18. A Cooked Salmon in Winter at Cooking 70 read 336g in the bag and paid 462g at the till.
//
// The understatement was worst exactly where it mattered most — the bonuses you EARNED were the
// ones being hidden, on the highest-traffic surface in the game. baseUnitPrice's own comment says
// the earned band exists to give "a visible reason to have done it"; this is that reason, restored.
function sellPriceNow(item){
  return (typeof baseUnitPrice === "function") ? Math.round(baseUnitPrice(item)) : (ITEM_SELL[item] || 0);
}
// Name the premium when there is one, so a number that moved has a stated cause rather than reading
// as a bug. The conditions MIRROR baseUnitPrice (08-actions.js) exactly — same three tests, same
// order, same tables — so the label can never claim a bonus the price didn't actually apply.
function sellPriceTag(item){
  const raw = ITEM_SELL[item] || 0;
  if(!raw || sellPriceNow(item) <= raw) return "";
  const bits = [];
  if(curSeason() === "Winter" && FISH_NAMES.has(item)) bits.push("winter");
  if(hasMastery("Cooking", 99) && RECIPE_NAMES.has(item)) bits.push("★ Renowned");
  if(item.indexOf("Cooked ") === 0 && cookedMult() > 1) bits.push("your cooking");
  return bits.length ? ` <span style="color:var(--gold-hi)">· ${bits.join(" · ")}</span>` : "";
}

// ============================== MATERIAL LISTS (v4.33) ==============================
// Four byte-identical copies of this renderer existed — machines, décor, tool upgrades and recipes
// each built `N Item (have)` with their own inline map, green when you had enough and clay-red when
// you didn't. One helper now, for two reasons.
//
// The first is that they were drifting: three used `N Item` and one `N× Item`, and the tool row named
// its loop variable `need2` to dodge a shadow — the usual signs of copy-paste rot.
//
// The second is the one that matters. Since v4.31 a full pack sends new finds to the cottage chest,
// so `state.inv` is no longer the whole answer to "do I have this?". A player who mined fourteen Iron
// Ore with a full pack, then opened Tom's shop to buy a Keg, would read `4 Iron Ore (0)` in red and
// reasonably conclude the ore was gone. The chest must never be able to look like a loss — so the
// count says where the rest of it is, at the moment the player is deciding, not after a failed click.
function chestQty(item){ return (state.shelf && state.shelf[item]) || 0; }
// The clause appended to a failure message. Empty when the chest has none, so it costs nothing.
function chestNote(item){
  const n = chestQty(item);
  return n ? ` (${n} ${n === 1 ? "is" : "are"} in your cottage chest.)` : "";
}
// mats: {item: qty}. sep defaults to " + "; `mul` renders "N× Item" for recipes.
function matList(mats, sep, mul){
  return Object.keys(mats).map(it => {
    const need = mats[it], have = state.inv[it] || 0, stored = chestQty(it);
    const col = have >= need ? "#8fd06a" : "#c98a6a";
    return `${need}${mul ? "×" : ""} ${it} <span style="color:${col}">(${have})</span>` +
      (stored ? ` <span class="sub" style="color:var(--gold-hi)">+${stored} in chest</span>` : ``);
  }).join(sep || " + ");
}

// ============================== THE CONTROLS CARD (v4.32) ==============================
// Renders the one CONTROLS table (01-data.js) for THIS device. Touch players get the touch column,
// keyboard players get the key column — never both, because a doubled table is exactly the wall of
// text this replaces. Reachable from `?`, from the touch menu, and from Settings.
function renderHelp(){
  const b = $("helpPanel").querySelector(".body");
  let html = `<div class="desc" style="margin-bottom:.6em;color:var(--ink-soft);">` +
    (IS_TOUCH ? `Everything you can do, and where to tap for it. <b>☰</b> is the menu button by the USE pad.`
              : `Everything you can do, and the key for it. Nothing here is required reading — the valley is patient.`) +
    `</div>`;
  for(const g of CONTROLS){
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.5em 0 .2em;">${g.sec.toUpperCase()}</h2>`;
    for(const r of g.rows){
      const bind = IS_TOUCH ? r.touch : r.key;
      if(bind === "—") continue;                      // no equivalent on this device — omit rather than lie
      const cell = IS_TOUCH ? `<b>${bind}</b>` : bind.split(" ").map(w =>
        /^[A-Za-z0-9?–—]+$/.test(w) && w !== "or" && w !== "the" ? `<kbd>${w}</kbd>` : w).join(" ");
      html += `<div class="row"><span class="lead" style="flex:0 0 42%;">${cell}</span>` +
        `<span style="text-align:left;flex:1;">${r.what}` +
        (r.when ? ` <span class="sub" style="color:var(--gold-hi)">— ${r.when}</span>` : ``) + `</span></div>`;
    }
  }
  html += `<div class="desc" style="margin-top:.8em;color:var(--ink-soft);">` +
    `Looking for how any of it <i>works</i>, rather than which button? That's <b>How to Play</b>, in Settings.</div>`;
  b.innerHTML = html;
}

// ============================== THE COTTAGE CHEST (v4.31) ==============================
// The other half of the pack. A carry limit is only fair if the player has somewhere to put the
// overflow AND a way to choose what rides along — so this is a real two-sided chest screen, laid
// out like Stardew's: what's in the chest on top, what's in your pack below, one click either way.
//
// Whole stacks move, never partial amounts. A pocket is the unit the cap counts, and moving 3 of
// your 40 Wood frees nothing — a half-move would just be a click that appears to do nothing.
function openShelf(){
  openPanel("shelfPanel", renderShelf);
}
function renderShelf(){
  const b = $("shelfPanel").querySelector(".body");
  if(!state.shelf) state.shelf = {};
  const shelved = Object.keys(state.shelf).filter(i => state.shelf[i] > 0).sort((a,c) => a.localeCompare(c));
  const carried = Object.keys(state.inv).filter(i => !bagExempt(i)).sort((a,c) => a.localeCompare(c));
  const kinds = bagKinds(), cap = bagCap(), room = cap - kinds;
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `Your pack holds <span style="color:${room>0?"var(--gold-hi)":"#e8a06a"}">${kinds}/${cap}</span> kinds. ` +
    `Anything that wouldn't fit came here — it was never lost, only set down. ` +
    `Tom sells bigger packs.</div>`;

  html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">IN THE CHEST</h2>`;
  if(!shelved.length) html += `<div class="locked">Empty — everything you own is on your back.</div>`;
  for(const it of shelved){
    // You can always retrieve something you're ALREADY carrying: it merges into a pocket you've
    // opened, so it costs no room. A genuinely new kind needs a free pocket.
    const free = (state.inv[it] !== undefined) || bagExempt(it) || room > 0;
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas>` +
      `<span>${it} <span class="sub">×${state.shelf[it]}</span>${free?"":` <span class="sub" style="color:#c98a6a">pack full</span>`}</span></span>` +
      `<span><button class="buy" ${free?"":"disabled"} onclick="shelfTake('${jsq(it)}')">take</button></span></div>`;
  }
  if(shelved.length > 1 && room > 0)
    html += `<div class="row"><span class="lead"><span style="color:var(--gold-hi)">Take everything that fits</span></span>` +
      `<span><button class="buy" onclick="shelfTakeAll()">take all</button></span></div>`;

  html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.7em 0 .2em;">IN YOUR PACK</h2>`;
  if(!carried.length) html += `<div class="locked">Nothing to set down.</div>`;
  for(const it of carried){
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas>` +
      `<span>${it} <span class="sub">×${state.inv[it]}</span></span></span>` +
      `<span><button onclick="shelfStore('${jsq(it)}')">store</button></span></div>`;
  }
  b.innerHTML = html;
  hydrateIcons(b);
}
// Both directions are a MOVE, never a copy and never a discard: the count is added to the
// destination before it is removed from the source, so no throw between the two can vanish it.
function shelfTake(item){
  const n = state.shelf[item] || 0; if(n <= 0) return;
  if(state.inv[item] === undefined && !bagExempt(item) && bagFull()){
    toast("No room — set something down first.", "#e8a06a"); playSfx("error"); return;
  }
  state.inv[item] = (state.inv[item] || 0) + n;
  delete state.shelf[item];
  playSfx("select"); invalidateGoals(); renderShelf();
}
function shelfTakeAll(){
  let moved = 0;
  for(const it of Object.keys(state.shelf).sort((a,c) => a.localeCompare(c))){
    if(state.inv[it] === undefined && !bagExempt(it) && bagFull()) continue;   // re-checked each pass — the pack fills as we go
    state.inv[it] = (state.inv[it] || 0) + state.shelf[it];
    delete state.shelf[it]; moved++;
  }
  if(moved){ playSfx("coin"); toast(`Packed ${moved} ${moved===1?"thing":"things"} away.`, "#cfe8a0"); }
  else { toast("No room for any of it.", "#e8a06a"); playSfx("error"); }
  invalidateGoals(); renderShelf();
}
function shelfStore(item){
  const n = state.inv[item] || 0; if(n <= 0) return;
  if(!state.shelf) state.shelf = {};
  state.shelf[item] = (state.shelf[item] || 0) + n;
  delete state.inv[item];
  if(state.charm === item) state.charm = null;   // can't wear what you've set down (exempt items aren't listed, but belt-and-braces)
  playSfx("select"); invalidateGoals(); renderShelf();
}

// machine is empty and you carry MORE than one thing it accepts; one acceptable thing still loads
// instantly (the old one-button reflex kept where a menu would be pure friction).
function openMachineChooser(kind, tx, ty){
  const M = MACHINES[kind];
  $("machHead").textContent = "LOAD THE " + M.name.toUpperCase();
  openPanel("machPanel", () => renderMachineChooser(kind, tx, ty));
}
function renderMachineChooser(kind, tx, ty){
  const M = MACHINES[kind], b = $("machPanel").querySelector(".body");
  // v4.35: sorted, for the same reason as the sell list — you empty stacks into machines, so an
  // insertion-ordered list reshuffles as you use it.
  const items = Object.keys(state.inv).filter(it => (state.inv[it]||0) > 0 && M.accepts(it)).sort((a,b) => a.localeCompare(b));
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Pick what goes in.` +
    (kind === "sawmill" ? ` The mill takes up to ${M.batch} of one species.` : ` One at a time; ${M.days} ${M.days===1?"night":"nights"} each.`) + `</div>`;
  items.forEach(it => {
    const prod = M.product(it);
    const sub = kind === "sawmill"
      ? `×${state.inv[it]} → ${Math.min(state.inv[it], M.batch)} ${prod}`
      : `×${state.inv[it]} → ${prod} (${ITEM_SELL[prod]||0}g)`;   // the PRODUCT's real price (review fix: mult-math showed Fine Cheese at 248g; it sells for 250)
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas><span>${it} <span class="sub">${sub}</span></span></span>` +
      `<button onclick="machChoose('${jsq(kind)}',${tx},${ty},'${jsq(it)}')">load</button></div>`;
  });
  if(!items.length) html += `<div class="locked">Nothing in your bag that it takes.</div>`;
  b.innerHTML = html; hydrateIcons(b);
}
function machChoose(kind, tx, ty, item){
  closePanel("machPanel");
  loadMachineWith(kind, tx, ty, item);   // 08-actions.js — the one loader both paths share
}

function renderGift(id, items){
  const def = NPCDEF[id], b = $("giftPanel").querySelector(".body");
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Pick something from your bag. One gift per day.</div>`;
  items.forEach(it => {
    const pref = giftPref(def, it);
    const tag = pref==="loved" ? `<span class="pref loved">♥ loves</span>` : pref==="liked" ? `<span class="pref liked">likes</span>` : "";
    html += `<div class="row"><span class="lead" data-icon="item_${it}"><canvas></canvas><span>${it} <span class="sub">×${state.inv[it]}</span> ${tag}</span></span>` +
      `<button onclick="giftNpcItem('${jsq(id)}','${jsq(it)}')">give</button></div>`;
  });
  b.innerHTML = html; hydrateIcons(b);
}

// ---- The Old Lift: ride between the surface and any restored stop; restore this floor's stop ----
function openLift(){ openPanel("liftPanel", renderLift); }
function renderLift(){
  const b = $("liftPanel").querySelector(".body");
  const depth = state.mineDepth||1, stops = (state.liftStops||[]).slice().sort((a,b)=>a-b);
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `The counterweight still works — riding UP is free. The deeper stops rusted shut; restore one and it's yours forever.</div>`;
  html += `<div class="row"><span class="lead"><span>☀ The Surface</span></span>` +
    `<button class="buy" onclick="rideLift(0)">ride</button></div>`;
  for(const s of stops){
    html += `<div class="row"><span class="lead"><span>Floor ${s} <span class="sub">restored stop</span></span></span>` +
      (s===depth ? `<span class="sub">you are here</span>` : `<button class="buy" onclick="rideLift(${s})">ride</button>`) + `</div>`;
  }
  if(depth % 5 === 0 && !stops.includes(depth)){
    // Grove Depths Phase 4: the stop funds through the Pledge Ledger — partial deposits, here
    // or from the Journal, and arriving under-resourced is never a wasted trip. The old
    // all-or-nothing "restore" button (disabled until you carried everything at once) is gone.
    html += pledgeRowHtml("lift"+depth);
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">Pledge what you carry — here, or from the Journal (J), anywhere. The ledger keeps the tally.</div>`;
  } else if(depth % 5 !== 0){
    const next = Math.ceil(depth/5)*5;
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">The next restorable stop is at floor ${next}.</div>`;
  }
  // --- The Deep Run (v3.15): opt-in time pressure + a Stone sink, all cozy-safe ---
  const dr = !!state.deepRun, stone = state.inv["Stone"]||0, stairs = state.inv["Staircase"]||0;
  html += `<div class="desc" style="margin:.7em 0 .3em;border-top:1px solid rgba(0,0,0,.18);padding-top:.55em;">` +
    `<b style="color:var(--gold-hi)">⛏ The Deep Run.</b> <span style="color:var(--ink-soft)">` +
    (dr ? "The clock is running. Go as deep as you dare — sunrise sends you home with everything you've found."
        : "Set the clock moving and race the dark for the rich deep floors. Nothing is ever lost — you just come home.") +
    `</span></div>`;
  html += `<div class="row"><span class="lead"><span>${dr ? "⏱ On a run — time is moving" : "☾ Timeless dig"}</span></span>` +
    `<button class="buy" onclick="toggleDeepRun()">${dr ? "stand down" : "begin a run"}</button></div>`;
  html += `<div class="row"><span class="lead"><span>Pack a Staircase <span class="sub">${STAIR_STONE} Stone → drop ${STAIR_DROP} floors · you hold ${stairs}</span></span></span>` +
    `<button class="buy" ${stone>=STAIR_STONE?"":"disabled"} onclick="packStaircase()">pack (${stone} stone)</button></div>`;
  if(stairs > 0) html += `<div class="row"><span class="lead"><span>Take a Staircase down <span class="sub">−1 Staircase · plunge ${STAIR_DROP} floors deeper</span></span></span>` +
    `<button class="buy" onclick="takeStairs()">descend</button></div>`;
  b.innerHTML = html;
}
function toggleDeepRun(){
  state.deepRun = !state.deepRun;
  if(state.deepRun) toast("The Deep Run begins — the clock is moving now. Get deep, then get out.", "#ffcf6a");
  else toast("You stand down. Underground, time holds still again.", "#a9b0c0");
  playSfx("select"); renderLift();
}
function packStaircase(){
  if((state.inv["Stone"]||0) < STAIR_STONE){ playSfx("error"); return; }
  take("Stone", STAIR_STONE); give("Staircase", 1, true);
  toast("A staircase, folded and ready. That's what all that stone was for.", "#cbb98f");
  playSfx("upgrade"); refreshHUD(); renderLift();
}
function takeStairs(){
  if((state.inv["Staircase"]||0) < 1){ playSfx("error"); return; }
  take("Staircase", 1);
  const prevBest = state.mineBest||0;
  state.mineDepth = (state.mineDepth||1) + STAIR_DROP;
  state.mineBest = Math.max(prevBest, state.mineDepth);
  checkQuests();   // credit a "reach floor N" objective on arrival, exactly as mineDown does
  closeAllPanels(); playSfx("door");
  travelTo("mine", 2*TILE+8, 3*TILE, "down");   // one regen straight to the new floor
  // toast, not banner: setMap fires its own "The Old Mine / Floor N" banner as the fade lands, and
  // would overwrite a banner set here — a toast queues and survives the transition (as mineDown's does)
  const newRecord = state.mineDepth > prevBest && state.mineDepth >= 10;
  toast(newRecord ? `⛏ Floor ${state.mineDepth} — deeper than the valley's been in years. The dark gives up richer things down here.`
                  : `Down ${STAIR_DROP} floors in a clatter of planks — floor ${state.mineDepth}.`,
        newRecord ? "#ffcf6a" : "#a9b0c0");
}
function rideLift(target){
  closeAllPanels();
  playSfx("door");
  if(target === 0){ state.deepRun = false; travelTo("village", 33*TILE+8, 4*TILE+8, "down"); toast("The lift rattles up into the daylight.", "#cbb98f"); return; }
  state.mineDepth = target;
  travelTo("mine", 2*TILE+8, 3*TILE, "down");
  toast(`The lift lowers you to floor ${target}.`, "#a9b0c0");
}
// restoreLift (the all-or-nothing at-the-stop purchase) is gone — lift stops fund through
// contributePledge like everything else on the ledger. completePledge still lands the stop in
// state.liftStops, so ride logic and old saves are untouched.

// ---- The Pledge Ledger (waystones now; the Old Lift joins it in Phase 4) ----
// One contribute button per pledge: it deposits EVERYTHING you're carrying that's still owed
// (gold up to the remainder, each material up to its remainder). Partial progress persists
// forever; the ledger — never the player — remembers what's left.
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }
function pledgeRowHtml(id){
  const rem = pledgeRemaining(id), bits = [];
  if(rem.g > 0) bits.push(`${rem.g}g <span style="color:${state.gold>=rem.g?'#8fd06a':'#c98a6a'}">(${state.gold})</span>`);
  for(const it in rem.mats){ const have = state.inv[it]||0;
    bits.push(`${rem.mats[it]}× ${it} <span style="color:${have>=rem.mats[it]?'#8fd06a':'#c98a6a'}">(${have})</span>`); }
  const canAny = (rem.g > 0 && state.gold > 0) || Object.keys(rem.mats).some(it => (state.inv[it]||0) > 0);
  // v3.40 (owner sweep): portions, not a drain — "when you click pledge it automatically just
  // drains your cash… and all the resources". A little = 10% of the total cost per resource,
  // half = 50%, all = the old behaviour, each still capped by what's owed and what you hold.
  return `<div class="row"><span class="lead"><span>${cap(pledgeName(id))} <span class="sub">owed: ${bits.join(", ")}</span></span></span>` +
    `<span><button ${canAny?"":"disabled"} onclick="contributePledge('${id}',0.1)">a little</button> ` +
    `<button ${canAny?"":"disabled"} onclick="contributePledge('${id}',0.5)">half</button> ` +
    `<button class="buy" ${canAny?"":"disabled"} onclick="contributePledge('${id}',1)">all</button></span></div>`;
}
function contributePledge(id, frac){
  if(pledgeDone(id)) return;
  // v3.39: complete-first — if a past cost REDUCTION (the lift rebalance) left this pledge already
  // over-funded, land it now; the old order demanded one more deposit the ledger didn't need, and
  // a player with empty pockets got "nothing it still needs" forever instead of their stop.
  if(pledgeFunded(id)){ completePledge(id); return; }
  // v3.40: frac portions the deposit — each resource gives at most ceil(frac × its TOTAL cost)
  // this click (a consistent chunk however far along the pledge is), still capped by what's owed
  // and held. frac 1 (or omitted — every old call site) is the original everything-you-have.
  frac = frac || 1;
  const total = pledgeCost(id) || { g:0, mats:{} };
  const chunk = v => frac >= 1 ? Infinity : Math.max(1, Math.ceil(v * frac));
  const rem = pledgeRemaining(id);
  if(!state.pledges) state.pledges = {};
  const p = state.pledges[id] || (state.pledges[id] = { gPaid:0, mats:{} });
  const gave = [];
  const dg = Math.min(state.gold, rem.g, chunk(total.g));
  if(dg > 0){ state.gold -= dg; p.gPaid = (p.gPaid||0) + dg; gave.push(dg + "g"); }
  for(const it in rem.mats){
    const d = Math.min(state.inv[it]||0, rem.mats[it], chunk(total.mats[it]||rem.mats[it]));
    if(d > 0 && take(it, d)){ if(!p.mats) p.mats = {}; p.mats[it] = (p.mats[it]||0) + d; gave.push(d + "× " + it); }
  }
  if(!gave.length){ toast("Nothing on you that it still needs.", "#c98a6a"); playSfx("error"); return; }
  if(pledgeFunded(id)) completePledge(id);
  else {
    const r2 = pledgeRemaining(id), owed = [];
    if(r2.g > 0) owed.push(r2.g + "g");
    for(const it in r2.mats) owed.push(r2.mats[it] + "× " + it);
    toast("Pledged " + gave.join(", ") + ".  Still owed: " + owed.join(", "), "#8fe8c8");
    playSfx("coin");
  }
  saveGame();   // pledge progress is permanent — never lose a deposit to a crash
  refreshHUD(); refreshPledgeViews();
}
// A filled pledge wakes INSTANTLY — "come back tomorrow" would be the trip-wasting frustration
// this system exists to kill, in a smaller size.
function completePledge(id){
  if(state.pledges) delete state.pledges[id];   // done-ness lives in waystones/liftStops/wardBells/trialsDone
  if(id.startsWith("trial:")){   // v5.1 a mastery trial — the banked levels land in completeTrial
    const t = trialParse(id); completeTrial(t.skill, t.gate); return;
  }
  if(id.startsWith("way")){
    if(!state.waystones) state.waystones = [];
    if(!state.waystones.includes(id)) state.waystones.push(id);
    banner("❖ Waystone awakened", cap(pledgeName(id)) + " hums with green light. Step between the stones — free, forever.");
  } else if(id.startsWith("patron")){   // v4.26 a standing commission — the village visibly warms
    const n = parseInt(id.slice(6), 10);
    state.patronTier = Math.max(state.patronTier||0, n);
    clearMapCache();                    // village/coast regenerate from patronTier — show it NOW, not tomorrow
    banner("❖ " + cap(patronName(n)), "Rowan strikes it off the list. The valley is a little warmer for it — and he has already thought of the next thing.");
    playSfx("upgrade"); pSparkle(state.px, state.py-12, "#ffd75a", 20); saveGame(); return;
  } else if(id.startsWith("bell")){   // v4.0 Warden's Bell
    const n = parseInt(id.slice(4), 10);
    if(!state.wardBells) state.wardBells = [];
    if(!state.wardBells.includes(n)) state.wardBells.push(n);
    banner("❖ Warden's Bell rung", "Floor " + n + " answers now — ring back down to it any time, for good.");
    playSfx("bellRing"); pSparkle(state.px, state.py-12, "#bfe4ff", 18); saveGame(); return;
  } else {
    const n = parseInt(id.slice(4), 10);
    if(!state.liftStops.includes(n)) state.liftStops.push(n);
    banner("⚙ Lift stop restored", "Floor " + n + " is on the line now — for good.");
  }
  playSfx("upgrade"); pSparkle(state.px, state.py-12, "#8fe8c8", 18);
  saveGame();
}
function refreshPledgeViews(){
  if(openPanels.has("questPanel")) renderJournal();
  if(openPanels.has("wayPanel"))   renderWaystone();
  if(openPanels.has("liftPanel"))  renderLift();
}
// The Journal's Restorations block — the ledger itself, readable and payable from anywhere.
function renderRestorations(){
  const ids = ledgerPledges();
  if(!ids.length) return "";
  let h = `<div class="jq"><h3 style="color:#8fe8c8">❖ Restorations — ${ids.filter(pledgeDone).length}/${ids.length} funded</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">Old Guild works you've found. Pledge what you carry, whenever — the ledger keeps the tally.</div>`;
  for(const id of ids){
    if(pledgeDone(id)){ h += `<div class="obj done">✔ ${cap(pledgeName(id))} — restored</div>`; continue; }
    h += pledgeRowHtml(id);
  }
  h += `</div>`;
  return h;
}

// ---- The Warden's Ledger (v4.3): Act III's hub, the book by the tenth door ----
// The deposit flow mirrors the Pledge Ledger (partial funding, the tally lives in the book);
// the close flow plays the chapter's scene, warms the Guild, and turns the page. Data + the
// pure state helpers (wardChapterDef/wardBundleRemaining/…) live in 15-warding.js.
function openWardLedger(){
  // First read is a discovery: Elias's note in the front cover, then the panel.
  if(!state.flags.wardLedgerSeen){
    state.flags.wardLedgerSeen = true; saveGame();
    openLetter("❖ The Warden's Ledger", WARD_LEDGER_INTRO, () => openPanel("wardLedgerPanel", renderWardLedger));
    return;
  }
  openPanel("wardLedgerPanel", renderWardLedger);
}
function renderWardLedger(){
  const b = $("wardLedgerPanel").querySelector(".body");
  if(wardChaptersAllDone()){
    let h = `<div class="desc" style="margin-bottom:.5em;">Every page you set out to keep is kept. The wing is warm from the tenth door to the deep stair — tended, and staying tended, because you come back to it.</div>`;
    // v4.16 — the standing Round: the Ledger keeps writing itself one page a day now that the craft is yours.
    const o = todaysWardRound();
    if(o){
      const have = state.inv[o.item]||0, done = wardRoundFilled(), ready = have >= o.qty;
      h += `<div class="jq" style="margin-bottom:.5em;"><h3 style="color:#bfe4ff">❖ Today's Round</h3>`;
      h += `<div class="desc">“${o.want}”</div>`;
      if(done){
        h += `<div class="obj done">✔ Walked — the wing is tended for today. A fresh page opens at dawn.</div>`;
      } else {
        h += `<div class="obj ${ready?"done":""}">${ready?"✔":"•"} ${o.item} ${Math.min(have,o.qty)}/${o.qty}` +
             (ready ? "" : ` <span class="sub">(carrying ${have})</span>`) + `</div>`;
        h += `<div class="obj"><span class="sub">Pays ${wardRoundPay(o)}g · +${o.xp} Warding XP</span></div>`;
        h += `<div class="row"><span class="lead"><span class="sub">${ready?"The round is ready to walk.":"Bring what the round asks, then walk it here."}</span></span>` +
          `<span><button class="buy" ${ready?"":"disabled"} onclick="walkWardRound()">Walk the round</button></span></div>`;
      }
      h += `</div>`;
    }
    h += `<div class="desc" style="color:var(--ink-soft);margin:.3em 0 .2em;">The book's kept pages:</div>`;
    h += WARD_CHAPTERS.map(c => `<div class="obj done">✔ ${c.title}</div>`).join("");
    b.innerHTML = h;
    return;
  }
  const def = wardChapterDef(), idx = state.wardChapter||0;
  let h = `<div class="desc" style="margin-bottom:.4em;color:var(--ink-soft);">Elias's book, kept in your hand now.  ·  Chapter ${idx+1} of ${WARD_CHAPTERS.length}</div>`;
  h += `<div class="jq"><h3 style="color:#bfe4ff">❖ ${def.title}</h3><div class="desc">“${def.blurb}”</div>`;
  // the bundle — deposit what you carry, a portion or all (the ledger keeps the remainder)
  if(wardBundleFunded()){
    h += `<div class="obj done">✔ The bundle is gathered — every material set down.</div>`;
  } else {
    for(const it in def.bundle){
      const need = def.bundle[it], paid = (state.wardBundle||{})[it]||0, have = state.inv[it]||0, got = paid >= need;
      const stored = chestQty(it);   // v4.33: deep materials are exactly what a full pack sends home
      h += `<div class="obj ${got?"done":""}">${got?"✔":"•"} ${it} ${Math.min(paid,need)}/${need}` +
           (got ? "" : ` <span class="sub">(carrying ${have}${stored?`, ${stored} in your cottage chest`:``})</span>`) + `</div>`;
    }
    const canAny = Object.keys(wardBundleRemaining()).some(it => (state.inv[it]||0) > 0);
    h += `<div class="row"><span class="lead"><span class="sub">Set down what you carry — the ledger keeps the tally.</span></span>` +
      `<span><button ${canAny?"":"disabled"} onclick="contributeChapter(0.5)">half</button> ` +
      `<button class="buy" ${canAny?"":"disabled"} onclick="contributeChapter(1)">all</button></span></div>`;
  }
  // the expedition beat
  const expDone = wardExpeditionDone(def);
  h += `<div class="obj ${expDone?"done":""}">${expDone?"✔":"•"} ${def.expedition.text}</div></div>`;
  // close the chapter, once both are met
  if(wardChapterReady(def)){
    h += `<div class="row"><span class="lead"><span style="color:var(--gold-hi)">The round is walked and the bundle set down.</span></span>` +
      `<span><button class="buy" onclick="closeWardChapter()">Close the page</button></span></div>`;
  } else {
    h += `<div class="desc" style="color:var(--ink-soft);margin-top:.3em;">Gather the bundle and walk the round — then come back and close the page here.</div>`;
  }
  b.innerHTML = h;
}
// Deposit toward the current chapter's bundle. frac 0.5 = half of each material's TOTAL this click,
// 1 = everything you carry that's still owed. Materials are TAKEN now and remembered in state.wardBundle
// (never lost — closing the chapter doesn't ask for them again; they're already in the book).
function contributeChapter(frac){
  const def = wardChapterDef(); if(!def || wardBundleFunded()) return;
  frac = frac || 1;
  const chunk = v => frac >= 1 ? Infinity : Math.max(1, Math.ceil(v * frac));
  const rem = wardBundleRemaining();
  if(!state.wardBundle) state.wardBundle = {};
  const gave = [];
  for(const it in rem){
    const d = Math.min(state.inv[it]||0, rem[it], chunk(def.bundle[it]||rem[it]));
    if(d > 0 && take(it, d)){ state.wardBundle[it] = (state.wardBundle[it]||0) + d; gave.push(d + "× " + it); }
  }
  if(!gave.length){ toast("Nothing on you the ledger still needs.", "#c98a6a"); playSfx("error"); return; }
  const r2 = wardBundleRemaining(), owed = [];
  for(const it in r2) owed.push(r2[it] + "× " + it);
  if(!owed.length) toast("Set down " + gave.join(", ") + ".  The bundle's complete.", "#8fe8c8");
  else toast("Set down " + gave.join(", ") + ".  Still wanted: " + owed.join(", "), "#8fe8c8");
  playSfx("coin");
  saveGame(); refreshHUD();
  if(openPanels.has("wardLedgerPanel")) renderWardLedger();
}
// Close the current chapter: the Guild warms (a lantern pair lights, live), the scene plays,
// then the reward lands and the page turns. Guarded so it can only fire when genuinely ready.
function closeWardChapter(){
  const def = wardChapterDef(); if(!def || !wardChapterReady(def)) return;
  closeAllPanels(true);
  const ensure = (id, x, y, face) => { let n = curMap.npcs.find(v => v.id === id);
    if(!n){ n = mkNpc(id, x*TILE, y*TILE, {face}); curMap.npcs.push(n); } return n; };
  const scene = def.scene(ensure);
  const steps = [
    { type:"run", fn:()=>{
        if(def.world){ state.flags[def.world] = true; if(typeof wardWorldProps === "function") wardWorldProps(curMap); }
        pSparkle(state.px, state.py-12, "#ffd88a", 18); playSfx("upgrade"); } },
    ...scene,
  ];
  // Append the closing card — UNLESS the scene already ends on its own banner (the ch8 finale does),
  // or the two would render the same "❖ <title>" headline back-to-back (v4.5 review fix).
  if(!(scene.length && scene[scene.length-1].type === "banner"))
    steps.push({ type:"banner", big:"❖ " + def.title, small:def.done || "A page closes in the Warden's Ledger.", t:3.0 });
  startCutscene(steps, () => {
    const r = def.reward || {};
    if(r.gold){ state.gold += r.gold; floatText(state.px, state.py-24, "+" + r.gold + "g", "#ffce5a"); }
    if(r.items) for(const it in r.items) give(it, r.items[it], true);
    state.wardChapter = (state.wardChapter||0) + 1;
    state.wardBundle = {};
    playSfx("quest"); saveGame(); refreshHUD();
    if(wardChaptersAllDone()){
      setTimeout(() => banner("❖ The Warden's Ledger", "Every page kept. The wing is warm the whole way down — and it will stay so, because you tend it."), 1200);
      // v4.17: the epilogue — Elias's one last letter, a quiet coda after the finale settles. Once only.
      if(!state.flags.wardEpilogueSeen) setTimeout(() => {
        state.flags.wardEpilogueSeen = true; saveGame();
        openLetter("✒ A letter, in a warden's hand", LETTER_WARDEN_EPILOGUE);
      }, 5200);   // well after the ch8 finale banner (t:4.2) and the "every page kept" card have cleared
    }
  });
}
// The Journal's read-only mirror of the ledger — so Act III's arc is visible in J, like the quests.
function renderWardLedgerJournal(){
  const n = Math.min(state.wardChapter||0, WARD_CHAPTERS.length);
  let h = `<div class="jq"><h3 style="color:#bfe4ff">❖ The Warden's Ledger <span style="color:var(--ink-soft);font-size:.8em;">— Act III · kept for Elias</span></h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">The book by the tenth door. ${n}/${WARD_CHAPTERS.length} pages closed — the Guild warms with each one.</div>`;
  WARD_CHAPTERS.forEach((c, i) => {
    const done = (state.wardChapter||0) > i, active = (state.wardChapter||0) === i;
    if(!done && !active) return;   // pages you haven't reached stay unwritten
    h += `<div class="obj ${done?"done":""}">${done?"✔":"✒"} ${c.title}</div>`;
  });
  h += `</div>`;
  return h;
}

// ---- Waystones: the panel at the stone ----
const WAY_LABEL = { way1:"The Grove Mouth  ·  Ring 1", way3:"The Third Ring", way6:"The Sixth Ring", way9:"The Heart  ·  Ring 9" };
let wayAtId = null;   // which stone the player is standing at
function openWaystone(id){ wayAtId = id; openPanel("wayPanel", renderWaystone); }
function renderWaystone(){
  const b = $("wayPanel").querySelector(".body");
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `Guild-era stones, keyed to one another. An awake stone carries you to any other awake stone — free, forever.</div>`;
  if(wayAtId && !pledgeDone(wayAtId)){
    html += pledgeRowHtml(wayAtId);
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">This stone remembers you. Pledge here, or from the Journal (J) — anywhere, any time, a little at a time.</div>`;
  } else {
    for(const id of ["way1","way3","way6","way9"]){
      if(!pledgeDone(id)) continue;
      const here = id === wayAtId;
      html += `<div class="row"><span class="lead"><span>${WAY_LABEL[id]}</span></span>` +
        (here ? `<span class="sub">you are here</span>` : `<button class="buy" onclick="rideWaystone('${id}')">step</button>`) + `</div>`;
    }
    const dormant = ["way3","way6","way9"].filter(id => pledgeDiscovered(id) && !pledgeDone(id));
    for(const id of dormant) html += `<div class="row locked"><span class="lead"><span>${WAY_LABEL[id]} <span class="sub">dormant — pledge in the Journal</span></span></span></div>`;
  }
  b.innerHTML = html;
}
function rideWaystone(id){
  const ring = WAYSTONE_RING[id];
  closeAllPanels();
  if(state.map === "grove" && (state.groveRing||1) === ring) return;
  state.groveRing = ring;
  state.groveBest = Math.max(state.groveBest||0, ring);
  playSfx("door");
  const sx = (id === "way1" ? 44-7 : 10) * TILE + 8;
  travelTo("grove", sx, 14*TILE+8, "up");
  toast("The stones trade places with the world — Ring " + ring + ".", "#8fe8c8");
}

// ---- kitchen ----
function openCooking(){ openPanel("cookPanel", renderCooking); }
function renderCooking(){
  const b = $("cookPanel").querySelector(".body");
  let html = `<div style="color:var(--ink-soft);margin-bottom:6px;">Cook for energy, coin, and to delight the valley. Trains Cooking.</div>`;
  const rawFish = FISH.filter(f => (state.inv[f.name]||0) > 0);
  if(rawFish.length){
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.2em 0;">GRILL</h2>`;
    rawFish.forEach(f => {
      html += `<div class="row"><span class="lead" data-icon="item_${f.name}"><canvas></canvas><span>Cook ${f.name} <span class="sub">→ Cooked ${f.name}</span></span></span>` +
        `<button onclick="cookFish('${jsq(f.name)}')">cook</button></div>`;
    });
  }
  html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">RECIPES</h2>`;
  RECIPES.forEach((r,i) => {
    // v4.13: a flag-gated recipe is a SECRET taught by a friend, not learned by level — hide it entirely
    // until you know it (a padlocked "learned at Cooking 0" would be a nonsense spoiler on the list).
    if(r.flag && !state.flags[r.flag]) return;
    const lvlOk = skillLvl("Cooking") >= r.lvl;
    if(!lvlOk){
      html += `<div class="row locked"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
        `<span>${r.name} <span class="sub">🔒 learned at Cooking ${r.lvl}</span></span></span>` +
        `<button disabled>cook</button></div>`;
      return;
    }
    const can = Object.keys(r.ing).every(it => (state.inv[it]||0) >= r.ing[it]);
    const ingStr = matList(r.ing, ", ", true);
    html += `<div class="row ${can?'':'locked'}"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
      `<span>${r.name} <span class="sub">${ingStr} · +${r.energy}e · sells ${r.sell}g</span></span></span>` +
      `<button ${can?'':'disabled'} onclick="cookRecipe(${i})">cook</button></div>`;
  });
  b.innerHTML = html; hydrateIcons(b);
}
// ---- v4.30 hover tooltips ----
// Every item surface in the game already carries data-icon (bag tiles, shop rows, machine rows, gift
// rows, collection tiles), and invDetailHtml already assembles precisely Stardew's tooltip body. It was
// simply gated behind a click plus a full innerHTML rebuild. One delegated listener on #stage covers all
// of them, present and future. Desktop only — touch keeps tap-to-select, which is the right verb there.
function tipBodyFor(item){
  if(!item) return "";
  let h = `<div class="tName">${escapeHtml(item)}${state.inv[item] ? ` ×${state.inv[item]}` : ""}</div>`;
  const bits = [];
  if(ITEM_SELL[item]) bits.push(`${sellPriceNow(item)}g${sellPriceTag(item)}`);
  if(EDIBLE[item])    bits.push(`+${EDIBLE[item]} energy`);
  if(CHARMS[item])    bits.push(CHARMS[item].effect);
  if(bits.length) h += `<div class="tVal">${bits.join(" · ")}</div>`;
  if(EXAMINE[item])   h += `<div class="tEx">${escapeHtml(EXAMINE[item])}</div>`;
  return h;
}
function wireTooltips(){
  if(IS_TOUCH) return;                       // tap-to-select is the touch verb; a hover tip would never show
  const tip = $("tip"), stage = $("stage");
  if(!tip || !stage) return;
  const hide = () => { tip.classList.remove("show"); tip.classList.add("hidden"); };
  stage.addEventListener("mouseover", e => {
    const el = e.target.closest && e.target.closest("[data-icon]");
    if(!el){ hide(); return; }
    const icon = el.dataset.icon || "";
    if(icon.indexOf("item_") !== 0){ hide(); return; }   // skill/tool icons aren't items
    const body = tipBodyFor(icon.slice(5));
    if(!body){ hide(); return; }
    tip.innerHTML = body; tip.classList.remove("hidden");
    // measure, then clamp inside the stage so a tile near an edge never pushes the tip off-screen
    const sr = stage.getBoundingClientRect(), er = el.getBoundingClientRect(), tr = tip.getBoundingClientRect();
    let x = er.left - sr.left + er.width/2 - tr.width/2;
    let y = er.top  - sr.top  - tr.height - 6;
    if(y < 4) y = er.bottom - sr.top + 6;                // no room above → flip below
    x = Math.max(4, Math.min(x, sr.width - tr.width - 4));
    tip.style.left = x + "px"; tip.style.top = y + "px";
    tip.classList.add("show");
  });
  stage.addEventListener("mouseout", e => { if(!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest("[data-icon]")) hide(); });
  // a panel closing under the cursor must not leave a tip stranded
  stage.addEventListener("mousedown", hide);
}

function hydrateIcons(root){
  root.querySelectorAll("[data-icon]").forEach(el => {
    const c = el.querySelector("canvas"); if(!c) return;
    const s = spr[el.dataset.icon]; if(!s) return;
    c.width = s.width; c.height = s.height; c.getContext("2d").drawImage(s,0,0);
  });
}

// ---- settings ----
// ---- HUD visibility preference (v4.0.2) ----
// The overlay HUD (clock, gold, energy/Resolve bars, XP orbs, quest tracker, toasts) sits over the
// game view, so near a map edge or corner — where the camera clamps and real map content reaches the
// screen edge — it hides that content. This lets the player DIM it (see the map through it) or HIDE it
// entirely, from Settings or the U key. A display preference, persisted to localStorage like audio —
// not in the save file, so it follows the device, not the farm. Governs #hud's --hud-op custom
// property only; the hotbar, dialogue and banners live outside #hud and stay fully crisp.
const HUDPREF = { on:true, opacity:1 };
(function loadHudPrefs(){
  try{ const p = JSON.parse(localStorage.getItem("hs_hud")); if(p){
    if(typeof p.on === "boolean") HUDPREF.on = p.on;
    if(typeof p.op === "number") HUDPREF.opacity = clamp(p.op, 0, 1);
  }}catch(e){}
})();
function saveHudPrefs(){ try{ localStorage.setItem("hs_hud", JSON.stringify({ on:HUDPREF.on, op:HUDPREF.opacity })); }catch(e){} }
function applyHud(){ const h = $("hud"); if(h) h.style.setProperty("--hud-op", HUDPREF.on ? HUDPREF.opacity : 0);
  const hint = $("hudHint"); if(hint) hint.classList.toggle("hidden", HUDPREF.on !== false);   // v4.14: the restore affordance shows ONLY while the HUD is hidden
}
function setHudOn(on){ HUDPREF.on = on; saveHudPrefs(); applyHud(); }
function setHudOpacity(v){ HUDPREF.opacity = clamp(v, 0, 1); HUDPREF.on = true; saveHudPrefs(); applyHud(); }   // dragging the dimmer implies you want it shown
function toggleHud(){
  HUDPREF.on = !HUDPREF.on; saveHudPrefs(); applyHud();
  // the confirmation can't live in #hud (we may have just hidden it), so use the banner — it's outside #hud.
  banner(HUDPREF.on ? "◔ HUD shown" : "◔ HUD hidden", "Toggle with U · or Settings ▸ Heads-up display");
  playSfx("select");
}
function renderSettings(){
  const b = $("settingsPanel").querySelector(".body");
  b.innerHTML =
    `<div class="setRow"><span>Music</span>` +
      `<button class="dangerBtn" id="setMusicOn" style="min-width:3em;background:${SND.musicOn?"#3d5a2e":"#332e2b"};border-color:${SND.musicOn?"#6a8f52":"#544d48"};color:${SND.musicOn?"#eaffd8":"#a89f98"};">${SND.musicOn?"On":"Off"}</button>` +
      `<input type="range" id="setMusic" min="0" max="100" value="${Math.round(SND.musicVol*100)}">` +
      `<span class="val">${Math.round(SND.musicVol*100)}</span></div>` +
    `<div class="setRow"><span>Sound FX</span>` +
      `<button class="dangerBtn" id="setSfxOn" style="min-width:3em;background:${SND.sfxOn?"#3d5a2e":"#332e2b"};border-color:${SND.sfxOn?"#6a8f52":"#544d48"};color:${SND.sfxOn?"#eaffd8":"#a89f98"};">${SND.sfxOn?"On":"Off"}</button>` +
      `<input type="range" id="setSfx" min="0" max="100" value="${Math.round(SND.sfxVol*100)}">` +
      `<span class="val">${Math.round(SND.sfxVol*100)}</span></div>` +
    // v4.0.2: Heads-up display — On/Off toggle + a dimmer, so the HUD never has to block the map's
    // edges & corners. Slider floors at 20% (fully hidden is the toggle's / the U key's job).
    `<div class="setRow"><span>Heads-up display</span>` +
      `<button class="dangerBtn" id="setHudOn" style="min-width:3em;background:${HUDPREF.on?"#3d5a2e":"#332e2b"};border-color:${HUDPREF.on?"#6a8f52":"#544d48"};color:${HUDPREF.on?"#eaffd8":"#a89f98"};">${HUDPREF.on?"On":"Off"}</button>` +
      `<input type="range" id="setHud" min="20" max="100" value="${Math.round(HUDPREF.opacity*100)}">` +
      `<span class="val">${Math.round(HUDPREF.opacity*100)}</span></div>` +
    `<div class="setRow"><span></span><span style="color:var(--ink-soft);font-size:.8em;">Dim or hide the on-screen display so it doesn't cover the map. Toggle any time with <b>U</b>.</span></div>` +
    // v4.27: smart tool is ON by default (it is the fix to "I have to click on tools"), but a player who
    // wants to pick every swing themselves should never have it imposed. Stored as an OPT-OUT flag so the
    // default needs no migration and an existing save gets the comfort without touching anything.
    `<div class="setRow"><span>Pick tools for me</span>` +
      `<button class="dangerBtn" id="setSmartTool" style="min-width:3em;background:${!state.flags.noSmartTool?"#3d5a2e":"#332e2b"};border-color:${!state.flags.noSmartTool?"#6a8f52":"#544d48"};color:${!state.flags.noSmartTool?"#eaffd8":"#a89f98"};">${!state.flags.noSmartTool?"On":"Off"}</button></div>` +
    `<div class="setRow"><span></span><span style="color:var(--ink-soft);font-size:.8em;">Facing a tree with the watering can? USE reaches for the axe instead. Only when there's exactly one right tool — watering vs planting on bare soil stays your call.</span></div>` +
    `<div class="setRow"><span>Controls</span><button class="dangerBtn" id="setControls" style="background:#3a4a30;border-color:#6a8f52;color:#eaffd8;">${IS_TOUCH?"Show the card":"Show the card (?)"}</button></div>` +
    `<div class="setRow"><span>How to play</span><button class="dangerBtn" id="setHelp" style="background:#3a4a30;border-color:#6a8f52;color:#eaffd8;">Read the guide</button></div>` +
    // v5.0 "The Strongbox": the save row stops being a passive reassurance and becomes the way out.
    // "auto-saves each night" was true and useless — it says nothing about the fact that the whole
    // farm sits in one browser slot that a cleared cache erases forever.
    `<div class="setRow"><span>Save file</span><button class="dangerBtn" id="setSaveFile" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">Back up or restore…</button></div>` +
    `<div class="setRow"><span></span><span style="color:var(--ink-soft);font-size:.8em;">Auto-saves each night — but only into this browser. Keep a copy of the file if you'd hate to lose the farm.</span></div>` +
    `<div class="setRow"><span>Version</span><button class="dangerBtn" id="setNews" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">v${VERSION.name} — What's New</button></div>` +
    `<div class="setRow"><span>Danger zone</span><button class="dangerBtn" id="setWipe">Delete Save &amp; Restart</button></div>` +
    `<div style="margin-top:.5em;color:var(--ink-soft);font-size:.82em;text-align:center;">Harvestscape v${VERSION.name} — a tiny cozy world, made in code.</div>`;
  const mus = $("setMusic"), sfx = $("setSfx");
  mus.oninput = () => { setMusicVol(mus.value/100); mus.nextElementSibling.textContent = mus.value; };
  sfx.oninput = () => { setSfxVol(sfx.value/100); sfx.nextElementSibling.textContent = sfx.value; };
  sfx.onchange = () => playSfx("select");
  $("setMusicOn").onclick = () => { setMusicOn(!SND.musicOn); renderSettings(); };
  $("setSfxOn").onclick = () => { setSfxOn(!SND.sfxOn); if(SND.sfxOn) playSfx("select"); renderSettings(); };
  const hud = $("setHud");
  hud.oninput = () => { setHudOpacity(hud.value/100); hud.nextElementSibling.textContent = hud.value; };
  $("setHudOn").onclick = () => { setHudOn(!HUDPREF.on); playSfx("select"); renderSettings(); };
  $("setSmartTool").onclick = () => { state.flags.noSmartTool = !state.flags.noSmartTool; playSfx("select"); saveGame(); renderSettings(); };
  $("setControls").onclick = () => openPanel("helpPanel", renderHelp);
  $("setHelp").onclick = () => { closeAllPanels(); openLetter("❔ How to Play", HOWTO_TEXT); };
  $("setNews").onclick = () => openPanel("newsPanel", renderNews);
  $("setSaveFile").onclick = () => openPanel("savePanel", renderSaveManager);
  // v5.0: the delete now names its own undo, because it has one (wipeSave stashes into the Strongbox
  // backup slot). A player who clicks this by accident is one panel away from their farm, not zero.
  $("setWipe").onclick = () => { if(confirm("Delete your save and restart from the title?\n\nIt will be kept in the Save File panel's undo slot — you can put it back from the title screen.")){ wipeSave(); location.reload(); } };
}

// ============================================================
// v5.0 "The Strongbox" — the Save File panel.
//
// The engine half lives in 04-world.js (exportSaveText / parseSaveText / importSaveText and the
// one-slot undo). This is the surface, and it is deliberately reachable from BOTH the title screen
// and Settings: Settings is where a careful player backs up, the title is where a frightened one
// looks after the save didn't load. It renders identically in both places, and every branch works
// with `state === null` — nothing in here may touch the live game.
//
// Copy has an execCommand fallback because navigator.clipboard is unavailable on plain http:,
// which is exactly how this game is served locally (python -m http.server on :8643).
// ============================================================
function saveBlurbLine(sum){
  if(!sum) return "";
  return `Year ${sum.year} · ${sum.season} ${sum.dayOfSeason} (day ${sum.day}) · ${sum.gold.toLocaleString()}g · total level ${sum.total}`;
}
function renderSaveManager(){
  const b = $("savePanel").querySelector(".body");
  const have = hasSave();
  let cur = null; try{ cur = saveSummary(JSON.parse(localStorage.getItem(SAVE_KEY))); }catch(e){}
  const bak = hasSaveBackup() ? backupSummary() : null;
  b.innerHTML =
    `<div style="color:var(--ink-soft);font-size:.86em;line-height:1.5;margin-bottom:.7em;">` +
      `Your farm lives in this browser's storage on this device. Clearing your browsing data — or ` +
      `switching to another browser or computer — leaves it behind. <b>Keep a copy.</b> The file below ` +
      `is your whole valley; it can be loaded back here any time.</div>` +
    `<div class="setRow"><span>This device</span><span style="color:${have?"var(--gold-hi)":"var(--ink-soft)"};font-size:.85em;text-align:right;">` +
      `${have ? escapeHtml(saveBlurbLine(cur)) : "No save on this device yet."}</span></div>` +
    (have ?
      `<div class="setRow"><span>Back up</span><span style="display:flex;gap:.4em;">` +
        `<button class="dangerBtn" id="savCopy" style="background:#3a4a30;border-color:#6a8f52;color:#eaffd8;">Copy to clipboard</button>` +
        `<button class="dangerBtn" id="savDown" style="background:#3a4a30;border-color:#6a8f52;color:#eaffd8;">Download file</button></span></div>`
      : "") +
    `<div class="setRow" style="border-top:.12em solid rgba(255,255,255,.08);margin-top:.5em;padding-top:.7em;"><span>Restore</span>` +
      `<span style="display:flex;gap:.4em;align-items:center;">` +
      `<button class="dangerBtn" id="savPick" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">Choose a file…</button>` +
      `<input type="file" id="savFile" accept=".json,application/json" style="display:none;"></span></div>` +
    `<div class="setRow"><span style="align-self:flex-start;padding-top:.3em;">…or paste it</span>` +
      `<textarea id="savText" spellcheck="false" placeholder="Paste the contents of a Harvestscape save file here" ` +
      `style="flex:1;height:4.6em;resize:vertical;font-family:var(--font);font-size:.7em;background:#1a1714;color:#cfc3b2;` +
      `border:.12em solid #544d48;border-radius:.4em;padding:.4em;"></textarea></div>` +
    `<div class="setRow"><span></span><button class="dangerBtn" id="savLoad" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">Restore from pasted text</button></div>` +
    `<div class="setRow"><span></span><span id="savMsg" style="color:var(--ink-soft);font-size:.82em;text-align:right;"></span></div>` +
    (bak ?
      `<div class="setRow" style="border-top:.12em solid rgba(255,255,255,.08);margin-top:.5em;padding-top:.7em;"><span>Undo</span>` +
        `<span style="display:flex;gap:.5em;align-items:center;justify-content:flex-end;flex:1;">` +
        `<span style="color:var(--ink-soft);font-size:.78em;text-align:right;">Replaced: ${escapeHtml(saveBlurbLine(bak))}</span>` +
        `<button class="dangerBtn" id="savUndo">Put it back</button></span></div>` +
        `<div class="setRow"><span></span><span style="color:var(--ink-soft);font-size:.8em;text-align:right;">` +
        `Whatever a restore or a delete replaced is kept here — one step back, always.</span></div>`
      : "") +
    `<div style="margin-top:.6em;color:var(--ink-soft);font-size:.8em;text-align:center;">Nothing is ever taken from you — not even by this panel.</div>`;

  const msg = (t, good) => { const m = $("savMsg"); if(m){ m.textContent = t; m.style.color = good ? "#8fd06a" : "#e0a06a"; } };

  if(have){
    $("savCopy").onclick = () => {
      const txt = exportSaveText(); if(!txt){ msg("There's no save to copy."); return; }
      const done = () => { playSfx("select"); msg("Copied. Paste it somewhere safe — a note, an email to yourself.", true); };
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(txt).then(done, () => copyFallback(txt, done, msg));
      } else copyFallback(txt, done, msg);
    };
    $("savDown").onclick = () => {
      const txt = exportSaveText(); if(!txt){ msg("There's no save to download."); return; }
      try{
        const url = URL.createObjectURL(new Blob([txt], { type:"application/json" }));
        const a = document.createElement("a"); a.href = url; a.download = exportSaveName();
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        playSfx("select"); msg("Saved to your downloads.", true);
      }catch(e){ msg("The browser blocked the download — use Copy instead."); }
    };
  }
  $("savPick").onclick = () => $("savFile").click();
  $("savFile").onchange = e => {
    const f = e.target.files && e.target.files[0]; if(!f) return;
    const rd = new FileReader();
    rd.onload = () => doRestore(String(rd.result), msg);
    rd.onerror = () => msg("That file couldn't be read.");
    rd.readAsText(f);
  };
  $("savLoad").onclick = () => doRestore($("savText").value, msg);
  if(bak) $("savUndo").onclick = () => {
    if(!confirm(`Put back the save this replaced?\n\n${saveBlurbLine(bak)}\n\nThe one loaded now takes its place in the undo slot — you can swap back again.`)) return;
    if(restoreSaveBackup()){ suspendSaves(); location.reload(); }
    else msg("The undo slot couldn't be read.");
  };
}
// The pre-clipboard-API copy path: a real (offscreen) textarea, selected and copied. Needed because
// navigator.clipboard is undefined on plain http://, which is how this game is served locally.
function copyFallback(txt, done, msg){
  try{
    const ta = document.createElement("textarea");
    ta.value = txt; ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove();
    if(ok) done(); else msg("Couldn't reach the clipboard — use Download file instead.");
  }catch(e){ msg("Couldn't reach the clipboard — use Download file instead."); }
}
// Validate, confirm by NAME (so nobody overwrites the wrong farm), commit, reload. The confirmation
// spells out both farms because "are you sure?" is useless when both answers look identical.
function doRestore(txt, msg){
  const chk = parseSaveText(txt);
  if(!chk.ok){ msg(chk.err); playSfx("error"); return; }
  const inc = saveBlurbLine(chk.summary);
  let cur = null; try{ cur = saveSummary(JSON.parse(localStorage.getItem(SAVE_KEY))); }catch(e){}
  const from = chk.from ? `\nSaved from v${chk.from.version || "?"}${chk.from.exported ? " on " + String(chk.from.exported).slice(0,10) : ""}.` : "";
  const warn = cur ? `\n\nThis device currently holds:\n  ${saveBlurbLine(cur)}\nIt will be kept in the undo slot, and you can put it back.` : "";
  if(!confirm(`Load this farm?\n\n  ${inc}${from}${warn}`)) return;
  const r = importSaveText(txt);
  if(!r.ok){ msg(r.err); playSfx("error"); return; }
  suspendSaves();      // MUST precede the reload — beforeunload/visibilitychange would write the old state back
  location.reload();
}

// The "What's New" / version-history panel — the player-facing mirror of CHANGELOG.md.
function renderNews(){
  const b = $("newsPanel").querySelector(".body");
  const TAG = { new:["NEW","#8fd06a"], change:["CHANGED","#e0b04a"], balance:["BALANCE","#6ab0d0"],
                polish:["POLISH","#c090d0"], fix:["FIX","#d08a6a"] };
  let html = `<div class="newsHead">Harvestscape v${VERSION.name}${VERSION.codename ? ` · “${escapeHtml(VERSION.codename)}”` : ""}</div>`;
  for(const rel of CHANGELOG){
    html += `<div class="newsRel"><span class="newsVer">v${rel.v}</span>` +
            `<span class="newsName">${escapeHtml(rel.name || "")}</span>` +
            `<span class="newsDate">${escapeHtml(rel.date || "")}</span></div>`;
    html += `<ul class="newsList">`;
    for(const n of (rel.notes || [])){
      const [lbl, col] = TAG[n.t] || [String(n.t).toUpperCase(), "#b9a98a"];
      html += `<li><span class="newsTag" style="background:${col};">${lbl}</span><span>${escapeHtml(n.s)}</span></li>`;
    }
    html += `</ul>`;
  }
  b.innerHTML = html;
  b.scrollTop = 0;
}
// Show What's New automatically the first time a player opens a build newer than they've seen.
function maybeShowWhatsNew(){
  let seen = 0;
  try { seen = +(localStorage.getItem("hs_seen_version") || 0); } catch(e){}
  if(seen && seen < VERSION.code){ openPanel("newsPanel", renderNews); }
  try { localStorage.setItem("hs_seen_version", VERSION.code); } catch(e){}
}

// ---- fade / sleep ----
function fadeTo(on, cb){ const f = $("fade"); if(on) f.classList.add("on"); else f.classList.remove("on"); if(cb) setTimeout(cb, 640); }
function showSleepCard(s){
  const card = $("sleepCard"); card.classList.remove("hidden");
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4], d = ((state.day-1)%SEASON_DAYS)+1;
  const seasonIcon = { Spring:"🌸", Summer:"☀", Fall:"🍂", Winter:"❄" };
  $("scTitle").textContent = (s.season ? seasonIcon[s.season]+" " : "") + seas + " · Day " + d;
  const w = weatherInfo(s.weather || state.weather);
  $("scSub").textContent = s.season ? `${s.season} has come to Willowbrook.` : w.line;
  const list = $("scList"); list.innerHTML = "";
  const lines = [];
  if(s.wrack) lines.push(`🐚 The storm has thrown wrack up the beach`);
  lines.push(`${w.icon} ${w.offer}`);
  if(s.fruited) lines.push(`🍎 ${s.fruited} tree${s.fruited>1?"s":""} bore fruit`);
  if(s.honeyed) lines.push(`🍯 ${s.honeyed} hive${s.honeyed>1?"s":""} filled with honey`);
  if(s.cellared) lines.push(`🛠 ${s.cellared} workshop batch${s.cellared>1?"es":""} finished overnight`);
  if(s.grew) lines.push(`🌱 ${s.grew} crop${s.grew>1?"s":""} grew overnight`);
  if(s.ready) lines.push(`✔ ${s.ready} ready to harvest`);
  if(s.withered) lines.push(`🥀 ${s.withered} crop${s.withered>1?"s":""} withered with the season`);
  if(s.spouse) lines.push(`💕 ${spouseName()} watered ${s.spouse} crop${s.spouse>1?"s":""} for you`);
  if(s.built) for(const p of s.built) lines.push(`🔨 ${p.done}`);
  if(s.forecast) lines.push(`${weatherInfo(s.forecast).icon} Tomorrow: ${weatherInfo(s.forecast).name}`);
  // The calendar cue that used to nag from the top bar all week now lands here, once, warmly — and
  // only when it's actually the day or its eve. A friendly invitation, never an obligation.
  const ev = (typeof nextEvent === "function") ? nextEvent() : null;
  if(ev && ev.daysAway <= 1){
    const icon = ev.kind === "birthday" ? "🎂" : "✦";
    if(ev.daysAway === 0)
      lines.push(ev.kind === "birthday"
        ? `${icon} ${ev.name} is today — a small gift means a lot`
        : `${icon} ${ev.name} is today, down on the coast`);
    else
      lines.push(`${icon} ${ev.name} is tomorrow`);
  }
  // the morning names the mission — every day starts with the story's thread in hand.
  // v4.16: no longer gated on questIdx < QUESTS.length, so Act III (which lives in the Warden's Ledger,
  // past the QUESTS chain) gets its morning line too instead of going silent for three releases.
  {
    const t = trackerData();
    if(t) lines.push(t.reportTo ? `✒ ${t.reportTo} ${t.ledger ? "waits to be closed" : "is waiting to hear from you"}` : `✒ The story waits: ${t.title}`);
  }
  // v4.26: ONE line naming what the valley is asking for today, so the morning offers the day's small
  // goals without four separate rows. Each of these rolls from its own seeded per-day RNG stream, so
  // reading them here is roll-identical to reading them later (todaysRequest additionally filters on live
  // skill levels, which only makes an early call MORE stable — exactly what its own comment asks for).
  {
    const asks = [];
    if(typeof todaysRequest === "function" && !requestFilled()){ const r = todaysRequest(); if(r) asks.push(NPCDEF[r.who] ? NPCDEF[r.who].name + "'s request" : "the board"); }
    if(typeof todaysNellOrder === "function" && !nellOrderFilled() && todaysNellOrder()) asks.push("Nell's order");
    if(typeof todaysWardRound === "function" && !wardRoundFilled() && todaysWardRound()) asks.push("the Round");
    if(asks.length) lines.push(`📋 Today: ${asks.join(" · ")}`);
  }
  // v4.26: "Energy restored / Progress saved" fired identically every morning for 250 days — pure chrome.
  // They move into the hint footer, which frees two rows for things that actually differ day to day.
  // THE STAGGER BUG (fixed here): the CSS animation is .5s and the card hides at 2700ms, so with a flat
  // 0.28s step line index 9 started at 2.82s — AFTER the card was gone — and line 8 reached ~32% opacity.
  // On a busy morning (married + orchard + hives + workshop + a season turn) the buried lines were the
  // FORECAST, the CALENDAR nudge and the v4.16 STORY line, so "the morning names the mission" was silently
  // broken on exactly the mornings that mattered. Capping the total ramp at 1.7s fixes every line count and
  // is pixel-identical on today's quiet 7-line morning (6 × 0.28 = 1.68 < 1.7, so the step stays 0.28).
  const step = Math.min(0.28, 1.7 / Math.max(1, lines.length - 1));
  lines.forEach((t,i) => { const li = document.createElement("li"); li.textContent = t; li.style.animationDelay = (i*step+0.3)+"s"; list.appendChild(li); });
  const hint = card.querySelector(".scHint");
  if(hint) hint.textContent = "☕ energy restored · 💾 saved — click to rise";
  playSfx("wake");
  // v4.26: the card is skippable. It must latch, because the global keydown has no `sleeping` branch and
  // dispatches "e" to interact(), whose `case "bed"` guards only on `sleeping` — which the dismissal just
  // set false. Without the latch one E press would skip the card AND immediately burn the next day.
  let done = false;
  const finish = () => {
    if(done) return; done = true;
    clearTimeout(timer);
    card.onclick = null; document.removeEventListener("keydown", onKey, true);
    card.classList.add("hidden");
    sleeping = false;
    // never unpause into an active cutscene/festival (belt-and-suspenders with doSleep's guard)
    if(!isCutscene() && !state.flags.festivalActive){ fadeTo(false); paused = false; }
    refreshHUD(); refreshHotbar(); refreshQuestTracker();
    if(s.rain) queuePage(6, 800);                              // "On Rain"
    catchUpPages();                                            // re-offer any page that never landed
    setTimeout(maybeLastPage, 1400);                           // the letter under the door
  };
  const onKey = (e) => {
    const k = (e.key||"").toLowerCase();
    if(k !== " " && k !== "enter" && k !== "e") return;
    e.preventDefault(); e.stopPropagation();                   // never let this same press reach interact()
    finish();
  };
  card.onclick = finish;
  document.addEventListener("keydown", onKey, true);            // capture, so it runs before the global handler
  const timer = setTimeout(finish, 3000);                       // the stagger needs the room; the skip buys it back
}

// ---- controls hint ----
function setControlsHint(){
  // v4.32: ONE line, not two. This printed twenty-odd bindings as a wall of run-on text under the
  // stage — 92px of vertical space spent on a reference nobody reads twice, and one that vanishes
  // entirely below 640px wide or 520px tall, which is precisely where a player most needs help.
  // The full per-device table now lives in the Controls card, so this only has to carry the four
  // verbs you need in the first ten seconds plus the way to find the rest.
  $("controlsHint").innerHTML =
    `<b>Move</b> <kbd>WASD</kbd> · <b>Use tool</b> <kbd>Space</kbd> · <b>Interact</b> <kbd>E</kbd> · ` +
    `<b>Backpack</b> <kbd>I</kbd> · <b>Journal</b> <kbd>J</kbd> · <b>All controls</b> <kbd>?</kbd>`;
}

// ---- INPUT ----
function firstGesture(){ audioResume(); }
document.addEventListener("keydown", e => {
  // v3.40: typing in a quantity box must never drive the game (hotbar digits, tool keys, WASD) —
  // but Escape BLURS the box (review fix: swallowing it left the primary close key silently dead
  // while a box had focus; blur first, and the next Escape closes the panel as ever).
  if(e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")){
    if(e.key === "Escape") e.target.blur();
    return;
  }
  const k = e.key.toLowerCase();
  firstGesture();
  if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
  if(gameMode === "intro"){
    if(letterScrollKey(k)){ e.preventDefault(); return; }
    if(k===" " || k==="enter" || k==="e"){ e.preventDefault();
      if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } }
    return;
  }
  if(gameMode === "title"){
    // if the How-to-Play overlay is up, let Enter dismiss it, not launch the game
    if(!$("intro").classList.contains("hidden")){
      if(letterScrollKey(k)){ e.preventDefault(); return; }
      if(k==="enter" || k==="e" || k===" "){ e.preventDefault(); $("btnLetterNext").click(); }
      return;
    }
    if(k==="enter"){ e.preventDefault(); if(hasSave()) continueGame(); else startNewGame(); }
    return;
  }
  // a letter overlay (used mid-game) takes priority
  if(!$("intro").classList.contains("hidden")){
    if(letterScrollKey(k)){ e.preventDefault(); return; }
    if(k==="e" || k===" " || k==="enter"){ e.preventDefault();
      if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } }
    return;
  }
  // cutscenes take priority
  if(isCutscene()){ if(k==="e" || k===" " || k==="enter"){ e.preventDefault(); cutsceneAdvance(); } return; }
  if(e.repeat){ keys[k] = true; return; }
  keys[k] = true;

  // Verb-key layout convention: LEFT hand (on WASD) owns the world verbs — E interact, Space use,
  // Q examine, R seeds, F eat, G gift — and the RIGHT hand owns the menus (K/I/J/P, slots 1–6). Any
  // NEW verb should land on a spare left-hand finger (Q/ring, Tab/pinky, or a Space-modifier) rather
  // than a fifth key under the index finger. Examine used to live only on X (bottom row, two rows
  // under S) which pulled the whole hand off the movement keys — Q sits directly above A and keeps it.
  if(k === "e"){ if(advanceDialog()) return; if(anyPanelOpen()){ closeAllPanels(); return; } interact(); }
  else if(k === " "){
    if(fishing.state === "reel"){ /* held — updateReel reads keys[" "] */ }
    else if(fishing.state !== "idle") reelOrCatch();
    else if(!uiBlocking()) useTool();
  }
  else if(k === "k") togglePanel("skillsPanel", renderSkills);
  else if(k === "i") togglePanel("invPanel", renderInv);
  else if(k === "j") togglePanel("questPanel", renderJournal);
  else if(k === "p" || k === "o") togglePanel("settingsPanel", renderSettings);
  // v4.32: `?` is the near-universal "what are the controls" key. Bound to both the shifted glyph and
  // the bare `/` so it works whatever the layout puts where.
  else if(k === "?" || k === "/") togglePanel("helpPanel", renderHelp);
  // v4.29: R still cycles (the ring is short now — in-season, in-stock only), but Shift+R opens the
  // picker, and R opens it too when there is genuinely nothing to cycle TO.
  else if(k === "r"){ if(inputBusy()) return;
    if(e.shiftKey || plantables().length <= 1) openSeedPicker(); else cycleSeed(); }
  else if(k === "f"){ if(!uiBlocking()) eatFood(); }
  else if(k === "g"){ if(!uiBlocking()) giveGift(); }
  else if(k === "h"){ if(!uiBlocking()) rideToggle(); }   // v3.22: mount/dismount the horse
  else if(k === "q" || k === "x"){ examine(); }   // Q is the WASD-native primary; X kept as a legacy alias
  else if(k === "m"){ setMusicOn(!SND.musicOn); toast("Music "+(SND.musicOn?"on":"off")); }
  else if(k === "u"){ if(!uiBlocking()) toggleHud(); }   // v4.0.2: dim/hide the HUD off the map's edges & corners
  else if(k === "shift"){ if(!uiBlocking()) startGuard(); }   // v4.4: raise the Warden's Guard (also right-click in the Undercroft / the touch 🛡)
  else if(k === "escape"){ if(dlg.open) closeDialog(); else closeAllPanels(); }
  // v4.27.1: guard BEFORE preventDefault — swallowing Tab unconditionally kills keyboard focus
  // navigation (the settings sliders, the quantity boxes) whenever a panel is open.
  else if(k === "tab"){ if(inputBusy()) return; e.preventDefault(); cycleSlot(e.shiftKey ? -1 : 1); }
  else if("1234567".includes(k)) selectSlot(+k-1);   // v4.0: 7th slot is the Stave (only present once earned)
});
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
// v4.27: THE MOUSE WHEEL. Stardew's most-used input by a mile — you scroll to change tools without ever
// looking away — and this game had no wheel handler at all, so the only ways to switch were the number
// row (which pulls your hand off WASD) or clicking the tile. Wheel and Tab both cycle; Shift+Tab goes back.
// v4.27.1: uiBlocking() is dlg.open || anyPanelOpen() || _panoClose — it does NOT cover the letter
// overlay (#intro), which openLetter uses mid-game for every letter, journal page and epilogue. So the
// wheel was stealing scroll from exactly the long documents you most need to scroll, and Tab could cycle
// tools underneath one. This is the predicate every free-roam input should gate on.
function inputBusy(){
  return uiBlocking() || paused || (typeof isCutscene === "function" && isCutscene())
      || !$("intro").classList.contains("hidden");
}
function cycleSlot(dir){
  if(gameMode !== "play" || inputBusy()) return;
  const n = HOTBAR.length;
  selectSlot(((slotSel + dir) % n + n) % n);
}
// A trackpad emits a burst of small deltas per flick (a mouse notch is ~100; a macOS two-finger swipe is
// dozens of events of 1-4). Stepping per EVENT would spin through the whole hotbar, stack dozens of
// overlapping "select" oscillators and rebuild the hotbar DOM dozens of times on a single gesture. So
// accumulate and step per WHEEL_NOTCH, and reset the accumulator on a direction change so a flick back
// answers immediately instead of first paying off the leftover in the other direction.
let _wheelAcc = 0, _wheelLast = 0;
const WHEEL_NOTCH = 50, WHEEL_GAP = 250;
window.addEventListener("wheel", e => {
  if(gameMode !== "play" || inputBusy()) return;              // panels, letters and cutscenes scroll normally
  if(!e.deltaY) return;
  e.preventDefault();
  const now = performance.now();
  // a fresh gesture starts from zero: a leftover remainder from a flick a minute ago must never make the
  // next one step early (or late). Reset on a pause, and on a direction change.
  if(now - _wheelLast > WHEEL_GAP) _wheelAcc = 0;
  _wheelLast = now;
  if(_wheelAcc && Math.sign(e.deltaY) !== Math.sign(_wheelAcc)) _wheelAcc = 0;
  _wheelAcc += e.deltaY;
  // ONE step per event, maximum. A discrete mouse notch arrives as a single deltaY of ~100, which under a
  // while-loop would step twice; a trackpad arrives as a burst of small deltas, which the accumulator
  // turns into one step per threshold crossing. Capping at one keeps both honest.
  if(Math.abs(_wheelAcc) >= WHEEL_NOTCH){
    cycleSlot(_wheelAcc > 0 ? 1 : -1);
    _wheelAcc = 0;
  }
}, { passive:false });
window.addEventListener("blur", () => { for(const kk in keys) keys[kk] = false; fishHold = false; });

// the quest tracker sits where the reel bar draws, so fade it out while you fight a fish
function setReelUI(on){ $("stage").classList.toggle("reeling", !!on); }

// mouse on canvas
cv.addEventListener("mousedown", e => {
  firstGesture();
  if(gameMode !== "play") return;
  e.preventDefault();
  if(!$("intro").classList.contains("hidden")) return;   // letter handles its own clicks
  if(isCutscene()){ cutsceneAdvance(); return; }
  if(e.button === 2){ if(inCombatMap()){ startGuard(); return; } interact(); return; }   // v4.4: right-click is the "shield click" in the Undercroft; interact everywhere else
  if(fishing.state === "reel") fishHold = true;          // held, not tapped
  else if(fishing.state !== "idle") reelOrCatch();
  else if(!uiBlocking()) useTool();
});
window.addEventListener("mouseup", () => { fishHold = false; });
cv.addEventListener("contextmenu", e => e.preventDefault());

// panel close buttons
document.querySelectorAll(".pclose").forEach(btn => {
  btn.onclick = () => { const p = btn.closest(".panel"); if(p) closePanel(p.id); };
});
// v4.14: click/tap the "Show HUD" affordance to bring the HUD back (same as pressing U when it's on).
{ const hh = $("hudHint"); if(hh) hh.onclick = () => { setHudOn(true); playSfx("select"); }; }

// touch controls
function wireTouch(){
  if(!IS_TOUCH){ $("touchUI").classList.add("hidden"); return; }
  const setDir = (dir, on) => {
    const v = on ? 1 : 0;
    if(dir==="up") touchDir.y = on?-1:0;
    if(dir==="down") touchDir.y = on?1:0;
    if(dir==="left") touchDir.x = on?-1:0;
    if(dir==="right") touchDir.x = on?1:0;
  };
  $("dpad").querySelectorAll("button").forEach(btn => {
    const dir = btn.dataset.dir;
    const down = e => { e.preventDefault(); firstGesture(); setDir(dir,true); };
    const up = e => { e.preventDefault(); setDir(dir,false); };
    btn.addEventListener("pointerdown", down); btn.addEventListener("pointerup", up);
    btn.addEventListener("pointerleave", up); btn.addEventListener("pointercancel", up);
  });
  const useBtn = $("btnUse");
  useBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(fishing.state === "reel") fishHold = true;        // hold USE to reel the fish in
    else if(fishing.state !== "idle") reelOrCatch();
    else if(!uiBlocking()) useTool(); });
  ["pointerup","pointerleave","pointercancel"].forEach(ev =>
    useBtn.addEventListener(ev, e => { e.preventDefault(); fishHold = false; }));
  $("btnAct").addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(!$("intro").classList.contains("hidden")){ if(_letterActive) finishLetter(); else { const b=$("btnLetterNext"); if(b.classList.contains("show")) b.click(); } return; }
    if(isCutscene()){ cutsceneAdvance(); return; }
    closeTouchMenu();
    if(!advanceDialog()){ if(anyPanelOpen()) closeAllPanels(); else interact(); } });

  // the Look (examine) button — the touch parity for Q/X. examine() self-guards, so no extra checks.
  const lookBtn = $("btnLook");
  if(lookBtn) lookBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture(); examine(); });

  // v4.4 the Guard button — touch parity for Shift / right-click. startGuard() self-gates (Undercroft + Stave).
  const guardBtn = $("btnGuard");
  if(guardBtn) guardBtn.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture(); startGuard(); });

  // Backpack / Journal / Skills / Settings have no key on a touch device — give them a menu.
  const RENDER = { invPanel:renderInv, questPanel:renderJournal, skillsPanel:renderSkills, settingsPanel:renderSettings, helpPanel:renderHelp };
  $("btnMenu").addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(isCutscene() || fishing.state === "reel") return;
    const m = $("touchMenu"); const opening = m.classList.contains("hidden");
    if(opening && anyPanelOpen()) closeAllPanels();
    m.classList.toggle("hidden"); playSfx(opening ? "menu" : "menuClose"); });
  // v4.19: the menu now carries world VERBS as well as panels — eat / gift / ride had a key and nothing
  // else, which silently removed food, the whole friendship layer (and so marriage) and the horse from
  // touch play. Each verb self-guards, so the uiBlocking check mirrors the keyboard path exactly.
  const ACTIONS = { eat:() => eatFood(), gift:() => giveGift(), ride:() => rideToggle() };
  $("touchMenu").querySelectorAll("button").forEach(b => {
    b.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
      closeTouchMenu();
      const act = b.dataset.action;
      if(act){ if(!uiBlocking()) ACTIONS[act](); return; }
      const id = b.dataset.panel; togglePanel(id, RENDER[id]); });
  });
}
function closeTouchMenu(){ const m = $("touchMenu"); if(m) m.classList.add("hidden"); }

// Arrows / PageUp / PageDown / Home / End scroll a long letter instead of skipping it.
// Returns true when the key was consumed.
function letterScrollKey(k){
  const el = $("letterBody");
  if(!el || $("intro").classList.contains("hidden")) return false;
  const page = Math.max(40, el.clientHeight - 24);
  switch(k){
    case "arrowdown": el.scrollTop += 40; break;
    case "arrowup":   el.scrollTop -= 40; break;
    case "pagedown":  el.scrollTop += page; break;
    case "pageup":    el.scrollTop -= page; break;
    case "home":      el.scrollTop = 0; break;
    case "end":       el.scrollTop = el.scrollHeight; break;
    default: return false;
  }
  updateLetterFade();
  return true;
}

window.addEventListener("beforeunload", saveGame);
document.addEventListener("visibilitychange", () => { if(document.hidden && state) saveGame(); });
