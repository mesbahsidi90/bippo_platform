import { t as bippoT } from "./i18n.js";
import React from 'react';
import { Radio, CheckCheck, Footprints, Eye, Smartphone } from 'lucide-react';
import { guestStage, guestActivity } from './guestExperience';
export default function GuestStatus({
  order,
  unavailable = false
}) {
  if (unavailable) return <small className="guest-state waiting">{bippoT("حالة اتصال الزبون غير متاحة")}</small>;
  const stage = guestStage(order),
    Icon = stage.tone === 'coming' ? Footprints : stage.tone === 'seen' ? Eye : stage.tone === 'done' ? CheckCheck : stage.tone === 'enabled' ? Smartphone : Radio;
  return <div className="guest-status"><span className={'guest-state ' + stage.tone}><Icon size={13} />{stage.label}</span>{order.guest?.last_seen_at && <small>{guestActivity(order.guest)}</small>}{order.status !== 'collected' && !order.guest?.push_enabled_at && !order.guest?.ready_seen_at && !order.guest?.coming_at && <small className="guest-alert-hint">{bippoT("إشعار الخلفية غير مؤكّد؛ ناديلو إذا لزم.")}</small>}</div>;
}
