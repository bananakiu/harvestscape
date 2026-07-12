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
function uiBlocking(){ return dlg.open || anyPanelOpen(); }

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
function closeDialog(){ $("dialog").classList.add("hidden"); dlg.open = false; clearInterval(dlg.timer); playSfx("menuClose"); }

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
  el.textContent = Math.round(goldUI.shown);
}
function refreshHUD(){
  if(!state) return;
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  const d = ((state.day-1)%SEASON_DAYS)+1;
  $("dateLine").textContent = seas + " · Day " + d + "  " + weatherInfo(state.weather).icon;
  let h = Math.floor(state.time/60)%24, m = Math.floor(state.time%60/10)*10;
  const ap = h>=12 ? "pm":"am"; let h12 = h%12; if(h12===0) h12=12;
  $("timeLine").textContent = h12 + ":" + String(m).padStart(2,"0") + " " + ap;
  // gold is drawn by syncGold() each frame so it counts up (see below); don't snap it here
  const e = state.energy, bar = $("energyBar");
  bar.style.width = e + "%";
  // Warm all the way down — green → gold → deep amber. Energy is deliberately non-hazardous (you can
  // always eat or sleep), so "low" must not read as a survival-red alarm at the player (Cozy Contract
  // + palette discipline 8.1): the narrowing bar already says "low"; the tone just deepens, never reddens.
  bar.style.background = e>50 ? "linear-gradient(#b6f27a,#5aa733)"
                       : e>22 ? "linear-gradient(var(--gold-hi),var(--gold))"
                       :        "linear-gradient(var(--gold),var(--gold-d))";
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
  const xp = state.skills[skill], lvl = levelFor(xp);
  return lvl >= 99 ? 1 : clamp(inv(xp, XP_TABLE[lvl], XP_TABLE[lvl+1]), 0, 1);
}
function showXpOrb(skill){
  const rail = $("xpOrbs"); if(!rail || !state || !(skill in state.skills)) return;
  const lvl = levelFor(state.skills[skill]), frac = xpFrac(skill);
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
    d.onclick = () => selectSlot(i);
    hb.appendChild(d);
  });
}

// ---- quest tracker ----
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
    if(q.reportTo) html += `<div class="qt-obj" style="color:var(--gold-hi)">▸ Report to ${q.reportTo}</div>`;
    html += `</div>`;
  }
  html += boardTrackerHtml();
  box.innerHTML = html;
}
// a faint second card for today's noticeboard request — the small, skippable goal of the day
function boardTrackerHtml(){
  if(gameMode !== "play" || !state || !state.flags) return "";
  if(requestFilled()) return "";
  const r = todaysRequest(); if(!r) return "";
  const have = state.inv[r.item] || 0, ready = have >= r.qty;
  return `<div class="qt-card" style="opacity:.82"><div class="qt-title" style="color:#cbb98f">📌 Noticeboard</div>` +
    `<div class="qt-obj ${ready?"done":""}">${ready?'<span class="chk">✔</span> ':"• "}${r.qty} × ${r.item} — ${NPCDEF[r.who].name}` +
    (ready ? "" : ` (${have}/${r.qty})`) + `</div>` +
    (ready ? `<div class="qt-obj" style="color:var(--gold-hi)">▸ Take them to ${NPCDEF[r.who].name}</div>` : "") +
    `</div>`;
}

// ---- panels ----
function openPanel(id, render){
  closeAllPanels(true);
  openPanels.add(id); $(id).classList.remove("hidden");
  if(render) render();
  playSfx("menu");
}
function closePanel(id){ if(openPanels.has(id)){ openPanels.delete(id); $(id).classList.add("hidden"); playSfx("menuClose"); } }
function closeAllPanels(silent){ for(const id of Array.from(openPanels)){ openPanels.delete(id); $(id).classList.add("hidden"); } if(!silent && dlg.open) closeDialog(); }
function togglePanel(id, render){ if(openPanels.has(id)) closePanel(id); else openPanel(id, render); }

// ---- Skills panel: a RuneScape-style skill grid ----
// A compact tile per skill — procedural icon + level badge + XP bar + one muted next-goal line —
// instead of the old wall of prose. The full detail (exact XP, remaining to next, earned masteries
// and the whole 25/50/75/99 table) opens on tap, one skill at a time, so the reference is all still
// there (principle 4.3) without burying the levels. Icons reuse the mkIcon/hydrateIcons sprite
// pipeline; every colour role is the pre-blessed one (level --gold, bar --blue, unlock --blue,
// mastery --gold-hi, next-mastery --ink-soft) — no new hex, no new frame.
const SKILL_ICON = { Farming:"item_Turnip", Woodcutting:"item_Wood", Mining:"item_Stone", Fishing:"item_Sardine", Cooking:"item_Berry Bun" };
let skillSel = null;   // which skill's detail is expanded (null = grid only)
function selectSkill(s){ skillSel = (skillSel === s) ? null : s; playSfx("select"); renderSkills(); }
function skillDetailHtml(s){
  if(!s || !(s in state.skills))
    return `<div class="skillHint">Tap a skill for its XP, unlocks and mastery milestones.</div>`;
  const xp = state.skills[s], lvl = levelFor(xp);
  const next = lvl>=99 ? xp : XP_TABLE[lvl+1], remain = Math.max(0, next - xp);
  let h = `<div class="sdHead"><span class="sdName">${s}</span><span class="sdLvl">Level ${lvl}</span></div>`;
  h += `<div class="sdXp">${xp.toLocaleString()} XP` +
       (lvl>=99 ? ` · <span class="max">MAX</span>` : ` · ${remain.toLocaleString()} to Lv ${lvl+1}`) + `</div>`;
  const un = nextUnlock(s);
  if(un) h += `<div class="sdLine unlock">▸ Unlocks ${un.label} at Lv ${un.at}</div>`;
  const earned = [25,50,75,99].filter(n => lvl >= n);
  if(earned.length) h += earned.map(n => `<div class="sdLine earned">★ ${MASTERY[s][n]}</div>`).join("");
  const nx = nextMastery(s);
  if(nx) h += `<div class="sdLine next">☆ Lv ${nx.at}: ${nx.text}</div>`;
  else if(!un) h += `<div class="sdLine earned">Mastered — every craft learned.</div>`;
  return h;
}
function renderSkills(){
  const b = $("skillsPanel").querySelector(".body");
  let total = 0; for(const s in state.skills) total += levelFor(state.skills[s]);
  let html = `<div class="skillTotal">Total Level <b>${total}</b> / ${99*5}</div><div class="skillGrid">`;
  for(const s in state.skills){
    const xp = state.skills[s], lvl = levelFor(xp);
    const cur = XP_TABLE[lvl], next = lvl>=99?cur:XP_TABLE[lvl+1];
    const pct = lvl>=99 ? 100 : Math.floor(inv(xp,cur,next)*100);
    const un = nextUnlock(s), nx = nextMastery(s);
    const goal = un ? `<span class="sgoal unlock">▸ ${un.label} · ${un.at}</span>`
               : nx ? `<span class="sgoal mast">☆ Lv ${nx.at}: ${MASTERY[s][nx.at].split(" — ")[0]}</span>`
               :      `<span class="sgoal done">★ mastered</span>`;
    html += `<div class="skillCell${s===skillSel?" sel":""}" onclick="selectSkill('${s}')">` +
      `<span class="sIcon" data-icon="${SKILL_ICON[s]}"><canvas></canvas><span class="sLvl">${lvl}</span></span>` +
      `<span class="sBody"><span class="sName">${s}</span>` +
      `<span class="xpbarWrap"><span class="xpbar" style="width:${pct}%"></span></span>` +
      goal + `</span></div>`;
  }
  html += `</div><div id="skillDetail">${skillDetailHtml(skillSel)}</div>`;
  html += `<details class="skillHelp"><summary>About the XP curve</summary>` +
    `<div>Levels are paced to be savored — each takes a little more than the last, and only the final stretch to 99 is a true completionist climb. Every skill earns a mastery at 25 · 50 · 75 · 99.</div></details>`;
  b.innerHTML = html;
  hydrateIcons(b);   // draw the skill-tile icons (the old panel declared an icon map but never used it)
}
function renderInv(){
  const b = $("invPanel").querySelector(".body");
  const items = Object.keys(state.inv);
  if(!items.length){ b.innerHTML = `<div class="locked">Empty. The valley provides — go get it!</div>`; return; }
  b.innerHTML = items.map(it => {
    const ic = spr["item_"+it] ? `<canvas></canvas>` : "";
    const sell = ITEM_SELL[it];
    const val = sell ? `<span class="sub" style="margin-left:.4em">${sell}g ea</span>` : (EDIBLE[it] ? `<span class="sub" style="margin-left:.4em">+${EDIBLE[it]} energy</span>` : "");
    const ex = EXAMINE[it] ? `<div class="exline">${escapeHtml(EXAMINE[it])}</div>` : "";
    return `<div class="row"><span class="lead" data-icon="item_${it}">${ic}<span>${it}${val}</span></span><span>×${state.inv[it]}</span></div>${ex}`;
  }).join("");
  hydrateIcons(b);
}
// ---- The Collection: a museum of everything you've ever found, with its examine flavour ----
const MUSEUM = [
  { name:"Crops",         items:()=>Object.values(CROPS).map(c=>c.name) },
  { name:"The Orchard",   items:()=>Object.values(FRUIT_TREES).map(t=>t.fruit) },
  { name:"Fish",          items:()=>FISH.map(f=>f.name) },
  { name:"The Legends",   items:()=>LEGENDS.map(l=>l.name) },
  { name:"Gems",          items:()=>Object.keys(GEM_SELL) },
  { name:"The Shore",     items:()=>Object.keys(SHORE) },
  { name:"Farm & Forage", items:()=>["Field Salad","Frostberry","Berry Bun","Honey","Egg","Large Egg","Milk","Large Milk"] },   // no Wool: there are no sheep, so it can never be discovered (would cap the Collection one short)
  { name:"The Kitchen",   items:()=>RECIPES.map(r=>r.name) },
  { name:"Materials",     items:()=>["Wood","Pine Wood","Maple Wood","Stone","Copper Ore","Iron Ore","Gold Ore"] },
];
function renderMuseum(){
  const disc = state.discovered || {};
  let total=0, found=0, body="";
  for(const sec of MUSEUM){
    const items = sec.items();
    let cells = "";
    for(const it of items){
      total++;
      if(disc[it]){ found++;
        cells += `<div class="museItem has" data-icon="item_${it}" title="${escapeHtml(EXAMINE[it]||it)}"><canvas></canvas><span>${it}</span></div>`;
      } else {
        cells += `<div class="museItem locked" title="Not yet discovered"><span class="q">?</span><span>· · ·</span></div>`;
      }
    }
    body += `<div class="museSec">${sec.name}</div><div class="museGrid">${cells}</div>`;
  }
  return `<details class="museum"><summary>🗃 The Collection — ${found}/${total} discovered</summary>${body}</details>`;
}
function renderJournal(){
  const b = $("questPanel").querySelector(".body");
  let html = "";
  // Guild wings progress
  const lit = wingsLit();
  html += `<div class="jq"><h3 style="color:var(--gold-hi)">🏛 Guild of Nine Crafts — ${lit}/9 wings lit</h3><div style="display:flex;flex-wrap:wrap;gap:.25em .6em;font-size:.86em;">`;
  WINGS.forEach(w => { const on = w.lit();
    html += `<span style="color:${on?"var(--gold-hi)":"var(--ink-soft)"}">${on?"◆":"◇"} ${w.name}</span>`; });
  html += `</div></div>`;
  // Story quests grouped under their act, so a casual player perceives the arc — not a flat list.
  html += `<div class="actHead">${ACT_TITLES[1]}</div>`;
  let act2Open = false;
  QUESTS.forEach((q, idx) => {
    const done = idx < state.questIdx;
    const active = idx === state.questIdx;
    if(idx > state.questIdx){
      // Always reveal the finale as Act I's destination — greyed, so the goal is visible early.
      if(idx === FINALE_IDX && state.questIdx < FINALE_IDX){
        html += `<div class="jq dest"><h3>◇ ${QUESTS[FINALE_IDX].title} <span style="color:var(--ink-soft);font-size:.8em;">— where Act I is heading</span></h3>` +
                `<div class="desc">Relight the Nine Crafts and bring the Grand Festival back to the coast.</div></div>`;
      }
      return; // other future quests stay hidden
    }
    if(idx > FINALE_IDX && !act2Open){ html += `<div class="actHead">${ACT_TITLES[2]}</div>`; act2Open = true; }
    html += `<div class="jq"><h3 class="${done?"done":""}">${done?"✔ ":active?"✒ ":""}${q.title} <span style="color:var(--ink-soft);font-size:.8em;">— ${q.giver}</span></h3>`;
    html += `<div class="desc">“${q.desc}”</div>`;
    q.obj.forEach(o => { const [c,m] = objProgress(o); const d = c>=m;
      html += `<div class="obj ${d?"done":""}">${d?"✔":"•"} ${o.text}${m>1?` (${c}/${m})`:""}</div>`; });
    html += `</div>`;
  });
  if(state.questIdx >= QUESTS.length) html += `<div style="text-align:center;color:var(--gold-hi);">✦ Every task complete. The valley is yours. ✦</div>`;
  html += renderPages();
  html += renderAlmanac();
  html += renderMuseum();
  html += `<details class="howto"><summary>❔ How to Play</summary><div class="howtoBody">${escapeHtml(HOWTO_TEXT)}</div></details>`;
  b.innerHTML = html;
  hydrateIcons(b);   // draw the Collection's discovered-item icons
}

// ---- Grandpa's torn pages: found by living, re-readable forever ----
function renderPages(){
  const n = pagesFound();
  let h = `<div class="jq"><h3 style="color:#e8d9a8">📜 Grandpa's Almanac — ${n}/9 pages</h3>`;
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
function renderAlmanac(){
  const today = yearSlot(curSeason(), dayOfSeason());
  const row = (icon, name, season, day, done, note) => {
    const slot = yearSlot(season, day);
    const isToday = slot === today;
    const col = done ? "var(--ink-soft)" : isToday ? "var(--gold-hi)" : "var(--parch)";
    return `<div class="obj" style="color:${col}">${done?"✔":icon} ${name}` +
      `<span style="color:var(--ink-soft);font-size:.85em;"> — ${season} ${day}${isToday?" · today!":""}</span>` +
      (note?`<div style="color:var(--ink-soft);font-size:.8em;margin-left:1.1em;">${note}</div>`:"") + `</div>`;
  };
  // ---- the sky, and what it's offering ----
  const wNow = weatherInfo(state.weather), wNext = weatherInfo(state.forecast || "clear");
  let h = `<div class="jq"><h3 style="color:var(--gold-hi)">🌦 The Sky</h3>`;
  h += `<div class="obj" style="color:${wNow.tone}">${wNow.icon} Today — ${wNow.name}` +
       `<div style="color:var(--ink-soft);font-size:.82em;margin-left:1.1em;">${wNow.offer}</div></div>`;
  h += `<div class="obj" style="color:${wNext.tone}">${wNext.icon} Tomorrow — ${wNext.name}` +
       `<div style="color:var(--ink-soft);font-size:.82em;margin-left:1.1em;">${wNext.offer}</div></div>`;
  h += `<div class="desc" style="margin-top:.35em;font-size:.85em;">Rain waters your fields. <b>Snow does not</b> — the ground is frozen, and a frostbloom still wants the can.</div>`;
  h += `</div>`;

  h += `<div class="jq"><h3 style="color:var(--gold-hi)">📅 Almanac — Year ${YEAR()}</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">The valley keeps its own calendar. Be on the coast for a festival; bring a gift on a birthday.</div>`;
  for(const f of FESTIVALS) h += row("✦", f.name, f.season, f.day, festivalDoneThisYear(f), f.blurb);
  if(state.flags.anniversaryDay != null){
    const s = SEASONS[Math.floor((state.flags.anniversaryDay-1)/SEASON_DAYS)];
    const d = ((state.flags.anniversaryDay-1) % SEASON_DAYS) + 1;
    h += row("🏮", "The Lantern Festival", s, d, !!state.flags["did_anniversary_"+YEAR()], "The night the valley woke. Every year, on the coast.");
  }
  h += `</div><div class="jq"><h3 style="color:var(--rose)">🎂 Birthdays</h3>`;
  for(const id in BIRTHDAYS){ const b = BIRTHDAYS[id];
    h += row("🎂", NPCDEF[id].name, b.season, b.day, !!state.flags["bday_"+id+"_"+YEAR()], null); }
  h += `</div>`;

  // ---- Bram's ledger of legends ----
  const allLanded = legendsCaught() >= LEGENDS.length;
  h += `<div class="jq"><h3 style="color:var(--blue)">🎣 Bram's Ledger — ${legendsCaught()}/${LEGENDS.length} landed</h3>`;
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
function openProjects(){ openPanel("projPanel", renderProjects); }
function renderProjects(){
  const panel = $("projPanel"); if(panel.classList.contains("hidden")) return;
  const b = panel.querySelector(".body");
  let html = `<div class="desc" style="margin-bottom:.5em;color:var(--ink-soft);">` +
    `“Coin is only stored work, child. Spend it and the valley remembers.” — Rowan</div>`;
  for(const p of PROJECTS){
    const done = projectDone(p.id), pending = projectPending(p.id);
    const cost = Object.entries(p.items).map(([it,n]) =>
      `<span style="color:${(state.inv[it]||0)>=n?"var(--parch)":"#c98a6a"}">${n}× ${it}</span>`).join(" · ");
    const goldOk = state.gold >= p.gold;
    // the .sub spans are inline in the shop; here each wants its own line
    html += `<div class="row"><span class="lead"><span>` +
      `<span style="display:block;color:${done?"var(--gold-hi)":"var(--parch)"}">${done?"✔ ":pending?"🔨 ":""}${p.name}</span>` +
      `<span class="sub" style="display:block;margin:.1em 0;">${done ? p.done : pending ? "The work begins at dawn." : p.blurb}</span>` +
      (done||pending ? "" : `<span class="sub" style="display:block;">${cost}</span>`) +
      `</span></span>`;
    html += done || pending
      ? `<span><span class="price" style="color:var(--gold-hi)">${done?"built":"pending"}</span></span>`
      : `<span><span class="price" style="color:${goldOk?"var(--gold-hi)":"#c98a6a"}">${p.gold}g</span> ` +
        `<button class="buy" ${canFund(p)?"":"disabled"} onclick="fundProject('${p.id}')">fund</button></span>`;
    html += `</div>`;
  }
  const left = PROJECTS.filter(p=>!projectDone(p.id)).length;
  if(!left) html += `<div style="margin-top:.6em;text-align:center;color:var(--gold-hi);">✦ Every page of the ledger is struck through. ✦</div>`;
  b.innerHTML = html;
}

// ---- shop ----
let shopTab = "sell";
function openShop(tab, silent){ shopTab = tab || "sell"; openPanel("shopPanel", renderShop);
  if(!silent) toast(pick(TOM_GREET), "#e9dcc0"); }
function renderShop(){
  const panel = $("shopPanel");
  const tabs = $("shopTabs");
  const TABS = [["sell","Sell"],["buy","Seeds & Food"],["tools","Tools"]];
  tabs.innerHTML = TABS.map(([k,l]) => `<div class="tab ${k===shopTab?"active":""}" data-tab="${k}">${l}</div>`).join("");
  tabs.querySelectorAll(".tab").forEach(t => t.onclick = () => { shopTab = t.dataset.tab; playSfx("select"); renderShop(); });
  const b = panel.querySelector(".body");
  let html = "";
  if(shopTab === "sell"){
    const sellables = Object.keys(state.inv).filter(i => ITEM_SELL[i]);
    if(!sellables.length) html += `<div class="locked">Nothing to sell yet — go harvest, chop, mine or fish!</div>`;
    sellables.forEach(i => {
      // Tom's demand: show what the NEXT one fetches, and say so plainly when it has slipped
      const now = nextUnitPrice(i), base = Math.round(baseUnitPrice(i)), lvl = demandLevel(i);
      const dipped = now < base;
      const note = dipped
        ? `<span class="sub" style="color:#c98a6a">demand ${Math.round(lvl*100)}% · ${soldToday(i)} sold today</span>`
        : `<span class="sub">×${state.inv[i]}</span>`;
      const priceHtml = dipped
        ? `<span class="price" style="color:#c98a6a">${now}g</span> <span class="sub" style="text-decoration:line-through;opacity:.55">${base}g</span>`
        : `<span class="price">${now}g</span>`;
      // "all" shows the blended total it will actually fetch, not just the next unit's price
      const allTotal = bundlePrice(i, state.inv[i]);
      html += `<div class="row"><span class="lead" data-icon="item_${i}"><canvas></canvas><span>${i} ${note}</span></span>` +
        `<span>${priceHtml} <button onclick="sellItem('${jsq(i)}',1)">1</button> ` +
        `<button onclick="sellItem('${jsq(i)}',${state.inv[i]})" title="${allTotal}g for all ${state.inv[i]}">all · ${allTotal}g</button></span></div>`;
    });
  } else if(shopTab === "buy"){
    for(const id in CROPS){ const c = CROPS[id]; const ok = skillLvl("Farming") >= c.lvl;
      const inSeason = c.seasons.includes(curSeason());
      const sub = ok ? `${c.seasons.join("/")} · ${c.days}d · ${c.sell}g${inSeason?"":" · <span style='color:#c98a6a'>off-season</span>"}` : `🔒 Farming ${c.lvl}`;
      html += `<div class="row ${ok?"":"locked"}"><span class="lead" data-icon="item_${c.name} Seeds"><canvas></canvas>` +
        `<span>${c.name} Seeds <span class="sub">${sub}</span></span></span>` +
        `<span><span class="price">${c.seed}g</span> <button class="buy" ${ok&&state.gold>=c.seed?"":"disabled"} onclick="buySeed('${id}')">buy</button></span></div>`;
    }
    html += `<div class="row"><span class="lead" data-icon="item_Berry Bun"><canvas></canvas><span>Berry Bun <span class="sub">+34 energy</span></span></span><span><span class="price">30g</span> <button class="buy" ${state.gold>=30?"":"disabled"} onclick="buyFood('Berry Bun',30)">buy</button></span></div>`;
    html += `<div class="row"><span class="lead" data-icon="item_Field Salad"><canvas></canvas><span>Field Salad <span class="sub">+26 energy</span></span></span><span><span class="price">24g</span> <button class="buy" ${state.gold>=24?"":"disabled"} onclick="buyFood('Field Salad',24)">buy</button></span></div>`;
    html += `<div class="row"><span class="lead" data-icon="item_Milk"><canvas></canvas><span>Milk <span class="sub">fresh from the coast dairy · for cooking</span></span></span><span><span class="price">120g</span> <button class="buy" ${state.gold>=120?"":"disabled"} onclick="buyFood('Milk',120)">buy</button></span></div>`;
    if(anyConfided() && !state.flags.married){
      const hasBq = (state.inv["Bouquet"]||0)>0;
      html += `<h2 style="font-size:1em;color:var(--rose);margin:.4em 0 .2em;">COURTSHIP</h2>`;
      html += `<div class="row"><span class="lead" data-icon="item_Bouquet"><canvas></canvas><span>Willowbrook Bouquet <span class="sub">${hasBq?"you have one — give it to your beloved":"give it to the one who has your heart"}</span></span></span><span><span class="price">500g</span> <button class="buy" ${state.gold>=500&&!hasBq?"":"disabled"} onclick="buyBouquet()">buy</button></span></div>`;
    }
    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">ORCHARD &amp; APIARY</h2>`;
    for(const k in FRUIT_TREES){ const t = FRUIT_TREES[k];
      html += `<div class="row"><span class="lead" data-icon="item_${t.fruit}"><canvas></canvas><span>${t.name} ` +
        `<span class="sub">${t.blurb} · ${t.sell}g a fruit</span></span></span>` +
        `<span><span class="price">${t.cost}g</span> <button class="buy" ${state.gold>=t.cost?"":"disabled"} onclick="buySapling('${k}')">buy</button></span></div>`;
    }
    html += `<div class="row"><span class="lead" data-icon="item_Honey"><canvas></canvas><span>Beehive ` +
      `<span class="sub">honey every morning · more where more is in bloom</span></span></span>` +
      `<span><span class="price">${HIVE_COST}g</span> <button class="buy" ${state.gold>=HIVE_COST?"":"disabled"} onclick="buyHive()">buy</button></span></div>`;

    html += `<h2 style="font-size:1em;color:var(--gold-hi);margin:.4em 0 .2em;">RANCH</h2>`;
    const hens = state.animals.chickens.length;
    html += `<div class="row"><span class="lead" data-icon="item_Egg"><canvas></canvas><span>Chicken <span class="sub">lays an egg daily · lives in your coop · ${hens}/6 hens</span></span></span><span><span class="price">300g</span> <button class="buy" ${state.gold>=300&&hens<6?"":"disabled"} onclick="buyChicken()">buy</button></span></div>`;
    const cows = (state.animals.cows||[]).length;
    html += `<div class="row"><span class="lead" data-icon="item_Milk"><canvas></canvas><span>Cow <span class="sub">milk her every morning · lives in your barn · ${cows}/4 cows</span></span></span><span><span class="price">600g</span> <button class="buy" ${state.gold>=600&&cows<4?"":"disabled"} onclick="buyCow()">buy</button></span></div>`;
  } else {
    for(const tool of TOOLS){
      const cur = state.tools[tool];
      if(cur >= 3){ html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[3]}">${TOOL_TIERS[3]} ${tool} ★ <span class="sub">maxed</span></span></span></div>`; continue; }
      const c = toolCost(tool, cur+1);
      const can = state.gold>=c.g && Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it]);
      const CAN_PERK = ["", "waters a 3-tile row", "waters a 5-tile row", "waters 3×3"];
      const HOE_PERK = ["", "tills a 3-tile row", "tills a 5-tile row", "tills 3×3"];
      const perk = tool==="Can" ? CAN_PERK[cur+1] : tool==="Hoe" ? HOE_PERK[cur+1]
                 : tool==="Rod" ? "faster bites, steadier reel" : "stronger, less energy";
      const matStr = Object.keys(c.mats).map(it => { const have=state.inv[it]||0, need=c.mats[it];
        return `${need} ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(" + ");
      html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur+1]}">${TOOL_TIERS[cur+1]} ${tool}</span> ` +
        `<span class="sub">${c.g}g + ${matStr}<br>${perk}</span></span>` +
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
    const c = liftStopCost(depth);
    const matStr = Object.keys(c.mats).map(it => { const have=state.inv[it]||0, need=c.mats[it];
      return `${need}× ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(", ");
    const can = state.gold >= c.g && Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it]);
    html += `<div class="row ${can?'':'locked'}"><span class="lead"><span>Restore this stop <span class="sub">${c.g}g · ${matStr}</span></span></span>` +
      `<button class="buy" ${can?'':'disabled'} onclick="restoreLift()">restore</button></div>`;
  } else if(depth % 5 !== 0){
    const next = Math.ceil(depth/5)*5;
    html += `<div class="desc" style="margin-top:.4em;color:var(--ink-soft);">The next restorable stop is at floor ${next}.</div>`;
  }
  b.innerHTML = html;
}
function rideLift(target){
  closeAllPanels();
  playSfx("door");
  if(target === 0){ travelTo("village", 20*TILE+8, 3*TILE, "down"); toast("The lift rattles up into the daylight.", "#cbb98f"); return; }
  state.mineDepth = target;
  travelTo("mine", 2*TILE+8, 3*TILE, "down");
  toast(`The lift lowers you to floor ${target}.`, "#a9b0c0");
}
function restoreLift(){
  const depth = state.mineDepth||1;
  if(depth % 5 !== 0 || (state.liftStops||[]).includes(depth)) return;
  const c = liftStopCost(depth);
  if(state.gold < c.g || !Object.keys(c.mats).every(it => (state.inv[it]||0) >= c.mats[it])){ playSfx("error"); return; }
  state.gold -= c.g;
  for(const it in c.mats) take(it, c.mats[it]);
  state.liftStops.push(depth);
  playSfx("upgrade"); pSparkle(state.px, state.py-12, "#ffd75a", 18);
  banner("⚙ Lift stop restored", `Floor ${depth} is on the line now — for good.`);
  saveGame();   // a permanent purchase should never be lost to a crash
  renderLift();
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
    const lvlOk = skillLvl("Cooking") >= r.lvl;
    if(!lvlOk){
      html += `<div class="row locked"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
        `<span>${r.name} <span class="sub">🔒 learned at Cooking ${r.lvl}</span></span></span>` +
        `<button disabled>cook</button></div>`;
      return;
    }
    const can = Object.keys(r.ing).every(it => (state.inv[it]||0) >= r.ing[it]);
    const ingStr = Object.keys(r.ing).map(it => { const have=state.inv[it]||0, need=r.ing[it];
      return `${need}× ${it} <span style="color:${have>=need?'#8fd06a':'#c98a6a'}">(${have})</span>`; }).join(", ");
    html += `<div class="row ${can?'':'locked'}"><span class="lead" data-icon="item_${r.name}"><canvas></canvas>` +
      `<span>${r.name} <span class="sub">${ingStr} · +${r.energy}e · sells ${r.sell}g</span></span></span>` +
      `<button ${can?'':'disabled'} onclick="cookRecipe(${i})">cook</button></div>`;
  });
  b.innerHTML = html; hydrateIcons(b);
}
function hydrateIcons(root){
  root.querySelectorAll("[data-icon]").forEach(el => {
    const c = el.querySelector("canvas"); if(!c) return;
    const s = spr[el.dataset.icon]; if(!s) return;
    c.width = s.width; c.height = s.height; c.getContext("2d").drawImage(s,0,0);
  });
}

// ---- settings ----
function renderSettings(){
  const b = $("settingsPanel").querySelector(".body");
  b.innerHTML =
    `<div class="setRow"><span>Music</span><input type="range" id="setMusic" min="0" max="100" value="${Math.round(SND.musicVol*100)}"><span class="val">${Math.round(SND.musicVol*100)}</span></div>` +
    `<div class="setRow"><span>Sound FX</span><input type="range" id="setSfx" min="0" max="100" value="${Math.round(SND.sfxVol*100)}"><span class="val">${Math.round(SND.sfxVol*100)}</span></div>` +
    `<div class="setRow"><span>Audio</span><button class="dangerBtn" id="setMute" style="background:#3d5a2e;border-color:#6a8f52;color:#eaffd8;">${SND.enabled?"On":"Off"}</button></div>` +
    `<div class="setRow"><span>Save</span><span style="color:var(--ink-soft);font-size:.85em;">auto-saves each night</span></div>` +
    `<div class="setRow"><span>Version</span><button class="dangerBtn" id="setNews" style="background:#3a3550;border-color:#6a648f;color:#e6e0ff;">v${VERSION.name} — What's New</button></div>` +
    `<div class="setRow"><span>Danger zone</span><button class="dangerBtn" id="setWipe">Delete Save &amp; Restart</button></div>` +
    `<div style="margin-top:.5em;color:var(--ink-soft);font-size:.82em;text-align:center;">Harvestscape v${VERSION.name} — a tiny cozy world, made in code.</div>`;
  const mus = $("setMusic"), sfx = $("setSfx");
  mus.oninput = () => { setMusicVol(mus.value/100); mus.nextElementSibling.textContent = mus.value; };
  sfx.oninput = () => { setSfxVol(sfx.value/100); sfx.nextElementSibling.textContent = sfx.value; };
  sfx.onchange = () => playSfx("select");
  $("setMute").onclick = () => { setMusicEnabled(!SND.enabled); renderSettings(); };
  $("setNews").onclick = () => openPanel("newsPanel", renderNews);
  $("setWipe").onclick = () => { if(confirm("Delete your save and restart from the title?")){ wipeSave(); location.reload(); } };
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
  lines.push("☕ Energy restored");
  lines.push("💾 Progress saved");
  lines.forEach((t,i) => { const li = document.createElement("li"); li.textContent = t; li.style.animationDelay = (i*0.28+0.3)+"s"; list.appendChild(li); });
  playSfx("wake");
  setTimeout(() => {
    card.classList.add("hidden");
    sleeping = false;
    // never unpause into an active cutscene/festival (belt-and-suspenders with doSleep's guard)
    if(!isCutscene() && !state.flags.festivalActive){ fadeTo(false); paused = false; }
    refreshHUD(); refreshHotbar(); refreshQuestTracker();
    if(s.rain) queuePage(6, 800);                              // "On Rain"
    catchUpPages();                                            // re-offer any page that never landed
    setTimeout(maybeLastPage, 1400);                           // the letter under the door
  }, 2700);
}

// ---- controls hint ----
function setControlsHint(){
  // Line 1 = left-hand world verbs (all reachable without leaving WASD); line 2 = right-hand menus.
  $("controlsHint").innerHTML =
    `<b>Move</b> <kbd>WASD</kbd> · <b>Use tool</b> <kbd>Space</kbd> · <b>Interact / harvest / talk</b> <kbd>E</kbd> · <b>Examine</b> <kbd>Q</kbd> · <b>Cycle seeds</b> <kbd>R</kbd> · <b>Eat</b> <kbd>F</kbd> · <b>Gift Maya</b> <kbd>G</kbd><br>` +
    `<b>Skills</b> <kbd>K</kbd> · <b>Backpack</b> <kbd>I</kbd> · <b>Journal</b> <kbd>J</kbd> · slots <kbd>1</kbd>–<kbd>6</kbd> · Enter buildings, the mine &amp; the coast · <b>Sleep</b> in your bed indoors`;
}

// ---- INPUT ----
function firstGesture(){ audioResume(); }
document.addEventListener("keydown", e => {
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
  else if(k === "r"){ if(!uiBlocking()) cycleSeed(); }
  else if(k === "f"){ if(!uiBlocking()) eatFood(); }
  else if(k === "g"){ if(!uiBlocking()) giveGift(); }
  else if(k === "q" || k === "x"){ examine(); }   // Q is the WASD-native primary; X kept as a legacy alias
  else if(k === "m"){ setMusicEnabled(!SND.enabled); toast("Music "+(SND.enabled?"on":"off")); }
  else if(k === "escape"){ if(dlg.open) closeDialog(); else closeAllPanels(); }
  else if("123456".includes(k)) selectSlot(+k-1);
});
document.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });
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
  if(e.button === 2){ interact(); return; }
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

  // Backpack / Journal / Skills / Settings have no key on a touch device — give them a menu.
  const RENDER = { invPanel:renderInv, questPanel:renderJournal, skillsPanel:renderSkills, settingsPanel:renderSettings };
  $("btnMenu").addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
    if(isCutscene() || fishing.state === "reel") return;
    const m = $("touchMenu"); const opening = m.classList.contains("hidden");
    if(opening && anyPanelOpen()) closeAllPanels();
    m.classList.toggle("hidden"); playSfx(opening ? "menu" : "menuClose"); });
  $("touchMenu").querySelectorAll("button").forEach(b => {
    b.addEventListener("pointerdown", e => { e.preventDefault(); firstGesture();
      closeTouchMenu(); const id = b.dataset.panel; togglePanel(id, RENDER[id]); });
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
