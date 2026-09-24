import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db, audit } from '@/lib/db';
import { guard, bad, readJson } from '@/lib/api';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth';

const Body = z.object({ userId: z.string(), pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits') });

/** Switch user on a shared workstation. Demo: any 4-digit PIN is accepted. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid request');
  const target = db.team.find((t) => t.id === parsed.data.userId && t.status === 'Active');
  if (!target) return bad('That teammate can\u2019t sign in here.', 404);

  audit(g.user.id, 'switch-user', target.id);
  target.lastActive = 'Active now';
  const res = NextResponse.json({ user: { id: target.id, name: target.name, role: target.role } });
  res.cookies.set(SESSION_COOKIE, target.id, sessionCookieOptions);
  return res;
}
