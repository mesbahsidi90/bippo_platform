// Legacy fields support installed workers; Safari can display the declarative
// notification even if its service worker cannot run.
export function orderPayload(order,route='track',language,settings) {
 const french=language==='fr';
 const lang=french?'fr':'ar';
 const vars={number:String(order.number),venue:settings?.name || (french?'le comptoir':'الكونتوار')};
 const copy=settings?.alert_copy;
 function field(key,fallback,limit) {
  const template=copy?.[lang+'_'+key];
  const clean=typeof template==='string'?template.replace(/[\u0000-\u001f\u007f]/g,' ').trim():'';
  return (clean||fallback).replace(/\{(number|venue)\}/g,(_,name)=>vars[name]).slice(0,limit);
 }
 const title=field('title',french?'Votre commande est prête !':'طلبك راه واجد!',100);
 const body=field('body',french?'Commande {number} · Retirez-la au comptoir.':'الطلب {number} واجد. تقدر تجي تديه من الكونتوار.',210);
 const url=`https://bippo-platform.pages.dev/${french?'?lang=fr':''}#${route}/${order.token}`;
 return {type:'ORDER_READY',title,body,url,ticket:order.token,web_push:8030,...(language?{language:lang}:{}),
  notification:{title,body,navigate:url,lang:lang+'-DZ',dir:french?'ltr':'rtl',silent:false,
   tag:'order-'+order.token,renotify:true,requireInteraction:true,
   icon:'https://bippo-platform.pages.dev/icon-192.png',
   vibrate:[250,100,250,100,500],data:{url}}};
}
