import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js config, shared by middleware.ts and auth.ts.
 * No database or bcrypt imports here: middleware only verifies the signed session cookie.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present right after authorize() succeeds.
      if (user) {
        token.uid = user.id;
        token.sid = (user as { sid?: string }).sid;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      session.sid = token.sid as string | undefined;
      return session;
    },
  },
} satisfies NextAuthConfig;

declare module 'next-auth' {
  interface Session {
    /** Row id in auth_sessions. Deleting that row signs this device out. */
    sid?: string;
  }
}
