import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { audit, deleteOtherAuthSessions, updateUser, userById } from '@/lib/db';
import { hashSecret, PASSWORD_RULE, verifySecret } from '@/lib/password';

const Body = z.object({
  current: z.string().min(1, 'Enter your current password.').max(200),
  next: z.string().min(PASSWORD_RULE.min, PASSWORD_RULE.message).max(200),
});

/** Change password. Other devices are signed out; this one stays signed in. */
export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
  const u = await userById(g.user.id);
  if (!(await verifySecret(parsed.data.current, u?.passwordHash))) return bad('Your current password isn’t right.', 401);
  await updateUser(g.user.id, { passwordHash: await hashSecret(parsed.data.next) });
  await deleteOtherAuthSessions(g.user.id, g.sessionId);
  await audit(g.practiceId, g.user.id, 'change-password', g.user.id);
  return NextResponse.json({ ok: true, message: 'Password changed. Other devices were signed out.' });
}
