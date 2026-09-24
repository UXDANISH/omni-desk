import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Pill, Tag } from '@/components/ui/Pill';
import { Card, CardHeader, Empty } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { requireSession } from '@/lib/auth';
import { callsForPatient, findPatient, listAppointments, listRecallQueue, recallHistory } from '@/lib/db';
import { PROVIDERS, TODAY_INDEX } from '@/lib/mock/appointments';
import { OUTCOME, statusTone } from '@/lib/tones';
import { dayLabel, fmtTime, maskEmail } from '@/lib/format';
import type { IdPageProps } from '@/lib/types';
import { ConsentPanel } from './ConsentPanel';
import { PatientPhone } from './PatientPhone';
import { AddPatientButton } from '../AddPatientButton';

// Generic title on purpose: patient names shouldn't end up in tab titles or browser history.
export const metadata: Metadata = { title: 'Patient' };

export default async function PatientPage({ params }: IdPageProps) {
  const { practiceId } = await requireSession();
  const p = await findPatient(practiceId, (await params).id);
  if (!p) notFound();
  const [queue, appts, calls, history] = await Promise.all([
    listRecallQueue(practiceId, p.id),
    listAppointments(practiceId, p.id),
    callsForPatient(practiceId, p.id),
    recallHistory(practiceId, p.id),
  ]);
  const recall = queue[0];
  const upcoming = appts.filter((a) => a.day >= TODAY_INDEX);
  const since = p.since === '2026' ? 'Sep 2026' : `Jan ${p.since}`;

  return (
    <>
      <TopBar title="Patients" sample action={<AddPatientButton label="Book appointment" message="The booking form connects to your practice software in the next build step." />} />
      <PageBody>
        <Link href="/patients" className="cf-link flex items-center gap-1.5 self-start"><Icon name="chevronLeft" size={14} strokeWidth={2} />All patients</Link>
        <div className="flex flex-wrap items-end gap-x-5 gap-y-2">
          <div className="flex flex-col gap-0.5">
            <span className="cf-label">{p.id.toUpperCase()} · Patient since {p.since}</span>
            <h2 className="text-[26px] font-semibold tracking-[-0.01em]">{p.name}</h2>
          </div>
          {recall && <span className="mb-1"><Pill tone={statusTone(recall.status)}>Recall · {recall.status}</Pill></span>}
        </div>

        <div className="grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
          <div className="flex flex-col gap-4">
            <Card className="flex flex-col gap-3.5 p-[18px]">
              <h3 className="text-base font-semibold">Contact</h3>
              <div className="flex flex-col gap-1"><span className="cf-label">Mobile</span><PatientPhone id={p.id} last4={p.last4} /></div>
              <div className="flex flex-col gap-1"><span className="cf-label">Email</span><span className="font-mono">{maskEmail(p.email)}</span></div>
              <div className="flex flex-col gap-1"><span className="cf-label">Preferred channel</span><span>{p.preferred}</span></div>
            </Card>
            <ConsentPanel patientId={p.id} name={p.name} consent={p.consent} source={`Recorded on intake form · ${since}`} optedOutNote={p.optedOutNote} />
          </div>

          <div className="flex flex-col gap-4">
            <Card className="overflow-hidden">
              <CardHeader title="Upcoming appointments" />
              {upcoming.map((a) => (
                <Link key={a.id} href={`/appointments?view=list&appt=${a.id}`} className="grid min-h-14 grid-cols-[130px_1fr_auto] items-center gap-3 border-b px-[18px] py-2 text-ink no-underline last:border-b-0 hover:bg-surface2 hover:text-ink">
                  <span className="flex flex-col font-mono text-xs"><span>{fmtTime(a.start)}</span><span className="text-[11px] text-muted">{dayLabel(a.day)}</span></span>
                  <span className="flex flex-col"><span className="font-medium">{a.service}</span><span className="text-xs text-muted">{PROVIDERS[a.provider].name}</span></span>
                  {a.bookedBy === 'ai' ? <Tag tone="ai">AI</Tag> : <span />}
                </Link>
              ))}
              {!upcoming.length && <Empty>No upcoming appointments.</Empty>}
            </Card>
            <Card className="overflow-hidden">
              <CardHeader title="Recent calls" />
              {calls.map((c) => (
                <Link key={c.id} href={`/calls/${c.id}`} className="grid min-h-14 grid-cols-[130px_1fr_auto] items-center gap-3 border-b px-[18px] py-2 text-ink no-underline last:border-b-0 hover:bg-surface2 hover:text-ink">
                  <span className="flex flex-col font-mono text-xs"><span>{c.time}</span><span className="text-[11px] text-muted">{c.day}</span></span>
                  <span>{c.reason}</span>
                  <Pill tone={OUTCOME[c.outcome].tone}>{OUTCOME[c.outcome].label}</Pill>
                </Link>
              ))}
              {!calls.length && <Empty>No calls in the last 30 days.</Empty>}
            </Card>
            <Card className="overflow-hidden">
              <CardHeader title="Recall history" />
              <ol>
                {history.map((h, i) => (
                  <li key={i} className="grid min-h-12 grid-cols-[90px_20px_1fr] items-center gap-2.5 border-b px-[18px] py-2 last:border-b-0">
                    <span className="font-mono text-xs text-muted">{h.date}</span>
                    <Icon name={h.channel} size={15} className="text-muted" />
                    <span>{h.text}</span>
                  </li>
                ))}
              </ol>
              {!history.length && <Empty>No recall activity in the last 12 months.</Empty>}
            </Card>
          </div>
        </div>
      </PageBody>
    </>
  );
}
