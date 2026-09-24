import type { Metadata } from 'next';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { FilterChips } from '@/components/ui/Nav';
import { Pill } from '@/components/ui/Pill';
import { StatTile, Empty } from '@/components/ui/Card';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { ActionButton } from '@/components/ui/ActionButton';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { depositCandidates, listDeposits, patientMap } from '@/lib/db';
import { DEPOSIT_TOTALS_7D } from '@/lib/mock/deposits';
import { statusTone } from '@/lib/tones';
import { fmtNumber, money, one, withParams } from '@/lib/format';
import type { DepositStatus, PageProps } from '@/lib/types';
import { SendLinkButton } from './SendLinkButton';

export const metadata: Metadata = { title: 'Deposits' };

const COLS = 'grid-cols-[118px_minmax(150px,1.1fr)_minmax(170px,1.4fr)_70px_84px_minmax(110px,.8fr)_84px]';
const STATUSES: DepositStatus[] = ['Paid', 'Pending', 'Failed', 'Refunded'];

export default async function DepositsPage({ searchParams }: PageProps) {
  const { user, practiceId } = await requireSession();
  const [all, patients, pending] = await Promise.all([listDeposits(practiceId), patientMap(practiceId), depositCandidates(practiceId)]);
  const sp = await searchParams;
  const status = STATUSES.find((s) => s === one(sp.status));
  const showMoney = can(user.role, 'seeDepositTotals');
  const canRefund = can(user.role, 'refundDeposits');
  const count = (s: DepositStatus) => all.filter((d) => d.status === s).length;
  const sum = (s: DepositStatus) => all.filter((d) => d.status === s).reduce((a, d) => a + d.amount, 0);
  const rows = all.filter((d) => !status || d.status === status);
  const failed = count('Failed');

  const candidates = pending.flatMap((c) => {
    const p = patients.get(c.patientId);
    return p ? [{ patientId: p.id, label: `${p.name} — ${c.label}`, last4: p.last4 }] : [];
  });

  return (
    <>
      <TopBar title="Deposits" sample action={<SendLinkButton candidates={candidates} />} />
      <PageBody>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,190px),1fr))] gap-4">
          {showMoney ? (
            <>
              <StatTile label="Collected · 7 days" value={money(DEPOSIT_TOTALS_7D.collected)} sub={`${DEPOSIT_TOTALS_7D.paidCount} deposits paid`} />
              <StatTile label="Pending" value={money(sum('Pending'))} sub={`${count('Pending')} links waiting`} />
              <StatTile label="Failed" value={failed} sub={failed ? 'Card declined · needs follow-up' : 'None'} tone={failed ? 'danger' : undefined} />
              <StatTile label="Refunded · 7 days" value={money(sum('Refunded'))} sub={`${count('Refunded')} refund`} />
            </>
          ) : (
            <>
              <StatTile label="Paid · 7 days" value={fmtNumber(DEPOSIT_TOTALS_7D.paidCount)} sub="Totals hidden for Front desk role" />
              <StatTile label="Pending" value={count('Pending')} sub="Links not yet paid" />
              <StatTile label="Failed" value={failed} sub={failed ? 'Needs a new card' : 'None'} tone={failed ? 'danger' : undefined} />
              <StatTile label="Refunded" value={count('Refunded')} sub="Refunds need a Manager" />
            </>
          )}
        </div>

        <FilterChips
          label="Status filter"
          items={[{ label: 'All', count: all.length, active: !status, href: '/deposits' }, ...STATUSES.map((s) => ({ label: s, count: count(s), active: status === s, href: withParams('/deposits', {}, { status: s }) }))]}
        />

        <div role="table" aria-label="Payment links" className="cf-card overflow-x-auto 2xl:overflow-visible">
          <div className="min-w-[980px] 2xl:min-w-0">
            <div role="row" className={clsx('cf-th static 2xl:sticky', COLS)}><span>Sent</span><span>Patient</span><span>For appointment</span><span className="text-right">Amount</span><span>Link</span><span>Status</span><span /></div>
            {rows.map((d) => {
              const p = patients.get(d.patientId)!;
              const resend = d.status === 'Pending' || d.status === 'Failed';
              return (
                <div role="row" key={d.id} className={clsx('cf-row', COLS)}>
                  <span className="font-mono text-xs">{d.sent}</span>
                  <span className="flex min-w-0 flex-col"><span className="font-medium">{p.name}</span><MaskedPhone kind="patient" id={p.id} last4={p.last4} /></span>
                  <span>{d.forAppointment}</span>
                  <span className="cf-mono text-right text-[13px]">{showMoney ? `$${d.amount}` : '—'}</span>
                  <span className="font-mono text-xs text-muted">{d.id}</span>
                  <span className="flex flex-col items-start gap-0.5"><Pill tone={statusTone(d.status)}>{d.status}</Pill>{d.note && <span className="text-[11px] text-muted">{d.note}</span>}</span>
                  <span className="text-right">
                    {resend && <ActionButton url={`/api/deposits/${d.id}`} body={{ action: 'resend' }} className="cf-btn h-8 px-2.5 text-[13px]">Resend</ActionButton>}
                    {d.status === 'Paid' && (
                      <ActionButton url={`/api/deposits/${d.id}`} body={{ action: 'refund' }} className="cf-btn h-8 px-2.5 text-[13px]" disabled={!canRefund} title={canRefund ? `Refund $${d.amount}` : 'Refunds need a Manager or Owner'}>
                        Refund
                      </ActionButton>
                    )}
                  </span>
                </div>
              );
            })}
            {!rows.length && <Empty>No payment links with this status.</Empty>}
            <div className="px-5 py-3 font-mono text-[11px] text-muted">LATEST {all.length} LINKS · LINKS EXPIRE AFTER 48 HOURS</div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
