export function createAlertSession({audio,vibration,onChange=()=>{},onError=()=>{},acknowledged=false,schedule=setTimeout,cancel=clearTimeout}){
 let armed=false,ready=false,ringing=false,disposed=false,pending=null,sample=null;
 const emit=()=>{if(!disposed)onChange({armed,ringing,acknowledged,pending:Boolean(pending)});};
 const clearSample=()=>{if(sample!==null)cancel(sample);sample=null;};
 async function play(){
  if(disposed||acknowledged||!armed)return false;
  if(pending)return pending;
  if(ringing&&audio.isPlaying?.())return true;
  clearSample();
  let playback;try{playback=audio.play();}catch(error){armed=false;ringing=false;onError(error);emit();return false;}
  pending=(async()=>{try{
   await playback;if(disposed||acknowledged)return false;
   vibration.start();ringing=ready;
   if(!ready)sample=schedule(()=>{sample=null;if(!ready){audio.pause();vibration.stop();}},1200);
   return true;
  }catch(error){if(!disposed&&!acknowledged){armed=false;ringing=false;vibration.stop();onError(error);}return false;}
  finally{pending=null;emit();}})();emit();return pending;
 }
 return {
  arm(){armed=true;return play();},
  setReady(value){ready=value;if(ready){clearSample();if(armed&&!acknowledged){ringing=false;void play();}}},
  resume(){if(ready&&armed&&!acknowledged)void play();},
  acknowledge(){acknowledged=true;armed=false;ringing=false;clearSample();audio.pause();vibration.stop();emit();},
  dispose(){disposed=true;clearSample();audio.dispose();vibration.stop();}
 };
}
