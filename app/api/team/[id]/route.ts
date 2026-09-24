import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { db, audit } from '@/lib/db';

const Body = z.object({ role: z.enum(['Manager', 'Front desk']).optional(), resendInvite: z.boolean().optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('inviteTeam');
  if (g.error) return g.error;
  const { id } = await params;
  const m = db.team.find((t) => t.id === id);
  if (!m) return notFound('Teammate not found');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid change');

  if (parsed.data.resendInvite) {
    if (m.status !== 'Invited') return bad('That person already joined.');
    return NextResponse.json({ message: `Invite resent to ${m.email}.` });
  }
  if (parsed.data.role) {
    if (g.user.role !== 'Owner') return bad('Only the Owner can change roles.', 403);
    if (m.role === 'Owner' || m.id === g.user.id) return bad('You can\u2019t change this role.');
    m.role = parsed.data.role;
    audit(g.user.id, 'change-role', `${m.id}:${m.role}`);
    return NextResponse.json({ member: m, message: `${m.name} is now ${m.role}.` });
  }
  return bad('Nothing to change');
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('manageRoles');
  if (g.error) return g.error;
  const id = (await params).id;
  const m = db.team.find((t) => t.id === id);
  if (!m) return notFound('Teammate not found');
  if (m.role === 'Owner' || m.id === g.user.id) return bad('You can\u2019t remove this person.');
  db.team = db.team.filter((t) => t.id !== id);
  delete db.sessions[id];
  audit(g.user.id, 'remove-member', id);
  return NextResponse.json({ message: `${m.name} removed. Their sessions were signed out.` });
}
