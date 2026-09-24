import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { findPatient, audit } from '@/lib/db';

const Body = z.object({ channel: z.enum(['call', 'text', 'email']), value: z.boolean() });

/** Consent changes are logged with who made them. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('workRecall');
  if (g.error) return g.error;
  const p = findPatient((await params).id);
  if (!p) return notFound('Patient not found');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid consent change');
  p.consent[parsed.data.channel] = parsed.data.value;
  audit(g.user.id, `consent-${parsed.data.value ? 'recorded' : 'removed'}`, `${p.id}:${parsed.data.channel}`);
  return NextResponse.json({ consent: p.consent });
}
