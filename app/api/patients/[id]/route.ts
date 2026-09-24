import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { callsForPatient, findPatient, listAppointments, listRecallQueue, recallHistory } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('viewCalls');
  if (g.error) return g.error;
  const p = await findPatient(g.practiceId, (await params).id);
  if (!p) return notFound('Patient not found');
  const { phone: _phone, ...patient } = p;
  const [appointments, calls, recall, history] = await Promise.all([
    listAppointments(g.practiceId, p.id),
    callsForPatient(g.practiceId, p.id),
    listRecallQueue(g.practiceId, p.id),
    recallHistory(g.practiceId, p.id),
  ]);
  return NextResponse.json({
    patient,
    appointments,
    calls: calls.map(({ phone: _p, ...c }) => c),
    recall: recall[0] ?? null,
    history,
  });
}
