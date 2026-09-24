import { NextResponse } from 'next/server';
import { guard, notFound } from '@/lib/api';
import { deleteAuthSession, deleteOtherAuthSessions, sessionsFor } from '@/lib/db';

/** DELETE /api/me/sessions/:id — or "others" to sign out everywhere except this device. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g.error) return g.error;
  const id = (await params).id;
  if (id === 'others') {
    await deleteOtherAuthSessions(g.user.id, g.sessionId);
    return NextResponse.json({ message: 'Signed out of all other devices.' });
  }
  if (id === g.sessionId) return notFound('Session not found');
  const s = (await sessionsFor(g.user.id, g.sessionId)).find((x) => x.id === id);
  if (!s || !(await deleteAuthSession(id, g.user.id))) return notFound('Session not found');
  return NextResponse.json({ message: `${s.device} signed out.` });
}
