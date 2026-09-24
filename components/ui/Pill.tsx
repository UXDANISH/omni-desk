import clsx from 'clsx';
import type { Tone } from '@/lib/tones';

const TONES: Record<Tone, string> = {
  accent: 'bg-accent-bg text-accent-tx',
  ok: 'bg-ok-bg text-ok',
  warn: 'bg-warn-bg text-warn',
  danger: 'bg-danger-bg text-danger',
  neutral: 'bg-surface2 text-ink',
  muted: 'bg-surface2 text-muted',
};

export function Pill({ tone, children, pulse, size = 'sm' }: { tone: Tone; children: React.ReactNode; pulse?: boolean; size?: 'sm' | 'md' }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium', TONES[tone], size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-[13px]')}>
      {pulse && <span className="h-[7px] w-[7px] animate-cfpulse rounded-full bg-current" />}
      {children}
    </span>
  );
}

/** Small uppercase tag used for "AI", "AFTER HRS", "SAMPLE DATA", attention tags. */
export function Tag({ children, tone = 'outline' }: { children: React.ReactNode; tone?: 'outline' | 'ai' | Tone }) {
  if (tone === 'ai')
    return <span className="rounded-[3px] bg-accent px-1.5 font-mono text-[10px] font-medium tracking-[0.06em] text-on-accent">{children}</span>;
  if (tone === 'outline')
    return <span className="rounded-[3px] border px-1.5 font-mono text-[10px] tracking-[0.06em] text-muted">{children}</span>;
  return <span className={clsx('min-w-[84px] rounded px-2 py-[3px] text-center font-mono text-[10px] font-medium tracking-[0.08em]', TONES[tone])}>{children}</span>;
}

export function SampleTag() {
  return <span className="shrink-0 rounded border px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-muted">SAMPLE DATA</span>;
}
