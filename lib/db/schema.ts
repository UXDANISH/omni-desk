import { sql } from 'drizzle-orm';
import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import type {
  AppointmentStatus, Channel, Consent, DepositStatus, NotificationPrefs, Outcome, PlanName, ReceptionistSettings,
  RecallRule, RecallStatus, Role, TranscriptLine,
} from '../types';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const practiceRef = () => text('practice_id').notNull().references(() => practices.id, { onDelete: 'cascade' });

/** A practice location. Every patient-facing row below belongs to exactly one practice. */
export const practices = pgTable('practices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  plan: text('plan').$type<PlanName>().notNull().default('Growth'),
  receptionist: jsonb('receptionist').$type<ReceptionistSettings>().notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    initials: text('initials').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    role: text('role').$type<Role>().notNull(),
    status: text('status').$type<'Active' | 'Invited'>().notNull().default('Invited'),
    passwordHash: text('password_hash'),
    pinHash: text('pin_hash'),
    pinFailures: integer('pin_failures').notNull().default(0),
    pinLockedUntil: ts('pin_locked_until'),
    startPage: text('start_page'),
    twoStep: boolean('two_step').notNull().default(false),
    notifications: jsonb('notifications').$type<NotificationPrefs>(),
    lastActiveAt: ts('last_active_at'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_lower_idx').on(sql`lower(${t.email})`)],
);

/** Which practices a user can open. */
export const memberships = pgTable(
  'memberships',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    practiceId: practiceRef(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.practiceId] })],
);

/** One row per signed-in device. The Auth.js JWT carries the row id; deleting the row signs that device out. */
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    userAgent: text('user_agent'),
    ip: text('ip'),
    createdAt: ts('created_at').notNull().defaultNow(),
    lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
  },
  (t) => [index('auth_sessions_user_idx').on(t.userId)],
);

/** Invite and password-reset links. Only a SHA-256 of the token is stored. */
export const authTokens = pgTable('auth_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').$type<'invite' | 'reset'>().notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const patients = pgTable(
  'patients',
  {
    id: text('id').primaryKey(),
    practiceId: practiceRef(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    since: text('since').notNull(),
    lastVisit: text('last_visit').notNull(),
    consent: jsonb('consent').$type<Consent>().notNull(),
    preferred: text('preferred').notNull(),
    optedOutNote: text('opted_out_note'),
    createdAt: ts('created_at').notNull().defaultNow(),
  },
  (t) => [index('patients_practice_idx').on(t.practiceId)],
);

export const calls = pgTable(
  'calls',
  {
    id: text('id').primaryKey(),
    practiceId: practiceRef(),
    /** Sort key. Display fields (`day`, `time`) are stored as shown until telephony writes real events. */
    occurredAt: ts('occurred_at').notNull().defaultNow(),
    time: text('time').notNull(),
    day: text('day').notNull(),
    caller: text('caller').notNull(),
    patientId: text('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    phone: text('phone').notNull(),
    reason: text('reason').notNull(),
    outcome: text('outcome').$type<Outcome>().notNull(),
    duration: text('duration').notNull(),
    afterHours: boolean('after_hours').notNull().default(false),
    direction: text('direction').notNull(),
    tag: text('tag').$type<'EMERGENCY' | 'INSURANCE' | 'ESCALATION' | 'DEPOSIT FAILED'>(),
    note: text('note'),
    attention: boolean('attention').notNull().default(false),
    resolved: boolean('resolved').notNull().default(false),
    summary: text('summary').notNull(),
    next: text('next').notNull(),
    facts: jsonb('facts').$type<[string, string][]>().notNull(),
    transcript: jsonb('transcript').$type<TranscriptLine[]>().notNull(),
  },
  (t) => [index('calls_practice_time_idx').on(t.practiceId, t.occurredAt)],
);

export const appointments = pgTable(
  'appointments',
  {
    id: text('id').primaryKey(),
    practiceId: practiceRef(),
    day: integer('day').notNull(),
    provider: integer('provider').notNull(),
    start: integer('start').notNull(),
    duration: integer('duration').notNull(),
    service: text('service').notNull(),
    patient: text('patient').notNull(),
    patientId: text('patient_id').references(() => patients.id, { onDelete: 'set null' }),
    bookedBy: text('booked_by').$type<'ai' | 'staff'>().notNull(),
    staffName: text('staff_name'),
    callId: text('call_id'),
    depositFailed: boolean('deposit_failed').notNull().default(false),
    status: text('status').$type<AppointmentStatus>().notNull(),
  },
  (t) => [index('appointments_practice_day_idx').on(t.practiceId, t.day, t.start)],
);

export const recallRules = pgTable('recall_rules', {
  id: text('id').primaryKey(),
  practiceId: practiceRef(),
  position: integer('position').notNull().default(0),
  name: text('name').notNull(),
  trigger: text('trigger').notNull(),
  delay: integer('delay').notNull(),
  unit: text('unit').$type<'days' | 'months'>().notNull(),
  steps: jsonb('steps').$type<RecallRule['steps']>().notNull(),
  active: boolean('active').notNull().default(false),
  queue: integer('queue').notNull().default(0),
  script: text('script'),
});

export const recallQueue = pgTable(
  'recall_queue',
  {
    id: serial('id').primaryKey(),
    practiceId: practiceRef(),
    patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    ruleId: text('rule_id').notNull().references(() => recallRules.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    due: text('due').notNull(),
    status: text('status').$type<RecallStatus>().notNull(),
    channel: text('channel').$type<Channel>(),
    lastContact: text('last_contact').notNull(),
    next: text('next').notNull(),
  },
  (t) => [index('recall_queue_practice_idx').on(t.practiceId)],
);

export const recallHistory = pgTable(
  'recall_history',
  {
    id: serial('id').primaryKey(),
    practiceId: practiceRef(),
    patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    channel: text('channel').$type<Channel>().notNull(),
    text: text('text').notNull(),
  },
  (t) => [index('recall_history_patient_idx').on(t.patientId)],
);

export const deposits = pgTable(
  'deposits',
  {
    id: text('id').primaryKey(),
    practiceId: practiceRef(),
    createdAt: ts('created_at').notNull().defaultNow(),
    sent: text('sent').notNull(),
    patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    forAppointment: text('for_appointment').notNull(),
    amount: integer('amount').notNull(),
    status: text('status').$type<DepositStatus>().notNull(),
    note: text('note'),
  },
  (t) => [index('deposits_practice_idx').on(t.practiceId, t.createdAt)],
);

/** Appointments that still need a deposit link (the "Send payment link" picker). */
export const depositCandidates = pgTable(
  'deposit_candidates',
  {
    practiceId: practiceRef(),
    patientId: text('patient_id').notNull().references(() => patients.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
  },
  (t) => [primaryKey({ columns: [t.practiceId, t.patientId] })],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: serial('id').primaryKey(),
    practiceId: text('practice_id').references(() => practices.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    action: text('action').notNull(),
    target: text('target').notNull(),
    at: ts('at').notNull().defaultNow(),
  },
  (t) => [index('audit_log_practice_idx').on(t.practiceId, t.at)],
);
