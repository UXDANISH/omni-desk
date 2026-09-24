import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { SegmentedLinks } from '@/components/ui/Nav';
import { Pill, Tag } from '@/components/ui/Pill';
import { Card, CardHeader, StatTile, Empty } from '@/components/ui/Card';
import { ActionButton } from '@/components/ui/ActionButton';
import { Icon } from '@/components/ui/Icon';
import { requireUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { db } from '@/lib/db';
import { PROVIDERS, TODAY_INDEX, NOW_MINUTES, WEEK } from '@/lib/mock/appointments';
import { STATS, RANGES, OVERVIEW, MIX_LEGEND, WAITING, TAG_PRIORITY, parseRange } from '@/lib/mock/stats';
import { OUTCOME, attentionTone, isNeedsHuman, needsAttention } from '@/lib/tones';
import { fmtNumber, fmtTime, money, one } from '@/lib/format';
import type { PageProps } from '@/lib/types';

export const metadata: Metadata = { title: 'Overview' };

const pct = (now: number, prev: number) => {
  const d = Math.round(((now - prev) / prev) * 100);
  return `${d >= 0 ? '+' : ''}${d}%`;
};

export default async function OverviewPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const range = parseRange(one((await searchParams).range));
  const st = STATS[range];
  const ov = OVERVIEW[range];
  const showMoney = can(user.role, 'seeDepositTotals');

  const needs = db.calls.filter(isNeedsHuman);
  const attention = db.calls.filter(needsAttention).sort((a, b) => (TAG_PRIORITY[a.tag ?? ''] ?? 9) - (TAG_PRIORITY[b.tag ?? ''] ?? 9));
  const live = db.calls.find((c) => c.outcome === 'Live');
  const latest = db.calls.slice(0, 5);
  const today = db.appointments.filter((a) => a.day === TODAY_INDEX);
  const upNext = today.filter((a) => a.start >= NOW_MINUTES).slice(0, 5);
  const mixTotal = ov.mix.reduce((x, y) => x + y, 0);
  const maxBar = Math.max(...ov.bars.map((b) => b[1]));
  const rangeLinks = RANGES.map((r) => ({ label: STATS[r].label, href: `/overview?range=${r}`, active: r === range }));
  const rangeUpper = range === 'today' ? 'TODAY' : `LAST ${st.label.toUpperCase()}`;
  const firstName = user.name.startsWith('Dr.') ? user.name : user.name.split(' ')[0];

  const primary = needs.length > 0 && (
    <Link href="/calls?outcome=needs" className="cf-btn-primary h-[38px] no-underline hover:text-on-accent">
      <span className="hidden 2xl:inline">Review {needs.length} calls needing a human</span>
      <span className="2xl:hidden">Review {needs.length} calls</span>
    </Link>
  );

  return (
    <>
      <TopBar title="Overview" sample controls={<SegmentedLinks label="Date range" items={rangeLinks} />} action={primary} />
      <PageBody>
        {/* Greeting + live status */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
            <p className="text-lg font-semibold tracking-[-0.01em]">Good morning, {firstName}.</p>
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px] text-muted">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em]">{WEEK[TODAY_INDEX][0]}, {WEEK[TODAY_INDEX][1]}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-ok"><span className="h-[7px] w-[7px] rounded-full bg-current" />OmniDesk is answering</span>
              {live && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link href={`/calls/${live.id}`} className="cf-link inline-flex items-center gap-1.5"><span className="h-[7px] w-[7px] animate-cfpulse rounded-full bg-current" />1 caller on the line now · {live.caller}</Link>
                </>
              )}
            </p>
          </div>
          <div className="w-full xl:hidden"><SegmentedLinks label="Date range" items={rangeLinks} stretch /></div>
        </div>

        {/* Hero */}
        <section aria-labelledby="hero-label" className="flex flex-col gap-[22px] rounded-xl border border-t-[3px] border-t-accent bg-surface p-6">
          <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
            <div className="flex flex-[1_1_320px] flex-col gap-3">
              <h2 id="hero-label" className="cf-label">Appointments booked by OmniDesk · {rangeUpper}</h2>
              <div className="flex flex-wrap items-end gap-[18px]">
                <span className="font-display text-[72px] font-medium leading-[.9] tracking-[-0.02em] md:text-[96px]">{fmtNumber(st.booked)}</span>
                <span className="flex flex-col gap-1.5 pb-1.5">
                  <span className="self-start rounded-full bg-ok-bg px-2 py-0.5 text-xs font-semibold text-ok">{pct(st.booked, ov.prevBooked)} vs {ov.compareLabel}</span>
                  <span className="max-w-[260px] text-muted">
                    from <strong className="font-semibold text-ink">{fmtNumber(st.answered)}</strong> calls answered.{' '}
                    <strong className="font-semibold text-ink">{fmtNumber(st.recallRebooked)}</strong> came back through recall.
                  </span>
                </span>
              </div>
            </div>
            {showMoney && (
              <div className="flex flex-col gap-1 border-l pl-5">
                <span className="cf-label">Est. production booked</span>
                <span className="text-[30px] font-medium tracking-[-0.02em] tabular-nums">{money(ov.production)}</span>
                <span className="text-xs text-muted">From your fee schedule · {pct(ov.production, ov.prevProduction)} vs {ov.compareLabel}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline gap-2.5">
              <h3 className="flex-1 text-[13px] font-semibold">Where the {fmtNumber(st.answered)} calls went</h3>
              <Link href="/calls" className="cf-link text-[13px]">Open call log</Link>
            </div>
            <div role="img" aria-label={ov.mix.map((n, i) => `${MIX_LEGEND[i].label} ${n}`).join(', ')} className="flex h-3.5 gap-0.5 overflow-hidden rounded-full">
              {ov.mix.map((n, i) => <span key={i} className={clsx('min-w-1', MIX_LEGEND[i].className)} style={{ flex: `${n} 1 0` }} />)}
            </div>
            <ul className="flex flex-wrap gap-x-[22px] gap-y-2">
              {ov.mix.map((n, i) => (
                <li key={i} className="flex items-center gap-2 text-[13px]">
                  <span className={clsx('h-2.5 w-2.5 rounded-[3px]', MIX_LEGEND[i].className)} />
                  <span className="text-muted">{MIX_LEGEND[i].label}</span>
                  <span className="font-mono text-xs font-medium">{fmtNumber(n)}</span>
                  <span className="font-mono text-[11px] text-muted">{Math.round((n / mixTotal) * 100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tiles: 2×2 below xl, 4 across above */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile label="After-hours calls" value={fmtNumber(st.afterHours)} sub={`${Math.round((st.afterHours / st.answered) * 100)}% of ${fmtNumber(st.answered)} calls · none to voicemail`} />
          <StatTile label="Recall rebooked" value={fmtNumber(st.recallRebooked)} sub={`of ${fmtNumber(st.recallContacted)} patients contacted`} />
          {showMoney ? (
            <StatTile label="Deposits collected" value={money(st.deposits)} sub={`${st.depositCount} paid · ${st.depositPending} pending`} />
          ) : (
            <StatTile label="Deposits paid" value={fmtNumber(st.depositCount)} sub="Amounts hidden for Front desk role" />
          )}
          <Link href="/calls?outcome=needs" className="rounded-xl text-inherit no-underline hover:text-inherit hover:[&>div]:border-accent">
            <StatTile label="Needs a human" value={needs.length} sub={needs.length ? 'Open now · oldest waiting 14 hr' : 'All handled'} tone={needs.length ? 'warn' : undefined} />
          </Link>
        </div>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader title="Needs attention" aside={<span className="font-mono text-xs text-muted">{attention.length} OPEN</span>} />
            {attention.length ? (
              <ul>
                {attention.map((c) => {
                  const tone = attentionTone(c.tag);
                  const isText = !!c.attention;
                  return (
                    <li key={c.id} className="flex items-center gap-3 border-b px-5 py-3 last:border-b-0">
                      <span aria-hidden="true" className={clsx('w-[3px] self-stretch rounded-sm', tone === 'danger' ? 'bg-danger' : 'bg-warn')} />
                      <Link href={`/calls/${c.id}`} className="flex min-w-0 flex-1 flex-col gap-[3px] py-0.5 text-ink no-underline hover:text-ink">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5"><span className="font-semibold">{c.caller}</span><Tag tone={tone}>{c.tag}</Tag></span>
                        <span className="text-[13px] text-muted">{isText && c.note ? c.note.split('.')[0] : c.reason}</span>
                        <span className="font-mono text-[11px] text-muted">{WAITING[c.id] ?? `${c.day} ${c.time}`}</span>
                      </Link>
                      <ActionButton url={`/api/calls/${c.id}/callback`} body={{ mode: isText ? 'text' : 'call' }} className="cf-btn shrink-0 text-[13px]">
                        <Icon name={isText ? 'text' : 'call'} size={14} strokeWidth={1.9} />{isText ? 'Text patient' : 'Call back'}
                      </ActionButton>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty><span className="block font-semibold text-ink">All clear</span>Nothing needs a human right now.</Empty>
            )}
          </Card>

          <Card className="flex flex-col gap-3.5 px-5 py-[18px]">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="flex-1 text-base font-semibold">{ov.chartTitle}</h2>
              <span className="flex gap-3.5 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-accent" />Booked</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-muted opacity-30" />Other calls</span>
              </span>
            </div>
            <div role="img" aria-label={`${ov.chartTitle}: ${ov.bars.map((b) => `${b[0]} ${b[1]} calls, ${b[2]} booked`).join('; ')}`} className="grid h-[190px] items-end gap-2.5 pt-1" style={{ gridTemplateColumns: `repeat(${ov.bars.length}, minmax(0, 1fr))` }}>
              {ov.bars.map(([label, n, booked], i) => {
                const current = i === ov.bars.length - 1 && range !== '30d';
                return (
                  <div key={label} title={`${label}: ${n} calls, ${booked} booked`} className="flex h-full flex-col justify-end gap-1.5">
                    <span className="text-center font-mono text-[11px] text-muted">{n}</span>
                    <div className="flex flex-col gap-0.5 overflow-hidden rounded-t-[5px] rounded-b-sm" style={{ height: `${Math.round((n / maxBar) * 100)}%` }}>
                      <div className="bg-muted opacity-30" style={{ flex: `${n - booked} 1 0` }} />
                      <div className="bg-accent" style={{ flex: `${booked} 1 0` }} />
                    </div>
                    <span className={clsx('whitespace-nowrap text-center font-mono text-[11px]', current ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
                  </div>
                );
              })}
            </div>
            <p className="border-t pt-2.5 text-xs text-muted">{ov.chartNote}</p>
          </Card>
        </div>

        <div className="grid items-start gap-4 min-[1100px]:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader title="Latest calls" aside={<Link href="/calls" className="cf-link text-[13px]">View all calls</Link>} />
            <ul>
              {latest.map((c) => (
                <li key={c.id} className="border-b last:border-b-0">
                  <Link href={`/calls/${c.id}`} className="grid min-h-14 grid-cols-[64px_1fr_auto] items-center gap-3.5 px-5 py-2 text-ink no-underline hover:bg-surface2 hover:text-ink">
                    <span className="font-mono text-xs text-muted">{c.day === 'Today' ? c.time.replace(' AM', 'a').replace(' PM', 'p') : c.day === 'Yesterday' ? 'Yest.' : c.day}</span>
                    <span className="flex min-w-0 flex-col"><span className="font-medium">{c.caller}</span><span className="truncate text-[13px] text-muted">{c.reason}</span></span>
                    <Pill tone={OUTCOME[c.outcome].tone} pulse={c.outcome === 'Live'}>{OUTCOME[c.outcome].label}</Pill>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="Today's schedule"
              sub={`${today.length} appointments · ${today.filter((a) => a.bookedBy === 'ai').length} booked by OmniDesk · ${today.filter((a) => a.status === 'Unconfirmed').length} unconfirmed`}
              aside={<Link href="/appointments" className="cf-link text-[13px]">Open schedule</Link>}
            />
            <ul>
              {upNext.map((a) => {
                const flag = a.depositFailed ? 'Deposit failed' : a.status === 'Unconfirmed' ? 'Unconfirmed' : null;
                return (
                  <li key={a.id} className="border-b last:border-b-0">
                    <Link href={`/appointments?appt=${a.id}`} className="grid min-h-14 grid-cols-[72px_1fr_auto] items-center gap-3 px-5 py-2 text-ink no-underline hover:bg-surface2 hover:text-ink">
                      <span className="font-mono text-xs">{fmtTime(a.start)}</span>
                      <span className="flex min-w-0 flex-col">
                        <span className="flex items-center gap-2 font-medium">{a.patient}{a.bookedBy === 'ai' && <Tag tone="ai">AI</Tag>}</span>
                        <span className="truncate text-xs text-muted">{a.service} · {PROVIDERS[a.provider].name}</span>
                      </span>
                      {flag ? <Pill tone={a.depositFailed ? 'danger' : 'warn'}>{flag}</Pill> : <span />}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {!upNext.length && <Empty>No more appointments today.</Empty>}
          </Card>
        </div>
      </PageBody>
    </>
  );
}
