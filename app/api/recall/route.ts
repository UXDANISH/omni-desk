import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { listRecallQueue, listRecallRules } from '@/lib/db';

export async function GET() {
  const g = await guard('workRecall');
  if (g.error) return g.error;
  const [queue, rules] = await Promise.all([listRecallQueue(g.practiceId), listRecallRules(g.practiceId)]);
  return NextResponse.json({ queue, rules });
}
