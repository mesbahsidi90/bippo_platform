import { t as bippoT } from "./i18n.js";
import React from 'react';
import Brand from './Brand';
import { ArrowUpLeft } from 'lucide-react';
import './public-pages.css';
export const footerGroups = [['bippo', [[bippoT("كيفاش تخدم؟"), 'how'], [bippoT("جرّبها في هاتفك"), 'try'], [bippoT("إنشاء حساب"), 'signup'], [bippoT("تسجيل الدخول"), 'dashboard']]], [bippoT("الحلول"), [[bippoT("للمقاهي"), 'cafes'], [bippoT("للمطاعم"), 'restaurants'], [bippoT("مغاسل الملابس"), 'laundries'], [bippoT("مغاسل السيارات"), 'car-washes'], [bippoT("الخياطون"), 'tailors'], [bippoT("قارن مع جهاز النداء"), 'bipeur']]], [bippoT("نعاونـوك"), [[bippoT("دليل الاستعمال"), 'guide'], [bippoT("تواصل معنا"), 'contact']]], [bippoT("ثقة ووضوح"), [[bippoT("سياسة الخصوصية"), 'privacy'], [bippoT("شروط الاستعمال"), 'terms']]]];
export default function PublicFooter() {
  return <footer className="public-footer"><div className="wrap public-footer-top"><div className="public-footer-brand"><Brand /><p>{bippoT("نمرة الطلب في تليفونو.")}<br />{bippoT("وراحة أكثر في محلّك.")}</p><a className="footer-start" href="#signup">{bippoT("ابدا مع bippo ")}<ArrowUpLeft size={16} /></a></div><nav className="public-footer-links" aria-label={bippoT("روابط الفوتر")}>{footerGroups.map(([title, links]) => <div key={title}><h2>{title}</h2>{links.map(([label, route]) => <a key={route} href={'#' + route}>{label}</a>)}</div>)}</nav></div><div className="wrap public-footer-bottom"><small>© {new Date().getFullYear()}{bippoT(" bippo · من الطلب حتى الاستلام.")}</small><span>{bippoT("للمقاهي والمطاعم وخدمات الاستلام، بروح جزائرية.")}</span></div></footer>;
}
