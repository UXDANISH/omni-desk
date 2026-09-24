import 'server-only';
import { NextResponse } from 'next/server';
import { getCurrentUser } from './auth';
import { can, type Permission } from './permissions';
import type { TeamMember } from './types';

type Guarded = { user: TeamMember; error?: undefined } | { user?: undefined; error: NextResponse };

/** Use at the top of every API route: `const g = await guard('refundDeposits'); if (g.error) return g.error;` */
export async function guard(perm?: Permission): Promise<Guarded> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) };
  if (perm && !can(user.role, perm)) return { error: NextResponse.json({ error: 'Not allowed for your role' }, { status: 403 }) };
  return { user };
}

export const bad = (message: string, status = 400) => NextResponse.json({ error: message }, { status });
export const notFound = (what = 'Not found') => NextResponse.json({ error: what }, { status: 404 });

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
