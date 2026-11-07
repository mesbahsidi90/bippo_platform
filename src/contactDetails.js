export const supportPhone='+905535132920';
export const supportWhatsApp='https://wa.me/905535132920';
export function contactMessage({name='',shop='',topic='مساعدة في البداية',message=''}){
 return ['سلام فريق bippo،',`الموضوع: ${topic}`,name.trim()&&`الاسم: ${name.trim()}`,shop.trim()&&`المحل: ${shop.trim()}`,message.trim()].filter(Boolean).join('\n');
}
export const contactLink=values=>supportWhatsApp+'?text='+encodeURIComponent(contactMessage(values));
