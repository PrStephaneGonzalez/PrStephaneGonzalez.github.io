import test from 'node:test';
import assert from 'node:assert/strict';
import {createAudio} from '../ui/audio.mjs';

test('audio resumes interrupted contexts before scheduling, can be muted and recreates closed contexts',async()=>{
 const original=globalThis.AudioContext;const contexts=[];
 class Context {
  constructor(){this.state='suspended';this.currentTime=5;this.destination={};this.sampleRate=44100;this.starts=[];contexts.push(this);}
  createGain(){return {gain:{value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;}};}
  createBuffer(){return {};}
  createBufferSource(){return {connect(){},start(){},disconnect(){}};}
  resume(){this.resumes=(this.resumes??0)+1;return Promise.resolve().then(()=>{this.state='running';});}
  createOscillator(){const c=this;return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){return this;},start(t){assert.equal(c.state,'running');c.starts.push(t);},stop(){}};}
 }
 globalThis.AudioContext=Context;
 try {
  let enabled=true;const a=createAudio(()=>enabled);
  a.drop(0);await new Promise(r=>setImmediate(r));assert.ok(contexts[0].starts.length>=2);
  const c=contexts[0];c.state='interrupted';a.win();await new Promise(r=>setImmediate(r));assert.equal(c.resumes,2);assert.ok(c.starts.some(t=>t>5.5));
  const n=c.starts.length;enabled=false;a.lose();await a.unlock();assert.equal(c.starts.length,n);
  enabled=true;a.lose();assert.ok(c.starts.length>n);
  c.state='closed';await a.unlock();a.draw();assert.equal(contexts.length,2);assert.ok(contexts[1].starts.length>0);
 }finally{if(original)globalThis.AudioContext=original;else delete globalThis.AudioContext;}
});

test('unavailable or rejected audio never breaks the game',async()=>{
 const original=globalThis.AudioContext;globalThis.AudioContext=class {constructor(){throw Error('unavailable');}};
 try{const a=createAudio(()=>true);assert.equal(await a.unlock(),false);assert.doesNotThrow(()=>{a.tap();a.drop(0);a.win();a.lose();a.draw();});}
 finally{if(original)globalThis.AudioContext=original;else delete globalThis.AudioContext;}
});
