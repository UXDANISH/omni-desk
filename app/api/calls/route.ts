import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { queryCalls, toPublicCall, CALL_FILTERS, type CallFilter } from '@/lib/queries';

export async function GET(req: Request) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const sp = new URL(req.url).searchParams;
  const f = sp.get('outcome') as CallFilter | null;
  const filter = CALL_FILTERS.some((x) => x.key === f) ? (f as CallFilter) : 'all';
  const calls = queryCalls({ filter, q: sp.get('q') ?? '', afterHours: sp.get('after') === '1' });
  return NextResponse.json({ calls: calls.map(toPublicCall) });
}
