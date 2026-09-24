import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { db, audit } from '@/lib/db';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ settings: db.receptionist });
}

const Settings = z.object({
  greeting: z.string().min(10).max(600),
  afterGreeting: z.string().min(10).max(600),
  voice: z.string(),
  pace: z.enum(['Slower', 'Normal', 'Faster']),
  spanish: z.boolean(),
  afterMode: z.enum(['book', 'message', 'emergency']),
  transferTimeout: z.number().int().min(10).max(90),
  hours: z.array(z.object({ day: z.string(), open: z.boolean(), from: z.string(), to: z.string() })).length(7),
  services: z.array(z.object({ name: z.string(), duration: z.number(), provider: z.string(), deposit: z.number().nullable(), newPatients: z.boolean(), aiMayBook: z.boolean(), note: z.string().optional() })),
  guardrails: z.array(z.object({ text: z.string().min(3).max(200), locked: z.boolean(), on: z.boolean() })),
  escalation: z.array(z.object({ name: z.string(), description: z.string(), during: z.string(), after: z.string() })),
});

export async function PUT(req: Request) {
  const g = await guard('editReceptionist');
  if (g.error) return g.error;
  const parsed = Settings.safeParse(await readJson(req));
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? 'Invalid settings');
  // Locked guardrails can't be switched off.
  const locked = db.receptionist.guardrails.filter((x) => x.locked).map((x) => x.text);
  parsed.data.guardrails.forEach((x) => {
    if (locked.includes(x.text)) { x.locked = true; x.on = true; }
  });
  db.receptionist = parsed.data;
  audit(g.user.id, 'update-receptionist', 'settings');
  return NextResponse.json({ settings: db.receptionist, message: 'Saved. OmniDesk uses these settings from the next call.' });
}
