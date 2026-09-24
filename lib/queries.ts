import 'server-only';
import { db } from './db';
import type { Call } from './types';

/** Shared read helpers used by both server pages and API routes, so filters behave identically. */

export const CALL_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'needs', label: 'Needs human' },
  { key: 'booked', label: 'Booked' },
  { key: 'transferred', label: 'Transferred' },
  { key: 'info', label: 'Info only' },
] as const;
export type CallFilter = (typeof CALL_FILTERS)[number]['key'];

const matches = (c: Call, f: CallFilter) =>
  f === 'all' ||
  (f === 'needs' && c.outcome === 'Needs human') ||
  (f === 'booked' && c.outcome === 'Booked') ||
  (f === 'transferred' && c.outcome === 'Transferred') ||
  (f === 'info' && (c.outcome === 'Answered' || c.outcome === 'Hang-up'));

export function queryCalls({ filter = 'all', q = '', afterHours = false }: { filter?: CallFilter; q?: string; afterHours?: boolean }) {
  const needle = q.trim().toLowerCase();
  return db.calls.filter(
    (c) => matches(c, filter) && (!afterHours || c.afterHours) && (!needle || `${c.caller} ${c.reason}`.toLowerCase().includes(needle)),
  );
}

export const callCounts = () =>
  Object.fromEntries(CALL_FILTERS.map((f) => [f.key, db.calls.filter((c) => matches(c, f.key)).length])) as Record<CallFilter, number>;

/** Strip the full phone number before sending a call to the browser. */
export const toPublicCall = ({ phone: _phone, ...rest }: Call) => rest;
