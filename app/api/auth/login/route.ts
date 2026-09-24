import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { SESSION_COOKIE, PRACTICE_COOKIE, sessionCookieOptions } from '@/lib/auth';
import { bad, readJson } from '@/lib/api';
import { PRACTICES } from '@/lib/mock/team';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  practiceId: z.string().optional(),
});

/** Mock sign-in: any password works for a known team email. Replace with your auth provider. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Enter your work email and password.');
  const member = db.team.find((t) => t.email.toLowerCase() === parsed.data.email.toLowerCase() && t.status === 'Active');
  if (!member) return bad('That email and password don\u2019t match an account.', 401);

  const res = NextResponse.json({
    user: { id: member.id, name: member.name, role: member.role },
    practices: member.role === 'Owner' ? PRACTICES : [PRACTICES[0]],
    startPage: member.startPage ?? '/overview',
  });
  res.cookies.set(SESSION_COOKIE, member.id, sessionCookieOptions);
  res.cookies.set(PRACTICE_COOKIE, parsed.data.practiceId ?? PRACTICES[0].id, sessionCookieOptions);
  member.lastActive = 'Active now';
  return res;
}
