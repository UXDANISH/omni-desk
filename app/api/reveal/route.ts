import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, auditCount, findCall, findPatient, teamMember } from '@/lib/db';
import { guard, bad, notFound, readJson } from '@/lib/api';

const Body = z.object({ kind: z.enum(['call', 'patient', 'member']), id: z.string() });

/** Returns a full phone number on request and writes an audit entry. Numbers are masked everywhere else. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid request');
  const { kind, id } = parsed.data;

  let phone: string | undefined | null;
  if (kind === 'call') phone = (await findCall(g.practiceId, id))?.phone;
  if (kind === 'patient') phone = (await findPatient(g.practiceId, id))?.phone;
  if (kind === 'member') phone = (await teamMember(g.practiceId, id))?.phone;
  if (!phone) return notFound();

  await audit(g.practiceId, g.user.id, 'reveal-phone', `${kind}:${id}`);
  return NextResponse.json({ phone, revealedBy: g.user.name, remaskAfterSeconds: 15, auditCount: await auditCount(g.practiceId) });
}
