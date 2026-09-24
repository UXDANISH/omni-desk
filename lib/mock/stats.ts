export const RANGES = ['today', '7d', '30d'] as const;
export type RangeKey = (typeof RANGES)[number];

export interface RangeStats {
  label: string;
  answered: number;
  booked: number;
  afterHours: number;
  recallRebooked: number;
  recallContacted: number;
  deposits: number;
  depositCount: number;
  depositPending: number;
}

// Sample numbers. Internally consistent: booked ≤ answered, rebooked ≤ contacted.
export const STATS: Record<RangeKey, RangeStats> = {
  today: { label: 'Today', answered: 31, booked: 9, afterHours: 7, recallRebooked: 3, recallContacted: 18, deposits: 350, depositCount: 7, depositPending: 1 },
  '7d': { label: '7 days', answered: 214, booked: 58, afterHours: 61, recallRebooked: 23, recallContacted: 140, deposits: 2450, depositCount: 49, depositPending: 3 },
  '30d': { label: '30 days', answered: 902, booked: 241, afterHours: 255, recallRebooked: 97, recallContacted: 588, deposits: 10150, depositCount: 203, depositPending: 5 },
};

export interface OverviewExtras {
  prevBooked: number;
  compareLabel: string;
  production: number;
  prevProduction: number;
  /** [label, calls answered, booked] — sums match STATS answered/booked */
  bars: [string, number, number][];
  chartTitle: string;
  chartNote: string;
  /** Booked, Answered questions, Transferred, Callback requested, Hang-ups — sums to answered */
  mix: [number, number, number, number, number];
}

export const OVERVIEW: Record<RangeKey, OverviewExtras> = {
  today: {
    prevBooked: 7, compareLabel: 'last Wednesday', production: 2310, prevProduction: 1890,
    bars: [['Overnight', 7, 2], ['8 AM', 9, 3], ['9 AM', 9, 3], ['10 AM', 6, 1]],
    chartTitle: 'Calls today by hour',
    chartNote: 'Overnight = midnight to 8 AM, when the office phone would have gone to voicemail.',
    mix: [9, 12, 4, 3, 3],
  },
  '7d': {
    prevBooked: 49, compareLabel: 'previous 7 days', production: 14850, prevProduction: 12600,
    bars: [['Thu', 28, 8], ['Fri', 33, 9], ['Sat', 30, 7], ['Sun', 35, 10], ['Mon', 31, 8], ['Tue', 26, 7], ['Today', 31, 9]],
    chartTitle: 'Calls answered per day',
    chartNote: 'Sunday had the most calls. The office was closed, so all 35 were answered by OmniDesk.',
    mix: [58, 88, 34, 17, 17],
  },
  '30d': {
    prevBooked: 210, compareLabel: 'previous 30 days', production: 61400, prevProduction: 53900,
    bars: [['Aug 25', 203, 52], ['Sep 1', 211, 57], ['Sep 8', 196, 53], ['Sep 15', 224, 62], ['Sep 22', 68, 17]],
    chartTitle: 'Calls answered per week',
    chartNote: 'The week of Sep 22 is in progress (2 of 7 days).',
    mix: [241, 371, 139, 76, 75],
  },
};

export const MIX_LEGEND = [
  { label: 'Booked', className: 'bg-accent' },
  { label: 'Answered questions', className: 'bg-muted opacity-[.45]' },
  { label: 'Transferred to staff', className: 'bg-muted opacity-[.22]' },
  { label: 'Callback requested', className: 'bg-warn' },
  { label: 'Hang-ups', className: 'bg-line' },
] as const;

export const WAITING: Record<string, string> = {
  'C-20931': 'Waiting 38 min',
  'C-20928': 'Waiting 1 hr 5 min',
  'C-20914': 'Waiting since yesterday 5:48 PM',
  'C-20910': 'Held until Tue 5 PM',
};
export const TAG_PRIORITY: Record<string, number> = { EMERGENCY: 0, 'DEPOSIT FAILED': 1, INSURANCE: 2, ESCALATION: 3 };

export const parseRange = (v: unknown): RangeKey => ((RANGES as readonly string[]).includes(v as string) ? (v as RangeKey) : '7d');
