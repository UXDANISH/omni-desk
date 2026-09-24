import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { PRACTICE_COOKIE, practiceCookieOptions } from '@/lib/auth';

const Body = z.object({ practiceId: z.string().min(1) });

/** Choose which location this screen shows. Only practices the user belongs to are accepted. */
export async function POST(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Pick a location');
  const p = g.practices.find((x) => x.id === parsed.data.practiceId);
  if (!p) return bad('You don’t have access to that location.', 403);
  (await cookies()).set(PRACTICE_COOKIE, p.id, practiceCookieOptions);
  return NextResponse.json({ practice: p });
}
