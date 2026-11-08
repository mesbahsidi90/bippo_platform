export function firstYearCost({devices,unitPrice,basePrice=0,replacements=0,maintenance=0,bippoMonthly=0,extraInternetMonthly=0}){
 const values={devices,unitPrice,basePrice,replacements,maintenance,bippoMonthly,extraInternetMonthly};
 if(Object.values(values).some(v=>v===''||v===null||!Number.isFinite(Number(v))||Number(v)<0))return null;
 const n=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,Number(v)]));
 if(!Number.isInteger(n.devices)||n.devices<1||n.devices>1000||!Number.isInteger(n.replacements)||n.replacements>1000||Object.values(n).some(v=>v>1e9))return null;
 const hardware=n.devices*n.unitPrice+n.basePrice+n.replacements*n.unitPrice+n.maintenance;
 const digital=12*(n.bippoMonthly+n.extraInternetMonthly);
 return {hardware,digital,difference:hardware-digital};
}
