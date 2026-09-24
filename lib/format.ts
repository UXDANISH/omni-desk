import { TODAY_INDEX, WEEK } from './mock/appointments';

export const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const fmtNumber = (n: number) => n.toLocaleString('en-US');
export const money = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

export const maskPhone = (last4: string) => `***-***-${last4}`;
export const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  return `${user[0]}•••@${domain}`;
};

/** minutes from midnight → "9:30 AM" */
export const fmtTime = (m: number) => {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
};

export const dayLabel = (d: number) =>
  d === TODAY_INDEX ? 'Today' : d === TODAY_INDEX + 1 ? 'Tomorrow' : `${WEEK[d][0]} ${WEEK[d][1]}`;

export const durSeconds = (d: string) => {
  const [m, s] = d.split(':').map(Number);
  return m * 60 + s;
};
export const mmss = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

/** Build a URL keeping existing search params and overriding some. `undefined` removes a key. */
export function withParams(path: string, current: Record<string, string | undefined>, next: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  const merged = { ...current, ...next };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== '') p.set(k, v);
  });
  const qs = p.toString();
  return qs ? `${path}?${qs}` : path;
}
