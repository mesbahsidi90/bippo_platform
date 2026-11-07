import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAlertSession} from '../src/alertSession.js';
function fixture(){let playing=false,plays=0,pauses=0;const timers=new Map();let next=0;
 const session=createAlertSession({audio:{async play(){playing=true;plays++;},pause(){playing=false;pauses++;},isPlaying:()=>playing,dispose(){playing=false;}},vibration:{start(){},stop(){}},schedule:(fn,ms)=>{timers.set(++next,{fn,ms});return next;},cancel:id=>timers.delete(id)});
 return {session,timers,interrupt:()=>playing=false,get plays(){return plays;},get pauses(){return pauses;}};
}
test('ready ringing has no automatic timeout and returning to the page does not acknowledge or stop it',async()=>{
 const f=fixture();f.session.setReady(true);await f.session.arm();assert.equal(f.timers.size,0);assert.equal(f.plays,1);
 f.session.resume();await Promise.resolve();assert.equal(f.plays,1);assert.equal(f.pauses,0);
 f.interrupt();f.session.resume();await Promise.resolve();await Promise.resolve();assert.equal(f.plays,2);assert.equal(f.pauses,0);
 f.session.acknowledge();assert.equal(f.pauses,1);f.session.resume();assert.equal(f.plays,2);
});
test('only the waiting-state sample has a timeout; ready cancels it before continuing the ring',async()=>{
 const f=fixture();await f.session.arm();assert.equal(f.timers.size,1);assert.equal([...f.timers.values()][0].ms,1200);
 f.session.setReady(true);await Promise.resolve();await Promise.resolve();assert.equal(f.timers.size,0);assert.equal(f.pauses,0);
 f.session.dispose();assert.equal(f.timers.size,0);
});
test('a rejected synchronous playback attempt can be retried instead of leaving the session pending',async()=>{
 let tries=0;const session=createAlertSession({audio:{play(){if(++tries===1)throw new Error('blocked');return Promise.resolve();},isPlaying:()=>false,dispose(){},pause(){}},vibration:{start(){},stop(){}}});
 session.setReady(true);assert.equal(await session.arm(),false);assert.equal(await session.arm(),true);assert.equal(tries,2);session.dispose();
});
