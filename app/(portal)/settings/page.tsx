import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { TopBar, PageBody } from '@/components/shell/TopBar';
import { TabLinks } from '@/components/ui/Nav';
import { requireUser } from '@/lib/auth';
import { can } from '@/lib/permissions';
import { db, notificationsFor } from '@/lib/db';
import { INVOICES, PLANS, USAGE } from '@/lib/mock/team';
import { one } from '@/lib/format';
import type { PageProps } from '@/lib/types';
import { TeamSection, InviteButton } from './TeamSection';
import { Integrations } from './Integrations';
import { NotificationsForm } from './NotificationsForm';
import { BillingSection } from './BillingSection';

export const metadata: Metadata = { title: 'Settings' };

type Tab = 'team' | 'integrations' | 'notifications' | 'billing';

export default async function SettingsPage({ searchParams }: PageProps) {
  const user = await requireUser();
  const requested = (one((await searchParams).tab) ?? 'team') as Tab;
  const canBilling = can(user.role, 'viewBilling');
  // Front desk can't see billing at all — not even the tab.
  if (requested === 'billing' && !canBilling) redirect('/settings');
  const tab: Tab = (['team', 'integrations', 'notifications', 'billing'] as const).includes(requested) ? requested : 'team';

  const tabs = (
    <TabLinks
      label="Settings sections"
      items={[
        { label: 'Team & roles', href: '/settings', active: tab === 'team' },
        { label: 'Integrations', href: '/settings?tab=integrations', active: tab === 'integrations' },
        { label: 'Notifications', href: '/settings?tab=notifications', active: tab === 'notifications' },
        ...(canBilling ? [{ label: 'Billing & plan', href: '/settings?tab=billing', active: tab === 'billing' }] : []),
      ]}
    />
  );

  // Notifications and Billing own their Save / Switch button, so they render their own header.
  if (tab === 'notifications') return <NotificationsForm tabs={tabs} initial={notificationsFor(user.id)} userName={user.name} />;
  if (tab === 'billing')
    return <BillingSection tabs={tabs} plan={db.plan} plans={PLANS} usage={USAGE} invoices={INVOICES} canChange={can(user.role, 'changePlan')} />;

  const team = db.team.map(({ last4: _l, ...t }) => t);
  return (
    <>
      <TopBar title="Settings" action={tab === 'team' && can(user.role, 'inviteTeam') ? <InviteButton canInviteManagers={can(user.role, 'manageRoles')} /> : undefined} />
      <PageBody>
        {tabs}
        {tab === 'team' && <TeamSection team={team} me={user.id} role={user.role} plan={db.plan} />}
        {tab === 'integrations' && <Integrations readOnly={!can(user.role, 'editIntegrations')} />}
      </PageBody>
    </>
  );
}
