import React from 'react';
import {createPortal} from 'react-dom';
import {QRCodeSVG} from 'qrcode.react';
import Brand from './Brand';
export default function Receipt({order,branding,url,width='80',preview=false,onClose}){
 return createPortal(<div className={'receipt-print-root '+(preview?'receipt-screen-preview':'')} onClick={e=>e.stopPropagation()} style={{'--receipt-width':width+'mm'}}>{preview&&<div className="receipt-preview-toolbar"><button onClick={onClose}>رجوع</button><span>معاينة التيكي · {width} مم</span><button onClick={()=>window.print()}>طباعة</button></div>}<article className="receipt-paper" dir="rtl">{branding?.logo&&<img className="receipt-logo" src={branding.logo} alt=""/>}<h1>{branding?.name||'محلك'}</h1>{branding?.address&&<p>{branding.address}</p>}<p>تيكي متابعة الطلب</p><strong className="receipt-number">{order.number}</strong><p>{new Date(order.created_at).toLocaleString('ar-DZ')}</p><div className="receipt-qr"><QRCodeSVG value={url} size={220} level="M" marginSize={4}/></div><h2>امسح الكود وفعّل التنبيه</h2><p>باش تعرف كي يوجد طلبك، بلا تحميل تطبيق.</p><p>{branding?.pickup_message||'تقدر تجي تديه من الكونتوار.'}</p><small>الرابط خاص بطلبك وصالح 24 ساعة من إنشائه.<br/>تنبيه الهاتف حسب الاتصال والأذونات.</small><footer><Brand linked={false}/><span>تيكي متابعة، ماشي فاتورة دفع.</span></footer></article></div>,document.body);
}
