import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { SegmentedLinks, FilterChips } from '@/components/ui/Nav';
import { Pill, Tag } from '@/components/ui/Pill';
import { Icon } from '@/components/ui/Icon';
import { requireSession } from '@/lib/auth';
import { listAppointments } from '@/lib/db';
import { PROVIDERS, WEEK, TODAY_INDEX, NOW_MINUTES } from '@/lib/mock/appointments';
import { statusTone } from '@/lib/tones';
import { dayLabel, fmtTime, one, withParams } from '@/lib/format';
import type { Appointment, PageProps } from '@/lib/types';
import { AppointmentDrawer } from './AppointmentDrawer';
import { NewAppointmentButton } from './NewAppointmentButton';

export const metadata: Metadata = { title: 'Appointments' };

const HOUR = 80;
const DAY_START = 480; // 8:00 AM
const LIST_COLS = 'grid-cols-[minmax(150px,.9fr)_minmax(160px,1.2fr)_minmax(120px,.9fr)_minmax(140px,1fr)_minmax(170px,1.1fr)_120px]';

function blockClass(a: Appointment) {
  return clsx(
    'flex flex-col gap-px overflow-hidden rounded-md border text-left text-ink no-underline hover:text-ink hover:shadow-md',
    a.bookedBy === 'ai' ? 'border-accent bg-accent-bg' : 'bg-surface2',
    a.status === 'Unconfirmed' && 'border-dashed',
    a.status === 'Completed' && 'opacity-60',
  );
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const { practiceId } = await requireSession();
  const appointments = await listAppointments(practiceId);
  const sp = await searchParams;
  const view = (['day', 'week', 'list'] as const).find((v) => v === one(sp.view)) ?? 'day';
  const day = Math.min(5, Math.max(0, Number(one(sp.day) ?? TODAY_INDEX) || 0));
  const by = (['ai', 'staff'] as const).find((v) => v === one(sp.by));
  const apptId = one(sp.appt);
  const current = { view: view === 'day' ? undefined : view, day: view === 'day' && day !== TODAY_INDEX ? String(day) : undefined, by };

  const scope = view === 'day' ? appointments.filter((a) => a.day === day) : view === 'week' ? appointments.filter((a) => a.day < 6) : appointments.filter((a) => a.day >= TODAY_INDEX);
  const shown = scope.filter((a) => !by || a.bookedBy === by);
  const aiN = scope.filter((a) => a.bookedBy === 'ai').length;
  const unconfirmed = scope.filter((a) => a.status === 'Unconfirmed').length;
  const selected = appointments.find((a) => a.id === apptId);
  const href = (a: Appointment) => withParams('/appointments', current, { appt: a.id });
  const title = (a: Appointment) => `${fmtTime(a.start)} · ${a.patient} · ${a.service} · ${a.status}`;

  return (
    <>
      <TopBar title="Appointments" sample action={<NewAppointmentButton />} />
      <PageBody>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedLinks label="View" items={(['day', 'week', 'list'] as const).map((v) => ({ label: v[0].toUpperCase() + v.slice(1), href: withParams('/appointments', current, { view: v === 'day' ? undefined : v }), active: view === v }))} />
          <div className="flex items-center gap-1">
            {view === 'day' && (
              <Link aria-label="Previous day" aria-disabled={day === 0} href={withParams('/appointments', current, { day: String(Math.max(0, day - 1)) })} className={clsx('grid h-[34px] w-[34px] place-items-center rounded-lg border bg-surface text-ink', day === 0 && 'pointer-events-none opacity-40')}><Icon name="chevronLeft" size={14} strokeWidth={2} /></Link>
            )}
            <span className="min-w-[150px] whitespace-nowrap text-center font-semibold">
              {view === 'day' ? `${WEEK[day][0]}, ${WEEK[day][1]}${day === TODAY_INDEX ? ' · Today' : ''}` : view === 'week' ? 'Sep 21 – 26, 2026' : 'Today onward'}
            </span>
            {view === 'day' && (
              <>
                <Link aria-label="Next day" aria-disabled={day === 5} href={withParams('/appointments', current, { day: String(Math.min(5, day + 1)) })} className={clsx('grid h-[34px] w-[34px] place-items-center rounded-lg border bg-surface text-ink', day === 5 && 'pointer-events-none opacity-40')}><Icon name="chevronRight" size={14} strokeWidth={2} /></Link>
                <Link href={withParams('/appointments', current, { day: undefined })} className="cf-btn h-[34px] text-[13px] no-underline">Today</Link>
              </>
            )}
          </div>
          <div className="md:ml-auto">
            <FilterChips label="Booked by" items={[
              { label: 'All', count: scope.length, active: !by, href: withParams('/appointments', current, { by: undefined }) },
              { label: 'Booked by OmniDesk', count: aiN, active: by === 'ai', href: withParams('/appointments', current, { by: 'ai' }) },
              { label: 'Booked by staff', count: scope.length - aiN, active: by === 'staff', href: withParams('/appointments', current, { by: 'staff' }) },
            ]} />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-muted">
          <span>{scope.length} appointments · {aiN} booked by OmniDesk · {unconfirmed} unconfirmed</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-[18px] rounded-sm border border-accent bg-accent-bg" />OmniDesk</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-[18px] rounded-sm border border-dashed border-muted" />Unconfirmed</span>
        </div>

        {view === 'day' && (
          <div className="cf-card overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[64px_repeat(3,minmax(0,1fr))] rounded-t-xl border-b bg-surface2">
                <span />
                {PROVIDERS.map((p, pi) => (
                  <div key={p.name} className="flex flex-col border-l px-3 py-2.5">
                    <span className="font-semibold">{p.name}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">{p.role} · {scope.filter((a) => a.provider === pi).length} appts</span>
                  </div>
                ))}
              </div>
              <div className="relative grid grid-cols-[64px_repeat(3,minmax(0,1fr))] pt-2" style={{ height: HOUR * 9 + 8 }}>
                <div className="relative">
                  {[8, 9, 10, 11, 12, 13, 14, 15, 16].map((h) => (
                    <span key={h} className="absolute right-2.5 font-mono text-[11px] leading-none text-muted" style={{ top: (h - 8) * HOUR + 2 }}>{((h + 11) % 12) + 1} {h < 12 ? 'AM' : 'PM'}</span>
                  ))}
                </div>
                {PROVIDERS.map((p, pi) => (
                  <div key={p.name} className="relative border-l" style={{ backgroundImage: `repeating-linear-gradient(to bottom, var(--border) 0 1px, transparent 1px ${HOUR}px)` }}>
                    {shown.filter((a) => a.provider === pi).map((a) => (
                      <Link key={a.id} href={href(a)} scroll={false} title={title(a)} className={clsx('absolute inset-x-1', blockClass(a), a.duration <= 30 ? 'px-2 py-[3px]' : 'px-2 py-[5px]')} style={{ top: ((a.start - DAY_START) / 60) * HOUR + 1, height: (a.duration / 60) * HOUR - 3 }}>
                        <span className="flex items-center gap-1.5 font-mono text-[11px] leading-tight text-muted">{fmtTime(a.start)}{a.bookedBy === 'ai' && <span className="ml-auto"><Tag tone="ai">AI</Tag></span>}</span>
                        <span className="truncate text-[13px] font-semibold leading-tight">{a.patient}</span>
                        {a.duration > 30 && <span className="truncate text-xs leading-tight text-muted">{a.service}</span>}
                      </Link>
                    ))}
                  </div>
                ))}
                {day === TODAY_INDEX && (
                  <div aria-hidden="true" className="pointer-events-none absolute left-[60px] right-0 h-0.5 bg-accent" style={{ top: ((NOW_MINUTES - DAY_START) / 60) * HOUR + 8 }}>
                    <span className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="cf-card overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-[repeat(6,minmax(150px,1fr))]">
              {[0, 1, 2, 3, 4, 5].map((d) => {
                const all = appointments.filter((a) => a.day === d);
                return (
                  <div key={d} className="flex flex-col border-l first:border-l-0">
                    <Link href={withParams('/appointments', { by }, { day: d === TODAY_INDEX ? undefined : String(d) })} className={clsx('flex items-baseline gap-2 border-b px-3 py-2.5 no-underline', d === TODAY_INDEX ? 'bg-accent-bg text-accent-tx' : 'bg-surface2 text-ink')}>
                      <span className="font-semibold">{WEEK[d][0]} {WEEK[d][1].split(' ')[1]}</span>
                      <span className="ml-auto font-mono text-[11px] text-muted">{all.length}</span>
                    </Link>
                    <div className="flex flex-col gap-1 p-2">
                      {all.filter((a) => !by || a.bookedBy === by).map((a) => (
                        <Link key={a.id} href={href(a)} scroll={false} title={`${title(a)} · ${PROVIDERS[a.provider].name}`} className={clsx(blockClass(a), 'px-2 py-1.5')}>
                          <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">{fmtTime(a.start)}{a.bookedBy === 'ai' && <span className="ml-auto"><Tag tone="ai">AI</Tag></span>}</span>
                          <span className="truncate text-[13px] font-medium">{a.patient}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'list' && (
          <div role="table" aria-label="Upcoming appointments" className="cf-card overflow-x-auto 2xl:overflow-visible">
            <div className="min-w-[980px] 2xl:min-w-0">
              <div role="row" className={clsx('cf-th static 2xl:sticky', LIST_COLS)}><span>When</span><span>Patient</span><span>Provider</span><span>Service</span><span>Booked by</span><span>Status</span></div>
              {shown.map((a) => (
                <Link role="row" key={a.id} href={href(a)} scroll={false} className={clsx('cf-row text-ink no-underline hover:bg-surface2 hover:text-ink', LIST_COLS)}>
                  <span className="flex flex-col font-mono text-xs"><span>{fmtTime(a.start)}</span><span className="text-[11px] text-muted">{dayLabel(a.day)}</span></span>
                  <span className="font-medium">{a.patient}</span>
                  <span className="text-muted">{PROVIDERS[a.provider].name}</span>
                  <span>{a.service}</span>
                  <span className="flex items-center gap-2">{a.bookedBy === 'ai' && <Tag tone="ai">AI</Tag>}<span className={a.bookedBy === 'ai' ? 'text-accent-tx' : 'text-muted'}>{a.bookedBy === 'ai' ? `OmniDesk${a.callId ? ` · ${a.callId}` : ''}` : a.staffName}</span></span>
                  <span><Pill tone={statusTone(a.status)}>{a.status}</Pill></span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </PageBody>
      {selected && <AppointmentDrawer appt={selected} provider={PROVIDERS[selected.provider].name} closeHref={withParams('/appointments', current, {})} />}
    </>
  );
}
