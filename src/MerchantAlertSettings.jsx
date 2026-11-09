import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { t } from './i18n.js';
import { alertTones, toneSource } from './alertTones';
import './merchant-alert-settings.css';

export default function MerchantAlertSettings({ form, update, busy }) {
  const preview = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => () => preview.current?.pause(), []);
  const copy = form.alert_copy;
  const fields = [
    ['ar_title', 'العنوان بالعربية', 'طلبك راه واجد!', 65, 'rtl'],
    ['fr_title', 'العنوان بالفرنسية', 'Votre commande est prête !', 65, 'ltr'],
    ['ar_body', 'النص بالعربية', 'الطلب {number} واجد. استلمه من {venue}.', 145, 'rtl'],
    ['fr_body', 'النص بالفرنسية', 'Commande {number} · À retirer chez {venue}.', 145, 'ltr']
  ];

  function audition(tone) {
    preview.current?.pause();
    setError('');
    update('alert_tone', tone);
    const player = new Audio(toneSource(tone));
    preview.current = player;
    player.play().catch(() => {
      if (preview.current === player) setError(t('تعذر سماع الرنة. عاود المحاولة.'));
    });
  }

  return <>
    <section className="merchant-alert-card">
      <h3>{t('صوت التنبيه')}</h3>
      <p>{t('اختار الرنة واضغط عليها باش تسمعها قبل الحفظ.')}</p>
      <div className="merchant-alert-tones" role="group" aria-label={t('صوت التنبيه')}>
        {Object.entries(alertTones).map(([key, label]) => (
          <button key={key} type="button" className="button outline small" aria-pressed={form.alert_tone === key}
            disabled={busy} onClick={() => audition(key)}><Play size={14} />{t(label)}</button>
        ))}
      </div>
      {error && <p role="alert" className="error">{error}</p>}
    </section>
    <section className="merchant-alert-card">
      <h3>{t('نص التنبيه')}</h3>
      <p>{t('خلّي الحقل فارغ للنص الافتراضي. استعمل {number} لرقم الطلب و{venue} لاسم الفرع.')}</p>
      <div className="shop-settings-grid">
        {fields.map(([key, label, placeholder, length, dir]) => (
          <label key={key}>{t(label)}<input value={copy[key] || ''} dir={dir} maxLength={length}
            placeholder={placeholder} onChange={event => update('alert_copy', { ...copy, [key]: event.target.value })} /></label>
        ))}
      </div>
    </section>
  </>;
}
