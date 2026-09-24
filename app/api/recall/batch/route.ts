import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { db, findPatient, audit } from '@/lib/db';
import type { Channel } from '@/lib/types';

/** Contact every "Due" patient on the first campaign step they have consented to. */
export async function POST() {
  const g = await guard('workRecall');
  if (g.error) return g.error;
  const due = db.recallQueue.filter((r) => r.status === 'Due');
  for (const r of due) {
    const p = findPatient(r.patientId);
    const rule = db.recallRules.find((x) => x.id === r.ruleId);
    const channel: Channel | undefined = rule?.steps.map((s) => s.channel).find((ch) => p?.consent[ch]);
    if (!channel) continue;
    r.status = 'Contacted';
    r.channel = channel;
    r.lastContact = 'Just now';
    r.next = 'Waiting for reply';
  }
  audit(g.user.id, 'recall-batch', `${due.length} patients`);
  return NextResponse.json({ ok: true, contacted: due.length, message: `${due.length} patients contacted on the channels they consented to.` });
}
