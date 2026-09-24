import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { authConfig } from './auth.config';
import {
  createAuthSession, deleteAuthSession, getAuthSession, isMember, touchUser, updateUser, userByEmail, userById,
} from './lib/db';
import { newId, verifySecret } from './lib/password';

export const PRACTICE_COOKIE = 'cf_practice';
const PIN_MAX_FAILURES = 5;
const PIN_LOCK_MS = 5 * 60 * 1000;

class AuthFailed extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

function clientInfo(request: Request) {
  const h = request.headers;
  return {
    userAgent: h.get('user-agent')?.slice(0, 400) ?? null,
    ip: (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim() || null,
  };
}

async function openSession(userId: string, request: Request) {
  const sid = newId('s_');
  await createAuthSession({ id: sid, userId, ...clientInfo(request) });
  await touchUser(userId);
  return sid;
}

const PasswordCreds = z.object({ email: z.string().email(), password: z.string().min(1).max(200) });
const PinCreds = z.object({ userId: z.string().min(1), pin: z.string().regex(/^\d{4}$/) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  logger: {
    // A wrong password is expected traffic, not a server error: log one line, no stack.
    error(e) {
      // Match on `type`, not `name`: class names are minified in production builds.
      const err = e as Error & { type?: string; code?: string };
      if (err.type === 'CredentialsSignin') console.warn(`[auth] sign-in rejected (${err.code ?? 'invalid'})`);
      else console.error('[auth]', e);
    },
  },
  providers: [
    Credentials({
      id: 'password',
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = PasswordCreds.safeParse(raw);
        if (!parsed.success) throw new AuthFailed('invalid');
        const u = await userByEmail(parsed.data.email);
        const ok = await verifySecret(parsed.data.password, u?.passwordHash);
        if (!u || !ok || u.status !== 'Active') throw new AuthFailed('invalid');
        return { id: u.id, name: u.name, email: u.email, sid: await openSession(u.id, request) };
      },
    }),
    /**
     * Switch user on a shared front-desk computer. Only works from an existing signed-in
     * session, and only for a teammate in the practice that screen has open.
     */
    Credentials({
      id: 'pin',
      credentials: { userId: {}, pin: {} },
      async authorize(raw, request) {
        const parsed = PinCreds.safeParse(raw);
        if (!parsed.success) throw new AuthFailed('invalid');

        const current = await auth();
        const currentRow = current?.sid ? await getAuthSession(current.sid) : undefined;
        if (!current?.user?.id || !currentRow || currentRow.userId !== current.user.id) throw new AuthFailed('no-session');

        const practiceId = (await cookies()).get(PRACTICE_COOKIE)?.value;
        const target = await userById(parsed.data.userId);
        if (!target || target.status !== 'Active' || !practiceId || !(await isMember(target.id, practiceId)) || !(await isMember(current.user.id, practiceId)))
          throw new AuthFailed('not-allowed');
        if (target.pinLockedUntil && target.pinLockedUntil > new Date()) throw new AuthFailed('locked');

        if (!(await verifySecret(parsed.data.pin, target.pinHash))) {
          const failures = target.pinFailures + 1;
          await updateUser(target.id, failures >= PIN_MAX_FAILURES ? { pinFailures: 0, pinLockedUntil: new Date(Date.now() + PIN_LOCK_MS) } : { pinFailures: failures });
          throw new AuthFailed(failures >= PIN_MAX_FAILURES ? 'locked' : 'wrong-pin');
        }
        await updateUser(target.id, { pinFailures: 0, pinLockedUntil: null });
        await deleteAuthSession(currentRow.id);
        return { id: target.id, name: target.name, email: target.email, sid: await openSession(target.id, request) };
      },
    }),
  ],
});
