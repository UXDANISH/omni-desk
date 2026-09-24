import type { NotificationKey, NotificationPrefs, PlanName, Practice, SessionInfo, TeamMember } from '../types';

export const PRACTICES: Practice[] = [
  { id: 'smile-austin', name: 'Smile Dental', location: 'Austin, TX · Main' },
  { id: 'smile-roundrock', name: 'Smile Dental', location: 'Round Rock, TX' },
];

export const TEAM: TeamMember[] = [
  { id: 'u1', name: 'Dr. Sample', initials: 'DS', email: 'dr.sample@smiledental.example', role: 'Owner', lastActive: 'Active now', status: 'Active', last4: '0107' },
  { id: 'u2', name: 'Pat Manager', initials: 'PM', email: 'pat@smiledental.example', role: 'Manager', lastActive: '12 min ago', status: 'Active', last4: '0112' },
  { id: 'u3', name: 'Lee Frontdesk', initials: 'LF', email: 'lee@smiledental.example', role: 'Front desk', lastActive: '3 min ago', status: 'Active', last4: '0123' },
  { id: 'u4', name: 'Chris Frontdesk', initials: 'CF', email: 'chris@smiledental.example', role: 'Front desk', lastActive: 'Yesterday', status: 'Active', last4: '0131' },
  { id: 'u5', name: 'Dr. Placeholder', initials: 'DP', email: 'dr.placeholder@smiledental.example', role: 'Manager', lastActive: 'Mon', status: 'Active', last4: '0145' },
  { id: 'u6', name: 'Kim Hygienist', initials: 'KH', email: 'kim@smiledental.example', role: 'Front desk', lastActive: '—', status: 'Invited', last4: '0150' },
];

export const NOTIFICATION_EVENTS: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'needs', label: 'A call needs a human', description: 'Insurance, billing, or callback requests' },
  { key: 'emerg', label: 'An emergency call is flagged', description: 'Swelling, bleeding, severe pain' },
  { key: 'depfail', label: 'A deposit payment fails', description: 'Card declined or link expired' },
  { key: 'optout', label: 'A patient opts out of contact', description: 'Replied STOP or asked not to be called' },
  { key: 'summary', label: 'Daily summary', description: 'One message at the time below' },
  { key: 'weekly', label: 'Weekly results', description: 'Bookings, recall, and deposits · Mondays' },
  { key: 'team', label: 'Someone joins the team', description: 'An invite is accepted' },
];

export const defaultNotifications = (): NotificationPrefs => ({
  events: {
    needs: [true, false, false],
    emerg: [true, true, true],
    depfail: [true, false, false],
    optout: [true, false, false],
    summary: [false, true, false],
    weekly: [false, true, false],
    team: [true, false, false],
  },
  summaryAt: '6:30 AM',
  quietHours: true,
});

export const defaultSessions = (): SessionInfo[] => [
  { id: 's1', device: 'Front desk PC 1 · Chrome', meta: 'Austin, TX · Active now', kind: 'desktop', current: true },
  { id: 's2', device: 'iPhone · Safari', meta: 'Austin, TX · 2 hr ago', kind: 'mobile', current: false },
  { id: 's3', device: 'Home laptop · Firefox', meta: 'Round Rock, TX · Sep 19', kind: 'desktop', current: false },
];

// Placeholder pricing — replace with real plan data.
export const PLANS: { name: PlanName; price: number; features: string[] }[] = [
  { name: 'Starter', price: 299, features: ['1 dentist', '500 call minutes', '24/7 answering and booking', 'Deposit links'] },
  { name: 'Growth', price: 549, features: ['Up to 3 dentists', '1,500 call minutes', 'Everything in Starter', 'Recall campaigns'] },
  { name: 'Practice', price: 899, features: ['Up to 5 dentists', '4,000 call minutes', 'Everything in Growth', 'Multiple locations'] },
];

export const INVOICES = [
  { date: 'Sep 1, 2026', description: 'Growth · Aug 1–31', amount: 549 },
  { date: 'Aug 1, 2026', description: 'Growth · Jul 1–31', amount: 549 },
  { date: 'Jul 1, 2026', description: 'Growth · Jun 1–30 + 212 extra min', amount: 633.8 },
  { date: 'Jun 1, 2026', description: 'Starter → Growth (prorated)', amount: 401.5 },
];

export const USAGE = { used: 1084, included: 1500, projected: 1420, resets: 'Oct 1', overageRate: 0.4 };
