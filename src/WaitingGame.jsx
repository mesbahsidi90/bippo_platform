import React,{useState,useRef,useEffect} from 'react';
import {createPortal} from 'react-dom';
import {Layers,Trophy,X,ArrowUpRight,Pause,Play,RotateCcw} from 'lucide-react';
import {t as bippoT,direction} from './i18n';
import {newCupGame,startCupGame,moveCup,dropCup,pauseCup,resumeCup,readCupBest,saveCupBest} from './cupGame';
import './waiting-game.css';

const readBest=()=>{try{return readCupBest(localStorage);}catch{return 0;}};
export default function WaitingGame(){
 const [open,setOpen]=useState(false),[best,setBest]=useState(readBest);
 return <><button type="button" className="waiting-game-card" onClick={()=>setOpen(true)}><span className="waiting-game-icon"><Layers size={25}/></span><span><b>{bippoT("طلّع قهوتك")}</b><small>{bippoT("راك تستنّى؟ جرّب تلعب.")}</small></span><span className="waiting-game-best"><Trophy size={14}/>{best}</span><ArrowUpRight size={19}/></button>{open&&<CupGameModal best={best} onBest={setBest} onClose={()=>setOpen(false)}/>}</>;
}

function CupGameModal({best,onBest,onClose}){
 const dialog=useRef(null),canvas=useRef(null),game=useRef(newCupGame()),lastFrame=useRef(null),lastDrop=useRef(0),reduced=useRef(false);
 const [view,setView]=useState({phase:'intro',score:0,perfect:false}),[canvasUnavailable,setCanvasUnavailable]=useState(false);
 function sync(next){game.current=next;setView({phase:next.phase,score:next.score,perfect:next.perfect});}
 function start(){lastFrame.current=null;lastDrop.current=0;sync(startCupGame(reduced.current));}
 function drop(){if(game.current.phase!=='playing')return;const now=performance.now();if(now-lastDrop.current<180)return;lastDrop.current=now;const next=dropCup(game.current);sync(next);if(next.score>best){let score=next.score;try{score=saveCupBest(localStorage,score);}catch{}onBest(score);}}
 function pause(){sync(pauseCup(game.current));lastFrame.current=null;}
 function resume(){lastFrame.current=null;sync(resumeCup(game.current));}
 useEffect(()=>{
  const el=dialog.current,oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
  reduced.current=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.showModal();
  const hide=()=>{if(document.visibilityState!=='visible'){game.current=pauseCup(game.current);lastFrame.current=null;setView(v=>({...v,phase:game.current.phase}));}};
  document.addEventListener('visibilitychange',hide);
  return()=>{document.removeEventListener('visibilitychange',hide);document.body.style.overflow=oldOverflow;if(el.open)el.close();};
 },[]);
 useEffect(()=>{
  const el=canvas.current,ctx=el.getContext('2d');if(!ctx){setCanvasUnavailable(true);return;}
  const ratio=Math.min(window.devicePixelRatio||1,2);el.width=360*ratio;el.height=390*ratio;ctx.scale(ratio,ratio);
  let frame=0,alive=true;
  const paint=now=>{if(!alive)return;if(document.visibilityState==='visible'){
   const dt=lastFrame.current===null?0:(now-lastFrame.current)/1000;lastFrame.current=now;game.current=moveCup(game.current,dt);drawCup(ctx,game.current);
   if(game.current.phase==='playing')frame=requestAnimationFrame(paint);
  }};
  drawCup(ctx,game.current);if(view.phase==='playing')frame=requestAnimationFrame(paint);
  return()=>{alive=false;cancelAnimationFrame(frame);lastFrame.current=null;};
 },[view.phase,view.score]);
 const playing=view.phase==='playing',paused=view.phase==='paused',over=view.phase==='over';
 return createPortal(<dialog ref={dialog} className="cup-game-dialog" dir={direction} aria-labelledby="cup-game-title" onCancel={e=>{e.preventDefault();onClose();}}><div className="cup-game-panel"><header className="cup-game-header"><span className="cup-game-brand">bippo <i/> {bippoT("وقت القهوة")}</span><button type="button" className="cup-game-close" aria-label={bippoT("إغلاق اللعبة")} onClick={onClose} autoFocus><X size={20}/></button></header><div className="cup-game-title"><span className="cup-game-kicker">{bippoT("ضغطة. طبقة. قهوة أطول.")}</span><h2 id="cup-game-title">{bippoT("طلّع قهوتك")}</h2><p>{bippoT("هبّط الطبقة فوق اللي تحتها. ركّز وطلّع أعلى كوب!")}</p></div><div className="cup-game-stats"><div><span>{bippoT("طبقاتك")}</span><strong aria-live="polite" aria-atomic="true">{view.score}</strong></div><span className="cup-game-stats-line"/><div><span><Trophy size={13}/> {bippoT("أحسن نتيجة عندك")}</span><strong>{best}</strong></div></div><div className={'cup-game-scene '+(playing?'is-playing':'')}><canvas ref={canvas} onPointerDown={e=>{if(playing){e.preventDefault();drop();}}} aria-hidden="true"/>{playing&&<div className="cup-game-perfect" aria-live="polite">{view.perfect?bippoT("في بلاصتها! ✨"):bippoT("اضغط كي تتقابل الطبقات")}</div>}{!playing&&<div className="cup-game-overlay"><div>{canvasUnavailable?<><h3>{bippoT("اللعبة غير متاحة في هذا المتصفح")}</h3><p>{bippoT("متابعة طلبك والتنبيه يبقاو يخدمو.")}</p><button className="button" onClick={onClose}>{bippoT("ارجع لطلبك")}</button></>:paused?<><Pause size={27}/><h3>{bippoT("نكمّلوا؟")}</h3><p>{bippoT("اللعبة موقوفة. كمّل كي تحب.")}</p><button className="button" onClick={resume}><Play size={17}/>{bippoT("كمّل اللعب")}</button></>:over?<><Trophy size={29}/><h3>{bippoT("يعطيك الصحة!")}</h3><p>{bippoT("طلّعت {0} طبقات. تقدر تطلّع أكثر؟",[view.score])}</p><button className="button" onClick={start}><RotateCcw size={16}/>{bippoT("عاود العب")}</button></>:<><span className="cup-game-start-badge"><Layers size={20}/></span><h3>{bippoT("قدّاه تقدر تطلّع؟")}</h3><p>{bippoT("الجزء اللي يخرج يتقصّ. إذا ما تلاقاوش الطبقات، تنتهي الجولة.")}</p><button className="button" onClick={start}><Play size={17}/>{bippoT("ابدا اللعبة")}</button></>}</div></div>}</div>{playing&&<div className="cup-game-controls"><button type="button" className="cup-game-drop" onClick={drop}>{bippoT("هبّط الطبقة")}<Layers size={18}/></button><button type="button" className="cup-game-pause" onClick={pause} aria-label={bippoT("وقّف اللعبة مؤقتًا")}><Pause size={20}/></button></div>}<p className="cup-game-order-note"><span/>{bippoT("كي يوجد طلبك، اللعبة تحبس وننبّهوك.")}</p><footer className="cup-game-footer">{bippoT("أحسن نتيجة محفوظة في هذا الجهاز فقط. بلا حساب.")}</footer></div></dialog>,document.body);
}

function drawCup(ctx,g){
 const W=360,H=390,round=(...args)=>typeof ctx.roundRect==='function'?ctx.roundRect(...args):ctx.rect(...args.slice(0,4));ctx.clearRect(0,0,W,H);
 const gradient=ctx.createLinearGradient(0,0,0,H);gradient.addColorStop(0,'#f8fbf2');gradient.addColorStop(1,'#e3eee0');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#c8daca';for(let i=0;i<6;i++)for(let j=0;j<5;j++){ctx.globalAlpha=.18;ctx.beginPath();ctx.arc(27+i*61,27+j*75,2,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 const count=g.layers.length,offset=Math.max(0,count-8)*17,base=(g.phase==='intro'||g.phase==='over'?175:315)+offset;
 ctx.fillStyle='#bdd0bd';ctx.beginPath();ctx.ellipse(181,base+30,118,17,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fffdf5';ctx.beginPath();ctx.ellipse(178,base+23,110,16,0,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='#175248';ctx.lineWidth=12;ctx.beginPath();ctx.ellipse(269,base-17,22,23,0,-Math.PI/2,Math.PI/2);ctx.stroke();
 ctx.fillStyle='#125e51';ctx.beginPath();round(87,base-47,186,67,[4,4,24,24]);ctx.fill();
 ctx.fillStyle='#d9edcf';ctx.font='bold 17px Arial';ctx.textAlign='center';ctx.fillText('bippo',180,base-5);
 const colors=[['#bb7843','#d39a60'],['#e4c99b','#f7dfb4'],['#8fb9a1','#bedfc3'],['#5b8f78','#91b69b']];
 function layer(x,y,width,index,moving=false){const c=colors[index%colors.length];ctx.save();if(moving){ctx.shadowColor='#345b3a22';ctx.shadowBlur=14;ctx.shadowOffsetY=8;}ctx.fillStyle=c[0];ctx.beginPath();round(x,y,Math.max(3,width),17,4);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.fillStyle=c[1];ctx.beginPath();ctx.ellipse(x+width/2,y+2,Math.max(1,width/2),5,0,0,Math.PI*2);ctx.fill();ctx.restore();}
 // Retain only visible geometry in the draw loop; full score remains in the model.
 for(let i=Math.max(0,count-17);i<count;i++){const l=g.layers[i];layer(l.x,base-49-i*17,l.width,i);}
 if(g.phase==='playing'||g.phase==='paused'){
  const prev=g.layers.at(-1),y=base-49-count*17-40;
  ctx.save();ctx.setLineDash([4,6]);ctx.strokeStyle='#6d9d7b66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(prev.x,y+20);ctx.lineTo(prev.x,base-49-(count-1)*17);ctx.moveTo(prev.x+prev.width,y+20);ctx.lineTo(prev.x+prev.width,base-49-(count-1)*17);ctx.stroke();ctx.restore();layer(g.moving.x,y,g.moving.width,count,true);
 }
}
