import clsx from 'clsx';

export function Card({ children, className, as: As = 'div', ...rest }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' | 'article' } & React.HTMLAttributes<HTMLElement>) {
  return <As className={clsx('cf-card', className)} {...rest}>{children}</As>;
}

export function CardHeader({ title, aside, sub }: { title: React.ReactNode; aside?: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-b px-5 py-4">
      <div className="flex flex-1 flex-col gap-0.5">
        <h2 className="text-base font-semibold">{title}</h2>
        {sub && <p className="text-[13px] text-muted">{sub}</p>}
      </div>
      {aside}
    </div>
  );
}

export function StatTile({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub: React.ReactNode; tone?: 'warn' | 'danger' }) {
  return (
    <div className="flex h-full flex-col gap-1.5 rounded-xl border bg-surface px-[18px] py-4">
      <span className="cf-label">{label}</span>
      <span className={clsx('text-[30px] font-medium tracking-[-0.02em] tabular-nums', tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-ink')}>{value}</span>
      <span className="text-xs text-muted">{sub}</span>
    </div>
  );
}

export function Fact({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border px-3 py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

export function LockedNote({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="flex items-center gap-2.5 rounded-lg bg-surface2 px-3.5 py-3 text-[13px]">
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0"><path d="M5 11h14v9H5zM8 11V8a4 4 0 0 1 8 0v3" /></svg>
      {children}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-muted">{children}</div>;
}
