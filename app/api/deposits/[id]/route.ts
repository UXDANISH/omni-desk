import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { db, findPatient, audit } from '@/lib/db';
import { can } from '@/lib/permissions';

const Body = z.object({ action: z.enum(['resend', 'refund']) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('sendDeposits');
  if (g.error) return g.error;
  const { id } = await params;
  const d = db.deposits.find((x) => x.id === id);
  if (!d) return notFound('Payment link not found');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid action');
  const name = findPatient(d.patientId)?.name ?? 'the patient';

  if (parsed.data.action === 'resend') {
    if (d.status !== 'Pending' && d.status !== 'Failed') return bad('Only pending or failed links can be resent.');
    d.status = 'Pending';
    d.note = 'Resent just now';
    audit(g.user.id, 'resend-deposit', d.id);
    return NextResponse.json({ deposit: d, message: `New payment link texted to ${name}.` });
  }

  if (!can(g.user.role, 'refundDeposits')) return bad('Refunds need a Manager or Owner.', 403);
  if (d.status !== 'Paid') return bad('Only paid deposits can be refunded.');
  d.status = 'Refunded';
  d.note = 'Refunded just now';
  audit(g.user.id, 'refund-deposit', d.id);
  return NextResponse.json({ deposit: d, message: `$${d.amount} refunded to ${name}.` });
}
