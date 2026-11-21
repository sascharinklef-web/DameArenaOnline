'use strict';
// DameArena Mobile 1.5.3. Rules ported from dame_engine.py 116.5.1.
const KEY='damearena.mobile.v1', $=id=>document.getElementById(id), uid=()=>crypto.randomUUID();
const clone=x=>JSON.parse(JSON.stringify(x));
const fresh=()=>Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r+c)%2?(r<3?'s':r>4?'w':'.'):'.'));
const inside=(r,c)=>r>=0&&r<8&&c>=0&&c<8, other=s=>s==='w'?'s':'w';
function options(b,side,chain=null){const captures=[],quiet=[];for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=b[r][c];if(p==='.'||p.toLowerCase()!==side||(chain&&(chain[0]!==r||chain[1]!==c)))continue;const dirs=p===p.toUpperCase()?[-1,1]:[side==='w'?-1:1];for(const dr of dirs)for(const dc of [-1,1]){if(p===p.toUpperCase()){let x=r+dr,y=c+dc;while(inside(x,y)&&b[x][y]==='.'){quiet.push({from:[r,c],to:[x,y],capture:null});x+=dr;y+=dc}if(inside(x,y)&&b[x][y].toLowerCase()===other(side)&&inside(x+dr,y+dc)&&b[x+dr][y+dc]==='.')captures.push({from:[r,c],to:[x+dr,y+dc],capture:[x,y]});}else{const x=r+dr,y=c+dc;if(inside(x,y)&&b[x][y]==='.')quiet.push({from:[r,c],to:[x,y],capture:null});else if(inside(x+dr,y+dc)&&inside(x,y)&&b[x][y].toLowerCase()===other(side)&&b[x+dr][y+dc]==='.')captures.push({from:[r,c],to:[x+dr,y+dc],capture:[x,y]});}}}return captures.length||chain?captures:quiet;}
function apply(st,m){const b=clone(st.board),[r,c]=m.from,[x,y]=m.to,p=b[r][c];b[r][c]='.';if(m.capture)b[m.capture[0]][m.capture[1]]='.';const promoted=p===p.toLowerCase()&&(x===(st.side==='w'?0:7));b[x][y]=promoted?p.toUpperCase():p;const chain=m.capture&&!promoted&&options(b,st.side,[x,y]).length?[x,y]:null;return {board:b,side:chain?st.side:other(st.side),chain};}
function fullMoves(st){const out=[];function walk(s,path){for(const m of options(s.board,s.side,s.chain)){const next=apply(s,m),np=[...path,m];if(next.side!==st.side)out.push({steps:np,state:next});else walk(next,np);}}walk(st,[]);return out;}
function poskey(st){return st.side+'|'+st.board.map(r=>r.join('')).join('')+'|'+(st.chain?st.chain.join(','):'');}
function evaluate(st){let score=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const p=st.board[r][c];if(p==='.')continue;let v=p===p.toUpperCase()?310:100+(p==='s'?r:7-r)*4;v+=((c>=2&&c<=5)?5:0);score+=(p.toLowerCase()==='s'?1:-1)*v;}return score;}
function search(st,depth,alpha,beta){const moves=fullMoves(st);if(!moves.length)return st.side==='s'?-100000-depth:100000+depth;if(!depth)return evaluate(st);if(st.side==='s'){let best=-Infinity;for(const m of moves){best=Math.max(best,search(m.state,depth-1,alpha,beta));alpha=Math.max(alpha,best);if(alpha>=beta)break;}return best;}let best=Infinity;for(const m of moves){best=Math.min(best,search(m.state,depth-1,alpha,beta));beta=Math.min(beta,best);if(alpha>=beta)break;}return best;}
let data;try{data=JSON.parse(localStorage.getItem(KEY))}catch{}if(!data||!data.profile)data={profile:null,games:[],current:null};let selected=null,busy=false;
function save(){try{localStorage.setItem(KEY,JSON.stringify(data))}catch(e){$('status').textContent='Speichern fehlgeschlagen: Gerätespeicher prüfen.';}}
function start(){lastAiStep=null;const id=uid();data.current={game_id:id,player_id:data.profile.player_id,white_player_id:data.profile.player_id,black_player_id:'damearena-mobile-ai-v1',ai_version:'mobile-1.0-minimax',difficulty:Number($('level').value),platform:'ios-web-pwa',schema_version:2,started_at:new Date().toISOString(),result:null,steps:[],state:{board:fresh(),side:'w',chain:null},positions:{},quiet:0};data.current.positions[poskey(data.current.state)]=1;selected=null;save();render();}
function coord(a){return 'abcdefgh'[a[1]]+(8-a[0]);}
function record(m){const g=data.current,prev=g.state;g.state=apply(prev,m);g.steps.push({ply:g.steps.length+1,actor_type:prev.side==='w'?'HUMAN':'AI',actor_id:prev.side==='w'?g.white_player_id:g.black_player_id,side:prev.side,from:coord(m.from),to:coord(m.to),capture:!!m.capture,captured_square:m.capture?coord(m.capture):null,at:new Date().toISOString()});if(!g.state.chain){const key=poskey(g.state);g.positions[key]=(g.positions[key]||0)+1;g.quiet=m.capture?0:g.quiet+1;const moves=options(g.state.board,g.state.side,g.state.chain);if(!moves.length)finish(prev.side==='w'?'white':'black');else if(g.positions[key]>=3||g.quiet>=100)finish('draw');}save();}
function finish(result){const g=data.current;if(g.result)return;g.result=result;g.ended_at=new Date().toISOString();data.games.push(clone({...g,state:undefined,positions:undefined}));save();scheduleCommunitySync();}
let lastAiStep=null;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function aiTurn(){
 if(busy||!data.current||data.current.result||data.current.state.side!=='s')return;
 busy=true;const g=data.current;selected=null;render();$('status').textContent='DameArena denkt …';
 try{
  await wait(250);
  const moves=fullMoves(g.state);
  if(!moves.length){finish('white');return;}
  const depth=g.difficulty===1?1:g.difficulty===2?2:3;
  const ranked=moves.map(m=>({m,v:search(m.state,depth-1,-Infinity,Infinity)+Math.random()*(g.difficulty===1?55:g.difficulty===2?8:0)}));
  ranked.sort((a,b)=>b.v-a.v);
  for(const step of ranked[0].m.steps){
   if(data.current!==g||g.result)break;
   lastAiStep={from:step.from,to:step.to};
   // Ausgangsfeld vor der Bewegung hervorheben.
   render();$('status').textContent='DameArena zieht: '+coord(step.from)+' → '+coord(step.to);
   await wait(450);
   if(data.current!==g)break;
   record(step);render();
   $('status').textContent='DameArena: '+coord(step.from)+' → '+coord(step.to);
   await wait(700);
  }
 }catch(e){$('status').textContent='KI-Fehler: '+e.message;}
 finally{busy=false;selected=null;render();}
}
function tap(r,c){const g=data.current;if(!g||g.result||busy||g.state.side!=='w')return;const moves=options(g.state.board,'w',g.state.chain);if(selected){const m=moves.find(m=>m.from[0]===selected[0]&&m.from[1]===selected[1]&&m.to[0]===r&&m.to[1]===c);if(m){record(m);selected=g.state.chain?clone(g.state.chain):null;render();if(!g.result&&g.state.side==='s')aiTurn();return;}}if(moves.some(m=>m.from[0]===r&&m.from[1]===c))selected=[r,c];else selected=g.state.chain?clone(g.state.chain):null;render();}
function render(){const g=data.current,p=data.profile;if(!p)return;$('playerName').textContent=p.display_name;$('bottomName').textContent=p.display_name;if(!g)return;$('level').value=g.difficulty;$('level').disabled=g.steps.length>0;const legal=g.state.side==='w'?options(g.state.board,'w',g.state.chain):[];const targets=selected?legal.filter(m=>m.from[0]===selected[0]&&m.from[1]===selected[1]):[];const board=$('board');board.replaceChildren();let w=0,s=0;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const pce=g.state.board[r][c];if(pce.toLowerCase()==='w')w++;if(pce.toLowerCase()==='s')s++;const cell=document.createElement('button');cell.className='cell '+((r+c)%2?'dark':'light');if(selected&&selected[0]===r&&selected[1]===c)cell.classList.add('sel');if(lastAiStep&&lastAiStep.from[0]===r&&lastAiStep.from[1]===c)cell.classList.add('ai-from');if(lastAiStep&&lastAiStep.to[0]===r&&lastAiStep.to[1]===c)cell.classList.add('ai-to');if(targets.some(m=>m.to[0]===r&&m.to[1]===c))cell.classList.add('target');cell.setAttribute('aria-label',coord([r,c])+' '+(pce==='.'?'leer':pce));cell.onclick=()=>tap(r,c);if(pce!=='.'){const piece=document.createElement('span');piece.className='piece '+pce.toLowerCase();piece.textContent=pce===pce.toUpperCase()?'♛':'';cell.appendChild(piece);}board.appendChild(cell);}$('whiteCount').textContent=w+' Steine';$('blackCount').textContent=s+' Steine';$('gameId').textContent='ID: '+g.game_id.slice(0,8);$('status').textContent=g.result?(g.result==='white'?'Du hast gewonnen!':g.result==='black'?'DameArena hat gewonnen.':'Remis.'):(g.state.chain?'Schlagfolge fortsetzen':g.state.side==='w'?'Du bist am Zug.':'DameArena ist am Zug.');$('history').textContent=g.steps.length?g.steps.map((m,i)=>(i+1)+'. '+(m.side==='w'?'Weiß':'Schwarz')+' '+m.from+(m.capture?' × ':' – ')+m.to).join('   '):'Noch keine Züge.';const games=data.games;$('stats').textContent=`Abgeschlossene Partien: ${games.length} · Siege: ${games.filter(x=>x.result==='white').length} · Niederlagen: ${games.filter(x=>x.result==='black').length} · Remis: ${games.filter(x=>x.result==='draw').length}`;$('undo').disabled=!g.steps.length||busy||!!g.result;}
$('saveProfile').onclick=()=>{const name=$('nameInput').value.trim();if(!name)return;if(!data.profile)data.profile={player_id:uid(),created_at:new Date().toISOString(),type:'HUMAN'};data.profile.display_name=name;save();$('profileDialog').close();if(!data.current)start();else render();};$('editProfile').onclick=()=>{$('nameInput').value=data.profile.display_name;$('profileDialog').showModal();};$('newGame').onclick=()=>{if(busy)return;if(data.current&&!data.current.result&&data.current.steps.length&&!confirm('Laufende Partie aufgeben und neue Partie starten?'))return;if(data.current&&!data.current.result&&data.current.steps.length)finish('black');start();};$('level').onchange=()=>{if(data.current&&!data.current.steps.length){data.current.difficulty=Number($('level').value);save();}};
$('undo').onclick=()=>{
 const g=data.current;
 if(!g||!g.steps.length||busy||g.result)return;
 const remove=g.state.side==='w'?2:1;
 const original=clone(g.steps.slice(0,-remove));
 const snapshot=clone(g);
 const replay={...clone(g),state:{board:fresh(),side:'w',chain:null},steps:[],positions:{},quiet:0,result:null};
 replay.positions[poskey(replay.state)]=1;
 data.current=replay;
 let valid=true;
 try{
  for(const x of original){
   const from=[8-Number(x.from[1]),x.from.charCodeAt(0)-97],to=[8-Number(x.to[1]),x.to.charCodeAt(0)-97];
   const m=options(replay.state.board,replay.state.side,replay.state.chain).find(m=>m.from[0]===from[0]&&m.from[1]===from[1]&&m.to[0]===to[0]&&m.to[1]===to[1]);
   if(!m){valid=false;break;}
   // Replay without recording a second finished game or triggering sync.
   replay.state=apply(replay.state,m);
   replay.steps.push(x);
   if(!replay.state.chain){
    const key=poskey(replay.state);
    replay.positions[key]=(replay.positions[key]||0)+1;
    replay.quiet=m.capture?0:replay.quiet+1;
   }
  }
 }catch(e){valid=false;console.error('Undo replay failed',e);}
 if(!valid){data.current=snapshot;render();alert('Zugrücknahme nicht möglich: gespeicherte Zugfolge konnte nicht vollständig rekonstruiert werden.');return;}
 lastAiStep=null;selected=null;save();render();
 // If the undone move was the human move, the AI must play again.
 if(replay.state.side==='s')aiTurn();
};
function downloadJSON(payload,prefix){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=prefix+'_'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function communityGame(g){const c=clone(g);delete c.player_id;delete c.positions;delete c.state;delete c.quiet;c.white_player_id='community-human';c.black_player_id='damearena-mobile-ai';c.player_alias='anonymous';c.steps=(c.steps||[]).map((m,i)=>({ply:m.ply||i+1,actor_type:m.actor_type||(m.side==='w'?'HUMAN':'AI'),side:m.side,from:m.from,to:m.to,capture:m.capture,captured_square:m.captured_square||null}));return c;}
function personalBackup(){return {schema:'damearena-backup-v1',exported_at:new Date().toISOString(),profile:clone(data.profile),games:clone(data.games),current_game:data.current?clone(data.current):null};}
async function saveToFiles(payload,prefix){
 const name=prefix+'_'+new Date().toISOString().slice(0,10)+'.json';
 const file=new File([JSON.stringify(payload,null,2)],name,{type:'application/json'});
 // iOS share sheet can save directly into Files / iCloud Drive.
 if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
  try{await navigator.share({files:[file],title:'DameArena JSON-Sicherung'});return;}
  catch(e){if(e.name==='AbortError')return;}
 }
 downloadJSON(payload,prefix);
 alert('JSON heruntergeladen. Falls kein Speicherort angeboten wurde: in Safari Downloads öffnen und die Datei über Teilen → In Dateien sichern ablegen.');
}
$('export').onclick=()=>saveToFiles(personalBackup(),'DameArena_Partien_'+(data.profile?.display_name||'Spieler').replace(/[^a-zA-Z0-9_-]/g,'_'));
$('communityExport').onclick=()=>{if(!$('consent').checked){alert('Bitte bestätige zuerst die freiwillige Freigabe.');return;}const games=data.games.map(communityGame);saveToFiles({schema:'damearena-community-v2',exported_at:new Date().toISOString(),privacy:'no-display-name-or-player-uuid',consent:true,source:'mobile-1.3',games},'DameArena_Community');};
// Community Sync: opt-in only. Acknowledgements are stored locally by game ID.
const SYNC_KEY='damearena.community.sync.v1';
let syncSettings={enabled:false,sent:[],lastSuccess:null};
try{const stored=JSON.parse(localStorage.getItem(SYNC_KEY));if(stored&&typeof stored==='object')syncSettings={...syncSettings,...stored,enabled:stored.enabled===true,sent:Array.isArray(stored.sent)?stored.sent:[]};}catch{}
function saveSyncSettings(){try{localStorage.setItem(SYNC_KEY,JSON.stringify(syncSettings));}catch(e){console.warn('Sync-Einstellungen nicht gespeichert',e);}}
function syncStatus(message){const el=$('syncStatus');if(el)el.textContent=message;}
let syncRunning=false;
async function communitySync(){
 if(!syncSettings.enabled||!$('consent').checked||syncRunning||!navigator.onLine)return;
 syncRunning=true;
 try{
  const sent=new Set(syncSettings.sent);
  const pending=data.games.filter(g=>g&&g.result&&typeof g.game_id==='string'&&!sent.has(g.game_id));
  if(!pending.length){syncStatus('Alle abgeschlossenen Partien synchronisiert.');return;}
  syncStatus(pending.length+' Partie(n) zur Übertragung vorgemerkt …');
  for(const g of pending){
   if(!syncSettings.enabled||!$('consent').checked)break;
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
   let response;
   try{response=await fetch('/.netlify/functions/community-ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema:'damearena-community-v2',consent:true,game:communityGame(g)}),signal:controller.signal,cache:'no-store'});}finally{clearTimeout(timeout);}
   if(!response.ok)throw Error('Serverantwort '+response.status);
   const ack=await response.json();if(!ack.ok||ack.game_id!==g.game_id)throw Error('Ungültige Serverbestätigung');
   syncSettings.sent.push(g.game_id);syncSettings.lastSuccess=new Date().toISOString();saveSyncSettings();
  }
  syncStatus('Community Sync erfolgreich · '+syncSettings.sent.length+' Partien bestätigt.');
 }catch(err){syncStatus('Übertragung ausstehend ('+err.message+'). Erneuter Versuch bei nächstem App-Start/Online-Wechsel.');}
 finally{syncRunning=false;}
}
function scheduleCommunitySync(){if(syncSettings.enabled&&$('consent').checked)setTimeout(communitySync,100);}
$('autoSync').checked=syncSettings.enabled;
$('consent').checked=syncSettings.enabled;
$('consent').onchange=()=>{if(!$('consent').checked){syncSettings.enabled=false;$('autoSync').checked=false;saveSyncSettings();syncStatus('Einwilligung widerrufen. Keine weiteren Übertragungen.');}};
$('autoSync').onchange=()=>{
 const enable=$('autoSync').checked;
 if(enable&&!$('consent').checked){$('autoSync').checked=false;syncStatus('Bitte zuerst der freiwilligen Datenfreigabe zustimmen.');return;}
 if(enable&&!confirm('Automatische Übertragung aktivieren? Alle bereits abgeschlossenen und künftigen Partien werden anonymisiert an DameArena Community Learning übertragen. Bereits übertragene Partien lassen sich durch Ausschalten nicht vom Server löschen.')){$('autoSync').checked=false;return;}
 syncSettings.enabled=enable;saveSyncSettings();syncStatus(enable?'Freigabe aktiv. Übertragung wird versucht.':'Automatische Übertragung deaktiviert.');if(enable)communitySync();
};
$('syncNow').onclick=()=>communitySync();
window.addEventListener('online',()=>communitySync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden)communitySync();});
syncStatus(syncSettings.enabled&&$('consent').checked?'Community Sync aktiviert.':'Community Sync deaktiviert.');
setTimeout(communitySync,1500);
$('mergeBackup').onclick=()=>$('mergeFile').click();
$('mergeFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;
 try{
  if(f.size>15*1024*1024)throw Error('Datei zu groß (maximal 15 MB).');
  const incoming=JSON.parse(await f.text());
  if(incoming.schema!=='damearena-backup-v1'||!incoming.profile||!Array.isArray(incoming.games))throw Error('Bitte eine persönliche DameArena-Sicherung wählen.');
  if(incoming.profile.player_id!==data.profile.player_id)throw Error('Andere Spieler-UUID. Für fremde Spielerprofile ist ein separater Community-Import vorgesehen.');
  const known=new Set(data.games.map(g=>g.game_id));let added=0;
  const merged=clone(data);
  for(const g of incoming.games){if(!g||typeof g.game_id!=='string'||!Array.isArray(g.steps))throw Error('Ungültiger Partiedatensatz.');if(!known.has(g.game_id)){merged.games.push(g);known.add(g.game_id);added++;}}
  if(!confirm(added+' neue Partien zusammenführen? Bestehende Partien und die laufende Partie bleiben erhalten.'))return;
  localStorage.setItem(KEY,JSON.stringify(merged));data=merged;render();alert(added+' Partien importiert. '+(incoming.games.length-added)+' Duplikate übersprungen.');
 }catch(err){alert('Zusammenführen fehlgeschlagen: '+err.message);}finally{e.target.value='';}
};
$('importBackup').onclick=()=>$('backupFile').click();
$('backupFile').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>15*1024*1024)throw Error('Datei zu groß (maximal 15 MB).');const incoming=JSON.parse(await f.text());if(incoming.schema!=='damearena-backup-v1'&&incoming.schema!=='damearena-community-v1')throw Error('Unbekanntes Sicherungsformat.');if(!incoming.profile||typeof incoming.profile.player_id!=='string'||typeof incoming.profile.display_name!=='string'||!Array.isArray(incoming.games)||incoming.games.length>100000)throw Error('Ungültige Profildaten oder Partieliste.');if(!confirm('Sicherung importieren? Dein bisheriges Profil und deine Partien werden ersetzt. Bitte vorher eine eigene Sicherung exportieren.'))return;const restored={profile:incoming.profile,games:incoming.games,current:incoming.current_game||null};const serialized=JSON.stringify(restored);localStorage.setItem(KEY,serialized);data=restored;selected=null;lastAiStep=null;render();alert('Sicherung importiert. Bitte App neu öffnen, damit auch eine unterbrochene KI-Partie korrekt fortgesetzt wird.');}catch(err){alert('Import fehlgeschlagen: '+err.message);}finally{e.target.value='';}};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
if(!data.profile){$('nameInput').value='Sascha';$('profileDialog').showModal();}else{if(!data.current)start();else{render();if(data.current.state.side==='s'&&!data.current.result)aiTurn();}}
