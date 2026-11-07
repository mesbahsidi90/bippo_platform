import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {orderPayload} from '../supabase/functions/order-alerts/payload.js';
const script=fs.readFileSync(new URL('../public/push-sw.js',import.meta.url),'utf8');
const ticket='05c861ea-27da-4885-a3b8-018d6ca69e24';
function worker(matchAll){const handlers={},shown=[];const self={location:{origin:'https://bippo-platform.pages.dev'},addEventListener:(name,fn)=>handlers[name]=fn,clients:{matchAll,claim:async()=>{}},registration:{showNotification:async(...a)=>shown.push(a)},skipWaiting(){}};vm.runInNewContext(script,{self,URL});return {shown,dispatch:data=>new Promise((resolve,reject)=>handlers.push({data:{json:()=>data},waitUntil:p=>p.then(resolve,reject)}))};}
test('declarative payload has an audible fallback and retains compatibility with installed workers',()=>{const p=orderPayload({token:ticket,number:'57'});assert.equal(p.web_push,8030);assert.equal(p.notification.navigate,p.url);assert.equal(p.notification.silent,false);assert.equal(p.notification.title,p.title);assert.equal(p.notification.body,p.body);assert.equal(p.notification.data.url,p.url);});
test('push is audible even when the order page is visible and foreground audio is not enabled',async()=>{const messages=[];const p=orderPayload({token:ticket,number:'57'});const w=worker(async()=>[{url:p.url,visibilityState:'visible',postMessage:m=>messages.push(m)}]);await w.dispatch(p);assert.equal(w.shown.length,1);assert.equal(w.shown[0][1].silent,false);assert.equal(w.shown[0][1].renotify,true);assert.equal(messages.length,1);});
test('notification does not depend on successful window discovery; cross-origin URLs are rejected',async()=>{const w=worker(async()=>{throw new Error('No active browser windows')});const p=orderPayload({token:ticket,number:'57'});await w.dispatch(p);assert.equal(w.shown.length,1);await w.dispatch({...p,url:'https://attacker.example/#track/'+ticket});await w.dispatch({...p,url:'https://bippo-platform.pages.dev/#track/other'});assert.equal(w.shown.length,1);});
