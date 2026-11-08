import { t as bippoT, locale as bippoLocale } from "./i18n.js";
import React, { useState, useEffect } from 'react';
import { RefreshCw, Download, Clock, CheckCheck, BarChart3, ChevronRight, ChevronLeft } from 'lucide-react';
import { cloud, db, listOrders } from './store';
import { statuses } from './domain';
import { summarize, secondsBetween, duration, orderCSV } from './reporting';
export default function Reports() {
  const [custom, setCustom] = useState({
      from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10)
    }),
    [customError, setCustomError] = useState('');
  const [days, setDays] = useState(30),
    [zone, setZone] = useState('Africa/Algiers'),
    [page, setPage] = useState(0),
    [report, setReport] = useState(null),
    [rows, setRows] = useState([]),
    [total, setTotal] = useState(0),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(''),
    [revision, setRevision] = useState(0);
  const [period, setPeriod] = useState(() => ({
    from: new Date(Date.now() - 30 * 86400000).toISOString(),
    to: new Date().toISOString()
  }));
  useEffect(() => {
    if (days === 0) {
      setPeriod(p => ({
        ...p
      }));
      return;
    }
    setPeriod({
      from: new Date(Date.now() - days * 86400000).toISOString(),
      to: new Date().toISOString()
    });
    setPage(0);
  }, [days, revision]);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError('');
    async function load() {
      try {
        if (!cloud) {
          const all = (await listOrders()).filter(o => o.created_at >= period.from && o.created_at < period.to);
          if (live) {
            setReport(summarize(all, zone));
            setTotal(all.length);
            setRows(all.slice(page * 50, page * 50 + 50));
          }
        } else {
          const {
            data: shop,
            error: sError
          } = await db.rpc('current_shop_id');
          if (sError) throw sError;
          if (!shop) throw new Error(bippoT("حسابك ما راهوش مربوط بمحل."));
          const [aggregate, history] = await Promise.all([db.rpc('order_report', {
            from_date: period.from,
            to_date: period.to,
            timezone_name: zone
          }), db.from('orders').select('id,number,status,created_at,ready_at,collected_at', {
            count: 'exact'
          }).eq('shop_id', shop).gte('created_at', period.from).lt('created_at', period.to).order('created_at', {
            ascending: false
          }).order('id').range(page * 50, page * 50 + 49)]);
          if (aggregate.error || history.error) throw new Error(bippoT("تحديث قاعدة التقارير مازال غير متاح. الطلبات الحالية محفوظة؛ يلزم تطبيق ملف تحديث أوقات الطلبات."));
          if (live) {
            setReport(aggregate.data);
            setRows(history.data);
            setTotal(history.count || 0);
          }
        }
      } catch (e) {
        if (live) {
          setError(e.message || bippoT("تعذر تحميل التقارير"));
          setReport(null);
          setRows([]);
        }
      } finally {
        if (live) setLoading(false);
      }
    }
    load();
    return () => {
      live = false;
    };
  }, [period, zone, page]);
  const stats = report?.totals;
  const max = Math.max(1, ...(report?.hours || []).map(h => h.count));
  const peak = (report?.hours || []).reduce((best, h) => !best || h.count > best.count ? h : best, null);
  return <section className="reports"><header className="report-controls"><div><h2>{bippoT("سجل الطلبات والتقارير")}</h2><p>{bippoT("الطلبات المستلمة تبقى محفوظة. الإحصاءات حسب وقت إنشاء الطلب، بتوقيت ")}{zone === 'Africa/Algiers' ? bippoT("الجزائر") : zone === 'Europe/Istanbul' ? bippoT("إسطنبول") : 'UTC'}.</p></div><div className="report-actions"><select aria-label={bippoT("فترة التقرير")} value={days} onChange={e => setDays(Number(e.target.value))}><option value={1}>{bippoT("آخر 24 ساعة")}</option><option value={7}>{bippoT("آخر 7 أيام")}</option><option value={30}>{bippoT("آخر 30 يوم")}</option><option value={90}>{bippoT("آخر 90 يوم")}</option><option value={365}>{bippoT("آخر سنة")}</option><option value={0}>{bippoT("فترة محددة / أرشيف قديم")}</option></select><select aria-label={bippoT("توقيت التقرير")} value={zone} onChange={e => setZone(e.target.value)}><option value="Africa/Algiers">{bippoT("توقيت الجزائر")}</option><option value="Europe/Istanbul">{bippoT("توقيت إسطنبول")}</option><option value="UTC">UTC</option></select><button className="button outline small" onClick={() => setRevision(v => v + 1)} disabled={loading}><RefreshCw size={15} />{bippoT(" تحديث")}</button></div></header>{days === 0 && <form className="custom-report-range" onSubmit={e => {
      e.preventDefault();
      const from = new Date(custom.from + 'T00:00:00Z'),
        to = new Date(Date.parse(custom.to + 'T00:00:00Z') + 86400000);
      if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from || to - from > 366 * 86400000) {
        setCustomError(bippoT("اختار فترة صحيحة، بحد أقصى 366 يوم."));
        return;
      }
      setCustomError('');
      setPage(0);
      setPeriod({
        from: from.toISOString(),
        to: to.toISOString()
      });
    }}><label>{bippoT("من تاريخ (UTC)")}<input type="date" required value={custom.from} onChange={e => setCustom({
          ...custom,
          from: e.target.value
        })} /></label><label>{bippoT("إلى تاريخ (UTC، شامل)")}<input type="date" required value={custom.to} onChange={e => setCustom({
          ...custom,
          to: e.target.value
        })} /></label><button className="button small" disabled={loading}>{bippoT("عرض الفترة")}</button>{customError && <p className="error" role="alert">{customError}</p>}</form>}{error && <p className="error" role="alert">{error}</p>}{loading && <p className="muted" role="status">{bippoT("نحمّلو التقرير…")}</p>}{stats && <><div className="report-metrics">{[[bippoT("طلبات الفترة"), stats.total, bippoT("كل الحالات"), BarChart3], [bippoT("منها تسلّمت"), stats.collected, bippoT("الطلبات تبقى في السجل"), CheckCheck], [bippoT("متوسط التحضير"), duration(stats.avg_prep_seconds), bippoT("{0} طلب عندو وقت جاهزية معروف", [stats.prep_samples]), Clock], [bippoT("متوسط انتظار الاستلام"), duration(stats.avg_wait_seconds), bippoT("{0} طلب عندو الجاهزية والاستلام", [stats.wait_samples]), Clock]].map(([title, value, caption, Icon]) => <article className="panel" key={title}><Icon size={21} /><small>{title}</small><strong>{value}</strong><p>{caption}</p></article>)}</div><div className="report-charts"><article className="panel"><div className="report-chart-heading"><h3>{bippoT("أوقات الازدحام")}</h3><span>{peak ? bippoT("أكثر ساعة: {0}:00 ({1} طلب)", [String(peak.hour).padStart(2, '0'), peak.count]) : bippoT("مازال ما كاش بيانات")}</span></div><div className="hour-chart" role="img" aria-label={bippoT("عدد الطلبات حسب الساعة")}>{Array.from({
              length: 24
            }, (_, hour) => {
              const count = report.hours.find(h => h.hour === hour)?.count || 0;
              return <div title={bippoT("{0}:00 — {1} طلب", [hour, count])} key={hour}><small>{count || ''}</small><i style={{
                  height: `${Math.max(2, count / max * 100)}%`
                }} className={count && count === peak?.count ? 'peak' : ''} /><b>{String(hour).padStart(2, '0')}</b></div>;
            })}</div></article><article className="panel"><h3>{bippoT("الطلبات حسب اليوم")}</h3><div className="daily-report">{report.days.length ? report.days.map(d => <div key={d.day}><span>{d.day}</span><b>{d.count}{bippoT(" طلب")}</b></div>) : <p>{bippoT("مازال ما كاش طلبات في الفترة.")}</p>}</div></article></div><p className="report-coverage">{bippoT("أوقات الجاهزية والاستلام تتسجّل من بعد التحديث فقط. الطلبات القديمة اللي ما عندهاش هاذ الأوقات تبقى في السجل، وما تدخلش في متوسط التحضير والانتظار. ما نقدّروش نخمّنولها أوقات.")}</p><article className="panel report-history"><header><div><h3>{bippoT("السجل الكامل للفترة")}</h3><p>{total}{bippoT(" طلب · الصفحة ")}{page + 1}{bippoT(" من ")}{Math.max(1, Math.ceil(total / 50))}</p></div><button className="button outline small" disabled={!rows.length || loading} onClick={() => {
            const blob = new Blob([orderCSV(rows)], {
              type: 'text/csv;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `bippo-orders-page-${page + 1}.csv`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}><Download size={15} />{bippoT(" تصدير هذه الصفحة CSV")}</button></header><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>{bippoT("الطلب")}</th><th>{bippoT("الحالة")}</th><th>{bippoT("الإنشاء")}</th><th>{bippoT("الجاهزية")}</th><th>{bippoT("الاستلام")}</th><th>{bippoT("التحضير")}</th><th>{bippoT("انتظار الاستلام")}</th></tr></thead><tbody>{rows.map(o => <tr key={o.id}><td><b>{o.number}</b></td><td>{statuses[o.status]}</td>{['created_at', 'ready_at', 'collected_at'].map(k => <td key={k}>{o[k] ? new Date(o[k]).toLocaleString(bippoLocale, {
                    timeZone: zone
                  }) : bippoT("غير معروف")}</td>)}<td>{duration(secondsBetween(o.created_at, o.ready_at))}</td><td>{duration(secondsBetween(o.ready_at, o.collected_at))}</td></tr>)}</tbody></table></div>{!rows.length && <p className="empty">{bippoT("ما كاش طلبات في هاذ الفترة.")}</p>}<footer className="report-pagination"><button className="button outline small" disabled={page === 0 || loading} onClick={() => setPage(v => v - 1)}><ChevronRight size={15} />{bippoT(" السابقة")}</button><span>{page + 1} / {Math.max(1, Math.ceil(total / 50))}</span><button className="button outline small" disabled={(page + 1) * 50 >= total || loading} onClick={() => setPage(v => v + 1)}>{bippoT("التالية ")}<ChevronLeft size={15} /></button></footer></article></>}</section>;
}
