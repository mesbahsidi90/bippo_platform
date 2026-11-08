import { t as bippoT } from "./i18n.js";
import React, { useState } from 'react';
import { db, cloud } from './store';
import { Brand } from './Landing';
export default function ResetPassword() {
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState('');
  return <><header className="nav wrap"><Brand /><a href="#dashboard">{bippoT("تسجيل الدخول")}</a></header><main className="panel login"><span className="eyebrow">{bippoT("حسابك في bippo")}</span><h1>{bippoT("اختار كلمة مرورك")}</h1><p>{bippoT("ما حطّيتش كلمة مرور، ولا نسيتها؟ دخل بريد الحساب ونبعثولك رابط باش تختارها بنفسك.")}</p>{sent ? <><p role="status" className="recovery-success">{bippoT("إذا كان البريد مربوط بحساب، تلقى فيه رابط اختيار كلمة المرور. شوف حتى البريد غير المرغوب فيه (Spam).")}</p><p>{bippoT("افتح آخر رسالة، واختار كلمة مرور فيها 12 حرف على الأقل. نفس الحساب يخدم للمحل وللإدارة إذا عندو الصلاحية.")}</p><button className="button outline" onClick={() => setSent(false)}>{bippoT("استعمل بريد آخر")}</button></> : <form className="recovery-form" onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
          if (!cloud) throw new Error(bippoT("اختيار كلمة المرور متاح في النسخة المتصلة فقط."));
          const {
            error
          } = await db.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: location.origin + location.pathname + '?setup=1'
          });
          if (error) {
            if (error.status === 429) throw new Error(bippoT("بعثنا طلب مؤخرًا. استنّى شوية وشوف بريدك قبل ما تعاود."));
            throw new Error(bippoT("ما قدرناش نبعثو الرابط. عاود جرّب بعد شوية."));
          }
          setSent(true);
        } catch (err) {
          setError(err.message || bippoT("تعذر الاتصال. عاود جرّب."));
        } finally {
          setBusy(false);
        }
      }}><label>{bippoT("البريد الإلكتروني")}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" dir="ltr" /></label><button className="button full" disabled={busy}>{busy ? bippoT("نبعثو الرابط…") : bippoT("ابعثلي رابط اختيار كلمة المرور")}</button>{error && <p className="error" role="alert">{error}</p>}</form>}<a className="recovery-back" href="#dashboard">{bippoT("ارجع لتسجيل الدخول")}</a></main></>;
}
