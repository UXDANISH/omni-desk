import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, audit, findCall, findPatient, findMember } from '@/lib/db';
import { guard, bad, notFound, readJson } from '@/lib/api';

const Body = z.object({ kind: z.enum(['call', 'patient', 'member']), id: z.string() });

/** Returns a full phone number on request and writes an audit entry. Numbers are masked everywhere else. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid request');
  const { kind, id } = parsed.data;

  let phone: string | undefined;
  if (kind === 'call') phone = findCall(id)?.phone;
  if (kind === 'patient') phone = findPatient(id)?.phone;
  if (kind === 'member') {
    const m = findMember(id);
    phone = m ? `(512) 555-${m.last4}` : undefined;
  }
  if (!phone) return notFound();

  audit(g.user.id, 'reveal-phone', `${kind}:${id}`);
  return NextResponse.json({ phone, revealedBy: g.user.name, remaskAfterSeconds: 15, auditCount: db.audit.length });
}
