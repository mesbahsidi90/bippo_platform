import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newCupGame,startCupGame,moveCup,dropCup,pauseCup,resumeCup,readCupBest,saveCupBest} from '../src/cupGame.js';
test('cup drops retain only overlap, perfect placement preserves width, misses end the round',()=>{
 let g=startCupGame();g.moving.x=92;g=dropCup(g);assert.equal(g.score,1);assert.equal(g.layers.at(-1).width,180);assert.equal(g.perfect,true);
 g.moving.x=140;g=dropCup(g);assert.equal(g.score,2);assert.equal(g.layers.at(-1).width,130);assert.equal(g.layers.at(-1).x,140);assert.equal(g.perfect,false);
 g.moving.x=14;g.moving.width=30;g=dropCup(g);assert.equal(g.phase,'over');assert.equal(g.score,2);assert.equal(dropCup(g),g);
});
test('game stays paused without time jumps, bounds movement, and supports reduced motion',()=>{
 let g=startCupGame();const moved=moveCup(g,10);assert.ok(moved.moving.x-g.moving.x<=5);g=pauseCup(g);assert.equal(moveCup(g,1),g);assert.equal(dropCup(g),g);assert.equal(resumeCup(g).phase,'playing');
 assert.equal(newCupGame().phase,'intro');assert.equal(moveCup(g,NaN),g);
 const reduced=moveCup(startCupGame(true),.05);assert.equal(reduced.moving.x,21);
 g=startCupGame();for(let i=0;i<1000;i++)g=moveCup(g,.05);assert.ok(g.moving.x>=14&&g.moving.x<=166);
});
test('personal best is local, monotonic and resilient to corrupt or unavailable storage',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 assert.equal(readCupBest(storage),0);assert.equal(saveCupBest(storage,5),5);assert.equal(saveCupBest(storage,2),5);
 values.set('bippo-cup-best-v1','bad');assert.equal(readCupBest(storage),0);assert.equal(readCupBest({getItem(){throw 0}}),0);assert.equal(saveCupBest({getItem(){throw 0},setItem(){throw 0}},4),4);
});
