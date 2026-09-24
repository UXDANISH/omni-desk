import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { db } from '@/lib/db';

export async function POST() {
  const g = await guard('editReceptionist');
  if (g.error) return g.error;
  const rule = {
    id: 'r' + (db.recallRules.length + 1) + '-' + Date.now().toString(36),
    name: 'New rule',
    trigger: 'filling',
    delay: 7,
    unit: 'days' as const,
    steps: [{ channel: 'text' as const, day: 0 }, { channel: 'call' as const, day: 2 }],
    active: false,
    queue: 0,
  };
  db.recallRules.push(rule);
  return NextResponse.json({ rule }, { status: 201 });
}
