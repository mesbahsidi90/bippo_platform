import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolveLanguage,translate,normalizeText} from '../src/i18n.js';
import {validDemo,createDemoIssuer} from '../src/demoSession.js';
test('language choice persists with an explicit supported URL choice taking priority',()=>{
 assert.equal(resolveLanguage('?lang=fr','ar'),'fr');assert.equal(resolveLanguage('?lang=ar','fr'),'ar');assert.equal(resolveLanguage('?lang=de','fr'),'fr');assert.equal(resolveLanguage('','xx'),'ar');
});
test('French translations preserve whitespace and interpolate values without translating user content',()=>{
 assert.equal(translate(' جاهز ','fr'),' Prête ');assert.equal(translate('الطلب {0} راه واجد.','fr',['0057']),'La commande 0057 est prête.');assert.equal(translate('اسم محلي الخاص','fr'),'اسم محلي الخاص');
 assert.equal(translate('راني جاي 🏃','fr'),'J’arrive 🏃');assert.equal(translate('جاهز','ar'),'جاهز');
});
test('cached valid QR session survives reloads and concurrent creation makes one request',async()=>{
 let cached=null,requests=0;const now=1000,session={token:'ticket',control:'private',number:'57',expires_at:new Date(now+10000).toISOString()};
 const issue=createDemoIssuer({read:()=>cached,remember:v=>cached=v,request:async()=>{requests++;return session;},now:()=>now});
 const [a,b]=await Promise.all([issue(),issue()]);assert.equal(requests,1);assert.equal(a,b);assert.equal(await issue(),session);assert.equal(requests,1);await issue(true);assert.equal(requests,2);assert.equal(validDemo(session,now+20000),false);
});
test('failed automatic demo request can be retried without caching an invalid session',async()=>{
 let requests=0,cached=null;const issue=createDemoIssuer({read:()=>cached,remember:v=>cached=v,request:async()=>{requests++;throw new Error('offline');}});
 await assert.rejects(issue());await assert.rejects(issue());assert.equal(requests,2);assert.equal(cached,null);
});
test('every static translated string has a French entry, including template messages',()=>{
 const fr=JSON.parse(readFileSync(new URL('../src/fr.json',import.meta.url),'utf8'));
 for(const [ar,french] of Object.entries(fr)){assert.ok(french.trim(),ar);assert.ok(!/[\u0621-\u064a]/.test(french),ar);const slots=s=>[...s.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort();assert.deepEqual(slots(ar),slots(french),ar);}
});

test('all source translation calls have a French dictionary entry',()=>{
 const root=new URL('../src/',import.meta.url),fr=JSON.parse(readFileSync(new URL('fr.json',root),'utf8'));
 for(const file of readdirSync(root).filter(f=>/\.(js|jsx)$/.test(f))){const source=readFileSync(new URL(file,root),'utf8');for(const match of source.matchAll(/bippoT\("((?:[^"\\]|\\.)*)"/g)){const text=JSON.parse('"'+match[1]+'"');assert.ok(fr[normalizeText(text)],file+': '+text);}}
});
