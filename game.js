/* Coordinate Pixel Quest — standalone game. No servers, accounts, third-party libraries or API keys. */
(() => {
'use strict';
const DATA = window.CPQ;
const quests = DATA.quests;
const palette = DATA.palette;
const W=167,H=35, STORAGE='cpq_pixel_valley_v1';
const $ = id => document.getElementById(id);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const qById = id => quests.find(q=>q.id===id);
const key = (x,y) => `${x},${y}`;
const valid = (x,y) => x>=1&&x<W-1&&y>=1&&y<H-1;
const totalCells = quests.reduce((n,q)=>n+q.pattern.join('').replaceAll('.','').length,0);
let state,active=null,brush=null,showHint=false,focusMode=false,showMapCoords=false,toastTimer=0,route=[],pendingQuest=null,shortcutCapture=null,litQuests=[];
let cam={x:0,y:0,w:0,h:0,tile:34};
const canvas=$('worldCanvas'),ctx=canvas.getContext('2d');
const questModal=$('questModal'), infoModal=$('infoModal');

function graphicsLevel(){return state?.settings?.graphics||'enhanced';}
function motionEnabled(){return state?.settings?.motion!==false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;}
function graphicsScale(){return graphicsLevel()==='low'?0:graphicsLevel()==='standard'?1:2;}

function blankState(){return {version:1,player:{x:5,y:9},done:[],paint:{},mistakes:0,hints:{},xp:0,secrets:[],settings:{sound:false,autoBrush:true,keyPrev:'q',keyNext:'e',hotkeysEnabled:true,rightClickCycle:true,graphics:'enhanced',motion:true},welcomeSeen:false};}
function load(){let s=blankState();try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');if(raw&&raw.version===1){s={...s,...raw,player:{...s.player,...raw.player},settings:{...s.settings,...raw.settings}};s.done=Array.isArray(s.done)?s.done.filter(id=>!!qById(id)):[];s.paint=s.paint&&typeof s.paint==='object'?s.paint:{};s.hints=s.hints&&typeof s.hints==='object'?s.hints:{};s.secrets=Array.isArray(s.secrets)?s.secrets:[];s.xp=Math.max(0,Number(s.xp)||0);s.mistakes=Math.max(0,Number(s.mistakes)||0);s.player.x=clamp(Math.round(s.player.x)||5,1,W-2);s.player.y=clamp(Math.round(s.player.y)||9,1,H-2);}}catch(e){/* corrupt save is ignored */}return s;}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){/* private mode may disable saving */}}
const cellCache=new Map(),allowedCellCache=new Map();
function cells(q){if(cellCache.has(q.id))return cellCache.get(q.id);const list=[];const n=q.pattern.length;for(let r=0;r<n;r++)for(let x=0;x<q.pattern[r].length;x++){const code=q.pattern[r][x];if(code!=='.')list.push({x:x+1,y:n-r,code});}cellCache.set(q.id,list);return list;}
function progressOf(q){const saved=Array.isArray(state.paint[q.id])?state.paint[q.id]:[];if(!allowedCellCache.has(q.id))allowedCellCache.set(q.id,new Set(cells(q).map(c=>key(c.x,c.y))));const allowed=allowedCellCache.get(q.id);return new Set(saved.filter(k=>allowed.has(k)));}
function complete(q){return state.done.includes(q.id);}
function unlocked(q){return q.need.every(id=>state.done.includes(id));}
function readyQuests(){return quests.filter(q=>unlocked(q)&&!complete(q));}
function paintedCount(){return quests.reduce((n,q)=>n+progressOf(q).size,0);}
function level(){return 1+Math.floor(state.xp/175);}
function nextLevelXp(){return state.xp%175;}
function rank(){const lv=level();return lv>=12?'MASTER MAPPER':lv>=8?'STAR CARTOGRAPHER':lv>=5?'TRAILBLAZER':lv>=3?'EXPLORER':'APPRENTICE';}
function foundBadges(){return [paintedCount()>0,state.done.length>0,['lamp','tree','robot'].every(id=>state.done.includes(id)),complete(qById('bridge')),paintedCount()>=100,complete(qById('festival')),complete(qById('skybridge')),complete(qById('phoenix')),complete(qById('moongate')),complete(qById('sunspire')),complete(qById('prismgate')),complete(qById('cosmos')),['side_butterfly','side_seahorse','side_airship','side_firefly','side_snowowl'].some(id=>state.done.includes(id)),state.done.length===quests.length];}
function currentPip(){
 if(state.done.length===quests.length)return 'Every region shines! You are the Master Restorer of Pixel Valley.';
 if(!complete(qById('bridge'))&&['lamp','tree','robot'].every(id=>state.done.includes(id)))return 'The Golden Bridge is ready! Restore it to reach the eastern wilds.';
 if(complete(qById('festival'))&&!complete(qById('skybridge')))return 'Crystal Canyon has awakened. Restore its landmarks to open the Sky Lift!';
 if(complete(qById('prismgate')))return 'Celestial Gardens are open. Discover 40×40 constellations and the 44×44 finale!';
 if(complete(qById('sunspire')))return 'Prism Tundra has opened. Restore five 36×36 icy artworks to reach the gardens.';
 if(complete(qById('moongate')))return 'Ember Peaks are open! Restore four ancient guardians to reach the 32×32 Sunspire.';
 if(complete(qById('phoenix')))return 'The Moonveil Marsh awaits! Plot 24×24 art to restore the moonstone crossing.';
 if(complete(qById('skybridge')))return 'Welcome to the Sky Isles! Larger coordinate canvases lead to the Dawn Phoenix.';
 const next=readyQuests()[0];return next?`The ${next.title.toLowerCase()} needs your coordinates. Tap its quest or follow the glowing marker!`:'Explore the valley to find a new restoration.';
}
function updateUI(){
 litQuests=quests.filter(q=>state.done.includes(q.id));
 const painted=paintedCount(),pct=Math.round(painted/totalCells*100),done=state.done.length;
 $('worldPct').textContent=`${pct}%`;$('worldBar').style.width=`${pct}%`;
 $('questCount').textContent=`${done} / ${quests.length}`;$('statQuests').textContent=`${done} / ${quests.length}`;
 $('statCells').textContent=painted.toLocaleString();$('statXP').textContent=`${state.xp.toLocaleString()} XP`;
 $('statAccuracy').textContent=`${painted+state.mistakes?Math.round(painted/(painted+state.mistakes)*100):100}%`;
 $('statBadges').textContent=`${foundBadges().filter(Boolean).length} / 14`;
 $('levelLabel').textContent=`LVL ${level()} · ${rank()}`;$('xpFill').style.width=`${nextLevelXp()/175*100}%`;
 $('pipText').textContent=currentPip();
 const end=done===quests.length,bridge=complete(qById('bridge')),festival=complete(qById('festival')),skybridge=complete(qById('skybridge')),phoenix=complete(qById('phoenix')),moongate=complete(qById('moongate')),sunspire=complete(qById('sunspire')),prismgate=complete(qById('prismgate'));
 const mainEnd=complete(qById('cosmos'));const sideDone=quests.filter(q=>q.id.startsWith('side_')&&complete(q)).length;
 const meadowReady=['lamp','tree','robot'].every(id=>state.done.includes(id));
 const chapter=document.querySelector('.story-card .section-eyebrow'), storyTitle=document.querySelector('.story-card h2'), storyParagraph=document.querySelector('.story-card p');
 if(end){chapter.textContent='ALL REGIONS / MASTER RESTORER';storyTitle.textContent='Every pixel shines!';storyParagraph.textContent='Every main chapter and all five side trails are complete. You restored the entire expanded Pixel Valley.';}
 else if(mainEnd){chapter.textContent='MAIN STORY COMPLETE / BONUS TRAILS';storyTitle.textContent='The cosmos is restored!';storyParagraph.textContent=`Explore optional side areas to restore the final ${15-sideDone} mini landmarks.`;}
 else if(prismgate){chapter.textContent='CHAPTER 08 / CELESTIAL GARDENS';storyTitle.textContent='Stars among the flowers.';storyParagraph.textContent='Complete 40×40 constellations and a 44×44 cosmic finale. Five optional side trails offer smaller puzzles.';}
 else if(sunspire){chapter.textContent='CHAPTER 07 / PRISM TUNDRA';storyTitle.textContent='Ice becomes light.';storyParagraph.textContent='Restore five 36×36 artworks to build the Prismatic Crossing. Optional side trails provide shorter coordinate quests.';}
 else if(moongate){chapter.textContent='CHAPTER 06 / EMBER PEAKS';storyTitle.textContent='The mountain wakes.';storyParagraph.textContent='Restore the guardians of Ember Peaks, then solve the final 32×32 Sunspire.';}
 else if(phoenix){chapter.textContent='CHAPTER 05 / MOONVEIL MARSH';storyTitle.textContent='Moonlight over the marsh.';storyParagraph.textContent='Restore five 24×24 marsh artworks to open the crossing into Ember Peaks.';}
 else if(skybridge){chapter.textContent='CHAPTER 04 / THE SKY ISLES';storyTitle.textContent='Rise into the clouds.';storyParagraph.textContent='The Sky Lift is running. Explore floating islands and complete the grand 20×20 masterpieces.';}
 else if(festival){chapter.textContent='CHAPTER 03 / CRYSTAL CANYON';storyTitle.textContent='A new frontier glitters.';storyParagraph.textContent='Cross the canyon gate to create bigger 16×16 artworks and rebuild the Sky Lift.';}
 else if(bridge){chapter.textContent='CHAPTER 02 / EASTERN WILDS';storyTitle.textContent='The eastern world is open.';storyParagraph.textContent='Complete the eastern restorations and Festival of Stars to unlock Crystal Canyon.';}
 else if(meadowReady){chapter.textContent='CHAPTER 01 / THE RIVER CROSSING';storyTitle.textContent='A bridge is waiting.';storyParagraph.textContent='Your three meadow creations are restored. Rebuild the Golden Bridge to reach the east.';}
 else{chapter.textContent='CHAPTER 01 / THE LOST COLORS';storyTitle.textContent='The valley has gone quiet.';storyParagraph.textContent='Find shining landmarks and paint missing pixels to restore the meadow.';}
 $('btnGuide').textContent=end?'✦ See my restored gallery':mainEnd?'✦ Find a bonus side quest':meadowReady&&!bridge?'✦ Find the Golden Bridge':'✦ Find my next quest';
 $('mapBadge').textContent=end?'✦ All 50 landmarks restored!':mainEnd?'✦ Main story finished. Explore the side trails!':prismgate?'✦ Celestial Gardens are open!':sunspire?'✦ Prism Tundra is open!':moongate?'✦ Ember Peaks are open!':phoenix?'✦ Moonveil Marsh is open!':skybridge?'✦ The Sky Isles are open!':festival?'✦ Crystal Canyon is open!':bridge?'✦ Restore Star Ridge to unlock the canyon!':meadowReady?'✦ Rebuild the river bridge!':`✦ ${3-['lamp','tree','robot'].filter(id=>state.done.includes(id)).length} meadow landmarks until the bridge.`;
 const x=state.player.x,y=state.player.y;
 $('regionName').textContent=y>=19?(sideAt(x,y)?.name?'— '+sideAt(x,y).name:'— Wilderness') : x<17?'— Sunlit Meadow':x<32?(y<10?'— Eastern Wilds':'— Star Ridge'):x<47?'— Crystal Canyon':x<66?'— Sky Isles':x<85?'— Moonveil Marsh':x<109?'— Ember Peaks':x<135?'— Prism Tundra':'— Celestial Gardens';
 const groups=[{name:'Valley',ids:quests.slice(0,8).map(q=>q.id),open:true},{name:'Crystal Canyon',ids:['crystal','fox','observatory','skybridge'],open:festival},{name:'Sky Isles',ids:['whale','citadel','phoenix'],open:skybridge},{name:'Moonveil Marsh',ids:['lily','moth','willow','owl','moongate'],open:phoenix},{name:'Ember Peaks',ids:['volcano','dragon','forge','griffin','sunspire'],open:moongate},{name:'Prism Tundra',ids:['compass','hare','cathedral','serpent','prismgate'],open:sunspire},{name:'Celestial Gardens',ids:['starbloom','koifish','cometdragon','orrery','cosmos'],open:prismgate},...SIDE_AREAS.map(z=>({name:'↳ '+z.name,ids:z.ids,open:!z.milestone||state.done.includes(z.milestone)}))];
 const nav=$('regionProgress');nav.textContent='';
 for(const g of groups){const el=document.createElement('div');el.className='region-step'+(g.open?'':' sealed')+(g.ids.every(id=>state.done.includes(id))?' finished':'');const count=g.ids.filter(id=>state.done.includes(id)).length;
 el.innerHTML=`<span class="step-symbol">${g.open?'✦':'◈'}</span><span>${g.name}<small>${g.open?`${count}/${g.ids.length} complete`:'Finish previous chapter'}</small></span>`;nav.appendChild(el);}
 renderQuestList();
}
function renderQuestList(){
 const wrap=$('questList');wrap.textContent='';let lastRegion='';
 for(const q of quests){
  if(q.region!==lastRegion){const h=document.createElement('div');h.className='quest-region';h.textContent=q.region;wrap.appendChild(h);lastRegion=q.region;}
  const can=unlocked(q),done=complete(q),pct=Math.round(progressOf(q).size/cells(q).length*100);
  const button=document.createElement('button');button.type='button';button.className=`quest-item ${done?'done':can?'':'locked'}`;
  button.setAttribute('aria-label',`${q.title}: ${done?'restored':can?pct+'% completed':'locked'}`);
  const icon=document.createElement('span');icon.className='quest-icon';icon.textContent=done?'✓':can?q.icon:'⌑';
  const label=document.createElement('span');label.innerHTML=`<span class="quest-name">${q.title}</span><br><span class="quest-sub">${done?'✓ Restored':can?pct?`${pct}% · Continue`:'✦ Ready · Travel':`Locked · finish ${q.need.length} task${q.need.length===1?'':'s'}`} · ${q.pattern.length}×${q.pattern.length}</span>`;
  button.append(icon,label);button.addEventListener('click',()=>startTravel(q));wrap.appendChild(button);
 }
}
function toast(text){const elem=$('toast');elem.textContent=text;elem.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{elem.hidden=true},2900);}
function playTone(kind='ok') {if(!state.settings.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=new C();const osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.value=kind==='ok'?660:kind==='win'?880:280;gain.gain.setValueAtTime(.055,c.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,c.currentTime+.14);osc.connect(gain);gain.connect(c.destination);osc.start();osc.stop(c.currentTime+.15);osc.onended=()=>c.close();}catch(e){} }

// ---------- Adventure map and movement ----------
const secrets=[{x:3,y:3},{x:13,y:13},{x:5,y:16},{x:23,y:10},{x:29,y:6},{x:29,y:15},{x:35,y:15},{x:45,y:2},{x:52,y:14},{x:57,y:3},{x:63,y:16},{x:71,y:15},{x:76,y:11},{x:82,y:3},{x:90,y:16},{x:103,y:3},{x:114,y:15},{x:124,y:2},{x:133,y:16},{x:141,y:15},{x:152,y:2},{x:163,y:16},{x:8,y:30},{x:23,y:26},{x:57,y:32},{x:79,y:33},{x:97,y:30}];
function seed(x,y,n=0){let h=(x*92837111 ^ y*689287499 ^ n*283923481)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function isRiver(x){return x===17||x===18;}
function isCanyonGate(x){return x===32||x===33;}
function isSkyGate(x){return x===47||x===48;}
function isMarshGate(x){return x===66||x===67;}
function isEmberGate(x){return x===85||x===86;}
function isPrismGate(x){return x===109||x===110;}
function isCelestialGate(x){return x===135||x===136;}
const SIDE_AREAS=[{name:'Sunflower Glade',min:3,max:15,entry:9,milestone:null,ids:['side_bee','side_tulip','side_butterfly'],colors:['#4b7561','#74a46f']},{name:'Tidepool Cove',min:20,max:31,entry:25,milestone:'bridge',ids:['side_crab','side_seastar','side_seahorse'],colors:['#23617b','#3b99a4']},{name:'Clockwork Camp',min:50,max:64,entry:57,milestone:'skybridge',ids:['side_gear','side_clock','side_airship'],colors:['#665577','#9a7996']},{name:'Mushroom Hollow',min:69,max:83,entry:76,milestone:'phoenix',ids:['side_mushroom','side_snail','side_firefly'],colors:['#476079','#65739f']},{name:'Frostfire Grotto',min:88,max:105,entry:97,milestone:'moongate',ids:['side_torch','side_golem','side_snowowl'],colors:['#466d7d','#7b9fb3']}];
function sideAt(x,y){return y>=19?SIDE_AREAS.find(z=>x>=z.min&&x<=z.max):null;}
function sideAllowed(z){return z&&(!z.milestone||state.done.includes(z.milestone));}
function passable(x,y){if(!valid(x,y))return false;
 if(y>=19){const z=sideAt(x,y);return !!(sideAllowed(z)&&(y!==19||x===z.entry));}
 if(isRiver(x))return y===9&&complete(qById('bridge'));
 if(isCanyonGate(x))return y===9&&complete(qById('festival'));
 if(isSkyGate(x))return y===9&&complete(qById('skybridge'));
 if(isMarshGate(x))return y===9&&complete(qById('phoenix'));
 if(isEmberGate(x))return y===9&&complete(qById('moongate'));
 if(isPrismGate(x))return y===9&&complete(qById('sunspire'));
 if(isCelestialGate(x))return y===9&&complete(qById('prismgate'));
 return true;}
function neighborTiles(x,y){return [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].filter(([a,b])=>passable(a,b));}
function bfs(start,goal){const begin=key(start.x,start.y),dest=key(goal.x,goal.y);if(begin===dest)return [];if(!passable(goal.x,goal.y))return null;const parent=new Map([[begin,null]]),queue=[[start.x,start.y]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [nx,ny] of neighborTiles(x,y)){const k=key(nx,ny);if(parent.has(k))continue;parent.set(k,key(x,y));if(k===dest){const path=[];let curr=k;while(curr!==begin){const [px,py]=curr.split(',').map(Number);path.push({x:px,y:py});curr=parent.get(curr);}return path.reverse();}queue.push([nx,ny]);}}return null;}
function findPathTo(q){const candidates=[[q.x,q.y],...neighborTiles(q.x,q.y)].filter(([x,y])=>passable(x,y));let best=null;for(const [x,y] of candidates){const p=bfs(state.player,{x,y});if(p&&(!best||p.length<best.length))best=p;}return best;}
function tryMove(dx,dy){route=[];pendingQuest=null;const nx=state.player.x+dx,ny=state.player.y+dy;moveDirection=dy>0?0:dy<0?3:dx<0?1:2;if(!passable(nx,ny)){toast(isRiver(nx)?'The river is blocked. Restore the Golden Bridge first!':isCanyonGate(nx)?'Crystal Canyon opens after the Festival of Stars!':isSkyGate(nx)?'Restore the Sky Lift to enter the Sky Isles!':isMarshGate(nx)?'Restore the Dawn Phoenix to enter Moonveil Marsh!':isEmberGate(nx)?'Restore the Moonstone Causeway to reach Ember Peaks!':isPrismGate(nx)?'Restore the Sunspire to reach Prism Tundra!':isCelestialGate(nx)?'Restore the Prismatic Crossing to enter Celestial Gardens!':ny>=19?'Side trail closed. Finish the earlier main chapter, or use its entrance!':'That tile is outside the path.');return;}moveTo(nx,ny);}
function moveTo(x,y,quiet=false){state.player.x=x;state.player.y=y;save();const secret=secrets.find(s=>s.x===x&&s.y===y);if(secret&&!state.secrets.includes(key(x,y))){state.secrets.push(key(x,y));state.xp+=20;toast('Secret star discovered! +20 XP ✦');playTone('ok');save();}if(!quiet)updateUI();}
function startTravel(q){if(complete(q)){openGallery(q.id);return;}if(!unlocked(q)){toast(`Locked! First restore: ${q.need.filter(n=>!state.done.includes(n)).map(n=>qById(n).title).join(', ')}`);return;}
 const p=findPathTo(q);if(!p){toast('That landmark is beyond a locked crossing. Restore the earlier chapter first.');return;}route=p;pendingQuest=q.id;
 if(route.length===0){pendingQuest=null;openQuest(q.id);return;}
 toast(`Traveling to ${q.title}...`);$('worldCanvas').focus();
}
function walkClick(x,y){let q=quests.find(q=>Math.abs(q.x-x)<=1&&Math.abs(q.y-y)<=1);if(q){startTravel(q);return;}
 const path=bfs(state.player,{x,y});if(path){route=path;pendingQuest=null;if(!path.length)toast('You are already here.');}else toast('That region is still sealed. Finish the current chapter to open its crossing.');
}
function tickRoute(){if(!route.length)return;const look=route[0];moveDirection=look.y>state.player.y?0:look.y<state.player.y?3:look.x<state.player.x?1:2;const fast=route.length>20?3:route.length>8?2:1;for(let i=0;i<fast&&route.length;i++){const step=route.shift();if(!passable(step.x,step.y)){route=[];pendingQuest=null;updateUI();return;}moveTo(step.x,step.y,true);}updateUI();if(!route.length&&pendingQuest){const id=pendingQuest;pendingQuest=null;openQuest(id);}}
function nearQuest(){return quests.find(q=>unlocked(q)&&!complete(q)&&Math.abs(q.x-state.player.x)+Math.abs(q.y-state.player.y)<=1);}
function interact(){const q=nearQuest();if(q)openQuest(q.id);else toast('Move next to a shining landmark—or select it from the quest log.');}
const cell=34;
function fitCanvas(){const box=canvas.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);canvas.dataset.dpr=dpr;}
function drawPixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}

function drawEnvironmentDetails(x,y,t,bright,biome,path){
  const level=graphicsScale();if(level===0||path)return;
  const v=seed(x,y,55),px=x*t,py=y*t;
  if(v<.72)return;
  const lush=bright>.42;
  if(biome==='meadow'){
    if(v>.94){ // miniature tree canopy and underbrush
      drawPixel(px+13,py+15,7,13,lush?'#5c453c':'#425051');
      drawPixel(px+7,py+8,19,11,lush?'#2c8753':'#4b6561');
      drawPixel(px+11,py+2,12,10,lush?'#65b76a':'#607c71');
      drawPixel(px+5,py+17,9,5,lush?'#3d9b5f':'#506b65');
      if(level===2)drawPixel(px+17,py+4,4,3,lush?'#b6de7c':'#78917a');
    }else{
      drawPixel(px+9,py+13,2,9,lush?'#70b26f':'#6b837e');
      drawPixel(px+13,py+11,2,8,lush?'#8acb79':'#809487');
      drawPixel(px+7,py+11,6,3,lush?'#eaca7d':'#8c9589');
      if(level===2){drawPixel(px+20,py+23,3,3,lush?'#efa0ab':'#788f91');drawPixel(px+23,py+24,3,3,lush?'#f9da87':'#859389');}
    }
  }else if(biome==='canyon'){
    drawPixel(px+6,py+19,24,8,lush?'#8e5a66':'#5d5868');drawPixel(px+11,py+12,15,10,lush?'#bd8578':'#756470');
    drawPixel(px+16,py+3,7,14,lush?'#61e5d8':'#638b96');drawPixel(px+19,py+1,3,6,'#d4f9e9');
  }else if(biome==='sky'){
    drawPixel(px+5,py+17,23,8,lush?'#e4f4ec':'#7c98af');drawPixel(px+9,py+13,12,5,lush?'#ffffff':'#a0b1bb');
    if(level===2)drawPixel(px+12,py+24,9,6,lush?'#8cd9c8':'#7795a6');
  }else if(biome==='marsh'){
    drawPixel(px+8,py+12,3,16,lush?'#51ba8f':'#587b81');drawPixel(px+14,py+9,3,20,lush?'#4bb080':'#55797a');
    drawPixel(px+5,py+9,12,7,lush?'#93d89e':'#78948e');
    if(level===2)drawPixel(px+24,py+6,4,4,lush?'#ffdc99':'#98a9a0');
  }else if(biome==='ember'){
    drawPixel(px+3,py+18,27,9,lush?'#6d3946':'#503942');drawPixel(px+10,py+13,15,6,'#b87067');
    drawPixel(px+19,py+15,3,14,lush?'#ff9f4c':'#a96656');drawPixel(px+21,py+12,4,7,lush?'#ffdb79':'#bd846d');
  }else if(biome==='prism'){
    drawPixel(px+7,py+18,23,10,lush?'#bbdef3':'#7e9ab2');drawPixel(px+14,py+6,11,15,lush?'#e6ffff':'#a1bdcd');
    drawPixel(px+17,py+3,5,7,lush?'#a5edfc':'#b1c5d3');
  }else if(biome==='celestial'){
    drawPixel(px+6,py+19,23,8,lush?'#9d7cc0':'#736588');drawPixel(px+11,py+11,13,12,lush?'#e3b9ee':'#a38bb2');
    drawPixel(px+14,py+4,7,9,'#ffe6ba');
  }
}


// v5.2: hand-crafted native-resolution pixel-art atlas; every biome is rendered
// from artwork instead of a flat-color square. No external dependencies.
const PIXEL_ART={};
for(const [id,filename] of Object.entries({terrain:'terrain-atlas.png',decor:'decorations-atlas.png',structures:'structures-atlas.png',explorer:'explorer-sprites.png',pip:'pip-sprites.png'})){
 const img=new Image();img.src=filename+'?v=5.2.0';PIXEL_ART[id]=img;
}
function pixelReady(){return Object.values(PIXEL_ART).every(img=>img.complete&&img.naturalWidth>0);}
const biomeMap={meadow:0,wilds:1,canyon:2,sky:3,marsh:4,ember:5,prism:6,celestial:7,sunflower:8,tidepool:9,clockwork:10,mushroom:11,frostfire:12};
function biomeAt(x,y){
 if(y>=19){const z=sideAt(x,y);if(!z)return -1;
  return ({'Sunflower Glade':8,'Tidepool Cove':9,'Clockwork Camp':10,'Mushroom Hollow':11,'Frostfire Grotto':12})[z.name]??0;
 }
 if(x>=137)return 7;if(x>=111)return 6;if(x>=87)return 5;
 if(x>=68)return 4;if(x>=49)return 3;if(x>=34)return 2;
 return x>=19?1:0;
}
function roadAt(x,y){return (y===9&&x>=5&&x<=163)||(x===7&&y>=7&&y<=10)||(x===11&&y>=4&&y<=9)||(x===9&&y>=9&&y<=14)||(x===22&&y>=7&&y<=15)||(x===25&&y>=4&&y<=13)||(x===37&&y>=5&&y<=9)||(x===40&&y>=9&&y<=14)||(x===44&&y>=4&&y<=15)||(x===53&&y>=5&&y<=9)||(x===59&&y>=9&&y<=14)||(x===70&&y>=5&&y<=9)||(x===73&&y>=9&&y<=14)||(x===77&&y>=5&&y<=9)||(x===80&&y>=9&&y<=14)||(x===90&&y>=5&&y<=9)||(x===93&&y>=9&&y<=14)||(x===97&&y>=5&&y<=9)||(x===101&&y>=9&&y<=14)||(x===114&&y>=5&&y<=9)||(x===120&&y>=9&&y<=14)||(x===126&&y>=5&&y<=9)||(x===130&&y>=9&&y<=14)||(x===141&&y>=5&&y<=9)||(x===146&&y>=9&&y<=14)||(x===152&&y>=5&&y<=9)||(x===158&&y>=9&&y<=14);
}
function isGate(x){return isRiver(x)||isCanyonGate(x)||isSkyGate(x)||isMarshGate(x)||isEmberGate(x)||isPrismGate(x)||isCelestialGate(x);}
function pixelTile(x,y,t){
 const px=x*t,py=y*t,biome=biomeAt(x,y),rng=seed(x,y,14);
 if(biome<0){ctx.fillStyle='#162939';ctx.fillRect(px,py,t,t);return;}
 const gate=isGate(x),side=y>=19;
 const z=side?sideAt(x,y):null;
 let tileKind=rng>.67?2:rng>.29?1:0;
 const road=side? !!z&&(x===z.entry||y===27):roadAt(x,y);
 if(road)tileKind=seed(x,y,15)>.5?3:4;
 if(gate){tileKind=motionEnabled()&&Math.floor(Date.now()/650)%2?6:5;}
 ctx.drawImage(PIXEL_ART.terrain,tileKind*32,biome*32,32,32,px,py,t,t);
 if(gate){
   const open=y===9&&(isRiver(x)?complete(qById('bridge')):isCanyonGate(x)?complete(qById('festival')):isSkyGate(x)?complete(qById('skybridge')):isMarshGate(x)?complete(qById('phoenix')):isEmberGate(x)?complete(qById('moongate')):isPrismGate(x)?complete(qById('sunspire')):complete(qById('prismgate')));
   if(open){
     ctx.fillStyle='#695039';ctx.fillRect(px,py+7,t,t-14);
     ctx.fillStyle='#d3a66f';ctx.fillRect(px,py+9,t,t-18);
     ctx.fillStyle='#f8d79e';ctx.fillRect(px,py+10,t,3);
     ctx.fillStyle='#7a5c44';for(let i=0;i<3;i++)ctx.fillRect(px+(i*t/3)|0,py+9,2,t-18);
     ctx.fillStyle='#5b463c';ctx.fillRect(px,py+21,t,2);
   }
 }
 if(side&&z&&y===19){
   ctx.fillStyle='#f3d093';ctx.fillRect(px,py,t,5);
   if(x!==z.entry){ctx.fillStyle='#314b5d';ctx.fillRect(px,py+5,t,t-5);}
 }
 // Fog persists until chapters are restored, but the underlying artwork stays recognizable.
 let fog=0;
 if(side&&!sideAllowed(z))fog=.68;
 else if(x>=137&&!complete(qById('prismgate')))fog=.42;
 else if(x>=111&&!complete(qById('sunspire')))fog=.39;
 else if(x>=87&&!complete(qById('moongate')))fog=.37;
 else if(x>=68&&!complete(qById('phoenix')))fog=.35;
 else if(x>=49&&!complete(qById('skybridge')))fog=.34;
 else if(x>=34&&!complete(qById('festival')))fog=.31;
 else if(x>=19&&x<32&&!complete(qById('bridge')))fog=.18;
 if(fog){ctx.fillStyle=`rgba(9,17,35,${fog})`;ctx.fillRect(px,py,t,t);}
}
function drawPixelDecor(x,y,t){
 const biome=biomeAt(x,y);if(biome<0||isGate(x)||roadAt(x,y))return;
 const z=y>=19?sideAt(x,y):null;
 if(y>=19&&(!sideAllowed(z)||x===z.entry||y===27))return;
 const v=seed(x,y,22);
 const edge=y===1||y===17||y===33||x===2||x===165;
 const chance=edge?.66:(graphicsLevel()==='enhanced'?.117:.068);
 if(v<1-chance)return;
 if(quests.some(q=>Math.abs(q.x-x)<=1&&Math.abs(q.y-y)<=1))return;
 if(Math.abs(state.player.x-x)<2&&Math.abs(state.player.y-y)<2)return;
 const which=Math.floor(seed(x,y,25)*3);
 const w=t*1.40,h=t*1.63;
 ctx.drawImage(PIXEL_ART.decor,which*48,biome*56,48,56,x*t+(t-w)/2,y*t+t-h,w,h);
}
function drawPixelStructure(x,y,t,type){
 const idx=({village:0,tower:1,canyon:2,sky:3,marsh:4,ember:5,prism:6,celestial:7})[type]||0;
 const w=t*2.30,h=t*2.1;
 ctx.drawImage(PIXEL_ART.structures,idx*88,0,88,80,x*t+(t-w)/2,y*t+t-h,w,h);
}
function drawPixelHero(time,t,px,py){
 const moving=route.length>0;
 const frame=moving&&motionEnabled()?Math.floor(time/175)%3:1;
 const dir=moveDirection||0;
 const w=t*.92,h=t*1.22;
 ctx.fillStyle='rgba(13,28,38,.39)';ctx.beginPath();ctx.ellipse(px,py+t*.36,t*.42,4,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(PIXEL_ART.explorer,frame*24,dir*32,24,32,px-w/2,py-h*.71,w,h);
}
function drawPixelPip(time,t){
 const x=state.player.x*t+t/2-t*.76;
 const y=state.player.y*t+t/2+t*.22+(motionEnabled()?Math.sin(time/220)*1.6:0);
 const sz=t*.68,frame=motionEnabled()?Math.floor(time/400)%2:0;
 ctx.drawImage(PIXEL_ART.pip,frame*24,0,24,24,x-sz/2,y-sz/2,sz,sz);
}
let moveDirection=0;

function drawTile(x,y,t){if(graphicsLevel()!=='low'&&pixelReady()){pixelTile(x,y,t);return;}const px=x*t,py=y*t;
 if(y>=19){const z=sideAt(x,y);if(!z){drawPixel(px,py,t,t,seed(x,y)>.47?'#203548':'#253b4c');if(seed(x,y,4)>.76)drawPixel(px+8,py+9,18,13,'#385165');return;}
  const v=seed(x,y,4);drawPixel(px,py,t,t,v>.53?z.colors[0]:z.colors[1]);
  if(v>.58){drawPixel(px+4,py+8,8,4,'#d6bf8d');drawPixel(px+19,py+17,9,5,'#46667d');}
  if((x===z.entry||y===27)&&y>=19){drawPixel(px,py+12,t,11,'#ad9c87');drawPixel(px+2,py+15,t-4,3,'#d4bb8e');}
  if(y===19){drawPixel(px,py,t,7,'#f2d48c');drawPixel(px+8,py+9,18,16,sideAllowed(z)?'#c7a66c':'#41485e');}
  if(!sideAllowed(z))drawPixel(px,py,t,t,'rgba(15,22,45,.65)');
  return;}

 if(isRiver(x)||isCanyonGate(x)||isSkyGate(x)||isMarshGate(x)||isEmberGate(x)||isPrismGate(x)||isCelestialGate(x)){
   const canyon=isCanyonGate(x),sky=isSkyGate(x),marsh=isMarshGate(x),ember=isEmberGate(x),prism=isPrismGate(x),celestial=isCelestialGate(x);
   const open=y===9&&(celestial?complete(qById('prismgate')):prism?complete(qById('sunspire')):ember?complete(qById('moongate')):marsh?complete(qById('phoenix')):canyon?complete(qById('festival')):sky?complete(qById('skybridge')):complete(qById('bridge')));
   if(open){drawPixel(px,py,t,t,celestial?'#bba3d6':prism?'#94bdcb':ember?'#9a5947':marsh?'#3f697b':canyon?'#785b7e':sky?'#779bb1':'#8f6849');drawPixel(px,py+4,t,t-8,celestial?'#eed3f2':prism?'#d9f5ff':ember?'#edb079':marsh?'#9cbdc3':canyon?'#c598a3':sky?'#d4c4ad':'#b28357');for(let i=0;i<3;i++)drawPixel(px+i*t/3,py+2,2,t-4,'#f3d99c');}
   else{drawPixel(px,py,t,t,celestial?'#34314f':prism?'#263d5f':ember?'#4a262a':marsh?'#263451':canyon?'#432c49':sky?'#17274a':seed(x,y)<.5?'#386981':'#34637e');const v=Math.floor(Date.now()/800)%4;
     if(sky||marsh||ember||prism||celestial){drawPixel(px+4,py+((v*5+x*3)%24),t-8,4,celestial?'#d7aaf0':prism?'#d7faff':ember?'#df8164':marsh?'#95b7b8':'#a5c4db');drawPixel(px+13,py+22,16,4,ember?'#ab4c42':'#617eab');}
     else{drawPixel(px+((v*7+y*3)%20),py+9,10,2,canyon?'#a2769e':'#63a1b0');drawPixel(px+5,py+24,8,2,canyon?'#b68279':'#427e92');}}
   return;
 }
 let bright=.09;for(const q of litQuests){if(Math.abs(q.x-x)>8||Math.abs(q.y-y)>8)continue;const d=Math.hypot(q.x-x,q.y-y);bright=Math.max(bright,clamp(1-d/(q.id==='bridge'||q.id==='skybridge'?8:7),0,1));}if(state.done.length===quests.length)bright=Math.max(bright,.95);
 const canyon=x>=34&&x<=46,sky=x>=49&&x<=65,marsh=x>=68&&x<=84,ember=x>=87&&x<=108,prism=x>=111&&x<=134,celestial=x>=137,west=x<17;
 const main=celestial?(bright>.5?'#7f689e':'#514a73'):prism?(bright>.5?'#8eb4c2':'#5b8195'):ember?(bright>.50?'#935b52':'#63434b'):marsh?(bright>.50?'#3e7977':'#32566c'):sky?(bright>.50?'#658ba3':'#48667e'):canyon?(bright>.50?'#976e72':'#715968'):(bright>.55?(west?'#3c765d':'#356c61'):(west?'#476b66':'#46616b'));
 drawPixel(px,py,t,t,main);
 if(celestial){if(seed(x,y,3)>.35){drawPixel(px+4,py+11,24,9,bright>.5?'#a887c9':'#71618e');drawPixel(px+13,py+6,5,6,'#c8abea');}if(seed(x,y,7)>.78)drawPixel(px+8,py+20,6,6,'#f6dbab');}
 else if(prism){if(seed(x,y,3)>.32){drawPixel(px+2,py+18,26,9,bright>.5?'#d4e6f5':'#99b5ce');drawPixel(px+7,py+10,13,9,'#8bc4d4');}if(seed(x,y,5)>.79)drawPixel(px+17,py+4,4,7,'#eff8ff');}
 else if(ember){if(seed(x,y,3)>.37){drawPixel(px+3,py+14,27,11,bright>.5?'#ba826d':'#7d5c63');drawPixel(px+11,py+7,12,8,'#6f3d46');}if(seed(x,y,9)>.74){drawPixel(px+15,py+20,4,10,'#ea8662');drawPixel(px+15,py+15,3,7,'#efba68');}}
 else if(marsh){if(seed(x,y,1)>.31){drawPixel(px+2,py+17,27,10,bright>.5?'#4d9d83':'#3a7a7b');drawPixel(px+13,py+18,9,3,'#9adcab');}if(seed(x,y,8)>.72){drawPixel(px+17,py+5,3,3,'#f7e3ac');drawPixel(px+16,py+3,5,2,'#c4edc4');}}
 else if(sky){if(seed(x,y,1)>.37){drawPixel(px+3,py+5,27,5,bright>.5?'#a8d5de':'#6c94b4');drawPixel(px+9,py+2,17,4,'#a9c6df');}
  if(seed(x,y,8)>.72){drawPixel(px+14,py+19,3,4,'#eecb98');drawPixel(px+11,py+22,10,2,'#e6daaf');}}
 else if(canyon){if(seed(x,y,1)>.35){drawPixel(px+3,py+16,21,8,bright>.45?'#c38a75':'#8e747a');drawPixel(px+20,py+9,8,7,'#80617b');}
  if(seed(x,y,4)>.79){drawPixel(px+12,py+4,7,13,bright>.5?'#63d7cf':'#718ca1');drawPixel(px+14,py+2,3,4,'#d9f8e7');}}
 else{if(seed(x,y,3)>.35)drawPixel(px,py,t,3,bright>.55?'#4e9270':'#527576');if(seed(x,y,4)>.62)drawPixel(px+4+Math.floor(seed(x,y,2)*19),py+6,3,3,bright>.5?'#73b382':'#66867e');
  if(seed(x,y,6)>.92){drawPixel(px+14,py+13,3,4,bright>.7?'#f9d383':'#b6aa85');drawPixel(px+12,py+15,7,2,bright>.7?'#e7a1ad':'#879596');}}
 const path=(y===9&&x>=5&&x<=163)||(x===7&&y>=7&&y<=10)||(x===11&&y>=4&&y<=9)||(x===9&&y>=9&&y<=14)||(x===22&&y>=7&&y<=15)||(x===25&&y>=4&&y<=13)||(x===37&&y>=5&&y<=9)||(x===40&&y>=9&&y<=14)||(x===44&&y>=4&&y<=15)||(x===53&&y>=5&&y<=9)||(x===59&&y>=9&&y<=14)||(x===70&&y>=5&&y<=9)||(x===73&&y>=9&&y<=14)||(x===77&&y>=5&&y<=9)||(x===80&&y>=9&&y<=14)||(x===90&&y>=5&&y<=9)||(x===93&&y>=9&&y<=14)||(x===97&&y>=5&&y<=9)||(x===101&&y>=9&&y<=14)||(x===114&&y>=5&&y<=9)||(x===120&&y>=9&&y<=14)||(x===126&&y>=5&&y<=9)||(x===130&&y>=9&&y<=14)||(x===141&&y>=5&&y<=9)||(x===146&&y>=9&&y<=14)||(x===152&&y>=5&&y<=9)||(x===158&&y>=9&&y<=14);
 if(path){drawPixel(px,py+11,t,t-22,celestial?'#c4a5d1':prism?'#b4cad2':ember?'#b67f70':marsh?'#7b9c90':sky?'#a5b5ba':canyon?'#a1867a':bright>.48?'#ae966c':'#879083');drawPixel(px+4,py+13,t-8,2,sky?'#ecddd0':'#c1b083');}
 if((x===2||x===64||x===83||x===107||x===132||x===165||y===1||y===17)&&seed(x,y,10)>.40){
  if(celestial){drawPixel(px+9,py+5,17,23,'#a687bd');drawPixel(px+13,py+1,8,9,'#f0d1dd');}
  else if(prism){drawPixel(px+10,py+9,17,20,'#a5b9d4');drawPixel(px+14,py+2,10,13,'#e4f4ff');}
  else if(ember){drawPixel(px+8,py+8,19,20,'#815253');drawPixel(px+11,py+3,13,12,'#bb766a');}
  else if(marsh){drawPixel(px+8,py+9,18,17,'#285f65');drawPixel(px+7,py+5,21,8,'#448b75');}
  else if(sky){drawPixel(px+9,py+7,15,15,'#8bb5cd');drawPixel(px+13,py+2,9,8,'#d4eafa');}
  else if(canyon){drawPixel(px+11,py+11,18,20,'#74536c');drawPixel(px+14,py+3,12,12,'#b48994');}
  else{drawPixel(px+10,py+14,14,16,'#36513e');drawPixel(px+6,py+4,22,16,bright>.5?'#408966':'#557767');drawPixel(px+11,py+1,12,6,bright>.5?'#65a874':'#718e7b');}}

 const biome=celestial?'celestial':prism?'prism':ember?'ember':marsh?'marsh':sky?'sky':canyon?'canyon':'meadow';
 drawEnvironmentDetails(x,y,t,bright,biome,path);
const gfx=graphicsLevel();
if(gfx!=='low'){
  ctx.fillStyle='rgba(255,255,255,.04)';ctx.fillRect(px,py,1,t);ctx.fillRect(px,py,t,1);
  ctx.fillStyle='rgba(0,0,0,.08)';ctx.fillRect(px+t-1,py,1,t);ctx.fillRect(px,py+t-1,t,1);
  if(!path && y<19){
    const s=seed(x,y,12);
    if(s>.84){ctx.fillStyle=celestial?'#ffe3b3':prism?'#effcff':ember?'#f4ad72':marsh?'#b7efc4':sky?'#f3ead0':canyon?'#73e7d9':'#87c58d';ctx.fillRect(px+6+Math.floor(seed(x,y,17)*18),py+6+Math.floor(seed(x,y,18)*18),2,2);}
    if(gfx==='enhanced' && s>.68 && !celestial && !prism && !ember){ctx.fillStyle='rgba(255,255,255,.05)';ctx.fillRect(px+3,py+20,10,1);}
  }
}

 if(x>=19&&x<32&&!complete(qById('bridge')))drawPixel(px,py,t,t,'rgba(15,33,59,.36)');
 if(x>=34&&x<47&&!complete(qById('festival')))drawPixel(px,py,t,t,'rgba(15,17,39,.48)');
 if(x>=49&&x<66&&!complete(qById('skybridge')))drawPixel(px,py,t,t,'rgba(13,19,46,.55)');
 if(x>=68&&x<85&&!complete(qById('phoenix')))drawPixel(px,py,t,t,'rgba(13,19,46,.55)');
 if(x>=87&&x<109&&!complete(qById('moongate')))drawPixel(px,py,t,t,'rgba(31,13,28,.55)');
 if(x>=111&&x<135&&!complete(qById('sunspire')))drawPixel(px,py,t,t,'rgba(14,29,52,.55)');
 if(x>=137&&!complete(qById('prismgate')))drawPixel(px,py,t,t,'rgba(29,16,53,.55)');
}
function drawArtOnMap(q,x,y,t,done){const cx=x*t+t/2,cy=y*t+t/2;ctx.save();if(done){const scale=2.4;const n=q.pattern.length;const left=Math.round(cx-n*scale/2),top=Math.round(cy-n*scale/2);for(let row=0;row<n;row++)for(let col=0;col<n;col++){const code=q.pattern[row][col];if(code!=='.')drawPixel(left+col*scale,top+row*scale,scale+.2,scale+.2,palette[code].hex);}ctx.restore();return;}
 ctx.translate(cx,cy);const locked=!unlocked(q);drawPixel(-12,-10,24,23,locked?'#465870':'#2a6f80');drawPixel(-9,-8,18,18,locked?'#475b6d':'#7dc4c2');drawPixel(-7,-5,14,14,locked?'#647080':'#355977');
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 19px Georgia,serif';ctx.fillStyle=locked?'#a2b1bd':'#f5d581';ctx.fillText(locked?'×':q.icon,0,-1);ctx.restore();}
function drawMap(time){const dpr=Number(canvas.dataset.dpr)||1;const width=canvas.width/dpr,height=canvas.height/dpr;if(!width||!height)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);ctx.imageSmoothingEnabled=false;
 const t=cam.tile;cam.w=width;cam.h=height;cam.x=clamp(state.player.x*t-width/2,0,Math.max(0,W*t-width));cam.y=clamp(state.player.y*t-height/2,0,Math.max(0,H*t-height));
 ctx.save();ctx.translate(-cam.x,-cam.y);
 const left=clamp(Math.floor(cam.x/t)-1,0,W-1),right=clamp(Math.ceil((cam.x+width)/t)+1,0,W-1),top=clamp(Math.floor(cam.y/t)-1,0,H-1),bottom=clamp(Math.ceil((cam.y+height)/t)+1,0,H-1);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)drawTile(x,y,t);
 if(graphicsLevel()!=='low'&&pixelReady())for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)drawPixelDecor(x,y,t);
 // The far western village and eastern observatory are original pixel landmarks.
 for(const [x,y,type] of [[3,11,'village'],[28,3,'tower'],[40,2,'canyon'],[57,3,'sky'],[75,2,'marsh'],[95,2,'ember'],[123,2,'prism'],[149,2,'celestial']]){if(graphicsLevel()!=='low'&&pixelReady())drawPixelStructure(x,y,t,type);else drawStructure(x,y,t,type);}
 if(showMapCoords){ctx.strokeStyle='rgba(249,223,162,.20)';ctx.lineWidth=1;ctx.font='bold 8px Consolas,monospace';ctx.textAlign='left';ctx.textBaseline='top';for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){ctx.strokeRect(x*t,y*t,t,t);ctx.fillStyle='rgba(235,248,220,.72)';ctx.fillText(`${x+1},${H-y}`,x*t+2,y*t+2);}}
 for(const secret of secrets){if(state.secrets.includes(key(secret.x,secret.y)))continue;if(isRiver(secret.x))continue;const cx=(secret.x+.5)*t,cy=(secret.y+.5)*t;ctx.fillStyle='#ffe0a0';ctx.font=`${13+(motionEnabled()?Math.sin(time/290+secret.x)*2:0)}px Georgia`;ctx.textAlign='center';ctx.fillText('✦',cx,cy+6);}
 for(const q of quests){if(q.x<left-1||q.x>right+1||q.y<top-1||q.y>bottom+1)continue;const done=complete(q),locked=!unlocked(q),px=q.x*t+t/2,py=q.y*t+t/2;const pulse=motionEnabled()?(1+Math.sin(time/380+q.x)*.25):1;
 drawQuestHalo(q,t,time);
 if(!done&&!locked){ctx.fillStyle='rgba(255,217,142,.13)';ctx.beginPath();ctx.arc(px,py,16*pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,15*pulse,0,Math.PI*2);ctx.stroke();}
 drawArtOnMap(q,q.x,q.y,t,done);
 if(!done&&!locked){drawPixel(px+10,py-17,6,8,'#ffe29a');drawPixel(px+11,py-21,4,4,'#fff5d8');}
 if(done&&Math.sin(time/500+q.y)>.6){ctx.fillStyle='#fff1a2';ctx.font='11px Georgia';ctx.fillText('✦',px+13,py-17);}
 }
 // Player sprite with three-frame directional walking animations.
 const px=state.player.x*t+t/2,py=state.player.y*t+t/2+(motionEnabled()?Math.sin(time/210)*1.6:0);
 if(graphicsLevel()!=='low'&&pixelReady())drawPixelHero(time,t,px,py);
 else{ctx.fillStyle='rgba(6,30,38,.4)';ctx.beginPath();ctx.ellipse(px,py+13,14,5,0,0,Math.PI*2);ctx.fill();drawPixel(px-9,py-8,18,18,'#143e55');drawPixel(px-7,py-5,14,13,'#59bdd0');drawPixel(px-8,py-14,16,11,'#f8cea1');drawPixel(px-10,py-17,20,7,'#583f4d');drawPixel(px-3,py-19,6,5,'#f5d37a');drawPixel(px-5,py-9,3,3,'#183448');drawPixel(px+4,py-9,3,3,'#183448');drawPixel(px-8,py+8,6,6,'#2a314a');drawPixel(px+3,py+8,6,6,'#2a314a');}
 if(route.length){ctx.strokeStyle='rgba(255,242,160,.7)';ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(px,py);for(const p of route)ctx.lineTo((p.x+.5)*t,(p.y+.5)*t);ctx.stroke();ctx.setLineDash([]);}
 if(graphicsLevel()!=='low'&&pixelReady())drawPixelPip(time,t);else drawCompanion(time,t);
 ctx.restore();
 drawAmbientEffects(time,left,right,top,bottom,t);
 // Edge vignette
 const grad=ctx.createRadialGradient(width/2,height/2,width*.18,width/2,height/2,width*.75);grad.addColorStop(0,'rgba(4,22,44,0)');grad.addColorStop(1,'rgba(5,17,31,.26)');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
 requestAnimationFrame(drawMap);
}
function drawStructure(x,y,t,type){const px=x*t,py=y*t;if(type==='village'){drawPixel(px-10,py+3,67,35,'#6b514b');drawPixel(px-15,py-12,76,22,'#b07d6b');drawPixel(px-4,py+9,9,9,'#f6d183');drawPixel(px+27,py+11,13,17,'#edd3a0');drawPixel(px+13,py+21,15,17,'#353e4b');}
else if(type==='tower'){drawPixel(px+6,py-3,28,49,'#9e8c82');drawPixel(px,py-10,40,17,'#777a8f');drawPixel(px+16,py-23,9,14,'#ffcf76');drawPixel(px+11,py+12,14,15,'#3d5061');}
else if(type==='canyon'){drawPixel(px-6,py+19,75,18,'#63455b');drawPixel(px+4,py-1,51,23,'#94677c');drawPixel(px+17,py-23,26,24,'#b78991');drawPixel(px+25,py-33,9,12,'#7ae5dc');}
else if(type==='marsh'){drawPixel(px-13,py+17,75,18,'#245967');drawPixel(px+2,py+1,52,23,'#438c7a');drawPixel(px+11,py-17,13,22,'#6bb89b');drawPixel(px+35,py-12,11,15,'#b8dda4');}
else if(type==='prism'){drawPixel(px-12,py+18,70,22,'#668ea6');drawPixel(px+7,py-15,40,39,'#a9d5e2');drawPixel(px+21,py-29,10,17,'#f1fbfa');}
else if(type==='celestial'){drawPixel(px-10,py+17,69,18,'#615278');drawPixel(px+7,py-11,43,31,'#9278b1');drawPixel(px+21,py-26,12,17,'#f4d2df');}
else if(type==='ember'){drawPixel(px-12,py+21,77,20,'#773c48');drawPixel(px+1,py-4,51,29,'#a35b58');drawPixel(px+16,py-23,22,27,'#ce7a61');drawPixel(px+23,py-32,8,11,'#ffbd68');}
else{drawPixel(px-13,py+22,75,8,'#7eabc0');drawPixel(px,py+6,49,24,'#a7bac2');drawPixel(px+10,py-20,28,27,'#c6c9c9');drawPixel(px+19,py-33,11,14,'#f4d1a0');}}

function drawAmbientEffects(time,left,right,top,bottom,t){
 const g=graphicsScale(); if(!g) return;
 const motion=motionEnabled();
 const density=g===2?16:9;
 ctx.save();
 for(let i=0;i<density;i++){
   const nx=((i*23.17 + (motion?time/9000:0))%1), ny=((i*41.73 + (motion?time/11000:0))%1);
   const wx=cam.x+nx*cam.w, wy=cam.y+ny*cam.h;
   const tx=Math.floor(wx/t), ty=Math.floor(wy/t);
   if(tx<left||tx>right||ty<top||ty>bottom) continue;
   let color='rgba(255,243,171,.24)', size=2;
   if(ty>=19){ color='rgba(255,233,163,.18)'; size=2+(i%2); }
   else if(tx>=137){ color='rgba(247,205,255,.25)'; size=2.5; }
   else if(tx>=111){ color='rgba(219,247,255,.23)'; size=2.2; }
   else if(tx>=87){ color='rgba(255,152,103,.19)'; size=2.2; }
   else if(tx>=68){ color='rgba(186,244,203,.18)'; size=1.8; }
   else if(tx>=49){ color='rgba(221,242,255,.18)'; size=2; }
   else if(tx>=34){ color='rgba(123,241,224,.18)'; size=2; }
   const drift=motion?Math.sin(time/600+i)*3:0;
   ctx.fillStyle=color;
   ctx.beginPath();ctx.arc(wx-cam.x+drift,wy-cam.y,size,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
function drawQuestHalo(q,t,time){
 if(graphicsLevel()==='low') return;
 const px=q.x*t+t/2, py=q.y*t+t/2;
 const done=complete(q), open=unlocked(q)&&!done;
 const pulse=motionEnabled()? (1+Math.sin(time/260+q.x)*0.12) : 1;
 if(done){
   const r=(graphicsLevel()==='enhanced'?26:21)*pulse;
   const grad=ctx.createRadialGradient(px,py,5,px,py,r);
   grad.addColorStop(0,'rgba(255,243,168,.32)'); grad.addColorStop(1,'rgba(255,243,168,0)');
   ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill();
 } else if(open){
   ctx.strokeStyle='rgba(255,223,134,.78)'; ctx.lineWidth=graphicsLevel()==='enhanced'?2.2:1.6; ctx.beginPath(); ctx.arc(px,py,(graphicsLevel()==='enhanced'?18:15)*pulse,0,Math.PI*2); ctx.stroke();
 }
}
function drawCompanion(time,t){
 if(graphicsLevel()==='low') return;
 const motion=motionEnabled();
 const px=state.player.x*t+t/2-18, py=state.player.y*t+t/2-10+(motion?Math.sin(time/240+1.1)*2:0);
 ctx.fillStyle='rgba(6,30,38,.28)';ctx.beginPath();ctx.ellipse(px,py+11,9,3,0,0,Math.PI*2);ctx.fill();
 drawPixel(px-7,py-2,14,12,'#ea9f65'); drawPixel(px-9,py-4,5,6,'#f6c394'); drawPixel(px+4,py-4,5,6,'#f6c394');
 drawPixel(px-3,py-1,6,5,'#fff4e3'); drawPixel(px-3,py+5,6,3,'#8d4d33'); drawPixel(px-4,py+1,2,2,'#1e2630'); drawPixel(px+2,py+1,2,2,'#1e2630');
 if(graphicsLevel()==='enhanced'){ ctx.fillStyle='rgba(255,234,154,.65)'; ctx.font='12px Georgia'; ctx.fillText('✦',px+12,py-2); }
}
function canvasClick(e){if(!questModal.hidden||!infoModal.hidden)return;const rect=canvas.getBoundingClientRect();const px=(e.clientX-rect.left)+cam.x,py=(e.clientY-rect.top)+cam.y;const x=Math.floor(px/cam.tile),y=Math.floor(py/cam.tile);if(x>=0&&y>=0&&x<W&&y<H)walkClick(x,y);}

// ---------- Coordinate painting ----------
function orderedCells(q){const arr=cells(q);let s=0;for(const c of q.id)s=(s*31+c.charCodeAt(0))>>>0;return arr.map((v,i)=>({...v,s:seed(v.x,v.y,s^i)})).sort((a,b)=>a.s-b.s);}
function target(){if(!active)return null;const done=progressOf(active);return orderedCells(active).find(c=>!done.has(key(c.x,c.y)))||null;}
function openQuest(id){const q=qById(id);if(!q||!unlocked(q)||complete(q))return;route=[];pendingQuest=null;active=q;brush=null;shortcutCapture=null;$('shortcutEditor').hidden=true;showHint=false;focusMode=q.pattern.length>=24||q.pattern.length>12&&window.innerWidth<730; if(state.settings.autoBrush&&q.pattern.length>=24){const first=target();brush=first?.code||null;}clearTimeout(toastTimer);$('toast').hidden=true;questModal.hidden=false;
 $('paintingTitle').textContent=q.title;$('paintRegion').textContent='· '+q.region.toUpperCase();$('paintStory').textContent=q.story+' '+q.lesson;$('gridSize').textContent=`${q.pattern[0].length} × ${q.pattern.length}`;
 renderPainting();$('closeQuest').focus();}
function closeQuest(){questModal.hidden=true;active=null;brush=null;shortcutCapture=null;showHint=false;focusMode=false;save();updateUI();$('worldCanvas').focus();}
function paletteCodes(){return active?[...new Set(active.pattern.join('').replaceAll('.',''))]:[];}
function updateShortcutUI(){
 const st=state.settings;
 $('prevKeyBtn').textContent=shortcutCapture==='prev'?'Press letter / number…':(st.keyPrev||'Q').toUpperCase();
 $('nextKeyBtn').textContent=shortcutCapture==='next'?'Press letter / number…':(st.keyNext||'E').toUpperCase();
 $('enableColorHotkeys').checked=st.hotkeysEnabled!==false;
 $('enableColorRightClick').checked=st.rightClickCycle!==false;
 const s=st.hotkeysEnabled!==false?`${(st.keyPrev||'q').toUpperCase()} ◀ / ${(st.keyNext||'e').toUpperCase()} ▶`:'Hotkeys off';
 $('shortcutSummary').textContent=`${s} · ${st.rightClickCycle===false?'Right-click off':'Right-click to cycle'}`;
}
function setBrush(code,manual=true){
 if(!active||!paletteCodes().includes(code))return;
 brush=code;
 // A manual selection overrides automatic brushing on larger canvases.
 if(manual&&active.pattern.length>=24&&state.settings.autoBrush){state.settings.autoBrush=false;save();}
 $('btnAutoBrush').textContent=state.settings.autoBrush?'✓ Automatic brush: ON':'○ Automatic brush: OFF';
 $('btnAutoBrush').setAttribute('aria-pressed',String(state.settings.autoBrush));
 renderPalette();
 feedback(`Brush ready: ${palette[code].name}. Find the requested coordinate.`);
}
function cycleBrush(delta){
 if(!active)return;
 const codes=paletteCodes();if(!codes.length)return;
 const i=codes.indexOf(brush),next=codes[((i<0?(delta>0?-1:0):i)+delta+codes.length*2)%codes.length];
 setBrush(next);
}
function renderPalette(){
 if(!active)return;
 const root=$('colorPalette'),ring=$('wheelSwatches'),codes=paletteCodes();root.textContent='';ring.textContent='';
 for(const [i,code] of codes.entries()){
  const color=palette[code],b=document.createElement('button');b.type='button';b.className='color-choice'+(brush===code?' selected':'');b.setAttribute('aria-pressed',String(brush===code));
  const chip=document.createElement('span');chip.className='swatch';chip.style.setProperty('--swatch',color.hex);
  b.append(chip,document.createTextNode(color.name));b.addEventListener('click',()=>setBrush(code));root.appendChild(b);
  const w=document.createElement('button');w.type='button';w.className='wheel-swatch'+(brush===code?' selected':'');w.style.setProperty('--color',color.hex);
  const angle=2*Math.PI*i/codes.length-Math.PI/2;
  w.style.left=`${50+37.5*Math.cos(angle)}%`;w.style.top=`${50+37.5*Math.sin(angle)}%`;
  w.setAttribute('aria-label',`Select ${color.name}`);w.setAttribute('aria-pressed',String(brush===code));w.title=color.name;
  w.addEventListener('click',()=>setBrush(code));ring.appendChild(w);
 }
 $('wheelCenterDot').style.background=brush?palette[brush].hex:'#7796ae';
 $('wheelCenterName').textContent=brush?palette[brush].name:'Choose';
 $('btnWheelCycle').setAttribute('aria-label',`Next color. Current brush ${brush?palette[brush].name:'not selected'}`);
 updateShortcutUI();
}
function captureShortcut(kind){shortcutCapture=kind;updateShortcutUI();$('shortcutMessage').textContent=`Press a letter or number for ${kind==='next'?'next':'previous'} color; Esc cancels.`;}
function applyShortcutKey(key){
 if(!shortcutCapture)return false;
 if(key==='Escape'){shortcutCapture=null;updateShortcutUI();$('shortcutMessage').textContent='Key change cancelled.';return true;}
 if(!/^[a-z0-9]$/i.test(key)){$('shortcutMessage').textContent='Use a single A–Z letter or 0–9 number.';return true;}
 const kind=shortcutCapture,field=kind==='next'?'keyNext':'keyPrev',other=kind==='next'?'keyPrev':'keyNext';
 if(key.toLowerCase()===(state.settings[other]||'').toLowerCase()){$('shortcutMessage').textContent='That key is already assigned to the other direction. Choose a different one.';return true;}
 state.settings[field]=key.toLowerCase();shortcutCapture=null;save();updateShortcutUI();$('shortcutMessage').textContent=`Saved: ${kind==='next'?'next':'previous'} color is ${(key).toUpperCase()}.`;return true;
}

function renderPainting(){if(!active)return;const q=active,p=progressOf(q),n=q.pattern.length,w=q.pattern[0].length,tgt=target();
 $('filledLabel').textContent=`${p.size} / ${cells(q).length} cells`;$('puzzlePct').textContent=`${Math.round(p.size/cells(q).length*100)}%`;$('puzzleBar').style.width=`${p.size/cells(q).length*100}%`;
 if(!tgt){finishQuest(q);return;}
 $('targetText').textContent=`(${tgt.x}, ${tgt.y})`;$('targetColor').textContent=`Paint with ${palette[tgt.code].name}`;$('targetColor').style.color=palette[tgt.code].hex;
 $('btnHint').textContent=showHint?'✧ Hide row & column hint':'✧ Show row & column hint';$('hintCount').textContent=`Hints used here: ${state.hints[q.id]||0}. Hints never cost XP.`;
 const canFocus=w>12;const focusBtn=$('btnFocus');focusBtn.hidden=!canFocus;focusBtn.textContent=focusMode?'▦ Show whole artwork':'⊞ Focus on a 10×10 area';focusBtn.setAttribute('aria-pressed',String(focusMode));
 const size=focusMode&&canFocus?10:w;
 const xs=focusMode?clamp(tgt.x-5,1,w-size+1):1,ys=focusMode?clamp(tgt.y-5,1,n-size+1):1;
 $('focusLabel').textContent=focusMode?`FOCUS VIEW · X ${xs}–${xs+size-1} · Y ${ys}–${ys+size-1}`:canFocus?`FULL ${w}×${n} CANVAS · Focus view available`:'FULL ARTWORK';
 $('btnAutoBrush').hidden=w<24;$('btnAutoBrush').textContent=state.settings.autoBrush?'✓ Automatic brush: ON':'○ Automatic brush: OFF';$('btnAutoBrush').setAttribute('aria-pressed',String(state.settings.autoBrush));
 if(w>=24&&state.settings.autoBrush)brush=tgt.code;
 renderPalette();const grid=$('coordinateGrid');grid.textContent='';grid.style.setProperty('--n',size);
 const corner=document.createElement('div');corner.className='axis-head';corner.textContent='Y ↑';grid.appendChild(corner);
 for(let x=xs;x<xs+size;x++){const axis=document.createElement('div');axis.className='axis-head'+(showHint&&x===tgt.x?' hinted':'');axis.textContent=x;grid.appendChild(axis);}
 for(let y=ys+size-1;y>=ys;y--){const yLabel=document.createElement('div');yLabel.className='axis-head'+(showHint&&y===tgt.y?' hinted':'');yLabel.textContent=y;grid.appendChild(yLabel);
   for(let x=xs;x<xs+size;x++){const btn=document.createElement('button');btn.type='button';const c=q.pattern[n-y][x-1];const painted=p.has(key(x,y));btn.className='grid-cell'+(painted?' filled':'')+(showHint&&x===tgt.x?' col-hint':'')+(showHint&&y===tgt.y?' row-hint':'');
     if(painted)btn.style.setProperty('--cell-color',palette[c].hex);btn.setAttribute('aria-label',`Cell (${x}, ${y}) ${painted?palette[c].name+' painted':'empty'}`);btn.disabled=painted;
     btn.addEventListener('click',()=>paintCell(x,y,btn));grid.appendChild(btn);
   }
 }
}
function paintCell(x,y,element){if(!active)return;const tgt=target();if(!tgt)return;
 if(!brush){feedback('Choose a brush color first.',true);return;}
 if(x!==tgt.x||y!==tgt.y||brush!==tgt.code){state.mistakes++;save();element.classList.remove('wrong');void element.offsetWidth;element.classList.add('wrong');playTone('bad');feedback(x===tgt.x&&y===tgt.y?'Right square! Try the requested brush color.':`Not quite. Read (${tgt.x}, ${tgt.y}): X right, then Y up.`,true);updateUI();return;}
 const done=progressOf(active);done.add(key(x,y));state.paint[active.id]=[...done];state.xp+=4;showHint=false;save();playTone('ok');
 const remaining=cells(active).length-done.size;feedback(remaining?`Great! (${x}, ${y}) is painted. +4 XP · ${remaining} left.`:'Your artwork is complete!');
 updateUI();renderPainting();
}
function feedback(message,error=false){const el=$('paintingFeedback');el.textContent=message;el.className='painting-feedback '+(error?'alert':'ok');}
function finishQuest(q){if(complete(q))return;state.done.push(q.id);state.xp+=q.reward;save();active=null;questModal.hidden=true;route=[];pendingQuest=null;playTone('win');updateUI();
 const more=readyQuests();const art=`<div style="display:grid;place-items:center;margin:14px 0"><canvas id="victoryArt" width="210" height="210" style="width:210px;height:210px;image-rendering:pixelated;background:#16334c;border:4px solid #e5c384;border-radius:14px"></canvas></div>`;
 const end=state.done.length===quests.length;
 showInfo('✦ RESTORATION COMPLETE',end?'Pixel Valley is restored!':`${q.title} is restored!`,`${art}<p style="text-align:center">${end?'You brought every landmark back to life. The Pixel Festival has begun!':'The valley glows a little brighter. New pathways and challenges may have opened.'}</p><p class="mini-note" style="text-align:center">+${q.reward} completion XP • ${state.done.length} of ${quests.length} landmarks restored</p><div style="text-align:center"><button class="btn btn-primary" id="nextAdventure" type="button">${end?'Explore your restored world':'Continue the adventure →'}</button></div>`);
 drawGalleryArt($('victoryArt'),q,true);
 $('nextAdventure').addEventListener('click',()=>{closeInfo();if(!end&&more.length)startTravel(more[0]);});
}
function showHintFn(){if(!active)return;showHint=!showHint;if(showHint){state.hints[active.id]=(state.hints[active.id]||0)+1;save();}renderPainting();feedback(showHint?'Follow the highlighted column (X) and row (Y). Their meeting point is your square.':'Hint hidden. Try reading X first, then Y.');}

// ---------- Gallery and guide ----------
function showInfo(kicker,title,html){$('infoKicker').textContent=kicker;$('infoTitle').textContent=title;$('infoContent').innerHTML=html;infoModal.hidden=false;$('closeInfo').focus();}
function closeInfo(){infoModal.hidden=true;$('worldCanvas').focus();}
function openHelp(){showInfo('THE EXPLORER’S FIELD GUIDE','How to restore Pixel Valley',`
 <div class="help-grid"><div class="help-tile"><h3>① Explore the valley</h3><p>Use arrow keys, WASD, the on-screen direction pad, or click the map to walk. Tap a glowing landmark or choose one from the Adventure Quests list to travel there automatically.</p></div>
 <div class="help-tile"><h3>② Open a restoration</h3><p>Walk onto a landmark or stand next to it and press Space. Quests with a lock require earlier restorations.</p></div>
 <div class="help-tile"><h3>③ Read (X, Y)</h3><p>X is the horizontal position, counted from left to right. Y is the vertical position, counted from bottom to top. The bottom-left square is (1,1). The numbers label <strong>cells</strong>, not intersections.</p></div>
 <div class="help-tile"><h3>④ Paint by coordinates</h3><p>Read the requested color, select the matching brush, then tap the square at those coordinates. Every correct square earns XP. A mistake only gives you another chance.</p></div>
 <div class="help-tile"><h3>⑤ Eight main chapters + five optional trails</h3><p>Finish the original chapters to unlock Prism Tundra (36×36) after the Sunspire, and Celestial Gardens (40×40 and 44×44) after the Prismatic Crossing. Five smaller side areas branch north from the map; they provide optional practice and XP without blocking the main story.</p></div>
 <div class="help-tile"><h3>⑥ Brush shortcuts and hints</h3><p>Show row & column hint highlights the X column and Y row. Large artworks offer a Focus 10×10 view that preserves the true coordinates. For 24×24 and larger puzzles, you may automatically choose the requested brush color to concentrate on plotting. Click colors around the circular palette, click its center or Next button to cycle, right-click the painting grid or wheel to cycle, or use Q/E by default. Customize the keys in the puzzle. Every correct cell saves automatically.</p></div></div>
 <p class="mini-note" style="margin-top:18px">Coordinate convention: both the painting canvas and optional world-map grid use the bottom-left as the origin. The map labels cells from (1,1); map coordinates are not continuous Cartesian graphing points.</p>`);}
function drawGalleryArt(canvasEl,q,full){const c=canvasEl.getContext('2d'),n=q.pattern.length,w=q.pattern[0].length;const size=Math.min(canvasEl.width/(w+2),canvasEl.height/(n+2));c.clearRect(0,0,canvasEl.width,canvasEl.height);c.fillStyle='#17354a';c.fillRect(0,0,canvasEl.width,canvasEl.height);const x0=(canvasEl.width-w*size)/2,y0=(canvasEl.height-n*size)/2;const p=progressOf(q);for(let y=0;y<n;y++)for(let x=0;x<w;x++){const code=q.pattern[y][x];if(code==='.')continue;const colored=full||p.has(key(x+1,n-y));c.fillStyle=colored?palette[code].hex:'#426078';c.fillRect(Math.round(x0+x*size),Math.round(y0+y*size),Math.ceil(size)-1,Math.ceil(size)-1);}}
function openGallery(selected=null){let html=`<p>Every landmark you restore appears in the collection. Unfinished art shows only the squares you've already painted.</p><div class="gallery-grid">`;
 for(const q of quests){const done=complete(q),num=progressOf(q).size,total=cells(q).length;html+=`<div class="gallery-item ${!done?'locked':''}"><canvas id="gallery-${q.id}" width="144" height="144" aria-label="${q.title} artwork"></canvas><h3>${q.title}</h3><p>${done?'✓ Restored':unlocked(q)?`${num}/${total} squares`: '🔒 Locked'}</p>${unlocked(q)&&!done?`<button type="button" data-gallery-quest="${q.id}">Continue painting</button>`:''}</div>`;}
 html+='</div><h3 style="margin-top:20px">Explorer badges</h3><div class="badge-list">';const labels=['First Brushstroke','First Restoration','Meadow Guardian','Bridge Builder','100 Pixels','Valley Hero','Sky Lift Engineer','Dawn Phoenix','Marsh Wayfinder','Sunspire Keeper','Prism Pathfinder','Cosmos Artist','Side Trail Scout','Master Restorer'],icons=['🖌','✦','♣','═','▦','★','✧','☀','☾','♛','◇','✿','♧','★'];
 foundBadges().forEach((flag,i)=>{html+=`<div class="award ${flag?'':'locked'}"><div class="award-icon">${icons[i]}</div>${labels[i]}<br><small>${flag?'EARNED':'NOT YET'}</small></div>`;});html+='</div>';
 showInfo('THE RESTORED COLLECTION','Gallery & Achievements',html);
 for(const q of quests){drawGalleryArt($(`gallery-${q.id}`),q,false);}for(const b of $('infoContent').querySelectorAll('[data-gallery-quest]'))b.addEventListener('click',()=>{const id=b.dataset.galleryQuest;closeInfo();startTravel(qById(id));});
 if(selected){const item=$(`gallery-${selected}`);if(item)item.scrollIntoView({block:'nearest'});}
}

function openSettings(){showInfo('PREFERENCES','Adventure Settings',`
 <div class="setting-row"><label for="soundSelect">Audio feedback</label><select id="soundSelect"><option value="off">Off</option><option value="on">On (gentle sound effects)</option></select></div>
 <div class="setting-row"><label for="coordsSelect">Show world-map coordinates</label><select id="coordsSelect"><option value="off">Off</option><option value="on">On</option></select></div>
 <div class="setting-row"><label for="graphicsSelect">Graphics quality</label><select id="graphicsSelect"><option value="low">Low</option><option value="standard">Standard</option><option value="enhanced">Enhanced</option></select></div>
 <div class="setting-row"><label for="motionSelect">World animation & ambience</label><select id="motionSelect"><option value="on">On</option><option value="off">Off</option></select></div>
 <div class="graphics-note"><strong>Living World tip:</strong> Enhanced adds richer terrain texture, animated ambient effects, stronger landmark glow, and a visible Pip companion. If a device feels slow, switch to Standard or Low.</div>
 <p class="mini-note">Your adventure, XP, restored artwork, and achievements save automatically in this browser. Switching devices or clearing browser storage can remove saved progress.</p>
 <div class="setting-row"><div><strong>Start a completely new adventure</strong><br><small>Erase this browser's saved valley, artwork and XP.</small></div><button id="eraseSave" class="danger-btn" type="button">Reset progress</button></div>`);
 $('soundSelect').value=state.settings.sound?'on':'off';$('coordsSelect').value=showMapCoords?'on':'off';$('graphicsSelect').value=graphicsLevel();$('motionSelect').value=motionEnabled()?'on':'off';
 $('soundSelect').addEventListener('change',e=>{state.settings.sound=e.target.value==='on';save();playTone();});
 $('coordsSelect').addEventListener('change',e=>{showMapCoords=e.target.value==='on';$('btnCoords').textContent=`# Map grid: ${showMapCoords?'on':'off'}`;$('btnCoords').setAttribute('aria-pressed',String(showMapCoords));});
 $('graphicsSelect').addEventListener('change',e=>{state.settings.graphics=e.target.value;save();toast(`Graphics quality: ${e.target.value}.`);});
 $('motionSelect').addEventListener('change',e=>{state.settings.motion=e.target.value==='on';save();toast(`World animation ${state.settings.motion?'enabled':'disabled'}.`);});
 $('eraseSave').addEventListener('click',()=>{if(window.confirm('Erase all your saved Coordinate Pixel Quest progress on this browser? This cannot be undone.')){state=blankState();route=[];pendingQuest=null;save();closeInfo();updateUI();toast('New adventure started. Your valley is ready!');}});
}

function handleKeyboard(e){
 if(!infoModal.hidden){if(e.key==='Escape')closeInfo();return;}
 if(!questModal.hidden){
  if(shortcutCapture){e.preventDefault();if(!e.repeat)applyShortcutKey(e.key);return;}
  if(e.key==='Escape'){e.preventDefault();closeQuest();return;}
  if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&state.settings.hotkeysEnabled!==false){
    const value=e.key.toLowerCase();
    if(value===(state.settings.keyNext||'e')){e.preventDefault();cycleBrush(1);return;}
    if(value===(state.settings.keyPrev||'q')){e.preventDefault();cycleBrush(-1);return;}
  }
  return;
 }

 const tag=(document.activeElement?.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
 const dirs={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};const dir=dirs[e.key.toLowerCase()];if(dir){e.preventDefault();tryMove(...dir);}else if(e.code==='Space'){e.preventDefault();interact();}}
function init(){state=load();if(!passable(state.player.x,state.player.y))state.player={x:5,y:9};
 $('btnHelp').addEventListener('click',openHelp);$('btnGallery').addEventListener('click',()=>openGallery());$('btnSettings').addEventListener('click',openSettings);
 $('closeInfo').addEventListener('click',closeInfo);$('closeQuest').addEventListener('click',closeQuest);$('saveQuest').addEventListener('click',closeQuest);$('btnHint').addEventListener('click',showHintFn);$('btnFocus').addEventListener('click',()=>{focusMode=!focusMode;renderPainting();});
 $('btnAutoBrush').addEventListener('click',()=>{state.settings.autoBrush=!state.settings.autoBrush;save();brush=state.settings.autoBrush?target()?.code:null;renderPainting();feedback(state.settings.autoBrush?'Automatic color brush is on. You still need to plot the coordinates.':'Automatic color brush is off. Choose each color yourself.');});
 $('btnPrevColor').addEventListener('click',()=>cycleBrush(-1));
 $('btnNextColor').addEventListener('click',()=>cycleBrush(1));
 $('btnWheelCycle').addEventListener('click',()=>cycleBrush(1));
 $('colorWheel').addEventListener('wheel',e=>{if(questModal.hidden)return;e.preventDefault();cycleBrush(e.deltaY>=0?1:-1);},{passive:false});
 questModal.addEventListener('contextmenu',e=>{
  if(state.settings.rightClickCycle===false||!active||!e.target.closest('#colorWheel, #paintArea, #colorPalette'))return;
  e.preventDefault();cycleBrush(e.shiftKey?-1:1);
 });
 $('btnShortcutConfig').addEventListener('click',()=>{$('shortcutEditor').hidden=!$('shortcutEditor').hidden;shortcutCapture=null;updateShortcutUI();});
 $('doneShortcutConfig').addEventListener('click',()=>{shortcutCapture=null;$('shortcutEditor').hidden=true;});
 $('nextKeyBtn').addEventListener('click',()=>captureShortcut('next'));
 $('prevKeyBtn').addEventListener('click',()=>captureShortcut('prev'));
 $('enableColorHotkeys').addEventListener('change',e=>{state.settings.hotkeysEnabled=e.target.checked;save();updateShortcutUI();});
 $('enableColorRightClick').addEventListener('change',e=>{state.settings.rightClickCycle=e.target.checked;save();updateShortcutUI();});
 $('btnGuide').addEventListener('click',()=>{const list=readyQuests();const next=list.find(q=>!q.id.startsWith('side_'))||list[0];if(next)startTravel(next);else openGallery();});
 $('btnCoords').addEventListener('click',()=>{showMapCoords=!showMapCoords;$('btnCoords').textContent=`# Map grid: ${showMapCoords?'on':'off'}`;$('btnCoords').setAttribute('aria-pressed',String(showMapCoords));});
 $('btnRecenter').addEventListener('click',()=>{cam.x=state.player.x*cam.tile-cam.w/2;cam.y=state.player.y*cam.tile-cam.h/2;toast('Map centered on your explorer.');});
 $('worldCanvas').addEventListener('click',canvasClick);document.addEventListener('keydown',handleKeyboard);
 document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>tryMove(...b.dataset.move.split(',').map(Number))));
 questModal.addEventListener('click',e=>{if(e.target===questModal)closeQuest();});infoModal.addEventListener('click',e=>{if(e.target===infoModal)closeInfo();});
 window.addEventListener('resize',fitCanvas);fitCanvas();updateUI();setInterval(tickRoute,85);requestAnimationFrame(drawMap);
 if(!state.welcomeSeen){state.welcomeSeen=true;save();openHelp();}
}
init();
})();
