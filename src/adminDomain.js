export function expired(sub,now=Date.now()){return Boolean(sub?.period_end&&new Date(sub.period_end).getTime()<=now);}
export function operating(shop,sub,now=Date.now()){return shop.status==='active'&&['trial','active'].includes(sub?.status)&&!expired(sub,now);}
