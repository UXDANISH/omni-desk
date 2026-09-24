'use client';

import { LockedNote } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

const CARDS: { kind: string; name: string; status: string; icon: IconName; facts: [string, string][]; action: string; foot: string; toast: string }[] = [
  { kind: 'Practice software', name: 'Open Dental', status: 'Connected', icon: 'appointments', facts: [['Last sync', '2 MIN AGO'], ['Syncs', 'APPTS · PATIENTS · PROVIDERS'], ['Chairs mapped', '3 OF 3']], action: 'Sync now', foot: 'Syncs every 5 minutes', toast: 'Synced with Open Dental just now. 0 conflicts.' },
  { kind: 'Phone line', name: 'Call forwarding', status: 'Active', icon: 'calls', facts: [['Practice number', '(512) 555-0100'], ['Forwards to OmniDesk', '(512) 555-0199'], ['During hours', 'AFTER 3 RINGS'], ['After hours', 'IMMEDIATELY']], action: 'Send test call', foot: 'Rings your line, then OmniDesk', toast: 'Test call placed to (512) 555-0100.' },
  { kind: 'Card payments', name: 'Deposit payouts', status: 'Connected', icon: 'deposits', facts: [['Payout account', 'CHECKING ···· 6621'], ['Payout timing', '2 BUSINESS DAYS'], ['Refunds', 'OWNER · MANAGER']], action: 'Manage payouts', foot: 'Opens the payment provider', toast: 'Opens the payment provider dashboard once connected.' },
  { kind: 'Text & email', name: 'Patient messages', status: 'Active', icon: 'text', facts: [['Texts from', '(512) 555-0100'], ['Emails from', 'HELLO@SMILEDENTAL.EXAMPLE'], ['STOP replies', 'OPT OUT INSTANTLY']], action: 'Edit sender', foot: 'Patients see your practice name', toast: 'Sender settings come with onboarding.' },
];

export function Integrations({ readOnly }: { readOnly: boolean }) {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-4">
      {readOnly && <LockedNote>View only. An Owner or Manager can change integrations.</LockedNote>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,380px),1fr))] items-start gap-4">
        {CARDS.map((c) => (
          <section key={c.name} className="cf-card flex flex-col gap-3.5 p-[18px]" aria-labelledby={`int-${c.name}`}>
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-surface2"><Icon name={c.icon} size={20} /></span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="cf-label">{c.kind}</span><h2 id={`int-${c.name}`} className="text-base font-semibold">{c.name}</h2></span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-medium text-ok"><span className="h-[7px] w-[7px] rounded-full bg-current" />{c.status}</span>
            </div>
            <dl>
              {c.facts.map(([k, v]) => (
                <div key={k} className="flex gap-3 border-t py-2 text-[13px]"><dt className="flex-1 text-muted">{k}</dt><dd className="text-right font-mono text-xs">{v}</dd></div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" className="cf-btn" disabled={readOnly} onClick={() => toast(c.toast)}>{c.action}</button>
              <span className="text-xs text-muted">{c.foot}</span>
            </div>
          </section>
        ))}
      </div>
      <div className="cf-card flex flex-wrap items-center gap-x-4 gap-y-2.5 px-[18px] py-4">
        <span className="cf-label">Also supported</span>
        <span className="flex flex-wrap gap-2">{['Dentrix', 'Eaglesoft', 'Denticon'].map((s) => <span key={s} className="rounded-md bg-surface2 px-2.5 py-1 text-[13px]">{s}</span>)}</span>
        <span className="text-[13px] text-muted">Switching software re-runs the connection step from onboarding. Your call history stays.</span>
      </div>
    </div>
  );
}
