import type { Role } from './types';

export type Permission =
  | 'viewCalls' | 'callBack' | 'workRecall' | 'sendDeposits'
  | 'seeDepositTotals' | 'refundDeposits' | 'editReceptionist' | 'editIntegrations'
  | 'inviteTeam' | 'manageRoles' | 'viewBilling' | 'changePlan';

const MATRIX: Record<Permission, Role[]> = {
  viewCalls: ['Owner', 'Manager', 'Front desk'],
  callBack: ['Owner', 'Manager', 'Front desk'],
  workRecall: ['Owner', 'Manager', 'Front desk'],
  sendDeposits: ['Owner', 'Manager', 'Front desk'],
  seeDepositTotals: ['Owner', 'Manager'],
  refundDeposits: ['Owner', 'Manager'],
  editReceptionist: ['Owner', 'Manager'],
  editIntegrations: ['Owner', 'Manager'],
  inviteTeam: ['Owner', 'Manager'],
  manageRoles: ['Owner'],
  viewBilling: ['Owner', 'Manager'],
  changePlan: ['Owner'],
};

export const can = (role: Role, p: Permission) => MATRIX[p].includes(role);

/** Rows for the "What each role can do" table in Settings. */
export const PERMISSION_TABLE: { label: string; perm: Permission }[] = [
  { label: 'View calls, transcripts, and bookings', perm: 'viewCalls' },
  { label: 'Call back or take over a live call', perm: 'callBack' },
  { label: 'Work the recall queue', perm: 'workRecall' },
  { label: 'Send payment links', perm: 'sendDeposits' },
  { label: 'See deposit totals and refund deposits', perm: 'refundDeposits' },
  { label: 'Change AI receptionist settings', perm: 'editReceptionist' },
  { label: 'Invite teammates', perm: 'inviteTeam' },
  { label: 'Change roles and remove teammates', perm: 'manageRoles' },
  { label: 'See billing and invoices', perm: 'viewBilling' },
  { label: 'Change plan and payment method', perm: 'changePlan' },
];
