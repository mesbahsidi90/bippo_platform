import React, { useEffect, useState } from 'react';
import Brand from './Brand';
import { t } from './i18n.js';
import { db } from './store';
import { isBranchId, rememberBranch } from './merchantBranches';
import { workspaceAction } from './MerchantTeam';

export default function AcceptInvite({ token }) {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = Boolean(db && isBranchId(token));

  useEffect(() => {
    if (!valid) return;
    let active = true;
    db.auth.getSession().then(({ data }) => { if (active) setSession(data.session); })
      .catch(() => { if (active) setSession(null); });
    return () => { active = false; };
  }, [valid]);

  async function accept(event) {
    event.preventDefault();
    const creating = event.nativeEvent.submitter?.value === 'create';
    setBusy(true);
    setError('');
    try {
      if (!session) {
        const credentials = { email: email.trim(), password };
        const result = creating ? await db.auth.signUp(credentials) : await db.auth.signInWithPassword(credentials);
        if (result.error || !result.data.session) {
          setError(t('تعذر الدخول. تحقق من البريد وكلمة المرور.'));
          return;
        }
        setSession(result.data.session);
      }
      await workspaceAction('accept', { invite: token });
      rememberBranch(null);
      location.replace('#dashboard');
    } catch {
      setError(t('الدعوة غير متاحة لهذا الحساب.'));
    } finally {
      setBusy(false);
    }
  }

  return <main className="merchant-login"><div className="merchant-login-content">
    <Brand />
    <h1>{t('انضم للفريق')}</h1>
    {!valid ? <p>{t('الدعوة غير متاحة لهذا الحساب.')}</p> : session === undefined ? (
      <p role="status">{t('جارٍ الاتصال…')}</p>
    ) : <form onSubmit={accept}>
      {session ? <>
        <p dir="ltr">{session.user.email}</p>
        <button className="button" disabled={busy}>{t('اقبل الدعوة')}</button>
        <button type="button" className="button outline" disabled={busy} onClick={async () => {
          const result = await db.auth.signOut();
          if (!result.error) { rememberBranch(null); setSession(null); }
        }}>{t(' تسجيل الخروج')}</button>
      </> : <>
        <label>{t('البريد الإلكتروني')}<input type="email" required autoComplete="username" dir="ltr"
          value={email} onChange={event => setEmail(event.target.value)} /></label>
        <label>{t('كلمة المرور')}<input type="password" required minLength={12} autoComplete="current-password" dir="ltr"
          value={password} onChange={event => setPassword(event.target.value)} /></label>
        <button className="button" disabled={busy}>{t('دخول')}</button>
        <button className="button outline" value="create" disabled={busy}>{t('إنشاء حساب')}</button>
      </>}
      {error && <p role="alert" className="error">{error}</p>}
    </form>}
  </div></main>;
}
