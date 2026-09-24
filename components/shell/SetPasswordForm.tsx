'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client';

/** Accept-invite (name + password + PIN) and reset-password (password only) form. */
export function SetPasswordForm({ mode, token, defaultName = '' }: { mode: 'invite' | 'reset'; token: string; defaultName?: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const invite = mode === 'invite';
  const mismatch = !!confirm && confirm !== password;
  const valid = password.length >= 10 && password === confirm && (!invite || (name.trim().length >= 2 && /^\d{4}$/.test(pin)));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError('');
    const r = invite
      ? await api('/api/auth/invite', 'POST', { token, name, password, pin })
      : await api('/api/auth/reset', 'POST', { token, password });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.push(`/login?reason=${invite ? 'joined' : 'reset'}`);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {invite && (
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Your name</span>
          <input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} className="cf-input" />
        </label>
      )}
      <label className="flex flex-col gap-1.5">
        <span className="cf-label">{invite ? 'Password' : 'New password'}</span>
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="cf-input" />
        <span className="text-xs text-muted">At least 10 characters.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="cf-label">Confirm password</span>
        <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={mismatch} className="cf-input" />
        {mismatch && <span className="text-xs text-danger">Passwords don&rsquo;t match.</span>}
      </label>
      {invite && (
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Switch-user PIN</span>
          <input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} className="cf-input w-[180px] text-center font-mono text-xl tracking-[0.5em]" />
          <span className="text-xs text-muted">4 digits. Used to switch to you on shared front-desk computers.</span>
        </label>
      )}
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <button type="submit" disabled={!valid || busy} className="cf-btn-primary h-11">{busy ? 'Saving…' : invite ? 'Create account' : 'Set password'}</button>
    </form>
  );
}
