'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Segmented } from '@/components/ui/Segmented';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';

type Candidate = { patientId: string; label: string; last4: string };

export function SendLinkButton({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pid, setPid] = useState(candidates[0]?.patientId ?? '');
  const [amount, setAmount] = useState<'50' | '75' | '100'>('50');
  const [busy, setBusy] = useState(false);
  const c = candidates.find((x) => x.patientId === pid);

  async function send() {
    setBusy(true);
    const r = await api<{ message: string }>('/api/deposits', 'POST', { patientId: pid, amount: Number(amount) });
    setBusy(false);
    if (!r.ok) return toast(r.error);
    toast(r.data.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className="cf-btn-primary h-[38px]" onClick={() => setOpen(true)}>Send payment link</button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Send a payment link"
        footer={<><button type="button" className="cf-btn h-10" onClick={() => setOpen(false)}>Cancel</button><button type="button" className="cf-btn-primary" disabled={busy} onClick={send}>Send link</button></>}
      >
        <label className="flex flex-col gap-1.5">
          <span className="cf-label">Patient · appointment</span>
          <select value={pid} onChange={(e) => setPid(e.target.value)} className="cf-input">
            {candidates.map((x) => <option key={x.patientId} value={x.patientId}>{x.label}</option>)}
          </select>
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="cf-label">Amount</span>
          <Segmented label="Amount" value={amount} onChange={setAmount} options={[{ value: '50', label: '$50' }, { value: '75', label: '$75' }, { value: '100', label: '$100' }]} />
        </div>
        <p className="text-[13px] text-muted">Texted to <span className="font-mono">***-***-{c?.last4}</span>. The link expires in 48 hours and the amount is credited toward treatment.</p>
      </Modal>
    </>
  );
}
