import Link from 'next/link';
import clsx from 'clsx';

/** URL-driven controls: filters, tabs and segmented toggles are links, so every state has a shareable URL
 *  and works before JavaScript loads. */

export function SegmentedLinks({ items, label, stretch }: { items: { label: string; href: string; active: boolean }[]; label: string; stretch?: boolean }) {
  return (
    <nav aria-label={label} className={clsx('flex gap-0.5 rounded-lg bg-surface2 p-[3px]', stretch && 'w-full md:w-auto')}>
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          scroll={false}
          aria-current={i.active ? 'true' : undefined}
          className={clsx('flex h-[30px] flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 text-[13px] no-underline md:flex-none', i.active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function FilterChips({ items, label }: { items: { label: string; href: string; active: boolean; count?: number }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          scroll={false}
          aria-current={i.active ? 'true' : undefined}
          className={clsx('flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[13px] no-underline', i.active ? 'border-ink bg-ink text-surface hover:text-surface' : 'bg-surface text-ink hover:border-accent hover:text-ink')}
        >
          {i.label}
          {i.count !== undefined && <span className="font-mono text-[11px] opacity-80">{i.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function TabLinks({ items, label }: { items: { label: string; href: string; active: boolean }[]; label: string }) {
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b">
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          scroll={false}
          aria-current={i.active ? 'page' : undefined}
          className={clsx('-mb-px flex h-[42px] items-center whitespace-nowrap border-b-2 px-3.5 no-underline', i.active ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
