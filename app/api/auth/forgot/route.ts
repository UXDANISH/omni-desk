import { NextResponse } from 'next/server';
import { z } from 'zod';
import { appOrigin, readJson } from '@/lib/api';
import { createAuthToken, deleteAuthTokens, userByEmail } from '@/lib/db';
import { hashToken, newToken } from '@/lib/password';
import { sendEmail } from '@/lib/email';

const Body = z.object({ email: z.string().email() });
const RESET_TTL_MS = 60 * 60 * 1000;

/** Always answers the same way so the form can't be used to find out who has an account. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  const reply = NextResponse.json({ message: 'If that email has an account, a reset link is on its way. It works for 1 hour.' });
  if (!parsed.success) return reply;

  const u = await userByEmail(parsed.data.email);
  if (!u || u.status !== 'Active') return reply;

  const token = newToken();
  await deleteAuthTokens(u.id, 'reset');
  await createAuthToken({ tokenHash: hashToken(token), userId: u.id, kind: 'reset', expiresAt: new Date(Date.now() + RESET_TTL_MS) });
  const link = `${appOrigin(req)}/reset/${token}`;
  await sendEmail({
    to: u.email,
    subject: 'Reset your OmniDesk password',
    text: `Reset your password: ${link}\n\nThis link works for 1 hour. If you didn't ask for it, you can ignore this email.`,
  });
  return reply;
}
