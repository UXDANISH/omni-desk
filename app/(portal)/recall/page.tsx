import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { FilterChips, TabLinks } from '@/components/ui/Nav';
import { Pill } from '@/components/ui/Pill';
import { Icon } from '@/components/ui/Icon';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { ActionButton } from '@/components/ui/ActionButton';
import { ConsentChips } from '@/components/ui/ConsentChips';
import { requireSession } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { listRecallQueue, listRecallRules, patientMap } from '@/lib/db';
import { CHANNEL_LABEL, statusTone } from '@/lib/tones';
import { one, withParams } from '@/lib/format';
import type { PageProps, RecallStatus } from '@/lib/types';
import { RuleCard } from './RuleCard';

export const metadata: Metadata = { title: 'Recall' };

const COLS = 'grid-cols-[minmax(150px,1.2fr)_minmax(150px,1.3fr)_64px_108px_minmax(120px,1fr)_136px_minmax(130px,1.2fr)]';
const STATUSES: RecallStatus[] = ['Due', 'Contacted', 'Rebooked', 'No response', 'Opted out'];

export default async function RecallPage({ searchParams }: PageProps) {
  const { user, practiceId } = await requireSession();
  const sp = await searchParams;
  const tab = one(sp.tab) === 'rules' ? 'rules' : 'queue';
  const status = STATUSES.find((s) => s === one(sp.status));
  const [queue, rules, patients] = await Promise.all([listRecallQueue(practiceId), listRecallRules(practiceId), patientMap(practiceId)]);
  const rows = queue.filter((r) => !status || r.status === status);
  const due = queue.filter((r) => r.status === 'Due').length;
  const canEditRules = can(user.role, 'editReceptionist');

  const action =
    tab === 'queue' ? (
      <ActionButton url="/api/recall/batch" className="cf-btn-primary h-[38px]" disabled={!due}>
        {due ? `Start today's batch · ${due} due` : 'All due patients contacted'}
      </ActionButton>
    ) : canEditRules ? (
      <ActionButton url="/api/recall/rules" className="cf-btn-primary h-[38px]">New campaign rule</ActionButton>
    ) : null;

  return (
    <>
      <TopBar title="Recall" sample action={action} />
      <PageBody>
        <TabLinks label="Recall sections" items={[{ label: 'Queue', href: '/recall', active: tab === 'queue' }, { label: 'Campaign rules', href: '/recall?tab=rules', active: tab === 'rules' }]} />

        {tab === 'queue' ? (
          <>
            <FilterChips
              label="Status filter"
              items={[{ label: 'All', count: queue.length, active: !status, href: '/recall' }, ...STATUSES.map((s) => ({ label: s, count: queue.filter((r) => r.status === s).length, active: status === s, href: withParams('/recall', {}, { status: s }) }))]}
            />
            <div role="table" aria-label="Recall queue" className="cf-card overflow-x-auto 2xl:overflow-visible">
              <div className="min-w-[980px] 2xl:min-w-0">
                <div role="row" className={clsx('cf-th static 2xl:sticky', COLS)}><span>Patient</span><span>Reason</span><span>Due</span><span>Status</span><span>Last contact</span><span>Consent</span><span>Next step</span></div>
                {rows.map((r) => {
                  const p = patients.get(r.patientId)!;
                  const rule = rules.find((x) => x.id === r.ruleId);
                  return (
                    <div role="row" key={r.patientId} className={clsx('cf-row relative hover:bg-surface2', COLS)}>
                      <span className="flex min-w-0 flex-col">
                        <Link href={`/patients/${p.id}`} className="font-medium text-ink no-underline after:absolute after:inset-0 hover:text-ink">{p.name}</Link>
                        <MaskedPhone kind="patient" id={p.id} last4={p.last4} className="relative z-[1]" />
                      </span>
                      <span className="flex flex-col"><span>{r.reason}</span><span className="text-xs text-muted">{rule?.name}</span></span>
                      <span className="font-mono text-xs">{r.due}</span>
                      <span><Pill tone={statusTone(r.status)}>{r.status}</Pill></span>
                      <span className="flex items-center gap-2 text-[13px]">
                        {r.channel && <Icon name={r.channel} size={15} className="shrink-0 text-muted" />}
                        <span className="flex flex-col"><span>{r.channel ? CHANNEL_LABEL[r.channel] : '—'}</span><span className="font-mono text-[11px] text-muted">{r.lastContact}</span></span>
                      </span>
                      <ConsentChips consent={p.consent} />
                      <span className="text-[13px] text-muted">{r.next}</span>
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-x-5 gap-y-2 px-5 py-3 text-xs text-muted">
                  <span className="font-mono text-[11px]">SHOWING {rows.length} OF {queue.length} IN QUEUE</span>
                  <span>OmniDesk contacts patients 9 AM–7 PM their time, only on channels they&apos;ve consented to. A STOP reply opts them out right away.</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] items-start gap-4">
            {rules.map((r) => <RuleCard key={r.id} rule={r} editable={canEditRules} />)}
          </div>
        )}
      </PageBody>
    </>
  );
}
