import type { Deposit } from '../types';
import { slug } from './patients';

type Row = [id: string, sent: string, name: string, forAppointment: string, amount: number, status: Deposit['status']];
const ROWS: Row[] = [
  ['PL-8K7Q', 'Today 7:38 AM', 'Emerson Proto', 'Implant consult · Mon Sep 28, 9:00 AM', 75, 'Pending'],
  ['PL-8K6D', 'Today 6:40 AM', 'Skyler Draft', 'New patient exam · Thu 10:00 AM', 50, 'Paid'],
  ['PL-8K3D', 'Yesterday 4:12 PM', 'Riley Demo', 'Whitening consult · Today 11:00 AM', 50, 'Failed'],
  ['PL-8K1A', 'Yesterday 1:30 PM', 'Reese Trial', 'Crown prep · Fri 8:00 AM', 100, 'Paid'],
  ['PL-8J9X', 'Yesterday 10:02 AM', 'Hayden Beta', 'Whitening consult · Sat 9:00 AM', 50, 'Pending'],
  ['PL-8J6M', 'Mon 5:20 PM', 'Kendall Test', 'Implant consult · Tue Sep 29, 1:00 PM', 75, 'Paid'],
  ['PL-8J4B', 'Mon 3:05 PM', 'Finley Mock', 'New patient exam · Today 10:00 AM', 50, 'Paid'],
  ['PL-8J2R', 'Mon 11:40 AM', 'Logan Sample', 'Crown prep · cancelled by patient', 100, 'Refunded'],
  ['PL-8H8T', 'Sun 8:15 PM', 'Parker Dummy', 'Whitening consult · Thu 11:00 AM', 50, 'Pending'],
  ['PL-8H5C', 'Sun 2:02 PM', 'Morgan Sample', 'New patient exam · Tue Sep 29, 10:00 AM', 50, 'Paid'],
  ['PL-8H1W', 'Sat 10:30 AM', 'Avery Mockup', 'Crown prep · Wed 8:00 AM', 100, 'Paid'],
];

export const DEPOSITS: Deposit[] = ROWS.map(([id, sent, name, forAppointment, amount, status]) => ({
  id, sent, patientId: slug(name), forAppointment, amount, status,
  note: status === 'Failed' ? 'Card declined' : status === 'Refunded' ? 'Refunded Mon 12:02 PM' : undefined,
}));

/** Appointments that currently need a deposit link (for the "Send payment link" form). */
export const DEPOSIT_CANDIDATES = [
  { patientId: slug('Jordan Test'), label: 'Emergency exam · Today 9:15 AM' },
  { patientId: slug('Taylor Mock'), label: 'Crown prep · Fri 9:00 AM' },
  { patientId: slug('Riley Demo'), label: 'Whitening consult · Today 11:00 AM' },
  { patientId: slug('Skyler Draft'), label: 'Implant consult · Mon Sep 28, 1:00 PM' },
];

// 7-day totals shown on the Deposits page (consistent with Overview "7 days").
export const DEPOSIT_TOTALS_7D = { collected: 2450, paidCount: 49 };
