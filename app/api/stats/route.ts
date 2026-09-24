import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { STATS, parseRange } from '@/lib/mock/stats';
import { can } from '@/lib/permissions';

// Sample numbers until call and payment events are recorded by the telephony and payment integrations.
export async function GET(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const range = parseRange(new URL(req.url).searchParams.get('range'));
  const s = { ...STATS[range] };
  if (!can(g.user.role, 'seeDepositTotals')) s.deposits = 0; // front desk sees counts, not dollars
  return NextResponse.json({ range, stats: s });
}
