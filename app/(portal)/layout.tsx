import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requireSession, publicUser } from '@/lib/auth';
import { listCalls, listTeam } from '@/lib/db';
import { isNeedsHuman } from '@/lib/tones';
import { SessionProvider } from '@/components/shell/SessionProvider';
import { Sidebar } from '@/components/shell/Sidebar';
import { MobileTabBar } from '@/components/shell/MobileTabBar';
import { SessionTimeout } from '@/components/shell/SessionTimeout';
import { ToastProvider } from '@/components/ui/Toast';

// Private, patient-data pages: never index, never follow.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, practice, practiceId } = await requireSession();
  const [calls, members] = await Promise.all([listCalls(practiceId), listTeam(practiceId)]);
  const needs = calls.filter(isNeedsHuman).length;
  const team = members
    .filter((t) => t.status === 'Active')
    .map(({ id, name, initials, role, lastActive }) => ({ id, name, initials, role, lastActive }));

  return (
    <SessionProvider user={publicUser(user)} team={team} practice={practice.location}>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar needsCount={needs} />
          <div className="flex min-w-0 flex-1 flex-col pb-[84px] md:pb-0">{children}</div>
        </div>
        <Suspense>
          <MobileTabBar needsCount={needs} />
        </Suspense>
        <SessionTimeout />
      </ToastProvider>
    </SessionProvider>
  );
}
