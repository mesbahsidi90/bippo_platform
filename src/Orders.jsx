import { t as bippoT, locale as bippoLocale } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Clock, Check, CheckCheck, ChefHat, ScanLine, BarChart3, List, History } from 'lucide-react';
import { cloud, db, listOrders, createOrder, transition, subscribe } from './store';
import { statuses } from './domain';
import DotNumber from './DotNumber';
import Reports from './Reports';
import ShopSettings from './ShopSettings.jsx';
import { getSettings } from './shopSettings';
import { shopActivity } from './shopActivities';
import { duration, secondsBetween } from './reporting';
import { retryPush } from './OrderAlerts';
import { staffSignals } from './guestApi';
import GuestStatus from './GuestStatus';
import './guest-experience.css';
export default function Orders({
  Share
}) {
  const [orders, setOrders] = useState(null),
    [error, setError] = useState(''),
    [number, setNumber] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(null),
    [filter, setFilter] = useState('all'),
    [tab, setTab] = useState('orders'),
    [pushFailed, setPushFailed] = useState(null),
    [signalsUnavailable, setSignalsUnavailable] = useState(false),
    [activity, setActivity] = useState(() => shopActivity('cafe'));
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const rows = await listOrders();
        let signals = {};
        let unavailable = false;
        try {
          signals = await staffSignals(rows.map(o => o.id));
        } catch {
          unavailable = true;
        }
        if (alive) {
          setOrders(rows.map(o => ({
            ...o,
            guest: signals[o.id] || null
          })));
          setSignalsUnavailable(unavailable);
          setError('');
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    }
    getSettings().then(shop => {
      if (alive) setActivity(shopActivity(shop.kind));
    }).catch(() => {});
    load();
    const stop = subscribe(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  async function mark(o, status) {
    setBusy(true);
    try {
      await transition(o, status);
      setNotice(status === 'collected' ? bippoT("الطلب {0} تسلّم وبقى محفوظ في السجل.", [o.number]) : bippoT("الطلب {0} راه واجد.", [o.number]));
      if (status === 'ready' && cloud) {
        try {
          const result = await retryPush(o.id);
          if (result.failed) {
            setPushFailed(o);
            setNotice(bippoT("الطلب راه واجد. تعذر إرسال إشعار لبعض الأجهزة؛ تقدر تعاود."));
          }
        } catch {
          setPushFailed(o);
          setNotice(bippoT("الطلب راه واجد وحالتو محفوظة. إشعار الخلفية غير متاح حاليًا؛ الرنة في الصفحة المفتوحة تبقى متاحة."));
        }
      }
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const rows = orders || [],
    visible = rows.filter(o => filter === 'all' || (filter === 'active' ? o.status !== 'collected' : o.status === filter));
  return <main className="wrap dashboard"><div className="dashboard-title"><div><span className="eyebrow">{bippoT("مساحة العمل")}</span><h1>{(activity.foodService ? bippoT('إدارة الطلبات ') : bippoT('إدارة التيكيات '))}<span className="live"><span className="dot" />{bippoT(" مباشر")}</span></h1><p>{cloud ? bippoT("آخر 200 طلب · السجل الكامل والإحصاءات في التقارير") : bippoT("وضع تجريبي · البيانات في هذا المتصفح فقط")}</p></div></div><div className="dashboard-tabs"><button className={tab === 'orders' ? 'selected' : ''} onClick={() => setTab('orders')}><List size={17} />{bippoT(" الطلبات")}</button><button className={tab === 'reports' ? 'selected' : ''} onClick={() => setTab('reports')}><BarChart3 size={17} />{bippoT(" السجل والتقارير")}</button><button className={tab === 'settings' ? 'selected' : ''} onClick={() => setTab('settings')}><Settings size={17} />{bippoT(" الإعدادات")}</button></div>{tab === 'settings' ? <ShopSettings /> : tab === 'reports' ? <Reports /> : <><div className="stats">{[[bippoT("راه يتحضّر"), rows.filter(o => o.status === 'preparing').length, Clock], [bippoT("واجد للاستلام"), rows.filter(o => o.status === 'ready').length, Check], [bippoT("تسلّم وبقى في السجل"), rows.filter(o => o.status === 'collected').length, CheckCheck]].map(([label, n, Icon]) => <div className="stat" key={label}><Icon size={22} /><span>{label}</span><strong>{n}</strong></div>)}</div><div className="work-grid"><section className="panel new-order"><span className="round-icon"><Plus /></span><h2>{(activity.foodService ? bippoT('طلب جديد') : bippoT('تيكي جديد'))}</h2><p>{bippoT("دخل النمرة اللي راهي في تيكي الزبون.")}</p><form onSubmit={async e => {
            e.preventDefault();
            setBusy(true);
            setNotice('');
            try {
              const o = await createOrder(number);
              setSelected(o);
              setNumber('');
              setNotice(bippoT("تزاد الطلب ") + o.number);
            } catch (e) {
              setNotice(e.message);
            } finally {
              setBusy(false);
            }
          }}><label>{(activity.foodService ? bippoT('رقم الطلب') : bippoT('رقم التيكي'))}<input placeholder={bippoT("مثلًا 104")} inputMode="numeric" maxLength={4} value={number} onChange={e => setNumber(e.target.value)} required /></label><button className="button full" disabled={busy}><Plus size={18} />{(activity.foodService ? bippoT(' زيد الطلب') : bippoT(' زيد التيكي'))}</button></form><small>{bippoT("ما نحتاجوش اسم الزبون ولا نمرة تليفونو.")}</small></section><section className="panel order-list"><div className="list-heading"><div><h2>{(activity.foodService ? bippoT('أحدث الطلبات') : bippoT('أحدث التيكيات'))}</h2><p className="history-hint">{bippoT("المستلمة تبقى ظاهرة ومحفوظة.")}</p><p className="guest-status-legend">{bippoT("حالات الزبون تسجّل آخر تفاعل، ماشي ضمان أنه سمع الرنة.")}</p></div><select aria-label={bippoT("تصفية الطلبات")} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">{bippoT("كل الحالات")}</option><option value="active">{bippoT("الطلبات النشطة")}</option><option value="preparing">{bippoT("راه يتحضّر")}</option><option value="ready">{bippoT("واجد للاستلام")}</option><option value="collected">{bippoT("تسلّم الطلب")}</option></select></div>{error && <p className="error" role="alert">{bippoT("تعذر التحديث: ")}{error}{bippoT(" — نعاودو الاتصال تلقائيًا.")}</p>}{!orders ? <p>{bippoT("نحمّلو الطلبات…")}</p> : visible.map(o => <div className={'order-row ' + o.status} key={o.id}><div className="order-number"><DotNumber value={o.number} /></div><div className="order-detail"><span className={'status ' + o.status}>{statuses[o.status]}</span><small>{new Date(o.created_at).toLocaleString(bippoLocale, {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</small>{o.ready_at && <small className="prep-duration">{bippoT("التحضير: ")}{duration(secondsBetween(o.created_at, o.ready_at))}</small>}<GuestStatus order={o} unavailable={signalsUnavailable} /></div><button className="icon-button" aria-label={bippoT("رابط الطلب ") + o.number} onClick={() => setSelected(o)}><ScanLine size={20} /></button>{o.status !== 'collected' ? <button className={'button small ' + (o.status === 'ready' ? 'outline' : '')} disabled={busy} onClick={() => mark(o, o.status === 'preparing' ? 'ready' : 'collected')}>{o.status === 'preparing' ? bippoT("جاهز") : bippoT("تسلّم الطلب")}<Check size={15} /></button> : <CheckCheck size={20} className="muted" />}</div>)}{orders && !visible.length && <div className="empty"><ChefHat size={40} /><h3>{bippoT("ما كاش طلبات بهاذ الحالة")}</h3><p>{bippoT("الطلبات المستلمة تلقاها باختيار «كل الحالات» أو في السجل.")}</p></div>}{cloud && rows.length >= 200 && <p className="history-limit"><History size={14} />{bippoT(" عرض أحدث 200 طلب. باقي الطلبات متاحة في «السجل والتقارير».")}</p>}</section></div></>}<p role="status" className="notice">{notice}</p>{pushFailed && rows.find(o => o.id === pushFailed.id)?.status === 'ready' && <button disabled={busy} className="retry-alert" onClick={async () => {
      setBusy(true);
      try {
        const r = await retryPush(pushFailed.id);
        setNotice(r.failed ? bippoT("بعض الأجهزة ما وصلهاش طلب الإشعار؛ نادِ الزبون من المحل.") : bippoT("أُرسل طلب الإشعار إلى {0} جهاز. هذا ما يثبتش أن الزبون سمعه.", [r.sent]));
        if (!r.failed) setPushFailed(null);
      } catch (e) {
        setNotice(e.message);
      } finally {
        setBusy(false);
      }
    }}>{bippoT("عاود إرسال إشعار الطلب ")}{pushFailed.number}</button>}{selected && <Share order={selected} close={() => setSelected(null)} />}</main>;
}
