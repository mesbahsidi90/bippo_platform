import { t as bippoT, locale as bippoLocale } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { Plus, Settings, Clock, Check, CheckCheck, ScanLine, BarChart3, List, QrCode, Palette, MessageCircle, ChefHat, Sparkles, CreditCard } from 'lucide-react';
import { cloud, listOrders, createOrder, transition, subscribe } from './store';
import { statuses } from './domain';
import DotNumber from './DotNumber';
import Reports from './Reports';
import ShopSettings from './ShopSettings.jsx';
import { getSettings } from './shopSettings';
import { shopActivity } from './shopActivities';
import { duration, secondsBetween } from './reporting';
import Brand from './Brand';
import { supportWhatsApp } from './contactDetails';
import MerchantCodes from './MerchantCodes';
import MerchantSubscription from './MerchantSubscription';
import './merchant-workspace.css';
import { retryPush } from './OrderAlerts';
import { staffSignals } from './guestApi';
import GuestStatus from './GuestStatus';
import './guest-experience.css';
export default function Orders({
  Share, workspace
}) {
  const [orders, setOrders] = useState(null),
    [error, setError] = useState(''),
    [number, setNumber] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(null),
    [tab, setTab] = useState(workspace === 'kitchen' ? 'kitchen' : 'orders'),
    [pushFailed, setPushFailed] = useState(null),
    [signalsUnavailable, setSignalsUnavailable] = useState(false),
    [shop, setShop] = useState(null),
    [shopError, setShopError] = useState('');
  const activity = shopActivity(shop?.kind);
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
    load();
    const stop = subscribe(load);
    return () => {
      alive = false;
      stop();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setShopError('');
    getSettings().then(value => {
      if (alive) setShop(value);
    }).catch(e => {
      if (alive) setShopError(e.message);
    });
    return () => { alive = false; };
  }, [tab]);

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
  const rows = orders || [];
  const groups = {
    preparing: rows.filter(order => order.status === 'preparing'),
    ready: rows.filter(order => order.status === 'ready'),
    collected: rows.filter(order => order.status === 'collected')
  };
  const prepTimes = rows.map(order => secondsBetween(order.created_at, order.ready_at))
    .filter(value => value != null);
  const average = prepTimes.length
    ? duration(prepTimes.reduce((total, value) => total + value, 0) / prepTimes.length)
    : '—';
  const tabs = [
    ['assistant', bippoT('دليل التجهيز'), Sparkles],
    ['orders', activity.foodService ? bippoT('الطلبات') : bippoT('التيكيات'), List],
    ['reports', bippoT('السجل والتقارير'), BarChart3],
    ['codes', bippoT('الأكواد'), QrCode],
    ['customer', bippoT('صفحة الزبون'), Palette],
    ['settings', bippoT('الإعدادات'), Settings],
    ['billing', bippoT('الاشتراك'), CreditCard]
  ];
  const kitchen = tab === 'kitchen' && Boolean(shop && activity.foodService);
  const activeTab = tabs.find(([id]) => id === tab);
  const numberLabel = activity.foodService ? bippoT('رقم الطلب') : bippoT('رقم التيكي');

  async function addOrder(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    try {
      const order = await createOrder(number);
      setSelected(order);
      setNumber('');
      setNotice(bippoT('تزاد الطلب ') + order.number);
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }

  function orderCard(order) {
    return (
      <article className="merchant-order" key={order.id}>
        <div className="merchant-order-info">
          <DotNumber value={order.number} />
          <div>
            <time dateTime={order.created_at}>{new Date(order.created_at).toLocaleString(bippoLocale, {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            })}</time>
            <GuestStatus order={order} unavailable={signalsUnavailable} />
          </div>
        </div>
        <div className="merchant-order-actions">
          <button type="button" className="icon-button" aria-label={bippoT('رابط الطلب ') + order.number}
            onClick={() => setSelected(order)}><ScanLine size={19} /></button>
          {order.status === 'collected' ? <CheckCheck size={20} /> : (
            <button className={'button small' + (order.status === 'ready' ? ' outline' : '')}
              disabled={busy} onClick={() => mark(order, order.status === 'preparing' ? 'ready' : 'collected')}>
              {order.status === 'preparing' ? bippoT('جاهز') : bippoT('تسلّم الطلب')}<Check size={15} />
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <div className="merchant-workspace">
      <aside className="merchant-sidebar">
        <Brand linked={false} />
        <div className="merchant-identity">
          {shop?.logo && <img src={shop.logo} alt="" />}
          <div><strong>{shop?.name || bippoT('محلي')}</strong><small>{activity.label}</small></div>
        </div>
        <nav aria-label={bippoT('مساحة العمل')}>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <a className="merchant-support" href={supportWhatsApp} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={18} />{bippoT('تواصل معنا')}
        </a>
      </aside>
      <main className="merchant-main">
        <header className="merchant-heading">
          
          <h1>{activeTab?.[1] || bippoT('شاشة المطبخ')}</h1>
          {tab === 'orders' && <p>{cloud ? bippoT('آخر 200 طلب · السجل الكامل والإحصاءات في التقارير') : bippoT('وضع تجريبي · البيانات في هذا المتصفح فقط')}</p>}
        </header>
        {tab === 'reports' && <Reports />}
        {tab === 'billing' && <MerchantSubscription shopId={shop?.shop_id} shopError={shopError} />}
        {tab === 'assistant' && <section className="panel merchant-setup">
          <h2>{bippoT('جهّز محلك')}</h2>
          <ol>
            {[
              ['codes', bippoT('حضّر طريقة مشاركة الرمز')],
              ['customer', bippoT('خصّص صفحة الزبون')],
              ['orders', bippoT('جرّب أول تيكي')],
              ['reports', bippoT('السجل والتقارير')]
            ].map(([id, label]) => (
              <li key={id}><span>{label}</span>
                <button type="button" className="button outline small" onClick={() => setTab(id)}>{tabs.find(([key]) => key === id)[1]}</button>
              </li>
            ))}
          </ol>
        </section>}
        {tab === 'kitchen' && (
          <>
            {shopError && <p role="alert" className="error">{shopError}</p>}
            {(!shop || !orders) && !shopError && !error && <p role="status">{bippoT('نحمّلو الطلبات…')}</p>}
            {error && <p role="alert" className="error">{error}</p>}
            {shop && !activity.foodService && <p>{bippoT('شاشة المطبخ متاحة لأنشطة الأكل.')}</p>}
            {kitchen && orders && <div className="merchant-board">
              {['preparing', 'ready'].map(status => (
                <section key={status} className={'merchant-lane ' + status}>
                  <header><h2>{statuses[status]}</h2><span>{groups[status].length}</span></header>
                  {groups[status].length ? groups[status].map(order => (
                    <article className="merchant-order" key={order.id}>
                      <div className="merchant-order-info"><DotNumber value={order.number} /></div>
                      {status === 'preparing' ? (
                        <button type="button" className="button" disabled={busy} onClick={() => mark(order, 'ready')}>
                          <ChefHat size={18} />{bippoT('جاهز')}
                        </button>
                      ) : <Check size={22} />}
                    </article>
                  )) : <p>{bippoT('ما كاش طلبات بهاذ الحالة')}</p>}
                </section>
              ))}
            </div>}
          </>
        )}
        {(tab === 'settings' || tab === 'customer') && <ShopSettings key={tab} customer={tab === 'customer'} onSaved={setShop} />}
        {tab === 'codes' && <MerchantCodes shop={shop} error={shopError}
          onOrders={() => setTab('orders')} onSettings={() => setTab('settings')} foodService={activity.foodService} />}
        {tab === 'orders' && (
          <>
            <details className="panel merchant-setup" open={orders?.length === 0 || undefined}>
              <summary>{bippoT('جهّز محلك')}</summary>
              <ol>
                <li><span>{bippoT('حضّر طريقة مشاركة الرمز')}</span><button type="button" className="button outline small" onClick={() => setTab('codes')}>{bippoT('الأكواد')}</button></li>
                <li><span>{bippoT('خصّص صفحة الزبون')}</span><button type="button" className="button outline small" onClick={() => setTab('customer')}>{bippoT('صفحة الزبون')}</button></li>
                <li><span>{bippoT('جرّب أول تيكي')}</span><button type="button" className="button outline small" onClick={() => document.getElementById('merchant-ticket-number')?.focus()}>{numberLabel}</button></li>
              </ol>
            </details>
            <div className="merchant-metrics">
              {[
                [bippoT('راه يتحضّر'), groups.preparing.length, Clock],
                [bippoT('واجد للاستلام'), groups.ready.length, Check],
                [bippoT('تسلّم وبقى في السجل'), groups.collected.length, CheckCheck],
                [bippoT('متوسط التحضير'), average, BarChart3]
              ].map(([label, value, Icon]) => (
                <article key={label}><Icon size={17} /><span>{label}</span><strong>{orders ? value : '—'}</strong></article>
              ))}
            </div>
            <form className="merchant-entry panel" onSubmit={addOrder}>
              <label>{numberLabel}<input id="merchant-ticket-number" placeholder={bippoT('مثلًا 104')} inputMode="numeric"
                maxLength={4} value={number} onChange={e => setNumber(e.target.value)} required /></label>
              <button className="button" disabled={busy}><Plus size={18} />{activity.foodService ? bippoT(' زيد الطلب') : bippoT(' زيد التيكي')}</button>
            </form>
            {error && <p className="error" role="alert">{bippoT('تعذر التحديث: ')}{error}</p>}
            {!orders ? <p>{bippoT('نحمّلو الطلبات…')}</p> : (
              <>
                <div className="merchant-board">
                  {['preparing', 'ready'].map(status => (
                    <section key={status} className={'merchant-lane ' + status}>
                      <header><h2>{statuses[status]}</h2><span>{groups[status].length}</span></header>
                      {groups[status].length ? groups[status].map(orderCard) : <p>{bippoT('ما كاش طلبات بهاذ الحالة')}</p>}
                    </section>
                  ))}
                </div>
                <details className="panel merchant-history">
                  <summary>{bippoT('تسلّم وبقى في السجل')} · {groups.collected.length}</summary>
                  {groups.collected.map(orderCard)}
                </details>
              </>
            )}
          </>
        )}
        <p role="status" className="notice">{notice}</p>{pushFailed && rows.find(o => o.id === pushFailed.id)?.status === 'ready' && <button disabled={busy} className="retry-alert" onClick={async () => {
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
    }}>{bippoT("عاود إرسال إشعار الطلب ")}{pushFailed.number}</button>}
        {selected && <Share order={selected} close={() => setSelected(null)} />}
      </main>
    </div>
  );
}
