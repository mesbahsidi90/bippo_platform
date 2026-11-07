// Legacy fields support installed workers; Safari can display the declarative
// notification even if its service worker cannot run.
export function orderPayload(order,route='track') {
 const title='طلبك راه واجد!';
 const body=`الطلب ${order.number} واجد. تقدر تجي تديه من الكونتوار.`;
 const url=`https://bippo-platform.pages.dev/#${route}/${order.token}`;
 return {type:'ORDER_READY',title,body,url,ticket:order.token,web_push:8030,
  notification:{title,body,navigate:url,lang:'ar-DZ',dir:'rtl',silent:false,
   tag:'order-'+order.token,renotify:true,requireInteraction:true,
   icon:'https://bippo-platform.pages.dev/icon-192.png',
   vibrate:[250,100,250,100,500],data:{url}}};
}
