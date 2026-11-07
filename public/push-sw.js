self.addEventListener('push',event=>event.waitUntil((async()=>{
 let data;try{data=event.data.json();}catch{return;}
 if(data.type!=='ORDER_READY'||!data.ticket)return;
 let url;try{url=new URL(data.url,self.location.origin);}catch{return;}
 if(url.origin!==self.location.origin||!['#track/'+data.ticket,'#demo/'+data.ticket].includes(url.hash))return;
 // Display first: client discovery failures must not suppress the alert.
 await self.registration.showNotification(data.title,{
  body:data.body,lang:'ar-DZ',dir:'rtl',icon:'/icon-192.png',badge:'/icon-192.png',
  tag:'order-'+data.ticket,renotify:true,requireInteraction:true,silent:false,
  vibrate:[250,100,250,100,500],data:{url:url.href}
 });
 try{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const c of windows){const current=new URL(c.url);if(current.origin===url.origin&&current.hash===url.hash)c.postMessage({...data,background:c.visibilityState!=='visible'});}
 }catch{/* The system notification has already been displayed. */}
})()));
self.addEventListener('notificationclick',event=>{
 event.notification.close();event.waitUntil((async()=>{
  let url;try{url=new URL(event.notification.data?.url||'/',self.location.origin);}catch{return;}
  if(url.origin!==self.location.origin)return;
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  const existing=windows.find(c=>c.url===url.href);
  if(existing)return existing.focus();return self.clients.openWindow(url.href);
 })());
});
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
