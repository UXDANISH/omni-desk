import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { db, audit } from '@/lib/db';
import { can } from '@/lib/permissions';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ team: db.team.map(({ last4: _l, ...t }) => t) });
}

const Body = z.object({ email: z.string().email(), role: z.enum(['Manager', 'Front desk']) });

export async function POST(req: Request) {
  const g = await guard('inviteTeam');
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Enter a valid work email.');
  if (parsed.data.role === 'Manager' && !can(g.user.role, 'manageRoles')) return bad('Only the Owner can invite Managers.', 403);
  if (db.team.some((t) => t.email.toLowerCase() === parsed.data.email.toLowerCase())) return bad('That person is already on the team.');

  const name = parsed.data.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const member = {
    id: 'u' + Date.now().toString(36),
    name,
    initials: name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?',
    email: parsed.data.email,
    role: parsed.data.role,
    lastActive: '—',
    status: 'Invited' as const,
    last4: '0000',
  };
  db.team.push(member);
  audit(g.user.id, 'invite', member.email);
  return NextResponse.json({ member, message: `Invite sent to ${member.email}.` }, { status: 201 });
}
