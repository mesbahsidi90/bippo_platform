import React from 'react';
import {Star,ExternalLink} from 'lucide-react';
export default function ReviewCard({url}){if(!url)return null;return <section className="review-card"><Star size={28}/><h2>واش رايك في التجربة؟</h2><p>شارك رأيك الصريح في Google، يعاون المحل ويحسّن الخدمة.</p><a className="button" href={url} target="_blank" rel="noopener noreferrer">قيّم المحل في Google <ExternalLink size={17}/></a><small>اختياري، يفتح Google وقد يطلب تسجيل الدخول.</small></section>;}
