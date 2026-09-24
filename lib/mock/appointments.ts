import type { Appointment, Provider } from '../types';
import { patientIdByName } from './patients';

export const PROVIDERS: Provider[] = [
  { name: 'Dr. Sample', role: 'Dentist' },
  { name: 'Dr. Placeholder', role: 'Associate' },
  { name: 'Kim Hygienist', role: 'Hygiene' },
];

// Sample week. "Today" is Wednesday, Sep 23 2026.
export const WEEK: [string, string][] = [
  ['Mon', 'Sep 21'], ['Tue', 'Sep 22'], ['Wed', 'Sep 23'], ['Thu', 'Sep 24'],
  ['Fri', 'Sep 25'], ['Sat', 'Sep 26'], ['Sun', 'Sep 27'], ['Mon', 'Sep 28'],
];
export const TODAY_INDEX = 2;
export const NOW_MINUTES = 640; // 10:40 AM

export const DEPOSIT_FEES: Record<string, number> = {
  'Whitening consult': 50,
  'Implant consult': 75,
  'Crown prep': 100,
  'New patient exam': 50,
};

const POOL = ['Jordan Test', 'Alex Example', 'Casey Placeholder', 'Jamie Sample', 'Avery Mockup', 'Quinn Example', 'Parker Dummy', 'Reese Trial', 'Skyler Draft', 'Emerson Proto', 'Hayden Beta', 'Finley Mock', 'Kendall Test', 'Logan Sample', 'Morgan Sample'];

const PATTERN: [number, number, string][][] = [
  [[480, 60, 'Crown prep'], [600, 30, 'Consult'], [690, 60, 'Root canal'], [810, 45, 'Filling'], [900, 60, 'Crown seat'], [975, 30, 'Emergency exam']],
  [[510, 60, 'Extraction'], [600, 45, 'Filling'], [660, 30, 'Consult'], [780, 60, 'Implant consult'], [870, 45, 'Filling'], [945, 60, 'Crown prep']],
  [[480, 60, 'Cleaning'], [540, 60, 'Cleaning'], [600, 60, 'New patient exam'], [660, 60, 'Cleaning'], [780, 60, 'Perio maintenance'], [840, 60, 'Cleaning'], [930, 60, 'Cleaning']],
];

type Draft = Omit<Appointment, 'id' | 'status' | 'patientId' | 'staffName'>;

const NAMED: Draft[] = [
  { day: 2, provider: 0, start: 660, duration: 30, service: 'Whitening consult', patient: 'Riley Demo', bookedBy: 'ai', callId: 'C-20910', depositFailed: true },
  { day: 3, provider: 2, start: 930, duration: 60, service: 'Cleaning', patient: 'Drew Testcase', bookedBy: 'ai', callId: 'C-20899' },
  { day: 4, provider: 2, start: 480, duration: 60, service: 'Cleaning', patient: 'Taylor Mock', bookedBy: 'ai', callId: 'C-20925' },
  { day: 7, provider: 0, start: 780, duration: 45, service: 'Crown seat', patient: 'Sam Fixture', bookedBy: 'ai', callId: 'C-20919' },
];

function generate(): Appointment[] {
  const out: Draft[] = [];
  for (let d = 0; d < 6; d++) {
    PATTERN.forEach((pat, p) => {
      if (d === 5 && p === 1) return;
      pat.forEach(([start, duration, service], i) => {
        if (d === 5 && start >= 720) return;
        if ((d * 7 + i * 3 + p) % 5 === 0) return;
        out.push({ day: d, provider: p, start, duration, service, patient: POOL[(d * 11 + p * 5 + i * 3) % POOL.length], bookedBy: (d + i + p) % 3 === 0 ? 'ai' : 'staff' });
      });
    });
  }
  NAMED.forEach((n) => {
    for (let k = out.length - 1; k >= 0; k--) {
      const o = out[k];
      if (o.day === n.day && o.provider === n.provider && o.start < n.start + n.duration && n.start < o.start + o.duration) out.splice(k, 1);
    }
    out.push({ ...n });
  });
  out.sort((a, b) => a.day - b.day || a.start - b.start || a.provider - b.provider);
  return out.map((a, i) => ({
    ...a,
    id: 'A-' + (3100 + i),
    patientId: patientIdByName(a.patient),
    status: a.day < TODAY_INDEX ? 'Completed' : (Math.floor(a.start / 30) + a.day) % 4 === 1 ? 'Unconfirmed' : 'Confirmed',
    staffName: a.bookedBy === 'staff' ? ['Lee Frontdesk', 'Pat Manager'][Math.floor(a.start / 15) % 2] : undefined,
  }));
}

export const APPOINTMENTS: Appointment[] = generate();
