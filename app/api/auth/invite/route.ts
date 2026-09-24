import { NextResponse } from 'next/server';
import { z } from 'zod';
import { bad, readJson } from '@/lib/api';
import { audit, initialsOf, practicesForUser, takeAuthToken, updateUser, userById } from '@/lib/db';
import { hashSecret, hashToken, PASSWORD_RULE } from '@/lib/password';

const Body = z.object({
  token: z.string().min(20),
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  password: z.string().min(PASSWORD_RULE.min, PASSWORD_RULE.message).max(200),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be 4 digits'),
});

/** Accept an invite: set name, password and switch-user PIN, and activate the account. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
  const { token, name, password, pin } = parsed.data;

  // Deleting the token first makes the link single-use even if two requests race.
  const row = await takeAuthToken(hashToken(token), 'invite');
  const u = row && (await userById(row.userId));
  if (!u || u.status !== 'Invited') return bad('This invite link has expired or was already used. Ask your practice to resend it.', 410);

  await updateUser(u.id, {
    name, initials: initialsOf(name), status: 'Active',
    passwordHash: await hashSecret(password), pinHash: await hashSecret(pin), lastActiveAt: new Date(),
  });
  const [practice] = await practicesForUser(u.id);
  await audit(practice?.id ?? null, u.id, 'accept-invite', u.email);
  return NextResponse.json({ ok: true, email: u.email });
}
