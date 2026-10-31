/* Coordinate Pixel Quest — standalone game. No servers, accounts, third-party libraries or API keys. */
(() => {
'use strict';
const DATA = window.CPQ;
const quests = DATA.quests;
const palette = DATA.palette;
const W=66,H=19, STORAGE='cpq_pixel_valley_v1';
const $ = id => document.getElementById(id);
const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
const qById = id => quests.find(q=>q.id===id);
const key = (x,y) => `${x},${y}`;
const valid = (x,y) => x>=1&&x<W-1&&y>=1&&y<H-1;
const totalCells = quests.reduce((n,q)=>n+q.pattern.join('').replaceAll('.','').length,0);
let state,active=null,brush=null,showHint=false,focusMode=false,showMapCoords=false,toastTimer=0,route=[],pendingQuest=null;
let cam={x:0,y:0,w:0,h:0,tile:34};
const canvas=$('worldCanvas'),ctx=canvas.getContext('2d');
const questModal=$('questModal'), infoModal=$('infoModal');

function blankState(){return {version:1,player:{x:5,y:9},done:[],paint:{},mistakes:0,hints:{},xp:0,secrets:[],settings:{sound:false},welcomeSeen:false};}
function load(){let s=blankState();try{const raw=JSON.parse(localStorage.getItem(STORAGE)||'null');if(raw&&raw.version===1){s={...s,...raw,player:{...s.player,...raw.player},settings:{...s.settings,...raw.settings}};s.done=Array.isArray(s.done)?s.done.filter(id=>!!qById(id)):[];s.paint=s.paint&&typeof s.paint==='object'?s.paint:{};s.hints=s.hints&&typeof s.hints==='object'?s.hints:{};s.secrets=Array.isArray(s.secrets)?s.secrets:[];s.xp=Math.max(0,Number(s.xp)||0);s.mistakes=Math.max(0,Number(s.mistakes)||0);s.player.x=clamp(Math.round(s.player.x)||5,1,W-2);s.player.y=clamp(Math.round(s.player.y)||9,1,H-2);}}catch(e){/* corrupt save is ignored */}return s;}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){/* private mode may disable saving */}}
function progressOf(q){const saved=Array.isArray(state.paint[q.id])?state.paint[q.id]:[];const allowed=new Set(cells(q).map(c=>key(c.x,c.y)));return new Set(saved.filter(k=>allowed.has(k)));}
function cells(q){const list=[];const n=q.pattern.length;for(let r=0;r<n;r++)for(let x=0;x<q.pattern[r].length;x++){const code=q.pattern[r][x];if(code!=='.')list.push({x:x+1,y:n-r,code});}return list;}
function complete(q){return state.done.includes(q.id);}
function unlocked(q){return q.need.every(id=>state.done.includes(id));}
function readyQuests(){return quests.filter(q=>unlocked(q)&&!complete(q));}
function paintedCount(){return quests.reduce((n,q)=>n+progressOf(q).size,0);}
function level(){return 1+Math.floor(state.xp/175);}
function nextLevelXp(){return state.xp%175;}
function rank(){const lv=level();return lv>=12?'MASTER MAPPER':lv>=8?'STAR CARTOGRAPHER':lv>=5?'TRAILBLAZER':lv>=3?'EXPLORER':'APPRENTICE';}
function foundBadges(){return [paintedCount()>0,state.done.length>0,state.done.length>=3,complete(qById('bridge')),paintedCount()>=100,complete(qById('festival')),complete(qById('skybridge')),state.done.length===quests.length];}
function currentPip(){
 if(state.done.length===quests.length)return 'Every region shines! You are the Master Restorer of Pixel Valley.';
 if(!complete(qById('bridge'))&&state.done.length===3)return 'The Golden Bridge is ready! Restore it to reach the eastern wilds.';
 if(complete(qById('festival'))&&!complete(qById('skybridge')))return 'Crystal Canyon has awakened. Restore its landmarks to open the Sky Lift!';
 if(complete(qById('skybridge')))return 'Welcome to the Sky Isles! Larger coordinate canvases lead to the Dawn Phoenix.';
 const next=readyQuests()[0];return next?`The ${next.title.toLowerCase()} needs your coordinates. Tap its quest or follow the glowing marker!`:'Explore the valley to find a new restoration.';
}
function updateUI(){
 const painted=paintedCount(),pct=Math.round(painted/totalCells*100),done=state.done.length;
 $('worldPct').textContent=`${pct}%`;$('worldBar').style.width=`${pct}%`;
 $('questCount').textContent=`${done} / ${quests.length}`;$('statQuests').textContent=`${done} / ${quests.length}`;
 $('statCells').textContent=painted.toLocaleString();$('statXP').textContent=`${state.xp.toLocaleString()} XP`;
 $('statAccuracy').textContent=`${painted+state.mistakes?Math.round(painted/(painted+state.mistakes)*100):100}%`;
 $('statBadges').textContent=`${foundBadges().filter(Boolean).length} / 8`;
 $('levelLabel').textContent=`LVL ${level()} · ${rank()}`;$('xpFill').style.width=`${nextLevelXp()/175*100}%`;
 $('pipText').textContent=currentPip();
 const end=done===quests.length,bridge=complete(qById('bridge')),festival=complete(qById('festival')),skybridge=complete(qById('skybridge'));
 const meadowReady=['lamp','tree','robot'].every(id=>state.done.includes(id));
 const chapter=document.querySelector('.story-card .section-eyebrow'), storyTitle=document.querySelector('.story-card h2'), storyParagraph=document.querySelector('.story-card p');
 if(end){chapter.textContent='ALL CHAPTERS / MASTER RESTORER';storyTitle.textContent='Every region shines!';storyParagraph.textContent='From the meadow to the sky, you restored every landmark. Pixel Valley is alive again.';}
 else if(skybridge){chapter.textContent='CHAPTER 04 / THE SKY ISLES';storyTitle.textContent='Rise into the clouds.';storyParagraph.textContent='The Sky Lift is running. Explore floating islands and complete the grand 20×20 masterpieces.';}
 else if(festival){chapter.textContent='CHAPTER 03 / CRYSTAL CANYON';storyTitle.textContent='A new frontier glitters.';storyParagraph.textContent='Cross the canyon gate to create bigger 16×16 artworks and rebuild the Sky Lift.';}
 else if(bridge){chapter.textContent='CHAPTER 02 / EASTERN WILDS';storyTitle.textContent='The eastern world is open.';storyParagraph.textContent='Complete the eastern restorations and Festival of Stars to unlock Crystal Canyon.';}
 else if(meadowReady){chapter.textContent='CHAPTER 01 / THE RIVER CROSSING';storyTitle.textContent='A bridge is waiting.';storyParagraph.textContent='Your three meadow creations are restored. Rebuild the Golden Bridge to reach the east.';}
 else{chapter.textContent='CHAPTER 01 / THE LOST COLORS';storyTitle.textContent='The valley has gone quiet.';storyParagraph.textContent='Find shining landmarks and paint missing pixels to restore the meadow.';}
 $('btnGuide').textContent=end?'✦ See my restored gallery':meadowReady&&!bridge?'✦ Find the Golden Bridge':'✦ Find my next quest';
 $('mapBadge').textContent=end?'✦ All five regions restored!':skybridge?'✦ The Sky Isles are open!':festival?'✦ Crystal Canyon is open!':bridge?'✦ Restore Star Ridge to unlock the canyon!':meadowReady?'✦ Rebuild the river bridge!':`✦ ${3-['lamp','tree','robot'].filter(id=>state.done.includes(id)).length} meadow landmarks until the bridge.`;
 const x=state.player.x,y=state.player.y;
 $('regionName').textContent=x<17?'— Sunlit Meadow':x<32?(y<10?'— Eastern Wilds':'— Star Ridge'):x<47?'— Crystal Canyon':'— Sky Isles';
 const groups=[{name:'Valley',ids:quests.slice(0,8).map(q=>q.id),open:true},{name:'Crystal Canyon',ids:['crystal','fox','observatory','skybridge'],open:festival},{name:'Sky Isles',ids:['whale','citadel','phoenix'],open:skybridge}];
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
const secrets=[{x:3,y:3},{x:13,y:13},{x:5,y:16},{x:23,y:10},{x:29,y:6},{x:29,y:15},{x:35,y:15},{x:45,y:2},{x:52,y:14},{x:57,y:3},{x:63,y:16}];
function seed(x,y,n=0){let h=(x*92837111 ^ y*689287499 ^ n*283923481)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
function isRiver(x){return x===17||x===18;}
function isCanyonGate(x){return x===32||x===33;}
function isSkyGate(x){return x===47||x===48;}
function passable(x,y){if(!valid(x,y))return false;
 if(isRiver(x))return y===9&&complete(qById('bridge'));
 if(isCanyonGate(x))return y===9&&complete(qById('festival'));
 if(isSkyGate(x))return y===9&&complete(qById('skybridge'));
 return true;}
function neighborTiles(x,y){return [[x,y-1],[x+1,y],[x,y+1],[x-1,y]].filter(([a,b])=>passable(a,b));}
function bfs(start,goal){const begin=key(start.x,start.y),dest=key(goal.x,goal.y);if(begin===dest)return [];if(!passable(goal.x,goal.y))return null;const parent=new Map([[begin,null]]),queue=[[start.x,start.y]];for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [nx,ny] of neighborTiles(x,y)){const k=key(nx,ny);if(parent.has(k))continue;parent.set(k,key(x,y));if(k===dest){const path=[];let curr=k;while(curr!==begin){const [px,py]=curr.split(',').map(Number);path.push({x:px,y:py});curr=parent.get(curr);}return path.reverse();}queue.push([nx,ny]);}}return null;}
function findPathTo(q){const candidates=[[q.x,q.y],...neighborTiles(q.x,q.y)].filter(([x,y])=>passable(x,y));let best=null;for(const [x,y] of candidates){const p=bfs(state.player,{x,y});if(p&&(!best||p.length<best.length))best=p;}return best;}
function tryMove(dx,dy){route=[];pendingQuest=null;const nx=state.player.x+dx,ny=state.player.y+dy;if(!passable(nx,ny)){toast(isRiver(nx)?'The river is blocked. Restore the Golden Bridge first!':isCanyonGate(nx)?'Crystal Canyon opens after the Festival of Stars!':isSkyGate(nx)?'Restore the Sky Lift to enter the Sky Isles!':'That tile is outside the path.');return;}moveTo(nx,ny);}
function moveTo(x,y){state.player.x=x;state.player.y=y;save();const secret=secrets.find(s=>s.x===x&&s.y===y);if(secret&&!state.secrets.includes(key(x,y))){state.secrets.push(key(x,y));state.xp+=20;toast('Secret star discovered! +20 XP ✦');playTone('ok');save();}updateUI();}
function startTravel(q){if(complete(q)){openGallery(q.id);return;}if(!unlocked(q)){toast(`Locked! First restore: ${q.need.filter(n=>!state.done.includes(n)).map(n=>qById(n).title).join(', ')}`);return;}
 const p=findPathTo(q);if(!p){toast('That landmark is beyond a locked crossing. Restore the earlier chapter first.');return;}route=p;pendingQuest=q.id;
 if(route.length===0){pendingQuest=null;openQuest(q.id);return;}
 toast(`Traveling to ${q.title}...`);$('worldCanvas').focus();
}
function walkClick(x,y){let q=quests.find(q=>Math.abs(q.x-x)<=1&&Math.abs(q.y-y)<=1);if(q){startTravel(q);return;}
 const path=bfs(state.player,{x,y});if(path){route=path;pendingQuest=null;if(!path.length)toast('You are already here.');}else toast('That region is still sealed. Finish the current chapter to open its crossing.');
}
function tickRoute(){if(!route.length)return;const step=route.shift();if(!passable(step.x,step.y)){route=[];pendingQuest=null;return;}moveTo(step.x,step.y);if(!route.length&&pendingQuest){const id=pendingQuest;pendingQuest=null;openQuest(id);}}
function nearQuest(){return quests.find(q=>unlocked(q)&&!complete(q)&&Math.abs(q.x-state.player.x)+Math.abs(q.y-state.player.y)<=1);}
function interact(){const q=nearQuest();if(q)openQuest(q.id);else toast('Move next to a shining landmark—or select it from the quest log.');}
const cell=34;
function fitCanvas(){const box=canvas.getBoundingClientRect();const dpr=Math.min(2,window.devicePixelRatio||1);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);canvas.dataset.dpr=dpr;}
function drawPixel(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
function drawTile(x,y,t){const px=x*t,py=y*t;
 if(isRiver(x)||isCanyonGate(x)||isSkyGate(x)){
   const canyon=isCanyonGate(x),sky=isSkyGate(x),open=y===9&&(canyon?complete(qById('festival')):sky?complete(qById('skybridge')):complete(qById('bridge')));
   if(open){drawPixel(px,py,t,t,canyon?'#785b7e':sky?'#779bb1':'#8f6849');drawPixel(px,py+4,t,t-8,canyon?'#c598a3':sky?'#d4c4ad':'#b28357');for(let i=0;i<3;i++)drawPixel(px+i*t/3,py+2,2,t-4,'#f3d99c');}
   else{drawPixel(px,py,t,t,canyon?'#432c49':sky?'#17274a':seed(x,y)<.5?'#386981':'#34637e');const v=Math.floor(Date.now()/800)%4;
     if(sky){drawPixel(px+4,py+((v*5+x*3)%24),t-8,4,'#a5c4db');drawPixel(px+13,py+22,16,4,'#617eab');}
     else{drawPixel(px+((v*7+y*3)%20),py+9,10,2,canyon?'#a2769e':'#63a1b0');drawPixel(px+5,py+24,8,2,canyon?'#b68279':'#427e92');}}
   return;
 }
 let bright=.09;for(const q of quests){if(complete(q)){const d=Math.hypot(q.x-x,q.y-y);bright=Math.max(bright,clamp(1-d/(q.id==='bridge'||q.id==='skybridge'?8:7),0,1));}}if(state.done.length===quests.length)bright=Math.max(bright,.95);
 const canyon=x>=34&&x<=46,sky=x>=49,west=x<17;
 const main=sky?(bright>.50?'#658ba3':'#48667e'):canyon?(bright>.50?'#976e72':'#715968'):(bright>.55?(west?'#3c765d':'#356c61'):(west?'#476b66':'#46616b'));
 drawPixel(px,py,t,t,main);
 if(sky){if(seed(x,y,1)>.37){drawPixel(px+3,py+5,27,5,bright>.5?'#a8d5de':'#6c94b4');drawPixel(px+9,py+2,17,4,'#a9c6df');}
  if(seed(x,y,8)>.72){drawPixel(px+14,py+19,3,4,'#eecb98');drawPixel(px+11,py+22,10,2,'#e6daaf');}}
 else if(canyon){if(seed(x,y,1)>.35){drawPixel(px+3,py+16,21,8,bright>.45?'#c38a75':'#8e747a');drawPixel(px+20,py+9,8,7,'#80617b');}
  if(seed(x,y,4)>.79){drawPixel(px+12,py+4,7,13,bright>.5?'#63d7cf':'#718ca1');drawPixel(px+14,py+2,3,4,'#d9f8e7');}}
 else{if(seed(x,y,3)>.35)drawPixel(px,py,t,3,bright>.55?'#4e9270':'#527576');if(seed(x,y,4)>.62)drawPixel(px+4+Math.floor(seed(x,y,2)*19),py+6,3,3,bright>.5?'#73b382':'#66867e');
  if(seed(x,y,6)>.92){drawPixel(px+14,py+13,3,4,bright>.7?'#f9d383':'#b6aa85');drawPixel(px+12,py+15,7,2,bright>.7?'#e7a1ad':'#879596');}}
 const path=(y===9&&x>=5&&x<=62)||(x===7&&y>=7&&y<=10)||(x===11&&y>=4&&y<=9)||(x===9&&y>=9&&y<=14)||(x===22&&y>=7&&y<=15)||(x===25&&y>=4&&y<=13)||(x===37&&y>=5&&y<=9)||(x===40&&y>=9&&y<=14)||(x===44&&y>=4&&y<=15)||(x===53&&y>=5&&y<=9)||(x===59&&y>=9&&y<=14);
 if(path){drawPixel(px,py+11,t,t-22,sky?'#a5b5ba':canyon?'#a1867a':bright>.48?'#ae966c':'#879083');drawPixel(px+4,py+13,t-8,2,sky?'#ecddd0':'#c1b083');}
 if((x===2||x===64||y===1||y===17)&&seed(x,y,10)>.40){
  if(sky){drawPixel(px+9,py+7,15,15,'#8bb5cd');drawPixel(px+13,py+2,9,8,'#d4eafa');}
  else if(canyon){drawPixel(px+11,py+11,18,20,'#74536c');drawPixel(px+14,py+3,12,12,'#b48994');}
  else{drawPixel(px+10,py+14,14,16,'#36513e');drawPixel(px+6,py+4,22,16,bright>.5?'#408966':'#557767');drawPixel(px+11,py+1,12,6,bright>.5?'#65a874':'#718e7b');}}
 if(x>=19&&x<32&&!complete(qById('bridge')))drawPixel(px,py,t,t,'rgba(15,33,59,.36)');
 if(x>=34&&x<47&&!complete(qById('festival')))drawPixel(px,py,t,t,'rgba(15,17,39,.48)');
 if(x>=49&&!complete(qById('skybridge')))drawPixel(px,py,t,t,'rgba(13,19,46,.55)');
}
function drawArtOnMap(q,x,y,t,done){const cx=x*t+t/2,cy=y*t+t/2;ctx.save();if(done){const scale=2.4;const n=q.pattern.length;const left=Math.round(cx-n*scale/2),top=Math.round(cy-n*scale/2);for(let row=0;row<n;row++)for(let col=0;col<n;col++){const code=q.pattern[row][col];if(code!=='.')drawPixel(left+col*scale,top+row*scale,scale+.2,scale+.2,palette[code].hex);}ctx.restore();return;}
 ctx.translate(cx,cy);const locked=!unlocked(q);drawPixel(-12,-10,24,23,locked?'#465870':'#2a6f80');drawPixel(-9,-8,18,18,locked?'#475b6d':'#7dc4c2');drawPixel(-7,-5,14,14,locked?'#647080':'#355977');
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 19px Georgia,serif';ctx.fillStyle=locked?'#a2b1bd':'#f5d581';ctx.fillText(locked?'×':q.icon,0,-1);ctx.restore();}
function drawMap(time){const dpr=Number(canvas.dataset.dpr)||1;const width=canvas.width/dpr,height=canvas.height/dpr;if(!width||!height)return;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
 const t=cam.tile;cam.w=width;cam.h=height;cam.x=clamp(state.player.x*t-width/2,0,Math.max(0,W*t-width));cam.y=clamp(state.player.y*t-height/2,0,Math.max(0,H*t-height));
 ctx.save();ctx.translate(-cam.x,-cam.y);
 const left=clamp(Math.floor(cam.x/t)-1,0,W-1),right=clamp(Math.ceil((cam.x+width)/t)+1,0,W-1),top=clamp(Math.floor(cam.y/t)-1,0,H-1),bottom=clamp(Math.ceil((cam.y+height)/t)+1,0,H-1);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)drawTile(x,y,t);
 // The far western village and eastern observatory are original pixel landmarks.
 drawStructure(3,11,t,'village');drawStructure(28,3,t,'tower');drawStructure(40,2,t,'canyon');drawStructure(57,3,t,'sky');
 if(showMapCoords){ctx.strokeStyle='rgba(249,223,162,.20)';ctx.lineWidth=1;ctx.font='bold 8px Consolas,monospace';ctx.textAlign='left';ctx.textBaseline='top';for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){ctx.strokeRect(x*t,y*t,t,t);ctx.fillStyle='rgba(235,248,220,.72)';ctx.fillText(`${x+1},${H-y}`,x*t+2,y*t+2);}}
 for(const secret of secrets){if(state.secrets.includes(key(secret.x,secret.y)))continue;if(isRiver(secret.x))continue;const cx=(secret.x+.5)*t,cy=(secret.y+.5)*t;ctx.fillStyle='#ffe0a0';ctx.font=`${13+Math.sin(time/290+secret.x)*2}px Georgia`;ctx.textAlign='center';ctx.fillText('✦',cx,cy+6);}
 for(const q of quests){if(q.x<left-1||q.x>right+1||q.y<top-1||q.y>bottom+1)continue;const done=complete(q),locked=!unlocked(q),px=q.x*t+t/2,py=q.y*t+t/2;const pulse=(1+Math.sin(time/380+q.x)*.25);
 if(!done&&!locked){ctx.fillStyle='rgba(255,217,142,.13)';ctx.beginPath();ctx.arc(px,py,16*pulse,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffdf88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(px,py,15*pulse,0,Math.PI*2);ctx.stroke();}
 drawArtOnMap(q,q.x,q.y,t,done);
 if(!done&&!locked){drawPixel(px+10,py-17,6,8,'#ffe29a');drawPixel(px+11,py-21,4,4,'#fff5d8');}
 if(done&&Math.sin(time/500+q.y)>.6){ctx.fillStyle='#fff1a2';ctx.font='11px Georgia';ctx.fillText('✦',px+13,py-17);}
 }
 // Player hero sprite.
 const px=state.player.x*t+t/2,py=state.player.y*t+t/2+Math.sin(time/210)*1.6;
 ctx.fillStyle='rgba(6,30,38,.4)';ctx.beginPath();ctx.ellipse(px,py+13,14,5,0,0,Math.PI*2);ctx.fill();
 drawPixel(px-9,py-8,18,18,'#143e55');drawPixel(px-7,py-5,14,13,'#59bdd0');drawPixel(px-8,py-14,16,11,'#f8cea1');drawPixel(px-10,py-17,20,7,'#583f4d');drawPixel(px-3,py-19,6,5,'#f5d37a');drawPixel(px-5,py-9,3,3,'#183448');drawPixel(px+4,py-9,3,3,'#183448');drawPixel(px-8,py+8,6,6,'#2a314a');drawPixel(px+3,py+8,6,6,'#2a314a');
 if(route.length){ctx.strokeStyle='rgba(255,242,160,.7)';ctx.lineWidth=2;ctx.setLineDash([3,5]);ctx.beginPath();ctx.moveTo(px,py);for(const p of route)ctx.lineTo((p.x+.5)*t,(p.y+.5)*t);ctx.stroke();ctx.setLineDash([]);}
 ctx.restore();
 // Edge vignette
 const grad=ctx.createRadialGradient(width/2,height/2,width*.18,width/2,height/2,width*.75);grad.addColorStop(0,'rgba(4,22,44,0)');grad.addColorStop(1,'rgba(5,17,31,.26)');ctx.fillStyle=grad;ctx.fillRect(0,0,width,height);
 requestAnimationFrame(drawMap);
}
function drawStructure(x,y,t,type){const px=x*t,py=y*t;if(type==='village'){drawPixel(px-10,py+3,67,35,'#6b514b');drawPixel(px-15,py-12,76,22,'#b07d6b');drawPixel(px-4,py+9,9,9,'#f6d183');drawPixel(px+27,py+11,13,17,'#edd3a0');drawPixel(px+13,py+21,15,17,'#353e4b');}
else if(type==='tower'){drawPixel(px+6,py-3,28,49,'#9e8c82');drawPixel(px,py-10,40,17,'#777a8f');drawPixel(px+16,py-23,9,14,'#ffcf76');drawPixel(px+11,py+12,14,15,'#3d5061');}
else if(type==='canyon'){drawPixel(px-6,py+19,75,18,'#63455b');drawPixel(px+4,py-1,51,23,'#94677c');drawPixel(px+17,py-23,26,24,'#b78991');drawPixel(px+25,py-33,9,12,'#7ae5dc');}
else{drawPixel(px-13,py+22,75,8,'#7eabc0');drawPixel(px,py+6,49,24,'#a7bac2');drawPixel(px+10,py-20,28,27,'#c6c9c9');drawPixel(px+19,py-33,11,14,'#f4d1a0');}}
function canvasClick(e){if(!questModal.hidden||!infoModal.hidden)return;const rect=canvas.getBoundingClientRect();const px=(e.clientX-rect.left)+cam.x,py=(e.clientY-rect.top)+cam.y;const x=Math.floor(px/cam.tile),y=Math.floor(py/cam.tile);if(x>=0&&y>=0&&x<W&&y<H)walkClick(x,y);}

// ---------- Coordinate painting ----------
function orderedCells(q){const arr=cells(q);let s=0;for(const c of q.id)s=(s*31+c.charCodeAt(0))>>>0;return arr.map((v,i)=>({...v,s:seed(v.x,v.y,s^i)})).sort((a,b)=>a.s-b.s);}
function target(){if(!active)return null;const done=progressOf(active);return orderedCells(active).find(c=>!done.has(key(c.x,c.y)))||null;}
function openQuest(id){const q=qById(id);if(!q||!unlocked(q)||complete(q))return;route=[];pendingQuest=null;active=q;brush=null;showHint=false;focusMode=q.pattern.length>12&&window.innerWidth<730;clearTimeout(toastTimer);$('toast').hidden=true;questModal.hidden=false;
 $('paintingTitle').textContent=q.title;$('paintRegion').textContent='· '+q.region.toUpperCase();$('paintStory').textContent=q.story+' '+q.lesson;$('gridSize').textContent=`${q.pattern[0].length} × ${q.pattern.length}`;
 renderPainting();$('closeQuest').focus();}
function closeQuest(){questModal.hidden=true;active=null;brush=null;showHint=false;focusMode=false;save();updateUI();$('worldCanvas').focus();}
function renderPalette(){const root=$('colorPalette');root.textContent='';const codes=[...new Set(active.pattern.join('').replaceAll('.',''))];for(const code of codes){const b=document.createElement('button');b.type='button';b.className='color-choice'+(brush===code?' selected':'');b.setAttribute('aria-pressed',String(brush===code));const chip=document.createElement('span');chip.className='swatch';chip.style.setProperty('--swatch',palette[code].hex);b.append(chip,document.createTextNode(palette[code].name));b.addEventListener('click',()=>{brush=code;renderPalette();$('paintingFeedback').className='painting-feedback';$('paintingFeedback').textContent=`Brush ready: ${palette[code].name}. Now find the square.`;});root.appendChild(b);}}
function renderPainting(){if(!active)return;const q=active,p=progressOf(q),n=q.pattern.length,w=q.pattern[0].length,tgt=target();
 $('filledLabel').textContent=`${p.size} / ${cells(q).length} cells`;$('puzzlePct').textContent=`${Math.round(p.size/cells(q).length*100)}%`;$('puzzleBar').style.width=`${p.size/cells(q).length*100}%`;
 if(!tgt){finishQuest(q);return;}
 $('targetText').textContent=`(${tgt.x}, ${tgt.y})`;$('targetColor').textContent=`Paint with ${palette[tgt.code].name}`;$('targetColor').style.color=palette[tgt.code].hex;
 $('btnHint').textContent=showHint?'✧ Hide row & column hint':'✧ Show row & column hint';$('hintCount').textContent=`Hints used here: ${state.hints[q.id]||0}. Hints never cost XP.`;
 const canFocus=w>12;const focusBtn=$('btnFocus');focusBtn.hidden=!canFocus;focusBtn.textContent=focusMode?'▦ Show whole artwork':'⊞ Focus on a 10×10 area';focusBtn.setAttribute('aria-pressed',String(focusMode));
 const size=focusMode&&canFocus?10:w;
 const xs=focusMode?clamp(tgt.x-5,1,w-size+1):1,ys=focusMode?clamp(tgt.y-5,1,n-size+1):1;
 $('focusLabel').textContent=focusMode?`FOCUS VIEW · X ${xs}–${xs+size-1} · Y ${ys}–${ys+size-1}`:canFocus?`FULL ${w}×${n} CANVAS · Focus view available`:'FULL ARTWORK';
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
 <div class="help-tile"><h3>⑤ Make the valley bloom</h3><p>Restore the meadow and Golden Bridge, then the eastern Festival of Stars. That unlocks Crystal Canyon's 16×16 puzzles; rebuild the Sky Lift to explore the 20×20 Sky Isles.</p></div>
 <div class="help-tile"><h3>⑥ Use help when needed</h3><p>Show row & column hint highlights the X column and Y row. Large 16×16 and 20×20 artworks offer a Focus 10×10 view for smaller screens. Every correct cell saves automatically.</p></div></div>
 <p class="mini-note" style="margin-top:18px">Coordinate convention: both the painting canvas and optional world-map grid use the bottom-left as the origin. The map labels cells from (1,1); map coordinates are not continuous Cartesian graphing points.</p>`);}
function drawGalleryArt(canvasEl,q,full){const c=canvasEl.getContext('2d'),n=q.pattern.length,w=q.pattern[0].length;const size=Math.min(canvasEl.width/(w+2),canvasEl.height/(n+2));c.clearRect(0,0,canvasEl.width,canvasEl.height);c.fillStyle='#17354a';c.fillRect(0,0,canvasEl.width,canvasEl.height);const x0=(canvasEl.width-w*size)/2,y0=(canvasEl.height-n*size)/2;const p=progressOf(q);for(let y=0;y<n;y++)for(let x=0;x<w;x++){const code=q.pattern[y][x];if(code==='.')continue;const colored=full||p.has(key(x+1,n-y));c.fillStyle=colored?palette[code].hex:'#426078';c.fillRect(Math.round(x0+x*size),Math.round(y0+y*size),Math.ceil(size)-1,Math.ceil(size)-1);}}
function openGallery(selected=null){let html=`<p>Every landmark you restore appears in the collection. Unfinished art shows only the squares you've already painted.</p><div class="gallery-grid">`;
 for(const q of quests){const done=complete(q),num=progressOf(q).size,total=cells(q).length;html+=`<div class="gallery-item ${!done?'locked':''}"><canvas id="gallery-${q.id}" width="144" height="144" aria-label="${q.title} artwork"></canvas><h3>${q.title}</h3><p>${done?'✓ Restored':unlocked(q)?`${num}/${total} squares`: '🔒 Locked'}</p>${unlocked(q)&&!done?`<button type="button" data-gallery-quest="${q.id}">Continue painting</button>`:''}</div>`;}
 html+='</div><h3 style="margin-top:20px">Explorer badges</h3><div class="badge-list">';const labels=['First Brushstroke','First Restoration','Meadow Guardian','Bridge Builder','100 Pixels','Valley Hero','Sky Lift Engineer','Master Restorer'],icons=['🖌','✦','♣','═','▦','★','✧','☀'];
 foundBadges().forEach((flag,i)=>{html+=`<div class="award ${flag?'':'locked'}"><div class="award-icon">${icons[i]}</div>${labels[i]}<br><small>${flag?'EARNED':'NOT YET'}</small></div>`;});html+='</div>';
 showInfo('THE RESTORED COLLECTION','Gallery & Achievements',html);
 for(const q of quests){drawGalleryArt($(`gallery-${q.id}`),q,false);}for(const b of $('infoContent').querySelectorAll('[data-gallery-quest]'))b.addEventListener('click',()=>{const id=b.dataset.galleryQuest;closeInfo();startTravel(qById(id));});
 if(selected){const item=$(`gallery-${selected}`);if(item)item.scrollIntoView({block:'nearest'});}
}
function openSettings(){showInfo('PREFERENCES','Adventure Settings',`
 <div class="setting-row"><label for="soundSelect">Audio feedback</label><select id="soundSelect"><option value="off">Off</option><option value="on">On (gentle sound effects)</option></select></div>
 <div class="setting-row"><label for="coordsSelect">Show world-map coordinates</label><select id="coordsSelect"><option value="off">Off</option><option value="on">On</option></select></div>
 <p class="mini-note">Your adventure, XP, restored artwork, and achievements save automatically in this browser. Switching devices or clearing browser storage can remove saved progress.</p>
 <div class="setting-row"><div><strong>Start a completely new adventure</strong><br><small>Erase this browser's saved valley, artwork and XP.</small></div><button id="eraseSave" class="danger-btn" type="button">Reset progress</button></div>`);
 $('soundSelect').value=state.settings.sound?'on':'off';$('coordsSelect').value=showMapCoords?'on':'off';
 $('soundSelect').addEventListener('change',e=>{state.settings.sound=e.target.value==='on';save();playTone();});
 $('coordsSelect').addEventListener('change',e=>{showMapCoords=e.target.value==='on';$('btnCoords').textContent=`# Map grid: ${showMapCoords?'on':'off'}`;$('btnCoords').setAttribute('aria-pressed',String(showMapCoords));});
 $('eraseSave').addEventListener('click',()=>{if(window.confirm('Erase all your saved Coordinate Pixel Quest progress on this browser? This cannot be undone.')){state=blankState();route=[];pendingQuest=null;save();closeInfo();updateUI();toast('New adventure started. Your valley is ready!');}});
}
function handleKeyboard(e){if(!infoModal.hidden){if(e.key==='Escape')closeInfo();return;}if(!questModal.hidden){if(e.key==='Escape')closeQuest();return;}
 const tag=(document.activeElement?.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
 const dirs={arrowup:[0,-1],w:[0,-1],arrowdown:[0,1],s:[0,1],arrowleft:[-1,0],a:[-1,0],arrowright:[1,0],d:[1,0]};const dir=dirs[e.key.toLowerCase()];if(dir){e.preventDefault();tryMove(...dir);}else if(e.code==='Space'){e.preventDefault();interact();}}
function init(){state=load();if(!passable(state.player.x,state.player.y))state.player={x:5,y:9};
 $('btnHelp').addEventListener('click',openHelp);$('btnGallery').addEventListener('click',()=>openGallery());$('btnSettings').addEventListener('click',openSettings);
 $('closeInfo').addEventListener('click',closeInfo);$('closeQuest').addEventListener('click',closeQuest);$('saveQuest').addEventListener('click',closeQuest);$('btnHint').addEventListener('click',showHintFn);$('btnFocus').addEventListener('click',()=>{focusMode=!focusMode;renderPainting();});
 $('btnGuide').addEventListener('click',()=>{const list=readyQuests();if(list.length)startTravel(list[0]);else openGallery();});
 $('btnCoords').addEventListener('click',()=>{showMapCoords=!showMapCoords;$('btnCoords').textContent=`# Map grid: ${showMapCoords?'on':'off'}`;$('btnCoords').setAttribute('aria-pressed',String(showMapCoords));});
 $('btnRecenter').addEventListener('click',()=>{cam.x=state.player.x*cam.tile-cam.w/2;cam.y=state.player.y*cam.tile-cam.h/2;toast('Map centered on your explorer.');});
 $('worldCanvas').addEventListener('click',canvasClick);document.addEventListener('keydown',handleKeyboard);
 document.querySelectorAll('[data-move]').forEach(b=>b.addEventListener('click',()=>tryMove(...b.dataset.move.split(',').map(Number))));
 questModal.addEventListener('click',e=>{if(e.target===questModal)closeQuest();});infoModal.addEventListener('click',e=>{if(e.target===infoModal)closeInfo();});
 window.addEventListener('resize',fitCanvas);fitCanvas();updateUI();setInterval(tickRoute,125);requestAnimationFrame(drawMap);
 if(!state.welcomeSeen){state.welcomeSeen=true;save();openHelp();}
}
init();
})();
