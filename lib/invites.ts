import 'server-only';
import { appOrigin } from './api';
import { createAuthToken, deleteAuthTokens } from './db';
import { sendEmail } from './email';
import { hashToken, newToken } from './password';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Replaces any earlier invite link for this user and emails a new one. Returns the link. */
export async function issueInvite(req: Request, userId: string, email: string, from: string, practiceName: string) {
  const token = newToken();
  await deleteAuthTokens(userId, 'invite');
  await createAuthToken({ tokenHash: hashToken(token), userId, kind: 'invite', expiresAt: new Date(Date.now() + INVITE_TTL_MS) });
  const inviteUrl = `${appOrigin(req)}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: `${from} invited you to ${practiceName} on OmniDesk`,
    text: `${from} invited you to join ${practiceName} on OmniDesk.\n\nSet up your account: ${inviteUrl}\n\nThis link works for 7 days.`,
  });
  return inviteUrl;
}
