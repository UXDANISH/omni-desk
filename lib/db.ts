import type {
  Appointment, AuditEntry, Call, Deposit, NotificationPrefs, Patient, PlanName, ReceptionistSettings,
  RecallItem, RecallRule, SessionInfo, TeamMember,
} from './types';
import { CALLS } from './mock/calls';
import { APPOINTMENTS } from './mock/appointments';
import { PATIENTS } from './mock/patients';
import { RECALL_QUEUE, RECALL_RULES } from './mock/recall';
import { DEPOSITS } from './mock/deposits';
import { TEAM, defaultNotifications, defaultSessions } from './mock/team';
import { RECEPTIONIST_DEFAULTS } from './mock/receptionist';

/**
 * In-memory data store. Swap this module for a real database (Postgres + Prisma/Drizzle)
 * when wiring the backend — every page and API route reads through `db`.
 * State resets when the server restarts.
 */
export interface Store {
  calls: Call[];
  appointments: Appointment[];
  patients: Patient[];
  recallQueue: RecallItem[];
  recallRules: RecallRule[];
  deposits: Deposit[];
  team: TeamMember[];
  receptionist: ReceptionistSettings;
  notifications: Record<string, NotificationPrefs>;
  sessions: Record<string, SessionInfo[]>;
  plan: PlanName;
  audit: AuditEntry[];
}

function seed(): Store {
  return structuredClone({
    calls: CALLS,
    appointments: APPOINTMENTS,
    patients: PATIENTS,
    recallQueue: RECALL_QUEUE,
    recallRules: RECALL_RULES,
    deposits: DEPOSITS,
    team: TEAM,
    receptionist: RECEPTIONIST_DEFAULTS,
    notifications: {},
    sessions: {},
    plan: 'Growth' as PlanName,
    audit: [],
  });
}

const g = globalThis as unknown as { __omnidesk?: Store };
export const db: Store = g.__omnidesk ?? (g.__omnidesk = seed());

export const findPatient = (id?: string) => db.patients.find((p) => p.id === id);
export const findCall = (id: string) => db.calls.find((c) => c.id === id);
export const findMember = (id?: string) => db.team.find((t) => t.id === id);

export function notificationsFor(userId: string) {
  return (db.notifications[userId] ??= defaultNotifications());
}
export function sessionsFor(userId: string) {
  return (db.sessions[userId] ??= defaultSessions());
}
export function audit(userId: string, action: string, target: string) {
  db.audit.unshift({ at: new Date().toISOString(), userId, action, target });
}
