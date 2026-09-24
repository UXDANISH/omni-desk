import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { db, audit } from '@/lib/db';

/** Sends a confirmation text. Demo: marks the appointment confirmed immediately. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('callBack');
  if (g.error) return g.error;
  const { id } = await params;
  const a = db.appointments.find((x) => x.id === id);
  if (!a) return notFound('Appointment not found');
  a.status = 'Confirmed';
  audit(g.user.id, 'confirm-appointment', a.id);
  return NextResponse.json({ ok: true, message: `Confirmation text sent to ${a.patient}.` });
}
