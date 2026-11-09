import React from 'react';
import { Bell, Check, ScanLine, Ticket } from 'lucide-react';
import { t } from './i18n.js';

export default function ServiceSolution({ info }) {
  const steps = [
    [Ticket, info.firstStep, info.firstDetail],
    [ScanLine, t('يتابع من تليفونو'), t('يمسح QR التيكي مباشرة، أو يمسح QR الثابت عند الكونتوار ويدخل الكود، ثم يفعّل التنبيه.')],
    [Bell, t('علّم الخدمة «جاهزة»'), t('كي تكمل الخدمة، اضغط «جاهز» في لوحة المحل. الحالة تتحدّث في صفحة الزبون، والتنبيه يتبع أذونات تليفونو.')]
  ];

  return (
    <section className="wrap public-section">
      <div className="public-section-heading">
        <h2>{t('كيفاش تخدم في محلك؟')}</h2>
      </div>
      <div className="solution-benefits">
        {steps.map(([Icon, title, description]) => (
          <article key={title}>
            <span><Icon size={24} /></span>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </div>
      <div className="public-note">
        <Bell size={22} />
        <p>{t('التجربة الحالية للخدمات اللي تكمل في نفس النهار. المتابعة صالحة 24 ساعة من إنشاء التيكي.')}</p>
      </div>
      <div className="public-cta">
        <span className="public-kicker"><Check size={16} />{t('اضبط رسالة الاستلام')}</span>
        <h2>{info.pickup}</h2>
        <p>{t('هذا مثال تقدر تحطّو في «رسالة الاستلام للزبون» في إعدادات المحل.')}</p>
        <a className="button" href={"#signup/" + info.kind}>{t('إنشاء حساب')}</a>
      </div>
    </section>
  );
}
