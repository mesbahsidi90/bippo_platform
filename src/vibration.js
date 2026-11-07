// Short repeating pulses, for exactly as long as foreground audio is playing.
export function createVibrationLoop(vibrate, schedule=setInterval, cancel=clearInterval) {
 let timer=null;
 const pulse=()=>{try{vibrate?.([400,150,400,150,600]);}catch{/* Audio remains available. */}};
 function stop(){if(timer!==null)cancel(timer);timer=null;try{vibrate?.(0);}catch{}}
 return {start(){stop();pulse();timer=schedule(pulse,2000);},stop};
}
