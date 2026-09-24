'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { LockedNote } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { fmtNumber, money } from '@/lib/format';
import type { PlanName } from '@/lib/types';

type Plan = { name: PlanName; price: number; features: string[] };
type Usage = { used: number; included: number; projected: number; resets: string; overageRate: number };
type Invoice = { date: string; description: string; amount: number };

export function BillingSection({ tabs, plan, plans, usage, invoices, canChange }: { tabs: React.ReactNode; plan: PlanName; plans: Plan[]; usage: Usage; invoices: Invoice[]; canChange: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pick, setPick] = useState<PlanName>(plan);
  const [busy, setBusy] = useState(false);
  const current = plans.find((p) => p.name === plan)!;

  async function change() {
    setBusy(true);
    const r = await api<{ message: string }>('/api/billing', 'PUT', { plan: pick });
    setBusy(false);
    if (!r.ok) return toast(r.error);
    toast(r.data.message);
    router.refresh();
  }

  const action = canChange ? (
    <button type="button" className="cf-btn-primary h-[38px]" disabled={pick === plan || busy} onClick={change}>{pick === plan ? `On ${plan} plan` : `Switch to ${pick}`}</button>
  ) : null;

  return (
    <>
      <TopBar title="Settings" action={action} />
      <PageBody>
        {tabs}
        <div className="flex flex-col gap-4">
          {!canChange && <LockedNote>View only. The practice Owner can change the plan or payment method.</LockedNote>}
          <div role="radiogroup" aria-label="Plan" className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-4">
            {plans.map((p) => {
              const picked = pick === p.name;
              const select = () => canChange && setPick(p.name);
              return (
                <div key={p.name} role="radio" aria-checked={picked} aria-disabled={!canChange} tabIndex={0} onClick={select} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), select())}
                  className={clsx('flex flex-col gap-3.5 rounded-xl bg-surface p-5', picked ? 'border-2 border-accent' : 'border', canChange ? 'cursor-pointer' : 'cursor-default')}>
                  <div className="flex items-center gap-2.5">
                    <h2 className="flex-1 text-lg font-semibold">{p.name}</h2>
                    {plan === p.name && <span className="rounded bg-accent-bg px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-accent-tx">CURRENT PLAN</span>}
                    <span className={clsx('grid h-4 w-4 place-items-center rounded-full border-2', picked ? 'border-accent' : 'border-muted')}>{picked && <span className="h-2 w-2 rounded-full bg-accent" />}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5"><span className="text-[32px] font-medium tracking-[-0.02em] tabular-nums">${p.price}</span><span className="text-muted">/ month</span></div>
                  <ul className="flex flex-col gap-2">
                    {p.features.map((f) => <li key={f} className="flex items-start gap-2 text-[13px]"><Icon name="check" size={14} strokeWidth={2.2} className="mt-[3px] shrink-0 text-ok" />{f}</li>)}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="grid items-start gap-4 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
            <section className="cf-card flex flex-col gap-3.5 p-[18px]">
              <div className="flex items-baseline gap-2.5"><h2 className="flex-1 text-base font-semibold">Call minutes this cycle</h2><span className="font-mono text-[11px] uppercase text-muted">Resets {usage.resets}</span></div>
              <div className="flex items-baseline gap-2"><span className="text-[30px] font-medium tracking-[-0.02em] tabular-nums">{fmtNumber(usage.used)}</span><span className="text-muted">of {fmtNumber(usage.included)} included</span></div>
              <div className="h-2 overflow-hidden rounded bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={usage.included} aria-valuenow={usage.used} aria-label="Call minutes used">
                <div className="h-full bg-accent" style={{ width: `${Math.round((usage.used / usage.included) * 100)}%` }} />
              </div>
              <p className="text-[13px] text-muted">Extra minutes are ${usage.overageRate.toFixed(2)} each. At this pace you&apos;ll use about {fmtNumber(usage.projected)} by {usage.resets}.</p>
              <div className="flex items-center gap-3 border-t pt-3">
                <span className="flex flex-1 flex-col"><span className="cf-label">Payment method</span><span className="font-mono text-[13px]">VISA ···· 4242 · EXP 08/28</span></span>
                <button type="button" className="cf-btn" disabled={!canChange} onClick={() => toast('Opens the secure card form once payments are connected.')}>Update</button>
              </div>
            </section>
            <section className="cf-card overflow-hidden">
              <div className="flex items-baseline gap-2.5 border-b px-[18px] py-4"><h2 className="flex-1 text-base font-semibold">Invoices</h2><span className="font-mono text-[11px] text-muted">NEXT · OCT 1 · {money(current.price)}</span></div>
              {invoices.map((v) => (
                <div key={v.date} className="grid min-h-[52px] grid-cols-[110px_1fr_auto_auto] items-center gap-3.5 border-b px-[18px] py-1.5 last:border-b-0">
                  <span className="font-mono text-xs">{v.date}</span>
                  <span className="text-[13px] text-muted">{v.description}</span>
                  <span className="cf-mono text-[13px]">{money(v.amount)}</span>
                  <button type="button" aria-label={`Download invoice ${v.date}`} className="cf-link py-1 text-[13px]" onClick={() => toast('Invoice PDFs download once billing is connected.')}>PDF</button>
                </div>
              ))}
            </section>
          </div>
        </div>
      </PageBody>
    </>
  );
}
