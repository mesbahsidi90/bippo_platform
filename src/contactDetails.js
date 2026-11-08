import { t as bippoT } from "./i18n.js";
export const supportPhone = '+905535132920';
export const supportWhatsApp = 'https://wa.me/905535132920';
export function contactMessage({
  name = '',
  shop = '',
  topic = bippoT("مساعدة في البداية"),
  message = ''
}) {
  return [bippoT("سلام فريق bippo،"), bippoT("الموضوع: {0}", [topic]), name.trim() && bippoT("الاسم: {0}", [name.trim()]), shop.trim() && bippoT("المحل: {0}", [shop.trim()]), message.trim()].filter(Boolean).join('\n');
}
export const contactLink = values => supportWhatsApp + '?text=' + encodeURIComponent(contactMessage(values));
