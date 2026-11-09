import React, { useState } from 'react';
import { t, ticketLink } from './i18n.js';
import { db } from './store';
import { rememberBranch } from './merchantBranches';

export async function workspaceAction(operation, fields = {}) {
  const { data, error } = await db.rpc('merchant_workspace', { operation, ...fields });
  if (error) throw error;
  return data;
}

export function BranchSelector({ workspace }) {
  if (!workspace?.manager || workspace.branches.length < 2) return null;
  return <label className="merchant-branch-picker">
    {t('الفرع الحالي')}
    <select value={workspace.active || ''} onChange={event => {
      rememberBranch(event.target.value);
      const url = new URL(location.href);
      if (url.searchParams.has('branch')) {
        url.searchParams.delete('branch');
        location.replace(url.href);
      } else location.reload();
    }}>
      {!workspace.active && <option value="" disabled>{t('اختار الفرع')}</option>}
      {workspace.branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
    </select>
  </label>;
}

export default function MerchantTeam({ workspace, refresh, branchesOnly = false }) {
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function run(operation, fields) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const data = await workspaceAction(operation, fields);
      if (operation === 'invite') setLink(ticketLink('invite/' + data.token));
      if (operation !== 'revoke') setLabel('');
      await refresh();
    } catch {
      setError(t('تعذر حفظ التغيير. عاود المحاولة.'));
    } finally {
      setBusy(false);
    }
  }

  if (!workspace?.manager) return null;
  return <section className="panel merchant-team">
    <form onSubmit={event => {
      event.preventDefault();
      setLink('');
      void run(branchesOnly ? 'create_branch' : 'invite', {
        name: label.trim(),
        ...(branchesOnly ? {} : { target: target || workspace.active || workspace.home })
      });
    }}>
      <label>{branchesOnly ? t('اسم الفرع') : t('اسم الموظف')}
        <input value={label} onChange={event => setLabel(event.target.value)} required maxLength={branchesOnly ? 100 : 80} />
      </label>
      {!branchesOnly && <label>{t('الفرع')}
        <select value={target || workspace.active || workspace.home} onChange={event => setTarget(event.target.value)}>
          {workspace.branches.filter(branch => branch.status === 'active').map(branch => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>
      </label>}
      <button className="button" disabled={busy || !label.trim()}>{branchesOnly ? t('زيد فرع') : t('أنشئ دعوة')}</button>
    </form>
    {link && <div className="merchant-invite">
      <p>{t('شارك رابط الدعوة مع الموظف. صالح لمدة 48 ساعة ويُستعمل لحساب واحد.')}</p>
      <input readOnly dir="ltr" aria-label={t('رابط الدعوة')} value={link} onFocus={event => event.target.select()} />
      <button type="button" className="button outline small" onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setMessage(t('نُسخ الرابط'));
        } catch { setMessage(t('انسخ الرابط من الحقل.')); }
      }}>{t('نسخ الرابط')}</button>
    </div>}
    {message && <p role="status">{message}</p>}
    {error && <p role="alert" className="error">{error}</p>}
    <ul>
      {(branchesOnly ? workspace.branches : workspace.team).map(item => (
        <li key={item.id}>
          <div><strong>{branchesOnly ? item.name : item.label}</strong>
            <small>{branchesOnly ? item.city : workspace.branches.find(branch => branch.id === item.shop_id)?.name}</small>
          </div>
          {branchesOnly ? <span>{item.id === workspace.home ? t('الفرع الرئيسي') : ''}</span> : <>
            <span>{item.accepted ? t('قبل الدعوة') : Date.parse(item.expires_at) <= Date.now() ? t('انتهت الدعوة') : t('ينتظر القبول')}</span>
            <button type="button" className="button outline small" disabled={busy} onClick={() => {
              if (!window.confirm(t('تلغي الدعوة أو دخول هذا الموظف للفرع؟'))) return;
              setLink('');
              void run('revoke', { target: item.id });
            }}>{t('إلغاء الوصول')}</button>
          </>}
        </li>
      ))}
    </ul>
  </section>;
}
