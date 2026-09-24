'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/client';
import type { Practice } from '@/lib/types';

const DEMO_USERS = [
  { email: 'dr.sample@smiledental.example', label: 'Dr. Sample', role: 'Owner' },
  { email: 'pat@smiledental.example', label: 'Pat Manager', role: 'Manager' },
  { email: 'lee@smiledental.example', label: 'Lee Frontdesk', role: 'Front desk' },
];

export function LoginForm({ demo }: { demo: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [practices, setPractices] = useState<Practice[] | null>(null);
  const [start, setStart] = useState('/overview');

  const next = params.get('next') || start;

  async function signIn(e?: React.FormEvent, override?: string) {
    e?.preventDefault();
    const em = override ?? email;
    setBusy(true);
    setError('');
    const r = await api<{ practices: Practice[]; startPage: string }>('/api/auth/login', 'POST', { email: em, password: password || 'demo' });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setStart(r.data.startPage);
    if (r.data.practices.length > 1) {
      setEmail(em);
      setPractices(r.data.practices);
    } else {
      router.push(params.get('next') || r.data.startPage);
      router.refresh();
    }
  }

  async function pickPractice(p: Practice) {
    await api('/api/auth/login', 'POST', { email, password: password || 'demo', practiceId: p.id });
    router.push(next);
    router.refresh();
  }

  if (practices) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Choose a location</h2>
        {practices.map((p) => (
          <button key={p.id} type="button" onClick={() => pickPractice(p)} className="cf-card flex min-h-16 items-center gap-3 px-4 py-3 text-left hover:border-accent">
            <span className="flex flex-1 flex-col"><span className="font-semibold">{p.name}</span><span className="font-mono text-xs uppercase text-muted">{p.location}</span></span>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {params.get('reason') === 'timeout' && (
        <p role="status" className="rounded-lg bg-surface2 px-3.5 py-3 text-[13px]">You were signed out after 15 minutes of inactivity.</p>
      )}
      <form onSubmit={signIn} className="flex flex-col gap-4" noValidate>
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Work email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="cf-input" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Password</span>
          <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="cf-input" />
        </label>
        {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
        <button type="submit" disabled={busy || !email} className="cf-btn-primary h-11">{busy ? 'Signing in…' : 'Sign in'}</button>
        <a href="#" className="cf-link self-start text-[13px]">Forgot password?</a>
      </form>
      {demo && (
        <div className="flex flex-col gap-2 rounded-xl border border-dashed p-4">
          <span className="cf-label">Demo · sign in as</span>
          <div className="flex flex-wrap gap-2">
            {DEMO_USERS.map((u) => (
              <button key={u.email} type="button" className="cf-btn" onClick={() => signIn(undefined, u.email)}>
                {u.label} <span className="font-mono text-[10px] uppercase text-muted">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
