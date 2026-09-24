import 'server-only';
import { NextResponse } from 'next/server';
import { getSession, type SessionContext } from './auth';
import { can, type Permission } from './permissions';

type Guarded = (SessionContext & { error?: undefined }) | { user?: undefined; error: NextResponse };

/** Use at the top of every API route: `const g = await guard('refundDeposits'); if (g.error) return g.error;` */
export async function guard(perm?: Permission): Promise<Guarded> {
  const s = await getSession();
  if (!s) return { error: NextResponse.json({ error: 'Not signed in' }, { status: 401 }) };
  if (perm && !can(s.user.role, perm)) return { error: NextResponse.json({ error: 'Not allowed for your role' }, { status: 403 }) };
  return s;
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

/** Absolute origin for links we hand out (invites, password resets). */
export const appOrigin = (req: Request) => process.env.AUTH_URL?.replace(/\/api\/auth\/?$/, '') || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
