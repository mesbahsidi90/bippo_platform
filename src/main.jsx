import { t as bippoT, locale as bippoLocale, ticketLink } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpLeft, Check, Plus, Monitor, ExternalLink, Copy, Clock, CheckCheck, Radio, LogOut, ChefHat, ScanLine, ArrowLeft, Menu, X, Printer, Star } from 'lucide-react';
import { cloud, db, listOrders, createOrder, transition, track, display, subscribe } from './store';
import { statuses } from './domain';
import './style.css';
import './redesign.css';
import Landing, { Brand } from './Landing';
import Account from './Account';
import Signup from './Signup';
import PublicPages from './PublicPages';
import { publicRoutes } from './publicContent';
import ResetPassword from './ResetPassword';
import Admin from './Admin';
import { ticketBranding } from './shopSettings';
import DotNumber from './DotNumber';
import Orders from './Orders';
import OrderAlerts from './OrderAlerts';
import FollowTicket from './FollowTicket';
import { DemoCustomer } from './LiveDemo';
import CustomerPager from './CustomerPager';
import './alerts-reports.css';
import './signup-links.css';
import LanguageSwitcher from './LanguageSwitcher';
import Receipt from './Receipt';
import CounterTicket from './CounterTicket';
import { trackingCode } from './counterAccess.js';
import ReviewCard from './ReviewCard';
import { getSettings } from './shopSettings';
import { signalGuest, guestExtras } from './guestApi';
import { reviewUrl } from './guestExperience';
import './guest-experience.css';
const route = location.hash.slice(1).split('/');
if (!route[0] && !location.search.includes('setup=1') && (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone)) {
  const ticket = localStorage.getItem('bippo-last-ticket');
  if (ticket) route.splice(0, 2, localStorage.getItem('bippo-last-ticket-route') === 'demo' ? 'demo' : 'track', ticket);else route.splice(0, 2, 'follow', '');
}
const link = path => ticketLink(path);
function App() {
  const [page, setPage] = useState(route[0] && !route[0].includes('=') ? route[0] : location.search.includes('setup=1') ? 'account' : 'home');
  const [token, setToken] = useState(route[1] || '');
  useEffect(() => {
    const change = () => {
      const [p, t] = location.hash.slice(1).split('/');
      setPage(p && !p.includes('=') ? p : location.search.includes('setup=1') ? 'account' : 'home');
      setToken(t || '');
    };
    addEventListener('hashchange', change);
    return () => removeEventListener('hashchange', change);
  }, []);
  return publicRoutes.includes(page) ? <PublicPages key={page} page={page} /> : page === 'signup' ? <Signup /> : page === 'demo' ? <DemoCustomer key={token} token={token} /> : page === 'counter' ? <CounterTicket key={token} branch={token} /> : page === 'follow' ? <FollowTicket /> : page === 'reset' ? <ResetPassword /> : page === 'admin' ? <Admin /> : page === 'account' ? <Account /> : page === 'track' ? <Customer key={token} token={token} /> : page === 'display' ? <Display token={token} /> : page === 'dashboard' ? <Dashboard /> : <Landing />;
}
function useLive(loader, deps = []) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [last, setLast] = useState(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const result = await loader();
        if (alive) {
          setData(result);
          setError('');
          setLast(new Date());
        }
      } catch (e) {
        if (alive) setError(e.message || bippoT("تعذر الاتصال"));
      }
    };
    refresh();
    const stop = subscribe(refresh);
    return () => {
      alive = false;
      stop();
    };
  }, deps);
  return {
    data,
    error,
    last
  };
}
function Dashboard() {
  const [session, setSession] = useState(null),
    [authReady, setAuthReady] = useState(!cloud);
  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({
      data
    }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const {
      data
    } = db.auth.onAuthStateChange((_, s) => {
      setSession(s);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return <><header className="nav wrap"><Brand linked={false} />{authReady && !session && cloud && <a className="button outline small" href="#signup">{bippoT("إنشاء حساب")}</a>}</header>{!authReady ? <p className="wrap">{bippoT("جارٍ الاتصال…")}</p> : cloud && !session ? <Login /> : <Orders Share={Share} />}</>;
}
function Login() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return <form className="panel login" onSubmit={async e => {
    e.preventDefault();
    setBusy(true);
    const {
      error
    } = await db.auth.signInWithPassword({
      email,
      password
    });
    setError(error ? bippoT("تعذر الدخول. تحقق من البريد وكلمة المرور.") : '');
    setBusy(false);
  }}><span className="eyebrow">{bippoT("مساحة فريقك")}</span><h1>{bippoT("أهلًا بعودتك")}</h1><p>{bippoT("الدخول متاح لصاحب المحل والموظفين المصرح لهم.")}</p><label>{bippoT("البريد الإلكتروني")}<input type="email" autoComplete="username" value={email} required onChange={e => setEmail(e.target.value)} /></label><label>{bippoT("كلمة المرور")}<input type="password" autoComplete="current-password" value={password} required onChange={e => setPassword(e.target.value)} /></label><button className="button" disabled={busy}>{bippoT("دخول")}</button><div className="signup-prompt"><span>{bippoT("جديد في bippo؟")}</span><a className="button outline full" href="#signup">{bippoT("إنشاء حساب جديد للمحل")}</a></div><a className="recovery-back" href="#reset">{bippoT("ما حطّيتش كلمة مرور؟ ولا نسيتها؟")}</a>{error && <p role="alert" className="error">{error}</p>}</form>;
}
function Share({
  order,
  close
}) {
  const [copied, setCopied] = useState(false),
    [branding, setBranding] = useState(null),
    [width, setWidth] = useState('80'),
    [preview, setPreview] = useState(false),
    [printError, setPrintError] = useState('');
  const url = link('track/' + order.token);
  const code = branding?.tracking_mode === 'counter' ? trackingCode(order) : '';
  useEffect(() => {
    let live = true;
    getSettings().then(v => live && setBranding(v)).catch(() => live && setPrintError(bippoT("تعذر تحميل بيانات التيكي. أغلق النافذة وعاود.")));
    const esc = e => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', esc);
    return () => {
      live = false;
      document.removeEventListener('keydown', esc);
    };
  }, []);
  return <div className="modal" onClick={close}><section role="dialog" aria-modal="true" aria-label={bippoT("مشاركة الطلب")} className="panel share" onClick={e => e.stopPropagation()}><button autoFocus className="close icon-button" onClick={close} aria-label={bippoT("إغلاق")}><X /></button><h2>{bippoT("طلب ")}{order.number}</h2>{code ? <>
      <p>{bippoT('الزبون يمسح QR الثابت ويدخل هذا الكود.')}</p>
      <strong className="counter-code" dir="ltr">{code}</strong>
    </> : <>
      <p>{bippoT("ليفتح الزبون الرابط أو يمسح الرمز.")}</p>
      <QRCodeSVG value={url} size={210} level="M" marginSize={3} />
    </>}<div className="receipt-controls"><label className="comparison-sr-only" htmlFor="receipt-width">{bippoT("عرض التيكي")}</label><select id="receipt-width" aria-label={bippoT("عرض التيكي")} value={width} onChange={e => setWidth(e.target.value)}><option value="80">{bippoT("80 مم")}</option><option value="58">{bippoT("58 مم")}</option></select><button className="button" disabled={!branding} onClick={() => window.print()}><Printer size={17} />{bippoT(" طباعة التيكي")}</button></div><button className="button outline full" disabled={!branding} onClick={() => setPreview(true)}>{bippoT("معاينة التيكي")}</button>{printError && <p role="alert" className="error">{printError}</p>}<small>{bippoT("اختار نفس عرض الورق في نافذة الطباعة، مقياس 100٪، بلا هوامش ولا ترويسة. تقدر تحفظه PDF.")}</small><a className="button full" href={'#track/' + order.token} target="_blank" rel="noreferrer">{bippoT("افتح صفحة الزبون ")}<ExternalLink size={17} /></a><button className="button outline full" onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}><Copy size={16} />{copied ? bippoT("نُسخ الرابط") : bippoT("نسخ الرابط")}</button><input aria-label={bippoT("رابط الطلب")} readOnly value={url} dir="ltr" onFocus={e => e.target.select()} />{!cloud && <small>{bippoT("رمز التجربة يعمل في المتصفح نفسه. للأجهزة الأخرى، فعّل Supabase.")}</small>}</section>{branding && <Receipt order={order} branding={branding} url={url} code={code} width={width} preview={preview} onClose={() => setPreview(false)} />}</div>;
}
function Customer({
  token
}) {
  const [branding, setBranding] = useState(null),
    [ack, setAck] = useState(() => sessionStorage.getItem('bippo-alert-ack-' + token) === '1'),
    [confirmError, setConfirmError] = useState('');
  useEffect(() => {
    let alive = true;
    ticketBranding(token).then(v => alive && setBranding(v)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [token]);
  const {
    data: o,
    error,
    last
  } = useLive(async () => {
    const order = await track(token);
    if (!order) return null;
    let extras = {};
    try {
      extras = (await guestExtras(token)) || {};
    } catch {}
    return {
      ...order,
      ...extras
    };
  }, [token]);
  const report = event => signalGuest(token, event).catch(() => false);
  useEffect(() => {
    if (!o || o.status === 'collected') return;
    let alive = true;
    const pulse = () => {
      if (document.visibilityState !== 'visible') return;
      void report('heartbeat');
      if (o.status === 'ready') void report('ready_seen');
      if (sessionStorage.getItem('bippo-alert-armed-' + token) === '1') void report('sound_enabled');
      if (o.status === 'ready' && sessionStorage.getItem('bippo-alert-ack-' + token) === '1' && !o.coming_at) void signalGuest(token, 'coming').then(ok => alive && setConfirmError(ok ? '' : bippoT("ما وصلش تأكيدك للمحل، نعاودو الإرسال."))).catch(() => alive && setConfirmError(bippoT("ما وصلش تأكيدك للمحل، نعاودو الإرسال.")));
    };
    void report('opened');
    pulse();
    const timer = setInterval(pulse, 15000);
    document.addEventListener('visibilitychange', pulse);
    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', pulse);
    };
  }, [token, o?.status, o?.coming_at]);
  useEffect(() => {
    if (token) {
      localStorage.setItem('bippo-last-ticket', token);
      localStorage.setItem('bippo-last-ticket-route', 'track');
    }
  }, [token]);
  const acknowledge = () => {
    setAck(true);
    void signalGuest(token, 'coming').then(ok => setConfirmError(ok ? '' : bippoT("ما وصلش تأكيدك للمحل، نعاودو الإرسال."))).catch(() => setConfirmError(bippoT("ما وصلش تأكيدك للمحل، نعاودو الإرسال.")));
  };
  let review = '';
  try {
    review = reviewUrl(o?.google_review_url || '');
  } catch {}
  return <CustomerPager branding={branding} number={o?.number} status={o?.status} acknowledged={ack || Boolean(o?.coming_at)} loading={!o && !last && !error} error={error || (!o && last ? bippoT("راجع موظف المحل باش يعطيك رابط الطلب.") : '')} extra={o?.status === 'collected' ? <ReviewCard url={review} /> : confirmError ? <p className="guest-confirm-error" role="status">{confirmError}</p> : null}>{o && <OrderAlerts ticket={token} status={o.status} offline={Boolean(error)} onEnabled={() => void report('sound_enabled')} onPushEnabled={() => void report('push_enabled')} onAcknowledge={acknowledge} onRefresh={() => window.dispatchEvent(new Event('nawba-change'))} />}</CustomerPager>;
}
function Display({
  token
}) {
  const {
    data,
    error,
    last
  } = useLive(() => display(token), [token]);
  const rows = error ? [] : data || [];
  return <main className="display-page"><header><Brand /><div className="actions"><span className="live"><span className="dot" />{error ? bippoT("الاتصال منقطع") : bippoT("تحديث تلقائي")}</span><button className="button outline small" onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {})}>{bippoT("ملء الشاشة")}</button></div></header><div className="display-heading"><span className="eyebrow">{bippoT("لحظتك الحلوة وصلت")}</span><h1>{bippoT("واجد للاستلام")}</h1><p>{bippoT("طلبك واجد، تقدر تجي تديه عند ظهور رقمك")}</p></div>{error ? <p role="alert" className="error">{bippoT("تعذر تحديث الشاشة. نعيد الاتصال…")}</p> : <div className="ready-grid">{rows.filter(o => o.status === 'ready').map(o => <div key={o.number}><DotNumber value={o.number} /><Check size={28} /></div>)}</div>}{!error && last && !rows.some(o => o.status === 'ready') && <p className="display-empty">{bippoT("نحضّر طلباتكم بكل عناية…")}</p>}<div className="preparing-strip"><span><Clock size={20} />{bippoT(" راه يتحضّر")}</span>{rows.filter(o => o.status === 'preparing').map(o => <b key={o.number}>{o.number}</b>)}</div><footer>{!cloud ? bippoT("شاشة تجريبية · المتصفح نفسه") : bippoT("bippo · شاشة الطلبات")}<small>{bippoT("آخر اتصال: ")}{last?.toLocaleTimeString(bippoLocale) || bippoT("جارٍ الاتصال")}</small></footer></main>;
}
createRoot(document.getElementById('root')).render(<><App /><LanguageSwitcher /></>);
import './bippo.css';
