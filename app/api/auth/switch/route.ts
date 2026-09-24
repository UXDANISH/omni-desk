import { NextResponse } from 'next/server';
import { z } from 'zod';
import { audit, userById } from '@/lib/db';
import { guard, bad, readJson } from '@/lib/api';
import { credentialsSignIn } from '@/lib/signin';

const Body = z.object({ userId: z.string(), pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits') });

const ERRORS: Record<string, [string, number]> = {
  'wrong-pin': ['That PIN isn’t right.', 401],
  locked: ['Too many wrong PINs. Try again in 5 minutes, or sign in with your password.', 429],
  'not-allowed': ['That teammate can’t sign in here.', 403],
  'no-session': ['Your session ended. Sign in again.', 401],
};

/** Switch user on a shared workstation: the teammate's own 4-digit PIN, checked against its hash. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid request');

  const r = await credentialsSignIn('pin', parsed.data);
  if (!r.ok) {
    const [msg, status] = ERRORS[r.code] ?? ERRORS['wrong-pin'];
    return bad(msg, status);
  }
  const target = (await userById(parsed.data.userId))!;
  await audit(g.practiceId, g.user.id, 'switch-user', target.id);
  return NextResponse.json({ user: { id: target.id, name: target.name, role: target.role } });
}
