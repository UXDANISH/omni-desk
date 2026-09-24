import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { audit, createInvitedUser, listTeam, userByEmail } from '@/lib/db';
import { can } from '@/lib/permissions';
import { newId } from '@/lib/password';
import { emailIsStub } from '@/lib/email';
import { issueInvite } from '@/lib/invites';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ team: (await listTeam(g.practiceId)).map(({ last4: _l, ...t }) => t) });
}

const Body = z.object({ email: z.string().email(), role: z.enum(['Manager', 'Front desk']) });

/** Creates the invited account and emails a one-time link to set a password and PIN. */
export async function POST(req: Request) {
  const g = await guard('inviteTeam');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Enter a valid work email.');
  if (parsed.data.role === 'Manager' && !can(g.user.role, 'manageRoles')) return bad('Only the Owner can invite Managers.', 403);
  if (await userByEmail(parsed.data.email)) return bad('That person already has an account.');

  const name = parsed.data.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const id = newId('u_');
  await createInvitedUser(g.practiceId, { id, name, email: parsed.data.email, role: parsed.data.role });

  const inviteUrl = await issueInvite(req, id, parsed.data.email, g.user.name, g.practice.name);
  await audit(g.practiceId, g.user.id, 'invite', parsed.data.email);
  const { last4: _l, ...member } = (await listTeam(g.practiceId)).find((t) => t.id === id)!;
  // Until email is connected, hand the link back in development so it can be opened directly.
  const devLink = emailIsStub && process.env.NODE_ENV !== 'production' ? { inviteUrl } : {};
  return NextResponse.json({ member, message: `Invite sent to ${parsed.data.email}.`, ...devLink }, { status: 201 });
}
