import { t as bippoT, locale as bippoLocale } from "./i18n.js";
import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Store, CreditCard, Layers, Users, History, Plus, Search, RefreshCw, LogOut, ArrowUpLeft, ShieldCheck, X, Check, ChevronLeft, Settings2, AlertCircle } from 'lucide-react';
import { Brand } from './Landing';
import { cloud, db } from './store';
import { isAdmin, loadAdmin, saveShop, savePlan, saveMember, removeMember, shopTypes, subStates, expired, operating } from './adminData';
import './admin.css';
const nav = [['overview', bippoT("نظرة عامة"), LayoutDashboard], ['shops', bippoT("المقاهي والمطاعم"), Store], ['subscriptions', bippoT("الاشتراكات"), CreditCard], ['plans', bippoT("الخطط والأسعار"), Layers], ['team', bippoT("حسابات المحلات"), Users], ['activity', bippoT("سجل التغييرات"), History]];
const formatDate = d => d ? new Date(d).toLocaleDateString(bippoLocale) : bippoT("بدون تاريخ نهاية");
const money = (p, c = 'DZD') => p === null ? bippoT("السعر غير محدد") : new Intl.NumberFormat(bippoLocale, {
  style: 'currency',
  currency: c,
  maximumFractionDigits: 0
}).format(Number(p));
export function AdminAccessLink() {
  const [allowed, setAllowed] = useState(!cloud);
  useEffect(() => {
    let alive = true;
    isAdmin().then(ok => {
      if (alive) setAllowed(Boolean(ok));
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return allowed ? <a className="muted" href="#admin">{bippoT("إدارة المنصة")}</a> : null;
}
function Modal({
  title,
  close,
  children
}) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return <dialog ref={ref} className="admin-dialog" onCancel={close} onClick={e => {
    if (e.target === ref.current) close();
  }}><header><h2>{title}</h2><button type="button" onClick={close} className="icon-button" aria-label={bippoT("إغلاق")}><X /></button></header>{children}</dialog>;
}
export default function Admin() {
  const [auth, setAuth] = useState(cloud ? 'loading' : 'allowed'),
    [session, setSession] = useState(null);
  useEffect(() => {
    if (!cloud) return;
    let alive = true;
    async function inspect(s) {
      setSession(s);
      if (!s) {
        setAuth('login');
        return;
      }
      try {
        const ok = await isAdmin();
        if (alive) setAuth(ok ? 'allowed' : 'denied');
      } catch {
        if (alive) setAuth('unavailable');
      }
    }
    db.auth.getSession().then(({
      data
    }) => inspect(data.session));
    const {
      data
    } = db.auth.onAuthStateChange((_, s) => {
      setTimeout(() => {
        if (alive) inspect(s);
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return auth === 'allowed' ? <AdminPanel session={session} /> : <><header className="nav wrap"><Brand /><a href="#dashboard">{bippoT("لوحة المحل")}</a></header>{auth === 'login' ? <AdminLogin /> : <div className="panel admin-gate"><ShieldCheck size={38} /><h1>{auth === 'loading' ? bippoT("نتحقق من الصلاحية…") : auth === 'denied' ? bippoT("هاذ المساحة خاصة بأدمين المنصة") : bippoT("إدارة المنصة مازالت ما تفعّلتش")}</h1><p>{auth === 'denied' ? bippoT("حساب المحل ما يقدرش يدخل لإدارة المنصة. الصلاحية تتعيّن من قاعدة البيانات فقط.") : auth === 'unavailable' ? bippoT("يلزم تفعيل إعدادات إدارة المنصة في قاعدة البيانات. ما عرضنا حتى بيانات إدارية.") : bippoT("لحظات من فضلك.")}</p><a className="button outline" href="#dashboard">{bippoT("ارجع للوحة المحل")}</a></div>}</>;
}
function AdminLogin() {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  return <form className="panel login" onSubmit={async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const {
        error
      } = await db.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch {
      setError(bippoT("تعذر الدخول. راجع البريد وكلمة المرور."));
    } finally {
      setBusy(false);
    }
  }}><span className="eyebrow"><ShieldCheck size={16} />{bippoT(" إدارة bippo")}</span><h1>{bippoT("مرحبا بالأدمين")}</h1><p>{bippoT("دخل بحساب إدارة المنصة المصرّح ليه.")}</p><label>{bippoT("البريد الإلكتروني")}<input type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>{bippoT("كلمة المرور")}<input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required /></label><button className="button" disabled={busy}>{bippoT("دخول للإدارة")}</button><a className="recovery-back" href="#reset">{bippoT("ما حطّيتش كلمة مرور؟ ولا نسيتها؟")}</a>{error && <p className="error" role="alert">{error}</p>}</form>;
}
function AdminPanel({
  session
}) {
  const [tab, setTab] = useState('overview'),
    [data, setData] = useState(null),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(''),
    [status, setStatus] = useState('all'),
    [edit, setEdit] = useState(null),
    [planEdit, setPlanEdit] = useState(null),
    [teamForm, setTeamForm] = useState(null),
    [revoke, setRevoke] = useState(null);
  const alive = useRef(true);
  async function refresh() {
    setLoading(true);
    try {
      const d = await loadAdmin();
      if (alive.current) {
        setData(d);
        setError('');
      }
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  useEffect(() => {
    alive.current = true;
    refresh();
    return () => {
      alive.current = false;
    };
  }, []);
  async function perform(fn, success, close) {
    setBusy(true);
    setError('');
    try {
      await fn();
      close?.();
      setNotice(success);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const shops = data?.shops || [],
    plans = data?.plans || [],
    subs = data?.subscriptions || [],
    members = data?.memberships || [];
  const subFor = id => subs.find(s => s.shop_id === id),
    planFor = id => plans.find(p => p.id === id);
  function openShop(shop) {
    const sub = subFor(shop?.id);
    setError('');
    setEdit({
      id: shop?.id || '',
      name: shop?.name || '',
      kind: shop?.kind || 'cafe',
      city: shop?.city || '',
      status: shop?.status || 'active',
      plan_id: sub?.plan_id || plans.find(p => p.active)?.id || '',
      sub_status: sub?.status || 'active',
      period_end: sub?.period_end?.slice(0, 10) || '',
      notes: sub?.notes || ''
    });
  }
  const filtered = shops.filter(s => (s.name + ' ' + s.city).toLowerCase().includes(query.toLowerCase()) && (status === 'all' || (tab === 'subscriptions' ? status === 'expired' ? expired(subFor(s.id)) : subFor(s.id)?.status === status : s.status === status)));
  const totals = {
    all: shops.length,
    operating: shops.filter(s => operating(s, subFor(s.id))).length,
    attention: subs.filter(s => expired(s) || ['past_due', 'cancelled'].includes(s.status)).length,
    staff: members.length
  };
  return <div className="admin-shell"><aside className="admin-sidebar"><Brand /><div className="admin-space"><ShieldCheck size={15} />{bippoT(" إدارة المنصة")}</div><nav aria-label={bippoT("إدارة المنصة")}>{nav.map(([id, label, Icon]) => <button className={tab === id ? 'selected' : ''} key={id} onClick={() => {
          setTab(id);
          setQuery('');
          setStatus('all');
          setNotice('');
        }}><Icon size={19} />{label}{id === 'shops' && <small>{shops.length}</small>}</button>)}</nav><div className="admin-side-bottom"><span className="admin-avatar">B</span><div><b>{bippoT("أدمين bippo")}</b><small>{cloud ? bippoT("وصول محمي بالصلاحيات") : bippoT("وضع تجريبي محلي")}</small></div></div><a className="admin-back" href="#dashboard">{bippoT("لوحة المحل ")}<ArrowUpLeft size={15} /></a>{session && <button className="admin-back" onClick={() => db.auth.signOut()}><LogOut size={15} />{bippoT(" خروج")}</button>}</aside><main className="admin-main"><header className="admin-top"><div><span className="admin-breadcrumb">bippo <ChevronLeft size={13} />{bippoT(" إدارة المنصة")}</span><h1>{nav.find(n => n[0] === tab)[1]}</h1><p>{tab === 'overview' ? bippoT("كل واش صاري في المنصة، في بلاصة وحدة.") : tab === 'shops' ? bippoT("زيد محل جديد، نظّم معلوماتو، وتحكّم في حالتو.") : tab === 'subscriptions' ? bippoT("تابع الاشتراكات وبدّل الخطط وفترات الصلاحية.") : bippoT("تنظيم واضح، وقرارات أسهل.")}</p></div><div className="admin-top-actions"><button className="button outline small" aria-label={bippoT("تحديث بيانات الإدارة")} onClick={refresh} disabled={loading || busy}><RefreshCw size={15} />{loading ? bippoT("نحدّث…") : bippoT("تحديث")}</button>{['overview', 'shops', 'subscriptions'].includes(tab) && <button className="button small" onClick={() => openShop()} disabled={!plans.some(p => p.active)}><Plus size={16} />{bippoT(" زيد محل")}</button>}</div></header>{!cloud && <div className="admin-demo"><span className="dot" />{bippoT(" تجربة محلية — هاذ البيانات غير أمثلة، وما تتبدّلش قاعدة الإنتاج.")}</div>}{error && <p className="error" role="alert">{error}</p>}{notice && <div className="admin-notice" role="status"><Check size={16} />{notice}</div>}{!data ? <div className="panel admin-loading">{error ? bippoT("ما قدرناش نحمّلو البيانات. عاود جرّب التحديث.") : bippoT("نحمّلو بيانات المنصة…")}</div> : <>{tab === 'overview' && <><section className="admin-stats">{[[Store, bippoT("المحلات المسجّلة"), totals.all, bippoT("في المنصة")], [ShieldCheck, bippoT("محلات تقدر تخدم"), totals.operating, bippoT("نشطة واشتراكها صالح")], [CreditCard, bippoT("اشتراكات تحتاج متابعة"), totals.attention, bippoT("متأخرة، منتهية أو ملغاة")], [Users, bippoT("حسابات مرتبطة"), totals.staff, bippoT("تابعة للمحلات")]].map(([Icon, title, count, caption]) => <article key={title}><span className="admin-stat-icon"><Icon size={21} /></span><small>{title}</small><strong>{count}</strong><p>{caption}</p></article>)}</section><div className="admin-overview-grid"><section className="panel admin-section"><div className="admin-section-title"><div><h2>{bippoT("آخر المحلات")}</h2><p>{bippoT("المقاهي والمطاعم اللي انضمّو للمنصة.")}</p></div><button onClick={() => setTab('shops')} className="admin-text-link">{bippoT("شوف الكل ")}<ArrowUpLeft size={14} /></button></div>{shops.slice(0, 5).map(s => <div className="admin-venue" key={s.id}><div className="venue-symbol"><Store size={20} /></div><div><b>{s.name}</b><small>{shopTypes[s.kind]} · {s.city || bippoT("المدينة غير محددة")}</small></div><Badge status={s.status} /><button className="icon-button" onClick={() => openShop(s)} aria-label={bippoT("تعديل ") + s.name}><Settings2 size={17} /></button></div>)}{!shops.length && <Empty text={bippoT("مازال ما كاش محلات. زيد أول محل باش تبدا.")} />}</section><section className="panel admin-section"><div className="admin-section-title"><div><h2>{bippoT("توزيع الاشتراكات")}</h2><p>{bippoT("الخطط المرتبطة بالمحلات حاليًا.")}</p></div></div>{plans.map(p => {
                const count = subs.filter(s => s.plan_id === p.id).length;
                return <div className="plan-distribution" key={p.id}><div><b>{p.name}</b><span>{count}{bippoT(" محل")}</span></div><div className="plan-meter"><i style={{
                      width: `${shops.length ? count / shops.length * 100 : 0}%`
                    }} /></div></div>;
              })}<div className="admin-tip"><CreditCard size={20} /><p>{bippoT("الاشتراكات تُدار يدويًا. الأرقام هنا ما تعنيش تحصيل أموال، والدفع الإلكتروني مازال غير مفعّل.")}</p></div></section></div><Activity rows={data.audit.slice(0, 5)} shops={shops} compact /></>}{['shops', 'subscriptions'].includes(tab) && <section className="panel admin-section"><div className="admin-table-tools"><label className="admin-search"><Search size={17} /><input aria-label={bippoT("البحث عن محل")} placeholder={bippoT("قلّب باسم المحل ولا المدينة…")} value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label={bippoT("تصفية الحالة")} value={status} onChange={e => setStatus(e.target.value)}><option value="all">{bippoT("كل الحالات")}</option>{tab === 'shops' ? <><option value="active">{bippoT("نشط")}</option><option value="suspended">{bippoT("موقوف")}</option></> : <><option value="trial">{bippoT("تجريبي")}</option><option value="active">{bippoT("نشط")}</option><option value="past_due">{bippoT("متأخر")}</option><option value="cancelled">{bippoT("ملغى")}</option><option value="expired">{bippoT("منتهي الصلاحية")}</option></>}</select><small>{filtered.length}{bippoT(" نتيجة")}</small></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>{bippoT("المحل")}</th><th>{tab === 'shops' ? bippoT("النشاط / المدينة") : bippoT("الخطة / السعر الشهري")}</th><th>{bippoT("حالة المحل")}</th><th>{bippoT("الاشتراك")}</th><th>{bippoT("الصلاحية")}</th><th><span className="sr-only">{bippoT("الإجراءات")}</span></th></tr></thead><tbody>{filtered.map(s => {
                  const sub = subFor(s.id),
                    p = planFor(sub?.plan_id);
                  return <tr key={s.id}><td><b>{s.name}</b><small dir="ltr">{s.id.slice(0, 8)}</small></td><td>{tab === 'shops' ? <>{shopTypes[s.kind]}<small>{s.city || bippoT("غير محددة")}</small></> : <>{p?.name || bippoT("بدون خطة")}<small>{p ? money(p.monthly_price, p.currency) : '—'}</small></>}</td><td><Badge status={s.status} /></td><td><Badge status={expired(sub) ? 'expired' : sub?.status || 'none'} /></td><td>{formatDate(sub?.period_end)}</td><td><button className="button outline small" onClick={() => openShop(s)}>{bippoT("تعديل")}</button></td></tr>;
                })}</tbody></table></div>{!filtered.length && <Empty text={bippoT("ما لقيناش نتائج بهاذ البحث.")} />}{tab === 'subscriptions' && <div className="admin-tip"><AlertCircle size={18} /><p>{bippoT("إيقاف المحل أو انتهاء/إلغاء الاشتراك يمنع إنشاء طلبات جديدة. الطلبات الحالية تبقى قابلة للتحديث والاستلام.")}</p></div>}</section>}{tab === 'plans' && <><div className="admin-page-tools"><p>{bippoT("حدّد أسعارك، وخلّي أي خطة قديمة غير متاحة للاشتراكات الجديدة.")}</p><button className="button small" onClick={() => setPlanEdit({
              name: '',
              monthly_price: '',
              currency: 'DZD',
              active: true
            })}><Plus size={16} />{bippoT(" زيد خطة")}</button></div><div className="admin-plan-grid">{plans.map(p => <article className="panel admin-plan-card" key={p.id}><div><Layers size={24} /><Badge status={p.active ? 'active' : 'archived'} /></div><h2>{p.name}</h2><strong>{money(p.monthly_price, p.currency)}</strong><p>{bippoT("للشهر · إدارة يدوية")}</p><hr /><small>{subs.filter(s => s.plan_id === p.id).length}{bippoT(" محل مرتبط بالخطة")}</small><button className="button outline full" onClick={() => setPlanEdit({
                ...p,
                monthly_price: p.monthly_price ?? ''
              })}>{bippoT("تعديل الخطة")}</button></article>)}</div></>}{tab === 'team' && <section className="panel admin-section"><div className="admin-section-title"><div><h2>{bippoT("حسابات المحلات")}</h2><p>{bippoT("اربط حساب Supabase موجود بمحل واحد. هاذ الربط ما يعطيش صلاحية أدمين.")}</p></div><button className="button small" onClick={() => setTeamForm({
              user_id: '',
              shop_id: shops[0]?.id || ''
            })} disabled={!shops.length}><Plus size={16} />{bippoT(" ربط حساب")}</button></div><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>{bippoT("معرّف الحساب")}</th><th>{bippoT("المحل")}</th><th>{bippoT("الإجراءات")}</th></tr></thead><tbody>{members.map(m => <tr key={m.user_id}><td><code dir="ltr">{m.user_id}</code></td><td>{shops.find(s => s.id === m.shop_id)?.name || '—'}</td><td><button className="admin-text-link" onClick={() => setTeamForm(m)}>{bippoT("تغيير المحل")}</button><button className="admin-danger-link" onClick={() => setRevoke(m)}>{bippoT("نزع الربط")}</button></td></tr>)}</tbody></table></div>{!members.length && <Empty text={bippoT("مازال ما كاش حسابات مرتبطة.")} />}<div className="admin-tip"><Users size={19} /><p>{bippoT("أنشئ أو ادعُ الحساب أولًا من Authentication في Supabase، ثم استعمل UUID تاعو هنا. إدارة كلمات المرور ومنح صلاحية أدمين تبقى خارج هاذ الصفحة.")}</p></div></section>}{tab === 'activity' && <Activity rows={data.audit} shops={shops} />}</>}{edit && <Modal title={edit.id ? bippoT("تعديل المحل والاشتراك") : bippoT("محل جديد")} close={() => !busy && setEdit(null)}><form onSubmit={e => {
          e.preventDefault();
          perform(() => saveShop(edit), bippoT("تسجّلت معلومات المحل والاشتراك."), () => setEdit(null));
        }}><div className="admin-form-grid"><label>{bippoT("اسم المحل")}<input autoFocus value={edit.name} maxLength={120} required onChange={e => setEdit({
                ...edit,
                name: e.target.value
              })} /></label><label>{bippoT("النشاط")}<select value={edit.kind} onChange={e => setEdit({
                ...edit,
                kind: e.target.value
              })}>{Object.entries(shopTypes).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><label>{bippoT("المدينة")}<input maxLength={100} value={edit.city} onChange={e => setEdit({
                ...edit,
                city: e.target.value
              })} /></label><label>{bippoT("حالة المحل")}<select value={edit.status} onChange={e => setEdit({
                ...edit,
                status: e.target.value
              })}><option value="active">{bippoT("نشط")}</option><option value="suspended">{bippoT("موقوف")}</option></select></label><label>{bippoT("خطة الاشتراك")}<select required value={edit.plan_id} onChange={e => setEdit({
                ...edit,
                plan_id: e.target.value
              })}><option value="">{bippoT("اختار خطة")}</option>{plans.filter(p => p.active || p.id === edit.plan_id).map(p => <option key={p.id} value={p.id}>{p.name}{!p.active ? bippoT(" — مؤرشفة") : ''}</option>)}</select></label><label>{bippoT("حالة الاشتراك")}<select value={edit.sub_status} onChange={e => setEdit({
                ...edit,
                sub_status: e.target.value
              })}>{Object.entries(subStates).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label><label className="admin-span">{bippoT("نهاية الصلاحية — اختياري")}<input type="date" value={edit.period_end} onChange={e => setEdit({
                ...edit,
                period_end: e.target.value
              })} /><small>{bippoT("فارغ = بلا تاريخ نهاية. التاريخ حتى نهاية اليوم بتوقيت UTC.")}</small></label><label className="admin-span">{bippoT("ملاحظات داخلية")}<textarea maxLength={2000} rows={3} value={edit.notes} onChange={e => setEdit({
                ...edit,
                notes: e.target.value
              })} /></label></div>{error && <p role="alert" className="error">{error}</p>}<div className="admin-form-footer"><button className="button" disabled={busy}>{busy ? bippoT("نحفظ…") : bippoT("حفظ التغييرات")}</button><button type="button" className="button outline" disabled={busy} onClick={() => setEdit(null)}>{bippoT("إلغاء")}</button></div></form></Modal>}{planEdit && <Modal title={planEdit.id ? bippoT("تعديل الخطة") : bippoT("خطة جديدة")} close={() => !busy && setPlanEdit(null)}><form onSubmit={e => {
          e.preventDefault();
          perform(() => savePlan(planEdit), bippoT("تسجّلت الخطة."), () => setPlanEdit(null));
        }}><label>{bippoT("اسم الخطة")}<input autoFocus maxLength={80} required value={planEdit.name} onChange={e => setPlanEdit({
              ...planEdit,
              name: e.target.value
            })} /></label><div className="admin-form-grid"><label>{bippoT("السعر الشهري — اختياري")}<input type="number" min="0" max="9999999999" step="0.01" value={planEdit.monthly_price} onChange={e => setPlanEdit({
                ...planEdit,
                monthly_price: e.target.value
              })} /></label><label>{bippoT("العملة")}<select value={planEdit.currency} onChange={e => setPlanEdit({
                ...planEdit,
                currency: e.target.value
              })}><option>DZD</option><option>EUR</option><option>USD</option></select></label></div><label className="admin-checkbox"><input type="checkbox" checked={planEdit.active} onChange={e => setPlanEdit({
              ...planEdit,
              active: e.target.checked
            })} />{bippoT(" متاحة للاشتراكات الجديدة")}</label><p className="admin-form-note">{bippoT("تعديل السعر يغيّر السعر المعروض للمحلات المرتبطة، ولا يخصم أي مبلغ.")}</p>{error && <p className="error" role="alert">{error}</p>}<button className="button full" disabled={busy}>{bippoT("حفظ الخطة")}</button></form></Modal>}{teamForm && <Modal title={bippoT("ربط حساب بمحل")} close={() => !busy && setTeamForm(null)}><form onSubmit={e => {
          e.preventDefault();
          perform(() => saveMember(teamForm.user_id, teamForm.shop_id), bippoT("تسجّل ربط الحساب."), () => setTeamForm(null));
        }}><label>{bippoT("معرّف حساب Supabase (UUID)")}<input dir="ltr" autoFocus required value={teamForm.user_id} onChange={e => setTeamForm({
              ...teamForm,
              user_id: e.target.value
            })} /></label><label>{bippoT("المحل")}<select required value={teamForm.shop_id} onChange={e => setTeamForm({
              ...teamForm,
              shop_id: e.target.value
            })}>{shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><p className="admin-form-note">{bippoT("الحساب يقدر يكون مربوط بمحل واحد. حفظ ربط جديد يبدّل المحل السابق.")}</p>{error && <p className="error" role="alert">{error}</p>}<button className="button full" disabled={busy}>{bippoT("حفظ الربط")}</button></form></Modal>}{revoke && <Modal title={bippoT("نزع ربط الحساب؟")} close={() => !busy && setRevoke(null)}><p>{bippoT("الحساب يفقد وصوله لطلبات المحل. الحساب نفسه ما يتمسحش، وصلاحية أدمين المنصة ما تتبدّلش.")}</p>{error && <p className="error" role="alert">{error}</p>}<div className="admin-form-footer"><button className="button" disabled={busy} onClick={() => perform(() => removeMember(revoke.user_id), bippoT("تنحّى ربط الحساب."), () => setRevoke(null))}>{bippoT("نزع الربط")}</button><button className="button outline" disabled={busy} onClick={() => setRevoke(null)}>{bippoT("إلغاء")}</button></div></Modal>}</main></div>;
}
function Badge({
  status
}) {
  const labels = {
    active: bippoT("نشط"),
    suspended: bippoT("موقوف"),
    trial: bippoT("تجريبي"),
    past_due: bippoT("متأخر"),
    cancelled: bippoT("ملغى"),
    expired: bippoT("منتهي"),
    archived: bippoT("مؤرشفة"),
    none: bippoT("بدون اشتراك")
  };
  return <span className={'admin-badge ' + status}><i />{labels[status] || status}</span>;
}
function Empty({
  text
}) {
  return <div className="admin-empty"><Store size={31} /><p>{text}</p></div>;
}
function Activity({
  rows,
  shops,
  compact = false
}) {
  const entities = {
      shops: bippoT("محل"),
      subscriptions: bippoT("اشتراك"),
      plans: bippoT("خطة"),
      memberships: bippoT("ربط حساب")
    },
    actions = {
      INSERT: bippoT("إضافة"),
      UPDATE: bippoT("تعديل"),
      DELETE: bippoT("نزع"),
      SAVE: bippoT("حفظ")
    };
  return <section className="panel admin-section admin-audit"><div className="admin-section-title"><div><h2>{bippoT("آخر التغييرات")}</h2><p>{compact ? bippoT("سجل واضح لتغييرات الإدارة.") : bippoT("آخر 100 عملية. السجل غير قابل للتعديل من الواجهة.")}</p></div><History size={19} /></div>{rows.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>{bippoT("العملية")}</th><th>{bippoT("العنصر")}</th><th>{bippoT("التاريخ")}</th>{!compact && <th>{bippoT("حساب الأدمين")}</th>}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{actions[r.action] || r.action} {entities[r.entity] || r.entity}</td><td>{shops.find(s => s.id === r.entity_id)?.name || r.entity_id.slice(0, 8)}</td><td>{new Date(r.created_at).toLocaleString(bippoLocale)}</td>{!compact && <td><code>{r.actor_id?.slice(0, 8) || bippoT("تجربة")}</code></td>}</tr>)}</tbody></table></div> : <Empty text={bippoT("مازال ما كاش تغييرات إدارية مسجّلة.")} />}</section>;
}
