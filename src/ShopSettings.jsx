import { t as bippoT } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { LogOut, Save, ImagePlus, Bell } from 'lucide-react';
import { cloud, db } from './store';
import { getSettings, saveSettings, readLogo } from './shopSettings';
import { shopActivity } from './shopActivities';
import CustomerPager from './CustomerPager';
import './shop-settings.css';
export default function ShopSettings({ customer = false, onSaved }) {
  const [form, setForm] = useState(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(''),
    [previewReady, setPreviewReady] = useState(false);
  useEffect(() => {
    let alive = true;
    getSettings().then(value => {
      if (!alive) return;
      setForm(value);
    }).catch(e => alive && setError(e.message));
    db?.auth.getUser().then(({
      data
    }) => alive && setEmail(data.user?.email || ''));
    return () => {
      alive = false;
    };
  }, []);
  const update = (field, value) => {
    setForm(v => ({
      ...v,
      [field]: value
    }));
    setMessage('');
  };
  return <div className={customer ? 'merchant-customizer' : ''}>
 <section className="panel shop-settings">
 <h2>{customer ? bippoT('هوية صفحة الزبون') : bippoT('إعدادات المحل')}</h2>
 <p>{bippoT('عرّف بمحلك. الاسم والشعار يبانوا للزبون في صفحة الطلب.')}</p>{error && <p role="alert" className="error">{error}</p>}{!form ? <p>{bippoT("نحمّلو الإعدادات…")}</p> : <form onSubmit={async e => {
      e.preventDefault();
      setBusy(true);
      setError('');
      setMessage('');
      try {
        const saved = await saveSettings(form);
        setForm(saved);
        onSaved?.(saved);
        setMessage(bippoT("تسجّلت إعدادات المحل."));
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    }}>
 {!customer && <section className="shop-review-section">
   <p>{bippoT("نوع النشاط")} · <strong>{shopActivity(form.kind).label}</strong></p>
   <label>{bippoT('طريقة متابعة الطلب')}
     <select disabled={busy} value={form.tracking_mode} onChange={e => update('tracking_mode', e.target.value)}>
       <option value="order">{bippoT('QR لكل طلب (افتراضي)')}</option>
       <option value="counter">{bippoT('QR ثابت عند الكونتوار')}</option>
     </select>
   </label>
   <p>{form.tracking_mode === 'counter'
     ? bippoT('بعد الحفظ، اطبع الملصق مرة وحدة. مع كل طلب، سلّم للزبون كود المتابعة.')
     : bippoT('الزبون يمسح QR من تيكي الطلب ويفتح طلبه مباشرة.')}</p>
 </section>}
 {customer && <div className="shop-logo-editor">{form.logo ? <img src={form.logo} alt={bippoT("شعار المحل")} /> : <span className="shop-logo-placeholder"><ImagePlus /></span>}<div><label>{bippoT("شعار المحل")}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              setError('');
              try {
                update('logo', await readLogo(file));
              } catch (e) {
                setError(e.message);
              } finally {
                setBusy(false);
                e.target.value = '';
              }
            }} /></label><small>{bippoT("PNG، JPG أو WebP · حتى 2 ميغا")}</small>{form.logo && <button type="button" className="icon-button" onClick={() => update('logo', '')}>{bippoT("نحّي الشعار")}</button>}</div></div>}
 {!customer && <><div className="shop-settings-grid"><label>{bippoT("اسم المحل")}<input required maxLength={100} value={form.name} onChange={e => update('name', e.target.value)} /></label><label>{bippoT("المدينة")}<input maxLength={100} value={form.city} onChange={e => update('city', e.target.value)} /></label></div>
 <label>{bippoT("عنوان المحل")}<input maxLength={200} value={form.address} onChange={e => update('address', e.target.value)} /></label></>}{customer && <><label>{bippoT("رسالة الاستلام للزبون")}<input required maxLength={180} value={form.pickup_message} onChange={e => update('pickup_message', e.target.value)} /></label><section className="shop-review-section"><h3>{bippoT("تقييمات Google بعد الاستلام")}</h3><p>{bippoT("الزبون يلقى رابط التقييم كي تعلّم الطلب «تسلّم الطلب». نفس الدعوة تظهر لجميع الزبائن، بلا فرز حسب الرضا.")}</p><label>{bippoT("رابط تقييم محلك على Google")}<input type="url" dir="ltr" maxLength={2048} placeholder="https://g.page/r/…/review" value={form.google_review_url || ''} onChange={e => update('google_review_url', e.target.value)} /></label><small>{bippoT("اختياري. من ملف محلك في Google: التقييمات ← الحصول على المزيد من التقييمات ← نسخ الرابط. ")}<a href="https://support.google.com/business/answer/16816815" target="_blank" rel="noopener noreferrer">{bippoT("شرح Google")}</a>{bippoT(". نحّي الرابط إذا حبيت توقف الدعوة.")}</small></section></>}<button className="button" disabled={busy}><Save size={18} /> {busy ? bippoT("نحفظو…") : bippoT("حفظ الإعدادات")}</button>{message && <p role="status" className="notice">{message}</p>}
 </form>}{!customer && <div className="shop-account"><h3>{bippoT("الحساب")}</h3>{email && <p dir="ltr">{email}</p>}{cloud && <a className="button outline" href="#account">{bippoT("تغيير كلمة المرور")}</a>}<button className="button logout-button" disabled={busy} onClick={async () => {
        setBusy(true);
        setError('');
        try {
          if (cloud) {
            const {
              error
            } = await db.auth.signOut();
            if (error) throw error;
          } else location.hash = '';
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}><LogOut size={18} />{bippoT(" تسجيل الخروج")}</button></div>}
 </section>
 {customer && form && <aside className="merchant-preview">
   <div className="merchant-preview-tabs" aria-label={bippoT('معاينة صفحة الزبون')}>
     <button type="button" aria-pressed={!previewReady} onClick={() => setPreviewReady(false)}>{bippoT('راه يتحضّر')}</button>
     <button type="button" aria-pressed={previewReady} onClick={() => setPreviewReady(true)}>{bippoT('جاهز')}</button>
   </div>
   <div className="merchant-phone">
     <CustomerPager branding={form} number="57" status={previewReady ? 'ready' : 'preparing'} preview>
       <span className="pager-action"><Bell size={17} />{previewReady ? bippoT('راني جاي') : bippoT('فعّل التنبيه')}</span>
     </CustomerPager>
   </div>
 </aside>}
 </div>;
}
