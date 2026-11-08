import React from 'react';
import Brand from './Brand';
import {ArrowUpLeft} from 'lucide-react';
import './public-pages.css';
export const footerGroups=[
 ['bippo',[['كيفاش تخدم؟','how'],['جرّبها في هاتفك','try'],['إنشاء حساب','signup'],['تسجيل الدخول','dashboard']]],
 ['لمحلّك',[['للمقاهي','cafes'],['للمطاعم','restaurants'],['قارن مع جهاز النداء','bipeur']]],
 ['نعاونـوك',[['دليل الاستعمال','guide'],['تواصل معنا','contact']]],
 ['ثقة ووضوح',[['سياسة الخصوصية','privacy'],['شروط الاستعمال','terms']]],
];
export default function PublicFooter(){return <footer className="public-footer"><div className="wrap public-footer-top"><div className="public-footer-brand"><Brand/><p>نمرة الطلب في تليفونو.<br/>وراحة أكثر في محلّك.</p><a className="footer-start" href="#signup">ابدا مع bippo <ArrowUpLeft size={16}/></a></div><nav className="public-footer-links" aria-label="روابط الفوتر">{footerGroups.map(([title,links])=><div key={title}><h2>{title}</h2>{links.map(([label,route])=><a key={route} href={'#'+route}>{label}</a>)}</div>)}</nav></div><div className="wrap public-footer-bottom"><small>© {new Date().getFullYear()} bippo · من الطلب حتى الاستلام.</small><span>صُمّمت للمقاهي والمطاعم، بروح جزائرية.</span></div></footer>}
