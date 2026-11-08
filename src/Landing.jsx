import { t as bippoT } from "./i18n.js";
import PublicFooter from './PublicFooter';
import Brand from './Brand';
import React, { useState, useEffect, useRef } from 'react';
import { Check, Plus, ArrowLeft, ScanLine, ChefHat, Monitor, Clock, ShieldCheck, Keyboard, Plug, Smartphone, CheckCheck } from 'lucide-react';
import DotNumber from './DotNumber';
import LiveDemo from './LiveDemo';
export { default as Brand } from './Brand';
const jump = id => e => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({
    behavior: 'smooth'
  });
};
function Phone({
  ready = false,
  compact = false
}) {
  return <div className={'reference-phone ' + (compact ? 'compact' : '')} aria-label={bippoT("معاينة صفحة الزبون")}><div className="island" /><div className="mock-shop"><span><ChefHat size={16} /></span>{bippoT("مقهى الرّواق")}</div><div className={'mock-ticket ' + (ready ? 'ready' : '')}><small>{bippoT("طلبك رقم")}</small><DotNumber value="57" /><h4>{ready ? bippoT("طلبك راه واجد ✓") : bippoT("رانا نحضّرولك طلبك")}</h4><p>{ready ? bippoT("طلبك واجد، تقدر تجي تديه") : bippoT("كي يوجد طلبك، الحالة تتبدّل هنا")}</p>{ready ? <span className="mock-success"><Check size={13} />{bippoT(" رانا نستناوك في الكونتوار")}</span> : <div className="waiting-dots">•••••</div>}</div><div className="mock-powered">{bippoT("ساهلة مع bippo")}</div><div className="home-indicator" /></div>;
}
function MiniOrder({
  ready = false,
  onClick
}) {
  return <div className="mini-order"><div className="mini-title"><b>{bippoT("لوحة الطلبات")}</b><span>{bippoT("مقهى الرّواق")}</span></div><div className="mini-body"><DotNumber value="57" /><div><b>{ready ? bippoT("واجد للاستلام") : bippoT("راه يتحضّر")}</b><small><Smartphone size={13} />{bippoT(" متابعة من صفحة الطلب")}</small></div></div>{onClick ? <button className="button full" onClick={onClick}>{bippoT("الطلب راه واجد ")}<Check size={16} /></button> : !ready ? <a className="button full" href="#try" onClick={jump('try')}>{bippoT("جرّب زر «جاهز»")}</a> : <div className="mini-badges"><span><Check />{bippoT(" جاهز")}</span><span><CheckCheck />{bippoT(" تحديث الصفحة")}</span><span className="green"><Monitor />{bippoT(" شاشة العرض")}</span></div>}</div>;
}
const howSteps = [[bippoT("يمسح الكود، ويتبع طلبو."), bippoT("دخل نمرة الطلب من لوحة المحل، واعطي للزبون الرابط ولا كود QR. يمسحو ويتحلّ طلبو مباشرة، بلا تسجيل.")], [bippoT("يقعد مرتاح، والنمرة معاه."), bippoT("ما لازمش يبقى واقف قدّام الكونتوار. يخلّي صفحة الطلب محلولة، والحالة تتبدّل وحدها.")], [bippoT("الطلب واجد؟ ضغطة وخلاص."), bippoT("كي تكمل التحضير، اضغط «جاهز». الزبون يشوف التغيير في صفحتو، والنمرة تبان في شاشة المحل.")], [bippoT("يشوف النمرة، ويجي يديه."), bippoT("الزبون يجي للكونتوار كي يوجد طلبو. كي تديهولو، علّم عليه «تسلّم الطلب» باش تبقى الخدمة منظّمة.")]];
function HowItWorks() {
  const [step, setStep] = useState(0);
  const nodes = useRef([]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const target = innerHeight * (innerWidth <= 700 ? .78 : .5);
      let best = 0,
        dist = Infinity;
      nodes.current.forEach((node, i) => {
        if (!node) return;
        const r = node.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - target);
        if (d < dist) {
          best = i;
          dist = d;
        }
      });
      setStep(best);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    addEventListener('scroll', onScroll, {
      passive: true
    });
    addEventListener('resize', onScroll);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return <section id="how" className="reference-how wrap"><div className="section-heading"><span className="kicker">{bippoT("من أول كود، حتى يدي طلبو")}</span><h2>{bippoT("كيفاش تخدم bippo؟")}</h2></div><div className="sticky-story"><div className="story-track">{howSteps.map(([title, desc], i) => <article ref={el => nodes.current[i] = el} className={'scroll-step ' + (step === i ? 'current' : '')} key={title}><DotNumber value={i + 1} className="step-digit" /><h3>{title}</h3><p>{desc}</p>{i === 2 && <MiniOrder />}{i === 3 && <div className="story-finish"><CheckCheck size={18} />{bippoT(" النمرة باينة في التليفون وفي الشاشة.")}</div>}</article>)}</div><div className="sticky-stage"><div className={'story-visual sticky-phone scene-' + (step + 1)} data-step={step + 1}><div className="stage-meta"><span>{bippoT("رحلة الطلب")}</span><b>0{step + 1} / 04</b></div><div className="phone-state" key={step}><Phone ready={step >= 2} /></div><div className="stage-dots" aria-label={bippoT("الخطوة ") + (step + 1)}>{howSteps.map((_, i) => <span className={step === i ? 'active' : ''} key={i} />)}</div>{step === 1 && <div className="quiet-label"><Clock size={15} />{bippoT(" خلّي الصفحة محلولة وتبع الحالة")}</div>}{step === 3 && <div className="pickup-banner"><CheckCheck size={17} />{bippoT(" روح للكونتوار، طلبك يستنّاك")}</div>}</div></div></div></section>;
}
export default function Landing() {
  useEffect(() => {
    const target = location.hash.slice(1);
    if (['try', 'how', 'features', 'faq'].includes(target)) {
      const id = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView());
      return () => cancelAnimationFrame(id);
    }
    window.scrollTo(0, 0);
  }, []);
  return <div className="marketing"><header className="site-header"><div className="nav wrap"><Brand /><nav aria-label={bippoT("روابط الصفحة")}><a href="#how" onClick={jump('how')}>{bippoT("كيفاش تخدم؟")}</a><a href="#features" onClick={jump('features')}>{bippoT("المزايا")}</a><a href="#try" onClick={jump('try')}>{bippoT("جرّبها")}</a><a href="#faq" onClick={jump('faq')}>{bippoT("الأسئلة الشائعة")}</a></nav><div className="nav-end"><a href="#dashboard">{bippoT("دخول")}</a><a className="button small" href="#signup">{bippoT("إنشاء حساب")}</a></div></div></header>
<main><section className="center-hero wrap"><span className="hero-tag"><ChefHat size={15} />{bippoT(" للمقاهي والمطاعم")}</span><h1>{bippoT("طلبك راه واجد؟")}<br />{bippoT("خلّي زبونك يعرف.")}</h1><p>{bippoT("كل طلب برقم، والزبون ديما على بالو.")}<br />{bippoT("يمسح الكود ويتبع طلبو. بلا حساب، بلا تطبيق.")}</p><div className="hero-buttons"><a className="button" href="#signup">{bippoT("إنشاء حساب مجاني")}</a><a className="button outline" href="#try" onClick={jump('try')}>{bippoT("شوف كيفاش تخدم ")}<ArrowLeft size={17} /></a></div><div className="hero-checks"><span><Check />{bippoT(" بلا أجهزة نداء")}</span><span><Check />{bippoT(" بلا ما يحمّل تطبيق")}</span><span><Check />{bippoT(" متابعة مباشرة")}</span></div><div className="hero-context"><span className="context-icon"><ScanLine /></span><span>{bippoT("من الكونتوار لتليفون الزبون.")}<b>{bippoT(" خدمة خفيفة، وراحة أكثر.")}</b></span></div></section>
<section className="cinema wrap" aria-label={bippoT("عرض توضيحي للطلب الجاهز")}><div className="cinema-grid" /><span className="cinema-label"><span />{bippoT(" هذه معاينة توضيحية لصفحة مفتوحة")}</span><div className="cinema-glow" /><Phone ready /><div className="cinema-caption"><DotNumber value="57" /><span>{bippoT("واجد للاستلام.")}<small>{bippoT("والزبون يعرف، من صفحته.")}</small></span></div></section>
<HowItWorks />
<section id="features" className="feature-area"><div className="wrap"><div className="section-heading"><span className="kicker">{bippoT("كل واش تحتاج باش تبدا")}</span><h2>{bippoT("خدمة منظّمة. وزبون مرتاح.")}</h2></div><div className="bento"><article className="bento-card wide"><div className="bento-text"><ScanLine /><h3>{bippoT("رابط واحد. طلب واحد.")}</h3><p>{bippoT("كل طلب عندو كود وحدو. الزبون يمسحو ويشوف النمرة والحالة، بلا ما يعمّر معلوماتو.")}</p></div><div className="black-widget qr-widget"><ScanLine size={72} /><span>{bippoT("امسح. تابع. استلم.")}</span><div className="widget-link">{bippoT("bippo / طلبك ")}<ArrowLeft size={14} /></div></div></article><article className="bento-card"><div className="black-widget number-widget"><div><small>{bippoT("راه يتحضّر")}</small><DotNumber value="03" /></div><div><small>{bippoT("واجد للاستلام")}</small><DotNumber value="02" /></div><div className="widget-bars">{[35, 54, 88, 67, 45, 60, 79, 52, 39, 47].map((h, i) => <i style={{
                    height: h
                  }} key={i} />)}</div><small>{bippoT("أرقام توضيحية · الشاشة تتحدث تلقائيًا")}</small></div><h3>{bippoT("نظرة وحدة تكفي.")}</h3><p>{bippoT("طلباتك مرتّبين حسب الحالة. زيد طلب، علّم كي يوجد، وسجّل كي يتسلّم، كامل من نفس البلاصة.")}</p></article><article className="bento-card"><div className="black-widget counter-widget"><small>{bippoT("بانتظار الاستلام")}</small><DotNumber value="57" /><div className="widget-dots">● ● ● ● ● ● ● ● ●</div></div><h3>{bippoT("الرقم باين للكل.")}</h3><p>{bippoT("بيّن نمرات الطلبات اللي وجدو في شاشة المحل، كبار وواضحين حتى من بعيد.")}</p></article><article className="bento-card wide"><div className="bento-text"><ShieldCheck /><h3>{bippoT("بلا أسماء. بلا نمرة تليفون.")}</h3><p>{bippoT("كل زبون يتبع طلبو برابط خاص. وفي النسخة المتصلة، غير فريقك المصرّح ليه يدخل للوحة.")}</p></div><div className="black-widget privacy-widget"><DotNumber value="0" /><span>{bippoT("تطبيقات للتحميل")}</span><div><Check />{bippoT(" رابط خاص بالطلب")}</div><div><Check />{bippoT(" دخول آمن للفريق")}</div><div><Check />{bippoT(" تجربة من المتصفح")}</div></div></article></div></div></section>
<LiveDemo />
<section className="setup-section"><div className="wrap setup-grid"><div><span className="kicker">{bippoT("على حساب خدمة محلّك")}</span><h2>{bippoT("ابدا بالساهل.")}<br />{bippoT("وكبّر على راحتك.")}</h2><p>{bippoT("ما تحتاجش تبدّل طريقة خدمتك. دخل نمرة التيكي، واعطي للزبون كود المتابعة.")}</p><div className="setup-point"><Keyboard /><div><h3>{bippoT("إدخال يدوي سريع")}</h3><p>{bippoT("دخل نمرة الطلب واضغط. تقدر تجرّب bippo في محلّك من نهار اللول.")}</p></div></div><div className="setup-point"><Plug /><div><h3>{bippoT("مساحة للتكامل لاحقًا")}</h3><p>{bippoT("الهيكل مجهز لإضافة أنظمة POS وخدمات التنبيه مستقبلًا. ليست مفعّلة في هذه النسخة.")}</p></div></div></div><div className="setup-tiles"><div><Keyboard /><b>{bippoT("لوحة الموظف")}</b><span>{bippoT("زيد ونظّم طلباتك")}</span></div><div><Smartphone /><b>{bippoT("صفحة الزبون")}</b><span>{bippoT("تبع بلا حساب")}</span></div><div><Monitor /><b>{bippoT("شاشة المحل")}</b><span>{bippoT("اعرض الأرقام بوضوح")}</span></div><div><ScanLine /><b>{bippoT("رابط وQR")}</b><span>{bippoT("خاص بكل طلب")}</span></div></div></div></section>
<section className="access-section wrap"><div className="section-heading"><span className="kicker">{bippoT("نسخة أولى، قابلة للتجربة")}</span><h2>{bippoT("جرّب الخدمة بنفسك.")}</h2><p>{bippoT("اختار واش يناسبك باش تبدا.")}</p></div><div className="access-cards"><article className="access-card"><h3>{bippoT("تجربة المتصفح")}</h3><p>{bippoT("لاكتشاف رحلة الطلب كاملة.")}</p><div className="access-price">{bippoT("بلا إعداد")}</div><ul><li><Check />{bippoT(" لوحة طلبات قابلة للاستخدام")}</li><li><Check />{bippoT(" روابط وQR للمتابعة")}</li><li><Check />{bippoT(" تزامن تبويبات المتصفح نفسه")}</li><li><Check />{bippoT(" بيانات تجريبية محلية")}</li></ul><a href="#dashboard" className="button outline full">{bippoT("افتح التجربة")}</a></article><article className="access-card featured"><span className="access-badge">{bippoT("للعمل بين الأجهزة")}</span><h3>{bippoT("تشغيل سحابي")}</h3><p>{bippoT("بعد ربط إعدادات Supabase.")}</p><div className="access-price">{bippoT("محلك، متصل")}</div><ul><li><Check />{bippoT(" دخول خاص بالفريق")}</li><li><Check />{bippoT(" متابعة من هاتف الزبون")}</li><li><Check />{bippoT(" فصل بيانات المحلات")}</li><li><Check />{bippoT(" قاعدة بيانات وتحديث تلقائي")}</li></ul><a href="#dashboard" className="button full">{bippoT("افتح لوحة المحل")}</a></article></div><p className="access-footnote">{bippoT("هذه أوضاع تشغيل النسخة الأولى، وليست باقات اشتراك مدفوعة.")}</p></section>
<section id="faq" className="faq-section"><div className="wrap faq-grid"><h2>{bippoT("عندك سؤال؟")}</h2><div>{[[bippoT("لازم الزبون يحمّل تطبيق؟"), bippoT("لا، غير يحلّ الرابط ولا يمسح QR بكاميرا تليفونو. صفحة الطلب تتحلّ مباشرة، بلا تحميل وبلا حساب.")], [bippoT("يوصل التنبيه والتليفون مغلوق؟"), bippoT("الرنة المخصصة تخدم كي تفعّل الصوت وتخلّي الصفحة محلولة. إشعارات الخلفية تحتاج دعم الجهاز وإذن الزبون وخدمة إشعارات مفعّلة؛ على iPhone يلزم إضافة الصفحة للشاشة الرئيسية. صوت الإشعار يرجع لإعدادات الهاتف.")], [bippoT("تخدم مع نظام الكاشير؟"), bippoT("تقدر تدخل نمرة التيكي يدويًا. الربط الآلي مع الكاشير نخلوه لمرحلة جاية.")], [bippoT("نحتاج أجهزة خاصة؟"), bippoT("يكفي جهاز فيه متصفح لفريق المحل، وتليفون للزبون. وتقدر تفتح شاشة النمرات في تلفاز يدعم المتصفح.")], [bippoT("التجربة تخدم بين أجهزة مختلفة؟"), bippoT("نعم، تجربة الهاتف في الموقع المنشور تخدم بين الكمبيوتر والهاتف بلا حساب. امسح QR وفعّل التنبيه. إذا تشغّل المشروع محليًا بلا قاعدة بيانات، المعاينة تكون في نفس المتصفح فقط.")], [bippoT("كيفاش تحميو بيانات المحل؟"), bippoT("في الوضع المتصل، كل موظف عندو حساب وبيانات كل محل مفصولين. الزبون يشوف غير حالة طلبو بالكود الخاص بيه.")]].map(([q, a]) => <details key={q}><summary>{q}<span><Plus size={17} /></span></summary><p>{a}</p></details>)}</div></div></section>
<section className="final-cta wrap"><span className="kicker">{bippoT("كونتوار بلا زحمة. وخدمة منظّمة.")}</span><h2>{bippoT("خلّي كل طلب")}<br />{bippoT("يلقى مولاه، بلا زحمة.")}</h2><a className="button" href="#signup">{bippoT("افتح حساب محلك ")}<ArrowLeft size={18} /></a></section></main><PublicFooter /></div>;
}
