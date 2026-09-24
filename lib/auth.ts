import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth, PRACTICE_COOKIE } from '@/auth';
import { getAuthSession, practicesForUser, toMember, touchAuthSession, touchUser, userById } from './db';
import type { Practice, TeamMember } from './types';

export { PRACTICE_COOKIE };

export const practiceCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 90,
};

export interface SessionContext {
  user: TeamMember;
  practiceId: string;
  practice: Practice;
  practices: Practice[];
  /** auth_sessions row for this device */
  sessionId: string;
}

const TOUCH_EVERY_MS = 60 * 1000;

/**
 * Resolves the signed-in user for this request, or null. Checks the Auth.js JWT, then that the
 * device session still exists in Postgres (so "sign out other devices" and removing a teammate
 * take effect immediately), then which practice this screen has open. Cached per request.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const s = await auth();
  const uid = s?.user?.id;
  if (!uid || !s.sid) return null;
  const row = await getAuthSession(s.sid);
  if (!row || row.userId !== uid) return null;
  const u = await userById(uid);
  if (!u || u.status !== 'Active') return null;
  const practices = await practicesForUser(uid);
  if (!practices.length) return null;

  const wanted = (await cookies()).get(PRACTICE_COOKIE)?.value;
  const practice = practices.find((p) => p.id === wanted) ?? practices[0];

  if (Date.now() - row.lastSeenAt.getTime() > TOUCH_EVERY_MS) {
    await Promise.all([touchAuthSession(row.id), touchUser(uid)]);
  }
  return { user: toMember(u), practiceId: practice.id, practice, practices, sessionId: row.id };
});

export async function getCurrentUser(): Promise<TeamMember | null> {
  return (await getSession())?.user ?? null;
}

export async function requireSession(): Promise<SessionContext> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

export async function requireUser(): Promise<TeamMember> {
  return (await requireSession()).user;
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
