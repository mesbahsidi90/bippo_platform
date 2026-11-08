import { t as bippoT } from "./i18n.js";
export function secondsBetween(start, end) {
  if (!start || !end) return null;
  const delta = (Date.parse(end) - Date.parse(start)) / 1000;
  return Number.isFinite(delta) && delta >= 0 ? delta : null;
}
export function duration(seconds) {
  if (seconds === null || seconds === undefined || !Number.isFinite(Number(seconds))) return '—';
  const s = Math.round(Number(seconds));
  return s < 60 ? bippoT("{0} ثا", [s]) : bippoT("{0} د {1} ثا", [Math.floor(s / 60), s % 60]);
}
export function localDate(value, timezone = 'Africa/Algiers') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(value));
  return ['year', 'month', 'day'].map(t => parts.find(p => p.type === t)?.value).join('-');
}
export function summarize(rows, timezone = 'Africa/Algiers') {
  const prep = rows.map(o => secondsBetween(o.created_at, o.ready_at)).filter(v => v !== null),
    wait = rows.map(o => secondsBetween(o.ready_at, o.collected_at)).filter(v => v !== null);
  const hours = {},
    days = {};
  for (const row of rows) {
    const h = Number(new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      hourCycle: 'h23'
    }).format(new Date(row.created_at)));
    hours[h] = (hours[h] || 0) + 1;
    const d = localDate(row.created_at, timezone);
    days[d] = (days[d] || 0) + 1;
  }
  return {
    totals: {
      total: rows.length,
      collected: rows.filter(o => o.status === 'collected').length,
      preparing: rows.filter(o => o.status === 'preparing').length,
      ready: rows.filter(o => o.status === 'ready').length,
      prep_samples: prep.length,
      wait_samples: wait.length,
      avg_prep_seconds: prep.length ? prep.reduce((a, b) => a + b, 0) / prep.length : null,
      avg_wait_seconds: wait.length ? wait.reduce((a, b) => a + b, 0) / wait.length : null
    },
    hours: Object.entries(hours).map(([hour, count]) => ({
      hour: Number(hour),
      count
    })),
    days: Object.entries(days).sort().map(([day, count]) => ({
      day,
      count
    }))
  };
}
function csvCell(v) {
  let text = String(v ?? '');
  if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function orderCSV(rows) {
  const header = [bippoT("رقم الطلب"), bippoT("الحالة"), bippoT("وقت الإنشاء UTC"), bippoT("وقت الجاهزية UTC"), bippoT("وقت الاستلام UTC"), bippoT("مدة التحضير بالثواني"), bippoT("انتظار الاستلام بالثواني")];
  return '\uFEFF' + [header, ...rows.map(o => [o.number, o.status, o.created_at, o.ready_at || '', o.collected_at || '', secondsBetween(o.created_at, o.ready_at) ?? '', secondsBetween(o.ready_at, o.collected_at) ?? ''])].map(r => r.map(csvCell).join(',')).join('\r\n');
}
