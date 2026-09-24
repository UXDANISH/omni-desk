export type Role = 'Owner' | 'Manager' | 'Front desk';
export const ROLES: Role[] = ['Owner', 'Manager', 'Front desk'];

export type Outcome = 'Live' | 'Needs human' | 'Booked' | 'Transferred' | 'Answered' | 'Hang-up' | 'Resolved';
export type Channel = 'call' | 'text' | 'email';

export interface TranscriptLine {
  who: 'ai' | 'caller';
  text: string;
}

export interface Call {
  id: string;
  time: string;
  day: string;
  caller: string;
  patientId?: string;
  last4: string;
  phone: string;
  reason: string;
  outcome: Outcome;
  duration: string;
  afterHours?: boolean;
  direction: string;
  tag?: 'EMERGENCY' | 'INSURANCE' | 'ESCALATION' | 'DEPOSIT FAILED';
  note?: string;
  attention?: boolean;
  resolved?: boolean;
  summary: string;
  next: string;
  facts: [string, string][];
  transcript: TranscriptLine[];
}

export interface Provider {
  name: string;
  role: string;
}

export type AppointmentStatus = 'Confirmed' | 'Unconfirmed' | 'Completed';
export interface Appointment {
  id: string;
  day: number; // index into WEEK
  provider: number; // index into PROVIDERS
  start: number; // minutes from midnight
  duration: number;
  service: string;
  patient: string;
  patientId?: string;
  bookedBy: 'ai' | 'staff';
  staffName?: string;
  callId?: string;
  depositFailed?: boolean;
  status: AppointmentStatus;
}

export interface Consent {
  call: boolean;
  text: boolean;
  email: boolean;
}

export interface Patient {
  id: string;
  name: string;
  last4: string;
  phone: string;
  email: string;
  since: string;
  lastVisit: string;
  consent: Consent;
  preferred: string;
  optedOutNote?: string;
}

export type RecallStatus = 'Due' | 'Contacted' | 'Rebooked' | 'No response' | 'Opted out';
export interface RecallItem {
  patientId: string;
  ruleId: string;
  reason: string;
  due: string;
  status: RecallStatus;
  channel: Channel | null;
  lastContact: string;
  next: string;
}

export interface RecallRule {
  id: string;
  name: string;
  trigger: string;
  delay: number;
  unit: 'days' | 'months';
  steps: { channel: Channel; day: number }[];
  active: boolean;
  queue: number;
  script?: string;
}

export interface RecallHistoryEntry {
  date: string;
  channel: Channel;
  text: string;
}

export type DepositStatus = 'Paid' | 'Pending' | 'Failed' | 'Refunded';
export interface Deposit {
  id: string;
  sent: string;
  patientId: string;
  forAppointment: string;
  amount: number;
  status: DepositStatus;
  note?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: Role;
  lastActive: string;
  status: 'Active' | 'Invited';
  last4: string;
  startPage?: string;
  twoStep?: boolean;
}

export interface SessionInfo {
  id: string;
  device: string;
  meta: string;
  kind: 'desktop' | 'mobile';
  current: boolean;
}

export type NotificationKey = 'needs' | 'emerg' | 'depfail' | 'optout' | 'summary' | 'weekly' | 'team';
export interface NotificationPrefs {
  events: Record<NotificationKey, [boolean, boolean, boolean]>; // in app, email, text
  summaryAt: string;
  quietHours: boolean;
}

export interface ServiceRule {
  name: string;
  duration: number;
  provider: string;
  deposit: number | null;
  newPatients: boolean;
  aiMayBook: boolean;
  note?: string;
}

export interface Guardrail {
  text: string;
  locked: boolean;
  on: boolean;
}

export interface EscalationRule {
  name: string;
  description: string;
  during: string;
  after: string;
}

export interface ReceptionistSettings {
  greeting: string;
  afterGreeting: string;
  voice: string;
  pace: 'Slower' | 'Normal' | 'Faster';
  spanish: boolean;
  afterMode: 'book' | 'message' | 'emergency';
  transferTimeout: number;
  hours: { day: string; open: boolean; from: string; to: string }[];
  services: ServiceRule[];
  guardrails: Guardrail[];
  escalation: EscalationRule[];
}

export type PlanName = 'Starter' | 'Growth' | 'Practice';

export interface Practice {
  id: string;
  name: string;
  location: string;
}

export interface AuditEntry {
  at: string;
  userId: string;
  action: string;
  target: string;
}

/** Next 15 page props */
export type SearchParams = Promise<Record<string, string | string[] | undefined>>;
export type PageProps = { searchParams: SearchParams };
export type IdPageProps = { params: Promise<{ id: string }>; searchParams: SearchParams };
