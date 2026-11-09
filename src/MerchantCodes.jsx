import React, { useEffect, useState } from 'react';
import { Monitor, Printer, ScanLine, Settings, ChefHat } from 'lucide-react';
import { t, ticketLink } from './i18n.js';
import { cloud, db } from './store';
import { CounterPoster } from './CounterTicket';

function WaitingScreen({ shopId }) {
  const [link, setLink] = useState(cloud ? null : ticketLink('display/local'));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!cloud) return;
    let active = true;
    async function load() {
      try {
        const result = await db.from('shops').select('display_token').eq('id', shopId).single();
        if (result.error || !result.data?.display_token) throw new Error();
        if (active) setLink(ticketLink('display/' + result.data.display_token));
      } catch {
        if (active) setError(t('تعذر تحميل رابط شاشة الانتظار.'));
      }
    }
    load();
    return () => { active = false; };
  }, [shopId]);

  return (
    <article className="panel merchant-code-card">
      <Monitor size={21} />
      <h2>{t('شاشة الانتظار')}</h2>
      <p>{t('افتح الرابط في متصفح التلفزيون أو التابلت لعرض أرقام الطلبات.')}</p>
      {error && <p role="alert" className="error">{error}</p>}
      {!link && !error && <p role="status">{t('جارٍ الاتصال…')}</p>}
      {link && <>
        <input aria-label={t('رابط شاشة الانتظار')} dir="ltr" readOnly value={link} onFocus={e => e.target.select()} />
        <a className="button small" href={link} target="_blank" rel="noreferrer">{t('افتح الشاشة')}</a>
        <button type="button" className="button outline small" onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          } catch {
            setError(t('انسخ الرابط من الحقل.'));
          }
        }}>{copied ? t('نُسخ الرابط') : t('نسخ الرابط')}</button>
      </>}
    </article>
  );
}

export default function MerchantCodes({ shop, error, onOrders, onSettings, foodService }) {
  if (error) return <p role="alert" className="error">{error}</p>;
  if (!shop) return <p role="status">{t('نحمّلو الإعدادات…')}</p>;
  const fixed = shop.tracking_mode === 'counter';
  const Icon = fixed ? Printer : ScanLine;
  return (
    <div className="merchant-code-grid">
      <article className="panel merchant-code-card">
        <Icon size={21} />
        <h2>{fixed ? t('QR ثابت عند الكونتوار') : t('QR لكل طلب (افتراضي)')}</h2>
        {fixed ? <CounterPoster shop={shop} /> : <>
          <p>{t('افتح رمز المتابعة من بطاقة الطلب، أو أنشئ طلبًا جديدًا.')}</p>
          <button type="button" className="button small" onClick={onOrders}>{t('مساحة العمل')}</button>
        </>}
        <button type="button" className="button outline small" onClick={onSettings}>
          <Settings size={16} />{t('طريقة متابعة الطلب')}
        </button>
      </article>
      <WaitingScreen key={shop.shop_id} shopId={shop.shop_id} />
      {foodService && <article className="panel merchant-code-card">
        <ChefHat size={21} />
        <h2>{t('شاشة المطبخ')}</h2>
        <p>{t('من التابلت في المطبخ، علّم الطلب جاهز باش يتحدّث عند الزبون.')}</p>
        <a className="button small" href={ticketLink('dashboard/kitchen')} target="_blank" rel="noreferrer">{t('افتح الشاشة')}</a>
      </article>}
    </div>
  );
}
