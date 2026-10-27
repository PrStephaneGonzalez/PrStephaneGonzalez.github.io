import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGraph,popcount} from '../engine/graph.mjs';
import {createGame,previewMove,playMove} from '../engine/game.mjs';
import {captureWaves,cascadeSchedule} from '../ui/cascade.mjs';
import * as P from '../ui/profiles.mjs';
const levels=JSON.parse(readFileSync(new URL('../levels/catalog.json',import.meta.url)));
const known=levels.map(l=>l.id),day='2026-10-25';

test('cascade: waves cover exactly the captured set, chosen piece first, for every move of every board',()=>{
 let checked=0;
 for(const l of levels){const g=createGraph(l);
  for(const first of ['L','R']){const s=createGame(g,first);
   for(const v of g.vertices){
    let mask;try{mask=previewMove(g,s,v.id);}catch{continue;}
    if(!mask)continue;
    const waves=captureWaves(g,s.remaining,s.turn,v.id,mask);
    const flat=waves.flat();
    assert.equal(new Set(flat).size,flat.length,'no id twice');
    assert.equal(flat.length,popcount(mask));
    assert.equal(waves[0][0],v.id);checked++;
   }}}
 assert.ok(checked>20);
});

test('cascade schedule: ordered, capped, one entry per piece',()=>{
 const waves=[['a'],['b','c','d'],['e'],['f'],['g'],['h'],['i'],['j'],['k'],['l'],['m']];
 const {items,duration}=cascadeSchedule(waves);
 assert.equal(items.length,13);assert.deepEqual(items.map(i=>i.order),[...items.keys()]);
 assert.equal(items[0].delay,0);assert.ok(duration<=950+460+1);
 for(let i=1;i<items.length;i++)assert.ok(items[i].delay>=items[i-1].delay);
 assert.deepEqual(cascadeSchedule([]).items,[]);
});

test('profiles: names are sanitized and bounded',()=>{
 assert.equal(P.sanitizeName('  Léa   M  '),'Léa M');
 assert.equal(P.sanitizeName('a'),null);assert.equal(P.sanitizeName('x'.repeat(17)),null);
 assert.equal(P.sanitizeName('<b>ok</b>'),'bok/b');assert.equal(P.sanitizeName(42),null);
});

test('profiles: legacy progress migrates, corrupt data never throws',()=>{
 const s=P.loadStore(null,known,[known[0],'nope'],day);
 assert.deepEqual(s.profiles[0].levels,{[known[0]]:{U:day}});
 for(const junk of ['x',42,[],{version:1},{version:1,profiles:'no'},{version:1,profiles:[null,{id:'../x',name:'Zed'},{id:'p1',name:'<'}],active:'zzz'}]){
  const t=P.loadStore(junk,known,[],day);assert.equal(t.active,'guest');assert.equal(t.profiles[0].id,'guest');assert.equal(t.profiles.length,1);
 }
});

test('profiles: create adopts guest progress once, rejects duplicates and over-limit',()=>{
 let s=P.recordGame(P.emptyStore(),known[0],'L',true,day);
 let r=P.createProfile(s,'Ada',{id:'a'});assert.ok(r.store);s=r.store;
 assert.equal(P.activeProfile(s).name,'Ada');assert.ok(P.isWon(P.activeProfile(s),known[0]));
 assert.equal(s.profiles.find(p=>p.id==='guest').games,0);
 assert.equal(P.createProfile(s,'ada').error,'duplicate');assert.equal(P.createProfile(s,'A').error,'invalid');
 for(let i=0;i<P.MAX_PROFILES-1;i++)s=P.createProfile(s,'Joueur'+i,{id:'j'+i}).store;
 assert.equal(P.createProfile(s,'Trop').error,'limit');
 const second=P.createProfile(s=P.deleteProfile(s,'j0'),'Bob',{id:'b'}).store;
 assert.equal(P.activeProfile(second).games,0,'only the first named profile adopts guest progress');
});

test('profiles: recordGame keeps first win date per side, counts games, ignores duo/unknown side',()=>{
 let s=P.createProfile(P.emptyStore(),'Ada',{id:'a'}).store;
 s=P.recordGame(s,known[0],'L',true,'2026-01-01');s=P.recordGame(s,known[0],'L',true,'2026-02-02');s=P.recordGame(s,known[0],'R',false,'2026-02-02');
 const p=P.activeProfile(s);assert.equal(p.levels[known[0]].L,'2026-01-01');assert.equal(p.levels[known[0]].R,undefined);assert.equal(p.games,3);
 assert.equal(P.recordGame(s,known[0],'U',true,day),s);assert.equal(P.recordGame(s,known[0],'X',true,day),s);
 assert.deepEqual(P.summary(p,known),{won:1,red:1,blue:0,stars:1,games:3});
});

test('profiles: switch, delete (guest is permanent, active falls back to guest)',()=>{
 let s=P.createProfile(P.emptyStore(),'Ada',{id:'a'}).store;
 assert.equal(P.deleteProfile(s,'guest'),s);assert.equal(P.switchProfile(s,'nobody'),s);
 s=P.deleteProfile(s,'a');assert.equal(s.active,'guest');assert.equal(s.profiles.length,1);
});

test('profiles: export/import round-trips, merges by union, rejects hostile codes',()=>{
 let a=P.createProfile(P.emptyStore(),'Zoé ✨',{id:'a'}).store;
 a=P.recordGame(a,known[0],'L',true,'2026-01-01');a=P.recordGame(a,known[1],'R',true,'2026-01-02');
 const code=P.exportProfile(a,'a');assert.match(code,/^INF1\.[\w-]+$/);
 const fresh=P.importProfile(P.emptyStore(),code,known,{id:'z'});
 assert.deepEqual(P.activeProfile(fresh.store).levels,P.activeProfile(a).levels);assert.equal(P.activeProfile(fresh.store).name,'Zoé ✨');
 let b=P.createProfile(P.emptyStore(),'zoé ✨',{id:'b'}).store;b=P.recordGame(b,known[0],'L',true,'2026-05-05');b=P.recordGame(b,known[2],'L',true,'2026-05-06');
 const merged=P.importProfile(b,code,known).store,m=P.activeProfile(merged);
 assert.equal(merged.profiles.filter(p=>p.id!=='guest').length,1);
 assert.equal(m.levels[known[0]].L,'2026-05-05','existing win date wins');assert.ok(m.levels[known[1]].R&&m.levels[known[2]].L);
 const b64=o=>'INF1.'+Buffer.from(JSON.stringify(o)).toString('base64url');
 for(const bad of [null,'','hello','INF1.','INF1.@@@','INF1.'+'A'.repeat(30000),b64({v:2,name:'Ok'}),b64({v:1,name:'<'}),b64('x')])assert.equal(P.importProfile(P.emptyStore(),bad,known).error,'invalid');
 const sneaky=P.importProfile(P.emptyStore(),b64({v:1,name:'Eve',games:-5,levels:{[known[0]]:{L:'not a day',R:'2026-01-01',__proto__:{x:1}},evil:{L:day}}}),known).store;
 assert.deepEqual(P.activeProfile(sneaky).levels,{[known[0]]:{R:'2026-01-01'}});assert.equal(P.activeProfile(sneaky).games,0);
});
