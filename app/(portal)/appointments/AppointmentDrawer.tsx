'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pill } from '@/components/ui/Pill';
import { Fact } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ActionButton } from '@/components/ui/ActionButton';
import { useToast } from '@/components/ui/Toast';
import { statusTone } from '@/lib/tones';
import { dayLabel, fmtTime } from '@/lib/format';
import { DEPOSIT_FEES } from '@/lib/mock/appointments';
import type { Appointment } from '@/lib/types';

export function AppointmentDrawer({ appt: a, provider, closeHref }: { appt: Appointment; provider: string; closeHref: string }) {
  const router = useRouter();
  const toast = useToast();
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && router.push(closeHref, { scroll: false });
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [closeHref, router]);
  const fee = DEPOSIT_FEES[a.service];

  return (
    <>
      <Link href={closeHref} scroll={false} aria-label="Close" tabIndex={-1} className="fixed inset-0 z-50 bg-[var(--scrim)]" />
      <aside role="dialog" aria-modal="true" aria-labelledby="appt-title" className="fixed inset-y-0 right-0 z-[51] flex w-full max-w-[460px] flex-col border-l bg-surface shadow-pop">
        <div className="flex items-start gap-3 border-b px-5 py-[18px]">
          <div className="flex flex-1 flex-col gap-1">
            <span className="cf-label">{a.id} · {dayLabel(a.day)}</span>
            <h2 id="appt-title" className="text-[22px] font-semibold">{a.patient}</h2>
            <span className="font-mono text-[13px] text-muted">{fmtTime(a.start)} – {fmtTime(a.start + a.duration)}</span>
          </div>
          <Link href={closeHref} scroll={false} aria-label="Close appointment detail" className="grid h-9 w-9 place-items-center rounded-lg border text-ink"><Icon name="close" size={16} strokeWidth={2} /></Link>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Pill tone={statusTone(a.status)} size="md">{a.status}</Pill>
            {a.bookedBy === 'ai' && <Pill tone="accent" size="md">Booked by OmniDesk</Pill>}
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <Fact k="Provider" v={provider} />
            <Fact k="Service" v={a.service} />
            <Fact k="Length" v={`${a.duration} min`} />
            <Fact k="Booked by" v={a.bookedBy === 'ai' ? 'OmniDesk' : a.staffName} />
            <Fact k="Deposit" v={fee ? `$${fee} · ${a.depositFailed ? 'declined' : 'paid'}` : 'Not required'} />
          </dl>
          {a.callId && (
            <div className="flex items-center gap-3 rounded-[10px] bg-accent-bg px-3.5 py-3">
              <span className="flex-1 text-[13px]">Booked on call <span className="font-mono">{a.callId}</span>. Transcript and summary are in the call log.</span>
              <Link href={`/calls/${a.callId}`} className="cf-btn h-8 border-accent-tx bg-transparent text-accent-tx no-underline">Open call</Link>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t px-5 py-3.5">
          {a.status === 'Unconfirmed' ? (
            <ActionButton url={`/api/appointments/${a.id}/confirm`} className="cf-btn-primary h-11 px-5">Send confirmation text</ActionButton>
          ) : (
            <button type="button" className="cf-btn-primary h-11 px-5" onClick={() => toast('The booking form connects to your practice software in the next build step.')}>
              {a.status === 'Completed' ? 'Book follow-up' : 'Reschedule'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
