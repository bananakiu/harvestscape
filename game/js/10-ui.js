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
function refreshHUD(){
  if(!state) return;
  const seas = SEASONS[Math.floor((state.day-1)/SEASON_DAYS)%4];
  const d = ((state.day-1)%SEASON_DAYS)+1;
  $("dateLine").textContent = seas + " · Day " + d + "  " + weatherInfo(state.weather).icon;
  let h = Math.floor(state.time/60)%24, m = Math.floor(state.time%60/10)*10;
  const ap = h>=12 ? "pm":"am"; let h12 = h%12; if(h12===0) h12=12;
  $("timeLine").textContent = h12 + ":" + String(m).padStart(2,"0") + " " + ap;
  $("goldVal").textContent = state.gold;
  const e = state.energy, bar = $("energyBar");
  bar.style.width = e + "%";
  bar.style.background = e>50 ? "linear-gradient(#b6f27a,#5aa733)" : e>22 ? "linear-gradient(#ffd76a,#e0a020)" : "linear-gradient(#ff8a7a,#c0402a)";
  refreshEventPill();
  drawClockDial();
}

// "Luau in 3 days" — only shows when something is close, so it isn't permanent clutter
function refreshEventPill(){
  const pill = $("eventPill"); if(!pill) return;
  const ev = nextEvent();
  if(!ev || ev.daysAway > 7){ pill.classList.add("hidden"); return; }
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
    html += `<div class="qt-card"><div class="qt-title">✒ ${q.title}</div>`;
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

function renderSkills(){
  const b = $("skillsPanel").querySelector(".body");
  const iconFor = { Farming:"item_Turnip", Woodcutting:"item_Wood", Mining:"item_Stone", Fishing:"item_Sardine", Cooking:"item_Berry Bun" };
  let total=0, html="";
  for(const s in state.skills){
    const xp = state.skills[s], lvl = levelFor(xp); total += lvl;
    const cur = XP_TABLE[lvl], next = lvl>=99?cur:XP_TABLE[lvl+1];
    const pct = lvl>=99?100:Math.floor(inv(xp,cur,next)*100);
    html += `<div class="xpRow"><span class="sname"><span class="lvl">${lvl}</span> ${s}</span>` +
      `<span class="xpbarWrap"><span class="xpbar" style="width:${pct}%"></span></span>` +
      `<span class="xpnum">${xp}/${lvl>=99?"MAX":next}</span></div>`;
    // what mastery you already have, and the one you're working toward
    const earned = [25,50,75,99].filter(n => lvl >= n);
    if(earned.length) html += `<div style="margin:-.15em 0 .1em .2em;font-size:.78em;color:var(--gold-hi);">` +
      earned.map(n => "★ " + MASTERY[s][n].split(" — ")[0]).join(" · ") + `</div>`;
    const nx = nextMastery(s);
    if(nx) html += `<div style="margin:-.05em 0 .35em .2em;font-size:.76em;color:var(--ink-soft);">` +
      `Lv ${nx.at}: ${nx.text}</div>`;
  }
  html += `<div style="margin-top:.6em;text-align:center;color:var(--gold-hi);">Total Level ${total} / ${99*5}</div>`;
  html += `<div style="margin-top:.2em;text-align:center;color:var(--ink-soft);font-size:.82em;">Real RuneScape XP curve — 92 is halfway to 99. Mastery at 25 · 50 · 75 · 99.</div>`;
  b.innerHTML = html;
}
function renderInv(){
  const b = $("invPanel").querySelector(".body");
  const items = Object.keys(state.inv);
  if(!items.length){ b.innerHTML = `<div class="locked">Empty. The valley provides — go get it!</div>`; return; }
  b.innerHTML = items.map(it => {
    const ic = spr["item_"+it] ? `<canvas></canvas>` : "";
    const sell = ITEM_SELL[it];
    const val = sell ? `<span class="sub" style="margin-left:.4em">${sell}g ea</span>` : (EDIBLE[it] ? `<span class="sub" style="margin-left:.4em">+${EDIBLE[it]} energy</span>` : "");
    return `<div class="row"><span class="lead" data-icon="item_${it}">${ic}<span>${it}${val}</span></span><span>×${state.inv[it]}</span></div>`;
  }).join("");
  hydrateIcons(b);
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
  QUESTS.forEach((q, idx) => {
    const done = idx < state.questIdx;
    const active = idx === state.questIdx;
    if(idx > state.questIdx) return; // hide future quests
    html += `<div class="jq"><h3 class="${done?"done":""}">${done?"✔ ":active?"✒ ":""}${q.title} <span style="color:var(--ink-soft);font-size:.8em;">— ${q.giver}</span></h3>`;
    html += `<div class="desc">“${q.desc}”</div>`;
    q.obj.forEach(o => { const [c,m] = objProgress(o); const d = c>=m;
      html += `<div class="obj ${d?"done":""}">${d?"✔":"•"} ${o.text}${m>1?` (${c}/${m})`:""}</div>`; });
    html += `</div>`;
  });
  if(state.questIdx >= QUESTS.length) html += `<div style="text-align:center;color:var(--gold-hi);">✦ Every task complete. The valley is yours. ✦</div>`;
  html += renderPages();
  html += renderAlmanac();
  b.innerHTML = html;
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
  h += `<div class="jq"><h3 style="color:var(--blue)">🎣 Bram's Ledger — ${legendsCaught()}/${LEGENDS.length} landed</h3>`;
  h += `<div class="desc" style="margin-bottom:.3em;">Five fish that rise only when everything lines up. Bram tells you one for every heart.</div>`;
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
      html += `<div class="row"><span class="lead" data-icon="item_${i}"><canvas></canvas><span>${i} ${note}</span></span>` +
        `<span>${priceHtml} <button onclick="sellItem('${jsq(i)}',1)">1</button> <button onclick="sellItem('${jsq(i)}',${state.inv[i]})">all</button></span></div>`;
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
      const c = TIER_COST[cur+1];
      const can = state.gold>=c.g && (state.inv[c.ore]||0)>=c.n;
      const CAN_PERK = ["", "waters a 3-tile row", "waters a 5-tile row", "waters 3×3"];
      const HOE_PERK = ["", "tills a 3-tile row", "tills a 5-tile row", "tills 3×3"];
      const perk = tool==="Can" ? CAN_PERK[cur+1] : tool==="Hoe" ? HOE_PERK[cur+1]
                 : tool==="Rod" ? "faster bites, steadier reel" : "stronger, less energy";
      html += `<div class="row"><span class="lead" data-icon="tool_${TOOL_ICON[tool]}"><canvas></canvas><span style="color:${TIER_COL[cur+1]}">${TOOL_TIERS[cur+1]} ${tool}</span> ` +
        `<span class="sub">${c.g}g + ${c.n} ${c.ore} · ${perk}<br>you have ${state.inv[c.ore]||0} ${c.ore}</span></span>` +
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
    `<div class="setRow"><span>Danger zone</span><button class="dangerBtn" id="setWipe">Delete Save &amp; Restart</button></div>` +
    `<div style="margin-top:.5em;color:var(--ink-soft);font-size:.82em;text-align:center;">Harvestscape — a tiny cozy world, made in code.</div>`;
  const mus = $("setMusic"), sfx = $("setSfx");
  mus.oninput = () => { setMusicVol(mus.value/100); mus.nextElementSibling.textContent = mus.value; };
  sfx.oninput = () => { setSfxVol(sfx.value/100); sfx.nextElementSibling.textContent = sfx.value; };
  sfx.onchange = () => playSfx("select");
  $("setMute").onclick = () => { setMusicEnabled(!SND.enabled); renderSettings(); };
  $("setWipe").onclick = () => { if(confirm("Delete your save and restart from the title?")){ wipeSave(); location.reload(); } };
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
  $("controlsHint").innerHTML =
    `<b>Move</b> <kbd>WASD</kbd> · <b>Use tool</b> <kbd>Space</kbd> · <b>Interact / harvest / talk</b> <kbd>E</kbd> · <b>Cycle seeds</b> <kbd>R</kbd> · <b>Eat</b> <kbd>F</kbd> · <b>Gift Maya</b> <kbd>G</kbd><br>` +
    `<b>Skills</b> <kbd>K</kbd> · <b>Backpack</b> <kbd>I</kbd> · <b>Journal</b> <kbd>J</kbd> · Enter buildings, the mine &amp; the coast · <b>Sleep</b> in your bed indoors · slots <kbd>1</kbd>–<kbd>6</kbd>`;
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
