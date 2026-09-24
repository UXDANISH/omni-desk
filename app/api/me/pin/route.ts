import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { audit, updateUser, userById } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/password';

const Body = z.object({
  password: z.string().min(1, 'Enter your password.').max(200),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
});

/** Change the 4-digit switch-user PIN. Needs the account password. */
export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
  const u = await userById(g.user.id);
  if (!(await verifySecret(parsed.data.password, u?.passwordHash))) return bad('That password isn’t right.', 401);
  await updateUser(g.user.id, { pinHash: await hashSecret(parsed.data.pin), pinFailures: 0, pinLockedUntil: null });
  await audit(g.practiceId, g.user.id, 'change-pin', g.user.id);
  return NextResponse.json({ ok: true, message: 'Switch-user PIN changed.' });
}
