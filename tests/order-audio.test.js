import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOrderAudio,handleReadyPush} from '../src/orderAudio.js';
test('a background ready push attempts the armed custom chime and refreshes without treating delivery as acknowledgement',()=>{
 let rings=0,refreshes=0;
 const dispatch=(data,armed=true)=>handleReadyPush(data,'ticket',armed,()=>rings++,()=>refreshes++);
 dispatch({type:'ORDER_READY',ticket:'ticket',background:true});assert.equal(rings,1);assert.equal(refreshes,1);
 dispatch({type:'ORDER_READY',ticket:'other',background:true});assert.equal(rings,1);assert.equal(refreshes,1);
 dispatch({type:'ORDER_READY',ticket:'ticket'},false);assert.equal(rings,1);assert.equal(refreshes,2);
});
test('gesture unlock precedes loading; pausing sample retains context for the ready alert',async()=>{
 const calls=[];let context,loads=0;
 class Context{
  constructor(){context=this;this.state='suspended';this.destination={};calls.push('create');}
  async resume(){calls.push('resume');this.state='running';}
  async decodeAudioData(){return {};}
  createGain(){return {gain:{value:0},connect(){},disconnect(){}};}
  createBufferSource(){return {connect(){},start(){calls.push('start');},stop(){calls.push('stop');},disconnect(){}};}
  async close(){calls.push('close');this.state='closed';}
 }
 const env={AudioContext:Context,navigator:{audioSession:{type:'ambient'}},fetch:async()=>{loads++;calls.push('fetch');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(2)};}};
 const player=createOrderAudio('/tone.wav',env);let pauses=0;player.addEventListener('pause',()=>pauses++);
 await player.play();assert.ok(calls.indexOf('resume')<calls.indexOf('fetch'));assert.equal(env.navigator.audioSession.type,'playback');
 player.pause();assert.equal(context.state,'running');assert.equal(pauses,1);
 await player.play();assert.equal(loads,1);assert.equal(calls.filter(x=>x==='start').length,2);
 player.dispose();assert.equal(context.state,'closed');await assert.rejects(player.play());
});
test('pausing during audio loading cancels the pending playback',async()=>{
 let release,started=false;const pending=new Promise(r=>release=r);
 class Context{state='running';destination={};async decodeAudioData(){return {};}createGain(){return {gain:{},connect(){}};}createBufferSource(){return {connect(){},start(){started=true;}};}async close(){}}
 const player=createOrderAudio('/tone.wav',{AudioContext:Context,fetch:()=>pending});
 const play=player.play();player.pause();release({ok:true,arrayBuffer:async()=>new ArrayBuffer(2)});
 await assert.rejects(play,/cancelled/);assert.equal(started,false);player.dispose();
});
