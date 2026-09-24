'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Tabs, Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { LockedNote } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { VOICES, ESCALATION_OPTIONS } from '@/lib/mock/receptionist';
import type { ReceptionistSettings } from '@/lib/types';

type Tab = 'greeting' | 'hours' | 'services' | 'guard' | 'esc';
const TABS: { value: Tab; label: string }[] = [
  { value: 'greeting', label: 'Greeting & voice' },
  { value: 'hours', label: 'Hours' },
  { value: 'services', label: 'Services' },
  { value: 'guard', label: 'Never do' },
  { value: 'esc', label: 'Escalation' },
];
const SVC_COLS = 'grid-cols-[minmax(160px,1.4fr)_90px_minmax(120px,1fr)_90px_120px_110px]';
const ESC_COLS = 'grid-cols-[minmax(220px,1.4fr)_minmax(190px,1fr)_minmax(190px,1fr)]';

export function ReceptionistForm({ initial, readOnly }: { initial: ReceptionistSettings; readOnly: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('greeting');
  const [s, setS] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState('');
  const [previewing, setPreviewing] = useState<string | null>(null);

  const update = (fn: (d: ReceptionistSettings) => void) => {
    if (readOnly) return;
    setS((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  async function save() {
    setSaving(true);
    const r = await api<{ message: string }>('/api/receptionist', 'PUT', s);
    setSaving(false);
    if (!r.ok) return toast(r.error);
    setDirty(false);
    toast(r.data.message);
    router.refresh();
  }

  const action = readOnly ? null : (
    <button type="button" className="cf-btn-primary h-[38px]" disabled={!dirty || saving} onClick={save}>
      {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
    </button>
  );

  return (
    <>
      <TopBar title="AI Receptionist" action={action} />
      <PageBody>
        {readOnly && <LockedNote>View only. An Owner or Manager can change how OmniDesk answers calls.</LockedNote>}
        <Tabs label="Receptionist settings" items={TABS} value={tab} onChange={setTab} />
        {!readOnly && dirty && (
          <div className="flex items-center justify-between gap-3 rounded-lg border bg-surface px-3.5 py-2.5 md:hidden">
            <span className="text-[13px] text-muted">Unsaved changes</span>
            {action}
          </div>
        )}

        {tab === 'greeting' && (
          <div className="grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
            <section className="cf-card flex flex-col gap-4 p-[18px]">
              <h2 className="text-base font-semibold">Greeting</h2>
              <label className="flex flex-col gap-1.5">
                <span className="cf-label">During office hours</span>
                <textarea rows={3} value={s.greeting} disabled={readOnly} onChange={(e) => update((d) => { d.greeting = e.target.value; })} className="cf-input h-auto resize-y py-2.5" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="cf-label">After hours</span>
                <textarea rows={3} value={s.afterGreeting} disabled={readOnly} onChange={(e) => update((d) => { d.afterGreeting = e.target.value; })} className="cf-input h-auto resize-y py-2.5" />
              </label>
              <p className="text-xs text-muted">Every call opens by saying it&apos;s a virtual receptionist. That line can&apos;t be removed.</p>
            </section>
            <section className="cf-card flex flex-col gap-4 p-[18px]">
              <h2 className="text-base font-semibold">Voice</h2>
              <div role="radiogroup" aria-label="Voice" className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                {VOICES.map((v) => {
                  const active = s.voice === v.name;
                  return (
                    <div key={v.name} role="radio" aria-checked={active} tabIndex={0} onClick={() => update((d) => { d.voice = v.name; })} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), update((d) => { d.voice = v.name; }))}
                      className={clsx('flex cursor-pointer flex-col gap-2 rounded-[10px] p-3', active ? 'border-2 border-accent bg-accent-bg' : 'border bg-surface')}>
                      <span className="flex items-center gap-2"><span className="flex-1 font-semibold">{v.name}</span><span className={clsx('h-3.5 w-3.5 rounded-full border-2', active ? 'border-accent bg-accent' : 'border-muted')} /></span>
                      <span className="text-xs text-muted">{v.description}</span>
                      <button type="button" className="cf-btn h-7 self-start px-2.5 text-xs" onClick={(e) => { e.stopPropagation(); setPreviewing(v.name); setTimeout(() => setPreviewing(null), 2500); }}>
                        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>
                        {previewing === v.name ? 'Playing…' : 'Preview'}
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="cf-label">Speaking pace</span>
                <Segmented label="Speaking pace" disabled={readOnly} value={s.pace} onChange={(v) => update((d) => { d.pace = v; })} options={(['Slower', 'Normal', 'Faster'] as const).map((p) => ({ value: p, label: p }))} />
              </div>
              <div className="flex items-center gap-3 border-t pt-3.5">
                <span className="flex flex-1 flex-col"><span className="font-medium">Answer in Spanish when the caller does</span><span className="text-xs text-muted">Switches language mid-call. Transcripts are shown in English.</span></span>
                <Switch checked={s.spanish} disabled={readOnly} label="Answer in Spanish" onChange={(v) => update((d) => { d.spanish = v; })} />
              </div>
            </section>
          </div>
        )}

        {tab === 'hours' && (
          <div className="grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(420px,1fr))]">
            <section className="cf-card overflow-hidden">
              <h2 className="border-b px-[18px] py-4 text-base font-semibold">Office hours</h2>
              {s.hours.map((h, i) => (
                <div key={h.day} className="grid min-h-14 grid-cols-[64px_44px_1fr] items-center gap-3 border-b px-[18px] py-2 last:border-b-0">
                  <span className="font-medium">{h.day}</span>
                  <Switch checked={h.open} disabled={readOnly} label={`${h.day} open`} onChange={(v) => update((d) => { d.hours[i].open = v; if (v && !d.hours[i].from) { d.hours[i].from = '9:00 AM'; d.hours[i].to = '1:00 PM'; } })} />
                  {h.open ? (
                    <span className="flex items-center gap-2">
                      <input aria-label={`${h.day} opens`} value={h.from} disabled={readOnly} onChange={(e) => update((d) => { d.hours[i].from = e.target.value; })} className="cf-input h-[38px] w-[110px] font-mono text-[13px]" />
                      <span className="text-muted">to</span>
                      <input aria-label={`${h.day} closes`} value={h.to} disabled={readOnly} onChange={(e) => update((d) => { d.hours[i].to = e.target.value; })} className="cf-input h-[38px] w-[110px] font-mono text-[13px]" />
                    </span>
                  ) : <span className="text-muted">Closed</span>}
                </div>
              ))}
            </section>
            <section className="cf-card flex flex-col gap-2.5 p-[18px]">
              <h2 className="mb-1 text-base font-semibold">When the office is closed</h2>
              <div role="radiogroup" aria-label="After-hours behavior" className="flex flex-col gap-2.5">
                {([
                  ['book', 'Answer and book', 'Books into open slots and texts deposit links, same as office hours.'],
                  ['message', 'Answer and take messages', 'No booking after hours. Messages land in Calls for the morning.'],
                  ['emergency', 'Emergencies only', 'Plays the closed greeting and only escalates emergencies to the on-call dentist.'],
                ] as const).map(([k, l, desc]) => {
                  const active = s.afterMode === k;
                  return (
                    <button key={k} type="button" role="radio" aria-checked={active} disabled={readOnly} onClick={() => update((d) => { d.afterMode = k; })} className={clsx('flex items-start gap-3 rounded-[10px] px-3.5 py-3 text-left', active ? 'border-2 border-accent bg-accent-bg' : 'border bg-surface')}>
                      <span className={clsx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border-2', active ? 'border-accent' : 'border-muted')}>{active && <span className="h-2 w-2 rounded-full bg-accent" />}</span>
                      <span className="flex flex-col gap-0.5"><span className="font-semibold">{l}</span><span className="text-[13px] text-muted">{desc}</span></span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-1 flex flex-col gap-1.5 border-t pt-3">
                <span className="cf-label">Holiday closures</span>
                <span className="flex justify-between text-[13px]"><span>Thanksgiving</span><span className="font-mono text-muted">NOV 26–27</span></span>
                <span className="flex justify-between text-[13px]"><span>Winter break</span><span className="font-mono text-muted">DEC 24–JAN 1</span></span>
              </div>
            </section>
          </div>
        )}

        {tab === 'services' && (
          <div className="flex flex-col gap-2.5">
            <p className="max-w-[640px] text-muted">OmniDesk books only services switched on here, at these lengths, with the right provider. Anything else becomes a callback for the front desk.</p>
            <div role="table" aria-label="Bookable services" className="cf-card overflow-x-auto 2xl:overflow-visible">
              <div className="min-w-[860px] 2xl:min-w-0">
                <div role="row" className={clsx('cf-th static 2xl:sticky', SVC_COLS)}><span>Service</span><span>Length</span><span>Provider</span><span>Deposit</span><span>New patients</span><span>AI may book</span></div>
                {s.services.map((v, i) => (
                  <div role="row" key={v.name} className={clsx('cf-row min-h-14', SVC_COLS)}>
                    <span className="flex flex-col"><span className="font-medium">{v.name}</span>{v.note && <span className="text-xs text-muted">{v.note}</span>}</span>
                    <span className="font-mono text-[13px]">{v.duration} MIN</span>
                    <span className="text-muted">{v.provider}</span>
                    <span className="font-mono text-[13px]">{v.deposit ? `$${v.deposit}` : '—'}</span>
                    <span><Switch checked={v.newPatients} disabled={readOnly} label={`${v.name}: new patients`} onChange={(x) => update((d) => { d.services[i].newPatients = x; })} /></span>
                    <span><Switch checked={v.aiMayBook} disabled={readOnly} label={`${v.name}: AI may book`} onChange={(x) => update((d) => { d.services[i].aiMayBook = x; })} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'guard' && (
          <section className="cf-card max-w-[820px] overflow-hidden">
            <div className="flex flex-col gap-0.5 border-b px-[18px] py-4">
              <h2 className="text-base font-semibold">OmniDesk must never…</h2>
              <p className="text-[13px] text-muted">If a caller pushes for one of these, it says the team will follow up and flags the call.</p>
            </div>
            {s.guardrails.map((g, i) => (
              <div key={g.text} className="flex min-h-14 items-center gap-3 border-b px-[18px] py-2">
                <span className="flex-1">{g.text}</span>
                {g.locked ? (
                  <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.08em] text-muted"><Icon name="lock" size={12} strokeWidth={2} />ALWAYS ON</span>
                ) : (
                  <Switch checked={g.on} disabled={readOnly} label={g.text} onChange={(x) => update((d) => { d.guardrails[i].on = x; })} />
                )}
              </div>
            ))}
            <form className="flex gap-2.5 px-[18px] py-3.5" onSubmit={(e) => { e.preventDefault(); const t = draft.trim(); if (!t) return; update((d) => { d.guardrails.push({ text: t.replace(/^never\s+/i, '').replace(/^./, (c) => c.toUpperCase()), locked: false, on: true }); }); setDraft(''); }}>
              <input value={draft} disabled={readOnly} onChange={(e) => setDraft(e.target.value)} placeholder="Add a rule, e.g. Never book Dr. Sample on Fridays" aria-label="New rule" className="cf-input h-[38px] min-w-0 flex-1" />
              <button type="submit" disabled={readOnly || !draft.trim()} className="cf-btn h-[38px]">Add rule</button>
            </form>
          </section>
        )}

        {tab === 'esc' && (
          <div className="flex flex-col gap-4">
            <div role="table" aria-label="Escalation rules" className="cf-card overflow-x-auto xl:overflow-visible">
              <div className="min-w-[720px] xl:min-w-0">
                <div role="row" className={clsx('cf-th static xl:sticky', ESC_COLS)}><span>When the caller…</span><span>During office hours</span><span>After hours</span></div>
                {s.escalation.map((e, i) => (
                  <div role="row" key={e.name} className={clsx('cf-row min-h-[68px]', ESC_COLS)}>
                    <span className="flex flex-col"><span className="font-semibold">{e.name}</span><span className="text-xs text-muted">{e.description}</span></span>
                    <select aria-label={`${e.name} during office hours`} value={e.during} disabled={readOnly} onChange={(ev) => update((d) => { d.escalation[i].during = ev.target.value; })} className="cf-input h-[38px]">
                      {ESCALATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <select aria-label={`${e.name} after hours`} value={e.after} disabled={readOnly} onChange={(ev) => update((d) => { d.escalation[i].after = ev.target.value; })} className="cf-input h-[38px]">
                      {ESCALATION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <section className="cf-card grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[18px] p-[18px]">
              <div className="flex flex-col gap-1"><span className="cf-label">Front desk line</span><span className="font-mono">(512) 555-0100</span><span className="text-xs text-muted">Rings desk phones 1 and 2</span></div>
              <div className="flex flex-col gap-1"><span className="cf-label">On-call dentist</span><span className="font-mono">***-***-0107</span><span className="text-xs text-muted">Dr. Sample · texts only, no calls</span></div>
              <label className="flex flex-col gap-1">
                <span className="cf-label">If a transfer isn&apos;t answered in</span>
                <select value={s.transferTimeout} disabled={readOnly} onChange={(e) => update((d) => { d.transferTimeout = Number(e.target.value); })} className="cf-input h-[38px] max-w-[160px]">
                  {[20, 30, 45].map((n) => <option key={n} value={n}>{n} seconds</option>)}
                </select>
                <span className="text-xs text-muted">OmniDesk takes a message and flags it as Needs human</span>
              </label>
            </section>
          </div>
        )}
      </PageBody>
    </>
  );
}
