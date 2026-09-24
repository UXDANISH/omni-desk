import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { initialsOf, sessionsFor, updateUser, userByEmail } from '@/lib/db';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const { last4: _l, ...me } = g.user;
  return NextResponse.json({ me, sessions: await sessionsFor(g.user.id, g.sessionId) });
}

const Body = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  email: z.string().email().optional(),
  startPage: z.enum(['/overview', '/calls', '/appointments', '/recall']).optional(),
  twoStep: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid profile');
  const { name, email, ...rest } = parsed.data;

  if (email && email.toLowerCase() !== g.user.email.toLowerCase()) {
    const taken = await userByEmail(email);
    if (taken && taken.id !== g.user.id) return bad('Another account already uses that email.');
  }
  await updateUser(g.user.id, { ...rest, ...(email ? { email } : {}), ...(name ? { name, initials: initialsOf(name) } : {}) });
  return NextResponse.json({ ok: true, message: 'Profile saved.' });
}
