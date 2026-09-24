import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { db, sessionsFor } from '@/lib/db';

/** DELETE /api/me/sessions/:id — or "others" to sign out everywhere except this device. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g.error) return g.error;
  const id = (await params).id;
  const list = sessionsFor(g.user.id);
  if (id === 'others') {
    db.sessions[g.user.id] = list.filter((s) => s.current);
    return NextResponse.json({ message: 'Signed out of all other devices.' });
  }
  const s = list.find((x) => x.id === id && !x.current);
  if (!s) return notFound('Session not found');
  db.sessions[g.user.id] = list.filter((x) => x.id !== id);
  return NextResponse.json({ message: `${s.device} signed out.` });
}
