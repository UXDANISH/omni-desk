import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { requireSession } from '@/lib/auth';
import { sessionsFor } from '@/lib/db';
import { ProfileForm } from './ProfileForm';
import type { ThemePref } from '@/components/shell/ThemeToggle';

export const metadata: Metadata = { title: 'Your profile' };

export default async function ProfilePage() {
  const { user, sessionId } = await requireSession();
  const pref = ((await cookies()).get('cf_theme_pref')?.value ?? 'light') as ThemePref;
  const { last4, ...me } = user;
  return <ProfileForm me={{ ...me, last4 }} sessions={await sessionsFor(user.id, sessionId)} themePref={pref} />;
}
