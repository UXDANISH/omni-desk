'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { useSession, type SwitchCandidate } from './SessionProvider';

/** Shared front-desk computers: switch who is using the screen without a full sign-out. */
export function SwitchUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, team } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [pick, setPick] = useState<SwitchCandidate | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    setPick(null);
    setPin('');
    setError('');
    onClose();
  };

  async function confirm() {
    if (!pick || pin.length < 4) return;
    setBusy(true);
    const r = await api('/api/auth/switch', 'POST', { userId: pick.id, pin });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    toast(`Switched to ${pick.name}. ${user.name}'s session is locked.`);
    close();
    router.refresh();
  }

  return (
    <Modal
      open={open}
      onClose={close}
      width={460}
      title={pick ? `Enter ${pick.name.split(' ').slice(-1)[0]}'s PIN` : 'Switch user'}
      footer={
        <>
          <button type="button" className="cf-btn h-10" onClick={close}>Cancel</button>
          {pick && <button type="button" className="cf-btn-primary" disabled={pin.length < 4 || busy} onClick={confirm}>Switch</button>}
        </>
      }
    >
      <p className="-mt-2 text-[13px] text-muted">
        {pick ? `${user.name}'s session locks and stays signed in. Nothing is lost.` : 'For shared front-desk computers. Pick who is using this screen; they enter their own PIN.'}
      </p>
      {!pick ? (
        <div className="flex flex-col gap-1.5">
          {team.map((t) => {
            const current = t.id === user.id;
            return (
              <button key={t.id} type="button" disabled={current} onClick={() => setPick(t)} className={`flex min-h-14 items-center gap-3 rounded-[10px] border px-3 py-2 text-left hover:border-accent disabled:cursor-default ${current ? 'bg-surface2' : 'bg-surface'}`}>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface2 text-sm font-semibold">{t.initials}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{t.name}</span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{t.role}</span>
                </span>
                <span className="text-xs text-muted">{current ? 'Signed in now' : t.lastActive === 'Active now' ? '' : `Last active ${t.lastActive.toLowerCase()}`}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3.5">
          <div className="flex w-full items-center gap-3 rounded-[10px] bg-surface2 px-3 py-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-sm font-semibold">{pick.initials}</span>
            <span className="flex flex-1 flex-col"><span className="font-semibold">{pick.name}</span><span className="font-mono text-[11px] uppercase tracking-[0.06em] text-muted">{pick.role}</span></span>
            <button type="button" className="cf-link text-[13px]" onClick={() => { setPick(null); setPin(''); setError(''); }}>Change</button>
          </div>
          <label className="flex w-full flex-col items-center gap-2">
            <span className="cf-label">Enter 4-digit PIN</span>
            <input
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && confirm()}
              inputMode="numeric"
              type="password"
              autoComplete="off"
              aria-label="PIN"
              aria-invalid={!!error}
              className="cf-input h-[52px] w-[180px] text-center font-mono text-2xl tracking-[0.6em]"
            />
            {error ? <span role="alert" className="text-xs text-danger">{error}</span> : <span className="text-xs text-muted">Demo: any 4 digits work.</span>}
          </label>
        </div>
      )}
    </Modal>
  );
}
