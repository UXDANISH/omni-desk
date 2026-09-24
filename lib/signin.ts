import 'server-only';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

/**
 * Server-side Auth.js credentials sign-in that reports failure instead of redirecting.
 * On success Auth.js sets the session cookie on the current response.
 */
export async function credentialsSignIn(provider: 'password' | 'pin', data: Record<string, string>): Promise<{ ok: true } | { ok: false; code: string }> {
  try {
    const url: unknown = await signIn(provider, { ...data, redirect: false });
    // Some Auth.js versions report credential failures in the returned URL rather than throwing.
    if (typeof url === 'string' && url.includes('error=')) {
      return { ok: false, code: new URL(url, 'http://x').searchParams.get('code') ?? 'invalid' };
    }
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, code: (e as AuthError & { code?: string }).code ?? 'invalid' };
    throw e;
  }
}
