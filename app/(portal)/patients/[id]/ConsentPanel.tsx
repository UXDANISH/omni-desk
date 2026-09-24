'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/Switch';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import type { Consent } from '@/lib/types';

const ROWS: { key: keyof Consent; label: string }[] = [
  { key: 'call', label: 'Calls' },
  { key: 'text', label: 'Text messages' },
  { key: 'email', label: 'Email' },
];

export function ConsentPanel({ patientId, name, consent, source, optedOutNote }: { patientId: string; name: string; consent: Consent; source: string; optedOutNote?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState(consent);

  async function toggle(key: keyof Consent, value: boolean, label: string) {
    setState((s) => ({ ...s, [key]: value }));
    const r = await api(`/api/patients/${patientId}/consent`, 'PATCH', { channel: key, value });
    if (!r.ok) {
      setState((s) => ({ ...s, [key]: !value }));
      return toast(r.error);
    }
    toast(`${label} consent ${value ? 'recorded' : 'removed'} for ${name}. Logged.`);
    router.refresh();
  }

  return (
    <section className="cf-card flex flex-col gap-1 p-[18px]" aria-labelledby="consent-h">
      <h3 id="consent-h" className="mb-1.5 text-base font-semibold">Consent to contact</h3>
      {ROWS.map((r) => (
        <div key={r.key} className="flex items-center gap-3 border-t py-2.5">
          <span className="flex flex-1 flex-col">
            <span className="font-medium">{r.label}</span>
            <span className="text-xs text-muted">{state[r.key] ? source : optedOutNote ?? 'Not given'}</span>
          </span>
          <Switch checked={state[r.key]} label={`${r.label} consent`} onChange={(v) => toggle(r.key, v, r.label)} />
        </div>
      ))}
      <p className="border-t pt-2 text-xs text-muted">OmniDesk only uses channels switched on here. Changes are logged with your name and time.</p>
    </section>
  );
}
