import React,{useState,useEffect} from 'react';
import {LogOut,Save,ImagePlus} from 'lucide-react';
import {cloud,db} from './store';
import {getSettings,saveSettings,readLogo} from './shopSettings';
import './shop-settings.css';
export default function ShopSettings(){
 const [form,setForm]=useState(null),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[email,setEmail]=useState('');
 useEffect(()=>{let alive=true;getSettings().then(v=>alive&&setForm(v)).catch(e=>alive&&setError(e.message));db?.auth.getUser().then(({data})=>alive&&setEmail(data.user?.email||''));return()=>{alive=false;};},[]);
 const update=(field,value)=>{setForm(v=>({...v,[field]:value}));setMessage('');};
 return <section className="panel shop-settings"><h2>إعدادات المحل</h2><p>عرّف بمحلك. الاسم والشعار يبانوا للزبون في صفحة الطلب.</p>{error&&<p role="alert" className="error">{error}</p>}{!form?<p>نحمّلو الإعدادات…</p>:<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{setForm(await saveSettings(form));setMessage('تسجّلت إعدادات المحل.');}catch(e){setError(e.message);}finally{setBusy(false);}}}>
 <div className="shop-logo-editor">{form.logo?<img src={form.logo} alt="شعار المحل"/>:<span className="shop-logo-placeholder"><ImagePlus/></span>}<div><label>شعار المحل<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async e=>{const file=e.target.files?.[0];if(!file)return;setBusy(true);setError('');try{update('logo',await readLogo(file));}catch(e){setError(e.message);}finally{setBusy(false);e.target.value='';}}}/></label><small>PNG، JPG أو WebP · حتى 2 ميغا</small>{form.logo&&<button type="button" className="icon-button" onClick={()=>update('logo','')}>نحّي الشعار</button>}</div></div>
 <div className="shop-settings-grid"><label>اسم المحل<input required maxLength={100} value={form.name} onChange={e=>update('name',e.target.value)}/></label><label>المدينة<input maxLength={100} value={form.city} onChange={e=>update('city',e.target.value)}/></label></div>
 <label>عنوان المحل<input maxLength={200} value={form.address} onChange={e=>update('address',e.target.value)}/></label><label>رسالة الاستلام للزبون<input required maxLength={180} value={form.pickup_message} onChange={e=>update('pickup_message',e.target.value)}/></label><button className="button" disabled={busy}><Save size={18}/> {busy?'نحفظو…':'حفظ الإعدادات'}</button>{message&&<p role="status" className="notice">{message}</p>}
 </form>}<div className="shop-account"><h3>الحساب</h3>{email&&<p dir="ltr">{email}</p>}{cloud&&<a className="button outline" href="#account">تغيير كلمة المرور</a>}<button className="button logout-button" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{if(cloud){const {error}=await db.auth.signOut();if(error)throw error;}else location.hash='';}catch(e){setError(e.message);}finally{setBusy(false);}}}><LogOut size={18}/> تسجيل الخروج</button></div></section>;
}
