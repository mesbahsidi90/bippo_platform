import { t as bippoT } from "./i18n.js";
import { cloud, db } from './store';
export { expired, operating } from './adminDomain';
const KEY = 'bippo-admin-demo-v1';
export const shopTypes = {
  cafe: bippoT("مقهى"),
  restaurant: bippoT("مطعم"),
  other: bippoT("نشاط آخر")
};
export const subStates = {
  trial: bippoT("تجريبي"),
  active: bippoT("نشط"),
  past_due: bippoT("متأخر"),
  cancelled: bippoT("ملغى")
};
function read() {
  const stored = localStorage.getItem(KEY);
  if (stored) return JSON.parse(stored);
  const plan = crypto.randomUUID(),
    shop = crypto.randomUUID();
  const data = {
    shops: [{
      id: shop,
      name: bippoT("مقهى الرّواق — مثال"),
      kind: 'cafe',
      city: bippoT("الجزائر"),
      status: 'active',
      created_at: new Date().toISOString(),
      order_count: 0
    }],
    plans: [{
      id: plan,
      name: bippoT("البداية"),
      monthly_price: 0,
      currency: 'DZD',
      active: true
    }],
    subscriptions: [{
      shop_id: shop,
      plan_id: plan,
      status: 'active',
      period_end: null,
      notes: ''
    }],
    memberships: [],
    audit: []
  };
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}
function write(data, entity, id) {
  data.audit.unshift({
    id: crypto.randomUUID(),
    entity,
    entity_id: id,
    action: 'SAVE',
    created_at: new Date().toISOString()
  });
  localStorage.setItem(KEY, JSON.stringify(data));
}
const check = result => {
  if (result.error) throw new Error(result.error.message);
  return result.data;
};
export async function isAdmin() {
  return !cloud || check(await db.rpc('is_platform_admin'));
}
export async function loadAdmin() {
  if (!cloud) return read();
  const results = await Promise.all([db.from('shops').select('id,name,kind,city,status,created_at').order('created_at', {
    ascending: false
  }), db.from('plans').select('*').order('created_at'), db.from('subscriptions').select('*'), db.from('memberships').select('*'), db.from('admin_audit').select('*').order('created_at', {
    ascending: false
  }).limit(100), db.from('shop_notes').select('*')]);
  const [shops, plans, subscriptions, memberships, audit, notes] = results.map(check);
  return {
    shops,
    plans,
    subscriptions: subscriptions.map(s => ({
      ...s,
      notes: notes.find(n => n.shop_id === s.shop_id)?.notes || ''
    })),
    memberships,
    audit
  };
}
export async function saveShop(form) {
  if (!form.name.trim()) throw new Error(bippoT("دخل اسم المحل"));
  if (!form.plan_id) throw new Error(bippoT("اختار خطة الاشتراك"));
  const ends = form.period_end ? new Date(form.period_end + 'T23:59:59Z').toISOString() : null;
  if (!cloud) {
    const d = read(),
      id = form.id || crypto.randomUUID();
    const shop = {
      id,
      name: form.name.trim(),
      kind: form.kind,
      city: form.city.trim(),
      status: form.status,
      created_at: d.shops.find(s => s.id === id)?.created_at || new Date().toISOString()
    };
    d.shops = [shop, ...d.shops.filter(s => s.id !== id)];
    d.subscriptions = [{
      shop_id: id,
      plan_id: form.plan_id,
      status: form.sub_status,
      period_end: ends,
      notes: form.notes
    }, ...d.subscriptions.filter(s => s.shop_id !== id)];
    write(d, 'shops', id);
    return id;
  }
  return check(await db.rpc('admin_save_shop', {
    shop: form.id || null,
    shop_name: form.name.trim(),
    shop_kind: form.kind,
    shop_city: form.city.trim(),
    shop_status: form.status,
    plan: form.plan_id,
    subscription_status: form.sub_status,
    ends_at: ends,
    internal_notes: form.notes
  }));
}
export async function savePlan(form) {
  const price = form.monthly_price === '' ? null : Number(form.monthly_price);
  if (price !== null && (!Number.isFinite(price) || price < 0)) throw new Error(bippoT("السعر لازم يكون رقم موجب أو صفر"));
  const item = {
    name: form.name.trim(),
    monthly_price: price,
    currency: form.currency,
    active: form.active
  };
  if (!cloud) {
    const d = read(),
      id = form.id || crypto.randomUUID();
    d.plans = [...d.plans.filter(p => p.id !== id), {
      ...item,
      id
    }];
    write(d, 'plans', id);
    return;
  }
  check(await (form.id ? db.from('plans').update(item).eq('id', form.id) : db.from('plans').insert(item)).select().single());
}
export async function saveMember(user_id, shop_id) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user_id.trim())) throw new Error(bippoT("دخل معرّف حساب UUID صحيح"));
  if (!cloud) {
    const d = read();
    d.memberships = [...d.memberships.filter(m => m.user_id !== user_id), {
      user_id: user_id.trim(),
      shop_id
    }];
    write(d, 'memberships', user_id);
    return;
  }
  const existing = check(await db.from('memberships').select('user_id').eq('user_id', user_id.trim()).maybeSingle());
  check(await (existing ? db.from('memberships').update({
    shop_id
  }).eq('user_id', user_id.trim()) : db.from('memberships').insert({
    user_id: user_id.trim(),
    shop_id
  })).select().single());
}
export async function removeMember(user_id) {
  if (!cloud) {
    const d = read();
    d.memberships = d.memberships.filter(m => m.user_id !== user_id);
    write(d, 'memberships', user_id);
    return;
  }
  check(await db.from('memberships').delete().eq('user_id', user_id));
}
