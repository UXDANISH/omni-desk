'use client';

import clsx from 'clsx';

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx('flex h-[22px] w-[38px] shrink-0 rounded-full p-0.5 transition-colors disabled:opacity-50', checked ? 'justify-end bg-accent' : 'justify-start bg-[#8C97A3]')}
    >
      <span className="h-[18px] w-[18px] rounded-full bg-white shadow" />
    </button>
  );
}
