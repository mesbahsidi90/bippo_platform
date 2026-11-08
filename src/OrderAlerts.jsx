import { t as bippoT, language } from "./i18n.js";
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Smartphone } from 'lucide-react';
import { cloud, db } from './store';
import { createVibrationLoop } from './vibration';
import { createOrderAudio, handleReadyPush } from './orderAudio';
import { createAlertSession } from './alertSession';
const base = import.meta.env.VITE_SUPABASE_URL,
  apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
async function pushRequest(route, body) {
  const res = await fetch(`${base}/functions/v1/order-alerts/${route}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      apikey: apiKey,
      ...(body ? {
        'Content-Type': 'application/json'
      } : {})
    },
    ...(body ? {
      body: JSON.stringify(body)
    } : {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || bippoT("تعذر تفعيل الإشعارات"));
  return data;
}
function keyBytes(value) {
  const str = atob(value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '='));
  return Uint8Array.from(str, c => c.charCodeAt(0));
}
export async function retryPush(orderId) {
  if (!cloud) return {
    sent: 0,
    failed: 0
  };
  const {
    data
  } = await db.auth.getSession();
  const res = await fetch(`${base}/functions/v1/order-alerts/notify`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${data.session?.access_token || ''}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      order_id: orderId
    })
  });
  if (!res.ok) throw new Error(bippoT("تعذر إعادة إرسال إشعار الخلفية. حالة الطلب محفوظة."));
  return res.json();
}
export default function OrderAlerts({
  ticket,
  status,
  onRefresh,
  offline = false,
  demo = false,
  onEnabled,
  onPushEnabled,
  onAcknowledge
}) {
  const session = useRef(null),
    callbacks = useRef({});
  callbacks.current = {
    onRefresh,
    onEnabled,
    onPushEnabled,
    onAcknowledge
  };
  const [view, setView] = useState({
    armed: false,
    ringing: false,
    acknowledged: false,
    pending: false
  });
  const [error, setError] = useState(''),
    [push, setPush] = useState('loading'),
    [ready, setReady] = useState(null),
    [pushBusy, setPushBusy] = useState(false);
  const ackKey = 'bippo-alert-ack-' + ticket;
  useEffect(() => {
    if (push === 'enabled') callbacks.current.onPushEnabled?.();
  }, [push]);
  useEffect(() => {
    const audio = createOrderAudio('/order-alert-v2.wav');
    audio.loop = true;
    audio.volume = 1;
    const vibration = createVibrationLoop(pattern => navigator.vibrate?.(pattern));
    const current = createAlertSession({
      audio,
      vibration,
      acknowledged: sessionStorage.getItem(ackKey) === '1',
      onChange: value => {
        setView(value);
        if (value.armed) sessionStorage.setItem('bippo-alert-armed-' + ticket, '1');
      },
      onError: () => setError(bippoT("اضغط «شغّل الرنة» باش يرجع الصوت."))
    });
    session.current = current;
    if (sessionStorage.getItem('bippo-alert-armed-' + ticket) === '1' && sessionStorage.getItem(ackKey) !== '1') void current.arm();
    const resume = () => {
      if (document.visibilityState === 'visible') current.resume();
    };
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('pageshow', resume);
    window.addEventListener('focus', resume);
    return () => {
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('pageshow', resume);
      window.removeEventListener('focus', resume);
      current.dispose();
      session.current = null;
    };
  }, [ticket]);
  useEffect(() => {
    session.current?.setReady(status === 'ready');
    if (status === 'collected') session.current?.acknowledge();
  }, [ticket, status]);
  useEffect(() => {
    if (!cloud) {
      setPush('local');
      return;
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    if (ios && !window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
      setPush('ios-install');
      return;
    }
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setPush('unsupported');
      return;
    }
    let live = true;
    Promise.all([navigator.serviceWorker.register('/push-sw.js?lang='+language, {
      scope: '/'
    }).then(() => navigator.serviceWorker.ready), pushRequest('public-key')]).then(async ([reg, key]) => {
      if (!live) return;
      setReady({
        reg,
        key: key.public_key
      });
      const subscription = await reg.pushManager.getSubscription();
      if (subscription && Notification.permission === 'granted') {
        await pushRequest('subscribe', {
          ticket,
          demo,
          subscription: subscription.toJSON()
        });
        if (live) setPush('enabled');
      } else if (live) setPush(Notification.permission === 'denied' ? 'denied' : 'available');
    }).catch(() => {
      if (live) setPush('unavailable');
    });
    const message = e => handleReadyPush(e.data, ticket, true, () => session.current?.setReady(true), () => callbacks.current.onRefresh?.());
    navigator.serviceWorker.addEventListener('message', message);
    return () => {
      live = false;
      navigator.serviceWorker.removeEventListener('message', message);
    };
  }, [ticket, demo]);
  async function enablePush() {
    if (!ready) return;
    setPushBusy(true);
    try {
      const subscription = await ready.reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(ready.key)
      });
      await pushRequest('subscribe', {
        ticket,
        demo,
        subscription: subscription.toJSON()
      });
      setPush('enabled');
    } catch {
      setPush(Notification.permission === 'denied' ? 'denied' : 'available');
      setError(bippoT("ما تفعّلش إشعار الهاتف. عاود من إعدادات المتصفح."));
    } finally {
      setPushBusy(false);
    }
  }
  function enable() {
    setError('');
    void session.current?.arm().then(ok => {
      if (ok) callbacks.current.onEnabled?.();
    });
    if (push === 'available') void enablePush();
  }
  function acknowledge() {
    session.current?.acknowledge();
    sessionStorage.setItem(ackKey, '1');
    sessionStorage.removeItem('bippo-alert-armed-' + ticket);
    callbacks.current.onAcknowledge?.();
  }
  const isReady = status === 'ready' || view.ringing;
  if (status === 'collected') return null;
  return <section className="order-alerts pager-alerts" aria-label={bippoT("تنبيهات الطلب")}>
  {view.acknowledged ? <div className="pager-armed"><Check size={20} />{bippoT(" بلغناهم بلي راك جاي")}</div> : isReady ? <>
   <button className="pager-action" onClick={acknowledge}><Check size={22} />{bippoT(" راني جاي 🏃")}</button>
   {!view.armed && <button className="pager-retry" onClick={enable}>{bippoT("شغّل الرنة")}</button>}
  </> : view.armed && (push === 'enabled' || push === 'local' || push === 'ios-install' || push === 'unsupported' || push === 'denied' || push === 'unavailable') ? <div className="pager-armed"><Bell size={21} />{bippoT(" التنبيه مفعّل، خلّي صوت الهاتف مسموع")}</div> : <button className="pager-action" disabled={view.pending || pushBusy} onClick={view.armed && push === 'available' ? enablePush : enable}><Bell size={22} />{view.pending || pushBusy ? bippoT("لحظة…") : view.armed && push === 'available' ? bippoT("اسمح بإشعار الهاتف") : bippoT("فعّل التنبيه")}</button>}
  {!isReady && !view.armed && <p className="pager-hint">{bippoT("اضغط واسمح برسالة المتصفح باش ننبّهوك كي يوجد طلبك.")}</p>}
  {(error || offline) && <p className="pager-alert-error" role="status">{error || bippoT("الاتصال راه يتعاود. حالة الطلب تبقى محفوظة.")}</p>}
  {!isReady && ['denied', 'ios-install', 'unsupported', 'unavailable'].includes(push) && <details className="pager-help"><summary>{push === 'denied' ? bippoT("إشعار القفل محبوس — كيفاش نفعّلو؟") : push === 'ios-install' ? bippoT("التنبيه على iPhone") : bippoT("مساعدة التنبيه")}</summary><p>{push === 'denied' ? bippoT("من الرمز حدّ عنوان الموقع: الأذونات ← الإشعارات ← السماح، ثم عاود افتح الصفحة.") : push === 'ios-install' ? bippoT("أضف bippo للشاشة الرئيسية من المشاركة، وافتح الأيقونة وفعّل التنبيه.") : bippoT("الرنة متاحة في الصفحة. إشعار القفل يتبع دعم وإعدادات الهاتف.")}</p>{push === 'ios-install' && <button onClick={() => navigator.clipboard.writeText(location.href).then(() => setError(bippoT("تنسخ الرابط. الصقو بعد فتح الأيقونة."))).catch(() => setError(bippoT("انسخ رابط الطلب من شريط العنوان.")))}>{bippoT("انسخ رابط الطلب")}</button>}</details>}
 </section>;
}
