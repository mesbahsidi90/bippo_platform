import { t as bippoT } from "./i18n.js";
import React, { useState } from 'react';
import { Brand } from './Landing';
export default function FollowTicket() {
  const [value, setValue] = useState(''),
    [error, setError] = useState('');
  return <><header className="nav wrap"><Brand /></header><form className="panel login" onSubmit={e => {
      e.preventDefault();
      let ticket = value.trim(),
        kind = 'track';
      try {
        if (ticket.includes('://')) {
          const url = new URL(ticket);
          if (url.origin !== location.origin) throw new Error();
          kind = url.hash.startsWith('#demo/') ? 'demo' : 'track';
          ticket = url.hash.replace(/^#(?:track|demo)\//, '');
        }
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticket)) throw new Error();
        localStorage.setItem('bippo-last-ticket', ticket);
        localStorage.setItem('bippo-last-ticket-route', kind);
        location.hash = kind + '/' + ticket;
      } catch {
        setError(bippoT("الصق رابط الطلب الخاص بـ bippo كاملًا."));
      }
    }}><h1>{bippoT("تابع طلبك")}</h1><p>{bippoT("أول مرة تفتح bippo من الشاشة الرئيسية؟ الصق رابط الطلب اللي نسختو من صفحة الزبون. ما تحتاجش حساب.")}</p><label>{bippoT("رابط الطلب")}<input type="text" inputMode="url" required value={value} onChange={e => setValue(e.target.value)} dir="ltr" placeholder="https://bippo-platform.pages.dev/#track/…" /></label><button className="button">{bippoT("افتح الطلب")}</button>{error && <p className="error" role="alert">{error}</p>}</form></>;
}
