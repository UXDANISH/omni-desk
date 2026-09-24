import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { sessionsFor } from '@/lib/db';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  const { last4: _l, ...me } = g.user;
  return NextResponse.json({ me, sessions: sessionsFor(g.user.id) });
}

const Body = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().optional(),
  startPage: z.enum(['/overview', '/calls', '/appointments', '/recall']).optional(),
  twoStep: z.boolean().optional(),
});

export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid profile');
  Object.assign(g.user, parsed.data);
  if (parsed.data.name) g.user.initials = parsed.data.name.replace(/^Dr\.\s*/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return NextResponse.json({ ok: true, message: 'Profile saved.' });
}
