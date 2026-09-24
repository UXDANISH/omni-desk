import type { RecallHistoryEntry, RecallItem, RecallRule } from '../types';
import { slug } from './patients';

export const RECALL_RULES: RecallRule[] = [
  { id: 'r1', name: '6-month hygiene', trigger: 'last cleaning', delay: 6, unit: 'months', steps: [{ channel: 'text', day: 0 }, { channel: 'call', day: 3 }, { channel: 'email', day: 7 }], active: true, queue: 31, script: "Hi {first name}, it's been 6 months since your last cleaning at Smile Dental. Reply 1 to book, or we'll give you a call." },
  { id: 'r2', name: 'Post-extraction check', trigger: 'extraction', delay: 10, unit: 'days', steps: [{ channel: 'call', day: 0 }, { channel: 'text', day: 1 }], active: true, queue: 4, script: "Dr. Sample wanted to see you again in 10 days to check how you're healing." },
  { id: 'r3', name: 'Unscheduled treatment', trigger: 'treatment plan presented', delay: 7, unit: 'days', steps: [{ channel: 'text', day: 0 }, { channel: 'call', day: 2 }, { channel: 'email', day: 5 }], active: true, queue: 12 },
  { id: 'r4', name: 'Perio maintenance', trigger: 'perio maintenance visit', delay: 3, unit: 'months', steps: [{ channel: 'email', day: 0 }, { channel: 'text', day: 3 }, { channel: 'call', day: 6 }], active: true, queue: 9 },
  { id: 'r5', name: 'Lapsed patients', trigger: 'last visit', delay: 18, unit: 'months', steps: [{ channel: 'email', day: 0 }, { channel: 'text', day: 7 }], active: false, queue: 0 },
];

type Row = [name: string, rule: string, reason: string, due: string, status: RecallItem['status'], ch: RecallItem['channel'], last: string, next: string];
const ROWS: Row[] = [
  ['Parker Dummy', 'r2', 'Post-extraction check', 'Sep 23', 'Due', null, 'Not contacted yet', 'Call today, 10:00 AM'],
  ['Hayden Beta', 'r1', '6-month cleaning', 'Sep 20', 'Due', null, 'Not contacted yet', 'Text today, 9:00 AM'],
  ['Finley Mock', 'r1', '6-month cleaning', 'Sep 23', 'Due', null, 'Not contacted yet', 'Text today, 9:00 AM'],
  ['Kendall Test', 'r3', 'Unscheduled crown', 'Sep 22', 'Contacted', 'text', 'Yesterday 9:04 AM', 'Call Thu if no reply'],
  ['Quinn Example', 'r3', 'Rebook cancelled filling', 'Sep 21', 'Contacted', 'text', 'Mon 3:30 PM', 'Email Thu (no call consent)'],
  ['Logan Sample', 'r3', 'Unscheduled implant consult', 'Sep 19', 'Contacted', 'call', 'Mon 2:10 PM', 'Left voicemail · text Thu'],
  ['Casey Placeholder', 'r4', 'Perio maintenance', 'Sep 16', 'Contacted', 'email', 'Sep 17', 'Call Wed (no text consent)'],
  ['Drew Testcase', 'r1', '6-month cleaning', 'Sep 18', 'Rebooked', 'call', 'Yesterday 11:05 AM', 'Booked Thu 3:30 PM'],
  ['Jamie Sample', 'r1', '6-month cleaning', 'Sep 10', 'Rebooked', 'text', 'Sep 19', 'Booked Oct 2, 9:00 AM'],
  ['Reese Trial', 'r4', 'Perio maintenance', 'Sep 15', 'No response', 'email', 'Sep 21', 'Final text Sep 24'],
  ['Emerson Proto', 'r1', '6-month cleaning', 'Sep 12', 'No response', 'call', 'Sep 19', 'Paused · review manually'],
  ['Rowan Stub', 'r5', 'Lapsed 18 months', 'Aug 30', 'Opted out', 'text', 'Aug 31', 'None · replied STOP'],
];

export const RECALL_QUEUE: RecallItem[] = ROWS.map(([name, ruleId, reason, due, status, channel, lastContact, next]) => ({
  patientId: slug(name), ruleId, reason, due, status, channel, lastContact, next,
}));

export const RECALL_TOTAL_IN_QUEUE = 56;

const H = (date: string, channel: RecallHistoryEntry['channel'], text: string): RecallHistoryEntry => ({ date, channel, text });
export const RECALL_HISTORY: Record<string, RecallHistoryEntry[]> = {
  [slug('Drew Testcase')]: [H('Sep 18', 'text', 'Recall text sent · no reply'), H('Sep 21', 'call', 'Recall call · booked Thu 3:30 PM')],
  [slug('Jamie Sample')]: [H('Sep 10', 'text', 'Recall text sent'), H('Sep 19', 'text', 'Replied 1 · booked Oct 2, 9:00 AM')],
  [slug('Kendall Test')]: [H('Sep 22', 'text', 'Treatment follow-up text sent')],
  [slug('Quinn Example')]: [H('Sep 21', 'text', 'Rebook text sent after cancellation')],
  [slug('Logan Sample')]: [H('Sep 19', 'text', 'Treatment follow-up text · no reply'), H('Sep 21', 'call', 'Call · voicemail left')],
  [slug('Casey Placeholder')]: [H('Sep 17', 'email', 'Perio maintenance email sent')],
  [slug('Reese Trial')]: [H('Sep 15', 'email', 'Perio email · not opened'), H('Sep 18', 'text', 'Text · no reply'), H('Sep 21', 'call', 'Call · no answer')],
  [slug('Emerson Proto')]: [H('Sep 12', 'call', 'Call · no answer'), H('Sep 19', 'call', 'Call · no answer')],
  [slug('Rowan Stub')]: [H('Aug 30', 'email', 'Lapsed-patient email'), H('Aug 31', 'text', 'Replied STOP · opted out of all channels')],
  [slug('Alex Example')]: [H('Mar 20', 'text', '6-month text · booked Apr 20')],
};
