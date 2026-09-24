import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { db, findPatient, audit } from '@/lib/db';
import { can } from '@/lib/permissions';
import { DEPOSIT_CANDIDATES } from '@/lib/mock/deposits';

export async function GET() {
  const g = await guard('sendDeposits');
  if (g.error) return g.error;
  const showMoney = can(g.user.role, 'seeDepositTotals');
  return NextResponse.json({
    deposits: db.deposits.map((d) => (showMoney ? d : { ...d, amount: null })),
  });
}

const Body = z.object({ patientId: z.string(), amount: z.union([z.literal(50), z.literal(75), z.literal(100)]) });

/** Text a payment link. */
export async function POST(req: Request) {
  const g = await guard('sendDeposits');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Pick a patient and an amount.');
  const cand = DEPOSIT_CANDIDATES.find((c) => c.patientId === parsed.data.patientId);
  const p = findPatient(parsed.data.patientId);
  if (!cand || !p) return bad('That appointment doesn\u2019t need a deposit.');

  const deposit = {
    id: 'PL-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
    sent: 'Just now',
    patientId: p.id,
    forAppointment: cand.label,
    amount: parsed.data.amount,
    status: 'Pending' as const,
    note: 'Texted just now',
  };
  db.deposits.unshift(deposit);
  audit(g.user.id, 'send-deposit', deposit.id);
  return NextResponse.json({ deposit, message: `Payment link for $${deposit.amount} texted to ${p.name}.` }, { status: 201 });
}
