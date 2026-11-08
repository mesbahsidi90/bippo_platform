import { t as bippoT } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import Brand from './Brand';
import { cloud, db } from './store';
export default function Signup() {
  const [shop, setShop] = useState(''),
    [kind, setKind] = useState('cafe'),
    [city, setCity] = useState(''),
    [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [session, setSession] = useState(null),
    [loading, setLoading] = useState(cloud),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (!db) return;
    let alive = true;
    db.auth.getSession().then(({
      data,
      error
    }) => {
      if (alive) {
        setSession(data.session);
        setLoading(false);
        if (error) setError(bippoT("تعذر الاتصال. عاود تحميل الصفحة."));
      }
    });
    return () => {
      alive = false;
    };
  }, []);
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!session && password !== confirm) {
      setError(bippoT("كلمتا المرور ماشي كيف كيف."));
      return;
    }
    setBusy(true);
    try {
      if (!cloud) {
        localStorage.setItem('bippo-shop-settings', JSON.stringify({
          name: shop.trim(),
          city: city.trim()
        }));
        location.hash = 'dashboard';
        return;
      }
      let active = session;
      if (!active) {
        const {
          data,
          error
        } = await db.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;
        active = data.session;
        setSession(active);
        if (!active) throw new Error(bippoT("الحساب تسجّل، لكن الدخول المباشر مازال غير مفعّل. تواصل مع إدارة bippo."));
      }
      const {
        error
      } = await db.rpc('create_my_shop', {
        shop_name: shop.trim(),
        shop_kind: kind,
        shop_city: city.trim()
      });
      if (error) throw error;
      location.hash = 'dashboard';
    } catch (e) {
      setError(e.code === 'user_already_exists' ? bippoT("هذا البريد عندو حساب. ادخل من صفحة الدخول.") : e.code === 'weak_password' ? bippoT("اختار كلمة مرور أقوى، 12 حرف على الأقل.") : e.status === 429 ? bippoT("محاولات كثيرة. استنى شوية وعاود.") : e.message || bippoT("ما قدرناش نكملو التسجيل. عاود المحاولة."));
    } finally {
      setBusy(false);
    }
  }
  return <><header className="nav wrap"><Brand /><a href="#dashboard">{bippoT("عندك حساب؟ ادخل")}</a></header><form className="panel login" onSubmit={submit}><span className="eyebrow">{bippoT("مرحبا بيك في bippo")}</span><h1>{session ? bippoT("كمّل إعداد محلك") : bippoT("افتح حساب لمحلك")}</h1><p>{bippoT("نظّم الطلبات وخلّي زبائنك يتبعوها بسهولة.")}</p><label>{bippoT("اسم المحل")}<input autoComplete="organization" required maxLength={100} value={shop} onChange={e => setShop(e.target.value)} /></label><label>{bippoT("نوع النشاط")}<select value={kind} onChange={e => setKind(e.target.value)}><option value="cafe">{bippoT("مقهى")}</option><option value="restaurant">{bippoT("مطعم")}</option><option value="other">{bippoT("نشاط آخر")}</option></select></label><label>{bippoT("المدينة — اختياري")}<input autoComplete="address-level2" maxLength={100} value={city} onChange={e => setCity(e.target.value)} /></label>{!session && <><label>{bippoT("البريد الإلكتروني")}<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>{bippoT("كلمة المرور")}<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>{bippoT("عاود كلمة المرور")}<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><small>{bippoT("12 حرف على الأقل. تأكد من بريدك باش تقدر ترجع حسابك إذا نسيت كلمة المرور.")}</small></>}{error && <p role="alert" className="error">{error}</p>}<button className="button full" disabled={busy || loading}>{busy ? bippoT("نوجدو حسابك…") : session ? bippoT("افتح لوحة المحل") : bippoT("أنشئ الحساب")}</button><small>{cloud ? bippoT("الدخول مباشرة، بلا رسالة تأكيد للبريد.") : bippoT("وضع تجريبي: ما يتنشأش حساب حقيقي.")}</small><a className="recovery-back" href="#dashboard">{bippoT("عندك حساب؟ ادخل من هنا")}</a><p className="signup-legal-links">{bippoT("اطّلع على ")}<a href="#terms">{bippoT("شروط الاستعمال")}</a>{bippoT(" و")}<a href="#privacy">{bippoT("سياسة الخصوصية")}</a>{bippoT("، أو ")}<a href="#contact">{bippoT("تواصل معانا")}</a>.</p></form></>;
}
