import { NextResponse } from 'next/server';
import { guard, notFound, readJson } from '@/lib/api';
import { audit, findCall, updateCall } from '@/lib/db';

/**
 * "Call back" for finished calls, "Take over" for live ones, or "Text patient" (mode: 'text')
 * for items like a failed deposit. Resolves the item from Needs attention.
 * Placing the actual call / text is wired in with the telephony and SMS providers.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = await guard('callBack');
  if (g.error) return g.error;
  const call = await findCall(g.practiceId, (await params).id);
  if (!call) return notFound('Call not found');
  const body = await readJson<{ mode?: 'call' | 'text' }>(req);

  const tookOver = call.outcome === 'Live';
  await updateCall(g.practiceId, call.id, {
    resolved: true,
    ...(call.outcome === 'Needs human' || tookOver ? { outcome: 'Resolved' as const } : {}),
  });
  await audit(g.practiceId, g.user.id, body?.mode === 'text' ? 'text-patient' : tookOver ? 'take-over' : 'call-back', call.id);

  const message =
    body?.mode === 'text'
      ? `New payment link texted to ${call.caller}.`
      : tookOver
        ? `You're on the line with ${call.caller}. OmniDesk has stepped back.`
        : `Calling ${call.caller} at ***-***-${call.last4} from Front desk line 1…`;
  return NextResponse.json({ ok: true, message });
}
