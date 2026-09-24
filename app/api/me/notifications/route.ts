import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, readJson } from '@/lib/api';
import { notificationsFor, setNotifications } from '@/lib/db';

export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  return NextResponse.json({ prefs: await notificationsFor(g.user.id) });
}

const Triple = z.tuple([z.boolean(), z.boolean(), z.boolean()]);
const Body = z.object({
  events: z.object({ needs: Triple, emerg: Triple, depfail: Triple, optout: Triple, summary: Triple, weekly: Triple, team: Triple }),
  summaryAt: z.enum(['6:30 AM', '7:30 AM', '12:30 PM', '6:00 PM']),
  quietHours: z.boolean(),
});

export async function PUT(req: Request) {
  const g = await guard();
  if (g.error) return g.error;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid notification settings');
  await setNotifications(g.user.id, parsed.data);
  return NextResponse.json({ ok: true, message: `Notification settings saved for ${g.user.name}.` });
}
