const googleHosts=new Set(['google.com','www.google.com','maps.google.com','search.google.com','g.page','maps.app.goo.gl']);
export function reviewUrl(value=''){
 const text=value.trim();if(!text)return '';
 try{const u=new URL(text);if(u.protocol!=='https:'||u.username||u.password||u.port||!googleHosts.has(u.hostname)||text.length>2048)throw 0;return u.href;}catch{throw new Error('دخل رابط تقييم Google صحيح يبدأ بـ https://، من صفحة محلك في Google.');}
}
export function guestStage(order,now=Date.now()){
 const s=order.guest||{};
 if(order.status==='collected')return {label:'تسلّم الطلب',tone:'done'};
 if(s.coming_at)return {label:'راه جاي',tone:'coming'};
 if(s.ready_seen_at)return {label:'شاف حالة «جاهز»',tone:'seen'};
 if(s.push_enabled_at)return {label:'فعّل إشعار الهاتف',tone:'enabled'};
 if(s.sound_enabled_at)return {label:'فعّل صوت الصفحة',tone:'sound'};
 if(s.opened_at)return {label:'فتح رابط الطلب',tone:'opened'};
 return {label:'ما تسجّلش فتح الرابط',tone:'waiting'};
}
export function guestActivity(guest,now=Date.now()){
 if(!guest?.last_seen_at)return '';
 const age=Math.max(0,now-Date.parse(guest.last_seen_at));
 if(!Number.isFinite(age))return '';
 return age<60000?'آخر نشاط: منذ أقل من دقيقة':age<3600000?`آخر نشاط: منذ ${Math.floor(age/60000)} د`:'آخر نشاط: '+new Date(guest.last_seen_at).toLocaleTimeString('ar-DZ',{hour:'2-digit',minute:'2-digit'});
}
