import React, { useEffect, useId, useState } from 'react';
import { Bell, ImagePlus, Save, Sparkles } from 'lucide-react';
import { language, t, translate } from './i18n.js';
import { getSettings, readBanner, readLogo, saveSettings } from './shopSettings';
import { customerLinkLabels, customerPalette, customerPresets, safeCustomerUrl, themeKey } from './customerThemes';
import CustomerPager from './CustomerPager';
import DotNumber from './DotNumber';
import './customer-designer.css';

const swatches = ['#191b20', '#332820', '#143c30', '#182b46', '#3b2546', '#581c2b', '#ac271d', '#f4ead5', '#e4ebdf', '#ffffff'];
const digitSwatches = ['#ffffff', '#ffcf67', '#ffebba', '#98f4cd', '#91cfff', '#cbb9ff', '#ff9b9b'];

function ColorPicker({ label, value, colors = swatches, change }) {
  return <fieldset className="designer-colors">
    <legend>{label}</legend>
    <div>
      {[...new Set([value, ...colors])].map(color => (
        <button key={color} type="button" title={color} aria-label={label + ' ' + color}
          aria-pressed={value === color} style={{ background: color }} onClick={() => change(color)} />
      ))}
      <input type="color" value={value} aria-label={label} onChange={e => change(e.target.value)} />
    </div>
  </fieldset>;
}

function DesignerCard({ id, title, children }) {
  return <section id={id} className="designer-card">
    <h2>{title}</h2>{children}
  </section>;
}

function ImagePicker({ label, source, read, change, busy, setBusy, setError }) {
  return <div className="designer-upload">
    {source && <img src={source} alt="" />}
    <label><ImagePlus size={17} />{label}
      <input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setBusy(true);
        setError('');
        try { change(await read(file)); }
        catch { setError(t('اختار صورة PNG أو JPG أو WebP بحجم مناسب.')); }
        finally { setBusy(false); }
      }} />
    </label>
    {source && <button type="button" className="button outline small" disabled={busy} onClick={() => change('')}>
      {t('نحّي الصورة')}
    </button>}
  </div>;
}

export default function CustomerDesigner({ onSaved }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('manual');
  const [previewState, setPreviewState] = useState('preparing');
  const [previewLanguage, setPreviewLanguage] = useState(language);
  const id = useId();

  useEffect(() => {
    let active = true;
    getSettings().then(value => { if (active) setForm(value); })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);

  function change(field, value) {
    setForm(current => ({ ...current, [field]: value }));
    setMessage('');
  }

  function option(key, value) {
    setForm(current => ({ ...current, customer_options: { ...current.customer_options, [key]: value } }));
    setMessage('');
  }

  function selectPreset(preset) {
    setForm(current => {
      const { paper, ticket, digits, brand, ...options } = current.customer_options;
      return { ...current, customer_options: { ...options, preset } };
    });
    setMessage('');
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    const values = [...Object.values(form.customer_options.links || {}), form.customer_options.offerUrl];
    if (values.some(value => value?.trim() && !safeCustomerUrl(value.trim()))) {
      setError(t('استعمل روابط تبدأ بـ HTTPS.'));
      return;
    }
    setBusy(true);
    try {
      const saved = await saveSettings(form);
      setForm(saved);
      onSaved?.(saved);
      setMessage(t('تسجّلت إعدادات المحل.'));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (!form) return error ? <p role="alert" className="error">{error}</p> : <p role="status">{t('نحمّلو الإعدادات…')}</p>;
  const options = form.customer_options;
  const palette = customerPalette(form);
  const preset = options.preset || themeKey(form.customer_theme);
  const upload = (field, label, read) => (
    <ImagePicker label={t(label)} source={form[field]} read={read} change={value => change(field, value)}
      busy={busy} setBusy={setBusy} setError={setError} />
  );
  const tabs = [['themes', 'القوالب'], ['screen', 'الشاشة'], ['background', 'الخلفية'], ['brand', 'الشعار'],
    ['banners', 'البانرات'], ['links', 'الروابط'], ['reviews', 'تقييمات Google'], ['game', 'اللعبة']];
  const previewText = value => translate(value, previewLanguage);
  const bannerOffer = options.bannerMode === 'offer';

  return <div className="customer-designer">
    <form className="designer-form" onSubmit={submit}>
      <div className="designer-segments">
        <button type="button" aria-pressed={mode === 'presets'} onClick={() => setMode('presets')}><Sparkles size={15} />{t('المصمّم')}</button>
        <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>{t('تعديل يدوي')}</button>
      </div>
      {mode === 'manual' && <nav className="designer-jump" aria-label={t('أقسام التصميم')}>
        {tabs.map(([key, label]) => <button key={key} type="button" onClick={() => document.getElementById(id + key)?.scrollIntoView({ block: 'start' })}>{t(label)}</button>)}
      </nav>}
      <DesignerCard id={id + 'themes'} title={t('القوالب')}>
        <div className="designer-presets">
          {Object.entries(customerPresets).map(([key, item]) => (
            <button key={key} type="button" aria-pressed={preset === key} onClick={() => selectPreset(key)}>
              <span style={{ background: item.paper }}><i style={{ background: item.ticket, color: item.digits }}><DotNumber value="57" /></i><b /></span>
              {t(item.label)}
            </button>
          ))}
        </div>
      </DesignerCard>
      {mode === 'manual' && <>
        <DesignerCard id={id + 'screen'} title={t('الشاشة')}>
          <ColorPicker label={t('لون بطاقة الطلب')} value={palette.ticket} change={value => option('ticket', value)} />
          <ColorPicker label={t('لون الرقم')} value={palette.digits} colors={digitSwatches} change={value => option('digits', value)} />
        </DesignerCard>
        <DesignerCard id={id + 'background'} title={t('الخلفية')}>
          <ColorPicker label={t('لون الخلفية')} value={palette.paper} change={value => option('paper', value)} />
          {upload('customer_background_image', 'صورة الخلفية', readBanner)}
        </DesignerCard>
        <DesignerCard id={id + 'brand'} title={t('شعارك ولونك')}>
          {upload('logo', 'ارفع شعارك', readLogo)}
          <ColorPicker label={t('لون المحل')} value={palette.brand || '#102e29'} change={value => option('brand', value)} />
          <label>{t('رسالة الاستلام للزبون')}<input required maxLength={180} value={form.pickup_message} onChange={e => change('pickup_message', e.target.value)} /></label>
        </DesignerCard>
        <DesignerCard id={id + 'banners'} title={t('البانرات')}>
          <div className="designer-segments">
            <button type="button" aria-pressed={!bannerOffer} onClick={() => option('bannerMode', 'image')}>{t('صورة')}</button>
            <button type="button" aria-pressed={bannerOffer} onClick={() => option('bannerMode', 'offer')}>{t('عرض')}</button>
          </div>
          {upload('banner_image', 'صورة البانر', readBanner)}
          <label>{t('نص البانر')}<input maxLength={160} value={form.banner_text} onChange={e => change('banner_text', e.target.value)} /></label>
          {bannerOffer && <label>{t('رابط العرض')}<input type="url" dir="ltr" placeholder="https://" maxLength={1024}
            value={options.offerUrl || ''} onChange={e => option('offerUrl', e.target.value)} /></label>}
        </DesignerCard>
        <DesignerCard id={id + 'links'} title={t('الروابط')}>
          <div className="designer-links-grid">
            {Object.entries(customerLinkLabels).map(([key, label]) => (
              <label key={key}>{t(label)}<input type="url" dir="ltr" placeholder="https://" maxLength={1024}
                value={options.links?.[key] || ''} onChange={e => option('links', { ...options.links, [key]: e.target.value })} /></label>
            ))}
          </div>
        </DesignerCard>
        <DesignerCard id={id + 'reviews'} title={t('تقييمات Google')}>
          <p>{t('الزبون يلقى رابط التقييم كي تعلّم الطلب «تسلّم الطلب». نفس الدعوة تظهر لجميع الزبائن، بلا فرز حسب الرضا.')}</p>
          <label>{t('رابط تقييم محلك على Google')}<input type="url" dir="ltr" maxLength={2048}
            placeholder="https://g.page/r/…/review" value={form.google_review_url || ''} onChange={e => change('google_review_url', e.target.value)} /></label>
        </DesignerCard>
        <DesignerCard id={id + 'game'} title={t('اللعبة')}>
          <label className="designer-game"><span>{t('طلّع قهوتك')}<small>{t('راك تستنّى؟ جرّب تلعب.')}</small></span>
            <input type="checkbox" role="switch" checked={options.game !== false} onChange={e => option('game', e.target.checked)} />
          </label>
        </DesignerCard>
      </>}
      {error && <p role="alert" className="error">{error}</p>}
      {message && <p role="status" className="notice">{message}</p>}
      <button className="button" disabled={busy}><Save size={17} />{busy ? t('نحفظو…') : t('حفظ الإعدادات')}</button>
    </form>
    <aside className="merchant-preview designer-preview">
      <div className="designer-preview-controls">
        <div className="designer-segments" aria-label={t('معاينة صفحة الزبون')}>
          <button type="button" aria-pressed={previewState === 'preparing'} onClick={() => setPreviewState('preparing')}>{t('راه يتحضّر')}</button>
          <button type="button" aria-pressed={previewState === 'ready'} onClick={() => setPreviewState('ready')}>{t('جاهز')}</button>
        </div>
        <div className="designer-segments">
          <button type="button" lang="ar" aria-pressed={previewLanguage === 'ar'} onClick={() => setPreviewLanguage('ar')}>ع</button>
          <button type="button" lang="fr" aria-pressed={previewLanguage === 'fr'} onClick={() => setPreviewLanguage('fr')}>FR</button>
        </div>
      </div>
      <div className="merchant-phone">
        <div className="designer-phone-top" aria-hidden="true" dir="ltr"><b>9:41</b><span>bippo</span></div>
        <CustomerPager branding={form} number="57" status={previewState} preview previewLanguage={previewLanguage}>
          <span className="pager-action"><Bell size={17} />{previewText(previewState === 'ready' ? 'راني جاي' : 'فعّل التنبيه')}</span>
        </CustomerPager>
      </div>
    </aside>
  </div>;
}
