'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mmss } from '@/lib/format';

const IDLE_WARN_MS = 13 * 60 * 1000; // warn after 13 min idle
const COUNTDOWN_S = 120; // sign out at 15 min

/** Signs people out after 15 minutes of inactivity so patient details aren't left open on shared screens. */
export function SessionTimeout() {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);
  const idle = useRef<ReturnType<typeof setTimeout>>(undefined);
  const tick = useRef<ReturnType<typeof setInterval>>(undefined);

  const signOut = useCallback(async () => {
    clearInterval(tick.current);
    setLeft(null);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login?reason=timeout');
    router.refresh();
  }, [router]);

  const startCountdown = useCallback(() => {
    setLeft(COUNTDOWN_S);
    clearInterval(tick.current);
    tick.current = setInterval(() => setLeft((l) => (l === null ? null : l - 1)), 1000);
  }, []);

  const reset = useCallback(() => {
    clearTimeout(idle.current);
    idle.current = setTimeout(startCountdown, IDLE_WARN_MS);
  }, [startCountdown]);

  useEffect(() => {
    if (left !== null && left <= 0) signOut();
  }, [left, signOut]);

  useEffect(() => {
    const onActivity = () => { if (left === null) reset(); };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll'] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    window.addEventListener('cf-session-preview', startCountdown);
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.removeEventListener('cf-session-preview', startCountdown);
      clearTimeout(idle.current);
    };
  }, [left, reset, startCountdown]);

  if (left === null) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-[var(--scrim)] p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cf-session-title" className="cf-card flex w-full max-w-[420px] flex-col gap-3.5 p-6 shadow-pop">
        <span className="cf-label">Inactive for 13 minutes</span>
        <h2 id="cf-session-title" className="text-xl font-semibold">
          You&apos;ll be signed out in <span className="font-mono font-medium">{mmss(Math.max(0, left))}</span>
        </h2>
        <p className="text-muted">We sign you out after 15 minutes of inactivity so patient details aren&apos;t left open on a shared screen.</p>
        <div className="mt-1.5 flex justify-end gap-2.5">
          <button type="button" className="cf-btn h-10" onClick={signOut}>Sign out</button>
          <button type="button" autoFocus className="cf-btn-primary" onClick={() => { clearInterval(tick.current); setLeft(null); reset(); }}>Stay signed in</button>
        </div>
      </div>
    </div>
  );
}
