export const GAME_WIDTH=360;
export function newCupGame(reducedMotion=false){
 return {phase:'intro',score:0,layers:[{x:90,width:180}],moving:{x:18,width:180,direction:1},perfect:false,reducedMotion};
}
export function startCupGame(reducedMotion=false){return {...newCupGame(reducedMotion),phase:'playing'};}
export function moveCup(game,seconds){
 if(game.phase!=='playing'||!Number.isFinite(seconds)||seconds<=0)return game;
 const speed=game.reducedMotion?60:Math.min(210,95+game.score*6),dt=Math.min(seconds,.05),min=14,max=GAME_WIDTH-14-game.moving.width;
 let {x,direction}=game.moving;x+=direction*speed*dt;
 if(x>max){x=max-(x-max);direction=-1;}else if(x<min){x=min+(min-x);direction=1;}
 return {...game,moving:{...game.moving,x,direction}};
}
export function dropCup(game){
 if(game.phase!=='playing')return game;
 const previous=game.layers.at(-1),moving=game.moving,perfect=Math.abs(moving.x-previous.x)<=Math.min(5,previous.width/4);
 const left=perfect?previous.x:Math.max(previous.x,moving.x),right=perfect?previous.x+previous.width:Math.min(previous.x+previous.width,moving.x+moving.width);
 if(right-left<3)return {...game,phase:'over',perfect:false};
 const layer={x:left,width:right-left},score=game.score+1,direction=score%2?-1:1;
 return {...game,score,perfect,layers:[...game.layers,layer],moving:{x:direction===1?14:GAME_WIDTH-14-layer.width,width:layer.width,direction}};
}
export function pauseCup(game){return game.phase==='playing'?{...game,phase:'paused'}:game;}
export function resumeCup(game){return game.phase==='paused'?{...game,phase:'playing'}:game;}
export const BEST_KEY='bippo-cup-best-v1';
export function readCupBest(storage){try{const n=Number(storage.getItem(BEST_KEY));return Number.isInteger(n)&&n>=0&&n<=10000?n:0;}catch{return 0;}}
export function saveCupBest(storage,score){const best=Math.max(readCupBest(storage),score);try{storage.setItem(BEST_KEY,String(best));}catch{}return best;}
