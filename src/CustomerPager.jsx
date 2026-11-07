import React from 'react';
import {Check} from 'lucide-react';
import DotNumber from './DotNumber';
import './customer-pager.css';
export default function CustomerPager({branding,number,status,acknowledged=false,demo=false,error='',loading=false,children,extra}){
 const calling=status==='ready'&&!acknowledged,finished=status==='collected';
 const title=loading?'نوجدو طلبك…':!number?'الرابط غير متاح':finished?'بالصحة والراحة!':calling?'طلبك راه واجد!':status==='ready'?'طلبك واجد للاستلام':'طلبك راه يتحضّر';
 return <div className={'pager-page '+(calling?'pager-calling':'')}>
  <header className="pager-shop"><span className="pager-shop-logo" aria-hidden="true">{branding?.logo?<img src={branding.logo} alt=""/>:Array.from({length:9},(_,i)=><i key={i}/>)}</span><div><b>{branding?.name||(demo?'مقهى bippo':'طلبك في bippo')}</b><span>{branding?.city||(demo?'فرع التجربة':'نمرة وحدة. وراحة أكثر.')}</span></div></header>
  <main className="pager-ticket">
   <div className="pager-display" aria-label="رقم الطلب">{number?<DotNumber value={number}/>:<span className="pager-loading">…</span>}{status==='preparing'&&<div className="pager-waiting-dots" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i}/>)}</div>}</div>
   <div className="pager-status-copy" aria-live="polite"><h1>{title}</h1>{number&&<p>{finished?'يعطيك الصحة على الزيارة.':status==='ready'?(branding?.pickup_message||'تقدر تجي تديه من الكونتوار.'): 'ننبّهوك كي يوجد، اقعد مرتاح.'}</p>}</div>
   {acknowledged&&status==='ready'?<div className="pager-confirmed"><Check size={22}/> راني جاي، الرنة حبست</div>:children}
   {error&&<p className="pager-connection" role="status">{number?'الاتصال راه يتعاود…':error}</p>}
  </main>
  {!calling&&extra&&<aside className="pager-extra">{extra}</aside>}
  {!calling&&<footer className="pager-powered">ساهلة مع <a href="#">bippo<span aria-hidden="true">●</span></a>{demo&&<small>تجربة بلا حساب</small>}</footer>}
 </div>;
}
