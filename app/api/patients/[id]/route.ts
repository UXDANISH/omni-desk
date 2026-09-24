import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { db, findPatient } from '@/lib/db';
import { RECALL_HISTORY } from '@/lib/mock/recall';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const p = findPatient((await params).id);
  if (!p) return notFound('Patient not found');
  const { phone: _phone, ...patient } = p;
  return NextResponse.json({
    patient,
    appointments: db.appointments.filter((a) => a.patientId === p.id),
    calls: db.calls.filter((c) => c.patientId === p.id).map(({ phone: _p, ...c }) => c),
    recall: db.recallQueue.find((r) => r.patientId === p.id) ?? null,
    history: RECALL_HISTORY[p.id] ?? [],
  });
}
