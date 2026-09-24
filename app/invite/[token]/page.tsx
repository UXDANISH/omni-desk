import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/shell/AuthLayout';
import { peekAuthToken, practicesForUser, userById } from '@/lib/db';
import { hashToken } from '@/lib/password';
import { SetPasswordForm } from '@/components/shell/SetPasswordForm';

export const metadata: Metadata = { title: 'Join your practice', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await peekAuthToken(hashToken(token), 'invite');
  const user = row && (await userById(row.userId));
  const practice = user && (await practicesForUser(user.id))[0];

  if (!user || user.status !== 'Invited') {
    return (
      <AuthLayout title="This invite has expired" intro="Invite links work once, for 7 days. Ask whoever invited you to resend it from Settings → Team.">
        <Link href="/login" className="cf-btn-primary h-11 no-underline hover:text-on-accent">Go to sign in</Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title={`Join ${practice?.name ?? 'your practice'}`} intro={<>You were invited as <strong className="font-semibold text-ink">{user.role}</strong> with {user.email}. Set up your account to sign in.</>}>
      <SetPasswordForm mode="invite" token={token} defaultName={user.name} />
    </AuthLayout>
  );
}
