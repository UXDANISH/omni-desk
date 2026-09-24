import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { listAppointments } from '@/lib/db';

export async function GET(req: Request) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const sp = new URL(req.url).searchParams;
  const day = sp.get('day');
  const by = sp.get('by');
  const list = (await listAppointments(g.practiceId)).filter((a) => (day === null || a.day === Number(day)) && (!by || a.bookedBy === by));
  return NextResponse.json({ appointments: list });
}
