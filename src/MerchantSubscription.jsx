import React, { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { cloud, db } from './store';
import { t, locale } from './i18n.js';
import { subStates } from './adminData';
import { supportWhatsApp } from './contactDetails';

export default function MerchantSubscription({ shopId, shopError }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!cloud || !shopId) return;
    let active = true;
    async function load() {
      try {
        const { data, error } = await db.from('subscriptions')
          .select('status,period_end,plans(name,monthly_price,currency)')
          .eq('shop_id', shopId).maybeSingle();
        if (error) throw error;
        if (active) setResult({ shopId, data });
      } catch {
        if (active) setResult({ shopId, error: true });
      }
    }
    load();
    return () => { active = false; };
  }, [shopId]);

  if (!cloud) return <p>{t('وضع تجريبي · البيانات في هذا المتصفح فقط')}</p>;
  if (shopError || (result?.shopId === shopId && result?.error)) {
    return <p role="alert" className="error">{t('تعذر تحميل الاشتراك.')}</p>;
  }
  if (!result || result.shopId !== shopId) return <p role="status">{t('جارٍ الاتصال…')}</p>;
  const subscription = result.data;
  if (!subscription) return <p>{t('ما كاش اشتراك مربوط بهذا المحل.')}</p>;

  const plan = subscription.plans;
  const price = plan?.monthly_price == null ? '—' :
    new Intl.NumberFormat(locale, { style: 'currency', currency: plan.currency }).format(Number(plan.monthly_price));
  return (
    <section className="panel merchant-code-card">
      <CreditCard size={22} />
      <h2>{t('الباقة الحالية')}</h2>
      <strong>{plan?.name || '—'}</strong>
      <dl className="merchant-plan">
        <div><dt>{t('حالة الاشتراك')}</dt><dd>{subStates[subscription.status] || '—'}</dd></div>
        <div><dt>{t('سعر الباقة شهريًا')}</dt><dd>{price}</dd></div>
        <div><dt>{t('تاريخ نهاية الاشتراك')}</dt><dd>{subscription.period_end
          ? new Date(subscription.period_end).toLocaleDateString(locale)
          : t('بدون تاريخ نهاية')}</dd></div>
      </dl>
      <a className="button outline small" href={supportWhatsApp} target="_blank" rel="noopener noreferrer">
        {t('تواصل معنا لتغيير الباقة')}
      </a>
    </section>
  );
}
