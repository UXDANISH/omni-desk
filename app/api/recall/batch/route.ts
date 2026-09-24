import { NextResponse } from 'next/server';
import { guard } from '@/lib/api';
import { addRecallHistory, audit, dueRecallRows, listRecallRules, patientMap, updateRecallRows } from '@/lib/db';
import { CHANNEL_LABEL } from '@/lib/tones';
import type { Channel } from '@/lib/types';

/**
 * Contact every "Due" patient on the first campaign step they have consented to.
 * Sending the actual text / call / email is wired in with the SMS and telephony providers.
 */
export async function POST() {
  const g = await guard('workRecall');
  if (g.error) return g.error;
  const [due, rules, patients] = await Promise.all([dueRecallRows(g.practiceId), listRecallRules(g.practiceId), patientMap(g.practiceId)]);
  const byChannel = new Map<Channel, number[]>();
  const history: { patientId: string; date: string; channel: Channel; text: string }[] = [];
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  for (const r of due) {
    const p = patients.get(r.patientId);
    const rule = rules.find((x) => x.id === r.ruleId);
    const channel = rule?.steps.map((s) => s.channel).find((ch) => p?.consent[ch]);
    if (!channel) continue;
    byChannel.set(channel, [...(byChannel.get(channel) ?? []), r.id]);
    history.push({ patientId: r.patientId, date: today, channel, text: `${rule!.name} ${CHANNEL_LABEL[channel].toLowerCase()} sent` });
  }
  for (const [channel, ids] of byChannel) {
    await updateRecallRows(g.practiceId, ids, { status: 'Contacted', channel, lastContact: 'Just now', next: 'Waiting for reply' });
  }
  await addRecallHistory(g.practiceId, history);
  const contacted = history.length;
  await audit(g.practiceId, g.user.id, 'recall-batch', `${contacted} patients`);
  return NextResponse.json({ ok: true, contacted, message: `${contacted} patients contacted on the channels they consented to.` });
}
