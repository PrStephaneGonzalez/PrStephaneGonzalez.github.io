import {createGraph,definition,legalMoves,popcount,ids,displayedArcs} from '../engine/graph.mjs';
import {createGame,previewMove,playMove,serializeGame,deserializeGame} from '../engine/game.mjs';
import {chooseMove} from '../ai/choose.mjs';
import {translate} from '../i18n/strings.mjs';
import {icon,nodeIcon,nodeIcons} from './icons.mjs';
import {captureWaves,cascadeSchedule} from './cascade.mjs';
import {createAudio} from './audio.mjs';
import {loadStore,activeProfile,summary,recordGame,createProfile,switchProfile,deleteProfile,exportProfile,importProfile,MAX_PROFILES} from './profiles.mjs';

const $=s=>document.querySelector(s),app=$('#app'),modal=$('#modal');
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(`influence.v1.${key}`))??fallback;}catch{return fallback;}};
const write=(key,value)=>{try{localStorage.setItem(`influence.v1.${key}`,JSON.stringify(value));}catch{/* Private browsing may not allow persistence. */}};
const defaults={lang:navigator.language?.startsWith('fr')?'fr':'en',mode:'solo',side:'L',first:'L',difficulty:'normal',confirm:false,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,sound:true,fixed:false,speed:'normal',ver:2};
const stored=read('settings',{});if(!(stored.ver>=2)){stored.confirm=false;stored.sound=true;stored.ver=2;}
let settings={...defaults,...stored};
for(const[key,allowed]of Object.entries({lang:['fr','en'],mode:['solo','duo'],side:['L','R'],first:['L','R','random'],difficulty:['easy','normal','expert'],speed:['calm','normal','fast']}))if(!allowed.includes(settings[key]))settings[key]=defaults[key];
for(const k of ['confirm','motion','sound','fixed'])settings[k]=typeof settings[k]==='boolean'?settings[k]:defaults[k];
let config={...settings},levels=[],index=0,graph,state=null,history=[],selected=null,hovered=null,screen='home',dialogType='',draft={},busy=false,worker=null,aiTimer=null,revision=0,zoom=1,pan={x:0,y:0},drag=null,daily=null,toast='',lastOpener=null;
const today=()=>new Date().toISOString().slice(0,10);
let profileStore=loadStore(null,[]),profileNote='',pendingDelete=null;
const me=()=>activeProfile(profileStore),levelIds=()=>levels.map(l=>l.id),wonCount=()=>summary(me(),levelIds()).won;
const saveProfiles=()=>write('profiles',profileStore);
// Animation state: `animating` blocks board redraws, `aiShow` is the piece the computer is showing.
let aiShow=null,skipAnim=false,animating=false;const waiters=new Set(),onSkip=new Set();
const audio=createAudio(()=>settings.sound);
const unlockAudio=()=>{if(settings.sound)audio.unlock();};
const t=(key,v)=>translate(settings.lang,key,v),camp=p=>t(p==='L'?'red':'blue');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const name=l=>l.name[settings.lang];
const button=(action,label,cls='button',ico='',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${ico?icon(ico):''}${label}</button>`;
const mark=p=>`<span class="team-mark ${p==='L'?'red':'blue'}" aria-hidden="true"></span>`;
const announce=s=>{$('#announcer').textContent=s;};
const plural=n=>n===1?'':'s';
const level=()=>levels[index];
function setSettings(){write('settings',settings);document.documentElement.lang=settings.lang;document.documentElement.classList.toggle('reduced',settings.motion);}
function save(){if(!state)return;write('session',{index,config,daily,game:serializeGame(graph,state),history:history.map(s=>serializeGame(graph,s))});}
function stop(){revision++;clearTimeout(aiTimer);aiTimer=null;if(worker){worker.terminate();worker=null;}busy=false;aiShow=null;animating=false;skipAnim=false;document.querySelectorAll('.ai-hand,.ai-ripple').forEach(e=>e.remove());[...waiters].forEach(f=>f());waiters.clear();onSkip.clear();}
function restore(){const saved=read('session',null);try{if(!saved||!Number.isInteger(saved.index)||!levels[saved.index])return;
 index=saved.index;graph=createGraph(level().definition??level());const result=deserializeGame(saved.game);
 if(JSON.stringify(definition(result.graph))!==JSON.stringify(definition(graph)))throw Error('Changed board');
 state=result.state;config={...settings,...saved.config};
 if(!['solo','duo'].includes(config.mode)||!['L','R'].includes(config.side)||!['easy','normal','expert'].includes(config.difficulty))throw Error('Invalid configuration');
 daily=typeof saved.daily==='string'?saved.daily:null;
 history=(saved.history??[]).slice(-30).map(s=>deserializeGame(s)).filter(r=>JSON.stringify(definition(r.graph))===JSON.stringify(definition(graph))).map(r=>r.state);
 }catch{state=null;history=[];index=0;daily=null;}}
function start(i=index,options=config,dailyDate=null){stop();index=(i+levels.length)%levels.length;config={...settings,...options};daily=dailyDate;graph=createGraph(level());history=[];selected=null;hovered=null;zoom=1;pan={x:0,y:0};
 const first=config.first==='random'?(Math.random()<.5?'L':'R'):config.first;
 state=createGame(graph,first);screen='game';closeModal();save();render();announce(t(`turn${state.turn}`));scheduleAI();}
function result(){return state.scores.L===state.scores.R?'draw':state.scores.L>state.scores.R?'L':'R';}
function endProgress(){if(config.mode!=='solo')return;profileStore=recordGame(profileStore,level().id,config.side,result()===config.side,today());saveProfiles();}
const sidesText=()=>{const x=summary(me(),levelIds());return t('progressSides',{r:x.red,b:x.blue});};
const profileChip=()=>button('profile',`<span class="chip-name">${esc(me().name||t('guest'))}</span>`,'profile-chip','user',`aria-label="${t('profileTitle')}: ${esc(me().name||t('guest'))}" title="${t('profileTitle')}"`);
const soundButton=()=>button('sound','','icon-button sound-toggle',settings.sound?'volume':'mute',`aria-pressed="${settings.sound}" aria-label="${t(settings.sound?'soundMute':'soundUnmute')}" title="${t(settings.sound?'soundMute':'soundUnmute')}"`);
function syncSoundButton(){const b=$('[data-action="sound"]');if(b){const focus=document.activeElement===b;b.outerHTML=soundButton();if(focus)$('[data-action="sound"]')?.focus();}}
function refreshChip(){const c=$('.profile-chip');if(c)c.outerHTML=profileChip();}
const keepPrompt=()=>config.mode==='solo'&&me().id==='guest'?`<div class="keep-progress">${icon('star')}<span>${t('keepText')}</span>${button('profile',t('keepButton'),'text-button','user')}</div>`:'';
function header(){return `<header class="site-header"><button class="brand" data-action="home" aria-label="INFLUENCE · ${t('home')}"><span class="brand-symbol" aria-hidden="true"><i></i><b></b><em></em></span><span>INFLUENCE<small>${t('subtitle')}</small></span></button><nav class="header-actions" aria-label="Menu"><button class="language" data-action="language" aria-label="${t('language')}"><span class="${settings.lang==='fr'?'active':''}">FR</span><span class="${settings.lang==='en'?'active':''}">EN</span></button>${profileChip()}${button('settings','', 'icon-button','gear',`aria-label="${t('settings')}" title="${t('settings')}"`)}</nav></header>`;}
function footer(){return `<footer class="site-footer"><span>© INFLUENCE · 2026</span><div>${button('about',t('about'),'text-button')}${button('help',t('how'),'text-button')}</div></footer>`;}
function home(){const saved=state&&!state.finished&&config.mode===settings.mode;
 return `<main class="home-main"><section class="hero"><div class="hero-copy"><span class="eyebrow"><i></i>${t('eyebrow')}</span><h1>${t('hero')}</h1><p class="intro">${t('intro')}</p><div class="mode-picker" role="group" aria-label="${t('mode')}">${button('mode-solo',t('solo'),settings.mode==='solo'?'mode active':'mode','robot')}${button('mode-duo',t('duo'),settings.mode==='duo'?'mode active':'mode','people')}</div>${button(saved?'resume':'play',saved?t('resume'):t('play'),'button primary hero-cta','play')}<div class="hero-links">${button('levels',t('levels'),'text-button','grid')}${button('options',t('startOptions'),'text-button','gear')}${button('profile',me().name?esc(me().name):t('keepShort'),'text-button','user')}</div><div class="tiny-note">${icon('check')}${t('feature1')}<span>·</span>${t('feature2')}</div></div><div class="hero-art"><div class="orbit-label label-top">${mark('L')}${mark('R')}<span>${t('twoTeams')}</span></div><div class="mini-board">${boardSVG(true)}</div><span class="orbit-label label-bottom">${icon('spark')}${t('quick')}</span><span class="deco-flower flower-a" aria-hidden="true">✳</span><span class="deco-flower flower-b" aria-hidden="true">✳</span></div></section><section class="home-bottom"><div class="journey"><span class="mini-kicker">${t('progress')}</span><div class="journey-line"><div class="journey-stars" aria-hidden="true">${[0,1,2,3,4].map(i=>`<span class="${i<wonCount()?'earned':''}">★</span>`).join('')}</div><span>${t('progressText',{n:wonCount()})}</span>${button('levels',t('levels'),'text-button','arrow')}</div></div><button class="daily-card" data-action="daily"><span class="daily-icon">${icon('sun')}</span><span><b>${t('daily')}</b><small>${t('dailyText')}</small></span>${icon('arrow')}</button></section></main>`;
}
function boardSVG(demo=false){
 const g=demo?createGraph(levels[0]):graph, remaining=demo?g.full:state.remaining;
 const p=demo?'L':settings.fixed&&config.mode==='solo'?config.side:state.turn;
 const positions=(demo?levels[0]:level()).positions;
 const arcs=displayedArcs(g,remaining,p), color=p==='L'?'red':'blue';
 const active=!demo&&!state.finished&&!busy&&!(config.mode==='solo'&&state.turn!==config.side);
 const nodes=g.vertices.filter((v,i)=>remaining&g.bits[i]);
 const defs=`<defs><marker id="arrow-${demo?'demo':'game'}" viewBox="0 0 12 12" refX="9" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="m2 1 8 5-8 5" fill="none" stroke="${p==='L'?'#d43d54':'#2377be'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></marker><filter id="shadow-${demo?'demo':'game'}" x="-50%" y="-50%" width="200%" height="220%"><feDropShadow dx="0" dy="7" stdDeviation="5" flood-color="#234667" flood-opacity=".15"/></filter><linearGradient id="red-fill" x1="0" x2=".5" y2="1"><stop stop-color="#ff7d86"/><stop offset="1" stop-color="#e9435b"/></linearGradient><linearGradient id="blue-fill" x1="0" x2=".5" y2="1"><stop stop-color="#59aff5"/><stop offset="1" stop-color="#247bce"/></linearGradient></defs>`;
 const lines=arcs.map(([a,b])=>{const[x,y]=positions[a],[xx,yy]=positions[b],dist=Math.hypot(xx-x,yy-y),pad=54;
 const both=g.arcs.some(([c,d])=>c===b&&d===a);const off=both?10:0,dx=(xx-x)/dist,dy=(yy-y)/dist;
 return `<path class="edge" data-from="${a}" data-to="${b}" d="M ${x+dx*pad-dy*off} ${y+dy*pad+dx*off} L ${xx-dx*pad-dy*off} ${yy-dy*pad+dx*off}" marker-end="url(#arrow-${demo?'demo':'game'})"/>`;}).join('');
 const pieces=nodes.map(v=>{const i=g.index[v.id],[x,y]=positions[v.id],c=v.color==='L'?'red':'blue',playable=active&&v.color===state.turn;
 const label=demo?'':playable?t('nodeCapture',{id:v.id,camp:camp(v.color),n:popcount(previewMove(g,state,v.id)),s:plural(popcount(previewMove(g,state,v.id)))}):t('node',{id:v.id,camp:camp(v.color)});
 const shape=v.color==='L'?'<circle class="piece-body" r="39"/>':'<rect class="piece-body" x="-38" y="-38" width="76" height="76" rx="23"/>';
 return `<g class="node ${c} ${playable?'playable':''}" transform="translate(${x} ${y})" data-node="${v.id}" ${demo?'aria-hidden="true"':`role="button" tabindex="${playable?0:-1}" aria-label="${esc(label)}" aria-disabled="${!playable}"`}><rect class="touch-area" x="-50" y="-50" width="100" height="100" rx="22" fill="transparent"/><g class="piece-fall"><circle class="node-halo" r="49"/>${shape}<g transform="translate(-16 -17) scale(1.33)" class="piece-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${nodeIcon(nodeIcons[i%nodeIcons.length])}</g><text class="node-letter" y="29" text-anchor="middle">${v.id}</text><circle class="preview-badge" cx="29" cy="-30" r="12"/><path class="preview-check" d="m23 -30 4 4 8-9"/></g></g>`;
 }).join('');
 return `<svg class="graph ${color} ${demo?'demo':''}" viewBox="0 0 600 520" ${demo?'aria-hidden="true"':`role="group" aria-label="${esc(name(level()))}"`}><title>${demo?'INFLUENCE':esc(name(level()))}</title>${defs}<g class="graph-content" transform="translate(${demo?0:pan.x} ${demo?0:pan.y}) translate(300 260) scale(${demo?1:zoom}) translate(-300 -260)">${lines}${pieces}</g></svg>`;
}
function scoreCard(p){const n=state.scores[p],left=popcount(state.remaining&graph.colors[p]),isHuman=config.mode==='solo'&&p===config.side;
 return `<div class="score-card ${p==='L'?'red':'blue'} ${!state.finished&&state.turn===p?'current':''}"><div class="score-team">${mark(p)}<div><b>${camp(p)}</b><small>${config.mode==='solo'?isHuman?t('you'):t('computer'):''}</small></div></div><strong class="score-number">${n}</strong><div class="playable-count ${left===1&&!state.finished?'last':''}"><span>${left}</span> ${t('playable')}</div></div>`;}
function game(){
 const done=state.finished,ai=!done&&config.mode==='solo'&&state.turn!==config.side;
 const cntL=popcount(state.remaining&graph.colors.L),cntR=popcount(state.remaining&graph.colors.R);
 const notice=cntL===1&&cntR===1?t('lastBoth'):cntL===1?t('lastL'):cntR===1?t('lastR'):'';
 const label=daily?t('dailyTitle',{date:daily}):`${t('level')} ${String(index+1).padStart(2,'0')} / 12`;
 const canUndo=history.some(s=>config.mode==='duo'||s.turn===config.side);
 return `<main class="game-main"><div class="game-heading"><div><span class="eyebrow">${label}</span><h1>${esc(name(level()))}</h1></div><div class="game-tools">${soundButton()}${button('levels','', 'icon-button','grid',`aria-label="${t('levels')}" title="${t('levels')}"`)}${button('help','', 'icon-button','help',`aria-label="${t('how')}" title="${t('how')}"`)}${button('home','', 'icon-button','home',`aria-label="${t('home')}" title="${t('home')}"`)}</div></div><div class="game-layout"><section class="board-card"><div class="turn-banner ${done?'ended':state.turn==='L'?'red':'blue'}" role="status"><div class="turn-symbol">${icon(done?'trophy':ai?'robot':'flag')}</div><div><strong>${done?t(result()==='draw'?'draw':`win${result()}`):t(`turn${state.turn}`)}</strong><span id="banner-sub">${done?t('allCaptured'):busy?t('capturing'):ai?t('thinking'):t(settings.confirm?'instruction':'instructionDirect')}</span></div>${!done?'<span class="turn-dots" aria-hidden="true"><i></i><i></i><i></i></span>':''}</div><div class="board-landscape"><span class="cloud cloud-a" aria-hidden="true"></span><span class="cloud cloud-b" aria-hidden="true"></span><div id="board">${done?'':boardSVG()}</div>${done?resultPanel():''}<div class="board-controls" ${done?'hidden':''}>${button('zoom-out','', 'board-control','minus',`aria-label="${t('zoomOut')}"`)}${button('center','', 'board-control','center',`aria-label="${t('resetView')}"`)}${button('zoom-in','', 'board-control','plus',`aria-label="${t('zoomIn')}"`)}</div></div><div class="move-bar ${settings.confirm?'':'direct'}" ${done?'hidden':''}><div><span class="move-dot"></span><span id="preview-text">${ai?t('thinking'):t(settings.confirm?'select':'selectDirect')}</span></div>${settings.confirm?button('confirm',t('capture',{n:0,s:'s'}),'button primary capture-button','check','disabled'):''}</div></section><aside class="game-sidebar"><div class="scores">${scoreCard('L')}${scoreCard('R')}</div>${notice&&!done?`<p class="last-warning">${icon('info')}${notice}</p>`:''}<div class="aside-card"><span class="mini-kicker">${t('configuration')}</span><div class="config-line">${icon(config.mode==='solo'?'robot':'people')}<span>${t(config.mode==='solo'?'solo':'duo')}</span></div>${config.mode==='solo'?`<div class="difficulty-tag">${t(config.difficulty)}<span>${'●'.repeat(['easy','normal','expert'].indexOf(config.difficulty)+1)}</span></div>`:''}${button('options',t('startOptions'),'text-button','gear')}<hr><p class="arrow-note">${icon('arrow')}${t(settings.fixed&&config.mode==='solo'?'fixedNotice':'autoNotice')}</p></div><div class="aside-actions">${button('undo',t('undo'),'button secondary','back',canUndo?'':'disabled')}${button('restart',t('restart'),'text-button','refresh')}</div><div class="progress-compact"><div>${icon('star')}<span>${t('progressText',{n:wonCount()})}</span></div><div class="progress-track"><i style="width:${wonCount()/12*100}%"></i></div><small class="progress-sides">${sidesText()}</small></div></aside></div><div class="game-bottom"><span>${t('local')}</span>${button('about',t('about'),'text-button','info')}</div></main>`;
}
function resultPanel(){const r=result(),won=r===config.side;return `<section class="result-panel" aria-labelledby="result-title"><div class="result-trophy" aria-hidden="true">${icon(r==='draw'?'spark':'trophy')}</div><span class="eyebrow">${t('resultLabel')}</span><h2 id="result-title">${t(r==='draw'?'draw':`win${r}`)}</h2><p>${config.mode==='solo'?t(won?'victory':'loss'):t('resultNext')}</p><div class="final-score"><span class="red">${mark('L')}${state.scores.L}</span><span class="score-separator">–</span><span class="blue">${mark('R')}${state.scores.R}</span></div><small>${t('final',{a:state.scores.L,b:state.scores.R,n:graph.vertices.length})}</small><p class="settlement">${state.settlement?t('terminal',{camp:camp(state.settlement.player),n:state.settlement.count,winner:camp(state.settlement.recipient)}):t('allCaptured')}</p>${keepPrompt()}<div class="result-buttons">${button('next',t('next'),'button primary','arrow')}${button('replay',t('replay'),'button secondary','refresh')}</div><div class="result-links">${button('switch',t('switch'),'text-button')}${button('share',toast||t('share'),'text-button')}</div></section>`;}
function render(){setSettings();app.innerHTML=header()+(screen==='home'?home():game())+footer();if(screen==='game'&&!state.finished)updatePreview();}
function updatePreview(){if(screen!=='game'||!state||state.finished)return;
 const id=aiShow??selected??hovered;let mask=0n;if(id&&(aiShow||!busy&&!(config.mode==='solo'&&state.turn!==config.side))){try{mask=previewMove(graph,state,id);}catch{}}
 document.querySelectorAll('#board [data-node]').forEach(el=>{const hit=Boolean(mask&graph.bits[graph.index[el.dataset.node]]);el.classList.toggle('in-preview',hit);el.classList.toggle('chosen',el.dataset.node===(aiShow??selected));el.setAttribute('aria-pressed',String(el.dataset.node===(aiShow??selected)));});
 document.querySelectorAll('#board .edge').forEach(el=>el.classList.toggle('in-preview',Boolean((mask&graph.bits[graph.index[el.dataset.from]])&&(mask&graph.bits[graph.index[el.dataset.to]]))));
 const n=popcount(mask),ai=config.mode==='solo'&&state.turn!==config.side;
 $('#preview-text').textContent=n?t(aiShow?'aiPreview':'preview',{n,s:plural(n)}):busy?t('capturing'):ai?t('thinking'):t(settings.confirm?'select':'selectDirect');
 const confirm=$('[data-action="confirm"]');if(confirm){confirm.disabled=!selected||busy||ai;confirm.innerHTML=icon('check')+t('capture',{n,s:plural(n)});}
}
function drawBoard(){if(animating)return;$('#board').classList.toggle('is-zoomed',zoom>1);const focused=document.activeElement?.dataset.node;$('#board').innerHTML=boardSVG();updatePreview();if(focused)$(`#board [data-node="${focused}"]`)?.focus({preventScroll:true});}
function select(id){if(state.finished||busy||config.mode==='solo'&&state.turn!==config.side||!legalMoves(graph,state.remaining,state.turn).includes(id))return;
 if(!settings.confirm||selected===id){commit(id);return;}selected=id;hovered=null;updatePreview();announce(t('preview',{n:popcount(previewMove(graph,state,id)),s:plural(popcount(previewMove(graph,state,id)))}));}
let keyboardInput=false;
// ---- Move animation: tap -> cascade -> score. The engine decides; this only shows it. ----
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function sleep(ms){return new Promise(r=>{if(skipAnim||ms<=0)return r();let timer;const done=()=>{clearTimeout(timer);waiters.delete(done);r();};timer=setTimeout(done,ms);waiters.add(done);});}
function skip(){if(!animating)return;skipAnim=true;onSkip.forEach(f=>f());onSkip.clear();[...waiters].forEach(f=>f());}
const SPEEDS={calm:{think:900,hand:750,look:850},normal:{think:550,hand:500,look:550},fast:{think:250,hand:250,look:250}};
const pace=()=>settings.motion?{think:250,hand:0,look:450}:SPEEDS[settings.speed]??SPEEDS.normal;
function nodeCenter(id){const board=$('#board'),n=board?.querySelector(`[data-node="${id}"]`);if(!n)return null;const b=board.getBoundingClientRect(),r=n.getBoundingClientRect();return{x:r.left-b.left+r.width/2,y:r.top-b.top+r.height/2,w:b.width,h:b.height};}
const setSub=text=>{const el=$('#banner-sub');if(el)el.textContent=text;};
function makeHand(player){const board=$('#board');if(!board)return null;const el=document.createElement('div');el.className=`ai-hand ${player==='L'?'red':'blue'}`;el.setAttribute('aria-hidden','true');el.innerHTML='<svg viewBox="0 0 28 34" width="38" height="46"><path d="M3 2v26l7-6 5 11 5-2-5-11 9-1Z"/></svg>';board.appendChild(el);return el;}
function ripple(target,player){const board=$('#board');if(!board)return;const el=document.createElement('div');el.className=`ai-ripple ${player==='L'?'red':'blue'}`;el.style.left=`${target.x}px`;el.style.top=`${target.y}px`;board.appendChild(el);setTimeout(()=>el.remove(),700);}
/** The computer shows its choice: a pointer travels to the piece, the capture preview lights up, then the pieces fall. */
async function showAiChoice(id,token){
 const p=pace(),player=state.turn,target=nodeCenter(id);
 setSub(t('aiPicks',{camp:camp(player)}));
 const hand=target?makeHand(player):null;
 if(hand&&target){const from={x:target.w*.9,y:target.h*.06},at=pt=>`translate(${pt.x-4}px,${pt.y-2}px)`;hand.style.transform=at(from);
  if(p.hand>0){const a=hand.animate([{transform:at(from)},{transform:at(target)}],{duration:p.hand,easing:'cubic-bezier(.25,.8,.3,1)',fill:'forwards'});onSkip.add(()=>a.finish());await sleep(p.hand);a.finish();}
  else hand.style.transform=at(target);}
 if(token!==revision)return false;
 audio.tap({opponent:true});hand?.classList.add('tap');if(target)ripple(target,player);
 aiShow=id;updatePreview();
 await sleep(p.look);
 if(token!==revision)return false;
 if(hand){hand.classList.add('away');setTimeout(()=>hand.remove(),400);}
 return true;
}
function setScore(player,n){const el=document.querySelector(`.score-card.${player==='L'?'red':'blue'} .score-number`);if(!el)return;el.textContent=n;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
/** Pieces fall in the order the arrows reach them; one note and one point per piece. */
async function runCascade(before,next,id,{opponent,token}){
 const plan=cascadeSchedule(captureWaves(graph,before.remaining,before.turn,id,next.captured)),byId=new Map(plan.items.map(i=>[i.id,i]));
 document.querySelectorAll('#board [data-node]').forEach(el=>{const item=byId.get(el.dataset.node);if(!item)return;el.style.setProperty('--delay',`${item.delay}ms`);el.style.setProperty('--tilt',`${(item.order%2?1:-1)*(7+item.order%3*5)}deg`);el.classList.add('captured');});
 document.querySelectorAll('#board .edge').forEach(el=>{const a=byId.get(el.dataset.from),b=byId.get(el.dataset.to);if(a||b){el.style.setProperty('--delay',`${Math.min(a?.delay??1e9,b?.delay??1e9)}ms`);el.classList.add('gone');}});
 const scorer=before.turn,base=before.scores[scorer];
 plan.items.forEach((item,k)=>{audio.drop(item.order,item.delay,{opponent});setTimeout(()=>{if(token===revision)setScore(scorer,base+k+1);},item.delay+260);});
 await wait(settings.motion?Math.min(plan.duration,350):plan.duration);
}
/** End of game: the remaining pieces fall to the player who is not stuck. */
async function runSettlement(settlement,base,token){
 const gap=Math.max(40,Math.min(110,800/Math.max(1,settlement.vertices.length))),items=settlement.vertices.map((id,i)=>({id,delay:i*gap,order:i})),byId=new Map(items.map(i=>[i.id,i]));
 document.querySelectorAll('#board [data-node]').forEach(el=>{const item=byId.get(el.dataset.node);if(!item)return;el.style.setProperty('--delay',`${item.delay}ms`);el.style.setProperty('--tilt',`${(item.order%2?1:-1)*(7+item.order%3*5)}deg`);el.classList.add('captured','settled');});
 document.querySelectorAll('#board .edge:not(.gone)').forEach(el=>{el.style.setProperty('--delay','0ms');el.classList.add('gone');});
 items.forEach((item,k)=>{audio.drop(item.order,item.delay);setTimeout(()=>{if(token===revision)setScore(settlement.recipient,base+k+1);},item.delay+260);});
 await wait(settings.motion?350:(items.length?items[items.length-1].delay:0)+460);
}
function finishJingle(){const r=result();if(r==='draw')audio.draw();else if(config.mode==='solo'&&r!==config.side)audio.lose();else audio.win();}
async function commit(id,{ai=false}={}){
 if(busy||state.finished)return;const token=revision;let next;try{next=playMove(graph,state,id);}catch{return;}
 busy=true;animating=true;skipAnim=false;hovered=null;if(!ai)selected=id;
 const before=state,opponent=ai&&config.mode==='solo';
 updatePreview();
 try{
  if(ai){if(!await showAiChoice(id,token))return;}else audio.tap();
  setSub(t('capturing'));
  await runCascade(before,next,id,{opponent,token});
  const settlement=next.state.settlement;
  if(token===revision&&settlement){setSub(t('terminal',{camp:camp(settlement.player),n:settlement.count,winner:camp(settlement.recipient)}));await runSettlement(settlement,next.state.scores[settlement.recipient]-settlement.count,token);}
 }catch(error){console.error(error);}
 if(token!==revision)return;
 history.push(before);state=next.state;busy=false;animating=false;aiShow=null;selected=null;
 if(state.finished)endProgress();
 save();render();
 if(state.finished)finishJingle();
 if(keyboardInput&&!modal.open)$('#board .playable')?.focus({preventScroll:true});
 announce(state.finished?t(result()==='draw'?'draw':`win${result()}`):t(`turn${state.turn}`));scheduleAI();
}
function scheduleAI(){if(modal.open||aiTimer||worker||busy)return;if(screen!=='game'||!state||state.finished||config.mode!=='solo'||state.turn===config.side)return;
 const token=revision;aiTimer=setTimeout(()=>{aiTimer=null;if(token!==revision)return;let finished=false;
 const finish=result=>{if(finished||token!==revision)return;finished=true;clearTimeout(timer);worker?.terminate();worker=null;
 const moves=legalMoves(graph,state.remaining,state.turn);const id=moves.includes(result?.id)?result.id:chooseMove(graph,state,{difficulty:'normal',seed:state.ply+index+1}).id;commit(id,{ai:true});};
 const timer=setTimeout(()=>finish(null),2200);
 try{worker=new Worker(new URL('../ai/worker.mjs',import.meta.url),{type:'module'});worker.onmessage=({data})=>finish(data.result);worker.onerror=()=>finish(null);worker.postMessage({request:token,graph:definition(graph),state:{...state,remaining:state.remaining.toString()},difficulty:config.difficulty,seed:state.ply*1057+index*37+2026});}catch{finish(null);}
 },pace().think);}
function undo(){if(!history.length)return;stop();let previous;do{previous=history.pop();}while(history.length&&config.mode==='solo'&&previous.turn!==config.side);state=previous;selected=null;hovered=null;save();render();scheduleAI();}
function openModal(kind){if(screen==='game'&&!busy)stop();if(kind==='profile'){pendingDelete=null;profileNote='';}lastOpener=document.activeElement;dialogType=kind;if(kind==='options')draft={...settings,...(screen==='game'?config:{})};renderModal();if(!modal.open)modal.showModal();}
function closeModal(){if(modal.open)modal.close();dialogType='';lastOpener?.focus?.({preventScroll:true});scheduleAI();}
function radios(key,options){return `<div class="radio-row">${options.map(([value,label])=>`<label class="radio-choice"><input type="radio" name="${key}" value="${value}" ${draft[key]===value?'checked':''}><span>${label}</span></label>`).join('')}</div>`;}
function renderModal(){const close=button('close','', 'icon-button','close',`aria-label="${t('close')}"`);let title='',body='';
 if(dialogType==='help'){title=t('helpTitle');body=`<div class="help-steps">${[1,2,3].map((i)=>`<div class="help-step"><span class="step-number">${i}</span><div><h3>${t(`step${i}`)}</h3><p>${t(`step${i}Text`)}</p></div></div>`).join('')}</div><div class="end-rule"><b>${t('endRule')}</b><p>${t('endRuleText')}</p></div>${button('got-it',t('gotIt'),'button primary wide','play')}`;}
 else if(dialogType==='levels'){title=t('levels');const map={first:'firstWins',red:'redWins',blue:'blueWins',draw:'tie','red-draw':'redDraw','blue-draw':'blueDraw'};
 body=`<p class="dialog-intro">${t('levelHelp')}</p><div class="level-grid">${levels.map((l,i)=>`<button class="level-option ${i===index?'selected':''}" data-action="level" data-index="${i}"><span class="level-number">${String(i+1).padStart(2,'0')}</span><span><b>${esc(name(l))}</b><small>${l.meta.vertices} ● · ${t(map[l.meta.type])}</small></span>${levelMedals(l.id)}</button>`).join('')}</div>`;}
 else if(dialogType==='options'){title=t('configuration');body=`<div class="option-section"><h3>${t('mode')}</h3>${radios('mode',[['solo',t('solo')],['duo',t('duo')]])}</div>${draft.mode==='solo'?`<div class="option-section"><h3>${t('side')}</h3>${radios('side',[['L',`${mark('L')}${t('red')}`],['R',`${mark('R')}${t('blue')}`]])}</div><div class="option-section"><h3>${t('difficulty')}</h3>${radios('difficulty',[['easy',t('easy')],['normal',t('normal')],['expert',t('expert')]])}<p class="option-note">${t(`${draft.difficulty}Text`)}</p></div>`:''}<div class="option-section"><h3>${t('first')}</h3>${radios('first',[['L',t('red')],['R',t('blue')],['random',t('random')]])}</div>${button('apply',t('apply'),'button primary wide','play')}`;}
 else if(dialogType==='settings'){title=t('preferences');body=`<div class="settings-list">${[['confirm','confirmText'],['motion',null],['sound',null],['fixed','fixedText']].map(([key,note])=>`<label class="toggle-label"><span><b>${t(key)}</b>${note?`<small>${t(note)}</small>`:''}</span><input type="checkbox" name="pref-${key}" role="switch" ${settings[key]?'checked':''}></label>`).join('')}</div>${speedSection()}<p class="option-note">${t('local')}</p>`;}
 else if(dialogType==='profile'){title=t('profileTitle');body=profileBody();}
 else if(dialogType==='about'){title=t('scienceTitle');body=`<div class="science-copy"><div class="science-symbol">${icon('spark')}</div><p>${t('science')}</p><p>${t('science2')}</p><p>${t('science3')}</p><blockquote><i>influence: A partizan scoring game on graphs.</i><br>Theoretical Computer Science, 878–879 (2021), 26–46.</blockquote><a class="button primary" href="https://doi.org/10.1016/j.tcs.2021.05.028" target="_blank" rel="noopener noreferrer">${t('paper')}${icon('arrow')}</a></div>`;}
 else if(dialogType==='undo'){title=t('undo');body=`<p>${t('undoConsent')}</p>${button('undo-agreed',t('undo'),'button primary wide','back')}`;}
 modal.className=`modal ${dialogType==='levels'?'large':''}`;modal.innerHTML=`<div class="modal-heading"><h2 id="modal-title">${title}</h2>${close}</div>${body}`;
}
async function act(action,el){switch(action){
 case'home':stop();screen='home';selected=null;hovered=null;save();render();break;
 case'language':settings.lang=settings.lang==='fr'?'en':'fr';render();if(dialogType)renderModal();break;
 case'mode-solo':case'mode-duo':settings.mode=action.slice(5);setSettings();render();break;
 case'play':start(index,settings);if(!read('seen-help',false)){write('seen-help',true);openModal('help');}break;
 case'resume':screen='game';config={...config,lang:settings.lang};render();scheduleAI();break;
 case'levels':case'help':case'about':case'settings':case'options':openModal(action);break;
 case'close':closeModal();break;
 case'got-it':closeModal();if(screen==='home')start(index,settings);break;
 case'apply':settings={...settings,mode:draft.mode,side:draft.side,first:draft.first,difficulty:draft.difficulty};setSettings();start(index,settings);break;
 case'level':index=Number(el.dataset.index);start(index,screen==='home'?settings:config);break;
 case'confirm':if(selected)commit(selected);break;
 case'sound':settings.sound=!settings.sound;setSettings();unlockAudio();syncSoundButton();if(settings.sound)audio.tap();break;
 case'profile':openModal('profile');break;
 case'profile-switch':profileStore=switchProfile(profileStore,el.dataset.id);saveProfiles();pendingDelete=null;afterProfileChange();break;
 case'profile-delete':if(pendingDelete===el.dataset.id){profileStore=deleteProfile(profileStore,el.dataset.id);saveProfiles();pendingDelete=null;afterProfileChange();}else{pendingDelete=el.dataset.id;renderModal();}break;
 case'profile-delete-cancel':pendingDelete=null;renderModal();break;
 case'profile-export':exportCode(el.dataset.id);break;
 case'profile-import':importCode();break;
 case'undo':if(config.mode==='duo')openModal('undo');else undo();break;
 case'undo-agreed':closeModal();undo();break;
 case'restart':case'replay':start(index,config,daily);break;
 case'next':start(index+1,config);break;
 case'switch':start(index,{...config,side:config.side==='L'?'R':'L',first:config.first==='L'?'R':config.first==='R'?'L':'random'},daily);break;
 case'zoom-in':zoom=Math.min(2,zoom+.2);drawBoard();break;
 case'zoom-out':zoom=Math.max(.8,zoom-.2);drawBoard();break;
 case'center':zoom=1;pan={x:0,y:0};drawBoard();break;
 case'daily':{const date=new Date().toISOString().slice(0,10),days=Math.floor(Date.parse(date)/86400000);start(days%levels.length,{...settings,mode:'solo',first:days%2?'R':'L'},date);break;}
 case'share':{const text=`INFLUENCE${daily?' · '+daily:''} · ${name(level())}\n${t('red')} ${state.scores.L} – ${state.scores.R} ${t('blue')}\nhttps://stephanegonzalez.eu/apps/influence/`;try{await navigator.clipboard.writeText(text);toast=t('copied');}catch{toast=t('copyFailed');}render();announce(toast);setTimeout(()=>{toast='';if(screen==='game'&&state.finished)render();},2500);break;}
 }}
document.addEventListener('click',event=>{if(animating&&event.target.closest?.('#board'))skip();const el=event.target.closest('[data-action]');if(el&&!el.disabled){act(el.dataset.action,el);return;}const node=event.target.closest('#board [data-node]');if(node)select(node.dataset.node);});
document.addEventListener('keydown',e=>{keyboardInput=true;unlockAudio();const n=e.target.closest?.('#board [data-node]');if(n&&(e.key==='Enter'||e.key===' ')){e.preventDefault();select(n.dataset.node);}if(n&&['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)){e.preventDefault();const nodes=[...document.querySelectorAll('#board [data-node][tabindex="0"]')],i=nodes.indexOf(n),delta=['ArrowRight','ArrowDown'].includes(e.key)?1:-1;nodes[(i+delta+nodes.length)%nodes.length]?.focus();}if(e.key==='Escape'&&!modal.open){selected=null;hovered=null;updatePreview();}});
document.addEventListener('pointerover',e=>{if(e.pointerType!=='mouse'||screen!=='game'||state.finished)return;const n=e.target.closest?.('#board [data-node]');if(n?.getAttribute('aria-disabled')==='false'){hovered=n.dataset.node;updatePreview();}});
document.addEventListener('pointerout',e=>{const n=e.target.closest?.('#board [data-node]');if(n&&!n.contains(e.relatedTarget)){hovered=null;if(screen==='game'&&!state.finished)updatePreview();}});
document.addEventListener('focusin',e=>{const n=e.target.closest?.('#board [data-node]');if(n&&n.getAttribute('aria-disabled')==='false'){hovered=n.dataset.node;updatePreview();}});
modal.addEventListener('change',e=>{if(e.target.name.startsWith('pref-')){const key=e.target.name.slice(5);settings[key]=e.target.type==='checkbox'?e.target.checked:e.target.value;setSettings();if(key==='sound'){syncSoundButton();if(settings.sound){audio.unlock();audio.tap();}}if(screen==='game'&&!state.finished&&!busy){if(key==='confirm')render();else drawBoard();save();}}else if(dialogType==='options'){draft[e.target.name]=e.target.value;const focusName=e.target.name,focusValue=e.target.value;renderModal();modal.querySelector(`[name="${focusName}"][value="${focusValue}"]`)?.focus();}});
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
// ---- Profiles: nickname + progression, kept on this device only. ----
function levelMedals(levelId){const w=me().levels[levelId],red=Boolean(w?.L),blue=Boolean(w?.R);
 return `<span class="level-medals"><span class="level-star ${w?'earned':''}">${w?'★':'☆'}</span><span class="medals" aria-hidden="true"><i class="medal red ${red?'on':''}"></i><i class="medal blue ${blue?'on':''}"></i></span><span class="sr-only">${w?[t('wonLevel'),red?t('wonAsRed'):'',blue?t('wonAsBlue'):''].filter(Boolean).join(' · '):''}</span></span>`;}
function speedSection(){return `<div class="option-section settings-speed"><h3>${t('speed')}</h3><div class="radio-row">${['calm','normal','fast'].map(v=>`<label class="radio-choice"><input type="radio" name="pref-speed" value="${v}" ${settings.speed===v?'checked':''}><span>${t(`speed_${v}`)}</span></label>`).join('')}</div><p class="option-note">${t('speedText')}</p></div>`;}
function profileBody(){
 const ids=levelIds(),active=profileStore.active;
 const rows=profileStore.profiles.map(p=>{const x=summary(p,ids),isActive=p.id===active,named=p.id!=='guest';
  if(!named&&!isActive&&!x.games&&!x.won)return '';
  const label=p.name||t('guest'),initial=esc([...(p.name||'?')][0]?.toUpperCase()??'?');
  const tools=!named?'':pendingDelete===p.id?`<div class="profile-tools">${button('profile-delete',t('profileDeleteConfirm'),'button danger small','close',`data-id="${p.id}"`)}${button('profile-delete-cancel',t('abort'),'text-button')}</div>`
   :`<div class="profile-tools">${button('profile-export','', 'icon-button','arrow',`data-id="${p.id}" aria-label="${t('profileExport')}: ${esc(label)}" title="${t('profileExport')}"`)}${button('profile-delete','', 'icon-button','close',`data-id="${p.id}" aria-label="${t('profileDelete')}: ${esc(label)}" title="${t('profileDelete')}"`)}</div>`;
  return `<div class="profile-row ${isActive?'active':''}" role="listitem"><button class="profile-pick" data-action="profile-switch" data-id="${p.id}" aria-pressed="${isActive}"><span class="profile-avatar" aria-hidden="true">${initial}</span><span class="profile-info"><b>${esc(label)}</b><small>${t('progressText',{n:x.won})} · ${t('progressSides',{r:x.red,b:x.blue})}</small></span>${isActive?icon('check'):''}</button>${tools}</div>`;}).join('');
 const full=profileStore.profiles.filter(p=>p.id!=='guest').length>=MAX_PROFILES;
 return `<p class="dialog-intro">${t('profileIntro')}</p><div class="profile-list" role="list">${rows}</div>${full?`<p class="option-note">${t('profileErrLimit')}</p>`:`<form class="profile-form" data-form="profile-create" novalidate><label>${t('profileName')}<input name="name" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" placeholder="${t('profileNamePlaceholder')}"></label><button class="button primary" type="submit">${t('profileCreate')}</button></form>`}<p id="profile-error" class="form-error" role="alert"></p>
 <details class="profile-transfer" ${profileNote?'open':''}><summary>${t('profileTransfer')}</summary><p>${t('profileTransferText')}</p><textarea id="profile-code" rows="3" spellcheck="false" placeholder="INF1.…" aria-label="${t('profileCodeLabel')}"></textarea><div>${button('profile-import',t('profileImport'),'button secondary small')}</div><p id="profile-transfer-msg" role="status">${esc(profileNote)}</p></details><p class="option-note">${t('profileLocal')}</p>`;}
function afterProfileChange(){if(dialogType==='profile')renderModal();if(busy)refreshChip();else render();}
async function exportCode(id){const code=exportProfile(profileStore,id),area=$('#profile-code'),msg=$('#profile-transfer-msg');if(!code||!area||!msg)return;area.value=code;$('.profile-transfer').open=true;area.select();let copied=false;try{await navigator.clipboard.writeText(code);copied=true;}catch{/* Clipboard may be blocked; the code stays selectable. */}msg.textContent=t(copied?'profileCopied':'profileCopyManual');}
function importCode(){const area=$('#profile-code'),msg=$('#profile-transfer-msg');if(!area||!msg)return;const r=importProfile(profileStore,area.value,levelIds());
 if(r.error){msg.textContent=t(r.error==='limit'?'profileErrLimit':'profileCodeInvalid');return;}
 profileStore=r.store;saveProfiles();profileNote=t('profileImported',{name:me().name});afterProfileChange();}
modal.addEventListener('submit',e=>{const form=e.target.closest?.('[data-form="profile-create"]');if(!form)return;e.preventDefault();
 const result=createProfile(profileStore,new FormData(form).get('name')),error=$('#profile-error');
 if(result.error){error.textContent=t({invalid:'profileErrInvalid',duplicate:'profileErrDuplicate',limit:'profileErrLimit'}[result.error]);return;}
 profileStore=result.store;saveProfiles();profileNote='';afterProfileChange();});

modal.addEventListener('cancel',()=>{dialogType='';setTimeout(scheduleAI,0);});
// Pan the board after zooming. Pointer capture is kept on the persistent board container.
document.addEventListener('pointerdown',e=>{keyboardInput=false;unlockAudio();const b=e.target.closest?.('#board');if(b&&zoom>1&&!e.target.closest('[data-node]')){drag={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y};b.setPointerCapture(e.pointerId);}});
document.addEventListener('pointermove',e=>{if(!drag)return;const rect=$('#board').getBoundingClientRect(),factor=600/rect.width;pan={x:Math.max(-250,Math.min(250,drag.px+(e.clientX-drag.x)*factor)),y:Math.max(-250,Math.min(250,drag.py+(e.clientY-drag.y)*factor))};drawBoard();});
document.addEventListener('pointerup',()=>{drag=null;});
document.addEventListener('pointercancel',()=>{drag=null;});
window.addEventListener('pagehide',save);
(async()=>{try{const response=await fetch(new URL('../levels/catalog.json',import.meta.url));if(!response.ok)throw Error(response.status);levels=await response.json();profileStore=loadStore(read('profiles',null),levelIds(),read('progress',[]),today());saveProfiles();restore();graph??=createGraph(levels[0]);render();}catch(error){app.innerHTML=`<p class="loading">${t('error')}</p>`;console.error(error);}})();
