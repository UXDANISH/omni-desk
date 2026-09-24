import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Pill } from '@/components/ui/Pill';
import { Icon } from '@/components/ui/Icon';
import { Empty } from '@/components/ui/Card';
import { MaskedPhone } from '@/components/ui/MaskedPhone';
import { ConsentChips } from '@/components/ui/ConsentChips';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { TODAY_INDEX } from '@/lib/mock/appointments';
import { statusTone } from '@/lib/tones';
import { dayLabel, fmtTime, one } from '@/lib/format';
import type { PageProps } from '@/lib/types';
import { AddPatientButton } from './AddPatientButton';

export const metadata: Metadata = { title: 'Patients' };

const COLS = 'grid-cols-[minmax(180px,1.3fr)_minmax(170px,1.2fr)_120px_150px_120px]';

export default async function PatientsPage({ searchParams }: PageProps) {
  await requireUser();
  const q = (one((await searchParams).q) ?? '').trim();
  const rows = db.patients.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <TopBar title="Patients" sample action={<AddPatientButton />} />
      <PageBody>
        <form role="search" action="/patients" className="flex h-10 max-w-[360px] items-center gap-2 rounded-lg border bg-surface px-3">
          <Icon name="search" size={16} className="text-muted" />
          <input name="q" defaultValue={q} placeholder="Search patients" aria-label="Search patients" className="min-w-0 flex-1 bg-transparent outline-none" />
        </form>
        <div role="table" aria-label="Patients" className="cf-card overflow-x-auto xl:overflow-visible">
          <div className="min-w-[860px] xl:min-w-0">
            <div role="row" className={clsx('cf-th static xl:sticky', COLS)}><span>Patient</span><span>Next appointment</span><span>Last visit</span><span>Consent</span><span>Recall</span></div>
            {rows.map((p) => {
              const next = db.appointments.find((a) => a.patientId === p.id && a.day >= TODAY_INDEX);
              const recall = db.recallQueue.find((r) => r.patientId === p.id);
              return (
                <div role="row" key={p.id} className={clsx('cf-row relative hover:bg-surface2', COLS)}>
                  <span className="flex min-w-0 flex-col">
                    <Link href={`/patients/${p.id}`} className="font-medium text-ink no-underline after:absolute after:inset-0 hover:text-ink">{p.name}</Link>
                    <MaskedPhone kind="patient" id={p.id} last4={p.last4} className="relative z-[1]" />
                  </span>
                  <span className="text-[13px]">{next ? `${dayLabel(next.day)} · ${fmtTime(next.start)}` : 'None scheduled'}</span>
                  <span className="font-mono text-xs text-muted">{p.lastVisit}</span>
                  <ConsentChips consent={p.consent} />
                  <span>{recall ? <Pill tone={statusTone(recall.status)}>{recall.status}</Pill> : <span className="text-muted">—</span>}</span>
                </div>
              );
            })}
            {!rows.length && <Empty>No patients match that search.</Empty>}
          </div>
        </div>
      </PageBody>
    </>
  );
}
