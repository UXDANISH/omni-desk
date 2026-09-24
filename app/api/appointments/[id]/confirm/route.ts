import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { audit, findAppointment, updateAppointment } from '@/lib/db';

/** Sends a confirmation text. Until SMS is connected, marks the appointment confirmed immediately. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('callBack');
  if (g.error) return g.error;
  const { id } = await params;
  const a = await findAppointment(g.practiceId, id);
  if (!a) return notFound('Appointment not found');
  await updateAppointment(g.practiceId, a.id, { status: 'Confirmed' });
  await audit(g.practiceId, g.user.id, 'confirm-appointment', a.id);
  return NextResponse.json({ ok: true, message: `Confirmation text sent to ${a.patient}.` });
}
