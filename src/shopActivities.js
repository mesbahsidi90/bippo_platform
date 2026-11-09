import { t } from './i18n.js';

export const shopTypes = {
  cafe: t('مقهى'),
  restaurant: t('مطعم'),
  food_court: t('فود كورت'),
  laundry: t('مغسلة ملابس'),
  car_wash: t('مغسلة سيارات'),
  tailor: t('خياط'),
  other: t('نشاط آخر')
};

const foodServiceKinds = new Set(['cafe', 'restaurant', 'food_court']);

export function shopActivity(kind) {
  const key = Object.hasOwn(shopTypes, kind) ? kind : 'cafe';
  const foodService = foodServiceKinds.has(key);
  return {
    label: shopTypes[key],
    foodService,
    trackingMode: foodService ? 'order' : 'counter'
  };
}
