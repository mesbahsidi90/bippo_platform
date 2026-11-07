export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validEndpoint(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&['fcm.googleapis.com','push.services.mozilla.com','push.apple.com','notify.windows.com'].some(domain=>u.hostname===domain||u.hostname.endsWith('.'+domain))&&value.length<2048;}catch{return false;}}

