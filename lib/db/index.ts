import 'server-only';
import { and, asc, count, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import { orm } from './client';
import * as t from './schema';
import { defaultNotifications } from '../mock/team';
import type {
  Appointment, AuditEntry, Call, Consent, Deposit, NotificationPrefs, Patient, PlanName, Practice, ReceptionistSettings,
  RecallHistoryEntry, RecallItem, RecallRule, Role, SessionInfo, TeamMember,
} from '../types';

/**
 * Postgres-backed data access. Every read and write is scoped to a practice id so one
 * location can never see another location's patients, calls or deposits.
 */

export { orm };

type Nullable<T> = { [K in keyof T]: T[K] | null };
/** Drizzle returns SQL NULL as `null`; the domain types use optional (`undefined`) fields. */
function clean<T extends object>(row: Nullable<T> | T): T {
  const out = { ...row } as Record<string, unknown>;
  for (const k of Object.keys(out)) if (out[k] === null) delete out[k];
  return out as T;
}
const last4 = (phone: string | null | undefined) => (phone ?? '').replace(/\D/g, '').slice(-4).padStart(4, '0');

/* ─────────────────────────── Practices ─────────────────────────── */

export async function practicesForUser(userId: string): Promise<Practice[]> {
  return orm
    .select({ id: t.practices.id, name: t.practices.name, location: t.practices.location })
    .from(t.practices)
    .innerJoin(t.memberships, eq(t.memberships.practiceId, t.practices.id))
    .where(eq(t.memberships.userId, userId))
    .orderBy(asc(t.practices.createdAt), asc(t.practices.id));
}

export async function getPlan(practiceId: string): Promise<PlanName> {
  const [p] = await orm.select({ plan: t.practices.plan }).from(t.practices).where(eq(t.practices.id, practiceId));
  return p?.plan ?? 'Starter';
}
export async function setPlan(practiceId: string, plan: PlanName) {
  await orm.update(t.practices).set({ plan }).where(eq(t.practices.id, practiceId));
}

export async function getReceptionist(practiceId: string): Promise<ReceptionistSettings> {
  const [p] = await orm.select({ r: t.practices.receptionist }).from(t.practices).where(eq(t.practices.id, practiceId));
  if (!p) throw new Error(`Practice ${practiceId} not found`);
  return p.r;
}
export async function setReceptionist(practiceId: string, settings: ReceptionistSettings) {
  await orm.update(t.practices).set({ receptionist: settings }).where(eq(t.practices.id, practiceId));
}

/* ─────────────────────────── Users / team ─────────────────────────── */

export type UserRow = typeof t.users.$inferSelect;

/** "Active now", "12 min ago", "Yesterday", "Mon", "Sep 19", or "—". */
export function activeLabel(at: Date | null, now = new Date()): string {
  if (!at) return '—';
  const mins = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (mins < 5) return 'Active now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24 && at.getDate() === now.getDate()) return `${Math.floor(mins / 60)} hr ago`;
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(at.toDateString()).getTime()) / 86400000);
  if (days <= 1) return 'Yesterday';
  if (days < 7) return at.toLocaleDateString('en-US', { weekday: 'short' });
  return at.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function toMember(u: UserRow): TeamMember {
  return clean<TeamMember>({
    id: u.id,
    name: u.name,
    initials: u.initials,
    email: u.email,
    role: u.role,
    lastActive: u.status === 'Invited' ? '—' : activeLabel(u.lastActiveAt),
    status: u.status,
    last4: last4(u.phone),
    startPage: u.startPage,
    twoStep: u.twoStep,
  });
}

export const initialsOf = (name: string) =>
  name.replace(/^Dr\.\s*/, '').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

export async function userByEmail(email: string) {
  const [u] = await orm.select().from(t.users).where(sql`lower(${t.users.email}) = ${email.trim().toLowerCase()}`);
  return u;
}
export async function userById(id: string) {
  const [u] = await orm.select().from(t.users).where(eq(t.users.id, id));
  return u;
}

export async function isMember(userId: string, practiceId: string) {
  const [m] = await orm.select().from(t.memberships).where(and(eq(t.memberships.userId, userId), eq(t.memberships.practiceId, practiceId)));
  return !!m;
}

export async function listTeam(practiceId: string): Promise<TeamMember[]> {
  const rows = await orm
    .select({ u: t.users })
    .from(t.users)
    .innerJoin(t.memberships, eq(t.memberships.userId, t.users.id))
    .where(eq(t.memberships.practiceId, practiceId))
    .orderBy(asc(t.users.createdAt), asc(t.users.id));
  return rows.map((r) => toMember(r.u));
}

export async function teamMember(practiceId: string, userId: string) {
  const [r] = await orm
    .select({ u: t.users })
    .from(t.users)
    .innerJoin(t.memberships, eq(t.memberships.userId, t.users.id))
    .where(and(eq(t.memberships.practiceId, practiceId), eq(t.users.id, userId)));
  return r?.u;
}

export async function updateUser(id: string, patch: Partial<typeof t.users.$inferInsert>) {
  await orm.update(t.users).set(patch).where(eq(t.users.id, id));
}

export async function touchUser(id: string) {
  await orm.update(t.users).set({ lastActiveAt: new Date() }).where(eq(t.users.id, id));
}

/** Creates an invited user in this practice. */
export async function createInvitedUser(practiceId: string, u: { id: string; name: string; email: string; role: Role }) {
  await orm.transaction(async (tx) => {
    await tx.insert(t.users).values({ ...u, initials: initialsOf(u.name), status: 'Invited' });
    await tx.insert(t.memberships).values({ userId: u.id, practiceId });
  });
}

/** Removes the person from this practice; deletes the account if they belong to no other practice. */
export async function removeFromPractice(practiceId: string, userId: string) {
  await orm.transaction(async (tx) => {
    await tx.delete(t.memberships).where(and(eq(t.memberships.userId, userId), eq(t.memberships.practiceId, practiceId)));
    const [left] = await tx.select({ n: count() }).from(t.memberships).where(eq(t.memberships.userId, userId));
    if (!left?.n) await tx.delete(t.users).where(eq(t.users.id, userId));
    else await tx.delete(t.authSessions).where(eq(t.authSessions.userId, userId));
  });
}

export async function notificationsFor(userId: string): Promise<NotificationPrefs> {
  const u = await userById(userId);
  return u?.notifications ?? defaultNotifications();
}
export async function setNotifications(userId: string, prefs: NotificationPrefs) {
  await updateUser(userId, { notifications: prefs });
}

/* ─────────────────────────── Auth sessions & tokens ─────────────────────────── */

export async function createAuthSession(s: { id: string; userId: string; userAgent?: string | null; ip?: string | null }) {
  await orm.insert(t.authSessions).values(s);
}
export async function getAuthSession(id: string) {
  const [s] = await orm.select().from(t.authSessions).where(eq(t.authSessions.id, id));
  return s;
}
export async function touchAuthSession(id: string) {
  await orm.update(t.authSessions).set({ lastSeenAt: new Date() }).where(eq(t.authSessions.id, id));
}
export async function deleteAuthSession(id: string, userId?: string) {
  const where = userId ? and(eq(t.authSessions.id, id), eq(t.authSessions.userId, userId)) : eq(t.authSessions.id, id);
  const r = await orm.delete(t.authSessions).where(where).returning({ id: t.authSessions.id, userAgent: t.authSessions.userAgent });
  return r[0];
}
export async function deleteAllAuthSessions(userId: string) {
  await orm.delete(t.authSessions).where(eq(t.authSessions.userId, userId));
}
export async function deleteOtherAuthSessions(userId: string, keepId: string) {
  await orm.delete(t.authSessions).where(and(eq(t.authSessions.userId, userId), ne(t.authSessions.id, keepId)));
}

function describeAgent(ua: string | null): { device: string; kind: SessionInfo['kind'] } {
  const s = ua ?? '';
  const mobile = /iPhone|Android.+Mobile|Mobile Safari/i.test(s);
  const os = /iPhone/.test(s) ? 'iPhone' : /iPad/.test(s) ? 'iPad' : /Android/.test(s) ? 'Android' : /Windows/.test(s) ? 'Windows PC' : /Mac OS X/.test(s) ? 'Mac' : /Linux/.test(s) ? 'Linux' : 'Unknown device';
  const browser = /Edg\//.test(s) ? 'Edge' : /Firefox\//.test(s) ? 'Firefox' : /Chrome\//.test(s) ? 'Chrome' : /Safari\//.test(s) ? 'Safari' : 'Browser';
  return { device: `${os} · ${browser}`, kind: mobile ? 'mobile' : 'desktop' };
}

export async function sessionsFor(userId: string, currentId?: string): Promise<SessionInfo[]> {
  const rows = await orm.select().from(t.authSessions).where(eq(t.authSessions.userId, userId)).orderBy(desc(t.authSessions.lastSeenAt));
  return rows.map((r) => {
    const { device, kind } = describeAgent(r.userAgent);
    const current = r.id === currentId;
    const seen = current ? 'Active now' : activeLabel(r.lastSeenAt);
    return { id: r.id, device, kind, current, meta: [r.ip, seen].filter(Boolean).join(' · ') };
  });
}

export async function createAuthToken(v: typeof t.authTokens.$inferInsert) {
  await orm.insert(t.authTokens).values(v);
}
export async function takeAuthToken(tokenHash: string, kind: 'invite' | 'reset') {
  const [row] = await orm.delete(t.authTokens).where(and(eq(t.authTokens.tokenHash, tokenHash), eq(t.authTokens.kind, kind))).returning();
  return row && row.expiresAt > new Date() ? row : undefined;
}
export async function peekAuthToken(tokenHash: string, kind: 'invite' | 'reset') {
  const [row] = await orm.select().from(t.authTokens).where(and(eq(t.authTokens.tokenHash, tokenHash), eq(t.authTokens.kind, kind)));
  return row && row.expiresAt > new Date() ? row : undefined;
}
export async function deleteAuthTokens(userId: string, kind: 'invite' | 'reset') {
  await orm.delete(t.authTokens).where(and(eq(t.authTokens.userId, userId), eq(t.authTokens.kind, kind)));
}

/* ─────────────────────────── Calls ─────────────────────────── */

type CallRow = typeof t.calls.$inferSelect;
const toCall = ({ practiceId: _p, occurredAt: _o, ...r }: CallRow): Call => clean<Call>({ ...r, last4: last4(r.phone) });

export async function listCalls(practiceId: string): Promise<Call[]> {
  const rows = await orm.select().from(t.calls).where(eq(t.calls.practiceId, practiceId)).orderBy(desc(t.calls.occurredAt), desc(t.calls.id));
  return rows.map(toCall);
}
export async function findCall(practiceId: string, id: string): Promise<Call | undefined> {
  const [r] = await orm.select().from(t.calls).where(and(eq(t.calls.practiceId, practiceId), eq(t.calls.id, id)));
  return r && toCall(r);
}
export async function callsForPatient(practiceId: string, patientId: string): Promise<Call[]> {
  const rows = await orm.select().from(t.calls).where(and(eq(t.calls.practiceId, practiceId), eq(t.calls.patientId, patientId))).orderBy(desc(t.calls.occurredAt));
  return rows.map(toCall);
}
export async function updateCall(practiceId: string, id: string, patch: Partial<Pick<CallRow, 'outcome' | 'resolved' | 'note'>>) {
  await orm.update(t.calls).set(patch).where(and(eq(t.calls.practiceId, practiceId), eq(t.calls.id, id)));
}

/* ─────────────────────────── Appointments ─────────────────────────── */

type ApptRow = typeof t.appointments.$inferSelect;
const toAppt = ({ practiceId: _p, depositFailed, ...r }: ApptRow): Appointment => clean<Appointment>({ ...r, depositFailed: depositFailed || undefined });

export async function listAppointments(practiceId: string, patientId?: string): Promise<Appointment[]> {
  const where = patientId ? and(eq(t.appointments.practiceId, practiceId), eq(t.appointments.patientId, patientId)) : eq(t.appointments.practiceId, practiceId);
  const rows = await orm.select().from(t.appointments).where(where).orderBy(asc(t.appointments.day), asc(t.appointments.start), asc(t.appointments.provider));
  return rows.map(toAppt);
}
export async function findAppointment(practiceId: string, id: string) {
  const [r] = await orm.select().from(t.appointments).where(and(eq(t.appointments.practiceId, practiceId), eq(t.appointments.id, id)));
  return r && toAppt(r);
}
export async function updateAppointment(practiceId: string, id: string, patch: Partial<Pick<ApptRow, 'status' | 'depositFailed'>>) {
  await orm.update(t.appointments).set(patch).where(and(eq(t.appointments.practiceId, practiceId), eq(t.appointments.id, id)));
}

/* ─────────────────────────── Patients ─────────────────────────── */

type PatientRow = typeof t.patients.$inferSelect;
const toPatient = ({ practiceId: _p, createdAt: _c, ...r }: PatientRow): Patient => clean<Patient>({ ...r, last4: last4(r.phone) });

export async function listPatients(practiceId: string, q = ''): Promise<Patient[]> {
  const needle = q.trim();
  const where = needle
    ? and(eq(t.patients.practiceId, practiceId), sql`${t.patients.name} ilike ${'%' + needle.replace(/[\\%_]/g, (c) => '\\' + c) + '%'}`)
    : eq(t.patients.practiceId, practiceId);
  const rows = await orm.select().from(t.patients).where(where).orderBy(asc(t.patients.createdAt), asc(t.patients.name));
  return rows.map(toPatient);
}
export async function findPatient(practiceId: string, id: string): Promise<Patient | undefined> {
  const [r] = await orm.select().from(t.patients).where(and(eq(t.patients.practiceId, practiceId), eq(t.patients.id, id)));
  return r && toPatient(r);
}
/** Id → patient lookup for pages that render many rows. */
export async function patientMap(practiceId: string) {
  return new Map((await listPatients(practiceId)).map((p) => [p.id, p]));
}
export async function setConsent(practiceId: string, id: string, consent: Consent) {
  await orm.update(t.patients).set({ consent }).where(and(eq(t.patients.practiceId, practiceId), eq(t.patients.id, id)));
}

/* ─────────────────────────── Recall ─────────────────────────── */

type RuleRow = typeof t.recallRules.$inferSelect;
const toRule = ({ practiceId: _p, position: _o, ...r }: RuleRow): RecallRule => clean<RecallRule>(r);
type QueueRow = typeof t.recallQueue.$inferSelect;
const toQueue = ({ practiceId: _p, id: _i, ...r }: QueueRow): RecallItem => r;

export async function listRecallRules(practiceId: string): Promise<RecallRule[]> {
  const rows = await orm.select().from(t.recallRules).where(eq(t.recallRules.practiceId, practiceId)).orderBy(asc(t.recallRules.position), asc(t.recallRules.id));
  return rows.map(toRule);
}
export async function findRecallRule(practiceId: string, id: string) {
  const [r] = await orm.select().from(t.recallRules).where(and(eq(t.recallRules.practiceId, practiceId), eq(t.recallRules.id, id)));
  return r && toRule(r);
}
export async function createRecallRule(practiceId: string, rule: RecallRule) {
  const [{ n }] = await orm.select({ n: count() }).from(t.recallRules).where(eq(t.recallRules.practiceId, practiceId));
  await orm.insert(t.recallRules).values({ ...rule, practiceId, position: n });
}
export async function updateRecallRule(practiceId: string, id: string, patch: Partial<Pick<RuleRow, 'active' | 'delay' | 'name'>>) {
  const [r] = await orm.update(t.recallRules).set(patch).where(and(eq(t.recallRules.practiceId, practiceId), eq(t.recallRules.id, id))).returning();
  return r && toRule(r);
}

export async function listRecallQueue(practiceId: string, patientId?: string): Promise<RecallItem[]> {
  const where = patientId ? and(eq(t.recallQueue.practiceId, practiceId), eq(t.recallQueue.patientId, patientId)) : eq(t.recallQueue.practiceId, practiceId);
  const rows = await orm.select().from(t.recallQueue).where(where).orderBy(asc(t.recallQueue.id));
  return rows.map(toQueue);
}
export async function dueRecallRows(practiceId: string) {
  return orm.select().from(t.recallQueue).where(and(eq(t.recallQueue.practiceId, practiceId), eq(t.recallQueue.status, 'Due'))).orderBy(asc(t.recallQueue.id));
}
export async function updateRecallRows(practiceId: string, ids: number[], patch: Partial<Pick<QueueRow, 'status' | 'channel' | 'lastContact' | 'next'>>) {
  if (!ids.length) return;
  await orm.update(t.recallQueue).set(patch).where(and(eq(t.recallQueue.practiceId, practiceId), inArray(t.recallQueue.id, ids)));
}
export async function recallHistory(practiceId: string, patientId: string): Promise<RecallHistoryEntry[]> {
  return orm
    .select({ date: t.recallHistory.date, channel: t.recallHistory.channel, text: t.recallHistory.text })
    .from(t.recallHistory)
    .where(and(eq(t.recallHistory.practiceId, practiceId), eq(t.recallHistory.patientId, patientId)))
    .orderBy(asc(t.recallHistory.id));
}
export async function addRecallHistory(practiceId: string, rows: { patientId: string; date: string; channel: RecallHistoryEntry['channel']; text: string }[]) {
  if (rows.length) await orm.insert(t.recallHistory).values(rows.map((r) => ({ ...r, practiceId })));
}

/* ─────────────────────────── Deposits ─────────────────────────── */

type DepositRow = typeof t.deposits.$inferSelect;
const toDeposit = ({ practiceId: _p, createdAt: _c, ...r }: DepositRow): Deposit => clean<Deposit>(r);

export async function listDeposits(practiceId: string): Promise<Deposit[]> {
  const rows = await orm.select().from(t.deposits).where(eq(t.deposits.practiceId, practiceId)).orderBy(desc(t.deposits.createdAt), desc(t.deposits.id));
  return rows.map(toDeposit);
}
export async function findDeposit(practiceId: string, id: string) {
  const [r] = await orm.select().from(t.deposits).where(and(eq(t.deposits.practiceId, practiceId), eq(t.deposits.id, id)));
  return r && toDeposit(r);
}
export async function createDeposit(practiceId: string, d: Deposit) {
  await orm.insert(t.deposits).values({ ...d, practiceId });
}
export async function updateDeposit(practiceId: string, id: string, patch: Partial<Pick<DepositRow, 'status' | 'note'>>) {
  const [r] = await orm.update(t.deposits).set(patch).where(and(eq(t.deposits.practiceId, practiceId), eq(t.deposits.id, id))).returning();
  return r && toDeposit(r);
}
export async function depositCandidates(practiceId: string) {
  return orm
    .select({ patientId: t.depositCandidates.patientId, label: t.depositCandidates.label })
    .from(t.depositCandidates)
    .where(eq(t.depositCandidates.practiceId, practiceId));
}

/* ─────────────────────────── Audit ─────────────────────────── */

export async function audit(practiceId: string | null, userId: string, action: string, target: string) {
  await orm.insert(t.auditLog).values({ practiceId, userId, action, target });
}
export async function auditCount(practiceId: string) {
  const [r] = await orm.select({ n: count() }).from(t.auditLog).where(eq(t.auditLog.practiceId, practiceId));
  return r?.n ?? 0;
}
export async function recentAudit(practiceId: string, limit = 50): Promise<AuditEntry[]> {
  const rows = await orm.select().from(t.auditLog).where(eq(t.auditLog.practiceId, practiceId)).orderBy(desc(t.auditLog.at)).limit(limit);
  return rows.map((r) => ({ at: r.at.toISOString(), userId: r.userId, action: r.action, target: r.target }));
}
