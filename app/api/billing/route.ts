import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { db, audit } from '@/lib/db';
import { INVOICES, PLANS, USAGE } from '@/lib/mock/team';

export async function GET() {
  const g = await guard('viewBilling');
  if (g.error) return g.error;
  return NextResponse.json({ plan: db.plan, plans: PLANS, usage: USAGE, invoices: INVOICES, card: { brand: 'VISA', last4: '4242', exp: '08/28' } });
}

const Body = z.object({ plan: z.enum(['Starter', 'Growth', 'Practice']) });

export async function PUT(req: Request) {
  const g = await guard('changePlan');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Pick a plan');
  db.plan = parsed.data.plan;
  audit(g.user.id, 'change-plan', db.plan);
  return NextResponse.json({ plan: db.plan, message: `Plan changed to ${db.plan}. The difference is prorated on your Oct 1 invoice.` });
}
