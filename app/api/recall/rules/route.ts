import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { audit, createRecallRule } from '@/lib/db';
import { newId } from '@/lib/password';
import type { RecallRule } from '@/lib/types';

export async function POST() {
  const g = await guard('editReceptionist');
  if (g.error) return g.error;
  const rule: RecallRule = {
    id: newId('r-'),
    name: 'New rule',
    trigger: 'filling',
    delay: 7,
    unit: 'days',
    steps: [{ channel: 'text', day: 0 }, { channel: 'call', day: 2 }],
    active: false,
    queue: 0,
  };
  await createRecallRule(g.practiceId, rule);
  await audit(g.practiceId, g.user.id, 'create-recall-rule', rule.id);
  return NextResponse.json({ rule }, { status: 201 });
}
