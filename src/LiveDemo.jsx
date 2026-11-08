import { t as bippoT, ticketLink } from "./i18n.js";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Bell, Check, RefreshCw, Smartphone, ArrowLeft, Copy } from 'lucide-react';
import DotNumber from './DotNumber';
import OrderAlerts from './OrderAlerts';
import CustomerPager from './CustomerPager';
import { Brand } from './Landing';
import { cloud } from './store';
import { demoRequest } from './demoApi';
import './live-demo.css';
import {validDemo,createDemoIssuer} from './demoSession';
const cache = 'bippo-landing-demo';
function initial() {
  try {
    const d = JSON.parse(sessionStorage.getItem(cache));
    return validDemo(d) ? d : null;
  } catch {
    return null;
  }
}
function remember(d) {
  sessionStorage.setItem(cache, JSON.stringify(d));
  sessionStorage.setItem('bippo-demo-control-' + d.token, d.control);
}
const issueDemo=createDemoIssuer({read:initial,request:()=>demoRequest('create'),remember});
function useDemo(token) {
  const [data, setData] = useState(null),
    [error, setError] = useState('');
  const busy = useRef(false),
    current = useRef(token);
  current.current = token;
  const refresh = useCallback(async () => {
    if (!token || busy.current) return;
    busy.current = true;
    try {
      const d = await demoRequest('track', {
        ticket: token
      });
      if (current.current === token) {
        setData(d);
        setError('');
      }
    } catch (e) {
      if (current.current === token) setError(e.message);
    } finally {
      busy.current = false;
    }
  }, [token]);
  useEffect(() => {
    setData(null);
    refresh();
    const timer = setInterval(refresh, 1800);
    return () => clearInterval(timer);
  }, [refresh]);
  return {
    data,
    error,
    refresh
  };
}
export default function LiveDemo() {
  const [ticket, setTicket] = useState(initial),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [copied, setCopied] = useState(false);
  const {
    data,
    error: pollError,
    refresh
  } = useDemo(ticket?.token);
  const url = ticket ? ticketLink('demo/'+ticket.token) : '';
 const section=useRef(null),started=useRef(false);
 useEffect(()=>{if(ticket||started.current)return;const start=()=>{if(started.current)return;started.current=true;void create(false);};if(!('IntersectionObserver'in window)){start();return;}const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){start();observer.disconnect();}},{rootMargin:'180px'});if(section.current)observer.observe(section.current);return()=>observer.disconnect();},[ticket]);
 useEffect(()=>{if(!ticket)return;const timer=setTimeout(()=>{setTicket(null);started.current=true;setError(bippoT('انتهت التجربة. أبدا تجربة جديدة.'));sessionStorage.removeItem(cache);},Math.min(2147483647,Math.max(0,Date.parse(ticket.expires_at)-Date.now())));return()=>clearTimeout(timer);},[ticket]);
  async function create(force=true) {
    setBusy(true);
    setError('');
    try {
      const d = await issueDemo(force);
      setTicket(d);
      setCopied(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function ring() {
    setBusy(true);
    setError('');
    try {
      await demoRequest('ring', {
        ticket: ticket.token,
        control: ticket.control
      });
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <section id="try" ref={section} className="live-demo wrap"><div className="live-demo-copy"><span className="kicker">{bippoT("من الكونتوار لتليفونك، جرّبها درك")}</span><h2>{bippoT("امسح الكود.")}<br />{bippoT("واسمعها في هاتفك.")}</h2><p>{bippoT("تجربة حقيقية بلا حساب. نفس متابعة الطلب ونفس التنبيه اللي يستعملو الزبون.")}</p><ol><li><span>01</span>{bippoT(" امسح QR بكاميرا هاتفك.")}</li><li><span>02</span>{bippoT(" اضغط «فعّل التنبيه» واسمح بالإشعارات.")}</li><li><span>03</span>{bippoT(" اقفل الشاشة، واضغط «رنّ الهاتف» هنا.")}</li></ol><p className="demo-support">{bippoT("على Android جرّب من Chrome. على iPhone إشعار القفل يحتاج إضافة bippo للشاشة الرئيسية. الصوت والاهتزاز يتبعو دعم وإعدادات الهاتف.")}</p></div><div className="live-demo-ticket"><header><b>{bippoT("تيكي التجربة")}</b><span className={'demo-connection ' + (data?.sound_at ? 'connected' : '')}>{data?.acknowledged_at ? bippoT("الزبون راه جاي") : data?.sound_at ? bippoT("الصوت مفعّل") : data?.opened_at ? bippoT("الهاتف متصل") : bippoT("نستنّاو هاتفك")}</span></header>{!ticket ? <div className="demo-loading" role="status">{busy||!error?<><span aria-hidden="true"/><p>{bippoT('نوجدو التجربة…')}</p></>:<button className="button" onClick={()=>create(true)}>{bippoT('عاود جرّب')}<RefreshCw size={17}/></button>}</div> : <><div className="demo-qr-row"><div className="demo-qr"><QRCodeSVG aria-label={bippoT("كود تجربة الهاتف")} value={url} size={190} level="M" marginSize={2} /></div><div><small>{bippoT("رقم الطلب")}</small><DotNumber value={ticket.number} /></div></div><div className="demo-ticket-state" aria-live="polite">{data?.acknowledged_at ? <><Check size={19} />{bippoT(" وصل التأكيد: راني جاي")}</> : data?.status === 'ready' ? <><Bell size={19} />{bippoT(" الطلب راه واجد. شوف هاتفك.")}</> : data?.devices > 0 ? bippoT("إشعارات الخلفية مفعّلة على الهاتف") : data?.sound_at ? bippoT("جلسة الصوت جاهزة. فعّل إشعار الخلفية أيضًا.") : bippoT("فعّل التنبيه من صفحة الهاتف قبل ما ترنّ.")}</div><div className="demo-control-row"><button className="button" disabled={busy || data?.status === 'ready' || !data?.sound_at} onClick={ring}><Bell size={18} />{busy ? bippoT("نرسل…") : bippoT("رنّ الهاتف")}</button><button className="demo-text-button" disabled={busy} onClick={()=>create(true)}><RefreshCw size={15} />{bippoT(" تجربة جديدة")}</button></div><div className="demo-mobile-link"><Smartphone size={17} /><a href={'#demo/' + ticket.token}>{bippoT("جرّب من هذا الهاتف بعد 10–20 ثانية")}</a></div><button className="demo-copy-link" onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            setError(bippoT("انسخ الرابط: ") + url);
          }
        }}><Copy size={14} />{copied ? bippoT("تنسخ الرابط") : bippoT("انسخ رابط الهاتف")}</button><small className="demo-expiry">{bippoT("تجربة خاصة صالحة 15 دقيقة · لا تدخل في تقارير المحلات")}</small></>}{(error || pollError) && <p className="demo-error" role="alert">{error || pollError}</p>}{!cloud && <p className="demo-error">{bippoT("معاينة محلية: الكود يعمل في نفس المتصفح فقط. التجربة بين الأجهزة متاحة في الموقع المنشور.")}</p>}</div></section>;
}
export function DemoCustomer({
  token
}) {
  const {
    data,
    error,
    refresh
  } = useDemo(token);
  const [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [ack, setAck] = useState(() => sessionStorage.getItem('bippo-alert-ack-' + token) === '1');
  const control = sessionStorage.getItem('bippo-demo-control-' + token);
  useEffect(() => {
    if (data?.status === 'ready') setNotice('');
  }, [data?.status]);
  useEffect(() => {
    demoRequest('progress', {
      ticket: token,
      stage: 'opened'
    }).then(refresh).catch(() => {});
    localStorage.setItem('bippo-last-ticket', token);
    localStorage.setItem('bippo-last-ticket-route', 'demo');
  }, [token, refresh]);
  const progress = stage => {
    demoRequest('progress', {
      ticket: token,
      stage
    }).then(refresh).catch(e => setNotice(e.message));
  };
  async function delayed() {
    setBusy(true);
    try {
      await demoRequest('ring', {
        ticket: token,
        control,
        delay: 10
      });
      setNotice(bippoT("اقفل الشاشة درك. نرنو بعد حوالي 10–20 ثانية."));
      await refresh();
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const confirmed = ack || Boolean(data?.acknowledged_at);
  return <CustomerPager demo number={data?.number} status={data?.status} acknowledged={confirmed} loading={!data && !error} error={error} extra={<>{control && data?.status === 'preparing' && <div className="demo-delayed"><button className="button full" disabled={busy || !data.sound_at || Boolean(data.scheduled_at)} onClick={delayed}><Bell size={17} />{data.scheduled_at ? bippoT("الرنة مبرمجة — اقفل الشاشة") : bippoT("جرّب الرنة بعد 10–20 ثانية")}</button></div>}{confirmed && <a className="button outline full" href="#try">{bippoT("عاود جرّب")}</a>}{notice && <p className="alert-warning" role="status">{notice}</p>}</>}>
 {data && !confirmed && <OrderAlerts key={token} ticket={token} status={data.status} demo offline={Boolean(error)} onRefresh={refresh} onEnabled={() => progress('sound')} onAcknowledge={() => {
      setAck(true);
      progress('ack');
    }} />}
 </CustomerPager>;
}
