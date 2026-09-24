import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthLayout } from '@/components/shell/AuthLayout';
import { peekAuthToken } from '@/lib/db';
import { hashToken } from '@/lib/password';
import { SetPasswordForm } from '@/components/shell/SetPasswordForm';

export const metadata: Metadata = { title: 'Set a new password', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await peekAuthToken(hashToken(token), 'reset');
  if (!row) {
    return (
      <AuthLayout title="This link has expired" intro="Reset links work once, for 1 hour. Request a new one from the sign-in page.">
        <Link href="/login" className="cf-btn-primary h-11 no-underline hover:text-on-accent">Go to sign in</Link>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout title="Set a new password" intro="You'll be signed out on every device and can sign in again with the new password.">
      <SetPasswordForm mode="reset" token={token} />
    </AuthLayout>
  );
}
