import { language, translate } from "./i18n.js";
import React,{lazy,Suspense} from 'react';
import Brand from './Brand';
import { Check, Layers } from 'lucide-react';
import DotNumber from './DotNumber';
import { contrastInk, customerLinkLabels, customerPalette } from './customerThemes';
import './customer-pager.css';
const WaitingGame=lazy(()=>import('./WaitingGame'));
export default function CustomerPager({
  branding,
  number,
  status,
  acknowledged = false,
  demo = false,
  preview = false,
  previewLanguage,
  error = '',
  loading = false,
  children,
  extra
}) {
  const lang = previewLanguage || language;
  const bippoT = text => translate(text, lang);
  const pickup = branding?.pickup_message;
  const pickupMessage = !pickup || pickup === 'تقدر تجي تديه من الكونتوار.'
    ? bippoT('تقدر تجي تديه من الكونتوار.') : pickup;
  const calling = status === 'ready' && !acknowledged,
    finished = status === 'collected';
  const title = loading ? bippoT("نوجدو طلبك…") : !number ? bippoT("الرابط غير متاح") : finished ? bippoT("بالصحة والراحة!") : calling ? bippoT("طلبك راه واجد!") : status === 'ready' ? bippoT("طلبك واجد للاستلام") : bippoT("طلبك راه يتحضّر");
  const Ticket = preview ? 'section' : 'main';
  const Heading = preview ? 'h3' : 'h1';
  const theme = customerPalette(branding);
  const background = branding?.customer_background_image;
  const safeBackground = typeof background === 'string' && background.length <= 180000 &&
    /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(background);
  const waitingGame = number && status === 'preparing' && !error && theme.game !== false;
  const Link = preview ? 'span' : 'a';
  const linkProps = href => preview ? {} : { href, target: '_blank', rel: 'noopener noreferrer' };
  return <div className={'pager-page ' + (calling ? 'pager-calling' : '')} dir={lang === 'fr' ? 'ltr' : 'rtl'} lang={lang} style={{
    '--customer-paper': theme.paper,
    '--customer-ticket': theme.ticket,
    '--customer-display': contrastInk(theme.digits) === '#ffffff' ? '#f2f4ef' : theme.display,
    '--customer-digits': theme.digits,
    '--customer-ink': contrastInk(theme.ticket),
    '--customer-paper-ink': contrastInk(theme.paper),
    '--customer-brand': theme.brand || '#102e29',
    '--customer-image': safeBackground ? 'url('+ background +')' : 'none'
  }}>
  <header className="pager-shop"><span className="pager-shop-logo" aria-hidden="true">{branding?.logo ? <img src={branding.logo} alt="" /> : Array.from({
          length: 9
        }, (_, i) => <i key={i} />)}</span><div><b>{branding?.name || (demo ? bippoT("مقهى bippo") : bippoT("طلبك في bippo"))}</b><span>{branding?.city || (demo ? bippoT("فرع التجربة") : bippoT("نمرة وحدة. وراحة أكثر."))}</span></div></header>
  <Ticket className="pager-ticket">
   <div className="pager-display" aria-label={bippoT("رقم الطلب")}>{number ? <DotNumber value={number} /> : <span className="pager-loading">…</span>}{status === 'preparing' && <div className="pager-waiting-dots" aria-hidden="true">{Array.from({
            length: 12
          }, (_, i) => <i key={i} />)}</div>}</div>
   <div className="pager-status-copy" aria-live="polite"><Heading>{title}</Heading>{number && <p>{finished ? bippoT("يعطيك الصحة على الزيارة.") : status === 'ready' ? pickupMessage : bippoT("ننبّهوك كي يوجد، اقعد مرتاح.")}</p>}</div>
   {acknowledged && status === 'ready' ? <div className="pager-confirmed"><Check size={22} />{bippoT(" راني جاي، الرنة حبست")}</div> : children}
   {error && <p className="pager-connection" role="status">{number ? bippoT("الاتصال راه يتعاود…") : error}</p>}
  </Ticket>
  {waitingGame && (preview ? <div className="pager-links"><span><Layers size={16} />{bippoT('طلّع قهوتك')}</span></div> : <Suspense fallback={null}><WaitingGame key={number}/></Suspense>)}
  {!calling && number && (branding?.banner_text || branding?.banner_image) &&
    <aside className={'pager-banner' + (theme.bannerMode === 'offer' ? ' pager-offer' : '')}>
      {theme.bannerMode === 'offer' && <strong>{bippoT('عرض')}</strong>}
      {branding.banner_image && <img src={branding.banner_image} alt={branding.banner_text ? '' : bippoT('بانر المحل')} />}
      {branding.banner_text && <p>{branding.banner_text}</p>}
      {theme.bannerMode === 'offer' && theme.offerUrl && <Link {...linkProps(theme.offerUrl)}>{bippoT('شوف العرض')}</Link>}
    </aside>}
  {!calling && number && theme.links && <nav className="pager-links" aria-label={bippoT('الروابط')}>
    {Object.entries(theme.links).map(([key, url]) => <Link key={key} {...linkProps(url)}>{bippoT(customerLinkLabels[key])}</Link>)}
  </nav>}
  {!calling && extra && <aside className="pager-extra">{extra}</aside>}
  {!calling && <footer className="pager-powered">{bippoT("ساهلة مع ")}<Brand linked={!preview} />{demo && <small>{bippoT("تجربة بلا حساب")}</small>}</footer>}
 </div>;
}
