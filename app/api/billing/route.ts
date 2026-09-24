import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { audit, getPlan, setPlan } from '@/lib/db';
import { INVOICES, PLANS, USAGE } from '@/lib/mock/team';

// Plan is stored per practice. Invoices, usage and card stay sample data until a payment provider is connected.
export async function GET() {
  const g = await guard('viewBilling');
  if (g.error) return g.error;
  const plan = await getPlan(g.practiceId);
  return NextResponse.json({ plan, plans: PLANS, usage: USAGE, invoices: INVOICES, card: { brand: 'VISA', last4: '4242', exp: '08/28' } });
}

const Body = z.object({ plan: z.enum(['Starter', 'Growth', 'Practice']) });

export async function PUT(req: Request) {
  const g = await guard('changePlan');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Pick a plan');
  await setPlan(g.practiceId, parsed.data.plan);
  await audit(g.practiceId, g.user.id, 'change-plan', parsed.data.plan);
  return NextResponse.json({ plan: parsed.data.plan, message: `Plan changed to ${parsed.data.plan}. The difference is prorated on your Oct 1 invoice.` });
}
