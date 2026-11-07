import { createClient } from '@supabase/supabase-js';
import { normalizeNumber, validTransition, active } from './domain';
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const cloud = Boolean(url && key);
export const authLinkError = new URLSearchParams(location.hash.slice(1)).get('error_description');
export const db = cloud ? createClient(url, key) : null;
const STORAGE = 'nawba-demo-v1';
const seed = [101,102,103].map((number,i)=>({id:crypto.randomUUID(),token:crypto.randomUUID(),number:String(number),status:i===0?'ready':'preparing',created_at:new Date().toISOString()}));
const read = () => { const raw=localStorage.getItem(STORAGE); if(!raw){localStorage.setItem(STORAGE,JSON.stringify(seed));return seed;} return JSON.parse(raw); };
const save = orders => {localStorage.setItem(STORAGE,JSON.stringify(orders));window.dispatchEvent(new Event('nawba-change'));};
export async function listOrders(){if(!cloud)return read(); const {data:shop,error:shopError}=await db.rpc('current_shop_id');if(shopError)throw shopError;if(!shop)return [];const {data,error}=await db.from('orders').select('*').eq('shop_id',shop).order('created_at',{ascending:false}).limit(200);if(error)throw error;return data;}
export async function createOrder(value){const number=normalizeNumber(value);if(!cloud){const rows=read();if(rows.some(o=>o.number===number&&active(o)))throw new Error('يوجد طلب نشط بهذا الرقم');const o={id:crypto.randomUUID(),token:crypto.randomUUID(),number,status:'preparing',created_at:new Date().toISOString()};save([o,...rows]);return o;}const {data,error}=await db.from('orders').insert({number}).select().single();if(error)throw new Error(error.code==='23505'?'يوجد طلب نشط بهذا الرقم':error.message);return data;}
export async function transition(order,status){if(!validTransition(order.status,status))throw new Error('تغيير الحالة غير مسموح');if(!cloud){save(read().map(o=>{if(o.id!==order.id)return o;if(!validTransition(o.status,status))throw new Error('تغيرت حالة الطلب، حدّث الصفحة');return {...o,status,...(status==='ready'?{ready_at:new Date().toISOString()}:{collected_at:new Date().toISOString()})};}));return;}const {data,error}=await db.from('orders').update({status}).eq('id',order.id).eq('status',order.status).select();if(error)throw error;if(!data.length)throw new Error('تغيرت حالة الطلب، حدّث الصفحة');}
export async function track(token){if(!cloud)return read().find(o=>o.token===token)||null;const {data,error}=await db.rpc('track_order',{ticket:token});if(error)throw error;return data?.[0]||null;}
export async function display(token){if(!cloud)return read().filter(active).map(({number,status})=>({number,status}));const {data,error}=await db.rpc('display_orders',{ticket:token});if(error)throw error;return data;}
export function subscribe(fn){window.addEventListener('storage',fn);window.addEventListener('nawba-change',fn);const timer=setInterval(fn,2000);const channel=db?.channel('staff-orders').on('postgres_changes',{event:'*',schema:'public',table:'orders'},fn).subscribe();return()=>{clearInterval(timer);window.removeEventListener('storage',fn);window.removeEventListener('nawba-change',fn);if(channel)db.removeChannel(channel);};}
// Future POS and notification adapters belong here, outside the UI.
export const integrations = { pos: null, payments: null, notifications: null };

