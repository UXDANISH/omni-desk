'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';

/** Change password (needs current password) or switch-user PIN (needs password). */
export function ChangeSecretDialog({ kind, open, onClose }: { kind: 'password' | 'pin'; open: boolean; onClose: () => void }) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isPin = kind === 'pin';
  const valid = isPin ? /^\d{4}$/.test(next) && !!current : next.length >= 10 && next === confirm && !!current;

  const close = () => {
    setCurrent(''); setNext(''); setConfirm(''); setError('');
    onClose();
  };

  async function save() {
    if (!valid) return;
    setBusy(true);
    const r = isPin
      ? await api<{ message: string }>('/api/me/pin', 'PUT', { password: current, pin: next })
      : await api<{ message: string }>('/api/me/password', 'PUT', { current, next });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(r.data.message);
    close();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={isPin ? 'Change switch-user PIN' : 'Change password'}
      footer={<><button type="button" className="cf-btn h-10" onClick={close}>Cancel</button><button type="button" className="cf-btn-primary" disabled={!valid || busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button></>}
    >
      <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); save(); }}>
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">{isPin ? 'Your password' : 'Current password'}</span>
          <input type="password" autoComplete="current-password" value={current} onChange={(e) => { setCurrent(e.target.value); setError(''); }} className="cf-input" />
        </label>
        {isPin ? (
          <label className="flex flex-col gap-1.5">
            <span className="cf-label">New 4-digit PIN</span>
            <input type="password" inputMode="numeric" autoComplete="off" value={next} onChange={(e) => { setNext(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} className="cf-input w-[180px] text-center font-mono text-xl tracking-[0.5em]" />
          </label>
        ) : (
          <>
            <label className="flex flex-col gap-1.5">
              <span className="cf-label">New password</span>
              <input type="password" autoComplete="new-password" value={next} onChange={(e) => { setNext(e.target.value); setError(''); }} className="cf-input" />
              <span className="text-xs text-muted">At least 10 characters. Other devices are signed out.</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="cf-label">Confirm new password</span>
              <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} aria-invalid={!!confirm && confirm !== next} className="cf-input" />
              {!!confirm && confirm !== next && <span className="text-xs text-danger">Passwords don&rsquo;t match.</span>}
            </label>
          </>
        )}
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
