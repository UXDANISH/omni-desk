import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { findCall } from '@/lib/db';
import { toPublicCall } from '@/lib/queries';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const call = findCall((await params).id);
  if (!call) return notFound('Call not found');
  return NextResponse.json({ call: toPublicCall(call) });
}
