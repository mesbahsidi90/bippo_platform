import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoSnapshot} from '../supabase/functions/order-alerts/demoRules.js';
import {orderPayload} from '../supabase/functions/order-alerts/payload.js';
test('guest demo snapshot excludes control keys and device addresses while exposing setup and acknowledgement',()=>{
 const view=demoSnapshot({token:'ticket',number:'42',status:'ready',sound_at:'now',control:'secret',control_hash:'hash',source_hash:'private'},[{endpoint:'private-address',auth_key:'secret-key',sent_at:'now'}]);
 assert.equal(view.sound_at,'now');assert.equal(view.devices,1);assert.equal(view.sent,1);
 for(const secret of ['secret','private-address','secret-key','control_hash','source_hash'])assert.equal(JSON.stringify(view).includes(secret),false);
});
test('demo notification opens the demo customer route without changing restaurant ticket routes',()=>{
 const order={token:'token',number:'42'};
 assert.equal(orderPayload(order,'demo').notification.navigate,'https://bippo-platform.pages.dev/#demo/token');
 assert.equal(orderPayload(order).notification.navigate,'https://bippo-platform.pages.dev/#track/token');
});
