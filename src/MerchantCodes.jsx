import React, { useEffect, useState } from 'react';
import { ChefHat, ChevronDown, Copy, Monitor, Plus, Printer, RefreshCw, Tablet } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { t, ticketLink } from './i18n.js';
import { cloud, db } from './store';
import { rememberBranch } from './merchantBranches';
import { CounterPoster } from './CounterTicket';
import { workspaceAction } from './MerchantTeam';
import ShopSettings from './ShopSettings.jsx';
import './merchant-codes.css';

function screenLink(screen, shopId) {
  const link = new URL(ticketLink('dashboard/' + screen));
  if (shopId) link.searchParams.set('branch', shopId);
  return link.href;
}

function ScreenActions({ link, showField = false }) {
  const [message, setMessage] = useState('');
  return <>
    {showField && <input aria-label={t('رابط الشاشة')} dir="ltr" readOnly value={link} onFocus={event => event.target.select()} />}
    <div className="branch-code-actions">
      <a className="button small" href={link} target="_blank" rel="noreferrer">{t('افتح الشاشة')}</a>
      <button type="button" className="button outline small" onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setMessage(t('نُسخ الرابط'));
        } catch { setMessage(t('تعذر نسخ الرابط.')); }
      }}><Copy size={15} />{t('نسخ الرابط')}</button>
    </div>
    {message && <small role="status">{message}</small>}
  </>;
}

function WaitingScreen({ canManage }) {
  const [link, setLink] = useState(cloud ? null : ticketLink('display/local'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cloud) return;
    let active = true;
    db.rpc('waiting_screen_link').then(({ data, error }) => {
      if (!active) return;
      if (error || !data) setError(t('تعذر تحميل رابط شاشة الانتظار.'));
      else setLink(ticketLink('display/' + data));
    });
    return () => { active = false; };
  }, []);

  async function rotate() {
    if (!window.confirm(t('تبدّل رابط شاشة الانتظار؟ الرابط القديم يتوقف.'))) return;
    setBusy(true);
    setError('');
    try {
      const { data, error } = await db.rpc('waiting_screen_link', { rotate: true });
      if (error || !data) throw error || new Error();
      setLink(ticketLink('display/' + data));
    } catch { setError(t('تعذر تغيير رابط شاشة الانتظار.')); }
    finally { setBusy(false); }
  }

  return <article className="branch-code-card">
    <h3><Monitor size={19} />{t('شاشة الانتظار')}</h3>
    <p>{t('افتح الرابط في متصفح التلفزيون أو التابلت لعرض أرقام الطلبات.')}</p>
    {error && <p role="alert" className="error">{error}</p>}
    {!link && !error && <p role="status">{t('جارٍ الاتصال…')}</p>}
    {link && <ScreenActions key={link} link={link} showField />}
    {link && cloud && canManage && <button type="button" className="button outline small" disabled={busy} onClick={rotate}>
      <RefreshCw size={15} />{t('تغيير الرابط')}
    </button>}
  </article>;
}

function BranchTools({ shop, canManage, onOrders, onSaved, foodService }) {
  const fixed = shop.tracking_mode === 'counter';
  const customer = screenLink('customer-screen', shop.shop_id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return <div className="branch-tools">
    <header><h2>{t('كيفاش يمسح الزبون الكود؟')}</h2><p>{t('اختار الطريقة المناسبة للفرع.')}</p></header>
    <div className="merchant-code-grid">
      <article className="branch-code-card">
        <h3><Printer size={19} />{t('الكود المطبوع')}</h3>
        {fixed ? <CounterPoster shop={shop} /> : <>
          <p>{t('افتح رمز المتابعة من بطاقة الطلب، أو أنشئ طلبًا جديدًا.')}</p>
          <button type="button" className="button small" onClick={onOrders}>{t('مساحة العمل')}</button>
        </>}
      </article>
      <article className="branch-code-card">
        <h3><Tablet size={19} />{t('شاشة الزبون (تابلت)')}</h3>
        <p>{t('امسح هذا الرمز بالتابلت باش تفتح شاشة مشاركة الأكواد.')}</p>
        <div className="branch-screen-qr"><QRCodeSVG value={customer} size={126} marginSize={4} /></div>
        <ScreenActions key={customer} link={customer} />
      </article>
    </div>
    <h2>{t('شاشات إضافية (اختياري)')}</h2>
    <div className="merchant-code-grid">
      {foodService && <article className="branch-code-card">
        <h3><ChefHat size={19} />{t('شاشة المطبخ')}</h3>
        <p>{t('من التابلت في المطبخ، علّم الطلب جاهز باش يتحدّث عند الزبون.')}</p>
        <ScreenActions link={screenLink('kitchen', shop.shop_id)} showField />
      </article>}
      <WaitingScreen key={shop.shop_id} canManage={canManage} />
    </div>
    {canManage && <details className="branch-settings" onToggle={event => setSettingsOpen(event.currentTarget.open)}>
      <summary>{t('إعدادات الفرع')}<ChevronDown size={17} /></summary>
      {settingsOpen && <ShopSettings branchOnly onSaved={onSaved} />}
    </details>}
  </div>;
}

export default function MerchantCodes({ shop, error, workspace, refresh, onOrders, onSaved, canManage, foodService }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  if (!shop && !workspace?.branches?.length) return error ? <p role="alert" className="error">{error}</p> : <p role="status">{t('نحمّلو الإعدادات…')}</p>;
  const active = workspace?.active || shop?.shop_id;
  const branches = workspace?.branches?.length ? workspace.branches : [{ id: active, name: shop?.name, city: shop?.city }];

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setFailure('');
    try {
      await workspaceAction('create_branch', { name: name.trim() });
      setAdding(false);
      setName('');
      await refresh();
    } catch { setFailure(t('تعذر حفظ التغيير. عاود المحاولة.')); }
    finally { setBusy(false); }
  }

  function select(id) {
    rememberBranch(id);
    location.hash = 'dashboard/codes';
    location.reload();
  }

  return <div className="merchant-branches-codes">
    {workspace?.manager && <div className="branch-add">
      <button type="button" className="button small" aria-expanded={adding} onClick={() => setAdding(value => !value)}><Plus size={17} />{t('فرع جديد')}</button>
      {adding && <form className="panel" onSubmit={create}>
        <label>{t('اسم الفرع')}<input value={name} maxLength={100} required onChange={event => setName(event.target.value)} /></label>
        <button className="button small" disabled={busy || !name.trim()}>{t('زيد فرع')}</button>
      </form>}
      {failure && <p role="alert" className="error">{failure}</p>}
    </div>}
    {branches.map((branch, index) => {
      const selected = branch.id === active;
      const title = <><span><strong>{selected && shop ? shop.name : branch.name}</strong>
        {branch.status && <small className={'branch-status ' + branch.status}>{t(branch.status === 'active' ? 'شغّال' : 'موقوف')}</small>}
        <small className="branch-caption">{branch.city || (branch.id === workspace?.home ? t('الفرع الرئيسي') : '')}</small>
      </span><ChevronDown size={18} /></>;
      return selected ? <details className="branch-block" key={branch.id || index} open>
        <summary>{title}</summary>
        {error && <p role="alert" className="error">{error}</p>}
        {shop && <BranchTools key={shop.shop_id} shop={shop} onSaved={onSaved} canManage={canManage}
          onOrders={onOrders} foodService={foodService} />}
      </details> : <section className="branch-block" key={branch.id}>
        <button type="button" className="branch-switch" onClick={() => select(branch.id)}>{title}</button>
      </section>;
    })}
  </div>;
}
