import type { IconName } from '@/components/ui/Icon';

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

export const NAV_MAIN: NavItem[] = [
  { href: '/overview', label: 'Overview', icon: 'overview' },
  { href: '/calls', label: 'Calls', icon: 'calls' },
  { href: '/appointments', label: 'Appointments', icon: 'appointments' },
  { href: '/recall', label: 'Recall', icon: 'recall' },
  { href: '/deposits', label: 'Deposits', icon: 'deposits' },
  { href: '/patients', label: 'Patients', icon: 'patients' },
];

export const NAV_SYS: NavItem[] = [
  { href: '/receptionist', label: 'AI Receptionist', icon: 'receptionist' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];
