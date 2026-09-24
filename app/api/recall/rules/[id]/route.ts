import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { db } from '@/lib/db';

const Body = z.object({ active: z.boolean().optional(), delay: z.number().int().min(1).max(36).optional(), name: z.string().min(1).max(60).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('editReceptionist');
  if (g.error) return g.error;
  const { id } = await params;
  const rule = db.recallRules.find((r) => r.id === id);
  if (!rule) return notFound('Rule not found');
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid rule change');
  Object.assign(rule, parsed.data);
  return NextResponse.json({ rule });
}
