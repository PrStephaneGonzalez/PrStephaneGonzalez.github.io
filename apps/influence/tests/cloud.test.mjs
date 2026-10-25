import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {accountKey,normalizeAccountName,validPin,createApi,syncProfile} from '../ui/cloud.mjs';
import * as P from '../ui/profiles.mjs';
const levels=JSON.parse(readFileSync(new URL('../levels/catalog.json',import.meta.url))),known=levels.map(l=>l.id);

// In-memory twin of the influence_* SQL functions (behaviour checked against the real database).
function fakeServer({failNext=0,racer=null}={}){
 const rows=new Map(),log=[];let fails=failNext;
 const rpc={
  influence_get:({k})=>{const r=rows.get(k);return r?{snapshot:r.payload,revision:r.revision,updated:'t'}:null;},
  influence_create:({k,p})=>{if(!/^[a-f0-9]{64}$/.test(k))throw Error('code');if(rows.has(k))return{error:'exists'};rows.set(k,{payload:p,revision:1});return{revision:1};},
  influence_put:({k,p,rev})=>{const r=rows.get(k);if(!r||r.revision!==rev)return{error:'conflict'};rows.set(k,{payload:p,revision:rev+1});return{revision:rev+1};},
  influence_delete:({k})=>rows.delete(k)?{deleted:true}:null,
 };
 const fetcher=async(url,init)=>{
  const fn=url.split('/rpc/')[1];log.push(fn);
  assert.equal(init.method,'POST');assert.ok(init.headers.apikey);
  if(fails>0){fails--;return{ok:false,status:503,json:async()=>({})};}
  if(racer&&fn==='influence_put'){racer(rows);racer=null;}
  try{return{ok:true,status:200,json:async()=>rpc[fn](JSON.parse(init.body))};}catch{return{ok:false,status:400,json:async()=>({})};}
 };
 return{rows,log,fetcher};
}
const profile=(name,levels={},games=0)=>({id:'p',name,levels,games});

test('account key: normalized name + pin, stable, hex sha-256, bad input rejected',async()=>{
 const a=await accountKey('Léa','1234'),b=await accountKey('  léa ','1234'),c=await accountKey('Léa','1235'),d=await accountKey('Zoé','1234');
 assert.match(a,/^[a-f0-9]{64}$/);assert.equal(a,b);assert.notEqual(a,c);assert.notEqual(a,d);
 assert.equal(normalizeAccountName('  Anne   Claire '),'anne claire');
 for(const pin of ['','123','1234567','12a4',null,undefined,'12 34'])await assert.rejects(accountKey('Léa',pin),/pin/);
 await assert.rejects(accountKey('a','1234'),/name/);
 assert.ok(validPin('123456')&&validPin('0000')&&!validPin(1234.5));
});

test('sync: creates, then reports same, then pulls on another device, then merges',async()=>{
 const s=fakeServer(),api=createApi({fetcher:s.fetcher,url:'https://x.test'}),key=await accountKey('Léa','1234');
 const a=profile('Léa',{[known[0]]:{L:'2026-01-02'}},2);
 let r=await syncProfile(api,a,key,known);assert.equal(r.status,'created');assert.equal(r.rev,1);
 r=await syncProfile(api,a,key,known);assert.equal(r.status,'same');assert.equal(r.rev,1);
 const b=profile('Léa',{},0);                       // second device, empty
 r=await syncProfile(api,b,key,known);assert.equal(r.status,'pulled');assert.deepEqual(r.data.levels,a.levels);assert.equal(r.data.games,2);
 const b2=profile('Léa',{[known[0]]:{L:'2026-03-03',R:'2026-03-04'},[known[1]]:{R:'2026-03-05'}},5);
 r=await syncProfile(api,b2,key,known);assert.equal(r.status,'merged');assert.equal(r.rev,2);
 assert.equal(r.data.levels[known[0]].L,'2026-01-02','earliest date wins');assert.equal(r.data.games,5);
 const stored=s.rows.get(key).payload;assert.equal(stored.v,1);assert.ok(!JSON.stringify(stored).includes('1234'),'the code is never sent');
 assert.ok(JSON.stringify(s.rows.get(key)).length<2000);
});

test('sync: a concurrent write triggers a retry, not a lost update',async()=>{
 const key=await accountKey('Léa','1234');
 const s=fakeServer({racer:rows=>{const r=rows.get(key);rows.set(key,{payload:{...r.payload,levels:{...r.payload.levels,[known[2]]:{U:'2026-05-05'}}},revision:r.revision+1});}});
 const api=createApi({fetcher:s.fetcher,url:'https://x.test'});
 await syncProfile(api,profile('Léa',{[known[0]]:{L:'2026-01-01'}}),key,known);
 const r=await syncProfile(api,profile('Léa',{[known[1]]:{R:'2026-02-02'}}),key,known);
 assert.deepEqual(Object.keys(r.data.levels).sort(),[known[0],known[1],known[2]].sort());
 assert.deepEqual(Object.keys(s.rows.get(key).payload.levels).sort(),[known[0],known[1],known[2]].sort());
});

test('sync: network or server failure becomes Error(unavailable); persistent conflict becomes Error(conflict)',async()=>{
 const key=await accountKey('Léa','1234');
 const down=createApi({fetcher:async()=>{throw Error('offline');},url:'https://x.test'});
 await assert.rejects(syncProfile(down,profile('Léa'),key,known),/unavailable/);
 const s=fakeServer({failNext:1});await assert.rejects(syncProfile(createApi({fetcher:s.fetcher,url:'https://x.test'}),profile('Léa'),key,known),/unavailable/);
 const stubborn={get:async()=>({snapshot:{levels:{[known[0]]:{L:'2026-01-01'}}},revision:1}),put:async()=>({error:'conflict'}),create:async()=>({})};
 await assert.rejects(syncProfile(stubborn,profile('Léa',{[known[1]]:{R:'2026-02-02'}}),key,known),/conflict/);
 const weird={get:async()=>({snapshot:{},revision:'x'})};await assert.rejects(syncProfile(weird,profile('Léa'),key,known),/unavailable/);
});

test('remote data is never trusted',async()=>{
 const key=await accountKey('Léa','1234');
 const hostile={get:async()=>({snapshot:{games:-3,levels:{[known[0]]:{L:'not a day',R:'2026-01-01'},evil:{L:'2026-01-01'},[known[1]]:'x'}},revision:4}),put:async()=>({revision:5}),create:async()=>({})};
 const r=await syncProfile(hostile,profile('Léa'),key,known);
 assert.deepEqual(r.data.levels,{[known[0]]:{R:'2026-01-01'}});assert.equal(r.data.games,0);
});

test('profiles: cloud link is kept, sanitized, never exported, and applied by union to the current profile',()=>{
 const key='a'.repeat(64);
 let s=P.createProfile(P.emptyStore(),'Léa',{id:'a'}).store;
 s=P.recordGame(s,known[0],'L',true,'2026-01-01');
 s=P.applyCloud(s,'a',{games:7,levels:{[known[1]]:{R:'2026-02-02'}}},{key,rev:3,at:'2026-10-25T10:00:00Z'});
 const p=P.activeProfile(s);assert.deepEqual(Object.keys(p.levels).sort(),[known[0],known[1]].sort());assert.equal(p.games,7);assert.equal(p.cloud.rev,3);
 assert.ok(!P.exportProfile(s,'a').includes(key)&&!Buffer.from(P.exportProfile(s,'a').slice(5),'base64url').toString().includes(key));
 const again=P.loadStore(JSON.parse(JSON.stringify(s)),known);assert.equal(P.activeProfile(again).cloud.key,key);
 for(const bad of [{key:'zz',rev:1},{key,rev:0},{key,rev:1.5},{key:5,rev:1},'x',null]){
  const raw=JSON.parse(JSON.stringify(s));raw.profiles.find(x=>x.id==='a').cloud=bad;assert.equal(P.activeProfile(P.loadStore(raw,known)).cloud,undefined);}
 assert.equal(P.applyCloud(s,'guest',{games:1,levels:{}},{key,rev:1}),s,'guest never gets a cloud link');
 assert.equal(P.activeProfile(P.unlinkCloud(s,'a')).cloud,undefined);
 assert.ok(P.sameData({games:1,levels:{x:{L:'2026-01-01'}}},{games:1,levels:{x:{L:'2026-01-01'}}})&&!P.sameData({games:1,levels:{}},{games:2,levels:{}}));
});
