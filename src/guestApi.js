import {cloud,db,track} from './store';
import {getSettings} from './shopSettings';
const key='bippo-guest-signals';
const read=()=>JSON.parse(localStorage.getItem(key)||'{}');
export function demoSignals(){return read();}
export async function signalGuest(ticket,event){
 if(!cloud){const order=await track(ticket);if(!order)return false;
  if(['coming','ready_seen'].includes(event)&&order.status!=='ready')return false;
  if(order.status==='collected')return false;
  const map={opened:'opened_at',heartbeat:'last_seen_at',sound_enabled:'sound_enabled_at',push_enabled:'push_enabled_at',ready_seen:'ready_seen_at',coming:'coming_at'};
  if(!map[event])return false;const all=read(),s=all[order.id]||{},now=new Date().toISOString();
  s.opened_at ||=now;s[map[event]] ||=now;s.last_seen_at=now;all[order.id]=s;localStorage.setItem(key,JSON.stringify(all));window.dispatchEvent(new Event('nawba-change'));return true;
 }
 const {data,error}=await db.rpc('guest_order_signal',{ticket,event_name:event});if(error)throw error;return data;
}
export async function guestExtras(ticket){
 if(!cloud){const o=await track(ticket);if(!o)return null;const settings=await getSettings();return {coming_at:read()[o.id]?.coming_at||null,google_review_url:o.status==='collected'?settings.google_review_url:''};}
 const {data,error}=await db.rpc('guest_order_extras',{ticket});if(error)throw error;return data;
}
// One bounded guest payload; no subscription addresses, staff identity or other orders.
export async function staffSignals(ids=[]){
 if(!cloud)return read();
 const {data:shop,error:e}=await db.rpc('current_shop_id');if(e)throw e;if(!shop||!ids.length)return {};
 const {data,error}=await db.from('order_guest_signals').select('order_id,opened_at,sound_enabled_at,push_enabled_at,ready_seen_at,coming_at,last_seen_at').eq('shop_id',shop).in('order_id',ids).limit(200);
 if(error)throw error;return Object.fromEntries(data.map(s=>[s.order_id,s]));
}
