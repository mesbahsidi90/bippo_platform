export const customerThemes = {
  classic: { label: 'كلاسيك', paper: '#fafbf6', ticket: '#191b20', display: '#090d0d', digits: '#f8fff8' },
  lagoon: { label: 'بحري', paper: '#eaf7f4', ticket: '#0b3e37', display: '#062922', digits: '#c4f5e5' },
  sand: { label: 'رملي', paper: '#faf1df', ticket: '#47311e', display: '#28190e', digits: '#ffebba' },
  plum: { label: 'توتي', paper: '#f6eef7', ticket: '#3b2546', display: '#25152b', digits: '#f4d9ff' }
};

export const themeKey = key => Object.hasOwn(customerThemes, key) ? key : 'classic';

export const customerPresets = {
  ...customerThemes,
  amber: { label: 'كهرماني', paper: '#f4ead5', ticket: '#183c33', display: '#111c17', digits: '#ffcf67' },
  ocean: { label: 'أزرق ليلي', paper: '#e8eff9', ticket: '#182b46', display: '#101928', digits: '#91cfff' },
  olive: { label: 'زيتوني', paper: '#e4ebdf', ticket: '#263b25', display: '#132116', digits: '#bce8a4' },
  ruby: { label: 'عنابي', paper: '#f7e8e5', ticket: '#581c2b', display: '#35101b', digits: '#ffb5bd' }
};

export const customerLinkLabels = {
  menu: 'المنيو',
  instagram: 'إنستغرام',
  tiktok: 'تيك توك',
  snapchat: 'سناب شات',
  x: 'إكس',
  website: 'موقعنا',
  map: 'الخريطة'
};

export const validColor = value => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
export const safeCustomerUrl = value => {
  if (typeof value !== 'string' || value.length > 1024) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
};

export function cleanCustomerOptions(value) {
  const options = {};
  if (typeof value?.preset === 'string' && Object.hasOwn(customerPresets, value.preset)) options.preset = value.preset;
  for (const key of ['paper', 'ticket', 'digits', 'brand']) {
    if (validColor(value?.[key])) options[key] = value[key];
  }
  if (value?.game === false) options.game = false;
  if (value?.bannerMode === 'offer') options.bannerMode = 'offer';
  const offerUrl = safeCustomerUrl(value?.offerUrl);
  if (offerUrl) options.offerUrl = offerUrl;
  const links = Object.entries(customerLinkLabels).flatMap(([key]) => {
    const url = safeCustomerUrl(value?.links?.[key]);
    return url ? [[key, url]] : [];
  });
  if (links.length) options.links = Object.fromEntries(links);
  return options;
}

export function customerPalette(branding) {
  const options = cleanCustomerOptions(branding?.customer_options);
  return { ...customerPresets[options.preset || themeKey(branding?.customer_theme)], ...options };
}

export function contrastInk(hex) {
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  const [r, g, b] = channels.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#000000' : '#ffffff';
}
