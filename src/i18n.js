import fr from './fr.json' with {type:'json'};
export const normalizeText=text=>String(text).replace(/\s+/g,' ').trim();
export function resolveLanguage(search='',saved='ar'){
 const requested=new URLSearchParams(search).get('lang');
 return requested==='fr'||requested==='ar'?requested:saved==='fr'?'fr':'ar';
}
let saved='ar';try{saved=globalThis.localStorage?.getItem('bippo-language')||'ar';}catch{}
export const language=resolveLanguage(globalThis.location?.search||'',saved);
export const locale=language==='fr'?'fr-DZ':'ar-DZ';
export const direction=language==='fr'?'ltr':'rtl';
export function translate(text,lang=language,values=[]){
 const original=String(text),key=normalizeText(original);
 const translated=lang==='fr'?(fr[key]||key):key;
 const prefix=original.match(/^\s*/)?.[0]||'',suffix=original.match(/\s*$/)?.[0]||'';
 return prefix+translated.replace(/\{(\d+)\}/g,(match,index)=>values[index]===undefined?match:String(values[index]))+suffix;
}
export const t=(text,values=[])=>translate(text,language,values);
export function ticketLink(path){return `${location.origin}${location.pathname}?lang=${language}#${path}`;}
export function switchLanguage(next){
 if(!['ar','fr'].includes(next)||next===language)return;
 try{localStorage.setItem('bippo-language',next);}catch{}
 const url=new URL(location.href);url.searchParams.set('lang',next);location.assign(url.href);
}
if(typeof document!=='undefined'){
 document.documentElement.lang=language;document.documentElement.dir=direction;
 document.title=language==='fr'?'bippo — Votre commande, au bon moment':'bippo — طلبك، على وقته';
 try{localStorage.setItem('bippo-language',language);}catch{}
}

export function pickupText(value){return normalizeText(value||'')==='تقدر تجي تديه من الكونتوار.'?t('تقدر تجي تديه من الكونتوار.'):value;}
