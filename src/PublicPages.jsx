import { t as bippoT } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUpLeft, Check, CheckCheck, ChefHat, Coffee, BookOpen, ScanLine, Smartphone, Bell, Clock, MessageCircle, ShieldCheck, Store } from 'lucide-react';
import Brand from './Brand';
import BipeurComparison from './BipeurComparison';
import PublicFooter from './PublicFooter';
import ServiceSolution from './ServiceSolution';
import { serviceSolutions } from './serviceSolutions';
import DotNumber from './DotNumber';
import { pageInfo, guideSteps, alertHelp, legalSections } from './publicContent';
import { supportPhone, supportWhatsApp, contactLink } from './contactDetails';
import './public-pages.css';
export default function PublicPages({
  page
}) {
  const info = pageInfo[page];
  useEffect(() => {
    window.scrollTo(0, 0);
    const old = document.title;
    document.title = info.tag + ' | bippo';
    return () => {
      document.title = old;
    };
  }, [page, info.tag]);
  const service = serviceSolutions[page];
  const legal = page === 'privacy' || page === 'terms';
  return <div className="public-page"><header className="public-header"><div className="wrap"><Brand /><nav aria-label={bippoT("روابط الصفحة")}><a href="#guide">{bippoT("دليل الاستعمال")}</a><a href="#contact">{bippoT("تواصل معنا")}</a></nav><div className="public-header-actions"><a href="#dashboard">{bippoT("دخول")}</a><a className="button small" href="#signup">{bippoT("إنشاء حساب")}</a></div></div></header><main id="public-main"><section className={'wrap public-hero ' + (legal ? 'legal-hero' : '')}><span className="public-kicker"><span />{info.tag}</span><h1>{info.title}</h1><p>{info.intro}</p>{legal ? <small className="legal-date">{bippoT("آخر تحديث: 8 نوفمبر 2026")}</small> : page !== 'contact' && <div className="public-hero-actions"><a className="button" href={service ? "#signup/" + service.kind : "#signup"}>{bippoT("افتح حساب محلك ")}<ArrowUpLeft size={18} /></a><a className="button outline" href="#try">{bippoT("جرّبها في هاتفك ")}<Smartphone size={18} /></a></div>}</section>{page === 'bipeur' ? <BipeurComparison /> : page === 'guide' ? <Guide /> : page === 'cafes' || page === 'restaurants' ? <Solution restaurant={page === 'restaurants'} /> : service ? <ServiceSolution info={service} /> : page === 'contact' ? <Contact /> : <Legal page={page} />}</main><PublicFooter /></div>;
}
function Guide() {
  return <><section className="wrap guide-layout"><aside className="guide-summary"><BookOpen size={25} /><h2>{bippoT("دير أول طلب، خطوة بخطوة.")}</h2><p>{bippoT("كل واش تحتاج: متصفح عند الكاشير، إنترنت وهاتف الزبون.")}</p><div><Check size={17} />{bippoT(" بلا أجهزة نداء")}</div><div><Check size={17} />{bippoT(" الزبون بلا حساب")}</div><div><Check size={17} />{bippoT(" السجل يبقى محفوظ")}</div></aside><ol className="guide-steps">{guideSteps.map(([title, body, label, route], i) => <li key={title}><span className="guide-number">{String(i + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p>{body}</p>{route && <a className="public-text-link" href={'#' + route}>{label}<ArrowLeft size={16} /></a>}</div></li>)}</ol></section><section className="wrap public-section"><div className="public-section-heading"><span className="public-kicker">{bippoT("إذا احتجت مساعدة")}</span><h2>{bippoT("التنبيه، خطوة بخطوة.")}</h2><p>{bippoT("دعم التنبيه يختلف بين الأجهزة. جرّب هاتفك قبل بداية الخدمة.")}</p></div><div className="public-help-grid">{alertHelp.map(([title, body], i) => <article className="public-help-card" key={title}>{i < 2 ? <Smartphone /> : <Bell />}<h3>{title}</h3><p>{body}</p></article>)}</div><div className="public-note"><ShieldCheck size={22} /><p>{bippoT("ما تشاركش كلمة مرورك أو رابط استرجاع الحساب. الدعم ما يحتاجهمش باش يعاونك.")}</p><a href="#contact">{bippoT("تواصل معانا ")}<ArrowLeft size={16} /></a></div></section></>;
}
function Solution({
  restaurant
}) {
  const cards = restaurant ? [[ChefHat, bippoT("من التحضير للاستلام"), bippoT("زيد نمرة التيكي. كي يوجد الطلب علّم عليه «جاهز»، وبعد التسليم علّم عليه «تسلّم الطلب».")], [ScanLine, bippoT("السفري بلا لخبطة"), bippoT("كل زبون عندو رابط طلب خاص. ما يتخلطش طلبو مع طلب الطاولة ولا طلب الزبون اللي بعدو.")], [Clock, bippoT("اعرف واش صرا في خدمتك"), bippoT("راجع السجل ومتوسط التحضير وفترات الزحمة حسب البيانات المسجلة. الطلبات المستلمة تبقى محفوظة.")]] : [[Coffee, bippoT("قهوة براحة"), bippoT("الزبون يمسح QR ويقعد. يتبع حالة طلبو من تليفونو، بلا ما يعاود يسقسي عند الكونتوار.")], [Store, bippoT("اسم محلك قدّام الزبون"), bippoT("ركّب شعارك ورسالة الاستلام من الإعدادات. صفحة الطلب تبقى بسيطة والنمرة واضحة.")], [Smartphone, bippoT("تجربة خفيفة"), bippoT("ما تطلبش من الزبون ينشئ حساب ولا يحمّل تطبيق باش يتبع طلبو. يفعّل التنبيه من الصفحة.")]];
  return <><section className="wrap solution-showcase"><div className="solution-copy"><span className="public-kicker">{bippoT("نمرة وحدة. خدمة أوضح.")}</span><h2>{restaurant ? bippoT("التيكي معروف، والطلب ما يتخلطش.") : bippoT("الزبون يقعد. والقهوة تتحضّر.")}</h2><p>{restaurant ? bippoT("الزبون يطلب عند الكاشير كي العادة. تضيف النمرة في bippo وتعطيه QR. هو يتبع، وفريقك يكمّل التحضير.") : bippoT("من الكاشير للبار، كل طلب عندو نمرة. كي توجد القهوة، الحالة تتبدّل والزبون يعرف بلي يقدر يجي يديها.")}</p><ul><li><Check />{bippoT(" إضافة الرقم من لوحة المحل")}</li><li><Check />{bippoT(" متابعة من هاتف الزبون")}</li><li><Check />{bippoT(" السجل يبقى بعد التسليم")}</li></ul><a className="public-text-link" href="#guide">{bippoT("شوف الخطوات كاملة ")}<ArrowLeft size={17} /></a></div><div className="solution-visual" aria-label={bippoT("مثال توضيحي لطلب")}><div className="solution-demo-meta"><span>{restaurant ? bippoT("مطعمك") : bippoT("مقهى الحومة")}</span><small>{bippoT("مثال توضيحي")}</small></div><div className="solution-demo-ticket"><span>{bippoT("طلبك رقم")}</span><DotNumber value={restaurant ? '104' : '57'} /><h3>{bippoT("طلبك راه واجد!")}</h3><p>{bippoT("تقدر تجي تديه من الكونتوار.")}</p><div><CheckCheck size={18} />{bippoT(" النمرة واضحة. والاستلام ساهل.")}</div></div><div className="solution-demo-mini"><ChefHat size={22} /><span>{bippoT("الطلب تسلّم")}</span><span>{bippoT("محفوظ في السجل ")}<Check size={15} /></span></div></div></section><section className="wrap public-section"><div className="public-section-heading"><span className="public-kicker">{bippoT("موجّه لخدمة محلّك")}</span><h2>{restaurant ? bippoT("التحضير منظّم. والاستلام أوضح.") : bippoT("أقل زحمة. أكثر راحة.")}</h2></div><div className="solution-benefits">{cards.map(([Icon, title, body]) => <article key={title}><span><Icon size={24} /></span><h3>{title}</h3><p>{body}</p></article>)}</div><div className="public-note"><Bell size={22} /><p>{bippoT("جرّب التنبيه على أجهزة زبائنك. إذا ما تأكدتش من انتباه الزبون، ناديلو من المحل. تكامل الكاشير وواتساب مازال ما تفعّلوش في النسخة الحالية.")}</p></div></section><section className="wrap public-cta"><span className="public-kicker">{bippoT("ابدا بالساهل")}</span><h2>{bippoT("جرّب bippo في محلّك.")}</h2><p>{bippoT("افتح حسابك، ركّب شعارك وزيد أول طلب.")}</p><a className="button" href="#signup">{bippoT("إنشاء حساب مجاني ")}<ArrowUpLeft size={18} /></a></section></>;
}
function Contact() {
  const [name, setName] = useState(''),
    [shop, setShop] = useState(''),
    [topic, setTopic] = useState(bippoT("مساعدة في البداية")),
    [message, setMessage] = useState('');
  return <><section className="wrap contact-layout"><div className="contact-options"><article><span className="contact-icon"><MessageCircle size={27} /></span><h2>{bippoT("نهدروا في واتساب.")}</h2><p>{bippoT("الدعم، الاستفسارات وطلبات عرض الخدمة. اشرح لنا واش تحتاج ونكملو معاك من تما.")}</p><a className="contact-phone" href={supportWhatsApp} target="_blank" rel="noopener noreferrer" dir="ltr">{supportPhone}</a><a className="button" href={supportWhatsApp} target="_blank" rel="noopener noreferrer">{bippoT("افتح واتساب ")}<ArrowUpLeft size={17} /></a></article><div className="contact-quick"><h3>{bippoT("قبل ما تراسلنا")}</h3><a href="#guide">{bippoT("كيفاش نبدا ونزيد أول طلب؟ ")}<ArrowLeft size={16} /></a><a href="#guide">{bippoT("التنبيه ما راهوش يوصل؟ ")}<ArrowLeft size={16} /></a><a href="#reset">{bippoT("نسيت كلمة المرور؟ ")}<ArrowLeft size={16} /></a></div></div><form className="contact-form" onSubmit={e => {
        e.preventDefault();
        window.open(contactLink({
          name,
          shop,
          topic,
          message
        }), '_blank', 'noopener,noreferrer');
      }}><h2>{bippoT("حضّر رسالتك")}</h2><p>{bippoT("نفتحولك الرسالة في واتساب. راجعها واضغط إرسال بنفسك.")}</p><div className="contact-form-grid"><label>{bippoT("اسمك — اختياري")}<input autoComplete="name" maxLength={80} value={name} onChange={e => setName(e.target.value)} /></label><label>{bippoT("اسم المحل — اختياري")}<input autoComplete="organization" maxLength={100} value={shop} onChange={e => setShop(e.target.value)} /></label></div><label>{bippoT("واش تحتاج؟")}<select value={topic} onChange={e => setTopic(e.target.value)}>{[bippoT("مساعدة في البداية"), bippoT("مشكل في الحساب أو التنبيه"), bippoT("طلب عرض الخدمة لمحلي"), bippoT("استفسار عن بياناتي أو الخصوصية"), bippoT("اقتراح آخر")].map(v => <option key={v}>{v}</option>)}</select></label><label>{bippoT("رسالتك")}<textarea required minLength={5} maxLength={1200} rows={5} placeholder={bippoT("قولنا واش صرا، ونوع الهاتف والمتصفح إذا المشكل في التنبيه…")} value={message} onChange={e => setMessage(e.target.value)} /></label><small>{bippoT("ما تكتبش كلمة مرور أو معلومات حساسة. النموذج ما يبعثش رسالة تلقائيًا. عند الضغط نمرّر النص إلى واتساب، ومنه تختار إرسال الرسالة للدعم.")}</small><button className="button">{bippoT("حضّر الرسالة في واتساب ")}<MessageCircle size={18} /></button></form></section><section className="wrap public-note"><BookOpen size={23} /><p>{bippoT("حاب تشوف الخدمة قبل التواصل؟ التجربة في صفحة الهبوط متاحة بلا حساب.")}</p><a href="#try">{bippoT("افتح التجربة ")}<ArrowLeft size={16} /></a></section></>;
}
function Legal({
  page
}) {
  return <div className="wrap legal-layout"><aside><h2>{bippoT("في هذه الصفحة")}</h2>{legalSections[page].map(([title], i) => <button key={title} onClick={() => document.getElementById('legal-' + i)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })}>{title}</button>)}<a className="public-text-link" href="#contact">{bippoT("عندك استفسار؟ ")}<ArrowLeft size={15} /></a></aside><article className="legal-content">{legalSections[page].map(([title, body], i) => <section key={title} id={'legal-' + i}><h2>{title}</h2><p>{body}</p></section>)}{page === 'privacy' && <section><h2>{bippoT("سياسات مزوّدي التشغيل")}</h2><p className="legal-provider-links"><a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">Supabase</a><a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Cloudflare</a><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google</a></p></section>}<div className="legal-contact"><MessageCircle size={22} /><div><h3>{bippoT("تحتاج توضيحًا؟")}</h3><p>{bippoT("راسل فريق bippo عبر ")}<a href="#contact">{bippoT("صفحة التواصل")}</a>.</p></div></div></article></div>;
}
