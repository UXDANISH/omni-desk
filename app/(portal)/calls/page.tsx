import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { FilterChips } from '@/components/ui/Nav';
import { Pill, Tag } from '@/components/ui/Pill';
import { Empty } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { requireSession } from '@/lib/auth';
import { listCalls } from '@/lib/db';
import { CALL_FILTERS, callCounts, queryCalls, type CallFilter } from '@/lib/queries';
import { OUTCOME } from '@/lib/tones';
import { one, withParams } from '@/lib/format';
import type { PageProps } from '@/lib/types';

export const metadata: Metadata = { title: 'Calls' };

const COLS = 'grid-cols-[128px_minmax(180px,1.1fr)_minmax(200px,1.4fr)_150px_80px_24px]';

export default async function CallsPage({ searchParams }: PageProps) {
  const { practiceId } = await requireSession();
  const calls = await listCalls(practiceId);
  const sp = await searchParams;
  const f = one(sp.outcome) as CallFilter | undefined;
  const filter: CallFilter = CALL_FILTERS.some((x) => x.key === f) ? (f as CallFilter) : 'all';
  const q = one(sp.q) ?? '';
  const after = one(sp.after) === '1';
  const current = { outcome: filter === 'all' ? undefined : filter, q: q || undefined, after: after ? '1' : undefined };
  const rows = queryCalls(calls, { filter, q, afterHours: after });
  const counts = callCounts(calls);

  return (
    <>
      <TopBar title="Calls" sample />
      <PageBody>
        <div className="flex flex-wrap items-center gap-3">
          {/* Plain GET form: search works without JavaScript and produces a shareable URL. */}
          <form role="search" action="/calls" className="flex h-10 max-w-[360px] flex-[1_1_240px] items-center gap-2 rounded-lg border bg-surface px-3">
            <Icon name="search" size={16} className="text-muted" />
            {current.outcome && <input type="hidden" name="outcome" value={current.outcome} />}
            {after && <input type="hidden" name="after" value="1" />}
            <input name="q" defaultValue={q} placeholder="Search caller or reason" aria-label="Search calls" className="min-w-0 flex-1 bg-transparent outline-none" />
          </form>
          <FilterChips
            label="Outcome filter"
            items={CALL_FILTERS.map((x) => ({ label: x.label, count: counts[x.key], active: filter === x.key, href: withParams('/calls', current, { outcome: x.key === 'all' ? undefined : x.key }) }))}
          />
          <Link
            href={withParams('/calls', current, { after: after ? undefined : '1' })}
            role="switch"
            aria-checked={after}
            scroll={false}
            className="ml-auto flex items-center gap-2 text-[13px] text-muted no-underline hover:text-ink"
          >
            <span className={clsx('flex h-5 w-[34px] rounded-full p-0.5', after ? 'justify-end bg-accent' : 'justify-start bg-line')}><span className="h-4 w-4 rounded-full bg-surface shadow" /></span>
            After hours only
          </Link>
        </div>

        {/* Desktop table */}
        <div role="table" aria-label="Call log" className="cf-card hidden md:block">
          <div role="row" className={clsx('cf-th', COLS)}>
            <span role="columnheader">Time</span><span role="columnheader">Caller</span><span role="columnheader">Reason</span><span role="columnheader">Outcome</span><span role="columnheader" className="text-right">Duration</span><span />
          </div>
          {rows.map((c) => (
            <div role="row" key={c.id} className={clsx('cf-row relative hover:bg-surface2', COLS, c.outcome === 'Live' && 'bg-accent-bg')}>
              <span role="cell" className="flex flex-col font-mono text-xs leading-snug"><span>{c.time}</span><span className="text-[11px] text-muted">{c.day}</span></span>
              <span role="cell" className="flex min-w-0 flex-col">
                <Link href={`/calls/${c.id}`} className="flex items-center gap-2 font-medium text-ink no-underline after:absolute after:inset-0 hover:text-ink">
                  {c.caller}{c.afterHours && <Tag>AFTER HRS</Tag>}
                </Link>
                <MaskedPhone kind="call" id={c.id} last4={c.last4} className="relative z-[1]" />
              </span>
              <span role="cell">{c.reason}</span>
              <span role="cell"><Pill tone={OUTCOME[c.outcome].tone} pulse={c.outcome === 'Live'}>{OUTCOME[c.outcome].label}</Pill></span>
              <span role="cell" className="cf-mono text-right text-[13px]">{c.duration}</span>
              <Icon name="chevronRight" size={16} className="text-muted" />
            </div>
          ))}
          {!rows.length && <Empty>No calls match these filters.</Empty>}
          <div className="px-5 py-3 font-mono text-[11px] text-muted">SHOWING {rows.length} OF {calls.length} CALLS · LAST 7 DAYS</div>
        </div>

        {/* Phone cards */}
        <ul className="flex flex-col gap-2.5 md:hidden">
          {rows.map((c) => (
            <li key={c.id}>
              <Link href={`/calls/${c.id}`} className="cf-card flex flex-col gap-2 px-4 py-3.5 text-ink no-underline hover:text-ink">
                <span className="flex items-center gap-2"><span className="flex-1 font-semibold">{c.caller}</span><span className="font-mono text-[11px] text-muted">{c.time} · {c.day}</span></span>
                <span className="text-muted">{c.reason}</span>
                <span className="flex items-center gap-2.5"><Pill tone={OUTCOME[c.outcome].tone}>{OUTCOME[c.outcome].label}</Pill><span className="ml-auto font-mono text-xs text-muted">{c.duration}</span></span>
              </Link>
            </li>
          ))}
          {!rows.length && <Empty>No calls match these filters.</Empty>}
        </ul>
      </PageBody>
    </>
  );
}
