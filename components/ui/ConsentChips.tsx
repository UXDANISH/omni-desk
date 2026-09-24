import clsx from 'clsx';
import type { Consent } from '@/lib/types';

export function ConsentChips({ consent }: { consent: Consent }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(['call', 'text', 'email'] as const).map((k) => (
        <span
          key={k}
          aria-label={`${k}: ${consent[k] ? 'consented' : 'no consent'}`}
          title={`${k}: ${consent[k] ? 'consented' : 'no consent'}`}
          className={clsx('rounded-[3px] border px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.06em]', consent[k] ? 'border-ok bg-ok-bg text-ok' : 'text-muted line-through')}
        >
          {k}
        </span>
      ))}
    </span>
  );
}
