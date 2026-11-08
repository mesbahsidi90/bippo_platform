import { t as bippoT } from "./i18n.js";
import { cloud } from './store';
import { demoSnapshot } from '../supabase/functions/order-alerts/demoRules.js';
const base = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export async function demoRequest(action, body = {}) {
  if (!cloud) {
    const rows = JSON.parse(localStorage.getItem('bippo-landing-demos') || '{}');
    if (action === 'create') {
      const token = crypto.randomUUID(),
        control = crypto.randomUUID(),
        value = {
          token,
          control,
          number: String(10 + Math.floor(Math.random() * 90)),
          status: 'preparing',
          expires_at: new Date(Date.now() + 15 * 60000).toISOString()
        };
      rows[token] = value;
      localStorage.setItem('bippo-landing-demos', JSON.stringify(rows));
      return value;
    }
    const row = rows[body.ticket];
    if (!row || Date.parse(row.expires_at) < Date.now()) throw new Error(bippoT("انتهت التجربة. أبدا تجربة جديدة."));
    if (row.scheduled_at && Date.parse(row.scheduled_at) <= Date.now()) row.status = 'ready';
    if (action === 'ring') {
      if (row.control !== body.control) throw new Error(bippoT("غير مسموح"));
      if (row.status === 'ready' || row.scheduled_at) throw new Error(bippoT("أبدا تجربة جديدة"));
      if (body.delay === 10) row.scheduled_at = new Date(Date.now() + 10000).toISOString();else row.status = 'ready';
    }
    if (action === 'progress') {
      const field = {
        opened: 'opened_at',
        sound: 'sound_at',
        ack: 'acknowledged_at'
      }[body.stage];
      if (field) row[field] = new Date().toISOString();
    }
    localStorage.setItem('bippo-landing-demos', JSON.stringify(rows));
    return demoSnapshot(row);
  }
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(`${base}/functions/v1/order-alerts/demo-${action}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        apikey: key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(bippoT(data.error || "تعذر إتمام التجربة"));
    return data;
  } catch(error){
    if(error.name==='AbortError'||error instanceof TypeError)throw new Error(bippoT("تعذر الاتصال. عاود جرّب."));
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
