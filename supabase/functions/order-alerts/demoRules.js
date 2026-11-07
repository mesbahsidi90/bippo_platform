// Explicit public projection: never return control credentials, client hashes,
// push endpoint addresses or device encryption keys to the guest page.
export function demoSnapshot(order,devices=[]){
 const fields=['token','number','status','expires_at','opened_at','sound_at','armed_at','acknowledged_at','scheduled_at'];
 return {...Object.fromEntries(fields.map(key=>[key,order[key]??null])),devices:devices.length,sent:devices.filter(d=>Boolean(d.sent_at)).length};
}
