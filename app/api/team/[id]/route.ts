import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { audit, removeFromPractice, teamMember, updateUser } from '@/lib/db';
import { emailIsStub } from '@/lib/email';
import { issueInvite } from '@/lib/invites';

const Body = z.object({ role: z.enum(['Manager', 'Front desk']).optional(), resendInvite: z.boolean().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('inviteTeam');
  if (g.error) return g.error;
  const { id } = await params;
  const m = await teamMember(g.practiceId, id);
  if (!m) return notFound('Teammate not found');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid change');

  if (parsed.data.resendInvite) {
    if (m.status !== 'Invited') return bad('That person already joined.');
    const inviteUrl = await issueInvite(req, m.id, m.email, g.user.name, g.practice.name);
    await audit(g.practiceId, g.user.id, 'resend-invite', m.email);
    const devLink = emailIsStub && process.env.NODE_ENV !== 'production' ? { inviteUrl } : {};
    return NextResponse.json({ message: `Invite resent to ${m.email}.`, ...devLink });
  }
  if (parsed.data.role) {
    if (g.user.role !== 'Owner') return bad('Only the Owner can change roles.', 403);
    if (m.role === 'Owner' || m.id === g.user.id) return bad('You can’t change this role.');
    await updateUser(m.id, { role: parsed.data.role });
    await audit(g.practiceId, g.user.id, 'change-role', `${m.id}:${parsed.data.role}`);
    return NextResponse.json({ member: { id: m.id, role: parsed.data.role }, message: `${m.name} is now ${parsed.data.role}.` });
  }
  return bad('Nothing to change');
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('manageRoles');
  if (g.error) return g.error;
  const id = (await params).id;
  const m = await teamMember(g.practiceId, id);
  if (!m) return notFound('Teammate not found');
  if (m.role === 'Owner' || m.id === g.user.id) return bad('You can’t remove this person.');
  await removeFromPractice(g.practiceId, id);
  await audit(g.practiceId, g.user.id, 'remove-member', id);
  return NextResponse.json({ message: `${m.name} removed. Their sessions were signed out.` });
}
