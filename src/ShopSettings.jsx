import { t as bippoT } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { LogOut, Save } from 'lucide-react';
import { cloud, db } from './store';
import { getSettings, saveSettings } from './shopSettings';
import { shopActivity } from './shopActivities';
import { rememberBranch } from './merchantBranches';
import './shop-settings.css';
export default function ShopSettings({ onSaved }) {
  const [form, setForm] = useState(null),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState('');
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
  return <section className="panel shop-settings">
 <h2>{bippoT('إعدادات المحل')}</h2>
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
 <section className="shop-review-section">
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
 </section>
 <div className="shop-settings-grid"><label>{bippoT("اسم المحل")}<input required maxLength={100} value={form.name} onChange={e => update('name', e.target.value)} /></label><label>{bippoT("المدينة")}<input maxLength={100} value={form.city} onChange={e => update('city', e.target.value)} /></label></div>
 <label>{bippoT("عنوان المحل")}<input maxLength={200} value={form.address} onChange={e => update('address', e.target.value)} /></label><button className="button" disabled={busy}><Save size={18} /> {busy ? bippoT("نحفظو…") : bippoT("حفظ الإعدادات")}</button>{message && <p role="status" className="notice">{message}</p>}
 </form>}<div className="shop-account"><h3>{bippoT("الحساب")}</h3>{email && <p dir="ltr">{email}</p>}{cloud && <a className="button outline" href="#account">{bippoT("تغيير كلمة المرور")}</a>}<button className="button logout-button" disabled={busy} onClick={async () => {
        setBusy(true);
        setError('');
        try {
          if (cloud) {
            const {
              error
            } = await db.auth.signOut();
            if (error) throw error;
            rememberBranch(null);
          } else location.hash = '';
        } catch (e) {
          setError(e.message);
        } finally {
          setBusy(false);
        }
      }}><LogOut size={18} />{bippoT(" تسجيل الخروج")}</button></div></section>;
}
