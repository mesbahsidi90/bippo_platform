import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVibrationLoop} from '../src/vibration.js';
test('vibration repeats for the audio session, restarting does not duplicate timers and stopping cancels it',()=>{
 const calls=[],timers=new Map();let id=0;
 const loop=createVibrationLoop(p=>calls.push(p),(fn,ms)=>{assert.equal(ms,2000);timers.set(++id,fn);return id;},key=>timers.delete(key));
 loop.start();assert.equal(timers.size,1);assert.deepEqual(calls.at(-1),[400,150,400,150,600]);
 for(let i=0;i<5;i++)for(const fn of timers.values())fn();
 assert.equal(calls.filter(Array.isArray).length,6);
 loop.start();assert.equal(timers.size,1);
 loop.stop();assert.equal(timers.size,0);assert.equal(calls.at(-1),0);
 loop.stop();assert.equal(timers.size,0);
});
test('unsupported or failing vibration does not interrupt audio controls',()=>{
 const loop=createVibrationLoop(()=>{throw new Error('unsupported')},()=>1,()=>{});
 assert.doesNotThrow(()=>{loop.start();loop.stop()});
});
