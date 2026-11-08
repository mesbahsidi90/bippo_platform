import {pickupText} from "./i18n.js";
import { t as bippoT, locale as bippoLocale, direction as bippoDirection } from "./i18n.js";
import React from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import Brand from './Brand';
export default function Receipt({
  order,
  branding,
  url,
  width = '80',
  preview = false,
  onClose
}) {
  return createPortal(<div className={'receipt-print-root ' + (preview ? 'receipt-screen-preview' : '')} onClick={e => e.stopPropagation()} style={{
    '--receipt-width': width + 'mm'
  }}>{preview && <div className="receipt-preview-toolbar"><button onClick={onClose}>{bippoT("رجوع")}</button><span>{bippoT("معاينة التيكي · ")}{width}{bippoT(" مم")}</span><button onClick={() => window.print()}>{bippoT("طباعة")}</button></div>}<article className="receipt-paper" dir={bippoDirection}>{branding?.logo && <img className="receipt-logo" src={branding.logo} alt="" />}<h1>{branding?.name || bippoT("محلك")}</h1>{branding?.address && <p>{branding.address}</p>}<p>{bippoT("تيكي متابعة الطلب")}</p><strong className="receipt-number">{order.number}</strong><p>{new Date(order.created_at).toLocaleString(bippoLocale)}</p><div className="receipt-qr"><QRCodeSVG value={url} size={220} level="M" marginSize={4} /></div><h2>{bippoT("امسح الكود وفعّل التنبيه")}</h2><p>{bippoT("باش تعرف كي يوجد طلبك، بلا تحميل تطبيق.")}</p><p>{pickupText(branding?.pickup_message) || bippoT("تقدر تجي تديه من الكونتوار.")}</p><small>{bippoT("الرابط خاص بطلبك وصالح 24 ساعة من إنشائه.")}<br />{bippoT("تنبيه الهاتف حسب الاتصال والأذونات.")}</small><footer><Brand linked={false} /><span>{bippoT("تيكي متابعة، ماشي فاتورة دفع.")}</span></footer></article></div>, document.body);
}
