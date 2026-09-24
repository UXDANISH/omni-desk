import { NextResponse } from 'next/server';
import { z } from 'zod';
import { guard, bad, notFound, readJson } from '@/lib/api';
import { audit, updateRecallRule } from '@/lib/db';

const Body = z.object({ active: z.boolean().optional(), delay: z.number().int().min(1).max(36).optional(), name: z.string().min(1).max(60).optional() });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('editReceptionist');
  if (g.error) return g.error;
  const { id } = await params;
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) return bad('Invalid rule change');
  const rule = await updateRecallRule(g.practiceId, id, parsed.data);
  if (!rule) return notFound('Rule not found');
  await audit(g.practiceId, g.user.id, 'update-recall-rule', id);
  return NextResponse.json({ rule });
}
