import { t as bippoT } from "./i18n.js";
export const statuses = {
  preparing: bippoT("راه يتحضّر"),
  ready: bippoT("واجد للاستلام"),
  collected: bippoT("تسلّم الطلب")
};
export function normalizeNumber(value) {
  const n = String(value).trim().replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  if (!/^[0-9]{1,4}$/.test(n) || Number(n) < 1) throw new Error(bippoT("أدخل رقمًا من 1 إلى 9999"));
  return String(Number(n));
}
export function validTransition(from, to) {
  return from === 'preparing' && to === 'ready' || from === 'ready' && to === 'collected';
}
export const active = o => o.status !== 'collected';
