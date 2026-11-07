import {createClient} from 'npm:@supabase/supabase-js@2.57.4';
import webpush from 'npm:web-push@3.6.7';
import {orderPayload} from './payload.js';
import {demoTicket,sendDemo,handleDemo} from './demo.ts';
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const origins=new Set(['https://bippo-platform.pages.dev','http://127.0.0.1:5189','http://localhost:5189']);
import {uuid,validEndpoint} from './validation.js';
const cutoff=()=>new Date(Date.now()-86400000).toISOString();
function check<T>(r:{data:T,error:unknown}){if(r.error)throw new Error('Database request failed');return r.data;}
async function config(){let value=check(await db.rpc('bippo_push_config'));if(!value){const pair=webpush.generateVAPIDKeys();const bytes=crypto.getRandomValues(new Uint8Array(32));const secret=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');value=check(await db.rpc('bippo_push_config',{config:{public_key:pair.publicKey,private_key:pair.privateKey,webhook_secret:secret,subject:'https://bippo-platform.pages.dev'}}));}return value;}
async function orderFor(ticket:string){if(!uuid.test(ticket||''))return null;return check(await db.from('orders').select('id,number,status,token,shop_id,created_at').eq('token',ticket).gte('created_at',cutoff()).maybeSingle());}
async function send(order:any,cfg:any){if(order.status!=='ready'||!order.created_at||order.created_at<cutoff())return {sent:0,failed:0};const subscriptions=check(await db.from('push_subscriptions').select('*').eq('order_id',order.id).is('sent_at',null).gte('created_at',cutoff()).limit(3));let sent=0,failed=0;for(const sub of subscriptions||[]){if(!validEndpoint(sub.endpoint)){failed++;continue;}const claim=check(await db.from('push_subscriptions').update({sent_at:new Date().toISOString()}).eq('id',sub.id).is('sent_at',null).select('id'));if(!claim?.length)continue;try{await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth_key}},JSON.stringify(orderPayload(order)),{TTL:3600,urgency:'high',timeout:8000,vapidDetails:{subject:cfg.subject,publicKey:cfg.public_key,privateKey:cfg.private_key}});sent++;}catch(err:any){failed++;if(err.statusCode===404||err.statusCode===410)await db.from('push_subscriptions').delete().eq('id',sub.id);else await db.from('push_subscriptions').update({sent_at:null}).eq('id',sub.id);}}return {sent,failed};}
Deno.serve(async req=>{
 const origin=req.headers.get('origin');const cors={'Access-Control-Allow-Origin':origin&&origins.has(origin)?origin:'https://bippo-platform.pages.dev','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info,x-bippo-webhook','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
 if(origin&&!origins.has(origin))return reply({error:'Origin not allowed'},403);
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 try{
 const route=new URL(req.url).pathname.split('/').pop();
 const cfg=await config();
 if(route==='public-key'&&req.method==='GET')return reply({public_key:cfg.public_key});
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 const text=await req.text();if(text.length>8192)return reply({error:'Request too large'},413);
 let body:any;try{body=JSON.parse(text);}catch{return reply({error:'Invalid JSON'},400);}
 if(route?.startsWith('demo-'))return await handleDemo(route,body,req,db,cfg,reply);
 if(route==='subscribe'||route==='unsubscribe'){
 const demo=body.demo===true;const table=demo?'demo_push_subscriptions':'push_subscriptions';const field=demo?'ticket':'order_id';const order=demo?await demoTicket(db,body.ticket):await orderFor(body.ticket);if(!order||order.status==='collected')return reply({error:'Ticket unavailable'},404);
 const sub=body.subscription;if(!sub||!validEndpoint(sub.endpoint))return reply({error:'Invalid endpoint'},400);
 if(route==='unsubscribe'){check(await db.from(table).delete().eq(field,demo?order.token:order.id).eq('endpoint',sub.endpoint));return reply({ok:true});}
 if(!/^[A-Za-z0-9_-]{80,100}={0,2}$/.test(sub.keys?.p256dh||'')||!/^[A-Za-z0-9_-]{20,30}={0,2}$/.test(sub.keys?.auth||''))return reply({error:'Invalid subscription keys'},400);
 // Expired device addresses are operational data, not order history.
 check(await db.from('push_subscriptions').delete().lt('created_at',cutoff()));
 const existing=check(await db.from(table).select('id').eq(field,demo?order.token:order.id).eq('endpoint',sub.endpoint).maybeSingle());
 if(!existing){const {count,error}=await db.from(table).select('id',{count:'exact',head:true}).eq(field,demo?order.token:order.id);if(error)throw error;if((count||0)>=3)return reply({error:'Device limit reached'},429);if(demo)check(await db.rpc('subscribe_bippo_demo',{ticket_id:order.token,address:sub.endpoint,key_p256dh:sub.keys.p256dh,key_auth:sub.keys.auth}));else check(await db.from(table).insert({order_id:order.id,endpoint:sub.endpoint,p256dh:sub.keys.p256dh,auth_key:sub.keys.auth}));}
 if(demo)check(await db.from('demo_tickets').update({armed_at:new Date().toISOString()}).eq('token',order.token));
 const delivery=order.status==='ready'?(demo?await sendDemo(db,order,cfg):await send(order,cfg)):null;
 return reply({ok:true,delivery});
 }
 if(route==='notify'){
 if(!uuid.test(body.order_id||''))return reply({error:'Invalid order'},400);
 const internal=req.headers.get('x-bippo-webhook')===cfg.webhook_secret;
 const order=check(await db.from('orders').select('id,number,status,token,shop_id,created_at').eq('id',body.order_id).maybeSingle());if(!order)return reply({error:'Order not found'},404);
 if(!internal){const bearer=req.headers.get('authorization')?.replace(/^Bearer\s+/i,'');if(!bearer)return reply({error:'Authentication required'},401);const {data,error}=await db.auth.getUser(bearer);if(error||!data.user)return reply({error:'Authentication required'},401);const member=check(await db.from('memberships').select('shop_id').eq('user_id',data.user.id).maybeSingle());if(member?.shop_id!==order.shop_id)return reply({error:'Not authorized'},403);}
 return reply(await send(order,cfg));
 }
 return reply({error:'Not found'},404);
 }catch{return reply({error:'Alert service unavailable'},503);}
});
