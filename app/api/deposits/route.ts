import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { audit, createDeposit, depositCandidates, findPatient, listDeposits } from '@/lib/db';
import { newId } from '@/lib/password';
import { can } from '@/lib/permissions';
import type { Deposit } from '@/lib/types';

export async function GET() {
  const g = await guard('sendDeposits');
  if (g.error) return g.error;
  const showMoney = can(g.user.role, 'seeDepositTotals');
  const deposits = await listDeposits(g.practiceId);
  return NextResponse.json({ deposits: deposits.map((d) => (showMoney ? d : { ...d, amount: null })) });
}

const Body = z.object({ patientId: z.string(), amount: z.union([z.literal(50), z.literal(75), z.literal(100)]) });

/** Text a payment link. The link itself comes from the payment provider once it is connected. */
export async function POST(req: Request) {
  const g = await guard('sendDeposits');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Pick a patient and an amount.');
  const cand = (await depositCandidates(g.practiceId)).find((c) => c.patientId === parsed.data.patientId);
  const p = await findPatient(g.practiceId, parsed.data.patientId);
  if (!cand || !p) return bad('That appointment doesn’t need a deposit.');

  const deposit: Deposit = {
    id: newId('PL-').toUpperCase().slice(0, 9),
    sent: 'Just now',
    patientId: p.id,
    forAppointment: cand.label,
    amount: parsed.data.amount,
    status: 'Pending',
    note: 'Texted just now',
  };
  await createDeposit(g.practiceId, deposit);
  await audit(g.practiceId, g.user.id, 'send-deposit', deposit.id);
  return NextResponse.json({ deposit, message: `Payment link for $${deposit.amount} texted to ${p.name}.` }, { status: 201 });
}
