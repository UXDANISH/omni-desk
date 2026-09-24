'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { NOTIFICATION_EVENTS } from '@/lib/mock/team';
import type { NotificationPrefs } from '@/lib/types';

const COLS = 'grid-cols-[minmax(220px,1.8fr)_repeat(3,72px)]';
const CHANNELS = ['in app', 'email', 'text'];

export function NotificationsForm({ tabs, initial, userName }: { tabs: React.ReactNode; initial: NotificationPrefs; userName: string }) {
  const router = useRouter();
  const toast = useToast();
  const [prefs, setPrefs] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const change = (fn: (p: NotificationPrefs) => void) => {
    setPrefs((prev) => { const n = structuredClone(prev); fn(n); return n; });
    setDirty(true);
  };

  async function save() {
    const r = await api<{ message: string }>('/api/me/notifications', 'PUT', prefs);
    if (!r.ok) return toast(r.error);
    setDirty(false);
    toast(r.data.message);
    router.refresh();
  }

  return (
    <>
      <TopBar title="Settings" action={<button type="button" className="cf-btn-primary h-[38px]" disabled={!dirty} onClick={save}>{dirty ? 'Save changes' : 'Saved'}</button>} />
      <PageBody>
        {tabs}
        <div className="flex max-w-[880px] flex-col gap-4">
          <section className="cf-card overflow-x-auto" aria-labelledby="notif-h">
            <div className="min-w-[560px]">
              <div className="flex flex-col gap-0.5 border-b px-5 py-4">
                <h2 id="notif-h" className="text-base font-semibold">Notify {userName} when…</h2>
                <p className="text-[13px] text-muted">These are your personal settings. Each teammate picks their own. Texts and emails never include patient health details.</p>
              </div>
              <div className={`grid h-[42px] items-center gap-4 border-b bg-surface2 px-5 font-mono text-[11px] uppercase tracking-[0.1em] text-muted ${COLS}`}>
                <span>Event</span>{CHANNELS.map((c) => <span key={c} className="text-center">{c}</span>)}
              </div>
              {NOTIFICATION_EVENTS.map((ev) => (
                <div key={ev.key} className={`grid min-h-[60px] items-center gap-4 border-b px-5 py-2 last:border-b-0 ${COLS}`}>
                  <span className="flex flex-col"><span className="font-medium">{ev.label}</span><span className="text-xs text-muted">{ev.description}</span></span>
                  {prefs.events[ev.key].map((on, i) => (
                    <span key={i} className="grid place-items-center">
                      <Switch checked={on} label={`${ev.label}: ${CHANNELS[i]}`} onChange={(v) => change((p) => { p.events[ev.key][i] = v; })} />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <section className="cf-card grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px] p-[18px]">
            <label className="flex flex-col gap-1.5">
              <span className="cf-label">Daily summary time</span>
              <select value={prefs.summaryAt} onChange={(e) => change((p) => { p.summaryAt = e.target.value; })} className="cf-input max-w-[200px]">
                {['6:30 AM', '7:30 AM', '12:30 PM', '6:00 PM'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className="text-xs text-muted">Calls, bookings, and anything still open.</span>
            </label>
            <div className="flex items-start gap-3">
              <span className="flex flex-1 flex-col gap-0.5"><span className="font-medium">Quiet hours</span><span className="text-xs text-muted">No texts 9 PM–7 AM. Emergency alerts still come through.</span></span>
              <Switch checked={prefs.quietHours} label="Quiet hours" onChange={(v) => change((p) => { p.quietHours = v; })} />
            </div>
          </section>
        </div>
      </PageBody>
    </>
  );
}
