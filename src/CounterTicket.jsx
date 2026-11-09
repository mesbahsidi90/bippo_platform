import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Brand from './Brand';
import { t, ticketLink } from './i18n.js';
import { counterRoute, counterTicket, normalizeTrackingCode } from './counterAccess.js';
import './counter-ticket.css';

export function CounterPoster({ shop }) {
  const preview = useRef(null);
  const url = ticketLink(counterRoute(shop.shop_id));
  function downloadCode() {
    const svg = preview.current?.querySelector('svg');
    if (!svg) return;
    const file = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const fileUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = 'bippo-counter-qr.svg';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
  }
  const poster = (
    <article className="counter-poster">
      <h3>{shop.name}</h3>
      <p>{t('امسح الرمز وتابع طلبك')}</p>
      <QRCodeSVG value={url} size={200} marginSize={4} />
      <p>{t('دخل كود المتابعة اللي عطاهولك الكاشير وفعّل التنبيه.')}</p>
      <Brand linked={false} />
    </article>
  );
  return (
    <section className="counter-settings">
      <div ref={preview}>{poster}</div>
      <button type="button" className="button outline" onClick={() => window.print()}>
        {t('طباعة ملصق الكونتوار')}
      </button>
      <button type="button" className="button outline" onClick={downloadCode}>{t('تحميل QR بصيغة SVG')}</button>
      {createPortal(<div className="receipt-print-root counter-print">{poster}</div>, document.body)}
    </section>
  );
}

export default function CounterTicket({ branch }) {
  const [shop, setShop] = useState(undefined);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    counterTicket(branch)
      .then(result => { if (active) setShop(result); })
      .catch(() => {
        if (active) setError(t('تعذر الاتصال. عاود المحاولة.'));
      });
    return () => { active = false; };
  }, [branch, retry]);

  async function submit(event) {
    event.preventDefault();
    const normalized = normalizeTrackingCode(code);
    if (!/^[0-9A-F]{12}$/.test(normalized)) {
      setError(t('تأكد من كود المتابعة وعاود.'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await counterTicket(branch, normalized);
      if (result?.token) location.hash = 'track/' + result.token;
      else setError(t('الكود غير صالح أو فات وقت المتابعة. اسأل الكاشير.'));
    } catch {
      setError(t('تعذر الاتصال. عاود المحاولة.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap counter-guest">
      <Brand linked={false} />
      <section className="panel">
        <h1>{shop?.name || t('تابع طلبك')}</h1>
        {shop === undefined && !error && <p role="status">{t('جارٍ الاتصال…')}</p>}
        {shop === null && <p>{t('متابعة الطلبات بهذا الرمز غير متاحة. اسأل الكاشير.')}</p>}
        {shop && (
          <form onSubmit={submit}>
            <label>
              {t('كود المتابعة')}
              <input dir="ltr" value={code} onChange={e => setCode(e.target.value)}
                autoCapitalize="characters" autoComplete="off" spellCheck={false}
                required maxLength={20} placeholder="A1B2-C3D4-E5F6" />
            </label>
            <button className="button full" disabled={busy}>{t('افتح الطلب')}</button>
          </form>
        )}
        {error && <p role="alert" className="error">{error}</p>}
        {shop === undefined && error && (
          <button className="button" onClick={() => { setError(''); setRetry(value => value + 1); }}>
            {t('عاود المحاولة')}
          </button>
        )}
      </section>
    </main>
  );
}
