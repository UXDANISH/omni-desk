import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { findMember } from './db';
import type { TeamMember } from './types';

export const SESSION_COOKIE = 'cf_user';
export const PRACTICE_COOKIE = 'cf_practice';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 12,
};

/**
 * Mock auth: the session cookie holds a team member id.
 * Replace with a real auth provider (and signed/encrypted sessions) before launch.
 */
export async function getCurrentUser(): Promise<TeamMember | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  const m = findMember(id);
  return m && m.status === 'Active' ? m : null;
}

export async function requireUser(): Promise<TeamMember> {
  const u = await getCurrentUser();
  if (!u) redirect('/login');
  return u;
}

/** Only the fields the browser needs. */
export const publicUser = (u: TeamMember) => ({
  id: u.id,
  name: u.name,
  initials: u.initials,
  email: u.email,
  role: u.role,
});
export type PublicUser = ReturnType<typeof publicUser>;
