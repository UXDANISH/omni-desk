import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { Pill } from '@/components/ui/Pill';
import { Fact } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { requireSession } from '@/lib/auth';
import { findCall } from '@/lib/db';
import { OUTCOME } from '@/lib/tones';
import { durSeconds } from '@/lib/format';
import type { IdPageProps } from '@/lib/types';
import { CallPhone } from './CallPhone';
import { AudioPlayer } from './AudioPlayer';
import { CallActionBar } from './CallActionBar';

export async function generateMetadata({ params }: IdPageProps): Promise<Metadata> {
  // Don't put caller names in the document title (it shows in browser history and tabs).
  return { title: `Call ${(await params).id}` };
}

export default async function CallDetailPage({ params }: IdPageProps) {
  const { practiceId } = await requireSession();
  const call = await findCall(practiceId, (await params).id);
  if (!call) notFound();
  const o = OUTCOME[call.outcome];

  return (
    <>
      <TopBar title="Calls" sample />
      <PageBody narrow>
        <Link href="/calls" className="cf-link flex items-center gap-1.5 self-start"><Icon name="chevronLeft" size={14} strokeWidth={2} />All calls</Link>

        <article className="cf-card flex flex-col" aria-labelledby="call-title">
          <header className="flex flex-col gap-1 border-b px-5 py-[18px] md:px-6">
            <span className="cf-label">{call.id} · {call.direction}</span>
            <h2 id="call-title" className="text-[22px] font-semibold tracking-[-0.01em]">{call.caller}</h2>
            <CallPhone id={call.id} last4={call.last4} meta={`${call.time} · ${call.day} · ${call.duration}`} />
          </header>

          <div className="flex flex-col gap-[18px] p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={o.tone} size="md" pulse={call.outcome === 'Live'}>{o.label}</Pill>
              {call.afterHours && <span className="rounded-full border px-2.5 py-1 text-xs text-muted">After hours</span>}
            </div>

            {call.note && !call.resolved && (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg bg-danger-bg px-3.5 py-3 text-[13px] font-medium text-danger">
                <Icon name="info" size={16} strokeWidth={2} className="mt-px shrink-0" />{call.note}
              </div>
            )}

            <section aria-label="AI summary" className="flex flex-col gap-2.5 rounded-[10px] bg-accent-bg p-4">
              <span className="font-mono text-[11px] tracking-[0.1em] text-accent-tx">AI SUMMARY</span>
              <p className="text-[15px]">{call.summary}</p>
              <p className="text-[13px] text-muted"><strong className="font-semibold text-ink">Next step:</strong> {call.next}</p>
            </section>

            <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              {call.facts.map(([k, v]) => <Fact key={k} k={k} v={v} />)}
              <Fact k="Call ID" v={call.id} />
            </dl>

            <AudioPlayer total={durSeconds(call.duration)} />

            <section aria-label="Transcript">
              <h3 className="cf-label mb-2">Transcript</h3>
              <ol>
                {call.transcript.map((l, i) => (
                  <li key={i} className="grid grid-cols-[84px_1fr] gap-3 border-t py-2.5">
                    <span className={`pt-0.5 font-mono text-[11px] tracking-[0.06em] ${l.who === 'ai' ? 'text-accent-tx' : 'text-muted'}`}>{l.who === 'ai' ? 'OMNIDESK' : 'CALLER'}</span>
                    <span>{l.text}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <CallActionBar id={call.id} outcome={call.outcome} resolved={!!call.resolved} />
        </article>
      </PageBody>
    </>
  );
}
