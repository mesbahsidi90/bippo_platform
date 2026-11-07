import webpush from 'npm:web-push@3.6.7';
import {uuid,validEndpoint} from './validation.js';
import {demoSnapshot} from './demoRules.js';
import {orderPayload} from './payload.js';
const take=(r:any)=>{if(r.error)throw r.error;return r.data;};
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export async function demoTicket(db:any,ticket:string){if(!uuid.test(ticket||''))return null;return take(await db.from('demo_tickets').select('*').eq('token',ticket).gt('expires_at',new Date().toISOString()).maybeSingle());}
export async function sendDemo(db:any,order:any,cfg:any){
 if(order.status!=='ready'||order.acknowledged_at)return {sent:0,failed:0};
 const rows=take(await db.from('demo_push_subscriptions').select('*').eq('ticket',order.token).is('sent_at',null).limit(3));let sent=0,failed=0;
 for(const sub of rows){if(!validEndpoint(sub.endpoint)){failed++;continue;}
  const claim=take(await db.from('demo_push_subscriptions').update({sent_at:new Date().toISOString()}).eq('id',sub.id).is('sent_at',null).select('id'));if(!claim.length)continue;
  try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},JSON.stringify(orderPayload(order,'demo')),{TTL:120,urgency:'high',timeout:8000,vapidDetails:{subject:cfg.subject,publicKey:cfg.public_key,privateKey:cfg.private_key}});sent++;}
  catch(err:any){failed++;if([404,410].includes(err.statusCode))await db.from('demo_push_subscriptions').delete().eq('id',sub.id);else await db.from('demo_push_subscriptions').update({sent_at:null}).eq('id',sub.id);}
 }return {sent,failed};
}
export async function handleDemo(route:string,body:any,req:Request,db:any,cfg:any,reply:any){
 if(route==='demo-create'){
  const control=crypto.randomUUID()+crypto.randomUUID();
  const source=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'shared';
  const {data,error}=await db.rpc('issue_bippo_demo',{secret_hash:await hash(control),client_hash:await hash(cfg.webhook_secret+source)});
  if(error)return reply({error:error.code==='P0001'?'جربت بزاف. عاود بعد شوية.':'تعذر بدء التجربة'},error.code==='P0001'?429:503);
  return reply({...data,control});
 }
 const order=await demoTicket(db,body.ticket);if(!order)return reply({error:'انتهت التجربة. أبدا تجربة جديدة.'},404);
 if(route==='demo-track'){
  const devices=take(await db.from('demo_push_subscriptions').select('sent_at').eq('ticket',order.token));
  return reply(demoSnapshot(order,devices));
 }
 if(route==='demo-progress'){
  if(!['opened','sound','ack'].includes(body.stage))return reply({error:'Invalid stage'},400);
  if(body.stage==='ack'&&order.status!=='ready')return reply({error:'Order is not ready'},409);
  const fields:Record<string,string>={opened:'opened_at',sound:'sound_at',ack:'acknowledged_at'};const key=fields[body.stage];
  take(await db.from('demo_tickets').update({[key]:new Date().toISOString()}).eq('token',order.token));return reply({ok:true});
 }
 if(route==='demo-ring'){
  if(typeof body.control!=='string'||body.control.length>100)return reply({error:'Control required'},403);
  const secret=await hash(body.control);if(secret!==order.control_hash)return reply({error:'Not authorized'},403);
  const delay=body.delay===10?10:0;
  const changed=take(await db.rpc('ring_bippo_demo',{ticket_id:order.token,secret_hash:secret,delay_seconds:delay}));
  if(!changed)return reply({error:'هاذ التجربة راهي رنّت أو مبرمجة. أبدا وحدة جديدة.'},409);
  const current=await demoTicket(db,order.token);return reply({ok:true,delivery:delay===0?await sendDemo(db,current,cfg):null});
 }
 if(route==='demo-notify'){
  if(req.headers.get('x-bippo-webhook')!==cfg.webhook_secret)return reply({error:'Not authorized'},401);
  return reply(await sendDemo(db,order,cfg));
 }
 return reply({error:'Not found'},404);
}
