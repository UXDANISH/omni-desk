import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bad, readJson } from '@/lib/api';
import { audit, deleteAllAuthSessions, takeAuthToken, updateUser } from '@/lib/db';
import { hashSecret, hashToken, PASSWORD_RULE } from '@/lib/password';

const Body = z.object({
  token: z.string().min(20),
  password: z.string().min(PASSWORD_RULE.min, PASSWORD_RULE.message).max(200),
});

/** Set a new password from a reset link. Signs the account out on every device. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
  const row = await takeAuthToken(hashToken(parsed.data.token), 'reset');
  if (!row) return bad('This reset link has expired or was already used. Request a new one.', 410);
  await updateUser(row.userId, { passwordHash: await hashSecret(parsed.data.password), pinFailures: 0, pinLockedUntil: null });
  await deleteAllAuthSessions(row.userId);
  await audit(null, row.userId, 'reset-password', row.userId);
  return NextResponse.json({ ok: true, message: 'Password updated. Sign in with your new password.' });
}
