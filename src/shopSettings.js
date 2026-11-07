import {cloud,db} from './store';
const key='bippo-shop-settings';
export const defaults={name:'محلي',city:'',address:'',pickup_message:'تقدر تجي تديه من الكونتوار.',logo:''};
export async function getSettings(){
 if(!cloud)return {...defaults,...JSON.parse(localStorage.getItem(key)||'{}')};
 const {data:id,error}=await db.rpc('current_shop_id');if(error)throw error;if(!id)throw new Error('حسابك ما راهوش مربوط بمحل.');
 const [profile,shop]=await Promise.all([db.from('shop_settings').select('*').eq('shop_id',id).maybeSingle(),db.from('shops').select('name,city').eq('id',id).single()]);
 if(profile.error)throw profile.error;if(shop.error)throw shop.error;
 return {...defaults,...shop.data,...profile.data,shop_id:id};
}
export async function saveSettings(value){
 const data={name:value.name.trim(),city:value.city.trim(),address:value.address.trim(),pickup_message:value.pickup_message.trim(),logo:value.logo};
 if(!data.name||data.name.length>100)throw new Error('دخل اسم المحل، حتى 100 حرف.');
 if(!cloud){localStorage.setItem(key,JSON.stringify(data));return data;}
 const {error}=await db.from('shop_settings').upsert({...data,shop_id:value.shop_id},{onConflict:'shop_id'});if(error)throw error;return {...data,shop_id:value.shop_id};
}
export async function ticketBranding(ticket){if(!cloud)return getSettings();const {data,error}=await db.rpc('ticket_branding',{ticket});if(error)throw error;return data?.[0]||defaults;}
export async function readLogo(file){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>2*1024*1024)throw new Error('اختار PNG أو JPG أو WebP، أقل من 2 ميغا.');
 const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas');const scale=Math.min(1,320/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);const result=canvas.toDataURL('image/webp',.85);if(result.length>150000)throw new Error('الشعار كبير، جرّب صورة أبسط.');return result;}finally{bitmap.close();}
}
