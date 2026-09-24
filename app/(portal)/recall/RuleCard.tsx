'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/Switch';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/client';
import { CHANNEL_LABEL } from '@/lib/tones';
import type { RecallRule } from '@/lib/types';

export function RuleCard({ rule, editable }: { rule: RecallRule; editable: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [active, setActive] = useState(rule.active);
  const [delay, setDelay] = useState(rule.delay);

  async function save(patch: Partial<Pick<RecallRule, 'active' | 'delay'>>) {
    const r = await api(`/api/recall/rules/${rule.id}`, 'PATCH', patch);
    if (!r.ok) return toast(r.error);
    router.refresh();
  }

  return (
    <article className={`cf-card flex flex-col gap-3.5 p-[18px] ${active ? '' : 'opacity-75'}`}>
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className="text-base font-semibold">{rule.name}</h2>
          <p className="text-[13px] text-muted">{delay} {rule.unit} after {rule.trigger}</p>
        </div>
        <span className="pt-[5px] font-mono text-[10px] tracking-[0.08em] text-muted">{active ? 'ACTIVE' : 'PAUSED'}</span>
        <Switch checked={active} disabled={!editable} label={`${rule.name} active`} onChange={(v) => { setActive(v); save({ active: v }); }} />
      </div>
      <ol className="flex flex-wrap items-center gap-1.5" aria-label="Contact sequence">
        {rule.steps.map((s, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="arrowRight" size={12} strokeWidth={2} className="text-muted" />}
            <span className="flex items-center gap-1.5 rounded-md bg-surface2 px-2 py-1 text-[13px]">
              <span className="font-mono text-[10px] text-muted">DAY {s.day}</span>
              <Icon name={s.channel} size={13} strokeWidth={1.8} />{CHANNEL_LABEL[s.channel]}
            </span>
          </li>
        ))}
      </ol>
      {rule.script && <p className="rounded-lg border bg-ground px-3 py-2.5 text-[13px]">{rule.script}</p>}
      <div className="flex flex-wrap items-center gap-2.5 border-t pt-3">
        <label className="flex items-center gap-2 text-[13px] text-muted">
          <span className="cf-label">Delay</span>
          <input
            type="number"
            min={1}
            max={36}
            value={delay}
            disabled={!editable}
            onChange={(e) => setDelay(Math.max(1, parseInt(e.target.value || '1', 10)))}
            onBlur={() => delay !== rule.delay && save({ delay })}
            className="cf-input h-[34px] w-[72px] font-mono"
          />
          <span>{rule.unit} after {rule.trigger}</span>
        </label>
        <span className="ml-auto font-mono text-[11px] text-muted">{rule.queue} IN QUEUE</span>
      </div>
    </article>
  );
}
