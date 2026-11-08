import { t as bippoT } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { db, authLinkError } from './store';
import { Brand } from './Landing';
export default function Account() {
  const [session, setSession] = useState(null),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [message, setMessage] = useState(authLinkError ? bippoT("رابط التفعيل انتهى أو ما بقاش صالح. اطلب رابطًا جديدًا.") : ''),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    db?.auth.getSession().then(({
      data
    }) => setSession(data.session));
    const sub = db?.auth.onAuthStateChange((_, s) => setSession(s));
    return () => sub?.data.subscription.unsubscribe();
  }, []);
  return <><header className="nav wrap"><Brand /></header><form className="panel login" onSubmit={async e => {
      e.preventDefault();
      if (password !== confirm) {
        setMessage(bippoT("كلمتا المرور ماشي كيف كيف"));
        return;
      }
      setBusy(true);
      setMessage('');
      const {
        error
      } = await db.auth.updateUser({
        password
      });
      setBusy(false);
      if (error) setMessage(error.message);else {
        setSaved(true);
        setPassword('');
        setConfirm('');
      }
    }}><h1>{bippoT("مرحبا بيك في bippo")}</h1>{!session ? <><p>{bippoT("افتح آخر رابط وصلك في البريد باش تفعّل حسابك وتختار كلمة المرور. إذا ما وصلكش، اطلب رابطًا جديدًا من هنا.")}</p><a className="button" href="#reset">{bippoT("ابعثلي رابط اختيار كلمة المرور")}</a></> : saved ? <><p role="status">{bippoT("تسجّلت كلمة المرور. تقدر تدخل للوحة المحل، أو لإدارة المنصة إذا حسابك أدمين.")}</p><a className="button" href="#dashboard">{bippoT("افتح لوحة المحل")}</a><a className="button outline" href="#admin">{bippoT("إدارة المنصة")}</a></> : <><p>{bippoT("اختار كلمة مرور لحسابك. ما تشاركها مع حتى واحد.")}</p><label>{bippoT("كلمة المرور")}<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>{bippoT("عاود كلمة المرور")}<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><small>{bippoT("12 حرف على الأقل")}</small><button className="button" disabled={busy}>{bippoT("حفظ كلمة المرور")}</button></>}{message && <p role="alert" className="error">{message}</p>}</form></>;
}
