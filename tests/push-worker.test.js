import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../public/push-sw.js',import.meta.url),'utf8');
test('push worker shows a background notification and opens only same-origin ticket URLs',async()=>{const handlers={},shown=[],opened=[];const self={location:{origin:'https://bippo-platform.pages.dev'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{matchAll:async()=>[],openWindow:async url=>opened.push(url),claim:async()=>{}},registration:{showNotification:async(...args)=>shown.push(args)},skipWaiting:()=>{}};vm.runInNewContext(script,{self,URL});await new Promise((resolve,reject)=>handlers.push({data:{json:()=>({type:'ORDER_READY',ticket:'ticket',title:'Ready',body:'105',url:'https://bippo-platform.pages.dev/#track/ticket'})},waitUntil:p=>p.then(resolve,reject)}));assert.equal(shown.length,1);assert.equal(shown[0][1].silent,false);await new Promise((resolve,reject)=>handlers.notificationclick({notification:{close(){},data:{url:'https://attacker.example/'}},waitUntil:p=>p.then(resolve,reject)}));assert.equal(opened.length,0);});

