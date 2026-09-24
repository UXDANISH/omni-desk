import type { AppointmentStatus, Call, Channel, DepositStatus, Outcome, RecallStatus } from './types';

export type Tone = 'accent' | 'ok' | 'warn' | 'danger' | 'neutral' | 'muted';

export const OUTCOME: Record<Outcome, { label: string; tone: Tone }> = {
  Live: { label: 'On call now', tone: 'accent' },
  'Needs human': { label: 'Needs human', tone: 'warn' },
  Booked: { label: 'Booked', tone: 'ok' },
  Transferred: { label: 'Transferred', tone: 'neutral' },
  Answered: { label: 'Answered', tone: 'muted' },
  'Hang-up': { label: 'Hang-up', tone: 'muted' },
  Resolved: { label: 'Resolved by staff', tone: 'ok' },
};

export const statusTone = (s: AppointmentStatus | RecallStatus | DepositStatus): Tone =>
  ({
    Confirmed: 'ok', Unconfirmed: 'warn', Completed: 'muted',
    Due: 'accent', Contacted: 'neutral', Rebooked: 'ok', 'No response': 'warn', 'Opted out': 'muted',
    Paid: 'ok', Pending: 'warn', Failed: 'danger', Refunded: 'muted',
  } as const)[s];

export const attentionTone = (tag?: Call['tag']): Tone => (tag === 'DEPOSIT FAILED' ? 'danger' : 'warn');

export const CHANNEL_LABEL: Record<Channel, string> = { call: 'Call', text: 'Text', email: 'Email' };

export const isNeedsHuman = (c: Call) => c.outcome === 'Needs human';
export const needsAttention = (c: Call) => c.outcome === 'Needs human' || (!!c.attention && !c.resolved);
