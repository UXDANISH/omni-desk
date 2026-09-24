import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { listPatients } from '@/lib/db';

export async function GET(req: Request) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const q = new URL(req.url).searchParams.get('q') ?? '';
  const patients = (await listPatients(g.practiceId, q)).map(({ phone: _phone, ...rest }) => rest);
  return NextResponse.json({ patients });
}
