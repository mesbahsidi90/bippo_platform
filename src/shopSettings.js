import { t as bippoT } from "./i18n.js";
import { cloud, db } from './store';
import { shopActivity } from './shopActivities';
import { cleanCustomerOptions, themeKey } from './customerThemes';
import { reviewUrl } from './guestExperience';
const key = 'bippo-shop-settings';
export const defaults = {
  name: bippoT("محلي"),
  city: '',
  address: '',
  pickup_message: bippoT("تقدر تجي تديه من الكونتوار."),
  logo: '',
  google_review_url: '',
  kind: 'cafe',
  tracking_mode: 'order',
  customer_theme: 'classic',
  banner_text: '',
  banner_image: '',
  customer_options: {},
  customer_background_image: ''
};
export async function getSettings() {
  if (!cloud) return {
    ...defaults,
    ...JSON.parse(localStorage.getItem(key) || '{}')
  };
  const {
    data: id,
    error
  } = await db.rpc('current_shop_id');
  if (error) throw error;
  if (!id) throw new Error(bippoT("حسابك ما راهوش مربوط بمحل."));
  const [profile, shop] = await Promise.all([db.from('shop_settings').select('*').eq('shop_id', id).maybeSingle(), db.from('shops').select('name,city,kind').eq('id', id).single()]);
  if (profile.error) throw profile.error;
  if (shop.error) throw shop.error;
  return {
    ...defaults,
    ...shop.data,
    tracking_mode: shopActivity(shop.data.kind).trackingMode,
    ...profile.data,
    shop_id: id
  };
}
export async function saveSettings(value) {
  const data = {
    name: value.name.trim(),
    city: value.city.trim(),
    address: value.address.trim(),
    pickup_message: value.pickup_message.trim(),
    logo: value.logo,
    customer_theme: themeKey(value.customer_theme),
    banner_text: (value.banner_text || '').trim(),
    banner_image: value.banner_image || '',
    customer_options: cleanCustomerOptions(value.customer_options),
    customer_background_image: value.customer_background_image || '',
    google_review_url: reviewUrl(value.google_review_url || ''),
    tracking_mode: value.tracking_mode === 'counter' ? 'counter' : 'order'
  };
  if (!data.name || data.name.length > 100) throw new Error(bippoT("دخل اسم المحل، حتى 100 حرف."));
  if (!cloud) {
    localStorage.setItem(key, JSON.stringify({ ...data, kind: value.kind }));
    return { ...data, kind: value.kind };
  }
  const {
    error
  } = await db.from('shop_settings').upsert({
    ...data,
    shop_id: value.shop_id
  }, {
    onConflict: 'shop_id'
  });
  if (error) throw error;
  return {
    ...data,
    shop_id: value.shop_id,
    kind: value.kind
  };
}
export async function ticketBranding(ticket) {
  if (!cloud) return getSettings();
  const [branding, design] = await Promise.all([
    db.rpc('ticket_branding', { ticket }),
    db.rpc('ticket_design', { ticket })
  ]);
  if (branding.error) throw branding.error;
  return { ...defaults, ...branding.data?.[0], ...(!design.error && design.data) };
}
async function readImage(file, dimension, maxLength) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error(bippoT("اختار PNG أو JPG أو WebP، أقل من 2 ميغا."));
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const result = canvas.toDataURL('image/webp', .85);
    if (result.length > maxLength) throw new Error(bippoT("الشعار كبير، جرّب صورة أبسط."));
    return result;
  } finally {
    bitmap.close();
  }
}

export const readLogo = file => readImage(file, 320, 150000);
export const readBanner = file => readImage(file, 720, 180000);
