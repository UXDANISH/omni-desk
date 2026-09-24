'use client';

import clsx from 'clsx';

export function Segmented<T extends string>({ options, value, onChange, label, disabled }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; disabled?: boolean }) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 self-start rounded-lg bg-surface2 p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx('h-[30px] whitespace-nowrap rounded-md px-3 text-[13px]', value === o.value ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({ items, value, onChange, label }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto overflow-y-hidden border-b">
      {items.map((i) => (
        <button
          key={i.value}
          type="button"
          role="tab"
          aria-selected={value === i.value}
          onClick={() => onChange(i.value)}
          className={clsx('-mb-px h-[42px] whitespace-nowrap border-b-2 px-3.5', value === i.value ? 'border-accent font-semibold text-ink' : 'border-transparent text-muted hover:text-ink')}
        >
          {i.label}
        </button>
      ))}
    </div>
  );
}
