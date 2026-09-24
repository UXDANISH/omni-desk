'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { Icon } from '@/components/ui/Icon';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { useToast } from '@/components/ui/Toast';
import { SwitchUserDialog } from '@/components/shell/SwitchUserDialog';
import { applyTheme, type ThemePref } from '@/components/shell/ThemeToggle';
import { api } from '@/lib/client';
import type { SessionInfo, TeamMember } from '@/lib/types';

export function ProfileForm({ me, sessions, themePref }: { me: TeamMember; sessions: SessionInfo[]; themePref: ThemePref }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [start, setStart] = useState(me.startPage ?? '/overview');
  const [twoStep, setTwoStep] = useState(!!me.twoStep);
  const [pref, setPref] = useState<ThemePref>(themePref);
  const [dirty, setDirty] = useState(false);
  const [switching, setSwitching] = useState(false);
  const owner = me.role === 'Owner';
  const edit = <T,>(set: (v: T) => void) => (v: T) => { set(v); setDirty(true); };

  async function save() {
    const r = await api<{ message: string }>('/api/me', 'PUT', { name, email, startPage: start });
    if (!r.ok) return toast(r.error);
    setDirty(false);
    toast(r.data.message);
    router.refresh();
  }

  async function endSession(id: string) {
    const r = await api<{ message: string }>(`/api/me/sessions/${id}`, 'DELETE');
    toast(r.ok ? r.data.message : r.error);
    router.refresh();
  }

  return (
    <>
      <TopBar title="Your profile" action={<button type="button" className="cf-btn-primary h-[38px]" disabled={!dirty} onClick={save}>{dirty ? 'Save changes' : 'Saved'}</button>} />
      <PageBody narrow>
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-chip text-[22px] font-semibold text-[#EDF1F3]">{me.initials}</span>
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[22px] font-semibold tracking-[-0.01em]">{name}</span>
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-muted">{me.role} · Smile Dental, Austin TX</span>
          </span>
          <button type="button" className="cf-btn" onClick={() => setSwitching(true)}><Icon name="switch" size={15} strokeWidth={1.8} />Switch user</button>
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(400px,1fr))]">
          <div className="flex flex-col gap-4">
            <section className="cf-card flex flex-col gap-3.5 p-[18px]">
              <h2 className="text-base font-semibold">Personal details</h2>
              <label className="flex flex-col gap-1.5"><span className="cf-label">Full name</span><input value={name} autoComplete="name" onChange={(e) => edit(setName)(e.target.value)} className="cf-input" /></label>
              <label className="flex flex-col gap-1.5"><span className="cf-label">Work email</span><input type="email" autoComplete="email" value={email} onChange={(e) => edit(setEmail)(e.target.value)} className="cf-input font-mono text-[13px]" /></label>
              <div className="flex flex-col gap-1.5"><span className="cf-label">Mobile · for alerts</span><MaskedPhone kind="member" id={me.id} last4={me.last4} large /></div>
              <div className="flex flex-col gap-1 border-t pt-3">
                <span className="cf-label">Role</span>
                <span className="font-medium">{me.role}</span>
                <span className="text-xs text-muted">{owner ? 'You own this practice account. Ownership can be transferred by contacting support.' : 'Set by the practice Owner. Ask Dr. Sample to change it.'}</span>
              </div>
            </section>
            <section className="cf-card flex flex-col gap-3.5 p-[18px]">
              <h2 className="text-base font-semibold">Preferences</h2>
              <div className="flex flex-col gap-1.5">
                <span className="cf-label">Appearance</span>
                <Segmented label="Appearance" value={pref} onChange={(v) => { setPref(v); applyTheme(v); }} options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'Match device' }]} />
                <span className="text-xs text-muted">Light is easier to read in bright operatories. Saved on this device.</span>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="cf-label">Open to this page after sign-in</span>
                <select value={start} onChange={(e) => edit(setStart)(e.target.value)} className="cf-input max-w-[240px]">
                  <option value="/overview">Overview</option>
                  <option value="/calls">Calls</option>
                  <option value="/appointments">Appointments</option>
                  <option value="/recall">Recall</option>
                </select>
              </label>
            </section>
          </div>

          <div className="flex flex-col gap-4">
            <section className="cf-card flex flex-col p-[18px]">
              <h2 className="mb-2.5 text-base font-semibold">Sign-in</h2>
              <div className="flex items-center gap-3 border-t py-3">
                <span className="flex flex-1 flex-col"><span className="font-medium">Password</span><span className="text-xs text-muted">Last changed Jul 14, 2026</span></span>
                <button type="button" className="cf-btn" onClick={() => toast(`A reset link will be emailed to ${email}.`)}>Change</button>
              </div>
              <div className="flex items-center gap-3 border-t py-3">
                <span className="flex flex-1 flex-col"><span className="font-medium">Switch-user PIN</span><span className="text-xs text-muted">4 digits, used on shared front-desk computers</span></span>
                <span className="font-mono tracking-[0.2em] text-muted" aria-hidden="true">••••</span>
                <button type="button" className="cf-btn" onClick={() => toast('PIN change form comes with the auth provider.')}>Change</button>
              </div>
              <div className="flex items-center gap-3 border-t py-3">
                <span className="flex flex-1 flex-col"><span className="font-medium">Two-step sign-in</span><span className="text-xs text-muted">Text a code to your mobile when signing in on a new device</span></span>
                <Switch checked={twoStep} label="Two-step sign-in" onChange={async (v) => { setTwoStep(v); const r = await api('/api/me', 'PUT', { twoStep: v }); toast(r.ok ? (v ? 'Two-step sign-in on. Codes go to your mobile.' : 'Two-step sign-in turned off.') : r.error); }} />
              </div>
              <p className="border-t pt-3 text-xs text-muted">You&apos;re signed out after 15 minutes of inactivity. The practice Owner sets this.</p>
            </section>

            <section className="cf-card overflow-hidden" aria-labelledby="sessions-h">
              <div className="flex items-center gap-2.5 border-b px-[18px] py-4">
                <h2 id="sessions-h" className="flex-1 text-base font-semibold">Where you&apos;re signed in</h2>
                {sessions.some((s) => !s.current) && <button type="button" className="cf-link py-1 text-[13px]" onClick={() => endSession('others')}>Sign out all others</button>}
              </div>
              {sessions.map((s) => (
                <div key={s.id} className="flex min-h-[60px] items-center gap-3 border-b px-[18px] py-2 last:border-b-0">
                  <Icon name={s.kind} size={20} className="shrink-0 text-muted" />
                  <span className="flex min-w-0 flex-1 flex-col"><span className="font-medium">{s.device}</span><span className="font-mono text-[11px] uppercase text-muted">{s.meta}</span></span>
                  {s.current ? (
                    <span className="whitespace-nowrap rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-medium text-ok">This device</span>
                  ) : (
                    <button type="button" className="cf-btn h-8 px-2.5 text-[13px]" onClick={() => endSession(s.id)}>Sign out</button>
                  )}
                </div>
              ))}
            </section>
          </div>
        </div>
      </PageBody>
      <SwitchUserDialog open={switching} onClose={() => setSwitching(false)} />
    </>
  );
}
