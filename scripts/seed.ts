/**
 * Loads the sample practice (Smile Dental, Austin + Round Rock) into Postgres.
 *   npm run db:seed            # only into an empty database
 *   npm run db:seed -- --reset # wipes every table first (never on production data)
 * Sign-in: every sample account uses SEED_PASSWORD (default below) and switch-user PIN SEED_PIN.
 */
import { config } from 'dotenv';

config({ path: ['.env.local', '.env'] });

const PASSWORD = process.env.SEED_PASSWORD || 'omnidesk-demo-2026';
const PIN = process.env.SEED_PIN || '1234';
const RESET = process.argv.includes('--reset');

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const ACTIVE_AGO: Record<string, number | null> = {
  'Active now': 0, '12 min ago': 12, '3 min ago': 3, Yesterday: 60 * 26, Mon: 60 * 24 * 3, '—': null,
};

async function main() {
  const { sql } = await import('drizzle-orm');
  const bcrypt = (await import('bcryptjs')).default;
  const { orm, pool } = await import('../lib/db/client');
  const t = await import('../lib/db/schema');
  const { PRACTICES, TEAM } = await import('../lib/mock/team');
  const { PATIENTS } = await import('../lib/mock/patients');
  const { CALLS } = await import('../lib/mock/calls');
  const { APPOINTMENTS } = await import('../lib/mock/appointments');
  const { RECALL_RULES, RECALL_QUEUE, RECALL_HISTORY } = await import('../lib/mock/recall');
  const { DEPOSITS, DEPOSIT_CANDIDATES } = await import('../lib/mock/deposits');
  const { RECEPTIONIST_DEFAULTS } = await import('../lib/mock/receptionist');

  const [{ n }] = (await orm.execute(sql`select count(*)::int as n from ${t.users}`)).rows as { n: number }[];
  if (n > 0 && !RESET) {
    console.error(`Database already has ${n} users. Refusing to seed. Re-run with --reset to wipe it (development only).`);
    process.exit(1);
  }
  if (RESET && process.env.NODE_ENV === 'production') {
    console.error('Refusing to --reset with NODE_ENV=production.');
    process.exit(1);
  }

  const [passwordHash, pinHash] = await Promise.all([bcrypt.hash(PASSWORD, 12), bcrypt.hash(PIN, 12)]);
  const [main, second] = PRACTICES;

  await orm.transaction(async (tx) => {
    if (RESET) {
      await tx.execute(sql`truncate ${t.auditLog}, ${t.depositCandidates}, ${t.deposits}, ${t.recallHistory}, ${t.recallQueue}, ${t.recallRules},
        ${t.appointments}, ${t.calls}, ${t.patients}, ${t.authTokens}, ${t.authSessions}, ${t.memberships}, ${t.users}, ${t.practices} restart identity cascade`);
    }

    await tx.insert(t.practices).values([
      { id: main.id, name: main.name, location: main.location, plan: 'Growth', receptionist: RECEPTIONIST_DEFAULTS },
      {
        id: second.id, name: second.name, location: second.location, plan: 'Growth',
        receptionist: {
          ...RECEPTIONIST_DEFAULTS,
          greeting: RECEPTIONIST_DEFAULTS.greeting.replace('Austin', 'Round Rock'),
          afterGreeting: RECEPTIONIST_DEFAULTS.afterGreeting.replace('Austin', 'Round Rock'),
        },
        createdAt: new Date(Date.now() + 1000),
      },
    ]);

    await tx.insert(t.users).values(
      TEAM.map((m, i) => {
        const ago = ACTIVE_AGO[m.lastActive] ?? null;
        const active = m.status === 'Active';
        return {
          id: m.id, name: m.name, initials: m.initials, email: m.email, phone: `(512) 555-${m.last4}`, role: m.role, status: m.status,
          passwordHash: active ? passwordHash : null, pinHash: active ? pinHash : null,
          lastActiveAt: ago === null ? null : minutesAgo(ago), createdAt: new Date(Date.now() + i * 1000),
        };
      }),
    );
    await tx.insert(t.memberships).values([
      ...TEAM.map((m) => ({ userId: m.id, practiceId: main.id })),
      ...TEAM.filter((m) => m.role === 'Owner').map((m) => ({ userId: m.id, practiceId: second.id })),
    ]);

    await tx.insert(t.patients).values(PATIENTS.map(({ last4: _l, ...p }, i) => ({ ...p, practiceId: main.id, createdAt: new Date(Date.now() + i * 1000) })));
    await tx.insert(t.calls).values(CALLS.map(({ last4: _l, ...c }, i) => ({ ...c, practiceId: main.id, occurredAt: minutesAgo(i * 10) })));
    await tx.insert(t.appointments).values(APPOINTMENTS.map((a) => ({ ...a, practiceId: main.id })));

    await tx.insert(t.recallRules).values([
      ...RECALL_RULES.map((r, i) => ({ ...r, practiceId: main.id, position: i })),
      ...RECALL_RULES.map((r, i) => ({ ...r, id: `${r.id}-${second.id}`, practiceId: second.id, position: i, queue: 0 })),
    ]);
    await tx.insert(t.recallQueue).values(RECALL_QUEUE.map((r) => ({ ...r, practiceId: main.id })));
    await tx.insert(t.recallHistory).values(
      Object.entries(RECALL_HISTORY).flatMap(([patientId, rows]) => rows.map((h) => ({ ...h, patientId, practiceId: main.id }))),
    );

    await tx.insert(t.deposits).values(DEPOSITS.map((d, i) => ({ ...d, practiceId: main.id, createdAt: minutesAgo(i * 30) })));
    await tx.insert(t.depositCandidates).values(DEPOSIT_CANDIDATES.map((c) => ({ ...c, practiceId: main.id })));
  });

  console.log(`Seeded ${PRACTICES.length} practices, ${TEAM.length} team members, ${PATIENTS.length} patients, ${CALLS.length} calls, ${APPOINTMENTS.length} appointments.`);
  console.log(`Sign in with any active sample email (e.g. ${TEAM[0].email}) and password "${PASSWORD}". Switch-user PIN: ${PIN}.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
