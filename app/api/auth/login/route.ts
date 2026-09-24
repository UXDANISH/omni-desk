import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { bad, readJson } from '@/lib/api';
import { PRACTICE_COOKIE, practiceCookieOptions } from '@/lib/auth';
import { audit, practicesForUser, userByEmail } from '@/lib/db';
import { credentialsSignIn } from '@/lib/signin';

const Body = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });

/** Email + password sign-in through Auth.js. Owners with several locations pick one next (POST /api/auth/practice). */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Enter your work email and password.');

  const r = await credentialsSignIn('password', parsed.data);
  if (!r.ok) return bad('That email and password don’t match an account.', 401);

  const member = (await userByEmail(parsed.data.email))!;
  const practices = await practicesForUser(member.id);
  const jar = await cookies();
  const keep = practices.find((p) => p.id === jar.get(PRACTICE_COOKIE)?.value) ?? practices[0];
  if (keep) jar.set(PRACTICE_COOKIE, keep.id, practiceCookieOptions);
  await audit(keep?.id ?? null, member.id, 'sign-in', 'password');

  return NextResponse.json({
    user: { id: member.id, name: member.name, role: member.role },
    practices,
    startPage: member.startPage ?? '/overview',
  });
}
