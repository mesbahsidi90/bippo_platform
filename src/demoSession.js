export function validDemo(value,now=Date.now()){
 return Boolean(value?.token&&value?.control&&value?.number&&Date.parse(value.expires_at)>now);
}
export function createDemoIssuer({read,request,remember,now=Date.now}){
 let pending=null;
 return function issue(force=false){
  if(pending)return pending;
  const cached=read();if(!force&&validDemo(cached,now()))return Promise.resolve(cached);
  pending=Promise.resolve().then(request).then(value=>{if(!validDemo(value,now()))throw new Error('Invalid demo session');remember(value);return value;}).finally(()=>{pending=null;});
  return pending;
 };
}
