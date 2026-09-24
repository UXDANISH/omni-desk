import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { db } from '@/lib/db';

export async function GET() {
  const g = await guard('workRecall');
  if (g.error) return g.error;
  return NextResponse.json({ queue: db.recallQueue, rules: db.recallRules });
}
