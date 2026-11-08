import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewUrl,guestStage,guestActivity} from '../src/guestExperience.js';
test('Google review URL accepts official HTTPS links and rejects redirects to unrelated hosts or credential tricks',()=>{
 for(const u of ['https://g.page/r/shop/review','https://search.google.com/local/writereview?placeid=123','https://maps.app.goo.gl/example'])assert.equal(reviewUrl(u),u);
 assert.equal(reviewUrl('  '),'');
 for(const u of ['javascript:alert(1)','http://g.page/r/x','https://g.page.evil.test/a','https://google.com@evil.test/a','https://evil@google.com/a','https://google.com:444/a','https://example.com','https://maps.app.goo.gl.evil/a'])assert.throws(()=>reviewUrl(u));
});
test('guest status uses observed events, gives coming priority and does not infer notification receipt',()=>{
 const o={status:'preparing',guest:{}};assert.equal(guestStage(o).tone,'waiting');
 o.guest.opened_at='now';assert.equal(guestStage(o).tone,'opened');
 o.guest.sound_enabled_at='now';assert.equal(guestStage(o).tone,'sound');
 o.guest.push_enabled_at='now';assert.equal(guestStage(o).tone,'enabled');
 o.guest.ready_seen_at='now';assert.equal(guestStage(o).tone,'seen');
 o.guest.coming_at='now';assert.equal(guestStage(o).tone,'coming');
 o.status='collected';assert.equal(guestStage(o).tone,'done');
});
test('last activity remains a timestamp, not a false live connection claim',()=>{
 assert.equal(guestActivity({}), '');assert.equal(guestActivity({last_seen_at:'bad'}),'');
 assert.match(guestActivity({last_seen_at:'2026-11-08T10:00:00Z'},Date.parse('2026-11-08T10:02:00Z')),/2 د/);
});
